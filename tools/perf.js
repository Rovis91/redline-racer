// Performance bench. index.html?perf&auto: measures all maps in a row (the page reloads from one to the next), result in localStorage 'vpr.perf' and in the console.
// A single map: index.html?map=<id>&auto, then in the console: (await import('./tools/perf.js')).lapRun()
// The autopilot runs a lap in a race against 3 bots (the heaviest case), at a fixed step of 1/60 s. Each frame is timed (cpu), and each batch of 30 frames GPU included (ms).
// Reference to hold on all maps (see README, "Performance"): BUDGET below.
// Split screen: index.html?perf&auto&players=2 does the same measurement with both views drawn (both players on autopilot, 2 bots), result in 'vpr.perf2'. Its reference: budget(2).
export const BUDGET = { drawCalls: 300, ms: 3, msMax: 4.5, cpuMax: 8.3 }; // draw passes per frame (shadows included); ms per frame on average; in the worst batch of 30 frames; frame() ms for the worst frame (8.3 ms = 120 frames/s)
// the reference applies per view: with n views, n times the solo draw passes; the frame time, however, only has to stay under one frame at 120 Hz
export const budget = n => n > 1 ? { drawCalls: BUDGET.drawCalls * n, ms: BUDGET.cpuMax, msMax: BUDGET.cpuMax, cpuMax: BUDGET.cpuMax } : BUDGET;
const yieldNow = () => new Promise(r => { const c = new MessageChannel(); c.port1.onmessage = r; c.port2.postMessage(0); }); // a setTimeout would be throttled to 1 per second in the background

export async function lapRun({ images = 0 } = {}) {
  const g = window.__g, gl = g.renderer.getContext(), N = g.T.n, info = g.renderer.info;
  if (g.mode !== 'raceCase') throw new Error('switch to race mode in the menu');
  g.start(); info.autoReset = false;
  // nothing goes to the screen during the measurement: the final pass is drawn to an offscreen target of the same imgSize. Otherwise the browser locks drawing to the display
  // (8.3 ms exactly at 120 Hz) and, with the tab hidden, blocks it for hundreds of ms: we would measure the screen, not the game.
  const cv = g.renderer.domElement, outOf = new THREE.WebGLRenderTarget(cv.width, cv.height), outTarget = g.renderer.setRenderTarget.bind(g.renderer);
  // with two views, each final pass goes into its strip: the offscreen target takes over the screen's requested cut (three ignores it on a target), otherwise each view would repaint the whole image
  const nv = g.views.length, bandStrip = () => { const k = g.renderer.getPixelRatio(); g.renderer.getViewport(outOf.viewport).multiplyScalar(k); g.renderer.getScissor(outOf.scissor).multiplyScalar(k); outOf.scissorTest = g.renderer.getScissorTest(); };
  g.renderer.setRenderTarget = t => { if (!t && nv > 1) bandStrip(); outTarget(t || outOf); }; const px = new Uint8Array(4);
  let now = performance.now() + 1e7; const stepSec = 1000 / 60, BATCH = 30;
  const sync = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); // waits for the GPU to finish drawing everything; synced to the screen (8.3 ms at 120 Hz), so only once per batch
  // splits the rendering (three) and the sound out of each frame, to find where a hitch comes from
  const part = { graphics: 0, sound: 0 }, chrono = (o, k, n) => { const f = o[k]; o[k] = function () { const t = performance.now(); try { return f.apply(this, arguments); } finally { part[n] += performance.now() - t; } }; return () => { o[k] = f; }; };
  const unwrap = [chrono(g.renderer, 'render', 'graphics'), chrono(SOUND, 'frame', 'sound')], parts = [];
  const one = () => { info.reset(); part.graphics = part.sound = 0; const t = performance.now(); g.frame(now += stepSec); return performance.now() - t; };
  while (g.state !== 'race') one();
  for (let i = 0; i < 120; i++) one(); // warm-up: shaders compiled, textures uploaded
  sync();
  // cpu: frame() time frame by frame (the game and sending draw commands); batch: real time per frame over BATCH consecutive frames, GPU included
  const cpu = [], where = [], drawCalls = [], tris = [], batch = [], whereBatch = []; let ending = performance.now() + 12, t0 = performance.now();
  while (images ? cpu.length < images : g.car.dist < N + 20 && cpu.length < 20000) {
    const np = info.programs.length; cpu.push(one()); parts.push('rendu ' + part.graphics.toFixed(1) + ' son ' + part.sound.toFixed(1) + (info.programs.length > np ? ' shader ' + info.programs.slice(np).map(p => p.name).join('+') : '')); where.push(g.car.idx); drawCalls.push(info.render.calls); tris.push(info.render.triangles); // "shader": a program compiled in the middle of the measurement, that is the hitch
    if (cpu.length % BATCH === 0) { sync(); batch.push((performance.now() - t0) / BATCH); whereBatch.push(g.car.idx); if (performance.now() > ending) { await yieldNow(); ending = performance.now() + 12; } t0 = performance.now(); } // yields control between batches: the tab does not freeze
  }
  info.autoReset = true; g.renderer.setRenderTarget = outTarget; outOf.dispose(); unwrap.forEach(f => f());
  const avg = a => a.reduce((s, v) => s + v, 0) / a.length, q = (a, p) => { const t = [...a].sort((x, y) => x - y); return +t[Math.min(t.length - 1, Math.floor(t.length * p))].toFixed(2); };
  const worstList = (a, o) => a.map((v, i) => [v, i]).sort((x, y) => y[0] - x[0]).slice(0, 4).map(([v, i]) => o[i] + ':' + v.toFixed(1)); // "track sample: ms" of the worst ones
  const sect = (a, o, k) => Array.from({ length: 10 }, (_, s) => { const l = a.filter((_, i) => Math.floor(o[i] * 10 / N) === s); return l.length ? +k(l).toFixed(1) : 0; }); // per tenth of track: where it costs
  const r = { mapDef: g.M.id, views: nv, images: cpu.length, ms: +avg(batch).toFixed(2), msMax: q(batch, 1), cpu: +avg(cpu).toFixed(2), cpu99: q(cpu, 0.99), cpuMax: q(cpu, 1),
    drawCalls: Math.round(avg(drawCalls)), drawCallsMax: Math.max(...drawCalls), tris: Math.round(avg(tris)), trisMax: Math.max(...tris),
    worstBatches: worstList(batch, whereBatch), worstCpu: cpu.map((v, i) => [v, i]).sort((x, y) => y[0] - x[0]).slice(0, 6).map(([v, i]) => where[i] + ':' + v.toFixed(1) + ' (' + parts[i] + ')'), sectMs: sect(batch, whereBatch, avg), sectCalls: sect(drawCalls, where, l => Math.max(...l)) };
  const B = budget(nv); r.ok = r.drawCallsMax <= B.drawCalls && r.ms <= B.ms && r.msMax <= B.msMax && r.cpuMax <= B.cpuMax;
  return r;
}

