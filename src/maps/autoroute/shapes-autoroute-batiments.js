// Shapes specific to "autoroute", family "buildings": completes the shapes.js catalogue. Metres, origin on the ground at the centre of the footprint, X = width, Z = depth, Y up.
// Assemblies (lists of boxes [zone, w, h, d, x, y, z, rotation]); the zones are the names of the map's shared materials (MAT in scenery-autoroute.js):
// the facade given as `wall` (brick, brick2, brick3, stone, stone2, stone3, glass, glass2, tin, tin2), shop and shop2 (ground floor), hole (the dark inside of a gutted building),
// concrete, dark (roofs), rust, ivy, rubble, steel.
// A building is assembled from a small kit of parts, chosen by its size and by v, an integer that varies it (no randomness: the same v gives the same building), then damaged by dmg (0 to 1):
// under 0.25 it stands whole under its ivy; from 0.25 its facades are gutted (holes with a floor slab hanging and rubble at their foot); from 0.45 its top storeys are gone (wall stubs round an open floor);
// from 0.6 it has lost half its height; from 0.87 it has come down. No two buildings of the map are the same: v, dmg and the facade drawing all differ.
// See docs/proposals/sunken-highway/AMBIANCE-V2.html and the author's references: gutted buildings, fallen storeys, vegetation taking everything back; not a tidy disused estate.
(function () {
  const H = (v, k) => { const x = Math.sin(v * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); }; // 0..1, fixed by v and k
  Object.assign(SHAPES, {
    // street building w × ht × d in the facade `wall`: 4.5 m ground floor of shops, then the storeys
    immeubleAutoroute: (w = 30, ht = 40, d = 30, wall = 'brick', v = 0, dmg = 0) => { if (dmg > 0.87) return SHAPES.ruineAutoroute(w, Math.min(26, ht * 0.5), d, wall, v);
      if (dmg > 0.6) ht = Math.max(12, ht * (0.4 + 0.4 * H(v, 31)));
      const g = 4.5, two = ht > 44 && H(v, 1) < 0.6 && dmg <= 0.6, h1 = two ? g + (ht - g) * (0.5 + 0.25 * H(v, 2)) : ht, k = 0.62 + 0.2 * H(v, 3), w2 = w * k, d2 = d * k, top = ht, L = [
        [v & 1 ? 'shop2' : 'shop', w + 0.3, g, d + 0.3, 0, g / 2, 0], [wall, w, h1 - g, d, 0, (h1 + g) / 2, 0], ['concrete', w + 0.9, 0.7, d + 0.9, 0, h1 + 0.35, 0]];
      if (two) L.push([wall, w2, top - h1, d2, 0, (top + h1) / 2, 0], ['dark', w - 1, 0.3, d - 1, 0, h1 + 0.85, 0]);
      const rw = two ? w2 : w, rd = two ? d2 : d, r = H(v, 4);
      if (dmg > 0.45) { // broken crown: stubs of wall of uneven height round the edge, the floor below open to the sky, a slab fallen across it
        L.push(['hole', rw - 1.6, 0.3, rd - 1.6, 0, top + 0.15, 0], ['concrete', rw * 0.45, 0.5, rd * 0.4, (H(v, 32) - 0.5) * rw * 0.3, top + 1.6, (H(v, 33) - 0.5) * rd * 0.3, [0.35, H(v, 34) * 3, 0.2]]);
        for (let i = 0, n = 6 + Math.floor(H(v, 35) * 5); i < n; i++) { const s = i % 4, sg = s & 1 ? 1 : -1, len = 3 + H(v, 40 + i) * 0.3 * (s < 2 ? rw : rd), hg = 1.5 + 8 * H(v, 60 + i) * H(v, 80 + i);
          L.push(s < 2 ? [wall, len, hg, 0.8, (H(v, 100 + i) - 0.5) * (rw - len), top + hg / 2, sg * (rd / 2 - 0.4)] : [wall, 0.8, hg, len, sg * (rw / 2 - 0.4), top + hg / 2, (H(v, 100 + i) - 0.5) * (rd - len)]); } }
      else { L.push(['concrete', rw + 0.7, 0.6, rd + 0.7, 0, top + 0.3, 0], ['dark', rw - 1, 0.3, rd - 1, 0, top + 0.75, 0]);
        if (r < 0.3) L.push(['rust', 3.2, 3.6, 3.2, rw * 0.22, top + 4.4, -rd * 0.2], ['steel', 2.8, 2.6, 2.8, rw * 0.22, top + 1.3, -rd * 0.2]);                 // water tank on its frame
        else if (r < 0.6) L.push(['concrete', rw * 0.3, 3.2, rd * 0.25, -rw * 0.2, top + 2.2, rd * 0.15]);                                                   // stair head
        else if (r < 0.8) L.push(['tin', rw * 0.5, 4, rd * 0.4, 0, top + 2.6, 0], ['steel', 0.3, 9, 0.3, rw * 0.2, top + 9, 0]);                             // plant room and mast
        else L.push(['steel', rw * 0.7, 0.4, 0.4, 0, top + 7, rd * 0.4], ['steel', 0.4, 7, 0.4, -rw * 0.3, top + 3.6, rd * 0.4], ['steel', 0.4, 7, 0.4, rw * 0.3, top + 3.6, rd * 0.4], ['rust', rw * 0.7, 4, 0.3, 0, top + 4.8, rd * 0.4]); } // billboard frame
      // gutted facades: one to three holes, each on a face of the lower tier: the dark inside, the floor slab hanging out of it, its rubble on the pavement
      for (let j = 0, n = dmg > 0.25 ? 1 + Math.floor(H(v, 36) * 3) : 0; j < n; j++) { const s = Math.floor(H(v, 37 + j) * 4), sg = s & 1 ? 1 : -1, W = s < 2 ? w : d, D = s < 2 ? d : w, hw = Math.min(W * 0.6, 6 + 10 * H(v, 120 + j)), hh = Math.min((h1 - g) * 0.7, 6 + 12 * H(v, 130 + j));
        if (hh < 3) continue; const y = g + 1 + H(v, 140 + j) * (h1 - g - hh - 2) + hh / 2, p = (H(v, 150 + j) - 0.5) * (W - hw), at = (zone, a, b, c, u, yy, o, rot) => s < 2 ? [zone, a, b, c, u, yy, sg * (D / 2 + o), rot && [sg * rot, 0, 0]] : [zone, c, b, a, sg * (D / 2 + o), yy, u, rot && [0, 0, -sg * rot]];
        L.push(at('hole', hw, hh, 0.5, p, y, 0.15), at('concrete', hw * 0.7, 0.4, 3.2, p, y - hh / 2 + 0.3, 1.3, 0.5), at('rubble', hw * 0.8, 2.2, 3.4, p, 1.1, 1.8), at('rubble', hw * 0.4, 1.6, 2.4, p + 1.5, 2.5, 1.4, 0.3)); }
      // ivy climbs from the ground on three faces in four, often two: a ragged sheet, taller in the middle (not on a curtain wall)
      if (!/glass/.test(wall) && H(v, 5) < 0.75) { const f = H(v, 6) < 0.5 ? 1 : -1, ih = Math.min(h1 - 2, 12 + 30 * H(v, 7)), iw = w * (0.35 + 0.5 * H(v, 8)), x = (H(v, 9) - 0.5) * (w - iw);
        L.push(['ivy', iw, ih, 0.7, x, ih / 2, f * (d / 2 + 0.2)], ['ivy', iw * 0.5, ih * 0.4, 0.7, x + iw * 0.2, ih * 1.15, f * (d / 2 + 0.2)]);
        if (H(v, 10) < 0.65) L.push(['ivy', 0.7, ih * 0.7, d * 0.6, (H(v, 12) < 0.5 ? 1 : -1) * (w / 2 + 0.2), ih * 0.35, (H(v, 11) - 0.5) * d * 0.4]); }
      return L; },
    // warehouse w × ht × d in the cladding `wall`, ridge along Z: concrete plinth, steel cladding, gable roof, three loading doors on each long side, a rusted sign band.
    // From dmg 0.5 one roof slope has caved in (the inside dark, sheets hanging); from 0.8 a gable has gone and its rubble lies in front
    entrepotAutoroute: (w = 40, ht = 14, d = 60, wall = 'tin', v = 0, dmg = 0) => { const rise = Math.min(5, w * 0.1), a = Math.atan(rise / (w / 2)), sl = Math.hypot(rise, w / 2), e = ht - rise, gone = dmg > 0.5 ? (H(v, 2) < 0.5 ? 1 : -1) : 0;
      return [['concrete', w + 0.6, 1.4, d + 0.6, 0, 0.7, 0], [wall, w, e - 1.4, d, 0, (e + 1.4) / 2, 0], ...(dmg > 0.8 ? [] : [[wall, w * 0.5, rise, d - 0.2, 0, e + rise / 2, 0]]),
        ...[-1, 1].filter(s => s !== gone).map(s => ['dark', sl + 1, 0.4, d + 2, s * w / 4, e + rise / 2, 0, [0, 0, -s * a]]),
        ...(gone ? [['hole', w / 2 - 1, 0.3, d - 2, gone * w / 4, e + 0.2, 0], ['rust', w * 0.3, 0.2, d * 0.4, gone * w * 0.3, e - 1, d * 0.1, [0.2, 0.3, gone * 0.9]], ['rust', w * 0.25, 0.2, d * 0.3, gone * w * 0.2, e + 0.5, -d * 0.25, [-0.3, 0.1, gone * 0.5]]] : []),
        ...(dmg > 0.8 ? [['hole', w * 0.7, e * 0.8, 0.5, 0, e * 0.45, d / 2 + 0.15], ['rubble', w * 0.7, 2.4, 3.6, 0, 1.2, d / 2 + 1.9], ['rust', w * 0.4, 0.2, 5, w * 0.1, 2.6, d / 2 + 2, [0.9, 0.2, 0]]] : []),
        ...[-1, 1].flatMap(s => [-1, 0, 1].map(k => ['dark', 0.4, 5, 6, s * (w / 2 + 0.1), 3.9, k * d * 0.3])), ['rust', w * 0.6, 2, 0.4, 0, e - 2, d / 2 + 0.2],
        ...(H(v, 1) < 0.7 ? [['ivy', w * 0.5, e * 0.8, 0.6, w * 0.2, e * 0.4, -d / 2 - 0.2], ['ivy', 0.6, e * 0.6, d * 0.3, -w / 2 - 0.2, e * 0.3, d * 0.2]] : [])]; },
    // heap of rubble filling w × d, ht high at its crest (no piece larger than 0.7 of its smaller side: a small heap stays inside its footprint):
    // slabs and blocks tilted every way, steeper toward +Z (the building it fell from), bars sticking out
    eboulisAutoroute: (w = 30, ht = 5, d = 12, v = 0) => { const L = [], n = Math.max(6, Math.round(w * d / 22));
      for (let i = 0; i < n; i++) { const u = H(v, i * 3) - 0.5, t = H(v, i * 3 + 1), sz = Math.min(2 + 3.5 * H(v, i * 3 + 2), Math.min(w, d) * 0.7), y = ht * t * t * (1 - 1.6 * u * u);
        L.push([i % 7 ? 'rubble' : 'concrete', sz, 0.5 + sz * 0.45, sz * (0.6 + 0.8 * H(v, i + 50)), u * (w - sz), Math.max(0.2, y * 0.5), (t - 0.5) * (d - sz * 0.5), [(H(v, i + 90) - 0.5) * 1.1, H(v, i + 70) * 3, (H(v, i + 80) - 0.5) * 1.1]]); }
      L.push(['rubble', w * 0.8, ht * 0.5, d * 0.6, 0, ht * 0.25, d * 0.15], ['rubble', w * 0.5, ht * 0.9, d * 0.3, 0, ht * 0.45, d * 0.32]);                  // the core of the heap
      for (let i = 0; i < 4; i++) L.push(['rust', 0.12, 3, 0.12, (H(v, i + 200) - 0.5) * w * 0.7, ht * 0.6, (H(v, i + 210) - 0.3) * d * 0.5, [0.5 - H(v, i + 220), 0, H(v, i + 230) - 0.5]]);
      return L; },
    // a building that has come down across w × d: two broken walls still standing at its back corners (toward +Z), floor slabs hanging between them, and its rubble in front
    ruineAutoroute: (w = 30, ht = 18, d = 14, wall = 'brick', v = 0) => [...SHAPES.eboulisAutoroute(w, ht * 0.4, d, v),
      [wall, w * 0.3, ht, 1, -w * 0.33, ht / 2, d / 2 - 0.5], [wall, 1, ht * 0.7, d * 0.4, -w / 2 + 0.5, ht * 0.35, d * 0.3], [wall, w * 0.22, ht * 0.55, 1, w * 0.36, ht * 0.27, d / 2 - 0.5],
      ['concrete', w * 0.5, 0.5, d * 0.5, 0, ht * 0.45, d * 0.2, [-0.5, 0, 0.12]], ['concrete', w * 0.35, 0.5, d * 0.4, w * 0.15, ht * 0.25, 0, [-0.8, 0.2, -0.1]], ['ivy', w * 0.28, ht * 0.6, 0.7, -w * 0.33, ht * 0.3, d / 2 - 1.2]],
  });
})();
