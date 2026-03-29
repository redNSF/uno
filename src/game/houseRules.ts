// ─── House Rules Configuration ────────────────────────────────────────────

export interface HouseRules {
  /** Draw 2s and Wild 4s accumulate — targeted player must draw all or play another */
  stackDrawCards: boolean
  /** Player with exact matching card can jump in out of turn */
  jumpIn: boolean
  /** Playing a 7 swaps hands with chosen player; playing a 0 rotates all hands */
  sevenZero: boolean
  /** Wild+4 can be played even when holding matching color (no mercy) */
  noMercyWild4: boolean
  /** Challenged Wild+4: if caller was holding matching color → challenger draws 4; else caller draws 6 */
  challengeWild4: boolean
  /** Progressive UNO: if you forget to call UNO before second-to-last card is played, draw 2 */
  progressiveUno: boolean
  /** Auto-play drawn card if it's valid */
  autoPlayDrawn: boolean
  /** Points per game (default 500) */
  targetScore: number
}

export const DEFAULT_HOUSE_RULES: HouseRules = {
  stackDrawCards: false,
  jumpIn: false,
  sevenZero: false,
  noMercyWild4: false,
  challengeWild4: true,
  progressiveUno: false,
  autoPlayDrawn: false,
  targetScore: 500,
}

export const DISPLAY_NAMES: Record<keyof HouseRules, string> = {
  stackDrawCards: 'Stack Draw Cards',
  jumpIn: 'Jump In',
  sevenZero: 'Seven-Zero',
  noMercyWild4: 'No Mercy Wild+4',
  challengeWild4: 'Challenge Wild+4',
  progressiveUno: 'Progressive UNO',
  autoPlayDrawn: 'Auto-Play Drawn Card',
  targetScore: 'Points to Win',
}

export const RULE_DESCRIPTIONS: Record<keyof HouseRules, string> = {
  stackDrawCards: 'Draw 2s and Wild+4s stack. Must draw all or play another draw card.',
  jumpIn: 'Play an identical card out of turn. Turn passes to you.',
  sevenZero: '7 = swap hands with any player. 0 = everyone passes their hand left.',
  noMercyWild4: 'Wild+4 is always legal regardless of hand color.',
  challengeWild4: 'Challenge a Wild+4. If illegal, challenger draws 4; if legal, caller draws 6.',
  progressiveUno: 'Miss your UNO call before drawing? Draw 2.',
  autoPlayDrawn: 'Drawn card is automatically played if valid.',
  targetScore: 'Game ends when a player reaches this score.',
}
