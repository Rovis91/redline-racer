// "lune" blockout, zone 5: Bassin sud & sas (PK 3500 to 4950, 14 to 30 m, 18 m wide, R ≈ 84 m in the final S). The southern basin (Ø 444 m) and the satellite impact are terrain, on the right;
// the gallery (PK 4480 to 4680) is the engine tunnel (M.tun). Only this zone's named blocks; put() is described in scenery-lune.js.
(window.LUNE = window.LUNE || {}).bassin = ({ put }) => {
  const ROCK = 0x3b3e4b, IVORY = 0xefe6d4, ORANGE = 0xdf8c40, BLUE = 0x6fabc6;
  for (const pk of [3600, 3850, 4100]) put('GRADINS', ROCK, pk, 1, 60, 30, 6, 80);       // steps of the basin wall
  for (const pk of [3700, 3980, 4220]) put('BLOCS', 0x8a8d98, pk, -1, 30, 14, 6, 18);
  put('GARAGE BUGGY', IVORY, 4340, -1, 26, 26, 11, 40); put('ROVER', ORANGE, 4395, -1, 14, 4, 3, 7); put('RÉSERVOIR', BLUE, 4290, -1, 30, 8, 7, 8); // maintenance area, south-west, off the track
  for (const sd of [-1, 1]) { put('SAS ENTRÉE', ORANGE, 4468, sd, 2, 6, 13, 6); put('SAS SORTIE', ORANGE, 4692, sd, 2, 6, 13, 6); }                  // fixed airlocks: an orange post each side of both portals
  for (const pk of [4520, 4580, 4640]) put('GALERIE TECHNIQUE', IVORY, pk, -1, 14, 10, 6, 30);                                                     // technical bays along the hull, outside
};
