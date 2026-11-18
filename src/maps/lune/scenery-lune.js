// Scenery placement for "lune" (Lunar Outpost): terrain with its craters and the arena, roadway, guardrails, the shared materials, the horizon, then each zone (scenery-lune-<zone>.js).
// Shapes: shapes-lune-*.js; textures: textures-lune.js; mood and references: docs/proposals/lunar-outpost/AMBIANCE-V2.html. See docs/methods/NEW-MAP.md, phase 3.
(function () {
  const { near, edgePt, terrain, weld } = PLACERS;
  const ZONES = ['base', 'occidental', 'cretes', 'arene', 'bassin'], LAP = 5288; // LAP: plan length of the layout, the unit of its chainages (PK)
  // A crater in section: a flat floor, an inner wall that curves up ever steeper to a sharp crest, an outer slope that falls steeply from the crest and flattens out (both concave, power P).
  // The two craters the road enters: [x east, z = -north, floor radius, rim radius, outer foot radius, floor altitude, rim altitude]. EAST is the arena: inside M.place its ground is M.bowls, the same curve
  const P = 2.5, EAST = [470, -200, 200, 360, 520, -30, 70], SOUTH = [283, 383, 60, 222, 300, -28, 25]; // the two rims are 30 m apart: each crater is a full circle
  // the craters the road only passes: [x, z, radius, floor altitude]: western crater, satellite impact, the two fresh impacts of the chicane
  const BESIDE = [[-555, -101, 272, -32], [-232, 232, 146, -10], [-885, -10, 30, 15], [-838, -130, 30, 20]];

  Object.assign(SCENERY, {
    lune(h) {
      const { THREE, S, N, T, M, W } = h, ss = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }, PL = M.place, DS = { side: THREE.DoubleSide };
      const iLip = near(h, ...M.pts[M.jumps[0][0]].slice(0, 2)), nArena = (T.t0 - iLip + N) % N, nTun = (T.t1 - T.t0 + N) % N, nOut = (iLip - T.t1 + N) % N; // the lap in three: road (tunnel exit to lip), arena (lip to tunnel), tunnel
      // the profile of an entered crater at (x, z); beyond its outer foot, y: the ground the road gives there, which the outer slope joins
      const bowl = ([cx, cz, rf, rr, ro, yf, yr], x, z, y) => { const r = Math.hypot(x - cx, z - cz); return r > ro ? y : r < rf ? yf : r < rr ? yf + (yr - yf) * ((r - rf) / (rr - rf)) ** P : y + (yr - y) * (1 - (r - rr) / (ro - rr)) ** P; };
      const inside = ([cx, cz, , rr], x, z) => Math.hypot(x - cx, z - cz) < rr;
      const OVER = new Set(); // the terrain vertices raised over the tunnel
      const shape = (x, z, y) => {
        const i = near(h, x, z), s = S[i], d = Math.hypot(s.x - x, s.z - z), k = (i - iLip + N) % N, rE = Math.hypot(x - EAST[0], z - EAST[1]), tun = k >= nArena && k < nArena + nTun;
        if (k < nArena && d < s.w + 1) return y - (s.y + 0.08 + T.dent(x, z));             // from the lip to the tunnel the ground is what the car drives on: the ribbon (which comes down from the lip under the flight) plus the bowl and its small craters; it covers the engine's roadway
        const floor = rE < PL.r ? EAST[5] + 0.08 + T.dent(x, z) : null;                    // the arena: M.bowls and M.dents, as in the physics
        const tE = bowl(EAST, x, z, y), tS = bowl(SOUTH, x, z, y);
        let t = floor ?? (inside(EAST, x, z) ? tE : inside(SOUTH, x, z) ? tS : Math.max(tE, tS)); // inside a rim, that crater alone; outside both, the higher of the two outer slopes: a valley between the two crests
        if (tun) { if (d < W + 9 && t < s.y + 10.5) { t = s.y + 10.5; OVER.add(Math.fround(x) + "," + Math.fround(z)); } return y - t; } // over the tunnel the ground is kept above the vault from one mouth to the other: a berm where the bowl is still low
        if (floor != null) return y - t;
        if (k >= nArena + nTun) t += (y - t) * (1 - ss((d - s.w - 6) / 40));               // elsewhere the road stays laid: its own level up to 6 m from the wall, the crater profile 40 m further
        let c = 0; for (const [cx, cz, r, f] of BESIDE) { const q = Math.hypot(x - cx, z - cz) / r; if (q < 1) c = Math.max(c, (t - f) * (1 - q ** P)); }
        return y - t + Math.min(c, Math.max(0, d - 16) * 0.8);                             // passed craters: the same concave bowl, carved from 16 m off the axis, at most 0.8 m per metre
      };
      // ground: regolith everywhere, bare stratified rock where it is steep (crater walls, cuttings)
      const g = terrain(h, { stepSec: 8, margin: 480, hollow: shape, mat: h.mat('regolitheLune'), layerSet: [{ tex: ['rocheLune', '#636a78'], slope: [0.3, 0.55] }] });
      // a height field cannot open a tube: the faces that would cross the tunnel (one corner on the berm, their centre over the roadway) are taken out; the engine's hull closes the slot from above
      { const geo = g.mesh.geometry, p = geo.attributes.position, ix = geo.index.array, keep = [], over = i => OVER.has(p.getX(i) + "," + p.getZ(i));
        for (let f = 0; f < ix.length; f += 3) { const [a, b, c] = [ix[f], ix[f + 1], ix[f + 2]], cx = (p.getX(a) + p.getX(b) + p.getX(c)) / 3, cz = (p.getZ(a) + p.getZ(b) + p.getZ(c)) / 3, q = S[near(h, cx, cz)];
          if (!((over(a) || over(b) || over(c)) && Math.hypot(q.x - cx, q.z - cz) < W + 4)) keep.push(a, b, c); }
        geo.setIndex(keep); }
      // the game draws the roadway at a constant ±W all round the lap: here it is hidden (no road down the crater wall nor across the arena) and laid again at the real width (±s.w, M.wide), from the tunnel exit to the lip
      { const road = h.scene.children.find(o => o.material && o.material.userData && o.material.userData.mo === 1 && o.material.userData.mo0 == null); if (road) road.visible = false; }
      h.ribbon(T.t1, nOut, s => -s.w, 0, s => s.w, 0, h.mat('roadway', { ...DS, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }, ...h.TH.road), 32);
      // th.guardM = 0: the guardrails are placed here, on the same stretch only: none under the flight, none across the arena
      for (const sd of [-1, 1]) h.guardM(sd, T.t1, nOut, s => sd * s.w, h.TH.wallH, s => sd * s.w, -2, h.mat('guardrail', DS, h.TH.intoWall));
      // MAT: the shared materials of the map, one draw pass each for the whole map; its keys are the zone names of the lune shapes (shapes-lune-*.js). Every piece of scenery goes into the group `kit`, merged per material at the end
      const MAT = { shell: h.mat('coqueLune', {}, '#e8e2d0'), hall: h.mat('coqueLune', {}, '#9aa0ac'), dark: h.mat('concreteDark'), steel: h.mat('steelMat'), lattice: h.mat('lattice', { alphaTest: 0.5, ...DS }, '#c8c4b8'),
        amber: h.mat('metalPale', { c: 0xd78a40 }), glow: h.mat('paint', { emis: 1, c: 0xffa040 }), hublot: h.mat('hublotLune', { emis: 1 }, '#ffe9b8'), ceil: h.mat('hublotLune', { emis: 1 }, '#cfe8ff'), solar: h.mat('solaireLune'),
        glass: h.mat('paneDark'), dish: h.mat('metalPale', { c: 0xe8e2d0, ...DS }), rock: h.mat('rocheLune', {}, '#5d6472'), pale: h.mat('rocheLune', {}, '#a9afba', 0.6), far: h.mat('rocheLune', {}, '#3a404c', 0.4),
        strata: h.mat('rocheLune', DS, '#3d4452', 0.5), crest: h.mat('regolitheLune', DS, '#c4c8d2'), plain: h.mat('regolitheLune', {}, '#565b68'), earth: h.mat('terreLune', { emis: 1, fog: false }) };
      MAT.tire = MAT.dark;
      const kit = new THREE.Group(); h.scene.add(kit);
      // rings laid on the ground, one mesh per material: the strata of a crater wall, the pale crest of a rim, the dark bottom of a small crater. ring(x, z, radii from inside to outside, material, [[angle, half-width], …] left open)
      const BANDS = new Map(), ring = (cx, cz, R, m, gaps = []) => { const B = BANDS.get(m) || BANDS.set(m, { p: [], uv: [], ix: [] }).get(m), n = Math.max(24, Math.round(R[R.length - 1] * 0.5));
        for (let a = 0; a < n; a++) { const a0 = a / n * 2 * Math.PI, a1 = (a + 1) / n * 2 * Math.PI; if (gaps.some(([ga, gw]) => Math.abs(Math.atan2(Math.sin(a0 - ga), Math.cos(a0 - ga))) < gw)) continue;
          for (let j = 0; j < R.length - 1; j++) { const b = B.p.length / 3; for (const [an, r] of [[a0, R[j]], [a1, R[j]], [a0, R[j + 1]], [a1, R[j + 1]]]) { const x = cx + r * Math.cos(an), z = cz + r * Math.sin(an); B.p.push(x, g.hAt(x, z) + 0.7, z); B.uv.push(an * R[R.length - 1] / 8, r / 8); } B.ix.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); } } };
      const steps = (a, b, st) => { const R = []; for (let r = a; r < b; r += st) R.push(r); R.push(b); return R; };
      const aLip = Math.atan2(S[iLip].z - EAST[1], S[iLip].x - EAST[0]), aOut = Math.atan2(S[T.t0].z - EAST[1], S[T.t0].x - EAST[0]);
      for (const [a, b] of [[225, 235], [260, 272], [295, 308], [325, 337]]) ring(EAST[0], EAST[1], steps(a, b, 6), MAT.strata, [[aLip, 0.1], [aOut, 0.1]]);              // the great crater: four strata on its wall (open under the flight and over the tunnel),
      ring(EAST[0], EAST[1], steps(354, 366, 6), MAT.crest, [[aLip, 0.08]]);                                                                                    // its pale crest (open where the road reaches the lip),
      for (const [x, z, r] of M.dents) { ring(x, z, steps(0, r * 0.8, 5), MAT.strata); ring(x, z, steps(r, r + Math.max(3, r * 0.14), 4), MAT.crest); }          // and each small crater of the floor: dark bottom, pale rim
      ring(SOUTH[0], SOUTH[1], steps(217, 227, 5), MAT.crest, [[Math.atan2(S[T.t1].z - SOUTH[1], S[T.t1].x - SOUTH[0]), 0.12], [2.75, 0.3]]);                   // the pale crest of the south basin (open over the tunnel and where the ramp leaves it, to the west)
      for (const [a, b] of [[150, 165], [200, 214]]) ring(BESIDE[0][0], BESIDE[0][1], steps(a, b, 8), MAT.strata);                                            // the western crater: two strata, away from the road
      for (const [x, z] of BESIDE.slice(2)) { ring(x, z, steps(0, 20, 5), MAT.strata); ring(x, z, steps(31, 36, 5), MAT.crest); }                              // the two fresh impacts of the chicane: dark bowl, bright rim
      for (const [m, B] of BANDS) { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(B.p, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(B.uv, 2)); geo.setIndex(B.ix); geo.computeVertexNormals(); kit.add(new THREE.Mesh(geo, m)); }
      // placement. stand(x, z, ry, y): an empty group at map coordinates (x east, z = -north), on the ground unless y is given. add(group, shape, settings, position, skin): poses a catalogue shape in it (skin: MAT, or one material for a simple shape)
      const at = pk => S[Math.round(pk / LAP * N) % N], low = (x, z, w, d) => Math.min(g.hAt(x, z), ...[[w, 0], [-w, 0], [0, d], [0, -d]].map(([a, b]) => g.hAt(x + a / 2, z + b / 2)));
      const stand = (x, z, ry = 0, y) => { const grp = new THREE.Group(); grp.position.set(x, y ?? g.hAt(x, z), z); grp.rotation.y = ry; kit.add(grp); return grp; };
      const add = (grp, shape, a = [], pos = [0, 0, 0], skin = MAT) => { h.pose(shape, skin, grp, pos, ...a); return grp; };
      // by(pk, side, off, [w, d], ry): a group beside the road at chainage pk, side -1 = left / 1 = right, the near face of its w × d footprint `off` metres from the wall, on the lowest ground under that footprint (mid: on the ground at its centre, for what has its own plinth);
      // turned so that the local -X (the front of a building) faces the road and the local Z runs along it. side 0: on the axis, at road level (a frame, a hall bay)
      const by = (pk, sd, off = 0, [w, d] = [0, 0], ry = 0, mid = false) => { const s = at(pk); if (!sd) return stand(s.x, s.z, h.across(s) + ry, s.y);
        const [x, z] = edgePt(s, sd, s.w + off + w / 2); return stand(x, z, h.across(s) + (sd > 0 ? 0 : Math.PI) + ry, mid ? g.hAt(x, z) : low(x, z, w, d)); };
      // the horizon. The terrain stops 480 m from the road: a dark plain runs on from there, lower than the floor of the deepest crater, and four far massifs close the view
      { const p = new THREE.Mesh(new THREE.PlaneGeometry(12000, 12000), MAT.plain); p.rotation.x = -Math.PI / 2; p.position.set(0, -46, 0); p.geometry.attributes.uv.array.forEach((v, i, A) => A[i] = v * 1500); kit.add(p); }
      for (const [x, z, ry, L, H, sd] of [[-100, -1900, 0, 3400, 250, 1], [1650, -300, 1.5708, 3000, 210, 2], [100, 1500, 0, 3200, 190, 3], [-1850, -250, 1.5708, 3000, 230, 4]]) add(stand(x, z, ry, -40), 'criteLune', [L, H, 420, sd], [0, 0, 0], MAT.far);
      for (const z of ZONES) LUNE[z]({ h, g, S, N, at, LAP, MAT, kit, stand, add, by, THREE });
      weld(h, kit); // one mesh per material
    },
  });
})();
