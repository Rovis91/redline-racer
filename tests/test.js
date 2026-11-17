// node test.js — track geometry, full lap on autopilot, realistic mechanics, walls, skid (trigger, lock, boost), manual gearbox, raceCase.
const assert = require('assert');
const THREE = require('../vendor/three/three.module.js');
require('../src/engine/sim.js');
const T = buildTrack(THREE, MAP_DEF), { S, n, W } = T, CARD = T.car, H = 1 / 120;
const run = (c, inp, sec) => { for (let i = 0; i < sec / H; i++) step(c, typeof inp === 'function' ? inp(c) : inp, T, H); };
const I = (steer, gas, brake = 0, hand = false) => ({ steer, gas, brake, hand });

const rmin = 1 / Math.max(...S.map(s => Math.abs(s.k)));
assert(T.surf.every((q, i) => i >= T.t0 && i <= T.t1 ? q === SURF.sec : q.corner > 0 && q.corner < SURF.damp.corner), "the city drizzle wets the shiny asphalt a little, not the tunnel");
assert(rmin > 25, 'minimum radius too tight: ' + rmin);
for (let i = 0; i < n; i++) for (let j = i + 40; j < n; j++) {
  if (n - j + i < 40) continue;
  assert(Math.hypot(S[i].x - S[j].x, S[i].z - S[j].z) > 2 * W + 8, `the track crosses itself (${i},${j})`);
}

// tunnel string (M.racingLine): 50 cm from the wall limit, without touching it, the gauge rises; in the middle of the road, or outside the zone, nothing
{ const gauge = (i, dd) => { const s = S[i], c = newCar(T), L = s.w - 1.1; Object.assign(c, { idx: i, x: s.x - s.tz * dd * L, z: s.z + s.tx * dd * L, th: Math.atan2(s.tz, s.tx), vx: s.tx * 40, vz: s.tz * 40, gear: 4 }); step(c, I(0, 0), T, H); return c.nitro; };
  const i = (T.racingLine[0] + T.racingLine[1]) >> 1; assert(gauge(i, 0.95) > 0 && gauge(i, -0.95) > 0 && gauge(i, 0) === 0 && gauge(T.racingLine[1] + 40, 0.95) === 0, 'tunnel string: nitro does not reward hugging the wall'); }
// full lap on autopilot, without skidding or touching
let c = newCar(T), t = 0, hits = 0, vmax = 0, slid = 0;
assert(!T.vert, 'the city declares neither jump nor drivable wall: the terrain must not come into play');
while (c.dist < n && t < 180) { step(c, autopilot(c, T), T, H); t += H; assert(!c.air && c.y === ground(T, c), 'city: the car leaves the ground'); if (c.hit > 3) hits++; if (c.drift) slid += H; vmax = Math.max(vmax, Math.hypot(c.vx, c.vz)); assert(Math.abs(c.d) <= W); }
assert(c.dist >= n && t > 30 && t < 120, 'invalid auto lap: ' + t);
assert(slid < 1, 'clean driving must not skid: ' + slid);

// mechanics: the car must behave like a GT-R Z-tune (0 to 100 km/h in under 4.5 s, 1st up to ~68 km/h, 2nd up to ~110 km/h)
c = newCar(T); let t100 = 0, shifts = [], g0 = 0;
for (let i = 0; i < 12 / H && c.idx > 1000 || c.idx < 150; i++) {
  step(c, I(0, 1), T, H); const tt = (i + 1) * H;
  if (!t100 && c.vf >= 100 / 3.6) t100 = tt;
  if (c.gear !== g0) { shifts.push(Math.round(c.vf * 3.6)); g0 = c.gear; }
  if (tt > 12) break;
}
assert(t100 > 3 && t100 < 4.5, '0 to 100 km/h outside realistic range: ' + t100);
assert(Math.abs(shifts[0] - 68) < 8 && Math.abs(shifts[1] - 110) < 10, 'unrealistic gear change speeds: ' + shifts);
assert(c.rpm >= CARD.idle && c.rpm <= CARD.red + 200, 'rpm out of limits: ' + c.rpm);

// braking must pay off: the same driver, throttle always wide open, hits the walls and loses time
c = newCar(T); let tf = 0, fh = 0;
while (c.dist < n && tf < 180) { step(c, { ...autopilot(c, T), gas: 1, brake: 0 }, T, H); tf += H; if (c.hit > 0) fh++; }

assert(tf > t + 2, 'driving flat out into walls must stay slower than braking: ' + tf);
// grazing the wall at an angle scrapes (sparks) but does not cut speed nor kill the engine
for (const [deg, keep, steer] of [[6, 0.82, 0], [12, 0.72, 0], [6, 0.7, 1]]) { // last case: steering held hard toward the wall
  const c = newCar(T), v = () => Math.hypot(c.vx, c.vz); run(c, I(0, 1), 6);
  const s = S[c.idx], a = deg * Math.PI / 180, th = Math.atan2(s.tz, s.tx) + a, v0 = v(), o = W - 1.3 - c.d; // placed close to the wall, nose turned `deg` toward it
  c.x += -s.tz * o; c.z += s.tx * o; c.th = th; c.vx = Math.cos(th) * v0; c.vz = Math.sin(th) * v0;
  let stun = 0, rub = 0; for (let i = 0; i < 120; i++) { step(c, I(steer, 1), T, H); stun = Math.max(stun, c.stun || 0); rub += c.rub; }
  assert(rub > 0, 'grazing: wall not reached');
  assert(c.nitro > 0.02, 'grazing the wall must fill the nitro gauge: ' + c.nitro);
  assert(v() > v0 * keep && stun <= 0, `grazing at ${deg}° penalized too much: ${v0.toFixed(1)} -> ${v().toFixed(1)} m/s, coupure ${stun}`);
}

// weight transfer: at full speed, steering locked, the car turns faster under braking than on throttle, and at least as much off throttle
const hairpin = (gas, brake) => { const c = newCar(T); run(c, I(0, 1), 8); run(c, I(1, gas, brake), 0.3); return c.yaw; };
assert(hairpin(0, 1) > 1.15 * hairpin(1, 0) && hairpin(0, 0) >= hairpin(1, 0), `braking or lifting off does not help turning: ${hairpin(1, 0)} / ${hairpin(0, 0)} / ${hairpin(0, 1)}`);
// skid: steering without handbrake at medium speed does not spin out
c = newCar(T); run(c, I(0, 1), 4); run(c, I(0.5, 1), 0.4);
assert(!c.drift, 'spin out for no reason');
// handbrake held + steering -> clean skid, locked in its direction; handbrake released -> the skid stops at once, with a boost if it lasted (skid laps: test-mapDefs.js)
c = newCar(T); run(c, I(0, 1), 4); run(c, I(1, 1, 0, true), 0.1); run(c, I(-1, 1, 0, true), 0.6); // steering outward: it opens up but keeps turning on the same side
const beta = Math.atan2(Math.abs(c.vl), Math.abs(c.vf)) * 180 / Math.PI;
assert(c.drift && beta > 3 && beta < 60, 'drift angle out of range: ' + beta);
assert(c.yaw > 0, 'steering must not reverse the skid');
assert(c.nitro > 0.02 && c.nitro < 0.5, 'a held skid must fill the nitro gauge, gradually: ' + c.nitro);
{ const j = c.nitro, v = c.vf; run(c, I(0, 1), H); assert(!c.drift && !c.boost && c.nitro === j && c.vf < v + 0.2, 'coming out of a skid must no longer push on its own'); }

