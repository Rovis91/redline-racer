// Débogage : ?hitbox montre en rouge transparent les limites de collision de sim.js (murs de chaussée, cercle et piles de la place, terre-plein). À garder aligné sur la section « murs » de sim.js.
// Ne montre pas : les objets percutables ni les chocs entre voitures.
export function montre(THREE, T, scene) {
  const { S, n } = T, P = T.carte.place, pos = [], lig = [], mur = (ax, ay, az, bx, by, bz, h) => (lig.push(ax, ay + h, az, bx, by + h, bz, ax, ay, az, bx, by, bz), pos.push(ax, ay, az, bx, by, bz, bx, by + h, bz, ax, ay, az, bx, by + h, bz, ax, ay + h, az));
  const dedans = (x, z) => !!P && Math.hypot(x - P.c[0], z - P.c[1]) < P.r - 1.1; // sim.js : la chaussée n'a pas de mur à l'intérieur de la place
  for (let i = 0; i < n; i++) { const a = S[i], b = S[(i + 1) % n];
    for (const sd of [-1, 1]) { const A = [a.x - a.tz * sd * (a.w - 1.1), a.z + a.tx * sd * (a.w - 1.1)], B = [b.x - b.tz * sd * (b.w - 1.1), b.z + b.tx * sd * (b.w - 1.1)];
      if (!(dedans(...A) && dedans(...B))) mur(A[0], a.y, A[1], B[0], b.y, B[1], 3); } }
  if (P) {
    let k0 = 0, d0 = 1e9; for (let i = 0; i < n; i++) { const d = Math.hypot(S[i].x - P.c[0], S[i].z - P.c[1]); if (d < d0) { d0 = d; k0 = i; } }
    const y = S[k0].y, R = P.r - 1.1, f = j => [P.c[0] + Math.cos(j * Math.PI / 48) * R, P.c[1] + Math.sin(j * Math.PI / 48) * R];
    const ecart = (x, z) => { let m = 1e9; for (let i = 0; i < n; i++) m = Math.min(m, Math.hypot(S[i].x - x, S[i].z - z) - S[i].w + 1.1); return m; }; // écart à la chaussée (sim.js : P.ecart), à vol d'oiseau : suffit pour un affichage
    for (let j = 0; j < 96; j++) { const p = f(j), q = f(j + 1); if (ecart((p[0] + q[0]) / 2, (p[1] + q[1]) / 2) > (P.ecart || 0)) mur(p[0], y, p[1], q[0], y, q[1], 3); }
    const cs = Math.cos(P.a), sn = Math.sin(P.a);
    for (const [px, pz, hx, hz] of P.piles || []) { const C = [[-hx, -hz], [hx, -hz], [hx, hz], [-hx, hz]].map(([u, v]) => { const lx = px + u, lz = pz + v; return [P.c[0] + lx * cs + lz * sn, P.c[1] - lx * sn + lz * cs]; });
      for (let k = 0; k < 4; k++) { const p = C[k], q = C[(k + 1) % 4]; mur(p[0], y, p[1], q[0], y, q[1], 19); } }
    if (P.ile) for (let j = 0; j < 96; j++) { const a = j * Math.PI / 48, b = (j + 1) * Math.PI / 48, r = P.ile[0]; mur(P.c[0] + Math.cos(a) * r, y, P.c[1] + Math.sin(a) * r, P.c[0] + Math.cos(b) * r, y, P.c[1] + Math.sin(b) * r, 3); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xff1030, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthTest: false, depthWrite: false, fog: false }));
  m.frustumCulled = false; m.renderOrder = 999; scene.add(m);
  const gl = new THREE.BufferGeometry(); gl.setAttribute('position', new THREE.Float32BufferAttribute(lig, 3)); // arêtes jaunes : la hitbox se lit sur tous les fonds
  const l = new THREE.LineSegments(gl, new THREE.LineBasicMaterial({ color: 0xffee00, depthTest: false, fog: false })); l.frustumCulled = false; l.renderOrder = 1000; scene.add(l); return m;
}
