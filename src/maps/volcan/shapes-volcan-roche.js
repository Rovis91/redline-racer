// Shapes specific to "volcan", family "rock and relief": completes the shapes.js catalogue. Metres, origin at the foot, Y up. Faceted (flat shading), UVs in tiles of 8 m.
// Simple shapes return a geometry; assemblies return boxes [zone, w, h, d, x, y, z, rotation] whose zones are keys of the map's shared materials (MAT in scenery-volcan.js): rock, cliff.
// Assemblies: X along the road, front toward -Z (the road), +Z away from it. See docs/proposals/volcanic-island/AMBIANCE-V2.html, zones 3 and 4: charcoal basalt in large planes, red-brown scoria. Not rounded boulders, not glowing rock.
(function () {
  const noise = (i, s = 0) => { const v = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return v - Math.floor(v); }; // fixed pseudo-random per index: no call to the shared rnd
  // a faceted geometry from quads [a, b, c, d] (corners in order, each [x, y, z, u, v]); flat normals
  const quads = Q => { const P = [], UV = []; for (const [a, b, c, d] of Q) for (const p of [a, b, c, a, c, d]) { P.push(p[0], p[1], p[2]); UV.push(p[3], p[4]); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.computeVertexNormals(); return g; };
  Object.assign(SHAPES, {
    // a solid of revolution with n flat sides: rings = [[y, radius x, radius z], …] from bottom to top; cap = closes the top; jit = share of the radius moved per vertex (rock); seed = which rock.
    // Faces are seen from outside (rings going up); a ring that comes back down inside the previous one makes a crater
    ringsVolcan: (n, rings, cap = false, jit = 0, seed = 0) => { const pt = (r, k) => { const [y, rx, rz = rx] = rings[r], a = (k % n) / n * 6.2832, j = 1 + jit * (noise(k % n, seed + r) - 0.5) * 2;
        return [Math.cos(a) * rx * j, y, -Math.sin(a) * rz * j, k / n * Math.max(1, Math.round(rings[0][1] * 6.2832 / 8)), y / 8]; }, Q = [];
      for (let r = 0; r < rings.length - 1; r++) for (let k = 0; k < n; k++) Q.push([pt(r, k), pt(r, k + 1), pt(r + 1, k + 1), pt(r + 1, k)]);
      if (cap) { const r = rings.length - 1, y = rings[r][0]; for (let k = 0; k < n; k++) { const a = pt(r, k), b = pt(r, k + 1); Q.push([[0, y, 0, 0, 0], [a[0], y, a[2], a[0] / 8, a[2] / 8], [b[0], y, b[2], b[0] / 8, b[2] / 8], [0, y, 0, 0, 0]]); } }
      return quads(Q); },
    // plain tapered cylinder, r0 at the foot, r1 at the top, ht high, n sides, closed on top: lighthouse, cistern, mast, post
    cylVolcan: (r0 = 1, r1 = 1, ht = 1, n = 10) => SHAPES.ringsVolcan(n, [[0, r0], [ht, r1]], true),
    // the black needle of La Couronne, ht high, r at the foot: a pointed spire of basalt, 7 sides, off-centre shoulders, a scree skirt
    aiguilleVolcan: (ht = 105, r = 24, seed = 3) => SHAPES.ringsVolcan(7, [[-6, r * 1.25], [ht * 0.1, r], [ht * 0.32, r * 0.72], [ht * 0.58, r * 0.5], [ht * 0.8, r * 0.3], [ht * 0.94, r * 0.14], [ht, r * 0.04]], true, 0.2, seed),
    // rock outcrop or fallen block, w × ht × d: one broken block, 7 sides, strongly irregular; its foot goes 0.6 × w into the ground, so that it holds on a slope
    rocherVolcan: (w = 10, ht = 6, d = 10, seed = 0) => SHAPES.ringsVolcan(7, [[-Math.max(4, w * 0.6), w * 0.66, d * 0.66], [ht * 0.55, w * 0.5, d * 0.5], [ht, w * 0.3, d * 0.34]], true, 0.22, seed),
    // sea stack, r at the waterline, ht above it: steep sides, a broken top; goes down 12 m under the origin (the seabed)
    ilotVolcan: (r = 17, ht = 55, seed = 0) => SHAPES.ringsVolcan(7, [[-12, r * 1.3], [2, r], [ht * 0.5, r * 0.72], [ht * 0.85, r * 0.45], [ht, r * 0.2]], true, 0.2, seed),
    // scoria cone, r at the foot, ht high, with its small crater: 9 sides, slightly irregular
    coneVolcan: (r = 17, ht = 24, seed = 0) => SHAPES.ringsVolcan(9, [[-r * 0.7, r * 1.5], [ht * 0.55, r * 0.55], [ht, r * 0.3], [ht * 0.82, r * 0.14]], true, 0.12, seed),
    // flat slab with an irregular edge, r in radius, ht thick: plate of crust, patch of cooled lava, slag field
    dalleVolcan: (r = 10, ht = 1, seed = 0, n = 9) => SHAPES.ringsVolcan(n, [[-r * 0.3, r * 1.04], [ht, r]], true, 0.18, seed),
    // column of steam, ht high: narrow at the vent, wider above, open (give a translucent double-sided material); static
    vapeurVolcan: (ht = 26, r = 1.2) => SHAPES.ringsVolcan(6, [[0, r], [ht * 0.4, r * 2.4], [ht, r * 4.5]], false, 0.25, 1),
    // far island on the horizon, R in radius at the waterline, H high: a closed faceted mass with a broad base, two shoulders and a broken summit. A silhouette: no detail
    ileVolcan: (R = 600, H = 220, seed = 0) => SHAPES.ringsVolcan(9, [[-10, R, R * 0.6], [H * 0.25, R * 0.78, R * 0.46], [H * 0.6, R * 0.45, R * 0.27], [H * 0.9, R * 0.2, R * 0.12], [H, R * 0.06, R * 0.04]], true, 0.18, seed),
    // basalt organ pipes against a wall, L long, columns up to ht: prisms 1.6 m wide of uneven height, set on two ranks; the higher rank is behind (+Z)
    orguesVolcan: (L = 30, ht = 12) => { const n = Math.round(L / 1.7), B = [['rock', L, ht * 0.45, 3, 0, ht * 0.2, 2.2]];
      for (let k = 0; k < n; k++) { const x = -L / 2 + 0.85 + k * 1.7, h1 = ht * (0.35 + 0.4 * noise(k, 1)), h2 = ht * (0.65 + 0.35 * noise(k, 2)); B.push([k % 3 ? 'rock' : 'cliff', 1.6, h1 + 3, 1.6, x, h1 / 2 - 1.5, 0], [k % 4 ? 'cliff' : 'rock', 1.6, h2 + 3, 1.6, x + 0.4, h2 / 2 - 1.5, 1.5]); }
      return B; },
  });
})();
