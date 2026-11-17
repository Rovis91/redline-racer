// Textures specific to "egee" (Aegean Cliffs): completes the textures.js catalogue (same conventions: 8 px per metre, a base tone, grain, joints, wear; `rand` only). See docs/ASSET-GENERATION.md.
// These are the shared materials of the map (docs/proposals/aegean-cliffs/AMBIANCE-V2.html): three values carry the picture, dark asphalt, warm stone, white lime.
(() => {
  const grain = (g, { R, rand, veil }, n, a = 0.18, S = 64) => veil(g, a, () => { for (let i = 0; i < n; i++) R(g, i % 3 ? '#000' : '#fff', rand() * S | 0, rand() * S | 0, 1 + (rand() * 2 | 0), 1); });
  Object.assign(TEXTURES, {
    // dry island ground: ochre earth, pale limestone pebbles, grey-green tufts of thyme, no direction; 8 m per tile
    solEgee: () => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, '#d2aa74', 0, 0, 64, 64); grain(g, o, 380, 0.14);
      veil(g, 0.12, () => { for (let i = 0; i < 9; i++) R(g, i & 1 ? '#fff' : '#7a4a20', rand() * 52 | 0, rand() * 52 | 0, 6 + rand() * 12 | 0, 4 + rand() * 8 | 0); });
      for (let i = 0; i < 22; i++) R(g, '#f0e2c4', rand() * 63 | 0, rand() * 63 | 0, 2, 1);
      veil(g, 0.7, () => { for (let i = 0; i < 16; i++) { const x = rand() * 61 | 0, y = rand() * 61 | 0; R(g, '#76815a', x, y, 3, 2); R(g, '#5c6a48', x + 1, y + 1, 2, 1); } }); }, 8],
    // rock of the island, c = its tint (warm ochre near, blue-grey for the far islands), a = strength of the strata (1 near, 0.3 far): uneven horizontal strata, vertical cracks; 8 m per tile
    rocheEgee: (c, a = 1) => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, c, 0, 0, 64, 64);
      veil(g, 0.2 * a, () => { for (let y = 0; y < 64;) { const ht = 2 + (rand() * 7 | 0); R(g, rand() < 0.5 ? '#5a2a10' : '#fff', 0, y, 64, ht); y += ht + (rand() * 5 | 0); } });
      veil(g, 0.32 * a, () => { for (let y = 0; y < 64; y += 5 + (rand() * 8 | 0)) R(g, '#3a1a08', 0, y, 64, 1); for (let i = 0; i < 9; i++) R(g, '#3a1a08', rand() * 64 | 0, rand() * 50 | 0, 1, 4 + rand() * 12 | 0); });
      grain(g, o, 240, 0.18 * a); }, 8],
    // terrace earth: red-brown tilled soil, pale stones, faint uneven clods (no furrow lines: they would strobe); 8 m per tile
    terreEgee: () => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, '#b9805a', 0, 0, 64, 64); grain(g, o, 420, 0.16);
      veil(g, 0.14, () => { for (let i = 0; i < 14; i++) R(g, i & 1 ? '#e8c9a0' : '#5a2a10', rand() * 56 | 0, rand() * 56 | 0, 4 + rand() * 8 | 0, 3 + rand() * 5 | 0); });
      for (let i = 0; i < 14; i++) R(g, '#e7c49a', rand() * 63 | 0, rand() * 63 | 0, 2, 1); }, 8],
    // quay and village paving: large pale limestone slabs of uneven size, lime-washed joints (the joints are lighter than the stone, as in the Cyclades), a few worn slabs; 8 m per tile
    pavageEgee: () => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, '#d9c8a8', 0, 0, 64, 64);
      for (let y = 0; y < 64;) { const ht = 6 + (rand() * 5 | 0); for (let x = 0; x < 64;) { const w = 7 + (rand() * 9 | 0); R(g, ['#d2c09e', '#dccdb0', '#c8b694', '#e0d2b8'][rand() * 4 | 0], x, y, w, ht); R(g, '#f4ecdc', x, y, 1, ht); x += w; } R(g, '#f4ecdc', 0, y, 64, 1); y += ht; }
      grain(g, o, 200, 0.1); }, 8],
    // lime wash, c = its tint: chalky white, faint trowel patches, a grey splash band at the foot is left to the pieces that touch the ground; 8 m per tile
    chauxEgee: (c = '#fbf6ea') => [64, 64, (g, o) => { const { R, rand, veil } = o; R(g, c, 0, 0, 64, 64);
      veil(g, 0.07, () => { for (let i = 0; i < 26; i++) R(g, i & 1 ? '#8a7a68' : '#fff', rand() * 54 | 0, rand() * 54 | 0, 5 + rand() * 10 | 0, 3 + rand() * 8 | 0); }); grain(g, o, 90, 0.06); }, 8],
    // house wall, c = joinery colour: lime wash with one window per 4 m (two shutters, a sill) between 1.1 and 2.5 m of each 4 m storey, a blue-grey splash band at the foot; 4 m per tile, the bottom of the texture is the ground
    facadeEgee: (c = '#1c6eb0') => [32, 32, (g, o) => { const { R, rand, veil } = o; R(g, '#fbf6ea', 0, 0, 32, 32);
      veil(g, 0.07, () => { for (let i = 0; i < 10; i++) R(g, i & 1 ? '#8a7a68' : '#fff', rand() * 26 | 0, rand() * 26 | 0, 4 + rand() * 6 | 0, 3 + rand() * 5 | 0); });
      R(g, '#22303c', 12, 12, 8, 11); R(g, c, 9, 12, 4, 11); R(g, c, 19, 12, 4, 11); veil(g, 0.3, () => { for (let y = 13; y < 23; y += 2) { R(g, '#000', 9, y, 4, 1); R(g, '#000', 19, y, 4, 1); } }); R(g, '#e4dccb', 8, 23, 16, 1);
      veil(g, 0.1, () => R(g, '#5a6a78', 0, 29, 32, 3)); }, 4],
    // dry stone wall: small uneven stones in rough courses, dark gaps, a few pale ones; 4 m per tile
    pierreEgee: (c = '#c9ad82') => [32, 32, (g, o) => { const { R, rand, veil } = o; R(g, '#6e5a40', 0, 0, 32, 32);
      for (let y = 0; y < 32;) { const ht = 3 + (rand() * 3 | 0); for (let x = -(rand() * 4 | 0); x < 32;) { const w = 3 + (rand() * 6 | 0); R(g, c, x, y, w - 1, ht - 1); veil(g, 0.22, () => R(g, rand() < 0.5 ? '#000' : '#fff', x, y, w - 1, ht - 1)); x += w; } y += ht; }
      grain(g, o, 40, 0.12, 32); }, 4],
    // weathered boards of doors, pontoons and boats, c = paint: planks of uneven width and tone, dark joints; 2 m per tile
    boisEgee: (c = '#8a6a48') => [16, 16, (g, o) => { const { R, rand, veil } = o; R(g, c, 0, 0, 16, 16);
      for (let x = 0; x < 16;) { const w = 2 + (rand() * 3 | 0); veil(g, 0.16, () => R(g, rand() < 0.5 ? '#000' : '#fff', x, 0, w, 16)); veil(g, 0.4, () => R(g, '#000', x, 0, 1, 16)); x += w; } grain(g, o, 14, 0.2, 16); }, 2],
    // awning canvas, c = stripe colour: white and colour stripes 50 cm wide, sun-faded; 2 m per tile
    toileEgee: (c = '#1c6eb0') => [16, 16, (g, o) => { const { R } = o; R(g, '#fbf3e5', 0, 0, 16, 16); for (let x = 0; x < 16; x += 8) R(g, c, x, 0, 4, 16); grain(g, o, 10, 0.1, 16); }, 2],
    // foliage, c = its tint (olive grey-green, cypress dark green, bougainvillea magenta): leaf speckle in two tones; 2 m per tile
    feuillageEgee: (c = '#76815a') => [16, 16, (g, o) => { const { R, rand, veil } = o; R(g, c, 0, 0, 16, 16);
      veil(g, 0.3, () => { for (let i = 0; i < 46; i++) R(g, i % 3 ? '#000' : '#fff', rand() * 16 | 0, rand() * 16 | 0, 1 + (rand() * 2 | 0), 1); }); }, 2],
  });
})();
