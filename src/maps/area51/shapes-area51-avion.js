// Shapes specific to "area51", family "aircraft": completes the shapes.js catalogue. Metres, origin on the ground under the middle of the airframe, nose toward +Z, Y up.
// Three invented black prototypes whose silhouettes are those of the famous secret aircraft: a long twin-engine needle with chines (the SR-71), a flying wing with a saw-tooth trailing edge (the B-2), a faceted arrowhead with a V tail (the F-117).
// Each is two pieces posed at the same origin: a "nappe" (simple shape: the lifting surface as a thin faceted solid, to be given the stealth material, DoubleSide) and an assembly of boxes (fuselage, engines, fins, canopy, gear).
// See docs/proposals/area51/AMBIANCE-V2.html, zone 1. No scaffolding round them: the silhouette must read from the lane. No markings of a real air force.
(function () {
  const pair = f => [-1, 1].map(f), tube = (z, w, len, x, y, zz) => [0, 0.7854].map(a => [z, w, w, len, x, y, zz, [0, 0, a]]); // tube: two crossed boxes along Z, an octagon in section
  // nappe: V = [[x, z, top, bottom], …] for the right half and the axis (x >= 0), T = triangles as indices into V; mirrored to the left. Rim points have top = bottom, so the solid closes
  const nappe = (V, T) => { const P = [], UV = [], put = (v, sx, y) => { P.push(v[0] * sx, y, v[1]); UV.push(v[0] * sx / 8, v[1] / 8); };
    for (const sx of [1, -1]) for (const t of T) for (const lvl of [2, 3]) for (const i of t) put(V[i], sx, V[i][lvl]);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.computeVertexNormals(); return g; };
  Object.assign(SHAPES, {
    // "the needle", 33 m long, 17 m span: chines running from the nose into a delta wing
    sr71NappeArea51: () => nappe([[0, 18, 2.6, 2.6], [1.6, 8, 2.6, 2.6], [2.2, 0, 2.6, 2.6], [8.4, -9.5, 2.6, 2.6], [7.6, -12.5, 2.6, 2.6], [2, -13.5, 2.6, 2.6], [0, -15, 2.6, 2.6], [0, 8, 3.2, 2.2], [0, -4, 3.4, 2.2], [0, -12, 3, 2.2]],
      [[0, 1, 7], [1, 2, 7], [2, 8, 7], [2, 3, 8], [3, 4, 8], [4, 5, 8], [5, 9, 8], [5, 6, 9]]),
    sr71Area51: () => [...tube('stealth', 1.9, 30, 0, 2.9, 1), ['stealth', 0.7, 0.7, 4, 0, 2.8, 17, [0, 0, 0.7854]], ['glass', 1, 0.6, 2.6, 0, 3.8, 11],
      ...pair(sd => [...tube('stealth', 2.4, 11, sd * 4.6, 2.8, -5), ...tube('gray', 0.9, 2.8, sd * 4.6, 2.8, 1.7), ['dark', 1.8, 1.8, 0.8, sd * 4.6, 2.8, -10.8], ['stealth', 0.3, 3.6, 4.2, sd * 4.4, 5.6, -8, [0, 0, sd * 0.26]],
        ['gray', 0.4, 2.2, 0.4, sd * 3, 1.3, -4], ['dark', 0.6, 1.1, 1.1, sd * 3, 0.55, -4]]).flat(), ['gray', 0.4, 2.2, 0.4, 0, 1.3, 9], ['dark', 0.5, 1, 1, 0, 0.5, 9]],
    // "the wing", 52 m span, 21 m long: no fuselage, no tail, a saw-tooth trailing edge
    b2NappeArea51: () => nappe([[0, 10.5, 3.4, 3.4], [26, -4, 3.4, 3.4], [24, -7, 3.4, 3.4], [17, -2.5, 3.4, 3.4], [9, -9, 3.4, 3.4], [4.5, -6, 3.4, 3.4], [0, -10.5, 3.4, 3.4], [0, 4, 5.6, 2.6], [0, -4, 5, 2.8], [8, -1, 4.4, 3]],
      [[0, 9, 7], [0, 1, 9], [1, 2, 3], [1, 3, 9], [9, 3, 4], [9, 4, 5], [9, 5, 8], [8, 5, 6], [7, 9, 8]]),
    b2Area51: () => [['stealth', 5, 1.4, 7, 0, 5.4, 3], ['glass', 3.4, 0.7, 0.5, 0, 5.7, 6.5], ...pair(sd => [['stealth', 4, 1.2, 8, sd * 6.5, 4.6, -1], ['dark', 3.4, 0.8, 0.6, sd * 6.5, 4.8, 3.2], ['dark', 3, 0.7, 0.6, sd * 6.5, 4.4, -5.1],
      ['gray', 0.5, 2.8, 0.5, sd * 5, 1.5, -3], ['dark', 0.7, 1.2, 1.6, sd * 5, 0.6, -3]]).flat(), ['gray', 0.5, 2.8, 0.5, 0, 1.5, 6], ['dark', 0.6, 1.1, 1.1, 0, 0.55, 6]],
    // "the arrowhead", 20 m long, 13 m span: a faceted pyramid of a fuselage, swept wings, a V tail
    f117NappeArea51: () => nappe([[0, 10.5, 2.6, 2.6], [6.6, -6.5, 2.6, 2.6], [5.6, -8, 2.6, 2.6], [3, -4.5, 2.6, 2.6], [0, -9, 2.6, 2.6], [0, 3, 4.8, 2.2], [0, -3, 4.1, 2.2]],
      [[0, 1, 5], [5, 1, 6], [1, 2, 3], [1, 3, 6], [3, 4, 6]]),
    f117Area51: () => [['glass', 1.3, 0.7, 2.6, 0, 4.3, 4.6, [-0.2, 0, 0]], ...pair(sd => [['stealth', 0.3, 3.2, 3.4, sd * 1.7, 4.7, -7.4, [0, 0, -sd * 0.6]], ['dark', 1.6, 0.5, 0.5, sd * 1.5, 3.5, 3.4],
      ['gray', 0.4, 2.2, 0.4, sd * 2.4, 1.3, -3], ['dark', 0.5, 1, 1, sd * 2.4, 0.5, -3]]).flat(), ['gray', 0.4, 2.2, 0.4, 0, 1.3, 6], ['dark', 0.5, 1, 1, 0, 0.5, 6]],
  });
})();
