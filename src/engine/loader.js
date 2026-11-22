// Classic-script boot and per-circuit loading (including file://); menu changes retain the current view and crossfade to the next circuit.
(() => {
  const pending = new Map(), overlay = document.getElementById('loading'), title = document.getElementById('loading-title'), status = document.getElementById('loading-status'), retry = document.getElementById('loading-retry');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)'), nextFrame = () => new Promise(r => requestAnimationFrame(r));
  let animation = null, revision = 0;
  let raceLoading = false;
  let preview = null, previewOwner = null, previewAnimation = null, previewRevision = 0;
  let menu = null;
  let menuAnimation = null;
  const pictures = new Map();
  const menuFrame = (map, hud) => {
    if (!menu) { menu = document.body.appendChild(document.createElement('canvas')); menu.id = 'menu-view'; menu.setAttribute('aria-hidden', 'true'); menu.style.cssText = 'pointer-events:none;z-index:8'; }
    if (menu.width !== hud.width || menu.height !== hud.height) { menu.width = hud.width; menu.height = hud.height; }
    if (!pictures.has(map.id)) { const im = new Image(); im.decoding = 'async'; im.src = 'assets/previews/' + map.id + '.webp'; pictures.set(map.id, im); }
    const g = menu.getContext('2d'), im = pictures.get(map.id), color = '#' + Number(map.th.fog).toString(16).padStart(6, '0'); g.imageSmoothingEnabled = false;
    g.fillStyle = color; g.fillRect(0, 0, menu.width, menu.height);
    if (im.complete && im.naturalWidth) { const scale = Math.max(menu.width / im.width, menu.height / im.height), w = im.width * scale, h = im.height * scale; g.drawImage(im, (menu.width - w) / 2, (menu.height - h) / 2, w, h); }
    g.drawImage(hud, 0, 0); menu.hidden = false;
    if (menu.dataset.map !== map.id) { menu.dataset.map = map.id; if (menuAnimation) menuAnimation.cancel(); if (!reduced.matches) menuAnimation = menu.animate([{ opacity: 0.75 }, { opacity: 1 }], { duration: 100, easing: 'ease-out' }); }
  };
  const menuHide = () => { if (menu) menu.hidden = true; };
  const language = () => { try { return localStorage.getItem('vpr.langue') === 'en' ? 'en' : 'fr'; } catch (e) { return 'fr'; } };
  const bootEnglish = { 'MISE EN ROUTE': 'STARTING UP', 'PREPARATION DU CIRCUIT': 'PREPARING THE TRACK', 'PREPARATION DE L\'IMAGE': 'PREPARING THE PICTURE', 'PRET A ROULER': 'READY TO DRIVE', 'PREPARATION DU JEU': 'PREPARING THE GAME', 'COURSE ARCADE': 'ARCADE RACING', 'VILLE A PLEIN REGIME': 'FULL THROTTLE CITY', 'LA NUIT EST A VOUS.': 'THE NIGHT IS YOURS.', '18 CIRCUITS': '18 TRACKS', 'RADIO EN DIRECT': 'LIVE RADIO', "JUSQU'A 4 JOUEURS": 'UP TO 4 PLAYERS', 'REESSAYER': 'RETRY', 'CHARGEMENT IMPOSSIBLE': 'UNABLE TO LOAD' };
  const text = s => bootEnglish[s] ? language() === 'en' ? bootEnglish[s] : s : window.translated ? translated(s, language()) : s;
  const progress = (value, label, step) => {
    document.getElementById('loading-fill').style.transform = 'scaleX(' + value + ')';
    const bar = document.querySelector('.loading-track'); bar.setAttribute('aria-valuenow', Math.round(value * 100)); bar.setAttribute('aria-label', text('PREPARATION DU JEU'));
    status.textContent = text(label); document.getElementById('loading-count').textContent = '0' + step + ' / 03';
  };
  const scripts = (paths, completed) => Promise.all(paths.map(src => {
    if (!pending.has(src)) pending.set(src, new Promise((resolve, reject) => {
      const script = document.createElement('script'); script.async = false; script.src = src;
      script.onload = resolve; script.onerror = () => { pending.delete(src); script.remove(); reject(new Error('Cannot load ' + src)); };
      document.head.append(script);
    }));
    return pending.get(src).then(() => { if (completed) completed(); });
  }));
  const fade = (from, to, ms) => {
    if (animation) animation.cancel();
    animation = overlay.animate([{ opacity: from }, { opacity: to }], { duration: reduced.matches ? 0 : ms, easing: 'ease-out', fill: 'forwards' });
    return animation.finished.catch(() => {});
  };
  const beginRace = async map => {
    raceLoading = true; revision++; if (animation) animation.cancel(); overlay.hidden = false; retry.hidden = true; overlay.setAttribute('aria-busy', 'true');
    document.getElementById('loading-circuit').textContent = text(map.label); progress(0.7, 'PREPARATION DU CIRCUIT', 2);
    await nextFrame(); await nextFrame();
  };
  // Copy immediately after the current map draws: WebGL's default buffer is not retained between frames.
  // This keeps its menu visible even when another instance resizes or warms the shared renderer off-screen.
  const previewFrame = (id, canvas, common) => {
    if (id !== previewOwner || !preview) return;
    if (preview.width !== canvas.width || preview.height !== canvas.height) { preview.width = canvas.width; preview.height = canvas.height; }
    const g = preview.getContext('2d'); g.clearRect(0, 0, preview.width, preview.height); g.drawImage(canvas, 0, 0);
    if (common && common.style.display !== 'none') g.drawImage(common, 0, 0, preview.width, preview.height);
  };
  const keepPreview = () => {
    previewRevision++; previewOwner = window.__g.M.id;
    if (!preview) { preview = document.body.appendChild(document.createElement('canvas')); preview.id = 'map-preview'; preview.setAttribute('aria-hidden', 'true'); preview.style.cssText = 'pointer-events:none;z-index:8'; }
    if (previewAnimation) previewAnimation.cancel(); preview.hidden = false;
    return nextFrame();
  };
  const reveal = async () => {
    const current = previewRevision;
    await nextFrame(); await nextFrame();
    if (current !== previewRevision || !preview) return;
    previewOwner = null;
    previewAnimation = preview.animate([{ opacity: 1 }, { opacity: 0 }], { duration: reduced.matches ? 0 : 180, easing: 'ease-out', fill: 'forwards' });
    await previewAnimation.finished.catch(() => {});
    if (current === previewRevision) { preview.hidden = true; previewAnimation.cancel(); }
  };
  const hide = async () => {
    const current = revision;
    if (raceLoading) await SOUND.readyMs;
    await nextFrame(); await nextFrame();
    if (current !== revision) return;
    overlay.setAttribute('aria-busy', 'false'); await fade(1, 0, 180);
    if (current === revision) { overlay.hidden = true; animation.cancel(); raceLoading = false; }
  };
  const failed = error => {
    revision++; if (animation) animation.cancel(); overlay.hidden = false; overlay.setAttribute('aria-busy', 'false');
    status.textContent = text('CHARGEMENT IMPOSSIBLE'); retry.textContent = text('REESSAYER'); retry.hidden = false; retry.focus(); console.error(error);
  };
  retry.addEventListener('click', () => location.reload());
  const mapScripts = (map, completed) => {
    const paths = GAME_ASSETS.maps[map.th.scenery];
    if (!paths) return Promise.reject(new Error('Missing assets for ' + map.id));
    return scripts([...(GAME_ASSETS.dependencies[map.th.scenery] || []), ...paths], completed);
  };
  window.GAME_LOADER = { scripts, mapScripts, keepPreview, previewFrame, reveal, hide, failed, progress, menuFrame, menuHide, beginRace, get raceLoading() { return raceLoading; } };
  window.GAME_READY = (async () => {
    for (const node of document.querySelectorAll('[data-boot-text]')) node.textContent = text(node.dataset.bootText);
    let loaded = 0; const core = [...GAME_ASSETS.core, 'src/engine/game.js']; progress(0, 'MISE EN ROUTE', 1);
    await scripts(core, () => progress(++loaded / core.length * 0.48, 'MISE EN ROUTE', 1));
    document.getElementById('loading-circuit').textContent = text(MAP_DEF.label);
    const count = GAME_ASSETS.maps[MAP_DEF.th.scenery].length + (GAME_ASSETS.dependencies[MAP_DEF.th.scenery] || []).length;
    loaded = 0; await mapScripts(MAP_DEF, () => progress(0.48 + ++loaded / count * 0.22, 'PREPARATION DU CIRCUIT', 2));
    await document.fonts.load('12px "Press Start 2P"');
    await nextFrame(); const api = await launchGame(); await SOUND.prepare();
    progress(1, 'PRET A ROULER', 3);
    if (/[?&]perf\b/.test(location.search)) import('../../tools/perf.js').then(m => m.runSuite());
    await hide(); return api;
  })();
  GAME_READY.catch(failed);
})();
