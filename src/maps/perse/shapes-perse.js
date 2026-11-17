// Shapes specific to "perse" (Royal Road): completes the shapes.js catalogue (same conventions: simple shape = geometry, assembly = list of boxes with zones). See docs/methods/SCENERY.md.
// Pieces along the track (arcade, stall): origin on the ground at the middle of the façade, X along the track, Z moving away from it.
// Pieces set on the road (gate): the road's frame (scenery.js's marker), X across, Z towards the back (where the car comes from).
(function () {
  const B = (w, h, d, H = h) => { const g = new THREE.BoxGeometry(w, h, d); g.userData.dim = [w, H, d]; return g; };
  const R45 = [0, Math.PI / 4, 0];
  // REFS §4: Persepolitan column (bell base on a plinth, fluted shaft, palm crown, vertical volutes, double bull protome carrying the beam); H = height under the beam
  const column = (x, z, H) => [['stone', 2.4, 0.5, 2.4, x, 0.25, z], ['stone', 2, 1.1, 2, x, 1, z], ['stone', 2, 1.1, 2, x, 1, z, R45], ['stone', 1.6, 0.4, 1.6, x, 1.75, z],
    ['shaft', 1.2, H - 5.2, 1.2, x, 1.95 + (H - 5.2) / 2, z], ['shaft', 1.2, H - 5.2, 1.2, x, 1.95 + (H - 5.2) / 2, z, R45],
    ['sculpts', 1.9, 1, 1.9, x, H - 2.8, z, R45], ['sculpts', 1.3, 1.3, 1.3, x, H - 1.7, z], ['sculpts', 4.6, 1.2, 1.5, x, H - 0.4, z], ['sculpts', 1.1, 1.2, 1.4, x - 2.6, H - 0.1, z], ['sculpts', 1.1, 1.2, 1.4, x + 2.6, H - 0.1, z], ['gold', 4.8, 0.25, 1.6, x, H + 0.3, z]];
  Object.assign(SHAPES, {
    // REFS §4: Persepolitan column of H m: plinth, bell base (two crossed boxes), octagonal fluted shaft, capital, two back-to-back bull protomes (X), ceiling beam set on top
    columnPerse: (H = 19) => [['stone', 2.6, 0.5, 2.6, 0, 0.25, 0], ['stone', 2, 1.1, 2, 0, 1.05, 0], ['stone', 2, 1.1, 2, 0, 1.05, 0, R45],
      ['shaft', 1.2, H - 6, 1.2, 0, 1.8 + (H - 6) / 2, 0, null, 1], ['shaft', 1.2, H - 6, 1.2, 0, 1.8 + (H - 6) / 2, 0, R45], ['sculpts', 2.4, 1, 2.4, 0, H - 4.4, 0, R45], // couronne de palmes (REFS §4)
     
      ['stone', 2.2, 1.4, 2.2, 0, H - 3.5, 0], ['stone', 1.6, 1.2, 1.6, 0, H - 2.3, 0, R45],
      ['sculpts', 6.2, 2, 2.2, 0, H - 1, 0, null, 1], ...[-1, 1].flatMap(sd => [['sculpts', 1.8, 1.9, 2, sd * 4.4, H - 0.4, 0], ['sculpts', 1.1, 1.1, 1.3, sd * 5.4, H - 0.7, 0], ['gold', 0.3, 0.3, 1.9, sd * 4.9, H + 0.75, 0], ['gold', 0.35, 1.1, 0.35, sd * 4.6, H + 1, 0.9], ['gold', 0.35, 1.1, 0.35, sd * 4.6, H + 1, -0.9], ['sculpts', 0.9, 2.2, 1, sd * 3, H - 3, 0.5], ['sculpts', 0.9, 2.2, 1, sd * 3, H - 3, -0.5]])],
    // REFS §6: the restored Gate of All Nations (zones lamTG/lamTD/lamHG/lamHD: relief of the bull and of the lamassu, head left or right of the texture), straddling the road (road frame: Z towards the car arriving): square hall of ochre mud-brick with a flat roof and a cavetto cornice,
    // stone-framed doors, bulls on the arrival side (west), human-headed lamassus on the exit side (east), four 16.5 m columns inside; no arch, no crenel, no tower
    doorNations: (W = 10) => { const L = 2 * W + 20; return [...[-1, 1].flatMap(sd => [['raw', 3, 18, 27, sd * (W + 8.5), 9, 0, null, 1], ['stone', 3.2, 1.2, 27.4, sd * (W + 8.5), 0.6, 0],
        // the jambs, 8 m deep; on their face towards the road, the bull in high relief (bull to the west, at arrival; human-headed lamassu to the east, at exit: REFS §6-7);
        // its forepart (chest, legs, head, tiara or horns) projects from the jamb outwards, as on the site
        ...[-1, 1].flatMap(fz => { const z1 = fz * 17.9, X = sd * (W + 1.5), hum = fz < 0; return [['stone', 3.4, 14, 8, sd * (W + 1.7), 7, fz * 13.9, null, 1], ['raw', 4.6, 18, 3, sd * (W + 5.9), 9, fz * 11.7],
          [(sd < 0) === (fz > 0) ? (hum ? 'lamHG' : 'lamTG') : (hum ? 'lamHD' : 'lamTD'), 0.16, 10.5, 7.6, sd * (W - 0.05), 6.6, fz * 13.9],
          ['sculpts', 2.8, 4, 2.4, X, 6.6, z1 + fz * 1.2], ...[-0.7, 0.7].map(dx => ['sculpts', 0.9, 4.6, 1, X + dx, 2.3, z1 + fz * 1.6]), ['faceMat', 2, 2.4, 2, X, 9.6, z1 + fz * 1.6], ...[sd].map(e => ['wing', 0.35, 5.5, 4.5, X + e * 1.5, 9.5, z1 - fz * 0.6, [fz * 0.35, e * fz * 0.3, 0]]), // light head, one outspread wing rising from the jamb, on the side opposite the road (the other one blocked the opening: a big flat patch in front of the camera)
          ...(hum ? [['sculpts', 1.6, 1.8, 0.6, X, 7.6, z1 + fz * 2.6], ['tiara', 2.1, 1.9, 2, X, 11.75, z1 + fz * 1.6], ['gold', 2.2, 0.3, 2.1, X, 11.2, z1 + fz * 1.6], ['gold', 2.3, 0.25, 2.2, X, 12.8, z1 + fz * 1.6]] : [['gold', 3.4, 0.35, 0.4, X, 10.9, z1 + fz * 1.6], ['gold', 0.35, 1.2, 0.35, X - 1.6, 11.6, z1 + fz * 1.6], ['gold', 0.35, 1.2, 0.35, X + 1.6, 11.6, z1 + fz * 1.6]])]; }),
        ...[-5, 5].flatMap(z => column(sd * (W + 4.6), z, 16.5))]),
      ...[-1, 1].flatMap(fz => [['raw', L, 3.4, 3, 0, 16.3, fz * 11.7], ['stone', 2 * W + 7.2, 1.3, 3.8, 0, 14.6, fz * 11.7], ['relief', 2 * W + 7, 1, 0.2, 0, 15.6, fz * 13.65]]),
      ['raw', L, 1, 27, 0, 18.5, 0, null, 1], ['cedar', L - 6, 0.2, 21, 0, 17.9, 0], ['stone', L + 1.2, 0.7, 28.2, 0, 19.35, 0], ['sculpts', L + 2.6, 0.6, 29.6, 0, 20, 0], ['stone', L + 3.4, 0.5, 30.4, 0, 20.55, 0], ['gold', L + 3.5, 0.15, 30.5, 0, 20.85, 0]]; },
    // REFS §1-3: band of rosettes and smooth cornice topping the stairs' parapet (in place of the merlons, forbidden); 2 m along the road
    crown: () => [['stone', 2, 0.35, 0.9, 0, 0.18, 0], ['stone', 2, 0.3, 1.2, 0, 0.5, 0], ['gold', 2, 0.1, 1.25, 0, 0.7, 0]],
    // REFS §8: door frame of the Tachara, standing in the ruins: black stone jambs and lintel, cavetto cornice; X across the door
    portal: () => [...[-2.2, 2.2].map(x => ['blackM', 1.5, 8, 1.8, x, 4, 0, null, 1]), ['blackM', 6, 1.3, 1.9, 0, 8.65, 0], ['blackM', 6.6, 0.5, 2.2, 0, 9.55, 0], ['blackM', 7, 0.4, 2.4, 0, 10, 0], ['stone', 7, 0.6, 3, 0, 0.3, 0]],
    // REFS §4-5: ruined column, standing without beam (the Apadana seen from the plain); H = height
    columnRuin: (H = 19) => column(0, 0, H).slice(0, -1),
    // REFS §11: garden pavilion (Chehel Sotoun): platform, talar with slender wooden columns, very overhanging flat roof with painted ceiling, back hall with a tile iwan; façade towards -Z (the road), Z moving away
    kushk: () => [['stone', 32, 1.2, 26, 0, 0.6, 13, null, 1],
      ...[-12.5, -7.5, -2.5, 2.5, 7.5, 12.5].flatMap(x => [2, 7].map(z => ['wood', 0.6, 11, 0.6, x, 6.7, z])), ...[-12.5, 12.5].map(x => ['wood', 0.6, 11, 0.6, x, 6.7, 11.5]),
      ['wood', 33, 0.8, 15, 0, 12.6, 6.5, null, 1], ['gold', 33.4, 0.3, 15.4, 0, 13.1, 6.5], ['ceiling', 32, 0.1, 14, 0, 12.15, 6.5],
      ['raw', 30, 14.5, 11, 0, 7.45, 19.5, null, 1], ['raw', 30.6, 0.6, 11.6, 0, 14.9, 19.5], ['ceramic', 11, 10, 0.3, 0, 6.2, 13.95], ['dark', 6, 7.5, 0.3, 0, 4.95, 13.8], ['gold', 11.4, 0.4, 0.4, 0, 11.3, 13.9]],
    // REFS §15: flat-roofed mud-brick house (village, bazaar quarter): body, roof edge, door, two windows; façade towards -Z
    house: () => [['raw', 8, 6, 8, 0, 3, 4, null, 1], ['raw', 8.3, 0.4, 8.3, 0, 6.2, 4], ['dark', 1.4, 2.4, 0.2, -1.5, 1.2, -0.05], ['dark', 0.9, 1.2, 0.2, 1.8, 3.8, -0.05], ['dark', 0.9, 1.2, 0.2, -1.5, 4.2, -0.05]],
    // REFS §15: wind tower (badgir) set on a roof: square shaft, slits, flat roof
    badgir: () => [['raw', 2.4, 5, 2.4, 0, 2.5, 0, null, 1], ...[0, Math.PI / 2].map(a => ['dark', 2.5, 2.4, 0.5, 0, 3.4, 0, [0, a, 0]]), ['raw', 2.8, 0.4, 2.8, 0, 5.2, 0]],
    // REFS §12: caravanserai on the royal road: square enclosure of 56 m, square corner buttresses (no round towers), iwan gateway on the -Z face
    caravanserail: () => [...[-1, 1].flatMap(s => [['raw', 56, 9, 2, 0, 4.5, s * 27, null, 1], ['raw', 2, 9, 56, s * 27, 4.5, 0, null, 1]]),
      ...[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([a, b]) => ['raw', 5, 10, 5, a * 27, 5, b * 27, R45]),
      ['raw', 18, 14, 5, 0, 7, -27, null, 1], ['dark', 8, 10, 0.4, 0, 5, -29.6], ['ceramic', 10, 1.2, 0.3, 0, 11.8, -29.6], ['ceramic', 18.2, 0.8, 5.2, 0, 14, -27]],
    // REFS §16: figure in a long robe (peasant, merchant), flat miniature silhouette; the robe takes the instance's tint
    character: () => [['coat', 0.6, 1.25, 0.42, 0, 0.63, 0], ['coat', 0.75, 0.25, 0.5, 0, 0.12, 0], ['skin', 0.3, 0.32, 0.3, 0, 1.42, 0], ['headgear', 0.36, 0.18, 0.36, 0, 1.64, 0]],
    // REFS §16 and §2: Achaemenid standard along the royal road: pole, cloth (instance's tint), golden eagle at the top; X across the road
    hangingBanner: () => [['mat', 0.16, 7, 0.16, 0, 3.5, 0], ['fabric', 0.06, 2.6, 1.5, 0, 5.4, 0.8], ['gold', 0.5, 0.5, 0.25, 0, 7.2, 0], ['gold', 1.1, 0.12, 0.2, 0, 7.15, 0]],
    // REFS §9: Achaemenid fire altar (Naqsh-e Rostam): stepped plinth, square shaft, stepped bowl; the flame is set separately
    altar: () => [['stone', 1.4, 0.4, 1.4, 0, 0.2, 0], ['stone', 0.8, 1.3, 0.8, 0, 1.05, 0], ['stone', 1.2, 0.3, 1.2, 0, 1.85, 0], ['stone', 1.5, 0.3, 1.5, 0, 2.15, 0], ['gold', 1.55, 0.08, 1.55, 0, 2.34, 0]],
    // REFS §15: nomad black tent: goat-hair panels stretched in two sections, low edge
    tentNomad: () => [['tent', 9, 1.4, 5, 0, 0.7, 0], ['tent', 9.4, 0.12, 3.2, 0, 1.9, -1.1, [0.45, 0, 0]], ['tent', 9.4, 0.12, 3.2, 0, 1.9, 1.1, [-0.45, 0, 0]]],
    // REFS §12: broken transverse arch of the covered bazaar (road frame): two piers and the arch in six segments, from the springing at 3.8 m up to the keystone at 6.2 m; between two arches the dome rises to 7.9 m
    arcBazaar: (W = 10) => { const n = 6, R0 = W - 0.45, pt = k => { const t = k / n, x = R0 * (1 - t); return [x, 3.8 + 2.4 * Math.pow(t, 0.62)]; }, segs = [];
      for (let k = 0; k < n; k++) { const [x0, y0] = pt(k), [x1, y1] = pt(k + 1), l = Math.hypot(x1 - x0, y1 - y0), a = Math.atan2(y1 - y0, x1 - x0); for (const sd of [-1, 1]) segs.push(['brick', l + 0.3, 0.7, 1.1, sd * (x0 + x1) / 2, (y0 + y1) / 2, 0, [0, 0, sd > 0 ? a : -a]]); }
      return [...[-1, 1].flatMap(sd => [['brick', 0.9, 3.8, 1.2, sd * R0, 1.9, 0], ['ceramic', 1, 0.4, 1.3, sd * R0, 3.7, 0]]), ...segs]; },
    // REFS §13: portal (pishtaq) at the entrance of the covered bazaar, straddling the road: tile frame higher than the roofs, inscription band, broken niche with muqarnas above the vault
    pishtaq: (W = 10) => { const b = [...[-1, 1].flatMap(sd => [['brick', 4, 25, 3.4, sd * (W + 2), 12.5, 0, null, 1], ['ceramic', 0.6, 23, 3.6, sd * (W - 0.1), 12.5, 0]]),
        ['brick', 2 * W + 8, 7.6, 3.4, 0, 21.2, 0, null, 1], ['inscr', 2 * W + 8.2, 1.6, 3.6, 0, 17.6, 0], ['inscr', 2 * W + 8.2, 1.6, 3.6, 0, 23.2, 0], ['ceramic', 2 * W + 8.4, 0.5, 3.8, 0, 25.2, 0], ['muq', 2 * W, 9, 0.4, 0, 12.4, -2.6]];
      for (let k = 0; k < 12; k++) { const y = 8 + k * 0.7, hw = W * Math.pow(1 - (k + 0.5) / 12, 0.7); for (const sd of [-1, 1]) b.push(['muq', W - hw + 0.1, 0.72, 3.2, sd * (hw + (W - hw) / 2), y + 0.35, 0]); }
      return b; },
    // REFS §12: open-air bazaar arcade module, 12 m: painted brick wall with two arches, cornice, low dome behind (onion dome in two boxes)
    // V2: flat roof with an edge, no more stepped dome (read as a merlon, REFS §12): the quarter's domes are separate caps
    arcade: () => [['brick', 12, 5.5, 1.2, 0, 2.75, 0.6, null, 1], ['ceramic', 12.2, 0.6, 1.4, 0, 5.8, 0.6], ['raw', 12, 7, 9, 0, 3.5, 5.6], ['raw', 12.3, 0.4, 9.3, 0, 7.2, 5.6], ...[-3, 3].flatMap(x => [['wood', 3, 1.3, 0.9, x, 6.4, 0.75], ['wood', 3.2, 0.15, 1.1, x, 7.1, 0.75]])], // wooden balconies with lattice screens on the upper floor
    // village street block, 30 m, X along the road, Z towards the back, façades flush with the roadway: three mud houses side by side, each different
    // (9 m house with wooden balcony; 12 m shop house with awning and a room on the roof; 5.5 m low house with a large gate). Doors with turquoise frames, windows lit or shutters closed, earth bench at the foot
    islet: () => [
      ['raw', 10, 9, 8, -10, 4.5, 4, null, 1], ['roofM', 10.4, 0.5, 8.4, -10, 9.25, 4], ['rackFrame', 2.3, 3.1, 0.2, -12.4, 1.55, -0.02], ['door', 1.6, 2.6, 0.3, -12.4, 1.3, -0.06], ['casement', 1, 1.5, 0.25, -7.8, 6.3, -0.05], ['shutter', 1, 1.5, 0.25, -12.4, 6.3, -0.05], ['casement', 0.9, 1.2, 0.25, -7.4, 2.4, -0.05],
      ['wood', 3.4, 0.2, 1.3, -7.8, 5, -0.6], ['wood', 3.4, 0.9, 0.12, -7.8, 5.5, -1.2], ['raw', 3, 0.5, 0.7, -9.5, 0.25, -0.35],
      ['rug', 2.2, 1.6, 0.1, -7.8, 5.2, -1.3], ['rug', 1.6, 2.2, 0.1, 3, 5.4, -0.14], // the red fabric with a gold edge, always up high: a carpet on the balcony, another under a window
      ...[[-10, 8.3], [0, 11.3], [10, 4.9]].flatMap(([x0, y]) => [-4, -2.4, -0.8, 0.8, 2.4, 4].map(e => ['wood', 0.25, 0.25, 0.7, x0 + e, y, -0.3])), // the ends of the roof beams, projecting
      ['raw', 10, 12, 8, 0, 6, 4, null, 1], ['roofM', 10.4, 0.5, 8.4, 0, 12.25, 4], ['shop', 7, 3.6, 0.3, -0.8, 1.8, -0.1], ['ceramic', 10.1, 0.5, 0.25, 0, 4.3, -0.05], ['awning', 7.4, 0.12, 2.8, -0.8, 3.7, -1.4, [0.28, 0, 0]],
      ...[[-3, 6.8, 1], [0, 6.8, 1], [3, 6.8, 0], [-3, 9.8, 0], [0, 9.8, 1], [3, 9.8, 1]].map(([x, y, a]) => [a ? 'casement' : 'shutter', 1, 1.5, 0.25, x, y, -0.05]), ['door', 1.2, 2.4, 0.3, 3.8, 1.2, -0.06], ['raw', 3.4, 3, 3.4, -2, 13.9, 5], ['roofM', 3.8, 0.3, 3.8, -2, 15.5, 5],
      ['raw', 10, 5.5, 8, 10, 2.75, 4, null, 1], ['roofM', 10.4, 0.4, 8.4, 10, 5.7, 4], ['rackFrame', 3, 3.8, 0.2, 10, 1.9, -0.02], ['door', 2.2, 3.2, 0.3, 10, 1.6, -0.06], ['casement', 0.8, 1, 0.25, 6.8, 3.6, -0.05], ['shutter', 0.8, 1, 0.25, 13.2, 3.6, -0.05], ['raw', 4.6, 1.4, 4.6, 11.5, 6.4, 4.5], ['roofM', 5, 0.3, 5, 11.5, 7.2, 4.5]],
    // side lane seen in perspective from the street (kucheh): 4 m wide, 18 m deep between two earth walls, five thin arches with flat tops bracing them (the real sabat), a turquoise door and a lit window at the back, a threshold
    alley: () => [...[-1, 1].map(sd => ['raw', 0.6, 9, 18.6, sd * 2.3, 4.5, 9.3, null, 1]), ['ground', 4, 0.1, 18, 0, 0.05, 9], ['raw', 5.2, 9, 0.6, 0, 4.5, 18.6], ['rackFrame', 1.9, 2.7, 0.2, 0, 1.35, 18.25], ['door', 1.3, 2.3, 0.3, 0, 1.15, 18.2], ['casement', 1, 1.2, 0.2, 0.9, 5.6, 18.25], ['raw', 4, 0.4, 0.5, 0, 0.2, 0.25],
      ...[2, 5.5, 9, 12.5, 16].flatMap(z => [['arc', 4, 0.7, 0.45, 0, 5.6, z], ...[-1, 1].map(sd => ['arc', 0.8, 0.7, 0.45, sd * 1.6, 4.95, z])])],
    // covered passage across the lane (sabat): a living room spanning the street, from one house to the other, on two piers and two corbels; lit windows on both faces. W = half-width of the street
    sabat: (W = 10) => [...[-1, 1].flatMap(sd => [['raw', 2.4, 6.4, 7, sd * (W + 0.6), 3.2, 0, null, 1], ['raw', 2.6, 1.4, 6.9, sd * (W - 1.6), 5.9, 0], ['raw', 2.6, 0.75, 6.8, sd * (W - 3.8), 6.3, 0]]), // corbels less deep than the piers and the room: no face lies in the same plane as another (they shimmered)
      ['raw', 2 * W + 3.6, 4.4, 7, 0, 9, 0, null, 1], ['roofM', 2 * W + 4, 0.5, 7.4, 0, 11.45, 0], ['ceramic', 2 * W + 3.7, 0.5, 7.1, 0, 6.95, 0], ['wood', 2 * W + 3.5, 0.12, 6.9, 0, 6.66, 0], // underside: a wooden floor, 4 cm below the tile band (the two undersides were in the same plane)
      ...[-2.4, -0.8, 0.8, 2.4].map(z => ['wood', 2 * W - 6, 0.3, 0.35, 0, 6.45, z]), // ses solives
      ...[-1, 1].flatMap(fz => [-0.55, -0.18, 0.18, 0.55].map((u, k) => [k % 3 ? 'casement' : 'shutter', 1.2, 1.7, 0.25, u * W, 9.2, fz * 3.52]))],
    // open bazaar street module, 12 m, X along the road, Z towards the back: shops in niches at ground level, tile band, one storey of mud-brick, flat roof with an edge. Always one storey and a roof (9.6 m)
    arcadeBazaar: () => [['rug', 2, 2.6, 0.1, -3, 7.2, -0.08], ['shops', 12, 5, 9, 0, 2.5, 4.5, null, 1], ['ceramic', 12.1, 0.5, 9.1, 0, 5.25, 4.5], ['storey', 12, 3.6, 9, 0, 7.3, 4.5], ['roofM', 12.4, 0.5, 9.4, 0, 9.35, 4.5]],
    // REFS §12, §16: awning stall (X along the road): counter, two uprights, striped canvas leaning towards the road, goods
    stallPerse: () => [['wood', 3.4, 1, 1.4, 0, 0.5, 1.2], ...[-1.6, 1.6].map(x => ['wood', 0.15, 2.8, 0.15, x, 1.4, 0.3]), ['awning', 3.8, 0.08, 2.4, 0, 2.6, 0.8, [-0.35, 0, 0]],
      ['goods', 3, 0.5, 1, 0, 1.25, 1.2]],
    // REFS §16: pack camel, X forward: legs, body, hump, neck and head; red saddle
    camel: () => [...[[-0.75, -0.3], [-0.75, 0.3], [0.75, -0.3], [0.75, 0.3]].map(([x, z]) => ['fur', 0.22, 1.6, 0.22, x, 0.8, z]), ['fur', 2.1, 0.8, 0.8, 0, 1.95, 0], // pattes hautes, corps
      ['fur', 1.1, 0.5, 0.7, -0.1, 2.55, 0], ['fur', 0.6, 0.35, 0.5, -0.1, 2.9, 0], ['drumset', 1.5, 0.25, 1.1, -0.1, 2.4, 0], ['drumset', 0.5, 0.6, 1.3, -0.7, 2.2, 0], // rounded hump, red saddle cloth, bales
      ['fur', 0.35, 1.2, 0.4, 1.25, 2.4, 0, [0, 0, -0.75]], ['fur', 0.3, 0.7, 0.35, 1.75, 3.05, 0, [0, 0, 0.2]], ['fur', 0.75, 0.35, 0.35, 2.05, 3.35, 0], ['fur', 0.3, 0.25, 0.25, -1.15, 1.9, 0, [0, 0, 0.6]]], // S-shaped neck, elongated head, tail
    // REFS §16: packed donkey, X forward
    donkey: () => [...[[-0.4, -0.2], [-0.4, 0.2], [0.4, -0.2], [0.4, 0.2]].map(([x, z]) => ['fur', 0.14, 0.7, 0.14, x, 0.35, z]), ['fur', 1.1, 0.5, 0.5, 0, 0.95, 0],
      ['fur', 0.25, 0.5, 0.25, 0.6, 1.25, 0, [0, 0, -0.6]], ['fur', 0.45, 0.25, 0.25, 0.8, 1.5, 0], ['drumset', 0.6, 0.45, 0.8, -0.05, 1.3, 0]],
    // REFS §10, §15: cypress: narrow six-sided flame (flat miniature silhouette)
    cypress: () => { const g = new THREE.ConeGeometry(1.3, 12, 6, 1); g.translate(0, 6.6, 0); return g; },
    // REFS §10: round garden basin: rim (low ring), the water is a disc set apart
    wellCurb: () => { const g = new THREE.CylinderGeometry(1, 1, 1, 24, 1, true); g.translate(0, 0.5, 0); return g; },
    disc: () => { const g = new THREE.CircleGeometry(1, 16); g.rotateX(-Math.PI / 2); return g; },
    // REFS §10 : massif de fleurs : bourrelet bas
    massif: () => B(1, 0.6, 1),
    // REFS §12: bazaar lantern
    lantern: () => B(0.5, 0.8, 0.5),
    // REFS §13: background: dome on a drum, minaret with a flat crown (no pointed roof)
    cupola: () => new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), // cap, no onion dome (REFS §12-13)
    drum: () => { const g = new THREE.CylinderGeometry(1, 1, 1, 16); g.translate(0, 0.5, 0); return g; },
    minaret: () => { const g = new THREE.CylinderGeometry(0.8, 1, 1, 10); g.translate(0, 0.5, 0); return g; },
    // flat panel in the distance (cloud scrolls, crowd): vertical plane facing +Z
    signPanel: () => new THREE.PlaneGeometry(1, 1),
    // REFS §12, §10, §15: dome cap (bazaar roofs), round crown (orange trees), qanat cone, fountain jet, cone (spices, Zagros)
    domeCap: () => new THREE.SphereGeometry(1, 12, 5, 0, Math.PI * 2, 0, Math.PI / 2),
    canopyRound: () => new THREE.IcosahedronGeometry(1, 0), // 20 faces: the orchards count a thousand
    qanat: () => { const g = new THREE.CylinderGeometry(0.8, 2.6, 1.2, 8); g.translate(0, 0.6, 0); return g; },
    jet: () => { const g = new THREE.CylinderGeometry(0.06, 0.25, 1, 6); g.translate(0, 0.5, 0); return g; },
    rai: () => { const g = new THREE.CylinderGeometry(1, 2.4, 1, 10, 1, true); g.translate(0, -0.5, 0); return g; }, // bazaar light well: open cone under the oculus, point upwards
    cone: () => { const g = new THREE.ConeGeometry(1, 1, 8); g.translate(0, 0.5, 0); return g; },
  });
})();
