// "egee" blockout, zone 3: Village (PK 2000 to 2800, 161 to 171 m, 12 m wide, R ≈ 38 m near PK 2151). Only this zone's named blocks; put() is described in scenery-egee.js.
(window.EGEE = window.EGEE || {}).village = ({ put, at }) => {
  const WHITE = 0xfff5e8, BLUE = 0x1c6eb0, SAND = 0xd9b889;
  // houses: close to the wall on the outside of the bends, set back 14 m on the inside (nothing hides an apex or an exit)
  for (let pk = 2020, k = 0; pk < 2790; pk += 50, k++) { if (pk > 2370 && pk < 2440) continue; // the square
    const out = at(pk).k > 0 ? -1 : 1; put('MAISON', WHITE, pk, out, 4, 12, 7 + k % 3 * 2, 18); if (k % 2) put('MAISON', WHITE, pk, -out, 14, 12, 7, 16); }
  put('PLACE', SAND, 2400, 1, 5, 30, 0.6, 44);
  put('CHAPELLE', WHITE, 2400, -1, 22, 14, 10, 20); put('COUPOLE', BLUE, 2400, -1, 25, 8, 16, 8); // the dome rises through the chapel: 6 m of blue above its roof
};
