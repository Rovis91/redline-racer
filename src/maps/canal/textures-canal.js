// Textures specific to "canal": completes the textures.js catalog (same conventions: flat fill for what emits light, drawing otherwise, randomness per o.rand). See docs/methods/SCENERY.md.
// The canal has become a large American-style oval: terraces full of people, boxes, fences, stands, ranking boards. Invented sponsors.
(() => {
  const SKIN = ['#f0c8a0', '#d8a070', '#a86a40', '#6a4028', '#f4d8b8'], JERSEY = ['#e83f8c', '#ffc04a', '#2aa39a', '#f4f0e0', '#1848c8', '#c8102e', '#ff7a3d', '#1a1420', '#8ad040', '#7a4078'];
  const pick = (a, rand) => a[rand() * a.length | 0];
  const plainText = (g, txt, x, y, px, col, align = 'left') => { g.fillStyle = col; g.font = 'bold ' + px + 'px sans-serif'; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(txt, x, y); };
  Object.assign(TEXTURES, {
    // crowd on the terraces: one row every 0.75 m of slope (people a little larger than life, so they read from the track); a third wear the stand's colour. The upper half and the lower half show the same people,
    // the lower one with raised arms and placards: shifting the texture by half a height moves the crowd without redrawing anything.
    // Drawn upside down: on the top face of a slope, the top of the texture is at the foot of the terraces.
    crowd: (backdrop, section) => [128, 128, (g, o) => {
      const { R, rand } = o; g.translate(0, 128); g.scale(1, -1);
      for (const y0 of [0, 64]) { R(g, backdrop, 0, y0, 128, 64); for (let r = 0; r < 4; r++) { R(g, '#2a2430', 0, y0 + r * 16 + 13, 128, 3); R(g, '#8a8090', 0, y0 + r * 16 + 12, 128, 1); } }
      for (let r = 0; r < 4; r++) for (let x = rand() * 4 | 0; x < 124; x += 8 + (rand() * 3 | 0)) {
        const empty = rand() < 0.1, skin = pick(SKIN, rand), jersey = rand() < 0.35 ? section : pick(JERSEY, rand), hair = rand() < 0.5 ? '#1a1410' : pick(['#6a4020', '#e8c060', '#3a2a20', '#f4f0e0'], rand), gesture = rand(), sign = pick(JERSEY, rand);
        for (const y0 of [0, 64]) {
          const y = y0 + r * 16; if (empty) { R(g, '#e83f8c', x + 1, y + 8, 6, 4); continue; } // free seat
          R(g, jersey, x, y + 6, 7, 7); R(g, skin, x + 2, y + 2, 3, 4); R(g, hair, x + 2, y + 1, 3, 2);
          if (y0 && gesture < 0.4) { R(g, skin, x - 1, y - 1, 1, 6); R(g, skin, x + 7, y - 1, 1, 6); } // arms raised
          else if (y0 && gesture < 0.5) R(g, sign, x - 1, y - 3, 9, 5); // pancarte, drapeau
          else if (!y0 && gesture > 0.92) R(g, sign, x + 1, y + 7, 5, 2); // scarf
        }
      }
    }, 6],
    // lit glazed boxes: 2 m bays, dark uprights, silhouettes
    vipBoxes: () => [64, 64, (g, o) => {
      const { R, rand } = o; R(g, '#2a2030', 0, 0, 64, 64);
      for (let y = 0; y < 64; y += 32) for (let x = 0; x < 64; x += 16) {
        R(g, rand() < 0.3 ? '#f0b070' : '#ffd890', x + 1, y + 4, 14, 22); R(g, '#fff0c8', x + 1, y + 4, 14, 3);
        for (let k = 0; k < 2; k++) if (rand() < 0.6) { const px = x + 2 + (rand() * 10 | 0); R(g, '#3a2a30', px, y + 14, 3, 12); R(g, '#3a2a30', px, y + 11, 3, 3); }
      }
    }, 8],
    // stair treads: pale concrete, nosings every 0.5 m, yellow strip at the edge
    steps: () => [64, 64, (g, o) => {
      const { R, veil } = o; R(g, '#c8c0b4', 0, 0, 64, 64); for (let y = 0; y < 64; y += 4) R(g, '#6a6258', 0, y, 64, 1);
      R(g, '#ffc04a', 0, 0, 2, 64); R(g, '#ffc04a', 62, 0, 2, 64); veil(g, 0.2, () => { for (let i = 0; i < 200; i++) R(g, '#000', o.rand() * 64 | 0, o.rand() * 64 | 0, 1, 1); });
    }, 8],
    // banner of two sponsors (invented) on the parapet of a 14 m stand module, from the k-th one on: stretched across the face, no repetition
    streamer: k => [192, 20, (g, o) => {
      const l = [['SOLAR COLA', '#c8102e', '#f4f0e0'], ['DUSK RADIO 94', '#1a1420', '#ffc04a'], ['PALM TIRES', '#f4f0e0', '#1848c8'], ['RANCHO PARTS', '#ffc04a', '#1a1420'], ['CANAL 6', '#e83f8c', '#f4f0e0'], ['NITRO TACO', '#2aa39a', '#f4f0e0']];
      for (let j = 0; j < 2; j++) { const [t, f, c] = l[(k + j) % l.length], x = j * 96; o.R(g, f, x, 0, 96, 20); o.R(g, '#08080c', x, 0, 1, 20); plainText(g, t, x + 48, 10.5, 13, c, 'center'); }
    }],
    // protective fence: 0.5 m diamond mesh, cables and rails; transparent background (alphaTest material)
    grating: () => [32, 32, (g, o) => {
      for (let i = 0; i < 32; i++) for (let k = 0; k < 32; k += 4) { o.R(g, '#c8ccd4', (i + k) % 32, i, 1, 1); o.R(g, '#a8acb4', (k - i + 64) % 32, i, 1, 1); }
      o.R(g, '#e0e4ea', 0, 0, 2, 32); o.R(g, '#9a9ea8', 30, 0, 2, 32); o.R(g, '#9a9ea8', 15, 0, 1, 32);
    }],
    // mown grass in 5 m stripes (the ground repeats its texture every 10 m)
    lawn: () => [64, 64, (g, o) => {
      const { R, rand } = o; R(g, '#55702e', 0, 0, 64, 32); R(g, '#4a6428', 0, 32, 64, 32); // stripes along the straights (u follows x)
      for (let i = 0; i < 420; i++) R(g, pick(['#62803a', '#3e5622', '#6a8640', '#46602a'], rand), rand() * 64 | 0, rand() * 64 | 0, 1, 1 + (rand() * 2 | 0));
    }],
    // car park: asphalt, 2.5 m bays marked in white, aisle in the middle
    parking: () => [64, 64, (g, o) => {
      const { R, rand } = o; R(g, '#2a2a2e', 0, 0, 64, 64); for (let i = 0; i < 300; i++) R(g, rand() < 0.5 ? '#343438' : '#222226', rand() * 64 | 0, rand() * 64 | 0, 1, 1);
      for (let x = 0; x < 64; x += 20) { R(g, '#d8d4c8', x, 0, 1, 22); R(g, '#d8d4c8', x, 42, 1, 22); } R(g, '#d8d4c8', 0, 22, 64, 1); R(g, '#d8d4c8', 0, 41, 64, 1);
    }, 8],
    // pit garage, raised shutter: lit workshop, red tool chests, stacked tyres, covered car
    garageOpen: () => [64, 32, (g, o) => {
      const { R } = o; R(g, '#e8ecf0', 0, 0, 64, 32); R(g, '#b8bcc4', 0, 24, 64, 8); R(g, '#3a3a40', 0, 0, 64, 3);
      for (const x of [2, 54]) { R(g, '#c8102e', x, 12, 8, 12); R(g, '#801018', x, 16, 8, 1); R(g, '#801018', x, 20, 8, 1); }
      for (const y of [14, 18, 22]) R(g, '#1a1a1e', 13, y, 6, 3); R(g, '#1848c8', 22, 17, 24, 7); R(g, '#102a80', 26, 14, 14, 4); R(g, '#1a1a1e', 24, 22, 4, 3); R(g, '#1a1a1e', 40, 22, 4, 3);
    }],
    // giant leaderboard screen, readable from both straights
    ranking: () => [256, 160, (g, o) => {
      const { R } = o; R(g, '#08080c', 0, 0, 256, 160); R(g, '#e83f8c', 0, 0, 256, 26); plainText(g, 'CANAL 6 SPEEDWAY', 128, 14, 18, '#f4f0e0', 'center');
      [['1', 'DRE', '—', '#ffc04a'], ['2', 'ROSA', '+0.41', '#f4f0e0'], ['3', 'VOUS', '+1.07', '#2aa39a'], ['4', 'CAL', '+2.88', '#f4f0e0']].forEach(([p, n, e, c], k) => {
        const y = 46 + k * 30; R(g, k & 1 ? '#14121a' : '#1c1a24', 4, y - 13, 248, 27); plainText(g, p, 14, y, 22, '#ff7a3d'); plainText(g, n, 46, y, 22, c); plainText(g, e, 246, y, 18, '#c8c0b4', 'right');
      });
    }],
    // position pylon: car numbers stacked, the first at the top
    pylonTimer: () => [32, 256, (g, o) => {
      const { R } = o; R(g, '#08080c', 0, 0, 32, 256); R(g, '#ffc04a', 0, 0, 32, 20); plainText(g, 'P', 16, 11, 16, '#08080c', 'center');
      ['7', '23', '6', '41', '12', '88', '3', '19', '55', '9'].forEach((n, k) => { const y = 34 + k * 22; R(g, JERSEY[k % JERSEY.length], 2, y - 9, 4, 18); plainText(g, n, 19, y, 16, '#f4f0e0', 'center'); });
    }],
    // motorhome: white body, tinted windows, door, piping
    campingCar: () => [64, 32, (g, o) => {
      const { R } = o; R(g, '#ece8e0', 0, 0, 64, 32); R(g, '#2a2830', 8, 8, 18, 8); R(g, '#2a2830', 34, 8, 10, 8); R(g, '#c8c0b4', 48, 8, 7, 18); R(g, '#8a8478', 0, 28, 64, 4);
      o.veil(g, 0.25, () => { for (let i = 0; i < 80; i++) R(g, '#000', o.rand() * 64 | 0, o.rand() * 32 | 0, 1, 1); });
    }],
  });
})();
