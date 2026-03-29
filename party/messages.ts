import type { CardColor } from '../utils/constants'
import type { Card, GameState } from '../game/logic'

// ─── Client → Server Messages ──────────────────────────────────────────────
export type ClientMessage =
  | { type: 'JOIN_ROOM'; playerId: string; name: string; avatar: string }
  | { type: 'LEAVE_ROOM'; playerId: string }
  | { type: 'START_GAME'; hostId: string }
  | { type: 'PLAY_CARD'; playerId: string; cardId: string; pickedColor?: CardColor }
  | { type: 'DRAW_CARD'; playerId: string }
  | { type: 'PICK_COLOR'; playerId: string; color: CardColor }
  | { type: 'CALL_UNO'; playerId: string }
  | { type: 'JUMP_IN'; playerId: string; cardId: string }
  | { type: 'CHALLENGE_WILD4'; playerId: string }
  | { type: 'KICK_PLAYER'; hostId: string; targetId: string }
  | { type: 'CHAT_MSG'; playerId: string; text: string }
  | { type: 'SET_HOUSE_RULES'; hostId: string; rules: Record<string, unknown> }

// ─── Server → Client Messages ──────────────────────────────────────────────
export type ServerMessage =
  | { type: 'ROOM_STATE'; room: RoomState }
  | { type: 'GAME_STATE'; game: GameState; yourHand: Card[] }
  | { type: 'YOUR_HAND'; hand: Card[] }
  | { type: 'PLAYER_JOINED'; player: { id: string; name: string; avatar: string; seatIndex: number } }
  | { type: 'PLAYER_LEFT'; playerId: string }
  | { type: 'PLAYER_RECONNECTED'; playerId: string }
  | { type: 'GAME_EVENT'; event: unknown }
  | { type: 'CHAT_MSG'; playerId: string; playerName: string; text: string; ts: number }
  | { type: 'ERROR'; code: string; message: string }
  | { type: 'PING'; ts: number }

// ─── Room State ────────────────────────────────────────────────────────────
export interface RoomPlayer {
  id: string
  name: string
  avatar: string
  seatIndex: number
  isConnected: boolean
  isHost: boolean
  score: number
}

export interface RoomState {
  roomId: string
  players: RoomPlayer[]
  maxPlayers: number
  phase: 'lobby' | 'in-game' | 'post-game'
  houseRules: Record<string, unknown>
  createdAt: number
}
