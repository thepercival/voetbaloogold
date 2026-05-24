# voetbaloogold
old jquery based voetbaloog

---

## Qualifier logic

### Competition season format types

The `seasonName` (year) determines the competition format. The `formatType` governs how many rounds exist and how many teams qualify between rounds.

| seasonName | formatType |
|------------|------------|
| 2026       | 1          |
| 2024       | 2          |
| 2021       | 2          |
| 2016       | 1          |

---

### Qualify rules

Qualify rules live between two consecutive rounds. They are stored in the `qualifyrules` table and linked to individual poule-places via the `qualifyrule_pouleplaces` table.

Each qualify rule has:

| field        | description |
|--------------|-------------|
| `confignr`   | `0` = single rule (1 fromPoulePlace → 1 toPoulePlace), `2` = multi rule (N fromPoulePlaces → M toPoulePlaces via bitmask) |
| `frompouleplaces` | ordered list of source poule-places |
| `topouleplaces`   | ordered list of destination poule-places |
| `config.display`  | (multi only) array of bitmasks, one per toPoulePlace; bit `j` set means `frompouleplaces[j]` can qualify to this toPoulePlace |

---

### Single rules (confignr = 0)

Each single rule maps exactly one `fromPoulePlace` to exactly one `toPoulePlace`.

For round 1 → round 2 the correct mapping **depends on the season** (see mapping tables below). The mapping determines which group winner/runner-up is placed in which round-of-32 slot.

Poule letters are global across all rounds:
- Round 1 poules: A–L (12 groups)
- Round 2 poules: M–AB (16 knockout matches × 2 places each: place 1 = "top" seed, place 2 = "bottom" seed)

---

### Multi rule (confignr = 2)

Used for the 8 best third-placed teams from round 1. There is exactly one multi rule per round transition where this applies.

`config.display` is a bitmask array indexed by `toPoulePlace` position. For each toPoulePlace `i`, the bitmask `display[i]` has bit `j` set when `frompouleplaces[j]` is a valid qualifier for that slot.

Example for formatType 1 (2026), 12 fromPoulePlaces, 8 toPoulePlaces:

```
display[0] = 31   (0b00011111) → frompouleplaces 0,1,2,3,4
display[1] = 62   (0b00111110) → frompouleplaces 1,2,3,4,5
display[2] = 124  (0b01111100) → frompouleplaces 2,3,4,5,6
display[3] = 248  (0b11111000) → frompouleplaces 3,4,5,6,7
...
```

The toPoulePlaces for the multi rule are those **not** covered by any single rule.

---

### Season-specific single-rule mappings

These mappings are used in `RemoveAddCSStructure` (handler) when building qualify rules for round 1 → round 2.  
The key is `seasonName`, the value is a map of `fromPoulePlace label → toPoulePlace label`.

#### formatType 1 — seasonName 2026 (round 1 → round 2)

> These are the FIFA-mandated round-of-32 bracket slot assignments.  
> Source: [2026 FIFA World Cup Wikipedia](https://en.wikipedia.org/wiki/2026_FIFA_World_Cup) — Round of 32, matches 73–88 in schedule order.  
> Place label format: `{pouleLetter}{placeNumber}` (e.g. `A1` = winner of group A, `B2` = runner-up of group B).
>
> **Numbers are 0-indexed** in the DB (poule.number 0–11 = groups A–L; poule.number 0–15 in round 2 = matches 73–88 in order).

| Match | fromPoulePlace | toPoulePlace | Notes |
|-------|---------------|-------------|-------|
| 73    | A2            | M1          | Runner-up A vs runner-up B |
| 73    | B2            | M2          | |
| 74    | E1            | N1          | Winner E vs 3rd (multi) |
| 75    | F1            | O1          | Winner F vs runner-up C |
| 75    | C2            | O2          | |
| 76    | C1            | P1          | Winner C vs runner-up F |
| 76    | F2            | P2          | |
| 77    | I1            | Q1          | Winner I vs 3rd (multi) |
| 78    | E2            | R1          | Runner-up E vs runner-up I |
| 78    | I2            | R2          | |
| 79    | A1            | S1          | Winner A vs 3rd (multi) |
| 80    | L1            | T1          | Winner L vs 3rd (multi) |
| 81    | D1            | U1          | Winner D vs 3rd (multi) |
| 82    | G1            | V1          | Winner G vs 3rd (multi) |
| 83    | K2            | W1          | Runner-up K vs runner-up L |
| 83    | L2            | W2          | |
| 84    | H1            | X1          | Winner H vs runner-up J |
| 84    | J2            | X2          | |
| 85    | B1            | Y1          | Winner B vs 3rd (multi) |
| 86    | J1            | Z1          | Winner J vs runner-up H |
| 86    | H2            | Z2          | |
| 87    | K1            | AA1         | Winner K vs 3rd (multi) |
| 88    | D2            | AB1         | Runner-up D vs runner-up G |
| 88    | G2            | AB2         | |

The 8 toPoulePlaces **not** covered by single rules (N2, Q2, S2, T2, U2, V2, Y2, AA2) are filled by the multi rule (confignr = 2) — the 8 best 3rd-placed teams.

**In code (0-indexed poule.number / placeplace.number):**

```
// [fromPoule.number][fromPlace.number] => [toPoule.number, toPlace.number]
0 => [0 => [6, 0], 1 => [0, 0]],   // A1→S1, A2→M1
1 => [0 => [12, 0], 1 => [0, 1]],  // B1→Y1, B2→M2
2 => [0 => [3, 0], 1 => [2, 1]],   // C1→P1, C2→O2
3 => [0 => [8, 0], 1 => [15, 0]],  // D1→U1, D2→AB1
4 => [0 => [1, 0], 1 => [5, 0]],   // E1→N1, E2→R1
5 => [0 => [2, 0], 1 => [3, 1]],   // F1→O1, F2→P2
6 => [0 => [9, 0], 1 => [15, 1]],  // G1→V1, G2→AB2
7 => [0 => [11, 0], 1 => [13, 1]], // H1→X1, H2→Z2
8 => [0 => [4, 0], 1 => [5, 1]],   // I1→Q1, I2→R2
9 => [0 => [13, 0], 1 => [11, 1]], // J1→Z1, J2→X2
10 => [0 => [14, 0], 1 => [10, 0]],// K1→AA1, K2→W1
11 => [0 => [7, 0], 1 => [10, 1]], // L1→T1, L2→W2
```

---

### Where the mapping is applied in code

| location | role |
|----------|------|
| `library/Voetbal/Command/Handler/RemoveAddCSStructure.php` | Reads `fromqualifyrules` from the posted JSON structure and persists qualify rules + poule-place links. Should apply the season-specific mapping to reorder `frompouleplaces ↔ topouleplaces` pairs before saving when `confignr = 0`. |
| `library/Voetbal/QualifyRule/Factory.php :: getConfig()` | Returns the 495-entry combination table for the multi rule (formatType 1, 12→8, confignr 2). |
| `library/Voetbal/Poule.php :: getDisplayName()` | Computes the global poule letter by summing poule counts from all preceding rounds. |
| `apps/controllers/voetbal/ApiController.php` | Debug block: logs all qualify rules for round 2 with resolved poule-place labels. Remove before production. |

