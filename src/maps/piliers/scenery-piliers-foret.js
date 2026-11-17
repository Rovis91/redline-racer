// "piliers", zone 1: Forêt rocheuse basse (PK 0 to 735, +150 to +182 m, 16 m wide at the start then 14). Only the scenery of this zone; the helpers (wood, tree, by…) are described in scenery-piliers.js.
// Relief and rock (scenery-piliers.js): towers P1 and P2 rooted in the shoulder, an 8 m bedded bank on the inside, the cliff edge 14 m from the wall at the end of the zone.
(window.PILIERS = window.PILIERS || {}).foret = ({ at, by, wood, tree, nz, MAT }) => {
  // forest: a wood on the outside of each bend so the next tangent stays open; undergrowth lower, on the inside
  for (const p of [60, 160, 260, 360, 460, 560]) { const out = at(p).k > 0 ? -1 : 1; wood(p, out, 14, 50, 70, 1); wood(p + 50, -out, 5, 20, 50, 0); }
  // slalom: big trunks right behind the parapet, one side then the other every 35 m, their crowns over the road
  for (let p = 40, k = 0; p < 690; p += 35, k++) { const s = at(p), [x, z] = PLACERS.edgePt(s, k % 2 ? 1 : -1, s.w + 3); tree(x, z, 22, 1.15); }
  // faceted boulders fallen at the foot of the inner bank
  for (const p of [210, 410, 610]) for (let j = 0; j < 4; j++) by('rocherPiliers', p + (j - 1.5) * 6, 1, 5 + 4 * nz(p, j), { a: [5 + 4 * nz(j, p), 3 + 3 * nz(p + j), 5 + 4 * nz(j, p + 1), p + j], skin: MAT.rock });
  by('bornePiliers', 150, -1, 2.4); by('bornePiliers', 520, 1, 2.4); // old track markers at the changes of rhythm
};
