// Textures specific to "perse" (Royal Road, Persepolis at sunset): completes the textures.js catalogue (same conventions). See docs/methods/SCENERY.md.
// Persian miniature: flat colour with no gradient, clean outlines, motifs repeated everywhere except on the circuit. Palette from the spec (§2).
(() => {
  const RED = '#c8323c', GOLD_COL = '#f0b840', TEAL = '#2aa39a', LAPIS = '#1d3a8a', CYPRESS = '#2f5a3a', STONE = '#d8b878', STONE_GRAY = '#8a8478', IVORY = '#f4ead0', BRICK = '#9a5a38', NIGHT_COL = '#1d2a5a';
  const diamond = (g, R, cx, cy, r, c) => { for (let k = -r; k <= r; k++) R(g, c, cx - (r - Math.abs(k)), cy + k, 2 * (r - Math.abs(k)) + 1, 1); }; // losange plein, en pixels
  Object.assign(TEXTURES, {
    // carpet border: gold edging, red band with lapis lozenges outlined in ivory, turquoise edging (low walls, scenery vibrators); 4 m per motif
    rugEdge: () => [64, 16, (g, { R }) => {
      R(g, RED, 0, 0, 64, 16); R(g, GOLD_COL, 0, 0, 64, 2); R(g, GOLD_COL, 0, 14, 64, 2); R(g, TEAL, 0, 2, 64, 1); R(g, TEAL, 0, 13, 64, 1);
      for (let x = 8; x < 64; x += 16) { diamond(g, R, x, 8, 5, IVORY); diamond(g, R, x, 8, 4, LAPIS); diamond(g, R, x, 8, 1, GOLD_COL); }
      for (let x = 0; x < 64; x += 16) { R(g, GOLD_COL, x - 1, 7, 3, 3); }
    }, 4],
    // hall aisle carpet: red field, gold and lapis medallions, gold border; laid flat
    rugAlley: () => [64, 64, (g, { R }) => {
      R(g, RED, 0, 0, 64, 64); R(g, GOLD_COL, 0, 0, 64, 3); R(g, GOLD_COL, 0, 61, 64, 3); R(g, LAPIS, 0, 3, 64, 2); R(g, LAPIS, 0, 59, 64, 2);
      diamond(g, R, 32, 32, 18, GOLD_COL); diamond(g, R, 32, 32, 15, LAPIS); diamond(g, R, 32, 32, 10, RED); diamond(g, R, 32, 32, 5, IVORY); diamond(g, R, 32, 32, 2, TEAL);
      for (const [x, y] of [[8, 12], [56, 12], [8, 52], [56, 52]]) { diamond(g, R, x, y, 4, GOLD_COL); diamond(g, R, x, y, 2, TEAL); }
    }, 10],
    // hall floor: ivory and grey stone marble checkerboard, dark joints, 2 m per slab
    paving: () => [64, 64, (g, o) => {
      const { R, rand, veil } = o; for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { R(g, (x + y) & 1 ? '#9a5a48' : '#d8c4a0', x * 16, y * 16, 16, 16); if ((x + y) & 1) { R(g, '#f0b840', x * 16 + 4, y * 16 + 4, 8, 8); R(g, '#1d3a8a', x * 16 + 6, y * 16 + 6, 4, 4); } } // madder and ivory checkerboard, a gold rosette at the centre of the red slabs
      veil(g, 0.15, () => { for (let i = 0; i < 40; i++) R(g, '#5a5048', rand() * 64 | 0, rand() * 64 | 0, 1 + (rand() * 6 | 0), 1); });
      veil(g, 0.35, () => { for (let k = 0; k < 64; k += 16) { R(g, '#3a3028', 0, k, 64, 1); R(g, '#3a3028', k, 0, 1, 64); } });
    }, 8],
    // terrace paving: large limestone slabs of 2 × 4 m, two close tones, fine joints (REFS §1); plain, so the road and the monuments stand out on it
    slabsPerse: () => [64, 64, (g, { R, rand }) => {
      R(g, '#a89478', 0, 0, 64, 64); for (let y = 0; y < 4; y++) for (let x = 0; x < 2; x++) if (rand() < 0.45) R(g, rand() < 0.5 ? '#b09c80' : '#a08c72', x * 32 + (y & 1) * 16, y * 16, 32, 16);
      for (let y = 0; y < 64; y += 16) R(g, '#8a7862', 0, y, 64, 1); for (let y = 0; y < 4; y++) for (let x = 0; x < 2; x++) R(g, '#8a7862', (x * 32 + (y & 1) * 16) % 64, y * 16, 1, 16);
    }, 8],
    // retaining wall of the garden terraces (Bagh-e Takht, Shiraz): light brick, four broken-arch niches per 8 m motif, one in four with a turquoise tile back, light coping
    nichesGarden: () => [64, 32, (g, { R }) => {
      R(g, '#c2a46a', 0, 0, 64, 32); for (let y = 5; y < 32; y += 4) R(g, '#b4965e', 0, y, 64, 1); R(g, '#e4d6b0', 0, 0, 64, 3); R(g, '#9a7c4a', 0, 3, 64, 1);
      for (let k = 0; k < 4; k++) { const x = k * 16 + 3, c = k === 1 ? '#2aa39a' : '#7a5a3c'; R(g, '#9a7c4a', x - 1, 9, 12, 21); R(g, c, x, 11, 10, 19); for (let j = 0; j < 4; j++) { R(g, '#9a7c4a', x - 1 + j, 9 - j, 12 - 2 * j, 1); R(g, c, x + j, 10 - j, 10 - 2 * j, 1); } if (k === 1) for (let y = 13; y < 30; y += 4) R(g, '#e4d6b0', x + 2 + (y % 8 ? 0 : 3), y, 2, 2); }
      R(g, '#9a7c4a', 0, 30, 64, 2);
    }, 8],
    // earth wall of the gardens (rammed earth): pale ochre, barely marked layers of formwork, lighter coping on top; one wall height per motif
    wallTerre: () => [32, 32, (g, { R, rand }) => {
      R(g, '#c8a064', 0, 0, 32, 32); for (let y = 10; y < 32; y += 7) R(g, '#bc9458', 0, y, 32, 1); for (let i = 0; i < 26; i++) R(g, rand() < 0.5 ? '#d2aa70' : '#b88e54', rand() * 32 | 0, 4 + (rand() * 28 | 0), 2 + (rand() * 3 | 0), 1);
      R(g, '#dcb880', 0, 0, 32, 3); R(g, '#a8824c', 0, 3, 32, 1); R(g, '#a07a48', 0, 29, 32, 3);
    }, 4],
    // frieze of Immortals on gilded stone: row of guards in profile (spear, quiver, lapis or red robe), cypresses between them, band of rosettes on top (REFS §3); stretched upwards on a 3 m wall
    frieze: () => [64, 32, (g, { R }) => {
      R(g, STONE, 0, 0, 64, 32); R(g, '#a88a58', 0, 26, 64, 6); R(g, '#a88a58', 0, 4, 64, 1);
      R(g, '#a88a58', 0, 0, 64, 1); for (let x = 2; x < 64; x += 6) { R(g, GOLD_COL, x, 1, 3, 3); R(g, '#a88a58', x + 1, 2, 1, 1); } // band of rosettes (no crenels: REFS §2)
      for (let k = 0; k < 4; k++) { const x = k * 16 + 3, coat = k & 1 ? LAPIS : RED;
        R(g, '#5a3a20', x + 1, 8, 3, 3); R(g, '#2a1a10', x, 7, 3, 2); R(g, '#2a1a10', x + 3, 10, 1, 3); // head, headdress, beard
        R(g, coat, x, 11, 5, 11); R(g, GOLD_COL, x, 15, 5, 1); R(g, '#5a3a20', x + 1, 22, 1, 3); R(g, '#5a3a20', x + 3, 22, 1, 3); // robe, ceinture, pieds
        R(g, '#4a3020', x + 6, 5, 1, 20); R(g, GOLD_COL, x + 5, 4, 3, 2); R(g, GOLD_COL, x - 1, 12, 2, 7); // lance, pointe, carquois
        R(g, CYPRESS, x + 10, 10, 3, 14); R(g, CYPRESS, x + 11, 7, 1, 3); R(g, '#5a3a20', x + 11, 24, 1, 2); } // cypress
    }],
    // tile: turquoise and lapis tiles with ivory and gold arabesques, 1 m per tile
    ceramic: () => [32, 32, (g, { R }) => {
      R(g, TEAL, 0, 0, 32, 32); for (const [x, y] of [[0, 0], [16, 16]]) R(g, LAPIS, x, y, 16, 16);
      for (const [x, y] of [[8, 8], [24, 24], [24, 8], [8, 24]]) { diamond(g, R, x, y, 6, IVORY); diamond(g, R, x, y, 4, (x + y) & 16 ? TEAL : LAPIS); diamond(g, R, x, y, 1, GOLD_COL); }
      for (let k = 0; k < 32; k += 16) { R(g, GOLD_COL, k, 0, 1, 32); R(g, GOLD_COL, 0, k, 32, 1); }
    }, 2],
    // fluted column shaft: grey stone, tight dark flutes, drum joints
    fluting: () => [32, 32, (g, o) => {
      const { R, veil } = o; R(g, '#a8a090', 0, 0, 32, 32); for (let x = 0; x < 32; x += 4) { R(g, '#6a645a', x, 0, 1, 32); R(g, '#c8c0b0', x + 2, 0, 1, 32); }
      veil(g, 0.4, () => { R(g, '#3a3530', 0, 0, 32, 1); R(g, '#3a3530', 0, 16, 32, 1); });
    }, 3],
    // capital and bulls: carved grey stone, scattered curls of fur, gold edging (the original paint)
    sculpts: () => [32, 32, (g, { R, rand }) => {
      R(g, STONE_GRAY, 0, 0, 32, 32); for (let i = 0; i < 90; i++) { const x = rand() * 30 | 0, y = rand() * 30 | 0; R(g, '#5a5448', x, y, 2, 1); R(g, '#b0a898', x, y + 1, 2, 1); }
      R(g, GOLD_COL, 0, 0, 32, 1); R(g, GOLD_COL, 0, 31, 32, 1);
    }, 2],
    // wings of the bulls: feathers in rows, stone and gold
    wings: () => [32, 32, (g, { R }) => {
      R(g, '#9a9282', 0, 0, 32, 32); for (let y = 0; y < 32; y += 4) for (let x = (y & 4) * 0.5; x < 32; x += 4) { R(g, '#6a6258', x, y, 1, 4); R(g, '#c8c0b0', x + 1, y + 3, 3, 1); }
      R(g, GOLD_COL, 0, 0, 32, 2);
    }],
    // bazaar brick arcades: dark pointed arches (shops), tile frames, brick courses
    arcades: () => [64, 32, (g, o) => {
      const { R, veil } = o; R(g, BRICK, 0, 0, 64, 32); veil(g, 0.3, () => { for (let y = 0; y < 32; y += 2) R(g, '#5a3020', 0, y, 64, 1); });
      for (let k = 0; k < 2; k++) { const x = k * 32 + 4; R(g, TEAL, x - 1, 6, 26, 26); R(g, '#2a160c', x + 1, 12, 22, 20);
        for (let j = 0; j < 6; j++) { R(g, TEAL, x + 1 + j, 12 - j, 22 - 2 * j, 1); R(g, '#2a160c', x + 2 + j, 13 - j, 20 - 2 * j, 1); }
        R(g, GOLD_COL, x + 3, 18, 18, 2); R(g, RED, x + 3, 20, 6, 6); R(g, TEAL, x + 9, 21, 6, 5); R(g, GOLD_COL, x + 15, 20, 6, 6); } // goods on the back stall
    }],
    // striped awning of the stalls: two-colour bands, scalloped fringe
    awning: (a, b) => [32, 16, (g, { R }) => { R(g, b, 0, 0, 32, 16); for (let x = 0; x < 32; x += 8) { R(g, a, x, 0, 4, 16); R(g, b, x + 4, 0, 4, 16); } R(g, IVORY, 0, 13, 32, 1); for (let x = 0; x < 32; x += 4) R(g, a, x, 14, 2, 2); }, 4], // 0.5 m bands: finer, they blended into white at a distance
    // nose of the grand stairs' steps, set on the roadway
    stepsPerse: () => [32, 16, (g, { R }) => { R(g, '#b8a07c', 0, 0, 32, 16); R(g, '#a88e70', 0, 9, 32, 7); R(g, '#3e342d', 0, 0, 32, 4); R(g, '#f0e0c0', 0, 4, 32, 1); for (const x of [0, 11, 22]) R(g, '#6a5a48', x, 3, 1, 13); }], // large slabs: step joints and long joints // REFS §2: low stone steps, shadow nose and light edge
    // palace façade seen from afar (backlit): central iwan, arcades on two levels, tile frieze, flat roof
    palace: () => [64, 32, (g, { R }) => {
      R(g, '#b0905a', 0, 0, 64, 32); R(g, TEAL, 0, 4, 64, 2); R(g, '#8a6a40', 0, 0, 64, 2);
      for (let y of [8, 19]) for (let x = 2; x < 64; x += 6) { if (x > 24 && x < 40) continue; R(g, '#3a2418', x, y, 4, 8); R(g, LAPIS, x, y, 4, 1); }
      R(g, LAPIS, 25, 6, 14, 26); R(g, '#2a1a10', 27, 10, 10, 22); R(g, GOLD_COL, 25, 6, 14, 1);
    }],
    // miniature sky: ivory cloud scrolls outlined in gold on a transparent background, for flat panels in the distance
    volute: () => [64, 32, (g, { R }) => {
      g.clearRect(0, 0, 64, 32);
      const loopSec = (cx, cy, r) => { for (let y = -r; y <= r; y++) { const w = Math.round(Math.sqrt(r * r - y * y)); R(g, GOLD_COL, cx - w - 1, cy + y, 2 * w + 3, 1); } for (let y = -r + 1; y < r; y++) { const w = Math.round(Math.sqrt((r - 1) ** 2 - y * y)); R(g, IVORY, cx - w, cy + y, 2 * w + 1, 1); } };
      for (const [x, y, r] of [[12, 20, 8], [24, 14, 10], [38, 16, 9], [50, 21, 7], [30, 23, 7]]) loopSec(x, y, r);
      R(g, '#e8d8b0', 6, 24, 50, 4);
    }],
    // Kuh-e Rahmat cliff in the background: stratified rock, cruciform rock tombs
    cliff: () => [64, 64, (g, { R, rand }) => {
      R(g, '#a07a58', 0, 0, 64, 64); for (let y = 0; y < 64; y += 6) R(g, '#8a6648', 0, y + (rand() * 2 | 0), 64, 2);
      for (const x of [10, 40]) { R(g, '#4a3020', x, 18, 14, 30); R(g, '#4a3020', x - 6, 26, 26, 10); R(g, '#2a1a10', x + 4, 36, 6, 12); }
    }],

    // ---------- V2 (reference sheets) ----------
    // REFS §1: terrace bond, large horizontal blocks with fine joints, honey grey; 8 m per motif
    equipment: () => [64, 64, (g, { R, rand }) => {
      R(g, '#3e342d', 0, 0, 64, 64); const T = ['#a88e73', '#9c846c', '#b09680', '#948070', '#a48a74'];
      for (let y = 0, r = 0; y < 64; r++) { const hh = [14, 10, 16, 12, 12][r % 5]; for (let x = -(rand() * 16 | 0); x < 64;) { const w = 12 + (rand() * 18 | 0); R(g, T[rand() * 5 | 0], x + 1, y + 1, w - 1, hh - 1); R(g, '#bca48a', x + 1, y + 1, w - 1, 1); x += w; } y += hh; }
    }, 8],
    // REFS §3: Apadana reliefs, two registers of tribute bearers in profile, separated by bands of rosettes; traces of red, blue, ochre paint
    relief: () => [64, 32, (g, { R }) => {
      R(g, '#bca07a', 0, 0, 64, 32);
      for (const y of [0, 15, 30]) { R(g, '#8a7050', 0, y, 64, 2); for (let x = 1; x < 64; x += 4) R(g, '#d8c098', x, y, 2, 2); } // rosettes
      for (const [y, d] of [[3, 0], [18, 2]]) for (let k = 0; k < 8; k++) { const x = k * 8 + d, coat = ['#a34a33', '#2e5e9e', '#a88050', '#6a4a8a'][(k + d) % 4];
        R(g, '#5a4430', x + 2, y, 2, 2); R(g, '#3a2818', x + 1, y, 1, 2); R(g, coat, x + 1, y + 2, 4, 7); R(g, '#5a4430', x + 1, y + 9, 1, 2); R(g, '#5a4430', x + 4, y + 9, 1, 2); // head, headdress, robe, feet
        if (k % 3 === 0) R(g, GOLD_COL, x + 5, y + 3, 2, 3); else if (k % 3 === 1) R(g, '#8a7050', x + 5, y + 2, 1, 6); } // carried vessel, or staff
    }],
    // REFS §2-3: band of eight-petalled rosettes (crowning the stairs)
    rosettes: () => [8, 32, (g, { R }) => { R(g, '#8a7050', 0, 0, 8, 32); for (let y = 4; y < 32; y += 8) { R(g, '#d8c098', 2, y - 2, 5, 5); R(g, '#d8c098', 1, y - 1, 7, 3); R(g, '#d8c098', 3, y - 3, 3, 7); R(g, GOLD_COL, 3, y, 3, 1); R(g, GOLD_COL, 4, y - 1, 1, 3); } }], // set on a vertical strip: x up the height, y along
    // REFS §6-7: winged bull in high relief on the Gate's jamb, in profile, dark stone on gilded stone; human = bearded head with tiara (lamassu), otherwise bull's head; right = head to the right of the image
    lamassuRelief: (human, rightDir) => [48, 64, (g, { R }) => { // to the proportions of the jamb (7.6 × 10.5 m)
      if (rightDir) { g.translate(48, 0); g.scale(-1, 1); }
      const S1 = '#5a524a', S2 = '#7a7064', AI = '#e0d4b8', AI2 = '#2e5e9e';
      R(g, '#c4a478', 0, 0, 48, 64); R(g, '#8a6e48', 0, 0, 48, 2); R(g, '#8a6e48', 0, 62, 48, 2);
      for (let r = 0; r < 7; r++) { const y = 6 + r * 3.5 | 0, x = 14 + r * 2; R(g, AI2, x - 1, y - 1, 46 - x, 4); R(g, AI, x, y, 45 - x, 2); for (let k = x + 2; k < 46; k += 4) R(g, AI2, k, y, 1, 2); } // the large light wing, feather by feather, rising backwards
      R(g, S1, 12, 31, 33, 12); R(g, S2, 14, 33, 28, 2); R(g, S1, 44, 31, 3, 11); // corps, queue
      for (const x of [13, 18, 35, 40]) { R(g, S1, x, 43, 4, 16); R(g, '#241f1c', x - 1, 58, 6, 3); } // pattes, sabots
      R(g, S1, 7, 22, 9, 17); // poitrail
      if (human) { R(g, S2, 2, 16, 9, 8); R(g, '#241f1c', 2, 23, 9, 9); for (let y = 24; y < 32; y += 2) R(g, '#7a7064', 3, y, 7, 1); R(g, '#f0b840', 1, 6, 11, 10); R(g, '#8a6a20', 1, 9, 11, 1); R(g, '#8a6a20', 1, 12, 11, 1); R(g, '#c4a478', 5, 19, 2, 1); } // frontal head, curled beard, gold horned tiara
      else { R(g, S2, 0, 20, 10, 8); R(g, S1, 0, 25, 5, 4); R(g, '#f0b840', 4, 13, 2, 7); R(g, '#f0b840', 8, 12, 2, 8); R(g, '#c4a478', 5, 22, 2, 1); } // bull's head, gold horns
    }],
    // REFS §1: large slab joints on the royal road's roadway, transparent elsewhere (the engine's markings remain visible); x across, y along
    joints: () => [32, 32, (g, { R }) => { g.clearRect(0, 0, 32, 32); R(g, '#7a6a58', 0, 0, 32, 1); R(g, '#7a6a58', 0, 16, 32, 1); }], // cross joints only, light: no checkerboard or patches
    // REFS §15: mud-brick façade of a house: ochre render, two small windows with wooden grilles, low door, tile band under the roof; 8 m
    facadeRaw: () => [32, 32, (g, { R, rand }) => { R(g, '#c49a5e', 0, 0, 32, 32); for (let i = 0; i < 40; i++) R(g, rand() < 0.5 ? '#d4aa70' : '#b08850', rand() * 32 | 0, rand() * 32 | 0, 2, 1);
      R(g, TEAL, 0, 2, 32, 1); for (const x of [4, 22]) { R(g, '#3a2418', x, 8, 6, 7); R(g, '#8a5a30', x, 11, 6, 1); R(g, '#8a5a30', x + 3, 8, 1, 7); } R(g, '#5a3a20', 13, 20, 6, 12); R(g, '#3a2418', 14, 21, 4, 11); R(g, '#a07040', 12, 19, 8, 1); }, 8],
    // REFS §9: Kuh-e Rahmat limestone, honey grey in horizontal strata, darker scree at the foot
    strata: () => [64, 64, (g, { R, rand }) => { R(g, '#8a7c6c', 0, 0, 64, 64); for (let y = 0; y < 64; y += 5 + (rand() * 4 | 0)) { R(g, '#5f5046', 0, y, 64, 1); R(g, '#a8987e', 0, y + 1, 64, 1); }
      for (let i = 0; i < 120; i++) R(g, rand() < 0.5 ? '#6e6052' : '#9a8a76', rand() * 64 | 0, rand() * 64 | 0, 2 + (rand() * 4 | 0), 1); R(g, '#5f5046', 0, 56, 64, 8); }, 40],
    // REFS §3: panel of the lion attacking the bull, the emblem of the stairs (corner triangles)
    lionBull: () => [32, 32, (g, { R }) => {
      R(g, '#bca07a', 0, 0, 32, 32); R(g, '#8a7050', 0, 0, 32, 2); R(g, '#8a7050', 0, 30, 32, 2);
      R(g, '#7a7068', 4, 14, 20, 9); R(g, '#7a7068', 22, 9, 6, 7); R(g, '#7a7068', 5, 23, 2, 6); R(g, '#7a7068', 20, 23, 2, 6); R(g, '#4a4440', 27, 7, 1, 3); R(g, '#4a4440', 23, 6, 1, 3); // the bull, horns
      R(g, '#a87a3a', 6, 6, 12, 8); R(g, '#c8963a', 3, 3, 7, 7); R(g, '#a87a3a', 15, 12, 3, 7); R(g, '#a87a3a', 6, 13, 2, 6); R(g, '#6a4a20', 4, 4, 2, 2); // the lion rearing on its back, mane
    }],
    // REFS §6, §8: rendered mud-brick (kahgel), ochre, scattered straw, faded courses; 4 m
    brickRaw: () => [32, 32, (g, { R, rand }) => {
      R(g, '#c49a5e', 0, 0, 32, 32); for (let y = 0; y < 32; y += 4) R(g, '#b48a52', 0, y, 32, 1);
      for (let i = 0; i < 70; i++) R(g, rand() < 0.5 ? '#d8b078' : '#a47a48', rand() * 32 | 0, rand() * 32 | 0, 2, 1);
    }, 4],
    // REFS §5, §8: mud-brick wall on a stone plinth, pierced with windows and black-stone niches with cavetto cornice; 16 m per motif
    wallHall: () => [64, 64, (g, { R }) => {
      R(g, '#c49a5e', 0, 0, 64, 64); for (let y = 0; y < 56; y += 4) R(g, '#b48a52', 0, y, 64, 1); R(g, '#8a7c6c', 0, 56, 64, 8); R(g, '#6a5e50', 0, 56, 64, 1); R(g, '#4a4440', 0, 0, 64, 5); R(g, '#7a6e60', 0, 5, 64, 1);
      for (const x of [6, 38]) { R(g, '#3a3430', x, 18, 20, 36); R(g, '#1e1a18', x + 4, 26, 12, 28); R(g, '#4a4440', x - 3, 15, 26, 3); R(g, '#6a6056', x - 3, 14, 26, 1); R(g, '#7a6e60', x + 5, 34, 2, 10); R(g, '#7a6e60', x + 13, 34, 2, 10); } // straight cavetto cornice above the windows (the terraces made merlons); at the top, a continuous dark coping: the roofline stays straight against the sky
    }, 16],
    // REFS §5: black-stone door surround: cavetto cornice, jambs with reliefs (the king on his throne under the parasol), dark void
    doorStone: () => [32, 64, (g, { R }) => {
      R(g, '#3e3834', 0, 0, 32, 64); R(g, '#141010', 8, 16, 16, 48); for (let k = 0; k < 4; k++) R(g, k & 1 ? '#5a524a' : '#2e2824', k, 4 + 2 * k, 32 - 2 * k, 2); R(g, '#6a6056', 0, 2, 32, 2);
      for (const x of [1, 25]) { R(g, '#5a524a', x + 1, 24, 4, 3); R(g, '#7a3a2a', x + 1, 27, 4, 12); R(g, '#5a524a', x, 39, 6, 2); R(g, GOLD_COL, x, 20, 6, 2); R(g, '#5a524a', x + 2, 22, 1, 2); } // the king (red robe), the throne, the gold parasol
    }],
    // REFS §5: cedar ceiling with painted coffers (lapis, red, gold); 6 m
    ceilingCedar: () => [32, 32, (g, { R }) => {
      R(g, '#6a4424', 0, 0, 32, 32); for (const [x, y] of [[2, 2], [18, 2], [2, 18], [18, 18]]) { R(g, '#1d3a8a', x, y, 12, 12); R(g, RED, x + 3, y + 3, 6, 6); R(g, GOLD_COL, x + 5, y + 5, 2, 2); }
      R(g, '#4a2e18', 0, 15, 32, 2); R(g, '#4a2e18', 15, 0, 2, 32);
    }, 6],
    // REFS §12: bazaar shops (hojreh) in broken niches, two per 8 m motif: carpets, copperware, spices, fabrics; brick frame and tile edging
    // n niches per motif (4: the vault; 5 on the 12 m modules of the street: 2.4 m niches, finer pixels), d: offset of the goods order (neighbouring modules differ)
    hojreh: (n = 4, d = 0, rackFrame = TEAL) => [16 * n, 32, (g, { R }) => { // frame: colour of the niche surround (turquoise; brick for one module in two of the open street)
      R(g, '#7a4630', 0, 0, 16 * n, 32); for (let y = 0; y < 32; y += 2) R(g, '#5e3424', 0, y, 16 * n, 1);
      const B = [[RED, LAPIS, GOLD_COL], ['#c8742e', '#e89a50', '#7a4420'], ['#d9a21b', '#b5391e', '#7a5a20'], [TEAL, IVORY, RED]];
      for (let q = 0; q < n; q++) { const x = q * 16 + 2, k = (q + d) % 4, [a, b, c] = B[k]; R(g, rackFrame, x - 1, 7, 14, 25); R(g, '#24140c', x, 9, 12, 23); for (let j = 0; j < 5; j++) { R(g, rackFrame, x + 1 + j, 9 - j, 10 - 2 * j, 1); R(g, '#24140c', x + 2 + j, 10 - j, 8 - 2 * j, 1); }
        R(g, '#ffd890', x + 4, 11, 4, 2); // lamp at the back of the shop
        if (k === 0) { R(g, a, x + 1, 14, 5, 14); R(g, c, x + 2, 16, 3, 10); R(g, b, x + 6, 15, 5, 13); R(g, IVORY, x + 7, 18, 3, 6); } // tapis pendus
        else if (k === 1) for (let j = 0; j < 3; j++) { R(g, a, x + 1 + j * 4, 15 + j, 3, 3); R(g, b, x + 2 + j * 3, 22, 3, 4); R(g, c, x + 1, 27, 10, 1); } // cuivres
        else if (k === 2) for (let j = 0; j < 4; j++) { const c2 = [a, b, c, a][j]; R(g, c2, x + 1 + j * 3, 24 - (j & 1) * 2, 2, 2); R(g, c2, x + j * 3, 26 - (j & 1) * 2, 4, 5); } // spices in cones
        else { for (let j = 0; j < 4; j++) R(g, [a, b, c, a][j], x + 1 + j * 3, 13, 2, 15); } // fabrics
        R(g, '#5a3a20', x, 29, 12, 3); } // seuil, comptoir
    }],
    // REFS §12: vault brick of the bazaar, buff with pale joints, herringbone courses and tile knob
    vault: () => [32, 32, (g, { R }) => {
      R(g, '#8a5438', 0, 0, 32, 32); for (let y = 0; y < 32; y += 4) for (let x = 0; x < 32; x += 4) { const o = (y >> 2) & 1 ? 2 : 0; R(g, '#a8704c', x + o, y, 3, 1); R(g, '#5a3424', x + o, y + 3, 3, 1); }
      for (const [x, y] of [[8, 8], [24, 24]]) { R(g, TEAL, x - 1, y - 1, 3, 3); R(g, IVORY, x, y, 1, 1); }
    }, 3],
    // REFS §14: carpet (1.2 × 1.8 m): field, medallion, spandrels, border one-sixth of the width
    rug: (backdrop, edgePt, med) => [32, 48, (g, { R }) => {
      R(g, edgePt, 0, 0, 32, 48); R(g, IVORY, 5, 5, 22, 38); R(g, backdrop, 6, 6, 20, 36);
      for (let y = 1; y < 48; y += 4) { R(g, med, 2, y, 2, 2); R(g, med, 28, y, 2, 2); }
      diamond(g, R, 16, 24, 9, med); diamond(g, R, 16, 24, 6, IVORY); diamond(g, R, 16, 24, 4, edgePt); diamond(g, R, 16, 24, 1, med);
      for (const [x, y] of [[6, 6], [22, 6], [6, 38], [22, 38]]) R(g, med, x, y, 4, 4);
      for (let x = 0; x < 32; x += 2) { R(g, IVORY, x, 0, 1, 1); R(g, IVORY, x, 47, 1, 1); } // franges
    }],
    // REFS §15: plain fields in strips: wheat, alfalfa, ploughed land; 12 m
    field: (a, b) => [32, 32, (g, { R }) => { R(g, a, 0, 0, 32, 32); for (let x = 0; x < 32; x += 4) R(g, b, x, 0, 1, 32); }, 12],
    // REFS §10: sunken flowerbed: flowers in rows (roses, marigolds), grass; 4 m
    flowerbed: () => [32, 32, (g, { R }) => {
      R(g, '#4a7a34', 0, 0, 32, 32); for (let y = 2; y < 32; y += 6) for (let x = (y % 12) ? 1 : 4; x < 32; x += 6) { R(g, ['#c8323c', '#f0c020', '#f4ead0', '#e87a2a'][(x + y) % 4], x, y, 2, 2); R(g, '#3a6a2a', x, y + 2, 2, 1); }
    }, 4],
    // REFS §13: muqarnas of the portal vault: tiered cells, lapis, turquoise, ivory, gold
    muqarnas: () => [32, 32, (g, { R }) => {
      R(g, LAPIS, 0, 0, 32, 32); for (let y = 0; y < 32; y += 8) for (let x = (y & 8) ? 4 : 0; x < 32; x += 8) { R(g, TEAL, x, y, 7, 6); R(g, IVORY, x + 1, y + 6, 5, 1); R(g, '#12245a', x + 2, y + 1, 3, 4); R(g, GOLD_COL, x + 3, y, 1, 1); }
    }, 3],
    // REFS §13: inscription band of the portal, ivory letters on lapis (a motif, not text)
    inscription: () => [64, 8, (g, { R }) => { R(g, LAPIS, 0, 0, 64, 8); R(g, GOLD_COL, 0, 0, 64, 1); R(g, GOLD_COL, 0, 7, 64, 1); for (let x = 1; x < 64; x += 3) { R(g, IVORY, x, 2 + (x % 2), 1, 4 - (x % 2)); if (x % 9 === 1) R(g, IVORY, x, 2, 3, 1); } }],
    // REFS §15: nomad black tent (goat hair), light panels
    tent: () => [16, 16, (g, { R }) => { R(g, '#242020', 0, 0, 16, 16); for (let x = 0; x < 16; x += 4) R(g, '#3a3430', x, 0, 1, 16); R(g, '#7a6a58', 0, 14, 16, 2); }],
  });
})();
