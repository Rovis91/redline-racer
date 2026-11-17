// Placement of the scenery for "touge": adds its function to SCENERY. The shared placers come from scenery.js. See docs/methods/SCENERY.md.
(function () {
  const { inst, near, pt, indexed, insts, GLOW, boxMesh, edgePt, marker, weld, terrain } = PLACERS;

  // The night megalopolis all around the touge massif, from 800 to 2,350 m from the middle of the hairpins, 110 to 240 m below them, out of the fog. The sky is a 2,500 m sphere
  // around the camera: nothing is placed beyond 2,350 m from the hairpins and the convenience store, otherwise it would disappear behind it.
  // A Japanese city, not a grid: tight districts, each with its own pattern (blocks of 25 to 55 m, streets that undulate), a continuous carpet of small
  // buildings lit in cold and warm white, elevated urban expressways winding through, railway lines and their stations, clusters of towers
  // and everywhere obstacle red lights blinking together; a TV tower, a red lattice tower, the bay and its suspension bridge.
  // All as points of fixed size on screen (sharp at any distance), one draw pass per imgSize. Returns the material of the red lights.
  function ville(h, g) { // g = the massif's terrain, to place the hamlets
    const { THREE } = h, C = [460, 430], VIEWPTS = [[460, 430], [720, 580]], A = [], B = [], F = [], R = []; // A: streets; B: axes, stations, monuments; F: windows; R: red lights
    let sd = 91; const al = () => (sd = sd * 1664525 + 1013904223 >>> 0) / 4294967296; // city-specific randomness: does not shift rnd
    const pol = (deg, r) => [C[0] + Math.cos(deg / 57.3) * r, C[1] + Math.sin(deg / 57.3) * r], rC = (x, z) => Math.hypot(x - C[0], z - C[1]);
    const alt = r => -150 + (r - 800) * 0.07 + Math.max(0, r - 1800) * 0.06, y0 = (x, z) => alt(rC(x, z)); // the ground rises toward the horizon: the carpet goes up to it
    const bay = pol(212, 1750), BX = 560, BZ = 360, water = (x, z) => ((x - bay[0]) / BX) ** 2 + ((z - bay[1]) / BZ) ** 2 < 1;
    const parks = Array.from({ length: 22 }, () => [...pol(al() * 360, 1150 + al() * 1100), 40 + al() * 80]);
    const ground = (x, z) => { const r = rC(x, z); return r > 800 && VIEWPTS.every(([vx, vz]) => (x - vx) ** 2 + (z - vz) ** 2 < 2350 * 2350) && !water(x, z) && parks.every(([px, pz, pr]) => (x - px) ** 2 + (z - pz) ** 2 > pr * pr); };
    const centers = [[178, 1300, 1], [150, 1700, 1], [200, 2050, 0.9], [128, 1450, 0.8], [240, 1350, 0.8], [105, 2000, 0.7], [255, 2000, 0.7], [60, 1500, 0.5], [300, 1500, 0.5]].map(([a, r, f]) => [...pol(a, r), f]);
    const dens = (x, z) => Math.min(1, 0.45 + centers.reduce((a, [cx, cz, f]) => a + f * 0.8 * Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / 1.6e5), 0));
    const met = (L, x, y, z, c, k = 0.7 + al() * 0.3) => L.push(x, y, z, (c >> 16 & 255) / 255 * k, (c >> 8 & 255) / 255 * k, (c & 255) / 255 * k);
    const whiteN = (hotList) => { const u = al(); return hotList > u ? 0xffe0b0 : u < 0.6 ? 0xe8f0ff : u < 0.88 ? 0xfff4e0 : u < 0.94 ? 0xffb060 : [0xff60c0, 0x60f0ff, 0x80ff90, 0xffe040][al() * 4 | 0]; };
    // districts: each with its own pattern, orientation and block size; a 25 m table says which district each point belongs to
    const Q = Array.from({ length: 90 }, () => { const [x, z] = pol(al() * 360, 750 + Math.sqrt(al()) * 1650); return { x, z, a: al() * 3.1416, s: 25 + al() * 30, o: al() * 6.283 }; });
    const T0 = [C[0] - 2400, C[1] - 2400], NT = 192, tab = new Uint8Array(NT * NT);
    for (let i = 0; i < NT; i++) for (let j = 0; j < NT; j++) { const x = T0[0] + i * 25, z = T0[1] + j * 25; let b = 0, bd = 1e18; Q.forEach((q, k) => { const d = (q.x - x) ** 2 + (q.z - z) ** 2; if (d < bd) { bd = d; b = k; } }); tab[i * NT + j] = b; }
    const district = (x, z) => { const i = (x - T0[0]) / 25 | 0, j = (z - T0[1]) / 25 | 0; return i < 0 || j < 0 || i >= NT || j >= NT ? -1 : tab[i * NT + j]; };
    Q.forEach((q, k) => {
      const ca = Math.cos(q.a), sa = Math.sin(q.a);
      for (const direction of [0, 1]) for (let u = -480, n = 0; u < 480; u += q.s * (0.7 + al() * 0.6), n++) {
        const bigger = n % 5 === 2; // one street in five is an avenue, lighter
        for (let v = -480; v < 480; v += bigger ? 4 : 6) {
          const w = u + Math.sin(v / 70 + q.o) * 4, [a, b] = direction ? [w, v] : [v, w], x = q.x + a * ca - b * sa, z = q.z + a * sa + b * ca; // the streets undulate a little
          if (district(x, z) === k && ground(x, z) && al() < dens(x, z)) met(bigger ? B : A, x, y0(x, z) + 1, z, bigger ? 0xfff0d0 : whiteN(0.15));
        }
      }
    });
    // the carpet of small buildings: windows at all heights, taller and denser toward the centers
    for (let k = 0; k < 160000; k++) { const [x, z] = pol(al() * 360, Math.sqrt(800 ** 2 + al() * (2350 ** 2 - 800 ** 2))); const d = dens(x, z); if (ground(x, z) && al() < d) met(F, x, y0(x, z) + 3 + al() * al() * (10 + 70 * d * d), z, whiteN(0.3), 0.45 + al() * 0.55); }
    // elevated urban expressways: they wind, orange streetlights on both sides, white headlights and red lights
    for (let k = 0; k < 9; k++) {
      let [x, z] = pol(al() * 360, 1100 + al() * 1100), cap = al() * 6.283, corner = 0;
      for (let p = 0; p < 1600; p++) {
        corner = corner * 0.98 + (al() - 0.5) * 0.004; cap += corner; x += Math.cos(cap) * 3; z += Math.sin(cap) * 3;
        if (!ground(x, z)) { if (rC(x, z) < 800) cap += 0.05; continue; }
        const y = y0(x, z) + 16, nx = -Math.sin(cap), nz = Math.cos(cap);
        if (p % 4 === 0) for (const s of [-1, 1]) met(B, x + nx * 7 * s, y + 4, z + nz * 7 * s, 0xffa040, 0.9);
        if (al() < 0.45) met(B, x + nx * 2, y, z + nz * 2, 0xfff4e8); if (al() < 0.45) met(B, x - nx * 2, y, z - nz * 2, 0xff2a18);
      }
    }
    // railway lines: long, almost straight streaks, greenish light, and brightly lit stations
    for (let k = 0; k < 7; k++) {
      let [x, z] = pol(al() * 360, 1100 + al() * 300), cap = Math.atan2(z - C[1], x - C[0]) + (al() - 0.5) * 1.2;
      for (let p = 0; p < 500; p++) {
        cap += (al() - 0.5) * 0.02; x += Math.cos(cap) * 4; z += Math.sin(cap) * 4;
        if (!ground(x, z)) continue;
        if (p % 3 === 0) met(B, x, y0(x, z) + 6, z, 0xc8ffe0, 0.6);
        if (p % 160 === 80) for (let i = 0; i < 60; i++) { const t = (al() - 0.5) * 120, e = (al() - 0.5) * 24; met(B, x + Math.cos(cap) * t - Math.sin(cap) * e, y0(x, z) + 4 + al() * 8, z + Math.sin(cap) * t + Math.cos(cap) * e, al() < 0.7 ? 0xffffff : 0xffe070); }
      }
    }
    // the bay: a lit quay, boats, and a suspension bridge (two pylons, catenary cables)
    for (let t = 0; t < 6.283; t += 0.003) { const x = bay[0] + Math.cos(t) * (BX + 6), z = bay[1] + Math.sin(t) * (BZ + 6); if (rC(x, z) > 800 && VIEWPTS.every(([vx, vz]) => Math.hypot(x - vx, z - vz) < 2350)) met(B, x, y0(x, z) + 2, z, al() < 0.6 ? 0xffb860 : 0xffffff); }
    for (let k = 0; k < 18; k++) { const t = al() * 6.283, q = al() * 0.85; met(B, bay[0] + Math.cos(t) * BX * q, y0(...bay) + 1, bay[1] + Math.sin(t) * BZ * q, [0xffffff, 0xff4030, 0x40ff80][k % 3]); }
    { const P0 = [bay[0] + Math.cos(0.75) * BX, bay[1] + Math.sin(0.75) * BZ], P1 = [bay[0] + Math.cos(2.4) * BX, bay[1] + Math.sin(2.4) * BZ], yb = y0(...bay) + 25;
      const at = t => [P0[0] + (P1[0] - P0[0]) * t, P0[1] + (P1[1] - P0[1]) * t];
      for (let t = 0; t <= 1; t += 0.0025) { const [x, z] = at(t), c = t < 0.25 ? (0.25 - t) / 0.25 : t > 0.75 ? (t - 0.75) / 0.25 : Math.abs(t - 0.5) / 0.25;
        met(B, x, yb, z, 0xfff0d0, 0.9); if (t % 0.01 < 0.0025) met(B, x, yb + 4 + 80 * c * c, z, 0xe0f0ff, 0.9); } // deck and cables
      for (const t of [0.25, 0.75]) { const [x, z] = at(t); for (let e = 0; e < 90; e += 3) met(B, x, yb + e, z, 0xffffff, 0.8); R.push(x, yb + 92, z, 1, 1, 1); }
    }
    // towers: dense clusters around the centers, and a few everywhere; dark silhouettes (they hide the city behind them), windows, red light
    const lapCount = [];
    const lapRun = (x, z, w, p, ht) => {
      const b = y0(x, z); lapCount.push([x, b + ht / 2, z, w, ht, p]);
      for (let e = 4; e < ht - 2; e += 6) for (const [fx, fz, lx, lz, L] of [[1, 0, 0, 1, p], [-1, 0, 0, 1, p], [0, 1, 1, 0, w], [0, -1, 1, 0, w]]) for (let c = -L / 2 + 3; c < L / 2 - 1; c += 5)
        if (al() < 0.2) met(F, x + fx * (w / 2 + 0.4) + lx * c, b + e, z + fz * (p / 2 + 0.4) + lz * c, whiteN(0.25), 0.6 + al() * 0.4);
      if (ht > 90) R.push(x, b + ht + 1, z, 1, 1, 1);
    };
    for (const [cx, cz, f] of centers) for (let k = 0; k < 60 * f; k++) {
      const a = al() * 6.283, d = Math.sqrt(-2 * Math.log(1 - al() * 0.99)) * 110, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
      if (ground(x, z)) lapRun(x, z, 20 + al() * 22, 20 + al() * 22, 40 + f * 220 * Math.exp(-d * d / 3e4) * (0.4 + al() * 0.6));
    }
    for (let k = 0; k < 320; k++) { const [x, z] = pol(al() * 360, 900 + al() * 1450); if (ground(x, z)) lapRun(x, z, 14 + al() * 16, 14 + al() * 16, 30 + al() * al() * 90); }
    for (let k = 0; k < 350; k++) { const [x, z] = pol(al() * 360, 900 + al() * 1450); if (ground(x, z) && al() < dens(x, z)) R.push(x, y0(x, z) + 25 + al() * 40, z, 1, 1, 1); } // roofs of the mid-rise buildings
    // the TV tower: a slim shaft with lit rings, two observation decks; the red lattice tower, lit in orange
    { const [x, z] = pol(195, 1500), b = y0(x, z);
      for (let e = 0; e < 380; e += 3) { const r = 13 - e * 0.022; for (let i = 0; i < 10; i++) if (e % 24 === 0 || i % 5 === 0) met(B, x + Math.cos(i * 0.628) * r, b + e, z + Math.sin(i * 0.628) * r, 0xc8dcff, 0.8); }
      for (const [e, r] of [[225, 16], [290, 11]]) for (let i = 0; i < 36; i++) for (const de of [0, 3, 6]) met(B, x + Math.cos(i * 0.1745) * r, b + e + de, z + Math.sin(i * 0.1745) * r, 0xffffff, 1);
      R.push(x, b + 384, z, 1, 1, 1); }
    { const [x, z] = pol(165, 1420), b = y0(x, z), dm = e => 16 * (1 - e / 230) ** 1.6 + 1;
      for (let e = 0; e < 220; e += 2) for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) met(B, x + sx * dm(e), b + e, z + sz * dm(e), 0xff7020, 1);
      for (const e of [0, 55, 100, 150]) for (let t = -1; t <= 1; t += 0.08) for (const [sx, sz, ox, oz] of [[1, 0, 0, 1], [-1, 0, 0, 1], [0, 1, 1, 0], [0, -1, 1, 0]]) met(B, x + (sx + ox * t) * dm(e), b + e, z + (sz + oz * t) * dm(e), e === 100 ? 0xffffff : 0xff7020, 1);
      R.push(x, b + 223, z, 1, 1, 1); }
    const sil = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0x04060a, fog: false }), Math.max(1, lapCount.length)), o = new THREE.Object3D();
    lapCount.forEach((t, i) => { o.position.set(t[0], t[1], t[2]); o.scale.set(t[3], t[4], t[5]); o.updateMatrix(); sil.setMatrixAt(i, o.matrix); }); sil.count = lapCount.length; sil.frustumCulled = false; h.scene.add(sil);
    const cloud = (L, size) => { // one draw pass: points of fixed size on screen, so sharp at any distance. Element: x, y, z, r, v, b
      const g = new THREE.BufferGeometry(), n = L.length / 6, P = new Float32Array(n * 3), K = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { P.set(L.slice(i * 6, i * 6 + 3), i * 3); K.set(L.slice(i * 6 + 3, i * 6 + 6), i * 3); }
      g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('color', new THREE.BufferAttribute(K, 3));
      const m = new THREE.PointsMaterial({ size, sizeAttenuation: false, fog: false, vertexColors: true }), pts = new THREE.Points(g, m); pts.frustumCulled = false; h.scene.add(pts); return m;
    };
    // the glow of the sky above the city: a 2,300 m ring, a gradient in added light, rising from the horizon and fading upward
    // brightest facing the dense districts: each vertex of the ring takes the city's density in its direction
    const hg = new THREE.CylinderGeometry(2300, 2300, 420, 96, 1, true), hp = hg.attributes.position, hc = new Float32Array(hp.count * 3);
    for (let i = 0; i < hp.count; i++) { const a = Math.atan2(hp.getZ(i), hp.getX(i)); let d = 0; for (const r of [1300, 1700, 2100]) d += dens(C[0] + Math.cos(a) * r, C[1] + Math.sin(a) * r) / 3; const k = Math.max(0.15, (d - 0.45) * 1.8); hc.set([k, k, k], i * 3); }
    hg.setAttribute('color', new THREE.BufferAttribute(hc, 3));
    const halo = new THREE.Mesh(hg, h.mat('gradient', { emis: 1, fog: false, transparent: true, opacity: 0.6, vertexColors: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide }, '#b4643c', true));
    halo.position.set(C[0], 170, C[1]); halo.frustumCulled = false; h.scene.add(halo);
    // hamlets in the valleys of the massif, between the road and the plain: a few lit houses, a streetlight
    if (g) for (let k = 0; k < 24; k++) { const x0 = g.box[0] + al() * (g.box[2] - g.box[0]), z0 = g.box[1] + al() * (g.box[3] - g.box[1]); if (g.dAt(x0, z0) < 90) continue;
      for (let i = 0; i < 30; i++) { const x = x0 + (al() - 0.5) * 120, z = z0 + (al() - 0.5) * 120; if (g.dAt(x, z) > 70) met(A, x, g.hAt(x, z) + 1.5 + al() * 4, z, al() < 0.7 ? 0xffd090 : 0xe8f0ff, 0.5 + al() * 0.4); } }
    cloud(A, 1.5); cloud(B, 2); cloud(F, 1);
    return cloud(R, 2.5); // the material's color multiplies that of the points: the tick makes all the red lights blink together
  }

  Object.assign(SCENERY, {
    // ---------- Karasu-tōge: cedar forest, reflector guardrails, and at the summit a crossroads: night convenience store, gas station, parked cars ----------
    touge(h) {
      const { THREE, S, N, W, rnd } = h;
      // the torrent at the foot of the climb (pt 2): a 7 m gorge winding across the road, under a stone bridge
      const sp = S[pt(h, 2)], ravine = (x, z) => { const dx = x - sp.x, dz = z - sp.z, v = dz * sp.tx - dx * sp.tz, u = dx * sp.tx + dz * sp.tz - 6 * Math.sin(v / 25);
        return Math.abs(v) > 90 || Math.abs(u) > 9 ? 0 : 7 * (1 - (u / 9) ** 2) * Math.min(1, (90 - Math.abs(v)) / 20); };
      // two places, each on the outer side (the farthest from the other roads), the ground brought to road level beneath them, never on the carriageway nor at its edges:
      // the temple at the summit crossroads (pt 11), the convenience store and the gas station in the last bend, the one that brings you back to the start/finish line (pt 47)
      const spot = (i, off) => { const s = S[i], isFar = (x, z) => { let d = 1e18; for (let j = 0; j < N; j += 3) if (Math.abs(((j - i + N + N / 2) % N) - N / 2) > 40) d = Math.min(d, (S[j].x - x) ** 2 + (S[j].z - z) ** 2); return d; };
        const sd = isFar(...edgePt(s, 1, 60)) > isFar(...edgePt(s, -1, 60)) ? 1 : -1, [x, z] = edgePt(s, sd, W + off);
        const flatPart = (px, pz, y) => { const r = Math.hypot(px - x, pz - z); if (r > 55) return 0; let d = 1e18; for (let j = i - 60; j < i + 60; j++) { const q = S[(j + N) % N]; d = Math.min(d, (q.x - px) ** 2 + (q.z - pz) ** 2); }
          return (y - (s.y - 0.35)) * Math.min(1, (55 - r) / 17, Math.max(0, (Math.sqrt(d) - W - 6) / 10)); };
        // clear: the place itself (r0) and, on the approach side (local Z > 0), up to 75 m so it is seen coming
        const clears = (px, pz, r0) => { const r = Math.hypot(px - x, pz - z); return r < r0 || (r < 75 && (px - s.x) * s.tx + (pz - s.z) * s.tz < 0); };
        // hill: behind the place the ground rises (0.35 m per m) instead of plunging toward the valley: the cedars at the back stand above the temple roof. Never near another road
        const hill = (px, pz, y) => { const dx = px - s.x, dz = pz - s.z, X = (dz * s.tx - dx * s.tz) * sd, Z = -(dx * s.tx + dz * s.tz); if (X < W + 40 || X > W + 130 || Math.abs(Z) > 70) return 0;
          let d = 1e18; for (let j = 0; j < N; j += 3) d = Math.min(d, (S[j].x - px) ** 2 + (S[j].z - pz) ** 2);
          return (y - (s.y - 0.35 + (X - W - 40) * 0.35)) * Math.min(1, (X - W - 40) / 10, (W + 130 - X) / 20, (70 - Math.abs(Z)) / 20, Math.max(0, (Math.sqrt(d) - W - 30) / 15)); };
        return { i, s, sd, x, z, flatPart, clears, hill }; };
      const high = spot(pt(h, 11), 26), low = spot(pt(h, 47) + 6, 22), ic = high.i, sc = high.s, sd = high.sd, cx = high.x, cz = high.z;
      const g = terrain(h, { stepSec: 7, under: 6, margin: 320, isFar: 60, waterfall: 1.1, hollow: (x, z, y) => ravine(x, z) + high.flatPart(x, z, y) + high.hill(x, z, y) + low.flatPart(x, z, y), mat: h.mat('noise', {}, '#0c1a14', ['#12261e', '#081410', '#16302a']) });
      // ---------- the high-voltage line: it leaves a substation beside the temple, crosses the road overhead and descends the slope toward the valley city ----------
      // The substation (arrival gantry, transformers, shed) is placed on the temple side, beyond the cross road; three pylons recede in a straight line,
      // each lower than the previous one, then the cable drops 700 m further on to a city pylon at the bottom of the valley, and disappears behind the relief and the fog. Direction, spans and pylon scale are worked out by calculation:
      // pylons more than W + 15 m from any road, away from the temple and the convenience store; low cable, sag included (4.5% of the span), more than 9 m above the ground and 13 m above a carriageway.
      // The trees are then kept clear of the corridor and the substation, and pushed down under the cable.
      const CONS = [[-6.3, 26.7], [6.3, 26.7], [-6.3, 31.7], [6.3, 31.7], [-4.3, 36.7], [4.3, 36.7]], GANTRY = [[-6.3, 16], [6.3, 16], [-6.3, 18.5], [6.3, 18.5], [-4.3, 21], [4.3, 21]], LOW = CONS[0][1], i10 = pt(h, 10);
      const cable = (A, B, t) => { const f = 0.045 * Math.hypot(B[0] - A[0], B[2] - A[2]); return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t - 4 * f * t * (1 - t), A[2] + (B[2] - A[2]) * t]; }; // A, B : points d'attache
      const line = (() => { const n = [-sc.tz * sd, sc.tx * sd]; // n: outward, temple side
        for (const [PX, PZ] of [[W + 22, -48], [W + 22, -56], [W + 30, -50], [W + 22, 48]]) { const x0 = sc.x + n[0] * PX - sc.tx * PZ, z0 = sc.z + n[1] * PX - sc.tz * PZ, P0 = [x0, g.hAt(x0, z0), z0];
          for (const k of [1, 1.25, 1.5]) for (const a of [0, 0.25, -0.25, 0.5, -0.5, 0.75, -0.75]) { const u = [-n[0] * Math.cos(a) + n[1] * Math.sin(a), -n[0] * Math.sin(a) - n[1] * Math.cos(a)];
            for (const D1 of [90, 110, 130, 150, 170]) for (const ps of [140, 160, 120]) {
              const pts = [P0]; for (let j = 0; j < 3; j++) { const d = D1 + j * ps, x = x0 + u[0] * d, z = z0 + u[1] * d; pts.push([x, g.hAt(x, z), z]); }
              if (pts.slice(1).some(([x, , z]) => g.dAt(x, z) < W + 15 || Math.hypot(x - cx, z - cz) < 45 || Math.hypot(x - low.x, z - low.z) < 60) || pts[3][1] > pts[1][1] - 15) continue; // the line descends
              const d3 = D1 + 2 * ps + 700, xa = x0 + u[0] * d3, za = z0 + u[1] * d3, ra = Math.hypot(xa - 460, za - 430); // the anchor: a city pylon, at the foot of the mountain (same altitude as the city ground, ville())
              pts.push([xa, -150 + (Math.max(ra, 800) - 800) * 0.07 + Math.max(0, ra - 1800) * 0.06, za]); // the cable descends toward the valley and disappears behind the relief, into the fog
              const hA = i => [pts[i][0], pts[i][1] + (i ? LOW * k : GANTRY[0][1]), pts[i][2]]; let ok = true;
              for (let q = 0; q < 4 && ok; q++) { const A = hA(q), B = hA(q + 1), m = Math.ceil(Math.hypot(B[0] - A[0], B[2] - A[2]) / 4);
                for (let j = 0; j <= m && ok; j++) { const [x, y, z] = cable(A, B, j / m); ok = y - g.hAt(x, z) > (g.dAt(x, z) < W + 4 ? 13 : 9); } }
              if (ok) return { pts, u, k, ry: Math.atan2(u[0], u[1]), hA }; } } }
        return null; })();
      const underLine = (x, z) => { if (!line) return null; let b = null; for (let q = 0; q < 4; q++) { const A = line.hA(q), B = line.hA(q + 1), ux = B[0] - A[0], uz = B[2] - A[2], l2 = ux * ux + uz * uz,
        t = Math.max(0, Math.min(1, ((x - A[0]) * ux + (z - A[2]) * uz) / l2)), d = Math.hypot(A[0] + ux * t - x, A[2] + uz * t - z); if (!b || d < b.d) b = { d, y: cable(A, B, t)[1] }; } // distance from the corridor, height of the low cable
        if (Math.hypot(x - line.pts[0][0], z - line.pts[0][2]) < 18) b.d = 0; return b; }; // the substation: no tree on it
      // a cross road leaves the crossroads, closed off
      // cedars: a dense row along the road (the tree tunnel), then the forest; nothing on the temple or the convenience store, nor in front of them on the approach.
      // In the hairpins, nothing on the valley side (west) and smaller cedars on the uphill side, whose tops stay below the view of the hairpin above; young plants on the slope below: the city is seen over them
      const trees = [], hairpins = (x, z) => x > 372 && x < 552 && z > 300 && z < 576, plants = (x, z) => x > 100 && x < 552 && z > 260 && z < 640, free0 = (x, z) => !high.clears(x, z, 34) && !low.clears(x, z, 60) && ravine(x, z) < 1 && !(underLine(x, z)?.d < 14);
      // the gap on the valley side (right) between pts 7 and 9: no tree where this stretch is the nearest road, the city and the moon appear
      const i7 = pt(h, 7), i9 = pt(h, 9), opening = (x, z) => { let b = null, bd = 1e18; for (let i = i7; i <= i9; i += 3) { const d = (S[i].x - x) ** 2 + (S[i].z - z) ** 2; if (d < bd) { bd = d; b = S[i]; } }
        return bd < 160 * 160 && Math.sqrt(bd) < g.dAt(x, z) + 4 && (z - b.z) * b.tx - (x - b.x) * b.tz > 0; }, free = (x, z) => free0(x, z) && !opening(x, z);
      for (let i = 0; i < N; i += 3) for (const side of [-1, 1]) {
        const [x, z] = edgePt(S[i], side, W + 4.5 + rnd() * 7);
        if (g.dAt(x, z) > W + 3.5 && free(x, z) && !(hairpins(x, z) && x < S[i].x - 3)) trees.push([x, g.hAt(x, z) + 6, z, rnd() * 6, (0.8 + rnd() * 0.7) * (plants(x, z) && x < 545 ? (hairpins(x, z) ? 0.75 : 0.4) : 1)]);
      }
      for (let k = 0; k < 2600; k++) {
        const x = g.box[0] + rnd() * (g.box[2] - g.box[0]), z = g.box[1] + rnd() * (g.box[3] - g.box[1]), d = g.dAt(x, z);
        if (d > W + 6 && d < 230 && free(x, z) && (!hairpins(x, z) || (d < 17 && g.dAt(x - 2, z) < d))) trees.push([x, g.hAt(x, z) + 6, z, rnd() * 6, (0.9 + rnd() * 0.9) * (hairpins(x, z) ? 0.75 : plants(x, z) || (x > -100 && x < 552 && z > 200 && z < 700) ? 0.4 : 1)]);
      }
      // behind the temple and behind the convenience store, a curtain of cedars: the empty is no longer seen. Nothing on the approach side, nor on the summit cross road (Z ≈ -22)
      for (const [P, X0, crossing] of [[high, 54, 1], [low, 48, 0]]) for (let k = 0; k < 70; k++) { const X = W + X0 + rnd() * 45, Z = -45 + rnd() * 80, q = P.s, x = q.x - q.tz * P.sd * X - q.tx * Z, z = q.z + q.tx * P.sd * X - q.tz * Z;
        if (!(crossing && Math.abs(Z + 22) < 9) && !(underLine(x, z)?.d < 14)) trees.push([x, g.hAt(x, z) + 6, z, rnd() * 6, 1.1 + rnd() * 0.6]); }
      for (let k = trees.length - 1; k >= 0; k--) { const p = trees[k], c = underLine(p[0], p[2]); if (c && c.d < 3.6 * p[4] + 10 && p[1] - 6 + 18.5 * p[4] > c.y - 3) trees.splice(k, 1); } // crown (15 m canopy on an 11 m trunk) at least 3 m below the cable
      const casks = trees.map(p => { const y0 = p[1] - 6; p[1] = y0 + 11 * p[4]; return [p[0], y0 + 2.6 * p[4], p[2], 0, p[4]]; }); // the canopy rises on a bare trunk, like a real Japanese cedar
      inst(h, h.geo('cedar'), h.mat('cedar'), trees); inst(h, h.geo('trunk'), h.mat('trunk'), casks);
      // orange reflectors on the guardrails: the only marking, as on a real mountain pass road
      const reflectors = [];
      for (let i = 0; i < N; i += 6) for (const side of [-1, 1]) { const [x, z] = edgePt(S[i], side, W + 0.15); reflectors.push([x, S[i].y + 0.85, z]); }
      inst(h, h.geo('reflector'), h.mat('reflector', { emis: 1, retroRefl: 2.5 }), reflectors); // unlit, they light up in the headlight beam

      // --- the summit temple: set at the road's edge, local X going away from it; the cross road leaves beside it, closed off ---
      const asphalt = h.mat('asphalt'), steelMat = h.mat('steelMat'), pane = h.mat('paneDark'), lightRed = h.mat('lightRed', GLOW), lightWhite = h.mat('lampObj', GLOW);
      const gr = marker(h, sc), X = v => sd * (W + v), gT = new THREE.Group(), [tx0, tz0] = edgePt(sc, sd, W + 1); gT.position.set(tx0, sc.y, tz0); gT.rotation.y = h.across(sc) + (sd > 0 ? 0 : Math.PI); h.scene.add(gT);
      const lantern = h.mat('lantern', GLOW);
      h.pose('temple', { gravel: h.mat('gravel'), vermilion: h.mat('vermilion'), blackM: pane, stone: h.mat('stoneMoss'), fire: lantern, wood: h.mat('woodTemple', { emissive: 0x120a06 }), shoji: h.mat('shoji', GLOW), water: h.mat('waterVivid', { emis: 1, c: 0x2a5058 }), stucco: h.mat('stucco'),
        chochin: h.mat('paint', { emis: 1, c: 0xff4a28 }), racingLine: h.mat('lacquer', { c: 0xe8d8a0, emissive: 0x3a3018 }), roofM: h.mat('tileTemple', { emissive: 0x222c38 }), shore: h.mat('lacquer', { c: 0xd8c49a, emissive: 0x3a2e1c }) }, gT); // emissive: the roofs stay readable against the night sky
      h.pose('traverse', { asphalt }, gr, [X(70), 0, -22]); // the cross road plunges into the forest, beside the temple
      const striping = h.mat('striping', GLOW), blinkerMat = h.mat('blinker', GLOW), cone = h.mat('cone', GLOW); // closed off: striped barriers, cones, blinking orange lights
      for (const dz of [-25, -22, -19]) h.pose('barrierRail', { striping, blinker: blinkerMat }, gr, [X(43), 0, dz]);
      for (const dz of [-26.5, -23.5, -20.5, -17.5]) h.pose('cone', cone, gr, [X(41.5), 0.5, dz]);
      gT.updateMatrixWorld(); // lanterns of the torii and the path, pavilion facade: warm light
      for (const [lx, ly, lz, d, f] of [[4, 5, 0, 18, 1.4], [14, 2, 0, 16, 1.6], [33, 7.5, -5.4, 16, 1.8], [33, 7.5, 5.4, 16, 1.8], [36, 5, 0, 20, 1.6]]) { const p = gT.localToWorld(new THREE.Vector3(lx, ly, lz)); h.emis(ic, p.x, p.y, p.z, 0xffb060, d, f); } // the lanterns light the eaves
      // --- the convenience store, the gas station and their forecourt: in the last bend, facing whoever arrives (road frame, X outward) ---
      { const gb = marker(h, low.s), XL = v => low.sd * (W + v);
        h.pose('esplanade', { asphalt }, gb, [XL(21), 0, 0]); h.pose('boxMesh', h.mat('concretePart'), gb, [XL(21), -1.3, 0], 39.6, 1.9, 51.6); // skirt under the slab: near the road the ground is lower
        h.pose('minimarket', { intoWall: h.mat('stucco'), door: pane, roofM: h.mat('matGray'), clim: steelMat, showcase: h.mat('showcase', GLOW), signboard: h.mat('written', GLOW, 128, 12, '#1d4ac8', '#ffd84a', 'カラスマート  KARASU MART  24H', 9), dispenser: h.mat('dispenser', GLOW) }, gb, [XL(34), 0, -8], low.sd);
        h.pose('station', { steelMat, islet: h.mat('concretePart'), lampObj: h.mat('lampObj', GLOW), signboard: h.mat('written', GLOW, 96, 8, '#c8102e', '#ffffff', 'TOGE OIL  峠石油', 7), pumpset: h.mat('pumpPetrol', GLOW) }, gb, [XL(15), 0, 15]);
        h.pose('signboardHigh', { steelMat, signboard: h.mat('written', GLOW, 96, 64, '#1d4ac8', '#ffd84a', 'カラスマート 24H', 13) }, gb, [XL(3), 0, 34]); // seen from afar, before the bend
        h.pose('totem', { steelMat, price: h.mat('written', GLOW, 32, 32, '#101418', '#ffd84a', '168', 14) }, gb, [XL(4.5), 0, 25]);
        // parked cars: generic sports-car silhouettes, lights on, some turned toward the road
        [[7, -19, 0.3, 0xf4f0e0], [7.5, -13, -0.2, 0xc8102e], [8, -7, 0.15, 0x2a5ac8], [22, -21, 1.57, 0x14161c], [22, 2, 1.4, 0xffc04a], [10, 6, -0.4, 0x9aa0a8], [16, 26, 1.57, 0x1f8f5a]].forEach(([vx, vz, a, col]) => {
          const v = new THREE.Group(); v.position.set(XL(vx), 0, vz); v.rotation.y = a; gb.add(v);
          h.pose('carParked', { carBody: h.mat('lacquer', { c: col }), pane, lightRed, lightWhite, chassis: h.mat('matGray'), wheelPart: h.mat('wheelPart'), tire: h.mat('tire') }, v); });
        gb.updateMatrixWorld(); // the shop window and the awning light the forecourt, the road and the passing cars
        for (const [lx, lz, col, d] of [[27, -8, 0xdfefff, 46], [15, 15, 0xffe0a0, 34], [3, 0, 0xdfefff, 22]]) { const p = gb.localToWorld(new THREE.Vector3(XL(lx), 4.5, lz)); h.emis(low.i, p.x, p.y, p.z, col, d, 3); } }
      // the chevrons of the two bends (placed by game.js before the scenery) hid the temple and the convenience store: removed in front of them
      for (const o of h.scene.children) if (o.isInstancedMesh && o.geometry.parameters && ((o.geometry.parameters.width === 5 && o.geometry.parameters.height === 2.5) || (o.geometry.parameters.width === 0.14 && o.geometry.parameters.height === 5.4))) { // chevrons (chevron shape, 5 × 2.5 m) and their posts
        const M4 = new THREE.Matrix4(), v = new THREE.Vector3(), zero = new THREE.Matrix4().makeScale(0, 0, 0);
        for (let k = 0; k < o.count; k++) { o.getMatrixAt(k, M4); v.setFromMatrixPosition(M4); if ([high, low].some(P => (v.x - P.x) ** 2 + (v.z - P.z) ** 2 < 62 * 62)) o.setMatrixAt(k, zero); }
        o.instanceMatrix.needsUpdate = true; }

      // faded cells are only drawn within 180 m of a camera (the ground, always drawn, picks up each view's position every frame)
      const nears = [], views = [], ground0 = g.mesh; ground0.onBeforeRender = (r, sc, cam) => views.push(cam.position.clone());
      const n0 = h.scene.children.length; // everything that follows, except the instances, is merged per material at the end (draw passes)
      // ---------- the climb (pts 1 to 12): a landmark per stretch, so it is no longer just long curves among the cedars ----------
      const ext = i => g.dAt(...edgePt(S[i], 1, 30)) > g.dAt(...edgePt(S[i], -1, 30)) ? 1 : -1; // the side that moves away from the other roads
      // a group placed on the ground beside the road, local X = going away from it; never more than `low` m below the carriageway (the bases go down the slope)
      const site = (i, sideOf, off, low = 9) => { const s = S[i], [x, z] = edgePt(s, sideOf, off), p = new THREE.Group(); p.position.set(x, Math.max(g.hAt(x, z), s.y - low), z); p.rotation.y = h.across(s) + (sideOf > 0 ? 0 : Math.PI); h.scene.add(p); return p; };
      const at = (i0, i1, f) => Math.round(i0 + (i1 - i0) * f), lightsUp = (p, i, lx, ly, col, d, f) => { p.updateMatrixWorld(); const q = p.localToWorld(new THREE.Vector3(lx, ly, 0)); h.emis(i, q.x, q.y, q.z, col, d, f); };
      const stone = h.mat('stoneMoss'), gray = h.mat('matGray'), wheelPart = h.mat('wheelPart'), whiteN = h.mat('lacquer', { c: 0xe8ecf0 }), tire = h.mat('tire'), lightSoft = h.mat('lantern', GLOW), concretePart = h.mat('concretePart'), wood = h.mat('trunk'), [i1, i3, i4, i5] = [1, 3, 4, 5].map(k => pt(h, k));
      // pts 1-3: stone bridge over the torrent, low mist rising from the gorge and trailing over the road, "13 %" sign
      h.pose('bridgeStone', { stone }, marker(h, sp), [0, 0, 0], W);
      const water = h.mat('waterVivid', { emis: 1, c: 0x2a5058 }), waveSet = [], sheets = [], hazeG = new THREE.PlaneGeometry(1, 1); hazeG.rotateX(-Math.PI / 2);
      const readQ = v => { const u = 6 * Math.sin(v / 25); return [sp.x - sp.tz * v + sp.tx * u, sp.z + sp.tx * v + sp.tz * u]; }; // the bottom of the gorge, as in ravine()
      for (let v = -86; v <= 86; v += 8) { const [x, z] = readQ(v); waveSet.push([x, g.hAt(x, z) + 0.6, z, h.across(sp)]); } // the torrent drops in steps: cascades
      (inst(h, h.geo('boxMesh', 8.6, 0.3, 3.5), water, waveSet));
      for (let k = 0; k < 14; k++) { const [x, z] = readQ((rnd() - 0.5) * 150); sheets.push([x, g.hAt(x, z) + 2 + rnd() * 3, z, rnd() * 6, 26 + rnd() * 20, 1, 18 + rnd() * 10]); }
      for (let i = i1; i < i3; i += 12) for (const c of [-1, 1]) { const [x, z] = edgePt(S[i], c, W + 20 + rnd() * 10); sheets.push([x, S[i].y - 0.8 + rnd(), z, rnd() * 6, 16 + rnd() * 8, 1, 16 + rnd() * 8]); } // 20 m or more from the edge: they never cover the carriageway
      // additive: the mist planes in normal blending were catching the headlights (eclaire, game.js) and dazzled the whole road
      const haze = inst(h, hazeG, h.mat('haze', { emis: 1, c: 0x3a4a50, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }), sheets); haze.castShadow = haze.receiveShadow = false; (haze);
      const retroRefl = { emis: 1, retroRefl: 1.2 }; // the signs light up in the headlights, like the reflectors
      h.pose('signSlope', { pole: steelMat, plate: h.mat('diamond', { ...retroRefl, alphaTest: 0.5 }, '13%'), under: h.mat('written', retroRefl, 48, 20, '#f4f4f0', '#101010', '上り急勾配', 10) }, marker(h, S[i1 + 12]), [W + 1.5, 0, 0]);
      // pts 3-5: shrine on the slope (vermilion torii, stone steps, lit tōrō, small oratory), and sika deer at the roadside
      { const i = at(i3, i4, 0.8), p = site(i, -ext(i), W + 4.5);
        h.pose('shrine', { vermilion: h.mat('vermilion'), blackM: pane, stairStep: stone, fire: lightSoft, wood, roofM: gray }, p);
        lightsUp(p, i, 2.5, 1.9, 0xffb050, 14, 1.6); lightsUp(p, i, 9, 4.6, 0xffb050, 10, 1.2); }
      const skinDeer = { fur: h.mat('furCoat'), rump: stone, wood, eyes: h.mat('paint', { emis: 1, retroRefl: 4, c: 0xc8ffb0 }) }; // the eyes: same technique as the reflectors
      (insts(h, 'deer', skinDeer, [[0.15, 1, 3.4, 1], [0.2, 1, 6.5, 0.8], [0.62, -1, 3.2, 1.05], [0.7, -1, 7, 0.85], [0.74, -1, 5, 0.9]].map(([f, c, off, t]) => { // turned toward the road and the approaching car
        const p = site(at(i3, i5, f), c, W + off); h.scene.remove(p); return [p.position.x, p.position.y, p.position.z, p.rotation.y - c * 2.36 + (rnd() - 0.5) * 0.6, t]; })));
      // pts 5-7: the inside of the hairpin stays open (wall and net removed: they blocked the view); outside, a single lit drinks vending machine
      { const i = at(i5, i7, 0.55), p = site(i, -1, W + 3.2, 0.4); p.rotation.y += (rnd() - 0.5) * 0.3;
        h.pose('distribIsolated', { plinth: concretePart, carBody: whiteN, face: h.mat('dispenser', GLOW), binOf: whiteN }, p); lightsUp(p, i, -1.2, 1.6, 0xe8f4ff, 11, 2.2); }
      // pts 7-9: the gap on the valley side (trees removed higher up), announced by a viewpoint sign
      h.pose('signView', { pole: steelMat, plate: h.mat('written', retroRefl, 64, 24, '#5a3420', '#f4f0e0', '展望  VIEW', 14) }, marker(h, S[i7 + 6]), [W + 1.6, 0, 0]);
      // pts 9-10: three cars parked facing the view, lights on, and their drivers standing in front
      { const i = at(i9, i10, 0.35), q = marker(h, S[i]), V = (x, z) => q.localToWorld(new THREE.Vector3(x, 0, z));
        h.pose('boxMesh', asphalt, q, [W + 6, -0.35, 0], 10, 0.6, 34);
        [[-11, 0.25, 0xd8d8d0], [-2, -0.1, 0x14161c], [8, 0.2, 0xc8102e]].forEach(([vz, a, col]) => { const v = new THREE.Group(); v.position.set(W + 5, 0, vz); v.rotation.y = a; q.add(v);
          h.pose('carParked', { carBody: h.mat('lacquer', { c: col }), pane, lightRed, lightWhite, chassis: gray, wheelPart, tire }, v); });
        q.updateMatrixWorld();
        (insts(h, 'passerby', { shadows: pane }, [[W + 8.6, -7, 1], [W + 8.9, -6.2, 0.92], [W + 9, 3, 1.04], [W + 3, 4.5, 0.98]].map(([px, pz, t]) => { const p = V(px, pz); return [p.x, p.y, p.z, q.rotation.y, t]; })));
        lightsUp(q, i, W + 11, 1, 0xfff0d0, 16, 2); }
      const lightPylon = h.mat('lightRed', GLOW);
      // the return (pts 41-48): red-bibbed jizō and their candle, then a lit phone booth
      { const i = pt(h, 43), p = site(i, ext(i), W + 2.6, 0.4); h.pose('jizos', { plinth: concretePart, stone, bib: h.mat('lacquer', { c: 0xc8102e }), wood, roofM: gray, fire: lightSoft }, p); lightsUp(p, i, -0.6, 0.4, 0xffa040, 6, 1.2); }
      { const i = pt(h, 46), p = site(i, ext(i), W + 2.8, 0.4); h.pose('cabin', { plinth: concretePart, glassMat: h.mat('showcase', { emis: 1, c: 0xd8ffe0 }), rackFrame: whiteN }, p); lightsUp(p, i, 0, 2, 0xe0ffe8, 12, 2); }

      { // merge: everything above (objects placed one by one, and the small instance groups, unfolded) into one geometry per material and per 150 m cell:
        // one draw pass per material and per cell in view, instead of one per piece or an instance group drawn everywhere (three r128 does not cull them)
        const via = new Map(), M4 = new THREE.Matrix4(), v = new THREE.Vector3(); h.scene.updateMatrixWorld();
        const met = (m, mw) => { const ge = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone(); ge.applyMatrix4(mw); v.setFromMatrixPosition(mw);
          const k = m.material.uuid + (Math.floor(v.x / 150) * 1000 + Math.floor(v.z / 150)); if (!via.has(k)) via.set(k, [m.material]); via.get(k).push(ge); };
        for (const o of h.scene.children.slice(n0)) { h.scene.remove(o);
          o.traverse(m => { if (!m.isMesh) return; if (!m.isInstancedMesh) return met(m, m.matrixWorld); for (let k = 0; k < m.count; k++) { m.getMatrixAt(k, M4); met(m, M4.premultiply(m.matrixWorld)); } }); }
        for (const [mt, ...l] of via.values()) { const ge = new THREE.BufferGeometry();
          for (const [k, sz] of [['position', 3], ['normal', 3], ['uv', 2]]) { const A = new Float32Array(l.reduce((n, e) => n + e.attributes.position.count, 0) * sz); let o = 0; for (const e of l) { A.set(e.attributes[k].array, o); o += e.attributes.position.count * sz; } ge.setAttribute(k, new THREE.BufferAttribute(A, sz)); }
          const m = new THREE.Mesh(ge, mt); ge.computeBoundingSphere(); nears.push(m); h.scene.add(m); } }
      if (line) { // the substation, the pylons (crossarms perpendicular to the line), six conductors per span: from the substation gantry to the anchor
        const o = new THREE.Object3D(), wires = [], at6 = (P, i) => { o.position.set(...P); o.rotation.y = line.ry; o.scale.setScalar(i ? line.k : 1); o.updateMatrixWorld(); return (i ? CONS : GANTRY).map(([lx, ly]) => o.localToWorld(new THREE.Vector3(lx, ly, 0)).toArray()); };
        const gp = new THREE.Group(); gp.position.set(...line.pts[0]); gp.rotation.y = line.ry; h.scene.add(gp);
        h.pose('booth', { slab: h.mat('gravel'), concretePart: h.mat('concretePart'), steelMat: h.mat('matGray'), insulation: h.mat('lacquer', { c: 0xd8dce0 }), lampObj: h.mat('lampObj', GLOW) }, gp);
        gp.updateMatrixWorld(); for (const [lx, lz] of [[-6, -16], [6, -2]]) { const p = gp.localToWorld(new THREE.Vector3(lx, 6, lz)); h.emis(ic, p.x, p.y, p.z, 0xdfe8ff, 24, 2.2); } // the substation's streetlights: it is readable at night
        insts(h, 'pylonHT', { steelMat: h.mat('matGray'), fire: lightPylon }, line.pts.slice(1, 4).map(([x, y, z]) => [x, y, z, line.ry, line.k]));
        const att = line.pts.map(at6); for (let q = 0; q < 4; q++) for (let c = 0; c < 6; c++) for (let j = 0; j < 16; j++) wires.push(...cable(att[q][c], att[q + 1][c], j / 16), ...cable(att[q][c], att[q + 1][c], (j + 1) / 16));
        const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(wires, 3)); const lg = new THREE.LineSegments(fg, new THREE.LineBasicMaterial({ color: 0x23272c })); lg.userData.cables = 1; h.scene.add(lg); }
      const redTone = ville(h, g); // the megalopolis below, west of the hairpins
      return (dt, now) => { blinkerMat.color.setHex((now / 450 & 1) ? 0xff8c1a : 0x3a2008); const r = now % 1500 < 700 ? 0xff2018 : 0x300404; redTone.color.setHex(r); lightPylon.color.setHex(r); water.map.offset.x += dt * 0.3;
        if (views.length) { for (const m of nears) { const b = m.geometry.boundingSphere, d = 180 + b.radius; m.visible = views.some(p => p.distanceToSquared(b.center) < d * d); } views.length = 0; } };
    },
  });
})();
