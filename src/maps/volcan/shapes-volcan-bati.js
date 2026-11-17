// Shapes specific to "volcan", family "buildings": completes the shapes.js catalogue. Metres, origin on the ground at the centre of the building, Y up.
// Assemblies (boxes [zone, w, h, d, x, y, z, rotation]); X along the road, front toward -Z (the road), +Z away from it. Bodies go 3 m into the ground so that they sit on a slope.
// Zones are keys of the map's shared materials (MAT in scenery-volcan.js): cream, ochre, coral, white (plaster tints), tile, dark, stone, concrete, paving, steel, wood, red, lamp.
// See docs/proposals/volcanic-island/AMBIANCE-V2.html, zones 1, 2, 5, 6: small plain cubes, tiled roofs, three to five colours. Not villas, not a town.
(function () {
  const pair = f => [-1, 1].map(f);
  // gable roof over a w × d body whose eaves are at ht, ridge along X: two tiled slopes and the two gable ends in the wall tint
  const roof = (w, ht, d, tint, rise = d * 0.22, over = 0.6) => { const a = Math.atan(rise / (d / 2)), sl = Math.hypot(rise, d / 2);
    return [...pair(sd => ['tile', w + over * 2, 0.35, sl + over, 0, ht + rise / 2, sd * d / 4, [sd * a, 0, 0]]), [tint, w - 0.1, rise * 0.5, d * 0.5, 0, ht + rise * 0.25, 0], [tint, w - 0.1, rise * 0.25, d * 0.22, 0, ht + rise * 0.62, 0]]; };
  Object.assign(SHAPES, {
    // house, w along the road × ht to the eaves × d deep, tint = its plaster (cream, ochre, coral, white): stone foot, tiled gable roof, a door and windows on the front and on both ends
    maisonVolcan: (w = 12, ht = 6, d = 9, tint = 'cream') => { const nw = Math.max(2, Math.round(w / 4)), up = ht > 5.5;
      return [[tint, w, ht + 3, d, 0, (ht - 3) / 2, 0], ['stone', w + 0.3, 3.8, d + 0.3, 0, -1.1, 0], ...roof(w, ht, d, tint),
        ['dark', 1.3, 2.3, 0.2, -w / 2 + 2, 1.15, -d / 2 - 0.05],
        ...Array.from({ length: nw }, (_, i) => -w / 2 + (i + 0.5) * w / nw).flatMap(x => [...(Math.abs(x + w / 2 - 2) < 1.6 ? [] : [['dark', 1.1, 1.3, 0.2, x, 1.7, -d / 2 - 0.05]]), ...(up ? [['dark', 1.1, 1.3, 0.2, x, ht - 1.6, -d / 2 - 0.05]] : [])]),
        ...pair(sx => ['dark', 0.2, 1.3, 1.1, sx * (w / 2 + 0.05), up ? ht - 1.6 : 1.7, 0])]; },
    // harbour shed, w along the road × ht × d deep: concrete walls, a single low tiled gable, a wide dark doorway on the front
    hangarVolcan: (w = 50, ht = 7, d = 18) => [['concrete', w, ht + 3, d, 0, (ht - 3) / 2, 0], ...roof(w, ht, d, 'concrete', d * 0.14, 0.8),
      ...[-1, 0, 1].map(k => ['dark', w * 0.2, ht * 0.7, 0.3, k * w * 0.3, ht * 0.35, -d / 2 - 0.1]), ['wood', w * 0.94, 0.5, 0.3, 0, ht * 0.75, -d / 2 - 0.15]],
    // fish market, L along the road × w deep: a long tiled roof on concrete posts over a slab, a low wall at the back, open toward the road
    crieeVolcan: (L = 60, w = 20, ht = 4.2) => [['concrete', L, 0.9, w, 0, -0.1, 0], ...roof(L, ht, w, 'concrete', w * 0.16, 1.2), ['cream', L, ht - 1, 0.5, 0, (ht - 1) / 2, w / 2 - 0.3],
      ...Array.from({ length: Math.round(L / 7.5) + 1 }, (_, i) => -L / 2 + 0.4 + i * (L - 0.8) / Math.round(L / 7.5)).flatMap(x => pair(sd => ['concrete', 0.5, ht, 0.5, x, ht / 2, sd * (w / 2 - 0.5) * (sd > 0 ? 0.6 : 1)])),
      ...[-0.3, 0, 0.3].map(k => ['wood', 6, 0.9, 2, k * L, 0.8, 1])],
    // chapel: white nave 8 × 14 m with a tiled roof, its ridge along Z, a square bell tower beside the front with dark belfry openings and a tiled cap; the door faces -Z
    chapelleVolcan: () => { const a = Math.atan(2.4 / 4), sl = Math.hypot(2.4, 4);
      return [['white', 8, 9, 14, 0, 1.5, 0], ['stone', 8.3, 3.8, 14.3, 0, -1.1, 0], ...pair(sd => ['tile', sl + 0.5, 0.35, 15, sd * 2, 7.2, 0, [0, 0, -sd * a]]), ['white', 4, 1.3, 13.9, 0, 6.6, 0],
        ['dark', 1.6, 2.8, 0.2, 0, 1.4, -7.05], ['dark', 1, 1, 0.2, 0, 4.6, -7.05], ...pair(sd => ['dark', 0.2, 1.8, 0.9, sd * 4.05, 3.4, 1]),
        ['white', 4, 20, 4, 6, 7, -5], ...pair(sd => ['dark', 1.3, 2.2, 0.2, 6, 13.6, -5 + sd * 2.05]), ...pair(sd => ['dark', 0.2, 2.2, 1.3, 6 + sd * 2.05, 13.6, -5]), ['tile', 4.8, 0.5, 4.8, 6, 17.2, -5], ['tile', 2.8, 1.4, 2.8, 6, 18.1, -5], ['steel', 0.15, 2, 0.15, 6, 19.8, -5], ['steel', 0.9, 0.15, 0.15, 6, 20.2, -5]]; },
    // observers' post, w × ht × d: a plain concrete block with a flat overhanging roof, a dark window band toward the road, a steel mast with two aerials on the roof
    posteVolcan: (w = 12, ht = 5, d = 9, mast = 14) => [['concrete', w, ht + 3, d, 0, (ht - 3) / 2, 0], ['concrete', w + 1.6, 0.5, d + 1.6, 0, ht + 0.25, 0], ['dark', w * 0.7, 1.2, 0.2, 0, ht * 0.62, -d / 2 - 0.05], ['dark', 1.2, 2.2, 0.2, w * 0.36, 1.1, d / 2 + 0.05],
      ['steel', 0.3, mast, 0.3, w * 0.3, ht + mast / 2, d * 0.2], ['steel', 2.4, 0.15, 0.15, w * 0.3, ht + mast - 1, d * 0.2], ['steel', 1.6, 0.15, 0.15, w * 0.3, ht + mast - 2.6, d * 0.2], ['red', 0.5, 0.5, 0.5, w * 0.3, ht + mast + 0.2, d * 0.2]],
    // belvedere of the pass, L along the road × w deep: a concrete deck flush with the roadside, a steel railing on its three outer sides, three benches facing the sea (+Z)
    belvedereVolcan: (L = 44, w = 24) => [['paving', L, 3, w, 0, -1.2, 0], ['steel', L, 0.12, 0.12, 0, 1.4, w / 2 - 0.3], ['steel', L, 0.1, 0.1, 0, 0.9, w / 2 - 0.3], ...pair(sx => ['steel', 0.12, 0.12, w, sx * (L / 2 - 0.3), 1.4, 0]),
      ...Array.from({ length: Math.round(L / 3) + 1 }, (_, i) => ['steel', 0.14, 1.1, 0.14, -L / 2 + 0.3 + i * (L - 0.6) / Math.round(L / 3), 0.85, w / 2 - 0.3]), ...Array.from({ length: 9 }, (_, i) => pair(sx => ['steel', 0.14, 1.1, 0.14, sx * (L / 2 - 0.3), 0.85, -w / 2 + 0.3 + i * (w - 0.6) / 8])).flat(),
      ...[-1, 0, 1].flatMap(k => [['wood', 3, 0.15, 0.7, k * L * 0.3, 0.75, w / 2 - 3], ['concrete', 0.3, 0.5, 0.6, k * L * 0.3 - 1.2, 0.5, w / 2 - 3], ['concrete', 0.3, 0.5, 0.6, k * L * 0.3 + 1.2, 0.5, w / 2 - 3]])],
    // low wall beside the road, L long: lime-washed masonry on a basalt foot
    muretVolcan: (L = 40, ht = 1.1) => [['cream', L, ht + 1, 0.6, 0, (ht - 1) / 2, 0], ['stone', L, 0.3, 0.8, 0, ht + 0.1, 0]],
    // marker stone of the old service road: a small lime-washed post with a red cap
    borneVolcan: () => [['white', 0.5, 1.6, 0.5, 0, 0.3, 0], ['red', 0.52, 0.3, 0.52, 0, 1.2, 0]],
    // measuring instrument on a post, beside the road in the crater
    capteurVolcan: () => [['steel', 0.15, 2.4, 0.15, 0, 1.2, 0], ['white', 0.7, 0.7, 0.5, 0, 2.5, 0], ['dark', 0.9, 0.08, 0.7, 0, 3, 0, [0.5, 0, 0]]],
  });
})();
