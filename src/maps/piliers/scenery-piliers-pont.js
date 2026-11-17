// "piliers", zone 3: Grand pont panoramique (PK 1710 to 2181, +215 m, 14 m wide; deck PK 1813 to 2063, straight, east 800 to 1050 at north 920). Only the scenery of this zone; the helpers are described in scenery-piliers.js.
// The deck, its girder and its railing are ribbons of scenery-piliers.js.
(window.PILIERS = window.PILIERS || {}).pont = ({ g, at, by, on, beam, needle }) => {
  const { edgePt } = PLACERS, TOWER = [1832, 2044], ANCHOR = [1800, 2076], H = 50, lat = s => s.w + 2.5; // the cables run 2.5 m outside the parapets
  for (const p of ANCHOR) for (const sd of [-1, 1]) by('culeePiliers', p, sd, 4.5); // anchor blocks on the two rock shoulders, same level
  // two towers, a leg each side of the deck, standing on the rock of the cliff under the deck: they count the distance left
  for (const p of TOWER) { const s = at(p); on('pylonePiliers', s, { a: [2 * lat(s), H, s.y - Math.min(...[-1, 1].map(sd => g.hAt(...edgePt(s, sd, lat(s))))) + 3] }); }
  // main cables: from each anchor block up to the tower, then sagging to 4 m above the deck at mid-span; a hanger every 10.6 m
  for (const sd of [-1, 1]) { const P = (p, y) => { const s = at(p), [x, z] = edgePt(s, sd, lat(s)); return [x, s.y + y, z]; }, n = 20, sag = k => 4 + (H - 4) * (2 * k / n - 1) ** 2, p = k => TOWER[0] + (TOWER[1] - TOWER[0]) * k / n;
    beam(P(ANCHOR[0], 7), P(TOWER[0], H + 2.5), 1); beam(P(TOWER[1], H + 2.5), P(ANCHOR[1], 7), 1);
    for (let k = 0; k < n; k++) { beam(P(p(k), sag(k)), P(p(k + 1), sag(k + 1)), 1); if (k) beam(P(p(k), sag(k)), P(p(k), 0), 0.36); } }
  // needles standing in the void under and around the bridge: the depth scale below the road
  needle(880, 1010, 40, 40, 190, 1); needle(960, 840, 35, 45, 175, 2); needle(900, 760, 45, 40, 240, 3); needle(990, 1090, 50, 40, 260, 4);
};
