// Shapes specific to "piliers", family "bridge": completes the shapes.js catalogue. Metres, Y up. Assemblies (lists of boxes [zone, w, h, d, x, y of the centre, z, rotation]); zones are names of the map's shared materials (MAT in scenery-piliers.js): steel, stone.
// See docs/proposals/sky-pillars/AMBIANCE-V2.html, zone 3: two dark steel towers, a portal each; massive stone anchor blocks set in the rock. Not a glass deck, not towers rising from the ravine floor.
// The cables and hangers are bars placed by the scenery (they follow the deck); the deck and its railing are ribbons.
(function () {
  const pair = f => [-1, 1].map(f);
  Object.assign(SHAPES, {
    // a tower in the road frame (X across, origin on the axis at deck level): two legs w apart rising ht above the deck and going `below` metres under it to their footing on the rock, a top beam with the two cable saddles,
    // a portal beam 9 m above the roadway and a cross of bracing between the two
    pylonePiliers: (w = 21, ht = 50, below = 30) => { const bx = Math.hypot(w, ht - 14);
      return [...pair(sd => [['steel', 3, ht + below, 4, sd * w / 2, (ht - below) / 2, 0], ['steel', 5, 3, 6, sd * w / 2, ht + 1.5, 0], ['stone', 7, 6, 8, sd * w / 2, -below + 1, 0]]).flat(),
        ['steel', w + 3, 3, 3.4, 0, ht - 1.5, 0], ['steel', w, 2.4, 3, 0, 10.2, 0], ...pair(sd => ['steel', bx, 1, 1, 0, (ht + 9) / 2, 0, [0, 0, sd * Math.atan2(ht - 14, w)]]),
        ...(below > 16 ? [['steel', w, 2, 3, 0, -below * 0.5, 0]] : [])]; }, // a strut between the legs where they go far down
    // an anchor block beside the road (X away from the road, Z along it): a stepped mass of dressed stone w × ht × d, the steel shoe of the cable on its top
    culeePiliers: (w = 8, ht = 5, d = 26) => [['stone', w, ht + 6, d, 0, ht / 2 - 3, 0], ['stone', w * 0.7, 2, d * 0.55, 0, ht + 1, 0], ['steel', 2, 1.6, 4, 0, ht + 2.8, 0]],
  });
})();
