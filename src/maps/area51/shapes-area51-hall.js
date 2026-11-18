// Shapes specific to "area51", family "halls and sheds": completes the shapes.js catalogue. Metres, origin on the ground at the centre of the building, Y up.
// Assemblies (lists of boxes [zone, w, h, d, x, y, z, rotation]); the zones are the names of the map's shared materials (MAT in scenery-area51.js): tin, roof, concrete, dark, lattice, steel, neon, danger, door, verriere.
// See docs/proposals/area51/AMBIANCE-V2.html, zone 1: olive corrugated steel on a sand concrete plinth, roof trusses as a regular rhythm, strip lights between them. Not an airliner hangar, not a tidy museum.
(function () {
  const pair = f => [-1, 1].map(f);
  Object.assign(SHAPES, {
    // maintenance hall crossed by the road, X along the hall: L long, W wide, H clear under the trusses, a door dw × dh in each gable. The inside is empty and its floor is 1.3 m thick (the road lies 0.2 m above it)
    hallArea51: (L = 300, W = 116, H = 22, dw = 40, dh = 13) => { const rise = 8, a = Math.atan(rise / (W / 2)), sl = Math.hypot(rise, W / 2), top = H + 3, side = (W - dw) / 2;
      return [['floor', L, 3.3, W - 2, 0, -0.35, 0],                                                                  // floor
        ...pair(sd => [['concrete', L, 5, 1.6, 0, 0.5, sd * W / 2], ['tin', L, top - 3, 1, 0, 3 + (top - 3) / 2, sd * W / 2],  // long walls: plinth, cladding
          ['roof', L + 6, 0.6, sl + 2, 0, top + rise / 2, sd * W / 4, [sd * a, 0, 0]]]).flat(),                       // roof slopes
        ...pair(sx => [...pair(sd => [['concrete', 1.6, 5, side, sx * L / 2, 0.5, sd * (dw / 2 + side / 2)], ['tin', 1, top - 3, side, sx * L / 2, 3 + (top - 3) / 2, sd * (dw / 2 + side / 2)],
            ['danger', 1.8, dh, 1.8, sx * L / 2, dh / 2, sd * (dw / 2 + 0.9)]]).flat(),                               // gable: side panels, hazard-banded door posts
          ['tin', 1, top - dh, dw + 3.6, sx * L / 2, dh + (top - dh) / 2, 0], ['tin', 1, rise * 0.6, W * 0.55, sx * L / 2, top + rise * 0.3, 0], ['danger', 2, 1.4, dw + 3.6, sx * L / 2, dh + 0.7, 0]]).flat(),
        ...Array.from({ length: Math.round(L / 20) + 1 }, (_, i) => -L / 2 + 2 + i * (L - 4) / Math.round(L / 20)).flatMap(x => [['lattice', 0.5, 5, W - 3, x, H + 2.5, 0], ['steel', 0.7, 0.6, W - 3, x, H + 0.3, 0]]), // trusses every 20 m
        ...[-40, -14, 14, 40].map(z => ['neon', L - 12, 0.25, 1.4, 0, H - 0.2, z])]; },                               // four runs of strip lights
    // open hangar, front toward -Z: w wide, ht to the eaves, d deep. Three corrugated walls, gable roof, both door leaves slid aside, a lit glazing band over the opening, strip lights inside: what is parked in it is seen from the apron
    shedOpenArea51: (w = 120, ht = 20, d = 100) => { const rise = Math.min(8, w * 0.07), a = Math.atan(rise / (w / 2)), sl = Math.hypot(rise, w / 2);
      return [['floor', w, 2.4, d, 0, -0.8, 0], ['concrete', w + 0.8, 5, 1.4, 0, 0.5, d / 2], ['tin', w, ht - 3, 1, 0, 3 + (ht - 3) / 2, d / 2],
        ...pair(sd => [['concrete', 1.4, 5, d, sd * w / 2, 0.5, 0], ['tin', 1, ht - 3, d, sd * w / 2, 3 + (ht - 3) / 2, 0], ['roof', sl + 1.5, 0.6, d + 4, sd * w / 4, ht + rise / 2, 0, [0, 0, -sd * a]],
          ['tin', w * 0.55, rise * 0.6, 1, 0, ht + rise * 0.3, sd * d / 2], ['door', w * 0.13, ht * 0.86, 0.7, sd * w * 0.435, ht * 0.43, -d / 2 - 0.5]]).flat(),
        ['verriere', w, 1.8, 0.5, 0, ht - 0.9, -d / 2], ...[-d / 4, 0, d / 4].map(z => ['neon', w * 0.8, 0.25, 1.2, 0, ht - 1.2, z])]; },
    // closed hangar or shed, door side toward -Z: w wide, h to the eaves, d deep. Gable roof with its ridge along Z, a sliding door over 70 % of the front, a lit glazing band above it
    shedArea51: (w = 120, ht = 20, d = 100) => { const rise = Math.min(8, w * 0.07), a = Math.atan(rise / (w / 2)), sl = Math.hypot(rise, w / 2);
      return [['concrete', w + 0.8, 5, d + 0.8, 0, 0.5, 0], ['tin', w, ht - 3, d, 0, 3 + (ht - 3) / 2, 0],
        ...pair(sd => ['roof', sl + 1.5, 0.6, d + 4, sd * w / 4, ht + rise / 2, 0, [0, 0, -sd * a]]), ...pair(sd => ['tin', w * 0.55, rise * 0.6, 1, 0, ht + rise * 0.3, sd * d / 2]),
        ['door', w * 0.7, ht * 0.72, 0.6, 0, ht * 0.36, -d / 2 - 0.3], ['verriere', w * 0.7, Math.min(2.4, ht * 0.14), 0.4, 0, ht * 0.86, -d / 2 - 0.35]]; },
  });
})();
