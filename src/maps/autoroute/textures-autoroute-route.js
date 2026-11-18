// Road and tunnel textures of Sunken Highway (autoroute). Road: th.roadTex = 'routeAutoroute' (same 7 th.road settings as roadwayFine; set dash and edge to faded greys for the motorway ribbon).
// Metro: plain catalogue entries for the scenery's own shapes (the engine tunnel is bare there). Walls: 64 x 64 px, x = from the top of the wall (0) to its foot,
// y = along the track, 8 m per tile. The ballast floor is 64 px = 8 m.
(() => {
  const over = extra => (...a) => { const [w, h, d, ...r] = TEXTURES.roadwayFine(...a); return [w, h, (g, o) => { d(g, o); g.globalCompositeOperation = 'source-atop'; extra(g, o, a); if (!a[6]) { g.globalCompositeOperation = 'destination-over'; g.fillStyle = a[0]; g.fillRect(0, 0, w, h); } g.globalCompositeOperation = 'source-over'; }, ...r]; };
  const pts = (g, { R, rand, veil }, n, c, a, x0 = 16, x1 = 110, w = 1, h = 1) => veil(g, a, () => { for (let i = 0; i < n; i++) R(g, c, x0 + rand() * (x1 - x0) | 0, rand() * 512 | 0, w, h); });
  // a crack that wanders along the road, with tufts of plants growing out of it
  const weedy = (g, { R, rand, veil }, x, y, len, tuft) => { for (let i = 0; i < len; i++) { if (rand() < 0.4) x += rand() < 0.5 ? -1 : 1; y = (y + 1) % 512; veil(g, 0.4, () => R(g, '#000', x, y, 1, 1)); if (rand() < tuft) veil(g, 0.8, () => { R(g, rand() < 0.5 ? '#4f7a34' : '#6a8a3a', x - 1, y, 2 + (rand() * 3 | 0), 1 + (rand() * 3 | 0)); R(g, '#2f4a22', x, y + 1, 1, 1); }); } };
  Object.assign(TEXTURES, {
    // cracked, overgrown city boulevard, 2W x 32 m: patched asphalt (rectangles of a slightly different grey), long cracks with weed tufts, moss and leaf mould piled along both verges,
    // dark water stains where the gutters overflow, paint worn away in random flecks (it keeps only broken marks). No light patches.
    routeAutoroute: over((g, o, a) => {
      const { R, rand, veil } = o;
      pts(g, o, 2000, '#5a5c5c', 0.14);
      veil(g, 0.12, () => { for (let i = 0; i < 6; i++) { const x = 16 + rand() * 60 | 0, y = rand() * 440 | 0, w = 14 + rand() * 40 | 0, h = 14 + rand() * 60 | 0; R(g, i & 1 ? '#000' : '#7a6a58', x, y, w, h); R(g, '#000', x, y, w, 1); R(g, '#000', x, y, 1, h); } });
      veil(g, 0.14, () => { for (let i = 0; i < 5; i++) R(g, '#000', 18 + rand() * 80 | 0, rand() * 480 | 0, 8 + rand() * 24 | 0, 20 + rand() * 40 | 0); }); // stains
      weedy(g, o, 36, 20, 200, 0.06); weedy(g, o, 90, 240, 170, 0.06); weedy(g, o, 60, 380, 90, 0.03);
      for (const [x0, x1] of [[15, 32], [96, 111]]) { pts(g, o, 500, '#3e5a2a', 0.5, x0, x1, 1, 2); pts(g, o, 300, '#4a3c28', 0.45, x0, x1); }
      veil(g, 1, () => { for (let i = 0; i < 700; i++) R(g, a[0], [10, 11, 12, 13, 62, 63, 64, 65, 114, 115, 116, 117][rand() * 12 | 0], rand() * 512 | 0, 1, 1 + rand() * 4 | 0); }); // paint worn off: asphalt colour back over the marks
    }),
    // metro wall: 10 x 20 cm glazed tiles in rows of 4 cm joints (rendered as 2 px tiles), cream above a dark green dado band at 1.2 m, grime and rust streaks, broken tile patches showing concrete, roots and damp at the foot
    tunMurAutoroute: () => [64, 64, (g, o) => {
      const { R, rand, veil } = o; R(g, '#cfd2bc', 0, 0, 64, 64);
      veil(g, 0.2, () => { for (let x = 0; x < 64; x += 4) R(g, '#000', x, 0, 1, 64); for (let y = 0; y < 64; y += 4) R(g, '#000', 0, y, 64, 1); });
      R(g, '#2f5a46', 40, 0, 16, 64); veil(g, 0.2, () => { for (let x = 40; x < 56; x += 4) R(g, '#000', x, 0, 1, 64); for (let y = 0; y < 64; y += 4) R(g, '#000', 40, y, 16, 1); });
      R(g, '#1c2420', 56, 0, 8, 64);
      veil(g, 0.4, () => { for (let i = 0; i < 4; i++) R(g, '#6e6a60', rand() * 36 | 0, rand() * 56 | 0, 4 + rand() * 8 | 0, 4 + rand() * 8 | 0); }); // tiles fallen off
      veil(g, 0.22, () => { for (let i = 0; i < 14; i++) R(g, rand() < 0.5 ? '#000' : '#5a3a1a', rand() * 56 | 0, rand() * 64 | 0, 1 + (rand() * 2 | 0), 6 + rand() * 24 | 0); });
      veil(g, 0.5, () => { for (let i = 0; i < 12; i++) R(g, '#3e5a2a', 44 + rand() * 20 | 0, rand() * 64 | 0, 1, 2 + rand() * 6 | 0); });
    }, 8],
    // metro ceiling: stained concrete with form-board marks, a cable tray, calcite stalactite dots and rust where the rebar shows
    tunVouteAutoroute: () => [64, 64, (g, o) => {
      const { R, rand, veil } = o; R(g, '#6a6c66', 0, 0, 64, 64);
      veil(g, 0.2, () => { for (let i = 0; i < 300; i++) R(g, rand() < 0.7 ? '#000' : '#fff', rand() * 64 | 0, rand() * 64 | 0, 1, 1); });
      veil(g, 0.3, () => { for (const k of [0, 32]) { R(g, '#000', 0, k, 64, 1); R(g, '#000', k, 0, 1, 64); } });
      R(g, '#2a2c2c', 8, 0, 6, 64); veil(g, 0.5, () => { for (let y = 0; y < 64; y += 4) R(g, '#000', 8, y, 6, 1); });
      veil(g, 0.4, () => { for (let i = 0; i < 6; i++) R(g, '#7a3a1a', 18 + rand() * 40 | 0, rand() * 60 | 0, 2 + rand() * 4 | 0, 1); for (let i = 0; i < 10; i++) R(g, '#cfd0c0', rand() * 64 | 0, rand() * 64 | 0, 1, 2); });
    }, 8],
    // metro track bed: dark ballast (coarse 1 to 3 px stones), sleepers every 60 cm across the track (x = across), rusted rails at the third points, puddle stains and weeds between the sleepers
    ballastMetroAutoroute: () => [64, 64, (g, o) => {
      const { R, rand, veil } = o; R(g, '#3a3a38', 0, 0, 64, 64);
      veil(g, 0.5, () => { for (let i = 0; i < 700; i++) R(g, rand() < 0.5 ? '#000' : '#8a8880', rand() * 64 | 0, rand() * 64 | 0, 1 + (rand() * 2 | 0), 1 + (rand() * 2 | 0)); });
      for (let y = 2; y < 64; y += 5) { R(g, '#4a3a2a', 4, y, 56, 2); veil(g, 0.4, () => R(g, '#000', 4, y + 1, 56, 1)); }
      for (const x of [14, 46]) { R(g, '#6a4a30', x, 0, 3, 64); R(g, '#8a6a48', x, 0, 1, 64); }
      veil(g, 0.5, () => { for (let i = 0; i < 25; i++) R(g, '#4f7a34', 6 + rand() * 52 | 0, rand() * 64 | 0, 1, 1 + (rand() * 2 | 0)); });
    }, 8],
  });
})();
