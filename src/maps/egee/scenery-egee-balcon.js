// "egee", zone 4: Balcon (PK 2800 to 3500, 171 to 123 m, 12-14 m wide). Tools (set, wall, plant, grove, mill) are described in scenery-egee.js.
// Third pass, island side only: a threshing floor by the mill, a dovecote, a goat pen, a chapel on a high rock with its lime stair, crags, scree, prickly pear and agave. Sea side: thyme and stones, nothing tall.
// Sea side: nothing above the parapet; the capes are terrain, below the road and under the horizon line. Island side: the windmill on the high point, high rocks (terrain), broken rock, isolated cypresses.
(window.EGEE = window.EGEE || {}).balcon = ({ MAT, set, wall, plant, grove, mill, path, cross, aire, pen, hsh }) => {
  mill(2900, -1, 44, 1.5, -0.8);                                                                                                  // 40 m back, 1.5 times its block so that it reads from the lane; its wheel is turned to the car that arrives
  [3000, 3280].forEach((pk, i) => set('rocherEgee', pk, 1, 62, { a: [26, 5, 34, i + 11], skin: MAT.cap }));                       // the capes: a low broken crest on each headland
  for (let pk = 2990, k = 0; pk < 3490; pk += 37, k++) set('rocherEgee', pk, -1, 11 + hsh(k, 4) * 14, { a: [6 + hsh(k) * 8, 3 + hsh(k, 1) * 5, 7 + hsh(k, 2) * 8, k], skin: MAT.roche }); // broken rock on the plateau edge
  wall('pierre', 2836, 2990, -1, 5, 1.1);                                                                                         // an old field wall up to the mill
  grove('buisson', 2960, 3500, -1, 12, 80, 17, 1.7);
  aire(2850, -1, 16); set('pigeonnierEgee', 2972, -1, 16); pen(3128, -1, 7, 5); set('puitsEgee', 3210, -1, 4.5); set('citerneEgee', 3452, -1, 6);
  set('chapelleEgee', 3335, -1, 48, { s: 0.6 }); path(3306, 3.5, 3330, 40, -1, 14);                                              // a chapel on the high ground and its stair
  cross('pierre', 2990, -1, 5.5, 40);
  [3060, 3250, 3400].forEach((pk, k) => set('rocherEgee', pk, -1, 27, { a: [15, 8 + k * 2, 20, k + 140], skin: k & 1 ? MAT.cap : MAT.roche }));    // crags above the road
  for (const pk of [2830, 2940, 3040, 3160, 3270, 3380, 3470]) { plant('nopal', pk, -1, 3.6, 1.3); plant('nopal', pk + 2.5, -1, 4.8, 1); plant('agave', pk + 50, -1, 4, 1.3); }
  for (let pk = 2806, k = 0; pk < 3500; pk += 8, k++) { plant('thym', pk, k & 1 ? 1 : -1, 2.6 + hsh(k, 15) * 7, 0.5 + hsh(k, 16) * 0.5); if (k % 2) plant('caillou', pk + 4, k & 2 ? 1 : -1, 2.8 + hsh(k, 13) * 9, 0.6 + hsh(k, 14) * 1.4); }
  wall('pierre', 2830, 2980, 1, 14, 0.7); for (const pk of [2830, 2905, 2980]) cross('pierre', pk, 1, 5, 30, 0.7); grove('buisson', 2820, 2990, 1, 8, 40, 11, 1.2); // low field walls and scrub on the first headland: nothing taller than the parapet
  for (const pk of [3200, 3440]) { plant('cypres', pk, -1, 8, 1.3); plant('cypres', pk + 5, -1, 11, 1.05); }
  for (let pk = 2810; pk < 3500; pk += 13) { plant('buisson', pk, -1, 2.8 + hsh(pk) * 3, 1 + hsh(pk, 3) * 0.6); plant('buisson', pk + 6, 1, 2.8 + hsh(pk, 5) * 9, 0.9 + hsh(pk, 7) * 0.6); }
};
