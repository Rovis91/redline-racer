// "piliers", zone 4: Hauts plateaux (PK 2181 to 2826, +215 to +225 to +215 m, 14 m wide; tunnel PK 2401 to 2481, straight, east 1230). Only the scenery of this zone; the helpers are described in scenery-piliers.js.
// Relief and rock (scenery-piliers.js): tower P4 and its spur at +300, 75 m above the road, which the tunnel goes through; after the tunnel the retaining wall and the cliff edge come 12 m from the left parapet.
(window.PILIERS = window.PILIERS || {}).plateaux = ({ h, g, S, T, at, by, on, set, pine, MAT, kit }) => {
  const { edgePt } = PLACERS;
  // the viewing platform with its small pavilion, set back on the left, never on the axis
  by('belvederePiliers', 2250, -1, 18); { const s = at(2250), [x, z] = edgePt(s, -1, s.w + 18), y = g.hAt(x, z) + 1, ry = h.across(s); set('pavillonPiliers', x, -z, { ry, y }); set('toitPiliers', x, -z, { ry, y: y + 4.6, skin: MAT.tile }); }
  // the basin on the inside; its stream runs to the edge of the plateau and falls into the ravine. It never crosses the road
  by('bassinPiliers', 2290, 1, 16);
  { const s = at(2330); let o = 20; while (o < 90 && g.hAt(...edgePt(s, 1, s.w + o)) > s.y - 6) o += 2; // o: where the plateau ends
    const [bx, bz] = edgePt(at(2290), 1, at(2290).w + 16), [ex, ez] = edgePt(s, 1, s.w + o + 1), y = g.hAt(bx, bz) - 0.9;
    const water = (a, b, w, m) => { const l = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), q = h.pose('boxMesh', m, kit, a.map((v, i) => (v + b[i]) / 2), w, 1.2, l); q.lookAt(...b); };
    water([bx, y, bz], [ex, y - 0.3, ez], 3, MAT.water); water([ex, s.y - 1, ez], [ex, 76, ez + 0.01], 5, MAT.fall); }
  // dressed stone portals at the two mouths of the tunnel; the rock of the spur closes over them
  for (const [i, turn] of [[T.t0 - 4, 0], [T.t1 + 4, Math.PI]]) on('portailPiliers', S[i], { ry: h.across(S[i]) + turn, a: [2 * S[i].w + 0.6, 8.4, 12.2, 16] }); // a vestibule 16 m deep in front of each mouth, standing 3 m proud of the rock
  for (const p of [2560, 2700]) for (const [da, o, ht] of [[0, 8, 14], [5, 10.5, 10]]) { const s = at(p + da), [x, z] = edgePt(s, 1, s.w + o); pine(x, z, ht); } // isolated pines at the edge, none at the portal
};
