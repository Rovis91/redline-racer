// Music editor — core: constants, station state, undo, saving, selection, small components.
// The files of editor/ are classic scripts that share their global names; load order: core, arrangement, patterns, roll, instrument, settings, main.
const $ = id => document.getElementById(id), R = MUS.R, EC = SOUND.audition, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const el = (tag, cls = '', html = '') => { const e = document.createElement(tag); e.className = cls; e.innerHTML = html; return e; };
const buttonEl = (txt, title, fn, cls = '') => { const b = el('button', cls, txt); b.type = 'button'; if (title) { b.title = title; b.setAttribute('aria-label', title); } b.onclick = fn; return b; };

const AUDIO_TRACKS = [...'kshpbdcgal'];
const LABEL = { k: 'Grosse caisse', s: 'Caisse claire', h: 'Charlestons', p: 'Percussions', b: 'Basse', d: 'Nappe', c: 'Accords', g: 'Accords 2', a: 'Arpège', l: 'Thème' };
const TINT = { k: '#ff6b6b', s: '#ff9f43', h: '#fcee0a', p: '#c8e06a', b: '#40ff80', d: '#3fd6c6', c: '#00c8ff', g: '#7fa8ff', a: '#b995ff', l: '#ff7ad9' };
const DRUMSET = p => 'kshp'.includes(p), STEP = p => 'kshpcga'.includes(p), ROLL = p => p === 'b' || p === 'l'; // drums · step-grid pattern · note pattern
const MARKS = { // what can be written in a step of each pattern; the first is the default brush
  k: { x: 'x coup', g: 'g light' }, s: { x: 'x caisse claire', g: 'g ghost', c: 'c clap', r: 'r cercle' },
  h: { x: 'x closed', X: 'X accent', o: 'o ouvert', r: 'r ride', b: 'b cloche de ride' },
  p: { c: 'c cloche', v: 'v clave', h: 'h high conga', l: 'l conga grave', m: 'm shaker', t: 't tambourin', 1: '1 tom aigu', 2: '2 mid tom', 3: '3 tom grave', k: 'k metal' },
  c: { x: 'x accord', X: 'X accent' }, g: { x: 'x accord', X: 'X accent' },
  a: { 0: '0 note 1 de l\'accord', 1: '1 note 2', 2: '2 note 3', 3: '3 note 4', 4: '4 note 1 at the octave', 5: '5 note 2 at the octave', 6: '6 note 3 at the octave', 7: '7 note 4 at the octave' } };
const NOTES = ['Do', 'Do#', 'Ré', 'Mib', 'Mi', 'Fa', 'Fa#', 'Sol', 'Lab', 'La', 'Sib', 'Si'], LETTERS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }, QLABEL = { '': 'majeur', m: 'mineur', 7: '7', m7: 'm7', M7: 'maj7', m9: 'm9', 9: '9', 5: 'quinte seule' };

