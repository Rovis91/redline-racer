// Textures specific to "stade" (Grand Vacarme): completes the textures.js catalogue, same conventions. See docs/methods/SCENERY.md.
(() => {
  const plainText = (g, txt, x, y, px, col, align = 'left') => { g.fillStyle = col; g.font = 'bold ' + px + 'px sans-serif'; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(txt, x, y); };
  Object.assign(TEXTURES, {
    // arena floor: added packed earth, light and dark clods, crossing tire tracks
    terreBeaten: () => [64, 64, (g, o) => {
      const { R, rand, veil } = o; R(g, '#5a3d2e', 0, 0, 64, 64);
      for (let i = 0; i < 420; i++) R(g, rand() < 0.5 ? '#4c3226' : '#684838', rand() * 64 | 0, rand() * 64 | 0, 1 + (rand() * 3 | 0), 1);
      veil(g, 0.22, () => { for (let i = 0; i < 7; i++) { const x = rand() * 60 | 0; R(g, '#000', x, 0, 2, 64); R(g, '#000', x + 5, 0, 2, 64); } for (let i = 0; i < 4; i++) R(g, '#000', 0, rand() * 60 | 0, 64, 2); });
      for (let i = 0; i < 24; i++) R(g, '#7a5846', rand() * 64 | 0, rand() * 64 | 0, 2, 2);
    }, 8],
    // rollable walls: dark gray-blue painted boards (lighter, the face toward the roof was saturating), joints, and the black tire marks of the cars that ran into them.
    // game.js lays a tile on a facet about 1.5 m wide and 16 m long (x across, y along): the grain is drawn wide and short so it does not stretch into streaks
    // game.js lays the plate u on a facet (~2 m wide) and v over 16 m long: 16 x 128 px keeps roughly square pixels (~0.13 m) instead of stretched streaks
    faceArena: () => [16, 128, (g, o) => {
      const { R, rand, veil } = o; R(g, '#3c404c', 0, 0, 16, 128);
      for (let i = 0; i < 140; i++) R(g, rand() < 0.5 ? '#343844' : '#444956', rand() * 16 | 0, rand() * 128 | 0, 1 + (rand() * 2 | 0), 1 + (rand() * 2 | 0));
      R(g, '#2a2e38', 0, 0, 1, 128); for (let y = 0; y < 128; y += 32) R(g, '#2a2e38', 0, y, 16, 1); // seam between facets, slab joint every 4 m
      veil(g, 0.5, () => { for (let i = 0; i < 5; i++) R(g, '#101014', rand() * 15 | 0, rand() * 128 | 0, 1, 16 + (rand() * 48 | 0)); }); // tire marks along the racing direction
    }, 8],
    // stand banners: two invented advertisers per texture, k = the first
    bannerStade: k => [192, 20, (g, o) => {
      const l = [['VOLT COLA', '#e8362a', '#f4f0e0'], ['RADIO KOP 170', '#16161c', '#ffc21a'], ['PNEUS TONNERRE', '#f4f0e0', '#1c3fa8'], ['BRASERO GRILL', '#ffc21a', '#16161c'], ['GRAND VACARME', '#1c3fa8', '#f4f0e0'], ['MASTIFF MOTORS', '#16161c', '#e8362a']];
      for (let j = 0; j < 2; j++) { const [t, f, c] = l[(k + j) % l.length], x = j * 96; o.R(g, f, x, 0, 96, 20); o.R(g, '#08080c', x, 0, 1, 20); plainText(g, t, x + 48, 10.5, 12, c, 'center'); }
    }],
    // roof underside, self-lit: dark bays, purlins, and a scatter of lamps every 4 m
    roofArena: () => [64, 64, (g, o) => {
      const { R } = o; R(g, '#0a0a12', 0, 0, 64, 64);
      for (const k of [0, 32]) { R(g, '#1c1c2a', 0, k, 64, 2); R(g, '#16161f', k, 0, 1, 64); }
      for (let x = 7; x < 64; x += 16) for (let y = 15; y < 64; y += 16) { R(g, '#fff4d8', x, y, 2, 2); R(g, '#6a6048', x - 1, y, 1, 2); R(g, '#6a6048', x + 2, y, 1, 2); }
    }, 16],
    // hand-painted supporters' banner hanging from the roof: k = which one; plain background, border, stacked words (read vertically)
    bannerSupporter: k => [64, 160, (g, o) => {
      const l = [[['ALLEZ', 'NOUR !'], '#e8362a', '#f4f0e0'], [['ENZO', 'PLEIN', 'GAZ'], '#16161c', '#ffc21a'], [['JADE', 'REINE', 'DU MUR'], '#1c3fa8', '#f4f0e0'],
        [['KOP', '170'], '#ffc21a', '#16161c'], [['ON', 'VEUT', 'DU', 'BRUIT'], '#f4f0e0', '#e8362a'], [['MASTIFF', '4', 'EVER'], '#2ab84a', '#16161c']][k % 6], [words, f, c] = l;
      o.R(g, f, 0, 0, 64, 160); o.R(g, c, 3, 3, 58, 2); o.R(g, c, 3, 155, 58, 2);
      words.forEach((m, j) => plainText(g, m, 32, 80 + (j - (words.length - 1) / 2) * 30, m.length > 5 ? 12 : 20, c, 'center'));
    }],
    // pit bottom mud: nearly black sodden earth, lighter puddles (the reflection comes from the material), tire tracks
    mud: () => [64, 64, (g, o) => {
      const { R, rand, veil } = o; R(g, '#2a1c14', 0, 0, 64, 64);
      for (let i = 0; i < 300; i++) R(g, rand() < 0.5 ? '#22160f' : '#36261a', rand() * 64 | 0, rand() * 64 | 0, 1 + (rand() * 3 | 0), 1);
      for (let i = 0; i < 6; i++) { const x = rand() * 52 | 0, y = rand() * 56 | 0; R(g, '#4a3a30', x, y, 6 + (rand() * 8 | 0), 3 + (rand() * 4 | 0)); }
      veil(g, 0.35, () => { for (let i = 0; i < 4; i++) { const x = rand() * 58 | 0; R(g, '#000', x, 0, 2, 64); R(g, '#000', x + 4, 0, 2, 64); } });
    }, 6],
    // cube screen: the race standings
    boardStade: () => [256, 160, (g, o) => {
      const { R } = o; R(g, '#08080c', 0, 0, 256, 160); R(g, '#e8362a', 0, 0, 256, 26); plainText(g, 'GRAND VACARME', 128, 14, 18, '#f4f0e0', 'center');
      [['1', 'NOUR', '—', '#ffc21a'], ['2', 'VOUS', '+0.33', '#5ad0ff'], ['3', 'ENZO', '+0.92', '#f4f0e0'], ['4', 'JADE', '+2.10', '#f4f0e0']].forEach(([p, n, e, c], k) => {
        const y = 46 + k * 30; R(g, k & 1 ? '#14121a' : '#1c1a24', 4, y - 13, 248, 27); plainText(g, p, 14, y, 22, '#e8362a'); plainText(g, n, 46, y, 22, c); plainText(g, e, 246, y, 18, '#c8c0b4', 'right');
      });
    }],
    // flamethrower flame, in added light (black does not show): wide tongue at the bottom, tapering at the top, from white-yellow to red
    flame: () => [32, 64, (g, o) => {
      o.R(g, '#000', 0, 0, 32, 64);
      for (let y = 0; y < 64; y++) { const t = y / 63, l = 3 + 13 * Math.sin(Math.PI * Math.min(1, 0.15 + t * 0.85)) * (0.35 + 0.65 * t), c = (dl, col) => { if (l - dl > 0) o.R(g, col, Math.round(16 - l + dl), y, Math.round(2 * (l - dl)), 1); };
        c(0, t < 0.35 ? '#a01808' : '#e8401a'); c(3, t < 0.3 ? '#e8401a' : '#ff8a1a'); c(6, t < 0.45 ? '#ff8a1a' : '#ffd24a'); if (t > 0.6) c(9, '#fff4c8'); }
    }],
    // chase spotlight beam, in added light: bright under the lamp (top of the cone), fading as it reaches the ground
    beam: () => [4, 32, (g, o) => { for (let y = 0; y < 32; y++) { const v = Math.round(40 * (1 - y / 31) ** 2); o.R(g, `rgb(${v * 0.8 | 0},${v * 0.85 | 0},${v})`, 0, y, 4, 1); } }],
    // giant screen: two images on top of each other, the scenery shows one then the other
    screenGiant: () => [256, 128, (g, o) => {
      const { R } = o; R(g, '#08080c', 0, 0, 256, 128);
      R(g, '#e8362a', 0, 0, 256, 64); plainText(g, 'GRAND VACARME', 128, 24, 26, '#f4f0e0', 'center'); plainText(g, 'CE SOIR · COMPLET', 128, 49, 14, '#16161c', 'center');
      for (let x = -32; x < 256; x += 32) { g.fillStyle = '#ffc21a'; g.beginPath(); g.moveTo(x, 64); g.lineTo(x + 16, 64); g.lineTo(x + 48, 128); g.lineTo(x + 32, 128); g.fill(); }
      R(g, '#08080c', 40, 76, 176, 40); plainText(g, 'QUEL SAUT !', 128, 97, 26, '#ffc21a', 'center');
    }],
  });
})();
