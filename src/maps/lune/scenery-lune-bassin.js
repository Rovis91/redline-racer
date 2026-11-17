// "lune" blockout, zone 5: Bassin sud & sas (PK 2850 to 4258, 18 m wide): out of the tunnel on the basin floor (-28 m), the ramp up its wall (PK 3020 to 3580, about 8 %), the rim (20 m),
// then the open airlock frames (PK 3830 to 3910, the gallery of the V2: the engine has one tunnel per map) and the way back to the base. The basin (Ø 444 m) and the satellite impact are terrain.
// Only this zone's named blocks; put() is described in scenery-lune.js.
(window.LUNE = window.LUNE || {}).bassin = ({ put }) => {
  const ROCK = 0x3b3e4b, IVORY = 0xefe6d4, ORANGE = 0xdf8c40, BLUE = 0x6fabc6;
  for (const pk of [3150, 3350]) put('GRADINS', ROCK, pk, -1, 30, 30, 8, 80);            // steps of the basin wall, above the ramp
  for (const pk of [2950, 3480, 3650]) put('BLOCS', 0x8a8d98, pk, -1, 30, 14, 6, 18);
  put('GARAGE BUGGY', IVORY, 3760, -1, 26, 26, 11, 40); put('ROVER', ORANGE, 3805, -1, 14, 4, 3, 7); put('RÉSERVOIR', BLUE, 3715, -1, 30, 8, 7, 8); // maintenance area, south-west, off the track
  for (const pk of [3830, 3870, 3910]) for (const sd of [-1, 1]) put('SAS', ORANGE, pk, sd, 1, 3, 12, 3);                                         // open frames: a post each side, three in a row
};
