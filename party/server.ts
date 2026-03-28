/**
 * server.ts — Authoritative PartyKit Edge Server
 * Handles all game state, AI moves, reconnection, chat
 */

import type * as Party from 'partykit/server';
import {
  ClientMessage, ServerMessage,
  RoomPlayer, RoomStateMsg, GameStateMsg, YourHandMsg,
  ChatMsgOut, ErrorMsg, PongMsg
} from './messages';
import {
  GameState, Player, createInitialGameState,
  playCard, drawCardAction, passTurn, callUno,
  challengeWild4, setWildColor, jumpIn,
} from '../src/game/logic';
import { DEFAULT_HOUSE_RULES, HouseRules } from '../src/game/houseRules';
import { computeAIDecision, getAIDelay } from '../src/game/ai';

interface ConnectedPlayer {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  seatIndex: number;
  connectionId: string | null;
  disconnectedAt: number | null;
}

interface RoomStorage {
  players: ConnectedPlayer[];
  gameState: GameState | null;
  hostId: string | null;
  houseRules: HouseRules;
  chatLog: Array<{ playerId: string; playerName: string; text: string; timestamp: number }>;
  lastActivity: number;
}

const RECONNECT_WINDOW_MS = 60_000; // 60 seconds
const ROOM_TIMEOUT_MS = 30 * 60_000; // 30 minutes
const CHAT_LOG_MAX = 50;

export default class UnoServer implements Party.Server {
  options: Party.ServerOptions = { hibernate: true };

  private room: RoomStorage = {
    players: [],
    gameState: null,
    hostId: null,
    houseRules: { ...DEFAULT_HOUSE_RULES },
    chatLog: [],
    lastActivity: Date.now(),
  };

  constructor(readonly party: Party.Room) {}

  async onConnect(conn: Party.Connection) {
    this.room.lastActivity = Date.now();

    // Send current room state to new connection
    this.sendTo(conn, this.buildRoomStateMsg());
    if (this.room.gameState) {
      this.sendTo(conn, this.buildGameStateMsg());
    }
  }

  async onMessage(message: string, sender: Party.Connection) {
    this.room.lastActivity = Date.now();

    let msg: ClientMessage;
    try {
      msg = JSON.parse(message) as ClientMessage;
    } catch {
      return;
    }

    switch (msg.type) {
      case 'PING':
        this.sendTo(sender, { type: 'PONG', timestamp: msg.timestamp, serverTime: Date.now() } as PongMsg);
        break;

      case 'JOIN_ROOM':
        this.handleJoin(msg.playerId, msg.playerName, msg.avatar, sender, msg.reconnect);
        break;

      case 'LEAVE_ROOM':
        this.handleLeave(msg.playerId);
        break;

      case 'START_GAME':
        this.handleStartGame(msg.hostId, sender);
        break;

      case 'PLAY_CARD':
        this.handlePlayCard(msg.playerId, msg.cardId, msg.chosenColor, msg.targetPlayerId, sender);
        break;

      case 'DRAW_CARD':
        this.handleDrawCard(msg.playerId, sender);
        break;

      case 'PASS_TURN':
        this.handlePass(msg.playerId);
        break;

      case 'PICK_COLOR':
        this.handlePickColor(msg.playerId, msg.color, sender);
        break;

      case 'CALL_UNO':
        this.handleCallUno(msg.callerId);
        break;

      case 'CHALLENGE':
        this.handleChallenge(msg.challengerId, sender);
        break;

      case 'JUMP_IN':
        this.handleJumpIn(msg.playerId, msg.cardId, sender);
        break;

      case 'CHAT_MSG':
        this.handleChat(msg.playerId, msg.playerName, msg.text);
        break;

      case 'KICK_PLAYER':
        this.handleKick(msg.hostId, msg.targetPlayerId, sender);
        break;
    }
  }

  async onClose(conn: Party.Connection) {
    const player = this.room.players.find((p) => p.connectionId === conn.id);
    if (player) {
      player.connectionId = null;
      player.disconnectedAt = Date.now();
      this.broadcastRoomState();
    }
  }

  // ---- Handlers ----

