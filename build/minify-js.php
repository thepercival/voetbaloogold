<?php

/**
 * Concateneert en minifieert alle jslibraryvo JS-bestanden naar één productie-bestand.
 * Draai via: composer run build-js
 */

require_once __DIR__ . '/../vendor/autoload.php';

use MatthiasMullie\Minify\JS;

$root = __DIR__ . '/../pub_voetbaloog/public/scripts/jslibraryvo/';

// Volgorde conform AddIncludes.php
$files = [
    'VoetbalOog/Bet.js',
    'VoetbalOog/Bet/Qualify.js',
    'VoetbalOog/Bet/Score.js',
    'VoetbalOog/Bet/Result.js',
    'VoetbalOog/Bet/Factory.js',
    'VoetbalOog/BetType/Factory.js',
    'VoetbalOog/BetTime/Factory.js',
    'VoetbalOog/Pool.js',
    'VoetbalOog/Pool/Factory.js',
    'VoetbalOog/User.js',
    'VoetbalOog/User/Factory.js',
    'VoetbalOog/Pool/User.js',
    'VoetbalOog/Pool/User/Factory.js',
    'VoetbalOog/Pool/Payment.js',
    'VoetbalOog/Pool/Payment/Factory.js',
    'VoetbalOog/CompetitionSeason.js',
    'VoetbalOog/CompetitionSeason/Factory.js',
    'VoetbalOog/Round.js',
    'VoetbalOog/Round/Factory.js',
    'VoetbalOog/Round/BetConfig.js',
    'VoetbalOog/Round/BetConfig/Factory.js',
    'VoetbalOog/Poule.js',
    'VoetbalOog/Poule/Factory.js',
    'VoetbalOog/Ranking.js',
    'VoetbalOog/QualifyRule.js',
    'VoetbalOog/QualifyRule/Factory.js',
    'VoetbalOog/PoulePlace.js',
    'VoetbalOog/PoulePlace/Factory.js',
    'VoetbalOog/Team.js',
    'VoetbalOog/Team/Factory.js',
    'VoetbalOog/Game.js',
    'VoetbalOog/Game/Factory.js',
    'VoetbalOog/Game/Participation.js',
    'VoetbalOog/Game/Participation/Factory.js',
    'VoetbalOog/Goal.js',
    'VoetbalOog/Goal/Factory.js',
    'VoetbalOog/Person.js',
    'VoetbalOog/Person/Factory.js',
    'VoetbalOog/Control/Factory.js',
    'VoetbalOog/Control/RankView.js',
    'VoetbalOog/Control/GameView.js',
    'VoetbalOog/Control/CompetitionSeasonView.js',
    'VoetbalOog/Control/Payments.js',
    'VoetbalOog/Control/BetConfig.js',
    'VoetbalOog/Control/BetView.js',
    'VoetbalOog/Control/BetHelper.js',
    'VoetbalOog/Control/BetEdit.js',
];

$output = __DIR__ . '/../pub_voetbaloog/public/scripts/jslibraryvo.min.js';

$minifier = new JS();

foreach ($files as $file) {
    $path = $root . $file;
    if (!file_exists($path)) {
        echo "WAARSCHUWING: bestand niet gevonden: {$file}\n";
        continue;
    }
    $minifier->add($path);
}

$minifier->minify($output);

echo "Gebouwd: pub_voetbaloog/public/scripts/jslibraryvo.min.js\n";
