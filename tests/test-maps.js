// node test-mapDefs.js — each map of mapDefs.js runs through the real physics: valid track, lap completed on autopilot, plausible car.
// The city has its own, more complete tests, in test.js (its figures must not move: the city's records).
const assert = require('assert'), THREE = require('../vendor/three/three.module.js');
require('../src/data/maps.js'); require('../src/data/gold-laps.js'); require('../src/engine/sim.js');
// inventory: a map is assembled from its entry in mapDefs.js, its scenery (scenery-<map>.js, loaded by index.html after scenery.js), its gold trace (traces-gold.js) and its English title (HEADING_EN of language.js, otherwise the HUD title)
globalThis.window = globalThis; require('../src/render/scenery.js'); require('../src/render/crowd.js'); for (const M of MAPS) require('../src/maps/' + M.th.scenery + '/scenery-' + M.th.scenery + '.js'); require('../src/engine/lang.js');
{ const EN = HEADING_EN, PAGE = require('fs').readFileSync(__dirname + '/../index.html', 'utf8');
  for (const M of MAPS) {
    assert(typeof SCENERY[M.th.scenery] === 'function', M.id + ' : no scenery ' + M.th.scenery + ' in scenery-' + M.th.scenery + '.js');
    assert(PAGE.includes('<script defer src="src/maps/' + M.th.scenery + '/scenery-' + M.th.scenery + '.js"></script>'), M.id + ' : scenery-' + M.th.scenery + '.js absent de index.html');
    assert(typeof TRACES_GOLD[M.id] === 'string' && TRACES_GOLD[M.id].startsWith(CHALLENGE_V + '.' + M.id + '.'), M.id + ' : no gold trace in gold-laps.js');
    const t = EN[M.id] || M.th.hud.heading; assert(t && t.length === 2 && t.every(l => l), M.id + ' : titre anglais absent');
  }
  for (const id in EN) assert(MAPS.some(M => M.id === id), 'TITLE_EN : unknown map ' + id);
  assert.deepStrictEqual(EVENING.map(M => M.id).sort(), MAPS.map(M => M.id).sort(), 'NIGHT : each map once in the Tour');
  assert(EVENING.every((M, i) => /^\d\d:\d\d$/.test(M.hour) && (!i || (M.hour < '12' ? '24' + M.hour : M.hour) > (EVENING[i - 1].hour < '12' ? '24' + EVENING[i - 1].hour : EVENING[i - 1].hour))), 'NIGHT : the hours advance, from evening to morning');
  console.log('OK  inventory : scenery, gold trace and title of ' + MAPS.length + ' maps'); }
