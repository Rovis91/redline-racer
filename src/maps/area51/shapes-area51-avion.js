// Shapes specific to "area51", family "aircraft": completes the shapes.js catalogue. Metres, origin on the ground under the middle of the airframe, nose toward +Z, Y up.
// Three invented black prototypes whose silhouettes are those of the famous secret aircraft: a long twin-engine needle with chines (the SR-71), a flying wing with a saw-tooth trailing edge (the B-2), a faceted arrowhead with a V tail (the F-117).
// Each is two pieces posed at the same origin: a "nappe" (simple shape: the lifting surface as a thin faceted solid, to be given the stealth material, DoubleSide) and an assembly of boxes (fuselage, engines, fins, canopy, gear).
// The race passes close and low: the bellies and the landing gear are what the camera sees first, so each leg is a real one (oleo strut, drag brace, axle, octagonal tyres with their rims, an open door).
// See docs/proposals/area51/AMBIANCE-V2.html, zone 1. No scaffolding round them: the silhouette must read from the lane. No markings of a real air force.
(function () {
  const pair = f => [-1, 1].map(f), A8 = [0, 0.7854, 1.5708, 2.3562], tube = (z, w, len, x, y, zz) => A8.map(a => [z, w, w * 0.4142, len, x, y, zz, [0, 0, a]]); // tube: four slabs crossed along Z, a true octagon in section (two crossed squares would make a star)
  // nappe: V = [[x, z, top, bottom], …] for the right half and the axis (x >= 0), T = triangles as indices into V; mirrored to the left. Rim points have top = bottom, so the solid closes
  const nappe = (V, T) => { const P = [], UV = [], put = (v, sx, y) => { P.push(v[0] * sx, y, v[1]); UV.push(v[0] * sx / 8, v[1] / 8); };
    for (const sx of [1, -1]) for (const t of T) for (const lvl of [2, 3]) for (const i of t) put(V[i], sx, V[i][lvl]);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.computeVertexNormals(); return g; };
  // gear(x, z, top, d, offs, zs, door): one landing-gear leg under the point (x, z), `top` = height of the belly there, wheels of diameter d at the lateral offsets `offs` on one axle per entry of `zs` (two = a bogie);
  // door = side (-1 / 1) of its open door, 0 for none. A wheel is four slabs crossed round the axle (an octagon seen from the side, where the camera is) with a rim that stands proud of the tyre
  const gear = (x, z, top, d, offs = [0], zs = [0], door = 1, w = d * 0.36) => { const leg = top - d / 2, out = Math.max(...offs.map(Math.abs)), zl = Math.max(...zs.map(Math.abs));
    return [['steel', 0.2, leg, 0.2, x, d / 2 + leg / 2, z], ['gray', 0.38, leg * 0.5, 0.38, x, top - leg * 0.25, z], ['gray', 0.14, leg * 0.9, 0.14, x, d / 2 + leg * 0.5, z - leg * 0.3, [-0.6, 0, 0]],
      ...(zl ? [['gray', 0.26, 0.26, 2 * zl + 0.3, x, d / 2, z]] : []),
      ...zs.flatMap(dz => [['steel', 2 * out + 0.2, 0.16, 0.16, x, d / 2, z + dz], ...offs.flatMap(o => A8.flatMap(a => [['tire', w, d, d * 0.4142, x + o, d / 2, z + dz, [a, 0, 0]], ['wheelPart', w + 0.08, d * 0.52, d * 0.2154, x + o, d / 2, z + dz, [a, 0, 0]]]))]),
      ...(door ? [['stealth', 0.08, leg * 0.6, d * 1.3 + 2 * zl, x + door * (out + w / 2 + 0.35), top - leg * 0.28, z, [0, 0, door * 0.18]]] : [])]; };
  Object.assign(SHAPES, {
    // "the needle", 33 m long, 17 m span: chines running from the nose into a delta wing, a fuselage that thins toward the nose, two big nacelles in the wing with their inlet cones and burner rings, two fins canted inward
    sr71NappeArea51: () => nappe([[0, 18, 2.6, 2.6], [1.6, 8, 2.6, 2.6], [2.2, 0, 2.6, 2.6], [8.4, -9.5, 2.6, 2.6], [7.6, -12.5, 2.6, 2.6], [2, -13.5, 2.6, 2.6], [0, -15, 2.6, 2.6], [0, 8, 3.2, 2.2], [0, -4, 3.4, 2.2], [0, -12, 3, 2.2]],
      [[0, 1, 7], [1, 2, 7], [2, 8, 7], [2, 3, 8], [3, 4, 8], [4, 5, 8], [5, 9, 8], [5, 6, 9]]),
    sr71Area51: () => [...tube('stealth', 1.9, 20, 0, 2.9, -4), ...tube('stealth', 1.6, 8, 0, 2.9, 9), ...tube('stealth', 1.1, 5, 0, 2.85, 15), ['stealth', 0.5, 0.5, 3.4, 0, 2.8, 18, [0, 0, 0.7854]], ...tube('stealth', 1.2, 2.4, 0, 2.9, -14.6),
      ['glass', 0.9, 0.5, 2.2, 0, 3.72, 11.2], ['glass', 0.9, 0.45, 1.3, 0, 3.7, 9],
      ...pair(sd => [...tube('stealth', 2, 10, sd * 4.6, 2.8, -5), ...tube('gray', 2.15, 0.4, sd * 4.6, 2.8, 0), ...tube('gray', 0.8, 2.6, sd * 4.6, 2.8, 1.2), ['gray', 0.36, 0.36, 1.2, sd * 4.6, 2.8, 2.7, [0, 0, 0.7854]],
        ...tube('gray', 2.1, 0.5, sd * 4.6, 2.8, -9.8), ...tube('dark', 1.7, 1, sd * 4.6, 2.8, -10.4), ['stealth', 0.22, 2.9, 2.8, sd * 4.4, 5, -8, [-0.32, 0, sd * 0.26]],
        ...gear(sd * 3, -4, 2.3, 1, [-0.42, 0, 0.42], [0], -sd, 0.3)]).flat(), ...gear(0, 8.5, 2.3, 0.8, [-0.24, 0.24], [0], 1, 0.26)],
    // "the wing", 52 m span, 21 m long: no fuselage, no tail, a saw-tooth trailing edge; under it two four-wheel bogies with their big doors and a twin nose wheel
    b2NappeArea51: () => nappe([[0, 10.5, 3.4, 3.4], [26, -4, 3.4, 3.4], [24, -7, 3.4, 3.4], [17, -2.5, 3.4, 3.4], [9, -9, 3.4, 3.4], [4.5, -6, 3.4, 3.4], [0, -10.5, 3.4, 3.4], [0, 4, 5.6, 2.6], [0, -4, 5, 2.8], [8, -1, 4.4, 3]],
      [[0, 9, 7], [0, 1, 9], [1, 2, 3], [1, 3, 9], [9, 3, 4], [9, 4, 5], [9, 5, 8], [8, 5, 6], [7, 9, 8]]),
    b2Area51: () => [['stealth', 5, 1.4, 7, 0, 5.4, 3], ['stealth', 3.6, 1, 3, 0, 5.2, -1.6, [0.12, 0, 0]], ['glass', 3.4, 0.7, 0.5, 0, 5.7, 6.5], ...pair(sd => ['glass', 0.5, 0.6, 1.4, sd * 2.3, 5.6, 5.6, [0, sd * 0.5, 0]]),
      ...pair(sd => [['stealth', 4, 1.2, 8, sd * 6.5, 4.6, -1], ['dark', 3.4, 0.8, 0.6, sd * 6.5, 4.8, 3.2], ['dark', 3, 0.7, 0.6, sd * 6.5, 4.4, -5.1], ['dark', 3, 0.12, 3, sd * 6.5, 3.95, -6.6, [0.1, 0, 0]],
        ...gear(sd * 5, -3, 2.95, 1.2, [-0.46, 0.46], [-0.78, 0.78], 0, 0.4), ['stealth', 0.1, 1.9, 4, sd * 6.5, 2.15, -3, [0, 0, sd * 0.25]], ['stealth', 0.1, 1.2, 3, sd * 3.9, 2.45, -3, [0, 0, -sd * 0.2]]]).flat(),
      ...gear(0, 6, 2.9, 1, [-0.3, 0.3], [0], 0, 0.32), ['stealth', 2, 1.5, 0.1, 0, 2.2, 7.3, [0.2, 0, 0]]],
    // "the arrowhead", 20 m long, 13 m span: a faceted pyramid of a fuselage, swept wings, a V tail, two flat exhaust slots; a tall single-wheel tricycle gear
    f117NappeArea51: () => nappe([[0, 10.5, 2.6, 2.6], [6.6, -6.5, 2.6, 2.6], [5.6, -8, 2.6, 2.6], [3, -4.5, 2.6, 2.6], [0, -9, 2.6, 2.6], [0, 3, 4.8, 2.2], [0, -3, 4.1, 2.2]],
      [[0, 1, 5], [5, 1, 6], [1, 2, 3], [1, 3, 6], [3, 4, 6]]),
    f117Area51: () => [['glass', 1.3, 0.7, 2.6, 0, 4.3, 4.6, [-0.2, 0, 0]], ['stealth', 0.12, 0.12, 1.6, 0, 2.6, 11, [0, 0, 0.7854]], ...pair(sd => [['stealth', 0.3, 3.2, 3.4, sd * 1.7, 4.7, -7.4, [0, 0, -sd * 0.6]], ['dark', 1.6, 0.5, 0.5, sd * 1.5, 3.5, 3.4],
      ['dark', 1.9, 0.16, 0.5, sd * 1.5, 2.95, -6.3], ...gear(sd * 2.4, -3, 2.35, 1, [0], [0], sd)]).flat(), ...gear(0, 6, 2.35, 0.8, [0], [0], 1)],
  });
})();
