// Shots: the capture of a specific spot on a map in a few seconds, without driving there, with before/after.
// The car is placed 60 m before the spot and the autopilot finishes the trip: the race camera is in place, nothing else is simulated.
// A single Chrome, kept open and shared with tools/bench-quick.js (no window, graphics card); nothing is ever erased in captures/.
//   node tools/plan.js perse 14            → captures/plans/perse/14.jpg: shot 14 (the track is cut into 20 shots, 1 to 20, a twentieth each)
//   node tools/plan.js perse 3 4 14        → a board of the three shots (640 × 360 per view, 12 views at most per image): this is the one to hand over for reading
//   node tools/plan.js perse tour          → the 20 shots on two boards
//   node tools/plan.js perse @516          → at track sample 516      node tools/plan.js perse porte → a named shot from tools/plans.json
//   --before        stores the capture as the starting state (<nom>.before.jpg). The same command without --before, after the change, writes <nom>.jpg
//                  and <nom>.duo.jpg: before on the left, after on rightDir.
//   --view=90,12,4  inspection camera around the car (angle°, distance, height) instead of the race camera
//   --burst=6     6 frames in a row at the same spot (1/30 s apart), on a board: what ripples or flickers is only visible in motion; --step=15: 15 game frames (1/2 s) between two views, for what moves slowly (the car keeps driving)
//   --style=game    the game's real rendering (270 lines, with the interface) instead of the net rendering      --size=1920x1080   image size (960x540 by default)
//   --hud          keeps the game interface on the image (removed by default: it hides the corners of the scenery)
//   --name=porte    saves this shot (sample and view) under this name in tools/plans.json
// Variables: CHROME, PORT (derived from the path; a port already serving another copy of the game is skipped), DBG (9400). Close the kept Chrome: node tools/bench-quick.js --close
const { spawn } = require('child_process'), fs = require('fs'), path = require('path'), http = require('http'), os = require('os');
const REPO_ROOT = path.join(__dirname, '..'), DBG = +process.env.DBG || 9400; let PORT = +process.env.PORT || 8900 + [...REPO_ROOT].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) % 90, BASE = 'http://127.0.0.1:' + PORT + '/';
const CHROME = process.env.CHROME || ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome'].find(f => fs.existsSync(f));
const args = process.argv.slice(2), val = k => (args.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1], opt = k => args.includes('--' + k);
const ids = fs.readFileSync(path.join(REPO_ROOT, 'src', 'data', 'maps.js'), 'utf8').match(/\{ id: '(\w+)'/g).map(s => s.slice(7, -1)), [mapDef, ...requested] = args.filter(a => !a.startsWith('--'));
const LABELS = path.join(__dirname, 'plans.json'), labels = fs.existsSync(LABELS) ? JSON.parse(fs.readFileSync(LABELS, 'utf8')) : {};
const req = (u, m = 'GET') => new Promise((r, j) => { const q = http.request(u, { method: m }, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => r(d)); }); q.on('error', j); q.end(); });
const asleep = ms => new Promise(r => setTimeout(r, ms)), responds = async u => { try { await req(u); return true; } catch { return false; } };
const waitFor = async (u, n) => { for (let i = 0; i < n; i++) { if (await responds(u)) return true; await asleep(250); } return false; };
const ending = (code, msg) => { if (msg) console.log(msg); process.exit(code); };

