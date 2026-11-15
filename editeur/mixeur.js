// Éditeur de musique — onglets « Mixeur » (une tranche par piste, puis les réglages de toute la station), « Accords » et « Situation de course ».
function poserVolume(p, v, src) { // le volume d'une piste, affiché à plusieurs endroits (liste des pistes, mixeur, onglet Instrument) : tous suivent
  (st.mx = st.mx || {})[p] = v;
  for (const e of document.querySelectorAll(`[data-vol="${p}"]`)) { if (e !== src) e.value = v; const o = e.parentNode.querySelector('output'); if (o) o.textContent = dB(v); }
}

VUES.mixeur = H => {
  const T = el('div', 'tranches'); H.append(T);
  const tranche = (nom, coul, get, set, max, p) => { // curseur vertical
    const t = el('div', 'tranche'), f = el('input'), o = el('output'); Object.assign(f, { type: 'range', min: 0, max, step: 0.05, value: get(st), title: 'Double-clic : valeur d\'origine' }); f.className = 'vert'; f.setAttribute('aria-label', 'Volume : ' + nom); o.textContent = dB(get(st));
    f.oninput = () => { set(+f.value, f); o.textContent = dB(+f.value); touch(); }; f.ondblclick = () => { set(get(orig)); f.value = get(orig); o.textContent = dB(get(orig)); touch(); };
    const led = el('i', 'led'); if (p) { led.dataset.k = p; f.dataset.vol = p; }
    t.append(led, f, o); if (p) { const ms = el('div'); ms.append(boutonsMS(p)); t.append(ms); } else t.append(el('div', 'doux', '&nbsp;'));
    const n = p ? bouton(nom, `Choisir la piste ${nom}`, () => choisir(p, null, 'instrument'), 'nomp') : el('b', '', nom); n.style.color = coul; t.append(n);
    if (p === sel.p) t.classList.add('sel'); T.append(t);
  };
  tranche('Station', '#e8e8e4', s => s.vol == null ? 1 : s.vol, v => { st.vol = v; }, 3);
  for (const p of PISTES.filter(p => st[p])) tranche(NOM[p], COUL[p], s => niveau(p, s), (v, src) => poserVolume(p, v, src), 2, p);
};

// dialogue « Réglages de la station »
VUES.station = S => {
  const arr = (k, def) => st[k] = st[k] || def;
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

// la course simulée : la musique du jeu change selon la conduite ; ces réglages ne sont pas enregistrés
const course = { on: true, vit: 0.85, chaud: 0, fin: false, glisse: false };
VUES.course = H => {
  const B = el('div', 'bar'); H.append(B);
  const coche = (k, txt) => { const l = el('label', '', `<input type="checkbox"> ${txt}`); l.firstChild.checked = course[k]; l.firstChild.onchange = e => { course[k] = e.target.checked; }; B.append(l); };
  const curseur = (k, txt) => { const l = el('label', '', `${txt} <input type="range" min="0" max="1" step="0.01" style="width:140px">`); l.lastChild.value = course[k]; l.lastChild.oninput = e => { course[k] = +e.target.value; }; B.append(l); };
  coche('on', 'En course'); curseur('vit', 'Vitesse'); curseur('chaud', 'Secteur chaud'); B.lastChild.title = 'Au-dessus de 50 %, le refrain ★ joue en continu, avec les pistes marquées « chaud »'; coche('fin', 'Dernier secteur'); coche('glisse', 'Glisse');
};
// envoyée au vrai moteur (format de SON.frame), comme le fait le jeu
const etatCourse = () => { const gl = course.glisse, r = course.vit;
  return { state: course.on ? 'race' : 'count', tour: 0, tours: 0, T: { h0: 500, h1: 600, n: 1000 }, hot: course.chaud, tun: 0, amb: 0, pluie: 0, r, sp: r * 80, rpm: 0.6, load: 1, gas: 1, spool: 0, hit: 0, bump: 0,
    car: { manual: false, dd: gl ? 1 : 0, driftT: gl ? 1 : 0, vl: 0, boost: 0, idx: course.fin ? 700 : 100, dist: 1, drift: gl, rub: 0, d: 0 } }; };
