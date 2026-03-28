/**
 * houseRules.ts
 * Pluggable rule modifiers for UNO Cinematic
 */

export interface HouseRules {
  /** Cards can stack on draw cards (Draw 2 + Draw 2, Wild+4 + Wild+4) */
  stackDrawCards: boolean;
  /** Player with matching card can "jump in" out of turn */
  jumpIn: boolean;
  /** Playing a 7 forces hand swap with chosen player; 0 rotates all hands */
  sevenZero: boolean;
  /** Wild+4 can be played even if you have a matching color */
  noMercyWild4: boolean;
  /** Target can challenge a Wild+4 — if challenger wins, plays goes to challenger penalty */
  challengeWild4: boolean;
  /** If player forgets to call UNO, they draw 2 */
  progressiveUno: boolean;
  /** Draw cards keep piling until someone can't counter */
  drawUntilPlay: boolean;
  /** First card flipped has its effect applied immediately */
  firstCardEffect: boolean;
}

export const DEFAULT_HOUSE_RULES: HouseRules = {
  stackDrawCards: false,
  jumpIn: false,
  sevenZero: false,
  noMercyWild4: false,
  challengeWild4: true,
  progressiveUno: true,
  drawUntilPlay: false,
  firstCardEffect: true,
};

export const PRESET_HOUSE_RULES: Record<string, HouseRules> = {
  classic: {
    ...DEFAULT_HOUSE_RULES,
    stackDrawCards: false,
    jumpIn: false,
    sevenZero: false,
    noMercyWild4: false,
    challengeWild4: true,
    progressiveUno: true,
    drawUntilPlay: false,
    firstCardEffect: true,
  },
  chaos: {
    ...DEFAULT_HOUSE_RULES,
    stackDrawCards: true,
    jumpIn: true,
    sevenZero: true,
    noMercyWild4: true,
    challengeWild4: true,
    progressiveUno: true,
    drawUntilPlay: true,
    firstCardEffect: true,
  },
  quick: {
    ...DEFAULT_HOUSE_RULES,
    stackDrawCards: false,
    jumpIn: false,
    sevenZero: false,
    noMercyWild4: true,
    challengeWild4: false,
    progressiveUno: false,
    drawUntilPlay: false,
    firstCardEffect: false,
  },
};

export type HouseRuleKey = keyof HouseRules;

export const HOUSE_RULE_LABELS: Record<HouseRuleKey, string> = {
  stackDrawCards: 'Stack Draw Cards',
  jumpIn: 'Jump In',
  sevenZero: 'Seven-Zero',
  noMercyWild4: 'No Mercy Wild +4',
  challengeWild4: 'Challenge Wild +4',
  progressiveUno: 'Progressive UNO',
  drawUntilPlay: 'Draw Until You Play',
  firstCardEffect: 'First Card Effect',
};

export const HOUSE_RULE_DESCRIPTIONS: Record<HouseRuleKey, string> = {
  stackDrawCards: 'Players can stack Draw 2 / Wild +4 cards to pass penalty forward.',
  jumpIn: 'Any player with an identical card can play it out of turn.',
  sevenZero: 'Playing a 7 swaps hands with any player; 0 rotates all hands.',
  noMercyWild4: 'Wild +4 can always be played regardless of hand color.',
  challengeWild4: 'Target player can challenge a Wild +4 — if bluff caught, attacker draws 4 extra.',
  progressiveUno: 'Failing to call UNO before a challenge costs 2 draw penalty.',
  drawUntilPlay: 'Keep drawing until you get a playable card.',
  firstCardEffect: 'The first flipped card applies its special effect immediately.',
};
