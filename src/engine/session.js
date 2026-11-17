// Flow of a game, without rendering, sound or input: start, end of race, points, records, medals, ghost choice, Championship rounds. Loaded by the game after sim.js, and by `node test-session.js`.
// game.js draws, plays the sound and reads the devices; it calls the session and reacts to what it returns.
//   ses = freshSession({ T, mapDef, mapDefs, store, prefs, auto, challenge, ref, med })
//     store: records of the map, { get(k), set(k, v) } as JSON (the game: localStorage under the map's prefix); prefs: keys common to all maps, { get(k, d), set(k, v) } as text
//     ref = lapRef(T) (time and trace of the medals' reference lap); med = [bronze, silver, gold] as multiples of ref.t; challenge = the lap received by link (challengeRead), otherwise null; auto: the autopilot drives, nothing is recorded
//   ses.start({ mode, diff, nj, ia, duel, tours }) creates the race (returned, or null in time trial and in Glisse alone). ia: mode against the BOTS; duel: Glisse for two; nj: number of humans.
//   ses.stepSec(car, dt) after each physics step in a race, as long as !ses.raceEnd: returns the step's events (reused object):
//     arrived = humans arrived at this step (indices), lapRun = result of the completed lap in time attack, ghostRun = the ghost has just reached the next medal, drift = the two Drift laps completed, ending = the race is over for the game
//   ses.saves(car, y) in time attack each frame: ghost trace and sectors; returns the sector crossed, otherwise null.
//   ses.enclosed() closes the Championship round (only once); ses.toMenu() closes the round and resets everything to zero.
//   To read: race, raceEnd, tRace (lap timer, or final time in a race), lapN, best, bestG, glEnd, tnEnd, ghostIdx, lastIdx ; medal(t), traceF(), chooseF(f), tn(diff), tnOu(diff), trophy(diff), GLT.
(function (G) {
  if (!G.newRace) require('./sim.js');
  const H = 1 / 120; // sim.js is replayed at each map change: its functions are re-read into G at each call
  function freshSession({ T, mapDef: M, mapDefs: MAPS, store, prefs, auto: AUTO = false, challenge: CHALLENGE_DEF = null, ref, med: MED }) {
    const N = T.n, REF = ref.t, GLT = 2 * REF * MED[0] * 1.3; // Drift: the score only counts if both laps are completed in under GLT (two laps at bronze time, plus 30 %)
    const smoothNoise = (k, d) => { try { return JSON.parse(prefs.get(k, null)) || d; } catch (e) { return d; } }, TNK = 'vpr8.tournee' + (AUTO ? '.auto' : '');
    const tns = () => [].concat(smoothNoise(TNK, [])), trophies = () => [].concat(smoothNoise('vpr7.trophee', [])); // reread each time: a map built in advance has had its session for a long time, and a frozen copy would send it back to a round already run
    const medal = t => t ? MED.filter(k => t <= REF * k).length : 0; // 0 aucune, 1 bronze, 2 argent, 3 or
    let bestSpl = store.get('splits'), ghost = store.get('ghost'), si = 0, cur = [], recG = [], finished = []; const medF = [];
    const S = { race: null, raceEnd: false, tRace: 0, lapN: 1, best: store.get('best') || 0, bestG: store.get('glisse') || 0, glEnd: null, tnEnd: null, lastIdx: null, mode: 'solo', diff: 0, GLT, medal };
    S.ghostIdx = CHALLENGE_DEF ? 5 : medal(S.best) < 3 ? medal(S.best) + 2 : 1; // the first medal not yet won, otherwise the record
    S.chooseF = f => { S.ghostIdx = f; };
    // Bronze and silver: the reference lap's trace slowed to the medal's ratio. Gold: the map's trace in traces-gold.js, brought back to the gold threshold time.
    S.traceF = () => { const f = S.ghostIdx, i = f - 2; if (f < 2) return f ? ghost : null; if (f === 5) return CHALLENGE_DEF.trace; if (medF[i]) return medF[i];
      const gold = i === 2 ? G.challengeRead((G.TRACES_GOLD || {})[M.id]) : { err: 1 }; return medF[i] = gold.err ? G.stretch(ref.trace, MED[i]) : G.stretch(gold.trace, REF * MED[2] / gold.t); };
    // Championship: one in progress per difficulty (vpr8.tourAll from the night's order, { handle, pts }), trophy per difficulty (vpr7.trophy, best final place from 1 to 3)
    S.trophy = d => { const r = trophies()[d]; return r >= 1 && r <= 3 ? r : 0; };
    S.tn = d => { const t = tns()[d]; return t && MAPS[t.handle] && Array.isArray(t.pts) && t.pts.length === 4 && t.pts.every(Number.isFinite) ? t : null; }; // a damaged save, or one with a longer list of maps, is ignored
    S.tnOu = d => S.tn(d) || { handle: 0, pts: [0, 0, 0, 0] };
    S.enclosed = () => { // end of round, as soon as the player leaves the finish board: the cars still on track finish all at once (their order could still change), then points, overall ranking and save
      const R = S.race, d = S.diff; if (S.tnEnd || S.mode !== 'tourAll' || !S.raceEnd || !R) return;
      while (!R.done && R.t < 3600) G.stepRace(R, null, H);
      const t = S.tnOu(d), r = G.tourAll(t.pts, G.raceOrder(R).map(c => R.cars.indexOf(c))), ending = !MAPS[t.handle + 1], tier = r.ranking.indexOf(0) + 1;
      S.tnEnd = { ...r, before: t.pts, handle: t.handle, finished: ending, tier };
      const TNS = tns(); TNS[d] = ending ? null : { handle: t.handle + 1, pts: r.pts }; prefs.set(TNK, JSON.stringify(TNS));
      if (ending && tier <= 3 && !AUTO && !(S.trophy(d) && S.trophy(d) <= tier)) { const TR = trophies(); TR[d] = tier; prefs.set('vpr7.trophee', JSON.stringify(TR)); } // the autopilot does not win a trophy
    };
    S.start = ({ mode, diff, nj = 1, ia = false, duel = false, lapCount = 3 }) => { // laps: per round of Tournée (the other modes keep 3)
      S.mode = mode; S.diff = diff; S.tnEnd = null;
      S.race = duel ? G.newRace(T, 2, [], 0, { humans: nj, timedOut: GLT }) // two-player Drift: the two players alone on track, the solo time limit for each
        : ia ? G.newRace(T, mode === 'tourAll' ? lapCount : 3, G.AI_LVL.slice(0, 4 - nj).map(l => l * G.DIFF[diff].k), G.DIFF[diff].el, { elim: mode === 'elim', broken: mode === 'broken', grid: mode === 'tourAll' && G.tourAll(S.tnOu(diff).pts).grid, humans: nj }) : null; // two players: always four cars
      S.raceEnd = false; S.glEnd = null; finished = []; si = 0; cur = []; recG = []; S.tRace = 0; S.lapN = 1;
      return S.race;
    };
    S.toMenu = () => { S.enclosed(); S.tnEnd = null; S.race = null; S.raceEnd = false; S.glEnd = null; S.tRace = 0; S.lapN = 1; };
    S.saves = (car, y) => { // time attack: the lap trace at 20 Hz (the record ghost) and the two sectors
      while (recG.length / 4 <= S.tRace * 20) recG.push(+car.x.toFixed(2), +y.toFixed(2), +car.z.toFixed(2), +car.th.toFixed(3));
      if (si < 2 && car.dist >= T.sp[si]) { const i = si++; cur[i] = S.tRace; return { i, t: S.tRace, d: bestSpl ? S.tRace - bestSpl[i] : null }; }
      return null;
    };
    const ev = { arrived: [], lapRun: null, ghostRun: false, glisse: false, ending: false };
    S.stepSec = (car, dt) => {
      ev.arrived.length = 0; ev.lapRun = null; ev.ghostRun = ev.glisse = ev.ending = false;
      S.tRace += dt; const R = S.race;
      if (R) { let allRes = true; // each human has its own end (elimination: leaving the track means finishing); the race is only over for the game when all of them are
        for (let i = 0; i < R.h; i++) { const c = R.cars[i]; if (!finished[i] && (c.ending || c.out || R.timedOut && R.t > R.timedOut)) { finished[i] = true; if (!c.ending) c.pts = 0; c.manual = false; ev.arrived.push(i); } allRes = allRes && finished[i]; } // two-player Drift: once the time limit has passed, a player still on track has finished, score zero (otherwise a stopped car would hold the other player up forever)
        if (allRes) { S.raceEnd = ev.ending = true; S.tRace = R.cars[0].ending || R.cars[0].out; } }
      else if (S.mode === 'glisse') { if (car.dist >= 2 * N) endSkidding(car); }
      else if (car.dist >= N) ev.lapRun = endLap(car);
      return ev;
    };
    function endSkidding(car) {
      const score = Math.round(car.score), valid = S.tRace <= GLT, rec = valid && score > S.bestG; S.glEnd = { score, valid, rec }; S.raceEnd = ev.glisse = ev.ending = true; car.manual = false;
      if (rec && !AUTO) { S.bestG = score; store.set('glisse', score); }
    }
    function endLap(car) { // lap completed: we record it, and the timer restarts straight away for a new lap
      const t = S.tRace, b = S.best, rec = !b || t < b, res = { rec, first: !b, diff: b ? t - b : 0, t, n: S.lapN, challenge: CHALLENGE_DEF && t - CHALLENGE_DEF.t }; S.lastIdx = { t, trace: recG };
      if (rec && AUTO) S.best = t; else if (rec) { // the autopilot (?auto) records nothing
        S.best = t; bestSpl = cur; ghost = recG; store.set('best', t); store.set('splits', cur); store.set('ghost', ghost); }
      const f = S.ghostIdx; if (f > 1 && f < 5 && t <= REF * MED[f - 2]) { S.chooseF(f < 4 ? f + 1 : 1); ev.ghostRun = true; } // targeted medal beaten: switch to the ghost of the next one
      S.lapN++; car.dist -= N; S.tRace = 0; si = 0; cur = []; recG = [];
      return res;
    }
    return S;
  }
  G.freshSession = freshSession;
})(typeof window !== 'undefined' ? window : globalThis);
