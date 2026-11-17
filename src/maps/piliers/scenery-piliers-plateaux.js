// "piliers" blockout, zone 4: Hauts plateaux (PK 2181 to 2826, +215 to +225 to +215 m, 14 m wide; tunnel PK 2401 to 2481, straight, east 1230). Only this zone's named blocks; put(), mass() and summit() are described in scenery-piliers.js.
// Relief (scenery-piliers.js): pillar P4 and its spur at +300, 75 m above the road, which the tunnel goes through; after the tunnel the cliff edge comes 12 m from the left wall.
(window.PILIERS = window.PILIERS || {}).plateaux = ({ h, put, summit, at }) => {
  const ROCK = 0x9b9a7e, RED = 0xa65949, WATER = 0x76aebe, STONE = 0xd9e4d8, PINE = 0x6e7d66;
  summit('PILIER P4 +305', 1115, 722, 305); summit('NEZ ROCHEUX +300', 1235, 650, 300);
  put('BELVEDERE', STONE, 2250, -1, 6, 24, 1, 24); put('PAVILLON', RED, 2250, -1, 12, 8, 7, 8); // small, set back on its platform, never on the axis
  put('BASSIN', WATER, 2290, 1, 8, 16, 0.6, 22); put('CASCADE', WATER, 2330, 1, 34, 6, 215, 3, 0); // the plateau stream falls into the ravine on the inside; it never crosses the road
  // the terrain leaves the tunnel corridor open through the mountain: a block each side of the engine's tunnel and one above it close it, up to the summit
  { const s = at(2441); for (const sd of [-1, 1]) put('PORTAIL', ROCK, 2441, sd, 2.5, 20, 11, 80, s.y - 1);
    PLACERS.block(h, 'TOIT', ROCK, 60, 300 - s.y - 9, 80, s.x, s.y + 9, s.z, h.across(s)); }
  for (const p of [2560, 2700]) put('PIN', PINE, p, 1, 6, 5, 14, 5);
};
