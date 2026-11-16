// Banc rapide : un seul Chrome, lancé au premier appel puis gardé ouvert (sans fenêtre, son coupé mais calculé), piloté par le protocole de débogage.
//   node outils/banc-rapide.js                 → verdict sur toutes les cartes : la mesure de outils/perf.js (tour()), contre BUDGET, inchangé
//   node outils/banc-rapide.js paris canal     → ces cartes
//   node outils/banc-rapide.js --profil touge  → verdict, puis profil (outils/profil.js) : par passe, par vingtième de piste, par objet du décor, pires images, son.
//                                                 Écrit captures/profil-<carte>.json et compare au profil précédent de la carte (captures/profil-<carte>.prec.json).
//   --regularite : ajoute la régularité du mouvement (saccades) à 60, 120 et 144 Hz, regularite() de outils/perf.js, contre REGULARITE (ne dépend pas de la machine)
//   --joueurs=2 : écran partagé (budget(2))      --fenetre : Chrome avec une fenêtre hors de l'écran au lieu de sans fenêtre      --fermer : ferme le Chrome gardé, puis sort
// Bruit : la machine partagée fausse les temps (pas les passes de dessin ni les sommets). Une carte en échec est remesurée une fois : SUCCÈS, ÉCHEC (deux fois), ou INSTABLE (une sur deux),
// avec la charge de la machine pendant la mesure. Au-delà de 40 % de charge, les millisecondes ne sont pas fiables.
// Code de sortie 0 = tout passe. Variables : OPT (options de carte à essayer, JSON fusionné dans la carte : docs/MOTEUR-OPTIONS-CARTES.md), CHROME, PORT (8851, serveur outils/capture.py), DBG (9400, port de débogage du Chrome gardé).
const { spawn } = require('child_process'), fs = require('fs'), path = require('path'), http = require('http'), os = require('os');
const RACINE = path.join(__dirname, '..'), PORT = +process.env.PORT || 8851, DBG = +process.env.DBG || 9400, BASE = 'http://127.0.0.1:' + PORT + '/index.html';
const CHROME = process.env.CHROME || ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome'].find(f => fs.existsSync(f));
const args = process.argv.slice(2), opt = k => args.includes('--' + k), PROFIL = opt('profil'), REG = opt('regularite'), J = opt('joueurs=2') ? 2 : 1;
const ids = fs.readFileSync(path.join(RACINE, 'src', 'donnees', 'cartes.js'), 'utf8').match(/\{ id: '(\w+)'/g).map(s => s.slice(7, -1)), voulues = args.filter(a => !a.startsWith('--')), cartes = voulues.length ? voulues : ids;
const req = (u, m = 'GET') => new Promise((r, j) => { const q = http.request(u, { method: m }, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => r(d)); }); q.on('error', j); q.end(); });
const dort = ms => new Promise(r => setTimeout(r, ms)), repond = async u => { try { await req(u); return true; } catch { return false; } };
const attends = async (u, n) => { for (let i = 0; i < n; i++) { if (await repond(u)) return true; await dort(250); } return false; };
const charge = () => { const c = os.cpus(); return [c.reduce((s, x) => s + x.times.idle, 0), c.reduce((s, x) => s + Object.values(x.times).reduce((a, b) => a + b, 0), 0)]; };
const pct = (a, b) => Math.round(100 * (1 - (b[0] - a[0]) / (b[1] - a[1])));
const sortie = n => path.join(RACINE, 'captures', n);