// ---------- nitro: a gauge (c.nitro, 0 to 1) that the player spends with the nitro control ----------
{
  const straight = (nitro, gauge, sec = 5) => { const c = newCar(T); c.nitro = gauge; run(c, { ...I(0, 1), nitro }, sec); return c; }, gap = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  const without = straight(false, 1), using = straight(true, 1), empty = straight(true, 0), ctl = straight(false, 0), mi = straight(true, 1, 1);
  assert(without.nitro === 1 && gap(without, ctl) === 0, "a full gauge does nothing until it is triggered");
  assert(gap(empty, ctl) === 0 && !empty.boost, 'nitro without gauge: no effect');
  assert(mi.boost && mi.nitro > 0.3 && mi.nitro < 0.9, 'the gauge must drain gradually during the push: ' + mi.nitro);
  assert(using.nitro === 0 && !using.boost && using.dist > without.dist + 15 && using.vf > without.vf + 5, `nitro must gain ground on a straight: ${using.dist * 2} m contre ${without.dist * 2} m, ${using.vf} contre ${without.vf} m/s`);
  // recovery: 2 s of nitro gains more speed at 30 km/h (after a mistake) than at 180 km/h
  const gain = v0 => { const r = [false, true].map(nitro => { const c = newCar(T); run(c, I(0, 1), 0.01); c.vx = Math.cos(c.th) * v0 / 3.6; c.vz = Math.sin(c.th) * v0 / 3.6; c.nitro = 1; run(c, { ...I(0, 1), nitro }, 2); return c.vf; }); return r[1] - r[0]; };
  assert(gain(30) > 1.2 * gain(180), `nitro must help recovery: +${gain(30) * 3.6} km/h at 30 km/h, +${gain(180) * 3.6} at 180`);
  // manual gearbox: nitro only goes past the rev limiter on the top gear; held in 1st, it does not push past the limiter's 72 km/h
  const m1 = newCar(T); m1.manual = true; m1.nitro = 1; run(m1, { ...I(0, 1), nitro: true }, 3);
  assert(m1.gear === 0 && m1.vf * 3.6 < 80, `nitro en 1re : ${m1.vf * 3.6} km/h, the rev limiter no longer holds`);
  // a hard impact against the wall empties the gauge
  const c = newCar(T); c.nitro = 1; run(c, I(0, 1), 4);
  const s = S[c.idx], th = Math.atan2(s.tz, s.tx) + 0.9, v0 = c.vf, o = W - 1.3 - c.d; c.x += -s.tz * o; c.z += s.tx * o; c.th = th; c.vx = Math.cos(th) * v0; c.vz = Math.sin(th) * v0;
  let stun = 0; for (let i = 0; i < 60; i++) { step(c, I(0, 1), T, H); stun = Math.max(stun, c.stun); }
  assert(stun > 0 && c.nitro < 0.2, 'a hard impact must empty the gauge: ' + c.nitro);
}

// ---------- Skid mode: the score (c.score), the points of the current skid (c.ongoing) and the chain multiplier (c.mult), computed apart from the physics ----------
let skiddingTxt;
{
  // on an open plane, like test-mapDefs.js (no walls: a single track sample, pinned under the car at each step)
  const O = { x: 0, y: 0, z: 0, tx: 1, tz: 0, k: 0, sl: 0 }, TO = { S: [O], n: 1, mapDef: T.mapDef, car: T.car, kt: T.kt };
  const go = (c, inp, sec) => { for (let i = 0; i < sec / H; i++) { O.x = c.x; O.z = c.z; const v = Math.hypot(c.vx, c.vz) || 1; O.tx = c.vx / v; O.tz = c.vz / v; step(c, inp, TO, H); } return c; };
  const brandNew = () => Object.assign(newCar(T), { idx: 0 });
  // a skid: launched for `momentum` seconds, handbrake held for `holdTime` seconds, then released
  const glisse = (momentum, holdTime, c = brandNew()) => { go(c, I(0, 1), momentum); const v = c.vf; go(c, I(1, 1, 0, true), holdTime); assert(c.drift, 'test skid failed'); c.v0 = v; c.inProgress = c.ongoing; go(c, I(0, 1), 0.1); return c; };
  const fast = glisse(5, 1.2), slowF = glisse(1.6, 1.2);
  assert(brandNew().score === 0 && brandNew().mult === 1, 'start: score zero, multiplier at 1');
  assert(fast.inProgress > 0 && fast.ongoing === 0 && fast.score >= fast.inProgress && fast.score < 1.02 * fast.inProgress, `the current skid must be added to the score when it ends: ${fast.inProgress} puis ${fast.score}`);
  assert(slowF.score > 0 && fast.score > 1.5 * slowF.score, `a fast skid (${fast.v0 * 3.6 | 0} km/h : ${fast.score}) must score much more than a slow one (${slowF.v0 * 3.6 | 0} km/h : ${slowF.score})`);
  assert(glisse(5, 2).score > 1.5 * fast.score, 'a longer skid must score more');
  // chain: each validated skid raises the multiplier by one step, the next one scores that much more; a few seconds without skidding and it drops back to 1, the score stays
  const two = glisse(0.5, 1.2, glisse(5, 1.2)), gain2 = two.score - fast.score;
  assert(fast.mult === 2 && two.mult === 3 && gain2 > 1.7 * fast.score, `the chain must multiply: x${fast.mult} puis x${two.mult}, ${fast.score} puis ${gain2} points`);
  const acquired = two.score; go(two, I(0, 1), 3.2); assert(two.mult === 1 && two.score === acquired, `3 s without skidding: the multiplier must drop back (x${two.mult})`);
  // low-speed zigzags (0.4 s skids, one side then the other) score almost nothing
  const zig = brandNew(); go(zig, I(0, 1), 1.6); for (let i = 0; i < 16; i++) { go(zig, I(i % 2 ? 1 : -1, 0.5, 0, true), 0.4); go(zig, I(0, 0.5), 0.1); }
  assert(zig.nDrift >= 8 && zig.score < 0.05 * fast.score && zig.mult === 1, `zigzags lents : ${zig.nDrift} glisses, ${zig.score} points, x${zig.mult}`);
  // on the track: a validated skid (x2, started from the left edge: it carries to the right), then a skid that ends in the wall: its points are lost and the multiplier drops back to 1
  const m = newCar(T); run(m, I(0, 1), 3); { const s = S[m.idx], o = -6 - m.d; m.x += -s.tz * o; m.z += s.tx * o; } run(m, I(1, 1, 0, true), 0.1); run(m, I(-1, 1, 0, true), 0.8); run(m, I(0, 1), 0.1);
  assert(m.mult === 2 && m.score > 0 && !m.nWall, `skid on the track not validated (x${m.mult}, ${m.score} points, ${m.nWall} chocs)`);
  const before = m.score; let lost = 0, t = 0; while (!m.nWall && t < 3) { lost = m.ongoing; step(m, I(1, 1, 0, true), T, H); t += H; } step(m, I(1, 1, 0, true), T, H);
  assert(m.nWall && lost > 100 && m.ongoing < 5 && m.mult === 1 && m.score === before, `a hit against the wall must break the chain: x${m.mult}, ${lost} points en cours avant, ${m.ongoing} after`);
  skiddingTxt = `x2 puis x3 (${gain2 | 0} points per second), slow zigzags ${zig.score | 0}, choc : ${lost | 0} points perdus ; ${fast.score | 0} points for 1.2 s at ${fast.v0 * 3.6 | 0} km/h, ${slowF.score | 0} at ${slowF.v0 * 3.6 | 0} km/h`;
}

// manual gearbox: in 1st the speed is capped by the rev limiter (8000 rpm = 72 km/h), and an excessive downshift over-revs without going past the displayed red zone
c = newCar(T); c.manual = true; run(c, I(0, 1), 6);
assert(c.gear === 0 && c.vf * 3.6 > 62 && c.vf * 3.6 < 76, '1st gear limiter misplaced: ' + c.vf * 3.6);

console.log(`OK  longueur ${T.len | 0} m, rayon mini ${rmin | 0} m, auto lap ${t.toFixed(2)} s (flat out without braking: ${tf.toFixed(2)} s, ${fh} chocs), vmax ${(vmax * 3.6) | 0} km/h, 0-100 en ${t100.toFixed(1)} s, passes at ${shifts.join(' / ')} km/h, drift in skid ${beta | 0}°`);

// ---------- course : collisions, pilotes BOTS, classement ----------
const ending = c => [c.x, c.z, c.vx, c.vz, c.th].every(Number.isFinite);
const sep = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const at = (c, i, d, v) => { const s = S[i]; Object.assign(c, { x: s.x - s.tz * d, z: s.z + s.tx * d, idx: i, dist: i, d, file: 0, th: Math.atan2(s.tz, s.tx), vx: s.tx * v, vz: s.tz * v }); return c; };

