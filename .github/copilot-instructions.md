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

## Voorspellingen page — JS architecture

### Key globals (set by PHP, available in `custom.js`)
| Variable | Type | Description |
|----------|------|-------------|
| `g_oPool` | `VoetbalOog_Pool` | Full pool with competition season, rounds, poules, games, users, bets |
| `g_bBetsReadable` | bool | Whether current user may read others' bets |
| `g_bBetsEditable` | bool | Whether current user may fill in their own bets |
| `g_nBetViewRoundNr` | int | Round number to activate on load |
| `g_oNow` | Date | Current datetime |

### Two controls — never confuse them
| Control | JS file | Activated when | Purpose |
|---------|---------|----------------|---------|
| `Ctrl_BetView` | `BetView.js` | `g_bBetsReadable == true` | Read-only view of all users' bets |
| `Ctrl_BetEdit` | `BetEdit.js` | `g_bBetsEditable == true` | Editable view for the current user's bets |

Both can be active simultaneously (shown in "bekijken / invullen" tabs).

### Sentinel div
`<div id="page-pool-bets">` in `voorspellingen.phtml` is the guard that activates the pool-bets block in `custom.js`. Do not remove it.

### Nummers-3 ranking (BetEdit)
- Rendered inline into `div#thirdplace-ranking-{roundNumber}` (created by `BetEdit.js` `showGroupStage()`) — uses **bet-based scores** (`getClonedGamesFromUserBets`), only present when `g_bBetsEditable == true`
- Function: `updateThirdPlaceStandings(oRound, oRoundBetConfig, oContainer, bUseRealScores)`
  - `bUseRealScores === true` → uses `oPoule.getGames()` directly (real match scores, `oRoundBetConfig` ignored / pass `null`)
  - `bUseRealScores` falsy → uses `getClonedGamesFromUserBets(oPoule, oRoundBetConfig)` (user bet scores)
- Public method `this.showThirdPlaceRanking(oContainer)` on `Ctrl_BetEdit` — always calls with `bUseRealScores=true` (real scores for the modal)

### Nummers-3 modal knop (voorspellingen.phtml)
- Button `#btn-thirdplace-ranking` opens `#thirdplaceModal` → target div `#thirdplace-ranking-modal`
- `custom.js` click handler: calls `g_oRankableControl.showThirdPlaceRanking(oContainer)` when `g_bBetsEditable == true`, otherwise creates a temporary `Ctrl_BetEdit(g_oPoolUser, g_oNow, '')` (no `.show()`) and calls `showThirdPlaceRanking` on it
- **Real scores** are used in the modal in both modes

### Eliminated-team highlighting (BetView)
- In `showQualify()` (qualify-bets view, rounds 1+): a betted team gets `bg-danger` if it is **not** in `oTeamsInTheRace`
- `teamsInTheRace` is included in JSON only when the **entire first round (group stage) is fully played** — controlled by PHP flag `Voetbal_JSON::$nCompetitionSeason_TeamsInTheRace`
- During the group stage itself (while some poules still play), this mechanism does NOT apply; use `getToQualifyRule()` logic instead (see PoulePlace model section)

### VoetbalOog_Ranking is global
Can be instantiated from any JS file: `new VoetbalOog_Ranking(promotionRule)`. Takes actual OR cloned games.

## PoulePlace qualify-rule object model

A `PoulePlace` sits in a round. It can link to the **next** round (via `getToQualifyRule`) and can receive a team **from** the previous round (via `getFromQualifyRule`).

```
Round 0 (group stage)                   Round 1 (1/16 final)
──────────────────────────────────────────────────────────────
PoulePlace [pos 1]  ──toQualifyRule──►  QualifyRule_PoulePlace  ──►  PoulePlace [round-1 slot]
PoulePlace [pos 2]  ──toQualifyRule──►  QualifyRule_PoulePlace  ──►  PoulePlace [round-1 slot]
PoulePlace [pos 3]  ──toQualifyRule──►  QualifyRule_PoulePlace  ──►  PoulePlace [round-1 slot]
PoulePlace [pos 4]  ── null ──────────  (no rule → eliminated)
```

### PHP API
| Object | Method | Returns |
|--------|--------|---------|
| `Voetbal_PoulePlace` | `getToQualifyRule()` | `?Voetbal_QualifyRule_PoulePlace` — rule that links this place to the NEXT round; `null` = no path forward (immediately eliminated when poule is played) |
| `Voetbal_PoulePlace` | `getFromQualifyRule()` | `Voetbal_QualifyRule_PoulePlace` — rule that put a team INTO this slot from the previous round |
| `Voetbal_QualifyRule_PoulePlace` | `getFromPoulePlace()` | source poule place (current round) |
| `Voetbal_QualifyRule_PoulePlace` | `getToPoulePlace()` | destination poule place (next round) |
| `Voetbal_QualifyRule_PoulePlace` | `getQualifyRule()` | parent `Voetbal_QualifyRule` |
| `Voetbal_QualifyRule` | `getConfigNr()` | `0` = single rule (pos 1, 2), `1` = multi-poule rule (best-#3 type) |
| `Voetbal_QualifyRule` | `getFromRound()` / `getToRound()` | the two connected rounds |

### JS API (same semantics)
`oPoulePlace.getToQualifyRule()` / `oPoulePlace.getFromQualifyRule()` — both lazy-load via `VoetbalOog_QualifyRule_Factory()`.

### How to detect eliminated teams (PHP, group-stage view)
```php
$oToQR = $oPoulePlace->getToQualifyRule();
$pouleIsPlayed = $oPoulePlace->getPoule()->getState() === Voetbal_Factory::STATE_PLAYED;

if ($pouleIsPlayed && $oToQR === null) {
    // position 4 → immediately eliminated
}
if ($pouleIsPlayed && $oToQR !== null && $oToQR->getQualifyRule()->getConfigNr() === 1) {
    // position 3 with multi-poule rule:
    // only eliminated once ALL poules in the round are played AND
    // the team is NOT assigned to any round-1 poule place
    $roundIsPlayed = $oPoulePlace->getPoule()->getRound()->getState() === Voetbal_Factory::STATE_PLAYED;
    if ($roundIsPlayed) {
        $oTeam = $oPoulePlace->getTeam();
        $oNextRoundTeams = $oToQR->getToPoulePlace()->getPoule()->getRound()->getTeams();
        $eliminated = ($oTeam !== null && $oNextRoundTeams[$oTeam->getId()] === null);
    }
}
```

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
