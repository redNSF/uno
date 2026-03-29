import type { CardColor, CardValue } from '../utils/constants'
import { GAME_LIMITS } from '../utils/constants'

// ─── Types ─────────────────────────────────────────────────────────────────
export interface Card {
  id: string
  color: CardColor
  value: CardValue
}

export interface Player {
  id: string
  name: string
  isHuman: boolean
  aiLevel?: 'easy' | 'medium' | 'hard'
  hand: Card[]
  seatIndex: number
  score: number
  calledUno: boolean
  isConnected: boolean
  avatar: string
}

export type GamePhase =
  | 'idle'
  | 'dealing'
  | 'playing'
  | 'awaiting-color'
  | 'round-end'
  | 'game-end'

export interface GameState {
  deck: Card[]
  discardPile: Card[]
  players: Player[]
  currentPlayerIndex: number
  direction: 1 | -1        // 1 = clockwise, -1 = counter-clockwise
  drawStack: number        // accumulated draw2/wild4 stack
  phase: GamePhase
  activeColor: CardColor   // current forced color (may differ from top card)
  turnStartedAt: number    // timestamp for turn timer
  wildPending: boolean     // waiting for color selection
}

// ─── Deck Generation ───────────────────────────────────────────────────────
let _cardIdCounter = 0
function makeCard(color: CardColor, value: CardValue): Card {
  return { id: `card-${++_cardIdCounter}`, color, value }
}

export function generateDeck(): Card[] {
  const deck: Card[] = []
  const colors: CardColor[] = ['red', 'yellow', 'green', 'blue']
  const numbered: CardValue[] = ['1','2','3','4','5','6','7','8','9']
  const actions: CardValue[] = ['skip','reverse','draw2']

  for (const color of colors) {
    // one 0
    deck.push(makeCard(color, '0'))
    // two of each 1-9 and action
    for (const v of [...numbered, ...actions]) {
      deck.push(makeCard(color, v))
      deck.push(makeCard(color, v))
    }
  }
  // 4 wilds + 4 wild+4
  for (let i = 0; i < 4; i++) {
    deck.push(makeCard('wild', 'wild'))
    deck.push(makeCard('wild', 'wild4'))
  }
  return deck
}

// ─── Fisher-Yates Shuffle ─────────────────────────────────────────────────
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── Card Validation ──────────────────────────────────────────────────────
export function canPlay(card: Card, topCard: Card, activeColor: CardColor, drawStack: number): boolean {
  // During a draw stack, only matching draw cards can be played (if stacking enabled via house rules)
  if (drawStack > 0) return false  // base rule: cannot play on draw stack
  if (card.value === 'wild' || card.value === 'wild4') return true
  if (card.color === activeColor) return true
  if (card.value === topCard.value) return true
  return false
}

export function canPlayWithStacking(card: Card, topCard: Card, activeColor: CardColor, drawStack: number): boolean {
  if (drawStack > 0) {
    // Stacking: can play draw2 on draw2, wild4 on wild4
    if (topCard.value === 'draw2' && card.value === 'draw2') return true
    if (topCard.value === 'wild4' && card.value === 'wild4') return true
    return false
  }
  return canPlay(card, topCard, activeColor, drawStack)
}

// ─── Game Initialization ──────────────────────────────────────────────────
export function createInitialGameState(players: Omit<Player, 'hand' | 'calledUno'>[]): GameState {
  let deck = shuffle(generateDeck())

  // Deal 7 cards to each player
  const playersWithHands: Player[] = players.map(p => ({
    ...p,
    hand: [],
    calledUno: false,
  }))

  for (let i = 0; i < GAME_LIMITS.STARTING_HAND_SIZE; i++) {
    for (const player of playersWithHands) {
      player.hand.push(deck.pop()!)
    }
  }

  // First discard: skip action cards / wilds as first card
  let firstCard: Card
  do {
    firstCard = deck.pop()!
    if (firstCard.value !== 'wild' && firstCard.value !== 'wild4' && firstCard.value !== 'skip' && firstCard.value !== 'reverse' && firstCard.value !== 'draw2') {
      break
    }
    deck.unshift(firstCard)  // put back at bottom
  } while (true)

  return {
    deck,
    discardPile: [firstCard],
    players: playersWithHands,
    currentPlayerIndex: 0,
    direction: 1,
    drawStack: 0,
    phase: 'dealing',
    activeColor: firstCard.color,
    turnStartedAt: Date.now(),
    wildPending: false,
  }
}

// ─── Next Player Index ─────────────────────────────────────────────────────
export function nextPlayerIndex(state: GameState, skip = false): number {
  const n = state.players.length
  const steps = skip ? 2 : 1
  return ((state.currentPlayerIndex + state.direction * steps) % n + n) % n
}

// ─── Play Card (pure reducer) ──────────────────────────────────────────────
export interface PlayCardResult {
  newState: GameState
  events: GameEvent[]
}

export type GameEvent =
  | { type: 'CARD_PLAYED'; playerId: string; card: Card }
  | { type: 'CARD_DRAWN'; playerId: string; count: number }
  | { type: 'SKIP'; targetId: string }
  | { type: 'REVERSE' }
  | { type: 'DRAW2'; targetId: string; count: number }
  | { type: 'WILD'; playerId: string }
  | { type: 'WILD4'; targetId: string; count: number }
  | { type: 'UNO'; playerId: string }
  | { type: 'ROUND_END'; winnerId: string; score: number }
  | { type: 'GAME_END'; winnerId: string }
  | { type: 'DRAW_STACK_HIT'; targetId: string; count: number }

