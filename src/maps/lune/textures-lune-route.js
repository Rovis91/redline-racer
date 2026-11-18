// Road and tunnel textures of Lunar Outpost (lune). Road: th.roadTex = 'chausseeLune' (same 7 th.road settings as roadwayFine), matt (use th.gloss: 0).
// Tunnel: th.tun.tex = ['tunMurLune', 'tunVouteLune']. Walls: 64 x 64 px, x = from the top of the wall (0) to its foot, y = along the track, 8 m per tile.
(() => {
  const over = extra => (...a) => { const [w, h, d, ...r] = TEXTURES.roadwayFine(...a); return [w, h, (g, o) => { d(g, o); g.globalCompositeOperation = 'source-atop'; extra(g, o, a); if (!a[6]) { g.globalCompositeOperation = 'destination-over'; g.fillStyle = a[0]; g.fillRect(0, 0, w, h); } g.globalCompositeOperation = 'source-over'; }, ...r]; };
  const pts = (g, { R, rand, veil }, n, c, a, x0 = 16, x1 = 110, w = 1, h = 1) => veil(g, a, () => { for (let i = 0; i < n; i++) R(g, c, x0 + rand() * (x1 - x0) | 0, rand() * 512 | 0, w, h); });
  Object.assign(TEXTURES, {
    // graded sintered regolith, 2W x 32 m: very fine dark dust with no cracks or joints, scattered cobbles (2 to 6 px, a lit top-left edge and a black cast shadow at the lower right,
    // never above #7c808c), short unaligned wheel scuffs, a few crater dimples (dark hollow with a lighter lip on the sun side). Matt: nothing glints.
    chausseeLune: over((g, o) => {
      const { R, rand, veil } = o;
      pts(g, o, 3000, '#3a3e48', 0.25);
      veil(g, 0.12, () => { for (let i = 0; i < 70; i++) R(g, '#000', 16 + rand() * 94 | 0, rand() * 512 | 0, 4 + rand() * 10 | 0, 1 + rand() * 2 | 0); });
      for (let i = 0; i < 90; i++) { const x = 16 + rand() * 92 | 0, y = rand() * 510 | 0, s = 2 + (rand() * rand() * 5 | 0); veil(g, 0.9, () => { R(g, '#000', x + 1, y + 1, s, s); R(g, '#5a5e6a', x, y, s, s); R(g, '#7c808c', x, y, s, 1); R(g, '#7c808c', x, y, 1, s); }); }
      for (let i = 0; i < 7; i++) { const x = 20 + rand() * 80 | 0, y = rand() * 496 | 0, r = 4 + rand() * 6 | 0; veil(g, 0.35, () => { R(g, '#000', x, y, r * 2, r); R(g, '#5a5e6a', x, y, r * 2, 1); }); }
    }),
    // pressurised tube wall, ivory composite panels: 2 m x 1 m panels with staggered bolted seams, an orange guidance band (x 24..30), dark gasket at the foot, scuffs and a few dust streaks
    tunMurLune: () => [64, 64, (g, o) => {
      const { R, rand, veil } = o; R(g, '#cfc9b6', 0, 0, 64, 64);
      veil(g, 0.14, () => { for (let i = 0; i < 260; i++) R(g, rand() < 0.7 ? '#000' : '#fff', rand() * 64 | 0, rand() * 64 | 0, 1, 1); });
      veil(g, 0.35, () => { for (let y = 0; y < 64; y += 16) { R(g, '#000', 0, y, 64, 1); R(g, '#000', y & 16 ? 16 : 40, y, 1, 16); } });
      veil(g, 0.5, () => { for (let y = 2; y < 64; y += 16) for (let x = 3; x < 64; x += 8) R(g, '#000', x, y, 1, 1); }); // bolt heads
      R(g, '#d78a40', 24, 0, 6, 64); veil(g, 0.3, () => { R(g, '#000', 24, 0, 6, 1); for (let i = 0; i < 20; i++) R(g, '#000', 24 + rand() * 6 | 0, rand() * 64 | 0, 1, 1); });
      R(g, '#2a2c36', 58, 0, 6, 64);
      veil(g, 0.15, () => { for (let i = 0; i < 8; i++) R(g, '#000', 4 + rand() * 18 | 0, rand() * 64 | 0, 1, 6 + rand() * 14 | 0); });
    }, 8],
    // tube ceiling: ivory panels like the walls, one dark service duct along the crown with a cold lamp channel, panel seams
    tunVouteLune: () => [64, 64, (g, o) => {
      const { R, rand, veil } = o; R(g, '#bdb8a8', 0, 0, 64, 64);
      veil(g, 0.14, () => { for (let i = 0; i < 220; i++) R(g, rand() < 0.7 ? '#000' : '#fff', rand() * 64 | 0, rand() * 64 | 0, 1, 1); });
      veil(g, 0.35, () => { for (let y = 0; y < 64; y += 16) R(g, '#000', 0, y, 64, 1); R(g, '#000', 0, 0, 1, 64); R(g, '#000', 32, 0, 1, 64); });
      R(g, '#3b3e4b', 26, 0, 12, 64); R(g, '#6fabc6', 30, 0, 4, 64); veil(g, 0.4, () => { for (let y = 0; y < 64; y += 16) R(g, '#000', 26, y, 12, 1); });
    }, 8],
  });
})();
