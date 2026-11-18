// Shapes specific to "lune", family "rock and relief": completes the shapes.js catalogue. Metres, origin at the foot, Y up. Simple shapes only, faceted (flat shading), with UVs in tiles of 8 m.
// See docs/proposals/lunar-outpost/AMBIANCE-V2.html: faceted boulders in three sizes, angular, hard shadows; far relief as low rounded massifs, sharp at any distance. No detailed stones, nothing on the driving surface.
(function () {
  const noise = (i, s = 0) => { const v = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return v - Math.floor(v); }; // fixed pseudo-random per index: no call to the shared rnd
  // a faceted geometry from quads [a, b, c, d] (corners in order, each [x, y, z, u, v]); flat normals
  const quads = Q => { const P = [], UV = []; for (const [a, b, c, d] of Q) for (const p of [a, b, c, a, c, d]) { P.push(p[0], p[1], p[2]); UV.push(p[3], p[4]); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.computeVertexNormals(); return g; };
  Object.assign(SHAPES, {
    // a solid of revolution with n flat sides: rings = [[y, radius x, radius z], …] from bottom to top; cap = closes the top (2: the bottom too, for a shape whose first ring is seen: a lying cylinder); jit = share of radius moved per vertex (rock); seed = which rock.
    // Also the dome, the tanks, the cylinders and the dishes of the colony (shapes-lune-base.js). Faces are seen from outside; give the material DoubleSide to see the inside of an open shell
    ringsLune: (n, rings, cap = false, jit = 0, seed = 0) => { const pt = (r, k) => { const [y, rx, rz = rx] = rings[r], a = (k % n) / n * 6.2832, j = 1 + jit * (noise(k % n, seed + r) - 0.5) * 2;
        return [Math.cos(a) * rx * j, y, Math.sin(a) * rz * j, k / n * Math.max(1, Math.round(Math.max(rings[0][1], rings[0][2] ?? 0) * 6.2832 / 8)), y / 8]; }, Q = [];
      for (let r = 0; r < rings.length - 1; r++) for (let k = 0; k < n; k++) Q.push([pt(r, k), pt(r + 1, k), pt(r + 1, k + 1), pt(r, k + 1)]);
      if (cap) { const r = rings.length - 1, y = rings[r][0]; for (let k = 0; k < n; k++) { const a = pt(r, k), b = pt(r, k + 1); Q.push([[0, y, 0, 0, 0], [b[0], y, b[2], b[0] / 8, b[2] / 8], [a[0], y, a[2], a[0] / 8, a[2] / 8], [0, y, 0, 0, 0]]); } }
      if (cap > 1) { const y = rings[0][0]; for (let k = 0; k < n; k++) { const a = pt(0, k), b = pt(0, k + 1); Q.push([[0, y, 0, 0, 0], [a[0], y, a[2], a[0] / 8, a[2] / 8], [b[0], y, b[2], b[0] / 8, b[2] / 8], [0, y, 0, 0, 0]]); } }
      return quads(Q); },
    // boulder, w × h × d: one broken block, 7 sides, strongly irregular, its foot buried
    rocherLune: (w, ht, d, seed = 0) => SHAPES.ringsLune(7, [[-2, w * 0.6, d * 0.6], [ht * 0.5, w * 0.52, d * 0.5], [ht, w * 0.3, d * 0.34]], true, 0.24, seed),
    // rocky flank beside the ridge road, w × h × d: a scree foot, a steep face in two steps, a narrow broken top; 9 sides
    flancLune: (w, ht, d, seed = 0) => SHAPES.ringsLune(9, [[-3, w * 0.7, d * 0.62], [ht * 0.3, w * 0.56, d * 0.52], [ht * 0.62, w * 0.5, d * 0.46], [ht * 0.7, w * 0.36, d * 0.38], [ht, w * 0.2, d * 0.26]], true, 0.18, seed),
    // rock terrace on a crater wall, w × h × d: a wide low ledge with a flat top, 8 sides
    terrasseLune: (w, ht, d, seed = 0) => SHAPES.ringsLune(8, [[-6, w * 0.6, d * 0.6], [ht * 0.8, w * 0.52, d * 0.52], [ht, w * 0.46, d * 0.46]], true, 0.12, seed),
    // far ridge, L m long along X, crests up to H, D deep: a rounded massif line with a front and a back slope, one summit every 150 to 250 m, falling to the ground at both ends. A silhouette for the horizon: no detail
    criteLune: (L, H, D, seed = 0) => { const n = Math.max(6, Math.round(L / 110)), X = k => -L / 2 + L * k / n, Y = k => k === 0 || k === n ? -8 : (k === 1 || k === n - 1 ? 0.4 : 1) * H * (0.45 + 0.55 * (0.5 + 0.5 * Math.sin(k * 1.3 + seed)) * (0.7 + 0.3 * noise(k, seed))), Z = k => D * 0.25 * (noise(k, seed + 9) - 0.5), Q = [];
      for (let k = 0; k < n; k++) for (const sd of [1, -1]) { const a = [X(k), -8, sd * D / 2, X(k) / 16, 0], b = [X(k + 1), -8, sd * D / 2, X(k + 1) / 16, 0], c = [X(k + 1), Y(k + 1), Z(k + 1), X(k + 1) / 16, Y(k + 1) / 16], e = [X(k), Y(k), Z(k), X(k) / 16, Y(k) / 16];
        Q.push(sd > 0 ? [b, a, e, c] : [a, b, c, e]); }
      return quads(Q); },
  });
})();
