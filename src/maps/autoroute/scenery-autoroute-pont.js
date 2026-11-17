// "autoroute" blockout, zone 3: L'autoroute (PK 1233 to 1773, heading south above column 2): the slip road climbs along its east side and merges at +12 m (PK 1354); the deck, 32 m between parapets,
// rises to +20 m over the boulevard (PK 1547 to 1571, the view over the city), then its last span has fallen and makes the way down to row 2. Ten lanes of abandoned traffic (generated in scenery-autoroute-ville.js).
// Only this zone's named blocks; helpers are described in scenery-autoroute.js.
(window.AUTOROUTE = window.AUTOROUTE || {}).pont = ({ spot, gantry }) => {
  const CONC = 0x8f8c82;
  gantry(1258, 'ENTREE AUTOROUTE');
  spot('AUTOROUTE COUPEE', CONC, 220, -365, 32, 2, 200, 10);     // the motorway to the north, cut off: the deck the slip road joins
  spot('AUTOROUTE EFFONDREE', CONC, 220, 335, 32, 2, 170, 11);   // the motorway to the south, beyond the fallen span
};
