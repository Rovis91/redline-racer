// "lune" blockout, zone 2: Cratère occidental (PK 550 to 1400, 28 to 44 m, top 50 m near PK 1150, 18 m wide). The crater itself (Ø 545 m, floor -32 m) is terrain, on the right. Only this zone's named blocks; put() is described in scenery-lune.js.
(window.LUNE = window.LUNE || {}).occidental = ({ put }) => {
  const ROCK = 0x69707a, DARK = 0x303c49, IVORY = 0xe7e2d0, ORANGE = 0xdc8d65;
  for (const pk of [640, 860, 1080, 1300]) put('TERRASSES', DARK, pk, 1, 70, 30, 6, 90);  // rock terraces on the inner wall, far below the drivable edge
  put('RELAIS TÉLÉMESURE', IVORY, 900, -1, 70, 14, 8, 14); put('PARABOLE', ORANGE, 900, -1, 74, 6, 22, 6); // compact relay on open ground, north-west, away from the flow
  for (const pk of [600, 760, 1010, 1180, 1340]) put('BLOCS', ROCK, pk, -1, 32, 16, 5 + pk % 4, 20); // scatter of faceted boulders, in bands away from the ribbon
};
