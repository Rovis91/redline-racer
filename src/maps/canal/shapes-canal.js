// Shapes specific to "canal": completes the shapes.js catalog (same conventions: simple shape = geometry, assembly = list of boxes with zones). See docs/methods/SCENERY.md.
// Frame of the circuit pieces: origin at ground level at the middle of the facade, X along the track, Z moving away from the track (toward the back).
(function () {
  const A1 = Math.atan2(14, 24), A2 = Math.atan2(16, 22); // slopes of the low and high terraces
  const B = (w, h, d, H = h) => { const g = new THREE.BoxGeometry(w, h, d); g.userData.dim = [w, H, d]; return g; };
  Object.assign(SHAPES, {
    // stand module of L m, placed side by side along the track: banner podium, low terraces (crowd), stairs at the edge, glazed boxes,
    // high terraces (crowd2), back wall, cantilever roof on a steel truss, floodlight rail; mat = 1: chequered flag and 64 m floodlight mast
    stand: (mat, L = 14) => [['concretePart', L, 3, 2, 0, 1.5, 1], ['streamer', L, 1.6, 0.2, 0, 1.7, -0.05],
      ['crowd', L, 0.6, 27.8, 0, 10, 14, [-A1, 0, 0], 1], ['stairs', 1.4, 0.8, 27.8, 0.7 - L / 2, 10, 14, [-A1, 0, 0]],
      ['vipBox', L, 4, 3, 0, 19, 27.5], ['concretePart', L, 1, 6, 0, 21.5, 28], ['banner2', L, 1.2, 0.2, 0, 22.6, 24.9],
      ['crowd2', L, 0.6, 27.2, 0, 30, 39, [-A2, 0, 0], 1], ['stairs', 1.4, 0.8, 27.2, 0.7 - L / 2, 30, 39, [-A2, 0, 0]],
      ['concretePart', L, 40, 2, 0, 20, 51, null, 1], ['steelMat', 1, 6, 1, 0.5 - L / 2, 43, 51], ['steelMat', 0.8, 3, 34, 0.5 - L / 2, 48.2, 36],
      ['roofM', L + 0.6, 0.8, 34, 0, 46.4, 36, null, 1], ['lampObj', L - 1, 0.6, 0.8, 0, 45.6, 19.6],
      ...(mat ? [['steelMat', 0.25, 9, 0.25, 2 - L / 2, 51.3, 51.5], ['flagCube', 3, 2, 0.1, 3.6 - L / 2, 54.6, 51.5], ['steelMat', 1.4, 64, 1.4, L / 2, 32, 54, null, 1], ['steelMat', 10, 0.6, 2, L / 2, 61.7, 54], ['lampObj', 9, 4, 0.8, L / 2, 64, 53.4]] : [])],
    // post of the protective fence
    poleGrate: () => B(0.25, 5, 0.25),
    // pit garage: bay, raised shutter, team sign, roof
    garage: () => [['concretePart', 12, 7, 12, 0, 3.5, 6, null, 1], ['door', 10, 5, 0.2, 0, 2.5, -0.05], ['signboard', 12, 1.3, 0.3, 0, 6.2, -0.2], ['roofM', 12.4, 0.4, 12.4, 0, 7.2, 6]],
    // timing tower: shaft, glazed cabin, name on the roof
    timerTower: () => [['concretePart', 7, 40, 7, 0, 20, 0, null, 1], ['concretePart', 15, 1, 15, 0, 39.5, 0], ['vipBox', 14, 6, 14, 0, 43, 0], ['concretePart', 15, 1, 15, 0, 46.5, 0], ['label', 0.6, 3.4, 14, 0, 48.7, 0]],
    // position pylon, facing ±X
    pylonScore: () => [['steelMat', 1.6, 8, 1.6, 0, 4, 0], ['screen', 1.2, 30, 4.5, 0, 23, 0], ['steelMat', 1.6, 1, 5, 0, 38.5, 0]],
    // giant leaderboard screen on two feet, facing ±X (seen from both straights)
    screenGiant: () => [...[-12, 12].map(z => ['steelMat', 1.4, 16, 1.4, 0, 8, z]), ['screen', 1, 20, 34, 0, 26, 0], ...[15.5, 36.5].map(y => ['steelMat', 1.6, 1, 35, 0, y, 0]), ['concretePart', 4, 1, 30, 0, 0.5, 0]],
    // motorhome (X toward the front): living cell, over-cab bunk, piping in the instance's colour, wheels
    campingCar: () => [['carBody', 7.2, 2.6, 2.4, 0, 1.9, 0], ['carBody', 1.6, 0.8, 2.3, 3.2, 2.9, 0], ['bandStrip', 7.24, 0.25, 2.44, 0, 1.3, 0], ['pane', 0.1, 0.9, 2.1, 3.62, 2.2, 0],
      ...[2.4, -2.2].flatMap(x => [-1, 1].map(sd => ['tire', 0.9, 0.9, 0.3, x, 0.45, sd * 1.05]))],
    // airship: spindle-shaped envelope (simple shape), then gondola, tail fin and side screens around the origin (center of the envelope)
    envelope: () => { const g = new THREE.SphereGeometry(1, 24, 12); g.scale(36, 9, 9); return g; },
    // the outbound parade (pts 1-6), in front of the north stand. Standing extra, feet at the origin, facing +X; m = 1: baton twirler (short skirt, raised baton), 0: band musician (tall shako, gilded brass)
    extra: m => [['whiteN', 0.2, 0.42, 0.34, 0, 0.21, 0], ['skin', 0.18, 0.44, 0.3, 0, 0.64, 0], ['holdTime', 0.3, 0.62, 0.46, 0, 1.17, 0], ['skin', 0.22, 0.24, 0.22, 0, 1.6, 0],
      ...(m ? [['holdTime', 0.4, 0.22, 0.6, 0, 0.92, 0], ['whiteN', 0.24, 0.2, 0.24, 0, 1.82, 0], ['holdTime', 0.1, 0.55, 0.1, 0, 1.75, 0.3], ['whiteN', 0.04, 1, 0.04, 0, 2.25, 0.3]]
        : [['whiteN', 0.26, 0.5, 0.26, 0, 1.97, 0], ['gold', 0.5, 0.3, 0.22, 0.32, 1.3, 0], ['gold', 0.3, 0.3, 0.3, 0.6, 1.36, 0]])],
    // meeting float (X toward the front): tractor, skirted platform, three-tier cake in the instance's colour (deco zone), a chequered board raised at the bow
    charMeeting: () => [['carBody', 2.6, 2.6, 2.6, 6.4, 1.6, 0], ['pane', 0.1, 1, 2.3, 7.72, 2.2, 0], ['whiteN', 11.2, 0.9, 3.5, 0, 0.75, 0], ['carBody', 11, 0.4, 3.4, 0, 1.4, 0],
      ['deco', 8, 1.4, 3, -0.5, 2.3, 0], ['deco', 5.4, 1.4, 2.3, -0.8, 3.7, 0], ['whiteN', 2.6, 1.8, 1.6, -1, 5.3, 0], ['flagCube', 0.1, 2.4, 3.4, 3.8, 3.8, 0],
      ...[5.6, 1.5, -3.6].flatMap(x => [-1, 1].map(sd => ['tire', 1, 1, 0.4, x, 0.5, sd * 1.5]))],
    // chequered flag mast of the return leg (pts 13-18): 14 m, the cloth toward +X
    matChecker: () => [['steelMat', 0.2, 14, 0.2, 0, 7, 0], ['flagCube', 4, 2.6, 0.08, 2.1, 12.6, 0]],
    // hot-air balloon: teardrop envelope (radius 1, scaled per instance), point at the bottom; the basket is a separate box
    balloon: () => { const g = new THREE.SphereGeometry(1, 20, 14), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i), k = y < 0 ? 1 + y * 0.75 : 1; p.setXYZ(i, p.getX(i) * k, y * 1.15, p.getZ(i) * k); } g.computeVertexNormals(); return g; },
    // lock (road frame: X across, Z toward the rear, origin at the end of the ramp): concrete side walls on each side, mitre gates open against them,
    // operating footbridge over the track with its two capstans; W = half-width of the road
    lock: (W = 14) => [...[-1, 1].flatMap(sd => [['concretePart', 2.4, 6, 46, sd * (W + 2), 3, 14, null, 1], ['wood', 0.5, 5, 9, sd * (W + 0.55), 2.5, 4.6], ['wood', 0.5, 5, 9, sd * (W + 0.55), 2.5, 32],
      ['steelMat', 0.6, 9, 0.6, sd * (W + 1.6), 7.5, 0, null, 1], ['steelMat', 0.9, 1.1, 0.9, sd * (W + 2.3), 6.55, 9], ['steelMat', 1.8, 0.2, 0.2, sd * (W + 2.3), 7.2, 9]]),
      ['steelMat', 2 * W + 4, 0.7, 2.2, 0, 12.35, 0, null, 1], ['redTone', 2 * W + 4, 1, 0.1, 0, 13.2, -1.1], ['redTone', 2 * W + 4, 1, 0.1, 0, 13.2, 1.1]],
    airship: () => [['gondola', 8, 2.4, 3, 2, -9.6, 0], ['tailFin', 7, 0.3, 16, -31, 0, 0], ['tailFin', 7, 14, 0.3, -31, 0, 0], ['screen', 30, 6, 0.2, 2, 0, 9.05], ['screen', 30, 6, 0.2, 2, 0, -9.05]],
  });
})();
