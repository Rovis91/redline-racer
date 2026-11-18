// Textures specific to "area51": completes the textures.js catalogue (same conventions: 8 px per metre, a base tone, grain, joints, wear; `rand` only). See docs/ASSET-GENERATION.md.
// These are the shared materials of the map (docs/proposals/area51/AMBIANCE-V2.html): each one is used by several asset families, so each tint is one draw pass for the whole map.
(() => {
  const grain = (g, { R, rand, veil }, n, a = 0.18) => veil(g, a, () => { for (let i = 0; i < n; i++) R(g, i % 3 ? '#000' : '#fff', rand() * 64 | 0, rand() * 64 | 0, 1 + (rand() * 2 | 0), 1); });
  Object.assign(TEXTURES, {
    // desert fan: ochre gravel, 8 m per tile; darker pebbles, a few pale wind-blown patches, no direction
    solArea51: () => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, '#c98f68', 0, 0, 64, 64); grain(g, o, 420, 0.16);
      veil(g, 0.1, () => { for (let i = 0; i < 9; i++) R(g, i & 1 ? '#fff' : '#5a2a10', rand() * 52 | 0, rand() * 52 | 0, 6 + rand() * 12 | 0, 4 + rand() * 8 | 0); });
      veil(g, 0.35, () => { for (let i = 0; i < 26; i++) R(g, '#6e4630', rand() * 63 | 0, rand() * 63 | 0, 2, 1); }); }, 8],
    // dry lake bed: pale clay cracked in uneven cells of 1 to 2 m, 8 m per tile
    playaArea51: () => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, '#e2d2b0', 0, 0, 64, 64); grain(g, o, 200, 0.1);
      veil(g, 0.32, () => { for (let y = 0; y < 64; y += 8 + (rand() * 7 | 0)) for (let x = 0; x < 64;) { const w = 7 + (rand() * 9 | 0), j = rand() * 3 | 0; R(g, '#8a7458', x, y + j, w, 1); R(g, '#8a7458', x, y + j, 1, 9 + (rand() * 6 | 0)); x += w; } }); }, 8],
    // rock of the basin, c = its tint (red ochre near, violet for the far range), a = strength of the strata (1 near; 0.4 for the far range, a silhouette): uneven horizontal strata, vertical cracks, 8 m per tile
    rocheArea51: (c, a = 1) => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, c, 0, 0, 64, 64);
      veil(g, 0.2 * a, () => { for (let y = 0; y < 64;) { const ht = 2 + (rand() * 7 | 0); R(g, rand() < 0.5 ? '#000' : '#fff', 0, y, 64, ht); y += ht + (rand() * 5 | 0); } });
      veil(g, 0.35 * a, () => { for (let y = 0; y < 64; y += 5 + (rand() * 8 | 0)) R(g, '#000', 0, y, 64, 1); for (let i = 0; i < 9; i++) R(g, '#000', rand() * 64 | 0, rand() * 50 | 0, 1, 4 + rand() * 12 | 0); });
      grain(g, o, 260); }, 8],
    // corrugated steel cladding, c = paint, a = strength of sheets and joints (1 on walls, 0.5 on roofs seen from far): faint ribs every 50 cm (kept weak: strong ribs would strobe along the hall), 2 m sheets of uneven tone, a joint line every 4 m, rust runs; 8 m per tile
    toleArea51: (c, a = 1) => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, c, 0, 0, 64, 64);
      veil(g, 0.1 * a, () => { for (let x = 0; x < 64; x += 16) R(g, rand() < 0.5 ? '#000' : '#fff', x, 0, 16, 64); });
      veil(g, 0.09, () => { for (let x = 0; x < 64; x += 4) { R(g, '#000', x, 0, 1, 64); R(g, '#fff', x + 2, 0, 1, 64); } });
      veil(g, 0.3 * a, () => { R(g, '#000', 0, 0, 64, 1); R(g, '#000', 0, 32, 64, 1); for (let x = 0; x < 64; x += 16) R(g, '#000', x, 0, 1, 64); });
      veil(g, 0.28, () => { for (let i = 0; i < 9; i++) R(g, '#5a2a10', rand() * 64 | 0, (rand() < 0.5 ? 1 : 33) + (rand() * 4 | 0), 1 + (rand() * 2 | 0), 5 + rand() * 16 | 0); });
      grain(g, o, 120, 0.12); }, 8],
    // apron and taxiway surface: concrete slabs 8 m square, lighter than the roadway so the race lane stands apart; sealed joints, tyre and oil stains
    tarmacArea51: () => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, '#4c525a', 0, 0, 64, 64); grain(g, o, 380, 0.14);
      veil(g, 0.14, () => { for (let i = 0; i < 6; i++) R(g, '#000', rand() * 50 | 0, rand() * 50 | 0, 6 + rand() * 10 | 0, 4 + rand() * 8 | 0); });
      veil(g, 0.5, () => { R(g, '#14181c', 0, 0, 64, 1); R(g, '#14181c', 0, 0, 1, 64); }); }, 8],
    // worn yellow taxiway paint, 2 m per tile
    jauneArea51: () => [16, 16, (g, o) => { const { R, rand, veil } = o; R(g, '#e2b838', 0, 0, 16, 16); veil(g, 0.4, () => { for (let i = 0; i < 14; i++) R(g, '#4c525a', rand() * 16 | 0, rand() * 16 | 0, 1 + (rand() * 2 | 0), 1); }); }, 2],
    // hazard band, yellow and black at 45°, 4 m per tile
    dangerArea51: () => [32, 32, (g, o) => { const { R, rand, veil } = o; R(g, '#e8c040', 0, 0, 32, 32); for (let k = -32; k < 32; k += 16) for (let i = 0; i < 32; i++) R(g, '#16181c', k + i, i, 8, 1); veil(g, 0.25, () => { for (let i = 0; i < 20; i++) R(g, '#000', rand() * 32 | 0, rand() * 32 | 0, 2, 1); }); }, 4],
    cherenkovArea51: 0x4fb8ff, // the blue light of the reactor pool (emits)
    // worn white runway paint, 2 m per tile
    blancArea51: () => [16, 16, (g, o) => { const { R, rand, veil } = o; R(g, '#dcd8cc', 0, 0, 16, 16); veil(g, 0.45, () => { for (let i = 0; i < 16; i++) R(g, '#3a4048', rand() * 16 | 0, rand() * 16 | 0, 1 + (rand() * 2 | 0), 1); }); }, 2],
    // lit glazing band (emissive): warm panes between dark mullions, one in six unlit; stretched over the band it is put on
    verriereArea51: () => [64, 8, (g, o) => { const { R, rand } = o; R(g, '#0c0e12', 0, 0, 64, 8); for (let x = 1; x < 64; x += 4) if (rand() > 0.17) R(g, rand() < 0.3 ? '#ffe2a8' : '#fff2d0', x, 1, 3, 6); }],
  });
})();