  private handleJoin(playerId: string, name: string, avatar: string, conn: Party.Connection, reconnect = false) {
    let player = this.room.players.find((p) => p.id === playerId);

    if (player) {
      // Reconnect
      player.connectionId = conn.id;
      player.disconnectedAt = null;
      this.sendTo(conn, this.buildRoomStateMsg());
      if (this.room.gameState) {
        this.sendTo(conn, this.buildGameStateMsg());
        // Send private hand
        const hand = this.room.gameState.players.find((p) => p.id === playerId)?.hand ?? [];
        this.sendTo(conn, { type: 'YOUR_HAND', playerId, hand } as YourHandMsg);
      }
    } else {
      if (this.room.gameState) {
        // Game in progress — can't join
        this.sendTo(conn, { type: 'ERROR', code: 'GAME_IN_PROGRESS', message: 'Game already in progress' } as ErrorMsg);
        return;
      }

      const isFirstPlayer = this.room.players.length === 0;
      const seatIndex = this.room.players.length;
      player = { id: playerId, name, avatar, isHost: isFirstPlayer, seatIndex, connectionId: conn.id, disconnectedAt: null };
      this.room.players.push(player);
      if (isFirstPlayer) this.room.hostId = playerId;

      this.broadcastRoomState();
    }
  }

  private handleLeave(playerId: string) {
    this.room.players = this.room.players.filter((p) => p.id !== playerId);
    if (this.room.hostId === playerId && this.room.players.length > 0) {
      this.room.hostId = this.room.players[0].id;
      this.room.players[0].isHost = true;
    }
    this.broadcastRoomState();
  }

