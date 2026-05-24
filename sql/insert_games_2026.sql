-- ============================================================
-- 2026 FIFA World Cup games
-- Datetimes in Netherlands local time (CEST = UTC+2)
-- Run with the MySQL CLI: mysql -h 127.0.0.1 -u <user> -p voetbaloog < insert_games_2026.sql
-- ============================================================

-- Remove all existing 2026 games
DELETE g FROM Games g
  JOIN PoulePlaces pp ON pp.Id = g.HomePoulePlaceId
  JOIN Poules po       ON po.Id = pp.PouleId
  JOIN Rounds r        ON r.Id  = po.RoundId
  JOIN CompetitionsPerSeason cs ON cs.Id = r.CompetitionsPerSeasonId
  JOIN Seasons s       ON s.Id  = cs.SeasonId
WHERE s.Name = '2026';

-- Helper: resolve PoulePlaceId for season '2026' by round/poule/place number
DROP FUNCTION IF EXISTS pp2026;
DELIMITER //
CREATE FUNCTION pp2026(rn INT, pn INT, ppn INT) RETURNS INT READS SQL DATA
BEGIN
    DECLARE result INT;
    SELECT pp.Id INTO result
    FROM PoulePlaces pp
    JOIN Poules po ON po.Id = pp.PouleId
    JOIN Rounds r  ON r.Id  = po.RoundId
    JOIN CompetitionsPerSeason cs ON cs.Id = r.CompetitionsPerSeasonId
    JOIN Seasons s ON s.Id  = cs.SeasonId
    WHERE s.Name = '2026' AND r.Number = rn AND po.Number = pn AND pp.Number = ppn;
    RETURN result;
END//
DELIMITER ;

-- ============================================================
-- GROUP STAGE (Round 0) — 72 games
-- Pattern per group (place0=1st, place1=2nd, place2=3rd, place3=4th in draw order):
--   MD1 ViewOrder 0: place0 vs place1
--   MD1 ViewOrder 1: place2 vs place3
--   MD2 ViewOrder 0: place0 vs place2
--   MD2 ViewOrder 1: place3 vs place1
--   MD3 ViewOrder 0: place3 vs place0
--   MD3 ViewOrder 1: place1 vs place2
-- ============================================================

-- Group A (poule 0): Mexico(0) South Africa(1) South Korea(2) Czech Republic(3)
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 0,0), pp2026(0, 0,1), 1, 0, '2026-06-11 21:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 0,2), pp2026(0, 0,3), 1, 1, '2026-06-12 04:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 0,0), pp2026(0, 0,2), 2, 0, '2026-06-19 03:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 0,3), pp2026(0, 0,1), 2, 1, '2026-06-18 18:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 0,3), pp2026(0, 0,0), 3, 0, '2026-06-25 03:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 0,1), pp2026(0, 0,2), 3, 1, '2026-06-25 03:00:00', 2);

-- Group B (poule 1): Canada(0) Bosnia(1) Qatar(2) Switzerland(3)
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 1,0), pp2026(0, 1,1), 1, 0, '2026-06-12 21:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 1,2), pp2026(0, 1,3), 1, 1, '2026-06-13 21:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 1,0), pp2026(0, 1,2), 2, 0, '2026-06-19 00:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 1,3), pp2026(0, 1,1), 2, 1, '2026-06-18 21:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 1,3), pp2026(0, 1,0), 3, 0, '2026-06-24 21:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 1,1), pp2026(0, 1,2), 3, 1, '2026-06-24 21:00:00', 2);

-- Group C (poule 2): Brazil(0) Morocco(1) Haiti(2) Scotland(3)
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 2,0), pp2026(0, 2,1), 1, 0, '2026-06-14 00:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 2,2), pp2026(0, 2,3), 1, 1, '2026-06-14 03:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 2,0), pp2026(0, 2,2), 2, 0, '2026-06-20 02:30:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 2,3), pp2026(0, 2,1), 2, 1, '2026-06-20 00:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 2,3), pp2026(0, 2,0), 3, 0, '2026-06-25 00:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 2,1), pp2026(0, 2,2), 3, 1, '2026-06-25 00:00:00', 2);

