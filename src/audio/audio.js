// Redline Racer — audio: everything is synthesised (original, adaptive soundtrack). Each map's stations: RADIO in mapDefs.js.
// Interface (window.SOUND): init() on the first gesture · frame(dt, e) every frame · quitGame() / reprendre(m) around a map change in the menu · setStation(i), toggleMusic(), mapDef(M), volume(family, v) ·
// beep(f), radio(syllables, pitch, rate), crash(), stinger(rec), thunder() · music editor: audition, resync(), note(portion, n), backdrop, stepSec, timbres, kits · read by the game: station, name, fq, genre, musicOn, beat, pulse, ana · listening bench and measure:
// init(offline context), pump(), readyMs, live, vol, stations, raceEvent(), roar(v), monitor(gain), vu, and the one-shot sounds clack(), lever(), impact(v), hiss(),
// boost(), backfire() · prises de test : ac, out, smp.
// Chain: timbres (PATCH) → slice of the part → (drums (KIT) | pumped bus → swept filter → bus saturation) → station cut-off →
// station colour (3 bands) → music yes/no → speed and tunnel filter → "mus" family → master → compressor. Adjustable families: mus, mot (engine, gearbox), pneu (tyres), vent (wind), amb (place), pluie (rain), choc (impacts, rubbing, boost), ui (beeps, jingle, radio).
(() => {
  const lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let TR = 0; // transposition of the last lap, in half-tones
  const hz = m => 440 * 2 ** ((m + TR - 69) / 12), R = -99, OUT = 0.56, CLACK = 0.6, LEV = 1; // R: silence in a theme (see mel() in mapDefs.js)
  let M = MAP_DEF, ST = M.radio, TH = M.th;
  // music editor hooks (editor.html): mute / solo per part, section played in a loop, indicators (until when each part sounds), current section
  const EC = { mute: {}, solo: null, loopSec: null, nowPlaying: {}, sec: '', pause: false }, playNote = (p, t, d = 0.12) => { EC.nowPlaying[p] = t + d; };
  const pv = (st, p) => (EC.solo ? EC.solo === p : !EC.mute[p]) ? (st.mx && st.mx[p] != null ? st.mx[p] : 1) : 0; // level of a part: st.mx, set in the editor
  let AC, live = true, timer, readyMs = Promise.resolve(), ana, master, masterComp, musicG, tuneG, drumG, hatG, musF, duckG, swF, busDry, busDrv, acid, fuzz, kdrv, bsat, dly, dlyFb, eqL, eqM, eqH, mrevG, drumRv, revIn, echoIn, choIn, mbuf, secG, drumF, gritDry, gritWet, hpF, rev, musSend, motorSend, nbuf, outG, vu;
  let t0 = 0, nextT = 0, stp = 0, musicOn = true, lastHit = 0, lastMus = -9, lastN = 0, lastB = 0, menu = true;
  const vol = { mus: 1, motorFam: 1, tire: 1, wind: 1, amb: 1, impact: 1, ui: 1, rainFx: 1 }, V = {}; // volume per family (listening bench) and their nodes
  // musical state driven by the race: mix = hot sector, inten = speed, driftL = skid, drums = drums, fin = last sector
  const MX = { b: 1, d: 1.6, c: 2, g: 2, a: 2, l: 1.6 }; // level of each slice: the mids and highs must not disappear under the bass
  let tens = 0, glisse = false, acquired = false, acqSaid = false, boostPend = false, boostL = false; // skid: tension (0..1), in progress, boost earned, plateau already played, release to play, boost in progress
  let lastRoll = -9, voiceL = null; // voiceL: theme voice, kept to tie the next note // last bar of the rise: the drop follows it
  let djF, djL, fad, entering = false, musIn, mixDry, mixW, dk = null, mixDone = null; // DJ pass (see mix()): low cut, high cut and turntable fade; entering: the incoming turntable does not go to the chorus; mix bus and its compression; dk: the pass in progress; mixDone: the map where it led
  let bigS = false, lastFill = -9, exitAt = -1, grit = 0, curRoot = 33, lap = 1, lapN = -1; let was = {}; // lap: 0 first lap (subdued), 1 normal, 2 last lap (the most intense); // chorus in progress; last restart; parts that were playing at the previous bar
  let W = {}, strip = {}; // custom waves; mix slices per part (b bass, d pad, c g chords, a arpeggio, l theme)
  let mix = 0, inten = 0, driftL = 0, drums = 0, ending = false, wasIn = false, wasNear = false, wasBoost = false;
  let rubT = 0, satT = 0, turntable = 0; // brief friction between cars; saturation of the music after an impact; turntable slowdown (1 → 0)
  const VX = [], UN = [], PANJ = 0.35; // engine + gearbox + tyre voices: VX[0] the solo one (centre, plugged in as always), VX[1] and VX[2] those of the split screen (player 1 on the left, player 2 on the right); UN: single-player list, reused when the game does not pass one
  let scrapeG, windG, windL, windF, nitroG, gbuf, acoustic, AU = [], rainFx, ambBed, ambT = 2, inZone = false, uiF, CH = null, ambZG = [], ambEvG = null, ambPos = 0, ambUnder = 0, ambCall = 0; // CH: the sounds specific to chapada (soundChapada)
  const initialStation = () => ST[0].raceTheme ? 0 : Math.random() * ST.length | 0;
  let station = initialStation(), S16 = 60 / ST[station].bpm / 4;

  // menu music: one calm track for all maps — same tempo, same chords (Dm7 BbM7 C7 A), same bell melody, same lowland.
  // Each map only changes its colour: pad and melody (arp) timbre, melody octave (oct), low-pass (lp), level (v, set per bar).
  // Changing map in the menu no longer reloads the page: mapDef() keeps the song's position and fades in the new colour (quitGame() / reprendre() still serve for reloading).
  const MENU = { bpm: 80, mel: '0...2...1...3...', CH: [[50, 57, 60, 65], [46, 53, 57, 62], [48, 55, 58, 64], [45, 52, 57, 61]],
    ville: { v: 1.55, pad: 'choir', arp: 'bell', oct: 0, lp: 3500 },      // chœur sombre, cloches
    touge: { v: 1.84, pad: 'epFM', arp: 'pluck', oct: 0, lp: 6000 },      // electric piano, plucked strings
    wangan: { v: 1.46, pad: 'warm', arp: 'pulseArp', oct: 12, lp: 1800 }, // round, muffled pad, octave pulses
    paris: { v: 1.37, pad: 'strings', arp: 'bell', oct: 12, lp: 8000 },   // clear strings, octave bells
    canal: { v: 1.35, pad: 'warm', arp: 'epFM', oct: 0, lp: 2600 },       // round pad, electric piano
  };
  let resumed = false; // the track has just been resumed mid-bar: pad and bass come in at once, without waiting for the next bar
  // place ambience: filtered noise beds [type, frequency, Q, level, speed and depth of the swell]
  const AMB = {
    ville: [['highpass', 6000, 0.5, 0.012], ['bandpass', 1400, 0.6, 0.03, 0.13, 0.3], ['lowpass', 110, 0.7, 0.2, 0.07, 0.4]], // pluie, rumeur de ville
    touge: [['bandpass', 700, 0.5, 0.03, 0.1, 0.6], ['lowpass', 180, 0.7, 0.05, 0.05, 0.5]], // foliage, night air (+ crickets)
    chapada: [['bandpass', 800, 0.5, 0.03, 0.09, 0.6], ['highpass', 6200, 0.7, 0.008, 55, 0.9], ['highpass', 5200, 0.7, 0.006, 0.13, 0.9]], // forest foliage, cicadas (a chopped high breath at 55 Hz) swelling and fading (+ the beasts of each sector: evChapada)
    wangan: [['bandpass', 350, 0.8, 0.07, 0.08, 0.7], ['lowpass', 90, 0.7, 0.2]], // bay wind, port hum (+ ship horn)
    paris: [['lowpass', 140, 0.7, 0.15, 0.05, 0.3], ['highpass', 7000, 0.5, 0.004]], // city waking up (+ birds)
    canal: [['lowpass', 500, 0.5, 0.06, 0.06, 0.7], ['bandpass', 220, 0.7, 0.06]], // dry wind, distant motorway (+ helicopter)
    stade: [['bandpass', 450, 0.6, 0.12, 0.09, 0.35], ['bandpass', 1100, 0.8, 0.05, 0.13, 0.5], ['lowpass', 120, 0.7, 0.1]], // the stands' crowd, its babble swaying (+ roars)
    givre: [['bandpass', 320, 3, 0.05, 0.07, 0.8], ['lowpass', 200, 0.7, 0.05, 0.04, 0.5]], // wind whistling in the firs (+ distant bells)
    barrage: [['bandpass', 520, 0.5, 0.035, 0.09, 0.6], ['lowpass', 150, 0.7, 0.07]], // valley wind, water in the distance; the place sounds (fall, turbines, trains…) are placed by the scenery: SOUND.spots
    perse: [['bandpass', 420, 0.6, 0.03, 0.07, 0.6], ['lowpass', 150, 0.7, 0.05]], // warm westerly wind over the plain (+ the beds and events per zone: AMBZ)
    egee: [['bandpass', 420, 0.6, 0.035, 0.07, 0.6], ['lowpass', 190, 0.7, 0.07, 0.09, 0.6]], // the meltemi in the air, the swell on the rocks, 11 s (+ the beds and events per zone: AMBZ; the place sounds are placed by the scenery: SOUND.spots)
    piliers: [['bandpass', 380, 0.6, 0.022, 0.08, 0.6], ['lowpass', 110, 0.7, 0.035, 0.05, 0.4]], // wind over the pillars, deep air of the ravine (+ the beds and events per zone: AMBZ; falls, machinery and bells are placed by the scenery: SOUND.spots)
    area51: [['bandpass', 380, 0.6, 0.035, 0.07, 0.6], ['lowpass', 120, 0.7, 0.06, 0.04, 0.4], ['bandpass', 100, 8, 0.012]], // desert wind, the low rumble of the base, a narrow band at 100 Hz that reads as mains hum (+ beds per zone: AMBZ; place sounds: SOUND.spots)
    volcan: [['bandpass', 420, 0.6, 0.026, 0.08, 0.6], ['lowpass', 120, 0.7, 0.04, 0.06, 0.5]], // a cold westerly over bare ground, gusting; the swell on distant rock (+ the beds and events per zone: AMBZ; lava, vents, generators, bell and fog horn are placed by the scenery: SOUND.spots)
    autoroute: [['bandpass', 480, 0.6, 0.03, 0.06, 0.6], ['lowpass', 110, 0.7, 0.04, 0.04, 0.4], ['highpass', 5200, 0.7, 0.005, 0.13, 0.9]], // wind among the towers, the deep murmur of a city with nothing in it, a faint insect band (+ the beds and events per zone: AMBZ; the broken main is placed by the scenery: SOUND.spots)
    lune: [['lowpass', 90, 0.7, 0.05, 0.04, 0.3], ['bandpass', 700, 0.8, 0.018, 0.2, 0.95], ['highpass', 6500, 0.6, 0.003, 0.37, 0.9]], // no air outside: the bed is the cabin. Life-support hum, the suit's breathing (one breath in 5 s), a trace of radio carrier (+ the radio and its beeps: ambEvent; pings, chimes and thumps: SOUND.brief from the scenery)
  };

  // Beds per zone, in addition to the map's bed: de, a = fractions of the lap between which the bed sounds (open air); tun = the vault's bed, which sounds in a tunnel. c = layers, as AMB.
  // A map with zones keeps its events under the vault (ambEvent chooses by location).
  const AMBZ = {
    perse: [{ de: 0.632, a: 0.72, c: [['highpass', 3200, 0.5, 0.02], ['bandpass', 1500, 0.8, 0.03, 0.9, 0.4]] }, // the garden: running water from the cascades and the canal
      { tun: 1, c: [['bandpass', 520, 0.7, 0.07, 0.11, 0.4], ['bandpass', 1150, 0.9, 0.035, 0.17, 0.5], ['lowpass', 160, 0.7, 0.05]] }, // the covered bazaar: the hubbub under the vault
      { de: 0.872, a: 0.994, c: [['bandpass', 600, 0.8, 0.045, 0.13, 0.4], ['bandpass', 1300, 1, 0.02, 0.19, 0.5]] }], // the bazaar street: the same, drier, in the open air
    egee: [...[[0.934, 1], [0, 0.138]].map(([de, a]) => ({ de, a, c: [['lowpass', 380, 0.7, 0.07, 0.25, 0.7], ['bandpass', 2400, 1.2, 0.012, 0.6, 0.9], ['bandpass', 140, 0.8, 0.03, 0.4, 0.5]] })), // the harbour, either side of the line: wash on the quay, rigging, a distant diesel
      { de: 0.138, a: 0.426, c: [['highpass', 6200, 0.7, 0.006, 55, 0.9], ['highpass', 5200, 0.7, 0.0045, 0.13, 0.9], ['bandpass', 600, 0.6, 0.02, 0.1, 0.6]] }, // the dry slope of the Ascension: cicadas (the chapada recipe), wind in the thyme
      { de: 0.426, a: 0.596, c: [['highpass', 6200, 0.7, 0.007, 55, 0.9], ['bandpass', 500, 0.7, 0.014, 0.08, 0.5], ['bandpass', 900, 1.5, 0.008, 0.3, 0.9]] }, // the plateau: sheltered wind, cicadas
      { de: 0.596, a: 0.745, c: [['bandpass', 450, 0.6, 0.045, 0.09, 0.6], ['lowpass', 300, 0.7, 0.05, 0.07, 0.5]] }, // the Balcon: open wind, the sea far below, no cicadas
      { de: 0.745, a: 0.934, c: [['highpass', 6200, 0.7, 0.006, 55, 0.9], ['bandpass', 600, 0.6, 0.02, 0.1, 0.6], ['lowpass', 220, 0.7, 0.05, 0.1, 0.6]] }], // the terraces of the Descente: cicadas again, the sea coming closer
    piliers: [{ de: 0, a: 0.18, c: [['bandpass', 800, 0.5, 0.02, 0.09, 0.6], ['highpass', 5200, 0.7, 0.006, 0.13, 0.9]] }, // the forest: foliage and insects
      { de: 0.158, a: 0.23, c: [['bandpass', 260, 3, 0.03, 0.06, 0.8]] }, { de: 0.70, a: 0.90, c: [['bandpass', 260, 3, 0.035, 0.06, 0.8]] }, // the cliff edge of the corniche, the open side of the descent: wind in the void
      { de: 0.43, a: 0.54, c: [['bandpass', 190, 8, 0.04, 0.07, 0.6], ['bandpass', 600, 1.2, 0.03, 0.1, 0.6]] }, // the bridge: the cables sing, the wind pushes
      { de: 0.92, a: 1, c: [['bandpass', 800, 0.5, 0.02, 0.09, 0.6], ['highpass', 5200, 0.7, 0.006, 0.13, 0.9]] }, // the woods before the line
      { de: 0.975, a: 1, c: [['bandpass', 500, 0.8, 0.02, 0.13, 0.4], ['bandpass', 1100, 1, 0.009, 0.19, 0.5]] }, { de: 0, a: 0.03, c: [['bandpass', 500, 0.8, 0.02, 0.13, 0.4], ['bandpass', 1100, 1, 0.009, 0.19, 0.5]] }, // the coach park and the gate, both sides of the line: a murmur of visitors
      { tun: 1, c: [['lowpass', 160, 0.7, 0.06], ['bandpass', 700, 0.9, 0.02, 0.2, 0.4]] }], // the tunnel: a low drone
    volcan: [...[[0.924, 1], [0, 0.061]].map(([de, a]) => ({ de, a, c: [['lowpass', 700, 0.8, 0.045, 0.13, 0.7], ['bandpass', 2600, 0.7, 0.008, 0.2, 0.8]] })), // the harbour and the village, either side of the line: swell on the quay wall (an 8 s breath), rigging
      { de: 0.061, a: 0.237, c: [['highpass', 3500, 0.5, 0.007, 0.1, 0.8], ['bandpass', 380, 14, 0.011, 0.06, 0.7]] }, // the farmland: grass hush, and the power line singing (a narrow band, quiet)
      { de: 0.237, a: 0.613, c: [['bandpass', 300, 3, 0.035, 0.05, 0.8], ['bandpass', 380, 14, 0.011, 0.06, 0.7]] }, // the lava highland: stronger gusts, the line again
      { tun: 1, c: [['lowpass', 150, 0.7, 0.06], ['bandpass', 700, 0.9, 0.02, 0.2, 0.4]] }, // the two galleries (the south-west one is declared indoor by the scenery): a low drone, ventilation
      { de: 0.645, a: 0.683, c: [['highpass', 4200, 0.6, 0.013, 0.1, 0.6], ['lowpass', 90, 0.7, 0.05, 0.05, 0.5]] }, // the caldera floor: steam hiss and a deep rumble
      { de: 0.711, a: 0.889, c: [['bandpass', 380, 0.8, 0.03, 0.07, 0.6], ['lowpass', 500, 0.8, 0.03, 0.09, 0.6]] }, // the descent: wind, and the hush of the sea below
      { de: 0.889, a: 0.924, c: [['lowpass', 600, 0.8, 0.045, 0.11, 0.7], ['bandpass', 1100, 0.7, 0.01, 0.18, 0.7]] }], // the coast: the surf, nearer
    autoroute: [...[[0.96, 1], [0, 0.223]].map(([de, a]) => ({ de, a, c: [['bandpass', 520, 0.6, 0.03, 0.07, 0.6], ['highpass', 5200, 0.7, 0.006, 0.13, 0.9]] })), // the boulevard, either side of the line: leaves, far birds
      { de: 0.223, a: 0.41, c: [['highpass', 3800, 0.6, 0.008, 0.25, 0.8], ['bandpass', 900, 0.9, 0.02, 0.4, 0.6], ['lowpass', 200, 0.7, 0.04, 0.1, 0.5]] }, // the flooded district: water lapping against the walls, a low hollow note
      { de: 0.41, a: 0.628, c: [['bandpass', 300, 0.5, 0.06, 0.05, 0.8], ['bandpass', 1800, 12, 0.01, 0.15, 0.9]] }, // the slip road and the motorway: open wind, a thin whistle in the reinforcing bars
      { de: 0.628, a: 0.691, c: [['highpass', 3200, 0.5, 0.03], ['bandpass', 1500, 0.8, 0.03, 0.9, 0.4]] }, // the hole: running water
      { tun: 1, c: [['lowpass', 90, 0.7, 0.08, 0.05, 0.4], ['bandpass', 600, 1.5, 0.012, 0.1, 0.5], ['highpass', 6500, 0.5, 0.004]] }], // the metro: room tone, a faint hum, a hiss of air
    area51: [{ tun: 1, c: [['bandpass', 100, 8, 0.03], ['lowpass', 140, 0.7, 0.05, 0.05, 0.3], ['bandpass', 2600, 1.2, 0.004, 0.2, 0.9]] }, // hall H1 and the underground B1 (the scenery declares them indoor): ballast hum, ventilation rumble, a faint tick of metal
      { de: 0.29, a: 0.50, c: [['bandpass', 900, 3, 0.02, 0.09, 0.7], ['bandpass', 2300, 8, 0.004, 1.3, 0.9]] }, // the antenna field: wind in the lattice, a halyard
      { de: 0.47, a: 0.60, c: [['bandpass', 45, 4, 0.05, 0.07, 0.9], ['bandpass', 57, 6, 0.02, 0.11, 0.8]] }, // the ridge: the sub-bass hum of the signal, swelling every 14 s like its glow (not phase-locked to it)
      { de: 0.66, a: 0.97, c: [['bandpass', 300, 0.5, 0.03, 0.06, 0.6], ['lowpass', 90, 0.7, 0.06]] }], // the airfield: wider, lower wind over the lake bed
    lune: [{ tun: 1, c: [['lowpass', 160, 0.7, 0.07], ['bandpass', 900, 1.5, 0.02, 0.13, 0.6], ['bandpass', 480, 0.9, 0.02, 0.17, 0.5]] }], // the two pressurised places, the start hall (the scenery declares it indoor) and the tunnel: air handlers, a ventilation drone
  };
  const gain = (v, dest) => { const g = AC.createGain(); g.gain.value = v; g.connect(dest); return g; };
  const filt = (type, f, q, dest) => { const b = AC.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; b.connect(dest); return b; };
  const shaper = (k, dest) => { const s = AC.createWaveShaper(); s.curve = Float32Array.from({ length: 257 }, (_, i) => Math.tanh((i / 128 - 1) * k)); s.connect(dest); return s; };
  const env = (dest, t, dur, vol, a = 0.005) => { const g = AC.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); g.connect(dest); return g; };
  function osc(type, f, t, dur, vol, dest, det = 0) {
    if (vol < 0.002) return;
    const o = AC.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.detune.value = det; o.connect(env(dest, t, dur, vol)); o.start(t); o.stop(t + dur + 0.05); return o;
  }
  // a burst of n noises (the i-th at volume vol(i), every step seconds, each like nz: attack a, then drop to -80 dB hard): written once into a buffer, when the map loads (buildAmb),
  // then played by a single source. 110 nz calls at once (the canal's helicopter) made 1,100 audio calls in one frame, 7 to 17 ms of waiting
  const RAF = new WeakMap(), CHOPPER = { n: 110, stepSec: 0.075, dur: 0.06, vol: i => 0.2 * Math.sin(Math.PI * i / 110), a: 0.005 };
  function gustBuf(R) {
    const c = RAF.get(R); if (c && c.ac === AC) return c.buf;
    const sr = AC.sampleRate, L = Math.ceil((R.n * R.stepSec + R.dur) * sr), buf = AC.createBuffer(1, L, sr), x = buf.getChannelData(0), b = nbuf.getChannelData(0);
    for (let i = 0; i < R.n; i++) { const v = R.vol(i), k0 = Math.round(i * R.stepSec * sr), o = Math.random() * b.length | 0; if (v < 0.002) continue;
      for (let k = 0; k < R.dur * sr && k0 + k < L; k++) { const t = k / sr; x[k0 + k] = b[(o + k) % b.length] * (t < R.a ? v * t / R.a : v * Math.pow(0.0001 / v, (t - R.a) / (R.dur - R.a))); } }
    RAF.set(R, { ac: AC, buf }); return buf;
  }
  // short hits written into a buffer: strike(x, t0, dur, vol, a, f) adds to x, at t0 s, a hit like osc (f: sine at f Hz) or nz (f zero: white noise) — attack a, drop to -80 dB hard
  const strike = (x, t0, dur, vol, a, f) => { const sr = AC.sampleRate, k0 = Math.round(t0 * sr), b = nbuf.getChannelData(0), o = Math.random() * b.length | 0, w = 2 * Math.PI * f / sr;
    for (let k = 0; k < dur * sr && k0 + k < x.length; k++) { const t = k / sr; x[k0 + k] += (f ? Math.sin(w * k) : b[(o + k) % b.length]) * (t < a ? vol * t / a : vol * Math.pow(0.0001 / vol, (t - a) / (dur - a))); } };
  const rawBuf = (dur, written) => { const buf = AC.createBuffer(1, Math.ceil(dur * AC.sampleRate), AC.sampleRate); written(buf.getChannelData(0)); return buf; };
  const nowPlaying = (buf, t, dest) => { const s = AC.createBufferSource(); s.buffer = buf; s.connect(dest); s.start(t); };
  // sleigh bells (frost): four draws written at load, instead of 28 oscillators per pass
  let BELLS = null; const bells = () => Array.from({ length: 4 }, () => rawBuf(1.8, x => { const f = 2300 + Math.random() * 400; for (let i = 0; i < 14; i++) { const d = i * 0.11 + Math.random() * 0.03; strike(x, d, 0.12, 0.012, 0.005, f); strike(x, d, 0.08, 0.006, 0.005, f * 1.51); } }));
  const burstN = (R, t, dest, type, f, q = 1) => { const s = AC.createBufferSource(); s.buffer = gustBuf(R); s.connect(filt(type, f, q, dest)); s.start(t); };
  function nz(t, dur, vol, dest, type, f, q = 1, buf = nbuf, a = 0.005) { // buf: white noise, or mbuf (cymbal metal)
    if (vol < 0.002) return;
    const s = AC.createBufferSource(), fl = filt(type, f, q, env(dest, t, dur, vol, a)); s.buffer = buf; s.loop = true; s.connect(fl); s.start(t, Math.random()); s.stop(t + dur + 0.05); return fl;
  }
  // ---------- timbres ----------
  // custom waves (beyond sine, saw, square, triangle): harmonic amplitudes
  function waves() {
    const mk = h => { const re = new Float32Array(h.length + 1), im = new Float32Array(h.length + 1); h.forEach((a, i) => { im[i + 1] = a; }); return AC.createPeriodicWave(re, im); };
    const H = (n, f) => Array.from({ length: n }, (_, i) => f(i + 1));
    W = { pulse: mk(H(40, n => Math.sin(n * Math.PI * 0.12) / n * 2)), // narrow impulse: clavinet, sequenced bass, muted guitar
      organ: mk([1, 0.8, 0.5, 0.35, 0, 0.25, 0, 0.2]), // tirettes d'orgue
      vox: mk(H(32, n => [7, 11, 13, 14].includes(n) ? 0 : Math.exp(-((n - 4) ** 2) / 6) + 0.6 * Math.exp(-((n - 9) ** 2) / 8) + 0.3 / n)), // vowel: choir, chopped voice (without partials 7, 11, 13, 14, which sound out of tune against the scale)
      reed: mk(H(24, n => (n % 2 ? 1 : 0.35) / n ** 0.8)), // reed: saxophone, wind controller
      glass: mk([1, 0, 0.3, 0.5, 0, 0.25, 0, 0.3, 0, 0, 0, 0.12]) }; // glass: octaves and fifths only
    for (const [k, [re, im]] of Object.entries(window.WAVES || {})) W[k] = AC.createPeriodicWave(Float32Array.of(0, ...re), Float32Array.of(0, ...im)); // ak_… : synth waveforms captured (instruments.js)
  }
  // A timbre: o oscillators [wave, half-tones, cents, level] · uni / sp detuned unison · fm [ratio, index, duration, rest] FM modulation of
  // frequency · a d s r envelope · flt [type, start, end, duration, Q, follows the note] · form formants of talkbox · nz noise [type, f, Q, level, duration] ·
  // vib [Hz, cents, delay] · gl glide (s) · bus (sat, fuzz) · len hold in steps · lv level · pan, rv reverb, ec echo, ch chorus · str spacing between the strings of a strummed chord (s) · ks plucked string (see pluckString()), with: level of the oscillators mixed with the string · hold duration of a chord (steps) · sing sung voice (F, H), syl its vowels · leg tied notes (glide speed from one note to the next, s; the glide starts a bit before the note, like a singer)
  const PATCH = {
    // basses
    bDark: { o: [['sawtooth', 0, -9], ['sawtooth', 0, 9], ['square', -12, 0, 0.7]], flt: ['lowpass', 2600, 300, 0.18, 6], d: 0.25, s: 0.5, bus: 'sat' }, // darksynth: saturated saws
    bDist: { o: [['sawtooth'], ['square', 0, 9]], flt: ['lowpass', 900, 200, 0.2, 4], d: 0.2, s: 0.4, bus: 'fuzz', lv: 0.8 }, // clipped
    bAcid: { o: [['sawtooth']], flt: ['lowpass', 3200, 250, 0.14, 16], d: 0.2, s: 0.3, gl: 0.05, bus: 'sat' }, // resonant, TB-303 style
    bFM: { o: [['sine'], ['sine', -12, 0, 0.6]], fm: [1, 3.5, 0.12, 0.2], d: 0.25, s: 0.3, lv: 1.3 }, // 80s FM bass
    bDonk: { o: [['sine'], ['sine', 0, 0, 0.45]], fm: [2, 8, 0.039, 0.4], a: 0.003, d: 0.11, s: 0.06, r: 0.065, len: 1.35, bus: 'sat', lv: 1.5 },
    bPhonk: { o: [['sine'], ['triangle', 0, 0, 0.5], ['sawtooth', 0, 0, 0.12]], flt: ['lowpass', 1550, 430, 0.09, 1.5], a: 0.006, d: 0.28, s: 0.75, r: 0.065, gl: 0.035, lv: 1.45 },
    bPhonkOpen: { o: [['sine'], ['sine', -12, 0, 0.7], ['triangle', 0, 0, 0.6], ['sawtooth', 12, 0, 0.18]], flt: ['lowpass', 3600, 1600, 0.18, 0.7], a: 0.005, d: 0.4, s: 0.88, r: 0.1, gl: 0.035, lv: 1.7 },
    bPhonkDrive: { o: [['sawtooth', 0, 0, 0.85], ['sine', 0, 0, 0.65], ['sine', -12, 0, 0.3], ['triangle', 12, 0, 0.35]], flt: ['lowpass', 6200, 3200, 0.2, 0.8], a: 0.005, d: 0.35, s: 0.75, r: 0.08, gl: 0.035, lv: 1.35 },
    drift808: { o: [['sine']], flt: ['lowpass', 4200, 2200, 0.25, 0.65], dist: 2, a: 0.004, d: 0.85, s: 0.68, r: 0.055, len: 0.98, lv: 1.4 },
    driftCowbell: { o: [['square'], ['square', 6.797, 0, 0.65]], flt: ['bandpass', 2600, 1900, 0.15, 0.65], dist: 1.8, a: 0.002, d: 0.16, s: 0.015, r: 0.035, ec: 0.05, rv: 0.03, lv: 0.16 },
    cloudAnalog: { o: [['triangle'], ['sawtooth', 0, -3, 0.28], ['sawtooth', 0, 3, 0.28]], flt: ['lowpass', 3700, 2300, 0.28, 0.65], a: 0.025, d: 0.5, s: 0.65, r: 0.16, leg: 0.025, vib: [5, 9, 0.3], ec: 0.12, rv: 0.1, lv: 0.15 },
    bFrench: { o: [['sawtooth'], ['square', -12, 0, 0.32]], flt: ['lowpass', 1850, 340, 0.13, 2.5], a: 0.007, d: 0.2, s: 0.24, r: 0.055, gl: 0.025, lv: 1.25 },
    bMotor: { o: [['square'], ['sawtooth', 0, 7, 0.35], ['sine', 0, 0, 0.45]], flt: ['lowpass', 2200, 520, 0.09, 2.2], a: 0.005, d: 0.13, s: 0.35, r: 0.05, lv: 1.1 },
    bSlap: { o: [['pulse'], ['sawtooth', 0, 6, 0.5]], ks: { b: 0.7, t: 1.2, pos: 0.08 }, using: 1, flt: ['lowpass', 5000, 500, 0.07, 6], nz: ['bandpass', 2500, 2, 0.25, 0.012], d: 0.2, s: 0.25, lv: 1.2 }, // slapped
    bPick: { o: [['triangle'], ['pulse', 0, 0, 0.4]], ks: { b: 0.45, t: 1.6, pos: 0.12 }, using: 1, flt: ['lowpass', 2200, 400, 0.1, 2], nz: ['bandpass', 1800, 2, 0.15, 0.01], d: 0.22, s: 0.35, lv: 1.4 }, // electric bass with pick
    bMoog: { o: [['sawtooth'], ['triangle', 0, 5], ['sine', -12, 0, 0.5]], flt: ['lowpass', 700, 350, 0.2, 3], s: 0.8, gl: 0.07, len: 1, lv: 1.3 }, // round, with portamento
    bReese: { o: [['sawtooth', 0, -14], ['sawtooth', 0, 14], ['sine', 0, 0, 0.9]], flt: ['lowpass', 600, 380, 1, 2], s: 1, r: 0.08, len: 1, lv: 1.2 }, // beating saws
    bOff: { o: [['sawtooth', 0, -6], ['square', 0, 6]], flt: ['lowpass', 1800, 250, 0.1, 5], d: 0.12, s: 0.1, lv: 1.2 }, // plucked, off-beat
    bSeq: { o: [['pulse'], ['sine', 0, 0, 0.8]], flt: ['lowpass', 1500, 300, 0.08, 3], d: 0.1, s: 0.2, lv: 1.3 }, // sequenced pulse
    bFuzz: { o: [['sawtooth'], ['sawtooth', 7, 6, 0.7], ['square', 12, -5, 0.5]], s: 0.9, len: 1, bus: 'fuzz' }, // distorted guitar riff
    bBoost: { o: [['sine'], ['sine', 12, 0, 0.3], ['sawtooth', 0, 0, 0.2]], flt: ['lowpass', 900, 260, 0.15, 1], d: 0.4, s: 0.85, r: 0.06, len: 1, bus: 'sat', lv: 1.5 }, // "bass boosted": huge sub that saturates a little
    bString: { o: [['triangle'], ['pulse', 0, 0, 0.4]], ks: { b: 0.3, t: 2, pos: 0.2 }, using: 1, flt: ['lowpass', 2200, 400, 0.1, 2], nz: ['bandpass', 1800, 2, 0.15, 0.01], d: 0.22, s: 0.35, lv: 1.4 }, // electric bass: plucked string mixed with the bass played with a pick
    bGrit: { o: [['sawtooth', 0, -7], ['sawtooth', 0, 7], ['sine', -12, 0, 0.9]], flt: ['lowpass', 1100, 420, 0.25, 1.2], d: 0.35, s: 0.75, r: 0.05, len: 1, bus: 'sat', lv: 1.1 }, // big beat: big, dirty and held, without a bouncing resonance
    // claviers, nappes, accords
    epFM: { o: [['sine'], ['triangle', 12, 0, 0.15]], fm: [1, 1.6, 0.35, 0.1], d: 0.9, s: 0.15, ch: 0.5, rv: 0.15, lv: 1.6, str: 0.006 }, // electric piano
    dxEp: { o: [['sine'], ['sine', 12, 3, 0.3]], fm: [3, 1.2, 0.2, 0.1], d: 0.7, s: 0.1, ch: 0.4, rv: 0.2, pan: -0.25, lv: 1.5, str: 0.006 }, // bright FM electric piano
    organ: { o: [['organ']], a: 0.005, s: 1, r: 0.04, vib: [6, 6, 0], lv: 0.9 },
    kbd: { o: [['pulse']], ks: { b: 0.7, t: 0.4, pos: 0.1 }, using: 1, flt: ['highpass', 500, 500, 1, 0.7], d: 0.15, s: 0.1, pan: 0.3, lv: 1.1 },
    brass: { o: [['sawtooth', 0, -7], ['sawtooth', 0, 7], ['reed', 0, 0, 0.5]], a: 0.025, flt: ['lowpass', 600, 4500, 0.06, 2], d: 0.2, s: 0.7, rv: 0.15, lv: 1.1 }, // synth brass
    strings: { o: [['sawtooth']], unison: 4, sp: 14, a: 0.12, s: 1, r: 0.25, flt: ['highpass', 300, 300, 1, 0.7], ch: 0.6, rv: 0.3 }, // ensemble de cordes
    super: { o: [['sawtooth']], unison: 5, sp: 22, a: 0.01, d: 0.3, s: 0.8, r: 0.12, rv: 0.3, str: 0.002 }, // wall of detuned saws
    chorus: { o: [['sawtooth']], unison: 3, sp: 14, sing: 'F', syl: 'o', a: 0.3, s: 1, r: 0.5, rv: 0.5, ch: 0.3, lv: 0.9 }, // choir singing "oh" (formants)
    choir: { o: [['vox']], unison: 3, sp: 10, a: 0.25, s: 1, r: 0.4, rv: 0.5, lv: 1.4 },
    glass: { o: [['glass']], fm: [2, 0.8, 1.5, 0.3], a: 0.15, s: 0.8, r: 0.5, rv: 0.5, ch: 0.4, lv: 1.3 },
    warm: { o: [['triangle'], ['sawtooth', 0, 7, 0.3]], flt: ['lowpass', 1200, 1200, 1, 0.7], a: 0.3, s: 1, r: 0.4, rv: 0.2, lv: 1.3 },
    stabM7: { o: [['sawtooth', 0, -8], ['square', 0, 8, 0.6]], flt: ['lowpass', 3500, 500, 0.2, 4], d: 0.25, ec: 0.45, rv: 0.2, lv: 1.3, str: 0.001 }, // Detroit stab chord
    gtrMute: { o: [['pulse']], ks: { b: 0.6, t: 0.25, pos: 0.15 }, using: 1, flt: ['bandpass', 1800, 1200, 0.05, 3], nz: ['bandpass', 3000, 2, 0.2, 0.008], d: 0.07, pan: 0.35, lv: 2, str: 0.009 }, // cocotte de guitare funk
    pwr: { o: [['sawtooth', 0, -4], ['sawtooth', 0, 4]], ks: { b: 0.6, t: 1.5, pos: 0.15 }, using: 1, s: 0.9, bus: 'fuzz', str: 0.012 }, // accords de puissance
    gtrNylon: { o: [['triangle'], ['pulse', 0, 3, 0.35]], ks: { b: 0.35, t: 1.4, pos: 0.13 }, using: 1, flt: ['lowpass', 3500, 1200, 0.15, 0.8], nz: ['bandpass', 3000, 2, 0.12, 0.01], d: 0.35, s: 0.15, r: 0.2, holdTime: 5, rv: 0.25, pan: -0.2, lv: 1.4, str: 0.018 }, // nylon-string guitar, strummed (rumba): plucked string mixed with the synth
    arpRound: { o: [['triangle'], ['sine', 12, 0, 0.3]], flt: ['lowpass', 2200, 900, 0.12, 1], d: 0.16, s: 0.1, ec: 0.25, rv: 0.15, pan: 0.2, lv: 1.4 }, // round arpeggio, without resonance
    gtrClean: { o: [['sawtooth', 0, -5], ['pulse', 0, 5, 0.6]], ks: { b: 0.65, t: 2, pos: 0.15 }, using: 1, flt: ['lowpass', 3200, 1100, 0.3, 0.8], d: 0.5, s: 0.25, r: 0.2, holdTime: 4, rv: 0.3, ch: 0.35, pan: -0.25, lv: 1.3, str: 0.014 }, // clean electric guitar, strummed: plucked string mixed with the synth
    pluck: { o: [['sawtooth', 0, -7], ['sawtooth', 0, 7]], flt: ['lowpass', 6000, 500, 0.12, 3], d: 0.15, ec: 0.4, rv: 0.15 },
    pulseArp: { o: [['pulse']], d: 0.12, ec: 0.35, pan: -0.2 },
    seqArp: { o: [['sawtooth']], flt: ['lowpass', 3000, 600, 0.1, 8], d: 0.12, ec: 0.3, pan: 0.2 },
    seqInd: { o: [['pulse'], ['sawtooth', 0, 9, 0.6]], flt: ['lowpass', 1500, 220, 0.09, 3], d: 0.09, s: 0, ec: 0.25, rv: 0.2, pan: -0.15, lv: 1.6 }, // industrial techno: dull short stab, the echo does the rest
    pno: { o: [['triangle'], ['sine', 12, 0, 0.45], ['sawtooth', 0, 4, 0.2]], fm: [2, 1.4, 0.12, 0.1], flt: ['lowpass', 4500, 1600, 0.3, 0.7], d: 0.45, s: 0.06, rv: 0.2, ch: 0.25, lv: 1.4, str: 0.007 }, // 90s house piano (M1)
    bell: { o: [['sine']], fm: [3, 1.2, 0.3, 0.05], d: 0.9, ec: 0.4, rv: 0.3, lv: 1.2 },
    fmMetal: { o: [['sine']], fm: [1.41, 4, 0.2, 0.3], d: 0.25, rv: 0.3, lv: 1.2 }, // inharmonic metal
    santour: { o: [['triangle']], ks: { b: 0.95, t: 1.6, pos: 0.07 }, using: 0.3, flt: ['highpass', 400, 400, 1, 0.7], d: 0.4, s: 0.1, r: 0.3, ec: 0.35, rv: 0.3, pan: 0.2, lv: 1.3, str: 0.004 }, // Persian santur: struck strings, bright and short, in the echo
    // themes
    ldTar: { o: [['pulse'], ['sawtooth', 0, 5, 0.4]], ks: { b: 0.85, t: 1.8, pos: 0.06 }, using: 0.6, flt: ['lowpass', 3000, 1500, 0.2, 1.5], a: 0.003, d: 0.4, s: 0.45, r: 0.12, vib: [6, 18, 0.25], gl: 0.04, ec: 0.25, rv: 0.3, lv: 0.14 }, // Persian tar: string plucked near the bridge, nasal, wide vibrato
    ldSaw: { o: [['sawtooth', 0, -10], ['sawtooth', 0, 10]], flt: ['lowpass', 5000, 5000, 1, 0.7], s: 0.8, vib: [5.5, 8, 0.2], ec: 0.3, rv: 0.2, lv: 0.08 },
    ldSync: { o: [['sawtooth'], ['square', 0, 5, 0.5]], flt: ['bandpass', 600, 3500, 0.25, 5], s: 0.8, vib: [6, 10, 0.15], ec: 0.25, rv: 0.15, lv: 0.2 }, // swept formant, sync style
    ldEwi: { o: [['reed']], a: 0.03, flt: ['lowpass', 1500, 3200, 0.1, 3], s: 0.9, vib: [5.5, 12, 0.15], gl: 0.04, rv: 0.25, ch: 0.3, lv: 0.14 }, // wind controller
    ldSax: { o: [['reed'], ['sawtooth', 0, 4, 0.3]], flt: ['bandpass', 1300, 1500, 0.1, 1.5], nz: ['bandpass', 3000, 1, 0.08, 0.1], a: 0.04, s: 0.85, vib: [5, 14, 0.25], rv: 0.3, lv: 0.2 },
    ldWhistle: { o: [['sine']], nz: ['bandpass', 4000, 3, 0.03, 0.2], a: 0.03, s: 0.9, gl: 0.09, vib: [5.5, 7, 0.2], ec: 0.35, rv: 0.3, lv: 0.12 }, // portamento whistle
    ldTalk: { o: [['sawtooth'], ['triangle', 0, 0, 0.9]], form: 1, s: 0.9, gl: 0.05, vib: [5, 8, 0.2], lv: 0.3 }, // talkbox: vowel "o", without the 2.6 kHz whistle
    ldMoog: { o: [['sawtooth'], ['square', 0, 6, 0.5]], flt: ['lowpass', 900, 2600, 0.12, 2], a: 0.02, s: 0.9, gl: 0.08, vib: [5, 10, 0.25], ec: 0.35, rv: 0.35, lv: 0.13 }, // monophonic portamento synth, "Magic Fly" style
    ldBrass: { o: [['sawtooth', 0, -8], ['sawtooth', 0, 8]], flt: ['lowpass', 500, 1600, 0.12, 1.2], a: 0.02, s: 0.85, vib: [5.5, 10, 0.3], rv: 0.3, ch: 0.3, lv: 0.11 }, // 80s polyphonic synth brass, stadium rock style
    ldTwang: { o: [['pulse'], ['sawtooth', 0, 6, 0.5]], ks: { b: 0.8, t: 2.5, pos: 0.1 }, using: 1, flt: ['lowpass', 2600, 1300, 0.25, 1.5], a: 0.004, d: 0.6, s: 0.55, r: 0.15, vib: [5.5, 14, 0.3], gl: 0.03, ec: 0.4, rv: 0.4, lv: 0.12 }, // western guitar: string plucked near the bridge mixed with the synth, in the echo and reverb
    ldVoiceF: { o: [['sawtooth'], ['triangle', 0, 0, 0.7]], sing: 'F', leg: 0.06, syl: 'aaoaei', a: 0.035, s: 0.9, r: 0.12, vib: [5.5, 9, 0.35], gl: 0.05, rv: 0.35, ec: 0.22, lv: 0.12 }, // sung female voice (formants), Vocaloid style
    ldVoiceH: { o: [['sawtooth'], ['triangle', 0, 0, 0.7]], sing: 'H', leg: 0.06, syl: 'oaoe', a: 0.04, s: 0.9, r: 0.12, vib: [5, 8, 0.35], gl: 0.06, rv: 0.3, ec: 0.2, lv: 0.12 }, // sung male voice
    ldCold: { o: [['triangle'], ['sawtooth', 0, 4, 0.25]], flt: ['lowpass', 2400, 1800, 0.2, 1], a: 0.04, s: 0.9, r: 0.25, leg: 0.05, vib: [5, 8, 0.3], rv: 0.4, ec: 0.3, lv: 0.14 }, // cold wave: tied theme, gliding from note to note
    ldNylon: { o: [['triangle'], ['pulse', 0, 0, 0.3]], ks: { b: 0.5, t: 2, pos: 0.12 }, using: 1, flt: ['lowpass', 3000, 1400, 0.2, 1], a: 0.004, d: 0.5, s: 0.4, r: 0.15, vib: [5.5, 12, 0.25], gl: 0.03, rv: 0.3, ec: 0.15, lv: 0.16 }, // nylon-string guitar, plucked: plucked string mixed with the synth
    ldCrunch: { o: [['sawtooth', 0, -6], ['square', 0, 6, 0.5]], ks: { b: 0.6, t: 2, pos: 0.12 }, using: 1, flt: ['lowpass', 1400, 1100, 0.2, 1], a: 0.01, s: 0.9, vib: [5.5, 12, 0.3], gl: 0.03, bus: 'sat', lv: 0.18 }, // slightly distorted, dark guitar: without the fuzz guitar's whistle
    ldElectro: { o: [['square'], ['square', 12, 3, 0.25]], flt: ['lowpass', 2400, 2400, 1, 0.7], a: 0.005, d: 0.25, s: 0.6, r: 0.08, ec: 0.25, rv: 0.15, lv: 0.12 }, // 80s electro: plain, sharp square, filtered, without glide or vibrato
    ldPressure: { o: [['square'], ['square', 12, 3, 0.16]], flt: ['lowpass', 2050, 1800, 0.15, 0.7], a: 0.018, d: 0.32, s: 0.62, r: 0.15, ec: 0.24, rv: 0.17, lv: 0.12 },
    ldCowbell: { o: [['square'], ['square', 6.797, 0, 0.75]], flt: ['highpass', 500, 500, 1, 0.7], a: 0.004, d: 0.2, s: 0.14, r: 0.09, ec: 0.12, rv: 0.07, lv: 0.13 },
    ldCircuit: { o: [['ak_fmsynth_0015'], ['pulse', -12, 5, 0.4]], flt: ['lowpass', 2600, 1600, 0.22, 0.8], a: 0.025, d: 0.35, s: 0.55, r: 0.15, gl: 0.025, ec: 0.16, rv: 0.1, lv: 0.14 },
    ldCoast: { o: [['sawtooth', 0, -7], ['sawtooth', 0, 7], ['triangle', -12, 0, 0.28]], flt: ['lowpass', 3600, 1500, 0.22, 0.8], a: 0.014, d: 0.32, s: 0.4, r: 0.12, ec: 0.19, rv: 0.1, lv: 0.105 },
    ldCloud: { o: [['ak_fmsynth_0008'], ['triangle', -12, 5, 0.5]], flt: ['lowpass', 1700, 3700, 0.16, 1.2], a: 0.018, d: 0.25, s: 0.42, r: 0.11, ec: 0.17, rv: 0.07, lv: 0.13 },
    ldRobot: { o: [['sawtooth'], ['square', -12, 0, 0.65]], form: 1, a: 0.012, d: 0.24, s: 0.65, r: 0.08, gl: 0.025, ec: 0.12, rv: 0.06, lv: 0.13 },
    ldTurbo: { o: [['sawtooth', 0, -4], ['square', 0, 4, 0.35]], flt: ['lowpass', 3200, 1250, 0.18, 1.8], a: 0.01, d: 0.24, s: 0.46, r: 0.1, ec: 0.16, rv: 0.06, lv: 0.115 },
    chFrench: { o: [['sawtooth', 0, -4], ['sawtooth', 0, 4]], flt: ['lowpass', 2800, 750, 0.16, 1.3], a: 0.009, d: 0.18, s: 0.12, r: 0.06, ec: 0.13, rv: 0.05, lv: 1.2, holdTime: 1.5, str: 0.001 },
    chRally: { o: [['pulse'], ['sawtooth', 0, 4, 0.45]], flt: ['lowpass', 3300, 800, 0.12, 1.8], a: 0.008, d: 0.16, s: 0.15, r: 0.07, ec: 0.16, rv: 0.07, lv: 1.1, holdTime: 1.4, str: 0.002 },
    pianoDrive: { smp: 'piano', o: [['triangle']], flt: ['lowpass', 3600, 2300, 0.45, 0.7], a: 0.012, d: 1.2, s: 0.48, r: 0.28, rv: 0.16, ec: 0.1, lv: 16, holdTime: 6, str: 0.005 },
    pianoHouse: { smp: 'rhodes', o: [['triangle']], flt: ['lowpass', 4200, 2400, 0.35, 0.7], a: 0.009, d: 0.7, s: 0.4, r: 0.18, rv: 0.12, ec: 0.13, lv: 3.8, holdTime: 3.5, str: 0.004 },
    leadSilk: { o: [['sawtooth', 0, -6], ['sawtooth', 0, 6], ['triangle', -12, 0, 0.4]], flt: ['lowpass', 2000, 3000, 0.2, 0.65], a: 0.035, d: 0.5, s: 0.7, r: 0.18, leg: 0.035, ec: 0.2, rv: 0.15, lv: 0.11 },
    voiceSilk: { smp: 'oohs', o: [['triangle']], flt: ['lowpass', 2100, 1700, 0.3, 0.7], a: 0.12, s: 0.9, r: 0.3, leg: 0.09, gl: 0.09, rv: 0.32, ec: 0.14, lv: 1.55 },
    leadClean: { smp: 'gtClean', o: [['triangle']], flt: ['lowpass', 4000, 2800, 0.3, 0.7], a: 0.014, d: 0.8, s: 0.65, r: 0.2, ec: 0.19, rv: 0.18, lv: 1.1, gl: 0.025 },
    leadRhodes: { smp: 'rhodes', o: [['sine']], flt: ['lowpass', 3800, 2500, 0.3, 0.7], a: 0.02, d: 0.85, s: 0.45, r: 0.22, ec: 0.18, rv: 0.14, lv: 0.9 },
    leadBrass: { smp: 'synBrass', o: [['sawtooth']], flt: ['lowpass', 6200, 4200, 0.22, 0.8], a: 0.015, d: 0.38, s: 0.65, r: 0.14, ec: 0.12, rv: 0.1, lv: 1.2 },
    leadOverdrive: { smp: 'gtOver', o: [['sawtooth']], flt: ['lowpass', 6800, 4800, 0.25, 0.7], a: 0.012, d: 0.6, s: 0.7, r: 0.14, gl: 0.025, ec: 0.14, rv: 0.11, lv: 1.25 },
    hardStab: { o: [['pulse'], ['sawtooth', 0, 4, 0.45]], flt: ['lowpass', 6500, 2800, 0.12, 0.9], a: 0.005, d: 0.16, s: 0.18, r: 0.07, ec: 0.1, rv: 0.05, lv: 0.12, holdTime: 2, str: 0.001 },
    ldEuro: { o: [['sawtooth', 0, -9], ['square', 0, 9, 0.6]], flt: ['lowpass', 3200, 1800, 0.2, 1], a: 0.01, d: 0.3, s: 0.7, ec: 0.3, rv: 0.25, lv: 0.1 }, // gimmick d'eurodance
    ldGtr: { o: [['sawtooth', 0, -5], ['sawtooth', 0, 5]], s: 0.9, vib: [5.5, 16, 0.15], gl: 0.05, bus: 'fuzz', lv: 0.2 }, // distorted guitar
    ldSiren: { o: [['triangle'], ['square', 0, 0, 0.3]], flt: ['lowpass', 3000, 3000, 1, 0.7], s: 1, gl: 0.15, ec: 0.3, lv: 0.1 },
    ldVox: { o: [['vox']], unison: 2, sp: 8, a: 0.02, d: 0.2, s: 0.5, rv: 0.3, ec: 0.3, lv: 0.16 }, // chopped voice
    ldTri: { o: [['triangle']], a: 0.02, s: 0.8, vib: [5, 8, 0.2], rv: 0.35, ec: 0.3, lv: 0.14 },
    ldStr: { o: [['sawtooth']], unison: 3, sp: 12, a: 0.08, s: 1, r: 0.15, flt: ['highpass', 500, 500, 1, 0.7], ch: 0.5, rv: 0.3, lv: 0.07 },    // sampled instruments (smp: name in instruments.js; o: the oscillators played while the instrument is not decoded; smpLv: sample level)
    ldEwiSoft: { o: [['reed'], ['sine', 0, 0, 0.4]], a: 0.07, flt: ['lowpass', 1300, 2400, 0.25, 1.5], s: 0.9, r: 0.18, leg: 0.07, vib: [5, 9, 0.3], gl: 0.09, rv: 0.3, ch: 0.3, lv: 0.13 }, // softened wind controller: tied notes that glide, slower attack and filter
    rhodesSoft: { smp: 'rhodes', o: [['sine']], flt: ['lowpass', 2600, 1800, 0.4, 0.7], d: 2, s: 0.6, r: 0.3, ch: 0.4, rv: 0.28, pan: -0.2, lv: 5, str: 0.012 }, // recorded electric piano, softened
    gtCocotte: { smp: 'gtMute', o: [['pulse']], flt: ['highpass', 300, 300, 1, 0.7], d: 0.3, s: 0.5, r: 0.06, pan: 0.35, lv: 2.8, str: 0.01 }, // real muted guitar
    voiceOohs: { smp: 'oohs', o: [['vox']], a: 0.05, s: 1, r: 0.25, leg: 0.06, gl: 0.06, vib: [5.2, 8, 0.35], rv: 0.4, ec: 0.25, lv: 1.85 }, // recorded voice without words
    ldGuitar: { smp: 'gtDist', o: [['sawtooth']], flt: ['lowpass', 4500, 3000, 0.3, 0.7], a: 0.005, s: 1, r: 0.12, vib: [5.5, 14, 0.3], gl: 0.03, ec: 0.25, rv: 0.25, lv: 1.13 }, // recorded distorted guitar
    brassShort: { smp: 'synBrass', o: [['sawtooth']], flt: ['lowpass', 3200, 900, 0.15, 2], d: 0.25, s: 0.3, r: 0.08, rv: 0.2, pan: -0.15, lv: 8, str: 0.004 }, // short synth brass chord
    pizzSeq: { smp: 'pizz', o: [['triangle']], d: 0.3, s: 0.6, ec: 0.3, rv: 0.25, pan: 0.2, lv: 3.75 }, // plucked strings in sequence
    gtSat: { smp: 'gtOver', o: [['sawtooth']], d: 0.2, s: 0.6, r: 0.06, pan: -0.3, lv: 10, str: 0.008 }, // recorded crunch guitar, rhythm
    gtCleanLd: { smp: 'gtClean', o: [['triangle']], d: 0.6, s: 0.4, r: 0.1, ch: 0.4, rv: 0.25, pan: 0.3, lv: 14, str: 0.009 }, // recorded clean guitar
    vibraArp: { smp: 'vibra', o: [['sine']], d: 0.5, s: 0.5, r: 0.2, ec: 0.25, rv: 0.25, pan: 0.25, lv: 11.5 }, // vibraphone arpeggio
    chorusLd: { smp: 'chorus', o: [['vox']], a: 0.06, s: 1, r: 0.3, leg: 0.07, gl: 0.06, rv: 0.4, ec: 0.2, lv: 1.67 }, // recorded choir, tied theme
    voiceChopped: { smp: 'oohs', o: [['vox']], a: 0.005, d: 0.15, s: 0.4, r: 0.05, ec: 0.3, rv: 0.25, lv: 1.1 }, // recorded voice, chopped short
    pianoAc: { smp: 'piano', o: [['triangle']], d: 2, s: 0.5, r: 0.25, rv: 0.22, ch: 0.15, lv: 13.8, str: 0.008 }, // recorded grand piano
    stringsSustained: { smp: 'ropes', o: [['sawtooth']], a: 0.15, s: 1, r: 0.4, rv: 0.4, ch: 0.2, lv: 15.9 }, // recorded string ensemble
    chorusPad: { smp: 'chorus', o: [['vox']], a: 0.3, s: 1, r: 0.5, rv: 0.5, lv: 15.5 }, // recorded choir as a pad
    brassStab: { smp: 'brassSec', o: [['sawtooth']], a: 0.01, d: 0.3, s: 0.6, r: 0.1, rv: 0.2, lv: 14, str: 0.003 }, // recorded brass section
    slapS: { smp: 'slap', o: [['pulse']], d: 0.4, s: 0.6, r: 0.05, lv: 5.7 }, // real slapped bass
    bassFingerS: { smp: 'bassFinger', o: [['triangle']], d: 0.5, s: 0.7, r: 0.06, lv: 15.2 }, // real finger-played electric bass
    saxAltoLd: { smp: 'altoSax', o: [['reed']], a: 0.02, s: 1, r: 0.15, vib: [5, 12, 0.3], rv: 0.3, ec: 0.15, lv: 0.54 }, // recorded alto saxophone
    saxTenorLd: { smp: 'tenorSax', o: [['reed']], a: 0.02, s: 1, r: 0.15, vib: [5, 12, 0.3], rv: 0.28, ec: 0.12, lv: 0.53 }, // recorded tenor saxophone
    trompetteLd: { smp: 'trumpet', o: [['sawtooth']], a: 0.02, s: 1, r: 0.12, vib: [5.5, 10, 0.3], rv: 0.28, ec: 0.15, lv: 1.15 }, // recorded trumpet
    fluteLd: { smp: 'flute', o: [['sine']], a: 0.04, s: 1, r: 0.2, vib: [5, 10, 0.35], rv: 0.35, ec: 0.25, lv: 1.15 }, // recorded flute
    panFluteLd: { smp: 'panFlute', o: [['sine']], a: 0.03, s: 1, r: 0.2, vib: [5, 8, 0.3], rv: 0.35, ec: 0.25, lv: 1.39 }, // recorded panpipe
    steelLd: { smp: 'steel', o: [['sine']], d: 0.8, s: 0.5, r: 0.2, rv: 0.3, ec: 0.3, lv: 4.4 }, // recorded steel drum
    bNeuro: { o: [['ak_distorted_0015', 0, -10], ['ak_fmsynth_0022', 0, 10], ['sine', -12, 0, 0.8]], flt: ['lowpass', 350, 1400, 0.12, 5], d: 0.3, s: 0.8, r: 0.06, bus: 'sat', lv: 0.66 }, // neurofunk bass: two captured waves that grind, filter opening on each note
  };
  // sung voice (sing): a rich source goes through three vowel formants, the syllables (syl) follow each other from note to note; breath at the attack
  const FORM = { F: { a: [800, 1150, 2900], e: [400, 2000, 2800], i: [300, 2300, 3000], o: [450, 800, 2830], u: [325, 700, 2700] }, H: { a: [700, 1220, 2600], e: [400, 1700, 2600], i: [300, 2200, 2900], o: [450, 800, 2600], u: [325, 700, 2530] } };
  let syl = 0;
  // plucked string (Karplus-Strong): a vibrating string, computed once per pitch and per timbre then replayed (much more natural than a filtered wave);
  // ks: b brightness of the attack (0..1), t resonance duration (s), pos pluck point (0..0.5: near the bridge, more nasal)
  const KSC = new Map();
  function pluckString(f, k) {
    const sr = AC.sampleRate, N = Math.max(2, Math.round(sr / f)), cacheKey = sr + ':' + N + ':' + k.b + ':' + k.t + ':' + k.pos; let e = KSC.get(cacheKey); if (e) return e;
    const len = Math.ceil(sr * k.t), buf = AC.createBuffer(1, len, sr), out = buf.getChannelData(0), c = new Float32Array(N), rho = Math.pow(0.001, 1 / (k.t * f)), a = 0.15 + 0.8 * k.b, P = Math.round(N * k.pos);
    let lp = 0; for (let i = 0; i < N; i++) { lp += a * (Math.random() * 2 - 1 - lp); c[i] = lp; } // the pluck: a noise more or less dull
    if (P) { const c0 = c.slice(); for (let i = 0; i < N; i++) c[i] = c0[i] - c0[(i + P) % N]; } // plucked P samples from the bridge: some harmonics die out
    let pk = 1e-6; for (let i = 0; i < len; i++) { const j = i % N, y = c[j]; out[i] = y; c[j] = rho * 0.5 * (y + c[(j + 1) % N]); pk = Math.max(pk, Math.abs(y)); } // the string: each turn, a bit duller and a bit weaker
    for (let i = 0; i < len; i++) out[i] *= 0.5 / pk;
    if (KSC.size > 400) KSC.clear(); e = { buf, rate: f * (N + 0.5) / sr }; KSC.set(cacheKey, e); return e; // the loop lasts N + ½ samples: the playback speed corrects the pitch
  }
  function tone(pn, f, t, dur, vel, dest, from, ex = 1, sc = 0) { // from: pitch of the previous note, for the glide; ex: velocity (1 = normal), which also acts on brightness; sc: attack from below (cents)
    const P = PATCH[pn]; if (!P || vel < 0.002) return [];
    // played louder, the note is also brighter; drift: an analogue instrument is never exactly in tune to the cent; the vibrato comes in gradually
    vel *= ex; const a = P.a || 0.004, s = P.s || 0, r = P.r || 0.06, end = t + dur, ending = end + r * 2 + 0.05, g = AC.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + a); g.gain.setTargetAtTime(vel * s, t + a, (P.d || dur) / 3); g.gain.setTargetAtTime(0, end, r / 3);
    dest = P.bus === 'fuzz' ? dest.fz || fuzz : P.bus === 'sat' ? bsat : dest; g.connect(dest); // fuzz: the part's amp (a guitar no longer saturates with the others)
    let d = g;
    if (P.flt) { const [type, f0, f1, ft, q, kt] = P.flt, brightness = !menu && type === 'lowpass' ? ST[station].brightness || 1 : 1, k = (kt ? f : 1) * brightness * (type === 'highpass' ? 1 : ex ** 1.5); d = filt(type, Math.min(18000, f0 * k), q, g); d.frequency.setValueAtTime(Math.min(18000, f0 * k), t); d.frequency.exponentialRampToValueAtTime(Math.min(18000, f1 * k), t + Math.min(ft, dur)); }
    if (P.dist) d = shaper(P.dist, d); // per-voice drive retains the part's envelope, pan and mix controls
    if (P.sing) { const fm = FORM[P.sing][P.syl[syl++ % P.syl.length]], src = AC.createGain(); src.gain.value = 5;
      fm.forEach((fr, i) => src.connect(gain([1, 0.55, 0.25][i], filt('bandpass', fr, fr / [70, 90, 120][i], d)))); d = src;
      nz(t, 0.05, vel * 0.5, src, 'highpass', 1500, 0.7); } // breath: the attack of a syllable
    if (P.form) { const x = filt('bandpass', 500, 5, g), y = filt('bandpass', 1100, 5, g); d = AC.createGain(); d.gain.value = 3; d.connect(x); d.connect(y);
      x.frequency.setValueAtTime(500, t); x.frequency.linearRampToValueAtTime(800, t + dur * 0.5); y.frequency.setValueAtTime(1100, t); y.frequency.linearRampToValueAtTime(1500, t + dur * 0.5); }
    let mod, m; const srcs = [], fr = []; // sources to extend and oscillators to glide when the next note is tied
    if (P.fm) { m = AC.createOscillator(); const dev = P.fm[1] * f * P.fm[0]; mod = AC.createGain(); m.frequency.setValueAtTime(f * P.fm[0], t);
      mod.gain.setValueAtTime(dev, t); mod.gain.setTargetAtTime(dev * P.fm[3], t, P.fm[2] / 3); m.connect(mod); m.start(t); m.stop(ending); srcs.push(m); }
    const os = [], U = P.unison || 1, lv = 1 / Math.sqrt(P.o.length * U), drift = (Math.random() - 0.5) * 5;
    if (P.ks) { const c = pluckString(f, P.ks), o = AC.createBufferSource(); o.buffer = c.buf; o.playbackRate.value = c.rate; o.detune.value = drift; o.connect(gain(1, d)); o.start(t); o.stop(Math.min(ending, t + P.ks.t)); os.push(o); srcs.push(o); }
    const B = P.smp && ins[P.smp], ks = Object.keys(B || {}); let smpOk = false;
    if (ks.length) { const m = 69 + 12 * Math.log2(f / 440), k = ks.reduce((a, b) => Math.abs(b - m) < Math.abs(a - m) ? b : a), o = AC.createBufferSource(), rate = f / (440 * 2 ** ((k - 69) / 12)); // the nearest recorded note, transposed
      o.buffer = B[k]; o.detune.value = drift; o.playbackRate.setValueAtTime(from && P.gl ? rate * from / f : sc ? rate * 2 ** (-sc / 1200) : rate, t); if ((from && P.gl) || sc) o.playbackRate.exponentialRampToValueAtTime(rate, t + (from && P.gl ? P.gl : sc > 60 ? 0.12 : 0.07));
      o.connect(gain(P.smpLv || 1, d)); o.start(t); o.stop(ending); os.push(o); srcs.push(o); fr.push([{ frequency: o.playbackRate }, rate / f]); smpOk = true; }
    if (!(P.ks || smpOk) || P.using) for (const [w, semi = 0, cents = 0, olv0 = 1] of P.o) for (let u = 0; u < U; u++) { const olv = olv0 * (P.ks || smpOk ? P.using : 1); // with: the plucked string (or the sample) mixed with the timbre's oscillators, at this level; without a decoded sample, the oscillators alone
      const o = AC.createOscillator(), fo = f * 2 ** (semi / 12); if (W[w]) o.setPeriodicWave(W[w]); else o.type = w;
      o.frequency.setValueAtTime(fo, t); o.detune.value = drift + cents + (U > 1 ? (u / (U - 1) - 0.5) * 2 * P.sp : 0);
      if (from && P.gl) { o.frequency.setValueAtTime(fo * from / f, t); o.frequency.exponentialRampToValueAtTime(fo, t + P.gl); }
      else if (sc) { o.frequency.setValueAtTime(fo * 2 ** (-sc / 1200), t); o.frequency.exponentialRampToValueAtTime(fo, t + 0.07); }
      if (mod) mod.connect(o.frequency);
      o.connect(gain(olv * lv, d)); o.start(t); o.stop(ending); os.push(o); srcs.push(o); fr.push([o, fo / f]);
    }
    if (P.vib) { const l = AC.createOscillator(), lg = AC.createGain(); l.frequency.value = P.vib[0]; lg.gain.setValueAtTime(0, t + P.vib[2]); lg.gain.linearRampToValueAtTime(P.vib[1], t + P.vib[2] + 0.45); l.connect(lg); for (const o of os) lg.connect(o.detune); l.start(t); l.stop(ending); srcs.push(l); }
    if (P.nz) nz(t, P.nz[4], vel * P.nz[3], dest, P.nz[0], P.nz[1], P.nz[2]);
    // tied note (leg timbres): the same voice glides to the next note without re-attacking or changing syllable; returns the voice, to tie again; a repeated same note marks a slight dip, like a new syllable
    os.ending = end; os.f = f; os.pn = pn; os.tieNext = (f2, t2, d2, v2) => { const gl = P.leg > 0 && P.leg !== 1 ? P.leg : 0.03, e2 = t2 + d2, same = Math.abs(f2 / os.f - 1) < 0.01; os.f = f2;
      const tg = t2 - gl * 0.6; for (const [o, k] of fr) o.frequency.setTargetAtTime(f2 * k, tg, gl); if (m) m.frequency.setTargetAtTime(f2 * P.fm[0], tg, gl);
      g.gain.cancelScheduledValues(t2); if (same) g.gain.setTargetAtTime(v2 * 0.72, t2, 0.02); g.gain.setTargetAtTime(v2 * Math.max(s, 0.3), t2 + (same ? 0.05 : 0), 0.08); g.gain.setTargetAtTime(0, e2, r / 3);
      for (const x of srcs) x.stop(e2 + r * 2 + 0.05); os.ending = e2; return os; };
    return os;
  }

  // ---------- batteries ----------
  // A kit: smp recorded TR-808 sounds · kick kf→ke in ks s, hold kd, click kc (filtered at kcf), kdr saturated · snare: tones sT
  // (hold sTd), noise sN [type, f, Q] (hold sNd), reverb gate cut dead · hi-hats: hM metallic or noise, hF high-pass,
  // hD / hO closed / open hold · rate pitch · crunch everything goes through the saturation · hum human feel (s) · fill restart · tom, tomD · room reverb
  const KIT = {
    k808: { smp: 1, fill: 'roll', room: 0.03 },
    k909: { kf: 210, ke: 46, ks: 0.055, kd: 0.34, kc: 0.5, sT: [185, 330], sTd: 0.08, sN: ['highpass', 2000, 0.7], sNd: 0.17, hM: 1, hF: 8500, hD: 0.04, hO: 0.24, fill: 'roll', room: 0.08 },
    dur: { kf: 190, ke: 44, ks: 0.07, kd: 0.28, kc: 0.3, kdr: 1, sT: [200], sTd: 0.05, sN: ['bandpass', 1800, 0.7], sNd: 0.2, gate: 1, hM: 1, hF: 7000, hD: 0.03, hO: 0.18, fill: 'toms', tom: [150, 110, 80], tomD: 0.3, room: 0.15 }, // 80s drum machine, snare cut dead
    lin: { kf: 160, ke: 52, ks: 0.04, kd: 0.2, kc: 0.45, sT: [210, 300], sTd: 0.06, sN: ['bandpass', 2400, 0.6], sNd: 0.18, gate: 1, hM: 0, hF: 8000, hD: 0.03, hO: 0.2, fill: 'toms', tom: [200, 150, 105], tomD: 0.28, room: 0.2 },
    ind: { kf: 260, ke: 75, ks: 0.05, kd: 0.2, kc: 0.2, kdr: 1, sT: [], sTd: 0.05, sN: ['highpass', 1200, 0.5], sNd: 0.14, crunch: 1, hM: 1, hF: 4000, hD: 0.025, hO: 0.1, room: 0.2 },
    acous: { kf: 130, ke: 58, ks: 0.025, kd: 0.16, kc: 0.4, kcf: 3000, sT: [200, 285], sTd: 0.07, sN: ['bandpass', 4200, 0.6], sNd: 0.2, hM: 0, hF: 7500, hD: 0.035, hO: 0.3, hum: 0.008, fill: 'toms', tom: [230, 170, 120], tomD: 0.2, room: 0.2 },
    rock: { kf: 110, ke: 48, ks: 0.035, kd: 0.26, kc: 0.5, kcf: 2500, sT: [180, 250], sTd: 0.1, sN: ['bandpass', 3200, 0.5], sNd: 0.28, hM: 0, hF: 6000, hD: 0.06, hO: 0.4, hum: 0.008, fill: 'toms', tom: [190, 140, 95], tomD: 0.3, room: 0.45 },
    brk: { kf: 150, ke: 60, ks: 0.03, kd: 0.14, kc: 0.5, sT: [220, 320], sTd: 0.06, sN: ['bandpass', 3600, 0.6], sNd: 0.13, crunch: 1, hM: 0, hF: 6500, hD: 0.03, hO: 0.2, fill: 'brk', room: 0.12 }, // chopped and dirtied breakbeat
    dnb: { kf: 165, ke: 62, ks: 0.025, kd: 0.11, kc: 0.5, sT: [220, 320], sTd: 0.05, sN: ['bandpass', 3600, 0.6], sNd: 0.1, rate: 1.35, crunch: 1, hM: 0, hF: 8000, hD: 0.025, hO: 0.16, fill: 'brk', room: 0.15 },
    disco: { kf: 120, ke: 55, ks: 0.02, kd: 0.12, kc: 0.45, kcf: 3500, sT: [210, 300], sTd: 0.05, sN: ['bandpass', 4800, 0.6], sNd: 0.14, hM: 1, hF: 9000, hD: 0.04, hO: 0.32, hum: 0.005, fill: 'toms', tom: [260, 200, 150], tomD: 0.15, room: 0.15 },
  };
  // raw recorded instruments, for the music editor: a "e_<name>" timbre per instrument of instruments.js. shortcut: levels (lv) not measured, to set per timbre if a station in the repo adopts one
  for (const n of window.INS_LABELS || Object.keys(window.INS || {})) PATCH['e_' + n] = { smp: n, o: [['triangle']], a: 0.005, d: 2, s: 0.7, r: 0.15, rv: 0.2, lv: 2.5 };
  const smp = {};
  // a station's kit: its drum machine, completed by its own sounds (st.drumset: snare, hi-hat…), redone if the editor changes either
  const kitOf = st => { if (!st.drumset) return KIT[st.kit] || KIT.k909; const de = st.kit + JSON.stringify(st.drumset); return st.Kb && st.Kb.de === de ? st.Kb : (st.Kb = { ...(KIT[st.kit] || KIT.k909), ...st.drumset, de }); };
  // sampled instruments (smp timbre, see instruments.js): decoded only for the stations in play (decoded, an instrument weighs ~6 MB)
  const ins = {}, insP = {};
  // the notes (instruments-notes.js, 3.7 MB compressed) arrive at the first station, not at start-up: in the meantime the timbres play their oscillators (o)
  let notesP = null, recent = [];
  const notes = () => notesP || (notesP = new Promise(ok => { if (typeof document === 'undefined') return ok(); const s = document.createElement('script'); s.src = 'src/audio/instruments-notes.js'; s.onload = s.onerror = ok; document.head.appendChild(s); }));
  function loadRadios(...radios) {
    recent = radios;
    if (AC && !window.INS) return notes().then(() => window.INS && loadRadios(...recent)); // the stations may have changed during the download
    if (!AC) return Promise.resolve(); const j = JSON.stringify(radios), labels = new Set(Object.keys(PATCH).filter(k => PATCH[k].smp && j.includes('"' + k + '"')).map(k => PATCH[k].smp));
    if (radios.length === 1) for (const n of Object.keys(ins)) if (!labels.has(n)) { delete ins[n]; delete insP[n]; }
    return Promise.all([...labels].filter(n => INS[n]).map(n => insP[n] || (insP[n] = Promise.all(Object.entries(INS[n]).map(([m, b64]) => new Promise(ok => // a decoding already started is awaited, not restarted
      AC.decodeAudioData(Uint8Array.from(atob(b64), ch => ch.charCodeAt(0)).buffer, b => { (ins[n] = ins[n] || {})[m] = b; ok(); }, ok)))))));
  }
  function hitS(name, t, vol, dur = 0, rate = 1, dest = drumG) { // dur: cuts the sound with a fade (the 808 kick rings 1.5 s); rate: playback pitch
    const b = smp[name]; if (!b || vol < 0.002) return !!b;
    vol *= 0.6 * (/^(cp|clp)/.test(name) ? 0.6 : 1); // the recordings are louder than the synthesised sounds; the claps, even more present
    const s = AC.createBufferSource(), gn = gain(vol, dest); s.buffer = b; s.playbackRate.value = rate; s.connect(gn); s.start(t);
    if (dur) { gn.gain.setValueAtTime(vol, t + dur * 0.6); gn.gain.linearRampToValueAtTime(0, t + dur); s.stop(t + dur + 0.02); }
    return true;
  }
  const dd = K => K.crunch ? kdrv : drumG;
  function dKick(t, v, K) {
    if (K.smp && hitS(v > 0.75 ? 'bdL' : 'bd', t, v, v > 0.75 ? 0.42 : 0.3)) return;
    if (K.smp) K = KIT.k909;
    const o = osc('sine', K.kf, t, K.kd, v, K.kdr || K.crunch ? kdrv : drumG); o && o.frequency.exponentialRampToValueAtTime(K.ke, t + K.ks);
    nz(t, 0.012, v * K.kc, drumG, 'lowpass', K.kcf || 5000);
  }
  function dClap(t, v) { for (let i = 0; i < 3; i++) nz(t + i * 0.011, 0.02, v * 0.6, drumG, 'bandpass', 1300, 1.5); nz(t + 0.033, 0.16, v * 0.7, drumG, 'bandpass', 1300, 1.2); }
  // recorded snare and hi-hat, chosen per station (st.drumset, which completes the kit): sS snare, sG its ghost note, cS clap, rS rim shot, sR playback pitch;
  // hS closed hi-hat, hA accent, hOo open, hR pitch. Names: those of PERC (instruments.js) or of the 808 (sd, cp, ch, oh)
  function dSnare(t, v, K, c = 'x') { // x snare · g ghost note · c clap · r rim shot
    if (c === 'g') v *= 0.3;
    const sn = c === 'c' ? K.cS : c === 'r' ? K.rS : c === 'g' ? K.sG || K.sS : K.sS;
    if (sn && hitS(sn, t, v * (c === 'r' ? 0.5 : 0.9) * (K.sV || 1), 0, (K.sR || 1) * (1 + (Math.random() - 0.5) * 0.02))) return; // each hit slightly different
    if (c === 'r') { osc('triangle', 1750, t, 0.03, v * 0.5, drumG); nz(t, 0.015, v * 0.4, drumG, 'bandpass', 3500, 2); return; }
    if (K.smp && hitS(c === 'c' ? 'cp' : 'sd', t, v * 0.9)) return;
    if (c === 'c') return dClap(t, v);
    if (K.smp) K = KIT.k909;
    const rt = K.rate || 1;
    for (const f of K.sT) { const o = osc('triangle', f * rt, t, K.sTd, v * 0.5, dd(K)); o && o.frequency.exponentialRampToValueAtTime(f * rt * 0.7, t + K.sTd); }
    nz(t, K.sNd, v * 0.8, dd(K), K.sN[0], K.sN[1] * rt, K.sN[2]);
    if (K.gate) { const s = AC.createBufferSource(), g = AC.createGain(); s.buffer = nbuf; s.loop = true; s.connect(filt('bandpass', 1500, 0.6, g)); g.connect(drumG);
      g.gain.setValueAtTime(v * 0.4, t); g.gain.setValueAtTime(v * 0.4, t + 0.17); g.gain.linearRampToValueAtTime(0, t + 0.2); s.start(t, Math.random()); s.stop(t + 0.22); }
  }
  function dHat(t, v, K, c) { // x closed · X accent · o open · r ride cymbal · b ride bell
    const ride = c === 'r' || c === 'b', lv = v * (c === 'X' ? 0.36 : c === 'o' ? 0.4 : c === 'x' ? 0.21 : 0.2);
    const hn = c === 'o' ? K.hOo : c === 'X' ? K.hA || K.hS : K.hS;
    const hd = K.crunch ? kdrv : hatG;
    if (!ride && hn && hitS(hn, t, lv * 1.1 * (K.hV || 1), c === 'o' ? K.hO * 1.6 : 0, (K.hR || 1) * (1 + (Math.random() - 0.5) * 0.03), hd)) return;
    if (K.smp && !ride && hitS(c === 'o' ? 'oh' : 'ch', t, lv * 1.1, 0, 1, hd)) return;
    if (K.smp) K = KIT.k909;
    const dec = c === 'o' ? K.hO : c === 'r' ? 0.45 : c === 'b' ? 0.3 : K.hD, metal = K.hM || ride;
    nz(t, dec, lv * (metal ? 0.7 : 1.3), ride ? drumG : hd, 'highpass', ride ? (c === 'b' ? 3500 : 5200) : K.hF, 0.8, metal ? mbuf : nbuf);
    if (c === 'b') osc('triangle', 3900, t, 0.25, lv * 0.25, drumG);
  }
  function dTom(t, v, f, d) { const o = osc('sine', f * 1.5, t, d, v, drumG); o && o.frequency.exponentialRampToValueAtTime(f, t + d * 0.4); nz(t, 0.02, v * 0.3, drumG, 'bandpass', 1200, 1); }
  function dPerc(t, v, K, c) { // c bell · v clave · h l congas · m shaker · t tambourine · 1 2 3 toms · k metal · y crowd "hey!"
    if (c === 'c') { if (K.smp && hitS('cb', t, v * 0.18)) return; const b = filt('bandpass', 900, 1.5, env(drumG, t, 0.16, v * 0.14)); for (const f of [540, 800]) { const o = AC.createOscillator(); o.type = 'square'; o.frequency.value = f; o.connect(b); o.start(t); o.stop(t + 0.2); } }
    else if (c === 'v') osc('sine', 2500, t, 0.03, v * 0.2, drumG);
    else if (c === 'h' || c === 'l') { const f = c === 'h' ? 340 : 230, o = osc('sine', f, t, c === 'h' ? 0.12 : 0.18, v * 0.3, drumG); o && o.frequency.exponentialRampToValueAtTime(f * 0.85, t + 0.08); nz(t, 0.01, v * 0.15, drumG, 'bandpass', 2000, 1); }
    else if (c === 'm') nz(t, 0.06, v * 0.1, drumG, 'highpass', 6500, 0.7, nbuf, 0.02);
    else if (c === 't') { nz(t, 0.09, v * 0.1, drumG, 'highpass', 9000, 0.7, mbuf); nz(t, 0.05, v * 0.06, drumG, 'highpass', 7000); }
    else if (c === 'k') tone('fmMetal', 180, t, 0.3, v * 0.3, kdrv);
    else if (c === 'y') hey(t, v);
    else if (+c) dTom(t, v * 0.4, (K.tom || [200, 150, 105])[+c - 1], K.tomD || 0.25);
  }
  function hey(t, v) { // crowd "hey!": five slightly detuned and staggered men's voices, vowel "é" gliding towards "i"
    for (let i = 0; i < 5; i++) { const t0 = t + Math.random() * 0.03, f = 140 + Math.random() * 90, src = AC.createGain(), e = env(drumG, t0, 0.22, v * 0.09, 0.012), fs = FORM.H.e;
      fs.forEach((fr, j) => { const b = filt('bandpass', fr, fr / 60, gain([1, 0.6, 0.3][j], e)); src.connect(b); if (j === 1) b.frequency.linearRampToValueAtTime(2100, t0 + 0.18); });
      const o = AC.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f * 1.15, t0); o.frequency.exponentialRampToValueAtTime(f, t0 + 0.2); o.connect(src); src.gain.value = 4; o.start(t0); o.stop(t0 + 0.3);
      nz(t0, 0.04, v * 0.05, src, 'highpass', 1200); }
  }
  function dFill(t, i, n, K) { // end-of-section restart: i = step in the restart (0..n-1)
    const k = (i + 1) / n;
    if (K.fill === 'toms') { if (n === 4 || i % 2 === 0 || i >= n - 3) dTom(t, 0.3 + 0.25 * k, K.tom[Math.min(2, Math.floor(i * 3 / n))], K.tomD); if (i === 0) dSnare(t, 0.4, K); }
    else if (K.fill === 'brk') { if ('x.xx.x.x'[i % 8] === 'x') dSnare(t, 0.3 + 0.25 * k, K); if (i % 4 === 2) dKick(t, 0.7, K); }
    else dSnare(t, 0.2 + 0.35 * k, K);
  }
  function riser(t, dur, v = 0.22) { // noise rise: before the hot sector, and during the rise sections
    const s = AC.createBufferSource(), g = AC.createGain(), f = filt('bandpass', 400, 2, g);
    s.buffer = nbuf; s.loop = true; s.connect(f); g.connect(drumG);
    f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(7000, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + dur); g.gain.linearRampToValueAtTime(0, t + dur + 0.05);
    s.start(t); s.stop(t + dur + 0.1);
  }
  function crash(t = AC.currentTime, v = 1) { // impact: start, entry and exit of the hot sector, start of the chorus
    nz(t, 1.4, 0.28 * v, drumG, 'highpass', 4500);
    const o = osc('sine', 70, t, 0.7, 0.8 * v, drumG); o && o.frequency.exponentialRampToValueAtTime(30, t + 0.5);
  }
  // race finish: a cymbal hit, a held chord, then a phrase according to position (rising fanfare for the first, short rise for the podium, fall for the last)
  const arrival = pos => { if (!AC) return; const t = AC.currentTime; crash(t, 0.7); for (const n of [57, 64, 69, 73]) osc('triangle', hz(n), t, 1.8, 0.1, uiF);
    (pos === 1 ? [69, 73, 76, 81, 85, 88, 93] : pos < 4 ? [69, 73, 76, 81] : [69, 64, 60, 57]).forEach((n, i, a) => osc('square', hz(n), t + 0.15 + i * 0.1, i === a.length - 1 ? 0.9 : 0.4, 0.12, uiF)); };
  const stinger = up => AC && (up ? [69, 73, 76, 81, 85] : [69, 64, 60, 57]).forEach((n, i) => osc('square', hz(n), AC.currentTime + i * 0.09, 0.5, 0.12, uiF));

  // ---------- sequencer ----------
  function schedMenu(s, t) {
    const mn = MENU[M.id] || MENU.ville, bar = s >> 4, q = s % 16, ch = MENU.CH[bar % MENU.CH.length], a = MENU.mel[q];
    if (q === 0 || resumed) { const n = 16.5 - q; resumed = false; for (const x of ch) tone(mn.pad, hz(x), t, S16 * n, 0.05 * (PATCH[mn.pad].lv || 1), strip.d.in); osc('sine', hz(ch[0] - 24), t, S16 * Math.max(1, n - 2.5), 0.2, duckG); }
    if (a !== '.') tone(mn.arp, hz(ch[+a] + 12 + mn.oct + (bar & 1 ? 12 : 0)), t, 0.9, 0.05 * (PATCH[mn.arp].lv || 1), strip.a.in);
  }
  // A sixteenth-note step. The station gives a form (a sequence of 4-bar sections: intro, verses, chorus, break, rise…); each
  // section says which parts play and with which pattern variant (format: see RADIO in mapDefs.js). The race adds to it: nothing but the
  // countdown tick; in the hot sector and on the last sector (big), parts marked "!" come in.
  // Race themes keep their written form. Older stations switch to the chorus, except the variation (e).
  // Nothing abrupt outside a race event: parts fade in, drums withdraw before a break and fade back in, the chorus
  // only starts at the beginning of a bar and only restarts at the end of a section; filters open slowly.
  // human feel: DR[p] the offset of part p, which drifts slowly (a musician is ahead or behind several notes in a row, never pure chance)
  const DR = {};
  function sched(s, t) {
    if (menu) return schedMenu(s, t);
    const st = ST[station], K = kitOf(st); t += (s & 1) * (st.sw || 0) * S16; // swing: the odd sixteenth notes drag
    const bar = s >> 4, q = s % 16, d = drums, fmi = (bar >> 2) % st.form.length, nxt = st.form[(fmi + 1) % st.form.length];
    if ((q === 0 && ((bar & 3) === 0 || mix > 0.5 || ending || boostL)) || (boostL && !bigS && q % 4 === 0)) { const b = !entering && (mix > 0.5 || ending || boostL); if (bigS && !b) exitAt = bar >> 2; bigS = b; } // the nitro is an action: it opens the chorus from the next beat // the hot-sector chorus comes in at the next bar and only restarts at the end of a section: never in the middle of a bar
    const big = bigS;
    let key = st.form[fmi]; if (big && !st.raceTheme && key !== 'e') key = st.hot;
    else if (exitAt === bar >> 2 && !st.sec[key].k) key = st.form[1]; // leaving the hot sector we fall back on a verse, never on a break: no hole // hot sector: the chorus, and its variation when the form reaches it
    if (EC.loopSec && st.sec[EC.loopSec]) key = EC.loopSec; EC.sec = key;
    const mxv = p => pv(st, p);
    const sec = st.sec[key], pr = st.prog[sec.P || 0], ch = pr.CH[bar % pr.CH.length], root = pr.ROOT[bar % pr.ROOT.length], pos = ((bar & 3) * 16 + q) / 64; // pos: progress through the section
    curRoot = root;
    // The new race arrangements keep the hook and rhythm audible from the first lap.
    const on = p => { const x = st[p] && sec[p]; return x && (!x.big || big) && !(lap === 0 && !big && !st.raceTheme && (p === 'l' || p === 'p')) ? x : null; }, pat = (v, x) => { const b = v[x.v % v.length]; return b[bar % b.length]; };
    // human feel (st.game, 1 by default, 0: machine): hj(p, place, j) the instant of a note of part p, at its place around the beat (s, the snare and the theme a little behind),
    // plus its slow drift and a little chance (±j/2); arc: the section breathes (it rises gradually, its first bar accented)
    const J = st.game == null ? 1 : st.game, hj = (p, place, j) => { DR[p] = (DR[p] || 0) * 0.85 + (Math.random() - 0.5) * j * 0.6; return Math.max(t - 0.004, t + J * (place + DR[p] + (Math.random() - 0.5) * j)); };
    const arc = 1 + J * (0.1 * pos - 0.05 + ((bar & 3) === 0 && q === 0 ? 0.05 : 0));
    const hum = (p, place, j) => K.hum ? hj(p, place, j) + Math.random() * K.hum : t + J * (Math.random() - 0.5) * 0.002; // an acoustic drum kit plays around the beat; a drum machine falls exactly on it
    // human feel of the instruments: velocity that follows the bar (strong beat, off-beat), a bit of chance on the strength (±), a bit of offset (s, doubled with an acoustic drum kit)
    const acc = q % 4 === 0 ? 1.08 : q % 2 === 0 ? 0.97 : 0.88, jit = a => 1 + (Math.random() - 0.5) * 2 * a, lt = j => t + (Math.random() - 0.5) * 2 * (K.hum ? 2 * j : j);
    const vch = pr.V ? pr.V[bar % pr.V.length] : ch; // the chord in the inversion closest to the previous one (see voice() in mapDefs.js)
    const runSuite = st.sec[big && !st.raceTheme && nxt !== 'e' ? st.hot : nxt], dur = S16 * 16; // the coming section; duration of a bar
    const fillN = (bar & 3) === 3 && K.fill && sec.k && runSuite.k ? (nxt !== st.form[fmi] ? 8 : 4) : 0, fill = d && fillN && q >= 16 - fillN;
    if (q === 0) { // start of a bar: nothing comes in or goes out at once
      for (const p in strip) { const now = !!(st[p] && sec[p] && (!sec[p].big || big)), g = strip[p].in.gain; // a part coming in fades up over the bar
        if (st.sectionMix) {
          const level = st.sectionMix[key] && st.sectionMix[key][p];
          g.setTargetAtTime(now ? MX[p] * (level == null ? 1 : level) : 0, t, dur / 3);
        } else if (now && !was[p]) { g.cancelScheduledValues(t); g.setValueAtTime(MX[p] * 0.15, t); g.linearRampToValueAtTime(MX[p], t + dur * (p === 'b' ? 0.3 : 0.8)); } was[p] = now; }
      const kNow = !!(d && st.k && sec.k), g = drumF.gain;
      if (kNow && !was.k) { g.cancelScheduledValues(t); g.setValueAtTime(st.raceTheme ? 1 : 0.3, t); g.linearRampToValueAtTime(1, t + dur * 0.8); } // the drums come back with a fade
      else if (kNow && (bar & 3) === 3 && !runSuite.k) { g.cancelScheduledValues(t); g.setValueAtTime(1, t); g.linearRampToValueAtTime(0.25, t + dur); } // they withdraw on the last bar before a break
      else if (!kNow && was.k) { g.cancelScheduledValues(t); g.setValueAtTime(0.25, t); g.linearRampToValueAtTime(1, t + dur * 2); }
      was.k = kNow;
      secG.gain.setTargetAtTime(key === st.hot || key === 'e' ? 1 : (st.cv || 1) * (sec.k ? 1 : 1.6), t, dur / 3); // verses are raised towards the chorus level (cv, set per bar); sections without drums (intro, break) a bit more, so the dip stays soft
    }
    let x, c;
    if (d && (x = on('k')) && !fill && (c = pat(st.k, x)[q]) !== '.') {
      playNote('k', t); dKick(t, mxv('k') * lerp(0.5, 0.8, mix) * (c === 'g' ? 0.5 : 1), K);
      const p = st.pump == null ? 0.35 : st.pump; // pump: everything dips under the kick, more or less depending on the style
      if (p < 1) { duckG.gain.cancelScheduledValues(t); duckG.gain.setValueAtTime(p, t); duckG.gain.linearRampToValueAtTime(1, t + Math.min(st.pumpT || 0.24, S16 * 1.9)); }
    }
    if (d && (x = on('s')) && !fill && (c = pat(st.s, x)[q]) !== '.') playNote('s', t), dSnare(hum('s', 0.005, 0.004), mxv('s') * (big ? 0.5 : st.sMin || 0.34) * jit(0.06 * (1 + J)), K, c);
    if (fill && mxv('s') > 0) dFill(t, q - 16 + fillN, fillN, K);
    if (d && sec.roll && !((bar & 3) === 3 && q >= 14) && q % ((bar & 3) < 2 ? 4 : (bar & 3) < 3 ? 2 : 1) === 0) dSnare(t, mxv('s') * (0.12 + 0.4 * pos), K); // rise: roll that tightens
    if (d && sec.roll && (bar & 3) === 0 && q === 0) riser(t, S16 * 64, 0.18);
    if (d && sec.roll) lastRoll = bar;
    else if (d && (bar & 3) === 0 && q === 0 && lastRoll === bar - 1) crash(t, 0.7); // the drop: at the end of a rise, the cymbal (the sub drop that accompanied it bounced in the echo: removed)
    if (d && (bar & 3) === 0 && q === 0 && key === st.hot && lastFill === bar - 1) crash(t, 0.35); // chorus-entry cymbal, only after a drum restart
    if (fill) lastFill = bar;
    if (!d) { if (q % 4 === 2) dHat(t, 0.5, K, 'x'); } // only the tick during the countdown
    else if ((x = on('h')) && (c = pat(st.h, x)[q]) !== '.') playNote('h', t), dHat(hum('h', q % 2 ? -0.002 : 0, 0.005), mxv('h') * (big || lap === 2 ? 1 : 0.8) * 0.63 * (st.hn ? lerp(1, st.hn[q % 4], J) : 1 - J * [0, 0.3, 0.12, 0.22][q % 4]) * jit(0.12 * (1 + J)), K, c); // hi-hats at −4 dB on all stations (they dominated); drummer's accent: the full beat, the sixteenth between two lighter (st.hn: the velocities taken from the reference, per sixteenth of the beat)
    if (d && (x = on('p')) && (c = pat(st.p, x)[q]) !== '.') playNote('p', t), dPerc(hum('p', 0.003, 0.008), mxv('p') * jit(0.15), K, c);
    if (d && (x = on('b'))) { const rif = pat(st.b.v, x), rf = rif[q];
      if (rf != null && rf !== R) { let n = 1; while (q + n < 16 && rif[q + n] == null) n++; // held until the next note
        const P = PATCH[st.b.p], f = hz((st.bO || 0) + (st.bBy ? root + rf : justTune(root + rf, pr.OK[bar % pr.OK.length]))); playNote('b', t, S16 * n); tone(st.b.p, f, hj('b', 0.003, 0.004), S16 * n * (P.len || 0.9) * jit(0.1 * J), mxv('b') * lerp(0.27, 0.38, mix) * (P.lv || 1), strip.b.in, lastB, acc * arc * (q % 2 ? 1 - 0.12 * J : 1) * jit(0.06 * (1 + J))); lastB = f; } }
    else if (!d && q % 8 === 0) tone(st.b.p, hz(root + 12), t, S16 * 6, 0.25, strip.b.in);
    if (st.d && (!d || on('d'))) { const P = PATCH[st.d[0]];
      if (q === 0) { playNote('d', t, S16 * 16); for (const [i, n] of vch.entries()) tone(st.d[0], hz(n + (st.d[1] || 0)), hj('d', i * 0.01 * J, 0.008), S16 * 16.5, mxv('d') * 0.05 * (P.lv || 1), strip.d.in, 0, jit(0.05)); }
      strip.d.gate.gain.setValueAtTime(d && sec.gate && st.gate[q] === '.' ? 0.06 : 1, t); } // chopped pad (trance gate)
    for (const p of ['c', 'g']) if (d && (x = on(p)) && (c = pat(st[p].v, x)[q]) !== '.') { const P = PATCH[st[p].p];
      const rolling = q === 0 && !(P.str > 0.008) && Math.random() < 0.35 * J, sp = rolling ? 0.028 / (P.str || 0.004) : 0.7 + 0.6 * Math.random(); // broken chord: the chord as a fast arpeggio, from bass to treble
      const up = q % 2 === 1 && !rolling, ts = hj(p, 0, 0.006), ex = acc * arc * jit(0.08 * (1 + J)), ns = up ? [...vch].reverse() : vch; playNote(p, t); // strummed: upward on the beats, downward off-beat, each string a little after the other (P.str)
      ns.forEach((n, i) => tone(st[p].p, hz(n + 12 + (st[p + 'O'] || 0)), ts + i * (P.str || 0.004) * sp * jit(0.3), S16 * (P.holdTime || (P.s ? 1.6 : 3)), mxv(p) * (c === 'X' ? 0.065 : 0.045) * (P.lv || 1) * (1 - 0.06 * i), strip[p].in, 0, ex)); }
    if ((x = on('a')) && (c = pat(st.a.v, x)[q]) !== '.' && (d || q % 2 === 0)) playNote('a', t), tone(st.a.p, hz(ch[c % 4 % ch.length] + 12 + (c >= 4 ? 12 : 0) + (st.aO || 0)), hj('a', 0.002, 0.004), 0.2 * jit(0.15 * J), mxv('a') * (q % 4 === 0 ? 0.05 : 0.038) * (PATCH[st.a.p].lv || 1), strip.a.in, 0, arc * jit(0.1 * (1 + J))); // 0-3: chord notes; 4-7: at the octave
    if (d && (x = on('l'))) { const L = pat(st.l.v, x), N = L[q];
      if (N != null && N !== R) { let n = 1; while (q + n < 16 && L[q + n] == null) n++;
        // sung rather than tapped: a bit behind the beat, the first note of a phrase accented, long notes fuller, attacked from below every other time
        // and played: the velocity follows the pitch (higher a bit louder) and the section; a note followed by a silence is let go a little early, otherwise it ties into the next
        const No = N + (st.lO || 0), tl = hj('l', 0.008, 0.01), lv = mxv('l') * (PATCH[st.l.p].lv || 0.15) * (st.lV == null ? 1 : st.lV), ex = (q === 0 || L[q - 1] === R ? 1.1 : 1) * (0.9 + 0.1 * Math.min(1, n / 4)) * clamp(1 + J * 0.012 * (No - 74), 0.88, 1.12) * arc * jit(0.06 * (1 + J));
        const ld = S16 * n * (q + n < 16 && L[q + n] === R ? 1 - J * (0.1 + 0.12 * Math.random()) : 1.05);
        const PL = PATCH[st.l.p], tied = PL.leg && voiceL && voiceL.pn === st.l.p && voiceL.ending > tl - 0.03 && voiceL.ending < tl + 1; playNote('l', t, S16 * n); // with no silence between two notes, a tied voice does not re-attack
        // ornaments: on a long note, sometimes a leaning note just before (the neighbour above, or below, taken from the scale and chord), or a note attacked from below (a guitar pulls its string a half-tone)
        const gt = PL.smp === 'gtDist' || PL.bus === 'sat' || PL.bus === 'fuzz', orn = !tied && !PL.sing && n >= 3 && Math.random() < 0.2 * J;
        if (orn && Math.random() < 0.5) { const ok = pr.OK[bar % pr.OK.length], dir = Math.random() < 0.65 ? 1 : -1; let g = No + dir; while (!ok.has(((g % 12) + 12) % 12)) g += dir; tone(st.l.p, hz(g), tl - 0.06, 0.055, lv * 0.7, strip.l.in, 0, ex * 0.85); } // the neighbour taken from the scale and chord
        const sc = PL.sing || tied ? 0 : orn ? (gt ? 100 : 60) : n >= 3 && Math.random() < 0.5 ? 20 + 30 * Math.random() : 0;
        voiceL = tied ? voiceL.tieNext(hz(No), tl, ld, lv * ex) : tone(st.l.p, hz(No), tl, ld, lv, strip.l.in, PL.leg ? 0 : lastN && hz(lastN), ex, sc); lastN = No; // a sung voice attacks in tune: from below, it sounded out of tune
      } }
    if (driftL > 0.3) osc('sawtooth', hz(ch[(q * 2) % 3] + 24), t, 0.1, 0.07 * driftL, acid); // ligne acide tant qu'on glisse
    if (d && glisse) { // the glide stretches the music with its duration: roll that tightens and breath that rises, timed to the tempo (the bass thins out in audioFrame)
      if (q % (acquired ? 1 : 2) === 0) dSnare(t, 0.06 + 0.22 * tens, K);
      nz(t, S16 * 0.9, 0.025 + 0.05 * tens, drumG, 'bandpass', 800 * 8 ** tens, 2);
      if (acquired && !acqSaid) { acqSaid = true; dHat(t, 1, K, 'o'); tone('bell', hz(ch[0] + 24), t, 0.3, 0.09, strip.a.in); tone('bell', hz(ch[0] + 31), t + S16, 0.4, 0.09, strip.a.in); } // plateau: the glide fills the nitro gauge at full speed
    }
    if (boostPend && q % 4 === 0) { boostPend = false; if (d) crash(t, 0.8); } // the cymbal falls on the beat after the nitro starts
    if (st.sweep) swF.frequency.setTargetAtTime(big ? 16000 : 350 * 2 ** (3.6 * (0.5 - 0.5 * Math.cos(Math.PI * (s % 128) / 64))), t, big ? 0.6 : 0.15); // filter swept over 8 bars, wide open in the hot sector
    else swF.frequency.setTargetAtTime(sec.lo && !big ? 400 * 30 ** pos : 20000, t, 0.25); // filtered section: the low-pass opens over the course of the section
  }
  const justTune = (n, ok) => ok.has(((n % 12) + 12) % 12) ? n : ok.has(((n - 1) % 12 + 12) % 12) ? n - 1 : n + 1; // note set to the scale and chord of the bar: never a wrong bass note
  const lvl = () => menu ? (MENU[M.id] || MENU.ville).v : ST[station].vol == null ? 1 : ST[station].vol; // station level: set per bar so that all come out at the same volume
  // guitar amp of each part (timbres bus: 'fuzz'): st.fz its attack (1 = the original saturation), st.mx its output level
  function retune(t, retain) { // guard: the editor changes a setting while listening, the sequencer does not restart from the beginning // (re)sets the sequencer, the bus and the mix slices to the station or to the menu loop
    const st = ST[station], mn = MENU[M.id] || MENU.ville; S16 = 60 / (menu ? MENU.bpm : st.bpm) / 4; if (!retain) { t0 = nextT = t; stp = !menu && drums ? 64 : 0; lastN = lastB = 0; voiceL = null; } // in a race, a station picked up on the fly starts at the first verse, not at the intro
    if (!AC) return;
    // The race themes retain their drum transients. Returning to an older station restores the original master settings.
    const compression = !menu && st.raceTheme ? [-16, 3, 12, 0.018, 0.1] : [-24, 12, 30, 0.003, 0.25];
    for (const [i, parameter] of ['threshold', 'ratio', 'knee', 'attack', 'release'].entries()) {
      masterComp[parameter].cancelScheduledValues(t);
      masterComp[parameter].setValueAtTime(compression[i], t);
    }
    const e = menu ? [3, 0.5] : st.echo || [3, 0.4], q = menu ? [0, 1000, 0, 0] : st.eq || [0, 1000, 0, 0];
    dly.delayTime.value = Math.min(0.95, S16 * e[0]); dlyFb.gain.value = e[1];
    const dv = menu ? 0 : st.drive || 0; busDry.gain.value = 1 - 0.7 * dv; busDrv.gain.value = 0.45 * dv; // saturation of the whole bus (saturated electro, industrial techno)
    if (!retain) { swF.frequency.cancelScheduledValues(t); swF.frequency.setValueAtTime(menu ? mn.lp : st.sweep ? 500 : 20000, t); } swF.Q.value = !menu && st.sweep ? 5 : 0.7;
    eqL.gain.value = q[0]; eqM.frequency.value = q[1]; eqM.gain.value = q[2]; eqH.gain.value = q[3]; // station colour: low, mid, high
    mrevG.gain.value = menu ? 0.6 : st.rev == null ? 0.2 : st.rev; drumRv.gain.value = menu ? 0 : (KIT[st.kit] || KIT.k909).room;
    const parts = menu ? { d: mn.pad, a: mn.arp } : { b: st.b && st.b.p, d: st.d && st.d[0], c: st.c && st.c.p, g: st.g && st.g.p, a: st.a && st.a.p, l: st.l && st.l.p };
    for (const k in strip) { const P = PATCH[parts[k]] || {}, s = strip[k]; const E = menu ? {} : st, fx = (E.fx && E.fx[k]) || {}, tn = (E.toneFlt && E.toneFlt[k]) || 0; s.pan.pan.value = E.pan && E.pan[k] != null ? E.pan[k] : P.pan || 0; s.lp.frequency.value = tn < 0 ? 20000 * 0.015 ** -tn : 20000; s.hp.frequency.value = tn > 0 ? 20 * 100 ** tn : 20; /* tone: -1 dark (low-pass at 300 Hz) … +1 thin (high-pass at 2 kHz) */ s.fzIn.gain.value = 6 * (menu || st.fz == null ? 1 : st.fz); s.fzOut.gain.value = 0.3 * (!menu && st.mx && st.mx[k] != null ? st.mx[k] : 1); s.rv.gain.value = fx.rv != null ? fx.rv : P.rv || 0; s.ec.gain.value = fx.ec != null ? fx.ec : P.ec || 0; s.ch.gain.value = P.ch || 0; if (!retain) { s.gate.gain.cancelScheduledValues(t); s.gate.gain.setValueAtTime(1, t); } }
  }
  function quitGame() { // map changed from the menu: the music fades quickly; returns where the track is, for reprendre()
    if (!AC || !menu) return null; const t = AC.currentTime; tuneG.gain.cancelScheduledValues(t); tuneG.gain.setTargetAtTime(0, t, 0.03);
    return { stepSec: stp - (nextT - t) / S16, t: Date.now() };
  }
  function reprendre(m) { // after the reload: same spot in the track, allowing for the time elapsed; the new map's colour opens in 2 s
    if (!AC || !menu || !m || !(Date.now() - m.t < 8000)) return; const t = AC.currentTime + 0.05, lp = (MENU[M.id] || MENU.ville).lp;
    stp = Math.max(0, Math.ceil(m.stepSec + (Date.now() - m.t) / 1000 / S16)); nextT = t; t0 = t - stp * S16; resumed = true;
    tuneG.gain.cancelScheduledValues(t); tuneG.gain.setValueAtTime(0, t); tuneG.gain.linearRampToValueAtTime(lvl(), t + 0.5);
    swF.frequency.cancelScheduledValues(t); swF.frequency.setValueAtTime(Math.min(lp, 300), t); swF.frequency.exponentialRampToValueAtTime(lp, t + 2);
  }
  function setStation(i) {
    if (dk) endMix(); mixDone = null;
    station = (((i | 0) % ST.length) + ST.length) % ST.length;
    if (!AC) { S16 = 60 / ST[station].bpm / 4; return; }
    const t = AC.currentTime; // mechanical car-radio key (press then release: dry click, case resonance), brief crackle, then the station
    keyPress(t); // the two-stage clack, first tried for the box, which the user kept for this button
    tuneG.gain.cancelScheduledValues(t); tuneG.gain.setValueAtTime(0, t); tuneG.gain.setValueAtTime(0, t + 0.36); tuneG.gain.linearRampToValueAtTime(lvl(), t + 0.46); // shortcut: the pads of the old station finish ringing after the static (1 s at most), to be cut by one bus per station if audible
    const f = nz(t + 0.14, 0.22, 0.2, V.ui, 'bandpass', 900, 2); if (f) { f.frequency.setValueAtTime(900, t + 0.14); f.frequency.exponentialRampToValueAtTime(3200, t + 0.24); f.frequency.exponentialRampToValueAtTime(1300, t + 0.36); }
    for (let k = 0; k < 3; k++) nz(t + 0.14 + Math.random() * 0.2, 0.012, 0.25, V.ui, 'highpass', 2000);
    if (!menu) retune(t + 0.38);
  }
  function mapDef(m, i) { // map change (listening bench): stations, ambience and menu colour; i: optional station override
    if (dk ? m === dk.M2 : m === mixDone && i == null) return; // a DJ transition leads there, or has just led there: nothing to redo
    if (dk) endMix(); mixDone = null;
    M = m; ST = M.radio; TH = M.th; station = initialStation(); loadRadios(ST);
    if (i != null) station = clamp(i, 0, ST.length - 1);
    S16 = 60 / ST[station].bpm / 4;
    if (AC) { retune(AC.currentTime + 0.05, menu); if (menu) swF.frequency.setTargetAtTime((MENU[M.id] || MENU.ville).lp, AC.currentTime, 0.5); buildAmb(); } // in the menu, the shared track keeps playing: only its colour changes
  }
  mapDef(M);
  // ---------- scenery sound sources (SOUND.spots, SOUND.brief): sounds placed in the place by a map (waterfall, turbine, transformer, train…), heard according to the distance and the side of the listened car ----------
  // spots(id, [{ p: { x, y, z } (can move), son: a SOUNDS name, r: range in m, vol, int: 1 = indoors (the tunnel does not muffle it), occ: 0 to 1 = muffled (the scenery sets it) }, …]) ; id = the map that places them: another map silences them.
  // brief(label, p, vol, range): a brief sound at point p (train horn, foghorn, bridge expansion joint…). Everything goes through the 'amb' family.
  // shortcut: the sources of a map that was left stay plugged in at zero gain until the reload; to unplug for good if a map places dozens
  let SPOTS = [], spotsId = '';
  const EAR = { x: 0, y: 0, z: 0, th: 0 };
  const noiseV = (type, f, q, lv, d, rate, depth) => { const s = AC.createBufferSource(), g = gain(lv, d); s.buffer = nbuf; s.loop = true; s.connect(filt(type, f, q, g)); s.start(0, Math.random() * 2); if (rate) { const l = AC.createOscillator(); l.frequency.value = rate; l.connect(gain(lv * depth, g.gain)); l.start(); } };
  const oscV = (type, f, lv, d, rate, depth) => { const o = AC.createOscillator(); o.type = type; o.frequency.value = f; o.connect(gain(lv, d)); o.start(); if (rate) { const l = AC.createOscillator(); l.frequency.value = rate; l.connect(gain(depth, o.frequency)); l.start(); } };
  const SOUNDS = {
    waterfall: d => { noiseV('lowpass', 420, 0.5, 0.9, d); noiseV('bandpass', 1400, 0.4, 0.35, d, 0.3, 0.3); }, // low rumble and hiss of falling water
    turbine: d => { const lp = filt('lowpass', 520, 0.7, d); for (const [f, v] of [[50, 0.5], [100, 0.3], [150, 0.14], [300, 0.05]]) oscV('sawtooth', f, v, lp); noiseV('bandpass', 950, 6, 0.12, d); }, // 50 Hz and its harmonics, alternator whine
    transformer: d => { for (const [f, v] of [[100, 0.5], [200, 0.2], [400, 0.06]]) oscV('sine', f, v, d); }, // the hum of a transformer
    train: d => { noiseV('lowpass', 220, 0.7, 0.8, d, 3.2, 0.5); noiseV('bandpass', 2400, 2, 0.1, d, 6.4, 0.9); }, // rolling, rail clatter
    crusher: d => { noiseV('lowpass', 300, 0.8, 0.9, d, 1.7, 0.6); noiseV('bandpass', 2000, 1, 0.08, d, 9, 0.9); },
    chainsaw: d => { oscV('sawtooth', 96, 0.4, filt('bandpass', 900, 1.2, d), 7, 6); },
    chopper: d => { noiseV('lowpass', 180, 0.8, 0.9, d, 11, 0.9); },
    forest: d => { noiseV('bandpass', 620, 0.5, 0.5, d, 0.11, 0.6); noiseV('highpass', 5000, 0.5, 0.05, d, 0.07, 0.8); }, // wind in the larches
    whoosh: d => { noiseV('lowpass', 260, 0.6, 0.8, d); }, // tunnel ventilation
    murmurEgee: d => { noiseV('bandpass', 520, 0.7, 0.6, d, 0.11, 0.4); noiseV('bandpass', 1150, 0.9, 0.3, d, 0.17, 0.5); }, // egee: the voices of a café terrace
    beesEgee: d => { oscV('sawtooth', 210, 0.3, filt('bandpass', 620, 1.5, d), 13, 9); noiseV('bandpass', 300, 3, 0.3, d, 9, 0.4); }, // egee: a row of beehives
    jetArea51: d => { noiseV('lowpass', 700, 0.6, 0.9, d, 9, 0.12); noiseV('bandpass', 2400, 2, 0.14, d, 13, 0.3); oscV('sawtooth', 138, 0.05, filt('bandpass', 1900, 5, d), 0.4, 6); }, // a jet engine at full thrust: broadband roar, a crackling top, the whine of the compressor; the scenery sets its level (vol) with the throttle
    servoArea51: d => { oscV('sawtooth', 62, 0.3, filt('bandpass', 700, 3, d), 0.3, 2); oscV('sine', 50, 0.4, d); }, // the drive of a big dish: a thin motor whine over the 50 Hz of the pedestal
    dieselArea51: d => { const lp = filt('lowpass', 300, 0.7, d); oscV('sawtooth', 48, 0.4, lp, 11, 2); oscV('sawtooth', 96, 0.2, lp); }, // a diesel idling (tug, patrol pickup)
    rumbleLune: d => { oscV('sine', 55, 0.6, d, 0.7, 3); noiseV('lowpass', 110, 0.8, 0.9, d, 5, 0.3); }, // lune: a rocket engine felt through the ground and the chassis (nothing is heard in a vacuum): 55 Hz and a low rumble; the scenery sets its level with the thrust
    loudspeaker: d => { const bp = filt('bandpass', 1300, 2.5, d); for (const f of [392, 494, 587]) oscV('square', f, 0.12, bp, 5.5, 3); noiseV('highpass', 3000, 0.5, 0.03, d); }, // a street loudspeaker: a nasal chord that wobbles
    lavaVolcan: d => { noiseV('lowpass', 110, 0.8, 0.9, d, 0.7, 0.5); noiseV('bandpass', 260, 3, 0.25, d, 1.9, 0.9); }, // volcan: the lava lake, a low burble that heaves, and a plop that comes and goes
    hissVolcan: d => { noiseV('highpass', 4000, 0.6, 0.5, d, 0.23, 0.35); noiseV('bandpass', 1800, 1.2, 0.12, d, 0.4, 0.5); }, // volcan: a steam vent
  };
  function spots(id, L) { for (const l of SPOTS) if (l.g) { l.g.disconnect(); l.g = null; } spotsId = id; SPOTS = L || []; }
  const earSideO = (dx, dz, d) => clamp((dz * Math.cos(EAR.th) - dx * Math.sin(EAR.th)) / Math.max(d, 10), -1, 1) * 0.85; // from -1 (left) to 1 (right) of the listened car
  function spotsFrame(t, car, state, tun) {
    if (!SPOTS.length) return; const active = spotsId === M.id && state !== 'title';
    EAR.x = car.x || 0; EAR.y = car.y || 0; EAR.z = car.z || 0; EAR.th = car.th || 0; // (the listening bench has no car placed: it is at the origin)
    for (const l of SPOTS) {
      if (!l.g || l.ac !== AC) { if (!active) continue; l.ac = AC; l.pan = AC.createStereoPanner(); l.pan.connect(V.amb); l.lp = filt('lowpass', 800, 0.7, l.pan); l.g = gain(0, l.lp); SOUNDS[l.sound](l.g); }
      const dx = l.p.x - EAR.x, dz = l.p.z - EAR.z, d = Math.hypot(dx, dz, (l.p.y || 0) - EAR.y), a = clamp(1 - d / l.r, 0, 1), o = l.occ || 0;
      setParam(l.g.gain, active ? l.vol * a * a * (l.int ? 1 : 1 - 0.85 * tun) * (1 - o) : 0, t, 0.12); setParam(l.pan.pan, earSideO(dx, dz, d), t, 0.1); setParam(l.lp.frequency, 500 + 9000 * a * a * (1 - 0.7 * o), t, 0.15);
    }
  }
  const gustB = (t, dur, v, d, type, f, q = 0.7) => { const s = AC.createBufferSource(), g = AC.createGain(); s.buffer = nbuf; s.connect(filt(type, f, q, g)); g.connect(d); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + dur * 0.3); g.gain.linearRampToValueAtTime(0, t + dur); s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.02); };
  const noteL = (t, dur, v, d, type, f, f1) => { const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (f1) o.frequency.linearRampToValueAtTime(f1, t + dur); o.connect(g); g.connect(d); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + Math.min(0.04, dur * 0.3)); g.gain.setValueAtTime(v, t + dur * 0.8); g.gain.linearRampToValueAtTime(0, t + dur); o.start(t); o.stop(t + dur + 0.02); };
  const HITS = {
    honk: (t, d) => { const lp = filt('lowpass', 1700, 1, d); for (const f of [277, 370]) noteL(t, 1.4, 0.22, lp, 'sawtooth', f * 1.05, f * 0.95); }, // a locomotive horn; its pitch drops as it passes (Doppler effect)
    horn: (t, d) => { const lp = filt('lowpass', 520, 1, d); for (const f of [82, 123]) noteL(t, 2.8, 0.4, lp, 'sawtooth', f); }, // corne de brume
    joint: (t, d) => { gustB(t, 0.06, 0.9, d, 'bandpass', 1100, 0.8); noteL(t, 0.08, 0.5, d, 'sine', 150, 95); }, // tyres on a deck expansion joint: dry and mid, to sit above the waterfall's rumble
    whoosh: (t, d) => { gustB(t, 0.16, 0.3, d, 'bandpass', 1700, 0.8); }, // a pole passing very close
    crackle: (t, d) => { for (let k = 0; k < 6; k++) gustB(t + k * 0.11 + Math.random() * 0.05, 0.05, 0.45, d, 'highpass', 1500); gustB(t + 1.1, 0.5, 0.9, d, 'lowpass', 130); }, // a tree cracks, then hits the ground
    clarion: (t, d) => { const lp = filt('lowpass', 2200, 1, d); [392, 523, 659, 523, 659].forEach((f, k) => noteL(t + k * 0.24, 0.22, 0.2, lp, 'square', f)); },
    sizzle: (t, d) => { const g = AC.createGain(), l = AC.createOscillator(); g.connect(d); l.frequency.value = 100; l.connect(gain(0.5, g.gain)); l.start(t); l.stop(t + 0.9); gustB(t, 0.8, 0.25, g, 'highpass', 5200); }, // a high-voltage line
    hammer: (t, d) => { for (let k = 0; k < 3; k++) noteL(t + k * 0.34, 0.12, 0.2, d, 'sine', 1900, 1750); },
    halyardEgee: (t, d) => { const f = 1700 * (0.96 + Math.random() * 0.08); for (const [k, v] of [[1, 0.5], [2.7, 0.25], [4.1, 0.12]]) osc('sine', f * k, t, 0.05, v, d); }, // egee: a halyard tinks on a mast
    goatEgee: (t, d) => { for (const [f, dt] of [[1100, 0], [1480, 0.09]]) osc('triangle', f * (0.98 + Math.random() * 0.04), t + dt, 0.09, 0.5, d); }, // egee: a goat bell
    whumpEgee: (t, d) => { noteL(t, 0.1, 0.8, d, 'sine', 62, 50); gustB(t, 0.09, 0.4, d, 'lowpass', 180); }, // egee: a mill sail passes the tower
    bellTownEgee: (t, d) => { for (const [k, v] of [[1, 0.6], [2, 0.3], [2.76, 0.22], [5.4, 0.08]]) osc('sine', 330 * k, t, 2.5 / Math.sqrt(k), v, d); }, // egee: the bell of the town church
    bellChapelEgee: (t, d) => { for (const [k, v] of [[1, 0.6], [2, 0.3], [2.76, 0.22], [5.4, 0.08]]) osc('sine', 520 * k, t, 1.8 / Math.sqrt(k), v, d); }, // egee: the chapel's, higher
    chimeArea51: (t, d) => { const lp = filt('lowpass', 1800, 1, d); [659, 523, 392].forEach((f, k) => noteL(t + k * 0.42, 0.7, 0.16, lp, 'sine', f)); }, // the tower's three-note chime, no voice
    clangArea51: (t, d) => { for (const f of [410, 1130, 1870]) noteL(t, 0.5, 0.12, d, 'triangle', f, f * 0.99); gustB(t, 0.05, 0.5, d, 'bandpass', 2400, 2); }, // a pipe or a hatch struck somewhere in the gallery
    bird: (t, d) => { const f = 2800 + Math.random() * 1400; for (let k = 0; k < 3; k++) noteL(t + k * 0.13, 0.09, 0.4, d, 'sine', f, f * (1.1 + Math.random() * 0.3)); },
    bellPiliers: (t, d) => { for (const [f, v, dur] of [[220, 0.5, 4.5], [519, 0.25, 3], [607, 0.15, 2.2], [1188, 0.06, 1.2]]) osc('sine', f, t, dur, v, d); }, // a temple bell: a low hum and inharmonic partials that die one after the other
    chimePiliers: (t, d) => { for (let k = 0; k < 4; k++) osc('sine', [1568, 1760, 2093, 2349, 2637][Math.random() * 5 | 0], t + k * 0.12 + Math.random() * 0.2, 1.2, 0.12, d); }, // wind chimes under the eaves
    bellVolcan: (t, d) => { for (const [k, v] of [[1, 0.6], [2, 0.28], [2.76, 0.2], [5.4, 0.07]]) osc('sine', 440 * k, t, 3.2 / Math.sqrt(k), v, d); }, // volcan: the bell of the village church, one stroke
    pingLune: (t, d) => { osc('sine', 1320, t, 0.12, 0.35, d); osc('sine', 660, t + 0.05, 0.5, 0.14, d); }, // lune: the cabin radio picks up the transponder of a navigation antenna as the car passes it
    bipLune: (t, d) => { noteL(t, 0.06, 0.3, d, 'sine', 1000); }, // lune: the radar altimeter in flight (the scenery spaces them by the height left), and the countdown before the lip
    goLune: (t, d) => { noteL(t, 0.3, 0.3, d, 'sine', 1500); }, // lune: the long high beep that ends the countdown, at the lip
    chimeLune: (t, d) => { const lp = filt('lowpass', 2200, 1, d); noteL(t, 0.3, 0.2, lp, 'sine', 880); noteL(t + 0.3, 0.45, 0.2, lp, 'sine', 660); }, // lune: the two-note chime of a pressure door
    hissLune: (t, d) => { gustB(t, 0.5, 0.5, d, 'highpass', 3000); }, // lune: air at the mouth of a pressurised place
    thumpLune: (t, d) => { noteL(t, 1.2, 0.9, d, 'sine', 55, 38); gustB(t, 0.9, 0.9, d, 'lowpass', 120); }, // lune: a blow carried by the ground (a touchdown, a lift-off, a meteor impact, the rover's own landing)
  };
  function spotHit(label, p, vol = 1, r = 200) {
    if (!AC || !nbuf || spotsId !== M.id || !HITS[label]) return; const t = AC.currentTime + 0.02, dx = p.x - EAR.x, dz = p.z - EAR.z, d = Math.hypot(dx, dz, (p.y || 0) - EAR.y), a = clamp(1 - d / r, 0, 1); if (a <= 0) return;
    const pan = AC.createStereoPanner(); pan.pan.value = earSideO(dx, dz, d); pan.connect(V.amb); HITS[label](t, gain(0.2 * vol * a * a, pan)); // 0.2: peaks brought down to -25 dB, under the music (listening bench, offline measurement) setTimeout(() => pan.disconnect(), 6000);
  }
  function buildAmb() {
    if (M.id === 'canal') gustBuf(CHOPPER); if (M.id === 'givre' && !(BELLS && BELLS.ac === AC)) BELLS = Object.assign(bells(), { ac: AC }); // the helicopter, now written here rather than during the race
    if (acoustic) { const P = ACOUSTICS[M.id] || ACOUSTICS.attempt, n = Math.round(AC.sampleRate * P.dur), ir = AC.createBuffer(2, n, AC.sampleRate); // the room of the place
      for (let c = 0; c < 2; c++) { const x = ir.getChannelData(c); for (let i = 0; i < n; i++) x[i] = (Math.random() * 2 - 1) * Math.exp(-i / AC.sampleRate / (P.dur / 6.9)); } // -60 dB at the end of dur
      acoustic.conv.buffer = ir; acoustic.lp.frequency.value = P.lp; }
    if (ambBed) ambBed.disconnect();
    ambBed = gain(1, V.amb);
    for (const z of ambZG) z.g.disconnect(); if (ambEvG) ambEvG.disconnect(); ambEvG = gain(0.6, V.amb); // the events of a zoned map go through ambEvG: they also sound under the vault, where the map's bed falls silent
    ambZG = (AMBZ[M.id] || []).map(z => { const g = gain(0, V.amb); for (const [type, f, q, lv, rate, depth] of z.c) { const s = AC.createBufferSource(), gg = gain(lv, g); s.buffer = nbuf; s.loop = true; s.connect(filt(type, f, q, gg)); s.start(0, Math.random() * 2); if (rate) { const l = AC.createOscillator(); l.frequency.value = rate; l.connect(gain(lv * depth, gg.gain)); l.start(); } } return { z, g }; });
    for (const [type, f, q, lv, rate, depth] of AMB[M.id] || []) {
      const s = AC.createBufferSource(), g = gain(lv, ambBed); s.buffer = nbuf; s.loop = true; s.connect(filt(type, f, q, g)); s.start(0, Math.random() * 2);
      if (rate) { const l = AC.createOscillator(); l.frequency.value = rate; l.connect(gain(lv * depth, g.gain)); l.start(); }
    }
    if (CH) { CH.rootPt.disconnect(); for (const s of CH.src) try { s.stop(); } catch (e) { } CH = null; }
    if (M.id === 'chapada') soundChapada();
  }
  // ---------- chapada: the water and the places, on top of the ambience bed. Everything is filtered noise; the family is 'amb' ----------
  // The great waterfall is a placed source: its level and timbre follow the distance (the low end carries far, the high end only arrives from close), a pan puts it on the right side, the cave muffles it.
  // The rapids, the ford and the bridge boards are zone beds. The track cues come from the map's checkpoints (C.P), computed on the first frame.
  function soundChapada() {
    const rootPt = gain(0, V.amb), src = AC.createBufferSource(); src.buffer = nbuf; src.loop = true; src.start(0, Math.random() * 2);
    const pan = AC.createStereoPanner(); pan.connect(rootPt); const gC = gain(0, pan), lp = filt('lowpass', 600, 0.5, gC); src.connect(lp); src.connect(filt('lowpass', 130, 0.7, gain(1.6, gC))); // the waterfall: a wide whoosh whose low-pass opens as you approach, over a rumble
    const gR = gain(0, rootPt); src.connect(filt('bandpass', 2200, 0.7, gR)); src.connect(filt('lowpass', 300, 0.7, gain(0.7, gR))); // the rapids: brighter than the waterfall
    const gG = gain(0, rootPt), fG = filt('bandpass', 1200, 2.5, gG); src.connect(fG); // the ford: a splashing (the band jumps)
    const gP = gain(0, rootPt), pm = gain(0.5, gP), po = AC.createOscillator(); po.type = 'square'; po.frequency.value = 12; po.connect(gain(0.5, pm.gain)); po.start(); src.connect(filt('bandpass', 300, 1.5, pm)); src.connect(filt('bandpass', 760, 3, gain(0.5, pm))); // the bridge boards: a hammering of wood
    CH = { rootPt, src: [src, po], pan, gC, lp, gR, gG, fG, gP, po, water: false, tWater: -9, tG: 0, cooldown: 0, doneFlag: {}, idx: 0, tr: 0, sp: 0, N: 1, z: null };
  }
  function chapadaFrame(dt, e, t, k, tun, r) {
    const C = CH, c = e.car, N = e.T.n;
    if (!C.z) { const S = e.T.S, P = n => { const x = M.pts[n][0] * (M.sc || 1), z = M.pts[n][1] * (M.sc || 1); let b = 0, bd = 1e18; for (let i = 0; i < N; i++) { const d = (S[i].x - x) ** 2 + (S[i].z - z) ** 2; if (d < bd) { bd = d; b = i; } } return b; };
      C.N = N; C.z = { camp: [P(68), P(1)], marsh: [P(1), P(4)], macaws: [P(8) + 4, P(10) + 40], hairpins: [P(13), P(28)], bridge: [P(32) - 4, P(33) + 4], bats: [P(33) + 6, P(34)], howlers: [P(41) + 10, P(43) + 20],
        rapids: [P(49) - 10, P(52) + 6], onca: [P(52) - 34, P(52)], cite: [P(52), P(62)], ford: [P(63) - 8, P(64) + 8], seriema: [P(65), P(67)] }; }
    const within = ([a, b], f = 30) => { const i = (c.idx - a + N) % N, L = (b - a + N) % N; return i < L ? Math.min(1, i / f, (L - i) / f) : 0; };
    if (c.idx < C.idx - N / 2) C.tr++; C.idx = c.idx; C.sp = e.sp; // one more lap when the index crosses zero again (car.dist is not used: time trial resets it to zero every lap)
    for (const n of ['macaws', 'bats', 'howlers', 'onca', 'seriema']) if (within(C.z[n], 1) > 0 && C.doneFlag[n] !== C.tr && e.state !== 'title' && (n !== 'onca' || C.tr % 2 === 0)) { C.doneFlag[n] = C.tr; oneCry(n, t + 0.05, C.rootPt); } // the once-per-lap cries start at the entry to their zone (with the timer's randomness, short zones were being missed)
    k(C.rootPt.gain, e.state === 'title' ? 0 : 1, 0.3);
    // the great waterfall, at the back of the cirque (x 1036, z 243): you hear it from the top of the hairpins, it is on the left at the bridge, the cave muffles it
    const dx = 1036 - c.x, dz = 243 - c.z, d = Math.hypot(dx, dz), p = clamp(1 - d / 420, 0, 1), lat = (dz * Math.cos(c.th) - dx * Math.sin(c.th)) / Math.max(d, 1);
    k(C.gC.gain, 0.11 * p * p * (1 - 0.8 * tun), 0.3); k(C.lp.frequency, (300 + 5200 * p ** 3) * (1 - 0.85 * tun), 0.3); k(C.pan.pan, clamp(lat, -1, 1) * 0.8, 0.2);
    k(C.gR.gain, 0.05 * within(C.z.rapids), 0.3);
    const gu = within(C.z.ford, 10); k(C.gG.gain, 0.05 * gu, 0.2); if (gu > 0 && (C.tG -= dt) < 0) { C.tG = 0.08; C.fG.frequency.setTargetAtTime(800 + Math.random() * 1400, t, 0.02); }
    k(C.gP.gain, (c.air ? 0 : 0.09) * within(C.z.bridge, 4) * Math.min(1, r * 2), 0.06); k(C.po.frequency, 5 + e.sp * 0.7, 0.1);
    // entering the water (marsh, river, ford, jump landing): a dull plop, then the water falling back
    const water = !!(c.ground && c.ground.aq > 0.09) && !c.air; if (water && !C.water && e.sp > 8 && e.state !== 'title' && t - C.tWater > 1.5) { C.tWater = t; const v = Math.min(1, e.sp / 45); nz(t, 0.28, 0.3 * v, C.rootPt, 'lowpass', 320, 0.8); nz(t + 0.03, 0.7, 0.1 * v, C.rootPt, 'highpass', 2600, 0.7, nbuf, 0.02); } C.water = water;
    // the campfire, left of the start grid: it crackles (heard when stopped, no longer once rolling)
    const pf = clamp(1 - Math.hypot(c.x - 50, c.z + 11) / 120, 0, 1); /* the grid is 70-90 m from the fire */ if (pf > 0 && e.state !== 'title' && Math.random() < dt * 14 * pf) nz(t + Math.random() * 0.03, 0.005 + Math.random() * 0.012, 0.12 * pf * pf, C.rootPt, 'highpass', 1800 + Math.random() * 2500);
  }
  // the once-per-lap cries (launched by chapadaFrame at the entry to their zone), in d
  function oneCry(n, t, d) {
    const rnd = (a, b) => a + Math.random() * (b - a);
    if (n === 'macaws') for (let k = 0; k < 3; k++) { const o = AC.createOscillator(), g = AC.createGain(), t0 = t + k * 0.42; o.type = 'sawtooth'; o.frequency.setValueAtTime(940, t0); o.frequency.linearRampToValueAtTime(760, t0 + 0.26);
      o.connect(filt('bandpass', 2100, 3, g)); g.connect(d); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.055, t0 + 0.03); g.gain.linearRampToValueAtTime(0, t0 + 0.28); o.start(t0); o.stop(t0 + 0.3); } // the harsh cry of macaws flying past
    if (n === 'bats') { for (let k = 0; k < 16; k++) osc('sine', rnd(7000, 9000), t + k * 0.04 + rnd(0, 0.02), 0.012, 0.02, d); nz(t, 0.7, 0.025, d, 'bandpass', 3000, 1.5, nbuf, 0.1); } // the flock leaves the cave
    if (n === 'howlers') for (let w = 0; w < 3; w++) { const t0 = t + w * 1.05, a = nz(t0, 1.3, 0.13, d, 'bandpass', 430, 6, nbuf, 0.35), b = nz(t0, 1.3, 0.06, d, 'bandpass', 820, 6, nbuf, 0.35); // howler monkeys: three low, harsh waves, when braking at the idol
      if (a) { a.frequency.setValueAtTime(430, t0); a.frequency.linearRampToValueAtTime(300, t0 + 1.2); } if (b) { b.frequency.setValueAtTime(820, t0); b.frequency.linearRampToValueAtTime(600, t0 + 1.2); } }
    if (n === 'onca') for (let k = 0; k < 14; k++) nz(t + k / 12, 0.06, 0.13, d, 'bandpass', rnd(160, 200), 3); // the onça: a sawn-off growl, every other lap
    if (n === 'seriema') { let tt = t; for (let k = 0; k < 12; k++) { const o = osc('sine', 1600, tt, 0.09, 0.03, d); if (o) { o.frequency.setValueAtTime(1600, tt); o.frequency.exponentialRampToValueAtTime(1100, tt + 0.08); } tt += 0.12 + 0.13 * Math.abs(k - 6) / 6; } } // the seriema: a cascade of yelps, before the camp
  }
  // the chapada beasts that come back, by sector (called like ambEvent: returns the delay before the next event)
  function evChapada(t) {
    const C = CH; if (!C || !C.z) return 1; const i = C.idx, Z = C.z, d = ambBed, rnd = (a, b) => a + Math.random() * (b - a), en = ([a, b]) => (i - a + C.N) % C.N < (b - a + C.N) % C.N;
    if (en(Z.camp) && C.sp < 6 && t > C.cooldown) { C.cooldown = t + 25; for (let k = 0; k < 3; k++) { nz(t + k * 0.22, 0.09, 0.1, d, 'bandpass', 900, 5); osc('square', 380, t + k * 0.22, 0.07, 0.015, d); } return 3; } // stopped on the grid: the toucan croaks
    if (en(Z.marsh)) { if (Math.random() < 0.6) { osc('sine', 1100, t, 0.045, 0.05, d); osc('sine', 2200, t, 0.03, 0.02, d); } else for (let k = 0; k < 5; k++) osc('sine', 2400, t + k * 0.05, 0.016, 0.03, d); return rnd(0.4, 1.2); } // the blacksmith frog (a hammer on the anvil) and the chorus
    if (en(Z.hairpins)) { osc('sine', 2100, t, 0.17, 0.045, d); osc('sine', 3430, t, 0.1, 0.03, d); return rnd(3, 7); } // the araponga: a cracked bell strike, in the distance
    if (en(Z.cite)) { for (let k = 0, n = 4 + Math.random() * 4 | 0; k < n; k++) { const f = rnd(3000, 4200), o = osc('sine', f, t + k * 0.08, 0.06, 0.035, d); o && o.frequency.exponentialRampToValueAtTime(f * 1.3, t + k * 0.08 + 0.05); } return rnd(2, 5); } // a chattering of parakeets above the square
    return rnd(1.5, 4); // elsewhere: the bed alone (foliage, cicadas)
  }
  function roar(t, v) { // the crowd: a roar that rises and falls back, and a few whistles; v = strength (1: that of the stadium stands)
    const rnd = (a, b) => a + Math.random() * (b - a), c = nz(t, 2.6, 0.22 * v, ambBed, 'bandpass', 900, 0.6, nbuf, 0.5); c && c.frequency.linearRampToValueAtTime(1300, t + 0.8);
    for (let i = 0; i < 3; i++) { const f = rnd(1800, 2600), o = osc('sine', f, t + rnd(0.3, 1.5), 0.35, 0.025 * v, ambBed); o && o.frequency.linearRampToValueAtTime(f * 1.25, t + 2); } }
  function ambEvent(t) { // events of the place, spaced at random; returns the delay before the next
    const id = M.id, rnd = (a, b) => a + Math.random() * (b - a);
    if (id === 'chapada') return evChapada(t);
    if (id === 'touge') { const f = Math.random() < 0.7 ? 4300 : 5100; for (let i = 0; i < 6; i++) osc('sine', f, t + i * 0.03, 0.014, 0.05, ambBed); return rnd(0.6, 1.4); } // grillons
    if (id === 'paris') { for (let i = 0, n = 2 + Math.random() * 4 | 0, f = rnd(2600, 3800); i < n; i++) { const o = osc('sine', f, t + i * 0.11, 0.08, 0.04, ambBed); o && o.frequency.exponentialRampToValueAtTime(f * rnd(0.8, 1.4), t + i * 0.11 + 0.07); } return rnd(1.5, 5); } // oiseaux
    if (id === 'wangan') { for (const [type, f] of [['sawtooth', 98], ['square', 147]]) { const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.value = f; o.connect(filt('lowpass', 420, 0.7, g)); g.connect(ambBed);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 0.4); g.gain.setValueAtTime(0.05, t + 2.2); g.gain.linearRampToValueAtTime(0, t + 3); o.start(t); o.stop(t + 3.1); } return rnd(25, 45); } // corne de navire
    if (id === 'canal') { burstN(CHOPPER, t, ambBed, 'lowpass', 260); return rnd(30, 50); } // helicopter passing in the distance
    if (id === 'ville') { const o = AC.createOscillator(), g = AC.createGain(); o.frequency.setValueAtTime(620, t); for (let i = 0; i < 4; i++) { o.frequency.linearRampToValueAtTime(840, t + i + 0.5); o.frequency.linearRampToValueAtTime(620, t + i + 1); }
      o.connect(filt('lowpass', 1200, 0.7, g)); g.connect(ambBed); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.03, t + 1.5); g.gain.linearRampToValueAtTime(0, t + 4); o.start(t); o.stop(t + 4.1); return rnd(25, 50); } // distant siren
    if (id === 'stade') { roar(t, 1); return rnd(6, 12); }
    if (id === 'area51') { if (ambUnder > 0.5) return rnd(5, 10); // indoors the scenery places its own sounds
      if (Math.random() < 0.5) { const o = osc('sine', rnd(520, 640), t, 1.6, 0.025, ambEvG); o && o.frequency.exponentialRampToValueAtTime(rnd(820, 980), t + 0.5); o && o.frequency.exponentialRampToValueAtTime(rnd(560, 620), t + 1.5); } // a coyote, far off
      else gustB(t, rnd(0.25, 0.7), 0.05, ambEvG, 'bandpass', 2600, 1.5); return rnd(30, 70); } // or a short burst of radio static, no voice
    if (id === 'lune') { const D = ambEvG, f0 = Math.random() < 0.5 ? 118 : 168, n = 3 + (Math.random() * 3 | 0), out = filt('highpass', 500, 0.7, filt('lowpass', 2600, 0.7, D)); let u = t + 0.18; // the radio in the cabin, wordless: squelch, a beep, three to five syllables of one of two voices, the key released; one time in three a two-tone roger
      gustB(t, 0.1, 0.05, D, 'bandpass', 2500, 0.8); osc('sine', 1040, t + 0.08, 0.07, 0.03, D);
      for (let i = 0; i < n; i++, u += 0.13 + Math.random() * 0.08) { const f = f0 * (0.85 + Math.random() * 0.3); for (const F of VOY[Math.random() * 5 | 0]) noteL(u, 0.11, 0.12, filt('bandpass', F, 6, out), 'sawtooth', f, f * 0.9); }
      gustB(u, 0.06, 0.05, D, 'bandpass', 2500, 0.8); if (Math.random() < 0.33) { osc('sine', 880, u + 0.14, 0.08, 0.03, D); osc('sine', 1175, u + 0.26, 0.1, 0.03, D); }
      return ambPos < 0.1 || ambPos > 0.9 ? rnd(8, 15) : rnd(15, 30); } // more traffic near the base
    if (id === 'givre') { nowPlaying((BELLS && BELLS.ac === AC ? BELLS : BELLS = Object.assign(bells(), { ac: AC }))[Math.random() * 4 | 0], t, ambBed); return rnd(20, 40); } // sleigh bells, in the distance
    if (id === 'egee') { const p = ambPos, port = p < 0.138 || p >= 0.934, balcon = p >= 0.596 && p < 0.745; if (p > 0.2 && p < 0.5) ambCall = 0; // the place decides the event (fractions of the lap, as AMBZ.egee)
      if (balcon && !ambCall) { ambCall = 1; const lp = filt('lowpass', 420, 0.7, ambEvG); for (const f of [87, 131]) { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sawtooth'; o.frequency.value = f; o.connect(g); g.connect(lp);
          g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.03, t + 0.4); g.gain.setValueAtTime(0.03, t + 1.7); g.gain.linearRampToValueAtTime(0, t + 2.4); o.start(t); o.stop(t + 2.5); } return rnd(5, 9); } // the ferry's horn from the horizon, once per lap
      if (port || balcon) { const pan = AC.createStereoPanner(), bp = filt('bandpass', 1500, 1.5, pan), v = Math.random() * 3 | 0, f = rnd(1600, 2000); pan.pan.value = rnd(-0.8, 0.8); pan.connect(ambEvG); // a gull, left or right, three calls: one long falling cry, two short ones, a laugh
        for (let i = 0, n = [1, 2, 4][v]; i < n; i++) { const d = [0.36, 0.2, 0.11][v], o = osc('sawtooth', f, t + i * (d + 0.06), d, 0.05, bp); o && o.frequency.exponentialRampToValueAtTime(f * (v === 2 ? 0.8 : 0.5), t + i * (d + 0.06) + d * 0.85); } return rnd(6, 14); }
      if (p < 0.426) { const c = nz(t, 2, 0.05, ambEvG, 'bandpass', 420, 0.6, nbuf, 0.7); c && c.frequency.linearRampToValueAtTime(620, t + 1); return rnd(9, 16); } // the Ascension: a gust of the meltemi, 2 s
      return 8; }
    if (id === 'volcan') { const p = ambPos, D = ambEvG, port = p >= 0.924 || p < 0.061, farm = p >= 0.061 && p < 0.237, high = p >= 0.237 && p < 0.613, down = p >= 0.711 && p < 0.889, coast = p >= 0.889 && p < 0.924; // the place decides the event (fractions of the lap, as AMBZ.volcan)
      if (ambUnder > 0.5 || !(port || farm || high || down || coast)) return rnd(3, 6); // nothing under the galleries nor on the caldera floor
      if (port && Math.random() < 0.3) { for (const [k, v] of [[1, 0.035], [2.4, 0.015], [3.9, 0.006]]) osc('sine', 330 * k, t, 1.8 / k, v, D); return rnd(5, 9); } // a buoy's bell out in the bay, dull
      if (port || coast || (down && Math.random() < 0.4)) { const pan = AC.createStereoPanner(), bp = filt('bandpass', 1500, 1.5, pan), v = Math.random() * 3 | 0, f = rnd(1500, 1900); pan.pan.value = rnd(-0.8, 0.8); pan.connect(D); // a gull, left or right, three calls (the egee recipe): one long falling cry, two short ones, a laugh
        for (let i = 0, n = [1, 2, 4][v]; i < n; i++) { const d = [0.36, 0.2, 0.11][v], o = osc('sawtooth', f, t + i * (d + 0.06), d, 0.05, bp); o && o.frequency.exponentialRampToValueAtTime(f * (v === 2 ? 0.8 : 0.5), t + i * (d + 0.06) + d * 0.85); } return rnd(6, 12); }
      if (farm || down) { const pan = AC.createStereoPanner(), o = osc('sawtooth', rnd(380, 460), t, 0.7, 0.014, filt('bandpass', 800, 3, pan)); pan.pan.value = rnd(-0.8, 0.8); pan.connect(D); if (o) for (let i = 0; i < 8; i++) o.frequency.setValueAtTime(o.frequency.value * (i % 2 ? 0.95 : 1.05), t + i * 0.09); return rnd(5, 9); } // a sheep, left or right
      for (let i = 0, n = 2 + (Math.random() * 2 | 0); i < n; i++) { const o = osc('sawtooth', rnd(260, 300), t + i * 0.34, 0.2, 0.03, filt('bandpass', 1100, 4, D)); o && o.frequency.linearRampToValueAtTime(220, t + i * 0.34 + 0.2); } return rnd(12, 20); } // the highland: a raven, two or three hoarse calls
    if (id === 'autoroute') { const p = ambPos, D = ambEvG; // the place decides the event (fractions of the lap, as AMBZ.autoroute); never regular
      if (ambUnder > 0.5) { osc('sine', rnd(1800, 2600), t, 0.02, 0.05, D); return rnd(1, 3); } // the metro: a drip
      if (p >= 0.223 && p < 0.628 && Math.random() < 0.4) { const c = nz(t, 0.8, 0.04, D, 'bandpass', 180, 6); c && c.frequency.linearRampToValueAtTime(120, t + 0.8); return rnd(9, 18); } // the flood and the motorway: a long creak of metal (a grounded barge, a hanging slab)
      if (p < 0.223 || p >= 0.96) { if (Math.random() < 0.6) for (let i = 0; i < 2; i++) { const o = osc('sine', 300, t + i * 0.45, 0.35, 0.03, D); o && o.frequency.linearRampToValueAtTime(260, t + i * 0.45 + 0.3); } // the boulevard: a dove coos
        else for (let i = 0; i < 2; i++) { const c = nz(t + i * 0.3, 0.18, 0.04, D, 'bandpass', 1400, 4); c && c.frequency.linearRampToValueAtTime(900, t + i * 0.3 + 0.18); } return rnd(5, 11); } // or a crow, far off
      return rnd(4, 8); }
    if (id === 'piliers') { const p = ambPos, D = ambEvG; if (ambUnder > 0.5) return rnd(2, 4); // nothing under the vault
      if (p < 0.16 || p > 0.92) { for (let i = 0, n = 2 + Math.random() * 4 | 0, f = rnd(2600, 4000); i < n; i++) { const o = osc('sine', f, t + i * 0.11, 0.08, 0.035, D); o && o.frequency.exponentialRampToValueAtTime(f * rnd(0.8, 1.4), t + i * 0.11 + 0.07); } return rnd(3, 8); } // songbirds in the woods
      if ((p > 0.16 && p < 0.42) || (p > 0.7 && p < 0.9)) { const o = osc('sine', rnd(2300, 2700), t, 0.8, 0.03, D); o && o.frequency.exponentialRampToValueAtTime(1500, t + 0.7); return rnd(8, 15); } // a raptor's cry over the void, far
      return rnd(4, 8); }
    if (id === 'perse') { const p = ambPos, D = ambEvG; // the place decides the event: fractions of the lap, or the vault (ambUnder)
      if (ambUnder > 0.5) { if (Math.random() < 0.6) { const f = rnd(1900, 2700), n = 3 + Math.random() * 4 | 0; for (let i = 0; i < n; i++) osc('triangle', f * (i % 2 ? 1.5 : 1), t + i * 0.19, 0.09, 0.035, D); } // a coppersmith's hammer
        else { const o = osc('sawtooth', rnd(170, 230), t, 0.9, 0.03, filt('bandpass', 950, 2, D)); o && o.frequency.linearRampToValueAtTime(rnd(240, 300), t + 0.5); } return rnd(0.8, 2.2); } // or a merchant's call
      if (p > 0.3 && p < 0.365) { nowPlaying((BELLS && BELLS.ac === AC ? BELLS : BELLS = Object.assign(bells(), { ac: AC }))[Math.random() * 4 | 0], t, D); return rnd(1.2, 2.5); } // the caravan's bells, as you run alongside it
      if (p > 0.632 && p < 0.72) { for (let i = 0, n = 2 + Math.random() * 4 | 0, f = rnd(2800, 4200); i < n; i++) { const o = osc('sine', f, t + i * 0.1, 0.07, 0.035, D); o && o.frequency.exponentialRampToValueAtTime(f * rnd(0.8, 1.4), t + i * 0.1 + 0.06); } return rnd(0.8, 2.5); } // the garden birds
      if (p > 0.872 && p < 0.994) { if (p > 0.94 && !ambCall) { ambCall = 1; [0, 2, 3, 2, 0, -2, 0].forEach((d, i) => { const f = 392 * 2 ** (d / 12), o = osc('sine', f, t + i * 0.8, 0.9, 0.022, D); o && o.frequency.linearRampToValueAtTime(f * 1.02, t + i * 0.8 + 0.7); }); return 6; } // the distant call (a flute), once per lap, on the way back to the line
        const o = osc('sawtooth', rnd(180, 260), t, 0.6, 0.028, filt('bandpass', 1100, 2, D)); o && o.frequency.linearRampToValueAtTime(rnd(220, 320), t + 0.35); for (let i = 0; i < 4; i++) nz(t + 0.9 + i * 0.16, 0.05, 0.05, D, 'lowpass', 700, 0.7); return rnd(1.2, 3); } // a merchant's cry, hooves
      if (p < 0.28 || p >= 0.994) { ambCall = 0; if (Math.random() < 0.5) for (let i = 0, n = 2 + (Math.random() * 2 | 0); i < n; i++) nz(t + i * 0.28, 0.12, 0.05, D, 'bandpass', rnd(420, 560), 3); // the plain: a dog, far off
        else { const o = osc('sawtooth', 420, t, 0.7, 0.012, filt('bandpass', 800, 3, D)); if (o) for (let i = 0; i < 8; i++) o.frequency.setValueAtTime(i % 2 ? 400 : 440, t + i * 0.09); } return rnd(4, 9); } // or a bleat
      if (p > 0.369 && p < 0.52) { const c = nz(t, 2.4, 0.06, D, 'bandpass', 500, 0.8, nbuf, 1); c && c.frequency.linearRampToValueAtTime(900, t + 1.2); return rnd(3, 6); } // the staircase and the terrace: a gust over the height
      return 3; }
    return 10;
  }
  // ---------- DJ transition (MULTI-PISTE track): two turntables, like a DJ mixing two records ----------
  // A turntable = the chain from chain() and the sequencer state. The 'home' turntable lives in the module's variables; during a transition,
  // the second one is stored in dk.B and takes their place while its steps are written (stash / pose).
  const stash = () => ({ ST, station, S16, t0, nextT, stp, strip, was, drumF, drumG, kdrv, swF, busDry, busDrv, duckG, bsat, fuzz, acid, dly, dlyFb, echoIn, choIn, revIn, mrevG, drumRv,
    eqL, eqM, eqH, hpF, djF, djL, fad, secG, gritDry, gritWet, tuneG, bigS, lastFill, lastRoll, exitAt, curRoot, lastN, lastB, voiceL, entering });
  const pose = d => ({ ST, station, S16, t0, nextT, stp, strip, was, drumF, drumG, kdrv, swF, busDry, busDrv, duckG, bsat, fuzz, acid, dly, dlyFb, echoIn, choIn, revIn, mrevG, drumRv,
    eqL, eqM, eqH, hpF, djF, djL, fad, secG, gritDry, gritWet, tuneG, bigS, lastFill, lastRoll, exitAt, curRoot, lastN, lastB, voiceL, entering } = d);
  // each map's station in MULTI-PISTE: club tracks with a steady kick drum, easy to line up with one another
  const DJS = { ville: 1, touge: 0, wangan: 0, paris: 0, canal: 1, stade: 2, givre: 1, terre: 2 }, djSt = m => Math.min(DJS[m.id] || 0, m.radio.length - 1);
  // mixer(M2, dur), SOUND.mix: the transition to map M2's station, finished after dur seconds. On the grid of the old track (A):
  //   turntable B starts at the next bar, locked to A's tempo and beats, without its bass (low cut), and fades in;
  //   halfway, the bass is swapped (A's low end leaves, B's arrives); A closes (a falling high cut), then A stops
  //   letting its echo trail (echo out) while its fade finishes; the bus compression glues the two tracks together while they play together.
  //   The shared tempo glides from A's to B's (both turntables follow it, so they stay locked); at the end B is alone, at its own tempo.
  // At the end, the state is that of mapDef(M2), with the map's MULTI-PISTE station (djSt).
  function mixer(M2, dur) {
    if (!AC || menu) return mapDef(M2, djSt(M2));
    if (dk) endMix();
    const now = AC.currentTime, A = stash(), tS = nextT + ((16 - stp % 16) % 16) * S16, tE = Math.max(now + dur, tS + 8 * S16), L = tE - tS, bA = 60 / S16 / 4;
    loadRadios(ST, M2.radio); chain(); ST = M2.radio; station = djSt(M2); entering = true; retune(tS); tuneG.gain.value = lvl(); S16 = A.S16; // turntable B, built in the module's variables
    const bB = ST[station].bpm, B = stash(); pose(A);
    const lin = (p, pts) => { p.cancelScheduledValues(now); p.setValueAtTime(p.value, now); for (const [u, v, ex] of pts) p[ex ? 'exponentialRampToValueAtTime' : 'linearRampToValueAtTime'](v, tS + u * L); };
    const tX = 0.5; // bass swap
    B.fad.gain.value = 0; lin(B.fad.gain, [[0, 0], [0.35, 0.65], [0.65, 1]]);
    lin(B.djF.frequency, [[0, 380, 1], [tX, 380, 1], [tX + 0.06, 10, 1]]);
    lin(A.djF.frequency, [[0, 10, 1], [tX, 10, 1], [tX + 0.06, 380, 1]]);
    lin(A.djL.frequency, [[tX + 0.06, 20000, 1], [0.85, 700, 1]]);
    lin(A.fad.gain, [[0.4, 1], [0.6, 0.7], [0.95, 0]]);
    lin(A.dlyFb.gain, [[0.7, A.dlyFb.gain.value], [0.8, 0.62]]); lin(A.echoIn.gain, [[0.7, 1], [0.8, 2]]);
    lin(mixDry.gain, [[0, 1], [0.15, 0], [0.85, 0], [1, 1]]); lin(mixW.gain, [[0, 0], [0.15, 1.1], [0.85, 1.1], [1, 0]]);
    dk = { M2, A, B, tS, tE, L, bA, bB, stopA: tS + 0.8 * L };
  }
  const bpmA = t => { const u = clamp((t - dk.tS) / dk.L, 0, 1), v = clamp((u - 0.1) / 0.8, 0, 1); return lerp(dk.bA, dk.bB, v * v * (3 - 2 * v)); }; // shared tempo of the transition
  function endMix() { // turntable B becomes the home turntable (forced: cut short, and the old one falls silent at once)
    const now = AC.currentTime, A = stash(), d = dk; dk = null; pose(d.B); entering = false; S16 = 60 / ST[station].bpm / 4;
    for (const [p, v] of [[A.fad.gain, 0], [fad.gain, 1], [djF.frequency, 10], [djL.frequency, 20000], [mixDry.gain, 1], [mixW.gain, 0]]) { p.cancelScheduledValues(now); p.setTargetAtTime(v, now, 0.05); }
    if (live) setTimeout(() => A.fad.disconnect(), 6000); // the old turntable's echoes have died out
    M = d.M2; TH = M.th; mixDone = M; buildAmb();
  }
  function advance(ah) { // writes the home turntable's steps up to ah seconds ahead of the clock (during a transition: at the shared tempo)
    while (nextT < AC.currentTime - 0.2) { nextT += S16; stp++; } // tab in the background: skip ahead instead of catching up
    while (nextT < AC.currentTime + ah) { if (dk) S16 = 60 / bpmA(nextT) / 4; sched(stp++, nextT); nextT += S16 / (1 - 0.1 * turntable); }
  }
  function pump() { // advances the sequencer up to 0.25 s ahead of the audio clock (0.5 s during a DJ transition: the next map is being built): a frame that stalls (rain at the WAN-9 port, garbage collection, compiled shader) no longer leaves a gap; the music reacts to race events up to 0.25 s later
    if (EC.pause) { nextT = Math.max(nextT, AC.currentTime + 0.05); return; } // music editor stopped: the sequencer waits, the context stays open to try a note
    if (!dk) return advance(0.25);
    if (AC.currentTime >= dk.tE) { endMix(); return advance(0.25); }
    const A = stash(); pose(dk.B); advance(0.5); dk.B = stash(); pose(A); // turntable B
    if (nextT < dk.stopA) advance(0.5); else nextT = Math.max(nextT, AC.currentTime); // turntable A stops at 80%: only its echo continues
  }
  // Engines: n = firings per two-revolution cycle; irr = weight of the harmonics between two firings (the gallop of a cross-plane V8, the song of a 5-cylinder);
  // rasp = the rasp (noise chopped at the firing rate); pipe = resonance of the exhaust line (Hz). The rotary: two rotors, smooth and very rasping.
  // Physical engine model, after Baldan, Lachambre, Delle Monache, Boussard, "Physically informed car engine sound synthesis for virtual and augmented environments" (2015),
  // and its Web Audio transcription by Antonio-R1 (engine-sound-generator, MIT): each cylinder pushes an impulse (piston + ignition) into waveguides
  // (intake, cylinder, exhaust, manifold) whose valves open and close the ends; the manifolds join in a straight tube, a silencer
  // (waveguides in parallel) and an exitAt. What you hear: the exhaust outlet, plus the intake and the vibrations of the blk. Lengths in samples at 44.1 kHz.
  // n: cylinders (firings per two-revolution cycle); irr: force difference between cylinders and from one cycle to the next (the grain); off: timing offset of each (cross-plane V8: slightly uneven, hence the gallop); ign: ignition duration (fraction of a cycle)
  const MOTOR = {
    l4: { n: 4, ign: 0.016, irr: 0.2, int: 100, exh: 100, ext: 100, str: 128, muf: [10, 15, 20, 25], out: 5 },
    l5: { n: 5, ign: 0.016, irr: 0.25, int: 90, exh: 110, ext: 90, str: 140, muf: [12, 17, 23, 29], out: 6 },
    l6: { n: 6, ign: 0.014, irr: 0.15, int: 80, exh: 90, ext: 80, str: 120, muf: [9, 13, 18, 24], out: 5 },
    v8: { n: 8, ign: 0.012, irr: 0.3, int: 120, exh: 140, ext: 120, str: 180, muf: [14, 20, 27, 35], out: 8, off: [0, 0.14, 0.24, 0.395, 0.5, 0.61, 0.76, 0.855] },
    v10: { n: 10, ign: 0.01, irr: 0.18, int: 90, exh: 100, ext: 90, str: 150, muf: [11, 16, 22, 28], out: 6 },
    rot: { n: 4, ign: 0.03, irr: 0.1, int: 60, exh: 50, ext: 60, str: 100, muf: [8, 12, 16, 20], out: 4 },
  };
  const TRUCK = { n: 6, ign: 0.02, irr: 0.2, int: 160, exh: 200, ext: 160, str: 260, muf: [20, 28, 36, 46], out: 10 }; // heavy traffic diesel, running around 1,500 rpm
  // Acoustics of the place: what the walls, facades and terrain send back (engine, tyres, impacts). slap = delay of the first echo (s), sl = its level,
  // wall = what the road edge adds when you hug it (facades, guardrails, walls; 0 on open ground), rv = reverb, dur = its duration (s), lp = its clarity (Hz).
  // In a tunnel, the echo becomes short and strong, and the tunnel reverb (rev) takes over.
  const ACOUSTICS = {
    ville: { slap: 0.034, sl: 0.3, intoWall: 1, rv: 0.12, dur: 1.2, lp: 4000 }, // narrow streets between the towers
    touge: { slap: 0.16, sl: 0.12, intoWall: 0.4, rv: 0.06, dur: 2.2, lp: 2500 }, // the mountain returns the echo from afar; forest that muffles it
    chapada: { slap: 0.11, sl: 0.1, intoWall: 0.5, rv: 0.07, dur: 1.9, lp: 2600 }, // a forest valley: the echo comes back from the trunks and the walls of the city, quickly muffled
    wangan: { slap: 0.022, sl: 0.2, intoWall: 0.8, rv: 0.06, dur: 1, lp: 4500 }, // elevated motorway between two concrete barriers
    paris: { slap: 0.028, sl: 0.3, intoWall: 1, rv: 0.14, dur: 1.4, lp: 3800 }, // stone facades
    canal: { slap: 0.05, sl: 0.25, intoWall: 0.7, rv: 0.1, dur: 1.6, lp: 3500 }, // the concrete bed of the canal
    stade: { slap: 0.09, sl: 0.25, intoWall: 0.5, rv: 0.45, dur: 3, lp: 3000 }, // covered arena: large hall
    barrage: { slap: 0.14, sl: 0.12, intoWall: 0.5, rv: 0.1, dur: 2, lp: 3000 }, // steep valley: the echo returns from afar
    givre: { slap: 0.06, sl: 0.04, intoWall: 0.2, rv: 0.03, dur: 0.8, lp: 2000 }, // snow absorbs the sound
    terre: { slap: 0.12, sl: 0.06, intoWall: 0, rv: 0.03, dur: 1, lp: 2500 }, // open scrubland
    egee: { slap: 0.17, sl: 0.12, intoWall: 0.35, rv: 0.04, dur: 1.3, lp: 3400 }, // open air; the cliff of the Ascension and the Balcon returns one short echo
    piliers: { slap: 0.30, sl: 0.1, intoWall: 0.5, rv: 0.05, dur: 2.6, lp: 3000 }, // the pillars answer from far: a long late echo
    volcan: { slap: 0.28, sl: 0.1, intoWall: 0.55, rv: 0.06, dur: 2.0, lp: 3200, spots: [[0.645, 0.683, 2.5]] }, // quick returns off the basalt scarps in the open; the walled floor of the caldera answers more (the galleries take the tunnel's own reverb)
    perse: { slap: 0.045, sl: 0.22, intoWall: 0.7, rv: 0.09, dur: 2.6, lp: 3400, spots: [[0.455, 0.468, 3.5], [0.523, 0.624, 4.5]] }, // earth facades; spots = [from, to, factor] on the place's room, in fractions of the lap: the passage under the Porte des Nations, the hall of a hundred columns
    area51: { slap: 0.13, sl: 0.08, intoWall: 0.3, rv: 0.04, dur: 1.8, lp: 2800 }, // open basin; the hall and the underground take the tunnel reverb (the scenery declares them indoor)
    autoroute: { slap: 0.05, sl: 0.25, intoWall: 0.9, rv: 0.1, dur: 1.5, lp: 3600, spots: [[0.669, 0.703, 3.5], [0.898, 0.935, 4.5]] }, // facades both sides: a quick slap; a longer room in the cave and in the tram stop (the covered trench takes the tunnel reverb)
    lune: { slap: 0.012, sl: 0.03, intoWall: 0.15, rv: 0.01, dur: 0.5, lp: 1400 }, // no air: no echo at all outside, only the cabin; the hall and the tunnel take the tunnel reverb
    attempt: { slap: 0.04, sl: 0.1, intoWall: 0.5, rv: 0.05, dur: 1, lp: 3000 },
  };
  const MOTOR_JS = `
class WG { // wave guide: two delay lines (forward, back); a, b: reflection at the left and right ends
  constructor(L, a, b) { this.L = L; this.r = new Float32Array(L); this.l = new Float32Array(L); this.p = 0; this.a = a; this.b = b; this.oL = 0; this.oR = 0; }
  step(iL, iR) { const p = this.p, xr = this.r[p], xl = this.l[p]; this.oR = xr * (1 - this.b); this.oL = xl * (1 - this.a); this.r[p] = iL + xl * this.a; this.l[p] = iR + xr * this.b; this.p = p + 1 === this.L ? 0 : p + 1; }
}
const mix = (v, o, c) => c + (o - c) * v, TAU = 2 * Math.PI, PB = 1.5; // PB: weight of the direct exhaust puffs
class Moteur extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [{ name: 'rpm', defaultValue: 900, minValue: 0, maxValue: 15000 }, { name: 'load', defaultValue: 0, minValue: 0, maxValue: 1 }, { name: 'dmg', defaultValue: 0, minValue: 0, maxValue: 1 }]; } // dmgP: car damage (game.js), which detunes the ignition
  constructor() { super(); this.rev = 0; this.jit = 0; this.bl = 0; this.pf = 0; this.dx = 0; this.dy = 0; this.vit = true; this.port.onmessage = e => { if (e.data && e.data.asleep !== undefined) this.asleep = e.data.asleep; else if (e.data) this.cfg(e.data); else this.vit = false; }; } // asleep: vehicle inaudible, nothing is computed (the output stays at zero)
  cfg(P) { const k = sampleRate / 44100, L = x => Math.max(2, Math.round(x * k));
    this.ign = P.ign; this.irr = P.irr; this.off = P.off || Array.from({ length: P.n }, (_, i) => i / P.n);
    this.C = this.off.map(() => ({ k: 1 + P.irr * (Math.random() * 2 - 1), f: 1, x0: 1, cy: new WG(L(10), 0.75, 0.75), in: new WG(L(P.int), 0.01, 0.95), ex: new WG(L(P.exh), 0.95, 0.01), xt: new WG(L(P.ext), 0.01, 0.01) }));
    this.st = new WG(L(P.str), 0.01, 0.01); this.mu = P.muf.map(x => new WG(L(x), 0.01, 0.01)); this.ou = new WG(L(P.out), 0.01, 0.01); }
  process(_, outs, par) {
    if (!this.C || this.asleep) return this.vit; // no configuration yet, or asleep
    const o = outs[0][0], R = par.rpm, LD = par.load, dg = par.dmg[0], C = this.C, n = C.length, m = this.mu.length, kb = 1 - Math.exp(-TAU * 125 / sampleRate), kp = 1 - Math.exp(-TAU * 4000 / sampleRate);
    for (let s = 0; s < o.length; s++) {
      const rpm = R.length > 1 ? R[s] : R[0], ld = LD.length > 1 ? LD[s] : LD[0], ig = 5 * (0.2 + 0.8 * ld);
      this.rev = (this.rev + rpm / 120 / sampleRate) % 1; this.jit += (Math.random() * 0.006 - this.jit) * 0.003; // crankshaft, and the slight wobble of a real engine
      const stL = this.st.oL / n; let sx = 0, si = 0, sb = 0, sp = 0;
      for (let i = 0; i < n; i++) { const c = C[i], x = (this.rev + this.off[i] + this.jit) % 1;
        const iv = x < 0.25 ? Math.sin(2 * TAU * x) : 0, ev = x > 0.75 ? -Math.sin(2 * TAU * x) : 0;
        if (x < c.x0) c.f = Math.random() < dg * dg * 0.3 ? 0 : c.k * (1 + (this.irr + dg * 0.8) * 1.5 * (Math.random() * 2 - 1)); c.x0 = x; // worn: more uneven cylinders, and misfires // new explosion: each cylinder has its own strength, and it varies from one cycle to the next
        const ia = this.ign * 0.2, e = x < ia ? x / ia : x < this.ign * 4 ? Math.exp((ia - x) / (this.ign * 0.6)) : 0; // steep front, then the expansion
        const dr = 1.5 * Math.cos(2 * TAU * x) + ig * c.f * e * (1 + 0.5 * (Math.random() * 2 - 1)); // piston + explosion (with its noise)
        c.in.b = mix(iv, 0.01, 0.95); c.cy.a = mix(iv, 0.01, 0.95); c.cy.b = mix(ev, 0.01, 0.95); c.ex.a = mix(ev, 0.01, 0.95);
        c.in.step((Math.random() * 2 - 1) * iv * 0.2 * (0.3 + 0.7 * ld), c.cy.oL * 0.5);
        c.cy.step(dr + c.in.oR * 0.5, c.ex.oL * 0.5);
        c.ex.step(c.cy.oR, c.xt.oL); c.xt.step(c.ex.oR, stL);
        const xb = x - 0.75; if (xb >= 0) sp += c.f * (0.35 + 0.65 * ld) * Math.exp(-xb / (this.ign * 1.5)) * (xb < this.ign * 0.15 ? xb / (this.ign * 0.15) : 1) * (1 + 0.6 * (Math.random() * 2 - 1)); // exhaust puff at valve opening: steep front, expansion, breath
        sx += c.xt.oR; si += c.in.oL; sb += c.cy.oL; }
      let mL = 0, mR = 0; const sR = this.st.oR / m, oL = this.ou.oL / m;
      for (const w of this.mu) { w.step(sR, oL); mL += w.oL; mR += w.oR; }
      this.st.step(sx, mL); this.ou.step(mR, 0);
      this.bl += (sb - this.bl) * kb; // block vibrations, below 125 Hz
      this.pf += (sp - this.pf) * kp; const y = this.ou.oR + 0.35 * si + 0.5 * this.bl + PB * this.pf, d = y - this.dx + 0.995 * this.dy; this.dx = y; this.dy = d; o[s] = d; // + coupe-continu
    }
    return this.vit;
  }
}
registerProcessor('engine', Moteur);`;
  let modOk = false, modP = Promise.resolve();
  function plug(v) { // the physical engine arrives once the module is loaded (a moment after init)
    try { const n = new AudioWorkletNode(AC, 'engine', { numberOfInputs: 0, outputChannelCount: [1] }); n.connect(v.eng); v.node = n; v.typ = null;
      v.src.push({ stop: () => setTimeout(() => { n.disconnect(); n.port.postMessage(0); }, 400) }); } catch (e) { }
  }
  const SEC = { gripCoef: 0, rollAmt: 0, corner: 0, aq: 0 }, RL = 0.06, ML = 0.07, GL = 0.25; // default ground (listening bench): dry asphalt; levels of rolling, gravel, sliding
  // A voice = what a player hears of their car; vm, vp: its two outputs (engine and gearbox; tyres and rolling), that hush() closes.
  // Engine: the physical model (MOTOR_JS) → slight saturation under load → body → contact breaker; + the turbo whistle.
  // Tyres (rolling noise of a road tyre: peak around 800-1,200 Hz, rising with speed): asphalt, gravel on dirt, muffled on snow, cobble hammering, water on wet ground; skid; scrub.
  // ns: the noise source; mot, pneu: where the engine and the tyres come out; src: what has to be stopped to remove the voice
  function voice(ns, motorFam, tire, src = []) {
    const vm = gain(0, motorFam), vp = gain(0, tire), go = o => { o.start(0, Math.random() * 2); src.push(o); return o; }, os = (type, f) => { const o = AC.createOscillator(); o.type = type; o.frequency.value = f; o.start(); src.push(o); return o; };
    const slowSrc = r => { const s = AC.createBufferSource(); s.buffer = nbuf; s.loop = true; s.playbackRate.value = r; return go(s); }; // noise read very slowly: a random variation, below 50 Hz
    const out = gain(0, vm), lim = gain(1, out), body = filt('peaking', 120, 1, lim), hp = filt('highpass', 35, 0.7, body), eng = gain(0.6, shaper(1.5, hp));
    body.gain.value = 3;
    const limD = gain(0, lim.gain); os('square', 19).connect(limD); // contact breaker: ignition cut, restored, cut
    const twG = gain(0, vm), tw = os('sine', 1500); tw.connect(twG); ns.connect(filt('bandpass', 1800, 2, gain(0.1, twG))); // turbo: whistle and whoosh
    const rollAmt = gain(0, vp), rm = gain(0.7, rollAmt), rl = filt('bandpass', 900, 0.8, filt('lowpass', 2500, 0.7, rm)); ns.connect(rl); ns.connect(filt('lowpass', 120, 0.7, gain(0.8, rm))); // asphalt: rolling band + rumble of bumps
    slowSrc(0.004).connect(gain(0.3, rm.gain)); // the road's grain varies
    const gr = AC.createBufferSource(); gr.buffer = gbuf; gr.loop = true; go(gr);
    const looseG = gain(0, vp), mf = filt('bandpass', 1600, 0.6, filt('lowpass', 2500, 0.7, looseG)); gr.connect(mf); gr.connect(filt('bandpass', 250, 1, gain(0.5, looseG))); // gravel: the pebbles crackling; snow: duller
    const cobble = gain(0, vp), cobbleM = gain(0.5, cobble), po = os('square', 20); po.connect(gain(0.5, cobbleM.gain)); ns.connect(filt('bandpass', 400, 0.7, cobbleM)); // cobbles: hammering
    const limp = gain(0, vp); ns.connect(filt('bandpass', 2200, 0.6, limp)); // wet: the hiss of water being pushed aside
    const g = gain(0, vp), b1 = filt('bandpass', 500, 1, g); ns.connect(b1); // the rubber rubbing, broad
    const squeal = gain(0, vp), ac = gain(0.5, squeal), b2 = filt('bandpass', 1000, 12, ac), b3 = filt('bandpass', 2000, 12, gain(0.35, ac)); ns.connect(b2); ns.connect(b3); // squeal: a note around 1 kHz and its harmonic
    const sl = slowSrc(0.03); sl.connect(gain(0.6, ac.gain)); sl.connect(gain(60, b2.detune)); sl.connect(gain(60, b3.detune)); // in jerks (grip, slip), pitch wandering
    const scrub = gain(0, vp); ns.connect(filt('lowpass', 200, 0.7, scrub));
    const spray = gain(0, vp); gr.connect(filt('bandpass', 1400, 0.6, filt('lowpass', 2500, 0.7, spray))); // spray of pebbles or snow when sliding
    const v = { vm, vp, eng, out, lim, limD, tw, twG, rollAmt, rl, gr, looseG, mf, cobble, po, limp, g, squeal, b1, b2, b3, scrub, spray, motorFam: vm, src, gas: 0, crk: 0, typ: null, node: null }; // gas: the throttle at the previous frame; crk: the backfires that follow a lift off the throttle
    if (modOk) plug(v);
    return v;
  }
  // voice of a split-screen player: the same, behind a pan, with its own noise (stopping its sources is then enough to free everything).
  // The constant-power pan takes 3 dB off each voice: two engines together weigh what the solo one does, the compressor headroom does not move stepSec.
  function voicePan(p) {
    const pm = AC.createStereoPanner(), pp = AC.createStereoPanner(), ns = AC.createBufferSource(); pm.pan.value = pp.pan.value = p; pm.connect(V.motorFam); pp.connect(V.tire);
    ns.buffer = nbuf; ns.loop = true; ns.start(0, Math.random() * 2); return voice(ns, pm, pp, [ns]);
  }
  // voice of another vehicle (rival, truck): its physical engine, attenuated by distance (level and highs, as air does), placed in space by an HRTF PannerNode (front, behind, sides, headphones);
  // the distance stays set by hand (g, lp: zero rolloff); the Doppler effect goes through the engine speed (the pitch follows the rpm); wh: the air whoosh when it passes very close
  function voiceFar(ns) {
    const pan = AC.createPanner(); pan.panningModel = 'HRTF'; pan.distanceModel = 'linear'; pan.rolloffFactor = 0; pan.connect(V.motorFam); const g = gain(0, pan), lp = filt('lowpass', 8000, 0.7, g), eng = gain(1, lp), wh = gain(0, pan); ns.connect(filt('bandpass', 700, 0.8, wh));
    const v = { eng, g, lp, pan, wh, src: [], node: null, typ: null }; if (modOk) plug(v); return v;
  }
  function klaxon(t = AC.currentTime, d = V.motorFam) { // a truck's air horn: two notes in chord, brassy, one long blast
    for (const f of [155, 196]) { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sawtooth'; o.frequency.value = f; o.connect(filt('lowpass', 1800, 1, g)); g.connect(d);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 0.04); g.gain.setValueAtTime(0.05, t + 0.9); g.gain.linearRampToValueAtTime(0, t + 1.1); o.start(t); o.stop(t + 1.15); }
  }
  function landing(l, t = AC.currentTime, d = V.impact) { // landing a jump: the tyres and suspension absorb it; beyond that, the body bottoms out
    const v = Math.min(0.45, (l - 3) * 0.06), o = osc('sine', 95, t, 0.28, v, d); o && o.frequency.exponentialRampToValueAtTime(38, t + 0.22);
    nz(t, 0.09, v * 0.6, d, 'lowpass', 450); if (l > 8) { nz(t + 0.015, 0.14, v * 0.35, d, 'bandpass', 1100, 3, mbuf); nz(t + 0.03, 0.05, v * 0.3, d, 'bandpass', 2400, 2); }
  }
  // setParam: the target of a setting, sent only if it moved (0.1%): 87% of the sends per frame repeated the previous one, and each send can wait for the audio thread (up to 2 ms)
  // every setTargetAtTime of a setting aimed at each frame goes through here, otherwise the value kept would no longer be the right one
  const setParam = (p, v, t, tc) => { if (p.vv !== undefined && p.vtc === tc && Math.abs(v - p.vv) <= Math.abs(v) * 1e-3 + 1e-6) return; p.vv = v; p.vtc = tc; p.setTargetAtTime(v, t, tc); };
  // a physical engine costs 2 to 4% of the audio thread, even muted: that of a vehicle you cannot hear sleeps
  const sleep = (v, x) => { x = !!x; if (v.node && v.asleep !== x) { v.asleep = x; v.node.port.postMessage({ asleep: x }); } };
  const hush = (v, t) => { setParam(v.vm.gain, 0, t, 0.05); setParam(v.vp.gain, 0, t, 0.05); };
  // a turntable's chain (station colour, filters, drums, pumped bus, saturations, reverb, echo, chorus, slices): one at the start, a second during a DJ transition
  function chain() {
    fad = gain(1, musIn); eqH = filt('highshelf', 5000, 0.7, fad); eqM = filt('peaking', 1000, 0.9, eqH); eqL = filt('lowshelf', 130, 0.7, eqM); hpF = filt('highpass', 20, 0.9, eqL); djF = filt('highpass', 10, 0.7, hpF); djL = filt('lowpass', 20000, 0.7, djF); secG = gain(1, djL); gritDry = gain(1, secG); tuneG = gain(1, gritDry); gritWet = gain(0, secG); tuneG.connect(gain(2.5, shaper(6, gritWet))); // station colour; section level; saturated lane, dosed by proximity to the wall
    drumF = gain(1, tuneG); drumG = gain(1, drumF); kdrv = shaper(3, gain(0.8, drumG)); // drumF: drum fades at entries and exits
    { const pn = AC.createStereoPanner(); pn.pan.value = 0.2; pn.connect(drumG); const pk = filt('peaking', 3800, 1, pn); pk.gain.value = -3; const hs = filt('highshelf', 8000, 0.7, pk); hs.gain.value = -6; hatG = gain(0.7, hs); } // hi-hats: their slice, lower, highs softened, a bit to the right (centred and bright, they covered everything)
    swF = filt('lowpass', 20000, 0.7, tuneG); busDry = gain(1, swF); busDrv = gain(0, swF);
    duckG = gain(1, busDry); duckG.connect(gain(2.5, shaper(4, busDrv))); // everything except the drums goes through this pumped bus
    bsat = shaper(5, gain(0.5, duckG));
    const fz = filt('peaking', 1000, 1, filt('lowpass', 2600, 0.7, gain(0.3, duckG))); fz.gain.value = 5; fuzz = gain(6, shaper(8, fz)); // guitar: clipping, then cabinet
    acid = filt('lowpass', 1900, 12, duckG);
    // music reverb (1.3 s room), filtered rhythmic echo, chorus (two modulated delays, one per side, ± 8 cents: enough to widen, not to detune)
    const mr = AC.createConvolver(), mi = AC.createBuffer(2, AC.sampleRate * 1.3, AC.sampleRate);
    for (let c = 0; c < 2; c++) { const x = mi.getChannelData(c); for (let i = 0; i < x.length; i++) x[i] = (Math.random() * 2 - 1) * Math.exp(-i / AC.sampleRate / 0.28); }
    mr.buffer = mi; mrevG = gain(0.2, tuneG); mr.connect(mrevG); revIn = gain(1, mr); drumRv = gain(0.05, revIn); drumG.connect(drumRv);
    dly = AC.createDelay(1); dlyFb = gain(0.42, dly); dly.connect(filt('lowpass', 3500, 0.5, dlyFb)); dly.connect(duckG); echoIn = gain(1, dly);
    choIn = AC.createGain();
    for (const sg of [-1, 1]) { const dl = AC.createDelay(0.1), p = AC.createStereoPanner(), l = AC.createOscillator(); dl.delayTime.value = 0.022 + 0.004 * sg; p.pan.value = 0.8 * sg; l.frequency.value = 0.6 + 0.15 * sg; l.connect(gain(0.0012, dl.delayTime)); l.start(); choIn.connect(dl); dl.connect(p); p.connect(duckG); }
    // one slice per part: chopping, pan, sends to reverb, echo and chorus (set by the station's timbre)
    strip = {}; was = {};
    for (const k of ['b', 'd', 'c', 'g', 'a', 'l']) { const pan = AC.createStereoPanner(), rv = gain(0, revIn), ec = gain(0, echoIn), ch = gain(0, choIn), lp = filt('lowpass', 20000, 0.7, pan), hp = filt('highpass', 20, 0.7, lp), gate = gain(1, hp); pan.connect(duckG); pan.connect(rv); pan.connect(ec); pan.connect(ch);
      const fzOut = gain(0.3, gate), fe = filt('peaking', 1000, 1, filt('lowpass', 2600, 0.7, fzOut)); fe.gain.value = 5; const fzIn = gain(6, shaper(8, fe)); // one guitar amp per part, like fuzz
      strip[k] = { in: Object.assign(gain(MX[k], gate), { fz: fzIn }), fzIn, fzOut, gate, pan, rv, ec, ch, lp, hp }; }
  }
  let radioAssetsPending = false;
  function initAudio(ctx, preparatory = false) { // Bootstrap prepares the suspended graph; gestures only resume it. Sampled radio notes wait for race preparation.
    if (AC && live && !ctx) { if (radioAssetsPending && !preparatory) { radioAssetsPending = false; readyMs = Promise.all([readyMs, loadRadios(ST)]); } return AC.resume(); }
    if (AC && live) AC.close();
    AC = ctx || new (window.AudioContext || window.webkitAudioContext)(); live = !ctx;
    // every source cuts itself loose when it ends: otherwise its chain (envelope, filters) stays wired to the buses until GC, and the audio thread keeps processing thousands of finished notes (piliers: 1,900 to 2,700 dropouts per race, 25 to 35 times fewer with this)
    for (const k of ['createOscillator', 'createBufferSource', 'createConstantSource']) { const f = AC[k].bind(AC); AC[k] = () => { const n = f(); n.addEventListener('ended', () => n.disconnect()); return n; }; }
    masterComp = AC.createDynamicsCompressor(); outG = gain(OUT, AC.destination); masterComp.connect(outG);
    vu = AC.createAnalyser(); vu.fftSize = 2048; outG.connect(vu); // what actually comes out, for the listening bench's VU meter
    lastHit = 0; lastMus = -9; ambT = 2; rubT = satT = turntable = 0; bigS = false; lastFill = lastRoll = -9; exitAt = -1; grit = tens = 0; glisse = acquired = acqSaid = boostPend = boostL = false; for (const p in was) was[p] = false; drums = 0; mix = inten = driftL = 0; ending = inZone = false; // a new context restarts from stopped
    master = gain(0.9, masterComp); ana = AC.createAnalyser(); ana.fftSize = 64; master.connect(ana);
    for (const k in vol) V[k] = gain(vol[k], master);
    nbuf = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate);
    const d = nbuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // tunnel reverb: noise that dies out in 1.6 s; the music and the engine are sent to it according to e.tun
    rev = AC.createConvolver(); const ir = AC.createBuffer(2, AC.sampleRate * 1.6, AC.sampleRate);
    for (let c = 0; c < 2; c++) { const x = ir.getChannelData(c); for (let i = 0; i < x.length; i++) x[i] = (Math.random() * 2 - 1) * Math.exp(-i / AC.sampleRate / 0.35); }
    rev.buffer = ir; rev.connect(gain(0.5, master)); musSend = gain(0, rev); motorSend = gain(0, rev); V.mus.connect(musSend); V.motorFam.connect(motorSend);
    // acoustic space (ACOUSTICS): engine, tyres and impacts → one echo per side (delay, filter, a little feedback, pan) + the place's reverb
    { const eIn = AC.createGain(); V.motorFam.connect(eIn); V.tire.connect(gain(0.6, eIn)); V.impact.connect(gain(0.8, eIn));
      const sideOf = p => { const g = gain(0, eIn), d = AC.createDelay(0.5), lp = filt('lowpass', 3500, 0.7, gain(0.25, d)), pn = AC.createStereoPanner(); pn.pan.value = p; g.connect(d); d.connect(pn); pn.connect(master); d.connect(lp); return { g, d }; };
      const L = sideOf(-0.85), R = sideOf(0.85), conv = AC.createConvolver(), lp = filt('lowpass', 3000, 0.7, master), rvG = gain(0, conv); eIn.connect(rvG); conv.connect(lp);
      acoustic = { L, R, conv, lp, rvG }; }
    musF = filt('lowpass', 18000, 0.7, V.mus); musicG = gain(musicOn ? 1 : 0, musF);
    // mix bus: the turntables feed into it; during a DJ transition, it goes through a compression that glues the two tracks together (without it, they add up)
    musIn = AC.createGain(); mixDry = gain(1, musicG); musIn.connect(mixDry); const mc = AC.createDynamicsCompressor(); musIn.connect(mc);
    mc.threshold.value = -28; mc.ratio.value = 4; mc.knee.value = 12; mc.attack.value = 0.012; mc.release.value = 0.25; mixW = gain(0, musicG); mc.connect(mixW);
    chain();
    waves();
    mbuf = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate); // cymbal metal: six inharmonic squares
    { const x = mbuf.getChannelData(0); for (let i = 0; i < x.length; i++) { let v = 0; for (const f of [410.6, 608.8, 739.2, 1045.4, 1080, 1600]) v += Math.sin(2 * Math.PI * f * i / AC.sampleRate) > 0 ? 1 : -1; x[i] = v / 6; } }
    const SP = { ...window.SMP, ...window.PERC }; // PERC: recorded acoustic drums (instruments.js)
    readyMs = Promise.all(Object.keys(SP).map(k => new Promise(ok => { // decoding of the TR-808 sounds; if it fails the drums stay synthesized
      const bin = atob(SP[k]), u8 = Uint8Array.from(bin, ch => ch.charCodeAt(0));
      AC.decodeAudioData(u8.buffer, b => { smp[k] = b; ok(); }, ok);
    })));
    modOk = false; const ac0 = AC, url = URL.createObjectURL(new Blob([MOTOR_JS], { type: 'application/javascript' }));
    modP = AC.audioWorklet ? AC.audioWorklet.addModule(url).then(() => { if (AC !== ac0) return; modOk = true; for (const v of [...VX, ...AU]) plug(v); }, () => { }) : Promise.resolve(); // without AudioWorklet: no engine, the rest plays
    radioAssetsPending = preparatory; readyMs = Promise.all([readyMs, modP, preparatory ? Promise.resolve() : loadRadios(ST)]);
    const ns = AC.createBufferSource(); ns.buffer = nbuf; ns.loop = true; ns.start();
    gbuf = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate); // gravel: tight 7 ms impacts, played faster with speed
    { const x = gbuf.getChannelData(0); let a = 0; for (let i = 0; i < x.length; i++) { if (Math.random() < 0.012) a = 0.3 + 0.7 * Math.random(); x[i] = (Math.random() * 2 - 1) * a; a *= 0.997; } }
    AU = [voiceFar(ns), voiceFar(ns)]; // the two other nearest vehicles (rivals or trucks)
    VX.length = 0; VX[0] = voice(ns, V.motorFam, V.tire); // a new context restarts with only the solo voice
    // scraping: sheet metal (mid band and rumble) mixed with a grinding wheel (narrow high band chopped at 72 Hz, sparks)
    scrapeG = gain(0, V.impact); ns.connect(filt('bandpass', 1700, 1.2, scrapeG)); ns.connect(filt('lowpass', 260, 0.7, gain(1.5, scrapeG)));
    { const g = gain(0.55, scrapeG), l = AC.createOscillator(); l.type = 'square'; l.frequency.value = 72; l.connect(gain(0.45, g.gain)); l.start(); ns.connect(filt('bandpass', 2800, 6, gain(2.2, g))); ns.connect(filt('highpass', 7000, 0.7, gain(0.1, scrapeG))); }
    uiF = filt('lowpass', 3000, 0.5, V.ui);
    // wind: air rumble in the low end + mid whoosh that rises with speed, in slow gusts; nitro: the roar of the flame as long as it pushes
    windL = gain(0, V.wind); ns.connect(filt('lowpass', 180, 0.6, windL));
    { const gust = gain(1, V.wind), l = AC.createOscillator(); l.frequency.value = 0.21; l.connect(gain(0.35, gust.gain)); l.start(); windG = gain(0, gust); windF = filt('bandpass', 900, 1.1, windG); ns.connect(windF); }
    nitroG = gain(0, V.impact); ns.connect(filt('lowpass', 600, 0.8, nitroG)); ns.connect(filt('bandpass', 1500, 1.5, gain(0.4, nitroG)));
    // rain, heard from the cabin (the 'pluie' family): a curtain muffled by the body (low-pass + rumble, slow swell); aquaplaning spray under the body
    const rid = gain(0, V.rainFx), swell = gain(1, rid), rl = filt('lowpass', 600, 0.7, swell); ns.connect(rl); ns.connect(filt('bandpass', 220, 0.8, gain(0.6, swell)));
    const hl = AC.createOscillator(); hl.frequency.value = 0.13; hl.connect(gain(0.3, swell.gain)); hl.start();
    const aq = gain(0, V.rainFx); ns.connect(filt('lowpass', 450, 0.6, aq));
    rainFx = { rid, rl, aq };
    buildAmb(); retune(AC.currentTime + 0.1); tuneG.gain.value = lvl();
    if (live) { preparatory ? AC.suspend() : AC.resume(); timer = timer || setInterval(() => live && pump(), 30); }
    return readyMs;
  }
  const beep = f => AC && osc('square', f, AC.currentTime, 0.25, 0.2, V.ui);
  const VOY = [[730, 1090], [270, 2290], [300, 870], [530, 1840], [570, 840]]; // formants of the vowels a, i, ou, è, o
  function radio(n, f0, spd) { // a rival's radio line: opening crackle, n syllables of babble (sawtooth waves in two vowel formants, filtered walkie-talkie style), closing click; f0: pitch, vit: syllables per second
    if (!AC) return; let t = AC.currentTime + 0.05; const d = 1 / spd, t0 = t, out = shaper(3, filt('highpass', 450, 0.7, filt('lowpass', 2800, 0.7, gain(0.5, V.ui))));
    nz(t, 0.12, 0.3, V.ui, 'bandpass', 2500, 0.8); t += 0.1;
    for (let i = 0; i < n; i++, t += d * (0.8 + Math.random() * 0.5)) {
      const [F1, F2] = VOY[Math.random() * 5 | 0], g = env(out, t, d * 0.9, 0.5, 0.02), o = AC.createOscillator(), f = f0 * (0.85 + Math.random() * 0.3) * (i === n - 1 ? 0.8 : 1);
      o.type = 'sawtooth'; o.frequency.setValueAtTime(f, t); o.frequency.linearRampToValueAtTime(f * 0.9, t + d); o.connect(filt('bandpass', F1, 6, g)); o.connect(filt('bandpass', F2, 8, g)); o.start(t); o.stop(t + d + 0.05);
    }
    nz(t0, t - t0, 0.03, V.ui, 'highpass', 3000); nz(t, 0.08, 0.25, V.ui, 'bandpass', 2500, 0.8); osc('square', 1800, t + 0.06, 0.03, 0.08, V.ui); // the link's hiss, then the button is released
  }
  // one-off sound effects: called by audioFrame, and one by one by the listening bench
  function keyPress(t) { // radio button: two dry clicks in the mids
    nz(t, 0.018, CLACK, V.ui, 'bandpass', 1900, 2.5); osc('triangle', 150, t, 0.05, CLACK * 0.25, V.ui);
    nz(t + 0.07, 0.03, CLACK * 1.4, V.ui, 'bandpass', 2850, 2); nz(t + 0.07, 0.012, CLACK * 0.6, V.ui, 'highpass', 4000); osc('square', 320, t + 0.07, 0.03, CLACK * 0.15, V.ui);
  }
  function clack(down, t = AC.currentTime, d = V.motorFam) { // d: the player voice's output · // gear change: dull thud of the transmission, then a blow-off valve on the way up, a throttle blip when downshifting; the thrust cut comes from the physics
    const o = osc('sine', 110, t, 0.1, 0.45, d); o && o.frequency.exponentialRampToValueAtTime(55, t + 0.08);
    nz(t, 0.03, 0.25, d, 'lowpass', 700);
    if (down) { const b = osc('sawtooth', 130, t + 0.03, 0.14, 0.22, filt('lowpass', 1100, 0.7, d)); b && b.frequency.exponentialRampToValueAtTime(230, t + 0.12); }
    else { const h = nz(t + 0.03, 0.22, 0.2, d, 'bandpass', 1400, 1.2); h && h.frequency.exponentialRampToValueAtTime(600, t + 0.24); }
  }
  function lever(down, t = AC.currentTime, d = V.motorFam) { // manual gearbox: the detent releasing, the lever travel, then the lock-in — dull and mechanical, without a high ring
    nz(t, 0.015, LEV * 0.4, d, 'bandpass', 1200, 2); nz(t + 0.045, 0.03, LEV * 0.35, d, 'lowpass', 500);
    const tt = t + 0.085, f = down ? 260 : 330;
    nz(tt, 0.025, LEV * 0.6, d, 'bandpass', 900, 1.5); osc('sine', 110, tt, 0.09, LEV * 0.35, d);
    for (const [k, v] of [[1, 0.12], [2.76, 0.04]]) osc('sine', f * k, tt, 0.07, LEV * v, d); // the metal locking in, lower when downshifting
  }
  function musicHit(v, t = AC.currentTime) { // an impact is also heard in the music: kick and bass hit on the bar's root, and everything dips for a moment
    if (menu) return; const st = ST[station], P = PATCH[st.b.p];
    const k = 0.5 * clamp(0.5 + v * 0.04, 0.6, 1), o = osc('sine', hz(curRoot + 12), t, 0.55, 0.7 * k, drumG); o && o.frequency.exponentialRampToValueAtTime(hz(curRoot - 12), t + 0.4); // chute de sub de deux octaves
    dKick(t, k, KIT[st.kit] || KIT.k909); tone(st.b.p, hz(curRoot), t, 0.4, 0.25 * (P.lv || 1), strip.b.in);
    duckG.gain.cancelScheduledValues(t); duckG.gain.setValueAtTime(0.85, t); // softened impact effect: half gain, light dip duckG.gain.linearRampToValueAtTime(1, t + 0.3);
  }
  function impact(hit, t = AC.currentTime) { // impact: dull thud of the body, sheet metal crumpling (saturated), a panel ringing, then debris and glass shards
    const v = Math.min(0.6, hit * 0.04), sat = shaper(6, gain(0.6, V.impact));
    const o = osc('sine', 140, t, 0.3, v * 0.55, V.impact); o && o.frequency.exponentialRampToValueAtTime(42, t + 0.25);
    const f = nz(t, 0.22, v, sat, 'bandpass', 1400, 0.8); f && f.frequency.exponentialRampToValueAtTime(300, t + 0.2);
    nz(t, 0.5 + v, v * 0.5, V.impact, 'bandpass', 2400 + Math.random() * 1200, 4, mbuf, 0.002);
    const b = 280 + Math.random() * 200; for (const [m, a] of [[1, 0.25], [2.32, 0.15], [4.1, 0.08]]) osc('sine', b * m, t, 0.45, v * a * 0.6, V.impact); // inharmonic partials of a sheet of metal
    nowPlaying(rawBuf(0.8, x => { for (let i = 0; i < 9; i++) { const d = 0.12 + Math.random() * 0.6; strike(x, d, 0.015, v * (0.1 + Math.random() * 0.2), 0.005, 0); if (i % 3 === 0) strike(x, d, 0.06, v * 0.06, 0.005, 3500 + Math.random() * 3000); } }), t, filt('highpass', 3000, 1, V.impact)); // debris and shards: a buffer, a source (12 before)
  }
  function contact(bump, t = AC.currentTime) { // car against car: two hollow bodies knocking together, lower and rounder than a wall; a light tap is just a 'tok' of the bumper
    const k = Math.min(1, bump / 10), g = 0.22 + 0.5 * k, f0 = 85 + Math.random() * 35;
    nz(t, 0.05, g * 0.9, V.impact, 'bandpass', 700 + Math.random() * 600, 1.4); // the attack: bumper plastic and sheet metal
    const th = osc('sine', 75, t, 0.25, g * 0.7, V.impact); th && th.frequency.exponentialRampToValueAtTime(38, t + 0.22); // the other car's weight: a low thud
    nz(t, 0.25 + 0.4 * k, g * 0.45, V.impact, 'bandpass', 1300 + Math.random() * 900, 9, mbuf, 0.002); // the 'clang': two sheets of metal ringing against each other
    const o = osc('sine', f0 * 1.7, t, 0.2 + 0.25 * k, g * 0.6, V.impact); o && o.frequency.exponentialRampToValueAtTime(f0, t + 0.18); // the dull thud of the body
    for (const [m, a] of [[2.13, 0.22], [3.47, 0.12], [5.31, 0.06]]) osc('sine', f0 * 2 * m * (0.97 + Math.random() * 0.06), t, 0.12 + 0.3 * k, g * a, V.impact); // the door ringing (inharmonic partials)
    if (k > 0.35) { const f = nz(t, 0.16, g * 0.6, shaper(5, gain(0.5, V.impact)), 'bandpass', 1900, 0.9); f && f.frequency.exponentialRampToValueAtTime(450, t + 0.15); } // hard: the sheet metal crumples
    if (k > 0.7) nowPlaying(rawBuf(0.5, x => { for (let i = 0; i < 6; i++) strike(x, 0.05 + Math.random() * 0.35, 0.012, g * (0.1 + Math.random() * 0.15), 0.004, 3000 + Math.random() * 3500); }), t, filt('highpass', 2500, 1, V.impact)); // very hard: shards
  }
  function boostFx(t = AC.currentTime) { // nitro start: hissing purge, then the flame opening up and a low thump
    nz(t, 0.35, 0.05, V.impact, 'highpass', 2500, 0.7, nbuf, 0.003);
    const w = nz(t + 0.05, 0.9, 0.07, V.impact, 'lowpass', 250, 1, nbuf, 0.08); w && w.frequency.exponentialRampToValueAtTime(1600, t + 0.5);
    const o = osc('sine', 70, t + 0.05, 0.5, 0.12, V.impact); o && o.frequency.exponentialRampToValueAtTime(45, t + 0.45);
  }
  const pop = (t, d, v) => { nz(t, 0.03, v, d, 'lowpass', 700 + Math.random() * 900); osc('sine', 60 + Math.random() * 30, t, 0.05, v * 0.3, d); }; // a bang in the exhaust
  function backfire(spool = 1, t = AC.currentTime, d = V.motorFam) { nz(t, 0.25, 0.04 * spool, d, 'bandpass', 1400, 1.5); for (let i = 0; i < 3; i++) pop(t + 0.08 + Math.random() * 0.4, d, 0.12); } // lift off the throttle at high rpm
  function hiss(s = 1, t = AC.currentTime, d = V.motorFam) { const h = nz(t, 0.4, 0.14 * s, d, 'bandpass', 1800, 1.5, nbuf, 0.01); h && h.frequency.exponentialRampToValueAtTime(700, t + 0.35); } // turbo blow-off valve
  // e: race state for this frame — { state, car, T, hot (0..1 in the hot sector), tour / tours (current lap from 0, number of laps; 0 outside race mode), tun (0..1 in the tunnel), amb (0..1 in an ambience zone), r (speed 0..1), sp, gas, hit, bump (impact between cars, m/s), up / down (gear up / gear down), rpm, load, spool, stun }
  // Split screen: e.cars = the human cars, one per player — [{ car, r, sp, gas, hit, bump, up, down, rpm, load, spool }]; the rest of e (state, car, T, hot, tour, tun, amb, r, sp, hit, bump, fini) is then that of the best-placed human still racing, who drives the music, the tunnel, the rain and the ambience. Without e.cars, e is the only player (listening bench).
  // Rain: a curtain muffled through the body, louder and brighter with speed. pl = strength 0..3 (T.rainFx), already cut in a tunnel; r = speed 0..1; aq = aquaplaning (sim.js)
  function rainFrame(pl, r, aq, k) {
    k(rainFx.rid.gain, 0.045 * Math.min(pl, 3) / 3 * (0.6 + 0.4 * r), 0.4); k(rainFx.rl.frequency, 400 + 700 * r, 0.3);
    k(rainFx.aq.gain, 0.25 * aq, 0.1);
  }
  function audioFrame(dt, e) {
    if (!AC) return;
    const { state, car, T, r, sp } = e, N = T.n, tun = e.tun || 0, CARD = M.car, t = AC.currentTime, racing = state === 'race', k = (p, v, tc = 0.04) => setParam(p, v, t, tc);
    if (state === 'pause') { for (const v of VX) hush(v, t); for (const v of AU) { k(v.g.gain, 0, 0.05); k(v.wh.gain, 0, 0.05); } k(scrapeG.gain, 0, 0.05); k(windG.gain, 0, 0.05); k(windL.gain, 0, 0.05); k(nitroG.gain, 0, 0.05); k(rainFx.rid.gain, 0, 0.05); k(rainFx.aq.gain, 0, 0.05); if (CH) k(CH.rootPt.gain, 0, 0.05); return; } // paused: the radio carries on, the cars fall silent
    if ((state === 'title') !== menu) { if (dk) endMix(); menu = !menu; retune(t + 0.05); tuneG.gain.cancelScheduledValues(t); tuneG.gain.setValueAtTime(0, t); tuneG.gain.linearRampToValueAtTime(lvl(), t + 0.3); } // menu ↔ race: the menu loop gives way to the station
    // one voice per player: alone, the centre one, unchanged; with two, one on each side, created when the second player arrives and removed when they leave (fade, then the sources stop)
    const L = e.cars || (UN[0] = e, UN), duo = L.length > 1; let hit = 0, bump = 0, rub = false; // impacts and scraping: those of any player are heard (the music, however, only takes those of the best-placed one)
    if (duo !== VX.length > 1) { if (duo) { VX[1] = voicePan(-PANJ); VX[2] = voicePan(PANJ); } else { for (let i = 1; i < 3; i++) { hush(VX[i], t); for (const s of VX[i].src) s.stop(t + 0.3); } VX.length = 1; } }
    if (duo) hush(VX[0], t);
    for (let i = 0, n = duo ? 2 : 1; i < n; i++) { const j = L[i], v = VX[duo ? i + 1 : 0], c = j.car, { rpm, load } = j;
      if (j.muted) { hush(v, t); continue; } // not this player's car, or already heard on the other side: its voice falls silent but stays in place (no cut, no recreation)
      k(v.vm.gain, 1, 0.05); k(v.vp.gain, 1, 0.05);
      // engine (under the music): timbre of its architecture, brighter and rougher under load, dark when lifting off; contact breaker, turbo, gears, backfires
      if (j.up || j.down) (c.manual ? lever : clack)(j.down, t, v.motorFam); // manual gearbox: the lever; automatic: the transmission
      const P = MOTOR[CARD.engine] || MOTOR.l6;
      if (v.node) { if (v.typ !== P) { v.node.port.postMessage(P); v.typ = P; } k(v.node.parameters.get('rpm'), rpm * CARD.red, 0.02); k(v.node.parameters.get('load'), load, 0.03); k(v.node.parameters.get('dmg'), j.dmgP || 0, 0.2); } // the real rpm: the pitch comes from the physics
      k(v.eng.gain, 0.5 + 0.5 * load, 0.05);
      v.airS = c.air ? (v.airS || 0) + dt : 0; const fly = TH.vacuum && v.airS > 0.25; // th.vacuum (lune): after a quarter of a second in the air the cabin falls silent, the engine drops to a murmur (the tyres are already cut in the air)
      k(v.out.gain, (state === 'title' ? 0.004 : 0.025 + 0.022 * load + 0.0125 * rpm) * (fly ? 0.1 : 1), fly ? 0.07 : 0.04); // under the music, but present
      const li = state !== 'title' && j.gas && rpm > 0.985 ? 0.5 : 0; k(v.lim.gain, 1 - li, 0.01); k(v.limD.gain, li, 0.01);
      const tb = CARD.turbo ? j.spool : 0; k(v.tw.frequency, 900 + 2600 * tb, 0.1); k(v.twG.gain, 0.005 * tb * tb * (0.25 + 0.75 * load), 0.1);
      if (v.gas && !j.gas && racing) { if (rpm > 0.55 && j.spool > 0.5) backfire(j.spool, t, v.motorFam); if (tb > 0.4) hiss(tb, t, v.motorFam); v.crk = rpm > 0.5 ? 1 : 0; }
      if (j.gas || !racing) v.crk = 0; else if (v.crk > 0) { v.crk -= dt; if (rpm > 0.4 && Math.random() < dt * 9 * v.crk) pop(t + Math.random() * 0.03, v.motorFam, 0.06 * v.crk); } // the engine holding back crackles for a second
      v.gas = j.gas;
      if (racing && j.dmgP > 0.3 && j.sp > 3 && Math.random() < dt * (3 + 12 * j.r) * (j.dmgP - 0.3)) nz(t + Math.random() * 0.02, 0.012, 0.03 * j.dmgP, v.motorFam, 'bandpass', 2500 + Math.random() * 2500, 6, mbuf, 0.001); // rattle: a loose part knocking
      // rolling: depending on the ground under the car (c.ground, see SURF in sim.js), cut in the air
      const Q = c.ground || SEC, air = c.air ? 0 : 1, loose = clamp((Q.gripCoef - 0.35) / 0.25, 0, 1) * clamp(Q.rollAmt / 0.2, 0, 1), snowAmt = clamp(Q.corner / 0.3, 0, 1) * loose, ice = clamp((Q.corner - 0.3) / 0.3, 0, 1), pv = clamp(Q.rollAmt / 0.15, 0, 1) * (1 - loose), we = clamp(Q.aq / 0.1, 0, 1), sv = Math.min(1, j.sp / 25);
      k(v.rollAmt.gain, air * RL * j.r ** 1.3 * (1 - 0.7 * loose) * (1 - 0.5 * ice), 0.1); k(v.rl.frequency, 600 + 500 * j.r, 0.1); // the rolling peak rises with speed, toward 1.1 kHz
      k(v.looseG.gain, air * ML * loose * sv, 0.1); k(v.mf.frequency, lerp(1600, 700, snowAmt), 0.2); k(v.gr.playbackRate, 0.8 + 0.4 * j.r, 0.1);
      k(v.cobble.gain, air * 0.08 * pv * sv, 0.1); k(v.po.frequency, 6 + j.sp * 0.8, 0.1); k(v.limp.gain, air * 0.03 * we * j.r, 0.2);
      // skid: the rubber growling (low, broad) and, above it, a squeal in jerks (alternating grip and slip); on loose ground, the spray; on ice, almost nothing
      const slip = Math.abs(c.vl), a = air * (j.sp > 8 ? clamp((slip - 4) / 14, 0, 1) : 0), dur = (1 - loose) * (1 - 0.6 * ice);
      k(v.b1.frequency, 450 + 150 * a, 0.1); k(v.b2.frequency, 950 + 250 * a, 0.1); k(v.b3.frequency, (950 + 250 * a) * 2, 0.1);
      k(v.g.gain, GL * a * dur, 0.15); k(v.squeal.gain, GL * 0.6 * a * a * dur, 0.15);
      k(v.spray.gain, loose * (0.15 * a + 0.08 * clamp(slip / 12, 0, 1) * j.r), 0.1);
      k(v.scrub.gain, air * 0.5 * clamp(slip / 12, 0, 1) * j.r, 0.08);
      if ((j.land || 0) > 3.5 && t - (v.landT || 0) > 0.3 && racing) { v.landT = t; landing(j.land, t); } // jump landing (separate from impacts)
      hit = Math.max(hit, j.hit || 0); bump = Math.max(bump, j.bump || 0); rub = rub || !!c.rub;
    }
    const w = clamp((r - 0.2) / 0.8, 0, 1) * (1 - tun) * (TH.vacuum ? 0 : 1); // th.vacuum (lune): no air, no wind roar
    k(windL.gain, 0.05 * w * w, 0.2); k(windG.gain, 0.035 * w ** 3, 0.2); k(windF.frequency, 500 + 1300 * r, 0.3); // wind: rises with speed, cut in a tunnel
    k(nitroG.gain, racing && car.boost > 0 ? 0.08 : 0, 0.08);
    rainFrame(state === 'title' ? 0 : (e.rainFx != null ? e.rainFx : T.rainFx ? T.rainFx[car.idx] : 0) * (1 - tun), r, car.aq || 0, k);
    rubT -= dt; if (bump > 0.3) rubT = 0.35; // two cars touching: a small impact, then they scrape for a moment
    k(scrapeG.gain, rub || rubT > 0 ? 0.1 + 0.2 * r : 0, 0.05);
    if ((hit > 3 || bump > 0.3) && t - lastHit > 0.15) { lastHit = t; if (hit > 3) impact(hit, t); else contact(bump, t); // a wall: the impact; another car: its own contact
      if (racing && t - lastMus > 4 && e.hit > 6) { lastMus = t; musicHit(e.hit, t); satT = 0.2; if (e.hit > 14) turntable = 1; } } // softened: only a real wall impact touches the music (car-to-car contact not at all), at most every 4 s, turntable slowdown reserved for big impacts // at most once every 2 s: bouncing from wall to wall (rain), the music stayed sunk, slowed and saturated non-stop // the music takes it: bass hit, half a second of saturation, and on a big impact it slows like a turntable being braked
    // drift (car.dd, car.driftT): the tension builds over 1.5 s, plateau at 0.6 s (the nitro gauge then fills at full rate); nitro triggered (car.boost): everything opens up at once and the chorus plays as long as it pushes
    const gl = racing && car.dd ? car.driftT || 0 : 0, aim = car.boost > 0 ? 0 : clamp(gl / 1.5, 0, 1);
    glisse = gl > 0.15; acquired = gl > 0.6; if (!glisse) acqSaid = false; boostL = racing && car.boost > 0;
    if (car.boost > 0 && !wasBoost) { boostFx(t); boostPend = true; tens = 0; }
    tens += (aim - tens) * Math.min(1, dt * (aim > tens ? 8 : 3)); k(hpF.frequency, 20 * 20 ** tens, 0.08); // high-pass: from 20 to 400 Hz, the low end thins without disappearing
    wasBoost = car.boost > 0;
    // ambience of the place: only within its zones (e.amb, fade done by the game), never in the menu or in a tunnel; events spaced at random, within the zone
    const amb = state === 'title' ? 0 : (e.amb || 0) * (1 - tun);
    const ambE = AMBZ[M.id] && state !== 'title' ? e.amb || 0 : amb; ambPos = car ? car.idx / N : 0; ambUnder = tun; // zoned map: the events continue under the vault
    for (const { z, g } of ambZG) k(g.gain, state === 'title' ? 0 : (z.tun ? tun : ambPos >= z.de && ambPos < z.a ? 1 - tun : 0) * (e.amb || 0), 0.5);
    if (e.item === 'metal' && ambEvG) for (const f of [1320, 1985, 2710]) osc('triangle', f * (0.97 + Math.random() * 0.06), t, 0.6, 0.05, ambEvG); // a struck copper item (th.objects, sound 'metal')
    k(ambBed.gain, 0.6 * amb, 0.4); if (ambE > 0.5) { if (!inZone) ambT = Math.min(ambT, 1.2); if ((ambT -= dt) < 0) ambT = ambEvent(t + 0.05); } inZone = ambE > 0.5;
    spotsFrame(t, car, state, tun); // the sources placed by the scenery
    if (CH && T.S && car.x != null) chapadaFrame(dt, e, t, k, tun, r); // the listening bench and the editor have neither track nor position: nothing to place
    // music: sections and filters follow the race
    const a0 = (car.idx - T.h0 + N) % N, inside = a0 < T.h1 - T.h0, near = racing && !inside && N - a0 < 60;
    if (near && !wasNear) riser(t, clamp((N - a0) * 2 / Math.max(sp, 20), 0.5, 3));
    if (TH.alarm && inside && !wasIn && racing) for (let i = 0; i < 6; i++) osc('square', i % 2 ? 660 : 880, t + 0.25 + i * 0.18, 0.16, 0.07, strip.a.in); // alarm siren at the entry
    wasNear = near; wasIn = inside;
    if (racing && !drums && !menu) {
      nextT = Math.max(nextT, t);
      stp = ST[station].raceTheme ? 0 : 64; // the new themes open with their pre-intro; older stations open on the first verse
      if (!stp) t0 = nextT;
      for (const p of 'kbdcgal') was[p] = true;
      bigS = false;
    }
    // over the laps of race mode (e.lapRun, e.lapCount): first lap sober, then the full arrangement, and the last lap a semitone higher; crossing the line is a race event, marked by the cymbal
    const nl = !e.lapCount ? 1 : e.lapRun <= 0 ? 0 : e.lapRun >= e.lapCount - 1 ? 2 : 1;
    if (racing && e.lapCount && e.lapRun !== lapN) { if (lapN >= 0 && e.lapRun > lapN) crash(t, 0.5); lapN = e.lapRun; } if (!racing) lapN = -1;
    lap = racing ? nl : 1; turntable = Math.max(0, turntable - dt); TR = (lap === 2 ? 1 : 0) - turntable; // turntable slowdown: a semitone and 10% less tempo, caught up in 1 s
    drums = racing ? 1 : 0; ending = racing && !inside && car.idx >= T.h1 && car.dist > 0;
    mix += ((racing ? e.hot : 0) - mix) * Math.min(1, dt * 3);
    inten += (r - inten) * Math.min(1, dt * 2); driftL += ((car.drift ? 1 : 0) - driftL) * Math.min(1, dt * 6);
    // only a real wall impact dirties the music a little, for a fifth of a second (the saturation near walls and while scraping was removed: on a narrow road it never stopped)
    satT -= dt; if (satT > 0) grit = 1;
    grit -= grit * Math.min(1, dt * 3); k(gritWet.gain, 0.05 * grit, 0.03); k(gritDry.gain, 1 - 0.25 * grit, 0.03); // dosed per bar: the timbre changes, the level barely does
    // the music opens up with speed; a big impact muffles it; in a tunnel it is muffled and reverberated, and the engine resonates
    // (the music is no longer muffled by an impact, and barely when slowing: low-pass from 5 to 18 kHz depending on speed; it fades behind the finish board)
    k(musF.frequency, e.finished ? 900 : Math.min(state === 'title' ? 7000 : 5000 * 3.6 ** Math.min(1, inten * 1.4 + mix), lerp(18000, 2500, tun)), 0.08);
    k(musSend.gain, 0.7 * tun, 0.2); k(motorSend.gain, 2.5 * tun, 0.2);
    // space: the two echoes (the side of the wall you hug answers louder and sooner), the place's room; in a tunnel, short strong echo on both sides
    { const P = ACOUSTICS[M.id] || ACOUSTICS.attempt, mu = state === 'title' ? 0 : e.intoWall || 0, on = state === 'title' ? 0.3 : 1;
      for (const [s, sideOf] of [[-1, acoustic.L], [1, acoustic.R]]) { const pr = P.intoWall * Math.max(0, mu * s); k(sideOf.g.gain, on * (P.sl * (1 - tun) * (1 + 1.5 * pr) + 0.45 * tun), 0.1); k(sideOf.d.delayTime, lerp(lerp(P.slap, 0.008, pr), 0.014, tun) * (s > 0 ? 1.13 : 1), 0.1); }
      k(acoustic.rvG.gain, on * P.rv * (1 - tun) * (P.spots || []).reduce((m, [a, b, kk]) => car && car.idx / N >= a && car.idx / N < b ? kk : m, 1), 0.3); }
    // the other vehicles (e.otherCars, from nearest to farthest: lat (+ right), fwd in m, dist, vr = closing speed, vrel = relative speed, rpm, camion, occ = 0..1 out of direct view),
    // relative to the car being heard: the listener stays at the origin, looking toward -z, and each voice is placed at (lat, 0, -fwd)
    for (let i = 0; i < AU.length; i++) { const o = e.otherCars && e.otherCars[i], v = AU[i];
      if (!o || state === 'title') { k(v.g.gain, 0, 0.15); k(v.wh.gain, 0, 0.15); sleep(v, 1); continue; }
      const P = o.lorry ? TRUCK : MOTOR[CARD.engine] || MOTOR.l6, d = Math.max(3, o.dist), dop = clamp(343 / (343 - clamp(o.vr, -150, 150)), 0.7, 1.5), a = 1 - Math.exp(-dt / 0.12);
      v.dop = v.dop ? v.dop + (dop - v.dop) * a : dop; v.oc = (v.oc || 0) + ((o.occ || 0) * (0.4 + 0.6 * (ACOUSTICS[M.id] || ACOUSTICS.attempt).intoWall) - (v.oc || 0)) * (1 - Math.exp(-dt / 0.25)); // Doppler and occlusion smoothed (the closing speed jumps from one frame to the next); on open ground, nothing really masks
      sleep(v, (o.lorry ? 0.12 : 0.09) / d < 6e-4); // beyond 150 to 200 m, -64 dB under the music: the physical engine stops computing
      if (v.node) { if (v.typ !== P) { v.node.port.postMessage(P); v.typ = P; } k(v.node.parameters.get('rpm'), o.rpm * v.dop, 0.04); k(v.node.parameters.get('load'), o.lorry ? 0.6 : 0.85, 0.1); }
      k(v.g.gain, (o.lorry ? 0.12 : 0.09) / d * (1 - 0.55 * v.oc), 0.05); k(v.lp.frequency, 9000 / (1 + d / 25) * (1 - 0.88 * v.oc), 0.1);
      if (v.pan.positionX) { k(v.pan.positionX, o.lat, 0.05); k(v.pan.positionZ, -o.fwd, 0.05); } else v.pan.setPosition(o.lat, 0, -o.fwd);
      k(v.wh.gain, 0.12 * clamp(o.vrel / 30, 0, 1) * clamp(1 - d / 14, 0, 1) ** 2 * (1 - v.oc), 0.04);
      if (o.lorry && racing) { if (v.pf > 0 && o.fwd <= 0 && Math.abs(o.lat) < 8 && t - (AU.kt || 0) > 4) { AU.kt = t; klaxon(t + 0.12, gain(clamp(10 / d, 0.4, 1), v.pan)); } v.pf = o.fwd; } else v.pf = 0; } // we just overtook a truck: it honks
  }

  // One-off sounds (impact, gear change, backfire, landing…) each create 20 to 100 nodes; in a race, they are created just after the frame, in the next task, instead of inside the frame:
  // each creation can wait for the audio thread, and an impact at the start added up to 10 ms to the frame. The sound starts a few milliseconds later (its start time, already past, plays at once).
  // Offline (listening bench), they stay immediate: rendering does not wait for the next task
  const FILE = [], MC = new MessageChannel(); MC.port1.onmessage = () => { for (const f of FILE.splice(0)) f(); };
  const defer = f => function () { const a = arguments; if (!live) return f.apply(null, a); FILE.push(() => f.apply(null, a)); if (FILE.length === 1) MC.port2.postMessage(0); };
  impact = defer(impact); clack = defer(clack); lever = defer(lever); backfire = defer(backfire); hiss = defer(hiss); boostFx = defer(boostFx); landing = defer(landing); klaxon = defer(klaxon); musicHit = defer(musicHit);
  document.addEventListener('visibilitychange', () => { if (AC && live) document.hidden ? AC.suspend() : AC.resume(); }); // no choppy music or frozen engine in the background
  window.SOUND = {
    spots, brief: spotHit, spotsState: () => SPOTS.map(l => [l.sound, l.g ? +(l.g.gain.vv || 0).toFixed(3) : null]), // scenery sources; spotsState: test tap (target level of each source)
    init: initAudio, prepare: () => initAudio(undefined, true), initMenu: () => initAudio(undefined, true), frame: audioFrame, setStation, mapDef, pump, mix: mixer, dj: djSt, beep, radio, stinger, arrival, quitGame, reprendre,
    crash: () => AC && crash(),
    thunder: () => { if (!AC) return; const t = AC.currentTime + 0.4; nz(t, 2.4, 0.5, V.amb, 'lowpass', 140); nz(t, 1.2, 0.12, V.amb, 'bandpass', 600, 0.6); }, // rumble + crackle in the mids
    toggleMusic() { musicOn = !musicOn; if (AC) musicG.gain.value = musicOn ? 1 : 0; },
    volume(fmly, v) { vol[fmly] = v; if (V[fmly]) V[fmly].gain.value = v; },
    raceEvent: () => { ambT = 0; }, roar: (v = 1.5) => AC && ambBed && roar(AC.currentTime, v), // the crowd reacts to the race (src/render/crowd.js)
    get live() { return live; },
    clack: down => AC && clack(down), lever: down => AC && lever(down), impact: v => AC && impact(v), contact: v => AC && contact(v), boost: () => AC && boostFx(), backfire: () => AC && backfire(), hiss: () => AC && hiss(), landing: l => AC && landing(l), klaxon: () => AC && klaxon(),
    monitor(v) { if (outG) outG.gain.value = OUT * v; }, get vu() { return vu; }, // listening bench gain: no effect on the game
    get vol() { return vol; }, get readyMs() { return readyMs; }, get stations() { return ST; },
    get station() { return station; }, get label() { return ST[station].name; }, get fq() { return ST[station].fq; }, get genre() { return ST[station].genre; }, get musicOn() { return musicOn; },
    get beat() { return AC ? Math.max(0, (AC.currentTime - t0) / (4 * S16)) : 0; }, // time elapsed since the start of the station, locked to the kick
    get pulse() { return AC ? Math.exp(-(this.beat % 1) * 5) : 0; },
    get ana() { return ana; }, // spectrum analyser, for the HUD equaliser
    audition: EC, resync() { if (!AC) return Promise.resolve(); const p = loadRadios(ST); retune(AC.currentTime, 1); tuneG.gain.setTargetAtTime(lvl(), AC.currentTime, 0.05); return p; }, // returns the promise of the decoded recorded instruments // music editor: applies a station setting without restarting the track
    note(p, n, pn) { const st = ST[station]; if (!AC || menu) return; pn = pn || (st[p] && (p === 'd' ? st.d[0] : st[p].p)); const P = PATCH[pn]; if (!P || !strip[p]) return; // plays a note on a part's slice (piano roll, keyboard and the editor's instrument choice); pn: a timbre other than the part's own
      tone(pn, hz(n), AC.currentTime, P.s ? 0.4 : 0.25, pv(st, p) * (p === 'l' ? (P.lv || 0.15) * (st.lV == null ? 1 : st.lV) : p === 'b' ? 0.3 * (P.lv || 1) : 0.09 * (P.lv || 1)), strip[p].in); },
    strike(p, c) { if (!AC || menu) return; const st = ST[station], K = kitOf(st), t = AC.currentTime, v = pv(st, p); if (p === 'k') dKick(t, v * 0.7 * (c === 'g' ? 0.5 : 1), K); else if (p === 's') dSnare(t, v * 0.4, K, c); else if (p === 'h') dHat(t, v * 0.63, K, c); else dPerc(t, v, K, c); }, // plays a drum hit (editor)
    get backdrop() { return curRoot; }, // root of the current bar
    get stepSec() { return stp; }, get timbres() { return Object.keys(PATCH); }, get kits() { return Object.keys(KIT); },
    get ac() { return AC; }, get out() { return master; }, get patch() { return PATCH; }, get smp() { return Object.keys(smp); }, get tone() { return tone; }, get ins() { return Object.fromEntries(Object.entries(ins).map(([k, v]) => [k, Object.keys(v).length])); }, // prises de test
  };
})();
