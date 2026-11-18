// Listening bench: each sound of the game played alone by the real engine (audio.js), music validation, race mix, measures. The page (audition.html) is only a shell.
(() => {
  const $ = id => document.getElementById(id);
  const FAMILY = { mus: 'Musique', motorFam: 'Engine and gearbox', tire: 'Tyres (skidding)', wind: 'Vent', amb: 'Place ambience', impact: 'Chocs, frottement, boost', ui: 'Interface (bips, jingle, radio)', rainFx: 'Pluie' };
  let M = MAP_DEF, scene = null, t0 = 0;
  const u = { lapRun: -1, full: false, glisse: false, tunnel: false, intoWall: false, throttle: true, spd: 0.85, rpm: 0.6, slide: 0.6, force: 3 }; // page settings
  const pulse = {}; // one-frame triggers (gear up or down)

  // One scene = one sound played alone: [group, title, subtitle, open families, listening amplification (dB), simulated race state (x = seconds since the click), action on click]
  // The state uses the SOUND.frame format: the game's real code is what sets nowPlaying. "pause" = car silent, for one-off sounds.
  const raceCase = (o = {}) => Object.assign({ state: 'race', r: 0.85, sp: 68, rpm: 0.6, load: 1, gas: 1, spool: 0.6 }, o);
  const teeth = (x, p) => (x % p) / p; // 0→1 ramp that repeats
  const SC = {
    menu: ['mus', 'Musique de menu', 'calm loop, colour of the map', ['mus'], 0, () => ({ state: 'title' })],
    st0: ['mus', '', '', ['mus'], 0, () => music()], st1: ['mus', '', '', ['mus'], 0, () => music()], st2: ['mus', '', '', ['mus'], 0, () => music()], st3: ['mus', '', '', ['mus'], 0, () => music()],
    idleCase: ['motorFam', 'Idle', 'idle, no load', ['motorFam'], 24, () => raceCase({ r: 0, sp: 0, rpm: 0.12, load: 0, gas: 0 })],
    mi: ['motorFam', 'Half speed under load', '4 500 tr/min, plein gaz', ['motorFam'], 11, () => raceCase({ rpm: 0.55 })],
    high: ['motorFam', 'High speed under load', '7 500 tr/min, plein gaz', ['motorFam'], 10, () => raceCase({ rpm: 0.94 })],
    adjustable: ['motorFam', 'Adjustable engine', 'engine speed slider and throttle box below', ['motorFam'], 10, () => raceCase({ rpm: u.rpm, load: u.throttle ? 1 : 0, gas: u.throttle ? 1 : 0 })],
    upshift: ['motorFam', 'Upshifts, automatic gearbox', 'acceleration, one gear every 2.5 s', ['motorFam'], 6, x => { const p = teeth(x, 2.5), cut = p < 0.08; if (cut && !pulse.doneFlag) pulse.up = pulse.doneFlag = 1; if (!cut) pulse.doneFlag = 0; return raceCase({ rpm: 0.55 + 0.38 * p, load: cut ? 0 : 1 }); }],
    retroRefl: ['motorFam', 'Downshifts, automatic gearbox', 'braking, one gear every 2.5 s', ['motorFam'], 6, x => { const p = teeth(x, 2.5), cut = p < 0.08; if (cut && !pulse.doneFlag) pulse.down = pulse.doneFlag = 1; if (!cut) pulse.doneFlag = 0; return raceCase({ rpm: 0.8 - 0.3 * p, load: 0, gas: 0 }); }],
    upshiftM: ['motorFam', 'Upshifts, manual gearbox', 'the driver shifts gear with the lever', ['motorFam'], 3, x => Object.assign(SC.upshift[5](x), { manualGear: 1 })],
    downshiftM: ['motorFam', 'Downshifts, manual gearbox', '', ['motorFam'], 3, x => Object.assign(SC.retroRefl[5](x), { manualGear: 1 })],
    clack: ['motorFam', 'Automatic: upshift only', 'without the engine', ['motorFam'], 8, null, () => SOUND.clack(false)],
    clackD: ['motorFam', 'Automatic: downshift only', 'without the engine', ['motorFam'], 8, null, () => SOUND.clack(true)],
    lever: ['motorFam', 'Manual: upshift only', 'lever, without the engine', ['motorFam'], 3, null, () => SOUND.lever(false)],
    leverD: ['motorFam', 'Manual: downshift only', 'lever, without the engine', ['motorFam'], 3, null, () => SOUND.lever(true)],
    backfire: ['motorFam', 'Pétarade', 'lift off the throttle at high speed, without the engine', ['motorFam'], 16, null, () => SOUND.backfire()],
    limiter: ['motorFam', 'Rupteur', 'full throttle against the redline', ['motorFam'], 10, () => raceCase({ rpm: 1.01, spool: 1 })],
    hiss: ['motorFam', 'Turbo blow-off valve', 'lift off the throttle, without the engine', ['motorFam'], 12, null, () => SOUND.hiss()],
    rollB: ['tire', 'Roulement : bitume', 'full speed, no skid', ['tire'], 16, () => raceCase({ r: 1, sp: 80 })],
    rollT: ['tire', 'Roulement : terre', '', ['tire'], 16, () => raceCase({ r: 0.7, sp: 55, ground: { gripCoef: 0.6, rollAmt: 0.5, corner: 0.05, aq: 0 } })],
    rollN: ['tire', 'Roulement : neige', '', ['tire'], 16, () => raceCase({ r: 0.7, sp: 55, ground: { gripCoef: 0.7, rollAmt: 0.2, corner: 0.3, aq: 0 } })],
    rollP: ['tire', 'Rolling: cobbles', '', ['tire'], 16, () => raceCase({ r: 0.6, sp: 45, ground: { gripCoef: 0.3, rollAmt: 0.15, corner: 0.1, aq: 0 } })],
    rollM: ['tire', 'Rolling: wet', '', ['tire'], 16, () => raceCase({ r: 0.9, sp: 70, ground: { gripCoef: 0.35, rollAmt: 0, corner: 0.15, aq: 0.1 } })],
    echoStreet: ['motorFam', 'Echoes: along the wall', 'engine, the wall passes from left to right (map acoustics)', ['motorFam'], 8, x => raceCase({ rpm: 0.7, intoWall: Math.sin(x * 0.8) })],
    passage: ['motorFam', 'A rival overtaking', "its engine goes from behind to ahead, on the right (Doppler, whoosh)", ['motorFam'], 8, x => { const f = -40 + 20 * (x % 5); return raceCase({ r: 0, sp: 0, rpm: 0.12, load: 0, gas: 0, otherCars: [{ lat: 3, fwd: f, dist: Math.hypot(f, 3), vr: -20 * f / Math.hypot(f, 3), vrel: 20, rpm: 6500 }] }); }],
    passageHidden: ['motorFam', 'A rival at the next corner', "the same overtaking, out of sight: muffled behind the walls", ['motorFam'], 8, x => { const o = SC.passage[5](x); o.otherCars[0].occ = 1; return o; }],
    tunRadio: ['mus', 'The radio in a tunnel', 'entry at 9 s, exit at 15 s: crackle, lost highs, dropouts, fade back in', ['mus'], 0, x => Object.assign(music(), { tun: x < 9 ? 0 : x < 9.4 ? (x - 9) / 0.4 : x < 15 ? 1 : Math.max(0, 1 - (x - 15) / 0.4) })],
    lorry: ['motorFam', 'Overtaking a lorry', 'it honks once overtaken', ['motorFam'], 8, x => { const f = 40 - 20 * (x % 5); return raceCase({ r: 0, sp: 0, rpm: 0.12, load: 0, gas: 0, otherCars: [{ lat: -4, fwd: f, dist: Math.hypot(f, 4), vr: 20 * f / Math.hypot(f, 4), vrel: 20, rpm: 1500, lorry: 1 }] }); }],
    landing: ['impact', 'Jump landing', 'light, then heavy (bottoming out)', ['impact'], 10, null, () => SOUND.landing(Math.random() < 0.5 ? 6 : 11)],
    skidT: ['tire', 'Skid on dirt', 'grand angle', ['tire'], 12, () => raceCase({ slide: 1, r: 0.6, sp: 48, ground: { gripCoef: 0.6, rollAmt: 0.5, corner: 0.05, aq: 0 } })],
    skidL: ['tire', 'Light skid', 'petit angle', ['tire'], 16, () => raceCase({ slide: 0.3 })],
    skidF: ['tire', 'Full skid', 'grand angle', ['tire'], 12, () => raceCase({ slide: 1 })],
    skidR: ['tire', 'Adjustable skid', 'curseur d\'angle ci-dessous', ['tire'], 12, () => raceCase({ slide: u.slide })],
    impact: ['impact', 'Choc', 'contact with the wall', ['impact'], 12, null, () => SOUND.impact(6)],
    impactV: ['impact', 'Choc entre voitures', 'light contact in the race', ['impact'], 12, null, () => SOUND.impact(10)],
    bigImpact: ['impact', 'Gros choc', '', ['impact'], 8, null, () => SOUND.impact(12)],
    rubbing: ['impact', 'Frottement', 'the car runs along the wall', ['impact'], 13, () => raceCase({ rub: 1 })],
    boost: ['impact', 'Boost', 'sortie de glisse', ['impact'], 12, null, () => SOUND.boost()],
    windM: ['amb', 'Wind at 75 % of speed', 'below half speed there is no more wind', ['wind'], 30, () => raceCase({ r: 0.75, sp: 60 })],
    windFull: ['amb', 'Full wind', '', ['wind'], 28, () => raceCase({ r: 1, sp: 80 })],
    spot: ['amb', 'Place ambience', 'as heard in its zone, when stopped', ['amb'], 20, () => raceCase({ r: 0, sp: 0, amb: 1 })],
    arena: ['amb', 'Ambience: arena', 'Grand Vacarme: the stands crowd, a roar per click', ['amb'], 20, () => raceCase({ r: 0, sp: 0, amb: 1 }), () => { SOUND.mapDef(MAPS.find(c => c.id === 'stade')); SOUND.raceEvent(); }],
    lapland: ['amb', 'Ambiance : Laponie', 'Nuit Blanche: wind in the firs, sleigh bells per click', ['amb'], 20, () => raceCase({ r: 0, sp: 0, amb: 1 }), () => { SOUND.mapDef(MAPS.find(c => c.id === 'givre')); SOUND.raceEvent(); }],
    // Royal Road: a bed and events per zone (AMBZ and ambEvent of audio.js); idx = the position on the lap, in thousandths (the bench has a lap of 1000 samples)
    persePlain: ['amb', 'Ambience: Persia, the plain', 'warm wind; a dog or a bleat per click', ['amb'], 20, () => raceCase({ r: 0, sp: 0, amb: 1, idx: 100 }), () => { SOUND.mapDef(MAPS.find(c => c.id === 'perse')); SOUND.raceEvent(); }],
    perseCaravan: ['amb', 'Ambience: Persia, the caravan', 'the camels\' bells, per click', ['amb'], 20, () => raceCase({ r: 0, sp: 0, amb: 1, idx: 330 }), () => { SOUND.mapDef(MAPS.find(c => c.id === 'perse')); SOUND.raceEvent(); }],
    perseGarden: ['amb', 'Ambience: Persia, the garden', 'running water; birds per click', ['amb'], 20, () => raceCase({ r: 0, sp: 0, amb: 1, idx: 680 }), () => { SOUND.mapDef(MAPS.find(c => c.id === 'perse')); SOUND.raceEvent(); }],
    perseBazaar: ['amb', 'Ambience: Persia, the covered bazaar', 'hubbub under the vault; coppersmith\'s hammer or merchant\'s call per click', ['amb'], 20, () => raceCase({ r: 0, sp: 0, amb: 1, idx: 800, tun: 1 }), () => { SOUND.mapDef(MAPS.find(c => c.id === 'perse')); SOUND.raceEvent(); }],
    perseStreet: ['amb', 'Ambience: Persia, the bazaar street', 'open-air hubbub; merchant\'s cry and hooves per click, a distant flute once per lap', ['amb'], 20, () => raceCase({ r: 0, sp: 0, amb: 1, idx: 950 }), () => { SOUND.mapDef(MAPS.find(c => c.id === 'perse')); SOUND.raceEvent(); }],
    // Aegean Cliffs: a bed and events per zone (AMBZ.egee and ambEvent of audio.js); idx as for the Royal Road. The sounds placed by the scenery (bells, halyards, mill sails) need the map: they are not here
    egeePort: ['amb', 'Ambience: Aegean, the harbour', 'wash on the quay, rigging; a gull per click', ['amb'], 20, () => raceCase({ r: 0, sp: 0, amb: 1, idx: 30 }), () => { SOUND.mapDef(MAPS.find(c => c.id === 'egee')); SOUND.raceEvent(); }],
    egeeClimb: ['amb', 'Ambience: Aegean, the dry slope', 'cicadas, wind in the thyme; a gust per click', ['amb'], 20, () => raceCase({ r: 0, sp: 0, amb: 1, idx: 280 }), () => { SOUND.mapDef(MAPS.find(c => c.id === 'egee')); SOUND.raceEvent(); }],
    egeePlateau: ['amb', 'Ambience: Aegean, the plateau', 'sheltered wind, cicadas', ['amb'], 20, () => raceCase({ r: 0, sp: 0, amb: 1, idx: 500 }), () => { SOUND.mapDef(MAPS.find(c => c.id === 'egee')); SOUND.raceEvent(); }],
    egeeBalcon: ['amb', 'Ambience: Aegean, the Balcon', 'open wind, the sea far below; the ferry horn then gulls per click', ['amb'], 20, () => raceCase({ r: 0, sp: 0, amb: 1, idx: 670 }), () => { SOUND.mapDef(MAPS.find(c => c.id === 'egee')); SOUND.raceEvent(); }],
    egeeDescent: ['amb', 'Ambience: Aegean, the terraces', 'cicadas, the sea coming closer', ['amb'], 20, () => raceCase({ r: 0, sp: 0, amb: 1, idx: 840 }), () => { SOUND.mapDef(MAPS.find(c => c.id === 'egee')); SOUND.raceEvent(); }],
    // Volcanic Island: a bed and events per zone (AMBZ.volcan and ambEvent of audio.js); idx as for the Royal Road. The sounds placed by the scenery (lava, vents, generators, bell, fog horn) need the map: they are not here
    volcanPort: ['amb', 'Ambience: Volcanic Island, the harbour', 'swell on the quay wall, rigging; a gull or the buoy per click', ['amb'], 20, () => raceCase({ r: 0, sp: 0, amb: 1, idx: 20 }), () => { SOUND.mapDef(MAPS.find(c => c.id === 'volcan')); SOUND.raceEvent(); }],
    volcanFarms: ['amb', 'Ambience: Volcanic Island, the farmland', 'grass hush, the power line singing; a bleat per click', ['amb'], 20, () => raceCase({ r: 0, sp: 0, amb: 1, idx: 150 }), () => { SOUND.mapDef(MAPS.find(c => c.id === 'volcan')); SOUND.raceEvent(); }],
    volcanHigh: ['amb', 'Ambience: Volcanic Island, the lava highland', 'gusts, the line; a raven per click', ['amb'], 20, () => raceCase({ r: 0, sp: 0, amb: 1, idx: 400 }), () => { SOUND.mapDef(MAPS.find(c => c.id === 'volcan')); SOUND.raceEvent(); }],
    volcanGallery: ['amb', 'Ambience: Volcanic Island, a gallery', 'low drone and ventilation', ['amb'], 20, () => raceCase({ r: 0, sp: 0, amb: 1, idx: 630, tun: 1 }), () => { SOUND.mapDef(MAPS.find(c => c.id === 'volcan')); SOUND.raceEvent(); }],
    volcanCaldera: ['amb', 'Ambience: Volcanic Island, the caldera floor', 'steam hiss and a deep rumble', ['amb'], 20, () => raceCase({ r: 0, sp: 0, amb: 1, idx: 665 }), () => { SOUND.mapDef(MAPS.find(c => c.id === 'volcan')); SOUND.raceEvent(); }],
    volcanDescent: ['amb', 'Ambience: Volcanic Island, the descent', 'wind, the sea below; a bleat or a gull per click', ['amb'], 20, () => raceCase({ r: 0, sp: 0, amb: 1, idx: 800 }), () => { SOUND.mapDef(MAPS.find(c => c.id === 'volcan')); SOUND.raceEvent(); }],
    volcanCoast: ['amb', 'Ambience: Volcanic Island, the coast', 'the surf, nearer; a gull per click', ['amb'], 20, () => raceCase({ r: 0, sp: 0, amb: 1, idx: 905 }), () => { SOUND.mapDef(MAPS.find(c => c.id === 'volcan')); SOUND.raceEvent(); }],
    evt: ['amb', 'Place event', 'crickets, birds, horn, helicopter or siren depending on the map', ['amb'], 16, () => raceCase({ r: 0, sp: 0, amb: 1 }), () => SOUND.raceEvent()],
    thunder: ['amb', 'Thunder', 'city storm', ['amb'], 12, null, () => SOUND.thunder()],
    rainFx: ['rainFx', 'Pluie', 'rain through the bodywork, clearer with speed', ['rainFx'], 10, () => downpour()],
    bleep: ['ui', 'Countdown beep', '', ['ui'], 8, null, () => SOUND.beep(440)],
    startLine: ['ui', 'Start beep', '', ['ui'], 8, null, () => SOUND.beep(880)],
    record: ['ui', 'Jingle : record', '', ['ui'], 8, null, () => SOUND.stinger(true)],
    noRecord: ['ui', 'Jingle: no record', '', ['ui'], 8, null, () => SOUND.stinger(false)],
    radio: ['ui', 'Changement de station', 'mechanical key then crackle, without the music', ['ui'], 0, null, () => SOUND.setStation(SOUND.station + 1)],
    skidding: ['mus', 'Glisse puis boost', 'on the current station, looped: 2.5 s of skid (plateau at 0.6 s), boost, return', ['mus', 'tire', 'impact'], 0, x => { const p = x % 9, g = p > 2 && p < 4.5; return Object.assign(music(), { dd: g ? 1 : 0, driftT: g ? p - 2 : 0, drift: g, slide: g ? 0.8 : 0, boost: p >= 4.5 && p < 6 ? 1 : 0 }); }],
    skiddingR: ['mus', 'Failed skid', 'too short for the boost (0.4 s): the music should hardly move', ['mus', 'tire', 'impact'], 0, x => { const p = x % 5, g = p > 2 && p < 2.4; return Object.assign(music(), { dd: g ? 1 : 0, driftT: g ? p - 2 : 0, drift: g, slide: g ? 0.6 : 0 }); }],
    attempt: ['trialFam', 'Essai de choc', '', ['mus', 'impact'], 0, x => trialState()],
    everything: ['mix', 'Full race', 'music, engine, tyres, wind, ambience: the game\'s mix', Object.keys(FAMILY), 0, x => Object.assign(music(), { rpm: 0.55 + 0.4 * teeth(x, 4), load: 1, gas: 1, spool: 0.8, amb: 1, slide: u.glisse ? u.slide : 0 })],
  };
  const downpour = () => raceCase({ r: u.spd, sp: u.spd * 80, tun: u.tunnel ? 1 : 0, rainFx: u.force });
  // tests: a race event replayed over the music (impact, rubbing, contact), with the slowdown that follows
  let trialFam = null;
  function trialState() { // x: seconds since the event
    const o = music(), x = trialFam ? SOUND.ac.currentTime - trialFam.t : 99, T = trialFam ? trialFam.type : '', dur = T === 'minor' || T === 'vehicle' ? 1.5 : 3;
    const rubs = (T === 'rubbing' && x < 1.5) || (T === 'chocFrott' && x > 0.05 && x < 1.3);
    const hollow = T === 'impact' || T === 'chocFrott' ? 0.3 : T === 'idleCase' ? 0.25 : T === 'minor' ? 0.65 : T === 'vehicle' ? 0.7 : T === 'rubbing' ? 0.75 : 1; // the car slows down then picks up its speed
    o.r = x < dur ? u.spd * (hollow + (1 - hollow) * x / dur) : u.spd; o.sp = o.r * 80; o.rub = rubs ? 1 : o.rub;
    if (trialFam && !trialFam.doneFlag) { trialFam.doneFlag = 1; o.hitV = T === 'impact' || T === 'chocFrott' ? 12 : T === 'minor' ? 5 : 0; o.bump = T === 'vehicle' ? 2 : 0; }
    o.stun = (T === 'impact' || T === 'chocFrott') && x < 0.7 ? 0.7 - x : 0;
    return o;
  }
  const music = () => raceCase({ r: u.spd, sp: u.spd * 80, full: u.full, drift: u.glisse, tun: u.tunnel ? 1 : 0, rub: u.intoWall ? 1 : 0, rpm: 0.2, load: 0, gas: 0 });
  // full state sent to SOUND.frame
  function curState(sc, x) {
    const o = sc && sc[5] ? sc[5](x) : { state: 'pause' }, r = o.r || 0;
    return { intoWall: o.intoWall || 0, otherCars: o.otherCars, state: o.state, lapRun: Math.max(0, u.lapRun), lapCount: u.lapRun < 0 ? 0 : 3, T: { h0: 500, h1: 700, n: 1000 }, hot: o.full ? 1 : 0, tun: o.tun || 0, amb: o.amb || 0, rainFx: o.rainFx || 0,
      car: { manual: !!o.manualGear, dd: o.dd || 0, driftT: o.driftT || 0, vl: o.slide ? 4 + 14 * o.slide : 0, boost: o.boost || 0, ground: o.ground, idx: o.idx != null ? o.idx : o.full ? 600 : 0, dist: 1, drift: !!o.drift, rub: o.rub || 0 },
      r, sp: o.sp || 0, gas: o.gas || 0, hit: o.hitV || (pulse.hit ? 9 : 0), bump: o.bump || 0, up: !!pulse.up, down: !!pulse.down, rpm: o.rpm || 0.2, load: o.load || 0, spool: o.spool || 0, stun: o.stun || 0 };
  }
  const sound = () => SOUND.ac && SOUND.live;
  setInterval(() => { if (!sound()) return; SOUND.frame(1 / 60, curState(scene, SOUND.ac.currentTime - t0)); pulse.up = pulse.down = pulse.hit = 0; }, 16); // setInterval: continues with the window hidden

  function volumes() { for (const k in FAMILY) { const v = +$('v-' + k).value; $('o-' + k).textContent = v.toFixed(2).replace('.', ','); if (sound()) SOUND.volume(k, scene && scene[3].includes(k) ? v : 0); } }
  function playOne(id) {
    if (!sound()) return;
    const sc = SC[id]; scene = sc; t0 = SOUND.ac.currentTime; pulse.doneFlag = 0;
    if (/^st\d$/.test(id)) { if (SOUND.station !== +id[2]) SOUND.setStation(+id[2]); }
    volumes(); SOUND.monitor(10 ** (sc[4] / 20));
    if (sc[6]) sc[6]();
    for (const b of document.querySelectorAll('[data-sc]')) b.className = b.dataset.sc === id ? 'on' : '';
    $('whatLine').innerHTML = `En écoute : <b>${heading(id)}</b>` + (sc[4] ? ` — amplified by <b>+${sc[4]} dB</b> for listening alone (in play, this sound is ${sc[4]} dB plus bas)` : ' — at the game\'s real level');
  }
  function stop() { scene = null; if (sound()) { volumes(); SOUND.monitor(1); } for (const b of document.querySelectorAll('[data-sc]')) b.className = ''; $('whatLine').textContent = 'Nothing is playing. Click a sound: it plays alone, everything else is cut.'; }
  const heading = id => /^st\d$/.test(id) ? M.radio[+id[2]].name + ' ' + M.radio[+id[2]].fq : SC[id][1];
  const under = id => /^st\d$/.test(id) ? M.radio[+id[2]].genre.toLowerCase() + ' · ' + M.radio[+id[2]].bpm + ' bpm' : SC[id][2];
  function buttonSet() {
    $('mapDefs').innerHTML = MAPS.map(c => `<button data-c="${c.id}" class="${c === M ? 'on' : ''}">${c.label}</button>`).join('');
    for (const g of ['mus', 'motorFam', 'tire', 'impact', 'amb', 'rainFx', 'ui', 'mix']) $('g-' + g).innerHTML = Object.keys(SC).filter(id => SC[id][0] === g && !(/^st\d$/.test(id) && +id[2] >= M.radio.length)).map(id => `<button data-sc="${id}" class="${scene === SC[id] ? 'on' : ''}">${heading(id)}<small>${under(id)}</small></button>`).join('');
  }
  // validation: an opinion per track, kept in the browser
  let AV = {}; try { AV = JSON.parse(localStorage.getItem('vpr.avis') || '{}'); } catch (e) { }
  const retain = () => { try { localStorage.setItem('vpr.avis', JSON.stringify(AV)); } catch (e) { } };
  const tracks = () => MAPS.flatMap(c => [...c.radio.map((r, i) => ({ k: c.id + ':' + i, c, i, label: r.name + ' ' + r.fq, genre: r.genre.toLowerCase() + ' · ' + r.bpm + ' bpm' })), { k: c.id + ':m', c, i: -1, label: 'Musique de menu', genre: 'boucle calme' }]);
  let listening = null;
  function opinions() {
    let h = '<table>', mapDef = null;
    for (const p of tracks()) { const a = AV[p.k] || {};
      if (p.c !== mapDef) { mapDef = p.c; h += '<tr><td class="c" colspan="4">' + p.c.label + '</td></tr>'; }
      h += '<tr class="' + (listening === p.k ? 'nowPlaying' : '') + '"><td style="white-space:nowrap"><button data-av="' + p.k + '">▶</button>' + (p.i >= 0 ? '<button data-av="' + p.k + '" data-plein="1">▶ plein</button>' : '') + '</td><td><b>' + p.label + '</b><br><small style="color:#a8a8b4">' + p.genre + '</small></td>' +
        '<td style="white-space:nowrap"><button class="ok' + (a.v === 1 ? ' on' : '') + '" data-v="' + p.k + ':1">Validated</button><button class="ko' + (a.v === 0 ? ' on' : '') + '" data-v="' + p.k + ':0">To change</button></td>' +
        '<td style="width:45%"><input type="text" data-n="' + p.k + '" placeholder="what is wrong, what you want" value="' + (a.n || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;') + '"></td></tr>'; }
    $('opinions').innerHTML = h + '</table>';
  }
  $('opinions').addEventListener('input', e => { const k = e.target.dataset.n; if (k) { (AV[k] = AV[k] || {}).n = e.target.value; retain(); } });
  function summary() {
    const L = tracks().map(p => { const a = AV[p.k] || {}; return p.c.id + ' — ' + p.label + ' (' + p.genre + ') : ' + (a.v === 1 ? 'VALIDÉE' : a.v === 0 ? 'TO CHANGE' : 'not yet judged') + (a.n ? ' — ' + a.n : ''); }).join('\n');
    $('bilanTxt').style.display = 'block'; $('bilanTxt').value = L; $('bilanTxt').select();
    if (navigator.clipboard) navigator.clipboard.writeText(L).then(() => { $('summary').textContent = 'Report copied'; setTimeout(() => { $('summary').textContent = 'Copy the report'; }, 2000); }, () => { });
    return L;
  }
  $('summary').onclick = summary; $('resetRng').onclick = () => { if (confirm('Effacer tous vos avis ?')) { AV = {}; retain(); opinions(); } };
  document.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.ev) { if (!sound()) return; if (scene !== SC.attempt) playOne('attempt'); trialFam = { type: b.dataset.ev, t: SOUND.ac.currentTime };
      $('whatLine').innerHTML = 'Triggered on the music: <b>' + b.textContent + '</b>'; b.className = 'on'; setTimeout(() => { b.className = ''; }, 600); return; }
    if (b.dataset.av) { const [id, i] = b.dataset.av.split(':'), c = MAPS.find(x => x.id === id); if (c !== M) { stop(); M = c; SOUND.mapDef(M); }
      u.full = !!b.dataset.full; $('full').checked = u.full; listening = b.dataset.av; playOne(i === 'm' ? 'menu' : 'st' + i); buttonSet(); opinions(); return; }
    if (b.dataset.v) { const k = b.dataset.v.slice(0, -2), v = +b.dataset.v.slice(-1); AV[k] = AV[k] || {}; AV[k].v = AV[k].v === v ? undefined : v; retain(); opinions(); return; } if (b.dataset.sc) playOne(b.dataset.sc); else if (b.dataset.c) { stop(); M = MAPS.find(c => c.id === b.dataset.c); SOUND.mapDef(M); buttonSet(); } });
  for (const k in FAMILY) $('fmly').insertAdjacentHTML('beforeend', `<label><span class="n">${FAMILY[k]}</span><input type="range" id="v-${k}" min="0" max="2" step="0.05" value="1"><output id="o-${k}"></output></label>`);
  for (const k in FAMILY) $('v-' + k).oninput = volumes;
  $('chocMus').onclick = () => { pulse.hit = 1; }; $('lapRun').onchange = e => { u.lapRun = +e.target.value; };
  for (const id of ['full', 'glisse', 'tunnel', 'intoWall', 'throttle']) $(id).onchange = e => { u[id] = e.target.checked; };
  for (const id of ['spd', 'rpm', 'slide', 'force']) { const el = $(id), out = el.nextElementSibling; (el.oninput = () => { u[id] = +el.value; out.textContent = (+el.value).toFixed(2).replace('.', ','); })(); }
  $('stop').onclick = () => { stop(); listening = null; opinions(); };
  $('go').onclick = () => { SOUND.init(); stop(); buttonSet(); $('veil').remove(); };

  // VU meter: what really leaves the page (after the listening amplification)
  const dB = v => v > 1e-6 ? 20 * Math.log10(v) : -120, fmt = v => v < -100 ? '-inf' : v.toFixed(1);
  let holdTime = -120, crest = -120; const buf = new Float32Array(2048);
  setInterval(() => {
    if (!sound() || !SOUND.vu) return;
    SOUND.vu.getFloatTimeDomainData(buf); let s = 0, p = 0; for (const x of buf) { s += x * x; p = Math.max(p, Math.abs(x)); }
    const rms = dB(Math.sqrt(s / buf.length)); crest = dB(p); holdTime = Math.max(holdTime - 0.6, crest);
    const pos = v => Math.max(0, Math.min(100, (v + 60) / 60 * 100)) + '%';
    $('niv').style.width = pos(rms); $('holdTime').style.left = pos(holdTime); $('voyant').className = crest > -50 ? 'on' : '';
    $('db').textContent = crest > -70 ? `${fmt(rms)} dB · peak ${fmt(holdTime)}` : 'silence';
  }, 50);

  // self-test: each button plays 1.2 s; it must output a peak of at least -30 dB
  const waitMs = ms => new Promise(ok => setTimeout(ok, ms));
  async function autotest() {
    const L = [];
    for (const id of Object.keys(SC)) { if (/^st\d$/.test(id) && +id[2] >= M.radio.length) continue; playOne(id); let max = -120; for (let i = 0; i < (id === 'evt' || id === 'thunder' ? 60 : 24); i++) { await waitMs(50); max = Math.max(max, crest); } L.push({ sound: heading(id), crest: fmt(max), ok: max >= -30 }); }
    stop(); window.__autotest = L;
    $('measures').innerHTML = '<table><tr><th>button</th><th>output peak (dB)</th><th></th></tr>' + L.map(l => `<tr><td>${l.sound}</td><td>${l.crest}</td><td class="${l.ok ? 'ok' : 'reject'}">${l.ok ? 'OK' : 'KO'}</td></tr>`).join('') + '</table>';
    return L;
  }
  // measure: each scene alone in an offline context, at the game's real level, driven step by step by the same SOUND.frame
  async function renderClip(mapDef, id, dur = 8) {
    const sr = 44100, ctx = new OfflineAudioContext(2, sr * dur, sr), sc = SC[id], mem = Object.assign({}, u);
    SOUND.mapDef(mapDef); SOUND.init(ctx); await SOUND.readyMs; if (/^st\d$/.test(id)) SOUND.setStation(+id[2]);
    for (const k in FAMILY) SOUND.volume(k, sc[3].includes(k) ? 1 : 0);
    pulse.doneFlag = 0; let jolts = 0;
    const stepSec = t => { if (sc[6] && id !== 'radio' && t >= 2 + jolts) { jolts++; sc[6](); } for (let i = 0; i < 3; i++) { SOUND.frame(1 / 60, curState(sc, t + i / 60)); pulse.up = pulse.down = pulse.hit = 0; } SOUND.pump(); }; // one-off sounds: one per second from 2 s
    stepSec(0); for (let t = 0.05; t < dur; t += 0.05) ctx.suspend(t).then(() => { stepSec(t); ctx.resume(); });
    const b = await ctx.startRendering(); let sum = 0, peak = 0, n = 0;
    for (let c = 0; c < 2; c++) { const x = b.getChannelData(c); for (let i = sr * 2; i < x.length; i++) { sum += x[i] * x[i]; peak = Math.max(peak, Math.abs(x[i])); n++; } } // the first 2 seconds (attacks, filters opening) are discarded
    Object.assign(u, mem); if (dur > 8) return b;
    return { mapDef: mapDef.id, source: headingDe(mapDef, id), fmly: sc[3].length > 1 ? 'everything' : sc[3][0], rms: fmt(dB(Math.sqrt(sum / n))), crest: fmt(dB(peak)) };
  }
  window.__render = renderClip; // before/after recordings
  const headingDe = (c, id) => /^st\d$/.test(id) ? c.radio[+id[2]].genre.toLowerCase() : SC[id][1];
  async function measureOne(mapDef) {
    const L = [];
    for (const id of Object.keys(SC)) { if (id === 'radio' || id === 'adjustable' || id === 'skidR' || (/^st\d$/.test(id) && +id[2] >= mapDef.radio.length)) continue; // st3: only for a map with four stations
      if (/^st\d$/.test(id) || id === 'everything') for (const full of [false, true]) { u.full = full; u.glisse = id === 'everything' && full; const l = await renderClip(mapDef, id); l.source += full ? ', plein' : ', light'; L.push(l); }
      else L.push(await renderClip(mapDef, id)); }
    u.full = $('full').checked; u.glisse = $('glisse').checked; return L;
  }
  async function launch(mapDefs) {
    stop(); $('measures').textContent = 'Mesure en cours…'; const L = [], m0 = M, snap = Object.entries(localStorage).filter(([k]) => k.startsWith('vpr.radio')); // the measure must not change the saved station
    for (const c of mapDefs) L.push(...await measureOne(c));
    for (const k of Object.keys(localStorage)) if (k.startsWith('vpr.radio')) localStorage.removeItem(k); for (const [k, v] of snap) localStorage.setItem(k, v);
    SOUND.mapDef(m0); SOUND.init(); stop(); buttonSet(); window.__measures = L;
    $('measures').innerHTML = '<table><tr><th>map</th><th>source</th><th>family</th><th>RMS (dB)</th><th>peak (dB)</th></tr>' + L.map(l => `<tr><td>${l.mapDef}</td><td>${l.source}</td><td>${l.fmly}</td><td>${l.rms}</td><td>${l.crest}</td></tr>`).join('') + '</table>';
    return L;
  }
  // variety: energy profile per band of each station (offline render), pairwise correlation, spectral centroid
  function fft(re, im) { const n = re.length; for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { let x = re[i]; re[i] = re[j]; re[j] = x; x = im[i]; im[i] = im[j]; im[j] = x; } }
    for (let len = 2; len <= n; len <<= 1) { const a = -2 * Math.PI / len; for (let i = 0; i < n; i += len) for (let k = 0; k < len / 2; k++) { const c = Math.cos(a * k), d = Math.sin(a * k), p = i + k, q = p + len / 2, xr = re[q] * c - im[q] * d, xi = re[q] * d + im[q] * c; re[q] = re[p] - xr; im[q] = im[p] - xi; re[p] += xr; im[p] += xi; } } }
  function profReport(b) { // { stripes: 26 levels in dB, centroid: spectral centroid in Hz }
    const N = 4096, sr = b.sampleRate, L = b.getChannelData(0), Rr = b.getChannelData(1), P = new Float64Array(N / 2), re = new Float64Array(N), im = new Float64Array(N);
    for (let o = sr * 2; o + N <= L.length; o += N / 2) { for (let i = 0; i < N; i++) { re[i] = (L[o + i] + Rr[o + i]) * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / N)); im[i] = 0; } fft(re, im); for (let i = 0; i < N / 2; i++) P[i] += re[i] * re[i] + im[i] * im[i]; }
    const B = new Float64Array(26); let sf = 0, sp = 0;
    for (let i = 1; i < N / 2; i++) { const f = i * sr / N; sf += f * P[i]; sp += P[i]; const k = Math.floor(26 * Math.log(f / 40) / Math.log(400)); if (k >= 0 && k < 26) B[k] += P[i]; }
    const max = Math.max(...B); return { stripes: Array.from(B, v => Math.max(-70, 10 * Math.log10(v / max + 1e-12))), centroid: sf / sp };
  }
  function corr(a, b) { const n = a.length, ma = a.reduce((x, y) => x + y) / n, mb = b.reduce((x, y) => x + y) / n; let sab = 0, sa = 0, sb = 0; for (let i = 0; i < n; i++) { sab += (a[i] - ma) * (b[i] - mb); sa += (a[i] - ma) ** 2; sb += (b[i] - mb) ** 2; } return sab / Math.sqrt(sa * sb); }
  async function variety() {
    stop(); $('measures').textContent = 'Rendering the 15 stations…'; const m0 = M, snap = Object.entries(localStorage).filter(([k]) => k.startsWith('vpr.radio')), R = { stations: [], pairs: [] };
    for (const full of [false, true]) { u.full = full; for (const c of MAPS) for (let i = 0; i < 3; i++) R.stations.push(Object.assign({ mapDef: c.id, genre: c.radio[i].genre.toLowerCase(), full }, profReport(await renderClip(c, 'st' + i, 16)))); }
    u.full = $('full').checked;
    for (const k of Object.keys(localStorage)) if (k.startsWith('vpr.radio')) localStorage.removeItem(k); for (const [k, v] of snap) localStorage.setItem(k, v);
    SOUND.mapDef(m0); SOUND.init(); stop(); buttonSet();
    const res = {};
    for (const full of [false, true]) { const S = R.stations.filter(x => x.full === full), all = []; let high = 0, worstFrame = 0;
      for (let i = 0; i < 15; i++) for (let j = i + 1; j < 15; j++) { const c = corr(S[i].stripes, S[j].stripes); all.push(c); if (c > 0.9) high++; if (S[i].mapDef === S[j].mapDef) { worstFrame = Math.max(worstFrame, c); R.pairs.push({ full, mapDef: S[i].mapDef, a: S[i].genre, b: S[j].genre, c }); } }
      all.sort((a, b) => a - b); res[full ? 'full' : 'lite'] = { above_0_9: high, median: +all[52].toFixed(2), worst_same_map: +worstFrame.toFixed(2), ok: high < 15 && worstFrame <= 0.75 }; }
    R.resume = res; window.__variety = R;
    const f = v => v.toFixed(2).replace('.', ','), tab = (heading, rows) => '<table><tr>' + heading.map(x => '<th>' + x + '</th>').join('') + '</tr>' + rows.map(r => '<tr>' + r.map(x => '<td' + (x === 'OK' ? ' class="ok"' : x === 'KO' ? ' class="ko"' : '') + '>' + x + '</td>').join('') + '</tr>').join('') + '</table>';
    $('measures').innerHTML = tab(['arrangement', 'pairs > 0.9 (out of 105)', 'médiane', 'worst pair of one map', ''], ['lite', 'full'].map(k => [k, res[k].above_0_9, f(res[k].median), f(res[k].worst_same_map), res[k].ok ? 'OK' : 'KO'])) +
      '<br>' + tab(['mapDef', 'pair', 'correlation light', 'correlation full'], R.pairs.filter(p => !p.full).map(p => [p.mapDef, p.a + ' / ' + p.b, f(p.c), f(R.pairs.find(q => q.full && q.a === p.a && q.b === p.b).c)])) +
      '<br>' + tab(['mapDef', 'station', 'light spectral centroid (Hz)', 'plein (Hz)'], R.stations.filter(x => !x.full).map(x => [x.mapDef, x.genre, Math.round(x.centroid), Math.round(R.stations.find(y => y.full && y.genre === x.genre).centroid)]));
    return R;
  }
  $('variety').onclick = variety;
  $('autotest').onclick = autotest; $('measureOne').onclick = () => launch([M]); $('mesurerTout').onclick = () => launch(MAPS);
  window.__bench = { summary, opinions, launch, measureOne, renderClip, autotest, variety, profReport, corr, playOne, stop, SC, u };
  // tabs: one family of sounds at a time; the last one opened is kept
  const browserTab = id => { for (const b of document.querySelectorAll('#nav button')) b.setAttribute('aria-pressed', b.dataset.tab === id); for (const s of document.querySelectorAll('main > section')) s.hidden = s.dataset.tab !== id; try { sessionStorage.setItem('banc.tab', id); } catch (e) { } };
  $('nav').onclick = e => { const b = e.target.closest('button'); if (b) browserTab(b.dataset.tab); };
  let tab0 = 'opinions'; try { tab0 = sessionStorage.getItem('banc.tab') || tab0; } catch (e) { } browserTab(document.querySelector(`#nav [data-tab="${tab0}"]`) ? tab0 : 'opinions');
  buttonSet(); volumes(); opinions();
})();
