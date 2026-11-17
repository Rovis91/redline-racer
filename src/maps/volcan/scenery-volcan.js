// Scenery placement for "volcan" (Volcanic Island V2, blockout): terrain, cone, sea, then the named blocks of each zone (scenery-volcan-<zone>.js). See docs/methods/NEW-MAP.md, phase 2.
(function () {
  const { near, block, edgePt, terrain } = PLACERS;
  const ZONES = ['quais', 'serpent', 'galeries', 'couronne', 'cendres', 'phare'], LAP = 6906; // LAP: plan length of the proposal, the unit of its chainages (PK)
  const CONE = { x: -113, z: -906, top: 620, slope: 0.95 };                                   // main cone, read on the plan of the bible: 620 m, about 500 m of base radius, off the road

  Object.assign(SCENERY, {
    volcan(h) {
      const { THREE, S, N } = h, P = h.M.pts;
      // the loop runs clockwise: the island is on the right (side 1), the sea on the left (side -1)
      const inside = (x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > z) !== (P[j][1] > z) && x < (P[j][0] - P[i][0]) * (z - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) c = !c; return c; };
      // inside the loop: a gentle apron from 22 m off the axis, then the cone where it stands above the ground; along the corniche and the galleries a 45 m rock wall
      // (PK 950 to 3000: it draws back at the exit of T2, where the needle shows); outside it falls to a seabed at -8 m, 2 m per metre, from a 16 m ledge (a 70 m quay along the harbour, PK 6300 to 900)
      const ss = (a, b, v) => { const k = Math.max(0, Math.min(1, (v - a) / (b - a))); return k * k * (3 - 2 * k); };
      const relief = (x, z, y) => { const i = near(h, x, z), s = S[i], d = Math.hypot(s.x - x, s.z - z), pk = i / N * LAP;
        if (!inside(x, z)) return Math.min(y + 8, Math.max(0, d - (pk < 900 || pk > 6300 ? 70 : 16)) * 2);
        const wall = ss(950, 1100, pk) * (1 - ss(2950, 3050, pk)), e = d - 22, apron = e < 118 ? e * 0.15 : 17.7 + (e - 118) * 2.5;
        return -Math.max(0, Math.min(CONE.top - Math.hypot(x - CONE.x, z - CONE.z) * CONE.slope - y, apron), wall * Math.min(e * 1.2, 45)); };
      const g = terrain(h, { stepSec: 10, margin: 320, hollow: relief, mat: h.mat('paint', { c: 0x6a5d52 }) });
      const sea = new THREE.Mesh(new THREE.PlaneGeometry(14000, 14000), h.mat('paint', { c: 0x194b72 })); sea.rotation.x = -Math.PI / 2; sea.position.set(-100, 0, -800); h.scene.add(sea);
      const at = pk => S[Math.round(pk / LAP * N) % N], B = (label, ...a) => { const b = block(h, label, ...a); if (!label) b.remove(b.children[b.children.length - 1]); return b; }; // '' = no label plate
      // put(label, colour, pk, side, off, w, ht, d, y): a block at chainage pk (m), side -1 = left (sea) / 1 = right (island), its near face `off` metres from the wall;
      // w across the road, d along it. Set on the lowest ground under it (ht is kept above its centre), or at altitude y when given (water level: 0)
      const put = (label, c, pk, sd, off, w, ht, d, y) => { const s = at(pk), [x, z] = edgePt(s, sd, s.w + off + w / 2), y1 = g.hAt(x, z);
        const y0 = y ?? Math.min(y1, ...[[w, 0], [-w, 0], [0, d], [0, -d]].map(([a, b]) => g.hAt(x + (b * s.tx - a * s.tz) / 2, z + (b * s.tz + a * s.tx) / 2)));
        return B(label, c, w, ht + (y ?? y1) - y0, d, x, y0, z, h.across(s)); };
      // abs(label, colour, x, z, w, ht, d): a block at a spot of the plan, set on the lowest ground under it
      const abs = (label, c, x, z, w, ht, d) => { const y1 = g.hAt(x, z), y0 = Math.min(y1, ...[[w, d], [-w, d], [w, -d], [-w, -d]].map(([a, b]) => g.hAt(x + a / 2, z + b / 2))); return B(label, c, w, ht + y1 - y0, d, x, y0, z); };
      // over(label, colour, pk, w, ht, d, y): a slab across the road, centred on the axis, its underside y metres above the roadway
      const over = (label, c, pk, w, ht, d, y) => { const s = at(pk); return B(label, c, w, ht, d, s.x, s.y + y, s.z, h.across(s)); };
      abs('VOLCAN 620 M', 0x2a2d31, CONE.x, CONE.z, 70, 14, 70);
      for (const z of ZONES) VOLCAN[z]({ h, g, put, abs, over, at });
    },
  });
})();
