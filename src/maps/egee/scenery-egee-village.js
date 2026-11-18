// "egee", zone 3: Village (PK 2000 to 2800, 161 to 171 m, 12 m wide, R ≈ 38 m near PK 2151). Tools (set, box, house, wall, plant) are described in scenery-egee.js.
// Houses stand close to the road on the outside of the bends and 14 m back on the inside (nothing hides an apex or an exit); a lime garden wall joins them on the outside, a second row shows above it. The square and the chapel are at PK 2400.
(window.EGEE = window.EGEE || {}).village = ({ MAT, smp, set, box, house, wall, plant, hsh }) => {
  const GREEN = { ...MAT, lime: MAT.limeV, bleu: MAT.vert, toile: MAT.toileR }, VAR = [1, 6, 8, 3, 20, 5];
  for (let pk = 2020, k = 0; pk < 2790; pk += 25, k++) { if (pk > 2365 && pk < 2440) continue; // the square
    const out = smp(pk).k > 0 ? -1 : 1; house(pk, out, 4, 12, [7, 9, 11, 8][k % 4], 20, VAR[k % 6], k % 5 === 1 ? GREEN : MAT); if (k % 2 && (pk < 2320 || pk > 2480)) house(pk, -out, 12, 12, 7 + k % 3, 16, VAR[(k + 2) % 6]);
    wall('blanc', pk - 12.5, pk + 12.5, out, 4.2, 2.4, { th: 0.7 }); if (k % 2 === 0) house(pk + 6, out, 20 + hsh(k) * 4, 10, 10 + k % 3 * 2, 13, 1);                                  // the row behind, higher
    if (k % 3 === 0) plant('fleur', pk + 11.5, out, 3.2, 2.2, 1.2); }                                                     // bougainvillea: a few big masses on the walls
  box('pavage', 2400, 1, 5, 30, 0.5, 44, { y: smp(2400).y - 0.3 }); wall('blanc', 2378, 2422, 1, 35, 1.1, { th: 0.7 });                                                    // the square: the one wide gap
  // the chapel, 22 m back, its blue dome above the roofs: the only blue dome of the island
  const chapel = (shape, o) => set(shape, 2400, -1, 31, { s: 1.5, ...o });                                                                                                // 1.5 times its block, and no house on its side of the bend: it must read from the lane
  chapel('chapelleEgee'); chapel('tourEgee', { a: [4.3, 4.3, 3.2, 10], skin: MAT.blanc, dy: 12.6 }); chapel('domeEgee', { a: [4.6], skin: MAT.bleu, dy: 17.4 });
};