// what runs in the game page
const PAGE = `(() => {
  const g = __g, T = g.T, n = T.n, R = g.renderer, views = [];
  requestAnimationFrame = () => 0; g.start(); let t = 1e7; while (g.state !== 'race') g.frame(t += 100);
  // sans interface : le jeu dessine son HUD dans un canevas perdu, celui que lit la passe finale reste vide
  if (!window.__planHud) for (const u of g.views) { u.hudC.getContext('2d').clearRect(0, 0, u.hudC.width, u.hudC.height); u.hg = document.createElement('canvas').getContext('2d'); }
  R.info.autoReset = false;
  const grab = fileName => { R.info.reset(); g.frame(t += 33); const cv = R.domElement, c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height; c.getContext('2d').drawImage(cv, 0, 0); views.push({ c, fileName }); };
  const image = c => c.toDataURL('image/jpeg', 0.85).slice(23);
  window.__plan = {
    // pose la voiture 30 échantillons (60 m) avant i, lancée dans l'axe, et laisse le pilote automatique arriver à i
    va(i, view, fileName, burstN, stepSec) {
      const c = g.car, i0 = ((i - 30) % n + n) % n, s = T.S[i0]; g.view = view || null;
      Object.assign(c, { x: s.x, y: s.y, z: s.z, th: Math.atan2(s.tz, s.tx), vx: s.tx * 22, vz: s.tz * 22, idx: i0, dist: i0, d: 0, yaw: 0, steer: 0, vy: 0, air: false, drift: false, slide: 0, hit: 0, stun: 0 });
      for (let k = 0; k < 300 && c.idx !== i && (i - c.idx + n) % n < 60; k++) g.frame(t += 100);
      for (let k = 0; k < (burstN || 1); k++) { for (let j = 1; k && j < (stepSec || 1); j++) g.frame(t += 33); grab(burstN ? fileName + ' +' + k : fileName); }
      return { idx: c.idx, kmh: Math.round(Math.hypot(c.vx, c.vz) * 3.6) };
    },
    onlyMap: () => image(views[0].c),
    board(de, cols) {
      const l = views.slice(de, de + 12), tw = 640, th = 360, c = document.createElement('canvas'), x = c.getContext('2d'); c.width = Math.min(cols, l.length) * tw; c.height = Math.ceil(l.length / cols) * th;
      l.forEach((u, k) => { const px = (k % cols) * tw, py = Math.floor(k / cols) * th; x.drawImage(u.c, px, py, tw, th); x.font = 'bold 20px monospace'; x.textAlign = 'center'; x.lineWidth = 4; x.strokeStyle = '#000'; x.fillStyle = '#ffe63c'; x.strokeText(u.fileName, px + tw * 0.42, py + 22); x.fillText(u.fileName, px + tw * 0.42, py + 22); }); // en haut au centre : les coins sont pris par le HUD
      return image(c);
    },
    async duo(before) {
      const im = new Image(); im.src = 'data:image/jpeg;base64,' + before; await im.decode();
      const b = views[0].c, c = document.createElement('canvas'), x = c.getContext('2d'); c.width = b.width * 2; c.height = b.height; x.drawImage(im, 0, 0, b.width, b.height); x.drawImage(b, b.width, 0);
      x.font = 'bold 22px monospace'; x.textAlign = 'center'; x.lineWidth = 4; x.strokeStyle = '#000'; x.fillStyle = '#ffe63c'; for (const [s, px] of [['AVANT', b.width * 0.42], ['APRES', b.width * 1.42]]) { x.strokeText(s, px, 26); x.fillText(s, px, 26); }
      return image(c);
    },
    views: () => views.length, n,
  };
  return n;
})()`;

