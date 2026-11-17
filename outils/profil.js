// Profil d'une carte : où part le temps d'image, et quel objet du décor le coûte. Lancé par outils/banc-rapide.js --profil (voir ce fichier) ;
// à la main : index.html?auto&joueurs=1&carte=<id>, mode course, puis dans la console : (await import('./outils/profil.js')).profil()
// Même tour que outils/perf.js (pilote automatique contre 3 IA, pas fixe de 1/60 s, rendu hors écran), mais mesuré autrement :
//   · par passe (scène, ombres fixes, ombres mobiles, reflets, post) : passes de dessin, triangles, temps GPU (minuterie EXT_disjoint_timer_query_webgl2) ;
//   · par vingtième de piste : temps cpu et GPU, passes de dessin — où ça coûte ;
//   · par objet du décor (une image sur `ech`) : passes de dessin et sommets, rapportés à la ligne du fichier de carte qui l'a posé (outils/origines.js, chargé en tête de page) ;
//   · les pires images avec ce qui s'y est passé (ombres fixes refaites, shader compilé, texture envoyée, part du son) ;
//   · le son : temps de SON.frame, et les coupures comptées par le navigateur (AudioContext.playbackStats, Chrome).
// Les passes de dessin et les sommets ne dépendent pas de la charge de la machine : ce sont eux qu'on compare d'une version à l'autre. Les temps, eux, varient.
const cede = () => new Promise(r => { const c = new MessageChannel(); c.port1.onmessage = r; c.port2.postMessage(0); });
const PASSES = ['scene', 'ombre-fixe', 'ombre-dyn', 'reflets', 'post'];

