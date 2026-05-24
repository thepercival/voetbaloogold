<?php
class Voetbal_ApiController extends Zend_Controller_Action
{
    public function init()
    {
        $this->_helper->layout->disableLayout();
        $this->_helper->viewRenderer->setNoRender();
    }

    public function competitionseasonAction()
    {
        $arrData = array();
        $nCode = 0;
        $sMessage = null;
        try {
            if ($this->getParam('subaction') === "savestructure") {
                $arrCompetitionSeason = json_decode(file_get_contents('php://input'), true);
                if (!is_array($arrCompetitionSeason)) {
                    throw new Exception("de structuur is niet gevuld", E_ERROR);
                }

                $oCompetitionSeason = Voetbal_CompetitionSeason_Factory::createObjectFromDatabase((int) $arrCompetitionSeason["id"]);

                $handlerMiddleware = Voetbal_Command_Main_Factory::getMiddleWare();
                $transactionMiddleware = new Voetbal_Command_Middleware_Transaction(Zend_Registry::get("db"));
                $commandBus = new \League\Tactician\CommandBus([$transactionMiddleware, $handlerMiddleware]);

                $removeAddCSStructure = new Voetbal_Command_RemoveAddCSStructure($oCompetitionSeason, $arrCompetitionSeason);
                $removeAddCSStructure->putBus($commandBus);
                $commandBus->handle($removeAddCSStructure);
            } else if ($this->getParam('subaction') === "saveteams") {
                $arrRound = json_decode(file_get_contents('php://input'), true);
                if (!is_array($arrRound)) {
                    throw new Exception("er is geen invoer verstuurd", E_ERROR);
                }

                $oRound = Voetbal_Round_Factory::createObjectFromDatabase((int) $arrRound["id"]);

                $handlerMiddleware = Voetbal_Command_Main_Factory::getMiddleWare();
                $transactionMiddleware = new Voetbal_Command_Middleware_Transaction(Zend_Registry::get("db"));
                $commandBus = new \League\Tactician\CommandBus([$transactionMiddleware, $handlerMiddleware]);

                $sEditMode = Voetbal_Factory::getConfigValue("csadmin", "teams", "inputtypeselect") ? "assign" : "update";
                $updateFirstRoundTeams = new Voetbal_Command_UpdateFirstRoundTeams($oRound, $arrRound, $sEditMode);
                $commandBus->handle($updateFirstRoundTeams);
            } else if ($this->getParam('subaction') === "savegames") {
                $arrCreateGamesSettings = json_decode(file_get_contents('php://input'), true);
                if (!is_array($arrCreateGamesSettings)) {
                    throw new Exception("er is geen invoer verstuurd", E_ERROR);
                }

                $oCompetitionSeason = Voetbal_CompetitionSeason_Factory::createObjectFromDatabase((int) $arrCreateGamesSettings["csid"]);

                $handlerMiddleware = Voetbal_Command_Main_Factory::getMiddleWare();
                $transactionMiddleware = new Voetbal_Command_Middleware_Transaction(Zend_Registry::get("db"));
                $commandBus = new \League\Tactician\CommandBus([$transactionMiddleware, $handlerMiddleware]);

                $removeAddCSGames = new Voetbal_Command_RemoveAddCSGames($oCompetitionSeason);

                $oDateTime = new DateTime($arrCreateGamesSettings["startdatetime"], new DateTimeZone('UTC'));
                $oDateTime->setTimeZone(new DateTimeZone(date_default_timezone_get()));
                $oDateTime = Agenda_Factory::createDateTime($oDateTime->format(Agenda_DateTime::STR_SQLDATETIME));
                $removeAddCSGames->putStartDateTime($oDateTime);
                $commandBus->handle($removeAddCSGames);
            } else if ($this->getParam('subaction') === "removegames") {
                $arrInput = json_decode(file_get_contents('php://input'), true);
                if (!is_array($arrInput)) {
                    throw new Exception("er is geen invoer verstuurd", E_ERROR);
                }

                $oCompetitionSeason = Voetbal_CompetitionSeason_Factory::createObjectFromDatabase((int) $arrInput["csid"]);

                $handlerMiddleware = Voetbal_Command_Main_Factory::getMiddleWare();
                $transactionMiddleware = new Voetbal_Command_Middleware_Transaction(Zend_Registry::get("db"));
                $commandBus = new \League\Tactician\CommandBus([$transactionMiddleware, $handlerMiddleware]);

                $commandBus->handle(new Voetbal_Command_RemoveCSGames($oCompetitionSeason));
            } else if ($this->getParam('subaction') === "saveproperties") {
                $arrProperties = json_decode(file_get_contents('php://input'), true);
                if (!is_array($arrProperties)) {
                    throw new Exception("er is geen invoer verstuurd", E_ERROR);
                }

                $oCompetitionSeason = Voetbal_CompetitionSeason_Factory::createObjectFromDatabase((int) $arrProperties["csid"]);

                $handlerMiddleware = Voetbal_Command_Main_Factory::getMiddleWare();
                $transactionMiddleware = new Voetbal_Command_Middleware_Transaction(Zend_Registry::get("db"));
                $commandBus = new \League\Tactician\CommandBus([$transactionMiddleware, $handlerMiddleware]);

                $updateCompetitionSeason = new Voetbal_Command_UpdateCompetitionSeason($oCompetitionSeason);

                $updateCompetitionSeason->putPublic($arrProperties["public"]);
                $commandBus->handle($updateCompetitionSeason);
            } else {
                $oCompetitionSeason = Voetbal_CompetitionSeason_Factory::createObjectFromDatabase((int)$this->getParam("id"));
                $nDataflag = (int)$this->getParam("dataflag");

                if ($oCompetitionSeason === null)
                    throw new Exception("geen competitieseizoen voor id : " . $this->getParam("id"));
                $arrData = Voetbal_CompetitionSeason_Factory::convertObjectToJSON2($oCompetitionSeason, $nDataflag);

                $fnCollect = function (array $arr, string $class, array &$result) use (&$fnCollect): void {
                    if (isset($arr['class'], $arr['id']) && $arr['class'] === $class) {
                        $result[$arr['id']] = $arr;
                    }
                    foreach ($arr as $value) {
                        if (is_array($value)) {
                            $fnCollect($value, $class, $result);
                        }
                    }
                };
                $arrAllRounds = [];
                $fnCollect($arrData, 'round', $arrAllRounds);
                $arrAllQRs = [];
                $fnCollect($arrData, 'quilifyrule', $arrAllQRs);
                $arrAllPoulePlaces = [];
                $fnCollect($arrData, 'pouleplace', $arrAllPoulePlaces);
                $arrAllPoules = [];
                $fnCollect($arrData, 'poule', $arrAllPoules);

                // Build round_id → round_number map
                $arrRoundNumberById = [];
                foreach ($arrAllRounds as $nRid => $arrRound) {
                    $arrRoundNumberById[$nRid] = $arrRound['number'];
                }
                // Build round_id → poule count (from collected poules)
                $arrRoundPouleCount = [];
                foreach ($arrAllPoules as $arrPoule) {
                    $arrRoundRef = $arrPoule['round'] ?? [];
                    $nRid = $arrRoundRef['id'] ?? $arrRoundRef['cacheid'] ?? null;
                    if ($nRid !== null) {
                        $arrRoundPouleCount[$nRid] = ($arrRoundPouleCount[$nRid] ?? 0) + 1;
                    }
                }
                // Compute cumulative poule offset per round_id (sum of poules in all rounds with lower number)
                $arrRoundPouleOffset = [];
                foreach ($arrRoundNumberById as $nRid => $nRoundNr) {
                    $nOffset = 0;
                    foreach ($arrRoundNumberById as $nRid2 => $nRoundNr2) {
                        if ($nRoundNr2 < $nRoundNr) {
                            $nOffset += $arrRoundPouleCount[$nRid2] ?? 0;
                        }
                    }
                    $arrRoundPouleOffset[$nRid] = $nOffset;
                }

                $fnIndexToLetter = function (int $n): string {
                    return $n < 26
                        ? chr(65 + $n)
                        : chr(65 + intdiv($n - 26, 26)) . chr(65 + (($n - 26) % 26));
                };

                $fnLabel = function (array $arrRef) use ($arrAllPoulePlaces, $arrAllPoules, $arrRoundPouleOffset, $fnIndexToLetter): string {
                    $nPPId = $arrRef['id'] ?? $arrRef['cacheid'] ?? null;
                    $arrPP = $arrAllPoulePlaces[$nPPId] ?? $arrRef;
                    $nPlaceNr = ($arrPP['number'] ?? 0) + 1;
                    $arrPouleRef = $arrPP['poule'] ?? [];
                    $nPouleId = $arrPouleRef['id'] ?? $arrPouleRef['cacheid'] ?? null;
                    $arrPoule = $arrAllPoules[$nPouleId] ?? $arrPouleRef;
                    $arrRoundRef = $arrPoule['round'] ?? [];
                    $nRid = $arrRoundRef['id'] ?? $arrRoundRef['cacheid'] ?? null;
                    $nOffset = $arrRoundPouleOffset[$nRid] ?? 0;
                    $nGlobalPouleNr = ($arrPoule['number'] ?? 0) + $nOffset;
                    return $fnIndexToLetter($nGlobalPouleNr) . $nPlaceNr;
                };

                // Log qualify rules and poule layouts for every round after the group stage (number >= 1)
                $arrKnockoutRounds = array_values(array_filter(
                    $arrAllRounds,
                    fn($r) => ($r['number'] ?? -1) >= 1
                ));
                usort($arrKnockoutRounds, fn($a, $b) => ($a['number'] ?? 0) <=> ($b['number'] ?? 0));

                foreach ($arrKnockoutRounds as $arrCurrentRound) {
                    $nCurrentRoundNr = ($arrCurrentRound['number'] ?? '?') + 1; // 1-based label
                    error_log("=== fromqualifyrules round $nCurrentRoundNr ===");
                    foreach ($arrCurrentRound['fromqualifyrules'] as $arrRef) {
                        $nId = $arrRef['id'] ?? $arrRef['cacheid'] ?? null;
                        $arrQR = $arrAllQRs[$nId] ?? null;
                        if ($arrQR === null) {
                            error_log("id:$nId (not in arrData)");
                            continue;
                        }
                        if ($arrQR['confignr'] === 0) {
                            $sFrom = $fnLabel($arrQR['frompouleplaces'][0]);
                            $sTo = $fnLabel($arrQR['topouleplaces'][0]);
                            error_log("id:" . $arrQR['id'] . " confignr:0 from:$sFrom to:$sTo");
                        } else {
                            $arrDisplay = $arrQR['config']['display'] ?? [];
                            $arrFromPPs = array_values($arrQR['frompouleplaces']);
                            $arrToPPs = array_values($arrQR['topouleplaces']);
                            foreach ($arrToPPs as $nToIdx => $arrToRef) {
                                $nBitmask = $arrDisplay[$nToIdx] ?? 0;
                                $arrFromLabels = [];
                                foreach ($arrFromPPs as $nFromIdx => $arrFromRef) {
                                    if ($nBitmask & (1 << $nFromIdx)) {
                                        $arrFromLabels[] = $fnLabel($arrFromRef);
                                    }
                                }
                                $sTo = $fnLabel($arrToRef);
                                error_log("id:" . $arrQR['id'] . " confignr:" . $arrQR['confignr'] . " from:[" . implode(",", $arrFromLabels) . "] to:$sTo (bitmask:$nBitmask)");
                            }
                        }
                    }

                    // Build reverse map: pouleplace id → from-label for each toPoulePlace in any qualify rule
                    error_log("=== round $nCurrentRoundNr poules + pouleplaces ===");
                    $arrToPPLabel = [];
                    foreach ($arrAllQRs as $arrQR) {
                        if ($arrQR['confignr'] === 0) {
                            $sFromLabel = $fnLabel($arrQR['frompouleplaces'][0]);
                            $arrToRef0  = $arrQR['topouleplaces'][0] ?? null;
                            if ($arrToRef0 !== null) {
                                $nToId = $arrToRef0['id'] ?? $arrToRef0['cacheid'] ?? null;
                                if ($nToId !== null) {
                                    $arrToPPLabel[$nToId] = $sFromLabel;
                                }
                            }
                        } else {
                            $arrQRDisplay = $arrQR['config']['display'] ?? [];
                            $arrQRFromPPs = array_values($arrQR['frompouleplaces']);
                            $arrQRToPPs   = array_values($arrQR['topouleplaces']);
                            foreach ($arrQRToPPs as $nToIdx2 => $arrToRef2) {
                                $nBitmask2   = $arrQRDisplay[$nToIdx2] ?? 0;
                                $arrFrLabels = [];
                                foreach ($arrQRFromPPs as $nFrIdx => $arrFrRef) {
                                    if ($nBitmask2 & (1 << $nFrIdx)) {
                                        $arrFrLabels[] = $fnLabel($arrFrRef);
                                    }
                                }
                                $nToId2 = $arrToRef2['id'] ?? $arrToRef2['cacheid'] ?? null;
                                if ($nToId2 !== null) {
                                    $arrToPPLabel[$nToId2] = '[' . implode(',', $arrFrLabels) . ']';
                                }
                            }
                        }
                    }

                    // Collect current-round poules sorted by their poule number
                    $nCurrentRoundId = $arrCurrentRound['id'] ?? null;
                    $arrRound2Poules = array_values(array_filter(
                        $arrAllPoules,
                        fn(array $arrPoule): bool => (($arrPoule['round']['id'] ?? $arrPoule['round']['cacheid'] ?? null) === $nCurrentRoundId)
                    ));
                    usort($arrRound2Poules, fn($a, $b) => ($a['number'] ?? 0) <=> ($b['number'] ?? 0));

                    foreach ($arrRound2Poules as $arrPoule2) {
                        $nRid2    = $arrPoule2['round']['id'] ?? $arrPoule2['round']['cacheid'] ?? null;
                        $nOffset2 = $arrRoundPouleOffset[$nRid2] ?? 0;
                        $sPLetter = $fnIndexToLetter(($arrPoule2['number'] ?? 0) + $nOffset2);
                        $nPouleId2 = $arrPoule2['id'] ?? null;

                        $arrPlaces2 = array_values(array_filter(
                            $arrAllPoulePlaces,
                            fn($pp) => (($pp['poule']['id'] ?? $pp['poule']['cacheid'] ?? null) === $nPouleId2)
                        ));
                        usort($arrPlaces2, fn($a, $b) => ($a['number'] ?? 0) <=> ($b['number'] ?? 0));

                        $arrParts = [];
                        foreach ($arrPlaces2 as $arrPP2) {
                            $nPl2     = ($arrPP2['number'] ?? 0) + 1;
                            $nPid2    = $arrPP2['id'] ?? null;
                            $sFromLbl = $arrToPPLabel[$nPid2] ?? '?';
                            $arrParts[] = "{$sPLetter}{$nPl2}<-{$sFromLbl}";
                        }
                        error_log(implode('  ', $arrParts));
                    }
                }
            }
        } catch (Exception $e) {
            $sMessage = $e->getMessage();
            $nCode = -1;
        }
        $this->_helper->jsonOutput($arrData, $nCode, $sMessage);
    }

