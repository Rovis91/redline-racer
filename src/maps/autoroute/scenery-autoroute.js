// Scenery placement for "autoroute" (Sunken Highway, layout 3, blockout): city ground, flooded stretches, bridge deck and piers, metro cutting, then the named blocks of each zone (scenery-autoroute-<zone>.js). See docs/methods/NEW-MAP.md, phase 2.
(function () {
  const { near, block, edgePt, terrain, inst } = PLACERS;
  const ZONES = ['rue', 'quartier', 'bretelle', 'impasse', 'metro'], LAP = 2791, CITY = 2.5; // LAP: plan length of the layout, the unit of the chainages (PK); CITY: altitude of the dry streets, the water is at 0

  Object.assign(SCENERY, {
    autoroute(h) {
      const { THREE, S, N, T } = h, idx = pk => Math.round(pk / LAP * N) % N, at = pk => S[idx(pk)], conc = h.mat('paint', { c: 0x8f8c82, side: THREE.DoubleSide });
      // the road lies on the ground, except on the slip road and the bridge (the city stays at CITY under them) and in the metro (the city passes over it); its two ramps are open cuttings
      const metro = new Set(S.slice(T.t0, T.t1 + 1)), ground = s => metro.has(s) ? CITY : Math.min(s.y, CITY), wet = s => s.y > 0 && s.y < 1.2 && Math.abs(s.sl) < 0.02; // wet: a low, level street (the metro ramps also pass through these altitudes)
      // relief(x, z, y) = metres to remove: beside a low street (road under 1.2 m) the ground sinks from 2 m off the wall, up to 90 m away: water in the gutters and the side streets;
      // over the metro it is raised (negative) above the vault, where the cuttings would pull it down into the tunnel
      const relief = (x, z, y) => { const s = S[near(h, x, z)], d = Math.hypot(s.x - x, s.z - z) - s.w;
        if (metro.has(s)) return d < 4 ? Math.min(0, y - (s.y + 8)) : 0;
        return wet(s) ? Math.min(1.8, Math.max(0, d - 2) * 0.6) * Math.min(1, Math.max(0, (90 - d) / 10)) : 0; };
      const g = terrain(h, { stepSec: 10, margin: 260, ground, hollow: relief, mat: h.mat('paint', { c: 0x6f7a5a }) });
      // one water sheet per flooded stretch, 100 m around it: no water plane over the whole map, the metro cuttings go below 0
      for (let i = 1; i < N; i++) if (wet(S[i]) && !wet(S[i - 1])) { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (let j = i; j < N && wet(S[j]); j++) { const s = S[j]; x0 = Math.min(x0, s.x); x1 = Math.max(x1, s.x); z0 = Math.min(z0, s.z); z1 = Math.max(z1, s.z); }
        const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0 + 200, z1 - z0 + 200), h.mat('paint', { c: 0x2a8f8a })); m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2); h.scene.add(m); }
      // the game draws the roadway at a constant ±W; the walls are at ±s.w (M.wide: slip road and bridge): the open-air roadway is laid again at the real width, as on givre
      h.ribbon(T.t1, N - (T.t1 - T.t0), s => -s.w, 0, s => s.w, 0, h.mat('roadway', { side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }, ...h.TH.road), 32);
      // slip road and bridge (one run): a 2 m deck under the road, a pier every 40 m except within 10 m of the street that passes under
      const el = S.map(s => ground(s) < s.y - 0.5), i0 = el.indexOf(true), n = el.lastIndexOf(true) - i0 + 1, laid = S.filter((s, i) => !el[i]), piers = [];
      h.ribbon(i0, n, s => -s.w, -2, s => s.w, -2, conc, 8); for (const sd of [-1, 1]) h.ribbon(i0, n, s => sd * s.w, 0, s => sd * s.w, -2, conc, 8);
      for (let i = i0 + 10; i < i0 + n; i += 20) { const s = S[i], y0 = g.hAt(s.x, s.z) - 1; if (s.y - 2 - y0 > 1 && !laid.some(t => Math.hypot(t.x - s.x, t.z - s.z) < t.w + 4)) piers.push([s.x, (s.y - 2 + y0) / 2, s.z, h.across(s), 2, s.y - 2 - y0, 0.6]); }
      inst(h, h.geo('pierViaduct'), conc, piers);
      // put(label, colour, pk, side, off, w, ht, d, y): a block at chainage pk (m), side -1 = left / 1 = right, its near face `off` metres from the wall (-(s.w + w / 2): centred on the axis); w across the road, d along it.
      // Set on the lowest ground under it (ht is kept above its centre), or base at altitude y when given (the road's altitude: on a shoulder)
      const put = (label, c, pk, sd, off, w, ht, d, y) => { const s = at(pk), [x, z] = edgePt(s, sd, s.w + off + w / 2), y1 = g.hAt(x, z);
        const y0 = y ?? Math.min(y1, ...[[w, 0], [-w, 0], [0, d], [0, -d]].map(([a, b]) => g.hAt(x + a / 2, z + b / 2))), top = ht + (y ?? y1);
        // self-check: the bridge crosses the start straight and the streets run close to each other, a block set from one stretch can land on another
        if (S.some(t => Math.abs((t.x - x) * -s.tz + (t.z - z) * s.tx) < w / 2 + t.w && Math.abs((t.x - x) * s.tx + (t.z - z) * s.tz) < d / 2 + t.w && y0 < t.y + 5 && top > t.y - 2.5)) console.warn('autoroute: block on the road', label, pk);
        return block(h, label, c, w, top - y0, d, x, y0, z, h.across(s)); };
      // shoulder(pk0, pk1, side, w): a closed lane behind the wall, at the road's level and gradient; blocks stand on it with y = at(pk).y
      const shoulder = (pk0, pk1, sd, w) => { const i = idx(pk0), c = idx(pk1) - i, a = s => sd * s.w, b = s => sd * (s.w + w); for (const y of [0, -2]) h.ribbon(i, c, a, y, b, y, conc, 8); h.ribbon(i, c, b, 0, b, -2, conc, 8); };
      // gantry(pk, label): a sign gantry across the road, 7 m clear
      const gantry = (pk, label) => { const s = at(pk); for (const sd of [-1, 1]) { const [x, z] = edgePt(s, sd, s.w + 1); h.pose('boxMesh', conc, h.scene, [x, s.y + 3.5, z], 0.8, 7, 0.8); }
        return block(h, label, 0x2f6a5a, 2 * s.w + 4, 1.6, 1, s.x, s.y + 7, s.z, h.across(s)); };
      for (const z of ZONES) AUTOROUTE[z]({ h, g, put, shoulder, gantry, at });
    },
  });
})();
