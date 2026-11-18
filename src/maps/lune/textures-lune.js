// Textures specific to "lune": completes the textures.js catalogue (same conventions: 8 px per metre, a base tone, grain, joints, wear; `rand` only). See docs/ASSET-GENERATION.md.
// These are the shared materials of the map (docs/proposals/lunar-outpost/AMBIANCE-V2.html): each one is used by several asset families, so each tint is one draw pass for the whole map.
(() => {
  const grain = (g, { R, rand, veil }, n, a = 0.18, s = 64) => veil(g, a, () => { for (let i = 0; i < n; i++) R(g, i % 3 ? '#000' : '#fff', rand() * s | 0, rand() * s | 0, 1 + (rand() * 2 | 0), 1); });
  Object.assign(TEXTURES, {
    // regolith: slate-grey dust, 8 m per tile; fine angular grain, a few darker pits with a pale lip, no direction, no stones
    regolitheLune: (c = '#747988') => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, c, 0, 0, 64, 64); grain(g, o, 460, 0.16);
      veil(g, 0.1, () => { for (let i = 0; i < 8; i++) R(g, i & 1 ? '#fff' : '#000', rand() * 50 | 0, rand() * 50 | 0, 8 + rand() * 12 | 0, 5 + rand() * 9 | 0); });
      for (let i = 0; i < 5; i++) { const x = rand() * 58 | 0, y = rand() * 58 | 0, s = 2 + (rand() * 3 | 0); veil(g, 0.3, () => { R(g, '#000', x, y, s, s); R(g, '#fff', x - 1, y + s, s + 2, 1); }); } }, 8],
    // rock of crater walls and ridges, c = its tint, a = strength of the strata (1 near; 0.4 for the far ridges, a silhouette): uneven horizontal strata, a few vertical cracks, 8 m per tile
    rocheLune: (c = '#5d6472', a = 1) => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, c, 0, 0, 64, 64);
      veil(g, 0.22 * a, () => { for (let y = 0; y < 64;) { const ht = 2 + (rand() * 7 | 0); R(g, rand() < 0.55 ? '#000' : '#fff', 0, y, 64, ht); y += ht + (rand() * 5 | 0); } });
      veil(g, 0.36 * a, () => { for (let y = 0; y < 64; y += 5 + (rand() * 8 | 0)) R(g, '#000', 0, y, 64, 1); for (let i = 0; i < 8; i++) R(g, '#000', rand() * 64 | 0, rand() * 50 | 0, 1, 4 + rand() * 12 | 0); });
      grain(g, o, 240); }, 8],
    // shell of the colony, c = paint (ivory; pale grey for halls): 2 m panels with a dark joint, a rivet at each corner, uneven panel tones, a little grey dust at the foot of each tile; 8 m per tile
    coqueLune: (c = '#e8e2d0') => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, c, 0, 0, 64, 64);
      veil(g, 0.07, () => { for (let y = 0; y < 64; y += 16) for (let x = 0; x < 64; x += 16) R(g, rand() < 0.5 ? '#000' : '#fff', x, y, 16, 16); });
      veil(g, 0.42, () => { for (let k = 0; k < 64; k += 16) { R(g, '#30343c', k, 0, 1, 64); R(g, '#30343c', 0, k, 64, 1); } });
      veil(g, 0.5, () => { for (let y = 0; y < 64; y += 16) for (let x = 0; x < 64; x += 16) { R(g, '#30343c', x + 2, y + 2, 1, 1); R(g, '#30343c', x + 14, y + 2, 1, 1); R(g, '#30343c', x + 2, y + 14, 1, 1); R(g, '#30343c', x + 14, y + 14, 1, 1); } });
      veil(g, 0.16, () => { R(g, '#747988', 0, 58, 64, 6); for (let i = 0; i < 10; i++) R(g, '#747988', rand() * 64 | 0, 50 + (rand() * 8 | 0), 2 + (rand() * 3 | 0), 2); });
      grain(g, o, 90, 0.08); }, 8],
    // photovoltaic field: matte blue cells 1 m square between pale busbars, a frame every 4 m; 4 m per tile
    solaireLune: () => [32, 32, (g, o) => { const { R, rand, veil } = o; R(g, '#2c4258', 0, 0, 32, 32);
      veil(g, 0.12, () => { for (let y = 0; y < 32; y += 8) for (let x = 0; x < 32; x += 8) R(g, rand() < 0.5 ? '#000' : '#9fc4e6', x, y, 8, 8); });
      veil(g, 0.5, () => { for (let k = 0; k < 32; k += 8) { R(g, '#9aa6b4', k, 0, 1, 32); R(g, '#9aa6b4', 0, k, 32, 1); } }); R(g, '#d8d4c8', 0, 0, 32, 1); R(g, '#d8d4c8', 0, 0, 1, 32); }, 4],
    // roadway of the outpost (same layout as the catalogue roadway: 8 m wide tile, edge lines, centre dashes): dark compacted surface, darker repair patches, slab joints, rubber, grey dust blown in from both edges.
    // Fully opaque: the catalogue roadway keeps two half-transparent puddle blobs even when dry, which the hard white sun of this map turned into blown-out patches
    routeLune: (asph, spk, edge, dash) => [64, 256, (g, { R, rnd, veil, speckle }) => { R(g, asph, 0, 0, 64, 256); speckle(g, 900, spk, 1, 256);
      veil(g, 0.25, () => { speckle(g, 500, '#000', 1, 256); speckle(g, 120, '#fff', 1, 256); });
      veil(g, 0.22, () => { for (let i = 0; i < 5; i++) { const x = 8 + rnd() * 34 | 0, y = rnd() * 220 | 0, w = 8 + rnd() * 12 | 0, h = 14 + rnd() * 30 | 0; R(g, '#000', x, y, w, h); } R(g, '#000', 7, 0, 50, 1); R(g, '#000', 7, 128, 50, 1); });
      veil(g, 0.15, () => { for (const x of [17, 26, 36, 45]) for (let y = 0; y < 256; y += 4) if (rnd() < 0.8) R(g, '#000', x + (rnd() * 2 | 0), y, 2, 4); });
      veil(g, 0.3, () => { for (let y = 0; y < 256; y += 2) { R(g, '#747988', 0, y, 3 + (rnd() * 5 | 0), 2); const w = 3 + (rnd() * 5 | 0); R(g, '#747988', 64 - w, y, w, 2); } });
      R(g, edge, 5, 0, 2, 256); R(g, edge, 57, 0, 2, 256); for (let y = 0; y < 256; y += 64) R(g, dash, 31, y, 2, 32);
      for (let i = 0; i < 260; i++) R(g, asph, [5, 6, 31, 32, 57, 58][rnd() * 6 | 0], rnd() * 256 | 0, 1, 1 + rnd() * 3 | 0); }],
    // lit band (emissive), c = the light: panes between dark mullions, one in six unlit; stretched over the band it is put on. Windows of the colony (warm), ceiling panels of the halls (cold)
    hublotLune: (c = '#ffe9b8') => [64, 8, (g, o) => { const { R, rand } = o; R(g, '#0c0e14', 0, 0, 64, 8); for (let x = 1; x < 64; x += 4) if (rand() > 0.17) R(g, c, x, 1, 3, 6); }],
    // the Earth (emissive), on a disc: ocean blue, white cloud bands, two ochre-green land masses, the night side to the left
    terreLune: () => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, '#2f6fc4', 0, 0, 64, 64);
      veil(g, 0.75, () => { for (const [x, y, w, ht] of [[30, 14, 16, 10], [36, 22, 9, 12], [18, 36, 12, 9], [24, 44, 8, 8]]) R(g, '#6c8a4e', x, y, w, ht); });
      veil(g, 0.85, () => { for (let i = 0; i < 16; i++) R(g, '#f4f6f8', rand() * 54 | 0, rand() * 60 | 0, 6 + rand() * 16 | 0, 1 + (rand() * 3 | 0)); R(g, '#f4f6f8', 0, 0, 64, 5); R(g, '#f4f6f8', 0, 59, 64, 5); });
      for (let x = 0; x < 26; x++) veil(g, 0.92 * (1 - x / 26), () => R(g, '#02030a', x, 0, 1, 64)); }],
  });
})();
