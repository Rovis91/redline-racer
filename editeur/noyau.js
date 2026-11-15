// Éditeur de musique — noyau : constantes, état de la station, annulation, enregistrement, sélection, petits composants.
// Les fichiers de editeur/ sont des scripts classiques qui partagent leurs noms globaux ; ordre de chargement : noyau, arrangement, motifs, rouleau, instrument, mixeur, principal.
const $ = id => document.getElementById(id), R = MUS.R, EC = SON.ecoute, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const el = (tag, cls = '', html = '') => { const e = document.createElement(tag); e.className = cls; e.innerHTML = html; return e; };
const bouton = (txt, title, fn, cls = '') => { const b = el('button', cls, txt); b.type = 'button'; if (title) { b.title = title; b.setAttribute('aria-label', title); } b.onclick = fn; return b; };

const PISTES = [...'kshpbdcgal'];
const NOM = { k: 'Grosse caisse', s: 'Caisse claire', h: 'Charlestons', p: 'Percussions', b: 'Basse', d: 'Nappe', c: 'Accords', g: 'Accords 2', a: 'Arpège', l: 'Thème' };
const COUL = { k: '#ff6b6b', s: '#ff9f43', h: '#fcee0a', p: '#c8e06a', b: '#40ff80', d: '#3fd6c6', c: '#00c8ff', g: '#7fa8ff', a: '#b995ff', l: '#ff7ad9' };
const BAT = p => 'kshp'.includes(p), PAS = p => 'kshpcga'.includes(p), ROUL = p => p === 'b' || p === 'l'; // batterie · motif en grille de pas · motif en notes
const SIGNES = { // ce qu'on peut écrire dans un pas de chaque motif ; le premier est le pinceau par défaut
  k: { x: 'x coup', g: 'g léger' }, s: { x: 'x caisse claire', g: 'g fantôme', c: 'c clap', r: 'r cercle' },
  h: { x: 'x fermé', X: 'X accentué', o: 'o ouvert', r: 'r ride', b: 'b cloche de ride' },
  p: { c: 'c cloche', v: 'v clave', h: 'h conga aiguë', l: 'l conga grave', m: 'm shaker', t: 't tambourin', 1: '1 tom aigu', 2: '2 tom médium', 3: '3 tom grave', k: 'k métal' },
  c: { x: 'x accord', X: 'X accentué' }, g: { x: 'x accord', X: 'X accentué' },
  a: { 0: '0 note 1 de l\'accord', 1: '1 note 2', 2: '2 note 3', 3: '3 note 4', 4: '4 note 1 à l\'octave', 5: '5 note 2 à l\'octave', 6: '6 note 3 à l\'octave', 7: '7 note 4 à l\'octave' } };
const NOTES = ['Do', 'Do#', 'Ré', 'Mib', 'Mi', 'Fa', 'Fa#', 'Sol', 'Lab', 'La', 'Sib', 'Si'], LETTRES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }, QNOM = { '': 'majeur', m: 'mineur', 7: '7', m7: 'm7', M7: 'maj7', m9: 'm9', 9: '9', 5: 'quinte seule' };

