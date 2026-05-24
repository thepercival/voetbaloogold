<?php

class Voetbal_Command_RemoveCSGames extends Voetbal_Command
{
    private $m_oCompetitionSeason;      // Voetbal_CompetitionSeason

    public function __construct($oCompetitionSeason)
    {
        $this->m_oCompetitionSeason = $oCompetitionSeason;
    }

    public function getCompetitionSeason()
    {
        return $this->m_oCompetitionSeason;
    }
}