// rear impact at 240 km/h on a stopped car: no passing through, the hit car is pushed, the one hitting slows down
let R = newRace(T), [a, b] = R.cars; R.cars.length = 2;
at(a, 60, 0, 66); at(b, 75, 0, 0);
for (let i = 0; i < 2 / H; i++) {
  stepRace(R, I(0, 1), H);
  assert(ending(a) && ending(b), 'rear impact: NaN');
  assert(a.dist < b.dist && sep(a, b) > 1.6, 'rear impact: cars passed through');
  assert(Math.abs(a.d) <= W && Math.abs(b.d) <= W, 'rear impact: car off track');
}
assert(Math.hypot(b.vx, b.vz) > 10, 'the hit car must be pushed');
// choc frontal, 240 km/h chacune
R = newRace(T); [a, b] = R.cars; R.cars.length = 2;
at(a, 60, 0, 66); at(b, 75, 0.5, -66);
let bump = 0;
for (let i = 0; i < 1 / H; i++) {
  stepRace(R, I(0, 0), H); bump = Math.max(bump, a.bump);
  assert(ending(a) && ending(b) && sep(a, b) > 1.6, 'head-on impact: cars passed through');
  assert(Math.abs(a.d) <= W && Math.abs(b.d) <= W, 'head-on impact: car off track');
}
assert(bump > 50, 'head-on impact not reported: ' + bump);
// side contact: two cars side by side, one squeezes the other; it pushes it without stopping it
R = newRace(T); [a, b] = R.cars; R.cars.length = 2;
at(a, 60, -1.3, 40); at(b, 60, 1.3, 40); a.vx -= S[60].tz * 3; a.vz += S[60].tx * 3; bump = 0;
for (let i = 0; i < 1 / H; i++) { stepRace(R, I(0.15, 1), H); bump = Math.max(bump, b.bump); assert(sep(a, b) > 1.6, 'side contact: cars interlocked'); }
assert(bump > 0.5 && b.d > 2.5, 'side contact must push: ' + b.d);
assert(a.vf > 36 && Math.hypot(b.vx, b.vz) > 36, 'side contact must not stop: ' + a.vf);

// slipstream: at equal speed, a car driving in another's wake goes faster than alone, catches up and fills its gauge; alongside, nothing changes. It also applies to bots
{
  const duo = (lat, before, inp = I(0, 1)) => { const R = newRace(T, 3, [1]), [a, b] = R.cars; at(a, 40, lat, 60); at(b, 40 + before, 0, 60); let jmax = 0; for (let i = 0; i < 1.5 / H; i++) { stepRace(R, inp, H); jmax = Math.max(jmax, a.nitro); } a.jmax = jmax; return [a, b]; }; // b drives on the line, a is `lat` metres from it
  const [alone] = duo(0, 400), [lst, aheadSec] = duo(0, 6), [onlyC] = duo(6, 400), [sideOf] = duo(6, 6), [ia] = duo(0, 6, null);
  assert(lst.vf > alone.vf + 0.3 && sep(lst, aheadSec) < 11.8 && lst.nitro > 0.02, `l'aspiration doit faire rattraper: ${lst.vf} m/s contre ${alone.vf} alone, gap ${sep(lst, aheadSec)} m, jauge ${lst.nitro}`);
  assert(sideOf.vf === onlyC.vf && sideOf.nitro === 0, `no slipstream alongside: ${sideOf.vf} m/s contre ${onlyC.vf}, jauge ${sideOf.nitro}`);
  assert(ia.jmax > 0.01, "the slipstream must also apply to a bot");
}

// the lap of a lone car must not move when the race is touched (comparable records); 42.66 s since the widened exit of point 15 of the city (42.54 before)
assert(Math.abs(t - 42.66) < 0.01, `the solo lap changed: ${t} / ${tf}`);
// the 3 bot levels, alone: from fastest to slowest, all behind the clean lap, within 2 s
const laps = AI_LVL.map(lvl => { const c = newCar(T); let t = 0; while (c.dist < n && t < 180) { step(c, autopilot(c, T, lvl), T, H); t += H; assert(c.hit < 3, 'lone bot in the wall'); } return t; });
assert(laps.every((l, i) => l > t && l < t + 2 && (!i || l > laps[i - 1] + 0.2)), 'bot pace out of range: ' + laps);

// a fast bot starting behind a slow one, on the same line, overtakes it in under one lap, without a violent impact
R = newRace(T, 3, [0.85]); [a, b] = R.cars; at(a, 10, 0, 0); at(b, 20, 0, 0); bump = 0;
while (a.pos !== 1 && R.t < 60) { stepRace(R, null, H); bump = Math.max(bump, a.bump); }
assert(a.pos === 1 && a.dist < n, 'no overtake in one lap: ' + a.dist);
assert(bump < 5, 'overtake by force: ' + bump);
const tpass = R.t;

// full 3-lap race with 4 bots: everyone finishes, no NaN, nobody leaves the track or gets stuck; ranking = finish order
R = newRace(T);
assert(R.cars.length === 4 && R.cars[0].pos === 4 && new Set(R.cars.map(c => c.dist)).size === 4, 'starting grid');
for (const x of R.cars) for (const y of R.cars) assert(x === y || sep(x, y) > 5, 'grille : voitures trop proches');
const cars4 = R.cars, R0 = c => cars4.indexOf(c) ? 'IA' + cars4.indexOf(c) : 'joueur(IA)', arr = []; let last = R.cars.map(c => c.dist), walls = 0, bumps = 0;
while (!R.done && R.t < 300) {
  stepRace(R, null, H);
  for (const c of R.cars) {
    assert(ending(c) && Math.abs(c.d) <= W, 'race: NaN or car off track');
    if (c.ending && !arr.includes(c)) arr.push(c);
    if (c.hit > 3) walls++; if (c.bump > 3) bumps++;
  }
  assert.deepStrictEqual(R.cars.map(c => c.pos).sort(), [1, 2, 3, 4]);
  if (Math.round(R.t / H) % 600 === 0) { R.cars.forEach((c, i) => assert(c.dist > last[i] + 25, `car ${i} stuck at ${R.t | 0} s`)); last = R.cars.map(c => c.dist); }
}
assert(R.done && arr.length === 4 && R.cars.every(c => c.lap === 3 && c.dist >= 3 * n), 'race not finished');
assert.deepStrictEqual(raceOrder(R), arr, 'ranking differs from the finish order');
arr.forEach((c, i) => assert(c.pos === i + 1 && (!i || c.ending >= arr[i - 1].ending), 'final positions or times inconsistent'));
assert(arr[3].ending - arr[0].ending < 8, 'race too spread out: ' + arr.map(c => c.ending));
// a player who touches nothing stays last and the bots still finish
R = newRace(T, 1); while (!R.cars.slice(1).every(c => c.ending) && R.t < 100) stepRace(R, I(0, 0), H);
assert(R.cars[0].pos === 4 && !R.cars[0].ending && !R.done && R.t < 60, '1-lap race with idle player');

// ---------- Tournée: scoring 10 / 6 / 3 / 1 per round, grid in reverse order of the overall standings (cars designated by their index: 0 = player, 1 to 3 = map rivals) ----------
{
  // before the first round: everyone at 0, the grid is that of an ordinary race (player last)
  assert.deepStrictEqual(tourAll([0, 0, 0, 0]), { pts: [0, 0, 0, 0], ranking: [0, 3, 2, 1], grid: [3, 0, 1, 2] });
  // round 1: finish rival 2, player, rival 3, rival 1
  const m1 = tourAll([0, 0, 0, 0], [2, 0, 3, 1]);
  assert.deepStrictEqual(m1, { pts: [6, 1, 10, 3], ranking: [2, 0, 3, 1], grid: [2, 0, 3, 1] }); // the leader (rival 2) starts last, the last one (rival 1) on pole
  // round 2: the player wins, the points add up; on a tie (16 each at the top), the player is ranked ahead
  const m2 = tourAll(m1.pts, [0, 2, 1, 3]);
  assert.deepStrictEqual(m2, { pts: [16, 4, 16, 4], ranking: [0, 2, 3, 1], grid: [3, 0, 2, 1] });
  assert.deepStrictEqual(m1.pts, [6, 1, 10, 3], 'tourAll must not change the points received');
  // a car that does not reach the finish scores nothing
  assert.deepStrictEqual(tourAll([0, 0, 0, 0], [1, 2]).pts, [0, 10, 6, 0]);
  // the race starts on the requested grid: 8 m between two places, staggered; without a grid, nothing changes (player last)
  const g = newRace(T, 3, AI_LVL, 0, { grid: m2.grid }).cars, d = newRace(T).cars;
  assert.deepStrictEqual(g.map(c => c.dist), [-20, -8, -16, -12], 'Tournée grid');
  assert.deepStrictEqual(g.map(c => c.pos), [4, 1, 3, 2]);
  assert.deepStrictEqual(d.map(c => c.dist), [-20, -8, -12, -16], 'default grid');
  console.log(`OK  Tournée: scoring ${SCORING.join(' / ')}, after two rounds ${m2.pts.join(' / ')} points, grille ${m2.grid.join(' ')}`);
}