(async () => {
  if (opt('fermer')) { try { const v = JSON.parse(await req('http://127.0.0.1:' + DBG + '/json/version')), ws = new WebSocket(v.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r); ws.send(JSON.stringify({ id: 1, method: 'Browser.close' })); await dort(300); } catch { } process.exit(0); }
  const inconnues = cartes.filter(c => !ids.includes(c)); if (inconnues.length) { console.log('carte inconnue : ' + inconnues.join(', ') + ' (cartes : ' + ids.join(', ') + ')'); process.exit(2); }
  if (!(await repond(BASE))) { spawn('python', [path.join('outils', 'capture.py'), String(PORT)], { cwd: RACINE, stdio: 'ignore', detached: true }).unref(); if (!(await attends(BASE, 40))) { console.log('ÉCHEC : le serveur ne démarre pas sur le port ' + PORT); process.exit(2); } }
  // un serveur d'une autre copie du jeu (autre worktree) peut tenir ce port : on mesurerait sa version
  if ((await req(BASE.replace('index.html', 'outils/banc-rapide.js')).catch(() => '')).replace(/\r/g, '') !== fs.readFileSync(__filename, 'utf8').replace(/\r/g, '')) { console.log('ÉCHEC : le serveur du port ' + PORT + ' sert une autre copie du jeu ; choisir un autre port (PORT=8862 node outils/banc-rapide.js …)'); process.exit(2); }
  if (!(await repond('http://127.0.0.1:' + DBG + '/json/version'))) {
    if (!CHROME) { console.log('ÉCHEC : Chrome introuvable (variable CHROME)'); process.exit(2); }
    // sans fenêtre (--headless=new) : même GPU (ANGLE D3D11), rien ne s'ouvre à l'écran ; les drapeaux empêchent Chrome de ralentir un onglet qu'il croit caché
    spawn(CHROME, [opt('fenetre') ? '--window-position=-2600,0' : '--headless=new', '--window-size=1280,720', '--no-first-run', '--remote-debugging-port=' + DBG, '--user-data-dir=' + path.join(os.tmpdir(), 'vpr-banc-rapide-' + DBG),
      '--ignore-gpu-blocklist', '--enable-gpu', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--disable-features=CalculateNativeWinOcclusion',
      '--autoplay-policy=no-user-gesture-required', '--mute-audio', 'about:blank'], { stdio: 'ignore', detached: true }).unref();
    if (!(await attends('http://127.0.0.1:' + DBG + '/json/version', 40))) { console.log('ÉCHEC : Chrome ne répond pas'); process.exit(2); }
  }
  const t = JSON.parse(await req('http://127.0.0.1:' + DBG + '/json/new?about:blank', 'PUT')), ws = new WebSocket(t.webSocketDebuggerUrl); let id = 0; const att = new Map(); let erreurs = [];
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && att.has(m.id)) { att.get(m.id)(m); att.delete(m.id); } else if (m.method === 'Runtime.exceptionThrown') erreurs.push(((m.params.exceptionDetails.exception || {}).description || m.params.exceptionDetails.text || '').split('\n')[0]); };
  await new Promise(r => ws.onopen = r); const cmd = (method, params = {}) => new Promise(r => { const i = ++id; att.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const evalue = async (expr, ms = 600000) => { const r = await Promise.race([cmd('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }), dort(ms).then(() => ({ delai: 1 }))]);
    if (r.delai) throw new Error('délai dépassé'); const x = r.result; if (x.exceptionDetails) throw new Error((x.exceptionDetails.exception || {}).description || x.exceptionDetails.text); return x.result.value; };
  await cmd('Runtime.enable'); await cmd('Page.enable');
  // mode course pour la mesure, comme outils/perf.js (suite) ; le nombre de vues est dans l'adresse
  await cmd('Page.addScriptToEvaluateOnNewDocument', { source: `try { localStorage.setItem('vpr7.mode${J > 1 ? 2 : ''}', '"course"'); } catch (e) {}` });
  const origines = fs.readFileSync(path.join(__dirname, 'origines.js'), 'utf8'); let crochet = null;
  // charge la carte, en rechargeant une fois si un script s'est perdu (le petit serveur local en lâche parfois un)
  const charge1 = async (c, avecOrigines) => {
    if (avecOrigines && !crochet) crochet = (await cmd('Page.addScriptToEvaluateOnNewDocument', { source: origines })).result.identifier;
    if (!avecOrigines && crochet) { await cmd('Page.removeScriptToEvaluateOnNewDocument', { identifier: crochet }); crochet = null; }
    for (let essai = 0; essai < 2; essai++) {
      erreurs = []; const t0 = Date.now(); await cmd('Page.navigate', { url: BASE + '?auto&joueurs=' + J + '&carte=' + c + (process.env.OPT ? '&opt=' + encodeURIComponent(process.env.OPT) : '') });
      for (let i = 0; i < 240; i++) { await dort(250); if (await evalue('!!(window.__g && __g.M && __g.M.id === ' + JSON.stringify(c) + ')', 5000).catch(() => false)) return Date.now() - t0; if (erreurs.length && i > 8) break; }
    }
    throw new Error('la carte ne se charge pas : ' + (erreurs[0] || 'délai'));
  };
  const tour = async () => { const a = charge(); const r = await evalue('(async () => { const P = await import("./outils/perf.js"); const r = await P.tour(); r.B = P.budget(' + J + '); return r; })()'); r.charge = pct(a, charge()); return r; };
  const bon = r => r.ms <= r.B.ms && r.cpuMax <= r.B.cpuMax; // le verdict de outils/banc.js : moyenne et pire image ; les passes de dessin (appelsMax) sont affichées, marquées ✗ au-delà de BUDGET.appels
  const ligne = r => [(r.ms.toFixed(2) + ' ms' + (r.ms > r.B.ms ? '✗' : '')).padEnd(9), ('pire ' + r.cpuMax.toFixed(1) + (r.cpuMax > r.B.cpuMax ? '✗' : '')).padEnd(10), ('appels ' + r.appelsMax + (r.appelsMax > r.B.appels ? '✗' : '')).padEnd(11), ('charge ' + r.charge + '%').padEnd(10)].join(' ');
  const tout = []; let ok = 0;
  for (const c of cartes) {
    let res;
    try {
      const chargement = await charge1(c, false), r1 = await tour(); let r2 = null; if (!bon(r1)) r2 = await tour();
      const v = bon(r1) ? 'SUCCÈS' : r2 && bon(r2) ? 'INSTABLE' : 'ÉCHEC'; ok += v === 'SUCCÈS';
      // l'à-coup est-il au même endroit les deux fois ? (échantillon de piste à ±30 près) : alors il vient de la carte, pas de la machine
      const lieu = r => +r.piresCpu[0].split(':')[0], meme = r2 && Math.abs(lieu(r1) - lieu(r2)) <= 30;
      console.log(c.padEnd(8), v.padEnd(9), ligne(r1) + (r2 ? '  | 2e : ' + ligne(r2) + (r1.cpuMax > r1.B.cpuMax && r2.cpuMax > r2.B.cpuMax ? (meme ? ' à-coup au même endroit (' + lieu(r1) + ')' : ' à-coups à des endroits différents') : '') : ''), '  chargement ' + (chargement / 1000).toFixed(1) + ' s');
      if (v !== 'SUCCÈS') console.log(''.padEnd(18), 'pires images :', r1.piresCpu.slice(0, 3).join(' | '));
      res = { carte: c, verdict: v, chargement, mesures: [r1, r2].filter(Boolean) };
      if (REG) { // la régularité compte dans le verdict : une carte saccadée échoue même rapide
        await charge1(c, false); const rg = await evalue('(async () => { const P = await import("./outils/perf.js"); return { B: P.REGULARITE, r: [60, 120, 144].map(hz => P.regularite({ hz })) }; })()');
        const bonR = rg.r.every(x => x.saccade <= rg.B.saccade && x.saccadeMax <= rg.B.saccadeMax); if (!bonR && v === 'SUCCÈS') { ok--; res.verdict = 'ÉCHEC'; }
        console.log(''.padEnd(18), 'régularité', (bonR ? 'OK' : 'ÉCHEC').padEnd(6), rg.r.map(x => x.hz + ' Hz ' + x.saccade + ' % (pire ' + x.saccadeMax + ' %)' + (x.saccade > rg.B.saccade || x.saccadeMax > rg.B.saccadeMax ? '✗' : '')).join('  ')); res.regularite = rg.r;
      }
      if (PROFIL) {
        await charge1(c, true); const a = charge(), p = await evalue('(async () => (await import("./outils/profil.js")).profil())()'); p.charge = pct(a, charge());
        const f = sortie('profil-' + c + '.json'), prec = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
        if (prec) fs.copyFileSync(f, sortie('profil-' + c + '.prec.json')); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(p, null, 1));
        resume(p, prec); res.profil = path.relative(RACINE, f);
      }
    } catch (e) { console.log(c.padEnd(8), 'PAS DE RÉSULTAT :', e.message.split('\n')[0]); res = { carte: c, erreur: e.message }; }
    tout.push(res);
  }
  fs.mkdirSync(sortie(''), { recursive: true }); fs.writeFileSync(sortie('banc-rapide' + (J > 1 ? '2' : '') + '.json'), JSON.stringify(tout, null, 1));
  console.log('\n' + ok + '/' + cartes.length + ' cartes dans la référence (Chrome gardé ouvert : node outils/banc-rapide.js --fermer)'); ws.close(); await req('http://127.0.0.1:' + DBG + '/json/close/' + t.id).catch(() => { }); process.exit(ok === cartes.length ? 0 : 1);
})();

// lecture du profil en quelques lignes ; le détail est dans le fichier json
function resume(p, prec) {
  const d = (k, v, f = 2) => prec && prec[k] != null ? ' (' + (v - prec[k] >= 0 ? '+' : '') + (v - prec[k]).toFixed(f) + ')' : '';
  console.log('  profil · cpu ' + p.cpu + d('cpu', p.cpu) + ' p99 ' + p.cpu99 + ' max ' + p.cpuMax + ' · GPU ' + p.gpu + d('gpu', p.gpu) + ' p99 ' + p.gpu99 + ' · appels ' + p.appels + d('appels', p.appels, 0) + ' max ' + p.appelsMax + ' · charge ' + p.charge + '%' + (p.gpuMinuterie ? '' : ' · sans minuterie GPU'));
  console.log('  passes · ' + Object.entries(p.parPasse).map(([k, v]) => k + ' ' + v.appels + ' app/' + v.ktris + 'kt/' + v.gpu + 'ms').join(' · '));
  const chaud = [...p.sections].sort((a, b) => b.gpu + b.cpu - a.gpu - a.cpu).slice(0, 3);
  console.log('  sections les plus chères (piste) · ' + chaud.map(s => s.idx + ' : cpu ' + s.cpu + ' GPU ' + s.gpu + ' appels ' + s.appels + ' ' + s.ktris + 'kt').join(' · '));
  console.log('  objets (appels/image, k sommets/image) :'); for (const o of p.objets.slice(0, 8)) console.log('    ' + String(o.appels).padStart(6) + '  ' + String(o.ksommets).padStart(7) + 'k  ' + o.origine);
  console.log('  pires images · ' + p.pires.slice(0, 4).map(f => f.cpu + ' ms @' + f.idx + ' (rendu ' + f.rendu + ', son ' + f.son + (f.ev ? ', ' + f.ev : '') + ')').join(' · '));
  const a = p.son.avant, b = p.son.apres, cp = a && b ? Object.keys(b).filter(k => /underrun|fallback/i.test(k) && typeof b[k] === 'number').map(k => k + ' +' + +(b[k] - a[k]).toFixed(3)).join(' ') : 'statistiques indisponibles';
  console.log('  son · frame ' + p.son.frame + ' p99 ' + p.son.frame99 + ' max ' + p.son.frameMax + ' ms · coupures : ' + cp);
  console.log('  décor · ' + p.decor.maillagesFondus + ' fondus, ' + p.decor.maillagesSeuls + ' seuls, ' + p.decor.instances + ' instances, ' + p.decor.ksommets + 'k sommets, ' + p.decor.shaders + ' shaders');
}
