/**
 * 2026 FIFA World Cup bracket — console visualizer
 * Run in browser devtools or: node bracket2026.js
 */

const bracket = {
    match: 'FINAL · M104',
    sides: [
        {
            match: 'SF · M101',
            sides: [
                {
                    match: 'QF · M97',
                    sides: [
                        {
                            match: 'R16 · M89',
                            sides: [
                                { match: 'R32 · M73', teams: ['A2', 'B2'] },
                                { match: 'R32 · M75', teams: ['F1', 'C2'] },
                            ],
                        },
                        {
                            match: 'R16 · M90',
                            sides: [
                                { match: 'R32 · M74', teams: ['E1', '3°(ABCDF)'] },
                                { match: 'R32 · M77', teams: ['I1', '3°(CDFGH)'] },
                            ],
                        },
                    ],
                },
                {
                    match: 'QF · M98',
                    sides: [
                        {
                            match: 'R16 · M93',
                            sides: [
                                { match: 'R32 · M83', teams: ['K2', 'L2'] },
                                { match: 'R32 · M84', teams: ['H1', 'J2'] },
                            ],
                        },
                        {
                            match: 'R16 · M94',
                            sides: [
                                { match: 'R32 · M81', teams: ['D1', '3°(BEFIJ)'] },
                                { match: 'R32 · M82', teams: ['G1', '3°(AEHIJ)'] },
                            ],
                        },
                    ],
                },
            ],
        },
        {
            match: 'SF · M102',
            sides: [
                {
                    match: 'QF · M99',
                    sides: [
                        {
                            match: 'R16 · M91',
                            sides: [
                                { match: 'R32 · M76', teams: ['C1', 'F2'] },
                                { match: 'R32 · M78', teams: ['E2', 'I2'] },
                            ],
                        },
                        {
                            match: 'R16 · M92',
                            sides: [
                                { match: 'R32 · M79', teams: ['A1', '3°(CEFHI)'] },
                                { match: 'R32 · M80', teams: ['L1', '3°(EHIJK)'] },
                            ],
                        },
                    ],
                },
                {
                    match: 'QF · M100',
                    sides: [
                        {
                            match: 'R16 · M95',
                            sides: [
                                { match: 'R32 · M86', teams: ['J1', 'H2'] },
                                { match: 'R32 · M88', teams: ['D2', 'G2'] },
                            ],
                        },
                        {
                            match: 'R16 · M96',
                            sides: [
                                { match: 'R32 · M85', teams: ['B1', '3°(EFGIJ)'] },
                                { match: 'R32 · M87', teams: ['K1', '3°(DEIJL)'] },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
};

// ── collapsible tree (browser devtools) ──────────────────────────────────────

function printTree(node) {
    if (node.teams) {
        console.log(`⚽ ${node.match}:  ${node.teams[0]}  vs  ${node.teams[1]}`);
        return;
    }
    console.group(`▶ ${node.match}`);
    for (const child of node.sides) {
        printTree(child);
    }
    console.groupEnd();
}

console.log('');
console.log('════════════════════════════════════════════');
console.log('  2026 FIFA World Cup · R32 → Final bracket');
console.log('════════════════════════════════════════════');
printTree(bracket);

// ── flat ASCII bracket ────────────────────────────────────────────────────────

const ascii = `
R32                               R16          QF          SF        FINAL
──────────────────────────────────────────────────────────────────────────────
M73  A2       vs B2      ────┐
                              ├──── M89 ────┐
M75  F1       vs C2      ────┘             │
                                            ├──── M97 ────┐
M74  E1       vs 3°ABCDF ───┐             │              │
                              ├──── M90 ────┘              │
M77  I1       vs 3°CDFGH ───┘                             ├─── M101 ───┐
                                                           │             │
M83  K2       vs L2      ────┐                            │             │
                              ├──── M93 ────┐             │             │
M84  H1       vs J2      ────┘             │              │             │
                                            ├──── M98 ────┘             │
M81  D1       vs 3°BEFIJ ───┐             │                             │
                              ├──── M94 ────┘                            │
M82  G1       vs 3°AEHIJ ───┘                                            ├─── M104
                                                                         │
M76  C1       vs F2      ────┐                                          │
                              ├──── M91 ────┐                            │
M78  E2       vs I2      ────┘             │                             │
                                            ├──── M99 ────┐              │
M79  A1       vs 3°CEFHI ───┐             │              │              │
                              ├──── M92 ────┘              │              │
M80  L1       vs 3°EHIJK ───┘                             ├─── M102 ───┘
                                                           │
M86  J1       vs H2      ────┐                            │
                              ├──── M95 ────┐             │
M88  D2       vs G2      ────┘             │              │
                                            ├─── M100 ────┘
M85  B1       vs 3°EFGIJ ───┐             │
                              ├──── M96 ────┘
M87  K1       vs 3°DEIJL ───┘
`;

console.log(ascii);
