// "egee", zone 3: the plateau (PK 2000 to 2800, 161 to 171 m, 12 m wide, R ≈ 38 m near PK 2151). Tools (set, box, house, wall, plant, grove, mill) are described in scenery-egee.js.
// No village up here (the town is the harbour): the chapel with the blue dome and its square at PK 2400, a second small chapel, three houses, a row of three windmills, dry-stone field walls and scrub.
(window.EGEE = window.EGEE || {}).village = ({ MAT, smp, set, box, house, wall, plant, grove, mill, hsh }) => {
  const out = pk => smp(pk).k > 0 ? -1 : 1; // the outside of the bend at pk
  box('pavage', 2400, 1, 5, 30, 0.5, 44, { y: smp(2400).y - 0.3 }); wall('blanc', 2378, 2422, 1, 35, 1.1, { th: 0.7 });                                                    // the square, on the sea side
  // the chapel, 22 m back, 1.5 times its block: the only blue dome of the island
  const chapel = (shape, o) => set(shape, 2400, -1, 31, { s: 1.5, ...o });
  chapel('chapelleEgee'); chapel('tourEgee', { a: [4.3, 4.3, 3.2, 10], skin: MAT.blanc, dy: 12.6 }); chapel('domeEgee', { a: [4.6], skin: MAT.bleu, dy: 17.4 });
  plant('fleur', 2386, -1, 20, 2.4, 1); for (const pk of [2372, 2428]) { plant('cypres', pk, -1, 16, 1.3); plant('cypres', pk + 4, -1, 19, 1); }
  set('chapelleEgee', 2655, out(2655), 14, { s: 0.9 });                                                                                                                   // a second, small chapel: bell wall, no dome
  house(2060, out(2060), 6, 11, 6, 14, 1); house(2470, -1, 9, 10, 6, 13, 6); house(2730, out(2730), 6, 11, 7, 14, 20);                                                     // the three houses
  [2190, 2240, 2290].forEach(pk => mill(pk, -1, 26, 1.15, -0.7));                                                                                                         // the row of mills on the crest
  wall('pierre', 2010, 2150, -1, 4, 1.1); wall('pierre', 2520, 2620, -1, 4, 1.1); wall('pierre', 2690, 2790, 1, 5, 0.9);                                                   // old field walls
  grove('buisson', 2010, 2790, -1, 8, 70, 16, 1.6); grove('olive', 2560, 2640, -1, 10, 40, 12);
  for (let pk = 2010; pk < 2790; pk += 13) { plant('buisson', pk, -1, 2.8 + hsh(pk) * 3, 1 + hsh(pk, 3) * 0.6); plant('buisson', pk + 6, 1, 2.8 + hsh(pk, 5) * 20, 0.9 + hsh(pk, 7) * 0.6); }
  for (let pk = 2040, k = 0; pk < 2780; pk += 61, k++) set('rocherEgee', pk, k & 1 ? 1 : -1, 9 + hsh(k, 4) * 12, { a: [4 + hsh(k) * 5, 1.5 + hsh(k, 1) * 2.5, 5 + hsh(k, 2) * 5, k + 60], skin: MAT.roche });
};