// ---------- catalogue des instruments : nom lisible de chaque timbre d'audio.js (un timbre absent d'ici s'affiche sous son nom de code) ----------
const FAMN = { e: 'Vrais instruments (enregistrés)', b: 'Basses', c: 'Claviers, nappes, guitares', l: 'Solistes (thèmes)' };
const LIB = {
  bDark: 'Basse darksynth saturée', bDist: 'Basse écrêtée', bAcid: 'Basse acide (TB-303)', bFM: 'Basse FM années 80', bSlap: 'Basse claquée (slap)', bPick: 'Basse électrique au médiator', bMoog: 'Basse ronde (Moog)', bReese: 'Basse Reese, qui bat',
  bOff: 'Basse pincée', bSeq: 'Basse séquencée', bFuzz: 'Riff de guitare saturée', bBoost: 'Sub énorme', bCorde: 'Basse électrique, corde pincée', bGrit: 'Basse big beat, sale', bNeuro: 'Basse neurofunk',
  epFM: 'Piano électrique', dxEp: 'Piano électrique brillant', organ: 'Orgue', clav: 'Clavinet', brass: 'Cuivres de synthé', strings: 'Ensemble de cordes', super: 'Mur de scies', choeur: 'Chœur « oh »', choir: 'Chœur sombre', glass: 'Nappe de verre', warm: 'Nappe chaude',
  stabM7: 'Accord de Detroit', gtrMute: 'Guitare funk étouffée', pwr: 'Guitare saturée (accords)', gtrNylon: 'Guitare nylon grattée', arpRond: 'Arpège rond', gtrClean: 'Guitare claire grattée', pluck: 'Pincé de synthé', pulseArp: 'Impulsions', seqArp: 'Séquence',
  seqInd: 'Stab industriel', pno: 'Piano house', bell: 'Cloche', fmMetal: 'Métal', santour: 'Santour persan',
  ldTar: 'Tar persan', ldSaw: 'Synthé en scie', ldSync: 'Synthé hurlant', ldEwi: 'Instrument à vent', ldSax: 'Saxophone de synthé', ldWhistle: 'Sifflement', ldTalk: 'Talkbox', ldMoog: 'Synthé mono (Moog)', ldBrass: 'Cuivres années 80', ldTwang: 'Guitare western',
  ldVoixF: 'Voix de femme', ldVoixH: 'Voix d\'homme', ldFroid: 'Cold wave, lié', ldNylon: 'Guitare nylon pincée', ldCrunch: 'Guitare crunch', ldElectro: 'Électro années 80', ldEuro: 'Eurodance', ldGtr: 'Guitare saturée', ldSiren: 'Sirène', ldVox: 'Voix hachée',
  ldTri: 'Flûte de synthé', ldStr: 'Cordes solistes', ldEwiDoux: 'Instrument à vent doux', rhodesDoux: 'Rhodes adouci', gtCocotte: 'Guitare étouffée', voixOohs: 'Voix « ooh » liée', ldGuitare: 'Guitare saturée soliste', cuivreStab: 'Cuivres courts', pianoAc: 'Piano acoustique', basseDoigtS: 'Basse aux doigts', choeurPad: 'Nappe de chœur', cordesTenues: 'Cordes tenues', cuivresStab: 'Cuivres plaqués', fluteLd: 'Flûte soliste', panFluteLd: 'Flûte de pan soliste',
  saxAltoLd: 'Saxophone alto soliste', saxTenorLd: 'Saxophone ténor soliste', slapS: 'Basse slap jouée', steelLd: 'Steel drum soliste', trompetteLd: 'Trompette soliste', gtSat: 'Guitare crunch soliste', gtClair: 'Guitare claire soliste', vibraArp: 'Vibraphone en arpège', choeurLd: 'Chœur soliste', voixHachee: 'Voix hachée (enregistrée)', pizzSeq: 'Cordes pincées en séquence',
  e_piano: 'Piano', e_rhodes: 'Piano électrique Rhodes', e_choeur: 'Chœur « ah »', e_oohs: 'Voix « ooh »', e_gtMute: 'Guitare étouffée', e_gtClean: 'Guitare claire', e_gtDist: 'Guitare saturée', e_gtOver: 'Guitare crunch', e_cordes: 'Cordes', e_cuivres: 'Cuivres',
  e_synBrass: 'Cuivres de synthé', e_slap: 'Basse slap', e_basseDoigt: 'Basse électrique', e_altoSax: 'Saxophone alto', e_flute: 'Flûte', e_sitar: 'Sitar', e_kalimba: 'Kalimba', e_steel: 'Steel drum', e_marimba: 'Marimba', e_vibra: 'Vibraphone', e_pizz: 'Cordes pincées',
  e_trompette: 'Trompette', e_tenorSax: 'Saxophone ténor', e_panFlute: 'Flûte de pan' };
const KITN = { k808: 'TR-808 (enregistrée)', k909: 'TR-909', dur: 'Années 80, sèche', lin: 'LinnDrum', ind: 'Industrielle', acou: 'Acoustique', rock: 'Rock', brk: 'Breakbeat', dnb: 'Drum and bass', disco: 'Disco' };
const libelle = t => LIB[t] || t, famille = t => (SON.patch[t] || {}).smp ? 'e' : /^b[A-Z]/.test(t) ? 'b' : /^ld/.test(t) ? 'l' : 'c';

