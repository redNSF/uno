/**
 * store.ts — Zustand Global Store
 * Slices: game, party, ui, anim
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  GameState,
  Player,
  Card,
  createInitialGameState,
  playCard,
  drawCardAction,
  passTurn,
  callUno,
  challengeWild4,
  setWildColor,
  jumpIn,
  GameAction,
} from './logic';
import { HouseRules, DEFAULT_HOUSE_RULES } from './houseRules';
import { CardColor } from '@utils/constants';
import { computeAIDecision, getAIDelay } from './ai';

// ---- Types ----

export type Screen = 'main-menu' | 'solo-lobby' | 'party-lobby' | 'game' | 'spectator';

export type ToastType = 'info' | 'success' | 'warning' | 'error' | 'uno' | 'skip' | 'reverse' | 'draw' | 'wild';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

export interface RoomInfo {
  roomId: string;
  playerId: string;
  playerName: string;
  isHost: boolean;
  isConnected: boolean;
  latency: number;
}

export interface AnimEvent {
  id: string;
  type: 'deal' | 'play' | 'draw' | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4' | 'jump-in' | 'win' | 'seven' | 'zero';
  fromSeatIndex?: number;
  toSeatIndex?: number;
  card?: Card;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  timestamp: number;
  reaction?: string;
}

// ---- Lobby Player Config ----

export interface LobbyPlayerConfig {
  seatIndex: number;
  type: 'human' | 'bot-easy' | 'bot-medium' | 'bot-hard' | 'empty';
  name: string;
  avatar: string;
}

// ---- Store State ----

export interface UnoStore {
  // Navigation
  screen: Screen;
  setScreen: (s: Screen) => void;

  // Lobby
  lobbyPlayers: LobbyPlayerConfig[];
  houseRules: HouseRules;
  setLobbyPlayer: (idx: number, config: Partial<LobbyPlayerConfig>) => void;
  setLobbyPlayerCount: (count: number) => void;
  setHouseRule: <K extends keyof HouseRules>(key: K, value: HouseRules[K]) => void;

  // Game state
  game: GameState | null;
  myPlayerId: string | null;
  animQueue: AnimEvent[];
  isAnimating: boolean;

  // Game actions
  startGame: () => void;
  handlePlayCard: (cardId: string, chosenColor?: CardColor, targetPlayerId?: string) => void;
  handleDrawCard: () => void;
  handlePass: () => void;
  handleCallUno: () => void;
  handleChallenge: () => void;
  handleSetWildColor: (color: CardColor) => void;
  handleJumpIn: (cardId: string) => void;
  triggerAITurn: () => void;

  // Anim
  pushAnimEvent: (evt: Omit<AnimEvent, 'id' | 'timestamp'>) => void;
  shiftAnimEvent: () => void;
  setIsAnimating: (v: boolean) => void;

  // UI
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  dismissToast: (id: string) => void;

  // Party / Chat
  roomInfo: RoomInfo | null;
  chatMessages: ChatMessage[];
  setRoomInfo: (info: RoomInfo | null) => void;
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  sendChatMessage: (text: string) => void;

  // Color picker overlay
  pendingWildColor: boolean;
  setPendingWildColor: (v: boolean) => void;

  // Turn timer
  turnTimeLeft: number;
  setTurnTimeLeft: (v: number) => void;
}

// ---- Default Lobby Config ----

const DEFAULT_LOBBY_PLAYERS: LobbyPlayerConfig[] = [
  { seatIndex: 0, type: 'human', name: 'You', avatar: '🎮' },
  { seatIndex: 1, type: 'bot-medium', name: 'Alex', avatar: '🤖' },
  { seatIndex: 2, type: 'bot-hard', name: 'Nova', avatar: '🔥' },
  { seatIndex: 3, type: 'empty', name: '', avatar: '' },
  { seatIndex: 4, type: 'empty', name: '', avatar: '' },
  { seatIndex: 5, type: 'empty', name: '', avatar: '' },
  { seatIndex: 6, type: 'empty', name: '', avatar: '' },
];

let toastCounter = 0;
let animCounter = 0;

// ---- Store ----

export const useUnoStore = create<UnoStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // Navigation
      screen: 'main-menu',
      setScreen: (s) => set({ screen: s }),

      // Lobby
      lobbyPlayers: [...DEFAULT_LOBBY_PLAYERS],
      houseRules: { ...DEFAULT_HOUSE_RULES },

      setLobbyPlayer: (idx, config) =>
        set((state) => {
          Object.assign(state.lobbyPlayers[idx], config);
        }),

      setLobbyPlayerCount: (count) =>
        set((state) => {
          for (let i = 0; i < 7; i++) {
            if (i >= count) {
              state.lobbyPlayers[i].type = 'empty';
              state.lobbyPlayers[i].name = '';
            } else if (i > 0 && state.lobbyPlayers[i].type === 'empty') {
              state.lobbyPlayers[i].type = 'bot-medium';
              state.lobbyPlayers[i].name = `Bot ${i}`;
              state.lobbyPlayers[i].avatar = '🤖';
            }
          }
        }),

      setHouseRule: (key, value) =>
        set((state) => {
          (state.houseRules as any)[key] = value;
        }),

      // Game state
      game: null,
      myPlayerId: null,
      animQueue: [],
      isAnimating: false,

      startGame: () => {
        const { lobbyPlayers, houseRules } = get();
        const activePlayers = lobbyPlayers.filter((p) => p.type !== 'empty');

        const playerDefs = activePlayers.map((lp, i) => ({
          id: lp.type === 'human' ? 'human-0' : `bot-${i}`,
          name: lp.name || (lp.type === 'human' ? 'Player' : `Bot ${i}`),
          avatar: lp.avatar,
          isBot: lp.type !== 'human',
          difficulty: lp.type === 'bot-easy' ? 'easy' as const
            : lp.type === 'bot-hard' ? 'hard' as const
            : 'medium' as const,
          seatIndex: lp.seatIndex,
          isConnected: true,
          signatureColor: PLAYER_COLORS[i % PLAYER_COLORS.length],
        }));

        const humanPlayer = playerDefs.find((p) => !p.isBot);
        const gameState = createInitialGameState(playerDefs, houseRules);

        set({
          game: gameState,
          myPlayerId: humanPlayer?.id ?? null,
          screen: 'game',
          animQueue: [],
          pendingWildColor: false,
        });

        // Push deal animation event
        get().pushAnimEvent({ type: 'deal' });

        // If first player is AI, trigger their turn after a delay
        const firstPlayer = gameState.players[gameState.currentPlayerIndex];
        if (firstPlayer.isBot) {
          setTimeout(() => get().triggerAITurn(), 1500);
        }
      },

      handlePlayCard: (cardId, chosenColor, targetPlayerId) => {
        const { game, myPlayerId } = get();
        if (!game || !myPlayerId) return;
        try {
          const { newState, action, requiresColorPick } = playCard(game, myPlayerId, cardId, chosenColor, targetPlayerId);
          set({ game: newState });

          // Push animation
          get().pushAnimEvent({
            type: action.type === 'wild4' ? 'wild4' : action.type === 'wild' ? 'wild' : 'play',
            card: action.card,
            fromSeatIndex: game.players.find((p) => p.id === myPlayerId)?.seatIndex,
          });

          // Show color picker if wild
          if (requiresColorPick) {
            set({ pendingWildColor: true });
            return;
          }

          // Toast for action cards
          toastForAction(action, get);

          // Check if game ended
          if (newState.phase === 'game-end') return;

          // Trigger next AI turn
          const currentPlayer = newState.players[newState.currentPlayerIndex];
          if (currentPlayer.isBot) {
            setTimeout(() => get().triggerAITurn(), getAIDelay(currentPlayer.difficulty ?? 'medium'));
          }
        } catch (e: any) {
          get().showToast(e.message, 'error');
        }
      },

      handleDrawCard: () => {
        const { game, myPlayerId } = get();
        if (!game || !myPlayerId) return;
        try {
          const newState = drawCardAction(game, myPlayerId);
          set({ game: newState });
          get().pushAnimEvent({ type: 'draw', toSeatIndex: game.players.find((p) => p.id === myPlayerId)?.seatIndex });

          const currentPlayer = newState.players[newState.currentPlayerIndex];
          if (currentPlayer.isBot) {
            setTimeout(() => get().triggerAITurn(), getAIDelay(currentPlayer.difficulty ?? 'medium'));
          }
        } catch (e: any) {
          get().showToast(e.message, 'error');
        }
      },

      handlePass: () => {
        const { game } = get();
        if (!game) return;
        const newState = passTurn(game);
        set({ game: newState });
        const currentPlayer = newState.players[newState.currentPlayerIndex];
        if (currentPlayer.isBot) {
          setTimeout(() => get().triggerAITurn(), getAIDelay(currentPlayer.difficulty ?? 'medium'));
        }
      },

      handleCallUno: () => {
        const { game, myPlayerId } = get();
        if (!game || !myPlayerId) return;
        const newState = callUno(game, myPlayerId);
        set({ game: newState });
        get().showToast('UNO!', 'uno', 2000);
      },

      handleChallenge: () => {
        const { game, myPlayerId } = get();
        if (!game || !myPlayerId) return;
        const newState = challengeWild4(game, myPlayerId);
        set({ game: newState });
        const action = newState.lastAction;
        if (action?.challengeSuccess) {
          get().showToast('Challenge SUCCESS! They draw 4!', 'success');
        } else {
          get().showToast('Challenge failed — you draw 6!', 'error');
        }
      },

      handleSetWildColor: (color) => {
        const { game, myPlayerId } = get();
        if (!game || !myPlayerId) return;
        const newState = setWildColor(game, myPlayerId, color);
        set({ game: newState, pendingWildColor: false });

        get().pushAnimEvent({ type: 'wild' });
        get().showToast(`Color set to ${color.toUpperCase()}`, 'wild', 1500);

        const currentPlayer = newState.players[newState.currentPlayerIndex];
        if (currentPlayer.isBot) {
          setTimeout(() => get().triggerAITurn(), getAIDelay(currentPlayer.difficulty ?? 'medium'));
        }
      },

      handleJumpIn: (cardId) => {
        const { game, myPlayerId } = get();
        if (!game || !myPlayerId) return;
        try {
          const { newState, action } = jumpIn(game, myPlayerId, cardId);
          set({ game: newState });
          get().pushAnimEvent({ type: 'jump-in', card: action.card });
          get().showToast('JUMP IN!', 'success', 2000);

          if (newState.phase === 'game-end') return;
          const currentPlayer = newState.players[newState.currentPlayerIndex];
          if (currentPlayer.isBot) {
            setTimeout(() => get().triggerAITurn(), getAIDelay(currentPlayer.difficulty ?? 'medium'));
          }
        } catch (e: any) {
          get().showToast(e.message, 'error');
        }
      },

      triggerAITurn: () => {
        const { game } = get();
        if (!game || game.phase === 'game-end') return;
        if (game.phase === 'color-pick') return; // handled separately

        const currentPlayer = game.players[game.currentPlayerIndex];
        if (!currentPlayer.isBot) return;

        const decision = computeAIDecision(game, currentPlayer.id);
        const delay = getAIDelay(currentPlayer.difficulty ?? 'medium');

        setTimeout(() => {
          const freshGame = get().game;
          if (!freshGame) return;

          if (decision.type === 'draw') {
            const newState = drawCardAction(freshGame, currentPlayer.id);
            set({ game: newState });
            get().pushAnimEvent({ type: 'draw', toSeatIndex: currentPlayer.seatIndex });

            const next = newState.players[newState.currentPlayerIndex];
            if (next.isBot) {
              setTimeout(() => get().triggerAITurn(), getAIDelay(next.difficulty ?? 'medium'));
            }
          } else if (decision.type === 'play' && decision.cardId) {
            try {
              const { newState, action, requiresColorPick } = playCard(
                freshGame,
                currentPlayer.id,
                decision.cardId,
                decision.chosenColor,
                decision.targetPlayerId
              );
              set({ game: newState });
              get().pushAnimEvent({
                type: action.type === 'wild4' ? 'wild4' : action.type === 'wild' ? 'wild' : 'play',
                card: action.card,
                fromSeatIndex: currentPlayer.seatIndex,
              });

              toastForAction(action, get);

              // AI auto-picks color if needed
              if (requiresColorPick && decision.chosenColor) {
                const afterColor = setWildColor(newState, currentPlayer.id, decision.chosenColor);
                set({ game: afterColor });
              }

              if (newState.phase === 'game-end') return;

              const next = newState.players[newState.currentPlayerIndex];
              if (next.isBot) {
                setTimeout(() => get().triggerAITurn(), getAIDelay(next.difficulty ?? 'medium'));
              }
            } catch (e) {
              // AI error — just draw
              const ns = drawCardAction(freshGame, currentPlayer.id);
              set({ game: ns });
              const next = ns.players[ns.currentPlayerIndex];
              if (next.isBot) {
                setTimeout(() => get().triggerAITurn(), getAIDelay(next.difficulty ?? 'medium'));
              }
            }
          }
        }, delay);
      },

      // Anim
      pushAnimEvent: (evt) =>
        set((state) => {
          state.animQueue.push({ ...evt, id: `anim-${animCounter++}`, timestamp: Date.now() });
        }),

      shiftAnimEvent: () =>
        set((state) => {
          state.animQueue.shift();
        }),

      setIsAnimating: (v) => set({ isAnimating: v }),

      // UI / Toasts
      toasts: [],
      showToast: (message, type = 'info', duration = 3000) => {
        const id = `toast-${toastCounter++}`;
        set((state) => {
          (state as any).toasts.push({ id, message, type, duration });
        });
        setTimeout(() => get().dismissToast(id), duration);
      },
      dismissToast: (id) =>
        set((state) => {
          (state as any).toasts = (state as any).toasts.filter((t: Toast) => t.id !== id);
        }),

      // Party
      roomInfo: null,
      chatMessages: [],
      setRoomInfo: (info) => set({ roomInfo: info }),
      addChatMessage: (msg) =>
        set((state) => {
          (state as any).chatMessages.push({ ...msg, id: `chat-${Date.now()}`, timestamp: Date.now() });
          // Keep last 50
          if ((state as any).chatMessages.length > 50) (state as any).chatMessages.shift();
        }),
      sendChatMessage: (text) => {
        const { roomInfo } = get();
        if (!roomInfo) return;
        get().addChatMessage({
          playerId: roomInfo.playerId,
          playerName: roomInfo.playerName,
          text,
        });
      },

      // Color picker
      pendingWildColor: false,
      setPendingWildColor: (v) => set({ pendingWildColor: v }),

      // Turn timer
      turnTimeLeft: 15,
      setTurnTimeLeft: (v) => set({ turnTimeLeft: v }),
    }))
  )
);

// ---- Helper: Toast on game events ----
function toastForAction(action: GameAction, get: () => UnoStore) {
  switch (action.type) {
    case 'skip-forced': get().showToast('Skipped!', 'skip', 1500); break;
    case 'reverse': get().showToast('Direction reversed!', 'reverse', 1500); break;
    case 'draw2': get().showToast('+2 cards!', 'draw', 2000); break;
    case 'wild4': get().showToast('Wild +4!', 'wild', 2000); break;
    case 'wild': get().showToast('Wild card!', 'wild', 1500); break;
    case 'jump-in': get().showToast('JUMP IN!', 'success', 2000); break;
    case 'seven-swap': get().showToast('Hands swapped!', 'info', 2000); break;
    case 'zero-rotate': get().showToast('Hands rotated!', 'info', 2000); break;
    default: break;
  }
}

const PLAYER_COLORS = [
  '#DC143C', '#0047AB', '#FFBF00', '#50C878',
  '#8B00FF', '#FF007F', '#00FFFF',
];
