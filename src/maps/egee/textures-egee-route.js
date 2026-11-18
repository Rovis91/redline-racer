// Road texture of Aegean Cliffs (egee), for th.roadTex = 'routeEgee' with the same 7 th.road settings as roadway / roadwayFine
// (edges, dashes, kerbs and puddles stay exactly where roadwayFine puts them: it is drawn first, then this map's wear goes on top).
// Everything here draws with the texture's own `rand`, and only over pixels that already exist ('source-atop'), so puddle transparency is kept.
(() => {
  // lays `extra` over roadwayFine; the lane is x 16..110 of the 128 px (2W), 512 px = 32 m (16 px per metre)
  const over = extra => (...a) => { const [w, h, d, ...r] = TEXTURES.roadwayFine(...a); return [w, h, (g, o) => { d(g, o); g.globalCompositeOperation = 'source-atop'; extra(g, o, a); if (!a[6]) { g.globalCompositeOperation = 'destination-over'; g.fillStyle = a[0]; g.fillRect(0, 0, w, h); } g.globalCompositeOperation = 'source-over'; }, ...r]; };
  const pts = (g, { R, rand, veil }, n, c, a, x0 = 16, x1 = 110, w = 1, h = 1) => veil(g, a, () => { for (let i = 0; i < n; i++) R(g, c, x0 + rand() * (x1 - x0) | 0, rand() * 512 | 0, w, h); });
  const crack = (g, { R, rand, veil }, a, x, y, len, c = '#000') => veil(g, a, () => { for (let i = 0; i < len; i++) { if (rand() < 0.35) x += rand() < 0.5 ? -1 : 1; y = (y + 1) % 512; R(g, c, x, y, 1, 1); } });
  Object.assign(TEXTURES, {
    // sun-bleached island tarmac, 8 m x 32 m repeat of a 2W lane: bleached by hard light (fine pale grain), pale quarry dust drifted along both edges,
    // a few darker patched strips with straight edges (old repairs), hairline cracks. Nothing lighter than the grain colour: no white.
    routeEgee: over((g, o) => {
      const { R, rand, veil } = o;
      pts(g, o, 2600, '#bdb4a2', 0.16); // bleached aggregate
      for (const [x0, x1] of [[15, 34], [92, 111]]) pts(g, o, 900, '#cdbf9e', 0.2, x0, x1); // quarry dust at both verges, thinning toward the lane
      veil(g, 0.1, () => { for (let i = 0; i < 4; i++) { const x = 18 + rand() * 60 | 0, y = rand() * 460 | 0, w = 14 + rand() * 30 | 0, h = 10 + rand() * 40 | 0; R(g, '#000', x, y, w, h); R(g, '#d8cdb4', x, y, w, 1); } }); // repaired patches
      crack(g, o, 0.3, 40, 30, 140); crack(g, o, 0.3, 88, 300, 90); crack(g, o, 0.22, 24, 410, 60);
      pts(g, o, 40, '#000', 0.3, 16, 110, 2, 1); // dark oil spots
    }),
  });
})();
