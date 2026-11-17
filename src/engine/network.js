// Online multiplayer: peer-to-peer WebRTC via PeerJS (peerjs.min.js, signalling by PeerJS's free public server; no server of our own).
// A host runs stepRace for everyone; each guest sends its input and receives the state of the cars, which it displays 100 ms late by interpolating.
// API for game.js (no rendering here):
//   NET.hosting(ev) -> lounge code (4 letters) ; NET.joinLounge(code, ev). ev(m) receives the messages: { t: 'salon', n } (number of players, host included),
//     { t: 'moi', i } (guest: its place, 1..3; the host is 0), { t: 'go', mapDef, n } (the host launches), { t: 'erreur', msg }, { t: 'parti', i } (a player left), { t: 'stop' } (the host went back to the menu).
//   NET.go(mapDef)          host: starts the race for everyone (then each one: newRace(T, 3, lvls, el, { humans: n }), the same for all).
//   NET.entering(inp)        guest: each frame, its driving input. On the host side, NET.ins[i] = last input of guest i (null while nothing has arrived: the autopilot drives it).
//   NET.diffuse(R)         host: the race state (called each frame, sent 20 times per second).
//   NET.applySetting(R)        guest: each frame, in place of stepRace; sets the interpolated state on R.
//   NET.stop()             host: stops the race for everyone (back to the menu).
//   NET.closeBrowser()           leaves the lounge.
//   Guest: R.glob = the cars in the host's order, if game.js has reordered R.cars (its car at the front).
// The ?room=ABCD link opens the lounge directly (see game.js).
(function (G) {
  const PRE = 'vpr-salon-', MAXJ = 4, DT_SEND = 0.05, DELAY = 0.1;
  const NET = { role: null, code: '', n: 1, self: 0, ins: [], peer: null, cx: [], ev: null, snaps: [], tEnv: 0 };
  const letters = () => Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.random() * 24 | 0]).join(''); // no I or O: they are confused with 1 and 0
  const says = m => NET.ev && NET.ev(m);
  const allRes = m => NET.cx.forEach(c => c && c.open && c.send(m));
  // peerjs.min.js: loaded at the first lounge, not at game start (GitHub Pages: 26 ko and its evaluation skipped for anyone playing alone)
  let pjs = null;
  const withPeer = f => { const e = NET.attempt; return (pjs || (pjs = new Promise((ok, reject) => { const s = document.createElement('script'); s.src = 'vendor/peerjs.min.js'; s.onload = ok; s.onerror = reject; document.head.appendChild(s); })))
    .then(() => NET.attempt === e && f(), () => { pjs = null; if (NET.attempt === e) says({ t: 'errorMsg', msg: 'RESEAU INDISPONIBLE' }); }); }; // e: the lounge may have been left during the download
  const lounge = () => { NET.n = 1 + NET.cx.filter(Boolean).length; allRes({ t: 'lounge', n: NET.n }); says({ t: 'lounge', n: NET.n }); };

  // input received from a guest: validated field by field (we never put network data onto the race without bounding it)
  const num = (v, a, b) => typeof v === 'number' && isFinite(v) ? Math.min(b, Math.max(a, v)) : 0;
  const clean = m => m && typeof m === 'object' ? { steer: num(m.steer, -1, 1), gas: num(m.gas, 0, 1), brake: num(m.brake, 0, 1), hand: !!m.hand, nitro: !!m.nitro } : null;

  function hosting(ev, attempt = 0) {
    closeBrowser(); NET.ev = ev; NET.role = 'hostRole'; NET.self = 0; NET.code = letters();
    withPeer(() => { const p = NET.peer = new Peer(PRE + NET.code);
    p.on('error', e => e.type === 'unavailable-id' && attempt < 5 ? hosting(ev, attempt + 1) : says({ t: 'errorMsg', msg: String(e.type || e) })); // code already taken: another one
    p.on('connection', c => {
      const i = [1, 2, 3].find(k => !NET.cx[k]);
      c.on('open', () => {
        if (!i || NET.isRaceMode) { c.send({ t: 'errorMsg', msg: i ? 'COURSE EN COURS' : 'SALON PLEIN' }); setTimeout(() => c.close(), 500); return; }
        NET.cx[i] = c; c.send({ t: 'self', i }); lounge();
      });
      c.on('data', m => { if (i && NET.cx[i] === c && m && m.t === 'in') NET.ins[i] = clean(m.i); });
      c.on('close', () => { if (NET.cx[i] === c) { NET.cx[i] = null; NET.ins[i] = null; lounge(); says({ t: 'started', i }); } });
    }); });
    return NET.code;
  }

  function joinLounge(code, ev) {
    closeBrowser(); NET.ev = ev; NET.role = 'guest'; NET.code = String(code).toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
    withPeer(() => { const p = NET.peer = new Peer();
    p.on('error', e => says({ t: 'errorMsg', msg: e.type === 'peer-unavailable' ? 'SALON INTROUVABLE' : String(e.type || e) }));
    p.on('open', () => {
      const c = NET.cx[0] = p.connect(PRE + NET.code, { reliable: true }); // reliable: the "go" must not get lost (shortcut: the states are also resent; switch to a second unreliable channel if it judders)
      c.on('data', m => {
        if (!m || typeof m !== 'object') return;
        if (m.t === 'curState') { NET.snaps.push(m); if (NET.snaps.length > 30) NET.snaps.shift(); return; }
        if (m.t === 'self') NET.self = m.i; if (m.t === 'lounge' || m.t === 'go') NET.n = m.n; if (m.t === 'go') NET.snaps.length = 0;
        says(m);
      });
      c.on('close', () => { if (NET.role === 'guest') says({ t: 'errorMsg', msg: 'HOTE PARTI' }); });
    }); });
  }

  function closeBrowser() { NET.attempt = (NET.attempt || 0) + 1; NET.role = null; NET.cx.forEach(c => c && c.close()); NET.cx = []; NET.ins = []; NET.snaps = []; NET.n = 1; NET.isRaceMode = false; if (NET.peer) NET.peer.destroy(); NET.peer = null; }
  function go(mapDef) { NET.isRaceMode = true; NET.ins = []; allRes({ t: 'go', mapDef, n: NET.n }); }
  function stop() { NET.isRaceMode = false; allRes({ t: 'stop' }); } // the host returns to the menu: the race stops for everyone, the lounge stays (and reopens for late arrivals)
  let tIn = 0;
  function entering(inp) { const c = NET.cx[0], t = performance.now(); if (c && c.open && t - tIn > 15) { tIn = t; c.send({ t: 'in', i: inp }); } } // ~60 per second at most

  // ---------- car state: pure functions, tested by node test.js ----------
  // every number or boolean field of the car is sent, except those that game.js sets itself on each car (livery, displayed laps, manual gearbox)
  const LOCAL = new Set(['k', 'rl', 'rlT', 'bl', 'manual']);
  const wraps = R => ({ t: 'curState', rt: R.t, done: R.done, cars: R.cars.map(c => { const o = {}; for (const k in c) if (!LOCAL.has(k) && (typeof c[k] === 'number' || typeof c[k] === 'boolean')) o[k] = c[k]; return o; }) });
  const ang = (a, b, u) => a + (((b - a) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI) * u; // by the shortest path
  // sets on R the state at time t of the race, interpolated between the two states surrounding it (beyond the last one: the last one, without extrapolating)
  function pose(R, snaps, t) {
    if (!snaps.length) return;
    let b = snaps.findIndex(s => s.rt >= t); if (b < 0) b = snaps.length - 1;
    const B = snaps[b], A = snaps[Math.max(0, b - 1)], u = B.rt > A.rt ? Math.min(1, Math.max(0, (t - A.rt) / (B.rt - A.rt))) : 1;
    R.t = A.rt + (B.rt - A.rt) * u; R.done = B.done;
    B.cars.forEach((s, i) => { const c = (R.glob || R.cars)[i], a = A.cars[i] || s; if (!c) return; Object.assign(c, s);
      for (const k of ['x', 'y', 'z', 'vx', 'vz', 'dist']) c[k] = a[k] + (s[k] - a[k]) * u; c.th = ang(a.th, s.th, u); });
  }

  function diffuse(R) { const t = performance.now() / 1000; if (t - NET.tEnv < DT_SEND) return; NET.tEnv = t; allRes(wraps(R)); }
  // the guest's clock follows the last received state, DELAY behind: it almost always has two states to interpolate
  function applySetting(R) { const s = NET.snaps; if (s.length) pose(R, s, s[s.length - 1].rt - DELAY); }

  Object.assign(NET, { hosting, joinLounge, closeBrowser, go, stop, entering, diffuse, applySetting, wraps, pose, clean, MAXJ });
  G.NET = NET;
})(typeof window !== 'undefined' ? window : globalThis);
