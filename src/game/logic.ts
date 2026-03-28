// ============================================
// UNO Game Logic Engine — Pure, No Side Effects
// Full 108-card standard UNO rules
// ============================================

import { nanoid } from 'nanoid';
import { shuffleArray } from '@utils/math';
import {
  CardColor, CardValue, GamePhase, Direction, HouseRules,
  CARD_COLORS, CARDS_PER_HAND, DEFAULT_HOUSE_RULES,
} from '@utils/constants';

// ---- Types ----

export interface Card {
  id: string;
  color: CardColor | 'wild';
  value: CardValue;
  /** Chosen color for wild cards after playing */
  chosenColor?: CardColor;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isBot: boolean;
  difficulty?: 'easy' | 'medium' | 'hard';
  hand: Card[];
  seatIndex: number;
  isConnected: boolean;
  hasCalledUno: boolean;
  signatureColor: string;
}

export interface GameState {
  id: string;
  phase: GamePhase;
  players: Player[];
  deck: Card[];
  discardPile: Card[];
  currentPlayerIndex: number;
  direction: Direction;
  currentColor: CardColor;
  drawStack: number;           // accumulated draw penalty (stacking rule)
  unoCallWindow: boolean;      // true during 2s window after someone reaches 1 card
  unoCallWindowPlayer: string | null;
  lastAction: GameAction | null;
  houseRules: HouseRules;
  turnStartTime: number;       // timestamp MS
  roundNumber: number;
  winner: string | null;
}

export type GameActionType =
  | 'play' | 'draw' | 'skip-forced' | 'reverse' | 'draw2'
  | 'wild' | 'wild4' | 'uno-call' | 'uno-penalty'
  | 'jump-in' | 'seven-swap' | 'zero-rotate' | 'challenge'
  | 'deal' | 'pass';

export interface GameAction {
  type: GameActionType;
  playerId: string;
  card?: Card;
  targetPlayerId?: string;
  chosenColor?: CardColor;
  challengeSuccess?: boolean;
}

// ---- Deck Creation ----

export function createDeck(): Card[] {
  const cards: Card[] = [];

  for (const color of CARD_COLORS) {
    // One 0
    cards.push({ id: nanoid(), color, value: '0' });
    // Two each of 1-9, skip, reverse, draw2
    for (let n = 1; n <= 9; n++) {
      cards.push({ id: nanoid(), color, value: `${n}` as CardValue });
      cards.push({ id: nanoid(), color, value: `${n}` as CardValue });
    }
    for (const special of ['skip', 'reverse', 'draw2'] as const) {
      cards.push({ id: nanoid(), color, value: special });
      cards.push({ id: nanoid(), color, value: special });
    }
  }

  // 4 wilds + 4 wild+4
  for (let i = 0; i < 4; i++) {
    cards.push({ id: nanoid(), color: 'wild', value: 'wild' });
    cards.push({ id: nanoid(), color: 'wild', value: 'wild4' });
  }

  return shuffleArray(cards);
}

// ---- Validation ----

export function canPlayCard(card: Card, topCard: Card, currentColor: CardColor, drawStack: number, houseRules: HouseRules): boolean {
  // Wild cards always playable (unless draw stacking is active)
  if (card.value === 'wild' || card.value === 'wild4') {
    if (houseRules.noMercyWild4) return true;
    if (drawStack > 0 && houseRules.stackDrawCards) {
      // Can only play if it's also a draw card to stack
      return card.value === 'wild4' || (card.value === 'draw2' && topCard.value === 'draw2');
    }
    return true;
  }

  // If a draw stack is active and not stacking, must draw
  if (drawStack > 0 && houseRules.stackDrawCards) {
    // Only a matching draw card can be stacked
    if (topCard.value === 'draw2') return card.value === 'draw2';
    if (topCard.value === 'wild4') return card.value === 'wild4';
  }

  // Match color
  if (card.color === currentColor) return true;

  // Match value/type (e.g., skip on skip regardless of color)
  if (card.value === topCard.value) return true;

  return false;
}

