// Scenery placement for "egee" (Aegean Cliffs V2, blockout): terrain, sea, roadway, then the named blocks of each zone (scenery-egee-<zone>.js). See docs/methods/NEW-MAP.md, phase 2.
(function () {
  const { near, block, edgePt, terrain } = PLACERS;
  const ZONES = ['port', 'ascension', 'village', 'balcon', 'descente'], LAP = 4700; // LAP: plan length of the proposal, the unit of its chainages (PK)

  Object.assign(SCENERY, {
    egee(h) {
      const { THREE, S, N, T } = h, P = h.M.pts;
      // the island: inside the loop the ground follows the road (terrain); outside it falls to the sea from 20 m off the axis, 1.5 m per metre, down to a seabed at -8 m
      const inside = (x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > z) !== (P[j][1] > z) && x < (P[j][0] - P[i][0]) * (z - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) c = !c; return c; };
      const fall = (x, z, y) => { if (inside(x, z)) return 0; const s = S[near(h, x, z)]; return Math.min(y + 8, Math.max(0, Math.hypot(s.x - x, s.z - z) - 20) * 1.5); };
      const g = terrain(h, { stepSec: 10, margin: 320, hollow: fall, mat: h.mat('paint', { c: 0xd7ac74 }) });
      const sea = new THREE.Mesh(new THREE.PlaneGeometry(12000, 12000), h.mat('paint', { c: 0x1eb3bd })); sea.rotation.x = -Math.PI / 2; sea.position.set(0, 0, -550); h.scene.add(sea);
      // the game draws the roadway at a constant ±W; the walls are at ±s.w (M.wide): the roadway is laid again at the real width, as on givre
      h.ribbon(T.t1, N, s => -s.w, 0, s => s.w, 0, h.mat('roadway', { side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }, ...h.TH.road), 32);
      // put(label, colour, pk, side, off, w, ht, d, y): a block at chainage pk (m), side -1 = left (island) / 1 = right (sea), its near face `off` metres from the wall;
      // w across the road, d along it. Set on the lowest ground under it (ht is kept above its centre), or at altitude y when given (water level: 0)
      const put = (label, c, pk, sd, off, w, ht, d, y) => { const s = S[Math.round(pk / LAP * N) % N], [x, z] = edgePt(s, sd, s.w + off + w / 2), y1 = g.hAt(x, z);
        const y0 = y ?? Math.min(y1, ...[[w, 0], [-w, 0], [0, d], [0, -d]].map(([a, b]) => g.hAt(x + a / 2, z + b / 2)));
        return block(h, label, c, w, ht + (y ?? y1) - y0, d, x, y0, z, h.across(s)); };
      for (const z of ZONES) EGEE[z]({ h, g, put, S, N, at: pk => S[Math.round(pk / LAP * N) % N] });
    },
  });
})();
