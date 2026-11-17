// Music editor — tab "Track sound": what makes the sound of the chosen track, and what to try it with.
// Melodic track: instrument, octave, stereo, sound, reverb, echo; keyboard. Drums: drum machine (shared by the four drum tracks), recorded sounds per hit, pitch; one pad per sound.
function attempt(p, pn) { // plays track p (with timbre pn if given): one note, or the chord in progress for the pad and the chords
  if (!switchOn()) return; const ch = st.prog[st.sec[sel.sec].P || 0].CH[0], o = octaveOf(p);
  if (p === 'b') SOUND.note('b', (SOUND.backdrop || st.prog[0].ROOT[0]) + o, pn);
  else if (p === 'l') SOUND.note('l', st.key + 12 + o, pn);
  else if (p === 'a') SOUND.note('a', ch[0] + 12 + o, pn);
  else for (const n of ch) SOUND.note(p, n + (p === 'd' ? 0 : 12) + o, pn);
}
// computer keyboard (physical key position: middle row = white keys, top row = black keys) and on-screen keyboard
const KEYS = { KeyA: 0, KeyW: 1, KeyS: 2, KeyE: 3, KeyD: 4, KeyF: 5, KeyT: 6, KeyG: 7, KeyY: 8, KeyH: 9, KeyU: 10, KeyJ: 11, KeyK: 12, KeyO: 13, KeyL: 14, KeyP: 15, Semicolon: 16 };
const baseKeyboard = p => (p === 'b' ? 36 : 60) + octaveOf(p);
function touching(i) { // i: half-tones from the keyboard's C; on a drum track, the keys play its sounds in order
  const p = sel.p; if (!switchOn()) return;
  if (DRUMSET(p)) { const s = Object.keys(MARKS[p]); SOUND.strike(p, s[i % s.length]); } else SOUND.note(p, baseKeyboard(p) + i);
  const k = document.querySelector(`.kbd [data-i="${i}"]`); if (k) { k.classList.add('on'); setTimeout(() => k.classList.remove('on'), 140); }
}

