// Éditeur de musique — onglet « Instrument » : quel instrument joue la piste choisie, ses réglages simples (volume, octave, stéréo, son, réverbération, écho),
// et le clavier pour l'essayer. Pour la batterie : le choix de la boîte à rythmes (commune aux quatre pistes de batterie) et un pad par son.
function essai(p, pn) { // fait entendre la piste p (avec le timbre pn s'il est donné) : une note, ou l'accord en cours pour la nappe et les accords
  if (!allumer()) return; const ch = st.prog[st.sec[sel.sec].P || 0].CH[0], o = octaveDe(p);
  if (p === 'b') SON.note('b', (SON.fond || st.prog[0].ROOT[0]) + o, pn);
  else if (p === 'l') SON.note('l', st.key + 12 + o, pn);
  else if (p === 'a') SON.note('a', ch[0] + 12 + o, pn);
  else for (const n of ch) SON.note(p, n + (p === 'd' ? 0 : 12) + o, pn);
}
// clavier de l'ordinateur (position physique des touches : rangée du milieu = touches blanches, rangée du haut = touches noires) et clavier à l'écran
const TOUCHES = { KeyA: 0, KeyW: 1, KeyS: 2, KeyE: 3, KeyD: 4, KeyF: 5, KeyT: 6, KeyG: 7, KeyY: 8, KeyH: 9, KeyU: 10, KeyJ: 11, KeyK: 12, KeyO: 13, KeyL: 14, KeyP: 15, Semicolon: 16 };
const baseClavier = p => (p === 'b' ? 36 : 60) + octaveDe(p);
function toucher(i) { // i : demi-tons depuis le do du clavier ; sur une piste de batterie, les touches jouent ses sons dans l'ordre
  const p = sel.p; if (!allumer()) return;
  if (BAT(p)) { const s = Object.keys(SIGNES[p]); SON.coup(p, s[i % s.length]); } else SON.note(p, baseClavier(p) + i);
  const k = document.querySelector(`.clav [data-i="${i}"]`); if (k) { k.classList.add('on'); setTimeout(() => k.classList.remove('on'), 140); }
}

VUES.instrument = H => {
  const p = sel.p, cols = el('div', 'cols'), G = el('div'), D = el('div'); H.append(cols); cols.append(G, D);
  G.append(el('h2', '', `<span style="color:${COUL[p]}">${NOM[p]}</span>`));
  if (!BAT(p)) { const r = el('div', 'row', '<span>Instrument</span>'), b = bouton(libelle(timbreDe(p)) + ' …', 'Changer l\'instrument de la piste', () => ouvrir('banque')); r.append(b); if (timbreDe(p) !== timbreDe(p, orig)) r.classList.add('mod'); G.append(r); }
  slider(G, 'Volume', s => niveau(p, s), v => poserVolume(p, v), 0, 2, 0.05, dB).children[1].dataset.vol = p;
  if (BAT(p)) {
    G.append(el('h2', '', 'Boîte à rythmes'));
    const kits = el('div', 'banque'); kits.title = 'La même pour les quatre pistes de batterie'; G.append(kits);
    for (const k of SON.kits) { const b = bouton(KITN[k] || k, '', () => { st.kit = k; touch(); build(); SON.coup(p, Object.keys(SIGNES[p]).find(c => isNaN(c)) || '1'); }); b.setAttribute('aria-pressed', st.kit === k); kits.append(b); }
    D.append(el('h2', '', 'Sons de la piste'));
    const pads = el('div', 'banque'); D.append(pads);
    for (const [c, n] of Object.entries(SIGNES[p])) pads.append(bouton(n.slice(2), 'Écouter : ' + n.slice(2), () => { if (allumer()) SON.coup(p, c); }, 'pad'));
  } else {
    const fx = (s, k) => s.fx && s.fx[p] && s.fx[p][k] != null ? s.fx[p][k] : (SON.patch[timbreDe(p, s)] || {})[k] || 0, poserFx = (k, v) => { ((st.fx = st.fx || {})[p] = st.fx[p] || {})[k] = v; };
    slider(G, 'Octave', s => octaveDe(p, s) / 12, v => poserOctave(p, v * 12), -2, 2, 1, v => v ? (v > 0 ? '+' : '') + v : 'normale').children[1].addEventListener('change', () => essai(p));
    slider(G, 'Stéréo', s => s.pan && s.pan[p] != null ? s.pan[p] : (SON.patch[timbreDe(p, s)] || {}).pan || 0, v => { (st.pan = st.pan || {})[p] = v; }, -1, 1, 0.05, v => Math.abs(v) < 0.03 ? 'centre' : (v < 0 ? 'gauche ' : 'droite ') + Math.round(Math.abs(v) * 100) + ' %');
    slider(G, 'Son', s => (s.ton && s.ton[p]) || 0, v => { (st.ton = st.ton || {})[p] = v; }, -1, 1, 0.05, v => Math.abs(v) < 0.03 ? 'naturel' : v < 0 ? 'plus sombre' : 'plus clair');
    slider(G, 'Réverbération', s => fx(s, 'rv'), v => poserFx('rv', v), 0, 0.8, 0.05);
    slider(G, 'Écho', s => fx(s, 'ec'), v => poserFx('ec', v), 0, 0.8, 0.05);
  }
  D.append(el('h2', '', 'Clavier'));
  const cl = el('div', 'clav'); cl.title = 'Clic, ou touches Q S D F G H J K (blanches) et Z E T Y U (noires) d\'un clavier AZERTY'; D.append(cl);
  for (let i = 0; i <= 24; i++) { const noire = [1, 3, 6, 8, 10].includes(i % 12), k = el('button', noire ? 'n' : 'b'); k.type = 'button'; k.dataset.i = i; k.tabIndex = -1; k.setAttribute('aria-label', 'Touche ' + NOTES[i % 12]); k.onpointerdown = () => toucher(i); cl.append(k); }
  D.append(bouton('Supprimer cette piste', `Supprimer la piste ${NOM[p]} de la station`, () => { if (!confirm(`Supprimer la piste ${NOM[p]} de ${st.name} ? (Ctrl+Z pour la retrouver)`)) return; delete st[p]; for (const k in st.sec) delete st.sec[k][p]; touch(); build(); }, 'danger'));
};

// dialogue « Instrument » : tous les instruments, par famille ; un clic l'affecte à la piste choisie et le fait entendre (le dialogue reste ouvert pour en essayer d'autres)
VUES.banque = D => {
  const p = sel.p; if (BAT(p)) return $('dlg').close();
  const cur = timbreDe(p), pref = p === 'b' ? 'b' : p === 'l' ? 'l' : 'c', tous = SON.timbres.filter(t => !/^ak_/.test(t));
  for (const f of [pref, 'e', ...'bcl'.replace(pref, '')]) { // la famille faite pour la piste d'abord, puis les vrais instruments, puis le reste : tout instrument peut jouer toute piste
    D.append(el('h3', '', FAMN[f]));
    const bq = el('div', 'banque'); D.append(bq);
    for (const t of tous.filter(t => famille(t) === f).sort((a, b) => libelle(a).localeCompare(libelle(b), 'fr'))) {
      const b = bouton(libelle(t), `${libelle(t)} (${t})`, () => { poserTimbre(p, t); const pr = touch(); build(); pr.then(() => essai(p)); }); // un instrument enregistré se fait entendre une fois décodé
      b.setAttribute('aria-pressed', t === cur); if (t === timbreDe(p, orig)) b.classList.add('orig'); bq.append(b); }
  }
};
