// Textures specific to "autoroute" (Sunken Highway): completes the textures.js catalogue (same conventions: 8 px per metre, a base tone, grain, joints, wear; `rand` only). See docs/ASSET-GENERATION.md.
// These are the shared materials of the map (docs/proposals/sunken-highway/AMBIANCE-V2.html): each is used by several asset families, so each tint is one draw pass for the whole map.
// A city left to itself for decades at golden hour: every surface is weathered, stained and cracked; no periodic stripe runs along the streets (brick is a mottle, not courses).
// Against repetition: the facades and the asphalt are drawn on 128 px for a 16 m tile (four storeys by six bays before the drawing repeats), and each takes a setting k:
// another k is another drawing of the same recipe (its own windows, stains and damage), so that the map can dress neighbouring buildings differently. k > 0 is also more damaged.
(() => {
  const grain = (g, { R, rand, veil }, n, a = 0.18, W = 64) => veil(g, a, () => { for (let i = 0; i < n; i++) R(g, i % 3 ? '#000' : '#fff', rand() * W | 0, rand() * W | 0, 1 + (rand() * 2 | 0), 1); });
  const runs = (g, { R, rand, veil }, n, c = '#000', a = 0.22, W = 64) => veil(g, a, () => { for (let i = 0; i < n; i++) R(g, c, rand() * W | 0, rand() * W * 0.55 | 0, 1 + (rand() * 2 | 0), 5 + rand() * W * 0.4 | 0); });
  const blotch = (g, { R, rand, veil }, n, a = 0.1, W = 64) => veil(g, a, () => { for (let i = 0; i < n; i++) R(g, i & 1 ? '#fff' : '#000', rand() * W * 0.8 | 0, rand() * W * 0.8 | 0, 6 + rand() * W * 0.22 | 0, 4 + rand() * W * 0.16 | 0); });
  // one window, its state drawn at random: dark glass, broken (black), boarded (plywood), or catching the low sun
  // (p = share of boarded and sunlit panes: 1 on brick and shop fronts, 0.3 on a curtain wall, which must stay one dark sheet; b = share of broken ones)
  const pane = (g, { R, rand }, x, y, w, ht, p = 1, b = 0.22) => { const k = rand(); R(g, k < b ? '#0c0e10' : k < b + 0.1 * p ? '#6a5a40' : k < b + 0.16 * p ? '#b88a58' : k < 0.75 ? '#2c3a40' : '#34444a', x, y, w, ht); if (k > 0.82) R(g, '#3d4e54', x, y, w, ht >> 1); };
  // what decades did to a wall: big damp stains from the top, a crack, patches where the facing fell (k = how damaged)
  const decay = (g, o, k, W = 128) => { const { R, rand, veil } = o; veil(g, 0.16 + 0.05 * k, () => { for (let i = 0; i < 4 + 3 * k; i++) R(g, '#1a1612', rand() * W | 0, 0, 6 + rand() * 22 | 0, W * (0.2 + rand() * 0.7) | 0); });
    veil(g, 0.5, () => { for (let i = 0; i < 1 + k; i++) { let x = rand() * W | 0, y = rand() * W * 0.4 | 0; for (let j = 0; j < 46; j++) { R(g, '#100c0a', x, y, 1, 2); y += 2; if (rand() < 0.4) x += rand() < 0.5 ? 1 : -1; } } });
    veil(g, 0.55, () => { for (let i = 0; i < 2 * k; i++) R(g, '#3a322c', rand() * W * 0.85 | 0, rand() * W * 0.85 | 0, 8 + rand() * 16 | 0, 6 + rand() * 14 | 0); });
    veil(g, 0.35, () => { for (let i = 0; i < 5 + 4 * k; i++) R(g, '#3f6a34', rand() * W | 0, W - 4 - (rand() * 16 | 0), 3 + rand() * 9 | 0, 4 + rand() * 14 | 0); }); }; // moss and creeper climbing from the foot of each tile
  Object.assign(TEXTURES, {
    // street asphalt, c = its tone: large repairs of other tones, long cracks, grass in some of them, oil stains; no markings. 16 m per tile
    asphalteAutoroute: (c = '#3e4146') => [128, 128, (g, o) => { const { R, rand, veil } = o; R(g, c, 0, 0, 128, 128); grain(g, o, 1700, 0.16, 128); blotch(g, o, 14, 0.07, 128);
      veil(g, 0.12, () => { for (let i = 0; i < 7; i++) R(g, i & 1 ? '#000' : '#9a9a94', rand() * 96 | 0, rand() * 96 | 0, 14 + rand() * 34 | 0, 10 + rand() * 30 | 0); });
      veil(g, 0.5, () => { for (let i = 0; i < 14; i++) { let x = rand() * 128 | 0, y = rand() * 128 | 0; for (let k = 0; k < 26; k++) { R(g, '#15171a', x, y, 1, 1); if (rand() < 0.5) x += rand() < 0.5 ? 1 : -1; else y += 1; if (i < 6 && rand() < 0.35) R(g, '#5d7a3a', x + 1, y, 1 + (rand() * 2 | 0), 1); } } });
      veil(g, 0.22, () => { for (let i = 0; i < 9; i++) R(g, '#101214', rand() * 120 | 0, rand() * 120 | 0, 3 + rand() * 6 | 0, 2 + rand() * 5 | 0); }); }, 16],
    // pavement: concrete slabs of 2 m of uneven tone, open joints, weeds in the joints, a few slabs lifted (dark). 8 m per tile
    trottoirAutoroute: () => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, '#7d7a70', 0, 0, 64, 64);
      veil(g, 0.12, () => { for (let x = 0; x < 64; x += 16) for (let y = 0; y < 64; y += 16) R(g, rand() < 0.5 ? '#000' : '#fff', x, y, 16, 16); });
      veil(g, 0.35, () => { for (let k = 0; k < 64; k += 16) { R(g, '#000', 0, k, 64, 1); R(g, '#000', k, 0, 1, 64); } });
      veil(g, 0.75, () => { for (let i = 0; i < 40; i++) R(g, i % 3 ? '#55733a' : '#7a9a48', (rand() * 4 | 0) * 16 + (rand() < 0.5 ? 0 : rand() * 16 | 0), (rand() * 4 | 0) * 16 + (rand() * 3 | 0), 1 + (rand() * 3 | 0), 1 + (rand() * 2 | 0)); }); grain(g, o, 260); }, 8],
    // brick facade, c = the brick, k = which drawing: four storeys of 4 m and six bays per tile, windows of 1.25 x 2 m with a pale lintel and sill, soot under the sills. 16 m per tile
    briqueAutoroute: (c = '#8a5a48', k = 0) => [128, 128, (g, o) => { const { R, rand, veil } = o; R(g, c, 0, 0, 128, 128);
      veil(g, 0.14, () => { for (let i = 0; i < 1200; i++) R(g, i & 1 ? '#000' : '#ffd0a0', rand() * 127 | 0, rand() * 128 | 0, 2, 1); }); blotch(g, o, 12, 0.08, 128);
      for (let r = 0; r < 4; r++) for (let b = 0; b < 6; b++) { const x = 6 + b * 21 + (b > 2 ? 1 : 0), y = 7 + r * 32; R(g, '#b8ac98', x - 1, y - 2, 12, 2); pane(g, o, x, y, 10, 16, 1, 0.2 + 0.12 * k); R(g, '#b8ac98', x - 1, y + 16, 12, 1); }
      runs(g, o, 30, '#1a1210', 0.25, 128); decay(g, o, k); grain(g, o, 600, 0.12, 128); }, 16],
    // office facade in pale concrete or stone, c = its tone, k = which drawing: per storey a spandrel and a ribbon of windows cut by mullions. 16 m per tile
    bureauAutoroute: (c = '#a89a80', k = 0) => [128, 128, (g, o) => { const { R } = o; R(g, c, 0, 0, 128, 128); blotch(g, o, 14, 0.08, 128);
      for (let r = 0; r < 4; r++) { const y = 10 + r * 32; R(g, '#2a2c2a', 0, y - 1, 128, 17); for (let x = 0; x < 128; x += 8) pane(g, o, x + 1, y, 7, 15, 0.6, 0.2 + 0.12 * k); }
      runs(g, o, 34, '#2a2018', 0.22, 128); decay(g, o, k); grain(g, o, 700, 0.12, 128); }, 16],
    // curtain wall of a tower, k = which drawing: panes of 2 x 4 m in a thin grid, some missing, a few catching the sun, dirt running from the mullions. 16 m per tile
    verreAutoroute: (k = 0) => [128, 128, (g, o) => { const { R } = o; R(g, '#59625f', 0, 0, 128, 128); for (let y = 0; y < 128; y += 32) for (let x = 0; x < 128; x += 16) pane(g, o, x + 1, y + 1, 15, 31, 0.3, 0.14 + 0.14 * k);
      grain(g, o, 400, 0.1, 128); runs(g, o, 22, '#000', 0.16, 128); if (k) decay(g, o, 1); }, 16],
    // corrugated steel cladding, c = paint, k = which drawing: faint ribs, sheets of uneven tone, a joint every 4 m, rust runs, sheets missing when k > 0. 8 m per tile
    toleAutoroute: (c = '#6f7f86', k = 0) => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, c, 0, 0, 64, 64);
      veil(g, 0.1, () => { for (let x = 0; x < 64; x += 16) R(g, rand() < 0.5 ? '#000' : '#fff', x, 0, 16, 64); });
      veil(g, 0.08, () => { for (let x = 0; x < 64; x += 4) { R(g, '#000', x, 0, 1, 64); R(g, '#fff', x + 2, 0, 1, 64); } });
      veil(g, 0.3, () => { R(g, '#000', 0, 32, 64, 1); for (let x = 0; x < 64; x += 16) R(g, '#000', x, 0, 1, 64); });
      for (let i = 0; i < 2 * k; i++) R(g, '#14100c', (rand() * 4 | 0) * 16, (rand() * 2 | 0) * 32, 16, 32);
      runs(g, o, 14 + 8 * k, '#6a3414', 0.4); grain(g, o, 140, 0.12); }, 8],
    // ground floor of a street building, c = its wall, k = which drawing: in the lower 4 m two shop windows (boarded, dark or broken), a door, a faded awning above each; a blank fascia over them. 8 m per tile
    vitrineAutoroute: (c = '#6a6258', k = 0) => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, c, 0, 0, 64, 64); R(g, '#3a3632', 0, 28, 64, 3);
      for (const [x, w] of k & 1 ? [[2, 12], [18, 24], [46, 15]] : [[3, 20], [27, 9], [40, 21]]) { R(g, ['#8a4a3a', '#3f6a5a', '#b89a50', '#5a5a6a'][rand() * 4 | 0], x - 1, 33, w + 2, 4); R(g, '#1c1c1c', x - 1, 38, w + 2, 22); pane(g, o, x, 39, w, 20, 1, 0.4); }
      R(g, '#4a4640', 0, 60, 64, 4); veil(g, 0.5, () => { for (let i = 0; i < 9; i++) R(g, '#3f6a34', rand() * 60 | 0, 58 - (rand() * 14 | 0), 3 + rand() * 6 | 0, 3 + rand() * 12 | 0); }); runs(g, o, 8, '#000', 0.2); grain(g, o, 180, 0.14); }, 8],
    // inside of a gutted building, seen through a hole in its facade: darkness, the edges of the floors every 4 m, hanging bars and cables. 8 m per tile
    interieurAutoroute: () => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, '#14120f', 0, 0, 64, 64); for (const y of [0, 32]) { R(g, '#5a544a', 0, y, 64, 3); R(g, '#2a2620', 0, y + 3, 64, 2); }
      veil(g, 0.6, () => { for (let i = 0; i < 12; i++) R(g, i & 1 ? '#6a3414' : '#3a362e', rand() * 62 | 0, (rand() < 0.5 ? 5 : 37) + (rand() * 3 | 0), 1, 4 + rand() * 18 | 0); for (let i = 0; i < 6; i++) R(g, '#2c2822', rand() * 50 | 0, rand() * 56 | 0, 5 + rand() * 12 | 0, 3 + rand() * 6 | 0); }); grain(g, o, 120, 0.2); }, 8],
    // rubble of a fallen building: broken slabs and blocks of all sizes, dust, a few rusted bars. 8 m per tile
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
    // wall of a metro station: cream glazed tiles in panels of 1 m, a coloured band at hand height and a dark plinth, some tiles fallen, grime running from the joints. 8 m per tile
    carrelageAutoroute: () => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, '#c8c4b0', 0, 0, 64, 64); R(g, '#2f6a62', 0, 46, 64, 3); R(g, '#3a3e3a', 0, 58, 64, 6);
      veil(g, 0.1, () => { for (let x = 0; x < 64; x += 8) for (let y = 0; y < 64; y += 8) R(g, rand() < 0.5 ? '#000' : '#fff', x, y, 8, 8); });
      veil(g, 0.16, () => { for (let k = 0; k < 64; k += 8) R(g, '#000', k, 0, 1, 58); });
      veil(g, 0.6, () => { for (let i = 0; i < 9; i++) R(g, '#55524a', (rand() * 16 | 0) * 4, (rand() * 14 | 0) * 4, 4 + (rand() * 2 | 0) * 4, 4); }); runs(g, o, 18, '#1a1a14', 0.28); grain(g, o, 200, 0.12); }, 8],
    // wall of a running tunnel: dark concrete in rings, three cable runs on brackets, damp, a pale band of old paint at the foot. 8 m per tile
    tunnelAutoroute: () => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, '#4a4c48', 0, 0, 64, 64); blotch(g, o, 9, 0.12);
      veil(g, 0.3, () => { for (const x of [0, 32]) R(g, '#000', x, 0, 1, 64); }); for (const y of [20, 24, 29]) R(g, '#1c1c1c', 0, y, 64, 1); for (let x = 6; x < 64; x += 16) R(g, '#2a2a28', x, 18, 1, 13);
      R(g, '#6a6c62', 0, 54, 64, 4); runs(g, o, 18, '#101210', 0.35); grain(g, o, 260, 0.16); }, 8],
    // track bed of the metro: dark ballast, a concrete sleeper every 75 cm (they lie across the tracks), oil and rust between them. 8 m per tile
    ballastAutoroute: () => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, '#2c2e2c', 0, 0, 64, 64); grain(g, o, 520, 0.22);
      veil(g, 0.55, () => { for (let y = 1; y < 64; y += 6) R(g, rand() < 0.2 ? '#4a4840' : '#5c5a50', 0, y, 64, 2); }); veil(g, 0.3, () => { for (let i = 0; i < 10; i++) R(g, '#5a2a10', rand() * 56 | 0, rand() * 60 | 0, 3 + rand() * 6 | 0, 2 + rand() * 4 | 0); }); }, 8],
    // enamel name plate of a metro station, t = its name: white capitals on dark blue, a white border, chipped. Stretched over its plate (8 x 2 m)
    plaqueAutoroute: (t = '') => [128, 32, (g, o) => { const { R } = o; R(g, '#1c2c5a', 0, 0, 128, 32); R(g, '#e8e8d8', 2, 2, 124, 1); R(g, '#e8e8d8', 2, 29, 124, 1); R(g, '#e8e8d8', 2, 2, 1, 28); R(g, '#e8e8d8', 125, 2, 1, 28);
      g.fillStyle = '#f0f0e0'; g.textAlign = 'center'; g.textBaseline = 'middle'; let px = 18; do { g.font = 'bold ' + px + 'px sans-serif'; } while (g.measureText(t).width > 112 && --px > 6); g.fillText(t, 64, 17); runs(g, o, 4, '#5a2a10', 0.35); }],
    // standing water in the flooded streets: still teal, short pale glints, darker depths. 8 m per tile
    eauAutoroute: () => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, '#2a8f8a', 0, 0, 64, 64); blotch(g, o, 8, 0.08);
      veil(g, 0.3, () => { for (let i = 0; i < 40; i++) R(g, rand() < 0.7 ? '#bfe8d8' : '#f0c890', rand() * 60 | 0, rand() * 64 | 0, 2 + rand() * 5 | 0, 1); }); }, 8],
    // moss on concrete and asphalt: patches of several greens that leave the surface under them bare between them (transparent: laid over a deck, a parapet, a wall). 8 m per tile
    mousseAutoroute: () => [64, 64, (g, o) => { const { R, rand } = o;
      for (let i = 0; i < 12; i++) { const cx = rand() * 64, cy = rand() * 64, r = 2 + rand() * 7; for (let k = 0; k < r * r * 2.2; k++) { const a = rand() * 6.3, d = r * Math.sqrt(rand());
        R(g, ['#34481f', '#44582a', '#566a30', '#2a3a1c', '#66703a'][rand() * 5 | 0], (cx + Math.cos(a) * d + 64) % 64 | 0, (cy + Math.sin(a) * d * 1.6 + 64) % 64 | 0, 1 + (rand() * 2 | 0), 1 + (rand() * 2 | 0)); } } }, 8],
    // fallen deck or platform slab the lane drives on: concrete plates 4 m long with open joints, cracks running from them, rust where the bars show, moss in the joints, dust. 8 m per tile
    dalleSolAutoroute: () => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, '#8a867a', 0, 0, 64, 64); blotch(g, o, 10, 0.07); grain(g, o, 420, 0.14);
      for (const y of [0, 32]) { R(g, '#3a3832', 0, y, 64, 1); veil(g, 0.5, () => { for (let i = 0; i < 14; i++) R(g, '#4a6430', rand() * 62 | 0, y + (rand() < 0.5 ? -1 : 1), 2 + (rand() * 4 | 0), 1); }); }
      veil(g, 0.45, () => { for (let i = 0; i < 5; i++) { let x = rand() * 64 | 0, y = rand() * 64 | 0; for (let k = 0; k < 18; k++) { R(g, '#2a2824', x, y, 1, 1); x = (x + (rand() < 0.5 ? 1 : 0)) % 64; y = (y + (rand() < 0.7 ? 1 : 0)) % 64; } } });
      veil(g, 0.35, () => { for (let i = 0; i < 7; i++) R(g, '#7a4a2a', rand() * 60 | 0, rand() * 62 | 0, 2 + (rand() * 4 | 0), 1); }); }, 8],
    // grass and weeds gone to seed: green with dry gold tufts and bare earth. 8 m per tile
    herbeAutoroute: () => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, '#5a7438', 0, 0, 64, 64);
      veil(g, 0.5, () => { for (let i = 0; i < 380; i++) R(g, ['#3a5226', '#7a9a48', '#b8a850', '#4a3a26'][rand() * 4 | 0], rand() * 63 | 0, rand() * 63 | 0, 1 + (rand() * 2 | 0), 1 + (rand() * 2 | 0)); }); }, 8],
    // motorway sign, t = its text: faded green panel, white border, white letters. Stretched over its board (8 x 2 m)
    panneauAutoroute: (t = '') => [128, 32, (g, o) => { const { R } = o; R(g, '#2f6a5a', 0, 0, 128, 32); R(g, '#d8d8c8', 1, 1, 126, 1); R(g, '#d8d8c8', 1, 30, 126, 1); R(g, '#d8d8c8', 1, 1, 1, 30); R(g, '#d8d8c8', 126, 1, 1, 30);
      g.fillStyle = '#e8e8d8'; g.textAlign = 'center'; g.textBaseline = 'middle'; let px = 18; do { g.font = 'bold ' + px + 'px sans-serif'; } while (g.measureText(t).width > 116 && --px > 6); g.fillText(t, 64, 17);
      runs(g, o, 5, '#5a2a10', 0.3); }],
  });
})();