-- Group D (poule 3): USA(0) Paraguay(1) Australia(2) Turkey(3)
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 3,0), pp2026(0, 3,1), 1, 0, '2026-06-13 03:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 3,2), pp2026(0, 3,3), 1, 1, '2026-06-14 06:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 3,0), pp2026(0, 3,2), 2, 0, '2026-06-19 21:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 3,3), pp2026(0, 3,1), 2, 1, '2026-06-20 05:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 3,3), pp2026(0, 3,0), 3, 0, '2026-06-26 04:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 3,1), pp2026(0, 3,2), 3, 1, '2026-06-26 04:00:00', 2);

-- Group E (poule 4): Germany(0) Curacao(1) Ivory Coast(2) Ecuador(3)
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 4,0), pp2026(0, 4,1), 1, 0, '2026-06-14 19:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 4,2), pp2026(0, 4,3), 1, 1, '2026-06-15 01:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 4,0), pp2026(0, 4,2), 2, 0, '2026-06-20 22:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 4,3), pp2026(0, 4,1), 2, 1, '2026-06-21 02:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 4,3), pp2026(0, 4,0), 3, 0, '2026-06-25 22:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 4,1), pp2026(0, 4,2), 3, 1, '2026-06-25 22:00:00', 2);

-- Group F (poule 5): Netherlands(0) Japan(1) Sweden(2) Tunisia(3)
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 5,0), pp2026(0, 5,1), 1, 0, '2026-06-14 22:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 5,2), pp2026(0, 5,3), 1, 1, '2026-06-15 04:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 5,0), pp2026(0, 5,2), 2, 0, '2026-06-20 19:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 5,3), pp2026(0, 5,1), 2, 1, '2026-06-21 06:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 5,3), pp2026(0, 5,0), 3, 0, '2026-06-26 01:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 5,1), pp2026(0, 5,2), 3, 1, '2026-06-26 01:00:00', 2);

-- Group G (poule 6): Belgium(0) Egypt(1) Iran(2) New Zealand(3)
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 6,0), pp2026(0, 6,1), 1, 0, '2026-06-15 21:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 6,2), pp2026(0, 6,3), 1, 1, '2026-06-16 03:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 6,0), pp2026(0, 6,2), 2, 0, '2026-06-21 21:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 6,3), pp2026(0, 6,1), 2, 1, '2026-06-22 03:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 6,3), pp2026(0, 6,0), 3, 0, '2026-06-27 05:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 6,1), pp2026(0, 6,2), 3, 1, '2026-06-27 05:00:00', 2);

-- Group H (poule 7): Spain(0) Cape Verde(1) Saudi Arabia(2) Uruguay(3)
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 7,0), pp2026(0, 7,1), 1, 0, '2026-06-15 18:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 7,2), pp2026(0, 7,3), 1, 1, '2026-06-16 00:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 7,0), pp2026(0, 7,2), 2, 0, '2026-06-21 18:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 7,3), pp2026(0, 7,1), 2, 1, '2026-06-22 00:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 7,3), pp2026(0, 7,0), 3, 0, '2026-06-27 02:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 7,1), pp2026(0, 7,2), 3, 1, '2026-06-27 01:00:00', 2);

-- Group I (poule 8): France(0) Senegal(1) Iraq(2) Norway(3)
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 8,0), pp2026(0, 8,1), 1, 0, '2026-06-16 21:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 8,2), pp2026(0, 8,3), 1, 1, '2026-06-17 00:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 8,0), pp2026(0, 8,2), 2, 0, '2026-06-22 23:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 8,3), pp2026(0, 8,1), 2, 1, '2026-06-23 02:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 8,3), pp2026(0, 8,0), 3, 0, '2026-06-26 21:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 8,1), pp2026(0, 8,2), 3, 1, '2026-06-26 21:00:00', 2);

