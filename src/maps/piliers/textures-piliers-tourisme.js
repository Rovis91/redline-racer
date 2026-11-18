// Textures of the tourist layer of "piliers" (round 4): completes the textures.js catalogue, same conventions as textures-piliers.js. See docs/proposals/sky-pillars/AMBIANCE-V2.html, "The tourist layer".
// On a box the tile repeats every `tile` metres along both axes, v = 0 at the foot of the canvas: a drawing narrower than its tile sits in the bottom rows.
(() => {
  Object.assign(TEXTURES, {
    // whitewashed plaster of the halls and houses: cream, rain streaks under the eaves, a damp dark foot; 2 m per tile
    enduitPiliers: () => [16, 16, (g, o) => { const { R, rand, veil } = o; R(g, '#e8e0cc', 0, 0, 16, 16);
      veil(g, 0.16, () => { for (let i = 0; i < 9; i++) R(g, '#5d5a4c', rand() * 16 | 0, 0, 1, 3 + (rand() * 9 | 0)); R(g, '#5d5a4c', 0, 13, 16, 3); });
      veil(g, 0.1, () => { for (let i = 0; i < 20; i++) R(g, i & 1 ? '#000' : '#fff', rand() * 15 | 0, rand() * 15 | 0, 2, 1); }); }, 2],
    // stone paving of the footpaths, courts and coach park: grey-cream slabs 1 m by 0.5 m, staggered, dark joints, moss in some; 4 m per tile
    pavePiliers: () => [32, 32, (g, o) => { const { R, rand, veil } = o; R(g, '#aaa392', 0, 0, 32, 32);
      for (let y = 0; y < 32; y += 4) for (let x = y & 4 ? -4 : 0; x < 32; x += 8) { veil(g, 0.13, () => R(g, rand() < 0.5 ? '#000' : '#fff', x, y, 8, 4)); veil(g, 0.45, () => { R(g, '#5d5a4c', x, y, 1, 4); R(g, '#5d5a4c', x, y, 8, 1); }); }
      veil(g, 0.4, () => { for (let i = 0; i < 12; i++) R(g, '#5d8358', rand() * 30 | 0, (rand() * 8 | 0) * 4, 2 + (rand() * 3 | 0), 1); }); }, 4],
    // a string of prayer flags, 4.5 m per tile, on a band 0.9 m high (the bottom fifth of the tile): a dark cord and five pennants, blue, white, red, green, yellow; nothing else is drawn (material in alphaTest)
    fanionPiliers: () => [40, 40, (g, o) => { const { R } = o; R(g, '#2a2c28', 0, 32, 40, 1);
      ['#2f6fc0', '#f2efe2', '#d8322a', '#3f9a56', '#e8c030'].forEach((c, k) => { const x = k * 8 + 1; R(g, c, x, 33, 6, 4); R(g, c, x + 1, 37, 4, 2); R(g, c, x + 2, 39, 2, 1); }); }, 4.5],
    // a brown park sign 2.4 m by 1.2 m (the bottom half of the tile): white border, a white pagoda pictogram, an arrow and two lines of text as bars
    panneauPiliers: () => [32, 32, (g, o) => { const { R } = o; R(g, '#6a4326', 0, 0, 32, 32); R(g, '#f2efe2', 1, 17, 30, 1); R(g, '#f2efe2', 1, 30, 30, 1); R(g, '#f2efe2', 1, 17, 1, 14); R(g, '#f2efe2', 30, 17, 1, 14);
      for (const [x, y, w] of [[5, 20, 6], [6, 22, 4], [4, 23, 8], [6, 25, 4], [3, 26, 10], [7, 19, 2]]) R(g, '#f2efe2', x, y, w, 1); R(g, '#f2efe2', 7, 27, 2, 2); // the pagoda
      R(g, '#f2efe2', 15, 20, 9, 2); R(g, '#f2efe2', 15, 24, 12, 1); R(g, '#f2efe2', 15, 26, 8, 1); R(g, '#e8c030', 26, 19, 2, 4); R(g, '#e8c030', 25, 20, 4, 2); }, 2.4],
  });
})();
