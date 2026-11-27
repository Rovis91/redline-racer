// Scenery placement for "area51" (Area 51 / Signal Unknown): terrain, roadway, guardrails, the shared materials, then each zone (scenery-area51-<zone>.js). See docs/methods/NEW-MAP.md, phases 2 and 3.
// The whole static map is real scenery (V2): shapes by family in shapes-area51-*.js, textures in textures-area51.js. What moves, lights and sounds (V3) is in scenery-area51-vie.js, which returns the map's tick.
// Coordinates are plan metres (x = east, z = south), the frame of the proposal's technical plan, so a position can be read off a plan directly.
// Site logic, as on a real flight-test base: dry lake to the north, the two runways on its edge, then going south taxiway, apron, hangar row, service road, and the alluvial fan rising to the range;
// what must be shielded sits in the relief (B1 under the mesa, the big dish in a bowl), what must see far sits on it (telemetry on the ridge).
(function () {
  const { near, edgePt, terrain, weld } = PLACERS;
  const ZONES = ['hangar', 'bunker', 'antennes', 'collines', 'pistes', 'desert'], LAP = 6619; // LAP: plan length of the layout, the unit of the chainages (PK)
  // relief the road does not make, [x, z, radius x, radius z, height]: B1's mesa, the radar ridge, the two shoulders of the road cut, hills south and east of the base
  const HILLS = [[1160, 1262, 430, 230, 55], [210, 540, 170, 300, 40], [330, 250, 120, 90, 30], [420, 300, 70, 55, 24], [1900, 1250, 250, 170, 35], [2390, 1340, 180, 160, 40], [2700, 900, 200, 400, 40]];
  const BOWL = [560, 1010, 250, 100, 24]; // the rim round D1: centre, radius of the crest, half-width, height
  // B1 is underground: between its two portals the road runs up to 18 m below the mesa foot. The ground keeps its natural level over it (terrain's `ground` option) and is only cut out where the rooms are
  const B1 = [[1472, 1125], [850, 1220]];
  // the rooms along B1, [from, to, free width left, free width right (0: the room goes on past the reactor), free height]: security lock, reactor hall, labs cavern, silo chamber; elsewhere a 24 × 10 m gallery
  const ROOMS = [[[1360, 1226], [1325, 1228], 20, 20, 12], [[1292, 1240], [1146, 1218], 26, 0, 26], [[1085, 1178], [965, 1180], 32, 32, 20], [[940, 1190], [900, 1212], 14, 40, 20]]; // the silo chamber is kept at 20 m: higher, its ceiling would come out of the thin end of the mesa
  const FLATS = [[1000, 2760, -520, 832, 0]]; // graded ground, [x0, x1, z0, z1, altitude]: the lake bed, both runways, the taxiways and the apron are one flat. Slabs lie on it without the fan showing through
  const PIT = [1210, 1262, 46, 7]; // the reactor pool of B1: centre, radius, depth below the hall floor (the road runs a gallery above it)
  const RUNWAY = [[1340, 400], [1975, 400]]; // the stretch where the road is runway A itself: no guardrail there
  // the bends of the airfield, [from, to, side of the outside of the bend (-1 left, 1 right)]: there a row of anti-ram concrete blocks stands in place of the guardrail and draws the corner
  // (off the final approach before the threshold, onto the taxiway, onto the connector, onto runway A, off it by the angled exit, onto the apron)
  const BLOCS = [[[962, 380], [1040, 452], -1], [[1050, 582], [1163, 684], 1], [[1208, 686], [1311, 586], 1], [[1311, 466], [1409, 379], -1], [[1860, 379], [2014, 427], -1], [[2258, 670], [2200, 774], -1]];
  // dry washes, polylines in plan metres: they drain the ridge to the lake, two north of the depot, one between the array arm and the airfield; none crosses a road (no culvert to build). Their bed is dug 1.2 m and takes its own ground
  const WASHES = [[[400, 150], [480, 90], [560, 70], [640, 10], [720, -10], [780, -80], [860, -130]], [[430, 225], [520, 195], [640, 205], [760, 170], [880, 185], [960, 155]], [[850, 470], [890, 540], [880, 620], [920, 700], [930, 780]]];
  const ss = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };

  Object.assign(SCENERY, {
    area51(h) {
      const { THREE, S, N, T } = h, k = h.M.sc, idx = (x, z) => near(h, x * k, z * k), [t0, t1] = B1.map(p => idx(...p));
      const rooms = ROOMS.map(([a, b, L, R, clear]) => [idx(...a), idx(...b), L, R || 130, clear, !!R]), room = i => rooms.find(r => i >= r[0] && i <= r[1]) || [0, 0, 12, 12, 10, true];
      const over = new Map(); for (let i = t0; i <= t1; i++) over.set(S[i], S[t0].y + (S[t1].y - S[t0].y) * (i - t0) / (t1 - t0)); // natural ground over B1: a straight line between the two portals
      // the range closes the basin to the south (z > 1380) and west (x < 100)
      const hills = (X, Z) => { let y = 130 * ss((Z - 1380) / 300) + 110 * ss((100 - X) / 300); for (const [cx, cz, rx, rz, ht] of HILLS) y += ht * ss(1 - Math.hypot((X - cx) / rx, (Z - cz) / rz));
        return y + BOWL[4] * ss(1 - Math.abs(Math.hypot(X - BOWL[0], Z - BOWL[1]) - BOWL[2]) / BOWL[3]); };
      const wash = (X, Z) => { let d = 1e9; for (const L of WASHES) for (let i = 0; i < L.length - 1; i++) { const [ax, az] = L[i], [bx, bz] = L[i + 1], ux = bx - ax, uz = bz - az, t = Math.max(0, Math.min(1, ((X - ax) * ux + (Z - az) * uz) / (ux * ux + uz * uz))); d = Math.min(d, Math.hypot(X - ax - ux * t, Z - az - uz * t)); }
        return ss(1 - d / 22); }; // 1 in the bed, 0 from 22 m off its axis
      const hollow = (x, z, y) => { const i = near(h, x, z), s = S[i], X = x / k, Z = z / k;
        if (i >= t0 && i <= t1) { const lat = (x - s.x) * -s.tz + (z - s.z) * s.tx, L = Math.max(room(i - 10)[2], room(i)[2], room(i + 10)[2]), R = Math.max(room(i - 10)[3], room(i)[3], room(i + 10)[3]); // a room's cut goes on 20 m past its two ends, behind the end walls: no slope of ground comes in at a corner // over B1: the mesa at full height, cut down to the floor only inside the rooms (12 m of margin: the walls hide the cut)
          if (lat > -L - 12 && lat < R + 12) return y - (s.y - 2) + PIT[3] * ss((PIT[2] + 4 - Math.hypot(X - PIT[0], Z - PIT[1])) / 8);
          return -Math.max(hills(X, Z), (s.y + room(i)[4] + 6.2 - y) * ss((Math.max(-lat - L, lat - R) > 0 ? 72 - Math.max(-lat - L, lat - R) : 72) / 40)); } // the ground is banked over the shell where the mesa is still too low to cover it: no box comes out of the hill near the portals
        const out = Math.min(Math.abs(i - t0), Math.abs(i - t1)), far = Math.hypot(s.x - x, s.z - z), bank = 16.2 * ss(1 - out / 20) * ss((far - 22) / 14) * ss((75 - far) / 40); // the same bank goes on 40 m before each portal as the two shoulders of a cutting
        let f = 0, a = 0; for (const [x0, x1, z0, z1, alt] of FLATS) { const w = ss((X - x0) / 30) * ss((x1 - X) / 30) * ss((Z - z0) / 30) * ss((z1 - Z) / 30); if (w > f) { f = w; a = alt - 0.6; } }
        return f * (y - a) - (1 - f) * (Math.max(hills(X, Z) * ss((far - 22) / 45), bank) - 1.2 * wash(X, Z)); }; // in the open, hills rise from 22 m off the axis (full height 45 m further)
      const g = terrain(h, { stepSec: 10, margin: 400, ground: s => over.get(s) ?? s.y, hollow, mat: h.mat('solArea51'),
        layerSet: [{ tex: ['playaArea51'], weight: (x, z) => ss((335 - z / k) / 50) * ss((x / k - 1010) / 50) }, { tex: ['rocheArea51', '#a5604a'], slope: [0.3, 0.55] }, { tex: ['ouedArea51'], weight: (x, z) => wash(x / k, z / k) }] }); // ground: gravel fan, the pale clay of the dry lake from the north edge of runway A (runway B lies on the lake), bare rock where it is steep
      // the game draws the roadway at a constant ±W; the walls are at ±s.w (M.wide): the roadway is laid again at the real width, as on givre
      // On the full-width stretch of runway A (60 m) that texture would be stretched three times: there the roadway is laid in 32 m tiles of the runway's own surface (pisteArea51), with its touchdown and aiming-point marks
      const lay = { side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }, full = S.map((s, i) => s.w > 29.5 ? i : -1).filter(i => i >= 0), f0 = full[0], tiles = Math.floor((full[full.length - 1] - f0) / 16);
      h.ribbon(f0 + tiles * 16, N - tiles * 16, s => -s.w, 0, s => s.w, 0, h.mat('roadway', lay, ...h.TH.road), 32);
      const pisteM = [0, 1, 2].map(m => h.mat('pisteArea51', lay, m)); for (let t = 0; t < tiles; t++) h.ribbon(f0 + t * 16, 16, s => -s.w, 0, s => s.w, 0, pisteM[t === 2 ? 2 : t < 2 || t === 5 || t === 8 ? 1 : 0], 32);
      // guardrails (th.wallH 0: the engine draws none): everywhere but on the runway, where the road has no edge, and on the outside of the airfield bends (BLOCS)
      const [r0, r1] = RUNWAY.map(p => idx(...p)), rail = h.mat('guardrail', { side: THREE.DoubleSide }, h.TH.intoWall); blocs = BLOCS.map(([a, b, sd]) => [idx(...a), idx(...b), sd]);
      for (const sd of [-1, 1]) { const open = i => (i >= r0 && i < r1) || blocs.some(([a, b, d]) => d === sd && i >= a && i < b); // no rail on the runway, nor where blocks replace it
        for (let i = 0, a = -1; i <= N; i++) if (i < N && !open(i)) { if (a < 0) a = i; } else if (a >= 0) { h.guardM(sd, a, i - a, s => sd * s.w, 1.1, s => sd * s.w, -2, rail); a = -1; } }
      // MAT: the shared materials of the map. Every piece of scenery goes into the group `kit`, merged per material at the end (one mesh per material).
      // Keys are also the zone names of the area51 shapes; the Object.assign line maps the zone names of the shapes borrowed from shapes.js (mastLighting, waterTower, tractor, trailerTank)
      const DS = { side: THREE.DoubleSide }, tint = c => h.mat('metalPale', { c }), MAT = { tin: h.mat('toleArea51', {}, '#757a68'), roof: h.mat('toleArea51', DS, '#3e4238', 0.5), concrete: h.mat('concretePart'), dark: h.mat('concreteDark'), steel: h.mat('steelMat'), gray: h.mat('matGray'),
        lattice: h.mat('lattice', { alphaTest: 0.5, ...DS }, '#9aa0a8'), white: h.mat('metalPale', { c: 0xe9ece7, ...DS }), red: tint(0xb5483c), amber: tint(0xf2a23a), glass: h.mat('paneDark'), neon: h.mat('lampObj', { emis: 1 }), fire: h.mat('lightRed', { emis: 1 }), pool: h.mat('cherenkovArea51', { emis: 1 }),
        verriere: h.mat('verriereArea51', { emis: 1 }), danger: h.mat('dangerArea51'), stripe: h.mat('striping'), tarmac: h.mat('tarmacArea51'), piste: h.mat('tarmacArea51', { c: 0xb4b8c4 }), yellow: h.mat('jauneArea51'), paintW: h.mat('blancArea51'),
        stealth: h.mat('furtifArea51', DS), trefle: h.mat('trefleArea51'),
        rock: h.mat('rocheArea51', {}, '#a5604a'), far: h.mat('rocheArea51', {}, '#6a5a96', 0.4), playa: h.mat('playaArea51'), sol: h.mat('solArea51'),
        sage: h.mat('brousseArea51', {}, '#84966e'), creo: h.mat('brousseArea51', {}, '#5c6a3c'), yucca: h.mat('brousseArea51', {}, '#6e8250'), bark: h.mat('brousseArea51', {}, '#77593e'), rust: tint(0x8a5238), alien: tint(0xeee6d4), oeil: h.mat('paneDark'),
        green: h.mat('feuVertArea51', { emis: 1 }), sodium: h.mat('sodium', { emis: 1 }), // desert plants, the hulk, the visitor; runway light colours that the white (neon), red (fire) and blue (pool) do not cover
        murB1: h.mat('tunMurArea51'), vouteB1: h.mat('tunVouteArea51'), solB1: h.mat('tunSolArea51') }; // underground and hall surfaces (textures-area51-route.js)
      Object.assign(MAT, { door: MAT.gray, sign: MAT.gray, floor: MAT.tarmac, steelMat: MAT.steel, lampObj: MAT.neon, iron: MAT.gray, vat: MAT.white, chassis: MAT.gray, cabin: MAT.red, pane: MAT.glass, radiator: MAT.gray, headlight: MAT.neon, lightOrange: MAT.neon, wheelPart: MAT.steel, tire: MAT.dark });
      const kit = new THREE.Group(); h.scene.add(kit);
      const smp = pk => S[Math.round(pk / LAP * N) % N], pk = (x, z) => idx(x, z) / N * LAP; // pk(x, z): chainage of the road point nearest to a plan position
      // The placers. Options o: s = scale, a = the settings of the shape, skin = MAT or, for a simple shape, one material; y = altitude instead of the ground, dy = raised by; ry = turned by
      // on(shape, X, Y, Z, ry, o): a catalogue shape at a world position. Returns its group
      const REG = {}, reg = (n, o) => ((REG[n] = REG[n] || []).push(o), o); // every placed piece, by shape name: what scenery-area51-vie.js takes out of the kit to make it move
      const on = (shape, X, Y, Z, ry = 0, { s = 1, a = [], skin = MAT } = {}) => { const grp = new THREE.Group(); grp.position.set(X, Y, Z); grp.rotation.y = ry; grp.scale.setScalar(s); kit.add(grp); h.pose(shape, skin, grp, [0, 0, 0], ...a); return reg(shape, grp); };
      // set(shape, x, z, o): at a plan position, on the ground
      const set = (shape, x, z, o = {}) => on(shape, x * k, (o.y ?? g.hAt(x * k, z * k)) + (o.dy || 0), z * k, o.ry || 0, o);
      // side(shape, pk, sd, off, half, o): beside the road at chainage pk, side -1 = left / 1 = right, its near face `off` m from the wall (half = its half-width across). Local Z runs along the road and local -X looks at the road (o.keep: not turned on the left side: signs)
      // o.tilt: the piece is long and lies along a slope (fence, rails): it is tilted to the gradient of the road there instead of stepping down it
      const side = (shape, p, sd, off, half, o = {}) => { const s = smp(p), [x, z] = edgePt(s, sd, s.w + off + half), grp = on(shape, x, (o.y ?? g.hAt(x, z)) + (o.dy || 0), z, h.across(s) + (sd < 0 && !o.keep ? Math.PI : 0), o);
        if (o.tilt) { const i = S.indexOf(s); grp.rotation.order = 'YXZ'; grp.rotation.x = Math.atan2(S[(i + 4) % N].y - S[(i + N - 4) % N].y, 16) * (sd < 0 && !o.keep ? -1 : 1); } return grp; };
      // along(shape, p0, p1, sd, off, half, step, o): the same piece every `step` m of road from chainage p0 to p1 (its length is its last setting): fences and rails follow the bends instead of cutting across them
      const along = (shape, p0, p1, sd, off, half, step, o = {}) => { for (let p = p0 + step / 2; p < p1; p += step) side(shape, p, sd, off, half, { ...o, a: [...(o.a || []), step + 0.3] }); };
      // seg(shape, s, lat, y, o): in the road frame at sample s, `lat` m right of the axis, y m above the roadway: what the underground is made of
      const seg = (shape, s, lat, y, o = {}) => { const [x, z] = edgePt(s, 1, lat), grp = on(shape, x, s.y + y, z, h.across(s), o); if (o.pitch) { grp.rotation.order = 'YXZ'; grp.rotation.x = o.pitch; } return grp; }; // o.pitch: tilted along the road (radians), for what must follow a ramp instead of stepping down it
      // cube(material, s, lat, w, ht, d, y): one box in the road frame at sample s, its base y m above the roadway
      const cube = (m, s, lat, w, ht, d, y) => { const [x, z] = edgePt(s, 1, lat), b = h.pose('boxMesh', MAT[m], kit, [x, s.y + y + ht / 2, z], w, ht, d); b.rotation.y = h.across(s); return b; };
      // surf(material, x, z, wx, dz, top, th): a paved surface, wx east-west by dz north-south, its top at altitude `top` (default 0.2 m under an airfield road at 0; null: just above the ground there)
      const surf = (m, x, z, wx, dz, top = -0.2, th = 1.3) => h.pose('boxMesh', MAT[m], kit, [x * k, (top ?? g.hAt(x * k, z * k) + 0.15) - th / 2, z * k], wx, th, dz);
      const inside = p => smp(p).k > 0 ? 1 : -1; // the side of the inside of the bend at chainage p: where the thing the road goes round stands
      // dish(x, z, s, tilt): a dish antenna of the D1 family at scale s (1 = D1, 120 m across on a 50 m mount), its reflector tilted toward the west, where the signal comes from
      const dish = (x, z, s = 1, tilt = 0.7) => { const d = set('dishMountArea51', x, z, { s }), head = new THREE.Group(); head.position.y = 54; head.rotation.z = tilt; d.add(head); reg('dishHead', head); h.pose('dishBowlArea51', MAT.white, head, [0, 6, 0]); h.pose('dishBackArea51', MAT, head, [0, 6, 0]); return d; };
      // avion(type, x, z, o): one of the black prototypes ('sr71', 'b2', 'f117'): its lifting surface and its parts at the same place
      const avion = (type, x, z, o = {}) => { const a = set(type + 'Area51', x, z, o); h.pose(type + 'NappeArea51', MAT.stealth, a, [0, 0, 0]); return a; };
      const sideXZ = (p, sd, dist) => edgePt(smp(p), sd, smp(p).w + dist).map(v => v / k); // plan position at `dist` m outside the wall at chainage p
      const ctx = { h, g, S, N, MAT, near, wash, FLATS, BLOCS, RUNWAY, kit, on, set, side, along, avion, sideXZ, seg, cube, surf, inside, dish, smp, pk, idx, t0, t1, rooms, room, THREE, k, edgePt, REG, reg, weld };
      for (const z of ZONES) AREA51[z](ctx);
      const tick = AREA51.vie(ctx); // life (V3): takes what moves out of the kit before the merge, and returns the map's tick
      weld(h, kit, null, [MAT.far]); // one mesh per material; hangars, dishes and aircraft shade the tarmac
      return tick;
    },
  });
})();
