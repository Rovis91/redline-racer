// "egee", zone 4: Balcon (PK 2800 to 3500, 171 to 123 m, 12-14 m wide). Tools (set, plant) are described in scenery-egee.js.
// Sea side: nothing above the parapet; the capes are terrain, below the road and under the horizon line. Island side: the windmill on the high point, high rocks, isolated cypresses.
(window.EGEE = window.EGEE || {}).balcon = ({ MAT, set, wall, plant, grove, hsh }) => {
  // the windmill, 40 m back, 1.5 times its block so that it reads from the lane; its wheel is turned to the car that arrives
  const mill = (shape, o) => set(shape, 2900, -1, 44, { s: 1.5, ...o });
  mill('tourEgee', { a: [4, 3.3, 10, 10, 5], skin: MAT.blanc }); mill('coneEgee', { a: [3.9, 3.6], skin: MAT.chaume, dy: 15 }); mill('ailesEgee', { a: [7], dy: 13.6, ry: -0.8, at: [4.6, 0, 0] });
  [3100, 3360].forEach((pk, i) => set('falaiseEgee', pk, -1, 18.5, { a: [25, 20, 70, i + 7], skin: MAT.roche }));               // island side: high rocks
  [3000, 3280].forEach((pk, i) => set('rocherEgee', pk, 1, 62, { a: [26, 5, 34, i + 11], skin: MAT.cap }));                     // the capes: a low broken crest on each headland
  for (let pk = 2990, k = 0; pk < 3490; pk += 37, k++) set('rocherEgee', pk, -1, 11 + hsh(k, 4) * 14, { a: [6 + hsh(k) * 8, 3 + hsh(k, 1) * 5, 7 + hsh(k, 2) * 8, k], skin: MAT.roche }); // broken rock on the plateau edge
  wall('pierre', 2836, 2990, -1, 5, 1.1);                                                                                         // an old field wall up to the mill
  grove('buisson', 2960, 3500, -1, 12, 80, 17, 1.7);
  for (const pk of [3200, 3440]) { plant('cypres', pk, -1, 8, 1.3); plant('cypres', pk + 5, -1, 11, 1.05); }
  for (let pk = 2810; pk < 3500; pk += 13) { plant('buisson', pk, -1, 2.8 + hsh(pk) * 3, 1 + hsh(pk, 3) * 0.6); plant('buisson', pk + 6, 1, 2.8 + hsh(pk, 5) * 9, 0.9 + hsh(pk, 7) * 0.6); }
};
