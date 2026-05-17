/**
 * Created by coen on 9-10-15.
 */


var appVoetbal = angular.module( "voetbal", ['ngResource','ui.bootstrap','ya.nouislider','ang-drag-drop'/*'as.sortable'*/,'ngSanitize'] );

/*appVoetbal.config(['$resourceProvider', function($resourceProvider) {
    // Don't strip trailing slashes from calculated URLs
    $resourceProvider.defaults.stripTrailingSlashes = false;
}]);*/

appVoetbal.factory('csFactory', ['$resource','$http', function( $resource, $http ) {

    var factory = {};
    var cachedObjects = {};

    factory.getCompetitionSeason = $resource( g_sPubMap + "voetbal/api/competitionseason/:id",
        { id: "@id" },
        {
        'query': {
            method: 'GET'/*,
            isArray: true*/,
            transformResponse: function(data, headers) {
                return JSON.parse(data, function (name, value) {
                        if ( name == "class" )
                        {
                           if ( cachedObjects[ value ] == undefined ) {
                                cachedObjects[ value ] = new Object();
                           }
                            if( cachedObjects[ value ][ this.id ] == undefined && this.id != undefined && this.cacheid == undefined )
                                cachedObjects[ value ][ this.id ] = this;
                        }
                        else if ( ( typeof value ) == "object" && value != undefined && value['cacheid'] != undefined ) {
                            if ( cachedObjects[ value.class ] != undefined ){
                                value = cachedObjects[ value.class ][ value.cacheid ];
                            }
                        }
                        return value;
                    }
                );
            }
        }
    });
    return factory;
}]);

appVoetbal.factory('teamFactory', ['$resource','$http', function( $resource, $http ) {

    var factory = {};
    var cachedObjects = {};
    factory.getTeams = $resource( g_sPubMap + "voetbal/api/teams/:associationid",
        { associationid: "@associationid" },
        {
            'query': {
                method: 'GET'/*,
                 isArray: true*/,
                transformResponse: function(data, headers) {
                    return JSON.parse(data, function (name, value) {
                        if ( name == "class" )
                        {
                            if ( cachedObjects[ value ] == undefined ) {
                                cachedObjects[ value ] = new Object();
                            }
                            if( cachedObjects[ value ][ this.id ] == undefined && this.id != undefined && this.cacheid == undefined )
                                cachedObjects[ value ][ this.id ] = this;
                        }
                        else if ( ( typeof value ) == "object" && value != undefined && value['cacheid'] != undefined ) {
                            if ( cachedObjects[ value.class ] != undefined ){
                                value = cachedObjects[ value.class ][ value.cacheid ];
                            }
                        }
                        return value;
                    });
                }
            }
        });
    return factory;
}]);

