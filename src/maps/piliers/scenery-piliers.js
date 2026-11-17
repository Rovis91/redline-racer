// Scenery placement for "piliers" (Sky Pillars, blockout): rock shoulders above the ravine, sea of clouds, roadway and bridge deck, then the named blocks of each zone (scenery-piliers-<zone>.js). See docs/methods/NEW-MAP.md, phase 2.
(function () {
  const { near, block, edgePt, terrain } = PLACERS;
  const ZONES = ['foret', 'corniches', 'pont', 'plateaux', 'descente'], LAP = 4041.88, BRIDGE = [1813, 2063]; // LAP: plan length of the proposal, the unit of its chainages (PK); BRIDGE: the deck of the bible
  // the drivable shoulders A (south and west), B (north-west) and C (north-east) of the proposal's plan (construire.py), in metres [east, north]; everything else is the ravine, floor at 0
  const SHOULDERS = [[[40, 100], [380, 100], [640, 30], [790, 180], [910, 170], [1110, 50], [1300, 120], [1350, 340], [1210, 460], [1100, 380], [930, 310], [780, 320], [650, 400], [500, 430], [290, 330], [160, 430], [180, 580], [240, 640], [290, 790], [150, 840], [60, 720], [40, 440]],
    [[145, 610], [230, 850], [350, 890], [460, 820], [470, 640], [510, 570], [580, 590], [580, 780], [650, 940], [825, 960], [825, 880], [730, 840], [700, 650], [660, 480], [470, 460], [380, 540], [350, 710], [280, 700], [240, 590]],
    [[1025, 965], [1170, 970], [1290, 880], [1300, 670], [1280, 540], [1190, 490], [1170, 440], [1290, 390], [1290, 310], [1200, 310], [1080, 420], [1060, 550], [1170, 650], [1170, 800], [1110, 860], [1025, 875]]];
  // metres from (x, north) to the nearest shoulder edge, 0 inside a shoulder
  const outside = (x, n) => { let d = 1e9; for (const P of SHOULDERS) { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [ax, ay] = P[j], [bx, by] = P[i], dx = bx - ax, dy = by - ay;
    if ((by > n) !== (ay > n) && x < (ax - bx) * (n - by) / (ay - by) + bx) c = !c;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (n - ay) * dy) / (dx * dx + dy * dy))); d = Math.min(d, Math.hypot(x - ax - t * dx, n - ay - t * dy)); } if (c) return 0; } return d; };

  Object.assign(SCENERY, {
    piliers(h) {
      const { THREE, S, N, T } = h, pk = i => i / N * LAP, at = p => S[Math.round(p / LAP * N) % N];
      // inside a shoulder the ground follows the road (terrain); outside it falls to the ravine floor, 5 m per metre. The road keeps 16 m of rock beyond its walls where it leaves the plan's polygons, except on the bridge
      const fall = (x, z, y) => { const i = near(h, x, z), s = S[i], p = pk(i), keep = p > BRIDGE[0] && p < BRIDGE[1] ? 1e9 : Math.max(0, Math.hypot(s.x - x, s.z - z) - s.w - 16);
        return Math.min(Math.max(0, y), Math.min(outside(x, -z), keep) * 5); };
      const g = terrain(h, { stepSec: 10, margin: 320, hollow: fall, mat: h.mat('paint', { c: 0x9b9a7e }) });
      const clouds = new THREE.Mesh(new THREE.PlaneGeometry(12000, 12000), h.mat('paint', { c: 0xe6eef0 })); clouds.rotation.x = -Math.PI / 2; clouds.position.set(650, 80, -500); h.scene.add(clouds); // the sea of clouds, 70 m under the lowest road
      // the game draws the roadway at a constant ±W; the walls are at ±s.w (M.wide): the roadway is laid again at the real width, as on givre
      h.ribbon(T.t1, N, s => -s.w, 0, s => s.w, 0, h.mat('roadway', { side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }, ...h.TH.road), 32);
      const i0 = Math.round(BRIDGE[0] / LAP * N); h.ribbon(i0, Math.round(BRIDGE[1] / LAP * N) - i0, s => -s.w, -2, s => s.w, -2, h.mat('paint', { c: 0x687d80, side: THREE.DoubleSide }), 8); // the deck, 2 m thick under the roadway
      // put(label, colour, pk, side, off, w, ht, d, y): a block at chainage pk (m), side -1 = left (outside of the loop) / 1 = right (central ravine), its near face `off` metres from the wall;
      // w across the road, d along it. Set on the lowest ground under it (ht is kept above its centre), or at altitude y when given
      const put = (label, c, p, sd, off, w, ht, d, y) => { const s = at(p), [x, z] = edgePt(s, sd, s.w + off + w / 2), y1 = g.hAt(x, z);
        const y0 = y ?? Math.min(y1, ...[[w, 0], [-w, 0], [0, d], [0, -d]].map(([a, b]) => g.hAt(x + a / 2, z + b / 2)));
        return block(h, label, c, w, ht + (y ?? y1) - y0, d, x, y0, z, h.across(s)); };
      // mass(label, colour, east, north, w, d, top, base, ry): a landmark at the plan's coordinates, w along east and d along north (ry = 0), from altitude `base` (ravine floor: 0) to `top`.
      // Its board is four times the usual size and repeated on four sides (front faces only, so never mirrored): it is read from anywhere round the ravine
      const mass = (label, c, x, n, w, d, top, base = 0, ry = 0) => { const gr = block(h, label, c, w, top - base, d, x, base, -n, ry), b = gr.children[gr.children.length - 1], lw = b.geometry.parameters.width * 4;
        b.material = b.material.clone(); b.material.side = THREE.FrontSide; b.scale.setScalar(4); b.position.y = top - base + 4 + lw / 8;
        for (let k = 1; k < 4; k++) { const b2 = b.clone(); b2.rotation.y = k * Math.PI / 2; gr.add(b2); } for (const q of gr.children.slice(-4)) q.translateZ(lw / 2);
        const r = Math.hypot(w, d) / 2; if (S.some(s => Math.hypot(s.x - x, s.z + n) < r + s.w + 2)) console.warn('piliers: ' + label + ' may stand on the road'); return gr; }; // coarse check (bounding circle): a warning means look at it, not that it overlaps
      for (const z of ZONES) PILIERS[z]({ h, g, put, mass, S, N, at });
    },
  });
})();
