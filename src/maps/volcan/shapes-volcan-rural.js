// Shapes specific to "volcan", family "racks, cairns and fences": completes the shapes.js catalogue. Metres, origin at the foot, Y up.
// Assemblies (boxes [zone, w, h, d, x, y, z, rotation]); X along the road, front toward -Z (the road). Zones are keys of the map's shared materials (MAT in scenery-volcan.js): greywood, stone, net.
// See docs/proposals/volcanic-island/AMBIANCE-V2.html, zones 1, 2 and 5: tall A-frame fish racks, cairns as track markers, a fence round a farm. No tree, no planting.
(function () {
  const noise = (i, s = 0) => { const v = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return v - Math.floor(v); }; // fixed pseudo-random per index: no call to the shared rnd
  Object.assign(SHAPES, {
    // rack for drying fish, L along the road, ht to the ridge: A-frames every 3.5 m, a ridge pole, three rails a side, rows of fish hanging as pale strips under the rails
    sechoirVolcan: (L = 14, ht = 7) => { const half = ht * 0.42, a = Math.atan(half / ht), sl = Math.hypot(half, ht), n = Math.round(L / 3.5), B = [['greywood', L + 1, 0.22, 0.22, 0, ht, 0]];
      for (let i = 0; i <= n; i++) for (const sd of [-1, 1]) B.push(['greywood', 0.22, sl + 1, 0.22, -L / 2 + i * L / n, ht / 2 - 0.4, sd * half / 2, [sd * a, 0, 0]]);
      for (const sd of [-1, 1]) for (let k = 1; k <= 3; k++) { const y = ht * (0.25 + k * 0.2), z = sd * half * (1 - y / ht); B.push(['greywood', L, 0.14, 0.14, 0, y, z], ['net', L - 1, 0.9, 0.12, 0, y - 0.6, z]); }
      return B; },
    // cairn, ht high: a pile of black stones narrowing upward, each a little turned: the marker of the old track
    cairnVolcan: (ht = 2.4, seed = 0) => Array.from({ length: 5 }, (_, i) => { const w = ht * (0.62 - i * 0.1); return ['stone', w, ht / 5 + 0.05, w * (0.8 + 0.3 * noise(i, seed)), 0.08 * (noise(i, seed + 3) - 0.5), ht / 10 + i * ht / 5, 0, [0, noise(i, seed + 5) * 1.5, 0]]; }),
    // sheep fence, L long: posts every 2.5 m and two rails of grey wood
    clotureVolcan: (L = 30) => [...Array.from({ length: Math.round(L / 2.5) + 1 }, (_, i) => ['greywood', 0.14, 1.9, 0.14, -L / 2 + i * L / Math.round(L / 2.5), 0.35, 0]), ['greywood', L, 0.1, 0.08, 0, 1.1, 0], ['greywood', L, 0.1, 0.08, 0, 0.6, 0]],
  });
})();