// ---------- elimination race: as many laps as cars; at each crossing of the line by the leader from the end of lap 2 on, the last car is out ----------
let elimTxt;
{
  const label = (R, c) => R.cars.indexOf(c) ? 'IA' + R.cars.indexOf(c) : 'player', alive = R => R.cars.filter(c => !c.out);
  const E = newRace(T, 3, AI_LVL, 0, { elim: true }), outputs = []; let heads = 0, pt = 0;
  assert(E.laps === 4 && E.cars.every(c => !c.out), 'elimination: as many laps as cars, all on track at the start');
  while (!E.done && E.t < 400) {
    stepRace(E, null, H);
    const headEl = Math.floor(Math.max(...E.cars.map(c => c.dist)) / n); if (headEl > pt) { pt = headEl; heads++; }
    for (const c of E.cars) if (c.out && !outputs.includes(c)) {
      outputs.push(c);
      assert(pt >= 2, `elimination: ${label(E, c)} is out on the first lap (${E.t} s)`);
      assert(c.pos === E.cars.length - outputs.length + 1 && c.dist === Math.min(...[c, ...alive(E)].map(x => x.dist)), `elimination: ${label(E, c)} is out without being last`);
      assert(outputs.length === pt - 1, `elimination: ${outputs.length} out after ${pt} passes of the leader`);
    }
    for (const c of E.cars) assert(ending(c) && Math.abs(c.d) <= W, 'elimination: NaN or car off track');
  }
  const [winner] = alive(E);
  assert(E.done && outputs.length === 3 && alive(E).length === 1 && winner.ending && winner.dist >= 4 * n, `elimination not finished (${outputs.length} sorties, ${E.t} s)`);
  assert.deepStrictEqual(raceOrder(E), [winner, ...outputs.reverse()], "elimination: the final ranking must be the reverse of the exit order");
  raceOrder(E).forEach((c, i) => assert(c.pos === i + 1));
  // the eliminated car pulls over: it slows down, touches nobody, and the others' autopilot no longer deals with it
  const lst = outputs[2], ts = lst.out; while (E.t < ts + 6) { stepRace(E, null, H); assert(!lst.bump && Math.abs(lst.d) <= W); }
  assert(Math.hypot(lst.vx, lst.vz) < 3 && Math.abs(lst.d) > 3, `elimination: the eliminated car must pull over to the side (${Math.hypot(lst.vx, lst.vz)} m/s, at ${lst.d} m de l'axe)`);
  const R2 = newRace(T, 3, [1], 0, { elim: true }), [p, q] = R2.cars; at(p, 60, 0, 40); at(q, 62, 0, 0); q.out = 1; for (let i = 0; i < 1 / H; i++) { stepRace(R2, I(0, 1), H); assert(!p.bump, 'an eliminated car must no longer get in the way'); }
  // a player who touches nothing: spared at the leader's first pass, out at the second; the race ends without them
  const F = newRace(T, 3, AI_LVL, 0, { elim: true }); let passages = 0, pp = 0, vu = 0;
  while (!F.done && F.t < 400) { stepRace(F, I(0, 0), H); const k = Math.floor(Math.max(...F.cars.map(c => c.dist)) / n); if (k > pp) { pp = k; passages++; } if (F.cars[0].out && !vu) vu = passages; }
  assert(vu === 2 && F.done && F.cars[0].pos === 4 && !F.cars[0].ending, `elimination: idle player out at pass ${vu} of the leader`);
  elimTxt = `${E.laps} laps, exits at ${outputs.reverse().map(c => label(E, c) + ' ' + c.out.toFixed(2)).join(', ')} s, vainqueur ${label(E, winner)} en ${winner.ending.toFixed(2)} s`;
}