// ---------- état : station en cours, réglages enregistrés, annulation ----------
let st, orig, saved = {}; // orig : la station telle qu'elle est écrite dans le jeu
try { saved = JSON.parse(localStorage.getItem('vpr.musique')) || {}; } catch (e) { }
if (saved.tb) saved = {}; // réglages du premier éditeur (ancien moteur à 3 stations) : sans objet ici
const snap = () => JSON.stringify(MUS.cles.map(k => st[k])); // la station, dans le format de MUS.origine
const objet = json => Object.fromEntries(JSON.parse(json).map((v, i) => [MUS.cles[i], v]).filter(x => x[1] != null));
function poser(json) { const o = objet(json); for (const k of MUS.cles) { if (k in o) st[k] = o[k]; else delete st[k]; } MUS.accorder(st); }
let hist = [], futur = [], dernier = '', tHist = 0, tSave = 0;
const ecrireLS = () => { clearTimeout(tSave); tSave = 0; try { localStorage.setItem('vpr.musique', JSON.stringify(saved)); } catch (e) { if (!ecrireLS.dit) alert('Enregistrement impossible dans ce navigateur : utilise Fichier → Copier mes réglages.'); ecrireLS.dit = true; } };
addEventListener('pagehide', () => { if (tSave) ecrireLS(); });
function enregistrer() { // la station entière, sauf si elle est revenue à l'identique de l'origine ; l'écriture attend la fin du geste
  if (dernier === MUS.origine[st.name]) delete saved[st.name]; else saved[st.name] = objet(dernier);
  clearTimeout(tSave); tSave = setTimeout(ecrireLS, 250); marques();
}
function touch() { // après chaque modification ; celles qui se suivent à moins d'une demi-seconde (un glisser) font une seule étape d'annulation ; renvoie la promesse du moteur (instruments enregistrés décodés)
  const now = Date.now(); if (now - tHist > 500) { hist.push(dernier); if (hist.length > 100) hist.shift(); futur = []; }
  tHist = now; dernier = snap(); enregistrer(); return SON.recale();
}
function remonter(de, vers) { if (!de.length) return; vers.push(dernier); dernier = de.pop(); tHist = 0; poser(dernier); enregistrer(); SON.recale(); build(); }
function marques() {
  $('undo').disabled = !hist.length; $('redo').disabled = !futur.length;
  for (const o of $('station').options) o.textContent = (saved[o.dataset.nom] ? '● ' : '') + o.dataset.txt;
}

// ---------- lecture de la station ----------
const variantes = p => BAT(p) ? st[p] : st[p].v; // les motifs d'une piste (aucun pour la nappe)
const nVar = p => p === 'd' ? 1 : variantes(p).length;
const sectionsDe = (p, vi) => Object.keys(st.sec).filter(k => st.sec[k][p] && st.sec[k][p].v % nVar(p) === vi); // sections qui jouent le motif vi de la piste p
const enJeu = p => { const x = st.sec[EC.sec] && st.sec[EC.sec][p]; return x ? x.v % nVar(p) : -1; }; // motif de la piste p qui joue en ce moment
const timbreDe = (p, s = st) => !s[p] ? '' : p === 'd' ? s.d[0] : s[p].p, poserTimbre = (p, t) => { if (p === 'd') st.d[0] = t; else st[p].p = t; };
const OCT = { b: 'bO', c: 'cO', g: 'gO', a: 'aO', l: 'lO' }; // champ de transposition de chaque piste (la nappe : st.d[1])
const octaveDe = (p, s = st) => !s[p] ? 0 : p === 'd' ? s.d[1] || 0 : s[OCT[p]] || 0, poserOctave = (p, v) => { if (p === 'd') st.d[1] = v; else st[OCT[p]] = v; };
const niveau = (p, s = st) => s.mx && s.mx[p] != null ? s.mx[p] : 1;
const dB = v => v <= 0 ? 'coupé' : (v >= 1 ? '+' : '') + (20 * Math.log10(v)).toFixed(1) + ' dB';

