// "autoroute" blockout, zone 3: L'autoroute (PK 1221 to 1750, heading south above column 2): 32 m between parapets, two carriageways of 14 m either side of a central reservation.
// The slip road climbs along the east side and merges onto the east carriageway at +12 m (PK 1328); it is jammed ahead, the lane crosses the broken reservation (z = -105 to -60)
// to the west carriageway, over the summit at +20 m above the boulevard (the view over the city), then the last span has fallen and makes the way down to row 2.
// The reservation and the traffic are generated in scenery-autoroute-ville.js. Only this zone's named blocks; helpers are described in scenery-autoroute.js.
(window.AUTOROUTE = window.AUTOROUTE || {}).pont = ({ spot, gantry }) => {
  const CONC = 0x8f8c82;
  gantry(1246, 'ENTREE AUTOROUTE');
  spot('AUTOROUTE COUPEE', CONC, 220, -365, 32, 2, 200, 10);     // the motorway to the north, cut off: the deck the slip road joins
  spot('AUTOROUTE EFFONDREE', CONC, 220, 335, 32, 2, 170, 11);   // the motorway to the south, beyond the fallen span
};
