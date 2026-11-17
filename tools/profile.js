// Profile of a map: where the frame time goes, and which scenery object costs it. Launched by tools/bench-quick.js --profile (see that file);
// by hand: index.html?auto&players=1&map=<id>, race mode, then in the console: (await import('./tools/profReport.js')).profReport()
// Same lap as tools/perf.js (autopilot against 3 bots, fixed step of 1/60 s, offscreen rendering), but measured differently:
//   · per pass (scene, static shadows, dynamic shadows, reflections, post): draw passes, triangles, GPU time (EXT_disjoint_timer_query_webgl2 timer);
//   · per twentieth of track: cpu and GPU time, draw passes — where it costs;
//   · per scenery object (one frame in `sampN`): draw passes and vertices, reported to the line of the map file that placed it (tools/origins.js, loaded at the top of the page);
//   · the worst frames with what happened in them (static shadows redone, shader compiled, texture uploaded, sound share);
//   · sound: SOUND.frame time, and the dropouts counted by the browser (AudioContext.playbackStats, Chrome).
// Draw passes and vertices do not depend on the machine's load: these are what gets compared from one version to another. Timings, however, vary.
const yieldNow = () => new Promise(r => { const c = new MessageChannel(); c.port1.onmessage = r; c.port2.postMessage(0); });
const PASSES = ['scene', 'ombre-fixe', 'ombre-dyn', 'reflections', 'post'];

