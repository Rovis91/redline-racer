// "area51" blockout, zone 3: Galerie souterraine B1 (PK 2197 to 2943; the S comes down to -5 m, the gallery is flat, 20 m wide). Only this zone's named blocks; at() is described in scenery-area51.js.
(window.AREA51 = window.AREA51 || {}).bunker = ({ at }) => {
  const CONCRETE = 0xa9a8a0, DARK = 0x38414c, ROCK = 0xa97459;
  // B1: 120 m covered on the axis z = 1070, x 1220 to 1340, free section 24 × 9 m: two walls and a slab; the hill itself is terrain (HILLS in scenery-area51.js)
  at('B1', CONCRETE, 1280, 1054, 120, 13, 8, -7); at('B1', CONCRETE, 1280, 1086, 120, 13, 8, -7); at('B1 GALERIE', DARK, 1280, 1070, 120, 4, 40, 4);
  for (const x of [1365, 1195]) for (const z of [1040, 1100]) at('ROCHERS', ROCK, x, z, 30, 14, 24); // rock shoulders hide the building at both portals
};
