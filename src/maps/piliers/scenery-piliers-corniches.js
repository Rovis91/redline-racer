// "piliers", zone 2: Corniches des deux tours (PK 735 to 1710, +182 to +215 m, 16 m wide). Only the scenery of this zone; the helpers are described in scenery-piliers.js.
// Relief and rock (scenery-piliers.js): the road turns round P2 (rock face on the right, retaining wall and cliff edge 12 m from the left parapet), runs through a 10 m bedded cut, then wraps P3 (face on the left, the ravine notch on the right).
(window.PILIERS = window.PILIERS || {}).corniches = ({ at, pine }) => {
  // rare pines on the open side, off the critical angles: two together, one leaning over the edge
  for (const p of [1040, 1380, 1530]) for (const [da, o, ht] of [[0, 8, 14], [5, 10.5, 10]]) { const s = at(p + da), [x, z] = PLACERS.edgePt(s, 1, s.w + o); pine(x, z, ht); }
};
