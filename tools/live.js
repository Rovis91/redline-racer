// Real-game probe: what the player gets. A visible Chrome window, sound playing, real time (the game's own requestAnimationFrame loop), autopilot race.
//   node tools/live.js ville piliers area51   → one race (3 laps against 3 rivals) per map, one after the other in the same window
//   --light: no GC trace and one sample every 5 s (checks that the probe itself does not cause hitches)
//   --cpu: CPU profile of the main thread; for each stretch of 40 ms or more without idle, the functions that ran (file:line)
//   --players=2: split screen      --chain[=s]: then every map in a row without reloading, s seconds of racing each (default 20), twice (saturation over map switches)
// Per map: intervals between displayed frames (p99 and worst against 16.7 and 25 ms), game work per frame, long tasks, GC pauses (trace), JS heap,
// live audio nodes (created minus destroyed, DevTools WebAudio domain), sound dropouts (AudioContext.playbackStats underruns) and audio clock stalls.
// Verdict per map against the player's target (BUDGET of tools/perf.js): 99% of frame intervals ≤ 16.7 ms, none above 25 ms, no dropout, no stall.
// The machine must stay awake and the window on screen: a screen that turns off stops both the frames and the audio clock.
// Results: captures/live.json. Variables: CHROME, PORT (8851, tools/capture.py server, shared with bench-quick.js), DBG (9420).
const { spawn } = require('child_process'), fs = require('fs'), path = require('path'), http = require('http'), os = require('os');
const REPO_ROOT = path.join(__dirname, '..'), PORT = +process.env.PORT || 8851, DBG = +process.env.DBG || 9420, BASE = 'http://127.0.0.1:' + PORT + '/index.html';
const CHROME = process.env.CHROME || ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome'].find(f => fs.existsSync(f));
const args = process.argv.slice(2), LIGHT = args.includes('--light'), CPU = args.includes('--cpu'), J = args.includes('--players=2') ? 2 : 1, chainArg = args.find(a => a.startsWith('--chain')), CHAIN = chainArg ? +(chainArg.split('=')[1] || 20) : 0;
const ids = fs.readFileSync(path.join(REPO_ROOT, 'src', 'data', 'maps.js'), 'utf8').match(/\{ id: '(\w+)'/g).map(s => s.slice(7, -1)), maps = args.filter(a => !a.startsWith('--'));
const req = u => new Promise((r, j) => { http.get(u, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => r(d)); }).on('error', j); });
const asleep = ms => new Promise(r => setTimeout(r, ms)), responds = async u => { try { await req(u); return true; } catch { return false; } };
const load = () => { const c = os.cpus(); return [c.reduce((s, x) => s + x.times.idle, 0), c.reduce((s, x) => s + Object.values(x.times).reduce((a, b) => a + b, 0), 0)]; };
const pct = (a, b) => Math.round(100 * (1 - (b[0] - a[0]) / (b[1] - a[1])));
// in the page, before the game: every animation frame is stamped (timestamp, work time, car sample), long tasks are kept
const PROBE = `(() => { const L = window.__live = { f: [], lt: [] }, raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = cb => raf(ts => { const a = performance.now(); try { cb(ts); } finally { const g = window.__g, l = L.f[L.f.length - 1]; if (l && l[0] === ts) l[1] += performance.now() - a; else L.f.push([ts, performance.now() - a, g && g.car ? g.car.idx : -1]); } });
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) L.lt.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ type: 'longtask' }); } catch (e) { } })();`;

