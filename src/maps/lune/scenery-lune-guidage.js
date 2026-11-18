// "lune", guidance (round 5): what tells the player where to go, and the edge of the road. Runs after the five zones (ZONES of scenery-lune.js). Shapes: shapes-lune-guidage.js; the halos of the lamps are drawn by scenery-lune-vie.js.
// Colour code of the map: LEFT of the road = cold cyan, RIGHT = amber (a car coming out of the tunnel reads it at once, and the lamps of the hall, the masts and the mouth beacons are already amber).
//  1. The arena: a corridor of gates from the landing to the mouth of the tunnel, drawn round the small craters (M.dents): a pair of lamp posts every 28 m (7.5 m either side of the path), a row of low pylons at 5.8 m either side every 9 m, arrow boards
//     two gates before each change of side. The path is computed here from the dents (dynamic programming over the lateral offset to the axis lip-tunnel: clear of every crater, the least detour, at the axis at the mouth). Nothing stands on the path.
//  2. The bends of the road (tunnel exit to lip, outside the start hall): an arrow board on the outside, 50 samples (100 m) before each one, bigger at the hairpins, and a row of poles every 12 m on its outside.
//  3. The edge of the road: no guardrail on the Moon. A low berm of regolith thrown up along the track (inner face exactly on the collision line, ±s.w), a strip of plates on its face, marker posts linked by a cable.
(window.LUNE = window.LUNE || {}).guidage = ({ h, g, S, N, T, M, EAST, iLip, nArena, LAP, stand, add, edgePt, THREE }) => {
  const nOut = (iLip - T.t1 + N) % N, smp = pk => Math.round(pk / LAP * N) % N, DS = { side: THREE.DoubleSide }, side = sd => sd > 0 ? 1 : -1;

  // ---------- 3. the berms ----------
  { const bm = h.mat('regolitheLune', DS, '#7a7f8e'), pl = h.mat('coqueLune', DS, '#d6d1c2'), cb = h.mat('concreteDark', DS);
    for (const sd of [-1, 1]) { const o = d => s => sd * (s.w + d), R = (d0, y0, d1, y1, m, v = 8) => h.ribbon(T.t1, nOut, o(d0), y0, o(d1), y1, m, v);
      R(0, -2, 0, 0.95, bm); R(0, 0.95, 0.5, 1.05, bm); R(0.5, 1.05, 1.1, 1.0, bm); R(1.1, 1, 3, -1.2, bm); R(-0.03, 0.5, -0.03, 0.95, pl, 4); R(0.7, 2.4, 0.7, 2.5, cb); // the cable: a vertical thread 10 cm high, 1.4 m over the top of the berm
      for (let k = 6; k < nOut - 6; k += 12) { const i = (T.t1 + k) % N, s = S[i], [x, z] = edgePt(s, sd, s.w + 0.7); add(stand(x, z, h.across(s), s.y + 1), 'pieuLune', [side(sd)]); } } }

  // ---------- 1. the arena: gates between the craters ----------
  const D = M.dents, P0 = k => S[(iLip + k) % N], pt = (k, o) => { const s = P0(k); return [s.x - s.tz * o, s.z + s.tx * o]; }, clear = (x, z, m) => D.every(([cx, cz, r]) => Math.hypot(x - cx, z - cz) >= r + m);
  let k0 = 0; while (k0 < nArena && Math.hypot(P0(k0).x - EAST[0], P0(k0).z - EAST[1]) > 215) k0++;
  const ks = []; for (let k = nArena - 7; k >= k0; k -= 14) ks.unshift(k);
  const OF = []; for (let o = -34; o <= 34; o += 2) OF.push(o);
  const gateCost = (j, o) => (clear(...pt(ks[j], o), 6) && clear(...pt(ks[j], o - 7.5), 1) && clear(...pt(ks[j], o + 7.5), 1) ? 0 : 1e3) + o * o * 0.004 + (j === ks.length - 1 && o ? 1e6 : 0);
  const segCost = (j, o0, o1) => { let c = (o1 - o0) ** 2 * 0.02 + (Math.abs(o1 - o0) > 22 ? 1e6 : 0); for (let q = 1; q < 5; q++) { const k = ks[j] + (ks[j + 1] - ks[j]) * q / 5, o = o0 + (o1 - o0) * q / 5, s = P0(Math.round(k)); if (!clear(s.x - s.tz * o, s.z + s.tx * o, 3.5)) c += 1e3; } return c; };
  const best = [OF.map(o => ({ c: gateCost(0, o), p: -1 }))];
  for (let j = 1; j < ks.length; j++) best.push(OF.map((o, a) => { let b = { c: 1e12, p: 0 }; OF.forEach((o0, a0) => { const c = best[j - 1][a0].c + segCost(j - 1, o0, o); if (c < b.c) b = { c, p: a0 }; }); b.c += gateCost(j, o); return b; }));
  const O = []; { let a = best[ks.length - 1].reduce((m, b, i, A) => b.c < A[m].c ? i : m, 0); for (let j = ks.length - 1; j >= 0; j--) { O[j] = OF[a]; a = best[j][a].p; } }
  const PP = ks.map((k, j) => pt(k, O[j])), dir = j => { const a = PP[Math.max(0, j - 1)], b = PP[Math.min(PP.length - 1, j + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]); return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
  const ry = ([dx, dz]) => Math.atan2(-dx, -dz), at = ([x, z], [dx, dz], lat) => [x - dz * lat, z + dx * lat]; // lateral + = the driver's right
  PP.forEach((p, j) => { const d = dir(j); for (const sd of [-1, 1]) { const [x, z] = at(p, d, sd * 7.5); add(stand(x, z, ry(d)), 'jalonLune', [4.5, side(sd)]); } });
  for (let j = 0; j < PP.length - 1; j++) { const a = PP[j], b = PP[j + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), d = [(b[0] - a[0]) / L, (b[1] - a[1]) / L], n = Math.round(L / 9);
    for (let q = 0; q < n; q++) for (const sd of [-1, 1]) { const p = [a[0] + (b[0] - a[0]) * q / n, a[1] + (b[1] - a[1]) * q / n], [x, z] = at(p, d, sd * 5.8); if (clear(x, z, 0.5)) add(stand(x, z, ry(d)), 'plotLune', [side(sd)]); } }
  // an arrow board two gates before each change of side, on the outside of the turn, 13 m from the path
  for (let j = 2; j < PP.length - 2; j++) { const a = O[j] - O[j - 1], b = O[j + 1] - O[j];
    if (Math.abs(b) >= 4 && (a === 0 || Math.sign(a) !== Math.sign(b)) && Math.abs(O[j + 1] - O[j - 1]) >= 4) { const turn = Math.sign(b), jb = Math.max(0, j - 2), d = dir(jb); let lat = -turn * 13, [x, z] = at(PP[jb], d, lat); if (!clear(x, z, 3)) [x, z] = at(PP[jb], d, lat = -lat);
      add(stand(x, z, ry(d)), 'flecheLune', [turn]); } }

  // ---------- 2. the bends of the road: an arrow board before, poles on the outside ----------
  const turn = i => { const a = S[(i - 8 + N) % N], b = S[(i + 8) % N]; return a.tx * b.tz - a.tz * b.tx; }; // > 0: to the right
  const inHall = i => i >= smp(LAP - 60) || i <= smp(122), runs = [];
  for (let k = 8; k < nOut - 8; k++) { const i = (T.t1 + k) % N, t = turn(i); if (Math.abs(t) > 0.17 && !inHall(i)) { const r = runs[runs.length - 1], d = Math.sign(t); if (r && r.d === d && k - r.k1 <= 12) { r.k1 = k; r.pk = Math.max(r.pk, Math.abs(t)); } else runs.push({ k0: k, k1: k, d, pk: Math.abs(t) }); } }
  runs.filter(r => r.k1 - r.k0 >= 8).forEach((r, n, A) => { const prev = A[n - 1], lead = Math.max(16, Math.min(50, prev ? r.k0 - prev.k1 - 6 : 50)), i0 = (T.t1 + r.k0 - lead + N) % N, s0 = S[i0], hair = r.pk > 0.5;
    if (!inHall(i0)) { const [x, z] = edgePt(s0, -r.d, s0.w + 5), grp = stand(x, z, h.across(s0)); add(grp, 'flecheLune', [r.d]); if (hair) grp.scale.setScalar(1.5); }
    for (let k = r.k0 - 4; k <= r.k1 + 4; k += 6) { const s = S[(T.t1 + k + N) % N], [x, z] = edgePt(s, -r.d, s.w + 2.8); add(stand(x, z, h.across(s)), 'poteauLune', [3, -r.d]); } });
};
