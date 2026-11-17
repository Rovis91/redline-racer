// "egee", zone 1: Port (PK 0 to 650, 8 to 20 m, 16 m wide), and the harbour houses that close the lap from PK 4476. Tools (set, box, house, wall, plant) are described in scenery-egee.js.
// Island side: a continuous lime town front behind a 6 m pavement, two more rows stacked on the slope behind it, then two warehouses and the first cliff. Sea side: the quay, three pontoons and their boats, the mole and the lighthouse.
(window.EGEE = window.EGEE || {}).port = ({ h, THREE, MAT, N, SEA, LAP, set, box, house, hsh }) => {
  const GREEN = { ...MAT, lime: MAT.limeV, bleu: MAT.vert, toile: MAT.toileR }, HT = [8, 12, 8, 11, 9, 12, 8, 10], VAR = [4, 6, 5, 8, 6, 1, 20, 0];
  for (let pk = 4476, k = 0; pk < LAP + 345; pk += 16.5, k++) house(pk, -1, 6 + hsh(k) * 1.5, 12, HT[k % 8], 16, VAR[k % 8], k % 3 === 1 ? GREEN : MAT);                 // the front: no gap, uneven heights
  for (let pk = 4500, k = 0; pk < LAP + 330; pk += 31, k++) { house(pk, -1, 25 + hsh(k, 1) * 8, 10, 7, 13, k & 1 ? 1 : 8, k % 4 === 2 ? GREEN : MAT); if (k % 2) house(pk + 12, -1, 46 + hsh(k, 2) * 10, 10, 6, 12, 1); } // the rows behind, higher on the slope
  for (const pk of [372, 452]) set('entrepotEgee', pk, -1, 18, { a: [20, 9, 40] });
  set('falaiseEgee', 590, -1, 21, { a: [30, 24, 90, 1], skin: MAT.roche });                                                                                              // transition: the built front stops, the walls turn to rock
  // the quay: a paved deck 10 m wide beyond the road wall and its stone face down into the water, from the last bend of the Descente to the end of the harbour
  const i0 = Math.round(4540 / LAP * N), cnt = Math.round(680 / LAP * N), face = h.mat('stone', { side: THREE.DoubleSide });
  h.ribbon(i0, cnt, s => s.w, 0.03, s => s.w + 10, 0.03, MAT.pavage, 8); h.ribbon(i0, cnt, s => s.w + 10, 0.03, s => s.w + 10, -5, face, 8);
  [60, 150, 240].forEach((pk, i) => { set('pontonEgee', pk, 1, 29, { a: [40], y: SEA + 0.9 });
    [[4.6, 20, MAT.corail], [-4.6, 31, MAT.bleu], [4.6, 42, MAT.blanc]].forEach(([dz, off, c], j) => set('kaikiEgee', pk + dz, 1, off, { y: SEA - 0.15, ry: (i + j) & 1 ? Math.PI : 0, skin: { ...MAT, coque: [c, MAT.bleu, MAT.corail][(i + j) % 3] } })); });
  for (const [pk, c] of [[4600, MAT.corail], [4655, MAT.bleu], [320, MAT.corail], [420, MAT.blanc]]) set('kaikiEgee', pk, 1, 12.5, { y: SEA - 0.15, ry: Math.PI / 2, skin: { ...MAT, coque: c } }); // moored along the quay
  // the mole closes the basin; the lighthouse at its end is the far landmark of the quay curve
  box('ocre', 340, 1, 9, 125, 8.6, 8, { y: SEA - 6 }); const end = { y: SEA + 2.6 };
  set('phareEgee', 340, 1, 127, { ...end, a: [20] }); set('tourEgee', 340, 1, 127, { ...end, a: [3.4, 2.3, 20, 10], skin: MAT.blanc }); set('coneEgee', 340, 1, 127, { y: SEA + 26, a: [2.3, 2.8], skin: MAT.bleu });
};
