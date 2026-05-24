<?php

class Voetbal_Command_Handler_RemoveCSGames
{
    public function handle(Voetbal_Command_RemoveCSGames $command)
    {
        $this->removeGames($command->getCompetitionSeason());
    }

    protected function removeGames($oCompetitionSeason)
    {
        $oGameDbWriter = Voetbal_Game_Factory::createDbWriter();
        $oPoulePlaceDbWriter = Voetbal_PoulePlace_Factory::createDbWriter();

        $oRounds = $oCompetitionSeason->getRounds();
        foreach ($oRounds as $oRound) {
            $oPoules = $oRound->getPoules();
            foreach ($oPoules as $oPoule) {
                $oPoulePlaces = $oPoule->getPlaces();
                foreach ($oPoulePlaces as $oPoulePlace) {
                    $oGames = $oPoulePlace->getGames();
                    $oGames->addObserver($oGameDbWriter);
                    $oGames->flush();

                    if ($oPoulePlace->getFromQualifyRule() !== null and $oPoulePlace->getTeam() !== null) {
                        $oPoulePlace->addObserver($oPoulePlaceDbWriter);
                        $oPoulePlace->putTeam(null);
                    }
                }
            }
        }

        try {
            $oGameDbWriter->write();
            $oPoulePlaceDbWriter->write();
        } catch (Exception $e) {
            throw new Exception("wedstrijden konden niet verwijderd worden : " . $e->getMessage(), E_ERROR);
        }
    }
}
