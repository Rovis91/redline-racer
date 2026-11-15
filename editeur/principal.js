// Éditeur de musique — barre du haut (lecture, station, tempo, annulation, fichier), raccourcis clavier, et l'horloge d'affichage (vumètre, témoins, tête de lecture).
let playing = false;
function allumer() { // ouvre le son au premier geste ; la musique seule : ni moteur, ni pneus, ni ambiance. Renvoie vrai si on peut jouer une note
  if (!SON.ac) { SON.init(); for (const k of ['mot', 'pneu', 'vent', 'amb', 'pluie', 'choc']) SON.volume(k, 0); EC.pause = !playing; SON.frame(1 / 60, etatCourse()); }
  if (SON.ac && SON.ac.state === 'suspended') SON.ac.resume();
  return !!SON.ac;
}
const jouerPause = () => { // à l'arrêt, le séquenceur attend mais le son reste ouvert : on peut essayer une note ou un instrument
  playing = !playing; allumer(); EC.pause = !playing;
  $('play').textContent = playing ? 'Pause' : 'Lecture'; $('play').classList.toggle('joue', playing); if (!playing) $('now').textContent = 'à l\'arrêt';
};
$('play').onclick = jouerPause;
$('boucle').onclick = () => { EC.boucle = EC.boucle ? null : sel.sec; build(); };
$('bpm').onchange = () => { st.bpm = clamp(Math.round(+$('bpm').value) || st.bpm, 60, 200); touch(); build(); };
$('bAccords').onclick = () => ouvrir('accords'); $('bStation').onclick = () => ouvrir('station');
$('undo').onclick = () => remonter(hist, futur); $('redo').onclick = () => remonter(futur, hist);

// stations : celle que le jeu a mémorisée ne doit pas bouger
const selSt = $('station'), radios = Object.entries(localStorage).filter(x => x[0].startsWith('vpr.radio'));
CARTES.forEach((m, ci) => { const g = el('optgroup'); g.label = m.nom; m.radio.forEach((s, si) => { if (!MUS.origine[s.name]) return; const o = new Option('', ci + ':' + si); o.dataset.nom = s.name; o.dataset.txt = `${s.name} · ${s.genre.toLowerCase()}`; g.append(o); }); if (g.children.length) selSt.append(g); }); // une station déclarée hors de RADIO n'a pas de valeurs d'origine : l'éditeur ne la propose pas
function aller(v) {
  if (tSave) ecrireLS();
  const [ci, si] = v.split(':').map(Number); if (SON.stations !== CARTES[ci].radio) SON.carte(CARTES[ci]); if (SON.station !== si) SON.setStation(si);
  for (const k of Object.keys(localStorage)) if (k.startsWith('vpr.radio')) localStorage.removeItem(k); for (const [k, x] of radios) localStorage.setItem(k, x);
  selSt.value = v; try { sessionStorage.setItem('ed.station', v); } catch (e) { }
  st = SON.stations[SON.station]; hist = []; futur = []; dernier = snap(); tHist = 0; EC.boucle = null; build();
}
selSt.onchange = () => aller(selSt.value);

addEventListener('keydown', e => { // barre d'espace : lecture ; Ctrl+Z / Ctrl+Y : annuler / rétablir ; rangées de lettres : clavier de piano — sauf dans un champ de saisie
  const t = e.target, saisie = t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || (t.tagName === 'INPUT' && (t.type === 'text' || t.type === 'number'));
  if (e.ctrlKey || e.metaKey) { if (saisie && t.tagName !== 'SELECT') return;
    const k = e.key.toLowerCase(); if (k === 'z' && !e.shiftKey) { e.preventDefault(); remonter(hist, futur); } else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); remonter(futur, hist); } return; }
  if (saisie || e.altKey) return;
  if (e.key === ' ' && t.tagName !== 'BUTTON' && t.tagName !== 'CANVAS') { e.preventDefault(); jouerPause(); }
  else if (e.code in TOUCHES && !e.repeat) { e.preventDefault(); toucher(TOUCHES[e.code]); }
});

