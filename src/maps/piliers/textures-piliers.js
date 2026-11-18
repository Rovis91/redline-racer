// Textures specific to "piliers" (Sky Pillars): completes the textures.js catalogue (same conventions: 8 px per metre, a base tone, grain, joints, wear; `rand` only). See docs/ASSET-GENERATION.md.
// These are the shared materials of the map (docs/proposals/sky-pillars/AMBIANCE-V2.html): each one is used by several asset families, so each tint is one draw pass for the whole map.
(() => {
  const grain = (g, { R, rand, veil }, n, a = 0.18, S = 64) => veil(g, a, () => { for (let i = 0; i < n; i++) R(g, i % 3 ? '#000' : '#fff', rand() * S | 0, rand() * S | 0, 1 + (rand() * 2 | 0), 1); });
  Object.assign(TEXTURES, {
    // stacked quartz sandstone, c = its tint (sage grey near, salmon on the descent, blue-grey for the far needles), a = strength of beds and joints (1 near; 0.45 far, a silhouette), m = moss on the ledges (0 to 1).
    // 8 m per tile on the cut faces and 16 m on the towers: beds of uneven thickness and tone, a dark line under each, vertical joints that cross two or three beds, moss hanging from some ledges; rot = 1: turned a quarter, for a ribbon along the road (its u runs down the wall); v = another drawing of the same rock, so neighbouring towers do not show the same tile
    gresPiliers: (c = '#9b9a7e', a = 1, m = 1, rot = 0, v = 0) => [64, 64, (g, o) => { const { R, rand, veil } = o; if (rot) g.setTransform(0, 1, 1, 0, 0, 0); R(g, c, 0, 0, 64, 64);
      const beds = []; for (let y = 0; y < 64;) { const ht = 4 + (rand() * 9 | 0); beds.push([y, ht]); y += ht; }
      veil(g, 0.13 * a, () => { for (const [y, ht] of beds) R(g, rand() < 0.5 ? '#000' : '#fff', 0, y, 64, ht); });
      veil(g, 0.09 * a, () => { for (const [y, ht] of beds) for (let x = 0; x < 64;) { const w = 6 + (rand() * 22 | 0); R(g, rand() < 0.5 ? '#000' : '#fff', x, y, w, ht); x += w; } }); // each bed in blocks of uneven tone, not one band
      veil(g, 0.42 * a, () => { for (const [y] of beds) if (rand() < 0.7) R(g, '#1a2420', rand() * 30 | 0, y, 20 + (rand() * 44 | 0), 1); for (let i = 0; i < 16; i++) { const [y, ht] = beds[rand() * beds.length | 0]; R(g, '#1a2420', rand() * 64 | 0, y, 1 + (i % 4 === 0), ht * (1 + (rand() * 4 | 0))); } });
      veil(g, 0.5 * a * m, () => { for (const [y] of beds) if (rand() < 0.4) for (let x = rand() * 20 | 0; x < 64; x += 2 + (rand() * 14 | 0)) R(g, '#4e7752', x, y + 1, 1 + (rand() * 4 | 0), 1 + (rand() * 2 | 0)); });
      veil(g, 0.55 * a * m, () => { for (let i = 0; i < 5; i++) { const [y] = beds[rand() * beds.length | 0], x = rand() * 56 | 0, w = 4 + (rand() * 9 | 0); R(g, '#3f6b46', x, y, w, 2 + (rand() * 2 | 0)); R(g, '#6fa05c', x + 1, y, w - 3, 1); for (let d = x; d < x + w; d += 2 + (rand() * 3 | 0)) R(g, '#3f6b46', d, y + 2, 1, 1 + (rand() * 5 | 0)); } }); // plants hanging from the ledges: a green band, a lit top, drips of ivy
      veil(g, 0.2 * a, () => { for (let i = 0; i < 3 + v; i++) { const x = rand() * 60 | 0, w = 2 + (rand() * 4 | 0), y = rand() * 30 | 0; R(g, i & 1 ? '#fff' : '#1a2420', x, y, w, 20 + (rand() * 40 | 0)); R(g, i & 1 ? '#fff' : '#1a2420', x + 1, y - 4, Math.max(1, w - 2), 4); } }); // long runs of damp and of pale lichen down the face
      grain(g, o, 240, 0.14); }, 8],
    // a whole far pillar on one tile (aiguilleLointainePiliers: u = half the way round, v = foot to summit), v = one of three drawings. No geometry is added on the far pillars: everything is painted.
    // From the top: a wooded cap with a ragged lower edge and trees standing out of it, strata of uneven tone with a few warm beds, dark eroded gullies with a lit lip, hollows, ledges carrying a green band and ivy,
    // trees clinging to the faces (a dark mass, a lit top), and the mist of the sea of clouds over the lower third. Pale base tone: each instance multiplies it by its own tint
    lointainPiliers: (v = 0) => [64, 128, (g, o) => { const { R, rand, veil } = o, GR = ['#2c5238', '#3f6f48', '#6fa860']; R(g, '#aeb4a8', 0, 0, 64, 128);
      veil(g, 0.14, () => { for (let y = 0; y < 128;) { const ht = 3 + (rand() * 8 | 0); R(g, rand() < 0.5 ? '#000' : '#fff', 0, y, 64, ht); y += ht; } });
      veil(g, 0.2, () => { for (let i = 0; i < 4 + v; i++) R(g, '#c89a6a', 0, 14 + (rand() * 90 | 0), 64, 2 + (rand() * 3 | 0)); });
      veil(g, 0.1, () => { for (let i = 0; i < 40; i++) R(g, i & 1 ? '#000' : '#fff', rand() * 64 | 0, rand() * 128 | 0, 6 + (rand() * 14 | 0), 3 + (rand() * 6 | 0)); });
      for (let i = 0; i < 9 + v; i++) { const x = rand() * 62 | 0, w = 1 + (rand() * 3 | 0), y = rand() * 50 | 0, l = 36 + (rand() * 70 | 0); veil(g, 0.42, () => R(g, '#22322e', x, y, w, l)); veil(g, 0.22, () => R(g, '#fff', x + w, y + 2, 1, l - 4)); } // gullies
      veil(g, 0.3, () => { for (let i = 0; i < 7; i++) { const x = rand() * 58 | 0, y = 12 + (rand() * 90 | 0), w = 3 + (rand() * 6 | 0), ht = 5 + (rand() * 10 | 0); R(g, '#22322e', x, y, w, ht); R(g, '#22322e', x + 1, y - 1, Math.max(1, w - 2), 1); } }); // hollows
      const tree = (x, y) => { R(g, GR[0], x, y, 3, 2); R(g, GR[0], x + 1, y - 1, 2, 1); R(g, GR[2], x, y - 1, 2, 1); };
      for (let i = 0; i < 6; i++) { const y = 16 + (rand() * 84 | 0), x0 = rand() * 40 | 0, w = 14 + (rand() * 40 | 0); veil(g, 0.5, () => R(g, '#1a2a24', x0, y + 2, w, 1)); // ledges
        for (let x = x0; x < x0 + w; x += 1 + (rand() * 3 | 0)) { R(g, GR[1], x % 64, y, 2, 2); if (rand() < 0.3) R(g, GR[1], x % 64, y + 2, 1, 1 + (rand() * 4 | 0)); if (rand() < 0.3) tree(x % 64, y - 1); } }
      for (let i = 0; i < 26; i++) tree(rand() * 61 | 0, 10 + (rand() * 96 | 0));
      for (let x = 0; x < 64; x += 2) { const d = 7 + (rand() * 8 | 0); R(g, GR[1], x, 0, 2, d); R(g, GR[0], x, d - 1, 2, 1 + (rand() * 3 | 0)); if (rand() < 0.5) R(g, GR[2], x, rand() * (d - 2) | 0, 2, 1); if (rand() < 0.25) R(g, GR[1], x, d, 1, 2 + (rand() * 6 | 0)); } // the cap
      [[60, 0.12], [72, 0.24], [84, 0.38], [96, 0.52]].forEach(([y, a2]) => veil(g, a2 - (y > 60 ? 0.1 : 0), () => R(g, '#dfeaee', 0, y, 64, 128 - y))); }, 8],
    // ground of the shoulders, c = its tint (moss green in the forest, pale stone and moss on the plateau): low plants as dabs of two greens, a few pale stones, no direction; 8 m per tile
    solPiliers: (c = '#4f6f4a') => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, c, 0, 0, 64, 64); grain(g, o, 380, 0.16);
      veil(g, 0.5, () => { for (let i = 0; i < 60; i++) R(g, i & 1 ? '#263e37' : '#82c98c', rand() * 60 | 0, rand() * 60 | 0, 2 + (rand() * 5 | 0), 2 + (rand() * 3 | 0)); });
      veil(g, 0.4, () => { for (let i = 0; i < 9; i++) R(g, '#b6aa8f', rand() * 62 | 0, rand() * 62 | 0, 2, 1 + (rand() * 2 | 0)); }); }, 8],
    // dressed stone of the road works (parapets, retaining walls, anchor blocks, portals): grey-cream courses 0.5 m high, blocks 0.75 to 1.5 m, staggered joints, uneven tones, lichen low down; 8 m per tile; rot = 1: turned a quarter, for a ribbon along the road
    pierrePiliers: (rot = 0) => [64, 64, (g, o) => { const { R, rand, veil } = o; if (rot) g.setTransform(0, 1, 1, 0, 0, 0); R(g, '#c2bba3', 0, 0, 64, 64);
      for (let y = 0; y < 64; y += 4) for (let x = -(rand() * 6 | 0); x < 64;) { const w = 6 + (rand() * 7 | 0); veil(g, 0.14, () => R(g, rand() < 0.5 ? '#000' : '#fff', x, y, w, 4)); veil(g, 0.5, () => { R(g, '#5d5a4c', x, y, 1, 4); }); x += w; }
      veil(g, 0.5, () => { for (let y = 0; y < 64; y += 4) R(g, '#5d5a4c', 0, y, 64, 1); });
      veil(g, 0.42, () => { for (let i = 0; i < 44; i++) R(g, '#5d8358', rand() * 62 | 0, i % 4 ? 36 + (rand() * 27 | 0) : rand() * 20 | 0, 2 + (rand() * 4 | 0), 1 + (i % 3 === 0)); });
      grain(g, o, 160, 0.12); }, 8],
    // foliage, c = its tint (broadleaf green, dark pine, pale far crown): clumps of light on top and shade below, 4 m per tile
    feuillagePiliers: (c = '#4e7752') => [32, 32, (g, o) => { const { R, rand, veil } = o; R(g, c, 0, 0, 32, 32);
      veil(g, 0.34, () => { for (let i = 0; i < 26; i++) { const x = rand() * 30 | 0, y = rand() * 30 | 0, w = 2 + (rand() * 3 | 0); R(g, '#c8e89a', x, y, w, 1); R(g, '#0c1c16', x, y + 2, w, 1); } });
      grain(g, o, 60, 0.15, 32); }, 4],
    // bark of the big trunks: vertical furrows of uneven length, moss at the foot of the tile; 4 m per tile
    ecorcePiliers: () => [32, 32, (g, o) => { const { R, rand, veil } = o; R(g, '#5a4632', 0, 0, 32, 32);
      veil(g, 0.4, () => { for (let x = 0; x < 32; x += 2 + (rand() * 3 | 0)) for (let y = rand() * 8 | 0; y < 32;) { const l = 4 + (rand() * 12 | 0); R(g, rand() < 0.7 ? '#20160e' : '#9a8468', x, y, 1, l); y += l + 2 + (rand() * 5 | 0); } });
      veil(g, 0.4, () => { for (let i = 0; i < 12; i++) R(g, '#4e7752', rand() * 30 | 0, 24 + (rand() * 8 | 0), 2, 1); }); }, 4],
    // painted steel of the bridge (towers, girders, railing): dark blue-grey plates 2 m long, a rivet row at each joint, rust runs; 4 m per tile
    acierPiliers: () => [32, 32, (g, o) => { const { R, rand, veil } = o; R(g, '#24404c', 0, 0, 32, 32); grain(g, o, 70, 0.14, 32);
      veil(g, 0.4, () => { for (let y = 0; y < 32; y += 16) { R(g, '#0a161c', 0, y, 32, 1); for (let x = 1; x < 32; x += 3) R(g, '#7e9aa4', x, y + 2, 1, 1); } R(g, '#0a161c', 0, 0, 1, 32); });
      veil(g, 0.3, () => { for (let i = 0; i < 6; i++) R(g, '#8a4a2a', rand() * 32 | 0, (rand() < 0.5 ? 2 : 18) + (rand() * 3 | 0), 1, 3 + (rand() * 8 | 0)); }); }, 4],
    // lacquered wood of the pavilion, c = its tint: boards 25 cm wide with dark joints, worn at the foot; 2 m per tile
    laquePiliers: (c = '#a65949') => [16, 16, (g, o) => { const { R, rand, veil } = o; R(g, c, 0, 0, 16, 16); veil(g, 0.35, () => { for (let x = 0; x < 16; x += 2) R(g, '#2a120c', x, 0, 1, 16); }); veil(g, 0.3, () => { for (let i = 0; i < 10; i++) R(g, '#e8c8a0', rand() * 16 | 0, 11 + (rand() * 5 | 0), 1, 1); }); }, 2],
    // grey roof tiles in rows 25 cm apart, round tile ends every 25 cm, moss in places; 2 m per tile
    tuilePiliers: () => [16, 16, (g, o) => { const { R, rand, veil } = o; R(g, '#59625c', 0, 0, 16, 16); veil(g, 0.4, () => { for (let y = 0; y < 16; y += 2) { R(g, '#1a2420', 0, y, 16, 1); for (let x = y & 2; x < 16; x += 2) R(g, '#aab4a8', x, y + 1, 1, 1); } }); veil(g, 0.4, () => { for (let i = 0; i < 6; i++) R(g, '#4e7752', rand() * 15 | 0, rand() * 15 | 0, 2, 1); }); }, 2],
    // water of the basin and of the fall, c = its tint (turquoise basin, white fall): short pale strokes, no period; 4 m per tile
    eauPiliers: (c = '#76aebe') => [32, 32, (g, o) => { const { R, rand, veil } = o; R(g, c, 0, 0, 32, 32); veil(g, 0.45, () => { for (let i = 0; i < 30; i++) R(g, i % 4 ? '#f4fbfa' : '#30484b', rand() * 30 | 0, rand() * 32 | 0, 1, 2 + (rand() * 5 | 0)); }); }, 4],
    // the sea of clouds seen from above: near-white with wide pale blue hollows and bright crests, 256 m per tile so no grid shows from the road
    nuagePiliers: () => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, '#e6eef0', 0, 0, 64, 64);
      veil(g, 0.22, () => { for (let i = 0; i < 46; i++) { const w = 5 + (rand() * 14 | 0); R(g, i % 3 ? '#8baab7' : '#ffffff', rand() * 64 | 0, rand() * 64 | 0, w, 2 + (rand() * (w / 3) | 0)); } }); }, 256],
    // falling water (the falls of scenery-piliers-vie.js; it slides along v, tileable in v). k = 0: the body, opaque and pale, long soft patches; k = 1: the veil in front, sparse white runs on nothing.
    // Patches a quarter of the width and a third of the tile long: they still read from 250 m at 270 lines; low contrast, no sparkle
    chutePiliers: (k = 0) => [32, 64, (g, o) => { const { R, rand, veil } = o, B = (c, x, y, w, ht) => { R(g, c, x, y, w, ht); R(g, c, x, y - 64, w, ht); }; if (!k) R(g, '#eef6f6', 0, 0, 32, 64);
      veil(g, k ? 0.6 : 0.5, () => { for (let i = 0; i < (k ? 9 : 16); i++) B(k || i % 3 ? '#ffffff' : '#bfd6dc', rand() * 28 | 0, rand() * 64 | 0, 3 + (rand() * 6 | 0), 14 + (rand() * 22 | 0)); });
      veil(g, k ? 0.5 : 0.25, () => { for (let i = 0; i < 12; i++) B('#ffffff', rand() * 31 | 0, rand() * 64 | 0, 1, 10 + (rand() * 30 | 0)); }); }, 8],
    // mist and cloud seen from above: soft pale patches on nothing, tileable (the mist sheets between the pillars, the upper cloud layer, the cloud shadows); v = another drawing
    brumePiliers: (v = 0) => [64, 64, (g, o) => { const { rand } = o; for (let i = 0; i < 8 + v * 3; i++) { const x = rand() * 64, y = rand() * 64, r = 8 + rand() * 12; for (const [dx, dy] of [[0, 0], [64, 0], [-64, 0], [0, 64], [0, -64]]) {
      const q = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r); q.addColorStop(0, 'rgba(255,255,255,.9)'); q.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = q; g.fillRect(x + dx - r, y + dy - r, 2 * r, 2 * r); } } }, 300],
    // a bank of mist seen from the side (the banks drifting among the pillars): a long soft body, ragged top and bottom, fading to nothing at the four edges
    bancBrumePiliers: () => [128, 32, (g, o) => { const { rand } = o; for (let i = 0; i < 46; i++) { const x = 16 + rand() * 96, y = 12 + rand() * 8, r = 7 + rand() * 5 * Math.sin(Math.PI * (x - 16) / 96), q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, 'rgba(255,255,255,.8)'); q.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = q; g.fillRect(x - r, y - r, 2 * r, 2 * r); } }],
    // lining of the rock tunnel (walls and vault; the engine passes its own settings, ignored): rough-cut sandstone, darker than outside, drill lines, damp runs; 8 m per tile
    tunnelPiliers: () => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, '#6a6c5c', 0, 0, 64, 64);
      veil(g, 0.3, () => { for (let y = 0; y < 64; y += 4 + (rand() * 7 | 0)) R(g, '#1a2420', 0, y, 64, 1); for (let i = 0; i < 14; i++) R(g, i & 1 ? '#1a2420' : '#b6aa8f', rand() * 64 | 0, rand() * 50 | 0, 1, 5 + (rand() * 14 | 0)); });
      grain(g, o, 300, 0.2); }, 8],
  });
})();
