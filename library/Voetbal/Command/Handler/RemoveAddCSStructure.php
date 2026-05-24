<?php

/**
 * Created by PhpStorm.
 * User: coen
 * Date: 30-11-15
 * Time: 16:44
 */

class Voetbal_Command_Handler_RemoveAddCSStructure
{
    public function handle(Voetbal_Command_RemoveAddCSStructure $command)
    {
        $oRoundDbWriter = Voetbal_Round_Factory::createDbWriter();
        $oPouleDbWriter = Voetbal_Poule_Factory::createDbWriter();
        $oPoulePlaceDbWriter = Voetbal_PoulePlace_Factory::createDbWriter();
        $oQualifyRuleDbWriter = Voetbal_QualifyRule_Factory::createDbWriter();
        $oPPQualifyRuleDbWriter = Voetbal_QualifyRule_PoulePlace_Factory::createDbWriter();

        $oRounds = $command->getCompetitionSeason()->getRounds();
        $arrTeamsOldFirstRound = null;
        if ($command->getCompetitionSeason()->getAssociation() === null and $oRounds->first() !== null) {
            $arrTeamsOldFirstRound = $oRounds->first()->getTeamsByPlace();
        }

        $oRounds->addObserver($oRoundDbWriter);
        $oRounds->flush(); // cascade delete

        $oPoules = Voetbal_Poule_Factory::createObjects();
        $oPoules->addObserver($oPouleDbWriter);

        $oPoulePlaces = Voetbal_PoulePlace_Factory::createObjects();
        $oPoulePlaces->addObserver($oPoulePlaceDbWriter);

        $oQualifyRules = Voetbal_QualifyRule_Factory::createObjects();
        $oQualifyRules->addObserver($oQualifyRuleDbWriter);

        $oPPQualifyRules = Voetbal_QualifyRule_PoulePlace_Factory::createObjects();
        $oPPQualifyRules->addObserver($oPPQualifyRuleDbWriter);

        // Season-specific qualify-rule mappings.
        // Keyed first by season name (e.g. '2026'), then by fromRound number (0-based).
        // Add a new top-level key to support additional seasons/tournaments.
        //
        // Round 0→1 (groups→R32):
        //   'singleRule': [fromPoule][fromPlace] => [toPoule, toPlace]
        //     (confignr=0, #frompouleplaces == #topouleplaces → 1:1 mapping by place)
        //   'multiRuleTo': [toPoule, toPlace] per best-3rd-place slot index 0-7.
        //     (confignr≠0, ordered to match getConfig(12,8,1) display array)
        // Rounds 1→2, 2→3, 3→4, 4→5 (R32→R16, R16→QF, QF→SF, SF→Final):
        //   'singleRule': [fromPoule] => [toPoule, toPlace]
        //     (confignr=0, #frompouleplaces > #topouleplaces → winner-only mapping)
        // Based on 2026 FIFA World Cup bracket.
        $arrSeasonSpecificMappings = [
            '2026' => [
                0 => [  // groups (round 0) → R32 (round 1)
                    'singleRule' => [
                        0  => [0 => [7, 0],  1 => [0, 0]],   // A1→T1,  A2→M1
                        1  => [0 => [12, 0], 1 => [0, 1]],   // B1→Y1,  B2→M2
                        2  => [0 => [3, 0],  1 => [2, 1]],   // C1→P1,  C2→O2
                        3  => [0 => [6, 0],  1 => [15, 0]],  // D1→S1,  D2→AB1
                        4  => [0 => [1, 0],  1 => [5, 0]],   // E1→N1,  E2→R1
                        5  => [0 => [2, 0],  1 => [3, 1]],   // F1→O1,  F2→P2
                        6  => [0 => [8, 0],  1 => [15, 1]],  // G1→U1,  G2→AB2
                        7  => [0 => [11, 0], 1 => [13, 1]],  // H1→X1,  H2→Z2
                        8  => [0 => [9, 0],  1 => [5, 1]],   // I1→V1,  I2→R2
                        9  => [0 => [13, 0], 1 => [11, 1]],  // J1→Z1,  J2→X2
                        10 => [0 => [14, 0], 1 => [10, 0]],  // K1→AA1, K2→W1
                        11 => [0 => [4, 0],  1 => [10, 1]],  // L1→Q1,  L2→W2
                    ],
                    // Positions 0-7 must align with getConfig(12,8,1)'s hardcoded display array:
                    // display = [436, 880, 818, 47, 913, 236, 2840, 1936]
                    // decoded: [CEFHI, EFGIJ, BEFIJ, ABCDF, AEHIJ, CDFGH, DEIJL, EHIJK]
                    'multiRuleTo' => [
                        [7, 1],   // T2  → display[0]=436  = CEFHI
                        [12, 1],  // Y2  → display[1]=880  = EFGIJ
                        [6, 1],   // S2  → display[2]=818  = BEFIJ
                        [1, 1],   // N2  → display[3]=47   = ABCDF
                        [8, 1],   // U2  → display[4]=913  = AEHIJ
                        [9, 1],   // V2  → display[5]=236  = CDFGH
                        [14, 1],  // AA2 → display[6]=2840 = DEIJL
                        [4, 1],   // Q2  → display[7]=1936 = EHIJK
                    ],
                ],
                1 => [  // R32 (round 1) → R16 (round 2); winner of each match advances
                    // R32 match order 73-88 = R32 poules 0-15
                    'singleRule' => [
                        0  => [0, 0],   // W(M73/M)  → R16-M89 poule 0 place 0
                        1  => [1, 0],   // W(M74/N)  → R16-M90 poule 1 place 0
                        2  => [0, 1],   // W(M75/O)  → R16-M89 poule 0 place 1
                        3  => [2, 0],   // W(M76/P)  → R16-M91 poule 2 place 0
                        4  => [3, 1],   // W(M80/Q)  → R16-M92 poule 3 place 1
                        5  => [2, 1],   // W(M78/R)  → R16-M91 poule 2 place 1
                        6  => [5, 0],   // W(M81/S)  → R16-M94 poule 5 place 0
                        7  => [3, 0],   // W(M79/T)  → R16-M92 poule 3 place 0
                        8  => [5, 1],   // W(M82/U)  → R16-M94 poule 5 place 1
                        9  => [1, 1],   // W(M77/V)  → R16-M90 poule 1 place 1
                        10 => [4, 0],   // W(M83/W)  → R16-M93 poule 4 place 0
                        11 => [4, 1],   // W(M84/X)  → R16-M93 poule 4 place 1
                        12 => [7, 0],   // W(M85/Y)  → R16-M96 poule 7 place 0
                        13 => [6, 0],   // W(M86/Z)  → R16-M95 poule 6 place 0
                        14 => [7, 1],   // W(M87/AA) → R16-M96 poule 7 place 1
                        15 => [6, 1],   // W(M88/AB) → R16-M95 poule 6 place 1
                    ],
                ],
                2 => [  // R16 (round 2) → QF (round 3); winner of each match advances
                    // R16 match order 89-96 = R16 poules 0-7
                    'singleRule' => [
                        0 => [0, 0],   // W(M89) → QF-M97  poule 0 place 0
                        1 => [0, 1],   // W(M90) → QF-M97  poule 0 place 1
                        2 => [2, 0],   // W(M91) → QF-M99  poule 2 place 0
                        3 => [2, 1],   // W(M92) → QF-M99  poule 2 place 1
                        4 => [1, 0],   // W(M93) → QF-M98  poule 1 place 0
                        5 => [1, 1],   // W(M94) → QF-M98  poule 1 place 1
                        6 => [3, 0],   // W(M95) → QF-M100 poule 3 place 0
                        7 => [3, 1],   // W(M96) → QF-M100 poule 3 place 1
                    ],
                ],
                3 => [  // QF (round 3) → SF (round 4); winner of each match advances
                    // QF match order 97-100 = QF poules 0-3
                    'singleRule' => [
                        0 => [0, 0],   // W(M97)  → SF-M101 poule 0 place 0
                        1 => [0, 1],   // W(M98)  → SF-M101 poule 0 place 1
                        2 => [1, 0],   // W(M99)  → SF-M102 poule 1 place 0
                        3 => [1, 1],   // W(M100) → SF-M102 poule 1 place 1
                    ],
                ],
                4 => [  // SF (round 4) → Final (round 5); winner of each match advances
                    // SF match order 101-102 = SF poules 0-1
                    'singleRule' => [
                        0 => [0, 0],   // W(M101) → Final-M104 poule 0 place 0
                        1 => [0, 1],   // W(M102) → Final-M104 poule 0 place 1
                    ],
                ],
            ],
        ];

        $sSeasonName = $command->getCompetitionSeason()->getSeason()?->getName() ?? '';
        $arrSeasonMapping = $arrSeasonSpecificMappings[$sSeasonName] ?? null;

        $nIdIt = 0;
        // var_dump( $arrCompetitionSeason );
        $oPreviousRound = null;
        $arrPPLookup = []; // [roundNumber][pouleNumber][placeNumber] => $oPoulePlace
        $arrStructure = $command->getCSStructure();
        $arrRounds = $arrStructure["rounds"];
        foreach ($arrRounds as $arrRound) {
            $oRound = Voetbal_Round_Factory::createObject();
            $sId = array_key_exists('$$hashKey', $arrRound) ? $arrRound['$$hashKey'] : "__NEW__" . $nIdIt++;
            $oRound->putId($sId);
            $oRound->putCompetitionSeason($command->getCompetitionSeason());
            // $oRound->putName( "tmp".$arrRound['$$hashKey'] );
            $oRound->putNumber($arrRound["number"]);
            $oRound->putSemiCompetition($arrRound["semicompetition"]);
            $oRounds->add($oRound);

            $arrPoules = $arrRound["poules"];
            foreach ($arrPoules as $arrPoule) {
                // $sHashKey = "WINNER"  // $arrRound["type"]
                $sId = array_key_exists('$$hashKey', $arrPoule) ? $arrPoule['$$hashKey'] : "__NEW__" . $nIdIt++;
                $oPoule = Voetbal_Poule_Factory::createObject();
                $oPoule->putId($sId);
                $oPoule->putNumber($arrPoule["number"]);
                $oPoule->putRound($oRound);
                // $oPoule->putName();
                $oPoules->add($oPoule);

                // Kopieer pouleplaces
                $arrPoulePlaces = $arrPoule["places"];
                foreach ($arrPoulePlaces as $arrPoulePlace) {
                    $sId = array_key_exists('$$hashKey', $arrPoulePlace) ? $arrPoulePlace['$$hashKey'] : "__NEW__" . (array_key_exists('id', $arrPoulePlace) ? $arrPoulePlace['id'] : $nIdIt++);
                    $oPoulePlace = Voetbal_PoulePlace_Factory::createObject();
                    $oPoulePlace->putId($sId);
                    $oPoulePlace->putPoule($oPoule);
                    $oPoulePlace->putNumber($arrPoulePlace["number"]);
                    $oPoulePlace->putPenaltyPoints(0);
                    $oPoulePlaces->add($oPoulePlace);
                    $arrPPLookup[$arrRound["number"]][$arrPoule["number"]][$arrPoulePlace["number"]] = $oPoulePlace;
                }
            }

            // Kopieer qualifyrules
            if ($oPreviousRound !== null) {
                $arrQualifyRules = $arrRound["fromqualifyrules"];
                $nPrevRoundNr = $oPreviousRound->getNumber();
                $arrRoundMapping = $arrSeasonMapping[$nPrevRoundNr] ?? null;
                $arrActiveSingleRuleMapping = $arrRoundMapping['singleRule'] ?? null;
                $arrActiveMultiRuleToPlaces = $arrRoundMapping['multiRuleTo'] ?? null;
                foreach ($arrQualifyRules as $arrQualifyRule) {
                    $oQualifyRule = Voetbal_QualifyRule_Factory::createObject();
                    $oQualifyRule->putId($oPreviousRound->getId() . $oRound->getId() . $oQualifyRules->count());
                    $oQualifyRule->putFromRound($oPreviousRound);
                    $oQualifyRule->putToRound($oRound);
                    $oQualifyRule->putConfigNr($arrQualifyRule["confignr"]);
                    $oQualifyRules->add($oQualifyRule);

                    for ($nI = 0; $nI < count($arrQualifyRule["frompouleplaces"]); $nI++) {
                        $arrFromPoulePlace = $arrQualifyRule["frompouleplaces"][$nI];
                        $sFromPoulePlaceHashKey = $arrFromPoulePlace['$$hashKey'];
                        $oFromPoulePlace = $oPoulePlaces[$sFromPoulePlaceHashKey];
                        // var_dump( 'sFromPoulePlaceHashKey:' . $sFromPoulePlaceHashKey );
                        if ($oFromPoulePlace === null) {
                            $oFromPoulePlace = $oPoulePlaces["__NEW__" . $sFromPoulePlaceHashKey];
                        }
                        if ($oFromPoulePlace === null) {
                            throw new Exception("kan from-pouleplace(" . $sFromPoulePlaceHashKey . ") niet vinden", E_ERROR);
                        }

                        $oToPoulePlace = null;
                        if (array_key_exists($nI, $arrQualifyRule["topouleplaces"])) {
                            $arrToPoulePlace = $arrQualifyRule["topouleplaces"][$nI];
                            $sToPoulePlaceHashKey = $arrToPoulePlace['$$hashKey'];
                            $oToPoulePlace = $oPoulePlaces[$sToPoulePlaceHashKey];
                            // var_dump( 'sToPoulePlaceHashKey:' . $sToPoulePlaceHashKey );
                        }
                        // if ($oToPoulePlace === null) {
                        // $oToPoulePlace = $oPoulePlaces["__NEW__" . $sToPoulePlaceHashKey];
                        //}
                        // $oToPoulePlace can be null

                        // Apply season-specific single-rule mapping.
                        // Round 0 (groups→R32): 2D mapping [fromPoule][fromPlace] = [toPoule, toPlace].
                        // Rounds 1+ (R32→R16+): 1D mapping [fromPoule] = [toPoule, toPlace] — winner only.
                        //   Skip loser slots (no corresponding topouleplaces entry) so they stay null.
                        //   Using $nPrevRoundNr instead of counting frompouleplaces/topouleplaces avoids
                        //   breakage when old DB data has wrong 1:1 qualify-rule counts for round 1+.
                        if (
                            (int)$arrQualifyRule["confignr"] === 0
                            && $arrActiveSingleRuleMapping !== null
                        ) {
                            $nFromPouleNr = $oFromPoulePlace->getPoule()->getNumber();
                            $nFromPlaceNr = $oFromPoulePlace->getNumber();
                            if ($nPrevRoundNr === 0) {
                                // groups→R32: 2D lookup
                                $arrTarget = $arrActiveSingleRuleMapping[$nFromPouleNr][$nFromPlaceNr] ?? null;
                            } elseif (array_key_exists($nI, $arrQualifyRule["topouleplaces"])) {
                                // R32→R16+, winner slot: 1D lookup
                                $arrTarget = $arrActiveSingleRuleMapping[$nFromPouleNr] ?? null;
                            } else {
                                // R32→R16+, loser slot: eliminate
                                $oToPoulePlace = null;
                                $arrTarget     = null;
                            }
                            if ($arrTarget !== null) {
                                [$nToPouleNr, $nToPlaceNr] = $arrTarget;
                                $nToRoundNr = $oRound->getNumber();
                                $oMapped = $arrPPLookup[$nToRoundNr][$nToPouleNr][$nToPlaceNr] ?? null;
                                if ($oMapped !== null) {
                                    $oToPoulePlace = $oMapped;
                                }
                            }
                        }

                        // Apply season-specific multi-rule mapping (3rd-place rules, round 0→1 only).
                        // The default Angular zigzag assigns the wrong toPoulePlace slots when single-rule targets
                        // deviate from the default; replace with the pre-computed correct slots.
                        if (
                            (int)$arrQualifyRule["confignr"] !== 0
                            && $arrActiveMultiRuleToPlaces !== null
                        ) {
                            if (array_key_exists($nI, $arrActiveMultiRuleToPlaces)) {
                                [$nToPouleNr, $nToPlaceNr] = $arrActiveMultiRuleToPlaces[$nI];
                                $nToRoundNr = $oRound->getNumber();
                                $oMapped = $arrPPLookup[$nToRoundNr][$nToPouleNr][$nToPlaceNr] ?? null;
                                if ($oMapped !== null) {
                                    $oToPoulePlace = $oMapped;
                                }
                            } else {
                                $oToPoulePlace = null; // frompouleplaces beyond the multi-rule slot count
                            }
                        }

                        $oPPQualifyRule = Voetbal_QualifyRule_PoulePlace_Factory::createObject();
                        $oPPQualifyRule->putId($oFromPoulePlace->getId() . "-" . $oFromPoulePlace->getId());
                        $oPPQualifyRule->putFromPoulePlace($oFromPoulePlace);
                        $oPPQualifyRule->putToPoulePlace($oToPoulePlace);
                        $oPPQualifyRule->putQualifyRule($oQualifyRule);
                        $oPPQualifyRules->add($oPPQualifyRule);
                    }
                }
            }

            $oPreviousRound = $oRound;
        }

        $oRoundDbWriter->write();
        $oPouleDbWriter->write();
        $oPoulePlaceDbWriter->write();
        $oQualifyRuleDbWriter->write();
        $oPPQualifyRuleDbWriter->write();

        // check config-item if teams should be created here, (only for fctoernooi )
        //        if ( false /* and check config-item */ and $arrTeamsOldFirstRound !== null ) {
        //            $supplementTeamsCommand = new Voetbal_Command_SupplementTeams( $oRounds->first(), $arrTeamsOldFirstRound );
        //           //  $command->getBus()->handle($supplementTeamsCommand);
        //        }
    }
}
