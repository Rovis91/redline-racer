// Textures specific to "volcan": completes the textures.js catalogue (same conventions: 8 px per metre, a base tone, grain, joints, wear; `rand` only). See docs/ASSET-GENERATION.md.
// These are the shared materials of the map (docs/proposals/volcanic-island/AMBIANCE-V2.html): each one serves several asset families, so each tint is one draw pass for the whole map.
(() => {
  const grain = (g, { R, rand, veil }, n, a = 0.18) => veil(g, a, () => { for (let i = 0; i < n; i++) R(g, i % 3 ? '#000' : '#fff', rand() * 64 | 0, rand() * 64 | 0, 1 + (rand() * 2 | 0), 1); });
  Object.assign(TEXTURES, {
    // old consolidated ash, c = its tint (grey-brown; olive for the low dry-grass slopes): fine grain, darker lapilli, a few pale wind-blown patches, no direction; 8 m per tile
    solVolcan: (c = '#6f6258') => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, c, 0, 0, 64, 64); grain(g, o, 460, 0.16);
      veil(g, 0.1, () => { for (let i = 0; i < 9; i++) R(g, i & 1 ? '#fff' : '#1c1410', rand() * 52 | 0, rand() * 52 | 0, 6 + rand() * 12 | 0, 4 + rand() * 8 | 0); });
      veil(g, 0.4, () => { for (let i = 0; i < 30; i++) R(g, '#2e2824', rand() * 63 | 0, rand() * 63 | 0, 2, 1); }); }, 8],
    // basalt, c = its tint, a = strength of the joints (1 near; 0.4 for far silhouettes): columns 1 to 2 m wide broken by uneven horizontal joints, a few pale lichen marks; 8 m per tile
    basalteVolcan: (c = '#3c3e44', a = 1) => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, c, 0, 0, 64, 64);
      veil(g, 0.16 * a, () => { for (let x = 0; x < 64;) { const w = 7 + (rand() * 9 | 0); R(g, rand() < 0.5 ? '#000' : '#fff', x, 0, w, 64); x += w; } });
      veil(g, 0.4 * a, () => { for (let x = 0; x < 64;) { const w = 7 + (rand() * 9 | 0); R(g, '#000', x, 0, 1, 64); for (let y = rand() * 14 | 0; y < 64; y += 9 + (rand() * 16 | 0)) R(g, '#000', x, y, w, 1); x += w; } });
      veil(g, 0.12 * a, () => { for (let i = 0; i < 7; i++) R(g, '#c8c4a8', rand() * 60 | 0, rand() * 60 | 0, 2 + (rand() * 3 | 0), 1 + (rand() * 2 | 0)); });
      grain(g, o, 240, 0.14 * a); }, 8],
    // scoria, c = its tint: red-brown clinker, dark holes, lighter rusty specks, no direction; 8 m per tile
    scorieVolcan: (c = '#8a4a40') => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, c, 0, 0, 64, 64);
      veil(g, 0.22, () => { for (let i = 0; i < 14; i++) R(g, i & 1 ? '#2a1410' : '#d08a60', rand() * 54 | 0, rand() * 54 | 0, 4 + rand() * 9 | 0, 3 + rand() * 6 | 0); });
      veil(g, 0.5, () => { for (let i = 0; i < 70; i++) R(g, '#2a1410', rand() * 63 | 0, rand() * 63 | 0, 1 + (rand() * 2 | 0), 1); }); grain(g, o, 300, 0.16); }, 8],
    // surface of the lava lake (emissive): plates of crust 3 to 8 m across on about half of the molten surface, a few hotter openings; 16 m per tile
    laveVolcan: () => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, '#ff8a1e', 0, 0, 64, 64);
      veil(g, 0.6, () => { for (let i = 0; i < 10; i++) R(g, '#ffd060', rand() * 56 | 0, rand() * 56 | 0, 3 + rand() * 6 | 0, 2 + rand() * 4 | 0); });
      for (let y = 0; y < 64;) { const ht = 9 + (rand() * 12 | 0); for (let x = (rand() * 6 | 0) - 6; x < 64;) { const w = 10 + (rand() * 18 | 0); if (rand() < 0.55) R(g, rand() < 0.3 ? '#5a2010' : '#2a1410', x + 1, y + 1, w - 2, ht - 2); x += w; } y += ht; }
      veil(g, 0.4, () => { for (let i = 0; i < 24; i++) R(g, '#140a08', rand() * 62 | 0, rand() * 62 | 0, 2 + (rand() * 3 | 0), 1 + (rand() * 2 | 0)); }); }, 16],
    // lime plaster of the houses, c = its colour: slightly uneven coats, grey runs under the eaves, a darker foot; 8 m per tile
    crepiVolcan: (c = '#e8d9ac') => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, c, 0, 0, 64, 64);
      veil(g, 0.07, () => { for (let i = 0; i < 12; i++) R(g, i & 1 ? '#fff' : '#000', rand() * 48 | 0, rand() * 56 | 0, 8 + rand() * 16 | 0, 4 + rand() * 8 | 0); });
      veil(g, 0.1, () => { for (let i = 0; i < 8; i++) R(g, '#4a4038', rand() * 64 | 0, 0, 1, 3 + rand() * 6 | 0); R(g, '#4a4038', 0, 60, 64, 4); }); grain(g, o, 160, 0.08); }, 8],
    // roof of half-round clay tiles, c = its colour: courses every 50 cm, tiles 25 cm wide offset from one course to the next, a few darker and paler tiles; 8 m per tile
    tuileVolcan: (c = '#b75d43') => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, c, 0, 0, 64, 64);
      veil(g, 0.2, () => { for (let i = 0; i < 60; i++) R(g, rand() < 0.5 ? '#000' : '#ffd0a0', (rand() * 32 | 0) * 2, (rand() * 16 | 0) * 4, 2, 4); });
      veil(g, 0.42, () => { for (let y = 0; y < 64; y += 4) { R(g, '#3a1408', 0, y + 3, 64, 1); for (let x = (y / 4 & 1); x < 64; x += 2) R(g, '#3a1408', x, y, 1, 3); } }); }, 8],
    // dry-stone wall of black basalt, c = its tint: uneven blocks 30 to 80 cm long in courses of 25 to 40 cm, deep joints, a pale stone here and there; 8 m per tile
    pierreVolcan: (c = '#34363a') => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, '#121214', 0, 0, 64, 64);
      for (let y = 0; y < 64;) { const ht = 2 + (rand() * 2 | 0); for (let x = -(rand() * 4 | 0); x < 64;) { const w = 3 + (rand() * 5 | 0); R(g, c, x, y, w - 1, ht); if (rand() < 0.3) veil(g, 0.25, () => R(g, rand() < 0.4 ? '#fff' : '#000', x, y, w - 1, ht)); x += w; } y += ht + 1; }
      grain(g, o, 200, 0.14); }, 8],
    // foliage, c = its green (banana leaf, vine, shrub): overlapping blades of two tones, dark gaps; 4 m per tile
    feuilleVolcan: (c = '#5f8a4a') => [32, 32, (g, o) => { const { R, rand, veil } = o; R(g, c, 0, 0, 32, 32);
      veil(g, 0.3, () => { for (let i = 0; i < 46; i++) R(g, i % 3 ? '#1a3010' : '#d8e890', rand() * 30 | 0, rand() * 30 | 0, 1 + (rand() * 4 | 0), 1 + (rand() * 3 | 0)); }); }, 4],
    // the Atlantic, seen from above: deep blue, lighter short wave lines without a common direction, darker patches; 64 m per tile
    merVolcan: () => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, '#1c5078', 0, 0, 64, 64);
      veil(g, 0.14, () => { for (let i = 0; i < 12; i++) R(g, i & 1 ? '#0a2a48' : '#3a80a8', rand() * 44 | 0, rand() * 50 | 0, 10 + rand() * 20 | 0, 5 + rand() * 9 | 0); });
      veil(g, 0.22, () => { for (let i = 0; i < 70; i++) R(g, '#bfe0ee', rand() * 60 | 0, rand() * 63 | 0, 2 + (rand() * 4 | 0), 1); }); }, 64],
    // weathered concrete, c = its tint: board marks every metre, runs, a darker foot; 8 m per tile
    betonVolcan: (c = '#b8b5a6') => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, c, 0, 0, 64, 64);
      veil(g, 0.12, () => { for (let y = 0; y < 64; y += 8) R(g, '#000', 0, y, 64, 1); for (let i = 0; i < 10; i++) R(g, '#3a3028', rand() * 64 | 0, rand() * 30 | 0, 1 + (rand() * 2 | 0), 6 + rand() * 20 | 0); }); grain(g, o, 260, 0.12); }, 8],
    // weathered planks, c = their tint: boards 50 cm wide along the length, joints, knots, boards of uneven tone; 4 m per tile
    boisVolcan: (c = '#8a6a48') => [32, 32, (g, o) => { const { R, rand, veil } = o; R(g, c, 0, 0, 32, 32);
      veil(g, 0.14, () => { for (let y = 0; y < 32; y += 4) R(g, rand() < 0.5 ? '#000' : '#fff', 0, y, 32, 4); });
      veil(g, 0.4, () => { for (let y = 0; y < 32; y += 4) R(g, '#2a1c10', 0, y, 32, 1); for (let i = 0; i < 8; i++) R(g, '#2a1c10', rand() * 31 | 0, rand() * 31 | 0, 1, 1); }); }, 4],
    // wall and vault of the galleries, cut in the rock (the settings of the engine's tunnel palette are ignored): rough dark basalt, tool marks, a cable run at 3 m; 8 m per tile
    galerieVolcan: () => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, '#1f2024', 0, 0, 64, 64);
      veil(g, 0.2, () => { for (let i = 0; i < 26; i++) R(g, i & 1 ? '#000' : '#5a5a62', rand() * 54 | 0, rand() * 58 | 0, 4 + rand() * 10 | 0, 2 + rand() * 6 | 0); });
      veil(g, 0.3, () => { for (let i = 0; i < 40; i++) R(g, '#000', rand() * 63 | 0, rand() * 58 | 0, 1, 2 + rand() * 6 | 0); }); R(g, '#14161a', 0, 38, 64, 1); grain(g, o, 300, 0.16); }, 8],
  });
})();
