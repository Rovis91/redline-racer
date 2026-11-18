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
    // skin of the black prototypes: near-black radar-absorbing paint, panel lines every 2 m, a few lighter access panels; 8 m per tile
    furtifArea51: () => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, '#262a34', 0, 0, 64, 64);
      veil(g, 0.22, () => { for (let k = 0; k < 64; k += 16) { R(g, '#9aa4b8', 0, k, 64, 1); R(g, '#9aa4b8', k, 0, 1, 64); } });
      veil(g, 0.14, () => { for (let i = 0; i < 7; i++) R(g, '#9aa4b8', rand() * 56 | 0, rand() * 56 | 0, 4 + rand() * 6 | 0, 3 + rand() * 4 | 0); }); grain(g, o, 160, 0.14); }, 8],
    // radiation warning panel: black trefoil on yellow, one panel per face
    trefleArea51: () => [32, 32, (g, o) => { const { R } = o; R(g, '#e8c040', 0, 0, 32, 32); R(g, '#16181c', 0, 0, 32, 2); R(g, '#16181c', 0, 30, 32, 2); R(g, '#16181c', 0, 0, 2, 32); R(g, '#16181c', 30, 0, 2, 32);
      R(g, '#16181c', 14, 14, 4, 4); for (const [x, y, w, ht] of [[12, 4, 8, 3], [11, 7, 10, 3], [13, 10, 6, 2], [4, 19, 4, 7], [6, 17, 5, 6], [10, 17, 3, 3], [24, 19, 4, 7], [21, 17, 5, 6], [19, 17, 3, 3]]) R(g, '#16181c', x, y, w, ht); }],
    // desert brush and bark, c = its tint (sage grey-green, creosote olive, yucca, dry wood): leaf specks light and dark, no direction; 4 m per tile
    brousseArea51: c => [32, 32, (g, o) => { const { R, rand, veil } = o; R(g, c, 0, 0, 32, 32);
      veil(g, 0.3, () => { for (let i = 0; i < 150; i++) R(g, i % 3 ? '#1c2410' : '#f0f0c8', rand() * 32 | 0, rand() * 32 | 0, 1, 1 + (rand() * 2 | 0)); }); }, 4],
    // bed of a dry wash: pale sand and washed pebbles, darker silt in patches; 8 m per tile
    ouedArea51: () => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, '#dcc09a', 0, 0, 64, 64); grain(g, o, 300, 0.14);
      veil(g, 0.3, () => { for (let i = 0; i < 70; i++) R(g, i % 4 ? '#8a6a50' : '#fff', rand() * 62 | 0, rand() * 62 | 0, 1 + (rand() * 2 | 0), 1 + (rand() * 2 | 0)); });
      veil(g, 0.12, () => { for (let i = 0; i < 6; i++) R(g, '#6e4630', rand() * 48 | 0, rand() * 48 | 0, 8 + rand() * 10 | 0, 5 + rand() * 8 | 0); }); }, 8],
    // runway A where the race uses its full width: 60 × 32 m at 8 px per metre (the roadway texture, made for 20 m, was stretched three times across it). x = across, y = along.
    // Paving lanes 7.5 m wide with staggered cross joints, rubber in the wheel paths, repair patches, white edge lines and centreline dashes; mark = what this tile carries besides:
    // 1 touchdown-zone bars (three a side), 2 the aiming-point blocks, 0 nothing. Paint is part of the surface, as on the road
    pisteArea51: (mark = 0) => [512, 256, (g, o) => { const { R, rand, veil } = o, P = '#dcd8cc'; R(g, '#313a46', 0, 0, 512, 256);
      veil(g, 0.16, () => { for (let i = 0; i < 5200; i++) R(g, i % 3 ? '#000' : '#fff', rand() * 512 | 0, rand() * 256 | 0, 1, 1); });
      veil(g, 0.1, () => { for (let i = 0; i < 9; i++) R(g, i % 2 ? '#fff' : '#000', rand() * 460 | 0, rand() * 220 | 0, 20 + rand() * 40 | 0, 14 + rand() * 30 | 0); });
      veil(g, 0.3, () => { for (let x = 64; x < 512; x += 64) { R(g, '#000', x, 0, 1, 256); for (let y = rand() * 50 | 0; y < 256; y += 48 + (rand() * 30 | 0)) R(g, '#000', x - 64, y, 64, 1); } });
      veil(g, 0.22, () => { for (let i = 0; i < 260; i++) { const sd = rand() < 0.5 ? -1 : 1; R(g, '#000', 256 + sd * (30 + rand() * 70) | 0, rand() * 256 | 0, 1 + (rand() * 2 | 0), 12 + rand() * 50 | 0); } });
      for (const x of [20, 484]) R(g, P, x, 0, 8, 256); R(g, P, 252, 0, 8, 160);
      if (mark === 1) for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) R(g, P, 256 + sd * (84 + i * 28) - 7, 30, 15, 180);
      if (mark === 2) for (const sd of [-1, 1]) R(g, P, 256 + sd * 104 - 26, 8, 52, 240);
      veil(g, 0.5, () => { for (let i = 0; i < 900; i++) R(g, '#313a46', rand() * 512 | 0, rand() * 256 | 0, 1 + (rand() * 2 | 0), 1); }); }],
    feuVertArea51: 0x58f09a, // runway threshold lights (emit)
    cherenkovArea51: 0x4fb8ff, // the blue light of the reactor pool (emits)
    // worn white runway paint, 2 m per tile
    blancArea51: () => [16, 16, (g, o) => { const { R, rand, veil } = o; R(g, '#dcd8cc', 0, 0, 16, 16); veil(g, 0.45, () => { for (let i = 0; i < 16; i++) R(g, '#3a4048', rand() * 16 | 0, rand() * 16 | 0, 1 + (rand() * 2 | 0), 1); }); }, 2],
    // lit glazing band (emissive): warm panes between dark mullions, one in six unlit; stretched over the band it is put on
    verriereArea51: () => [64, 8, (g, o) => { const { R, rand } = o; R(g, '#0c0e12', 0, 0, 64, 8); for (let x = 1; x < 64; x += 4) if (rand() > 0.17) R(g, rand() < 0.3 ? '#ffe2a8' : '#fff2d0', x, 1, 3, 6); }],
  });
})();
