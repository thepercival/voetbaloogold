-- ============================================================
-- 2026 FIFA World Cup – Location assignments
-- CompetitionsPerSeasonId = 22 (Wereld Kampioenschap 2026)
-- All game IDs verified against DB query on 2026-06-06.
-- Datetimes in DB are Netherlands local time (CEST = UTC+2).
-- ============================================================

-- Insert the 16 host-city locations (safe to re-run)
INSERT IGNORE INTO Locations (CompetitionsPerSeasonId, Name) VALUES
  (22, 'Mexico City MEX'),   -- Estadio Azteca
  (22, 'Zapopan MEX'),       -- Estadio Akron
  (22, 'Guadalupe MEX'),     -- Estadio BBVA
  (22, 'Toronto ON'),        -- BMO Field
  (22, 'Vancouver BC'),      -- BC Place
  (22, 'E. Rutherford NJ'),  -- MetLife Stadium
  (22, 'Inglewood CA'),      -- SoFi Stadium
  (22, 'Santa Clara CA'),    -- Levi''s Stadium
  (22, 'Atlanta GA'),        -- Mercedes-Benz Stadium
  (22, 'Houston TX'),        -- NRG Stadium
  (22, 'Foxborough MA'),     -- Gillette Stadium
  (22, 'Philadelphia PA'),   -- Lincoln Financial Field
  (22, 'Miami Gardens FL'),  -- Hard Rock Stadium
  (22, 'Arlington TX'),      -- AT&T Stadium
  (22, 'Seattle WA'),        -- Lumen Field
  (22, 'Kansas City MO');    -- Arrowhead Stadium

-- ============================================================
-- GROUP STAGE (Round 0)
-- ============================================================

-- Group A: Mexico / South Africa / South Korea / Czech Republic
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Mexico City MEX' AND CompetitionsPerSeasonId=22) WHERE Id=1844; -- M1:  MEX vs RSA
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Zapopan MEX'     AND CompetitionsPerSeasonId=22) WHERE Id=1845; -- M2:  KOR vs CZE
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Zapopan MEX'     AND CompetitionsPerSeasonId=22) WHERE Id=1846; -- M28: MEX vs KOR
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Atlanta GA'      AND CompetitionsPerSeasonId=22) WHERE Id=1847; -- M25: CZE vs RSA
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Mexico City MEX' AND CompetitionsPerSeasonId=22) WHERE Id=1848; -- M53: CZE vs MEX
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Guadalupe MEX'   AND CompetitionsPerSeasonId=22) WHERE Id=1849; -- M54: RSA vs KOR

-- Group B: Canada / Bosnia / Qatar / Switzerland
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Toronto ON'      AND CompetitionsPerSeasonId=22) WHERE Id=1850; -- M3:  CAN vs BIH
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Santa Clara CA'  AND CompetitionsPerSeasonId=22) WHERE Id=1851; -- M8:  QAT vs SUI
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Vancouver BC'    AND CompetitionsPerSeasonId=22) WHERE Id=1852; -- M27: CAN vs QAT
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Inglewood CA'    AND CompetitionsPerSeasonId=22) WHERE Id=1853; -- M26: SUI vs BIH
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Vancouver BC'    AND CompetitionsPerSeasonId=22) WHERE Id=1854; -- M51: SUI vs CAN
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Seattle WA'      AND CompetitionsPerSeasonId=22) WHERE Id=1855; -- M52: BIH vs QAT

-- Group C: Brazil / Morocco / Haiti / Scotland
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='E. Rutherford NJ' AND CompetitionsPerSeasonId=22) WHERE Id=1856; -- M7:  BRA vs MAR
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Foxborough MA'   AND CompetitionsPerSeasonId=22) WHERE Id=1857; -- M5:  HAI vs SCO
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Philadelphia PA' AND CompetitionsPerSeasonId=22) WHERE Id=1858; -- M29: BRA vs HAI
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Foxborough MA'   AND CompetitionsPerSeasonId=22) WHERE Id=1859; -- M30: SCO vs MAR
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Miami Gardens FL' AND CompetitionsPerSeasonId=22) WHERE Id=1860; -- M49: SCO vs BRA
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Atlanta GA'      AND CompetitionsPerSeasonId=22) WHERE Id=1861; -- M50: MAR vs HAI

