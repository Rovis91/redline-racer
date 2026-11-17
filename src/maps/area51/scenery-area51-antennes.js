// "area51" blockout, zone 4: Champ d'antennes (PK 2943 to 3900, climbing from -2 to +12 m, 20 m wide). Only this zone's named blocks; put() and at() are described in scenery-area51.js.
(window.AREA51 = window.AREA51 || {}).antennes = ({ g, put, at, smp }) => {
  const WHITE = 0xe9ece7, CONCRETE = 0xadb7bb, STEEL = 0x52616e, WIRE = 0x708071;
  // a dish: a pedestal and a tilted square slab of the dish's diameter. D1 is the landmark of the lap (136 m), D2 and D3 alternate sides along the slalom
  const dish = (name, x, z, r, hs) => { at('SOCLE ' + name, CONCRETE, x, z, 24, hs, 24); at(name, WHITE, x, z, 2 * r, 6, 2 * r, g.hAt(x, z) + hs).rotation.x = -0.45; at('SHELTER', STEEL, x + 40, z + 30, 12, 4, 6); };
  dish('D1', 790, 805, 68, 45); dish('D2', 565, 1210, 54, 34); dish('D3', 400, 990, 48, 30);
  put('RADOME', WHITE, 2990, -1, 25, 14, 14, 14); put('RADOME', WHITE, 3050, 1, 25, 14, 14, 14);  // the first shapes seen from the exit of B1
  for (const pk of [3250, 3480, 3720]) put('MATS', STEEL, pk, smp(pk).k > 0 ? -1 : 1, 20, 3, 28, 3); // on the outside: each group of masts announces the next curve
  for (const pk of [3150, 3620]) put('GRILLAGE', WIRE, pk, smp(pk).k > 0 ? 1 : -1, 12, 1, 3, 80);    // fenced technical sites, inside the curves
};
