// Textures specific to "plage" (Playa 307, Riviera Maya at noon): completes the texture catalogue of textures.js, same conventions. See docs/methods/SCENERY.md.
(() => {
  const grain = (g, o, n, cols, w = 64, h = 64) => { for (let i = 0; i < n; i++) o.R(g, cols[o.rand() * cols.length | 0], o.rand() * w | 0, o.rand() * h | 0, 1, 1); };
  Object.assign(TEXTURES, {
    // fine noise of the large beach areas (sand, ground, rock, water; the grain() of scenery-plage.js): 128 px for the noise tile (64), 8 to 11 px/m.
    // Draws in rnd exactly like noise (the scenery doesn't move) and keeps its drawing, doubled and veiled, for the broad patches; the fine grain is drawn with rand.
    // k: strength of the fine grain (the track is calmer than its surroundings)
    noiseFine: (backdrop, grains, k = 1) => [128, 128, (g, { R, rnd, rand, veil }) => {
      R(g, backdrop, 0, 0, 128, 128);
      veil(g, 0.22 * k, () => { for (const c of grains) for (let i = 0; i < 160; i++) R(g, c, (rnd() * 64 | 0) * 2, (rnd() * 64 | 0) * 2, (1 + (rnd() * 2 | 0)) * 2, 2); });
      veil(g, k, () => { for (const c of grains) for (let i = 0; i < 700; i++) R(g, c, rand() * 128 | 0, rand() * 128 | 0, 1 + (rand() * 2 | 0), 1); });
    }],
    // dry beach sand: almost white, grains, small wind ripples, footprints
    sandDry: () => [64, 64, (g, o) => {
      const { R, rand, veil } = o; R(g, '#cab890', 0, 0, 64, 64); grain(g, o, 700, ['#baa680', '#dccca6', '#ae9a74']);
      veil(g, 0.25, () => { for (let y = 2; y < 64; y += 5) for (let x = 0; x < 64; x += 2) R(g, '#bfae85', x, y + (Math.sin(x * 0.3 + y) * 1.5 | 0), 2, 1); });
      for (let i = 0; i < 10; i++) { const x = rand() * 60 | 0, y = rand() * 60 | 0; R(g, '#d6c8a4', x, y, 2, 3); R(g, '#d6c8a4', x + 3, y + 4, 2, 3); }
    }, 6],
    // hard, wet sand in the middle of the beach (the track): darker, smoothed, tire tracks along it, line of shells
    sandHard: () => [64, 256, (g, o) => {
      const { R, rand, veil } = o; R(g, '#665638', 0, 0, 64, 256); grain(g, o, 1400, ['#5a4c30', '#726244', '#4e422a'], 64, 256);
      veil(g, 0.3, () => { for (const x of [14, 22, 40, 49]) for (let y = 0; y < 256; y += 2) R(g, '#a8966c', x + (Math.sin(y * 0.05 + x) * 2 | 0), y, 3, 2); }); // ruts
      veil(g, 0.25, () => { for (let i = 0; i < 12; i++) R(g, '#fff4dc', rand() * 64 | 0, rand() * 256 | 0, 6 + (rand() * 14 | 0), 2); }); // reflections of the water left behind
      for (let i = 0; i < 40; i++) R(g, rand() < 0.5 ? '#fff8f0' : '#e8a890', rand() * 64 | 0, rand() * 256 | 0, 1, 1); // coquillages
    }],
    // Caribbean sea seen up close: turquoise, light ripples, sun glints
    seaTurquoise: () => [64, 64, (g, o) => {
      const { R, rand, veil } = o; R(g, '#10a2c0', 0, 0, 64, 64);
      veil(g, 0.5, () => { for (let i = 0; i < 60; i++) R(g, rand() < 0.5 ? '#12b0bc' : '#2fd8d4', rand() * 64 | 0, rand() * 64 | 0, 6 + (rand() * 16 | 0), 2 + (rand() * 2 | 0)); });
      for (let i = 0; i < 80; i++) R(g, '#7eeee6', rand() * 64 | 0, rand() * 64 | 0, 2 + (rand() * 6 | 0), 1);
      for (let i = 0; i < 26; i++) R(g, '#ffffff', rand() * 64 | 0, rand() * 64 | 0, 1 + (rand() * 3 | 0), 1);
    }, 10],
    // open sea: deep blue, fewer details
    seaWide: () => [64, 64, (g, o) => {
      const { R, rand, veil } = o; R(g, '#0a4a86', 0, 0, 64, 64);
      veil(g, 0.5, () => { for (let i = 0; i < 50; i++) R(g, rand() < 0.5 ? '#0c6e98' : '#1592b8', rand() * 64 | 0, rand() * 64 | 0, 8 + (rand() * 18 | 0), 2); });
      for (let i = 0; i < 30; i++) R(g, '#8fd8ee', rand() * 64 | 0, rand() * 64 | 0, 2 + (rand() * 4 | 0), 1);
    }, 24],
    // water's-edge foam: torn white fringes on a transparent background, brown sargassum on the sand side (top of the texture)
    foamSea: () => [64, 16, (g, o) => {
      const { R, rand } = o;
      for (let x = 0; x < 64; x++) { const a = 4 + (Math.sin(x * 0.4) * 2 + rand() * 3 | 0); R(g, '#ffffff', x, a, 1, 16 - a - (rand() * 4 | 0)); if (rand() < 0.5) R(g, '#8a6a2a', x, 1 + (rand() * 2 | 0), 1, 2); }
      for (let i = 0; i < 30; i++) R(g, '#bff4f0', rand() * 64 | 0, 8 + (rand() * 8 | 0), 2, 1);
    }],
    // light street slabs: large limestone plates, joints, stains
    slabsStreet: () => [64, 64, (g, o) => {
      const { R, rand, veil } = o; R(g, '#cdbf9e', 0, 0, 64, 64);
      for (let y = 0; y < 64; y += 16) for (let x = (y / 16 & 1) * 10; x < 74; x += 20) { R(g, ['#cdbf9e', '#c2b290', '#d8ccae', '#bcae8c'][rand() * 4 | 0], x, y, 19, 15); }
      grain(g, o, 500, ['#cfc2a4', '#f4ecdc']);
      for (let y = 15; y < 64; y += 16) R(g, '#7a6c50', 0, y, 64, 1);
      for (let y = 0; y < 64; y += 16) for (let x = (y / 16 & 1) * 10 + 19; x < 64; x += 20) R(g, '#a89a7a', x, y, 1, 15);
      veil(g, 0.15, () => { for (let i = 0; i < 6; i++) R(g, '#6a5a3a', rand() * 60 | 0, rand() * 60 | 0, 3 + (rand() * 5 | 0), 2 + (rand() * 3 | 0)); });
    }, 8],
    // lobby tiling: white tiles, turquoise border, joints, wet reflections
    tiling: () => [64, 64, (g, o) => {
      const { R, rand, veil } = o; R(g, '#e4d8c0', 0, 0, 64, 64);
      for (let y = 0; y < 64; y += 8) for (let x = 0; x < 64; x += 8) { R(g, (x + y) % 16 ? '#dccfb4' : '#ece2cc', x, y, 8, 8); R(g, '#c8b898', x, y, 8, 1); R(g, '#c8b898', x, y, 1, 8); }
      for (let x = 0; x < 64; x += 8) { R(g, '#1fb5a8', x + 2, 26, 4, 4); R(g, '#1fb5a8', x + 3, 33, 2, 2); }
      veil(g, 0.3, () => { for (let i = 0; i < 8; i++) R(g, '#ffffff', rand() * 56 | 0, rand() * 60 | 0, 8, 2); });
    }, 4],
    // street render facade: the tint comes from option c (light texture); dark-framed windows, door, plinth
    facadePlaya: () => [64, 64, (g, o) => {
      const { R, rand, veil } = o; R(g, '#ffffff', 0, 0, 64, 64); grain(g, o, 300, ['#f0f0f0', '#e4e4e4']);
      veil(g, 0.12, () => { for (let i = 0; i < 6; i++) R(g, '#000', rand() * 60 | 0, 0, 2, 20 + (rand() * 40 | 0)); }); // coulures
      for (const x of [6, 26, 46]) { R(g, '#4a3424', x, 8, 12, 14); R(g, '#1a2a30', x + 1, 9, 10, 12); R(g, '#fff4e0', x - 1, 22, 14, 2); } // upper floor
      R(g, '#4a3424', 8, 38, 14, 26); R(g, '#2a1c14', 9, 39, 12, 25); for (const x of [30, 46]) { R(g, '#4a3424', x, 40, 12, 14); R(g, '#1a2a30', x + 1, 41, 10, 12); }
      veil(g, 0.25, () => R(g, '#000', 0, 58, 64, 6));
    }],
    // papel picado: cut-paper pennant (white, the tint comes from the instance); diamond and flower holes, scalloped edge; transparent elsewhere
    papelPicado: () => [32, 40, (g, o) => {
      const { R } = o; R(g, '#ffffff', 0, 0, 32, 36);
      for (let x = 0; x < 32; x += 4) R(g, '#ffffff', x + 1, 36, 2, 3);
      g.globalCompositeOperation = 'destination-out';
      for (let y = 6; y < 34; y += 7) for (let x = 4 + (y % 2) * 3; x < 30; x += 7) { R(g, '#000', x, y, 3, 1); R(g, '#000', x + 1, y - 1, 1, 3); }
      R(g, '#000', 13, 14, 6, 6); R(g, '#000', 15, 12, 2, 10); R(g, '#000', 11, 16, 10, 2);
      g.globalCompositeOperation = 'source-over';
    }],
    // palapa thatch: dry palm leaves in overlapping rows
    thatch: () => [64, 64, (g, o) => {
      const { R, rand } = o; R(g, '#c9a05a', 0, 0, 64, 64);
      for (let y = 0; y < 64; y += 8) { for (let i = 0; i < 90; i++) R(g, ['#b08440', '#dcb878', '#a87a38', '#e4c48a'][rand() * 4 | 0], rand() * 64 | 0, y + (rand() * 8 | 0), 1, 3 + (rand() * 5 | 0)); R(g, '#6a4a22', 0, y + 7, 64, 1); }
    }, 3],
    // cenote limestone: beige and gray strata, moss spots, holes; the top of the texture is the top of the wall
    limestone: () => [64, 64, (g, o) => {
      const { R, rand, veil } = o; let y = 0;
      for (const [c, hh] of [['#6a8a3a', 3], ['#cbbf9c', 9], ['#b8a880', 6], ['#d4c8a6', 10], ['#a89a76', 7], ['#c4b690', 9], ['#8a7e62', 8], ['#b4a684', 12]]) { R(g, c, 0, y, 64, hh); for (let x = 0; x < 64; x += 3) if (rand() < 0.4) R(g, c, x, y - 1, 3, 2); y += hh; }
      grain(g, o, 400, ['#9a8c6a', '#ded2b2']);
      veil(g, 0.35, () => { for (let i = 0; i < 14; i++) R(g, '#3e6a2a', rand() * 60 | 0, rand() * 60 | 0, 2 + (rand() * 5 | 0), 2 + (rand() * 4 | 0)); });
      for (let i = 0; i < 10; i++) { const x = rand() * 60 | 0, y = 4 + rand() * 56 | 0; R(g, '#4a4030', x, y, 3, 2); }
    }, 8],
    // shallow cenote water: bright turquoise, the sand and rock bottom visible, wavering light spots
    waterCenote: () => [64, 64, (g, o) => {
      const { R, rand, veil } = o; R(g, '#1fd6b0', 0, 0, 64, 64);
      veil(g, 0.45, () => { for (let i = 0; i < 40; i++) R(g, rand() < 0.5 ? '#0b6b78' : '#14a89a', rand() * 64 | 0, rand() * 64 | 0, 4 + (rand() * 12 | 0), 3 + (rand() * 8 | 0)); });
      for (let i = 0; i < 70; i++) { const x = rand() * 64 | 0, y = rand() * 64 | 0; R(g, '#8ff4dc', x, y, 3 + (rand() * 4 | 0), 1); R(g, '#8ff4dc', x + 2, y + 1, 1, 1); }
    }, 8],
    // curtain of vines and roots hanging from the cenote lip: green and beige strands, transparent between them; the top of the texture is the top
    vines: () => [32, 64, (g, o) => {
      const { R, rand } = o;
      for (let i = 0; i < 18; i++) { const x = rand() * 32 | 0, l = 20 + rand() * 44 | 0, c = rand() < 0.6 ? '#4c8f2a' : '#d9c9a0'; for (let y = 0; y < l; y++) R(g, c, x + (Math.sin(y * 0.2 + i) * 1.2 | 0), y, 1, 1); if (c === '#4c8f2a') for (let y = 2; y < l; y += 5) R(g, '#6db845', x - 1, y, 3, 2); }
    }],
    // coastal scrubland ground: light ochre limestone sand, pebbles, dry tufts
    groundGarrigue: () => [64, 64, (g, o) => {
      const { R, rand, veil } = o; R(g, '#b49a6c', 0, 0, 64, 64); grain(g, o, 600, ['#a0865a', '#c8b084', '#94784c']);
      veil(g, 0.3, () => { for (let i = 0; i < 10; i++) R(g, '#c0a070', rand() * 56 | 0, rand() * 56 | 0, 6 + (rand() * 10 | 0), 4 + (rand() * 8 | 0)); });
      for (let i = 0; i < 40; i++) { const x = rand() * 62 | 0, y = rand() * 62 | 0; R(g, rand() < 0.6 ? '#7a8a3a' : '#5a7030', x, y, 2, 2); }
      for (let i = 0; i < 30; i++) R(g, '#f4ecd8', rand() * 64 | 0, rand() * 64 | 0, 2, 1);
    }, 8],
    // striped canvas of the street stalls and parasols: bands of two colors
    toldo: (a, b) => [32, 32, (g, o) => { const { R } = o; for (let x = 0; x < 32; x += 8) { R(g, a, x, 0, 4, 32); R(g, b, x + 4, 0, 4, 32); } o.veil(g, 0.15, () => R(g, '#000', 0, 28, 32, 4)); }, 2],
    // speed bumps: hump painted yellow and black across the road
    topes: () => [64, 16, (g, o) => { const { R } = o; for (let x = 0; x < 64; x += 16) { R(g, '#f7d36b', x, 0, 8, 16); R(g, '#1a1a1a', x + 8, 0, 8, 16); } o.veil(g, 0.25, () => { for (let i = 0; i < 60; i++) R(g, '#000', o.rand() * 64 | 0, o.rand() * 16 | 0, 2, 1); }); }],
    // light ray in the cave: soft vertical band, warm white in the center, transparent at the edges and downward (to render additively)
    arcRadius: () => [16, 64, (g) => {
      for (let y = 0; y < 64; y++) for (let x = 0; x < 16; x++) { const a = Math.max(0, 1 - Math.abs(x - 7.5) / 8) ** 1.5 * (1 - y / 64) * 0.4; g.fillStyle = `rgba(255,243,192,${a.toFixed(3)})`; g.fillRect(x, y, 1, 1); }
    }],

    // ---------- V2 ----------
    // wet sand of the sea line, between dry sand and foam: darker, smooth, sky reflections in streaks
    sandDamp: () => [64, 64, (g, o) => {
      const { R, rand, veil } = o; R(g, '#a89270', 0, 0, 64, 64); grain(g, o, 500, ['#9a8462', '#b49e7c', '#8e7a58']);
      veil(g, 0.35, () => { for (let i = 0; i < 16; i++) R(g, '#c4d4d0', rand() * 64 | 0, rand() * 64 | 0, 10 + (rand() * 20 | 0), 1 + (rand() * 2 | 0)); });
      for (let i = 0; i < 20; i++) R(g, '#5a4a30', rand() * 64 | 0, rand() * 64 | 0, 2, 1); // sargassum debris
    }, 6],
    // sea at the shore, over white sand: light aquamarine, ripples and light spots
    seaEdge: () => [64, 64, (g, o) => {
      const { R, rand, veil } = o; R(g, '#a4ecd8', 0, 0, 64, 64);
      veil(g, 0.5, () => { for (let i = 0; i < 50; i++) R(g, rand() < 0.5 ? '#74d6c0' : '#a8ecd8', rand() * 64 | 0, rand() * 64 | 0, 8 + (rand() * 14 | 0), 2); });
      for (let i = 0; i < 70; i++) R(g, '#c8fbf2', rand() * 64 | 0, rand() * 64 | 0, 2 + (rand() * 5 | 0), 1);
    }, 8],
    // tire and footprint tracks on the soft sand of the wide beach: dark grooves, transparent elsewhere (laid over the sand)
    sandTraces: () => [64, 128, (g, o) => {
      const { R, rand } = o;
      for (const x0 of [8, 15, 30, 37, 50]) for (let y = 0; y < 128; y++) { const x = x0 + Math.sin(y * 0.04 + x0) * 4 | 0; R(g, 'rgba(120,96,60,0.45)', x, y, 3, 1); if (rand() < 0.3) R(g, 'rgba(250,240,220,0.5)', x + 3, y, 1, 1); }
      for (let i = 0; i < 40; i++) R(g, 'rgba(120,96,60,0.35)', rand() * 62 | 0, rand() * 126 | 0, 2, 3);
    }],
    // mangrove lagoon water: green-tinted water, darker than the sea, sky reflections in bands
    waterLagoon: () => [64, 64, (g, o) => {
      const { R, rand, veil } = o; R(g, '#4a7464', 0, 0, 64, 64);
      veil(g, 0.5, () => { for (let i = 0; i < 40; i++) R(g, rand() < 0.5 ? '#3e6656' : '#58806e', rand() * 64 | 0, rand() * 64 | 0, 10 + (rand() * 20 | 0), 2); });
      for (let i = 0; i < 40; i++) R(g, '#a8e0e0', rand() * 64 | 0, rand() * 64 | 0, 3 + (rand() * 6 | 0), 1);
    }, 12],
    // limestone riprap at the foot of the lagoon causeway: light gray blocks, shadows between them
    riprap: () => [64, 32, (g, o) => {
      const { R, rand } = o; R(g, '#4a4638', 0, 0, 64, 32);
      for (let i = 0; i < 40; i++) { const x = rand() * 60 | 0, y = rand() * 28 | 0, w = 5 + (rand() * 9 | 0), hh = 4 + (rand() * 6 | 0); R(g, ['#b8b0a0', '#a49c8a', '#c8c0ae', '#8e8676'][rand() * 4 | 0], x, y, w, hh); R(g, '#e0dac8', x, y, w, 1); }
    }, 4],
    // cenote cave wall (sheet 6): the bottom of the texture is the foot of the wallFace. Limestone streaked with flowstone (draperies), darker and glossy at the foot, turquoise edge from the water reflection
    faceCave: () => [64, 128, (g, o) => {
      const { R, rand, veil } = o; R(g, '#8a7a5e', 0, 0, 64, 128);
      for (let y = 0; y < 128; y += 4) R(g, ['#8a7a5e', '#7a6c52', '#9a8a6c', '#6e6048'][rand() * 4 | 0], 0, y, 64, 4);
      for (let i = 0; i < 26; i++) { const x = rand() * 64 | 0, y0 = rand() * 40 | 0, l = 30 + rand() * 80 | 0, c = rand() < 0.5 ? '#c8b894' : '#a8966e'; for (let y = y0; y < Math.min(128, y0 + l); y++) R(g, c, x + (Math.sin(y * 0.15 + i) * 1.3 | 0), y, 2 + (i % 2), 1); }
      veil(g, 0.5, () => R(g, '#2a2418', 0, 96, 64, 32)); veil(g, 0.3, () => R(g, '#2a2418', 0, 0, 64, 18)); // wet foot, high up in shadow
      for (let x = 0; x < 64; x++) { R(g, '#3fd8c0', x, 112 + (Math.sin(x * 0.4) * 2 | 0), 1, 2); if (rand() < 0.4) R(g, '#9ff4e4', x, 110 + (rand() * 6 | 0), 1, 1); } // reflets de l'eau
      grain(g, o, 500, ['#5a4e3a', '#b0a080'], 64, 128);
    }],
    // underground cenote water: bright turquoise over a sand bottom, darker toward the depths (the top of the texture is the wall's edge), wavering light network
    waterCave: () => [64, 64, (g, o) => {
      const { R, rand, veil } = o; for (let y = 0; y < 64; y++) R(g, 'rgb(' + (10 + y * 0.2 | 0) + ',' + (50 + y * 1.6 | 0) + ',' + (80 + y * 1.0 | 0) + ')', 0, y, 64, 1);
      veil(g, 0.5, () => { for (let i = 0; i < 90; i++) { const x = rand() * 64 | 0, y = rand() * 64 | 0; R(g, '#9ff8e8', x, y, 4 + (rand() * 5 | 0), 1); R(g, '#9ff8e8', x + 3, y + 1, 1, 2); } });
      veil(g, 0.3, () => { for (let i = 0; i < 12; i++) R(g, '#0a3a44', rand() * 60 | 0, rand() * 24 | 0, 6, 3); }); // submerged rocks
    }],
    // roots hanging through the ceiling hole (sheet 6, Samula): brown and beige strands, transparent between them; the top of the texture is the top
    roots: () => [12, 128, (g, o) => {
      const { R, rand } = o;
      for (let i = 0; i < 22; i++) { const x = rand() * 12, l = 50 + rand() * 78 | 0, c = ['#c8b488', '#dcc8a0', '#b49c70', '#a08a5c'][rand() * 4 | 0]; for (let y = 0; y < l; y++) R(g, c, x + Math.sin(y * 0.07 + i) * 2 | 0, y, rand() < 0.2 ? 2 : 1, 1); }
    }],
    // volumetric light ray (open cone): warm white at the top, fading downward, vertical streaks (rendered additively)
    rayCone: () => [32, 64, (g) => {
      for (let y = 0; y < 64; y++) for (let x = 0; x < 32; x++) { const a = (0.55 + 0.45 * Math.sin(x / 32 * Math.PI * 6) ** 2) * (1 - y / 64) ** 0.7 * 0.95; g.fillStyle = 'rgba(255,240,190,' + a.toFixed(3) + ')'; g.fillRect(x, y, 1, 1); }
    }],
    // round light spot (ceiling hole seen from below, sun on the ground): light disc with soft edges, transparent around
    stain: (c = '255,246,210') => [64, 64, (g) => {
      for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { const d = Math.hypot(x - 31.5, y - 31.5) / 32, a = Math.max(0, Math.min(1, (1 - d) * 2.2)); g.fillStyle = 'rgba(' + c + ',' + a.toFixed(3) + ')'; g.fillRect(x, y, 1, 1); }
    }],
    // red mangrove foliage: deep green, waxy reflections
    leavesMangrove: () => [64, 64, (g, o) => { const { R, rand } = o; R(g, '#2a4a1e', 0, 0, 64, 64); grain(g, o, 900, ['#1e3a16', '#3a6228', '#4a7a30', '#16301a']); for (let i = 0; i < 40; i++) R(g, '#6a9a44', rand() * 64 | 0, rand() * 64 | 0, 2, 1); }, 3],
    // beach-volleyball net: white mesh, top band; transparent between the meshes
    nettingVolley: () => [64, 16, (g, o) => { const { R } = o; for (let x = 0; x < 64; x += 4) R(g, '#f4f0e8', x, 0, 1, 16); for (let y = 0; y < 16; y += 4) R(g, '#f4f0e8', 0, y, 64, 1); R(g, '#f4f0e8', 0, 0, 64, 2); }],
    // light ray in plan (crossed): soft vertical band, warm white, sharper than the catalogue ray (rendered additively)
    rayStrong: () => [16, 64, (g) => {
      for (let y = 0; y < 64; y++) for (let x = 0; x < 16; x++) { const a = Math.max(0, 1 - Math.abs(x - 7.5) / 8) ** 1.3 * (1 - y / 64) ** 0.6 * 0.85; g.fillStyle = 'rgba(255,243,200,' + a.toFixed(3) + ')'; g.fillRect(x, y, 1, 1); }
    }],
    // facade awnings: striped canvas in three colors by height (red, turquoise, yellow): each facade shows one band, without an extra drawing pass
    toldoMulti: () => [32, 96, (g, o) => { const { R } = o; ['#e8402a', '#1f9a96', '#e8a800'].forEach((c, k) => { for (let x = 0; x < 32; x += 8) { R(g, '#fff4e0', x, k * 32, 4, 32); R(g, c, x + 4, k * 32, 4, 32); } }); }, 2],
    // soft light column (open cone): same veil all around, fading downward, no streaks that draw edges (rendered additively)
    raySoft: () => [8, 64, (g) => { for (let y = 0; y < 64; y++) { g.fillStyle = 'rgba(255,240,200,' + ((1 - y / 64) ** 1.2 * 0.4).toFixed(3) + ')'; g.fillRect(0, y, 8, 1); } }],
  });
})();