-- Group D: USA / Paraguay / Australia / Turkey
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Inglewood CA'    AND CompetitionsPerSeasonId=22) WHERE Id=1862; -- M4:  USA vs PAR
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Vancouver BC'    AND CompetitionsPerSeasonId=22) WHERE Id=1863; -- M6:  AUS vs TUR
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Seattle WA'      AND CompetitionsPerSeasonId=22) WHERE Id=1864; -- M32: USA vs AUS
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Santa Clara CA'  AND CompetitionsPerSeasonId=22) WHERE Id=1865; -- M31: TUR vs PAR
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Inglewood CA'    AND CompetitionsPerSeasonId=22) WHERE Id=1866; -- M59: TUR vs USA
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Santa Clara CA'  AND CompetitionsPerSeasonId=22) WHERE Id=1867; -- M60: PAR vs AUS

-- Group E: Germany / Curacao / Ivory Coast / Ecuador
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Houston TX'      AND CompetitionsPerSeasonId=22) WHERE Id=1868; -- M10: GER vs CUR
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Philadelphia PA' AND CompetitionsPerSeasonId=22) WHERE Id=1869; -- M9:  CIV vs ECU
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Toronto ON'      AND CompetitionsPerSeasonId=22) WHERE Id=1870; -- M33: GER vs CIV
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Kansas City MO'  AND CompetitionsPerSeasonId=22) WHERE Id=1871; -- M34: ECU vs CUR
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='E. Rutherford NJ' AND CompetitionsPerSeasonId=22) WHERE Id=1872; -- M56: ECU vs GER
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Philadelphia PA' AND CompetitionsPerSeasonId=22) WHERE Id=1873; -- M55: CUR vs CIV

-- Group F: Netherlands / Japan / Sweden / Tunisia
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Arlington TX'    AND CompetitionsPerSeasonId=22) WHERE Id=1874; -- M11: NED vs JPN
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Guadalupe MEX'   AND CompetitionsPerSeasonId=22) WHERE Id=1875; -- M12: SWE vs TUN
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Guadalupe MEX'   AND CompetitionsPerSeasonId=22) WHERE Id=1876; -- M35: NED vs SWE
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Houston TX'      AND CompetitionsPerSeasonId=22) WHERE Id=1877; -- M36: TUN vs JPN
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Arlington TX'    AND CompetitionsPerSeasonId=22) WHERE Id=1878; -- M58: TUN vs NED
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Guadalupe MEX'   AND CompetitionsPerSeasonId=22) WHERE Id=1879; -- M57: JPN vs SWE

-- Group G: Belgium / Egypt / Iran / New Zealand
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Seattle WA'      AND CompetitionsPerSeasonId=22) WHERE Id=1880; -- M16: BEL vs EGY
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Inglewood CA'    AND CompetitionsPerSeasonId=22) WHERE Id=1881; -- M15: IRN vs NZL
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Inglewood CA'    AND CompetitionsPerSeasonId=22) WHERE Id=1882; -- M39: BEL vs IRN
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Vancouver BC'    AND CompetitionsPerSeasonId=22) WHERE Id=1883; -- M40: NZL vs EGY
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Vancouver BC'    AND CompetitionsPerSeasonId=22) WHERE Id=1884; -- M64: NZL vs BEL
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Seattle WA'      AND CompetitionsPerSeasonId=22) WHERE Id=1885; -- M63: EGY vs IRN

-- Group H: Spain / Cape Verde / Saudi Arabia / Uruguay
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Atlanta GA'      AND CompetitionsPerSeasonId=22) WHERE Id=1886; -- M14: ESP vs CPV
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Miami Gardens FL' AND CompetitionsPerSeasonId=22) WHERE Id=1887; -- M13: KSA vs URU
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Atlanta GA'      AND CompetitionsPerSeasonId=22) WHERE Id=1888; -- M38: ESP vs KSA
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Miami Gardens FL' AND CompetitionsPerSeasonId=22) WHERE Id=1889; -- M37: URU vs CPV
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Zapopan MEX'     AND CompetitionsPerSeasonId=22) WHERE Id=1890; -- M66: URU vs ESP
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Houston TX'      AND CompetitionsPerSeasonId=22) WHERE Id=1891; -- M65: CPV vs KSA