(async () => {
  if (!ids.includes(mapDef) || !requested.length) ending(2, 'usage: node tools/plan.js <map> <shot…|tour|@sample|name> [--avant] [--vue=a,d,h] [--rafale=n] [--pas=n] [--style=game] [--hud] [--taille=LxH] [--nom=x]\nmaps: ' + ids.join(', ') + (labels[mapDef] ? '\nnamed shots from ' + mapDef + ' : ' + Object.keys(labels[mapDef]).join(', ') : ''));
  const serve = async () => { if (!(await responds(BASE + 'index.html'))) { spawn('python', [path.join('tools', 'capture.py'), String(PORT)], { cwd: REPO_ROOT, stdio: 'ignore', detached: true }).unref(); if (!(await waitFor(BASE + 'index.html', 40))) ending(2, 'FAIL: the server does not start on port ' + PORT); } };
  await serve();
  // The port derived from the path can collide with another worktree's (90 ports), and tools/plan.js is the same file in every copy: a copy is recognised by its maps too.
  // A port that serves another copy is skipped (the next free or matching one is taken), unless PORT was given.
  const sameCopy = async () => { for (const p of ['tools/plan.js', 'src/data/maps.js']) if ((await req(BASE + p).catch(() => '')).replace(/\r/g, '') !== fs.readFileSync(path.join(REPO_ROOT, p), 'utf8').replace(/\r/g, '')) return false; return true; };
  for (let k = 0; !(await sameCopy()); k++) {
    if (process.env.PORT || k > 20) ending(2, 'FAIL: the server on port ' + PORT + ' serves another copy of the game; pick another port (PORT=8995 node tools/plan.js …)');
    BASE = 'http://127.0.0.1:' + ++PORT + '/'; await serve();
  }
  if (!(await responds('http://127.0.0.1:' + DBG + '/json/version'))) {
    if (!CHROME) ending(2, 'FAIL: Chrome not found (CHROME variable)');
    // the same flags as tools/bench-quick.js: it is the same kept Chrome
    spawn(CHROME, ['--headless=new', '--window-size=1280,720', '--no-first-run', '--remote-debugging-port=' + DBG, '--user-data-dir=' + path.join(os.tmpdir(), 'vpr-bench-quick-' + DBG),
      '--ignore-gpu-blocklist', '--enable-gpu', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--disable-features=CalculateNativeWinOcclusion',
      '--autoplay-policy=no-user-gesture-required', '--mute-audio', 'about:blank'], { stdio: 'ignore', detached: true }).unref();
    if (!(await waitFor('http://127.0.0.1:' + DBG + '/json/version', 40))) ending(2, 'FAIL: Chrome does not respond');
  }
  const tab = JSON.parse(await req('http://127.0.0.1:' + DBG + '/json/new?about:blank', 'PUT')), ws = new WebSocket(tab.webSocketDebuggerUrl); let id = 0; const att = new Map(), errors = [];
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && att.has(m.id)) { att.get(m.id)(m); att.delete(m.id); }
    else if (m.method === 'Runtime.exceptionThrown') errors.push(((m.params.exceptionDetails.exception || {}).description || m.params.exceptionDetails.text || '').split('\n')[0]);
    else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map(a => a.value || a.description || '').join(' ').slice(0, 300)); };
  await new Promise(r => ws.onopen = r); const cmd = (method, params = {}) => new Promise(r => { const i = ++id; att.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const evalExpr = async (expr, ms = 120000) => { const r = await Promise.race([cmd('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }), asleep(ms).then(() => ({ timedOut: 1 }))]);
    if (r.timedOut) throw new Error('timeout'); const x = r.result; if (x.exceptionDetails) throw new Error((x.exceptionDetails.exception || {}).description || x.exceptionDetails.text); return x.result.value; };
  const closes = async code => { ws.close(); await req('http://127.0.0.1:' + DBG + '/json/close/' + tab.id).catch(() => { }); process.exit(code); };
  await cmd('Runtime.enable'); await cmd('Page.enable');
  const [lw, lh] = (val('size') || '960x540').split('x').map(Number), style = val('style') || 'net';
  await cmd('Emulation.setDeviceMetricsOverride', { width: lw, height: lh, deviceScaleFactor: 1, mobile: false });
  // loads the map and starts the race; a second attempt if a script was lost (the small local server sometimes drops one)
  const opens = async c => {
    for (let attempt = 0; attempt < 2; attempt++) {
      errors.length = 0; await cmd('Page.navigate', { url: BASE + 'index.html?auto&map=' + c + (style === 'game' ? '' : '&style=' + style) + '&v=' + Date.now() });
      for (let i = 0; i < 240; i++) { await asleep(250); if (await evalExpr('!!(window.__g && __g.M && __g.M.id === ' + JSON.stringify(c) + ')', 5000).catch(() => false)) return evalExpr('window.__planHud = ' + (opt('hud') || style === 'game') + '; ' + PAGE); if (errors.length && i > 8) break; }
    }
    throw new Error('the map does not load: ' + (errors[0] || 'délai'));
  };
  try {
    const t0 = Date.now(), n = await opens(mapDef), view = val('view') ? val('view').split(',').map(Number) : null, burstN = +val('burst') || 0, lapRun = requested[0] === 'lapRun';
    // a shot: its number (1 to 20), @sample, or a name from plans.json
    const plans = (lapRun ? Array.from({ length: 20 }, (_, k) => String(k + 1)) : requested).map(p => {
      const named = (labels[mapDef] || {})[p];
      if (named) return { label: p, idx: named.idx, view: view || named.view || null };
      if (/^@\d+$/.test(p)) return { label: p.slice(1), idx: +p.slice(1) % n, view };
      if (/^\d+$/.test(p) && +p >= 1 && +p <= 20) return { label: p, idx: Math.round((+p - 0.5) * n / 20) % n, view };
      throw new Error('plan inconnu : ' + p + ' (1 to 20, tour, @sample' + (labels[mapDef] ? ', ' + Object.keys(labels[mapDef]).join(', ') : '') + ')');
    });
    for (const p of plans) {
      const r = await evalExpr(`__plan.va(${p.idx}, ${JSON.stringify(p.view)}, ${JSON.stringify(p.label + ' @' + p.idx)}, ${burstN}, ${+val('step') || +val('gap') || 1})`);
      console.log(('plan ' + p.label).padEnd(14), ('sample ' + r.idx + '/' + n).padEnd(22), r.kmh + ' km/h');
    }
    const folder = path.join(REPO_ROOT, 'captures', 'plans', mapDef), suf = opt('before') ? '.before' : '', written = (label, b64) => { fs.mkdirSync(folder, { recursive: true }); const f = path.join(folder, label + '.jpg'); fs.writeFileSync(f, Buffer.from(b64, 'base64')); console.log(path.relative(REPO_ROOT, f).replace(/\\/g, '/')); };
    const total = await evalExpr('__plan.views()'), base = lapRun ? 'lapRun' : plans.map(p => p.label).join('-') + (burstN ? '-rafale' : '') + (view ? '-vue' : '');
    if (total === 1) {
      written(base + suf, await evalExpr('__plan.onlyMap()'));
      const before = path.join(folder, base + '.avant.jpg'); if (!suf && fs.existsSync(before)) written(base + '.duo', await evalExpr('__plan.duo(' + JSON.stringify(fs.readFileSync(before).toString('base64')) + ')'));
    } else for (let de = 0; de < total; de += 12) written(base + (total > 12 ? '-' + (de / 12 + 1) : '') + suf, await evalExpr(`__plan.board(${de}, ${burstN ? Math.min(burstN, 3) : 3})`));
    if (val('name') && plans.length === 1) { (labels[mapDef] ||= {})[val('name')] = { idx: plans[0].idx, ...(plans[0].view ? { view: plans[0].view } : {}) }; fs.writeFileSync(LABELS, JSON.stringify(labels, null, 1) + '\n'); console.log('named shot: ' + mapDef + ' ' + val('name')); }
    if (errors.length) console.log('page errors: ' + [...new Set(errors)].slice(0, 5).join(' | '));
    console.log(((Date.now() - t0) / 1000).toFixed(1) + ' s'); await closes(0);
  } catch (e) { console.log('FAIL: ' + e.message.split('\n')[0] + (errors.length ? ' | ' + errors[0] : '')); await closes(1); }
})();
