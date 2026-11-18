// Track + pure physics (no rendering): shared by the game and by `node test.js`.
(function (G) {
  if (!G.MAPS) require('../data/maps.js'); // node: the browser loads mapDefs.js before this file
  // Everything that depends on the map (layout, width, grip, car) comes from mapDefs.js, passed to buildTrack and carried by the track: T.mapDef, T.car (car spec sheet), T.kt (driving settings, see KT0), T.trucks.
  // This file reads no global map: several tracks can live side by side (tests, map change).
  const TOP = 55; // reference speed (m/s) for the visual effects
  const WALL_RUB = 0.35, WALL_SOFT = 0.2, WALL_LOSS = 7, WALL_HARD = 0.45, WALL_MU = 10; // walls: friction braking (1/s); sine of the arrival angle under which it scrapes without loss; slope of the loss beyond it (solid impact); sine above which the engine cuts; friction of a corner's outer wall (braking in 1/s per rad/s of rotation the wall imposes on the car)
  const torque = (CARD, rpm) => { const x = Math.max(0, Math.min(8, rpm / 1000)), i = Math.min(7, x | 0); return CARD.tq[i] + (CARD.tq[i + 1] - CARD.tq[i]) * (x - i); };
  // The driving (a single one, for all maps), go-kart style: the wheel directly commands a rotation rate that depends little on speed, so you turn hard even when fast.
  //   w0, w1 = yaw with the wheel at full lock (rad/s) at standstill and at vref (m/s, 250 km/h): radius = v / hairpin. The same for all cars and all maps: a single way of turning,
  //            120 km/h at full lock: 30 m radius; a 20 m hairpin bend is taken by braking (to about 80 km/h) or by drifting.
  //   Grip = ground × car: ground = 1 - corner of SURF for turning, 1 - gripCoef so that the speed follows the nose; car = car.grip (1 by default), which multiplies w0 and w1.
  //   lift = extra yaw when off the throttle or on the brake: letting go of the throttle tightens; tv = speed lost while turning (m/s² per rad/s of yaw)
  //   Drift: button alone = rear brake (brakeRear m/s², brake lights and smoke); button + wheel = drift to that side, held as long as the button is held.
  //   It starts from the yaw we had (no corner loss on entry) and the yaw joins its drift level at yr (1/s): grip yaw × kIn wheel in, × kN at neutral, × kOut wheel out,
  //   at the price of scrub (m/s²) at full angle. The drift angle (visual and slip) rises towards angMax × aIn / aN / aOut at sar (1/s), faster and further on slippery ground;
  //   on exit it comes back twice as fast. In a drift, the speed follows the nose better than grip on slippery ground (grip^0,35): on snow, you hold your drift.
  const KT0 = { w0: 1.36, w1: 0.85, vref: 70, lift: 1.25, tv: 1, brakeRear: 4, kIn: 1.3, kN: 0.5, kOut: 0.05, yr: 8, scrub: 1, sar: 4, angMax: 0.5, aIn: 1, aN: 0.55, aOut: 0.15 };
  const omega = (v, KT) => (KT.w0 - (KT.w0 - KT.w1) * Math.min(1, v / KT.vref)) * Math.min(1, v / 10); // yaw with the wheel at full lock at speed v, no drift, grip 1
  const vturn = (a, k, KT) => { const c = a / k; return KT.w1 * c >= KT.vref ? KT.w1 * c : KT.w0 * c / (1 + (KT.w0 - KT.w1) * c / KT.vref); }; // speed at which the steering share a is enough for a curvature k
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
  const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
  // Surfaces: the road at each sample has a set of coefficients (T.surf[i]), taken from SURF or blended between two of its entries. A single mechanism for rain, ice, snow and dirt.
  //   corner = yaw lost in a bend; brakes, trac = braking and traction lost; gripCoef = speed catch-up by the nose lost (the car fishtails)
  //   aquaplaning: above vaq (m/s), over 4 m/s: up to aq less yaw, and the catch-up also loses aqc
  //   rollAmt = extra rolling resistance (m/s²); gl = the drift starts earlier: speed and wheel thresholds lowered by as much
  // A map declares surf: { backdrop: 'neige', zones: [[point a, point b, 'glace', force = 1], …] } (base everywhere, zones blended over 20 m at their edges). With nothing: dry.
  // Rain (th.rainFx) goes through the same table: strength 3 = SURF.damp, strength 1 (the city drizzle, its gleaming asphalt) = 30 % of the way to damp; under a tunnel, dry.
  // What we see is what we drive: surf.wide = the surface outside the asphalt band (|d| > W: wide parts, plaza), where the scenery lays something else (cobbles, packed earth).
  const SURF = {
    sec: { corner: 0, brakes: 0, trac: 0, gripCoef: 0, vaq: 230 / 3.6, aq: 0, aqc: 0, rollAmt: 0, gl: 0 },
    damp: { corner: 0.15, brakes: 0.3, trac: 0.25, gripCoef: 0.35, vaq: 190 / 3.6, aq: 0.1, aqc: 0.2, rollAmt: 0, gl: 0 },
    iceSurf: { corner: 0.6, brakes: 0.7, trac: 0.7, gripCoef: 0.8, vaq: 230 / 3.6, aq: 0, aqc: 0, rollAmt: 0, gl: 0 }, // very little yaw and braking, nose very late
    snowSurf: { corner: 0.3, brakes: 0.4, trac: 0.4, gripCoef: 0.7, vaq: 230 / 3.6, aq: 0, aqc: 0, rollAmt: 0.2, gl: 0.2 }, // packed: between dry and ice
    cobbles: { corner: 0.1, brakes: 0.15, trac: 0.15, gripCoef: 0.3, vaq: 230 / 3.6, aq: 0, aqc: 0, rollAmt: 0.15, gl: 0.25 }, // cobbles: less grip, the car fishtails a little, it jolts
    terre: { corner: 0.05, brakes: 0.2, trac: 0.3, gripCoef: 0.6, vaq: 230 / 3.6, aq: 0, aqc: 0, rollAmt: 0.5, gl: 0.5 }, // reduced traction, easy drift, the car still turns well
  };
  const mixed = (a, b, f) => f <= 0 ? a : f >= 1 ? b : Object.fromEntries(Object.keys(a).map(k => [k, lerp(a[k], b[k], f)]));
  // Drying racing line (Race only: R.mo, one wetness per sample × MO.nbr bands across the asphalt, from -W to W; 1 = wet as the map says, 0 = dry line).
  //   The cars (all, BOTS included) dry their step band per pass (spread over the two nearest bands); the weather dries all of t per second; heavy rain (strength > 1) re-wets by pl per second and per point of strength above 1.
  //   On the dry line, rain only counts as dry scaled by its strength (T.surfDry: the road of each sample at this level): no grip, moderate loss. Time trial, medals (lapRef) and ghosts do not see it: road wet everywhere, as before.
  //   Everything derives from the cars' positions, at the simulation step: deterministic; online, the guest recomputes it from the received state (game.js), only the host drives above.
  const MO = { nbr: 8, sec: 0.4, stepSec: 0.15, t: 0.001, pl: 0.0015 };
  const bandStrip = (T, d) => clamp((d / T.W + 1) / 2 * MO.nbr, 0, MO.nbr - 1e-6); // position in bands (real), 0 to nbr
  const surf = (T, i) => T.surf ? T.surf[i] : SURF.sec, surfAt = (T, c) => T.surfL && Math.abs(c.d) > T.W ? T.surfL // under the car
    : c.mo && T.surf && T.surfDry[c.idx] !== T.surf[c.idx] ? mixed(T.surfDry[c.idx], T.surf[c.idx], c.mo[c.idx * MO.nbr + (bandStrip(T, c.d) | 0)]) : surf(T, c.idx);
  function dry(R, dt) {
    const mo = R.mo; if (!mo) return; const T = R.T, nbr = MO.nbr, pl = T.rainFx;
    for (const c of R.cars) { if (c.air || Math.abs(c.d) > T.W) continue;
      const u = bandStrip(T, c.d) - 0.5, b = Math.floor(u), f = u - b, a = MO.stepSec * Math.hypot(c.vx, c.vz) * dt / 2, o = c.idx * nbr; // one sample = 2 m
      if (b >= 0) mo[o + b] = Math.max(0, mo[o + b] - a * (1 - f)); if (b + 1 < nbr) mo[o + b + 1] = Math.max(0, mo[o + b + 1] - a * f); }
    if ((R.moT = (R.moT || 0) + dt) < 0.5) return; // the weather and rain: twice a second is enough
    for (let i = 0; i < T.n; i++) { const k = (MO.pl * Math.max(0, pl[i] - 1) - MO.t) * R.moT; if (pl[i]) for (let j = i * nbr; j < i * nbr + nbr; j++) mo[j] = clamp(mo[j] + k, 0, 1); }
    R.moT = 0;
  }
  // Nitro: one gauge per car (c.nitro, 0 to 1) that the input inp.nitro spends, throttle open and wheels on the ground. c.boost = 1 while it pushes.
  //   dur = seconds of thrust from a full gauge; acc = thrust (m/s²) at TOP and beyond, up to (1 + rep) times more at standstill: it also serves to restart after a mistake
  //   filling, in gauge per second: gl = held drift (at TOP, full rate after 0.6 s of drift); intoWall = rubbing a wall without hitting it; plucked = driving within a metre of the wall without touching it, where the map says so (M.racingLine); cam = overtaking a truck close; asp = in the slipstream of a rival
  //   a solid impact (wall or truck) empties it
  // Slipstream (race): behind a car, from 3 to ad m, in a cone that opens by ac per metre: up to acx less drag, when very close
  const NI = { dur: 3, sec: 0.1, acc: 6, rep: 1, gl: 0.3, intoWall: 0.5, racingLine: 0.5, cam: 0.6, asp: 0.12, ad: 30, ac: 0.08, acx: 0.5 };
  const gains = (c, x) => { c.nitro = Math.min(1, c.nitro + x); };
  // Drift mode: the score, computed apart from the physics (points() only reads the car: no lap time depends on it). Held for any car, read by the Drift mode.
  //   c.ongoing = points of the drift in progress; c.score = points earned; c.mult = chain multiplier
  //   k = points per second, per m/s of speed, drifting broadside (c.slide = drift angle relative to its ceiling) and multiplier at 1
  //   min = duration (s) of a validated drift: on exit its points are added to the score and the multiplier goes up one notch, up to max; shorter, it earns nothing (no zigzags)
  //   pause = seconds without drifting after which the multiplier falls back to 1; a hit against a wall or a truck (c.hit > 2 m/s) brings it back there too, and loses the drift in progress
  const GL = { k: 20, min: 0.8, pause: 3, max: 5 };
  function points(c, dt) {
    if (c.hit > 2) { c.ongoing = 0; c.glD = 0; c.mult = 1; }
    if (c.drift && !c.air) { c.glD += dt; c.glT = 0; c.ongoing += GL.k * Math.hypot(c.vx, c.vz) * c.slide * c.mult * dt; return; }
    if (c.glD >= GL.min) { c.score += c.ongoing; c.mult = Math.min(GL.max, c.mult + 1); }
    c.ongoing = 0; c.glD = 0; if ((c.glT += dt) > GL.pause) c.mult = 1;
  }
  // Relief (maps that declare jumps or rollable walls, otherwise none of this applies): the car has a height c.y and a vertical speed c.vy.
  //   It falls at GRAV; the ground catches it and gives it its own vertical speed. Beyond DROOP from the ground (suspension travel) it flies: no steering, no engine, no brakes.
  //   Landing: beyond LAND0 m/s of impact against the ground, LANDK of speed lost per m/s, up to LANDX (landing on a downhill costs nothing)
  const GRAV = 9.81, DROOP = 0.1, LAND0 = 6, LANDK = 0.025, LANDX = 0.45;
  // height taken on a wall has a price: climbing costs CLIMB times the energy of the height gained, descending gives it back (an exaggerated gravity along the wall, so it can be felt;
  //   symmetric: with a cost on the climb alone, the slightest tremor of the car on the steep top of the slope drained its speed)
  const CLIMB = 4;
  // Rollable wall: outside the flat (s.pl), the road rises in a quarter tube of radius s.rc. wall = height, slope = signed dy/dd (towards the right), capped at 78° at the top of the tube;
  //   beyond (wall wider than 0.98 radius), a level ledge at the top, against the wall: zero slope, like the flat facet game.js draws (with the 78° slope kept up there, gravity made the car pivot)
  const tube = (s, d) => Math.min(Math.abs(d) - s.pl, 0.98 * s.rc);
  const wallFace = (s, d) => { const x = s.rc ? tube(s, d) : 0; return x > 0 ? s.rc - Math.sqrt(s.rc * s.rc - x * x) : 0; };
  const slope = (s, d) => { const x = s.rc ? tube(s, d) : 0; return x > 0 && Math.abs(d) - s.pl < 0.98 * s.rc ? Math.sign(d) * x / Math.sqrt(s.rc * s.rc - x * x) : 0; };
  // Ground under the car: height of the ribbon, continuous from one sample to the next (k = offset in samples, for the camera), plus the wall
  // a tunnel that runs under a bowl (M.bowls): the car is in its tube when its sample is in the tunnel, it is between the walls and lower than the vault; then the ground is the ribbon and the tunnel walls hold, even on a plaza
  const inTube = (T, c, ry) => !!T.mapDef.bowls && (c.idx - T.t0 + T.n) % T.n < (T.t1 - T.t0 + T.n) % T.n && Math.abs(c.d) < T.W + 1 && (c.y ?? ry) < ry + 9;
  // Slope of the ground the ribbon does not carry (M.dents, M.bowls) under the car, [toward its nose, toward its right], in metres per metre, read 1 m either side; [0, 0] on a map without them and in a tunnel tube.
  // For the attitude of the model (game.js): the car pitches and rolls on the wall of a crater it crosses askew
  const tilt = (T, c) => { if (!T.dent || inTube(T, c, T.S[c.idx].y)) return [0, 0]; const ax = Math.cos(c.th), az = Math.sin(c.th), D = T.dent;
    return [(D(c.x + ax, c.z + az) - D(c.x - ax, c.z - az)) / 2, (D(c.x - az, c.z + ax) - D(c.x + az, c.z - ax)) / 2]; };
  function ground(T, c, k = 0) {
    const S = T.S, N = T.n; let i = c.idx, a = S[i], b = S[(i + 1) % N], u = ((c.x - a.x) * (b.x - a.x) + (c.z - a.z) * (b.z - a.z)) / ((b.x - a.x) ** 2 + (b.z - a.z) ** 2 || 1);
    if (u < 0) { i = (i - 1 + N) % N; u = Math.max(0, u + 1); } u = Math.min(1, u); a = S[(i + k + N) % N]; b = S[(i + k + 1 + N) % N];
    const ry = a.y + (b.y - a.y) * u; return ry + wallFace(S[c.idx], c.d) + (T.dent && !inTube(T, c, ry) ? T.dent(c.x, c.z) : 0);
  }

  // M = the map (one entry of MAPS). Control points (x,z) in metres, clockwise = bends toward rightDir. Start at [0]. HGT = altitude of each point.
  function buildTrack(THREE, M) {
    const W = M.W, CARD = M.car, SC = M.sc, HGT = M.pts.map(p => p[2]), PTS = M.pts.map(p => [p[0] * SC, p[1] * SC]), KT = { ...KT0 };
    const curve = new THREE.CatmullRomCurve3(PTS.map((p, i) => new THREE.Vector3(p[0], HGT[i], p[1])), true, 'centripetal');
    curve.arcLengthDivisions = 4000;
    const len = curve.getLength(), n = Math.round(len / 2), P = curve.getSpacedPoints(n), S = [];
    for (let i = 0; i < n; i++) {
      const p = P[i], q = P[i + 1], dx = q.x - p.x, dz = q.z - p.z, l = Math.hypot(dx, dz);
      S.push({ x: p.x, y: p.y, z: p.z, tx: dx / l, tz: dz / l, k: 0, sl: (q.y - p.y) / l, dl: 0, kl: 0 }); // sl = slope; dl, kl = offset from centre and curvature of the autopilot's path
    }
    // signed curvature (>0 = bend to the right), smoothed over ±3 samples
    S.forEach((s, i) => { const a = S[(i - 3 + n) % n], b = S[(i + 3) % n]; s.k = s.kl = (a.tx * b.tz - a.tz * b.tx) / (6 * len / n); });
    const near = p => { let b = 0, bd = 1e9; S.forEach((s, i) => { const d = (s.x - p[0]) ** 2 + (s.z - p[1]) ** 2; if (d < bd) { bd = d; b = i; } }); return b; };
    const at = i => near(PTS[i]), TUN = M.tun || [0, 0];
    // variable width: M.wide = [[a, b, w], …] half-width w (wider or narrower than W) between points a and b, blended over 60 m on each side; elsewhere W (s.w = half-width at the sample)
    S.forEach(s => s.w = W);
    for (const [a, b, w] of M.wide || []) { const i0 = at(a), l = (at(b) - i0 + n) % n; for (let k = -30; k <= l + 30; k++) { const f = Math.min(1, (k + 30) / 30, (l + 30 - k) / 30), s = S[(i0 + k + n) % n]; s.w = (w < W ? Math.min : Math.max)(s.w, W + (w - W) * f * f * (3 - 2 * f)); } }   // w < W: the track narrows (beach footbridge); no other map sets one
    // rollable walls: M.trough = [[a, b, width, radius], …] adds on each side of the flat, between points a and b, a quarter tube opening over 40 m (s.pl = half-width of the flat, s.rc = radius of the tube)
    S.forEach(s => { s.pl = s.w; s.rc = 0; });
    for (const [a, b, B, R] of M.trough || []) { const i0 = at(a), l = (at(b) - i0 + n) % n; for (let k = 0; k <= l; k++) { const f = Math.min(1, k / 20, (l - k) / 20), s = S[(i0 + k) % n]; s.rc = R; s.w = W + B * f * f * (3 - 2 * f); } }
    // jumps: M.jumps = [[point, length, height, pit, depth], …]: a ramp that rises in a parabola and ends cleanly at the point; behind it, an optional pit left by a 16 m ramp: a missed jump costs time, never blocks
    for (const [p, L, h, F = 0, P = 0] of M.jumps || []) { const i0 = at(p), nl = Math.round(L / 2), nf = Math.round(F / 2);
      for (let k = 1; k <= nl; k++) S[(i0 - nl + k + n) % n].y += h * (k / nl) ** 2;
      for (let k = 1; k <= nf; k++) S[(i0 + k) % n].y -= P * Math.min(1, (nf - k) / 8); }
    const vert = !!(M.jumps || M.trough);
    // M.evenJump = [speed (m/s), power, floor]: a car that takes off at v falls at grav × clamp(v / speed, floor, 1.3) ^ power. At power 2 the jump length no longer depends on v; at 0 nothing changes
    // M.bowls = [[x, z, floor radius, rim radius, height, power, r1, lipX, lipZ, halfWidth], …]: the ground rises round a flat floor like the inside of a crater, height × ((r - floor) / (rim - floor)) ^ power.
    //   The ribbon is at floor level inside it. Under the jump (within halfWidth of the line from the centre to the lip, beyond r1) the bowl fades to 0 at the rim: there the ribbon itself comes down from the lip
    // M.loft = [share, gravity]: the car has inertia on crater ground (M.dents, M.bowls). Without it the ground's vertical speed is read 2 m ahead of the car: it has vanished by the time the car is at a lip, and pulls down before a rim, so the car never leaves the ground.
    //   With it that speed is the one the ground really gave over the last step: past a rim the ground drops away and the car falls after it; at a lip it keeps `share` of its upward speed (the suspension takes the rest, on a landing against a rising slope too) and flies. Those hops fall at grav × `gravity`, not evenJump's
    // M.grav: the free-fall gravity of the map (the Moon: 1.62); M.dents = [[x, z, radius, depth], …]: bowls dug in the ground wherever the car drives (small craters), in map metres like pts
    const dent = (M.dents || M.bowls) && ((x, z) => { let h = 0; for (const [cx, cz, r, p] of M.dents || []) { const q = ((x - cx * SC) ** 2 + (z - cz * SC) ** 2) / (r * r * SC * SC); if (q < 1) h = Math.min(h, -p * (1 - q)); }
      for (const [cx, cz, rf, rr, H, p, r1, lx, lz, hw] of M.bowls || []) { const dx = x / SC - cx, dz = z / SC - cz, r = Math.hypot(dx, dz); if (r <= rf || r >= rr) continue;
        const l = Math.hypot(lx - cx, lz - cz), lip = r > r1 && dx * (lx - cx) + dz * (lz - cz) > 0 && Math.abs(dx * (lz - cz) - dz * (lx - cx)) / l < hw; // under the jump
        h += H * (((lip ? r1 : r) - rf) / (rr - rf)) ** p * (lip ? Math.max(0, 1 - (r - r1) / (0.7 * (rr - r1))) : 1); } // (nothing in the last 30 % before the rim: the lip must be the highest point)
      return h; });
    if (vert) S.forEach((s, i) => { const b = S[(i + 1) % n]; s.sl = (b.y - s.y) / Math.hypot(b.x - s.x, b.z - s.z); });
    // M.obst = [[x, z, half-width, half-length, ry = 0, y], …]: solid boxes standing on the drivable ground (wrecks, rubble, piers, buildings), in map metres like pts; ry turns the box like a three.js rotation.y.
    // y (altitude of its foot): given where the track passes over or under itself, the box only counts for the samples within 4 m of that altitude. T.obst[i] = the boxes within reach of sample i
    // (the impact is in step(), the autopilot's path keeps 2.1 m clear of them below). No map without M.obst is affected.
    const OB = (M.obst || []).map(([x, z, hx, hz, ry = 0, y]) => ({ x: x * SC, z: z * SC, hx, hz, c: Math.cos(ry), s: Math.sin(ry), y, r: Math.hypot(hx, hz) }));
    const obst = M.obst ? S.map(s => OB.filter(o => (o.y == null || Math.abs(o.y - s.y) < 4) && Math.hypot(o.x - s.x, o.z - s.z) < o.r + s.w + 4)) : null;
    // the autopilot's path is the least-curvature line that stays on the road, 2.1 m from the walls (or from the foot of the faces: it stays on the flat), whatever the width (outside, inside line, outside).
    // One point every 8 m, each brought back to where its 4 neighbours would want it so the line turns as little as possible; then its curvature, by the circle through 3 points.
    {
      const m = 4, N = Math.floor(n / m), D = new Float64Array(N), pt = (i, d) => { const s = S[(i + n) % n]; return [s.x - s.tz * d, s.z + s.tx * d]; };
      // 6000 passes over all the points: loop with no allocation (flat arrays), it was most of the loading time of a mapDef. Same operations in the same order: identical result to the bit.
      const X = new Float64Array(N), Z = new Float64Array(N), TX = new Float64Array(N), TZ = new Float64Array(N), LIM = new Float64Array(N);
      for (let j = 0; j < N; j++) { const s = S[j * m]; X[j] = s.x; Z[j] = s.z; TX[j] = s.tx; TZ[j] = s.tz; LIM[j] = s.pl - 3.2; }
      // the limits of the path on each side. The boxes (M.obst) limit it too: of each outline (a point every 2 m) the part within 6 m along the road gives its extent across the road, d0 to d1, widened by 2.1 m;
      // the path keeps to the gap between them that holds the axis of the road, or the nearest to it
      const LO = LIM.map(v => -v), HI = LIM.slice();
      if (obst) for (let j = 0; j < N; j++) { const I = []; for (const o of obst[j * m]) { let d0 = 1e9, d1 = -1e9;
        for (let e = 0; e < 4; e++) { const [u0, v0, u1, v1] = [[-1, -1, 1, -1], [1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1]][e], q = Math.ceil((e & 1 ? o.hz : o.hx) + 1);
          for (let i = 0; i < q; i++) { const u = (u0 + (u1 - u0) * i / q) * o.hx, v = (v0 + (v1 - v0) * i / q) * o.hz, qx = o.x + u * o.c + v * o.s - X[j], qz = o.z - u * o.s + v * o.c - Z[j];
            if (Math.abs(qx * TX[j] + qz * TZ[j]) < 6) { const d = -qx * TZ[j] + qz * TX[j]; d0 = Math.min(d0, d); d1 = Math.max(d1, d); } } }
        if (d0 <= d1) I.push([d0 - 2.1, d1 + 2.1]); }
        let lo = LO[j], best = null; const gap = (a, b) => { if (b > a && (!best || Math.max(a, -b, 0) < Math.max(best[0], -best[1], 0))) best = [a, b]; };
        for (const [a, b] of I.sort((p, q) => p[0] - q[0])) { gap(lo, Math.min(a, HI[j])); lo = Math.max(lo, b); } gap(lo, HI[j]);
        if (best) { LO[j] = best[0]; HI[j] = best[1]; } else LO[j] = HI[j] = 0; }
      for (let it = 0; it < 6000; it++) for (let j = 0; j < N; j++) {
        const a = (j - 1 + N) % N, b = (j + 1) % N, a2 = (j - 2 + N) % N, b2 = (j + 2) % N;
        const ax = X[a] - TZ[a] * D[a], az = Z[a] + TX[a] * D[a], bx = X[b] - TZ[b] * D[b], bz = Z[b] + TX[b] * D[b];
        const a2x = X[a2] - TZ[a2] * D[a2], a2z = Z[a2] + TX[a2] * D[a2], b2x = X[b2] - TZ[b2] * D[b2], b2z = Z[b2] + TX[b2] * D[b2];
        D[j] = clamp(-((4 * (ax + bx) - a2x - b2x) / 6 - X[j]) * TZ[j] + ((4 * (az + bz) - a2z - b2z) / 6 - Z[j]) * TX[j], LO[j], HI[j]);
      }
      S.forEach((s, i) => { const j = Math.floor(i / m) % N, f = i / m - Math.floor(i / m); s.dl = D[j] + (D[(j + 1) % N] - D[j]) * f; });
      S.forEach((s, i) => { const a = pt(i - m, S[(i - m + n) % n].dl), b = pt(i, s.dl), c = pt(i + m, S[(i + m) % n].dl), ux = b[0] - a[0], uz = b[1] - a[1], vx = c[0] - b[0], vz = c[1] - b[1];
        s.kl = 2 * (ux * vz - uz * vx) / (Math.hypot(ux, uz) * Math.hypot(vx, vz) * Math.hypot(c[0] - a[0], c[1] - a[1])); });
    }
    const t0 = at(TUN[0]), t1 = at(TUN[1]);
    // rain (th.rainFx): 1 = everywhere, or zones [point a, point b, strength] blended over 60 samples (120 m). T.rainFx = strength per sample (the image); T.surf = the road (see SURF)
    const span = (a0, a1, r) => i => { const a = (i - a0 + n) % n, L = (a1 - a0 + n) % n; return a < L ? 1 : Math.max(0, 1 - (a - L) / r, 1 - (n - a) / r); };
    const pz = Array.isArray(M.th.rainFx) ? M.th.rainFx.map(([a, b, f]) => [span(at(a), at(b), 60), f]) : null, tz = span(t0, t1, 20);
    const rainFx = Float32Array.from(S, (_, i) => pz ? Math.max(0, ...pz.map(([z, f]) => z(i) * f)) : M.th.rainFx ? 1 : 0);
    const sf = M.surf || {}, sz = (sf.zones || []).map(([a, b, t, f = 1]) => [span(at(a), at(b), 10), SURF[t], f]);
    const road = (i, k) => { let q = mixed(SURF[sf.backdrop || 'sec'], SURF.damp, (rainFx[i] ? clamp(0.3 + (rainFx[i] - 1) * 0.35, 0, 1) : 0) * k * (M.tun ? 1 - tz(i) : 1)); for (const [z, t, f] of sz) q = mixed(q, t, z(i) * f); return q; };
    const surf = S.map((_, i) => road(i, 1)), surfDry = surf.map((q, i) => rainFx[i] ? road(i, MO.sec) : q); // surfDry: the same road on the dry line (see MO)
    // tun: the map has a tunnel, from t0 to t1; h0-h1: "hot" sector for the music; sp: the two intermediate times (sample indices)
    KT.w0 *= CARD.grip || 1; KT.w1 *= CARD.grip || 1; // a car more or less grippy turns more or less hard (all at 1 today)
    // jam [pt a, pt b, f]: between these points, trucks drive at f times their speed, so they pile up there (1/f times closer together). tau[j] = cumulative time (in samples at speed 1) up to j
    let tau = null; if (M.jam) { const [a, b, f] = M.jam, z = span(at(a), at(b), 10); tau = new Float64Array(n + 1); for (let j = 0; j < n; j++) tau[j + 1] = tau[j] + 1 / (1 - (1 - f) * z(j)); }
    // truck in double file: M.lorry = [point, offset in m]; parked against the kerb, on one side on odd laps, the other on even laps (see lorry())
    const cam = M.lorry && { i: (at(M.lorry[0]) + Math.round(M.lorry[1] / 2) + n) % n, d: W - 1.6 };
    return { S, n, W, len, tun: !!M.tun, t0, t1, tau, cam, h0: at(M.hotList[0]), h1: at(M.hotList[1]), sp: M.sect.map(at), rainFx, surf, surfDry, surfL: SURF[sf.wide], vert, grav: M.grav || GRAV, even: M.evenJump, loft: M.loft, dent, racingLine: M.racingLine && M.racingLine.map(at), obst, mapDef: M, car: CARD, kt: KT,
      trucks: Array.from({ length: M.traffic || 0 }, (_, i) => ({ lane: [-4.6, 0, 4.6][(i * 2) % 3], v: 25 + (i * 7 % 5) * 1.5, x: 0, y: 0, z: 0, th: 0, idx: 0, d: 0, vx: 0, vz: 0 })) }; // camions : voir traffic()
  }

  function newCar(T) {
    const i = T.n - 8, s = T.S[i]; // 16 m before the line
    return { x: s.x, z: s.z, th: Math.atan2(s.tz, s.tx), vx: 0, vz: 0, steer: 0, yaw: 0, idx: i, dist: -8, d: 0, hit: 0, vf: 0, vl: 0,
      score: 0, ongoing: 0, mult: 1, glD: 0, glT: 0, // drift mode (see GL); glD, glT: duration of the current drift, time since the last one
      drift: false, slide: 0, driftT: 0, dd: 0, sa: 0, nitro: 0, sec: 1, boost: 0, asp: 0, stun: 0, nDrift: 0, nBoost: 0, nWall: 0, // nitro: the gauge; boost: it pushes; asp: slipstream received (0 to 1, race); n… : tally (drifts, nitro bursts, wall impacts)
      manual: false, gear: 0, lastGear: 0, shiftT: 0, rpm: T.car.idle,
      y: s.y, vy: 0, air: false, airT: 0, land: 0 }; // relief: height, vertical speed, airborne, duration of the current flight, impact speed at landing (a single step)
  }

  // Contact with a wall: N = unit normal towards the wall, o = penetration, T = direction of the wall in the direction of travel, sgT = side of the wall relative to T
  // (+1 = to the right), kw = curvature of the wall in the direction it turns the car (outside wall of a bend > 0)
  function intoWall(c, Nx, Nz, o, Tx, Tz, sgT, kw, dt) {
    const vn = c.vx * Nx + c.vz * Nz;
    c.x -= Nx * o; c.z -= Nz * o; c.rub = 1;
    if (Math.hypot(c.vx, c.vz) > 15) gains(c, NI.intoWall * dt); // grazing the wall fills the gauge (a solid impact, lower, empties it)
    // rubbing the wall brakes continuously; and the outside wall of a bend does not replace the tyres: leaning on it to turn costs speed, in proportion to what it turns (nothing along a straight wall)
    const v = Math.hypot(c.vx, c.vz), sc = Math.exp(-(WALL_RUB + WALL_MU * Math.max(0, kw * v - 0.1)) * dt); c.vx *= sc; c.vz *= sc;
    const rel = wrap(c.th - Math.atan2(Tz, Tx)), into = rel * sgT > 0 && Math.abs(rel) < 1.5; // nose turned towards the wall
    c.th -= rel * Math.min(1, (into ? 25 : 4) * dt); // the wall straightens the car: wheel turned towards it, it slides along instead of planting itself in it
    if (vn > 0) {
      // the dry loss only falls at arrival on the wall: staying pressed against it, wheel turned, only rubs
      const fresh = !(c.wallT > 0), sa = vn / Math.max(Math.hypot(c.vx, c.vz), 1), k = fresh ? 1 - clamp((sa - WALL_SOFT) * WALL_LOSS, 0, 0.7) : 1;
      c.vx = (c.vx - Nx * vn) * k; c.vz = (c.vz - Nz * vn) * k; c.hit = fresh ? vn : 0; if (fresh && vn > 2) c.nWall++; // no bounce: we slide along the wall
      c.th += wrap(Math.atan2(Tz, Tx) - c.th) * Math.min(0.5, vn * 0.03);
      if (fresh && sa > WALL_HARD && vn > 5) { c.dd = 0; c.driftT = 0; c.nitro = 0; c.stun = 0.8; } // a real impact empties the gauge and cuts the engine for 0.8 s
    }
    c.wallT = 0.4;
  }
  const insidePlace = (T, x, z) => { const P = T.mapDef.place; return !!P && Math.hypot(x - P.c[0], z - P.c[1]) < P.r; }; // on the plaza, we drive everywhere

  // inp: {steer:-1..1 (droite>0), gas:0..1, brake:0..1, hand:bool}
  // one driving step, wheels on the ground
  function rolling(c, inp, T, dt) {
    const S = T.S, KT = T.kt, CARD = T.car, ca = c.ca; // ca: the damage state (CASSE mode only, see brokenImpact)
    c.steer += clamp(inp.steer + (ca ? ca.dir : 0) - c.steer, -12 * dt, 12 * dt); // a bent axle or a flat tyre makes the car pull
    let fx = Math.cos(c.th), fz = Math.sin(c.th);
    let vf = c.vx * fx + c.vz * fz, vl = c.vz * fx - c.vx * fz;
    const sp = Math.abs(vf);
    // Drift (see KT0): drift button + wheel, above 45 km/h; it locks its direction (c.dd) while the button is held; the wheel only opens or closes the arcRadius.
    const Q = c.ground = surfAt(T, c); // c.ground: the ground under the car, for rolling (audio.js)
    const traction = (1 - Q.gripCoef) * (CARD.grip || 1) * (ca ? ca.grip : 1); // grip = ground × car (so that the speed follows the nose)
    if (!c.dd && inp.hand && sp > 12 * (1 - Q.gl) && Math.abs(inp.steer) > 0.3 * (1 - Q.gl)) { c.dd = Math.sign(inp.steer); c.nDrift++; }
    if (c.dd && (!inp.hand || sp < 10 * (1 - Q.gl))) { c.dd = 0; c.driftT = 0; }
    if (c.dd) gains(c, NI.gl * Math.min(1, c.driftT / 0.6) * Math.min(1, sp / TOP) * dt); // held drift fills the gauge, all the more the longer and faster it goes
    c.frA = !!(inp.hand && !c.dd && sp > 8); // drift button without wheel: rear brake
    c.aq = Q.aq ? clamp((sp - Q.vaq) / 4, 0, 1) : 0; // route glissante : moins de lacet, encore moins en aquaplaning
    const ks = (1 - Q.corner) * (1 - Q.aq * c.aq) * (ca ? ca.grip : 1), om = omega(sp, KT) * ks, sd = c.steer * (c.dd || 0), a = Math.min(1, traction); // ks: ground grip for turning (the car is in w0, w1)
    const outTarget = (c.dd || 0) * KT.angMax * (sd >= 0 ? lerp(KT.aN, KT.aIn, sd) : lerp(KT.aN, KT.aOut, -sd)) * (1.5 - 0.5 * a);
    const dsa = (outTarget - c.sa) * Math.min(1, dt * KT.sar * (c.dd ? 1.5 - 0.5 * a : 2));
    const w = c.dd ? c.dd * om * (sd >= 0 ? lerp(KT.kN, KT.kIn, sd) : lerp(KT.kN, KT.kOut, -sd)) : c.steer * om * (inp.gas && !inp.brake ? 1 : KT.lift);
    c.yaw += (w - c.yaw) * Math.min(1, dt * (c.dd ? KT.yr : 18)); // out of drift the response is almost immediate; in drift the turn tightens gradually
    c.sa += dsa;
    c.th += c.yaw * (Math.sign(vf) || 1) * dt + (c.dd ? dsa : 0); // on exiting a drift the nose does not come back: it's the trajectory that rejoins the nose, the car sets off where it points
    fx = Math.cos(c.th); fz = Math.sin(c.th);
    vf = c.vx * fx + c.vz * fz; vl = c.vz * fx - c.vx * fz;
    // Engine and gearbox: the rpm is what the wheels impose through the engaged gear, the torque is read off the engine curve,
    // and each gear change cuts thrust for 0.25 s (the time to declutch). Automatic gearbox: shifts up at 7500 rpm, downshifts below ~4000.
    const K = CARD.final * 30 / (Math.PI * CARD.wheel), av = Math.abs(vf); // rpm per m/s, for a gear ratio of 1
    if (!c.manual && av < 3) c.gear = c.lastGear = 0; // nearly at standstill: the automatic gearbox goes straight back to 1st
    if (!c.manual && c.shiftT <= 0) {
      if (av * K * CARD.ratios[c.gear] > CARD.up && c.gear < CARD.ratios.length - 1) c.gear++;
      else if (c.gear > 0 && av * K * CARD.ratios[c.gear - 1] < CARD.down) c.gear--;
    }
    if (c.gear !== c.lastGear) { c.shiftT = 0.25; c.lastGear = c.gear; }
    const ratio = CARD.ratios[c.gear], wr = av * K * ratio, er = Math.max(wr, c.gear === 0 && inp.gas ? 3500 : CARD.idle); // in 1st, the clutch slips around 3500 rpm on pull-away
    c.rpm += (Math.min(er, CARD.red + 150) - c.rpm) * Math.min(1, dt * 18);
    const spacer = inp.nitro && inp.gas && c.nitro > 0 && !c.sec ? 1 : 0; if (spacer && !c.boost) c.nBoost++;
    let acc = 0, rup = false;
    if (c.shiftT > 0) c.shiftT -= dt;
    else if (wr > CARD.red && !(spacer && c.gear === CARD.ratios.length - 1)) { acc = -6 * Math.sign(vf); rup = true; } // over-rev: rev limiter and heavy engine braking
    else {
      const tqe = inp.gas * torque(CARD, er) - (1 - inp.gas) * (20 + 0.01 * er) * Math.sign(vf); // engine torque, or engine braking off-throttle
      acc = Math.min(CARD.trac * (1 - Q.trac), tqe * ratio * CARD.final * CARD.eff / CARD.wheel / CARD.mass); // capped by grip (~1.1 g in 4WD, less in rear-wheel drive)
    }
    if (ca && acc > 0) acc *= ca.p; // damaged engine: less thrust
    c.boost = spacer; // (on the last gear nitro goes past the limiter: it also pushes a car at the end of a straight; on the others the limiter holds, otherwise a 1st gear held in a manual gearbox would keep all its torque beyond max rpm)
    if (spacer) { c.nitro = Math.max(0, c.nitro - dt / NI.dur); acc += NI.acc * (rup ? 1 : 1 + NI.rep * Math.max(0, 1 - av / TOP)); } // at the limiter, the base thrust only: it always holds
    if (c.nitro <= 0) c.sec = 1; else if (c.nitro >= NI.sec) c.sec = 0; // dry gauge: nitro waits for a segment (NI.sec); otherwise drift, slipstream or the wall would make it push endlessly on a net, with the gauge shown empty
    if (c.stun > 0) { c.stun -= dt; if (acc > 0) acc *= 0.2; }
    vf += acc * dt;
    const s0 = S[c.idx]; if (Math.abs(vf) > 1) vf -= 9.81 * s0.sl * (fx * s0.tx + fz * s0.tz) * dt; // the slope pushes or holds back
    if (inp.brake) vf -= (vf > 0.5 ? 18 : 12) * (1 - Q.brakes) * inp.brake * dt;
    if (vf > 0) vf -= ((c.frA ? KT.brakeRear * (1 - Q.brakes) : 0) + (c.dd ? KT.scrub * Math.abs(c.sa) / KT.angMax : 0)) * dt; // rear brake; drifting uses up a little speed
    if (vf < -12) vf = -12;
    // aerodynamic drag (½·ρ·Cd·A·v²), rolling resistance, and a little speed lost while turning
    if (c.asp) gains(c, NI.asp * c.asp * dt); // in the slipstream: less drag, and the gauge rises
    vf -= (0.6 * CARD.cd * CARD.area * (1 - NI.acx * c.asp) * vf * Math.abs(vf) / CARD.mass / (ca ? ca.vf * ca.vf : 1) +((Math.abs(vf) > 0.3 ? 0.15 + Q.rollAmt : 0) + KT.tv * Math.abs(c.yaw) * Math.min(1, sp / 10)) * Math.sign(vf)) * dt;
    // no tyres breaking loose: the speed follows the car's nose (offset by the drift angle when drifting), without losing anything; a side impact is caught in a tenth of a second
    const v0 = Math.hypot(vf, vl);
    const dvl = (-Math.sin(c.sa) * v0 - vl) * Math.min(1, 25 * (c.dd ? Math.pow(traction, 0.35) : traction) * (1 - Q.aqc * c.aq) * dt); // on a slippery road (or a car with little grip), the speed follows the nose with a delay: the car fishtails
    vl += dvl;
    if (v0 > 1) { const k = v0 / Math.max(Math.hypot(vf, vl), 1e-3); vf *= k; vl *= k; }
    c.slide = Math.min(1, Math.abs(c.sa) / KT.angMax); c.drift = !!c.dd;
    if (c.dd) c.driftT += dt;
    c.vx = fx * vf - fz * vl; c.vz = fz * vf + fx * vl;
    c.x += c.vx * dt; c.z += c.vz * dt; c.vf = vf; c.vl = vl;
  }
  // one airborne step: the car keeps its heading and speed, less drag; throttle held, the engine revs freely
  function flies(c, inp, CARD, dt) {
    const k = 1 - 0.6 * CARD.cd * CARD.area * Math.hypot(c.vx, c.vz) / CARD.mass * dt;
    c.vx *= k; c.vz *= k; c.x += c.vx * dt; c.z += c.vz * dt; c.yaw = 0; c.airT += dt; c.boost = 0; // no nitro in the air
    if (inp.gas) c.rpm += (CARD.red - c.rpm) * Math.min(1, dt * 6);
  }

  function step(c, inp, T, dt) {
    const S = T.S, n = T.n;
    points(c, dt); // (before the step: c.hit still carries the impact of the previous step, trucks included)
    if (c.air) flies(c, inp, T.car, dt); else rolling(c, inp, T, dt);
    // position on the track + walls (impossible to cut: a completed lap is always valid)
    let b = c.idx, bd = 1e9;
    // on the plaza you cut where you like: we search for the nearest sample well further ahead
    for (let j = -6, jm = insidePlace(T, c.x, c.z) ? 250 : 14; j <= jm; j++) { const i = (c.idx + j + n) % n, s = S[i], d = (s.x - c.x) ** 2 + (s.z - c.z) ** 2; if (d < bd) { bd = d; b = i; } }
    c.dist += ((b - c.idx + n + n / 2) % n) - n / 2;
    c.idx = b;
    const s = S[b], nx = -s.tz, nz = s.tx, L = s.w - 1.1;
    c.d = (c.x - s.x) * nx + (c.z - s.z) * nz; c.hit = 0; c.rub = 0; c.wallT = (c.wallT || 0) - dt;
    const o = Math.abs(c.d) - L, P = T.mapDef.place, pr = P ? Math.hypot(c.x - P.c[0], c.z - P.c[1]) - (P.r - 1.1) : Infinity; // pr > 0: outside the plaza circle
    const tube = o > 0 && inTube(T, c, s.y);
    if (o > 0 && (pr > 0 || tube)) { // off the road and off the plaza: the nearest wall
      // P.gap: the circle is only a wall beyond gap m from the road, where the scenery draws it; closer, the road wall continues straight (a gap between the two, at the join)
      if (!tube && pr < o && o > (P.gap || 0)) { const dx = (c.x - P.c[0]) / (pr + P.r - 1.1), dz = (c.z - P.c[1]) / (pr + P.r - 1.1), t = c.vx * -dz + c.vz * dx > 0 ? 1 : -1; intoWall(c, dx, dz, pr, -dz * t, dx * t, -t, 1 / P.r, dt); }
      else { const sg = Math.sign(c.d); c.d = sg * L; intoWall(c, nx * sg, nz * sg, o, s.tx, s.tz, sg, -s.k * sg, dt); }
    }
    if (T.racingLine && !c.rub && o > -1 && Math.hypot(c.vx, c.vz) > 15 && (b - T.racingLine[0] + n) % n < (T.racingLine[1] - T.racingLine[0] + n) % n) gains(c, NI.racingLine * dt); // the inside line grazing the wall, without touching it (M.racingLine)
    // the piers of a monument placed on the plaza (triumphal arch): boxes in the monument's frame, two circles per car as for car-to-car impacts
    if (P && P.piers) { const cs = Math.cos(P.a), sn = Math.sin(P.a);
      for (const j of [-CO, CO]) for (const [px, pz, hx, hz] of P.piers) {
        const qx = c.x + Math.cos(c.th) * j - P.c[0], qz = c.z + Math.sin(c.th) * j - P.c[1], lx = qx * cs - qz * sn, lz = qx * sn + qz * cs;
        const ex = lx - clamp(lx, px - hx, px + hx), ez = lz - clamp(lz, pz - hz, pz + hz), d = Math.hypot(ex, ez);
        if (d >= CR || d < 1e-6) continue;
        const ax = -ex / d, az = -ez / d, Nx = ax * cs + az * sn, Nz = -ax * sn + az * cs, t = c.vx * -Nz + c.vz * Nx > 0 ? 1 : -1; // normal towards the pier, in world frame
        intoWall(c, Nx, Nz, CR - d, -Nz * t, Nx * t, -t, 0, dt);
      }
    }
    // the monument's central reservation: a ring of chained bollards of radius island[0], open over island[1] m on each side of the axis of the great arch; a thin wall, rubbed on both sides
    if (P && P.island) { const qx = c.x - P.c[0], qz = c.z - P.c[1], r = Math.hypot(qx, qz), e = r - P.island[0];
      if (Math.abs(e) < CR && Math.abs(qx * Math.cos(P.a) - qz * Math.sin(P.a)) > P.island[1]) { const sg = e < 0 ? 1 : -1, Nx = sg * qx / r, Nz = sg * qz / r, t = c.vx * -Nz + c.vz * Nx > 0 ? 1 : -1;
        intoWall(c, Nx, Nz, CR - Math.abs(e), -Nz * t, Nx * t, -t, sg / P.island[0], dt); } }
    // the double-file truck (T.cam): a 9 × 2.5 m box in the road's frame, on the side given by this car's lap
    if (T.cam) { const o = lorry(T, c), s0 = S[o.idx], ox = s0.x - s0.tz * o.d, oz = s0.z + s0.tx * o.d;
      for (const j of [-CO, CO]) {
        const qx = c.x + Math.cos(c.th) * j - ox, qz = c.z + Math.sin(c.th) * j - oz, lx = qx * s0.tx + qz * s0.tz, lz = -qx * s0.tz + qz * s0.tx; // along, across
        const ex = lx - clamp(lx, -4.5, 4.5), ez = lz - clamp(lz, -1.25, 1.25), d = Math.hypot(ex, ez);
        if (d >= CR || d < 1e-6) continue;
        const ax = -ex / d, az = -ez / d, Nx = ax * s0.tx - az * s0.tz, Nz = ax * s0.tz + az * s0.tx, t = c.vx * -Nz + c.vz * Nx > 0 ? 1 : -1;
        intoWall(c, Nx, Nz, CR - d, -Nz * t, Nx * t, -t, 0, dt);
      } }
    // the solid boxes of the map (M.obst): two circles per car as for the piers; a circle whose centre is already inside a box (a thin post, at speed) leaves by its nearest face
    if (T.obst) for (const o of T.obst[b]) for (const j of [-CO, CO]) {
      const qx = c.x + Math.cos(c.th) * j - o.x, qz = c.z + Math.sin(c.th) * j - o.z, lx = qx * o.c - qz * o.s, lz = qx * o.s + qz * o.c;
      let ex = lx - clamp(lx, -o.hx, o.hx), ez = lz - clamp(lz, -o.hz, o.hz), d = Math.hypot(ex, ez), p = CR - d;
      if (d >= CR) continue;
      if (d < 1e-6) { const px = o.hx - Math.abs(lx), pz = o.hz - Math.abs(lz); if (px < pz) { ex = Math.sign(lx) || 1; ez = 0; p = px + CR; } else { ex = 0; ez = Math.sign(lz) || 1; p = pz + CR; } d = 1; }
      const ax = -ex / d, az = -ez / d, Nx = ax * o.c + az * o.s, Nz = -ax * o.s + az * o.c, t = c.vx * -Nz + c.vz * Nx > 0 ? 1 : -1;
      intoWall(c, Nx, Nz, p, -Nz * t, Nx * t, -t, 0, dt);
    }
    // relief: free fall, unless the ground is there
    const g = ground(T, c);
    if (!T.vert) { c.y = g; return; }
    const vy = c.vy - T.grav * (c.air && c.gk || 1) * dt, y = c.y + vy * dt, sg = (c.x - s.x) * s.tx + (c.z - s.z) * s.tz < 0 ? S[(b - 1 + n) % n] : s, dv = !T.dent || inTube(T, c, sg.y) ? 0 : T.loft ? (T.dent(c.x, c.z) - T.dent(c.x - c.vx * dt, c.z - c.vz * dt)) / dt : (T.dent(c.x + c.vx * 0.05, c.z + c.vz * 0.05) - T.dent(c.x, c.z)) / 0.05, vg = sg.sl * (c.vx * sg.tx + c.vz * sg.tz) + (T.loft && dv > 0 ? dv * T.loft[0] : dv); c.land = 0; // (and the slope of craters, M.dents and M.bowls: going down one the car stays on the ground, coming out of one it is thrown up) // sg: the ribbon section under the car; vg: the vertical speed its slope gives the car (the wall does not count here: climbing it does not launch into the air)
    const p = slope(s, c.d);
    if (y > g && (c.airT || !p)) { const was = c.air; c.y = y; c.vy = vy; c.air = y - g > DROOP;
      if (c.air && !was) c.gk = T.loft && (c.lo || dv) ? T.loft[1] : T.even ? clamp(Math.hypot(c.vx, c.vz) / T.even[0], T.even[2], 1.3) ** T.even[1] : 1; // M.evenJump: gravity of this flight, lighter for a slow car (c.gk): everyone lands in the same area
      return; } // (on a wall you do not take off: the speed pins the car to it, it follows the surface)
    if (c.airT) { c.land = vg - vy; const k = 1 - clamp((c.land - LAND0) * LANDK, 0, LANDX); c.vx *= k; c.vz *= k; c.airT = 0; }
    c.y = g; c.vy = vg; c.air = false; if (T.loft) c.lo = dv !== 0; // M.loft (see buildTrack): c.lo, the last ground touched was a crater's
    { const hp = wallFace(s, c.d), dh = hp - (c.hp ?? hp); c.hp = hp; // c.hp: height on the wall at the previous step
      if (dh) { const v2 = c.vx * c.vx + c.vz * c.vz, k = Math.sqrt(Math.max(1, v2 - 2 * GRAV * CLIMB * dh) / Math.max(1, v2)); c.vx *= k; c.vz *= k; } }
    // on a wall, gravity pulls down the slope: across the car it makes it turn (it's the banked turn that carries), along its axis it slows it going up and speeds it going down
    // and the tyres, squashed against the concrete, turn all the harder: the wheel's yaw gains the load factor 1 / cos(slope)
    if (p) { const a = -GRAV * p; c.vx += nx * a * dt; c.vz += nz * a * dt; c.th += ((nz * Math.cos(c.th) - nx * Math.sin(c.th)) * a / Math.max(4, Math.hypot(c.vx, c.vz)) + c.yaw * (Math.sqrt(1 + p * p) - 1)) * dt; }
  }

  // Autopilot: used for the node test, for ?auto mode, to bring the car back after finishing, and for opponents in raceCase.
  // lvl = driver level (1 = clean reference lap; lower = less throttle and slower bends).
  // others = cars to avoid: it shifts over to overtake a slower car, doesn't cut in while level with it, and brakes if stuck behind.
  // speed allowed at sample idx = that of each bend of the upcoming path, plus what can be shed by braking from there (10 m/s², 2 m per sample)
  // on a slippery surface (SURF): bends at the yaw it leaves (with a margin where the nose is slower than in rain: the car widens out), without exceeding the aquaplaning threshold where it would no longer pass, and longer braking
  // It depends only on the sample: computed once per sample and kept in T.va (200 bends looked at, 8 times per frame in a race otherwise). Used by the autopilot and the HUD corner alert.
  function vAllowed(T, idx) {
    const S = T.S, n = T.n;
    if (T.vaSurf !== T.surf) { T.va = new Float64Array(n).fill(-1); T.vaSurf = T.surf; } // (it also depends on the surface: if T.surf changes, we start again from zero)
    const VA = T.va;
    let va = VA[idx];
    if (va < 0) {
      va = 1e9; let fr = 0; // fr: what braking can recover by then, surface by surface (an ice patch ahead is braked for first)
      for (let j = 0; j < 200; j++) {
        const i = (idx + j) % n, Q = surf(T, i), k = Math.abs(S[i].kl) + 1e-4, g = 1.2 * (1 - Q.corner) * (1 - 0.8 * Math.max(0, Q.gripCoef - 0.5)), vq = Q.vaq;
        let v = vturn(g, k, T.kt); if (Q.aq && v > vq) v = Math.max(vq, vturn(g * (1 - Q.aq), k, T.kt)); // beyond the aquaplaning threshold, with some margin: the car fishtails there
        va = Math.min(va, Math.sqrt(v ** 2 + fr)); fr += 40 * (1 - Q.brakes);
      }
      VA[idx] = va;
    }
    return va;
  }
  // HUD corner alert, at speed sp (m/s) from sample idx: only a bend that, within the next 3.6 s, forces losing more than a third of this speed (surface included).
  // Returns the signed distance to the first sample too tight, in m (> 0 bend to the right, < 0 to the left), or 0: the HUD counts it down to the entry (once inside, or braked enough, it falls silent).
  // (The old rule, any bend under 90 m radius above 108 km/h, rang up to ten times per lap; the next one only said the side, not when.)
  function alertCorner(T, idx, sp, f = 0.65) {
    if (sp < 15) return 0;
    const S = T.S, n = T.n, D = Math.round(sp * 0.6), greenhouse = i => { const Q = surf(T, i), g = 1.2 * (1 - Q.corner) * (1 - 0.8 * Math.max(0, Q.gripCoef - 0.5)); return vturn(g, Math.abs(S[i].kl) + 1e-4, T.kt) < sp * f; };
    if (greenhouse(idx)) return 0; // already inside
    for (let j = 1; j < 3 * D; j++) { const i = (idx + j) % n; if (greenhouse(i)) return (Math.sign(S[i].k) || 1) * j * 2; } // 2 m per sample
    return 0;
  }
  // the double-file truck as seen by car c: sample and offset from the axis (signed); it switches side at each lap of c (reused object, static: serves as an obstacle for the autopilot)
  const CAM = { idx: 0, d: 0, vx: 0, vz: 0 }, lorry = (T, c) => Object.assign(CAM, { idx: T.cam.i, d: (Math.floor(c.dist / T.n) & 1 ? 1 : -1) * T.cam.d });
  function autopilot(c, T, lvl = 1, others = []) {
    const S = T.S, n = T.n, sp = Math.hypot(c.vx, c.vz), look = 3 + Math.floor(sp * 0.1);
    let off = 0, vcap = 1e9, best = 1e9;
    for (const o of T.cam ? [...others, lorry(T, c)] : others) {
      if (o === c) continue;
      const g = ((o.idx - c.idx + n + n / 2) % n) - n / 2, so = Math.hypot(o.vx, o.vz); // offset along the track, in 2 m samples
      if (g < -3 || g > 8 + sp * 0.7 || g >= best || (g > 3 && so >= sp)) continue;
      best = g;
      let side = Math.abs(c.d - o.d) > 1 ? Math.sign(c.d - o.d) : o.d > 0 ? -1 : 1; // already on one side: stay there; otherwise pass where there is room
      if (g > 3 && Math.abs(o.d + side * 3.4) > 5.5) side = -side; // not enough room on this side and still behind: pass on the other
      const want = o.d + side * 3.4; // stay on the trajectory, unless closer than 3.4 m to it: then move away by as much
      off = clamp(side > 0 ? Math.max(0, want) : Math.min(0, want), -5.5, 5.5);
      // tight against the wall at its height: give way; stuck behind it: brake in time and match its speed
      vcap = g > 0 && Math.abs(want) > 5.5 ? so * 0.9 : g > 0 && Math.abs(c.d - o.d) < 2.4 && g * 2 - 7 < (sp * sp - so * so) / 28 ? so : 1e9;
    }
    const la = S[(c.idx + look) % n];
    // at the start, keep its grid lane and rejoin the trajectory only within 300 m: otherwise all the cars dive together towards the same line (often against a wall)
    const tgt = off || (c.file ? la.dl + (c.file - la.dl) * clamp(1 - c.dist / 150, 0, 1) : la.dl);
    const e = wrap(Math.atan2(la.z + la.tx * tgt - c.z, la.x - la.tz * tgt - c.x) - c.th);
    // below level 1, the peak drops too: on a map where the car hits the limiter (Paris, the arena), the level only mattered in bends and the rivals held together in a procession
    const C = T.car, vg = T.vg || (T.vg = C.red / 60 * 2 * Math.PI * C.wheel / (C.ratios[C.ratios.length - 1] * C.final)); // vg: the peak at the limiter, on the last gear
    const va = vAllowed(T, c.idx), vt = Math.min(vcap, va * lvl * (off ? 0.9 : 1), lvl < 1 ? vg * lvl : 1e9); // hors trajectoire, on passe moins vite
    const st = clamp(e * 3, -1, 1);
    return { steer: st, gas: sp < vt && (Math.abs(st) < 1 || sp < 20) ? lvl : 0, brake: sp > vt + 3 ? 1 : 0, hand: false, nitro: sp < vt - 20 && Math.abs(st) < 0.25 && (c.boost > 0 || c.nitro > 0.3) }; // nitro: on a straight, far from the next braking, in full bursts (it waits until it has a third of the gauge)
  }

  // ---------- Race against BOTS opponents ----------
  // API for game.js (no rendering here):
  //   R = newRace(T, laps = 3, lvls = AI_LVL, el = 0, opt = {})  creates the raceCase. R.cars[0] = player (last on the grid), R.cars[1..] = opponents, fastest at the front; opt.grid[i] = starting place of car i (0 = pole), for a different grid.
  //   stepRace(R, inp, dt)                     advances all cars by one step (dt = 1/120). inp = the player's controls, as step() ;
  //                                            inp = null: the player is driven by the BOTS (?auto mode, or after finishing). Do not call during the detally.
  //   Several humans (split screen): newRace(T, laps, lvls, el, { humans: 2 }). The humans are the first cars (R.cars[0] = player 1, R.cars[1] = player 2, then the BOTS of lvls),
  //     on the last places of the grid (player 1 last). stepRace(R, [inp1, inp2], dt): one input per human; missing or null input = the autopilot drives that human.
  //     The BOTS' rubber band is set from the average of the humans still in raceCase. R.h = number of humans.
  //   Two-player Drift: newRace(T, 2, [], 0, { humans: 2, timedOut }), time limit in seconds for each car. c.score, c.ongoing, c.mult as in solo; a car-to-car impact (c.bump > 2) breaks the chain;
  //     c.pts = score of the round, frozen at the car's finish, zero if it finishes outside the time limit.
  //   R.t = race time (s); R.done = true when everyone has finished; R.laps = number of lapCount.
  //   Per car, in addition to the fields of newCar() (x, z, th, vf, rpm, drift, hit...):
  //     c.pos  = live place (1 = first)     c.lap = current lap (1..laps)
  //     c.ending  = final time (s), 0 until it has finished; after finishing the car keeps driving
  //     c.bump = impact speed (m/s) of a hit against another car during this step, otherwise 0 (c.hit remains the hit against a wall)
  //     c.dist = progress in 2 m samples from the line (cumulative laps); c.lvl = driver level
  //   raceOrder(R) = cars sorted by place: this is also the final ranking, once R.done.
  //   Elimination variant: newRace(T, laps, lvls, el, { elim: true }). As many laps as cars (laps is ignored); at each crossing of the line by the leader from the end of lap 2,
  //     the last car on track leaves: c.out = time of its exit (0 otherwise), it has no c.ending. The first lap is protected, the last one is played between two cars. Ranking = reverse order of the outputs.
  //     A car that has left moves to the side and stops; it no longer touches or slipstreams anyone, and the others' autopilot ignores it. R.done: the winner has crossed the line.
  // DIFF: the three difficulties on the menu. k multiplies the opponents' level; el = rubber band: up to ±el of pace depending on the gap to the player (full effect at 300 m),
  // the leading BOTS ease off a little when the player is far behind and push when they lead. Level capped at LVL_MAX: beyond that the autopilot touches the wallMeshes.
  const DIFF = [{ label: 'DETENTE', k: 0.93, el: 0.05 }, { label: 'NORMAL', k: 1, el: 0.03 }, { label: 'CHAUD', k: 1.04, el: 0.015 }], LVL_MAX = 1.04;
  const AI_LVL = [0.99, 0.97, 0.95]; // level of each opponent: the only pace setting (1 = the autopilot's clean lap)
  const CR = 1.1, CO = 1.2; // a car = 2 circles of radius CR, at ±CO m along its axis (4.6 m × 2.2 m)

  function newRace(T, laps = 3, lvls = AI_LVL, el = 0, opt = {}) {
    const h = opt.humans || 1, N = h + lvls.length; // humans first (0 = player 1, 1 = player 2), at the back of the grid: player 1 last, as in solo
    const cars = [...Array(h).fill(1), ...lvls].map((lvl, i) => {
      const c = newCar(T), k = opt.grid ? opt.grid[i] : i < h ? N - 1 - i : i - h, j = T.n - 8 - 4 * k, s = T.S[j], d = k % 2 ? 3 : -3; // grille en quinconce, 8 m entre deux places
      return Object.assign(c, { x: s.x - s.tz * d, z: s.z + s.tx * d, y: s.y, th: Math.atan2(s.tz, s.tx), idx: j, dist: -8 - 4 * k, d, file: d, lvl, pos: k + 1, lap: 1, ending: 0, out: 0, bump: 0 });
    });
    const mo = T.rainFx.some(p => p) ? new Float32Array(T.n * MO.nbr).fill(1) : null; cars.forEach(c => { c.mo = mo; }); // race wetness (see MO), shared by its cars
    if (opt.broken) cars.forEach(c => { c.ca = brokenFresh(); });
    return { T, cars, mo, laps: opt.elim ? cars.length : laps, el, elim: !!opt.elim, broken: !!opt.broken, td: [], h, timedOut: opt.timedOut || 0, headEl: 0, t: 0, done: false };
  }

  // Championship: all the maps in a row, points at each handle. Cars are designated by their index in R.cars (0 = player, 1.. = rivals of the map: points follow the place in the list, not the name).
  // tourAll(pts, arrival) : pts = points of each car before the round, arrival = indices of the cars in finishing order (empty: nothing has been run yet). Pure function, returns
  //   pts (points after the round), ranking (indices, from leader to last; on a tie the player ahead, then the slowest rival) and grid (grid[i] = starting place of car i, 0 = pole:
  //   the reverse of the ranking, to pass to newRace as opt.grid). At zero everywhere, it is the grid of an ordinary race.
  const SCORING = [10, 6, 3, 1];
  function tourAll(pts, arrival = []) {
    pts = pts.map((p, i) => p + (SCORING[arrival.indexOf(i)] || 0));
    const n = pts.length, ranking = pts.map((_, i) => i).sort((a, b) => pts[b] - pts[a] || (b || n) - (a || n));
    return { pts, ranking, grid: pts.map((_, i) => n - 1 - ranking.indexOf(i)) };
  }

  // Drift driver (tests and gold traces): it drifts when the trajectory asks for more than entr of the grip yaw, holds it while it asks for more than holdFrac on the same side,
  // and doses the wheel so the drift yaw (see KT0) follows the trajectory. lv, lg: autopilot level off-drift and in drift (lg lowered on slippery ground); nitro as soon as it accelerates; it doesn't start a drift on the iceSurf.
  function driveSkid(T, lv, lg, entr, holdFrac) {
    const { S, n } = T, KT = T.kt;
    return c => {
      const Q = surfAt(T, c), a = autopilot(c, T, c.dd ? 1 + (lg - 1) * (1 - Q.corner) : lv), sp = Math.hypot(c.vx, c.vz), la = S[(c.idx + 3 + Math.floor(sp * 0.1)) % n], ks = (1 - Q.corner) * (1 - Q.aq * (c.aq || 0)), om = omega(sp, KT) * ks;
      const dmd = s => s.kl * sp / om, err = wrap(Math.atan2(la.z + la.tx * la.dl - c.z, la.x - la.tz * la.dl - c.x) - Math.atan2(c.vz, c.vx)); // err: heading offset of the speed from the trajectory
      const d = c.dd || Math.sign(la.kl), retain = c.dd ? (dmd(la) * d > holdFrac || dmd(S[c.idx]) * d > holdFrac) && Q.corner < 0.5 : Math.abs(dmd(la)) > entr && sp > 15 && err * d > -0.05 && Q.corner < 0.5; // (no drift started on ice)
      if (!retain) return { ...a, gas: a.gas ? 1 : 0, nitro: !!a.gas };
      const k = d * (la.kl * sp + 1 * err) / Math.max(om, 1e-3), sd = k >= KT.kN ? (k - KT.kN) / (KT.kIn - KT.kN) : -(KT.kN - k) / (KT.kN - KT.kOut); // the wheel that gives this yaw
      return { steer: d * clamp(c.dd ? sd : 1, -1, 1), gas: a.gas ? 1 : 0, brake: a.brake, hand: true };
    };
  }

  const raceOrder = R => [...R.cars].sort((a, b) => (a.ending || 1e9) - (b.ending || 1e9) || (b.out || 1e9) - (a.out || 1e9) || b.dist - a.dist); // finished, then on track, then out (the last out in front)
  // a car out (elimination): it aims for the road edge and brakes to a standstill
  function range(c, T) {
    const la = T.S[(c.idx + 6) % T.n], off = (c.d < 0 ? -1 : 1) * (la.pl - 2.6);
    return { steer: clamp(wrap(Math.atan2(la.z + la.tx * off - c.z, la.x - la.tz * off - c.x) - c.th) * 3, -1, 1), gas: 0, brake: c.vf > 1 ? 0.8 : 0, hand: false }; // (brake held at standstill = reverse)
  }

  // Collision between two cars of equal mass: each is pushed apart by half and the speed is swapped along the normal (20 % rebound).
  // The tangential speed is kept: a side contact pushes without braking.
  function collide(a, b) {
    if (Math.abs(a.y - b.y) > 1.5) return; // one passes over the other
    for (const i of [-CO, CO]) for (const j of [-CO, CO]) {
      const dx = b.x + Math.cos(b.th) * j - a.x - Math.cos(a.th) * i, dz = b.z + Math.sin(b.th) * j - a.z - Math.sin(a.th) * i, d = Math.hypot(dx, dz);
      if (d >= 2 * CR) continue;
      const nx = d > 1e-6 ? dx / d : 1, nz = d > 1e-6 ? dz / d : 0, o = CR - d / 2, vn = (a.vx - b.vx) * nx + (a.vz - b.vz) * nz;
      a.x -= nx * o; a.z -= nz * o; b.x += nx * o; b.z += nz * o;
      if (vn > 0) { a.vx -= nx * vn * 0.6; a.vz -= nz * vn * 0.6; b.vx += nx * vn * 0.6; b.vz += nz * vn * 0.6; a.bump = b.bump = Math.max(a.bump, vn); a.who = b; b.who = a; } // who: the other car of the last contact (takedowns in CASSE mode)
    }
  }

  function stepRace(R, inp, dt) {
    const { T, cars } = R;
    R.t += dt;
    // inp: one input per human (or a single one, outside the array, for the lone player); missing input = the autopilot drives this human
    const inps = Array.isArray(inp) ? inp : [inp], ia = cars.map((c, i) => i >= R.h || !inps[i]);
    // rubber band: the gap to the average of the humans still racing (all finished or out: to their average), so as not to favour either; with one human, it's the gap to car 0
    const hum = cars.slice(0, R.h), enc = hum.filter(c => !c.ending && !c.out), ref = enc.length ? enc : hum, pd = ref.reduce((s, c) => s + c.dist, 0) / ref.length;
    const rub = c => Math.min(LVL_MAX, c.lvl * (1 - R.el * clamp((c.dist - pd) / 150, -1, 1)));
    // a finished car eases off: it completes its lap at idle instead of accelerating flat out
    const circuit = R.elim || R.broken ? cars.filter(c => !c.out) : cars; // the cars still racing: the only ones that touch, slipstream and avoid each other
    const ins = cars.map((c, i) => c.out ? range(c, T) : ia[i] ? autopilot(c, T, c.ending ? 0.6 : i < R.h ? c.lvl : rub(c), circuit) : inps[i]);
    if (R.broken) ins.forEach((p, i) => { if (ia[i] && !cars[i].out && !cars[i].ending) seek(cars[i], circuit, p, i === R.h + 1 ? 1.4 : 0.8, R); }); // the hothead (2nd rival) more than the others
    for (const c of cars) c.bump = 0; ins.forEach((p, i) => { const c = cars[i]; if (c.ending && ia[i] && Math.hypot(c.vx, c.vz) > 28) { p.gas = 0; p.brake = Math.max(p.brake, 0.3); } }); // cool-down lap at 100 km/h
    // car-to-car impacts first, then step(): walls have the last word, no car can be pushed off track
    for (let i = 0; i < circuit.length; i++) for (let j = i + 1; j < circuit.length; j++) collide(circuit[i], circuit[j]);
    for (const c of circuit) if (c.bump > 2) { c.ongoing = 0; c.glD = 0; c.mult = 1; } // Drift: a car-to-car impact breaks the chain, like a wall (see points(); the score does not touch the physics)
    // slipstream: c.asp = 1 stuck behind a launched car, 0 at NI.ad metres or outside the cone (the strongest wins)
    for (const c of cars) { c.asp = 0; const fx = Math.cos(c.th), fz = Math.sin(c.th);
      for (const o of circuit) { const dx = o.x - c.x, dz = o.z - c.z, lon = dx * fx + dz * fz;
        if (o !== c && lon > 3 && lon < NI.ad && Math.abs(dz * fx - dx * fz) < 1 + NI.ac * lon && o.vx * fx + o.vz * fz > 20 && Math.abs(o.y - c.y) < 1.5) c.asp = Math.max(c.asp, 1 - lon / NI.ad); } }
    cars.forEach((c, i) => {
      const vx0 = c.vx, vz0 = c.vz;
      step(c, ins[i], T, dt);
      if (R.broken) brokenImpact(R, c, vx0, vz0);
      c.lap = clamp(Math.floor(c.dist / T.n) + 1, 1, R.laps);
      if (!c.ending && !c.out && c.dist >= R.laps * T.n) { c.ending = R.t; c.pts = R.timedOut && R.t > R.timedOut ? 0 : c.score; } // c.pts: drift score frozen at finish, zero outside the time limit
    });
    dry(R, dt);
    if (R.elim) { const o = raceOrder(R).filter(c => !c.out), headEl = Math.floor(o[0].dist / T.n); // the leader crosses the line: from the end of lap 2, the last car on track leaves
      if (headEl > R.headEl) { R.headEl = headEl; if (headEl >= 2 && o.length > 1) o[o.length - 1].out = R.t; } }
    raceOrder(R).forEach((c, i) => c.pos = i + 1);
    R.done = cars.every(c => c.ending || c.out);
  }


  // ---------- CASSE mode: damage affects driving (docs/PHYSICS.md, prototype 4) ----------
  // c.ca = { z: zone wear (wear, no cap), z0, lap, t: last impact counted, misalign: bent steering (rad of wheel), pops: flat wheel [rear left, rear right, front left, front right],
  //          dead: out of service (time), lst / lstT: the last car that touched it and when, td: takedowns inflicted; p, vf, grip, dir: what rolling() draws from it }
  // Computed in stepRace at each step, like the rest of the race: deterministic, the host and guests see the same thing.
  const brokenFresh = () => ({ z: [0, 0, 0, 0], z0: [0, 0, 0, 0], lap: 1, t: -1, misalign: 0, pops: [0, 0, 0, 0], dead: 0, lst: null, lstT: -9, td: 0, p: 1, vf: 1, grip: 1, dir: 0 });
  const takedown = (R, via, vic) => { if (!via || !via.ca || via === vic) return; via.ca.td++; R.td.push({ via, vic, t: R.t }); vic.ca.lst = null; };
  function brokenImpact(R, c, vx0, vz0) {
    const K = c.ca; if (K.dead) return;
    if (c.lap !== K.lap) { K.lap = c.lap; K.z0 = K.z.slice(); }
    const vo = c.bump || 0; if (vo > 2 && c.who) { K.lst = c.who; K.lstT = R.t; }
    const f = Math.max(c.hit, vo);
    if (f > 3 && R.t - K.t >= 0.15) { K.t = R.t; // a lasting contact only counts once (same reading as dmgStep of game.js)
      let dx = vx0 - c.vx, dz = vz0 - c.vz, l = Math.hypot(dx, dz); if (l < 0.5) { dx = c.vx; dz = c.vz; l = Math.hypot(dx, dz) || 1; }
      const fx = Math.cos(c.th), fz = Math.sin(c.th), lx = (dx * fx + dz * fz) / l, lz = (dz * fx - dx * fz) / l, type = vo > c.hit ? 'vehicle' : 'intoWall';
      wear(K.z, K.z0, lx, lz, f, type, true);
      if (lx > 0 && lz * lz > 0.2 && f > 12) K.misalign = clamp(K.misalign + 0.02 * Math.sign(lz), -0.08, 0.08); // the front taken from the side: the car pulls to the side hit
      const ri = (lx > 0 ? 2 : 0) + (lz < 0 ? 0 : 1); if (lx * lx > 0.2 && lz * lz > 0.2 && f > 15 && K.z[lx > 0 ? 0 : 1] >= 0.5) K.pops[ri] = 1; // a big hit on an already damaged corner blows its tyre
      if (type === 'intoWall' && f > 15 && K.lst && R.t - K.lstT < 2) takedown(R, K.lst, c); } // sent into the wall by another: takedown
    if (K.z[0] >= 0.97 || K.z[0] + K.z[1] + K.z[2] + K.z[3] >= 3.4) { K.dead = R.t; c.out = R.t; if (K.lst && R.t - K.lstT < 3) takedown(R, K.lst, c); } // out of service: the car leaves
    const nc = K.pops[0] + K.pops[1] + K.pops[2] + K.pops[3];
    K.p = K.z[0] >= 0.85 ? 0.65 : K.z[0] >= 0.6 ? 0.85 : 1; K.vf = Math.pow(0.9, nc); K.grip = Math.pow(0.85, nc); K.dir = K.misalign + (K.pops[1] + K.pops[3] - K.pops[0] - K.pops[2]) * 0.03;
  }
  // the BOTS in CASSE mode seeks contact: a car beside or ahead (players first), it steers towards it and floors it to ram it (aggr: 0.8, the hothead 1.4)
  function seek(c, circuit, p, aggr, R) { const fx = Math.cos(c.th), fz = Math.sin(c.th); let best = null, bd = 1e9, blon = 0;
    for (const o of circuit) { if (o === c || o.out) continue; const dx = o.x - c.x, dz = o.z - c.z, lon = dx * fx + dz * fz, lat = dz * fx - dx * fz; if (lon < -4 || lon > 18 || Math.abs(lat) > 8) continue;
      const d = Math.hypot(lon, lat) * (circuit.indexOf(o) < R.h ? 0.5 : 1); if (d < bd) { bd = d; best = lat; blon = lon; } }
    if (best === null) return; p.steer = clamp(p.steer + clamp(best * 0.25, -0.6, 0.6) * aggr, -1, 1);
    if (blon > 2) { p.gas = 1; p.brake = 0; if (blon < 10 && aggr > 1) p.nitro = true; } } // behind it: full throttle (the hothead uses nitro)

  // ---------- Traffic (maps that have some: traffic field of mapDefs.js) ----------
  // Trucks at constant speed on three lanes. Their position depends only on the time elapsed since the start: the same traffic at each attempt.
  // traffic(T, t) returns the list (reused objects: x, y, z, th, idx, d, vx, vz), usable also as `others` of the autopilot.
  // hitTraffic(c, T, t): car-against-lorry hit. The lorry does not move; the car is pushed back and the hit is flagged in c.hit, like an intoWall.
  function traffic(T, t) {
    const S = T.S, n = T.n, TRUCKS = T.trucks;
    const tau = T.tau, tn = tau ? tau[n] : n;
    TRUCKS.forEach((k, i) => {
      const q = (i / TRUCKS.length * tn + 40 + k.v * t / 2) % tn; let j = q | 0, f = q - j, v = k.v; // q: position in "time" along the track (= samples without a jam)
      if (tau) { let lo = 0, hi = n - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (tau[m] <= q) lo = m; else hi = m - 1; } j = lo; const dt = tau[j + 1] - tau[j]; f = (q - tau[j]) / dt; v = k.v / dt; }
      const a = S[j], b = S[(j + 1) % n];
      k.idx = j; k.d = k.lane; k.th = Math.atan2(a.tz, a.tx); k.vx = a.tx * v; k.vz = a.tz * v;
      k.x = lerp(a.x, b.x, f) - a.tz * k.lane; k.z = lerp(a.z, b.z, f) + a.tx * k.lane; k.y = lerp(a.y, b.y, f);
    });
    return TRUCKS;
  }
  function hitTraffic(c, T, t, dt = 1 / 120) {
    for (const k of traffic(T, t)) {
      if (Math.abs(((k.idx - c.idx + T.n + T.n / 2) % T.n) - T.n / 2) > 12) continue;
      const kx = Math.cos(k.th), kz = Math.sin(k.th), cx = Math.cos(c.th), cz = Math.sin(c.th); let keyPress = 0;
      for (const i of [-4, 0, 4]) for (const j of [-1.2, 1.2]) { // truck = 3 circles of 1.4 m, car = 2 circles of 1.1 m
        const dx = c.x + cx * j - k.x - kx * i, dz = c.z + cz * j - k.z - kz * i, d = Math.hypot(dx, dz);
        if (d >= 2.5 || d < 1e-6) continue; keyPress = 1;
        const nx = dx / d, nz = dz / d, vn = -((c.vx - k.vx) * nx + (c.vz - k.vz) * nz);
        c.x += nx * (2.5 - d); c.z += nz * (2.5 - d);
        if (vn > 0) { c.vx += nx * vn * 1.2; c.vz += nz * vn * 1.2; c.hit = Math.max(c.hit, vn); if (vn > 3) { c.driftT = 0; c.nitro = 0; c.stun = 0.8; } }
      }
      // overtaken close (less than 1.2 m between the sides), without contact, with at least 8 m/s better than it: the gauge rises
      const dx = c.x - k.x, dz = c.z - k.z; if (!keyPress && Math.abs(dx * kx + dz * kz) < 7 && Math.abs(dz * kx - dx * kz) < 3.7 && c.vx * kx + c.vz * kz > Math.hypot(k.vx, k.vz) + 8) gains(c, NI.cam * dt);
    }
  }

  // --- ghosts ---
  // A trace = [x, y, z, heading, …] at a fixed rate (20 Hz in the game). stretch(trace, k): the same, k times slower (k < 1: faster), at the same rate; the heading turns the shortest way.
  function stretch(tr, k) {
    const n = tr.length / 4, o = []; if (n < 2) return tr.slice();
    for (let j = 0; j / k <= n - 1 + 1e-9; j++) { const p = Math.min(n - 1, j / k), i = Math.min(n - 2, Math.floor(p)) * 4, f = p - i / 4;
      for (let q = 0; q < 3; q++) o.push(tr[i + q] + (tr[i + 4 + q] - tr[i + q]) * f); o.push(tr[i + 3] + wrap(tr[i + 7] - tr[i + 3]) * f); }
    return o;
  }
  // Medal reference lap: the flying lap of the autopilot, started with a full nitro gauge that it spends on straights (what a good lap earns). Returns its time and its trace at 20 Hz.
  function lapRef(T, dt = 1 / 120) {
    const c = newCar(T), trace = []; let t = 0, t1 = 0, i = 0;
    while (c.dist < 2 * T.n && t < 900) { step(c, autopilot(c, T), T, dt); t += dt; if (!t1 && c.dist >= T.n) { t1 = t; c.nitro = 1; } if (t1 && i++ % 6 === 0) trace.push(c.x, c.y, c.z, c.th); }
    return { t: t - t1, trace };
  }
  // --- challenge by link ---
  // A challenge = "version.mapDef.data": the physics version (the one used by the record keys, vpr7), the map id, then in base64 for the URL: the lap time (ms, 3 bytes),
  // positions at 5 Hz (one point in four of the 20 Hz trace) quantized to 10 cm, and the heading at 1/256 of a turn, and 2 check bytes.
  // Compression: x and z as second differences (the gap to the speed of the previous point: almost always one byte), y and the heading as differences. We carry positions, never inputs:
  // the simulation does not give exactly the same result from one browser to another. The gold traces of the maps (traces-gold.js) are in the same format.
  const CHALLENGE_V = 8, CHALLENGE_ERR = ['LIEN DE DEFI ILLISIBLE', "LIEN D'UNE AUTRE VERSION DU JEU", 'LIEN DE DEFI ABIME OU TRONQUE'];
  const checksum = (headEl, B, n) => { let s = 7; for (let i = 0; i < headEl.length; i++) s = (s * 31 + headEl.charCodeAt(i)) & 65535; for (let i = 0; i < n; i++) s = (s * 31 + B[i]) & 65535; return s; };
  function challengeCode(mapDef, t, tr) {
    const ms = Math.round(t * 1000), B = [ms & 255, ms >> 8 & 255, ms >> 16 & 255], p = [0, 0, 0, 0], d = [0, 0];
    const vi = v => { v = v < 0 ? -2 * v - 1 : 2 * v; while (v > 127) { B.push(v % 128 + 128); v = Math.floor(v / 128); } B.push(v); }; // signed integer, 7 bits per byte
    for (let i = 0; i + 3 < tr.length; i += 16) {
      const q = [Math.round(tr[i] * 10), Math.round(tr[i + 2] * 10), Math.round(tr[i + 1] * 10), Math.round(tr[i + 3] * 128 / Math.PI) & 255];
      for (let k = 0; k < 2; k++) { vi(q[k] - p[k] - d[k]); d[k] = q[k] - p[k]; } vi(q[2] - p[2]); B.push((q[3] - p[3]) & 255);
      for (let k = 0; k < 4; k++) p[k] = q[k];
    }
    const headEl = CHALLENGE_V + '.' + mapDef + '.', s = checksum(headEl, B, B.length); B.push(s & 255, s >> 8);
    return headEl + btoa(String.fromCharCode(...B)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  // Returns { mapDef, t, trace at 20 Hz }, or { err: message } for a link that is unreadable, from another version or damaged: never an exception.
  function challengeRead(link) {
    const m = /^(\d+)\.([a-z0-9]+)\.([A-Za-z0-9_-]+)$/.exec(typeof link === 'string' ? link : ''); if (!m) return { err: CHALLENGE_ERR[0] };
    if (+m[1] !== CHALLENGE_V) return { err: CHALLENGE_ERR[1] };
    let B; try { B = Array.from(atob(m[3].replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)); } catch (e) { return { err: CHALLENGE_ERR[2] }; }
    const ending = B.length - 2; if (ending < 3 || checksum(m[1] + '.' + m[2] + '.', B, ending) !== B[ending] + B[ending + 1] * 256) return { err: CHALLENGE_ERR[2] };
    let i = 3, ok = true; const tr = [], p = [0, 0, 0, 0], d = [0, 0];
    const vi = () => { let v = 0, k = 1, b; do { if (i >= ending) { ok = false; return 0; } b = B[i++]; v += (b & 127) * k; k *= 128; } while (b > 127); return v % 2 ? -(v + 1) / 2 : v / 2; };
    while (i < ending && ok) { for (let k = 0; k < 2; k++) { d[k] += vi(); p[k] += d[k]; } p[2] += vi(); if (i >= ending) { ok = false; break; } p[3] = (p[3] + B[i++]) & 255; tr.push(p[0] / 10, p[2] / 10, p[1] / 10, p[3] * Math.PI / 128); }
    const t = (B[0] + B[1] * 256 + B[2] * 65536) / 1000;
    return ok && tr.length >= 8 && t > 0 && Math.abs((tr.length / 4 - 1) / 5 - t) < 1.5 ? { mapDef: m[2], t, trace: stretch(tr, 4) } : { err: CHALLENGE_ERR[2] };
  }

  // ---------- Car wear (docs/PHYSICS.md, "Impact mechanics") ----------
  // wear(Z, Z0, lx, lz, vn, type, broken): an impact coming from (lx, lz) (car frame, x forward, unit vector), at the normal speed vn (m/s), against a "wall", a "truck" or a "car".
  //   Z = wear of the zones [front, rear, side z < 0, side z > 0] from 0 to 1, modified in place; Z0 = the zones at the start of the lap; returns the wear added (all zones).
  //   Only the normal speed breaks (rubbing a wall does nothing); quadratic wear (close to the energy), a corner takes 1.3 times more, diminishing returns;
  //   outside CASSE mode, a zone never exceeds WEAR.cap and takes no more than WEAR.lapRun per lap: badly damaged, never a wreck (measures: tools/impacts.js).
  const WEAR = { cap: 0.7, lapRun: 0.4, cutoff: { intoWall: 6, lorry: 6, vehicle: 4 }, mult: { intoWall: 1, lorry: 1.5, vehicle: 0.8 }, k: 0.75, max: 0.5, kC: 1, maxC: 0.8 }; // k, max: share of the wear from an impact and cap per impact (C: in CASSE, stronger)
  function wear(Z, Z0, lx, lz, vn, type = 'intoWall', broken = false) {
    const s = WEAR.cutoff[type]; if (vn <= s) return 0;
    const wx = lx * lx, wz = lz * lz, u = Math.min(1, ((vn - s) / 24) ** 2) * WEAR.mult[type] * (wx > 0.2 && wz > 0.2 ? 1.3 : 1);
    let du = 0;
    for (const [zi, w] of [[lx > 0 ? 0 : 1, wx], [lz < 0 ? 2 : 3, wz]]) {
      const max = broken ? 1 : Math.min(WEAR.cap, Z0[zi] + WEAR.lapRun), nz = Math.min(max, Z[zi] + Math.min(broken ? WEAR.maxC : WEAR.max, (broken ? WEAR.kC : WEAR.k) * u * w) * (1 - Z[zi]));
      if (nz > Z[zi]) { du += nz - Z[zi]; Z[zi] = nz; }
    }
    return du;
  }
  Object.assign(G, { WEAR, wear, brokenFresh, brokenImpact, CHALLENGE_V, CHALLENGE_ERR, challengeCode, challengeRead, stretch, lapRef, vAllowed, alertCorner, ground, wallFace, slope, tilt, insidePlace, buildTrack, newCar, step, autopilot, driveSkid, newRace, stepRace, dry, MO, raceOrder, tourAll, SCORING, traffic, hitTraffic, AI_LVL, DIFF, TOP, vturn, omega, SURF, GL });
})(typeof window !== 'undefined' ? window : globalThis);
