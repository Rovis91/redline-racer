// Redline Racer — rendering, effects, HUD, controls and game loop. The track and physics are in sim.js.
// File outline (search for "// ----------"): rendering and final pass · the three scenery entities (textures.js, shapes.js, placement) · track · city · horizon · car and effects ·
// game state and controls · HUD · loopSec. See README.md to find where to tune whatLine.
window.launchGame = async (MAP_DEF = window.MAP_DEF, backdrop = false) => {
  // One instance per map, kept in memory (window.__maps): switching map shows an instance already built (sleeps / resumes), without rebuilding anything.
  // A map not yet seen is built in chunks behind the current menu (backdrop = true), then resumes() displays it.
  // loader.js loads the selected catalogue before calling this function; GAME_READY resolves once the first map is displayed.
  const whoosh = () => new Promise(r => { const c = new MessageChannel(); c.port1.onmessage = r; c.port2.postMessage(0); }); // not setTimeout: throttled to 1 per second in the background
  let active = false; // only the displayed instance listens to keyboard, mouse and window
  const halt = new AbortController(), addEventListener = (ev, f) => window.addEventListener(ev, e => { if (active) f(e); }, { signal: halt.signal }); // all listeners in this file are removed at once on stop
  { // try map options without touching maps.js: ?opt={"th":{"lisse":["eau"]}} merged into the map (see docs/methods/MAP-ENGINE-OPTIONS.md); review tool, nothing is kept
    const o = new URLSearchParams(location.search).get('opt'), fu = (a, b) => { for (const k in b) a[k] = b[k] && b[k].constructor === Object && a[k] && a[k].constructor === Object ? fu({ ...a[k] }, b[k]) : b[k]; return a; };
    if (o) MAP_DEF = fu({ ...MAP_DEF }, JSON.parse(o));
  }
  const T = buildTrack(THREE, MAP_DEF), CARD = T.car, S = T.S, N = T.n, W = T.W, V3 = THREE.Vector3, M = MAP_DEF, TH = M.th; // active map and its theme: see maps.js
  const lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
  const AUTO = /[?&]auto(?![a-z])/.test(location.search); // debug: the autopilot drives (the parameter ?auto alone: ?map=autoroute must not switch it on)
  // 0 outside the sector, 1 inside, linear ramps of `ramp` samples (2 m) before the entry / after the exit
  const span = (a0, a1, on) => (i, ramp) => { if (!on) return 0; const a = (i - a0 + N) % N, L = a1 - a0; return a < L ? 1 : Math.max(0, 1 - (a - L) / ramp, 1 - (N - a) / ramp); };
  const zone = span(T.t0, T.t1, T.tun), hot = span(T.h0, T.h1, true); // zone = tunnel (light, scenery); hot = hot sector (music)
  // ambient sound zones (amb field of the map, between two points of the track): 0 outside, 1 inside, 120 m fade at entry and exit
  const nearS = p => { let b = 0, bd = 1e18; for (let i = 0; i < N; i++) { const d = (S[i].x - p[0] * M.sc) ** 2 + (S[i].z - p[1] * M.sc) ** 2; if (d < bd) { bd = d; b = i; } } return b; };
  const ambZ = (M.amb || []).map(([a, b]) => span(nearS(M.pts[a]), nearS(M.pts[b]), true)), ambAt = i => Math.max(0, ...ambZ.map(z => z(i, 60)));
  // th.seaSpray: [[point a, point b, strength], …]: between these track points, droplets land on the lens as in rain (spray from a fall, a river); absent: nothing
  const embZ = (TH.seaSpray || []).map(([a, b, k]) => [span(nearS(M.pts[a]), nearS(M.pts[b]), true), k]), embAt = i => Math.max(0, ...embZ.map(([z, k]) => k * z(i, 30)));
  // haze by zone (th.haze: [[point a, point b, start, end in metres], …]): between these two track points, the map's haze tightens, 180 m fade at entry and exit (docs/methods/MAP-ENGINE-OPTIONS.md)
  const hazeZ = (TH.haze || []).filter(z => z.length > 3).map(([a, b, n0, n1]) => [span(nearS(M.pts[a]), nearS(M.pts[b]), true), n0, n1]);
  const chevExcept = (TH.chevExcept || []).map(([a, b]) => span(nearS(M.pts[a]), nearS(M.pts[b]), true)); // th.chevExcept: [[point a, point b], …], no corner chevrons between these track points
  // rain (theme): strength per sample computed in sim.js (T.rainFx: zones [point a, point b, strength], 120 m fade); cut in tunnels at draw time
  const rainAt = i => T.rainFx[i];
  let tTraffic = 0; // time elapsed since the start: traffic clock
  let seed = 7;
  const rnd = () => { seed = seed * 1664525 + 1013904223 >>> 0; return seed / 4294967296; };

  // ---------- light and retro rendering settings (everything is tuned here) ----------
  const NL = 20;        // light fixtures computed at the same time around the car (cost per pixel)
  const BRIGHT_GAIN = 0.75;   // strength of all light fixtures, headlights included
  const BRIGHT_STEP = 5;    // tunnels: one light fixture every BRIGHT_STEP samples (2 m), staggered left / right
  const QUANT = 32;     // final pass: levels per channel (a 15-bit console has 32); 0 = no quantisation
  const WEFT = 0.8;     // strength of the ordered Bayer dithering, 0 to 1
  const TUN_AMB = 0.55; // tunnels: share of ambient light on floor, walls and ceiling; the rest comes from the light fixtures
  const FAR = 1.3;     // view distance: each map's fog (maps.js, fogD) and the shadow range recede by as much
  const SHAKES = 0;    // vertex wobble like the first 3D consoles: pixel steps of the grid, 0 = none

  // ---------- visual styles to compare: ?style=<name> (no parameter: current rendering, unchanged) ----------
  // h: lines of the internal target (0 = those of the screen); z: the pass reads the depth (outlines); shakes / affine: vertices and textures like 32-bit consoles
  // pre / fx / ending: GLSL of the final pass — before reading (u = coordinate), on the scene's colour c, then after the HUD. No blur, no halo.
  const STYLES = {
    ending: { h: 540, fx: 'c = floor(c * 64. + bayer(v / px) * .35 + .5) / 64.;' },
    net: { h: 0, rawVal: 1 }, // the scene and the HUD, nothing else: not even the vignette
    ink: { h: 0, z: 1, fx: 'c = aplat(pow(c, vec3(.72)), 6.) + .03; c *= 1. - .95 * smoothstep(.007, .018, arete(u, px * 1.5));' },
    halftint: { h: 540, fx: `float l = sqrt(lum(c)) * 3.2, i = min(floor(l), 2.); vec2 g = mat2(.707, -.707, .707, .707) * v * ecr / (ecr.y / 200.);
      float pt = smoothstep(-.08, .08, l - i - length(fract(g) - .5) * 1.414);
      vec3 enc = mix(i < .5 ? pal[0] : i < 1.5 ? pal[1] : pal[2], i < .5 ? pal[1] : i < 1.5 ? pal[2] : pal[3], pt);
      c = c.r - max(c.g, c.b) > .22 ? pal[4] * (.55 + .45 * pt) : enc;` },
    cathodic: { h: 360, pre: 'u = u * 2. - 1.; u *= 1. + .028 * u.yx * u.yx; u = u * .5 + .5;',
      ending: `c *= 1.45 * (1. - .55 * smoothstep(.22, .5, abs(fract(u.y / px.y) - .5)));
      c *= mix(vec3(.72), vec3(1.2), vec3(equal(vec3(mod(floor(v.x * ecr.x), 3.)), vec3(0., 1., 2.))));
      if (u != clamp(u, 0., 1.)) c = vec3(0.);` },
    console32: { h: 360, shakes: 1, affine: .3, fx: 'c = floor(c * 32. + bayer(v / px) * .5 + .5) / 32.;' },
    piping: { h: 0, z: 1, fx: `float e = smoothstep(.007, .018, arete(u, px * 1.5)); c = aplat(c, 9.);
      c = mix(c, min(c * 2.6 + vec3(.1, .2, .26), 1.), e * (.4 + .6 * smoothstep(0., .012, W(u))));` },
  };
  // ingredients to dose one by one, alone or on top of a style: ?lines=540 (0 = screen) &aa=2 (supersampling, not a blur) &smooth=1 (filtered textures)
  // &levels=32&dither=.5 &outline=.9 (ink) &rim=.8 &shadows=.5 (0 to 1, lifts the darks) &contrast=1.2 &sharpen=.3 &shake=1 &blur=1&halo=1 (those of the current rendering)
  const Q = new URLSearchParams(location.search), P = k => +Q.get(k) || 0, G = k => P(k).toFixed(3);
  const ING = ['lignes', 'aa', 'smooth', 'levels', 'weft', 'contour', 'piping', 'shades', 'contrast', 'affine', 'shakes', 'softPuffs', 'halo'];
  const ST = STYLES[Q.get('style')] || ING.some(k => Q.has(k)) ? Object.assign({ h: 0 }, STYLES[Q.get('style')]) : null;
  if (ST) {
    for (const [k, c] of [['lignes', 'h'], ['affine', 'affine'], ['shakes', 'shakes']]) if (Q.has(k)) ST[c] = P(k);
    ST.aa = ST.h ? 1 : Math.max(1, Math.min(3, P('aa'))); // at full resolution only: enlarged, a smoothed target would be blurry
    ST.z = ST.z || P('contour') || P('piping'); const nv = P('levels') || (P('weft') ? 32 : 0);
    ST.fx = (P('softPuffs') || P('halo') ? `{ vec2 c0 = vec2(.5, .42), dd = u - c0; float ll = length(dd); vec3 a = vec3(0.);
        for (int i = 0; i < 8; i++) a += texture2D(t, c0 + dd * (1. - amt * ${G('softPuffs')} * ll * float(i) * .026)).rgb; c = a / 8.;
        for (int i = 0; i < 12; i++) { float an = float(i) * .5236, rr = 2. + 2.5 * mod(float(i), 3.); c += max(texture2D(t, u + vec2(cos(an), sin(an)) * rr * px).rgb - .5, 0.) * ${(P('halo') * TH.bloom).toFixed(3)}; } }` : '')
      + (ST.fx || '')
      + (P('shades') ? `c = pow(c, vec3(${(1 - 0.5 * P('shades')).toFixed(3)}));` : '')
      + (P('contrast') ? `c = clamp((c - .5) * ${G('contrast')} + .5, 0., 1.);` : '')
      + (nv ? `c = floor(c * ${nv.toFixed(1)} + bayer(v / px) * ${G('weft')} + .5) / ${nv.toFixed(1)};` : '')
      + (P('contour') ? `c *= 1. - ${G('contour')} * smoothstep(.007, .018, arete(u, px * 1.5));` : '')
      + (P('piping') ? `c = mix(c, min(c * 2.6 + vec3(.1, .2, .26), 1.), ${G('piping')} * smoothstep(.007, .018, arete(u, px * 1.5)));` : '');
  }
  // halftone: four inks from darkest to lightest, and one signal ink (lights, red neons), per map
  const PAL = { ville: [0x0a0614, 0x3a1a6a, 0xff3a8a, 0xfff0c8, 0xff2a3a], touge: [0x06100c, 0x1c4a3a, 0x7ab890, 0xfff2c8, 0xff5030], wangan: [0x060a16, 0x1a3a6a, 0xf0a040, 0xfff4d8, 0xff3030],
    paris: [0x100c14, 0x4a3a5a, 0xd89a70, 0xfff0d8, 0xe83a30], canal: [0x0c0a12, 0x5a2a4a, 0xf08a50, 0xfff0c0, 0xff3a40], stade: [0x0a0a14, 0x3a3060, 0xe8a030, 0xfff4d8, 0xe8362a], givre: [0x080e22, 0x2c4478, 0x8fb4e8, 0xf4f8ff, 0xe8482a], terre: [0x140c08, 0x6a3a1c, 0xe8903a, 0xfff0d0, 0xe8482a], perse: [0x141a3a, 0x5a3a78, 0xf08a3a, 0xfff0d0, 0xc8323c], barrage: [0x0e1012, 0x4a5a5a, 0xe8761e, 0xf4f0e0, 0xb5483c], chapada: [0x08140c, 0x1f5a2c, 0xe8b83a, 0xf2ecd0, 0xff5a3a], plage: [0x0a2a30, 0x0a7fa8, 0x19c7c9, 0xfff4e0, 0xff3d7f], attempt: [0x06100c, 0x1c4a3a, 0x7ab890, 0xfff2c8, 0xff5030], egee: [0x0b2a40, 0x0b4970, 0x45abb4, 0xf7efe0, 0xd74e92], area51: [0x182431, 0x4d428d, 0xd69a72, 0xe8e9df, 0xf5aa75], piliers: [0x162e39, 0x30484b, 0x70c9df, 0xf0e8d8, 0xed8f89], volcan: [0x23292d, 0x194b72, 0xd88d72, 0xe8d9ac, 0xb75d43], lune: [0x0a0d16, 0x303c49, 0x526c80, 0xe8e2d0, 0xd78a40], autoroute: [0x0a2731, 0x264143, 0x29c0c4, 0xf0e6c8, 0xe97e56] }[M.id];

  // ---------- low-definition rendering: scene → 270p target → final pass (speed blur, HUD, scanlines) ----------
  const renderer = window.__rendered || (window.__rendered = new THREE.WebGLRenderer({ antialias: false })); // a single one for the whole session: it keeps the shaders from one map to the next
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.BasicShadowMap;
  // three r152+ converts colours (sRGB ↔ linear): the whole game is tuned by eye without conversion, so we turn it off to keep the same image
  THREE.ColorManagement.enabled = false; renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  document.body.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  const FOG_OUT = new THREE.Color(TH.fog), FOG_IN = new THREE.Color(TH.tun ? TH.tun.fog : TH.fog), WHITE = new THREE.Color(0xffffff);
  scene.fog = new THREE.Fog(TH.fog, TH.fogD[0] * FAR, TH.fogD[1] * FAR);
  // th.haze = [[point a, point b, k], …]: between these control points, the fog range is multiplied by k (120 m fade); without it, nothing changes
  const HAZE = (TH.haze || []).some(z => z.length === 3) && (() => { const pi = k => { const [x, z] = M.pts[k]; let b = 0, bd = 1e18; S.forEach((q, i) => { const d = (q.x - x * M.sc) ** 2 + (q.z - z * M.sc) ** 2; if (d < bd) { bd = d; b = i; } }); return b; };
    const Z = TH.haze.filter(z => z.length === 3).map(([a, b, k]) => [pi(a), (pi(b) - pi(a) + N) % N, k]); return Float32Array.from({ length: N }, (_, i) => Z.reduce((f, [a, L, k]) => { const d = (i - a + N) % N, w = d < L ? 1 : Math.max(0, 1 - (d - L) / 60, 1 - (N - d) / 60); return Math.min(f, 1 - (1 - k) * w); }, 1)); })();
  // One "view" per player (just one in solo): everything specific to a camera. The scene, the renderer and the final-pass shader stay shared.
  // Each frame, the simulation advances once; then, for each view, viewFrame() sets the camera, light, fog and rain, draws its HUD, the scene into its target, and runs its final pass.
  // One more view = one call to freshView() (after the scenery is built: it copies the list of light fixtures and the rain seeds); frees() gives back the target and texture of each to the GPU.
  // The number of views is the number of players; it is set by players(n), further down (removeView() removes the last). With two, the views are stacked, player 1 on top, each on its 270-line grid: the canvas makes 540 of them.
  // A view is a player: its place (rank n, device, image input, lap count, "arrived"), its car (self) and its animated model (hu), plus what its camera looks at (car: self, unless eliminated in two-player).
  // VIEWS[0] is player 1: VIEWS[0].self is the game's car outside a race (there is no other "player's car" variable).
  // th.wetVisible (1, or a strength): the "damp" surf zones are seen like rain (MOTOR, ssr reflections), darker. MV = equivalent rain strength per sample (3 = full SURF.damp, as in sim.js)
  const MV = TH.wetVisible ? Float32Array.from(T.surf, q => 3 * (+TH.wetVisible) * Math.min(1, q.aq / 0.1)) : null, mouAt = i => MV ? Math.max(T.tun && (i - T.t0 + T.n) % T.n <= T.t1 - T.t0 ? 0 : T.rainFx[i], MV[i]) : T.rainFx[i]; // under the tunnel, rain does not wet the floor
  const SSR = T.rainFx.some(p => p > 0) || !!MV && MV.some(p => p > 0); // map where it rains somewhere: each view has its own depth and reflection pass (ssr)
  const WATER = 0.5; // alpha of the road in the target: 1 - WATER × wetness (written by illuminates, read by ssr); any other opaque writes 1
  const VIEWS = [], AA = ST ? ST.aa : 1, two = () => VIEWS.length > 1;
  const follows = (vu, c) => { vu.self = vu.car = c; vu.hu.hist.length = vu.hu.gR[0].length = vu.hu.gR[1].length = vu.hu.gOn[0] = vu.hu.gOn[1] = 0; vu.cth = c.th; vu.carY = S[c.idx].y; vu.result = null; vu.finished = vu.spec = false; vu.lap0 = [0, 0, 0]; }; // the view sits behind car c, race counters at zero: at the start, on return to the menu
  const freshView = () => {
    const rt = new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, type: ST ? THREE.UnsignedByteType : THREE.HalfFloatType }); // without a style, the scene keeps what exceeds white: the final pass exposes it (eye adaptation)
    if (ST && ST.aa > 1) rt.texture.minFilter = rt.texture.magFilter = THREE.LinearFilter; // supersampling: the target is aa times finer, the final pass averages it
    if (SSR || !ST || ST.z) { rt.depthTexture = new THREE.DepthTexture(1, 1); rt.depthTexture.type = THREE.UnsignedIntType; } // without a style: the depth cuts the light rays (and serves reflections)
    // the HUD is drawn on a 2D canvas at the same resolution as the game, then composed in the final pass: a single pixel grid
    const rs = SSR ? new THREE.WebGLRenderTarget(1, 1, { minFilter: rt.texture.minFilter, magFilter: rt.texture.magFilter, depthBuffer: false, type: rt.texture.type }) : null; // the scene + its reflections computed on screen (see ssr)
    const hudC = document.createElement('canvas'), hudT = new THREE.CanvasTexture(hudC);
    hudT.minFilter = hudT.magFilter = THREE.NearestFilter;
    const hb = ST ? null : new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false, type: THREE.HalfFloatType }); // halo and rays, on the HUD grid (see halo)
    const vu = { cam: Object.assign(new THREE.PerspectiveCamera(70, 1, 0.5, 3000), { layers: Object.assign(new THREE.Layers(), { mask: 1 | 1 << 2 | 1 << 3 }) }), rt, rs, hb, eye: 0, hudC, hg: hudC.getContext('2d'), hudT, w: 480, rw: 480, // w: width of the HUD grid; rw: that of the target (the same without a style)
      self: null, hu: HUM[VIEWS.length], car: null, cth: 0, carY: 0, pitch: 0, roll: 0, // followed car; camera heading, height, pitch and roll smoothed
      lookA: 0, lookP: 0, lookT: 0, // free mouse camera: angle around the car, extra height, delay before it returns
      hit: 0, bump: 0, land: 0, stun: 0, nit: 0, lm: 0, rv: 0, rc: 0, // impacts on the followed car during the frame; shake, nitro fade, tunnel fade
      gear: 0, rpm: 0.3, load: 0, spool: 0, up: 0, peak: new Float32Array(EQN), // gear and rpm shown (drivetrain), gauge peaks
      result: null, splitMsg: null, // HUD banners: lap completed, gap to the sector
      n: VIEWS.length, periph: '', inp: null, gas: 0, // player's rank (0 = top); their device ('' = solo: whole keyboard and the retained controller), their input of the frame
      finished: false, spec: false, lap0: null, // race: arrived or exited; spec: eliminated, the view looks at the leader (vu.car is no longer the player's car, which stays vu.self); counters at the start of the lap (skids, nitro uses, walls) — reset by follows()
      brightIdx: -1, brights: BRIGHTS.map(l => ({ l, d: 0 })), // light fixtures sorted by distance to the followed car
      rainO: [0, 0, 0], splP: new Float32Array(SN * 3), splA: splA.slice(), splD: new Float32Array(SN) }; // drops (their cumulative offset, see rain) and impacts: same starting draws for all views, rnd is not drawn
    follows(vu, VIEWS.length ? VIEWS[0].self : newCar(T)); VIEWS.push(vu); resize(); return vu; // a view added (in the menu) follows player 1's car, like all views outside a race
  };
  const renderView = vu => { vu.rt.dispose(); if (vu.rs) vu.rs.dispose(); if (vu.hb) vu.hb.dispose(); if (vu.rt.depthTexture) vu.rt.depthTexture.dispose(); vu.hudT.dispose(); }; // what a view holds on the GPU (its HUD canvas is not in the page)
  const removeView = () => { const vu = VIEWS.pop(); vu.hu.tr.visible = false; renderView(vu); resize(); }; // its trails are no longer held by any view
  let COM = null; // full-screen layer shared by both views: a 2D canvas laid over the game's, { c, g }. It only exists with two players (see players and layer, near the loop)
  let hg = null; // 2D context of the HUD being drawn (the view's, or the shared layer's), for txt, panel, tag
  // air in front of the lens, common to both final passes: read offset of the image (xy) and darkening (z)
  // gt[i] = droplet on the lens (centre, radius in screen height, vertical stretch): it shows the image behind it flipped and shrunk, dark edge
  const AIR = `uniform vec4 gt[8];
      vec3 air(vec2 v, vec2 px){ vec3 o = vec3(0., 0., 1.); vec2 as = vec2(px.y / px.x, 1.);
        for (int i = 0; i < 8; i++) { vec4 g = gt[i]; if (g.z <= 0.) continue; vec2 q = (v - g.xy) * as / g.z; q.y /= g.w; float r2 = dot(q, q);
          if (r2 < 1.) { o.xy += -(v - g.xy) * (1.6 + .4 * r2); o.z *= 1. - .3 * r2 * r2; } }
        return o; }`;
  const post = new THREE.ShaderMaterial({
    uniforms: { t: { value: null }, h: { value: null }, hb: { value: null }, dz: { value: null }, ex: { value: 1 }, amt: { value: 0 }, ab: { value: 0 }, vig: { value: 0 }, res: { value: 270 }, bloom: { value: TH.bloom }, scan: { value: TH.scan }, px: { value: new THREE.Vector2(1 / 480, 1 / 270) },
      gt: { value: Array.from({ length: 8 }, () => new THREE.Vector4()) },
      ray: { value: [0, 1, 2, 3].map(() => new THREE.Vector4()) }, rayC: { value: [0, 1, 2, 3].map(() => new THREE.Color(0)) } }, // rays: screen position (xy), source depth (z), 1 / halo radius² (w); colour × strength
    vertexShader: 'varying vec2 v; void main(){ v = uv; gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: `uniform sampler2D t, h, hb; uniform float amt, ab, vig, res, scan, ex; uniform vec2 px; varying vec2 v; ${AIR}
      float b2(vec2 a){ a = floor(a); return fract(a.x / 2. + a.y * a.y * .75); } // 4×4 Bayer matrix, built recursively
      void main(){
        float e = ex; // exposure: the eye (see TUN and renderView)
        vec3 ai = air(v, px); vec2 w = v + ai.xy, c0 = vec2(.5, .42), d = w - c0; float l = length(d); vec3 c = vec3(0.);
        // radial blur: zero at the centre, strong at the edges, proportional to speed; as many samples as texels crossed (8 at most): a blur of less than one pixel
        // (at the centre, below 130 km/h) read the same texel 8 times, a third of the cost of the pass
        float nf = clamp(ceil(length(d * amt * l * .182 / px)) + 1., 1., 8.), pas = nf > 1. ? amt * l * .182 / (nf - 1.) : 0.;
        for (int i = 0; i < 8; i++) { if (float(i) >= nf) break;
          vec2 u = c0 + d * (1. - pas * float(i));
          c += min(vec3(texture2D(t, u + d * ab).r, texture2D(t, u).g, texture2D(t, u - d * ab).b) * e, 1.); // + chromatic aberration; exposed and clipped to white, sample by sample like the old 8-bit target
        }
        c /= nf;
        c += texture2D(hb, v).rgb; // halo and rays, computed once per cell of the grid (see halo)
        c *= ai.z; // darkened under the drops
        ${QUANT ? `vec2 q = v / px; c = floor(c * ${QUANT}. + (b2(.5 * q) * .25 + b2(q) - .5) * ${WEFT.toFixed(2)} + .5) / ${QUANT}.; // colours reduced and dithered, on the game's pixel grid` : ''}
        vec4 hd = texture2D(h, v); c = mix(c, hd.rgb, hd.a);
        c *= 1. - scan * mod(floor(v.y * res), 2.); // scanlines aligned on the grid
        c *= max(0., 1. - (.9 + .7 * vig) * l * l);  // vignette, tightened by speed and nitro
        gl_FragColor = vec4(c, 1.);
      }`,
  });
  const postScene = new THREE.Scene(), postCam = new THREE.Camera(), quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post);
  quad.frustumCulled = false; postScene.add(quad);
  // halo and light rays: they do not change from one scene line to the next within a cell of the 270 grid; computed here once per cell (a quarter of the pixels), the final pass reads them back (th.bloom, rays: see post)
  const halo = new THREE.ShaderMaterial({ uniforms: post.uniforms, vertexShader: post.vertexShader, depthTest: false, depthWrite: false,
    fragmentShader: `uniform sampler2D t, dz; uniform float bloom, ex; uniform vec2 px; uniform vec4 ray[4]; uniform vec3 rayC[4]; varying vec2 v; ${AIR}
      void main(){
        float e = ex; vec3 ai = air(v, px); vec2 w = v + ai.xy;
        vec3 bl = vec3(0.); // halo: adds what exceeds a brightness threshold, sampled in a ring
        for (int i = 0; i < 12; i++) { float a = float(i) * .5236, rr = 2. + 2.5 * mod(float(i), 3.); bl += max(min(texture2D(t, w + vec2(cos(a), sin(a)) * rr * px).rgb * e, 1.) - .5, 0.); }
        vec3 ry = vec3(0.); float j = fract(52.98 * fract(dot(v / px, vec2(.0671, .0058)))); // light rays: a halo around each source, masked by what is in front of it, stretched towards the pixel; per-pixel offset, grain rather than steps
        for (int k = 0; k < 4; k++) if (rayC[k] != vec3(0.)) {
          vec2 s = ray[k].xy, dd = (s - v) / 12., q; float f = 0.;
          for (int i = 0; i < 12; i++) { vec2 u = v + dd * (float(i) + j); q = (u - s) * vec2(px.y / px.x, 1.); f += step(ray[k].z, texture2D(dz, u).x) * exp(-dot(q, q) * ray[k].w); }
          q = (v - s) * vec2(px.y / px.x, 1.); ry += rayC[k] * f * max(0., 1. - 1.4 * length(q)); // range: a little more than half the screen height
        }
        gl_FragColor = vec4(bl * bloom + ry * e / 12., 1.);
      }` });
  const haloScene = new THREE.Scene(); haloScene.add(Object.assign(new THREE.Mesh(quad.geometry, halo), { frustumCulled: false }));
  // reflections of the wet road computed on screen: between the scene and the final pass. The road writes into the target's alpha how wet it is
  // (1 = dry, 0.5 = soaked, see illuminates); for each of its pixels the reflected ray is followed through the view's depth, and the colour it meets is added:
  // cars, neons, tail lights. What the ray does not find on screen (the sky, what is out of frame) stays with the ribbons and stretched reflections of the dynamic light.
  const ssr = new THREE.ShaderMaterial({
    uniforms: { t: { value: null }, dz: { value: null }, P: { value: new THREE.Matrix4() }, Pi: { value: new THREE.Matrix4() }, up: { value: new V3() }, px: { value: new THREE.Vector2() }, pe: { value: TH.reflectionSlope ? 1 : 0 }, fz: { value: +TH.reflectionWater || 0 } },
    vertexShader: post.vertexShader,
    fragmentShader: `uniform sampler2D t, dz; uniform mat4 P, Pi; uniform vec3 up; uniform vec2 px; uniform float pe, fz; varying vec2 v;
      vec3 vpos(vec2 u){ vec4 p = Pi * vec4(u * 2. - 1., texture2D(dz, u).x * 2. - 1., 1.); return p.xyz / p.w; } // position in the camera's frame
      vec2 ecran(vec3 q){ vec4 c = P * vec4(q, 1.); return c.xy / c.w * .5 + .5; }
      void main(){
        vec4 c = texture2D(t, v); float w = c.a > ${(0.95 - WATER).toFixed(2)} && c.a < .99 ? (1. - c.a) / ${WATER.toFixed(2)} : 0., trouve = 0.;
        if (w > 0.) {
          vec3 p = vpos(v), e = normalize(p), nn = up; // th.reflectionSlope: the mirror is the road surface itself (normal taken from depth) and not the horizontal plane; far away, where depth lacks precision, it falls back to vertical
          if (pe > 0.) { vec3 g = normalize(cross(dFdx(p), dFdy(p))); if (dot(g, up) < 0.) g = -g; if (dot(g, up) > .93) nn = normalize(mix(g, up, smoothstep(30., 90., -p.z))); }
          vec3 r = reflect(e, nn), q = p; float s = .4, a = 0., b = 0.; vec2 h = vec2(-1.);
          for (int i = 0; i < 22; i++) { // steps that grow longer: 0.4 m at the start, over 300 m at the end
            b = a; a += s; s *= 1.28; q = p + r * a; vec2 u = ecran(q);
            if (q.z > -.5 || u.x < 0. || u.x > 1. || u.y < 0. || u.y > 1.) break;
            float z = vpos(u).z;
            if (q.z < z && q.z > z - max(1.2, s * 2.)) { // the ray has just passed behind a surface, within one thickness: tighten between the last two steps
              for (int j = 0; j < 5; j++) { float m = (a + b) * .5; vec2 um = ecran(p + r * m); if (p.z + r.z * m < vpos(um).z) a = m; else b = m; }
              h = ecran(p + r * a); break;
            }
          }
          if (h.x >= 0.) {
            vec3 f = vec3(0.); for (int k = -2; k < 2; k++) f += texture2D(t, h + vec2(0., (float(k) + .5) * 2. * px.y)).rgb; // stretched vertically, like a reflection on water
            vec2 bd = min(h, 1. - h); trouve = smoothstep(0., .08, min(bd.x, bd.y)) * (1. - smoothstep(60., 320., a)); // fades out at the edge of the image and in the distance
            float fr = .25 + .75 * pow(1. - max(dot(-e, up), 0.), 3.); // Fresnel: seen at grazing angle, the road is a mirror
            // th.reflectionWater (standing water, strength): what still water really returns (Schlick, 2 % seen from above, a mirror at grazing angle), in place of the surface's own colour instead of added to it
            if (fz > 0.) c.rgb = mix(c.rgb, f * .25, min(1., fz * (.02 + .98 * pow(1. - max(dot(-e, nn), 0.), 5.))) * w * trouve);
            else c.rgb += f * .12 * w * fr * trouve;
          }
        }
        gl_FragColor = vec4(c.rgb, 1. - trouve); // alpha: 0 where the reflection is found; the fallback ribbons add nothing there (see fallback)
      }`,
  });
  // fallback ribbons: drawn after ssr in the same target, weighted by its alpha, hidden by what is in front of them in the scene's depth
  const FALLBACK = { rDz: { value: null }, rRes: { value: new THREE.Vector2() } }, fallbackScene = new THREE.Scene();
  const ssrScene = new THREE.Scene(), ssrQuad = new THREE.Mesh(quad.geometry, ssr); ssrQuad.frustumCulled = false; ssrScene.add(ssrQuad);
  // eye adaptation (without a style): tunnels are painted as seen by an eye already adapted to the dark; the "true" light there is TUN times weaker.
  // vu.eye = log of the light the view's eye is adapted to (0 outside, log TUN adapted to the tunnel); exposure = true light / eye light (renderView):
  // on entry the image darkens then the eye adjusts; on exit the outside dazzles (at most ×1.6) then the eye closes again, in 1 to 2 s; once adapted, the image is the painted scene, colours included.
  // (The old version measured the image's brightness and brought it back to that of the outside: a tunnel painted brighter than the night, wangan, stayed at ×0.4; a darker one, the city, capped.)
  const TUN = 0.4, EYE_N = 0.5, EYE_C = 0.35; // true light of tunnels; eye time constants (s) towards dark, towards bright; th.eye = { tun, noir, clair } replaces them for a map
  if (ST) { // final pass for styles: the scene as is, the style's effect, the HUD (always on its 270-line grid), a light vignette
    Object.assign(post.uniforms, { dz: { value: null }, scr: { value: new THREE.Vector2(1, 1) }, pallet: { value: PAL.map(c => new THREE.Color(c)) } });
    post.fragmentShader = `uniform sampler2D t, h, dz; uniform float amt, vig; uniform vec2 px, ecr; uniform vec3 pal[5]; varying vec2 v; ${AIR}
      float b2(vec2 a){ a = floor(a); return fract(a.x / 2. + a.y * a.y * .75); }
      float bayer(vec2 q){ return b2(.5 * q) * .25 + b2(q) - .5; }
      float lum(vec3 c){ return dot(c, vec3(.3, .59, .11)); }
      vec3 aplat(vec3 c, float n){ float g = sqrt(max(lum(c), 1e-4)), a = (floor(g * n) + .5) / n; return c * (a * a / (g * g)); } // brightness steps, hue kept
      float W(vec2 u){ return 1. - texture2D(dz, u).x; } // proportional to 1 / distance: affine on screen over a flat facet
      float arete(vec2 u, vec2 e){ float w = W(u); // curvature of W: zero on a facet, strong at a silhouette or a fold
        return (abs(W(u + vec2(e.x, 0.)) + W(u - vec2(e.x, 0.)) - 2. * w) + abs(W(u + vec2(0., e.y)) + W(u - vec2(0., e.y)) - 2. * w)) / max(w, 1e-6); }
      void main(){
        vec3 ai = air(v, px); vec2 u = v; ${ST.pre || ''} vec2 uh = u; u += ai.xy; // the HUD stays sharp: only the scene passes through the air
        vec3 c = texture2D(t, u).rgb * ai.z; ${ST.fx || ''}
        vec4 hd = texture2D(h, uh); c = mix(c, hd.rgb, hd.a); ${ST.ending || ''}
        ${ST.rawVal ? '' : 'vec2 d = v - vec2(.5, .42); c *= max(0., 1. - (.35 + .7 * vig) * dot(d, d));'}
        gl_FragColor = vec4(c, 1.);
      }`;
  }
  const grid = n => n > 2 ? [2, 2] : [1, n]; // columns × rows of views; at 3, the bottom-right cell stays black
  let RH = 270; const HH = 270, KL = ST ? 1 : 2; // KL: scene lines per HUD grid line (540 lines; the HUD and final-pass effects stay on the 270 grid)
  // vu.w × HH: HUD grid of a view; vu.rw × RH: its target (the same without a style); all views have the same lines
  const resize = () => {
    const OW = Math.round(innerWidth * devicePixelRatio), OH = Math.round(innerHeight * devicePixelRatio), k = ST ? (ST.h || OH) / HH * AA : KL, n = VIEWS.length; RH = Math.round(HH * k);
    const [cols, rows] = grid(n);
    for (const vu of VIEWS) { // each view takes a cell of the grid (at 2: stacked strips; at 3 or 4: 2 × 2): its grid width follows that cell's aspect, within the solo bounds, the height multiplied by the cell's elongation (a strip is n times more elongated than the screen: capped at 960, it stretched as soon as the screen went past 16/9)
      vu.w = clamp(Math.round(HH * rows / cols * innerWidth / (innerHeight || 1)), 360, 960 * rows / cols); vu.rw = Math.round(vu.w * k);
      vu.rt.setSize(vu.rw, RH); if (vu.rs) vu.rs.setSize(vu.rw, RH); if (vu.hb) vu.hb.setSize(vu.w, HH); vu.hudC.width = vu.w; vu.hudC.height = HH; vu.hg.f_ = null; vu.cam.aspect = vu.w / HH; vu.cam.updateProjectionMatrix();
    }
    if (ST) { renderer.setSize(OW, OH, false); post.uniforms.scr.value.set(OW, OH); } else if (n) renderer.setSize(VIEWS[0].w * cols * KL, HH * rows * KL, false);
    renderer.setScissorTest(n > 1); // with two players, each view's final pass only touches its own strip (see viewFrame)
    if (COM) { COM.c.width = clamp(Math.round(HH * innerWidth / (innerHeight || 1)), 360, 960); COM.c.height = HH; COM.g.f_ = null; } // the shared layer keeps the solo grid, stretched over the whole screen: menu and pause are drawn there as in solo
  };
  addEventListener('resize', resize);

  const smooth = t => { t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; return t; }; // linear filtering and mipmaps: ?smooth=1 everywhere, th.smooth or mat(…, { smooth: 1 }) for one map (docs/methods/MAP-ENGINE-OPTIONS.md)
  const tex = (w, h, draw, label) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d', { willReadFrequently: label === 'livery' || label === 'wheelCar' }));
    const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestMipmapLinearFilter; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); // MipmapLinear: blends between two mipmap levels, no more step lines moving across the ground with the camera; anisotropy at the graphics card's maximum: without it, the mipmap steps of the ground seen at grazing angles move with the car, at 10-100 m (you think you see the textures loading); never linear filtering, except ?smooth=1
    if (P('smooth') || label && TH.smooth && TH.smooth.includes(label)) smooth(t);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  };
  const R = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w, h); };

  // ---------- the three scenery entities: textures.js (the look), shapes.js (the geometry), and placement — here for the track and city, scenery-<map>.js for the other maps ----------
  const speckle = (g, n, c, h = 1, H = 64) => { for (let i = 0; i < n; i++) R(g, c, rnd() * 64 | 0, rnd() * H | 0, 1, h); };
  const veil = (g, a, f) => { g.globalAlpha = a; f(); g.globalAlpha = 1; }; // draws in transparency: grime and wear on top of any tint
  // texture name → its name before the English rename: the noise seed stays the same, so every texture looks exactly as it did
  const SEED_NAME = { paint: 'peinture', neonYellow: 'neonJaune', lampObj: 'lampe', lightRed: 'feuRouge', reflector: 'catadioptre', blinker: 'clignotant', lantern: 'lanterne', lampCanal: 'lampeCanal', concreteDark: 'betonSombre', concretePart: 'beton', concreteGray: 'betonGris', whiteBridge: 'blancPont', chalk: 'craie', stone: 'pierre', steelMat: 'acier', matGray: 'matGris', gantryGray: 'portiqueGris', castiron: 'fonte', iron: 'fer', pylonMat: 'pylone', asphalt: 'bitume', plain: 'plaine', trunk: 'tronc', trunkPalmtree: 'troncPalmier', cedar: 'cedre', foliage: 'feuillage', frond: 'palme', paneDark: 'vitreSombre', tin: 'tole', bodywork: 'carrosserie', lacquer: 'laque', warehouse: 'entrepot', metalPale: 'metalClair', wheelPart: 'roue', tire: 'pneu', radiator: 'calandre', stainless: 'inox', boards: 'planches', coil: 'bobine', strap: 'sangle', cargo: 'cargaison', lattice: 'treillis', shutters: 'persiennes', gondola: 'nacelle', lightsLane: 'feuxVoie', park: 'parc', stucco: 'crepi', brick: 'brique', tinRoof: 'toleToit', skyDef: 'ciel', orb: 'astre', roadway: 'chaussee', roadwayFine: 'chausseeFine', wallFace: 'paroi', ceiling: 'plafond', guardrail: 'glissiere', checker: 'damier', gradient: 'degrade', screenAd: 'ecranPub', streets: 'rues', casements: 'fenetres', casementsLit: 'fenetresAllumees', signboard: 'enseigne', towerFar: 'tourLoin', noise: 'bruit', written: 'ecrit', showcase: 'vitrine', dispenser: 'distributeur', pumpPetrol: 'pompeEssence', striping: 'rayures', signRoad: 'panneauRoute', towerWindows: 'tourFenetres', sidewalk: 'trottoir', slabConcrete: 'dalleBeton', mural: 'fresque', latticeGantry: 'treillisPortique', checkerStripe: 'damierBande', bannerLabel: 'bandeauNom', waterVivid: 'eauVive', rockSnow: 'rocNeige', bannerJump: 'banderoleSaut', cobbles: 'paves', slabs: 'dalles', granite: 'granit', posters: 'affiches', shopfront: 'devanture', clothStriped: 'toileRayee', kiosk: 'kiosque', pink: 'rose', lead: 'plomb', wallGothic: 'murGothique', wallFaceParis: 'paroiParis', ceilingParis: 'plafondParis', crowd: 'foule', vipBoxes: 'loges', steps: 'marches', streamer: 'banderole', grating: 'grillage', lawn: 'gazon', garageOpen: 'garageOuvert', ranking: 'classement', pylonTimer: 'pyloneChrono', terreBeaten: 'terreBattue', faceArena: 'paroiArene', bannerStade: 'banderoleStade', roofArena: 'toitArene', bannerSupporter: 'banderoleSupporter', mud: 'boue', boardStade: 'tableauStade', flame: 'flamme', beam: 'faisceau', screenGiant: 'ecranGeant', snowVirgin: 'neigeVierge', iceVivid: 'glaceVive', rockSnowFar: 'rocNeigeLoin', firSnow: 'sapinNeige', rockGivre: 'rocGivre', terreOchre: 'terreOcre', cliffOchre: 'falaiseOcre', straw: 'paille', tilesCanal: 'tuilesCanal', waterGue: 'eauGue', foam: 'ecume', mudGue: 'boueGue', terreCircuit: 'terrePiste', embankCircuit: 'talusPiste', lavender: 'lavande', bannerRallye: 'banderoleRallye', roadwayTerre: 'chausseeTerre', haze: 'brume', diamond: 'losange', vermilion: 'vermillon', stoneMoss: 'pierreMousse', furCoat: 'pelage', tileTemple: 'tuileTemple', woodTemple: 'boisTemple', gravel: 'gravier', slabsQuay: 'dallesQuai', groundPort: 'solPort', streetVille: 'rueVille', rockGES: 'rocheGES', groundGES: 'solGES', signK: 'panneauK', signKbright: 'panneauKlum', vatGroup: 'cuveGroupe', barkB: 'ecorceB', leavesB: 'feuillesB', needles: 'aiguilles', concretePO2: 'betonPO2', foamGES: 'ecumeGES', netting: 'filet', stripeOrange: 'bandeOrange', signSpd: 'panneauVit', bollardGES: 'borneGES', groundHangar: 'solHalle', concreteGES: 'betonGES', baysHangar: 'baiesHalle', mosaic: 'mosaique', letters: 'lettres', waterGES: 'eauGES', burst: 'gerbe', laneGES: 'voieGES', hazeGES: 'brumeGES', tinOrange: 'toleOrange', conifer: 'conifere', railing: 'gardeCorps', muralBarrage: 'fresqueBarrage', doorStar: 'porteEtoile', roadwayGES: 'chausseeGES', rugEdge: 'tapisBord', rugAlley: 'tapisAllee', paving: 'dallage', slabsPerse: 'dallesPerse', nichesGarden: 'nichesJardin', wallTerre: 'murTerre', frieze: 'frise', ceramic: 'faience', fluting: 'cannelure', sculpts: 'sculpte', wings: 'ailes', awning: 'auvent', stepsPerse: 'marchesPerse', palace: 'palais', cliff: 'falaise', equipment: 'appareil', facadeRaw: 'facadeCrue', strata: 'strates', lionBull: 'lionTaureau', brickRaw: 'briqueCrue', wallHall: 'murSalle', doorStone: 'portePierre', ceilingCedar: 'plafondCedre', vault: 'voute', rug: 'tapis', field: 'champ', flowerbed: 'parterre', tent: 'tente', leafShade: 'feuilleOmbre', leafCanopy: 'feuilleCanopee', leafSun: 'feuilleSoleil', leafFar: 'feuilleLoin', palmJungle: 'palmeJungle', barkJungle: 'ecorceJungle', litterMoss: 'litiereMousse', rockMoss: 'rocheMousse', siltPebbles: 'vaseGalets', waterJade: 'eauJade', waterMarsh: 'eauMarais', dropWire: 'chuteFil', rockCave: 'rocheGrotte', vaultCave: 'vouteGrotte', waterDrop: 'eauChute', foamBasin: 'ecumeBassin', sparkles: 'paillettes', slabsJungle: 'dallesJungle', slabsEdge: 'dallesBord', curbMoss: 'bordureMousse', stoneCity: 'pierreCite', stonePale: 'pierreClaire', stoneShade: 'pierreOmbre', plinthBlack: 'socleNoir', clothTent: 'toileTente', boardsBridge: 'planchesPont', bamboo: 'bambou', noiseFine: 'bruitFin', sandDry: 'sableSec', sandHard: 'sableDur', seaTurquoise: 'merTurquoise', seaWide: 'merLarge', foamSea: 'ecumeMer', slabsStreet: 'dallesRue', tiling: 'carrelage', thatch: 'chaume', limestone: 'calcaire', waterCenote: 'eauCenote', vines: 'lianes', groundGarrigue: 'solGarrigue', arcRadius: 'rayon', sandDamp: 'sableMouille', seaEdge: 'merBord', sandTraces: 'tracesSable', waterLagoon: 'eauLagune', riprap: 'enrochement', faceCave: 'paroiGrotte', waterCave: 'eauGrotte', roots: 'racines', rayCone: 'rayonCone', stain: 'tache', leavesMangrove: 'feuillesMangle', nettingVolley: 'filetVoley', rayStrong: 'rayonFort', raySoft: 'rayonDoux', streamerPlage: 'banderolePlage', bulbs: 'ampoules', pavingQuinta: 'dallageQuinta', boardsQuay: 'planchesMuelle', stuccoPale: 'crepiClair', foamWide: 'ecumeLarge', caustic: 'caustique', livery: 'livree', wheelCar: 'roueVoiture', carTrim: 'garniture', bakery: 'boulangerie', bookshop: 'librairie', pharmacy: 'pharmacie', florist: 'fleuriste', cheeseShop: 'fromagerie', butcher: 'boucherie' };
  const tx = (label, ...a) => { // one catalogue drawing, drawn fresh on each call; rand = the texture's own randomness, seeded by its name: it does not shift rnd, so not the scenery
    if (typeof TEXTURES[label] !== 'function') throw new Error('Missing texture: ' + label);
    const [w, h, d, tile] = TEXTURES[label](...a); let s = 7; for (const ch of (SEED_NAME[label] || label) + a.map(x => SEED_NAME[x] || x)) s = Math.imul(s ^ ch.charCodeAt(0), 16777619) >>> 0;
    const t = tex(w, h, g => d(g, { R, rnd, veil, speckle, rand: () => (s = s * 1664525 + 1013904223 >>> 0) / 4294967296 }), label); t.tile = tile; return t;
  };
  // a material: a catalogue texture (flat colour or drawing) and the way renderClip draws it. Options: emis = self-lit, c = tint,
  // retro / gloss = retroreflective / glossy (dynamic light), rep = repeat, net = without mipmaps, and all those of three's materials
  const mat = (label, o = {}, ...a) => {
    const { emis: lu, c, retroRefl: re, gloss: gl, rep, net, smooth: li, ...three } = o, e = TEXTURES[label], p = typeof e === 'number' ? { color: c === undefined ? e : c } : { map: tx(label, ...a) };
    if (p.map && c !== undefined) p.color = c; if (rep) p.map.repeat.set(...rep); if (li && p.map) smooth(p.map); if (net) p.map.minFilter = THREE.NearestFilter;
    const m = new THREE[lu ? 'MeshBasicMaterial' : 'MeshLambertMaterial'](Object.assign(p, three));
    if (p.map) m.userData.tile = p.map.tile; if (re) retroRefl(m, re); if (gl) gloss(m, gl); return m;
  };
  // density: on a box, a tiled texture repeats every `tile` metres instead of stretching over each face (BoxGeometry faces: ±x, ±y, ±z)
  const clothe = (g, m) => {
    const t = m && m.userData.tile, dm = g.userData.dim;
    if (t && dm && !g.userData.dressed) { g.userData.dressed = 1; const uv = g.attributes.uv, [w, h, d] = dm; for (let i = 0; i < uv.count; i++) { const f = i >> 3; uv.setXY(i, uv.getX(i) * (f ? w : d) / t, uv.getY(i) * (f === 1 ? d : h) / t); } }
    return g;
  };
  const geo = (label, ...a) => SHAPES[label](...a); // the geometry of a simple shape
  // places a shape at (x, y, z) in parent. skin = one material (simple shape, returns the Mesh) or { zone: material } (assembly, returns its Meshes)
  const pose = (label, skin, parent = scene, [x, y, z] = [0, 0, 0], ...a) => {
    const f = SHAPES[label](...a);
    if (f.isBufferGeometry) { const m = new THREE.Mesh(clothe(f, skin), skin); m.position.set(x, y, z); parent.add(m); return m; }
    return Object.entries(zones(f, skin)).map(([zn, g]) => { const m = new THREE.Mesh(g, skin[zn]); m.position.set(x, y, z); m.castShadow = !!g.userData.shadows; parent.add(m); return m; });
  };
  // an assembly merged into one geometry per zone (a single draw pass per zone); f = shape name + settings, or the list of boxes already computed
  const EUL = new THREE.Euler(), QUA = new THREE.Quaternion(), M4 = new THREE.Matrix4(), UN = new V3(1, 1, 1);
  const zones = (f, skin, ...a) => {
    if (typeof f === 'string' && typeof SHAPES[f] !== 'function') throw new Error('Missing shape: ' + f);
    const via = {};
    for (const [zn, w, h, d, px, py, pz, r, shadows] of typeof f === 'string' ? SHAPES[f](...a) : f) {
      const g = clothe(geo('boxMesh', w, h, d), skin[zn]).toNonIndexed(); M4.compose(new V3(px, py, pz), QUA.setFromEuler(EUL.set(...(r || [0, 0, 0]))), UN); g.applyMatrix4(M4);
      (via[zn] = via[zn] || { l: [], shadows: 0 }).l.push(g); if (shadows) via[zn].shadows = 1;
    }
    const out = {};
    for (const zn in via) {
      const l = via[zn].l, n = l.reduce((s, g) => s + g.attributes.position.count, 0), g = new THREE.BufferGeometry();
      for (const [k, sz] of [['position', 3], ['normal', 3], ['uv', 2]]) { const A = new Float32Array(n * sz); let o = 0; for (const p of l) { A.set(p.attributes[k].array, o); o += p.attributes[k].array.length; } g.setAttribute(k, new THREE.BufferAttribute(A, sz)); }
      g.userData.shadows = via[zn].shadows; out[zn] = g;
    }
    return out;
  };
  const GLOWI = { emis: 1 }, BRIGHT2 = { emis: 1, side: THREE.DoubleSide }; // self-lit; likewise, visible from both sides

  // sky in bands (night, dawn or dusk depending on the map), stars, moon or sun
  const skyMat = mat('skyDef', { emis: 1, side: THREE.BackSide, fog: false, net: 1 }, TH.sky, TH.stars);
  const sky = new THREE.Mesh(new THREE.SphereGeometry(2500, TH.skySeg || 48, 12), skyMat); sky.userData.dyn = 1; scene.add(sky);
  const SD = new V3(...TH.orb.dir).normalize();
  const sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({ fog: false, transparent: true, alphaTest: 0.5, depthWrite: false, map: tx('orb', TH.orb.col, TH.orb.shadows) }));
  sunDisc.scale.set(TH.orb.imgSize, TH.orb.imgSize, 1); scene.add(sunDisc);
  // th.haze: a veil of the fog's colour, 700 m around the camera, hides what escapes the fog (sky, orb, distant objects placed outside the fog); opacity = zone strength
  const veilHaze = hazeZ.length ? new THREE.Mesh(new THREE.SphereGeometry(700, 16, 10), new THREE.MeshBasicMaterial({ color: TH.fog, side: THREE.BackSide, fog: false, transparent: true, depthWrite: false, opacity: 0 })) : null;
  if (veilHaze) { veilHaze.renderOrder = 50; veilHaze.visible = false; veilHaze.frustumCulled = false; veilHaze.userData.dyn = 1; scene.add(veilHaze); }

  const hemi = new THREE.HemisphereLight(TH.hemi[0], TH.hemi[1], TH.hemi[2] * Math.PI); scene.add(hemi); // blue from above, magenta bounce of the city
  const sun = new THREE.DirectionalLight(TH.sun[0], TH.sun[1] * Math.PI); sun.castShadow = true; const SHDD = 2, SHDI = 3, SHDF = 4, shdM = []; // shdM: the objects of the SHDD and SHDI layers (see shadows) // moonlight; SHDD, SHDI: layers of the moving objects that cast a shadow, simple and instanced (see shadows)
  // th.shadows = { imgSize, field, soft } (docs/methods/MAP-ENGINE-OPTIONS.md): side of the shadow map in texels (2048), half-side covered in m (390), bilinear edge filtering (4 reads instead of one)
  const SHDO = TH.shadows || {}, OTX = SHDO.imgSize || 2048, OCH = SHDO.field || 300 * FAR;
  sun.shadow.mapSize.set(OTX, OTX); sun.shadow.bias = -0.0015; sun.shadow.normalBias = 0.5;
  Object.assign(sun.shadow.camera, { left: -OCH, right: OCH, top: OCH, bottom: -OCH, near: 10, far: 800 * FAR });
  scene.add(sun, sun.target);

  // ---------- dynamic light: a single calculation, added to the shader of all the scene's materials (onBeforeCompile) ----------
  // Sky and moon/sun stay as three's (with their shadow). Everything else is computed here, per pixel, with the facet's normal:
  // NL point light fixtures (the nearest along the track + car lights), the headlight beam with a hard cut-off,
  // the shadow of the view's car and of its two nearest vehicles by ray tracing on their boxes (it sweeps the road and walls at each light fixture passed; the two others also cut the headlight beam),
  // and on shiny surfaces (wet road, puddles = texture alpha, bodywork) the stretched reflection of each source.
  const BRIGHTS = [], emis = (i, x, y, z, col, r, k = 1, tun = 0) => { const l = { i, x, y, z, c: new THREE.Color(col).multiplyScalar(k), r, tun }; BRIGHTS.push(l); return l; }; // renders the light: a scenery piece can make its colour (l.c) breathe in its tick (Chapada campfire)
  const NIGHT_COL = TH.headlights / 2.6; // strength of car lights: full at night, weak at dawn and dusk
  let headlightsV = TH.headlights, nightV = NIGHT_COL; // th.headlightsHaze: inside a haze bank (th.haze with four values), the cars' lights come on at this strength, in proportion to the bank; without the option, headlightsV = TH.headlights and nightV = NIGHT_COL
  const SUNC = new THREE.Color(TH.sun[0]).multiplyScalar(TH.sun[1]);
  const LUX = { uLP: { value: Float32Array.from({ length: NL * 4 }, (_, i) => i % 4 === 3 ? 1 : 0) }, uLC: { value: new Float32Array(NL * 3) }, // flat: three is passed the array as-is instead of copying 20 vectors at each draw pass
   
    uHP: { value: new V3() }, uHD: { value: new V3(1, 0, 0) }, uHC: { value: new THREE.Color(0xfff2d0).multiplyScalar(TH.headlights * 1.1 * BRIGHT_GAIN) }, uBox: { value: new Float32Array(48) }, uNB: { value: 1 }, // uBox: 3 shadow boxes (the view's car, then its two nearest cars), uNB of them in use
   
    uSunD: { value: SD }, uCam: { value: new V3() }, uSunC: { value: new THREE.Color() }, uSky: { value: new THREE.Color() }, uN: { value: 0 }, uRes: { value: new THREE.Vector2() } };
  const LU_V = `{ vec4 lw = vec4(transformed, 1.);
    #ifdef USE_INSTANCING
      lw = instanceMatrix * lw;
    #endif
    vLw = (modelMatrix * lw).xyz;
    if (uRes.x > 0.) gl_Position.xy = floor(gl_Position.xy / gl_Position.w * uRes + .5) / uRes * gl_Position.w;
    #ifdef USE_MAP
      vAf = vec3(vMapUv, 1.) * gl_Position.w;
    #endif
    }
    `;
  const LU_H = `#define NL ${NL}
    #ifdef MOUILLE
      uniform sampler2D uMo; varying vec2 vMo;
    #endif
    uniform vec4 uLP[NL]; uniform vec3 uLC[NL]; uniform vec3 uHP, uHD, uHC, uSunD, uSunC, uSky, uCam; uniform mat4 uBox[3]; uniform float uGloss, uRetro; uniform int uN, uNB; varying vec3 vLw;
    float luOmbre(vec3 p, vec3 d, int i0) { // 0 if a car's box (from box i0 on: 0 = the view's car, then its two nearest cars) cuts the segment p → p + d; a point inside a box or on its surface is not shadowed
      for (int k = i0; k < uNB; k++) {
        vec3 o = (uBox[k] * vec4(p, 1.)).xyz, iv = 1. / (mat3(uBox[k]) * d + 1e-5), t0 = (-1. - o) * iv, t1 = (1. - o) * iv, mn = min(t0, t1), mx = max(t0, t1);
        float a = max(max(mn.x, mn.y), mn.z), b = min(min(mx.x, mx.y), mx.z);
        if (a < b && a > .005 && a < 1.) return 0.;
      }
      return 1.;
    }
    `;
  const LU_F = `{
      vec3 n = normalize(cross(dFdx(vLw), dFdy(vLw))), v = normalize(uCam - vLw); // uCam rather than cameraPosition: three does not supply it for Basic and Lambert materials (it stays at the world origin)
      if (dot(n, v) < 0.) n = -n;
      float g = uGloss + (1. - diffuseColor.a) * 2., plat = step(.8, n.y);
      #ifdef MOUILLE
        vec4 mo = texture2D(uMo, vec2(vMo.x, fract(vMo.y))); mo.r = smoothstep(.15, .85, mo.r); // r = race wetness, g = rain (see MOTOR); half dry, it already shows
        g = mix(g, mix(0., max(g, .25), mo.r), mo.g); // under rain: the dry line is matte, the rest shines
      #endif
      vec3 dif = vec3(0.), spe = vec3(0.); vec2 rh = normalize(reflect(-v, n).xz + 1e-4);
      for (int i = 0; i < NL; i++) {
        if (i >= uN) break; // only the lights that are on
        vec3 d = uLP[i].xyz - vLw; float a = 1. - dot(d, d) / (uLP[i].w * uLP[i].w);
        if (a <= 0.) continue;
        if (uLP[i].w > 0.) a *= luOmbre(vLw, d, 0); vec3 l = normalize(d); // negative range: light carried by the car, which does not cast the shadow of its own box
        dif += uLC[i] * (a * a * max(dot(n, l), 0.));
        if (g > 0.) spe += uLC[i] * (a * mix(pow(max(dot(n, normalize(l + v)), 0.), 24.), pow(max(dot(rh, normalize(l.xz + 1e-4)), 0.), 40.), plat));
      }
      if (g > 0.) { float so = 1.; // the sun's streak stops in the shade (same shadow read as three's own lighting)
      #if defined(USE_SHADOWMAP) && NUM_DIR_LIGHT_SHADOWS > 0 && (defined(LAMBERT) || defined(PHONG))
        if (plat > 0.) so = // even on a mesh that takes no shadow itself (a water plane over the road)
getShadow(directionalShadowMap[0], directionalLightShadows[0].shadowMapSize, directionalLightShadows[0].shadowIntensity, directionalLightShadows[0].shadowBias, directionalLightShadows[0].shadowRadius, vDirectionalShadowCoord[0]);
      #endif
        spe += plat * (uSunC * so * pow(max(dot(rh, normalize(uSunD.xz)), 0.), 50.) * 3.5 + uSky * .18); }
      vec3 hv = vLw - uHP; float f = dot(hv, uHD);
      if (f > .5) { // phares : faisceau large, coupure horizontale nette (feu de croisement)
        vec3 hr = normalize(vec3(-uHD.z, 0., uHD.x));
        float m = smoothstep(1.3, .6, abs(dot(hv, hr)) / f) / (1. + f * f * .0006), lo = m * smoothstep(.3, .02, dot(hv, cross(hr, uHD)) / f) * smoothstep(75., 25., f) * luOmbre(vLw, -hv, 1); // the nearest cars cut the beam; softened cutoff: a road going uphill no longer makes a hard line
        dif += uHC * (lo * (.45 + .55 * max(dot(n, -normalize(hv)), 0.)));
        if (uRetro > 0.) dif += uHC * (m * uRetro); // reflectors and signs: return the beam, even above the cutoff
      }
      if (uRetro > 0.) gl_FragColor.rgb *= .3;
      gl_FragColor.rgb *= .55 + .45 * diffuseColor.a; // water darkens the ground
      #ifdef MOUILLE
        gl_FragColor.rgb *= 1. - .35 * mo.g * (1. - mo.r); // and the dry line, rubber and dust, darker still
      #endif
      #ifdef MOUVIS
        gl_FragColor.rgb *= 1. - .3 * mo.g * mo.r; // th.wetVisible: wet asphalt is darker (rain alone does not darken it: rendering of rain maps unchanged)
      #endif
      gl_FragColor.rgb += 1. - exp(-1.3 * (diffuseColor.rgb + .07) * dif) + spe * (g * (.12 + pow(1. - max(dot(n, v), 0.), 3.))); // even dark asphalt responds; light tones saturate gently
    }
    `;
  const SHD_SOFT = THREE.ShaderChunk.shadowmap_pars_fragment.replace(/float depth = texture2D\( shadowMap, shadowCoord\.xy \)\.r;[\s\S]*?#endif/, `vec2 tp = shadowCoord.xy * shadowMapSize - .5, fp = fract(tp), b0 = (floor(tp) + .5) / shadowMapSize, dt = 1. / shadowMapSize;
        shadow = mix(mix(step(shadowCoord.z, texture2D(shadowMap, b0).r), step(shadowCoord.z, texture2D(shadowMap, b0 + vec2(dt.x, 0.)).r), fp.x),
          mix(step(shadowCoord.z, texture2D(shadowMap, b0 + vec2(0., dt.y)).r), step(shadowCoord.z, texture2D(shadowMap, b0 + dt).r), fp.x), fp.y);`); // getShadow of BasicShadowMap in bilinear (non-inverted depth, the game's own)
  const illuminates = m => { // attaches a material to the dynamic light; userData.gloss = glossiness, userData.retroRefl = retroreflective
    if (m.userData.lu || !(m.isMeshBasicMaterial || m.isMeshLambertMaterial || m.isMeshPhongMaterial)) return;
    m.userData.lu = 1;
    const readQ = m.fog !== false && m.blending === THREE.NormalBlending; // the sky and additive planes receive nothing, but shake with the rest
    // alpha of the target, read by ssr: the road writes into it how wet it is (rain of the sample, puddles on top), any other opaque writes 1 (otherwise a holed texture would look like water)
    const limp = SSR && m.userData.limp ? 1 : 0, opaque = SSR && !m.transparent ? 1 : 0;
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, LUX, { uGloss: { value: m.userData.gloss || 0 }, uRetro: { value: m.userData.retroRefl || 0 } });
      if (m.userData.mo) { // the open-air road: vMo = (across, sample) in MOTOR; uv.y = sample / 16 from T.t1 (ribbon, vLen 32)
        Object.assign(sh.uniforms, { uMo: { value: MOTOR }, uMoN: { value: new THREE.Vector2((m.userData.mo0 ?? T.t1) + 0.5, N) } });
        sh.vertexShader = '#define MOUILLE\nuniform vec2 uMoN; varying vec2 vMo;\n' + sh.vertexShader.replace('#include <fog_vertex>', 'vMo = vec2(uv.x, (uv.y * 16. + uMoN.x) / uMoN.y);\n#include <fog_vertex>');
      }
      sh.vertexShader = 'varying vec3 vLw, vAf; uniform vec2 uRes;\n' + sh.vertexShader.replace('#include <fog_vertex>', LU_V + '#include <fog_vertex>');
      if (readQ) sh.fragmentShader = LU_H + sh.fragmentShader.replace('#include <fog_fragment>', LU_F + '#include <fog_fragment>');
      if (limp) { sh.vertexShader = 'attribute float mou; varying float vMou;\n' + sh.vertexShader.replace('#include <fog_vertex>', 'vMou = mou;\n#include <fog_vertex>'); sh.fragmentShader = 'varying float vMou;\n' + sh.fragmentShader; }
      if (opaque) sh.fragmentShader = sh.fragmentShader.replace('#include <fog_fragment>', (limp ? `gl_FragColor.a = 1. - ${WATER.toFixed(2)} * clamp(vMou * .3 + (1. - diffuseColor.a) * min(vMou, 1.), 0., 1.);` : 'gl_FragColor.a = 1.;') + '\n#include <fog_fragment>');
      // textures without perspective correction: vAf = uv × w, interpolated then divided by interpolated w, gives back the affine interpolation on screen
      if (ST && ST.affine) sh.fragmentShader = 'varying vec3 vAf;\n' + sh.fragmentShader.replace('#include <map_fragment>', THREE.ShaderChunk.map_fragment.replace('vMapUv', `mix(vMapUv, vAf.xy / vAf.z, ${ST.affine.toFixed(3)})`));
      if (SHDO.soft) sh.fragmentShader = sh.fragmentShader.replace('#include <shadowmap_pars_fragment>', SHD_SOFT); // th.shadows.soft: filtered shadow edges (4 reads) instead of stair-stepped texels
      const co = m.userData.layerSet; if (co) { // multi-material terrain (scenery.js, terrain: o.layerSet or th.layerSet): up to 4 textures blended per vertex, weights in the layer attribute
        sh.uniforms.uCr = { value: new THREE.Vector4(...[0, 1, 2, 3].map(i => co[i] ? co[i].rep : 1)) }; co.forEach((c, i) => sh.uniforms['uC' + i] = { value: c.map });
        sh.vertexShader = 'attribute vec4 layer; varying vec4 vCo;\n' + sh.vertexShader.replace('#include <fog_vertex>', 'vCo = layer;\n#include <fog_vertex>');
        sh.fragmentShader = 'varying vec4 vCo; uniform vec4 uCr;\n' + co.map((c, i) => 'uniform sampler2D uC' + i + ';\n').join('') + sh.fragmentShader.replace('#include <map_fragment>', THREE.ShaderChunk.map_fragment)
          .replace('diffuseColor *= sampledDiffuseColor;', co.map((c, i) => `sampledDiffuseColor = mix(sampledDiffuseColor, texture2D(uC${i}, vMapUv * uCr[${i}]), vCo[${i}]);\n`).join('') + 'diffuseColor *= sampledDiffuseColor;');
      }
      if (m.userData.mo) sh.fragmentShader = '#define MOUILLE\n' + (MV ? '#define MOUVIS\n' : '') + sh.fragmentShader; // at the top, before LU_H which uses it
      sh.fragmentShader = '#undef OPAQUE\n' + sh.fragmentShader; // r151+ forces the alpha of opaques to 1 before fog_fragment: the puddles (texture alpha) and the wetness read it
    };
    m.customProgramCacheKey = () => 'lu' + readQ + opaque + limp + (m.userData.mo ? 'mo' + (MV ? 'mv' : '') + (m.userData.mo0 ?? '') : '') + (SHDO.soft ? 'od' : '') + (m.userData.layerSet ? 'c' + m.userData.layerSet.length : '');
  };
  const gloss = (m, g) => { m.userData.gloss = g; return m; }, retroRefl = (m, r = 1.5) => { m.userData.retroRefl = r; return m; };

  // ---------- additive materials (reflections, beams, holograms) ----------
  const addMat = (map, o = {}) => new THREE.MeshBasicMaterial(Object.assign({ map, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }, o));
  const adMasts = [];
  // fallback reflection (under rain only): taken out of the scene, drawn after ssr (see FALLBACK) where the computed reflection found nothing, instead of adding to it there
  const fallback = o => {
    if (!SSR) return o;
    scene.remove(o); fallbackScene.add(o); if (o.isInstancedMesh) o.frustumCulled = false;
    const m = o.material; illuminates(m); const f = m.onBeforeCompile, k = m.customProgramCacheKey;
    Object.assign(m, { blending: THREE.CustomBlending, blendSrc: THREE.DstAlphaFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor });
    m.onBeforeCompile = sh => { f(sh); Object.assign(sh.uniforms, FALLBACK);
      sh.fragmentShader = 'uniform sampler2D rDz; uniform vec2 rRes;\n' + sh.fragmentShader.replace('void main() {', 'void main() {\n  if (texture2D(rDz, gl_FragCoord.xy / rRes).x < gl_FragCoord.z - 1e-6) discard;')
        .replace('#include <dithering_fragment>', '#include <dithering_fragment>\n  gl_FragColor.rgb *= gl_FragColor.a;'); }; // the old additive blend multiplied by the texture's alpha: it is done here
    m.customProgramCacheKey = () => k() + 'fallback'; return o;
  };

  backdrop && await whoosh();
  // ---------- track geometry (heights relative to the road's altitude) ----------
  function ribbon(i0, cnt, oa, ya, ob, yb, mat, vLen = 8) { // oa, ya, ob, yb: constants, or functions of the sample (variable width and height)
    const pos = [], uv = [], idx = [], f = (o, s) => typeof o === 'function' ? o(s) : o;
    for (let k = 0; k <= cnt; k++) {
      const s = S[(i0 + k) % N], nx = -s.tz, nz = s.tx;
      pos.push(s.x + nx * f(oa, s), s.y + f(ya, s), s.z + nz * f(oa, s), s.x + nx * f(ob, s), s.y + f(yb, s), s.z + nz * f(ob, s)); uv.push(0, k * 2 / vLen, 1, k * 2 / vLen);
      if (k < cnt) { const a = k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat); m.receiveShadow = true; scene.add(m); return m;
  }
  // wetness for drawing: texture MO.nbr × N (bands across from -W to W × samples), red = race wetness (R.mo, see MO in sim.js; 1 off-race), green = rain of the sample (0 to 1)
  // A shader that wants to know if the road is wet reads MOTOR: wetness = red × green. Refreshed every 8 frames (moMaj).
  const SELF = new Uint8Array(N * MO.nbr * 4).fill(255), MOTOR = new THREE.DataTexture(SELF, MO.nbr, N, THREE.RGBAFormat); MOTOR.magFilter = MOTOR.minFilter = THREE.LinearFilter; MOTOR.k = 0;
  for (let k = 0; k < N * MO.nbr; k++) SELF[k * 4 + 1] = Math.min(1, mouAt(k / MO.nbr | 0)) * 255; MOTOR.needsUpdate = true;
  const moMaj = () => { const mo = race && race.mo; if (!mo && !MOTOR.dirty || ++MOTOR.k & 7) return; for (let k = 0; k < N * MO.nbr; k++) SELF[k * 4] = mo ? mo[k] * 255 : 255; MOTOR.dirty = !!mo; MOTOR.needsUpdate = true; }; // every 8 frames: the dry road slowly dries, and each upload is the whole texture
  const across = s => Math.atan2(-s.tx, -s.tz); // Y rotation that puts the local X axis across the road
  const box = (w, h, d, mat, x, y, z, parent = scene) => { const m = new THREE.Mesh(clothe(geo('boxMesh', w, h, d), mat), mat); m.position.set(x, y, z); parent.add(m); return m; };

  const cT = T.t1 - T.t0, cO = N - cT; // no tunnel: cT = 0, the open-air road goes all the way round
  // road: wet, it returns the lights, neons, moon or sun as stretched reflections (dynamic light)
  const road = ribbon(T.t1, cO, -W, 0, W, 0, mat(TH.roadTex || 'roadway', { // th.roadTex: another roadway drawing, same th.road settings (roadwayFine: textures.js)
    side: THREE.DoubleSide, gloss: TH.gloss ?? (TH.road[6] ? 0.2 : 0.08) }, ...TH.road), 32); /* th.gloss: another gloss of the roadway (reflection of the sun and of the light fixtures) */ road.material.userData.mo = 1;
  if (SSR) { road.material.userData.limp = 1; road.geometry.setAttribute('limp', new THREE.Float32BufferAttribute(Array.from({ length: (cO + 1) * 2 }, (_, j) => mouAt((T.t1 + (j >> 1)) % N)), 1)); } // rain per sample: ssr only reflects where it rains
  const barrier = mat('guardrail', { emis: TH.tubes, side: THREE.DoubleSide }, TH.intoWall); // city: neon edge strip, self-lit; elsewhere the guardrail takes the light
  const WALL_SIDES = { '-1': [], 1: [] }; // the guardrails on each side (-1 and +1), bands { M, i0, n } that keep the shape of impacts (see "scenery that gets damaged"); h.guardM adds those of the scenery to them
  const wallStrip = (sg, i0, n, ...r) => { const M = ribbon(i0, n, ...r); WALL_SIDES[sg].push({ M, i0, n }); return M; };
  if (!T.vert) { wallStrip(-1, T.t1, cO, -W, TH.wallH, -W, -2, barrier); wallStrip(1, T.t1, cO, W, TH.wallH, W, -2, barrier); }
  else { // relief map: the guardrail follows the top of the drivable walls, and each wall is a quarter tube in 16 facets, from the foot of the flat to the wall
    const high = s => wallFace(s, s.w), tube = mat(TH.wallFace || 'concretePart', { side: THREE.DoubleSide });
    for (const sg of [-1, 1]) {
      if (TH.guardM ?? 1) wallStrip(sg, T.t1, cO, s => sg * s.w, s => high(s) + TH.wallH, s => sg * s.w, s => high(s) - 2, barrier); // th.guardM = 0: the scenery places its own guardrails (stadium: not on the central area), this one would double its own
      for (let i = 0; i < N; i++) if (S[i].rc && !S[(i - 1 + N) % N].rc) { let c = 0; while (S[(i + c + 1) % N].rc) c++;
        for (let j = 0; j < 16; j++) { const o = k => s => sg * (W + (s.w - W) * k / 16), y = k => s => wallFace(s, W + (s.w - W) * k / 16); ribbon(i, c, o(j), y(j), o(j + 1), y(j + 1), tube, 16); } } // 16 facets: with 6, the chord passed up to 0.7 m above the wall of sim.js, the car sank into it
    }
  }
  const concrete = mat('concreteDark', { side: THREE.DoubleSide }), glowY = mat('neonYellow', GLOWI), glowC = mat('neonCyan', GLOWI), glowM = mat('neonMagenta', GLOWI);
  // tunnel: dark interior, lit by its light fixtures (on the city: interchange in red alarm pulsing with the music), dark hull
  const tunMats = [];
  if (T.tun) {
    const u = TH.tun;
    // tunnel shape (docs/methods/MAP-ENGINE-OPTIONS.md): th.tun.h (height under vault, 8 m), th.tun.vault (vault arc, 0 = flat ceiling), th.tun.opn (ceiling openings [[f0, f1], …]),
    // th.tun.spokes (colour of the light columns under the openings). h and vault: a number, keys [[f, value], …] or a function (f, s); f = 0 at entry, 1 at exitAt.
    // With one of them, walls and floor follow the drivable half-width s.w (M.wide of sim.js: the physics walls) instead of W. Without them, nothing changes.
    let ground; const FT = u.h != null || !!u.vault || !!u.opn, FI = new Map(); for (let k = 0; k <= cT; k++) FI.set(S[(T.t0 + k) % N], k / cT);
    const val = (v, d) => s => { const f = FI.get(s) ?? 0; if (v == null) return d; if (typeof v === 'number') return v; if (typeof v === 'function') return v(f, s);
      let j = 0; while (j < v.length - 1 && v[j + 1][0] < f) j++; const [fa, a] = v[j], [fb, b] = v[Math.min(j + 1, v.length - 1)]; return fb > fa ? a + (b - a) * clamp((f - fa) / (fb - fa), 0, 1) : a; };
    const tw = FT ? s => s.w : () => W, hh = val(u.h, 8), vt = val(u.vault, 0), hm = s => hh(s) - vt(s), ceilingFn = (s, x) => hm(s) + vt(s) * Math.sqrt(Math.max(0, 1 - (x / tw(s)) ** 2));
    const WITHOUT = new Set(u.without || []); // th.tun.without: what the engine does not place: 'portals', 'fixtures' (the lights stay, without their housings); 'lightSet': no fixture light, only the daylight from the openings; 'faces': neither walls, vault nor hull, the map's scenery makes them
    const isOpen = k => (u.opn || []).some(([a, b]) => k >= a * cT && k <= b * cT), facets = [] /* ceiling: pieces [start, length] outside the openings */;
    for (let k = 0, a = -1; k <= cT; k++) { const o = isOpen(k) || k === cT; if (!o && a < 0) a = k; if (o && a >= 0) { facets.push([a, k - a + (k === cT && !isOpen(k))]); a = -1; } }
    tunMats.push(mat('roadway', { emis: 1, side: THREE.DoubleSide, gloss: u.gloss ?? 0.3 }, ...u.ground), mat((u.tex || [])[0] || 'wallFace', BRIGHT2, u.wallMeshes[0], u.wallFace, u.tiles), mat((u.tex || [])[0] || 'wallFace', BRIGHT2, u.wallMeshes[1], u.wallFace, u.tiles), mat((u.tex || [])[1] || 'ceiling', BRIGHT2, u.ceiling)); /* th.tun.tex: other textures of the walls and vault (chapada: the cave rock) */
    tunMats.forEach((m, i) => m.color.setScalar(m.userData.amb = TH.alarm && (i === 1 || i === 2) ? 0.85 : u.ambient ?? TUN_AMB)); // th.tun.ambient: other ambient under the vault; city: the walls keep their vivid neon bands
    { // light fixtures staggered, one left, one right: the car's light and shadow switch sides at each fixture passed
      const d = new THREE.Object3D(), fx = u.neons.map(c => new THREE.InstancedMesh(geo('fixtureTunnel'), mat('paint', { emis: 1, c, fog: false }), Math.ceil(cT / BRIGHT_STEP))), nf = [0, 0], fallbackMat = mat('paint', { emis: 1, c: u.portal }); // fallback: one material for all the boxes (one per box left them out of the merge, one draw pass each)
      for (let i = T.t0 + 2, k = 0; i < T.t1 - 1; i += BRIGHT_STEP, k++) {
        const s = S[i % N], sd = k & 1 ? 1 : -1, x = s.x - s.tz * sd * (tw(s) - 1.7), z = s.z + s.tx * sd * (tw(s) - 1.7), yl = FT ? ceilingFn(s, tw(s) - 1.7) - 0.15 : 7.85;
        if (FT && isOpen(i - T.t0)) continue;
        if (!WITHOUT.has('lights')) emis(i % N, x, s.y + yl - 0.65, z, u.neons[k & 1], 21, 3, 1);
        if (WITHOUT.has('lamps')) continue;
        d.position.set(x, s.y + yl, z); d.rotation.set(0, across(s), 0); d.updateMatrix(); fx[k & 1].setMatrixAt(nf[k & 1]++, d.matrix);
        if (k % 6 === 3) pose('casingRescue', fallbackMat, scene, [s.x - s.tz * (tw(s) - 0.1), s.y + 2.6, s.z + s.tx * (tw(s) - 0.1)]).rotation.y = across(s); // illuminated emergency housing on the right wall
      }
      fx.forEach((m, c) => { m.count = nf[c]; scene.add(m); });
    }
    if (!FT) {
      ground = ribbon(T.t0, cT, -W, 0, W, 0, tunMats[0], 32);
      ribbon(T.t0, cT, -W, 8, -W, 0, tunMats[1]); ribbon(T.t0, cT, W, 8, W, 0, tunMats[2]); ribbon(T.t0, cT, -W, 8, W, 8, tunMats[3]);
      for (const [oa, ya, ob, yb] of [[-W - 1.5, 10, -W - 1.5, -u.hull], [W + 1.5, 10, W + 1.5, -u.hull], [-W - 1.5, 10, W + 1.5, 10]]) ribbon(T.t0, cT, oa, ya, ob, yb, concrete).castShadow = true;
    } else {
      const ng = s => -tw(s), ps = tw, dh = s => hh(s) + 2, NV = 10; // vault: NV facets of a half-ellipse, from the springings (hm) to the keystone (hh)
      ground = ribbon(T.t0, cT, ng, 0, ps, 0, tunMats[0], 32);
      if (!WITHOUT.has('walls')) { ribbon(T.t0, cT, ng, hm, ng, 0, tunMats[1]); ribbon(T.t0, cT, ps, hm, ps, 0, tunMats[2]); }
      if (!WITHOUT.has('walls')) for (const sg of [-1, 1]) ribbon(T.t0, cT, s => sg * (tw(s) + 1.5), dh, s => sg * (tw(s) + 1.5), -u.hull, concrete).castShadow = true;
      if (!WITHOUT.has('walls')) for (const [a, n] of facets) { // (each facet is a separate ribbon, merged afterwards with those of its material: see "fixed scenery merge")
        for (let j = 0; j < NV; j++) { const x = q => s => -tw(s) * Math.cos(Math.PI * q / NV), y = q => s => hm(s) + vt(s) * Math.sin(Math.PI * q / NV); ribbon(T.t0 + a, n, x(j), y(j), x(j + 1), y(j + 1), tunMats[3]); }
        ribbon(T.t0 + a, n, s => -tw(s) - 1.5, dh, s => tw(s) + 1.5, dh, concrete).castShadow = true;
      }
      if (u.spokes) for (const [fa, fb] of u.opn || []) { // one light column per opening, leaning towards the orb, and the light patch it casts on the ground
        const ka = Math.ceil(fa * cT), kb = Math.floor(fb * cT), s = S[(T.t0 + (ka + kb >> 1)) % N], ax = new V3(0, 1, 0).lerp(SD, 0.35).normalize(), h = hh(s), L = h / ax.y;
        const r = Math.max(1, Math.min(tw(s) * 0.7, Math.hypot(S[(T.t0 + kb) % N].x - S[(T.t0 + ka) % N].x, S[(T.t0 + kb) % N].z - S[(T.t0 + ka) % N].z) * 0.45));
        const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.25, L, 16, 1, true), addMat(tx('gradient', u.spokes, 1), { opacity: u.raysK ?? 0.55, polygonOffset: false }));
        m.quaternion.setFromUnitVectors(new V3(0, -1, 0), ax.clone().negate()); m.position.set(s.x, s.y + h, s.z).addScaledVector(ax, -L / 2); m.scale.y = -1; scene.add(m); // scale.y = -1: the bright gradient at the top, fading out at the ground
        const foot = new V3(s.x, s.y + h, s.z).addScaledVector(ax, -L); emis((T.t0 + (ka + kb >> 1)) % N, foot.x, s.y + 2.5, foot.z, u.spokes, r * 2.5, 2); // the foot of the column, at ground level
      }
    }
    if (MV) { tunMats[0].userData.mo = 1; tunMats[0].userData.mo0 = T.t0; if (SSR) { tunMats[0].userData.limp = 1; ground.geometry.setAttribute('limp', new THREE.Float32BufferAttribute(Array.from({ length: (cT + 1) * 2 }, (_, j) => mouAt((T.t0 + (j >> 1)) % N)), 1)); } } // th.wetVisible: the tunnel floor also reads MOTOR
    const pm = mat('paint', { emis: 1, c: u.portal });
    if (!WITHOUT.has('gates')) for (const i of [T.t0, T.t1]) { // portails lumineux
      const s = S[i], g = new THREE.Group(); g.position.set(s.x, s.y, s.z); g.rotation.y = across(s); scene.add(g);
      pose('portalTunnel', { portal: pm }, g, [0, 0, 0], tw(s)); if (FT) g.scale.y = hh(s) / 8;
    }
  }
  const LIGHTS = []; // the three gantry lights, one per countdown digit
  { // start line and gantry
    const s = S[0], g = new THREE.Group(); g.position.set(s.x, s.y, s.z); g.rotation.y = across(s); scene.add(g);
    const css = n => '#' + n.toString(16).padStart(6, '0'), acc = css(TH.startLine[0]), framework = css(TH.startLine[1]);
    pose(TH.startLine[3] || 'startLine', { // th.startLine[3]: other gantry shape, same zones (chapada: bamboo); without it, the steel gantry
      ground: mat('checkerStripe', { emis: 1, net: 1 }, TH.startLine[2], 1), checker: mat('checkerStripe', { emis: 1, net: 1 }, TH.startLine[2], 0.45),
      concretePart: mat('concretePart'), steelMat: mat('steelMat', { c: TH.startLine[1] }), lattice: mat('latticeGantry', { alphaTest: 0.5, side: THREE.DoubleSide }, framework),
      label: mat('bannerLabel', { emis: 1, net: 1 }, acc, M.label, TH.startLine[2]), casing: mat('matGray'), light0: LIGHTS[0] = mat('paint', { emis: 1 }), light1: LIGHTS[1] = mat('paint', { emis: 1 }), light2: LIGHTS[2] = mat('paint', { emis: 1 }), lampObj: mat('lampObj', { emis: 1 }),
    }, g, [0, 0, 0], W);
    emis(0, s.x, s.y + 8, s.z, 0xfff2d0, 18, 0.5); // gantry lighting: subdued, otherwise the start dazzles
  }
  { // chevrons on the outside of corners, viaduct piers, neon tubes on the roadside (speed markers)
    const dummy = new THREE.Object3D();
    const sg = [0, 1].map(f => new THREE.InstancedMesh(geo('chevron'), mat(TH.chevTex || 'chevron', { emis: 1, side: THREE.DoubleSide, retroRefl: 1.5 }, f), 600)), cnt = [0, 0]; // retroreflectors: they light up in the headlights
    const poles = new THREE.InstancedMesh(geo('boxMesh', 0.14, 5.4, 0.14), mat('matGray'), 1200); let npo = 0; // two posts under each corner sign: it is a real sign, not an interface marker (in a tunnel, it is fixed to the wall)
    const piers = new THREE.InstancedMesh(clothe(geo('pierViaduct'), concrete), concrete, Math.ceil(N / 30) + 1); let np = 0; // one pier every 30 samples at most (60 places spilled over onto wangan: the extra piers became NaN pieces in the merge)
    const tubes = [glowM, glowC].map(m => new THREE.InstancedMesh(geo('tubeNeon'), m, 200)), nt = [0, 0];
    const streaks = ['#ff2bd6', '#00f0ff'].map(c => new THREE.InstancedMesh(geo('reflectionTube'), addMat(tx('gradient', c)), 200));
    for (let i = 0; i < N; i++) {
      const s = S[i], nx = -s.tz, nz = s.tx, inT = zone(i, 0) === 1;
      dummy.scale.set(1, 1, 1); dummy.rotation.set(0, across(s), 0);
      if (TH.tubes && i % 10 === 0 && !inT) { const k = i / 10, sd = (k >> 1) & 1 ? 1 : -1; emis(i, s.x + nx * sd * (W - 0.5), s.y + 3, s.z + nz * sd * (W - 0.5), [0xff2bd6, 0x00f0ff][(k & 1) ^ (sd > 0 ? 1 : 0)], 17, 0.8); } // one tube in two really lights: magenta, cyan, one side then the other
      if (TH.tubes && i % 10 === 0 && !inT) for (const sd of [-1, 1]) {
        const c = (i / 10 & 1) ^ (sd > 0 ? 1 : 0);
        dummy.position.set(s.x + nx * sd * (W + 0.9), s.y + 3.5, s.z + nz * sd * (W + 0.9)); dummy.updateMatrix(); tubes[c].setMatrixAt(nt[c], dummy.matrix);
        dummy.rotation.order = 'YXZ'; dummy.rotation.set(-Math.PI / 2, across(s), 0); dummy.scale.set(sd > 0 ? -1 : 1, 1, 1); // flat, lit side facing the tube
        dummy.position.set(s.x + nx * sd * (W - 3.2), s.y + 0.05, s.z + nz * sd * (W - 3.2)); dummy.updateMatrix(); streaks[c].setMatrixAt(nt[c]++, dummy.matrix);
        dummy.rotation.order = 'XYZ'; dummy.rotation.set(0, across(s), 0); dummy.scale.set(1, 1, 1);
      }
      if (TH.piers != null && i % 30 === 0 && !inT) { const b = TH.piers + 1; dummy.position.set(s.x, (s.y - 1 + b) / 2, s.z); dummy.scale.set(1, Math.max(0.1, s.y - 1 - b), 1); dummy.updateMatrix(); piers.setMatrixAt(np++, dummy.matrix); dummy.scale.set(1, 1, 1); }
      if (TH.chev && i % 6 === 0 && Math.abs(s.k) > (TH.chevK || 0.006) && cnt[s.k > 0 ? 0 : 1] < 600 && !chevExcept.some(z => z(i, 1) >= 1)) {
        const f = s.k > 0 ? 0 : 1, side = s.k > 0 ? -1 : 1, off = inT ? W - 0.2 : W + 0.6;
        dummy.position.set(s.x + nx * side * off, s.y + 3, s.z + nz * side * off); dummy.lookAt(s.x, s.y + 3, s.z); dummy.updateMatrix();
        sg[f].setMatrixAt(cnt[f]++, dummy.matrix);
        if (!inT) for (const u of [-1.8, 1.8]) { dummy.position.set(s.x + nx * side * (off + 0.1) + s.tx * u, s.y + 1.45, s.z + nz * side * (off + 0.1) + s.tz * u); dummy.updateMatrix(); poles.setMatrixAt(npo++, dummy.matrix); } // from the ground (1.25 m below the roadway) to the top of the sign
      }
    }
    sg.forEach((m, f) => { m.count = cnt[f]; scene.add(m); }); poles.count = npo; scene.add(poles); piers.count = np; scene.add(piers);
    tubes.forEach((m, c) => { m.count = nt[c]; scene.add(m); streaks[c].count = nt[c]; scene.add(streaks[c]); fallback(streaks[c]); });
  }

  // reflections on the wet road: guardrail edge outside, wall neons in the interchange (those pulse with the music)
  for (const sd of [-1, 1]) {
    if (TH.reflections) fallback(ribbon(T.t1, cO, sd * W, 0.04, sd * (W - 4), 0.04, addMat(tx('gradient', TH.reflections))));
    if (T.tun && TH.tun.reflections) { const m = addMat(tx('gradient', TH.tun.reflections[sd < 0 ? 0 : 1])); ribbon(T.t0, cT, sd * W, 0.04, sd * (W - 5), 0.04, m); tunMats.push(m); }
  }
  if (TH.ads) { // gantries above the road, with a scrolling advertising screen
    for (const [i, txt] of ['ネオン // SPEED // 危険 // ', '電脳 CITY ★ 24H ★ ', '>>> NOODLE BAR >>> ホテル '].entries()) {
      const c = ['#ff2bd6', '#00f0ff', '#fcee0a'][i];
      adMasts.push(mat('screenAd', GLOWI, c, txt));
    }
    for (let i = 70, k = 0; i < N; i += 90) {
      if (zone(i, 40) > 0) continue;
      const s = S[i], gr = new THREE.Group(); gr.position.set(s.x, s.y, s.z); gr.rotation.y = across(s); scene.add(gr);
      emis(i, s.x, s.y + 9, s.z, [0xff2bd6, 0x00f0ff, 0xfcee0a][k % 3], 24, 1.2); // the screen lights the road beneath it
      pose('gantryAd', { screen: adMasts[k++ % 3], concretePart: concrete }, gr, [0, 0, 0], W);
    }
  }

  backdrop && await whoosh();
  // ---------- map scenery: scenery-<map>.js ----------
  const STM = [], steam = (x, y, z) => STM.push([x, y, z]); // steam vents declared by the scenery (plumes: see blur)
  const beams = [], BREAKABLES = [], sceneryTick = window.SCENERY[TH.scenery]({ breakable: (...a) => BREAKABLES.push(a), guardM: (sg, ...r) => wallStrip(sg, ...r), THREE, scene, T, S, N, W, M, TH, ribbon, rnd, across, zone, emis, geo, mat, tx, addMat, box, concrete, beams, pose, zones, clothe, steam, softPuffs: (...a) => softPuffs(...a), time: () => race ? -1 : tTraffic, lapCount: () => race ? race.laps : 0 }); // laps: those of the current race (0 outside a race), for the scenery's last lap // blur: the game's particles open to the scenery, to call from the tick (they don't exist yet at load time); the scenery calls step(dt) itself // no traffic in a race: the opponents don't know how to avoid it

  // rain: sharp streaks that lengthen and rush towards the camera with speed, leaning with the wind; bright head, tail fading out (additive blend, no blur)
  // strength 1 = 400 drops; beyond that (downpour, rain zones > 1), more drops, longer; and impacts that splash back onto the roadway in front of the car
  const RN = 2400, rainP = new Float32Array(RN * 3), rainGeo = new THREE.BufferGeometry();
  const rand = (k => () => (k = k * 16807 % 2147483647) / 2147483647)(11); // separate random draw: the rnd sequence is unchanged (only the first 400 drops draw from it, as before)
  for (let i = 0; i < RN; i++) { const r = i < 400 ? rnd : rand; rainP.set([r() * 80 - 40, r() * 30, r() * 80 - 40], i * 3); }
  const rainB = Float32Array.from({ length: RN }, () => 0.45 + 0.55 * rand()); // near and far: drops of varying brightness; the tint is redone every frame (lit rain, see viewFrame)
  // everything is computed in the shader: each drop keeps its start position (position) and its brightness; the view only sends its accumulated offset (rainO), the speed, the wind and the lights
  { const P = new Float32Array(RN * 6), Q = new Float32Array(RN * 4); for (let i = 0; i < RN; i++) { P.set(rainP.subarray(i * 3, i * 3 + 3), i * 6); P.set(rainP.subarray(i * 3, i * 3 + 3), i * 6 + 3); Q.set([rainB[i], 0, rainB[i], 1], i * 4); }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(P, 3)); rainGeo.setAttribute('qb', new THREE.BufferAttribute(Q, 2)); }
  const RU = { uO: { value: new V3() }, uV: { value: new V3() }, uF: { value: new THREE.Vector2() }, uGl: { value: 0 }, uAmb: { value: 0 }, uHph: { value: 0 }, uOp: { value: 1 }, uNL: { value: 0 },
    uRL: { value: new Float32Array(8 * 4) }, uRC: { value: new Float32Array(8 * 3) } };
  const rain = new THREE.LineSegments(rainGeo, new THREE.ShaderMaterial({ uniforms: RU, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
    vertexShader: `attribute vec2 qb; uniform vec3 uO, uV; uniform vec2 uF; uniform float uGl, uAmb, uHph; uniform int uNL; uniform vec4 uRL[8]; uniform vec3 uRC[8]; varying vec3 vC;
      void main() {
        vec3 p = position - uO; p.xz = mod(p.xz + 40., 80.) - 40.; p.y = mod(p.y, 30.); // the drop recedes by the car's speed, falls, and comes back on the other side of the 80 m cube
        vec3 c = vec3(.62, .8, 1.) * uAmb; float f = dot(p.xz, uF);
        if (f > 1. && f < 40. && p.y < 3. && abs(p.z * uF.x - p.x * uF.y) < 1.5 + f * .3) c += vec3(1., .95, .82) * (uHph * (1. - f / 40.)); // headlights: cone in front of the car, low
        for (int k = 0; k < 8; k++) { if (k >= uNL) break; vec3 d = p - uRL[k].xyz; float w = 1. - dot(d, d) * uRL[k].w; if (w > 0.) c += uRC[k] * (.3 * w * w); }
        c *= qb.x;
        if (qb.y > .5) { c *= vec3(.13, .15, .2); p += vec3(uV.x * .035 + uGl * .12, uGl, uV.z * .035 + uGl * .05); } // tail light off, tilted by the wind and stretched by speed
        vC = c; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
      }`,
    fragmentShader: 'uniform float uOp; varying vec3 vC; void main() { gl_FragColor = vec4(vC, uOp); }' }));
  rain.frustumCulled = false; scene.add(rain);
  const SN = 300, splP = new Float32Array(SN * 3), splC = new Float32Array(SN * 3), splA = new Float32Array(SN).map(() => rand() * 0.14), splD = new Float32Array(SN), splGeo = new THREE.BufferGeometry(); // impacts : vie de 0,14 s
  splGeo.setAttribute('position', new THREE.BufferAttribute(splP, 3)); splGeo.setAttribute('color', new THREE.BufferAttribute(splC, 3));
  const splash = new THREE.Points(splGeo, new THREE.PointsMaterial({ size: 2, sizeAttenuation: false, vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false }));
  splash.frustumCulled = false; scene.add(splash);

  backdrop && await whoosh();
  // ---------- car: geometry in shapes-cars.js, livery in textures-cars.js; here the placement, the wheels that turn and steer, the brake lights, the roll ----------
  const carG = new THREE.Group(), body = new THREE.Group(); carG.add(body); carG.userData.dyn = 1; scene.add(carG); // dyn: do not merge into the fixed scenery (see "merge")
  const L = CARD.look, K = L.type || 'gtr'; // the model from shapes-cars.js
  const VO = SHAPES.vehicle(K), livery = col => mat('livery', { gloss: 0.9 }, VO.plan, col, L.stripes || 0); // one livery per tint: the player's, one per opponent
  const carMat = livery(L.col), brakeMat = new THREE.MeshBasicMaterial({ color: 0x8a1020 }), lampMat = new THREE.MeshBasicMaterial({ color: 0xfff2d0 });
  const part = (ge, mat, x, y, z, parent = body) => { const m = new THREE.Mesh(ge, mat); m.position.set(x, y, z); parent.add(m); return m; };
  const skin = { carBody: carMat, blackM: gloss(mat('carTrim'), 0.4), headlight: lampMat, fire: brakeMat };
  for (const zn in VO.zones) part(VO.zones[zn], skin[zn], 0, 0, 0);
  const [xr, xf, zr, zf, rr, tw] = VO.wheels, wheelGeo = SHAPES.wheelCar(rr, tw), wheelMat = mat('wheelCar', {}, K);
  for (const i of [0, 1]) for (const sg of [-1, 1]) { // children 1 to 4 of carG, the two front wheels last: fxCar turns and steers them
    const st = new THREE.Group(); st.position.set(i ? xf : xr, rr, sg * (i ? zf : zr)); carG.add(st);
    part(wheelGeo, wheelMat, 0, 0, 0, st);
  }
  carG.traverse(o => { o.castShadow = o.material !== lampMat && o.material !== brakeMat; }); // headlights and lights (20 cm pieces): their shadow is not visible
  // reflections: the real scenery seen from player 1's car, in a 32 px per face cube map, one face every six frames (refFace, each one near 100 draw calls: done every other frame, it cost 0.25 to 0.5 ms of GPU per frame on average; the whole cube is redone in 0.3 s at 120 frames/s, before rendering view 1);
  // view up to 300 m only (at 3° per pixel, further away it does almost nothing and costs draw calls): the sky and the orb are scaled to a tenth on this side of it;
  // the body adds it to its colour (envMap), weighted per pixel by a mask taken from the livery: glazing (dark, bluish) strong, paint moderate, seals and frames almost nothing.
  // Rivals and other players share the same cube map: taken at player 1's car, it is not exact for them, but at their size on screen it does not show
  // Each face is drawn in REFL_K slices, one per frame (the scene shared in REFL_K batches on the first slice, the sky in the first, what is transparent in the last): same pace and same average cost as a whole face every six frames,
  // but a frame only carries a sixth of it (a whole face, up to 190 draw passes, alone pushed the loaded maps past BUDGET.drawCalls). The slices accumulate in refRT (32 px, depth included), copied into the face once complete (one pass): never a half-drawn face on screen
  const CUBE = new THREE.WebGLCubeRenderTarget(32, { generateMipmaps: false, minFilter: THREE.LinearFilter }), refCam = new THREE.CubeCamera(0.5, 300, CUBE); refCam.coordinateSystem = renderer.coordinateSystem; refCam.updateCoordinateSystem(); refCam.children.forEach(c => { c.layers.enable(SHDD); c.layers.enable(SHDI); }); // r187 only sets the six faces in update(), which the game does not call (one face per frame) // moving objects that cast a shadow
  const REFL_K = 6, refFr = new THREE.Frustum(), refM = new THREE.Matrix4(), refRT = new THREE.WebGLRenderTarget(32, 32, { generateMipmaps: false, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter }), refS = new THREE.Scene(); refRT.texture.name = 'reflections'; let refF = 0, refP = []; // refP: [object, slice] for the face being drawn
  { const q = new THREE.Mesh(quad.geometry, new THREE.MeshBasicMaterial({ map: refRT.texture, depthTest: false, depthWrite: false, fog: false, toneMapped: false })); q.frustumCulled = false; refS.add(q); } // the copy of refRT into the face, pixel for pixel
  const refFace = () => { // player 1's car is not visible in its own cube map; the sun's shadow is not recomputed for so little
    const k = refF % REFL_K, f = (refF / REFL_K | 0) % 6, P = refCam.position, sp = sky.position.clone(), dp = sunDisc.position.clone(), ds = sunDisc.scale.x, ks = sky.scale.x; refF++;
    P.set(carG.position.x, carG.position.y + 0.9, carG.position.z); refCam.updateMatrixWorld(true);
    if (!k) { refP = []; let j = 0; const c = refCam.children[f]; refFr.setFromProjectionMatrix(refM.multiplyMatrices(c.projectionMatrix, c.matrixWorldInverse)); // equal-share batches of what the face sees
      const batch = o => o === sky || o === sunDisc ? 0 : o.children.length || [].concat(o.material).some(m => m.transparent || !m.depthTest) ? REFL_K - 1 : !o.visible || o.isSprite || o.frustumCulled && !refFr.intersectsObject(o) ? 0 : j++ % (REFL_K - 1); // the last slice already has what is transparent
      const va = o => { if (o.isMesh || o.isPoints || o.isLine || o.isSprite) refP.push([o, batch(o)]); else o.children.forEach(va); }; scene.children.forEach(va); } // a mesh keeps its children with it
    sky.position.copy(P); sky.scale.setScalar(0.1); sunDisc.position.copy(P).addScaledVector(SD, 200); sunDisc.scale.setScalar(ds / 10); sky.updateMatrixWorld(); sunDisc.updateMatrixWorld();
    const vis = carG.visible, rt = renderer.getRenderTarget(), caches = []; carG.visible = false;
    for (const [o, t] of refP) if (t !== k && o.visible) { o.visible = false; caches.push(o); }
    renderer.setRenderTarget(refRT); renderer.autoClear = !k; renderer.render(scene, refCam.children[f]); renderer.autoClear = true; // the following slices add to the first, depth included
    for (const o of caches) o.visible = true;
    carG.visible = vis; renderer.setRenderTarget(rt);
    sky.position.copy(sp); sky.scale.setScalar(ks); sunDisc.position.copy(dp); sunDisc.scale.set(ds, ds, 1); sky.updateMatrixWorld(); sunDisc.updateMatrixWorld();
    if (k === REFL_K - 1) { renderer.setRenderTarget(CUBE, f); renderer.render(refS, postCam); renderer.setRenderTarget(rt); } // complete face: copied into the cube
  };
  const reflects = m => { // the mask: red = share of the reflection (three's specularMap)
    const src = m.map.image.getContext('2d').getImageData(0, 0, 128, 128).data;
    m.specularMap = tex(128, 128, g => { const im = g.createImageData(128, 128);
      for (let i = 0; i < src.length; i += 4) { const r = src[i], v = src[i + 1], b = src[i + 2], l = (r * 0.3 + v * 0.59 + b * 0.11) / 255, k = l < 0.32 ? (b > r + 6 ? 0.9 : 0.08) : 0.45; im.data.fill(k * 255, i, i + 3); im.data[i + 3] = 255; }
      g.putImageData(im, 0, 0); });
    return Object.assign(m, { envMap: CUBE.texture, combine: THREE.AddOperation, reflectivity: 1 });
  };
  reflects(carMat);
  // car footprint: the dynamic light's shadow box (BOX) and the ghost take its dimensions
  const ENC = new THREE.Box3().setFromObject(carG), ENCt = ENC.getSize(new V3()), ENCc = ENC.getCenter(new V3());

  // light trails from the tail lights: two ribbons drawn over the last positions
  // brakeParts: on the wheel, the disc and the caliper (their exact tints in the texture of textures-cars.js) glow red when they heat up; on the ground, behind the car, an additive red glow while the brake lights are on
  wheelMat.emissiveMap = tex(64, 64, g => { const src = wheelMat.map.image, d = (g.drawImage(src, 0, 0), g.getImageData(0, 0, 64, 64)), p = d.data;
    for (let i = 0; i < p.length; i += 4) { const on = [[38, 38, 44], [106, 32, 36]].some(([r, v, b]) => Math.abs(p[i] - r) + Math.abs(p[i + 1] - v) + Math.abs(p[i + 2] - b) < 8); p[i] = p[i + 1] = p[i + 2] = on ? 255 : 0; }
    g.putImageData(d, 0, 0); });
  const groundMat = new THREE.MeshBasicMaterial({ color: 0xff2030, map: tex(32, 32, g => { const r = g.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, '#fff'); r.addColorStop(1, '#000'); g.fillStyle = r; g.fillRect(0, 0, 32, 32); }), blending: THREE.AdditiveBlending, transparent: true, opacity: 0, depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  const flames = [-0.5, 0.5].map(z => { const g = new THREE.ConeGeometry(0.17, 1.6, 5); g.translate(0, 0.8, 0); const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0x60d0ff, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false })); m.rotation.z = Math.PI / 2; m.position.set(ENC.min.x, 0.42, z); m.visible = false; carG.add(m); return m; }); // points backward
  { const ground = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 3.6), groundMat); ground.rotation.x = -Math.PI / 2; ground.position.set(ENC.min.x - 1.4, 0.05, 0); ground.visible = false; carG.add(ground); } // child 7 of carG, after the flames
  const TN = 18, trailI = [], trailMat = addMat(null, { vertexColors: true, polygonOffset: false });
  for (let l = 0; l < 2; l++) for (let k = 0; k < TN - 1; k++) { const a = (l * TN + k) * 2; trailI.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const trail = () => { // one trail set per human car (see HUM); hidden as long as no view holds it: its last positions and its ribbon
    const P = new Float32Array(TN * 12), C = new Float32Array(TN * 12), geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(P, 3)); geo.setAttribute('color', new THREE.BufferAttribute(C, 3)); geo.setIndex(trailI);
    const tr = new THREE.Mesh(geo, trailMat); tr.frustumCulled = tr.visible = false; scene.add(tr);
    const gP = new Float32Array(GN * 12), gC = new Float32Array(GN * 16), gGeo = new THREE.BufferGeometry(), gm = new THREE.Mesh(gGeo, gmMat); // traces de gomme
    gGeo.setAttribute('position', new THREE.BufferAttribute(gP, 3)); gGeo.setAttribute('color', new THREE.BufferAttribute(gC, 4)); gGeo.setIndex(gmI); gm.frustumCulled = false; scene.add(gm);
    return { hist: [], P, C, geo, tr, gR: [[], []], gOn: [0, 0], gP, gC, gGeo, vAcc: 0 };
  };
  // ground marks: one ribbon per rear wheel, one point every GD meters at most, kept for the whole race (the last GN points of each wheel)
  // TR: what each surface keeps (docs/PHYSICS.md): black rubber on dry asphalt, grooves on earth and ruts in snow (even while rolling), nothing on ice or wet
  const TR = { sec: { c: [0.02, 0.02, 0.025], a: 0.7, rolling: 0, w: 1 }, terre: { c: [0.2, 0.12, 0.06], a: 0.8, rolling: 0.38, w: 1.25 }, snowSurf: { c: [0.55, 0.6, 0.7], a: 0.8, rolling: 0.4, w: 1.35 } };
  const genre = q => q.corner >= 0.2 && q.corner < 0.4 && q.rollAmt > 0.1 ? 'snowSurf' : q.rollAmt >= 0.2 && q.corner < 0.2 ? 'terre' : 'sec'; // snow: slippery and rolling; earth: rolling, not very slippery (an earth-to-asphalt fade stays earth, not snow)
  const trGround = q => q.corner >= 0.4 || q.aq > 0.05 ? null : TR[genre(q)]; // nothing on ice or wet (the city drizzle, at 30% of wet, keeps the rubber)
  const GN = 500, GD = 0.8, gmI = [], gmMat = new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); // DoubleSide: the ribbons turn their face downward (left, right, then the front point); without it they would never be seen
  for (let l = 0; l < 2; l++) for (let k = 0; k < GN - 1; k++) { const a = (l * GN + k) * 2; gmI.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }

  // additive particles: tyre smoke, sparks against walls, exhaust flames
  const PN = 320, pP = new Float32Array(PN * 3), pC = new Float32Array(PN * 3), pV = new Float32Array(PN * 3), pB = new Float32Array(PN * 3), pL = new Float32Array(PN), pM = new Float32Array(PN), pGv = new Float32Array(PN), pGeo = new THREE.BufferGeometry();
  let pi = 0;
  pGeo.setAttribute('position', new THREE.BufferAttribute(pP, 3)); pGeo.setAttribute('color', new THREE.BufferAttribute(pC, 3));
  const parts = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 1.1, vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false })); parts.frustumCulled = false; scene.add(parts);
  // soft clouds: opaque discs that grow while fading out (in additive mode they read as light squares); dust from earth maps (th.dust = its tint) and tyre smoke
  const dEch = { value: 135 };
  // brakes: horizontal braking (1/s); 0: the cloud keeps its emitter's speed; imgSize: diameter factor; nearby: closer than 2 × nearby meters to the camera the disc fades out (nothing sticks to the lens)
  const softPuffs = (N, col, op, vitality = 1.4, brakes = 3, imgSize = 1, nearby = 0) => { const P = new Float32Array(N * 3), V = new Float32Array(N * 3), A = new Float32Array(N).fill(1), g = new THREE.BufferGeometry(); let i = 0;
    g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('age', new THREE.BufferAttribute(A, 1));
    const d = new THREE.Points(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { col: { value: new THREE.Color(...col) }, ech: dEch, op: { value: op }, tl: { value: imgSize }, pr: { value: nearby } },
      vertexShader: 'attribute float age; varying float a, f; uniform float ech, tl, pr; void main() { a = age; vec4 p = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * p; f = pr > 0.0 ? clamp(-p.z / pr - 1.0, 0.0, 1.0) : 1.0; gl_PointSize = age < 1.0 ? tl * ech * projectionMatrix[1][1] * (1.1 + 6.0 * age) / -p.z : 0.0; }',
      fragmentShader: 'varying float a, f; uniform vec3 col; uniform float op; void main() { float r = length(gl_PointCoord - 0.5) * 2.0; if (r > 1.0 || a >= 1.0) discard; gl_FragColor = vec4(col, (1.0 - r * r) * (1.0 - a) * min(1.0, 0.15 + a * 4.0) * op * f); }' })); d.frustumCulled = false; d.visible = false; scene.add(d);
    // vivid: live particles; an empty cloud is neither drawn (one draw call per view, reflections included) nor sent to the GPU
    let vivid = 0;
    return { d, emit(x, y, z, vx, vy, vz) { const k = i++ % N; P.set([x, y, z], k * 3); V.set([vx, vy, vz], k * 3); A[k] = 0; vivid = 1; d.visible = true; },
      step(dt) { if (!vivid) return; const fr = Math.exp(-brakes * dt); vivid = 0; for (let k = 0; k < N; k++) if (A[k] < 1) { const j = k * 3; A[k] += dt / vitality; V[j] *= fr; V[j + 2] *= fr; P[j] += V[j] * dt; P[j + 1] += V[j + 1] * dt; P[j + 2] += V[j + 2] * dt; vivid++; }
        g.attributes.position.needsUpdate = g.attributes.age.needsUpdate = true; d.visible = vivid > 0; } };
  };
  const POUS = TH.dust && softPuffs(480, TH.dust, 0.5), BURST = TH.dust && T.surf.some(q => q.aq) && softPuffs(500, [0.92, 0.93, 0.9], 0.4, 0.35), BURST1 = BURST && softPuffs(900, [0.86, 0.85, 0.78], 0.45, 0.35, 0, 0.18, 2.5), FOAM = BURST && softPuffs(700, [0.9, 0.89, 0.83], 0.9, 0.4, 0, 0.15, 2), SMOKE = softPuffs(600, [0.68, 0.68, 0.72], 0.55), dust = (...a) => POUS.emit(...a), FIRE = TH.dust && TH.leaves && (() => { /* th.leaves: tints of the dead leaves the cars kick up (chapada). Small crisp opaque squares (soft clouds read as halos): they rise, spin, fall back */
    const n = 260, P = new Float32Array(n * 3).fill(-1e4), V = new Float32Array(n * 3), L = new Float32Array(n), C = new Float32Array(n * 3), g = new THREE.BufferGeometry(); let i = 0;
    g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('color', new THREE.BufferAttribute(C, 3));
    const d = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.22, vertexColors: true })); d.frustumCulled = false; scene.add(d);
    return { emit(x, y, z, vx, vy, vz) { const k = i++ % n; P.set([x, y, z], k * 3); V.set([vx, vy, vz], k * 3); C.set(TH.leaves[Math.random() * TH.leaves.length | 0], k * 3); L[k] = 1 + Math.random() * 1.2; g.attributes.color.needsUpdate = true; },
      step(dt) { const fr = Math.exp(-2.4 * dt); for (let k = 0; k < n; k++) if (L[k] > 0) { const j = k * 3; L[k] -= dt; V[j] *= fr; V[j + 2] *= fr; V[j + 1] = Math.max(-1.3, V[j + 1] - 7 * dt);
          P[j] += (V[j] + Math.sin(L[k] * 9 + k) * 1.6) * dt; P[j + 1] += V[j + 1] * dt; P[j + 2] += (V[j + 2] + Math.cos(L[k] * 7 + k) * 1.6) * dt; if (L[k] <= 0) P[j + 1] = -1e4; }
        g.attributes.position.needsUpdate = true; } }; })();
  // th.dustBallistic = { grav, rate, size, up } (lune: no air). Instead of the plume, each car throws opaque grains that fly on parabolas and fall back: no drag, no growth, no fade. A grain bounces once, lies still a moment, then is reused.
  //   grav: their gravity, as a share of the map's (0.4); rate: grains per second for a followed car at full speed (50); size in metres (0.2); up: their highest launch speed (3.5 m/s).
  //   With it the two soft effects of a car are off as well (the rising puff of a landing, the tyre smoke of a slide): a cloud that hangs is air.
  //   A grain thrown while its car is in the air keeps the car's velocity and falls at the car's own gravity: it stays beside the car all the way down (its ground is then read under that car, each step). Off by default: no other map sets it
  const GRAIN = TH.dust && TH.dustBallistic && (() => { const n = 700, P = new Float32Array(n * 3).fill(-1e4), V = new Float32Array(n * 3), C = new Float32Array(n * 3), Gv = new Float32Array(n), Gd = new Float32Array(n), L = new Float32Array(n), B = new Uint8Array(n), OW = new Array(n), g = new THREE.BufferGeometry(); let i = 0;
    g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('color', new THREE.BufferAttribute(C, 3));
    const mt = new THREE.PointsMaterial({ size: TH.dustBallistic.size || 0.2, vertexColors: true }), d = new THREE.Points(g, mt); d.frustumCulled = false; scene.add(d);
    mt.onBeforeCompile = s => { s.vertexShader = s.vertexShader.replace('#include <logdepthbuf_vertex>', 'gl_PointSize = min(gl_PointSize, 9.0); #include <logdepthbuf_vertex>'.replace('; ', ';\n')); }; // a grain that passes close to the lens stays a grain: its size on screen is capped (set at the image)
    return { emit(x, y, z, vx, vy, vz, grav, ground, owner) { const k = i++ % n, t = 0.7 + Math.random() * 0.45; P.set([x, y, z], k * 3); V.set([vx, vy, vz], k * 3); C.set([TH.dust[0] * t, TH.dust[1] * t, TH.dust[2] * t], k * 3); Gv[k] = grav; Gd[k] = ground; L[k] = 6; B[k] = 0; OW[k] = owner; g.attributes.color.needsUpdate = true; },
      step(dt) { for (let k = 0; k < n; k++) if (L[k] > 0) { const j = k * 3; L[k] -= dt;
          if (B[k] < 2) { V[j + 1] -= Gv[k] * dt; P[j] += V[j] * dt; P[j + 1] += V[j + 1] * dt; P[j + 2] += V[j + 2] * dt; const o = OW[k], gd = (o ? S[o.idx].y + (T.dent ? T.dent(P[j], P[j + 2]) : 0) : Gd[k]) + 0.06;
            if (P[j + 1] < gd) { P[j + 1] = gd; if (B[k]++) L[k] = Math.min(L[k], 1.2); else { V[j + 1] = Math.min(2, -0.3 * V[j + 1]); V[j] *= 0.4; V[j + 2] *= 0.4; } } }
          if (L[k] <= 0) P[j + 1] = -1e4; }
        g.attributes.position.needsUpdate = true; } }; })();
  if (BURST) BURST.d.renderOrder = -4; // the cloud from other cars passes under the ford's water sheet (renderOrder -2 in scenery-terre.js), as before the sheet went under the particles: seen from afar, it veils their base
  // ford water spray (Spéciale des Ocres: the only earth map with a wet zone): behind each front wheel, drops as white streaks fanned out to the side, falling back, and a bit of foam at water level (short-lived discs: longer-lived, they grow into haze); taller and wider with speed
  //   Seen from its own camera (self: a view follows it), the same spray blocked the screen: its braked discs stayed behind the car and grew in front of the lens. For that view, the effect is redone at chase-camera scale:
  //   two fans of small unbraked discs (BURST1) thrown to each side at the car's speed, drops that rise and fall beside it, a low foam (FOAM) following the rear wheels for 3 to 4 m;
  //   any disc within 8 m of the camera fades out (nearby): the game's low-resolution rendering would turn them into blocks, and the drops stay under the bloom threshold
  //   Rate per second, not per frame (nbr: how many on this frame, tuned for 60 frames/s): at 10 frames/s (tools/captures.html) the spray had six times less water than in game.
  //   Each particle is born at a random instant in the frame (b seconds before its end): placed where it would be, it does not pile up with the others on a single point
  //   strong: intensity of the player's spray, 1 at cruise; stronger on entering the water (the bow hit) and on exit (the wave the car pushes ahead falls back)
  const burst = (c, v, self, dt, strong = 1) => { const fx = Math.cos(c.th), fz = Math.sin(c.th), k = Math.min(1, v / 40), nbr = x => { const f = x * dt * 60; return (f | 0) + (Math.random() < f % 1); };
    const spawnPt = (f, x, y, z, vx, vy, vz) => { const b = Math.random() * dt; f(x + (vx - c.vx) * b, y + vy * b, z + (vz - c.vz) * b, vx, vy, vz); };
    if (self) { for (const sd of [-1, 1]) { const fc = strong * (0.65 + Math.random() * 0.7), rx = -fz * sd, rz = fx * sd, px = c.x + fx * 0.9 + rx * 1.1, pz = c.z + fz * 0.9 + rz * 1.1, ex = c.x - fx * 1.3 + rx * 0.8, ez = c.z - fz * 1.3 + rz * 0.8; // rx, rz: outward from this side
        for (let j = nbr(1.5 * fc); j--;) { const l = (2 + Math.random() * 4 * fc) * k, av = 0.9 + Math.random() * 0.08; spawnPt(BURST1.emit, px + jit(0.3), c.y + 0.3, pz + jit(0.3), c.vx * av + rx * l, (2.5 + Math.random() * 3) * k, c.vz * av + rz * l); }
        for (let j = nbr(2.5 * fc); j--;) { const l = (2.5 + Math.random() * 4) * k, av = 0.86 + Math.random() * 0.1; spawnPt((x, y, z, vx, vy, vz) => strokeLn(x, y, z, vx, vy, vz, 0.6, 16, 0.012, [0.82, 0.84, 0.8], c.y + 0.03), px, c.y + 0.35, pz, c.vx * av + rx * l, (2.5 + Math.random() * 3) * k * Math.min(1.6, fc), c.vz * av + rz * l); } // drops: short streaks (k 0.012: the streak follows the speed, which is mostly the car's; longer, it would become a speed line), thrown about 1 m, they fall back in an arc beside the car
        for (let j = nbr(3 * fc); j--;) spawnPt(FOAM.emit, ex + jit(0.4), c.y + 0.08, ez + jit(0.4), c.vx * 0.85 + rx * 2, 0.3, c.vz * 0.85 + rz * 2); } // foam: at water level behind the rear wheels, it fades out closer to the camera than the rest (nearby 2)
      return; }
    for (const sd of [-1, 1]) for (let j = nbr(2 + 4 * k | 0); j--;) { const ox = c.x + fx * 1.1 - fz * sd * 0.9, oz = c.z + fz * 1.1 + fx * sd * 0.9, l = sd * (4 + Math.random() * 7) * k;
      spawnPt(BURST.emit, ox + jit(0.6), c.y + 0.25, oz + jit(0.6), c.vx * 0.45 - fz * l, (2 + Math.random() * 4.5) * k, c.vz * 0.45 + fx * l);
      for (let d = 0; d < 5; d++) spawnPt((x, y, z, vx, vy, vz) => strokeLn(x, y, z, vx, vy, vz, 0.9, 12, 0.09, [1, 1, 0.95], c.y + 0.05), ox, c.y + 0.2, oz, c.vx * 0.5 - fz * l * 1.4 + jit(3), (3 + Math.random() * 6) * k, c.vz * 0.5 + fx * l * 1.4 + jit(3)); } };
  // steam from manholes: one slow plume per manhole (4 s to rise 5 m), tinted by the nearest light within 30 m (the neon signs)
  const STMS = STM.map(([x, y, z]) => { const c = new THREE.Color(0.2, 0.2, 0.23); let lb = null, db = 900;
    for (const l of BRIGHTS) { const d = (l.x - x) ** 2 + (l.z - z) ** 2; if (d < db) { db = d; lb = l; } }
    if (lb) c.lerp(lb.c.clone().multiplyScalar(0.6 / Math.max(lb.c.r, lb.c.g, lb.c.b, 1e-3)), 0.7 * (1 - Math.sqrt(db) / 30));
    const f = softPuffs(40, [c.r, c.g, c.b], 0.18, 4); // bounded plume (5 m of rise, less than 3 m of drift, discs that grow): out of view, it is not drawn (otherwise one draw call per manhole; Ville has about thirty)
    f.d.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(x, y + 3, z), 10); f.d.frustumCulled = true;
    return { f, x, y, z, t: 0 }; });
  // additive streaks, stretched along their speed, bright head and dark tail: sparks from the slide plateau, nitro speed lines
  const VN = 400, VK = 11, vP = new Float32Array(VN * 6), vLayer = new Float32Array(VN * 6), vS = new Float32Array(VN * VK), vGeo = new THREE.BufferGeometry(); let vi = 0;
  vGeo.setAttribute('position', new THREE.BufferAttribute(vP, 3)); vGeo.setAttribute('color', new THREE.BufferAttribute(vLayer, 3));
  const speedLines = new THREE.LineSegments(vGeo, new THREE.LineBasicMaterial({ vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false })); speedLines.frustumCulled = false; scene.add(speedLines);
  function strokeLn(x, y, z, vx, vy, vz, vitality, grav, k, rgb, ground = -1e9) { const i = vi++ % VN; vP.set([x, y, z], i * 6); vS.set([vx, vy, vz, vitality, vitality, grav, k, ground, ...rgb], i * VK); } // k: streak length in seconds of speed; ground: height where it bounces
  function emit(x, y, z, vx, vy, vz, life, r, gg, b, grav) { const i = pi++ % PN; pP.set([x, y, z], i * 3); pV.set([vx, vy, vz], i * 3); pB.set([r, gg, b], i * 3); pL[i] = pM[i] = life; pGv[i] = grav; }

  let flashT = 0, nextFlash = 6;
  const FLASH = new THREE.Color(0x8fa0ff), jit = a => (Math.random() - 0.5) * a;
  // effects attached to the human car of the player seen (its model vu.hu), the one its view follows, with that view's smoothed state: model pose, wheels, brake light, trails, landing dust, smoke, sparks, flameSet.
  // Everything is in the scene, so visible from every view
  function fxCar(vu, dt) {
    const { car, carY, lm, inp, hit, land, hu } = vu, { hist, P, C, geo } = hu, sp = Math.hypot(car.vx, car.vz), fx = Math.cos(car.th), fz = Math.sin(car.th), rx = -fz, rz = fx;
    hu.g.rotation.order = 'YZX'; // heading, then pitch, then roll around the car's axis
    hu.g.position.set(car.x, carY, car.z); hu.g.rotation.set(vu.roll, -car.th, vu.pitch); hu.body.rotation.x = car.steer * Math.min(1, sp / TOP) * 0.07;
    for (let i = 0; i < 4; i++) { const st = hu.wheels[i]; st.children[0].rotation.z -= car.vf * dt / rr; if (i > 1) st.rotation.y = -car.steer * 0.45; }
    brakeParts(hu.g, Math.max(inp.brake || 0, car.frA ? 0.5 : 0), sp, dt);
    // trails
    hist.unshift([car.x + fx * ENC.min.x, carY + 0.72, car.z + fz * ENC.min.x, rx, rz]); if (hist.length > TN) hist.length = TN;
    const bst = car.boost > 0, glow = Math.min(1, sp / 15) * (inp.brake || car.frA || bst ? 1 : 0.4) * Math.min(1, headlightsV / 0.4);
    for (let l = 0; l < 2; l++) for (let k = 0; k < TN; k++) {
      const h = hist[Math.min(k, hist.length - 1)], sd = l ? 0.78 : -0.78, a = (l * TN + k) * 6, f = (1 - k / TN) ** 2 * glow;
      P.set([h[0] + h[3] * sd, h[1] + 0.1, h[2] + h[4] * sd, h[0] + h[3] * sd, h[1] - 0.1, h[2] + h[4] * sd], a);
      C.set(bst ? [f * 0.2, f * 0.8, f, f * 0.2, f * 0.8, f] : [f, f * 0.08, f * 0.16, f, f * 0.08, f * 0.16], a);
    }
    geo.attributes.position.needsUpdate = geo.attributes.color.needsUpdate = true;
    // emissions
    if (land > 3 && !GRAIN) for (let i = 0; i < Math.min(14, land * 1.5); i++) { const sd = i & 1 ? 1 : -1, av = i & 2 ? 1.4 : -1.4; // landing: a puff of dust blown from each wheel, outward
      emit(car.x + fx * av - fz * sd * 0.9, carY + 0.15, car.z + fz * av + fx * sd * 0.9, car.vx * 0.6 - fz * sd * (3 + Math.random() * 5), 0.5 + Math.random() * 2, car.vz * 0.6 + fx * sd * (3 + Math.random() * 5), 0.35, 0.2, 0.19, 0.17, -1); }
    if ((car.slide > 0.3 || car.frA || car.dd) && sp > 10 && !car.air && !GRAIN) for (const sd of [-0.9, 0.9]) SMOKE.emit(car.x - fx * 1.4 + rx * sd + jit(0.4), carY + 0.25, car.z - fz * 1.4 + rz * sd + jit(0.4), car.vx * 0.65 + rx * sd * 2 + jit(3), 0.6 + Math.random(), car.vz * 0.65 + rz * sd * 2 + jit(3)); // tyre smoke: a cloud that swells and rises, blown outward; it keeps part of the speed, otherwise it passes behind the camera before it has swelled
    if (hit > 3) { const s = S[car.idx], sg = Math.sign(car.d); for (let i = 0; i < 16; i++) emit(car.x - s.tz * sg, carY + 0.5, car.z + s.tx * sg, car.vx * 0.5 + jit(14), 2 + Math.random() * 7, car.vz * 0.5 + jit(14), 0.5, 1, 0.75, 0.25, 22); }
    else if (car.rub && sp > 8) { const s = S[car.idx], sg = Math.sign(car.d); for (let i = 0; i < 3; i++) emit(car.x - s.tz * sg, carY + 0.4, car.z + s.tx * sg, car.vx * 0.6 + jit(5), 1 + Math.random() * 4, car.vz * 0.6 + jit(5), 0.35, 1, 0.75, 0.25, 22); } // continuous friction: finer spray than the impact
    for (const fl of hu.fl) { fl.visible = car.boost > 0; fl.scale.y = (0.5 + Math.random() * 0.7) * Math.min(1, car.boost * 2); } // nitro: two flickering exhaust flames, the trails turn blue
    const gl = car.dd && sp > 10 && !car.air;
    if (gl && car.driftT > 0.6) for (const sd of [-0.9, 0.9]) for (let k = 1 + (Math.random() < 0.5); k--;) strokeLn(car.x + fx * xr + rx * sd, carY + 0.08, car.z + fz * xr + rz * sd, car.vx * 0.7 + rx * sd * 4 + jit(4), 2 + Math.random() * 4, car.vz * 0.7 + rz * sd * 4 + jit(4), 0.4, 18, 0.06, [1, 0.55, 0.1], carY + 0.03); // slide plateau (the gauge fills at full flow): orange sparks, as thin streaks, in the smoke
    // marks: each rear wheel draws its ribbon while it leaves a mark (slide, locked braking, wheelspin at the start; earth and snow leave marks even when rolling); a zero-alpha point opens and closes each mark
    const st = trGround(T.surf[car.idx]); hu.launcher = (inp.gas || 0) > 0.8 && sp < 12 ? (hu.launcher || 0) + dt : 0;
    const k = Math.max(gl ? 1 : 0, (inp.brake || 0) > 0.6 && sp > 6 ? 1 : 0, hu.launcher > 0 && hu.launcher < 1.4 ? 1 - sp / 12 : 0), ga = st && !car.air && sp > 1 ? st.rolling + (st.a - st.rolling) * k : 0, on = ga > 0.04;
    // shortcut: placed at the car's height, without pitch; on a steep slope the tip may sink or float by a few centimeters
    for (let l = 0; l < 2; l++) { const R = hu.gR[l], sd = l ? zr : -zr, p = { x: car.x + fx * xr + rx * sd, y: carY + 0.04, z: car.z + fz * xr + rz * sd, rx, rz, a: ga, c: st ? st.c : TR.sec.c, w: st ? st.w : 1 };
      if (on) { if (!hu.gOn[l]) R.unshift({ ...p, a: 0 }); hu.gOn[l] = 1; if (!R[0].a || Math.hypot(p.x - R[1].x, p.z - R[1].z) > GD) R.unshift(p); else Object.assign(R[0], p); }
      else if (hu.gOn[l]) { R.unshift({ ...R[0], a: 0 }); hu.gOn[l] = 0; }
      while (R.length > GN) R.pop();
      for (let k = 0; k < GN; k++) { const e = R[k], a = (l * GN + k) * 6, c = (l * GN + k) * 8; if (!e) { hu.gC.fill(0, c, c + 8); continue; } const w = tw / 2 * e.w;
        hu.gP.set([e.x - e.rx * w, e.y, e.z - e.rz * w, e.x + e.rx * w, e.y, e.z + e.rz * w], a); hu.gC.set([...e.c, e.a, ...e.c, e.a], c); } }
    hu.gGeo.attributes.position.needsUpdate = hu.gGeo.attributes.color.needsUpdate = true;
  }
  // whole-scene effects, once per frame: dust, particles, lightning, scenery life
  function fxFrame(dt, now) {
    const { lm, self: car } = VIEWS[0]; // the thunder is player 1's (a single sound, like SOUND.frame)
    if (TH.dust) { for (const c of race ? race.cars : [car]) { const q = T.surf[c.idx], v = Math.hypot(c.vx, c.vz), sd = Math.random() < 0.5 ? -0.8 : 0.8, x = c.x - Math.cos(c.th) * 1.6 - Math.sin(c.th) * sd, z = c.z - Math.sin(c.th) * 1.6 + Math.cos(c.th) * sd; // each car kicks up a plume behind it; in the ford, a spray of water. The dust leaves at the car's speed, then slows down: the plume stays in the chase camera's view
        if (c.air) c.waterT = 0; // in the air, we are no longer in the water: landing a jump in a flooded zone repeats the bow hit (chapada thresholds)
        if (GRAIN) { const O = TH.dustBallistic, gr = T.grav * (O.grav || 0.4), up = O.up || 3.5, me = VIEWS.some(u => u.car === c), nb = f => (f | 0) + (Math.random() < f % 1); // th.dustBallistic: grains on parabolas instead of the plume; none on the clean floors (the tunnel, a hall the scenery declares indoor)
          const on = !c.out && !(T.tun && (c.idx - T.t0 + N) % N <= T.t1 - T.t0) && !(sceneryTick && sceneryTick.indoor && sceneryTick.indoor(c.idx) > 0.5), landed = c.grAir > 0.25 && !c.air; c.grAir = c.air ? (c.grAir || 0) + dt : 0;
          if (on && landed) for (let k = 36; k--;) { const a = Math.random() * 6.283, l = 2 + Math.random() * 6; GRAIN.emit(c.x + Math.cos(a), c.y + 0.1, c.z + Math.sin(a), c.vx * 0.9 + Math.cos(a) * l, 1 + Math.random() * up, c.vz * 0.9 + Math.sin(a) * l, gr, c.y, null); } // the landing: a ring thrown off the wheels
          if (on && v > 8) for (let k = nb((me ? 1 : 0.35) * (O.rate || 50) * dt * (c.air ? 0.5 : Math.min(1, v / 30) * (1 + Math.min(1, c.slide || 0)))); k--;) { const u = c.air ? 0.9 + Math.random() * 0.1 : 0.8 + Math.random() * 0.17, b = Math.random() * dt; // a slide throws twice as many; b: born at a random instant of the frame
            GRAIN.emit(x + jit(0.5) - c.vx * b, c.y + 0.12, z + jit(0.5) - c.vz * b, c.vx * u + jit(c.air ? 1 : 2), c.air ? c.vy : 0.6 + Math.random() * up, c.vz * u + jit(c.air ? 1 : 2), c.air ? T.grav * (c.gk || 1) : gr, c.y, c.air ? c : null); }
          continue; }
        if (v < 8 || c.air || c.out || !(VIEWS.some(v => v.car === c) || c.drift || Math.random() < 0.5)) continue;
        const aq = j => T.surf[(c.idx + j) % N].aq > 0.099, insideWater = aq(0) || aq(1), self = !window.__g.view && VIEWS.some(u => u.car === c); // aq(1): the front wheels, 2 m ahead, are already there
        c.waterT = insideWater ? (c.waterT || 0) + dt : 0; // time spent in the water (scenery only, the simulation does not read it)
        if (insideWater) burst(c, v, self, dt, 1 + 2.5 * Math.max(0, 1 - c.waterT / 0.35) + (aq(4) ? 0 : 2)); // strong: the bow hit at entry, and the wave over the last 8 meters before exit; out of the water, nothing // the ford: a water spray on each side, only where the wet zone is full; on its muddy edges, neither spray nor dust (scenery-terre.js lays the sheet there), and nothing in its muddy edges; lightened for a car followed by a chase camera (not in the inspection camera, __g.view, which looks from afar)
        else if (q.rollAmt > 0.25 && !q.aq) for (let k = 0; k < 2; k++) dust(x + jit(0.6), c.y + 0.15, z + jit(0.6), c.vx * 0.7 + jit(2), 0.3 + Math.random() * 1.2, c.vz * 0.7 + jit(2));
        else if (FIRE && !q.aq && !(T.tun && (c.idx - T.t0 + N) % N <= T.t1 - T.t0)) for (let k = Math.max(1, Math.round((c.drift ? 3 : 1.5) * dt * 60)); k--;) FIRE.emit(x + jit(2), c.y + 0.12, z + jit(2), c.vx * 0.85 + jit(6), 1.5 + Math.random() * 4.5, c.vz * 0.85 + jit(6)); } // they leave at the car's speed then slow down, like the dust: the wake stays in the chase camera's view
      POUS.step(dt); if (GRAIN) GRAIN.step(dt); if (FIRE) FIRE.step(dt); if (BURST) { BURST.step(dt); BURST1.step(dt); FOAM.step(dt); } }
    dmgFrame(dt); sceneryFrame(dt); SMOKE.step(dt); dEch.value = RH / 2;
    for (const p of STMS) { for (p.t += dt; p.t > 0.12; p.t -= 0.12) p.f.emit(p.x + jit(0.6), p.y, p.z + jit(0.6), 0.3 + jit(0.4), 1 + Math.random() * 0.6, jit(0.4)); p.f.step(dt); } // steam: always, even far away (40 points per manhole)
    for (let i = 0; i < VN; i++) { const j = i * 6, s = i * VK; if (vS[s + 3] <= 0) { vLayer.fill(0, j, j + 6); continue; }
      vS[s + 3] -= dt; vS[s + 1] -= vS[s + 5] * dt; const a = Math.max(0, vS[s + 3] / vS[s + 4]), k = vS[s + 6];
      for (let c = 0; c < 3; c++) vP[j + c] += vS[s + c] * dt; if (vP[j + 1] < vS[s + 7]) { vP[j + 1] = vS[s + 7]; vS[s + 1] *= -0.35; }
      for (let c = 0; c < 3; c++) { vP[j + 3 + c] = vP[j + c] - vS[s + c] * k; vLayer[j + c] = vS[s + 8 + c] * a; vLayer[j + 3 + c] = 0; } }
    vGeo.attributes.position.needsUpdate = vGeo.attributes.color.needsUpdate = true;
    for (let i = 0; i < PN; i++) {
      if (pL[i] <= 0) continue;
      pL[i] -= dt; const j = i * 3, f = Math.max(0, pL[i] / pM[i]);
      pV[j + 1] -= pGv[i] * dt; pP[j] += pV[j] * dt; pP[j + 1] += pV[j + 1] * dt; pP[j + 2] += pV[j + 2] * dt;
      pC[j] = pB[j] * f; pC[j + 1] = pB[j + 1] * f; pC[j + 2] = pB[j + 2] * f;
    }
    pGeo.attributes.position.needsUpdate = pGeo.attributes.color.needsUpdate = true;
    // lightning: double flash on the sky, the haze and the lighting, then the thunder
    if (TH.storm && (nextFlash -= dt) < 0) { nextFlash = 7 + Math.random() * 14; flashT = 0.36; if (lm < 0.5) SOUND.thunder(); }
    flashT -= dt; // (the lightning's brightness on the sky is set per view: viewFrame)
    adMasts.forEach((m, i) => { m.map.offset.x += dt * (0.2 + 0.1 * i); }); // advertising screens of the gantries
    if (sceneryTick) sceneryTick(dt, now, car);
  }

  const ghostM = box(ENCt.x, ENCt.y, ENCt.z, addMat(null, { color: 0x00f0ff, opacity: 0.4, polygonOffset: false }), 0, 0, 0); ghostM.visible = false; // ghost: a simple glowing silhouette
  // race-mode opponents: copies of the player's car, one colour each (fixed wheels); [name, colour]
  // Split screen: one more model per player 2 to 4, in its livery (at the end of the list: c.k = 2 + player number). Each car in a race carries c.k = its rank in OPP and opps, -1 for player 1 (see start);
  // pierBuf(c) = [name, colour] of a car, for the labels, the minimap and the standings; model(c) = its model in the scene
  const OPP = [['KENJI', '#00c8ff'], ['REI', '#ff8a00'], ['JUN', '#40ff80']].map(([n, c], i) => [M.rivals ? M.rivals[i] : n, c]).concat([['J2', '#ff4fd8'], ['J3', '#b070ff'], ['J4', '#ff4040']]);
  const opps = OPP.map(([, col]) => {
    const g = carG.clone(), m = reflects(livery(new THREE.Color(col).getHex())), b = brakeMat.clone(), u = { fire: b, wheelPart: wheelMat.clone(), ground: groundMat.clone() }; m.emissive.setRGB(1, 1, 1); m.emissiveMap = m.map; m.emissiveIntensity = 0.3; // slightly luminous: readable at night and from afar
    g.traverse(o => { if (o.material === carMat) o.material = m; else if (o.material === brakeMat) o.material = b; else if (o.material === wheelMat) o.material = u.wheelPart; else if (o.material === groundMat) o.material = u.ground; });
    g.visible = false; g.userData.y = 0; Object.assign(g.userData, u, { col: new THREE.Color(col), liv: m }); scene.add(g); return g;
  });
  Object.assign(carG.userData, { fire: brakeMat, wheelPart: wheelMat, ground: groundMat, col: new THREE.Color(L.col), liv: carMat }); // after the copies: Object3D.clone copies userData as JSON
  // braking of a car (fr: brake force, 0 to 1) on its model g: brake light, glow on the ground, and discs that heat up under hard braking (≈ 1.5 s at full from the peak) then cool down in ~3 s
  const brakeParts = (g, fr, sp, dt) => { const u = g.userData, h = u.ch = clamp((u.ch || 0) + (fr && sp > 12 ? fr * sp / TOP * 0.9 : -0.35) * dt, 0, 1); u.fr = fr;
    u.fire.color.setHex(fr ? 0xff7080 : 0x8a1020); u.ground.opacity = fr * (0.25 + 0.5 * Math.min(1, nightV)); g.children[7].visible = fr > 0.001; u.wheelPart.emissive.setRGB(1.6 * h * h, 0.55 * h ** 3, 0.12 * h ** 4); }; // dark red, then orange when it is worked hard; g.children[7]: the glow plane, hidden outside braking (one draw call less per car)
  // The three rivals have a personality, set by their rank (OPP, from fastest to slowest): the reference, the hothead, the rookie.
  // A line at the start, when we pass them, when they pass us (solo, outside demo; at most one every 7 s, shown for 3 s). Texts in capitals without accents: their English text is in language.js.
  const SPIKES = [
    { grid: ["ON SE RETROUVE A L'ARRIVEE.", 'REGARDE BIEN MES FEUX ARRIERE.'], double: ['PROFITE, CA NE DURERA PAS.', 'JOLI. TIENS LE RYTHME.'], pass: ["LA VOIE RAPIDE, C'EST MOI.", "IL TE FAUDRA PLUS D'UNE NUIT."] },
    { grid: ['PAS DE FREIN CE SOIR.', 'PREMIER VIRAGE : PORTE A PORTE'], double: ["HE ! TU M'AS FROTTE !", 'JE REVIENS, JE REVIENS !'], pass: ['POUSSE-TOI !', 'TROP LENT, TROP TARD !'] },
    { grid: ['MES MAINS TREMBLENT...', 'MA PREMIERE COURSE DE NUIT...'], double: ['VAS-Y, JE NE BOUGE PAS !', 'BIEN VU. JE PRENDS DES NOTES.'], pass: ['OH ! PARDON ! ENFIN... NON.', "J'AI DOUBLE QUELQU'UN ?!"] },
  ];
  let spike = null, spikeT = 0; // spike = { s: text, c: colour, T: time left on screen }; spikeT: delay before the next one
  const VOICE = [[110, 7], [160, 10], [240, 8]]; // radio voice of each rival (SOUND.radio): pitch in Hz and syllables per second — low and calm, nervous, young
  const said = new Set(); // lines already said in this race (data/taunts.js: the extra ones, per character, per event and per map; a line comes back only once its list is exhausted)
  const peakAt = (c, ev, E) => { if (c.k < 0 || c.k > 2 || spikeT > 0) return; const p = TAUNTS.pickLine(E || [...SPIKES[c.k][ev], ...TAUNTS.rival[c.k][ev]], said), l = typeof p === 'string' ? p : p[0]; spike = { n: OPP[c.k][0], s: l, c: OPP[c.k][1], T: 3 }; spikeT = 7; SOUND.radio(Math.min(10, Math.ceil(l.split(' ').length * 1.6)), ...VOICE[c.k]); };
  const pickEvt = (E, p = 1) => { const r = race.cars.filter(c => c.k >= 0 && c.k < 3 && !c.out); if (r.length && Math.random() < p) peakAt(r[Math.random() * r.length | 0], '', E); }; // a player event: a random rival comments on it (p: chance)
  const J1 = ['J1', TH.hud.y], pierBuf = c => c.k >= 0 ? OPP[c.k] : J1, model = c => c.k >= 0 ? opps[c.k] : carG;
  // the human cars, one per player seat (vu.hu of the view at rank n: HUM[n]): model, body (roll), wheels, brake light, nitro flames and trails. A copy of carG has the same children in the same order: body, four wheels, two flameSet.
  // Player 2 therefore has all of player 1's animation, whereas the opponents keep their wheels fixed
  const HUM = [[carG, brakeMat], ...opps.slice(3).map(g => [g, g.userData.fire])].map(([g, fire]) => ({ g, fire, body: g.children[0], wheels: g.children.slice(1, 5), fl: g.children.slice(5, 7), ...trail() }));
  // the four wheels of a car in one draw call (and one in the shadow) instead of four: the wheel groups (children 1 to 4) stay and turn as before, their meshes are hidden,
  // and wheelsInst copies their pose into the instance, added as the last child (the order of the others does not change)
  const RI = [carG, ...opps].map(g => { const w = g.children[1].children[0], m = new THREE.InstancedMesh(w.geometry, w.material, 4); m.castShadow = true; g.add(m); for (let r = 1; r < 5; r++) g.children[r].children[0].visible = false; return [g, m]; }), mRI = new THREE.Matrix4();
  const wheelsInst = () => { for (const [g, m] of RI) if (g.visible) { for (let r = 1; r < 5; r++) { const st = g.children[r], w = st.children[0]; st.updateMatrix(); w.updateMatrix(); m.setMatrixAt(r - 1, mRI.multiplyMatrices(st.matrix, w.matrix)); } m.instanceMatrix.needsUpdate = true; } };

  backdrop && await whoosh();
  // ---------- damage: purely visual and sound (driving and times know nothing of it: ghosts, medals and network untouched), reset at each start ----------
  // The impact model is that of sim.js (wear, docs/PHYSICS.md): only the normal speed breaks things, caps of 0.4 per lap and 0.7 per zone.
  // Per model (g.userData.dmgP): z = wear of the zones [front, rear, side z < 0, side z > 0]; z0 = the zones at the start of the lap; the body dents around each impact, all the more as the hit has worn it;
  // parts hang, then fall at thresholds of their zone (only one hangs at a time, drawn separately on its hinge); ph / fe = headlight / light fallen on each side [z < 0, z > 0]: its dynamic light goes out (viewFrame);
  // debris stays on the ground for the whole race (at most DEBRIS_MAX, the oldest disappears), pushed by passing cars; hood smoke; cracked window painted on the livery.
  // Each model has its own copy of carG's geometries (shapes-cars.js): P0 = the intact shape, d = the accumulated dent.
  const DMG_MAX = 0.38, DMGV = new Float32Array(32), DEBRIS = [], DEBRIS_MAX = 40, HCB = new THREE.Color(0xfff2d0).multiplyScalar(1.1 * BRIGHT_GAIN); let dmgT = 0;
  // glass shards: small thick triangular prisms (real thickness, edges that catch the light), shiny and transparent; one burst = one InstancedMesh (one draw call); at most BURSTS bursts, the oldest disappears
  const GLASS = [new THREE.MeshStandardMaterial({ color: 0xd8ecf6, emissive: 0x405868, roughness: 0.04, metalness: 0.7, envMap: CUBE.texture, envMapIntensity: 1.8, transparent: true, opacity: 0.75, side: THREE.DoubleSide }), // window and headlight
    new THREE.MeshStandardMaterial({ color: 0xff2a18, emissive: 0x400800, roughness: 0.15, metalness: 0.3, envMap: CUBE.texture, transparent: true, opacity: 0.85, side: THREE.DoubleSide })]; // tail light
  const SHARD = (() => { const a = [0, 0], b = [1, 0.15], c = [0.35, 0.85], e = 0.12, h = 0.17, p = [], add = (...v) => v.forEach(q => p.push(q[0] * h, q[1], q[2] * h)); // triangle 17 cm, 2 cm thick: visible with the race camera (at 9 cm, less than a pixel)
    const T0 = [a, b, c].map(([x, z]) => [x, 0, z]), T1 = [a, b, c].map(([x, z]) => [x, e * h, z]); add(T0[0], T0[2], T0[1]); add(T1[0], T1[1], T1[2]);
    for (let i = 0; i < 3; i++) { const j = (i + 1) % 3; add(T0[i], T0[j], T1[j]); add(T0[i], T1[j], T1[i]); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.translate(-0.4 * h, -e * h / 2, -0.33 * h); g.computeVertexNormals(); return g; })();
  const BURSTS = 16, GER = [], gm4 = new THREE.Matrix4(), gsc = new V3();
  function shards(x, y, z, n, glassMat, vx, vz, ox, oz, y0) { // one burst of n shards from (x, y, z), thrown toward (ox, oz) and with the car; y0: the ground
    const im = new THREE.InstancedMesh(SHARD, GLASS[glassMat], n); im.userData.dyn = 1; im.frustumCulled = false; im.castShadow = false; scene.add(im);
    const G = { im, y0, e: Array.from({ length: n }, () => ({ p: new V3(x + jit(0.4), y + jit(0.2), z + jit(0.4)), v: new V3(vx * 0.6 + ox * (2 + Math.random() * 3) + jit(3), 1 + Math.random() * 3.5, vz * 0.6 + oz * (2 + Math.random() * 3) + jit(3)),
      q: new THREE.Quaternion().setFromEuler(new THREE.Euler(jit(6), jit(6), jit(6))), w: new V3(jit(30), jit(30), jit(30)), s: 0.5 + Math.random() * 1.3, asleep: 0 })), asleep: 0 };
    GER.push(G); while (GER.length > BURSTS) { const o = GER.shift(); scene.remove(o.im); o.im.dispose(); } burstPut(G); }
  const burstPut = G => { G.e.forEach((e, i) => { im4(e); G.im.setMatrixAt(i, gm4); }); G.im.instanceMatrix.needsUpdate = true; };
  const im4 = e => gm4.compose(e.p, e.q, gsc.setScalar(e.s));
  const dq4 = new THREE.Quaternion(), ax4 = new V3();
  function shardsStep(dt) { for (const G of GER) { if (G.asleep) continue; let sleeping = 0;
    for (const e of G.e) { if (e.asleep) { sleeping++; continue; } e.v.y -= 15 * dt; e.p.addScaledVector(e.v, dt); const wl = e.w.length(); if (wl > 1e-3) { dq4.setFromAxisAngle(ax4.copy(e.w).divideScalar(wl), wl * dt); e.q.premultiply(dq4); }
      if (e.p.y < G.y0 + 0.01) { e.p.y = G.y0 + 0.01; e.v.y *= -0.25; e.v.x *= 0.4; e.v.z *= 0.4; e.w.multiplyScalar(0.3); if (e.v.length() < 0.3) { e.asleep = 1; e.q.setFromEuler(new THREE.Euler(0, Math.random() * 6.28, 0)); } } } // lying flat: it glints on the ground
    burstPut(G); if (sleeping === G.e.length) G.asleep = 1; } }
  const nose = Math.max(...VO.plan.aboveBody.map(q => q[0])), tail = Math.min(...VO.plan.aboveBody.map(q => q[0])), cabin0 = VO.plan.cab[0][0], cabin3 = VO.plan.cab[3][0];
  const profData = x => { const d = VO.plan.aboveBody; let y = 0; for (let i = 0; i < d.length - 1; i++) { const [x0, y0] = d[i], [x1, y1] = d[i + 1]; if (x0 !== x1 && (x - x0) * (x - x1) <= 0) y = Math.max(y, y0 + (y1 - y0) * (x - x0) / (x1 - x0)); } return y; }; // height of the body top at x
  const hash = (x, y, z) => { const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453; return s - Math.floor(s); }; // same point, same noise: coincident vertices stay welded
  const DMGM = [carG, ...opps].map(g => {
    const D = { z: [0, 0, 0, 0], z0: [0, 0, 0, 0], lap: 0, ph: [0, 0], fe: [0, 0], m: [], p: [], t: -1, fis: null, liv: null, pend: null, c: null };
    g.children[0].traverse(o => { const zn = Object.keys(VO.zones).find(k => VO.zones[k] === o.geometry); if (!zn) return;
      const ge = o.geometry = o.geometry.clone(), P = ge.attributes.position.array; D.m.push({ o, zn, P0: P.slice(), d: new Float32Array(P.length) });
      if (zn === 'carBody') D.liv = o.material; });
    // parts: the triangles that pass their test, in one or several zones; { pend: threshold where it hangs (absent: falls at once), off: threshold where it falls, ch: hinge, glassMat: shards (0 headlight, 1 light), s: side, sg: where it leaves }
    const me = zn => D.m.find(m => m.zn === zn), uvC = me('carBody').o.geometry.attributes.uv.array, unison = i => Math.abs(uvC[i / 3 * 2] - 124 / 128) < 1e-3 && Math.abs(uvC[i / 3 * 2 + 1] - 0.25) < 1e-3; // the flat tint of the livery (plan.tintMat)
    const seek = (label, zi, specs, o) => { const parts = []; for (const [zn, test] of specs) { const m = me(zn); if (!m) continue; const P = m.P0, triIdx = [];
        for (let i = 0; i < P.length; i += 9) { let ok = true; for (let k = 0; k < 9 && ok; k += 3) ok = test(P[i + k], P[i + k + 1], P[i + k + 2], i + k); if (ok) triIdx.push(i); }
        if (triIdx.length) parts.push({ me: m, triIdx }); }
      if (parts.length) D.p.push({ label, zi, parts, curState: 0, ...o }); };
    for (const s of [-1, 1]) {
      seek('retroRefl', s < 0 ? 2 : 3, [['carBody', (x, y, z, i) => unison(i) && z * s > VO.plan.wc / 2 && x > cabin0 - 0.5 && x < cabin0 + 0.3]], { off: 0.25, sg: [0, s], s });
      seek('headlight', 0, [['headlight', (x, y, z) => z * s > 0]], { off: 0.25, sg: [1, s * 0.5], s, glassMat: 0 });
      seek('fire', 1, [['fire', (x, y, z) => z * s > 0]], { off: 0.25, sg: [-1, s * 0.5], s, glassMat: 1 });
    }
    seek('bumpers', 0, [['blackM', (x, y) => x > nose - 0.3 && y < 0.5]], { pend: 0.3, off: 0.45, ch: 'tip', sg: [1, 0] });
    seek('bumpers', 1, [['blackM', (x, y) => x < tail + 0.3 && y < 0.5]], { pend: 0.3, off: 0.45, ch: 'tip', sg: [-1, 0] });
    const wng = (x, y) => x < cabin3 - 0.1 && y > profData(x) + 0.05; seek('tailFin', 1, [['carBody', wng], ['blackM', wng]], { pend: 0.35, off: 0.55, ch: 'tip', sg: [-1, 0] });
    if (D.liv) { const im = D.liv.map.image; D.fis0 = im.getContext('2d').getImageData(0, 0, im.width, im.height); } // the intact livery, read at load: reading it again at the first impact (crack) blocked until the GPU returned the canvas, from 50 ms to nearly a second
    return g.userData.dmgP = D;
  });
  const dmgWritten = (D, me) => { const ge = me.o.geometry, P = ge.attributes.position.array; for (let i = 0; i < P.length; i++) P[i] = me.P0[i] + me.d[i];
    for (const p of D.p) if (p.curState) for (const q of p.parts) if (q.me === me) for (const i of q.triIdx) P.fill(0, i, i + 9); // part that hangs (drawn separately) or fallen: its triangles reduced to a point
    ge.attributes.position.needsUpdate = true; ge.computeVertexNormals(); };
  function dmgReset() { // start of a race: all cars intact, debris cleared, marks erased
    for (const D of DMGM) { if (D.pend) { D.pend.piv.parent.remove(D.pend.piv); D.pend = null; }
      D.z.fill(0); D.z0.fill(0); D.lap = 0; D.ph.fill(0); D.fe.fill(0); D.t = -1;
      for (const p of D.p) p.curState = 0;
      for (const me of D.m) { me.d.fill(0); dmgWritten(D, me); }
      if (D.fis) { D.liv.map.image.getContext('2d').putImageData(D.fis, 0, 0); D.liv.map.needsUpdate = true; D.fis = null; } }
    for (const d of DEBRIS) { scene.remove(d.m); d.m.geometry.dispose(); } DEBRIS.length = 0;
    for (const G of GER) { scene.remove(G.im); G.im.dispose(); } GER.length = 0; for (const D of DMGM) D.panes = {};
    for (const vu of VIEWS) vu.hu.gR[0].length = vu.hu.gR[1].length = vu.hu.gOn[0] = vu.hu.gOn[1] = 0;
    sceneryReset(); oilReset();
  }
  // an impact on model g: (lx, lz) = where it comes from, unit vector, in the car's frame (x forward); f = its normal speed (m/s); (vx, vz) = car speed, kept by falling parts
  function dmgImpact(g, lx, lz, f, vx = 0, vz = 0, type = 'intoWall', zs = null) { // zs: in CASSE mode, the zones sim.js has already computed (c.ca.z), with no cap
    const D = g.userData.dmgP, z0 = D.z[0] + D.z[1] + D.z[2] + D.z[3], du = zs ? (zs.forEach((v, i) => { D.z[i] = v; }), D.z[0] + D.z[1] + D.z[2] + D.z[3] - z0) : wear(D.z, D.z0, lx, lz, f, type);
    const t = Math.min(ENCt.x / 2 / (Math.abs(lx) + 1e-6), ENCt.z / 2 / (Math.abs(lz) + 1e-6)), px = ENCc.x + lx * t, pz = ENCc.z + lz * t;
    if (du > 0.002) { // the dent follows the added wear (nothing more once the cap is reached); a face that lost its bumper bends 1.5 times more
      const nu = lx * lx > 0.5 && D.p.some(p => p.label === 'bumpers' && p.curState === 2 && p.zi === (lx > 0 ? 0 : 1)), R = 0.6 + 1.2 * Math.sqrt(du), pr = (0.06 + 0.6 * du) * (nu ? 1.5 : 1);
      for (const me of D.m) { const P = me.P0, d = me.d;
        for (let i = 0; i < P.length; i += 3) { const r = Math.hypot(P[i] + d[i] - px, (P[i + 1] + d[i + 1] - 0.55) * 1.4, P[i + 2] + d[i + 2] - pz); if (r >= R) continue;
          const w = (1 - r / R) ** 2 * pr * (0.6 + 0.8 * hash(P[i], P[i + 1], P[i + 2])); d[i] -= lx * w; d[i + 1] -= w * 0.3 * hash(P[i + 2], P[i], P[i + 1]); d[i + 2] -= lz * w; // crumpled: each point a bit more or a bit less
          const l = Math.hypot(d[i], d[i + 1], d[i + 2]); if (l > DMG_MAX) for (let c = 0; c < 3; c++) d[i + c] *= DMG_MAX / l; } } }
    for (const p of D.p) { if (p.curState === 2) continue; const z = D.z[p.zi], sideOf = !p.s || pz * p.s > -0.2 || z > 0.6; // mirrors and optics: on the impact side
      if (!zs && p.label === 'headlight' && D.p.some(q => q !== p && q.label === 'headlight' && q.curState)) continue; // outside CASSE, one headlight always stays: at night, otherwise the road can no longer be seen
      if (z >= p.off && sideOf) { if (D.pend && D.pend.p === p) letGo(g, D, vx, vz); else { p.curState = 2; falls(g, p, chunks(p), p.parts[0].me.o.parent, vx, vz); } }
      else if (!p.curState && p.pend != null && z >= p.pend) pend(g, D, p, vx, vz); }
    for (const p of D.p) if (p.curState === 2 && p.glassMat !== undefined) D[p.glassMat ? 'fe' : 'ph'][p.s < 0 ? 0 : 1] = 1;
    for (const me of D.m) dmgWritten(D, me);
    if (f > 14 && lx * lx > 0.4) pane(g, lx > 0 ? 'av' : 'ar', vx, vz); // head-on hit (windshield) or from behind (rear window)
    if (f > 12 && lz * lz > 0.4) pane(g, lz < 0 ? -1 : 1, vx, vz); // side impact: the side window shatters
  }
  const chunks = p => p.parts.map(({ me, triIdx }) => { const A = new Float32Array(triIdx.length * 9), U = new Float32Array(triIdx.length * 6), uv = me.o.geometry.attributes.uv.array, ge = new THREE.BufferGeometry(); // the part as dented, in the model's frame
    triIdx.forEach((i, k) => { for (let j = 0; j < 9; j++) A[k * 9 + j] = me.P0[i + j] + me.d[i + j]; U.set(uv.subarray(i / 3 * 2, i / 3 * 2 + 6), k * 6); });
    ge.setAttribute('position', new THREE.BufferAttribute(A, 3)); ge.setAttribute('uv', new THREE.BufferAttribute(U, 2)); ge.computeVertexNormals(); ge.computeBoundingBox();
    const m = new THREE.Mesh(ge, me.o.material); m.castShadow = true; m.layers.mask = me.o.layers.mask; return m; });
  function debris(m, v) { m.userData.dyn = 1; m.layers.set(SHDD); shdM.push(m); m.castShadow = true; scene.add(m); DEBRIS.push({ m, v, w: new V3(jit(10), jit(10), jit(10)), y0: m.position.y - 1, asleep: 0 });
    while (DEBRIS.length > DEBRIS_MAX) { const o = DEBRIS.shift(); scene.remove(o.m); o.m.geometry.dispose(); } }
  function falls(g, p, ms, parent, vx, vz) { // a part that detaches, thrown outward; an optic also leaves shards
    g.updateMatrixWorld(true); const q = parent.getWorldQuaternion(new THREE.Quaternion()), c = new V3(), y0 = g.position.y;
    const fx = Math.cos(g.rotation.y), fz = -Math.sin(g.rotation.y), ox = fx * p.sg[0] - fz * p.sg[1], oz = fz * p.sg[0] + fx * p.sg[1]; // g.rotation.y = -cap
    for (const m of ms) { m.geometry.computeBoundingBox(); m.geometry.boundingBox.getCenter(c); m.geometry.translate(-c.x, -c.y, -c.z); m.position.copy(c).applyMatrix4(parent.matrixWorld); m.quaternion.copy(q);
      debris(m, new V3(vx * 0.8 + ox * 3, 2 + Math.random() * 2, vz * 0.8 + oz * 3)); DEBRIS[DEBRIS.length - 1].y0 = y0; }
    if (p.glassMat !== undefined) { const q0 = ms[0].position; shards(q0.x, q0.y, q0.z, 18, p.glassMat, vx, vz, ox, oz, y0); } // the optic bursts into glass (clear) or plastic (red) pieces
  }
  function pend(g, D, p, vx, vz) { // the part comes loose on one side: it holds on the less damaged side, the other end falls (and drags on the ground)
    if (D.pend) letGo(g, D, vx, vz);
    const ms = chunks(p), bb = new THREE.Box3(); for (const m of ms) bb.union(m.geometry.boundingBox);
    const c = bb.getCenter(new V3()), s = D.z[2] < D.z[3] ? -1 : 1, h = new V3(c.x, bb.max.y, s < 0 ? bb.min.z : bb.max.z), piv = new THREE.Group();
    piv.position.copy(h); for (const m of ms) { m.geometry.translate(-h.x, -h.y, -h.z); piv.add(m); } p.parts[0].me.o.parent.add(piv);
    p.curState = 1; D.pend = { p, piv, a: -s * 0.22, t: 0, tip: new V3(0, -0.15, (s < 0 ? bb.max.z : bb.min.z) - h.z) }; piv.rotation.x = D.pend.a;
  }
  function letGo(g, D, vx, vz) { const { p, piv } = D.pend; D.pend = null; p.curState = 2; piv.updateMatrix(); const ms = [...piv.children]; // the part that was hanging falls, as it was hanging
    for (const m of ms) { m.geometry.applyMatrix4(piv.matrix); piv.remove(m); } const parent = piv.parent; parent.remove(piv); falls(g, p, ms, parent, vx, vz); }
  function pane(g, w, vx, vz) { // a window that bursts: w = 'av' (windshield), 'ar' (rear window), -1 or 1 (side window on that side); once per window and per race
    const D = g.userData.dmgP; D.panes = D.panes || {}; if (D.panes[w]) return; D.panes[w] = 1;
    const p = VO.plan, [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = p.cab, l = typeof w === 'string' ? (w === 'av' ? [(x0 + x1) / 2, (y0 + y1) / 2, 0, 1, 0] : [(x2 + x3) / 2, (y2 + y3) / 2, 0, -1, 0]) : [(x0 + x3) / 2, (y0 + y1) / 2 + 0.05, w * p.wc / 2, 0, w];
    g.updateMatrixWorld(true); const q = new V3(l[0], l[1], l[2]).applyMatrix4(g.children[0].matrixWorld), fx = Math.cos(g.rotation.y), fz = -Math.sin(g.rotation.y), ox = fx * l[3] - fz * l[4], oz = fz * l[3] + fx * l[4];
    shards(q.x, q.y, q.z, typeof w === 'string' ? 40 : 26, 0, vx, vz, ox, oz, g.position.y); paintedPane(D, w); }
  function paintedPane(D, w) { // the broken window, painted on the livery: a dark hole sprinkled with starred glass (one pixel in three), and a few cracks; dmgReset restores the original image
    if (!D.liv) return; const lv = D.liv.map, g = lv.image.getContext('2d'), p = VO.plan, [[x0, y0], [x1], [x2], [x3, y3]] = p.cab, hw = p.wc / 2 - 0.11, belt = y0, beltR = y3; if (!D.fis) D.fis = D.fis0;
    const zones = w === 'av' ? [[p.above, [[x0, -hw], [x0, hw], [x1 + 0.06, hw], [x1 + 0.06, -hw]]], [p.av, [[-hw, belt], [hw, belt], [hw, 1.5], [-hw, 1.5]]]]
      : w === 'ar' ? [[p.above, [[x2 - 0.06, -hw], [x2 - 0.06, hw], [x3, hw], [x3, -hw]]], [p.ar, [[-hw, beltR], [hw, beltR], [hw, 1.5], [-hw, 1.5]]]]
      : [[p.sideOf, p.cab.map(([x, y], i) => [x + (i < 2 ? -0.1 : 0.1), y + (i === 0 || i === 3 ? 0.06 : -0.08)])]]; // shortcut: both sides share the same side view (plan.sideOf): a broken side window is broken on both sides
    for (const [view, pts] of zones) { const P = pts.map(([a, b]) => view(a, b)), xs = P.map(q => q[0]), ys = P.map(q => q[1]);
      g.save(); g.beginPath(); P.forEach(([a, b], i) => i ? g.lineTo(a, b) : g.moveTo(a, b)); g.closePath(); g.clip(); g.fillStyle = '#05070a'; g.fill();
      g.fillStyle = '#c4dbe6'; for (let y = Math.floor(Math.min(...ys)); y <= Math.max(...ys); y++) for (let x = Math.floor(Math.min(...xs)); x <= Math.max(...xs); x++) if (Math.random() < 0.33) g.fillRect(x, y, 1, 1);
      g.strokeStyle = 'rgba(235,245,255,0.9)'; g.lineWidth = 1; g.beginPath(); const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      for (let i = 0; i < 7; i++) { const an = Math.random() * 6.28, l = 3 + Math.random() * 8; g.moveTo(cx, cy); g.lineTo(cx + Math.cos(an) * l, cy + Math.sin(an) * l); } g.stroke(); g.restore(); }
    lv.needsUpdate = true; }
  const dmgStep = (c, vx0, vz0) => { // after a simulation step: a head-on hit (wall, truck, other car) damages its model; it comes from the opposite of what it did to the speed
    const g = model(c), D = g.userData.dmgP, lap = Math.floor(c.dist / T.n); D.c = c; if (lap !== D.lap) { D.lap = lap; D.z0 = D.z.slice(); } // new lap: each zone may take 0.4 again
    wallImpact(c); const f = Math.max(c.hit, c.bump || 0); if (f <= 3 || dmgT - D.t < 0.15) return; D.t = dmgT; // a contact that lasts counts only once
    let dx = vx0 - c.vx, dz = vz0 - c.vz, l = Math.hypot(dx, dz); if (l < 0.5) { dx = c.vx; dz = c.vz; l = Math.hypot(dx, dz) || 1; }
    const fx = Math.cos(c.th), fz = Math.sin(c.th); dmgImpact(g, (dx * fx + dz * fz) / l, (dz * fx - dx * fz) / l, f, c.vx, c.vz, (c.bump || 0) > c.hit ? 'vehicle' : 'intoWall', c.ca ? c.ca.z : null);
  };
  const dmgLvl = c => { const z = model(c).userData.dmgP.z; return Math.min(1, z[0] * 0.6 + (z[1] + z[2] + z[3]) * 0.2); }; // for the sound: the front (the engine) counts the most
  function dmgFrame(dt) { shardsStep(dt); // debris (which fall, then sleep on the ground until a car chases them away), a hanging part, smoke from a very damaged hood
    const cars = race ? race.cars : VIEWS.map(v => v.car);
    for (const d of DEBRIS) { const p = d.m.position;
      for (const c of cars) { const sp = Math.hypot(c.vx, c.vz), dx = p.x - c.x, dz = p.z - c.z, l = Math.hypot(dx, dz); if (l > 2.2 || sp < 3 || p.y > d.y0 + 1.2) continue; // a car drives over it: the debris moves off ahead of it
        d.v.set(c.vx * 0.8 + dx / (l || 1) * 2, 1 + Math.random() * 2 + sp * 0.05, c.vz * 0.8 + dz / (l || 1) * 2); d.w.set(jit(16), jit(16), jit(16)); if (d.asleep) { d.asleep = 0; d.m.castShadow = true; } }
      if (d.asleep) continue;
      d.v.y -= 15 * dt; p.addScaledVector(d.v, dt); d.m.rotation.x += d.w.x * dt; d.m.rotation.y += d.w.y * dt; d.m.rotation.z += d.w.z * dt;
      if (p.y < d.y0 + 0.06) { p.y = d.y0 + 0.06; d.v.y *= -0.3; d.v.x *= 0.5; d.v.z *= 0.5; d.w.multiplyScalar(0.5); if (d.v.length() < 0.4) { d.asleep = 1; d.m.castShadow = false; } } } // resting: it no longer casts a shadow (one draw call less)
    // shortcut: a piece of debris sleeps at the height of the car it fell from; chased far down a slope, it may float or sink a little; later, a single mesh for the resting debris (docs/PHYSICS.md)
    for (const D of DMGM) { const P = D.pend; if (!P || !D.c) continue; const c = D.c, sp = Math.hypot(c.vx, c.vz); P.t += dt; // the hanging part sways with the speed; a dragging end throws sparks
      P.piv.rotation.x = P.a * (1 + Math.min(1, sp / 15) * 0.3 * Math.sin(P.t * (4 + sp * 0.25)));
      if (sp > 6 && P.piv.parent && Math.random() < dt * 20) { const w = P.piv.localToWorld(P.tip.clone()); emit(w.x, Math.max(w.y, model(c).position.y + 0.05), w.z, c.vx * 0.5 + jit(2), Math.random() * 2, c.vz * 0.5 + jit(2), 0.4, 1, 0.7, 0.3, 22); } }
    for (const g of [carG, ...opps]) { const D = g.userData.dmgP, c = D.c, z = D.z[0]; if (!c || !g.visible || z < 0.6 || c.air || Math.random() > dt * 10 * (z - 0.5)) continue; // grey steam comes out of the front from 0.6 wear, denser after that
      const fx = Math.cos(c.th), fz = Math.sin(c.th), a = ENC.max.x - 0.9; pix(0, c.x + fx * a + jit(0.5), g.position.y + 0.9, c.z + fz * a + jit(0.5), c.vx * 0.55 + jit(0.6), 0.8 + Math.random() * 0.8, c.vz * 0.55 + jit(0.6), 0.9 + Math.random() * 0.6); }
  }
  // tail lights of opponents and trucks: two red points outside the fog (beyond 60 m the body is only a few pixels and nothing lights it);
  // their size follows the distance (a light about 0.5 m): from afar, never larger than the vehicle, and never under 1 pixel (WebGL's minimum), so always visible;
  // within 40 m, no point: the body's lights are visible, and a 0.5 m point would make a red block there
  const lightsGeo = new THREE.BufferGeometry(), lightsP = new Float32Array(6 * Math.max(3, M.traffic || 0)); lightsGeo.setAttribute('position', new THREE.BufferAttribute(lightsP, 3));
  const lights = new THREE.Points(lightsGeo, new THREE.PointsMaterial({ color: 0xff2030, size: 1, fog: false })); lights.frustumCulled = false; scene.add(lights);
  // th.headlightsHaze: the beams of the two headlights of the followed car, visible in the fog bank (per headlight, a flat additive sheet, bright near the nose, off at 30 m)
  const cones = TH.headlightsHaze ? (() => { const g = new THREE.BufferGeometry(), L = 30, P = [], C = []; for (const sd of [-0.62, 0.62]) { P.push(sd, 0, 0, sd * 1.4 - 3.2, 0.3, L, sd * 1.4 + 3.2, 0.3, L); C.push(1, 0.95, 0.8, 0, 0, 0, 0, 0, 0); } // one flat sheet per headlight, held above the road (an upright sheet showed its edge as a hard line)
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide })); m.frustumCulled = false; m.renderOrder = 51; m.userData.dyn = 1; m.visible = false; scene.add(m); return m; })() : null; // renderOrder 51: after the bank's veil (50)

  // ---------- scenery that gets damaged (docs/PHYSICS.md, prototype 2): purely visual, like the damage; reset at each start (sceneryReset) ----------
  // Guardrails: each side (WALL_SIDES) keeps the shape of the impacts, dz[i] = setback of sample i (m). sim.js's collision does not move: a dented rail leaves a hollow behind the car, not aheadSec.
  // Paint: a ring of MN segments on the walls (band in the car's tint + light stripe), re-aligned to the guardrail when it steps back.
  // Cones and bins: placed at the edge of bends, they fly off on contact with a car (which knows nothing of it) and stay where they fall.
  const DS = T.len / N, OFF = s => T.vert ? s.w : W, MDZ = { '-1': new Float32Array(N), 1: new Float32Array(N) }; // OFF: where the wall is
  for (const sg in WALL_SIDES) for (const B of WALL_SIDES[sg]) { B.M.userData.dyn = 1; B.P0 = B.M.geometry.attributes.position.array.slice(); }
  const murK = i => (i - T.t1 + N) % N; // the rank of sample i in a ribbon starting at T.t1 (beyond cO: in the tunnel, no guardrail)
  function wallWritten(sg, a, b) { const d = MDZ[sg];
    for (const { M, i0, n, P0 } of WALL_SIDES[sg]) { const P = M.geometry.attributes.position.array;
      for (let j = a; j <= b; j++) { const i = (j + N) % N, k = (i - i0 + N) % N; if (k > n) continue; const s = S[i], nx = -s.tz * sg, nz = s.tx * sg; // beyond n: out of the band (tunnel, structure)
        for (const kk of k === 0 && n >= N ? [0, N] : [k]) for (let v = 0; v < 2; v++) { const q = (kk * 2 + v) * 3; P[q] = P0[q] + nx * d[i]; P[q + 2] = P0[q + 2] + nz * d[i]; } } // a band that loops around: the last sample is the first
      M.geometry.attributes.position.needsUpdate = true; } }
  function wallTwists(i, sg, vn) { if (vn <= 6) return; const d = Math.min(0.3, 0.03 * (vn - 6)), R = Math.max(1, Math.round((1.5 + 0.12 * vn) / DS)), D = MDZ[sg];
    for (let j = -R; j <= R; j++) { const u = 1 - Math.abs(j) / (R + 1), i2 = (i + j + N) % N; D[i2] = Math.min(0.45, D[i2] + d * u * u * (3 - 2 * u)); }
    wallWritten(sg, i - R, i + R); marksFollow(sg); }
  const MN = 2000, mP = new Float32Array(MN * 24), mB = new Float32Array(MN * 24), mC = new Float32Array(MN * 32), mI = new Uint32Array(MN * 12), mK = new Int32Array(MN * 2), mS = new Int8Array(MN), mGeo = new THREE.BufferGeometry(); let mi = 0;
  for (let k = 0; k < MN * 2; k++) mI.set([k * 4, k * 4 + 1, k * 4 + 2, k * 4 + 1, k * 4 + 3, k * 4 + 2], k * 6);
  mGeo.setAttribute('position', new THREE.BufferAttribute(mP, 3)); mGeo.setAttribute('color', new THREE.BufferAttribute(mC, 4)); mGeo.setIndex(new THREE.BufferAttribute(mI, 1));
  const mMesh = new THREE.Mesh(mGeo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); mMesh.frustumCulled = false; mMesh.userData.dyn = 1; scene.add(mMesh);
  const mPut = n => { for (let v = 0; v < 8; v++) { const e = mK[n * 2 + (v & 2 ? 1 : 0)], s = S[e], sg = mS[n], dz = MDZ[sg][e], q = n * 24 + v * 3; // vertices 0-1 and 4-5 at end a, 2-3 and 6-7 at end b
    mP[q] = mB[q] - s.tz * sg * dz; mP[q + 1] = mB[q + 1]; mP[q + 2] = mB[q + 2] + s.tx * sg * dz; } };
  const mSend = () => { mGeo.attributes.position.needsUpdate = mGeo.attributes.color.needsUpdate = true; };
  function marksFollow(sg) { for (let n = 0; n < MN; n++) if (mS[n] == sg) mPut(n); mSend(); } // the guardrail has stepped back: the paint steps back with it
  function mark(c, sg, vn) { // contact of car c with the wall on side sg (+1: z > 0 of the track, to the left of the normal); vn = normal speed, higher band if strong
    const s = S[c.idx], nx = -s.tz, nz = s.tx, o = sg * (OFF(s) - 0.05) - c.d, x = c.x + nx * o, z = c.z + nz * o, L = MK.get(c), t = dmgT;
    let a, b, ia, ib; if (L && L.sg === sg && t - L.t < 0.3 && Math.hypot(x - L.x, z - L.z) < 3) { if (Math.hypot(x - L.x, z - L.z) < 0.5) return; a = [L.x, L.z]; b = [x, z]; ia = L.i; ib = c.idx; }
    else { const w = 0.25 + Math.min(0.5, vn * 0.03); a = [x - s.tx * w, z - s.tz * w]; b = [x + s.tx * w, z + s.tz * w]; ia = ib = c.idx; } // a single impact: a spot; a rubbing: a streak
    MK.set(c, { x, z, i: c.idx, sg, t });
    const y0 = c.y + 0.3, h = 0.1 + Math.min(0.3, vn * 0.02), col = model(c).userData.col || BLACKP, n = mi;
    [[y0, y0 + h, [col.r, col.g, col.b], 0.85], [y0 + h + 0.03, y0 + h + 0.05, [0.82, 0.82, 0.8], 0.9]].forEach(([ya, yb, cc, al], k) => {
      mB.set([a[0], ya, a[1], a[0], yb, a[1], b[0], ya, b[1], b[0], yb, b[1]], n * 24 + k * 12); for (let v = 0; v < 4; v++) mC.set([...cc, al], n * 32 + k * 16 + v * 4); });
    mK[n * 2] = ia; mK[n * 2 + 1] = ib; mS[n] = sg; mPut(n); mSend(); mi = (mi + 1) % MN;
  }
  const BLACKP = new THREE.Color(0.3, 0.3, 0.32), MK = new WeakMap(); // MK: the last paint point of each car (outside sim.js's object)
  // cones and bins: on the outer edge of bends (where you run wide on exit), one InstancedMesh per kind; bins only in town
  // th.objects: [[colour, top radius, bottom radius, height], …] replaces cones and bins with the map's objects (Persian: jars and baskets), the second one in three; th.withoutObjects: [[i0, i1], …]: no objects at the bends that start within these intervals
  let objSound = 0; // the sound of the object hit during the frame (th.objects, seventh element): read by the sound, then reset
  const urban = ['ville', 'paris', 'canal', 'perse'].includes(M.id), OBJ = [], KINDS = TH.objects ? TH.objects.map(([c, r0, r1, ht, z, shard, sound], i) => ({ label: 'item' + i, geo: new THREE.CylinderGeometry(r0, r1, ht, 8), mat: new THREE.MeshLambertMaterial({ color: c }), r: Math.max(r0, r1), h: ht, z, shard, sound })) : [
    { label: 'cone', geo: new THREE.ConeGeometry(0.22, 0.7, 8), mat: new THREE.MeshLambertMaterial({ color: 0xff6a10 }), r: 0.22, h: 0.7 },
    { label: 'trashcan', geo: new THREE.CylinderGeometry(0.3, 0.26, 0.9, 8), mat: new THREE.MeshLambertMaterial({ color: 0x2c5a34 }), r: 0.3, h: 0.9 }];
  { let a = 12345; const rand = () => (a = (a * 16807) % 2147483647) / 2147483647, places = []; // fixed draw: the same ones each race
    for (let i = 0; i < N; i += 3) { const k = S[i].k || 0, kp = S[(i + N - 6) % N].k || 0; if (Math.abs(k) > 0.012 && Math.abs(kp) <= 0.012 && (murK(i) <= cO || TH.objectsTun) && !(TH.withoutObjects || []).some(([a, b]) => i >= a && i < b)) places.push(i); } // the entry of each marked bend
    if (TH.withoutCones) places.length = 0; // th.withoutCones: no cones or bins at the edge of bends (beach: roadwork cones make no sense on a pontoon or in a cenote)
    for (const i of places.slice(0, TH.cones === 0 ? 0 : TH.nObjects || 14)) { const sg = -Math.sign(S[i].k); for (let j = 0; j < 3; j++) { const ii = (i + j * 3) % N, s = S[ii], o = sg * (OFF(s) - 0.7 - rand() * 0.4), here = KINDS.some(q => q.z) ? [...KINDS.filter(q => q.z && (q.z[0] <= q.z[1] ? ii >= q.z[0] && ii < q.z[1] : ii >= q.z[0] || ii < q.z[1])), ...KINDS.filter(q => !q.z)] : KINDS, kind = here[urban && here.length > 1 && rand() < 0.35 ? 1 : 0]; // th.objects, optional elements: [i0, i1] = the kind is reserved for this stretch (it goes in front of the others there), [r, v, b] = shards on impact, sound on impact
      OBJ.push({ S: kind, x0: s.x - s.tz * o, z0: s.z + s.tx * o, y0: s.y + (T.vert ? wallFace(s, Math.abs(o)) : 0), p: new V3(), v: new V3(), q: new THREE.Quaternion(), w: new V3(), asleep: 1 }); } } }
  for (const [i, o, k] of TH.objectsEn || []) { const s = S[i]; OBJ.push({ S: KINDS[k], x0: s.x - s.tz * o, z0: s.z + s.tx * o, y0: s.y, p: new V3(), v: new V3(), q: new THREE.Quaternion(), w: new V3(), asleep: 1 }); } // th.objectsEn: [[sample, offset from the axis (positive to the right), kind of th.objects], …], placed by the map in addition to those at bend entries
  // h.breakable(parts, x, y, z, radius, height, shards): a scenery object (stall, jar, cart) that can be knocked over like cones; parts = [[InstancedMesh, instance], …], which leave as one block
  for (const [pieces, x, y, z, r, ht, shard] of BREAKABLES) OBJ.push({ S: { r, h: ht, shard }, pieces: pieces.map(([im, k]) => { const m = new THREE.Matrix4(); im.getMatrixAt(k, m); im.userData.dyn = im.userData.broken = 1; return [im, k, m]; }), x0: x, z0: z, y0: y, p: new V3(), v: new V3(), q: new THREE.Quaternion(), w: new V3(), asleep: 1 });
  for (const So of KINDS) { const l = OBJ.filter(o => o.S === So); So.im = new THREE.InstancedMesh(So.geo, So.mat, Math.max(1, l.length)); So.im.count = l.length; So.im.castShadow = true; So.im.userData.dyn = 1; scene.add(So.im); l.forEach((o, k) => { o.k = k; }); }
  // shortcut: the bend's direction (sign of S.k) gives the outside; if a map defines k backwards, the objects would end up inside: to check map by map on the first pass
  const objWritten = o => { const m = new THREE.Matrix4().compose(o.p, o.q, new V3(1, 1, 1)); if (!o.pieces) { o.S.im.setMatrixAt(o.k, m); o.S.im.instanceMatrix.needsUpdate = true; return; }
    m.multiply(new THREE.Matrix4().makeTranslation(-o.x0, -o.y0 - o.S.h / 2, -o.z0)); for (const [im, k, m0] of o.pieces) { im.setMatrixAt(k, new THREE.Matrix4().multiplyMatrices(m, m0)); im.instanceMatrix.needsUpdate = true; } }; // scenery parts: the displacement from the starting pose, applied to each
  function sceneryReset() { for (const sg in MDZ) { MDZ[sg].fill(0); for (const B of WALL_SIDES[sg]) { B.M.geometry.attributes.position.array.set(B.P0); B.M.geometry.attributes.position.needsUpdate = true; } }
    mB.fill(0); mP.fill(0); mSend();
    for (const o of OBJ) { o.p.set(o.x0, o.y0 + o.S.h / 2, o.z0); o.v.set(0, 0, 0); o.w.set(0, 0, 0); o.q.identity(); o.asleep = 1; objWritten(o); } }
  sceneryReset();
  function wallImpact(c) { const s = S[c.idx]; if (c.hit <= 3 || OFF(s) - Math.abs(c.d) > 1.6) return; const sg = Math.sign(c.d) || 1; mark(c, sg, c.hit); if (WALL_SIDES[sg].length) wallTwists(c.idx, sg, c.hit); } // a head-on hit on the wall (not a truck: away from the edge)
  // pixel particles from damaged engines: crisp squares (like the rest of the game), one colour and one size per age level, no gradient
  //   smokePuff: the grey steam from the front from 0.6 wear; black: smoke from an engine on fire; fire (CASSE mode): it smoulders at 0.7, flares at 0.85, sets the car alight when out of use
  const PXN = 900, pxP = new Float32Array(PXN * 3).fill(-1e4), pxV = new Float32Array(PXN * 3), pxC = new Float32Array(PXN * 3), pxA = new Float32Array(PXN), pxS = new Float32Array(PXN), pxL = new Float32Array(PXN), pxL0 = new Float32Array(PXN), pxK = new Uint8Array(PXN), pxGeo = new THREE.BufferGeometry(); let pxi = 0;
  pxGeo.setAttribute('position', new THREE.BufferAttribute(pxP, 3)); pxGeo.setAttribute('col', new THREE.BufferAttribute(pxC, 3)); pxGeo.setAttribute('al', new THREE.BufferAttribute(pxA, 1)); pxGeo.setAttribute('sz', new THREE.BufferAttribute(pxS, 1));
  const pxMesh = new THREE.Points(pxGeo, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { ech: dEch },
    vertexShader: 'attribute vec3 col; attribute float al, sz; varying vec3 c; varying float a; uniform float ech; void main() { c = col; a = al; vec4 p = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * p; gl_PointSize = al > 0.0 ? max(1.0, floor(sz * ech * projectionMatrix[1][1] / -p.z)) : 0.0; }',
    fragmentShader: 'varying vec3 c; varying float a; void main() { gl_FragColor = vec4(c, a); }' })); // no disc, no blur: a solid square, in whole pixels
  pxMesh.frustumCulled = false; pxMesh.userData.dyn = 1; scene.add(pxMesh);
  const PXH = h => [(h >> 16 & 255) / 255, (h >> 8 & 255) / 255, (h & 255) / 255];
  const PXPAL = [ // per kind: 4 levels [colour, opacity, imgSize (m)], rise (m/s²), braking
    { p: [[0xe2e2e0, 0.8, 0.28], [0xb0b0b4, 0.7, 0.42], [0x7a7a80, 0.5, 0.6], [0x4c4c52, 0.28, 0.8]].map(([c, a, t]) => [PXH(c), a, t]), g: 0.6, fr: 1.5 }, // fumee
    { p: [[0x58585c, 0.9, 0.4], [0x3a3a3e, 0.8, 0.6], [0x26262a, 0.6, 0.85], [0x18181b, 0.35, 1.1]].map(([c, a, t]) => [PXH(c), a, t]), g: 1.2, fr: 1.2 }, // noire
    { p: [[0xfff4a8, 1, 0.3], [0xffc23a, 1, 0.28], [0xff6a14, 1, 0.24], [0xa61e0a, 0.9, 0.18]].map(([c, a, t]) => [PXH(c), a, t]), g: 3, fr: 2 }]; // feu
  const pix = (k, x, y, z, vx, vy, vz, vitality) => { const i = pxi++ % PXN; pxP.set([x, y, z], i * 3); pxV.set([vx, vy, vz], i * 3); pxL[i] = pxL0[i] = vitality; pxK[i] = k; };
  function pixStep(dt) { for (let i = 0; i < PXN; i++) { if (pxL[i] <= 0) { if (pxA[i]) pxA[i] = 0; continue; } const j = i * 3, P = PXPAL[pxK[i]]; pxL[i] -= dt;
      const st = P.p[Math.min(3, Math.floor((1 - pxL[i] / pxL0[i]) * 4))], fr = Math.exp(-P.fr * dt); pxV[j] *= fr; pxV[j + 2] *= fr; pxV[j + 1] += P.g * dt;
      for (let q = 0; q < 3; q++) pxP[j + q] += pxV[j + q] * dt; pxC.set(st[0], j); pxA[i] = pxL[i] > 0 ? st[1] : 0; pxS[i] = st[2]; }
    for (const a of ['position', 'col', 'al', 'sz']) pxGeo.attributes[a].needsUpdate = true; }
  function sceneryFrame(dt) {
    pixStep(dt);
    const cars = race ? race.cars : VIEWS.map(v => v.car), up = new V3(), dq = new THREE.Quaternion();
    if (race && race.broken) { // CASSE: takedown messages, smoke from engines at their limit (black and thick when out of use), sparks from the rims
      for (let i = race.tdVu || 0; i < race.td.length; i++) { const e = race.td[i]; for (const vu of VIEWS) if (e.via === vu.self) vu.brokenMsg = { t: 'TAKEDOWN ! ' + pierBuf(e.vic)[0], T: 2.5, c: Y }; else if (e.vic === vu.self) vu.brokenMsg = { t: 'TAKEDOWN PAR ' + pierBuf(e.via)[0], T: 2.5, c: RD }; }
      race.tdVu = race.td.length;
      for (const c of cars) { const K = c.ca, sp = Math.hypot(c.vx, c.vz), fx = Math.cos(c.th), fz = Math.sin(c.th); if (portion(c)) continue;
        if (K.dead || K.z[0] >= 0.7) { const hx = c.x + fx * (ENC.max.x - 1.1), hz = c.z + fz * (ENC.max.x - 1.1), strong = K.dead ? 1.8 : K.z[0] >= 0.85 ? 1.1 : 0.6; // the fire comes out of the hood: it smoulders at 0.7, flares at 0.85, sets the car alight when out of use
          for (let n = Math.floor(dt * (K.dead ? 90 : 20 + 50 * (strong - 0.6)) + Math.random()); n-- > 0;) pix(2, hx + jit(0.7) * strong, c.y + 0.8 + Math.random() * 0.2, hz + jit(0.7) * strong, c.vx * 0.85 + jit(0.5), 0.8 + Math.random() * strong, c.vz * 0.85 + jit(0.5), 0.35 + Math.random() * 0.3 * strong);
          if (Math.random() < dt * (K.dead ? 22 : 8)) pix(1, hx + jit(0.4), c.y + 1.4, hz + jit(0.4), c.vx * 0.3 + jit(0.8), 1 + Math.random(), c.vz * 0.3 + jit(0.8), 1.6 + Math.random()); } // black smoke above the flames
        if (sp > 4 && !c.air) K.pops.forEach((v, i) => { if (!v || Math.random() > dt * 30) return; const x = i >= 2 ? xf : xr, zs = (i & 1 ? 1 : -1) * (i >= 2 ? zf : zr); emit(c.x + fx * x - fz * zs, c.y + 0.05, c.z + fz * x + fx * zs, c.vx * 0.4 + jit(2), Math.random() * 2, c.vz * 0.4 + jit(2), 0.35, 1, 0.75, 0.35, 22); }); } }
    for (const c of cars) { if (!c.out) { dirtyFrame(c, dt); oilFrame(c, dt); } const sp = Math.hypot(c.vx, c.vz); if (c.out || sp < 3) continue;
      if (c.rub) mark(c, Math.sign(c.d) || 1, 0); // along a wall: a paint trail (head-on hits go through wallImpact, at each step)
      const fx = Math.cos(c.th), fz = Math.sin(c.th);
      for (const o of OBJ) for (const off of [1.3, -1.3]) { const dx = o.p.x - (c.x + fx * off), dz = o.p.z - (c.z + fz * off), d = Math.hypot(dx, dz); if (d > 1 + o.S.r || o.p.y > c.y + 1.4 || !(o.asleep || o.v.length() < sp * 0.8)) continue;
        const sideOf = Math.sign(dx * -fz + dz * fx) || 1, lat = 3 + sp * 0.2; o.v.set(c.vx * 1.1 - fz * sideOf * lat, 1.5 + sp * 0.07 + Math.random(), c.vz * 1.1 + fx * sideOf * lat); o.w.set(jit(20), jit(10), jit(20)).multiplyScalar(0.3 + sp / 30); if (o.asleep && o.S.shard) for (let q = 0; q < 12; q++) emit(o.p.x, o.p.y + 0.3, o.p.z, c.vx * 0.25 + jit(5), 1.5 + Math.random() * 3.5, c.vz * 0.25 + jit(5), 0.9, ...o.S.shard, 7); if (o.asleep && o.S.sound) objSound = o.S.sound; o.asleep = 0; } } // it leaves forward and to the side: it gets out of the way
    for (const o of OBJ) { if (o.asleep) continue;
      o.v.y -= 9.8 * dt; o.p.addScaledVector(o.v, dt); const wl = o.w.length(); if (wl > 1e-3) { dq.setFromAxisAngle(up.copy(o.w).divideScalar(wl), wl * dt); o.q.premultiply(dq); }
      up.set(0, 1, 0).applyQuaternion(o.q); const ground = o.y0 + Math.abs(up.y) * o.S.h / 2 + (1 - Math.abs(up.y)) * o.S.r; // standing on its base, lying on its side
      if (o.p.y < ground) { o.p.y = ground; if (o.v.y < 0) o.v.y *= -0.35; const f = Math.exp(-dt * 9); o.v.x *= f; o.v.z *= f; o.w.multiplyScalar(Math.exp(-dt * 5)); if (o.v.length() < 0.3 && o.w.length() < 0.5) o.asleep = 1; }
      objWritten(o); }
    // shortcut: an object sleeps at the height of its starting spot and may pass through the wall; thrown far down a slope, it floats or sinks a little
  }

  // ---------- dirt and oil (docs/PHYSICS.md, prototype 3): visual ----------
  // Dirt: each car has its level (0 to 1) and its colour, mixed in as it goes over surfaces (earth: mud, snow: snow, dry asphalt: slow dust); rain, wet and the ford wash it off.
  // In the livery (dirtyPainted, after illuminates): each cell of the body has its threshold, fine splashes then patches, faster at the bottom than at the roof; matte and without reflection under the dirt.
  const DIRTIES = { terre: [0.42, 0.28, 0.15, 0.025], snowSurf: [0.92, 0.94, 0.97, 0.02], sec: [0.45, 0.43, 0.4, 0.002] }, TMP = new THREE.Color();
  const dirtyDe = g => g.userData.dirty || (g.userData.dirty = { n: 0, c: new THREE.Color(0.45, 0.43, 0.4), u: { uDirty: { value: 0 }, uDirtyH: { value: VO.plan.low }, uDirtyC: { value: null } } });
  function dirtyFrame(c, dt) { const g = model(c), sl = dirtyDe(g), sp = Math.hypot(c.vx, c.vz); if (sp < 3 || c.air) return;
    const q = T.surf[c.idx], k = Math.min(1, sp / 20) * (1 + Math.min(0.5, Math.abs(c.slide || 0))), washed = q.aq > 0.02 || rainAt(c.idx) > 0; // the faster and sideways, the more it picks up
    if (washed) sl.n = Math.max(0, sl.n - (q.aq > 0.08 ? 0.5 : 0.06) * k * dt); // the ford (aq caps at 0.1: threshold 0.08, the old 0.12 was never reached) washes everything at once, the rain and the wet slowly
    else { const t = DIRTIES[genre(q)], a = t[3] * k * dt * (1 - sl.n * 0.5); sl.c.lerp(TMP.setRGB(t[0], t[1], t[2]), a / (sl.n + a)); sl.n = Math.min(1, sl.n + a); }
    sl.u.uDirty.value = sl.n; }
  const DIRTY_F = `float sHb = clamp((vSaleP.y - uSaleH) / 1.15, 0.0, 1.0), sL = uSale * (1.7 - 1.4 * sHb); // local level: the sill 1.7 times faster, the roof 0.3 times
float sN = fract(sin(dot(floor(vSaleP * 7.0), vec3(12.9898, 78.233, 37.719))) * 43758.5453), sN2 = fract(sin(dot(floor(vSaleP * 23.0), vec3(39.3, 11.1, 83.7))) * 43758.5453);
float saleM = max(step(sN2, sL * 0.9) * 0.55, smoothstep(sN - 0.12, sN + 0.12, sL * 1.1 - 0.25)) * (0.55 + 0.45 * clamp(sL, 0.0, 1.0));
diffuseColor.rgb = mix(diffuseColor.rgb, uSaleC, saleM * 0.88);`;
  function dirtyPainted(g) { const m = g.userData.liv; if (!m || m.userData.dirty) return; m.userData.dirty = 1; const sl = dirtyDe(g), f = m.onBeforeCompile, k = m.customProgramCacheKey; sl.u.uDirtyC.value = sl.c;
    m.onBeforeCompile = sh => { f && f(sh); Object.assign(sh.uniforms, sl.u);
      sh.vertexShader = 'varying vec3 vSaleP;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvSaleP = position;');
      sh.fragmentShader = 'varying vec3 vSaleP;\nuniform float uSale, uSaleH;\nuniform vec3 uSaleC;\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n' + DIRTY_F)
        .replace('#include <specularmap_fragment>', '#include <specularmap_fragment>\nspecularStrength *= 1.0 - saleM;'); }; // the body's reflection (envMap) goes through specularStrength
    m.customProgramCacheKey = () => (k ? k() : '') + 'dirty'; m.needsUpdate = true; }
  // oil: beyond 0.6 wear at the front, the engine drips; round, dark, shiny drops, more and more closely spaced; a ring of HN, one mesh
  const HN = 1200, hP = new Float32Array(HN * 12), hI = new Uint32Array(HN * 6), hGeo = new THREE.BufferGeometry(), hD = new WeakMap(); let hi = 0;
  for (let k = 0; k < HN; k++) hI.set([k * 4, k * 4 + 1, k * 4 + 2, k * 4 + 1, k * 4 + 3, k * 4 + 2], k * 6);
  hGeo.setAttribute('position', new THREE.BufferAttribute(hP, 3)); hGeo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(HN * 12).map((_, i) => i % 3 === 1 ? 1 : 0), 3));
  hGeo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(HN * 8).map((_, i) => [0, 0, 0, 1, 1, 0, 1, 1][i % 8]), 2)); hGeo.setIndex(new THREE.BufferAttribute(hI, 1));
  const droplet = tex(32, 32, g => { const d = g.createRadialGradient(16, 16, 2, 16, 16, 15); d.addColorStop(0, '#fff'); d.addColorStop(0.6, '#fff'); d.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = d; g.fillRect(0, 0, 32, 32); });
  const hMesh = new THREE.Mesh(hGeo, gloss(new THREE.MeshPhongMaterial({ color: 0x060504, shininess: 90, transparent: true, opacity: 0.85, alphaMap: droplet, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }), 1));
  hMesh.frustumCulled = false; hMesh.userData.dyn = 1; scene.add(hMesh);
  function oilFrame(c, dt) { const z = model(c).userData.dmgP.z[0]; if (z < 0.6 || c.air) return; const sp = Math.hypot(c.vx, c.vz), dd = (hD.get(c) || 0) + sp * dt + dt * 0.4, stepSec = Math.max(0.35, 1.6 - (z - 0.6) * 4); // also when stopped, more slowly
    if (dd < stepSec) { hD.set(c, dd); return; } hD.set(c, 0);
    const fx = Math.cos(c.th), fz = Math.sin(c.th), xm = VO.wheels[1] * 0.6, x = c.x + fx * xm - fz * jit(0.4), zz = c.z + fz * xm + fx * jit(0.4), y = c.y + 0.02, w = 0.06 + Math.random() * 0.08 + (z - 0.6) * 0.15, a = Math.random() * 3.14, ca = Math.cos(a) * w, sa = Math.sin(a) * w, l = 1 + Math.random() * 0.8;
    hP.set([x - ca * l - sa, y, zz - sa * l + ca, x - ca * l + sa, y, zz - sa * l - ca, x + ca * l - sa, y, zz + sa * l + ca, x + ca * l + sa, y, zz + sa * l - ca], hi * 12);
    hGeo.attributes.position.addUpdateRange(hi * 12, 12); hGeo.attributes.position.needsUpdate = true; hi = (hi + 1) % HN; }
  const oilReset = () => { hP.fill(0); hGeo.attributes.position.clearUpdateRanges(); hGeo.attributes.position.needsUpdate = true; for (const g of [carG, ...opps]) { const sl = dirtyDe(g); sl.n = 0; sl.u.uDirty.value = 0; } };

  backdrop && await whoosh();
  // ---------- merging of the fixed scenery: one draw call per material, instead of one per object ----------
  // Every simple, opaque and static mesh is merged with those of the same material (same shadows) into a single geometry, in world coordinates: the image is the same,
  // but Ville goes from 950 draw calls to 150. Anything that moves, or shows and hides, must carry userData.dyn = 1 (itself or a parent):
  // sky, cars, boats, big wheel, airship… Check after adding an animated scenery: (await import('./tools/perf.js')).movables() must list nothing.
  {
    const COBBLE = 500, BIG = 30000, batches = new Map(), shadows = [], NM = new THREE.Matrix3(), v = new V3(), cand = [];
    const fixed = o => { for (let p = o; p; p = p.parent) if (p.userData.dyn || !p.visible) return false; return true; };
    scene.updateMatrixWorld(true);
    const simple = o => { const m = o.material, g = o.geometry; return !Array.isArray(m) && !m.transparent && g.drawRange.count === Infinity && !Object.keys(g.morphAttributes).length && fixed(o); };
    scene.traverse(o => { if (o.isMesh && !o.isInstancedMesh && simple(o)) cand.push(o); });
    // a material family (userData.family, declared by the map: same texture, different tints) has only one merged material, each piece's tint as vertex colour: one pass for all the tints instead of one per tintMat.
    // The piece is replaced in cand by its double (realMesh: the original mesh, removed if it is merged). The map guarantees these materials don't change during a race
    const FAMILY = new Map(), unc = new Map(), hue = g => unc.get(g) || unc.set(g, g.clone().setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 3).fill(1), 3))).get(g);
    cand.forEach((o, i) => { const m = o.material, fa = m.userData.family; if (!fa || !m.vertexColors && o.geometry.attributes.color || m.vertexColors && !o.geometry.attributes.color) return;
      const kf = [fa, m.type, m.side, m.vertexColors, m.emissive ? m.emissive.getHex() : ''].join('|'), fm = FAMILY.get(kf) || FAMILY.set(kf, Object.assign(m.clone(), { vertexColors: true })).get(kf); fm.color.setRGB(1, 1, 1);
      cand[i] = { realMesh: o, geometry: m.vertexColors ? o.geometry : hue(o.geometry), material: fm, matrixWorld: o.matrixWorld, scale: o.scale, col: m.color, castShadow: o.castShadow, receiveShadow: o.receiveShadow, frustumCulled: o.frustumCulled, renderOrder: o.renderOrder, layers: o.layers, userData: {}, children: [] }; });
    // scenery placed in quantity (static InstancedMesh) goes through it too: each instance becomes a part, merged with everything sharing its material (one draw call less per shape and per zone, shadows and reflections included);
    // its tint per instance goes into a vertex colour, on a copy of the material. Beyond INST vertices, the instance stays: it would take too much memory. Its parts are not cut into blocks (it was drawn whole, in one pass), except beyond 100,000 vertices: the 15,500 blocks of the canal (560,000 vertices) cost 1.5 ms of GPU per frame, whole in the view and in each face of the reflection cube
    const INST = 600000, inst = [], vc = new Map(), ni = new Map(), unison = g => ni.get(g) || ni.set(g, g.index ? g.toNonIndexed() : g).get(g);
    scene.traverse(o => { if (o.isInstancedMesh && o.count > 0 && simple(o) && (o.geometry.index || o.geometry.attributes.position).count * o.count <= INST) inst.push(o); });
    for (const o of inst) {
      let g = o.geometry, mat = o.material; if (!g.boundingSphere) g.computeBoundingSphere();
      if (o.instanceColor) { g = g.clone(); g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 3).fill(1), 3)); mat = vc.get(mat) || vc.set(mat, Object.assign(mat.clone(), { vertexColors: true })).get(mat); }
      for (let i = 0; i < o.count; i++) { const mw = new THREE.Matrix4(); o.getMatrixAt(i, mw); mw.premultiply(o.matrixWorld); const s = mw.getMaxScaleOnAxis();
        cand.push({ virt: o, huge: (o.geometry.index || o.geometry.attributes.position).count * o.count > 100000, geometry: g, material: mat, matrixWorld: mw, scale: { x: s, y: s, z: s }, col: o.instanceColor && new THREE.Color().fromArray(o.instanceColor.array, i * 3), castShadow: o.castShadow, receiveShadow: o.receiveShadow, frustumCulled: true, renderOrder: o.renderOrder, layers: o.layers, userData: {}, children: [] }); }
    }
    for (const o of cand) {
      const g = o.geometry; if (!g.boundingSphere) g.computeBoundingSphere();
      const k = [o.material.uuid, +o.castShadow, +o.receiveShadow, +o.frustumCulled, o.renderOrder, o.layers.mask, Object.keys(g.attributes).sort().map(n => n + g.attributes[n].itemSize).join()].join('|');
      if (!batches.has(k)) batches.set(k, []); batches.get(k).push(o);
    }
    // a heavy batch (more than BIG vertices) is cut into COBBLE-meter blocks, so that what is off-screen is not drawn; large parts (ground, ribbons) stay whole
    for (const [k, l] of [...batches]) {
      const ns = l.reduce((s, o) => s + (o.geometry.index || o.geometry.attributes.position).count, 0); if (ns < BIG) continue;
      batches.delete(k);
      // the patch grows to keep about BIG vertices each: a barely heavy batch spread over the whole port of Wan-9 made 14 patches of 800 vertices, as many draw passes for almost nothing culled
      const bx = [1e9, -1e9, 1e9, -1e9]; for (const o of l) { v.copy(o.geometry.boundingSphere.center).applyMatrix4(o.matrixWorld); bx[0] = Math.min(bx[0], v.x); bx[1] = Math.max(bx[1], v.x); bx[2] = Math.min(bx[2], v.z); bx[3] = Math.max(bx[3], v.z); }
      const P = Math.max(COBBLE, Math.sqrt(Math.max(bx[1] - bx[0], COBBLE) * Math.max(bx[3] - bx[2], COBBLE) * 2 * BIG / ns)); // about 2 × BIG vertices per patch
      for (const o of l) { const g = o.geometry, r = g.boundingSphere.radius * o.matrixWorld.getMaxScaleOnAxis(); v.copy(g.boundingSphere.center).applyMatrix4(o.matrixWorld);
        const kp = k + '|' + (r < COBBLE / 2 && (!o.virt || o.huge) ? Math.floor(v.x / P) + ':' + Math.floor(v.z / P) : 'grandSz'); if (!batches.has(kp)) batches.set(kp, []); batches.get(kp).push(o); }
    }
    for (const l of batches.values()) {
      if (l.length < 2 && !l[0].virt) { const o = l[0].realMesh || l[0]; shadows.push([o.geometry, o.matrixWorld, o]); continue; } // a single instance is merged anyway: its instance disappears whole
      // indexed if all parts are: a shared vertex is computed only once by the GPU (a box: 24 vertices instead of 36), and the scene is mostly limited by its vertices
      const ix = l.every(o => o.geometry.index), src = l.map(o => ix ? o.geometry : unison(o.geometry)), n = src.reduce((s, g) => s + g.attributes.position.count, 0), G = new THREE.BufferGeometry();
      if (ix) { const I = new (n > 65535 ? Uint32Array : Uint16Array)(src.reduce((s, g) => s + g.index.count, 0)); let b = 0, p = 0;
        l.forEach((o, i) => { const x = src[i].index, mirror = o.matrixWorld.determinant() < 0; for (let j = 0; j < x.count; j++) I[p + j] = b + x.getX(mirror ? j - j % 3 + [0, 2, 1][j % 3] : j); p += x.count; b += src[i].attributes.position.count; });
        G.setIndex(new THREE.BufferAttribute(I, 1)); }
      for (const label in src[0].attributes) {
        const sz = src[0].attributes[label].itemSize, A = new Float32Array(n * sz); let base = 0;
        l.forEach((o, i) => {
          const a = src[i].attributes[label], mw = o.matrixWorld, mirror = mw.determinant() < 0; if (label === 'normal') NM.getNormalMatrix(mw);
          for (let j = 0; j < a.count; j++) {
            const d = (base + (mirror && !ix ? j - j % 3 + [0, 2, 1][j % 3] : j)) * sz; // negative scale: each triangle is flipped so that it keeps its face (indexed: in the index)
            if (label === 'position') { v.fromBufferAttribute(a, j).applyMatrix4(mw); A[d] = v.x; A[d + 1] = v.y; A[d + 2] = v.z; }
            else if (label === 'normal') { v.fromBufferAttribute(a, j).applyMatrix3(NM).normalize(); A[d] = v.x; A[d + 1] = v.y; A[d + 2] = v.z; }
            else if (label === 'color' && o.col) { A[d] = a.getX(j) * o.col.r; A[d + 1] = a.getY(j) * o.col.g; A[d + 2] = a.getZ(j) * o.col.b; }
            else { A[d] = a.getX(j); if (sz > 1) A[d + 1] = a.getY(j); if (sz > 2) A[d + 2] = a.getZ(j); if (sz > 3) A[d + 3] = a.getW(j); }
          }
          base += a.count;
        });
        G.setAttribute(label, new THREE.BufferAttribute(A, sz));
      }
      const o0 = l[0], m = new THREE.Mesh(G, o0.material); m.castShadow = o0.castShadow; m.receiveShadow = o0.receiveShadow; m.frustumCulled = o0.frustumCulled; m.renderOrder = o0.renderOrder; m.layers.mask = o0.layers.mask;
      m.matrixAutoUpdate = false; m.userData.minor = l.some(o => o.userData.minor); scene.add(m); shadows.push([G, null, m]);
      if (window.__origins) m.userData.src = l.map(o => { let p = o.virt || o.realMesh || o; while (p && !p.userData.originName) p = p.parent; return [p ? p.userData.originName : '?', (o.geometry.index || o.geometry.attributes.position).count]; }); // tools/profReport.js: where the merged parts come from
      for (const o of l) (o.realMesh || o).userData.fade = 1;
    }
    // the shadow of the fixed scenery (see shadows) only reads depth: everything that carries it, merged or single, is drawn there into one position mesh per patch and per shadow face, on the SHDF layer that only the shadow camera sees,
    // instead of one pass per material (up to 110 draw passes in the frame where the moon changes step). Kept apart: what the depth depends on through the material (alphaTest cutout, displacement, clipping planes)
    { const SD = [THREE.BackSide, THREE.FrontSide, THREE.DoubleSide], MO = new Map(), lo = new Map(); // SD: the face three draws in the shadow, from material.side
      const onlyMap = o => { const m = o.material; return o.castShadow && o.layers.mask === 1 && !o.customDepthMaterial && !(m.alphaTest > 0 && (m.map || m.alphaMap)) && !m.alphaToCoverage && !(m.displacementMap && m.displacementScale) && !(m.clippingPlanes && m.clippingPlanes.length); };
      for (const [g, mw, o] of shadows) { if (!onlyMap(o)) continue; const sd = o.material.shadowSide ?? SD[o.material.side]; if (!g.boundingSphere) g.computeBoundingSphere(); v.copy(g.boundingSphere.center); if (mw) v.applyMatrix4(mw);
        const k = sd + '|' + Math.floor(v.x / COBBLE) + ':' + Math.floor(v.z / COBBLE); if (!lo.has(k)) lo.set(k, []); lo.get(k).push([g, mw]); o.castShadow = false; }
      for (const [k, l] of lo) { const n = l.reduce((s, [g]) => s + g.attributes.position.count, 0), P = new Float32Array(n * 3), I = new (n > 65535 ? Uint32Array : Uint16Array)(l.reduce((s, [g]) => s + (g.index || g.attributes.position).count, 0)); let b = 0, p = 0;
        for (const [g, mw] of l) { const a = g.attributes.position, x = g.index, c = (x || a).count, mirror = mw && mw.determinant() < 0;
          for (let j = 0; j < a.count; j++) { v.fromBufferAttribute(a, j); if (mw) v.applyMatrix4(mw); P[(b + j) * 3] = v.x; P[(b + j) * 3 + 1] = v.y; P[(b + j) * 3 + 2] = v.z; }
          for (let j = 0; j < c; j++) { const jj = mirror ? j - j % 3 + [0, 2, 1][j % 3] : j; I[p + j] = b + (x ? x.getX(jj) : jj); } p += c; b += a.count; }
        const G = new THREE.BufferGeometry(), sd = +k.split('|')[0]; G.setAttribute('position', new THREE.BufferAttribute(P, 3)); G.setIndex(new THREE.BufferAttribute(I, 1));
        const m = new THREE.Mesh(G, MO.get(sd) || MO.set(sd, new THREE.MeshBasicMaterial({ shadowSide: sd })).get(sd)); m.castShadow = true; m.layers.set(SHDF); m.matrixAutoUpdate = false; scene.add(m);
        if (window.__origins) m.userData.originName = 'moteur ombre du décor fixe'; } }
    for (const o of inst) o.parent.remove(o); // all its parts are merged (even alone in their batch)
    for (const c of cand.reverse()) { const o = c.realMesh || c; if (o.userData.fade && !c.virt) { if (o.children.length) o.layers.set(31); else o.parent.remove(o); } } // children first; a parent that keeps some stays in the tree without being drawn (layer 31)
  }
  { const fixed = o => { for (let p = o; p; p = p.parent) if (p.userData.dyn || !p.visible) return false; return true; }; // moving shadows (see shadows): anything that casts a shadow without being fixed
    scene.traverse(o => { if (o.isLight) { o.layers.enable(SHDD); o.layers.enable(SHDI); } else if (o.castShadow && !fixed(o)) { o.layers.set(o.isInstancedMesh ? SHDI : SHDD); shdM.push(o); } }); } // the lights too: without them, the moving-shadow pass changed three's lighting, which then recompiled the key of each material every frame
  const moves = o => { for (let p = o; p; p = p.parent) if (p.userData.dyn) return true; return false; };
  scene.traverse(o => { if (o.isInstancedMesh) { if (moves(o) && !o.userData.broken) o.frustumCulled = false; else { o.computeBoundingSphere(); if (o.userData.broken) o.boundingSphere.radius += 30; } } if (o.material) illuminates(o.material); }); for (const sc of [scene, fallbackScene]) sc.traverse(o => { for (const m of [].concat(o.material || [])) m.forceSinglePass = true; }); // r149+: a double-sided transparent drew in two passes (glint doubled as additive); the scenery placed in number is culled off-screen over the extent of its instances (sphere computed once)  ; what moves always stays drawn, except the breakable scenery (h.breakable), culled over the extent of its placement plus 30 m (shortcut: a copy projected farther out can disappear with its off-screen batch; revisit if a map launches them farther)
  for (const g of [carG, ...opps]) dirtyPainted(g); // the dirt is grafted onto the illuminates shader of each livery

  // ---------- audio: see audio.js (window.SOUND); here only what the game and the HUD read ----------
  let radioT = 0;
  const zap = () => { // after the last station: SILENCE (music cut), then back to the first
    if (!SOUND.musicOn) { SOUND.toggleMusic(); SOUND.setStation(0); } else if (SOUND.station === SOUND.stations.length - 1) SOUND.toggleMusic(); else SOUND.setStation(SOUND.station + 1);
    radioT = 2.5; };
  const labelRadio = () => SOUND.musicOn ? SOUND.label : 'SILENCE';
  // gearbox and revs: computed even without audio, the HUD gauge uses them
  function drivetrain(vu, dt, gas) { // gear and revs come from the physics (sim.js); here they are smoothed, per view, for the sound and the gauge
    const car = vu.car, up = Math.sign(car.gear - vu.gear); vu.gear = car.gear; // +1 gear up, -1 gear down
    let tgt = car.rpm / CARD.red;
    if (state === 'count' && gas) tgt = 0.8 + 0.05 * Math.sin(performance.now() / 22); // rev limiter on the grid
    vu.rpm += (tgt - vu.rpm) * Math.min(1, dt * 14); vu.load += ((car.shiftT > 0 ? 0 : gas) - vu.load) * Math.min(1, dt * 12); vu.spool += ((gas ? vu.rpm : 0) - vu.spool) * Math.min(1, dt * 2.5);
    return up;
  }

  backdrop && await whoosh();
  // ---------- game state ----------
  // keys "vpr8.": V3 changes the driving (progressive slide, rear brake, ground × car grip, visible surfaces), the "vpr7." records are no longer comparable.
  // one record series per map; Ville keeps its original keys
  const PRE = 'vpr8.' + (M.id === 'ville' ? '' : M.id + '.');
  const store = { get: k => { try { return JSON.parse(localStorage.getItem(PRE + k)); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(PRE + k, JSON.stringify(v)); } catch (e) { } } };
  const pref = (k, d) => { try { return localStorage.getItem(k) || d; } catch (e) { return d; } }, setPref = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } };
  // Interface language: 'fr' or 'en', chosen on the home screen and kept (vpr.language). Translation and English titles: language.js
  let language = pref('vpr.langue', 'en') === 'fr' ? 'fr' : 'en';
  const tr = s => translated(s, language);
  const applyLanguage = () => { document.documentElement.lang = language; document.title = 'Redline Racer'; };
  applyLanguage();
  let msel = 5; // main menu line
  // home screen: the browser only allows sound after a gesture; it is requested first, so that the music is there when the menu appears
  // Home screen: it is first used to choose the language. Left / right (or up / down) changes the language at once, Enter goes to the main menu.
  // (variants tried and dropped: branch prototype/accueil)
  let home = true, aMenu = false, tFlash = 0;
  const enter = () => { SOUND.initMenu(); home = false; };
  const choosesLang = l => { if (l === language) return; language = l; setPref('vpr.langue', language); applyLanguage(); SOUND.beep(550); };
  const homeAct = a => { // a: 'v' up / down, 'h' left / right, 'ok' confirm, '' other key (it only opens the sound)
    aMenu = true;
    if (a === 'v' || a === 'h') choosesLang(language === 'en' ? 'fr' : 'en');
    else if (a === 'ok') { tFlash = performance.now(); SOUND.stinger(true); enter(); choice = true; csel = two() ? 1 : 0; if (Q.get('room') && !NET.role) { csel = 2; joins(Q.get('room')); } } // came in through a lobby link: join it
  };
  // Game choice, between the home screen and the main menu: solo (all modes, one view), split screen (2 to 4 players), online (not done yet). Esc returns to it from the menu, and goes back from there to the language.
  let choice = false, csel = 0;
  const CHOICE = [['SOLO', 'COURSES CONTRE IA, GLISSE, CHRONO'], ['ECRAN PARTAGE', '2 A 4 JOUEURS SUR CET ECRAN'], ['EN LIGNE', 'COURSE A PLUSIEURS, PAR CODE DE SALON']];
  const choiceAct = (code, key) => {
    if (enl) { loungeAct(code, key); return; }
    if (/^(ArrowUp|KeyW)$/.test(code)) csel = (csel + 2) % 3; else if (/^(ArrowDown|KeyS)$/.test(code)) csel = (csel + 1) % 3;
    else if (code === 'Escape') { choice = false; home = true; }
    else if (code === 'Enter' || code === 'Space') {
      if (csel === 2) { enl = { sel: 0, typing: '' }; SOUND.beep(660); return; }
      players(csel ? Math.max(2, +pref('vpr7.ecran', '2')) : 1); setPref('vpr7.joueurs', VIEWS.length); choice = false; msel = 5; SOUND.beep(660); }
  };
  // ---------- En ligne (network.js) ----------
  // Lobby by 4-letter code, or by the ?room=CODE link. The host picks the map in the main menu and starts: everyone races in Race (3 laps), each on their own screen, their car as J1.
  // The host runs stepRace (its input and the ones received, NET.ins) and broadcasts the state; the guest simulates nothing, it applies the received state (NET.applySetting). No pause online: Esc quits.
  // enl = the lobby screen: { sel: 0 create / 1 join, typing: typed code, waiting: guest connected }; null elsewhere. NET.role says whether we are in a lobby (it survives a map change, not this file).
  let enl = null;
  const online = () => !!NET.role, guest = () => NET.role === 'guest';
  const waiting = () => { choice = true; csel = 2; enl = { sel: 1, typing: NET.code, waiting: true }; };
  const quitsLounge = () => { NET.closeBrowser(); if (state !== 'title') toMenu(); choice = true; csel = 2; enl = { sel: 0, typing: '' }; };
  const onNet = m => {
    if (m.t === 'errorMsg') { padSaid(m.msg); quitsLounge(); }
    else if (m.t === 'started') padSaid('JOUEUR ' + (m.i + 1) + ' PARTI');
    else if (m.t === 'stop' && state !== 'title') toMenu(); // the host went back to the menu: the guest waits for the next race
    else if (m.t === 'go') { if (m.mapDef === M.id) { enl = null; choice = false; start(true); } else if ((outTarget = MAPS.find(c => c.id === m.mapDef))) { try { sessionStorage.setItem('vpr.netgo', 1); } catch (e) { } changeMap(); } } // other map: it loads, the race starts on arrival (end of file)
  };
  const joins = code => { players(1); NET.joinLounge(code, onNet); enl = { sel: 1, typing: NET.code, waiting: true }; };
  const loungeAct = (code, key) => {
    if (code === 'Escape') { quitsLounge(); enl = null; return; }
    if (NET.role === 'hostRole') { if (code === 'Enter' || code === 'Space') { enl = null; choice = false; msel = 5; mode = 'raceCase'; SOUND.beep(660); } return; } // in the main menu: the host picks the map, DEMARRER starts
    if (enl.waiting) return;
    if (enl.sel) { // code entry: the typed letter (e.key), not the key's position
      if (code === 'Backspace') enl.typing = enl.typing.slice(0, -1);
      else if (/^[a-z]$/i.test(key || '') && enl.typing.length < 4) enl.typing += key.toUpperCase();
      else if ((code === 'Enter' || code === 'NumpadEnter') && enl.typing.length === 4) joins(enl.typing);
      else if (/^Arrow(Up|Down)$/.test(code)) enl.sel = 0;
      return;
    }
    if (/^(ArrowUp|ArrowDown|KeyW|KeyS)$/.test(code)) enl.sel = 1;
    else if (code === 'Enter' || code === 'Space') { players(1); NET.hosting(onNet); mode = 'raceCase'; SOUND.beep(660);
      try { navigator.clipboard.writeText(location.origin + location.pathname + '?room=' + NET.code).then(() => padSaid('LIEN DU SALON COPIE'), () => { }); } catch (e) { } }
  };
  for (const ev of ['mousedown', 'pointerup', 'touchend']) addEventListener(ev, e => { inactive = 0; if (demo) { if (!outTarget && ev !== 'mousedown') demoEnd(); return; } if (performance.now() - demoExit < 400) return; if (home) { if (ev === 'mousedown') return; if (e.isTrusted && !aMenu) PER.hidAuto(); SOUND.init(); if (UI.shown) return; const l = e.clientX < innerWidth / 2 ? 'fr' : 'en'; if (l === language) homeAct('ok'); else { aMenu = true; choosesLang(l); } } else SOUND.init(); }); // on the home screen: a left click picks French, a right click English; a second click on the same side moves on
  const fmt = t => `${t / 60 | 0}'${String(t % 60 | 0).padStart(2, '0')}"${String(t * 100 % 100 | 0).padStart(2, '0')}`;
  addEventListener('mousemove', e => { if (state !== 'race' && state !== 'count') return; const vu = VIEWS[0]; vu.lookA = clamp(vu.lookA + e.movementX * 0.006, -Math.PI, Math.PI); vu.lookP = clamp(vu.lookP + e.movementY * 0.03, -1, 5); vu.lookT = 2.5; }); // free mouse camera: that of the first view (there is only one mouse)
  let state = 'title', count = 0, shown = 0, goT = 0, acc = 0, last = 0, manual = pref('vpr.boite', 'a') === 'm';
  // sectors (entry and exit of the interchange) and record ghost: [x, y, z, heading] at 20 Hz
  // mode: 'solo' (time trial with chained laps), 'glisse' (two laps, scored: the score is kept by sim.js, see GL), 'course' (3 laps against sim.js's BOTS), 'casse' (the same race, but damage affects the driving; score: place + takedowns, see BROKEN_PTS) 'elim' (elimination race: the last one out at each line crossing) or 'tournee' (all maps in a row, see below); race = the current race, otherwise null
  const MODES = ['solo', 'glisse', 'raceCase', 'broken', 'elim', 'tourAll'], MODES2 = ['raceCase', 'broken', 'elim', 'glisse'], USING_AI = ['raceCase', 'broken', 'elim', 'tourAll'], isRaceMode = () => USING_AI.includes(mode);
  // challenge by link: the address "…#defi=version.mapDef.données" (challengeCode of sim.js) carries another player's lap. mapDefs.js has already opened its map; here we read the trace again: the game opens as a time trial against this ghost.
  // Link unreadable, damaged, from another version of the physics or for an unknown map: CHALLENGE_DEF stays null and the menu says why (challengeErr).
  const linkRead = (h => h && challengeRead(h[1]))(/^#defi=(.*)$/.exec(location.hash)), challengeErr = linkRead && (linkRead.err || (linkRead.mapDef !== M.id ? 'LIEN DE DEFI : CARTE INCONNUE' : '')), CHALLENGE_DEF = linkRead && !challengeErr ? linkRead : null;
  addEventListener('hashchange', () => location.reload()); // a link pasted into the game's tab does not reload the page by itself
  let mode = CHALLENGE_DEF ? 'solo' : MODES.find(m => pref('vpr7.mode', '') === JSON.stringify(m)) || 'solo', race = null; // race: that of the session (ses.race), kept here for drawing; the mode is remembered once for all maps
  // With two players (MODES2: Race, Elimination, Glisse duel) the mode and difficulty have their own keys, vpr7.mode2 and vpr7.diff2: going back to one player restores solo as it was left (see players).
  // Nothing else is read or written with two players: no record, medal, ghost, trophy or Tournée; a two-player race always has a race object, so the records and the solo Glisse of session.js never go through it.
  const cacheKey = k => 'vpr7.' + k + (two() ? '2' : ''), duel = () => two() && mode === 'glisse';
  // CASSE: points = finishing place (a car out of use has none) + BROKEN_PTS.td per takedown inflicted
  const BROKEN_PTS = { place: [10, 6, 4, 2], td: 3 }, brokenPts = c => (c.out || !c.ending ? 0 : BROKEN_PTS.place[raceOrder(race).filter(o => o.ending).indexOf(c)] || 0) + c.ca.td * BROKEN_PTS.td;
  const alive = () => race.cars.filter(c => !c.out), portion = c => c.out && race.t - c.out > 5; // elimination: cars still racing; a car out for 5 s, which is no longer shown
  let prev = 'race', psel = 0;
  const H = 1 / 120, INS = []; // INS: each human's input for stepRace, rewritten at each step
  let diff = clamp(+pref('vpr7.diff', 1) | 0, 0, DIFF.length - 1); // race mode difficulty (DIFF of sim.js)
  // time trial medals: the launched lap of the autopilot serves as reference; M.med = [bronze, silver, gold] as multiples of that time
  const REFT = lapRef(T, H), REF = REFT.t; // (it starts with a full nitro gauge, which it spends on straights: what a good lap gains from it; its trace is used for the bronze and silver ghosts)
  const MED = M.med || [1.1, 1.03, 0.97], MEDN = ['BRONZE', 'ARGENT', 'OR'], MEDC = ['#c87a3a', '#c8ccd4', '#ffd23a'];
  // the game session (start, end of race, records, medals, ghost, Tournée): session.js; this file draws it and plays it
  const ses = freshSession({ T, mapDef: M, mapDefs: EVENING, store, prefs: { get: pref, set: setPref }, auto: AUTO, challenge: CHALLENGE_DEF, ref: REFT, med: MED }), medal = ses.medal;
  // time-trial ghost, chosen by the game: the first medal not yet won, otherwise the record (or the challenge, came in by a link). ghostIdx = index in GHOSTS
  // Bronze and silver: the reference lap's trace slowed to the medal's ratio. Gold: the map's trace in traces-gold.js (a lap with slides and nitro, which the autopilot cannot do), scaled to the gold threshold time.
  // Beating a medal's ghost therefore means winning that medal: the ghost then moves on to the next one (after gold: the record).
  const GHOSTS = ['NON', 'RECORD', ...MEDN, ...(CHALLENGE_DEF ? ['DEFI'] : [])], GHOSTC = ['#000000', '#00f0ff', ...MEDC, '#ff4fd8']; // (came in by a challenge link: one more choice, the sender's ghost, in pink)
  const labelF = (f = ses.ghostIdx) => GHOSTS[f] + (f === 5 ? ' ' + fmt(CHALLENGE_DEF.t) : f > 1 ? ' ' + fmt(REF * MED[f - 2]) : f && ses.best ? ' ' + fmt(ses.best) : '');
  // challenge link of the last completed lap on this map (L key, or pause menu): copied to the clipboard; if the browser refuses, shown in a box to copy it from
  function linkChallenge() {
    const lastIdx = ses.lastIdx; if (!lastIdx) { padSaid("BOUCLE D'ABORD UN TOUR EN CONTRE-LA-MONTRE"); return; }
    const url = location.origin + location.pathname + '#defi=' + challengeCode(M.id, lastIdx.t, lastIdx.trace), says = () => padSaid('LIEN DE DÉFI COPIÉ : ' + fmt(lastIdx.t)), watch = () => prompt(tr('LIEN DE DEFI A COPIER :'), url);
    try { navigator.clipboard.writeText(url).then(says, watch); } catch (e) { watch(); }
  }
  // Glisse mode: the score only counts if both laps are completed in less than GLT (two laps at bronze time, plus 30%); record and medals per map
  // GLM = [bronze, silver, gold] in points, set by hand per map from the Glisse test driver in test-mapDefs.js over two laps (its score is roughly the bronze). Map without a line here: 8, 16 and 28 points per meter of lap
  const GLT = ses.GLT, GLM = { ville: [20000, 40000, 70000], touge: [20000, 40000, 70000], wangan: [50000, 90000, 140000], paris: [15000, 30000, 55000], canal: [150000, 250000, 350000], stade: [18000, 36000, 60000], givre: [40000, 75000, 120000], terre: [75000, 135000, 200000] }[M.id] || [8, 16, 28].map(k => Math.round(k * T.len / 1000) * 1000);
  const medG = s => GLM.filter(k => s >= k).length;
  // Tournée: all maps in a row, in night order (EVENING of mapDefs.js, from dusk to dawn), in 3-lap races against each mapDef's rivals. Points, grid, save and trophy: the session (tn, tnOu, enclosed, trophy)
  const tn = () => ses.tn(diff), tnOu = () => ses.tnOu(diff), trophy = () => ses.trophy(diff);
  const summary = vu => { const c = vu.car, l = vu.lap0, b = [c.nDrift - l[0], c.nBoost - l[1], c.nWall - l[2]]; vu.lap0 = [c.nDrift, c.nBoost, c.nWall]; return b; }; // slides, nitro boosts and walls of the lap completed by this view's player

  function start(go) { // go: start requested by the host (online guest)
    SOUND.init(); home = false;
    if (online()) { if (guest() && !go) return; mode = 'raceCase'; if (!guest()) { if (NET.n < 2) { padSaid("EN ATTENTE D'UN AUTRE JOUEUR"); return; } NET.go(M.id); } } // online: Race only; the host starts for everyone
    if (two() && !AUTO && !PLACES.every(p => p && branch(p))) { enrolled(); return; } // with two players, only the two taken seats start; they are kept: a rematch asks nothing again
    if (state === 'title' && !AUTO && !ST && !GAME_LOADER.raceLoading) {
      preparingRace = true; GAME_LOADER.menuHide(); const selected = outTarget || M;
      GAME_LOADER.beginRace(selected).then(() => {
        if (selected !== M) { sessionStorage.setItem('vpr.go', 2); changeMap(); }
        else { outTarget = null; preparingRace = false; start(go); GAME_LOADER.hide(); }
      }); return;
    }
    ses.enclosed();
    if (mode === 'tourAll' && EVENING[tnOu().handle] !== M) { // the round is run on another map: we go there without reloading, and the race starts on arrival (vpr.go)
      if (!outTarget) { outTarget = EVENING[tnOu().handle]; try { sessionStorage.setItem('vpr.go', 1); } catch (e) { } changeMap(); } return; } // (tnEnd stays in place while the map arrives: a second press of Enter does not recount the round)
    const nj = online() ? NET.n : VIEWS.length; // with two players: two humans at the top of the list and the two fastest rivals, always four cars
    race = ses.start({ mode, diff, nj, ia: isRaceMode(), duel: duel(), lapCount: tnLaps }); fsel = 0;
    if (race && guest()) { const g = race.glob = race.cars.slice(), h = [NET.self, ...g.slice(0, nj).map((_, i) => i).filter(i => i !== NET.self)]; race.cars = [...h.map(i => g[i]), ...g.slice(nj)]; } // guest: its car at the top of the list, like a player 1 (R.glob keeps the host's order, that of the received states)
    if (race) race.cars.forEach((c, i) => { c.k = i < nj ? (i ? 2 + i : -1) : i - nj; c.rl = c.rlT = c.bl = 0; }); // and its laps: last lap counted, its time, best lap (see frame) // rank of each car in OPP and opps: player 2 takes the last model, the rivals the first ones
    const onlyMap = race ? null : newCar(T); VIEWS.forEach((vu, i) => { follows(vu, race ? race.cars[i] : onlyMap); vu.gear = 0; vu.splitMsg = null; }); VIEWS[0].self.manual = manual1(); // (outside a race, a mode without rivals started with two players: both views follow the single car)
    state = 'count'; count = 3; shown = 0; tTraffic = 0; acc = 0; dmgReset();
    spike = null; spikeT = 0; said.clear(); if (race && isRaceMode() && VIEWS.length === 1 && !demo && !online()) { const r = race.cars.filter(c => c.k >= 0 && c.k < 3); peakAt(r[Math.random() * r.length | 0], 'grid'); }
  }
  // Demo mode: on the title screen (home or main menu, solo), DEMO_WAITING seconds without touching anything, the autopilot runs a Race, map after map in night order (EVENING).
  // Nothing is saved (a Race writes nothing) and the mode chosen in the menu does not change stepSec. A key, a button or a click returns to the screen we came from, on the map we came from.
  // demo = { de: origin map, a: came from the home screen, mode, diff: those of the menu, t: time spent on this map }; from one map to the next it goes through sessionStorage (vpr.demo), the return through vpr.demoEnd.
  const DEMO_WAITING = 25, DEMO_DUR = 50;
  let demo = null, inactive = 0, demoExit = 0;
  const demoPossible = () => false; // Idle menus never build another circuit: input latency has a 500 ms budget.
  function demoLaunch(d) { demo = { ...(d || { de: M.id, a: home, mode, diff }), t: 0 }; mode = 'raceCase'; diff = 1; start(); }
  function demoNext() { outTarget = EVENING[(EVENING.indexOf(M) + 1) % EVENING.length]; try { sessionStorage.setItem('vpr.demo', JSON.stringify(demo)); } catch (e) { } changeMap(); }
  function demoEnd() {
    const d = demo; demo = null; inactive = 0; demoExit = performance.now(); mode = d.mode; diff = d.diff; toMenu();
    if (d.de !== M.id && (outTarget = MAPS.find(m => m.id === d.de))) { try { sessionStorage.setItem('vpr.demoFin', d.a ? 'a' : 'm'); } catch (e) { } changeMap(); }
    else if (d.a) home = true;
  }
  // pause menu: [line, action]. With two players, no gearbox line (each has their own, on their device)
  const pauseItems = () => [['REPRENDRE', () => { state = prev; }], ['RECOMMENCER', start], ...(two() ? [] : [['BOITE : ' + (manual ? 'MANUELLE' : 'AUTO'), () => { manual = !manual; VIEWS[0].self.manual = manual; }]]),
    ['RADIO : ' + labelRadio(), zap], ['QUITTER', () => { toMenu(); choice = true; csel = two() ? 1 : 0; }]]; // QUITTER: back to Solo / Split screen / Online
  function toMenu() { if (NET.role === 'hostRole') NET.stop(); if (guest()) waiting(); ses.toMenu(); state = 'title'; ins = false; race = null; const c = newCar(T); for (const vu of VIEWS) follows(vu, c); msel = 5; }
  // main menu: 0 map, 1 players, 2 mode, 3 difficulty, 4 gearbox, 5 start; d = -1 / +1 (left / right; Enter counts as +1)
  let tnLaps = clamp(+pref('vpr8.tnTours', '3') || 3, 1, 5); // Tournée: laps per round, the TOURS line of the menu (6: shown and walked between BOX and DEMARRER)
  const cache = i => (i === 1 && !two()) || (i === 3 && !isRaceMode()) || (i === 6 && mode !== 'tourAll'); // in solo there is no JOUEURS line; DIFFICULTE only against BOTS
  let outTarget = null, aimT = 0, preparingRace = false; // selection is independent of the constructed scene
  function changeMap() {
    if (outTarget === M) { outTarget = null; window.__wanted = M.id; GAME_LOADER.reveal(); return; }
    const c = outTarget; window.__wanted = c.id; // the last requested one: a build finished in the meantime for another map is not shown
    const preview = GAME_LOADER.keepPreview(), assets = GAME_LOADER.mapScripts(c);
    Promise.all([preview, assets]).then(() => window.__wanted === c.id ? built(c) : null).then(api => {
      if (!api) return;
      if (window.__wanted !== c.id || window.__g === api) return;
      setPref('vpr.carte', c.id); try { sessionStorage.setItem('vpr.menu', 1); history.replaceState(null, '', location.pathname + '?map=' + c.id + (Q.has('players') ? '&players=' + VIEWS.length : '')); } catch (e) { } // the number of players follows the preference; forced by the address (?players=), it stays from one map to the next
      SOUND.mapDef(c); api.resumes(); GAME_LOADER.reveal(); if (GAME_LOADER.raceLoading) GAME_LOADER.hide();
    }).catch(e => { if (window.__wanted === c.id) { preparingRace = false; outTarget = null; padSaid('CHARGEMENT IMPOSSIBLE'); GAME_LOADER.reveal(); if (GAME_LOADER.raceLoading) GAME_LOADER.hide(); } console.error(e); });
  }
  function menuAct(d) {
    if (outTarget && msel === 5) { if (outTarget === M) outTarget = null; start(); return; }
    if (msel === 0) { // changing map: the name changes at once, the map shows as soon as scrolling stops (0.15 s); already built, immediately
      outTarget = MAPS[(MAPS.indexOf(outTarget || M) + d + MAPS.length) % MAPS.length];
      window.__wanted = outTarget.id;
      setPref('vpr.carte', outTarget.id); // Selection only updates the card; construction belongs to START.
    } else if (msel === 1) { // split screen only (the line does not exist in solo): 2, 3 or 4 players, kept in the preferences
      players(2 + (VIEWS.length - 2 + d + 3) % 3); setPref('vpr7.joueurs', VIEWS.length); setPref('vpr7.ecran', VIEWS.length); }
    else if (msel === 2) { // one player MODES, two players: Race, Elimination, Glisse duel; difficulty has its own line
      const O = two() ? MODES2 : MODES; mode = O[(O.indexOf(mode) + d + O.length) % O.length]; setPref(cacheKey('mode'), JSON.stringify(mode)); }
    else if (msel === 3) { diff = (diff + d + DIFF.length) % DIFF.length; setPref(cacheKey('diff'), diff); } // DIFFICULTE line: only for modes with BOTS (see cache)
    else if (msel === 6) { tnLaps = (tnLaps - 1 + d + 5) % 5 + 1; setPref('vpr8.tnTours', tnLaps); }
    else if (msel === 4) { manual = !manual; VIEWS[0].self.manual = manual; setPref('vpr.boite', manual ? 'm' : 'a'); }
    else start();
  }
  // gearbox and gears, assigned to the device that pressed (d: +1, -1, 0 = manual / automatic toggle): they go to the car of the view registered under this device, otherwise to player 1's
  // (in solo, any device drives the single car). Player 1's choice is the kept preference (manual); player 2's lives only on its car, automatic at each start.
  const manual1 = () => manual && !(two() && PLACES[0] === 'keyboardRight'); // player 1's gearbox: the arrow keyboard has no gear keys, it drives in automatic (the preference itself stays)
  const boxMesh = (id, d) => {
    const vu = VIEWS.find(v => v.periph === id) || (two() ? null : VIEWS[0]); if (!vu || vu.spec) return; // with two players: a device without a seat touches nothing, an eliminated player neither (its view follows another car)
    const c = vu.car, m = vu.n ? c.manual : manual;
    if (d) { if (m) c.gear = clamp(c.gear + d, 0, CARD.ratios.length - 1); return; }
    c.manual = !m; c.gear = vu.gear; if (!vu.n) { manual = !m; setPref('vpr.boite', manual ? 'm' : 'a'); }
  };
  const onKey = e => { // keyboard: e.code = physical position (KeyW/KeyA are Z/Q on an AZERTY keyboard)
    PER.keyboard(e); SOUND.init(); // the audio context can only start after a gesture
    if (/^Arrow|Space|Slash/.test(e.code)) e.preventDefault(); // Slash : recherche rapide de Firefox
    if (e.repeat) return;
    if (e.isTrusted && e.code === 'KeyJ') PER.hidRequest(); // before everything else: also works from the home screen
    else if (e.isTrusted && home && !aMenu) PER.hidAuto();
    command(e);
  };
  const command = e => { // a menu command, from a keyboard key or a gamepad (poll: { code, key, periph })
    if (preparingRace) return;
    if (state === 'title') SOUND.initMenu(); else SOUND.init(); inactive = 0; if (demo) { if (!outTarget) demoEnd(); return; }
    if (home) { homeAct(/^(ArrowUp|ArrowDown|KeyW|KeyS)$/.test(e.code) ? 'v' : /^(ArrowLeft|ArrowRight|KeyA|KeyD)$/.test(e.code) ? 'h' : e.code === 'Enter' || e.code === 'Space' ? 'ok' : ''); return; }
    if (choice) { choiceAct(e.code, e.key); return; }
    const key = (e.key || '').toLowerCase(); // actually typed letter, for commands named by a letter (the driving, itself, stays on physical positions)
    if (ins) { // sign-up: seats are taken by presses (see inscription); here the keyboard only: Esc frees the last seat held by a keyboard, or closes the screen; Enter goes when both seats are taken
      if (e.periph) return; const n = Math.max(PLACES.indexOf('keyboardLeft'), PLACES.indexOf('keyboardRight'));
      if (e.code === 'Escape') { if (n < 0) { ins = false; if (state !== 'title') toMenu(); } else PLACES[n] = VIEWS[n].periph = ''; }
      else if (e.code === 'Enter' && PLACES.every(p => p)) enrolledEnd();
      return;
    }
    if (state === 'pause') { const np = pauseItems().length;
      if (e.code === 'Escape' || key === 'p') state = prev;
      else if (e.code === 'ArrowUp' || e.code === 'KeyW') psel = (psel + np - 1) % np;
      else if (e.code === 'ArrowDown' || e.code === 'KeyS') psel = (psel + 1) % np;
      else if (e.code === 'Enter' || e.code === 'Space') pauseItems()[psel][1]();
      return;
    }
    if (e.code === 'Escape' && online() && state !== 'title') { if (guest()) quitsLounge(); else toMenu(); return; } // online, no pause: the guest leaves the lobby, the host goes back to the menu (the guests wait)
    if (endUI()) { // the finish screen: another map in the same mode, or the main menu; Enter only counts 1.5 s after the finish (a race is not left by crossing the line)
      if (/^(Arrow(Up|Down|Left|Right)|Key[WASD])$/.test(e.code)) fsel ^= 1; else if ((e.code === 'Enter' || e.code === 'Space') && performance.now() - tEnd > 1500) endGo(); else if (e.code === 'Escape') { fsel = 1; endGo(); } else if (key === 'r' && !two()) start();
      return;
    }
    if (e.code === 'Escape' && ses.raceEnd) { toMenu(); return; } // race over: direct return to the menu
    if ((e.code === 'Escape' || key === 'p') && (state === 'race' || state === 'count')) { prev = state; state = 'pause'; psel = 0; return; }
    if (state === 'title') { // the map menu: wheel, mode, settings (see mapsAct)
      const a = /^(ArrowUp|KeyW)$/.test(e.code) ? 'up' : /^(ArrowDown|KeyS)$/.test(e.code) ? 'down' : /^(ArrowLeft|KeyA)$/.test(e.code) ? 'left' : /^(ArrowRight|KeyD)$/.test(e.code) ? 'right' : e.code === 'Enter' || e.code === 'Space' ? 'ok' : e.code === 'Escape' ? 'back' : '';
      if (key === 'i' && two()) enrolled(); else if (a) mapsAct(a);
      return;
    }
    if (mode === 'tourAll' && ses.raceEnd) { if (e.code === 'Enter' && performance.now() - tEnd > 1500) { ses.enclosed(); if (ses.tnEnd.finished) toMenu(); else start(); } } // Tournée: the end-of-round screen, then the next one (no "rejouer"); Enter waits 1.5 s, as in two-player
    else if (ses.raceEnd && two()) { // shared board: REVANCHE or MENU, the choice of either player. Enter (a gamepad's throttle button) only counts 1.5 s after the finish: a race is not restarted by crossing the line
      if (/^Arrow|^Key[WASD]$/.test(e.code)) fsel ^= 1; else if (e.code === 'Enter' && performance.now() - tEnd > 1500) { if (fsel) toMenu(); else start(); return; } }
    else if ((e.code === 'Enter' && ses.raceEnd) || (key === 'r' && !two())) start(); // with two players, R does not restart: the key next to the gear + of player 1 (E); RECOMMENCER is in the pause menu
    const clv = two() ? 'keyboardLeft' : 'keyboard'; // with two players, the gearbox keys are those of the left keyboard
    if (key === 'g') boxMesh(e.periph || clv, 0);
    if (e.code === 'KeyE' || e.code === 'KeyQ') boxMesh(e.periph || clv, e.code === 'KeyE' ? 1 : -1); // physically A / E around Z on AZERTY
    if (key === 'l' && mode === 'solo') linkChallenge();
    if (key === 'c') zap();
    if (key === 'm') SOUND.toggleMusic();
  };
  addEventListener('keydown', onKey);
  let ins = false, fsel = 0, tEnd = 0;
  const PER = Peripherals({ nav: navigator, win: window, signal: halt.signal, places: window.__places || (window.__places = ['', '']), says: s => padSaid(s) }), PLACES = PER.places, keys = PER.keys, branch = PER.branch; // PLACES: kept on window, it survives the map change, like the renderer
  const padNote = document.body.appendChild(document.createElement('div')); padNote.setAttribute('role', 'status');
  padNote.style.cssText = 'position:fixed;top:12px;left:50%;transform:translateX(-50%);padding:8px 12px;background:#0c0c10;color:#ffd23a;font:12px "Press Start 2P",monospace;border:2px solid #ffd23a;pointer-events:none;display:none;z-index:9';
  let padNoteT = 0; const padSaid = s => { padNote.textContent = tr(s); padNote.style.display = ''; clearTimeout(padNoteT); padNoteT = setTimeout(() => { padNote.style.display = 'none'; }, 3000); };
  // Split screen. PLACES[i] = device of player i + 1, kept for the session (on window: it survives the map change, like the renderer) and copied into vu.periph.
  // ins: the sign-up screen is open, over the menu (before a start) or over a race paused (a registered device has disappeared). It is drawn by screens(), on the common layer.
  // Each device that presses takes the first free seat; + on a gamepad frees its seat (no seat: closes the screen); both seats taken, B or Enter starts, or hands control back to the pause menu.
  const labelP = id => id === 'keyboardLeft' ? 'CLAVIER ZQSD' : id === 'keyboardRight' ? 'CLAVIER FLECHES' : (id[0] === 'j' ? 'JOY-CON ' : 'MANETTE ') + (+id.replace(/\D/g, '') + 1);
  const enrolled = () => { ins = true; PER.forgets(); if (state !== 'title' && state !== 'pause') { prev = state; state = 'pause'; psel = 0; } }; // (the presses in the frame that opens the screen do not take a seat)
  const enrolledEnd = () => { ins = false; if (state === 'title') start(); };
  function inscription() {
    const r = PER.enroll(); if (r === 'closes') { ins = false; if (state !== 'title') toMenu(); } else if (r === 'part') enrolledEnd(); else VIEWS.forEach((vu, i) => { vu.periph = PLACES[i]; });
  }
  // With two players, outside sign-up: a registered device that is gone during a race pauses it and reopens sign-up for its seat.
  function gamepads2() {
    if (state !== 'title' && !AUTO && !ins) VIEWS.forEach((vu, i) => { if (!branch(vu.periph)) { PLACES[i] = vu.periph = ''; enrolled(); padSaid('PÉRIPHÉRIQUE DÉCONNECTÉ : JOUEUR ' + (i + 1)); } });
  }

  // ---------- pixel HUD (2D canvas at the game's resolution) ----------
  const PS = '"Press Start 2P", monospace', JP = 'DotGothic16, sans-serif', HU = TH.hud, Y = HU.y, C = HU.c, RD = HU.r; // map's colours and interface style
  document.fonts.load('8px ' + PS); document.fonts.load('16px ' + JP, 'スピード');
  const castiron = f => { if (hg.f_ !== f) { hg.font = f; hg.f_ = f; } }; // setting the font for each text cost as much as writing it; the last one set is noted on the context (one per view)
  // pixel text; split = red/cyan offset, glitch-style
  function txt(s, x, y, size, col, align = 'left', split = 0, font = PS, max = 1e4) { // max: width the text is squeezed into rather than overflow its panel
    s = tr(s); castiron(size + 'px ' + font); hg.textAlign = align; hg.textBaseline = 'top'; x = Math.round(x);
    if (split && HU.split) { hg.fillStyle = RD; hg.fillText(s, x - split, y, max); hg.fillStyle = C; hg.fillText(s, x + split, y, max); }
    hg.fillStyle = col; hg.fillText(s, x, y, max);
  }
  const rackFrame = (c, x, y, w, h) => { R(hg, c, x, y, w, 1); R(hg, c, x, y + h - 1, w, 1); R(hg, c, x, y, 1, h); R(hg, c, x + w - 1, y, 1, h); };
  const panel = (x, y, w, h) => { // one panel style per map
    R(hg, HU.backdrop, x, y, w, h);
    if (HU.style === 'cyber') { R(hg, Y, x, y, 2, h); R(hg, Y, x, y, w, 1); R(hg, C, x + w - 8, y + h - 1, 8, 1); } // barres jaunes, coin cyan
    else if (HU.style === 'signPanel') { rackFrame('#ffffff', x + 1, y + 1, w - 2, h - 2); corners(x, y, w, h); } // panneau d'autoroute : vert, filet blanc, coins arrondis
    else if (HU.style === 'plate') { rackFrame('#2a7a4a', x, y, w, h); rackFrame('#2a7a4a', x + 1, y + 1, w - 2, h - 2); corners(x, y, w, h); } // enamelled street plate: blue, green frame, rounded corners
    else if (HU.style === 'blk') R(hg, C, x, y + h - 2, w, 2); // underlined block
    else if (HU.style === 'panelBoard') { for (let j = 1; j < h; j += 2) R(hg, 'rgba(255,255,255,.05)', x, y + j, w, 1); rackFrame(C, x, y, w, h); } // tableau d'affichage de stade : trame de lignes, cadre
    else if (HU.style === 'rally') { for (let i = 0; i < w; i += 8) R(hg, (i >> 3) % 2 ? '#16161c' : C, x + i, y, Math.min(8, w - i), 3); R(hg, C, x, y + h - 1, w, 1); } // roadworks band on top, like on the special-stage signs
    else if (HU.style === 'givre') { R(hg, C, x, y, w, 1); R(hg, C, x, y + h - 1, w, 1); for (const [a, b] of [[0, 1], [1, 0], [0, 2], [2, 1], [3, 0], [1, 3]]) { R(hg, '#e8f4ff', x + a, y + 1 + b, 1, 1); R(hg, '#e8f4ff', x + w - 1 - a, y + h - 2 - b, 1, 1); } } // two lines, and frost caught at the corners
    else { R(hg, C, x, y, w, 1); R(hg, C, x, y + h - 1, w, 1); } // deux traits
  };
  const corners = (x, y, w, h) => { for (const [a, b] of [[0, 0], [1, 0], [0, 1]]) for (const [u, v] of [[x + a, y + b], [x + w - 1 - a, y + b], [x + a, y + h - 1 - b], [x + w - 1 - a, y + h - 1 - b]]) hg.clearRect(u, v, 1, 1); }; // rounded corners: three pixels removed from each corner
  const tag = (s, cx, y, bg) => { castiron('8px ' + PS); const w = hg.measureText(tr(s)).width + 12; R(hg, bg, Math.round(cx - w / 2), y, w, 14); txt(s, cx, y + 3, 8, '#08080c', 'center'); };
  const EQN = 20, EQR = 10, fft = new Uint8Array(32);
  // minimap: track drawn only once in an offscreen canvas (world x to the right, z downward = top view, not flipped)
  const MM = (() => {
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const s of S) { x0 = Math.min(x0, s.x); x1 = Math.max(x1, s.x); z0 = Math.min(z0, s.z); z1 = Math.max(z1, s.z); }
    const w = 84, h = 56, k = Math.min((w - 4) / (x1 - x0), (h - 4) / (z1 - z0)), c = document.createElement('canvas'), g = c.getContext('2d');
    const kx = Math.min((w - 4) / (x1 - x0), k * 2.5), kz = Math.min((h - 4) / (z1 - z0), k * 2.5); // a very elongated track (canal) is stretched up to 2.5 times on its short axis, otherwise it fits in a few pixels
    c.width = w; c.height = h;
    const px = x => Math.round((w - (x1 - x0) * kx) / 2 + (x - x0) * kx), pz = z => Math.round((h - (z1 - z0) * kz) / 2 + (z - z0) * kz);
    for (const s of S) R(g, '#e8e8e4', px(s.x), pz(s.z), 1, 1);
    R(g, RD, px(S[0].x) - 2, pz(S[0].z) - 2, 5, 5); // start line
    return { c, px, pz };
  })();
  // Home screen: the map turns behind, darkened; the title, then one flag per language, the chosen language framed and its flag waving
  const TT = (s, x, y, size, col) => { castiron(size + 'px ' + PS); hg.textAlign = 'center'; hg.textBaseline = 'top'; hg.fillStyle = col; hg.fillText(s, Math.round(x), Math.round(y)); }; // text as is, without tr()
  const flagCube = (l, x, y, w, h) => {
    if (l === 'fr') { R(hg, '#1f3fbf', x, y, w / 3 | 0, h); R(hg, '#f4f4f4', x + (w / 3 | 0), y, w / 3 | 0, h); R(hg, '#e0283a', x + (2 * w / 3 | 0), y, w - (2 * w / 3 | 0), h); return; }
    R(hg, '#1a2a7a', x, y, w, h); hg.save(); hg.beginPath(); hg.rect(x, y, w, h); hg.clip(); hg.lineCap = 'butt';
    for (const [lw, c] of [[h * 0.2, '#f4f4f4'], [h * 0.07, '#e0283a']]) { hg.strokeStyle = c; hg.lineWidth = lw; hg.beginPath(); hg.moveTo(x, y); hg.lineTo(x + w, y + h); hg.moveTo(x + w, y); hg.lineTo(x, y + h); hg.stroke(); }
    hg.restore(); R(hg, '#f4f4f4', x + w / 2 - h * 0.17, y, h * 0.34, h); R(hg, '#f4f4f4', x, y + h * 0.33, w, h * 0.34); R(hg, '#e0283a', x + w / 2 - h * 0.1, y, h * 0.2, h); R(hg, '#e0283a', x, y + h * 0.4, w, h * 0.2);
  };
  function homeDrawing(HW) {
    const now = performance.now(), t = now / 1000, cx = HW / 2, blink = (now / 400 | 0) % 2 === 0, heading = headingMap('ville', ['VILLE A', 'PLEIN REGIME'], language);
    R(hg, 'rgba(6,6,14,.62)', 0, 0, HW, HH);
    txt(heading[0], cx, 18, 24, Y, 'center', 2); txt(heading[1], cx, 44, 24, Y, 'center', 2);
    TT(tr('CHOISIS TA LANGUE'), cx, 84, 8, C);
    [['fr', 'FRANÇAIS'], ['en', 'ENGLISH']].forEach(([l, label], i) => { const on = language === l, x = cx - 156 + i * 168, y = 102, w = 144, h = 104;
      R(hg, on ? 'rgba(18,18,36,.95)' : 'rgba(8,8,16,.8)', x, y, w, h); if (on) { rackFrame(Y, x, y, w, h); rackFrame(Y, x + 1, y + 1, w - 2, h - 2); } else rackFrame('#3a3a4a', x, y, w, h);
      const fy = y + 12 + (on ? Math.sin(t * 5) * 2 | 0 : 0); flagCube(l, x + 32, fy, 80, 48); if (!on) R(hg, 'rgba(0,0,0,.6)', x + 32, fy, 80, 48);
      TT(label, x + w / 2, y + 72, 16, on ? Y : '#6a6a78'); if (on && blink) { TT('>', x - 11, y + 44, 16, Y); TT('<', x + w + 11, y + 44, 16, Y); } });
    if (blink) tag('ENTREE : JOUER', cx, 222, Y);
    TT(tr('< >  CHANGER     OU CLIQUE UN DRAPEAU'), cx, 246, 8, '#c8c8d0');
  }
  function loungeDrawing(HW) {
    const cx = HW / 2, blink = (performance.now() / 400 | 0) % 2 === 0, h = NET.role === 'hostRole';
    R(hg, 'rgba(6,6,14,.8)', 0, 0, HW, HH); txt('EN LIGNE', cx, 20, 24, Y, 'center', 2);
    if (h || enl.waiting) {
      txt(h ? 'CODE DU SALON' : 'SALON', cx, 66, 8, C, 'center'); txt(NET.code, cx, 80, 32, Y, 'center', 2);
      txt(h || NET.self ? NET.n + ' / ' + NET.MAXJ + ' JOUEURS' + (h ? '' : '   VOUS ETES J' + (NET.self + 1)) : 'CONNEXION...', cx, 128, 8, '#e8e8e4', 'center');
      if (h) { if (blink) tag('ENTREE : CHOISIR LA CARTE', cx, 160, Y); } else txt("L'HOTE CHOISIT LA CARTE ET LANCE", cx, 160, 8, C, 'center');
      txt('ECHAP : ' + (h ? 'FERMER LE SALON' : 'QUITTER LE SALON'), cx, 246, 8, '#c8c8d0', 'center'); return;
    }
    [['CREER UN SALON', 'UN CODE A DONNER AUX AUTRES'], ['REJOINDRE UN SALON', enl.typing.padEnd(4, '_').split('').join(' ')]].forEach(([l, s], i) => { const on = enl.sel === i, x = cx - 150, y = 78 + i * 44;
      R(hg, on ? 'rgba(18,18,36,.95)' : 'rgba(8,8,16,.8)', x, y, 300, 38); rackFrame(on ? Y : '#3a3a4a', x, y, 300, 38); if (on) rackFrame(Y, x + 1, y + 1, 298, 36);
      txt(l, cx, y + 6, 16, on ? Y : '#e8e8e4', 'center'); txt(s, cx, y + 26, 8, C, 'center'); });
    if (blink) tag(enl.sel ? 'TAPE LE CODE, PUIS ENTREE' : 'ENTREE : CHOISIR', cx, 182, Y);
    txt('HAUT/BAS : CHOISIR   ECHAP : RETOUR', cx, 246, 8, '#c8c8d0', 'center');
  }
  function choiceDrawing(HW) {
    if (enl) { loungeDrawing(HW); return; }
    const cx = HW / 2, blink = (performance.now() / 400 | 0) % 2 === 0, ti = headingMap(M.id, HU.heading, language);
    R(hg, 'rgba(6,6,14,.62)', 0, 0, HW, HH);
    txt(ti[0], cx, 14, 24, Y, 'center', 2); txt(ti[1], cx, 40, 24, Y, 'center', 2);
    if (tFlash && performance.now() - tFlash < 400) R(hg, 'rgba(255,255,255,' + (1 - (performance.now() - tFlash) / 400).toFixed(2) + ')', 0, 0, HW, HH); // white flash on leaving the home screen
    CHOICE.forEach(([l, s], i) => { const on = csel === i, off = false, x = cx - 150, y = 78 + i * 44;
      R(hg, on ? 'rgba(18,18,36,.95)' : 'rgba(8,8,16,.8)', x, y, 300, 38); rackFrame(on ? Y : '#3a3a4a', x, y, 300, 38); if (on) rackFrame(Y, x + 1, y + 1, 298, 36);
      txt(l, cx, y + 6, 16, on ? Y : off ? '#6a6a78' : '#e8e8e4', 'center'); txt(s, cx, y + 26, 8, off ? '#6a6a78' : C, 'center'); });
    if (blink) tag('ENTREE : CHOISIR', cx, 222, Y);
    txt('HAUT/BAS : CHOISIR   ECHAP : LANGUE', cx, 246, 8, '#c8c8d0', 'center');
  }
  // ---------- menus: menu-ui.js draws them from a model of the screen; the state and the actions stay here ----------
  // Front page (language), game choice (Solo / Split screen / Online), map menu in three steps (the wheel with La Tournée as a 19th row, then the mode, then
  // the settings and START), pause, finish (another map in the same mode, or the main menu). The online lobby, the sign-up, La Tournée's and online finishes keep the screens below.
  window.__menuTr = s => tr(s); const UI = window.__menuUI || (window.__menuUI = MenuUI({ tr: s => window.__menuTr(s) })); // one canvas for all maps, the text in this map's language
  const TOUR = { id: 'tour' }, ONLINE_V = MAPS[Math.random() * MAPS.length | 0].id; // the online tile shows a random map
  let mstep = 'pick', mpick = 0, mrow = 0, quick = false, uiScreen = '';
  const wheelMaps = () => two() || online() ? MAPS : [...MAPS, TOUR];
  const modeList = () => online() ? ['raceCase'] : two() ? MODES2 : MODES.filter(m => m !== 'tourAll');
  const MODE_UI = { solo: ['CONTRE-LA-MONTRE', 'TOURS LANCES CONTRE TON FANTOME', 'FANTOMES BRONZE, ARGENT, OR'], glisse: ['GLISSE', 'DEUX TOURS, CHAQUE DERAPAGE PAYE', 'LES MURS CASSENT LA SERIE'],
    raceCase: ['COURSE', 'TROIS TOURS CONTRE TROIS IA', 'DEPART ARRETE'], broken: ['CASSE', 'LES DEGATS COMPTENT', 'POINTS : PLACE + TAKEDOWNS'], elim: ['ELIMINATION', 'QUATRE TOURS', 'LE DERNIER SORT A CHAQUE PASSAGE'],
    tourAll: ['LA TOURNEE', 'UNE COURSE PAR CARTE, DU SOIR A MIDI', 'POINTS CUMULES, UN TROPHEE PAR DIFFICULTE'] };
  const modeUI = m => { const u = MODE_UI[m]; return { key: m, name: m === 'glisse' && two() ? 'GLISSE EN DUEL' : u[0], lines: m === 'raceCase' && two() ? [['', '', '2 JOUEURS ET 2 RIVAUX', '3 JOUEURS ET 1 RIVAL', '4 JOUEURS, SANS IA'][VIEWS.length], u[2]] : [u[1], u[2]] }; };
  const modeTo = m => { mode = m; setPref(cacheKey('mode'), JSON.stringify(m)); };
  const recordOf = id => { let b = 0; try { b = JSON.parse(localStorage.getItem('vpr8.' + (id === 'ville' ? '' : id + '.') + 'best')) || 0; } catch (e) { } return b ? fmt(b) : '--'; };
  const OPT_ROWS = [[1, 'JOUEURS', () => '' + VIEWS.length], [3, 'DIFFICULTE', () => DIFF[diff].label], [4, () => two() ? 'BOITE J1' : 'BOITE', () => manual1() ? 'MANUELLE' : 'AUTO'], [6, 'TOURS', () => '' + tnLaps]];
  const optRows = () => OPT_ROWS.filter(r => !cache(r[0])); // the lines of menuAct this mode has (see cache)
  const pickTo = i => { const L = wheelMaps(); mpick = (i + L.length) % L.length; const c = L[mpick]; if (c !== TOUR) { outTarget = c; window.__wanted = c.id; setPref('vpr.carte', c.id); } }; // the card changes at once; building belongs to START
  const menuEnter = () => { const L = wheelMaps(); mstep = 'pick'; mrow = 0; mpick = Math.max(0, mode === 'tourAll' && L.includes(TOUR) ? L.indexOf(TOUR) : L.indexOf(outTarget || M)); };
  const uiGo = () => { if (mode === 'tourAll') { const c = EVENING[tnOu().handle]; outTarget = c === M ? null : c; } msel = 5; menuAct(1); }; // La Tournée: straight to the map of its round
  function mapsAct(a) {
    const L = wheelMaps(), ml = modeList();
    if (mstep === 'pick') {
      if (a === 'up' || a === 'down') pickTo(mpick + (a === 'up' ? -1 : 1));
      else if (a === 'ok') { const tour = L[mpick] === TOUR; SOUND.beep(660);
        if (tour) { if (mode !== 'tourAll') modeTo('tourAll'); } else if (!ml.includes(mode)) modeTo(ml[0]);
        if (quick) { quick = false; uiGo(); return; } // after a finish: the same mode and settings, at once
        if (tour || ml.length < 2) { mstep = 'opts'; mrow = 0; } else { mstep = 'setup'; mrow = ml.indexOf(mode); } }
      else if (a === 'back') { quick = false; choice = true; csel = two() ? 1 : 0; if (online()) { csel = 2; enl = { sel: 0, typing: '' }; } }
    } else if (mstep === 'setup') {
      if (a === 'up' || a === 'down') mrow = (mrow + (a === 'up' ? ml.length - 1 : 1)) % ml.length;
      else if (a === 'ok') { modeTo(ml[mrow]); mstep = 'opts'; mrow = 0; SOUND.beep(660); }
      else if (a === 'back') mstep = 'pick';
    } else {
      const R = optRows(), n = R.length + 1; // the settings, then START
      if (a === 'up' || a === 'down') mrow = (mrow + (a === 'up' ? n - 1 : 1)) % n;
      else if (a === 'back') { if (mode === 'tourAll' || ml.length < 2) mstep = 'pick'; else { mstep = 'setup'; mrow = ml.indexOf(mode); } }
      else if (mrow < R.length) { msel = R[mrow][0]; menuAct(a === 'left' ? -1 : 1); mrow = Math.min(mrow, optRows().length); } // (the players line changes the lines)
      else if (a === 'ok') uiGo();
    }
  }
  const endUI = () => ses.raceEnd && state === 'race' && !ses.tnEnd && !online() && !demo && !AUTO; // the finishes menu-ui.js draws
  const endGo = () => { const menu = fsel; toMenu(); if (menu) { choice = true; csel = two() ? 1 : 0; } else quick = true; SOUND.beep(660); };
  const uiNow = () => AUTO || ST || preparingRace ? '' : state === 'title' ? home ? 'title' : ins || enl ? '' : choice ? 'main' : 'maps' : state === 'pause' ? ins ? '' : 'pause' : endUI() ? 'end' : '';
  const uiSel = (cur, i, set, ok) => { if (cur === i) ok(); else set(i); }; // a click picks the row, a second click confirms it
  function uiModel(s) {
    const modeName = modeUI(mode).name, ord = n => n + (n === 1 ? 'ER' : 'E');
    if (s === 'title') return { screen: s, lang: language, click: i => { const l = i ? 'fr' : 'en'; aMenu = true; if (l === language) homeAct('ok'); else choosesLang(l); } };
    if (s === 'main') return { screen: s, sel: csel, items: [['SOLO', "COURSES CONTRE L'IA, GLISSE, CHRONO", 'UNE VOITURE, CINQ MODES, DES MEDAILLES SUR CHAQUE CARTE.'], ['ECRAN PARTAGE', '2 A 4 JOUEURS SUR CET ECRAN', 'MANETTES, JOY-CON OU LES DEUX MOITIES DU CLAVIER.'], ['EN LIGNE', 'COURSE A PLUSIEURS PAR CODE', 'CREE UN SALON ET DONNE LE CODE, OU REJOINS UN AMI.']],
      videos: [[M.id], ['touge', 'canal', 'givre', 'plage'], [ONLINE_V]], click: i => uiSel(csel, i, j => { csel = j; }, () => choiceAct('Enter')), back: () => choiceAct('Escape'), scroll: d => choiceAct(d > 0 ? 'ArrowDown' : 'ArrowUp') };
    if (s === 'maps') { const ml = mode === 'tourAll' ? ['tourAll'] : modeList(), t = tn(), r = trophy(), R = optRows();
      const note = online() ? 'SALON ' + NET.code + ' · ' + NET.n + ' JOUEURS' : challengeErr || (CHALLENGE_DEF ? 'DEFI : ' + fmt(CHALLENGE_DEF.t) + ' A BATTRE' : quick ? modeName + (isRaceMode() ? ' · ' + DIFF[diff].label : '') + " · ENTREE : C'EST PARTI" : '');
      return { screen: s, step: mstep, sel: mpick, row: mrow, mode: Math.max(0, ml.indexOf(mode)), note, go: mode === 'tourAll' && t ? 'REPRENDRE' : 'DEMARRER',
        list: wheelMaps().map(c => c === TOUR ? { id: 'tour', tour: true, label: 'LA TOURNEE', sub: 'TOUTES LES CARTES EN UNE NUIT', tourIds: EVENING.map(m => m.id),
          facts: [['CARTES', '' + EVENING.length], ['MANCHES', 'UNE COURSE PAR CARTE, DU SOIR A MIDI'], ['TROPHEE', r ? MEDN[3 - r] : 'PAS ENCORE'], ['', t ? 'MANCHE ' + (t.handle + 1) + '/' + EVENING.length + ' · ' + t.pts[0] + ' PTS' : 'POINTS CUMULES, UN TROPHEE PAR DIFFICULTE']] }
          : { id: c.id, label: c.label, sub: c.th.hud.over[1] || '', hour: c.hour, record: recordOf(c.id) }),
        modes: ml.map(modeUI), opts: R.map(([, l, v]) => [typeof l === 'function' ? l() : l, v()]),
        foot: (fm => fm === 'tourAll' ? EVENING.length + ' MANCHES · ' + tnLaps + ' TOURS' : two() ? "RIEN N'EST ENREGISTRE" : USING_AI.includes(fm) ? '' : 'SEUL EN PISTE')(mstep === 'setup' ? ml[mrow] : mode), // that of the mode shown
        click: i => { if (mstep === 'opts') { mrow = i; mapsAct(i < R.length ? 'right' : 'ok'); } else if (mstep === 'setup') uiSel(mrow, i, j => { mrow = j; }, () => mapsAct('ok')); else uiSel(mpick, i, pickTo, () => mapsAct('ok')); },
        back: () => mapsAct('back'), scroll: d => mapsAct(d > 0 ? 'down' : 'up') }; }
    if (s === 'pause') { const P = pauseItems(); return { screen: s, sel: psel, items: P.map(p => p[0]), sub: M.label + ' · ' + modeName, video: M.id,
      click: i => uiSel(psel, i, j => { psel = j; }, () => P[i][1]()), back: () => { state = prev; }, scroll: d => { psel = (psel + (d > 0 ? 1 : P.length - 1)) % P.length; } }; }
    // end: the standings (or the Glisse score), then the two ways on
    const me = VIEWS[0].self, gl = ses.glEnd, m = { screen: s, sel: fsel, items: ['NOUVELLE CARTE', 'MENU PRINCIPAL'], sub: M.label + ' · ' + modeName + (isRaceMode() ? ' · ' + DIFF[diff].label : ''),
      help: fsel ? 'RETOUR A SOLO / ECRAN PARTAGE / EN LIGNE' : "MEME MODE, MEMES REGLAGES : CHOISIS LA CARTE ET C'EST PARTI", click: i => uiSel(fsel, i, j => { fsel = j; }, () => { if (performance.now() - tEnd > 1500) endGo(); }), scroll: () => { fsel ^= 1; } };
    if (race && race.timedOut) { const o = race.cars.slice().sort((a, b) => b.pts - a.pts); return { ...m, title: 'GLISSE EN DUEL', head: ['PLACE', 'SCORE'], rows: o.map(c => [pierBuf(c)[0], Math.round(c.pts) + ' PTS', c === o[0]]) }; }
    if (race) { const o = raceOrder(race), t1 = o[0].ending, human = c => two() ? c.k < 0 || c.k >= 3 : c === me;
      return { ...m, title: two() ? 'ARRIVEE' : (me.out ? (race.broken ? "HORS D'USAGE" : 'ELIMINE') : 'ARRIVEE') + ' : ' + ord(me.pos), head: ['PLACE', race.broken ? 'POINTS' : 'TEMPS'],
        rows: o.map((c, i) => [!two() && c === me ? 'VOUS' : pierBuf(c)[0], race.broken ? brokenPts(c) + ' PTS' : c.ending ? (i ? '+' + (c.ending - t1).toFixed(2) : fmt(c.ending)) : c.out ? 'SORT A ' + fmt(c.out) : 'EN PISTE', human(c)]),
        foot: two() ? null : [['MEILLEUR TOUR ' + fmt(me.bl), '#e8ecf4'], [race.broken ? 'TAKEDOWNS ' + me.ca.td : 'GLISSES ' + me.nDrift + '  MURS ' + me.nWall, '#9ab4e0']] }; }
    const md = gl && gl.valid ? medG(gl.score) : 0;
    return { ...m, title: 'GLISSE : ' + (gl ? gl.score : 0) + ' PTS', stats: [['TEMPS', fmt(ses.tRace)], ['RECORD', !gl || !gl.valid ? 'HORS DELAI' : gl.rec ? 'NOUVEAU RECORD' : ses.bestG + ' PTS'], ['DELAI', fmt(GLT)]],
      foot: [md ? ['MEDAILLE ' + MEDN[md - 1], MEDC[md - 1]] : ['PAS DE MEDAILLE', '#9ab4e0'], md < 3 ? ['VISE ' + MEDN[md] + ' ' + GLM[md] + ' PTS', MEDC[md]] : ['', '#fff']] };
  }
  function uiFrame() { // draws the menu-ui.js screen of the moment; false: none (the race, or a screen of the old kit)
    const s = uiNow(); if (s !== uiScreen) { if (s === 'maps') menuEnter(); uiScreen = s; }
    if (!s) { UI.hide(); return false; } UI.draw(uiModel(s)); return true;
  }
  // Screens common to all players: home, main menu, pause. Drawn in hg on a grid of HW × 270: the HUD of the solo view, the full-screen layer for two players (see layer).
  function screens(HW) {
    const cx = HW / 2, blink = (performance.now() / 160 | 0) % 3 > 0;
    if (state === 'title' && home) { homeDrawing(HW); return; }
    if (state === 'title' && choice) { choiceDrawing(HW); return; }
    if (ins) { // sign-up: who holds what, and what remains to do
      const ok = PLACES.every(p => p), pa = state === 'pause';
      R(hg, 'rgba(8,8,12,.9)', 0, 0, HW, HH); txt('INSCRIPTION', cx, 22, 24, Y, 'center', 2);
      txt(pa ? 'PERIPHERIQUE DECONNECTE : COURSE EN PAUSE' : 'CHACUN APPUIE SUR SON PERIPHERIQUE', cx, 58, 8, pa ? RD : C, 'center');
      const n = PLACES.length, q = n > 2, VIEWPTS = q ? ['HAUT GAUCHE', 'HAUT DROITE', 'BAS GAUCHE', 'BAS DROITE'] : ['VUE DU HAUT', 'VUE DU BAS']; // with 3 or 4: the cells in 2 × 2, like the views, lower
      PLACES.forEach((p, i) => { const x = cx - 150 + (i % 2) * 156, y = q ? 72 + (i >> 1) * 46 : 78, h = q ? 42 : 62, col = i ? OPP[2 + i][1] : Y; panel(x, y, 144, h);
        txt('JOUEUR ' + (i + 1), x + 72, y + (q ? 5 : 8), 8, col, 'center'); txt(VIEWPTS[i], x + 72, y + (q ? 16 : 21), 8, '#e8e8e4', 'center');
        if (p) txt(labelP(p), x + 72, y + (q ? 29 : 42), 8, col, 'center'); else if (blink) txt('APPUIE', x + 72, y + (q ? 29 : 42), 8, '#e8e8e4', 'center'); });
      ['ZQSD OU FLECHES : UNE TOUCHE DE SON COTE', 'MANETTE : UN BOUTON   J : JOY-CON', 'ECHAP / + : LIBERER SA PLACE'].forEach((l, i) => txt(l, cx, (q ? 164 : 156) + i * (q ? 12 : 13), 8, '#e8e8e4', 'center'));
      if (!ok) txt(q ? 'IL FAUT TOUTES LES PLACES POUR PARTIR' : 'IL FAUT LES DEUX PLACES POUR PARTIR', cx, 214, 8, C, 'center'); else if (blink) tag('ENTREE / B : ' + (pa ? 'CONTINUER' : 'PARTIR'), cx, 210, Y);
      return;
    }
    if (state === 'title') { // main menu: the map turns behind, you choose map, mode and gearbox
      const menuMap = outTarget || M, HU = menuMap.th.hud, Y = HU.y, C = HU.c, card = MENU_CARDS[menuMap.id] || { car: CARD.label, km: +(T.len / 1000).toFixed(1), points: M.pts };
      R(hg, 'rgba(8,8,12,.45)', 0, 0, HW, HH); const d2 = two(); // with two players, the menu says what is true with two players
      if (HU.over[0]) txt(HU.over[0], cx, 6, 16, C, 'center', 0, JP); txt(mode === 'tourAll' ? 'TOURNEE · ' + EVENING[0].hour + ' > ' + EVENING[EVENING.length - 1].hour : mode === 'raceCase' ? 'COURSE · 3 TOURS' : mode === 'broken' ? 'CASSE · 3 TOURS' : mode === 'elim' ? 'ELIMINATION · 4 TOURS' : mode === 'glisse' ? (d2 ? 'GLISSE EN DUEL' : 'GLISSE') + ' · 2 TOURS' : HU.over[1], cx, 27, 8, C, 'center');
      const ti = headingMap(menuMap.id, HU.heading, language); txt(ti[0], cx, 44, 24, Y, 'center', 2); txt(ti[1], cx, 70, 24, Y, 'center', 2);
      if (tFlash && performance.now() - tFlash < 400) R(hg, 'rgba(255,255,255,' + (1 - (performance.now() - tFlash) / 400).toFixed(2) + ')', 0, 0, HW, HH); // white flash on leaving the home screen
      panel(cx - 160, 100, 320, 140);
      const L = [['CARTE', (outTarget || M).label + '  ' + (MAPS.indexOf(outTarget || M) + 1) + '/' + MAPS.length], ['JOUEURS', d2 ? VIEWS.length + ' : ECRAN PARTAGE' : 'SOLO'], ['MODE', mode === 'tourAll' ? 'TOURNEE' : mode === 'raceCase' ? 'COURSE' : mode === 'broken' ? 'CASSE' : mode === 'elim' ? 'ELIMINATION' : mode === 'glisse' ? d2 ? 'GLISSE EN DUEL' : 'GLISSE' : 'CONTRE-LA-MONTRE'], ['DIFFICULTE', DIFF[diff].label], [d2 ? 'BOITE J1' : 'BOITE', manual1() ? 'MANUELLE' : 'AUTO'], 0, ['TOURS', '' + tnLaps]].map((r, i) => r && [...r, i]).filter(r => r).filter(r => !cache(r[2]));
      const greenhouse = L.length > 4; // 5 lines (with two players, against BOTS): closer together, to leave DEMARRER above the track
      L.forEach(([l, v, i], k) => {
        const on = msel === i, y = (greenhouse ? 104 : 105) + k * (greenhouse ? 10 : 12);
        txt((on ? '> ' : '  ') + l, cx - 152, y, 8, on ? Y : '#e8e8e4'); txt(on ? '< ' + v + ' >' : v, cx + 152, y, 8, on ? Y : C, 'right', 0, PS, 292 - tr(l).length * 8);
      });
      const go = mode === 'tourAll' && tn() ? 'REPRENDRE' : 'DEMARRER'; if (msel === 5) { if (blink) tag('> ' + go + ' <', cx, greenhouse ? 154 : 152, Y); } else txt(go, cx, greenhouse ? 157 : 155, 8, '#e8e8e4', 'center');
      hg.drawImage(MM.c, cx - 152, 170); // the track, then the map card
      [CARD.label, (T.len / 1000).toFixed(1).replace('.', ',') + ' KM', mode === 'tourAll' ? (tn() ? 'MANCHE ' + (tn().handle + 1) + '/' + EVENING.length + ' · ' + EVENING[tn().handle].hour + ' · ' + tn().pts[0] + ' PTS' : 'UNE NUIT, ' + EVENING.length + ' MANCHES') : mode === 'raceCase' ? d2 ? ['', '', '2 JOUEURS ET 2 RIVAUX', '3 JOUEURS ET 1 RIVAL', '4 JOUEURS, SANS IA'][VIEWS.length] : '3 TOURS CONTRE 3 IA' : mode === 'elim' ? 'LE DERNIER SORT' : d2 ? 'LE MEILLEUR SCORE GAGNE' : mode === 'glisse' ? 'RECORD ' + (ses.bestG ? ses.bestG + ' PTS' : '--') : 'RECORD ' + (ses.best ? fmt(ses.best) : '--')].forEach((l, i) => txt(l, cx - 58, 174 + i * 11, 8, i ? '#e8e8e4' : C, 'left', 0, PS, 210));
      if (mode === 'tourAll') { const r = trophy(); txt(r ? 'TROPHEE ' + MEDN[3 - r] : 'PAS ENCORE DE TROPHEE', cx - 58, 218, 8, r ? MEDC[3 - r] : '#e8e8e4', 'left', 0, PS, 210); } // the trophy for this difficulty: gold, silver or bronze depending on the best final place
      if (d2) txt("RIEN N'EST ENREGISTRE", cx - 58, 218, 8, '#e8e8e4', 'left', 0, PS, 210); // no record, medal or ghost either: nothing to show
      else if (!isRaceMode()) { const gl = mode === 'glisse', m = gl ? medG(ses.bestG) : medal(ses.best); if (m) txt(MEDN[m - 1], cx + 152, 196, 8, MEDC[m - 1], 'right'); if (m < 3) txt('VISE ' + MEDN[m] + ' ' + (gl ? GLM[m] + ' PTS' : fmt(REF * MED[m])), cx - 58, 218, 8, MEDC[m], 'left', 0, PS, 210); } // medal earned, and the next one to go for
      txt('HAUT/BAS : CHOISIR  GAUCHE/DROITE : CHANGER', cx, 245, 8, '#e8e8e4', 'center', 0, PS, HW - 8); txt(d2 ? 'I : INSCRIPTION (MANETTES, JOY-CON, CLAVIER)' : 'FLECHES / ZQSD   ESPACE : GLISSE   X : NITRO', cx, 257, 8, '#e8e8e4', 'center', 0, PS, HW - 8);
      if (outTarget && outTarget !== M) { // Complete card from offline data; no scene or physics work on selection.
        R(hg, '#08080c', cx - 156, 166, 312, 70); const P = card.points, xs = P.map(p => p[0]), zs = P.map(p => p[1]), x0 = Math.min(...xs), z0 = Math.min(...zs), k = Math.min(80 / (Math.max(...xs) - x0 || 1), 52 / (Math.max(...zs) - z0 || 1));
        hg.strokeStyle = '#e8e8e4'; hg.lineWidth = 1; hg.beginPath(); P.forEach(p => hg.lineTo(cx - 150 + (p[0] - x0) * k, 172 + (p[1] - z0) * k)); hg.closePath(); hg.stroke();
        txt(card.car, cx - 58, 174, 8, C, 'left', 0, PS, 210); txt(('' + card.km).replace('.', ',') + ' KM', cx - 58, 185, 8, '#e8e8e4');
        let best = 0; try { best = JSON.parse(localStorage.getItem('vpr8.' + (menuMap.id === 'ville' ? '' : menuMap.id + '.') + 'best')) || 0; } catch (e) { }
        txt('RECORD ' + (best ? fmt(best) : '--'), cx - 58, 196, 8, '#e8e8e4');
      }
      if (online()) tag('SALON ' + NET.code + ' · ' + NET.n + ' JOUEURS', cx, 25, Y); else if (challengeErr) tag(challengeErr, cx, 25, RD); else if (d2) { } else if (CHALLENGE_DEF) tag('DEFI : ' + fmt(CHALLENGE_DEF.t) + ' A BATTRE', cx, 25, GHOSTC[5]);; // in place of the subtitle: lower, the banner was biting into the title
      return;
    }
    if (state === 'pause') {
      R(hg, 'rgba(8,8,12,.95)', 0, 0, HW, HH); txt('PAUSE', cx, 36, 32, Y, 'center', 2);
      pauseItems().forEach(([s], i) => i === psel ? tag('> ' + s + ' <', cx, 92 + i * 18, Y) : txt(s, cx, 95 + i * 18, 8, '#e8e8e4', 'center'));
      txt('HAUT / BAS : CHOISIR   ENTREE : VALIDER', cx, 246, 8, C, 'center');
    }
    if (ses.raceEnd && race && state === 'race' && !endUI()) { // with two players, both players finished: the shared board. Race and Elimination: the four cars, the gaps, the best laps; Glisse duel: the two scores and the winner
      const o = raceOrder(race), t1 = o[0].ending, label = c => pierBuf(c)[0], ord = n => n + (n === 1 ? 'ER' : 'E');
      R(hg, 'rgba(8,8,12,.8)', 0, 0, HW, HH); panel(cx - 170, 40, 340, 176);
      if (race.timedOut) { const nc = race.cars.length, hi = Math.max(...race.cars.map(c => c.pts)), gs = race.cars.filter(c => c.pts === hi), g = gs.length > 1 ? null : gs[0];
        txt('GLISSE EN DUEL', cx, 50, 16, Y, 'center', 1); txt(g ? label(g) + ' GAGNE' : 'EGALITE', cx, 76, 16, g ? pierBuf(g)[1] : '#e8e8e4', 'center');
        race.cars.forEach((c, i) => { const x = cx - 170 + (i + 0.5) * 340 / nc, col = pierBuf(c)[1], within = c.ending && c.ending <= race.timedOut; txt(label(c), x, 104, 8, col, 'center'); txt(String(Math.round(c.pts)), x, 118, 16, col, 'center', 1);
          txt(within ? fmt(c.ending) : 'HORS DELAI', x, 142, 8, within ? '#e8e8e4' : RD, 'center'); if (nc > 2) { txt('GLISSES ' + c.nDrift, x, 156, 8, '#e8e8e4', 'center'); txt('MURS ' + c.nWall, x, 166, 8, '#e8e8e4', 'center'); } else txt('GLISSES ' + c.nDrift + '  MURS ' + c.nWall, x, 156, 8, '#e8e8e4', 'center'); }); // with 3 or 4, the columns are too narrow for a line
        txt('DELAI ' + fmt(race.timedOut), cx, nc > 2 ? 178 : 174, 8, C, 'center');
      } else {
        txt('ARRIVEE', cx, 48, 16, Y, 'center', 1); txt(VIEWS.map(v => { const c = v.self; return label(c) + ' ' + ord(c.pos); }).join('   '), cx, 70, 8, C, 'center');
        const ca = race.broken; txt('TEMPS', cx - 4, 88, 8, C, 'right'); txt(ca ? 'TAKEDOWNS' : 'ECART', cx + (ca ? 90 : 62), 88, 8, C, 'right'); txt(ca ? 'POINTS' : 'MEIL. TOUR', cx + 158, 88, 8, C, 'right');
        if (ca) { const v = o.slice().sort((a, b) => brokenPts(b) - brokenPts(a))[0]; txt('VAINQUEUR AUX POINTS : ' + label(v), cx, 160, 8, pierBuf(v)[1], 'center'); }
        if (ca) o.forEach((c, i) => { const y = 102 + i * 15, col = c.k < 0 || c.k >= 3 ? pierBuf(c)[1] : '#e8e8e4'; txt((i + 1) + '. ' + label(c), cx - 158, y, 8, pierBuf(c)[1]); txt(c.ending ? fmt(c.ending) : c.out ? "HORS D'USAGE" : 'EN PISTE', cx - 4, y, 8, col, 'right'); txt(String(c.ca.td), cx + 90, y, 8, col, 'right'); txt(String(brokenPts(c)), cx + 158, y, 8, col, 'right'); });
        else o.forEach((c, i) => { const y = 102 + i * 15, col = c.k < 0 || c.k >= 3 ? pierBuf(c)[1] : '#e8e8e4'; txt((i + 1) + '. ' + label(c), cx - 158, y, 8, pierBuf(c)[1]); // both players in their colour across the whole line
          txt(c.ending ? fmt(c.ending) : c.out ? 'SORT A ' + fmt(c.out) : 'EN PISTE', cx + (c.ending ? -4 : 62), y, 8, col, 'right'); if (i && c.ending) txt('+' + (c.ending - t1).toFixed(2), cx + 62, y, 8, col, 'right'); txt(c.bl ? fmt(c.bl) : '--', cx + 158, y, 8, col, 'right'); });
        txt((race.elim ? 'ELIMINATION' : race.broken ? 'CASSE' : 'COURSE') + ' · NIVEAU ' + DIFF[diff].label, cx, 170, 8, '#e8e8e4', 'center');
      }
      ['REVANCHE', 'MENU'].forEach((l, i) => i === fsel ? tag('> ' + l + ' <', cx - 70 + i * 140, 190, Y) : txt(l, cx - 70 + i * 140, 193, 8, '#e8e8e4', 'center'));
      txt('GAUCHE / DROITE : CHOISIR   ENTREE : VALIDER', cx, 226, 8, C, 'center');
    }
  }
  const TIERS = [300, 250, 200, 150, 100, 50, 30, 10]; // distance levels of the alerts (m): we show the one already passed, never further than the truth
  function drawHUD(vu, dt, sp, warn) { // the HUD of a view: its car, its camera (opponent labels), its banners, on its canvas
    const { car, cam, cth, rpm, load, peak, result, splitMsg, hudT, w: HW } = vu, alone = !COM, finished = ses.raceEnd || vu.finished, manu = vu.n ? car.manual : manual, self = vu.self; hg = vu.hg; // finished: this player has arrived (with two players, the other can still drive); manu: its gearbox; self: its car (car is the one the view looks at: another one once eliminated, with two players)
    hg.clearRect(0, 0, HW, HH);
    const cx = HW / 2, blink = (performance.now() / 160 | 0) % 3 > 0;
    if (state === 'title') { if (alone) screens(HW); hudT.needsUpdate = true; return; } // home and menu: in the HUD of the solo view, on the common layer with two players
    // chrono
    const gl = mode === 'glisse'; // Glisse mode: lap on 2, time to hold, then the score, the multiplier and the points of the current slide
    panel(6, 6, 132, 50); txt(race ? 'TOUR ' + car.lap + '/' + race.laps : gl ? 'TOUR ' + clamp(Math.floor(car.dist / N) + 1, 1, 2) + '/2' : 'TOUR ' + ses.lapN, 12, 11, 8, C); if (HU.jp) txt(HU.jp[0], 132, 6, 16, C, 'right', 0, JP);
    const hold = (H, v, ms, now = performance.now()) => { if (H.v === undefined || v === H.v) { H.v = H.w = v; } else if (v !== H.w) { H.w = v; H.t = now; } else if (now - H.t > ms) H.v = v; return H.v; }; // shows a new value only once it has held for ms: side by side, two cars swapped places every few frames
    txt(fmt(race ? car.ending || car.out || race.t : ses.tRace), 12, 24, 16, Y, 'left', 1); if (race && !gl) { if (!vu.posH || vu.posH.r !== race) vu.posH = { r: race }; const pos = car.ending || car.out ? car.pos : hold(vu.posH, car.pos, 900); // the place shown: 0.9 s steady before it changes; exact once finished
      const nv = Math.max(pos, alive().length), dev = raceOrder(race)[car.pos - 2], pc = pos === 1 ? Y : pos === nv ? RD : '#e8e8e4'; // the position in large next to the timer; below it, the gap in seconds to the car in front (distance / speed: approximate)
      panel(6, 60, 62, 50); txt(String(pos), 14, 68, 32, pc, 'left', 2); txt(pos === 1 ? 'ER' : 'E', 46, 68, 8, pc); txt('/' + nv, 46, 94, 8, C); // under the timer: top centre, the end-of-lap banners covered it in 4:3
      if (dev && !finished) { const g = (dev.dist - car.dist) * 2 / Math.max(sp, 15); txt('+' + g.toFixed(1) + ' ' + pierBuf(dev)[0], 12, 44, 8, g < 1 ? Y : '#e8e8e4'); } else txt(finished ? '' : 'EN TETE', 12, 44, 8, Y); }
    else txt(gl ? 'DELAI ' + fmt(GLT) : ses.best ? 'REC ' + fmt(ses.best) : 'REC --', 12, 44, 8, gl && ses.tRace > GLT ? RD : C); // red: only when the time limit is exceeded
    if (gl && !finished) { const pointAt = race && race.cars[1 - vu.n]; // in duel: the other player's score under their own (frozen if they have finished)
      panel(144, 6, 110, pointAt ? 55 : 41); txt('SCORE', 150, 11, 8, C); if (pointAt) { txt(pierBuf(pointAt)[0], 150, 48, 8, pierBuf(pointAt)[1]); txt(String(Math.round(pointAt.ending ? pointAt.pts : pointAt.score)), 248, 48, 8, pierBuf(pointAt)[1], 'right'); } txt('x' + car.mult, 248, 11, 8, car.mult > 1 ? Y : '#e8e8e4', 'right'); txt(String(Math.round(car.score)), 248, 25, 16, Y, 'right', 1);
      if (car.ongoing > 0) tag('GLISSE +' + Math.round(car.ongoing) + (car.mult > 1 ? '  x' + car.mult : ''), cx, 66, car.glD >= GL.min ? Y : '#e8e8e4'); // white while it is too short to count
    }
    // vitesse
    panel(HW - 126, HH - 74, 120, 68); txt(HU.mph ? 'MPH' : 'KM/H', HW - 120, HH - 69, 8, C); if (HU.jp) txt(HU.jp[1], HW - 12, HH - 74, 16, C, 'right', 0, JP);
    txt(String(sp * 3.6 * (M.kmh || 1) / (HU.mph ? 1.609 : 1) | 0), HW - 10, HH - 54, 32, Y, 'right', 1); // HU.mph: in miles, where the road uses them
    // power gauge styled like an equaliser: the columns light up with the revs, dance with the sound, peaks falling back
    panel(6, HH - 78, 138, 72); txt(String(Math.round(rpm * CARD.red / 100) * 100), 12, HH - 73, 8, C); if (manu && rpm > 0.92 && blink) txt('SHIFT', 54, HH - 73, 8, RD); else txt(manu ? 'MANU' : 'AUTO', 54, HH - 73, 8, manu ? Y : C); txt(String(car.gear + 1), 138, HH - 75, 16, car.shiftT > 0 ? '#ffffff' : Y, 'right', 1); // revs in rpm, gear (white during the shift) txt('G' + (gear + 1), 136, HH - 73, 16, Y, 'right', 1);
    if (SOUND.ana) SOUND.ana.getByteFrequencyData(fft);
    if (HU.gauge === 'needle') { // needle rev counter: half dial graduated every 1,000 rpm, red zone, needle in large pixels that quivers at full load
      const ox = 75, oy = HH - 12, ro = 46, ang = f => Math.PI * (1 + f), pt = (a, q, c, t = 1) => R(hg, c, Math.round(ox + Math.cos(a) * q) - (t >> 1), Math.round(oy + Math.sin(a) * q) - (t >> 1), t, t);
      for (let f = 0; f <= 1.001; f += 0.01) pt(ang(f), ro + 1, f > 0.88 ? RD : C);
      for (let k = 0; k * 1000 <= CARD.red; k++) { const f = k * 1000 / CARD.red; for (let q = ro - (k % 2 ? 3 : 6); q <= ro; q++) pt(ang(f), q, f > 0.88 ? RD : '#e8e8e4'); }
      const a = ang(clamp(rpm, 0, 1.04) + (Math.random() - 0.5) * 0.012 * load); for (let q = 0; q < ro - 4; q++) pt(a, q, rpm > 0.92 ? RD : Y, 2);
      R(hg, '#e8e8e4', ox - 2, oy - 2, 5, 5);
    } else if (HU.gauge === 'led') { // LED bar, American digital dashboard: segments rising in a curve, green, yellow, red; the top lights up with the music
      for (let i = 0; i < 24; i++) { const fr = (i + 0.5) / 24, h = 6 + Math.round(30 * fr * fr), on = fr <= rpm, a = SOUND.ana ? fft[1 + (i >> 1)] / 255 : 0;
        R(hg, !on ? '#1c1c2c' : fr > 0.88 ? RD : fr > 0.66 ? Y : '#40ff80', 12 + i * 5, HH - 12 - h, 4, h); if (on && a > 0.6) R(hg, '#ffffff', 12 + i * 5, HH - 12 - h, 4, 1); }
    } else for (let i = 0; i < EQN; i++) { // equaliser
      const fr = (i + 0.5) / EQN, on = fr <= rpm, a = SOUND.ana ? fft[1 + i] / 255 : 0.5;
      const L = clamp(on ? (0.3 + 0.7 * fr) * (0.65 + 0.35 * a) + 0.1 * load : 0.22 * a, 0, 1), rows = Math.round(L * EQR);
      peak[i] = Math.max(peak[i] - dt * 0.9, L);
      for (let j = 0; j < EQR; j++) R(hg, j >= rows ? '#1c1c2c' : !on ? '#2a4a5a' : j > 7 || fr > 0.88 ? RD : j > 4 ? Y : C, 12 + i * 6, HH - 14 - j * 4, 5, 3);
      R(hg, '#ffffff', 12 + i * 6, HH - 14 - Math.min(EQR - 1, Math.round(peak[i] * EQR)) * 4, 5, 1);
    }
    if (radioT > 0 || state === 'count' || state === 'pause') { panel(HW - 126, 78, 120, 30); txt('RADIO ' + (SOUND.musicOn ? SOUND.fq : '--.-'), HW - 120, 83, 8, radioT > 0 && blink ? '#ffffff' : C); txt(labelRadio(), HW - 120, 95, 8, Y); } // the radio: only at the start, in pause and on station change
    if (state === 'race' || state === 'count') { // minimap, under the radio; one dot per car: dot(x, z, colour)
      const mx = HW - 96, my = 12, dot = (x, z, c) => R(hg, c, mx + MM.px(x) - 1, my + MM.pz(z) - 1, 3, 3);
      panel(HW - 102, 6, 96, 68); hg.drawImage(MM.c, mx, my); // 96 wide: does not touch the central banners even in 4:3 (HW = 360)
      if (ghostM.visible) dot(ghostM.position.x, ghostM.position.z, GHOSTC[ses.ghostIdx]);
      if (race) race.cars.forEach(c => c !== car && !portion(c) && dot(c.x, c.z, pierBuf(c)[1])); // the other player has their colour, like a rival
      R(hg, '#08080c', mx + MM.px(car.x) - 3, my + MM.pz(car.z) - 3, 7, 7); R(hg, blink ? pierBuf(car)[1] : '#ffffff', mx + MM.px(car.x) - 2, my + MM.pz(car.z) - 2, 5, 5); // the player: bigger, outlined in black, blinking
    }
    if (race && !finished && state === 'race') { const taken = [...(warn ? [[cx, 62, 170]] : []), ]; // the central banners are already taken; marker above each opponent: at 270 lines, a distant car is only a few pixels
      cam.updateMatrixWorld(); const lab = vu.lab || (vu.lab = new WeakMap()), now = performance.now(); // lab: notch of each label in this view, per car
      race.cars.forEach(c => {
        const dx = c.x - cam.position.x, dz = c.z - cam.position.z, f = dx * Math.cos(cth) + dz * Math.sin(cth);
        if (c === car || f < 3 || f > 400 || c.out) return; // its own car, behind the camera, too far, or out of the race
        tmp.set(c.x, model(c).position.y + 2.4, c.z).project(cam);
        const [name, col] = pierBuf(c), x = Math.round((tmp.x + 1) / 2 * HW), y = Math.round((1 - tmp.y) / 2 * HH), w = name.length * 8 + 4;
        let ly = y - 14; while (taken.some(p => Math.abs(p[0] - x) < (p[2] + w) / 2 + 2 && Math.abs(p[1] - ly) < 12)) ly -= 12; // two labels in the same place: the second moves up a notch
        const L = lab.get(c) || {}, off = hold(L, y - 14 - ly, y - 14 - ly > (L.v || 0) ? 300 : 1500, now); // a notch up after 0.3 s of overlap, back down after 1.5 s clear: a brief overlap no longer leaves a gap
        lab.set(c, L); ly = y - 14 - off; taken.push([x, ly, w]);
        R(hg, 'rgba(8,8,12,.75)', x - w / 2, ly, w, 11); txt(name, x, ly + 2, 8, col, 'center'); R(hg, col, x - 2, y - 2, 5, 3); R(hg, col, x - 1, y + 1, 3, 2);
      });
    }
    if (car.boost > 0) tag('NITRO', HW - 66, HH - 92, C); else if (car.asp > 0.15) tag('ASPIRATION', HW - 66, HH - 92, Y); // above the counter: in the centre, it chased the rivals' labels up into the sky
    if (state !== 'title') { // nitro gauge, in the speed panel: 10 segments; it rises while sliding, close to a wall or a truck, in the slipstream; full, it blinks; it empties while it is triggered
      const f = car.nitro, full = f >= 1 && blink, n = car.sec ? Math.floor(f * 10) : Math.ceil(f * 10); // a lit segment = usable nitro (when empty, sim.js NI.sec, it waits for a full segment)
      txt('N', HW - 120, HH - 17, 8, f > 0 ? Y : '#6a6a78');
      // th.graze: grazing the wall fills the gauge (sim.js, wall); the gauge lights up while it rubs, and 0.3 s after, the segment filling in white
      const fro = !!TH.graze && (vu.fro = car.rub && Math.hypot(car.vx, car.vz) > 15 ? 0.3 : Math.max(0, (vu.fro || 0) - dt)) > 0 && car.boost <= 0;
      for (let i = 0; i < 10; i++) R(hg, fro && i === Math.min(n, 9) ? '#ffffff' : i >= n ? '#30303c' : car.boost > 0 ? C : full ? '#ffffff' : fro ? '#fff2a0' : Y, HW - 108 + i * 10, HH - 17 - (fro && i === Math.min(n, 9)), 8, 7 + 2 * (fro && i === Math.min(n, 9)));
    }
    if (vu.brokenMsg && (vu.brokenMsg.T -= dt) > 0) tag(vu.brokenMsg.t, cx, 124, vu.brokenMsg.c); // CASSE: takedown inflicted or received
    if (splitMsg && (splitMsg.T -= dt) > 0) tag('S' + (splitMsg.i + 1) + ' ' + (splitMsg.d == null ? fmt(splitMsg.t) : (splitMsg.d <= 0 ? '-' : '+') + Math.abs(splitMsg.d).toFixed(2)), cx, 102, splitMsg.d == null ? Y : splitMsg.d <= 0 ? C : RD); // gap to the record at each sector
    if (warn) { // warn: signed distance to the bend (> 0 right, < 0 left, in m, alertCorner) or { iceSurf: distance }; rounded to the level already passed
      const d = warn.iceSurf || Math.abs(warn), m = ' ' + (TIERS.find(p => p <= d) || 10) + ' M ';
      if (blink || d < 30) tag(warn.iceSurf ? '! GLACE' + m + '!' : warn > 0 ? '! VIRAGE DROITE' + m + '>>' : '<<' + m + 'VIRAGE GAUCHE !', cx, 62, warn.iceSurf ? C : Y); // under 30 m it no longer blinks: it is now
    }
    if (race && race.elim && !finished && state === 'race') { // elimination: who just went out (3 s), and the alert while the player is last (the leader's first lap is protected)
      const v = alive(), o = race.cars.find(c => c.out && race.t - c.out < 3);
      if (o) tag(pierBuf(o)[0] + ' SORT' + (v.length === 2 ? ' · DUEL FINAL' : ''), cx, 118, C);
      if (race.headEl && car.pos === v.length && blink) tag('DERNIER : DOUBLE AVANT LA LIGNE', cx, 102, RD);
    }
    if (COM && race && self.out && !ses.raceEnd && state === 'race') { // with two players, eliminated player: the announcement for 3 s, then its view follows the leader (see frame) under a simple reminder
      if (vu.spec) tag((race.broken ? "HORS D'USAGE" : 'ELIMINE') + ' · CAMERA SUR ' + pierBuf(car)[0], cx, 28, RD);
      else { panel(cx - 124, 66, 248, 68); txt(race.broken ? "HORS D'USAGE" : 'ELIMINE', cx + 2, 76, race.broken ? 16 : 32, RD, 'center', 2); txt(self.pos + 'E SUR ' + race.cars.length, cx, 118, 8, '#e8e8e4', 'center'); }
    }
    // screens
    if (mode === 'tourAll' && state === 'count') tag('MANCHE ' + (tnOu().handle + 1) + '/' + EVENING.length + ' · ' + M.hour, cx, 88, C); // the time of night at which the round is run
    if (state === 'count' && shown || goT > 0) { const s = goT > 0 ? 'GO' : String(shown); R(hg, HU.backdrop, cx - 20 - s.length * 30, 66, 40 + s.length * 60, 78); txt(s, cx + 4, 74, 64, Y, 'center', 3); } // on a backdrop, at the top: neither the gantry nor the cars pass behind
    if (result && state !== 'title' && !(race && finished) && (result.T -= dt) > 0) { // result of the lap just completed, without stopping the race
      tag('TOUR ' + result.n + '  ' + fmt(result.t), cx, 28, Y); if (result.pos) tag('PLACE ' + result.pos + '/' + result.of, cx, 44, C); else tag(result.first ? 'PREMIER TEMPS' : result.rec ? 'NOUVEAU RECORD' : '+' + result.diff.toFixed(2) + ' S', cx, 44, result.rec ? C : RD);
      const b = result.b, m = medal(result.t), L = [];
      if (!race) L.push(m < 3 ? [MEDN[m] + ' A -' + (result.t - REF * MED[m]).toFixed(2), MEDC[m]] : ['TOUR EN OR', MEDC[2]]); // what this lap was missing for the next medal
      if (result.challenge != null) L.push(result.challenge < 0 ? ['DEFI BATTU ' + result.challenge.toFixed(2), GHOSTC[5]] : ['DEFI A -' + result.challenge.toFixed(2), RD]); // against the lap received by link
      if (!race) L.push(['L : LIEN DEFI', '#e8e8e4']);
      if (b) L.push(['GLISSES ' + b[0], '#e8e8e4'], ['NITRO ' + b[1], C], ['MURS ' + b[2], b[2] ? RD : '#e8e8e4']);
      const ly = race && !gl ? 114 : 60; panel(6, ly, 132, 8 + L.length * 11); L.forEach(([s, c], i) => txt(s, 12, ly + 5 + i * 11, 8, c)); // in a race, under the position panel
    }
    const glEnd = ses.glEnd; if (glEnd && state === 'race' && !endUI()) { // Glisse mode, both laps completed: the score, if it counts, the record and the medal
      const m = medG(glEnd.score);
      panel(cx - 150, 52, 300, 150); txt('GLISSE : ' + glEnd.score, cx, 60, 16, Y, 'center', 1);
      [[glEnd.valid ? glEnd.rec ? 'NOUVEAU RECORD' : 'RECORD ' + ses.bestG + ' PTS' : 'HORS DELAI : SCORE NON COMPTE', glEnd.valid && glEnd.rec ? C : RD], ['TEMPS ' + fmt(ses.tRace) + '   DELAI ' + fmt(GLT), '#e8e8e4'],
        !glEnd.valid ? ['', C] : m ? ['MEDAILLE ' + MEDN[m - 1], MEDC[m - 1]] : ['BRONZE A ' + GLM[0] + ' PTS', MEDC[0]], ['GLISSES ' + car.nDrift + '  NITRO ' + car.nBoost + '  MURS ' + car.nWall, '#e8e8e4']].forEach(([s, c], i) => txt(s, cx, 90 + i * 16, 8, c, 'center'));
      txt('ENTREE : REJOUER   ECHAP : MENU', cx, 182, 8, C, 'center');
    }
    if (COM && race && race.timedOut && vu.finished && !ses.raceEnd && state === 'race') { // Glisse en duel, ce joueur a fini : son score, en attendant l'autre
      panel(cx - 130, 60, 260, 62); txt('SCORE ' + Math.round(self.pts), cx, 68, 16, Y, 'center', 1); txt(self.ending ? 'TEMPS ' + fmt(self.ending) : 'HORS DELAI : SCORE NUL', cx, 92, 8, self.ending ? '#e8e8e4' : RD, 'center'); txt("L'AUTRE JOUEUR ROULE ENCORE", cx, 106, 8, C, 'center');
    }
    if (finished && race && state === 'race' && !ses.tnEnd && !endUI() && (alone || !ses.raceEnd && !self.out && !race.timedOut)) { // finish: standings, completed as the others cross the line (with two players: only in the view of the first to finish; the shared board takes over)
      panel(cx - 150, 52, 300, 166); txt((car.out ? (race.broken ? "HORS D'USAGE : " : 'ELIMINE : ') : 'ARRIVEE : ') + car.pos + (car.pos === 1 ? 'ER' : 'E'), cx, 60, 16, Y, 'center', 1); const t1 = raceOrder(race)[0].ending;
      raceOrder(race).forEach((c, i) => { const j = c !== car; txt((i + 1) + '. ' + (j ? pierBuf(c)[0] : 'VOUS'), cx - 138, 86 + i * 15, 8, j ? pierBuf(c)[1] : Y); txt(c.ending ? fmt(c.ending) : c.out ? 'SORT A ' + fmt(c.out) : 'EN PISTE', cx + (c.out ? 138 : 50), 86 + i * 15, 8, j ? '#e8e8e4' : Y, 'right'); if (race.broken) txt(brokenPts(c) + ' PTS', cx + 138, 86 + i * 15, 8, j ? '#e8e8e4' : Y, 'right'); else if (i && c.ending) txt('+' + (c.ending - t1).toFixed(2), cx + 138, 86 + i * 15, 8, j ? '#e8e8e4' : Y, 'right'); });
      txt('MEILLEUR TOUR ' + fmt(self.bl), cx, 152, 8, C, 'center'); txt(race.broken ? 'TAKEDOWNS ' + car.ca.td + '  POINTS ' + brokenPts(car) : 'GLISSES ' + car.nDrift + '  NITRO ' + car.nBoost + '  MURS ' + car.nWall, cx, 166, 8, race.broken ? Y : '#e8e8e4', 'center'); txt('NIVEAU ' + DIFF[diff].label, cx, 180, 8, '#e8e8e4', 'center');
      txt(!ses.raceEnd ? (VIEWS.length > 2 ? "D'AUTRES JOUEURS ROULENT ENCORE" : "L'AUTRE JOUEUR ROULE ENCORE") : 'ENTREE : REJOUER   ECHAP : MENU', cx, 200, 8, C, 'center'); // (with two players: Enter and Esc only act once both players have finished)
    }
    if (ses.tnEnd && state === 'race') { // Tournée, round closed: left the finish and the points earned, right the overall standings, below what comes next (or the trophy after the last)
      const f = ses.tnEnd, nbr = MAPS.length, ord = n => n + (n === 1 ? 'ER' : 'E'), a = (performance.now() - tEnd) / 1000, k = (t0, d) => clamp((a - t0) / d, 0, 1), smooth = x => x * x * (3 - 2 * x);
      const nm = j => j ? pierBuf(race.cars[j])[0] : 'VOUS', co = j => j ? pierBuf(race.cars[j])[1] : Y, podium = i => i < 3 ? MEDC[2 - i] : '#e8e8e4';
      const line = (y, x, w, j) => { if (!j) R(hg, 'rgba(255,210,58,' + (0.12 + 0.08 * Math.sin(a * 6)) + ')', x, y - 3, w, 13); }; // the player: a band that breathes under their line
      panel(cx - 176, 40, 352, 188); txt(f.finished ? 'TOURNEE TERMINEE' : 'MANCHE ' + (f.handle + 1) + '/' + nbr + ' : ' + ord(f.tier), cx, 48, 16, Y, 'center', 1); txt(M.hour + ' · ' + M.label, cx, 68, 8, C, 'center');
      txt('ARRIVEE', cx - 170, 84, 8, C); txt('GENERAL', cx + 8, 84, 8, C);
      raceOrder(race).forEach((c, i) => { const j = race.cars.indexOf(c), y = 98 + i * 15, g = f.pts[j] - f.before[j], n = Math.round(g * smooth(k(0.3 + i * 0.15, 0.5))); // the points drop one after another, from first to last
        line(y, cx - 174, 170, j); txt((i + 1) + '.', cx - 170, y, 8, podium(i)); txt(nm(j), cx - 154, y, 8, co(j)); txt(c.ending ? fmt(c.ending) : '--', cx - 38, y, 8, '#e8e8e4', 'right');
        txt('+' + n, cx - 8, y - (n === g && g ? 2 * (1 - k(0.8 + i * 0.15, 0.2)) : 0), 8, n === g && g ? Y : '#e8e8e4', 'right'); });
      const before = tourAll(f.before).ranking, m = smooth(k(1.6, 0.6)); // the overall standings from before the round, then each slides to their new place (after the points have dropped)
      f.ranking.forEach((j, i) => { const y = Math.round(98 + (before.indexOf(j) + (i - before.indexOf(j)) * m) * 15), p = Math.round(f.before[j] + (f.pts[j] - f.before[j]) * smooth(k(0.8, 0.8)));
        line(y, cx + 4, 170, j); txt((m < 1 ? before.indexOf(j) + 1 : i + 1) + '.', cx + 8, y, 8, podium(m < 1 ? before.indexOf(j) : i)); txt(nm(j), cx + 24, y, 8, co(j)); txt(p + ' PTS', cx + 170, y, 8, j ? '#e8e8e4' : Y, 'right'); });
      if (m === 1 && f.tier < before.indexOf(0) + 1) txt('+' + (before.indexOf(0) + 1 - f.tier), cx + 110, 98 + (f.tier - 1) * 15, 8, '#3ae87a', 'right'); // places gained in the overall standings
      txt('MEILLEUR TOUR ' + fmt(self.bl), cx, 162, 8, '#e8e8e4', 'center');
      if (f.finished) { txt(f.tier <= 3 ? 'TROPHEE ' + MEDN[3 - f.tier] : 'PAS DE TROPHEE', cx, 178, 8, f.tier <= 3 ? MEDC[3 - f.tier] : RD, 'center'); txt('NIVEAU ' + DIFF[diff].label, cx, 192, 8, '#e8e8e4', 'center'); }
      else { txt('SUITE : ' + EVENING[f.handle + 1].hour + ' · ' + EVENING[f.handle + 1].label, cx, 178, 8, '#e8e8e4', 'center'); txt('DEPART ' + ord(f.grid[0] + 1) + ' SUR LA GRILLE', cx, 192, 8, '#e8e8e4', 'center'); }
      if (a > 1.5) txt(f.finished ? 'ENTREE : MENU' : 'ENTREE : COURSE SUIVANTE   ECHAP : QUITTER', cx, 210, 8, C, 'center');
    }
    if (spike && state !== 'title' && (spike.T -= dt) > 0) { // a rival's line, radio-style: a line without background, black outline, name in its colour; fades out over the last half second
      hg.globalAlpha = Math.min(1, spike.T * 2); castiron('8px ' + PS); const n = tr(spike.n) + ' ', wn = hg.measureText(n).width, x = Math.round(cx - (wn + hg.measureText(tr(spike.s)).width) / 2);
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1]]) { txt(n, x + dx, 166 + dy, 8, '#000'); txt(spike.s, x + wn + dx, 166 + dy, 8, '#000'); } // black outline: readable without background
      txt(n, x, 166, 8, spike.c); txt(spike.s, x + wn, 166, 8, '#fff'); hg.globalAlpha = 1; }
    if ((spikeT -= dt) < 0) spikeT = 0;
    if (demo) { // demo mode: the time and the map, and the invitation to take back control
      R(hg, 'rgba(8,8,12,.7)', 0, 132, HW, 34); txt('DEMO · ' + M.hour + ' · ' + M.label, cx, 137, 8, C, 'center'); if ((performance.now() / 500 | 0) % 2) txt('APPUIE SUR UNE TOUCHE', cx, 151, 8, Y, 'center');
    }
    if (alone && state === 'pause') screens(HW);
    hudT.needsUpdate = true;
  }

  // the moon follows the car in steps of CELL_SIZE (64 shadow texels, 24 m): between two steps, the fixed scenery's shadow map does not change (see shadows)
  const LR = new V3().crossVectors(new V3(0, 1, 0), SD).normalize(), LU = new V3().crossVectors(SD, LR), TX = 2 * OCH / OTX, CELL_SIZE = TX * 64, tmp = new V3(), shdS = new THREE.Sphere();
  function sunFollow(car) {
    tmp.set(car.x, 0, car.z);
    const a = Math.round(tmp.dot(LR) / CELL_SIZE), b = Math.round(tmp.dot(LU) / CELL_SIZE), c = Math.round(tmp.dot(SD) / CELL_SIZE);
    sun.target.position.set(0, 0, 0).addScaledVector(LR, a * CELL_SIZE).addScaledVector(LU, b * CELL_SIZE).addScaledVector(SD, c * CELL_SIZE);
    sun.position.copy(sun.target.position).addScaledVector(SD, 400); return a + ':' + b + ':' + c;
  }
  // Shadows in two stages. The fixed scenery (layer 0) is drawn into the shadow map only when the moon changes step, then kept in the view's target (vu.shadows);
  // each frame, the map reuses this copy (depth included: SHD writes gl_FragDepth) and only the moving objects that cast a shadow (layer SHDD: cars, debris, dyn scenery) are redrawn into it.
  // Before: all the scenery every frame, 35 to 100 draw calls. A moving object that casts a shadow must be on layer SHDD (done at build time for everything that is not fixed, see "merge")
  // three r18x keeps the shadow in the map's depth texture (no longer in colour): SHDS stores it in colour in the copy (depth encoded on RGBA), SHD puts it back into depth
  const SHD = new THREE.ShaderMaterial({ uniforms: { t: { value: null } }, vertexShader: post.vertexShader, depthFunc: THREE.AlwaysDepth,
      fragmentShader: '#include <packing>\nuniform sampler2D t; varying vec2 v; void main(){ gl_FragColor = vec4(0.); gl_FragDepth = unpackRGBAToDepth(texture2D(t, v)); }' }),
    SHDS = new THREE.ShaderMaterial({ uniforms: { t: { value: null } }, vertexShader: post.vertexShader, depthTest: false, depthWrite: false,
      fragmentShader: '#include <packing>\nuniform sampler2D t; varying vec2 v; void main(){ gl_FragColor = packDepthToRGBA(texture2D(t, v).x); }' }),
    shadeScene = new THREE.Scene(), shadeDeep = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, side: THREE.BackSide }), shadeDeepI = shadeDeep.clone(), // one per layer: using the same one for both made three recompute the program key at each switch from one to the other
    shadeNul = new THREE.WebGLRenderTarget(1, 1), shadeFixed = new THREE.OrthographicCamera(-1e-6, 1e-6, 1e-6, -1e-6, 0, 1e-6); // shadeFixed: sees nothing (far below the map, null field) and only layer 0: the render that takes it only makes the fixed scenery's shadow (shadowMap.render is not called outside a render)
  shadeFixed.position.set(0, -1e7, 0); shadeFixed.updateMatrixWorld(); shadeFixed.layers.set(30); sun.layers.enable(30); // layer 30: the sun alone; without it, this render drew into its one-pixel target everything not culled off-screen (particles, water: about twenty passes)
  const shadeQ = new THREE.Mesh(quad.geometry, SHD); shadeQ.frustumCulled = false; shadeScene.add(shadeQ);
  sun.shadow.camera.layers.set(SHDD); renderer.shadowMap.autoUpdate = false;
  const gameCopy = (src, dst, m) => { shadeQ.material = m; m.uniforms.t.value = src; renderer.setRenderTarget(dst); renderer.autoClear = false; renderer.render(shadeScene, postCam); renderer.autoClear = true; };
  // Moving shadows are only drawn (and the copy reused) within a square of SHDR meters around the followed car: the whole map every frame cost 1 to 2 ms of GPU.
  // Further away, a moving object casts no shadow; the fixed scenery keeps its own everywhere. The square of the previous frame is also reused: no stale shadow stays there
  const SHDR = 120;
  function shades(vu, cacheKey, car, y) {
    const S = sun.shadow, W = S.mapSize.x; sun.updateMatrixWorld(); sun.target.updateMatrixWorld();
    if (!vu.shadows) vu.shadows = { C: new THREE.WebGLRenderTarget(W, S.mapSize.y, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false }), cacheKey: null, b: null };
    const O = vu.shadows, fixed = O.cacheKey !== cacheKey || !S.map;
    if (fixed) { renderer.shadowMap.needsUpdate = true; S.camera.layers.set(0); S.camera.layers.enable(SHDF); /* r18x takes the layers of the shadow camera (if they exceed layer 0) instead of those of the render: it is set back on the fixed scenery */ renderer.setRenderTarget(shadeNul); renderer.render(scene, shadeFixed); gameCopy(S.map.depthTexture, O.C, SHDS); O.cacheKey = cacheKey; O.b = null; } // fixed scenery only, then kept
    else S.updateMatrices(sun); // (the previous view may have left its map and its matrices)
    tmp.set(car.x, y, car.z).applyMatrix4(S.matrix); const r = SHDR / TX, b = [tmp.x * W - r, tmp.y * W - r, tmp.x * W + r, tmp.y * W + r].map(v => clamp(Math.round(v), 0, W)), p = O.b || b;
    const bx = Math.min(b[0], p[0]), by = Math.min(b[1], p[1]); S.map.scissorTest = true;
    if (!fixed) { S.map.scissor.set(bx, by, Math.max(b[2], p[2]) - bx, Math.max(b[3], p[3]) - by); gameCopy(O.C.texture, S.map, SHD); } // the copy: this square and the previous frame's one
    S.map.scissor.set(b[0], b[1], b[2] - b[0], b[3] - b[1]); O.b = b;
    // a moving object whose shadow cannot fall in the square (its sphere, seen from the sun, is outside the square) is not drawn: the pass cost every car and all the moving scenery of the map
    const caches = []; for (let i = shdM.length - 1; i >= 0; i--) { const o = shdM[i]; if (!o.parent) { shdM.splice(i, 1); continue; } if (!o.visible || !o.frustumCulled || !o.geometry) continue; // a group that carries castShadow is not drawn itself
      if (!o.isInstancedMesh && !o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); const sp = o.isInstancedMesh ? o.boundingSphere : o.geometry.boundingSphere; if (!sp) continue;
      shdS.copy(sp).applyMatrix4(o.matrixWorld); tmp.copy(shdS.center).applyMatrix4(S.matrix); const rp = shdS.radius / TX;
      if (tmp.x * W + rp < b[0] || tmp.x * W - rp > b[2] || tmp.y * W + rp < b[1] || tmp.y * W - rp > b[3]) { o.visible = false; caches.push(o); } }
    renderer.autoClear = false; renderer.setRenderTarget(S.map);
    for (const [c, m] of [[SHDD, shadeDeep], [SHDI, shadeDeepI]]) { S.camera.layers.set(c); scene.overrideMaterial = m; renderer.render(scene, S.camera); }
    renderer.autoClear = true; scene.overrideMaterial = null; S.map.scissorTest = false; for (const o of caches) o.visible = true;
  }

  const RED = new THREE.Color(0xff1828), ETIN = new THREE.Color(0xff8a20), BLUE = new THREE.Color(0x3a9cff), HEADLIGHT = new THREE.Color(0xfff2d0), NEONC = new THREE.Color(L.neon || 0), BOX = new THREE.Matrix4().makeScale(ENCt.x / 2, ENCt.y / 2, ENCt.z / 2).setPosition(ENCc), boxM = new THREE.Matrix4(); // BOX: encloses the whole body, for the shadow (a point inside or above it is not shaded)
  const TRB = ST && ST.shakes * ST.aa || SHAKES;
  // continuous altitude along the track: read sample by sample, it made the car and the camera jump at each step, all the more visible when driving slowly
  // (the computation is in sim.js: ground(), which adds the wall's height on a drivable wall; car.y is this ground, or the flight height)
  const yAt = (c, k = 0) => ground(T, c, k);
  // attitude [pitch, roll]: on the ground the car follows the slope of the track and that of the wall; in the air its nose follows its trajectory
  const attitude = c => { const s = S[c.idx], ax = Math.cos(c.th), az = Math.sin(c.th), gn = slope(s, c.d), [df, dr] = tilt(T, c); // tilt: the slope of craters (M.dents, M.bowls), zero on every map without them
    return [c.air ? 0.7 * Math.atan2(c.vy, Math.max(5, Math.hypot(c.vx, c.vz))) : Math.atan(s.sl + gn * (s.tx * az - s.tz * ax) + df), -Math.atan(gn * (s.tx * ax + s.tz * az) + (c.air ? 0 : dr))]; };
  freshView(); // the player's view: the scenery is built, all its light fixtures are declared
  if (!backdrop) { GAME_LOADER.progress(0.88, "PREPARATION DE L'IMAGE", 3); await whoosh(); }
  // Background maps warm the full scene; first boot can display its visible materials while off-screen programs finish compiling.
  if (backdrop) await renderer.compileAsync(scene, VIEWS[0].cam); else renderer.compile(scene, VIEWS[0].cam);
  // the glass shards (MeshStandardMaterial + envMap) make their PMREM and their shader at the first break: one shard of each glass rendered once into an 8 px target, during loading
  { const rt = new THREE.WebGLRenderTarget(8, 8), ts = GLASS.map(mv => { const t = new THREE.InstancedMesh(SHARD, mv, 1); t.frustumCulled = false; scene.add(t); return t; }), r0 = renderer.getRenderTarget(); renderer.setRenderTarget(rt); renderer.render(scene, VIEWS[0].cam); renderer.setRenderTarget(r0); ts.forEach(t => { scene.remove(t); t.dispose(); }); rt.dispose(); }
  // One or two players: as many views. With two, each has their device and the common full-screen layer is placed on the game's canvas. Set in the menu: called during a race, we come back to it.
  // Each one's device comes from the sign-up screen (PLACES); the mode and difficulty are re-read from the preferences for this number of players. The comparison styles (?style=) stay with one view.
  const players = n => {
    n = ST ? 1 : clamp(n | 0, 1, 4); if (state !== 'title') toMenu(); ins = false;
    while (VIEWS.length > n) removeView(); while (VIEWS.length < n) freshView();
    if (n > 1) { while (PLACES.length < n) PLACES.push(''); PLACES.length = n; } // one seat per player; those of extra players are returned
    VIEWS.forEach((vu, i) => { vu.periph = n > 1 ? PLACES[i] : ''; });
    const Lm = n > 1 ? MODES2 : MODES; mode = CHALLENGE_DEF && n < 2 ? 'solo' : Lm.find(m => pref(cacheKey('mode'), '') === JSON.stringify(m)) || Lm[0]; diff = clamp(+pref(cacheKey('diff'), 1) | 0, 0, DIFF.length - 1);
    if (n > 1 && !COM) { const c = document.createElement('canvas'); renderer.domElement.after(c); COM = { c, g: c.getContext('2d') }; if (!active) c.style.display = 'none'; } // (the page's stylesheet stretches any canvas over the screen, in crisp pixels)
    else if (n < 2 && COM) { COM.c.remove(); COM = null; }
    resize();
  };
  { const n = +(Q.get('players') || pref('vpr7.joueurs', '1')); if (n > 1 && !CHALLENGE_DEF && !NET.role) players(n); } // the menu preference; ?players=1 or 2 in the address takes precedence, without touching it (captures in ?auto). A challenge link opens in solo
  // The common layer, drawn once per frame over both views: what addresses both players at once (home, menu, sign-up, pause, finish board or end of the Glisse duel). Hidden when it has nothing to show.
  function layer() {
    const full = state === 'title' || state === 'pause' || ses.raceEnd && state === 'race'; COM.c.hidden = !full; if (!full) return;
    hg = COM.g; hg.clearRect(0, 0, COM.c.width, HH); screens(COM.c.width);
  }
  // display: shifts the cars by dec seconds (and the traffic clock) for the frame; rends puts them back where the physics left them, unless someone moved them in the meantime
  const SHOWNV = [];
  let decT = 0; // the traffic no longer moves after the finish (tTraffic), the cars if
  const poster = (cars, dec, traffic) => { SHOWNV.length = 0; if (!(dec > 0)) return dec; decT = traffic ? dec : 0; tTraffic += decT;
    for (const c of cars) { const x = c.x + c.vx * dec, z = c.z + c.vz * dec, th = c.th + (c.air ? 0 : (c.yaw || 0) * (Math.sign(c.vf) || 1) * dec); SHOWNV.push(c, c.x, c.z, c.th, x, z, th); c.x = x; c.z = z; c.th = th; }
    return dec; };
  const renders = dec => { if (!(dec > 0)) return; tTraffic -= decT;
    for (let i = 0; i < SHOWNV.length; i += 7) { const c = SHOWNV[i]; if (c.x === SHOWNV[i + 4] && c.z === SHOWNV[i + 5] && c.th === SHOWNV[i + 6]) { c.x = SHOWNV[i + 1]; c.z = SHOWNV[i + 2]; c.th = SHOWNV[i + 3]; } } SHOWNV.length = 0; };
  function frame(now) {
    const dt = state === 'pause' ? 0 : clamp((now - last) / 1000 || 0, 0, 0.1); last = Math.max(last, now); // paused, time stops, the image stays
    if (state === 'count') {
      count -= dt; const k = Math.ceil(count); // one second per digit
      if (count <= 0) { state = 'race'; goT = 0.8; SOUND.beep(880); SOUND.crash(); }
      else if (k !== shown) { shown = k; SOUND.beep(440); }
    }
    if (goT > 0) goT -= dt;
    if (demo) { if (!outTarget && (demo.t += dt) > DEMO_DUR) demoNext(); } else if (demoPossible() && (inactive += dt) > DEMO_WAITING) demoLaunch(); else if (state !== 'title') inactive = 0;
    LIGHTS.forEach((m, i) => m.color.setHex(goT > 0 ? 0x30ff60 : state === 'count' && shown && shown <= 3 - i ? 0xff2030 : 0x3a0810)); // countdown 3, 2, 1: one more light at each digit; green at GO
    for (const c of PER.poll({ menu: home || state === 'title' || state === 'pause' || ses.raceEnd, home, two: two() })) command(c); if (ins) inscription(); else if (two()) gamepads2();
    for (const vu of VIEWS) { // each player's input, read from their device; the autopilot drives in ?auto and once the player has arrived (its input then only serves the brake lights and the sound)
      const k = PER.entering(vu.periph); if (demo && (k.gas || k.brake || k.hand || k.nitro || k.steer)) { if (!outTarget) demoEnd(); } // in demo: touching the wheel or pedals returns control
      vu.inp = state === 'race' ? (AUTO || demo || ses.raceEnd || vu.finished ? autopilot(vu.car, T, 1, M.traffic && !race ? traffic(T, tTraffic) : []) : k) : { steer: 0, gas: 0, brake: 0, hand: false };
      vu.gas = state === 'count' ? k.gas : vu.inp.gas; vu.hit = vu.bump = vu.land = 0;
    }
    const J = VIEWS[0], inp = J.inp, car = J.self; // player 1: its smoothed height and light serve the scene's effects; its car is the one from the game outside races
    moMaj(); // (the previous frame's state: one frame late, invisible)
    for (acc += dt; acc >= H; acc -= H) {
      const dmgL = race && state === 'race' ? race.cars : [car]; dmgL.forEach((c, i) => { DMGV[i * 2] = c.vx; DMGV[i * 2 + 1] = c.vz; }); // damage: the speed before the step, to know where an impact comes from
      // in a race, sim.js moves everyone forward, with one input per human; null input: the BOTS drive this player's car (?auto, or once arrived)
      if (race && state === 'race') { if (guest()) { NET.applySetting(race); dry(race, H); } else { for (let i = 0; i < race.h; i++) INS[i] = online() && i ? NET.ins[i] : AUTO || demo || VIEWS[i].finished ? null : VIEWS[i].inp; stepRace(race, INS, H); } } else { step(car, inp, T, H); if (M.traffic && state === 'race') hitTraffic(car, T, tTraffic); }
      dmgT += H; if (state === 'race') dmgL.forEach((c, i) => dmgStep(c, DMGV[i * 2], DMGV[i * 2 + 1]));
      for (const vu of VIEWS) { const c = vu.car; vu.land = Math.max(vu.land, c.land); vu.bump = Math.max(vu.bump, c.bump || 0); vu.hit = Math.max(vu.hit, c.hit, vu.bump); } // image jolts, per view (its shake) ; shortcut: a car-to-car impact reuses the wall-impact effects (sparks on the wall side), to split if it shows
      if (state === 'race' && !ses.raceEnd) { // end of race, lap completed, Drift over: the session decides, we show and play it
        tTraffic += H; const ev = ses.stepSec(car, H);
        for (const i of ev.arrived) if (VIEWS[i]) { VIEWS[i].finished = true; SOUND.arrival(race.cars[i].pos); } // online, the other humans have no view here
        if (ev.ending) { tEnd = performance.now(); if (race && mode === 'tourAll') ses.enclosed(); } // Tournée: the round ends at the finish; a single screen shows the race and the overall standings
        if (ev.lapRun) { VIEWS[0].result = { ...ev.lapRun, T: 5, b: summary(VIEWS[0]) }; if (ev.ghostRun) padSaid('FANTÔME : ' + labelF()); SOUND.stinger(ev.lapRun.rec); } // lap time, shown for 4 s
        if (ev.glisse) SOUND.stinger(ses.glEnd.rec);
      }
    }
    if (race && state === 'race' && online()) { if (guest()) NET.entering(VIEWS[0].inp); else NET.diffuse(race); }
    // the image shows each car at the frame's instant and not at the last 1/120 s step: the remainder (acc) is advanced at its speed, rendered at the next step (poster / renders, at the end of the frame).
    // Without it the motion judders whenever the screen does not refresh at a divisor of 120 Hz (144 Hz: one frame in six does not advance; 60 Hz hesitating: 1 or 3 steps) — regularity() of tools/perf.js
    const SHOWN = poster(race ? race.cars : VIEWS.map(v => v.self), state === 'race' ? acc : 0, !ses.raceEnd);
    if (COM && race && race.elim && state === 'race') for (const vu of VIEWS) { const self = vu.self; // two players, eliminated player for 3 s: their view switches to the leader, and follows if the leader changes
      if (self.out && race.t - self.out > 3) { const m = race.cars.find(c => c.pos === 1); if (vu.car !== m) { vu.car = m; vu.cth = m.th; vu.carY = m.y; vu.spec = true; } } }
    const beat = SOUND.beat, pulse = SOUND.pulse; // beat synced to the kick
    // smoothed state of each view, before touching the scene: shake, displayed RPM, height and attitude of the followed car, camera heading, nitro and tunnel fades
    for (const vu of VIEWS) { const c = vu.car, [tg, rl] = attitude(c);
      if (vu.hit > 8) vu.stun = 0.7; if (vu.land > 7) vu.stun = Math.max(vu.stun, Math.min(0.45, (vu.land - 6) * 0.08)); vu.stun -= dt; // a hard landing shakes too
      vu.up = drivetrain(vu, dt, vu.gas);
      { const s = S[c.idx], [df, dr] = tilt(T, c), ax = Math.cos(c.th), az = Math.sin(c.th); const q = (df * (c.vx * ax + c.vz * az) + dr * (c.vz * ax - c.vx * az)) * dt; if (!c.air) vu.carY += s.sl * (c.vx * s.tx + c.vz * s.tz) * dt + q; if (q && !c.air) { vu.cy += q; vu.ly += q; } if (M.fallCam && c.air) { vu.cy += c.vy * dt; vu.ly += c.vy * dt; } } vu.carY += (c.y - vu.carY) * Math.min(1, dt * 18); // the slope first, then the smoothing: without it the smoothed car dragged under the road going uphill (30 cm at 13 %) and floated going downhill; q, from tilt: the same for the slope of craters (M.dents, M.bowls), zero on a map without them, and for the two smoothed heights of the camera (cy, ly), which lagged 1.7 m behind a car diving into a crater
      vu.pitch += (tg - vu.pitch) * Math.min(1, dt * 10); vu.roll += (rl - vu.roll) * Math.min(1, dt * 10); // pitch and roll (slope, wall, flight): on their own line, a comment had swallowed them
      if (state === 'title') vu.cth += dt * 0.22; else vu.cth += wrap(c.th - vu.cth) * Math.min(1, dt * 6); // in the menu, the camera orbits the car to show the map
      if ((vu.lookT -= dt) < 0) { const k = Math.exp(-dt * 5); vu.lookA *= k; vu.lookP *= k; } // mouse still for 2.5 s: the camera returns behind the car
      vu.nit = clamp(vu.nit + (c.boost > 0 ? dt / 0.7 : -dt / 1.1), 0, 1); // nitro: 0.7 s to enter, 1.1 s to exit
      vu.lm += ((sceneryTick && sceneryTick.indoor ? Math.max(zone(c.idx, 10), sceneryTick.indoor(c.idx)) : zone(c.idx, 10)) - vu.lm) * Math.min(1, dt * 8); // tick.indoor(i): 0..1, a hall or underground the scenery builds itself (area51) darkens, adapts the eye and sounds like a tunnel; without it, the engine tunnel alone // light: neon night ↔ interchange on red alarm, beating with the music
    }
    const { carY, lm } = J;

    // the scene, once for all views: the cars (they follow the terrain), the effects, the ghost, the sound
    opps.forEach((g, i) => {
      const c = race && race.cars.find(c => c.k === i); g.visible = !!c && !portion(c) && !(c.out && race.t - c.out > 3 && now / 120 & 1); if (!c) return; // an eliminated car pulls over, blinks, then disappears
      const [t, ro] = attitude(c); g.userData.y += (c.y - g.userData.y) * Math.min(1, dt * 18);
      g.rotation.order = 'YZX'; g.position.set(c.x, g.userData.y, c.z); g.rotation.set(ro, -c.th, t);
      if (i < 3) { const u = g.userData, v = c.vf || 0; u.dec = (u.dec || 0) + ((u.vf === undefined ? 0 : (u.vf - v) / Math.max(dt, 1e-3)) - (u.dec || 0)) * Math.min(1, dt * 6); u.vf = v; brakeParts(g, u.dec > 5 ? 1 : 0, v, dt); } // rivals do not expose their controls: the brake is read from the deceleration (engine braking and air drag make less than 5 m/s²)
      if (i < 3) for (let r = 1; r < 5; r++) { const st = g.children[r]; st.children[0].rotation.z -= (c.vf || 0) * dt / rr; if (r > 2) st.rotation.y = -(c.steer || 0) * 0.45; } // the rivals; the models of players 2 to 4 turn their wheels in fxCar
    });
    for (const vu of VIEWS) { const on = !vu.spec && (!vu.n || vu.car !== car); vu.hu.tr.visible = on; if (!vu.n) carG.visible = !vu.spec; if (on) fxCar(vu, dt); } // (a view switched to the leader no longer places its player's car: player 2's stays a parked rival, player 1's is hidden) // each human car, with the smoothed state of its view (player 2's model has just been placed as a rival: it is placed again). Two views on the same car, in the menu: only once
    if (TH.alarm) { carMat.emissive.setRGB(0.3 * lm, 0.01 * lm, 0.03 * lm); for (const m of tunMats) m.color.setScalar((m.userData.amb || 1) * (0.75 + 0.5 * pulse)); }
    if (state === 'race' && race) for (let i = 0; i < race.cars.length; i++) { // race: the completed lap of each car, and its best (finish board); for a player, the same "lap + time" banner as in time attack, with the place (the last lap is covered by the finish ranking)
      const c = race.cars[i], vu = VIEWS.find(v => v.self === c), ln = Math.floor(c.dist / N); if (c.out || ln <= c.rl || ln > race.laps) continue;
      const lt = (c.ending || race.t) - c.rlT; c.bl = c.bl ? Math.min(c.bl, lt) : lt; c.rl = ln; c.rlT = race.t;
      if (vu && ln < race.laps) vu.result = { n: ln, t: lt, pos: c.pos, of: alive().length, T: 5, b: summary(vu) };
    }
    if (state === 'race' && race && VIEWS.length === 1 && !demo && !online() && !car.ending && !car.out) for (const c of race.cars) { // rival call-outs: an overtake in either direction
      const d = c.dist - car.dist; if (c === car || c.ending || c.out) continue; if (Math.abs(d) < 10) { if ((c.pro = (c.pro || 0) + dt) > 4) { c.pro = -30; peakAt(c, '', TAUNTS.evt.squeezed); } } else if (c.pro > 0) c.pro = 0; // stuck to the player for more than 4 s: once, then 30 s of respite
      if (Math.abs(d) < 3) continue; const dev = d > 0; if (c.dev !== undefined && dev !== c.dev) peakAt(c, dev ? 'pass' : 'double'); c.dev = dev; }
    if (state === 'race' && race && VIEWS.length === 1 && !demo && !online() && !car.ending && !car.out) { // the player's other events, already known to the engine: wall, contact, nitro, line crossing, dirt
      if (car.nWall > (car.nwv | 0)) { car.nwv = car.nWall; pickEvt(TAUNTS.evt.impact, 0.6); }
      if (car.bump > 2) { if (!car.bmp) pickEvt(TAUNTS.evt.bump); car.bmp = 1; } else car.bmp = 0;
      if (car.boost > 0) { if (!car.nit_) pickEvt(TAUNTS.evt.nitro, 0.35); car.nit_ = 1; } else car.nit_ = 0;
      if (car.lap !== car.lapV) { const n = alive().length, ev = car.lap === race.laps ? (car.pos === 1 ? 'lastLapLeading' : car.pos === n ? 'lastLapTrailing' : 'lastLap') : car.pos === 1 ? 'leading' : car.pos === n ? 'trailing' : 'spot'; if (car.lapV) pickEvt(ev === 'spot' ? TAUNTS.mapDef[M.id] : TAUNTS.evt[ev]); car.lapV = car.lap; }
      if (race.t > 20 && !said.has('spot') && said.add('spot')) pickEvt(TAUNTS.mapDef[M.id]); // a scenery line around 20 s
      if (!said.has('dirty') && dirtyDe(carG).n > 0.6 && said.add('dirty')) pickEvt(TAUNTS.evt.dirty); }
    if (state === 'race' && mode === 'solo') {
      const sp = ses.saves(car, carY); if (sp) J.splitMsg = { ...sp, T: 2.5 };
    }
    const gi = ses.tRace * 20, g0 = Math.floor(gi) * 4, gf = gi % 1, ghost = state === 'race' && mode === 'solo' && ses.traceF();
    ghostM.visible = !!ghost && g0 + 7 < ghost.length;
    if (ghostM.visible) { ghostM.material.color.set(GHOSTC[ses.ghostIdx]); ghostM.position.set(lerp(ghost[g0], ghost[g0 + 4], gf), lerp(ghost[g0 + 1], ghost[g0 + 5], gf) + ENCc.y, lerp(ghost[g0 + 2], ghost[g0 + 6], gf)); ghostM.rotation.y = -(ghost[g0 + 3] + wrap(ghost[g0 + 7] - ghost[g0 + 3]) * gf); }
    fxFrame(dt, now);
    // sound: engine, gearbox and tyres per player (SE.cars, one entry per view; silent if the view looks at a car other than its player's, or at the car the first view already makes audible: after an elimination, in the two-player menu); the radio, the tunnel, the rain and the ambience follow the best-placed human still racing (alone, out of race, or everyone finished: player 1). Objects stay attached to the views: nothing is allocated per frame
    const SE = J.sound || (J.sound = { cars: [] }); let Jm = J; if (race) for (const vu of VIEWS) if (!vu.finished && (Jm.finished || vu.car.pos < Jm.car.pos)) Jm = vu;
    SE.cars.length = 0; for (const vu of VIEWS) { const c = vu.car, o = vu.sj || (vu.sj = {}); o.muted = vu.spec || (vu !== J && !J.spec && J.car === c); o.car = c; o.sp = Math.hypot(c.vx, c.vz); o.r = Math.min(1, o.sp / TOP); o.gas = vu.gas; o.hit = vu.hit; o.bump = vu.bump; o.land = vu.land; o.up = vu.up > 0; o.down = vu.up < 0; o.rpm = vu.rpm; o.load = vu.load; o.spool = vu.spool; o.dmgP = dmgLvl(c); SE.cars.push(o); }
    const cm = Jm.car, jm = Jm.sj; SE.state = state; SE.car = cm; SE.T = T; SE.lapRun = race ? Math.min(race.laps - 1, Math.max(0, Math.floor(cm.dist / N))) : 0; SE.lapCount = race ? race.laps : 0; SE.hot = hot(cm.idx, 50); SE.tun = Jm.lm; SE.amb = ambAt(cm.idx); SE.item = objSound; objSound = 0; SE.r = jm.r; SE.sp = jm.sp; SE.hit = jm.hit; SE.bump = jm.bump; SE.finished = ses.raceEnd; // finished: the radio fades behind the finish board
    { const s = S[cm.idx], L = s.w - 1.1; SE.intoWall = Math.sign(cm.d) * clamp(1 - (L - Math.abs(cm.d)) / 5, 0, 1); } // the edge we hug (+ right): its echo answers louder
    { const fx = Math.cos(cm.th), fz = Math.sin(cm.th), veh = race ? race.cars.filter(c => c !== cm && !portion(c)) : M.traffic && state !== 'title' ? traffic(T, tTraffic) : []; // the two other nearest vehicles, which we hear
      SE.otherCars = veh.map(c => [c, Math.hypot(c.x - cm.x, c.z - cm.z)]).filter(a => a[1] < 150).sort((a, b) => a[1] - b[1]).slice(0, 2).map(([c, d]) => {
        const dx = c.x - cm.x, dz = c.z - cm.z, rx = c.vx - cm.vx, rz = c.vz - cm.vz, cam = c.lane !== undefined;
        // out of direct sight (occ 0..1): the straight line to it leaves the road (facades, walls, the bend's mountain); we measure how far it strays from the axis, beyond the half-width
        let i = cm.idx, di = (c.idx - i + N) % N, occ = 0; if (di > N / 2) { i = c.idx; di = N - di; }
        for (let q = 0; q <= di && occ < 1; q += 3) { const s = S[(i + q) % N]; occ = Math.max(occ, clamp((Math.abs((s.x - cm.x) * dz - (s.z - cm.z) * dx) / Math.max(d, 1) - s.w) / 10, 0, 1)); }
        return { lat: dz * fx - dx * fz, fwd: dx * fx + dz * fz, dist: d, vr: -(rx * dx + rz * dz) / Math.max(d, 1), vrel: Math.hypot(rx, rz), rpm: cam ? 1500 : c.rpm, lorry: cam, occ }; }); }
    SOUND.frame(dt, SE);
    if (state !== 'title') radioT -= dt; // the station announcement blinks 2.5 s (one radio for all views)
    for (const vu of VIEWS) viewFrame(vu, dt, now);
    if (COM) { // two players: a crisp 2-pixel line straddling both views, then the common layer
      renderer.setScissor(0, (HH - 1) * KL, VIEWS[0].w * KL, 2 * KL); renderer.setClearColor(C); renderer.clear(true, false, false); renderer.setClearColor(0);
      layer();
    }
    renders(SHOWN);
  }
  // One view: the camera behind its car (lower, closer and wider-angle with speed), then everything in the scene that depends on who is looking
  // (sky, moon and its shadow, fog, dynamic light, distant lights, rain), its HUD, the scene in its target and the final pass.
  const ORB = new THREE.Color(TH.orb.col), RAYS = 0.25; // RAYS: strength of the light rays (final pass)
  const [V0, V1] = (M.spd || [130, 200]).map(v => v / 3.6 / (M.kmh || 1)); // the map's speed-effects range, in true m/s
  function viewFrame(vu, dt, now) {
    const { cam, car, carY, pitch, roll, lm, cth, stun, lookA, lookP, rainO, splP, splA, splD, inp } = vu, pulse = SOUND.pulse, G = model(car);
    if (sceneryTick && sceneryTick.view) sceneryTick.view(car); // the scenery that depends on the followed car (wangan: the coaster moves forward from one lap to the next), set for each view before its render
    const sp = Math.hypot(car.vx, car.vz), r = Math.min(1, sp / TOP), fx = Math.cos(car.th), fz = Math.sin(car.th), air = car.y - yAt(car); // air: height above the ground
    const rc = vu.rc += (Math.min(1, sp / V1) - vu.rc) * Math.min(1, dt * 3); // camera framing (setback, height, field): proportional to speed from standstill, smoothed over ~0.3 s, no threshold
    const cx = Math.cos(cth + lookA), cz = Math.sin(cth + lookA), back = 6.4 - 1 * rc; // low, close camera: the ground scrolls in inverse proportion to its height, which is what gives the sense of speed
    let px = car.x - cx * back, pz = car.z - cz * back;
    const s = S[(car.idx - 4 + N) % N], nx = -s.tz, nz = s.tx, d = (px - s.x) * nx + (pz - s.z) * nz, o = Math.abs(d) - (s.w - 0.8);
    if (o > 0 && !insidePlace(T, px, pz)) { px -= nx * Math.sign(d) * o; pz -= nz * Math.sign(d) * o; } // the camera stays between the walls (on a plaza where you drive everywhere, it follows)
    const rv0 = clamp((sp - V0) / (V1 - V0), 0, 1); // speed effects (shake, field, vignette, blur, aberration): from M.spd[0] to M.spd[1] km/h displayed
    const rv = vu.rv += (rv0 - vu.rv) * Math.min(1, dt * 5); // smoothed over ~0.2 s: an impact or a braking jolt no longer makes field, vignette and blur jump from one frame to the next
    const vib = () => Math.random() * 2 - 1; // vibration drawn each frame: sines faster than 30 Hz fold back on screen as a slow roll, and a position jolt is erased by the lookAt
    const rs = clamp((rv - 0.4) / 0.6, 0, 1), shake = 0.03 * rs + 0.045 * rs * rs * rs, impact = stun > 0 ? stun * 0.35 : 0; // speed: nothing over the bottom 40 % of the effects range (130 km/h → peak), full at the peak; impact: brief, sharp
    // the camera follows the ground under it, without dropping into a pit the car flies over (±2.5 m around the car's ground), rises with the car in flight and leans with it on a wall
    const y0 = yAt(car), yGround = k => clamp(yAt(car, k), y0 - 2.5, y0 + 2.5) + air;
    const pc = T.dent ? yAt({ idx: car.idx, x: px, z: pz, d: car.d, y: car.y }) + 1.5 : s.y + wallFace(s, (px - s.x) * nx + (pz - s.z) * nz) + 1.5; // (craters, M.dents and M.bowls: the ground where the camera is, which a crater puts under the ribbon or above the car) // above the wall where the camera is (car high on the wall, camera pushed out towards its top: it went under it)
    // smoothed heights: glued to the car, the camera jumped at takeoff and dropped sharply on landing; softer in flight (~0.4 s) than on the ground (~0.1 s, the slope is still followed). Gap > 20 m (start, reposition): we snap straight to it
    const ky = Math.min(1, dt * (car.air ? 2.5 : 10)), smoothNoise = (k, t) => (vu[k] = Math.abs(t - vu[k]) < 20 ? vu[k] + (t - vu[k]) * ky : t);
    const yc = Math.max(smoothNoise('cy', yGround(-3)), yAt(car, -3) + 0.8 - (M.camH || 3.2)), yl = smoothNoise('ly', yGround(5)); // never under the road at the camera's position
    cam.position.set(px + vib() * shake + (Math.random() - 0.5) * impact, Math.max(pc, yc + (M.camH || 3.2) + lookP - 0.5 * rc) + vib() * shake * 0.7 + (Math.random() - 0.5) * impact, pz);
    // M.fallCam (a map with a long fall: the Moon's crater jump): in flight the two smoothed heights get the car's vertical speed (views loop: at 30 m/s of fall their 0.4 s of lag left the car 12 m under the frame),
    // and the camera looks down the trajectory (vu.dive: the slope of the flight, eased in and out over ~0.3 s, so it comes back level after the landing). Other maps: dive stays 0
    const dive = vu.dive = (vu.dive || 0) + ((M.fallCam && car.air ? clamp(car.vy / Math.max(20, sp), -0.6, 0.15) : 0) - (vu.dive || 0)) * Math.min(1, dt * 3);
    cam.lookAt(car.x + cx * 10, yl + 1.1 + 6 * dive, car.z + cz * 10); cam.rotateZ(-0.6 * roll);
    cam.rotateX(vib() * shake * 0.12); cam.rotateY(vib() * shake * 0.08); // the image itself jerks (≈ 0.4° at the peak), sharp and small
    const nitE = vu.nit * vu.nit * (3 - 2 * vu.nit); // nitro: smooth start and end (widened field and vignette)
    cam.fov = 62 + 20 * rc + 10 * rv * rv + 3 * car.slide + 6 * nitE; // + grand-angle en fin de course : l'effet tunnel
    const photo = window.__g.view; // shortcut: debug console only, __g.view = [angle° around the car, distance, height, field° (45 by default)] to inspect the model; replace with a real photo mode if one is wanted
    if (photo && photo.p) { cam.position.set(...photo.p); cam.lookAt(...photo.l); cam.fov = photo.f || 45; } // or { p: position, l: point looked at, f: field° } in the world: tools/build-menu-previews.js flies over the track
    else if (photo) { const a = car.th + photo[0] * Math.PI / 180; cam.position.set(car.x + Math.cos(a) * photo[1], carY + photo[2], car.z + Math.sin(a) * photo[1]); cam.lookAt(car.x, carY + 0.7, car.z); cam.fov = photo[3] || 45; }
    cam.updateProjectionMatrix();
    const stepL = sunFollow(car);
    // fog and sky: neon night ↔ tunnel; lightning: double flash on the sky and the lighting (the thunder starts from fxFrame)
    scene.fog.color.copy(FOG_OUT).lerp(FOG_IN, lm); scene.fog.near = lerp(TH.fogD[0] * FAR, 15, lm); scene.fog.far = lerp(TH.fogD[1] * FAR * (HAZE ? HAZE[car.idx] : 1), 320, lm);
    let kBr = 0; for (const [z, n0, n1] of hazeZ) { const k = z(car.idx, 90); if (k > 0) { scene.fog.near = lerp(scene.fog.near, n0, k); scene.fog.far = lerp(scene.fog.far, n1, k); kBr = Math.max(kBr, k); } }
    { const far = Math.min(3000, Math.max(scene.fog.far * 1.5, TH.isFar || 0)), kf = far * 0.95 / 2500; // the camera no longer draws beyond the fog; sky (2 500 m) and orb (2 000 m) are brought back within range; th.isFar: minimum range of the maps whose far objects outside the fog (fog: false: dam peaks, silhouettes and touge halo) exceed 1.5 × the fog
      if (far !== cam.far) { cam.far = far; cam.updateProjectionMatrix(); }
      sky.position.copy(cam.position); sky.scale.setScalar(kf); sunDisc.position.copy(cam.position).addScaledVector(SD, 2000 * kf); sunDisc.scale.set(TH.orb.imgSize * kf, TH.orb.imgSize * kf, 1); }
    headlightsV = Math.max(TH.headlights, (TH.headlightsHaze || 0) * kBr); nightV = headlightsV / 2.6;
    if (veilHaze) { veilHaze.visible = kBr > 0.01; veilHaze.position.copy(cam.position); veilHaze.material.opacity = Math.min(1, kBr * 1.6); veilHaze.material.color.copy(scene.fog.color); } // th.haze: a bank of fog over part of the track layout
    skyMat.color.copy(WHITE).lerp(FOG_IN, TH.tun && TH.tun.skyDay ? 0 : lm); // th.tun.skyDay: the sky keeps its colour under the tunnel (daylight is seen through the mouth and the openings)
    const fl = flashT > 0 && lm < 0.5 ? ((flashT * 14 | 0) & 1 ? 1 : 0.3) : 0;
    { const night = lm * (1 - (TH.tun && TH.tun.day || 0)); hemi.intensity = Math.PI * (TH.hemi[2] * (1 - 0.75 * night) + 3 * fl); sun.intensity = Math.PI * TH.sun[1] * (1 - night); } // th.tun.day: share of daylight kept under the tunnel (open cave: what is seen through the portals and wells stays in the sun) // × π: three r155+ no longer has "inherited" intensities // in a tunnel, sky and orb fade: only the fixtures remain skyMat.color.multiplyScalar(1 + 2.5 * fl); scene.fog.color.lerp(FLASH, 0.45 * fl);
    beams.forEach((b, i) => b.rotation.set(0, Math.atan2(cam.position.x - b.position.x, cam.position.z - b.position.z), Math.sin(now * 0.0004 * (i % 3 + 1) + i) * 0.5)); // the spotlight beams face the camera
    // dynamic light: headlights, the car's shadow box, reflections, then the list of fixtures
    const cp = Math.cos(pitch);
    const dmgP = G.userData.dmgP, hs = (dmgP.ph[0] - dmgP.ph[1]) * 0.55; // one headlight broken: the beam comes from the other, at half strength; both: nothing
    LUX.uCam.value = cam.position; LUX.uHP.value.set(car.x + fx * 1.9 - fz * hs, carY + 0.62, car.z + fz * 1.9 + fx * hs); LUX.uHD.value.set(fx * cp, Math.sin(pitch), fz * cp); LUX.uHC.value.copy(HCB).multiplyScalar(headlightsV * (1 - (dmgP.ph[0] + dmgP.ph[1]) / 2));
    if (cones) { cones.visible = kBr > 0.02; cones.material.opacity = 0.14 * kBr * (1 - (dmgP.ph[0] + dmgP.ph[1]) / 2); cones.position.copy(LUX.uHP.value); cones.rotation.set(0, Math.atan2(fx, fz), 0); }
    G.updateMatrixWorld(); boxM.copy(G.matrixWorld).multiply(BOX).invert().toArray(LUX.uBox.value, 0); let nb = 1; // G: the view's car model, first shadow box; the two nearest cars follow (below)
    LUX.uSunC.value.copy(SUNC).multiplyScalar(1 - lm); LUX.uSky.value.copy(scene.fog.color); LUX.uRes.value.set(TRB ? vu.rw / 2 / TRB : 0, RH / 2 / TRB);
    let nl = 0;
    const LP = LUX.uLP.value, LC = LUX.uLC.value, put = (x, y, z, c, r, k) => { if (nl < NL) { const m = k * BRIGHT_GAIN; const o = nl * 4; LP[o] = x; LP[o + 1] = y; LP[o + 2] = z; LP[o + 3] = r; LC[nl * 3] = c.r * m; LC[nl * 3 + 1] = c.g * m; LC[nl * 3 + 2] = c.b * m; nl++; } };
    put(car.x - fx * 4.4, carY + 0.35, car.z - fz * 4.4, RED, -9, nightV * (inp.brake || car.frA ? 2.4 : 0.45) * (1 - (dmgP.fe[0] + dmgP.fe[1]) / 2)); // rear lights (minus the broken ones): they tint what follows, more so when braking
    if (L.neon) put(car.x, carY + 0.3, car.z, NEONC, -5.5, nightV * (0.8 + 0.4 * pulse)); // underbody neon
    // brief bursts, three slots at most taken from the fixed fixtures: the spark spray against a wall (orange, fades out in 0.2 s; placed between the body and the wall: inside the car's shadow box it would light nothing, behind the wall it would face away from its face; above the roof, the body does not hide the road), the nitro flame (blue, flickers), the storm flash (falls from above, covers everything)
    vu.ec = Math.max((vu.ec || 0) - dt * 5, vu.hit > 3 ? 1.5 : car.rub && sp > 8 ? 0.8 + 0.4 * Math.random() : 0);
    if (vu.ec > 0) { const s = S[car.idx], sg = Math.sign(car.d); const o = ENCt.z / 2 + 0.1; put(car.x - s.tz * sg * o, carY + 1.6, car.z + s.tx * sg * o, ETIN, 12, vu.ec * 4 * (0.5 + nightV)); }
    // car lights (rear, neon, nitro): without the shadow box. Low and very close to it, they projected it as crisp rectangles onto the road and the walls around (especially the nitro while drifting, the box sideways)
    if (car.boost > 0) put(car.x - fx * 3.2, carY + 0.45, car.z - fz * 3.2, BLUE, -10, 2.5 * (0.5 + nightV) * (0.8 + 0.4 * Math.random()));
    if (fl) put(car.x + 30, carY + 70, car.z - 20, FLASH, 140, 2.2 * fl);
    // the two nearest vehicles (opponents, or traffic trucks): headlights in front, red lights behind
    const d2 = c => (c.x - car.x) ** 2 + (c.z - car.z) ** 2;
    const veh = race ? race.cars.filter(c => c !== car && !portion(c)) : M.traffic && state !== 'title' ? traffic(T, tTraffic).slice() : [];
    let nf = 0; veh.forEach(c => { if (d2(c) < 1600) return; const i = nf++, ax = Math.cos(c.th), az = Math.sin(c.th), k = c.lane === undefined, ar = k ? ENCt.x / 2 + 0.05 : 6.5, l = k ? ENCt.z / 2 - 0.3 : 1; // on the rear of the body, or of the trailer
      for (const s of [-1, 1]) lightsP.set(tmp.set(c.x - ax * ar - az * l * s, c.y + (k ? 0.7 : 1.3), c.z - az * ar + ax * l * s).lerp(cam.position, 0.01).toArray(), i * 6 + (s + 1) * 1.5); }); // 1 % towards the camera: from afar, depth no longer tells the light from the body
    lightsGeo.setDrawRange(0, nf * 2); lightsGeo.attributes.position.needsUpdate = true;
    lights.material.size = (TH.headlightsHaze ? 1 + 0.6 * kBr : 1) * 0.5 / Math.tan(vu.cam.fov * Math.PI / 360) * RH / renderer.domElement.height * renderer.getPixelRatio(); // three.js measures points on the canvas (0.5 × its height / distance); we draw into the view's target, RH lines
    for (const c of veh.sort((a, b) => d2(a) - d2(b)).slice(0, 2)) {
      const ax = Math.cos(c.th), az = Math.sin(c.th), y = c.y, av = c.lane === undefined ? 6.5 : 10, ar = c.lane === undefined ? 3.4 : 7; // a truck is longer
      if (c.lane === undefined) { const g = model(c); g.updateMatrixWorld(); boxM.copy(g.matrixWorld).multiply(BOX); }
      else boxM.makeRotationY(-c.th).setPosition(c.x + ax * 1.5, y + 1.9, c.z + az * 1.5).scale(tmp.set(8.3, 1.9, 1.3)); // a truck: 16.6 m long between its lights (10 m ahead, 7 behind), 3.8 high
      boxM.invert().toArray(LUX.uBox.value, 16 * nb++); // its shadow box, under the fixtures and in the view's headlights
      const dv = c.lane === undefined ? model(c).userData.dmgP : null, kp = dv ? 1 - (dv.ph[0] + dv.ph[1]) / 2 : 1, kf = dv ? 1 - (dv.fe[0] + dv.fe[1]) / 2 : 1; // its headlights and broken lights
      put(c.x + ax * av, y + 0.8, c.z + az * av, HEADLIGHT, 14, 3 * nightV * kp); put(c.x - ax * ar, y + 0.7, c.z - az * ar, RED, 9, (c.lane === undefined && model(c).userData.fr ? 2.4 : 1.4) * nightV * kf);
      if (L.neon && race && (c.k < 0 || c.k >= 3)) put(c.x, y + 0.3, c.z, NEONC, 5.5, nightV * (0.8 + 0.4 * pulse)); // the other player's car keeps its underbody neon (c.k: -1 player 1, 3 player 2)
    }
    // fixed fixtures: the nearest along the track (those ahead count double), faded at the end of the list so that none lights up all at once
    if (car.idx !== vu.brightIdx) { vu.brightIdx = car.idx; for (const e of vu.brights) { let d = (e.l.i - car.idx + N) % N; if (d > N / 2) d -= N; e.d = d > 0 ? d * 0.5 : -d; } vu.brights.sort((a, b) => a.d - b.d); } // the sort only changes from one track sample to the next
    const LS = vu.brights, ns = NL - nl, dm = LS.length > ns ? LS[ns].d : 1e9;
    for (let k = 0; k < ns && k < LS.length; k++) { const e = LS[k], l = e.l; put(l.x, l.y, l.z, l.c, l.r, Math.min(1, (dm - e.d) / (dm * 0.3 + 0.01)) * (l.tun && TH.alarm ? 0.5 + pulse : 1)); }
    LUX.uN.value = nl; LUX.uNB.value = nb;
    // rain: each drop recedes at the car's speed, its streak stretches by as much
    const NG = TH.snowSurf || 0, pl = (NG || rainAt(car.idx)) * (1 - lm), gl = NG ? 0.2 : 1.9 * Math.max(1, 0.4 + 0.6 * pl), nr = Math.min(RN, Math.round(400 * pl ** 1.5)); rain.visible = pl > 0.02; splash.visible = !NG && rain.visible; // th.snowSurf = strength of the flakes: the same particles, falling at 4 m/s, with no impact or rain noise
    rainGeo.setDrawRange(0, 2 * nr); rain.position.set(car.x, carY, car.z); RU.uOp.value = Math.min(1, 0.6 + 0.15 * pl);
    // cumulative offset of the view, kept within the cube's period (80 m, 30 m high): the shader derives each drop's place from it
    rainO[0] = (rainO[0] + car.vx * dt) % 80; rainO[1] = (rainO[1] + (NG ? 4 : 55) * dt) % 30; rainO[2] = (rainO[2] + car.vz * dt) % 80;
    RU.uO.value.fromArray(rainO); RU.uV.value.set(car.vx, 0, car.vz); RU.uF.value.set(fx, fz); RU.uGl.value = gl;
    // lit rain: at night, a streak is only really visible near a fixture (the 8 nearest along the track) or in the headlight beam; elsewhere it stays dark
    RU.uAmb.value = NG ? 1 : 1 - 0.75 * Math.min(1, nightV); RU.uHph.value = 0.35 * Math.min(1, nightV); let nlr = 0; const RL = RU.uRL.value, RC = RU.uRC.value;
    if (rain.visible) for (let k = 0; k < 8 && k < vu.brights.length; k++) { const l = vu.brights[k].l, x = l.x - car.x, z = l.z - car.z, R = l.r * 0.6; if (x * x + z * z > 2500) continue;
      RL[nlr * 4] = x; RL[nlr * 4 + 1] = l.y - carY; RL[nlr * 4 + 2] = z; RL[nlr * 4 + 3] = 1 / (R * R); RC[nlr * 3] = l.c.r; RC[nlr * 3 + 1] = l.c.g; RC[nlr * 3 + 2] = l.c.b; nlr++; }
    RU.uNL.value = nlr;
    const ns2 = Math.min(SN, Math.round(SN * pl / 3)); splGeo.setDrawRange(0, ns2);
    for (let i = 0; i < ns2; i++) { // an impact lives 0.14 s on the road, from 4 to 40 m ahead, then reappears elsewhere; it bursts bright and fades out
      if ((splA[i] += dt) > 0.14) { splA[i] -= 0.14; const j = 2 + Math.floor(rand() * 18), s = S[(car.idx + j) % N], l = (rand() * 2 - 1) * W; splP.set([s.x - s.tz * l, s.y + 0.06, s.z + s.tx * l], i * 3); splD[i] = 1 - j / 24; } // in the distance, the impact is paler
      const f = (1 - splA[i] / 0.14) ** 2 * splD[i]; splC[i * 3] = 0.45 * f; splC[i * 3 + 1] = 0.6 * f; splC[i * 3 + 2] = 0.75 * f;
    }
    splGeo.attributes.position.array = splP; // this view's impacts: same GPU buffer, sent back before each draw
    splGeo.attributes.position.needsUpdate = splGeo.attributes.color.needsUpdate = true;

    // corner alert: only a corner tight for the current speed (alertCorner, sim.js)
    // and sharp ice (T.surf, corner > 0.4) arriving within the next 3.6 s, when we are not there yet: without it, a patch was a surprise. Both state the remaining distance (2 m per sample)
    const iceSurf = j => !!T.surf && T.surf[(car.idx + j) % N].corner > 0.4, D = Math.round(sp * 0.6); let overIce = 0; if (state === 'race' && sp > 15 && !iceSurf(0)) for (let j = 1; j < 3 * D && !overIce; j++) if (iceSurf(j)) overIce = 2 * j;
    if (!ST) { // light rays: the orb, the headlights of the nearest vehicle if they face us; stronger in rain, in haze and in a tunnel
      cam.updateMatrixWorld(); const RY = post.uniforms.ray.value, RC = post.uniforms.rayC.value, haze = RAYS * Math.min(1, Math.max(0.5 * Math.min(1, pl), 600 / TH.fogD[1], 0.3 * lm)), th = Math.tan(cam.fov * Math.PI / 360); let n = 0;
      const src = (x, y, z, col, k, rw) => { // rw: radius of the halo around the source, in m (0: the orb, at infinity)
        const dc = cam.position.distanceTo(tmp.set(x, y, z)); if (n > 3 || k < 0.01 || (rw && dc > 90)) return false;
        tmp.lerp(cam.position, rw ? Math.min(0.5, 1.5 / dc) : 0).project(cam); // 1.5 m towards the camera: the lantern does not hide its own light
        if (tmp.z > 1 || Math.abs(tmp.x) > 1.4 || Math.abs(tmp.y) > 1.4) return false;
        const r = rw ? rw / (2 * dc * th) : 0.08; RY[n].set(tmp.x * 0.5 + 0.5, tmp.y * 0.5 + 0.5, tmp.z * 0.5 + 0.5, 1 / (r * r)); RC[n++].copy(col).multiplyScalar(k); return true; };
      if (TH.orb.imgSize > 1) { const p = cam.position; src(p.x + SD.x * 1800, p.y + SD.y * 1800, p.z + SD.z * 1800, ORB, 1.3 * RAYS * TH.sun[1] * (1 - lm) * (TH.orb.spokes ?? 1), 0); } // th.orb.spokes: strength of the orb's halo (1 by default) // anything within 1 800 m hides the orb; the sky (2 500 m), not
      const c = veh[0]; if (c && Math.cos(c.th) * (cam.position.x - c.x) + Math.sin(c.th) * (cam.position.z - c.z) > 0) { const av = c.lane === undefined ? 6.5 : 10; src(c.x + Math.cos(c.th) * av, c.y + 0.8, c.z + Math.sin(c.th) * av, HEADLIGHT, haze * nightV, 2); }
      for (; n < 4; n++) RC[n].setScalar(0);
    }
    drawHUD(vu, dt, sp, state === 'race' ? alertCorner(T, car.idx, sp) || (overIce && { iceSurf: overIce }) : 0);
    const U = post.uniforms; U.t.value = (vu.rs || vu.rt).texture; U.h.value = vu.hudT; if (U.dz) U.dz.value = vu.rt.depthTexture; U.px.value.set(AA * KL / vu.rw, AA * KL / RH); post.uniforms.vig.value = 0.6 * nitE + 1.3 * rv * rv; // vignette tightened by speed and nitro; the final pass is shared: its inputs are those of the view
    // speed blur: nothing below 130 km/h, it then rises to the peak; the chromatic aberration follows
    post.uniforms.amt.value = 1.1 * rv * rv; post.uniforms.ab.value = 0.002 + 0.016 * rv * rv + (stun > 0 ? stun * 0.04 : 0);
    // drops on the lens (see AIR): rain leaves them, not snow; they slide, then the race wind pulls them up while stretching them, and beyond M.spd[0] it chases them off
    const gt = vu.gt || (vu.gt = Array.from({ length: 8 }, () => ({ x: 0, y: 0, r: 0, a: 0, vitality: 0 }))), ve = Math.min(1, sp / V0), chase = clamp((sp - V0) / (V1 - V0), 0, 1), pg = NG ? 0 : Math.max(pl, embAt(car.idx));
    for (let i = 0; i < 8; i++) { const g = gt[i], u = U.gt.value[i];
      if (g.a >= g.vitality) { u.z = 0; if (pg > 0.02 && i < 6 && Math.random() < dt * 0.9 * pg * (1 - 0.6 * chase)) Object.assign(g, { x: Math.random(), y: 0.15 + 0.85 * Math.random(), r: 0.004 + 0.006 * Math.random(), a: 0, vitality: 2 + 4 * Math.random() }); else continue; }
      g.a += dt; g.y += dt * (-0.015 + 0.12 * ve * ve + 1.6 * chase); if (g.y > 1.15 || g.y < -0.1) g.a = g.vitality;
      u.set(g.x, g.y, g.r * Math.min(1, (g.vitality - g.a) * 2, g.a * 8), 1 + 1.5 * ve * ve + 1.5 * chase); // appears fast, evaporates while shrinking
    }
    if (!hotList) { // first frame: everything is drawn once without visibility sorting, so that shaders, geometries and textures go to the GPU now and not at the first pass in a race (40 ms stutters)
      hotList = true; const caches = [], triIdx = [];
      scene.traverse(o => { if (!o.visible) { caches.push(o); o.visible = true; } if (o.frustumCulled) { triIdx.push(o); o.frustumCulled = false; } });
      const warm = new THREE.WebGLRenderTarget(8, 8, { type: vu.rt.texture.type }), previous = renderer.getRenderTarget();
      try { renderer.setRenderTarget(warm); renderer.render(scene, cam); }
      finally { renderer.setRenderTarget(previous); warm.dispose(); for (const o of caches) o.visible = false; for (const o of triIdx) o.frustumCulled = true; }
    }
    // the scene matrices once for the view's three renders (reflections, moving shadows, scene): each one recomputed them all
    wheelsInst(); scene.updateMatrixWorld(); scene.matrixWorldAutoUpdate = false; if (!vu.n && !(vu.shadows && vu.shadows.cacheKey !== stepL)) refFace(); // not in the frame where the fixed scenery's shadow is redone (see shadows): the slice moves to the next frame
    shades(vu, stepL, car, carY);
    if (sceneryTick && sceneryTick.liveFeed && !vu.n) sceneryTick.liveFeed(renderer); // a scenery screen that shows the live race (stadium): its capture, before the scene that shows it
    renderer.setRenderTarget(vu.rt); renderer.render(scene, cam); scene.matrixWorldAutoUpdate = true;
    if (vu.rs) { const R = ssr.uniforms; R.t.value = vu.rt.texture; R.dz.value = vu.rt.depthTexture; R.P.value.copy(cam.projectionMatrix); R.Pi.value.copy(cam.projectionMatrixInverse); R.up.value.set(0, 1, 0).transformDirection(cam.matrixWorldInverse); R.px.value.set(1 / vu.rw, 1 / RH); renderer.setRenderTarget(vu.rs); renderer.render(ssrScene, postCam);
      FALLBACK.rDz.value = vu.rt.depthTexture; FALLBACK.rRes.value.set(vu.rw, RH); renderer.autoClear = false; renderer.render(fallbackScene, cam); renderer.autoClear = true; }
    { const OE = TH.eye || {}, EYE_BLACK = OE.blackM ?? EYE_N, EYE_PALE = OE.clair ?? EYE_C, real = Math.log(1 - (1 - (OE.tun ?? TUN)) * lm), outTarget = real - Math.log(T.tun && TH.tun.shard || 1) * lm; // the eye: true = log of the true light; th.tun.shard: the eye adapts to a tunnel lighter than its paint
      vu.eye += (outTarget - vu.eye) * (1 - Math.exp(-dt / (outTarget > vu.eye ? EYE_PALE : EYE_BLACK))); U.ex.value = Math.min(Math.exp(real - vu.eye), Math.max(1.6, T.tun && TH.tun.shard || 1)); } // glare at most ×1.6
    if (vu.hb) { U.hb.value = vu.hb.texture; renderer.setRenderTarget(vu.hb); renderer.render(haloScene, postCam); }
    renderer.setRenderTarget(null);
    if (COM) { const [cols, rows] = grid(VIEWS.length), x = (vu.n % cols) * vu.w, y = (rows - 1 - (vu.n / cols | 0)) * HH; renderer.setViewport(x * KL, y * KL, vu.w * KL, HH * KL); renderer.setScissor(x * KL, y * KL, vu.w * KL, HH * KL); } // two players: the view's final pass in its band (y counted from the bottom: player 1 at the top); the shader does not change, its blur centre and vignette are relative to the band
    renderer.render(postScene, postCam);
  }
  let hotList = false;
  let raf = 0;
  let previewAt = 0;
  const menuSound = { state: 'title', T, car: null, r: 0, sp: 0, gas: 0, rpm: 0.3, load: 0, spool: 0, hit: 0, bump: 0, tun: 0, amb: 0, otherCars: [] };
  const loop = now => {
    raf = requestAnimationFrame(loop);
    if (preparingRace && state === 'title') { GAME_LOADER.menuHide(); UI.hide(); return; }
    if ((state === 'title' || state === 'pause') && !AUTO && !ST) {
      last = Math.max(last, now);
      for (const c of PER.poll({ menu: true, home, two: two() })) command(c);
      if (ins) inscription(); else if (two()) gamepads2();
      if (state === 'title' || state === 'pause') {
        menuSound.state = state; menuSound.car = VIEWS[0].self; SOUND.frame(state === 'pause' ? 0 : 1 / 60, menuSound);
        if (uiFrame()) { GAME_LOADER.menuHide(); return; }
        const cv = COM ? COM.c : VIEWS[0].hudC; hg = COM ? COM.g : VIEWS[0].hg; hg.clearRect(0, 0, cv.width, cv.height); screens(cv.width);
        GAME_LOADER.menuFrame(outTarget || M, cv); return;
      }
    }
    GAME_LOADER.menuHide();
    if (window.__mapBuilding && state === 'title' && now - previewAt < 1000 / 24) return;
    previewAt = now; frame(now); GAME_LOADER.previewFrame(M.id, renderer.domElement, COM && COM.c); uiFrame();
  };
  // stop (map change): no more loop or listeners; then frees() gives back to the GPU everything this map put there (the shaders, for their part, stay with the renderer as long as a material uses them)
  const ending = () => { cancelAnimationFrame(raf); halt.abort(); clearTimeout(padNoteT); padNote.remove(); if (COM) COM.c.remove(); };
  const frees = () => {
    for (const sc of [scene, fallbackScene]) sc.traverse(o => { if (o.geometry) o.geometry.dispose(); for (const m of [].concat(o.material || [])) { for (const k of ['map', 'emissiveMap', 'alphaMap', 'specularMap']) if (m[k]) m[k].dispose(); m.dispose(); } });
    VIEWS.forEach(renderView); CUBE.dispose(); refRT.dispose(); post.dispose(); ssr.dispose(); quad.geometry.dispose(); if (sun.shadow.map) sun.shadow.map.dispose();
  };
  // arrival on this map (first display or return): what the previous map left in sessionStorage
  const arrival = () => {
    try { const m = sessionStorage.getItem('vpr.menu'); if (m) { msel = 0; sessionStorage.removeItem('vpr.menu'); enter(); SOUND.reprendre(JSON.parse(m)); } } catch (e) { } // the menu music resumes where it was // we have just changed map: we stay on this line, without going back through the home screen (the browser generally keeps the right to sound from one page to the next; otherwise it comes back at the next key press)
    try { if (sessionStorage.getItem('vpr.go')) { const g = sessionStorage.getItem('vpr.go'); sessionStorage.removeItem('vpr.go'); if (mode === 'tourAll' || g === '2') start(); } } catch (e) { } // arrival on the map of a Championship round, or via DEMARRER in the menu: the race starts right away
    try { const d = sessionStorage.getItem('vpr.demo'), f = sessionStorage.getItem('vpr.demoFin'); sessionStorage.removeItem('vpr.demo'); sessionStorage.removeItem('vpr.demoFin');
      if (d) demoLaunch(JSON.parse(d)); else if (f === 'a') home = true; } catch (e) { } // demo: next map of the night, or back to the original map (to the home screen if we came from there)
    if (NET.role) { NET.ev = onNet; let g = null; try { g = sessionStorage.getItem('vpr.netgo'); sessionStorage.removeItem('vpr.netgo'); } catch (e) { } // map changed online: this file has just been replayed, the lounge (network.js) stayed
      if (g) { choice = false; start(true); } else if (guest()) waiting(); }
  };
  // standby: the map stays built (scene, textures and shaders on the GPU) but no longer draws or listens; resume: it returns to the menu, in the state of a brand-new map
  const wakeup = () => { active = false; cancelAnimationFrame(raf); padNote.style.display = 'none'; if (COM) COM.c.style.display = 'none'; for (const k in keys) keys[k] = 0; };
  const resumes = () => {
    const av = window.__g; if (av && av !== api) (av.wakeup || av.ending)();
    active = true; preparingRace = false; window.__g = api; window.MAP_DEF = M; PER.seek(); // Joy-Con allowed since this map was built (home screen window, opened by another instance): without this, it would never see it
    if (state !== 'title') toMenu(); home = true; aMenu = false; choice = false; msel = 5; outTarget = null; demo = null; enl = null; ins = false; inactive = 0; // like a brand-new map
    language = pref('vpr.langue', 'en') === 'fr' ? 'fr' : 'en'; applyLanguage(); manual = pref('vpr.boite', 'a') === 'm'; VIEWS[0].self.manual = manual; // the settings may have changed on another map
    { const n = +(Q.get('players') || pref('vpr7.joueurs', '1')); players(n > 1 && !CHALLENGE_DEF && !NET.role ? n : 1); }
    if (COM) COM.c.style.display = '';
    arrival(); resize(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
  };
  // Catalogue downloads are cached; serialize construction because all map instances share one WebGL renderer.
  const built = c => {
    const E = window.__inProgress || (window.__inProgress = {});
    if (!E[c.id]) {
      const job = (window.__buildQueue || Promise.resolve()).then(async () => {
        await GAME_LOADER.mapScripts(c);
        if (window.__wanted !== c.id) { delete E[c.id]; return null; }
        window.__mapBuilding = c.id;
        try { return await launchGame(c, true); } finally { window.__mapBuilding = null; }
      });
      E[c.id] = job; window.__buildQueue = job.catch(() => {});
      job.catch(() => { delete E[c.id]; });
    }
    return E[c.id];
  };
  const api = { get scenery() { return { dz: MDZ, obj: OBJ, showMarks: mi, beg: DEBRIS.length, twists: wallTwists, mark, pane: w => pane(carG, w, 0, 0), oil: hi, dirty: [carG, ...opps].map(g => +dirtyDe(g).n.toFixed(2)) }; }, wakeup, resumes, get enl() { return enl; }, get demo() { return demo; }, get inactive() { return inactive; }, frame, start, ending, frees, players, places: PLACES, get ins() { return ins; }, get com() { return COM; }, get menu() { return { id: (outTarget || M).id, row: msel, pauseRow: psel, choiceRow: csel, choice, mode, diff, manual: manual1(), preparing: preparingRace, step: mstep, pick: mpick, opt: mrow, opts: optRows().length }; }, mapDef: id => { outTarget = MAPS.find(m => m.id === id); if (state === 'title' && !AUTO && !ST) { window.__wanted = outTarget.id; setPref('vpr.carte', outTarget.id); } else changeMap(); }, get tnEnd() { return ses.tnEnd; }, get challenge() { return { CHALLENGE_DEF, challengeErr, lastIdx: ses.lastIdx }; }, get ghostRun() { return { label: labelF(), visible: ghostM.visible, colour: ghostM.material.color.getHexString(), x: ghostM.position.x, z: ghostM.position.z }; }, M, T, scene, cam: VIEWS[0].cam, views: VIEWS, renderer, LUX, get race() { return race; }, get mode() { return mode; }, keys, ambAt, nearS, get home() { return home; }, get car() { return VIEWS[0].self; }, get state() { return state; }, get t() { return ses.tRace; }, get ac() { return SOUND.ac; }, get out() { return SOUND.out; }, get smp() { return SOUND.smp; }, damage: x => { for (const g of [carG, ...opps]) { const D = g.userData.dmgP; D.z0 = [1, 1, 1, 1]; for (const [a, b, i] of [[1, 0, 0], [-1, 0, 1], [0, -1, 2], [0, 1, 3]]) for (let k = 0; k < 60 && D.z[i] < x - 0.01; k++) dmgImpact(g, a, b, 12); } } }; // instance of the map (and test handle, on window.__g when it is displayed); damage(x): each zone of each car damaged to x (captures)
  if (/[?&]hitbox\b/.test(location.search)) import('./hitbox.js').then(h => h.watch(THREE, T, scene)); // debug: collision limits in transparent red
  if (backdrop) { // Upload every resource once, but rasterize only 8 × 8 pixels instead of the full menu with all culling disabled.
    await whoosh(); const vu = VIEWS[0], caches = [], triIdx = [];
    scene.traverse(o => { if (!o.visible) { caches.push(o); o.visible = true; } if (o.frustumCulled) { triIdx.push(o); o.frustumCulled = false; } });
    const warm = new THREE.WebGLRenderTarget(8, 8, { type: vu.rt.texture.type }), previous = renderer.getRenderTarget();
    try { renderer.setRenderTarget(warm); renderer.render(scene, vu.cam); }
    finally { renderer.setRenderTarget(previous); warm.dispose(); for (const o of caches) o.visible = false; for (const o of triIdx) o.frustumCulled = true; }
    hotList = true; // The first displayed frame must not upload and draw the entire scene a second time.
  }
  (window.__maps || (window.__maps = {}))[M.id] = api; (window.__inProgress || (window.__inProgress = {}))[M.id] = Promise.resolve(api);
  if (!backdrop) resumes();
  return api;
};