VIEWS.sound = H => { // same layout for all tracks: on the left what makes the sound, on the right what to try it with
  const p = sel.p, cols = el('div', 'cols'), G = el('div'), D = el('div'); H.append(cols); cols.append(G, D);
  G.append(el('h2', '', 'Track sound'));
  if (DRUMSET(p)) {
    choice(G, 'Drum machine', SOUND.kits.map(k => [k, KITN[k] || k]), s => s.kit, v => { st.kit = v; setTimeout(() => { if (switchOn()) SOUND.strike(p, Object.keys(MARKS[p]).find(c => isNaN(c)) || '1'); }, 60); });
    G.append(el('p', 'help', 'Drums: the instrument is a drum machine, the same for the four drum tracks (kick, snare, hi-hats, percussion).'));
    if (SOUNDS_BAT[p]) { // snare and hi-hat: each hit can take a recorded sound, for this station only (st.drumset)
      G.append(el('h2', '', 'Recorded sounds <small>· hit by hit, this station only</small>'));
      const avail = Object.keys({ ...window.SMP, ...window.PERC }).filter(n => SOUNDLIB[n]).sort((a, b) => SOUNDLIB[a].localeCompare(SOUNDLIB[b], 'fr'));
      for (const [c, k, dflt] of SOUNDS_BAT[p]) choice(G, MARKS[p][c].slice(2), [['', dflt], ...avail.map(n => [n, SOUNDLIB[n]])], s => (s.drumset && s.drumset[k]) || '', v => {
        const b = { ...(st.drumset || {}) }; if (v) b[k] = v; else delete b[k]; if (Object.keys(b).length) st.drumset = b; else delete st.drumset;
        setTimeout(() => { if (switchOn()) SOUND.strike(p, c); }, 60); });
      const kr = p === 's' ? 'sR' : 'hR';
      slider(G, 'Hauteur', s => (s.drumset && s.drumset[kr]) || 1, v => { const b = { ...(st.drumset || {}) }; if (Math.abs(v - 1) < 0.005) delete b[kr]; else b[kr] = v; if (Object.keys(b).length) st.drumset = b; else delete st.drumset; }, 0.7, 1.4, 0.01, v => Math.abs(v - 1) < 0.005 ? 'naturalKey' : (v > 1 ? '+' : '') + Math.round(12 * Math.log2(v) * 10) / 10 + ' demi-ton')
        .children[1].addEventListener('change', () => { if (switchOn()) SOUND.strike(p, 'x'); });
    }
    D.append(el('h2', '', 'Essayer'));
    const pads = el('div', 'soundBank'); D.append(pads);
    for (const [c, n] of Object.entries(MARKS[p])) pads.append(buttonEl(n.slice(2), 'Listen: ' + n.slice(2), () => { if (switchOn()) SOUND.strike(p, c); }, 'pad'));
  } else {
    const r = el('div', 'row', '<span>Instrument</span>'), b = buttonEl(caption(timbreOf(p)) + ' …', 'Change the track\'s instrument', () => openPanel('soundBank')); r.append(b); if (timbreOf(p) !== timbreOf(p, orig)) r.classList.add('mod'); G.append(r);
    const fx = (s, k) => s.fx && s.fx[p] && s.fx[p][k] != null ? s.fx[p][k] : (SOUND.patch[timbreOf(p, s)] || {})[k] || 0, putFx = (k, v) => { ((st.fx = st.fx || {})[p] = st.fx[p] || {})[k] = v; };
    slider(G, 'Octave', s => octaveOf(p, s) / 12, v => putOctave(p, v * 12), -2, 2, 1, v => v ? (v > 0 ? '+' : '') + v : 'normale').children[1].addEventListener('change', () => attempt(p));
    slider(G, 'Stéréo', s => s.pan && s.pan[p] != null ? s.pan[p] : (SOUND.patch[timbreOf(p, s)] || {}).pan || 0, v => { (st.pan = st.pan || {})[p] = v; }, -1, 1, 0.05, v => Math.abs(v) < 0.03 ? 'centroid' : (v < 0 ? 'gauche ' : 'droite ') + Math.round(Math.abs(v) * 100) + ' %');
    slider(G, 'Son', s => (s.toneFlt && s.toneFlt[p]) || 0, v => { (st.toneFlt = st.toneFlt || {})[p] = v; }, -1, 1, 0.05, v => Math.abs(v) < 0.03 ? 'naturel' : v < 0 ? 'plus sombre' : 'plus clair');
    slider(G, 'Réverbération', s => fx(s, 'rv'), v => putFx('rv', v), 0, 0.8, 0.05);
    slider(G, 'Écho', s => fx(s, 'ec'), v => putFx('ec', v), 0, 0.8, 0.05);
    D.append(el('h2', '', 'Essayer'));
    const kbdEl = el('div', 'kbd'); kbdEl.title = 'Click, or keys Q S D F G H J K (white) and Z E T Y U (black) on an AZERTY keyboard'; D.append(kbdEl);
    for (let i = 0; i <= 24; i++) { const blackKey = [1, 3, 6, 8, 10].includes(i % 12), k = el('button', blackKey ? 'n' : 'b'); k.type = 'button'; k.dataset.i = i; k.tabIndex = -1; k.setAttribute('aria-label', 'Touche ' + NOTES[i % 12]); k.onpointerdown = () => touching(i); kbdEl.append(k); }
  }
  G.append(el('p', 'help', 'Volume, mute and solo: in the track list, at the top.'));
  D.append(buttonEl('Supprimer cette piste', `Delete track ${LABEL[p]} from the station`, () => { if (!confirm(`Delete track ${LABEL[p]} de ${st.name} ? (Ctrl+Z to get it back)`)) return; delete st[p]; for (const k in st.sec) delete st.sec[k][p]; touch(); build(); }, 'danger'));
};

// "Instrument" dialog: all instruments, by family; a click assigns it to the chosen track and plays it (the dialog stays open to try others)
VIEWS.soundBank = D => {
  const p = sel.p; if (DRUMSET(p)) return $('dlg').close();
  const cur = timbreOf(p), pref = p === 'b' ? 'b' : p === 'l' ? 'l' : 'c', allRes = SOUND.timbres.filter(t => !/^ak_/.test(t));
  for (const f of [pref, 'e', ...'bcl'.replace(pref, '')]) { // the family made for the track first, then the real instruments, then the rest: any instrument can play any track
    D.append(el('h3', '', FAMLABEL[f]));
    const bankDiv = el('div', 'soundBank'); D.append(bankDiv);
    for (const t of allRes.filter(t => family(t) === f).sort((a, b) => caption(a).localeCompare(caption(b), 'fr'))) {
      const b = buttonEl(caption(t), `${caption(t)} (${t})`, () => { putTimbre(p, t); const pr = touch(); build(); pr.then(() => attempt(p)); }); // a recorded instrument is played once decoded
      b.setAttribute('aria-pressed', t === cur); if (t === timbreOf(p, orig)) b.classList.add('orig'); bankDiv.append(b); }
  }
};
