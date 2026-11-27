// Capture the real circuit scenery as lightweight menu artwork. Usage: node tools/build-menu-previews.js [map ...] [--clips [--wide | --fly]]
// Default: the still assets/previews/<map>.webp. --clips: the menu's moving background assets/previews/<map>.webm (ffmpeg: FFMPEG, or Python's imageio_ffmpeg).
const fs = require('fs'), path = require('path'), http = require('http'), { spawn } = require('child_process');
require('../src/data/maps.js');
const root = path.resolve(__dirname, '..'), port = +process.env.MENU_PORT || 8898, debug = +process.env.MENU_DBG || 9438;
const chromePath = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const clips = process.argv.includes('--clips'), pause = ms => new Promise(r => setTimeout(r, ms)), wanted = process.argv.slice(2).filter(a => !a.startsWith('--')), maps = wanted.length ? MAPS.filter(m => wanted.includes(m.id)) : MAPS;
const types = { '.js': 'text/javascript', '.html': 'text/html', '.woff2': 'font/woff2', '.webp': 'image/webp', '.webm': 'video/webm', '.css': 'text/css' };
// The menu clip: a 12 s trailer of the real game, a race against the three BOTS cut like a film, then VP9 through ffmpeg.
// Rhythm: a wide establishing shot, cuts that get shorter and shorter, a slow-motion beat in the middle of the pack, a quick burst, then the hero shot.
// view(u) → [angle° around the car (0 = in front), distance, height, field°]: __g.view, the game's inspection camera; u goes 0 → 1 over the shot, eased.
// fixed: [samples ahead, side (±1, at the road's edge), height, field°]: a camera planted by the road, the pack drives past it.
// at: where on the track (fraction of a lap), the pack placed 120 m before; null: the action carries on. A ray from the car pulls the camera in front of walls and roofs.
const SHOTS = [
  { at: 0.02, s: 2.2, view: u => [165 + 25 * u, 62 - 18 * u, 46 - 12 * u, 50] }, // the place: high and wide, the pack small below
  { at: null, s: 1.2, fixed: [22, 1, 1.3, 34], flash: 1 }, // the pack whooshes past the lens
  { at: null, s: 0.9, view: u => [128 - 12 * u, 3.4, 0.45, 74] }, // rear wheel, at road level
  { at: 0.3, s: 0.9, view: u => [-4 + 8 * u, 15 - 10 * u, 0.6, 58], flash: 1 }, // the car charging at the lens
  { at: null, s: 1.0, view: u => [180 + 30 * u, 1.5, 30 - 6 * u, 55] }, // straight down from the drone, turning slowly
  { at: 0.47, s: 0.7, fixed: [16, -1, 1.4, 40], flash: 1 }, // another roadside, the other side
  { at: null, s: 1.0, view: u => [150 + 80 * u, 6.5, 1.6, 58] }, // a quarter turn round the car
  { at: 0.62, s: 1.8, slow: 0.28, view: u => [78 + 20 * u, 11, 2.2, 56] }, // slow motion, the BOTS door to door, framed wide
  { at: null, s: 0.4, view: () => [180, 10, 2.4, 62], flash: 1 }, // burst: rear
  { at: null, s: 0.4, view: () => [-35, 15, 7, 60] }, // front, high
  { at: null, s: 0.4, view: () => [262, 11, 2.5, 60] }, // side
  { at: 0.88, s: 1.6, view: u => [-6, 4 + 10 * u, 0.5 + 2 * u, 46 + 14 * u], flash: 1, fade: 1 }, // hero: low in front, pulling back, out to black for the loop
];
// --wide: the same rhythm in wide shots, the scenery first and the cars inside it (the tight cut is the default).
const SHOTS_WIDE = [
  { at: 0.02, s: 2.2, view: u => [160 + 30 * u, 95 - 20 * u, 75 - 15 * u, 50] }, // the whole place from high up
  { at: null, s: 1.2, fixed: [30, 1, 6, 42], flash: 1 }, // a crane by the road, the pack crossing the frame
  { at: null, s: 0.9, view: u => [180 - 15 * u, 20, 7, 55] }, // high chase behind
  { at: 0.3, s: 0.9, view: u => [-20 + 10 * u, 26 - 4 * u, 5, 52], flash: 1 }, // wide in front, the pack coming
  { at: null, s: 1.0, view: u => [180 + 25 * u, 3, 45 - 8 * u, 55] }, // straight down, high
  { at: 0.47, s: 0.7, fixed: [24, -1, 4.5, 48], flash: 1 }, // the other roadside, raised
  { at: null, s: 1.0, view: u => [140 + 60 * u, 18, 6, 55] }, // a slow turn round the pack
  { at: 0.62, s: 1.8, slow: 0.28, view: u => [80 + 20 * u, 20, 6, 52] }, // slow motion, the pack in its setting
  { at: null, s: 0.4, view: () => [180, 22, 9, 55], flash: 1 }, // burst: rear, high
  { at: null, s: 0.4, view: () => [-40, 26, 12, 55] }, // front, higher
  { at: null, s: 0.4, view: () => [260, 20, 5, 55] }, // side
  { at: 0.1, s: 1.6, view: u => [-10, 6 + 50 * u, 1.2 + 34 * u, 50], flash: 1, fade: 1 }, // hero: from the bumper up into the sky, out to black
];
// --fly: a course tour like a kart game's track intro. Three kinds of shot, slower cuts with dissolves:
//   free: the camera flies above the road on its own, cars or not. fly: where it starts (fraction of a lap), m: metres flown (about 15 m/s reads well), h: height [start, end],
//         ahead: m looked ahead, or look: a fixed fraction of a lap looked at. f: field°. Something in the way: the camera rises a little, then comes closer.
//         The flight moves forward round the lap to the first stretch with open sky all along it (no tunnel, roof or bridge overhead).
//   fixed: a camera planted by a stretch of road, the pack drives through it.   view: centred on a car.   mix: dissolve from the previous shot.
const SHOTS_FLY = [ // no slow motion: the game steps its physics at a fixed rate, slowed down it stutters
  { at: null, s: 2.4, free: { fly: 0.95, m: 70, h: [30, 10], ahead: 40, f: 55 } }, // down from the sky onto a run of the course
  { at: 0.02, s: 1.5, fixed: [24, 1, 4, 42] }, // the pack through the first stretch
  { at: null, s: 1.0, view: u => [162 - 10 * u, 5.5, 0.8, 70], flash: 1 }, // rear three-quarter, at road level, over the carriageway
  { at: 0.3, lead: 1, s: 1.0, view: u => [-4 + 8 * u, 15 - 9 * u, 0.7, 58], flash: 1 }, // the car charging at the lens
  { at: null, s: 2.0, free: { fly: 0.45, m: 60, h: [3.5, 4.5], ahead: 35, f: 60 } }, // skimming the empty road
  { at: 0.6, lead: 1, open: 1, s: 1.2, view: u => [180 + 30 * u, 1.5, 30 - 6 * u, 55] }, // straight down from the drone
  { at: 0.82, lead: 1, open: 1, s: 1.6, view: u => [82 + 16 * u, 8, 1.6, 54] }, // door to door, from the side
  { at: null, s: 0.5, view: () => [180, 6, 1.2, 66], flash: 1 }, // burst: rear
  { at: null, s: 0.5, view: () => [262, 7, 1.5, 62] }, // side
  { at: 0.12, lead: 1, open: 1, s: 2.4, view: u => [0, 7 + 11 * u, 1.6 + 3.4 * u, 48 + 10 * u], flash: 1 }, // hero: low in front of the car, on its axis, the BOTs behind it, pulling back as the pack comes through
];
const FPS = 30, W = 480, H = 270;
const ffmpegPath = () => process.env.FFMPEG || require('child_process').execSync('python -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())"').toString().trim();
async function clip(map, ev, reload) {
  const dir = path.join(root, 'captures/clips/' + map.id); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  await ev(`localStorage.setItem('vpr7.mode', JSON.stringify('raceCase'))`); await reload(); // a race: the three BOTS are in the picture
  await ev(`(() => { const g = __g; requestAnimationFrame = () => 0; window.__clipT = 1e7;
    for (const u of g.views) { u.hudC.getContext('2d').clearRect(0, 0, u.hudC.width, u.hudC.height); u.hg = document.createElement('canvas').getContext('2d'); } // no interface on the picture
    g.start(); while (g.state !== 'race') g.frame(__clipT += 100);
    const T = g.T, n = T.n, ray = new THREE.Raycaster(), from = new THREE.Vector3(), to = new THREE.Vector3(), seen = o => { for (; o; o = o.parent) if (!o.visible) return false; return true; };
    const PACK = [[0, 0], [6, -0.5], [-8, 0.5], [14, 0.3]]; // [samples ahead (2 m) of the player, lane as a share of the road's half-width]: apart enough not to brake for each other, off the walls
    const LEAD = [[0, 0], [-15, -0.5], [-22, 0.5], [-30, 0.3]]; // lead: 1, the player 30 to 60 m clear of the BOTs, for shots that look at it from ahead or beside
    window.__clip = {
      roof(i) { const q = T.S[((Math.round(i)) % n + n) % n]; return [0, -0.6, 0.6, -1.5, 1.5].some(k => { from.set(q.x - q.tz * q.w * k, q.y + 2, q.z + q.tx * q.w * k); ray.set(from, to.set(0, 1, 0)); ray.far = 80; ray.camera = g.cam; return ray.intersectObject(g.scene, true).some(h => h.object.isMesh && seen(h.object)); }); }, // a tunnel, bridge, roof or canopy over the road or 5 to 10 m past its edges: the drone looks down on a wide patch
      place(at, lead, open) { let a = Math.floor(at * n); if (open) for (let d = 0; d < n; d += 5) { let ok = true; for (let j = -10; j <= 45 && ok; j += 3) ok = !this.roof(a + d + j); if (ok) { a = (a + d) % n; break; } } // open: on to the first stretch with open sky over the 110 m the shot drives
        const cars = [g.car, ...((g.race && g.race.cars) || []).filter(x => x !== g.car)];
        cars.forEach((c, k) => { const [di, ln] = (lead ? LEAD : PACK)[k] || [-20 - 6 * k, 0], i0 = ((a - 60 + di) % n + n) % n, p = T.S[i0], d = ln * Math.max(0, p.w - 1.8);
          Object.assign(c, { x: p.x - p.tz * d, y: p.y, z: p.z + p.tx * d, th: Math.atan2(p.tz, p.tx), vx: p.tx * 30, vz: p.tz * 30, idx: i0, dist: i0, d, file: d, yaw: 0, steer: 0, vy: 0, air: false, drift: false, slide: 0, hit: 0, stun: 0 }); });
        const c = g.car; for (let j = 0; j < 400 && (a - c.idx + n) % n < 70 && c.idx !== a; j++) g.frame(__clipT += 33); },
      shot(view, fixed, frames, slow, flash, fade, free, mix) {
        const c = g.car, out = [], cv = document.createElement('canvas'), x = cv.getContext('2d'), ease = u => u * u * (3 - 2 * u); cv.width = ${W}; cv.height = ${H}; let keep = 1, W0 = null;
        if (fixed) { const s = T.S[(c.idx + fixed[0]) % n], blocked = (P, j) => { const q = T.S[((c.idx + fixed[0] - j) % n + n) % n]; from.set(...P); to.set(q.x, q.y + 0.7, q.z).sub(from); const L = to.length(); ray.set(from, to.normalize()); ray.far = L; ray.camera = g.cam; return ray.intersectObject(g.scene, true).some(h => h.object.isMesh && seen(h.object) && !(h.object.material && h.object.material.transparent && h.object.material.opacity < 0.9)); };
          for (const [side, k] of [[fixed[1], 0.45], [-fixed[1], 0.45], [fixed[1], 0.2], [-fixed[1], 0.2]]) { const d = side * s.w * k; W0 = [s.x - s.tz * d, s.y + fixed[2], s.z + s.tx * d]; if (![-4, 4, 12, 22].some(j => blocked(W0, j))) break; } } // the first spot by the road that sees the whole approach and the getaway
        const mine = p => { const dx = p.x - c.x, dz = p.z - c.z, f = dx * Math.cos(c.th) + dz * Math.sin(c.th), l = -dx * Math.sin(c.th) + dz * Math.cos(c.th); return Math.abs(f) < 2.6 && Math.abs(l) < 1.4 && p.y - c.y < 2.2; }; // inside the followed car's box
        const hitAt = (v, h) => { const a = c.th + v[0] * Math.PI / 180; from.set(c.x, c.y + 0.7, c.z); to.set(c.x + Math.cos(a) * v[1], c.y + h, c.z + Math.sin(a) * v[1]).sub(from); const L = to.length(); ray.set(from, to.normalize()); ray.far = L; ray.camera = g.cam;
          const hit = ray.intersectObject(g.scene, true).find(h => h.object.isMesh && seen(h.object) && !(h.object.material && h.object.material.transparent && h.object.material.opacity < 0.9) && !mine(h.point)); return hit ? Math.max(0.15, (hit.distance - 0.8) / L) : 1; }; // glass and the followed car itself ignored; walls, props and the other cars stop the camera
        let lift = 0, flip = null; const clear = v => { if (flip === null) flip = hitAt(v, v[2]) < 1 && hitAt([-v[0], ...v.slice(1)], v[2]) === 1; if (flip) v = [-v[0], ...v.slice(1)]; const sd = Math.abs(Math.sin(v[0] * Math.PI / 180)) * v[1], room = T.S[c.idx].w - 0.5 - Math.abs(c.d || 0); if (sd > room) { const r = sd / Math.max(room, 3.5); v = [v[0], v[1] / r, v[2] + r - 1, Math.min(85, v[3] * Math.sqrt(r))]; } // closer, so a little higher and wider: the whole car stays in frame // above the road, not past its edge: thin rails and fences slip between the rays // the side of the car with room, chosen once per shot // a low obstacle: the camera rises over it (eased); a high one: it comes in front of it at once, then backs out slowly
          let up = [0, 3, 6].find(u => hitAt(v, v[2] + u) === 1 && hitAt(v, v[2] + u - 1.2) === 1); const k = up === undefined ? hitAt(v, v[2] + 6) : 1; if (up === undefined) up = 6; // the space just under the lens: a rail there fills the bottom of the frame too
          lift += (up - lift) * 0.12; keep = Math.min(k, keep + 0.04); const h = v[2] + lift; return [v[0], v[1] * keep, 0.7 + (h - 0.7) * keep, v[3]]; };
        const sm0 = k => { let x = 0, y = 0, z = 0; for (let j = -8; j <= 8; j++) { const q = T.S[((k + j) % n + n) % n]; x += q.x; y += q.y; z += q.z; } return [x / 17, y / 17, z / 17]; };
        const sm = i => { const k = Math.floor(i), t = i - k, a = sm0(k), b = sm0(k + 1); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }; // the track smoothed over 32 m and interpolated between samples: no step, no jolt in the bends
        let rise = 0, near = 1; const flight = u => { const fr = free, lerp = (a, b) => a + (b - a) * u, i = lerp(fr.fly[0], fr.fly[1]) * n, a = sm(i), P = [a[0], a[1] + lerp(fr.h[0], fr.h[1]), a[2]], L = fr.look !== undefined ? sm(fr.look * n) : sm(i + Math.sign(fr.fly[1] - fr.fly[0] || 1) * fr.ahead / 2); L[1] += 1;
          const room = y => { from.set(L[0], L[1], L[2]); to.set(P[0], y, P[2]).sub(from); const D = to.length(); ray.set(from, to.normalize()); ray.far = D; ray.camera = g.cam; const h = ray.intersectObject(g.scene, true).find(h => h.object.isMesh && seen(h.object) && !(h.object.material && h.object.material.transparent && h.object.material.opacity < 0.9)); return h ? Math.max(0.1, (h.distance - 2) / D) : 1; };
          const up = [0, 4, 8, 12].find(d => room(P[1] + d) === 1); rise += ((up ?? 12) - rise) * 0.06; const k = up === undefined ? room(P[1] + 12) : 1; near += (k - near) * 0.1; // a little higher, else closer to what it looks at
          const y = P[1] + rise; return { p: [L[0] + (P[0] - L[0]) * near, L[1] + (y - L[1]) * near, L[2] + (P[2] - L[2]) * near], l: L, f: fr.f }; };
        if (free && free.m !== undefined) free = { ...free, fly: [free.fly, free.fly + free.m / T.len] };
        if (free) { const cast = (q, dx, dy, dz, far) => { from.set(q.x, q.y + (dy ? 2 : 8), q.z); ray.set(from, to.set(dx, dy, dz).normalize()); ray.far = far; ray.camera = g.cam; return ray.intersectObject(g.scene, true).some(h => h.object.isMesh && seen(h.object)); };
          const over = i => { const q = T.S[((Math.round(i)) % n + n) % n]; return cast(q, 0, 1, 0, 80) || cast(q, -q.tz, 0, q.tx, q.w + 10) || cast(q, q.tz, 0, -q.tx, q.w + 10); }; // a roof overhead, or a wall closer than 10 m past the road's edge at 8 m up
          const span = [free.fly[0], free.fly[1], free.look ?? free.fly[1]], lo = Math.min(...span) * n, hi = Math.max(...span) * n;
          for (let d = 0; d < n; d += n / 100) { let ok = true; for (let i = lo; i <= hi + 15 && ok; i += 3) ok = !over(i + d); if (ok) { const sh = d / n; free = { ...free, fly: [free.fly[0] + sh, free.fly[1] + sh], look: free.look === undefined ? undefined : free.look + sh }; break; } }
          const f0 = Math.min(free.fly[0], free.fly[1]) * n, back = [100, 60, 150, 35, 220].find(b => !over(f0 - b) && !over(f0 - b + 60)) ?? 100; this.place((f0 - back) / n); for (let j = 0; j < 90; j++) g.frame(__clipT += 33); } // the pack behind the camera, out in the open, 3 s to let the eye settle: the game's light and exposure follow the player's car
        let cam0 = null; const world = v => { const a = c.th + v[0] * Math.PI / 180; return { p: [c.x + Math.cos(a) * v[1], c.y + v[2], c.z + Math.sin(a) * v[1]], l: [c.x, c.y + 0.7, c.z], f: v[3] }; };
        const prev = window.__clipLast; // the previous shot's last picture, for the dissolve
        for (let f = 0; f < frames; f++) {
          const v = free ? flight(ease(f / Math.max(1, frames - 1))) : W0 ? { p: W0, l: [c.x, c.y + 0.7, c.z], f: fixed[3] } : world(clear(view(ease(f / Math.max(1, frames - 1)))));
          if (!cam0) cam0 = { p: [...v.p], l: [...v.l] }; const kp = free || W0 ? 1 : 0.45, kl = free ? 1 : 0.5; for (let a = 0; a < 3; a++) { cam0.p[a] += (v.p[a] - cam0.p[a]) * kp; cam0.l[a] += (v.l[a] - cam0.l[a]) * kl; } // the car's jolts and the one-frame lag smoothed out
          g.view = { p: [...cam0.p], l: [...cam0.l], f: v.f };
          g.frame(__clipT += 1000 / ${FPS} * (slow || 1)); x.drawImage(g.renderer.domElement, 0, 0, ${W}, ${H});
          const w = flash ? [0.85, 0.45, 0.15][f] || 0 : 0, b = fade ? Math.max(0, (f - frames + 8) / 8) : 0; // white flash on the cut, the loop's fade to black
          if (mix && prev && f < 15) { x.globalAlpha = 1 - f / 15; x.drawImage(prev, 0, 0); x.globalAlpha = 1; } if (w) { x.fillStyle = 'rgba(255,255,255,' + w + ')'; x.fillRect(0, 0, ${W}, ${H}); } if (b) { x.fillStyle = 'rgba(0,0,0,' + b + ')'; x.fillRect(0, 0, ${W}, ${H}); }
          out.push(cv.toDataURL('image/jpeg', 0.92).slice(23)); }
        const last = document.createElement('canvas'); last.width = ${W}; last.height = ${H}; last.getContext('2d').drawImage(cv, 0, 0); window.__clipLast = last;
        g.view = null; return out; } };
  })()`);
  let k = 0;
  for (const s of process.argv.includes('--fly') ? SHOTS_FLY : process.argv.includes('--wide') ? SHOTS_WIDE : SHOTS) {
    if (s.at !== null) await ev(`__clip.place(${s.at}, ${s.lead || 0}, ${s.open || 0})`);
    const frames = await ev(`__clip.shot(${s.view ? s.view.toString() : 'null'}, ${JSON.stringify(s.fixed || null)}, ${Math.round(s.s * FPS)}, ${s.slow || 0}, ${s.flash || 0}, ${s.fade || 0}, ${JSON.stringify(s.free || null)}, ${s.mix || 0})`);
    for (const f of frames) fs.writeFileSync(path.join(dir, String(++k).padStart(4, '0') + '.jpg'), Buffer.from(f, 'base64'));
  }
  const file = path.join(root, 'assets/previews/' + map.id + '.webm');
  require('child_process').execFileSync(ffmpegPath(), ['-y', '-loglevel', 'error', '-framerate', '' + FPS, '-i', path.join(dir, '%04d.jpg'), '-c:v', 'libvpx-vp9', '-crf', '48', '-b:v', '0', '-row-mt', '1', '-pix_fmt', 'yuv420p', '-an', file]);
  console.log(map.id + ' clip: ' + Math.round(fs.statSync(file).size / 1024) + ' KB');
}
const server = http.createServer((q, r) => { const file = path.resolve(root, '.' + decodeURIComponent(q.url.split('?')[0])); if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { r.writeHead(404); r.end(); return; } r.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream'); r.end(fs.readFileSync(file)); });
(async () => {
  fs.mkdirSync(path.join(root, 'assets/previews'), { recursive: true }); await new Promise(r => server.listen(port, '127.0.0.1', r));
  try { for (const map of maps) {
    const child = spawn(chromePath, ['--headless=new', '--no-first-run', '--remote-debugging-port=' + debug, '--user-data-dir=' + path.join(root, 'captures/preview-profile-' + map.id), '--window-size=960,600', '--ignore-gpu-blocklist', '--enable-gpu', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--mute-audio', 'about:blank'], { windowsHide: true, stdio: 'ignore' });
    let ws;
    try {
      let tab; for (let i = 0; i < 100; i++) { try { tab = (await (await fetch('http://127.0.0.1:' + debug + '/json/list')).json()).find(t => t.type === 'page'); if (tab) break; } catch {} await pause(100); }
      if (!tab) throw new Error('Chrome did not start'); ws = new WebSocket(tab.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
      let id = 0; const calls = new Map(); ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id) { calls.get(m.id)?.(m); calls.delete(m.id); } };
      const cmd = (method, params = {}) => new Promise(r => { const n = ++id; calls.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
      const ev = async expression => { const r = await cmd('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text); return r.result.result.value; };
      await cmd('Page.enable'); await cmd('Page.navigate', { url: 'http://127.0.0.1:' + port + '/index.html?auto&players=1&map=' + map.id });
      let ready = false; for (let i = 0; i < 600; i++) { if (await ev(`!!window.__g && __g.M.id==='${map.id}' && document.getElementById('loading').hidden`)) { ready = true; break; } await pause(100); }
      if (!ready) throw new Error('Map did not load: ' + map.id);
      if (clips) { await clip(map, ev, async () => { await cmd('Page.reload'); await pause(500); for (let i = 0; i < 600 && !(await ev(`!!window.__g && document.getElementById('loading').hidden`).catch(() => false)); i++) await pause(100); }); await cmd('Browser.close'); continue; }
      const url = await ev(`(() => { const g=__g; g.wakeup(); g.frame(performance.now()+16); g.renderer.setSize(640,400); g.cam.aspect=1.6; g.cam.updateProjectionMatrix(); g.renderer.setRenderTarget(null); g.renderer.render(g.scene,g.cam); return g.renderer.domElement.toDataURL('image/webp',.72); })()`);
      const file = path.join(root, 'assets/previews/' + map.id + '.webp'); fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64')); console.log(map.id + ': ' + Math.round(fs.statSync(file).size / 1024) + ' KB');
      await cmd('Browser.close');
    } finally { ws?.close(); child.kill(); await pause(200); }
  } } finally { server.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
