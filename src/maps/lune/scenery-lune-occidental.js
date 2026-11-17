// "lune" blockout, zone 2: Cratère occidental (PK 400 to 1350, 22 to 63 m, 18 m wide): the chicane between two fresh impacts (PK 500 to 800), then the hairpin around the telemetry relay (PK 1090).
// The western crater (Ø 545 m) and the two impacts are terrain. Only this zone's named blocks; put() is described in scenery-lune.js.
(window.LUNE = window.LUNE || {}).occidental = ({ put }) => {
  const ROCK = 0x69707a, DARK = 0x303c49, IVORY = 0xe7e2d0, ORANGE = 0xdc8d65;
  put('IMPACT RÉCENT', ORANGE, 540, -1, 62, 3, 9, 3); put('IMPACT RÉCENT', ORANGE, 650, 1, 14, 3, 9, 3);  // one mast on the rim of each fresh impact: the reason for the chicane
  for (const [pk, sd] of [[500, 1], [600, -1], [700, 1]]) put('ÉJECTAS', ROCK, pk, sd, 10, 12, 5, 16);    // thrown blocks on the outside of each change of direction
  for (const pk of [860, 1000, 1220]) put('TERRASSES', DARK, pk, 1, 70, 30, 6, 90);                       // rock terraces on the inner wall of the crater
  put('RELAIS TÉLÉMESURE', IVORY, 1091, -1, 24, 14, 8, 14); put('PARABOLE', ORANGE, 1091, -1, 28, 6, 22, 6); // the relay on the outside of the hairpin: the road goes round it
  for (const pk of [450, 800, 950, 1180, 1300]) put('BLOCS', ROCK, pk, -1, 32, 16, 5 + pk % 4, 20);
};