export async function profReport({ sampN = 4, images = 0 } = {}) {
  const g = window.__g, R = g.renderer, gl = R.getContext(), N = g.T.n, info = R.info, ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  if (g.mode !== 'raceCase') throw new Error('switch to race mode in the menu');
  g.start(); info.autoReset = false;
  // offscreen rendering, as in tools/perf.js: otherwise we would measure the wait for the screen
  const cv = R.domElement, outOf = new THREE.WebGLRenderTarget(cv.width, cv.height), srt = R.setRenderTarget.bind(R); let rt = null;
  R.setRenderTarget = (t, f) => { rt = t; srt(t || outOf, f); };
  // pass in progress, according to what game.js draws (see shades() and refFace())
  const pass = (s, c) => s !== g.scene ? 'post' : rt && (rt.isWebGLCubeRenderTarget || rt.texture.name === 'reflections') ? 'reflections' : s.overrideMaterial ? 'ombre-dyn' : rt && rt.width === 1 ? 'ombre-fixe' : 'scene';
  let cur = 'post', fr = null; const att = []; // fr: the frame being recorded; att: GPU timers waiting for a result
  const rr = R.render.bind(R);
  R.render = (s, c) => {
    const p = pass(s, c), av = cur, c0 = info.render.calls, t0 = info.render.triangles, t = performance.now(); cur = p;
    let q = null; if (ext && fr) { q = gl.createQuery(); gl.beginQuery(ext.TIME_ELAPSED_EXT, q); }
    try { rr(s, c); } finally {
      if (q) { gl.endQuery(ext.TIME_ELAPSED_EXT); att.push([q, fr, p]); }
      cur = av; if (fr) { const P = fr.p[p]; P.drawCalls += info.render.calls - c0; P.tris += info.render.triangles - t0; P.cpu += performance.now() - t; }
    }
  };
  const readQ = () => { while (att.length && gl.getQueryParameter(att[0][0], gl.QUERY_RESULT_AVAILABLE)) { const [q, f, p] = att.shift(); if (!gl.getParameter(ext.GPU_DISJOINT_EXT)) f.p[p].gpu += gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6; else f.disjoint = 1; gl.deleteQuery(q); } };
  // per object: each draw pass reported to its origin (merged geometry: shared among its parts in proportion to vertices)
  const obj = new Map(), orig = o => { for (let p = o; p; p = p.parent) if (p.userData.originName) return p.userData.originName; return '?'; };
  const tally = (k, p, drawCalls, verts) => { let e = obj.get(k); if (!e) obj.set(k, e = { drawCalls: {}, verts: {} }); e.drawCalls[p] = (e.drawCalls[p] || 0) + drawCalls; e.verts[p] = (e.verts[p] || 0) + verts; };
  let sampling = false; const rbd = R.renderBufferDirect.bind(R);
  R.renderBufferDirect = (cam, sc, geo, mat, o, grp) => {
    if (sampling) {
      const n = (grp ? grp.count : (geo.index || geo.attributes.position).count) * (o.isInstancedMesh ? o.count : 1), src = o.userData.src;
      if (src) { const tot = src.reduce((s, x) => s + x[1], 0), parts = new Map(); for (const [k, v] of src) parts.set(k, (parts.get(k) || 0) + v);
        for (const [k, v] of parts) tally(k, cur, v / tot, n * v / tot); }
      else tally(orig(o) + (o.isInstancedMesh ? ' (instances)' : ''), cur, 1, n);
    }
    rbd(cam, sc, geo, mat, o, grp);
  };
  const sf = SOUND.frame; let sound = 0; SOUND.frame = function () { const t = performance.now(); try { return sf.apply(this, arguments); } finally { sound += performance.now() - t; } };
  const ac = window.__ac, stats = () => ac && ac.playbackStats ? JSON.parse(JSON.stringify(ac.playbackStats.toJSON ? ac.playbackStats.toJSON() : ac.playbackStats)) : null;

  let now = performance.now() + 1e7; const stepSec = 1000 / 60;
  while (g.state !== 'race') g.frame(now += stepSec);
  for (let i = 0; i < 120; i++) g.frame(now += stepSec); // warm-up: shaders compiled, textures uploaded
  const im = [], stats0 = stats(), t00 = performance.now(); let ending = performance.now() + 12, k = 0;
  while (images ? im.length < images : g.car.dist < N + 20 && im.length < 20000) {
    const p = {}; for (const n of PASSES) p[n] = { drawCalls: 0, tris: 0, cpu: 0, gpu: 0 };
    fr = { p, idx: g.car.idx, x: +g.car.x.toFixed(0), z: +g.car.z.toFixed(0) }; sound = 0; sampling = k++ % sampN === 0;
    const prog = info.programs.length, tex = info.memory.textures, geos = info.memory.geometries, t = performance.now();
    g.frame(now += stepSec); fr.cpu = performance.now() - t; fr.sound = sound;
    fr.ev = [p['ombre-fixe'].drawCalls && 'ombres fixes refaites', info.programs.length > prog && 'shader compiled', info.memory.textures > tex && 'texture uploaded', info.memory.geometries > geos && 'geometry uploaded'].filter(Boolean);
    im.push(fr); fr = null;
    if (ext && im.length % 8 === 0) readQ();
    if (performance.now() > ending) { await yieldNow(); ending = performance.now() + 12; }
  }
  const elapsed = performance.now() - t00;
  for (let i = 0; i < 100 && att.length; i++) { await new Promise(r => setTimeout(r, 10)); readQ(); }
  const stats1 = stats();
  R.setRenderTarget = srt; R.render = rr; R.renderBufferDirect = rbd; SOUND.frame = sf; info.autoReset = true; srt(null); outOf.dispose();

  // ---------- summary ----------
  const avg = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0, mx = a => a.length ? Math.max(...a) : 0, q = (a, p) => { const t = [...a].sort((x, y) => x - y); return t[Math.min(t.length - 1, Math.floor(t.length * p))] || 0; };
  const f2 = v => +v.toFixed(2), gpuT = f => PASSES.reduce((s, n) => s + f.p[n].gpu, 0), callT = f => PASSES.reduce((s, n) => s + f.p[n].drawCalls, 0);
  const byPass = Object.fromEntries(PASSES.map(n => [n, { drawCalls: f2(avg(im.map(f => f.p[n].drawCalls))), drawCallsMax: mx(im.map(f => f.p[n].drawCalls)), ktris: f2(avg(im.map(f => f.p[n].tris)) / 1000), cpu: f2(avg(im.map(f => f.p[n].cpu))), gpu: f2(avg(im.map(f => f.p[n].gpu))) }]));
  const S = 20, sections = Array.from({ length: S }, (_, s) => { const l = im.filter(f => Math.floor(f.idx * S / N) === s); return { section: s, idx: Math.round(s * N / S) + '-' + Math.round((s + 1) * N / S),
    cpu: f2(avg(l.map(f => f.cpu))), cpuMax: f2(mx(l.map(f => f.cpu))), gpu: f2(avg(l.map(gpuT))), drawCalls: Math.round(avg(l.map(callT))), drawCallsMax: mx(l.map(callT)), ktris: Math.round(avg(l.map(f => PASSES.reduce((s, n) => s + f.p[n].tris, 0))) / 1000) }; });
  const viewed = Math.ceil(im.length / sampN), objects = [...obj].map(([k, e]) => ({ originName: k, drawCalls: f2(Object.values(e.drawCalls).reduce((s, v) => s + v, 0) / viewed), kverts: f2(Object.values(e.verts).reduce((s, v) => s + v, 0) / viewed / 1000),
    passes: Object.fromEntries(Object.entries(e.drawCalls).map(([p, v]) => [p, f2(v / viewed)])) })).sort((a, b) => b.drawCalls - a.drawCalls || b.kverts - a.kverts);
  const worstList = im.map((f, i) => [f.cpu, i]).sort((a, b) => b[0] - a[0]).slice(0, 8).map(([c, i]) => { const f = im[i]; return { cpu: f2(c), idx: f.idx, x: f.x, z: f.z, sound: f2(f.sound),
    graphics: f2(PASSES.reduce((s, n) => s + f.p[n].cpu, 0)), drawCalls: callT(f), ev: f.ev.join(', ') }; });
  // scenery: what remains drawable after the merge (game.js, "fusion")
  let fades = 0, singles = 0, instances = 0, kverts = 0; g.scene.traverse(o => { if (!o.isMesh && !o.isPoints && !o.isLine) return; if (o.userData.src) fades++; else if (o.isInstancedMesh) instances++; else singles++; kverts += (o.geometry.index || o.geometry.attributes.position).count * (o.isInstancedMesh ? o.count : 1) / 1000; });
  return { mapDef: g.M.id, images: im.length, realTime: Math.round(elapsed), gpuTimer: !!ext,
    cpu: f2(avg(im.map(f => f.cpu))), cpu99: f2(q(im.map(f => f.cpu), 0.99)), cpuMax: f2(mx(im.map(f => f.cpu))), gpu: f2(avg(im.map(gpuT))), gpu99: f2(q(im.map(gpuT), 0.99)),
    drawCalls: Math.round(avg(im.map(callT))), drawCallsMax: mx(im.map(callT)), byPass, sections, objects: objects.slice(0, 40), worstList,
    sound: { frame: f2(avg(im.map(f => f.sound))), frame99: f2(q(im.map(f => f.sound), 0.99)), frameMax: f2(mx(im.map(f => f.sound))), before: stats0, later: stats1 },
    scenery: { meshesMerged: fades, meshesSingle: singles, instances, kverts: Math.round(kverts), shaders: info.programs.length, textures: info.memory.textures, geometries: info.memory.geometries } };
}
