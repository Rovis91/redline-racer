// Shapes specific to "egee", family "rock and relief": completes the shapes.js catalogue. Metres, origin at the foot, Y up. Simple shapes only (three geometries), faceted (flat shading), with UVs in tiles of 8 m.
// See docs/proposals/aegean-cliffs/AMBIANCE-V2.html: warm fractured rock in big faceted planes, horizontal strata; capes and far islands as silhouettes. Not grey northern rock, not a smooth dune.
(function () {
  const noise = (i, s = 0) => { const v = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return v - Math.floor(v); }; // fixed pseudo-random per index: no call to the shared rnd
  // a faceted geometry from quads [a, b, c, d] (corners in order, each [x, y, z, u, v]); flat normals
  const quads = Q => { const P = [], UV = []; for (const [a, b, c, d] of Q) for (const p of [a, b, c, a, c, d]) { P.push(p[0], p[1], p[2]); UV.push(p[3], p[4]); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.computeVertexNormals(); return g; };
  Object.assign(SHAPES, {
    // a solid of revolution with n flat sides: rings = [[y, radius x, radius z], …] from bottom to top; cap = closes the top; jit = share of radius moved per vertex (rock); seed = which rock.
    // Also the towers and domes of shapes-egee-bati.js (jit 0). Faces are seen from outside
    ringsEgee: (n, rings, cap = false, jit = 0, seed = 0) => { const pt = (r, k) => { const [y, rx, rz] = rings[r], a = (k % n) / n * 6.2832, j = 1 + jit * (noise(k % n, seed + r) - 0.5) * 2;
        return [Math.cos(a) * rx * j, y, Math.sin(a) * rz * j, k / n * Math.max(1, Math.round(Math.max(rings[0][1], rings[0][2]) * 6.2832 / 8)), y / 8]; }, Q = [];
      for (let r = 0; r < rings.length - 1; r++) for (let k = 0; k < n; k++) Q.push([pt(r, k), pt(r + 1, k), pt(r + 1, k + 1), pt(r, k + 1)]);
      if (cap) { const r = rings.length - 1, y = rings[r][0]; for (let k = 0; k < n; k++) { const a = pt(r, k), b = pt(r, k + 1); Q.push([[0, y, 0, 0, 0], [b[0], y, b[2], b[0] / 8, b[2] / 8], [a[0], y, a[2], a[0] / 8, a[2] / 8], [0, y, 0, 0, 0]]); } }
      return quads(Q); },
    // rock outcrop, w × h × d: one broken block, 7 sides, strongly irregular, its foot as deep in the ground as it is wide (on a slope its underside must never show)
    rocherEgee: (w, ht, d, seed = 0) => SHAPES.ringsEgee(7, [[-Math.max(w, d) * 0.7, w * 0.66, d * 0.66], [0, w * 0.6, d * 0.6], [ht * 0.4, w * 0.52, d * 0.52], [ht * 0.82, w * 0.34, d * 0.38], [ht, w * 0.1, d * 0.13]], true, 0.24, seed),
    // far island, w × h × d: a long low back with one summit off-centre, 9 sides. A silhouette for the horizon: no detail
    ileEgee: (w, ht, d, seed = 0) => { const g = SHAPES.ringsEgee(9, [[-4, w * 0.5, d * 0.5], [ht * 0.3, w * 0.36, d * 0.36], [ht * 0.7, w * 0.16, d * 0.18], [ht, w * 0.05, d * 0.06]], true, 0.2, seed), p = g.attributes.position;
      for (let i = 0; i < p.count; i++) p.setX(i, p.getX(i) + w * 0.18 * Math.max(0, p.getY(i)) / ht); g.computeVertexNormals(); return g; },
  });
})();
