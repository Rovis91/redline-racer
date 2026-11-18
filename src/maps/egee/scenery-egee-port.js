// "egee", zone 1: Port (PK 0 to 650, 8 to 20 m, 16 m wide), and the harbour town that closes the lap from PK 4390. Tools (set, box, house) are described in scenery-egee.js.
// Island side: the town. A continuous lime front behind a 6 m pavement, then five more rows up the slope with 8 m paved streets between them, small squares where a house is missing, the town church in the fourth row;
// two warehouses, then rock. Third pass: café terraces, parked scooters and pick-ups, bougainvillea on the pavement of the front; drying nets, buoys, lobster pots and upturned dinghies on the quay. Sea side: the quay, three pontoons and their boats, the mole and the lighthouse. This is the only town of the island: the plateau above keeps a chapel, a few houses and the mills.
(window.EGEE = window.EGEE || {}).port = ({ h, THREE, MAT, N, SEA, LAP, smp, set, box, house, plant, hsh, boat }) => {
  const GREEN = { ...MAT, lime: MAT.limeV, bleu: MAT.vert, toile: MAT.toileR }, HT = [8, 12, 8, 11, 9, 12, 8, 10], VAR = [4, 6, 5, 8, 6, 1, 20, 0];
  for (let pk = 4476, k = 0; pk < LAP + 345; pk += 16.5, k++) house(pk, -1, 6 + hsh(k) * 1.5, 12, HT[k % 8], 16, VAR[k % 8], k % 3 === 1 ? GREEN : MAT);                 // the front: no gap, uneven heights
  for (let r = 1; r <= 5; r++) for (let pk = 4390, k = 0; pk < LAP + 535; pk += 15.5, k++) { const p = pk % LAP;                                                          // the streets behind
    if (hsh(k, r) < 0.1 || (r === 1 && p > 345 && p < 480) || (r === 4 && p > 120 && p < 185)) continue;                                                                  // a small square; the warehouses; the church
    house(pk + hsh(k, r + 9) * 3, -1, 6 + r * 19 + hsh(k, r) * 3, 11, 6 + (hsh(k, r + 3) * 3 | 0) + (r & 1), 12.5, [0, 1, 8, 1, 16, 9, 4, 2][(k + r) % 8], (k + 2 * r) % 4 === 2 ? GREEN : MAT); }
  set('chapelleEgee', 152, -1, 6 + 4 * 19 + 9, { s: 1.5 });                                                                                                              // the town church: its bell wall above the roofs
  for (const pk of [372, 452]) set('entrepotEgee', pk, -1, 18, { a: [20, 9, 40] });
  // the quay: a paved deck 10 m wide beyond the road wall and its stone face down into the water, from the last bend of the Descente to the end of the harbour
  const i0 = Math.round(4540 / LAP * N), cnt = Math.round(680 / LAP * N), face = h.mat('stone', { side: THREE.DoubleSide });
  h.ribbon(i0, cnt, s => s.w, 0.03, s => s.w + 10, 0.03, MAT.pavage, 8); h.ribbon(i0, cnt, s => s.w + 10, 0.03, s => s.w + 10, -5, face, 8);
  for (let pk = 4560; pk < LAP + 500; pk += 12) box('ocre', pk, 1, 9.1, 0.6, 0.7, 0.6, { y: smp(pk).y });                                                                // mooring blocks on the quay edge
  for (const pk of [4620, 25, 95, 200, 290, 400]) { const y = smp(pk).y; box('bois', pk, 1, 4.5, 1.5, 1.5, 1.5, { y }); box('boisB', pk + 1.9, 1, 4.8, 1.3, 1.3, 1.3, { y }); box('bois', pk + 0.9, 1, 4.7, 1.2, 1.2, 1.2, { y: y + 1.4 }); box('corail', pk - 2.6, 1, 4.2, 2.6, 0.5, 1.8, { y }); } // crates and a heap of nets
  [60, 150, 240].forEach((pk, i) => { set('pontonEgee', pk, 1, 29, { a: [40], y: SEA + 0.9 });
    [[4.6, 20, 'corail'], [-4.6, 31, 'bleu'], [4.6, 42, 'blanc']].forEach(([dz, off, c], j) => boat(pk + dz, off, 1, (i + j) & 1 ? Math.PI : 0, [c, 'bleu', 'corail'][(i + j) % 3], { pont: 1 })); });
  for (const [pk, c] of [[4600, 'corail'], [4655, 'bleu'], [320, 'corail'], [420, 'blanc']]) boat(pk, 12.5, 1, Math.PI / 2, c, { pont: 1 }); // moored along the quay
  // life on the pavement of the front (6 m between the road wall and the houses): café terraces under parasols or a striped awning, scooters in threes, a few pick-ups, bougainvillea against the walls
  const PAINT = [MAT.corail, MAT.bleu, MAT.blanc, MAT.vert];
  [4505, 4595, 4685, 45, 135, 222, 305].forEach((pk, i) => set('terrasseEgee', pk, -1, 3.3, { a: [i % 3 === 1 ? 4 : 3, i & 1], skin: i % 3 ? MAT : { ...MAT, toile: MAT.toileR } }));
  [4475, 4562, 22, 112, 262, 332].forEach((pk, i) => { for (let j = 0; j < 3; j++) set('scooterEgee', pk + j * 1.2, -1, 3.8, { ry: 0.25, skin: { ...MAT, coque: PAINT[(i + j) % 4] } }); });
  [4535, 78, 182, 408, 500].forEach((pk, i) => set('pickupEgee', pk, -1, 4.2, { ry: i & 1 ? Math.PI : 0, skin: { ...MAT, coque: PAINT[(i + 2) % 4] } }));
  for (const pk of [4490, 4660, 60, 160, 285]) plant('fleur', pk, -1, 5.4, 1.6, 1.4);
  // where the town stops and the rock takes over (PK 540 to 650): crags in the slope, the stump of a watch tower, scree, prickly pear
  [[575, 22, 14, 9], [612, 30, 18, 12], [640, 20, 13, 8]].forEach(([pk, off, w, ht], k) => set('rocherEgee', pk, -1, off, { a: [w, ht, w * 1.3, k + 160], skin: k & 1 ? MAT.cap : MAT.roche }));
  set('tourEgee', 596, -1, 40, { a: [3.6, 3, 7, 10, 8], skin: MAT.pierre }); for (let pk = 545, k = 0; pk < 650; pk += 6, k++) { plant('caillou', pk, -1, 3 + hsh(k, 21) * 8, 0.7 + hsh(k, 22) * 1.6); if (k % 4 === 0) plant('nopal', pk + 2, -1, 3.6 + hsh(k, 23) * 3, 1.2); }
  // gear on the quay deck
  [4585, 4668, 132, 252, 352, 472].forEach(pk => set('agresEgee', pk, 1, 6.5, { y: smp(pk).y }));
  [4642, 62, 172, 312, 442].forEach((pk, i) => set('barqueEgee', pk, 1, 3.6, { y: smp(pk).y, ry: i & 1 ? 0.2 : -0.15, skin: { ...MAT, coque: PAINT[i % 3] } }));
  // the mole closes the basin; the lighthouse at its end is the far landmark of the quay curve
  box('ocre', 340, 1, 9, 125, 8.6, 8, { y: SEA - 6 }); const end = { y: SEA + 2.6 };
  set('phareEgee', 340, 1, 127, { ...end, a: [20] }); set('tourEgee', 340, 1, 127, { ...end, a: [3.4, 2.3, 20, 10], skin: MAT.blanc }); set('coneEgee', 340, 1, 127, { y: SEA + 26, a: [2.3, 2.8], skin: MAT.bleu });
};
