# BetEdit Control — Architecture Reference

`Ctrl_BetEdit` is the main client-side UI controller for entering and saving pool predictions.
It is instantiated from PHP as `new Ctrl_BetEdit(oPoolUser, tsNow, sDivId)` and drives the
entire predictions page for one pool user.

---

## 1. Constructor parameters and private state

| Variable | Type | Purpose |
|---|---|---|
| `m_sDivId` | string | `id` of the root `<div>` that the control owns |
| `m_oPoolUser` | object | `VoetbalOog_PoolUser` — source of bets and pool/competition data |
| `m_oNow` | Date | current timestamp; used for deadline checks |
| `m_nNrOfBetsDone` | number | running total of filled bets across all rounds |
| `m_arrBetsDonePerRound` | `{roundNr: n}` | filled bets per round tab |
| `m_arrBetsAvailablePerRound` | `{roundNr: n}` | available bets per round tab |
| `m_vtOldValue` | number\|null | team-id of the previously checked radio; used to compute `nDelta` |
| `m_sControlPrefix` | string | `'_control_id_'` — separator in control-name strings |

---

## 2. Control ID scheme

Every form input (radio, hidden, select) is identified by a name built as:

```
{m_sDivId}_control_id_{roundBetConfigId}_{poulePlaceId}
```

- `roundBetConfigId` ties the input to a specific `VoetbalOog_Round_BetConfig`.
- `poulePlaceId` ties the input to a specific `VoetbalOog_PoulePlace`.
- `getControlId(oRoundBetConfig, oPoulePlace, sPostfix)` builds this string.
- `getRoundBetConfigFromControlId` and `getObjectIdFromControlId` parse it back.

---

## 3. Data model — how bets are held in memory

Bets live inside `m_oPoolUser` and are accessed via:

```javascript
var oBets = m_oPoolUser.getBets( oRoundBetConfig );
// oBets is a plain object keyed by poulePlaceId → VoetbalOog_Bet_* instance
```

### Bet types used by BetEdit

| Class | `nId` | Stores |
|---|---|---|
| `VoetbalOog_Bet_Score` | — | home/away goal scores for a group-stage game |
| `VoetbalOog_Bet_Result` | — | derived result: 1 (home win) / 0 (draw) / -1 (away win) |
| `VoetbalOog_Bet_Qualify` | — | team-id of the team predicted to qualify to a poule place |

`VoetbalOog_Bet_Qualify` relevant API:

```javascript
oBet.getTeam()           // returns VoetbalOog_Team (lazy-loads from stored id) or null
oBet.putTeam(vtTeamId)   // stores team id (number) or null; a=vtTeamId
```

New bets are created on the fly when the user first interacts:

```javascript
oBet = VoetbalOog_Bet_Factory().createObject( nBetType );
oBet.putId( "__NEW__" + poulePlaceId );
oBet.putPoolUser( m_oPoolUser );
oBet.putRoundBetConfig( oRoundBetConfig );
oBet.putPoulePlace( oPoulePlace );
oBets[ poulePlaceId ] = oBet;
```

---

## 4. Rendering pipeline

### 4.1 Entry point — `this.show()`

1. Clears the root `<div>`.
2. Collects *eligible rounds*: rounds whose pool end-date has not yet passed **and** that have at least one game.
3. For every eligible knockout round (round ≥ 1) calls `fillQualifierBetsData(roundId)` to pre-populate in-memory qualify bets from group-stage score predictions. This makes team names available before the DOM is built.
4. Builds a Bootstrap tab-nav (`<ul id="betedit-roundnav">`) and a `<div class="tab-content">` — one tab per eligible round.
5. Renders each tab pane by calling `showRound(oPane, oRound)`.
6. Appends a save button per knockout tab.
7. Calls `updateBetsDoneTotals()` to set the counter badge.
8. Determines the default active tab (`getDefaultActiveTabId`) and activates it via jQuery.
9. Restores a post-save tab from `sessionStorage` if present.

### 4.2 `showRound(oContainer, oRound)`

