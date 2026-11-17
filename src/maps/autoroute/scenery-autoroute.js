// Scenery placement for "autoroute" (Sunken Highway V2, blockout): flooded basin, terrace, viaduct deck and piers, then the named blocks of each zone (scenery-autoroute-<zone>.js). See docs/methods/NEW-MAP.md, phase 2.
(function () {
  const { near, block, edgePt, terrain, inst } = PLACERS;
  const ZONES = ['corniche', 'machines', 'viaduc', 'boulevard', 'reconquete'], LAP = 5228, X1 = 735, FLOOR = -3; // LAP: plan length of the proposal, the unit of its chainages (PK); X1: PK of the upper road over the crossing (the lower one passes at PK 3349)

  Object.assign(SCENERY, {
    autoroute(h) {
      const { THREE, S, N } = h, idx = pk => Math.round(pk / LAP * N) % N, at = pk => S[idx(pk)], conc = h.mat('paint', { c: 0x8f8c82, side: THREE.DoubleSide });
      // the road lies on the ground on the west terrace (x < -640) and in the drowned streets (under 6 m); everywhere else it is a viaduct over a basin floor at -3 m, under the water plane at 0.
      // Under the viaduct the floor rises to the nearest laid road within 140 m: the terrace embankment, the foot of the ramp, and the street under the crossing (the terrain does not cut the lower road)
      const low = s => s.y < 6 || s.x < -640, lows = S.filter((s, i) => low(s) && i % 5 === 0), G = new Map();
      const ground = s => { if (low(s)) return s.y; if (!G.has(s)) { let d = 1e9, b; for (const l of lows) { const e = Math.hypot(l.x - s.x, l.z - s.z); if (e < d) { d = e; b = l; } }
        const t = Math.min(1, Math.max(0, (d - 40) / 100)); G.set(s, Math.min(s.y, b.y + (FLOOR - b.y) * t * t * (3 - 2 * t))); } return G.get(s); };
      // beside the streets (road under 3 m) the ground sinks from 4 m off the wall: the water bites the pavements
      const flood = (x, z) => { const s = S[near(h, x, z)]; return s.y < 3 ? Math.min(2.5, Math.max(0, Math.hypot(s.x - x, s.z - z) - s.w - 4) * 0.5) : 0; };
      const g = terrain(h, { stepSec: 10, margin: 320, ground, hollow: flood, mat: h.mat('paint', { c: 0x6f7a5a }) });
      const water = new THREE.Mesh(new THREE.PlaneGeometry(12000, 12000), h.mat('paint', { c: 0x29c0c4 })); water.rotation.x = -Math.PI / 2; h.scene.add(water);
      // the viaduct (one run, from just after the start to the foot of the ramp): a 2 m deck under the road, and a pier every 60 m counted from 15 m either side of the crossing, so that none stands in the lower road
      const el = S.map(s => ground(s) < s.y - 0.5), i0 = el.indexOf(true), n = el.lastIndexOf(true) - i0 + 1, piers = [];
      h.ribbon(i0, n, s => -s.w, -2, s => s.w, -2, conc, 8); for (const sd of [-1, 1]) h.ribbon(i0, n, s => sd * s.w, 0, s => sd * s.w, -2, conc, 8);
      for (let pk = (X1 - 15) % 60; pk < LAP; pk += pk === X1 - 15 ? 30 : 60) { const i = idx(pk), s = S[i], y0 = g.hAt(s.x, s.z) - 1; if (el[i] && s.y - 2 - y0 > 1) piers.push([s.x, (s.y - 2 + y0) / 2, s.z, h.across(s), 2.4, s.y - 2 - y0, 0.6]); }
      inst(h, h.geo('pierViaduct'), conc, piers);
      // put(label, colour, pk, side, off, w, ht, d, y): a block at chainage pk (m), side -1 = left / 1 = right, its near face `off` metres from the wall; w across the road, d along it.
      // Set on the lowest ground under it (ht is kept above its centre), or base at altitude y when given (-4: on the basin floor, ht = top + 4; the road's altitude: on a shoulder)
      const put = (label, c, pk, sd, off, w, ht, d, y) => { const s = at(pk), [x, z] = edgePt(s, sd, s.w + off + w / 2), y1 = g.hAt(x, z);
        const y0 = y ?? Math.min(y1, ...[[w, 0], [-w, 0], [0, d], [0, -d]].map(([a, b]) => g.hAt(x + a / 2, z + b / 2))), top = ht + (y ?? y1);
        // self-check: the layout crosses itself and its two loops come close, a block set from one stretch can land on another
        if (S.some(t => Math.abs((t.x - x) * -s.tz + (t.z - z) * s.tx) < w / 2 + t.w && Math.abs((t.x - x) * s.tx + (t.z - z) * s.tz) < d / 2 + t.w && y0 < t.y + 5 && top > t.y - 2.5)) console.warn('autoroute: block on the road', label, pk);
        return block(h, label, c, w, top - y0, d, x, y0, z, h.across(s)); };
      // spot(label, colour, x, z, w, top, d): a far landmark at map coordinates, from the ground up to altitude `top`
      const spot = (label, c, x, z, w, top, d) => { const y0 = g.hAt(x, z) - 1; return block(h, label, c, w, top - y0, d, x, y0, z); };
      // shoulder(pk0, pk1, side, w): a closed lane behind the wall, at the road's level and gradient; blocks stand on it with y = at(pk).y
      const shoulder = (pk0, pk1, sd, w) => { const i = idx(pk0), c = idx(pk1) - i, a = s => sd * s.w, b = s => sd * (s.w + w); for (const y of [0, -2]) h.ribbon(i, c, a, y, b, y, conc, 8); h.ribbon(i, c, b, 0, b, -2, conc, 8); };
      // gantry(pk): a sign gantry across the road, 7 m clear
      const gantry = pk => { const s = at(pk); for (const sd of [-1, 1]) { const [x, z] = edgePt(s, sd, s.w + 1); h.pose('boxMesh', conc, h.scene, [x, s.y + 3.5, z], 0.8, 7, 0.8); }
        return block(h, 'PORTIQUE', 0x2f6a5a, 2 * s.w + 4, 1.6, 1, s.x, s.y + 7, s.z, h.across(s)); };
      for (const z of ZONES) AUTOROUTE[z]({ h, g, put, spot, shoulder, gantry, at });
    },
  });
})();