export function isWild(card: Card): boolean {
  return card.value === 'wild' || card.value === 'wild4';
}

export function isActionCard(card: Card): boolean {
  return ['skip', 'reverse', 'draw2', 'wild', 'wild4'].includes(card.value);
}

export function getCardType(card: Card): 'number' | 'action' | 'wild' {
  if (card.color === 'wild') return 'wild';
  if (isActionCard(card)) return 'action';
  return 'number';
}

// ---- Draw Pile Management ----

/** Draw N cards from deck; reshuffle discard if needed */
export function drawCards(
  deck: Card[],
  discardPile: Card[],
  count: number
): { drawn: Card[]; newDeck: Card[]; newDiscard: Card[] } {
  let currentDeck = [...deck];
  const newDiscard = [...discardPile];

  if (currentDeck.length < count) {
    // Reshuffle discard pile (keep top card)
    const top = newDiscard.pop();
    const reshuffled = shuffleArray([...newDiscard]);
    newDiscard.length = 0;
    if (top) newDiscard.push(top);
    currentDeck = [...currentDeck, ...reshuffled];
  }

  const drawn = currentDeck.splice(0, count);
  return { drawn, newDeck: currentDeck, newDiscard };
}

// ---- Game Initialization ----

export function createInitialGameState(
  players: Omit<Player, 'hand' | 'hasCalledUno'>[],
  houseRules: HouseRules = DEFAULT_HOUSE_RULES
): GameState {
  let deck = createDeck();

  // Deal 7 cards to each player
  const dealtPlayers: Player[] = players.map((p) => {
    const hand = deck.splice(0, CARDS_PER_HAND);
    return { ...p, hand, hasCalledUno: false };
  });

  // Flip first card — re-deal if it's wild4
  let firstCard = deck.shift()!;
  while (firstCard.value === 'wild4') {
    deck.push(firstCard);
    deck = shuffleArray(deck);
    firstCard = deck.shift()!;
  }

  // Determine starting color
  const startColor: CardColor = firstCard.color === 'wild'
    ? CARD_COLORS[Math.floor(Math.random() * 4)]
    : firstCard.color as CardColor;

  const state: GameState = {
    id: nanoid(),
    phase: 'dealing',
    players: dealtPlayers,
    deck,
    discardPile: [firstCard],
    currentPlayerIndex: 0,
    direction: 1,
    currentColor: startColor,
    drawStack: 0,
    unoCallWindow: false,
    unoCallWindowPlayer: null,
    lastAction: null,
    houseRules,
    turnStartTime: Date.now(),
    roundNumber: 1,
    winner: null,
  };

  // Apply first card effects
  return applyFirstCardEffect(state);
}

function applyFirstCardEffect(state: GameState): GameState {
  const s = { ...state };
  const firstCard = s.discardPile[s.discardPile.length - 1];

  switch (firstCard.value) {
    case 'skip':
      s.currentPlayerIndex = getNextPlayerIndex(s, 1);
      break;
    case 'reverse':
      if (s.players.length === 2) {
        s.currentPlayerIndex = getNextPlayerIndex(s, 1);
      } else {
        s.direction = -1 as Direction;
      }
      break;
    case 'draw2':
      s.drawStack = 2;
      break;
    case 'wild':
      // Color already chosen randomly
      s.phase = 'playing';
      break;
    default:
      break;
  }

  return s;
}

// ---- Player Index Navigation ----

export function getNextPlayerIndex(
  state: GameState,
  steps = 1,
  fromIndex?: number
): number {
  const count = state.players.length;
  let idx = fromIndex ?? state.currentPlayerIndex;
  for (let i = 0; i < steps; i++) {
    idx = ((idx + state.direction) % count + count) % count;
  }
  return idx;
}

export function getPreviousPlayerIndex(state: GameState): number {
  const count = state.players.length;
  return ((state.currentPlayerIndex - state.direction) % count + count) % count;
}

// ---- Play a Card ----

export interface PlayResult {
  newState: GameState;
  action: GameAction;
  requiresColorPick: boolean;
  challengeAllowed: boolean;
}

