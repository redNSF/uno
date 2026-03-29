// ─── Card Colors ───────────────────────────────────────────────────────────
export const CARD_COLORS = ['red', 'yellow', 'green', 'blue', 'wild'] as const
export type CardColor = typeof CARD_COLORS[number]

export const CARD_VALUES = [
  '0','1','2','3','4','5','6','7','8','9',
  'skip','reverse','draw2','wild','wild4',
] as const
export type CardValue = typeof CARD_VALUES[number]

// ─── Timing Constants ──────────────────────────────────────────────────────
export const TIMING = {
  DEAL_STAGGER_MS: 80,
  AI_THINK_MIN_MS: 600,
  AI_THINK_MAX_MS: 1800,
  UNO_CALL_WINDOW_MS: 2000,
  TURN_TIMEOUT_MS: 15000,
  TOAST_DURATION_MS: 3000,
  CARD_FLIP_MS: 400,
  CARD_ARC_MS: 500,
  SPECIAL_FX_MS: 800,
  WIN_DELAY_MS: 1200,
} as const

// ─── 3D Scene Constants ────────────────────────────────────────────────────
export const SCENE = {
  TABLE_RX: 5.0,
  TABLE_RZ: 3.5,
  CAMERA_FOV: 45,
  CAMERA_Y: 8.5,
  CAMERA_Z: 7.5,
  CARD_WIDTH: 0.7,
  CARD_HEIGHT: 1.0,
  CARD_DEPTH: 0.015,
  DECK_POSITION: [-2.2, 0.4, -1.0] as [number, number, number],
  DISCARD_POSITION: [0.5, 0.4, -0.2] as [number, number, number],
} as const

// ─── Player / Seat Colors ──────────────────────────────────────────────────
export const SEAT_COLORS = [
  '#e05252', // crimson (player 0 = human)
  '#4a9eff', // cobalt
  '#f5d792', // gold
  '#3dd68c', // emerald
  '#c084fc', // violet
  '#f97316', // amber
  '#22d3ee', // cyan
] as const

// ─── Audio Tracks ─────────────────────────────────────────────────────────
export const AUDIO_TRACKS = [
  'card_deal','card_play','card_draw','shuffle',
  'skip','reverse','draw2','wild','wild4',
  'uno_call','jump_in','win','lose',
  'player_join','player_leave','chat_ping',
] as const
export type AudioTrack = typeof AUDIO_TRACKS[number]

// ─── Game Limits ───────────────────────────────────────────────────────────
export const GAME_LIMITS = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 7,
  STARTING_HAND_SIZE: 7,
  MAX_CHAT_MESSAGES: 50,
  ROOM_ID_LENGTH: 6,
  CHAT_MAX_CHARS: 60,
  RECONNECT_WINDOW_MS: 60_000,
  ROOM_TIMEOUT_MS: 30 * 60_000,
} as const

// ─── AI Levels ─────────────────────────────────────────────────────────────
export const AI_LEVELS = ['easy', 'medium', 'hard'] as const
export type AiLevel = typeof AI_LEVELS[number]

// ─── Route Names ───────────────────────────────────────────────────────────
export type Route = 'mainmenu' | 'solo-lobby' | 'party-lobby' | 'game' | 'spectate'
