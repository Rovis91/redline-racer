// "lune" blockout, zone 4: Grand cratère oriental (PK 2300 to 3500, 68 down to 23 m, 18 m wide). The crater (Ø 686 m, floor -75 m) is terrain, on the right. Only this zone's named blocks; put() is described in scenery-lune.js.
(window.LUNE = window.LUNE || {}).oriental = ({ put, far }) => {
  const DARK = 0x273443, SLATE = 0x526d82, IVORY = 0xe4e3d9, ORANGE = 0xd88b43;
  for (const pk of [2400, 2650, 2900, 3150, 3400]) put('STRATES', DARK, pk, 1, 90, 40, 8, 120); // dark strata on the crater wall, below the road
  put('STATION SCIENTIFIQUE', IVORY, 2950, -1, 90, 30, 9, 20); put('COUPOLE', SLATE, 2950, -1, 96, 12, 18, 12); put('MÂT', ORANGE, 2990, -1, 100, 3, 26, 3); // small study station in the eastern background, off the loop
  for (const pk of [2500, 2800, 3300]) put('BORD ROCHEUX', SLATE, pk, -1, 30, 18, 7, 40);
  for (const z of [-350, 250]) far('DORSALE', DARK, 1150, z, 120, 60, 500);                                 // cold grey ridges closing the horizon
};
