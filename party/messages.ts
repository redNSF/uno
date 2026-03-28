/**
 * messages.ts — Shared message type definitions
 * Used by both PartyKit server and client
 */

import { GameState, Card, GameAction } from '../src/game/logic';
import { CardColor } from '../src/utils/constants';

// ---- Client → Server ----

export type ClientMessageType =
  | 'JOIN_ROOM'
  | 'LEAVE_ROOM'
  | 'START_GAME'
  | 'PLAY_CARD'
  | 'DRAW_CARD'
  | 'PASS_TURN'
  | 'PICK_COLOR'
  | 'CALL_UNO'
  | 'CHALLENGE'
  | 'JUMP_IN'
  | 'CHAT_MSG'
  | 'KICK_PLAYER'
  | 'UPDATE_SETTINGS'
  | 'PING';

export interface JoinRoomMsg {
  type: 'JOIN_ROOM';
  playerId: string;
  playerName: string;
  avatar: string;
  reconnect?: boolean;
}

export interface LeaveRoomMsg { type: 'LEAVE_ROOM'; playerId: string; }
export interface StartGameMsg { type: 'START_GAME'; hostId: string; }

export interface PlayCardMsg {
  type: 'PLAY_CARD';
  playerId: string;
  cardId: string;
  chosenColor?: CardColor;
  targetPlayerId?: string;
}

export interface DrawCardMsg { type: 'DRAW_CARD'; playerId: string; }
export interface PassTurnMsg { type: 'PASS_TURN'; playerId: string; }
export interface PickColorMsg { type: 'PICK_COLOR'; playerId: string; color: CardColor; }
export interface CallUnoMsg { type: 'CALL_UNO'; callerId: string; }
export interface ChallengeMsg { type: 'CHALLENGE'; challengerId: string; }
export interface JumpInMsg { type: 'JUMP_IN'; playerId: string; cardId: string; }

export interface ChatMsg {
  type: 'CHAT_MSG';
  playerId: string;
  playerName: string;
  text: string;
}

export interface KickPlayerMsg { type: 'KICK_PLAYER'; hostId: string; targetPlayerId: string; }
export interface PingMsg { type: 'PING'; timestamp: number; }

export type ClientMessage =
  | JoinRoomMsg | LeaveRoomMsg | StartGameMsg | PlayCardMsg | DrawCardMsg
  | PassTurnMsg | PickColorMsg | CallUnoMsg | ChallengeMsg | JumpInMsg
  | ChatMsg | KickPlayerMsg | PingMsg;

// ---- Server → Client ----

export type ServerMessageType =
  | 'ROOM_STATE'
  | 'GAME_STATE'
  | 'YOUR_HAND'
  | 'PLAYER_JOINED'
  | 'PLAYER_LEFT'
  | 'GAME_EVENT'
  | 'CHAT_MSG'
  | 'ERROR'
  | 'PONG';

export interface RoomPlayer {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isConnected: boolean;
  cardCount: number;
  seatIndex: number;
}

export interface RoomStateMsg {
  type: 'ROOM_STATE';
  roomId: string;
  players: RoomPlayer[];
  gameInProgress: boolean;
  hostId: string;
}

export interface GameStateMsg {
  type: 'GAME_STATE';
  state: Omit<GameState, 'deck'> & { deckCount: number };
}

export interface YourHandMsg {
  type: 'YOUR_HAND';
  playerId: string;
  hand: Card[];
}

export interface PlayerJoinedMsg {
  type: 'PLAYER_JOINED';
  player: RoomPlayer;
}

export interface PlayerLeftMsg {
  type: 'PLAYER_LEFT';
  playerId: string;
  playerName: string;
}

export interface GameEventMsg {
  type: 'GAME_EVENT';
  action: GameAction;
  timestamp: number;
}

export interface ChatMsgOut {
  type: 'CHAT_MSG';
  playerId: string;
  playerName: string;
  text: string;
  timestamp: number;
}

export interface ErrorMsg {
  type: 'ERROR';
  code: string;
  message: string;
}

export interface PongMsg {
  type: 'PONG';
  timestamp: number;
  serverTime: number;
}

export type ServerMessage =
  | RoomStateMsg | GameStateMsg | YourHandMsg | PlayerJoinedMsg | PlayerLeftMsg
  | GameEventMsg | ChatMsgOut | ErrorMsg | PongMsg;
