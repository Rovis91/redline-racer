// Scenery placement for "area51" (Area 51 / Signal Unknown): terrain, roadway, guardrails, the shared materials, then each zone (scenery-area51-<zone>.js). See docs/methods/NEW-MAP.md, phases 2 and 3.
// The whole static map is real scenery (V2): shapes by family in shapes-area51-*.js, textures in textures-area51.js. No sound, animation, particle or dynamic light yet (V3).
// Coordinates are plan metres (x = east, z = south), the frame of the proposal's technical plan, so a position can be read off a plan directly.
// Site logic, as on a real flight-test base: dry lake to the north, the two runways on its edge, then going south taxiway, apron, hangar row, service road, and the alluvial fan rising to the range;
// what must be shielded sits in the relief (B1 under the mesa, the big dish in a bowl), what must see far sits on it (telemetry on the ridge).
(function () {
  const { near, edgePt, terrain, weld } = PLACERS;
  const ZONES = ['hangar', 'bunker', 'antennes', 'collines', 'pistes'], LAP = 6784; // LAP: plan length of the layout, the unit of the chainages (PK)
  // relief the road does not make, [x, z, radius x, radius z, height]: B1's mesa, the radar ridge, the two shoulders of the road cut, hills south and east of the base
  const HILLS = [[1160, 1262, 430, 230, 55], [210, 540, 170, 300, 40], [330, 250, 120, 90, 30], [470, 395, 80, 60, 22], [1900, 1250, 250, 170, 35], [2390, 1340, 180, 160, 40], [2700, 900, 200, 400, 40]];
  const BOWL = [560, 1010, 250, 100, 24]; // the rim round D1: centre, radius of the crest, half-width, height
  // B1 is underground: between its two portals the road runs up to 18 m below the mesa foot. The ground keeps its natural level over it (terrain's `ground` option) and is only cut out where the rooms are
  const B1 = [[1472, 1125], [850, 1220]];
  // the rooms along B1, [from, to, free width left, free width right (0: the room goes on past the reactor), free height]: security lock, reactor hall, labs cavern, silo chamber; elsewhere a 24 × 10 m gallery
  const ROOMS = [[[1360, 1226], [1325, 1228], 20, 20, 12], [[1292, 1240], [1146, 1218], 26, 0, 26], [[1085, 1178], [965, 1180], 32, 32, 20], [[940, 1190], [900, 1212], 14, 40, 20]]; // the silo chamber is kept at 20 m: higher, its ceiling would come out of the thin end of the mesa
  const FLATS = [[850, 2760, -520, 832, 0]]; // graded ground, [x0, x1, z0, z1, altitude]: the lake bed, both runways, the taxiways and the apron are one flat. Slabs lie on it without the fan showing through
  const PIT = [1210, 1262, 46, 7]; // the reactor pool of B1: centre, radius, depth below the hall floor (the road runs a gallery above it)
  const RUNWAY = [[1340, 400], [1975, 400]]; // the stretch where the road is runway A itself: no guardrail there
  const ss = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };

  Object.assign(SCENERY, {
    area51(h) {
      const { THREE, S, N, T } = h, k = h.M.sc, idx = (x, z) => near(h, x * k, z * k), [t0, t1] = B1.map(p => idx(...p));
      const rooms = ROOMS.map(([a, b, L, R, clear]) => [idx(...a), idx(...b), L, R || 130, clear, !!R]), room = i => rooms.find(r => i >= r[0] && i <= r[1]) || [0, 0, 12, 12, 10, true];
      const over = new Map(); for (let i = t0; i <= t1; i++) over.set(S[i], S[t0].y + (S[t1].y - S[t0].y) * (i - t0) / (t1 - t0)); // natural ground over B1: a straight line between the two portals
      // the range closes the basin to the south (z > 1380) and west (x < 100)
      const hills = (X, Z) => { let y = 130 * ss((Z - 1380) / 300) + 110 * ss((100 - X) / 300); for (const [cx, cz, rx, rz, ht] of HILLS) y += ht * ss(1 - Math.hypot((X - cx) / rx, (Z - cz) / rz));
        return y + BOWL[4] * ss(1 - Math.abs(Math.hypot(X - BOWL[0], Z - BOWL[1]) - BOWL[2]) / BOWL[3]); };
      const hollow = (x, z, y) => { const i = near(h, x, z), s = S[i], X = x / k, Z = z / k;
        if (i >= t0 && i <= t1) { const lat = (x - s.x) * -s.tz + (z - s.z) * s.tx, [, , L, R] = room(i); // over B1: the mesa at full height, cut down to the floor only inside the rooms (12 m of margin: the walls hide the cut)
          return lat > -L - 12 && lat < R + 12 ? y - (s.y - 2) + PIT[3] * ss((PIT[2] + 4 - Math.hypot(X - PIT[0], Z - PIT[1])) / 8) : -hills(X, Z); }
        let f = 0, a = 0; for (const [x0, x1, z0, z1, alt] of FLATS) { const w = ss((X - x0) / 30) * ss((x1 - X) / 30) * ss((Z - z0) / 30) * ss((z1 - Z) / 30); if (w > f) { f = w; a = alt - 0.6; } }
        return f * (y - a) - (1 - f) * hills(X, Z) * ss((Math.hypot(s.x - x, s.z - z) - 22) / 45); }; // in the open, hills rise from 22 m off the axis (full height 45 m further)
      const g = terrain(h, { stepSec: 10, margin: 400, ground: s => over.get(s) ?? s.y, hollow, mat: h.mat('solArea51'),
        layerSet: [{ tex: ['playaArea51'], weight: (x, z) => ss((335 - z / k) / 50) * ss((x / k - 880) / 60) }, { tex: ['rocheArea51', '#a5604a'], slope: [0.3, 0.55] }] }); // ground: gravel fan, the pale clay of the dry lake from the north edge of runway A (runway B lies on the lake), bare rock where it is steep
      // the game draws the roadway at a constant ±W; the walls are at ±s.w (M.wide): the roadway is laid again at the real width, as on givre
      h.ribbon(T.t1, N, s => -s.w, 0, s => s.w, 0, h.mat('roadway', { side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }, ...h.TH.road), 32);
      // guardrails (th.wallH 0: the engine draws none): everywhere but on the runway, where the road has no edge
      const [r0, r1] = RUNWAY.map(p => idx(...p)), rail = h.mat('guardrail', { side: THREE.DoubleSide }, h.TH.intoWall); for (const sd of [-1, 1]) h.guardM(sd, r1, N - (r1 - r0), s => sd * s.w, 1.1, s => sd * s.w, -2, rail);
      // MAT: the shared materials of the map. Every piece of scenery goes into the group `kit`, merged per material at the end (one mesh per material).
      // Keys are also the zone names of the area51 shapes; the Object.assign line maps the zone names of the shapes borrowed from shapes.js (mastLighting, waterTower, tractor, trailerTank)
      const DS = { side: THREE.DoubleSide }, tint = c => h.mat('metalPale', { c }), MAT = { tin: h.mat('toleArea51', {}, '#757a68'), roof: h.mat('toleArea51', DS, '#3e4238', 0.5), concrete: h.mat('concretePart'), dark: h.mat('concreteDark'), steel: h.mat('steelMat'), gray: h.mat('matGray'),
        lattice: h.mat('lattice', { alphaTest: 0.5, ...DS }, '#9aa0a8'), white: h.mat('metalPale', { c: 0xe9ece7, ...DS }), red: tint(0xb5483c), amber: tint(0xf2a23a), glass: h.mat('paneDark'), neon: h.mat('lampObj', { emis: 1 }), fire: h.mat('lightRed', { emis: 1 }), pool: h.mat('cherenkovArea51', { emis: 1 }),
        verriere: h.mat('verriereArea51', { emis: 1 }), danger: h.mat('dangerArea51'), stripe: h.mat('striping'), tarmac: h.mat('tarmacArea51'), piste: h.mat('tarmacArea51', { c: 0xb4b8c4 }), yellow: h.mat('jauneArea51'), paintW: h.mat('blancArea51'),
        rock: h.mat('rocheArea51', {}, '#a5604a'), far: h.mat('rocheArea51', {}, '#6a5a96', 0.4), playa: h.mat('playaArea51'), sol: h.mat('solArea51') };
      Object.assign(MAT, { door: MAT.gray, sign: MAT.gray, steelMat: MAT.steel, lampObj: MAT.neon, iron: MAT.gray, vat: MAT.white, chassis: MAT.gray, cabin: MAT.red, pane: MAT.glass, radiator: MAT.gray, headlight: MAT.neon, lightOrange: MAT.neon, wheelPart: MAT.steel, tire: MAT.dark });
      const kit = new THREE.Group(); h.scene.add(kit);
      const smp = pk => S[Math.round(pk / LAP * N) % N], pk = (x, z) => idx(x, z) / N * LAP; // pk(x, z): chainage of the road point nearest to a plan position
      // The placers. Options o: s = scale, a = the settings of the shape, skin = MAT or, for a simple shape, one material; y = altitude instead of the ground, dy = raised by; ry = turned by
      // on(shape, X, Y, Z, ry, o): a catalogue shape at a world position. Returns its group
      const on = (shape, X, Y, Z, ry = 0, { s = 1, a = [], skin = MAT } = {}) => { const grp = new THREE.Group(); grp.position.set(X, Y, Z); grp.rotation.y = ry; grp.scale.setScalar(s); kit.add(grp); h.pose(shape, skin, grp, [0, 0, 0], ...a); return grp; };
      // set(shape, x, z, o): at a plan position, on the ground
      const set = (shape, x, z, o = {}) => on(shape, x * k, (o.y ?? g.hAt(x * k, z * k)) + (o.dy || 0), z * k, o.ry || 0, o);
      // side(shape, pk, sd, off, half, o): beside the road at chainage pk, side -1 = left / 1 = right, its near face `off` m from the wall (half = its half-width across). Local Z runs along the road and local -X looks at the road (o.keep: not turned on the left side: signs)
      const side = (shape, p, sd, off, half, o = {}) => { const s = smp(p), [x, z] = edgePt(s, sd, s.w + off + half); return on(shape, x, (o.y ?? g.hAt(x, z)) + (o.dy || 0), z, h.across(s) + (sd < 0 && !o.keep ? Math.PI : 0), o); };
      // seg(shape, s, lat, y, o): in the road frame at sample s, `lat` m right of the axis, y m above the roadway: what the underground is made of
      const seg = (shape, s, lat, y, o = {}) => { const [x, z] = edgePt(s, 1, lat); return on(shape, x, s.y + y, z, h.across(s), o); };
      // cube(material, s, lat, w, ht, d, y): one box in the road frame at sample s, its base y m above the roadway
      const cube = (m, s, lat, w, ht, d, y) => { const [x, z] = edgePt(s, 1, lat), b = h.pose('boxMesh', MAT[m], kit, [x, s.y + y + ht / 2, z], w, ht, d); b.rotation.y = h.across(s); return b; };
      // surf(material, x, z, wx, dz, top, th): a paved surface, wx east-west by dz north-south, its top at altitude `top` (default 0.2 m under an airfield road at 0; null: just above the ground there)
      const surf = (m, x, z, wx, dz, top = -0.2, th = 1.3) => h.pose('boxMesh', MAT[m], kit, [x * k, (top ?? g.hAt(x * k, z * k) + 0.15) - th / 2, z * k], wx, th, dz);
      const inside = p => smp(p).k > 0 ? 1 : -1; // the side of the inside of the bend at chainage p: where the thing the road goes round stands
      // dish(x, z, s, tilt): a dish antenna of the D1 family at scale s (1 = D1, 120 m across on a 50 m mount), its reflector tilted toward the west, where the signal comes from
      const dish = (x, z, s = 1, tilt = 0.7) => { const d = set('dishMountArea51', x, z, { s }), head = new THREE.Group(); head.position.y = 54; head.rotation.z = tilt; d.add(head); h.pose('dishBowlArea51', MAT.white, head, [0, 6, 0]); h.pose('dishBackArea51', MAT, head, [0, 6, 0]); return d; };
      for (const z of ZONES) AREA51[z]({ h, g, S, N, MAT, kit, on, set, side, seg, cube, surf, inside, dish, smp, pk, idx, t0, t1, rooms, room, THREE, k, edgePt });
      weld(h, kit); // one mesh per material
    },
  });
})();
