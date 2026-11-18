// Shapes specific to "area51", family "perimeter and gates": completes the shapes.js catalogue. Metres, origin on the ground, Y up. Assemblies; zones are the shared materials of the map (MAT in scenery-area51.js).
// Roadside pieces: local Z runs along the road and their front looks toward -X (the placer `side` turns -X to the road on both sides).
// See docs/proposals/area51/AMBIANCE-V2.html, zone 4: chain-link fence with wire, lattice watchtowers, small booths, a striped barrier, earth-covered igloos with a concrete front and a steel door. Not a fortress wall, not a border post with lanes.
(function () {
  const pair = f => [-1, 1].map(f);
  Object.assign(SHAPES, {
    // guard booth, w × d: concrete base, white cabin, a dark window band all round, flat overhanging roof
    gueriteArea51: (w = 4, d = 6) => [['concrete', w + 0.4, 0.4, d + 0.4, 0, 0.2, 0], ['white', w, 2.7, d, 0, 1.75, 0], ['glass', w + 0.1, 1, d + 0.1, 0, 2.1, 0], ['gray', w + 1, 0.3, d + 1, 0, 3.25, 0]],
    // chain-link fence, len long along Z: concrete posts every 8 m or so, mesh panel, top wire on outriggers
    clotureArea51: (len = 120) => { const n = Math.round(len / 8); return [['lattice', 0.1, 2.6, len, 0, 1.5, 0], ['steel', 0.1, 0.1, len, 0.3, 3.3, 0],
      ...Array.from({ length: n + 1 }, (_, i) => -len / 2 + i * len / n).flatMap(z => [['concrete', 0.25, 3.2, 0.25, 0, 1.6, z], ['concrete', 0.5, 0.15, 0.15, 0.2, 3.2, z, [0, 0, 0.5]]])]; },
    // watchtower, 14 m: lattice legs, corrugated cabin with a window band, roof, a searchlight toward the road
    miradorArea51: () => [['lattice', 3, 10, 3, 0, 5, 0], ...pair(sx => pair(sz => ['steel', 0.3, 10, 0.3, sx * 1.5, 5, sz * 1.5])).flat(), ['gray', 4.8, 0.3, 4.8, 0, 10.15, 0], ['tin', 4.2, 2.6, 4.2, 0, 11.6, 0], ['glass', 4.3, 1, 4.3, 0, 12, 0],
      ['gray', 5.4, 0.3, 5.4, 0, 13.05, 0], ['neon', 0.7, 0.7, 0.7, -2.5, 12, 0]],
    // gate barrier beside the road: post, counterweight, a red and white arm of `arm` m toward the road, raised by `up` radians (the race passes under it)
    barriereArea51: (arm = 8, up = 1.2) => [['concrete', 0.9, 1.3, 0.9, 0, 0.65, 0], ['gray', 1.6, 0.6, 0.6, 0.7, 1.1, 0], ['stripe', arm, 0.28, 0.28, -Math.cos(up) * arm / 2, 1.1 + Math.sin(up) * arm / 2, 0, [0, 0, -up]]],
    // anti-ram concrete block, len long along Z, hazard-banded ends
    blocBetonArea51: (len = 14) => [['concrete', 2, 0.4, len, 0, 0.2, 0], ['concrete', 1.2, 1, len, 0, 0.9, 0], ...pair(sd => ['danger', 1.3, 1.05, 1, 0, 0.93, sd * (len / 2 - 0.5)])],
    // road trestle, len long along Z: two red and white planks on two A-feet. Marks an edge where there is no rail
    chevaletArea51: (len = 3.4) => [['stripe', 0.12, 0.42, len, 0, 1.05, 0], ['stripe', 0.12, 0.3, len, 0, 0.5, 0], ...pair(sd => [['gray', 0.1, 1.3, 0.1, 0, 0.65, sd * (len / 2 - 0.3)], ['gray', 1, 0.1, 0.12, 0, 0.05, sd * (len / 2 - 0.3)]]).flat()],
    // roadside board on two posts, 4 × 2.2 m, facing the car that arrives (+Z): the plate takes the material of the zone `sign`
    panneauArea51: () => [...pair(sd => ['steel', 0.2, 5, 0.2, sd * 1.6, 2.5, 0]), ['sign', 4, 2.2, 0.2, 0, 4, 0]],
    // front of a munitions igloo (the mound is the simple shape butteArea51, same origin, 24 m deep): concrete headwall and wing walls on the road side, steel door, apron, a vent on the mound
    iglooArea51: () => [['concrete', 1, 5.4, 9.4, -11.4, 2.7, 0], ...pair(sd => ['concrete', 3.6, 3, 0.6, -12.8, 1.5, sd * 4.9, [0, sd * 0.5, 0]]), ['gray', 0.3, 3.4, 3.2, -12, 1.7, 0], ['danger', 0.3, 0.5, 3.6, -12.02, 3.7, 0],
      ['concrete', 5, 0.3, 9, -14.4, 0.15, 0], ['steel', 0.5, 1.4, 0.5, 3, 5.4, 0]],
    // earth mound over an igloo, w across by d along: a long rounded butte (simple shape; give it the ground material)
    butteArea51: (w = 24, ht = 5, d = 9) => SHAPES.ringsArea51(8, [[-0.6, w * 0.56, d * 0.8], [ht * 0.7, w * 0.44, d * 0.56], [ht, w * 0.26, d * 0.3]], true, 0.05),
    // berm, w × ht × d: an earth or rock bank (simple shape)
    merlonArea51: (w = 12, ht = 6, d = 70, seed = 0) => SHAPES.ringsArea51(8, [[-1, w * 0.66, d * 0.56], [ht, w * 0.3, d * 0.44]], true, 0.08, seed),
    // jet-blast fence, len long along Z: tilted concrete deflector on braces
    pareSouffleArea51: (len = 30) => [['concrete', 0.5, 5, len, 0, 2.2, 0, [0, 0, 0.5]], ...Array.from({ length: 6 }, (_, i) => -len / 2 + 2.5 + i * (len - 5) / 5).map(z => ['gray', 0.3, 3.4, 0.3, 1.7, 1.6, z, [0, 0, -0.35]])],
  });
})();
