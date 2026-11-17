// "piliers" blockout, zone 4: Hauts plateaux (PK 2181 to 2826, +215 to +225 to +215 m, 14 m wide; tunnel PK 2390 to 2480, straight, east 1230). Only this zone's named blocks; put() and mass() are described in scenery-piliers.js.
(window.PILIERS = window.PILIERS || {}).plateaux = ({ h, put, mass, at }) => {
  const ROCK = 0xb0a38b, RED = 0xa65949, WATER = 0x76aebe, STONE = 0xd9e4d8, PINE = 0x6e7d66;
  mass('PILIER P4 +305', ROCK, 1115, 722, 70, 170, 305);
  put('BELVEDERE', STONE, 2250, -1, 6, 24, 1, 24); put('PAVILLON', RED, 2250, -1, 12, 8, 7, 8); put('MURET', STONE, 2250, -1, 3, 1, 1.2, 30); // small, set back on its platform, never on the axis
  put('BASSIN', WATER, 2290, 1, 8, 16, 0.6, 22); put('CASCADE', WATER, 2330, 1, 34, 6, 215, 3, 0);                                        // the plateau stream falls into the ravine on the inside; it never crosses the road
  // the rock nose the tunnel goes through: a mass each side of the engine's tunnel and a roof above it, top at +247 (the plan asks for +245 at least)
  for (const sd of [-1, 1]) put('NEZ ROCHEUX', ROCK, 2435, sd, 1.5, 35, 22, 90);
  { const s = at(2435); PLACERS.block(h, 'TOIT +245', ROCK, 2 * s.w + 3, 12, 90, s.x, s.y + 10, s.z, h.across(s)); }
  for (const p of [2560, 2700]) put('PIN', PINE, p, -1, 6, 5, 14, 5);
  put('GARDE-CORPS', STONE, 2760, -1, 1, 1.5, 1.5, 60); // after the tunnel the eye slides outward: the low cloud comes back before the descent
};
