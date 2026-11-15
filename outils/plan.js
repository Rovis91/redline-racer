// Plans : la capture d'un endroit précis d'une carte en quelques secondes, sans rouler jusque-là, avec avant/après.
// La voiture est posée 60 m avant l'endroit et le pilote automatique finit le trajet : la caméra de course est en place, rien d'autre n'est simulé.
// Un seul Chrome, gardé ouvert et partagé avec outils/banc-rapide.js (sans fenêtre, carte graphique) ; rien n'est jamais effacé dans captures/.
//   node outils/plan.js perse 14            → captures/plans/perse/14.jpg : le plan 14 (la piste est coupée en 20 plans, 1 à 20, d'un vingtième chacun)
//   node outils/plan.js perse 3 4 14        → une planche des trois plans (640 × 360 par vue, 12 vues au plus par image) : c'est elle qu'on donne à lire
//   node outils/plan.js perse tour          → les 20 plans en deux planches
//   node outils/plan.js perse @516          → à l'échantillon de piste 516      node outils/plan.js perse porte → un plan nommé de outils/plans.json
//   --avant        range la capture comme état de départ (<nom>.avant.jpg). La même commande sans --avant, après la modification, écrit <nom>.jpg
//                  et <nom>.duo.jpg : avant à gauche, après à droite.
//   --vue=90,12,4  caméra d'inspection autour de la voiture (angle°, distance, hauteur) au lieu de la caméra de course
//   --rafale=6     6 images de suite au même endroit (1/30 s entre deux), en planche : ce qui ondule ou clignote ne se voit qu'en mouvement
//   --style=jeu    le rendu réel du jeu (270 lignes, avec l'interface) au lieu du rendu net      --taille=1920x1080   taille de l'image (960x540 par défaut)
//   --hud          garde l'interface du jeu sur l'image (retirée par défaut : elle cache les coins du décor)
//   --nom=porte    enregistre ce plan (échantillon et vue) sous ce nom dans outils/plans.json
// Variables : CHROME, PORT (un port par copie du jeu, tiré du chemin : deux worktrees ne se gênent pas), DBG (9400). Fermer le Chrome gardé : node outils/banc-rapide.js --fermer
const { spawn } = require('child_process'), fs = require('fs'), path = require('path'), http = require('http'), os = require('os');
const RACINE = path.join(__dirname, '..'), DBG = +process.env.DBG || 9400, PORT = +process.env.PORT || 8900 + [...RACINE].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) % 90, BASE = 'http://127.0.0.1:' + PORT + '/';
const CHROME = process.env.CHROME || ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome'].find(f => fs.existsSync(f));
const args = process.argv.slice(2), val = k => (args.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1], opt = k => args.includes('--' + k);
const ids = fs.readFileSync(path.join(RACINE, 'cartes.js'), 'utf8').match(/\{ id: '(\w+)'/g).map(s => s.slice(7, -1)), [carte, ...demandes] = args.filter(a => !a.startsWith('--'));
const NOMS = path.join(__dirname, 'plans.json'), noms = fs.existsSync(NOMS) ? JSON.parse(fs.readFileSync(NOMS, 'utf8')) : {};
const req = (u, m = 'GET') => new Promise((r, j) => { const q = http.request(u, { method: m }, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => r(d)); }); q.on('error', j); q.end(); });
const dort = ms => new Promise(r => setTimeout(r, ms)), repond = async u => { try { await req(u); return true; } catch { return false; } };
const attends = async (u, n) => { for (let i = 0; i < n; i++) { if (await repond(u)) return true; await dort(250); } return false; };
const fin = (code, msg) => { if (msg) console.log(msg); process.exit(code); };