Distinguishes two layouts:

| Round type | Condition | Layout |
|---|---|---|
| Group-stage (round 0) | `oRoundBetConfigs[VoetbalOog_Bet_Qualify.nId] == undefined` | One `showPoule()` block per poule, each with a games table + ranking sidebar |
| Knockout (rounds 1+) | `oRoundBetConfigs[VoetbalOog_Bet_Qualify.nId] != undefined` | Poules ordered by `getOrderedKnockoutPoules()`, rendered into a shared `<table>` via `showPouleGames()` |

For round 0 a "stand nummers 3" (best third-place ranking) is appended at the bottom via `updateThirdPlaceStandings`.

### 4.3 `showPoule(oContainer, oPoule, oRoundBetConfigs)`

Used only for group-stage poules (`needsRanking() == true`).  
Produces a two-column layout: games table on the left, ranking panel (hidden-xs) on the right.

### 4.4 `showPouleGames(oTable, oPoule, oRoundBetConfigs)`

Iterates `oPoule.getGamesByDate()` and inserts one `<tr>` per game.

- Group-stage game → calls `createPoulePlaceControl` (home) + `createResultControl` (score) + `createPoulePlaceControl` (away).
- Knockout game → calls `renderKnockoutGameCells`.

### 4.5 `renderKnockoutGameCells(oRow, oGame, oRoundBetConfigs)` ← core of knockout UI

This is the most complex rendering function. For one knockout game it:

1. Reads the current-round `VoetbalOog_Bet_Qualify` bets for the home and away poule places to get `oHomeTeam` / `oAwayTeam`.
2. Finds the next-round destination poule place via `getToQualifyRules()` and reads the **winner-pick bet** (`oWinnerTeam`) from next-round bets.
3. Builds three cells: home label, score " - ", away label.

**`appendTeamCell(oCell, oTeam, oPoulePlace, bIsHome)` (inner function):**

- If deadline not yet passed and both teams known (`bCanShowRadio == true`):
  - Creates a `<label class="btn btn-sm btn-default">` with an embedded `<input type="radio">`.
  - Radio `name` = the *next-round* `sControlId` (winner-pick slot).
  - Radio `value` = `oTeam.getId()`.
  - Radio is pre-checked/label gets `active` class if `oWinnerTeam.getId() == oTeam.getId()`.
  - Appends a `<input type="hidden" name="{currentRoundControlId}" value="{teamId}">` so the current-round qualifier bet is submitted with the form too.
  - `onchange` → calls `updateBetQualifyFromRadio(this)`.
- If deadline passed or teams unknown: static team name or poule-place placeholder; hidden input only if team is known.

**Bet counting (`bCountCurrentQualify`):**

The current-round qualify bet (team assigned to a poule place) is counted only for the **first knockout round** tab. For later rounds the same bet was already counted as a winner-pick radio in the previous tab. `bCountCurrentQualify` is `true` only when the previous round has no qualify bet config (i.e., previous round is the group stage).

---

## 5. Knockout qualifier data flow

```
Group-stage score edit
       │
       ▼
rebuildKnockoutQualifiersFromGroups()
       │
       ├─ snapshot round-1 bet team-ids (oOldTeamIds)
       │
       ├─ fillQualifierBetsData(roundId)   ← for every round ≥ 1
       │      reads previous-round score bets, re-derives which team qualifies
       │      via getTeamFromQualifyRule(), writes into m_oPoolUser bet objects
       │      (null if team no longer qualifies)
       │
       ├─ compare new vs old round-1 bet teams
       │      for each changed slot:
       │          propagateQualifyTeamChange(round1, oldId, newId)
       │
       └─ rerenderRoundPaneChain(round1)   ← re-renders all knockout tabs
```

### `fillQualifierBetsData(nRoundId)`

- Pure in-memory operation; no DOM writes.
- Clones group-stage games, applies score-bets, runs `VoetbalOog_Ranking` to produce standings.
- Calls `getTeamFromQualifyRule(oPoulePlace, oClonedGamesPerPoule, oRanking)` per poule place.
- If the derived team differs from what is stored: calls `oBet.putTeam(newTeamId)` (or `putTeam(null)` if the team no longer qualifies).

