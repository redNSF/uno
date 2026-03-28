/**
 * ai.ts — 3-Tier AI Decision Engine for UNO Cinematic
 * Easy / Medium / Hard with card counting and threat scoring
 */

import { GameState, Player, Card, getPlayableCards, canPlayCard } from './logic';
import { CardColor, CARD_COLORS } from '@utils/constants';

export type AIDifficulty = 'easy' | 'medium' | 'hard';

export interface AIDecision {
  type: 'play' | 'draw' | 'pass';
  cardId?: string;
  chosenColor?: CardColor;
  targetPlayerId?: string; // For 7-swap
}

// ---- Utility helpers ----

function getColorFrequency(hand: Card[]): Record<CardColor, number> {
  const freq: Record<CardColor, number> = { red: 0, blue: 0, green: 0, yellow: 0 };
  for (const card of hand) {
    if (card.color !== 'wild' && card.color in freq) {
      freq[card.color as CardColor]++;
    }
  }
  return freq;
}

function getDominantColor(hand: Card[]): CardColor {
  const freq = getColorFrequency(hand);
  return (Object.entries(freq).sort(([, a], [, b]) => b - a)[0][0]) as CardColor;
}

function isWild(card: Card) {
  return card.value === 'wild' || card.value === 'wild4';
}

function isActionCard(card: Card) {
  return ['skip', 'reverse', 'draw2', 'wild', 'wild4'].includes(card.value);
}

function cardWeight(card: Card): number {
  if (card.value === 'wild4') return 50;
  if (card.value === 'wild') return 40;
  if (['skip', 'reverse', 'draw2'].includes(card.value)) return 20;
  return parseInt(card.value, 10) || 5;
}

// ---- Card counting (Hard AI tracks seen cards) ----
// Stored as module-level per AI instance (in practice, one per hard-mode bot)
const seenCardSets = new Map<string, Set<string>>();

function trackSeen(playerId: string, cardId: string) {
  if (!seenCardSets.has(playerId)) seenCardSets.set(playerId, new Set());
  seenCardSets.get(playerId)!.add(cardId);
}

function clearTracking(playerId: string) {
  seenCardSets.delete(playerId);
}

// ---- Main AI function ----

export function computeAIDecision(
  state: GameState,
  playerId: string,
): AIDecision {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return { type: 'draw' };

  const difficulty = player.difficulty ?? 'easy';
  const playable = getPlayableCards(state, playerId);

  switch (difficulty) {
    case 'easy':   return easyAI(player, playable, state);
    case 'medium': return mediumAI(player, playable, state);
    case 'hard':   return hardAI(player, playable, state);
    default:       return easyAI(player, playable, state);
  }
}

// ---- Easy AI: weighted random ----

function easyAI(player: Player, playable: Card[], state: GameState): AIDecision {
  if (playable.length === 0) return { type: 'draw' };

  // Simple random pick from playable cards
  const card = playable[Math.floor(Math.random() * playable.length)];
  const chosenColor = isWild(card) ? randomColor(player.hand) : undefined;
  const targetPlayerId = getRandomOpponent(state, player.id);

  return { type: 'play', cardId: card.id, chosenColor, targetPlayerId };
}

// ---- Medium AI: prefer color matching, save wilds, use specials on leader ----