export async function profil({ ech = 4, images = 0 } = {}) {
  const g = window.__g, R = g.renderer, gl = R.getContext(), N = g.T.n, info = R.info, ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  if (g.mode !== 'course') throw new Error('passer en mode course au menu');
  g.start(); info.autoReset = false;
  // rendu hors écran, comme outils/perf.js : sinon on mesurerait l'attente de l'écran
  const cv = R.domElement, hors = new THREE.WebGLRenderTarget(cv.width, cv.height), srt = R.setRenderTarget.bind(R); let rt = null;
  R.setRenderTarget = (t, f) => { rt = t; srt(t || hors, f); };
  // passe en cours, d'après ce que game.js dessine (voir ombres() et refFace())
  const passe = (s, c) => s !== g.scene ? 'post' : rt && (rt.isWebGLCubeRenderTarget || rt.texture.name === 'reflets') ? 'reflets' : s.overrideMaterial ? 'ombre-dyn' : rt && rt.width === 1 ? 'ombre-fixe' : 'scene';
  let cur = 'post', fr = null; const att = []; // fr : l'image en cours de relevé ; att : minuteries GPU en attente de résultat
  const rr = R.render.bind(R);
  R.render = (s, c) => {
    const p = passe(s, c), av = cur, c0 = info.render.calls, t0 = info.render.triangles, t = performance.now(); cur = p;
    let q = null; if (ext && fr) { q = gl.createQuery(); gl.beginQuery(ext.TIME_ELAPSED_EXT, q); }
    try { rr(s, c); } finally {
      if (q) { gl.endQuery(ext.TIME_ELAPSED_EXT); att.push([q, fr, p]); }
      cur = av; if (fr) { const P = fr.p[p]; P.appels += info.render.calls - c0; P.tris += info.render.triangles - t0; P.cpu += performance.now() - t; }
    }
  };
  const lit = () => { while (att.length && gl.getQueryParameter(att[0][0], gl.QUERY_RESULT_AVAILABLE)) { const [q, f, p] = att.shift(); if (!gl.getParameter(ext.GPU_DISJOINT_EXT)) f.p[p].gpu += gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6; else f.disjoint = 1; gl.deleteQuery(q); } };
  // par objet : chaque passe de dessin rapportée à son origine (géométrie fondue : partagée entre ses pièces au prorata des sommets)
  const obj = new Map(), orig = o => { for (let p = o; p; p = p.parent) if (p.userData.origine) return p.userData.origine; return '?'; };
  const compte = (k, p, appels, sommets) => { let e = obj.get(k); if (!e) obj.set(k, e = { appels: {}, sommets: {} }); e.appels[p] = (e.appels[p] || 0) + appels; e.sommets[p] = (e.sommets[p] || 0) + sommets; };
  let releve = false; const rbd = R.renderBufferDirect.bind(R);
  R.renderBufferDirect = (cam, sc, geo, mat, o, grp) => {
    if (releve) {
      const n = (grp ? grp.count : (geo.index || geo.attributes.position).count) * (o.isInstancedMesh ? o.count : 1), src = o.userData.src;
      if (src) { const tot = src.reduce((s, x) => s + x[1], 0), parts = new Map(); for (const [k, v] of src) parts.set(k, (parts.get(k) || 0) + v);
        for (const [k, v] of parts) compte(k, cur, v / tot, n * v / tot); }
      else compte(orig(o) + (o.isInstancedMesh ? ' (instances)' : ''), cur, 1, n);
    }
    rbd(cam, sc, geo, mat, o, grp);
  };
  const sf = SON.frame; let son = 0; SON.frame = function () { const t = performance.now(); try { return sf.apply(this, arguments); } finally { son += performance.now() - t; } };
  const ac = window.__ac, stats = () => ac && ac.playbackStats ? JSON.parse(JSON.stringify(ac.playbackStats.toJSON ? ac.playbackStats.toJSON() : ac.playbackStats)) : null;

  let now = performance.now() + 1e7; const pas = 1000 / 60;
  while (g.state !== 'race') g.frame(now += pas);
  for (let i = 0; i < 120; i++) g.frame(now += pas); // échauffement : shaders compilés, textures envoyées
  const im = [], son0 = stats(), t00 = performance.now(); let fin = performance.now() + 12, k = 0;
  while (images ? im.length < images : g.car.dist < N + 20 && im.length < 20000) {
    const p = {}; for (const n of PASSES) p[n] = { appels: 0, tris: 0, cpu: 0, gpu: 0 };
    fr = { p, idx: g.car.idx, x: +g.car.x.toFixed(0), z: +g.car.z.toFixed(0) }; son = 0; releve = k++ % ech === 0;
    const prog = info.programs.length, tex = info.memory.textures, geos = info.memory.geometries, t = performance.now();
    g.frame(now += pas); fr.cpu = performance.now() - t; fr.son = son;
    fr.ev = [p['ombre-fixe'].appels && 'ombres fixes refaites', info.programs.length > prog && 'shader compilé', info.memory.textures > tex && 'texture envoyée', info.memory.geometries > geos && 'géométrie envoyée'].filter(Boolean);
    im.push(fr); fr = null;
    if (ext && im.length % 8 === 0) lit();
    if (performance.now() > fin) { await cede(); fin = performance.now() + 12; }
  }
  const duree = performance.now() - t00;
  for (let i = 0; i < 100 && att.length; i++) { await new Promise(r => setTimeout(r, 10)); lit(); }
  const son1 = stats();
  R.setRenderTarget = srt; R.render = rr; R.renderBufferDirect = rbd; SON.frame = sf; info.autoReset = true; srt(null); hors.dispose();

  // ---------- synthèse ----------
  const moy = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0, mx = a => a.length ? Math.max(...a) : 0, q = (a, p) => { const t = [...a].sort((x, y) => x - y); return t[Math.min(t.length - 1, Math.floor(t.length * p))] || 0; };
  const f2 = v => +v.toFixed(2), gpuT = f => PASSES.reduce((s, n) => s + f.p[n].gpu, 0), appT = f => PASSES.reduce((s, n) => s + f.p[n].appels, 0);
  const parPasse = Object.fromEntries(PASSES.map(n => [n, { appels: f2(moy(im.map(f => f.p[n].appels))), appelsMax: mx(im.map(f => f.p[n].appels)), ktris: f2(moy(im.map(f => f.p[n].tris)) / 1000), cpu: f2(moy(im.map(f => f.p[n].cpu))), gpu: f2(moy(im.map(f => f.p[n].gpu))) }]));
  const S = 20, sections = Array.from({ length: S }, (_, s) => { const l = im.filter(f => Math.floor(f.idx * S / N) === s); return { section: s, idx: Math.round(s * N / S) + '-' + Math.round((s + 1) * N / S),
    cpu: f2(moy(l.map(f => f.cpu))), cpuMax: f2(mx(l.map(f => f.cpu))), gpu: f2(moy(l.map(gpuT))), appels: Math.round(moy(l.map(appT))), appelsMax: mx(l.map(appT)), ktris: Math.round(moy(l.map(f => PASSES.reduce((s, n) => s + f.p[n].tris, 0))) / 1000) }; });
  const vus = Math.ceil(im.length / ech), objets = [...obj].map(([k, e]) => ({ origine: k, appels: f2(Object.values(e.appels).reduce((s, v) => s + v, 0) / vus), ksommets: f2(Object.values(e.sommets).reduce((s, v) => s + v, 0) / vus / 1000),
    passes: Object.fromEntries(Object.entries(e.appels).map(([p, v]) => [p, f2(v / vus)])) })).sort((a, b) => b.appels - a.appels || b.ksommets - a.ksommets);
  const pires = im.map((f, i) => [f.cpu, i]).sort((a, b) => b[0] - a[0]).slice(0, 8).map(([c, i]) => { const f = im[i]; return { cpu: f2(c), idx: f.idx, x: f.x, z: f.z, son: f2(f.son),
    rendu: f2(PASSES.reduce((s, n) => s + f.p[n].cpu, 0)), appels: appT(f), ev: f.ev.join(', ') }; });
  // décor : ce qui reste dessinable après la fusion (game.js, « fusion »)
  let fondus = 0, seuls = 0, instances = 0, ksommets = 0; g.scene.traverse(o => { if (!o.isMesh && !o.isPoints && !o.isLine) return; if (o.userData.src) fondus++; else if (o.isInstancedMesh) instances++; else seuls++; ksommets += (o.geometry.index || o.geometry.attributes.position).count * (o.isInstancedMesh ? o.count : 1) / 1000; });
  return { carte: g.M.id, images: im.length, tempsReel: Math.round(duree), gpuMinuterie: !!ext,
    cpu: f2(moy(im.map(f => f.cpu))), cpu99: f2(q(im.map(f => f.cpu), 0.99)), cpuMax: f2(mx(im.map(f => f.cpu))), gpu: f2(moy(im.map(gpuT))), gpu99: f2(q(im.map(gpuT), 0.99)),
    appels: Math.round(moy(im.map(appT))), appelsMax: mx(im.map(appT)), parPasse, sections, objets: objets.slice(0, 40), pires,
    son: { frame: f2(moy(im.map(f => f.son))), frame99: f2(q(im.map(f => f.son), 0.99)), frameMax: f2(mx(im.map(f => f.son))), avant: son0, apres: son1 },
    decor: { maillagesFondus: fondus, maillagesSeuls: seuls, instances, ksommets: Math.round(ksommets), shaders: info.programs.length, textures: info.memory.textures, geometries: info.memory.geometries } };
}
