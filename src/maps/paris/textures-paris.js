// Textures specific to "paris": complements the catalogue in textures.js (same conventions: flat for what emits light, drawn otherwise, random via o.rand). See docs/methods/SCENERY.md.
Object.assign(TEXTURES, {
  // granite setts: 4 m per tile, rows of 12 × 9 cm setts with staggered joints, uneven tints, dark joints, a few worn lighter setts
  cobbles: () => [128, 128, (g, { R, rand }) => {
    R(g, '#3e3c3a', 0, 0, 128, 128);
    for (let y = 0; y < 128; y += 3) for (let x = -(y % 6 ? 2 : 0); x < 128; x += 4) { const v = 98 + rand() * 34 | 0, u = rand() < 0.04 ? 30 : 0; R(g, `rgb(${v + u},${v - 3 + u},${v - 8 + u})`, x, y, 3, 2); }
  }, 4],
  // pavement: 1 m × 50 cm slabs with staggered joints, light asphalt tint, stains and chewing gum
  slabs: () => [64, 64, (g, { R, rand }) => {
    R(g, '#b4ac9e', 0, 0, 64, 64);
    for (let i = 0; i < 300; i++) R(g, rand() < 0.5 ? '#bdb5a7' : '#a8a092', rand() * 64 | 0, rand() * 64 | 0, 1, 1);
    for (let i = 0; i < 12; i++) R(g, '#8e8678', rand() * 64 | 0, rand() * 64 | 0, 1, 1);
    for (let y = 0; y < 64; y += 8) { R(g, '#958d80', 0, y, 64, 1); for (let x = (y & 8); x < 64; x += 16) R(g, '#958d80', x, y, 1, 8); }
  }, 4],
  // square's central island: 1 m light granite slabs, speckled grain, fine joints
  granite: () => [64, 64, (g, { R, rand }) => { R(g, '#cfc8ba', 0, 0, 64, 64); for (let i = 0; i < 400; i++) R(g, rand() < 0.5 ? '#d8d2c6' : '#bcb5a6', rand() * 64 | 0, rand() * 64 | 0, 1, 1);
    for (let k = 0; k < 64; k += 16) { R(g, '#a39c8e', 0, k, 64, 1); R(g, '#a39c8e', k, 0, 1, 64); } }, 4],
  // Morris column: show posters tightly packed on a bottle-green ground, a light or dark title on each
  posters: () => [64, 64, (g, { R, rand }) => { R(g, '#1e4a36', 0, 0, 64, 64);
    for (let x = 1; x < 64; x += 16) for (let y = 6; y < 56; y += 17) { const c = ['#c8302a', '#e8c040', '#2a4a8a', '#f0ece0', '#1a1a1a', '#d86a2a'][rand() * 6 | 0]; R(g, c, x, y, 14, 15); R(g, c === '#f0ece0' ? '#1a1a1a' : '#f0ece0', x + 2, y + 2, 10, 3); R(g, '#8a8478', x + 2, y + 9, 10, 1); } }],
  // ground-floor shopfront, 13 × 4.4 m: painted fascia with the sign (invented name), display windows framed by pilasters, door; the interior tells the trade
  //   trade: cafe, bakery, bookshop, pharmacy, florist, cheese shop, fashion, butcher; background = the panelling colour; gold = the lettering colour
  shopfront: (genre, label, backdrop, gold) => [256, 88, (g, { R, rand, veil }) => {
    R(g, backdrop, 0, 0, 256, 88); veil(g, 0.25, () => { R(g, '#000', 0, 20, 256, 2); R(g, '#fff', 0, 0, 256, 1); });
    g.fillStyle = gold; g.font = 'bold 15px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, 128, 11, 236);
    const door = rand() < 0.5 ? 12 : 214, spd = [[8, 52], [70, 52], [134, 52], [196, 52]].filter(([x]) => Math.abs(x + 26 - door - 15) > 30);
    R(g, '#1c1e22', door, 26, 30, 62); R(g, '#3a4a58', door + 4, 30, 22, 30); R(g, gold, door + 24, 58, 2, 4); // glazed door, handle
    for (const [x, w] of spd) {
      R(g, '#20242a', x, 26, w, 54); R(g, '#2e3a46', x + 2, 28, w - 4, 50); // display window, reflection of the sky at the top
      veil(g, 0.25, () => R(g, '#c8d8f0', x + 2, 28, w - 4, 8));
      const P = (c, a, b, ww, hh) => R(g, c, x + a, b, ww, hh);
      if (genre === 'cafe') { P('#6a3a1e', 2, 62, w - 4, 16); P('#c8a060', 2, 61, w - 4, 2); for (let i = 6; i < w - 6; i += 8) { P('#ffd890', i, 40, 3, 4); P('#3a2a1a', i + 1, 66, 2, 12); } }
      else if (genre === 'bakery') { for (let y = 44; y < 76; y += 9) { P('#8a6a40', 2, y + 6, w - 4, 2); for (let i = 4; i < w - 8; i += 7) P(rand() < 0.5 ? '#c8862a' : '#e0a848', i, y + 1, 6, 5); } }
      else if (genre === 'bookshop') { for (let y = 36; y < 78; y += 10) { P('#4a3020', 2, y + 8, w - 4, 2); for (let i = 3; i < w - 4; i += 2) P(['#a8302a', '#2a4a8a', '#e8e0c8', '#2a6a3a', '#d8a030', '#5a2a5a'][rand() * 6 | 0], i, y + (rand() * 3 | 0), 2, 8); } }
      else if (genre === 'pharmacy') { P('#e8f0ec', 2, 36, w - 4, 42); for (let y = 40; y < 76; y += 8) for (let i = 4; i < w - 6; i += 5) P(['#2a9a5a', '#e8e8e8', '#4a8ac8', '#e85a5a'][rand() * 4 | 0], i, y, 4, 5); }
      else if (genre === 'florist') { P('#2a4a2a', 2, 40, w - 4, 38); for (let i = 0; i < 60; i++) P(['#e8405a', '#f0c030', '#f4f0f0', '#c060c0', '#ff8a3a'][rand() * 5 | 0], 2 + rand() * (w - 7) | 0, 42 + rand() * 34 | 0, 3, 3); }
      else if (genre === 'cheeseShop') { P('#e8e0c8', 2, 60, w - 4, 18); for (let i = 4; i < w - 9; i += 9) { P('#f0c850', i, 52, 8, 7); P('#e8e8d8', i + 2, 44, 5, 6); } }
      else if (genre === 'butcher') { P('#f0e8e0', 2, 36, w - 4, 42); P('#8a1a1a', 2, 62, w - 4, 3); for (let i = 5; i < w - 7; i += 7) P('#b03a3a', i, 40, 4, 12); }
      else { P('#e8e0d8', 2, 74, w - 4, 4); for (let i = 8; i < w - 12; i += 16) { P('#d8c0a8', i + 2, 38, 4, 4); P(['#1a1a2a', '#a83a3a', '#e8e0d0', '#3a5a8a'][rand() * 4 | 0], i, 42, 8, 20); P('#2a2a2a', i + 3, 62, 2, 12); } } // mode : mannequins
      R(g, backdrop, x + w / 2 - 1, 26, 2, 54); // meneau
    }
    R(g, '#8a8478', 0, 84, 256, 4); // soubassement de pierre
  }],
  // striped awning canvas, tintable: white and grey bands (the tint makes them colour and dark colour), scalloped valance at the bottom
  clothStriped: () => [32, 32, (g, { R }) => { for (let x = 0; x < 32; x += 4) R(g, x % 8 ? '#9a9a9a' : '#ffffff', x, 0, 4, 32); }],
  // newspaper kiosk: bottle-green panels with mouldings, newspapers and magazines displayed, awning open over the counter
  kiosk: () => [64, 64, (g, { R, rand }) => {
    R(g, '#1e4a36', 0, 0, 64, 64); for (let x = 0; x < 64; x += 16) R(g, '#163a2a', x, 0, 1, 64); R(g, '#2a6048', 0, 0, 64, 2);
    for (let y = 8; y < 44; y += 12) for (let x = 2; x < 62; x += 8) { R(g, ['#f0ece0', '#e8c8c0', '#f4f0e8', '#c8d8e8'][rand() * 4 | 0], x, y, 7, 10); R(g, '#202020', x + 1, y + 1, 5, 2); R(g, ['#c83a2a', '#2a4a8a', '#404040'][rand() * 3 | 0], x + 1, y + 5, 5, 4); }
    R(g, '#0e2a1e', 0, 48, 64, 16);
  }],
  // barge's wheelhouse: varnished wood with large square windows and portholes, coloured curtains, a few lit windows
  roof: () => [64, 16, (g, { R, rand }) => { R(g, '#6a4a2a', 0, 0, 64, 16); for (let x = 0; x < 64; x += 2) R(g, '#5a3c22', x, 0, 1, 16);
    for (let x = 3; x < 62; x += 8) { R(g, rand() < 0.3 ? '#ffd890' : '#24303a', x, 4, 5, 6); R(g, ['#c84a3a', '#e8d8a0', '#3a6a8a'][rand() * 3 | 0], x, 4, 1, 6); } R(g, '#2a2a2a', 0, 14, 64, 2); }],
  // Gothic rose window: a wheel of dark blue and red glass with radiating tracery in a stone square
  pink: () => [64, 64, (g, { R, rand }) => {
    R(g, '#c9b896', 0, 0, 64, 64); g.fillStyle = '#4a4030'; g.beginPath(); g.arc(32, 32, 30, 0, 6.2832); g.fill();
    for (let r = 27; r > 3; r -= 4) for (let k = 0; k < 24; k++) { const a = k / 24 * 6.2832 + r * 0.1; R(g, ['#1a2a6a', '#6a1a2a', '#2a4a8a', '#c8a040', '#1a4a3a'][rand() * 5 | 0], 32 + Math.cos(a) * r - 1 | 0, 32 + Math.sin(a) * r - 1 | 0, 3, 3); }
    g.strokeStyle = '#d8c8a8'; g.lineWidth = 1; for (let k = 0; k < 12; k++) { const a = k / 12 * 6.2832; g.beginPath(); g.moveTo(32, 32); g.lineTo(32 + Math.cos(a) * 29, 32 + Math.sin(a) * 29); g.stroke(); }
    g.lineWidth = 2; for (const r of [29, 18, 6]) { g.beginPath(); g.arc(32, 32, r, 0, 6.2832); g.stroke(); }
  }],
  // lead roofs: sheets with vertical battens, patinated bluish grey
  lead: () => [64, 64, (g, { R, rand, veil }) => { R(g, '#5a6470', 0, 0, 64, 64); for (let x = 0; x < 64; x += 4) R(g, '#6e7884', x, 0, 1, 64); veil(g, 0.2, () => { for (let i = 0; i < 40; i++) R(g, '#fff', rand() * 64 | 0, rand() * 64 | 0, 2, 3); }); }, 8],
  // Gothic wall: 4 m bays between buttresses, tall pointed-arch windows with dark stained glass and mullion, string course at mid-height; 8 m tile
  wallGothic: () => [64, 64, (g, { R, rand, veil }) => {
    R(g, '#d8ccb2', 0, 0, 64, 64);
    for (let x = 0; x < 64; x += 32) { R(g, '#bfb298', x, 0, 4, 64); veil(g, 0.35, () => R(g, '#000', x + 4, 0, 1, 64)); }
    for (const x of [10, 42]) for (const y0 of [4, 36]) { g.fillStyle = '#28304a'; g.beginPath(); g.moveTo(x, y0 + 26); g.lineTo(x, y0 + 8); g.quadraticCurveTo(x, y0, x + 6, y0 - 2); g.quadraticCurveTo(x + 12, y0, x + 12, y0 + 8); g.lineTo(x + 12, y0 + 26); g.fill();
      for (let i = 0; i < 10; i++) R(g, ['#5a2a3a', '#2a4a7a', '#7a6a3a'][rand() * 3 | 0], x + 1 + (rand() * 10 | 0), y0 + 4 + (rand() * 20 | 0), 1, 2); R(g, '#c8bca2', x + 5, y0 + 2, 2, 24); }
    R(g, '#a89c84', 0, 31, 64, 2); veil(g, 0.15, () => { for (let i = 0; i < 6; i++) R(g, '#000', rand() * 64 | 0, rand() * 20 | 0, 1, 10 + rand() * 20 | 0); });
  }, 8],
  // carved stone: figures in high relief, lit from above (light top, shaded bottom), on a background of dressed stone
  basRelief: () => [64, 64, (g, { R, rand, veil }) => {
    R(g, '#a89676', 0, 0, 64, 64);
    for (let i = 0; i < 22; i++) { const x = rand() * 58 | 0, y = rand() * 54 | 0, w = 3 + rand() * 6 | 0, h = 6 + rand() * 10 | 0; R(g, '#5e5038', x + 1, y + 2, w, h); R(g, '#e8dcc0', x, y, w, h - 2); R(g, '#d4c4a2', x, y + 2, w, h - 4); }
    veil(g, 0.3, () => { R(g, '#000', 0, 0, 64, 1); R(g, '#000', 0, 63, 64, 1); });
  }, 8],
});
