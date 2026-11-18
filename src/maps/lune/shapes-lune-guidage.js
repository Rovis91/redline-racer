// Shapes of the guidance of "lune" (round 5): what tells the way on a road with no air and no signs painted on the ground: lit posts in pairs (a gate), low pylons along a corridor, arrow boards, bend poles, cable posts along the berms.
// Same conventions as shapes-lune-base.js (zones = the shared materials of scenery-lune.js; 'cyan' is the cold light, 'glow' the amber one). The placement turns local +Z toward the oncoming car, local +X to the driver's right.
// Colour code of the whole map: LEFT of the road = cold cyan, RIGHT = amber (side +1). `side` below is that side: -1 cyan, 1 amber.
(function () {
  const lamp = side => side > 0 ? 'glow' : 'cyan';
  Object.assign(SHAPES, {
    // gate post, ht high: a dark mast, an ivory reflective band, a tall lamp bar at the top in the colour of its side (readable from 300 m: a vertical bar of light on a black sky)
    jalonLune: (ht = 4.5, side = 1) => [['dark', 0.45, ht, 0.45, 0, ht / 2, 0], ['shell', 0.55, 0.8, 0.55, 0, ht * 0.55, 0], ['dark', 1, 0.3, 1, 0, 0.15, 0], [lamp(side), 0.6, 1.7, 0.6, 0, ht + 0.85, 0]],
    // low pylon of a lit corridor, 1.1 m: the row of them along the path, a line of lights at ground level
    plotLune: (side = 1) => [['dark', 0.6, 0.6, 0.6, 0, 0.3, 0], [lamp(side), 0.5, 0.7, 0.5, 0, 0.95, 0]],
    // arrow board on its mast: a dark panel 5.4 × 2.8 on two legs, an arrow of light pointing `dir` (1 right, -1 left) in the colour of the side it points to. The legs make it a stand, not a wall
    flecheLune: (dir = 1) => { const c = lamp(dir), y = 4.6; // the head: two bars at ±45° back from the tip
      return [['dark', 5.6, 3, 0.3, 0, y, 0], ['dark', 0.35, y - 1.5, 0.35, -1.9, (y - 1.5) / 2, -0.1], ['dark', 0.35, y - 1.5, 0.35, 1.9, (y - 1.5) / 2, -0.1],
        [c, 3.6, 0.55, 0.35, -dir * 0.2, y, 0.22], [c, 1.9, 0.5, 0.35, dir * 1.45, y + 0.5, 0.22, [0, 0, -dir * 0.785]], [c, 1.9, 0.5, 0.35, dir * 1.45, y - 0.5, 0.22, [0, 0, dir * 0.785]], ['amber', 5.8, 0.25, 0.4, 0, y + 1.5, 0]]; },
    // bend pole, ht high: a thin dark post, two ivory reflective bands, a small lamp of its side at the top; on the outside of the bends, every 12 m
    poteauLune: (ht = 3, side = 1) => [['dark', 0.22, ht, 0.22, 0, ht / 2, 0], ['shell', 0.3, 0.45, 0.3, 0, ht * 0.72, 0], ['shell', 0.3, 0.3, 0.3, 0, ht * 0.38, 0], [lamp(side), 0.4, 0.5, 0.4, 0, ht + 0.25, 0]],
    // marker post of the berms, 1.9 m: carries the cable that links it to the next one
    pieuLune: (side = 1) => [['dark', 0.2, 1.9, 0.2, 0, 0.95, 0], ['shell', 0.28, 0.35, 0.28, 0, 1.55, 0], [lamp(side), 0.22, 0.22, 0.22, 0, 2, 0]],
  });
})();
