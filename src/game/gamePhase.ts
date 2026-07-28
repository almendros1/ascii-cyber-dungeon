/**
 * High-level application phases for the complete fixed MVP run.
 *
 * `player-setup` is deliberately separate from ordinary command handling:
 * free-form input in that phase is treated as an operator name candidate.
 * Result phases prevent gameplay handlers from mutating a finished run.
 */
export type GamePhase =
  | 'booting'
  | 'main-menu'
  | 'player-setup'
  | 'playing'
  | 'victory'
  | 'defeat'
