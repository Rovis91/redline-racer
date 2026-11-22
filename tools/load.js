// Loading bench: the game as a player opens it on GitHub Pages, empty cache, throttled network.
//   node tools/load.js            → index.html (home, default map)
//   node tools/load.js paris      → index.html?map=paris
//   --all: each map          --detail: the 15 largest files          --profile: the functions that take the loading time (first visit)
// Like GitHub Pages: built-in server that gzips text (js, html, json, svg, css) and answers Cache-Control: max-age=600.
// A fresh windowless Chrome per measurement (empty profile = empty cache), network BUDGET.network, CPU slowed BUDGET.cpu times (modest laptop).
// Two passes: first visit (empty cache), then next visit (cache kept, within GitHub Pages' 10 minutes).
// Exit code 0 = within budget, 1 = over budget, 2 = the measurement did not run. Results: captures/load.json. Variables: CHROME, PORT (8871), DBG (9410).
const { spawn } = require('child_process'), fs = require('fs'), path = require('path'), http = require('http'), os = require('os'), zlib = require('zlib');
const REPO_ROOT = path.join(__dirname, '..'), PORT = +process.env.PORT || 8871, DBG = +process.env.DBG || 9410;
const CHROME = process.env.CHROME || ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome'].find(f => fs.existsSync(f));
// The GitHub Pages scoring (docs/ARCHITECTURE.md "Performance"): decent 4G network, modest laptop
const BUDGET = { network: { throughput: 10e6 / 8, latencyMs: 100 }, cpu: 2, bytes: 2.5e6, requestCount: 60, readyMs: 6000, nextMs: 3000 };
const args = process.argv.slice(2), opt = k => args.includes('--' + k);
const ids = fs.readFileSync(path.join(REPO_ROOT, 'src', 'data', 'maps.js'), 'utf8').match(/\{ id: '(\w+)'/g).map(s => s.slice(7, -1));
const mapDefs = opt('all') ? ids : [args.find(a => !a.startsWith('--')) || ''];
const asleep = ms => new Promise(r => setTimeout(r, ms));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wasm': 'application/wasm' };
const gz = new Map(); // file → gzip, computed once

const server = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]), f = path.join(REPO_ROOT, u === '/' ? 'index.html' : u);
  if (!f.startsWith(REPO_ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
  const ext = path.extname(f), st = fs.statSync(f), lm = st.mtime.toUTCString(), h = { 'Content-Type': TYPES[ext] || 'application/octet-stream', 'Cache-Control': 'max-age=600', 'Last-Modified': lm };
  if (q.headers['if-modified-since'] === lm) { r.writeHead(304, h); r.end(); return; }
  let payload = fs.readFileSync(f);
  if (/^(text|application\/json|image\/svg)/.test(h['Content-Type']) && /gzip/.test(q.headers['accept-encoding'] || '')) {
    const k = f + lm; if (!gz.has(k)) gz.set(k, zlib.gzipSync(payload, { level: 6 })); payload = gz.get(k); h['Content-Encoding'] = 'gzip';
  }
  r.writeHead(200, h); r.end(payload);
});