-- Group I: France / Senegal / Iraq / Norway
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='E. Rutherford NJ' AND CompetitionsPerSeasonId=22) WHERE Id=1892; -- M17: FRA vs SEN
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Foxborough MA'   AND CompetitionsPerSeasonId=22) WHERE Id=1893; -- M18: IRQ vs NOR
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Philadelphia PA' AND CompetitionsPerSeasonId=22) WHERE Id=1894; -- M42: FRA vs IRQ
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='E. Rutherford NJ' AND CompetitionsPerSeasonId=22) WHERE Id=1895; -- M41: NOR vs SEN
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='E. Rutherford NJ' AND CompetitionsPerSeasonId=22) WHERE Id=1896; -- M61: NOR vs FRA
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Toronto ON'      AND CompetitionsPerSeasonId=22) WHERE Id=1897; -- M62: SEN vs IRQ

-- Group J: Argentina / Algeria / Austria / Jordan
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Kansas City MO'  AND CompetitionsPerSeasonId=22) WHERE Id=1898; -- M19: ARG vs ALG
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Santa Clara CA'  AND CompetitionsPerSeasonId=22) WHERE Id=1899; -- M20: AUT vs JOR
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Arlington TX'    AND CompetitionsPerSeasonId=22) WHERE Id=1900; -- M43: ARG vs AUT
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Santa Clara CA'  AND CompetitionsPerSeasonId=22) WHERE Id=1901; -- M44: JOR vs ALG
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Arlington TX'    AND CompetitionsPerSeasonId=22) WHERE Id=1902; -- M70: JOR vs ARG
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Santa Clara CA'  AND CompetitionsPerSeasonId=22) WHERE Id=1903; -- M69: ALG vs AUT

-- Group K: Portugal / DR Congo / Uzbekistan / Colombia
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Houston TX'      AND CompetitionsPerSeasonId=22) WHERE Id=1904; -- M23: POR vs COD
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Mexico City MEX' AND CompetitionsPerSeasonId=22) WHERE Id=1905; -- M24: UZB vs COL
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Houston TX'      AND CompetitionsPerSeasonId=22) WHERE Id=1906; -- M47: POR vs UZB
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Zapopan MEX'     AND CompetitionsPerSeasonId=22) WHERE Id=1907; -- M48: COL vs COD
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Miami Gardens FL' AND CompetitionsPerSeasonId=22) WHERE Id=1908; -- M71: COL vs POR
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Atlanta GA'      AND CompetitionsPerSeasonId=22) WHERE Id=1909; -- M72: COD vs UZB

-- Group L: England / Croatia / Ghana / Panama
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Arlington TX'    AND CompetitionsPerSeasonId=22) WHERE Id=1910; -- M22: ENG vs CRO
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Toronto ON'      AND CompetitionsPerSeasonId=22) WHERE Id=1911; -- M21: GHA vs PAN
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Toronto ON'      AND CompetitionsPerSeasonId=22) WHERE Id=1912; -- M45: ENG vs GHA
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Foxborough MA'   AND CompetitionsPerSeasonId=22) WHERE Id=1913; -- M46: PAN vs CRO
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Toronto ON'      AND CompetitionsPerSeasonId=22) WHERE Id=1914; -- M67: PAN vs ENG
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='E. Rutherford NJ' AND CompetitionsPerSeasonId=22) WHERE Id=1915; -- M68: CRO vs GHA

