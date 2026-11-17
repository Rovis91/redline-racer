// node test-session.js — the course of a game (session.js) without a browser: completed lap and record, Glisse, two humans at the finish, a Tour round.
// Records and preferences go through plain objects in place of localStorage.
const assert = require('assert'), THREE = require('../vendor/three/three.module.js');
require('../src/engine/sim.js'); require('../src/engine/session.js');
const M = MAP_DEF, T = buildTrack(THREE, M), N = T.n, H = 1 / 120, REFT = lapRef(T, H), MED = M.med || [1.1, 1.03, 0.97];
const memStore = () => { const o = {}; return { o, get: k => k in o ? JSON.parse(o[k]) : null, set: (k, v) => { o[k] = JSON.stringify(v); } }; };
const settings = () => { const o = {}; return { o, get: (k, d) => k in o ? o[k] : d, set: (k, v) => { o[k] = String(v); } }; };
const session = (store = memStore(), prefs = settings(), auto = false) => freshSession({ T, mapDef: M, mapDefs: MAPS, store, prefs, auto, challenge: null, ref: REFT, med: MED });

// ---------- time trial: completed lap, record, sectors, medal ghost ----------
{
  const store = memStore(), S = session(store);
  assert(S.start({ mode: 'solo', diff: 1 }) === null && S.best === 0 && S.ghostIdx === 2, 'time trial: no race, no record, bronze ghost at the start');
  const car = newCar(T);
  let ev = S.stepSec(car, H); assert(!ev.lapRun && !S.raceEnd && S.tRace === H);
  car.dist = T.sp[0]; let sp = S.saves(car, 0); assert(sp && sp.i === 0 && sp.d === null, 'first sector, with no record to compare');
  assert(S.saves(car, 0) === null, 'a sector is only crossed once');
  car.dist = N; ev = S.stepSec(car, REFT.t * 1.05 - H); // lap at 105% of the reference: bronze, not silver
  assert(ev.lapRun && ev.lapRun.rec && ev.lapRun.first && ev.lapRun.n === 1 && Math.abs(ev.lapRun.t - REFT.t * 1.05) < 1e-9, 'first lap: record');
  assert(ev.ghostRun && S.ghostIdx === 3 , 'bronze beaten: the ghost moves up to silver');
  assert(store.get('best') === S.best && store.get('splits')[0] === H && store.get('ghost').length > 0, 'record, sectors and ghost saved');
  assert(S.lapN === 2 && S.tRace === 0 && car.dist === 0 && S.lastIdx.t === S.best, 'the timer restarts for a lap started');
  car.dist = T.sp[0]; sp = S.saves(car, 0); assert(Math.abs(sp.d + H) < 1e-9, 'sector compared to the record'); // here at time 0, the record was at H
  car.dist = N; ev = S.stepSec(car, REFT.t * 1.2);
  assert(!ev.lapRun.rec && Math.abs(ev.lapRun.diff - REFT.t * 0.15) < 1e-9 && !ev.ghostRun && S.ghostIdx === 3 && S.lapN === 3, 'slower lap: no record and no ghost change');
  const R = session(store); assert(R.best === S.best && R.ghostIdx === 3 && R.traceF().length > 0, 'the next map reloads record and ghost');
  R.chooseF(1); assert.deepStrictEqual(R.traceF(), store.get('ghost'), 'record ghost');
  const A = session(memStore(), settings(), true); A.start({ mode: 'solo', diff: 1 }); const ca = newCar(T); ca.dist = N; A.stepSec(ca, 40);
  assert(A.best === 40 && A.ghostIdx === 2, 'autopilot: record in memory, nothing saved and no ghost changed');
}

// ---------- Skid solo: two laps, score counted within the time limit ----------
{
  const store = memStore(), S = session(store), car = newCar(T);
  S.start({ mode: 'glisse', diff: 1 }); car.score = 1234.4; car.manual = true; car.dist = 2 * N;
  let ev = S.stepSec(car, S.GLT - 1); assert(ev.glisse && ev.ending && S.raceEnd && S.glEnd.valid && S.glEnd.rec && S.glEnd.score === 1234 && store.get('glisse') === 1234 && !car.manual, 'Skid: record within the time limit');
  S.start({ mode: 'glisse', diff: 1 }); car.score = 5000; ev = S.stepSec(car, S.GLT + 1);
  assert(ev.glisse && !S.glEnd.valid && !S.glEnd.rec && S.bestG === 1234, 'Skid: over the time limit, the score does not count');
}