// ---------- sélection : la piste, la section et l'onglet affichés ----------
const sel = { p: 'l', sec: 'c', tab: 'motifs' }, rollV = {}, rollX = {}; // rollV : motif affiché dans le rouleau, par piste ; rollX : son défilement
function choisir(p, k, tab) { // choisit une piste (et une section) et ouvre l'outil qui lui convient
  sel.p = p; if (k) { sel.sec = k; if (EC.boucle) EC.boucle = k; }
  const x = st.sec[sel.sec][p]; if (ROUL(p) && x) rollV[p] = x.v % nVar(p);
  sel.tab = tab || (p === 'd' ? 'instrument' : ROUL(p) ? 'notes' : 'motifs'); build();
}

// ---------- composants ----------
// une ligne « libellé · curseur · valeur » ; get(s) lit dans la station s (en cours ou d'origine), set(v) écrit dans la station en cours ; fmt : affichage de la valeur
function slider(parent, label, get, set, min, max, step, fmt) {
  const row = el('label', 'row', `<span>${label}</span><input type="range" min="${min}" max="${max}" step="${step}"><output></output>`), inp = row.children[1];
  const maj = () => { const v = get(st); inp.value = v; row.children[2].textContent = fmt ? fmt(v) : +(+v).toFixed(2); row.classList.toggle('mod', Math.abs(v - get(orig)) > 1e-9); };
  inp.oninput = () => { set(+inp.value); maj(); touch(); };
  inp.ondblclick = () => { set(get(orig)); maj(); touch(); }; inp.title = 'Double-clic : valeur d\'origine';
  maj(); parent.append(row); return row;
}
function choix(parent, label, options, get, set) { // une ligne « libellé · liste » ; options : [[valeur, texte], …]
  const row = el('label', 'row', `<span>${label}</span><select></select>`), s = row.children[1];
  for (const [v, t] of options) s.add(new Option(t, v));
  s.value = get(st); row.classList.toggle('mod', String(get(st)) !== String(get(orig)));
  s.onchange = () => { set(s.value); touch(); build(); };
  parent.append(row);
}
function boutonsMS(p) { // muet et solo d'une piste (écoute seulement : rien n'est enregistré)
  const f = document.createDocumentFragment();
  for (const [txt, title] of [['M', 'Muet'], ['S', 'Solo']]) { const b = bouton(txt, title + ' : ' + NOM[p], () => { if (txt === 'M') EC.mute[p] = !EC.mute[p]; else EC.solo = EC.solo === p ? null : p; muets(); }, 'ms'); Object.assign(b.dataset, { ms: txt, p }); f.append(b); }
  return f;
}
const muets = () => { for (const b of document.querySelectorAll('[data-ms]')) b.setAttribute('aria-pressed', b.dataset.ms === 'M' ? !!EC.mute[b.dataset.p] : EC.solo === b.dataset.p); };
// liste « quel motif cette piste joue dans cette section » : aucun, un motif existant, ou un nouveau (copie de celui en cours)
function selVariante(p, k) {
  const sec = st.sec[k], V = variantes(p), s = el('select'), cur = sec[p] ? sec[p].v % V.length : -1; s.add(new Option('— ne joue pas', ''));
  V.forEach((_, i) => { const a = sectionsDe(p, i).filter(x => x !== k); s.add(new Option(`motif ${i + 1}${a.length ? ' (aussi dans ' + a.join(' ') + ')' : ''}`, i)); }); s.add(new Option('＋ nouveau motif (copie)', 'n'));
  s.value = cur < 0 ? '' : cur; s.setAttribute('aria-label', `${NOM[p]} : motif joué dans la section ${k}`);
  s.onchange = () => { const big = !!(sec[p] && sec[p].big);
    if (s.value === '') delete sec[p];
    else if (s.value === 'n') { for (const j in st.sec) if (st.sec[j][p]) st.sec[j][p].v %= V.length; V.push(JSON.parse(JSON.stringify(V[cur < 0 ? V.length - 1 : cur]))); sec[p] = { v: V.length - 1, big }; } // les numéros des sections sont d'abord ramenés dans l'intervalle, pour qu'aucune ne change de motif
    else sec[p] = { v: +s.value, big };
    if (ROUL(p) && sec[p]) rollV[p] = sec[p].v; touch(); build(); };
  return s;
}
function mesures(p, bars) { // boutons « − mesure / ＋ mesure » d'un motif (la mesure ajoutée copie la dernière)
  const f = document.createDocumentFragment();
  const m = bouton('−', `${NOM[p]} : retirer la dernière mesure du motif`, () => { bars.pop(); touch(); build(); }, 'ms'); m.disabled = bars.length < 2;
  const a = bouton('＋', `${NOM[p]} : ajouter une mesure au motif`, () => { bars.push(JSON.parse(JSON.stringify(bars[bars.length - 1]))); touch(); build(); }, 'ms'); a.disabled = bars.length >= 8;
  f.append(m, el('small', '', ` ${bars.length} mes. `), a); return f;
}