// ---------- split screen: several humans in the same race (opt.humans; the humans are the first cars, one entry each) ----------
let duoTxt;
{
  const curState = c => [c.x, c.z, c.th, c.vx, c.vz, c.nitro, c.asp, c.bump];
  // two-player grid: four cars, the two humans on the last two places (player 1 at its solo place), no overlap
  const G2 = newRace(T, 3, AI_LVL.slice(0, 2), 0, { humans: 2 });
  assert.deepStrictEqual(G2.cars.map(c => c.pos), [4, 3, 1, 2], 'two-human grid');
  assert.deepStrictEqual(G2.cars.map(c => c.dist), [-20, -16, -8, -12]);
  // with four humans, no bots: four distinct places, and each drives its own car
  const G4 = newRace(T, 3, [], 0, { humans: 4 });
  assert.deepStrictEqual(G4.cars.map(c => c.pos), [4, 3, 2, 1], 'four-human grid');
  const d4 = G4.cars.map(c => c.dist); for (let i = 0; i < 240; i++) stepRace(G4, [I(0, 1), I(0, 1), I(0, 1), I(0, 1)], H);
  assert(G4.cars.every((c, i) => c.dist > d4[i] + 5), 'quatre humains : chacun avance');
  for (const x of G2.cars) for (const y of G2.cars) assert(x === y || sep(x, y) > 5, 'two-player grid: cars too close');
  // each car follows its own input: the one that accelerates moves ahead, the one that touches nothing stays still (the bot drives neither)
  for (const who of [0, 1]) { const R = newRace(T, 3, AI_LVL.slice(0, 2), 0, { humans: 2 }), g = R.cars[who], f = R.cars[1 - who], d0 = g.dist, x0 = f.x, z0 = f.z;
    for (let i = 0; i < 3 / H; i++) stepRace(R, who ? [I(0, 0), I(0, 1)] : [I(0, 1), I(0, 0)], H);
    assert(g.dist > d0 + 10 && f.x === x0 && f.z === z0 && R.cars[2].dist > -5, `two humans: player ${who + 1} accelerates alone (${g.dist - d0} samples, the other in ${f.x - x0}, ${f.z - z0})`); }
  // slipstream and impacts between two humans: exactly as between a human and a bot placed the same way (the second human receives the inputs the bot would give itself)
  for (const [before, v, whatLine] of [[6, 60, 'intake'], [8, 20, 'impact']]) {
    const A = newRace(T, 3, [1]), B = newRace(T, 3, [], 0, { humans: 2 }); let vu = 0;
    for (const R of [A, B]) { at(R.cars[0], 40, 0, 60); at(R.cars[1], 40 + before, 0, v); }
    for (let i = 0; i < 1.5 / H; i++) { stepRace(A, I(0, 1), H); stepRace(B, [I(0, 1), autopilot(B.cars[1], T, 1, B.cars)], H); vu = Math.max(vu, whatLine === 'impact' ? A.cars[0].bump : A.cars[0].asp); }
    assert(vu > 0.3, whatLine + ' test failed: ' + vu);
    assert.deepStrictEqual(B.cars.map(curState), A.cars.map(curState), whatLine + ' between two humans differs from human vs bot');
  }
  // finish: each human has its own. Player 1, with no input, is driven by the autopilot and completes its lap; the race is not over as long as player 2 is driving
  const R = newRace(T, 1, [], 0, { humans: 2 }), [a, b] = R.cars;
  while (!a.ending && R.t < 100) stepRace(R, [null, I(0, 0)], H);
  assert(a.ending && a.ending < 60 && !b.ending && !R.done && a.pos === 1, "a finished human must not end the other's race: " + a.ending);
  while (!R.done && R.t < 200) stepRace(R, [null], H); // no input for player 2: the autopilot brings it back
  assert(R.done && b.ending > a.ending && raceOrder(R)[0] === a && b.pos === 2, 'two-human finish: ranking by times');
  // rubber band: the bot sets its pace on the gap to the average of the humans still in raceCase. rhythm() = the path of a bot started stopped from sample 300, humans stationary at the `places`
  const rhythm = (places, el, lvl = 0.9, sec = 2) => { const R = newRace(T, 3, [lvl], el, { humans: places.length }), ia = R.cars[places.length]; places.forEach((p, i) => at(R.cars[i], p, 0, 0)); at(ia, 300, 0, 0);
    for (let i = 0; i < sec / H; i++) stepRace(R, places.map(() => I(0, 0)), H); return Math.hypot(ia.x - S[300].x, ia.z - S[300].z); }; // in metres
  const free = rhythm([150], 0), brakes = rhythm([150], 0.3);
  assert(brakes < free - 1 && brakes === rhythm([150], 0, 0.9 * (1 - 0.3)), `rubber band with one human: the formula must not change (${brakes} contre ${free} without rubber band)`);
  assert(rhythm([200, 100], 0.3) === brakes, 'rubber band with two humans: the reference must be their average');
  const midpoint = rhythm([100, 500], 0.3); // one human 400 m behind, the other 400 m ahead: the bot drives at its own pace
  assert(Math.abs(midpoint - free) < 0.1 * (free - brakes), `rubber band: two humans at equal distance on either side must not change the bot's pace (${midpoint} contre ${free}, ${brakes} braked)`);
  // elimination with two humans and two bots: player 1 touches nothing, player 2 is driven by the autopilot. Nobody exits on the first lap, player 1 exits at the leader's second pass
  const E = newRace(T, 3, AI_LVL.slice(0, 2), 0, { elim: true, humans: 2 }), outputs = []; let passages = 0, pp = 0;
  assert(E.laps === 4, 'two-human elimination: four cars, four laps');
  while (!E.done && E.t < 400) { stepRace(E, [I(0, 0), null], H); const k = Math.floor(Math.max(...E.cars.map(c => c.dist)) / n); if (k > pp) { pp = k; passages++; }
    for (const c of E.cars) if (c.out && !outputs.includes(c)) { outputs.push(c); assert(passages === outputs.length + 1, `two-human elimination: exit ${outputs.length} at pass ${passages} of the leader`); } }
  assert(E.done && outputs.length === 3 && outputs[0] === E.cars[0] && E.cars[0].pos === 4, "two-human elimination: the idle human exits first, at the leader's second pass");
  assert.deepStrictEqual(raceOrder(E), [E.cars.find(c => c.ending), ...outputs.reverse()], "two-human elimination: ranking = reverse exit order");
  // Skid duel: 2 laps, two humans, no bots, a time limit (opt.timedOut, in seconds) for each vehicle. Two independent scores: player 1 skids, player 2 drives straight
  const duel = timedOut => newRace(T, 2, [], 0, { humans: 2, timedOut });
  let D = duel(200), [g, d] = D.cars; at(g, 25, -6, 33); at(d, 80, 0, 33);
  assert(D.cars.length === 2 && D.laps === 2, 'Glisse en duel : deux voitures, deux tours');
  for (const [inp, sec] of [[I(1, 1, 0, true), 0.1], [I(-1, 1, 0, true), 0.8], [I(0, 1), 0.1]]) for (let i = 0; i < sec / H; i++) stepRace(D, [inp, I(0, 1)], H);
  assert(g.score > 100 && g.mult === 2 && d.score === 0 && d.mult === 1, `Skid duel: independent scores (${g.score} x${g.mult} and ${d.score} x${d.mult})`);
  // an impact between the two cars breaks both chains, like a wall; the score already earned stays
  D = duel(200); [g, d] = D.cars; at(g, 60, 0, 40); at(d, 66, 0, 10); g.mult = d.mult = 3; g.score = d.score = 500; let impact = 0;
  for (let i = 0; i < 2 / H && !impact; i++) { stepRace(D, [I(0, 1), I(0, 1)], H); impact = g.bump; if (!impact) assert(g.mult === 3 && d.mult === 3, "Skid duel: the chain must only drop on impact"); }
  assert(impact > 2 && g.mult === 1 && d.mult === 1 && g.score === 500 && d.score === 500, `Skid duel: an impact between cars (${impact} m/s) must break both chains (x${g.mult}, x${d.mult})`);
  // time limit per car: c.pts = the round's score, frozen at the finish; zero outside the time limit. Player 2 waits 30 s on the grid: it completes its two laps too late
  D = duel(100); [g, d] = D.cars; g.score = d.score = 1234;
  while (!D.done && D.t < 300) stepRace(D, [null, D.t < 30 ? I(0, 0) : null], H);
  assert(D.done && g.ending < 100 && g.pts >= 1234 && d.ending > 100 && d.pts === 0, `Skid duel: over the time limit, score zero (${g.ending} s : ${g.pts} points, ${d.ending} s : ${d.pts} points)`);
  duoTxt = `finishes ${a.ending.toFixed(2)} and ${b.ending.toFixed(2)} s; rubber band over 2 s: ${free.toFixed(1)} m libre, ${midpoint.toFixed(1)} m entre deux humains, ${brakes.toFixed(1)} m braked; elimination: player 1 out at ${E.cars[0].out.toFixed(2)} s ; Glisse en duel : ${g.ending.toFixed(2)} s within the time limit, ${d.ending.toFixed(2)} s over the time limit`;
}