// ---------- instrument catalogue: readable name of each timbre of audio.js (a timbre missing here is shown under its code name) ----------
const FAMLABEL = { e: 'Real instruments (recorded)', b: 'Basses', c: 'Claviers, nappes, guitares', l: 'Solo (themes)' };
const CAPTIONS = {
  bDark: 'Saturated darksynth bass', bDist: 'Clipped bass', bAcid: 'Basse acide (TB-303)', bFM: '80s FM bass', bSlap: 'Slapped bass (slap)', bPick: 'Electric bass with pick', bMoog: 'Basse ronde (Moog)', bReese: 'Reese bass, beating',
  bOff: 'Plucked bass', bSeq: 'Sequenced bass', bFuzz: 'Distorted guitar riff', bBoost: 'Huge sub', bString: 'Electric bass, plucked string', bGrit: 'Basse big beat, sale', bNeuro: 'Basse neurofunk',
  epFM: 'Electric piano', dxEp: 'Bright electric piano', organ: 'Orgue', kbd: 'Clavinet', brass: 'Synth brass', strings: 'Ensemble de cordes', super: 'Mur de scies', chorus: 'Chœur « oh »', choir: 'Chœur sombre', glass: 'Nappe de verre', warm: 'Nappe chaude',
  stabM7: 'Accord de Detroit', gtrMute: 'Muted funk guitar', pwr: 'Distorted guitar (chords)', gtrNylon: 'Strummed nylon guitar', arpRound: 'Round arpeggio', gtrClean: 'Strummed clean guitar', pluck: 'Synth pluck', pulseArp: 'Impulsions', seqArp: 'Séquence',
  seqInd: 'Stab industriel', pno: 'Piano house', bell: 'Cloche', fmMetal: 'Métal', santour: 'Santour persan',
  ldTar: 'Tar persan', ldSaw: 'Sawtooth synth', ldSync: 'Howling synth', ldEwi: 'Wind instrument', ldSax: 'Synth saxophone', ldWhistle: 'Sifflement', ldTalk: 'Talkbox', ldMoog: 'Mono synth (Moog)', ldBrass: '80s brass', ldTwang: 'Guitare western',
  ldVoiceF: 'Voix de femme', ldVoiceH: 'Voix d\'homme', ldCold: 'Cold wave, tied', ldNylon: 'Plucked nylon guitar', ldCrunch: 'Guitare crunch', ldElectro: '80s electro', ldEuro: 'Eurodance', ldGtr: 'Distorted guitar', ldSiren: 'Sirène', ldVox: 'Chopped voice',
  ldTri: 'Synth flute', ldStr: 'Cordes solistes', ldEwiSoft: 'Soft wind instrument', rhodesSoft: 'Rhodes adouci', gtCocotte: 'Muted guitar', voiceOohs: 'Tied "ooh" voice', ldGuitar: 'Solo distorted guitar', brassShort: 'Cuivres courts', pianoAc: 'Piano acoustique', bassFingerS: 'Finger bass', chorusPad: 'Nappe de chœur', stringsSustained: 'Cordes tenues', brassStab: 'Stabbed brass', fluteLd: 'Solo flute', panFluteLd: 'Solo panpipe',
  saxAltoLd: 'Saxophone alto soliste', saxTenorLd: 'Solo tenor sax', slapS: 'Played slap bass', steelLd: 'Steel drum soliste', trompetteLd: 'Trompette soliste', gtSat: 'Guitare crunch soliste', gtCleanLd: 'Guitare claire soliste', vibraArp: 'Vibraphone arpeggio', chorusLd: 'Chœur soliste', voiceChopped: 'Chopped voice (recorded)', pizzSeq: 'Sequenced plucked strings',
  e_piano: 'Piano', e_rhodes: 'Rhodes electric piano', e_chorus: 'Chœur « ah »', e_oohs: 'Voix « ooh »', e_gtMute: 'Muted guitar', e_gtClean: 'Guitare claire', e_gtDist: 'Distorted guitar', e_gtOver: 'Guitare crunch', e_strings: 'Cordes', e_brass: 'Cuivres',
  e_synBrass: 'Synth brass', e_slap: 'Basse slap', e_bassFinger: 'Electric bass', e_altoSax: 'Saxophone alto', e_flute: 'Flûte', e_sitar: 'Sitar', e_kalimba: 'Kalimba', e_steel: 'Steel drum', e_marimba: 'Marimba', e_vibra: 'Vibraphone', e_pizz: 'Plucked strings',
  e_trumpet: 'Trompette', e_tenorSax: 'Tenor sax', e_panFlute: 'Panpipe' };
// recorded drum sounds (samples.js: TR-808; instruments.js: VCSL) that a snare or hi-hat hit can take; SOUNDS_BAT: [sign, st.drumset key, default choice text]
const SOUNDLIB = { sd: 'Caisse claire TR-808', cp: 'Clap TR-808', sn1: 'Caisse claire acoustique 1', sn1g: 'Caisse claire acoustique 1, douce', sn2: 'Caisse claire acoustique 2', sn2g: 'Caisse claire acoustique 2, douce',
  sn3: 'Caisse claire acoustique 3', rim: 'Rim hit (rimshot)', xs: 'Cross-stick', clap: 'Clap 1', clap2: 'Clap 2', ch: 'TR-808 closed hi-hat', oh: 'Charleston ouvert TR-808',
  hhc: 'Closed acoustic hi-hat', hhcp: 'Closed acoustic hi-hat, soft', hho: 'Charleston acoustique ouvert', hhl: 'Charleston entrouvert', shk: 'Shaker', shk2: 'Light shaker', tmb: 'Tambourin', cb: 'Cloche TR-808' };
