// "volcan", zone 5b: Les Galeries, the working dress of the two galleries through the caldera wall (PK 4040 to 4240 and 4480 to 4680): a mine drift of the expedition, not a clean road tunnel.
// Rock bolts and shotcrete patches are in the wall textures (textures-volcan-route.js). Here: steel and timber arches every 20 m, two cable trays and a ventilation duct on brackets, work lights on a cable,
// numbered section signs, crates and instrument cases stacked against the right wall (flush with it), puddles. The physics walls are at ±s.w: nothing stands inside them but flat puddles and the 0.25 m of the cases.
// by(), span(), slab() are described in scenery-volcan.js; section: walls 5.5 m high, vault 2.5 m, as in scenery-volcan-cratere.js.
(window.VOLCAN = window.VOLCAN || {}).galerie = ({ h, at, by, set, slab, span, gal, beside, range, frac, MAT }) => {
  const T = h.THREE, LAPM = 6578, pkOf = i => i / h.N * LAPM;
  const P = (pk, o, y) => { const s = at(pk), [x, z] = beside(pk, 1, o - s.w); return [x, s.y + y, z]; };                                   // plan and altitude of the point o m right of the axis, y m over the roadway
  const sign = (pk, label) => { const s = at(pk), f = 0.35, nx = s.tz * Math.cos(f) - s.tx * Math.sin(f), nz = -s.tx * Math.cos(f) - s.tz * Math.sin(f), [x, y, z] = P(pk, s.w - 0.5, 2.6);
    const m = new T.Mesh(new T.PlaneGeometry(2, 0.5), h.mat('written', { emis: 0.8, side: T.DoubleSide }, 256, 64, '#1d4f8c', '#f2eee4', label, 42)); m.position.set(x, y, z); m.rotation.y = Math.atan2(nx, nz); h.scene.add(m); };
  gal.forEach(([a, b], k) => {
    const p0 = pkOf(a) + 14, p1 = pkOf(b) - 14, w = at(p0).w, wi = w - 0.18;
    // arches: posts to the springing, then the vault in nine chords; steel and timber in turn
    range(p0 + 6, p1, 20).forEach((pk, n) => { const m = n % 2 ? 'wood' : 'steel', t = n % 2 ? 0.42 : 0.3, ring = Array.from({ length: 10 }, (_, j) => P(pk, -wi * Math.cos(Math.PI * j / 9), 5.5 + 2.3 * Math.sin(Math.PI * j / 9)));
      for (let j = 1; j < ring.length; j++) span(m, ring[j - 1], ring[j], t, t); for (const sd of [-1, 1]) span(m, P(pk, sd * wi, 0), P(pk, sd * wi, 5.5), t, t); });
    // the left wall: two cable trays with their cables, brackets every 10 m; the right: the ventilation duct hung from the vault on straps; work lights on their own cable
    range(p0, p1, 10).forEach(pk => { const q = pk + 10 > p1 ? p1 : pk + 10;
      for (const [y, c] of [[3.9, 0.3], [3.3, 0.22]]) { span('steel', P(pk, -(w - 0.35), y), P(q, -(w - 0.35), y), 0.5, 0.06); span('dark', P(pk, -(w - 0.35), y + 0.08), P(q, -(w - 0.35), y + 0.08), c, 0.1); span('steel', P(pk, -w, y - 0.03), P(pk, -(w - 0.5), y - 0.03), 0.1, 0.05); }
      span('orange', P(pk, w - 1.5, 6.4), P(q, w - 1.5, 6.4), 0.8, 0.8); span('steel', P(pk + 5, w - 1.5, 6.8), P(pk + 5, w - 1.5, 7.2), 0.12, 0.12);
      span('dark', P(pk, -(w - 2.3), 6.7), P(q, -(w - 2.3), 6.7), 0.04); });
    range(p0 + 4, p1, 12).forEach(pk => slab('lamp', pk, 0.9, 0.22, 0.4, 6.35, -(w - 2.3)));
    // numbered sections, one every 50 m; crates under nets, drums and cases against the right wall, in three bays
    range(p0 + 20, p1, 50).forEach((pk, n) => sign(pk, 'SECTION ' + String(k * 4 + n + 1).padStart(2, '0')));
    [[p0 + 40, 2], [p0 + 95, 3], [p1 - 38, 2]].forEach(([pk, c], n) => { by('bacheVolcan', pk, 1, 0.3, { road: true, turn: Math.PI, a: [c, n + k * 3] }); by('futsVolcan', pk + 7, 1, 0.5, { road: true, a: [4], seed: n + 1 }); by('caissesVolcan', pk - 5, 1, 0.5, { road: true, a: [5], seed: n + 2 }); });
    // puddles in the ruts, where the seepage collects
    [[p0 + 30, -2.2, 1.7], [p0 + 78, 2.6, 2.1], [p0 + 120, -3.1, 1.5], [p1 - 20, 1.8, 1.9]].forEach(([pk, o, r], n) => { if (pk < p1 - 6) { const [x, y, z] = P(pk, o, 0.045); set('dalleVolcan', x, z, { y, m: 'puddle', a: [r, 0.02, n + 5 * k, 8] }); } });
  });
};