// ---------- two humans: each has their own end, the race ends when both have finished ----------
{
  const S = session(), R = S.start({ mode: 'raceCase', diff: 1, nj: 2, ia: true });
  assert(R && R.h === 2 && R.cars.length === 4, 'two players: two humans and two rivals');
  for (const c of R.cars) c.manual = true;
  R.cars[1].ending = 50; R.cars[1].pos = 1; let ev = S.stepSec(R.cars[0], H);
  assert.deepStrictEqual(ev.arrived, [1]); assert(!ev.ending && !S.raceEnd && !R.cars[1].manual && R.cars[0].manual, 'player 2 arrives, player 1 is still driving');
  ev = S.stepSec(R.cars[0], H); assert(!ev.arrived.length, 'a finish only counts once');
  R.cars[0].ending = 61; ev = S.stepSec(R.cars[0], H);
  assert(ev.arrived[0] === 0 && ev.ending && S.raceEnd && S.tRace === 61, 'both finished: race over, at the time of player 1');
  // Skid duel: time limit passed, a player still on track has finished, score zero
  const D = S.start({ mode: 'glisse', diff: 1, nj: 2, duel: true }); assert(D.timedOut === S.GLT && D.cars.length === 2 && !S.raceEnd, 'duel: solo time limit, new race');
  D.cars[0].ending = 30; D.cars[0].pts = 900; D.cars[1].pts = 700; D.cars[1].score = 700; D.t = S.GLT + 1; ev = S.stepSec(D.cars[0], H);
  assert(ev.ending && D.cars[0].pts === 900 && D.cars[1].pts === 0, 'duel: over the time limit, score zero');
}

// ---------- Tournée: a round closed, the next one on the points grid, the trophy at the last one ----------
{
  const prefs = settings(), S = session(memStore(), prefs);
  assert(S.tn(1) === null && S.tnOu(1).handle === 0 && S.trophy(1) === 0, 'no Tournée in progress');
  const R = S.start({ mode: 'tourAll', diff: 1, ia: true }); assert(R.cars.length === 4 && R.cars[0].pos === 4, 'first round: the player at the back of the grid');
  R.cars[0].ending = 1; S.stepSec(R.cars[0], H); assert(S.raceEnd && !S.tnEnd);
  S.enclosed(); const f = S.tnEnd;
  assert(R.done && f && f.handle === 0 && f.tier === 1 && f.pts[0] === 10 && !f.finished, 'round closed: the others finish, the leading player scores 10');
  assert.deepStrictEqual(JSON.parse(prefs.o['vpr8.tournee'])[1], { handle: 1, pts: f.pts }, 'Tournée saved per difficulty');
  S.enclosed(); assert(S.tnEnd === f, 'a round only counts once');
  const S2 = session(memStore(), prefs); assert(S2.tn(1).handle === 1 && S2.tn(0) === null, 'the next map reloads the Tournée');
  assert.deepStrictEqual(S2.start({ mode: 'tourAll', diff: 1, ia: true }).cars.map(c => c.pos), tourAll(f.pts).grid.map(k => k + 1), 'next round: points grid reversed (the leader last)');
  prefs.o['vpr8.tournee'] = JSON.stringify([null, { handle: MAPS.length - 1, pts: [20, 0, 0, 0] }]);
  const S3 = session(memStore(), prefs), R3 = S3.start({ mode: 'tourAll', diff: 1, ia: true }); R3.cars[0].ending = 1; S3.stepSec(R3.cars[0], H); S3.toMenu();
  assert(S3.tnEnd === null && S3.race === null && !S3.raceEnd, 'back to menu: round closed, then everything reset to zero');
  assert(S3.trophy(1) === 1 && JSON.parse(prefs.o['vpr7.trophee'])[1] === 1 && JSON.parse(prefs.o['vpr8.tournee'])[1] === null, 'last round: gold trophy, Tournée finished');
  const SA = session(memStore(), settings(), true), RA = SA.start({ mode: 'tourAll', diff: 1, ia: true }); RA.cars[0].ending = 1; SA.stepSec(RA.cars[0], H); SA.enclosed();
  assert(SA.tnEnd && SA.trophy(1) === 0, 'autopilot: its own Tournée, no trophy');
}
console.log(`OK  session: time trial (record, sectors, medal ghost), Skid, two humans, Tournée (${MAPS.length} manches)`);
