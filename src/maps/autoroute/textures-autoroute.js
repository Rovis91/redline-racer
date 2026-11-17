// Textures specific to "autoroute" (Sunken Highway): completes the textures.js catalogue (same conventions: 8 px per metre, a base tone, grain, joints, wear; `rand` only). See docs/ASSET-GENERATION.md.
// These are the shared materials of the map (docs/proposals/sunken-highway/AMBIANCE-V2.html): each is used by several asset families, so each tint is one draw pass for the whole map.
// A city left to itself for decades at golden hour: every surface is weathered, stained and cracked; no periodic stripe runs along the streets (brick is a mottle, not courses).
(() => {
  const grain = (g, { R, rand, veil }, n, a = 0.18) => veil(g, a, () => { for (let i = 0; i < n; i++) R(g, i % 3 ? '#000' : '#fff', rand() * 64 | 0, rand() * 64 | 0, 1 + (rand() * 2 | 0), 1); });
  const runs = (g, { R, rand, veil }, n, c = '#000', a = 0.22) => veil(g, a, () => { for (let i = 0; i < n; i++) R(g, c, rand() * 64 | 0, rand() * 34 | 0, 1 + (rand() * 2 | 0), 5 + rand() * 24 | 0); });
  const blotch = (g, { R, rand, veil }, n, a = 0.1) => veil(g, a, () => { for (let i = 0; i < n; i++) R(g, i & 1 ? '#fff' : '#000', rand() * 52 | 0, rand() * 52 | 0, 6 + rand() * 14 | 0, 4 + rand() * 10 | 0); });
  // one window, its state drawn at random: dark glass, broken (black), boarded (plywood), or catching the low sun
  // (p = share of boarded and sunlit panes: 1 on brick and shop fronts, 0.3 on a curtain wall, which must stay one dark sheet)
  const pane = (g, { R, rand }, x, y, w, ht, p = 1) => { const k = rand(); R(g, k < 0.22 ? '#0c0e10' : k < 0.22 + 0.1 * p ? '#6a5a40' : k < 0.22 + 0.16 * p ? '#b88a58' : k < 0.7 ? '#2c3a40' : '#34444a', x, y, w, ht); if (k > 0.8) R(g, '#3d4e54', x, y, w, ht >> 1); };
  Object.assign(TEXTURES, {
    // street asphalt, c = its tone: old patches, cracks as broken lines, grass in a few of them, oil stains; no markings. 8 m per tile
    asphalteAutoroute: (c = '#3e4146') => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, c, 0, 0, 64, 64); grain(g, o, 460, 0.16); blotch(g, o, 8, 0.09);
      veil(g, 0.5, () => { for (let i = 0; i < 6; i++) { let x = rand() * 64 | 0, y = rand() * 64 | 0; for (let k = 0; k < 14; k++) { R(g, '#15171a', x, y, 1, 1); if (rand() < 0.5) x += rand() < 0.5 ? 1 : -1; else y += 1; if (i < 2 && rand() < 0.3) R(g, '#5d7a3a', x + 1, y, 1, 1); } } });
      veil(g, 0.2, () => { for (let i = 0; i < 4; i++) R(g, '#101214', rand() * 56 | 0, rand() * 56 | 0, 3 + rand() * 5 | 0, 2 + rand() * 4 | 0); }); }, 8],
    // pavement: concrete slabs of 2 m of uneven tone, open joints, weeds in some joints. 8 m per tile
    trottoirAutoroute: () => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, '#7d7a70', 0, 0, 64, 64);
      veil(g, 0.1, () => { for (let x = 0; x < 64; x += 16) for (let y = 0; y < 64; y += 16) R(g, rand() < 0.5 ? '#000' : '#fff', x, y, 16, 16); });
      veil(g, 0.35, () => { for (let k = 0; k < 64; k += 16) { R(g, '#000', 0, k, 64, 1); R(g, '#000', k, 0, 1, 64); } });
      veil(g, 0.7, () => { for (let i = 0; i < 22; i++) R(g, '#55733a', (rand() * 4 | 0) * 16 + (rand() < 0.5 ? 0 : rand() * 16 | 0), (rand() * 4 | 0) * 16 + (rand() * 3 | 0), 1 + (rand() * 2 | 0), 1); }); grain(g, o, 260); }, 8],
    // brick facade, c = the brick: two storeys of 4 m per tile, three windows of 1.25 x 2 m each with a pale lintel and sill, soot under the sills. 8 m per tile
    briqueAutoroute: (c = '#8a5a48') => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, c, 0, 0, 64, 64);
      veil(g, 0.14, () => { for (let i = 0; i < 300; i++) R(g, i & 1 ? '#000' : '#ffd0a0', rand() * 63 | 0, rand() * 64 | 0, 2, 1); }); blotch(g, o, 6, 0.08);
      for (let r = 0; r < 2; r++) for (let k = 0; k < 3; k++) { const x = 6 + k * 21, y = 7 + r * 32; R(g, '#b8ac98', x - 1, y - 2, 12, 2); pane(g, o, x, y, 10, 16); R(g, '#b8ac98', x - 1, y + 16, 12, 1); }
      runs(g, o, 10, '#1a1210', 0.25); grain(g, o, 160, 0.12); }, 8],
    // office facade in pale concrete or stone, c = its tone: per storey a spandrel and a ribbon of windows cut by mullions. 8 m per tile
    bureauAutoroute: (c = '#a89a80') => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, c, 0, 0, 64, 64); blotch(g, o, 7, 0.08);
      for (let r = 0; r < 2; r++) { const y = 10 + r * 32; R(g, '#2a2c2a', 0, y - 1, 64, 17); for (let x = 0; x < 64; x += 8) pane(g, o, x + 1, y, 7, 15, 0.6); }
      runs(g, o, 12, '#2a2018', 0.22); grain(g, o, 200, 0.12); }, 8],
    // curtain wall of a tower: panes of 2 x 4 m in a thin pale grid, a few missing, a few catching the sun. 8 m per tile
    verreAutoroute: () => [64, 64, (g, o) => { const { R } = o; R(g, '#59625f', 0, 0, 64, 64); for (let y = 0; y < 64; y += 32) for (let x = 0; x < 64; x += 16) pane(g, o, x + 1, y + 1, 15, 31, 0.3); grain(g, o, 120, 0.1); runs(g, o, 6, '#000', 0.15); }, 8],
    // corrugated steel cladding of the warehouses, c = paint: faint ribs, sheets of uneven tone, a joint every 4 m, rust runs. 8 m per tile
    toleAutoroute: (c = '#6f7f86') => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, c, 0, 0, 64, 64);
      veil(g, 0.1, () => { for (let x = 0; x < 64; x += 16) R(g, rand() < 0.5 ? '#000' : '#fff', x, 0, 16, 64); });
      veil(g, 0.08, () => { for (let x = 0; x < 64; x += 4) { R(g, '#000', x, 0, 1, 64); R(g, '#fff', x + 2, 0, 1, 64); } });
      veil(g, 0.3, () => { R(g, '#000', 0, 32, 64, 1); for (let x = 0; x < 64; x += 16) R(g, '#000', x, 0, 1, 64); });
      runs(g, o, 14, '#6a3414', 0.4); grain(g, o, 140, 0.12); }, 8],
    // ground floor of a street building, c = its wall: in the lower 4 m two shop windows (boarded, dark or broken), a door, a faded awning above each; a blank fascia over them. 8 m per tile
    vitrineAutoroute: (c = '#6a6258') => [64, 64, (g, o) => { const { R, rand } = o; R(g, c, 0, 0, 64, 64); R(g, '#3a3632', 0, 28, 64, 3);
      for (const [x, w] of [[3, 20], [27, 9], [40, 21]]) { R(g, ['#8a4a3a', '#3f6a5a', '#b89a50', '#5a5a6a'][rand() * 4 | 0], x - 1, 33, w + 2, 4); R(g, '#1c1c1c', x - 1, 38, w + 2, 22); pane(g, o, x, 39, w, 20); }
      R(g, '#4a4640', 0, 60, 64, 4); runs(g, o, 8, '#000', 0.2); grain(g, o, 180, 0.14); }, 8],
    // rubble of a fallen building: broken slabs and blocks of all sizes, pale dust, a few rusted bars. 8 m per tile
    gravatsAutoroute: () => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, '#5c5852', 0, 0, 64, 64);
      veil(g, 0.3, () => { for (let i = 0; i < 70; i++) R(g, ['#000', '#8a857c', '#3a3632', '#77726a'][rand() * 4 | 0], rand() * 60 | 0, rand() * 60 | 0, 2 + rand() * 8 | 0, 2 + rand() * 6 | 0); });
      veil(g, 0.6, () => { for (let i = 0; i < 9; i++) R(g, '#7a3a1a', rand() * 56 | 0, rand() * 62 | 0, 4 + rand() * 8 | 0, 1); }); grain(g, o, 320, 0.2); }, 8],
    // ivy and brush, c = its green: leaves in clusters of three tones over dark gaps. 4 m per tile
    lierreAutoroute: (c = '#3f6a34') => [32, 32, (g, o) => { const { R, rand, veil } = o; R(g, c, 0, 0, 32, 32);
      veil(g, 0.55, () => { for (let i = 0; i < 150; i++) R(g, ['#1c3018', '#5d8a40', '#7fa850', '#2a4a22'][rand() * 4 | 0], rand() * 31 | 0, rand() * 31 | 0, 2, 2); }); }, 4],
    // foliage of the big trees at golden hour, c = its tone: leaf masses, sunlit flecks, dark hollows. 4 m per tile
    feuillageAutoroute: (c = '#5a8a40') => [32, 32, (g, o) => { const { R, rand, veil } = o; R(g, c, 0, 0, 32, 32);
      veil(g, 0.5, () => { for (let i = 0; i < 110; i++) R(g, ['#2e4a22', '#8aa848', '#c8b050', '#40682e'][rand() * 4 | 0], rand() * 30 | 0, rand() * 30 | 0, 2 + (rand() * 2 | 0), 2); }); }, 4],
    // faded bodywork, drawn pale so that c tints it: rust blooming from the sills and seams, dirt, chalked paint. 4 m per tile
    carrosserieAutoroute: () => [32, 32, (g, o) => { const { R, rand, veil } = o; R(g, '#d8d4cc', 0, 0, 32, 32);
      veil(g, 0.5, () => { for (let i = 0; i < 26; i++) R(g, '#7a3c1c', rand() * 30 | 0, rand() * 30 | 0, 1 + rand() * 4 | 0, 1 + rand() * 3 | 0); });
      veil(g, 0.2, () => { for (let i = 0; i < 60; i++) R(g, i & 1 ? '#000' : '#fff', rand() * 31 | 0, rand() * 31 | 0, 2, 1); }); }, 4],
    // wall of the metro: pale glazed panels of 1 m, a teal band at hand height, grime running from the joints. 8 m per tile
    carrelageAutoroute: () => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, '#7e847a', 0, 0, 64, 64); R(g, '#2f5a54', 0, 50, 64, 4);
      veil(g, 0.12, () => { for (let x = 0; x < 64; x += 8) for (let y = 0; y < 64; y += 8) R(g, rand() < 0.5 ? '#000' : '#fff', x, y, 8, 8); });
      veil(g, 0.35, () => { for (let i = 0; i < 14; i++) R(g, '#0c0e10', (rand() * 8 | 0) * 8, (rand() * 8 | 0) * 8, 8, 8); }); runs(g, o, 16, '#1a1a14', 0.3); grain(g, o, 200, 0.14); }, 8],
    // standing water in the flooded streets: still teal, short pale glints, darker depths. 8 m per tile
    eauAutoroute: () => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, '#2a8f8a', 0, 0, 64, 64); blotch(g, o, 8, 0.08);
      veil(g, 0.3, () => { for (let i = 0; i < 40; i++) R(g, rand() < 0.7 ? '#bfe8d8' : '#f0c890', rand() * 60 | 0, rand() * 64 | 0, 2 + rand() * 5 | 0, 1); }); }, 8],
    // grass and weeds gone to seed: green with dry gold tufts and bare earth. 8 m per tile
    herbeAutoroute: () => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, '#5a7438', 0, 0, 64, 64);
      veil(g, 0.5, () => { for (let i = 0; i < 380; i++) R(g, ['#3a5226', '#7a9a48', '#b8a850', '#4a3a26'][rand() * 4 | 0], rand() * 63 | 0, rand() * 63 | 0, 1 + (rand() * 2 | 0), 1 + (rand() * 2 | 0)); }); }, 8],
    // motorway sign, t = its text: faded green panel, white border, white letters. Stretched over its board (8 x 2 m)
    panneauAutoroute: (t = '') => [128, 32, (g, o) => { const { R } = o; R(g, '#2f6a5a', 0, 0, 128, 32); R(g, '#d8d8c8', 1, 1, 126, 1); R(g, '#d8d8c8', 1, 30, 126, 1); R(g, '#d8d8c8', 1, 1, 1, 30); R(g, '#d8d8c8', 126, 1, 1, 30);
      g.fillStyle = '#e8e8d8'; g.textAlign = 'center'; g.textBaseline = 'middle'; let px = 18; do { g.font = 'bold ' + px + 'px sans-serif'; } while (g.measureText(t).width > 116 && --px > 6); g.fillText(t, 64, 17);
      runs(g, { ...o, rand: o.rand }, 5, '#5a2a10', 0.3); }],
  });
})();
