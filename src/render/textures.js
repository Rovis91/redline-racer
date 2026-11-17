// Texture catalogue: the look of each surface in the game, and nothing else (neither shape nor placement).
// Two kinds of entries:
//   flat    — name: 0xrrggbb          a solid tint, reserved for what emits light (lamps, lights, neon, signage paint)
//   drawing — name: (...settings) => [width, height, (g, o) => { ... }, tile]   painted on a 2D canvas
//            o = { R, rnd, rand, veil, speckle }: tools of game.js. rnd is the randomness shared with placement (do not add calls to it,
//            the scenery would move); rand is a randomness of its own for the texture, to use for any new drawing.
//            tile (optional): the drawing repeats every `tile` metres on the boxes, instead of stretching over each face.
// Detail reference: the roadway. 8 pixels per metre, a grain, joints or ribs, wear (drips, rust, chips); no plain surface.
// The shapes are in shapes.js; which texture goes on what, and where, is decided at placement (game.js for the track and the city, scenery-<map>.js for the other maps),
// through mat('name', options, ...settings). The option c tints a light drawing (bodywork, container, wagon).
// The colours specific to a map (roadway, faces, guardrails) stay in its theme, mapDefs.js, and arrive here as settings.
(() => {
  const M = 8; // material tile: 64 pixels for 8 m, the density of the roadway
  const scatter = (g, { R, rand }, n, c, w = 1, h = 1) => { for (let i = 0; i < n; i++) R(g, c, rand() * 64 | 0, rand() * 64 | 0, w, h); };
  const patina = (g, o, n = 260) => o.veil(g, 0.2, () => { scatter(g, o, n, '#000'); scatter(g, o, n / 3, '#fff'); scatter(g, o, n / 20, '#000', 3, 2); }); // the grain shared by all surfaces
  const drips = (g, o, n, c = '#000', a = 0.2) => o.veil(g, a, () => { for (let i = 0; i < n; i++) o.R(g, c, o.rand() * 64 | 0, o.rand() * 30 | 0, 1 + (o.rand() * 2 | 0), 6 + o.rand() * 26 | 0); });
  // board-marked concrete: formwork joints every 4 m, formwork holes, drips, lighter construction joints
  const concretePart = c => () => [64, 64, (g, o) => {
    const { R, rand, veil } = o; R(g, c, 0, 0, 64, 64); patina(g, o);
    veil(g, 0.12, () => { for (let i = 0; i < 5; i++) R(g, i & 1 ? '#fff' : '#000', rand() * 50 | 0, rand() * 50 | 0, 8 + rand() * 14 | 0, 6 + rand() * 12 | 0); });
    veil(g, 0.3, () => { for (const k of [0, 32]) { R(g, '#000', 0, k, 64, 1); R(g, '#000', k, 0, 1, 64); } for (let x = 8; x < 64; x += 16) for (let y = 8; y < 64; y += 16) R(g, '#000', x, y, 1, 1); });
    drips(g, o, 7);
  }, M];
  // dressed stone: 1 m courses, staggered joints, uneven stones
  const stone = c => () => [64, 64, (g, o) => {
    const { R, rand, veil } = o; R(g, c, 0, 0, 64, 64);
    veil(g, 0.1, () => { for (let y = 0; y < 64; y += 8) for (let x = (y & 8) - 8; x < 64; x += 16) if (rand() < 0.5) R(g, rand() < 0.5 ? '#000' : '#fff', x, y, 16, 8); });
    patina(g, o, 160);
    veil(g, 0.28, () => { for (let y = 0; y < 64; y += 8) { R(g, '#000', 0, y, 64, 1); for (let x = (y & 8); x < 64; x += 16) R(g, '#000', x, y, 1, 8); } });
    drips(g, o, 4, '#000', 0.14);
  }, M];
  // painted metal: 4 m bolted sheets, scratches, rust running from the joints
  const metal = c => () => [64, 64, (g, o) => {
    const { R, rand, veil } = o; R(g, c, 0, 0, 64, 64); patina(g, o, 140);
    veil(g, 0.35, () => { for (const k of [0, 32]) { R(g, '#000', 0, k, 64, 1); R(g, '#000', k, 0, 1, 64); } });
    veil(g, 0.3, () => { for (const k of [2, 34]) for (let i = 3; i < 64; i += 8) { R(g, '#fff', i, k, 1, 1); R(g, '#fff', k, i, 1, 1); } for (let i = 0; i < 8; i++) R(g, '#fff', rand() * 56 | 0, rand() * 64 | 0, 3 + rand() * 6 | 0, 1); });
    drips(g, o, 5, '#5a2a10', 0.3);
  }, M];
  // surfacing: tight grain, patches, crack
  const ground = c => () => [64, 64, (g, o) => {
    const { R, rand, veil } = o; R(g, c, 0, 0, 64, 64); patina(g, o, 420);
    veil(g, 0.18, () => { for (let i = 0; i < 3; i++) { const x = rand() * 44 | 0, y = rand() * 44 | 0, w = 8 + rand() * 12 | 0, h = 8 + rand() * 12 | 0; R(g, i & 1 ? '#fff' : '#000', x, y, w, h); R(g, '#000', x, y, w, 1); R(g, '#000', x, y, 1, h); }
      for (let y = 0, x = 40; y < 64; y++) { if (rand() < 0.3) x += rand() < 0.5 ? -1 : 1; if (y % 23 < 15) R(g, '#000', x, y, 1, 1); } });
  }, M];
  // bark: vertical fibres, knots; ringed for the palm tree
  const bark = (c, rings) => () => [64, 64, (g, o) => {
    const { R, rand, veil } = o; R(g, c, 0, 0, 64, 64);
    veil(g, 0.3, () => { for (let i = 0; i < 90; i++) R(g, rand() < 0.6 ? '#000' : '#fff', rand() * 64 | 0, rand() * 64 | 0, 1, 4 + rand() * 14 | 0); if (rings) for (let y = 0; y < 64; y += 4) R(g, '#000', 0, y + (rand() * 2 | 0), 64, 1); else for (let i = 0; i < 4; i++) R(g, '#000', rand() * 60 | 0, rand() * 60 | 0, 3, 2); });
  }, M / 2];
  // foliage: light and dark masses; etages = sprays in layers (cedar), fronds = long leaflets
  const leaves = (c, tiers, fronds) => () => [64, 64, (g, o) => {
    const { R, rand, veil } = o; R(g, c, 0, 0, 64, 64);
    veil(g, 0.15, () => { for (let i = 0; i < 150; i++) R(g, rand() < 0.55 ? '#000' : '#fff', rand() * 64 | 0, rand() * 64 | 0, fronds ? 5 + rand() * 6 | 0 : 2 + rand() * 3 | 0, fronds ? 1 : 1 + rand() * 2 | 0); });
    if (tiers) veil(g, 0.18, () => { for (let y = 5; y < 64; y += 8) for (let x = 0; x < 64; x += 2) { const d = rand() * 3 | 0; R(g, '#000', x, y + d, 2, 2); R(g, '#fff', x, y + d - 2, 2, 1); } });
  }];
  window.TEXTURES = {
  // ---------- flats: what emits light ----------
  paint: 0xffffff,      // signage and light fixtures, to be tinted by the option c
  neonYellow: 0xfcee0a, neonCyan: 0x00f0ff, neonMagenta: 0xff2bd6,
  lampObj: 0xfff2d0, lightRed: 0xff2030, reflector: 0xff8c1a, blinker: 0xff8c1a, cone: 0xff5a1a, sodium: 0xffb85a, lantern: 0xffd05a, lampCanal: 0xffc04a,

  // ---------- materials, at the roadway's detail ----------
  concreteDark: concretePart('#1c1c26'), concretePart: concretePart('#a89e90'), concreteGray: concretePart('#5e5a54'), whiteBridge: concretePart('#c9ced6'), chalk: stone('#f4f0e8'), stone: stone('#d9c9a8'),
  steelMat: metal('#d8dce0'), matGray: metal('#4a4e56'), gantryGray: metal('#5a5e66'), minium: metal('#c8442c'), castiron: metal('#1e3a2a'), iron: metal('#2a2030'), pylonMat: metal('#3a2c3a'),
  asphalt: ground('#1e2024'), plain: ground('#14161a'),
  trunk: bark('#4a3a2a'), trunkPalmtree: bark('#2a1c20', 1),
  cedar: leaves('#12281f', 1), foliage: leaves('#4a6a3a'), frond: leaves('#1a2418', 0, 1),
  // vitrage sombre : montants, reflets en biais
  paneDark: () => [32, 16, (g, o) => { const { R, veil } = o; R(g, '#14161c', 0, 0, 32, 16); veil(g, 0.14, () => { for (let k = 0; k < 16; k++) { R(g, '#fff', 4 + k, 15 - k, 4, 1); R(g, '#fff', 19 + k / 2 | 0, 15 - k, 2, 1); } }); R(g, '#08090c', 0, 0, 32, 1); R(g, '#08090c', 15, 0, 1, 16); }],
  // light corrugated sheet metal, to be tinted: container or trailer. Ribs, frame, doors, markings, rust
  tin: () => [64, 32, (g, o) => {
    const { R, rand, veil } = o; R(g, '#e6e6e6', 0, 0, 64, 32);
    veil(g, 0.22, () => { for (let x = 0; x < 64; x += 3) { R(g, '#000', x, 0, 1, 32); R(g, '#fff', x + 1, 0, 1, 32); } });
    veil(g, 0.45, () => { R(g, '#000', 0, 0, 64, 2); R(g, '#000', 0, 30, 64, 2); R(g, '#000', 0, 0, 1, 32); R(g, '#000', 63, 0, 1, 32); R(g, '#000', 49, 2, 1, 28); });
    R(g, '#f8f8f8', 8, 8, 18, 6); veil(g, 0.5, () => { for (let x = 10; x < 24; x += 4) R(g, '#000', x, 10, 2, 2); R(g, '#000', 53, 12, 1, 8); R(g, '#000', 58, 12, 1, 8); });
    veil(g, 0.3, () => { for (let i = 0; i < 7; i++) R(g, '#5a2a10', rand() * 64 | 0, 2 + rand() * 12 | 0, 1 + (rand() * 2 | 0), 4 + rand() * 14 | 0); scatter(g, o, 60, '#000'); });
  }],
  // light freight wagon, to be tinted: planks, posts, sliding door, frame
  wagon: () => [64, 32, (g, o) => {
    const { R, veil } = o; R(g, '#e2e2e2', 0, 0, 64, 32);
    veil(g, 0.2, () => { for (let y = 3; y < 26; y += 3) R(g, '#000', 0, y, 64, 1); scatter(g, o, 90, '#000'); });
    veil(g, 0.4, () => { for (let x = 0; x < 64; x += 9) R(g, '#000', x, 0, 1, 26); R(g, '#000', 0, 0, 64, 2); R(g, '#000', 26, 3, 12, 22); });
    veil(g, 0.2, () => R(g, '#fff', 27, 4, 10, 20)); R(g, '#16161a', 0, 26, 64, 6); for (const x of [6, 14, 46, 54]) R(g, '#2c2c34', x, 27, 5, 5);
  }],
  // light bodywork, to be tinted, seen from the side on a single box: glazed band, a door seam, lower body and wheels. Deliberately plainer than the cars of the game (textures-cars.js)
  bodywork: () => [64, 32, (g, o) => {
    const { R, veil } = o; R(g, '#ececec', 0, 0, 64, 32);
    R(g, '#1a1e26', 10, 3, 42, 10); R(g, '#ececec', 30, 3, 2, 10);
    veil(g, 0.2, () => { R(g, '#000', 0, 14, 64, 1); R(g, '#000', 31, 14, 1, 12); });
    R(g, '#101014', 0, 28, 64, 4); for (const x of [8, 46]) { R(g, '#101014', x, 22, 11, 10); R(g, '#3a3a44', x + 3, 25, 5, 5); }
  }],
  // light lacquer, to be tinted: the lower body of a parked car. A door seam, wheel arches; plain, so as to leave the spotlight to the cars of the game
  lacquer: () => [64, 16, (g, o) => {
    const { R, veil } = o; R(g, '#ececec', 0, 0, 64, 16);
    veil(g, 0.2, () => R(g, '#000', 30, 0, 1, 12));
    R(g, '#101014', 0, 13, 64, 3); for (const x of [7, 46]) { R(g, '#101014', x, 6, 11, 10); R(g, '#3a3a44', x + 3, 9, 5, 5); }
  }],
  // warehouse: ribbed cladding, loading doors, band of high windows, grime
  warehouse: () => [64, 32, (g, o) => {
    const { R, rand, veil } = o; R(g, '#8a7a6a', 0, 0, 64, 32);
    veil(g, 0.16, () => { for (let x = 0; x < 64; x += 2) R(g, '#000', x, 0, 1, 32); scatter(g, o, 120, '#000'); });
    R(g, '#6a5c50', 0, 0, 64, 3); for (let x = 3; x < 64; x += 8) R(g, rand() < 0.3 ? '#c8b070' : '#3a3a40', x, 5, 5, 3);
    for (let x = 6; x < 64; x += 20) { R(g, '#5a5048', x, 16, 11, 16); veil(g, 0.3, () => { for (let y = 18; y < 32; y += 3) R(g, '#000', x, y, 11, 1); }); }
    drips(g, o, 6, '#000', 0.18);
  }],

  // ---------- vehicles, ships, port machines ----------
  metalPale: metal('#e2e2e2'), // light painted sheet metal, to be tinted: truck cab, ship hull, port machine
  // tyre seen in profile: tread, sidewall, rim and its nuts
  wheelPart: () => [16, 16, (g, o) => {
    const { R, veil } = o; R(g, '#121214', 0, 0, 16, 16); R(g, '#1c1c20', 2, 2, 12, 12); R(g, '#6a6c72', 4, 4, 8, 8); R(g, '#3a3c42', 6, 6, 4, 4);
    for (const [x, y] of [[5, 5], [10, 5], [5, 10], [10, 10]]) R(g, '#a8aab0', x, y, 1, 1); veil(g, 0.3, () => scatter(g, o, 20, '#000'));
  }],
  // bande de roulement : gomme noire, rainures
  tire: () => [16, 16, (g, { R }) => { R(g, '#141416', 0, 0, 16, 16); for (let y = 1; y < 16; y += 3) R(g, '#08080a', 0, y, 16, 1); }],
  // truck grille: chrome bars on black, invented round emblem
  radiator: () => [32, 16, (g, o) => { const { R } = o; R(g, '#0c0c10', 0, 0, 32, 16); for (let y = 2; y < 15; y += 3) R(g, '#9a9ca4', 1, y, 30, 1); R(g, '#c8cad0', 0, 0, 32, 1); R(g, '#c8cad0', 0, 15, 32, 1); R(g, '#d8dae0', 14, 6, 4, 4); R(g, '#0c0c10', 15, 7, 2, 2); }],
  // stainless tank: lengthwise reflections, welded collars every 2 m, drips
  stainless: () => [64, 32, (g, o) => {
    const { R, rand, veil } = o; R(g, '#b4b8be', 0, 0, 64, 32);
    veil(g, 0.25, () => { for (let y = 0; y < 32; y++) R(g, rand() < 0.5 ? '#fff' : '#000', 0, y, 64, 1); });
    veil(g, 0.4, () => { for (const x of [0, 16, 32, 48]) R(g, '#000', x, 0, 1, 32); });
    R(g, '#e8eaee', 0, 10, 64, 2); drips(g, o, 6, '#3a2a1a', 0.2);
  }, 8],
  // plateau en planches : lattes de 30 cm, clous, taches d'huile
  boards: () => [64, 64, (g, o) => {
    const { R, rand, veil } = o; R(g, '#6a4a2c', 0, 0, 64, 64);
    for (let y = 0; y < 64; y += 3) { R(g, rand() < 0.5 ? '#5a3c22' : '#7a5634', 0, y, 64, 2); R(g, '#2a1a10', 0, y + 2, 64, 1); }
    veil(g, 0.4, () => { for (let x = 4; x < 64; x += 16) for (let y = 1; y < 64; y += 3) R(g, '#c8c0b0', x, y, 1, 1); scatter(g, o, 160, '#000'); for (let i = 0; i < 4; i++) R(g, '#000', rand() * 56 | 0, rand() * 56 | 0, 5 + rand() * 6 | 0, 3 + rand() * 4 | 0); });
  }, 4],
  // bobine d'acier vue de face : spires, cerclage
  coil: () => [16, 16, (g, o) => { const { R, veil } = o; R(g, '#5a5c62', 0, 0, 16, 16); g.strokeStyle = '#8a8c92'; for (let r = 2; r < 8; r += 1.5) { g.beginPath(); g.arc(8, 8, r, 0, 7); g.stroke(); } R(g, '#18181c', 6, 6, 4, 4); veil(g, 0.5, () => R(g, '#c8102e', 0, 7, 16, 2)); }],
  // braided orange strap
  strap: () => [8, 8, (g, { R }) => { R(g, '#d86a1a', 0, 0, 8, 8); for (let y = 0; y < 8; y += 2) R(g, '#b04a10', 0, y, 8, 1); }, 1],
  // deck of a container ship seen from the side: four tiers of 20 and 40 ft containers, mixed colours, seams and doors
  cargo: () => [64, 64, (g, o) => {
    const { R, rand, veil } = o, C = ['#b8442c', '#2c6ab8', '#c9a02c', '#3a8a5a', '#d8d4cc', '#7a3a6a', '#1a4a5a', '#c86a2a', '#5a5e66'];
    for (let y = 0; y < 64; y += 16) for (let x = -(rand() * 30 | 0); x < 64;) { const w = rand() < 0.5 ? 37 : 74; R(g, C[rand() * C.length | 0], x, y, w, 16); veil(g, 0.25, () => { for (let k = x + 1; k < x + w; k += 2) R(g, '#000', k, y + 1, 1, 14); }); R(g, '#16161a', x, y, 1, 16); x += w; }
    for (let y = 0; y < 64; y += 16) R(g, '#16161a', 0, y + 15, 64, 1);
    veil(g, 0.3, () => scatter(g, o, 120, '#000'));
  }, 10.4],
  // steel lattice framework: chords, diagonals, transparent background (material in alphaTest)
  lattice: c => [32, 32, (g, o) => {
    const { R, veil } = o; g.clearRect(0, 0, 32, 32); R(g, c, 0, 0, 32, 3); R(g, c, 0, 29, 32, 3); R(g, c, 0, 0, 3, 32); R(g, c, 29, 0, 3, 32);
    for (let k = 0; k < 32; k++) { R(g, c, k, k, 2, 2); R(g, c, 31 - k, k, 2, 2); }
    veil(g, 0.35, () => { R(g, '#000', 0, 2, 32, 1); R(g, '#000', 0, 31, 32, 1); });
  }, 4],
  // ventilation tower facade: concrete, slanted louvre bands, drips under each band
  shutters: () => [64, 64, (g, o) => {
    const { R, veil } = o; R(g, '#8e8a84', 0, 0, 64, 64); patina(g, o);
    for (let y = 6; y < 64; y += 16) { R(g, '#2a2c30', 2, y, 60, 8); veil(g, 0.6, () => { for (let k = y; k < y + 8; k += 2) R(g, '#9a9ca2', 2, k, 60, 1); }); veil(g, 0.25, () => { for (let x = 2; x < 62; x += 3) R(g, '#000', x, y + 8, 1, 2 + (o.rand() * 5 | 0)); }); }
    veil(g, 0.3, () => { R(g, '#000', 0, 0, 1, 64); R(g, '#000', 32, 0, 1, 64); });
  }, 8],
  // big wheel gondola, lit from inside: windows, posts, coloured lower body
  gondola: c => [16, 16, (g, { R }) => { R(g, c, 0, 0, 16, 16); R(g, '#fff2d0', 2, 2, 12, 7); R(g, c, 7, 2, 2, 7); R(g, '#202028', 0, 10, 16, 1); R(g, '#ffffff', 0, 0, 16, 1); }],
  // lane-assignment signals at a tunnel entrance: green arrows, red cross over the closed lane
  lightsLane: n => [16 * n, 16, (g, { R }) => {
    R(g, '#08080c', 0, 0, 16 * n, 16);
    for (let i = 0; i < n; i++) { const x = i * 16; R(g, '#2a2a30', x, 0, 1, 16); if (i === n - 1) for (let k = 0; k < 9; k++) { R(g, '#ff2030', x + 4 + k, 4 + k, 1, 1); R(g, '#ff2030', x + 12 - k, 4 + k, 1, 1); } else { R(g, '#30ff70', x + 7, 3, 2, 7); for (let k = 0; k < 4; k++) R(g, '#30ff70', x + 4 + k, 9 + k, 8 - 2 * k, 1); } }
  }],
  // tug fender: old black tyres end to end
  defense: () => [16, 8, (g, { R }) => { R(g, '#0a0a0c', 0, 0, 16, 8); for (let x = 0; x < 16; x += 4) { R(g, '#1c1c20', x + 1, 1, 2, 6); R(g, '#000', x, 0, 1, 8); } }, 1.5],
  // port central reservation: asphalt, yellow bay markings every 3 m, stains
  park: () => [64, 64, (g, o) => {
    const { R, rand, veil } = o; R(g, '#202226', 0, 0, 64, 64); patina(g, o, 380);
    veil(g, 0.55, () => { for (let x = 0; x < 64; x += 21) R(g, '#c8a02c', x, 0, 1, 64); R(g, '#c8a02c', 0, 0, 64, 1); R(g, '#c8a02c', 0, 32, 64, 1); });
    veil(g, 0.2, () => { for (let i = 0; i < 6; i++) R(g, '#000', rand() * 56 | 0, rand() * 56 | 0, 4 + rand() * 8 | 0, 3 + rand() * 6 | 0); });
  }, 24],

  // light stucco of a small shop: grain, darker base, drips under the parapet
  stucco: () => [64, 64, (g, o) => { const { R, veil } = o; R(g, '#d8d2c4', 0, 0, 64, 64); patina(g, o, 300); veil(g, 0.25, () => R(g, '#000', 0, 54, 64, 10)); drips(g, o, 8, '#000', 0.12); }, 8],
  // zinc mansard of a Parisian attic: standing seams every 50 cm, pedimented dormers every 4 m, white drips
  zinc: () => [64, 64, (g, o) => {
    const { R, veil } = o; R(g, '#6a7486', 0, 0, 64, 64);
    veil(g, 0.35, () => { for (let x = 0; x < 64; x += 4) { R(g, '#000', x, 0, 1, 64); R(g, '#fff', x + 1, 0, 1, 64); } });
    for (const x of [10, 42]) { R(g, '#e4dccb', x - 1, 20, 14, 26); R(g, '#e4dccb', x + 1, 16, 10, 4); R(g, '#e4dccb', x + 4, 13, 4, 3); R(g, '#2a3038', x + 2, 24, 8, 18); R(g, '#e4dccb', x + 5, 24, 2, 18); veil(g, 0.4, () => R(g, '#000', x - 1, 46, 14, 2)); }
    drips(g, o, 6, '#fff', 0.12);
  }], // placed on scaled instances: stretches over each face, no tile
  // chimney brick: bond, light joints, soot at the top
  brick: () => [16, 16, (g, { R, veil }) => { R(g, '#8a3a2a', 0, 0, 16, 16); for (let y = 0; y < 16; y += 2) { R(g, '#c8b8a0', 0, y, 16, 1); for (let x = (y & 2) * 2; x < 16; x += 8) R(g, '#c8b8a0', x, y, 1, 2); } veil(g, 0.5, () => R(g, '#000', 0, 0, 16, 3)); }, 2],
  // bac acier de toiture : ondes, recouvrements, lanterneaux translucides, rouille
  tinRoof: () => [64, 64, (g, o) => {
    const { R, rand, veil } = o; R(g, '#8a8a88', 0, 0, 64, 64);
    veil(g, 0.25, () => { for (let x = 0; x < 64; x += 3) { R(g, '#000', x, 0, 1, 64); R(g, '#fff', x + 1, 0, 1, 64); } R(g, '#000', 0, 31, 64, 1); });
    for (const x of [6, 38]) R(g, '#b8c4c0', x, 8, 18, 14); drips(g, o, 8, '#5a2a10', 0.25); veil(g, 0.2, () => { for (let i = 0; i < 4; i++) R(g, '#000', rand() * 56 | 0, rand() * 56 | 0, 8, 6); });
  }], // idem

  // ---------- ciel ----------
  skyDef: (stripes, starList) => [512, 128, (g, { R, rnd }) => {
    const gr = g.createLinearGradient(0, 0, 0, 128);
    for (const [p, c] of stripes) gr.addColorStop(p, c);
    R(g, gr, 0, 0, 512, 128);
    for (let i = 0; i < starList; i++) R(g, i % 5 ? '#8a8ac0' : '#ffffff', rnd() * 512 | 0, rnd() * 44 | 0, 1, 1);
  }],
  orb: (col, shadows) => [16, 16, (g, { R }) => { g.fillStyle = col; g.beginPath(); g.arc(8, 8, 7, 0, 7); g.fill(); R(g, shadows, 9, 5, 2, 2); R(g, shadows, 5, 9, 3, 2); }],

  // ---------- piste ----------
  // roadway: one slab of 2W × 32 m. Grain, patches, joints, crack, rubber on the wheel paths, worn paint.
  // The alpha of the texture encodes the puddles (read by the dynamic light: the less opaque, the more it reflects); wet = 2: the central gutter of the canal
  roadway: (asph, spk, edge, dash, k1, k2, wet) => [64, 256, (g, { R, rnd, veil, speckle }) => {
    R(g, asph, 0, 0, 64, 256); speckle(g, 900, spk, 1, 256);
    veil(g, 0.25, () => { speckle(g, 500, '#000', 1, 256); speckle(g, 160, '#fff', 1, 256); });
    veil(g, 0.2, () => {
      for (let i = 0; i < 4; i++) { const x = 8 + rnd() * 34 | 0, y = rnd() * 220 | 0, w = 8 + rnd() * 12 | 0, h = 14 + rnd() * 30 | 0; R(g, i & 1 ? '#fff' : '#000', x, y, w, h); R(g, '#000', x, y, w, 1); R(g, '#000', x, y, 1, h); } // patches
      R(g, '#000', 7, 0, 50, 1); R(g, '#000', 7, 128, 50, 1); // joints de dalle
      for (let y = 0, x = 44; y < 256; y++) { if (rnd() < 0.3) x += rnd() < 0.5 ? -1 : 1; if (y % 97 < 60) R(g, '#000', x, y, 1, 1); } // fissure
    });
    veil(g, 0.15, () => { for (const x of [17, 26, 36, 45]) for (let y = 0; y < 256; y += 4) if (rnd() < 0.8) R(g, '#000', x + (rnd() * 2 | 0), y, 2, 4); }); // gomme
    R(g, edge, 5, 0, 2, 256); R(g, edge, 57, 0, 2, 256);
    for (let y = 0; y < 256; y += 64) { R(g, dash, 31, y, 2, 32); for (const x of [0, 60]) { R(g, k1, x, y, 4, 32); R(g, k2, x, y + 32, 4, 32); } }
    for (let i = 0; i < 260; i++) R(g, asph, [5, 6, 31, 32, 57, 58][rnd() * 6 | 0], rnd() * 256 | 0, 1, 1 + rnd() * 3 | 0); // worn paint
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = 'rgba(0,0,0,.5)'; // puddles: blobs of pixels
    for (let i = wet ? 7 : 2; i > 0; i--) { const x = 8 + rnd() * 44, y = rnd() * 256, r = 3 + rnd() * 5; for (let k = 0; k < 9; k++) { const w = r * (0.5 + rnd()) | 0; g.fillRect(x + (rnd() - 0.5) * r * 2 | 0, y + (rnd() - 0.5) * r * 5 | 0, w, w * 2); } }
    if (wet === 2) { g.fillRect(27, 0, 3, 256); for (let y = 0; y < 256; y += 8) g.fillRect(25 + (rnd() * 3 | 0), y, 2 + (rnd() * 4 | 0), 8); }
    g.globalCompositeOperation = 'source-over';
  }],
  // fine roadway (map option th.roadTex = 'roadwayFine', same settings as roadway): 4 times more pixels, fine soft grain, no light patches;
  // at 270 lines the grain blends into one tone (mipmaps) instead of shimmering; dark, subtle patches, paint and borders in the same places as roadway
  roadwayFine: (asph, spk, edge, dash, k1, k2, wet) => [128, 512, (g, { R, rand: rnd, veil }) => {
    R(g, asph, 0, 0, 128, 512);
    const pts = (n, c, a) => veil(g, a, () => { for (let i = 0; i < n; i++) R(g, c, rnd() * 128 | 0, rnd() * 512 | 0, 1, 1); });
    pts(5000, spk, 0.45); pts(2500, '#000', 0.1); pts(900, '#fff', 0.05);
    veil(g, 0.07, () => {
      for (let i = 0; i < 5; i++) { const x = 16 + rnd() * 70 | 0, y = rnd() * 440 | 0, w = 16 + rnd() * 24 | 0, h = 28 + rnd() * 60 | 0; R(g, '#000', x, y, w, h); } // patches: a little darker, never lighter
      R(g, '#000', 14, 0, 100, 1); R(g, '#000', 14, 256, 100, 1); // joints de dalle
    });
    veil(g, 0.08, () => { for (const x of [34, 52, 72, 90]) R(g, '#000', x, 0, 4, 512); }); // wheel paths, continuous: no dashes that scroll
    R(g, edge, 10, 0, 4, 512); R(g, edge, 114, 0, 4, 512);
    for (let y = 0; y < 512; y += 128) { R(g, dash, 62, y, 4, 64); for (const x of [0, 120]) { R(g, k1, x, y, 8, 64); R(g, k2, x, y + 64, 8, 64); } }
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = 'rgba(0,0,0,.5)'; // flaques, comme chaussee
    for (let i = wet ? 7 : 2; i > 0; i--) { const x = 16 + rnd() * 88, y = rnd() * 512, r = 6 + rnd() * 10; for (let k = 0; k < 9; k++) { const w = r * (0.5 + rnd()) | 0; g.fillRect(x + (rnd() - 0.5) * r * 2 | 0, y + (rnd() - 0.5) * r * 5 | 0, w, w * 2); } }
    if (wet === 2) g.fillRect(54, 0, 6, 512);
    g.globalCompositeOperation = 'source-over';
  }],
  // tunnel wall — x: 0 = top of the wall, y: along the track; p = [background, joint, fillet, foot]
  wallFace: (neonC, p, tiles) => [32, 32, (g, { R, rnd, veil }) => {
    R(g, p[0], 0, 0, 32, 32);
    veil(g, 0.16, () => {
      if (tiles) { for (let x = 13; x < 29; x += 3) R(g, '#000', x, 0, 1, 32); for (let y = 0; y < 32; y += 4) R(g, '#000', 13, y, 16, 1); } // tiling at the foot of the wall
      for (let i = 0; i < 9; i++) R(g, '#000', 12 + rnd() * 6 | 0, rnd() * 32 | 0, 12 + rnd() * 8 | 0, 1 + (rnd() * 2 | 0)); // coulures
    });
    R(g, p[1], 0, 0, 32, 2); R(g, neonC, 9, 0, 3, 32); R(g, p[2], 25, 0, 1, 32); R(g, p[3], 29, 0, 3, 32);
  }],
  ceiling: p => [32, 32, (g, { R, veil, speckle }) => { R(g, p[0], 0, 0, 32, 32); R(g, p[3], 0, 15, 32, 1); R(g, p[3], 14, 0, 4, 32); veil(g, 0.2, () => speckle(g, 40, '#000', 3, 32)); }], // joints, cable tray
  // guardrail — x: 0 = top; smooth, groove, posts every 4 m, drips
  guardrail: p => [32, 32, (g, { R, rnd, veil }) => {
    R(g, p[0], 0, 0, 32, 32); R(g, p[1], 0, 0, 3, 32); R(g, p[2], 6, 0, 1, 32); R(g, p[3], 13, 0, 19, 32); R(g, p[3], 3, 0, 10, 1);
    veil(g, 0.3, () => { R(g, '#fff', 3, 0, 1, 32); R(g, '#000', 9, 0, 2, 32); R(g, '#000', 12, 0, 1, 32); R(g, '#000', 3, 16, 10, 1); for (let i = 0; i < 10; i++) R(g, '#000', 4 + rnd() * 3 | 0, rnd() * 32 | 0, 3 + rnd() * 6 | 0, 1); });
  }],
  checker: backdrop => [16, 4, (c, { R }) => { R(c, backdrop, 0, 0, 16, 4); for (let x = 0; x < 16; x++) for (let y = 0; y < 4; y++) if ((x + y) & 1) R(c, '#08080c', x, y, 1, 1); }],
  chevron: flip => [32, 16, (g, { R }) => {
    if (flip) { g.translate(32, 0); g.scale(-1, 1); }
    R(g, '#fcee0a', 0, 0, 32, 16); g.fillStyle = '#08080c';
    for (const x of [3, 17]) { g.beginPath(); g.moveTo(x, 1); g.lineTo(x + 6, 1); g.lineTo(x + 12, 8); g.lineTo(x + 6, 15); g.lineTo(x, 15); g.lineTo(x + 6, 8); g.fill(); }
  }],
  gradient: (c, vert) => [vert ? 8 : 16, vert ? 64 : 2, (g, { R }) => { const gr = vert ? g.createLinearGradient(0, 0, 0, 64) : g.createLinearGradient(0, 0, 16, 0); gr.addColorStop(vert ? 1 : 0, c); gr.addColorStop(vert ? 0 : 1, '#000'); R(g, gr, 0, 0, 16, 64); }],
  screenAd: (c, txt) => [128, 16, (g, { R }) => { R(g, '#08080c', 0, 0, 128, 16); R(g, c, 0, 0, 128, 1); R(g, c, 0, 15, 128, 1); g.fillStyle = c; g.font = 'bold 11px sans-serif'; g.textBaseline = 'middle'; g.fillText(txt, 2, 8, 124); }],

  // ---------- ville ----------
  streets: () => [64, 64, (g, { R }) => { R(g, '#07060e', 0, 0, 64, 64); R(g, '#3a2408', 0, 0, 64, 2); R(g, '#3a2408', 0, 0, 2, 64); for (let i = 0; i < 64; i += 6) { R(g, '#ffb040', i, 0, 2, 1); R(g, '#40e0ff', 0, i + 3, 1, 2); } }], // grid of lit streets seen from above
  casements: () => [64, 64, (g, { R }) => { R(g, '#262633', 0, 0, 64, 64); for (let x = 0; x < 4; x++) for (let y = 0; y < 4; y++) R(g, '#0a0a14', x * 16 + 3, y * 16 + 4, 10, 9); }],
  casementsLit: (cols, p) => [64, 64, (g, { R, rnd }) => { R(g, '#000', 0, 0, 64, 64); for (let x = 0; x < 4; x++) for (let y = 0; y < 4; y++) if (rnd() < p) { R(g, cols[rnd() * cols.length | 0], x * 16 + 3, y * 16 + 4, 10, 9); R(g, '#000', x * 16 + 3 + 4, y * 16 + 4, 1, 9); } }], // emissive map
  signboard: (c, txt) => [64, 32, (g, { R }) => { R(g, '#08080c', 0, 0, 64, 32); g.strokeStyle = c; g.lineWidth = 2; g.strokeRect(2, 2, 60, 28); g.fillStyle = c; g.font = 'bold 18px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 32, 17, 54); }],
  // distant tower: silhouette pricked with n windows
  towerFar: (backdrop, cols, n) => [32, 64, (g, { R, rnd }) => { R(g, backdrop, 0, 0, 32, 64); for (let i = 0; i < n; i++) R(g, cols[i % cols.length], rnd() * 32 | 0, rnd() * 64 | 0, 1, 1); }],

  // ---------- scenery of the other maps ----------
  noise: (backdrop, grains) => [64, 64, (g, { R, rnd }) => { R(g, backdrop, 0, 0, 64, 64); for (const c of grains) for (let i = 0; i < 160; i++) R(g, c, rnd() * 64 | 0, rnd() * 64 | 0, 1 + (rnd() * 2 | 0), 1); }], // sol, eau
  written: (w, hh, backdrop, col, txt, px) => [w, hh, (g, { R }) => { R(g, backdrop, 0, 0, w, hh); g.fillStyle = col; g.font = 'bold ' + px + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, w / 2, hh / 2 + 1, w - 4); }], // text sign
  showcase: () => [64, 16, (c, { R }) => { R(c, '#eaf6ff', 0, 0, 64, 16); for (let y = 2; y < 12; y += 4) for (let x = 2; x < 62; x += 3) R(c, ['#ff5a4a', '#ffc04a', '#3a8aff', '#3ad06a', '#f4f0e0'][(x * 7 + y) % 5], x, y, 2, 3); R(c, '#8aa0b0', 0, 13, 64, 3); for (let x = 15; x < 64; x += 16) R(c, '#5a6a78', x, 0, 1, 16); }],
  dispenser: () => [16, 32, (c, { R }) => { R(c, '#e8f8ff', 0, 0, 16, 32); for (let y = 3; y < 20; y += 5) for (let x = 2; x < 14; x += 3) R(c, ['#ff2a3a', '#ff8c1a', '#2a7aff', '#1f8f5a'][(x + y) % 4], x, y, 2, 3); R(c, '#101418', 2, 24, 12, 5); }],
  pumpPetrol: () => [8, 16, (c, { R }) => { R(c, '#f4f0e0', 0, 0, 8, 16); R(c, '#c8102e', 0, 0, 8, 4); R(c, '#101418', 2, 6, 4, 3); }],
  striping: () => [16, 4, (c, { R }) => { for (let x = 0; x < 16; x += 4) R(c, x % 8 ? '#f4f0e0' : '#c8102e', x, 0, 4, 4); }],
  signRoad: t => [64, 24, (c, { R }) => { R(c, '#0e5a38', 0, 0, 64, 24); c.strokeStyle = '#f4f1e0'; c.strokeRect(1.5, 1.5, 61, 21); c.fillStyle = '#f4f1e0'; c.font = 'bold 11px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(t, 32, 13, 56); }],
  towerWindows: cols => [32, 64, (c, { R, rnd }) => { R(c, '#0c1220', 0, 0, 32, 64); for (let y = 2; y < 64; y += 4) for (let x = 2; x < 32; x += 4) if (rnd() < 0.42) R(c, cols[rnd() * cols.length | 0], x, y, 2, 2); }],
  sidewalk: () => [16, 16, (c, { R }) => { R(c, '#b8b0a2', 0, 0, 16, 16); R(c, '#a09888', 0, 0, 16, 1); R(c, '#a09888', 0, 0, 1, 16); }],
  // facade: ground floor with red awnings, five storeys of windows, continuous balconies at the 2nd and 5th, zinc roof; bas = low house of the knoll
  facadeParis: (p, low) => [64, 64, (c, { R, rnd }) => {
    R(c, p, 0, 0, 64, 64); R(c, '#5d6b82', 0, 0, 64, 9); for (let x = 5; x < 64; x += 16) R(c, '#3a4658', x, 3, 5, 5);
    for (let f = 0; f < (low ? 2 : 5); f++) for (let x = 4; x < 64; x += 8) R(c, rnd() < 0.12 ? '#ffd05a' : '#3a4048', x, 12 + f * (low ? 18 : 8), 4, low ? 12 : 6);
    if (!low) { R(c, '#2a2a30', 0, 19, 64, 1); R(c, '#2a2a30', 0, 43, 64, 1); }
    R(c, '#2a2622', 0, 53, 64, 11); for (let x = 2; x < 64; x += 16) R(c, x % 32 ? '#c8102e' : '#1d4a3a', x, 52, 12, 3);
  }],
  slabConcrete: () => [64, 64, (c, { R, rnd }) => { R(c, '#b0a592', 0, 0, 64, 64); for (let i = 0; i < 200; i++) R(c, i % 2 ? '#b8ad9a' : '#a69b88', rnd() * 64 | 0, rnd() * 64 | 0, 2, 1); R(c, '#8a8074', 0, 0, 64, 1); R(c, '#8a8074', 0, 0, 1, 64); }],
  // arrowed mural on the flood wall: chevrons painted in the direction of the bend
  mural: flip => [32, 16, (c, { R }) => {
    if (flip) { c.translate(32, 0); c.scale(-1, 1); }
    R(c, '#f4f0e0', 0, 0, 32, 16); R(c, '#2aa39a', 0, 0, 32, 2); R(c, '#2aa39a', 0, 14, 32, 2); c.fillStyle = '#e83f8c';
    for (const x of [3, 17]) { c.beginPath(); c.moveTo(x, 3); c.lineTo(x + 6, 3); c.lineTo(x + 12, 8); c.lineTo(x + 6, 13); c.lineTo(x, 13); c.lineTo(x + 6, 8); c.fill(); }
  }],

  // ---------- start gantry ----------
  // gantry lattice: 3 px frame and one cross per 1.5 m cell, transparent background (material in alphaTest); c = CSS colour
  latticeGantry: c => [32, 32, (g, o) => {
    const { R, veil } = o; g.clearRect(0, 0, 32, 32); R(g, c, 0, 0, 32, 3); R(g, c, 0, 29, 32, 3); R(g, c, 0, 0, 3, 32); R(g, c, 29, 0, 3, 32);
    for (let k = 0; k < 32; k++) { R(g, c, k, k, 2, 2); R(g, c, 30 - k, k, 2, 2); }
    veil(g, 0.3, () => { R(g, '#000', 3, 3, 26, 1); R(g, '#000', 3, 3, 1, 26); });
  }, 1.5],
  // start chequerboard: 2 × 2 px squares, t metres for two squares; background = light square
  checkerStripe: (backdrop, t) => [2, 2, (g, { R }) => { R(g, backdrop, 0, 0, 2, 2); R(g, '#08080c', 0, 0, 1, 1); R(g, '#08080c', 1, 1, 1, 1); }, t],
  // lit gantry band: letters in colour c on a dark background, scan lines, rules at the top and bottom
  bannerLabel: (c, txt, letters) => [512, 64, (g, { R, veil }) => {
    R(g, '#08080c', 0, 0, 512, 64); R(g, c, 0, 0, 512, 5); R(g, c, 0, 59, 512, 5);
    g.fillStyle = letters; g.font = 'bold 38px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 256, 34, 470);
    veil(g, 0.35, () => { for (let y = 5; y < 60; y += 3) R(g, '#000', 0, y, 512, 1); });
  }],
  // rushing water: glacier-lake turquoise, light ripples (to be tinted by the option c)
  waterVivid: () => [64, 64, (g, o) => {
    const { R, rand } = o; R(g, '#1f8f9a', 0, 0, 64, 64);
    for (let i = 0; i < 120; i++) R(g, rand() < 0.5 ? '#2aa7ae' : '#177a88', rand() * 64 | 0, rand() * 64 | 0, 3 + (rand() * 6 | 0), 1);
    for (let i = 0; i < 26; i++) R(g, '#bfeee8', rand() * 64 | 0, rand() * 64 | 0, 2 + (rand() * 4 | 0), 1);
  }, 12],
  // peaks: grey rock striated at the bottom, snow above a jagged limit (the top of the texture is the top of the peak)
  rockSnow: () => [64, 64, (g, o) => {
    const { R, rand } = o; R(g, '#6f7480', 0, 0, 64, 64);
    for (let i = 0; i < 200; i++) R(g, rand() < 0.5 ? '#5c606c' : '#868b96', rand() * 64 | 0, rand() * 64 | 0, 1, 2 + (rand() * 6 | 0));
    for (let x = 0; x < 64; x += 2) { const h = 22 + (rand() * 14 | 0); R(g, '#f4f6fa', x, 0, 2, h); if (rand() < 0.4) R(g, '#c8d4e8', x, h - 4, 2, 3); }
  }],
  // jump banner: red chevrons on a yellow background, pointing up
  bannerJump: () => [64, 16, (g, o) => {
    const { R } = o; R(g, '#f4c020', 0, 0, 64, 16);
    for (let x = 0; x < 64; x += 16) for (let k = 0; k < 6; k++) { R(g, '#e8482a', x + 2 + k, 11 - k * 2, 2, 3); R(g, '#e8482a', x + 12 - k, 11 - k * 2, 2, 3); }
  }],
};
})();