// the Ocres ford quickly washes the car (game.js, dirtyFrame: aq threshold > 0.08): the wettest road on the map must cross it
{ const q = buildTrack(THREE, MAPS.find(M => M.id === 'terre')).surf; assert(Math.max(...q.map(s => s.aq)) > 0.08, 'terre: the ford does not reach the wash threshold (0.08)'); }
const H = 1 / 120, deg = r => r * 180 / Math.PI; let surfTxt = '', surfMap = '', linkMax = [0], goldTxt = [];
for (const M of MAPS) {
  surfMap = '';
  const T = buildTrack(THREE, M), { S, n, W } = T, CARD = T.car;
  const rmin = 1 / Math.max(...S.map(s => Math.abs(s.k)));
  assert(rmin > 15, `${M.id} : minimum radius too tight (${rmin})`);
  let cross = 1e9;
  for (let i = 0; i < n; i += 2) for (let j = i + 40; j < n; j += 2) { if (n - j + i < 40) continue; cross = Math.min(cross, Math.hypot(S[i].x - S[j].x, S[i].z - S[j].z)); }
  assert(cross > 2 * W + 8, `${M.id} : the track crosses itself (${cross})`);
  assert(T.sp[0] < T.sp[1] && T.h0 < T.h1 && (!T.tun || T.t0 < T.t1), `${M.id} : sectors out of order`);
  // two laps on autopilot: the second, a flying lap, gives the figures
  // relief: with no jump or drivable wall declared, the car never leaves the ground; with them, it never passes under, and the flying lap counts at least one flight per jump, with no landing that breaks the speed
  let c = newCar(T), t = 0, t1 = 0, hits = 0, vmax = 0, vmin = 1e9, flights = 0, dur = 0;
  assert(T.vert === !!(M.jumps || M.trough), M.id + ' : relief active by mistake');
  while (c.dist < 2 * n && t < 900) {
    const av = c.air; step(c, autopilot(c, T), T, H); t += H; assert((Math.abs(c.d) <= S[c.idx].w || insidePlace(T, c.x, c.z)) && Number.isFinite(c.x));
    assert(T.vert ? c.y >= ground(T, c) - 1e-9 : !c.air && c.y === ground(T, c), M.id + ' : the car leaves the ground or passes under');
    if (c.dist >= n) { if (c.air && !av) flights++; if (c.land > 9) dur++; }
    if (c.dist >= n) { if (!t1) t1 = t; const v = Math.hypot(c.vx, c.vz); vmax = Math.max(vmax, v); vmin = Math.min(vmin, v); if (c.hit > 3) hits++; }
  }
  assert(c.dist >= 2 * n, `${M.id} : the autopilot does not complete the lap`);
  assert(hits <= 2, `${M.id} : the autopilot hits the walls (${hits})`);
  assert(flights >= (M.jumps || []).length && !dur, `${M.id} : ${flights} flights on the flying lap for ${(M.jumps || []).length} tremplins, ${dur} hard landings`);
  // standing start, throttle flat out: plausible 0 to 100 km/h, and the automatic gearbox upshifts through all useful gears without sitting on the rev limiter
  c = newCar(T); let t100 = 0;
  for (let i = 0; i < 8 / H && !t100; i++) { step(c, { steer: 0, gas: 1, brake: 0, hand: false }, T, H); if (c.vf >= 100 / 3.6) t100 = (i + 1) * H; assert(c.rpm <= CARD.red + 200); }
  assert(t100 > 2.5 && t100 < 6.5, `${M.id} : 0 to 100 km/h in ${t100} s`);
  // --- driving, on an open plane (no walls: a single track sample, stuck under the car at each step) ---
  const O = { x: 0, y: 0, z: 0, tx: 1, tz: 0, k: 0, sl: 0 }, TO = { S: [O], n: 1, mapDef: T.mapDef, car: T.car, kt: T.kt }, I = (steer, gas, brake = 0, hand = false) => ({ steer, gas, brake, hand });
  const go = (c, inp, sec) => { for (let i = 0; i < sec / H; i++) { O.x = c.x; O.z = c.z; const v = Math.hypot(c.vx, c.vz) || 1; O.tx = c.vx / v; O.tz = c.vz / v; step(c, inp, TO, H); } return c; };
  // launch: far away (in Paris, the arch piers are near the origin)
  const launcher = v => { const c = Object.assign(newCar(T), { idx: 0, x: 1e5, z: 1e5 }); let i = 0; while (Math.hypot(c.vx, c.vz) < v && i++ < 60 / H) go(c, I(0, 1), H); return c; };
  const cap = c => Math.atan2(c.vz, c.vx), lst = c => deg(Math.atan2(Math.abs(c.vl), Math.abs(c.vf))), wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
  // radius of the path (signed: positive if it turns toward the side of the first steering input), measured between 0.7 and 1.2 s after the start of the command
  const arcRadius = (c, inp) => { go(c, inp, 0.7); let d = 0, tw = 0, p = cap(c); for (let i = 0; i < 60; i++) { go(c, inp, H); d += Math.hypot(c.vx, c.vz) * H; tw += wrap(cap(c) - p); p = cap(c); } return d / tw; };
  const vtop = Math.hypot(launcher(999).vx, launcher(999).vz), ext = rmin + W, v120 = 120 / 3.6, v200 = 200 / 3.6, glisse = v => go(launcher(v), I(1, 0, 0, true), 0.3);
  const r120 = arcRadius(launcher(v120), I(1, 1)), r120l = arcRadius(launcher(v120), I(1, 0)), rtop = arcRadius(launcher(vtop - 0.5), I(1, 1)), r240 = arcRadius(launcher(240 / 3.6), I(1, 1));
  const gin120 = arcRadius(go(launcher(v120), I(1, 1, 0, true), 0.3), I(1, 1, 0, true)), gin = arcRadius(glisse(v200), I(1, 1, 0, true)), gn = arcRadius(glisse(v200), I(0, 1, 0, true)), gout = arcRadius(glisse(v200), I(-1, 1, 0, true)), g200 = arcRadius(launcher(v200), I(1, 1));
  // the steering commands a rotation, the same for all cars: at 120 km/h off the throttle, wheel at full lock, you get round the tightest bend of the map widened by half the road; lifting off tightens it
  assert(r120l < ext && r120l < 0.9 * r120, `${M.id} : at 120 km/h, radius ${r120} m on the throttle, ${r120l} m off the throttle (bend of ${rmin} m, ${ext} m with the half-width)`);
  // the radius depends little on speed: doubling the speed does no more than tripling it (a grip limit would quadruple it)
  assert(r240 < 3 * r120, `${M.id} : rayon ${r120} m at 120 km/h, ${r240} m at 240`);
  // but at top speed, without sliding, the tightest bend does not get through: you have to lift off, brake or slide
  assert(rtop > ext, `${M.id} : at ${vtop * 3.6} km/h the radius (${rtop} m) gets round the tightest bend without doing anything`);
  // slide (button held): at 200 km/h, steering inward it tightens much more than on grip; at neutral then outward it opens, without ever changing direction; at 120 km/h it gets round the tightest bend
  assert(gin120 < ext && gin < 0.8 * g200 && gin < gn && gn < gout && gout > 0, `${M.id} : slide at 200 km/h, radii ${gin} / ${gn} / ${gout} m (grip ${g200} m)`);
  // steering response: at 120 km/h, 0.2 s after the steering input the car is already turning at 85% of its rate
  const y02 = go(launcher(v120), I(1, 1), 0.2).yaw, y06 = go(launcher(v120), I(1, 1), 0.6).yaw;
  assert(y02 > 0.85 * y06, `${M.id} : volant trop lent (${deg(y02)} °/s at 0.2 s, ${deg(y06)} at 0.6 s)`);
  // slide held 1 s: sideways at 10 to 40°, losing almost no speed, and the nitro gauge has risen; handbrake released: nothing pushes on its own, and the car is straight again in under 0.5 s. A 0.3 s slide fills almost nothing
  c = go(glisse(v200), I(1, 1, 0, true), 0.7); const dhold = lst(c), vskid = Math.hypot(c.vx, c.vz);
  assert(c.drift && dhold > 10 && dhold < 40 && vskid > 0.9 * v200, `${M.id} : glisse non tenue (${dhold}°, ${vskid * 3.6} km/h)`);
  assert(c.nitro > 0.12 && c.nitro < 0.4, `${M.id} : 1 s of slide at 200 km/h must fill the gauge by a good notch (${c.nitro})`);
  go(c, I(0, 1), H); assert(!c.drift && !c.boost, M.id + ' : the exit of the slide still pushes on its own');
  let rat = H; while (lst(c) > 3 && rat < 3) { go(c, I(0, 1), H); rat += H; }
  assert(rat < 0.5, `${M.id} : car not straightened after the slide (${rat} s)`);
  c = go(glisse(v200), I(0, 1), H); assert(!c.drift && c.nitro < 0.04, `${M.id} : a slide too short fills the gauge (${c.nitro})`);
  // order of the ways to complete a flying lap: sliding while spending the nitro gained (the fastest), clean for the autopilot, flat out without braking into the walls (the slowest).
  // And the autopilot, given a full gauge at the start of the flying lap, spends it on the straight: faster than the clean lap, without hitting more or missing a landing (this is the medal reference).
  // Sliding driver (driveSkid of sim.js): it slides as soon as the path asks for more than 90% of the grip yaw, holds it as long as it asks for more than 30%, and allows itself 20% more speed than the clean driver.
  const lap = t - t1, lapRun = (drive, gauge = 0) => { const c = newCar(T); let t = 0, t1 = 0, b = 0, pb = 0, h = 0, d = 0; while (c.dist < 2 * n && t < 900) { step(c, drive(c), T, H); t += H; if (!t1 && c.dist >= n) { t1 = t; c.nitro = gauge; } if (t1 && c.boost > 0 && pb <= 0) b++; if (t1 && c.hit > 3) h++; if (t1 && c.land > 9) d++; pb = c.boost; } return [t - t1, b, h, d, c.nitro]; };
  const [tni, bni, hni, dni, remain] = lapRun(c => autopilot(c, T), 1);
  assert(bni && remain <= 0.3 && tni < lap - 0.3 && hni <= hits && !dni, `${M.id} : autopilot lap with a nitro gauge ${tni} s (${bni} coups, reste ${remain}, ${hni} chocs, ${dni} hard landings) against ${lap} s without`);
  const [tfull, , hfull] = lapRun(c => ({ ...autopilot(c, T), gas: 1, brake: 0 })), [tskid, boosts, hskid] = lapRun(driveSkid(T, 1, 1.2, 0.9, 0.3));
  assert(boosts > 1 && tskid < lap * (M.surf && M.surf.backdrop === 'snowSurf' ? 1.02 : 1), // on snow, the (gentle) slide does not necessarily pay any more: within 2%
     `${M.id} : slide lap (${tskid} s, ${boosts} coups de nitro, ${hskid} hits) not faster than the clean lap (${lap} s)`);
  assert(hfull && tfull > lap * 1.005, `${M.id} : flat out into the walls (${tfull} s, ${hfull} hits) not slower than the clean lap (${lap} s)`);
  // traffic: finite positions, on the road; a car stopped in a queue gets pushed without being crossed through
  if (M.traffic) {
    for (const tt of [0, 37.3, 400]) for (const k of traffic(T, tt)) assert(Number.isFinite(k.x) && Math.abs(k.d) < W - 1.4, `${M.id} : camion hors route`);
    const k0 = traffic(T, 0)[0], s = S[(k0.idx + 20) % n]; c = newCar(T); Object.assign(c, { x: s.x - s.tz * k0.lane, z: s.z + s.tx * k0.lane, idx: (k0.idx + 20) % n, th: Math.atan2(s.tz, s.tx) });
    let hit = 0; for (let i = 0; i < 4 / H; i++) { step(c, { steer: 0, gas: 0, brake: 0, hand: false }, T, H); hitTraffic(c, T, i * H); hit = Math.max(hit, c.hit); }
    assert(hit > 5 && Math.hypot(c.vx, c.vz) > 5, `${M.id} : the truck does not push the car (${hit})`);
    // overtaking a truck close in, without touching it, fills the gauge; overtaking it wide, no; hitting it empties it
    const double = lat => { const k = traffic(T, 0)[0], i = (k.idx - 8 + n) % n, s = S[i], d = k.lane + (k.lane > 0 ? -lat : lat), v = k.v + 30, c = newCar(T); let h = 0;
      Object.assign(c, { x: s.x - s.tz * d, z: s.z + s.tx * d, idx: i, th: Math.atan2(s.tz, s.tx), vx: s.tx * v, vz: s.tz * v, nitro: lat ? 0 : 1 });
      for (let j = 0; j < 1 / H; j++) { step(c, { steer: 0, gas: 1, brake: 0, hand: false }, T, H); hitTraffic(c, T, j * H, H); h = Math.max(h, c.hit); } return [c.nitro, h]; };
    const ras = double(3.4), wdth = double(5.5), inner = double(0);
    assert(ras[0] > 0.05 && !ras[1] && wdth[0] === 0 && !wdth[1] && inner[1] > 5 && inner[0] === 0, `${M.id} : truck overtaken close in (gauge ${ras[0]}, choc ${ras[1]}), wide (${wdth}), hit (gauge ${inner[0]}, choc ${inner[1]})`);
  }
  // rain: drizzle (strength 1, the shiny asphalt of the city) slides a little; a downpour slows the autopilot by up to 16% without sending it into the walls, and lengthens the braking
  // with no surface declared, the road is dry everywhere (T.surf[i] === SURF.sec), except under a downpour
  assert(T.surf.length === n); assert(M.surf || T.surf.every(q => q === SURF.sec) === !M.th.rainFx, M.id + ' : road wet where it is not raining');
  if (T.surf.some(q => q !== SURF.sec)) {
    const E = T.surf; T.surf = null; const [sec, , hdry] = lapRun(c => autopilot(c, T)); T.surf = E;
    if (!M.surf) assert(lap > 1.002 * sec && lap < 1.16 * sec, `${M.id} : lap in the rain ${lap} s, dry ${sec} s`);
    // declared surface (snow, ice, dirt): the map drives differently from dry, without turning into a rink. The lap loses 8 to 35% (on a dirt base: -5 to 35%, because the map is narrow and tuned for dirt; dry, the autopilot gets there too fast, hits and loses more than it gains: the number of dry hits is shown), and bare ice, if any, stays in patches: less than a quarter of the lap
    else { const gl = T.surf.filter(q => q.corner > 0.45).length / n; surfMap = `, ${((lap / sec - 1) * 100).toFixed(0)} % slower than dry (${sec.toFixed(1)} s${hdry ? ', where the autopilot hits ' + hdry + ' fois' : ''}), bare ice on ${(gl * 100).toFixed(0)} % of the lap`;
      assert((M.surf.backdrop ? lap > (M.surf.backdrop === 'terre' ? 0.95 : 1.08) * sec : lap >= sec - 0.05) && lap < 1.35 * sec && gl < 0.25, `${M.id} : lap ${lap} s${surfMap}`); }
  }
  // surfaces (SURF table): launched dry, then placed on each surface, on an isOpen plane. Braking distance from 200 km/h, radius at full steering lock at 120 km/h, speed lost in 2 s off the throttle from 100 km/h
  { const over = (q, v, f) => { const c = launcher(v); c.x = c.z = 1e5; TO.surf = [q]; // (far away: in Paris, the arch piers are on the path)
      const r = f(c); TO.surf = null; return r; };
    const brakes = q => over(q, v200, c => { let d = 0; while (c.vf > 1) { go(c, I(0, 0, 1), H); d += c.vf * H; } return d; }), ray = q => over(q, v120, c => arcRadius(c, I(1, 1))), wheelPart = q => over(q, 100 / 3.6, c => 100 / 3.6 - go(c, I(0, 0), 2).vf);
    const f = {}, r = {}; for (const k in SURF) { f[k] = brakes(SURF[k]); r[k] = ray(SURF[k]); }
    const txt = Object.keys(SURF).map(k => `${k} ${f[k].toFixed(0)} m / ${r[k].toFixed(0)} m`).join(', ');
    assert(f.damp > 1.2 * f.sec, M.id + ' : braking in the rain must be longer (' + txt + ')');
    assert(f.iceSurf > 2.5 * f.sec && r.iceSurf > 2 * r.sec, `${M.id} : on ice, braking and radius must be clearly larger than dry (${txt})`);
    assert(f.snowSurf > 1.3 * f.sec && f.snowSurf < 0.8 * f.iceSurf && r.snowSurf > 1.2 * r.sec && r.snowSurf < 0.8 * r.iceSurf, `${M.id} : packed snow must sit between dry and ice (${txt})`);
    // dirt: braking a little worse, turning almost as tight, the car slows on its own, and the slide starts earlier (at 36 km/h, handbrake and steering: nothing when dry)
    const part = q => over(q, 36 / 3.6, c => go(c, I(1, 1, 0, true), 0.15).drift);
    assert(f.terre > 1.1 * f.sec && f.terre < f.snowSurf && r.terre < 1.15 * r.sec && wheelPart(SURF.terre) > wheelPart(SURF.sec) + 0.5 && part(SURF.terre) && !part(SURF.sec), `${M.id} : terre (${txt}, roue libre ${wheelPart(SURF.terre)} contre ${wheelPart(SURF.sec)} m/s, slide at 36 km/h ${part(SURF.terre)})`);
    surfTxt = txt; }
  // a square where you can drive everywhere: you cross the arch along its axis without touching; launched at a pier, you hit it without going into it; you rejoin the track on exit
  if (M.place) {
    const P = M.place, ux = Math.sin(P.a), uz = Math.cos(P.a), launcher = (ox, oz, th) => { const c = newCar(T), s0 = S.reduce((b, s, k) => Math.hypot(s.x - ox, s.z - oz) < Math.hypot(S[b].x - ox, S[b].z - oz) ? k : b, 0);
      return Object.assign(c, { x: ox, z: oz, th, vx: Math.cos(th) * 25, vz: Math.sin(th) * 25, idx: s0, dist: s0 }); };
    let c = launcher(P.c[0] - ux * 40, P.c[1] - uz * 40, Math.atan2(uz, ux)), h = 0;
    for (let i = 0; i < 2.5 / H; i++) { step(c, { steer: 0, gas: 0.3, brake: 0, hand: false }, T, H); if (c.hit > 0) h++; }
    const doneFlag = (c.x - P.c[0]) * ux + (c.z - P.c[1]) * uz;
    assert(h === 0 && doneFlag > 20, `${M.id} : you do not cross the arch (${h} chocs, ${doneFlag | 0} m past the centre)`);
    // from the arrival avenue, through the arch, to the departure avenue: progress along the track follows, you set off again on the track
    { const e = S.findIndex(s => Math.hypot(s.x - P.c[0], s.z - P.c[1]) < P.r) - 10, x = S.findIndex((s, k) => k > e + 20 && Math.hypot(s.x - P.c[0], s.z - P.c[1]) > P.r) + 40, Wp = [[P.c[0] - ux * 40, P.c[1] - uz * 40], [P.c[0] + ux * 40, P.c[1] + uz * 40], [S[x].x, S[x].z]];
      c = Object.assign(newCar(T), { x: S[e].x, z: S[e].z, idx: e, dist: e, th: Math.atan2(S[e].tz, S[e].tx), vx: S[e].tx * 25, vz: S[e].tz * 25 }); let k = 0, hh = 0;
      for (let i = 0; i < 20 / H && !(k === 2 && c.idx >= x - 10); i++) { if (k < 2 && Math.hypot(Wp[k][0] - c.x, Wp[k][1] - c.z) < 8) k++; const a = wrap(Math.atan2(Wp[k][1] - c.z, Wp[k][0] - c.x) - c.th);
        const v = Math.hypot(c.vx, c.vz); step(c, { steer: Math.max(-1, Math.min(1, a * 3)), gas: v < 17 ? 0.35 : 0, brake: v > 20 ? 0.5 : 0, hand: false }, T, H); if (c.hit > 3) hh++; } // at 60 km/h: on the cobbles, faster, you have to brake to aim for the arch
      assert(k === 2 && c.idx >= x - 10 && c.dist >= x - 10 && !hh, `${M.id} : crossing the square through the arch (step ${k}, sample ${c.idx} of ${x}, ${hh} chocs)`); }
    const [px, pz] = P.piers[0], wx = P.c[0] + px * Math.cos(P.a) + pz * Math.sin(P.a), wz = P.c[1] - px * Math.sin(P.a) + pz * Math.cos(P.a), ax = wx - 30;
    c = launcher(ax, wz, 0); let hit = 0, inner = 0;
    for (let i = 0; i < 2 / H; i++) { step(c, { steer: 0, gas: 1, brake: 0, hand: false }, T, H); hit = Math.max(hit, c.hit);
      const qx = c.x - P.c[0], qz = c.z - P.c[1], lx = qx * Math.cos(P.a) - qz * Math.sin(P.a), lz = qx * Math.sin(P.a) + qz * Math.cos(P.a);
      if (P.piers.some(([x, z, a, b]) => Math.abs(lx - x) < a - 0.3 && Math.abs(lz - z) < b - 0.3)) inner++; }
    assert(hit > 3 && !inner, `${M.id} : the arch pier does not block (hit ${hit}, ${inner} not inside)`);
    // central reservation: the track goes round it wide; launched at the crown of bollards off the arch axis, from outside as from inside, you hit it without crossing it
    if (P.island) { const [ri] = P.island, cs = Math.cos(P.a), sn = Math.sin(P.a), ray = q => Math.hypot(q.x - P.c[0], q.z - P.c[1]);
      assert(S.every(s => ray(s) > ri + 20), `${M.id} : the track passes too close to the central reservation`);
      for (const [r0, direction] of [[ri + 25, -1], [ri - 25, 1]]) { c = launcher(P.c[0] + cs * r0, P.c[1] - sn * r0, Math.atan2(-sn * direction, cs * direction)); let impact = 0, crossed = 0;
        for (let i = 0; i < 2 / H; i++) { step(c, { steer: 0, gas: 1, brake: 0, hand: false }, T, H); impact = Math.max(impact, c.hit); if ((ray(c) - ri) * direction > 0) crossed++; }
        assert(impact > 3 && !crossed, `${M.id} : the crown of bollards does not block ${direction < 0 ? 'from outside' : 'from inside'} (choc ${impact}, ${crossed} not on the other side)`); } }
  }
  // race: 3 laps with 4 autopilots on the map's track; everyone finishes, nobody leaves the track or gets stuck
  const R = newRace(T); let wall = 0, bump = 0;
  while (!R.done && R.t < 900) { stepRace(R, null, H); for (const x of R.cars) { assert(Number.isFinite(x.x) && (Math.abs(x.d) <= S[x.idx].w || insidePlace(T, x.x, x.z)), M.id + ' : race, car off track'); if (x.hit > 3) wall++; if (x.bump > 3) bump++; } }
  assert(R.done, M.id + ' : the race does not end');
  // medal ghosts: the reference lap is that of the medals (tni); the map's gold trace (traces-gold.js) is replayed, stays on the road from one end to the other, starts from the line, takes its time, and that time is under the gold threshold
  // longest plausible challenge link: a lap at bronze time
  { const ref = lapRef(T), med = M.med || [1.1, 1.03, 0.97], gold = challengeRead(TRACES_GOLD[M.id]), cutoff = ref.t * med[2];
    assert(ref.t === tni, `${M.id} : tourRef (${ref.t} s) is not the medal reference lap (${tni} s)`);
    assert(!gold.err && gold.mapDef === M.id, `${M.id} : trace or illisible (${gold.err}) : relancer node tools/build-gold-laps.js`);
    let outOf = 0; for (let i = 0; i < gold.trace.length; i += 4) { const x = gold.trace[i], z = gold.trace[i + 2]; let b = 0, bd = 1e9; for (let j = 0; j < n; j++) { const d = Math.hypot(S[j].x - x, S[j].z - z); if (d < bd) { bd = d; b = j; } } if (bd > S[b].w + 0.5 && !insidePlace(T, x, z)) outOf++; }
    assert(!outOf && Math.hypot(gold.trace[0] - S[0].x, gold.trace[2] - S[0].z) < S[0].w + 3 && Math.abs((gold.trace.length / 4 - 1) / 20 - gold.t) < 0.25, `${M.id} : gold trace off the road (${outOf} points), far from the line or of wrong duration: rerun node tools/build-gold-laps.js`);
    assert(gold.t <= cutoff, `${M.id} : the gold trace (${gold.t} s) is not under the gold threshold (${cutoff} s)`);
    const link = challengeCode(M.id, ref.t * med[0], stretch(ref.trace, med[0])).length; if (link > linkMax[0]) linkMax = [link, M.id, ref.t * med[0]];
    goldTxt.push(`${M.id} ${gold.t.toFixed(1)} s (seuil ${cutoff.toFixed(1)})`); }
  const k = v => Math.round(v * 3.6);
  console.log(`OK  ${M.id.padEnd(7)} ${Math.round(T.len)} m, rayon mini ${rmin | 0} m, flying lap ${lap.toFixed(1)} s, moyenne ${k(T.len / lap)} km/h, de ${k(vmin)} at ${k(vmax)} km/h, ${hits} chocs${T.vert ? ', ' + flights + ' vols' : ''}, 0-100 en ${t100.toFixed(1)} s ; en glisse ${tskid.toFixed(1)} s (${((tskid / lap - 1) * 100).toFixed(1)} %, ${boosts} coups de nitro, ${hskid} hits), autopilot with a gauge ${tni.toFixed(1)} s, flat out ${tfull.toFixed(1)} s (+${((tfull / lap - 1) * 100).toFixed(1)} %, ${hfull} hits); radius at 120 km/h ${r120.toFixed(0)} m (off throttle ${r120l.toFixed(0)}), at ${k(vtop)} km/h ${rtop.toFixed(0)} m, sliding at 200 km/h ${gin.toFixed(0)} / ${gn.toFixed(0)} / ${gout.toFixed(0)} m (inside / neutral / outside), drift ${dhold.toFixed(0)}° ; course : ${raceOrder(R).map(x => x.ending.toFixed(0)).join(' / ')} s, ${wall} chocs mur, ${bump} car hits${surfMap}`);
}
console.log(`OK  gold ghosts: ${goldTxt.join(' · ')} ; longest challenge link: ${linkMax[0]} characters (${linkMax[1]}, lap of ${linkMax[2].toFixed(1)} s at bronze time)`);
// surfaces declared by a map (surf field: { backdrop, zones }): test maps, the touge covered with each surface, then with a single iceSurf plate.
// The autopilot reads the same table: it completes its flying lap without hitting, more slowly than dry; and the plate exists only where it is declared, blended into its edges.
{
  const touge = MAPS.find(m => m.id === 'touge'), loadTest = surf => buildTrack(THREE, { ...touge, id: 'attempt', surf });
  const lapRun = T => { const c = newCar(T), n = T.n; let t = 0, t1 = 0, h = 0; while (c.dist < 2 * n && t < 900) { step(c, autopilot(c, T), T, H); t += H; if (!t1 && c.dist >= n) t1 = t; if (t1 && c.hit > 0) h++; } assert(c.dist >= 2 * n, 'surface: lap not completed'); return [t - t1, h]; };
  const res = {}; for (const k in SURF) { const T = loadTest(k === 'sec' ? undefined : { backdrop: k }); assert(T.surf.every(q => q === SURF[k]), k + ' : the backdrop does not cover the whole map'); res[k] = lapRun(T); }
  const txt = Object.keys(res).map(k => `${k} ${res[k][0].toFixed(1)} s`).join(', ');
  for (const k in res) assert(!res[k][1], `the autopilot touches a wall on ${k} (${res[k][1]} contacts ; ${txt})`);
  assert(res.iceSurf[0] > 1.3 * res.sec[0] && res.snowSurf[0] > 1.08 * res.sec[0] && res.snowSurf[0] < res.iceSurf[0] && res.terre[0] > 1.02 * res.sec[0] && res.terre[0] < res.snowSurf[0] && res.damp[0] > 1.02 * res.sec[0], 'touge laps by surface: ' + txt);
  const T = loadTest({ zones: [[24, 28, 'iceSurf']] }), near = p => T.S.reduce((b, s, i) => Math.hypot(s.x - p[0], s.z - p[1]) < Math.hypot(T.S[b].x - p[0], T.S[b].z - p[1]) ? i : b, 0), [a, m, b] = [24, 26, 28].map(i => near(touge.pts[i]));
  assert(T.surf[m] === SURF.iceSurf && T.surf[(a + T.n - 40) % T.n] === SURF.sec && T.surf[(b + 40) % T.n] === SURF.sec, 'ice plate: not where it is declared');
  const edgePt = T.surf[(a + T.n - 3) % T.n]; assert(edgePt.corner > 0 && edgePt.corner < SURF.iceSurf.corner && edgePt.brakes > 0 && edgePt.brakes < SURF.iceSurf.brakes, 'plaque de glace : bord non fondu');
  const [tp, hp] = lapRun(T); assert(!hp && tp > res.sec[0] + 0.3 && tp < res.iceSurf[0], `ice plate: lap ${tp} s (${hp} contacts), dry ${res.sec[0]} s`);
  console.log(`OK  surfaces (touge) : ${txt}, an ice plate ${tp.toFixed(1)} s; braking from 200 km/h / radius at 120 km/h: ${surfTxt}`);
}
// radio: three stations per map (four at most); a form of at least 32 measures made of different sections; sound timbres and drum sets known to audio.js
// (variety to the ear is measured in the browser: the "Station variety" button of audition.html; there is no Web Audio under node)
const SRC = require('fs').readFileSync(__dirname + '/../src/audio/audio.js', 'utf8'), seen = new Set();
new Function(SRC); // audio.js parses without syntax error (otherwise the game stays silent: SOUND does not exist)
const SCL = { mineur: [0, 2, 3, 5, 7, 8, 10], majeur: [0, 2, 4, 5, 7, 9, 11] }, LABELS = ['do', 'do#', 'ré', 'mib', 'mi', 'fa', 'fa#', 'ground', 'lab', 'la', 'sib', 'si'];
require('../src/audio/radio-trials.js'); require('../src/audio/instruments.js'); require('../src/audio/instruments-notes.js'); // the station trials (outside the game) pass the same checks
for (const M of [...MAPS, { id: 'trials', radio: MUS.TRIALS }]) {
  assert(M.id === 'trials' || M.radio.length === 3 || M.radio.length === 4, M.id + ' : three stations are needed (four at most)');
  for (const s of M.radio) {
    const w = s.name + ' : ';
    assert(!seen.has(s.name) && !seen.has(s.genre), w + 'name or genre duplicated'); seen.add(s.name); seen.add(s.genre);
    assert(s.bpm >= 80 && s.bpm <= 180 && s.name.length <= 13, w + 'tempo or name too long for the HUD');
    assert(s.form.length * 4 >= 32 && new Set(s.form).size >= 5, w + 'form too short or too few sections');
    assert(s.sec[s.hot] && s.sec.e, w + 'chorus or variation missing');
    assert(SRC.includes(' ' + s.kit + ': {'), w + 'kit inconnu ' + s.kit);
    for (const p of ['b', 'c', 'g', 'a', 'l']) { if (!s[p]) continue; const m = SRC.match(new RegExp(' ' + s[p].p + ": [{] (?:smp: '([a-zA-Z0-9]+)', )?o: [[][[]")); // a sampled timbre must also exist in instruments.js
      const e = /^e_(\w+)$/.exec(s[p].p); if (e) { assert(INS[e[1]], w + 'instrument absent de instruments.js : ' + e[1]); continue; } // e_… : one timbre per recorded instrument, made by audio.js
      assert(m, w + 'timbre inconnu ' + s[p].p); assert(!m[1] || INS[m[1]], w + 'instrument absent de instruments.js : ' + m[1]); }
    assert(!s.d || new RegExp(' ' + s.d[0] + ": [{] (?:smp: '[a-zA-Z0-9]+', )?o: [[][[]").test(SRC), w + 'nappe inconnue');
    for (const k in s.sec) for (const p in s.sec[k]) if ('kshpbdcgal'.includes(p)) { assert(s[p], w + 'section ' + k + ' : partie absente ' + p); const v = s[p].v || (p === 'd' ? [0] : s[p]); assert(s.sec[k][p].v < v.length, w + 'section ' + k + ' : variante inconnue ' + p + s.sec[k][p].v); }
    for (const v of (s.l || { v: [] }).v) for (const b of v) for (const n of b) assert(n == null || n === -99 || (n >= 55 && n <= 105), w + 'theme note ' + n);
    // tuning: out-of-key chords are declared (borrowed); each theme note, and each bass note as audio.js realigns it, belongs
    // to the scale or chord of its bar, in all the sections and at all their places in the form
    const sc = SCL[s.scl].map(i => (s.key + i) % 12), pc = n => ((n % 12) + 12) % 12, label = n => LABELS[pc(n)];
    s.prog.forEach((pr, p) => pr.CH.forEach((ch, i) => assert(ch.every(n => sc.includes(pc(n))) || (s.borrows || '').split(' ').includes(s.chordSeq[p][i]), w + 'undeclared out-of-key chord: ' + s.chordSeq[p][i])));
    for (const k in s.sec) for (let fmi = 0; fmi < s.form.length; fmi++) if (s.form[fmi] === k || (k === s.hot && s.form[fmi] !== 'e')) for (let b = fmi * 4; b < fmi * 4 + 4; b++) {
      const sec = s.sec[k], pr = s.prog[sec.P || 0], ok = pr.OK[b % pr.OK.length], root = pr.ROOT[b % pr.ROOT.length], where = ' (section ' + k + ', mesure ' + (b + 1) + ', accord ' + s.chordSeq[sec.P || 0][b % pr.CH.length] + ')';
      if (sec.l) for (const n of s.l.v[sec.l.v][b % s.l.v[sec.l.v].length]) assert(n == null || n === -99 || ok.has(pc(n)), w + 'theme, wrong note ' + label(n) + where);
      // a held theme note (2 steps or more) does not rub against the chord: neither a semitone above one of its notes, nor the tritone of its root (unless the rubbing is intended: excluded)
      if (sec.l && !s.outOf) { const L = s.l.v[sec.l.v][b % s.l.v[sec.l.v].length], ch = pr.CH[b % pr.CH.length].map(pc);
        L.forEach((n, q) => { if (n == null || n === -99 || ch.includes(pc(n)) || !(q + 1 < 16 && L[q + 1] == null)) return;
          assert(!ch.some(c => pc(n - c) === 1) && pc(n - root) !== 6, w + 'theme, ' + label(n) + ' held, rubs against the chord, not ' + (q + 1) + where); }); }
      if (sec.b) for (const n of s.b.v[sec.b.v][b % s.b.v[sec.b.v].length]) { if (n == null || n === -99) continue;
        if (s.bBy) assert(s.bBy.includes(n) || s.bBy.includes(n - 12), w + 'bass parallel, unplanned interval ' + n + where);
        else { const j = ok.has(pc(root + n)) ? root + n : ok.has(pc(root + n - 1)) ? root + n - 1 : root + n + 1; assert(ok.has(pc(j)), w + 'bass impossible to realign ' + label(root + n) + where); } }
    }
  }
}
assert(/const justTune = \(n, ok\) => ok\.has/.test(SRC), 'audio.js no longer realigns the bass');
console.log('OK  radio   tuning checked (themes, basses, chords) · ' + MAPS.map(M => M.radio.map(s => s.genre.toLowerCase()).join(' / ')).join(' · '));

// rival level: a level 0.95 loses at least 2.5% per lap on each map, even where the car hits the rev limiter (Paris, the arena: without a top-speed cap, 1.5%)
{ const losses = [];
  for (const id of ['paris', 'stade']) { const T = buildTrack(THREE, MAPS.find(M => M.id === id));
    const lapRun = lvl => { const c = newCar(T); let t = 0; while (c.dist < T.n && t < 300) { step(c, autopilot(c, T, lvl), T, H); t += H; } return t; };
    const p = lapRun(0.95) / lapRun(1) - 1; assert(p > 0.025, `${id} : a rival at level 0.95 loses only ${(p * 100).toFixed(1)} % per lap`); losses.push(id + ' ' + (p * 100).toFixed(1) + ' %'); }
  console.log('OK  rival level at 0.95: ' + losses.join(', ')); }