export function playCard(
  state: GameState,
  playerId: string,
  cardId: string,
  chosenColor?: CardColor,
  targetPlayerId?: string
): PlayResult {
  const playerIdx = state.players.findIndex((p) => p.id === playerId);
  if (playerIdx < 0) throw new Error('Player not found');

  const player = state.players[playerIdx];
  const cardIdx = player.hand.findIndex((c) => c.id === cardId);
  if (cardIdx < 0) throw new Error('Card not in hand');

  const card = player.hand[cardIdx];
  const topCard = state.discardPile[state.discardPile.length - 1];

  if (!canPlayCard(card, topCard, state.currentColor, state.drawStack, state.houseRules)) {
    throw new Error('Invalid play');
  }

  // Remove card from hand
  const newHand = [...player.hand];
  newHand.splice(cardIdx, 1);

  const newPlayers = [...state.players];
  newPlayers[playerIdx] = { ...player, hand: newHand, hasCalledUno: false };

  const newDiscard = [...state.discardPile, { ...card, chosenColor }];

  let s: GameState = {
    ...state,
    players: newPlayers,
    discardPile: newDiscard,
    lastAction: null,
    unoCallWindow: false,
    unoCallWindowPlayer: null,
  };

  let requiresColorPick = false;
  let challengeAllowed = false;
  const action: GameAction = { type: 'play', playerId, card, chosenColor };

  // Apply card effects
  switch (card.value) {
    case 'skip': {
      action.type = 'skip-forced';
      const skip1 = getNextPlayerIndex(s);
      // Skip 1 player (skip them, then advance)
      if (s.players.length === 2) {
        // skip = effectively current stays... next = advance 2
        s.currentPlayerIndex = getNextPlayerIndex(s, 2, s.currentPlayerIndex);
      } else {
        s.currentPlayerIndex = getNextPlayerIndex(s, 2, s.currentPlayerIndex);
      }
      action.targetPlayerId = s.players[skip1].id;
      break;
    }

    case 'reverse': {
      action.type = 'reverse';
      s.direction = (s.direction * -1) as Direction;
      if (s.players.length === 2) {
        // In 2-player, reverse = skip
        s.currentPlayerIndex = getNextPlayerIndex(s);
      } else {
        s.currentPlayerIndex = getNextPlayerIndex(s);
      }
      break;
    }

    case 'draw2': {
      action.type = 'draw2';
      if (s.houseRules.stackDrawCards) {
        s.drawStack += 2;
        s.currentPlayerIndex = getNextPlayerIndex(s);
      } else {
        const target = getNextPlayerIndex(s);
        const { drawn, newDeck, newDiscard: nd } = drawCards(s.deck, s.discardPile, 2);
        newPlayers[target] = {
          ...newPlayers[target],
          hand: [...newPlayers[target].hand, ...drawn],
        };
        s.players = newPlayers;
        s.deck = newDeck;
        s.discardPile = nd;
        s.drawStack = 0;
        // Skip the target
        s.currentPlayerIndex = getNextPlayerIndex(s, 2, s.currentPlayerIndex);
        action.targetPlayerId = s.players[target].id;
      }
      break;
    }

    case 'wild': {
      action.type = 'wild';
      if (chosenColor) {
        s.currentColor = chosenColor;
        s.currentPlayerIndex = getNextPlayerIndex(s);
      } else {
        requiresColorPick = true;
        s.phase = 'color-pick';
      }
      break;
    }

    case 'wild4': {
      action.type = 'wild4';
      challengeAllowed = !state.houseRules.noMercyWild4;
      if (chosenColor) {
        s.currentColor = chosenColor;
        if (s.houseRules.stackDrawCards) {
          s.drawStack += 4;
          s.currentPlayerIndex = getNextPlayerIndex(s);
        } else {
          const target = getNextPlayerIndex(s);
          const { drawn, newDeck, newDiscard: nd } = drawCards(s.deck, s.discardPile, 4);
          newPlayers[target] = {
            ...newPlayers[target],
            hand: [...newPlayers[target].hand, ...drawn],
          };
          s.players = newPlayers;
          s.deck = newDeck;
          s.discardPile = nd;
          s.drawStack = 0;
          s.currentPlayerIndex = getNextPlayerIndex(s, 2, s.currentPlayerIndex);
          action.targetPlayerId = s.players[target].id;
        }
      } else {
        requiresColorPick = true;
        s.phase = 'color-pick';
      }
      break;
    }

    default: {
      // Number card
      if (card.color !== 'wild') {
        s.currentColor = card.color as CardColor;
      }

      // House rule: 7 = swap hands
      if (card.value === '7' && s.houseRules.sevenZero) {
        action.type = 'seven-swap';
        if (targetPlayerId) {
          const tIdx = s.players.findIndex((p) => p.id === targetPlayerId);
          if (tIdx >= 0) {
            const myHand = [...newHand];
            const theirHand = [...s.players[tIdx].hand];
            newPlayers[playerIdx] = { ...newPlayers[playerIdx], hand: theirHand };
            newPlayers[tIdx] = { ...newPlayers[tIdx], hand: myHand };
            s.players = newPlayers;
          }
          action.targetPlayerId = targetPlayerId;
        }
      }

      // House rule: 0 = rotate all hands
      if (card.value === '0' && s.houseRules.sevenZero) {
        action.type = 'zero-rotate';
        const hands = s.players.map((p) => [...p.hand]);
        const n = hands.length;
        if (s.direction === 1) {
          // Rotate forward: player[i] gets hand of player[i-1]
          const last = hands[n - 1];
          for (let i = n - 1; i > 0; i--) hands[i] = hands[i - 1];
          hands[0] = last;
        } else {
          const first = hands[0];
          for (let i = 0; i < n - 1; i++) hands[i] = hands[i + 1];
          hands[n - 1] = first;
        }
        s.players = s.players.map((p, i) => ({ ...p, hand: hands[i] }));
      }

      s.currentPlayerIndex = getNextPlayerIndex(s);
      break;
    }
  }

  // Handle accumulated draw stack — if current player has no draw card to stack, they draw
  if (
    s.drawStack > 0
    && !requiresColorPick
    && s.houseRules.stackDrawCards
    && card.value !== 'draw2'
    && card.value !== 'wild4'
  ) {
    const target = s.currentPlayerIndex;
    const { drawn, newDeck, newDiscard: nd } = drawCards(s.deck, s.discardPile, s.drawStack);
    const targetPlayer = s.players[target];
    s.players = s.players.map((p, i) =>
      i === target ? { ...p, hand: [...p.hand, ...drawn] } : p
    );
    s.deck = newDeck;
    s.discardPile = nd;
    s.drawStack = 0;
    s.currentPlayerIndex = getNextPlayerIndex(s);
    action.type = card.value === 'draw2' ? 'draw2' : 'wild4';
    action.targetPlayerId = targetPlayer.id;
  }

  // Update current color from played card
  if (!requiresColorPick && card.color !== 'wild') {
    s.currentColor = card.color as CardColor;
  }

  // Check win condition
  if (newHand.length === 0) {
    s.phase = 'game-end';
    s.winner = playerId;
  } else if (newHand.length === 1) {
    // UNO window opens
    s.unoCallWindow = true;
    s.unoCallWindowPlayer = playerId;
    s.phase = requiresColorPick ? 'color-pick' : 'uno-window';
  } else if (!requiresColorPick) {
    s.phase = 'playing';
  }

  s.lastAction = action;
  s.turnStartTime = Date.now();

  return { newState: s, action, requiresColorPick, challengeAllowed };
}

