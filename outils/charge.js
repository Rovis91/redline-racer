// Banc de chargement : le jeu tel qu'un joueur l'ouvre sur GitHub Pages, cache vide, réseau bridé.
//   node outils/charge.js            → index.html (accueil, carte par défaut)
//   node outils/charge.js paris      → index.html?carte=paris
//   --tout : chaque carte          --detail : les 15 plus gros fichiers          --profil : les fonctions qui prennent le temps du chargement (première visite)
// Comme GitHub Pages : serveur intégré qui compresse en gzip le texte (js, html, json, svg, css) et répond Cache-Control: max-age=600.
// Un Chrome neuf sans fenêtre par mesure (profil vide = cache vide), réseau BUDGET.reseau, processeur ralenti BUDGET.cpu fois (portable modeste).
// Deux passages : première visite (cache vide), puis visite suivante (cache gardé, dans les 10 minutes de GitHub Pages).
// Code de sortie 0 = dans le budget, 1 = hors budget, 2 = la mesure n'a pas tourné. Résultats : captures/charge.json. Variables : CHROME, PORT (8871), DBG (9410).
const { spawn } = require('child_process'), fs = require('fs'), path = require('path'), http = require('http'), os = require('os'), zlib = require('zlib');
const RACINE = path.join(__dirname, '..'), PORT = +process.env.PORT || 8871, DBG = +process.env.DBG || 9410;
const CHROME = process.env.CHROME || ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome'].find(f => fs.existsSync(f));
// Le barème GitHub Pages (docs/DEVELOPPEUR.md « Performances », « Chargement ») : réseau 4G correct, portable modeste
const BUDGET = { reseau: { debit: 10e6 / 8, latence: 100 }, cpu: 2, octets: 2.5e6, requetes: 60, pret: 6000, suivant: 3000 };
const args = process.argv.slice(2), opt = k => args.includes('--' + k);
const ids = fs.readFileSync(path.join(RACINE, 'src', 'donnees', 'cartes.js'), 'utf8').match(/\{ id: '(\w+)'/g).map(s => s.slice(7, -1));
const cartes = opt('tout') ? ids : [args.find(a => !a.startsWith('--')) || ''];
const dort = ms => new Promise(r => setTimeout(r, ms));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wasm': 'application/wasm' };
const gz = new Map(); // fichier → gzip, calculé une fois

const serveur = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]), f = path.join(RACINE, u === '/' ? 'index.html' : u);
  if (!f.startsWith(RACINE) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
  const ext = path.extname(f), st = fs.statSync(f), lm = st.mtime.toUTCString(), h = { 'Content-Type': TYPES[ext] || 'application/octet-stream', 'Cache-Control': 'max-age=600', 'Last-Modified': lm };
  if (q.headers['if-modified-since'] === lm) { r.writeHead(304, h); r.end(); return; }
  let corps = fs.readFileSync(f);
  if (/^(text|application\/json|image\/svg)/.test(h['Content-Type']) && /gzip/.test(q.headers['accept-encoding'] || '')) {
    const k = f + lm; if (!gz.has(k)) gz.set(k, zlib.gzipSync(corps, { level: 6 })); corps = gz.get(k); h['Content-Encoding'] = 'gzip';
  }
  r.writeHead(200, h); r.end(corps);
});

