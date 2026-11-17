// "egee", zone 3: Village (PK 2000 to 2800, 161 to 171 m, 12 m wide, R ≈ 38 m near PK 2151). Tools (set, box, house, wall, plant) are described in scenery-egee.js.
// Houses stand close to the road on the outside of the bends and 14 m back on the inside (nothing hides an apex or an exit); a lime garden wall joins them on the outside, a second row shows above it. The square and the chapel are at PK 2400.
(window.EGEE = window.EGEE || {}).village = ({ MAT, smp, set, box, house, wall, plant, hsh }) => {
  const GREEN = { ...MAT, lime: MAT.limeV, bleu: MAT.vert, toile: MAT.toileR }, VAR = [1, 6, 8, 3, 20, 5];
  for (let pk = 2020, k = 0; pk < 2790; pk += 50, k++) { if (pk > 2370 && pk < 2440) continue; // the square
    const out = smp(pk).k > 0 ? -1 : 1; house(pk, out, 4, 12, 7 + k % 3 * 2, 18, VAR[k % 6], k % 4 === 1 ? GREEN : MAT); if (k % 2) house(pk, -out, 14, 12, 7, 16, VAR[(k + 2) % 6]);
    wall('blanc', pk - 25, pk + 25, out, 4, 2.4, { th: 0.7 }); house(pk + 25, out, 19 + hsh(k) * 6, 10, 6 + k % 2 * 3, 13, k & 1 ? 8 : 1);
    if (k % 2 === 0) plant('fleur', pk + 14, out, 4.3, 2.4, 1.5); else plant('fleur', pk - 11, out, 3.6, 1.9, 0.8); }                                                     // bougainvillea: a few big masses on the walls
  box('pavage', 2400, 1, 5, 30, 0.5, 44, { y: smp(2400).y - 0.3 }); wall('blanc', 2378, 2422, 1, 35, 1.1, { th: 0.7 });                                                    // the square: the one wide gap
  // the chapel, 22 m back, its blue dome above the roofs: the only blue dome of the island
  set('chapelleEgee', 2400, -1, 28); set('tourEgee', 2400, -1, 28, { a: [4.3, 4.3, 3.2, 10], skin: MAT.blanc, dy: 8.4 }); set('domeEgee', 2400, -1, 28, { a: [4.6], skin: MAT.bleu, dy: 11.6 });
};
