// "autoroute", zone 4: La rue effondree (row 2, heading west): the street has fallen into the metro tube that ran under it. The roadway ends on a broken edge (x = 153): its last slabs hang down into the hole
// on their bars, each at its own angle and length, and the car drops 9 m in free fall (the flight physics of the jumps) onto the cone of rubble the street made, in a cave open to the sky.
// The cave lies between two banks of fallen ground, 20 m apart under the ledge (the boxes TALUS of the map) then closing in to the mouth of the tube (x = 66) under what is left of the street beyond the hole:
// there the banks are the road's own walls (M.wide), and they are drawn from them: what is seen is what is hit.
// The slabs standing either side of the lane before the edge are boxes of the map too (DALLE CASSEE, built by real() in scenery-autoroute.js).
(window.AUTOROUTE = window.AUTOROUTE || {}).trou = ({ h, I, MAT, BODIES, set, slab, quad, real, tuft, HH }) => {
  const { S, T, THREE } = h, TOP = 2.4, iM = T.t0 - 3, fw = s => Math.min(10, s.w - 0.3), RAME = (s, sd) => sd > 0 && s.x > 70 && s.x < 109; // fw: half-width of the cave at a sample: the banks' inner faces stand 0.3 m inside the road's walls
  // the banks: each a slope of rubble then of earth rising away from the lane, from under the floor to the street; slabs of the roadway lie tipped on them, and grass has taken at their foot
  { const i0 = I.bord + 4, n = iM - i0; for (const sd of [-1, 1]) { h.ribbon(i0, n, s => sd * fw(s), -0.6, s => sd * fw(s), 1.4, MAT.rubble, 8); h.ribbon(i0, n, s => sd * fw(s), 1.4, s => sd * (fw(s) + 1.6), 5, MAT.rubble, 8); h.ribbon(i0, n, s => sd * (fw(s) + 1.6), 5, s => sd * (fw(s) + 3.2), s => TOP - s.y, MAT.earth, 8);
      for (let i = i0 + 4; i < iM - 3; i += 7) { const s = S[i], d = sd * (fw(s) + 1.5); if (RAME(s, sd)) continue; set('eboulisAutoroute', s.x - s.tz * d, s.z + s.tx * d, { y: s.y - 0.3, ry: (sd > 0 ? 0 : Math.PI) + (HH(i, 8) - 0.5), a: [6, 3 + 3 * HH(i, 9), 3, i] }); } // heaps of the fallen street against the banks, their foot at the wall line
      for (let i = i0 + 2, q = 0; i < iM - 2; i += 5, q++) { const s = S[i], d = sd * (fw(s) + 1.4), x = s.x - s.tz * d, z = s.z + s.tx * d; tuft(s.x - s.tz * sd * (fw(s) - 0.4), s.z + s.tx * sd * (fw(s) - 0.4), s.y, i);
        if (q % 3 !== 1 && !RAME(s, sd)) set('dalleAutoroute', x, z, { y: s.y + 0.4 + 2 * HH(i, 3), ry: (sd > 0 ? Math.PI : 0) + (HH(i, 4) - 0.5) * 0.8, a: [3 + 3 * HH(i, 5), 4 + 3 * HH(i, 6), 0.9 + 0.3 * HH(i, 7)] }); } } }
  // the ledge: the cut of the street (asphalt crust, then earth), the slabs hanging from it into the hole, and the street's surface up to the edge (the ground is dug out from x = 146 on)
  quad('earth', [149.7, -9, 209], [149.7, -9, 231], [149.7, TOP, 231], [149.7, TOP, 209]); 
  for (const z of [209.3, 230.7]) quad('earth', [150, -12, z], [56, -12, z], [56, TOP, z], [150, TOP, z]);                                          // the ground under the buildings either side, behind the banks
  [[211.75, 155.6, 5], [217.25, 153.6, 8.4], [222.75, 153.9, 9], [228.25, 156.6, 3.4]].forEach(([z, x, l], k) => slab('asphalt', x, 1.95 - 0.03 * (k & 1), z, l, 0.5, 5.5, (k - 1.5) * 0.04)); // (the lip is ragged: the outer slabs broke off further back)
  for (const [z, w, d, a] of [[212.2, 4.8, 6, 0.55], [217.4, 4.4, 9.5, 0.75], [222.6, 5, 5, 0.42], [227.8, 4.6, 8, 0.85]]) { set('dalleAutoroute', 150.6 - d / 2 * Math.cos(a), z, { y: 2.3 - Math.sin(a) * d - 0.3, ry: -Math.PI / 2, a: [w, d, a] });
    for (let i = 0; i < 3; i++) slab('rust', 149.2, 1.2 - i * 0.5, z - 1.4 + i * 1.4, 2.2 + HH(z, i), 0.08, 0.08); }
  // the sides of the hole are no straight line: what is left of each pavement is a row of slabs of uneven width, some gone, some tipped into the hole, and two lengths of kerb hang from their bars
  for (const sd of [-1, 1]) for (let x = 119.5, k = 0; x < 151; x += 4.5, k++) { const q = HH(k, sd), wd = 0.5 + 3.4 * HH(k + 7, sd), zf = 220 + sd * 11; if (q < 0.18) continue;
    if (q < 0.45) set('dalleAutoroute', x, zf - sd * (0.3 + wd / 2 * Math.cos(0.6)), { y: 2.5 - Math.sin(0.6) * wd - 0.3, ry: sd > 0 ? Math.PI : 0, a: [4.3, wd + 1, 0.5 + 0.4 * HH(k, 3)], skin: { ...MAT, asphalt: MAT.pave } });
    else slab('pave', x, 2, zf - sd * wd / 2, 4.4, 0.6, wd, (HH(k, 5) - 0.5) * 0.12); }
  // what is left of the street beyond the hole: its slab over the end of the cave, its broken edge facing the fall (slabs hanging from it too), and the rubble that buries it further on
  slab('asphalt', 73, 1.8, 220, 46, 0.6, 22); slab('concrete', 73, 1.5, 220, 45.6, 0.3, 21.6);
  for (const [z, w, d, a] of [[213, 5.5, 7, 0.7], [220.5, 6, 4.5, 0.5], [227, 5, 8.5, 0.9]]) set('dalleAutoroute', 95.4 + d / 2 * Math.cos(a), z, { y: 2.2 - Math.sin(a) * d - 0.3, ry: Math.PI / 2, a: [w, d, a] });
  real('EBOULIS', 22, 6, 12, 60, 2.4, 220, Math.PI / 2);
  // the train the street fell on: two cars thrown off the rails against the north bank where the cave closes in, behind the line of the road's wall (the bank is what the car hits: of the train, only what sticks out of the rubble is seen),
  // leaning into the bank, slabs of the roadway on their roofs; the second lies under what is left of the street, its end buried by the mouth of the tube
  { const car = (x, d, ry, rz) => set('rameAutoroute', x, 220 - d, { y: -8.3, ry: -Math.PI / 2 + ry, rz, a: [1], skin: { ...MAT, body: BODIES[1] } });
    car(99, 7.8, 0.117, 0.1); car(81, 5.55, 0.068, 0.2); // (their flanks stand just in front of the bank, which is 0.3 m inside the road's wall; RAME: no heap nor slab of the bank in front of them)
    set('dalleAutoroute', 101, 211.4, { y: -5, ry: -0.5, a: [5, 4, 0.35] }); set('eboulisAutoroute', 74, 213, { y: -8.6, ry: 0.4, a: [5, 3.6, 4, 7] }); }
  // the floor of the cave: the cone of rubble, over the engine's roadway, from the landing to the tube; the end wall of the cave over the mouth of the tube
  h.ribbon(I.bord + 3, iM - I.bord - 3, s => -fw(s), 0.04, s => fw(s), 0.04, h.mat('gravatsAutoroute', { side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, rep: [3, 1], c: 0x9a948a }), 8);
  quad('tunnel', [65.9, -3.4, 208], [65.9, -3.4, 232], [65.9, 1.8, 232], [65.9, 1.8, 208]); for (const sd of [-1, 1]) quad('tunnel', [65.9, -9, 220 + sd * 3.5], [65.9, -9, 220 + sd * 12], [65.9, -3.4, 220 + sd * 12], [65.9, -3.4, 220 + sd * 3.5]);
};
