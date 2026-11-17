// Music editor — top bar (play, station, tempo, undo, file), keyboard shortcuts, and the display clock (VU meter, indicators, playhead).
let playing = false;
function switchOn() { // opens the sound on the first gesture; the music only: no engine, no tyres, no ambience. Returns true if a note can be played
  if (!SOUND.ac) { SOUND.init(); for (const k of ['motorFam', 'tire', 'wind', 'amb', 'rainFx', 'impact']) SOUND.volume(k, 0); EC.pause = !playing; SOUND.frame(1 / 60, raceState()); }
  if (SOUND.ac && SOUND.ac.state === 'suspended') SOUND.ac.resume();
  return !!SOUND.ac;
}
const playPause = () => { // when stopped, the sequencer waits but the sound stays open: we can try a note or an instrument
  playing = !playing; switchOn(); EC.pause = !playing;
  $('play').textContent = playing ? 'Pause' : 'Lecture'; $('play').classList.toggle('nowPlaying', playing); if (!playing) $('now').textContent = 'stopped';
};
$('play').onclick = playPause;
$('loopSec').onclick = () => { EC.loopSec = EC.loopSec ? null : sel.sec; build(); };
$('bpm').onchange = () => { st.bpm = clamp(Math.round(+$('bpm').value) || st.bpm, 60, 200); touch(); build(); };
$('bAccords').onclick = () => openPanel('chordSeq'); $('bStation').onclick = () => openPanel('station');
$('undo').onclick = () => popTo(hist, future); $('redo').onclick = () => popTo(future, hist);

// stations: the one the game has saved must not move
const selSt = $('station'), radios = Object.entries(localStorage).filter(x => x[0].startsWith('vpr.radio'));
MAPS.forEach((m, ci) => { const g = el('optgroup'); g.label = m.label; m.radio.forEach((s, si) => { if (!MUS.originName[s.name]) return; const o = new Option('', ci + ':' + si); o.dataset.label = s.name; o.dataset.txt = `${s.name} · ${s.genre.toLowerCase()}`; g.append(o); }); if (g.children.length) selSt.append(g); }); // a station declared outside RADIO has no original values: the editor does not offer it
function goTo(v) {
  if (tSave) writeLS();
  const [ci, si] = v.split(':').map(Number); if (SOUND.stations !== MAPS[ci].radio) SOUND.mapDef(MAPS[ci]); if (SOUND.station !== si) SOUND.setStation(si);
  for (const k of Object.keys(localStorage)) if (k.startsWith('vpr.radio')) localStorage.removeItem(k); for (const [k, x] of radios) localStorage.setItem(k, x);
  selSt.value = v; try { sessionStorage.setItem('ed.station', v); } catch (e) { }
  st = SOUND.stations[SOUND.station]; hist = []; future = []; lastIdx = snap(); tHist = 0; EC.loopSec = null; build();
}
selSt.onchange = () => goTo(selSt.value);

addEventListener('keydown', e => { // space bar: play; Ctrl+Z / Ctrl+Y: undo / redo; letter rows: piano keyboard — except in an input field
  const t = e.target, typing = t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || (t.tagName === 'INPUT' && (t.type === 'text' || t.type === 'number'));
  if (e.ctrlKey || e.metaKey) { if (typing && t.tagName !== 'SELECT') return;
    const k = e.key.toLowerCase(); if (k === 'z' && !e.shiftKey) { e.preventDefault(); popTo(hist, future); } else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); popTo(future, hist); } return; }
  if (typing || e.altKey) return;
  if (e.key === ' ' && t.tagName !== 'BUTTON' && t.tagName !== 'CANVAS') { e.preventDefault(); playPause(); }
  else if (e.code in KEYS && !e.repeat) { e.preventDefault(); touching(KEYS[e.code]); }
});

