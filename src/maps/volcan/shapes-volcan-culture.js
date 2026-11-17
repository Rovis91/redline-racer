// Shapes specific to "volcan", family "terraces and planting": completes the shapes.js catalogue. Metres, origin at the foot, Y up.
// Assemblies (boxes [zone, w, h, d, x, y, z, rotation]); X along the road, front toward -Z (the road), +Z away from it (uphill on the island side).
// Zones are keys of the map's shared materials (MAT in scenery-volcan.js): stone, leaf, vine, olive, trunk, soil.
// See docs/proposals/volcanic-island/AMBIANCE-V2.html, zones 2 and 5: black dry-stone terraces, green strips, banana groves as dense low blocks. Sparse: never a forest.
(function () {
  const noise = (i, s = 0) => { const v = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return v - Math.floor(v); }; // fixed pseudo-random per index: no call to the shared rnd
  // one banana plant at (x, z), ht high: a thick stem and six broad drooping leaves
  const banana = (x, z, ht, k) => [['trunk', 0.5, ht + 1, 0.5, x, ht / 2 - 0.5, z], ...Array.from({ length: 6 }, (_, i) => { const a = i / 6 * 6.2832 + k; return ['leaf', 2.8, 0.1, 1.1, x + Math.cos(a) * 1.2, ht - 0.2 - (i & 1) * 0.3, z - Math.sin(a) * 1.2, [0, a, -0.45]]; })];
  Object.assign(SHAPES, {
    // terraces up a slope, L along the road, n steps: each a black dry-stone wall ht high, the next one `step` m further from the road and `rise` m higher, with a planted strip on top (crop = vine, leaf, olive; '' = bare)
    terrasseVolcan: (L = 40, n = 3, crop = 'vine', ht = 3, step = 11, rise = 2.2) => Array.from({ length: n }, (_, k) => [['stone', L, ht + 4, 1.2, 0, k * rise + (ht - 4) / 2, k * step], ['soil', L, 0.6, step - 1.2, 0, k * rise + ht - 0.5, k * step + step / 2],
      ...(crop ? Array.from({ length: 3 }, (_, r) => [crop, L - 2, 1.1, 0.9, 0, k * rise + ht + 0.35, k * step + 2.4 + r * 2.8]) : [])]).flat(),
    // cultivated plot, w along the road × d deep: a bed of soil with rows of low crops across it
    jardinVolcan: (w = 14, d = 30, crop = 'leaf') => [['soil', w, 1.4, d, 0, -0.5, 0], ...Array.from({ length: Math.round(d / 2.4) }, (_, i) => [crop, w - 1.2, 0.7, 0.9, 0, 0.5, -d / 2 + 1.4 + i * (d - 2.8) / Math.max(1, Math.round(d / 2.4) - 1)])],
    // banana grove, w along the road × d deep: plants every 3.5 m, 3 to 4.5 m high, a low black wall along the road side
    bananeraieVolcan: (w = 30, d = 40, seed = 0) => { const B = [['stone', w, 2.6, 0.8, 0, 0.3, -d / 2 - 0.4]], nx = Math.round(w / 3.5), nz = Math.round(d / 3.5);
      for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) { const k = i * 31 + j + seed * 97; B.push(...banana(-w / 2 + (i + 0.5) * w / nx + (noise(k, 1) - 0.5), -d / 2 + (j + 0.5) * d / nz + (noise(k, 2) - 0.5), 3 + 1.5 * noise(k, 3), noise(k, 4) * 6)); }
      return B; },
    // palm, ht high: a slightly leaning trunk in four segments, eight drooping fronds
    palmierVolcan: (ht = 9, seed = 0) => { const seg = [], n = 4; let x = 0, y = 0; const inc = 0.1 + 0.2 * noise(seed, 5);
      for (let k = 0; k < n; k++) { const a = inc * (1 - k / n), l = ht / n, cx = x + Math.sin(a) * l / 2, cy = y + Math.cos(a) * l / 2; seg.push(['trunk', 0.42 - k * 0.05, l + 0.15, 0.42 - k * 0.05, cx, cy, 0, [0, 0, -a]]); x += Math.sin(a) * l; y += Math.cos(a) * l; }
      return [...seg, ...Array.from({ length: 8 }, (_, k) => { const b = k / 8 * 6.2832; return ['leaf', 4, 0.1, 1, x + Math.cos(b) * 1.8, y - 0.4 - (k & 1) * 0.3, -Math.sin(b) * 1.8, [0, b, -0.5 - (k % 3) * 0.12]]; })]; },
    // dry shrub, about 2 m: three crossed olive blocks
    arbusteVolcan: (s = 1) => [['olive', 2.4 * s, 1.5 * s, 1.6 * s, 0, 0.6 * s, 0, [0, 0.4, 0]], ['olive', 1.6 * s, 2 * s, 2 * s, 0.3 * s, 0.8 * s, 0.2 * s, [0, 1.2, 0]], ['olive', 1.2 * s, 1 * s, 1.2 * s, -0.8 * s, 0.4 * s, -0.5 * s]],
    // round tree of the hamlets (laurel, fig), ht high: a short trunk and a crown of four faceted masses
    arbreVolcan: (ht = 9) => [['trunk', 0.6, ht * 0.45, 0.6, 0, ht * 0.22, 0], ['olive', ht * 0.6, ht * 0.4, ht * 0.6, 0, ht * 0.62, 0, [0, 0.5, 0]], ['olive', ht * 0.42, ht * 0.34, ht * 0.42, ht * 0.22, ht * 0.78, 0.1 * ht, [0, 1.1, 0]], ['olive', ht * 0.4, ht * 0.3, ht * 0.4, -ht * 0.24, ht * 0.7, -0.12 * ht, [0, 0.2, 0]], ['olive', ht * 0.3, ht * 0.26, ht * 0.3, 0, ht * 0.92, 0, [0, 0.8, 0]]],
  });
})();
