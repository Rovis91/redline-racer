// Textures specific to "givre" (Nuit Blanche): complements the catalogue in textures.js, same conventions. See docs/methods/SCENERY.md.
(() => {
  Object.assign(TEXTURES, {
    // virgin snow on the slopes: pale and dark wind ripples, blue shadows of the drifts, a few crystals catching the light
    snowVirgin: () => [64, 64, (g, o) => {
      const { R, rand, veil } = o; R(g, '#d2dcf0', 0, 0, 64, 64);
      for (let i = 0; i < 260; i++) R(g, rand() < 0.5 ? '#c4d0e8' : '#e2eaf8', rand() * 64 | 0, rand() * 64 | 0, 2 + (rand() * 6 | 0), 1);
      veil(g, 0.22, () => { for (let i = 0; i < 7; i++) { const x = rand() * 50 | 0, y = rand() * 60 | 0, w = 10 + (rand() * 14 | 0); R(g, '#4a5c90', x, y, w, 2); R(g, '#fff', x + 1, y - 1, w - 2, 1); } });
      for (let i = 0; i < 36; i++) R(g, '#ffffff', rand() * 64 | 0, rand() * 64 | 0, 1, 1);
    }, 10],
    // vivid ice on the roadway (14 m wide, 9 pixels per meter, 8 along the length): the calmest surface of the image, an almost plain glacier blue
    // (grain drawn along the road at a few percent contrast), polished reflections and cracks as a light veil, jagged edges.
    // The alpha does double duty: 0 = no ice (pixel discarded by alphaTest), 0.8 = ice, slightly glossy under dynamic light (brighter, it reflects the sky and blends from afar with the snow).
    // end = 1: the last 10 metres of a plate, in tongues tapering toward the bottom of the texture
    iceVivid: tip => [128, tip ? 160 : 512, (g, o) => {
      const { R, rand, veil } = o, W = 128, H = tip ? 160 : 512; R(g, '#3a74ac', 0, 0, W, H);
      for (let i = 0; i < H * 6; i++) R(g, rand() < 0.5 ? '#3670a7' : '#3f79b1', rand() * W | 0, rand() * H | 0, 1, 4 + (rand() * 24 | 0)); // fine grain, drawn along the road
      veil(g, 0.22, () => { for (let i = 0; i < H / 6; i++) R(g, '#cfeaff', rand() * W | 0, rand() * H | 0, 1, 20 + (rand() * 60 | 0)); }); // polished reflections, long and thin
      veil(g, 0.3, () => { for (let i = 0; i < H / 24; i++) { let x = 12 + rand() * 104 | 0, y = rand() * H | 0; for (let k = 0; k < 52; k++) { R(g, '#eef8ff', x, y, 1, 1); if (rand() < 0.5) x += rand() < 0.5 ? -1 : 1; y = (y + 1) % H; } } }); // fissures
      veil(g, 0.2, () => { for (let i = 0; i < H / 4; i++) R(g, '#f2f8ff', rand() * (W - 2) | 0, rand() * H | 0, 2, 1); }); // hoar frost
      g.globalCompositeOperation = 'destination-out';
      g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#000';
      for (let y = 0; y < H; y += 8) { g.fillRect(0, y, 2 + (rand() * 10 | 0), 8); const w = 2 + (rand() * 10 | 0); g.fillRect(W - w, y, w, 8); }
      if (tip) for (let x = 0; x < W; x += 8) { const t = 28 + (rand() * 116 | 0); g.fillRect(x, t, 8, H - t); if (rand() < 0.5) g.fillRect(x + (rand() < 0.5 ? -4 : 8), t - 16, 4, 16); }
      g.globalCompositeOperation = 'source-over';
    }],
    // the crown-shaped peaks, at 1.1-1.7 km (scenery-givre.js, placed with rep [3, 1]: 0.5 to 0.8 px/m instead of 0.1): rock in oblique strata and gullies, snow above a line
    // jagged (the top of the texture is the top of the peak) that runs down in streaks; low contrast, it's a backdrop. Exact left-right seam (whole frequencies), for the repeat around the cone
    rockSnowFar: () => [512, 512, (g, o) => {
      const { R, rand, veil } = o, W = 512, P = 6.2832 / W, R2 = (c, x, y, w, h) => { R(g, c, x, y, w, h); if (x + w > W) R(g, c, x - W, y, w, h); };
      R(g, '#6f7480', 0, 0, W, 512);
      veil(g, 0.14, () => { for (let i = 0; i < 70; i++) { const x0 = rand() * W | 0, y0 = 150 + rand() * 362 | 0, c = rand() < 0.5 ? '#5c606c' : '#7c818c'; for (let k = 0; k < 24; k++) R2(c, (x0 + k * 4) % W, y0 + k * 2, 8, 6); } }); // oblique strata, broad and soft
      veil(g, 0.22, () => { for (let i = 0; i < 400; i++) R2(rand() < 0.7 ? '#5c606c' : '#7c818c', rand() * W | 0, 140 + rand() * 372 | 0, 2, 6 + (rand() * 40 | 0)); }); // ravines
      const ph = [rand(), rand(), rand()].map(a => a * 6.2832), lim = x => 190 + 34 * Math.sin(2 * P * x + ph[0]) + 18 * Math.sin(5 * P * x + ph[1]) + 9 * Math.sin(13 * P * x + ph[2]);
      const cou = []; for (let x = 0; x < W; x += 2) { const h = lim(x) + (rand() * 10 | 0); R(g, '#e8edf5', x, 0, 2, h); if (rand() < 0.1) cou.push([x, h, 12 + (rand() * 50 | 0)]); } // neige
      veil(g, 0.3, () => cou.forEach(([x, h, l]) => R(g, '#dfe6f0', x, h, 4, l))); // flows, broad and pale
      veil(g, 0.25, () => { for (let i = 0; i < 160; i++) R2('#b8c4da', rand() * W | 0, rand() * 200 | 0, 2, 8 + (rand() * 40 | 0)); }); // relief of the snow
    }],
    // snow-laden fir: dark branch masses, a clump of snow on each tier
    firSnow: () => [64, 64, (g, o) => {
      const { R, rand, veil } = o; R(g, '#16302c', 0, 0, 64, 64);
      veil(g, 0.2, () => { for (let i = 0; i < 150; i++) R(g, rand() < 0.6 ? '#000' : '#6a9a8a', rand() * 64 | 0, rand() * 64 | 0, 2 + (rand() * 3 | 0), 1 + (rand() * 2 | 0)); });
      for (let y = 3; y < 64; y += 9) for (let x = 0; x < 64; x += 3) if (rand() < 0.72) { const d = rand() * 3 | 0; R(g, '#e6eefa', x, y + d, 3, 3 + (rand() * 2 | 0)); R(g, '#a8b8d8', x, y + d + 3, 3, 1); R(g, '#0c1c1a', x, y + d + 4, 3, 1); }
    }],
    // cliff in shade (laid as a strip: the left of the texture is the foot, the right the top): dark bedded rock, icicles hanging from the top, snow cornice
    rockGivre: () => [64, 64, (g, o) => {
      const { R, rand, veil } = o; R(g, '#39414f', 0, 0, 64, 64);
      for (let i = 0; i < 240; i++) R(g, rand() < 0.5 ? '#2c333f' : '#4a5364', rand() * 64 | 0, rand() * 64 | 0, 3 + (rand() * 9 | 0), 1 + (rand() * 2 | 0));
      veil(g, 0.4, () => { for (let i = 0; i < 9; i++) R(g, '#10141c', rand() * 50 | 0, rand() * 64 | 0, 6 + (rand() * 18 | 0), 1); }); // failles
      for (let i = 0; i < 18; i++) { const l = 8 + (rand() * 30 | 0), y = rand() * 64 | 0; R(g, '#9fbce0', 58 - l, y, l, 1); R(g, '#d8e8fa', 58 - (l >> 1), y, l >> 1, 2); } // glace
      for (let y = 0; y < 64; y += 2) R(g, '#e6eefa', 57 - (rand() * 4 | 0), y, 12, 2);
    }],
  });
})();