// --- medal ghost: the trace of the reference lap (autopilot, full gauge), slowed by the medal's ratio ---
// a trace = [x, y, z, heading, …] at 20 Hz. Slowed by 10%, it passes the same places 10% later, and ends at the same point
// ---------- terrain: jumps, landings, drivable walls (on Grand Vacarme, the map that declares them) ----------
{
  const ref = lapRef(T), tr = ref.trace, pts = tr.length / 4, d = (a, i, b, j) => Math.hypot(a[i * 4] - b[j * 4], a[i * 4 + 2] - b[j * 4 + 2]);
  assert(ref.t > 30 && ref.t < 40 && Math.abs((pts - 1) / 20 - ref.t) < 0.06, `reference lap: ${ref.t} s for ${pts} points at 20 Hz`);
  assert(Math.abs((tr[0] - S[0].x) * S[0].tx + (tr[2] - S[0].z) * S[0].tz) < 5 && Math.abs((tr[0] - S[0].x) * S[0].tz - (tr[2] - S[0].z) * S[0].tx) < W && d(tr, 0, tr, pts - 1) < 5, 'the reference trace does not start from the line or does not return to it');
  const br = stretch(tr, 1.1), nbr = br.length / 4;
  assert(Math.abs((nbr - 1) / 20 - 1.1 * ref.t) < 0.11, `bronze ghost: ${(nbr - 1) / 20} s instead of ${1.1 * ref.t}`);
  assert(d(br, 110, tr, 100) < 1e-6 && d(br, 220, tr, 200) < 1e-6 && d(br, nbr - 1, tr, pts - 1) < 5 && d(br, 55, tr, 50) < 1e-6, 'bronze ghost: not at the same places 10% later');
  const fast = stretch(tr, 0.5); assert(d(fast, 50, tr, 100) < 1e-6 && Math.abs(fast.length / 4 - pts / 2) <= 1, 'sped-up trace: twice as short');
  // the heading turns the short way: between 3.1 and -3.1 rad we go through pi, not through zero
  const cap = stretch([0, 0, 0, 3.1, 1, 0, 0, -3.1], 2)[7]; assert(Math.abs(Math.abs(cap) - Math.PI) < 0.05, 'heading interpolated the wrong way: ' + cap);
  var ghostTxt = `reference ${ref.t.toFixed(2)} s (${pts} points), bronze ${((nbr - 1) / 20).toFixed(2)} s`;
  // --- link challenge: the fragment carries version, map, time and positions at 5 Hz; round trip at the quantization precision (10 cm, 1.5°) ---
  {
    const link = challengeCode('ville', ref.t, tr), lu = challengeRead(link), w = a => Math.atan2(Math.sin(a), Math.cos(a));
    assert(/^\d+\.ville\.[A-Za-z0-9_-]+$/.test(link), 'challenge link: characters outside URL: ' + link.slice(0, 40));
    assert(!lu.err && lu.mapDef === 'ville' && Math.abs(lu.t - ref.t) < 0.001, 'challenge link read back: ' + JSON.stringify(lu).slice(0, 80));
    // one point in four of the trace (5 Hz) is restored to the quantization precision; in between, the trace read back follows the original within one metre
    let e5 = 0, ea = 0, e20 = 0; const nl = lu.trace.length / 4;
    assert(nl > pts - 4 && nl <= pts, `trace relue : ${nl} points for ${pts}`);
    for (let i = 0; i < nl; i++) { const e = Math.max(Math.abs(lu.trace[i * 4] - tr[i * 4]), Math.abs(lu.trace[i * 4 + 1] - tr[i * 4 + 1]), Math.abs(lu.trace[i * 4 + 2] - tr[i * 4 + 2])); e20 = Math.max(e20, e);
      if (i % 4 === 0) { e5 = Math.max(e5, e); ea = Math.max(ea, Math.abs(w(lu.trace[i * 4 + 3] - tr[i * 4 + 3]))); } }
    assert(e5 <= 0.05 + 1e-9 && ea <= Math.PI / 256 + 1e-9 && e20 < 1, `aller-retour : ${e5} m and ${ea} rad at the transmitted points, ${e20} m entre deux`);
    // links refused, always with a message and never with an exception: truncated (at any length), from another physics version, damaged (one character changed, anywhere), for a map other than the lap's, or unrelated
    const refusal = l => { let r; try { r = challengeRead(l); } catch (e) { assert.fail('challengeRead throws an exception on ' + String(l).slice(0, 30) + ' : ' + e.message); } return typeof r.err === 'string' && r.err.length > 5 && !r.trace ? r.err : ''; };
    for (let i = 0; i < link.length; i++) assert(refusal(link.slice(0, i)), 'link truncated at ' + i + ' characters accepted');
    const other = link.replace(/^\d+/, v => +v - 1); assert(refusal(other) && refusal(other) !== refusal(link.slice(0, 500)) && /VERSION/.test(refusal(other)), 'link from another version: ' + refusal(other));
    for (let i = link.indexOf('.', 3) + 1; i < link.length; i++) assert(refusal(link.slice(0, i) + (link[i] === 'A' ? 'B' : 'A') + link.slice(i + 1)), 'link damaged at character ' + i + ' accepted');
    assert(refusal(link.replace('.ville.', '.touge.')), 'link pasted onto another map accepted');
    for (const l of ['', 'hello', '7.ville.', '7.ville.!!!', '7..AAAA', link + '=', ' ' + link, null, undefined, 42, {}]) assert(refusal(l), 'unrelated link accepted: ' + l);
    assert(challengeRead(challengeCode('ville', 1, tr.slice(0, 80))).trace, 'a short but complete link must read back');
    ghostTxt += ` ; challenge link ${link.length} characters for ${ref.t.toFixed(1)} s, gap ${(e5 * 100).toFixed(0)} cm at the transmitted points, ${(e20 * 100).toFixed(0)} cm entre deux`;
  }
}