export async function runSuite() { // launched by ?perf: each map in turn; ?perf&solo&map=<id>: this map only
  const loadTest = Math.round(performance.now()), ids = MAPS.map(m => m.id), i = ids.indexOf(__g.M.id), Q = new URLSearchParams(location.search), onlyMap = Q.has('solo');
  // the number of views is always written in the address: without it the game would follow the menu preference, and the solo bench would run two-player for whoever last played two-player
  const n = Q.get('players') === '2' ? 2 : 1, d = n > 1 ? '2' : '', K = 'vpr.perf' + d, url = id => location.pathname + '?perf&auto&players=' + n + (onlyMap ? '&solo' : '') + '&map=' + id;
  if (!Q.get('map') || !Q.get('players') || __g.mode !== 'raceCase') { localStorage.setItem('vpr7.mode' + d, '"course"'); localStorage.removeItem(K); location.href = url(onlyMap && Q.get('map') || ids[0]); return; }
  const everything = onlyMap ? [] : JSON.parse(localStorage.getItem(K) || '[]'), r = await lapRun(); r.loading = loadTest; // loading: ms between opening the page and the game being ready
  everything.push(r); localStorage.setItem(K, JSON.stringify(everything));
  if (!onlyMap && i + 1 < ids.length) location.href = url(ids[i + 1]);
  else {
    console.table(everything.map(({ worstBatches, worstCpu, sectMs, sectCalls, ...t }) => t)); window.__perf = everything;
    const gl = __g.renderer.getContext(), e = gl.getExtension('WEBGL_debug_renderer_info'); // for tools/bench.js: the result, the reference and the graphics card that measured
    fetch('/captures/perf' + d + '.json', { method: 'POST', body: JSON.stringify({ budget: budget(n), gpu: e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : '?', results: everything }) }).catch(() => {}); // only tools/capture.py receives the upload
  }
}

