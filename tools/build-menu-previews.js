// Capture the real circuit scenery as lightweight menu artwork. Usage: node tools/build-menu-previews.js [map ...]
const fs = require('fs'), path = require('path'), http = require('http'), { spawn } = require('child_process');
require('../src/data/maps.js');
const root = path.resolve(__dirname, '..'), port = +process.env.MENU_PORT || 8898, debug = +process.env.MENU_DBG || 9438;
const chromePath = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const pause = ms => new Promise(r => setTimeout(r, ms)), wanted = process.argv.slice(2), maps = wanted.length ? MAPS.filter(m => wanted.includes(m.id)) : MAPS;
const types = { '.js': 'text/javascript', '.html': 'text/html', '.woff2': 'font/woff2', '.webp': 'image/webp' };
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
      const url = await ev(`(() => { const g=__g; g.wakeup(); g.frame(performance.now()+16); g.renderer.setSize(640,400); g.cam.aspect=1.6; g.cam.updateProjectionMatrix(); g.renderer.setRenderTarget(null); g.renderer.render(g.scene,g.cam); return g.renderer.domElement.toDataURL('image/webp',.72); })()`);
      const file = path.join(root, 'assets/previews/' + map.id + '.webp'); fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64')); console.log(map.id + ': ' + Math.round(fs.statSync(file).size / 1024) + ' KB');
      await cmd('Browser.close');
    } finally { ws?.close(); child.kill(); await pause(200); }
  } } finally { server.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
