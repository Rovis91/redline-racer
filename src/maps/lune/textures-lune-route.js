// Road and tunnel textures of Lunar Outpost (lune). Road: 'pisteLune', laid by scenery-lune.js on the open road and on the floor of the tunnel (the engine's own roadway is hidden on this map).
// Tunnel: th.tun.tex = ['tunMurLune', 'tunVouteLune']. Walls: 64 x 64 px, x = from the top of the wall (0) to its foot, y = along the track, 8 m per tile.
(() => {
  Object.assign(TEXTURES, {
    // the track of the outpost, 2W x 32 m (3.5 px per metre across, 8 along): regolith sintered into dark plates 4 m long laid in staggered rows, no asphalt and no painted lane. Each plate has its own tone, a dark joint and a lit edge;
    // two pairs of paler bands where rover wheels have tracked dust, with their tread marks; loose dust blown in from both sides; along each edge a pale composite kerb plate with an amber marker every 8 m.
    // It reads against the regolith by value (plates #2b2e37, ground about #7c8292), the kerb draws the edge
    pisteLune: () => [64, 256, (g, o) => { const { R, rand, veil } = o; R(g, '#2b2e37', 0, 0, 64, 256);
      for (let y = 0; y < 256; y += 32) for (let k = -1; k < 4; k++) { const x = 6 + k * 17 + (y & 32 ? 9 : 0), t = rand(); veil(g, 0.07 + 0.1 * t, () => R(g, rand() < 0.55 ? '#000' : '#8a90a0', x, y, 17, 32)); // plates
        veil(g, 0.55, () => { R(g, '#000', x, y, 17, 1); R(g, '#000', x, y, 1, 32); }); veil(g, 0.16, () => { R(g, '#aab0c0', x + 1, y + 1, 16, 1); R(g, '#aab0c0', x + 1, y + 1, 1, 31); }); }
      veil(g, 0.2, () => { for (let i = 0; i < 900; i++) R(g, rand() < 0.6 ? '#000' : '#9aa0b0', rand() * 64 | 0, rand() * 256 | 0, 1, 1); });
      for (const x of [15, 24, 38, 47]) { veil(g, 0.3, () => { for (let y = 0; y < 256; y += 2) R(g, '#7c8292', x + (rand() < 0.15 ? 1 : 0), y, 3, 2); }); veil(g, 0.3, () => { for (let y = 1; y < 256; y += 4) R(g, '#000', x, y, 3, 1); }); } // wheel tracks and their tread
      for (let i = 0; i < 7; i++) { const x = 9 + rand() * 44 | 0, y = rand() * 250 | 0; veil(g, 0.5, () => R(g, '#000', x, y, 3, 2)); veil(g, 0.35, () => R(g, '#aab0c0', x, y - 1, 3, 1)); } // pits left by small impacts
      veil(g, 0.4, () => { for (let y = 0; y < 256; y += 2) { R(g, '#7c8292', 0, y, 7 + (rand() * 5 | 0), 2); const w = 7 + (rand() * 5 | 0); R(g, '#7c8292', 64 - w, y, w, 2); } }); // dust blown in
      for (const x of [3, 58]) { R(g, '#b8b2a2', x, 0, 3, 256); for (let y = 0; y < 256; y += 16) R(g, '#55524a', x, y, 3, 1); for (let y = 28; y < 256; y += 64) R(g, '#d78a40', x, y, 3, 6); } }], // kerb plates, their joints, the amber markers
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