// ce qui tourne dans la page du jeu
const PAGE = `(() => {
  const g = __g, T = g.T, n = T.n, R = g.renderer, vues = [];
  requestAnimationFrame = () => 0; g.start(); let t = 1e7; while (g.state !== 'race') g.frame(t += 100);
  // sans interface : le jeu dessine son HUD dans un canevas perdu, celui que lit la passe finale reste vide
  if (!window.__planHud) for (const u of g.vues) { u.hudC.getContext('2d').clearRect(0, 0, u.hudC.width, u.hudC.height); u.hg = document.createElement('canvas').getContext('2d'); }
  R.info.autoReset = false;
  const prise = nom => { R.info.reset(); g.frame(t += 33); const cv = R.domElement, c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height; c.getContext('2d').drawImage(cv, 0, 0); vues.push({ c, nom }); };
  const image = c => c.toDataURL('image/jpeg', 0.85).slice(23);
  window.__plan = {
    // pose la voiture 30 échantillons (60 m) avant i, lancée dans l'axe, et laisse le pilote automatique arriver à i
    va(i, vue, nom, rafale) {
      const c = g.car, i0 = ((i - 30) % n + n) % n, s = T.S[i0]; g.vue = vue || null;
      Object.assign(c, { x: s.x, y: s.y, z: s.z, th: Math.atan2(s.tz, s.tx), vx: s.tx * 22, vz: s.tz * 22, idx: i0, dist: i0, d: 0, yaw: 0, steer: 0, vy: 0, air: false, drift: false, slide: 0, hit: 0, stun: 0 });
      for (let k = 0; k < 300 && c.idx !== i && (i - c.idx + n) % n < 60; k++) g.frame(t += 100);
      for (let k = 0; k < (rafale || 1); k++) prise(rafale ? nom + ' +' + k : nom);
      return { idx: c.idx, kmh: Math.round(Math.hypot(c.vx, c.vz) * 3.6) };
    },
    seule: () => image(vues[0].c),
    planche(de, cols) {
      const l = vues.slice(de, de + 12), tw = 640, th = 360, c = document.createElement('canvas'), x = c.getContext('2d'); c.width = Math.min(cols, l.length) * tw; c.height = Math.ceil(l.length / cols) * th;
      l.forEach((u, k) => { const px = (k % cols) * tw, py = Math.floor(k / cols) * th; x.drawImage(u.c, px, py, tw, th); x.font = 'bold 20px monospace'; x.textAlign = 'center'; x.lineWidth = 4; x.strokeStyle = '#000'; x.fillStyle = '#ffe63c'; x.strokeText(u.nom, px + tw * 0.42, py + 22); x.fillText(u.nom, px + tw * 0.42, py + 22); }); // en haut au centre : les coins sont pris par le HUD
      return image(c);
    },
    async duo(avant) {
      const im = new Image(); im.src = 'data:image/jpeg;base64,' + avant; await im.decode();
      const b = vues[0].c, c = document.createElement('canvas'), x = c.getContext('2d'); c.width = b.width * 2; c.height = b.height; x.drawImage(im, 0, 0, b.width, b.height); x.drawImage(b, b.width, 0);
      x.font = 'bold 22px monospace'; x.textAlign = 'center'; x.lineWidth = 4; x.strokeStyle = '#000'; x.fillStyle = '#ffe63c'; for (const [s, px] of [['AVANT', b.width * 0.42], ['APRES', b.width * 1.42]]) { x.strokeText(s, px, 26); x.fillText(s, px, 26); }
      return image(c);
    },
    vues: () => vues.length, n,
  };
  return n;
})()`;

