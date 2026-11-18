// "egee": life and atmosphere (docs/methods/LIFE.md). Everything that moves or sounds on the island, called by scenery-egee.js after the zones and before the weld: the fixed pieces placed here (poles, posts, lines)
// go into kit, everything that moves lives outside it with userData.dyn = 1. Returns the scenery's tick(dt, now, car). Pure scenery: nothing collides, nothing depends on the race.
// One wind: the meltemi blows toward WIND (the bay boats at anchor point the other way). Flags, laundry, foam, the sea's drift and the clouds all follow it.
// All motion runs on TV, the sum of dt: pause freezes it.
(window.EGEE = window.EGEE || {}).life = ({ h, g, THREE, MAT, kit, S, N, SEA, LAP, smp, pos, box, hsh, wire, up, sea, MILLS, BOATS, ISLETS }) => {
  const { insts, inst, edgePt, weld } = PLACERS, LIFE = [], D0 = new THREE.Object3D(), TAU = Math.PI * 2, DS = { side: THREE.DoubleSide }; D0.rotation.order = 'YXZ';
  let TV = 0; const WIND = [-0.83, 0.56], cap = (dx, dz) => Math.atan2(-dz, dx), WYAW = cap(...WIND); // cap: the Y rotation that turns +X toward (dx, dz)
  const dyn = o => { o.userData.dyn = 1; return o; }, ss = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
  const met = (ms, k, x, y, z, ry = 0, e = 1, ey = e, rx = 0, rz = 0, ez = e) => { D0.position.set(x, y, z); D0.rotation.set(rx, ry, rz); D0.scale.set(e, ey, ez); D0.updateMatrix(); for (const m of ms) m.setMatrixAt(k, D0.matrix); };
  const hide = (ms, k) => met(ms, k, 0, -99, 0, 0, 1e-4), upd = ms => { for (const m of ms) m.instanceMatrix.needsUpdate = true; };
  // at(pk, sd, off): the point off metres beyond the wall, between two samples (smp rounds to 2 m: a bird that follows the road would step)
  const at = (pk, sd, off) => { const f = ((pk / LAP * N) % N + N) % N, i = Math.floor(f), t = f - i, a = S[i], b = S[(i + 1) % N], L = (u, v) => u + (v - u) * t, s = { x: L(a.x, b.x), z: L(a.z, b.z), tx: L(a.tx, b.tx), tz: L(a.tz, b.tz), w: L(a.w, b.w) }, [x, z] = edgePt(s, sd, s.w + off);
    return { x, z, y: L(a.y, b.y), tx: s.tx, tz: s.tz }; };
  const out = pk => smp(pk).k > 0 ? -1 : 1, WHITE = h.mat('chauxEgee', {}, '#ffffff'), TINT = { corail: 0xed7956, bleu: 0x1c6eb0, blanc: 0xe4dccb, filet: 0xd2a23c }; // WHITE: lime tinted per instance (hulls, cloth)
  const brief = (label, p, vol, r) => { if (window.SOUND && SOUND.brief) SOUND.brief(label, p, vol, r); }, near = (car, p, r) => !!car && Math.hypot(car.x - p.x, car.z - p.z) < r;

  // ---------- the windmills (3.1, 4.1): each wheel on a pivot at its hub, slow, out of phase, with a gust every 7 s; a soft thump as each spar passes the tower (3.2), driven by the same angle ----------
  const WHEELS = MILLS.map(({ p, s, ry }, k) => { const G = dyn(new THREE.Group()), piv = new THREE.Group(); G.position.set(p.x, p.y + 9.1 * s, p.z); G.rotation.y = p.ry + ry; G.scale.setScalar(s); piv.position.x = 4.6; G.add(piv); h.scene.add(G);
    h.pose('ailesEgee', MAT, piv, [0, 0, 0], 7); return { piv, w: [0.45, 0.6, 0.72, 0.55][k % 4], ph: k * 1.9, a: k * 0.37, n: 0, p: { x: p.x, y: p.y + 9.1 * s, z: p.z } }; }); // under 1.2 rad/s: a 12-spar wheel strobes above that
  LIFE.push(dt => { for (const m of WHEELS) { m.a += m.w * (1 + 0.15 * Math.sin(TV * TAU / 7 + m.ph)) * dt; m.piv.rotation.x = m.a; const n = Math.floor(m.a / (TAU / 12)); if (n !== m.n) { m.n = n; brief('whumpEgee', m.p, 0.7, 70); } } });

  // ---------- the sea (G5): the turquoise layer drifts with the wind (0.1 m/s: a swell you feel), a second, larger layer drifts across it so that the tiling never settles ----------
  const FLOWS = [], flows = (m, u, v) => { FLOWS.push([m.map, u, v]); return m; }; // a texture that slides, in repeats per second (as the plage and chapada water)
  LIFE.push(dt => { for (const [t, u, v] of FLOWS) { t.offset.x = (t.offset.x + u * dt + 1) % 1; t.offset.y = (t.offset.y + v * dt + 1) % 1; } });
  // foam (1.2, 4.2): one strip along the foot of the quay wall and a ring round every islet, one mesh; it slides along the stone and breathes on a 5 s swell
  { const P = [], U = [], quad = (a, b, c, d, u0, u1) => { P.push(a[0], a[1], b[0], b[1], c[0], c[1], b[0], b[1], d[0], d[1], c[0], c[1]); U.push(u0, 0, u0, 1, u1, 0, u0, 1, u1, 1, u1, 0); };
    const i0 = Math.round(4540 / LAP * N), cnt = Math.round(680 / LAP * N), e = (k, o) => { const s = S[(i0 + k) % N]; return edgePt(s, 1, s.w + o); };
    for (let k = 0; k < cnt; k++) quad(e(k, 10.02), e(k, 11.7), e(k + 1, 10.02), e(k + 1, 11.7), k * 0.25, (k + 1) * 0.25);
    const ring = (p, ry, a, b) => { const n = 22, pt = (j, r) => { const t = j / n * TAU, x = Math.cos(t) * (a + r), z = Math.sin(t) * (b + r); return [p.x + x * Math.cos(ry) + z * Math.sin(ry), p.z - x * Math.sin(ry) + z * Math.cos(ry)]; }, u = (a + b) * Math.PI / n / 8;
      for (let j = 0; j < n; j++) quad(pt(j, -1), pt(j, 4.5), pt(j + 1, -1), pt(j + 1, 4.5), j * u, (j + 1) * u); };
    ISLETS.forEach(([pk, off, w, ht, d]) => { ring(pos(pk, 1, off), pos(pk, 1, off).ry, w * 0.47, d * 0.47); const q = pos(pk + 30, 1, off + 25 + w * 0.4); ring(q, q.ry, w * 0.19, d * 0.21); });
    const G = new THREE.BufferGeometry(), V = new Float32Array(P.length / 2 * 3); for (let i = 0; i < P.length / 2; i++) V.set([P[i * 2], SEA + 0.05, P[i * 2 + 1]], i * 3);
    G.setAttribute('position', new THREE.BufferAttribute(V, 3)); G.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(U), 2)); G.computeVertexNormals();
    const m = flows(h.mat('ecumeEgee', { transparent: true, depthWrite: false, opacity: 0.6, smooth: 1, ...DS }), 0.11, 0), o = dyn(new THREE.Mesh(G, m)); o.renderOrder = 2; o.frustumCulled = false; h.scene.add(o);
    LIFE.push(() => { m.opacity = 0.56 + 0.16 * Math.sin(TV * TAU / 5); }); }

  // ---------- boats (1.1, 2.3, 5.4): every fishing boat in one moving batch per zone of the shape; they bob, roll and swing a little on their mooring. One of them works (1.3): it leaves the basin round the mole and comes back ----------
  const FP = [[125, 60], [190, 72], [265, 125], [335, 160], [400, 150], [440, 170], [400, 195], [335, 188], [265, 160], [190, 128], [125, 95], [100, 78]].map(([pk, off]) => pos(pk, 1, off)), FISH = BOATS.length;
  const cr = (a, b, c, d, t) => 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (3 * b - a - 3 * c + d) * t * t * t), fish = u => { const n = FP.length, f = ((u % 1) + 1) % 1 * n, i = Math.floor(f), t = f - i, q = j => FP[(i + j + n) % n];
    return [cr(q(-1).x, q(0).x, q(1).x, q(2).x, t), cr(q(-1).z, q(0).z, q(1).z, q(2).z, t)]; };
  BOATS.push({ x: FP[0].x, z: FP[0].z, y: SEA - 0.15, ry: 0, s: 1, c: 'blanc' });
  const oB = insts(h, 'kaikiEgee', { ...MAT, coque: WHITE }, BOATS.map(b => [b.x, b.y, b.z, b.ry, b.s, b.s, b.s, TINT[b.c]]), { tintMat: 'coque' }).map(dyn); for (const m of oB) m.castShadow = false;
  LIFE.push(() => { BOATS.forEach((b, k) => { const a = TV * TAU / (3.2 + 1.8 * hsh(k, 31)) + k * 2.1, r = b.pont ? 0.045 : 0.07; let { x, z, ry } = b;
      if (k === FISH) { const u = TV / 215 + 0.07, [x1, z1] = fish(u + 0.003); [x, z] = fish(u); ry = cap(x1 - x, z1 - z); } else ry += 0.05 * Math.sin(TV * 0.23 + k);
      met(oB, k, x, b.y + 0.2 * Math.sin(a), z, ry, b.s, b.s, r * Math.sin(a * 0.71 + 1), 0.03 * Math.sin(a * 1.13 + k)); }); upd(oB); });
  // the ferry (4.3): one white ship on a long loop off the Balcon, 6 m/s. It is on the near side of its loop, crossing the view from right to left, during the first laps
  { const F = dyn(new THREE.Group()), s = smp(3300), [cx, cz] = edgePt(s, 1, 1250), nx = -s.tz, nz = s.tx; h.scene.add(F);
    for (const [m, w, ht, d, x, y] of [['blanc', 96, 9, 17, 0, 3.5], ['bleu', 97, 2.4, 17.3, 0, 0.4], ['blanc', 22, 6, 15, 44, 6.5], ['blanc', 62, 6, 14.5, -8, 11], ['verre', 60, 1.2, 14.7, -8, 12], ['blanc', 40, 4, 12, -12, 16], ['bleu', 7, 9, 7, -24, 21]]) h.pose('boxMesh', MAT[m], F, [x, y, 0], w, ht, d);
    weld(h, F); const P = a => [cx + s.tx * 900 * Math.cos(a) - nx * 300 * Math.sin(a), cz + s.tz * 900 * Math.cos(a) - nz * 300 * Math.sin(a)];
    LIFE.push(() => { const a = 2.2 - TV * 0.01, [x, z] = P(a), [x1, z1] = P(a - 0.01); F.position.set(x, SEA, z); F.rotation.y = cap(x1 - x, z1 - z); }); }

  // ---------- cloth in the wind (1.4, 3.6, 3.7): flags, pennants, bunting and laundry are thin boxes hinged on one edge, in one moving batch; all stream toward WIND and flap slowly ----------
  // flag: hinged on its pole, streams along the wind. sheet: hung from a line that runs along ry, leans downwind and swings
  const CLOTH = [], flag = (x, y, z, L, H, c) => CLOTH.push({ x, y, z, L, H, c }), sheet = (x, y, z, L, H, c, ry) => CLOTH.push({ x, y, z, L, H, c, ry, lean: WIND[0] * Math.sin(ry) + WIND[1] * Math.cos(ry) });
  const post = (x, y, z, ht, w = 0.14) => h.pose('boxMesh', MAT.tronc, kit, [x, y + ht / 2, z], w, ht, w);
  // line(a, b, ht, n, cols, L, H): two posts ht high at a and b, a line between their heads, n pieces of cloth hung from it
  const line = (a, b, ht, n, cols, L, H) => { post(a.x, a.y, a.z, ht, 0.12); post(b.x, b.y, b.z, ht, 0.12); wire(up(a, ht - 0.05), up(b, ht - 0.05), 'wire cloth');
    for (let j = 0; j < n; j++) { const t = (j + 0.5) / n; sheet(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t + ht - 0.08, a.z + (b.z - a.z) * t, L, H, TINT[cols[j % cols.length]], cap(b.x - a.x, b.z - a.z)); } };
  for (let k = 0; k < 8; k++) { const pk = (4575 + 60 * k) % LAP, p = at(pk, 1, 8.2); post(p.x, p.y, p.z, 6); [5.65, 4.85, 4.05].forEach((y, j) => flag(p.x, p.y + y, p.z, 1.5, 0.62, TINT[j === 1 ? 'blanc' : 'bleu'])); } // the quay: three pennants per pole, blue and white
  { const p = pos(340, 1, 127); post(p.x, SEA + 28, p.z, 5.2); flag(p.x, SEA + 32.1, p.z, 3.4, 2.1, TINT.bleu); const c = pos(152, -1, 91); post(c.x, c.y + 12, c.z, 6); flag(c.x, c.y + 16.9, c.z, 3.2, 2, TINT.bleu); } // the lighthouse and the town church
  { const y = smp(2400).y + 0.2, P = [2380, 2390, 2400, 2410, 2420].map(pk => ({ ...at(pk, 1, 34.2), y })); for (let i = 0; i < 4; i++) line(P[i], P[i + 1], 3.4, 3, ['bleu', 'blanc', 'corail'], 0.85, 0.6); } // bunting along the wall of the chapel square
  for (const [pk, sd, off] of [[2046, out(2060), 9], [2459, -1, 12], [2718, out(2730), 9], [1097, -1, 13.5], [1612, -1, 15.5], [3842, -1, 13.5], [4202, -1, 13.5]]) { // laundry beside the plateau houses and the four farms
    const a = at(pk - 2.8, sd, off), b = at(pk + 2.8, sd, off); a.y = g.hAt(a.x, a.z); b.y = Math.max(g.hAt(b.x, b.z), a.y - 0.6); if (a.y > SEA + 2) line(a, b, 2.5, 4, ['filet', 'corail', 'bleu', 'blanc'], 1.15, 1); }
  { const geo = new THREE.BoxGeometry(1, 1, 1); geo.translate(0.5, 0, 0); const oC = dyn(inst(h, geo, WHITE, CLOTH.map(c => [c.x, c.y, c.z]))); oC.castShadow = false; CLOTH.forEach((c, k) => { oC.setColorAt(k, new THREE.Color(c.c)); c.ph = hsh(k, 61) * TAU; }); oC.instanceColor.needsUpdate = true;
    LIFE.push(() => { CLOTH.forEach((c, k) => { const f = Math.sin(TV * 3.2 + c.ph) + 0.4 * Math.sin(TV * 7.3 + c.ph * 2); D0.position.set(c.x, c.y, c.z);
        if (c.ry === undefined) D0.rotation.set(0, WYAW + 0.3 * f, -0.12 + 0.07 * Math.sin(TV * 2.1 + c.ph)); else D0.rotation.set(-c.lean * (0.32 + 0.2 * f), c.ry, -Math.PI / 2);
        D0.scale.set(c.L, c.H, 0.06); D0.updateMatrix(); oC.setMatrixAt(k, D0.matrix); }); oC.instanceMatrix.needsUpdate = true; }); }

  // ---------- birds (1.5, 2.2, 3.5, 4.6, 4.7, 5.3, 5.7), as on plage: one perched batch and one flying batch at the same ranks. A bird glides on a long loop that follows the road, or waits perched and takes off with its group when the car comes ----------
  const BIRDS = [], ENV = [], GULL = 0xe6e4dc, DOVE = 0xecebe6;
  // glide(n, pk, half, sd, off, amp, dy, v, e, c): n birds on loops centred on chainage pk, half metres long each way, off ± amp metres beyond the wall, dy metres under the road (negative: above), v m/s; never closer than 7 m to the ground
  const glide = (n, pk, half, sd, off, amp, dy, v, e, c, o = {}) => { for (let k = 0; k < n; k++) BIRDS.push({ pk: pk + (hsh(k, pk) - 0.5) * half, half: half * (0.7 + 0.6 * hsh(k, 71)), sd, off, amp: amp * (0.6 + 0.8 * hsh(k, 72)), dy: dy + (hsh(k, 73) - 0.5) * o.spread, v: v * (hsh(k, 74) < 0.5 ? 1 : -1), ph: k / n * TAU + hsh(k, 75), e, c, hd: 0, ...o }); };
  // perch(list, p, r0): the birds of list wait at their place and take off together when the car is within r0 metres of p; they are back once it is 190 m away
  const perch = (list, p, r0, o = {}) => { const ks = list.map(b => BIRDS.push({ pose: 1, ...b }) - 1); ENV.push({ ks, p, r0, T: 5, del: 0.05, flap: 14, en: 0, t: 9, ...o }); };
  glide(8, 215, 45, 1, 72, 34, -20, 8, 1.9, GULL, { spread: 12 });                                                               // gulls wheeling over the basin
  glide(5, 1300, 150, 1, 34, 12, 14, 9, 1.9, GULL, { spread: 12, wide: 480 });                                                    // riding the updraft below the road, along the Ascension
  glide(8, 3160, 110, 1, 46, 20, 38, 9, 1.9, GULL, { spread: 36, wide: 290 });                                                    // below the cornice of the Balcon
  glide(5, 4330, 120, 1, 60, 28, -4, 8, 1.9, GULL, { spread: 14, wide: 110 });                                                    // over the bay, on the way home
  glide(1, 3250, 1.2, -1, 27, 0.8, -32, 0.5, 1.5, 0x5a4632, { spread: 0, flap: 12, fixed: WYAW + Math.PI });                      // a kestrel hovering over the crags, head to the wind
  for (const [pk0, r0] of [[4596, 62], [196, 62]]) { const c = at(pk0 + 12, 1, 9.4); perch(Array.from({ length: 6 }, (_, k) => { const p = at(pk0 + (k >> 1) * 12 + (k & 1) * 4.5, 1, 9.3 + (k & 1) * 0.5), nx = -p.tz, nz = p.tx; // gulls on the mooring blocks and the quay edge: off to sea
      return { x: p.x, y: p.y + (k & 1 ? 0.03 : 0.7), z: p.z, r: hsh(k, pk0) * 6.28, e: 1.9, c: GULL, vx: nx * (5 + hsh(k, 81) * 4) + p.tx * (hsh(k, 82) - 0.3) * 6, vy: 3 + hsh(k, 83) * 3, vz: nz * (5 + hsh(k, 81) * 4) + p.tz * (hsh(k, 82) - 0.3) * 6 }; }), c, r0); }
  for (const [pk, sd, off] of [[2705, -1, 19], [2972, -1, 16], [3782, 1, 21], [4132, -1, 17]]) { const p = pos(pk, sd, off), s = smp(pk); perch(Array.from({ length: 8 }, (_, k) => ({ x: p.x + (hsh(k, pk) - 0.5) * 4.4, y: p.y + 6.9, z: p.z + (hsh(pk, k) - 0.5) * 4.4, r: hsh(k, 91) * 6.28, e: 1.8, c: DOVE, // doves on the dovecotes: a fan across the sky ahead
      vx: s.tx * (6 + hsh(k, 92) * 4) + s.tz * sd * (hsh(k, 93) - 0.2) * 7, vy: 4 + hsh(k, 94) * 3.5, vz: s.tz * (6 + hsh(k, 92) * 4) - s.tx * sd * (hsh(k, 93) - 0.2) * 7 })), p, 95, { T: 4.2 }); }
  { const PLU = { plumage: h.mat('paint', { c: 0xffffff, emis: 1, transparent: true, ...DS }) /* flat and self-lit, as on plage: lit from below a white bird comes out brown; transparent: rhythm.js leaves it alone */, beak: h.mat('paint', { c: 0x2a2a2a, ...DS }) };
    const lo = BIRDS.map(o => [o.x || 0, -99, o.z || 0, 0, o.e, o.e, o.e, o.c]), oP = insts(h, 'birdPerched', PLU, lo, { tintMat: 'plumage' }).map(dyn), oV = insts(h, 'bird', PLU, lo, { tintMat: 'plumage' }).map(dyn);
    for (const m of [...oP, ...oV]) m.castShadow = false; BIRDS.forEach((o, k) => { hide(oV, k); o.pose ? met(oP, k, o.x, o.y, o.z, o.r, o.e) : hide(oP, k); });
    LIFE.push((dt, car) => {
      BIRDS.forEach((o, k) => { if (!o.half) return; const th = o.ph + TV * o.v / o.half, c = o.wide ? o.pk + o.wide * Math.sin(TV * 0.011 + o.ph * 3) : o.pk, p = at(c + o.half * Math.sin(th), o.sd, o.off + o.amp * Math.cos(th)), y = Math.max(g.hAt(p.x, p.z) + 7, SEA + 6, p.y - o.dy + 1.5 * Math.sin(TV * 0.5 + o.ph));
        if (o.x0 !== undefined && (p.x !== o.x0 || p.z !== o.z0)) o.hd = cap(p.x - o.x0, p.z - o.z0); o.x0 = p.x; o.z0 = p.z;
        met(oV, k, p.x, y, p.z, o.fixed ?? o.hd, o.e, o.e * (o.flap ? Math.cos(TV * o.flap + k * 1.7) * 0.85 + 0.15 : 0.75 + 0.2 * Math.sin(TV * 1.3 + k))); });
      for (const G of ENV) { if (!G.en && G.t >= G.T && near(car, G.p, G.r0)) { G.en = 1; G.t = 0; } else if (G.en && G.t >= G.T && !near(car, G.p, 190)) { G.en = 0; for (const k of G.ks) { const o = BIRDS[k]; met(oP, k, o.x, o.y, o.z, o.r, o.e); } }
        if (G.en && G.t < G.T) { G.t += dt; G.ks.forEach((k, j) => { const o = BIRDS[k], t = G.t - j * G.del; if (t <= 0) return; hide(oP, k);
            G.t < G.T - 0.05 ? met(oV, k, o.x + o.vx * t, o.y + o.vy * t, o.z + o.vz * t, cap(o.vx, o.vz), o.e, o.e * (Math.cos(TV * G.flap + k) * 0.85 + 0.15)) : hide(oV, k); }); } }
      upd(oP); upd(oV); }); }

  // ---------- clouds (G7): a few flat-bottomed cumulus of faceted blocks, far and high, outside the fog. They drift with the wind at 3 m/s; each grows in at one end of its run and melts at the other, so none ever pops ----------
  { const m = h.mat('paint', { c: 0xffffff, emis: 1, vertexColors: true, fog: false, transparent: true }), RUN = 4200, TOP = new THREE.Color('#e9e6de'), SIDE = new THREE.Color('#d6dde0'), UNDER = new THREE.Color('#aebfcd'); // kept under white: the map is bright enough
    // [metres to the side of the island's centre, across the wind; altitude; width]: each cloud runs along the wind on its own lane, never closer than 1500 m to the centre (overhead, a block of this size reads as a rock)
    const CL = [[-1600, 420, 240], [1750, 500, 280], [-2100, 520, 300], [2250, 440, 240], [-2700, 560, 320], [2800, 580, 320], [-1850, 380, 200], [2000, 400, 220]].map(([lat, y, w], k) => { const gs = [], n = 3 + (k % 3);
      for (let j = 0; j < n; j++) { const q = new THREE.IcosahedronGeometry(1, 1), e = w * (0.34 + 0.3 * hsh(k, j)); q.scale(e, e * 0.34, e * 0.62); q.translate((j - (n - 1) / 2) * w * 0.36, e * 0.34 * 0.55, (hsh(j, k) - 0.5) * w * 0.3); gs.push(q); }
      const P = new Float32Array(gs.reduce((s, q) => s + q.attributes.position.array.length, 0)), C = new Float32Array(P.length); let o = 0; for (const q of gs) { P.set(q.attributes.position.array, o); o += q.attributes.position.array.length; }
      for (let i = 0; i < P.length; i += 9) { const ux = P[i + 3] - P[i], uy = P[i + 4] - P[i + 1], uz = P[i + 5] - P[i + 2], vx = P[i + 6] - P[i], vy = P[i + 7] - P[i + 1], vz = P[i + 8] - P[i + 2], nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, c = ny / Math.hypot(nx, ny, nz);
        const col = c < -0.25 || Math.max(P[i + 1], P[i + 4], P[i + 7]) < 2 ? UNDER : c > 0.35 ? TOP : SIDE; for (let j = 0; j < 3; j++) { C[i + j * 3] = col.r; C[i + j * 3 + 1] = col.g; C[i + j * 3 + 2] = col.b; if (P[i + j * 3 + 1] < 0) P[i + j * 3 + 1] = 0; } } // flat base: what hangs under the cloud's foot is cut
      const G = new THREE.BufferGeometry(); G.setAttribute('position', new THREE.BufferAttribute(P, 3)); G.setAttribute('color', new THREE.BufferAttribute(C, 3)); const M = dyn(new THREE.Mesh(G, m)); M.rotation.y = WYAW + (hsh(k, 5) - 0.5) * 0.5; M.frustumCulled = false; h.scene.add(M);
      return { M, x: 60 - WIND[1] * lat, y, z: -550 + WIND[0] * lat, o: (k * 0.37 + hsh(k, 6) * 0.2) % 1 * RUN }; });
    LIFE.push(() => { for (const c of CL) { const u = (TV * 3 + c.o) % RUN, e = Math.max(0.001, ss(u / 400) * ss((RUN - u) / 400)); c.M.position.set(c.x + WIND[0] * (u - RUN / 2), c.y, c.z + WIND[1] * (u - RUN / 2)); c.M.scale.setScalar(e); } }); }

  // ---------- the sounds of the place (SOUND.spots, SOUND.brief of audio.js): the substation hum (2.6), the murmur of the kafeneio (3.4), the beehives (5.2); halyards on the pontoons (1.7), the two bells (1.9, 3.4), goat bells at the pens (2.5, 5.2) ----------
  if (window.SOUND && SOUND.spots) { const V = (p, dy = 1) => ({ x: p.x, y: p.y + dy, z: p.z }), rnd = (a, b) => a + Math.random() * (b - a), nearest = (L, car) => L.reduce((a, p) => Math.hypot(p.x - car.x, p.z - car.z) < Math.hypot(a.x - car.x, a.z - car.z) ? p : a);
    SOUND.spots('egee', [{ p: V(pos(556, -1, 13), 2), sound: 'transformer', r: 80, vol: 0.12 }, { p: V(pos(2400, 1, 22)), sound: 'murmurEgee', r: 50, vol: 0.1 }, { p: V(pos(4101, -1, 8.5)), sound: 'beesEgee', r: 25, vol: 0.1 }]);
    const MASTS = [60, 150, 240].map(pk => V(pos(pk, 1, 30), 0)).concat([4600, 4655, 320, 420].map(pk => V(pos(pk, 1, 12.5), 0))).map(p => ({ ...p, y: SEA + 5 })), PENS = [[925, -1, 11], [2255, 1, 13], [3128, -1, 12], [3660, -1, 13], [4290, -1, 13]].map(([pk, sd, off]) => V(pos(pk, sd, off)));
    const church = V(pos(152, -1, 91), 16), chapel = V(pos(2400, -1, 31), 14); let tH = 1, tG = 1, tC = 3, tB = 2, nB = 0;
    LIFE.push((dt, car) => { if (!car || !dt) return;
      if ((tH -= dt) < 0) { tH = rnd(0.3, 1.2); brief('halyardEgee', nearest(MASTS, car), 0.8, 70); }
      if ((tG -= dt) < 0) { tG = rnd(0.4, 2); brief('goatEgee', nearest(PENS, car), 0.8, 45); }
      if ((tC -= dt) < 0) { tC = 20; brief('bellTownEgee', church, 1.3, 220); }
      if ((tB -= dt) < 0) { tB = nB ? 14 : 1.7; nB ^= 1; brief('bellChapelEgee', chapel, 1.2, 220); } }); } // the chapel: two strikes, then 14 s of silence

  return (dt, now, car) => { TV += dt; for (const f of LIFE) f(dt, car); };
};
