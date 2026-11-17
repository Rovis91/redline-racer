// "autoroute" blockout, zone 3: L'autoroute (PK 1225 to 1760, heading south above column 2): the slip road climbs along its east side and merges at +12 m (PK 1345); the deck, 32 m between parapets,
// rises to +20 m over the boulevard (PK 1507 to 1557, the view over the city), then its last span has fallen and makes the way down to row 2. The lane winds between the wrecks of the evacuation.
// Only this zone's named blocks; helpers are described in scenery-autoroute.js.
(window.AUTOROUTE = window.AUTOROUTE || {}).pont = ({ put, spot, gantry, at }) => {
  const RUST = 0x9a5a3a, BUS = 0xb8a050, CONC = 0x8f8c82, OLIVE = 0x5a6240;
  gantry(1250, 'ENTREE AUTOROUTE');
  spot('AUTOROUTE COUPEE', CONC, 220, -365, 32, 2, 200, 10);                                       // the motorway to the north, cut off: the deck the slip road joins
  // what the lane swerves around on the deck
  for (const [label, c, pk, sd, w, ht, d] of [['CAMION EN PORTEFEUILLE', RUST, 1416, 1, 3, 3.6, 13], ['BUS ABANDONNE', BUS, 1502, -1, 3.2, 3.2, 12], ['CARAMBOLAGE', RUST, 1594, 1, 6, 2, 12], ['CAMION MILITAIRE', OLIVE, 1660, -1, 3, 3.4, 9]])
    put(label, c, pk, sd, 0.5, w, ht, d, at(pk).y);
  spot('AUTOROUTE EFFONDREE', CONC, 220, 335, 32, 2, 170, 11);                                     // the motorway to the south, beyond the fallen span
};