// ---------- reconstruction de l'écran (après un changement de structure, une annulation, un changement de station) ----------
const VUES = {}; // onglet → fonction qui remplit le panneau du bas ; chaque fichier y inscrit les siens
const ONGLETS = [['motifs', 'Motifs'], ['notes', 'Notes'], ['instrument', 'Instrument'], ['mixeur', 'Mixeur']];
// dialogues : ce qui ne sert pas en permanence ; identifiant → titre. Le contenu vient de VUES, et il est refait à chaque build() tant que le dialogue est ouvert
const DLG = { accords: () => 'Accords', station: () => 'Réglages de la station', course: () => 'Situation de course', section: () => `Section ${sel.sec}${sel.sec === st.hot ? ' ★ refrain' : ''}`, banque: () => `Instrument : ${NOM[sel.p]}` };
let dlgVue = null;
function remplirDlg() { if (!dlgVue) return; const C = $('dlgC'), h = C.scrollTop; $('dlgT').textContent = DLG[dlgVue](); C.textContent = ''; VUES[dlgVue](C); C.scrollTop = h; }
function ouvrir(id) { dlgVue = id; remplirDlg(); if (!$('dlg').open) $('dlg').showModal(); }
$('dlg').addEventListener('close', () => { dlgVue = null; }); $('dlgX').onclick = () => $('dlg').close();
const rolls = []; let shown = -1; // fonctions de dessin des rouleaux affichés ; dernier pas affiché
function build() {
  const foc = document.activeElement && document.activeElement.getAttribute && document.activeElement.getAttribute('aria-label'), D = $('dock'), haut = D.scrollTop; // le focus et les défilements survivent à la reconstruction
  for (const s of document.querySelectorAll('.roll .scroll')) rollX[s.dataset.p] = s.scrollLeft;
  st = SON.stations[SON.station]; orig = objet(MUS.origine[st.name]); shown = -1; rolls.length = 0;
  if (!st.sec[sel.sec]) sel.sec = st.sec[st.hot] ? st.hot : Object.keys(st.sec)[0];
  if (!st[sel.p]) sel.p = PISTES.find(p => st[p]);
  if (EC.boucle && !st.sec[EC.boucle]) EC.boucle = null;
  arrangement();
  const N = $('onglets'); N.textContent = '';
  for (const [id, txt] of ONGLETS) { const b = bouton(txt, '', () => { sel.tab = id; build(); }); b.setAttribute('aria-pressed', sel.tab === id); N.append(b); }
  N.append(el('span', 'pousse'), bouton(`Section ${sel.sec}${sel.sec === st.hot ? ' ★' : ''} : options`, 'Suite d\'accords, montée, filtre de la section choisie ; la dupliquer', () => ouvrir('section'), 'opt'));
  D.textContent = ''; VUES[sel.tab](D); D.scrollTop = haut; remplirDlg();
  $('bpm').value = st.bpm; $('boucle').setAttribute('aria-pressed', !!EC.boucle); muets(); marques();
  try { sessionStorage.setItem('ed.sel', JSON.stringify(sel)); } catch (e) { }
  if (foc) for (const e of document.querySelectorAll('[aria-label]')) if (e.getAttribute('aria-label') === foc) { e.focus({ preventScroll: true }); break; }
}