export function playCard(state: GameState, playerIndex: number, card: Card, pickedColor?: CardColor): PlayCardResult {
  const events: GameEvent[] = []
  let gs: GameState = JSON.parse(JSON.stringify(state)) // deep clone

  const player = gs.players[playerIndex]

  // Remove card from hand
  const cardIdx = player.hand.findIndex(c => c.id === card.id)
  player.hand.splice(cardIdx, 1)

  // Push to discard
  gs.discardPile.push(card)

  events.push({ type: 'CARD_PLAYED', playerId: player.id, card })

  // Apply card effect
  let skipNext = false
  const n = gs.players.length

  if (card.value === 'reverse') {
    gs.direction = gs.direction === 1 ? -1 : 1
    events.push({ type: 'REVERSE' })
    if (n === 2) skipNext = true  // 2-player reverse = skip
  }

  if (card.value === 'skip') {
    skipNext = true
    const targetIdx = nextPlayerIndex(gs)
    events.push({ type: 'SKIP', targetId: gs.players[targetIdx].id })
  }

  if (card.value === 'draw2') {
    gs.drawStack += 2
    const targetIdx = nextPlayerIndex(gs, false)
    events.push({ type: 'DRAW2', targetId: gs.players[targetIdx].id, count: gs.drawStack })
    skipNext = true
  }

  if (card.value === 'wild' || card.value === 'wild4') {
    if (card.value === 'wild4') {
      gs.drawStack += 4
      const targetIdx = nextPlayerIndex(gs, false)
      events.push({ type: 'WILD4', targetId: gs.players[targetIdx].id, count: gs.drawStack })
      skipNext = true
    } else {
      events.push({ type: 'WILD', playerId: player.id })
    }
    gs.activeColor = pickedColor ?? 'red'
    gs.wildPending = !pickedColor
  } else {
    gs.activeColor = card.color
    gs.wildPending = false
  }

  // Check UNO
  if (player.hand.length === 1) {
    player.calledUno = false  // reset — player must call UNO
    events.push({ type: 'UNO', playerId: player.id })
  }

  // Check win
  if (player.hand.length === 0) {
    gs.phase = 'round-end'
    const score = computeScore(gs.players, player.id)
    events.push({ type: 'ROUND_END', winnerId: player.id, score })
    player.score += score
    if (player.score >= 500) {
      gs.phase = 'game-end'
      events.push({ type: 'GAME_END', winnerId: player.id })
    }
  } else {
    // Advance turn
    gs.currentPlayerIndex = nextPlayerIndex(gs, skipNext)
    gs.turnStartedAt = Date.now()
  }

  return { newState: gs, events }
}

// ─── Draw Cards ────────────────────────────────────────────────────────────
export function drawCards(state: GameState, playerIndex: number, count: number): { newState: GameState; drawn: Card[] } {
  let gs: GameState = JSON.parse(JSON.stringify(state))
  const player = gs.players[playerIndex]
  const drawn: Card[] = []

  for (let i = 0; i < count; i++) {
    if (gs.deck.length === 0) {
      // Reshuffle discard into deck
      const top = gs.discardPile.pop()!
      gs.deck = shuffle(gs.discardPile)
      gs.discardPile = [top]
    }
    if (gs.deck.length > 0) {
      const card = gs.deck.pop()!
      player.hand.push(card)
      drawn.push(card)
    }
  }

  return { newState: gs, drawn }
}

// ─── Handle Draw Stack Hit ─────────────────────────────────────────────────
export function resolveDrawStack(state: GameState): { newState: GameState; events: GameEvent[] } {
  const events: GameEvent[] = []
  const gs = JSON.parse(JSON.stringify(state)) as GameState
  if (gs.drawStack <= 0) return { newState: gs, events }

  const target = gs.players[gs.currentPlayerIndex]
  const count = gs.drawStack
  gs.drawStack = 0

  const { newState } = drawCards(gs, gs.currentPlayerIndex, count)
  events.push({ type: 'DRAW_STACK_HIT', targetId: target.id, count })

  newState.currentPlayerIndex = nextPlayerIndex(newState)
  newState.turnStartedAt = Date.now()

  return { newState, events }
}

// ─── Score Calculation ─────────────────────────────────────────────────────
function computeScore(players: Player[], winnerId: string): number {
  return players
    .filter(p => p.id !== winnerId)
    .flatMap(p => p.hand)
    .reduce((acc, card) => {
      if (card.value === 'wild' || card.value === 'wild4') return acc + 50
      if (['skip','reverse','draw2'].includes(card.value)) return acc + 20
      return acc + parseInt(card.value, 10)
    }, 0)
}

// ─── Valid Plays ───────────────────────────────────────────────────────────
export function getValidPlays(hand: Card[], topCard: Card, activeColor: CardColor, drawStack: number, stackingEnabled: boolean): Card[] {
  return hand.filter(c =>
    stackingEnabled
      ? canPlayWithStacking(c, topCard, activeColor, drawStack)
      : canPlay(c, topCard, activeColor, drawStack)
  )
}

// ─── Reshuffle Stats ──────────────────────────────────────────────────────
export function getTopCard(state: GameState): Card {
  return state.discardPile[state.discardPile.length - 1]
}