  private handleStartGame(hostId: string, conn: Party.Connection) {
    if (hostId !== this.room.hostId) {
      this.sendTo(conn, { type: 'ERROR', code: 'NOT_HOST', message: 'Only the host can start' } as ErrorMsg);
      return;
    }
    if (this.room.players.length < 2) {
      this.sendTo(conn, { type: 'ERROR', code: 'NOT_ENOUGH_PLAYERS', message: 'Need at least 2 players' } as ErrorMsg);
      return;
    }

    const connectedPlayers = this.room.players.filter((p) => p.connectionId !== null);
    const playerDefs = connectedPlayers.map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      isBot: false,
      seatIndex: p.seatIndex,
      isConnected: true,
      signatureColor: '#D4AF37',
    }));

    this.room.gameState = createInitialGameState(playerDefs, this.room.houseRules);
    this.broadcastGameState();

    // Send each player their private hand
    for (const cp of connectedPlayers) {
      const conn = this.party.getConnection(cp.connectionId!);
      if (conn) {
        const hand = this.room.gameState.players.find((p) => p.id === cp.id)?.hand ?? [];
        this.sendTo(conn, { type: 'YOUR_HAND', playerId: cp.id, hand } as YourHandMsg);
      }
    }
  }

  private handlePlayCard(playerId: string, cardId: string, chosenColor: any, targetPlayerId: any, conn: Party.Connection) {
    if (!this.room.gameState) return;
    try {
      const { newState, action, requiresColorPick } = playCard(this.room.gameState, playerId, cardId, chosenColor, targetPlayerId);
      this.room.gameState = newState;
      this.broadcastGameState();
      this.broadcastEvent(action);
      if (!requiresColorPick) this.sendPrivateHands();
    } catch (e: any) {
      this.sendTo(conn, { type: 'ERROR', code: 'INVALID_PLAY', message: e.message } as ErrorMsg);
    }
  }

  private handleDrawCard(playerId: string, conn: Party.Connection) {
    if (!this.room.gameState) return;
    try {
      const newState = drawCardAction(this.room.gameState, playerId);
      this.room.gameState = newState;
      this.broadcastGameState();
      this.sendPrivateHands();
    } catch (e: any) {
      this.sendTo(conn, { type: 'ERROR', code: 'DRAW_ERROR', message: e.message } as ErrorMsg);
    }
  }

  private handlePass(playerId: string) {
    if (!this.room.gameState) return;
    this.room.gameState = passTurn(this.room.gameState);
    this.broadcastGameState();
  }

  private handlePickColor(playerId: string, color: any, conn: Party.Connection) {
    if (!this.room.gameState) return;
    try {
      const newState = setWildColor(this.room.gameState, playerId, color);
      this.room.gameState = newState;
      this.broadcastGameState();
      this.sendPrivateHands();
    } catch (e: any) {
      this.sendTo(conn, { type: 'ERROR', code: 'COLOR_PICK_ERROR', message: e.message } as ErrorMsg);
    }
  }

  private handleCallUno(callerId: string) {
    if (!this.room.gameState) return;
    this.room.gameState = callUno(this.room.gameState, callerId);
    this.broadcastGameState();
  }

  private handleChallenge(challengerId: string, conn: Party.Connection) {
    if (!this.room.gameState) return;
    try {
      const newState = challengeWild4(this.room.gameState, challengerId);
      this.room.gameState = newState;
      this.broadcastGameState();
      this.sendPrivateHands();
    } catch (e: any) {
      this.sendTo(conn, { type: 'ERROR', code: 'CHALLENGE_ERROR', message: e.message } as ErrorMsg);
    }
  }

  private handleJumpIn(playerId: string, cardId: string, conn: Party.Connection) {
    if (!this.room.gameState) return;
    try {
      const { newState, action } = jumpIn(this.room.gameState, playerId, cardId);
      this.room.gameState = newState;
      this.broadcastGameState();
      this.broadcastEvent(action);
      this.sendPrivateHands();
    } catch (e: any) {
      this.sendTo(conn, { type: 'ERROR', code: 'JUMP_IN_ERROR', message: e.message } as ErrorMsg);
    }
  }

  private handleChat(playerId: string, playerName: string, text: string) {
    const entry = { playerId, playerName, text: text.slice(0, 60), timestamp: Date.now() };
    this.room.chatLog.push(entry);
    if (this.room.chatLog.length > CHAT_LOG_MAX) this.room.chatLog.shift();
    this.party.broadcast(JSON.stringify({ type: 'CHAT_MSG', ...entry } as ChatMsgOut));
  }

  private handleKick(hostId: string, targetPlayerId: string, conn: Party.Connection) {
    if (hostId !== this.room.hostId) {
      this.sendTo(conn, { type: 'ERROR', code: 'NOT_HOST', message: 'Only host can kick' } as ErrorMsg);
      return;
    }
    this.handleLeave(targetPlayerId);
  }

  // ---- Broadcast helpers ----

  private sendTo(conn: Party.Connection, msg: ServerMessage) {
    conn.send(JSON.stringify(msg));
  }

  private broadcastRoomState() {
    this.party.broadcast(JSON.stringify(this.buildRoomStateMsg()));
  }

  private broadcastGameState() {
    this.party.broadcast(JSON.stringify(this.buildGameStateMsg()));
  }

  private broadcastEvent(action: any) {
    this.party.broadcast(JSON.stringify({ type: 'GAME_EVENT', action, timestamp: Date.now() }));
  }

  private sendPrivateHands() {
    if (!this.room.gameState) return;
    for (const cp of this.room.players) {
      if (!cp.connectionId) continue;
      const conn = this.party.getConnection(cp.connectionId);
      if (!conn) continue;
      const hand = this.room.gameState.players.find((p) => p.id === cp.id)?.hand ?? [];
      this.sendTo(conn, { type: 'YOUR_HAND', playerId: cp.id, hand } as YourHandMsg);
    }
  }

  // ---- Builders ----

  private buildRoomStateMsg(): RoomStateMsg {
    return {
      type: 'ROOM_STATE',
      roomId: this.party.id,
      hostId: this.room.hostId ?? '',
      gameInProgress: !!this.room.gameState,
      players: this.room.players.map((p) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        isHost: p.isHost,
        isConnected: p.connectionId !== null,
        cardCount: this.room.gameState?.players.find((gp) => gp.id === p.id)?.hand.length ?? 0,
        seatIndex: p.seatIndex,
      })),
    };
  }

  private buildGameStateMsg(): GameStateMsg {
    const gs = this.room.gameState!;
    const { deck, ...rest } = gs;
    return {
      type: 'GAME_STATE',
      state: { ...rest, deckCount: deck.length },
    };
  }
}
