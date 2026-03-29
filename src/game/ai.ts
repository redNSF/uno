import type { Card, GameState, Player } from './logic'
import { getValidPlays, getTopCard } from './logic'
import type { CardColor, AiLevel } from '../utils/constants'
import { randInt } from '../utils/math'

// ─── Types ─────────────────────────────────────────────────────────────────
export interface AiDecision {
  action: 'play' | 'draw'
  card?: Card
  pickedColor?: CardColor
}

// ─── Color Frequency Analysis ─────────────────────────────────────────────
function dominantColor(hand: Card[]): CardColor {
  const counts: Record<string, number> = { red: 0, yellow: 0, green: 0, blue: 0 }
  for (const c of hand) {
    if (c.color !== 'wild') counts[c.color] = (counts[c.color] ?? 0) + 1
  }
  let best: CardColor = 'red'
  let bestCount = -1
  for (const [color, count] of Object.entries(counts)) {
    if (count > bestCount) { bestCount = count; best = color as CardColor }
  }
  return best
}

// ─── Threat Scoring (Hard AI) ─────────────────────────────────────────────
function threatScore(player: Player, allPlayers: Player[]): number {
  // Higher = more dangerous target
  const handSizeThreat = (8 - Math.min(player.hand.length, 7)) * 10
  const scoreThreat = player.score * 0.5
  const lowestHandAmongOpponents = Math.min(...allPlayers.filter(p => p.id !== player.id).map(p => p.hand.length))
  const isLeader = player.hand.length === lowestHandAmongOpponents ? 5 : 0
  return handSizeThreat + scoreThreat + isLeader
}

// ─── Easy AI ──────────────────────────────────────────────────────────────
function easyDecide(state: GameState, playerIndex: number, stackingEnabled: boolean): AiDecision {
  const player = state.players[playerIndex]
  const topCard = getTopCard(state)
  const validPlays = getValidPlays(player.hand, topCard, state.activeColor, state.drawStack, stackingEnabled)

  if (validPlays.length === 0) return { action: 'draw' }

  // Random from valid plays
  const card = validPlays[randInt(0, validPlays.length - 1)]
  const pickedColor = (card.value === 'wild' || card.value === 'wild4')
    ? (['red','yellow','green','blue'] as CardColor[])[randInt(0, 3)]
    : undefined

  return { action: 'play', card, pickedColor }
}

// ─── Medium AI ─────────────────────────────────────────────────────────────
function mediumDecide(state: GameState, playerIndex: number, stackingEnabled: boolean): AiDecision {
  const player = state.players[playerIndex]
  const topCard = getTopCard(state)
  const validPlays = getValidPlays(player.hand, topCard, state.activeColor, state.drawStack, stackingEnabled)

  if (validPlays.length === 0) return { action: 'draw' }

  // Priority: color match → action → number → wilds (save for later)
  const nonWild = validPlays.filter(c => c.value !== 'wild' && c.value !== 'wild4')
  const actions = nonWild.filter(c => ['skip','reverse','draw2'].includes(c.value))
  const colorMatch = nonWild.filter(c => c.color === state.activeColor)
  const numeric = nonWild.filter(c => !['skip','reverse','draw2'].includes(c.value))

  let card: Card
  if (actions.length > 0) {
    card = actions[randInt(0, actions.length - 1)]
  } else if (colorMatch.length > 0) {
    card = colorMatch[randInt(0, colorMatch.length - 1)]
  } else if (numeric.length > 0) {
    card = numeric[randInt(0, numeric.length - 1)]
  } else {
    // Use wild as last resort
    card = validPlays.find(c => c.value === 'wild') ?? validPlays[0]
  }

  const pickedColor = (card.value === 'wild' || card.value === 'wild4')
    ? dominantColor(player.hand)
    : undefined

  return { action: 'play', card, pickedColor }
}

// ─── Hard AI ──────────────────────────────────────────────────────────────
function hardDecide(state: GameState, playerIndex: number, stackingEnabled: boolean): AiDecision {
  const player = state.players[playerIndex]
  const topCard = getTopCard(state)
  const validPlays = getValidPlays(player.hand, topCard, state.activeColor, state.drawStack, stackingEnabled)

  if (validPlays.length === 0) return { action: 'draw' }

  const opponents = state.players.filter((_, i) => i !== playerIndex)
  const mostDangerous = opponents.reduce((a, b) => threatScore(a, state.players) > threatScore(b, state.players) ? a : b)
  const leader = opponents.reduce((a, b) => a.hand.length <= b.hand.length ? a : b)

  // If leader has ≤2 cards, deploy kill cards aggressively
  const killMode = leader.hand.length <= 2

  let scored = validPlays.map(card => {
    let score = 0

    // Prefer color match
    if (card.color === state.activeColor) score += 5

    // Actions always valuable
    if (card.value === 'skip' || card.value === 'reverse') score += 8
    if (card.value === 'draw2') score += killMode ? 20 : 12

    // Wild+4: prefer to use as kill shot
    if (card.value === 'wild4') score += killMode ? 25 : 3
    if (card.value === 'wild') score += killMode ? 15 : 2

    // Prefer to play high-value number cards (reduce hand value)
    if (['7','8','9'].includes(card.value)) score += 3

    // Hand compression: prefer to dump cards with same value as multiple colors
    const sameValueCount = player.hand.filter(c => c.value === card.value && c.id !== card.id).length
    score += sameValueCount * 2

    // Irrelevant threat boost
    score += threatScore(mostDangerous, state.players) * 0.01

    return { card, score }
  })

  scored.sort((a, b) => b.score - a.score)
  const best = scored[0].card

  const pickedColor = (best.value === 'wild' || best.value === 'wild4')
    ? dominantColor(player.hand)
    : undefined

  return { action: 'play', card: best, pickedColor }
}

// ─── Public API ───────────────────────────────────────────────────────────
export function aiDecide(
  state: GameState,
  playerIndex: number,
  level: AiLevel,
  stackingEnabled: boolean
): AiDecision {
  switch (level) {
    case 'easy':   return easyDecide(state, playerIndex, stackingEnabled)
    case 'medium': return mediumDecide(state, playerIndex, stackingEnabled)
    case 'hard':   return hardDecide(state, playerIndex, stackingEnabled)
  }
}
