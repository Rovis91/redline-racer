// Shapes specific to "area51", family "rock and relief": completes the shapes.js catalogue. Metres, origin at the foot, Y up. Simple shapes only (three geometries), faceted (flat shading), with UVs in tiles of 8 m.
// See docs/proposals/area51/AMBIANCE-V2.html, zone 4: faceted red-ochre rock, mesas with a hard cap, the range in silhouette. Not green hills, not a smooth dune.
(function () {
  const noise = (i, s = 0) => { const v = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return v - Math.floor(v); }; // fixed pseudo-random per index: no call to the shared rnd
  // a faceted geometry from quads [a, b, c, d] (corners in order, each [x, y, z, u, v]); flat normals
  const quads = Q => { const P = [], UV = []; for (const [a, b, c, d] of Q) for (const p of [a, b, c, a, c, d]) { P.push(p[0], p[1], p[2]); UV.push(p[3], p[4]); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.computeVertexNormals(); return g; };
  Object.assign(SHAPES, {
    // a solid of revolution with n flat sides: rings = [[y, radius x, radius z], …] from bottom to top; cap = closes the top; jit = share of radius moved per vertex (rock) ; seed = which rock.
    // Also the base of the dish (shapes-area51-dish.js). Faces are seen from outside; give the material DoubleSide to see the inside of an open shell
    ringsArea51: (n, rings, cap = false, jit = 0, seed = 0) => { const pt = (r, k) => { const [y, rx, rz] = rings[r], a = (k % n) / n * 6.2832, j = 1 + jit * (noise(k % n, seed + r) - 0.5) * 2;
        return [Math.cos(a) * rx * j, y, Math.sin(a) * rz * j, k / n * Math.round(Math.max(rings[0][1], rings[0][2]) * 6.2832 / 8), y / 8]; }, Q = [];
      for (let r = 0; r < rings.length - 1; r++) for (let k = 0; k < n; k++) Q.push([pt(r, k), pt(r + 1, k), pt(r + 1, k + 1), pt(r, k + 1)]);
      if (cap) { const r = rings.length - 1, y = rings[r][0]; for (let k = 0; k < n; k++) { const a = pt(r, k), b = pt(r, k + 1); Q.push([[0, y, 0, 0, 0], [b[0], y, b[2], b[0] / 8, b[2] / 8], [a[0], y, a[2], a[0] / 8, a[2] / 8], [0, y, 0, 0, 0]]); } }
      return quads(Q); },
    // mesa, w × h × d: a scree skirt on the lower third, a near-vertical cliff, a flat hard cap; 10 sides, corners pulled in and out
    mesaArea51: (w, ht, d, seed = 0) => SHAPES.ringsArea51(10, [[-4, w * 0.66, d * 0.66], [ht * 0.34, w * 0.5, d * 0.5], [ht * 0.9, w * 0.44, d * 0.44], [ht, w * 0.41, d * 0.41]], true, 0.14, seed),
    // rock outcrop at a bend, w × h × d: one broken block, 7 sides, strongly irregular
    rocherArea51: (w, ht, d, seed = 0) => SHAPES.ringsArea51(7, [[-2, w * 0.6, d * 0.6], [ht * 0.55, w * 0.5, d * 0.5], [ht, w * 0.3, d * 0.34]], true, 0.22, seed),
    // far range, L m long along X, crests up to H, D deep: a jagged ridge line with a front and a back slope, one peak every 60 to 120 m. A silhouette for the horizon: no detail
    criteArea51: (L, H, D, seed = 0) => { const n = Math.max(6, Math.round(L / 90)), X = k => -L / 2 + L * k / n, Y = k => k === 0 || k === n ? H * 0.25 : H * (0.5 + 0.5 * noise(k, seed)), Z = k => D * 0.3 * (noise(k, seed + 9) - 0.5), Q = [];
      for (let k = 0; k < n; k++) for (const sd of [1, -1]) { const a = [X(k), -6, sd * D / 2, X(k) / 16, 0], b = [X(k + 1), -6, sd * D / 2, X(k + 1) / 16, 0], c = [X(k + 1), Y(k + 1), Z(k + 1), X(k + 1) / 16, Y(k + 1) / 16], e = [X(k), Y(k), Z(k), X(k) / 16, Y(k) / 16];
        Q.push(sd > 0 ? [b, a, e, c] : [a, b, c, e]); }
      return quads(Q); },
  });
})();