(async () => {
  const unknown = maps.filter(c => !ids.includes(c)); if (unknown.length || !maps.length && !CHAIN) { console.log('maps: ' + ids.join(', ')); process.exit(2); }
  if (!(await responds(BASE))) { spawn('python', [path.join('tools', 'capture.py'), String(PORT)], { cwd: REPO_ROOT, stdio: 'ignore', detached: true }).unref(); for (let i = 0; i < 40 && !(await responds(BASE)); i++) await asleep(250); }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vpr-live-'));
  // a real window on screen, sound on; only the occlusion flags, so a window passing over it does not freeze the game
  const ch = spawn(CHROME, ['--window-position=40,40', '--window-size=1280,760', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=' + DBG, '--user-data-dir=' + dir, '--autoplay-policy=no-user-gesture-required',
    '--disable-backgrounding-occluded-windows', '--disable-features=CalculateNativeWinOcclusion', '--enable-blink-features=AudioContextPlaybackStats', 'about:blank'], { stdio: 'ignore' });
  let tab; for (let i = 0; i < 40 && !tab; i++) { await asleep(250); try { tab = JSON.parse(await req('http://127.0.0.1:' + DBG + '/json/list')).find(x => x.type === 'page'); } catch { } }
  const ws = new WebSocket(tab.webSocketDebuggerUrl); let id = 0; const wait = new Map(), on = {};
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && wait.has(m.id)) { wait.get(m.id)(m); wait.delete(m.id); } else if (on[m.method]) on[m.method](m.params); };
  await new Promise(r => ws.onopen = r); const cmd = (method, params = {}) => new Promise(r => { const i = ++id; wait.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async x => { const r = await cmd('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.text + ' ' + ((r.result.exceptionDetails.exception || {}).description || '')); return r.result.result.value; };
  // audio nodes: the WebAudio domain reports each node created and each node destroyed (garbage collected)
  const nodes = new Map(); let ctxId = null;
  on['WebAudio.contextCreated'] = p => { if (p.context.contextType === 'realtime') { ctxId = p.context.contextId; nodes.set(ctxId, 0); } };
  on['WebAudio.contextWillBeDestroyed'] = p => nodes.delete(p.contextId);
  on['WebAudio.audioNodeCreated'] = p => nodes.set(p.node.contextId, (nodes.get(p.node.contextId) || 0) + 1);
  on['WebAudio.audioNodeWillBeDestroyed'] = p => nodes.set(p.contextId, (nodes.get(p.contextId) || 0) - 1);
  const liveNodes = () => [...nodes.values()].reduce((s, v) => s + v, 0);
  // GC pauses: V8 trace events on the main thread
  let trace = [], traceDone = null; on['Tracing.dataCollected'] = p => { for (const e of p.value) if (e.ph === 'X' && /^(V8\.GC|MinorGC|MajorGC|V8\.GC_)/.test(e.name) && e.dur) trace.push([e.ts / 1000, e.dur / 1000, e.name]); }; on['Tracing.tracingComplete'] = () => traceDone && traceDone();
  await cmd('Runtime.enable'); await cmd('Page.enable'); await cmd('WebAudio.enable');
  await cmd('Page.addScriptToEvaluateOnNewDocument', { source: `try { localStorage.setItem('vpr7.mode${J > 1 ? 2 : ''}', '"raceCase"'); } catch (e) { }` + PROBE });
  await cmd('Page.bringToFront');
  const q = (a, p) => { const t = [...a].sort((x, y) => x - y); return t.length ? +t[Math.min(t.length - 1, Math.floor(t.length * p))].toFixed(1) : 0; };
  // samples every 500 ms while a race runs: audio thread, audio clock against the wall clock, heap, nodes
  const sampling = async (until, tag) => {
    const s = []; let a0 = null;
    while (!(await until())) {
      const t = Date.now(), rt = ctxId != null ? (await cmd('WebAudio.getRealtimeData', { contextId: ctxId })).result : null, h = (await cmd('Runtime.getHeapUsage')).result, idx = await ev('__g.car ? __g.car.idx : -1').catch(() => -1), ps = await stats().catch(() => null);
      const d = rt && rt.realtimeData; s.push({ t, idx, ur: ps ? ps.underrunEvents : null, ac: d ? d.currentTime : null, heap: h.usedSize / 1048576, nodes: liveNodes() });
      await asleep(LIGHT ? 5000 : 500); if (Date.now() - (a0 = a0 || t) > 420000) { console.log(tag + ': race stopped at 7 min'); break; }
    }
    return s;
  };
  const summary = (tag, s, f, lt, gc, ps0, ps1, cpu) => {
    const iv = []; for (let i = 1; i < f.length; i++) iv.push(f[i][0] - f[i - 1][0]);
    const worst = iv.map((v, i) => [v, f[i + 1][2], f[i + 1][1]]).sort((a, b) => b[0] - a[0]).slice(0, 5).map(([v, x, w]) => x + ':' + v.toFixed(0) + 'ms(work ' + w.toFixed(1) + ')');
    const stalls = []; for (let i = 1; i < s.length; i++) if (s[i].ac != null && s[i - 1].ac != null) { const r = (s[i].ac - s[i - 1].ac) / ((s[i].t - s[i - 1].t) / 1000); if (r < 0.9) stalls.push(+r.toFixed(2)); }
    const heap = s.map(x => x.heap), nd = s.map(x => x.nodes);
    const r = { map: tag, frames: f.length, seconds: f.length ? +((f[f.length - 1][0] - f[0][0]) / 1000).toFixed(1) : 0, p50: q(iv, 0.5), p99: q(iv, 0.99), max: q(iv, 1), over16: iv.filter(v => v > 16.7 * 1.25).length, over25: iv.filter(v => v > 25).length,
      work99: q(f.map(x => x[1]), 0.99), workMax: q(f.map(x => x[1]), 1), worst, longTasks: lt.length, longMax: lt.reduce((m, x) => Math.max(m, x[1]), 0),
      gc: gc.length, gcMs: +gc.reduce((t, x) => t + x[1], 0).toFixed(1), gcMax: +gc.reduce((m, x) => Math.max(m, x[1]), 0).toFixed(1), gcOver4: gc.filter(x => x[1] > 4).length,
      audioStalls: stalls,
      underruns: ps1 && ps0 ? { events: (ps1.underrunEvents || 0) - (ps0.underrunEvents || 0), ms: +(((ps1.underrunDuration || 0) - (ps0.underrunDuration || 0)) * 1000).toFixed(1) } : null,
      heap0: +(heap[0] || 0).toFixed(1), heap1: +(heap[heap.length - 1] || 0).toFixed(1), heapMax: +Math.max(0, ...heap).toFixed(1), nodes0: nd[0], nodes1: nd[nd.length - 1], nodesMax: Math.max(0, ...nd), cpuLoad: cpu, series: s.map(x => [x.idx, x.ur, x.ac == null ? null : +x.ac.toFixed(1), x.nodes, +x.heap.toFixed(1)]) };
    r.ok = r.p99 <= 16.7 && r.max <= 25 && !stalls.length && !(r.underruns && r.underruns.events);
    console.log(tag.padEnd(10), (r.ok ? 'PASS' : 'FAIL').padEnd(5), 'p99 ' + r.p99 + ' max ' + r.max + ' ms, >20.8 ' + r.over16 + ', >25 ' + r.over25 + '/' + r.frames + ' | work p99 ' + r.work99 + ' max ' + r.workMax + ' | long ' + r.longTasks + ' (max ' + r.longMax + ') | GC ' + r.gc + ' ' + r.gcMs + ' ms max ' + r.gcMax +
      ' | audio stalls ' + stalls.length + (r.underruns ? ' underruns ' + r.underruns.events + ' (' + r.underruns.ms + ' ms)' : '') + ' | heap ' + r.heap0 + '→' + r.heap1 + ' MB | nodes ' + r.nodes0 + '→' + r.nodes1 + ' (max ' + r.nodesMax + ') | load ' + cpu + '%');
    console.log(''.padEnd(10), 'worst: ' + worst.join(' · ')); return r;
  };
  const stats = () => ev('(() => { const a = window.__g && __g.ac; const p = a && a.playbackStats; return p ? JSON.parse(JSON.stringify(p.toJSON ? p.toJSON() : p)) : null; })()');
  const record = async (tag, until) => {
    await ev('__live.f.length = 0, __live.lt.length = 0'); trace = []; if (!LIGHT) await cmd('Tracing.start', { categories: 'v8,disabled-by-default-v8.gc', options: 'record-continuously' });
    if (CPU) { await cmd('Profiler.enable'); await cmd('Profiler.setSamplingInterval', { interval: 250 }); await cmd('Profiler.start'); }
    const ps0 = await stats().catch(() => null), c0 = load(), s = await sampling(until, tag), c1 = load(), ps1 = await stats().catch(() => null);
    const prof = CPU ? (await cmd('Profiler.stop')).result.profile : null;
    if (!LIGHT) await new Promise(r => { traceDone = r; cmd('Tracing.end'); }); const L = await ev('__live'); if (prof) busy(prof);
    // GC events come in trace microseconds (monotonic clock, same origin as performance.now in Chrome); we keep those inside the race
    const t0 = L.f.length ? L.f[0][0] : 0;
    return summary(tag, s, L.f.slice(120), L.lt.filter(x => x[0] > t0 + 2000), trace, ps0, ps1, pct(c0, c1));
  };
  // long stretches without idle in the profile: what ran in them, by own time and by the outermost game function
  const busy = P => {
    const byId = new Map(P.nodes.map(n => [n.id, n])), parent = new Map(); for (const n of P.nodes) for (const c of n.children || []) parent.set(c, n.id);
    const fr = n => (n.callFrame.functionName || '(anon)') + ' ' + n.callFrame.url.replace(/^.*\/(?=[^/]+$)/, '') + ':' + (n.callFrame.lineNumber + 1);
    const idle = n => /^\((idle|program)\)$/.test(n.callFrame.functionName);
    let t = P.startTime, run = []; const runs = [];
    for (let i = 0; i < P.samples.length; i++) { t += P.timeDeltas[i]; const n = byId.get(P.samples[i]); if (idle(n)) { if (run.length && (run[run.length - 1][0] - run[0][0]) > 40000) runs.push(run); run = []; } else run.push([t, n]); }
    for (const r of runs.sort((a, b) => (b[b.length - 1][0] - b[0][0]) - (a[a.length - 1][0] - a[0][0])).slice(0, 4)) {
      const self = new Map(), outer = new Map();
      for (const [, n] of r) { self.set(fr(n), (self.get(fr(n)) || 0) + 1); let o = null; for (let k = n.id; k != null; k = parent.get(k)) { const x = byId.get(k); if (/\/src\//.test(x.callFrame.url)) o = x; } const ko = o ? fr(o) : '(no game code)'; outer.set(ko, (outer.get(ko) || 0) + 1); }
      const top = m => [...m].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => k + ' ' + Math.round(100 * v / r.length) + '%').join(' | ');
      console.log('  busy ' + ((r[r.length - 1][0] - r[0][0]) / 1000).toFixed(0) + ' ms · self: ' + top(self) + '\n      outer: ' + top(outer));
    }
  };
  const out = [];
  for (const m of maps) {
    await cmd('Page.navigate', { url: BASE + '?auto&players=' + J + '&map=' + m });
    for (let i = 0; i < 240 && !(await ev('!!(window.__g && __g.M && __g.M.id === ' + JSON.stringify(m) + ')').catch(() => false)); i++) await asleep(250);
    await asleep(1500); await ev('__g.start()');
    out.push(await record(m, () => ev('!!(__g.race && __g.race.done) || __g.state !== "race" && __g.state !== "count"').catch(() => true)));
  }
  if (CHAIN) { // every map without reloading, as in Tournée; each switch is part of the measurement (the player sees it)
    if (!maps.length) { await cmd('Page.navigate', { url: BASE + '?auto&players=' + J + '&map=' + ids[0] }); for (let i = 0; i < 240 && !(await ev('!!(window.__g && __g.M)').catch(() => false)); i++) await asleep(250); await asleep(1500); }
    for (let k = 1; k <= 2; k++) for (const m of ids) {
      await ev(`(async () => { const av = __g; if (av.M.id !== ${JSON.stringify(m)}) { av.mapDef(${JSON.stringify(m)}); while (window.__g === av) await new Promise(r => setTimeout(r, 50)); } __g.start(); })()`);
      const end = Date.now() + CHAIN * 1000; out.push(await record('chain' + k + ':' + m, async () => Date.now() > end));
    }
  }
  fs.mkdirSync(path.join(REPO_ROOT, 'captures'), { recursive: true }); fs.writeFileSync(path.join(REPO_ROOT, 'captures', 'live' + (J > 1 ? '2' : '') + '.json'), JSON.stringify(out, null, 1));
  ws.close(); ch.kill(); process.exit(0);
})();