{
  const MAP_DEF = MAPS.find(m => m.id === 'stade');
  const T = buildTrack(THREE, MAP_DEF), { S, n } = T, G = 9.81, v = c => Math.hypot(c.vx, c.vz), near = p => S.reduce((b, s, i) => Math.hypot(s.x - p[0], s.z - p[1]) < Math.hypot(S[b].x - p[0], S[b].z - p[1]) ? i : b, 0);
  const pose = (i, d, sp) => { const c = newCar(T), s = S[i]; Object.assign(c, { x: s.x - s.tz * d, z: s.z + s.tx * d, idx: i, dist: i, d, th: Math.atan2(s.tz, s.tx), vx: s.tx * sp, vz: s.tz * sp }); c.y = ground(T, c); return c; };
  assert(T.vert, 'Grand Vacarme must enable the terrain');
  // a jump: launched off the ramp, the car takes off at the end, follows a parabola (free fall), does not respond to steering nor throttle, and lands without ever going under the ground
  const [p1, , , ] = MAP_DEF.jumps[0], lip = near(MAP_DEF.pts[p1]);
  const jump = sp => { const c = pose(lip - 40, 0, sp); let t = 0, dec = null, vol = null, hmax = 0;
    while (t < 6 && !(vol && !c.air && c.idx > lip + 5)) { const th = c.th, sp0 = v(c), av = c.air; step(c, I(dec ? 1 : 0, dec ? 1 : 0.6), T, H); t += H;
      assert(c.y >= ground(T, c) - 1e-9, 'the car goes under the ground');
      if (c.air && !dec) dec = { t, x: c.x, z: c.z, y: c.y, vy: c.vy, v: v(c), i: c.idx };
      if (c.air) { hmax = Math.max(hmax, c.y - ground(T, c)); assert(!av || (c.th === th && v(c) <= sp0), 'in the air, steering or throttle still act');
        assert(Math.abs(c.y - (dec.y + dec.vy * (t - dec.t) - G * (t - dec.t) ** 2 / 2)) < 0.1, 'the flight is not a free fall'); }
      if (dec && !vol && c.land) vol = { t: t - dec.t, d: Math.hypot(c.x - dec.x, c.z - dec.z), land: c.land, v0: sp0, v1: v(c) }; }
    assert(dec && vol && Math.abs(dec.i - lip) <= 2, `no takeoff at the end of the ramp at ${sp} m/s`);
    assert(Math.abs(vol.d / (dec.v * vol.t) - 1) < 0.03, `range ${vol.d} m inconsistent with ${dec.v} m/s pendant ${vol.t} s`);
    assert(vol.land > 0 && (vol.land > 6 ? vol.v1 < vol.v0 : vol.v1 > 0.99 * vol.v0) && vol.v1 > 0.5 * vol.v0, `landing: impact ${vol.land} m/s, ${vol.v0} -> ${vol.v1} m/s`);
    return { ...vol, hmax }; };
  const s30 = jump(30), s45 = jump(45), s60 = jump(60);
  assert(s30.d > 8 && s45.d > 1.3 * s30.d && s60.d > 1.2 * s45.d && s60.d < 140, `range must grow with speed: ${s30.d} / ${s45.d} / ${s60.d} m`);
  // no nitro in the air: triggered in flight, it does not push and the gauge does not move; it resumes once the wheels are on the ground
  { const c = pose(lip - 40, 0, 45); c.nitro = 1; let t = 0, inFlight = 0;
    while (t < 6 && !(inFlight && !c.air)) { const sp0 = v(c), j = c.nitro, av = c.air; step(c, { ...I(0, 1), nitro: av }, T, H); t += H; if (av) { inFlight++; assert(c.nitro === j && v(c) <= sp0 && !c.boost, "nitro acts in the air"); } }
    assert(inFlight > 30 && c.nitro === 1, "flight too short to judge nitro in the air");
    const j = c.nitro; for (let i = 0; i < 30; i++) step(c, { ...I(0, 1), nitro: true }, T, H); assert(c.nitro < j, 'on the ground, nitro must resume'); }
  // the spillway ramp: launched, the car clears the pit; too slow, it falls in, loses time, but climbs out on its own via the ramp
  const [p2, , , F] = MAP_DEF.jumps.find(s => s[3]), lip2 = near(MAP_DEF.pts[p2]), tip = lip2 + F / 2, pit = sp => { const c = pose(lip2 - 30, 0, sp); let t = 0, backdrop = 0, hit = 0, i1 = 0;
    while (c.idx < tip + 60 && t < 30) { step(c, I(0, 1), T, H); t += H; hit = Math.max(hit, c.hit); if (c.land) { i1 = i1 || c.idx; if (c.idx < tip) backdrop++; } }
    return { t, backdrop, hit, i1, tref: (tip + 60 - lip2 + 30) * 2 / sp }; };
  const ok = pit(55), rate = pit(22);
  assert(!ok.backdrop && ok.i1 >= tip, `at 200 km/h the pit must be cleared (landing at sample ${ok.i1}, pit up to ${tip})`);
  assert(rate.backdrop && rate.t < 30 && !rate.hit, `at 80 km/h it must fall into the pit and get out without a wall (${rate.backdrop} landings at the bottom, ${rate.t} s)`);
  assert(rate.t > ok.t + 1.5, `the failed jump must cost time: ${rate.t} s contre ${ok.t} s`);
  // drivable wall: without touching the steering in the big bend, the car climbs the wall at high speed and stays pressed against it (no flight); set on it at low speed, it comes back down to the flat
  const iC = S.reduce((b, s, i) => s.rc && s.w > s.pl + 8 && (!S[b].rc || Math.abs(s.k) > Math.abs(S[b].k)) ? i : b, 0), sC = S[iC], ext = -Math.sign(sC.k);
  assert(sC.rc && sC.w > sC.pl + 6, 'no drivable wall in the tightest bend');
  c = pose(iC - 25, 0, 55); let high = 0, flew = 0; for (let i = 0; i < 1.2 / H; i++) { step(c, I(0, 1), T, H); high = Math.max(high, c.y - S[c.idx].y); if (c.air) flew++; }
  assert(high > 2 && c.d * ext > sC.pl + 3 && !flew, `at 200 km/h the car must climb the wall (height ${high} m, gap ${c.d} m, ${flew} not in the air)`);
  c = pose(iC - 10, ext * (sC.pl + 6), 6); const h0 = c.y - S[c.idx].y; for (let i = 0; i < 4 / H; i++) step(c, I(0, 0), T, H);
  assert(h0 > 2 && Math.abs(c.d) < S[c.idx].pl + 1 && c.y - S[c.idx].y < 0.2, `at 20 km/h the car must come down from the wall (from ${h0} m to ${c.y - S[c.idx].y} m, gap ${c.d} m)`);
  // the big west wall is driven flat out: a driver aiming for two thirds of the wall climbs it to over 3 m, touches nothing, loses no more speed there than in the hairpin, and completes the lap within 1.5 s of the autopilot's clean lap (which stays on the flat). On Grand Vacarme the wall is the longest path: it is no faster than the tunnel string
  const wrap = a => Math.atan2(Math.sin(a), Math.cos(a)), wallP = c => { const a = autopilot(c, T), sp = v(c), la = S[(c.idx + 3 + Math.floor(sp * 0.1)) % n]; if (!la.rc || la.w < la.pl + 11 || !S[(c.idx + 90) % n].rc) return a; // (it comes back down 180 m before the end of the wall: any later, it exits too wide and hits the straight's wall)
    const off = -(la.pl + (la.w - 1.1 - la.pl) * 0.7) * Math.sign(la.k || 1), e = wrap(Math.atan2(la.z + la.tx * off - c.z, la.x - la.tz * off - c.x) - c.th); return I(Math.max(-1, Math.min(1, e * 3)), 1); };
  const lapRun = drive => { const c = newCar(T); let t = 0, t1 = 0, h = 0, vmin = 1e9, ymax = 0, flights = 0; while (c.dist < 2 * n && t < 300) { const a = c.air; step(c, drive(c), T, H); t += H; if (!t1 && c.dist >= n) t1 = t;
    if (t1) { if (c.hit > 3) h++; if (c.air && !a) flights++; if (S[c.idx].rc && !c.air) { vmin = Math.min(vmin, v(c)); ymax = Math.max(ymax, c.y - S[c.idx].y); } } } return { t: t - t1, h, vmin, ymax, flights }; };
  const clean = lapRun(c => autopilot(c, T)), byWall = lapRun(wallP);
  assert(clean.flights === MAP_DEF.jumps.length && !clean.h && clean.ymax < 0.5, `clean lap: ${clean.flights} flights (one per ramp), ${clean.h} chocs, ${clean.ymax} m on the wall`);
  assert(!byWall.h && byWall.ymax > 3 && byWall.t < clean.t + 1.5 && byWall.vmin > 0.98 * clean.vmin, `the wall must be driven flat out without impact: ${byWall.t} s contre ${clean.t} s, ${byWall.h} chocs, ${byWall.ymax} m de haut, mini ${byWall.vmin} contre ${clean.vmin} m/s`);
  // height has a cost (sim.js, CLIMB): the top of the wall is not the winning choice, it costs at least half a second per lap
  assert(byWall.t > clean.t + 0.5, `driving at the top of the wall must cost time: ${byWall.t} s contre ${clean.t} s`);
  // no impact between two cars at different heights: one flies over the other
  const crosses = dy => { const R = newRace(T), [a, b] = R.cars; R.cars.length = 2; for (const [c, i, sp] of [[a, 300, 40], [b, 303, 0]]) Object.assign(c, pose(i, 0, sp), { lvl: 1, pos: 1, lap: 1, ending: 0, bump: 0 });
    a.y += dy; a.air = dy > 0; a.airT = dy > 0 ? H : 0; let bump = 0; for (let i = 0; i < 0.25 / H; i++) { stepRace(R, I(0, 0), H); bump = Math.max(bump, a.bump); } return bump; };
  assert(crosses(0) > 10 && crosses(3) === 0, `choc entre voitures : ${crosses(0)} at the same height, ${crosses(3)} with a 3 m gap`);
  console.log(`OK  terrain (stade): jumps at 108 / 162 / 216 km/h = ${s30.d.toFixed(0)} / ${s45.d.toFixed(0)} / ${s60.d.toFixed(0)} m (${s60.t.toFixed(2)} s, ${s60.hmax.toFixed(1)} m de haut, impact ${s60.land.toFixed(1)} m/s), fosse franchie en ${ok.t.toFixed(1)} s, missed in ${rate.t.toFixed(1)} s; banked bend: clean ${clean.t.toFixed(2)} s (mini ${(clean.vmin * 3.6) | 0} km/h), via the wall ${byWall.t.toFixed(2)} s (mini ${(byWall.vmin * 3.6) | 0} km/h, ${byWall.ymax.toFixed(1)} m de haut)`);
}
console.log(`OK  course : IA seules ${laps.map(l => l.toFixed(2)).join(' / ')} s per lap (levels ${AI_LVL.join(' / ')}), overtake in ${tpass.toFixed(1)} s, 3 laps with 4 bots: ${arr.map(c => R0(c) + ' ' + c.ending.toFixed(2)).join(', ')} (${walls} chocs mur, ${bumps} car impacts)`);
console.log(`OK  elimination: ${elimTxt}`);
console.log(`OK  glisse : ${skiddingTxt}`);
console.log(`OK  deux humains : ${duoTxt}`);
console.log(`OK  medal ghost: ${ghostTxt}`);

// ---------- corner alert (alertCorner): rare on an autopilot lap, silent when stopped, on the right side ----------
{ let n = 0, w = 0, t = 0; const c = newCar(T);
  while (c.dist < T.n && t < 180) { step(c, autopilot(c, T), T, H); t += H; const a = alertCorner(T, c.idx, Math.hypot(c.vx, c.vz)); if (a && !w) n++; w = a; }
  assert(n >= 1 && n <= 3, `alerte de virage : ${n} alerts on a city lap (expected 1 to 3)`);
  assert(alertCorner(T, 0, 0) === 0, "corner alert when stopped");
  const i = T.S.reduce((b, s, j) => Math.abs(s.k) > Math.abs(T.S[b].k) ? j : b, 0), a = alertCorner(T, (i - 80 + T.n) % T.n, 80); // at 288 km/h, 160 m before the tightest bend (43 m/s)
  assert(Math.sign(a) === Math.sign(T.S[i].k) && Math.abs(a) <= 160, "corner alert: on the side of the tightest bend, at most 160 m ahead");
  // the distance counts down on approach, 2 m per sample, until the entry (under 10 m), then goes silent once inside
  let p = Math.abs(a), j = (i - 80 + T.n) % T.n;
  for (let d; (d = alertCorner(T, j = (j + 1) % T.n, 80)); p = Math.abs(d)) assert(Math.sign(d) === Math.sign(a) && Math.abs(d) === p - 2, `alerte de virage : ${Math.abs(d)} m after ${p} m`);
  assert(p <= 10, `corner alert: silent from ${p} m from the bend`);
  console.log(`OK  alerte de virage : ${n} on a city lap; at 288 km/h, countdown from ${Math.abs(a)} m to ${p} m`); }

