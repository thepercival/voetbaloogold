<?php

/**
 * Concateneert en minifieert alle jslibraryvo JS-bestanden naar één productie-bestand.
 * Draai via: composer run build-js
 */

require_once __DIR__ . '/../vendor/autoload.php';

use MatthiasMullie\Minify\JS;

$rootLib   = __DIR__ . '/../pub_voetbaloog/jslibrary/';
$rootLibvo = __DIR__ . '/../pub_voetbaloog/public/scripts/jslibraryvo/';

// Volgorde conform AddIncludes.php — jslibrary eerst, daarna jslibraryvo
$files = [
    [$rootLib,   'Idable.js'],
    [$rootLib,   'Object/Factory.js'],
    [$rootLib,   'Agenda/DateTime.js'],
    [$rootLib,   'Agenda/TimeSlot.js'],
    [$rootLib,   'AssociativeArray.js'],
    [$rootLibvo, 'VoetbalOog/Bet.js'],
    [$rootLibvo, 'VoetbalOog/Bet/Qualify.js'],
    [$rootLibvo, 'VoetbalOog/Bet/Score.js'],
    [$rootLibvo, 'VoetbalOog/Bet/Result.js'],
    [$rootLibvo, 'VoetbalOog/Bet/Factory.js'],
    [$rootLibvo, 'VoetbalOog/BetType/Factory.js'],
    [$rootLibvo, 'VoetbalOog/BetTime/Factory.js'],
    [$rootLibvo, 'VoetbalOog/Pool.js'],
    [$rootLibvo, 'VoetbalOog/Pool/Factory.js'],
    [$rootLibvo, 'VoetbalOog/User.js'],
    [$rootLibvo, 'VoetbalOog/User/Factory.js'],
    [$rootLibvo, 'VoetbalOog/Pool/User.js'],
    [$rootLibvo, 'VoetbalOog/Pool/User/Factory.js'],
    [$rootLibvo, 'VoetbalOog/Pool/Payment.js'],
    [$rootLibvo, 'VoetbalOog/Pool/Payment/Factory.js'],
    [$rootLibvo, 'VoetbalOog/CompetitionSeason.js'],
    [$rootLibvo, 'VoetbalOog/CompetitionSeason/Factory.js'],
    [$rootLibvo, 'VoetbalOog/Round.js'],
    [$rootLibvo, 'VoetbalOog/Round/Factory.js'],
    [$rootLibvo, 'VoetbalOog/Round/BetConfig.js'],
    [$rootLibvo, 'VoetbalOog/Round/BetConfig/Factory.js'],
    [$rootLibvo, 'VoetbalOog/Poule.js'],
    [$rootLibvo, 'VoetbalOog/Poule/Factory.js'],
    [$rootLibvo, 'VoetbalOog/Ranking.js'],
    [$rootLibvo, 'VoetbalOog/QualifyRule.js'],
    [$rootLibvo, 'VoetbalOog/QualifyRule/Factory.js'],
    [$rootLibvo, 'VoetbalOog/PoulePlace.js'],
    [$rootLibvo, 'VoetbalOog/PoulePlace/Factory.js'],
    [$rootLibvo, 'VoetbalOog/Team.js'],
    [$rootLibvo, 'VoetbalOog/Team/Factory.js'],
    [$rootLibvo, 'VoetbalOog/Game.js'],
    [$rootLibvo, 'VoetbalOog/Game/Factory.js'],
    [$rootLibvo, 'VoetbalOog/Game/Participation.js'],
    [$rootLibvo, 'VoetbalOog/Game/Participation/Factory.js'],
    [$rootLibvo, 'VoetbalOog/Goal.js'],
    [$rootLibvo, 'VoetbalOog/Goal/Factory.js'],
    [$rootLibvo, 'VoetbalOog/Person.js'],
    [$rootLibvo, 'VoetbalOog/Person/Factory.js'],
    [$rootLibvo, 'VoetbalOog/Control/Factory.js'],
    [$rootLibvo, 'VoetbalOog/Control/RankView.js'],
    [$rootLibvo, 'VoetbalOog/Control/GameView.js'],
    [$rootLibvo, 'VoetbalOog/Control/CompetitionSeasonView.js'],
    [$rootLibvo, 'VoetbalOog/Control/Payments.js'],
    [$rootLibvo, 'VoetbalOog/Control/BetConfig.js'],
    [$rootLibvo, 'VoetbalOog/Control/BetView.js'],
    [$rootLibvo, 'VoetbalOog/Control/BetHelper.js'],
    [$rootLibvo, 'VoetbalOog/Control/BetEdit.js'],
];

$output = __DIR__ . '/../pub_voetbaloog/public/scripts/jslibraryvo.min.js';

$minifier = new JS();

foreach ($files as [$dir, $file]) {
    $path = $dir . $file;
    if (!file_exists($path)) {
        echo "WAARSCHUWING: bestand niet gevonden: {$file}\n";
        continue;
    }
    $minifier->add($path);
}

$minifier->minify($output);

echo "Gebouwd: pub_voetbaloog/public/scripts/jslibraryvo.min.js\n";
