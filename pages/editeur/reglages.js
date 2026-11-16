// Éditeur de musique — volume des pistes, dialogues « Réglages de la station » et « Accords », situation de course envoyée au moteur.
function poserVolume(p, v, src) { // le volume d'une piste, affiché dans la liste des pistes
  (st.mx = st.mx || {})[p] = v;
  for (const e of document.querySelectorAll(`[data-vol="${p}"]`)) { if (e !== src) e.value = v; const o = e.parentNode.querySelector('output'); if (o) o.textContent = dB(v); }
}

// dialogue « Réglages de la station »
VUES.station = S => {
  const arr = (k, def) => st[k] = st[k] || def;
  slider(S, 'Volume de la station', s => s.vol == null ? 1 : s.vol, v => { st.vol = v; }, 0, 3, 0.05, dB);
  slider(S, 'Tempo', s => s.bpm, v => { st.bpm = v; $('bpm').value = v; }, 60, 200, 1);
  slider(S, 'Swing', s => s.sw || 0, v => { st.sw = v; }, 0, 0.3, 0.01);
  slider(S, 'Réverbération', s => s.rev == null ? 0.2 : s.rev, v => { st.rev = v; }, 0, 1, 0.05);
  slider(S, 'Écho : écart', s => (s.echo || [3])[0], v => { arr('echo', [3, 0.4])[0] = v; }, 1, 6, 1);
  slider(S, 'Écho : répétitions', s => (s.echo || [3, 0.4])[1], v => { arr('echo', [3, 0.4])[1] = v; }, 0, 0.8, 0.05);
  slider(S, 'Graves', s => (s.eq || [0, 1000, 0, 0])[0], v => { arr('eq', [0, 1000, 0, 0])[0] = v; }, -18, 18, 1, v => (v > 0 ? '+' : '') + v + ' dB');
  slider(S, 'Médiums', s => (s.eq || [0, 1000, 0, 0])[2], v => { arr('eq', [0, 1000, 0, 0])[2] = v; }, -18, 18, 1, v => (v > 0 ? '+' : '') + v + ' dB');
  slider(S, 'Aigus', s => (s.eq || [0, 1000, 0, 0])[3], v => { arr('eq', [0, 1000, 0, 0])[3] = v; }, -18, 18, 1, v => (v > 0 ? '+' : '') + v + ' dB');
  const av = el('details', '', '<summary>Réglages avancés</summary>'); S.append(av);
  slider(av, 'Médiums : fréquence <small>Hz</small>', s => (s.eq || [0, 1000, 0, 0])[1], v => { arr('eq', [0, 1000, 0, 0])[1] = v; }, 200, 5000, 50);
  slider(av, 'Pompe sous la grosse caisse <small>1 = aucune</small>', s => s.pump == null ? 0.35 : s.pump, v => { st.pump = v; }, 0, 1, 0.05);
  slider(av, 'Saturation de tout le son', s => s.drive || 0, v => { st.drive = v; }, 0, 1, 0.05);
  slider(av, 'Niveau des couplets <small>refrain = 1</small>', s => s.cv || 1, v => { st.cv = v; }, 0.5, 2.5, 0.05);
};

VUES.accords = H => {
  const secs = Object.keys(st.sec);
  st.accords.forEach((names, pi) => {
    H.append(el('h3', '', `Suite d'accords ${pi + 1} <small>· sections ${secs.filter(k => (st.sec[k].P || 0) === pi).join(' ') || 'aucune'}</small>`));
    const cg = el('div', 'chords'); H.append(cg);
    names.forEach((name, b) => {
      const [, n, alt, q] = name.match(/^([A-G])([b#]?)(.*)$/), c = el('div', '', `<span>Mesure ${b + 1}</span>`), rs = el('select'), qs = el('select');
      NOTES.forEach((t, i) => rs.add(new Option(t, i))); rs.value = (PC[n] + (alt === '#' ? 1 : alt === 'b' ? 11 : 0)) % 12; rs.setAttribute('aria-label', `Suite ${pi + 1}, mesure ${b + 1}, note de l'accord`);
      for (const k in MUS.QUAL) qs.add(new Option(QNOM[k] || k, k)); qs.value = q; qs.setAttribute('aria-label', `Suite ${pi + 1}, mesure ${b + 1}, type d'accord`);
      rs.onchange = qs.onchange = () => { names[b] = LETTRES[rs.value] + qs.value; MUS.accorder(st); touch(); if (allumer()) for (const x of st.prog[pi].CH[b]) SON.note('c', x + 12, timbreDe('c') || timbreDe('d') || 'epFM'); }; // on entend l'accord choisi
      c.append(rs, qs); cg.append(c);
    });
  });
};

// la situation de course envoyée au moteur, fixe : en course, vitesse de croisière, hors secteur chaud (les pistes marquées « chaud » ne jouent donc pas ici)
const course = { on: true, vit: 0.85, chaud: 0, fin: false, glisse: false };
// envoyée au vrai moteur (format de SON.frame), comme le fait le jeu
const etatCourse = () => { const gl = course.glisse, r = course.vit;
  return { state: course.on ? 'race' : 'count', tour: 0, tours: 0, T: { h0: 500, h1: 600, n: 1000 }, hot: course.chaud, tun: 0, amb: 0, pluie: 0, r, sp: r * 80, rpm: 0.6, load: 1, gas: 1, spool: 0, hit: 0, bump: 0,
    car: { manual: false, dd: gl ? 1 : 0, driftT: gl ? 1 : 0, vl: 0, boost: 0, idx: course.fin ? 700 : 100, dist: 1, drift: gl, rub: 0, d: 0 } }; };
