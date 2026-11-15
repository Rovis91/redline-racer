// Éditeur de musique — onglet « Motifs » : la grille de pas de la section choisie, une ligne par piste rythmique (batterie, accords plaqués, arpège).
// 16 pas par mesure. Clic : poser le signe du pinceau (on l'entend) ; clic sur un pas rempli ou clic droit : effacer ; glisser : peindre.
const pinceau = {}; let peint = null; // signe posé par piste ; signe en cours de peinture pendant un glisser
addEventListener('pointerup', () => { peint = null; });
const essaiPas = (p, c) => { if (c === '.' || !SON.ac) return; if (BAT(p)) SON.coup(p, c); else essai(p); };

VUES.motifs = H => {
  const k = sel.sec, sec = st.sec[k], parts = PISTES.filter(p => st[p] && PAS(p));
  if (!parts.length) H.append(el('p', '', 'Cette station n\'a aucune piste rythmique : ajoute-en une dans la liste des pistes.'));
  for (const p of parts) {
    const V = variantes(p), x = sec[p], vi = x ? x.v % V.length : -1, row = el('div', 'rang' + (p === sel.p ? ' sel' : '')), tete = el('div', 'tete'), signes = Object.keys(SIGNES[p]);
    row.style.setProperty('--c', COUL[p]); pinceau[p] = pinceau[p] || signes.find(c => isNaN(c)) || signes[0]; // les chiffres (toms) sortent en tête des clés : le pinceau par défaut est le premier signe en lettre
    tete.append(bouton(NOM[p], `Choisir la piste ${NOM[p]}`, () => choisir(p, null, 'motifs'), 'nomp'), selVariante(p, k));
    if (x) {
      const big = el('label', '', '<input type="checkbox"> chaud'), cb = big.firstChild; big.title = 'Ne joue que dans le secteur chaud (et le dernier secteur)'; cb.checked = x.big; cb.onchange = () => { x.big = cb.checked; touch(); build(); }; tete.append(big);
      if (signes.length > 1) { const ps = el('select'); for (const c of signes) ps.add(new Option(SIGNES[p][c], c)); ps.value = pinceau[p]; ps.title = 'Pinceau : le signe posé par un clic'; ps.setAttribute('aria-label', `Pinceau : ${NOM[p]}`); ps.onchange = () => { pinceau[p] = ps.value; essaiPas(p, ps.value); }; tete.append(ps); }
      tete.append(mesures(p, V[vi]));
    }
    row.append(tete);
    const corps = el('div', 'corps'); row.append(corps);
    if (x) V[vi].forEach((_, bi) => corps.append(grille(p, vi, V[vi], bi)));
    else corps.append(el('span', 'doux', 'ne joue pas dans cette section'));
    H.append(row);
  }
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