// ---------- English interface translation (language.js): ordinals, whole expressions, never in the middle of a word ----------
{
  require('../src/engine/lang.js'); const tr = s => translated(s, 'en');
  for (const [fr, en] of [['3E SUR 4', '3RD OF 4'], ['ARRIVEE : 1ER', 'FINISH: 1ST'], ['FANTÔME : OR', 'GHOST: GOLD'], ['RECORD 1\'00"00', 'RECORD 1\'00"00'], ['GRAND PRIX FM', 'GRAND PRIX FM'], ['4,2 KM   TRAFIC', '4.2 KM   TRAFFIC']])
    assert.strictEqual(tr(fr), en, 'traduction de « ' + fr + ' »');
  console.log('OK  traduction anglaise');
}

// ---------- online (network.js): the state of a race passes from one station to another, interpolated; a guest input is bounded ----------
{
  require('../src/engine/network.js');
  const A = newRace(T, 3, AI_LVL.slice(0, 2), 0, { humans: 2 }), B = newRace(T, 3, AI_LVL.slice(0, 2), 0, { humans: 2 }), snaps = [];
  for (let i = 0; i < 240; i++) { stepRace(A, [I(0, 1), null], H); if (i % 6 === 5) snaps.push(JSON.parse(JSON.stringify(NET.wraps(A)))); } // 20 states per second, as on the network
  A.cars[0].k = 3; NET.pose(B, snaps, snaps[snaps.length - 1].rt); // at the last state: the exact copy (except local fields)
  B.cars.forEach((c, i) => { for (const k of ['x', 'z', 'th', 'vf', 'rpm', 'gear', 'dist', 'pos']) assert(Math.abs(c[k] - A.cars[i][k]) < 1e-9, 'network state: ' + k); });
  assert(B.cars[0].k === undefined, 'the livery stays local');
  const [s0, s1] = snaps.slice(-2); NET.pose(B, snaps, (s0.rt + s1.rt) / 2); // halfway: the average of the two positions
  assert(Math.abs(B.cars[1].x - (s0.cars[1].x + s1.cars[1].x) / 2) < 1e-9 && Math.abs(B.t - (s0.rt + s1.rt) / 2) < 1e-9, 'interpolation');
  assert.deepStrictEqual(NET.clean({ steer: 9, gas: -1, brake: 'x', hand: 1, nitro: 0, cheat: 1 }), { steer: 1, gas: 0, brake: 0, hand: true, nitro: false });
  assert(NET.clean('x') === null && NET.clean(null) === null, 'invalid input: the autopilot');
  console.log('OK  online: state packed, set, interpolated; input bounded');
}

// ---------- drying line (MO): in a race, the cars' line dries, the edge stays wet; same race, same wetness; grip between the wet road and surfDry ----------
{
  const raceCase = () => { const R = newRace(T); while (R.t < 60) stepRace(R, null, H); return R; }, R = raceCase(), mo = R.mo, nbr = MO.nbr;
  let line = 0, edgePt = 0; for (let i = 0; i < n; i++) if (!(i >= T.t0 && i <= T.t1)) { let a = 1; for (let j = 0; j < nbr; j++) a = Math.min(a, mo[i * nbr + j]); line += a; edgePt += Math.max(mo[i * nbr], mo[i * nbr + nbr - 1]); }
  const k = n - (T.t1 - T.t0 + 1); line /= k; edgePt /= k;
  assert(line < 0.6 && edgePt > 0.9, `city: the line must dry (${line.toFixed(2)}), not the edge (${edgePt.toFixed(2)})`);
  assert(raceCase().mo.every((v, i) => v === mo[i]), 'the wetness must be the same from one race to another (deterministic)');
  const s = T.surf[100], q = T.surfDry[100];
  assert(q.corner < s.corner && q.corner > 0 && newCar(T).mo === undefined, 'on the dry line, less slippery but not dry; outside a race, no wetness');
  console.log(`OK  drying line: city, after 60 s of racing, line ${line.toFixed(2)}, bord ${edgePt.toFixed(2)} ; virage perdu ${s.corner.toFixed(3)} wet, ${q.corner.toFixed(3)} on the line`);
}

// car wear (docs/PHYSICS.md): scraping breaks nothing; a zone takes at most 0.4 per lap and never more than 0.7 outside CASSE mode; in CASSE, up to the wreck
{
  const Z = [0, 0, 0, 0], Z0 = [0, 0, 0, 0];
  assert.strictEqual(wear(Z, Z0, 1, 0, 5.9), 0, 'under 6 m/s against a wall, nothing');
  assert(wear([0, 0, 0, 0], Z0, 0, 1, 5, 'vehicle') > 0, 'between cars, the threshold is lower (4 m/s)');
  for (let i = 0; i < 30; i++) wear(Z, Z0, 1, 0, 30);
  assert(Math.abs(Z[0] - 0.4) < 1e-9 && Z[1] === 0 && Z[2] === 0, 'one lap: 0.4 at most, on the touched zone only: ' + Z);
  Z0[0] = Z[0]; for (let i = 0; i < 30; i++) wear(Z, Z0, 1, 0, 30);
  assert(Math.abs(Z[0] - 0.7) < 1e-9, 'jamais plus de 0,7 hors CASSE : ' + Z[0]);
  const W = [0, 0, 0, 0]; for (let i = 0; i < 30; i++) wear(W, [0, 0, 0, 0], 0.7, 0.7, 30, 'intoWall', true);
  assert(W[0] > 0.95 && W[3] > 0.95, "in CASSE, a hammered corner goes all the way to the wreck: " + W);
  const a = [0, 0, 0, 0], b = [0, 0, 0, 0]; wear(a, Z0, 1, 0, 14); wear(b, Z0, 1, 0, 20);
  assert(b[0] > a[0] * 2.5, 'quadratic wear: 20 m/s damages much more than 14 m/s');
  console.log(`OK  usure : 14 m/s → ${a[0].toFixed(3)}, 20 m/s → ${b[0].toFixed(3)}; caps 0.4 per lap and 0.7`);
}

// CASSE mode (docs/PHYSICS.md): damage affects driving, deterministically; an ordinary race knows nothing of it
{
  const raceCase = broken => { const R = newRace(T, 3, AI_LVL, 0, { broken }); let t = 0; while (!R.done && t < 400) { const c = R.cars[0]; stepRace(R, { ...autopilot(c, T, 1.05, R.cars), gas: 1, brake: 0 }, H); t += H; } return R; };
  const A = raceCase(true), B = raceCase(true), O = raceCase(false), j = A.cars[0];
  assert(O.cars.every(c => !c.ca), 'an ordinary race carries no breakage state');
  assert(JSON.stringify(A.cars.map(c => [c.ca.z, c.ca.pops, c.ca.td, c.ca.dead])) === JSON.stringify(B.cars.map(c => [c.ca.z, c.ca.pops, c.ca.td, c.ca.dead])) && A.t === B.t, 'CASSE: two identical races give the same damage (network)');
  assert(Math.max(...j.ca.z) > 0.7, 'CASSE: without a cap, the brute ends up badly damaged: ' + j.ca.z);
  assert(j.ca.p < 1 && j.ca.grip < 1 && j.ca.dir !== 0, 'CASSE: engine, grip and steering affected: ' + [j.ca.p, j.ca.grip, j.ca.dir]);
  { const c = newCar(T), d = newCar(T); c.ca = { ...brokenFresh(), p: 0.65, vf: 0.9, grip: 1, dir: 0 }; for (let i = 0; i < 6 / H; i++) { step(c, { steer: 0, gas: 1, brake: 0, hand: false }, T, H); step(d, { steer: 0, gas: 1, brake: 0, hand: false }, T, H); }
    assert(c.vf < d.vf * 0.92, 'CASSE: an engine at 65% accelerates less: ' + c.vf.toFixed(1) + ' contre ' + d.vf.toFixed(1)); }
  console.log(`OK  casse : bourrin ${j.ca.z.map(v => v.toFixed(2)).join('/')}, ${j.ca.pops.reduce((a, b) => a + b, 0)} flat tyre(s), finished in ${(j.ending || j.out).toFixed(0)} s contre ${O.cars[0].ending.toFixed(0)} s without breakage; ${A.td.length} takedown(s)`);
}
