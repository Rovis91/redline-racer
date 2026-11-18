// Debug: ?hitbox shows in transparent red the collision limits of sim.js (road walls, plaza circle and piers, central reservation, solid boxes of M.obst). Keep aligned with the "walls" section of sim.js.
// Does not show: bumpable objects nor car-to-car impacts.
export function watch(THREE, T, scene) {
  const { S, n } = T, P = T.mapDef.place, pos = [], lineSegs = [], intoWall = (ax, ay, az, bx, by, bz, h) => (lineSegs.push(ax, ay + h, az, bx, by + h, bz, ax, ay, az, bx, by, bz), pos.push(ax, ay, az, bx, by, bz, bx, by + h, bz, ax, ay, az, bx, by + h, bz, ax, ay + h, az));
  const inner = (x, z) => !!P && Math.hypot(x - P.c[0], z - P.c[1]) < P.r - 1.1; // sim.js: the road has no wall inside the plaza
  for (let i = 0; i < n; i++) { const a = S[i], b = S[(i + 1) % n];
    for (const sd of [-1, 1]) { const A = [a.x - a.tz * sd * (a.w - 1.1), a.z + a.tx * sd * (a.w - 1.1)], B = [b.x - b.tz * sd * (b.w - 1.1), b.z + b.tx * sd * (b.w - 1.1)];
      if (!(inner(...A) && inner(...B))) intoWall(A[0], a.y, A[1], B[0], b.y, B[1], 3); } }
  if (P) {
    let k0 = 0, d0 = 1e9; for (let i = 0; i < n; i++) { const d = Math.hypot(S[i].x - P.c[0], S[i].z - P.c[1]); if (d < d0) { d0 = d; k0 = i; } }
    const y = S[k0].y, R = P.r - 1.1, f = j => [P.c[0] + Math.cos(j * Math.PI / 48) * R, P.c[1] + Math.sin(j * Math.PI / 48) * R];
    const gap = (x, z) => { let m = 1e9; for (let i = 0; i < n; i++) m = Math.min(m, Math.hypot(S[i].x - x, S[i].z - z) - S[i].w + 1.1); return m; }; // gap to the road (sim.js: P.gap), as the crow flies: enough for a display
    for (let j = 0; j < 96; j++) { const p = f(j), q = f(j + 1); if (gap((p[0] + q[0]) / 2, (p[1] + q[1]) / 2) > (P.gap || 0)) intoWall(p[0], y, p[1], q[0], y, q[1], 3); }
    const cs = Math.cos(P.a), sn = Math.sin(P.a);
    for (const [px, pz, hx, hz] of P.piers || []) { const C = [[-hx, -hz], [hx, -hz], [hx, hz], [-hx, hz]].map(([u, v]) => { const lx = px + u, lz = pz + v; return [P.c[0] + lx * cs + lz * sn, P.c[1] - lx * sn + lz * cs]; });
      for (let k = 0; k < 4; k++) { const p = C[k], q = C[(k + 1) % 4]; intoWall(p[0], y, p[1], q[0], y, q[1], 19); } }
    if (P.island) for (let j = 0; j < 96; j++) { const a = j * Math.PI / 48, b = (j + 1) * Math.PI / 48, r = P.island[0]; intoWall(P.c[0] + Math.cos(a) * r, y, P.c[1] + Math.sin(a) * r, P.c[0] + Math.cos(b) * r, y, P.c[1] + Math.sin(b) * r, 3); }
  }
  // the solid boxes of the map (M.obst of sim.js), each at the altitude of the nearest sample that counts it
  for (const [x, z, hx, hz, ry = 0, oy] of T.mapDef.obst || []) { let y = oy; if (y == null) { let m = 1e9; for (const s of S) { const d = (s.x - x) ** 2 + (s.z - z) ** 2; if (d < m) { m = d; y = s.y; } } }
    const c = Math.cos(ry), sn = Math.sin(ry), C = [[-hx, -hz], [hx, -hz], [hx, hz], [-hx, hz]].map(([u, v]) => [x + u * c + v * sn, z - u * sn + v * c]);
    for (let k = 0; k < 4; k++) { const p = C[k], q = C[(k + 1) % 4]; intoWall(p[0], y, p[1], q[0], y, q[1], 2); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xff1030, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthTest: false, depthWrite: false, fog: false }));
  m.frustumCulled = false; m.renderOrder = 999; scene.add(m);
  const gl = new THREE.BufferGeometry(); gl.setAttribute('position', new THREE.Float32BufferAttribute(lineSegs, 3)); // yellow edges: the hitbox reads on every background
  const l = new THREE.LineSegments(gl, new THREE.LineBasicMaterial({ color: 0xffee00, depthTest: false, fog: false })); l.frustumCulled = false; l.renderOrder = 1000; scene.add(l); return m;
}
