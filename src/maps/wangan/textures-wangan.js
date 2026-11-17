// Textures specific to "wangan": completes the textures.js catalogue, same conventions. See docs/methods/SCENERY.md.
(() => {
  Object.assign(TEXTURES, {
    // port floor, one 32 m tile: 4 m concrete slabs in uneven tints with dark joints, oil stains, dark smooth puddles,
    // a pair of sunken rails (gantries on rails), a yellow traffic lane line and white storage bays
    groundPort: () => [128, 128, (g, { R, rand }) => {
      R(g, '#3a3c40', 0, 0, 128, 128);
      for (let x = 0; x < 128; x += 16) for (let y = 0; y < 128; y += 16) { const v = 52 + rand() * 16 | 0; R(g, `rgb(${v},${v + 1},${v + 4})`, x + 1, y + 1, 15, 15); }
      for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(10,10,12,${0.15 + rand() * 0.25})`; g.beginPath(); g.ellipse(rand() * 128, rand() * 128, 2 + rand() * 6, 1 + rand() * 4, rand() * 3, 0, 6.3); g.fill(); } // huile
      for (let i = 0; i < 5; i++) { g.fillStyle = 'rgba(14,20,28,.85)'; g.beginPath(); g.ellipse(rand() * 128, rand() * 128, 5 + rand() * 9, 3 + rand() * 5, rand() * 3, 0, 6.3); g.fill(); } // flaques
      for (const x of [40, 46]) { R(g, '#1c1c1e', x, 0, 2, 128); R(g, '#8a8c90', x + 0.5, 0, 1, 128); } // sunken rails, shiny head
      R(g, '#d8a820', 88, 0, 2, 128); // voie de circulation
      for (let y = 4; y < 128; y += 32) { R(g, '#c8c8c0', 100, y, 26, 1); R(g, '#c8c8c0', 100, y + 12, 26, 1); R(g, '#c8c8c0', 100, y, 1, 12); } // cases de stockage
    }, 32],
    // city streets, one 58 m tile aligned to the tower grid: the street (16 m) on the tile edges, dashed centre line, pedestrian crossings at the crossroads,
    // 4 m pavements around the block, concrete courtyard of the block (under the tower)
    streetVille: () => [128, 128, (g, { R, rand }) => {
      R(g, '#3e4046', 0, 0, 128, 128); // asphalt light enough to read at night, seen from above (it used to be a black hole)
      for (let i = 0; i < 40; i++) R(g, rand() < 0.5 ? '#383a40' : '#46484e', rand() * 128 | 0, rand() * 128 | 0, 2 + rand() * 6 | 0, 1 + rand() * 3 | 0); // patches
      R(g, '#9a9a94', 18, 18, 92, 92); R(g, '#6e6e6c', 27, 27, 74, 74); // pavement and courtyard
      for (let x = 22; x < 106; x += 8) { R(g, '#cfc8a8', x, 0, 4, 1); R(g, '#cfc8a8', x, 127, 4, 1); R(g, '#cfc8a8', 0, x, 1, 4); R(g, '#cfc8a8', 127, x, 1, 4); } // ligne axiale
      for (let k = 0; k < 6; k++) for (const [x, y, w, h] of [[2 + k * 3, 19, 2, 8], [2 + k * 3, 101, 2, 8], [19, 2 + k * 3, 8, 2], [101, 2 + k * 3, 8, 2]]) { R(g, '#d8d8d0', x, y, w, h); R(g, '#d8d8d0', 127 - x - w + 1, y, w, h); R(g, '#d8d8d0', x, 127 - y - h + 1, w, h); } // pedestrian crossings
    }, 58],
  });
})();
