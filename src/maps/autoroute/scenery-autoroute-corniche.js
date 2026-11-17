// "autoroute" blockout, zone 1: La corniche des immeubles (PK 0 to 700, level at +24 m, viaduct). Only this zone's named blocks; put() and gantry() are described in scenery-autoroute.js.
(window.AUTOROUTE = window.AUTOROUTE || {}).corniche = ({ put, gantry }) => {
  const OFFICE = 0xc9b48f, IVY = 0x5f8a4a, CONC = 0x8f8c82;
  for (const pk of [60, 150, 240, 330, 420, 510]) { put('IMMEUBLE DE BUREAUX', OFFICE, pk, -1, 8, 28, 42, 70, -4); put('IMMEUBLE DE BUREAUX', OFFICE, pk + 45, 1, 8, 28, 46, 70, -4); } // two aligned fronts, tops 14 to 18 m above the road
  put('LIERRE', IVY, 240, -1, 6, 2, 36, 40, -4); put('LIERRE', IVY, 465, 1, 6, 2, 40, 40, -4);                                                                                   // ivy on a few facades only
  put('SORTIE CONDAMNEE', CONC, 610, 1, 0.5, 9, 3, 80, 21);                                                                                                                    // a closed exit stub, right, before the crossing
  gantry(350);
};