// ---- Draw Cards (player action) ----

export function drawCardAction(state: GameState, playerId: string): GameState {
  const playerIdx = state.players.findIndex((p) => p.id === playerId);
  if (playerIdx < 0) throw new Error('Player not found');

  const drawCount = state.drawStack > 0 ? state.drawStack : 1;
  const { drawn, newDeck, newDiscard } = drawCards(state.deck, state.discardPile, drawCount);

  const player = state.players[playerIdx];
  const newHand = [...player.hand, ...drawn];

  const newPlayers = [...state.players];
  newPlayers[playerIdx] = { ...player, hand: newHand, hasCalledUno: false };

  const newState: GameState = {
    ...state,
    players: newPlayers,
    deck: newDeck,
    discardPile: newDiscard,
    drawStack: 0,
    turnStartTime: Date.now(),
    lastAction: { type: 'draw', playerId },
  };

  // If drew 1, check if playable; otherwise pass turn
  if (drawCount === 1 && drawn.length === 1) {
    const drawnCard = drawn[0];
    const topCard = newState.discardPile[newState.discardPile.length - 1];
    if (canPlayCard(drawnCard, topCard, state.currentColor, 0, state.houseRules)) {
      return newState; // Player can choose to play it — don't advance yet
    }
  }

  // Advance turn
  newState.currentPlayerIndex = getNextPlayerIndex(newState);
  newState.phase = 'playing';
  return newState;
}