-- Group J (poule 9): Argentina(0) Algeria(1) Austria(2) Jordan(3)
-- Note: DB team name for place 2 shows 'Australie' — this is a data issue; place 2 = Austria
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 9,0), pp2026(0, 9,1), 1, 0, '2026-06-17 03:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 9,2), pp2026(0, 9,3), 1, 1, '2026-06-17 06:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 9,0), pp2026(0, 9,2), 2, 0, '2026-06-22 19:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 9,3), pp2026(0, 9,1), 2, 1, '2026-06-23 05:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 9,3), pp2026(0, 9,0), 3, 0, '2026-06-28 04:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0, 9,1), pp2026(0, 9,2), 3, 1, '2026-06-28 04:00:00', 2);

-- Group K (poule 10): Portugal(0) DR Congo(1) Uzbekistan(2) Colombia(3)
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0,10,0), pp2026(0,10,1), 1, 0, '2026-06-17 19:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0,10,2), pp2026(0,10,3), 1, 1, '2026-06-18 04:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0,10,0), pp2026(0,10,2), 2, 0, '2026-06-23 19:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0,10,3), pp2026(0,10,1), 2, 1, '2026-06-24 04:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0,10,3), pp2026(0,10,0), 3, 0, '2026-06-28 01:30:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0,10,1), pp2026(0,10,2), 3, 1, '2026-06-28 01:30:00', 2);

-- Group L (poule 11): England(0) Croatia(1) Ghana(2) Panama(3)
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0,11,0), pp2026(0,11,1), 1, 0, '2026-06-17 22:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0,11,2), pp2026(0,11,3), 1, 1, '2026-06-18 01:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0,11,0), pp2026(0,11,2), 2, 0, '2026-06-23 22:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0,11,3), pp2026(0,11,1), 2, 1, '2026-06-24 01:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0,11,3), pp2026(0,11,0), 3, 0, '2026-06-27 23:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(0,11,1), pp2026(0,11,2), 3, 1, '2026-06-27 23:00:00', 2);

-- ============================================================
-- ROUND OF 32 (Round 1) — 16 games
-- Poule  0 (M): A2  vs B2       | Poule  1 (N): E1  vs 3ABCDF
-- Poule  2 (O): F1  vs C2       | Poule  3 (P): C1  vs F2
-- Poule  4 (Q): L1  vs 3EHIJK   | Poule  5 (R): E2  vs I2
-- Poule  6 (S): D1  vs 3BEFIJ   | Poule  7 (T): A1  vs 3CEFHI
-- Poule  8 (U): G1  vs 3AEHIJ   | Poule  9 (V): I1  vs 3CDFGH
-- Poule 10 (W): K2  vs L2       | Poule 11 (X): H1  vs J2
-- Poule 12 (Y): B1  vs 3EFGIJ   | Poule 13 (Z): J1  vs H2
-- Poule 14(AA): K1  vs 3DEIJL   | Poule 15(AB): D2  vs G2
-- ============================================================
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(1, 0,0), pp2026(1, 0,1), 1, 0, '2026-06-28 21:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(1, 1,0), pp2026(1, 1,1), 1, 0, '2026-06-29 22:30:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(1, 2,0), pp2026(1, 2,1), 1, 0, '2026-06-30 03:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(1, 3,0), pp2026(1, 3,1), 1, 0, '2026-06-29 19:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(1, 4,0), pp2026(1, 4,1), 1, 0, '2026-07-01 18:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(1, 5,0), pp2026(1, 5,1), 1, 0, '2026-06-30 19:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(1, 6,0), pp2026(1, 6,1), 1, 0, '2026-07-02 02:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(1, 7,0), pp2026(1, 7,1), 1, 0, '2026-07-01 03:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(1, 8,0), pp2026(1, 8,1), 1, 0, '2026-07-01 22:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(1, 9,0), pp2026(1, 9,1), 1, 0, '2026-06-30 23:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(1,10,0), pp2026(1,10,1), 1, 0, '2026-07-03 01:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(1,11,0), pp2026(1,11,1), 1, 0, '2026-07-02 21:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(1,12,0), pp2026(1,12,1), 1, 0, '2026-07-03 05:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(1,13,0), pp2026(1,13,1), 1, 0, '2026-07-04 00:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(1,14,0), pp2026(1,14,1), 1, 0, '2026-07-04 03:30:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(1,15,0), pp2026(1,15,1), 1, 0, '2026-07-03 20:00:00', 2);