### `propagateQualifyTeamChange(oStartRound, nOldTeamId, nNewTeamId)`

Walks `oStartRound.getNext()`, `getNext().getNext()`, … through all later rounds.  
For each round, scans all qualify bets; when `oBet.getTeam().getId() == nOldTeamId`:

1. `oBet.putTeam(nNewTeamId)` — updates in-memory bet.
2. Updates the radio DOM for that slot: re-labels the old radio's `<label>` if `nNewTeamId` is a real team, un-checks all radios, pre-checks the new one.
3. Updates hidden inputs for that slot.

If `nOldTeamId == null` the function returns immediately (nothing to chase).  
If `nNewTeamId == null` the radios are all unchecked and the hidden input is cleared.

### `rerenderRoundPaneChain(oRound)`

Calls `rerenderRoundPane` for the given round and every subsequent round.

### `rerenderRoundPane(oRound)`

1. Subtracts the old per-round bet counts from the running totals.
2. Resets `m_arrBetsDonePerRound[roundNr]` and `m_arrBetsAvailablePerRound[roundNr]` to 0.
3. Clears the pane's DOM children.
4. Re-calls `showRound(oPane, oRound)` — which re-reads the (now updated) in-memory bets.
5. Appends a save button.

---

## 6. User interaction handlers

### Score edit (group stage) — `createResultControl`

- Renders two `<input type="number">` fields (home/away score).
- `onchange` → `updateBetScore(oControl)`:
  - Writes score into `VoetbalOog_Bet_Score`.
  - Derives and writes `VoetbalOog_Bet_Result`.
  - Calls `rebuildKnockoutQualifiersFromGroups()`.
  - Updates poule ranking + third-place standings inline (no tab re-render needed).

### Knockout winner-pick radio — `updateBetQualifyFromRadio(oRadio)`

- Parses `oRadio.name` to find `roundBetConfigId` and `poulePlaceId`.
- Creates or updates the `VoetbalOog_Bet_Qualify` bet.
- Syncs the hidden input for that slot.
- Calls `propagateQualifyTeamChange(round, oldId, newId)` to cascade the change into later rounds.
- Calls `rerenderRoundPaneChain(round.getNext())` to refresh later tabs.

### Qualify radio (group-stage → round-1 slot) — `updateBetQualify(oControl)`

Same flow as above but triggered from the poule-ranking radio in the group-stage tab.

---

## 7. Bet counting

```
m_nNrOfBetsDone                     global running total
m_arrBetsDonePerRound[roundNr]      per-tab filled count
m_arrBetsAvailablePerRound[roundNr] per-tab total slots
```

`updateBetsToDo(nDelta, oDiv, bUpdateTotals)`:

- `nDelta == 1` → a new bet was just filled; increment counts.
- `nDelta == -1` → a bet was cleared; decrement.
- `nDelta == null` → slot exists but is unfilled; only available-count is incremented.
- `bUpdateTotals == false` → called during initial render; increments both available and done arrays.
- `bUpdateTotals == true` → called on user interaction; increments only done arrays, then updates the badge.

`updateBetsDoneTotals()` refreshes the `#betedit-todolabel` badge (`nDone/nTotal ingevuld`, red/green).

---

## 8. Tab navigation

- Tabs are Bootstrap 3 `nav-tabs`.
- Pane ids follow `betedit-roundnr-{roundNumber}`.
- Tabs start as `disabled`; `getDefaultActiveTabId` activates the correct one on load:
  1. First incomplete round (some bets done but not all).
  2. Otherwise first empty round.
  3. Otherwise last complete round.
- After a form submit the active tab id is saved to `sessionStorage` and restored on reload.
- `storePostSaveTab` is called from the save-button `onclick`; it advances to the next tab automatically if the current round is fully filled.

---

## 9. Bracket structure — the `ToQualifyRule` data model