const SOUNDS_BAT = { s: [['x', 'sS', 'The drum machine one'], ['g', 'sG', 'Like the snare, softer'], ['c', 'cS', 'The drum machine one'], ['r', 'rS', 'The drum machine one']],
  h: [['x', 'hS', 'The drum machine one'], ['X', 'hA', 'Like the closed one, louder'], ['o', 'hOo', 'The drum machine one']] };
const KITN = { k808: 'TR-808 (recorded)', k909: 'TR-909', dur: '80s, dry', lin: 'LinnDrum', ind: 'Industrielle', acous: 'Acoustique', rock: 'Rock', brk: 'Breakbeat', dnb: 'Drum and bass', disco: 'Disco' };
const caption = t => CAPTIONS[t] || t, family = t => (SOUND.patch[t] || {}).smp ? 'e' : /^b[A-Z]/.test(t) ? 'b' : /^ld/.test(t) ? 'l' : 'c';

// ---------- state: current station, saved settings, undo ----------
let st, orig, saved = {}; // orig: the station as written in the game
try { saved = JSON.parse(localStorage.getItem('vpr.musique')) || {}; } catch (e) { }
if (saved.tb) saved = {}; // settings of the first editor (old engine with 3 stations): not applicable here
const snap = () => JSON.stringify(MUS.keyNames.map(k => st[k])); // the station, in the format of MUS.originName
const item = json => Object.fromEntries(JSON.parse(json).map((v, i) => [MUS.keyNames[i], v]).filter(x => x[1] != null));
function putState(json) { const o = item(json); for (const k of MUS.keyNames) { if (k in o) st[k] = o[k]; else delete st[k]; } MUS.tune(st); }
let hist = [], future = [], lastIdx = '', tHist = 0, tSave = 0;
const writeLS = () => { clearTimeout(tSave); tSave = 0; try { localStorage.setItem('vpr.musique', JSON.stringify(saved)); } catch (e) { if (!writeLS.says) alert('Cannot save in this browser: use File → Copy my settings.'); writeLS.says = true; } };
addEventListener('pagehide', () => { if (tSave) writeLS(); });
function saveSong() { // the whole station, unless it is back to the original; writing waits for the end of the gesture
  if (lastIdx === MUS.originName[st.name]) delete saved[st.name]; else saved[st.name] = item(lastIdx);
  clearTimeout(tSave); tSave = setTimeout(writeLS, 250); showMarks();
}
function touch() { // after each change; changes less than half a second apart (a drag) make a single undo step; returns the engine's promise (recorded instruments decoded)
  const now = Date.now(); if (now - tHist > 500) { hist.push(lastIdx); if (hist.length > 100) hist.shift(); future = []; }
  tHist = now; lastIdx = snap(); saveSong(); return SOUND.resync();
}
function popTo(de, toStack) { if (!de.length) return; toStack.push(lastIdx); lastIdx = de.pop(); tHist = 0; putState(lastIdx); saveSong(); SOUND.resync(); build(); }
function showMarks() {
  $('undo').disabled = !hist.length; $('redo').disabled = !future.length;
  for (const o of $('station').options) o.textContent = (saved[o.dataset.label] ? '● ' : '') + o.dataset.txt;
}

// ---------- playing the station ----------
const variants = p => DRUMSET(p) ? st[p] : st[p].v; // the patterns of a track (none for the pad)
const nVar = p => p === 'd' ? 1 : variants(p).length;
const sectionsOf = (p, vi) => Object.keys(st.sec).filter(k => st.sec[k][p] && st.sec[k][p].v % nVar(p) === vi); // sections that play pattern vi of track p
const inGame = p => { const x = st.sec[EC.sec] && st.sec[EC.sec][p]; return x ? x.v % nVar(p) : -1; }; // pattern of track p that is playing now
const timbreOf = (p, s = st) => !s[p] ? '' : p === 'd' ? s.d[0] : s[p].p, putTimbre = (p, t) => { if (p === 'd') st.d[0] = t; else st[p].p = t; };
const OCT = { b: 'bO', c: 'cO', g: 'gO', a: 'aO', l: 'lO' }; // transposition field of each track (the pad: st.d[1])
const octaveOf = (p, s = st) => !s[p] ? 0 : p === 'd' ? s.d[1] || 0 : s[OCT[p]] || 0, putOctave = (p, v) => { if (p === 'd') st.d[1] = v; else st[OCT[p]] = v; };
const levelAmt = (p, s = st) => s.mx && s.mx[p] != null ? s.mx[p] : 1;
const dB = v => v <= 0 ? 'coupé' : (v >= 1 ? '+' : '') + (20 * Math.log10(v)).toFixed(1) + ' dB';