// before / after: while the button is held, the station plays as written in the game
const ab = $('ab'); let inAB = false;
const abOn = () => { if (inAB) return; inAB = true; putState(MUS.originName[st.name]); SOUND.resync(); ab.setAttribute('aria-pressed', true); };
const abOff = () => { if (!inAB) return; inAB = false; putState(lastIdx); SOUND.resync(); ab.setAttribute('aria-pressed', false); build(); };
ab.onpointerdown = abOn; ab.onpointerup = ab.onpointerleave = ab.onblur = abOff;
ab.onkeydown = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); abOn(); } }; ab.onkeyup = abOff;

// file: copy, import, reset
$('export').onclick = () => { if (tSave) writeLS(); $('out').value = JSON.stringify(saved); $('out').select(); navigator.clipboard?.writeText($('out').value).catch(() => { }); };
$('import').onclick = () => { let o; try { o = JSON.parse($('out').value); } catch (e) { } if (!o || typeof o !== 'object' || Array.isArray(o)) return alert('This text is not an export from the editor.');
  if (!confirm('Replace all your settings with those in this text?')) return; saved = o; writeLS(); location.reload(); };
const erase = everything => { if (!confirm(everything ? 'Erase your settings for all stations and go back to the original music?' : `Erase your settings for ${st.name} and go back to its original music?`)) return;
  if (everything) saved = {}; else delete saved[st.name]; writeLS(); location.reload(); };
$('resetSt').onclick = () => erase(false); $('resetAll').onclick = () => erase(true);

// start
try { Object.assign(sel, JSON.parse(sessionStorage.getItem('ed.sel')) || {}); } catch (e) { }
if (!TABS.some(o => o[0] === sel.tab)) sel.tab = 'motif';
let startLine = MAPS.indexOf(MAP_DEF) + ':' + SOUND.station; try { startLine = sessionStorage.getItem('ed.station') || startLine; } catch (e) { }
if (![...selSt.options].some(o => o.value === startLine)) startLine = selSt.options[0].value;
goTo(startLine);

// the race situation (fixed, settings.js) goes to the real engine every frame, as in the game
setInterval(() => { if (SOUND.ac && SOUND.ac.state === 'running') SOUND.frame(1 / 60, raceState()); }, 16);
const vuBuf = new Float32Array(2048); let crest = 0;
setInterval(() => { // VU meter, indicators, current block, current step
  if (!SOUND.ac || SOUND.ac.state !== 'running') return;
  SOUND.vu.getFloatTimeDomainData(vuBuf); let m = 0; for (const v of vuBuf) m = Math.max(m, Math.abs(v)); crest = Math.max(m, crest * 0.85); const d = 20 * Math.log10(crest || 1e-6);
  const bar = $('vu').firstChild; bar.style.width = clamp((d + 48) / 48, 0, 1) * 100 + '%'; bar.classList.toggle('strong', d > -3); $('db').textContent = d < -60 ? '—' : d.toFixed(1) + ' dB';
  for (const l of document.querySelectorAll('.led[data-k]')) l.classList.toggle('on', EC.nowPlaying[l.dataset.k] > SOUND.ac.currentTime);
  if (!playing) return;
  const stepSec = SOUND.stepSec - 1; if (stepSec === shown) return; shown = stepSec;
  const meas = stepSec >> 4, fmi = (meas >> 2) % st.form.length, follows = st.form[fmi] === EC.sec; // follows: the form unrolls; otherwise a section loops (or the chorus of the hot sector)
  $('now').textContent = `${EC.loopSec ? '⟲' : '▶'} section ${EC.sec}${EC.sec === st.hot ? ' ★' : ''} · mesure ${(meas & 3) + 1}/4`;
  for (const b of document.querySelectorAll('#arr [data-i]')) b.classList.toggle('nowPlaying', follows ? +b.dataset.i === fmi : b.dataset.k === EC.sec);
  for (const g of document.querySelectorAll('.meas')) { const x = g.dataset, nowPlaying = inGame(x.p) === +x.v && meas % +x.n === +x.b; g.classList.toggle('nowPlaying', nowPlaying); // only the bar that plays shows the current step
    for (const c of g.children) c.classList.toggle('on', nowPlaying && +c.dataset.q === (stepSec & 15)); }
  for (const f of rolls) f();
}, 50);