    public function roundAction()
    {
        $arrData = array();
        $nCode = 0;
        $sMessage = null;
        try {
            if ($this->getParam('action') === "blabla") {
                // blabla code
            } else {
                $oRound = Voetbal_Round_Factory::createObjectFromDatabase((int) $this->getParam("id"));
                if ($oRound === null)
                    throw new Exception("geen ronde voor id : " . $this->getParam("id"));
                $nDataflag = (int)$this->getParam("dataflag");
                $arrData = Voetbal_Round_Factory::convertObjectToJSON2($oRound, $nDataflag);
            }
        } catch (Exception $e) {
            $sMessage = $e->getMessage();
            $nCode = -1;
        }
        $this->_helper->jsonOutput($arrData, $nCode, $sMessage);
    }

    public function teamsAction()
    {
        $arrData = array();
        $nCode = 0;
        $sMessage = null;
        try {
            if ($this->getParam('action') === "blabla") {
                // blabla code
            } else {
                $oAssociation = null;
                $associationId = (int) $this->getParam("associationid");
                if ($associationId > 0) {
                    $oAssociation = Voetbal_Association_Factory::createObjectFromDatabase($associationId);
                }

                $oOptions = Construction_Factory::createOptions();
                if ($oAssociation !== null) {
                    $oOptions->addFilter("ROC_Team::Association", "EqualTo", $oAssociation);
                }
                $oTeams = Voetbal_Team_Factory::createObjectsFromDatabase($oOptions);
                $nDataflag = (int)$this->getParam("dataflag");
                $arrData = Voetbal_Team_Factory::convertObjectsToJSON2($oTeams, $nDataflag);
            }
        } catch (Exception $e) {
            $sMessage = $e->getMessage();
            $nCode = -1;
        }
        $this->_helper->jsonOutput($arrData, $nCode, $sMessage);
    }
}