Both `getOpponentPouleName` and `getOrderedKnockoutPoules` are built entirely on one data
structure: the **`ToQualifyRule`** objects returned by `oRound.getToQualifyRules()`.

Each rule describes one "feed":

```
ToQualifyRule
  .getFromPoules()      → { pouleId: VoetbalOog_Poule, … }
                           the current-round poule(s) whose winner feeds this slot
  .getToPoulePlaces()   → [ VoetbalOog_PoulePlace, … ]
                           the destination place in the NEXT round's poule
                           arrDest[0].getPoule()  → next-round poule
                           arrDest[0].getId()     → place id (lower = home slot)
  .getToRound()         → the next round
```

For round 1 (16 games, 16 poules) there are 16 rules — one per poule.
Two rules share the same destination poule in round 2; those two are the "bracket pair".

### How the "vs" column is calculated — `getOpponentPouleName(oPoule)`

Goal: given poule M, return the name of its bracket opponent (e.g. "O").

```
Step 1 — find oDestPoule
  Walk all ToQualifyRules of oPoule.getRound().
  Find the rule where getFromPoules() contains oPoule.
  oDestPoule = rule.getToPoulePlaces()[0].getPoule()
               → the round-2 poule that M's winner feeds into

Step 2 — find the other current-round poule that feeds the same oDestPoule
  Walk all ToQualifyRules again.
  Skip the rule already used in step 1.
  For each other rule: if getToPoulePlaces()[0].getPoule().getId() == oDestPoule.getId()
      → this rule's getFromPoules() holds the opponent poule
      → return VoetbalOog_Poule_Factory().getName( opponentPoule )
```

Concrete example (round 1, WC 2026):

```
Rule A: fromPoules={M} → toPoulePlace=round2-poule-α place 1 (home)
Rule B: fromPoules={O} → toPoulePlace=round2-poule-α place 2 (away)

getOpponentPouleName(M):
  step 1 → oDestPoule = round2-poule-α   (via rule A)
  step 2 → rule B also targets round2-poule-α, its fromPoule is O
  → returns "O"

getOpponentPouleName(O):
  step 1 → oDestPoule = round2-poule-α   (via rule B)
  step 2 → rule A also targets round2-poule-α, its fromPoule is M
  → returns "M"
```

The "vs" column header cell in `showPouleGamesHeaders` is blank for knockout rounds;
the cell per game row calls `getOpponentPouleName(oPoule)` and renders the result.

---

## 9b. Knockout bracket ordering — `getOrderedKnockoutPoules(oRound)`

Uses the same `ToQualifyRules` to sort current-round poules in visual bracket order so that
adjacent rows in the table are always the two games whose winners meet next.

**Algorithm (bottom-up recursion):**

```
Base case: single poule → return [poule]

Recursive case:
  1. Build oFromPouleToDestInfo from ToQualifyRules:
       for each rule: fromPouleId → { destPouleId, destPlaceId (= place id in next round) }

  2. Recursively call getOrderedKnockoutPoules(nextRound)
       → arrNextOrdered: next-round poules in their bracket order

  3. Group current-round poules by destPouleId:
       oGroups[destPouleId] = [ {fromPouleId, destPlaceId}, … ]
     Sort each group by destPlaceId ascending:
       lower destPlaceId = home slot (rendered first / left)
       higher destPlaceId = away slot (rendered second / right)

  4. Build result by following arrNextOrdered:
       for each nextPoule in arrNextOrdered:
           append oGroups[nextPoule.getId()] in sorted order
```

**Why this gives the correct bracket:**

The final has one poule. Its two slots come from two semi-final poules. Each semi-final poule
comes from two quarter-final poules, etc. By always sorting by `destPlaceId`, home contributors
appear before away contributors — matching the home/away assignment already stored in the data.

**Concrete example (WC 2026, round 1 → round 2):**

