// Music editor — "Pattern" tab: what the chosen track plays in the chosen section (the block clicked in the arrangement).
// Drums, chords, arpeggio: a grid of 16 steps per measure. Bass and theme: the piano roll (roll.js). The pad holds the chord: nothing to write.
// Grid: click = place the brush's sign (you hear it); click on a filled step or right-click = erase; drag = paint.
const brush = {}; let paintedVal = null; // sign placed per track; sign being painted during a drag
addEventListener('pointerup', () => { paintedVal = null; });
const trialStep = (p, c) => { if (c === '.' || !SOUND.ac) return; if (DRUMSET(p)) SOUND.strike(p, c); else attempt(p); };

VIEWS.motif = H => {
  const p = sel.p, k = sel.sec, sec = st.sec[k], x = sec[p], headEl = el('div', 'bar tete'); H.append(headEl);
  if (p === 'd') { // the pad has no pattern: it plays or not in the section
    const l = el('label', '', `<input type="checkbox"> Plays in section ${k}`), cb = l.firstChild; cb.checked = !!x;
    cb.onchange = () => { if (cb.checked) sec.d = { v: 0, big: false }; else delete sec.d; touch(); build(); }; headEl.append(l);
    H.append(el('p', '', 'The pad holds the chord of each bar: there are no notes to write. Its instrument is set in "Track sound".'));
    return;
  }
  const V = variants(p), vi = x ? x.v % V.length : -1, marksList = STEP(p) ? Object.keys(MARKS[p]) : [];
  headEl.append(el('span', '', `In section <b>${k}</b>, joue :`), selVariant(p, k));
  if (!x) return H.append(el('p', '', 'This track does not play in this section: choose a pattern in the list above to make it play.'));
  const big = el('label', '', '<input type="checkbox"> seulement en secteur chaud'), cb = big.firstChild; big.title = 'Only plays in the hot sector and the last sector of the race (so not in the editor)'; cb.checked = x.big; cb.onchange = () => { x.big = cb.checked; touch(); build(); }; headEl.append(big);
  if (marksList.length > 1) { brush[p] = brush[p] || marksList.find(c => isNaN(c)) || marksList[0]; // the numbers (toms) come first in the keys: the default brush is the first sign in letters
    const l = el('label', '', 'Pinceau '), ps = el('select'); for (const c of marksList) ps.add(new Option(MARKS[p][c], c)); ps.value = brush[p]; ps.title = 'The sign placed by a click'; ps.setAttribute('aria-label', `Pinceau : ${LABEL[p]}`); ps.onchange = () => { brush[p] = ps.value; trialStep(p, ps.value); }; l.append(ps); headEl.append(l); }
  else if (marksList.length) brush[p] = marksList[0];
  headEl.append(measures(p, V[vi]));
  const otherCars = sectionsOf(p, vi).filter(j => j !== k); if (otherCars.length) headEl.append(el('small', '', `· this pattern also plays in ${otherCars.join(' ')} : editing it changes them too`));
  if (ROLL(p)) { H.append(el('p', 'help', 'Click in empty space: place a note · drag a note: move it · pull its right edge: lengthen it · right-click: erase it')); roll(H, p, vi); return; }
  H.append(el('p', 'help', 'Click: place the brush\'s sign · click on a filled step or right-click: erase it · drag: paint'));
  const payload = el('div', 'payload'); payload.style.setProperty('--c', TINT[p]); H.append(payload);
  V[vi].forEach((_, bi) => payload.append(grid(p, vi, V[vi], bi)));
};

function grid(p, vi, bars, bi) { // one measure of 16 steps
  const g = el('div', 'meas'); Object.assign(g.dataset, { p, v: vi, b: bi, n: bars.length });
  for (let q = 0; q < 16; q++) {
    const b = el('button', 'stepSec'); b.type = 'button'; b.dataset.q = q;
    const upd = () => { const c = bars[bi][q]; b.textContent = c === '.' ? '' : c; b.classList.toggle('note', c !== '.'); b.setAttribute('aria-label', `${LABEL[p]}, motif ${vi + 1}, mesure ${bi + 1}, step ${q + 1} : ${c === '.' ? 'empty' : MARKS[p][c] || c}`); };
    const writeCell = c => { if (bars[bi][q] === c) return; bars[bi] = bars[bi].slice(0, q) + c + bars[bi].slice(q + 1); upd(); touch(); trialStep(p, c); };
    b.onpointerdown = e => { paintedVal = e.button === 2 || bars[bi][q] !== '.' ? '.' : brush[p]; writeCell(paintedVal); if (b.hasPointerCapture(e.pointerId)) b.releasePointerCapture(e.pointerId); };
    b.onpointerenter = e => { if (e.buttons && paintedVal != null) writeCell(paintedVal); };
    b.onkeydown = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); writeCell(bars[bi][q] !== '.' ? '.' : brush[p]); } };
    b.oncontextmenu = e => e.preventDefault();
    upd(); g.append(b);
  }
  return g;
}