// ---- Pass Turn ----

export function passTurn(state: GameState): GameState {
  return {
    ...state,
    currentPlayerIndex: getNextPlayerIndex(state),
    phase: 'playing',
    turnStartTime: Date.now(),
    lastAction: { type: 'pass', playerId: state.players[state.currentPlayerIndex].id },
  };
}

// ---- Set Wild Color ----

export function setWildColor(state: GameState, playerId: string, color: CardColor): GameState {
  const lastCard = state.discardPile[state.discardPile.length - 1];
  const newDiscard = [...state.discardPile];
  newDiscard[newDiscard.length - 1] = { ...lastCard, chosenColor: color };

  let s: GameState = {
    ...state,
    currentColor: color,
    discardPile: newDiscard,
    phase: 'playing',
  };

  // Apply wild4 draw effect now that color is chosen
  if (lastCard.value === 'wild4') {
    if (s.houseRules.stackDrawCards) {
      // Handled when next player can't stack
    } else {
      const target = getNextPlayerIndex(s, 1, getPreviousPlayerIndex(s));
      const { drawn, newDeck, newDiscard: nd } = drawCards(s.deck, s.discardPile, 4);
      s.players = s.players.map((p, i) =>
        i === target ? { ...p, hand: [...p.hand, ...drawn] } : p
      );
      s.deck = newDeck;
      s.discardPile = nd;
      s.currentPlayerIndex = getNextPlayerIndex(s, 2,
        ((s.currentPlayerIndex - s.direction + s.players.length) % s.players.length));
    }
  } else {
    s.currentPlayerIndex = getNextPlayerIndex(s);
  }

  s.turnStartTime = Date.now();
  return s;
}

// ---- UNO Call ----

export function callUno(state: GameState, callerId: string): GameState {
  // Validate the person who should have called UNO
  if (state.unoCallWindowPlayer && state.unoCallWindowPlayer !== callerId) {
    // Someone caught the player who forgot to call UNO
    const victimIdx = state.players.findIndex((p) => p.id === state.unoCallWindowPlayer);
    if (victimIdx < 0) return state;

    const { drawn, newDeck, newDiscard } = drawCards(state.deck, state.discardPile, 2);
    const newPlayers = [...state.players];
    newPlayers[victimIdx] = {
      ...newPlayers[victimIdx],
      hand: [...newPlayers[victimIdx].hand, ...drawn],
      hasCalledUno: false,
    };

    return {
      ...state,
      players: newPlayers,
      deck: newDeck,
      discardPile: newDiscard,
      unoCallWindow: false,
      unoCallWindowPlayer: null,
      phase: 'playing',
      lastAction: { type: 'uno-penalty', playerId: callerId, targetPlayerId: state.unoCallWindowPlayer ?? undefined },
    };
  }

  // Player calls UNO themselves
  const playerIdx = state.players.findIndex((p) => p.id === callerId);
  if (playerIdx < 0) return state;

  const newPlayers = [...state.players];
  newPlayers[playerIdx] = { ...newPlayers[playerIdx], hasCalledUno: true };

  return {
    ...state,
    players: newPlayers,
    unoCallWindow: false,
    unoCallWindowPlayer: null,
    phase: 'playing',
    lastAction: { type: 'uno-call', playerId: callerId },
  };
}