(async () => {
  if (!ids.includes(carte) || !demandes.length) fin(2, 'usage : node outils/plan.js <carte> <plan…|tour|@échantillon|nom> [--avant] [--vue=a,d,h] [--rafale=n] [--style=jeu] [--hud] [--taille=LxH] [--nom=x]\ncartes : ' + ids.join(', ') + (noms[carte] ? '\nplans nommés de ' + carte + ' : ' + Object.keys(noms[carte]).join(', ') : ''));
  if (!(await repond(BASE + 'index.html'))) { spawn('python', [path.join('outils', 'capture.py'), String(PORT)], { cwd: RACINE, stdio: 'ignore', detached: true }).unref(); if (!(await attends(BASE + 'index.html', 40))) fin(2, 'ÉCHEC : le serveur ne démarre pas sur le port ' + PORT); }
  if ((await req(BASE + 'outils/plan.js').catch(() => '')).replace(/\r/g, '') !== fs.readFileSync(__filename, 'utf8').replace(/\r/g, '')) fin(2, 'ÉCHEC : le serveur du port ' + PORT + ' sert une autre copie du jeu ; choisir un autre port (PORT=8995 node outils/plan.js …)');
  if (!(await repond('http://127.0.0.1:' + DBG + '/json/version'))) {
    if (!CHROME) fin(2, 'ÉCHEC : Chrome introuvable (variable CHROME)');
    // les mêmes drapeaux que outils/banc-rapide.js : c'est le même Chrome gardé
    spawn(CHROME, ['--headless=new', '--window-size=1280,720', '--no-first-run', '--remote-debugging-port=' + DBG, '--user-data-dir=' + path.join(os.tmpdir(), 'vpr-banc-rapide-' + DBG),
      '--ignore-gpu-blocklist', '--enable-gpu', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--disable-features=CalculateNativeWinOcclusion',
      '--autoplay-policy=no-user-gesture-required', '--mute-audio', 'about:blank'], { stdio: 'ignore', detached: true }).unref();
    if (!(await attends('http://127.0.0.1:' + DBG + '/json/version', 40))) fin(2, 'ÉCHEC : Chrome ne répond pas');
  }
  const tab = JSON.parse(await req('http://127.0.0.1:' + DBG + '/json/new?about:blank', 'PUT')), ws = new WebSocket(tab.webSocketDebuggerUrl); let id = 0; const att = new Map(), erreurs = [];
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && att.has(m.id)) { att.get(m.id)(m); att.delete(m.id); }
    else if (m.method === 'Runtime.exceptionThrown') erreurs.push(((m.params.exceptionDetails.exception || {}).description || m.params.exceptionDetails.text || '').split('\n')[0]);
    else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') erreurs.push(m.params.args.map(a => a.value || a.description || '').join(' ').slice(0, 300)); };
  await new Promise(r => ws.onopen = r); const cmd = (method, params = {}) => new Promise(r => { const i = ++id; att.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const evalue = async (expr, ms = 120000) => { const r = await Promise.race([cmd('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }), dort(ms).then(() => ({ delai: 1 }))]);
    if (r.delai) throw new Error('délai dépassé'); const x = r.result; if (x.exceptionDetails) throw new Error((x.exceptionDetails.exception || {}).description || x.exceptionDetails.text); return x.result.value; };
  const ferme = async code => { ws.close(); await req('http://127.0.0.1:' + DBG + '/json/close/' + tab.id).catch(() => { }); process.exit(code); };
  await cmd('Runtime.enable'); await cmd('Page.enable');
  const [lw, lh] = (val('taille') || '960x540').split('x').map(Number), style = val('style') || 'net';
  await cmd('Emulation.setDeviceMetricsOverride', { width: lw, height: lh, deviceScaleFactor: 1, mobile: false });
  // charge la carte et la met en course ; une seconde tentative si un script s'est perdu (le petit serveur local en lâche parfois un)
  const ouvre = async c => {
    for (let essai = 0; essai < 2; essai++) {
      erreurs.length = 0; await cmd('Page.navigate', { url: BASE + 'index.html?auto&carte=' + c + (style === 'jeu' ? '' : '&style=' + style) + '&v=' + Date.now() });
      for (let i = 0; i < 240; i++) { await dort(250); if (await evalue('!!(window.__g && __g.M && __g.M.id === ' + JSON.stringify(c) + ')', 5000).catch(() => false)) return evalue('window.__planHud = ' + (opt('hud') || style === 'jeu') + '; ' + PAGE); if (erreurs.length && i > 8) break; }
    }
    throw new Error('la carte ne se charge pas : ' + (erreurs[0] || 'délai'));
  };
  try {
    const t0 = Date.now(), n = await ouvre(carte), vue = val('vue') ? val('vue').split(',').map(Number) : null, rafale = +val('rafale') || 0, tour = demandes[0] === 'tour';
    // un plan : son numéro (1 à 20), @échantillon, ou un nom de plans.json
    const plans = (tour ? Array.from({ length: 20 }, (_, k) => String(k + 1)) : demandes).map(p => {
      const nomme = (noms[carte] || {})[p];
      if (nomme) return { nom: p, idx: nomme.idx, vue: vue || nomme.vue || null };
      if (/^@\d+$/.test(p)) return { nom: p.slice(1), idx: +p.slice(1) % n, vue };
      if (/^\d+$/.test(p) && +p >= 1 && +p <= 20) return { nom: p, idx: Math.round((+p - 0.5) * n / 20) % n, vue };
      throw new Error('plan inconnu : ' + p + ' (1 à 20, tour, @échantillon' + (noms[carte] ? ', ' + Object.keys(noms[carte]).join(', ') : '') + ')');
    });
    for (const p of plans) {
      const r = await evalue(`__plan.va(${p.idx}, ${JSON.stringify(p.vue)}, ${JSON.stringify(p.nom + ' @' + p.idx)}, ${rafale})`);
      console.log(('plan ' + p.nom).padEnd(14), ('échantillon ' + r.idx + '/' + n).padEnd(22), r.kmh + ' km/h');
    }
    const dossier = path.join(RACINE, 'captures', 'plans', carte), suf = opt('avant') ? '.avant' : '', ecrit = (nom, b64) => { fs.mkdirSync(dossier, { recursive: true }); const f = path.join(dossier, nom + '.jpg'); fs.writeFileSync(f, Buffer.from(b64, 'base64')); console.log(path.relative(RACINE, f).replace(/\\/g, '/')); };
    const total = await evalue('__plan.vues()'), base = tour ? 'tour' : plans.map(p => p.nom).join('-') + (rafale ? '-rafale' : '') + (vue ? '-vue' : '');
    if (total === 1) {
      ecrit(base + suf, await evalue('__plan.seule()'));
      const avant = path.join(dossier, base + '.avant.jpg'); if (!suf && fs.existsSync(avant)) ecrit(base + '.duo', await evalue('__plan.duo(' + JSON.stringify(fs.readFileSync(avant).toString('base64')) + ')'));
    } else for (let de = 0; de < total; de += 12) ecrit(base + (total > 12 ? '-' + (de / 12 + 1) : '') + suf, await evalue(`__plan.planche(${de}, ${rafale ? Math.min(rafale, 3) : 3})`));
    if (val('nom') && plans.length === 1) { (noms[carte] ||= {})[val('nom')] = { idx: plans[0].idx, ...(plans[0].vue ? { vue: plans[0].vue } : {}) }; fs.writeFileSync(NOMS, JSON.stringify(noms, null, 1) + '\n'); console.log('plan nommé : ' + carte + ' ' + val('nom')); }
    if (erreurs.length) console.log('erreurs de la page : ' + [...new Set(erreurs)].slice(0, 5).join(' | '));
    console.log(((Date.now() - t0) / 1000).toFixed(1) + ' s'); await ferme(0);
  } catch (e) { console.log('ÉCHEC : ' + e.message.split('\n')[0] + (erreurs.length ? ' | ' + erreurs[0] : '')); await ferme(1); }
})();
