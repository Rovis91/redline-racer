// Shapes specific to "autoroute", family "buildings": completes the shapes.js catalogue. Metres, origin on the ground at the centre of the footprint, X = width, Z = depth, Y up.
// Assemblies (lists of boxes [zone, w, h, d, x, y, z, rotation]); the zones are the names of the map's shared materials (MAT in scenery-autoroute.js):
// brick, stone, glass, tin (the four facades), shop (ground floor), concrete, dark (roofs), rust, ivy, rubble, steel.
// A building is assembled from a small kit of parts, chosen by its size and by v, an integer that varies it (no randomness: the same v gives the same building):
// ground floor, body in one or two tiers, cornice, roof and what stands on it (tank, stair head, plant room, billboard frame), ivy on one or two faces.
// See docs/proposals/sunken-highway/AMBIANCE-V2.html: facades still standing, weathered, ivy climbing from the ground; not total ruin.
(function () {
  const H = (v, k) => { const x = Math.sin(v * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); }; // 0..1, fixed by v and k
  Object.assign(SHAPES, {
    // street building w × ht × d in the facade `wall` ('brick', 'stone', 'glass'): 4.5 m ground floor of shops, then the storeys
    immeubleAutoroute: (w = 30, ht = 40, d = 30, wall = 'brick', v = 0) => { const g = 4.5, two = ht > 44 && H(v, 1) < 0.6, h1 = two ? g + (ht - g) * (0.5 + 0.25 * H(v, 2)) : ht, k = 0.62 + 0.2 * H(v, 3), w2 = w * k, d2 = d * k, top = ht, L = [
        ['shop', w + 0.3, g, d + 0.3, 0, g / 2, 0], [wall, w, h1 - g, d, 0, (h1 + g) / 2, 0], ['concrete', w + 0.9, 0.7, d + 0.9, 0, h1 + 0.35, 0]];
      if (two) L.push([wall, w2, top - h1, d2, 0, (top + h1) / 2, 0], ['concrete', w2 + 0.7, 0.6, d2 + 0.7, 0, top + 0.3, 0], ['dark', w - 1, 0.3, d - 1, 0, h1 + 0.85, 0]);
      const rw = two ? w2 : w, rd = two ? d2 : d, r = H(v, 4); L.push(['dark', rw - 1, 0.3, rd - 1, 0, top + 0.75, 0]);
      if (r < 0.3) L.push(['rust', 3.2, 3.6, 3.2, rw * 0.22, top + 4.4, -rd * 0.2], ['steel', 2.8, 2.6, 2.8, rw * 0.22, top + 1.3, -rd * 0.2]);                 // water tank on its frame
      else if (r < 0.6) L.push(['concrete', rw * 0.3, 3.2, rd * 0.25, -rw * 0.2, top + 2.2, rd * 0.15]);                                                   // stair head
      else if (r < 0.8) L.push(['tin', rw * 0.5, 4, rd * 0.4, 0, top + 2.6, 0], ['steel', 0.3, 9, 0.3, rw * 0.2, top + 9, 0]);                             // plant room and mast
      else L.push(['steel', rw * 0.7, 0.4, 0.4, 0, top + 7, rd * 0.4], ['steel', 0.4, 7, 0.4, -rw * 0.3, top + 3.6, rd * 0.4], ['steel', 0.4, 7, 0.4, rw * 0.3, top + 3.6, rd * 0.4], ['rust', rw * 0.7, 4, 0.3, 0, top + 4.8, rd * 0.4]); // billboard frame
      // ivy climbs from the ground on one face in two, sometimes two faces: a ragged sheet, taller in the middle
      if (wall !== 'glass' && H(v, 5) < 0.6) { const f = H(v, 6) < 0.5 ? 1 : -1, ih = Math.min(h1 - 2, 12 + 26 * H(v, 7)), iw = w * (0.35 + 0.4 * H(v, 8)), x = (H(v, 9) - 0.5) * (w - iw);
        L.push(['ivy', iw, ih, 0.7, x, ih / 2, f * (d / 2 + 0.2)], ['ivy', iw * 0.5, ih * 0.4, 0.7, x + iw * 0.2, ih * 1.15, f * (d / 2 + 0.2)]);
        if (H(v, 10) < 0.5) L.push(['ivy', 0.7, ih * 0.7, d * 0.5, f * (w / 2 + 0.2), ih * 0.35, (H(v, 11) - 0.5) * d * 0.4]); }
      return L; },
    // warehouse w × ht × d, ridge along Z: concrete plinth, steel cladding, gable roof, three loading doors on each long side, a rusted sign band
    entrepotAutoroute: (w = 40, ht = 14, d = 60, v = 0) => { const rise = Math.min(5, w * 0.1), a = Math.atan(rise / (w / 2)), sl = Math.hypot(rise, w / 2), e = ht - rise;
      return [['concrete', w + 0.6, 1.4, d + 0.6, 0, 0.7, 0], ['tin', w, e - 1.4, d, 0, (e + 1.4) / 2, 0], ['tin', w * 0.5, rise, d - 0.2, 0, e + rise / 2, 0],
        ...[-1, 1].map(s => ['dark', sl + 1, 0.4, d + 2, s * w / 4, e + rise / 2, 0, [0, 0, -s * a]]),
        ...[-1, 1].flatMap(s => [-1, 0, 1].map(k => ['dark', 0.4, 5, 6, s * (w / 2 + 0.1), 3.9, k * d * 0.3])), ['rust', w * 0.6, 2, 0.4, 0, e - 2, d / 2 + 0.2],
        ...(H(v, 1) < 0.5 ? [['ivy', w * 0.4, e * 0.7, 0.6, w * 0.2, e * 0.35, -d / 2 - 0.2]] : [])]; },
    // heap of rubble filling w × d, ht high at its crest (no piece larger than 0.7 of its smaller side: a small heap stays inside its footprint): slabs and blocks tilted every way, steeper toward +Z (the building it fell from), bars sticking out
    eboulisAutoroute: (w = 30, ht = 5, d = 12, v = 0) => { const L = [], n = Math.max(6, Math.round(w * d / 22));
      for (let i = 0; i < n; i++) { const u = H(v, i * 3) - 0.5, t = H(v, i * 3 + 1), sz = Math.min(2 + 3.5 * H(v, i * 3 + 2), Math.min(w, d) * 0.7), y = ht * t * t * (1 - 1.6 * u * u);
        L.push([i % 7 ? 'rubble' : 'concrete', sz, 0.5 + sz * 0.45, sz * (0.6 + 0.8 * H(v, i + 50)), u * (w - sz), Math.max(0.2, y * 0.5), (t - 0.5) * (d - sz * 0.5), [(H(v, i + 90) - 0.5) * 1.1, H(v, i + 70) * 3, (H(v, i + 80) - 0.5) * 1.1]]); }
      L.push(['rubble', w * 0.8, ht * 0.5, d * 0.6, 0, ht * 0.25, d * 0.15], ['rubble', w * 0.5, ht * 0.9, d * 0.3, 0, ht * 0.45, d * 0.32]);                  // the core of the heap
      for (let i = 0; i < 4; i++) L.push(['rust', 0.12, 3, 0.12, (H(v, i + 200) - 0.5) * w * 0.7, ht * 0.6, (H(v, i + 210) - 0.3) * d * 0.5, [0.5 - H(v, i + 220), 0, H(v, i + 230) - 0.5]]);
      return L; },
    // a building that has come down across w × d: two broken walls still standing at its back corners (toward +Z), floor slabs hanging between them, and its rubble in front
    ruineAutoroute: (w = 30, ht = 18, d = 14, wall = 'brick', v = 0) => [...SHAPES.eboulisAutoroute(w, ht * 0.4, d, v),
      [wall, w * 0.3, ht, 1, -w * 0.33, ht / 2, d / 2 - 0.5], [wall, 1, ht * 0.7, d * 0.4, -w / 2 + 0.5, ht * 0.35, d * 0.3], [wall, w * 0.22, ht * 0.55, 1, w * 0.36, ht * 0.27, d / 2 - 0.5],
      ['concrete', w * 0.5, 0.5, d * 0.5, 0, ht * 0.45, d * 0.2, [-0.5, 0, 0.12]], ['concrete', w * 0.35, 0.5, d * 0.4, w * 0.15, ht * 0.25, 0, [-0.8, 0.2, -0.1]]],
  });
})();
