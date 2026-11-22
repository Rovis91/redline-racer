// Shapes specific to "piliers", family "rock": completes the shapes.js catalogue. Metres, Y up. Simple shapes only (three geometries), faceted (flat shading), with UVs in tiles of 16 m (u round the rock, v = altitude).
// See docs/proposals/sky-pillars/AMBIANCE-V2.html, "Rock": this sandstone is stacked. Horizontal beds, vertical joints that cut the towers into square-edged columns, ledges, a wider foot. Not a smooth slope, not a cone.
(function () {
  const noise = (i, s = 0) => { const v = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return v - Math.floor(v); }; // fixed pseudo-random per index: no call to the shared rnd
  // a faceted geometry from triangles of corners [x, y, z, u, v, colour]: the colour (white when absent) is read by the materials that ask for vertex colours, the rock
  const mesh = Tr => { const P = [], UV = [], C = []; for (const p of Tr) { P.push(p[0], p[1], p[2]); UV.push(p[3], p[4]); C.push(...(p[5] || [1, 1, 1])); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.computeVertexNormals(); return g; };
  // the outline of a footprint [[east, north], …] in world axes (z = -north), cut into sides of at most `fine` metres: [x, z, outward normal x, outward normal z, metres along the outline]
  const outline = (poly, fine) => { const V = []; let A = 0, L = 0; poly.forEach(([x, n], i) => { const [bx, bn] = poly[(i + 1) % poly.length], k = Math.max(1, Math.ceil(Math.hypot(bx - x, bn - n) / fine)); A += x * -bn - bx * -n;
      for (let j = 0; j < k; j++) V.push([x + (bx - x) * j / k, -(n + (bn - n) * j / k)]); });
    const sg = A > 0 ? 1 : -1, nrm = (a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [sg * dz / l, -sg * dx / l]; };
    const O = V.map((p, i) => { const a = V[(i - 1 + V.length) % V.length], b = V[(i + 1) % V.length], n1 = nrm(a, p), n2 = nrm(p, b), l = Math.hypot(n1[0] + n2[0], n1[1] + n2[1]) || 1, nx = (n1[0] + n2[0]) / l, nz = (n1[1] + n2[1]) / l;
      const c = Math.max(0.5, nx * n1[0] + nz * n1[1]), r = [p[0], p[1], nx / c, nz / c, L]; L += Math.hypot(b[0] - p[0], b[1] - p[1]); return r; }); O.per = L; return O; };
  // an irregular oval footprint w × d round the origin, n corners
  const oval = (w, d, n, seed) => Array.from({ length: n }, (_, k) => { const a = k / n * 6.2832, j = 0.8 + 0.4 * noise(k, seed); return [Math.cos(a) * w / 2 * j, Math.sin(a) * d / 2 * j]; });
  // the stack: beds of uneven thickness from y0 to y1 over the footprint; each bed is a vertical band set back from the one below (taper = metres of widening per metre below the top) with a ledge between them, the whole standing a little outside the footprint except the top bed,
  // and its corners move in and out by `jit` metres, the same way over four beds: that is what draws the columns (neighbouring corners share their offset: flat column faces with a step between them). cap: 1 = closed by a flat rock top; bottom: 1 = closed underneath (a mass over a void)
  const stack = (poly, y0, y1, seed = 0, taper = 0.125, bed = 6, cap = 0, jit = 2.2, bottom = 0, fine = 10) => { const V = outline(poly, fine), n = V.length, Y = [y0], Tr = [], U = Math.max(1, Math.round(V.per / 16)), ku = U / V.per, T = 16; // rock is read from far: 16 m per tile, beds 1 to 3 m
    for (let b = 0; Y[b] < y1 - bed * 0.5; b++) Y.push(Math.min(y1, Y[b] + bed * (0.55 + 0.9 * noise(b, seed + 3)))); Y[Y.length - 1] = y1;
    // blocks: the beds are grouped into blocks 22 to 56 m high. A block is a vertical face; the taper is taken all at once at its foot, as a shoulder several metres wide where trees hold
    const nb = Y.length - 1, base = [], grp = []; for (let b = 0, g0 = y0, gi = 0; b < nb; b++) { if (Y[b] - g0 > 22 + 34 * noise(gi, seed + 13)) { g0 = Y[b]; gi++; } base[b] = g0; grp[b] = gi; }
    const ring = b => { const top = b === nb - 1, off = (y1 - base[b]) * taper + (top ? 0 : jit * 1.1 + 0.9 * noise(b, seed + 7));
      return V.map(([x, z, nx, nz, l], j) => { const o = off + (top ? 0 : jit * (noise((j + grp[b]) >> 1, seed + grp[b] * 5) - 0.5) * 2); return [x + nx * o, z + nz * o, l * ku, o]; }); };
    // colour per face, multiplied with the texture: each column of each block between weathered grey and fresh ochre, each bed a little off its neighbours; the ledges mossy. No two towers, and no two blocks, show the same tile
    const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t), tint = (j, b) => noise((j + grp[b] * 3) >> 1, seed + b * 0.37 + 70) > 0.8 ? GROWN : mix([0.7, 0.78, 0.74], [0.98, 0.93, 0.8], Math.min(1, 0.5 * noise((j + grp[b]) >> 1, seed + grp[b] * 9 + 40) + 0.4 * noise(b, seed + 50 + (j >> 2)))), MOSS = [0.44, 0.66, 0.38], GROWN = [0.6, 0.76, 0.52]; // GROWN: one face in five is overgrown, a green patch on the rock
    const quad = (a, b, c, d, col) => { for (const p of [a, b, c, a, c, d]) Tr.push([...p, col]); }, ledges = []; let low = null, last; // ledges: [x, y, z, width] of the steps more than 2 m wide, where a pine or a bush can hold
    for (let b = 0; b < nb; b++) { const R = ring(b), du = noise(b, seed + 31); last = R;
      for (let j = 0; j < n; j++) { const p = R[j], q = R[(j + 1) % n], uq = j === n - 1 ? U : q[2];
        quad([p[0], Y[b], p[1], p[2] + du, Y[b] / T], [q[0], Y[b], q[1], uq + du, Y[b] / T], [q[0], Y[b + 1], q[1], uq + du, Y[b + 1] / T], [p[0], Y[b + 1], p[1], p[2] + du, Y[b + 1] / T], tint(j, b));
        if (low && low[j][3] - p[3] > 2) ledges.push([(low[j][0] + p[0]) / 2, Y[b], (low[j][1] + p[1]) / 2, low[j][3] - p[3]]);
        if (low) { const lp = low[j], lq = low[(j + 1) % n], ul = uq; quad([lp[0], Y[b], lp[1], lp[2], (Y[b] + lp[3]) / T], [lq[0], Y[b], lq[1], ul, (Y[b] + lq[3]) / T], [q[0], Y[b], q[1], uq, (Y[b] + q[3]) / T], [p[0], Y[b], p[1], p[2], (Y[b] + p[3]) / T], MOSS); } }
      low = R; }
    const lid = (R, y) => { for (const [a, b, c] of THREE.ShapeUtils.triangulateShape(R.map(p => new THREE.Vector2(p[0], p[1])), [])) Tr.push(...[a, b, c].map(k => [R[k][0], y, R[k][1], R[k][0] / 8, R[k][1] / 8, MOSS])); };
    if (cap) lid(last, y1); if (bottom) lid(ring(0), y0);
    const G = mesh(Tr); G.userData.ledges = ledges; return G; };
  Object.assign(SHAPES, {
    // a rock tower over a footprint given in plan coordinates [[east, north], …], from altitude y0 to its summit y1: place it at the origin. The crown (couronnePiliers) closes it
    stackPiliers: (poly, y0, y1, seed, taper, bed, cap, jit, bottom) => stack(poly, y0, y1, seed, taper, bed, cap, jit, bottom),
    // the wooded crown of a tower: a low faceted dome over its footprint at altitude y (foliage)
    couronnePiliers: (poly, y, seed = 0, dome = 5) => { const V = outline(poly, 14), n = V.length, cx = V.reduce((a, p) => a + p[0], 0) / n, cz = V.reduce((a, p) => a + p[1], 0) / n, Tr = [];
      V.forEach((p, j) => { const q = V[(j + 1) % n], e = k => 1 + 1.5 * noise(k, seed); // overhangs the rock a little, like the trees it stands for
        const a = [p[0] + p[2] * e(j), y - 1.5, p[1] + p[3] * e(j)], b = [q[0] + q[2] * e((j + 1) % n), y - 1.5, q[1] + q[3] * e((j + 1) % n)], ma = [(a[0] + cx) / 2, y + dome * (0.6 + 0.6 * noise(j, seed + 1)), (a[2] + cz) / 2], mb = [(b[0] + cx) / 2, y + dome * (0.6 + 0.6 * noise((j + 1) % n, seed + 1)), (b[2] + cz) / 2], c = [cx, y + dome, cz];
        for (const t of [[a, b, mb], [a, mb, ma], [ma, mb, c]]) Tr.push(...t.map(v => [v[0], v[1], v[2], v[0] / 4, v[2] / 4])); });
      return mesh(Tr); },
    // a needle standing alone, w × d at the summit, ht high, origin at the centre of its base: thinner taper than a tower, beds 9 m thick, closed by a rock top
    aiguillePiliers: (w = 40, d = 40, ht = 250, seed = 0, taper = 0.07) => stack(oval(w, d, 8, seed), 0, ht, seed, taper, 9, 1, 2.5, 0, 16),
    // a far needle (one of the silhouettes of aiguillePiliers, 40 × 40 × 250): the same rock with the UVs of a painted pillar, u = twice round the needle, v = foot to summit (texture lointainPiliers)
    // its beds are 27 m and its corners 32 m apart (near: 9 and 16): at 0.75 to 2.8 km a 9 m bed is two pixels, and the painted texture draws the strata; 3 times fewer triangles over about 400 needles, same top outline
    aiguilleLointainePiliers: (seed = 0) => { const G = stack(oval(40, 40, 8, seed), 0, 250, seed, 0.07, 27, 1, 2.5, 0, 32), P = G.attributes.position, U = G.attributes.uv;
      for (let k = 0; k < P.count; k += 3) { const a = [0, 1, 2].map(i => Math.atan2(P.getZ(k + i), P.getX(k + i))); // per triangle, so that no face runs backwards across the seam
        for (let i = 0; i < 3; i++) { const d = a[i] - a[0]; U.setXY(k + i, (a[i] - (d > Math.PI ? 6.2832 : d < -Math.PI ? -6.2832 : 0)) / Math.PI, 0.005 + 0.99 * P.getY(k + i) / 250); } }
      return G; },
    // the footprint of a needle's summit, for its crown: same outline as aiguillePiliers
    aiguilleCouronnePiliers: (w = 40, d = 40, ht = 250, seed = 0) => SHAPES.couronnePiliers(oval(w, d, 8, seed), ht, seed, Math.min(w, d) / 10),
    // a boulder w × ht × d, origin at its foot (1.5 m buried): two thick beds, strongly broken corners
    rocherPiliers: (w = 6, ht = 4, d = 6, seed = 0) => stack(oval(w * 0.7, d * 0.7, 7, seed), -1.5, ht, seed, 0.3 * Math.min(w, d) / (ht + 1.5), ht / 2, 1, 0.5, 0, 99),
  });
})();
