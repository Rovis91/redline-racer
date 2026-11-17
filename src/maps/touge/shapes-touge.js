// Shapes specific to "touge" (Karasu-tōge): completes the shapes.js catalogue (simple shape = geometry, assembly = list of boxes with zones). See docs/methods/SCENERY.md.
// Unless stated otherwise, X = going away from the road, Z = along the road, origin at the foot of the item.
(function () {
  const pair = f => [-1, 1].map(f);
  Object.assign(SHAPES, {
    // stone bridge over the torrent, in the road frame (X across): parapets above the guardrails, fascia under the carriageway, abutments in the banks
    bridgeStone: W => [...pair(sd => ['stone', 0.7, 1.9, 15, sd * (W + 0.9), 0.65, 0]), ...pair(sd => ['stone', 0.9, 0.2, 15.4, sd * (W + 0.9), 1.7, 0]),
      ...pair(sd => ['stone', 0.6, 2.6, 15, sd * (W + 0.3), -1.4, 0]), ['stone', 2 * W + 1, 0.8, 15, 0, -1.0, 0], ...pair(sd => ['stone', 2 * W + 3, 9, 3, 0, -5, sd * 9])],
    // Japanese slope sign: yellow diamond (drawn on a square plate in alphaTest, the text stays upright), white plate beneath (face toward Z, the approaching car)
    signSlope: () => [['pole', 0.09, 2.9, 0.09, 0, 1.45, 0], ['plate', 1.2, 1.2, 0.05, 0, 2.6, 0.06], ['under', 1.0, 0.42, 0.05, 0, 1.8, 0.06]],
    // panneau touristique brun, deux poteaux (face vers Z)
    signView: () => [...pair(sd => ['pole', 0.1, 2.6, 0.1, sd * 1.1, 1.3, 0]), ['plate', 2.6, 1.0, 0.06, 0, 2.2, 0.06]],
    // mountain shrine: vermilion torii at the edge, stone steps climbing the slope, tōrō on either side, small oratory at the top
    shrine: () => [...pair(sd => ['vermilion', 0.42, 4.6, 0.42, 0, 2.3, sd * 1.9]), ...pair(sd => ['blackM', 0.6, 2.4, 0.6, 0, -0.8, sd * 1.9]),
      ['vermilion', 0.3, 0.3, 5.2, 0, 3.5, 0], ['vermilion', 0.25, 0.6, 0.3, 0, 4.05, 0], ['vermilion', 0.5, 0.32, 5.8, 0, 4.5, 0], ['blackM', 0.62, 0.32, 6.2, 0, 4.82, 0],
      ...pair(sd => ['blackM', 0.62, 0.3, 0.9, 0, 4.92, sd * 3.2, [sd * 0.3, 0, 0]]),
      ...Array.from({ length: 14 }, (_, k) => ['stairStep', 0.46, 2 + k * 0.22, 2.6, 1.6 + k * 0.45, (2 + k * 0.22) / 2 - 2 + 0.22, 0]),
      ...[2.5, 6.5].flatMap(x => pair(sd => [['stairStep', 0.6, 0.3, 0.6, x, 0.15 + (x - 1.6) * 0.49, sd * 2], ['stairStep', 0.22, 0.8, 0.22, x, 0.7 + (x - 1.6) * 0.49, sd * 2],
        ['stairStep', 0.5, 0.15, 0.5, x, 1.17 + (x - 1.6) * 0.49, sd * 2], ['fire', 0.36, 0.34, 0.36, x, 1.42 + (x - 1.6) * 0.49, sd * 2], ['stairStep', 0.72, 0.18, 0.72, x, 1.68 + (x - 1.6) * 0.49, sd * 2]]).flat()),
      ['stairStep', 5, 0.4, 5, 9.6, 3.1, 0], ['wood', 3.2, 2.2, 3.6, 10, 4.4, 0], ['fire', 0.06, 1.2, 1.6, 8.38, 4.2, 0], ...pair(sd => ['roofM', 4.4, 0.25, 2.6, 10, 5.85, sd * 1.15, [sd * 0.5, 0, 0]])],
    // sika deer (X = forward): body, slim legs, neck, head, ears, small antlers, white rump patch; the eyes reflect the headlights
    deer: () => [['fur', 1.25, 0.55, 0.45, 0, 1.0, 0, null, 1], ...pair(a => pair(c => ['fur', 0.09, 0.78, 0.09, a * 0.48, 0.39, c * 0.15])).flat(),
      ['fur', 0.26, 0.6, 0.24, 0.62, 1.35, 0, [0, 0, -0.55]], ['fur', 0.46, 0.22, 0.22, 0.86, 1.63, 0], ['rump', 0.08, 0.38, 0.36, -0.64, 1.02, 0],
      ...pair(sd => ['fur', 0.06, 0.2, 0.08, 0.72, 1.82, sd * 0.13, [sd * 0.5, 0, 0]]), ...pair(sd => ['wood', 0.05, 0.42, 0.05, 0.74, 1.95, sd * 0.07, [sd * 0.25, 0, 0.2]]),
      ...pair(sd => ['eyes', 0.07, 0.08, 0.06, 0.98, 1.68, sd * 0.09])],
    // tall convenience store sign, on a mast: panel facing Z (the approaching car)
    signboardHigh: () => [['steelMat', 0.6, 8, 0.6, 0, 4, 0], ['signboard', 5.4, 3.4, 0.5, 0, 9.4, 0]],
    // isolated drinks vending machine, facing -X (the road): white cabinet, lit front, awning, can tray, concrete base
    distribIsolated: () => [['plinth', 1.6, 2, 2.6, 0, -0.9, 0], ['carBody', 0.85, 1.85, 1.05, 0, 1.0, 0], ['face', 0.04, 1.45, 0.88, -0.45, 1.1, 0], ['carBody', 1.0, 0.08, 1.2, -0.05, 1.96, 0],
      ['binOf', 0.42, 0.75, 0.42, -0.1, 0.48, 0.85]],
    // silhouette debout ; h = taille
    passerby: (h = 1) => [['shadows', 0.26, 0.82 * h, 0.34, 0, 0.41 * h, 0], ['shadows', 0.3, 0.62 * h, 0.46, 0, 1.13 * h, 0], ['shadows', 0.22, 0.24 * h, 0.2, 0, 1.58 * h, 0]],
    // high-voltage pylon (crossarms along X) and its obstacle light at the top
    pylonHT: () => [...pair(a => pair(b => ['steelMat', 0.45, 40, 0.45, a * 2.2, 19, b * 2.2, [b * 0.06, 0, -a * 0.06]])).flat(),
      ...[10, 20, 30].flatMap(y => [['steelMat', 5.2 - y * 0.08, 0.25, 0.25, 0, y, 2.2 - y * 0.04], ['steelMat', 5.2 - y * 0.08, 0.25, 0.25, 0, y, -2.2 + y * 0.04]]),
      ...[27, 32, 37].map(y => ['steelMat', y === 37 ? 9 : 13, 0.5, 0.6, 0, y, 0]), ['steelMat', 0.4, 3, 0.4, 0, 40.5, 0], ['fire', 0.6, 0.6, 0.6, 0, 42.2, 0]],
    // roadside jizō: three stone statues with red bibs under a wooden awning, a candle; facing -X
    jizos: () => [['plinth', 2.4, 2, 1.4, 0, -0.9, 0], ...[-0.65, 0, 0.65].flatMap(z => [['stone', 0.32, 0.6, 0.28, 0, 0.42, z], ['stone', 0.24, 0.24, 0.22, 0, 0.86, z], ['bib', 0.3, 0.22, 0.34, -0.03, 0.62, z]]),
      ...pair(sd => ['wood', 0.1, 1.5, 0.1, -0.5, 0.85, sd * 1.05]), ...pair(sd => ['wood', 0.1, 1.5, 0.1, 0.5, 0.85, sd * 1.05]), ['roofM', 1.4, 0.12, 2.6, 0, 1.65, 0, [0, 0, 0.25]], ['fire', 0.06, 0.12, 0.06, -0.45, 0.2, 0.32]],
    // phone booth lit from inside (green-tinted glass), facing -X
    cabin: () => [['plinth', 1.6, 2, 1.6, 0, -0.9, 0], ['glassMat', 0.95, 2.1, 0.95, 0, 1.15, 0], ['rackFrame', 1.05, 0.2, 1.05, 0, 2.3, 0], ['rackFrame', 1.05, 0.12, 1.05, 0, 0.16, 0]],
    // summit temple (X = going away from the road, origin at the road's edge, at carriageway level). From the road to the back: torii myōjin, slab path
    // lined with tōrō, a raked gravel courtyard enclosed by a low fence, an ablution pavilion and a small basin, steps between two low walls up to a 3 m terrace,
    // pavilion on a raised floor: exposed vermilion pillars, beams, lit shōji, railed gallery; curved tile roof (eight panels of decreasing slope),
    // upturned ridge ends at the corners, ridge, oni, chigi and katsuogi; shimenawa and shide, red lanterns under the eaves
    temple: () => { const r = [], P = (...b) => r.push(b), y0 = 3, yp = y0 + 0.9; // y0: top of the terrace; yp: pavilion floor
      const tooro = (x, z) => { P('stone', 1.1, 0.36, 1.1, x, 0.18, z); P('stone', 0.46, 1.3, 0.46, x, 1.01, z); P('stone', 0.8, 0.26, 0.8, x, 1.79, z); P('fire', 0.55, 0.52, 0.55, x, 2.18, z);
        for (const [u, v] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) P('stone', 0.1, 0.52, 0.1, x + u * 0.29, 2.18, z + v * 0.29); P('stone', 1.3, 0.22, 1.3, x, 2.55, z); P('stone', 0.85, 0.18, 0.85, x, 2.75, z); P('stone', 0.5, 0.14, 0.5, x, 2.89, z); P('stone', 0.26, 0.3, 0.26, x, 3.1, z); };
      // the courtyard: gravel (2 m thick, the ground dips a little on the road side), a path of joined slabs, tōrō in pairs
      P('gravel', 50, 2, 30, 25, -1, 0); for (let x = 5.5; x < 23.6; x += 1.2) P('stone', 1.05, 0.14, 2.6, x, 0.07, 0); for (const x of [8, 12.5, 17, 21.5]) for (const z of [-2.9, 2.9]) tooro(x, z);
      // torii myōjin: black bases and collars, vermilion pillars, projecting nuki, gakuzuka, shimaki, straight kasagi at the center and upturned at the ends; shimenawa under the nuki
      for (const sd of [-1, 1]) { P('blackM', 0.95, 0.5, 0.95, 4, 0.25, sd * 3.2); P('vermilion', 0.62, 7.2, 0.62, 4, 3.6, sd * 3.2); P('blackM', 0.72, 0.25, 0.72, 4, 0.62, sd * 3.2); }
      P('vermilion', 0.32, 0.42, 9.2, 4, 5.9, 0); P('vermilion', 0.3, 0.95, 0.42, 4, 6.6, 0); P('vermilion', 0.55, 0.38, 8.6, 4, 7.28, 0); P('blackM', 0.72, 0.42, 4.2, 4, 7.66, 0);
      for (const sd of [-1, 1]) { let z = 2.1, y = 7.66; for (const [l, a] of [[1.4, 0.05], [1.3, 0.12], [1.1, 0.24]]) { const dz = l * Math.cos(a), dy = l * Math.sin(a); P('blackM', 0.72, 0.42, l + 0.05, 4, y + dy / 2, sd * (z + dz / 2), [-sd * a, 0, 0]); z += dz; y += dy; } }
      P('racingLine', 0.5, 0.5, 6.4, 4, 5.45, 0); for (let z = -2.4; z <= 2.4; z += 1.2) P('shoji', 0.04, 0.8, 0.3, 3.72, 4.85, z);
      // low fence (tamagaki) along both sides of the courtyard: posts and two rails
      for (const sd of [-1, 1]) { for (let x = 3; x <= 29; x += 2) P('wood', 0.12, 1, 0.12, x, 0.5, sd * 14.5); P('wood', 26, 0.1, 0.08, 16, 0.35, sd * 14.5); P('wood', 26, 0.1, 0.08, 16, 0.85, sd * 14.5); }
      // ablution pavilion (temizuya): stone basin with its water, four posts, small roof; and a basin edged with stones on the other side
      P('stone', 1.8, 0.6, 0.9, 14, 0.3, 8); P('water', 1.6, 0.05, 0.7, 14, 0.62, 8); for (const [u, v] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) P('vermilion', 0.2, 2.6, 0.2, 14 + u * 1.3, 1.3, 8 + v * 1);
      for (const sd of [-1, 1]) P('roofM', 3.6, 0.15, 1.7, 14, 2.85, 8 + sd * 0.7, [sd * 0.45, 0, 0]);
      P('water', 5, 0.05, 3, 14, 0.04, -9); for (const [w, d, x, z] of [[5.6, 0.4, 14, -10.7], [5.6, 0.4, 14, -7.3], [0.4, 3, 11.3, -9], [0.4, 3, 16.7, -9]]) P('stone', w, 0.3, d, x, 0.15, z);
      // steps between two low walls, komainu at the foot, stone terrace, offering box
      for (let k = 0; k < 10; k++) P('stone', 0.65, 0.3 * (k + 1) + 1, 7, 24.3 + k * 0.6, (0.3 * (k + 1) + 1) / 2 - 1, 0);
      for (const sd of [-1, 1]) { P('stone', 6.8, 0.55, 0.45, 27, 1.75, sd * 3.75, [0, 0, 0.46]); P('stone', 0.9, 0.6, 0.9, 23.2, 0.3, sd * 3.6); P('stone', 0.6, 0.8, 0.45, 23.2, 1, sd * 3.6); P('stone', 0.45, 0.4, 0.4, 22.95, 1.55, sd * 3.6); }
      P('stone', 20, 4, 24, 40, 1, 0); P('wood', 1.6, 0.8, 1, 31.8, y0 + 0.4, 0);
      // pavilion: plinth, floor and gallery, steps, body, shōji, small white wall, exposed pillars and beams, brackets, railings
      P('stone', 13, 0.6, 16.6, 40, y0 + 0.3, 0); P('wood', 13.6, 0.3, 17, 40, y0 + 0.75, 0); for (let k = 0; k < 3; k++) P('wood', 0.45, 0.3 * (k + 1), 3, 32.75 + k * 0.45, y0 + 0.15 * (k + 1), 0);
      P('wood', 10.2, 4.6, 13.8, 40.2, yp + 2.3, 0); P('shoji', 0.1, 3, 13.4, 35.05, yp + 1.5, 0); P('stucco', 0.1, 1.2, 13.4, 35.05, yp + 3.6, 0);
      for (const x of [34.3, 45.7]) for (const z of [-7.2, -3.6, 0, 3.6, 7.2]) { P('vermilion', 0.42, 4.6, 0.42, x, yp + 2.3, z); P('wood', 0.75, 0.4, 0.75, x, yp + 4.8, z); }
      for (const z of [-7.2, 7.2]) { P('vermilion', 0.42, 4.6, 0.42, 40, yp + 2.3, z); P('wood', 0.75, 0.4, 0.75, 40, yp + 4.8, z); }
      for (const y of [yp + 0.4, yp + 3.2, yp + 4.4]) { for (const x of [34.3, 45.7]) P('vermilion', 0.3, 0.28, 15, x, y, 0); for (const z of [-7.2, 7.2]) P('vermilion', 11.8, 0.28, 0.3, 40, y, z); }
      for (const z of [-5, 5]) P('vermilion', 0.1, 0.1, 6.6, 33.3, yp + 0.75, z); for (const z of [-8.4, 8.4]) P('vermilion', 13.4, 0.1, 0.1, 40, yp + 0.75, z); P('vermilion', 0.1, 0.1, 16.8, 46.7, yp + 0.75, 0);
      // shimenawa and shide on the facade, red lanterns under the eaves
      P('racingLine', 0.7, 0.7, 11.5, 33.9, yp + 3.9, 0); for (let z = -4.8; z <= 4.8; z += 1.2) P('shoji', 0.04, 0.9, 0.32, 33.5, yp + 3.15, z); for (const z of [-5.4, 5.4]) P('chochin', 0.6, 0.9, 0.6, 33.6, yp + 3, z);
      // roof: ridge along Z; on each side eight panels of decreasing slope (the roof curve), wooden fascia at the edge, barge boards upturned at the gables and corners
      const yr = yp + 8.7; for (const sg of [-1, 1]) { let x = 40, y = yr; for (const [l, a] of [[1.25, 0.76], [1.2, 0.66], [1.15, 0.56], [1.15, 0.46], [1.1, 0.37], [1.1, 0.28], [1.1, 0.19], [1.1, 0.1]]) { const dx = sg * l * Math.cos(a), dy = -l * Math.sin(a);
          P('roofM', l + 0.12, 0.35, 20, x + dx / 2, y + dy / 2, 0, [0, 0, -sg * a], 1); for (const sd of [-1, 1]) P('shore', l + 0.12, 0.5, 0.22, x + dx / 2, y + dy / 2 + 0.12, sd * 10.1, [0, 0, -sg * a]); x += dx; y += dy; }
        P('shore', 0.25, 0.45, 20.4, x, y - 0.05, 0); for (const sd of [-1, 1]) P('shore', 1.7, 0.45, 0.24, x + sg * 0.35, y + 0.3, sd * 10.1, [0, 0, sg * 0.4]); }
      const PANS = [[1.25, 0.76], [1.2, 0.66], [1.15, 0.56], [1.15, 0.46], [1.1, 0.37], [1.1, 0.28], [1.1, 0.19], [1.1, 0.1]], half = c => { let hx = 0; for (const [l, a] of PANS) { const dy = l * Math.sin(a); if (c <= dy) return hx + c / Math.tan(a); c -= dy; hx += l * Math.cos(a); } return hx; }; // half-width of the roof at c m below the ridge
      for (let y = yp + 5.3; y < yr - 0.3; y += 0.8) for (const sd of [-1, 1]) P('wood', 2 * half(yr - y - 0.4) - 0.3, 0.8, 0.2, 40, y, sd * 9.9); // closed gables, as close as possible under the roof curve
      P('blackM', 1, 0.9, 20.6, 40, yr + 0.35, 0); P('stucco', 1.06, 0.22, 20.7, 40, yr - 0.05, 0); for (const sd of [-1, 1]) { P('blackM', 1.2, 1.5, 0.5, 40, yr + 0.8, sd * 10.4); for (const u of [-1, 1]) P('shore', 0.18, 2.6, 0.3, 40 + u * 0.55, yr + 1.4, sd * 10, [0, 0, u * 0.55]); }
      for (const z of [-6, -3, 0, 3, 6]) P('blackM', 1.4, 0.38, 0.38, 40, yr + 0.98, z); // katsuogi
      return r; },
    // substation (Z = toward the line, origin at the foot of the gantry): gravel platform on the slope (5 m thick: the ground drops behind), enclosure wall, arrival gantry with three crossbars and insulators,
    // deux transformateurs, jeu de barres, local de commande, lampadaire
    booth: () => { const r = [], P = (...b) => r.push(b); P('slab', 18, 5, 22, 0, -2.3, -9); P('concretePart', 18, 1.4, 0.3, 0, 0.7, 2); P('concretePart', 18, 1.4, 0.3, 0, 0.7, -20); for (const sd of [-1, 1]) P('concretePart', 0.3, 1.4, 22, sd * 9, 0.7, -9);
      for (const sd of [-1, 1]) P('steelMat', 0.7, 22, 0.7, sd * 7.8, 11, 0); for (const y of [16, 18.5, 21]) P('steelMat', 16.3, 0.4, 0.5, 0, y + 0.3, 0);
      for (const [x, y] of [[-6.3, 16], [6.3, 16], [-6.3, 18.5], [6.3, 18.5], [-4.3, 21], [4.3, 21]]) P('insulation', 0.25, 1.1, 0.25, x, y - 0.25, 0.4);
      for (const x of [-4, 4]) { P('steelMat', 3, 2.6, 2.4, x, 1.3, -8); P('steelMat', 3.2, 0.3, 0.3, x, 2.75, -8); for (const d of [-1, 0, 1]) P('insulation', 0.2, 1, 0.2, x + d * 0.9, 3.3, -8); }
      P('steelMat', 12, 0.25, 0.25, 0, 6, -4); for (const x of [-5, 0, 5]) P('steelMat', 0.3, 6, 0.3, x, 3, -4); P('concretePart', 5, 3, 4, 4.5, 1.5, -16.5); for (const [x, z] of [[-6, -16], [6, -2]]) { P('steelMat', 0.15, 6, 0.15, x, 3, z); P('lampObj', 0.8, 0.25, 0.8, x, 6.1, z); } P('lampObj', 0.05, 0.8, 2.4, 1.97, 1.8, -16.5); return r; },
  });
})();
