// Textures specific to "chapada" (Manuscript 512, the lost city): complements the catalogue in textures.js, same conventions. See docs/methods/SCENERY.md.
// Palette of the proposal: deep greens and emerald, pink quartzite, jade water, gold and flame as accents.
(() => {
  const scatter = (g, { R, rand }, n, cs, w = 1, h = 1, W = 64, H = 64) => { for (let i = 0; i < n; i++) R(g, cs[rand() * cs.length | 0], rand() * W | 0, rand() * H | 0, w + (rand() * w | 0), h + (rand() * h | 0)); };
  // foliage: a base and large strokes of shadow and light (they still read at 270 lines, from afar they blend)
  const leafFn = (c, clair) => () => [64, 64, (g, o) => { o.R(g, c, 0, 0, 64, 64); o.veil(g, 0.3, () => scatter(g, o, 110, ['#000', '#000', clair], 3, 2)); o.veil(g, 0.55, () => scatter(g, o, 26, [clair], 2, 1)); }];
  // the city's dressed stone: large blocks with dark joints, moss in the joints and at the top, runnels
  const stone = (c, moss = 0.5) => () => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, c, 0, 0, 64, 64);
    veil(g, 0.12, () => { for (let y = 0; y < 64; y += 16) for (let x = (y & 16) / 2 - 8; x < 64; x += 32) R(g, rand() < 0.5 ? '#000' : '#fff', x, y, 32, 16); });
    veil(g, 0.18, () => scatter(g, o, 240, ['#000', '#fff']));
    veil(g, 0.45, () => { for (let y = 0; y < 64; y += 16) { R(g, '#1c1a16', 0, y, 64, 1); for (let x = (y & 16) / 2; x < 64; x += 32) R(g, '#1c1a16', x, y, 1, 16); } });
    veil(g, moss, () => { for (let y = 0; y < 64; y += 16) for (let x = 0; x < 64; x += 2) if (rand() < 0.55) R(g, rand() < 0.5 ? '#4d6a34' : '#7fa83a', x, y, 2, 1 + (rand() * 3 | 0)); });
    veil(g, 0.25, () => { for (let i = 0; i < 9; i++) R(g, '#1c1a16', rand() * 64 | 0, rand() * 30 | 0, 1 + (rand() * 2 | 0), 8 + rand() * 24 | 0); });
  }, 4];
  Object.assign(TEXTURES, {
    leafShade: leafFn('#163a22', '#7fb04a'), leafCanopy: leafFn('#1f5a2c', '#a8d458'), leafSun: leafFn('#3f9a3c', '#d0ee78'), leafFar: leafFn('#3c6e3c', '#8fb070'), palmJungle: leafFn('#2a6a2e', '#b8dc5a'),
    // damp bark: vertical streaks, moss patches
    barkJungle: () => [32, 64, (g, o) => { const { R, rand, veil } = o; R(g, '#3a2e24', 0, 0, 32, 64);
      veil(g, 0.4, () => { for (let i = 0; i < 40; i++) R(g, rand() < 0.6 ? '#1c1612' : '#6a5a48', rand() * 32 | 0, rand() * 64 | 0, 1, 6 + rand() * 20 | 0); });
      veil(g, 0.6, () => scatter(g, o, 14, ['#4d6a34', '#7fa83a'], 3, 4, 32, 64)); }],
    // forest floor, the same everywhere (D-7): dark litter, moss, russet leaves; never bare pale ground
    litterMoss: () => [64, 64, (g, o) => { const { R, veil } = o; R(g, '#26381c', 0, 0, 64, 64);
      scatter(g, o, 300, ['#1c2a16', '#3a4a22', '#4a3a22', '#2e4420']); veil(g, 0.6, () => scatter(g, o, 40, ['#5f8a34', '#7fa83a'], 3, 2)); veil(g, 0.7, () => scatter(g, o, 30, ['#7a5a30', '#8a4a26'], 2, 1)); }, 6],
    // rock of the slopes and gorges: dark blocks, moss on top, black runnels (never regular horizontal strata: D-9)
    rockMoss: () => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, '#5a564a', 0, 0, 64, 64);
      veil(g, 0.25, () => { for (let i = 0; i < 16; i++) R(g, rand() < 0.5 ? '#000' : '#fff', rand() * 56 | 0, rand() * 56 | 0, 6 + rand() * 14 | 0, 5 + rand() * 12 | 0); });
      veil(g, 0.4, () => { for (let i = 0; i < 12; i++) R(g, '#1c1a16', rand() * 64 | 0, rand() * 40 | 0, 1 + (rand() * 2 | 0), 10 + rand() * 30 | 0); });
      veil(g, 0.65, () => scatter(g, o, 60, ['#4d6a34', '#7fa83a', '#3a5a2a'], 4, 2)); }, 5],
    // bank: dark silt and pebbles
    siltPebbles: () => [64, 64, (g, o) => { const { R, veil } = o; R(g, '#3a3c2a', 0, 0, 64, 64); scatter(g, o, 200, ['#2a2c20', '#4a4c36']); veil(g, 0.8, () => scatter(g, o, 34, ['#8a8672', '#6a6656', '#a09a84'], 2, 2)); }, 6],
    // jade water: clear, green, lively; light highlights stretched along the current (v), shadows of the trees
    waterJade: () => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, '#2f8f7a', 0, 0, 64, 64);
      veil(g, 0.45, () => { for (let i = 0; i < 22; i++) R(g, '#134a40', rand() * 56 | 0, rand() * 60 | 0, 5 + rand() * 9 | 0, 8 + rand() * 16 | 0); });
      veil(g, 0.5, () => { for (let i = 0; i < 26; i++) R(g, '#bfe8c8', rand() * 62 | 0, rand() * 60 | 0, 1, 4 + rand() * 9 | 0); });
      veil(g, 0.35, () => { for (let i = 0; i < 10; i++) R(g, '#a9bb7e', rand() * 58 | 0, rand() * 60 | 0, 3, 6 + rand() * 10 | 0); }); }, 10],
    // marsh water: dark and calm, sky reflections as light patches, duckweed
    waterMarsh: () => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, '#2a5a48', 0, 0, 64, 64);
      veil(g, 0.5, () => { for (let i = 0; i < 16; i++) R(g, '#14342c', rand() * 52 | 0, rand() * 52 | 0, 8 + rand() * 12 | 0, 6 + rand() * 10 | 0); });
      veil(g, 0.4, () => { for (let i = 0; i < 12; i++) R(g, '#a9bb7e', rand() * 54 | 0, rand() * 58 | 0, 6 + rand() * 8 | 0, 2 + (rand() * 2 | 0)); }); veil(g, 0.7, () => scatter(g, o, 70, ['#7fa83a', '#5f8a34'], 2, 1)); }, 12],
    // the falls: a white ribbon striated lengthwise, dark gaps (the rock behind)
    dropWire: () => [32, 64, (g, o) => { const { R, rand, veil } = o; R(g, '#d4e6e2', 0, 0, 32, 64); // falling water, not a block of light: bluish background, light and dark streaks, holes
      veil(g, 0.6, () => { for (let i = 0; i < 40; i++) R(g, rand() < 0.5 ? '#8fb4b4' : '#ffffff', rand() * 32 | 0, rand() * 50 | 0, 1 + (rand() * 2 | 0), 10 + rand() * 34 | 0); });
      veil(g, 0.7, () => { for (let i = 0; i < 12; i++) R(g, '#4a6a68', rand() * 32 | 0, rand() * 50 | 0, 1, 6 + rand() * 18 | 0); }); }],
    // the cave rock (th.tun.tex: tunnel walls and vault): dark strata, wet edges catching the torchlight, water runnels, moss; the engine's arguments (tunnel tints) are not used
    rockCave: () => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, '#39362e', 0, 0, 64, 64);
      veil(g, 0.5, () => { for (let i = 0; i < 30; i++) R(g, rand() < 0.5 ? '#24221c' : '#4a463a', rand() * 56 | 0, rand() * 62 | 0, 8 + rand() * 22 | 0, 2 + rand() * 6 | 0); });
      veil(g, 0.6, () => { for (let i = 0; i < 14; i++) R(g, '#15140f', rand() * 60 | 0, rand() * 56 | 0, 1 + (rand() * 2 | 0), 6 + rand() * 16 | 0); });
      veil(g, 0.45, () => { for (let i = 0; i < 18; i++) R(g, '#8a8468', rand() * 58 | 0, rand() * 63 | 0, 3 + rand() * 9 | 0, 1); });
      veil(g, 0.35, () => { for (let i = 0; i < 9; i++) R(g, '#7fa8a0', rand() * 63 | 0, rand() * 40 | 0, 1, 10 + rand() * 22 | 0); });
      veil(g, 0.5, () => { for (let i = 0; i < 12; i++) R(g, '#3f5a2a', rand() * 58 | 0, rand() * 60 | 0, 3 + rand() * 6 | 0, 2 + rand() * 3 | 0); }); }],
    // the cave vault: the same rock, but calm (large low-contrast patches, no fine lines); the strata of rockCave, stretched by the vault and seen grazing, were shimmering
    vaultCave: () => [32, 32, (g, o) => { const { R, rand, veil } = o; R(g, '#2c2a24', 0, 0, 32, 32);
      veil(g, 0.35, () => { for (let i = 0; i < 9; i++) R(g, rand() < 0.5 ? '#24221c' : '#36332b', rand() * 24 | 0, rand() * 24 | 0, 8 + rand() * 8 | 0, 8 + rand() * 8 | 0); }); }],
    // falling water, made to scroll (scenery-chapada.js slides the texture downward each frame): pale and bluish streaks on a translucent veil, holed where the rock shows through;
    // everything loops vertically (each streak is drawn twice, at y and y - 64). holes: number of gaps (the front sheet has more: the first shows through it)
    waterDrop: (boreHoles = 6) => [32, 64, (g, o) => { const { R, rand, veil } = o, B = (c, x, y, w, h) => { R(g, c, x, y, w, h); R(g, c, x, y - 64, w, h); };
      veil(g, 0.82, () => R(g, '#b9d6d2', 0, 0, 32, 64));
      veil(g, 0.75, () => { for (let i = 0; i < 44; i++) B(rand() < 0.45 ? '#86b2b4' : '#ffffff', rand() * 32 | 0, rand() * 64 | 0, 1 + (rand() * 2 | 0), 12 + rand() * 30 | 0); });
      veil(g, 0.55, () => { for (let i = 0; i < 10; i++) B('#3f6468', rand() * 32 | 0, rand() * 64 | 0, 1, 8 + rand() * 18 | 0); });
      for (let i = 0; i < boreHoles; i++) { const x = rand() * 30 | 0, y = rand() * 64 | 0, w = 1 + (rand() * 3 | 0), h = 14 + rand() * 26 | 0; g.clearRect(x, y, w, h); g.clearRect(x, y - 64, w, h); } }],
    // the basin's foam: white clumps on empty space, which loop; scenery-chapada.js makes it spread from the foot of the falls
    foamBasin: () => [32, 32, (g, o) => { const { R, rand, veil } = o;
      veil(g, 0.9, () => { for (let i = 0; i < 26; i++) { const x = rand() * 32 | 0, y = rand() * 32 | 0, w = 2 + (rand() * 5 | 0), h = 1 + (rand() * 3 | 0); for (const dx of [0, -32]) for (const dy of [0, -32]) R(g, rand() < 0.3 ? '#cfe6e0' : '#ffffff', x + dx, y + dy, w, h); } }); }],
    // sunlight glitter on the water: a few white sparkles on empty space, which loop; two crossing layers make them shimmer (scenery-chapada.js)
    sparkles: () => [32, 32, (g, o) => { const { R, rand } = o; for (let i = 0; i < 9; i++) { const x = rand() * 32 | 0, y = rand() * 32 | 0, w = 1 + (rand() * 2 | 0); for (const dx of [0, -32]) R(g, rand() < 0.4 ? '#fff6d8' : '#ffffff', x + dx, y, w, 1); } }],
    // the city's paved way (th.roadTex, same settings as roadway: slab, dark joint, light slab, moss): large worn quartzite slabs, mossy joints,
    // no paint or puddles (alpha stays full: nothing reflects the sky in white patches), wheel tracks polished and lighter
    slabsJungle: (slab, dark, clair, moss) => [128, 512, (g, o) => { const { R, rand, veil } = o; R(g, slab, 0, 0, 128, 512);
      for (let y = 0, r = 0; y < 512; r++) { const hh = 24 + (rand() * 3 | 0) * 8, y1 = Math.min(512, y + hh); // rows of slabs 1.5 to 2.5 m, staggered joints
        for (let x = -(r & 1) * 8 - (rand() * 8 | 0); x < 128;) { const ww = 14 + (rand() * 3 | 0) * 4; veil(g, 0.1 + rand() * 0.12, () => R(g, rand() < 0.5 ? dark : clair, x, y, ww, y1 - y)); veil(g, 0.75, () => R(g, '#2c3a20', x + ww - 1, y, 1, y1 - y)); x += ww; }
        veil(g, 0.75, () => R(g, '#2c3a20', 0, y1 - 1, 128, 1)); y = y1; }
      veil(g, 0.5, () => scatter(g, o, 500, [moss, '#2c3a20'], 1, 1, 128, 512)); veil(g, 0.14, () => scatter(g, o, 2400, ['#000', '#fff'], 1, 1, 128, 512));
      veil(g, 0.1, () => { for (const x of [36, 84]) R(g, clair, x, 0, 9, 512); });
      veil(g, 0.55, () => { for (let i = 0; i < 90; i++) { const sd = rand() < 0.5; R(g, rand() < 0.6 ? moss : '#7a5a30', sd ? rand() * 14 | 0 : 114 + (rand() * 14 | 0), rand() * 512 | 0, 2 + (rand() * 3 | 0), 2 + (rand() * 4 | 0)); } }); // moss and leaves on the first metre of each edge
    }],
    // the same slabs, for the widenings and squares (decor strip, from W to the drivable edge): no more moss, a pale row at the outer edge (u = 1)
    slabsEdge: () => [64, 128, (g, o) => { const { R, rand, veil } = o; R(g, '#77725f', 0, 0, 64, 128);
      for (let y = 0; y < 128; y += 16) for (let x = -(y & 16) / 2; x < 64; x += 16) { veil(g, 0.1 + rand() * 0.14, () => R(g, rand() < 0.5 ? '#5e5a4c' : '#8a8672', x, y, 16, 16)); veil(g, 0.75, () => { R(g, '#2c3a20', x, y, 1, 16); R(g, '#2c3a20', x, y, 16, 1); }); }
      veil(g, 0.55, () => scatter(g, o, 220, ['#4d6a34', '#7fa83a', '#7a5a30'], 2, 2, 64, 128)); veil(g, 0.3, () => R(g, '#b0aa94', 56, 0, 8, 128)); }, 5],
    // low stone kerb and embankment: mossy stone; city stone: pink quartzite, in shade, black plinth
    curbMoss: stone('#6a6656', 0.8), stoneCity: stone('#b09a86', 0.45), stonePale: stone('#cbb8a0', 0.3), stoneShade: stone('#6a5e56', 0.6), plinthBlack: stone('#26221f', 0.25),
    // the triple arch's attic: lines of unknown signs carved in it (Manuscript 512)
    inscription512: () => [128, 16, (g, o) => { const { R, rand, veil } = o; R(g, '#b8a48e', 0, 0, 128, 16); veil(g, 0.2, () => scatter(g, o, 120, ['#000', '#fff'], 1, 1, 128, 16));
      for (const y of [3, 10]) for (let x = 3; x < 124; x += 4 + (rand() * 2 | 0)) { const k = rand() * 5 | 0; R(g, '#3a2e26', x, y, k === 0 ? 3 : 1, 4); if (k > 1) R(g, '#3a2e26', x, y + (k === 2 ? 0 : 3), 3, 1); if (k === 4) R(g, '#3a2e26', x + 2, y, 1, 4); } }],
    // raw canvas of the tents, uneven planks of the bridge, bamboo
    clothTent: () => [32, 32, (g, o) => { const { R, veil } = o; R(g, '#d8c89a', 0, 0, 32, 32); veil(g, 0.14, () => scatter(g, o, 80, ['#000', '#fff'], 2, 1, 32, 32)); veil(g, 0.3, () => { R(g, '#8a7a50', 0, 15, 32, 1); R(g, '#8a7a50', 15, 0, 1, 32); }); }],
    boardsBridge: () => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, '#6a5236', 0, 0, 64, 64);
      for (let y = 0; y < 64; y += 8) { veil(g, 0.1 + rand() * 0.25, () => R(g, rand() < 0.5 ? '#000' : '#e8c890', 0, y, 64, 8)); veil(g, 0.8, () => R(g, '#1c140c', 0, y + 7, 64, 1)); const e = rand() * 5 | 0; veil(g, 0.8, () => { R(g, '#1c140c', 0, y, e, 8); R(g, '#1c140c', 64 - (rand() * 5 | 0), y, 5, 8); }); }
      veil(g, 0.2, () => scatter(g, o, 160, ['#000', '#fff'], 3, 1)); veil(g, 0.5, () => scatter(g, o, 14, ['#4d6a34'], 3, 2)); }],
    bamboo: () => [16, 32, (g, o) => { const { R, veil } = o; R(g, '#b0a45a', 0, 0, 16, 32); veil(g, 0.2, () => scatter(g, o, 40, ['#000', '#fff'], 1, 3, 16, 32)); veil(g, 0.5, () => { for (let y = 5; y < 32; y += 8) R(g, '#5a5028', 0, y, 16, 1); }); }],
  });
})();