```
round-2 bracket order (from getOrderedKnockoutPoules on round 2):
  [α, β, γ, δ, …]   (8 quarter-final poules in bracket order)

round-1 rules (simplified):
  M → α place 1,  O → α place 2
  N → β place 1,  P → β place 2
  …

getOrderedKnockoutPoules(round 1):
  oGroups[α] = [{M, place1}, {O, place2}]  → sorted: [M, O]
  oGroups[β] = [{N, place1}, {P, place2}]  → sorted: [N, P]
  follow arrNextOrdered = [α, β, …]:
    → result: [M, O, N, P, …]
```

Table rows are therefore: M-game, O-game, N-game, P-game — so each pair of rows is one
bracket match-up and the "vs" column confirms it visually.

---

## 10. Key helper functions

| Function | Purpose |
|---|---|
| `fillQualifierBetsData(nRoundId)` | Re-derives qualify bets from score predictions; pure memory, no DOM |
| `getTeamFromQualifyRule(oPoulePlace, oGamesPerPoule, oRanking)` | Returns the team that qualifies for a poule place given current score predictions, or null |
| `getClonedGames(oPoule, oBetConfig)` | Produces game clones with scores set from stored bets for ranking calculations |
| `refreshOptionsForQualifying(oToQualifyRules, oPoule)` | Updates radio option labels in next-round slots when a team changes |
| `getOrderedKnockoutPoules(oRound)` | Bracket-ordered poule list for correct visual bracket rendering |
| `getOpponentPouleName(oPoule)` | Returns the name of the bracket-opponent poule for column labelling |

---

## 11. Recommended architectural improvements

The items below are ordered from highest to lowest impact on stability, debuggability, and
maintainability. None requires rewriting the whole file at once — each is an independent step.

---

### 11.1 Separate the data layer from the view layer  ★ highest impact

**Current problem:**  
`propagateQualifyTeamChange` and `fillQualifierBetsData` mix business logic (which team goes
where) with DOM mutations (updating radios, hidden inputs, labels) in the same pass. When a
bug exists in the DOM path it is hard to tell whether the data is also wrong or only the
display.

**Recommended change:**  
Split every update into two explicit phases:

```
Phase 1 — data only (no DOM touches):
  fillQualifierBetsData()        → updates m_oPoolUser bets in memory
  propagateQualifyTeamChange()   → cascades team-id changes through later rounds in memory

Phase 2 — render from data (reads memory, writes DOM):
  rerenderRoundPaneChain()       → rebuilds each tab pane from the (now correct) bets
```

`propagateQualifyTeamChange` should become data-only and drop all radio/hidden-input code.
`rerenderRoundPaneChain` already re-reads bets from memory when it calls `showRound`, so
after phase 1 is correct, phase 2 will always produce the right DOM automatically.
This also eliminates the need to keep hidden inputs in sync manually in the propagation step.

---

### 11.2 Remove `m_vtOldValue` shared mutable state

**Current problem:**  
`m_vtOldValue` is a single module-level variable that stores the previously selected radio
value. It is set on `onfocus`, read on `onchange`, and reused across all radios. If two
events fire close together (e.g. programmatic triggers), it gives the wrong delta.

**Recommended change:**  
Capture the old value at the moment the control is created, as a closure variable per radio
group. Example:

```javascript
// At render time, capture the current winner for this control slot:
var nCapturedOldValue = ( oWinnerTeam != null ) ? oWinnerTeam.getId() : -1;

oRadio.onchange = function() {
    var nOld = nCapturedOldValue;
    nCapturedOldValue = parseInt( this.value, 10 );
    updateBetQualifyFromRadio( this, nOld );
};
```

Then `updateBetQualifyFromRadio` receives `nOldTeamId` directly instead of reading the
global `m_vtOldValue`. This makes every handler self-contained and testable in isolation.

---

### 11.3 Make bet-count tracking derived, not accumulated

**Current problem:**  
`m_nNrOfBetsDone`, `m_arrBetsDonePerRound`, and `m_arrBetsAvailablePerRound` are incremented
and decremented throughout rendering and interaction. Any mismatch (e.g. a re-render that
forgets to subtract first) causes the badge to show wrong counts, which has already required
several fixes.

