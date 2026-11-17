// "egee", zone 4: Balcon (PK 2800 to 3500, 171 to 123 m, 12-14 m wide). Tools (set, plant) are described in scenery-egee.js.
// Sea side: nothing above the parapet; the capes are terrain, below the road and under the horizon line. Island side: the windmill on the high point, high rocks, isolated cypresses.
(window.EGEE = window.EGEE || {}).balcon = ({ MAT, set, plant, hsh }) => {
  // the windmill, 40 m back, 1.5 times its block so that it reads from the lane; its wheel is turned to the car that arrives
  const mill = (shape, o) => set(shape, 2900, -1, 44, { s: 1.5, ...o });
  mill('tourEgee', { a: [4, 3.3, 10, 10, 5], skin: MAT.blanc }); mill('coneEgee', { a: [3.9, 3.6], skin: MAT.chaume, dy: 15 }); mill('ailesEgee', { a: [7], dy: 13.6, ry: -0.8, at: [4.6, 0, 0] });
  [3100, 3360].forEach((pk, i) => set('falaiseEgee', pk, -1, 18.5, { a: [25, 20, 70, i + 7], skin: MAT.roche }));               // island side: high rocks
  [3000, 3280].forEach((pk, i) => set('rocherEgee', pk, 1, 62, { a: [26, 5, 34, i + 11], skin: MAT.cap }));                     // the capes: a low broken crest on each headland
  for (const pk of [3200, 3440]) { plant('cypres', pk, -1, 8, 1.3); plant('cypres', pk + 5, -1, 11, 1.05); }
  for (let pk = 2810; pk < 3500; pk += 13) { plant('buisson', pk, -1, 1.5 + hsh(pk) * 3, 1 + hsh(pk, 3)); plant('buisson', pk + 6, 1, 2 + hsh(pk, 5) * 9, 0.9 + hsh(pk, 7) * 0.6); }
};