-- ============================================================
-- ROUND OF 32 (Round 1)
-- ============================================================
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Inglewood CA'    AND CompetitionsPerSeasonId=22) WHERE Id=1916; -- M73: A2 vs B2
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Foxborough MA'   AND CompetitionsPerSeasonId=22) WHERE Id=1917; -- M74: E1 vs 3ABCDF
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Guadalupe MEX'   AND CompetitionsPerSeasonId=22) WHERE Id=1918; -- M75: F1 vs C2
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Houston TX'      AND CompetitionsPerSeasonId=22) WHERE Id=1919; -- M76: C1 vs F2
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Atlanta GA'      AND CompetitionsPerSeasonId=22) WHERE Id=1920; -- M80: L1 vs 3EHIJK
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Arlington TX'    AND CompetitionsPerSeasonId=22) WHERE Id=1921; -- M78: E2 vs I2
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Santa Clara CA'  AND CompetitionsPerSeasonId=22) WHERE Id=1922; -- M81: D1 vs 3BEFIJ
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Mexico City MEX' AND CompetitionsPerSeasonId=22) WHERE Id=1923; -- M79: A1 vs 3CEFHI
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Seattle WA'      AND CompetitionsPerSeasonId=22) WHERE Id=1924; -- M82: G1 vs 3AEHIJ
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='E. Rutherford NJ' AND CompetitionsPerSeasonId=22) WHERE Id=1925; -- M77: I1 vs 3CDFGH
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Toronto ON'      AND CompetitionsPerSeasonId=22) WHERE Id=1926; -- M83: K2 vs L2
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Inglewood CA'    AND CompetitionsPerSeasonId=22) WHERE Id=1927; -- M84: H1 vs J2
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Vancouver BC'    AND CompetitionsPerSeasonId=22) WHERE Id=1928; -- M85: B1 vs 3EFGIJ
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Miami Gardens FL' AND CompetitionsPerSeasonId=22) WHERE Id=1929; -- M86: J1 vs H2
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Kansas City MO'  AND CompetitionsPerSeasonId=22) WHERE Id=1930; -- M87: K1 vs 3DEIJL
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Arlington TX'    AND CompetitionsPerSeasonId=22) WHERE Id=1931; -- M88: D2 vs G2

-- ============================================================
-- ROUND OF 16 (Round 2)
-- ============================================================
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Houston TX'      AND CompetitionsPerSeasonId=22) WHERE Id=1932; -- M90: W73 vs W75
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Philadelphia PA' AND CompetitionsPerSeasonId=22) WHERE Id=1933; -- M89: W74 vs W77
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='E. Rutherford NJ' AND CompetitionsPerSeasonId=22) WHERE Id=1934; -- M91: W76 vs W78
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Mexico City MEX' AND CompetitionsPerSeasonId=22) WHERE Id=1935; -- M92: W79 vs W80
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Arlington TX'    AND CompetitionsPerSeasonId=22) WHERE Id=1936; -- M93: W83 vs W84
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Seattle WA'      AND CompetitionsPerSeasonId=22) WHERE Id=1937; -- M94: W81 vs W82
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Atlanta GA'      AND CompetitionsPerSeasonId=22) WHERE Id=1938; -- M95: W86 vs W88
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Vancouver BC'    AND CompetitionsPerSeasonId=22) WHERE Id=1939; -- M96: W85 vs W87

-- ============================================================
-- QUARTER-FINALS (Round 3)
-- ============================================================
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Foxborough MA'   AND CompetitionsPerSeasonId=22) WHERE Id=1940; -- M97:  W89 vs W90
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Inglewood CA'    AND CompetitionsPerSeasonId=22) WHERE Id=1941; -- M98:  W93 vs W94
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Miami Gardens FL' AND CompetitionsPerSeasonId=22) WHERE Id=1942; -- M99:  W91 vs W92
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Kansas City MO'  AND CompetitionsPerSeasonId=22) WHERE Id=1943; -- M100: W95 vs W96

-- ============================================================
-- SEMI-FINALS (Round 4)
-- ============================================================
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Arlington TX'    AND CompetitionsPerSeasonId=22) WHERE Id=1944; -- M101: W97  vs W98
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='Atlanta GA'      AND CompetitionsPerSeasonId=22) WHERE Id=1945; -- M102: W99  vs W100

-- ============================================================
-- FINAL (Round 5)
-- ============================================================
UPDATE Games SET LocationId=(SELECT Id FROM Locations WHERE Name='E. Rutherford NJ' AND CompetitionsPerSeasonId=22) WHERE Id=1946; -- M104: Final