// ---------- selection: the track, section and tab shown ----------
const sel = { p: 'l', sec: 'c', tab: 'motif' }, rollX = {}; // rollX: scrolling of the roll, per track
function choose(p, k, tab) { // chooses a track (and a section: a clicked block opens its pattern); without a requested tab, keeps the one shown
  sel.p = p; if (k) chooseSection(k, true);
  sel.tab = tab || (k ? 'motif' : sel.tab); build();
}
function chooseSection(k, withoutBuild) { sel.sec = k; if (EC.loopSec) EC.loopSec = k; if (!withoutBuild) build(); } // the loop follows the chosen section

// ---------- composants ----------
// one row "label · slider · value"; get(s) reads in station s (current or original), set(v) writes into the current station; fmt: display of the value
function slider(parent, label, get, set, min, max, step, fmt) {
  const row = el('label', 'row', `<span>${label}</span><input type="range" min="${min}" max="${max}" step="${step}"><output></output>`), inp = row.children[1];
  const upd = () => { const v = get(st); inp.value = v; row.children[2].textContent = fmt ? fmt(v) : +(+v).toFixed(2); row.classList.toggle('mod', Math.abs(v - get(orig)) > 1e-9); };
  inp.oninput = () => { set(+inp.value); upd(); touch(); };
  inp.ondblclick = () => { set(get(orig)); upd(); touch(); }; inp.title = 'Double-clic : valeur d\'origine';
  upd(); parent.append(row); return row;
}
function choice(parent, label, options, get, set) { // one row "label · list"; options: [[value, text], …]
  const row = el('label', 'row', `<span>${label}</span><select></select>`), s = row.children[1];
  for (const [v, t] of options) s.add(new Option(t, v));
  s.value = get(st); row.classList.toggle('mod', String(get(st)) !== String(get(orig)));
  s.onchange = () => { set(s.value); touch(); build(); };
  parent.append(row);
}
function buttonsMS(p) { // mute and solo of a track (listening only: nothing is saved)
  const f = document.createDocumentFragment();
  for (const [txt, title] of [['M', 'Muet'], ['S', 'Solo']]) { const b = buttonEl(txt, title + ' : ' + LABEL[p], () => { if (txt === 'M') EC.mute[p] = !EC.mute[p]; else EC.solo = EC.solo === p ? null : p; mutes(); }, 'ms'); Object.assign(b.dataset, { ms: txt, p }); f.append(b); }
  return f;
}
const mutes = () => { for (const b of document.querySelectorAll('[data-ms]')) b.setAttribute('aria-pressed', b.dataset.ms === 'M' ? !!EC.mute[b.dataset.p] : EC.solo === b.dataset.p); };
// list "which pattern this track plays in this section": none, an existing pattern, or a new one (copy of the current one)
function selVariant(p, k) {
  const sec = st.sec[k], V = variants(p), s = el('select'), cur = sec[p] ? sec[p].v % V.length : -1; s.add(new Option('— does not play', ''));
  V.forEach((_, i) => { const a = sectionsOf(p, i).filter(x => x !== k); s.add(new Option(`motif ${i + 1}${a.length ? ' (also in ' + a.join(' ') + ')' : ''}`, i)); }); s.add(new Option('＋ nouveau motif (copie)', 'n'));
  s.value = cur < 0 ? '' : cur; s.setAttribute('aria-label', `${LABEL[p]} : pattern played in section ${k}`);
  s.onchange = () => { const big = !!(sec[p] && sec[p].big);
    if (s.value === '') delete sec[p];
    else if (s.value === 'n') { for (const j in st.sec) if (st.sec[j][p]) st.sec[j][p].v %= V.length; V.push(JSON.parse(JSON.stringify(V[cur < 0 ? V.length - 1 : cur]))); sec[p] = { v: V.length - 1, big }; } // section numbers are first brought back into range, so that none changes pattern
    else sec[p] = { v: +s.value, big };
    touch(); build(); };
  return s;
}
function measures(p, bars) { // "− measure / ＋ measure" buttons of a pattern (the added measure copies the last one)
  const f = document.createDocumentFragment();
  const m = buttonEl('−', `${LABEL[p]} : remove the last measure from the pattern`, () => { bars.pop(); touch(); build(); }, 'ms'); m.disabled = bars.length < 2;
  const a = buttonEl('＋', `${LABEL[p]} : add a measure to the pattern`, () => { bars.push(JSON.parse(JSON.stringify(bars[bars.length - 1]))); touch(); build(); }, 'ms'); a.disabled = bars.length >= 8;
  f.append(m, el('small', '', ` ${bars.length} mes. `), a); return f;
}

