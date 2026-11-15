// Éditeur de musique — onglet « Motif » : ce que joue la piste choisie dans la section choisie (le bloc cliqué dans l'arrangement).
// Batterie, accords, arpège : une grille de 16 pas par mesure. Basse et thème : le piano-roll (rouleau.js). La nappe tient l'accord : rien à écrire.
// Grille : clic = poser le signe du pinceau (on l'entend) ; clic sur un pas rempli ou clic droit = effacer ; glisser = peindre.
const pinceau = {}; let peint = null; // signe posé par piste ; signe en cours de peinture pendant un glisser
addEventListener('pointerup', () => { peint = null; });
const essaiPas = (p, c) => { if (c === '.' || !SON.ac) return; if (BAT(p)) SON.coup(p, c); else essai(p); };

VUES.motif = H => {
  const p = sel.p, k = sel.sec, sec = st.sec[k], x = sec[p], tete = el('div', 'bar tete'); H.append(tete);
  if (p === 'd') { // la nappe n'a pas de motif : elle joue ou non dans la section
    const l = el('label', '', `<input type="checkbox"> Joue dans la section ${k}`), cb = l.firstChild; cb.checked = !!x;
    cb.onchange = () => { if (cb.checked) sec.d = { v: 0, big: false }; else delete sec.d; touch(); build(); }; tete.append(l);
    H.append(el('p', '', 'La nappe tient l\'accord de chaque mesure : il n\'y a pas de notes à écrire. Son instrument se règle dans « Son de la piste ».'));
    return;
  }
  const V = variantes(p), vi = x ? x.v % V.length : -1, signes = PAS(p) ? Object.keys(SIGNES[p]) : [];
  tete.append(el('span', '', `Dans la section <b>${k}</b>, joue :`), selVariante(p, k));
  if (!x) return H.append(el('p', '', 'Cette piste ne joue pas dans cette section : choisis un motif dans la liste ci-dessus pour la faire jouer.'));
  const big = el('label', '', '<input type="checkbox"> seulement en secteur chaud'), cb = big.firstChild; big.title = 'Ne joue que dans le secteur chaud et le dernier secteur de la course (donc pas dans l\'éditeur)'; cb.checked = x.big; cb.onchange = () => { x.big = cb.checked; touch(); build(); }; tete.append(big);
  if (signes.length > 1) { pinceau[p] = pinceau[p] || signes.find(c => isNaN(c)) || signes[0]; // les chiffres (toms) sortent en tête des clés : le pinceau par défaut est le premier signe en lettre
    const l = el('label', '', 'Pinceau '), ps = el('select'); for (const c of signes) ps.add(new Option(SIGNES[p][c], c)); ps.value = pinceau[p]; ps.title = 'Le signe posé par un clic'; ps.setAttribute('aria-label', `Pinceau : ${NOM[p]}`); ps.onchange = () => { pinceau[p] = ps.value; essaiPas(p, ps.value); }; l.append(ps); tete.append(l); }
  else if (signes.length) pinceau[p] = signes[0];
  tete.append(mesures(p, V[vi]));
  const autres = sectionsDe(p, vi).filter(j => j !== k); if (autres.length) tete.append(el('small', '', `· ce motif joue aussi dans ${autres.join(' ')} : le modifier les change aussi`));
  if (ROUL(p)) { H.append(el('p', 'aide', 'Clic dans le vide : poser une note · glisser une note : la déplacer · tirer son bord droit : l\'allonger · clic droit : l\'effacer')); roll(H, p, vi); return; }
  H.append(el('p', 'aide', 'Clic : poser le signe du pinceau · clic sur un pas rempli ou clic droit : l\'effacer · glisser : peindre'));
  const corps = el('div', 'corps'); corps.style.setProperty('--c', COUL[p]); H.append(corps);
  V[vi].forEach((_, bi) => corps.append(grille(p, vi, V[vi], bi)));
};

function grille(p, vi, bars, bi) { // une mesure de 16 pas
  const g = el('div', 'mes'); Object.assign(g.dataset, { p, v: vi, b: bi, n: bars.length });
  for (let q = 0; q < 16; q++) {
    const b = el('button', 'pas'); b.type = 'button'; b.dataset.q = q;
    const maj = () => { const c = bars[bi][q]; b.textContent = c === '.' ? '' : c; b.classList.toggle('note', c !== '.'); b.setAttribute('aria-label', `${NOM[p]}, motif ${vi + 1}, mesure ${bi + 1}, pas ${q + 1} : ${c === '.' ? 'vide' : SIGNES[p][c] || c}`); };
    const ecrire = c => { if (bars[bi][q] === c) return; bars[bi] = bars[bi].slice(0, q) + c + bars[bi].slice(q + 1); maj(); touch(); essaiPas(p, c); };
    b.onpointerdown = e => { peint = e.button === 2 || bars[bi][q] !== '.' ? '.' : pinceau[p]; ecrire(peint); if (b.hasPointerCapture(e.pointerId)) b.releasePointerCapture(e.pointerId); };
    b.onpointerenter = e => { if (e.buttons && peint != null) ecrire(peint); };
    b.onkeydown = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); ecrire(bars[bi][q] !== '.' ? '.' : pinceau[p]); } };
    b.oncontextmenu = e => e.preventDefault();
    maj(); g.append(b);
  }
  return g;
}