async function chrome(dossier) {
  const p = spawn(CHROME, ['--headless=new', '--window-size=1280,720', '--no-first-run', '--remote-debugging-port=' + DBG, '--user-data-dir=' + dossier, '--ignore-gpu-blocklist', '--enable-gpu', '--mute-audio', '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: 'ignore' });
  for (let i = 0; i < 40; i++) { try { const v = await (await fetch('http://127.0.0.1:' + DBG + '/json/list')).json(); const t = v.find(x => x.type === 'page'); if (t) return { p, t }; } catch { } await dort(250); }
  p.kill(); throw new Error('Chrome ne répond pas');
}

async function mesure(carte) {
  const dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'vpr-charge-')), { p, t } = await chrome(dossier), ws = new WebSocket(t.webSocketDebuggerUrl);
  let id = 0; const att = new Map(), fichiers = new Map(), erreurs = [];
  ws.onmessage = e => { const m = JSON.parse(e.data);
    if (m.id && att.has(m.id)) { att.get(m.id)(m); att.delete(m.id); }
    else if (m.method === 'Network.responseReceived') fichiers.set(m.params.requestId, { url: m.params.response.url.replace(/^.*?:\d+\//, ''), statut: m.params.response.status, octets: 0 });
    else if (m.method === 'Network.loadingFinished' && fichiers.has(m.params.requestId)) fichiers.get(m.params.requestId).octets = m.params.encodedDataLength;
    else if (m.method === 'Runtime.exceptionThrown') erreurs.push((m.params.exceptionDetails.exception || {}).description || m.params.exceptionDetails.text); };
  await new Promise(r => ws.onopen = r);
  const cmd = (method, params = {}) => new Promise(r => { const i = ++id; att.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const evalue = async e => ((await cmd('Runtime.evaluate', { expression: e, returnByValue: true })).result.result || {}).value;
  await Promise.all(['Runtime.enable', 'Page.enable', 'Network.enable', 'Performance.enable'].map(m => cmd(m)));
  await cmd('Network.emulateNetworkConditions', { offline: false, latency: BUDGET.reseau.latence, downloadThroughput: BUDGET.reseau.debit, uploadThroughput: BUDGET.reseau.debit / 4 });
  await cmd('Emulation.setCPUThrottlingRate', { rate: BUDGET.cpu });
  const url = 'http://127.0.0.1:' + PORT + '/index.html' + (carte ? '?carte=' + carte : '');
  const passe = async () => {
    const prof = opt('profil') && !fichiers.size; if (prof) { await cmd('Profiler.enable'); await cmd('Profiler.setSamplingInterval', { interval: 500 }); await cmd('Profiler.start'); }
    fichiers.clear(); erreurs.length = 0; const t0 = Date.now(); await cmd('Page.navigate', { url }); let pret = 0;
    for (let i = 0; i < 1200 && !pret; i++) { await dort(50); if (await evalue('!!(window.__g && window.__g.M)').catch(() => false)) pret = Date.now() - t0; if (erreurs.length) break; }
    const nav = await evalue('JSON.stringify({ dcl: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart })');
    const m = Object.fromEntries((await cmd('Performance.getMetrics')).result.metrics.map(x => [x.name, x.value]));
    const f = [...fichiers.values()];
    let chaud;
    if (prof) { // temps propre par fonction (échantillons), rapporté à son fichier et sa ligne
      const { nodes, samples, timeDeltas } = (await cmd('Profiler.stop')).result.profile, parId = new Map(nodes.map(n => [n.id, n])), t = new Map();
      samples.forEach((id, i) => { const c = parId.get(id).callFrame, k = (c.functionName || '(anonyme)') + ' ' + c.url.replace(/^.*?:\d+\//, '') + ':' + (c.lineNumber + 1); t.set(k, (t.get(k) || 0) + timeDeltas[i] / 1000); });
      chaud = [...t].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, ms]) => Math.round(ms) + ' ms  ' + k);
    }
    return { pret, ...JSON.parse(nav || '{}'), octets: f.reduce((s, x) => s + x.octets, 0), requetes: f.length, script: Math.round(m.ScriptDuration * 1000), tas: Math.round(m.JSHeapUsedSize / 1e6), fichiers: f.sort((a, b) => b.octets - a.octets), erreurs: [...erreurs], chaud };
  };
  try { const a = await passe(), b = await passe(); return { carte: carte || '(accueil)', premiere: a, suivante: b }; }
  finally { ws.close(); p.kill(); await dort(300); try { fs.rmSync(dossier, { recursive: true, force: true }); } catch { } }
}

(async () => {
  if (!CHROME) { console.log('ÉCHEC : Chrome introuvable (variable CHROME)'); process.exit(2); }
  await new Promise((ok, ko) => serveur.listen(PORT, '127.0.0.1', ok).on('error', ko)).catch(e => { console.log('ÉCHEC : port ' + PORT + ' pris (' + e.code + ') ; PORT=8872 node outils/charge.js'); process.exit(2); });
  const B = BUDGET, mo = o => (o / 1e6).toFixed(2) + ' Mo', s = ms => (ms / 1000).toFixed(1) + ' s', x = (v, max) => v > max ? '✗' : '';
  console.log(`barème : ${B.reseau.debit * 8 / 1e6} Mbit/s, ${B.reseau.latence} ms, processeur ÷${B.cpu} — ≤ ${mo(B.octets)}, ≤ ${B.requetes} requêtes, prêt ≤ ${s(B.pret)}, visite suivante ≤ ${s(B.suivant)}\n`);
  const tout = []; let ok = 0;
  for (const c of cartes) {
    try {
      const r = await mesure(c), a = r.premiere, b = r.suivante; tout.push(r);
      const bon = a.pret && b.pret && a.octets <= B.octets && a.requetes <= B.requetes && a.pret <= B.pret && b.pret <= B.suivant && !a.erreurs.length; ok += bon;
      console.log(r.carte.padEnd(10), (bon ? 'SUCCÈS' : 'ÉCHEC').padEnd(7), `${mo(a.octets)}${x(a.octets, B.octets)}  ${a.requetes} req${x(a.requetes, B.requetes)}  scripts lus ${s(a.dcl)}  prêt ${a.pret ? s(a.pret) : '—'}${x(a.pret || 1e9, B.pret)}  script ${s(a.script)}  | suivante : prêt ${b.pret ? s(b.pret) : '—'}${x(b.pret || 1e9, B.suivant)}, ${mo(b.octets)}`);
      if (a.erreurs.length) console.log(''.padEnd(18), 'erreur :', a.erreurs[0].split('\n')[0]);
      if (a.chaud) for (const l of a.chaud) console.log(''.padEnd(18), l);
      if (opt('detail')) for (const f of a.fichiers.slice(0, 15)) console.log(''.padEnd(18), (f.octets / 1e3).toFixed(0).padStart(6) + ' ko', f.url);
    } catch (e) { console.log((c || '(accueil)').padEnd(10), 'PAS DE RÉSULTAT :', e.message); tout.push({ carte: c, erreur: e.message }); }
  }
  fs.mkdirSync(path.join(RACINE, 'captures'), { recursive: true }); fs.writeFileSync(path.join(RACINE, 'captures', 'charge.json'), JSON.stringify(tout, null, 1));
  serveur.close(); process.exit(ok === cartes.length ? 0 : tout.some(r => r.erreur) ? 2 : 1);
})();
