// The menus' look (PS2-era rally game): front page and language, game choice, map wheel with its video and card, mode, settings, pause, finish.
// game.js owns the state and the actions; it hands draw() a model of the screen each frame. This file only draws, on its own canvas over the game, and
// turns clicks into model.click(i) (i: the row clicked). Layout on a 270-unit grid whose width follows the window; the canvas has about 360 lines,
// smoothed up to the screen, then 32 levels, 4 × 4 Bayer dither and light scanlines (the game's final pass). Fonts: system Arial Black and Verdana.
(function (G) {
  const H = 270, OR = '#ff8a00', RED = '#e8361c', YEL = '#ffd200', BLU = '#1f5fd6', INK = '#0a0c12', DIM = '#8a97b0';
  const SANS = 'italic 900 Spx "Arial Black", "Arial Bold", Arial, sans-serif', BODY = 'bold Spx Verdana, Tahoma, sans-serif';
  const ICON = { solo: 0, glisse: 1, raceCase: 2, broken: 3, elim: 4, tourAll: 2 };
  const SURFACE = { ville: 'ASPHALTE MOUILLE', touge: 'ASPHALTE', wangan: 'ASPHALTE MOUILLE', paris: 'PAVES / ASPHALTE', canal: 'ASPHALTE', stade: 'TERRE BATTUE', givre: 'NEIGE TASSEE', terre: 'TERRE', perse: 'ASPHALTE', barrage: 'BETON', chapada: 'ASPHALTE / PIERRE', plage: 'ASPHALTE', egee: 'ASPHALTE', area51: 'ASPHALTE', piliers: 'ASPHALTE / TERRE', volcan: 'ASPHALTE', lune: 'REGOLITHE', autoroute: 'ASPHALTE' };
  G.MenuUI = ({ tr, base = 'assets/' }) => {
    const cv = document.body.appendChild(document.createElement('canvas')), g = cv.getContext('2d', { willReadFrequently: true });
    cv.id = 'menu-ui'; cv.hidden = true; cv.style.cssText = 'position:fixed;inset:auto;z-index:8;image-rendering:auto;cursor:pointer';
    let W = 480, S = 2, fitKey = '', BACK = null, model = null, hits = [], last = '', t0 = 0, stepT = -9, lastStep = '', wheel = 0;
    const img = src => { const i = new Image(); i.decoding = 'async'; i.src = src; return i; }, STILL = {}, still = id => STILL[id] || (STILL[id] = img(base + 'previews/' + id + '.webp')), ART = img(base + 'start-line.webp');
    // videos are fetched whole, so seeking works on a server without range requests (file:// falls back to a plain source)
    const VID = {}, box = document.body.appendChild(document.createElement('div')); box.style.cssText = 'position:fixed;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none';
    const vid = id => { if (!VID[id]) { const v = Object.assign(document.createElement('video'), { muted: true, loop: true, playsInline: true }), src = base + 'previews/' + id + '.webm';
      fetch(src).then(r => r.ok ? r.blob() : Promise.reject()).then(b => { v.src = URL.createObjectURL(b); }, () => { v.src = src; }); box.append(v); VID[id] = v; } return VID[id]; };
    let LASTV = null; // a new video picks up where the previous one was: the openings are alike
    const playOnly = ids => { const prev = LASTV && VID[LASTV] && !ids.includes(LASTV) ? VID[LASTV].currentTime : null;
      for (const [k, v] of Object.entries(VID)) if (!ids.includes(k) && !v.paused) v.pause();
      ids.forEach(i => { const v = vid(i); if (v.paused) { if (prev !== null) { const seek = () => { v.currentTime = prev % v.duration; }; if (v.readyState >= 1) seek(); else v.addEventListener('loadedmetadata', seek, { once: true }); } v.play().catch(() => { }); } }); if (ids.length) LASTV = ids[0]; };

    // ---------- drawing kit (grid units) ----------
    const grad = (y, s, stops) => { const k = g.createLinearGradient(0, y - s, 0, y); stops.forEach(([a, c]) => k.addColorStop(a, c)); return k; };
    const chrome = (y, s) => grad(y, s, [[0, '#ffffff'], [0.45, '#dfe6f2'], [0.55, '#7d889c'], [1, '#f4f6fa']]), heat = (y, s) => grad(y, s, [[0, '#fff6b0'], [0.5, YEL], [0.55, OR], [1, RED]]);
    function big(s, x, y, size, { align = 'left', fill = 'chrome', max } = {}) { // chrome italic title; y = baseline
      s = tr(s); g.font = SANS.replace('S', size); g.textAlign = align; g.textBaseline = 'alphabetic'; g.lineJoin = 'round';
      g.fillStyle = 'rgba(0,0,0,.6)'; g.fillText(s, x + 2, y + 2, max); g.strokeStyle = INK; g.lineWidth = Math.max(2, size / 6); g.strokeText(s, x, y, max);
      g.fillStyle = fill === 'chrome' ? chrome(y, size * 0.8) : fill === 'heat' ? heat(y, size * 0.8) : fill; g.fillText(s, x, y, max);
    }
    function body(s, x, y, col = '#d8dce6', size = 9, align = 'left', max, shadow = true) { s = tr(s); g.font = BODY.replace('S', size); g.textAlign = align; g.textBaseline = 'top'; if (shadow) { g.fillStyle = '#000'; g.fillText(s, x + 1, y + 1, max); } g.fillStyle = col; g.fillText(s, x, y, max); }
    const slant = (x, y, w, h, k) => { g.beginPath(); g.moveTo(x + k, y); g.lineTo(x + w, y); g.lineTo(x + w - k, y + h); g.lineTo(x, y + h); g.closePath(); };
    function plate(x, y, w, h, on, t, tint) { // a leaning panel: deep blue, glossy top half; on: amber, glowing, a bright tab in front; tint: crimson and gold (the Tour)
      const r = Math.min(10, Math.round(h * 0.35)), f = g.createLinearGradient(0, y, 0, y + h);
      (on ? [[0, '#ffc860'], [0.5, '#ff9418'], [0.5, '#e06a08'], [1, '#ffa030']] : tint ? [[0, '#a8344a'], [0.5, '#6a1428'], [0.5, '#4a0c1c'], [1, '#6e1a2c']] : [[0, 'rgba(46,78,140,.92)'], [0.5, 'rgba(22,40,84,.92)'], [0.5, 'rgba(12,24,56,.94)'], [1, 'rgba(20,36,76,.94)']]).forEach(([a, c]) => f.addColorStop(a, c));
      g.save(); if (on) { g.shadowColor = `rgba(255,150,40,${0.6 + 0.3 * Math.sin(t * 5)})`; g.shadowBlur = 10; } else { g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 4; g.shadowOffsetY = 2; }
      slant(x, y, w, h, r); g.fillStyle = f; g.fill(); g.restore();
      slant(x + 0.5, y + 0.5, w - 1, h - 1, r); g.strokeStyle = on ? '#fff0c8' : tint ? YEL : 'rgba(150,190,255,.55)'; g.lineWidth = 1; g.stroke();
      g.save(); slant(x, y, w, h, r); g.clip(); const k = g.createLinearGradient(0, y, 0, y + h / 2); k.addColorStop(0, 'rgba(255,255,255,.32)'); k.addColorStop(1, 'rgba(255,255,255,.04)'); g.fillStyle = k; g.fillRect(x, y, w, h / 2); // gloss
      if (on) { const p = ((t * 0.7) % 1.6 - 0.3) * (w + 40), s2 = g.createLinearGradient(x + p - 20, 0, x + p + 20, 0); s2.addColorStop(0, 'rgba(255,255,255,0)'); s2.addColorStop(0.5, 'rgba(255,255,255,.35)'); s2.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = s2; g.fillRect(x, y, w, h); }
      g.restore(); if (on) { g.fillStyle = '#fff6d8'; slant(x - 9, y, r + 4, h, r); g.fill(); }
    }
    function frame(x, y, w, h) { g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(x + 3, y + 3, w + 3, h + 3); const f = g.createLinearGradient(0, y, 0, y + h); f.addColorStop(0, '#e8edf5'); f.addColorStop(0.5, '#5a6478'); f.addColorStop(1, '#c8d0de'); g.fillStyle = f; g.fillRect(x - 3, y - 3, w + 6, h + 6); g.fillStyle = INK; g.fillRect(x - 1, y - 1, w + 2, h + 2); }
    function picture(src, x, y, w, h) { const sw = src.videoWidth || src.naturalWidth, sh = src.videoHeight || src.naturalHeight; if (!sw || (src.readyState !== undefined && src.readyState < 2)) return false;
      const k = Math.max(w / sw, h / sh), cw = w / k, ch = h / k; g.drawImage(src, (sw - cw) / 2, (sh - ch) / 2, cw, ch, x, y, w, h); return true; }
    const show = (id, x, y, w, h) => { if (!picture(vid(id), x, y, w, h)) picture(still(id), x, y, w, h); };
    const stripes = (x, y, w, h) => [YEL, OR, RED, BLU].forEach((c, i) => { g.fillStyle = c; slant(x, y + i * h / 4, w, h / 4, h); g.fill(); }); // the livery's four bands
    function icon(mi, x, y, z, col) { // a line icon per mode: stopwatch, tyre marks, chequered flag, crash burst, arrow out
      g.save(); g.translate(x, y); g.scale(z / 32, z / 32); g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 3; g.lineCap = g.lineJoin = 'round'; g.beginPath();
      if (mi === 0) { g.arc(16, 18, 11, 0, 7); g.moveTo(16, 18); g.lineTo(16, 11); g.moveTo(16, 18); g.lineTo(21, 21); g.moveTo(13, 4); g.lineTo(19, 4); g.stroke(); }
      else if (mi === 1) { g.moveTo(4, 26); g.bezierCurveTo(10, 26, 10, 12, 18, 10); g.moveTo(9, 29); g.bezierCurveTo(16, 28, 16, 16, 24, 14); g.stroke(); g.save(); g.translate(24, 9); g.rotate(-0.5); g.fillRect(-4, -3, 10, 7); g.restore(); }
      else if (mi === 2) { g.moveTo(6, 30); g.lineTo(6, 3); g.stroke(); for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) if ((r + c) % 2 === 0) g.fillRect(7 + c * 5.5, 4 + r * 5.5, 5.5, 5.5); g.strokeRect(7, 4, 22, 16.5); }
      else if (mi === 3) { for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2, r = k % 2 ? 6 : 14; g.lineTo(16 + Math.cos(a) * r, 16 + Math.sin(a) * r); } g.closePath(); g.stroke(); }
      else { g.moveTo(16, 4); g.lineTo(16, 22); g.moveTo(9, 15); g.lineTo(16, 22); g.lineTo(23, 15); g.moveTo(6, 28); g.lineTo(26, 28); g.stroke(); }
      g.restore();
    }
    function flag(l, x, y, w, h, t, wave) { // drawn in 2-unit columns, rippling
      for (let i = 0; i < w; i += 2) { const ph = t * 6 - i * 0.12, dy = wave ? Math.round(Math.sin(ph) * 2) : 0, sh = wave ? 0.85 + 0.15 * Math.sin(ph + 1) : 1;
        g.save(); g.beginPath(); g.rect(x + i, y + dy, 2.2, h); g.clip(); g.translate(0, dy);
        if (l === 'fr') { g.fillStyle = '#1f3fbf'; g.fillRect(x, y, w / 3, h); g.fillStyle = '#f4f4f4'; g.fillRect(x + w / 3, y, w / 3, h); g.fillStyle = '#e0283a'; g.fillRect(x + 2 * w / 3, y, w / 3, h); }
        else { g.fillStyle = '#1a2a7a'; g.fillRect(x, y, w, h); g.strokeStyle = '#f4f4f4'; g.lineWidth = h * 0.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y + h); g.moveTo(x + w, y); g.lineTo(x, y + h); g.stroke(); g.strokeStyle = '#e0283a'; g.lineWidth = h * 0.07; g.stroke(); g.fillStyle = '#f4f4f4'; g.fillRect(x + w / 2 - h * 0.17, y, h * 0.34, h); g.fillRect(x, y + h * 0.33, w, h * 0.34); g.fillStyle = '#e0283a'; g.fillRect(x + w / 2 - h * 0.1, y, h * 0.2, h); g.fillRect(x, y + h * 0.4, w, h * 0.2); }
        g.fillStyle = `rgba(0,0,0,${1 - sh})`; g.fillRect(x + i, y, 2.2, h); g.restore(); }
    }
    const PATHS = {}, path = id => { if (PATHS[id] !== undefined) return PATHS[id]; const c = (G.MENU_CARDS || {})[id]; if (!c) return (PATHS[id] = null); const P = c.points, xs = P.map(p => p[0]), zs = P.map(p => p[1]), x0 = Math.min(...xs), z0 = Math.min(...zs); return (PATHS[id] = { P, x0, z0, w: Math.max(...xs) - x0 || 1, h: Math.max(...zs) - z0 || 1, car: c.car, km: c.km }); };
    function minimap(id, x, y, w, h, t) {
      const p = path(id); if (!p) return; const k = Math.min((w - 12) / p.w, (h - 12) / p.h), ox = x + (w - p.w * k) / 2, oy = y + (h - p.h * k) / 2, at = q => [ox + (q[0] - p.x0) * k, oy + (q[1] - p.z0) * k];
      for (const [c, lw] of [['#000', 4], ['#c8d0de', 2]]) { g.strokeStyle = c; g.lineWidth = lw; g.lineJoin = 'round'; g.beginPath(); p.P.forEach(q => g.lineTo(...at(q))); g.closePath(); g.stroke(); }
      const s = at(p.P[0]); g.fillStyle = '#fff'; g.fillRect(s[0] - 3, s[1] - 1, 6, 3); const a = at(p.P[(t * 8 | 0) % p.P.length]); g.fillStyle = OR; g.fillRect(a[0] - 2, a[1] - 2, 5, 5); // a car dot running the lap
    }
    const SPARKS = Array.from({ length: 40 }, () => [Math.random(), Math.random() * H, 1 + Math.random() * 3]);
    function backdrop(t) { // carbon weave and a livery stripe, drawn once per size; speed streaks on top
      if (!BACK) {
        const f = g.createLinearGradient(0, 0, 0, H); f.addColorStop(0, '#141a2c'); f.addColorStop(0.6, '#0a0d18'); f.addColorStop(1, '#05060a'); g.fillStyle = f; g.fillRect(0, 0, W, H);
        g.fillStyle = 'rgba(255,255,255,.025)'; for (let y = 0; y < H; y += 2) for (let x = (y / 2) % 2 * 2; x < W; x += 4) g.fillRect(x, y, 2, 1);
        g.save(); g.translate(W * 0.62, H * 0.98); g.rotate(-0.35); [YEL, OR, RED, BLU].forEach((c, i) => { g.fillStyle = c; g.globalAlpha = 0.16; g.fillRect(-W, -60 + i * 14, W * 2, 11); }); g.restore(); g.globalAlpha = 1;
        BACK = document.createElement('canvas'); BACK.width = cv.width; BACK.height = cv.height; BACK.getContext('2d').drawImage(cv, 0, 0);
      } else g.drawImage(BACK, 0, 0, W, H);
      g.fillStyle = 'rgba(255,255,255,.08)'; SPARKS.forEach(s => { const x = (s[0] * W - t * 60 * s[2]) % W; g.fillRect(x < 0 ? x + W : x, s[1], 8 * s[2], 1); });
    }
    const hit = (x, y, w, h, i) => hits.push([x, y, w, h, i]);
    const slide = (t, i, d = 0.22) => { const u = Math.min(1, Math.max(0, (t - t0 - i * 0.05) / d)); return (1 - u) ** 3; }; // 1 → 0 as an item slides in
    const RX = () => Math.round(Math.max(214, W * 0.445)), RW = () => W - RX() - 14; // the right-hand display
    const tourOf = (m, t) => m.tourIds[(t / 3 | 0) % m.tourIds.length]; // the map the Tour row shows at time t

    // ---------- screens ----------
    function drawTitle(m, t) { // the front page: the logo, then the language, English first
      if (!picture(ART, 0, 0, W, H)) backdrop(t); g.fillStyle = 'rgba(5,6,10,.35)'; g.fillRect(0, 0, W, H);
      const y = 36, lx = slide(t, 0) * -W; g.fillStyle = INK; slant(-10 + lx, y, W + 20, 62, 18); g.fill(); stripes(-10 + lx, y + 62, W + 20, 7);
      big('REDLINE', W / 2 - 4 + lx, y + 44, 38, { align: 'right', fill: 'heat' }); big('RACER', W / 2 + 4 + lx, y + 44, 38);
      g.save(); g.beginPath(); g.rect(0, y, W, 62); g.clip(); g.fillStyle = 'rgba(255,255,255,.16)'; slant((t * 0.5 % 1.6 - 0.3) * W, y, 24, 62, 18); g.fill(); g.restore();
      [['en', 'ENGLISH'], ['fr', 'FRANÇAIS']].forEach(([l, n], k) => { const on = m.lang === l, x = W / 2 - 150 + k * 160 + slide(t, k + 1) * (k ? 300 : -300), yy = 128 - (on ? 4 : 0);
        plate(x, yy, 140, 104, on, t); flag(l, x + 26, yy + 12, 88, 52, t, on); if (!on) { g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(x + 26, yy + 12, 88, 52); }
        big(n, x + 70, yy + 90, 15, { align: 'center', fill: on ? '#fff' : 'chrome' }); hit(x, yy, 140, 104, k); });
      playOnly([]);
    }
    function drawMain(m, t) { // game choice: the logo, the plates on the left, the display on the right
      const lx = -slide(t, 0) * 200; big('REDLINE', 18 + lx, 36, 26, { fill: 'heat' }); big('RACER', 40 + lx, 62, 26); stripes(14 + lx, 70, 186, 6);
      m.items.forEach(([l, s], i) => { const on = m.sel === i, x = 16 + (on ? 10 : 0) - slide(t, i + 1) * 220, y = 96 + i * 52;
        plate(x, y, 176, 42, on, t); big(l, x + 14, y + 22, 14, { fill: on ? '#fff' : 'chrome', max: 150 }); body(s, x + 14, y + 28, on ? '#3a1a00' : '#9aa4b8', 7, 'left', 150); hit(x, y, 176, 42, i); });
      const x = RX() + slide(t, 1) * 300, y = 16, w = RW(), h = Math.round(Math.min(w * 9 / 16, 170)), ids = m.videos[m.sel]; frame(x, y, w, h);
      if (ids.length === 4) ids.forEach((id, i) => show(id, x + (i % 2) * (w / 2 + 1), y + (i >> 1) * (h / 2 + 1), w / 2 - 1, h / 2 - 1)); else show(ids[0], x, y, w, h);
      const dy = y + h + 12; plate(x - 2, dy, w + 4, 254 - dy, false, t); big(m.items[m.sel][0], x + 10, dy + 22, 14, { fill: 'heat' }); body(m.items[m.sel][2], x + 10, dy + 30, '#d8dce6', 8, 'left', w - 20);
      playOnly(ids);
    }
    function drawMaps(m, t) { // the wheel on the left (then the mode, then the settings), the video and the card on the right
      const L = m.list, n = L.length, c = L[m.sel], setup = m.step !== 'pick', u0 = Math.min(1, (t - stepT) / 0.25), u = setup ? u0 : 1 - u0, e = u * u * (3 - 2 * u);
      let dw = m.sel - wheel; if (dw > n / 2) dw -= n; if (dw < -n / 2) dw += n; wheel = ((wheel + dw * 0.25) % n + n) % n; // the wheel eases to the chosen row, round the shortest way
      if (e < 1) for (let d = -5; d <= 5; d++) { const i = ((Math.round(wheel) + d) % n + n) % n; let o = i - wheel; if (o > n / 2) o -= n; if (o < -n / 2) o += n; const a = Math.abs(o); if (a > 4.5) continue;
        const on = i === m.sel, x = 14 + a * a * 4 + (on ? 10 : 0) - e * 260 - slide(t, a) * 200, y = 135 + o * 30 - 13, r = L[i];
        g.globalAlpha = Math.max(0, 1 - a * 0.2); plate(x, y, 184, 26, on, t, r.tour); picture(still(r.tour ? tourOf(r, t) : r.id), x + 10, y + 4, 32, 18); body(String(i + 1).padStart(2, '0'), x + 175, y + 9, on ? INK : DIM, 9, 'right', undefined, !on);
        body(r.label, x + 48, y + 8, on ? '#fff' : r.tour ? YEL : '#d8dce6', 9, 'left', 104); g.globalAlpha = 1; hit(x, y, 184, 26, i); }
      if (e > 0) drawSetup(m, t, e);
      const x = RX() + slide(t, 1) * 300, w = RW(), CARD = 98, full = 256 - CARD - 12 - 14, vh = Math.round(full - (full - 56) * e), vidId = c.tour ? tourOf(c, t) : c.id; frame(x, 14, w, vh); show(vidId, x, 14, w, vh);
      const cy = 14 + vh + 12; plate(x - 2, cy, w + 4, 256 - cy, false, t);
      big(c.label, x + 10, cy + 19, tr(c.label).length > 16 ? 12 : 14, { fill: 'heat', max: w - 20 }); body(m.note || c.sub, x + 10, cy + 24, m.note ? YEL : '#6fd0ff', 8, 'left', w - 20);
      if (e < 1) { g.globalAlpha = 1 - e; const p = path(c.id) || {}, mw = c.tour ? 0 : Math.min(84, w - 140), vw = w - 72 - (mw > 40 ? mw + 6 : 0); // a narrow window: the values keep their room, the minimap goes first
        (c.tour ? c.facts : [['VOITURE', p.car || '--'], ['LONGUEUR', p.km ? String(p.km).replace('.', ',') + ' KM' : '--'], ['SURFACE', SURFACE[c.id] || '--'], ['HEURE', c.hour || '--'], ['RECORD', c.record]])
          .forEach(([a, b], i) => { body(a, x + 10, cy + 38 + i * 11, DIM, 8); body(b, x + 64, cy + 38 + i * 11, '#fff', 8, 'left', vw); });
        if (mw > 40) minimap(c.id, x + w - mw - 6, cy + 34, mw, 256 - cy - 38, t); g.globalAlpha = 1; }
      if (e > 0) { const md = m.modes[m.step === 'setup' ? m.row : m.mode] || m.modes[0]; g.globalAlpha = e; icon(ICON[md.key], x + w - 58, cy + 36, 48, YEL); big(md.name, x + 10, cy + 52, 12); body(md.lines[0], x + 10, cy + 60, '#fff', 9, 'left', w - 76); body(md.lines[1], x + 10, cy + 74, '#9aa4b8', 8, 'left', w - 76);
        body(m.foot, x + 10, cy + 94, YEL, 8, 'left', w - 20); g.globalAlpha = 1; }
      playOnly([vidId]);
    }
    function drawSetup(m, t, e) { // step 'setup': the modes; step 'opts': the chosen mode as a reminder, the settings and START
      const ox = -(1 - e) * 260;
      if (m.step === 'setup') { m.modes.forEach((md, i) => { const on = m.row === i, x = 14 + (on ? 10 : 0) + ox, y = 16 + i * 30;
        plate(x, y, 184, 25, on, t); icon(ICON[md.key], x + 9, y + 4, 17, on ? '#fff' : '#9ab4e0'); big(md.name, x + 34, y + 18, 11, { fill: on ? '#fff' : 'chrome', max: 140 }); hit(x, y, 184, 25, i); }); return; }
      const md = m.modes[m.mode] || m.modes[0]; plate(14 + ox, 16, 184, 25, false, t); icon(ICON[md.key], 23 + ox, 20, 17, YEL); big(md.name, 48 + ox, 34, 11, { fill: 'heat', max: 140 });
      m.opts.forEach(([l, v], j) => { const on = m.row === j, x = 14 + (on ? 10 : 0) + ox, y = 50 + j * 28;
        plate(x, y, 184, 24, on, t); body(l, x + 14, y + 8, on ? INK : '#c8d0de', 9, 'left', 80, !on); body(on ? '< ' + tr(v) + ' >' : v, x + 174, y + 8, on ? INK : YEL, 9, 'right', 90, !on); hit(x, y, 184, 24, j); });
      const j = m.opts.length, on = m.row === j, x = 14 + (on ? 10 : 0) + ox, y = 56 + j * 28; plate(x, y, 184, 28, on, t); big(m.go, x + 92, y + 20, 14, { align: 'center', fill: on ? '#fff' : 'heat' }); hit(x, y, 184, 28, j);
    }
    function raceBack(m, t, dim) { if (m.video) { show(m.video, 0, 0, W, H); playOnly([m.video]); } else playOnly([]); g.fillStyle = `rgba(5,8,18,${dim})`; g.fillRect(0, 0, W, H); }
    function drawPause(m, t) {
      raceBack(m, t, 0.7); const x0 = W / 2 - 100;
      big('PAUSE', W / 2, 52, 30, { align: 'center', fill: 'heat' }); body(m.sub, W / 2, 60, '#9ab4e0', 9, 'center', W - 40);
      m.items.forEach((l, i) => { const on = m.sel === i, x = x0 + (on ? 10 : 0), y = 80 + i * 28; plate(x, y, 200, 24, on, t);
        big(l, x + 100, y + 17, 11, { align: 'center', fill: on ? '#fff' : i === m.items.length - 1 ? 'heat' : 'chrome', max: 176 }); hit(x, y, 200, 24, i); });
    }
    function drawEnd(m, t) { // the results on the left, the two ways on at the right: another map in the same mode, or the main menu
      g.fillStyle = 'rgba(5,8,18,.72)'; g.fillRect(0, 0, W, H); playOnly([]); const x = 20, w = Math.min(250, W - 260);
      big(m.title, x, 40, 22, { fill: 'heat', max: w }); body(m.sub, x + 2, 48, '#9ab4e0', 9, 'left', w);
      plate(x, 66, w, 150, false, t);
      if (m.rows) { body(m.head[0], x + 12, 74, DIM, 8); body(m.head[1], x + w - 12, 74, DIM, 8, 'right'); const k = Math.min(22, 116 / m.rows.length);
        m.rows.forEach(([name, val, me], i) => { const y = 90 + i * k, col = me ? YEL : '#e8ecf4'; big(String(i + 1), x + 14, y + 12, k > 18 ? 14 : 11, { fill: me ? 'heat' : 'chrome' }); body(name, x + 36, y + 2, col, 10, 'left', w - 120); body(val, x + w - 12, y + 2, col, 10, 'right', 90); }); }
      else m.stats.forEach(([a, b, col], i) => { body(a, x + 12, 76 + i * 30, DIM, 8); big(b, x + 12, 100 + i * 30, 15, { fill: i ? 'chrome' : 'heat', max: w - 24 }); });
      if (m.foot) m.foot.forEach(([s, col], i) => body(s, i ? x + w - 12 : x + 12, 198, col, 8, i ? 'right' : 'left', w / 2 - 14));
      const bx = W - 214; m.items.forEach((l, i) => { const on = m.sel === i, xx = bx + (on ? 10 : 0), y = 96 + i * 38; plate(xx, y, 196, 30, on, t);
        big(l, xx + 98, y + 21, 13, { align: 'center', fill: on ? '#fff' : 'chrome', max: 170 }); hit(xx, y, 196, 30, i); });
      body(m.help, bx + 4, 172, '#9ab4e0', 8, 'left', 200);
    }

    // ---------- size, then the final pass: 32 levels, Bayer 4 × 4, light scanlines ----------
    function fit() {
      const key = innerWidth + 'x' + innerHeight + 'x' + devicePixelRatio; if (key === fitKey) return; fitKey = key;
      S = Math.min(innerHeight * devicePixelRatio, 360) / H; W = Math.round(Math.min(640, Math.max(400, H * innerWidth / innerHeight))); // about 360 lines; the grid widens with the window
      cv.width = Math.round(W * S); cv.height = Math.round(H * S); BACK = null;
      const k = Math.min(innerWidth / W, innerHeight / H); Object.assign(cv.style, { width: W * k + 'px', height: H * k + 'px', left: (innerWidth - W * k) / 2 + 'px', top: (innerHeight - H * k) / 2 + 'px' }); // never stretched
    }
    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5], STEP = 255 / 31, LUT = new Uint8Array(2 * 16 * 256); // [scanline][Bayer cell][value] → quantised value
    for (let l = 0; l < 2; l++) for (let c = 0; c < 16; c++) for (let v = 0; v < 256; v++) LUT[(l * 16 + c) * 256 + v] = Math.min(255, Math.max(0, Math.round((v * (l ? 0.92 : 1) + (BAYER[c] / 16 - 0.47) * 0.8 * STEP) / STEP) * STEP));
    function post() {
      const cw = cv.width, ch = cv.height, d = g.getImageData(0, 0, cw, ch), a = d.data;
      for (let y = 0; y < ch; y++) { const row = (((y / S | 0) & 1) * 16 + (y & 3) * 4) * 256; for (let x = 0, i = y * cw * 4; x < cw; x++, i += 4) { const o = row + (x & 3) * 256; a[i] = LUT[o + a[i]]; a[i + 1] = LUT[o + a[i + 1]]; a[i + 2] = LUT[o + a[i + 2]]; } }
      g.putImageData(d, 0, 0);
    }
    function draw(m) {
      model = m; fit(); cv.hidden = false; const t = performance.now() / 1000;
      if (m.screen !== last) { last = m.screen; t0 = t; if (m.screen === 'maps') { wheel = m.sel; stepT = -9; lastStep = m.step; } }
      if (m.step && m.step !== lastStep) { if ((m.step === 'pick') !== (lastStep === 'pick')) stepT = t; lastStep = m.step; }
      hits = []; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); g.setTransform(S, 0, 0, S, 0, 0); g.globalAlpha = 1;
      if (m.screen === 'title') drawTitle(m, t); else if (m.screen === 'pause') drawPause(m, t); else if (m.screen === 'end') drawEnd(m, t);
      else { backdrop(t); if (m.screen === 'main') drawMain(m, t); else drawMaps(m, t); }
      g.setTransform(1, 0, 0, 1, 0, 0); post();
    }
    const hide = () => { if (!cv.hidden) { cv.hidden = true; last = ''; playOnly([]); } };
    const at = e => { const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * H / r.height; return hits.slice().reverse().find(([a, b, w, h]) => x >= a && x < a + w && y >= b && y < b + h); };
    cv.addEventListener('click', e => { const h = at(e); if (h && model && model.click) model.click(h[4]); });
    cv.addEventListener('contextmenu', e => { e.preventDefault(); if (model && model.back) model.back(); });
    cv.addEventListener('wheel', e => { e.preventDefault(); if (model && model.scroll) model.scroll(e.deltaY > 0 ? 1 : -1); }, { passive: false });
    return { draw, hide, get shown() { return !cv.hidden; } };
  };
})(window);
