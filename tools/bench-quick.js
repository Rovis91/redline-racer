// Quick bench: a single Chrome, launched on the first call then kept open (no window, sound muted but computed), driven by the debugging protocol.
//   node tools/bench-quick.js                 → verdict on all maps: the measurement from tools/perf.js (lapRun()), against BUDGET, unchanged
//   node tools/bench-quick.js paris canal     → these maps
//   node tools/bench-quick.js --profile touge  → verdict, then profile (tools/profReport.js): per pass, per twentieth of track, per scenery object, worst frames, sound.
//                                                 Writes captures/profil-<carte>.json and compares with the map's previous profile (captures/profil-<carte>.prevRun.json).
//   --regularity: adds motion regularity (judder) at 60, 120 and 144 Hz, regularity() from tools/perf.js, against REGULARITY (machine-independent)
//   --players=2: split screen (budget(2))      --window: Chrome with a window off-screen instead of windowless      --close: closes the kept Chrome, then exits
// Noise: a shared machine skews timings (not draw passes nor vertices). A failing map is measured once more: PASS, FAIL (twice), or UNSTABLE (one time in two),
// with the machine's load during the measurement. Above 40% load, milliseconds are not reliable.
// Exit code 0 = everything passes. Variables: OPT (map options to try, JSON merged into the map: docs/methods/MAP-ENGINE-OPTIONS.md), CHROME, PORT (8851, tools/capture.py server), DBG (9400, debugging port of the kept Chrome).
const { spawn } = require('child_process'), fs = require('fs'), path = require('path'), http = require('http'), os = require('os');
const REPO_ROOT = path.join(__dirname, '..'), PORT = +process.env.PORT || 8851, DBG = +process.env.DBG || 9400, BASE = 'http://127.0.0.1:' + PORT + '/index.html';
const CHROME = process.env.CHROME || ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome'].find(f => fs.existsSync(f));
const args = process.argv.slice(2), opt = k => args.includes('--' + k), PROFILE = opt('profile'), REG = opt('regularity'), J = opt('players=2') ? 2 : 1;
const ids = fs.readFileSync(path.join(REPO_ROOT, 'src', 'data', 'maps.js'), 'utf8').match(/\{ id: '(\w+)'/g).map(s => s.slice(7, -1)), wantedList = args.filter(a => !a.startsWith('--')), mapDefs = wantedList.length ? wantedList : ids;
const req = (u, m = 'GET') => new Promise((r, j) => { const q = http.request(u, { method: m }, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => r(d)); }); q.on('error', j); q.end(); });
const asleep = ms => new Promise(r => setTimeout(r, ms)), responds = async u => { try { await req(u); return true; } catch { return false; } };
const waitFor = async (u, n) => { for (let i = 0; i < n; i++) { if (await responds(u)) return true; await asleep(250); } return false; };
const loadTest = () => { const c = os.cpus(); return [c.reduce((s, x) => s + x.times.idle, 0), c.reduce((s, x) => s + Object.values(x.times).reduce((a, b) => a + b, 0), 0)]; };
const pct = (a, b) => Math.round(100 * (1 - (b[0] - a[0]) / (b[1] - a[1])));
const exitAt = n => path.join(REPO_ROOT, 'captures', n);

