// Performance bench in one command: node tools/bench.js            → all maps
//                                       node tools/bench.js canal      → one map
//                                       node tools/bench.js --players=2 → split screen    --no-screen → Chrome without window (slower figures on Windows)
// Starts the server (tools/capture.py) if it is not running, opens the game in a Chrome window (?perf, see tools/perf.js; do not hide it during the measurement), waits for captures/perf.json,
// then says PASS or FAIL per map on two figures: the 99th percentile and the worst frame (frame99, frameMax: the larger of CPU and GPU time per frame), against BUDGET of perf.js.
// Exit code 0 = everything passes, 1 = at least one map fails, 2 = the bench could not run. Variables: CHROME (path to the browser), PORT (8851).
const { spawn } = require('child_process'), fs = require('fs'), path = require('path'), http = require('http');
const REPO_ROOT = path.join(__dirname, '..'), PORT = +process.env.PORT || 8851;
const CHROME = process.env.CHROME || ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome'].find(f => fs.existsSync(f));
const args = process.argv.slice(2), mapDef = args.find(a => !a.startsWith('--')), two = args.includes('--players=2'), d = two ? '2' : '';
const exitAt = path.join(REPO_ROOT, 'captures', 'perf' + d + '.json'), ending = (code, msg) => { if (msg) console.log(msg); for (const p of childProcs) p.kill(); process.exit(code); }, childProcs = [];
const responds = () => new Promise(r => http.get('http://127.0.0.1:' + PORT + '/index.html', res => { res.resume(); r(res.statusCode === 200); }).on('error', () => r(false)));
const waitFor = async (test, s) => { for (let i = 0; i < s * 2; i++) { if (await test()) return true; await new Promise(r => setTimeout(r, 500)); } return false; };

(async () => {
  if (!CHROME) ending(2, 'FAIL: Chrome not found (CHROME=browser path variable)');
  if (mapDef) { const ids = fs.readFileSync(path.join(REPO_ROOT, 'src', 'data', 'maps.js'), 'utf8').match(/\{ id: '(\w+)'/g).map(s => s.slice(7, -1)); if (!ids.includes(mapDef)) ending(2, 'FAIL: unknown map "' + mapDef + ' " (maps: ' + ids.join(', ') + ')'); }
  if (!(await responds())) { childProcs.push(spawn('python', [path.join('tools', 'capture.py'), String(PORT)], { cwd: REPO_ROOT, stdio: 'ignore' })); if (!(await waitFor(responds, 10))) ending(2, 'FAIL: the server does not start on port ' + PORT); }
  fs.rmSync(exitAt, { force: true });
  const url = 'http://127.0.0.1:' + PORT + '/index.html?perf&auto&players=' + (two ? 2 : 1) + (mapDef ? '&solo&map=' + mapDef : '');
  // a real window, in the foreground: without a screen, Windows throttles the process and the bench measured 2 to 3 times slower than the game (--no-screen to avoid it, on a server)
  childProcs.push(spawn(CHROME, ['--no-first-run', '--user-data-dir=' + path.join(require('os').tmpdir(), 'vpr-banc-' + Date.now()), '--window-size=1280,720', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--disable-features=CalculateNativeWinOcclusion', '--autoplay-policy=no-user-gesture-required', '--mute-audio', // sound always runs, as for a player: it is heavy (see README); --mute-audio only cuts the output, everything is computed
    ...(args.includes('--no-screen') ? ['--headless=new', url] : ['--app=' + url])], { stdio: 'ignore' }));
  console.log('Banc en cours : ' + (mapDef || 'all maps') + (two ? ', split screen' : '') + ' (about a minute for all maps)…');
  if (!(await waitFor(() => fs.existsSync(exitAt), mapDef ? 180 : 1500))) ending(2, 'FAIL: no result (captures/perf' + d + '.json) within the time allowed');
  await new Promise(r => setTimeout(r, 300)); // the file writing finishes
  const { budget: B, gpu, results } = JSON.parse(fs.readFileSync(exitAt, 'utf8'));
  console.log('Graphics card: ' + gpu + (/swiftshader|llvmpipe|software/i.test(gpu) ? '  ⚠ software rendering: figures are meaningless' : ''));
  console.log('Reference: p99 ≤ ' + B.frame99 + ' ms par image, pire image ≤ ' + B.frameMax + ' ms\n');
  let ok = true; const col = (s, n) => String(s).padEnd(n);
  console.log(col('mapDef', 10) + col('average', 12) + col('pire image', 13) + 'verdict');
  for (const r of results) {
    const good = r.frame99 <= B.frame99 && r.frameMax <= B.frameMax; ok = ok && good;
    console.log(col(r.mapDef, 10) + col(r.frame99.toFixed(1) + ' ms' + (r.frame99 > B.frame99 ? ' ✗' : ''), 12) + col(r.frameMax.toFixed(1) + ' ms' + (r.frameMax > B.frameMax ? ' ✗' : ''), 13) + (good ? 'SUCCESS' : 'FAILED'));
  }
  ending(ok ? 0 : 1, '\n' + (ok ? 'SUCCESS' : 'FAILED') + ' : ' + results.filter(r => r.frame99 <= B.frame99 && r.frameMax <= B.frameMax).length + '/' + results.length + ' maps in the reference (details: captures/perf' + d + '.json)');
})();
