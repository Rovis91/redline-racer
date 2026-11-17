// Music editor — track volumes, "Station settings" and "Chords" dialogs, race situation sent to the engine.
function setVolume(p, v, src) { // the volume of a track, shown in the track list
  (st.mx = st.mx || {})[p] = v;
  for (const e of document.querySelectorAll(`[data-vol="${p}"]`)) { if (e !== src) e.value = v; const o = e.parentNode.querySelector('output'); if (o) o.textContent = dB(v); }
}

// "Station settings" dialog
VIEWS.station = S => {
  const arr = (k, def) => st[k] = st[k] || def;
  slider(S, 'Station volume', s => s.vol == null ? 1 : s.vol, v => { st.vol = v; }, 0, 3, 0.05, dB);
  slider(S, 'Tempo', s => s.bpm, v => { st.bpm = v; $('bpm').value = v; }, 60, 200, 1);
  slider(S, 'Swing', s => s.sw || 0, v => { st.sw = v; }, 0, 0.3, 0.01);
  slider(S, 'Réverbération', s => s.rev == null ? 0.2 : s.rev, v => { st.rev = v; }, 0, 1, 0.05);
  slider(S, 'Echo: spacing', s => (s.echo || [3])[0], v => { arr('echo', [3, 0.4])[0] = v; }, 1, 6, 1);
  slider(S, 'Echo: repeats', s => (s.echo || [3, 0.4])[1], v => { arr('echo', [3, 0.4])[1] = v; }, 0, 0.8, 0.05);
  slider(S, 'Graves', s => (s.eq || [0, 1000, 0, 0])[0], v => { arr('eq', [0, 1000, 0, 0])[0] = v; }, -18, 18, 1, v => (v > 0 ? '+' : '') + v + ' dB');
  slider(S, 'Médiums', s => (s.eq || [0, 1000, 0, 0])[2], v => { arr('eq', [0, 1000, 0, 0])[2] = v; }, -18, 18, 1, v => (v > 0 ? '+' : '') + v + ' dB');
  slider(S, 'Aigus', s => (s.eq || [0, 1000, 0, 0])[3], v => { arr('eq', [0, 1000, 0, 0])[3] = v; }, -18, 18, 1, v => (v > 0 ? '+' : '') + v + ' dB');
  const av = el('details', '', '<summary>Advanced settings</summary>'); S.append(av);
  slider(av, 'Mids: frequency <small>Hz</small>', s => (s.eq || [0, 1000, 0, 0])[1], v => { arr('eq', [0, 1000, 0, 0])[1] = v; }, 200, 5000, 50);
  slider(av, 'Pumping under the kick <small>1 = none</small>', s => s.pump == null ? 0.35 : s.pump, v => { st.pump = v; }, 0, 1, 0.05);
  slider(av, 'Saturation of the whole sound', s => s.drive || 0, v => { st.drive = v; }, 0, 1, 0.05);
  slider(av, 'Verse level <small>chorus = 1</small>', s => s.cv || 1, v => { st.cv = v; }, 0.5, 2.5, 0.05);
};

VIEWS.chordSeq = H => {
  const secs = Object.keys(st.sec);
  st.chordSeq.forEach((names, pi) => {
    H.append(el('h3', '', `Suite d'accords ${pi + 1} <small>· sections ${secs.filter(k => (st.sec[k].P || 0) === pi).join(' ') || 'aucune'}</small>`));
    const cg = el('div', 'chords'); H.append(cg);
    names.forEach((name, b) => {
      const [, n, alt, q] = name.match(/^([A-G])([b#]?)(.*)$/), c = el('div', '', `<span>Mesure ${b + 1}</span>`), rs = el('select'), qs = el('select');
      NOTES.forEach((t, i) => rs.add(new Option(t, i))); rs.value = (PC[n] + (alt === '#' ? 1 : alt === 'b' ? 11 : 0)) % 12; rs.setAttribute('aria-label', `Suite ${pi + 1}, mesure ${b + 1}, note de l'accord`);
      for (const k in MUS.QUAL) qs.add(new Option(QLABEL[k] || k, k)); qs.value = q; qs.setAttribute('aria-label', `Suite ${pi + 1}, mesure ${b + 1}, type d'accord`);
      rs.onchange = qs.onchange = () => { names[b] = LETTERS[rs.value] + qs.value; MUS.tune(st); touch(); if (switchOn()) for (const x of st.prog[pi].CH[b]) SOUND.note('c', x + 12, timbreOf('c') || timbreOf('d') || 'epFM'); }; // on entend l'accord choisi
      c.append(rs, qs); cg.append(c);
    });
  });
};

// the race situation sent to the engine, fixed: in the race, cruising speed, outside the hot sector (tracks marked "hot" therefore don't play here)
const raceCase = { on: true, spd: 0.85, hotList: 0, ending: false, glisse: false };
// sent to the real engine (SOUND.frame format), as the game does
const raceState = () => { const gl = raceCase.glisse, r = raceCase.spd;
  return { state: raceCase.on ? 'race' : 'count', lapRun: 0, lapCount: 0, T: { h0: 500, h1: 600, n: 1000 }, hot: raceCase.hotList, tun: 0, amb: 0, rainFx: 0, r, sp: r * 80, rpm: 0.6, load: 1, gas: 1, spool: 0, hit: 0, bump: 0,
    car: { manual: false, dd: gl ? 1 : 0, driftT: gl ? 1 : 0, vl: 0, boost: 0, idx: raceCase.ending ? 700 : 100, dist: 1, drift: gl, rub: 0, d: 0 } }; };
