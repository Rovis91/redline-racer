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
    // bare ice on the roadway (14 m wide, 8 pixels per metre): dark and smooth on the pale snow, pale veins and cracks, jagged edges.
    // The alpha does double duty: 0 = no ice (pixel discarded by alphaTest), 0.8 = ice, slightly glossy under dynamic light (brighter, it reflects the sky and blends from afar with the snow).
    // end = 1: the last 10 metres of a plate, in tongues tapering toward the bottom of the texture
    iceVivid: tip => [64, tip ? 80 : 256, (g, o) => {
      const { R, rand, veil } = o, H = tip ? 80 : 256; R(g, '#3a74ac', 0, 0, 64, H);
      for (let i = 0; i < H * 2; i++) R(g, rand() < 0.5 ? '#2c6094' : '#5094cc', rand() * 64 | 0, rand() * H | 0, 1 + (rand() * 2 | 0), 3 + (rand() * 12 | 0)); // the ice is drawn along the direction of the road: glacier blue, not asphalt grey
      veil(g, 0.6, () => { for (let i = 0; i < H / 5; i++) R(g, rand() < 0.4 ? '#cfeaff' : '#8cc4f0', rand() * 64 | 0, rand() * H | 0, 1, 10 + (rand() * 30 | 0)); }); // polished reflections, long and thin
      veil(g, 0.8, () => { for (let i = 0; i < H / 12; i++) { let x = 6 + rand() * 52 | 0, y = rand() * H | 0; for (let k = 0; k < 26; k++) { R(g, '#eef8ff', x, y, 1, 1); if (rand() < 0.5) x += rand() < 0.5 ? -1 : 1; y = (y + 1) % H; } } }); // fissures
      veil(g, 0.5, () => { for (let i = 0; i < H / 4; i++) R(g, '#f2f8ff', rand() * 62 | 0, rand() * H | 0, 2, 1); }); // hoar frost
      g.globalCompositeOperation = 'destination-out';
      g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(0, 0, 64, H);
      g.fillStyle = '#000';
      for (let y = 0; y < H; y += 4) { g.fillRect(0, y, 1 + (rand() * 5 | 0), 4); const w = 1 + (rand() * 5 | 0); g.fillRect(64 - w, y, w, 4); }
      if (tip) for (let x = 0; x < 64; x += 4) { const t = 14 + (rand() * 58 | 0); g.fillRect(x, t, 4, H - t); if (rand() < 0.5) g.fillRect(x + (rand() < 0.5 ? -2 : 4), t - 8, 2, 8); }
      g.globalCompositeOperation = 'source-over';
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