function mediumAI(player: Player, playable: Card[], state: GameState): AIDecision {
  if (playable.length === 0) return { type: 'draw' };

  const leader = getLeader(state, player.id);

  // Sort priority: prefer matching color, then action cards vs leader, then number
  const scored = playable.map((card) => {
    let score = 0;
    // Match current color
    if (card.color === state.currentColor) score += 10;
    // Use action card if leader is winning
    if (isActionCard(card) && leader && leader.hand.length <= 3) score += 15;
    // Save wilds unless no other option
    if (isWild(card)) score -= 5;
    // Prefer lower number (hand compression)
    score -= (parseInt(card.value, 10) || 0) * 0.1;
    return { card, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0].card;

  const chosenColor = isWild(best) ? getDominantColor(player.hand) : undefined;
  const targetPlayerId = leader?.id ?? getRandomOpponent(state, player.id);

  return { type: 'play', cardId: best.id, chosenColor, targetPlayerId };
}

// ---- Hard AI: card counting, threat scoring, optimal hand compression ----

function hardAI(player: Player, playable: Card[], state: GameState): AIDecision {
  // Track all visible cards
  for (const p of state.players) {
    if (p.id !== player.id) {
      // We see discard pile but not other hands – track discards
    }
  }
  for (const card of state.discardPile) {
    trackSeen(player.id, card.id);
  }

  if (playable.length === 0) return { type: 'draw' };

  const threats = computeThreats(state, player.id);
  const biggestThreat = threats[0];

  const scored = playable.map((card) => {
    let score = 0;

    // Match current color is always good
    if (card.color === state.currentColor) score += 8;

    // Prioritize eliminating high-value cards from hand
    score += cardWeight(card) * 0.5;

    // Attack the biggest threat with action cards
    if (biggestThreat && isActionCard(card)) {
      score += 20;
      if (card.value === 'wild4' && biggestThreat.hand.length <= 2) score += 30;
      if (card.value === 'draw2' && biggestThreat.hand.length <= 3) score += 15;
      if (card.value === 'skip' && biggestThreat.hand.length <= 2) score += 10;
    }

    // Withold wild+4 unless it's needed (player has <= 3 cards or is kill-shot)
    if (card.value === 'wild4') {
      const alternativeExists = playable.some((c) => !isWild(c));
      if (alternativeExists && (!biggestThreat || biggestThreat.hand.length > 2)) {
        score -= 25; // Save it for kill shot
      }
    }

    // Color compression: pick card that leaves best dominant color
    const handWithoutCard = player.hand.filter((c) => c.id !== card.id);
    const dominantAfter = getDominantColor(handWithoutCard);
    const domCount = getColorFrequency(handWithoutCard)[dominantAfter];
    score += domCount; // Prefer plays that keep color runs intact

    return { card, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0].card;

  // Pick optimal wild color
  let chosenColor: CardColor | undefined;
  if (isWild(best)) {
    // Look at all opponents' probable colors (we can infer from draws/plays)
    // Default to our hand's dominant color + deny biggest threat
    chosenColor = getDominantColor(player.hand);
    if (biggestThreat) {
      // Try to not give them what they probably want
      const avoidColors = new Set<CardColor>();
      // We don't see their hand, but we can use frequency from deck
      // For now pick our own dominant
      chosenColor = getDominantColor(player.hand);
    }
  }

  // 7-swap: swap with the player with the most cards (give them trouble)
  let targetPlayerId: string | undefined;
  if (best.value === '7' && state.houseRules.sevenZero) {
    const target = state.players
      .filter((p) => p.id !== player.id)
      .sort((a, b) => b.hand.length - a.hand.length)[0];
    targetPlayerId = target?.id;
  } else if (biggestThreat) {
    targetPlayerId = biggestThreat.id;
  }

  return { type: 'play', cardId: best.id, chosenColor, targetPlayerId };
}

// ---- Helpers ----

function randomColor(hand: Card[]): CardColor {
  return getDominantColor(hand) ?? CARD_COLORS[Math.floor(Math.random() * 4)];
}

function getRandomOpponent(state: GameState, myId: string): string | undefined {
  const opponents = state.players.filter((p) => p.id !== myId);
  if (opponents.length === 0) return undefined;
  return opponents[Math.floor(Math.random() * opponents.length)].id;
}

function getLeader(state: GameState, myId: string): Player | undefined {
  return state.players
    .filter((p) => p.id !== myId)
    .sort((a, b) => a.hand.length - b.hand.length)[0];
}

interface ThreatScore {
  id: string;
  hand: Card[];
  score: number;
}

function computeThreats(state: GameState, myId: string): ThreatScore[] {
  return state.players
    .filter((p) => p.id !== myId)
    .map((p) => ({
      id: p.id,
      hand: p.hand,
      score: 100 - p.hand.length * 10, // fewer cards = bigger threat
    }))
    .sort((a, b) => b.score - a.score);
}

// ---- AI timing delays (for realistic feel) ----

export const AI_THINK_DELAYS: Record<AIDifficulty, [min: number, max: number]> = {
  easy:   [800,  1800],
  medium: [500,  1200],
  hard:   [300,  900],
};

export function getAIDelay(difficulty: AIDifficulty): number {
  const [min, max] = AI_THINK_DELAYS[difficulty];
  return Math.floor(Math.random() * (max - min)) + min;
}

export { clearTracking };
