# Copilot Instructions

## Code style

- Do not use integer literals for constants in code. Always use the named constant instead.
  - Example: use `this.roundtype_knockout` instead of `2`, `this.roundtype_poule` instead of `1`, etc.

## Bet counting business rules

Total bets per pool: **207** (formatType 1, 2026 season).

| Round nr | Round name  | Bet types                                      | Count |
|----------|-------------|------------------------------------------------|-------|
| 0        | Group stage | `VoetbalOog_Bet_Score` + `VoetbalOog_Bet_Result` per game (12×6×2) | 144 |
| 1        | 1/16 final  | `VoetbalOog_Bet_Qualify` per poule place       | 32    |
| 2        | 1/8 final   | `VoetbalOog_Bet_Qualify` per poule place       | 16    |
| 3        | 1/4 final   | `VoetbalOog_Bet_Qualify` per poule place       | 8     |
| 4        | Semi-final  | `VoetbalOog_Bet_Qualify` per poule place       | 4     |
| 5        | Final       | `VoetbalOog_Bet_Qualify` per poule place       | 2     |
| 6        | Champion    | `VoetbalOog_Bet_Qualify` per poule place       | 1     |

### How bets are made in each round's view

- **Round nr 0 view**: User fills in the score → creates `VoetbalOog_Bet_Score` bet and auto-derives `VoetbalOog_Bet_Result` (no separate UI; result = 1 home win, 0 draw, -1 away win). The group-stage end ranking automatically sets the `VoetbalOog_Bet_Qualify` bets for round nr 1.
- **Round nr 1–4 views**: User picks the winner of each game → creates `VoetbalOog_Bet_Qualify` bets for the *next* round's poule places.
- **Round nr 5 view (final)**: User picks the tournament winner → creates the single `VoetbalOog_Bet_Qualify` bet for round nr 6 (champion).

### Implementation notes


 Default active-tab logic on page load: first incomplete round with bets filled, otherwise first empty round, otherwise the last complete round.
