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

## Manual tiebreaker (doManualSorting)

When all ranking criteria are exhausted and two or more teams are still completely equal, a **manual decision** is required (e.g. a drawing of lots by the tournament organization). This must be encoded in `doManualSorting` in **two files**:

| File | Season identifier |
|------|-------------------|
| `library/Voetbal/Ranking.php` → `doManualSorting()` | `$seasonName` = `getSeason()->getName()` (e.g. `"2024"`) |
| `pub_voetbaloog/public/scripts/jslibraryvo/VoetbalOog/Ranking.js` → `doManualSorting()` | `seasonName` = `getCompetitionSeason().getAbbreviation()` (e.g. `'EK 24'`) |

### How to add a new manual tiebreaker

1. Find out the official decision (lots, yellow cards, alphabetical, etc.) and which poule number is affected.
2. In **both** files, add an `if`-block inside `doManualSorting`:
   - Check the season name/abbreviation **and** `allFromSamePoule(pouleNr, ...)`.
   - Sort the collection according to the official decision.
3. Add a comment explaining **why** the order was chosen (e.g. `// Denmark before Slovenia: fewer yellow cards`).

### Existing cases

| Season | PHP name | JS abbreviation | Poule nr | Decision |
|--------|----------|-----------------|----------|----------|
| EK 2024 | `"2024"` | `'EK 24'` | 2 | Denmark before Slovenia — fewer yellow cards (alphabetical sort is a coincidental match) |
