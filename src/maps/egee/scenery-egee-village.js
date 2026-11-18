// "egee", zone 3: the plateau (PK 2000 to 2800, 161 to 171 m, 12 m wide, R ≈ 38 m near PK 2151). Tools (set, box, house, wall, plant, grove, mill) are described in scenery-egee.js.
// Third pass: threshing floors by the mills, dovecotes, a well on the square, a cistern, a goat pen, a farm far back, the power line, field walls at right angles, prickly pear hedges, figs, a pick-up and scooters.
// No village up here (the town is the harbour): the chapel with the blue dome and its square at PK 2400, a second small chapel, three houses, a row of three windmills, dry-stone field walls and scrub.
(window.EGEE = window.EGEE || {}).village = ({ MAT, smp, set, box, house, wall, plant, grove, mill, hut, poles, path, cross, aire, pen, hsh }) => {
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
  aire(2332, -1, 15); aire(2585, 1, 13); path(2180, 3.5, 2204, 21, -1, 8);                                                                                              // threshing floors; the lime path to the mills
  set('pigeonnierEgee', 2128, 1, 15); set('pigeonnierEgee', 2705, -1, 19); pen(2255, 1, 8, 5);
  set('puitsEgee', 2412, 1, 13, { y: smp(2400).y + 0.2 }); set('citerneEgee', 2492, -1, 11);
  house(2600, -1, 34, 9, 5, 11, 16); plant('figue', 2612, -1, 30, 0.9); plant('figue', 2482, -1, 20, 0.9); plant('figue', 2074, out(2060), 9, 1.2); plant('figue', 2742, out(2730), 9, 1.1);
  poles(1950, 2800, -1, 5.2, 22);                                                                                                                                         // the line ends at the last house: the balcony keeps a clear sky
  set('terrasseEgee', 2400, 1, 22, { a: [4, 1], y: smp(2400).y + 0.2 }); for (const pk of [2381, 2419]) { plant('cypres', pk, 1, 38, 1.1); plant('olive', pk + (pk < 2400 ? 6 : -6), 1, 30, 0.9); }                      // the kafeneio of the square
  wall('pierre', 2440, 2560, 1, 24, 0.9); for (const pk of [2440, 2500, 2560]) cross('pierre', pk, 1, 5.5, 24, 0.9); grove('olive', 2448, 2554, 1, 8, 22, 10); hut(2530, 1, 28); house(2640, 1, 30, 9, 5, 11, 8); // walled olive plots and a farm on the sea side of the plateau

  for (const pk of [2152, 2518, 2622]) cross('pierre', pk, -1, 5, 44); wall('pierre', 2520, 2620, -1, 44, 1.1); for (const pk of [2690, 2790]) cross('pierre', pk, 1, 5.5, 30, 0.9);
  for (let pk = 2020; pk < 2145; pk += 9) plant('nopal', pk, -1, 5.8 + hsh(pk) * 0.8, 1.1 + hsh(pk, 2) * 0.4);                                                             // a prickly pear hedge behind the field wall
  for (const pk of [2170, 2310, 2450, 2540, 2660, 2760]) { plant('agave', pk, 1, 4, 1.3); plant('agave', pk + 3, 1, 6, 0.9); plant('nopal', pk + 30, -1, 3.6, 1.2); }
  for (let pk = 2012, k = 0; pk < 2790; pk += 8, k++) { plant('thym', pk, k & 1 ? 1 : -1, 2.6 + hsh(k, 15) * 9, 0.5 + hsh(k, 16) * 0.5); if (k % 3 === 0) plant('caillou', pk + 4, k & 2 ? 1 : -1, 3 + hsh(k, 13) * 12, 0.6 + hsh(k, 14) * 1.2); }
  set('pickupEgee', 2386, 1, 8, { y: smp(2400).y + 0.2, skin: { ...MAT, coque: MAT.bleu } }); set('pickupEgee', 2455, -1, 7.5, { skin: { ...MAT, coque: MAT.blanc } });
  [2416, 2417.3].forEach((pk, i) => set('scooterEgee', pk, 1, 7, { y: smp(2400).y + 0.2, ry: 0.25, skin: { ...MAT, coque: i ? MAT.corail : MAT.vert } }));
  for (let pk = 2040, k = 0; pk < 2780; pk += 61, k++) set('rocherEgee', pk, k & 1 ? 1 : -1, 9 + hsh(k, 4) * 12, { a: [4 + hsh(k) * 5, 1.5 + hsh(k, 1) * 2.5, 5 + hsh(k, 2) * 5, k + 60], skin: MAT.roche });
};
