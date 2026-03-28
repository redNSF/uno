// ============================================
// UNO CINEMATIC — Game Constants
// ============================================

export const CARD_COLORS = ['red', 'blue', 'green', 'yellow'] as const;
export type CardColor = typeof CARD_COLORS[number];

export const WILD_COLORS = ['red', 'blue', 'green', 'yellow'] as const;

export const CARD_VALUES = [
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  'skip', 'reverse', 'draw2', 'wild', 'wild4',
] as const;
export type CardValue = typeof CARD_VALUES[number];

export type CardType = 'number' | 'action' | 'wild';

// Deck composition per official UNO rules (108 cards)
// 19 red (0-9 + 9 skip/rev/draw2 pairs) × 4 colors + 4 wilds + 4 wild4
export const DECK_COMPOSITION = {
  numbers: { counts: { '0': 1, '1': 2, '2': 2, '3': 2, '4': 2, '5': 2, '6': 2, '7': 2, '8': 2, '9': 2 } },
  actions: { values: ['skip', 'reverse', 'draw2'] as const, count: 2 },
  wilds: { values: ['wild', 'wild4'] as const, count: 4 },
};

// Per-player seat colors (signature palette)
export const PLAYER_SEAT_COLORS = [
  '#DC143C', // crimson
  '#0047AB', // cobalt
  '#FFBF00', // amber
  '#50C878', // emerald
  '#8B00FF', // violet
  '#FF007F', // rose
  '#00CED1', // teal/cyan
] as const;

export const PLAYER_AVATARS = ['🦊', '🐺', '🦁', '🐯', '🦅', '🐉', '👑', '💀'];

export const AI_DIFFICULTY = ['easy', 'medium', 'hard'] as const;
export type AIDifficulty = typeof AI_DIFFICULTY[number];

export const PLAYER_TYPE = ['human', 'bot'] as const;
export type PlayerType = typeof PLAYER_TYPE[number];

// Timing constants (ms)
export const TIMING = {
  DEAL_STAGGER: 80,          // ms between each deal arc
  DEAL_DURATION: 450,        // ms per card deal arc
  PLAY_LIFT: 200,            // ms to lift card
  PLAY_ARC: 400,             // ms arc to discard
  PLAY_SPIN: 200,            // ms spin at discard
  DRAW_SNAP: 150,            // ms snap from deck
  DRAW_ARC: 350,             // ms arc to hand
  FLIP_DURATION: 300,        // ms card face flip
  SPECIAL_FX: 600,           // ms special effect duration
  AI_DELAY_EASY: 1200,       // ms AI turn delay
  AI_DELAY_MEDIUM: 900,
  AI_DELAY_HARD: 600,
  UNO_CALL_WINDOW: 2000,     // ms UNO call window
  TURN_TIMER: 15000,         // ms per turn
  CAMERA_SHAKE: 300,         // ms camera shake
  CAMERA_DOLLY: 600,         // ms camera dolly
  RECONNECT_WINDOW: 60000,   // ms before slot becomes bot
  ROOM_INACTIVITY: 1800000,  // 30 min
};

// 3D scene constants
export const SCENE = {
  TABLE_BASE_RADIUS_X: 3.8,
  TABLE_BASE_RADIUS_Z: 2.4,
  TABLE_SCALE_PER_PLAYER: 0.08,  // additional radius per player
  CARD_WIDTH: 0.9,
  CARD_HEIGHT: 1.35,
  CARD_DEPTH: 0.02,
  CARD_TEXTURE_W: 512,
  CARD_TEXTURE_H: 768,
  DECK_POSITION: [1.8, 0.05, 0] as [number, number, number],
  DISCARD_POSITION: [0, 0.05, 0] as [number, number, number],
  CAMERA_FOV: 45,
  CAMERA_TILT: 55,  // degrees downward
  CAMERA_BASE_DIST: 7.5,
  CAMERA_HEIGHT: 5.5,
  HAND_RADIUS: 4.2,
  HAND_FAN_ANGLE: 70,  // total degrees for full hand fan
  DRAW_PILE_OFFSET: 1.8,
  SEAT_RING_RADIUS: 3.2,
};

// House rule defaults
export const DEFAULT_HOUSE_RULES = {
  stackDrawCards: false,
  jumpIn: false,
  sevenZero: false,
  noMercyWild4: false,
  challengeWild4: false,
  progressiveUno: false,
};

export type HouseRules = typeof DEFAULT_HOUSE_RULES;

// Game phases
export const GAME_PHASE = [
  'idle', 'dealing', 'playing', 'color-pick', 'uno-window',
  'round-end', 'game-end',
] as const;
export type GamePhase = typeof GAME_PHASE[number];

// Direction
export type Direction = 1 | -1;

// Card suits for wild color selection
export const COLOR_DISPLAY: Record<string, { label: string; hex: string; glow: string }> = {
  red:    { label: 'Red',    hex: '#E53E3E', glow: 'rgba(229,62,62,0.8)'   },
  blue:   { label: 'Blue',   hex: '#3182CE', glow: 'rgba(49,130,206,0.8)'  },
  green:  { label: 'Green',  hex: '#38A169', glow: 'rgba(56,161,105,0.8)'  },
  yellow: { label: 'Yellow', hex: '#ECC94B', glow: 'rgba(236,201,75,0.8)'  },
};

// Max players
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 7;
export const CARDS_PER_HAND = 7;

// Chat
export const MAX_CHAT_MESSAGES = 50;
export const MAX_CHAT_VISIBLE = 8;
export const MAX_CHAT_LENGTH = 60;

export const EMOJI_REACTIONS = ['🔥', '😂', '😤', '👏', '🤯', '💀'];

// Room
export const ROOM_CODE_LENGTH = 6;

// Connection status
export const CONNECTION_STATUS = ['connecting', 'connected', 'disconnected', 'reconnecting'] as const;
export type ConnectionStatus = typeof CONNECTION_STATUS[number];