appVoetbal.factory('nameFactory', function( ) {

    var factory = {};
    var roundtype_knockout = 2;

    factory.getRound = function( round ) {
        var nPouleRounds = 0;
        for ( var nI = 0 ; nI < round.competitionseason.rounds.length ; nI++ ) {
            if ( round.competitionseason.rounds[nI].type == roundtype_knockout )
                break;
            nPouleRounds++;
        }

        var sRoundName = "";
        if ( ( round.number + 1 ) > nPouleRounds ) {
            var nFromWinning = ( round.competitionseason.rounds.length ) - ( round.number + 1 );
            if ( nFromWinning == 5 ) { sRoundName = "<span style='font-size: 80%'><sup>1</sup>&frasl;<sub>16</sub></span> finale"; }
            else if ( nFromWinning == 4 ) { sRoundName = "&frac18; finale"; }
            else if ( nFromWinning == 3 ) { sRoundName = "&frac14; finale"; }
            else if ( nFromWinning == 2 ) { sRoundName = "&frac12; finale"; }
            else if ( nFromWinning == 1 ) { sRoundName = "finale"; }
            else if ( nFromWinning == 0 ) { sRoundName = "winnaar"; }
        }
        else {
            sRoundName = ( round.number + 1 ) + '<sup>' + ( round.number == 0 ? 'st' : 'd' ) + "e</sup> ronde";
        }
        return sRoundName;
    };

    function indexToLetter(n) {
        var result = '';
        n = n + 1;
        while (n > 0) {
            n--;
            result = String.fromCharCode(65 + (n % 26)) + result;
            n = Math.floor(n / 26);
        }
        return result;
    }

    factory.getPoule = function( poule, bWithPrefix ) {
        // get previous nr of poules
        var nPreviousNrOfPoules = 0;
        {
            var competitionseason = poule.round.competitionseason;
            for ( var nI = 0 ; nI < competitionseason.rounds.length ; nI++ ) {
                var roundIt = competitionseason.rounds[nI];
                if ( roundIt.number == poule.round.number )
                    break;
                nPreviousNrOfPoules += roundIt.poules.length;
            }
        }
        var sPouleName = "";
        if ( bWithPrefix == true )
            sPouleName = poule.round.type == roundtype_knockout ? "wed." : "poule";
        sPouleName += " " + indexToLetter(nPreviousNrOfPoules + poule.number);
        return sPouleName;
    };

    factory.isSingle = function( frompouleplaces, toppouleplaces )
    {
        return ( frompouleplaces.length == 1 && toppouleplaces.length == 1 );
    }

    factory.getPoulePlace = function( pouleplace ) {

        if ( pouleplace.team != undefined )
            return pouleplace.team.name;

        var frompouleplaces = null;
        if ( pouleplace.fromqualifyrule != undefined )
            frompouleplaces = pouleplace.fromqualifyrule.frompouleplaces;

        if ( frompouleplaces != undefined ) {
            var sPoulePlaceName = "";

            // console.log('pouleplace.fromqualifyrule', pouleplace);
            if ( this.isSingle( frompouleplaces, pouleplace.fromqualifyrule.topouleplaces ) === false ){
                var arrToPoulePlaces = pouleplace.fromqualifyrule.topouleplaces;
                var nIndex = arrToPoulePlaces.findIndex( function(x) { return x == pouleplace; } );

                var nPouleNumbersPow = pouleplace.fromqualifyrule.config.display[ nIndex ];
                var nPouleNumber = 0;
                while( Math.pow( 2, nPouleNumber ) <= nPouleNumbersPow )
                {
                    var nPouleNrPow = Math.pow( 2, nPouleNumber );
                    if ( ( nPouleNrPow & nPouleNumbersPow ) == nPouleNrPow ) {
                        sPoulePlaceName += indexToLetter(nPouleNumber);
                    }
                    nPouleNumber++;
                }
            }
            else {
                var nIndex = pouleplace.fromqualifyrule.topouleplaces.findIndex( function(x) { return x == pouleplace; } );
                var fromPoulePlace = frompouleplaces[nIndex];
                sPoulePlaceName += factory.getPoule( fromPoulePlace.poule, false );
                sPoulePlaceName += ( fromPoulePlace.number + 1 );
                return sPoulePlaceName;
            }

            sPoulePlaceName += ( frompouleplaces[0].number + 1 );
            return sPoulePlaceName;
        }
        return ( pouleplace.number + 1 );
    };

    factory.stringify = function( sJSON ){
        return JSON.stringify( sJSON, function( key, value) {
                // console.log( this );
                if( this.class == 'round' && key == 'competitionseason' ) {
                    if ( value == undefined ) { return value; }
                    else{ return 'number : ' + value.id;}
                }else if( this.class == 'poule' && key == 'round' ) {
                    if ( value == undefined ) { return value; }
                    else{ return 'number : ' + value.id;}
                }else if( this.class == 'pouleplace' && ( key == 'poule' || key == 'fromqualifyrule' || key == 'toqualifyrule' ) ) {
                    if ( value == undefined ) { return value; }
                    else{ return 'number : ' + value.id;}
                }else if( this.class == 'game' && ( key == 'poule' || key == 'homepouleplace' || key == 'awaypouleplace' ) ) {
                    if ( value == undefined ) { return value; }
                    else{ return 'number : ' + value.id;}
                }
                else {return value;}
            }
            , '\t'
        );
    };

    return factory;
});

appVoetbal.directive('convertToNumber', function() {
    return {
        require: 'ngModel',
        link: function(scope, element, attrs, ngModel) {
            ngModel.$parsers.push(function(val) {
                return parseInt(val, 10);
            });
            ngModel.$formatters.push(function(val) {
                return '' + val;
            });
        }
    };
});