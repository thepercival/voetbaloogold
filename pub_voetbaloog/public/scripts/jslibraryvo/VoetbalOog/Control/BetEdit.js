function Ctrl_BetEdit( oPoolUser, tsNow, sDivId ) {
    var m_sDivId = sDivId;
    var m_oPoolUser = oPoolUser;
    var m_sControlPrefix = '_control_id_';
    var m_sPouleRankingPrefix = '-poulerank-id-';
    var m_sPouleRankingParentPrefix = '-poulerank-parent-id-';
    var m_oNow = new Date(tsNow);
    var m_sTableClassName = 'table table-striped';
    var m_arrColumnsGames = new Array("datum", "tijd", "thuisteam", "uitslag", "uitteam");
    var m_jsonColumnGameId = {header: 'Id'};
    var m_oBetHelper = null;
    var m_bPreviousCompetitionSeasonsSet = false;
    var m_vtOldValue = null;
    var m_nNrOfBetsDone = 0;
    var m_arrBetsDonePerRound = {};
    var m_arrBetsAvailablePerRound = {};
    var m_bPrintEnabled = true;
    var m_oJQuery = null;
    var m_oLoggedThirdPlaceQRs = {};

    this.putJQuery = function (oJQuery) {
        m_oJQuery = oJQuery;
    };
    this.disablePrint = function () {
        m_bPrintEnabled = false;
    };

    function getDiv() {
        return document.getElementById(m_sDivId);
    }

    this.show = function () {
        var oDiv = getDiv();
        while (oDiv.hasChildNodes())
            oDiv.removeChild(oDiv.lastChild);

        var oPool = m_oPoolUser.getPool();
        var oCompetitionSeason = oPool.getCompetitionSeason();
        var oRounds = oCompetitionSeason.getRounds();

        var arrEligibleRounds = [];
        for (var nI in oRounds) {
            if (!( oRounds.hasOwnProperty(nI) ))
                continue;
            var oRound = oRounds[nI];
            var oPoolEndDateTime = oPool.getRoundEndDateTime(oRound);
            if ( oPoolEndDateTime == null || m_oNow > oPoolEndDateTime )
                continue;
            // Skip rounds with no games (e.g. the ★ winner round — its bet is saved automatically).
            var oRoundPoules = oRound.getPoules();
            var bRoundHasGames = false;
            for ( var nP in oRoundPoules ) {
                if ( !oRoundPoules.hasOwnProperty(nP) ) continue;
                if ( Object_Factory().count( oRoundPoules[nP].getPlaces() ) > 1 ) { bRoundHasGames = true; break; }
            }
            if ( !bRoundHasGames ) continue;
            arrEligibleRounds.push(oRound);
        }

        if (arrEligibleRounds.length == 0) return;

        // Pre-fill qualifier bets from previous-round score predictions before rendering,
        // so team names are available when drawing knockout-round home/away cells.
        for (var nK = 0; nK < arrEligibleRounds.length; nK++) {
            var oFillRound = arrEligibleRounds[nK];
            if (oFillRound.getNumber() === 0) continue;
            var oFillBetConfigs = m_oPoolUser.getPool().getBetConfigs(oFillRound);
            if (oFillBetConfigs[VoetbalOog_Bet_Qualify.nId] != undefined)
                fillQualifierBetsData(oFillRound.getId());
        }

        // Horizontal round navigation
        var oNav = oDiv.appendChild(document.createElement("ul"));
        oNav.id = "betedit-roundnav";
        oNav.className = "nav nav-tabs";
        oNav.style.display = "flex";
        oNav.style.flexWrap = "nowrap";
        oNav.style.marginBottom = "10px";

        var oTabContent = oDiv.appendChild(document.createElement("div"));
        oTabContent.className = "tab-content";

        for (var nJ = 0; nJ < arrEligibleRounds.length; nJ++) {
            var oRound = arrEligibleRounds[nJ];
            var bFirst = (nJ === 0);
            var sRoundId = "betedit-roundnr-" + oRound.getNumber();
            var oLi = oNav.appendChild(document.createElement("li"));
            oLi.style.flex = "1";
            oLi.style.textAlign = "center";
            oLi.className = bFirst ? "active" : "disabled";
            var oLink = oLi.appendChild(document.createElement("a"));
            oLink.href = "#" + sRoundId;
            oLink.setAttribute("data-toggle", "tab");
            oLink.innerHTML = VoetbalOog_Round_Factory().getShortName(oRound);
            oLink.addEventListener("click", function(e) {
                if (this.parentElement.classList.contains("disabled")) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            });
            var oPane = oTabContent.appendChild(document.createElement("div"));
            oPane.id = sRoundId;
            oPane.className = "tab-pane" + (bFirst ? " active" : "");
            oPane.setAttribute("role", "tabpanel");
            if (bFirst) {
                var oFirstRoundBetConfigs = m_oPoolUser.getPool().getBetConfigs(oRound);
                addBetInfo(oRound, oFirstRoundBetConfigs, oPane);
            }
            showRound(oPane, oRound);
            if (oRound.getNumber() !== 0)
                appendTabSaveButton(oPane);
        }

        updateBetsDoneTotals();

        // Default active-tab determination on page load:
        // 1) first incomplete round (some bets filled, not all)
        // 2) otherwise first empty round
        // 3) otherwise the last complete round
        var sDefaultTabId = getDefaultActiveTabId( arrEligibleRounds );
        if ( sDefaultTabId != null ) {
            var oDefaultLink = document.querySelector( 'a[href="#' + sDefaultTabId + '"]' );
            if ( oDefaultLink != null )
                oDefaultLink.parentElement.classList.remove( "disabled" );
            if ( oDefaultLink != null && window.jQuery && window.jQuery.fn.tab )
                window.jQuery( oDefaultLink ).tab( 'show' );
        }

        // Restore saved tab after form submit + reload
        (function() {
            try {
                var sSavedTab = sessionStorage.getItem('betedit_active_tab');
                if (!sSavedTab) return;
                sessionStorage.removeItem('betedit_active_tab');
                var sScrollTarget = sessionStorage.getItem('betedit_scroll_target');
                sessionStorage.removeItem('betedit_scroll_target');
                var oTargetLink = document.querySelector('a[href="#' + sSavedTab + '"]');
                if (!oTargetLink) return;
                oTargetLink.parentElement.classList.remove('disabled');
                if (window.jQuery && window.jQuery.fn.tab)
                    window.jQuery(oTargetLink).tab('show');
                if (sScrollTarget) {
                    setTimeout(function() {
                        var oEl = document.getElementById(sScrollTarget);
                        if (oEl) oEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 50);
                }
            } catch(e) {}
        })();
    };

    function getDefaultActiveTabId( arrEligibleRounds )
    {
        var sFirstIncompleteTabId = null;
        var sFirstEmptyTabId = null;
        var sLastCompleteTabId = null;

        for ( var nI = 0; nI < arrEligibleRounds.length; nI++ )
        {
            var oRound = arrEligibleRounds[nI];
            var nRoundNr = oRound.getNumber();
            var nDone = m_arrBetsDonePerRound[nRoundNr] || 0;
            var nAvail = m_arrBetsAvailablePerRound[nRoundNr] || 0;
            var sRoundTabId = "betedit-roundnr-" + nRoundNr;

            if ( nAvail > 0 && nDone > 0 && nDone < nAvail && sFirstIncompleteTabId == null )
                sFirstIncompleteTabId = sRoundTabId;
            else if ( nDone == 0 && sFirstEmptyTabId == null )
                sFirstEmptyTabId = sRoundTabId;
            else if ( nAvail > 0 && nDone >= nAvail )
                sLastCompleteTabId = sRoundTabId;
        }

        if ( sFirstIncompleteTabId != null )
            return sFirstIncompleteTabId;
        if ( sFirstEmptyTabId != null )
            return sFirstEmptyTabId;
        return sLastCompleteTabId;
    }

    function appendHeader(oContainer, bTop, oPool) {
        var oRow = document.createElement("div");
        oRow.className = 'row';
        oRow.style.margin = '0';

        var oSaveDiv = oRow.appendChild(document.createElement("div"));
        {
            oSaveDiv.className = 'col-xs-12';
            oSaveDiv.style.textAlign = 'center';

            var oSaveWrapper = oSaveDiv.appendChild(document.createElement("div"));
            oSaveWrapper.style.textAlign = 'center';

            var oSaveButton = oSaveWrapper.appendChild(document.createElement("input"));
            {
                oSaveButton.type = 'submit';
                oSaveButton.style.fontWeight = "bold";
                oSaveButton.id = 'btnsavebets';
                oSaveButton.name = 'btnsavebets';
                oSaveButton.value = "alles opslaan";
                oSaveButton.className = 'btn btn-primary';
                oSaveButton.role = "button";
            }

            var oToDoBtn = oSaveWrapper.appendChild(document.createElement("input"));
            {
                oToDoBtn.type = 'button';
                oToDoBtn.className = 'btn btn-default';
                oToDoBtn.role = "button";
                oToDoBtn.style.fontWeight = 'bold';
                oToDoBtn.disabled = true;
                if (bTop == true)
                    oToDoBtn.id = 'todobetstop';
                else
                    oToDoBtn.id = 'todobetsbottom';
            }

            var oClearDiv = oSaveWrapper.appendChild(document.createElement("div"));
            oClearDiv.style.clear = 'both';
        }

        if (bTop == true)
            oContainer.insertBefore(oRow, oContainer.firstChild);
        else
            oContainer.appendChild(oRow);
    }

    function showRound(oContainer, oRound) {

        var oRoundBetConfigs = m_oPoolUser.getPool().getBetConfigs(oRound);

        var oPoules = oRound.getPoules();
        var oTable = null;
        var arrPoules;
        if ( oRoundBetConfigs[ VoetbalOog_Bet_Qualify.nId ] != undefined )
        {
            arrPoules = getOrderedKnockoutPoules( oRound );
        }
        else
        {
            arrPoules = [];
            for ( var nK in oPoules )
            {
                if ( oPoules.hasOwnProperty( nK ) ) arrPoules.push( oPoules[nK] );
            }
        }
        for ( var nJ = 0; nJ < arrPoules.length; nJ++ )
        {
            var oPoule = arrPoules[nJ];
            var nNrOfPoulePlaces = Object_Factory().count(oPoule.getPlaces());
            var bShowGames = nNrOfPoulePlaces > 1;
            if (oPoule.needsRanking() == true) {
                var oPouleContainer = oContainer.appendChild(document.createElement("div"));
                oPouleContainer.style.marginTop = '5px';
                oPouleContainer.style.textAlign = 'center';
                var span = oPouleContainer.appendChild(document.createElement('span'));
                span.style.fontWeight = 'bold';
                span.innerHTML = VoetbalOog_Poule_Factory().getName(oPoule, true) + " ";
                var oLink = oPouleContainer.appendChild(document.createElement('a'));
                oLink.style.display = 'inline-block';
                oLink.role = 'button';
                oLink.className = 'btn btn-default btn-sm visible-xs btn-show-poulerank';
                oLink.appendChild(document.createElement('span')).className = 'glyphicon glyphicon-th-list';
                oLink.appendChild(document.createTextNode(" stand"));
                oLink.href = "#collapseRanking" + oPoule.getId();
                oLink.setAttribute("data-toggle", "collapse");
                oLink.setAttribute("data-pouleid", oPoule.getId());
                oLink.setAttribute("aria-expanded", "false");
                oLink.setAttribute("aria-controls", "collapseRanking" + oPoule.getId());
                oLink.onclick = function () { var nPouleId = this.getAttribute("data-pouleid"); var oWell = document.getElementById("collapseRankingWell" + nPouleId); if (oWell.hasChildNodes()) { return; } oWell.appendChild( document.getElementById( getPouleRankingDivId( nPouleId ) ) ); };
                var oRankingDiv = oPouleContainer.appendChild(document.createElement('div'));
                oRankingDiv.className = "collapse";
                oRankingDiv.id = "collapseRanking" + oPoule.getId();
                var oRankingWell = oRankingDiv.appendChild(document.createElement('div'));
                oRankingWell.id = "collapseRankingWell" + oPoule.getId();
                oRankingWell.className = "well visible-xs";
                oRankingWell.setAttribute("data-pouleid", oPoule.getId());
                showPoule(oContainer, oPoule, oRoundBetConfigs);

                if (oRound.getNumber() == 0) {
                    var oSaveDiv = oContainer.appendChild(document.createElement("div"));
                    oSaveDiv.style.textAlign = "center";
                    oSaveDiv.style.margin = "5px 0 30px 0";
                    var oSaveButton = oSaveDiv.appendChild(document.createElement("input"));
                    oSaveButton.type = "submit";
                    oSaveButton.className = "btn btn-primary";
                    oSaveButton.name = "btnsavebets";
                    oSaveButton.value = "opslaan";
                    oSaveButton.id = 'btnsave-poule-' + oPoule.getId();
                    (function(sBtnId) {
                        oSaveButton.onclick = function() {
                            storePostSaveTab( oContainer.id );
                            try { sessionStorage.setItem('betedit_scroll_target', sBtnId); } catch(e) {}
                        };
                    })(oSaveButton.id);
                }

                oTable = null;
            } else {
                if (oTable == null) {
                    oTable = oContainer.appendChild(document.createElement("table"));
                    oTable.className = m_sTableClassName;
                    if (bShowGames == true)
                        showPouleGamesHeaders(oTable, oPoule, oRoundBetConfigs[VoetbalOog_Bet_Qualify.nId] != undefined);
                }
                if (bShowGames == true)
                    showPouleGames(oTable, oPoule, oRoundBetConfigs);
                else {
                    showWinner(oTable, oPoule, oRoundBetConfigs);
                    oTable.style.textAlign = 'center';
                }
            }
        }

        // Voeg stand van nummers 3 toe direct onderaan rondenr 0
        if (oRound.getNumber && oRound.getNumber() === 0) {
            var oThirdPlaceDiv = oContainer.appendChild(document.createElement('div'));
            oThirdPlaceDiv.id = 'thirdplace-ranking-' + oRound.getNumber();
            var oRoundBetConfig3 = oRoundBetConfigs[VoetbalOog_Bet_Score.nId];
            if (oRoundBetConfig3 == undefined)
                oRoundBetConfig3 = oRoundBetConfigs[VoetbalOog_Bet_Result.nId];
            updateThirdPlaceStandings(oRound, oRoundBetConfig3);
        }

    }

    function showPoule(oContainer, oPoule, oRoundBetConfigs) {
        var oPouleContainer = oContainer.appendChild(document.createElement('div'));
        oPouleContainer.className = "row";
        oPouleContainer.style.margin = "0px";

        var oGamesDiv = oPouleContainer.appendChild(document.createElement('div'));
        {
            oGamesDiv.className = 'col-xs-12 col-sm-8 col-md-6';
            oGamesDiv.style.paddingLeft = "0px";
            oGamesDiv.style.paddingRight = "0px";

            var oTable = document.createElement("table");
            oTable.className = m_sTableClassName;
            oGamesDiv.appendChild(oTable);

            showPouleGamesHeaders(oTable, oPoule, oRoundBetConfigs[VoetbalOog_Bet_Qualify.nId] != undefined);
            showPouleGames(oTable, oPoule, oRoundBetConfigs);
        }

        var oRankAndInfoDiv = oPouleContainer.appendChild(document.createElement('div'));
        {
            oRankAndInfoDiv.id = getPouleRankingParentDivId(oPoule);
            oRankAndInfoDiv.className = 'hidden-xs col-sm-4 col-md-offset-3 col-md-3';
            oRankAndInfoDiv.setAttribute("data-pouleid", oPoule.getId());
            oRankAndInfoDiv.style.paddingLeft = "30px";
            oRankAndInfoDiv.style.paddingRight = "0px";

            var oRankDiv = oRankAndInfoDiv.appendChild(document.createElement('div'));
            oRankDiv.id = getPouleRankingDivId(oPoule);
            oRankDiv.className = 'poule-ranking-div';

            var oRoundBetConfig = oRoundBetConfigs[VoetbalOog_Bet_Score.nId];
            if (oRoundBetConfig == undefined)
                oRoundBetConfig = oRoundBetConfigs[VoetbalOog_Bet_Result.nId];
            updatePouleStandings(oPoule, oRoundBetConfig);
        }

        oContainer.appendChild(document.createElement('div')).style.clear = 'both';
    }

    function addBetInfo( oRound, oRoundBetConfigs, oContainer ) {

        var oRoundBetConfig = oRoundBetConfigs[VoetbalOog_Bet_Score.nId];
        if (oRoundBetConfig == undefined)
            oRoundBetConfig = oRoundBetConfigs[VoetbalOog_Bet_Result.nId];

        if (m_oBetHelper != null && oRoundBetConfig != undefined) {

            var oInfoDiv = document.createElement('div');
            oInfoDiv.className = 'col-xs-12';
            oInfoDiv.style.textAlign = 'center';
            oInfoDiv.style.marginBottom = '15px';

            if (m_oBetHelper != null)
                m_oBetHelper.refresh(oRoundBetConfig, m_oPoolUser, null);

            oContainer.appendChild(oInfoDiv);
            {
                var oStatsLink = document.createElement('a');
                oStatsLink.id = 'btntogglebetconfig';
                oStatsLink.className = 'btn btn-md btn-info';
                oStatsLink.innerHTML = 'voorspellingeninformatie <span class="glyphicon glyphicon-info-sign"></span>';
                oStatsLink.onclick = function () {
                    m_oBetHelper.showModal(m_oJQuery);
                    if (m_bPreviousCompetitionSeasonsSet == false) {
                        var oCompetitionSeasons = new Object();
                        // @TODO fill competitionid from certain competition, e.g. EC/WC
                        m_oJQuery.ajax({
                            url: g_sPubMap + 'competitionseason/ajax/',
                            data: {ajaxaction: "getprevious", maxamount: 3, competitionid : null },
                            dataType: "json",
                            async: true
                        }).done(function (jsonCS) {
                            oCompetitionSeasons = VoetbalOog_CompetitionSeason_Factory().createObjectsFromJSON(jsonCS.data);

                            m_oBetHelper.putPreviousCompetitionSeasons(oCompetitionSeasons);

                            m_oBetHelper.refresh(oRoundBetConfig, m_oPoolUser);
                            m_bPreviousCompetitionSeasonsSet = true;
                            m_oBetHelper.show();
                        }).fail(function (jqXHR, textStatus, errorThrown) {
                            // console.log(textStatus);
                            // console.log(jqXHR.responseText);
                        });
                    }
                    else {
                        m_oBetHelper.show();
                    }
                };
                oInfoDiv.appendChild(oStatsLink);
            }
        }
    }

    function getPouleRankingDivId( vtPoule ) {
        var sPouleId = ( typeof vtPoule == "object") ? vtPoule.getId() : vtPoule;
        return m_sDivId + m_sPouleRankingPrefix + sPouleId;
    }

    function getPouleRankingParentDivId(oPoule) {
        return m_sDivId + m_sPouleRankingParentPrefix + oPoule.getId();
    }

    this.getPouleRankingParentDivId = function ( nPouleId ) {
        return m_sDivId + m_sPouleRankingParentPrefix + nPouleId;
    };

    function getControlId( oRoundBetConfig, oObject, sPostfix )
    {
        var sRetval = m_sDivId + m_sControlPrefix + oRoundBetConfig.getId() + "_" + oObject.getId();
        if ( sPostfix != null )
            sRetval += sPostfix;
        return sRetval;
    }

    function getRoundBetConfigFromControlId( oControl )
    {
        var sPrefix = m_sDivId + m_sControlPrefix;
        var sControlId = oControl.id.substr( sPrefix.length );
        var sRoundBetConfigId = sControlId.substr( 0, sControlId.indexOf("_") );
        return VoetbalOog_Round_BetConfig_Factory().createObjectFromDatabase( sRoundBetConfigId );
    }

    function getObjectIdFromControlId( oControl )
    {
        var sPrefix = m_sDivId + m_sControlPrefix;
        var sId = oControl.id.substr( sPrefix.length );
        sId = sId.substr( sId.indexOf("_") + 1 );

        var nEndPos = undefined;
        var nPostfix = sId.indexOf("_");
        // var sPostfix = null;
        if ( nPostfix >= 0 )
        {
            nEndPos = nPostfix;
            // sPostfix = sId.substr( nPostfix );
        }
        return sId.substr( 0, nEndPos );
    }

    function showPouleGamesHeaders( oTable, oPoule, bKnockout )
    {
        var oRowHeader = oTable.insertRow( oTable.rows.length );
        oRowHeader.className = "tableheader";

        var arrColumns = getGamesColumns();
        for ( var nI = 0 ; nI < arrColumns.length ; nI++ )
        {
            var sHeader = arrColumns[nI];

            if ( bKnockout && sHeader == "uitslag" )
            {
                oRowHeader.appendChild( document.createElement("th") );
                continue;
            }

            var oCell = oRowHeader.appendChild( document.createElement("th") );
            if ( sHeader == "uitslag" )
                oCell.style.textAlign = 'center';
            else if ( sHeader == "thuisteam" )
                oCell.style.textAlign = 'right';
            else if ( sHeader == "datum" || sHeader == "tijd" )
                oCell.className = 'hidden-xs';
            oCell.innerHTML = sHeader;
        }

        if ( oPoule.needsRanking() == false )
        {
            var oCell = oRowHeader.appendChild( document.createElement("th") );
            oCell.style.textAlign = 'center';
            oCell.innerHTML = m_jsonColumnGameId.header;

            if ( bKnockout )
            {
                var oVsCell = oRowHeader.appendChild( document.createElement("th") );
                oVsCell.style.textAlign = 'center';
                oVsCell.innerHTML = 'vs';
            }
        }
    }

    // Returns the poules of oRound sorted in bracket order (depth-first from the final).
    // Adjacent pairs are games whose winners meet in the same next-round game.
    // The home-slot contributor appears before the away-slot contributor within each pair.
    function getOrderedKnockoutPoules( oRound )
    {
        var oAllPoules = oRound.getPoules();

        // Build id-keyed lookup and count.
        var oPouleById = {};
        var nPouleCount = 0;
        for ( var nK in oAllPoules )
        {
            if ( !( oAllPoules.hasOwnProperty(nK) ) ) continue;
            oPouleById[ oAllPoules[nK].getId() ] = oAllPoules[nK];
            nPouleCount++;
        }

        // Base case: single poule — already in order.
        if ( nPouleCount <= 1 )
        {
            var arrSingle = [];
            for ( var nS in oPouleById )
            {
                if ( oPouleById.hasOwnProperty(nS) ) arrSingle.push( oPouleById[nS] );
            }
            return arrSingle;
        }

        var oToQualifyRules = oRound.getToQualifyRules();

        // Map each current-round poule ID → destination info.
        var oFromPouleToDestInfo = {}; // fromPouleId -> { destPouleId, destPlaceId }
        var oNextPouleMap = {};        // nextPouleId -> nextPoule object
        for ( var nR in oToQualifyRules )
        {
            if ( !( oToQualifyRules.hasOwnProperty(nR) ) ) continue;
            var oRule = oToQualifyRules[nR];
            var arrDest = oRule.getToPoulePlaces();
            if ( arrDest.length == 0 ) continue;
            var oDestPlace = arrDest[0];
            var oDestPoule = oDestPlace.getPoule();
            oNextPouleMap[ oDestPoule.getId() ] = oDestPoule;

            var oFromPoules = oRule.getFromPoules();
            for ( var nP in oFromPoules )
            {
                if ( !( oFromPoules.hasOwnProperty(nP) ) ) continue;
                oFromPouleToDestInfo[nP] = {
                    destPouleId: oDestPoule.getId(),
                    destPlaceId: Number( oDestPlace.getId() )
                };
            }
        }

        // Determine the next round from any destination poule.
        var oNextRound = null;
        for ( var nQ in oNextPouleMap )
        {
            if ( oNextPouleMap.hasOwnProperty(nQ) ) { oNextRound = oNextPouleMap[nQ].getRound(); break; }
        }
        if ( oNextRound == null )
        {
            var arrFallback = [];
            for ( var nF in oPouleById )
            {
                if ( oPouleById.hasOwnProperty(nF) ) arrFallback.push( oPouleById[nF] );
            }
            return arrFallback;
        }

        // Recursively get the ordered next-round poules.
        var arrNextOrdered = getOrderedKnockoutPoules( oNextRound );

        // Group current-round poules by their destination next-round poule, sort by slot.
        var oGroups = {}; // nextPouleId -> [{fromPouleId, destPlaceId}]
        for ( var nPId in oFromPouleToDestInfo )
        {
            if ( !( oFromPouleToDestInfo.hasOwnProperty(nPId) ) ) continue;
            var info = oFromPouleToDestInfo[nPId];
            if ( !oGroups[ info.destPouleId ] ) oGroups[ info.destPouleId ] = [];
            oGroups[ info.destPouleId ].push( { fromPouleId: nPId, destPlaceId: info.destPlaceId } );
        }
        for ( var nG in oGroups )
        {
            if ( oGroups.hasOwnProperty(nG) )
                oGroups[nG].sort( function(a, b) { return a.destPlaceId - b.destPlaceId; } );
        }

        // Build result in next-round bracket order.
        var arrResult = [];
        var oIncluded = {};
        for ( var nI = 0; nI < arrNextOrdered.length; nI++ )
        {
            var arrGroup = oGroups[ arrNextOrdered[nI].getId() ];
            if ( arrGroup )
            {
                for ( var nE = 0; nE < arrGroup.length; nE++ )
                {
                    var oFromPoule = oPouleById[ arrGroup[nE].fromPouleId ];
                    if ( oFromPoule ) { arrResult.push( oFromPoule ); oIncluded[ arrGroup[nE].fromPouleId ] = true; }
                }
            }
        }
        // Append any poules not covered (safety fallback for malformed data).
        for ( var nU in oPouleById )
        {
            if ( oPouleById.hasOwnProperty(nU) && !oIncluded[nU] ) arrResult.push( oPouleById[nU] );
        }
        return arrResult;
    }

    // Returns the name of the opponent poule (next-round game) for a given knockout poule.
    // E.g. if poule M's winner faces poule O's winner, returns 'O' when called with poule M.
    function getOpponentPouleName( oPoule )
    {
        var oToQualifyRules = oPoule.getRound().getToQualifyRules();

        // Find which next-round poule this poule's winner advances to.
        var oDestPoule = null;
        for ( var nR in oToQualifyRules )
        {
            if ( !( oToQualifyRules.hasOwnProperty(nR) ) ) continue;
            var oRule = oToQualifyRules[nR];
            var oFromPoules = oRule.getFromPoules();
            if ( oFromPoules[ oPoule.getId() ] == null ) continue;
            var arrDest = oRule.getToPoulePlaces();
            if ( arrDest.length > 0 )
                oDestPoule = arrDest[0].getPoule();
            break;
        }

        if ( oDestPoule == null ) return '';

        // Find the OTHER current-round poule whose winner also advances to the same next-round poule.
        for ( var nR2 in oToQualifyRules )
        {
            if ( !( oToQualifyRules.hasOwnProperty(nR2) ) ) continue;
            var oRule2 = oToQualifyRules[nR2];
            var oFromPoules2 = oRule2.getFromPoules();
            if ( oFromPoules2[ oPoule.getId() ] != null ) continue; // skip this poule's own rule
            var arrDest2 = oRule2.getToPoulePlaces();
            if ( arrDest2.length > 0 && arrDest2[0].getPoule().getId() == oDestPoule.getId() )
            {
                for ( var nP in oFromPoules2 )
                {
                    if ( !( oFromPoules2.hasOwnProperty(nP) ) ) continue;
                    return VoetbalOog_Poule_Factory().getName( oFromPoules2[nP], false );
                }
            }
        }
        return '';
    }

    function styleQualifyRadioLabel( oLabel, oRadio )
    {
        oLabel.style.display = 'inline-flex';
        oLabel.style.alignItems = 'center';
        oLabel.style.lineHeight = '1.2';

        oRadio.style.marginTop = '0px';
        oRadio.style.verticalAlign = 'middle';
        oRadio.style.alignSelf = 'center';
    }

    function styleKnockoutChoiceLabel( oLabel, oRadio )
    {
        oLabel.style.display = 'inline-flex';
        oLabel.style.alignItems = 'center';
        oLabel.style.gap = '6px';

        oRadio.style.marginTop = '0px';
        oRadio.style.verticalAlign = 'middle';
        oRadio.style.alignSelf = 'center';

        var oTeamWrapper = oLabel.querySelector( 'span' );
        if ( oTeamWrapper != null )
        {
            oTeamWrapper.style.display = 'inline-flex';
            oTeamWrapper.style.alignItems = 'center';
            oTeamWrapper.style.lineHeight = '1';
            oTeamWrapper.style.height = 'auto';
        }
    }

    // Renders the home, score, and away cells for a knockout-round game row.
    // Home/away cells: btn-style label (icon + team name) with embedded radio.
    // Score cell: always " - "; red background = no bet, green = bet made.
    // The radio name = qualify bet control ID for the destination slot in the next round.
    function renderKnockoutGameCells( oRow, oGame, oRoundBetConfigs )
    {
        var oQualifyBetConfig = oRoundBetConfigs[ VoetbalOog_Bet_Qualify.nId ];
        var oDeadLine = oQualifyBetConfig.getDeadLine( null );

        var oBets = m_oPoolUser.getBets( oQualifyBetConfig );
        var oHomePoulePlace = oGame.getHomePoulePlace();
        var oAwayPoulePlace = oGame.getAwayPoulePlace();
        var oHomeBet = oBets[ oHomePoulePlace.getId() ];
        var oHomeTeam = ( oHomeBet != null ) ? oHomeBet.getTeam() : null;
        var oAwayBet = oBets[ oAwayPoulePlace.getId() ];
        var oAwayTeam = ( oAwayBet != null ) ? oAwayBet.getTeam() : null;

        // Find the next-round destination slot for the winner of this game.
        var oToQualifyRules = oHomePoulePlace.getPoule().getRound().getToQualifyRules();
        var oDestPoulePlace = null;
        var oNextRoundBetConfig = null;
        for ( var nR in oToQualifyRules )
        {
            if ( !( oToQualifyRules.hasOwnProperty(nR) ) ) continue;
            var oRule = oToQualifyRules[nR];
            var oFromPoules = oRule.getFromPoules();
            if ( oFromPoules[ oHomePoulePlace.getPoule().getId() ] == null ) continue;
            var arrDest = oRule.getToPoulePlaces();
            if ( arrDest.length > 0 )
            {
                oDestPoulePlace = arrDest[0];
                var oNextRoundBetConfigs = m_oPoolUser.getPool().getBetConfigs( oRule.getToRound() );
                oNextRoundBetConfig = oNextRoundBetConfigs[ VoetbalOog_Bet_Qualify.nId ];
            }
            break;
        }

        // Currently betted winner (qualify bet for next-round destination slot).
        var oWinnerTeam = null;
        var sControlId = null;
        if ( oDestPoulePlace != null && oNextRoundBetConfig != null )
        {
            sControlId = getControlId( oNextRoundBetConfig, oDestPoulePlace, null );
            var oNextBets = m_oPoolUser.getBets( oNextRoundBetConfig );
            var oNextBet = oNextBets[ oDestPoulePlace.getId() ];
            oWinnerTeam = ( oNextBet != null ) ? oNextBet.getTeam() : null;
        }

        var bDeadlineActive = ( m_oNow <= oDeadLine );
        var bCanShowRadio = ( bDeadlineActive && sControlId != null && oHomeTeam != null && oAwayTeam != null );

        // Only count current-round qualify bets for the first knockout round.
        // For later rounds, these bets are already counted as winner picks in the previous tab.
        var bCountCurrentQualify = false;
        {
            var oPrevRound = oQualifyBetConfig.getRound().getPrevious();
            if ( oPrevRound != null ) {
                var oPrevRoundConfigs = m_oPoolUser.getPool().getBetConfigs( oPrevRound );
                bCountCurrentQualify = ( oPrevRoundConfigs[ VoetbalOog_Bet_Qualify.nId ] == undefined );
            }
        }

        // Label references captured by radio onchange closures (var-hoisted; assigned below).
        var oHomeLabel = null;
        var oAwayLabel = null;
        var oScoreCell;

        // Helper: append team button (or static name) to a cell.
        function appendTeamCell( oCell, oTeam, oPoulePlace, bIsHome )
        {
            var sHiddenId = getControlId( oQualifyBetConfig, oPoulePlace, null );
            if ( bCanShowRadio )
            {
                var oLabel = document.createElement("label");
                oLabel.className = "btn btn-sm btn-default";
                oLabel.style.fontWeight = "normal";

                var oRadio = document.createElement("input");
                oRadio.type = "radio";
                oRadio.name = sControlId;
                oRadio.value = oTeam.getId();

                if ( oWinnerTeam != null && oWinnerTeam.getId() == oTeam.getId() )
                {
                    oLabel.className += " active";
                    oRadio.checked = true;
                }

                oRadio.onfocus = function() {
                    var oChk = document.querySelector( 'input[type="radio"][name="' + this.name + '"]:checked' );
                    m_vtOldValue = oChk ? parseInt( oChk.value, 10 ) : -1;
                };
                oRadio.onchange = function() {
                    updateBetQualifyFromRadio( this );
                    m_vtOldValue = parseInt( this.value, 10 );
                    if ( oHomeLabel ) oHomeLabel.className = oHomeLabel.className.replace( " active", "" );
                    if ( oAwayLabel ) oAwayLabel.className = oAwayLabel.className.replace( " active", "" );
                    oLabel.className += " active";
                    oScoreCell.style.backgroundColor = '#dff0d8';
                };

                if ( bIsHome )
                {
                    VoetbalOog_Control_Factory().appendTeam( oLabel, oTeam, true, false, false, false );
                    oRadio.style.marginLeft = '6px';
                    oLabel.appendChild( oRadio );
                    styleKnockoutChoiceLabel( oLabel, oRadio );
                }
                else
                {
                    oRadio.style.marginRight = '6px';
                    oLabel.appendChild( oRadio );
                    VoetbalOog_Control_Factory().appendTeam( oLabel, oTeam, false, false, false, false );
                    styleKnockoutChoiceLabel( oLabel, oRadio );
                }

                if ( bIsHome ) oHomeLabel = oLabel;
                else oAwayLabel = oLabel;

                oCell.appendChild( oLabel );

                // Hidden input to submit the current-round qualifier bet with the form.
                var oHidden = document.createElement("input");
                oHidden.type = "hidden";
                oHidden.name = sHiddenId;
                oHidden.value = oTeam.getId();
                oCell.appendChild( oHidden );

                // Count this current-round qualify bet as done for the first knockout round.
                // (For later rounds these bets are already counted as winner picks in the previous tab.)
                if ( bCountCurrentQualify )
                    updateBetsToDo( 1, oCell, false );
            }
            else
            {
                // Deadline passed or teams unknown: static display.
                if ( oTeam != null )
                    VoetbalOog_Control_Factory().appendTeam( oCell, oTeam, false, false, false, false );
                else
                    VoetbalOog_Control_Factory().appendPoulePlace( oCell, oPoulePlace, false, false );

                if ( oTeam != null )
                {
                    var oHidden2 = document.createElement("input");
                    oHidden2.type = "hidden";
                    oHidden2.name = sHiddenId;
                    oHidden2.value = oTeam.getId();
                    oCell.appendChild( oHidden2 );
                }
            }
        }

        // Home cell
        var oHomeCell = oRow.insertCell( oRow.cells.length );
        oHomeCell.align = "right";
        appendTeamCell( oHomeCell, oHomeTeam, oHomePoulePlace, true );

        // Score cell — always " - "; background: red = no bet, green = bet made.
        oScoreCell = oRow.insertCell( oRow.cells.length );
        oScoreCell.align = "center";
        oScoreCell.noWrap = "true";
        oScoreCell.appendChild( document.createTextNode( " - " ) );
        oScoreCell.style.backgroundColor = ( oWinnerTeam != null ) ? '#dff0d8' : '#f2dede';

        // Away cell
        var oAwayCell = oRow.insertCell( oRow.cells.length );
        appendTeamCell( oAwayCell, oAwayTeam, oAwayPoulePlace, false );

        // Count this winner pick toward bets-to-do.
        if ( bCanShowRadio )
        {
            var nDelta = ( oWinnerTeam != null ) ? 1 : null;
            updateBetsToDo( nDelta, oScoreCell, false );
        }
    }

    function showPouleGames( oTable, oPoule, oRoundBetConfigs )
    {
        var arrGames = oPoule.getGamesByDate();

        for ( var nJ = 0 ; nJ < arrGames.length ; nJ++ )
        {
            var oGame = arrGames[nJ];

            var oRow = oTable.insertRow( oTable.rows.length );

            var oCell = oRow.insertCell( oRow.cells.length );
            oCell.innerHTML = dateFormat( oGame.getStartDateTime(), 'dd mmm');
            oCell.className = 'hidden-xs';

            oCell = oRow.insertCell( oRow.cells.length );
            oCell.innerHTML = dateFormat( oGame.getStartDateTime(), 'HH:MM');
            oCell.className = 'hidden-xs';

            if ( oRoundBetConfigs[ VoetbalOog_Bet_Qualify.nId ] != undefined )
            {
                renderKnockoutGameCells( oRow, oGame, oRoundBetConfigs );
            }
            else
            {
                oCell = oRow.insertCell( oRow.cells.length );
                oCell.align = "right";
                oCell.style.verticalAlign = "middle";
                createPoulePlaceControl( oCell, oGame.getHomePoulePlace(), oRoundBetConfigs, true );

                oCell = oRow.insertCell( oRow.cells.length );
                oCell.align = "center";
                oCell.noWrap = "true";
                createResultControl( oCell, oGame, oRoundBetConfigs );

                oCell = oRow.insertCell( oRow.cells.length );
                oCell.style.verticalAlign = "middle";
                createPoulePlaceControl( oCell, oGame.getAwayPoulePlace(), oRoundBetConfigs, false );
            }

            if ( oPoule.needsRanking() == false )
            {
                oCell = oRow.insertCell( oRow.cells.length );
                oCell.align = "center";
                oCell.innerHTML = VoetbalOog_Poule_Factory().getName( oPoule, false );

                if ( oRoundBetConfigs[ VoetbalOog_Bet_Qualify.nId ] != undefined )
                {
                    oCell = oRow.insertCell( oRow.cells.length );
                    oCell.align = "center";
                    oCell.innerHTML = getOpponentPouleName( oPoule );
                }
            }
        }
    }

    function showWinner( oTable, oPoule, oRoundBetConfigs )
    {
        var oPoulePlaces = oPoule.getPlaces();

        for ( var nI in oPoulePlaces )
        {
            if ( !( oPoulePlaces.hasOwnProperty( nI ) ) )
                continue;

            var oPoulePlace = oPoulePlaces[nI];

            var oRow = oTable.insertRow( oTable.rows.length );

            var oCell = oRow.insertCell( oRow.cells.length );

            createPoulePlaceControl( oCell, oPoulePlace, oRoundBetConfigs, false );
        }
    }

    function getGamesColumns()
    {
        return m_arrColumnsGames;
    }

    function autoInputQualifiers( nRoundId )
    {
        var oPool = m_oPoolUser.getPool();
        var oCompetitionSeason = oPool.getCompetitionSeason();
        var oRounds = oCompetitionSeason.getRounds();
        var oRound = oRounds[nRoundId];

        var oRoundBetConfigs = m_oPoolUser.getPool().getBetConfigs( oRound );
        var oRoundBetConfig = oRoundBetConfigs[ VoetbalOog_Bet_Qualify.nId ];
        if ( oRoundBetConfig == undefined )
            return;

        var oPreviousRound = oRound.getPrevious();
        if ( oPreviousRound == null )
            return;

        var oPreviousRoundBetConfigs = m_oPoolUser.getPool().getBetConfigs( oPreviousRound );
        var oPreviousRoundBetConfig = oPreviousRoundBetConfigs[ VoetbalOog_Bet_Score.nId ];
        if ( oPreviousRoundBetConfig == null )
            oPreviousRoundBetConfig = oPreviousRoundBetConfigs[ VoetbalOog_Bet_Result.nId ];
        if ( oPreviousRoundBetConfig == undefined )
            return;

        var oRanking = new VoetbalOog_Ranking( oCompetitionSeason.getPromotionRule() );

        var oPoules = oRound.getPoules();

        var oClonedGamesPerPoule = new Object();
        {
            var oFromPoules = oPreviousRound.getPoules();
            for ( var nI in oFromPoules ) {
                if (!( oFromPoules.hasOwnProperty(nI) ))
                    continue;
                var oFromPoule = oFromPoules[nI];
                oClonedGamesPerPoule[ oFromPoule.getId() ] = getClonedGamesFromUserBets( oFromPoule, oPreviousRoundBetConfig);
            }
        }

        for ( var nI in oPoules )
        {
            if ( !( oPoules.hasOwnProperty( nI ) ) )
                continue;

            var oPoule = oPoules[nI];

            var oPoulePlaces = oPoule.getPlaces();
            for ( var nJ in oPoulePlaces )
            {
                if ( !( oPoulePlaces.hasOwnProperty( nJ ) ) )
                    continue;

                var oPoulePlace = oPoulePlaces[nJ];
                if ( !canResolvePoulePlaceFromPreviousRound( oPoulePlace, oPreviousRoundBetConfig ) )
                    continue;

                var oQualifiedTeam = getTeamFromQualifyRule( oPoulePlace, oClonedGamesPerPoule, oRanking );
                if ( oQualifiedTeam == null )
                    continue;

                var sControlId = getControlId( oRoundBetConfig, oPoulePlace, null );
                var oWrapper = document.getElementById( sControlId );
                if ( oWrapper == null )
                    continue;

                var oRadios = oWrapper.querySelectorAll( 'input[type="radio"]' );

                // set m_vtOldValue to the currently checked radio (or -1 if none)
                var oCurrentlyChecked = oWrapper.querySelector( 'input[type="radio"]:checked' );
                m_vtOldValue = oCurrentlyChecked ? parseInt( oCurrentlyChecked.value, 10 ) : -1;

                for ( var i = 0 ; i < oRadios.length; i++ )
                {
                    if ( parseInt( oRadios[i].value, 10 ) == oQualifiedTeam.getId() )
                    {
                        oRadios[i].checked = true;
                        m_oJQuery( oRadios[i] ).trigger( "change" );
                        break;
                    }
                }
            }
        }
    }

    // Herbereken alle knockout-kwalificaties na elke groepsscore-wijziging
    function rebuildKnockoutQualifiersFromGroups() {
        var oPool = m_oPoolUser.getPool();
        var oCompetitionSeason = oPool.getCompetitionSeason();
        var oRounds = oCompetitionSeason.getRounds();

        // Zoek ronde 1
        var oRound1 = null;
        for (var nRId in oRounds) {
            if (!oRounds.hasOwnProperty(nRId)) continue;
            if (oRounds[nRId].getNumber && oRounds[nRId].getNumber() === 1) {
                oRound1 = oRounds[nRId];
                break;
            }
        }

        // Sla de huidige teamtoewijzingen van ronde 1 op vóór de herbouw
        var oOldTeamIds = {};
        var oRBC1 = undefined;
        var oBets1 = undefined;
        if (oRound1 != null) {
            oRBC1 = oPool.getBetConfigs(oRound1)[VoetbalOog_Bet_Qualify.nId];
            if (oRBC1 != undefined) {
                oBets1 = m_oPoolUser.getBets(oRBC1);
                for (var sId in oBets1) {
                    if (!oBets1.hasOwnProperty(sId)) continue;
                    var b = oBets1[sId];
                    if (b != null && b.getTeam() != null)
                        oOldTeamIds[sId] = b.getTeam().getId();
                }
            }
        }

        // Herbouw qualifier bets (alleen ronde 1 wordt daadwerkelijk bijgewerkt)
        for (var nRoundId in oRounds) {
            if (!oRounds.hasOwnProperty(nRoundId)) continue;
            var oRound = oRounds[nRoundId];
            if (oRound.getNumber && oRound.getNumber() >= 1) {
                fillQualifierBetsData(oRound.getId());
            }
        }

        // Propageer gewijzigde teamtoewijzingen van ronde 1 naar ronde 2+
        // Gebruik een atomische batch-update om swap-problemen te voorkomen:
        // bij sequentieel propageren zou A→B gevolgd door B→A de eerste wijziging ongedaan maken.
        var oChangeMap = {};
        var bAnyChanged = false;
        if (oRound1 != null && oRBC1 != undefined && oBets1 != undefined) {
            for (var sId in oBets1) {
                if (!oBets1.hasOwnProperty(sId)) continue;
                var b = oBets1[sId];
                var nNewId = (b != null && b.getTeam() != null) ? b.getTeam().getId() : null;
                var nOldId = (oOldTeamIds[sId] != undefined) ? oOldTeamIds[sId] : null;
                if (nOldId !== nNewId && (nOldId != null || nNewId != null)) {
                    bAnyChanged = true;
                    if (nOldId != null) {
                        oChangeMap[nOldId] = nNewId; // nNewId mag null zijn (team verwijderd)
                    }
                }
            }
        }

        // Pas alle teamwijzigingen in één pass toe op ronden 2+ (atomisch, geen volgorde-problemen).
        if (bAnyChanged && oRound1 != null) {
            var oApplyRound = oRound1.getNext();
            while (oApplyRound != null) {
                var oApplyRBC = m_oPoolUser.getPool().getBetConfigs(oApplyRound)[VoetbalOog_Bet_Qualify.nId];
                if (oApplyRBC != undefined) {
                    var oApplyBets = m_oPoolUser.getBets(oApplyRBC);
                    for (var sApplyId in oApplyBets) {
                        if (!oApplyBets.hasOwnProperty(sApplyId)) continue;
                        var oApplyBet = oApplyBets[sApplyId];
                        if (oApplyBet != null && oApplyBet.getTeam() != null) {
                            var nApplyTeamId = oApplyBet.getTeam().getId();
                            if (oChangeMap.hasOwnProperty(nApplyTeamId)) {
                                oApplyBet.putTeam(oChangeMap[nApplyTeamId]);
                            }
                        }
                    }
                }
                oApplyRound = oApplyRound.getNext();
            }
            rerenderRoundPaneChain(oRound1);
        }
    }

    // Fills qualifier bets for nRoundId from the previous round's score/result bets.
    // Only updates in-memory data; no DOM interaction.
    // Must be called before rendering so team names are available.
    function fillQualifierBetsData( nRoundId )
    {
        var oPool = m_oPoolUser.getPool();
        var oCompetitionSeason = oPool.getCompetitionSeason();
        var oRounds = oCompetitionSeason.getRounds();
        var oRound = oRounds[nRoundId];

        if ( oRound.getNumber && oRound.getNumber() === 1 )
            m_oLoggedThirdPlaceQRs = {};

        var oRoundBetConfigs = m_oPoolUser.getPool().getBetConfigs( oRound );
        var oRoundBetConfig = oRoundBetConfigs[ VoetbalOog_Bet_Qualify.nId ];
        if ( oRoundBetConfig == undefined )
            return;

        var oPreviousRound = oRound.getPrevious();
        if ( oPreviousRound == null )
            return;

        var oPreviousRoundBetConfigs = m_oPoolUser.getPool().getBetConfigs( oPreviousRound );
        var oPreviousRoundBetConfig = oPreviousRoundBetConfigs[ VoetbalOog_Bet_Score.nId ];
        if ( oPreviousRoundBetConfig == null )
            oPreviousRoundBetConfig = oPreviousRoundBetConfigs[ VoetbalOog_Bet_Result.nId ];
        if ( oPreviousRoundBetConfig == undefined )
            return;

        var oRanking = new VoetbalOog_Ranking( oCompetitionSeason.getPromotionRule() );
        var oPoules = oRound.getPoules();

        var oClonedGamesPerPoule = new Object();
        {
            var oFromPoules = oPreviousRound.getPoules();
            for ( var nI in oFromPoules ) {
                if (!( oFromPoules.hasOwnProperty(nI) )) continue;
                var oFromPoule = oFromPoules[nI];
                oClonedGamesPerPoule[ oFromPoule.getId() ] = getClonedGamesFromUserBets( oFromPoule, oPreviousRoundBetConfig );
            }
        }

        var oBets = m_oPoolUser.getBets( oRoundBetConfig );
        for ( var nI in oPoules )
        {
            if ( !( oPoules.hasOwnProperty( nI ) ) ) continue;
            var oPoule = oPoules[nI];
            var oPoulePlaces = oPoule.getPlaces();
            for ( var nJ in oPoulePlaces )
            {
                if ( !( oPoulePlaces.hasOwnProperty( nJ ) ) ) continue;
                var oPoulePlace = oPoulePlaces[nJ];
                if ( !canResolvePoulePlaceFromPreviousRound( oPoulePlace, oPreviousRoundBetConfig ) )
                    continue;
                var oQualifiedTeam = getTeamFromQualifyRule( oPoulePlace, oClonedGamesPerPoule, oRanking );

                var oBet = oBets[ oPoulePlace.getId() ];
                var nOldTeamId = ( oBet != undefined && oBet.getTeam() != null ) ? oBet.getTeam().getId() : null;
                if ( oQualifiedTeam == null )
                {
                    if ( oBet != undefined )
                    {
                        oBet.putTeam( null );
                    }
                    continue;
                }
                if ( oBet == undefined )
                {
                    oBet = VoetbalOog_Bet_Factory().createObject( oRoundBetConfig.getBetType() );
                    oBet.putId( "__NEW__" + oPoulePlace.getId() );
                    oBet.putPoolUser( m_oPoolUser );
                    oBet.putRoundBetConfig( oRoundBetConfig );
                    oBet.putPoulePlace( oPoulePlace );
                    oBets[ oPoulePlace.getId() ] = oBet;
                }
                oBet.putTeam( oQualifiedTeam.getId() );
            }
        }
    }

    // Creates a div containing radio buttons for a qualify bet.
    // The div gets id=sControlId so it can be found later.
    // Returns the wrapper div (not yet attached to any container).
    function createQualifyRadioGroup( sControlId, oPoulePlace, oTeamBetted )
    {
        var oWrapper = document.createElement("div");
        oWrapper.id = sControlId;
        oWrapper.style.display = "inline-block";

        var oTeams = new Object();
        getTeamsForQualify( oPoulePlace, oTeams );

        for ( var nId in oTeams )
        {
            if ( !( oTeams.hasOwnProperty( nId ) ) )
                continue;

            var oTeam = oTeams[nId];

            var oLabel = document.createElement("label");
            oLabel.className = "radio-inline";
            oLabel.style.fontWeight = "normal";
            oLabel.style.marginRight = "6px";

            var oRadio = document.createElement("input");
            oRadio.type = "radio";
            oRadio.name = sControlId;
            oRadio.value = oTeam.getId();

            styleQualifyRadioLabel( oLabel, oRadio );

            if ( oTeamBetted != null && oTeamBetted.getId() == oTeam.getId() )
                oRadio.checked = true;

            oRadio.onfocus = function() {
                var oChk = document.querySelector( 'input[type="radio"][name="' + this.name + '"]:checked' );
                m_vtOldValue = oChk ? parseInt( oChk.value, 10 ) : -1;
            };
            oRadio.onchange = function() {
                updateBetQualifyFromRadio( this );
                m_vtOldValue = parseInt( this.value, 10 );
            };

            oLabel.appendChild( oRadio );
            oLabel.appendChild( document.createTextNode( "\u00a0" + oTeam.getName() ) );
            oWrapper.appendChild( oLabel );
        }

        return oWrapper;
    }

    function createPoulePlaceControl( oTableCell, oPoulePlace, oRoundBetConfigs, bReverse )
    {
        var oRoundBetConfig = oRoundBetConfigs[ VoetbalOog_Bet_Qualify.nId ];
        if ( oRoundBetConfig != undefined )
        {
            var oTeamBetted = null;
            {
                var oBets = m_oPoolUser.getBets( oRoundBetConfig );
                var oBet = oBets[ oPoulePlace.getId() ];
                if ( oBet != null && oBet.getTeam() != null )
                    oTeamBetted = oBet.getTeam();
            }

            var oDeadLine = oRoundBetConfig.getDeadLine( null );
            if ( m_oNow <= oDeadLine ) // not passed deadline
            {
                var sControlId = getControlId( oRoundBetConfig, oPoulePlace, null );
                // Knockout rounds: show the auto-computed team name (no interactive radio).
                // The winner radio in the score cell handles the next-round qualifier bet.
                if ( oTeamBetted != null )
                    VoetbalOog_Control_Factory().appendTeam( oTableCell, oTeamBetted, bReverse, false, false, false );
                else
                    VoetbalOog_Control_Factory().appendPoulePlace( oTableCell, oPoulePlace, bReverse, false );

                // Submit qualifier bet via hidden input so the server can save it.
                if ( oTeamBetted != null )
                {
                    var oHidden = document.createElement("input");
                    oHidden.type = "hidden";
                    oHidden.name = sControlId;
                    oHidden.value = oTeamBetted.getId();
                    oTableCell.appendChild( oHidden );
                }
            }
            else // passed limit show team betted
            {
                if ( oTeamBetted == null )
                    oTableCell.innerHTML = "niets ingevuld";
                else
                    VoetbalOog_Control_Factory().appendTeam( oTableCell, oTeamBetted, bReverse, false, false, false );
            }
        }
        else
        {
            VoetbalOog_Control_Factory().appendPoulePlace( oTableCell, oPoulePlace, bReverse, false );
        }
    }

    function updateBetQualify( oControl )
    {
        var oRoundBetConfig = getRoundBetConfigFromControlId( oControl );

        var sPoulePlaceId = getObjectIdFromControlId( oControl );
        var oPoulePlace = VoetbalOog_PoulePlace_Factory().createObjectFromDatabase( sPoulePlaceId );

        var oBets = m_oPoolUser.getBets( oRoundBetConfig );
        var oBet = oBets[ sPoulePlaceId ];
        var nOldTeamId = null;
        if ( oBet != undefined && oBet.getTeam() != null )
            nOldTeamId = oBet.getTeam().getId();
        if ( oBet == undefined )
        {
            var nBetType = oRoundBetConfig.getBetType();
            oBet = VoetbalOog_Bet_Factory().createObject( nBetType );
            oBet.putId( "__NEW__" + oPoulePlace.getId() );
            oBet.putPoolUser( m_oPoolUser );
            oBet.putRoundBetConfig( oRoundBetConfig );
            oBet.putPoulePlace( oPoulePlace );

            oBets[ sPoulePlaceId ] = oBet;
        }
        var vtTeamId = parseInt( oControl.value, 10 );
        if ( vtTeamId == -1 )
            vtTeamId = null;
        oBet.putTeam( vtTeamId );

        // start : update bets to do(done)
        var nDelta = 0;
        if ( m_vtOldValue < 0 && oControl.value >= 0  )
            nDelta = 1;
        else if ( m_vtOldValue >= 0 && oControl.value < 0 )
            nDelta = -1;
        updateBetsToDo( nDelta, oControl.parentNode, true );
        // end : update bets to do(done)

        propagateQualifyTeamChange( oPoulePlace.getPoule().getRound(), nOldTeamId, vtTeamId );

        // start : update next qualifying
		var oToQualifyRules = oPoulePlace.getPoule().getRound().getToQualifyRules();
		refreshOptionsForQualifying( oToQualifyRules, oPoulePlace.getPoule() );
        // end : update next qualifying

        // Re-render from this round (not .getNext()) so the hidden inputs in this round's
        // pane are rebuilt with the updated team before the form is saved.
        rerenderRoundPaneChain( oPoulePlace.getPoule().getRound() );
    }

    // Handles a change on a qualify radio button.
    // Parses the poule-place / round-bet-config from oRadio.name (the group name).
    function updateBetQualifyFromRadio( oRadio )
    {
        var sControlId = oRadio.name;
        var sPrefix = m_sDivId + m_sControlPrefix;
        var sRest = sControlId.substr( sPrefix.length );
        var sRoundBetConfigId = sRest.substr( 0, sRest.indexOf("_") );
        var sPoulePlaceId = sRest.substr( sRest.indexOf("_") + 1 );

        var oRoundBetConfig = VoetbalOog_Round_BetConfig_Factory().createObjectFromDatabase( sRoundBetConfigId );
        var oPoulePlace = VoetbalOog_PoulePlace_Factory().createObjectFromDatabase( sPoulePlaceId );

        var oBets = m_oPoolUser.getBets( oRoundBetConfig );
        var oBet = oBets[ sPoulePlaceId ];
        var nOldTeamId = null;
        if ( oBet != undefined && oBet.getTeam() != null )
            nOldTeamId = oBet.getTeam().getId();
        if ( oBet == undefined )
        {
            var nBetType = oRoundBetConfig.getBetType();
            oBet = VoetbalOog_Bet_Factory().createObject( nBetType );
            oBet.putId( "__NEW__" + oPoulePlace.getId() );
            oBet.putPoolUser( m_oPoolUser );
            oBet.putRoundBetConfig( oRoundBetConfig );
            oBet.putPoulePlace( oPoulePlace );
            oBets[ sPoulePlaceId ] = oBet;
        }

        var vtTeamId = parseInt( oRadio.value, 10 );

        // A team can appear in at most one place per round.
        // If this team is already in a different place in the same round (stale bet),
        // clear it from there and cascade the removal downstream before setting it here.
        for ( var sOtherPlaceId in oBets ) {
            if ( !oBets.hasOwnProperty(sOtherPlaceId) ) continue;
            if ( sOtherPlaceId === sPoulePlaceId ) continue;
            var oOtherBet = oBets[sOtherPlaceId];
            if ( oOtherBet != undefined && oOtherBet.getTeam() != null && oOtherBet.getTeam().getId() === vtTeamId ) {
                oOtherBet.putTeam( null );
                propagateQualifyTeamChange( oPoulePlace.getPoule().getRound(), vtTeamId, null );
                break;
            }
        }

        oBet.putTeam( vtTeamId );

        // Sync the hidden input that carries this slot's bet to the server.
        // It lives in the next round's tab (created by renderKnockoutGameCells for that round).
        // If the next round's teams were unknown at render time, no hidden input exists yet — create one.
        var oHiddenInputs = document.querySelectorAll( 'input[type="hidden"][name="' + sControlId + '"]' );
        if ( oHiddenInputs.length > 0 ) {
            for ( var i = 0; i < oHiddenInputs.length; i++ )
                oHiddenInputs[i].value = vtTeamId;
        } else {
            var oNewHidden = document.createElement("input");
            oNewHidden.type = "hidden";
            oNewHidden.name = sControlId;
            oNewHidden.value = vtTeamId;
            document.getElementById(m_sDivId).appendChild(oNewHidden);
        }

        // update bets to do(done)
        // with radio buttons you can only go from unchecked (-1) to checked (>=0),
        // not the other way around; a change between two checked radios has delta 0.
        var nDelta = ( m_vtOldValue < 0 ) ? 1 : 0;
        // wrapper div is: radio → label → wrapper
        var oWrapper = oRadio.parentNode.parentNode;
        updateBetsToDo( nDelta, oWrapper, true );

        propagateQualifyTeamChange( oPoulePlace.getPoule().getRound(), nOldTeamId, vtTeamId );

        // update next qualifying options
        var oToQualifyRules = oPoulePlace.getPoule().getRound().getToQualifyRules();
        refreshOptionsForQualifying( oToQualifyRules, oPoulePlace.getPoule() );

        // Re-render from this round (not .getNext()) so the hidden inputs in this round's
        // pane are rebuilt with the updated team before the form is saved.
        rerenderRoundPaneChain( oPoulePlace.getPoule().getRound() );
    }

    function propagateQualifyTeamChange( oStartRound, nOldTeamId, nNewTeamId )
    {
        // console.log('[propagate] start: round=' + oStartRound.getNumber() + ' old=' + nOldTeamId + ' new=' + nNewTeamId);
        if ( nOldTeamId == null || nOldTeamId == nNewTeamId )
        {
            // console.log('[propagate] early return: old==null or old==new');
            return;
        }

        var oPool = m_oPoolUser.getPool();
        var oRound = oStartRound.getNext();
        while ( oRound != null )
        {
            var oRoundBetConfigs = oPool.getBetConfigs( oRound );
            var oRoundBetConfig = oRoundBetConfigs[ VoetbalOog_Bet_Qualify.nId ];
            if ( oRoundBetConfig == undefined )
            {
                // console.log('[propagate] round ' + oRound.getNumber() + ': no qualify bet config, skip');
                oRound = oRound.getNext();
                continue;
            }

            var oBets = m_oPoolUser.getBets( oRoundBetConfig );
            var nBetsInRound = Object.keys(oBets).length;
            // console.log('[propagate] round ' + oRound.getNumber() + ': checking ' + nBetsInRound + ' bets for team ' + nOldTeamId);
            for ( var sPoulePlaceId in oBets )
            {
                if ( !( oBets.hasOwnProperty( sPoulePlaceId ) ) )
                    continue;

                var oBet = oBets[ sPoulePlaceId ];
                var oTeamInBet = ( oBet != null ) ? oBet.getTeam() : null;
                var nTeamInBet = ( oTeamInBet != null ) ? oTeamInBet.getId() : null;
                if ( oBet == null || oTeamInBet == null || nTeamInBet != nOldTeamId )
                    continue;

                // console.log('[propagate] round ' + oRound.getNumber() + ': FOUND team ' + nOldTeamId + ' at place ' + sPoulePlaceId + ' → setting to ' + nNewTeamId);
                oBet.putTeam( nNewTeamId );

                var oPoulePlace = oBet.getPoulePlace();
                if ( oPoulePlace == null )
                    oPoulePlace = VoetbalOog_PoulePlace_Factory().createObjectFromDatabase( sPoulePlaceId );

                var sControlId = getControlId( oRoundBetConfig, oPoulePlace, null );
                var oRadios = document.querySelectorAll( 'input[type="radio"][name="' + sControlId + '"]' );
                if ( oRadios.length > 0 )
                {
                    var oNewRadio = null;
                    var oOldRadio = null;
                    for ( var nR = 0; nR < oRadios.length; nR++ )
                    {
                        if ( parseInt( oRadios[nR].value, 10 ) == nNewTeamId )
                            oNewRadio = oRadios[nR];
                        if ( parseInt( oRadios[nR].value, 10 ) == nOldTeamId )
                            oOldRadio = oRadios[nR];
                    }

                    if ( oNewRadio == null && oOldRadio != null )
                    {
                        var oNewTeam = VoetbalOog_Team_Factory().createObjectFromDatabase( nNewTeamId );
                        if ( oNewTeam != null )
                        {
                            var oLabel = oOldRadio.parentNode;
                            var bRadioFirst = ( oLabel != null && oLabel.firstChild === oOldRadio );

                            oOldRadio.value = nNewTeamId;

                            if ( oLabel != null )
                            {
                                while ( oLabel.firstChild )
                                    oLabel.removeChild( oLabel.firstChild );

                                if ( bRadioFirst )
                                {
                                    oOldRadio.style.marginRight = '6px';
                                    oOldRadio.style.marginLeft = '';
                                    oLabel.appendChild( oOldRadio );
                                    VoetbalOog_Control_Factory().appendTeam( oLabel, oNewTeam, false, false, false, false );
                                }
                                else
                                {
                                    VoetbalOog_Control_Factory().appendTeam( oLabel, oNewTeam, true, false, false, false );
                                    oOldRadio.style.marginLeft = '6px';
                                    oOldRadio.style.marginRight = '';
                                    oLabel.appendChild( oOldRadio );
                                }
                            }
                            oNewRadio = oOldRadio;
                        }
                    }

                    for ( var nR2 = 0; nR2 < oRadios.length; nR2++ )
                    {
                        oRadios[nR2].checked = false;
                        var oLbl2 = oRadios[nR2].parentNode;
                        if ( oLbl2 != null && oLbl2.className != undefined )
                            oLbl2.className = oLbl2.className.replace( " active", "" );
                    }

                    if ( oNewRadio != null ) {
                        oNewRadio.checked = true;
                        var oParentLabel = oNewRadio.parentNode;
                        if ( oParentLabel != null && oParentLabel.className != undefined && oParentLabel.className.indexOf( "btn" ) >= 0 && oParentLabel.className.indexOf( " active" ) < 0 )
                            oParentLabel.className += " active";
                    }
                }

                var oHiddenInputs = document.querySelectorAll( 'input[type="hidden"][name="' + sControlId + '"]' );
                if ( oHiddenInputs.length > 0 )
                {
                    for ( var nI = 0; nI < oHiddenInputs.length; nI++ )
                        oHiddenInputs[nI].value = ( nNewTeamId != null ) ? nNewTeamId : "";
                }
                else if ( nNewTeamId != null )
                {
                    var oNewHidden = document.createElement( "input" );
                    oNewHidden.type = "hidden";
                    oNewHidden.name = sControlId;
                    oNewHidden.value = nNewTeamId;
                    document.getElementById( m_sDivId ).appendChild( oNewHidden );
                }
            }

            oRound = oRound.getNext();
        }
    }

    function createResultControl( oTableCell, oGame, oRoundBetConfigs )
    {
        if ( oRoundBetConfigs[ VoetbalOog_Bet_Score.nId ] != undefined )
        {
            var oRoundBetConfig = oRoundBetConfigs[ VoetbalOog_Bet_Score.nId ];
            var oDeadLine = oRoundBetConfig.getDeadLine( oGame );
            if ( m_oNow <= oDeadLine ) // not passed deadline
            {
                appendScoreSelect( oTableCell, oRoundBetConfigs, oGame, '_homegoals' );
                oTableCell.appendChild( document.createTextNode(" - ") );
                appendScoreSelect( oTableCell, oRoundBetConfigs, oGame, '_awaygoals' );
            }
            else
            {
                var oBets = m_oPoolUser.getBets( oRoundBetConfig );
                var oBet = oBets[ oGame.getId() ];
                if ( oBet == null )
                    oTableCell.innerHTML = " - ";
                else
                    oTableCell.appendChild( document.createTextNode( oBet.getHomeGoals() + " - " + oBet.getAwayGoals() ) );
            }
        }
        else if ( oRoundBetConfigs[ VoetbalOog_Bet_Result.nId ] != undefined )
        {
            var oRoundBetConfig = oRoundBetConfigs[ VoetbalOog_Bet_Result.nId ];
            var oDeadLine = oRoundBetConfig.getDeadLine( oGame );
            if ( m_oNow <= oDeadLine ) // not passed deadline
            {
                appendResultSelect( oTableCell, oRoundBetConfigs, oGame );
            }
            else
            {
                var nResultBetted = getResultBetted( oRoundBetConfig, oGame );
                var sDescription = VoetbalOog_Bet_Factory().getResultDescription( nResultBetted );
                oTableCell.appendChild( document.createTextNode( sDescription ) );
            }
        }
        else
        {
            oTableCell.appendChild( document.createTextNode(" - ") );
        }
    }

    function appendScoreSelect( oContainer, oRoundBetConfigs, oGame, sPostfix )
    {
        var oRoundBetConfig = oRoundBetConfigs[ VoetbalOog_Bet_Score.nId ];

        var nGoalsBetted = getGoalsBetted( sPostfix, oRoundBetConfig, oGame );

        var oSelect = oContainer.appendChild( document.createElement("select") );
        oSelect.id = getControlId( oRoundBetConfig, oGame, sPostfix );
        oSelect.name = oSelect.id;
        oSelect.className = "form-control";
        oSelect.style.display = "inline-block";
        oSelect.style.width = "auto";
        oSelect.onchange = function(){
            updateBetScore( this, sPostfix );
            m_vtOldValue = this.options[this.selectedIndex].value;
        };
        oSelect.onfocus = function(){ m_vtOldValue = this.options[this.selectedIndex].value; };

        oSelect.options.add( new Option( '', -1 ) );

        for ( var nI = 0 ; nI < 10 ; nI++ )
        {
            var oOption = new Option( nI, nI );
            if ( nGoalsBetted != null && nGoalsBetted == nI )
                oOption.selected = true;
            oSelect.options.add( oOption );
        }

        if ( sPostfix == '_awaygoals' )
        {
            var sControlIdHomeGoals = oSelect.id.replace( sPostfix, '_homegoals' );
            var oControlHomeGoals = document.getElementById( sControlIdHomeGoals );
            var nGoalsBettedHome = oControlHomeGoals.options[ oControlHomeGoals.selectedIndex].value;

            var nDelta = ( nGoalsBetted >= 0 && nGoalsBettedHome >= 0 ) ? 1 : null;
            updateBetsToDo( nDelta, oSelect.parentNode, false );

            // Auto-derive result bet from score and add as hidden input.
            var oResultBetConfig = oRoundBetConfigs[ VoetbalOog_Bet_Result.nId ];
            if ( oResultBetConfig != undefined )
            {
                var sResultControlId = getControlId( oResultBetConfig, oGame, null );
                var oHiddenResult = document.createElement("input");
                oHiddenResult.type = "hidden";
                oHiddenResult.id   = sResultControlId;
                oHiddenResult.name = sResultControlId;
                if ( nGoalsBetted >= 0 && nGoalsBettedHome >= 0 )
                    oHiddenResult.value = ( nGoalsBettedHome > nGoalsBetted ) ? 1
                                        : ( nGoalsBettedHome < nGoalsBetted ) ? -1 : 0;
                else
                    oHiddenResult.value = -2;
                oSelect.parentNode.appendChild( oHiddenResult );
                updateBetsToDo( nDelta, oSelect.parentNode, false );
            }
        }

        return oSelect;
    }

    function updateBetScore( oControl, sPostfix )
    {
        var oRoundBetConfig = getRoundBetConfigFromControlId( oControl );

        var sGameId = getObjectIdFromControlId( oControl );
        var oGame = VoetbalOog_Game_Factory().createObjectFromDatabase( sGameId );

        var oBets = m_oPoolUser.getBets( oRoundBetConfig );
        var oBet = oBets[ sGameId ];
        if ( oBet == undefined )
        {
            var nBetType = oRoundBetConfig.getBetType();
            oBet = VoetbalOog_Bet_Factory().createObject( nBetType );
            oBet.putId( "__NEW__" + oGame.getId() );
            oBet.putPoolUser( m_oPoolUser );
            oBet.putRoundBetConfig( oRoundBetConfig );
            oBet.putGame( oGame );
            oBet.putHomeGoals( -1 );
            oBet.putAwayGoals( -1 );

            oBets[ sGameId ] = oBet;
        }

        var sPostfixOther = null;
        if ( sPostfix == "_homegoals" ) {
            oBet.putHomeGoals( parseInt( oControl.value, 10 ) );
            sPostfixOther = "_awaygoals";
        }
        else if ( sPostfix == "_awaygoals" ) {
            oBet.putAwayGoals( parseInt( oControl.value, 10 ) );
            sPostfixOther = "_homegoals";
        }

        var oRound = oRoundBetConfig.getRound();
        var oNextRound = oRound.getNext();
        var oNextRoundBetConfig = null;
        var oPreviousRoundTeams = null;
        if ( oRound.getNumber() == 0 && oNextRound != null )
        {
            var oNextRoundBetConfigs = m_oPoolUser.getPool().getBetConfigs( oNextRound );
            oNextRoundBetConfig = oNextRoundBetConfigs[ VoetbalOog_Bet_Qualify.nId ];
            if ( oNextRoundBetConfig != undefined )
            {
                oPreviousRoundTeams = {};
                var oPreviousBets = m_oPoolUser.getBets( oNextRoundBetConfig );
                for ( var sPoulePlaceId in oPreviousBets )
                {
                    if ( !( oPreviousBets.hasOwnProperty( sPoulePlaceId ) ) )
                        continue;

                    var oPreviousBet = oPreviousBets[ sPoulePlaceId ];
                    oPreviousRoundTeams[ sPoulePlaceId ] = ( oPreviousBet != null && oPreviousBet.getTeam() != null ) ? oPreviousBet.getTeam().getId() : null;
                }
            }
        }

        // update bets to do(done)
        {
            var sControlIdOther = oControl.id.replace( sPostfix, sPostfixOther );
            var oControlOther = document.getElementById( sControlIdOther );
            var vtOtherValue = oControlOther.options[ oControlOther.selectedIndex].value;

            var nDelta = 0;
            if ( m_vtOldValue < 0 && oControl.value >= 0 && vtOtherValue >= 0 )
                nDelta = 1;
            else if ( m_vtOldValue >= 0 && oControl.value < 0 && vtOtherValue >= 0 )
                nDelta = -1;

            // var oRoundBetConfigs = m_oPoolUser.getPool().getBetConfigs( oRoundBetConfig.getRound() );
            updateBetsToDo( nDelta, oControl.parentNode, true );
        }

        if ( oRound.getNumber() == 0 ) {
            rebuildKnockoutQualifiersFromGroups();
        }

        // Auto-update the result hidden input derived from the score.
        {
            var oRoundBetConfigs = m_oPoolUser.getPool().getBetConfigs( oRoundBetConfig.getRound() );
            var oResultBetConfig = oRoundBetConfigs[ VoetbalOog_Bet_Result.nId ];
            if ( oResultBetConfig != undefined )
            {
                var sResultControlId = getControlId( oResultBetConfig, oGame, null );
                var oHiddenResult = document.getElementById( sResultControlId );
                if ( oHiddenResult != null )
                {
                    var nHome = parseInt( oBet.getHomeGoals(), 10 );
                    var nAway = parseInt( oBet.getAwayGoals(), 10 );
                    if ( nHome >= 0 && nAway >= 0 )
                        oHiddenResult.value = ( nHome > nAway ) ? 1 : ( nHome < nAway ) ? -1 : 0;
                    else
                        oHiddenResult.value = -2;
                }
            }
        }

        updatePouleStandings( oGame.getHomePoulePlace().getPoule(), oRoundBetConfig );
        if ( m_oBetHelper != null )
            m_oBetHelper.refresh( oRoundBetConfig, m_oPoolUser, null );
    }

    function getGoalsBetted( sHomeAway, oRoundBetConfig, oGame )
    {
        var nGoalsBetted = -1;

        var oBets = m_oPoolUser.getBets( oRoundBetConfig );
        var oBet = oBets[ oGame.getId() ];
        if ( oBet != null )
        {
            if ( sHomeAway == "_homegoals" )
                nGoalsBetted = oBet.getHomeGoals();
            else if ( sHomeAway == "_awaygoals" )
                nGoalsBetted = oBet.getAwayGoals();
        }
        return nGoalsBetted;
    }

    function appendResultSelect( oContainer, oRoundBetConfigs, oGame )
    {
        var oRoundBetConfig = oRoundBetConfigs[ VoetbalOog_Bet_Result.nId ];

        var nResultBetted = getResultBetted( oRoundBetConfig, oGame );

        var oSelect = oContainer.appendChild( document.createElement("select") );
        oSelect.id = getControlId( oRoundBetConfig, oGame, null );
        oSelect.name = oSelect.id;
        oSelect.className = "form-control";
        oSelect.onchange = function(){
            updateBetResult( this );
            m_vtOldValue = this.options[this.selectedIndex].value;
        };
        oSelect.onfocus = function(){ m_vtOldValue = this.options[this.selectedIndex].value; };

        oSelect.options.add( new Option( '', -2 ) );

        var oOption = new Option( 'Thuis wint', 1 );
        if ( nResultBetted != null && nResultBetted == 1 )
            oOption.selected = true;
        oSelect.options.add( oOption );

        var oOption = new Option( 'Gelijk', 0 );
        if ( nResultBetted != null && nResultBetted == 0 )
            oOption.selected = true;
        oSelect.options.add( oOption );

        var oOption = new Option( 'Uit wint', -1 );
        if ( nResultBetted != null && nResultBetted == -1 )
            oOption.selected = true;
        oSelect.options.add( oOption );

        var nDelta = ( nResultBetted != -2 ) ? 1 : null;
        updateBetsToDo( nDelta, oSelect.parentNode, false );

        return oSelect;
    }

    function updateBetResult( oControl )
    {
        var oRoundBetConfig = getRoundBetConfigFromControlId( oControl );

        var sGameId = getObjectIdFromControlId( oControl );
        var oGame = VoetbalOog_Game_Factory().createObjectFromDatabase( sGameId );

        var oBets = m_oPoolUser.getBets( oRoundBetConfig );
        var oBet = oBets[ sGameId ];
        if ( oBet == undefined )
        {
            var nBetType = oRoundBetConfig.getBetType();
            oBet = VoetbalOog_Bet_Factory().createObject( nBetType );
            oBet.putId( "__NEW__" + oGame.getId() );
            oBet.putPoolUser( m_oPoolUser );
            oBet.putRoundBetConfig( oRoundBetConfig );
            oBet.putGame( oGame );
            // oBet.putResult( -2 );

            oBets[ sGameId ] = oBet;
        }
        oBet.putResult( parseInt( oControl.value, 10 ) );

        // update bets to do(done)
        var nDelta = 0;
        if ( m_vtOldValue == -2 && oControl.value != -2 )
            nDelta = 1;
        else if ( m_vtOldValue != -2 && oControl.value == -2 )
            nDelta = -1;
        updateBetsToDo( nDelta, oControl.parentNode, true );

        updatePouleStandings( oGame.getHomePoulePlace().getPoule(), oRoundBetConfig );

        if ( m_oBetHelper != null )
            m_oBetHelper.refresh( oRoundBetConfig, m_oPoolUser, null );
    }

    function getResultBetted( oRoundBetConfig, oGame )
    {
        var nResultBetted = -2;
        {
            var oBets = m_oPoolUser.getBets( oRoundBetConfig );
            var oBet = oBets[ oGame.getId() ];
            if ( oBet != null )
                nResultBetted = oBet.getResult();
        }

        return nResultBetted;
    }

    function updatePouleStandings( oPoule, oRoundBetConfig )
    {
        var oContainer = document.getElementById( getPouleRankingDivId( oPoule ) );
        if ( oContainer == null )
            return;

        var oClonedGames = getClonedGamesFromUserBets( oPoule, oRoundBetConfig );

        Ctrl_RankView().putQualifierLines( oPoule.getQualifierLines() );
        Ctrl_RankView().show( oContainer, oClonedGames, oPoule.getRound().getCompetitionSeason().getPromotionRule(), {} );

        if ( oPoule.getRound().getNumber() === 0 )
            updateThirdPlaceStandings( oPoule.getRound(), oRoundBetConfig );
    }

    function updateThirdPlaceStandings( oRound, oRoundBetConfig, oContainer, bUseRealScores )
    {
        if ( oContainer == null )
            oContainer = document.getElementById( 'thirdplace-ranking-' + oRound.getNumber() );
        if ( oContainer == null )
            return;

        while ( oContainer.hasChildNodes() )
            oContainer.removeChild( oContainer.lastChild );

        var oPoules = oRound.getPoules();
        var arrPoules = [];
        for ( var nK in oPoules ) {
            if ( oPoules.hasOwnProperty( nK ) ) arrPoules.push( oPoules[nK] );
        }

        var oAllGames = {};
        var oPoulePlaces = {};
        for ( var nK = 0; nK < arrPoules.length; ++nK ) {
            var oPoule = arrPoules[nK];
            var oGames = ( bUseRealScores === true ) ? oPoule.getGames() : getClonedGamesFromUserBets( oPoule, oRoundBetConfig );
            for ( var gId in oGames ) {
                if ( oGames.hasOwnProperty( gId ) ) oAllGames[gId] = oGames[gId];
            }
            var ranking = new VoetbalOog_Ranking( oRound.getCompetitionSeason().getPromotionRule() );
            ranking.updatePoulePlaceRankings( oGames, null );
            var arrRanked = ranking.getPoulePlacesByRanking( oGames, null );
            if ( arrRanked.length >= 3 && arrRanked[2] ) {
                oPoulePlaces[ oPoule.getId() ] = arrRanked[2];
            }
        }

        var nCount = 0;
        for ( var nKc in oPoulePlaces ) { if ( oPoulePlaces.hasOwnProperty( nKc ) ) nCount++; }
        if ( nCount === 0 )
            return;

        var crossRanking = new VoetbalOog_Ranking( oRound.getCompetitionSeason().getPromotionRule() );
        crossRanking.updatePoulePlaceRankings( oAllGames, oPoulePlaces );
        var arrSorted = crossRanking.getPoulePlacesByRanking( oAllGames, oPoulePlaces );

        var oDiv = oContainer.appendChild( document.createElement('div') );
        oDiv.style.marginTop = '30px';
        var oHeader = oDiv.appendChild( document.createElement('h5') );
        oHeader.style.textAlign = 'center';
        oHeader.style.fontWeight = 'bold';
        oHeader.innerHTML = 'Stand nummers 3 (beste nummers 3)';
        var oTable = document.createElement('table');
        oTable.className = m_sTableClassName;
        oDiv.appendChild( oTable );
        var oRowHeader = oTable.insertRow( oTable.rows.length );
        oRowHeader.className = 'tableheader';
        var headers = ['pl', 'team', 'P', 'g', 'p', 'v', 't'];
        for ( var h = 0; h < headers.length; ++h ) {
            var oCell = oRowHeader.insertCell( oRowHeader.cells.length );
            oCell.innerHTML = headers[h];
            if ( headers[h] === 'team' ) oCell.style.textAlign = 'left';
            else if ( headers[h] === 'P' ) oCell.style.textAlign = 'center';
            else oCell.style.textAlign = 'right';
        }
        for ( var r = 0; r < arrSorted.length; ++r ) {
            var oThird = arrSorted[r];
            var oRow = oTable.insertRow( oTable.rows.length );
            if ( r === 8 ) oRow.className = 'qualifyline-single';
            var oCell = oRow.insertCell( oRow.cells.length ); oCell.align = 'right'; oCell.innerHTML = (r + 1);
            oCell = oRow.insertCell( oRow.cells.length ); oCell.align = 'left'; VoetbalOog_Control_Factory().appendPoulePlace( oCell, oThird, false, false );
            oCell = oRow.insertCell( oRow.cells.length ); oCell.align = 'center'; oCell.innerHTML = VoetbalOog_Poule_Factory().getName( oThird.getPoule(), false );
            oCell = oRow.insertCell( oRow.cells.length ); oCell.align = 'right'; oCell.innerHTML = oThird.getNrOfPlayedGames( oAllGames );
            oCell = oRow.insertCell( oRow.cells.length ); oCell.align = 'right'; oCell.innerHTML = oThird.getPoints( oAllGames ) - oThird.getPenaltyPoints();
            oCell = oRow.insertCell( oRow.cells.length ); oCell.align = 'right'; oCell.innerHTML = oThird.getNrOfGoalsScored( oAllGames );
            oCell = oRow.insertCell( oRow.cells.length ); oCell.align = 'right'; oCell.innerHTML = oThird.getNrOfGoalsReceived( oAllGames );
        }
    }

    function updateBetsToDo( nDelta, oDiv, bUpdateTotals )
    {
        if ( nDelta != null )
            m_nNrOfBetsDone += nDelta;

        if ( oDiv == undefined )
            return;

        if ( nDelta == null || nDelta < 0 ) {
            oDiv.className = "alert alert-danger";
            oDiv.style.color = "black";
        }
        else if ( nDelta > 0 ) {
            oDiv.className = "";
        }

        var nRoundNr = getRoundNrFromDiv(oDiv);
        if (nRoundNr !== null) {
            if (!(nRoundNr in m_arrBetsAvailablePerRound)) m_arrBetsAvailablePerRound[nRoundNr] = 0;
            if (!(nRoundNr in m_arrBetsDonePerRound))     m_arrBetsDonePerRound[nRoundNr]     = 0;
            if (!bUpdateTotals) {
                m_arrBetsAvailablePerRound[nRoundNr]++;
                if (nDelta === 1) m_arrBetsDonePerRound[nRoundNr]++;
            } else if (nDelta !== 0 && nDelta !== null) {
                m_arrBetsDonePerRound[nRoundNr] += nDelta;
            }
        }

        if ( bUpdateTotals == true )
            updateBetsDoneTotals();
    }

    function updateBetsDoneTotals()
    {
        var nAvailableBets = m_oPoolUser.getPool().getNrOfAvailableBets();
        var oTodoLabel = document.getElementById( 'betedit-todolabel' );
        if ( oTodoLabel != null ) {
            oTodoLabel.innerHTML = m_nNrOfBetsDone + "/" + nAvailableBets + " ingevuld";
            oTodoLabel.className = ( m_nNrOfBetsDone == nAvailableBets ) ? 'btn btn-success btn-sm' : 'btn btn-danger btn-sm';
            oTodoLabel.style.marginLeft = '8px';
        }
        updateTabStates();
    }

    function rerenderRoundPaneChain( oRound )
    {
        while ( oRound != null )
        {
            rerenderRoundPane( oRound );
            oRound = oRound.getNext();
        }
    }

    function rerenderRoundPane( oRound )
    {
        var oPane = document.getElementById( "betedit-roundnr-" + oRound.getNumber() );
        if ( oPane == null )
            return;

        // For the first knockout round, qualify-bets are counted in m_nNrOfBetsDone
        // during rendering (bCountCurrentQualify=true). Subtract the old contribution
        // before clearing and re-rendering to avoid double-counting.
        var nRoundNr = oRound.getNumber();
        if ( nRoundNr !== 0 )
        {
            m_nNrOfBetsDone -= ( m_arrBetsDonePerRound[ nRoundNr ] || 0 );
            m_arrBetsDonePerRound[ nRoundNr ]     = 0;
            m_arrBetsAvailablePerRound[ nRoundNr ] = 0;
        }

        while ( oPane.hasChildNodes() )
            oPane.removeChild( oPane.lastChild );

        showRound( oPane, oRound );
        if ( oRound.getNumber() !== 0 )
            appendTabSaveButton( oPane );
    }

    function storePostSaveTab( sPaneId )
    {
        var nRoundNr = parseInt( sPaneId.replace("betedit-roundnr-", ""), 10 );
        var nDone  = m_arrBetsDonePerRound[nRoundNr]  || 0;
        var nAvail = m_arrBetsAvailablePerRound[nRoundNr] || 0;
        var bAllDone = ( nAvail > 0 && nDone >= nAvail );
        var sTargetId = sPaneId;
        if ( bAllDone ) {
            var oNavLink = document.querySelector( 'a[href="#' + sPaneId + '"]' );
            if ( oNavLink ) {
                var oNextLi = oNavLink.parentElement.nextElementSibling;
                if ( oNextLi ) {
                    var oNextLink = oNextLi.querySelector( 'a[href^="#betedit-roundnr-"]' );
                    if ( oNextLink ) {
                        sTargetId = oNextLink.getAttribute("href").substring(1);
                    }
                }
            }
        }
        try { sessionStorage.setItem( 'betedit_active_tab', sTargetId ); } catch(e) {}
    }

    function appendTabSaveButton( oPane )
    {
        oPane.style.paddingBottom = "40px";
        var oSaveDiv = oPane.appendChild(document.createElement("div"));
        oSaveDiv.style.textAlign = "center";
        oSaveDiv.style.margin = "10px 0";
        var oSaveButton = oSaveDiv.appendChild(document.createElement("input"));
        oSaveButton.type = "submit";
        oSaveButton.className = "btn btn-primary";
        oSaveButton.name = "btnsavebets";
        oSaveButton.value = "opslaan";
        oSaveButton.onclick = function() { storePostSaveTab( oPane.id ); };
    }

    function getRoundNrFromDiv( oDiv )
    {
        var el = oDiv;
        while (el) {
            if (el.id && el.id.indexOf("betedit-roundnr-") === 0)
                return parseInt(el.id.replace("betedit-roundnr-", ""), 10);
            el = el.parentElement;
        }
        return null;
    }

    function updateTabStates()
    {
        var oNav = document.getElementById("betedit-roundnav");
        if (!oNav) return;
        var oItems = oNav.children;
        for (var i = 0; i < oItems.length; i++) {
            var oLi = oItems[i];
            var oLink = oLi.firstElementChild;
            var nRoundNr = parseInt(oLink.getAttribute("href").replace("#betedit-roundnr-", ""), 10);
            var nDone  = m_arrBetsDonePerRound[nRoundNr]  || 0;
            var nAvail = m_arrBetsAvailablePerRound[nRoundNr] || 0;

            // disabled state based on previous round completion
            if (i === 0) {
                oLi.classList.remove("disabled");
            } else {
                var oPrevLink = oItems[i - 1].firstElementChild;
                var nPrevRoundNr = parseInt(oPrevLink.getAttribute("href").replace("#betedit-roundnr-", ""), 10);
                var nPrevDone  = m_arrBetsDonePerRound[nPrevRoundNr]  || 0;
                var nPrevAvail = m_arrBetsAvailablePerRound[nPrevRoundNr] || 0;
                if (nPrevAvail > 0 && nPrevDone >= nPrevAvail) {
                    oLi.classList.remove("disabled");
                } else {
                    oLi.classList.add("disabled");
                }
            }

            // background color based on completion percentage
            if (nAvail > 0) {
                if (nDone >= nAvail) {
                    oLink.style.backgroundColor = "#dff0d8"; // success
                } else if (nDone > 0) {
                    oLink.style.backgroundColor = "#fcf8e3"; // warning
                } else {
                    oLink.style.backgroundColor = "#f2dede"; // danger
                }
            }
        }
    }

    function getClonedGamesFromUserBets( oPoule, oRoundBetConfig )
    {
        var oClonedGames = new Object();
        var oGames = oPoule.getGames();

        for ( var nI in oGames )
        {
            if ( !( oGames.hasOwnProperty( nI ) ) )
                continue;

            var oGame = oGames[nI];
            var oClonedGame = VoetbalOog_Game_Factory().clone( oGame );

            var nHomeGoals = oGame.getHomeGoals();
            var nAwayGoals = oGame.getAwayGoals();
            var nState = g_jsonVoetbal.nState_Scheduled;

            if ( oRoundBetConfig.getBetType() == VoetbalOog_Bet_Score.nId )
            {
                nHomeGoals = getGoalsBetted( "_homegoals", oRoundBetConfig, oGame );
                nAwayGoals = getGoalsBetted( "_awaygoals", oRoundBetConfig, oGame );
                if ( nHomeGoals >= 0 && nAwayGoals >= 0 )
                    nState = g_jsonVoetbal.nState_Played;
            }
            else if ( oRoundBetConfig.getBetType() == VoetbalOog_Bet_Result.nId )
            {
                var nResult = getResultBetted( oRoundBetConfig, oGame );
                if ( nResult == 1 )
                {
                    nHomeGoals = 1;
                    nAwayGoals = 0;
                    nState = g_jsonVoetbal.nState_Played;
                }
                else if ( nResult == 0 )
                {
                    nHomeGoals = 0;
                    nAwayGoals = 0;
                    nState = g_jsonVoetbal.nState_Played;
                }
                else if ( nResult == -1 )
                {
                    nHomeGoals = 0;
                    nAwayGoals = 1;
                    nState = g_jsonVoetbal.nState_Played;
                }
            }
            else
                continue;

            oClonedGame.putHomeGoals( nHomeGoals );
            oClonedGame.putAwayGoals( nAwayGoals );
            oClonedGame.putState( nState );

            oClonedGames[ oClonedGame.getId() ] = oClonedGame;
        }
        return oClonedGames;
    }

    function getTeamsForQualify( oPoulePlaceParam, oTeams )
    {
        if ( oPoulePlaceParam == null )
            return;

        var oFromQualifyRule = oPoulePlaceParam.getFromQualifyRule();
        if ( oFromQualifyRule == null )
            return;

        var oFromPoules = oFromQualifyRule.getFromPoulesByPoulePlace( oPoulePlaceParam );
        if ( Object_Factory().count( oFromPoules ) == 0 )
            return;

        var oRoundBetConfigs = m_oPoolUser.getPool().getBetConfigs( oFromQualifyRule.getFromRound() );
        var oRBCQualify = oRoundBetConfigs[ VoetbalOog_Bet_Qualify.nId ];


        for ( var nI in oFromPoules ) {
            if (!( oFromPoules.hasOwnProperty(nI) ))
                continue;

            var oFromPoule = oFromPoules[nI];

            // if( oFromPoule.getId() === 399 ) {
            //     console.log(
            //         oFromPoules[nI].getId(),
            //         VoetbalOog_Poule_Factory().getName( oFromPoules[nI], true )
            //     );
            // }

            var oPoulePlaces = oFromPoule.getPlaces();
            for (var nJ in oPoulePlaces) {
                if (!( oPoulePlaces.hasOwnProperty(nJ) ))
                    continue;

                var oPoulePlace = oPoulePlaces[nJ];
                var oTeam = oPoulePlace.getTeam();

				var oTeamBetted = null;
				{
					if (oRBCQualify != undefined) {
						var oBets = m_oPoolUser.getBets(oRBCQualify);
						var oBet = oBets[oPoulePlace.getId()];
						if (oBet != null && oBet.getTeam() != null)
						{
							oTeamBetted = oBet.getTeam();
						}
					}
				}

				if (oTeamBetted != null)
					oTeams[oTeamBetted.getId()] = oTeamBetted;
				else if (oTeam != null)
					oTeams[oTeam.getId()] = oTeam;
				else
					getTeamsForQualify(oPoulePlace, oTeams);
            }
        }
    }

    // 1 refill all the next qualifying radio-groups from oToQualifyRules and only where Poule is oFromPoule
    // 2 if the checked team is no longer in the candidate list, deselect and reset the bet
    function refreshOptionsForQualifying( oToQualifyRules, oFromPoule )
    {
		for ( var nI in oToQualifyRules ) {
			if (!( oToQualifyRules.hasOwnProperty(nI) ))
				continue;

			var oToQualifyRule = oToQualifyRules[nI];

			var oFromPoules = oToQualifyRule.getFromPoules();
			if ( oFromPoules[ oFromPoule.getId() ] == null)
				continue;

			var oRoundBetConfigs = m_oPoolUser.getPool().getBetConfigs(oToQualifyRule.getToRound());
			var oRBCQualify = oRoundBetConfigs[VoetbalOog_Bet_Qualify.nId];

			var arrToPoulePlaces = oToQualifyRule.getToPoulePlaces();
			for ( var nJ = 0 ; nJ < arrToPoulePlaces.length ; nJ++ ) {
				var oToPoulePlace = arrToPoulePlaces[nJ];

				if ( oRBCQualify != null )
				{
					var sControlId = getControlId(oRBCQualify, oToPoulePlace, null);
					var oWrapper = document.getElementById(sControlId);
					if (oWrapper != null) {
						// save currently checked team id
						var oCheckedRadio = oWrapper.querySelector('input[type="radio"]:checked');
						var nSelectedTeamId = oCheckedRadio ? parseInt(oCheckedRadio.value, 10) : -1;

						// rebuild radio buttons with fresh candidates
						oWrapper.innerHTML = '';
						var oTeams = new Object();
						getTeamsForQualify(oToPoulePlace, oTeams);

						var bFound = false;
						for (var nId in oTeams) {
							if (!oTeams.hasOwnProperty(nId)) continue;

							var oTeam = oTeams[nId];
							var oLabel = document.createElement("label");
							oLabel.className = "radio-inline";
							oLabel.style.fontWeight = "normal";
							oLabel.style.marginRight = "6px";

							var oRadio = document.createElement("input");
							oRadio.type = "radio";
							oRadio.name = sControlId;
							oRadio.value = oTeam.getId();

                            styleQualifyRadioLabel(oLabel, oRadio);

							if (parseInt(oTeam.getId(), 10) == nSelectedTeamId) {
								oRadio.checked = true;
								bFound = true;
							}

							oRadio.onfocus = function() {
								var oChk = document.querySelector('input[type="radio"][name="' + this.name + '"]:checked');
								m_vtOldValue = oChk ? parseInt(oChk.value, 10) : -1;
							};
							oRadio.onchange = function() {
								updateBetQualifyFromRadio(this);
								m_vtOldValue = parseInt(this.value, 10);
							};

							oLabel.appendChild(oRadio);
							oLabel.appendChild(document.createTextNode("\u00a0" + oTeam.getName()));
							oWrapper.appendChild(oLabel);
						}

						// if previously checked team is no longer a candidate, reset the bet
						if (nSelectedTeamId >= 0 && !bFound) {
							var oBets = m_oPoolUser.getBets(oRBCQualify);
							var oBet = oBets[oToPoulePlace.getId()];
							if (oBet != null)
								oBet.putTeam(null);
							updateBetsToDo(-1, oWrapper, true);
						}
					}
				}

				var oNextToQualifyRules = oToPoulePlace.getPoule().getRound().getToQualifyRules();
				refreshOptionsForQualifying( oNextToQualifyRules, oToPoulePlace.getPoule() );
			}
		}
    }

    function addOptionsToSelect( oSelect, oPoulePlace, oTeamBetted )
    {
        var bSelected = false;

        oSelect.options.add( new Option( '', -1 ) );



        var oTeams = new Object();

        getTeamsForQualify( oPoulePlace, oTeams );

        for ( var nId in oTeams )
        {
            if ( !( oTeams.hasOwnProperty( nId ) ) )
                continue;

            var oTeam = oTeams[nId];


            var oOption = new Option( oTeam.getName(), oTeam.getId() );

            /*
             var oContainerTmp = document.createElement('div');


            var oRound = oRoundBetConfig.getRound();
            var oNextRound = oRound.getNext();
            var oNextRoundBetConfig = null;
            var oPreviousRoundTeams = null;
            if ( oNextRound != null )
            {
                var oNextRoundBetConfigs = m_oPoolUser.getPool().getBetConfigs( oNextRound );
                oNextRoundBetConfig = oNextRoundBetConfigs[ VoetbalOog_Bet_Qualify.nId ];
                if ( oNextRoundBetConfig != undefined )
                {
                    oPreviousRoundTeams = {};
                    var oPreviousBets = m_oPoolUser.getBets( oNextRoundBetConfig );
                    for ( var sPoulePlaceId in oPreviousBets )
                    {
                        if ( !( oPreviousBets.hasOwnProperty( sPoulePlaceId ) ) )
                            continue;

                        var oPreviousBet = oPreviousBets[ sPoulePlaceId ];
                        oPreviousRoundTeams[ sPoulePlaceId ] = ( oPreviousBet != null && oPreviousBet.getTeam() != null ) ? oPreviousBet.getTeam().getId() : null;
                    }
                }
            }

            if ( oRound.getNumber() == 0 )
            {
                fillQualifierBetsData( 1 );

                if ( oPreviousRoundTeams != null )
                {
                    var oCurrentNextRoundBets = m_oPoolUser.getBets( oNextRoundBetConfig );
                    for ( var sCurrentPoulePlaceId in oCurrentNextRoundBets )
                    {
                        if ( !( oCurrentNextRoundBets.hasOwnProperty( sCurrentPoulePlaceId ) ) )
                            continue;

                        var oCurrentBet = oCurrentNextRoundBets[ sCurrentPoulePlaceId ];
                        var nOldTeamId = oPreviousRoundTeams[ sCurrentPoulePlaceId ];
                        var nNewTeamId = ( oCurrentBet != null && oCurrentBet.getTeam() != null ) ? oCurrentBet.getTeam().getId() : null;
                        if ( nOldTeamId != null && nNewTeamId != null && nOldTeamId != nNewTeamId )
                            propagateQualifyTeamChange( oRound, nOldTeamId, nNewTeamId );
                    }
                }
            }
             var oDivTmp = oContainerTmp.appendChild( document.createElement('div') );
             oDivTmp.className = " spriteteam-16 sprite-" + oTeam.getImageName() + "-16";
             oDivTmp.style.paddingLeft = '18px';

             var oSpan = oDivTmp.appendChild( document.createElement("span") );
             oSpan.className = "hidden-xs";
             oSpan.appendChild( document.createTextNode( oTeam.getName() ) );

             var oSpan = oDivTmp.appendChild( document.createElement("span") );
             oSpan.className = "visible-xs";
             oSpan.appendChild( document.createTextNode( oTeam.getAbbreviation().toUpperCase() ) );

             oOption.setAttribute( "data-content", oContainerTmp.innerHTML );
             */
            if ( oTeamBetted != null && oTeamBetted == oTeam ) {
				oOption.selected = true;
                bSelected = true;
            }
            oSelect.options.add( oOption );
        }
        /*
         // sort
         {
         // var nSelected = oSelect.options[oSelect.selectedIndex].value;
         var oOptions = m_oJQuery(oSelect.options);
         oOptions.sort(function(a,b) {
         if (a.text > b.text) return 1;
         else if (a.text < b.text) return -1;
         else return 0;
         })
         m_oJQuery( oSelect ).empty().append( oOptions );
         // m_oJQuery( oSelect ).val( nSelected );
         }
         */
        return bSelected;
    }


    function canResolvePoulePlaceFromPreviousRound( oPoulePlace, oPreviousRoundBetConfig )
    {
        var oQualifyRule = oPoulePlace.getFromQualifyRule();
        if ( oQualifyRule == null )
            return false;

        var arrFromPlaces = oQualifyRule.getFromPoulePlaces();
        var oCheckedPoules = {};
        for ( var nI = 0; nI < arrFromPlaces.length; nI++ )
        {
            var oFromPoule = arrFromPlaces[nI].getPoule();
            if ( oFromPoule == null )
                return false;

            var nFromPouleId = oFromPoule.getId();
            if ( oCheckedPoules[ nFromPouleId ] )
                continue;

            if ( !isPouleFullyBetted( oFromPoule, oPreviousRoundBetConfig ) )
                return false;

            oCheckedPoules[ nFromPouleId ] = true;
        }
        return true;
    }

    function isPouleFullyBetted( oPoule, oRoundBetConfig )
    {
        var oGames = oPoule.getGames();
        for ( var nGameId in oGames )
        {
            if ( !( oGames.hasOwnProperty( nGameId ) ) )
                continue;

            var oGame = oGames[nGameId];
            if ( oRoundBetConfig.getBetType() == VoetbalOog_Bet_Score.nId )
            {
                if ( getGoalsBetted( "_homegoals", oRoundBetConfig, oGame ) < 0
                    || getGoalsBetted( "_awaygoals", oRoundBetConfig, oGame ) < 0 )
                    return false;
            }
            else if ( oRoundBetConfig.getBetType() == VoetbalOog_Bet_Result.nId )
            {
                if ( getResultBetted( oRoundBetConfig, oGame ) == -2 )
                    return false;
            }
        }
        return true;
    }

    /* @TODO oPreviousRoundBetConfig should not be here, check how to remove this */
    function getTeamFromQualifyRule( oPoulePlace, oClonedGamesPerPoule, oRanking )
    {
        var oQualifyRule = oPoulePlace.getFromQualifyRule();
        if ( oQualifyRule == null )
            return null;

        var arrFromPlaces = oQualifyRule.getFromPoulePlaces();
        if ( oQualifyRule.isSingle() )
        {
            var oFromPoulePlace = arrFromPlaces[0];

            var oClonedGames = oClonedGamesPerPoule[ oFromPoulePlace.getPoule().getId() ];
            oRanking.updatePoulePlaceRankings( oClonedGames, null );
            var arrFromPoulePlacesByRank = oRanking.getPoulePlacesByRanking( oClonedGames, null );

            var oFromPoulePlaceByRank = arrFromPoulePlacesByRank[ oFromPoulePlace.getNumber() ];
            if ( oFromPoulePlaceByRank == null || oFromPoulePlaceByRank.getTeam() == null )
                return null;

            return oFromPoulePlaceByRank.getTeam();
        }

        // Multiple
        var oRankedFromPlaces = new Object();
        {
            for( var nI = 0 ; nI < arrFromPlaces.length ; nI++ )
            {
                var oFromPoulePlace = arrFromPlaces[nI];

                var oClonedGames = oClonedGamesPerPoule[ oFromPoulePlace.getPoule().getId() ];
                oRanking.updatePoulePlaceRankings( oClonedGames, null );
                var arrFromPoulePlacesByRank = oRanking.getPoulePlacesByRanking( oClonedGames, null );

                var oFromPoulePlaceByRank = arrFromPoulePlacesByRank[ oFromPoulePlace.getNumber() ];
                if ( oFromPoulePlaceByRank == null )
                    continue;

                oRankedFromPlaces[ oFromPoulePlaceByRank.getId() ] = oFromPoulePlaceByRank;
            }
        }

        var oClonedGamesRound = new Object();
        {
            for( var nI in oClonedGamesPerPoule ) {
                for( var nJ in oClonedGamesPerPoule[nI] ) {
                    var oClonedGame = oClonedGamesPerPoule[nI][nJ];
                    oClonedGamesRound[ oClonedGame.getId() ] = oClonedGame;
                }
            }
        }
        oRanking.updatePoulePlaceRankings( oClonedGamesRound, oRankedFromPlaces );

        var arrFromQualifiedPoulePlacesByRank = oRanking.getPoulePlacesByRanking( null, oRankedFromPlaces );

        var arrToPlaces = oQualifyRule.getToPoulePlaces();
        var nNrOfToPlaces = arrToPlaces.length;
        var oConfigs = oQualifyRule.getConfig();

        var nTotalRank = 0; nCount = 1;
        for( var nI = 0 ; nI < arrFromQualifiedPoulePlacesByRank.length ; nI++ ) {
            if ( nCount++ > nNrOfToPlaces) { break; }
            nTotalRank += Math.pow( 2, arrFromQualifiedPoulePlacesByRank[nI].getPoule().getNumber() );
        }

        var arrConfig = oConfigs[ nTotalRank ];

        if ( !m_oLoggedThirdPlaceQRs[ oQualifyRule.getId() ] ) {
            m_oLoggedThirdPlaceQRs[ oQualifyRule.getId() ] = true;
            console.group('[3e plaatsen] qualify rule ' + oQualifyRule.getId() + ' — verdeling ' + arrFromQualifiedPoulePlacesByRank.length + ' beste 3e plaatsen');
            for ( var nLog = 0; nLog < arrFromQualifiedPoulePlacesByRank.length; nLog++ ) {
                var oPPLog = arrFromQualifiedPoulePlacesByRank[nLog];
                var sTeamLog = oPPLog.getTeam() ? oPPLog.getTeam().getName() : '(geen team)';
                var sPouleLog = VoetbalOog_Poule_Factory().getName( oPPLog.getPoule(), true );
                console.log( '  rank ' + (nLog + 1) + ': ' + sTeamLog + ' (' + sPouleLog + ', poule-macht ' + Math.pow(2, oPPLog.getPoule().getNumber()) + ')' );
            }
            console.log( 'nTotalRank = ' + nTotalRank + '  →  config = ' + JSON.stringify(arrConfig) + '  (config-sleutel in oConfigs)' );
            console.groupEnd();
        }

        var nCount = 1;
        for( var nI = 0 ; nI < arrFromQualifiedPoulePlacesByRank.length ; nI++ ) {
            if ( nCount++ > nNrOfToPlaces ) { break; }
            var nIndex = arrConfig.indexOf( Math.pow( 2, arrFromQualifiedPoulePlacesByRank[nI].getPoule().getNumber() ) );

            var nJ = 0;
            for( var nK = 0 ; nK < arrToPlaces.length ; nK++ )
            {
                if ( nJ++ == nIndex && oPoulePlace == arrToPlaces[nK]) {
                    var oAssignedTeam = arrFromQualifiedPoulePlacesByRank[nI].getTeam();
                    var sFromPoule = VoetbalOog_Poule_Factory().getName( arrFromQualifiedPoulePlacesByRank[nI].getPoule(), true );
                    var sToPoule = VoetbalOog_Poule_Factory().getName( oPoulePlace.getPoule(), true );
                    console.log( '[3e plaats] ' + oAssignedTeam.getName() +
                        ' (' + sFromPoule + ', rank ' + (nI + 1) + ', poule-macht ' + Math.pow(2, arrFromQualifiedPoulePlacesByRank[nI].getPoule().getNumber()) + ')' +
                        '  →  config positie ' + nIndex + ' (arrConfig[' + nIndex + '] = ' + arrConfig[nIndex] + ')' +
                        '  →  bracket: ' + sToPoule + ' plaats ' + oPoulePlace.getNumber() );
                    return oAssignedTeam;
                }
            }
        }
        return null;
    }

    this.showThirdPlaceRanking = function( oContainer )
    {
        var oPool = m_oPoolUser.getPool();
        var oRound0 = null;
        var oRounds = oPool.getCompetitionSeason().getRounds();
        for ( var nI in oRounds ) {
            if ( oRounds.hasOwnProperty(nI) && oRounds[nI].getNumber() === 0 ) {
                oRound0 = oRounds[nI];
                break;
            }
        }
        if ( oRound0 == null ) return;
        var oRoundBetConfigs = oPool.getBetConfigs( oRound0 );
        var oRoundBetConfig3 = oRoundBetConfigs[VoetbalOog_Bet_Score.nId];
        if ( oRoundBetConfig3 == undefined )
            oRoundBetConfig3 = oRoundBetConfigs[VoetbalOog_Bet_Result.nId];
        while ( oContainer.hasChildNodes() )
            oContainer.removeChild( oContainer.lastChild );
        updateThirdPlaceStandings( oRound0, null, oContainer, true );
    };

    this.putHelper = function( oBetHelper )
    {
        m_oBetHelper = oBetHelper;
    };
}
