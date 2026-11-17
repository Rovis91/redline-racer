// Shapes specific to "area51", family "dishes and radio": completes the shapes.js catalogue. Metres, Y up. For the pilot only D1, the 120 m listening dish, the landmark of the lap.
// See docs/proposals/area51/AMBIANCE-V2.html, zone 3: off-white dish, grey lattice back structure, a massive pale concrete pedestal (the 70 m Goldstone antenna is the model). Not a satellite-TV dish, not a radome.
// The reflector and its back structure have their origin at the vertex of the bowl and open toward +Y: the placement tilts them. The mount has its origin on the ground, its elevation axis at height hs.
(function () {
  const pair = f => [-1, 1].map(f);
  Object.assign(SHAPES, {
    // reflector (simple shape): paraboloid of radius r and depth dp, 16 flat sides, 5 rings. To be given a DoubleSide material
    dishBowlArea51: (r = 60, dp = 18) => SHAPES.ringsArea51(16, [0.08, 0.3, 0.52, 0.72, 0.88, 1].map(t => [dp * t * t, r * t, r * t])),
    // what holds the reflector (assembly, same origin): 8 lattice ribs under the bowl, the hub, a ring girder, the four struts of the feed and the sub-reflector with its red light
    dishBackArea51: (r = 60, dp = 18) => { const b = Math.atan(dp / r), yF = r * 0.5, c = Math.atan2(yF - dp * 0.3, r * 0.55), ls = Math.hypot(yF - dp * 0.3, r * 0.55);
      return [...Array.from({ length: 8 }, (_, i) => i * 0.7854).flatMap(t => [['lattice', r * 0.96, 7, 0.6, Math.cos(t) * r * 0.48, dp * 0.44 - 5, -Math.sin(t) * r * 0.48, [0, t, b]],
          ['gray', 6, 2, 1.2, Math.cos(t + 0.3927) * r * 0.62, dp * 0.34 - 3, -Math.sin(t + 0.3927) * r * 0.62, [0, t + 0.3927 + 1.5708, 0]]]),
        ...Array.from({ length: 16 }, (_, i) => i * 0.3927 + 0.196).map(t => ['gray', r * 0.245, 1.4, 1.4, Math.cos(t) * r * 0.61, dp * 0.36 - 4.5, -Math.sin(t) * r * 0.61, [0, t + 1.5708, 0]]), // ring girder
        ['gray', 14, 9, 14, 0, -5, 0],
        ...[0.7854, 2.3562, 3.927, 5.4978].map(t => ['steel', ls, 0.9, 0.9, Math.cos(t) * r * 0.275, (dp * 0.3 + yF) / 2, -Math.sin(t) * r * 0.275, [0, t, -c]]),
        ['white', 9, 3, 9, 0, yF, 0], ['fire', 1.2, 1.2, 1.2, 0, yF + 2.2, 0]]; },
    // mount (assembly): stepped concrete pedestal with a lit band of windows, the turning platform, the two arms that carry the elevation axis at height hs, the counterweights behind
    dishMountArea51: (hs = 50) => [['concrete', 38, 8, 38, 0, 2, 0], ['concrete', 26, hs - 22, 26, 0, 6 + (hs - 22) / 2, 0], ['verriere', 26.4, 2, 26.4, 0, 12, 0], ['gray', 34, 3, 34, 0, hs - 14.5, 0],
      ...pair(sd => [['steel', 5, 16, 9, sd * 13, hs - 6, 0], ['gray', 3, 6, 14, sd * 13, hs - 9, 0, [0.5, 0, 0]], ['gray', 3, 6, 14, sd * 13, hs - 9, 0, [-0.5, 0, 0]]]).flat(),
      ['gray', 34, 3.4, 3.4, 0, hs, 0], ['concrete', 10, 7, 6, 0, hs - 9, 12]],
  });
})();