(async () => {
  if (opt('close')) { try { const v = JSON.parse(await req('http://127.0.0.1:' + DBG + '/json/version')), ws = new WebSocket(v.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r); ws.send(JSON.stringify({ id: 1, method: 'Browser.close' })); await asleep(300); } catch { } process.exit(0); }
  const unknowns = mapDefs.filter(c => !ids.includes(c)); if (unknowns.length) { console.log('unknown map: ' + unknowns.join(', ') + ' (maps: ' + ids.join(', ') + ')'); process.exit(2); }
  if (!(await responds(BASE))) { spawn('python', [path.join('tools', 'capture.py'), String(PORT)], { cwd: REPO_ROOT, stdio: 'ignore', detached: true }).unref(); if (!(await waitFor(BASE, 40))) { console.log('FAIL: the server does not start on port ' + PORT); process.exit(2); } }
  // a server from another copy of the game (another worktree) may hold this port: we would measure its version
  if ((await req(BASE.replace('index.html', 'tools/bench-quick.js')).catch(() => '')).replace(/\r/g, '') !== fs.readFileSync(__filename, 'utf8').replace(/\r/g, '')) { console.log('FAIL: the server on port ' + PORT + ' serves another copy of the game; pick another port (PORT=8862 node tools/bench-quick.js …)'); process.exit(2); }
  if (!(await responds('http://127.0.0.1:' + DBG + '/json/version'))) {
    if (!CHROME) { console.log('FAIL: Chrome not found (CHROME variable)'); process.exit(2); }
    // no window (--headless=new): same GPU (ANGLE D3D11), nothing opens on screen; the flags stop Chrome from slowing a tab it believes is hidden
    spawn(CHROME, [opt('window') ? '--window-position=-2600,0' : '--headless=new', '--window-size=1280,720', '--no-first-run', '--remote-debugging-port=' + DBG, '--user-data-dir=' + path.join(os.tmpdir(), 'vpr-bench-quick-' + DBG),
      '--ignore-gpu-blocklist', '--enable-gpu', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--disable-features=CalculateNativeWinOcclusion',
      '--autoplay-policy=no-user-gesture-required', '--mute-audio', 'about:blank'], { stdio: 'ignore', detached: true }).unref();
    if (!(await waitFor('http://127.0.0.1:' + DBG + '/json/version', 40))) { console.log('FAIL: Chrome does not respond'); process.exit(2); }
  }
  const t = JSON.parse(await req('http://127.0.0.1:' + DBG + '/json/new?about:blank', 'PUT')), ws = new WebSocket(t.webSocketDebuggerUrl); let id = 0; const att = new Map(); let errors = [];
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && att.has(m.id)) { att.get(m.id)(m); att.delete(m.id); } else if (m.method === 'Runtime.exceptionThrown') errors.push(((m.params.exceptionDetails.exception || {}).description || m.params.exceptionDetails.text || '').split('\n')[0]); };
  await new Promise(r => ws.onopen = r); const cmd = (method, params = {}) => new Promise(r => { const i = ++id; att.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const evalExpr = async (expr, ms = 600000) => { const r = await Promise.race([cmd('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }), asleep(ms).then(() => ({ timedOut: 1 }))]);
    if (r.timedOut) throw new Error('timeout'); const x = r.result; if (x.exceptionDetails) throw new Error((x.exceptionDetails.exception || {}).description || x.exceptionDetails.text); return x.result.value; };
  await cmd('Runtime.enable'); await cmd('Page.enable');
  // race mode for the measurement, as in tools/perf.js (continued); the number of views is in the address
  await cmd('Page.addScriptToEvaluateOnNewDocument', { source: `try { localStorage.setItem('vpr7.mode${J > 1 ? 2 : ''}', '"course"'); } catch (e) {}` });
  const origins = fs.readFileSync(path.join(__dirname, 'origins.js'), 'utf8'); let hook = null;
  // loads the map, reloading once if a script was lost (the small local server sometimes drops one)
  const load1 = async (c, withOrigins) => {
    if (withOrigins && !hook) hook = (await cmd('Page.addScriptToEvaluateOnNewDocument', { source: origins })).result.identifier;
    if (!withOrigins && hook) { await cmd('Page.removeScriptToEvaluateOnNewDocument', { identifier: hook }); hook = null; }
    for (let attempt = 0; attempt < 2; attempt++) {
      errors = []; const t0 = Date.now(); await cmd('Page.navigate', { url: BASE + '?auto&players=' + J + '&map=' + c + (process.env.OPT ? '&opt=' + encodeURIComponent(process.env.OPT) : '') });
      for (let i = 0; i < 240; i++) { await asleep(250); if (await evalExpr('!!(window.__g && __g.M && __g.M.id === ' + JSON.stringify(c) + ')', 5000).catch(() => false)) return Date.now() - t0; if (errors.length && i > 8) break; }
    }
    throw new Error('the map does not load: ' + (errors[0] || 'timeout'));
  };
  const lapRun = async () => { const a = loadTest(); const r = await evalExpr('(async () => { const P = await import("./tools/perf.js"); const r = await P.lapRun(); r.B = P.budget(' + J + '); return r; })()'); r.loadTest = pct(a, loadTest()); return r; };
  const good = r => r.ms <= r.B.ms && r.cpuMax <= r.B.cpuMax; // the verdict of tools/bench.js: average and worst frame; the draw passes (drawCallsMax) are shown, marked ✗ above BUDGET.drawCalls
  const line = r => [(r.ms.toFixed(2) + ' ms' + (r.ms > r.B.ms ? '✗' : '')).padEnd(9), ('pire ' + r.cpuMax.toFixed(1) + (r.cpuMax > r.B.cpuMax ? '✗' : '')).padEnd(10), ('appels ' + r.drawCallsMax + (r.drawCallsMax > r.B.drawCalls ? '✗' : '')).padEnd(11), ('charge ' + r.loadTest + '%').padEnd(10)].join(' ');
  const everything = []; let ok = 0;
  for (const c of mapDefs) {
    let res;
    try {
      const loading = await load1(c, false), r1 = await lapRun(); let r2 = null; if (!good(r1)) r2 = await lapRun();
      const v = good(r1) ? 'SUCCESS' : r2 && good(r2) ? 'INSTABLE' : 'FAILED'; ok += v === 'SUCCESS';
      // is the hitch in the same place both times? (track sample within ±30): then it comes from the map, not the machine
      const spot = r => +r.worstCpu[0].split(':')[0], same = r2 && Math.abs(spot(r1) - spot(r2)) <= 30;
      console.log(c.padEnd(8), v.padEnd(9), line(r1) + (r2 ? '  | 2e : ' + line(r2) + (r1.cpuMax > r1.B.cpuMax && r2.cpuMax > r2.B.cpuMax ? (same ? ' hitch in the same place (' + spot(r1) + ')' : ' hitches in different places') : '') : ''), '  chargement ' + (loading / 1000).toFixed(1) + ' s');
      if (v !== 'SUCCESS') console.log(''.padEnd(18), 'pires images :', r1.worstCpu.slice(0, 3).join(' | '));
      res = { mapDef: c, verdict: v, loading, measures: [r1, r2].filter(Boolean) };
      if (REG) { // regularity counts in the verdict: a jerky map fails even if fast
        await load1(c, false); const rg = await evalExpr('(async () => { const P = await import("./tools/perf.js"); return { B: P.REGULARITY, r: [60, 120, 144].map(hz => P.regularity({ hz })) }; })()');
        const goodR = rg.r.every(x => x.judder <= rg.B.judder && x.judderMax <= rg.B.judderMax); if (!goodR && v === 'SUCCESS') { ok--; res.verdict = 'FAILED'; }
        console.log(''.padEnd(18), 'régularité', (goodR ? 'OK' : 'FAILED').padEnd(6), rg.r.map(x => x.hz + ' Hz ' + x.judder + ' % (pire ' + x.judderMax + ' %)' + (x.judder > rg.B.judder || x.judderMax > rg.B.judderMax ? '✗' : '')).join('  ')); res.regularity = rg.r;
      }
      if (PROFILE) {
        await load1(c, true); const a = loadTest(), p = await evalExpr('(async () => (await import("./tools/profile.js")).profReport())()'); p.loadTest = pct(a, loadTest());
        const f = exitAt('profil-' + c + '.json'), prevRun = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
        if (prevRun) fs.copyFileSync(f, exitAt('profil-' + c + '.prec.json')); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(p, null, 1));
        resume(p, prevRun); res.profReport = path.relative(REPO_ROOT, f);
      }
    } catch (e) { console.log(c.padEnd(8), 'NO RESULT:', e.message.split('\n')[0]); res = { mapDef: c, errorMsg: e.message }; }
    everything.push(res);
  }
  fs.mkdirSync(exitAt(''), { recursive: true }); fs.writeFileSync(exitAt('bench-quick' + (J > 1 ? '2' : '') + '.json'), JSON.stringify(everything, null, 1));
  console.log('\n' + ok + '/' + mapDefs.length + ' maps in the reference (kept Chrome open: node tools/bench-quick.js --close)'); ws.close(); await req('http://127.0.0.1:' + DBG + '/json/close/' + t.id).catch(() => { }); process.exit(ok === mapDefs.length ? 0 : 1);
})();

// profile read in a few lines; details are in the json file
function resume(p, prevRun) {
  const d = (k, v, f = 2) => prevRun && prevRun[k] != null ? ' (' + (v - prevRun[k] >= 0 ? '+' : '') + (v - prevRun[k]).toFixed(f) + ')' : '';
  console.log('  profil · cpu ' + p.cpu + d('cpu', p.cpu) + ' p99 ' + p.cpu99 + ' max ' + p.cpuMax + ' · GPU ' + p.gpu + d('gpu', p.gpu) + ' p99 ' + p.gpu99 + ' · appels ' + p.drawCalls + d('drawCalls', p.drawCalls, 0) + ' max ' + p.drawCallsMax + ' · charge ' + p.loadTest + '%' + (p.gpuTimer ? '' : ' · no GPU timer'));
  console.log('  passes · ' + Object.entries(p.byPass).map(([k, v]) => k + ' ' + v.drawCalls + ' app/' + v.ktris + 'kt/' + v.gpu + 'ms').join(' · '));
  const hotList = [...p.sections].sort((a, b) => b.gpu + b.cpu - a.gpu - a.cpu).slice(0, 3);
  console.log('  most expensive sections (track) · ' + hotList.map(s => s.idx + ' : cpu ' + s.cpu + ' GPU ' + s.gpu + ' appels ' + s.drawCalls + ' ' + s.ktris + 'kt').join(' · '));
  console.log('  objets (appels/image, k sommets/image) :'); for (const o of p.objects.slice(0, 8)) console.log('    ' + String(o.drawCalls).padStart(6) + '  ' + String(o.kverts).padStart(7) + 'k  ' + o.originName);
  console.log('  pires images · ' + p.worstList.slice(0, 4).map(f => f.cpu + ' ms @' + f.idx + ' (rendu ' + f.graphics + ', son ' + f.sound + (f.ev ? ', ' + f.ev : '') + ')').join(' · '));
  const a = p.sound.before, b = p.sound.later, cp = a && b ? Object.keys(b).filter(k => /underrun|fallback/i.test(k) && typeof b[k] === 'number').map(k => k + ' +' + +(b[k] - a[k]).toFixed(3)).join(' ') : 'statistiques indisponibles';
  console.log('  son · frame ' + p.sound.frame + ' p99 ' + p.sound.frame99 + ' max ' + p.sound.frameMax + ' ms · coupures : ' + cp);
  console.log('  scenery · ' + p.scenery.meshesMerged + ' fondus, ' + p.scenery.meshesSingle + ' seuls, ' + p.scenery.instances + ' instances, ' + p.scenery.kverts + 'k sommets, ' + p.scenery.shaders + ' shaders');
}
