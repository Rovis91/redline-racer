// "area51" blockout, zone 1: Pistes d'essai (PK 0 to 1639, flat, 24 m wide on runway A then 20 m in the F1 bend). Only this zone's named blocks; put() and at() are described in scenery-area51.js.
(window.AREA51 = window.AREA51 || {}).pistes = ({ put, at }) => {
  const TARMAC = 0x3a424a, WHITE = 0xe8e2d7, AMBER = 0xf5aa75, CONCRETE = 0xa39c84, WIRE = 0x708071, GLASS = 0x333f52;
  // runway A (plan: 1832 × 126 m apron) as two flush slabs either side of the race ribbon; cut at x = 1100 in the west, where the perimeter road comes down onto it
  at('PISTE A', TARMAC, 1758, 342.5, 1316, 1.3, 51, -1.5); at('PISTE A', TARMAC, 1758, 417.5, 1316, 1.3, 51, -1.5);
  at('PISTE B', TARMAC, 1800, 220, 1100, 1.2, 30, -0.7);                                    // the parallel runway, 160 m to the left: for the plane, never for the race
  at('AVION', WHITE, 2040, 220, 165, 9, 14, 3); at('AILES', WHITE, 2050, 220, 16, 2, 116, 6);
  at('CLOTURE', WIRE, 1700, 290, 1100, 3, 1); at('CLOTURE', WIRE, 1700, 455, 1200, 3, 1);   // safety barrier between the two runways, and south of the apron
  at('TOUR DE CONTROLE', CONCRETE, 2385, 200, 16, 45, 16); at('VIGIE', GLASS, 2385, 200, 26, 8, 26, 45); // the landmark seen before braking
  ['F1 300', 'F1 200', 'F1 100'].forEach((l, i) => { for (const sd of [-1, 1]) put(l, AMBER, 690 + i * 100, sd, 3, 4, 5, 0.5); }); // braking zone F1: announcing panels, off the roadway
  at('RADAR', WHITE, 2450, 470, 14, 22, 14);                                                // straight ahead at the braking point, outside the bend
};