-- ============================================================
-- ROUND OF 16 (Round 2) — 8 games
-- Poule 0 (AC): W(M)  vs W(O)   | Poule 1 (AD): W(N)  vs W(V)
-- Poule 2 (AE): W(P)  vs W(R)   | Poule 3 (AF): W(T)  vs W(Q)
-- Poule 4 (AG): W(W)  vs W(X)   | Poule 5 (AH): W(S)  vs W(U)
-- Poule 6 (AI): W(Z)  vs W(AB)  | Poule 7 (AJ): W(Y)  vs W(AA)
-- ============================================================
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(2,0,0), pp2026(2,0,1), 1, 0, '2026-07-04 19:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(2,1,0), pp2026(2,1,1), 1, 0, '2026-07-04 23:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(2,2,0), pp2026(2,2,1), 1, 0, '2026-07-05 22:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(2,3,0), pp2026(2,3,1), 1, 0, '2026-07-06 02:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(2,4,0), pp2026(2,4,1), 1, 0, '2026-07-06 21:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(2,5,0), pp2026(2,5,1), 1, 0, '2026-07-07 02:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(2,6,0), pp2026(2,6,1), 1, 0, '2026-07-07 18:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(2,7,0), pp2026(2,7,1), 1, 0, '2026-07-07 22:00:00', 2);

-- ============================================================
-- QUARTER-FINALS (Round 3) — 4 games
-- Poule 0 (AK): W(AC) vs W(AD)  | Poule 1 (AL): W(AG) vs W(AH)
-- Poule 2 (AM): W(AE) vs W(AF)  | Poule 3 (AN): W(AI) vs W(AJ)
-- ============================================================
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(3,0,0), pp2026(3,0,1), 1, 0, '2026-07-09 22:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(3,1,0), pp2026(3,1,1), 1, 0, '2026-07-10 21:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(3,2,0), pp2026(3,2,1), 1, 0, '2026-07-11 23:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(3,3,0), pp2026(3,3,1), 1, 0, '2026-07-12 03:00:00', 2);

-- ============================================================
-- SEMI-FINALS (Round 4) — 2 games
-- Poule 0 (AO): W(AK) vs W(AL)  | Poule 1 (AP): W(AM) vs W(AN)
-- ============================================================
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(4,0,0), pp2026(4,0,1), 1, 0, '2026-07-14 21:00:00', 2);
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(4,1,0), pp2026(4,1,1), 1, 0, '2026-07-15 21:00:00', 2);

-- ============================================================
-- FINAL (Round 5) — 1 game
-- Poule 0 (AQ): W(AO) vs W(AP)
-- ============================================================
INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(5,0,0), pp2026(5,0,1), 1, 0, '2026-07-19 21:00:00', 2);

-- ============================================================
-- THIRD PLACE (Round 6) — 1 game
-- Poule 0: L(AO) vs L(AP)
-- NOTE: Round 6 poule 0 currently only has 1 place in the DB.
-- A second place must be added via the structure editor before running this INSERT.
-- ============================================================
-- INSERT INTO Games (HomePoulePlaceId, AwayPoulePlaceId, Number, ViewOrder, StartDateTime, State) VALUES (pp2026(6,0,0), pp2026(6,0,1), 1, 0, '2026-07-18 23:00:00', 2);

-- Cleanup
DROP FUNCTION IF EXISTS pp2026;