// Memory across chaining maps without reloading, as in Tournée: index.html?auto, race mode, then in the console: (await import('./tools/perf.js')).chain()
// Each map in the list is loaded after the previous one (tours times the whole list), drives `images` frames in a race, then we record what the GPU holds (geometries, textures, shaders)
// and the JS heap (Chrome only; run with --js-flags=--expose-gc for a reading after garbage collection). Healthy: a map's figures are the same on the second pass as on the first.
// Two views: index.html?auto&players=2 (the number of players written in the address stays from one map to the next); the "vues" column says what was measured.
export async function chain({ lapCount = 2, images = 300 } = {}) {
  if (window.__g.mode !== 'raceCase') throw new Error('switch to race mode in the menu');
  const out = []; let now = performance.now() + 1e7;
  for (let k = 1; k <= lapCount; k++) for (const { id } of MAPS) {
    const av = window.__g; if (av.M.id !== id) { av.mapDef(id); while (window.__g === av) await yieldNow(); }
    const g = window.__g, i = g.renderer.info; g.start(); for (let n = 0; n < images; n++) { g.frame(now += 1000 / 60); if (n % 30 === 0) await yieldNow(); } // (the first frame frees the previous map)
    if (window.gc) window.gc();
    out.push({ lapRun: k, mapDef: id, views: g.views.length, geometries: i.memory.geometries, textures: i.memory.textures, shaders: i.programs.length, heapMb: performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1) : null });
  }
  console.table(out); return out;
}

// Check of the scenery merge (game.js, "fusion"): lists what moves or changes visibility during 15 s of racing among the simple meshes.
// Anything that shows up here, besides the sky, the car and opponents, must carry userData.dyn = 1 (itself or a parent), otherwise the merge would freeze it.
export function movables() {
  const g = window.__g, ms = []; g.scene.updateMatrixWorld(true);
  g.scene.traverse(o => { if (o.isMesh && !o.isInstancedMesh) ms.push([o, o.matrixWorld.clone(), o.visible]); });
  g.start(); let now = performance.now() + 1e7; for (let i = 0; i < 900; i++) g.frame(now += 16.7); g.scene.updateMatrixWorld(true);
  const dyn = o => { for (; o; o = o.parent) if (o.userData.dyn) return true; return false; }, top = o => { while (o.parent && o.parent !== g.scene) o = o.parent; return o; }, viewed = new Map();
  for (const [o, m, v] of ms) if ((!o.matrixWorld.equals(m) || o.visible !== v) && !dyn(o)) { const k = g.scene.children.indexOf(top(o)); viewed.set(k, (viewed.get(k) || 0) + 1); }
  return { mapDef: g.M.id, meshes: ms.length, unmarked: [...viewed].map(([k, n]) => ({ child: k, type: g.scene.children[k].type, meshes: n })) };
}

// Motion regularity on screen (judder), machine-independent: (await import('./tools/perf.js')).regularity({ hz: 144 })
// Frames given to frame() at the pace of a hz frames/s screen (jitter ±jitter ms, like real timestamps), racing on autopilot. Per frame, the camera movement
// is compared with the expected one (speed × frame duration): judder = average deviation in %, judderMax = 99th percentile. Without smoothing, at 144 Hz one frame in five does not advance (1/120 s step).
export const REGULARITY = { judder: 5, judderMax: 15 }; // %: average deviation of the camera movement from the expected one, and 99th percentile
export function regularity({ hz = 60, jitter = 0.3, images = 600 } = {}) {
  const g = window.__g; if (g.mode !== 'raceCase') throw new Error('switch to race mode in the menu');
  g.start(); let now = performance.now() + 1e7; while (g.state !== 'race') g.frame(now += 1000 / 60);
  for (let i = 0; i < 240; i++) g.frame(now += 1000 / 60); // launched
  const cam = g.views[0].cam, p = new THREE.Vector3(), q = new THREE.Vector3(), ec = []; let x = 0; // xorshift: same jitter from one pass to the next
  const chance = () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return (x >>> 0) / 4294967296; }; x = 12345;
  cam.getWorldPosition(p);
  for (let i = 0; i < images; i++) {
    const dt = 1000 / hz + (chance() * 2 - 1) * jitter; g.frame(now += dt); cam.getWorldPosition(q);
    const c = g.car, v = Math.hypot(c.vx, c.vz), att = v * dt / 1000;
    if (v > 15) ec.push(Math.abs(q.distanceTo(p) / att - 1)); p.copy(q);
  }
  const t = ec.sort((a, b) => a - b), avg = t.reduce((s, v) => s + v, 0) / t.length;
  return { mapDef: g.M.id, hz, images: t.length, judder: +(100 * avg).toFixed(1), judderMax: +(100 * t[Math.floor(t.length * 0.99)]).toFixed(1) };
}
