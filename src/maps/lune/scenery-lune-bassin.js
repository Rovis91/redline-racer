// "lune" blockout, zone 5: Bassin sud (PK 3840 to 5080, 18 m wide): out of the tunnel on the basin floor (-28 m), the ramp up its wall (PK 4000 to 4580, about 8 %), the rim (20 m),
// then three open airlock frames (PK 4840 to 4920) before the base. The basin (Ø 444 m) and the satellite impact are terrain. Only this zone's named blocks; put() is described in scenery-lune.js.
(window.LUNE = window.LUNE || {}).bassin = ({ put }) => {
  const ROCK = 0x3b3e4b, IVORY = 0xefe6d4, ORANGE = 0xdf8c40, BLUE = 0x6fabc6;
  for (const pk of [4150, 4350]) put('GRADINS', ROCK, pk, -1, 30, 30, 8, 80);            // steps of the basin wall, above the ramp
  for (const pk of [3950, 4480, 4650]) put('BLOCS', 0x8a8d98, pk, -1, 30, 14, 6, 18);
  put('GARAGE BUGGY', IVORY, 4760, -1, 26, 26, 11, 40); put('ROVER', ORANGE, 4805, -1, 14, 4, 3, 7); put('RÉSERVOIR', BLUE, 4715, -1, 30, 8, 7, 8); // maintenance area, south-west, off the track
  for (const pk of [4840, 4880, 4920]) for (const sd of [-1, 1]) put('SAS', ORANGE, pk, sd, 1, 3, 12, 3);                                         // open frames: a post each side, three in a row
};