async function chrome(folder) {
  const p = spawn(CHROME, ['--headless=new', '--window-size=1280,720', '--no-first-run', '--remote-debugging-port=' + DBG, '--user-data-dir=' + folder, '--ignore-gpu-blocklist', '--enable-gpu', '--mute-audio', '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: 'ignore' });
  for (let i = 0; i < 40; i++) { try { const v = await (await fetch('http://127.0.0.1:' + DBG + '/json/list')).json(); const t = v.find(x => x.type === 'page'); if (t) return { p, t }; } catch { } await asleep(250); }
  p.kill(); throw new Error('Chrome does not respond');
}

async function measurement(mapDef) {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'vpr-charge-')), { p, t } = await chrome(folder), ws = new WebSocket(t.webSocketDebuggerUrl);
  let id = 0; const att = new Map(), files = new Map(), errors = [];
  ws.onmessage = e => { const m = JSON.parse(e.data);
    if (m.id && att.has(m.id)) { att.get(m.id)(m); att.delete(m.id); }
    else if (m.method === 'Network.responseReceived') files.set(m.params.requestId, { url: m.params.response.url.replace(/^.*?:\d+\//, ''), httpStatus: m.params.response.status, bytes: 0 });
    else if (m.method === 'Network.loadingFinished' && files.has(m.params.requestId)) files.get(m.params.requestId).bytes = m.params.encodedDataLength;
    else if (m.method === 'Runtime.exceptionThrown') errors.push((m.params.exceptionDetails.exception || {}).description || m.params.exceptionDetails.text);
    else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map(a => a.description || a.value || '').join(' ')); };
  await new Promise(r => ws.onopen = r);
  const cmd = (method, params = {}) => new Promise(r => { const i = ++id; att.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const evalExpr = async e => ((await cmd('Runtime.evaluate', { expression: e, returnByValue: true })).result.result || {}).value;
  await Promise.all(['Runtime.enable', 'Page.enable', 'Network.enable', 'Performance.enable'].map(m => cmd(m)));
  await cmd('Network.emulateNetworkConditions', { offline: false, latency: BUDGET.network.latencyMs, downloadThroughput: BUDGET.network.throughput, uploadThroughput: BUDGET.network.throughput / 4 });
  await cmd('Emulation.setCPUThrottlingRate', { rate: BUDGET.cpu });
  const url = 'http://127.0.0.1:' + PORT + '/index.html' + (mapDef ? '?map=' + mapDef : '');
  const pass = async () => {
    const profData = opt('profile') && !files.size; if (profData) { await cmd('Profiler.enable'); await cmd('Profiler.setSamplingInterval', { interval: 500 }); await cmd('Profiler.start'); }
    files.clear(); errors.length = 0; const t0 = Date.now(); await cmd('Page.navigate', { url }); let readyMs = 0;
    for (let i = 0; i < 1200 && !readyMs; i++) { await asleep(50); if (await evalExpr('!!(window.__g && window.__g.M) && (!window.GAME_LOADER || document.getElementById("loading").hidden)').catch(() => false)) readyMs = Date.now() - t0; if (errors.length) break; }
    const nav = await evalExpr('JSON.stringify({ dcl: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart, firstPaint: Math.round(performance.getEntriesByName("first-contentful-paint")[0]?.startTime || 0) })');
    const m = Object.fromEntries((await cmd('Performance.getMetrics')).result.metrics.map(x => [x.name, x.value]));
    const f = [...files.values()];
    let hotList;
    if (profData) { // own time per function (samples), reported to its file and line
      const { nodes, samples, timeDeltas } = (await cmd('Profiler.stop')).result.profile, byId = new Map(nodes.map(n => [n.id, n])), t = new Map();
      samples.forEach((id, i) => { const c = byId.get(id).callFrame, k = (c.functionName || '(anonyme)') + ' ' + c.url.replace(/^.*?:\d+\//, '') + ':' + (c.lineNumber + 1); t.set(k, (t.get(k) || 0) + timeDeltas[i] / 1000); });
      hotList = [...t].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, ms]) => Math.round(ms) + ' ms  ' + k);
    }
    return { readyMs, ...JSON.parse(nav || '{}'), bytes: f.reduce((s, x) => s + x.bytes, 0), requestCount: f.length, script: Math.round(m.ScriptDuration * 1000), heap: Math.round(m.JSHeapUsedSize / 1e6), files: f.sort((a, b) => b.bytes - a.bytes), errors: [...errors], hotList };
  };
  try { const a = await pass(), b = await pass(); return { mapDef: mapDef || '(accueil)', firstVisit: a, nextVisit: b }; }
  finally { ws.close(); p.kill(); await asleep(300); try { fs.rmSync(folder, { recursive: true, force: true }); } catch { } }
}

(async () => {
  if (!CHROME) { console.log('FAIL: Chrome not found (CHROME variable)'); process.exit(2); }
  await new Promise((ok, reject) => server.listen(PORT, '127.0.0.1', ok).on('error', reject)).catch(e => { console.log('FAIL: port ' + PORT + ' pris (' + e.code + ') ; PORT=8872 node tools/load.js'); process.exit(2); });
  const B = BUDGET, mo = o => (o / 1e6).toFixed(2) + ' Mo', s = ms => (ms / 1000).toFixed(1) + ' s', x = (v, max) => v > max ? '✗' : '';
  console.log(`scoring: ${B.network.throughput * 8 / 1e6} Mbit/s, ${B.network.latencyMs} ms, processeur ÷${B.cpu} — ≤ ${mo(B.bytes)}, ≤ ${B.requestCount} requests, ready ≤ ${s(B.readyMs)}, visite suivante ≤ ${s(B.nextMs)}\n`);
  const everything = []; let ok = 0;
  for (const c of mapDefs) {
    try {
      const r = await measurement(c), a = r.firstVisit, b = r.nextVisit; everything.push(r);
      const good = a.readyMs && b.readyMs && a.bytes <= B.bytes && a.requestCount <= B.requestCount && a.readyMs <= B.readyMs && b.readyMs <= B.nextMs && !a.errors.length; ok += good;
      console.log(r.mapDef.padEnd(10), (good ? 'SUCCESS' : 'FAILED').padEnd(7), `${mo(a.bytes)}${x(a.bytes, B.bytes)}  ${a.requestCount} req${x(a.requestCount, B.requestCount)}  scripts lus ${s(a.dcl)}  ready ${a.readyMs ? s(a.readyMs) : '—'}${x(a.readyMs || 1e9, B.readyMs)}  script ${s(a.script)}  | next: ready ${b.readyMs ? s(b.readyMs) : '—'}${x(b.readyMs || 1e9, B.nextMs)}, ${mo(b.bytes)}`);
      if (a.errors.length) console.log(''.padEnd(18), 'error:', a.errors[0].split('\n')[0]);
      if (a.hotList) for (const l of a.hotList) console.log(''.padEnd(18), l);
      if (opt('detail')) for (const f of a.files.slice(0, 15)) console.log(''.padEnd(18), (f.bytes / 1e3).toFixed(0).padStart(6) + ' ko', f.url);
    } catch (e) { console.log((c || '(accueil)').padEnd(10), 'NO RESULT:', e.message); everything.push({ mapDef: c, errorMsg: e.message }); }
  }
  fs.mkdirSync(path.join(REPO_ROOT, 'captures'), { recursive: true }); fs.writeFileSync(path.join(REPO_ROOT, 'captures', 'load.json'), JSON.stringify(everything, null, 1));
  server.close(); process.exit(ok === mapDefs.length ? 0 : everything.some(r => r.errorMsg) ? 2 : 1);
})();