// Textures from the redesign. Rule DA-10: no sinusoidal line or periodic stripe along the direction of travel over a large surface.
(() => {
  Object.assign(TEXTURES, {
    // festival bunting string (T-2): triangles pointing down in three accents (pink, turquoise, yellow), transparent background; repeats along the string
    streamerPlage: () => [96, 16, (g, { R }) => { g.clearRect(0, 0, 96, 16); ['#e8468c', '#1fb5a8', '#f2c230', '#e8468c', '#f2c230', '#1fb5a8'].forEach((c, k) => { g.fillStyle = c; g.beginPath(); g.moveTo(k * 16 + 1, 1); g.lineTo(k * 16 + 15, 1); g.lineTo(k * 16 + 8, 15); g.fill(); }); R(g, '#4a3a2c', 0, 0, 96, 1); }],
    // string of colored bulbs (cave, muelle): a wire and bulbs in the three accents, transparent background
    bulbs: () => [96, 8, (g, { R }) => { g.clearRect(0, 0, 96, 8); R(g, '#2a2420', 0, 1, 96, 1); ['#ffd070', '#e8468c', '#1fb5a8', '#ffd070', '#f2c230', '#e8468c'].forEach((c, k) => { R(g, c, k * 16 + 6, 2, 3, 4); }); }],
    // Quinta paving (REFS §3): brick-pink paving stones of uneven sizes, light stone bands across every 8 m; neighboring tints, no fine periodic pattern
    pavingQuinta: () => [64, 64, (g, { R, rand }) => { R(g, '#b9776a', 0, 0, 64, 64); for (let y = 0; y < 64; y += 4) for (let x = (y / 4 & 1) * 3; x < 64; x += 6 + (rand() * 3 | 0)) R(g, ['#ad6c60', '#c58476', '#b47266', '#bd7d70'][rand() * 4 | 0], x, y, 5 + (rand() * 2 | 0), 3); R(g, '#cfc8b8', 0, 0, 64, 4); for (let i = 0; i < 60; i++) R(g, '#9a5e54', rand() * 64 | 0, rand() * 64 | 0, 1, 1); }, 8],
    // muelle planks (DA-10): across the walk, uneven widths and tints, dark joints, a few nails; no regular stripes
    boardsQuay: () => [64, 64, (g, { R, rand }) => { let y = 0; while (y < 64) { const l = 3 + (rand() * 4 | 0); R(g, ['#b7a98c', '#a89a7e', '#c2b498', '#9e9076', '#b0a286'][rand() * 5 | 0], 0, y, 64, l); R(g, '#6e624e', 0, y + l - 1, 64, 1); for (let k = 0; k < 3; k++) R(g, '#8a7c66', rand() * 64 | 0, y + (rand() * (l - 1) | 0), 2 + (rand() * 5 | 0), 1); y += l; } }, 8],
    // render facade: light grain, dirt at the foot, for the tinted zone of houses and resorts
    stuccoPale: () => [64, 64, (g, { R, rand, veil }) => { R(g, '#f4f0e8', 0, 0, 64, 64); for (let i = 0; i < 260; i++) R(g, rand() < 0.5 ? '#e8e2d8' : '#fffdf6', rand() * 64 | 0, rand() * 64 | 0, 1 + (rand() * 2 | 0), 1); veil(g, 0.12, () => R(g, '#6a5a44', 0, 56, 64, 8)); }, 8],
    // ---------- life ----------
    // crest of foam from a wave, seen from above: torn white fringe, transparent around
    foamWide: () => [64, 16, (g, { R, rand }) => { for (let x = 0; x < 64; x++) { const a = 5 + (Math.sin(x * 0.3) * 2 + rand() * 3 | 0), l = 3 + (rand() * 5 | 0); if (rand() < 0.85) R(g, '#ffffff', x, a, 1, l); if (rand() < 0.3) R(g, '#d8f6f2', x, a - 2 - (rand() * 2 | 0), 1, 1); } }],
    // water reflections on rock (caustics): light rings crossing each other on a black background, tiled edge to edge; to render additively
    caustic: () => [64, 64, (g, { R, rand }) => { R(g, '#000', 0, 0, 64, 64); g.strokeStyle = '#bfeee4'; g.lineWidth = 1.4;
      for (let k = 0; k < 9; k++) { const x = (k % 3) * 21.3 + rand() * 12, y = (k / 3 | 0) * 21.3 + rand() * 12, rx = 8 + rand() * 6, ry = 7 + rand() * 6, a = rand() * 3;
        for (const dx of [-64, 0, 64]) for (const dy of [-64, 0, 64]) { g.beginPath(); g.ellipse(x + dx, y + dy, rx, ry, a, 0, 6.2832); g.stroke(); } } }],
  });
})();