**Recommended change:**  
Count bets by inspecting `m_oPoolUser.getBets()` directly at display time instead of
maintaining counters:

```javascript
function countBetsForRound( oRound ) {
    var nDone = 0, nAvailable = 0;
    var oBetConfig = m_oPoolUser.getPool().getBetConfigs( oRound )[ VoetbalOog_Bet_Qualify.nId ];
    if ( !oBetConfig ) return { done: 0, available: 0 };
    var oBets = m_oPoolUser.getBets( oBetConfig );
    for ( var sId in oBets ) {
        if ( !oBets.hasOwnProperty(sId) ) continue;
        nAvailable++;
        if ( oBets[sId] != null && oBets[sId].getTeam() != null ) nDone++;
    }
    return { done: nDone, available: nAvailable };
}
```

Call this from `updateBetsDoneTotals` instead of reading the accumulated arrays.
The accumulated arrays can then be removed entirely.

---

### 11.4 Give `VoetbalOog_Bet_Qualify.getTeam()` a clear null contract

**Current problem:**  
`getTeam()` lazy-loads a team object when the stored value is a number, and returns null when
it is null. But `putTeam(null)` stores null, and `putTeam(numericId)` stores a number. The
calling code must handle both the "team object" case and the "number" case, and null-checks
are spread everywhere.

**Recommended change:**  
Normalise at the boundaries. Either:
- `putTeam` always stores an object (resolve the id immediately), or
- `getTeam` always returns null or a resolved object (never a raw number).

Document the contract explicitly so the calling code can rely on it. This eliminates the
lazy-load branch and makes the null check `oBet.getTeam() == null` unambiguous throughout
`propagateQualifyTeamChange` and `renderKnockoutGameCells`.

---

### 11.5 Add a structured debug mode

**Current problem:**  
When something goes wrong (wrong team in a round, counter off by one), there is no way to
inspect the internal state without adding `console.log` calls manually each time.

**Recommended change:**  
Add a single flag and a dump function:

```javascript
var m_bDebug = false;

this.enableDebug = function() { m_bDebug = true; };

function dbg( sLabel, oData ) {
    if ( !m_bDebug ) return;
    console.group( '[BetEdit] ' + sLabel );
    console.log( oData );
    console.groupEnd();
}
```

Then insert `dbg(...)` calls at the start of `fillQualifierBetsData`, `propagateQualifyTeamChange`,
and `rerenderRoundPane`. In production `m_bDebug` stays false and there is zero overhead.
Enable from the browser console with `oBetEditInstance.enableDebug()`.

---

### 11.6 Replace string-parsing control IDs with a lookup map

**Current problem:**  
`getRoundBetConfigFromControlId` and `getObjectIdFromControlId` parse the control name string
with `substr` and `indexOf`. This is fragile — any change to `getControlId`'s format silently
breaks all handlers.

**Recommended change:**  
Maintain a map from control-id string → `{oRoundBetConfig, oPoulePlace}` at render time:

```javascript
var m_oControlMap = {}; // sControlId → { oRoundBetConfig, oPoulePlace }

// in getControlId():
m_oControlMap[sRetval] = { oRoundBetConfig: oRBC, oPoulePlace: oPP };
return sRetval;
```

Handlers then do `m_oControlMap[oRadio.name]` instead of parsing the string.
Clear the map entries for a round in `rerenderRoundPane` before rebuilding.

---

### 11.7 Consolidate the two `fillQualifierBetsData` call sites

**Current problem:**  
`fillQualifierBetsData` is called once in `this.show()` (before rendering) and again
implicitly via `rerenderRoundPane` → `showRound` (which reads the bets but does not itself
call fill). The rebuild path (`rebuildKnockoutQualifiersFromGroups`) calls it explicitly too.
It is easy to miss a call site and render stale data.

**Recommended change:**  
Make `rerenderRoundPane` always call `fillQualifierBetsData(oRound.getId())` for knockout
rounds at the top of the function, before clearing the DOM. This makes re-renders
self-contained and removes the need to remember to call fill beforehand.
