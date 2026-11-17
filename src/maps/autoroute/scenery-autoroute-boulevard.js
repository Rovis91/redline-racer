// "autoroute" blockout, zone 4: Le boulevard englouti (PK 2297 to 4015): 04A the jam on the descent from +32 m, 04C the pass under the viaduct X1 (PK 3349), 04B the streets at +1 m with water on both sides.
// Only this zone's named blocks; helpers are described in scenery-autoroute.js.
(window.AUTOROUTE = window.AUTOROUTE || {}).boulevard = ({ put, shoulder, at }) => {
  const FACADE = 0xb09a80, WET = 0x7a8478, RUST = 0xb5613a, BUS = 0xd8b040, DARK = 0x1a8f98;
  // 04A: the city closes in on the ramp; facades 14 m above the road on both sides, the fossil jam on a closed lane on the left
  for (let pk = 2440, k = 0; pk <= 3220; pk += 65, k++) { const sd = k % 2 ? 1 : -1; if (sd > 0 || pk < 2540 || pk > 2790) put('FACADE', FACADE, pk, sd, 10, 24, at(pk).y + 18, 40, -4); }
  shoulder(2560, 2770, -1, 10);
  put('BUS ABANDONNE', BUS, 2600, -1, 2, 3, 3.5, 12, at(2600).y); put('FOURGON CABOSSE', RUST, 2750, -1, 2, 2.5, 2.8, 6, at(2750).y);
  for (const pk of [2640, 2680, 2715]) put('EPAVES', RUST, pk, -1, 3.5, 5, 1.8, 8, at(pk).y);
  // 04B: ground floors in the water, 6 m from the wall; a drowned side street in the gaps
  for (let pk = 3430; pk <= 3990; pk += 70) for (const sd of [-1, 1]) put('FACADE NOYEE', WET, pk, sd, 6, 20, 20, 50);
  put('RUE NOYEE', DARK, 3605, 1, 6, 70, 0.4, 14, 0); put('RUE NOYEE', DARK, 3815, -1, 6, 70, 0.4, 14, 0);
};
