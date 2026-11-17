// "area51" blockout, zone 2: Hangar traversant H1 (PK 1639 to 2197, flat, 20 m wide). Only this zone's named blocks; at() is described in scenery-area51.js.
(window.AREA51 = window.AREA51 || {}).hangar = ({ at }) => {
  const OLIVE = 0x757a68, DARK = 0x282f39, SAND = 0xc5bca8, AMBER = 0xf2ca7e, BROWN = 0x8a6e57;
  // H1: 130 × 90 m, crossed east to west on its axis (z = 880). Two side volumes and a roof slab leave the 32 × 14 m opening of the bible
  at('H1', OLIVE, 1765, 849.5, 130, 18, 29); at('H1', OLIVE, 1765, 910.5, 130, 18, 29); at('H1 HALL', DARK, 1765, 880, 130, 4, 32, 14);
  for (const x of [1860, 1670]) for (const z of [850, 910]) at('STOCK', BROWN, x, z, 8, 4, 8); // side stocks at both portals, 26 m off the axis
  at('H2', OLIVE, 1992.5, 1027, 125, 16, 90); at('H3', OLIVE, 2143.5, 1031, 135, 16, 92); at('COUR TECHNIQUE', SAND, 2070, 940, 240, 0.6, 50);
  at('COUR DE MAINTENANCE', SAND, 1560, 985, 70, 0.6, 70); at('ATELIER', AMBER, 1575, 1000, 30, 8, 30); // the wide S after the west door goes round this yard
};
