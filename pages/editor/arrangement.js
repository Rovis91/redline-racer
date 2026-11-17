// Music editor — arrangement: the track list (left) and the song block by block (right), like a sequencer's playlist.
// One column = one 4-bar block that plays a section; a colored cell = the track plays in that section (the number: its pattern).
const DEFAULTS = { // content of a track being added
  k: () => [['x...x...x...x...']], s: () => [['....x.......x...']], h: () => [['x.x.x.x.x.x.x.x.']], p: () => [['..m...m...m...m.']],
  b: () => ({ p: 'bPick', v: [[[0, null, null, null, 0, null, null, null, 0, null, null, null, 0, null, null, null]]] }), d: () => ['warm', 0],
  c: () => ({ p: 'epFM', v: [['x.......x.......']] }), g: () => ({ p: 'gtrMute', v: [['..x...x...x...x.']] }), a: () => ({ p: 'pluck', v: [['0.1.2.1.0.1.2.1.']] }),
  l: () => ({ p: 'ldSaw', v: [Array.from({ length: 4 }, () => Array(16).fill(R))] }) };

function arrangement() {
  const A = $('arr'), parts = AUDIO_TRACKS.filter(p => st[p]), form = [...st.form], secs = Object.keys(st.sec), lp = EC.loopSec; A.textContent = ''; A.classList.toggle('loopSec', !!lp);
  A.style.gridTemplateColumns = `minmax(380px, 420px) repeat(${form.length}, minmax(46px, 1fr)) 40px`;
  A.append(el('div', 'coin', 'Pistes'));
  form.forEach((k, i) => { // block header: choose its section (to edit it, loop it), change the section it plays, remove it
    const h = el('div', 'blk' + (k === sel.sec ? ' sel' : '') + (k === lp ? ' lp' : '')), s = el('select'); Object.assign(h.dataset, { i, k });
    const n = buttonEl(k + (k === st.hot ? ' ★' : ''), `Bloc ${i + 1} : choose section ${k}${k === st.hot ? ' (the chorus)' : ''} ; with Loop, it keeps looping on its own`, () => chooseSection(k), 'nsec');
    s.add(new Option('⇄', '')); for (const x of secs) s.add(new Option(`play section ${x}${x === st.hot ? ' ★' : ''}${x === k ? ' (actuelle)' : ''}`, x)); s.value = ''; s.title = 'Change the section played by this block'; s.setAttribute('aria-label', `Bloc ${i + 1} : change played section`);
    s.onchange = () => { if (!s.value) return; st.form = st.form.slice(0, i) + s.value + st.form.slice(i + 1); chooseSection(s.value, true); touch(); build(); };
    const x = buttonEl('×', `Remove block ${i + 1}`, () => { st.form = st.form.slice(0, i) + st.form.slice(i + 1); touch(); build(); }, 'x'); x.disabled = form.length < 3; // the engine needs at least two blocks
    h.append(n, s, x); A.append(h);
  });
  A.append(buttonEl('＋', `Add at the end a block that plays section ${sel.sec}`, () => { st.form += sel.sec; touch(); build(); }, 'plus'));
  for (const p of parts) {
    const h = el('div', 'circuit' + (p === sel.p ? ' sel' : '')); h.dataset.p = p; h.style.setProperty('--c', TINT[p]);
    const ins = DRUMSET(p) ? KITN[st.kit] || st.kit : caption(timbreOf(p)), vol = el('input');
    Object.assign(vol, { type: 'range', min: 0, max: 2, step: 0.05, value: levelAmt(p), title: 'Track volume (double-click: original value)' }); vol.setAttribute('aria-label', 'Volume : ' + LABEL[p]);
    vol.dataset.vol = p; vol.oninput = () => { setVolume(p, +vol.value, vol); touch(); }; vol.ondblclick = () => { setVolume(p, levelAmt(p, orig)); touch(); };
    h.append(el('i', 'led'), buttonEl(LABEL[p], `Choose track ${LABEL[p]}`, () => choose(p), 'nomp'), buttonEl(ins, `Track sound ${LABEL[p]} : ${ins}`, () => choose(p, null, 'sound'), 'ins'), buttonsMS(p), vol);
    h.querySelector('.led').dataset.k = p; A.append(h);
    form.forEach((k, i) => { const x = st.sec[k][p], c = el('button', 'clip' + (x ? ' on' : '') + (k === sel.sec ? ' sel' : '') + (k === sel.sec && p === sel.p ? ' cur' : '') + (k === lp ? ' lp' : '')); c.type = 'button'; Object.assign(c.dataset, { i, k, p });
      if (x) { c.style.setProperty('--c', TINT[p]); c.textContent = (p === 'd' ? '' : x.v % nVar(p) + 1) + (x.big ? '!' : ''); }
      c.title = x ? `${LABEL[p]} plays in section ${k}${x.big ? ' (only in the hot sector)' : ''} — click: edit what it plays · right-click: remove` : `${LABEL[p]} does not play in section ${k} — click: make it play and edit it`;
      c.setAttribute('aria-label', `${LABEL[p]}, bloc ${i + 1}, section ${k} : ${x ? 'nowPlaying' : 'does not play'}`);
      c.onclick = () => { if (!st.sec[k][p]) { st.sec[k][p] = { v: 0, big: false }; touch(); } choose(p, k); };
      c.oncontextmenu = e => { e.preventDefault(); if (st.sec[k][p]) { delete st.sec[k][p]; touch(); build(); } };
      A.append(c); });
    A.append(el('span'));
  }
  const missing = AUDIO_TRACKS.filter(p => !st[p]);
  if (missing.length) { const s = el('select', 'ajout'); s.add(new Option('＋ Add a track…', '')); for (const p of missing) s.add(new Option(LABEL[p], p)); s.setAttribute('aria-label', 'Add a track');
    s.onchange = () => { const p = s.value; st[p] = DEFAULTS[p](); st.sec[sel.sec][p] = { v: 0, big: false }; touch(); choose(p, sel.sec); }; A.append(s); }
}

// "Section" dialog: the options of the chosen section, and duplicating it
VIEWS.section = H => {
  const B = el('div', 'pier'), k = sel.sec, sec = st.sec[k]; H.append(B);
  const lab = el('label', '', 'Suite d\'accords '), ps = el('select'); st.chordSeq.forEach((a, i) => ps.add(new Option(`${i + 1} : ${a.join(' ')}`, i))); ps.value = sec.P || 0;
  ps.onchange = () => { if (+ps.value) sec.P = +ps.value; else delete sec.P; touch(); build(); }; lab.append(ps); B.append(lab);
  for (const [flag, name, title] of [['roll', 'Montée', 'Snare roll and rising breath during the section'], ['lo', 'Muffled sound that opens up', 'The whole section starts muffled and brightens'], ...(st.gate ? [['gate', 'Chopped pad', 'The pad is chopped to the rhythm']] : [])]) {
    const l = el('label', '', `<input type="checkbox"> ${name}`), cb = l.firstChild; l.title = title; cb.checked = !!sec[flag];
    cb.onchange = () => { if (cb.checked) sec[flag] = 1; else delete sec[flag]; touch(); }; B.append(l); }
  B.append(buttonEl('Dupliquer en nouvelle section', 'Creates a new section, a copy of this one, and adds it to the end of the song', () => {
    const n = [...'abdfghijmnoqrstuvwxyz'].find(x => !st.sec[x]); if (!n) return; // "e" is reserved by the engine for the chorus variation
    st.sec[n] = JSON.parse(JSON.stringify(sec)); st.form += n; sel.sec = n; touch(); build(); }));
};