// ---------- rebuilding the screen (after a structure change, an undo, a station change) ----------
const VIEWS = {}; // tab → function that fills the bottom panel; each file registers its own there
const TABS = [['motif', 'Motif'], ['sound', 'Track sound']]; // the bottom panel always shows the chosen track, in the chosen section
// dialogs: what is not needed permanently; id → heading. The content comes from VIEWS, and it is redone at each build() while the dialog is open
const DLG = { chordSeq: () => 'Accords', station: () => 'Station settings', section: () => `Section ${sel.sec}${sel.sec === st.hot ? ' ★ refrain' : ''}`, soundBank: () => `Instrument : ${LABEL[sel.p]}` };
let dlgView = null;
function fillDlg() { if (!dlgView) return; const C = $('dlgC'), h = C.scrollTop; $('dlgT').textContent = DLG[dlgView](); C.textContent = ''; VIEWS[dlgView](C); C.scrollTop = h; }
function openPanel(id) { dlgView = id; fillDlg(); if (!$('dlg').open) $('dlg').showModal(); }
$('dlg').addEventListener('close', () => { dlgView = null; }); $('dlgX').onclick = () => $('dlg').close();
const rolls = []; let shown = -1; // drawing functions of the displayed rolls; last displayed step
function build() {
  const foc = document.activeElement && document.activeElement.getAttribute && document.activeElement.getAttribute('aria-label'), D = $('dock'), high = D.scrollTop; // focus and scrolling survive the rebuild
  for (const s of document.querySelectorAll('.roll .scroll')) rollX[s.dataset.p] = s.scrollLeft;
  st = SOUND.stations[SOUND.station]; orig = item(MUS.originName[st.name]); shown = -1; rolls.length = 0;
  if (!st.sec[sel.sec]) sel.sec = st.sec[st.hot] ? st.hot : Object.keys(st.sec)[0];
  if (!st[sel.p]) sel.p = AUDIO_TRACKS.find(p => st[p]);
  if (EC.loopSec && !st.sec[EC.loopSec]) EC.loopSec = null;
  arrangement();
  const N = $('onglets'); N.textContent = ''; const t = el('b', 'heading', `${LABEL[sel.p]} <small>· section ${sel.sec}${sel.sec === st.hot ? ' ★' : ''}</small>`); t.style.color = TINT[sel.p]; N.append(t);
  for (const [id, txt] of TABS) { const b = buttonEl(txt, '', () => { sel.tab = id; build(); }); b.setAttribute('aria-pressed', sel.tab === id); N.append(b); }
  N.append(el('span', 'spacer'), buttonEl(`Section ${sel.sec}${sel.sec === st.hot ? ' ★' : ''} : options`, 'Chord sequence, rise, filter of the chosen section; duplicate it', () => openPanel('section'), 'opt'));
  D.textContent = ''; VIEWS[sel.tab](D); D.scrollTop = high; fillDlg();
  $('bpm').value = st.bpm; $('loopSec').setAttribute('aria-pressed', !!EC.loopSec); $('loopSec').textContent = EC.loopSec ? `⟲ Boucle : section ${EC.loopSec}` : '⟲ Boucle'; mutes(); showMarks();
  try { sessionStorage.setItem('ed.sel', JSON.stringify(sel)); } catch (e) { }
  if (foc) for (const e of document.querySelectorAll('[aria-label]')) if (e.getAttribute('aria-label') === foc) { e.focus({ preventScroll: true }); break; }
}