// ---- Challenge Wild+4 ----

export function challengeWild4(state: GameState, challengerId: string): GameState {
  // Previous player who played wild4
  const prevIdx = getPreviousPlayerIndex(state);
  const bluffer = state.players[prevIdx];
  const challenger = state.players.find((p) => p.id === challengerId);
  if (!challenger || !bluffer) return state;

  // Was the bluff valid? Check if bluffer had a card matching previous color
  // (The second-to-last card on discard before the wild4)
  const previousTopIdx = state.discardPile.length - 2;
  const previousTop = state.discardPile[previousTopIdx];
  const previousColor = previousTop?.chosenColor ?? previousTop?.color as CardColor ?? 'red';

  const hadMatchingCard = bluffer.hand.some(
    (c) => c.color === previousColor || (c.value === previousTop?.value)
  );

  let newPlayers = [...state.players];
  let { newDeck, newDiscard } = { newDeck: state.deck, newDiscard: state.discardPile };

  if (hadMatchingCard) {
    // Bluff! Bluffer draws 4 instead of challenger
    const blufferIdx = prevIdx;
    const result = drawCards(newDeck, newDiscard, 4);
    newPlayers[blufferIdx] = { ...newPlayers[blufferIdx], hand: [...newPlayers[blufferIdx].hand, ...result.drawn] };
    newDeck = result.newDeck;
    newDiscard = result.newDiscard;
  } else {
    // Not a bluff — challenger draws 6 (4 + 2 penalty)
    const challengerIdx = newPlayers.findIndex((p) => p.id === challengerId);
    const result = drawCards(newDeck, newDiscard, 6);
    newPlayers[challengerIdx] = { ...newPlayers[challengerIdx], hand: [...newPlayers[challengerIdx].hand, ...result.drawn] };
    newDeck = result.newDeck;
    newDiscard = result.newDiscard;
  }

  return {
    ...state,
    players: newPlayers,
    deck: newDeck,
    discardPile: newDiscard,
    phase: 'playing',
    lastAction: {
      type: 'challenge',
      playerId: challengerId,
      targetPlayerId: bluffer.id,
      challengeSuccess: hadMatchingCard,
    },
  };
}

// ---- Jump-In ----

export function jumpIn(state: GameState, playerId: string, cardId: string): PlayResult {
  if (!state.houseRules.jumpIn) throw new Error('Jump-In not enabled');

  const playerIdx = state.players.findIndex((p) => p.id === playerId);
  if (playerIdx < 0) throw new Error('Player not found');

  const player = state.players[playerIdx];
  const card = player.hand.find((c) => c.id === cardId);
  if (!card) throw new Error('Card not in hand');

  const topCard = state.discardPile[state.discardPile.length - 1];

  // Jump-In requires exact match (same color AND same value)
  if (card.color !== topCard.color || card.value !== topCard.value) {
    throw new Error('Jump-In requires identical card');
  }

  // Change current player and play
  const adjustedState = {
    ...state,
    currentPlayerIndex: playerIdx,
  };

  return playCard(adjustedState, playerId, cardId);
}

// ---- Validate current player ----

export function isPlayerTurn(state: GameState, playerId: string): boolean {
  return state.players[state.currentPlayerIndex]?.id === playerId;
}

// ---- Get current top card effective color ----

export function getEffectiveColor(state: GameState): CardColor {
  return state.currentColor;
}

// ---- Get playable cards for player ----

export function getPlayableCards(state: GameState, playerId: string): Card[] {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return [];
  const topCard = state.discardPile[state.discardPile.length - 1];
  return player.hand.filter((c) =>
    canPlayCard(c, topCard, state.currentColor, state.drawStack, state.houseRules)
  );
}
