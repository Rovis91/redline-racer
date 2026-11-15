// Éditeur de musique — arrangement : la liste des pistes (à gauche) et le morceau bloc par bloc (à droite), comme la playlist d'un séquenceur.
// Une colonne = un bloc de 4 mesures qui joue une section ; une case colorée = la piste joue dans cette section (le chiffre : son motif).
const DEFAUT = { // contenu d'une piste qu'on ajoute
  k: () => [['x...x...x...x...']], s: () => [['....x.......x...']], h: () => [['x.x.x.x.x.x.x.x.']], p: () => [['..m...m...m...m.']],
  b: () => ({ p: 'bPick', v: [[[0, null, null, null, 0, null, null, null, 0, null, null, null, 0, null, null, null]]] }), d: () => ['warm', 0],
  c: () => ({ p: 'epFM', v: [['x.......x.......']] }), g: () => ({ p: 'gtrMute', v: [['..x...x...x...x.']] }), a: () => ({ p: 'pluck', v: [['0.1.2.1.0.1.2.1.']] }),
  l: () => ({ p: 'ldSaw', v: [Array.from({ length: 4 }, () => Array(16).fill(R))] }) };

function arrangement() {
  const A = $('arr'), parts = PISTES.filter(p => st[p]), form = [...st.form], secs = Object.keys(st.sec); A.textContent = '';
  A.style.gridTemplateColumns = `minmax(380px, 420px) repeat(${form.length}, minmax(46px, 1fr)) 40px`;
  A.append(el('div', 'coin', 'Pistes'));
  form.forEach((k, i) => { // en-tête de bloc : quelle section il joue, et le retirer
    const h = el('div', 'bloc' + (k === sel.sec ? ' sel' : '')), s = el('select'); Object.assign(h.dataset, { i, k });
    for (const x of secs) s.add(new Option(x + (x === st.hot ? ' ★' : ''), x)); s.value = k; s.title = 'Section jouée par ce bloc (★ : le refrain)'; s.setAttribute('aria-label', `Bloc ${i + 1} : section jouée`);
    s.onchange = () => { st.form = st.form.slice(0, i) + s.value + st.form.slice(i + 1); sel.sec = s.value; touch(); build(); };
    const x = bouton('×', `Retirer le bloc ${i + 1}`, () => { st.form = st.form.slice(0, i) + st.form.slice(i + 1); touch(); build(); }, 'x'); x.disabled = form.length < 3; // le moteur a besoin d'au moins deux blocs
    h.append(s, x); A.append(h);
  });
  A.append(bouton('＋', `Ajouter à la fin un bloc qui joue la section ${sel.sec}`, () => { st.form += sel.sec; touch(); build(); }, 'plus'));
  for (const p of parts) {
    const h = el('div', 'piste' + (p === sel.p ? ' sel' : '')); h.dataset.p = p; h.style.setProperty('--c', COUL[p]);
    const ins = BAT(p) ? KITN[st.kit] || st.kit : libelle(timbreDe(p)), vol = el('input');
    Object.assign(vol, { type: 'range', min: 0, max: 2, step: 0.05, value: niveau(p), title: 'Volume de la piste (double-clic : valeur d\'origine)' }); vol.setAttribute('aria-label', 'Volume : ' + NOM[p]);
    vol.dataset.vol = p; vol.oninput = () => { poserVolume(p, +vol.value, vol); touch(); }; vol.ondblclick = () => { poserVolume(p, niveau(p, orig)); touch(); };
    h.append(el('i', 'led'), bouton(NOM[p], `Choisir la piste ${NOM[p]}`, () => choisir(p), 'nomp'), bouton(ins, `Instrument de la piste ${NOM[p]} : ${ins}`, () => choisir(p, null, 'instrument'), 'ins'), boutonsMS(p), vol);
    h.querySelector('.led').dataset.k = p; A.append(h);
    form.forEach((k, i) => { const x = st.sec[k][p], c = el('button', 'clip' + (x ? ' on' : '') + (k === sel.sec ? ' sel' : '') + (k === sel.sec && p === sel.p ? ' cur' : '')); c.type = 'button'; Object.assign(c.dataset, { i, k, p });
      if (x) { c.style.setProperty('--c', COUL[p]); c.textContent = (p === 'd' ? '' : x.v % nVar(p) + 1) + (x.big ? '!' : ''); }
      c.title = x ? `${NOM[p]} joue dans la section ${k}${x.big ? ' (seulement dans le secteur chaud)' : ''} — clic : modifier · clic droit : retirer` : `${NOM[p]} ne joue pas dans la section ${k} — clic : la faire jouer`;
      c.setAttribute('aria-label', `${NOM[p]}, bloc ${i + 1}, section ${k} : ${x ? 'joue' : 'ne joue pas'}`);
      c.onclick = () => { if (!st.sec[k][p]) { st.sec[k][p] = { v: 0, big: false }; touch(); } choisir(p, k); };
      c.oncontextmenu = e => { e.preventDefault(); if (st.sec[k][p]) { delete st.sec[k][p]; touch(); build(); } };
      A.append(c); });
    A.append(el('span'));
  }
  const manque = PISTES.filter(p => !st[p]);
  if (manque.length) { const s = el('select', 'ajout'); s.add(new Option('＋ Ajouter une piste…', '')); for (const p of manque) s.add(new Option(NOM[p], p)); s.setAttribute('aria-label', 'Ajouter une piste');
    s.onchange = () => { const p = s.value; st[p] = DEFAUT[p](); st.sec[sel.sec][p] = { v: 0, big: false }; touch(); choisir(p); }; A.append(s); }
}

// dialogue « Section » : les options de la section choisie, et la dupliquer
VUES.section = H => {
  const B = el('div', 'pile'), k = sel.sec, sec = st.sec[k]; H.append(B);
  const lab = el('label', '', 'Suite d\'accords '), ps = el('select'); st.accords.forEach((a, i) => ps.add(new Option(`${i + 1} : ${a.join(' ')}`, i))); ps.value = sec.P || 0;
  ps.onchange = () => { if (+ps.value) sec.P = +ps.value; else delete sec.P; touch(); build(); }; lab.append(ps); B.append(lab);
  for (const [flag, name, title] of [['roll', 'Montée', 'Roulement de caisse claire et souffle qui montent pendant la section'], ['lo', 'Son étouffé qui s\'ouvre', 'Toute la section commence étouffée et s\'éclaircit'], ...(st.gate ? [['gate', 'Nappe hachée', 'La nappe est découpée en rythme']] : [])]) {
    const l = el('label', '', `<input type="checkbox"> ${name}`), cb = l.firstChild; l.title = title; cb.checked = !!sec[flag];
    cb.onchange = () => { if (cb.checked) sec[flag] = 1; else delete sec[flag]; touch(); }; B.append(l); }
  B.append(bouton('Dupliquer en nouvelle section', 'Crée une nouvelle section, copie de celle-ci, et l\'ajoute à la fin du morceau', () => {
    const n = [...'abdfghijmnoqrstuvwxyz'].find(x => !st.sec[x]); if (!n) return; // « e » est réservée par le moteur à la variation du refrain
    st.sec[n] = JSON.parse(JSON.stringify(sec)); st.form += n; sel.sec = n; touch(); build(); }));
};
