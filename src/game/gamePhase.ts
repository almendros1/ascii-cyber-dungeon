/**
 * High-level application phases implemented by Milestone 3.
 *
 * `player-setup` is deliberately separate from ordinary command handling:
 * free-form input in that phase is treated as an operator name candidate.
 */
export type GamePhase =
  | 'booting'
  | 'main-menu'
  | 'player-setup'
  | 'playing'
