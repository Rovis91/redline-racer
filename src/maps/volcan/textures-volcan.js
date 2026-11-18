// Textures specific to "volcan": completes the textures.js catalogue (same conventions: 8 px per metre, a base tone, grain, joints, wear; `rand` only). See docs/ASSET-GENERATION.md.
// These are the shared materials of the map (docs/proposals/volcanic-island/AMBIANCE-V2.html): each one serves several asset families, so each tint is one draw pass for the whole map.
// Ground and rock textures carry no line and no direction (docs/ART-STYLE.md, rule 2): on a slope the terrain stretches them, and any stripe becomes a band across the whole flank.
(() => {
  const grain = (g, { R, rand, veil }, n, a = 0.18, s = 64) => veil(g, a, () => { for (let i = 0; i < n; i++) R(g, i % 3 ? '#000' : '#fff', rand() * s | 0, rand() * s | 0, 1 + (rand() * 2 | 0), 1 + (rand() * 2 | 0)); });
  const blots = (g, { R, rand, veil }, n, a, dark, pale, s = 64) => veil(g, a, () => { for (let i = 0; i < n; i++) { const w = 3 + (rand() * 9 | 0); R(g, i & 1 ? dark : pale, rand() * (s - w) | 0, rand() * (s - w) | 0, w, 2 + (rand() * 7 | 0)); } });
  Object.assign(TEXTURES, {
    // bare ground of old ash and lava gravel, c = its tint: fine grain, darker lapilli, a few paler patches; 8 m per tile
    solVolcan: (c = '#4a4744') => [64, 64, (g, o) => { const { R } = o; R(g, c, 0, 0, 64, 64); blots(g, o, 10, 0.1, '#0e0c0a', '#fff'); grain(g, o, 460, 0.16); }, 8],
    // rock, c = its tint, a = strength of the marks (1 near; 0.4 for far silhouettes): broken blocks of uneven tone, short cracks in every direction; 8 m per tile
    rocheVolcan: (c = '#3c3e44', a = 1) => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, c, 0, 0, 64, 64); blots(g, o, 26, 0.16 * a, '#000', '#fff');
      veil(g, 0.3 * a, () => { for (let i = 0; i < 34; i++) rand() < 0.5 ? R(g, '#000', rand() * 60 | 0, rand() * 63 | 0, 2 + (rand() * 4 | 0), 1) : R(g, '#000', rand() * 63 | 0, rand() * 60 | 0, 1, 2 + (rand() * 4 | 0)); }); grain(g, o, 240, 0.14 * a); }, 8],
    // columnar basalt, for the organ pipes only (small faces): c = its tint; joints across the columns at uneven heights; 8 m per tile
    basalteVolcan: (c = '#3c3e44') => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, c, 0, 0, 64, 64); blots(g, o, 14, 0.14, '#000', '#fff');
      veil(g, 0.35, () => { for (let y = 4 + (rand() * 8 | 0); y < 64; y += 9 + (rand() * 14 | 0)) R(g, '#000', rand() * 20 | 0, y, 20 + (rand() * 40 | 0), 1); }); grain(g, o, 200, 0.14); }, 8],
    // scoria, c = its tint: red-brown clinker, dark holes, lighter rusty specks, no direction; 8 m per tile
    scorieVolcan: (c = '#7c463c') => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, c, 0, 0, 64, 64); blots(g, o, 14, 0.2, '#2a1410', '#c88460');
      veil(g, 0.45, () => { for (let i = 0; i < 70; i++) R(g, '#2a1410', rand() * 63 | 0, rand() * 63 | 0, 1 + (rand() * 2 | 0), 1); }); grain(g, o, 300, 0.16); }, 8],
    // moss over lava, c = its grey-green: lumpy cushions of two tones, black rock showing through in small gaps; 8 m per tile
    mousseVolcan: (c = '#5f664f') => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, c, 0, 0, 64, 64); blots(g, o, 40, 0.2, '#343a2c', '#8f967a');
      veil(g, 0.55, () => { for (let i = 0; i < 46; i++) R(g, '#22241f', rand() * 62 | 0, rand() * 62 | 0, 1 + (rand() * 2 | 0), 1 + (rand() * 2 | 0)); }); grain(g, o, 200, 0.1); }, 8],
    // old snow, c = its white (bluish for ice): faint blue hollows, a little wind-blown grit; 8 m per tile
    neigeVolcan: (c = '#eef2f4') => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, c, 0, 0, 64, 64); blots(g, o, 16, 0.1, '#7a9ab4', '#fff');
      veil(g, 0.25, () => { for (let i = 0; i < 26; i++) R(g, '#5a6068', rand() * 63 | 0, rand() * 63 | 0, 1, 1); }); }, 8],
    // surface of the lava lake (emissive): plates of crust 3 to 8 m across on about half of the molten surface, a few hotter openings; 16 m per tile
    laveVolcan: () => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, '#ff8a1e', 0, 0, 64, 64);
      veil(g, 0.6, () => { for (let i = 0; i < 10; i++) R(g, '#ffd060', rand() * 56 | 0, rand() * 56 | 0, 3 + rand() * 6 | 0, 2 + rand() * 4 | 0); });
      for (let y = 0; y < 64;) { const ht = 9 + (rand() * 12 | 0); for (let x = (rand() * 6 | 0) - 6; x < 64;) { const w = 10 + (rand() * 18 | 0); if (rand() < 0.55) R(g, rand() < 0.3 ? '#5a2010' : '#2a1410', x + 1, y + 1, w - 2, ht - 2); x += w; } y += ht; }
      veil(g, 0.4, () => { for (let i = 0; i < 24; i++) R(g, '#140a08', rand() * 62 | 0, rand() * 62 | 0, 2 + (rand() * 3 | 0), 1 + (rand() * 2 | 0)); }); }, 16],
    // painted timber cladding of the houses, c = its paint: upright boards 25 cm wide of slightly uneven tone, a darker foot where the paint weathers; 8 m per tile
    bardageVolcan: (c = '#c8362b') => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, c, 0, 0, 64, 64);
      veil(g, 0.07, () => { for (let x = 0; x < 64; x += 2) R(g, rand() < 0.5 ? '#000' : '#fff', x, 0, 2, 64); });
      veil(g, 0.2, () => { for (let x = 0; x < 64; x += 2) R(g, '#000', x, 0, 1, 64); R(g, '#000', 0, 60, 64, 4); }); grain(g, o, 90, 0.08); }, 8],
    // roof of tarred felt or dark sheet, c = its tint: wide lapped strips, pale wear along the laps; 8 m per tile
    toitVolcan: (c = '#2a2d31') => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, c, 0, 0, 64, 64);
      veil(g, 0.25, () => { for (let y = 7; y < 64; y += 8) { R(g, '#000', 0, y, 64, 1); for (let i = 0; i < 5; i++) R(g, '#9aa0a8', rand() * 58 | 0, y - 1, 3 + (rand() * 5 | 0), 1); } }); grain(g, o, 160, 0.12); }, 8],
    // dry-stone work of black basalt, c = its tint: uneven blocks 30 to 80 cm long in courses of 25 to 40 cm, deep joints, a pale stone here and there; 8 m per tile
    pierreVolcan: (c = '#34363a') => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, '#121214', 0, 0, 64, 64);
      for (let y = 0; y < 64;) { const ht = 2 + (rand() * 2 | 0); for (let x = -(rand() * 4 | 0); x < 64;) { const w = 3 + (rand() * 5 | 0); R(g, c, x, y, w - 1, ht); if (rand() < 0.3) veil(g, 0.25, () => R(g, rand() < 0.4 ? '#fff' : '#000', x, y, w - 1, ht)); x += w; } y += ht + 1; }
      grain(g, o, 200, 0.14); }, 8],
    // the northern sea, seen from above: dark cold blue, short pale wave marks without a common direction, darker patches; 64 m per tile
    merVolcan: () => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, '#1d4a68', 0, 0, 64, 64); blots(g, o, 12, 0.14, '#0a2238', '#3a7898');
      veil(g, 0.2, () => { for (let i = 0; i < 70; i++) R(g, '#c8dfe8', rand() * 60 | 0, rand() * 63 | 0, 2 + (rand() * 4 | 0), 1); }); }, 64],
    // weathered concrete or paving, c = its tint: uneven slabs, stains; 8 m per tile
    betonVolcan: (c = '#b8b5a6') => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, c, 0, 0, 64, 64); blots(g, o, 12, 0.1, '#3a3028', '#fff');
      veil(g, 0.12, () => { for (let y = 0; y < 64; y += 16) R(g, '#000', 0, y, 64, 1); for (let x = 0; x < 64; x += 16) R(g, '#000', x, 0, 1, 64); }); grain(g, o, 260, 0.12); }, 8],
    // weathered planks, c = their tint (grey for the racks): boards 50 cm wide along the length, joints, knots; 4 m per tile
    boisVolcan: (c = '#8a6a48') => [32, 32, (g, o) => { const { R, rand, veil } = o; R(g, c, 0, 0, 32, 32);
      veil(g, 0.14, () => { for (let y = 0; y < 32; y += 4) R(g, rand() < 0.5 ? '#000' : '#fff', 0, y, 32, 4); });
      veil(g, 0.4, () => { for (let y = 0; y < 32; y += 4) R(g, '#2a1c10', 0, y, 32, 1); for (let i = 0; i < 8; i++) R(g, '#2a1c10', rand() * 31 | 0, rand() * 31 | 0, 1, 1); }); }, 4],
  });
})();
