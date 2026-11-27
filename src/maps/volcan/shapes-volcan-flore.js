// Shapes specific to "volcan", family "tufts and loads": completes the shapes.js catalogue. Metres, origin on the ground at the centre, Y up. See scenery-volcan-flore.js and scenery-volcan-approche.js.
// touffeVolcan and buissonVolcan take the zone (the colour: tussock, tuft, scrub) as their last setting; bacheVolcan uses the zones wood, net, dark, steel, orange.
(function () {
  const noise = (i, s = 0) => { const v = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return v - Math.floor(v); }; // fixed pseudo-random per index: no call to the shared rnd
  Object.assign(SHAPES, {
    // tussock of grass, r in radius: six blades leaning out, taller at the centre
    touffeVolcan: (r = 0.5, seed = 0, z = 'tussock') => Array.from({ length: 6 }, (_, i) => { const a = i * 1.047 + noise(i, seed) * 0.8, ht = r * (1.1 + noise(i, seed + 2) * 0.9) * (i ? 1 : 1.4), t = 0.12 + noise(i, seed + 4) * 0.22;
      return [z, r * 0.16, ht, r * 0.16, Math.cos(a) * r * 0.18, ht / 2 - 0.05, Math.sin(a) * r * 0.18, [Math.sin(a) * t, 0, -Math.cos(a) * t]]; }),
    // dwarf birch or willow scrub, r in radius: a knobbly mound of three turned, shrinking blocks
    buissonVolcan: (r = 0.9, seed = 0, z = 'scrub') => [[1, 0.5, 0], [0.72, 0.85, 0.7], [0.45, 1.1, 1.4]].map(([k, y, a], i) => [z, r * 2 * k, r * 0.55, r * 2 * k * (0.8 + noise(i, seed) * 0.3), noise(i, seed + 1) * r * 0.2, r * 0.3 * y, noise(i, seed + 3) * r * 0.2, [0, a + noise(i, seed + 5), 0]]),
    // crates under a net, n high-ish stacks: wooden crates, a net thrown over them and lashed with rope, one steel case beside
    bacheVolcan: (n = 3, seed = 0) => [...Array.from({ length: n }, (_, i) => [['wood', 1.1, 0.9, 1.1, i * 1.25, 0.45, noise(i, seed) * 0.2], i % 2 ? ['wood', 1.1, 0.9, 1.1, i * 1.25 + 0.1, 1.35, 0] : ['orange', 1.1, 0.5, 1, i * 1.25, 1.15, 0]]).flat(),
      ['net', n * 1.25 + 0.2, 0.2, 1.7, (n - 1) * 0.625, 1.7, 0.05, [0, 0, 0.12]], ['net', n * 1.25 + 0.2, 1.7, 0.1, (n - 1) * 0.625, 1.0, -0.78, [0.1, 0, 0]], ['net', n * 1.25 + 0.2, 1.7, 0.1, (n - 1) * 0.625, 1.0, 0.88, [-0.1, 0, 0]], ['dark', 0.05, 1.8, 0.05, n * 0.65 + 0.3, 0.9, -0.85], ['steel', 0.9, 0.5, 0.5, n * 1.25 + 0.9, 0.25, 0.3]],
  });
})();