// avant / après : tant que le bouton est tenu, la station joue telle qu'elle est écrite dans le jeu
const ab = $('ab'); let enAB = false;
const abOn = () => { if (enAB) return; enAB = true; poser(MUS.origine[st.name]); SON.recale(); ab.setAttribute('aria-pressed', true); };
const abOff = () => { if (!enAB) return; enAB = false; poser(dernier); SON.recale(); ab.setAttribute('aria-pressed', false); build(); };
ab.onpointerdown = abOn; ab.onpointerup = ab.onpointerleave = ab.onblur = abOff;
ab.onkeydown = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); abOn(); } }; ab.onkeyup = abOff;

// fichier : copier, importer, réinitialiser
$('export').onclick = () => { if (tSave) ecrireLS(); $('out').value = JSON.stringify(saved); $('out').select(); navigator.clipboard?.writeText($('out').value).catch(() => { }); };
$('import').onclick = () => { let o; try { o = JSON.parse($('out').value); } catch (e) { } if (!o || typeof o !== 'object' || Array.isArray(o)) return alert('Ce texte n\'est pas un export de l\'éditeur.');
  if (!confirm('Remplacer tous tes réglages par ceux de ce texte ?')) return; saved = o; ecrireLS(); location.reload(); };
const effacer = tout => { if (!confirm(tout ? 'Effacer tes réglages de toutes les stations et revenir à la musique d\'origine ?' : `Effacer tes réglages de ${st.name} et revenir à sa musique d'origine ?`)) return;
  if (tout) saved = {}; else delete saved[st.name]; ecrireLS(); location.reload(); };
$('resetSt').onclick = () => effacer(false); $('resetAll').onclick = () => effacer(true);

// départ
try { Object.assign(sel, JSON.parse(sessionStorage.getItem('ed.sel')) || {}); } catch (e) { }
if (!ONGLETS.some(o => o[0] === sel.tab)) sel.tab = 'motif';
let depart = CARTES.indexOf(CARTE) + ':' + SON.station; try { depart = sessionStorage.getItem('ed.station') || depart; } catch (e) { }
if (![...selSt.options].some(o => o.value === depart)) depart = selSt.options[0].value;
aller(depart);

// la situation de course (fixe, reglages.js) part au vrai moteur à chaque image, comme dans le jeu
setInterval(() => { if (SON.ac && SON.ac.state === 'running') SON.frame(1 / 60, etatCourse()); }, 16);
const vuBuf = new Float32Array(2048); let crete = 0;
setInterval(() => { // vumètre, témoins, bloc en cours, pas en cours
  if (!SON.ac || SON.ac.state !== 'running') return;
  SON.vu.getFloatTimeDomainData(vuBuf); let m = 0; for (const v of vuBuf) m = Math.max(m, Math.abs(v)); crete = Math.max(m, crete * 0.85); const d = 20 * Math.log10(crete || 1e-6);
  const bar = $('vu').firstChild; bar.style.width = clamp((d + 48) / 48, 0, 1) * 100 + '%'; bar.classList.toggle('fort', d > -3); $('db').textContent = d < -60 ? '—' : d.toFixed(1) + ' dB';
  for (const l of document.querySelectorAll('.led[data-k]')) l.classList.toggle('on', EC.joue[l.dataset.k] > SON.ac.currentTime);
  if (!playing) return;
  const pas = SON.pas - 1; if (pas === shown) return; shown = pas;
  const mes = pas >> 4, fi = (mes >> 2) % st.form.length, suit = st.form[fi] === EC.sec; // suit : la forme se déroule ; sinon une section tourne en boucle (ou le refrain du secteur chaud)
  $('now').textContent = `${EC.boucle ? '⟲' : '▶'} section ${EC.sec}${EC.sec === st.hot ? ' ★' : ''} · mesure ${(mes & 3) + 1}/4`;
  for (const b of document.querySelectorAll('#arr [data-i]')) b.classList.toggle('joue', suit ? +b.dataset.i === fi : b.dataset.k === EC.sec);
  for (const g of document.querySelectorAll('.mes')) { const x = g.dataset, joue = enJeu(x.p) === +x.v && mes % +x.n === +x.b; g.classList.toggle('joue', joue); // seule la mesure qui joue montre le pas en cours
    for (const c of g.children) c.classList.toggle('on', joue && +c.dataset.q === (pas & 15)); }
  for (const f of rolls) f();
}, 50);
