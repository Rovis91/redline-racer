// Ville à plein régime — rendu, effets, HUD, commandes et boucle de jeu. La piste et la physique sont dans sim.js.
// Plan du fichier (chercher « // ---------- ») : rendu et passe finale · les trois entités du décor (textures.js, formes.js, placement) · piste · ville · horizon · voiture et effets ·
// état de jeu et commandes · HUD · boucle. Voir README.md pour savoir où régler quoi.
(window.lanceJeu = async (CARTE = window.CARTE, fond = false) => {
  // Une instance par carte, gardée en mémoire (window.__cartes) : changer de carte affiche une instance déjà construite (veille / reprend), sans rien reconstruire.
  // Une carte pas encore vue se construit en fond (fond = true), par morceaux (await souffle()) pour que la carte affichée continue de tourner, puis reprend() l'affiche.
  // Sans fond (premier chargement de la page), tout se fait d'un trait, comme avant : __g existe dès la fin du script (rythme.js s'en sert).
  const souffle = () => new Promise(r => { const c = new MessageChannel(); c.port1.onmessage = r; c.port2.postMessage(0); }); // pas setTimeout : bridé à 1 par seconde en arrière-plan
  let actif = false; // seule l'instance affichée écoute clavier, souris et fenêtre
  const arret = new AbortController(), addEventListener = (ev, f) => window.addEventListener(ev, e => { if (actif) f(e); }, { signal: arret.signal }); // tous les écouteurs de ce fichier tombent d'un coup à l'arrêt
  { // essai des options de carte sans toucher à cartes.js : ?opt={"th":{"lisse":["eau"]}} fusionné dans la carte (voir docs/MOTEUR-OPTIONS-CARTES.md) ; outil de revue, rien n'est gardé
    const o = new URLSearchParams(location.search).get('opt'), fu = (a, b) => { for (const k in b) a[k] = b[k] && b[k].constructor === Object && a[k] && a[k].constructor === Object ? fu({ ...a[k] }, b[k]) : b[k]; return a; };
    if (o) CARTE = fu({ ...CARTE }, JSON.parse(o));
  }
  const T = buildTrack(THREE, CARTE), CARD = T.car, S = T.S, N = T.n, W = T.W, V3 = THREE.Vector3, M = CARTE, TH = M.th; // carte active et son thème : voir cartes.js
  const lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
  const AUTO = location.search.includes('auto'); // debug : le pilote auto conduit
  // 0 hors du secteur, 1 dedans, rampes linéaires de `ramp` échantillons (2 m) avant l'entrée / après la sortie
  const span = (a0, a1, on) => (i, ramp) => { if (!on) return 0; const a = (i - a0 + N) % N, L = a1 - a0; return a < L ? 1 : Math.max(0, 1 - (a - L) / ramp, 1 - (N - a) / ramp); };
  const zone = span(T.t0, T.t1, T.tun), hot = span(T.h0, T.h1, true); // zone = tunnel (lumière, décor) ; hot = secteur chaud (musique)
  // zones d'ambiance sonore (champ amb de la carte, entre deux points du tracé) : 0 dehors, 1 dedans, fondu de 120 m à l'entrée et à la sortie
  const nearS = p => { let b = 0, bd = 1e18; for (let i = 0; i < N; i++) { const d = (S[i].x - p[0] * M.sc) ** 2 + (S[i].z - p[1] * M.sc) ** 2; if (d < bd) { bd = d; b = i; } } return b; };
  const ambZ = (M.amb || []).map(([a, b]) => span(nearS(M.pts[a]), nearS(M.pts[b]), true)), ambAt = i => Math.max(0, ...ambZ.map(z => z(i, 60)));
  // th.embruns : [[point a, point b, force], …] : entre ces points du tracé, des gouttes se posent sur l'objectif comme sous la pluie (les embruns d'une chute, d'une rivière) ; absent : rien
  const embZ = (TH.embruns || []).map(([a, b, k]) => [span(nearS(M.pts[a]), nearS(M.pts[b]), true), k]), embAt = i => Math.max(0, ...embZ.map(([z, k]) => k * z(i, 30)));
  // brouillard par zone (th.brume : [[point a, point b, début, fin en mètres], …]) : entre ces deux points du tracé, le brouillard de la carte se resserre, fondu de 180 m à l'entrée et à la sortie (docs/MOTEUR-OPTIONS-CARTES.md)
  const brumeZ = (TH.brume || []).filter(z => z.length > 3).map(([a, b, n0, n1]) => [span(nearS(M.pts[a]), nearS(M.pts[b]), true), n0, n1]);
  const chevSauf = (TH.chevSauf || []).map(([a, b]) => span(nearS(M.pts[a]), nearS(M.pts[b]), true)); // th.chevSauf : [[point a, point b], …], pas de panneaux de virage entre ces points du tracé
  // pluie (thème) : force par échantillon calculée dans sim.js (T.pluie : zones [point a, point b, force], fondu de 120 m) ; coupée en tunnel au dessin
  const pluieAt = i => T.pluie[i];
  let tTraf = 0; // temps écoulé depuis le départ : horloge du trafic
  let seed = 7;
  const rnd = () => { seed = seed * 1664525 + 1013904223 >>> 0; return seed / 4294967296; };

  // ---------- réglages de la lumière et du rendu rétro (tout se règle ici) ----------
  const NL = 20;        // luminaires calculés en même temps autour de la voiture (coût par pixel)
  const LUM_GAIN = 0.75;   // force de tous les luminaires, phares compris
  const LUM_PAS = 5;    // tunnels : un luminaire tous les LUM_PAS échantillons (2 m), en quinconce gauche / droite
  const QUANT = 32;     // passe finale : niveaux par canal (une console 15 bits en a 32) ; 0 = pas de quantification
  const TRAME = 0.8;     // force du tramage ordonné de Bayer, 0 à 1
  const TUN_AMB = 0.55; // tunnels : part de lumière ambiante sur sol, parois et plafond ; le reste vient des luminaires
  const LOIN = 1.3;     // distance de vue : le brouillard de chaque carte (cartes.js, fogD) et la portée des ombres reculent d'autant
  const TREMBLE = 0;    // tremblement des sommets façon première console 3D : pas de la grille en pixels, 0 = aucun

  // ---------- styles visuels à comparer : ?style=<nom> (sans paramètre : rendu actuel, inchangé) ; planche des captures dans styles.html ----------
  // h : lignes de la cible interne (0 = celles de l'écran) ; z : la passe lit la profondeur (contours) ; tremble / affine : sommets et textures façon console 32 bits
  // pre / fx / fin : GLSL de la passe finale — avant lecture (u = coordonnée), sur la couleur c de la scène, puis après le HUD. Aucun flou, aucun halo.
  const STYLES = {
    fin: { h: 540, fx: 'c = floor(c * 64. + bayer(v / px) * .35 + .5) / 64.;' },
    net: { h: 0, brut: 1 }, // la scène et le HUD, rien d'autre : pas même la vignette
    encre: { h: 0, z: 1, fx: 'c = aplat(pow(c, vec3(.72)), 6.) + .03; c *= 1. - .95 * smoothstep(.007, .018, arete(u, px * 1.5));' },
    demiteinte: { h: 540, fx: `float l = sqrt(lum(c)) * 3.2, i = min(floor(l), 2.); vec2 g = mat2(.707, -.707, .707, .707) * v * ecr / (ecr.y / 200.);
      float pt = smoothstep(-.08, .08, l - i - length(fract(g) - .5) * 1.414);
      vec3 enc = mix(i < .5 ? pal[0] : i < 1.5 ? pal[1] : pal[2], i < .5 ? pal[1] : i < 1.5 ? pal[2] : pal[3], pt);
      c = c.r - max(c.g, c.b) > .22 ? pal[4] * (.55 + .45 * pt) : enc;` },
    cathodique: { h: 360, pre: 'u = u * 2. - 1.; u *= 1. + .028 * u.yx * u.yx; u = u * .5 + .5;',
      fin: `c *= 1.45 * (1. - .55 * smoothstep(.22, .5, abs(fract(u.y / px.y) - .5)));
      c *= mix(vec3(.72), vec3(1.2), vec3(equal(vec3(mod(floor(v.x * ecr.x), 3.)), vec3(0., 1., 2.))));
      if (u != clamp(u, 0., 1.)) c = vec3(0.);` },
    console32: { h: 360, tremble: 1, affine: .3, fx: 'c = floor(c * 32. + bayer(v / px) * .5 + .5) / 32.;' },
    lisere: { h: 0, z: 1, fx: `float e = smoothstep(.007, .018, arete(u, px * 1.5)); c = aplat(c, 9.);
      c = mix(c, min(c * 2.6 + vec3(.1, .2, .26), 1.), e * (.4 + .6 * smoothstep(0., .012, W(u))));` },
  };
  // ingrédients à doser un par un, seuls ou par-dessus un style : ?lignes=540 (0 = écran) &aa=2 (suréchantillonnage, pas un flou) &lisse=1 (textures filtrées)
  // &niveaux=32&trame=.5 &contour=.9 (encre) &lisere=.8 &ombres=.5 (0 à 1, relève les sombres) &contraste=1.2 &affine=.3 &tremble=1 &flou=1&halo=1 (ceux du rendu actuel)
  const Q = new URLSearchParams(location.search), P = k => +Q.get(k) || 0, G = k => P(k).toFixed(3);
  const ING = ['lignes', 'aa', 'lisse', 'niveaux', 'trame', 'contour', 'lisere', 'ombres', 'contraste', 'affine', 'tremble', 'flou', 'halo'];
  const ST = STYLES[Q.get('style')] || ING.some(k => Q.has(k)) ? Object.assign({ h: 0 }, STYLES[Q.get('style')]) : null;
  if (ST) {
    for (const [k, c] of [['lignes', 'h'], ['affine', 'affine'], ['tremble', 'tremble']]) if (Q.has(k)) ST[c] = P(k);
    ST.aa = ST.h ? 1 : Math.max(1, Math.min(3, P('aa'))); // en pleine résolution seulement : agrandie, une cible lissée serait floue
    ST.z = ST.z || P('contour') || P('lisere'); const nv = P('niveaux') || (P('trame') ? 32 : 0);
    ST.fx = (P('flou') || P('halo') ? `{ vec2 c0 = vec2(.5, .42), dd = u - c0; float ll = length(dd); vec3 a = vec3(0.);
        for (int i = 0; i < 8; i++) a += texture2D(t, c0 + dd * (1. - amt * ${G('flou')} * ll * float(i) * .026)).rgb; c = a / 8.;
        for (int i = 0; i < 12; i++) { float an = float(i) * .5236, rr = 2. + 2.5 * mod(float(i), 3.); c += max(texture2D(t, u + vec2(cos(an), sin(an)) * rr * px).rgb - .5, 0.) * ${(P('halo') * TH.bloom).toFixed(3)}; } }` : '')
      + (ST.fx || '')
      + (P('ombres') ? `c = pow(c, vec3(${(1 - 0.5 * P('ombres')).toFixed(3)}));` : '')
      + (P('contraste') ? `c = clamp((c - .5) * ${G('contraste')} + .5, 0., 1.);` : '')
      + (nv ? `c = floor(c * ${nv.toFixed(1)} + bayer(v / px) * ${G('trame')} + .5) / ${nv.toFixed(1)};` : '')
      + (P('contour') ? `c *= 1. - ${G('contour')} * smoothstep(.007, .018, arete(u, px * 1.5));` : '')
      + (P('lisere') ? `c = mix(c, min(c * 2.6 + vec3(.1, .2, .26), 1.), ${G('lisere')} * smoothstep(.007, .018, arete(u, px * 1.5)));` : '');
  }
  // demi-teinte : quatre encres de la plus sombre à la plus claire, et une encre de signal (feux, néons rouges), par carte
  const PAL = { ville: [0x0a0614, 0x3a1a6a, 0xff3a8a, 0xfff0c8, 0xff2a3a], touge: [0x06100c, 0x1c4a3a, 0x7ab890, 0xfff2c8, 0xff5030], wangan: [0x060a16, 0x1a3a6a, 0xf0a040, 0xfff4d8, 0xff3030],
    paris: [0x100c14, 0x4a3a5a, 0xd89a70, 0xfff0d8, 0xe83a30], canal: [0x0c0a12, 0x5a2a4a, 0xf08a50, 0xfff0c0, 0xff3a40], stade: [0x0a0a14, 0x3a3060, 0xe8a030, 0xfff4d8, 0xe8362a], givre: [0x080e22, 0x2c4478, 0x8fb4e8, 0xf4f8ff, 0xe8482a], terre: [0x140c08, 0x6a3a1c, 0xe8903a, 0xfff0d0, 0xe8482a], perse: [0x141a3a, 0x5a3a78, 0xf08a3a, 0xfff0d0, 0xc8323c], barrage: [0x0e1012, 0x4a5a5a, 0xe8761e, 0xf4f0e0, 0xb5483c], chapada: [0x08140c, 0x1f5a2c, 0xe8b83a, 0xf2ecd0, 0xff5a3a], plage: [0x0a2a30, 0x0a7fa8, 0x19c7c9, 0xfff4e0, 0xff3d7f], essai: [0x06100c, 0x1c4a3a, 0x7ab890, 0xfff2c8, 0xff5030] }[M.id];

  // ---------- rendu basse définition : scène → cible 270p → passe finale (flou de vitesse, HUD, scanlines) ----------
  const renderer = window.__rendu || (window.__rendu = new THREE.WebGLRenderer({ antialias: false })); // un seul pour toute la session : il garde les shaders d'une carte à l'autre
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.BasicShadowMap;
  // three r152+ convertit les couleurs (sRGB ↔ linéaire) : tout le jeu est réglé à l'œil sans conversion, on la coupe pour garder la même image
  THREE.ColorManagement.enabled = false; renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  document.body.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  const FOG_OUT = new THREE.Color(TH.fog), FOG_IN = new THREE.Color(TH.tun ? TH.tun.fog : TH.fog), WHITE = new THREE.Color(0xffffff);
  scene.fog = new THREE.Fog(TH.fog, TH.fogD[0] * LOIN, TH.fogD[1] * LOIN);
  // th.brume = [[point a, point b, k], …] : entre ces points de contrôle, la portée du brouillard est multipliée par k (fondu sur 120 m) ; sans elle, rien ne change
  const BRUME = (TH.brume || []).some(z => z.length === 3) && (() => { const pi = k => { const [x, z] = M.pts[k]; let b = 0, bd = 1e18; S.forEach((q, i) => { const d = (q.x - x * M.sc) ** 2 + (q.z - z * M.sc) ** 2; if (d < bd) { bd = d; b = i; } }); return b; };
    const Z = TH.brume.filter(z => z.length === 3).map(([a, b, k]) => [pi(a), (pi(b) - pi(a) + N) % N, k]); return Float32Array.from({ length: N }, (_, i) => Z.reduce((f, [a, L, k]) => { const d = (i - a + N) % N, w = d < L ? 1 : Math.max(0, 1 - (d - L) / 60, 1 - (N - d) / 60); return Math.min(f, 1 - (1 - k) * w); }, 1)); })();
  // Une « vue » par joueur (une seule en solo) : tout ce qui est propre à une caméra. La scène, le renderer et le shader de la passe finale restent communs.
  // Chaque image, la simulation avance une fois ; puis, pour chaque vue, vueFrame() pose la caméra, règle lumière, brouillard et pluie, dessine son HUD, la scène dans sa cible, et joue sa passe finale.
  // Une vue de plus = un appel à nouvelleVue() (après la construction du décor : elle copie la liste des luminaires et le semis de pluie) ; libere() rend au GPU la cible et la texture de chacune.
  // Le nombre de vues est le nombre de joueurs : il se règle par joueurs(n), plus bas (retireVue() ôte la dernière). À deux, les vues sont superposées, joueur 1 en haut, chacune sur sa grille de 270 lignes : le canvas en fait 540.
  // Une vue est un joueur : sa place (rang n, périphérique, entrée de l'image, compte de tours, « arrivé »), sa voiture (moi) et son modèle animé (hu), plus ce que sa caméra regarde (car : moi, sauf éliminé à deux).
  // VUES[0] est le joueur 1 : VUES[0].moi est la voiture du jeu hors course (il n'y a pas d'autre variable « la voiture du joueur »).
  // th.mouilleVisible (1, ou une force) : les zones surf « mouille » se voient comme la pluie (MOT, reflets ssr), plus sombres. MV = force de pluie équivalente par échantillon (3 = SURF.mouille plein, comme dans sim.js)
  const MV = TH.mouilleVisible ? Float32Array.from(T.surf, q => 3 * (+TH.mouilleVisible) * Math.min(1, q.aq / 0.1)) : null, mouAt = i => MV ? Math.max(T.tun && (i - T.t0 + T.n) % T.n <= T.t1 - T.t0 ? 0 : T.pluie[i], MV[i]) : T.pluie[i]; // sous le tunnel, la pluie ne mouille pas le sol
  const SSR = T.pluie.some(p => p > 0) || !!MV && MV.some(p => p > 0); // carte où il pleut quelque part : chaque vue a sa profondeur et sa passe de reflets (ssr)
  const EAU = 0.5; // alpha de la route dans la cible : 1 - EAU × mouillure (écrit par eclaire, relu par ssr) ; tout autre opaque écrit 1
  const VUES = [], AA = ST ? ST.aa : 1, deux = () => VUES.length > 1;
  const suit = (vu, c) => { vu.moi = vu.car = c; vu.hu.hist.length = vu.hu.gR[0].length = vu.hu.gR[1].length = vu.hu.gOn[0] = vu.hu.gOn[1] = 0; vu.cth = c.th; vu.carY = S[c.idx].y; vu.result = null; vu.fini = vu.spec = false; vu.lap0 = [0, 0, 0]; }; // la vue se cale derrière la voiture c, compteurs de course à zéro : au départ, au retour au menu
  const nouvelleVue = () => {
    const rt = new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, type: ST ? THREE.UnsignedByteType : THREE.HalfFloatType }); // sans style, la scène garde ce qui dépasse le blanc : la passe finale l'expose (adaptation de l'œil)
    if (ST && ST.aa > 1) rt.texture.minFilter = rt.texture.magFilter = THREE.LinearFilter; // suréchantillonnage : la cible est aa fois plus fine, la passe finale en fait la moyenne
    if (SSR || !ST || ST.z) { rt.depthTexture = new THREE.DepthTexture(1, 1); rt.depthTexture.type = THREE.UnsignedIntType; } // sans style : la profondeur coupe les rayons de lumière (et sert aux reflets)
    // le HUD est dessiné sur un canvas 2D à la même résolution que le jeu, puis composé dans la passe finale : une seule grille de pixels
    const rs = SSR ? new THREE.WebGLRenderTarget(1, 1, { minFilter: rt.texture.minFilter, magFilter: rt.texture.magFilter, depthBuffer: false, type: rt.texture.type }) : null; // la scène + ses reflets calculés à l'écran (voir ssr)
    const hudC = document.createElement('canvas'), hudT = new THREE.CanvasTexture(hudC);
    hudT.minFilter = hudT.magFilter = THREE.NearestFilter;
    const hb = ST ? null : new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false, type: THREE.HalfFloatType }); // halo et rayons, sur la grille du HUD (voir halo)
    const vu = { cam: Object.assign(new THREE.PerspectiveCamera(70, 1, 0.5, 3000), { layers: Object.assign(new THREE.Layers(), { mask: 1 | 1 << 2 | 1 << 3 }) }), rt, rs, hb, oeil: 0, hudC, hg: hudC.getContext('2d'), hudT, w: 480, rw: 480, // w : largeur de la grille du HUD ; rw : celle de la cible (la même sans style)
      moi: null, hu: HUM[VUES.length], car: null, cth: 0, carY: 0, pitch: 0, roll: 0, // voiture suivie ; cap de la caméra, hauteur, tangage et roulis lissés
      lookA: 0, lookP: 0, lookT: 0, // caméra libre à la souris : angle autour de la voiture, hauteur en plus, délai avant retour
      hit: 0, bump: 0, land: 0, stun: 0, nit: 0, lm: 0, rv: 0, rc: 0, // chocs de la voiture suivie pendant l'image ; secousse, fondu de nitro, fondu de tunnel
      gear: 0, rpm: 0.3, load: 0, spool: 0, up: 0, peak: new Float32Array(EQN), // rapport et régime affichés (drivetrain), crêtes de la jauge
      result: null, splitMsg: null, // bandeaux du HUD : tour bouclé, écart au secteur
      n: VUES.length, periph: '', inp: null, gas: 0, // rang du joueur (0 = en haut) ; son périphérique ('' = le solo : tout le clavier et la manette retenue), son entrée de conduite de l'image
      fini: false, spec: false, lap0: null, // course : arrivé ou sorti ; spec : éliminé, la vue regarde le meneur (vu.car n'est plus la voiture du joueur, qui reste vu.moi) ; compteurs au début du tour (glisses, coups de nitro, murs) — remis à zéro par suit()
      lumIdx: -1, lums: LUMS.map(l => ({ l, d: 0 })), // luminaires triés par distance à la voiture suivie
      pluieO: [0, 0, 0], splP: new Float32Array(SN * 3), splA: splA.slice(), splD: new Float32Array(SN) }; // gouttes (leur décalage cumulé, voir pluie) et impacts : mêmes tirages de départ pour toutes les vues, rnd n'est pas tiré
    suit(vu, VUES.length ? VUES[0].moi : newCar(T)); VUES.push(vu); resize(); return vu; // une vue ajoutée (au menu) suit la voiture du joueur 1, comme toutes les vues hors course
  };
  const rendVue = vu => { vu.rt.dispose(); if (vu.rs) vu.rs.dispose(); if (vu.hb) vu.hb.dispose(); if (vu.rt.depthTexture) vu.rt.depthTexture.dispose(); vu.hudT.dispose(); }; // ce qu'une vue tient au GPU (son canvas de HUD n'est pas dans la page)
  const retireVue = () => { const vu = VUES.pop(); vu.hu.tr.visible = false; rendVue(vu); resize(); }; // ses traînées ne sont plus tenues par aucune vue
  let COM = null; // couche plein écran commune aux deux vues : un canvas 2D posé sur celui du jeu, { c, g }. Elle n'existe qu'à deux joueurs (voir joueurs et couche, près de la boucle)
  let hg = null; // contexte 2D du HUD en cours de dessin (celui de la vue, ou de la couche commune), pour txt, panel, tag
  // air devant l'objectif, commun aux deux passes finales : décalage de lecture de l'image (xy) et assombrissement (z)
  // gt[i] = goutte sur l'objectif (centre, rayon en hauteur d'écran, allongement vertical) : elle montre l'image derrière elle retournée et rapetissée, bord sombre
  // ch.w = force de la chaleur sur la route (ch.xyz : inutilisés depuis le retrait de l'air chaud derrière l'échappement, qui déformait la voiture du joueur au rupteur) ; cr = point de la route au loin à l'écran (x, y), temps
  const AIR = `uniform vec4 gt[8], ch, cr;
      vec3 air(vec2 v, vec2 px){ vec3 o = vec3(0., 0., 1.); vec2 as = vec2(px.y / px.x, 1.);
        for (int i = 0; i < 8; i++) { vec4 g = gt[i]; if (g.z <= 0.) continue; vec2 q = (v - g.xy) * as / g.z; q.y /= g.w; float r2 = dot(q, q);
          if (r2 < 1.) { o.xy += -(v - g.xy) * (1.6 + .4 * r2); o.z *= 1. - .3 * r2 * r2; } }
        if (ch.w > 0.) { float y = (cr.y - v.y) / .07, k = ch.w * step(0., y) * exp(-y * y) * exp(-pow((v.x - cr.x) * 2.2, 2.)); // juste sous le point de fuite de la route : le mirage
          o.xy += k * vec2(sin(v.y * 420. + cr.z * 9.) * .004, sin(v.y * 260. - cr.z * 6.) * .0016); }
        return o; }`;
  const post = new THREE.ShaderMaterial({
    uniforms: { t: { value: null }, h: { value: null }, hb: { value: null }, dz: { value: null }, ex: { value: 1 }, amt: { value: 0 }, ab: { value: 0 }, vig: { value: 0 }, res: { value: 270 }, bloom: { value: TH.bloom }, scan: { value: TH.scan }, px: { value: new THREE.Vector2(1 / 480, 1 / 270) },
      gt: { value: Array.from({ length: 8 }, () => new THREE.Vector4()) }, ch: { value: new THREE.Vector4() }, cr: { value: new THREE.Vector4() },
      ray: { value: [0, 1, 2, 3].map(() => new THREE.Vector4()) }, rayC: { value: [0, 1, 2, 3].map(() => new THREE.Color(0)) } }, // rayons : position à l'écran (xy), profondeur de la source (z), 1 / rayon² du halo (w) ; couleur × force
    vertexShader: 'varying vec2 v; void main(){ v = uv; gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: `uniform sampler2D t, h, hb; uniform float amt, ab, vig, res, scan, ex; uniform vec2 px; varying vec2 v; ${AIR}
      float b2(vec2 a){ a = floor(a); return fract(a.x / 2. + a.y * a.y * .75); } // matrice de Bayer 4×4, par récurrence
      void main(){
        float e = ex; // exposition : l'œil (voir TUN et rendVue)
        vec3 ai = air(v, px); vec2 w = v + ai.xy, c0 = vec2(.5, .42), d = w - c0; float l = length(d); vec3 c = vec3(0.);
        // flou radial : nul au centre, fort sur les bords, proportionnel à la vitesse ; autant d'échantillons que de texels traversés (8 au plus) : un flou de moins d'un pixel
        // (au centre, sous 130 km/h) relisait 8 fois le même texel, un tiers du coût de la passe
        float nf = clamp(ceil(length(d * amt * l * .182 / px)) + 1., 1., 8.), pas = nf > 1. ? amt * l * .182 / (nf - 1.) : 0.;
        for (int i = 0; i < 8; i++) { if (float(i) >= nf) break;
          vec2 u = c0 + d * (1. - pas * float(i));
          c += min(vec3(texture2D(t, u + d * ab).r, texture2D(t, u).g, texture2D(t, u - d * ab).b) * e, 1.); // + aberration chromatique ; exposé et écrêté au blanc, échantillon par échantillon comme l'ancienne cible 8 bits
        }
        c /= nf;
        c += texture2D(hb, v).rgb; // halo et rayons, calculés une fois par case de la grille (voir halo)
        c *= ai.z; // assombri sous les gouttes
        ${QUANT ? `vec2 q = v / px; c = floor(c * ${QUANT}. + (b2(.5 * q) * .25 + b2(q) - .5) * ${TRAME.toFixed(2)} + .5) / ${QUANT}.; // couleurs réduites et tramées, sur la grille de pixels du jeu` : ''}
        vec4 hd = texture2D(h, v); c = mix(c, hd.rgb, hd.a);
        c *= 1. - scan * mod(floor(v.y * res), 2.); // scanlines calées sur la grille
        c *= max(0., 1. - (.9 + .7 * vig) * l * l);  // vignette, resserrée par la vitesse et la nitro
        gl_FragColor = vec4(c, 1.);
      }`,
  });
  const postScene = new THREE.Scene(), postCam = new THREE.Camera(), quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post);
  quad.frustumCulled = false; postScene.add(quad);
  // halo et rayons de lumière : ils ne changent pas d'une ligne de la scène à l'autre au sein d'une case de la grille de 270 ; calculés ici une fois par case (un quart des pixels), la passe finale les relit (th.bloom, rayons : voir post)
  const halo = new THREE.ShaderMaterial({ uniforms: post.uniforms, vertexShader: post.vertexShader, depthTest: false, depthWrite: false,
    fragmentShader: `uniform sampler2D t, dz; uniform float bloom, ex; uniform vec2 px; uniform vec4 ray[4]; uniform vec3 rayC[4]; varying vec2 v; ${AIR}
      void main(){
        float e = ex; vec3 ai = air(v, px); vec2 w = v + ai.xy;
        vec3 bl = vec3(0.); // halo : on ajoute ce qui dépasse un seuil de luminosité, prélevé en couronne
        for (int i = 0; i < 12; i++) { float a = float(i) * .5236, rr = 2. + 2.5 * mod(float(i), 3.); bl += max(min(texture2D(t, w + vec2(cos(a), sin(a)) * rr * px).rgb * e, 1.) - .5, 0.); }
        vec3 ry = vec3(0.); float j = fract(52.98 * fract(dot(v / px, vec2(.0671, .0058)))); // rayons de lumière : un halo autour de chaque source, masqué par ce qui est devant elle, étiré vers le pixel ; décalage par pixel, du grain plutôt que des marches
        for (int k = 0; k < 4; k++) if (rayC[k] != vec3(0.)) {
          vec2 s = ray[k].xy, dd = (s - v) / 12., q; float f = 0.;
          for (int i = 0; i < 12; i++) { vec2 u = v + dd * (float(i) + j); q = (u - s) * vec2(px.y / px.x, 1.); f += step(ray[k].z, texture2D(dz, u).x) * exp(-dot(q, q) * ray[k].w); }
          q = (v - s) * vec2(px.y / px.x, 1.); ry += rayC[k] * f * max(0., 1. - 1.4 * length(q)); // portée : un peu plus d'une demi-hauteur d'écran
        }
        gl_FragColor = vec4(bl * bloom + ry * e / 12., 1.);
      }` });
  const haloScene = new THREE.Scene(); haloScene.add(Object.assign(new THREE.Mesh(quad.geometry, halo), { frustumCulled: false }));
  // reflets de la route mouillée calculés à l'écran : entre la scène et la passe finale. La route écrit dans l'alpha de la cible combien elle est mouillée
  // (1 = sèche, 0,5 = détrempée, voir eclaire) ; de chacun de ses pixels on suit le rayon réfléchi dans la profondeur de la vue, et on ajoute la couleur qu'il rencontre :
  // voitures, néons, feux arrière. Ce que le rayon ne trouve pas à l'écran (le ciel, ce qui est hors champ) reste aux rubans et aux reflets étirés de la lumière dynamique.
  const ssr = new THREE.ShaderMaterial({
    uniforms: { t: { value: null }, dz: { value: null }, P: { value: new THREE.Matrix4() }, Pi: { value: new THREE.Matrix4() }, up: { value: new V3() }, px: { value: new THREE.Vector2() }, pe: { value: TH.refletPente ? 1 : 0 } },
    vertexShader: post.vertexShader,
    fragmentShader: `uniform sampler2D t, dz; uniform mat4 P, Pi; uniform vec3 up; uniform vec2 px; uniform float pe; varying vec2 v;
      vec3 vpos(vec2 u){ vec4 p = Pi * vec4(u * 2. - 1., texture2D(dz, u).x * 2. - 1., 1.); return p.xyz / p.w; } // position dans le repère de la caméra
      vec2 ecran(vec3 q){ vec4 c = P * vec4(q, 1.); return c.xy / c.w * .5 + .5; }
      void main(){
        vec4 c = texture2D(t, v); float w = c.a > ${(0.95 - EAU).toFixed(2)} && c.a < .99 ? (1. - c.a) / ${EAU.toFixed(2)} : 0., trouve = 0.;
        if (w > 0.) {
          vec3 p = vpos(v), e = normalize(p), nn = up; // th.refletPente : le miroir est la chaussée elle-même (normale tirée de la profondeur) et non le plan horizontal ; au loin, où la profondeur manque de finesse, on revient à la verticale
          if (pe > 0.) { vec3 g = normalize(cross(dFdx(p), dFdy(p))); if (dot(g, up) < 0.) g = -g; if (dot(g, up) > .93) nn = normalize(mix(g, up, smoothstep(30., 90., -p.z))); }
          vec3 r = reflect(e, nn), q = p; float s = .4, a = 0., b = 0.; vec2 h = vec2(-1.);
          for (int i = 0; i < 22; i++) { // pas qui s'allongent : 0,4 m au départ, plus de 300 m au bout
            b = a; a += s; s *= 1.28; q = p + r * a; vec2 u = ecran(q);
            if (q.z > -.5 || u.x < 0. || u.x > 1. || u.y < 0. || u.y > 1.) break;
            float z = vpos(u).z;
            if (q.z < z && q.z > z - max(1.2, s * 2.)) { // le rayon vient de passer derrière une surface, à moins d'une épaisseur : on resserre entre les deux derniers pas
              for (int j = 0; j < 5; j++) { float m = (a + b) * .5; vec2 um = ecran(p + r * m); if (p.z + r.z * m < vpos(um).z) a = m; else b = m; }
              h = ecran(p + r * a); break;
            }
          }
          if (h.x >= 0.) {
            vec3 f = vec3(0.); for (int k = -2; k < 2; k++) f += texture2D(t, h + vec2(0., (float(k) + .5) * 2. * px.y)).rgb; // étiré à la verticale, comme un reflet sur l'eau
            vec2 bd = min(h, 1. - h); trouve = smoothstep(0., .08, min(bd.x, bd.y)) * (1. - smoothstep(60., 320., a)); // s'éteint au bord de l'image et au loin
            float fr = .25 + .75 * pow(1. - max(dot(-e, up), 0.), 3.); // Fresnel : vu en rasant, la route est un miroir
            c.rgb += f * .12 * w * fr * trouve;
          }
        }
        gl_FragColor = vec4(c.rgb, 1. - trouve); // alpha : 0 là où le reflet est trouvé, les rubans de repli n'y ajoutent rien (voir repli)
      }`,
  });
  // rubans de repli : dessinés après ssr dans la même cible, pondérés par son alpha, cachés par ce qui est devant eux dans la profondeur de la scène
  const REPLI = { rDz: { value: null }, rRes: { value: new THREE.Vector2() } }, repliScene = new THREE.Scene();
  const ssrScene = new THREE.Scene(), ssrQuad = new THREE.Mesh(quad.geometry, ssr); ssrQuad.frustumCulled = false; ssrScene.add(ssrQuad);
  // adaptation de l'œil (sans style) : les tunnels sont peints comme vus par un œil déjà fait au noir ; la lumière « vraie » y est TUN fois plus faible.
  // vu.oeil = log de la lumière à laquelle l'œil de la vue est fait (0 dehors, log TUN adapté au tunnel) ; exposition = lumière vraie / lumière de l'œil (rendVue) :
  // à l'entrée l'image s'assombrit puis l'œil s'habitue, à la sortie le dehors éblouit (au plus ×1,6) puis l'œil se referme, en 1 à 2 s ; une fois adapté, l'image est la scène peinte, couleurs comprises.
  // (L'ancienne version mesurait la luminosité de l'image et la ramenait à celle du dehors : un tunnel peint plus clair que la nuit, wangan, restait à ×0,4 ; un plus sombre, la ville, plafonnait.)
  const TUN = 0.4, OEIL_N = 0.5, OEIL_C = 0.35; // lumière vraie des tunnels ; constantes de temps de l'œil (s) vers le noir, vers le clair ; th.oeil = { tun, noir, clair } les remplace pour une carte
  if (ST) { // passe finale des styles : la scène telle quelle, l'effet du style, le HUD (toujours sur sa grille de 270 lignes), une vignette légère
    Object.assign(post.uniforms, { dz: { value: null }, ecr: { value: new THREE.Vector2(1, 1) }, pal: { value: PAL.map(c => new THREE.Color(c)) } });
    post.fragmentShader = `uniform sampler2D t, h, dz; uniform float amt, vig; uniform vec2 px, ecr; uniform vec3 pal[5]; varying vec2 v; ${AIR}
      float b2(vec2 a){ a = floor(a); return fract(a.x / 2. + a.y * a.y * .75); }
      float bayer(vec2 q){ return b2(.5 * q) * .25 + b2(q) - .5; }
      float lum(vec3 c){ return dot(c, vec3(.3, .59, .11)); }
      vec3 aplat(vec3 c, float n){ float g = sqrt(max(lum(c), 1e-4)), a = (floor(g * n) + .5) / n; return c * (a * a / (g * g)); } // paliers de clarté, teinte gardée
      float W(vec2 u){ return 1. - texture2D(dz, u).x; } // proportionnel à 1 / distance : affine à l'écran sur une facette plane
      float arete(vec2 u, vec2 e){ float w = W(u); // courbure de W : nulle sur une facette, forte à une silhouette ou à un pli
        return (abs(W(u + vec2(e.x, 0.)) + W(u - vec2(e.x, 0.)) - 2. * w) + abs(W(u + vec2(0., e.y)) + W(u - vec2(0., e.y)) - 2. * w)) / max(w, 1e-6); }
      void main(){
        vec3 ai = air(v, px); vec2 u = v; ${ST.pre || ''} vec2 uh = u; u += ai.xy; // le HUD reste net : seule la scène passe à travers l'air
        vec3 c = texture2D(t, u).rgb * ai.z; ${ST.fx || ''}
        vec4 hd = texture2D(h, uh); c = mix(c, hd.rgb, hd.a); ${ST.fin || ''}
        ${ST.brut ? '' : 'vec2 d = v - vec2(.5, .42); c *= max(0., 1. - (.35 + .7 * vig) * dot(d, d));'}
        gl_FragColor = vec4(c, 1.);
      }`;
  }
  const grille = n => n > 2 ? [2, 2] : [1, n]; // colonnes × lignes de vues ; à 3, la case en bas à droite reste noire
  let RH = 270; const HH = 270, KL = ST ? 1 : 2; // KL : lignes de la scène par ligne de la grille du HUD (540 lignes ; le HUD et les effets de la passe finale restent sur la grille de 270)
  // vu.w × HH : grille du HUD d'une vue ; vu.rw × RH : sa cible (la même sans style) ; toutes les vues ont les mêmes lignes
  const resize = () => {
    const OW = Math.round(innerWidth * devicePixelRatio), OH = Math.round(innerHeight * devicePixelRatio), k = ST ? (ST.h || OH) / HH * AA : KL, n = VUES.length; RH = Math.round(HH * k);
    const [cols, rows] = grille(n);
    for (const vu of VUES) { // chaque vue prend une case de la grille (à 2 : bandes superposées ; à 3 ou 4 : 2 × 2) : sa largeur de grille suit le rapport de cette case, dans les bornes du solo, la haute multipliée par l'allongement de la case (une bande est n fois plus allongée que l'écran : bornée à 960, elle s'étirait dès que l'écran dépassait le 16/9)
      vu.w = clamp(Math.round(HH * rows / cols * innerWidth / (innerHeight || 1)), 360, 960 * rows / cols); vu.rw = Math.round(vu.w * k);
      vu.rt.setSize(vu.rw, RH); if (vu.rs) vu.rs.setSize(vu.rw, RH); if (vu.hb) vu.hb.setSize(vu.w, HH); vu.hudC.width = vu.w; vu.hudC.height = HH; vu.hg.f_ = null; vu.cam.aspect = vu.w / HH; vu.cam.updateProjectionMatrix();
    }
    if (ST) { renderer.setSize(OW, OH, false); post.uniforms.ecr.value.set(OW, OH); } else if (n) renderer.setSize(VUES[0].w * cols * KL, HH * rows * KL, false);
    renderer.setScissorTest(n > 1); // à deux, la passe finale de chaque vue ne touche que sa bande (voir vueFrame)
    if (COM) { COM.c.width = clamp(Math.round(HH * innerWidth / (innerHeight || 1)), 360, 960); COM.c.height = HH; COM.g.f_ = null; } // la couche commune garde la grille du solo, étirée sur tout l'écran : menu et pause y sont dessinés comme en solo
  };
  addEventListener('resize', resize);

  const lisse = t => { t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; return t; }; // filtrage linéaire et mipmaps : ?lisse=1 partout, th.lisse ou mat(…, { lisse: 1 }) pour une carte (docs/MOTEUR-OPTIONS-CARTES.md)
  const tex = (w, h, draw, nom) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'));
    const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestMipmapLinearFilter; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); // MipmapLinear : fondu entre deux niveaux de mipmap, plus de lignes de palier qui avancent sur le sol avec la caméra ; anisotropie au maximum de la carte graphique : sans elle, les paliers de mipmap du sol vu en rasant avancent avec la voiture, à 10-100 m (on croit voir les textures se charger) ; jamais de filtrage linéaire, sauf ?lisse=1
    if (P('lisse') || nom && TH.lisse && TH.lisse.includes(nom)) lisse(t);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  };
  const R = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w, h); };

  // ---------- les trois entités du décor : textures.js (l'aspect), formes.js (la géométrie), et le placement — ici pour la piste et la ville, decors-<carte>.js pour les autres cartes ----------
  const speckle = (g, n, c, h = 1, H = 64) => { for (let i = 0; i < n; i++) R(g, c, rnd() * 64 | 0, rnd() * H | 0, 1, h); };
  const voile = (g, a, f) => { g.globalAlpha = a; f(); g.globalAlpha = 1; }; // dessine en transparence : salissures et usure par-dessus n'importe quelle teinte
  const tx = (nom, ...a) => { // un dessin du catalogue, tiré à neuf à chaque appel ; alea = hasard propre à la texture, semé par son nom : il ne décale pas rnd, donc pas le décor
    const [w, h, d, tuile] = TEXTURES[nom](...a); let s = 7; for (const ch of nom + a) s = Math.imul(s ^ ch.charCodeAt(0), 16777619) >>> 0;
    const t = tex(w, h, g => d(g, { R, rnd, voile, speckle, alea: () => (s = s * 1664525 + 1013904223 >>> 0) / 4294967296 }), nom); t.tuile = tuile; return t;
  };
  // une matière : une texture du catalogue (aplat ou dessin) et la façon de la rendre. Options : lum = lumineuse par elle-même, c = teinte,
  // retro / gloss = rétroréfléchissante / brillante (lumière dynamique), rep = répétition, net = sans mipmaps, et toutes celles des matériaux three
  const mat = (nom, o = {}, ...a) => {
    const { lum: lu, c, retro: re, gloss: gl, rep, net, lisse: li, ...three } = o, e = TEXTURES[nom], p = typeof e === 'number' ? { color: c === undefined ? e : c } : { map: tx(nom, ...a) };
    if (p.map && c !== undefined) p.color = c; if (rep) p.map.repeat.set(...rep); if (li && p.map) lisse(p.map); if (net) p.map.minFilter = THREE.NearestFilter;
    const m = new THREE[lu ? 'MeshBasicMaterial' : 'MeshLambertMaterial'](Object.assign(p, three));
    if (p.map) m.userData.tuile = p.map.tuile; if (re) retro(m, re); if (gl) gloss(m, gl); return m;
  };
  // densité : sur une boîte, une texture à tuile se répète tous les `tuile` mètres au lieu de s'étirer sur chaque face (faces de BoxGeometry : ±x, ±y, ±z)
  const habille = (g, m) => {
    const t = m && m.userData.tuile, dm = g.userData.dim;
    if (t && dm && !g.userData.hab) { g.userData.hab = 1; const uv = g.attributes.uv, [w, h, d] = dm; for (let i = 0; i < uv.count; i++) { const f = i >> 3; uv.setXY(i, uv.getX(i) * (f ? w : d) / t, uv.getY(i) * (f === 1 ? d : h) / t); } }
    return g;
  };
  const geo = (nom, ...a) => FORMES[nom](...a); // la géométrie d'une forme simple
  // pose une forme en (x, y, z) dans parent. peau = une matière (forme simple, renvoie le Mesh) ou { zone: matière } (assemblage, renvoie ses Mesh)
  const pose = (nom, peau, parent = scene, [x, y, z] = [0, 0, 0], ...a) => {
    const f = FORMES[nom](...a);
    if (f.isBufferGeometry) { const m = new THREE.Mesh(habille(f, peau), peau); m.position.set(x, y, z); parent.add(m); return m; }
    return Object.entries(zones(f, peau)).map(([zn, g]) => { const m = new THREE.Mesh(g, peau[zn]); m.position.set(x, y, z); m.castShadow = !!g.userData.ombre; parent.add(m); return m; });
  };
  // un assemblage fondu en une géométrie par zone (une seule passe de dessin par zone) ; f = nom de forme + réglages, ou la liste de boîtes déjà calculée
  const EUL = new THREE.Euler(), QUA = new THREE.Quaternion(), M4 = new THREE.Matrix4(), UN = new V3(1, 1, 1);
  const zones = (f, peau, ...a) => {
    const par = {};
    for (const [zn, w, h, d, px, py, pz, r, ombre] of typeof f === 'string' ? FORMES[f](...a) : f) {
      const g = habille(geo('boite', w, h, d), peau[zn]).toNonIndexed(); M4.compose(new V3(px, py, pz), QUA.setFromEuler(EUL.set(...(r || [0, 0, 0]))), UN); g.applyMatrix4(M4);
      (par[zn] = par[zn] || { l: [], ombre: 0 }).l.push(g); if (ombre) par[zn].ombre = 1;
    }
    const out = {};
    for (const zn in par) {
      const l = par[zn].l, n = l.reduce((s, g) => s + g.attributes.position.count, 0), g = new THREE.BufferGeometry();
      for (const [k, sz] of [['position', 3], ['normal', 3], ['uv', 2]]) { const A = new Float32Array(n * sz); let o = 0; for (const p of l) { A.set(p.attributes[k].array, o); o += p.attributes[k].array.length; } g.setAttribute(k, new THREE.BufferAttribute(A, sz)); }
      g.userData.ombre = par[zn].ombre; out[zn] = g;
    }
    return out;
  };
  const LUMI = { lum: 1 }, LUMI2 = { lum: 1, side: THREE.DoubleSide }; // lumineuse par elle-même ; idem, visible des deux côtés

  // ciel en bandes (nuit, aube ou couchant selon la carte), étoiles, lune ou soleil
  const skyMat = mat('ciel', { lum: 1, side: THREE.BackSide, fog: false, net: 1 }, TH.sky, TH.stars);
  const sky = new THREE.Mesh(new THREE.SphereGeometry(2500, TH.cielSeg || 16, 12), skyMat); sky.userData.dyn = 1; scene.add(sky);
  const SD = new V3(...TH.astre.dir).normalize();
  const sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({ fog: false, transparent: true, alphaTest: 0.5, depthWrite: false, map: tx('astre', TH.astre.col, TH.astre.ombre) }));
  sunDisc.scale.set(TH.astre.taille, TH.astre.taille, 1); scene.add(sunDisc);
  // th.brume : un voile de la couleur du brouillard, à 700 m autour de la caméra, cache ce qui échappe au brouillard (ciel, astre, lointains posés hors brouillard) ; opacité = force de la zone
  const voileBr = brumeZ.length ? new THREE.Mesh(new THREE.SphereGeometry(700, 16, 10), new THREE.MeshBasicMaterial({ color: TH.fog, side: THREE.BackSide, fog: false, transparent: true, depthWrite: false, opacity: 0 })) : null;
  if (voileBr) { voileBr.renderOrder = 50; voileBr.visible = false; voileBr.frustumCulled = false; voileBr.userData.dyn = 1; scene.add(voileBr); }

  const hemi = new THREE.HemisphereLight(TH.hemi[0], TH.hemi[1], TH.hemi[2] * Math.PI); scene.add(hemi); // bleu d'en haut, rebond magenta de la ville
  const sun = new THREE.DirectionalLight(TH.sun[0], TH.sun[1] * Math.PI); sun.castShadow = true; const OMBD = 2, OMBI = 3; // clair de lune ; OMBD, OMBI : calques des objets mobiles qui portent une ombre, simples et instanciés (voir ombres)
  // th.ombre = { taille, champ, doux } (docs/MOTEUR-OPTIONS-CARTES.md) : côté de la carte d'ombre en texels (2048), demi-côté couvert en m (390), filtrage bilinéaire des bords (4 lectures au lieu d'une)
  const OMBO = TH.ombre || {}, OTX = OMBO.taille || 2048, OCH = OMBO.champ || 300 * LOIN;
  sun.shadow.mapSize.set(OTX, OTX); sun.shadow.bias = -0.0015; sun.shadow.normalBias = 0.5;
  Object.assign(sun.shadow.camera, { left: -OCH, right: OCH, top: OCH, bottom: -OCH, near: 10, far: 800 * LOIN });
  scene.add(sun, sun.target);

  // ---------- lumière dynamique : un seul calcul, ajouté dans le shader de tous les matériaux de la scène (onBeforeCompile) ----------
  // Ciel et lune / soleil restent ceux de three (avec leur ombre). Tout le reste est calculé ici, par pixel, avec la normale de la facette :
  // NL luminaires ponctuels (les plus proches le long de la piste + feux des voitures), le faisceau des phares à coupure nette,
  // l'ombre de la voiture par lancer de rayon sur sa boîte (elle balaie route et murs à chaque luminaire franchi),
  // et sur les surfaces brillantes (route mouillée, flaques = alpha de la texture, carrosserie) le reflet étiré de chaque source.
  const LUMS = [], lum = (i, x, y, z, col, r, k = 1, tun = 0) => { const l = { i, x, y, z, c: new THREE.Color(col).multiplyScalar(k), r, tun }; LUMS.push(l); return l; }; // rend le luminaire : un décor peut faire respirer sa couleur (l.c) dans son tick (feu de camp de chapada)
  const NUIT = TH.phares / 2.6; // force des feux de voiture : pleine de nuit, faible à l'aube et au couchant
  let pharesV = TH.phares, nuitV = NUIT; // th.pharesBrume : dans un banc de brouillard (th.brume à quatre valeurs), les feux des voitures s'allument à cette force, au prorata du banc ; sans l'option, pharesV = TH.phares et nuitV = NUIT
  const SUNC = new THREE.Color(TH.sun[0]).multiplyScalar(TH.sun[1]);
  const LUX = { uLP: { value: Float32Array.from({ length: NL * 4 }, (_, i) => i % 4 === 3 ? 1 : 0) }, uLC: { value: new Float32Array(NL * 3) }, // à plat : three envoie le tableau tel quel au lieu de recopier 20 vecteurs à chaque passe de dessin
   
    uHP: { value: new V3() }, uHD: { value: new V3(1, 0, 0) }, uHC: { value: new THREE.Color(0xfff2d0).multiplyScalar(TH.phares * 1.1 * LUM_GAIN) }, uBox: { value: new THREE.Matrix4() },
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
    uniform vec4 uLP[NL]; uniform vec3 uLC[NL]; uniform vec3 uHP, uHD, uHC, uSunD, uSunC, uSky, uCam; uniform mat4 uBox; uniform float uGloss, uRetro; uniform int uN; varying vec3 vLw;
    float luOmbre(vec3 p, vec3 d) { // 0 si la boîte de la voiture coupe le segment p → p + d ; un point dans la boîte ou à sa surface n'est pas ombré
      vec3 o = (uBox * vec4(p, 1.)).xyz, iv = 1. / (mat3(uBox) * d + 1e-5), t0 = (-1. - o) * iv, t1 = (1. - o) * iv, mn = min(t0, t1), mx = max(t0, t1);
      float a = max(max(mn.x, mn.y), mn.z), b = min(min(mx.x, mx.y), mx.z);
      return a < b && a > .005 && a < 1. ? 0. : 1.;
    }
    `;
  const LU_F = `{
      vec3 n = normalize(cross(dFdx(vLw), dFdy(vLw))), v = normalize(uCam - vLw); // uCam et non cameraPosition : three ne le renseigne pas pour les matériaux Basic et Lambert (il reste à l'origine du monde)
      if (dot(n, v) < 0.) n = -n;
      float g = uGloss + (1. - diffuseColor.a) * 2., plat = step(.8, n.y);
      #ifdef MOUILLE
        vec4 mo = texture2D(uMo, vec2(vMo.x, fract(vMo.y))); mo.r = smoothstep(.15, .85, mo.r); // r = mouillure de la course, g = pluie (voir MOT) ; à moitié sèche, elle se voit déjà
        g = mix(g, mix(0., max(g, .25), mo.r), mo.g); // sous la pluie : la ligne sèche est mate, le reste brille
      #endif
      vec3 dif = vec3(0.), spe = vec3(0.); vec2 rh = normalize(reflect(-v, n).xz + 1e-4);
      for (int i = 0; i < NL; i++) {
        if (i >= uN) break; // seulement les luminaires allumés
        vec3 d = uLP[i].xyz - vLw; float a = 1. - dot(d, d) / (uLP[i].w * uLP[i].w);
        if (a <= 0.) continue;
        if (uLP[i].w > 0.) a *= luOmbre(vLw, d); vec3 l = normalize(d); // portée négative : feu porté par la voiture, qui ne projette pas l'ombre de sa propre boîte
        dif += uLC[i] * (a * a * max(dot(n, l), 0.));
        if (g > 0.) spe += uLC[i] * (a * mix(pow(max(dot(n, normalize(l + v)), 0.), 24.), pow(max(dot(rh, normalize(l.xz + 1e-4)), 0.), 40.), plat));
      }
      if (g > 0.) spe += plat * (uSunC * pow(max(dot(rh, normalize(uSunD.xz)), 0.), 50.) * 3.5 + uSky * .18);
      vec3 hv = vLw - uHP; float f = dot(hv, uHD);
      if (f > .5) { // phares : faisceau large, coupure horizontale nette (feu de croisement)
        vec3 hr = normalize(vec3(-uHD.z, 0., uHD.x));
        float m = smoothstep(1.3, .6, abs(dot(hv, hr)) / f) / (1. + f * f * .0006), lo = m * smoothstep(.3, .02, dot(hv, cross(hr, uHD)) / f) * smoothstep(75., 25., f); // coupure adoucie : une route qui monte ne fait plus de ligne nette
        dif += uHC * (lo * (.45 + .55 * max(dot(n, -normalize(hv)), 0.)));
        if (uRetro > 0.) dif += uHC * (m * uRetro); // catadioptres et panneaux : renvoient le faisceau, même au-dessus de la coupure
      }
      if (uRetro > 0.) gl_FragColor.rgb *= .3;
      gl_FragColor.rgb *= .55 + .45 * diffuseColor.a; // l'eau fonce le sol
      #ifdef MOUILLE
        gl_FragColor.rgb *= 1. - .35 * mo.g * (1. - mo.r); // et la ligne sèche, gomme et poussière, plus sombre encore
      #endif
      #ifdef MOUVIS
        gl_FragColor.rgb *= 1. - .3 * mo.g * mo.r; // th.mouilleVisible : le bitume mouillé est plus sombre (la pluie seule ne le fonce pas : rendu des cartes de pluie inchangé)
      #endif
      gl_FragColor.rgb += 1. - exp(-1.3 * (diffuseColor.rgb + .07) * dif) + spe * (g * (.12 + pow(1. - max(dot(n, v), 0.), 3.))); // même l'asphalte sombre répond ; les teintes claires saturent en douceur
    }
    `;
  const OMB_DOUX = THREE.ShaderChunk.shadowmap_pars_fragment.replace(/float depth = texture2D\( shadowMap, shadowCoord\.xy \)\.r;[\s\S]*?#endif/, `vec2 tp = shadowCoord.xy * shadowMapSize - .5, fp = fract(tp), b0 = (floor(tp) + .5) / shadowMapSize, dt = 1. / shadowMapSize;
        shadow = mix(mix(step(shadowCoord.z, texture2D(shadowMap, b0).r), step(shadowCoord.z, texture2D(shadowMap, b0 + vec2(dt.x, 0.)).r), fp.x),
          mix(step(shadowCoord.z, texture2D(shadowMap, b0 + vec2(0., dt.y)).r), step(shadowCoord.z, texture2D(shadowMap, b0 + dt).r), fp.x), fp.y);`); // getShadow de BasicShadowMap en bilinéaire (profondeur non inversée, celle du jeu)
  const eclaire = m => { // branche un matériau sur la lumière dynamique ; userData.gloss = brillance, userData.retro = rétroréfléchissant
    if (m.userData.lu || !(m.isMeshBasicMaterial || m.isMeshLambertMaterial || m.isMeshPhongMaterial)) return;
    m.userData.lu = 1;
    const lit = m.fog !== false && m.blending === THREE.NormalBlending; // le ciel et les plans additifs ne reçoivent rien, mais tremblent avec le reste
    // alpha de la cible, lu par ssr : la route y écrit combien elle est mouillée (pluie de l'échantillon, flaques en plus), tout autre opaque 1 (sinon une texture à trous passerait pour de l'eau)
    const mou = SSR && m.userData.mou ? 1 : 0, opaque = SSR && !m.transparent ? 1 : 0;
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, LUX, { uGloss: { value: m.userData.gloss || 0 }, uRetro: { value: m.userData.retro || 0 } });
      if (m.userData.mo) { // la route à ciel ouvert : vMo = (travers, échantillon) dans MOT ; uv.y = échantillon / 16 depuis T.t1 (ribbon, vLen 32)
        Object.assign(sh.uniforms, { uMo: { value: MOT }, uMoN: { value: new THREE.Vector2((m.userData.mo0 ?? T.t1) + 0.5, N) } });
        sh.vertexShader = '#define MOUILLE\nuniform vec2 uMoN; varying vec2 vMo;\n' + sh.vertexShader.replace('#include <fog_vertex>', 'vMo = vec2(uv.x, (uv.y * 16. + uMoN.x) / uMoN.y);\n#include <fog_vertex>');
      }
      sh.vertexShader = 'varying vec3 vLw, vAf; uniform vec2 uRes;\n' + sh.vertexShader.replace('#include <fog_vertex>', LU_V + '#include <fog_vertex>');
      if (lit) sh.fragmentShader = LU_H + sh.fragmentShader.replace('#include <fog_fragment>', LU_F + '#include <fog_fragment>');
      if (mou) { sh.vertexShader = 'attribute float mou; varying float vMou;\n' + sh.vertexShader.replace('#include <fog_vertex>', 'vMou = mou;\n#include <fog_vertex>'); sh.fragmentShader = 'varying float vMou;\n' + sh.fragmentShader; }
      if (opaque) sh.fragmentShader = sh.fragmentShader.replace('#include <fog_fragment>', (mou ? `gl_FragColor.a = 1. - ${EAU.toFixed(2)} * clamp(vMou * .3 + (1. - diffuseColor.a) * min(vMou, 1.), 0., 1.);` : 'gl_FragColor.a = 1.;') + '\n#include <fog_fragment>');
      // textures sans correction de perspective : vAf = uv × w, interpolé puis divisé par w interpolé, redonne l'interpolation affine à l'écran
      if (ST && ST.affine) sh.fragmentShader = 'varying vec3 vAf;\n' + sh.fragmentShader.replace('#include <map_fragment>', THREE.ShaderChunk.map_fragment.replace('vMapUv', `mix(vMapUv, vAf.xy / vAf.z, ${ST.affine.toFixed(3)})`));
      if (OMBO.doux) sh.fragmentShader = sh.fragmentShader.replace('#include <shadowmap_pars_fragment>', OMB_DOUX); // th.ombre.doux : bords d'ombre filtrés (4 lectures) au lieu de texels en escalier
      const co = m.userData.couches; if (co) { // terrain à plusieurs matières (decors.js, terrain : o.couches ou th.couches) : jusqu'à 4 textures mêlées par sommet, poids dans l'attribut couche
        sh.uniforms.uCr = { value: new THREE.Vector4(...[0, 1, 2, 3].map(i => co[i] ? co[i].rep : 1)) }; co.forEach((c, i) => sh.uniforms['uC' + i] = { value: c.map });
        sh.vertexShader = 'attribute vec4 couche; varying vec4 vCo;\n' + sh.vertexShader.replace('#include <fog_vertex>', 'vCo = couche;\n#include <fog_vertex>');
        sh.fragmentShader = 'varying vec4 vCo; uniform vec4 uCr;\n' + co.map((c, i) => 'uniform sampler2D uC' + i + ';\n').join('') + sh.fragmentShader.replace('#include <map_fragment>', THREE.ShaderChunk.map_fragment)
          .replace('diffuseColor *= sampledDiffuseColor;', co.map((c, i) => `sampledDiffuseColor = mix(sampledDiffuseColor, texture2D(uC${i}, vMapUv * uCr[${i}]), vCo[${i}]);\n`).join('') + 'diffuseColor *= sampledDiffuseColor;');
      }
      if (m.userData.mo) sh.fragmentShader = '#define MOUILLE\n' + (MV ? '#define MOUVIS\n' : '') + sh.fragmentShader; // en tête, avant LU_H qui s'en sert
      sh.fragmentShader = '#undef OPAQUE\n' + sh.fragmentShader; // r151+ force l'alpha des opaques à 1 avant fog_fragment : les flaques (alpha de la texture) et la mouillure le lisent
    };
    m.customProgramCacheKey = () => 'lu' + lit + opaque + mou + (m.userData.mo ? 'mo' + (MV ? 'mv' : '') + (m.userData.mo0 ?? '') : '') + (OMBO.doux ? 'od' : '') + (m.userData.couches ? 'c' + m.userData.couches.length : '');
  };
  const gloss = (m, g) => { m.userData.gloss = g; return m; }, retro = (m, r = 1.5) => { m.userData.retro = r; return m; };

  // ---------- matières additives (reflets, faisceaux, hologrammes) ----------
  const addMat = (map, o = {}) => new THREE.MeshBasicMaterial(Object.assign({ map, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }, o));
  const adMats = [];
  // reflet de repli (sous pluie seulement) : sorti de la scène, dessiné après ssr (voir REPLI) là où le reflet calculé n'a rien trouvé, au lieu de s'y ajouter
  const repli = o => {
    if (!SSR) return o;
    scene.remove(o); repliScene.add(o); if (o.isInstancedMesh) o.frustumCulled = false;
    const m = o.material; eclaire(m); const f = m.onBeforeCompile, k = m.customProgramCacheKey;
    Object.assign(m, { blending: THREE.CustomBlending, blendSrc: THREE.DstAlphaFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor });
    m.onBeforeCompile = sh => { f(sh); Object.assign(sh.uniforms, REPLI);
      sh.fragmentShader = 'uniform sampler2D rDz; uniform vec2 rRes;\n' + sh.fragmentShader.replace('void main() {', 'void main() {\n  if (texture2D(rDz, gl_FragCoord.xy / rRes).x < gl_FragCoord.z - 1e-6) discard;')
        .replace('#include <dithering_fragment>', '#include <dithering_fragment>\n  gl_FragColor.rgb *= gl_FragColor.a;'); }; // le mélange additif d'avant multipliait par l'alpha de la texture : on le fait ici
    m.customProgramCacheKey = () => k() + 'repli'; return o;
  };

  fond && await souffle();
  // ---------- géométrie de la piste (hauteurs relatives à l'altitude de la route) ----------
  function ribbon(i0, cnt, oa, ya, ob, yb, mat, vLen = 8) { // oa, ya, ob, yb : constantes, ou fonctions de l'échantillon (largeur et hauteur variables)
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
  // mouillure pour le dessin : texture MO.nb × N (bandes en travers de -W à W × échantillons), rouge = mouillure de la course (R.mo, voir MO dans sim.js ; 1 hors course), vert = pluie de l'échantillon (0 à 1)
  // Un shader qui veut savoir si la route est mouillée lit MOT : mouillure = rouge × vert. Remise à jour toutes les 8 images (moMaj).
  const MOI = new Uint8Array(N * MO.nb * 4).fill(255), MOT = new THREE.DataTexture(MOI, MO.nb, N, THREE.RGBAFormat); MOT.magFilter = MOT.minFilter = THREE.LinearFilter; MOT.k = 0;
  for (let k = 0; k < N * MO.nb; k++) MOI[k * 4 + 1] = Math.min(1, mouAt(k / MO.nb | 0)) * 255; MOT.needsUpdate = true;
  const moMaj = () => { const mo = race && race.mo; if (!mo && !MOT.sale || ++MOT.k & 7) return; for (let k = 0; k < N * MO.nb; k++) MOI[k * 4] = mo ? mo[k] * 255 : 255; MOT.sale = !!mo; MOT.needsUpdate = true; }; // toutes les 8 images : la route sèche lentement, et chaque envoi est toute la texture
  const across = s => Math.atan2(-s.tx, -s.tz); // rotation Y qui met l'axe X local en travers de la route
  const box = (w, h, d, mat, x, y, z, parent = scene) => { const m = new THREE.Mesh(habille(geo('boite', w, h, d), mat), mat); m.position.set(x, y, z); parent.add(m); return m; };

  const cT = T.t1 - T.t0, cO = N - cT; // sans tunnel : cT = 0, la route à ciel ouvert fait tout le tour
  // route : mouillée, elle renvoie en reflets étirés les phares, les néons, la lune ou le soleil (lumière dynamique)
  const route = ribbon(T.t1, cO, -W, 0, W, 0, mat(TH.routeTex || 'chaussee', { // th.routeTex : autre dessin de chaussée, mêmes réglages th.route (chausseeFine : textures.js)
    side: THREE.DoubleSide, gloss: TH.gloss ?? (TH.route[6] ? 0.2 : 0.08) }, ...TH.route), 32); /* th.gloss : autre brillance de la chaussée (reflet du soleil et des luminaires) */ route.material.userData.mo = 1;
  if (SSR) { route.material.userData.mou = 1; route.geometry.setAttribute('mou', new THREE.Float32BufferAttribute(Array.from({ length: (cO + 1) * 2 }, (_, j) => mouAt((T.t1 + (j >> 1)) % N)), 1)); } // pluie par échantillon : ssr ne reflète que là où il pleut
  const barrier = mat('glissiere', { lum: TH.tubes, side: THREE.DoubleSide }, TH.mur); // ville : liseré néon, lumineux par lui-même ; ailleurs la glissière prend la lumière
  const MURS = {}; // les deux glissières (côté -1 et +1), qui gardent la forme des chocs (voir « décor qui s'abîme »)
  if (!T.vert) { MURS[-1] = ribbon(T.t1, cO, -W, TH.murH, -W, -2, barrier); MURS[1] = ribbon(T.t1, cO, W, TH.murH, W, -2, barrier); }
  else { // carte à relief : la glissière suit le haut des murs roulables, et chaque paroi est un quart de tube en 16 facettes, du pied du plat au mur
    const haut = s => paroi(s, s.w), tube = mat(TH.paroi || 'beton', { side: THREE.DoubleSide });
    for (const sg of [-1, 1]) {
      if (TH.glis ?? 1) MURS[sg] = ribbon(T.t1, cO, s => sg * s.w, s => haut(s) + TH.murH, s => sg * s.w, s => haut(s) - 2, barrier); // th.glis = 0 : le décor pose lui-même ses glissières (stade : pas sur l'aire centrale), celle-ci doublerait la sienne
      for (let i = 0; i < N; i++) if (S[i].rc && !S[(i - 1 + N) % N].rc) { let c = 0; while (S[(i + c + 1) % N].rc) c++;
        for (let j = 0; j < 16; j++) { const o = k => s => sg * (W + (s.w - W) * k / 16), y = k => s => paroi(s, W + (s.w - W) * k / 16); ribbon(i, c, o(j), y(j), o(j + 1), y(j + 1), tube, 16); } } // 16 facettes : avec 6, la corde passait jusqu'à 0,7 m au-dessus de la paroi de sim.js, la voiture s'y enfonçait
    }
  }
  const concrete = mat('betonSombre', { side: THREE.DoubleSide }), glowY = mat('neonJaune', LUMI), glowC = mat('neonCyan', LUMI), glowM = mat('neonMagenta', LUMI);
  // tunnel : intérieur sombre, éclairé par ses luminaires (sur la ville : échangeur en alarme rouge qui bat avec la musique), coque sombre
  const tunMats = [];
  if (T.tun) {
    const u = TH.tun;
    // forme du tunnel (docs/MOTEUR-OPTIONS-CARTES.md) : th.tun.h (hauteur sous voûte, 8 m), th.tun.voute (flèche de la voûte, 0 = plafond plat), th.tun.ouv (ouvertures du plafond [[f0, f1], …]),
    // th.tun.rayons (couleur des colonnes de lumière sous les ouvertures). h et voute : un nombre, des clés [[f, valeur], …] ou une fonction (f, s) ; f = 0 à l'entrée, 1 à la sortie.
    // Avec l'une d'elles, parois et sol suivent la demi-largeur roulable s.w (M.large de sim.js : les murs de la physique) au lieu de W. Sans elles, rien ne change.
    let sol; const FT = u.h != null || !!u.voute || !!u.ouv, FI = new Map(); for (let k = 0; k <= cT; k++) FI.set(S[(T.t0 + k) % N], k / cT);
    const val = (v, d) => s => { const f = FI.get(s) ?? 0; if (v == null) return d; if (typeof v === 'number') return v; if (typeof v === 'function') return v(f, s);
      let j = 0; while (j < v.length - 1 && v[j + 1][0] < f) j++; const [fa, a] = v[j], [fb, b] = v[Math.min(j + 1, v.length - 1)]; return fb > fa ? a + (b - a) * clamp((f - fa) / (fb - fa), 0, 1) : a; };
    const tw = FT ? s => s.w : () => W, hh = val(u.h, 8), vt = val(u.voute, 0), hm = s => hh(s) - vt(s), plaf = (s, x) => hm(s) + vt(s) * Math.sqrt(Math.max(0, 1 - (x / tw(s)) ** 2));
    const SANS = new Set(u.sans || []); // th.tun.sans : ce que le moteur ne pose pas ('portails', 'luminaires' : les lumières restent, sans leurs boîtiers ; 'lumieres' : aucune lumière de luminaire, seulement le jour des ouvertures ; 'parois' : ni parois, ni voûte, ni coque, le décor de la carte les fait)
    const ouvert = k => (u.ouv || []).some(([a, b]) => k >= a * cT && k <= b * cT), pans = [] /* plafond : morceaux [début, longueur] hors des ouvertures */;
    for (let k = 0, a = -1; k <= cT; k++) { const o = ouvert(k) || k === cT; if (!o && a < 0) a = k; if (o && a >= 0) { pans.push([a, k - a + (k === cT && !ouvert(k))]); a = -1; } }
    tunMats.push(mat('chaussee', { lum: 1, side: THREE.DoubleSide, gloss: u.gloss ?? 0.3 }, ...u.sol), mat((u.tex || [])[0] || 'paroi', LUMI2, u.murs[0], u.paroi, u.carreaux), mat((u.tex || [])[0] || 'paroi', LUMI2, u.murs[1], u.paroi, u.carreaux), mat((u.tex || [])[1] || 'plafond', LUMI2, u.plafond)); /* th.tun.tex : autres textures des parois et de la voûte (chapada : la roche de la grotte) */
    tunMats.forEach((m, i) => m.color.setScalar(m.userData.amb = TH.alarme && (i === 1 || i === 2) ? 0.85 : u.ambiant ?? TUN_AMB)); // th.tun.ambiant : autre part d'ambiante sous la voûte ; ville : les parois gardent leurs bandes néon vives
    { // luminaires en quinconce, un à gauche, un à droite : la lumière et l'ombre de la voiture changent de côté à chaque luminaire franchi
      const d = new THREE.Object3D(), fx = u.neons.map(c => new THREE.InstancedMesh(geo('luminaireTunnel'), mat('peinture', { lum: 1, c, fog: false }), Math.ceil(cT / LUM_PAS))), nf = [0, 0];
      for (let i = T.t0 + 2, k = 0; i < T.t1 - 1; i += LUM_PAS, k++) {
        const s = S[i % N], sd = k & 1 ? 1 : -1, x = s.x - s.tz * sd * (tw(s) - 1.7), z = s.z + s.tx * sd * (tw(s) - 1.7), yl = FT ? plaf(s, tw(s) - 1.7) - 0.15 : 7.85;
        if (FT && ouvert(i - T.t0)) continue;
        if (!SANS.has('lumieres')) lum(i % N, x, s.y + yl - 0.65, z, u.neons[k & 1], 21, 3, 1);
        if (SANS.has('luminaires')) continue;
        d.position.set(x, s.y + yl, z); d.rotation.set(0, across(s), 0); d.updateMatrix(); fx[k & 1].setMatrixAt(nf[k & 1]++, d.matrix);
        if (k % 6 === 3) pose('boitierSecours', mat('peinture', { lum: 1, c: u.portail }), scene, [s.x - s.tz * (tw(s) - 0.1), s.y + 2.6, s.z + s.tx * (tw(s) - 0.1)]).rotation.y = across(s); // boîtier de secours lumineux sur la paroi de droite
      }
      fx.forEach((m, c) => { m.count = nf[c]; scene.add(m); });
    }
    if (!FT) {
      sol = ribbon(T.t0, cT, -W, 0, W, 0, tunMats[0], 32);
      ribbon(T.t0, cT, -W, 8, -W, 0, tunMats[1]); ribbon(T.t0, cT, W, 8, W, 0, tunMats[2]); ribbon(T.t0, cT, -W, 8, W, 8, tunMats[3]);
      for (const [oa, ya, ob, yb] of [[-W - 1.5, 10, -W - 1.5, -u.coque], [W + 1.5, 10, W + 1.5, -u.coque], [-W - 1.5, 10, W + 1.5, 10]]) ribbon(T.t0, cT, oa, ya, ob, yb, concrete).castShadow = true;
    } else {
      const ng = s => -tw(s), ps = tw, dh = s => hh(s) + 2, NV = 10; // voûte : NV facettes d'une demi-ellipse, des naissances (hm) à la clé (hh)
      sol = ribbon(T.t0, cT, ng, 0, ps, 0, tunMats[0], 32);
      if (!SANS.has('parois')) { ribbon(T.t0, cT, ng, hm, ng, 0, tunMats[1]); ribbon(T.t0, cT, ps, hm, ps, 0, tunMats[2]); }
      if (!SANS.has('parois')) for (const sg of [-1, 1]) ribbon(T.t0, cT, s => sg * (tw(s) + 1.5), dh, s => sg * (tw(s) + 1.5), -u.coque, concrete).castShadow = true;
      if (!SANS.has('parois')) for (const [a, n] of pans) { // (chaque facette est un ruban à part, fondu ensuite avec ceux de sa matière : voir « fusion du décor fixe »)
        for (let j = 0; j < NV; j++) { const x = q => s => -tw(s) * Math.cos(Math.PI * q / NV), y = q => s => hm(s) + vt(s) * Math.sin(Math.PI * q / NV); ribbon(T.t0 + a, n, x(j), y(j), x(j + 1), y(j + 1), tunMats[3]); }
        ribbon(T.t0 + a, n, s => -tw(s) - 1.5, dh, s => tw(s) + 1.5, dh, concrete).castShadow = true;
      }
      if (u.rayons) for (const [fa, fb] of u.ouv || []) { // une colonne de lumière par ouverture, penchée vers l'astre, et la tache de lumière qu'elle pose au sol
        const ka = Math.ceil(fa * cT), kb = Math.floor(fb * cT), s = S[(T.t0 + (ka + kb >> 1)) % N], ax = new V3(0, 1, 0).lerp(SD, 0.35).normalize(), h = hh(s), L = h / ax.y;
        const r = Math.max(1, Math.min(tw(s) * 0.7, Math.hypot(S[(T.t0 + kb) % N].x - S[(T.t0 + ka) % N].x, S[(T.t0 + kb) % N].z - S[(T.t0 + ka) % N].z) * 0.45));
        const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.25, L, 16, 1, true), addMat(tx('degrade', u.rayons, 1), { opacity: u.rayonsK ?? 0.55, polygonOffset: false }));
        m.quaternion.setFromUnitVectors(new V3(0, -1, 0), ax.clone().negate()); m.position.set(s.x, s.y + h, s.z).addScaledVector(ax, -L / 2); m.scale.y = -1; scene.add(m); // scale.y = -1 : le dégradé vif en haut, éteint au sol
        const pied = new V3(s.x, s.y + h, s.z).addScaledVector(ax, -L); lum((T.t0 + (ka + kb >> 1)) % N, pied.x, s.y + 2.5, pied.z, u.rayons, r * 2.5, 2); // le pied de la colonne, au sol
      }
    }
    if (MV) { tunMats[0].userData.mo = 1; tunMats[0].userData.mo0 = T.t0; if (SSR) { tunMats[0].userData.mou = 1; sol.geometry.setAttribute('mou', new THREE.Float32BufferAttribute(Array.from({ length: (cT + 1) * 2 }, (_, j) => mouAt((T.t0 + (j >> 1)) % N)), 1)); } } // th.mouilleVisible : le sol du tunnel lit aussi MOT
    const pm = mat('peinture', { lum: 1, c: u.portail });
    if (!SANS.has('portails')) for (const i of [T.t0, T.t1]) { // portails lumineux
      const s = S[i], g = new THREE.Group(); g.position.set(s.x, s.y, s.z); g.rotation.y = across(s); scene.add(g);
      pose('portailTunnel', { portail: pm }, g, [0, 0, 0], tw(s)); if (FT) g.scale.y = hh(s) / 8;
    }
  }
  const FEUX = []; // les trois feux du portique, un par chiffre du décompte
  { // ligne et portique de départ
    const s = S[0], g = new THREE.Group(); g.position.set(s.x, s.y, s.z); g.rotation.y = across(s); scene.add(g);
    const css = n => '#' + n.toString(16).padStart(6, '0'), acc = css(TH.depart[0]), ossature = css(TH.depart[1]);
    pose(TH.depart[3] || 'depart', { // th.depart[3] : autre forme de portique, mêmes zones (chapada : bambou) ; sans lui, le portique d'acier
      sol: mat('damierBande', { lum: 1, net: 1 }, TH.depart[2], 1), damier: mat('damierBande', { lum: 1, net: 1 }, TH.depart[2], 0.45),
      beton: mat('beton'), acier: mat('acier', { c: TH.depart[1] }), treillis: mat('treillisPortique', { alphaTest: 0.5, side: THREE.DoubleSide }, ossature),
      nom: mat('bandeauNom', { lum: 1, net: 1 }, acc, M.nom, TH.depart[2]), boitier: mat('matGris'), feu0: FEUX[0] = mat('peinture', { lum: 1 }), feu1: FEUX[1] = mat('peinture', { lum: 1 }), feu2: FEUX[2] = mat('peinture', { lum: 1 }), lampe: mat('lampe', { lum: 1 }),
    }, g, [0, 0, 0], W);
    lum(0, s.x, s.y + 8, s.z, 0xfff2d0, 18, 0.5); // éclairage du portique : discret, sinon le départ éblouit
  }
  { // chevrons à l'extérieur des virages, piles du viaduc, tubes néon en bord de route (repères de vitesse)
    const dummy = new THREE.Object3D();
    const sg = [0, 1].map(f => new THREE.InstancedMesh(geo('chevron'), mat(TH.chevTex || 'chevron', { lum: 1, side: THREE.DoubleSide, retro: 1.5 }, f), 600)), cnt = [0, 0]; // rétroréfléchissants : ils s'allument dans les phares
    const poteaux = new THREE.InstancedMesh(geo('boite', 0.14, 5.4, 0.14), mat('matGris'), 1200); let npo = 0; // deux poteaux sous chaque panneau de virage : c'est un vrai panneau, pas un repère d'interface (en tunnel, il est fixé à la paroi)
    const piles = new THREE.InstancedMesh(habille(geo('pileViaduc'), concrete), concrete, Math.ceil(N / 30) + 1); let np = 0; // une pile tous les 30 échantillons au plus (60 places débordaient sur wangan : les piles en trop devenaient des pièces NaN dans la fusion)
    const tubes = [glowM, glowC].map(m => new THREE.InstancedMesh(geo('tubeNeon'), m, 200)), nt = [0, 0];
    const streaks = ['#ff2bd6', '#00f0ff'].map(c => new THREE.InstancedMesh(geo('refletTube'), addMat(tx('degrade', c)), 200));
    for (let i = 0; i < N; i++) {
      const s = S[i], nx = -s.tz, nz = s.tx, inT = zone(i, 0) === 1;
      dummy.scale.set(1, 1, 1); dummy.rotation.set(0, across(s), 0);
      if (TH.tubes && i % 10 === 0 && !inT) { const k = i / 10, sd = (k >> 1) & 1 ? 1 : -1; lum(i, s.x + nx * sd * (W - 0.5), s.y + 3, s.z + nz * sd * (W - 0.5), [0xff2bd6, 0x00f0ff][(k & 1) ^ (sd > 0 ? 1 : 0)], 17, 0.8); } // un tube sur deux éclaire vraiment : magenta, cyan, d'un côté puis de l'autre
      if (TH.tubes && i % 10 === 0 && !inT) for (const sd of [-1, 1]) {
        const c = (i / 10 & 1) ^ (sd > 0 ? 1 : 0);
        dummy.position.set(s.x + nx * sd * (W + 0.9), s.y + 3.5, s.z + nz * sd * (W + 0.9)); dummy.updateMatrix(); tubes[c].setMatrixAt(nt[c], dummy.matrix);
        dummy.rotation.order = 'YXZ'; dummy.rotation.set(-Math.PI / 2, across(s), 0); dummy.scale.set(sd > 0 ? -1 : 1, 1, 1); // à plat, côté lumineux vers le tube
        dummy.position.set(s.x + nx * sd * (W - 3.2), s.y + 0.05, s.z + nz * sd * (W - 3.2)); dummy.updateMatrix(); streaks[c].setMatrixAt(nt[c]++, dummy.matrix);
        dummy.rotation.order = 'XYZ'; dummy.rotation.set(0, across(s), 0); dummy.scale.set(1, 1, 1);
      }
      if (TH.piles != null && i % 30 === 0 && !inT) { const b = TH.piles + 1; dummy.position.set(s.x, (s.y - 1 + b) / 2, s.z); dummy.scale.set(1, Math.max(0.1, s.y - 1 - b), 1); dummy.updateMatrix(); piles.setMatrixAt(np++, dummy.matrix); dummy.scale.set(1, 1, 1); }
      if (TH.chev && i % 6 === 0 && Math.abs(s.k) > (TH.chevK || 0.006) && cnt[s.k > 0 ? 0 : 1] < 600 && !chevSauf.some(z => z(i, 1) >= 1)) {
        const f = s.k > 0 ? 0 : 1, side = s.k > 0 ? -1 : 1, off = inT ? W - 0.2 : W + 0.6;
        dummy.position.set(s.x + nx * side * off, s.y + 3, s.z + nz * side * off); dummy.lookAt(s.x, s.y + 3, s.z); dummy.updateMatrix();
        sg[f].setMatrixAt(cnt[f]++, dummy.matrix);
        if (!inT) for (const u of [-1.8, 1.8]) { dummy.position.set(s.x + nx * side * (off + 0.1) + s.tx * u, s.y + 1.45, s.z + nz * side * (off + 0.1) + s.tz * u); dummy.updateMatrix(); poteaux.setMatrixAt(npo++, dummy.matrix); } // du sol (1,25 m sous la chaussée) au haut du panneau
      }
    }
    sg.forEach((m, f) => { m.count = cnt[f]; scene.add(m); }); poteaux.count = npo; scene.add(poteaux); piles.count = np; scene.add(piles);
    tubes.forEach((m, c) => { m.count = nt[c]; scene.add(m); streaks[c].count = nt[c]; scene.add(streaks[c]); repli(streaks[c]); });
  }

  // reflets sur la route mouillée : liseré des glissières dehors, néons des murs dans l'échangeur (ceux-là battent avec la musique)
  for (const sd of [-1, 1]) {
    if (TH.reflets) repli(ribbon(T.t1, cO, sd * W, 0.04, sd * (W - 4), 0.04, addMat(tx('degrade', TH.reflets))));
    if (T.tun && TH.tun.reflets) { const m = addMat(tx('degrade', TH.tun.reflets[sd < 0 ? 0 : 1])); ribbon(T.t0, cT, sd * W, 0.04, sd * (W - 5), 0.04, m); tunMats.push(m); }
  }
  if (TH.pubs) { // portiques au-dessus de la route, avec écran publicitaire qui défile
    for (const [i, txt] of ['ネオン // SPEED // 危険 // ', '電脳 CITY ★ 24H ★ ', '>>> NOODLE BAR >>> ホテル '].entries()) {
      const c = ['#ff2bd6', '#00f0ff', '#fcee0a'][i];
      adMats.push(mat('ecranPub', LUMI, c, txt));
    }
    for (let i = 70, k = 0; i < N; i += 90) {
      if (zone(i, 40) > 0) continue;
      const s = S[i], gr = new THREE.Group(); gr.position.set(s.x, s.y, s.z); gr.rotation.y = across(s); scene.add(gr);
      lum(i, s.x, s.y + 9, s.z, [0xff2bd6, 0x00f0ff, 0xfcee0a][k % 3], 24, 1.2); // l'écran éclaire la route sous lui
      pose('portiquePub', { ecran: adMats[k++ % 3], beton: concrete }, gr, [0, 0, 0], W);
    }
  }

  fond && await souffle();
  // ---------- décor de la carte : decors-<carte>.js ----------
  const VAP = [], vapeur = (x, y, z) => VAP.push([x, y, z]); // bouches de vapeur déclarées par le décor (panaches : voir flou)
  const beams = [], decorTick = window.DECORS[TH.decor]({ THREE, scene, T, S, N, W, M, TH, ribbon, rnd, across, zone, lum, geo, mat, tx, addMat, box, concrete, beams, pose, zones, habille, vapeur, flou: (...a) => flou(...a), temps: () => race ? -1 : tTraf }); // flou : les particules du jeu ouvertes aux décors, à appeler depuis le tick (elles n'existent pas encore au chargement) ; le décor appelle lui-même step(dt) // pas de trafic en course : les adversaires ne savent pas l'éviter

  // pluie : traînées nettes qui s'allongent et foncent vers la caméra avec la vitesse, penchées par le vent ; tête claire, queue qui s'éteint (mélange additif, aucun flou)
  // force 1 = 400 gouttes ; au-delà (averse, zones de pluie > 1), plus de gouttes, plus longues ; et des impacts qui rejaillissent sur la chaussée devant la voiture
  const RN = 2400, rainP = new Float32Array(RN * 3), rainGeo = new THREE.BufferGeometry();
  const alea = (k => () => (k = k * 16807 % 2147483647) / 2147483647)(11); // hasard à part : la suite de rnd ne bouge pas (seules les 400 premières gouttes la tirent, comme avant)
  for (let i = 0; i < RN; i++) { const r = i < 400 ? rnd : alea; rainP.set([r() * 80 - 40, r() * 30, r() * 80 - 40], i * 3); }
  const rainB = Float32Array.from({ length: RN }, () => 0.45 + 0.55 * alea()); // proches et lointaines : des gouttes plus ou moins claires ; la teinte est refaite à chaque image (pluie éclairée, voir vueFrame)
  // tout se calcule dans le shader : chaque goutte garde sa place de départ (position) et sa clarté ; la vue n'envoie que son décalage cumulé (pluieO), la vitesse, le vent et les luminaires
  { const P = new Float32Array(RN * 6), Q = new Float32Array(RN * 4); for (let i = 0; i < RN; i++) { P.set(rainP.subarray(i * 3, i * 3 + 3), i * 6); P.set(rainP.subarray(i * 3, i * 3 + 3), i * 6 + 3); Q.set([rainB[i], 0, rainB[i], 1], i * 4); }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(P, 3)); rainGeo.setAttribute('qb', new THREE.BufferAttribute(Q, 2)); }
  const RU = { uO: { value: new V3() }, uV: { value: new V3() }, uF: { value: new THREE.Vector2() }, uGl: { value: 0 }, uAmb: { value: 0 }, uHph: { value: 0 }, uOp: { value: 1 }, uNL: { value: 0 },
    uRL: { value: new Float32Array(8 * 4) }, uRC: { value: new Float32Array(8 * 3) } };
  const rain = new THREE.LineSegments(rainGeo, new THREE.ShaderMaterial({ uniforms: RU, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
    vertexShader: `attribute vec2 qb; uniform vec3 uO, uV; uniform vec2 uF; uniform float uGl, uAmb, uHph; uniform int uNL; uniform vec4 uRL[8]; uniform vec3 uRC[8]; varying vec3 vC;
      void main() {
        vec3 p = position - uO; p.xz = mod(p.xz + 40., 80.) - 40.; p.y = mod(p.y, 30.); // la goutte recule de la vitesse de la voiture, tombe, et revient de l'autre côté du cube de 80 m
        vec3 c = vec3(.62, .8, 1.) * uAmb; float f = dot(p.xz, uF);
        if (f > 1. && f < 40. && p.y < 3. && abs(p.z * uF.x - p.x * uF.y) < 1.5 + f * .3) c += vec3(1., .95, .82) * (uHph * (1. - f / 40.)); // phares : cône devant la voiture, bas
        for (int k = 0; k < 8; k++) { if (k >= uNL) break; vec3 d = p - uRL[k].xyz; float w = 1. - dot(d, d) * uRL[k].w; if (w > 0.) c += uRC[k] * (.3 * w * w); }
        c *= qb.x;
        if (qb.y > .5) { c *= vec3(.13, .15, .2); p += vec3(uV.x * .035 + uGl * .12, uGl, uV.z * .035 + uGl * .05); } // queue éteinte, penchée par le vent et étirée par la vitesse
        vC = c; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
      }`,
    fragmentShader: 'uniform float uOp; varying vec3 vC; void main() { gl_FragColor = vec4(vC, uOp); }' }));
  rain.frustumCulled = false; scene.add(rain);
  const SN = 300, splP = new Float32Array(SN * 3), splC = new Float32Array(SN * 3), splA = new Float32Array(SN).map(() => alea() * 0.14), splD = new Float32Array(SN), splGeo = new THREE.BufferGeometry(); // impacts : vie de 0,14 s
  splGeo.setAttribute('position', new THREE.BufferAttribute(splP, 3)); splGeo.setAttribute('color', new THREE.BufferAttribute(splC, 3));
  const splash = new THREE.Points(splGeo, new THREE.PointsMaterial({ size: 2, sizeAttenuation: false, vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false }));
  splash.frustumCulled = false; scene.add(splash);

  fond && await souffle();
  // ---------- voiture : géométrie dans formes-voitures.js, livrée dans textures-voitures.js ; ici le placement, les roues qui tournent et braquent, les feux stop, le roulis ----------
  const carG = new THREE.Group(), body = new THREE.Group(); carG.add(body); carG.userData.dyn = 1; scene.add(carG); // dyn : ne pas fondre dans le décor fixe (voir « fusion »)
  const L = CARD.look, K = L.type || 'gtr'; // le modèle de formes-voitures.js
  const VO = FORMES.voiture(K), livree = col => mat('livree', { gloss: 0.9 }, VO.plan, col, L.bandes || 0); // une livrée par teinte : celle du joueur, une par adversaire
  const carMat = livree(L.col), brakeMat = new THREE.MeshBasicMaterial({ color: 0x8a1020 }), lampMat = new THREE.MeshBasicMaterial({ color: 0xfff2d0 });
  const part = (ge, mat, x, y, z, parent = body) => { const m = new THREE.Mesh(ge, mat); m.position.set(x, y, z); parent.add(m); return m; };
  const peau = { caisse: carMat, noir: gloss(mat('garniture'), 0.4), phare: lampMat, feu: brakeMat };
  for (const zn in VO.zones) part(VO.zones[zn], peau[zn], 0, 0, 0);
  const [xr, xf, zr, zf, rr, tw] = VO.roues, wheelGeo = FORMES.roueVoiture(rr, tw), roueMat = mat('roueVoiture', {}, K);
  for (const i of [0, 1]) for (const sg of [-1, 1]) { // enfants 1 à 4 de carG, les deux roues avant en dernier : fxVoiture les fait tourner et braquer
    const st = new THREE.Group(); st.position.set(i ? xf : xr, rr, sg * (i ? zf : zr)); carG.add(st);
    part(wheelGeo, roueMat, 0, 0, 0, st);
  }
  carG.traverse(o => { o.castShadow = o.material !== lampMat && o.material !== brakeMat; }); // phares et feux (pièces de 20 cm) : leur ombre ne se voit pas
  // reflets : le vrai décor vu depuis la voiture du joueur 1, dans une cube map de 32 px par face, une face toutes les six images (refFace, chacune près de 100 passes de dessin : toutes les deux, elle coûtait 0,25 à 0,5 ms de GPU par image en moyenne ; le cube entier est refait en 0,3 s à 120 images/s, avant le rendu de la vue 1) ;
  // vue à 300 m seulement (à 3° le pixel, plus loin ne fait presque rien et coûte des passes de dessin) : le ciel et l'astre y sont ramenés au dixième, en deçà ;
  // la caisse l'ajoute à sa couleur (envMap), dosée pixel par pixel par un masque tiré de la livrée : vitrage (sombre, bleuté) fort, peinture modérée, joints et cadres presque rien.
  // Les rivaux et les autres joueurs partagent la même cube map : prise à la voiture du joueur 1, elle ne leur est pas exacte, mais à leur taille à l'écran on ne le voit pas
  const CUBE = new THREE.WebGLCubeRenderTarget(32, { generateMipmaps: false, minFilter: THREE.LinearFilter }), refCam = new THREE.CubeCamera(0.5, 300, CUBE); refCam.coordinateSystem = renderer.coordinateSystem; refCam.updateCoordinateSystem(); refCam.children.forEach(c => { c.layers.enable(OMBD); c.layers.enable(OMBI); }); // r187 n'oriente les six faces que dans update(), que le jeu n'appelle pas (une face par image) // les objets mobiles qui portent une ombre
  let refF = 0;
  const refFace = () => { // la voiture du joueur 1 ne se voit pas dans sa propre cube map ; l'ombre du soleil n'est pas recalculée pour si peu
    if (refF++ % 6) return; const f = (refF / 6 | 0) % 6, P = refCam.position, sp = sky.position.clone(), dp = sunDisc.position.clone(), ds = sunDisc.scale.x, ks = sky.scale.x;
    P.set(carG.position.x, carG.position.y + 0.9, carG.position.z); refCam.updateMatrixWorld(true);
    sky.position.copy(P); sky.scale.setScalar(0.1); sunDisc.position.copy(P).addScaledVector(SD, 200); sunDisc.scale.setScalar(ds / 10); sky.updateMatrixWorld(); sunDisc.updateMatrixWorld();
    const vis = carG.visible, rt = renderer.getRenderTarget(); carG.visible = false;
    renderer.setRenderTarget(CUBE, f); renderer.render(scene, refCam.children[f]);
    carG.visible = vis; renderer.setRenderTarget(rt);
    sky.position.copy(sp); sky.scale.setScalar(ks); sunDisc.position.copy(dp); sunDisc.scale.set(ds, ds, 1); sky.updateMatrixWorld(); sunDisc.updateMatrixWorld();
  };
  const reflete = m => { // le masque : rouge = part du reflet (specularMap de three)
    const src = m.map.image.getContext('2d').getImageData(0, 0, 128, 128).data;
    m.specularMap = tex(128, 128, g => { const im = g.createImageData(128, 128);
      for (let i = 0; i < src.length; i += 4) { const r = src[i], v = src[i + 1], b = src[i + 2], l = (r * 0.3 + v * 0.59 + b * 0.11) / 255, k = l < 0.32 ? (b > r + 6 ? 0.9 : 0.08) : 0.45; im.data.fill(k * 255, i, i + 3); im.data[i + 3] = 255; }
      g.putImageData(im, 0, 0); });
    return Object.assign(m, { envMap: CUBE.texture, combine: THREE.AddOperation, reflectivity: 1 });
  };
  reflete(carMat);
  // encombrement de la voiture : la boîte d'ombre de la lumière dynamique (BOITE) et le fantôme en prennent les dimensions
  const ENC = new THREE.Box3().setFromObject(carG), ENCt = ENC.getSize(new V3()), ENCc = ENC.getCenter(new V3());

  // traînées lumineuses des feux arrière : deux rubans tirés sur les dernières positions
  // freins : sur la roue, le disque et l'étrier (leurs teintes exactes dans la texture de textures-voitures.js) rougeoient quand ils chauffent ; au sol, derrière la voiture, une lueur rouge additive tant que les feux stop sont allumés
  roueMat.emissiveMap = tex(64, 64, g => { const src = roueMat.map.image, d = (g.drawImage(src, 0, 0), g.getImageData(0, 0, 64, 64)), p = d.data;
    for (let i = 0; i < p.length; i += 4) { const on = [[38, 38, 44], [106, 32, 36]].some(([r, v, b]) => Math.abs(p[i] - r) + Math.abs(p[i + 1] - v) + Math.abs(p[i + 2] - b) < 8); p[i] = p[i + 1] = p[i + 2] = on ? 255 : 0; }
    g.putImageData(d, 0, 0); });
  const solMat = new THREE.MeshBasicMaterial({ color: 0xff2030, map: tex(32, 32, g => { const r = g.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, '#fff'); r.addColorStop(1, '#000'); g.fillStyle = r; g.fillRect(0, 0, 32, 32); }), blending: THREE.AdditiveBlending, transparent: true, opacity: 0, depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  const flames = [-0.5, 0.5].map(z => { const g = new THREE.ConeGeometry(0.17, 1.6, 5); g.translate(0, 0.8, 0); const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0x60d0ff, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false })); m.rotation.z = Math.PI / 2; m.position.set(ENC.min.x, 0.42, z); m.visible = false; carG.add(m); return m; }); // pointe vers l'arrière
  { const sol = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 3.6), solMat); sol.rotation.x = -Math.PI / 2; sol.position.set(ENC.min.x - 1.4, 0.05, 0); sol.visible = false; carG.add(sol); } // enfant 7 de carG, après les flammes
  const TN = 18, trailI = [], trailMat = addMat(null, { vertexColors: true, polygonOffset: false });
  for (let l = 0; l < 2; l++) for (let k = 0; k < TN - 1; k++) { const a = (l * TN + k) * 2; trailI.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const trainee = () => { // un jeu de traînées par voiture humaine (voir HUM) ; caché tant qu'aucune vue ne le tient : ses dernières positions et son ruban
    const P = new Float32Array(TN * 12), C = new Float32Array(TN * 12), geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(P, 3)); geo.setAttribute('color', new THREE.BufferAttribute(C, 3)); geo.setIndex(trailI);
    const tr = new THREE.Mesh(geo, trailMat); tr.frustumCulled = tr.visible = false; scene.add(tr);
    const gP = new Float32Array(GN * 12), gC = new Float32Array(GN * 16), gGeo = new THREE.BufferGeometry(), gm = new THREE.Mesh(gGeo, gmMat); // traces de gomme
    gGeo.setAttribute('position', new THREE.BufferAttribute(gP, 3)); gGeo.setAttribute('color', new THREE.BufferAttribute(gC, 4)); gGeo.setIndex(gmI); gm.frustumCulled = false; scene.add(gm);
    return { hist: [], P, C, geo, tr, gR: [[], []], gOn: [0, 0], gP, gC, gGeo, vAcc: 0 };
  };
  // traces au sol : un ruban par roue arrière, un point tous les GD mètres au plus, gardé toute la course (les GN derniers points de chaque roue)
  // TR : ce que chaque surface garde (docs/SPEC-CASSE.md) : gomme noire sur le bitume sec, sillons sur la terre et ornières dans la neige (même en roulant), rien sur la glace ni le mouillé
  const TR = { sec: { c: [0.02, 0.02, 0.025], a: 0.7, roule: 0, w: 1 }, terre: { c: [0.2, 0.12, 0.06], a: 0.8, roule: 0.38, w: 1.25 }, neige: { c: [0.55, 0.6, 0.7], a: 0.8, roule: 0.4, w: 1.35 } };
  const genre = q => q.vir >= 0.2 && q.vir < 0.4 && q.roul > 0.1 ? 'neige' : q.roul >= 0.2 && q.vir < 0.2 ? 'terre' : 'sec'; // neige : glissante et roulante ; terre : roulante, peu glissante (un fondu terre-bitume reste de la terre, pas de la neige)
  const trSol = q => q.vir >= 0.4 || q.aq > 0.05 ? null : TR[genre(q)]; // rien sur la glace ni le mouillé (la bruine de la ville, à 30 % du mouillé, garde la gomme)
  const GN = 500, GD = 0.8, gmI = [], gmMat = new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); // DoubleSide : les rubans tournent leur face vers le bas (gauche, droite, puis le point d'avant) ; sans lui, on ne les voyait jamais
  for (let l = 0; l < 2; l++) for (let k = 0; k < GN - 1; k++) { const a = (l * GN + k) * 2; gmI.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }

  // particules additives : fumée de pneus, étincelles contre les murs, flammes d'échappement
  const PN = 320, pP = new Float32Array(PN * 3), pC = new Float32Array(PN * 3), pV = new Float32Array(PN * 3), pB = new Float32Array(PN * 3), pL = new Float32Array(PN), pM = new Float32Array(PN), pGv = new Float32Array(PN), pGeo = new THREE.BufferGeometry();
  let pi = 0;
  pGeo.setAttribute('position', new THREE.BufferAttribute(pP, 3)); pGeo.setAttribute('color', new THREE.BufferAttribute(pC, 3));
  const parts = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 1.1, vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false })); parts.frustumCulled = false; scene.add(parts);
  // nuages flous : des disques opaques qui grossissent en s'effaçant (en additif ils se lisaient en carrés clairs) ; la poussière des cartes en terre (th.poussiere = sa teinte) et la fumée des pneus
  const dEch = { value: 135 };
  // frein : freinage horizontal (1/s) ; 0 : le nuage garde la vitesse de son émetteur ; taille : facteur du diamètre ; pres : en deçà de 2 × pres mètres de la caméra le disque s'efface (rien n'est collé à l'objectif)
  const flou = (N, col, op, vie = 1.4, frein = 3, taille = 1, pres = 0) => { const P = new Float32Array(N * 3), V = new Float32Array(N * 3), A = new Float32Array(N).fill(1), g = new THREE.BufferGeometry(); let i = 0;
    g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('age', new THREE.BufferAttribute(A, 1));
    const d = new THREE.Points(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { col: { value: new THREE.Color(...col) }, ech: dEch, op: { value: op }, tl: { value: taille }, pr: { value: pres } },
      vertexShader: 'attribute float age; varying float a, f; uniform float ech, tl, pr; void main() { a = age; vec4 p = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * p; f = pr > 0.0 ? clamp(-p.z / pr - 1.0, 0.0, 1.0) : 1.0; gl_PointSize = age < 1.0 ? tl * ech * projectionMatrix[1][1] * (1.1 + 6.0 * age) / -p.z : 0.0; }',
      fragmentShader: 'varying float a, f; uniform vec3 col; uniform float op; void main() { float r = length(gl_PointCoord - 0.5) * 2.0; if (r > 1.0 || a >= 1.0) discard; gl_FragColor = vec4(col, (1.0 - r * r) * (1.0 - a) * min(1.0, 0.15 + a * 4.0) * op * f); }' })); d.frustumCulled = false; scene.add(d);
    return { d, emit(x, y, z, vx, vy, vz) { const k = i++ % N; P.set([x, y, z], k * 3); V.set([vx, vy, vz], k * 3); A[k] = 0; },
      step(dt) { const fr = Math.exp(-frein * dt); for (let k = 0; k < N; k++) if (A[k] < 1) { const j = k * 3; A[k] += dt / vie; V[j] *= fr; V[j + 2] *= fr; P[j] += V[j] * dt; P[j + 1] += V[j + 1] * dt; P[j + 2] += V[j + 2] * dt; }
        g.attributes.position.needsUpdate = g.attributes.age.needsUpdate = true; } };
  };
  const POUS = TH.poussiere && flou(480, TH.poussiere, 0.5), GERBE = TH.poussiere && T.surf.some(q => q.aq) && flou(500, [0.92, 0.93, 0.9], 0.4, 0.35), GERBE1 = GERBE && flou(900, [0.86, 0.85, 0.78], 0.45, 0.35, 0, 0.18, 2.5), ECUME = GERBE && flou(700, [0.9, 0.89, 0.83], 0.9, 0.4, 0, 0.15, 2), FUM = flou(600, [0.68, 0.68, 0.72], 0.55), poussiere = (...a) => POUS.emit(...a), FEU = TH.poussiere && TH.feuilles && (() => { /* th.feuilles : teintes des feuilles mortes que les voitures soulèvent (chapada). De petits carrés nets, opaques (les nuages flous se lisaient en halos) : ils montent, tournoient, retombent */
    const n = 260, P = new Float32Array(n * 3).fill(-1e4), V = new Float32Array(n * 3), L = new Float32Array(n), C = new Float32Array(n * 3), g = new THREE.BufferGeometry(); let i = 0;
    g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('color', new THREE.BufferAttribute(C, 3));
    const d = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.22, vertexColors: true })); d.frustumCulled = false; scene.add(d);
    return { emit(x, y, z, vx, vy, vz) { const k = i++ % n; P.set([x, y, z], k * 3); V.set([vx, vy, vz], k * 3); C.set(TH.feuilles[Math.random() * TH.feuilles.length | 0], k * 3); L[k] = 1 + Math.random() * 1.2; g.attributes.color.needsUpdate = true; },
      step(dt) { const fr = Math.exp(-2.4 * dt); for (let k = 0; k < n; k++) if (L[k] > 0) { const j = k * 3; L[k] -= dt; V[j] *= fr; V[j + 2] *= fr; V[j + 1] = Math.max(-1.3, V[j + 1] - 7 * dt);
          P[j] += (V[j] + Math.sin(L[k] * 9 + k) * 1.6) * dt; P[j + 1] += V[j + 1] * dt; P[j + 2] += (V[j + 2] + Math.cos(L[k] * 7 + k) * 1.6) * dt; if (L[k] <= 0) P[j + 1] = -1e4; }
        g.attributes.position.needsUpdate = true; } }; })();
  if (GERBE) GERBE.d.renderOrder = -4; // le nuage des autres voitures passe sous la nappe d'eau du gué (renderOrder -2 dans decors-terre.js), comme avant que la nappe ne passe sous les particules : vu de loin, elle en voile le pied
  // gerbe d'eau du gué (Spéciale des Ocres : seule carte en terre avec une zone mouillée) : derrière chaque roue avant, des gouttes en traits blancs projetées en éventail sur le côté, qui retombent, et un peu d'écume au ras de l'eau (disques à vie courte : plus longue, ils grossissent en brume) ; plus haute et plus large avec la vitesse
  //   Vue de sa propre caméra (moi : une vue la suit), la même gerbe bouchait l'écran : ses disques, freinés, restaient derrière la voiture et grossissaient devant l'objectif. Pour elle, l'effet est refait à l'échelle de la caméra de poursuite :
  //   deux éventails de petits disques sans frein (GERBE1) lancés de chaque côté à la vitesse de la voiture, des gouttes qui montent et retombent à côté d'elle, une écume basse (ECUME) qui suit les roues arrière sur 3 à 4 m ;
  //   tout disque à moins de 8 m de la caméra s'efface (pres) : le rendu basse résolution du jeu en ferait des pavés, et les gouttes restent sous le seuil du bloom
  //   Débit par seconde, pas par image (nb : combien à cette image, réglé sur 60 images/s) : à 10 images/s (outils/captures.html) la gerbe avait six fois moins d'eau qu'en jeu.
  //   Chaque particule naît à un instant tiré dans l'image (b secondes avant sa fin) : posée là où elle serait, elle ne s'empile pas avec les autres sur un seul point
  //   fort : intensité de la gerbe du joueur, 1 en régime ; plus forte à l'entrée dans l'eau (le coup d'étrave) et en sortie (la vague que la voiture pousse devant elle retombe)
  const gerbe = (c, v, moi, dt, fort = 1) => { const fx = Math.cos(c.th), fz = Math.sin(c.th), k = Math.min(1, v / 40), nb = x => { const f = x * dt * 60; return (f | 0) + (Math.random() < f % 1); };
    const naît = (f, x, y, z, vx, vy, vz) => { const b = Math.random() * dt; f(x + (vx - c.vx) * b, y + vy * b, z + (vz - c.vz) * b, vx, vy, vz); };
    if (moi) { for (const sd of [-1, 1]) { const fc = fort * (0.65 + Math.random() * 0.7), rx = -fz * sd, rz = fx * sd, px = c.x + fx * 0.9 + rx * 1.1, pz = c.z + fz * 0.9 + rz * 1.1, ex = c.x - fx * 1.3 + rx * 0.8, ez = c.z - fz * 1.3 + rz * 0.8; // rx, rz : vers l'extérieur de ce côté
        for (let j = nb(1.5 * fc); j--;) { const l = (2 + Math.random() * 4 * fc) * k, av = 0.9 + Math.random() * 0.08; naît(GERBE1.emit, px + jit(0.3), c.y + 0.3, pz + jit(0.3), c.vx * av + rx * l, (2.5 + Math.random() * 3) * k, c.vz * av + rz * l); }
        for (let j = nb(2.5 * fc); j--;) { const l = (2.5 + Math.random() * 4) * k, av = 0.86 + Math.random() * 0.1; naît((x, y, z, vx, vy, vz) => trait(x, y, z, vx, vy, vz, 0.6, 16, 0.012, [0.82, 0.84, 0.8], c.y + 0.03), px, c.y + 0.35, pz, c.vx * av + rx * l, (2.5 + Math.random() * 3) * k * Math.min(1.6, fc), c.vz * av + rz * l); } // gouttes : traits courts (k 0,012 : le trait suit la vitesse, qui est surtout celle de la voiture ; plus long, il devenait une ligne de vitesse), lancées à 1 m environ, elles retombent en arc à côté de la voiture
        for (let j = nb(3 * fc); j--;) naît(ECUME.emit, ex + jit(0.4), c.y + 0.08, ez + jit(0.4), c.vx * 0.85 + rx * 2, 0.3, c.vz * 0.85 + rz * 2); } // écume : au ras de l'eau derrière les roues arrière, elle s'efface plus près de la caméra que le reste (pres 2)
      return; }
    for (const sd of [-1, 1]) for (let j = nb(2 + 4 * k | 0); j--;) { const ox = c.x + fx * 1.1 - fz * sd * 0.9, oz = c.z + fz * 1.1 + fx * sd * 0.9, l = sd * (4 + Math.random() * 7) * k;
      naît(GERBE.emit, ox + jit(0.6), c.y + 0.25, oz + jit(0.6), c.vx * 0.45 - fz * l, (2 + Math.random() * 4.5) * k, c.vz * 0.45 + fx * l);
      for (let d = 0; d < 5; d++) naît((x, y, z, vx, vy, vz) => trait(x, y, z, vx, vy, vz, 0.9, 12, 0.09, [1, 1, 0.95], c.y + 0.05), ox, c.y + 0.2, oz, c.vx * 0.5 - fz * l * 1.4 + jit(3), (3 + Math.random() * 6) * k, c.vz * 0.5 + fx * l * 1.4 + jit(3)); } };
  // vapeur des bouches d'égout : un panache lent par bouche (4 s pour monter de 5 m), teinté par le luminaire le plus proche à moins de 30 m (les néons)
  const VAPS = VAP.map(([x, y, z]) => { const c = new THREE.Color(0.2, 0.2, 0.23); let lb = null, db = 900;
    for (const l of LUMS) { const d = (l.x - x) ** 2 + (l.z - z) ** 2; if (d < db) { db = d; lb = l; } }
    if (lb) c.lerp(lb.c.clone().multiplyScalar(0.6 / Math.max(lb.c.r, lb.c.g, lb.c.b, 1e-3)), 0.7 * (1 - Math.sqrt(db) / 30));
    return { f: flou(40, [c.r, c.g, c.b], 0.18, 4), x, y, z, t: 0 }; });
  // traits additifs, étirés le long de leur vitesse, tête vive et queue éteinte : étincelles du palier de glisse, lignes de vitesse de la nitro
  const VN = 400, VK = 11, vP = new Float32Array(VN * 6), vCo = new Float32Array(VN * 6), vS = new Float32Array(VN * VK), vGeo = new THREE.BufferGeometry(); let vi = 0;
  vGeo.setAttribute('position', new THREE.BufferAttribute(vP, 3)); vGeo.setAttribute('color', new THREE.BufferAttribute(vCo, 3));
  const vites = new THREE.LineSegments(vGeo, new THREE.LineBasicMaterial({ vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false })); vites.frustumCulled = false; scene.add(vites);
  function trait(x, y, z, vx, vy, vz, vie, grav, k, rgb, sol = -1e9) { const i = vi++ % VN; vP.set([x, y, z], i * 6); vS.set([vx, vy, vz, vie, vie, grav, k, sol, ...rgb], i * VK); } // k : longueur du trait en secondes de vitesse ; sol : hauteur où il rebondit
  function emit(x, y, z, vx, vy, vz, life, r, gg, b, grav) { const i = pi++ % PN; pP.set([x, y, z], i * 3); pV.set([vx, vy, vz], i * 3); pB.set([r, gg, b], i * 3); pL[i] = pM[i] = life; pGv[i] = grav; }

  let flashT = 0, nextFlash = 6;
  const FLASH = new THREE.Color(0x8fa0ff), jit = a => (Math.random() - 0.5) * a;
  // effets attachés à la voiture humaine du joueur vu (son modèle vu.hu), celle que suit sa vue, avec l'état lissé de cette vue : pose du modèle, roues, feu stop, traînées, poussière de réception, fumée, étincelles, flammes.
  // Tout est dans la scène, donc visible de toutes les vues
  function fxVoiture(vu, dt) {
    const { car, carY, lm, inp, hit, land, hu } = vu, { hist, P, C, geo } = hu, sp = Math.hypot(car.vx, car.vz), fx = Math.cos(car.th), fz = Math.sin(car.th), rx = -fz, rz = fx;
    hu.g.rotation.order = 'YZX'; // cap, puis tangage, puis roulis autour de l'axe de la voiture
    hu.g.position.set(car.x, carY, car.z); hu.g.rotation.set(vu.roll, -car.th, vu.pitch); hu.body.rotation.x = car.steer * Math.min(1, sp / TOP) * 0.07;
    for (let i = 0; i < 4; i++) { const st = hu.roues[i]; st.children[0].rotation.z -= car.vf * dt / rr; if (i > 1) st.rotation.y = -car.steer * 0.45; }
    freins(hu.g, Math.max(inp.brake || 0, car.frA ? 0.5 : 0), sp, dt);
    // traînées
    hist.unshift([car.x + fx * ENC.min.x, carY + 0.72, car.z + fz * ENC.min.x, rx, rz]); if (hist.length > TN) hist.length = TN;
    const bst = car.boost > 0, glow = Math.min(1, sp / 15) * (inp.brake || car.frA || bst ? 1 : 0.4) * Math.min(1, pharesV / 0.4);
    for (let l = 0; l < 2; l++) for (let k = 0; k < TN; k++) {
      const h = hist[Math.min(k, hist.length - 1)], sd = l ? 0.78 : -0.78, a = (l * TN + k) * 6, f = (1 - k / TN) ** 2 * glow;
      P.set([h[0] + h[3] * sd, h[1] + 0.1, h[2] + h[4] * sd, h[0] + h[3] * sd, h[1] - 0.1, h[2] + h[4] * sd], a);
      C.set(bst ? [f * 0.2, f * 0.8, f, f * 0.2, f * 0.8, f] : [f, f * 0.08, f * 0.16, f, f * 0.08, f * 0.16], a);
    }
    geo.attributes.position.needsUpdate = geo.attributes.color.needsUpdate = true;
    // émissions
    if (land > 3) for (let i = 0; i < Math.min(14, land * 1.5); i++) { const sd = i & 1 ? 1 : -1, av = i & 2 ? 1.4 : -1.4; // réception : une bouffée de poussière chassée de chaque roue, vers l'extérieur
      emit(car.x + fx * av - fz * sd * 0.9, carY + 0.15, car.z + fz * av + fx * sd * 0.9, car.vx * 0.6 - fz * sd * (3 + Math.random() * 5), 0.5 + Math.random() * 2, car.vz * 0.6 + fx * sd * (3 + Math.random() * 5), 0.35, 0.2, 0.19, 0.17, -1); }
    if ((car.slide > 0.3 || car.frA || car.dd) && sp > 10 && !car.air) for (const sd of [-0.9, 0.9]) FUM.emit(car.x - fx * 1.4 + rx * sd + jit(0.4), carY + 0.25, car.z - fz * 1.4 + rz * sd + jit(0.4), car.vx * 0.65 + rx * sd * 2 + jit(3), 0.6 + Math.random(), car.vz * 0.65 + rz * sd * 2 + jit(3)); // fumée de pneus : un nuage qui gonfle et monte, chassé vers l'extérieur ; elle garde une part de la vitesse, sinon elle passe derrière la caméra avant d'avoir gonflé
    if (hit > 3) { const s = S[car.idx], sg = Math.sign(car.d); for (let i = 0; i < 16; i++) emit(car.x - s.tz * sg, carY + 0.5, car.z + s.tx * sg, car.vx * 0.5 + jit(14), 2 + Math.random() * 7, car.vz * 0.5 + jit(14), 0.5, 1, 0.75, 0.25, 22); }
    else if (car.rub && sp > 8) { const s = S[car.idx], sg = Math.sign(car.d); for (let i = 0; i < 3; i++) emit(car.x - s.tz * sg, carY + 0.4, car.z + s.tx * sg, car.vx * 0.6 + jit(5), 1 + Math.random() * 4, car.vz * 0.6 + jit(5), 0.35, 1, 0.75, 0.25, 22); } // frottement continu : gerbe plus fine que le choc
    for (const fl of hu.fl) { fl.visible = car.boost > 0; fl.scale.y = (0.5 + Math.random() * 0.7) * Math.min(1, car.boost * 2); } // nitro : deux flammes d'échappement qui vacillent, les traînées virent au bleu
    const gl = car.dd && sp > 10 && !car.air;
    if (gl && car.driftT > 0.6) for (const sd of [-0.9, 0.9]) for (let k = 1 + (Math.random() < 0.5); k--;) trait(car.x + fx * xr + rx * sd, carY + 0.08, car.z + fz * xr + rz * sd, car.vx * 0.7 + rx * sd * 4 + jit(4), 2 + Math.random() * 4, car.vz * 0.7 + rz * sd * 4 + jit(4), 0.4, 18, 0.06, [1, 0.55, 0.1], carY + 0.03); // palier de glisse (la jauge se remplit à plein débit) : des étincelles orange, en traits fins, dans la fumée
    // traces : chaque roue arrière tire son ruban tant qu'elle marque (glisse, freinage bloqué, patinage au départ ; terre et neige marquent même en roulant) ; un point d'alpha nul ouvre et ferme chaque trace
    const st = trSol(T.surf[car.idx]); hu.lance = (inp.gas || 0) > 0.8 && sp < 12 ? (hu.lance || 0) + dt : 0;
    const k = Math.max(gl ? 1 : 0, (inp.brake || 0) > 0.6 && sp > 6 ? 1 : 0, hu.lance > 0 && hu.lance < 1.4 ? 1 - sp / 12 : 0), ga = st && !car.air && sp > 1 ? st.roule + (st.a - st.roule) * k : 0, on = ga > 0.04;
    // shortcut: posées à la hauteur de la voiture, sans le tangage ; sur une pente raide le bout peut s'enfoncer ou flotter de quelques centimètres
    for (let l = 0; l < 2; l++) { const R = hu.gR[l], sd = l ? zr : -zr, p = { x: car.x + fx * xr + rx * sd, y: carY + 0.04, z: car.z + fz * xr + rz * sd, rx, rz, a: ga, c: st ? st.c : TR.sec.c, w: st ? st.w : 1 };
      if (on) { if (!hu.gOn[l]) R.unshift({ ...p, a: 0 }); hu.gOn[l] = 1; if (!R[0].a || Math.hypot(p.x - R[1].x, p.z - R[1].z) > GD) R.unshift(p); else Object.assign(R[0], p); }
      else if (hu.gOn[l]) { R.unshift({ ...R[0], a: 0 }); hu.gOn[l] = 0; }
      while (R.length > GN) R.pop();
      for (let k = 0; k < GN; k++) { const e = R[k], a = (l * GN + k) * 6, c = (l * GN + k) * 8; if (!e) { hu.gC.fill(0, c, c + 8); continue; } const w = tw / 2 * e.w;
        hu.gP.set([e.x - e.rx * w, e.y, e.z - e.rz * w, e.x + e.rx * w, e.y, e.z + e.rz * w], a); hu.gC.set([...e.c, e.a, ...e.c, e.a], c); } }
    hu.gGeo.attributes.position.needsUpdate = hu.gGeo.attributes.color.needsUpdate = true;
  }
  // effets de la scène entière, une fois par image : poussière, particules, éclairs, vie du décor
  function fxFrame(dt, now) {
    const { lm, moi: car } = VUES[0]; // le tonnerre est celui du joueur 1 (un seul son, comme SON.frame)
    if (TH.poussiere) { for (const c of race ? race.cars : [car]) { const q = T.surf[c.idx], v = Math.hypot(c.vx, c.vz), sd = Math.random() < 0.5 ? -0.8 : 0.8, x = c.x - Math.cos(c.th) * 1.6 - Math.sin(c.th) * sd, z = c.z - Math.sin(c.th) * 1.6 + Math.cos(c.th) * sd; // chaque voiture lève un panache derrière elle ; dans le gué, une gerbe d'eau. La poussière part à la vitesse de la voiture puis freine : le panache reste dans le champ de la caméra de poursuite
        if (c.air) c.eauT = 0; // en l'air, on n'est plus dans l'eau : la réception d'un saut dans une zone noyée refait le coup d'étrave (seuils de chapada)
        if (v < 8 || c.air || c.out || !(VUES.some(v => v.car === c) || c.drift || Math.random() < 0.5)) continue;
        const aq = j => T.surf[(c.idx + j) % N].aq > 0.099, dansEau = aq(0) || aq(1), moi = !window.__g.vue && VUES.some(u => u.car === c); // aq(1) : les roues avant, 2 m devant, y sont déjà
        c.eauT = dansEau ? (c.eauT || 0) + dt : 0; // temps passé dans l'eau (décor seulement, la simulation ne le lit pas)
        if (dansEau) gerbe(c, v, moi, dt, 1 + 2.5 * Math.max(0, 1 - c.eauT / 0.35) + (aq(4) ? 0 : 2)); // fort : le coup d'étrave à l'entrée, et la vague des 8 derniers mètres avant la sortie ; hors de l'eau, rien // le gué : une gerbe d'eau de chaque côté, là seulement où la zone mouillée est pleine ; sur la boue de ses bords, ni gerbe ni poussière (decors-terre.js y pose la nappe), et rien dans la boue de ses bords ; allégée pour une voiture que suit une caméra de poursuite (pas en caméra d'inspection, __g.vue, qui regarde de loin)
        else if (q.roul > 0.25 && !q.aq) for (let k = 0; k < 2; k++) poussiere(x + jit(0.6), c.y + 0.15, z + jit(0.6), c.vx * 0.7 + jit(2), 0.3 + Math.random() * 1.2, c.vz * 0.7 + jit(2));
        else if (FEU && !q.aq && !(T.tun && (c.idx - T.t0 + N) % N <= T.t1 - T.t0)) for (let k = Math.max(1, Math.round((c.drift ? 3 : 1.5) * dt * 60)); k--;) FEU.emit(x + jit(2), c.y + 0.12, z + jit(2), c.vx * 0.85 + jit(6), 1.5 + Math.random() * 4.5, c.vz * 0.85 + jit(6)); } // elles partent à la vitesse de la voiture puis freinent, comme la poussière : le sillage reste dans le champ de la caméra de poursuite
      POUS.step(dt); if (FEU) FEU.step(dt); if (GERBE) { GERBE.step(dt); GERBE1.step(dt); ECUME.step(dt); } }
    dgFrame(dt); decorFrame(dt); FUM.step(dt); dEch.value = RH / 2;
    for (const p of VAPS) { for (p.t += dt; p.t > 0.12; p.t -= 0.12) p.f.emit(p.x + jit(0.6), p.y, p.z + jit(0.6), 0.3 + jit(0.4), 1 + Math.random() * 0.6, jit(0.4)); p.f.step(dt); } // vapeur : toujours, même loin (40 points par bouche)
    for (let i = 0; i < VN; i++) { const j = i * 6, s = i * VK; if (vS[s + 3] <= 0) { vCo.fill(0, j, j + 6); continue; }
      vS[s + 3] -= dt; vS[s + 1] -= vS[s + 5] * dt; const a = Math.max(0, vS[s + 3] / vS[s + 4]), k = vS[s + 6];
      for (let c = 0; c < 3; c++) vP[j + c] += vS[s + c] * dt; if (vP[j + 1] < vS[s + 7]) { vP[j + 1] = vS[s + 7]; vS[s + 1] *= -0.35; }
      for (let c = 0; c < 3; c++) { vP[j + 3 + c] = vP[j + c] - vS[s + c] * k; vCo[j + c] = vS[s + 8 + c] * a; vCo[j + 3 + c] = 0; } }
    vGeo.attributes.position.needsUpdate = vGeo.attributes.color.needsUpdate = true;
    for (let i = 0; i < PN; i++) {
      if (pL[i] <= 0) continue;
      pL[i] -= dt; const j = i * 3, f = Math.max(0, pL[i] / pM[i]);
      pV[j + 1] -= pGv[i] * dt; pP[j] += pV[j] * dt; pP[j + 1] += pV[j + 1] * dt; pP[j + 2] += pV[j + 2] * dt;
      pC[j] = pB[j] * f; pC[j + 1] = pB[j + 1] * f; pC[j + 2] = pB[j + 2] * f;
    }
    pGeo.attributes.position.needsUpdate = pGeo.attributes.color.needsUpdate = true;
    // éclairs : flash double sur le ciel, la brume et l'éclairage, puis le tonnerre
    if (TH.orage && (nextFlash -= dt) < 0) { nextFlash = 7 + Math.random() * 14; flashT = 0.36; if (lm < 0.5) SON.tonnerre(); }
    flashT -= dt; // (l'éclat de l'éclair sur le ciel est réglé par vue : vueFrame)
    adMats.forEach((m, i) => { m.map.offset.x += dt * (0.2 + 0.1 * i); }); // écrans publicitaires des portiques
    if (decorTick) decorTick(dt, now, car);
  }

  const ghostM = box(ENCt.x, ENCt.y, ENCt.z, addMat(null, { color: 0x00f0ff, opacity: 0.4, polygonOffset: false }), 0, 0, 0); ghostM.visible = false; // fantôme : simple silhouette lumineuse
  // adversaires du mode course : copies de la voiture du joueur, une couleur chacune (roues fixes) ; [nom, couleur]
  // Écran partagé : un modèle de plus par joueur 2 à 4, à sa livrée (la fin de la liste : c.k = 2 + n° du joueur). Chaque voiture d'une course porte c.k = son rang dans OPP et opps, -1 pour le joueur 1 (voir start) ;
  // pil(c) = [nom, couleur] d'une voiture, pour les étiquettes, la minicarte et le classement ; modele(c) = son modèle dans la scène
  const OPP = [['KENJI', '#00c8ff'], ['REI', '#ff8a00'], ['JUN', '#40ff80']].map(([n, c], i) => [M.rivaux ? M.rivaux[i] : n, c]).concat([['J2', '#ff4fd8'], ['J3', '#b070ff'], ['J4', '#ff4040']]);
  const opps = OPP.map(([, col]) => {
    const g = carG.clone(), m = reflete(livree(new THREE.Color(col).getHex())), b = brakeMat.clone(), u = { feu: b, roue: roueMat.clone(), sol: solMat.clone() }; m.emissive.setRGB(1, 1, 1); m.emissiveMap = m.map; m.emissiveIntensity = 0.3; // un peu lumineuse : lisible de nuit et de loin
    g.traverse(o => { if (o.material === carMat) o.material = m; else if (o.material === brakeMat) o.material = b; else if (o.material === roueMat) o.material = u.roue; else if (o.material === solMat) o.material = u.sol; });
    g.visible = false; g.userData.y = 0; Object.assign(g.userData, u, { col: new THREE.Color(col), liv: m }); scene.add(g); return g;
  });
  Object.assign(carG.userData, { feu: brakeMat, roue: roueMat, sol: solMat, col: new THREE.Color(L.col), liv: carMat }); // après les copies : Object3D.clone recopie userData en JSON
  // freinage d'une voiture (fr : force du frein, 0 à 1) sur son modèle g : feu stop, lueur au sol, et disques qui chauffent aux gros freinages (≈ 1,5 s à fond depuis la pointe) puis refroidissent en ~3 s
  const freins = (g, fr, sp, dt) => { const u = g.userData, h = u.ch = clamp((u.ch || 0) + (fr && sp > 12 ? fr * sp / TOP * 0.9 : -0.35) * dt, 0, 1); u.fr = fr;
    u.feu.color.setHex(fr ? 0xff7080 : 0x8a1020); u.sol.opacity = fr * (0.25 + 0.5 * Math.min(1, nuitV)); g.children[7].visible = fr > 0.001; u.roue.emissive.setRGB(1.6 * h * h, 0.55 * h ** 3, 0.12 * h ** 4); }; // rouge sombre, puis orange quand ça cogne ; g.children[7] : le plan de lueur, caché hors freinage (une passe de dessin de moins par voiture)
  // Les trois rivaux ont un caractère, tenu par leur rang (OPP, du plus rapide au moins rapide) : la référence, la tête brûlée, la recrue.
  // Une réplique au départ, quand on les double, quand ils nous doublent (en solo, hors démo ; une toutes les 7 s au plus, affichée 3 s). Textes en capitales sans accents : leur anglais est dans langue.js.
  const PIQUES = [
    { grille: ["ON SE RETROUVE A L'ARRIVEE.", 'REGARDE BIEN MES FEUX ARRIERE.'], double: ['PROFITE, CA NE DURERA PAS.', 'JOLI. TIENS LE RYTHME.'], passe: ["LA VOIE RAPIDE, C'EST MOI.", "IL TE FAUDRA PLUS D'UNE NUIT."] },
    { grille: ['PAS DE FREIN CE SOIR.', 'PREMIER VIRAGE : PORTE A PORTE'], double: ["HE ! TU M'AS FROTTE !", 'JE REVIENS, JE REVIENS !'], passe: ['POUSSE-TOI !', 'TROP LENT, TROP TARD !'] },
    { grille: ['MES MAINS TREMBLENT...', 'MA PREMIERE COURSE DE NUIT...'], double: ['VAS-Y, JE NE BOUGE PAS !', 'BIEN VU. JE PRENDS DES NOTES.'], passe: ['OH ! PARDON ! ENFIN... NON.', "J'AI DOUBLE QUELQU'UN ?!"] },
  ];
  let pique = null, piqueT = 0; // pique = { s : texte, c : couleur, T : temps restant à l'écran } ; piqueT : délai avant la suivante
  const VOIX = [[110, 7], [160, 10], [240, 8]]; // voix radio de chaque rival (SON.radio) : hauteur en Hz et syllabes par seconde — grave et posé, nerveux, jeune
  const pic = (c, ev) => { if (c.k < 0 || c.k > 2 || piqueT > 0) return; const L = PIQUES[c.k][ev], l = L[Math.random() * L.length | 0]; pique = { n: OPP[c.k][0], s: l, c: OPP[c.k][1], T: 3 }; piqueT = 7; SON.radio(Math.min(10, Math.ceil(l.split(' ').length * 1.6)), ...VOIX[c.k]); };
  const J1 = ['J1', TH.hud.y], pil = c => c.k >= 0 ? OPP[c.k] : J1, modele = c => c.k >= 0 ? opps[c.k] : carG;
  // les voitures humaines, une par place de joueur (vu.hu de la vue de rang n : HUM[n]) : modèle, caisse (roulis), roues, feu stop, flammes de nitro et traînées. Une copie de carG a les mêmes enfants dans le même ordre : caisse, quatre roues, deux flammes.
  // Le joueur 2 a donc toute l'animation du joueur 1, alors que les adversaires gardent leurs roues fixes
  const HUM = [[carG, brakeMat], ...opps.slice(3).map(g => [g, g.userData.feu])].map(([g, feu]) => ({ g, feu, body: g.children[0], roues: g.children.slice(1, 5), fl: g.children.slice(5, 7), ...trainee() }));
  // les quatre roues d'une voiture en une passe de dessin (et une dans l'ombre) au lieu de quatre : les groupes de roue (enfants 1 à 4) restent et tournent comme avant, leurs maillages sont cachés,
  // et rouesInst recopie leur pose dans l'instance, ajoutée en dernier enfant (l'ordre des autres ne change pas)
  const RI = [carG, ...opps].map(g => { const w = g.children[1].children[0], m = new THREE.InstancedMesh(w.geometry, w.material, 4); m.castShadow = true; g.add(m); for (let r = 1; r < 5; r++) g.children[r].children[0].visible = false; return [g, m]; }), mRI = new THREE.Matrix4();
  const rouesInst = () => { for (const [g, m] of RI) if (g.visible) { for (let r = 1; r < 5; r++) { const st = g.children[r], w = st.children[0]; st.updateMatrix(); w.updateMatrix(); m.setMatrixAt(r - 1, mRI.multiplyMatrices(st.matrix, w.matrix)); } m.instanceMatrix.needsUpdate = true; } };

  fond && await souffle();
  // ---------- dégâts : purement visuels et sonores (la conduite et les temps n'en savent rien : fantômes, médailles et réseau intacts), remis à zéro à chaque départ ----------
  // Le modèle des chocs est celui de sim.js (usure, docs/SPEC-CASSE.md) : seule la vitesse normale casse, plafonds 0,4 par tour et 0,7 par zone.
  // Par modèle (g.userData.dg) : z = usure des zones [avant, arrière, flanc z < 0, flanc z > 0] ; z0 = les zones au début du tour ; la caisse s'enfonce autour de chaque impact, d'autant plus que le choc a usé ;
  // les pièces pendent puis tombent à des seuils de leur zone (une seule pend à la fois, dessinée à part sur sa charnière) ; ph / fe = phare / feu tombé de chaque côté [z < 0, z > 0] : sa lumière dynamique s'éteint (vueFrame) ;
  // les débris restent au sol toute la course (au plus DEBMAX, le plus vieux disparaît), poussés par les voitures qui passent ; fumée du capot ; vitre fêlée peinte sur la livrée.
  // Chaque modèle a sa copie des géométries de carG (formes-voitures.js) : P0 = la forme intacte, d = l'enfoncement cumulé.
  const DG_MAX = 0.38, DGV = new Float32Array(32), DEB = [], DEBMAX = 40, HCB = new THREE.Color(0xfff2d0).multiplyScalar(1.1 * LUM_GAIN); let dgT = 0;
  // éclats de verre : de petits prismes triangulaires épais (une vraie épaisseur, des arêtes qui accrochent la lumière), brillants et transparents ; une gerbe = un InstancedMesh (une passe) ; au plus GERBES gerbes, la plus vieille disparaît
  const VERRE = [new THREE.MeshStandardMaterial({ color: 0xd8ecf6, emissive: 0x405868, roughness: 0.04, metalness: 0.7, envMap: CUBE.texture, envMapIntensity: 1.8, transparent: true, opacity: 0.75, side: THREE.DoubleSide }), // vitre et phare
    new THREE.MeshStandardMaterial({ color: 0xff2a18, emissive: 0x400800, roughness: 0.15, metalness: 0.3, envMap: CUBE.texture, transparent: true, opacity: 0.85, side: THREE.DoubleSide })]; // feu arrière
  const ECLAT = (() => { const a = [0, 0], b = [1, 0.15], c = [0.35, 0.85], e = 0.12, h = 0.17, p = [], add = (...v) => v.forEach(q => p.push(q[0] * h, q[1], q[2] * h)); // triangle de 17 cm, 2 cm d'épaisseur : visible avec la caméra de course (à 9 cm, moins d'un pixel)
    const T0 = [a, b, c].map(([x, z]) => [x, 0, z]), T1 = [a, b, c].map(([x, z]) => [x, e * h, z]); add(T0[0], T0[2], T0[1]); add(T1[0], T1[1], T1[2]);
    for (let i = 0; i < 3; i++) { const j = (i + 1) % 3; add(T0[i], T0[j], T1[j]); add(T0[i], T1[j], T1[i]); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.translate(-0.4 * h, -e * h / 2, -0.33 * h); g.computeVertexNormals(); return g; })();
  const GERBES = 16, GER = [], gm4 = new THREE.Matrix4(), gsc = new V3();
  function eclats(x, y, z, n, verre, vx, vz, ox, oz, y0) { // une gerbe de n éclats depuis (x, y, z), projetés vers (ox, oz) et avec la voiture ; y0 : le sol
    const im = new THREE.InstancedMesh(ECLAT, VERRE[verre], n); im.userData.dyn = 1; im.frustumCulled = false; im.castShadow = false; scene.add(im);
    const G = { im, y0, e: Array.from({ length: n }, () => ({ p: new V3(x + jit(0.4), y + jit(0.2), z + jit(0.4)), v: new V3(vx * 0.6 + ox * (2 + Math.random() * 3) + jit(3), 1 + Math.random() * 3.5, vz * 0.6 + oz * (2 + Math.random() * 3) + jit(3)),
      q: new THREE.Quaternion().setFromEuler(new THREE.Euler(jit(6), jit(6), jit(6))), w: new V3(jit(30), jit(30), jit(30)), s: 0.5 + Math.random() * 1.3, dort: 0 })), dort: 0 };
    GER.push(G); while (GER.length > GERBES) { const o = GER.shift(); scene.remove(o.im); o.im.dispose(); } gerbePose(G); }
  const gerbePose = G => { G.e.forEach((e, i) => { im4(e); G.im.setMatrixAt(i, gm4); }); G.im.instanceMatrix.needsUpdate = true; };
  const im4 = e => gm4.compose(e.p, e.q, gsc.setScalar(e.s));
  const dq4 = new THREE.Quaternion(), ax4 = new V3();
  function eclatsPas(dt) { for (const G of GER) { if (G.dort) continue; let dorment = 0;
    for (const e of G.e) { if (e.dort) { dorment++; continue; } e.v.y -= 15 * dt; e.p.addScaledVector(e.v, dt); const wl = e.w.length(); if (wl > 1e-3) { dq4.setFromAxisAngle(ax4.copy(e.w).divideScalar(wl), wl * dt); e.q.premultiply(dq4); }
      if (e.p.y < G.y0 + 0.01) { e.p.y = G.y0 + 0.01; e.v.y *= -0.25; e.v.x *= 0.4; e.v.z *= 0.4; e.w.multiplyScalar(0.3); if (e.v.length() < 0.3) { e.dort = 1; e.q.setFromEuler(new THREE.Euler(0, Math.random() * 6.28, 0)); } } } // posé à plat : il brille au sol
    gerbePose(G); if (dorment === G.e.length) G.dort = 1; } }
  const nez = Math.max(...VO.plan.dessusCaisse.map(q => q[0])), cul = Math.min(...VO.plan.dessusCaisse.map(q => q[0])), cab0 = VO.plan.cab[0][0], cab3 = VO.plan.cab[3][0];
  const prof = x => { const d = VO.plan.dessusCaisse; let y = 0; for (let i = 0; i < d.length - 1; i++) { const [x0, y0] = d[i], [x1, y1] = d[i + 1]; if (x0 !== x1 && (x - x0) * (x - x1) <= 0) y = Math.max(y, y0 + (y1 - y0) * (x - x0) / (x1 - x0)); } return y; }; // hauteur du dessus de caisse en x
  const hash = (x, y, z) => { const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453; return s - Math.floor(s); }; // même point, même bruit : les sommets confondus restent soudés
  const DGM = [carG, ...opps].map(g => {
    const D = { z: [0, 0, 0, 0], z0: [0, 0, 0, 0], lap: 0, ph: [0, 0], fe: [0, 0], m: [], p: [], t: -1, fis: null, liv: null, pend: null, c: null };
    g.children[0].traverse(o => { const zn = Object.keys(VO.zones).find(k => VO.zones[k] === o.geometry); if (!zn) return;
      const ge = o.geometry = o.geometry.clone(), P = ge.attributes.position.array; D.m.push({ o, zn, P0: P.slice(), d: new Float32Array(P.length) });
      if (zn === 'caisse') D.liv = o.material; });
    // les pièces : les triangles qui passent leur test, dans une ou plusieurs zones ; { pend : seuil où elle pend (absent : tombe d'un coup), off : seuil où elle tombe, ch : charnière, verre : éclats (0 phare, 1 feu), s : côté, sg : où elle part }
    const me = zn => D.m.find(m => m.zn === zn), uvC = me('caisse').o.geometry.attributes.uv.array, uni = i => Math.abs(uvC[i / 3 * 2] - 124 / 128) < 1e-3 && Math.abs(uvC[i / 3 * 2 + 1] - 0.25) < 1e-3; // l'aplat de teinte de la livrée (plan.teinte)
    const cherche = (nom, zi, specs, o) => { const parts = []; for (const [zn, test] of specs) { const m = me(zn); if (!m) continue; const P = m.P0, tri = [];
        for (let i = 0; i < P.length; i += 9) { let ok = true; for (let k = 0; k < 9 && ok; k += 3) ok = test(P[i + k], P[i + k + 1], P[i + k + 2], i + k); if (ok) tri.push(i); }
        if (tri.length) parts.push({ me: m, tri }); }
      if (parts.length) D.p.push({ nom, zi, parts, etat: 0, ...o }); };
    for (const s of [-1, 1]) {
      cherche('retro', s < 0 ? 2 : 3, [['caisse', (x, y, z, i) => uni(i) && z * s > VO.plan.wc / 2 && x > cab0 - 0.5 && x < cab0 + 0.3]], { off: 0.25, sg: [0, s], s });
      cherche('phare', 0, [['phare', (x, y, z) => z * s > 0]], { off: 0.25, sg: [1, s * 0.5], s, verre: 0 });
      cherche('feu', 1, [['feu', (x, y, z) => z * s > 0]], { off: 0.25, sg: [-1, s * 0.5], s, verre: 1 });
    }
    cherche('parechocs', 0, [['noir', (x, y) => x > nez - 0.3 && y < 0.5]], { pend: 0.3, off: 0.45, ch: 'bout', sg: [1, 0] });
    cherche('parechocs', 1, [['noir', (x, y) => x < cul + 0.3 && y < 0.5]], { pend: 0.3, off: 0.45, ch: 'bout', sg: [-1, 0] });
    const ail = (x, y) => x < cab3 - 0.1 && y > prof(x) + 0.05; cherche('aileron', 1, [['caisse', ail], ['noir', ail]], { pend: 0.35, off: 0.55, ch: 'bout', sg: [-1, 0] });
    if (D.liv) { const im = D.liv.map.image; D.fis0 = im.getContext('2d').getImageData(0, 0, im.width, im.height); } // la livrée intacte, lue au chargement : la relire au premier choc (fissure) bloquait jusqu'à ce que le GPU rende le canvas, de 50 ms à près d'une seconde
    return g.userData.dg = D;
  });
  const dgEcrit = (D, me) => { const ge = me.o.geometry, P = ge.attributes.position.array; for (let i = 0; i < P.length; i++) P[i] = me.P0[i] + me.d[i];
    for (const p of D.p) if (p.etat) for (const q of p.parts) if (q.me === me) for (const i of q.tri) P.fill(0, i, i + 9); // pièce qui pend (dessinée à part) ou tombée : ses triangles réduits à un point
    ge.attributes.position.needsUpdate = true; ge.computeVertexNormals(); };
  function dgRaz() { // départ d'une course : toutes les voitures intactes, les débris ramassés, les traces effacées
    for (const D of DGM) { if (D.pend) { D.pend.piv.parent.remove(D.pend.piv); D.pend = null; }
      D.z.fill(0); D.z0.fill(0); D.lap = 0; D.ph.fill(0); D.fe.fill(0); D.t = -1;
      for (const p of D.p) p.etat = 0;
      for (const me of D.m) { me.d.fill(0); dgEcrit(D, me); }
      if (D.fis) { D.liv.map.image.getContext('2d').putImageData(D.fis, 0, 0); D.liv.map.needsUpdate = true; D.fis = null; } }
    for (const d of DEB) { scene.remove(d.m); d.m.geometry.dispose(); } DEB.length = 0;
    for (const G of GER) { scene.remove(G.im); G.im.dispose(); } GER.length = 0; for (const D of DGM) D.vitres = {};
    for (const vu of VUES) vu.hu.gR[0].length = vu.hu.gR[1].length = vu.hu.gOn[0] = vu.hu.gOn[1] = 0;
    decorRaz(); huileRaz();
  }
  // un choc sur le modèle g : (lx, lz) = d'où il vient, unitaire, dans le repère de la voiture (x vers l'avant) ; f = sa vitesse normale (m/s) ; (vx, vz) = vitesse de la voiture, que gardent les pièces qui tombent
  function dgChoc(g, lx, lz, f, vx = 0, vz = 0, type = 'mur', zs = null) { // zs : en CASSE, les zones que sim.js a déjà calculées (c.ca.z), sans plafond
    const D = g.userData.dg, z0 = D.z[0] + D.z[1] + D.z[2] + D.z[3], du = zs ? (zs.forEach((v, i) => { D.z[i] = v; }), D.z[0] + D.z[1] + D.z[2] + D.z[3] - z0) : usure(D.z, D.z0, lx, lz, f, type);
    const t = Math.min(ENCt.x / 2 / (Math.abs(lx) + 1e-6), ENCt.z / 2 / (Math.abs(lz) + 1e-6)), px = ENCc.x + lx * t, pz = ENCc.z + lz * t;
    if (du > 0.002) { // l'enfoncement suit l'usure ajoutée (plus rien une fois le plafond atteint) ; une face qui a perdu son pare-chocs se plie 1,5 fois plus
      const nu = lx * lx > 0.5 && D.p.some(p => p.nom === 'parechocs' && p.etat === 2 && p.zi === (lx > 0 ? 0 : 1)), R = 0.6 + 1.2 * Math.sqrt(du), pr = (0.06 + 0.6 * du) * (nu ? 1.5 : 1);
      for (const me of D.m) { const P = me.P0, d = me.d;
        for (let i = 0; i < P.length; i += 3) { const r = Math.hypot(P[i] + d[i] - px, (P[i + 1] + d[i + 1] - 0.55) * 1.4, P[i + 2] + d[i + 2] - pz); if (r >= R) continue;
          const w = (1 - r / R) ** 2 * pr * (0.6 + 0.8 * hash(P[i], P[i + 1], P[i + 2])); d[i] -= lx * w; d[i + 1] -= w * 0.3 * hash(P[i + 2], P[i], P[i + 1]); d[i + 2] -= lz * w; // froissé : chaque point un peu plus ou un peu moins
          const l = Math.hypot(d[i], d[i + 1], d[i + 2]); if (l > DG_MAX) for (let c = 0; c < 3; c++) d[i + c] *= DG_MAX / l; } } }
    for (const p of D.p) { if (p.etat === 2) continue; const z = D.z[p.zi], cote = !p.s || pz * p.s > -0.2 || z > 0.6; // rétro et optiques : du côté du choc
      if (!zs && p.nom === 'phare' && D.p.some(q => q !== p && q.nom === 'phare' && q.etat)) continue; // hors CASSE, un phare reste toujours : la nuit, sinon on ne voit plus la route
      if (z >= p.off && cote) { if (D.pend && D.pend.p === p) lache(g, D, vx, vz); else { p.etat = 2; tombe(g, p, morceaux(p), p.parts[0].me.o.parent, vx, vz); } }
      else if (!p.etat && p.pend != null && z >= p.pend) pend(g, D, p, vx, vz); }
    for (const p of D.p) if (p.etat === 2 && p.verre !== undefined) D[p.verre ? 'fe' : 'ph'][p.s < 0 ? 0 : 1] = 1;
    for (const me of D.m) dgEcrit(D, me);
    if (f > 14 && lx * lx > 0.4) vitre(g, lx > 0 ? 'av' : 'ar', vx, vz); // choc franc de face (pare-brise) ou par l'arrière (lunette)
    if (f > 12 && lz * lz > 0.4) vitre(g, lz < 0 ? -1 : 1, vx, vz); // choc de côté : la vitre latérale vole en éclats
  }
  const morceaux = p => p.parts.map(({ me, tri }) => { const A = new Float32Array(tri.length * 9), U = new Float32Array(tri.length * 6), uv = me.o.geometry.attributes.uv.array, ge = new THREE.BufferGeometry(); // la pièce telle que cabossée, dans le repère du modèle
    tri.forEach((i, k) => { for (let j = 0; j < 9; j++) A[k * 9 + j] = me.P0[i + j] + me.d[i + j]; U.set(uv.subarray(i / 3 * 2, i / 3 * 2 + 6), k * 6); });
    ge.setAttribute('position', new THREE.BufferAttribute(A, 3)); ge.setAttribute('uv', new THREE.BufferAttribute(U, 2)); ge.computeVertexNormals(); ge.computeBoundingBox();
    const m = new THREE.Mesh(ge, me.o.material); m.castShadow = true; m.layers.mask = me.o.layers.mask; return m; });
  function debris(m, v) { m.userData.dyn = 1; m.layers.set(OMBD); m.castShadow = true; scene.add(m); DEB.push({ m, v, w: new V3(jit(10), jit(10), jit(10)), y0: m.position.y - 1, dort: 0 });
    while (DEB.length > DEBMAX) { const o = DEB.shift(); scene.remove(o.m); o.m.geometry.dispose(); } }
  function tombe(g, p, ms, parent, vx, vz) { // une pièce qui se détache, lancée vers l'extérieur ; une optique laisse en plus des éclats
    g.updateMatrixWorld(true); const q = parent.getWorldQuaternion(new THREE.Quaternion()), c = new V3(), y0 = g.position.y;
    const fx = Math.cos(g.rotation.y), fz = -Math.sin(g.rotation.y), ox = fx * p.sg[0] - fz * p.sg[1], oz = fz * p.sg[0] + fx * p.sg[1]; // g.rotation.y = -cap
    for (const m of ms) { m.geometry.computeBoundingBox(); m.geometry.boundingBox.getCenter(c); m.geometry.translate(-c.x, -c.y, -c.z); m.position.copy(c).applyMatrix4(parent.matrixWorld); m.quaternion.copy(q);
      debris(m, new V3(vx * 0.8 + ox * 3, 2 + Math.random() * 2, vz * 0.8 + oz * 3)); DEB[DEB.length - 1].y0 = y0; }
    if (p.verre !== undefined) { const q0 = ms[0].position; eclats(q0.x, q0.y, q0.z, 18, p.verre, vx, vz, ox, oz, y0); } // l'optique éclate en morceaux de verre (clair) ou de plastique (rouge)
  }
  function pend(g, D, p, vx, vz) { // la pièce se décroche d'un côté : elle tient du côté le moins abîmé, l'autre bout tombe (et traîne au sol)
    if (D.pend) lache(g, D, vx, vz);
    const ms = morceaux(p), bb = new THREE.Box3(); for (const m of ms) bb.union(m.geometry.boundingBox);
    const c = bb.getCenter(new V3()), s = D.z[2] < D.z[3] ? -1 : 1, h = new V3(c.x, bb.max.y, s < 0 ? bb.min.z : bb.max.z), piv = new THREE.Group();
    piv.position.copy(h); for (const m of ms) { m.geometry.translate(-h.x, -h.y, -h.z); piv.add(m); } p.parts[0].me.o.parent.add(piv);
    p.etat = 1; D.pend = { p, piv, a: -s * 0.22, t: 0, bout: new V3(0, -0.15, (s < 0 ? bb.max.z : bb.min.z) - h.z) }; piv.rotation.x = D.pend.a;
  }
  function lache(g, D, vx, vz) { const { p, piv } = D.pend; D.pend = null; p.etat = 2; piv.updateMatrix(); const ms = [...piv.children]; // la pièce qui pendait tombe, telle qu'elle pendait
    for (const m of ms) { m.geometry.applyMatrix4(piv.matrix); piv.remove(m); } const parent = piv.parent; parent.remove(piv); tombe(g, p, ms, parent, vx, vz); }
  function vitre(g, w, vx, vz) { // une vitre qui éclate : w = 'av' (pare-brise), 'ar' (lunette), -1 ou 1 (vitre latérale de ce côté) ; une fois par vitre et par course
    const D = g.userData.dg; D.vitres = D.vitres || {}; if (D.vitres[w]) return; D.vitres[w] = 1;
    const p = VO.plan, [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = p.cab, l = typeof w === 'string' ? (w === 'av' ? [(x0 + x1) / 2, (y0 + y1) / 2, 0, 1, 0] : [(x2 + x3) / 2, (y2 + y3) / 2, 0, -1, 0]) : [(x0 + x3) / 2, (y0 + y1) / 2 + 0.05, w * p.wc / 2, 0, w];
    g.updateMatrixWorld(true); const q = new V3(l[0], l[1], l[2]).applyMatrix4(g.children[0].matrixWorld), fx = Math.cos(g.rotation.y), fz = -Math.sin(g.rotation.y), ox = fx * l[3] - fz * l[4], oz = fz * l[3] + fx * l[4];
    eclats(q.x, q.y, q.z, typeof w === 'string' ? 40 : 26, 0, vx, vz, ox, oz, g.position.y); peintVitre(D, w); }
  function peintVitre(D, w) { // la vitre cassée, peinte sur la livrée : un trou sombre semé de verre étoilé (un pixel sur trois), et quelques fêlures ; dgRaz rend l'image d'origine
    if (!D.liv) return; const lv = D.liv.map, g = lv.image.getContext('2d'), p = VO.plan, [[x0, y0], [x1], [x2], [x3, y3]] = p.cab, hw = p.wc / 2 - 0.11, belt = y0, beltR = y3; if (!D.fis) D.fis = D.fis0;
    const zones = w === 'av' ? [[p.dessus, [[x0, -hw], [x0, hw], [x1 + 0.06, hw], [x1 + 0.06, -hw]]], [p.av, [[-hw, belt], [hw, belt], [hw, 1.5], [-hw, 1.5]]]]
      : w === 'ar' ? [[p.dessus, [[x2 - 0.06, -hw], [x2 - 0.06, hw], [x3, hw], [x3, -hw]]], [p.ar, [[-hw, beltR], [hw, beltR], [hw, 1.5], [-hw, 1.5]]]]
      : [[p.cote, p.cab.map(([x, y], i) => [x + (i < 2 ? -0.1 : 0.1), y + (i === 0 || i === 3 ? 0.06 : -0.08)])]]; // shortcut: les deux flancs partagent la même vue de côté (plan.cote) : une vitre latérale cassée l'est des deux côtés
    for (const [vue, pts] of zones) { const P = pts.map(([a, b]) => vue(a, b)), xs = P.map(q => q[0]), ys = P.map(q => q[1]);
      g.save(); g.beginPath(); P.forEach(([a, b], i) => i ? g.lineTo(a, b) : g.moveTo(a, b)); g.closePath(); g.clip(); g.fillStyle = '#05070a'; g.fill();
      g.fillStyle = '#c4dbe6'; for (let y = Math.floor(Math.min(...ys)); y <= Math.max(...ys); y++) for (let x = Math.floor(Math.min(...xs)); x <= Math.max(...xs); x++) if (Math.random() < 0.33) g.fillRect(x, y, 1, 1);
      g.strokeStyle = 'rgba(235,245,255,0.9)'; g.lineWidth = 1; g.beginPath(); const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      for (let i = 0; i < 7; i++) { const an = Math.random() * 6.28, l = 3 + Math.random() * 8; g.moveTo(cx, cy); g.lineTo(cx + Math.cos(an) * l, cy + Math.sin(an) * l); } g.stroke(); g.restore(); }
    lv.needsUpdate = true; }
  const dgPas = (c, vx0, vz0) => { // après un pas de simulation : un choc franc (mur, camion, autre voiture) abîme son modèle ; il vient de l'opposé de ce qu'il a fait à la vitesse
    const g = modele(c), D = g.userData.dg, lap = Math.floor(c.dist / T.n); D.c = c; if (lap !== D.lap) { D.lap = lap; D.z0 = D.z.slice(); } // nouveau tour : chaque zone peut reprendre 0,4
    murChoc(c); const f = Math.max(c.hit, c.bump || 0); if (f <= 3 || dgT - D.t < 0.15) return; D.t = dgT; // un contact qui dure ne compte qu'une fois
    let dx = vx0 - c.vx, dz = vz0 - c.vz, l = Math.hypot(dx, dz); if (l < 0.5) { dx = c.vx; dz = c.vz; l = Math.hypot(dx, dz) || 1; }
    const fx = Math.cos(c.th), fz = Math.sin(c.th); dgChoc(g, (dx * fx + dz * fz) / l, (dz * fx - dx * fz) / l, f, c.vx, c.vz, (c.bump || 0) > c.hit ? 'voiture' : 'mur', c.ca ? c.ca.z : null);
  };
  const dgNiv = c => { const z = modele(c).userData.dg.z; return Math.min(1, z[0] * 0.6 + (z[1] + z[2] + z[3]) * 0.2); }; // pour le son : l'avant (le moteur) compte le plus
  function dgFrame(dt) { eclatsPas(dt); // débris (qui tombent, puis dorment au sol jusqu'à ce qu'une voiture les chasse), pièce qui pend, fumée d'un capot très abîmé
    const cars = race ? race.cars : VUES.map(v => v.car);
    for (const d of DEB) { const p = d.m.position;
      for (const c of cars) { const sp = Math.hypot(c.vx, c.vz), dx = p.x - c.x, dz = p.z - c.z, l = Math.hypot(dx, dz); if (l > 2.2 || sp < 3 || p.y > d.y0 + 1.2) continue; // une voiture passe dessus : le débris repart devant elle
        d.v.set(c.vx * 0.8 + dx / (l || 1) * 2, 1 + Math.random() * 2 + sp * 0.05, c.vz * 0.8 + dz / (l || 1) * 2); d.w.set(jit(16), jit(16), jit(16)); if (d.dort) { d.dort = 0; d.m.castShadow = true; } }
      if (d.dort) continue;
      d.v.y -= 15 * dt; p.addScaledVector(d.v, dt); d.m.rotation.x += d.w.x * dt; d.m.rotation.y += d.w.y * dt; d.m.rotation.z += d.w.z * dt;
      if (p.y < d.y0 + 0.06) { p.y = d.y0 + 0.06; d.v.y *= -0.3; d.v.x *= 0.5; d.v.z *= 0.5; d.w.multiplyScalar(0.5); if (d.v.length() < 0.4) { d.dort = 1; d.m.castShadow = false; } } } // posé : il ne porte plus d'ombre (une passe de moins)
    // shortcut: un débris dort à la hauteur de la voiture d'où il est tombé ; chassé loin dans une pente, il peut flotter ou s'enfoncer un peu ; dans un second temps, un seul maillage pour les débris posés (docs/SPEC-CASSE.md)
    for (const D of DGM) { const P = D.pend; if (!P || !D.c) continue; const c = D.c, sp = Math.hypot(c.vx, c.vz); P.t += dt; // la pièce qui pend bat avec la vitesse ; un bout qui traîne crache des étincelles
      P.piv.rotation.x = P.a * (1 + Math.min(1, sp / 15) * 0.3 * Math.sin(P.t * (4 + sp * 0.25)));
      if (sp > 6 && P.piv.parent && Math.random() < dt * 20) { const w = P.piv.localToWorld(P.bout.clone()); emit(w.x, Math.max(w.y, modele(c).position.y + 0.05), w.z, c.vx * 0.5 + jit(2), Math.random() * 2, c.vz * 0.5 + jit(2), 0.4, 1, 0.7, 0.3, 22); } }
    for (const g of [carG, ...opps]) { const D = g.userData.dg, c = D.c, z = D.z[0]; if (!c || !g.visible || z < 0.6 || c.air || Math.random() > dt * 10 * (z - 0.5)) continue; // la vapeur grise sort de l'avant dès 0,6 d'usure, plus dense ensuite
      const fx = Math.cos(c.th), fz = Math.sin(c.th), a = ENC.max.x - 0.9; pix(0, c.x + fx * a + jit(0.5), g.position.y + 0.9, c.z + fz * a + jit(0.5), c.vx * 0.55 + jit(0.6), 0.8 + Math.random() * 0.8, c.vz * 0.55 + jit(0.6), 0.9 + Math.random() * 0.6); }
  }
  // feux arrière des adversaires et des camions : deux points rouges hors brouillard (au-delà de 60 m la caisse ne fait plus que quelques pixels et rien ne l'éclaire) ;
  // leur taille suit la distance (un feu d'environ 0,5 m) : de loin, jamais plus gros que le véhicule, et jamais sous 1 pixel (le minimum de WebGL), donc toujours visibles ;
  // à moins de 40 m, aucun point : les feux de la caisse se voient, et un point de 0,5 m y ferait un pavé rouge
  const feuxGeo = new THREE.BufferGeometry(), feuxP = new Float32Array(6 * Math.max(3, M.trafic || 0)); feuxGeo.setAttribute('position', new THREE.BufferAttribute(feuxP, 3));
  const feux = new THREE.Points(feuxGeo, new THREE.PointsMaterial({ color: 0xff2030, size: 1, fog: false })); feux.frustumCulled = false; scene.add(feux);
  // th.pharesBrume : les faisceaux des deux phares de la voiture suivie, visibles dans le banc de brouillard (par phare, une nappe additive à plat, vive au nez, éteinte à 30 m)
  const cones = TH.pharesBrume ? (() => { const g = new THREE.BufferGeometry(), L = 30, P = [], C = []; for (const sd of [-0.62, 0.62]) { P.push(sd, 0, 0, sd * 1.4 - 3.2, 0.3, L, sd * 1.4 + 3.2, 0.3, L); C.push(1, 0.95, 0.8, 0, 0, 0, 0, 0, 0); } // une nappe à plat par phare, tenue au-dessus de la chaussée (la nappe debout se voyait par la tranche : un trait dur)
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide })); m.frustumCulled = false; m.renderOrder = 51; m.userData.dyn = 1; m.visible = false; scene.add(m); return m; })() : null; // renderOrder 51 : après le voile du banc (50)

  // ---------- décor qui s'abîme (docs/SPEC-CASSE.md, prototype 2) : purement visuel, comme les dégâts ; remis à zéro à chaque départ (decorRaz) ----------
  // Glissières : chaque côté (MURS) garde la forme des chocs, dz[i] = recul de l'échantillon i (m). La collision de sim.js ne bouge pas : un rail embouti laisse un creux derrière la voiture, pas devant.
  // Peinture : un anneau de MN segments sur les parois (bande de la teinte de la voiture + rayure claire), recalé sur la glissière quand elle recule.
  // Cônes et poubelles : posés au bord des virages, ils volent au contact d'une voiture (qui n'en sait rien) et restent où ils tombent.
  const DS = T.len / N, OFF = s => T.vert ? s.w : W, MDZ = { '-1': new Float32Array(N), 1: new Float32Array(N) }, MP0 = {}; // OFF : où est la paroi ; MP0 : les glissières intactes
  for (const sg in MURS) { MURS[sg].userData.dyn = 1; MP0[sg] = MURS[sg].geometry.attributes.position.array.slice(); }
  const murK = i => (i - T.t1 + N) % N; // le rang de l'échantillon i dans un ruban qui part de T.t1 (au-delà de cO : dans le tunnel, pas de glissière)
  function murEcrit(sg, a, b) { const M = MURS[sg]; if (!M) return; const P = M.geometry.attributes.position.array, d = MDZ[sg];
    for (let j = a; j <= b; j++) { const i = (j + N) % N, k = murK(i); if (k > cO) continue; const s = S[i], nx = -s.tz * sg, nz = s.tx * sg;
      for (let v = 0; v < 2; v++) { const q = (k * 2 + v) * 3; P[q] = MP0[sg][q] + nx * d[i]; P[q + 2] = MP0[sg][q + 2] + nz * d[i]; } }
    M.geometry.attributes.position.needsUpdate = true; }
  function murTord(i, sg, vn) { if (vn <= 6) return; const d = Math.min(0.3, 0.03 * (vn - 6)), R = Math.max(1, Math.round((1.5 + 0.12 * vn) / DS)), D = MDZ[sg];
    for (let j = -R; j <= R; j++) { const u = 1 - Math.abs(j) / (R + 1), i2 = (i + j + N) % N; D[i2] = Math.min(0.45, D[i2] + d * u * u * (3 - 2 * u)); }
    murEcrit(sg, i - R, i + R); marquesSuivent(sg); }
  const MN = 2000, mP = new Float32Array(MN * 24), mB = new Float32Array(MN * 24), mC = new Float32Array(MN * 32), mI = new Uint32Array(MN * 12), mK = new Int32Array(MN * 2), mS = new Int8Array(MN), mGeo = new THREE.BufferGeometry(); let mi = 0;
  for (let k = 0; k < MN * 2; k++) mI.set([k * 4, k * 4 + 1, k * 4 + 2, k * 4 + 1, k * 4 + 3, k * 4 + 2], k * 6);
  mGeo.setAttribute('position', new THREE.BufferAttribute(mP, 3)); mGeo.setAttribute('color', new THREE.BufferAttribute(mC, 4)); mGeo.setIndex(new THREE.BufferAttribute(mI, 1));
  const mMesh = new THREE.Mesh(mGeo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); mMesh.frustumCulled = false; mMesh.userData.dyn = 1; scene.add(mMesh);
  const mPose = n => { for (let v = 0; v < 8; v++) { const e = mK[n * 2 + (v & 2 ? 1 : 0)], s = S[e], sg = mS[n], dz = MDZ[sg][e], q = n * 24 + v * 3; // sommets 0-1 et 4-5 au bout a, 2-3 et 6-7 au bout b
    mP[q] = mB[q] - s.tz * sg * dz; mP[q + 1] = mB[q + 1]; mP[q + 2] = mB[q + 2] + s.tx * sg * dz; } };
  const mEnvoie = () => { mGeo.attributes.position.needsUpdate = mGeo.attributes.color.needsUpdate = true; };
  function marquesSuivent(sg) { for (let n = 0; n < MN; n++) if (mS[n] == sg) mPose(n); mEnvoie(); } // la glissière a reculé : la peinture recule avec elle
  function marque(c, sg, vn) { // contact de la voiture c avec la paroi du côté sg (+1 : z > 0 de la piste, à gauche de la normale) ; vn = vitesse normale, plus haute bande si fort
    const s = S[c.idx], nx = -s.tz, nz = s.tx, o = sg * (OFF(s) - 0.05) - c.d, x = c.x + nx * o, z = c.z + nz * o, L = MK.get(c), t = dgT;
    let a, b, ia, ib; if (L && L.sg === sg && t - L.t < 0.3 && Math.hypot(x - L.x, z - L.z) < 3) { if (Math.hypot(x - L.x, z - L.z) < 0.5) return; a = [L.x, L.z]; b = [x, z]; ia = L.i; ib = c.idx; }
    else { const w = 0.25 + Math.min(0.5, vn * 0.03); a = [x - s.tx * w, z - s.tz * w]; b = [x + s.tx * w, z + s.tz * w]; ia = ib = c.idx; } // un choc seul : une tache ; un frottement : une traînée
    MK.set(c, { x, z, i: c.idx, sg, t });
    const y0 = c.y + 0.3, h = 0.1 + Math.min(0.3, vn * 0.02), col = modele(c).userData.col || NOIRP, n = mi;
    [[y0, y0 + h, [col.r, col.g, col.b], 0.85], [y0 + h + 0.03, y0 + h + 0.05, [0.82, 0.82, 0.8], 0.9]].forEach(([ya, yb, cc, al], k) => {
      mB.set([a[0], ya, a[1], a[0], yb, a[1], b[0], ya, b[1], b[0], yb, b[1]], n * 24 + k * 12); for (let v = 0; v < 4; v++) mC.set([...cc, al], n * 32 + k * 16 + v * 4); });
    mK[n * 2] = ia; mK[n * 2 + 1] = ib; mS[n] = sg; mPose(n); mEnvoie(); mi = (mi + 1) % MN;
  }
  const NOIRP = new THREE.Color(0.3, 0.3, 0.32), MK = new WeakMap(); // MK : le dernier point de peinture de chaque voiture (hors de l'objet de sim.js)
  // cônes et poubelles : au bord extérieur des virages (là où l'on sort large), un InstancedMesh par sorte ; poubelles seulement en ville
  // th.objets : [[couleur, rayon haut, rayon bas, hauteur], …] remplace cônes et poubelles par les objets de la carte (perse : jarres et paniers), le second une fois sur trois ; th.sansObjets : [[i0, i1], …] : pas d'objets aux virages qui commencent dans ces intervalles
  let objSon = 0; // le son de l'objet percuté pendant l'image (th.objets, septième élément) : lu par le son, puis remis à zéro
  const urbain = ['ville', 'paris', 'canal', 'perse'].includes(M.id), OBJ = [], SORTES = TH.objets ? TH.objets.map(([c, r0, r1, ht, z, eclat, son], i) => ({ nom: 'objet' + i, geo: new THREE.CylinderGeometry(r0, r1, ht, 8), mat: new THREE.MeshLambertMaterial({ color: c }), r: Math.max(r0, r1), h: ht, z, eclat, son })) : [
    { nom: 'cone', geo: new THREE.ConeGeometry(0.22, 0.7, 8), mat: new THREE.MeshLambertMaterial({ color: 0xff6a10 }), r: 0.22, h: 0.7 },
    { nom: 'poubelle', geo: new THREE.CylinderGeometry(0.3, 0.26, 0.9, 8), mat: new THREE.MeshLambertMaterial({ color: 0x2c5a34 }), r: 0.3, h: 0.9 }];
  { let a = 12345; const alea = () => (a = (a * 16807) % 2147483647) / 2147483647, places = []; // tirage fixe : les mêmes à chaque course
    for (let i = 0; i < N; i += 3) { const k = S[i].k || 0, kp = S[(i + N - 6) % N].k || 0; if (Math.abs(k) > 0.012 && Math.abs(kp) <= 0.012 && (murK(i) <= cO || TH.objetsTun) && !(TH.sansObjets || []).some(([a, b]) => i >= a && i < b)) places.push(i); } // l'entrée de chaque virage marqué
    if (TH.sansCones) places.length = 0; // th.sansCones : ni cônes ni poubelles au bord des virages (plage : des plots de chantier n'ont pas de sens sur un ponton ni dans un cénote)
    for (const i of places.slice(0, TH.cones === 0 ? 0 : TH.nObjets || 14)) { const sg = -Math.sign(S[i].k); for (let j = 0; j < 3; j++) { const ii = (i + j * 3) % N, s = S[ii], o = sg * (OFF(s) - 0.7 - alea() * 0.4), ici = SORTES.some(q => q.z) ? [...SORTES.filter(q => q.z && (q.z[0] <= q.z[1] ? ii >= q.z[0] && ii < q.z[1] : ii >= q.z[0] || ii < q.z[1])), ...SORTES.filter(q => !q.z)] : SORTES, sorte = ici[urbain && ici.length > 1 && alea() < 0.35 ? 1 : 0]; // th.objets, éléments facultatifs : [i0, i1] = la sorte est réservée à ce tronçon (elle y passe devant les autres), [r, v, b] = éclats au choc, son au choc
      OBJ.push({ S: sorte, x0: s.x - s.tz * o, z0: s.z + s.tx * o, y0: s.y + (T.vert ? paroi(s, Math.abs(o)) : 0), p: new V3(), v: new V3(), q: new THREE.Quaternion(), w: new V3(), dort: 1 }); } } }
  for (const [i, o, k] of TH.objetsEn || []) { const s = S[i]; OBJ.push({ S: SORTES[k], x0: s.x - s.tz * o, z0: s.z + s.tx * o, y0: s.y, p: new V3(), v: new V3(), q: new THREE.Quaternion(), w: new V3(), dort: 1 }); } // th.objetsEn : [[échantillon, écart à l'axe (positif à droite), sorte de th.objets], …], posés par la carte en plus de ceux des entrées de virage
  for (const So of SORTES) { const l = OBJ.filter(o => o.S === So); So.im = new THREE.InstancedMesh(So.geo, So.mat, Math.max(1, l.length)); So.im.count = l.length; So.im.castShadow = true; So.im.userData.dyn = 1; scene.add(So.im); l.forEach((o, k) => { o.k = k; }); }
  // shortcut: le sens du virage (signe de S.k) donne l'extérieur ; si une carte définit k à l'envers, les objets seraient à l'intérieur : à vérifier carte par carte au premier passage
  const objEcrit = o => { o.S.im.setMatrixAt(o.k, new THREE.Matrix4().compose(o.p, o.q, new V3(1, 1, 1))); o.S.im.instanceMatrix.needsUpdate = true; };
  function decorRaz() { for (const sg in MDZ) { MDZ[sg].fill(0); if (MURS[sg]) { MURS[sg].geometry.attributes.position.array.set(MP0[sg]); MURS[sg].geometry.attributes.position.needsUpdate = true; } }
    mB.fill(0); mP.fill(0); mEnvoie();
    for (const o of OBJ) { o.p.set(o.x0, o.y0 + o.S.h / 2, o.z0); o.v.set(0, 0, 0); o.w.set(0, 0, 0); o.q.identity(); o.dort = 1; objEcrit(o); } }
  decorRaz();
  function murChoc(c) { const s = S[c.idx]; if (c.hit <= 3 || OFF(s) - Math.abs(c.d) > 1.6) return; const sg = Math.sign(c.d) || 1; marque(c, sg, c.hit); if (MURS[sg]) murTord(c.idx, sg, c.hit); } // un choc franc contre la paroi (pas un camion : loin du bord)
  // particules pixel des moteurs abîmés : des carrés nets (comme le reste du jeu), une couleur et une taille par palier d'âge, pas de dégradé
  //   fumee : la vapeur grise qui sort de l'avant dès 0,6 d'usure ; noire : la fumée d'un moteur en feu ; feu (mode CASSE) : il couve à 0,7, flambe à 0,85, embrase la voiture hors d'usage
  const PXN = 900, pxP = new Float32Array(PXN * 3).fill(-1e4), pxV = new Float32Array(PXN * 3), pxC = new Float32Array(PXN * 3), pxA = new Float32Array(PXN), pxS = new Float32Array(PXN), pxL = new Float32Array(PXN), pxL0 = new Float32Array(PXN), pxK = new Uint8Array(PXN), pxGeo = new THREE.BufferGeometry(); let pxi = 0;
  pxGeo.setAttribute('position', new THREE.BufferAttribute(pxP, 3)); pxGeo.setAttribute('col', new THREE.BufferAttribute(pxC, 3)); pxGeo.setAttribute('al', new THREE.BufferAttribute(pxA, 1)); pxGeo.setAttribute('sz', new THREE.BufferAttribute(pxS, 1));
  const pxMesh = new THREE.Points(pxGeo, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { ech: dEch },
    vertexShader: 'attribute vec3 col; attribute float al, sz; varying vec3 c; varying float a; uniform float ech; void main() { c = col; a = al; vec4 p = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * p; gl_PointSize = al > 0.0 ? max(1.0, floor(sz * ech * projectionMatrix[1][1] / -p.z)) : 0.0; }',
    fragmentShader: 'varying vec3 c; varying float a; void main() { gl_FragColor = vec4(c, a); }' })); // pas de disque, pas de flou : un carré plein, en pixels entiers
  pxMesh.frustumCulled = false; pxMesh.userData.dyn = 1; scene.add(pxMesh);
  const PXH = h => [(h >> 16 & 255) / 255, (h >> 8 & 255) / 255, (h & 255) / 255];
  const PXPAL = [ // par sorte : 4 paliers [couleur, opacité, taille (m)], montée (m/s²), freinage
    { p: [[0xe2e2e0, 0.8, 0.28], [0xb0b0b4, 0.7, 0.42], [0x7a7a80, 0.5, 0.6], [0x4c4c52, 0.28, 0.8]].map(([c, a, t]) => [PXH(c), a, t]), g: 0.6, fr: 1.5 }, // fumee
    { p: [[0x58585c, 0.9, 0.4], [0x3a3a3e, 0.8, 0.6], [0x26262a, 0.6, 0.85], [0x18181b, 0.35, 1.1]].map(([c, a, t]) => [PXH(c), a, t]), g: 1.2, fr: 1.2 }, // noire
    { p: [[0xfff4a8, 1, 0.3], [0xffc23a, 1, 0.28], [0xff6a14, 1, 0.24], [0xa61e0a, 0.9, 0.18]].map(([c, a, t]) => [PXH(c), a, t]), g: 3, fr: 2 }]; // feu
  const pix = (k, x, y, z, vx, vy, vz, vie) => { const i = pxi++ % PXN; pxP.set([x, y, z], i * 3); pxV.set([vx, vy, vz], i * 3); pxL[i] = pxL0[i] = vie; pxK[i] = k; };
  function pixPas(dt) { for (let i = 0; i < PXN; i++) { if (pxL[i] <= 0) { if (pxA[i]) pxA[i] = 0; continue; } const j = i * 3, P = PXPAL[pxK[i]]; pxL[i] -= dt;
      const st = P.p[Math.min(3, Math.floor((1 - pxL[i] / pxL0[i]) * 4))], fr = Math.exp(-P.fr * dt); pxV[j] *= fr; pxV[j + 2] *= fr; pxV[j + 1] += P.g * dt;
      for (let q = 0; q < 3; q++) pxP[j + q] += pxV[j + q] * dt; pxC.set(st[0], j); pxA[i] = pxL[i] > 0 ? st[1] : 0; pxS[i] = st[2]; }
    for (const a of ['position', 'col', 'al', 'sz']) pxGeo.attributes[a].needsUpdate = true; }
  function decorFrame(dt) {
    pixPas(dt);
    const cars = race ? race.cars : VUES.map(v => v.car), up = new V3(), dq = new THREE.Quaternion();
    if (race && race.casse) { // CASSE : messages de takedown, fumée des moteurs à bout (noire et épaisse hors d'usage), étincelles des jantes
      for (let i = race.tdVu || 0; i < race.td.length; i++) { const e = race.td[i]; for (const vu of VUES) if (e.par === vu.moi) vu.casseMsg = { t: 'TAKEDOWN ! ' + pil(e.vic)[0], T: 2.5, c: Y }; else if (e.vic === vu.moi) vu.casseMsg = { t: 'TAKEDOWN PAR ' + pil(e.par)[0], T: 2.5, c: RD }; }
      race.tdVu = race.td.length;
      for (const c of cars) { const K = c.ca, sp = Math.hypot(c.vx, c.vz), fx = Math.cos(c.th), fz = Math.sin(c.th); if (partie(c)) continue;
        if (K.mort || K.z[0] >= 0.7) { const hx = c.x + fx * (ENC.max.x - 1.1), hz = c.z + fz * (ENC.max.x - 1.1), fort = K.mort ? 1.8 : K.z[0] >= 0.85 ? 1.1 : 0.6; // le feu sort du capot : il couve à 0,7, flambe à 0,85, embrase hors d'usage
          for (let n = Math.floor(dt * (K.mort ? 90 : 20 + 50 * (fort - 0.6)) + Math.random()); n-- > 0;) pix(2, hx + jit(0.7) * fort, c.y + 0.8 + Math.random() * 0.2, hz + jit(0.7) * fort, c.vx * 0.85 + jit(0.5), 0.8 + Math.random() * fort, c.vz * 0.85 + jit(0.5), 0.35 + Math.random() * 0.3 * fort);
          if (Math.random() < dt * (K.mort ? 22 : 8)) pix(1, hx + jit(0.4), c.y + 1.4, hz + jit(0.4), c.vx * 0.3 + jit(0.8), 1 + Math.random(), c.vz * 0.3 + jit(0.8), 1.6 + Math.random()); } // la fumée noire au-dessus des flammes
        if (sp > 4 && !c.air) K.creve.forEach((v, i) => { if (!v || Math.random() > dt * 30) return; const x = i >= 2 ? xf : xr, zs = (i & 1 ? 1 : -1) * (i >= 2 ? zf : zr); emit(c.x + fx * x - fz * zs, c.y + 0.05, c.z + fz * x + fx * zs, c.vx * 0.4 + jit(2), Math.random() * 2, c.vz * 0.4 + jit(2), 0.35, 1, 0.75, 0.35, 22); }); } }
    for (const c of cars) { if (!c.out) { saleFrame(c, dt); huileFrame(c, dt); } const sp = Math.hypot(c.vx, c.vz); if (c.out || sp < 3) continue;
      if (c.rub) marque(c, Math.sign(c.d) || 1, 0); // le long d'un mur : une traînée de peinture (les chocs francs passent par murChoc, à chaque pas)
      const fx = Math.cos(c.th), fz = Math.sin(c.th);
      for (const o of OBJ) for (const off of [1.3, -1.3]) { const dx = o.p.x - (c.x + fx * off), dz = o.p.z - (c.z + fz * off), d = Math.hypot(dx, dz); if (d > 1 + o.S.r || o.p.y > c.y + 1.4 || !(o.dort || o.v.length() < sp * 0.8)) continue;
        const cote = Math.sign(dx * -fz + dz * fx) || 1, lat = 3 + sp * 0.2; o.v.set(c.vx * 1.1 - fz * cote * lat, 1.5 + sp * 0.07 + Math.random(), c.vz * 1.1 + fx * cote * lat); o.w.set(jit(20), jit(10), jit(20)).multiplyScalar(0.3 + sp / 30); if (o.dort && o.S.eclat) for (let q = 0; q < 12; q++) emit(o.p.x, o.p.y + 0.3, o.p.z, c.vx * 0.25 + jit(5), 1.5 + Math.random() * 3.5, c.vz * 0.25 + jit(5), 0.9, ...o.S.eclat, 7); if (o.dort && o.S.son) objSon = o.S.son; o.dort = 0; } } // il part devant et de côté : il sort de la trajectoire
    for (const o of OBJ) { if (o.dort) continue;
      o.v.y -= 9.8 * dt; o.p.addScaledVector(o.v, dt); const wl = o.w.length(); if (wl > 1e-3) { dq.setFromAxisAngle(up.copy(o.w).divideScalar(wl), wl * dt); o.q.premultiply(dq); }
      up.set(0, 1, 0).applyQuaternion(o.q); const sol = o.y0 + Math.abs(up.y) * o.S.h / 2 + (1 - Math.abs(up.y)) * o.S.r; // debout sur sa base, couché sur son flanc
      if (o.p.y < sol) { o.p.y = sol; if (o.v.y < 0) o.v.y *= -0.35; const f = Math.exp(-dt * 9); o.v.x *= f; o.v.z *= f; o.w.multiplyScalar(Math.exp(-dt * 5)); if (o.v.length() < 0.3 && o.w.length() < 0.5) o.dort = 1; }
      objEcrit(o); }
    // shortcut: un objet dort à la hauteur de sa place de départ et peut traverser le mur ; projeté loin dans une pente, il flotte ou s'enfonce un peu
  }

  // ---------- saleté et huile (docs/SPEC-CASSE.md, prototype 3) : visuel ----------
  // Saleté : chaque voiture a son niveau (0 à 1) et sa couleur, mêlée au fil des surfaces (terre : boue, neige : neige, bitume sec : poussière lente) ; la pluie, le mouillé et le gué la lavent.
  // Dans la livrée (salePeint, après eclaire) : chaque cellule de la caisse a son seuil, éclaboussures fines puis plaques, plus vite en bas qu'au toit ; mate et sans reflet sous la saleté.
  const SALES = { terre: [0.42, 0.28, 0.15, 0.025], neige: [0.92, 0.94, 0.97, 0.02], sec: [0.45, 0.43, 0.4, 0.002] }, TMP = new THREE.Color();
  const saleDe = g => g.userData.sale || (g.userData.sale = { n: 0, c: new THREE.Color(0.45, 0.43, 0.4), u: { uSale: { value: 0 }, uSaleH: { value: VO.plan.bas }, uSaleC: { value: null } } });
  function saleFrame(c, dt) { const g = modele(c), sl = saleDe(g), sp = Math.hypot(c.vx, c.vz); if (sp < 3 || c.air) return;
    const q = T.surf[c.idx], k = Math.min(1, sp / 20) * (1 + Math.min(0.5, Math.abs(c.slide || 0))), lave = q.aq > 0.02 || pluieAt(c.idx) > 0; // plus vite et en travers, plus elle en prend
    if (lave) sl.n = Math.max(0, sl.n - (q.aq > 0.12 ? 0.5 : 0.06) * k * dt); // le gué (beaucoup d'eau) lave d'un coup, la pluie et le mouillé doucement
    else { const t = SALES[genre(q)], a = t[3] * k * dt * (1 - sl.n * 0.5); sl.c.lerp(TMP.setRGB(t[0], t[1], t[2]), a / (sl.n + a)); sl.n = Math.min(1, sl.n + a); }
    sl.u.uSale.value = sl.n; }
  const SALE_F = `float sHb = clamp((vSaleP.y - uSaleH) / 1.15, 0.0, 1.0), sL = uSale * (1.7 - 1.4 * sHb); // niveau local : le bas de caisse 1,7 fois plus vite, le toit 0,3 fois
float sN = fract(sin(dot(floor(vSaleP * 7.0), vec3(12.9898, 78.233, 37.719))) * 43758.5453), sN2 = fract(sin(dot(floor(vSaleP * 23.0), vec3(39.3, 11.1, 83.7))) * 43758.5453);
float saleM = max(step(sN2, sL * 0.9) * 0.55, smoothstep(sN - 0.12, sN + 0.12, sL * 1.1 - 0.25)) * (0.55 + 0.45 * clamp(sL, 0.0, 1.0));
diffuseColor.rgb = mix(diffuseColor.rgb, uSaleC, saleM * 0.88);`;
  function salePeint(g) { const m = g.userData.liv; if (!m || m.userData.sale) return; m.userData.sale = 1; const sl = saleDe(g), f = m.onBeforeCompile, k = m.customProgramCacheKey; sl.u.uSaleC.value = sl.c;
    m.onBeforeCompile = sh => { f && f(sh); Object.assign(sh.uniforms, sl.u);
      sh.vertexShader = 'varying vec3 vSaleP;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvSaleP = position;');
      sh.fragmentShader = 'varying vec3 vSaleP;\nuniform float uSale, uSaleH;\nuniform vec3 uSaleC;\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n' + SALE_F)
        .replace('#include <specularmap_fragment>', '#include <specularmap_fragment>\nspecularStrength *= 1.0 - saleM;'); }; // le reflet de la caisse (envMap) passe par specularStrength
    m.customProgramCacheKey = () => (k ? k() : '') + 'sale'; m.needsUpdate = true; }
  // huile : au-delà de 0,6 d'usure à l'avant, le moteur goutte ; des gouttes rondes, sombres et brillantes, de plus en plus serrées ; un anneau de HN, un maillage
  const HN = 1200, hP = new Float32Array(HN * 12), hI = new Uint32Array(HN * 6), hGeo = new THREE.BufferGeometry(), hD = new WeakMap(); let hi = 0;
  for (let k = 0; k < HN; k++) hI.set([k * 4, k * 4 + 1, k * 4 + 2, k * 4 + 1, k * 4 + 3, k * 4 + 2], k * 6);
  hGeo.setAttribute('position', new THREE.BufferAttribute(hP, 3)); hGeo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(HN * 12).map((_, i) => i % 3 === 1 ? 1 : 0), 3));
  hGeo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(HN * 8).map((_, i) => [0, 0, 0, 1, 1, 0, 1, 1][i % 8]), 2)); hGeo.setIndex(new THREE.BufferAttribute(hI, 1));
  const goutte = tex(32, 32, g => { const d = g.createRadialGradient(16, 16, 2, 16, 16, 15); d.addColorStop(0, '#fff'); d.addColorStop(0.6, '#fff'); d.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = d; g.fillRect(0, 0, 32, 32); });
  const hMesh = new THREE.Mesh(hGeo, gloss(new THREE.MeshPhongMaterial({ color: 0x060504, shininess: 90, transparent: true, opacity: 0.85, alphaMap: goutte, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }), 1));
  hMesh.frustumCulled = false; hMesh.userData.dyn = 1; scene.add(hMesh);
  function huileFrame(c, dt) { const z = modele(c).userData.dg.z[0]; if (z < 0.6 || c.air) return; const sp = Math.hypot(c.vx, c.vz), dd = (hD.get(c) || 0) + sp * dt + dt * 0.4, pas = Math.max(0.35, 1.6 - (z - 0.6) * 4); // à l'arrêt aussi, plus lentement
    if (dd < pas) { hD.set(c, dd); return; } hD.set(c, 0);
    const fx = Math.cos(c.th), fz = Math.sin(c.th), xm = VO.roues[1] * 0.6, x = c.x + fx * xm - fz * jit(0.4), zz = c.z + fz * xm + fx * jit(0.4), y = c.y + 0.02, w = 0.06 + Math.random() * 0.08 + (z - 0.6) * 0.15, a = Math.random() * 3.14, ca = Math.cos(a) * w, sa = Math.sin(a) * w, l = 1 + Math.random() * 0.8;
    hP.set([x - ca * l - sa, y, zz - sa * l + ca, x - ca * l + sa, y, zz - sa * l - ca, x + ca * l - sa, y, zz + sa * l + ca, x + ca * l + sa, y, zz + sa * l - ca], hi * 12);
    hGeo.attributes.position.addUpdateRange(hi * 12, 12); hGeo.attributes.position.needsUpdate = true; hi = (hi + 1) % HN; }
  const huileRaz = () => { hP.fill(0); hGeo.attributes.position.clearUpdateRanges(); hGeo.attributes.position.needsUpdate = true; for (const g of [carG, ...opps]) { const sl = saleDe(g); sl.n = 0; sl.u.uSale.value = 0; } };

  fond && await souffle();
  // ---------- fusion du décor fixe : une passe de dessin par matière, au lieu d'une par objet ----------
  // Tout maillage simple, opaque et immobile est fondu avec ceux de la même matière (mêmes ombres) en une seule géométrie, en coordonnées du monde : l'image est la même,
  // mais la ville passe de 950 passes de dessin à 150. Ce qui bouge, ou s'affiche et se cache, doit porter userData.dyn = 1 (lui ou un parent) :
  // ciel, voitures, bateaux, grande roue, dirigeable… Contrôle après avoir ajouté un décor animé : (await import('./outils/perf.js')).mobiles() doit ne rien lister.
  {
    const PAVE = 500, GROS = 30000, lots = new Map(), NM = new THREE.Matrix3(), v = new V3(), cand = [];
    const fixe = o => { for (let p = o; p; p = p.parent) if (p.userData.dyn || !p.visible) return false; return true; };
    scene.updateMatrixWorld(true);
    const simple = o => { const m = o.material, g = o.geometry; return !Array.isArray(m) && !m.transparent && g.drawRange.count === Infinity && !Object.keys(g.morphAttributes).length && fixe(o); };
    scene.traverse(o => { if (o.isMesh && !o.isInstancedMesh && simple(o)) cand.push(o); });
    // le décor posé en nombre (InstancedMesh immobile) y passe aussi : chaque exemplaire devient une pièce, fondue avec tout ce qui a sa matière (une passe de dessin en moins par forme et par zone, ombres et reflets compris) ;
    // sa teinte par exemplaire passe dans une couleur de sommet, sur une copie de la matière. Au-delà de INST sommets, l'instance reste : ce serait trop de mémoire. Ses pièces ne sont pas découpées en pavés (elle était dessinée entière, en une passe), sauf au-delà de 100 000 sommets : les 15 500 blocs du canal (560 000 sommets) coûtaient 1,5 ms de GPU par image, entiers dans la vue et dans chaque face du cube des reflets
    const INST = 600000, inst = [], vc = new Map(), ni = new Map(), uni = g => ni.get(g) || ni.set(g, g.index ? g.toNonIndexed() : g).get(g);
    scene.traverse(o => { if (o.isInstancedMesh && o.count > 0 && simple(o) && (o.geometry.index || o.geometry.attributes.position).count * o.count <= INST) inst.push(o); });
    for (const o of inst) {
      let g = o.geometry, mat = o.material; if (!g.boundingSphere) g.computeBoundingSphere();
      if (o.instanceColor) { g = g.clone(); g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 3).fill(1), 3)); mat = vc.get(mat) || vc.set(mat, Object.assign(mat.clone(), { vertexColors: true })).get(mat); }
      for (let i = 0; i < o.count; i++) { const mw = new THREE.Matrix4(); o.getMatrixAt(i, mw); mw.premultiply(o.matrixWorld); const s = mw.getMaxScaleOnAxis();
        cand.push({ virt: o, enorme: (o.geometry.index || o.geometry.attributes.position).count * o.count > 100000, geometry: g, material: mat, matrixWorld: mw, scale: { x: s, y: s, z: s }, col: o.instanceColor && new THREE.Color().fromArray(o.instanceColor.array, i * 3), castShadow: o.castShadow, receiveShadow: o.receiveShadow, frustumCulled: true, renderOrder: o.renderOrder, layers: o.layers, userData: {}, children: [] }); }
    }
    for (const o of cand) {
      const g = o.geometry; if (!g.boundingSphere) g.computeBoundingSphere();
      const k = [o.material.uuid, +o.castShadow, +o.receiveShadow, +o.frustumCulled, o.renderOrder, o.layers.mask, Object.keys(g.attributes).sort().map(n => n + g.attributes[n].itemSize).join()].join('|');
      if (!lots.has(k)) lots.set(k, []); lots.get(k).push(o);
      o.userData.petit = g.boundingSphere.radius * Math.max(o.scale.x, o.scale.y, o.scale.z) <= 60; // rythme.js trie les aplats lumineux sur la taille de l'objet d'origine
    }
    // un lot lourd (plus de GROS sommets) est découpé en pavés de PAVE mètres, pour que ce qui est hors champ ne soit pas dessiné ; les grandes pièces (sol, rubans) restent entières
    for (const [k, l] of [...lots]) {
      if (l.reduce((s, o) => s + (o.geometry.index || o.geometry.attributes.position).count, 0) < GROS) continue;
      lots.delete(k);
      for (const o of l) { const g = o.geometry, r = g.boundingSphere.radius * o.matrixWorld.getMaxScaleOnAxis(); v.copy(g.boundingSphere.center).applyMatrix4(o.matrixWorld);
        const kp = k + '|' + (r < PAVE / 2 && (!o.virt || o.enorme) ? Math.floor(v.x / PAVE) + ':' + Math.floor(v.z / PAVE) : 'grand'); if (!lots.has(kp)) lots.set(kp, []); lots.get(kp).push(o); }
    }
    for (const l of lots.values()) {
      if (l.length < 2 && !l[0].virt) continue; // un exemplaire seul est fondu quand même : son instance disparaît entière
      // indexé si toutes les pièces le sont : un sommet partagé n'est calculé qu'une fois par le GPU (une boîte : 24 sommets au lieu de 36), et la scène est surtout limitée par ses sommets
      const ix = l.every(o => o.geometry.index), src = l.map(o => ix ? o.geometry : uni(o.geometry)), n = src.reduce((s, g) => s + g.attributes.position.count, 0), G = new THREE.BufferGeometry();
      if (ix) { const I = new (n > 65535 ? Uint32Array : Uint16Array)(src.reduce((s, g) => s + g.index.count, 0)); let b = 0, p = 0;
        l.forEach((o, i) => { const x = src[i].index, miroir = o.matrixWorld.determinant() < 0; for (let j = 0; j < x.count; j++) I[p + j] = b + x.getX(miroir ? j - j % 3 + [0, 2, 1][j % 3] : j); p += x.count; b += src[i].attributes.position.count; });
        G.setIndex(new THREE.BufferAttribute(I, 1)); }
      for (const nom in src[0].attributes) {
        const sz = src[0].attributes[nom].itemSize, A = new Float32Array(n * sz); let base = 0;
        l.forEach((o, i) => {
          const a = src[i].attributes[nom], mw = o.matrixWorld, miroir = mw.determinant() < 0; if (nom === 'normal') NM.getNormalMatrix(mw);
          for (let j = 0; j < a.count; j++) {
            const d = (base + (miroir && !ix ? j - j % 3 + [0, 2, 1][j % 3] : j)) * sz; // échelle négative : on retourne chaque triangle pour qu'il garde sa face (indexé : dans l'index)
            if (nom === 'position') { v.fromBufferAttribute(a, j).applyMatrix4(mw); A[d] = v.x; A[d + 1] = v.y; A[d + 2] = v.z; }
            else if (nom === 'normal') { v.fromBufferAttribute(a, j).applyMatrix3(NM).normalize(); A[d] = v.x; A[d + 1] = v.y; A[d + 2] = v.z; }
            else if (nom === 'color' && o.col) { A[d] = a.getX(j) * o.col.r; A[d + 1] = a.getY(j) * o.col.g; A[d + 2] = a.getZ(j) * o.col.b; }
            else { A[d] = a.getX(j); if (sz > 1) A[d + 1] = a.getY(j); if (sz > 2) A[d + 2] = a.getZ(j); if (sz > 3) A[d + 3] = a.getW(j); }
          }
          base += a.count;
        });
        G.setAttribute(nom, new THREE.BufferAttribute(A, sz));
      }
      const o0 = l[0], m = new THREE.Mesh(G, o0.material); m.castShadow = o0.castShadow; m.receiveShadow = o0.receiveShadow; m.frustumCulled = o0.frustumCulled; m.renderOrder = o0.renderOrder; m.layers.mask = o0.layers.mask;
      m.matrixAutoUpdate = false; m.userData.petit = l.some(o => o.userData.petit); scene.add(m);
      if (window.__origines) m.userData.src = l.map(o => { let p = o.virt || o; while (p && !p.userData.origine) p = p.parent; return [p ? p.userData.origine : '?', (o.geometry.index || o.geometry.attributes.position).count]; }); // outils/profil.js : d'où viennent les pièces fondues
      for (const o of l) o.userData.fondu = 1;
    }
    for (const o of inst) o.parent.remove(o); // toutes ses pièces sont fondues (même seules dans leur lot)
    for (const o of cand.reverse()) if (o.userData.fondu && !o.virt) { if (o.children.length) o.layers.set(31); else o.parent.remove(o); } // les enfants d'abord ; un parent qui en garde reste dans l'arbre sans être dessiné (calque 31)
  }
  { const fixe = o => { for (let p = o; p; p = p.parent) if (p.userData.dyn || !p.visible) return false; return true; }; // les ombres mobiles (voir ombres) : tout ce qui porte une ombre sans être fixe
    scene.traverse(o => { if (o.isLight) { o.layers.enable(OMBD); o.layers.enable(OMBI); } else if (o.castShadow && !fixe(o)) o.layers.set(o.isInstancedMesh ? OMBI : OMBD); }); } // les lumières aussi : sans elles, la passe des ombres mobiles changeait l'éclairage de three, qui recompilait alors la clé de chaque matière à chaque image
  const bouge = o => { for (let p = o; p; p = p.parent) if (p.userData.dyn) return true; return false; };
  scene.traverse(o => { if (o.isInstancedMesh) { if (bouge(o)) o.frustumCulled = false; else o.computeBoundingSphere(); } if (o.material) eclaire(o.material); }); for (const sc of [scene, repliScene]) sc.traverse(o => { for (const m of [].concat(o.material || [])) m.forceSinglePass = true; }); // r149+ : une transparente double face se dessinait en deux passes (éclat doublé en additif) ; le décor posé en nombre est écarté hors champ sur l'étendue de ses instances (sphère calculée une fois) ; ce qui bouge reste toujours dessiné
  for (const g of [carG, ...opps]) salePeint(g); // la saleté se greffe sur le shader d'eclaire de chaque livrée

  // ---------- audio : voir audio.js (window.SON) ; ici seulement ce que le jeu et le HUD lisent ----------
  let radioT = 0;
  const zap = () => { // après la dernière station : SILENCE (musique coupée), puis retour à la première
    if (!SON.musicOn) { SON.toggleMusic(); SON.setStation(0); } else if (SON.station === SON.stations.length - 1) SON.toggleMusic(); else SON.setStation(SON.station + 1);
    radioT = 2.5; };
  const nomRadio = () => SON.musicOn ? SON.nom : 'SILENCE';
  // boîte et régime : calculés même sans audio, la jauge du HUD s'en sert
  function drivetrain(vu, dt, gas) { // rapport et régime viennent de la physique (sim.js) ; ici on les lisse, par vue, pour le son et la jauge
    const car = vu.car, up = Math.sign(car.gear - vu.gear); vu.gear = car.gear; // +1 rapport monté, -1 descendu
    let tgt = car.rpm / CARD.red;
    if (state === 'count' && gas) tgt = 0.8 + 0.05 * Math.sin(performance.now() / 22); // rupteur sur la grille
    vu.rpm += (tgt - vu.rpm) * Math.min(1, dt * 14); vu.load += ((car.shiftT > 0 ? 0 : gas) - vu.load) * Math.min(1, dt * 12); vu.spool += ((gas ? vu.rpm : 0) - vu.spool) * Math.min(1, dt * 2.5);
    return up;
  }

  fond && await souffle();
  // ---------- état de jeu ----------
  // clés « vpr8. » : la V3 change la conduite (glisse progressive, frein arrière, adhérence sol × voiture, surfaces visibles), les records « vpr7. » ne sont plus comparables.
  // une série de records par carte ; la ville garde ses clés d'origine
  const PRE = 'vpr8.' + (M.id === 'ville' ? '' : M.id + '.');
  const store = { get: k => { try { return JSON.parse(localStorage.getItem(PRE + k)); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(PRE + k, JSON.stringify(v)); } catch (e) { } } };
  const pref = (k, d) => { try { return localStorage.getItem(k) || d; } catch (e) { return d; } }, setPref = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } };
  // Langue de l'interface : 'fr' ou 'en', choisie à l'écran d'accueil et gardée (vpr.langue). Traduction et titres anglais : langue.js
  let langue = pref('vpr.langue', 'fr') === 'en' ? 'en' : 'fr';
  const tr = s => traduit(s, langue);
  const appliqueLangue = () => { document.documentElement.lang = langue; document.title = langue === 'en' ? 'Full Throttle City' : 'Ville à plein régime'; };
  appliqueLangue();
  let msel = 5; // ligne du menu principal
  // écran d'accueil : le navigateur n'autorise le son qu'après un geste ; on le demande d'abord, pour que la musique soit là quand le menu s'affiche
  // Écran d'accueil : il sert d'abord à choisir la langue. Gauche / droite (ou haut / bas) change la langue tout de suite, Entrée part vers le menu principal.
  // (variantes essayées et écartées : branche prototype/accueil)
  let accueil = true, aMenu = false, tFlash = 0;
  const entrer = () => { SON.init(); accueil = false; };
  const choisitLangue = l => { if (l === langue) return; langue = l; setPref('vpr.langue', langue); appliqueLangue(); SON.beep(550); };
  const accueilAct = a => { // a : 'v' haut / bas, 'h' gauche / droite, 'ok' valider, '' autre touche (elle ne fait qu'ouvrir le son)
    aMenu = true;
    if (a === 'v' || a === 'h') choisitLangue(langue === 'en' ? 'fr' : 'en');
    else if (a === 'ok') { tFlash = performance.now(); SON.stinger(true); entrer(); choix = true; csel = deux() ? 1 : 0; if (Q.get('salon') && !NET.role) { csel = 2; rejoint(Q.get('salon')); } } // venu par le lien d'un salon : on le rejoint
  };
  // Choix de la partie, entre l'accueil et le menu principal : solo (tous les modes, une vue), écran partagé (2 à 4 joueurs), en ligne (pas encore fait). Échap y revient depuis le menu, et revient de là à la langue.
  let choix = false, csel = 0;
  const CHOIX = [['SOLO', 'COURSES CONTRE IA, GLISSE, CHRONO'], ['ECRAN PARTAGE', '2 A 4 JOUEURS SUR CET ECRAN'], ['EN LIGNE', 'COURSE A PLUSIEURS, PAR CODE DE SALON']];
  const choixAct = (code, key) => {
    if (enl) { salonAct(code, key); return; }
    if (/^(ArrowUp|KeyW)$/.test(code)) csel = (csel + 2) % 3; else if (/^(ArrowDown|KeyS)$/.test(code)) csel = (csel + 1) % 3;
    else if (code === 'Escape') { choix = false; accueil = true; }
    else if (code === 'Enter' || code === 'Space') {
      if (csel === 2) { enl = { sel: 0, saisie: '' }; SON.beep(660); return; }
      joueurs(csel ? Math.max(2, +pref('vpr7.ecran', '2')) : 1); setPref('vpr7.joueurs', VUES.length); choix = false; msel = 5; SON.beep(660); }
  };
  // ---------- En ligne (reseau.js) ----------
  // Salon par code de 4 lettres, ou par le lien ?salon=CODE. L'hôte choisit la carte au menu principal et lance : tout le monde court en Course (3 tours), chacun sur son écran, sa voiture en J1.
  // L'hôte fait tourner stepRace (son entrée et celles reçues, NET.ins) et diffuse l'état ; l'invité ne simule rien, il pose l'état reçu (NET.applique). Pas de pause en ligne : Échap quitte.
  // enl = l'écran du salon : { sel : 0 créer / 1 rejoindre, saisie : code tapé, attente : invité connecté } ; null ailleurs. NET.role dit si l'on est dans un salon (il survit au changement de carte, pas ce fichier).
  let enl = null;
  const enLigne = () => !!NET.role, invite = () => NET.role === 'invite';
  const attente = () => { choix = true; csel = 2; enl = { sel: 1, saisie: NET.code, attente: true }; };
  const quitteSalon = () => { NET.fermer(); if (state !== 'title') toMenu(); choix = true; csel = 2; enl = { sel: 0, saisie: '' }; };
  const onNet = m => {
    if (m.t === 'erreur') { padDit(m.msg); quitteSalon(); }
    else if (m.t === 'parti') padDit('JOUEUR ' + (m.i + 1) + ' PARTI');
    else if (m.t === 'stop' && state !== 'title') toMenu(); // l'hôte est revenu au menu : l'invité attend la course suivante
    else if (m.t === 'go') { if (m.carte === M.id) { enl = null; choix = false; start(true); } else if ((cible = CARTES.find(c => c.id === m.carte))) { try { sessionStorage.setItem('vpr.netgo', 1); } catch (e) { } changeCarte(); } } // autre carte : elle se charge, la course part à l'arrivée (fin du fichier)
  };
  const rejoint = code => { joueurs(1); NET.rejoindre(code, onNet); enl = { sel: 1, saisie: NET.code, attente: true }; };
  const salonAct = (code, key) => {
    if (code === 'Escape') { quitteSalon(); enl = null; return; }
    if (NET.role === 'hote') { if (code === 'Enter' || code === 'Space') { enl = null; choix = false; msel = 5; mode = 'course'; SON.beep(660); } return; } // au menu principal : l'hôte choisit la carte, DEMARRER lance
    if (enl.attente) return;
    if (enl.sel) { // saisie du code : la lettre tapée (e.key), pas la position de la touche
      if (code === 'Backspace') enl.saisie = enl.saisie.slice(0, -1);
      else if (/^[a-z]$/i.test(key || '') && enl.saisie.length < 4) enl.saisie += key.toUpperCase();
      else if ((code === 'Enter' || code === 'NumpadEnter') && enl.saisie.length === 4) rejoint(enl.saisie);
      else if (/^Arrow(Up|Down)$/.test(code)) enl.sel = 0;
      return;
    }
    if (/^(ArrowUp|ArrowDown|KeyW|KeyS)$/.test(code)) enl.sel = 1;
    else if (code === 'Enter' || code === 'Space') { joueurs(1); NET.heberger(onNet); mode = 'course'; SON.beep(660);
      try { navigator.clipboard.writeText(location.origin + location.pathname + '?salon=' + NET.code).then(() => padDit('LIEN DU SALON COPIE'), () => { }); } catch (e) { } }
  };
  for (const ev of ['mousedown', 'pointerup', 'touchend']) addEventListener(ev, e => { inactif = 0; if (demo) { if (!cible && ev !== 'mousedown') demoFin(); return; } if (performance.now() - demoSortie < 400) return; if (accueil) { if (ev === 'mousedown') return; if (e.isTrusted && !aMenu) PER.hidAuto(); SON.init(); const l = e.clientX < innerWidth / 2 ? 'fr' : 'en'; if (l === langue) accueilAct('ok'); else { aMenu = true; choisitLangue(l); } } else SON.init(); }); // à l'accueil : un clic à gauche choisit le français, à droite l'anglais ; un second clic du même côté part
  const fmt = t => `${t / 60 | 0}'${String(t % 60 | 0).padStart(2, '0')}"${String(t * 100 % 100 | 0).padStart(2, '0')}`;
  addEventListener('mousemove', e => { if (state !== 'race' && state !== 'count') return; const vu = VUES[0]; vu.lookA = clamp(vu.lookA + e.movementX * 0.006, -Math.PI, Math.PI); vu.lookP = clamp(vu.lookP + e.movementY * 0.03, -1, 5); vu.lookT = 2.5; }); // caméra libre à la souris : celle de la première vue (il n'y a qu'une souris)
  let state = 'title', count = 0, shown = 0, goT = 0, acc = 0, last = 0, manual = pref('vpr.boite', 'a') === 'm';
  // secteurs (entrée et sortie de l'échangeur) et fantôme du record : [x, y, z, cap] à 20 Hz
  // mode : 'solo' (contre-la-montre à tours enchaînés), 'glisse' (deux tours, à points : le score est tenu par sim.js, voir GL), 'course' (3 tours contre les IA de sim.js), 'casse' (la même course, mais les dégâts jouent sur la conduite ; score : place + takedowns, voir CASSE_PTS) 'elim' (course à élimination : le dernier sort à chaque passage de ligne) ou 'tournee' (toutes les cartes à la suite, voir plus bas) ; race = la course en cours, sinon null
  const MODES = ['solo', 'glisse', 'course', 'casse', 'elim', 'tournee'], MODES2 = ['course', 'casse', 'elim', 'glisse'], AVEC_IA = ['course', 'casse', 'elim', 'tournee'], enCourse = () => AVEC_IA.includes(mode);
  // défi par lien : l'adresse « …#defi=version.carte.données » (defiCode de sim.js) porte le tour d'un autre joueur. cartes.js a déjà ouvert sa carte ; ici on relit la trace : le jeu s'ouvre en contre-la-montre face à ce fantôme.
  // Lien illisible, abîmé, d'une autre version de la physique ou pour une carte inconnue : DEFI reste nul et le menu dit pourquoi (defiErr).
  const lienLu = (h => h && defiLit(h[1]))(/^#defi=(.*)$/.exec(location.hash)), defiErr = lienLu && (lienLu.err || (lienLu.carte !== M.id ? 'LIEN DE DEFI : CARTE INCONNUE' : '')), DEFI = lienLu && !defiErr ? lienLu : null;
  addEventListener('hashchange', () => location.reload()); // un lien collé dans l'onglet du jeu ne recharge pas la page tout seul
  let mode = DEFI ? 'solo' : MODES.find(m => pref('vpr7.mode', '') === JSON.stringify(m)) || 'solo', race = null; // race : celle de la session (ses.race), gardée ici pour le dessin ; le mode est mémorisé une fois pour toutes les cartes
  // À deux joueurs (MODES2 : Course, Élimination, Glisse en duel) le mode et la difficulté ont leurs propres clés, vpr7.mode2 et vpr7.diff2 : revenir à un joueur rend le solo tel qu'on l'a laissé (voir joueurs).
  // Rien d'autre n'est lu ni écrit à deux : pas de record, de médaille, de fantôme, de trophée ni de Tournée ; une course à deux a toujours un objet race, donc les records et la Glisse seule de session.js n'y passent jamais.
  const cle = k => 'vpr7.' + k + (deux() ? '2' : ''), duel = () => deux() && mode === 'glisse';
  // CASSE : points = place à l'arrivée (une voiture hors d'usage n'en a pas) + CASSE_PTS.td par takedown infligé
  const CASSE_PTS = { place: [10, 6, 4, 2], td: 3 }, cassePts = c => (c.out || !c.fin ? 0 : CASSE_PTS.place[raceOrder(race).filter(o => o.fin).indexOf(c)] || 0) + c.ca.td * CASSE_PTS.td;
  const vivantes = () => race.cars.filter(c => !c.out), partie = c => c.out && race.t - c.out > 5; // élimination : voitures encore en course ; voiture sortie depuis 5 s, qu'on ne montre plus
  let prev = 'race', psel = 0;
  const H = 1 / 120, INS = []; // INS : l'entrée de chaque humain pour stepRace, réécrite à chaque pas
  let diff = clamp(+pref('vpr7.diff', 1) | 0, 0, DIFF.length - 1); // difficulté du mode course (DIFF de sim.js)
  // médailles du contre-la-montre : le tour lancé du pilote automatique sert de référence ; M.med = [bronze, argent, or] en multiples de ce temps
  const REFT = tourRef(T, H), REF = REFT.t; // (il part avec une jauge de nitro pleine, qu'il dépense en ligne droite : ce qu'un bon tour en gagne ; sa trace sert aux fantômes bronze et argent)
  const MED = M.med || [1.1, 1.03, 0.97], MEDN = ['BRONZE', 'ARGENT', 'OR'], MEDC = ['#c87a3a', '#c8ccd4', '#ffd23a'];
  // la partie (départ, fin de course, records, médailles, fantôme, Tournée) : session.js ; ce fichier la dessine et la fait entendre
  const ses = nouvelleSession({ T, carte: M, cartes: SOIREE, store, prefs: { get: pref, set: setPref }, auto: AUTO, defi: DEFI, ref: REFT, med: MED }), medal = ses.medal;
  // fantôme du contre-la-montre, choisi par le jeu : la première médaille pas encore gagnée, sinon le record (ou le défi, venu par un lien). fant = indice dans FANT
  // Bronze et argent : la trace du tour de référence ralentie au ratio de la médaille. Or : la trace de la carte dans traces-or.js (un tour avec glisses et nitro, que le pilote automatique ne sait pas faire), ramenée au temps du seuil or.
  // Battre le fantôme d'une médaille, c'est donc la gagner : le fantôme passe alors à la suivante (après l'or : au record).
  const FANT = ['NON', 'RECORD', ...MEDN, ...(DEFI ? ['DEFI'] : [])], FANTC = ['#000000', '#00f0ff', ...MEDC, '#ff4fd8']; // (venu par un lien de défi : un choix de plus, le fantôme de l'expéditeur, en rose)
  const nomF = (f = ses.fant) => FANT[f] + (f === 5 ? ' ' + fmt(DEFI.t) : f > 1 ? ' ' + fmt(REF * MED[f - 2]) : f && ses.best ? ' ' + fmt(ses.best) : '');
  // lien de défi du dernier tour bouclé sur cette carte (touche L, ou menu de pause) : copié dans le presse-papiers ; si le navigateur le refuse, montré dans une boîte d'où le copier
  function lienDefi() {
    const dernier = ses.dernier; if (!dernier) { padDit("BOUCLE D'ABORD UN TOUR EN CONTRE-LA-MONTRE"); return; }
    const url = location.origin + location.pathname + '#defi=' + defiCode(M.id, dernier.t, dernier.trace), dit = () => padDit('LIEN DE DÉFI COPIÉ : ' + fmt(dernier.t)), montre = () => prompt(tr('LIEN DE DEFI A COPIER :'), url);
    try { navigator.clipboard.writeText(url).then(dit, montre); } catch (e) { montre(); }
  }
  // mode Glisse : le score ne compte que si les deux tours sont bouclés en moins de GLT (deux tours au temps de bronze, plus 30 %) ; record et médailles par carte
  // GLM = [bronze, argent, or] en points, fixés à la main par carte d'après le pilote en glisse de test-cartes.js sur deux tours (son score vaut à peu près le bronze). Carte sans ligne ici : 8, 16 et 28 points par mètre de tour
  const GLT = ses.GLT, GLM = { ville: [20000, 40000, 70000], touge: [20000, 40000, 70000], wangan: [50000, 90000, 140000], paris: [15000, 30000, 55000], canal: [150000, 250000, 350000], stade: [18000, 36000, 60000], givre: [40000, 75000, 120000], terre: [75000, 135000, 200000] }[M.id] || [8, 16, 28].map(k => Math.round(k * T.len / 1000) * 1000);
  const medG = s => GLM.filter(k => s >= k).length;
  // Tournée : toutes les cartes à la suite, dans l'ordre de la nuit (SOIREE de cartes.js, du crépuscule à l'aube), en courses de 3 tours contre les rivaux de chaque carte. Points, grille, sauvegarde et trophée : la session (tn, tnOu, clos, trophee)
  const tn = () => ses.tn(diff), tnOu = () => ses.tnOu(diff), trophee = () => ses.trophee(diff);
  const bilan = vu => { const c = vu.car, l = vu.lap0, b = [c.nDrift - l[0], c.nBoost - l[1], c.nWall - l[2]]; vu.lap0 = [c.nDrift, c.nBoost, c.nWall]; return b; }; // glisses, coups de nitro et murs du tour bouclé par le joueur de cette vue

  function start(go) { // go : départ demandé par l'hôte (invité en ligne)
    SON.init(); accueil = false;
    if (enLigne()) { if (invite() && !go) return; mode = 'course'; if (!invite()) { if (NET.n < 2) { padDit("EN ATTENTE D'UN AUTRE JOUEUR"); return; } NET.go(M.id); } } // en ligne : Course seulement ; l'hôte lance pour tous
    if (deux() && !AUTO && !PLACES.every(p => p && branche(p))) { inscrit(); return; } // à deux, on ne part que les deux places prises ; elles sont gardées : une revanche ne redemande rien
    ses.clos();
    if (mode === 'tournee' && SOIREE[tnOu().manche] !== M) { // la manche se court sur une autre carte : on y va sans recharger, et la course part à l'arrivée (vpr.go)
      if (!cible) { cible = SOIREE[tnOu().manche]; try { sessionStorage.setItem('vpr.go', 1); } catch (e) { } changeCarte(); } return; } // (tnFin reste en place le temps que la carte arrive : un second appui sur Entrée ne recompte pas la manche)
    const nj = enLigne() ? NET.n : VUES.length; // à deux joueurs : deux humains en tête de liste et les deux rivaux les plus rapides, toujours quatre voitures
    race = ses.start({ mode, diff, nj, ia: enCourse(), duel: duel() }); fsel = 0;
    if (race && invite()) { const g = race.glob = race.cars.slice(), h = [NET.moi, ...g.slice(0, nj).map((_, i) => i).filter(i => i !== NET.moi)]; race.cars = [...h.map(i => g[i]), ...g.slice(nj)]; } // invité : sa voiture en tête de liste, comme un joueur 1 (R.glob garde l'ordre de l'hôte, celui des états reçus)
    if (race) race.cars.forEach((c, i) => { c.k = i < nj ? (i ? 2 + i : -1) : i - nj; c.rl = c.rlT = c.bl = 0; }); // et ses tours : dernier tour compté, son heure, meilleur tour (voir frame) // rang de chaque voiture dans OPP et opps : le joueur 2 prend le dernier modèle, les rivaux les premiers
    const seule = race ? null : newCar(T); VUES.forEach((vu, i) => { suit(vu, race ? race.cars[i] : seule); vu.gear = 0; vu.splitMsg = null; }); VUES[0].moi.manual = manuel1(); // (hors course, un mode sans rivaux lancé à deux : les deux vues suivent la seule voiture)
    state = 'count'; count = 3; shown = 0; tTraf = 0; acc = 0; dgRaz();
    pique = null; piqueT = 0; if (race && enCourse() && VUES.length === 1 && !demo && !enLigne()) { const r = race.cars.filter(c => c.k >= 0 && c.k < 3); pic(r[Math.random() * r.length | 0], 'grille'); }
  }
  // Mode démo : à l'écran titre (accueil ou menu principal, en solo), DEMO_ATTENTE secondes sans rien toucher, le pilote automatique court une Course, carte après carte dans l'ordre de la nuit (SOIREE).
  // Rien n'est enregistré (une Course n'écrit rien) et le mode choisi au menu ne bouge pas. Une touche, un bouton ou un clic rend l'écran d'où l'on venait, sur la carte d'où l'on venait.
  // demo = { de : carte d'origine, a : venu de l'accueil, mode, diff : ceux du menu, t : temps passé sur cette carte } ; d'une carte à l'autre il passe par sessionStorage (vpr.demo), le retour par vpr.demoFin.
  const DEMO_ATTENTE = 25, DEMO_DUREE = 50;
  let demo = null, inactif = 0, demoSortie = 0;
  const demoPossible = () => state === 'title' && (accueil || !choix) && !ins && !enl && !cible && VUES.length === 1 && !enLigne() && !DEFI && !AUTO && !ST;
  function demoLance(d) { demo = { ...(d || { de: M.id, a: accueil, mode, diff }), t: 0 }; mode = 'course'; diff = 1; start(); }
  function demoSuite() { cible = SOIREE[(SOIREE.indexOf(M) + 1) % SOIREE.length]; try { sessionStorage.setItem('vpr.demo', JSON.stringify(demo)); } catch (e) { } changeCarte(); }
  function demoFin() {
    const d = demo; demo = null; inactif = 0; demoSortie = performance.now(); mode = d.mode; diff = d.diff; toMenu();
    if (d.de !== M.id && (cible = CARTES.find(m => m.id === d.de))) { try { sessionStorage.setItem('vpr.demoFin', d.a ? 'a' : 'm'); } catch (e) { } changeCarte(); }
    else if (d.a) accueil = true;
  }
  // menu de pause : [ligne, action]. À deux, pas de boîte (chacun a la sienne, sur son périphérique)
  const pauseItems = () => [['REPRENDRE', () => { state = prev; }], ['RECOMMENCER', start], ...(deux() ? [] : [['BOITE : ' + (manual ? 'MANUELLE' : 'AUTO'), () => { manual = !manual; VUES[0].moi.manual = manual; }]]),
    ['RADIO : ' + nomRadio(), zap], ['QUITTER', toMenu]];
  function toMenu() { if (NET.role === 'hote') NET.stop(); if (invite()) attente(); ses.toMenu(); state = 'title'; ins = false; race = null; const c = newCar(T); for (const vu of VUES) suit(vu, c); msel = 5; }
  // menu principal : 0 carte, 1 joueurs, 2 mode, 3 difficulté, 4 boîte, 5 démarrer ; d = -1 / +1 (gauche / droite ; Entrée vaut +1)
  const cache = i => (i === 1 && !deux()) || (i === 3 && !enCourse()); // en solo pas de ligne JOUEURS ; DIFFICULTE seulement contre des IA
  let cible = null, cibleT = 0; // carte demandée au menu, pas encore affichée
  function changeCarte() {
    if (cible === M) { cible = null; window.__voulu = M.id; return; }
    const c = cible; window.__voulu = c.id; // la dernière demandée : une construction finie entre-temps pour une autre carte ne s'affiche pas
    construit(c).then(api => {
      if (window.__voulu !== c.id || window.__g === api) return;
      setPref('vpr.carte', c.id); try { sessionStorage.setItem('vpr.menu', 1); history.replaceState(null, '', location.pathname + '?carte=' + c.id + (Q.has('joueurs') ? '&joueurs=' + VUES.length : '')); } catch (e) { } // le nombre de joueurs suit la préférence ; forcé par l'adresse (?joueurs=), il y reste d'une carte à l'autre
      SON.carte(c); api.reprend(); if (window.lanceRythme) lanceRythme();
    });
  }
  function menuAct(d) {
    if (cible && msel === 5) { try { sessionStorage.setItem('vpr.go', 2); } catch (e) { } clearTimeout(cibleT); changeCarte(); return; } // DEMARRER pendant qu'une carte arrive : la course part sur elle
    if (msel === 0) { // changer de carte : le nom change tout de suite, la carte s'affiche dès qu'on cesse de faire défiler (0,15 s) ; déjà construite, aussitôt
      cible = CARTES[(CARTES.indexOf(cible || M) + d + CARTES.length) % CARTES.length];
      clearTimeout(cibleT); cibleT = setTimeout(changeCarte, 150);
    } else if (msel === 1) { // écran partagé seulement (la ligne n'existe pas en solo) : 2, 3 ou 4 joueurs, gardé dans les préférences
      joueurs(2 + (VUES.length - 2 + d + 3) % 3); setPref('vpr7.joueurs', VUES.length); setPref('vpr7.ecran', VUES.length); }
    else if (msel === 2) { // à un joueur MODES, à deux : Course, Élimination, Glisse en duel ; la difficulté a sa propre ligne
      const O = deux() ? MODES2 : MODES; mode = O[(O.indexOf(mode) + d + O.length) % O.length]; setPref(cle('mode'), JSON.stringify(mode)); }
    else if (msel === 3) { diff = (diff + d + DIFF.length) % DIFF.length; setPref(cle('diff'), diff); } // ligne DIFFICULTE : seulement pour les modes avec IA (voir cache)
    else if (msel === 4) { manual = !manual; VUES[0].moi.manual = manual; setPref('vpr.boite', manual ? 'm' : 'a'); }
    else start();
  }
  // boîte et rapports, attribués au périphérique qui a appuyé (d : +1, -1, 0 = bascule manuelle / automatique) : ils vont à la voiture de la vue inscrite sous ce périphérique, sinon à celle du joueur 1
  // (en solo, tout périphérique conduit la seule voiture). Le choix du joueur 1 est la préférence gardée (manual) ; celui du joueur 2 ne vit que sur sa voiture, automatique à chaque départ.
  const manuel1 = () => manual && !(deux() && PLACES[0] === 'clavierD'); // la boîte du joueur 1 : le clavier des flèches n'a pas de touches de rapport, il roule en automatique (la préférence, elle, reste)
  const boite = (id, d) => {
    const vu = VUES.find(v => v.periph === id) || (deux() ? null : VUES[0]); if (!vu || vu.spec) return; // à deux : un périphérique sans place ne touche à rien, un joueur éliminé non plus (sa vue suit une autre voiture)
    const c = vu.car, m = vu.n ? c.manual : manual;
    if (d) { if (m) c.gear = clamp(c.gear + d, 0, CARD.ratios.length - 1); return; }
    c.manual = !m; c.gear = vu.gear; if (!vu.n) { manual = !m; setPref('vpr.boite', manual ? 'm' : 'a'); }
  };
  const onKey = e => { // clavier : e.code = position physique (KeyW/KeyA sont Z/Q sur un clavier AZERTY)
    PER.clavier(e); SON.init(); // le contexte audio ne peut démarrer qu'après un geste
    if (/^Arrow|Space|Slash/.test(e.code)) e.preventDefault(); // Slash : recherche rapide de Firefox
    if (e.repeat) return;
    if (e.isTrusted && e.code === 'KeyJ') PER.hidDemande(); // avant tout le reste : marche aussi depuis l'accueil
    else if (e.isTrusted && accueil && !aMenu) PER.hidAuto();
    commande(e);
  };
  const commande = e => { // une commande de menu, d'une touche du clavier ou d'une manette (poll : { code, key, periph })
    SON.init(); inactif = 0; if (demo) { if (!cible) demoFin(); return; }
    if (accueil) { accueilAct(/^(ArrowUp|ArrowDown|KeyW|KeyS)$/.test(e.code) ? 'v' : /^(ArrowLeft|ArrowRight|KeyA|KeyD)$/.test(e.code) ? 'h' : e.code === 'Enter' || e.code === 'Space' ? 'ok' : ''); return; }
    if (choix) { choixAct(e.code, e.key); return; }
    const key = (e.key || '').toLowerCase(); // lettre réellement tapée, pour les commandes nommées par une lettre (le pilotage, lui, reste en positions physiques)
    if (ins) { // inscription : les places se prennent par les appuis (voir inscription) ; ici le clavier seul : Échap libère la dernière place tenue par un clavier, ou referme l'écran, Entrée part quand les deux places sont prises
      if (e.periph) return; const n = Math.max(PLACES.indexOf('clavierG'), PLACES.indexOf('clavierD'));
      if (e.code === 'Escape') { if (n < 0) { ins = false; if (state !== 'title') toMenu(); } else PLACES[n] = VUES[n].periph = ''; }
      else if (e.code === 'Enter' && PLACES.every(p => p)) inscritFin();
      return;
    }
    if (state === 'pause') { const np = pauseItems().length;
      if (e.code === 'Escape' || key === 'p') state = prev;
      else if (e.code === 'ArrowUp' || e.code === 'KeyW') psel = (psel + np - 1) % np;
      else if (e.code === 'ArrowDown' || e.code === 'KeyS') psel = (psel + 1) % np;
      else if (e.code === 'Enter' || e.code === 'Space') pauseItems()[psel][1]();
      return;
    }
    if (e.code === 'Escape' && enLigne() && state !== 'title') { if (invite()) quitteSalon(); else toMenu(); return; } // en ligne, pas de pause : l'invité quitte le salon, l'hôte revient au menu (les invités attendent)
    if (e.code === 'Escape' && ses.raceEnd) { toMenu(); return; } // course finie : retour direct au menu
    if ((e.code === 'Escape' || key === 'p') && (state === 'race' || state === 'count')) { prev = state; state = 'pause'; psel = 0; return; }
    if (state === 'title') {
      const dx = (e.code === 'ArrowRight' || e.code === 'KeyD' ? 1 : 0) - (e.code === 'ArrowLeft' || e.code === 'KeyA' ? 1 : 0);
      const pas = s => { do msel = (msel + s + 6) % 6; while (cache(msel)); };
      if (e.code === 'ArrowUp' || e.code === 'KeyW') pas(-1);
      else if (e.code === 'ArrowDown' || e.code === 'KeyS') pas(1);
      else if (e.code === 'Enter' || e.code === 'Space') menuAct(1);
      else if (dx && msel < 5) menuAct(dx);
      else if (e.code === 'Escape') { choix = true; csel = deux() ? 1 : 0; if (enLigne()) { csel = 2; enl = { sel: 0, saisie: '' }; } }
      else if (key === 'i' && deux()) inscrit(); // à deux : rouvrir l'inscription pour changer de périphérique (les places prises ne sont plus redemandées au départ)
      return;
    }
    if (mode === 'tournee' && ses.raceEnd) { if (e.code === 'Enter') { if (!ses.tnFin) ses.clos(); else if (ses.tnFin.fini) toMenu(); else start(); } } // Tournée : arrivée, puis classement général, puis manche suivante (pas de « rejouer »)
    else if (ses.raceEnd && deux()) { // tableau commun : REVANCHE ou MENU, au choix de l'un ou de l'autre. Entrée (le bouton de gaz d'une manette) ne compte qu'1,5 s après l'arrivée : on ne relance pas une course en passant la ligne
      if (/^Arrow|^Key[WASD]$/.test(e.code)) fsel ^= 1; else if (e.code === 'Enter' && performance.now() - tFin > 1500) { if (fsel) toMenu(); else start(); return; } }
    else if ((e.code === 'Enter' && ses.raceEnd) || (key === 'r' && !deux())) start(); // à deux, R ne relance pas : la touche voisine du rapport + du joueur 1 (E) ; RECOMMENCER est au menu de pause
    const clv = deux() ? 'clavierG' : 'clavier'; // à deux, les touches de boîte sont celles du clavier gauche
    if (key === 'g') boite(e.periph || clv, 0);
    if (e.code === 'KeyE' || e.code === 'KeyQ') boite(e.periph || clv, e.code === 'KeyE' ? 1 : -1); // physiquement A / E autour du Z en AZERTY
    if (key === 'l' && mode === 'solo') lienDefi();
    if (key === 'c') zap();
    if (key === 'm') SON.toggleMusic();
  };
  addEventListener('keydown', onKey);
  let ins = false, fsel = 0, tFin = 0;
  const PER = Peripheriques({ nav: navigator, win: window, signal: arret.signal, places: window.__places || (window.__places = ['', '']), dit: s => padDit(s) }), PLACES = PER.places, keys = PER.keys, branche = PER.branche; // PLACES : gardé sur window, il survit au changement de carte, comme le renderer
  const padNote = document.body.appendChild(document.createElement('div')); padNote.setAttribute('role', 'status');
  padNote.style.cssText = 'position:fixed;top:12px;left:50%;transform:translateX(-50%);padding:8px 12px;background:#0c0c10;color:#ffd23a;font:12px "Press Start 2P",monospace;border:2px solid #ffd23a;pointer-events:none;display:none;z-index:9';
  let padNoteT = 0; const padDit = s => { padNote.textContent = tr(s); padNote.style.display = ''; clearTimeout(padNoteT); padNoteT = setTimeout(() => { padNote.style.display = 'none'; }, 3000); };
  // Écran partagé. PLACES[i] = périphérique du joueur i + 1, gardé pour la session (sur window : il survit au changement de carte, comme le renderer) et recopié dans vu.periph.
  // ins : l'écran d'inscription est ouvert, par-dessus le menu (avant un départ) ou par-dessus une course mise en pause (un périphérique inscrit a disparu). Il est dessiné par ecrans(), sur la couche commune.
  // Chaque périphérique qui appuie prend la première place libre ; + sur une manette libère sa place (sans place : referme l'écran) ; les deux places prises, B ou Entrée fait partir, ou rend la main au menu de pause.
  const nomP = id => id === 'clavierG' ? 'CLAVIER ZQSD' : id === 'clavierD' ? 'CLAVIER FLECHES' : (id[0] === 'j' ? 'JOY-CON ' : 'MANETTE ') + (+id.replace(/\D/g, '') + 1);
  const inscrit = () => { ins = true; PER.oublie(); if (state !== 'title' && state !== 'pause') { prev = state; state = 'pause'; psel = 0; } }; // (les appuis de l'image qui ouvre l'écran ne prennent pas de place)
  const inscritFin = () => { ins = false; if (state === 'title') start(); };
  function inscription() {
    const r = PER.inscrire(); if (r === 'ferme') { ins = false; if (state !== 'title') toMenu(); } else if (r === 'part') inscritFin(); else VUES.forEach((vu, i) => { vu.periph = PLACES[i]; });
  }
  // À deux, hors inscription : un périphérique inscrit qui n'est plus là en course met en pause et rouvre l'inscription pour sa place.
  function manettes2() {
    if (state !== 'title' && !AUTO && !ins) VUES.forEach((vu, i) => { if (!branche(vu.periph)) { PLACES[i] = vu.periph = ''; inscrit(); padDit('PÉRIPHÉRIQUE DÉCONNECTÉ : JOUEUR ' + (i + 1)); } });
  }

  // ---------- HUD pixel (canvas 2D à la résolution du jeu) ----------
  const PS = '"Press Start 2P", monospace', JP = 'DotGothic16, sans-serif', HU = TH.hud, Y = HU.y, C = HU.c, RD = HU.r; // couleurs et style d'interface de la carte
  document.fonts.load('8px ' + PS); document.fonts.load('16px ' + JP, 'スピード');
  const fonte = f => { if (hg.f_ !== f) { hg.font = f; hg.f_ = f; } }; // reposer la police à chaque texte coûtait autant que de l'écrire ; la dernière posée est notée sur le contexte (une par vue)
  // texte pixel ; split = décalage rouge/cyan façon glitch
  function txt(s, x, y, size, col, align = 'left', split = 0, font = PS) {
    s = tr(s); fonte(size + 'px ' + font); hg.textAlign = align; hg.textBaseline = 'top'; x = Math.round(x);
    if (split && HU.split) { hg.fillStyle = RD; hg.fillText(s, x - split, y); hg.fillStyle = C; hg.fillText(s, x + split, y); }
    hg.fillStyle = col; hg.fillText(s, x, y);
  }
  const cadre = (c, x, y, w, h) => { R(hg, c, x, y, w, 1); R(hg, c, x, y + h - 1, w, 1); R(hg, c, x, y, 1, h); R(hg, c, x + w - 1, y, 1, h); };
  const panel = (x, y, w, h) => { // un style de panneau par carte
    R(hg, HU.fond, x, y, w, h);
    if (HU.style === 'cyber') { R(hg, Y, x, y, 2, h); R(hg, Y, x, y, w, 1); R(hg, C, x + w - 8, y + h - 1, 8, 1); } // barres jaunes, coin cyan
    else if (HU.style === 'panneau') { cadre('#ffffff', x + 1, y + 1, w - 2, h - 2); coins(x, y, w, h); } // panneau d'autoroute : vert, filet blanc, coins arrondis
    else if (HU.style === 'plaque') { cadre('#2a7a4a', x, y, w, h); cadre('#2a7a4a', x + 1, y + 1, w - 2, h - 2); coins(x, y, w, h); } // plaque de rue émaillée : bleu, cadre vert, coins arrondis
    else if (HU.style === 'bloc') R(hg, C, x, y + h - 2, w, 2); // bloc souligné
    else if (HU.style === 'tableau') { for (let j = 1; j < h; j += 2) R(hg, 'rgba(255,255,255,.05)', x, y + j, w, 1); cadre(C, x, y, w, h); } // tableau d'affichage de stade : trame de lignes, cadre
    else if (HU.style === 'rallye') { for (let i = 0; i < w; i += 8) R(hg, (i >> 3) % 2 ? '#16161c' : C, x + i, y, Math.min(8, w - i), 3); R(hg, C, x, y + h - 1, w, 1); } // bande de chantier en tête, comme sur les panneaux de spéciale
    else if (HU.style === 'givre') { R(hg, C, x, y, w, 1); R(hg, C, x, y + h - 1, w, 1); for (const [a, b] of [[0, 1], [1, 0], [0, 2], [2, 1], [3, 0], [1, 3]]) { R(hg, '#e8f4ff', x + a, y + 1 + b, 1, 1); R(hg, '#e8f4ff', x + w - 1 - a, y + h - 2 - b, 1, 1); } } // deux traits, et du givre pris aux coins
    else { R(hg, C, x, y, w, 1); R(hg, C, x, y + h - 1, w, 1); } // deux traits
  };
  const coins = (x, y, w, h) => { for (const [a, b] of [[0, 0], [1, 0], [0, 1]]) for (const [u, v] of [[x + a, y + b], [x + w - 1 - a, y + b], [x + a, y + h - 1 - b], [x + w - 1 - a, y + h - 1 - b]]) hg.clearRect(u, v, 1, 1); }; // coins arrondis : trois pixels ôtés à chaque coin
  const tag = (s, cx, y, bg) => { fonte('8px ' + PS); const w = hg.measureText(tr(s)).width + 12; R(hg, bg, Math.round(cx - w / 2), y, w, 14); txt(s, cx, y + 3, 8, '#08080c', 'center'); };
  const EQN = 20, EQR = 10, fft = new Uint8Array(32);
  // minicarte : tracé dessiné une seule fois dans un canvas hors écran (x monde vers la droite, z vers le bas = vue de dessus non inversée)
  const MM = (() => {
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const s of S) { x0 = Math.min(x0, s.x); x1 = Math.max(x1, s.x); z0 = Math.min(z0, s.z); z1 = Math.max(z1, s.z); }
    const w = 84, h = 56, k = Math.min((w - 4) / (x1 - x0), (h - 4) / (z1 - z0)), c = document.createElement('canvas'), g = c.getContext('2d');
    const kx = Math.min((w - 4) / (x1 - x0), k * 2.5), kz = Math.min((h - 4) / (z1 - z0), k * 2.5); // un tracé très allongé (canal) est étiré jusqu'à 2,5 fois sur son petit axe, sinon il tient en quelques pixels
    c.width = w; c.height = h;
    const px = x => Math.round((w - (x1 - x0) * kx) / 2 + (x - x0) * kx), pz = z => Math.round((h - (z1 - z0) * kz) / 2 + (z - z0) * kz);
    for (const s of S) R(g, '#e8e8e4', px(s.x), pz(s.z), 1, 1);
    R(g, RD, px(S[0].x) - 2, pz(S[0].z) - 2, 5, 5); // ligne de départ
    return { c, px, pz };
  })();
  // Écran d'accueil : la carte tourne derrière, assombrie ; le titre, puis un drapeau par langue, la langue choisie encadrée et son drapeau qui flotte
  const TT = (s, x, y, size, col) => { fonte(size + 'px ' + PS); hg.textAlign = 'center'; hg.textBaseline = 'top'; hg.fillStyle = col; hg.fillText(s, Math.round(x), Math.round(y)); }; // texte tel quel, sans tr()
  const drapeau = (l, x, y, w, h) => {
    if (l === 'fr') { R(hg, '#1f3fbf', x, y, w / 3 | 0, h); R(hg, '#f4f4f4', x + (w / 3 | 0), y, w / 3 | 0, h); R(hg, '#e0283a', x + (2 * w / 3 | 0), y, w - (2 * w / 3 | 0), h); return; }
    R(hg, '#1a2a7a', x, y, w, h); hg.save(); hg.beginPath(); hg.rect(x, y, w, h); hg.clip(); hg.lineCap = 'butt';
    for (const [lw, c] of [[h * 0.2, '#f4f4f4'], [h * 0.07, '#e0283a']]) { hg.strokeStyle = c; hg.lineWidth = lw; hg.beginPath(); hg.moveTo(x, y); hg.lineTo(x + w, y + h); hg.moveTo(x + w, y); hg.lineTo(x, y + h); hg.stroke(); }
    hg.restore(); R(hg, '#f4f4f4', x + w / 2 - h * 0.17, y, h * 0.34, h); R(hg, '#f4f4f4', x, y + h * 0.33, w, h * 0.34); R(hg, '#e0283a', x + w / 2 - h * 0.1, y, h * 0.2, h); R(hg, '#e0283a', x, y + h * 0.4, w, h * 0.2);
  };
  function accueilDessin(HW) {
    const now = performance.now(), t = now / 1000, cx = HW / 2, blink = (now / 400 | 0) % 2 === 0, titre = titreCarte('ville', ['VILLE A', 'PLEIN REGIME'], langue);
    R(hg, 'rgba(6,6,14,.62)', 0, 0, HW, HH);
    txt(titre[0], cx, 18, 24, Y, 'center', 2); txt(titre[1], cx, 44, 24, Y, 'center', 2);
    TT(tr('CHOISIS TA LANGUE'), cx, 84, 8, C);
    [['fr', 'FRANÇAIS'], ['en', 'ENGLISH']].forEach(([l, nom], i) => { const on = langue === l, x = cx - 156 + i * 168, y = 102, w = 144, h = 104;
      R(hg, on ? 'rgba(18,18,36,.95)' : 'rgba(8,8,16,.8)', x, y, w, h); if (on) { cadre(Y, x, y, w, h); cadre(Y, x + 1, y + 1, w - 2, h - 2); } else cadre('#3a3a4a', x, y, w, h);
      const fy = y + 12 + (on ? Math.sin(t * 5) * 2 | 0 : 0); drapeau(l, x + 32, fy, 80, 48); if (!on) R(hg, 'rgba(0,0,0,.6)', x + 32, fy, 80, 48);
      TT(nom, x + w / 2, y + 72, 16, on ? Y : '#6a6a78'); if (on && blink) { TT('>', x - 11, y + 44, 16, Y); TT('<', x + w + 11, y + 44, 16, Y); } });
    if (blink) tag('ENTREE : JOUER', cx, 222, Y);
    TT(tr('< >  CHANGER     OU CLIQUE UN DRAPEAU'), cx, 246, 8, '#c8c8d0');
  }
  function salonDessin(HW) {
    const cx = HW / 2, blink = (performance.now() / 400 | 0) % 2 === 0, h = NET.role === 'hote';
    R(hg, 'rgba(6,6,14,.8)', 0, 0, HW, HH); txt('EN LIGNE', cx, 20, 24, Y, 'center', 2);
    if (h || enl.attente) {
      txt(h ? 'CODE DU SALON' : 'SALON', cx, 66, 8, C, 'center'); txt(NET.code, cx, 80, 32, Y, 'center', 2);
      txt(h || NET.moi ? NET.n + ' / ' + NET.MAXJ + ' JOUEURS' + (h ? '' : '   VOUS ETES J' + (NET.moi + 1)) : 'CONNEXION...', cx, 128, 8, '#e8e8e4', 'center');
      if (h) { if (blink) tag('ENTREE : CHOISIR LA CARTE', cx, 160, Y); } else txt("L'HOTE CHOISIT LA CARTE ET LANCE", cx, 160, 8, C, 'center');
      txt('ECHAP : ' + (h ? 'FERMER LE SALON' : 'QUITTER LE SALON'), cx, 246, 8, '#c8c8d0', 'center'); return;
    }
    [['CREER UN SALON', 'UN CODE A DONNER AUX AUTRES'], ['REJOINDRE UN SALON', enl.saisie.padEnd(4, '_').split('').join(' ')]].forEach(([l, s], i) => { const on = enl.sel === i, x = cx - 150, y = 78 + i * 44;
      R(hg, on ? 'rgba(18,18,36,.95)' : 'rgba(8,8,16,.8)', x, y, 300, 38); cadre(on ? Y : '#3a3a4a', x, y, 300, 38); if (on) cadre(Y, x + 1, y + 1, 298, 36);
      txt(l, cx, y + 6, 16, on ? Y : '#e8e8e4', 'center'); txt(s, cx, y + 26, 8, C, 'center'); });
    if (blink) tag(enl.sel ? 'TAPE LE CODE, PUIS ENTREE' : 'ENTREE : CHOISIR', cx, 182, Y);
    txt('HAUT/BAS : CHOISIR   ECHAP : RETOUR', cx, 246, 8, '#c8c8d0', 'center');
  }
  function choixDessin(HW) {
    if (enl) { salonDessin(HW); return; }
    const cx = HW / 2, blink = (performance.now() / 400 | 0) % 2 === 0, ti = titreCarte(M.id, HU.titre, langue);
    R(hg, 'rgba(6,6,14,.62)', 0, 0, HW, HH);
    txt(ti[0], cx, 14, 24, Y, 'center', 2); txt(ti[1], cx, 40, 24, Y, 'center', 2);
    if (tFlash && performance.now() - tFlash < 400) R(hg, 'rgba(255,255,255,' + (1 - (performance.now() - tFlash) / 400).toFixed(2) + ')', 0, 0, HW, HH); // éclair blanc au sortir de l'accueil
    CHOIX.forEach(([l, s], i) => { const on = csel === i, off = false, x = cx - 150, y = 78 + i * 44;
      R(hg, on ? 'rgba(18,18,36,.95)' : 'rgba(8,8,16,.8)', x, y, 300, 38); cadre(on ? Y : '#3a3a4a', x, y, 300, 38); if (on) cadre(Y, x + 1, y + 1, 298, 36);
      txt(l, cx, y + 6, 16, on ? Y : off ? '#6a6a78' : '#e8e8e4', 'center'); txt(s, cx, y + 26, 8, off ? '#6a6a78' : C, 'center'); });
    if (blink) tag('ENTREE : CHOISIR', cx, 222, Y);
    txt('HAUT/BAS : CHOISIR   ECHAP : LANGUE', cx, 246, 8, '#c8c8d0', 'center');
  }
  // Écrans communs à tous les joueurs : accueil, menu principal, pause. Dessinés dans hg sur une grille de HW × 270 : le HUD de la vue en solo, la couche plein écran à deux (voir couche).
  function ecrans(HW) {
    const cx = HW / 2, blink = (performance.now() / 160 | 0) % 3 > 0;
    if (state === 'title' && accueil) { accueilDessin(HW); return; }
    if (state === 'title' && choix) { choixDessin(HW); return; }
    if (ins) { // inscription : qui tient quoi, et ce qu'il reste à faire
      const ok = PLACES.every(p => p), pa = state === 'pause';
      R(hg, 'rgba(8,8,12,.9)', 0, 0, HW, HH); txt('INSCRIPTION', cx, 22, 24, Y, 'center', 2);
      txt(pa ? 'PERIPHERIQUE DECONNECTE : COURSE EN PAUSE' : 'CHACUN APPUIE SUR SON PERIPHERIQUE', cx, 58, 8, pa ? RD : C, 'center');
      const n = PLACES.length, q = n > 2, VU = q ? ['HAUT GAUCHE', 'HAUT DROITE', 'BAS GAUCHE', 'BAS DROITE'] : ['VUE DU HAUT', 'VUE DU BAS']; // à 3 ou 4 : les cases en 2 × 2, comme les vues, plus basses
      PLACES.forEach((p, i) => { const x = cx - 150 + (i % 2) * 156, y = q ? 72 + (i >> 1) * 46 : 78, h = q ? 42 : 62, col = i ? OPP[2 + i][1] : Y; panel(x, y, 144, h);
        txt('JOUEUR ' + (i + 1), x + 72, y + (q ? 5 : 8), 8, col, 'center'); txt(VU[i], x + 72, y + (q ? 16 : 21), 8, '#e8e8e4', 'center');
        if (p) txt(nomP(p), x + 72, y + (q ? 29 : 42), 8, col, 'center'); else if (blink) txt('APPUIE', x + 72, y + (q ? 29 : 42), 8, '#e8e8e4', 'center'); });
      ['ZQSD OU FLECHES : UNE TOUCHE DE SON COTE', 'MANETTE : UN BOUTON   J : JOY-CON', 'ECHAP / + : LIBERER SA PLACE'].forEach((l, i) => txt(l, cx, (q ? 164 : 156) + i * (q ? 12 : 13), 8, '#e8e8e4', 'center'));
      if (!ok) txt(q ? 'IL FAUT TOUTES LES PLACES POUR PARTIR' : 'IL FAUT LES DEUX PLACES POUR PARTIR', cx, 214, 8, C, 'center'); else if (blink) tag('ENTREE / B : ' + (pa ? 'CONTINUER' : 'PARTIR'), cx, 210, Y);
      return;
    }
    if (state === 'title') { // menu principal : la carte tourne derrière, on choisit carte, mode et boîte
      R(hg, 'rgba(8,8,12,.45)', 0, 0, HW, HH); const d2 = deux(); // à deux, le menu dit ce qui est vrai à deux
      if (HU.sur[0]) txt(HU.sur[0], cx, 6, 16, C, 'center', 0, JP); txt(mode === 'tournee' ? 'TOURNEE · ' + SOIREE[0].heure + ' > ' + SOIREE[SOIREE.length - 1].heure : mode === 'course' ? 'COURSE · 3 TOURS' : mode === 'casse' ? 'CASSE · 3 TOURS' : mode === 'elim' ? 'ELIMINATION · 4 TOURS' : mode === 'glisse' ? (d2 ? 'GLISSE EN DUEL' : 'GLISSE') + ' · 2 TOURS' : HU.sur[1], cx, 27, 8, C, 'center');
      const ti = titreCarte(M.id, HU.titre, langue); txt(ti[0], cx, 44, 24, Y, 'center', 2); txt(ti[1], cx, 70, 24, Y, 'center', 2);
      if (tFlash && performance.now() - tFlash < 400) R(hg, 'rgba(255,255,255,' + (1 - (performance.now() - tFlash) / 400).toFixed(2) + ')', 0, 0, HW, HH); // éclair blanc au sortir de l'accueil
      panel(cx - 160, 100, 320, 140);
      const L = [['CARTE', (cible || M).nom + '  ' + (CARTES.indexOf(cible || M) + 1) + '/' + CARTES.length], ['JOUEURS', d2 ? VUES.length + ' : ECRAN PARTAGE' : 'SOLO'], ['MODE', mode === 'tournee' ? 'TOURNEE' : mode === 'course' ? 'COURSE' : mode === 'casse' ? 'CASSE' : mode === 'elim' ? 'ELIMINATION' : mode === 'glisse' ? d2 ? 'GLISSE EN DUEL' : 'GLISSE' : 'CONTRE-LA-MONTRE'], ['DIFFICULTE', DIFF[diff].nom], [d2 ? 'BOITE J1' : 'BOITE', manuel1() ? 'MANUELLE' : 'AUTO']].map((r, i) => [...r, i]).filter(r => !cache(r[2]));
      const serre = L.length > 4; // 5 lignes (à deux, contre des IA) : plus rapprochées, pour laisser DEMARRER au-dessus du tracé
      L.forEach(([l, v, i], k) => {
        const on = msel === i, y = (serre ? 104 : 105) + k * (serre ? 10 : 12);
        txt((on ? '> ' : '  ') + l, cx - 152, y, 8, on ? Y : '#e8e8e4'); txt(on ? '< ' + v + ' >' : v, cx + 152, y, 8, on ? Y : C, 'right');
      });
      const go = mode === 'tournee' && tn() ? 'REPRENDRE' : 'DEMARRER'; if (msel === 5) { if (blink) tag('> ' + go + ' <', cx, serre ? 154 : 152, Y); } else txt(go, cx, serre ? 157 : 155, 8, '#e8e8e4', 'center');
      hg.drawImage(MM.c, cx - 152, 170); // le tracé, puis la fiche de la carte
      [CARD.nom, (T.len / 1000).toFixed(1).replace('.', ',') + ' KM', mode === 'tournee' ? (tn() ? 'MANCHE ' + (tn().manche + 1) + '/' + SOIREE.length + ' · ' + SOIREE[tn().manche].heure + ' · ' + tn().pts[0] + ' PTS' : 'UNE NUIT, ' + SOIREE.length + ' MANCHES') : mode === 'course' ? d2 ? ['', '', '2 JOUEURS ET 2 RIVAUX', '3 JOUEURS ET 1 RIVAL', '4 JOUEURS, SANS IA'][VUES.length] : '3 TOURS CONTRE 3 IA' : mode === 'elim' ? 'LE DERNIER SORT' : d2 ? 'LE MEILLEUR SCORE GAGNE' : mode === 'glisse' ? 'RECORD ' + (ses.bestG ? ses.bestG + ' PTS' : '--') : 'RECORD ' + (ses.best ? fmt(ses.best) : '--')].forEach((l, i) => txt(l, cx - 58, 174 + i * 11, 8, i ? '#e8e8e4' : C));
      if (mode === 'tournee') { const r = trophee(); txt(r ? 'TROPHEE ' + MEDN[3 - r] : 'PAS ENCORE DE TROPHEE', cx - 58, 218, 8, r ? MEDC[3 - r] : '#e8e8e4'); } // le trophée de cette difficulté : or, argent ou bronze selon la meilleure place finale
      if (d2) txt("RIEN N'EST ENREGISTRE", cx - 58, 218, 8, '#e8e8e4'); // ni record, ni médaille, ni fantôme : rien à montrer non plus
      else if (!enCourse()) { const gl = mode === 'glisse', m = gl ? medG(ses.bestG) : medal(ses.best); if (m) txt(MEDN[m - 1], cx + 152, 196, 8, MEDC[m - 1], 'right'); if (m < 3) txt('VISE ' + MEDN[m] + ' ' + (gl ? GLM[m] + ' PTS' : fmt(REF * MED[m])), cx - 58, 218, 8, MEDC[m]); } // médaille acquise, et la prochaine à aller chercher
      txt('HAUT/BAS : CHOISIR  GAUCHE/DROITE : CHANGER', cx, 245, 8, '#e8e8e4', 'center'); txt(d2 ? 'I : INSCRIPTION (MANETTES, JOY-CON, CLAVIER)' : 'FLECHES / ZQSD   ESPACE : GLISSE   X : NITRO', cx, 257, 8, '#e8e8e4', 'center');
      if (cible && !(window.__cartes || {})[cible.id]) { // carte choisie qui se construit encore (la première fois seulement) : son tracé à la place de la fiche
        R(hg, '#08080c', cx - 156, 166, 312, 70); const P = cible.pts, xs = P.map(p => p[0]), zs = P.map(p => p[1]), x0 = Math.min(...xs), z0 = Math.min(...zs), k = Math.min(80 / (Math.max(...xs) - x0 || 1), 52 / (Math.max(...zs) - z0 || 1));
        hg.strokeStyle = '#e8e8e4'; hg.lineWidth = 1; hg.beginPath(); P.forEach(p => hg.lineTo(cx - 150 + (p[0] - x0) * k, 172 + (p[1] - z0) * k)); hg.closePath(); hg.stroke();
        txt(cible.nom, cx - 58, 174, 8, C); txt('CHARGEMENT...', cx - 58, 196, 8, blink ? Y : '#e8e8e4');
      }
      if (enLigne()) tag('SALON ' + NET.code + ' · ' + NET.n + ' JOUEURS', cx, 25, Y); else if (defiErr) tag(defiErr, cx, 25, RD); else if (d2) { } else if (DEFI) tag('DEFI : ' + fmt(DEFI.t) + ' A BATTRE', cx, 25, FANTC[5]);; // à la place du sous-titre : plus bas, le bandeau mordait sur le titre
      return;
    }
    if (state === 'pause') {
      R(hg, 'rgba(8,8,12,.95)', 0, 0, HW, HH); txt('PAUSE', cx, 36, 32, Y, 'center', 2);
      pauseItems().forEach(([s], i) => i === psel ? tag('> ' + s + ' <', cx, 92 + i * 18, Y) : txt(s, cx, 95 + i * 18, 8, '#e8e8e4', 'center'));
      txt('HAUT / BAS : CHOISIR   ENTREE : VALIDER', cx, 246, 8, C, 'center');
    }
    if (ses.raceEnd && race && state === 'race') { // à deux, les deux joueurs arrivés : le tableau commun. Course et Élimination : les quatre voitures, les écarts, les meilleurs tours ; Glisse en duel : les deux scores et le vainqueur
      const o = raceOrder(race), t1 = o[0].fin, nom = c => pil(c)[0], ord = n => n + (n === 1 ? 'ER' : 'E');
      R(hg, 'rgba(8,8,12,.8)', 0, 0, HW, HH); panel(cx - 170, 40, 340, 176);
      if (race.delai) { const nc = race.cars.length, hi = Math.max(...race.cars.map(c => c.pts)), gs = race.cars.filter(c => c.pts === hi), g = gs.length > 1 ? null : gs[0];
        txt('GLISSE EN DUEL', cx, 50, 16, Y, 'center', 1); txt(g ? nom(g) + ' GAGNE' : 'EGALITE', cx, 76, 16, g ? pil(g)[1] : '#e8e8e4', 'center');
        race.cars.forEach((c, i) => { const x = cx - 170 + (i + 0.5) * 340 / nc, col = pil(c)[1], dans = c.fin && c.fin <= race.delai; txt(nom(c), x, 104, 8, col, 'center'); txt(String(Math.round(c.pts)), x, 118, 16, col, 'center', 1);
          txt(dans ? fmt(c.fin) : 'HORS DELAI', x, 142, 8, dans ? '#e8e8e4' : RD, 'center'); if (nc > 2) { txt('GLISSES ' + c.nDrift, x, 156, 8, '#e8e8e4', 'center'); txt('MURS ' + c.nWall, x, 166, 8, '#e8e8e4', 'center'); } else txt('GLISSES ' + c.nDrift + '  MURS ' + c.nWall, x, 156, 8, '#e8e8e4', 'center'); }); // à 3 ou 4, les colonnes sont trop étroites pour une ligne
        txt('DELAI ' + fmt(race.delai), cx, nc > 2 ? 178 : 174, 8, C, 'center');
      } else {
        txt('ARRIVEE', cx, 48, 16, Y, 'center', 1); txt(VUES.map(v => { const c = v.moi; return nom(c) + ' ' + ord(c.pos); }).join('   '), cx, 70, 8, C, 'center');
        const ca = race.casse; txt('TEMPS', cx - 4, 88, 8, C, 'right'); txt(ca ? 'TAKEDOWNS' : 'ECART', cx + (ca ? 90 : 62), 88, 8, C, 'right'); txt(ca ? 'POINTS' : 'MEIL. TOUR', cx + 158, 88, 8, C, 'right');
        if (ca) { const v = o.slice().sort((a, b) => cassePts(b) - cassePts(a))[0]; txt('VAINQUEUR AUX POINTS : ' + nom(v), cx, 160, 8, pil(v)[1], 'center'); }
        if (ca) o.forEach((c, i) => { const y = 102 + i * 15, col = c.k < 0 || c.k >= 3 ? pil(c)[1] : '#e8e8e4'; txt((i + 1) + '. ' + nom(c), cx - 158, y, 8, pil(c)[1]); txt(c.fin ? fmt(c.fin) : c.out ? "HORS D'USAGE" : 'EN PISTE', cx - 4, y, 8, col, 'right'); txt(String(c.ca.td), cx + 90, y, 8, col, 'right'); txt(String(cassePts(c)), cx + 158, y, 8, col, 'right'); });
        else o.forEach((c, i) => { const y = 102 + i * 15, col = c.k < 0 || c.k >= 3 ? pil(c)[1] : '#e8e8e4'; txt((i + 1) + '. ' + nom(c), cx - 158, y, 8, pil(c)[1]); // les deux joueurs dans leur couleur sur toute la ligne
          txt(c.fin ? fmt(c.fin) : c.out ? 'SORT A ' + fmt(c.out) : 'EN PISTE', cx + (c.fin ? -4 : 62), y, 8, col, 'right'); if (i && c.fin) txt('+' + (c.fin - t1).toFixed(2), cx + 62, y, 8, col, 'right'); txt(c.bl ? fmt(c.bl) : '--', cx + 158, y, 8, col, 'right'); });
        txt((race.elim ? 'ELIMINATION' : race.casse ? 'CASSE' : 'COURSE') + ' · NIVEAU ' + DIFF[diff].nom, cx, 170, 8, '#e8e8e4', 'center');
      }
      ['REVANCHE', 'MENU'].forEach((l, i) => i === fsel ? tag('> ' + l + ' <', cx - 70 + i * 140, 190, Y) : txt(l, cx - 70 + i * 140, 193, 8, '#e8e8e4', 'center'));
      txt('GAUCHE / DROITE : CHOISIR   ENTREE : VALIDER', cx, 226, 8, C, 'center');
    }
  }
  const PALIERS = [300, 250, 200, 150, 100, 50, 30, 10]; // paliers de distance des alertes (m) : on affiche celui qu'on a déjà franchi, jamais plus loin que la vérité
  function drawHUD(vu, dt, sp, warn) { // le HUD d'une vue : sa voiture, sa caméra (étiquettes des adversaires), ses bandeaux, sur son canvas
    const { car, cam, cth, rpm, load, peak, result, splitMsg, hudT, w: HW } = vu, seul = !COM, fini = ses.raceEnd || vu.fini, manu = vu.n ? car.manual : manual, moi = vu.moi; hg = vu.hg; // fini : ce joueur est arrivé (à deux, l'autre peut rouler encore) ; manu : sa boîte ; moi : sa voiture (car est celle que la vue regarde : une autre une fois éliminé, à deux)
    hg.clearRect(0, 0, HW, HH);
    const cx = HW / 2, blink = (performance.now() / 160 | 0) % 3 > 0;
    if (state === 'title') { if (seul) ecrans(HW); hudT.needsUpdate = true; return; } // accueil et menu : dans le HUD de la vue en solo, sur la couche commune à deux
    // chrono
    const gl = mode === 'glisse'; // mode Glisse : tour sur 2, délai à tenir, puis le score, le multiplicateur et les points de la glisse en cours
    panel(6, 6, 132, 50); txt(race ? 'TOUR ' + car.lap + '/' + race.laps : gl ? 'TOUR ' + clamp(Math.floor(car.dist / N) + 1, 1, 2) + '/2' : 'TOUR ' + ses.lapN, 12, 11, 8, C); if (HU.jp) txt(HU.jp[0], 132, 6, 16, C, 'right', 0, JP);
    txt(fmt(race ? car.fin || car.out || race.t : ses.tRace), 12, 24, 16, Y, 'left', 1); if (race && !gl) { const nv = Math.max(car.pos, vivantes().length), dev = raceOrder(race)[car.pos - 2], pc = car.pos === 1 ? Y : car.pos === nv ? RD : '#e8e8e4'; // la place en gros à côté du chrono ; dessous, l'écart en secondes à la voiture de devant (distance / vitesse : approché)
      panel(6, 60, 62, 50); txt(String(car.pos), 14, 68, 32, pc, 'left', 2); txt(car.pos === 1 ? 'ER' : 'E', 46, 68, 8, pc); txt('/' + nv, 46, 94, 8, C); // sous le chrono : au centre en haut, les bandeaux de fin de tour la recouvraient en 4:3
      if (dev && !fini) { const g = (dev.dist - car.dist) * 2 / Math.max(sp, 15); txt('+' + g.toFixed(1) + ' ' + pil(dev)[0], 12, 44, 8, g < 1 ? Y : '#e8e8e4'); } else txt(fini ? '' : 'EN TETE', 12, 44, 8, Y); }
    else txt(gl ? 'DELAI ' + fmt(GLT) : ses.best ? 'REC ' + fmt(ses.best) : 'REC --', 12, 44, 8, gl && ses.tRace > GLT ? RD : C); // rouge : seulement le délai dépassé
    if (gl && !fini) { const au = race && race.cars[1 - vu.n]; // en duel : le score de l'autre joueur sous le sien (figé s'il est arrivé)
      panel(144, 6, 110, au ? 55 : 41); txt('SCORE', 150, 11, 8, C); if (au) { txt(pil(au)[0], 150, 48, 8, pil(au)[1]); txt(String(Math.round(au.fin ? au.pts : au.score)), 248, 48, 8, pil(au)[1], 'right'); } txt('x' + car.mult, 248, 11, 8, car.mult > 1 ? Y : '#e8e8e4', 'right'); txt(String(Math.round(car.score)), 248, 25, 16, Y, 'right', 1);
      if (car.cours > 0) tag('GLISSE +' + Math.round(car.cours) + (car.mult > 1 ? '  x' + car.mult : ''), cx, 66, car.glD >= GL.min ? Y : '#e8e8e4'); // blanche tant qu'elle est trop courte pour compter
    }
    // vitesse
    panel(HW - 126, HH - 74, 120, 68); txt(HU.mph ? 'MPH' : 'KM/H', HW - 120, HH - 69, 8, C); if (HU.jp) txt(HU.jp[1], HW - 12, HH - 74, 16, C, 'right', 0, JP);
    txt(String(sp * 3.6 * (M.kmh || 1) / (HU.mph ? 1.609 : 1) | 0), HW - 10, HH - 54, 32, Y, 'right', 1); // HU.mph : en miles, là où la route en compte
    // jauge de puissance façon égaliseur : les colonnes s'allument avec le régime, dansent avec le son, crêtes qui retombent
    panel(6, HH - 78, 138, 72); txt(String(Math.round(rpm * CARD.red / 100) * 100), 12, HH - 73, 8, C); if (manu && rpm > 0.92 && blink) txt('SHIFT', 54, HH - 73, 8, RD); else txt(manu ? 'MANU' : 'AUTO', 54, HH - 73, 8, manu ? Y : C); txt(String(car.gear + 1), 138, HH - 75, 16, car.shiftT > 0 ? '#ffffff' : Y, 'right', 1); // régime en tr/min, rapport (blanc pendant le passage) txt('G' + (gear + 1), 136, HH - 73, 16, Y, 'right', 1);
    if (SON.ana) SON.ana.getByteFrequencyData(fft);
    if (HU.jauge === 'aiguille') { // compte-tours à aiguille : demi-cadran gradué tous les 1 000 tr/min, zone rouge, aiguille en gros pixels qui frémit à pleine charge
      const ox = 75, oy = HH - 12, ro = 46, ang = f => Math.PI * (1 + f), pt = (a, q, c, t = 1) => R(hg, c, Math.round(ox + Math.cos(a) * q) - (t >> 1), Math.round(oy + Math.sin(a) * q) - (t >> 1), t, t);
      for (let f = 0; f <= 1.001; f += 0.01) pt(ang(f), ro + 1, f > 0.88 ? RD : C);
      for (let k = 0; k * 1000 <= CARD.red; k++) { const f = k * 1000 / CARD.red; for (let q = ro - (k % 2 ? 3 : 6); q <= ro; q++) pt(ang(f), q, f > 0.88 ? RD : '#e8e8e4'); }
      const a = ang(clamp(rpm, 0, 1.04) + (Math.random() - 0.5) * 0.012 * load); for (let q = 0; q < ro - 4; q++) pt(a, q, rpm > 0.92 ? RD : Y, 2);
      R(hg, '#e8e8e4', ox - 2, oy - 2, 5, 5);
    } else if (HU.jauge === 'led') { // barre de diodes, tableau de bord numérique américain : des segments qui montent en courbe, vert, jaune, rouge ; le haut s'allume sur la musique
      for (let i = 0; i < 24; i++) { const fr = (i + 0.5) / 24, h = 6 + Math.round(30 * fr * fr), on = fr <= rpm, a = SON.ana ? fft[1 + (i >> 1)] / 255 : 0;
        R(hg, !on ? '#1c1c2c' : fr > 0.88 ? RD : fr > 0.66 ? Y : '#40ff80', 12 + i * 5, HH - 12 - h, 4, h); if (on && a > 0.6) R(hg, '#ffffff', 12 + i * 5, HH - 12 - h, 4, 1); }
    } else for (let i = 0; i < EQN; i++) { // égaliseur
      const fr = (i + 0.5) / EQN, on = fr <= rpm, a = SON.ana ? fft[1 + i] / 255 : 0.5;
      const L = clamp(on ? (0.3 + 0.7 * fr) * (0.65 + 0.35 * a) + 0.1 * load : 0.22 * a, 0, 1), rows = Math.round(L * EQR);
      peak[i] = Math.max(peak[i] - dt * 0.9, L);
      for (let j = 0; j < EQR; j++) R(hg, j >= rows ? '#1c1c2c' : !on ? '#2a4a5a' : j > 7 || fr > 0.88 ? RD : j > 4 ? Y : C, 12 + i * 6, HH - 14 - j * 4, 5, 3);
      R(hg, '#ffffff', 12 + i * 6, HH - 14 - Math.min(EQR - 1, Math.round(peak[i] * EQR)) * 4, 5, 1);
    }
    if (radioT > 0 || state === 'count' || state === 'pause') { panel(HW - 126, 78, 120, 30); txt('RADIO ' + (SON.musicOn ? SON.fq : '--.-'), HW - 120, 83, 8, radioT > 0 && blink ? '#ffffff' : C); txt(nomRadio(), HW - 120, 95, 8, Y); } // la radio : au départ, en pause et au changement de station seulement
    if (state === 'race' || state === 'count') { // minicarte, sous la radio ; un point par voiture : dot(x, z, couleur)
      const mx = HW - 96, my = 12, dot = (x, z, c) => R(hg, c, mx + MM.px(x) - 1, my + MM.pz(z) - 1, 3, 3);
      panel(HW - 102, 6, 96, 68); hg.drawImage(MM.c, mx, my); // 96 de large : ne touche pas les bandeaux centraux même en 4:3 (HW = 360)
      if (ghostM.visible) dot(ghostM.position.x, ghostM.position.z, FANTC[ses.fant]);
      if (race) race.cars.forEach(c => c !== car && !partie(c) && dot(c.x, c.z, pil(c)[1])); // l'autre joueur a sa couleur, comme un rival
      R(hg, '#08080c', mx + MM.px(car.x) - 3, my + MM.pz(car.z) - 3, 7, 7); R(hg, blink ? pil(car)[1] : '#ffffff', mx + MM.px(car.x) - 2, my + MM.pz(car.z) - 2, 5, 5); // le joueur : plus gros, cerné de noir, clignotant
    }
    if (race && !fini && state === 'race') { const pris = [...(warn ? [[cx, 62, 170]] : []), ]; // les bandeaux du centre sont déjà pris ; repère au-dessus de chaque adversaire : à 270 lignes, une voiture lointaine ne fait que quelques pixels
      cam.updateMatrixWorld(); const lab = vu.lab || (vu.lab = new WeakMap()), now = performance.now(); // lab : cran de chaque étiquette dans cette vue, par voiture
      race.cars.forEach(c => {
        const dx = c.x - cam.position.x, dz = c.z - cam.position.z, f = dx * Math.cos(cth) + dz * Math.sin(cth);
        if (c === car || f < 3 || f > 400 || c.out) return; // sa propre voiture, derrière la caméra, trop loin, ou sortie de la course
        tmp.set(c.x, modele(c).position.y + 2.4, c.z).project(cam);
        const [name, col] = pil(c), x = Math.round((tmp.x + 1) / 2 * HW), y = Math.round((1 - tmp.y) / 2 * HH), w = name.length * 8 + 4;
        let ly = y - 14; while (pris.some(p => Math.abs(p[0] - x) < (p[2] + w) / 2 + 2 && Math.abs(p[1] - ly) < 12)) ly -= 12; // deux étiquettes au même endroit : la seconde monte d'un cran
        const L = lab.get(c) || { off: 0, t: 0 }, off = y - 14 - ly; if (off >= L.off) { L.off = off; L.t = now; } else if (now - L.t > 600) L.off = off; // elle monte tout de suite, mais ne redescend qu'après 0,6 s sans conflit : à la limite du chevauchement, elle sautait d'un cran à chaque image
        lab.set(c, L); ly = y - 14 - L.off; pris.push([x, ly, w]);
        R(hg, 'rgba(8,8,12,.75)', x - w / 2, ly, w, 11); txt(name, x, ly + 2, 8, col, 'center'); R(hg, col, x - 2, y - 2, 5, 3); R(hg, col, x - 1, y + 1, 3, 2);
      });
    }
    if (car.boost > 0) tag('NITRO', HW - 66, HH - 92, C); else if (car.asp > 0.15) tag('ASPIRATION', HW - 66, HH - 92, Y); // au-dessus du compteur : au centre, il chassait les étiquettes des rivaux vers le ciel
    if (state !== 'title') { // jauge de nitro, dans le panneau de vitesse : 10 segments ; elle monte en glisse, au ras d'un mur ou d'un camion, dans l'aspiration ; pleine, elle clignote ; elle se vide tant qu'on la déclenche
      const f = car.nitro, plein = f >= 1 && blink, n = Math.round(f * 10); txt('N', HW - 120, HH - 17, 8, f > 0 ? Y : '#6a6a78');
      // th.frole : frôler le mur remplit la jauge (sim.js, mur) ; la jauge s'éclaire tant que ça frotte, et 0,3 s après, le segment qui se remplit en blanc
      const fro = TH.frole && (vu.fro = car.rub && Math.hypot(car.vx, car.vz) > 15 ? 0.3 : Math.max(0, (vu.fro || 0) - dt)) > 0 && car.boost <= 0;
      for (let i = 0; i < 10; i++) R(hg, fro && i === Math.min(n, 9) ? '#ffffff' : i >= n ? '#30303c' : car.boost > 0 ? C : plein ? '#ffffff' : fro ? '#fff2a0' : Y, HW - 108 + i * 10, HH - 17 - (fro && i === Math.min(n, 9)), 8, 7 + 2 * (fro && i === Math.min(n, 9)));
    }
    if (vu.casseMsg && (vu.casseMsg.T -= dt) > 0) tag(vu.casseMsg.t, cx, 124, vu.casseMsg.c); // CASSE : takedown infligé ou subi
    if (splitMsg && (splitMsg.T -= dt) > 0) tag('S' + (splitMsg.i + 1) + ' ' + (splitMsg.d == null ? fmt(splitMsg.t) : (splitMsg.d <= 0 ? '-' : '+') + Math.abs(splitMsg.d).toFixed(2)), cx, 102, splitMsg.d == null ? Y : splitMsg.d <= 0 ? C : RD); // écart au record à chaque secteur
    if (warn) { // warn : distance signée au virage (> 0 droite, < 0 gauche, en m, alerteVirage) ou { glace: distance } ; arrondie au palier déjà franchi
      const d = warn.glace || Math.abs(warn), m = ' ' + (PALIERS.find(p => p <= d) || 10) + ' M ';
      if (blink || d < 30) tag(warn.glace ? '! GLACE' + m + '!' : warn > 0 ? '! VIRAGE DROITE' + m + '>>' : '<<' + m + 'VIRAGE GAUCHE !', cx, 62, warn.glace ? C : Y); // à moins de 30 m il ne clignote plus : c'est maintenant
    }
    if (race && race.elim && !fini && state === 'race') { // élimination : qui vient de sortir (3 s), et l'alerte tant que le joueur est dernier (le premier tour du meneur est protégé)
      const v = vivantes(), o = race.cars.find(c => c.out && race.t - c.out < 3);
      if (o) tag(pil(o)[0] + ' SORT' + (v.length === 2 ? ' · DUEL FINAL' : ''), cx, 118, C);
      if (race.tete && car.pos === v.length && blink) tag('DERNIER : DOUBLE AVANT LA LIGNE', cx, 102, RD);
    }
    if (COM && race && moi.out && !ses.raceEnd && state === 'race') { // à deux, joueur éliminé : l'annonce pendant 3 s, puis sa vue suit le meneur (voir frame) sous un simple rappel
      if (vu.spec) tag((race.casse ? "HORS D'USAGE" : 'ELIMINE') + ' · CAMERA SUR ' + pil(car)[0], cx, 28, RD);
      else { panel(cx - 124, 66, 248, 68); txt(race.casse ? "HORS D'USAGE" : 'ELIMINE', cx + 2, 76, race.casse ? 16 : 32, RD, 'center', 2); txt(moi.pos + 'E SUR ' + race.cars.length, cx, 118, 8, '#e8e8e4', 'center'); }
    }
    // écrans
    if (mode === 'tournee' && state === 'count') tag('MANCHE ' + (tnOu().manche + 1) + '/' + SOIREE.length + ' · ' + M.heure, cx, 88, C); // l'heure de la nuit à laquelle se court la manche
    if (state === 'count' && shown || goT > 0) { const s = goT > 0 ? 'GO' : String(shown); R(hg, HU.fond, cx - 20 - s.length * 30, 66, 40 + s.length * 60, 78); txt(s, cx + 4, 74, 64, Y, 'center', 3); } // sur un fond, en haut : ni le portique ni les voitures ne passent derrière
    if (result && state !== 'title' && !(race && fini) && (result.T -= dt) > 0) { // résultat du tour qu'on vient de boucler, sans arrêter la course
      tag('TOUR ' + result.n + '  ' + fmt(result.t), cx, 28, Y); if (result.pos) tag('PLACE ' + result.pos + '/' + result.of, cx, 44, C); else tag(result.first ? 'PREMIER TEMPS' : result.rec ? 'NOUVEAU RECORD' : '+' + result.diff.toFixed(2) + ' S', cx, 44, result.rec ? C : RD);
      const b = result.b, m = medal(result.t), L = [];
      if (!race) L.push(m < 3 ? [MEDN[m] + ' A -' + (result.t - REF * MED[m]).toFixed(2), MEDC[m]] : ['TOUR EN OR', MEDC[2]]); // ce qui manquait à ce tour pour la médaille suivante
      if (result.defi != null) L.push(result.defi < 0 ? ['DEFI BATTU ' + result.defi.toFixed(2), FANTC[5]] : ['DEFI A -' + result.defi.toFixed(2), RD]); // face au tour reçu par lien
      if (!race) L.push(['L : LIEN DEFI', '#e8e8e4']);
      if (b) L.push(['GLISSES ' + b[0], '#e8e8e4'], ['NITRO ' + b[1], C], ['MURS ' + b[2], b[2] ? RD : '#e8e8e4']);
      const ly = race && !gl ? 114 : 60; panel(6, ly, 132, 8 + L.length * 11); L.forEach(([s, c], i) => txt(s, 12, ly + 5 + i * 11, 8, c)); // en course, sous le panneau de place
    }
    const glFin = ses.glFin; if (glFin && state === 'race') { // mode Glisse, les deux tours bouclés : le score, s'il compte, le record et la médaille
      const m = medG(glFin.score);
      panel(cx - 150, 52, 300, 150); txt('GLISSE : ' + glFin.score, cx, 60, 16, Y, 'center', 1);
      [[glFin.valide ? glFin.rec ? 'NOUVEAU RECORD' : 'RECORD ' + ses.bestG + ' PTS' : 'HORS DELAI : SCORE NON COMPTE', glFin.valide && glFin.rec ? C : RD], ['TEMPS ' + fmt(ses.tRace) + '   DELAI ' + fmt(GLT), '#e8e8e4'],
        !glFin.valide ? ['', C] : m ? ['MEDAILLE ' + MEDN[m - 1], MEDC[m - 1]] : ['BRONZE A ' + GLM[0] + ' PTS', MEDC[0]], ['GLISSES ' + car.nDrift + '  NITRO ' + car.nBoost + '  MURS ' + car.nWall, '#e8e8e4']].forEach(([s, c], i) => txt(s, cx, 90 + i * 16, 8, c, 'center'));
      txt('ENTREE : REJOUER   ECHAP : MENU', cx, 182, 8, C, 'center');
    }
    if (COM && race && race.delai && vu.fini && !ses.raceEnd && state === 'race') { // Glisse en duel, ce joueur a fini : son score, en attendant l'autre
      panel(cx - 130, 60, 260, 62); txt('SCORE ' + Math.round(moi.pts), cx, 68, 16, Y, 'center', 1); txt(moi.fin ? 'TEMPS ' + fmt(moi.fin) : 'HORS DELAI : SCORE NUL', cx, 92, 8, moi.fin ? '#e8e8e4' : RD, 'center'); txt("L'AUTRE JOUEUR ROULE ENCORE", cx, 106, 8, C, 'center');
    }
    if (fini && race && state === 'race' && !ses.tnFin && (seul || !ses.raceEnd && !moi.out && !race.delai)) { // arrivée : classement, complété à mesure que les autres passent la ligne (à deux : dans la vue du premier arrivé seulement, le tableau commun prend la suite)
      panel(cx - 150, 52, 300, 166); txt((car.out ? (race.casse ? "HORS D'USAGE : " : 'ELIMINE : ') : 'ARRIVEE : ') + car.pos + (car.pos === 1 ? 'ER' : 'E'), cx, 60, 16, Y, 'center', 1); const t1 = raceOrder(race)[0].fin;
      raceOrder(race).forEach((c, i) => { const j = c !== car; txt((i + 1) + '. ' + (j ? pil(c)[0] : 'VOUS'), cx - 138, 86 + i * 15, 8, j ? pil(c)[1] : Y); txt(c.fin ? fmt(c.fin) : c.out ? 'SORT A ' + fmt(c.out) : 'EN PISTE', cx + (c.out ? 138 : 50), 86 + i * 15, 8, j ? '#e8e8e4' : Y, 'right'); if (race.casse) txt(cassePts(c) + ' PTS', cx + 138, 86 + i * 15, 8, j ? '#e8e8e4' : Y, 'right'); else if (i && c.fin) txt('+' + (c.fin - t1).toFixed(2), cx + 138, 86 + i * 15, 8, j ? '#e8e8e4' : Y, 'right'); });
      txt('MEILLEUR TOUR ' + fmt(moi.bl), cx, 152, 8, C, 'center'); txt(race.casse ? 'TAKEDOWNS ' + car.ca.td + '  POINTS ' + cassePts(car) : 'GLISSES ' + car.nDrift + '  NITRO ' + car.nBoost + '  MURS ' + car.nWall, cx, 166, 8, race.casse ? Y : '#e8e8e4', 'center'); txt('NIVEAU ' + DIFF[diff].nom, cx, 180, 8, '#e8e8e4', 'center');
      txt(!ses.raceEnd ? (VUES.length > 2 ? "D'AUTRES JOUEURS ROULENT ENCORE" : "L'AUTRE JOUEUR ROULE ENCORE") : mode === 'tournee' ? 'ENTREE : CLASSEMENT GENERAL' : 'ENTREE : REJOUER   ECHAP : MENU', cx, 200, 8, C, 'center'); // (à deux : Entrée et Échap n'agissent qu'une fois les deux joueurs arrivés)
    }
    if (ses.tnFin && state === 'race') { // Tournée, manche close : le classement général, ce que la manche a rapporté, et la suite (ou le trophée après la dernière)
      const f = ses.tnFin, nb = CARTES.length, ord = n => n + (n === 1 ? 'ER' : 'E');
      panel(cx - 150, 52, 300, 166); txt(f.fini ? 'TOURNEE TERMINEE' : 'CLASSEMENT GENERAL', cx, 60, 16, Y, 'center', 1); txt('APRES LA MANCHE ' + (f.manche + 1) + '/' + nb, cx, 82, 8, C, 'center');
      f.classement.forEach((j, i) => { const y = 98 + i * 15, c = j ? '#e8e8e4' : Y; txt((i + 1) + '. ' + (j ? OPP[j - 1][0] : 'VOUS'), cx - 138, y, 8, j ? OPP[j - 1][1] : Y); txt('+' + (f.pts[j] - f.avant[j]), cx + 50, y, 8, c, 'right'); txt(f.pts[j] + ' PTS', cx + 138, y, 8, c, 'right'); });
      if (f.fini) { txt(f.rang <= 3 ? 'TROPHEE ' + MEDN[3 - f.rang] : 'PAS DE TROPHEE', cx, 164, 8, f.rang <= 3 ? MEDC[3 - f.rang] : RD, 'center'); txt('NIVEAU ' + DIFF[diff].nom, cx, 180, 8, '#e8e8e4', 'center'); txt('ENTREE : MENU', cx, 200, 8, C, 'center'); }
      else { txt('SUITE : ' + SOIREE[f.manche + 1].heure + ' · ' + SOIREE[f.manche + 1].nom, cx, 164, 8, '#e8e8e4', 'center'); txt('DEPART ' + ord(f.grille[0] + 1) + ' SUR LA GRILLE', cx, 180, 8, '#e8e8e4', 'center'); txt('ENTREE : SUITE   ECHAP : QUITTER', cx, 200, 8, C, 'center'); }
    }
    if (pique && state !== 'title' && (pique.T -= dt) > 0) { // la réplique d'un rival, façon radio : une ligne sans fond, contour noir, nom à sa couleur ; s'efface sur la dernière demi-seconde
      hg.globalAlpha = Math.min(1, pique.T * 2); fonte('8px ' + PS); const n = tr(pique.n) + ' ', wn = hg.measureText(n).width, x = Math.round(cx - (wn + hg.measureText(tr(pique.s)).width) / 2);
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1]]) { txt(n, x + dx, 166 + dy, 8, '#000'); txt(pique.s, x + wn + dx, 166 + dy, 8, '#000'); } // contour noir : lisible sans fond
      txt(n, x, 166, 8, pique.c); txt(pique.s, x + wn, 166, 8, '#fff'); hg.globalAlpha = 1; }
    if ((piqueT -= dt) < 0) piqueT = 0;
    if (demo) { // mode démo : l'heure et la carte, et l'invitation à reprendre la main
      R(hg, 'rgba(8,8,12,.7)', 0, 132, HW, 34); txt('DEMO · ' + M.heure + ' · ' + M.nom, cx, 137, 8, C, 'center'); if ((performance.now() / 500 | 0) % 2) txt('APPUIE SUR UNE TOUCHE', cx, 151, 8, Y, 'center');
    }
    if (seul && state === 'pause') ecrans(HW);
    hudT.needsUpdate = true;
  }

  // la lune suit la voiture par pas de CEL (64 texels de l'ombre, 24 m) : entre deux pas, la carte d'ombre du décor fixe ne change pas (voir ombres)
  const LR = new V3().crossVectors(new V3(0, 1, 0), SD).normalize(), LU = new V3().crossVectors(SD, LR), TX = 2 * OCH / OTX, CEL = TX * 64, tmp = new V3();
  function sunFollow(car) {
    tmp.set(car.x, 0, car.z);
    const a = Math.round(tmp.dot(LR) / CEL), b = Math.round(tmp.dot(LU) / CEL), c = Math.round(tmp.dot(SD) / CEL);
    sun.target.position.set(0, 0, 0).addScaledVector(LR, a * CEL).addScaledVector(LU, b * CEL).addScaledVector(SD, c * CEL);
    sun.position.copy(sun.target.position).addScaledVector(SD, 400); return a + ':' + b + ':' + c;
  }
  // Ombres en deux temps. Le décor fixe (calque 0) n'est dessiné dans la carte d'ombre que quand la lune change de pas, puis gardé dans la cible de la vue (vu.ombre) ;
  // chaque image, la carte reprend cette copie (profondeur comprise : OMB écrit gl_FragDepth) et seuls les objets mobiles qui portent une ombre (calque OMBD : voitures, débris, décor dyn) y sont redessinés.
  // Avant : tout le décor à chaque image, 35 à 100 passes de dessin. Un objet qui bouge et porte une ombre doit être sur le calque OMBD (fait à la construction pour tout ce qui n'est pas fixe, voir « fusion »)
  // three r18x garde l'ombre dans la texture de profondeur de la carte (plus en couleur) : OMBS la range en couleur dans la copie (profondeur codée sur RGBA), OMB la remet dans la profondeur
  const OMB = new THREE.ShaderMaterial({ uniforms: { t: { value: null } }, vertexShader: post.vertexShader, depthFunc: THREE.AlwaysDepth,
      fragmentShader: '#include <packing>\nuniform sampler2D t; varying vec2 v; void main(){ gl_FragColor = vec4(0.); gl_FragDepth = unpackRGBAToDepth(texture2D(t, v)); }' }),
    OMBS = new THREE.ShaderMaterial({ uniforms: { t: { value: null } }, vertexShader: post.vertexShader, depthTest: false, depthWrite: false,
      fragmentShader: '#include <packing>\nuniform sampler2D t; varying vec2 v; void main(){ gl_FragColor = packDepthToRGBA(texture2D(t, v).x); }' }),
    ombScene = new THREE.Scene(), ombProf = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, side: THREE.BackSide }), ombProfI = ombProf.clone(), // une par calque : la même pour les deux faisait refaire à three la clé du programme à chaque passage de l'un à l'autre
    ombNul = new THREE.WebGLRenderTarget(1, 1), ombFixe = new THREE.OrthographicCamera(-1e-6, 1e-6, 1e-6, -1e-6, 0, 1e-6); // ombFixe : ne voit rien (loin sous la carte, champ nul) et seulement le calque 0 : le rendu qui la prend ne fait que l'ombre du décor fixe (shadowMap.render ne s'appelle pas hors d'un rendu)
  ombFixe.position.set(0, -1e7, 0); ombFixe.updateMatrixWorld();
  const ombQ = new THREE.Mesh(quad.geometry, OMB); ombQ.frustumCulled = false; ombScene.add(ombQ);
  sun.shadow.camera.layers.set(OMBD); renderer.shadowMap.autoUpdate = false;
  const copie = (src, dst, m) => { ombQ.material = m; m.uniforms.t.value = src; renderer.setRenderTarget(dst); renderer.autoClear = false; renderer.render(ombScene, postCam); renderer.autoClear = true; };
  // Les ombres mobiles ne sont dessinées (et la copie reprise) que dans un carré de OMBR mètres autour de la voiture suivie : toute la carte à chaque image coûtait 1 à 2 ms de GPU.
  // Plus loin, un objet mobile ne porte pas d'ombre ; le décor fixe garde les siennes partout. Le carré de l'image d'avant est repris aussi : il n'y reste aucune ombre périmée
  const OMBR = 120;
  function ombres(vu, cle, car, y) {
    const S = sun.shadow, W = S.mapSize.x; sun.updateMatrixWorld(); sun.target.updateMatrixWorld();
    if (!vu.ombre) vu.ombre = { C: new THREE.WebGLRenderTarget(W, S.mapSize.y, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false }), cle: null, b: null };
    const O = vu.ombre, fixe = O.cle !== cle || !S.map;
    if (fixe) { renderer.shadowMap.needsUpdate = true; S.camera.layers.set(0); /* r18x prend les calques de la caméra d'ombre (s'ils dépassent le calque 0) au lieu de ceux du rendu : on la remet sur le décor fixe */ renderer.setRenderTarget(ombNul); renderer.render(scene, ombFixe); copie(S.map.depthTexture, O.C, OMBS); O.cle = cle; O.b = null; } // décor fixe seul, puis gardé
    else S.updateMatrices(sun); // (la vue d'avant a pu laisser sa carte et ses matrices)
    tmp.set(car.x, y, car.z).applyMatrix4(S.matrix); const r = OMBR / TX, b = [tmp.x * W - r, tmp.y * W - r, tmp.x * W + r, tmp.y * W + r].map(v => clamp(Math.round(v), 0, W)), p = O.b || b;
    const bx = Math.min(b[0], p[0]), by = Math.min(b[1], p[1]); S.map.scissorTest = true;
    if (!fixe) { S.map.scissor.set(bx, by, Math.max(b[2], p[2]) - bx, Math.max(b[3], p[3]) - by); copie(O.C.texture, S.map, OMB); } // la copie : ce carré et celui de l'image d'avant
    S.map.scissor.set(b[0], b[1], b[2] - b[0], b[3] - b[1]); O.b = b;
    renderer.autoClear = false; renderer.setRenderTarget(S.map);
    for (const [c, m] of [[OMBD, ombProf], [OMBI, ombProfI]]) { S.camera.layers.set(c); scene.overrideMaterial = m; renderer.render(scene, S.camera); }
    renderer.autoClear = true; scene.overrideMaterial = null; S.map.scissorTest = false;
  }

  const ROUGE = new THREE.Color(0xff1828), ETIN = new THREE.Color(0xff8a20), BLEU = new THREE.Color(0x3a9cff), PHARE = new THREE.Color(0xfff2d0), NEONC = new THREE.Color(L.neon || 0), BOITE = new THREE.Matrix4().makeScale(ENCt.x / 2, ENCt.y / 2, ENCt.z / 2).setPosition(ENCc); // BOITE : englobe toute la caisse, pour l'ombre (un point dedans ou dessus n'est pas ombré)
  const TRB = ST && ST.tremble * ST.aa || TREMBLE;
  // altitude continue le long de la piste : lue échantillon par échantillon, elle faisait sauter la voiture et la caméra à chaque pas, d'autant plus visible qu'on roule lentement
  // (le calcul est dans sim.js : sol(), qui ajoute la hauteur de la paroi sur un mur roulable ; car.y est ce sol, ou la hauteur de vol)
  const yAt = (c, k = 0) => sol(T, c, k);
  // assiette [tangage, roulis] : au sol la voiture épouse la pente de la piste et celle de la paroi ; en l'air son nez suit sa trajectoire
  const assiette = c => { const s = S[c.idx], ax = Math.cos(c.th), az = Math.sin(c.th), gn = pente(s, c.d);
    return [c.air ? 0.7 * Math.atan2(c.vy, Math.max(5, Math.hypot(c.vx, c.vz))) : Math.atan(s.sl + gn * (s.tx * az - s.tz * ax)), -Math.atan(gn * (s.tx * ax + s.tz * az))]; };
  nouvelleVue(); // la vue du joueur : le décor est construit, tous ses luminaires sont déclarés
  // tous les shaders de la scène lancés d'un coup (le pilote les compile en parallèle) : le décor écarté hors champ au départ ne compile plus son shader en pleine course
  // à sa première apparition ; compile et non compileAsync : sans fond, tout doit finir d'un trait (voir plus haut)
  renderer.compile(scene, VUES[0].cam);
  // le verre des éclats (MeshStandardMaterial + envMap) fait son PMREM et son shader à la première casse : un éclat de chaque verre rendu une fois dans une cible 8 px, en plein chargement
  { const rt = new THREE.WebGLRenderTarget(8, 8), ts = VERRE.map(mv => { const t = new THREE.InstancedMesh(ECLAT, mv, 1); t.frustumCulled = false; scene.add(t); return t; }), r0 = renderer.getRenderTarget(); renderer.setRenderTarget(rt); renderer.render(scene, VUES[0].cam); renderer.setRenderTarget(r0); ts.forEach(t => { scene.remove(t); t.dispose(); }); rt.dispose(); }
  // Un ou deux joueurs : autant de vues. À deux, chacun a son périphérique et la couche plein écran commune est posée sur le canvas du jeu. Se règle au menu : appelé en course, on y revient.
  // Le périphérique de chacun vient de l'écran d'inscription (PLACES) ; le mode et la difficulté sont relus dans les préférences de ce nombre de joueurs. Les styles de comparaison (?style=) restent à une vue.
  const joueurs = n => {
    n = ST ? 1 : clamp(n | 0, 1, 4); if (state !== 'title') toMenu(); ins = false;
    while (VUES.length > n) retireVue(); while (VUES.length < n) nouvelleVue();
    if (n > 1) { while (PLACES.length < n) PLACES.push(''); PLACES.length = n; } // une place par joueur ; celles des joueurs en trop sont rendues
    VUES.forEach((vu, i) => { vu.periph = n > 1 ? PLACES[i] : ''; });
    const Lm = n > 1 ? MODES2 : MODES; mode = DEFI && n < 2 ? 'solo' : Lm.find(m => pref(cle('mode'), '') === JSON.stringify(m)) || Lm[0]; diff = clamp(+pref(cle('diff'), 1) | 0, 0, DIFF.length - 1);
    if (n > 1 && !COM) { const c = document.createElement('canvas'); renderer.domElement.after(c); COM = { c, g: c.getContext('2d') }; if (!actif) c.style.display = 'none'; } // (la feuille de style de la page étire tout canvas sur l'écran, en pixels nets)
    else if (n < 2 && COM) { COM.c.remove(); COM = null; }
    resize();
  };
  { const n = +(Q.get('joueurs') || pref('vpr7.joueurs', '1')); if (n > 1 && !DEFI && !NET.role) joueurs(n); } // la préférence du menu ; ?joueurs=1 ou 2 dans l'adresse passe devant, sans y toucher (captures en ?auto). Un lien de défi s'ouvre en solo
  // La couche commune, dessinée une fois par image par-dessus les deux vues : ce qui s'adresse aux deux joueurs à la fois (accueil, menu, inscription, pause, tableau d'arrivée ou fin du duel de Glisse). Cachée quand elle n'a rien à montrer.
  function couche() {
    const plein = state === 'title' || state === 'pause' || ses.raceEnd && state === 'race'; COM.c.hidden = !plein; if (!plein) return;
    hg = COM.g; hg.clearRect(0, 0, COM.c.width, HH); ecrans(COM.c.width);
  }
  function frame(now) {
    const dt = state === 'pause' ? 0 : clamp((now - last) / 1000 || 0, 0, 0.1); last = Math.max(last, now); // en pause le temps s'arrête, l'image reste
    if (state === 'count') {
      count -= dt; const k = Math.ceil(count); // une seconde par chiffre
      if (count <= 0) { state = 'race'; goT = 0.8; SON.beep(880); SON.crash(); }
      else if (k !== shown) { shown = k; SON.beep(440); }
    }
    if (goT > 0) goT -= dt;
    if (demo) { if (!cible && (demo.t += dt) > DEMO_DUREE) demoSuite(); } else if (demoPossible() && (inactif += dt) > DEMO_ATTENTE) demoLance(); else if (state !== 'title') inactif = 0;
    FEUX.forEach((m, i) => m.color.setHex(goT > 0 ? 0x30ff60 : state === 'count' && shown && shown <= 3 - i ? 0xff2030 : 0x3a0810)); // décompte 3, 2, 1 : un feu de plus à chaque chiffre ; vert au GO
    for (const c of PER.poll({ menu: accueil || state === 'title' || state === 'pause' || ses.raceEnd, accueil, deux: deux() })) commande(c); if (ins) inscription(); else if (deux()) manettes2();
    for (const vu of VUES) { // l'entrée de chaque joueur, lue sur son périphérique ; le pilote automatique conduit en ?auto et une fois le joueur arrivé (son entrée ne sert alors qu'aux feux stop et au son)
      const k = PER.entree(vu.periph); if (demo && (k.gas || k.brake || k.hand || k.nitro || k.steer)) { if (!cible) demoFin(); } // en démo : toucher au volant ou aux pédales rend la main
      vu.inp = state === 'race' ? (AUTO || demo || ses.raceEnd || vu.fini ? autopilot(vu.car, T, 1, M.trafic && !race ? trafic(T, tTraf) : []) : k) : { steer: 0, gas: 0, brake: 0, hand: false };
      vu.gas = state === 'count' ? k.gas : vu.inp.gas; vu.hit = vu.bump = vu.land = 0;
    }
    const J = VUES[0], inp = J.inp, car = J.moi; // le joueur 1 : sa hauteur et sa lumière lissées servent aux effets de la scène ; sa voiture est celle du jeu hors course
    moMaj(); // (l'état de l'image d'avant : une image de retard, invisible)
    for (acc += dt; acc >= H; acc -= H) {
      const dgL = race && state === 'race' ? race.cars : [car]; dgL.forEach((c, i) => { DGV[i * 2] = c.vx; DGV[i * 2 + 1] = c.vz; }); // dégâts : la vitesse avant le pas, pour savoir d'où vient un choc
      // en course, sim.js fait avancer tout le monde, avec une entrée par humain ; entrée nulle : l'IA conduit la voiture de ce joueur (?auto, ou une fois arrivé)
      if (race && state === 'race') { if (invite()) { NET.applique(race); seche(race, H); } else { for (let i = 0; i < race.h; i++) INS[i] = enLigne() && i ? NET.ins[i] : AUTO || demo || VUES[i].fini ? null : VUES[i].inp; stepRace(race, INS, H); } } else { step(car, inp, T, H); if (M.trafic && state === 'race') hitTrafic(car, T, tTraf); }
      dgT += H; if (state === 'race') dgL.forEach((c, i) => dgPas(c, DGV[i * 2], DGV[i * 2 + 1]));
      for (const vu of VUES) { const c = vu.car; vu.land = Math.max(vu.land, c.land); vu.bump = Math.max(vu.bump, c.bump || 0); vu.hit = Math.max(vu.hit, c.hit, vu.bump); } // chocs de l'image, par vue (sa secousse) ; shortcut: un choc entre voitures réutilise les effets du choc mur (étincelles côté mur), à séparer si ça se voit
      if (state === 'race' && !ses.raceEnd) { // fin de course, tour bouclé, Glisse finie : la session décide, on montre et on fait entendre
        tTraf += H; const ev = ses.pas(car, H);
        for (const i of ev.arrives) if (VUES[i]) { VUES[i].fini = true; SON.arrivee(race.cars[i].pos); } // en ligne, les autres humains n'ont pas de vue ici
        if (ev.fin && race) tFin = performance.now();
        if (ev.tour) { VUES[0].result = { ...ev.tour, T: 5, b: bilan(VUES[0]) }; if (ev.fantome) padDit('FANTÔME : ' + nomF()); SON.stinger(ev.tour.rec); } // le temps du tour, affiché 4 s
        if (ev.glisse) SON.stinger(ses.glFin.rec);
      }
    }
    if (race && state === 'race' && enLigne()) { if (invite()) NET.entree(VUES[0].inp); else NET.diffuse(race); }
    if (COM && race && race.elim && state === 'race') for (const vu of VUES) { const moi = vu.moi; // à deux, joueur éliminé depuis 3 s : sa vue passe sur le meneur, et le suit s'il change
      if (moi.out && race.t - moi.out > 3) { const m = race.cars.find(c => c.pos === 1); if (vu.car !== m) { vu.car = m; vu.cth = m.th; vu.carY = m.y; vu.spec = true; } } }
    const beat = SON.beat, pulse = SON.pulse; // battement calé sur le kick
    // état lissé de chaque vue, avant de toucher à la scène : secousse, régime affiché, hauteur et assiette de la voiture suivie, cap de la caméra, fondus de nitro et de tunnel
    for (const vu of VUES) { const c = vu.car, [tg, rl] = assiette(c);
      if (vu.hit > 8) vu.stun = 0.7; if (vu.land > 7) vu.stun = Math.max(vu.stun, Math.min(0.45, (vu.land - 6) * 0.08)); vu.stun -= dt; // une réception dure secoue aussi
      vu.up = drivetrain(vu, dt, vu.gas);
      { const s = S[c.idx]; if (!c.air) vu.carY += s.sl * (c.vx * s.tx + c.vz * s.tz) * dt; } vu.carY += (c.y - vu.carY) * Math.min(1, dt * 18); // la pente d'abord, puis le lissage : sans elle la voiture lissée traînait sous la route en montée (30 cm à 13 %) et flottait en descente
      vu.pitch += (tg - vu.pitch) * Math.min(1, dt * 10); vu.roll += (rl - vu.roll) * Math.min(1, dt * 10); // tangage et roulis (pente, paroi, vol) : sur leur ligne, un commentaire les avait avalés
      if (state === 'title') vu.cth += dt * 0.22; else vu.cth += wrap(c.th - vu.cth) * Math.min(1, dt * 6); // au menu, la caméra tourne autour de la voiture pour montrer la carte
      if ((vu.lookT -= dt) < 0) { const k = Math.exp(-dt * 5); vu.lookA *= k; vu.lookP *= k; } // souris immobile depuis 2,5 s : la caméra revient derrière la voiture
      vu.nit = clamp(vu.nit + (c.boost > 0 ? dt / 0.7 : -dt / 1.1), 0, 1); // nitro : 0,7 s pour entrer, 1,1 s pour sortir
      vu.lm += (zone(c.idx, 10) - vu.lm) * Math.min(1, dt * 8); // lumière : nuit néon ↔ échangeur en alarme rouge qui bat avec la musique
    }
    const { carY, lm } = J;

    // la scène, une fois pour toutes les vues : les voitures (elles suivent le relief), les effets, le fantôme, le son
    opps.forEach((g, i) => {
      const c = race && race.cars.find(c => c.k === i); g.visible = !!c && !partie(c) && !(c.out && race.t - c.out > 3 && now / 120 & 1); if (!c) return; // une voiture sortie se range, clignote, puis disparaît
      const [t, ro] = assiette(c); g.userData.y += (c.y - g.userData.y) * Math.min(1, dt * 18);
      g.rotation.order = 'YZX'; g.position.set(c.x, g.userData.y, c.z); g.rotation.set(ro, -c.th, t);
      if (i < 3) { const u = g.userData, v = c.vf || 0; u.dec = (u.dec || 0) + ((u.vf === undefined ? 0 : (u.vf - v) / Math.max(dt, 1e-3)) - (u.dec || 0)) * Math.min(1, dt * 6); u.vf = v; freins(g, u.dec > 5 ? 1 : 0, v, dt); } // les rivaux n'exposent pas leur commande : on lit le frein dans la décélération (le frein moteur et l'air font moins de 5 m/s²)
      if (i < 3) for (let r = 1; r < 5; r++) { const st = g.children[r]; st.children[0].rotation.z -= (c.vf || 0) * dt / rr; if (r > 2) st.rotation.y = -(c.steer || 0) * 0.45; } // les rivaux ; les modèles des joueurs 2 à 4 tournent leurs roues dans fxVoiture
    });
    for (const vu of VUES) { const on = !vu.spec && (!vu.n || vu.car !== car); vu.hu.tr.visible = on; if (!vu.n) carG.visible = !vu.spec; if (on) fxVoiture(vu, dt); } // (une vue passée sur le meneur ne pose plus la voiture de son joueur : celle du joueur 2 reste un adversaire rangé, celle du joueur 1 est cachée) // chaque voiture humaine, avec l'état lissé de sa vue (le modèle du joueur 2 vient d'être posé comme un adversaire : on le repose). Deux vues sur la même voiture, au menu : une seule fois
    if (TH.alarme) { carMat.emissive.setRGB(0.3 * lm, 0.01 * lm, 0.03 * lm); for (const m of tunMats) m.color.setScalar((m.userData.amb || 1) * (0.75 + 0.5 * pulse)); }
    if (state === 'race' && race) for (let i = 0; i < race.cars.length; i++) { // course : le tour bouclé par chaque voiture, et son meilleur (tableau d'arrivée) ; pour un joueur, même bandeau « tour + temps » qu'en contre-la-montre, avec la place (le dernier tour est couvert par le classement d'arrivée)
      const c = race.cars[i], vu = VUES.find(v => v.moi === c), ln = Math.floor(c.dist / N); if (c.out || ln <= c.rl || ln > race.laps) continue;
      const lt = (c.fin || race.t) - c.rlT; c.bl = c.bl ? Math.min(c.bl, lt) : lt; c.rl = ln; c.rlT = race.t;
      if (vu && ln < race.laps) vu.result = { n: ln, t: lt, pos: c.pos, of: vivantes().length, T: 5, b: bilan(vu) };
    }
    if (state === 'race' && race && VUES.length === 1 && !demo && !enLigne() && !car.fin && !car.out) for (const c of race.cars) { // répliques des rivaux : un dépassement dans un sens ou dans l'autre
      const d = c.dist - car.dist; if (c === car || c.fin || c.out || Math.abs(d) < 3) continue; const dev = d > 0; if (c.dev !== undefined && dev !== c.dev) pic(c, dev ? 'passe' : 'double'); c.dev = dev; }
    if (state === 'race' && mode === 'solo') {
      const sp = ses.enregistre(car, carY); if (sp) J.splitMsg = { ...sp, T: 2.5 };
    }
    const gi = ses.tRace * 20, g0 = Math.floor(gi) * 4, gf = gi % 1, ghost = state === 'race' && mode === 'solo' && ses.traceF();
    ghostM.visible = !!ghost && g0 + 7 < ghost.length;
    if (ghostM.visible) { ghostM.material.color.set(FANTC[ses.fant]); ghostM.position.set(lerp(ghost[g0], ghost[g0 + 4], gf), lerp(ghost[g0 + 1], ghost[g0 + 5], gf) + ENCc.y, lerp(ghost[g0 + 2], ghost[g0 + 6], gf)); ghostM.rotation.y = -(ghost[g0 + 3] + wrap(ghost[g0 + 7] - ghost[g0 + 3]) * gf); }
    fxFrame(dt, now);
    // son : moteur, boîte et pneus par joueur (SE.cars, une entrée par vue ; muette si la vue regarde une autre voiture que celle de son joueur, ou la voiture que la première vue fait déjà entendre : après une élimination, au menu à deux) ; la radio, le tunnel, la pluie et l'ambiance suivent l'humain le mieux placé encore en course (seul, hors course ou tous arrivés : le joueur 1). Les objets restent accrochés aux vues : rien n'est alloué par image
    const SE = J.son || (J.son = { cars: [] }); let Jm = J; if (race) for (const vu of VUES) if (!vu.fini && (Jm.fini || vu.car.pos < Jm.car.pos)) Jm = vu;
    SE.cars.length = 0; for (const vu of VUES) { const c = vu.car, o = vu.sj || (vu.sj = {}); o.muet = vu.spec || (vu !== J && !J.spec && J.car === c); o.car = c; o.sp = Math.hypot(c.vx, c.vz); o.r = Math.min(1, o.sp / TOP); o.gas = vu.gas; o.hit = vu.hit; o.bump = vu.bump; o.land = vu.land; o.up = vu.up > 0; o.down = vu.up < 0; o.rpm = vu.rpm; o.load = vu.load; o.spool = vu.spool; o.dg = dgNiv(c); SE.cars.push(o); }
    const cm = Jm.car, jm = Jm.sj; SE.state = state; SE.car = cm; SE.T = T; SE.tour = race ? Math.min(race.laps - 1, Math.max(0, Math.floor(cm.dist / N))) : 0; SE.tours = race ? race.laps : 0; SE.hot = hot(cm.idx, 50); SE.tun = Jm.lm; SE.amb = ambAt(cm.idx); SE.objet = objSon; objSon = 0; SE.r = jm.r; SE.sp = jm.sp; SE.hit = jm.hit; SE.bump = jm.bump; SE.fini = ses.raceEnd; // fini : la radio s'efface derrière le tableau d'arrivée
    { const s = S[cm.idx], L = s.w - 1.1; SE.mur = Math.sign(cm.d) * clamp(1 - (L - Math.abs(cm.d)) / 5, 0, 1); } // le bord qu'on serre (+ à droite) : son écho répond plus fort
    { const fx = Math.cos(cm.th), fz = Math.sin(cm.th), veh = race ? race.cars.filter(c => c !== cm && !partie(c)) : M.trafic && state !== 'title' ? trafic(T, tTraf) : []; // les deux autres véhicules les plus proches, qu'on entend
      SE.autres = veh.map(c => [c, Math.hypot(c.x - cm.x, c.z - cm.z)]).filter(a => a[1] < 150).sort((a, b) => a[1] - b[1]).slice(0, 2).map(([c, d]) => {
        const dx = c.x - cm.x, dz = c.z - cm.z, rx = c.vx - cm.vx, rz = c.vz - cm.vz, cam = c.lane !== undefined;
        // hors de vue directe (occ 0..1) : la ligne droite jusqu'à lui quitte la route (façades, parois, montagne du virage) ; on mesure de combien elle s'écarte de l'axe, au-delà de la demi-largeur
        let i = cm.idx, di = (c.idx - i + N) % N, occ = 0; if (di > N / 2) { i = c.idx; di = N - di; }
        for (let q = 0; q <= di && occ < 1; q += 3) { const s = S[(i + q) % N]; occ = Math.max(occ, clamp((Math.abs((s.x - cm.x) * dz - (s.z - cm.z) * dx) / Math.max(d, 1) - s.w) / 10, 0, 1)); }
        return { lat: dz * fx - dx * fz, fwd: dx * fx + dz * fz, dist: d, vr: -(rx * dx + rz * dz) / Math.max(d, 1), vrel: Math.hypot(rx, rz), rpm: cam ? 1500 : c.rpm, camion: cam, occ }; }); }
    SON.frame(dt, SE);
    if (state !== 'title') radioT -= dt; // l'annonce de la station clignote 2,5 s (une radio pour toutes les vues)
    for (const vu of VUES) vueFrame(vu, dt, now);
    if (COM) { // à deux : un trait net de 2 pixels à cheval sur les deux vues, puis la couche commune
      renderer.setScissor(0, (HH - 1) * KL, VUES[0].w * KL, 2 * KL); renderer.setClearColor(C); renderer.clear(true, false, false); renderer.setClearColor(0);
      couche();
    }
  }
  // Une vue : la caméra derrière sa voiture (plus basse, plus proche et plus grand-angle avec la vitesse), puis tout ce qui dans la scène dépend de qui regarde
  // (ciel, lune et son ombre, brouillard, lumière dynamique, feux lointains, pluie), son HUD, la scène dans sa cible et la passe finale.
  const ASTRE = new THREE.Color(TH.astre.col), RAYS = 0.25; // RAYS : force des rayons de lumière (passe finale)
  const [V0, V1] = (M.vit || [130, 200]).map(v => v / 3.6 / (M.kmh || 1)); // plage des effets de vitesse de la carte, en m/s vrais
  function vueFrame(vu, dt, now) {
    const { cam, car, carY, pitch, roll, lm, cth, stun, lookA, lookP, pluieO, splP, splA, splD, inp } = vu, pulse = SON.pulse, G = modele(car);
    if (decorTick && decorTick.vue) decorTick.vue(car); // le décor qui dépend de la voiture suivie (wangan : le caboteur avance d'un tour à l'autre), réglé pour chaque vue avant son rendu
    const sp = Math.hypot(car.vx, car.vz), r = Math.min(1, sp / TOP), fx = Math.cos(car.th), fz = Math.sin(car.th), air = car.y - yAt(car); // air : hauteur au-dessus du sol
    const rc = vu.rc += (Math.min(1, sp / V1) - vu.rc) * Math.min(1, dt * 3); // cadrage de la caméra (recul, hauteur, champ) : proportionnel à la vitesse dès l'arrêt, lissé sur ~0,3 s, sans seuil
    const cx = Math.cos(cth + lookA), cz = Math.sin(cth + lookA), back = 6.4 - 1 * rc; // caméra basse et proche : le sol défile en proportion inverse de sa hauteur, c'est ce qui donne la sensation de vitesse
    let px = car.x - cx * back, pz = car.z - cz * back;
    const s = S[(car.idx - 4 + N) % N], nx = -s.tz, nz = s.tx, d = (px - s.x) * nx + (pz - s.z) * nz, o = Math.abs(d) - (s.w - 0.8);
    if (o > 0 && !dansPlace(T, px, pz)) { px -= nx * Math.sign(d) * o; pz -= nz * Math.sign(d) * o; } // la caméra reste entre les murs (sur une place où l'on roule partout, elle suit)
    const rv0 = clamp((sp - V0) / (V1 - V0), 0, 1); // effets de vitesse (tremblement, champ, vignette, flou, aberration) : de M.vit[0] à M.vit[1] km/h affichés
    const rv = vu.rv += (rv0 - vu.rv) * Math.min(1, dt * 5); // lissé sur ~0,2 s : un choc ou un coup de frein ne fait plus sauter champ, vignette et flou d'une image à l'autre
    const vib = () => Math.random() * 2 - 1; // vibration tirée à chaque image : des sinus plus rapides que 30 Hz se replient à l'écran en roulis lent, et une secousse de position est gommée par le lookAt
    const rs = clamp((rv - 0.4) / 0.6, 0, 1), shake = 0.03 * rs + 0.045 * rs * rs * rs, choc = stun > 0 ? stun * 0.35 : 0; // vitesse : rien sur les 40 % bas de la plage des effets (130 km/h → pointe), plein à la pointe ; choc : bref, nerveux
    // la caméra suit le sol sous elle, sans tomber dans une fosse que la voiture survole (±2,5 m autour du sol de la voiture), monte avec la voiture en vol et penche avec elle sur une paroi
    const y0 = yAt(car), ySol = k => clamp(yAt(car, k), y0 - 2.5, y0 + 2.5) + air;
    const pc = s.y + paroi(s, (px - s.x) * nx + (pz - s.z) * nz) + 1.5; // au-dessus de la paroi là où est la caméra (voiture haut sur le mur, caméra écartée vers son sommet : elle passait dessous)
    // hauteurs lissées : collée à la voiture, la caméra partait d'un coup au décollage et tombait sec à la réception ; plus mou en vol (~0,4 s) qu'au sol (~0,1 s, la pente reste suivie). Écart > 20 m (départ, replacement) : on recale net
    const ky = Math.min(1, dt * (car.air ? 2.5 : 10)), lis = (k, t) => (vu[k] = Math.abs(t - vu[k]) < 20 ? vu[k] + (t - vu[k]) * ky : t);
    const yc = Math.max(lis('cy', ySol(-3)), yAt(car, -3) + 0.8 - (M.camH || 3.2)), yl = lis('ly', ySol(5)); // jamais sous la route à l'endroit de la caméra
    cam.position.set(px + vib() * shake + (Math.random() - 0.5) * choc, Math.max(pc, yc + (M.camH || 3.2) + lookP - 0.5 * rc) + vib() * shake * 0.7 + (Math.random() - 0.5) * choc, pz);
    cam.lookAt(car.x + cx * 10, yl + 1.1, car.z + cz * 10); cam.rotateZ(-0.6 * roll);
    cam.rotateX(vib() * shake * 0.12); cam.rotateY(vib() * shake * 0.08); // l'image elle-même tressaute (≈ 0,4° à la pointe), sec et petit
    const nitE = vu.nit * vu.nit * (3 - 2 * vu.nit); // nitro : départ et arrivée en douceur (champ élargi et vignette)
    cam.fov = 62 + 20 * rc + 10 * rv * rv + 3 * car.slide + 6 * nitE; // + grand-angle en fin de course : l'effet tunnel
    const photo = window.__g.vue; // shortcut: debug console seulement, __g.vue = [angle° autour de la voiture, distance, hauteur] pour inspecter le modèle ; à remplacer par un vrai mode photo si on en veut un
    if (photo) { const a = car.th + photo[0] * Math.PI / 180; cam.position.set(car.x + Math.cos(a) * photo[1], carY + photo[2], car.z + Math.sin(a) * photo[1]); cam.lookAt(car.x, carY + 0.7, car.z); cam.fov = 45; }
    cam.updateProjectionMatrix();
    const pasL = sunFollow(car);
    // brouillard et ciel : nuit néon ↔ tunnel ; éclairs : flash double sur le ciel et l'éclairage (le tonnerre part de fxFrame)
    scene.fog.color.copy(FOG_OUT).lerp(FOG_IN, lm); scene.fog.near = lerp(TH.fogD[0] * LOIN, 15, lm); scene.fog.far = lerp(TH.fogD[1] * LOIN * (BRUME ? BRUME[car.idx] : 1), 320, lm);
    let kBr = 0; for (const [z, n0, n1] of brumeZ) { const k = z(car.idx, 90); if (k > 0) { scene.fog.near = lerp(scene.fog.near, n0, k); scene.fog.far = lerp(scene.fog.far, n1, k); kBr = Math.max(kBr, k); } }
    { const far = Math.min(3000, Math.max(scene.fog.far * 1.5, TH.loin || 0)), kf = far * 0.95 / 2500; // la caméra ne dessine plus au-delà du brouillard ; ciel (2 500 m) et astre (2 000 m) sont ramenés dans la portée ; th.loin : portée minimale des cartes dont les lointains hors brouillard (fog: false : sommets du barrage, silhouettes et halo de touge) dépassent 1,5 × le brouillard
      if (far !== cam.far) { cam.far = far; cam.updateProjectionMatrix(); }
      sky.position.copy(cam.position); sky.scale.setScalar(kf); sunDisc.position.copy(cam.position).addScaledVector(SD, 2000 * kf); sunDisc.scale.set(TH.astre.taille * kf, TH.astre.taille * kf, 1); }
    pharesV = Math.max(TH.phares, (TH.pharesBrume || 0) * kBr); nuitV = pharesV / 2.6;
    if (voileBr) { voileBr.visible = kBr > 0.01; voileBr.position.copy(cam.position); voileBr.material.opacity = Math.min(1, kBr * 1.6); voileBr.material.color.copy(scene.fog.color); } // th.brume : un banc de brouillard sur une portion du tracé
    skyMat.color.copy(WHITE).lerp(FOG_IN, TH.tun && TH.tun.cielJour ? 0 : lm); // th.tun.cielJour : le ciel garde sa couleur sous le tunnel (on voit le jour par la bouche et par les ouvertures)
    const fl = flashT > 0 && lm < 0.5 ? ((flashT * 14 | 0) & 1 ? 1 : 0.3) : 0;
    { const nuit = lm * (1 - (TH.tun && TH.tun.jour || 0)); hemi.intensity = Math.PI * (TH.hemi[2] * (1 - 0.75 * nuit) + 3 * fl); sun.intensity = Math.PI * TH.sun[1] * (1 - nuit); } // th.tun.jour : part du jour gardée sous le tunnel (grotte ouverte : ce qu'on voit par les porches et les puits reste au soleil) // × π : three r155+ n'a plus d'intensités « héritées » // en tunnel, ciel et astre s'effacent : il ne reste que les luminaires skyMat.color.multiplyScalar(1 + 2.5 * fl); scene.fog.color.lerp(FLASH, 0.45 * fl);
    beams.forEach((b, i) => b.rotation.set(0, Math.atan2(cam.position.x - b.position.x, cam.position.z - b.position.z), Math.sin(now * 0.0004 * (i % 3 + 1) + i) * 0.5)); // les faisceaux de projecteurs font face à la caméra
    // lumière dynamique : phares, boîte d'ombre de la voiture, reflets, puis la liste des luminaires
    const cp = Math.cos(pitch);
    const dg = G.userData.dg, hs = (dg.ph[0] - dg.ph[1]) * 0.55; // un phare cassé : le faisceau part de l'autre, à moitié ; les deux : plus rien
    LUX.uCam.value = cam.position; LUX.uHP.value.set(car.x + fx * 1.9 - fz * hs, carY + 0.62, car.z + fz * 1.9 + fx * hs); LUX.uHD.value.set(fx * cp, Math.sin(pitch), fz * cp); LUX.uHC.value.copy(HCB).multiplyScalar(pharesV * (1 - (dg.ph[0] + dg.ph[1]) / 2));
    if (cones) { cones.visible = kBr > 0.02; cones.material.opacity = 0.14 * kBr * (1 - (dg.ph[0] + dg.ph[1]) / 2); cones.position.copy(LUX.uHP.value); cones.rotation.set(0, Math.atan2(fx, fz), 0); }
    G.updateMatrixWorld(); LUX.uBox.value.copy(G.matrixWorld).multiply(BOITE).invert(); // G : le modèle de la voiture de la vue ; l'ombre portée sous les luminaires n'existe que pour elle
    LUX.uSunC.value.copy(SUNC).multiplyScalar(1 - lm); LUX.uSky.value.copy(scene.fog.color); LUX.uRes.value.set(TRB ? vu.rw / 2 / TRB : 0, RH / 2 / TRB);
    let nl = 0;
    const LP = LUX.uLP.value, LC = LUX.uLC.value, put = (x, y, z, c, r, k) => { if (nl < NL) { const m = k * LUM_GAIN; const o = nl * 4; LP[o] = x; LP[o + 1] = y; LP[o + 2] = z; LP[o + 3] = r; LC[nl * 3] = c.r * m; LC[nl * 3 + 1] = c.g * m; LC[nl * 3 + 2] = c.b * m; nl++; } };
    put(car.x - fx * 4.4, carY + 0.35, car.z - fz * 4.4, ROUGE, -9, nuitV * (inp.brake || car.frA ? 2.4 : 0.45) * (1 - (dg.fe[0] + dg.fe[1]) / 2)); // feux arrière (moins les cassés) : ils teintent ce qui suit, davantage au freinage
    if (L.neon) put(car.x, carY + 0.3, car.z, NEONC, -5.5, nuitV * (0.8 + 0.4 * pulse)); // néon de bas de caisse
    // éclats brefs, trois créneaux au plus pris sur les luminaires fixes : la gerbe d'étincelles contre un mur (orange, s'éteint en 0,2 s ; posée entre la caisse et le mur : dans la boîte d'ombre de la voiture elle n'éclairerait rien, derrière le mur elle tournerait le dos à sa face ; au-dessus du toit, la caisse ne cache pas la route), la flamme de nitro (bleue, vacille), l'éclair d'orage (tombe de haut, couvre tout)
    vu.ec = Math.max((vu.ec || 0) - dt * 5, vu.hit > 3 ? 1.5 : car.rub && sp > 8 ? 0.8 + 0.4 * Math.random() : 0);
    if (vu.ec > 0) { const s = S[car.idx], sg = Math.sign(car.d); const o = ENCt.z / 2 + 0.1; put(car.x - s.tz * sg * o, carY + 1.6, car.z + s.tx * sg * o, ETIN, 12, vu.ec * 4 * (0.5 + nuitV)); }
    // feux de la voiture (arrière, néon, nitro) : sans l'ombre de la boîte. Bas et tout près d'elle, ils la projetaient en rectangles nets sur la route et les murs autour (surtout la nitro en glisse, la boîte en travers)
    if (car.boost > 0) put(car.x - fx * 3.2, carY + 0.45, car.z - fz * 3.2, BLEU, -10, 2.5 * (0.5 + nuitV) * (0.8 + 0.4 * Math.random()));
    if (fl) put(car.x + 30, carY + 70, car.z - 20, FLASH, 140, 2.2 * fl);
    // les deux véhicules les plus proches (adversaires, ou camions du trafic) : phares devant, feux rouges derrière
    const d2 = c => (c.x - car.x) ** 2 + (c.z - car.z) ** 2;
    const veh = race ? race.cars.filter(c => c !== car && !partie(c)) : M.trafic && state !== 'title' ? trafic(T, tTraf).slice() : [];
    let nf = 0; veh.forEach(c => { if (d2(c) < 1600) return; const i = nf++, ax = Math.cos(c.th), az = Math.sin(c.th), k = c.lane === undefined, ar = k ? ENCt.x / 2 + 0.05 : 6.5, l = k ? ENCt.z / 2 - 0.3 : 1; // sur l'arrière de la caisse, ou de la remorque
      for (const s of [-1, 1]) feuxP.set(tmp.set(c.x - ax * ar - az * l * s, c.y + (k ? 0.7 : 1.3), c.z - az * ar + ax * l * s).lerp(cam.position, 0.01).toArray(), i * 6 + (s + 1) * 1.5); }); // 1 % vers la caméra : de loin, la profondeur ne distingue plus le feu de la caisse
    feuxGeo.setDrawRange(0, nf * 2); feuxGeo.attributes.position.needsUpdate = true;
    feux.material.size = (TH.pharesBrume ? 1 + 0.6 * kBr : 1) * 0.5 / Math.tan(vu.cam.fov * Math.PI / 360) * RH / renderer.domElement.height * renderer.getPixelRatio(); // three.js mesure les points sur la toile (0,5 × sa hauteur / distance), on dessine dans la cible de la vue, de RH lignes
    for (const c of veh.sort((a, b) => d2(a) - d2(b)).slice(0, 2)) {
      const ax = Math.cos(c.th), az = Math.sin(c.th), y = c.y, av = c.lane === undefined ? 6.5 : 10, ar = c.lane === undefined ? 3.4 : 7; // un camion est plus long
      const dv = c.lane === undefined ? modele(c).userData.dg : null, kp = dv ? 1 - (dv.ph[0] + dv.ph[1]) / 2 : 1, kf = dv ? 1 - (dv.fe[0] + dv.fe[1]) / 2 : 1; // ses phares et feux cassés
      put(c.x + ax * av, y + 0.8, c.z + az * av, PHARE, 14, 3 * nuitV * kp); put(c.x - ax * ar, y + 0.7, c.z - az * ar, ROUGE, 9, (c.lane === undefined && modele(c).userData.fr ? 2.4 : 1.4) * nuitV * kf);
      if (L.neon && race && (c.k < 0 || c.k >= 3)) put(c.x, y + 0.3, c.z, NEONC, 5.5, nuitV * (0.8 + 0.4 * pulse)); // la voiture de l'autre joueur garde son néon de bas de caisse (c.k : -1 le joueur 1, 3 le joueur 2)
    }
    // luminaires fixes : les plus proches le long de la piste (ceux de devant comptent double), fondus en bout de liste pour qu'aucun ne s'allume d'un coup
    if (car.idx !== vu.lumIdx) { vu.lumIdx = car.idx; for (const e of vu.lums) { let d = (e.l.i - car.idx + N) % N; if (d > N / 2) d -= N; e.d = d > 0 ? d * 0.5 : -d; } vu.lums.sort((a, b) => a.d - b.d); } // le tri ne change que d'un échantillon de piste au suivant
    const LS = vu.lums, ns = NL - nl, dm = LS.length > ns ? LS[ns].d : 1e9;
    for (let k = 0; k < ns && k < LS.length; k++) { const e = LS[k], l = e.l; put(l.x, l.y, l.z, l.c, l.r, Math.min(1, (dm - e.d) / (dm * 0.3 + 0.01)) * (l.tun && TH.alarme ? 0.5 + pulse : 1)); }
    LUX.uN.value = nl;
    // pluie : chaque goutte recule de la vitesse de la voiture, sa traînée s'étire d'autant
    const NG = TH.neige || 0, pl = (NG || pluieAt(car.idx)) * (1 - lm), gl = NG ? 0.2 : 1.9 * Math.max(1, 0.4 + 0.6 * pl), nr = Math.min(RN, Math.round(400 * pl ** 1.5)); rain.visible = pl > 0.02; splash.visible = !NG && rain.visible; // th.neige = force des flocons : les mêmes particules, qui tombent à 4 m/s, sans impact ni bruit de pluie
    rainGeo.setDrawRange(0, 2 * nr); rain.position.set(car.x, carY, car.z); RU.uOp.value = Math.min(1, 0.6 + 0.15 * pl);
    // décalage cumulé de la vue, gardé dans la période du cube (80 m, 30 m de haut) : le shader en déduit la place de chaque goutte
    pluieO[0] = (pluieO[0] + car.vx * dt) % 80; pluieO[1] = (pluieO[1] + (NG ? 4 : 55) * dt) % 30; pluieO[2] = (pluieO[2] + car.vz * dt) % 80;
    RU.uO.value.fromArray(pluieO); RU.uV.value.set(car.vx, 0, car.vz); RU.uF.value.set(fx, fz); RU.uGl.value = gl;
    // pluie éclairée : de nuit, un trait ne se voit vraiment que près d'un luminaire (les 8 plus proches le long de la piste) ou dans le faisceau des phares ; ailleurs il reste sombre
    RU.uAmb.value = NG ? 1 : 1 - 0.75 * Math.min(1, nuitV); RU.uHph.value = 0.35 * Math.min(1, nuitV); let nlr = 0; const RL = RU.uRL.value, RC = RU.uRC.value;
    if (rain.visible) for (let k = 0; k < 8 && k < vu.lums.length; k++) { const l = vu.lums[k].l, x = l.x - car.x, z = l.z - car.z, R = l.r * 0.6; if (x * x + z * z > 2500) continue;
      RL[nlr * 4] = x; RL[nlr * 4 + 1] = l.y - carY; RL[nlr * 4 + 2] = z; RL[nlr * 4 + 3] = 1 / (R * R); RC[nlr * 3] = l.c.r; RC[nlr * 3 + 1] = l.c.g; RC[nlr * 3 + 2] = l.c.b; nlr++; }
    RU.uNL.value = nlr;
    const ns2 = Math.min(SN, Math.round(SN * pl / 3)); splGeo.setDrawRange(0, ns2);
    for (let i = 0; i < ns2; i++) { // un impact vit 0,14 s sur la chaussée, de 4 à 40 m devant, puis renaît ailleurs ; il éclate clair et s'éteint
      if ((splA[i] += dt) > 0.14) { splA[i] -= 0.14; const j = 2 + Math.floor(alea() * 18), s = S[(car.idx + j) % N], l = (alea() * 2 - 1) * W; splP.set([s.x - s.tz * l, s.y + 0.06, s.z + s.tx * l], i * 3); splD[i] = 1 - j / 24; } // au loin, l'impact est plus pâle
      const f = (1 - splA[i] / 0.14) ** 2 * splD[i]; splC[i * 3] = 0.45 * f; splC[i * 3 + 1] = 0.6 * f; splC[i * 3 + 2] = 0.75 * f;
    }
    splGeo.attributes.position.array = splP; // les impacts de cette vue : même tampon GPU, renvoyé avant chaque dessin
    splGeo.attributes.position.needsUpdate = splGeo.attributes.color.needsUpdate = true;

    // alerte de virage : seulement un virage serré pour la vitesse du moment (alerteVirage, sim.js)
    // et la glace vive (T.surf, vir > 0,4) qui arrive dans les 3,6 s devant, quand on n'y est pas encore : sans elle, une plaque était une surprise. Les deux disent la distance qui reste (2 m par échantillon)
    const glace = j => !!T.surf && T.surf[(car.idx + j) % N].vir > 0.4, D = Math.round(sp * 0.6); let surGlace = 0; if (state === 'race' && sp > 15 && !glace(0)) for (let j = 1; j < 3 * D && !surGlace; j++) if (glace(j)) surGlace = 2 * j;
    if (!ST) { // rayons de lumière : l'astre, les phares du véhicule le plus proche s'ils nous font face ; plus forts sous la pluie, dans la brume et en tunnel
      cam.updateMatrixWorld(); const RY = post.uniforms.ray.value, RC = post.uniforms.rayC.value, brume = RAYS * Math.min(1, Math.max(0.5 * Math.min(1, pl), 600 / TH.fogD[1], 0.3 * lm)), th = Math.tan(cam.fov * Math.PI / 360); let n = 0;
      const src = (x, y, z, col, k, rw) => { // rw : rayon du halo autour de la source, en m (0 : l'astre, à l'infini)
        const dc = cam.position.distanceTo(tmp.set(x, y, z)); if (n > 3 || k < 0.01 || (rw && dc > 90)) return false;
        tmp.lerp(cam.position, rw ? Math.min(0.5, 1.5 / dc) : 0).project(cam); // 1,5 m vers la caméra : la lanterne ne cache pas sa propre lumière
        if (tmp.z > 1 || Math.abs(tmp.x) > 1.4 || Math.abs(tmp.y) > 1.4) return false;
        const r = rw ? rw / (2 * dc * th) : 0.08; RY[n].set(tmp.x * 0.5 + 0.5, tmp.y * 0.5 + 0.5, tmp.z * 0.5 + 0.5, 1 / (r * r)); RC[n++].copy(col).multiplyScalar(k); return true; };
      if (TH.astre.taille > 1) { const p = cam.position; src(p.x + SD.x * 1800, p.y + SD.y * 1800, p.z + SD.z * 1800, ASTRE, 1.3 * RAYS * TH.sun[1] * (1 - lm) * (TH.astre.rayons ?? 1), 0); } // th.astre.rayons : force du halo de l'astre (1 par défaut) // tout ce qui est à moins de 1 800 m cache l'astre ; le ciel (2 500 m), non
      const c = veh[0]; if (c && Math.cos(c.th) * (cam.position.x - c.x) + Math.sin(c.th) * (cam.position.z - c.z) > 0) { const av = c.lane === undefined ? 6.5 : 10; src(c.x + Math.cos(c.th) * av, c.y + 0.8, c.z + Math.sin(c.th) * av, PHARE, brume * nuitV, 2); }
      for (; n < 4; n++) RC[n].setScalar(0);
    }
    drawHUD(vu, dt, sp, state === 'race' ? alerteVirage(T, car.idx, sp) || (surGlace && { glace: surGlace }) : 0);
    const U = post.uniforms; U.t.value = (vu.rs || vu.rt).texture; U.h.value = vu.hudT; if (U.dz) U.dz.value = vu.rt.depthTexture; U.px.value.set(AA * KL / vu.rw, AA * KL / RH); post.uniforms.vig.value = 0.6 * nitE + 1.3 * rv * rv; // vignette resserrée par la vitesse et la nitro ; la passe finale est commune : ses entrées sont celles de la vue
    // flou de vitesse : rien sous 130 km/h, il monte ensuite jusqu'à la pointe ; l'aberration chromatique suit
    post.uniforms.amt.value = 1.1 * rv * rv; post.uniforms.ab.value = 0.002 + 0.016 * rv * rv + (stun > 0 ? stun * 0.04 : 0);
    // gouttes sur l'objectif (voir AIR) : la pluie en dépose, pas la neige ; elles glissent, puis le vent de la course les remonte en les étirant, et au-delà de M.vit[0] il les chasse
    const gt = vu.gt || (vu.gt = Array.from({ length: 8 }, () => ({ x: 0, y: 0, r: 0, a: 0, vie: 0 }))), ve = Math.min(1, sp / V0), chasse = clamp((sp - V0) / (V1 - V0), 0, 1), pg = NG ? 0 : Math.max(pl, embAt(car.idx));
    for (let i = 0; i < 8; i++) { const g = gt[i], u = U.gt.value[i];
      if (g.a >= g.vie) { u.z = 0; if (pg > 0.02 && i < 6 && Math.random() < dt * 0.9 * pg * (1 - 0.6 * chasse)) Object.assign(g, { x: Math.random(), y: 0.15 + 0.85 * Math.random(), r: 0.004 + 0.006 * Math.random(), a: 0, vie: 2 + 4 * Math.random() }); else continue; }
      g.a += dt; g.y += dt * (-0.015 + 0.12 * ve * ve + 1.6 * chasse); if (g.y > 1.15 || g.y < -0.1) g.a = g.vie;
      u.set(g.x, g.y, g.r * Math.min(1, (g.vie - g.a) * 2, g.a * 8), 1 + 1.5 * ve * ve + 1.5 * chasse); // apparaît vite, s'évapore en rapetissant
    }
    // chaleur (voir AIR) : au loin sur la route des cartes chaudes (th.chaleur), en plein soleil, sans pluie
    const ch = U.ch.value, cr = U.cr.value; cr.z = now / 1000 % 600;
    ch.set(0, 0, 0, 0);
    if (TH.chaleur) { const s = S[(car.idx + 80) % N]; tmp.set(s.x, s.y, s.z).project(cam); cr.x = tmp.x / 2 + 0.5; cr.y = tmp.y / 2 + 0.5; ch.w = tmp.z < 1 ? TH.chaleur * (1 - lm) * (1 - Math.min(1, pl)) : 0; }
    if (!chaud) { // première image : tout est dessiné une fois sans tri de visibilité, pour que shaders, géométries et textures partent au GPU maintenant et non au premier passage en course (à-coups de 40 ms)
      chaud = true; const caches = [], tri = [];
      scene.traverse(o => { if (!o.visible) { caches.push(o); o.visible = true; } if (o.frustumCulled) { tri.push(o); o.frustumCulled = false; } });
      renderer.setRenderTarget(vu.rt); renderer.render(scene, cam);
      for (const o of caches) o.visible = false; for (const o of tri) o.frustumCulled = true;
    }
    // les matrices de la scène une fois pour les trois rendus de la vue (reflets, ombres mobiles, scène) : chacun les recalculait toutes
    rouesInst(); scene.updateMatrixWorld(); scene.matrixWorldAutoUpdate = false; if (!vu.n) refFace();
    ombres(vu, pasL, car, carY);
    renderer.setRenderTarget(vu.rt); renderer.render(scene, cam); scene.matrixWorldAutoUpdate = true;
    if (vu.rs) { const R = ssr.uniforms; R.t.value = vu.rt.texture; R.dz.value = vu.rt.depthTexture; R.P.value.copy(cam.projectionMatrix); R.Pi.value.copy(cam.projectionMatrixInverse); R.up.value.set(0, 1, 0).transformDirection(cam.matrixWorldInverse); R.px.value.set(1 / vu.rw, 1 / RH); renderer.setRenderTarget(vu.rs); renderer.render(ssrScene, postCam);
      REPLI.rDz.value = vu.rt.depthTexture; REPLI.rRes.value.set(vu.rw, RH); renderer.autoClear = false; renderer.render(repliScene, cam); renderer.autoClear = true; }
    { const OE = TH.oeil || {}, OEIL_NOIR = OE.noir ?? OEIL_N, OEIL_CLAIR = OE.clair ?? OEIL_C, vrai = Math.log(1 - (1 - (OE.tun ?? TUN)) * lm), cible = vrai - Math.log(T.tun && TH.tun.eclat || 1) * lm; // l'œil : vrai = log de la lumière vraie ; th.tun.eclat : l'œil se fait à un tunnel plus clair que sa peinture
      vu.oeil += (cible - vu.oeil) * (1 - Math.exp(-dt / (cible > vu.oeil ? OEIL_CLAIR : OEIL_NOIR))); U.ex.value = Math.min(Math.exp(vrai - vu.oeil), Math.max(1.6, T.tun && TH.tun.eclat || 1)); } // éblouissement au plus ×1,6
    if (vu.hb) { U.hb.value = vu.hb.texture; renderer.setRenderTarget(vu.hb); renderer.render(haloScene, postCam); }
    renderer.setRenderTarget(null);
    if (COM) { const [cols, rows] = grille(VUES.length), x = (vu.n % cols) * vu.w, y = (rows - 1 - (vu.n / cols | 0)) * HH; renderer.setViewport(x * KL, y * KL, vu.w * KL, HH * KL); renderer.setScissor(x * KL, y * KL, vu.w * KL, HH * KL); } // à deux : la passe finale de la vue dans sa bande (y compté du bas : le joueur 1 en haut) ; le shader ne change pas, son centre de flou et sa vignette sont relatifs à la bande
    renderer.render(postScene, postCam);
  }
  let chaud = false;
  let raf = 0;
  const loop = now => { raf = requestAnimationFrame(loop); frame(now); };
  // arrêt (changement de carte) : plus de boucle ni d'écouteurs ; puis libere() rend au GPU tout ce que cette carte y avait mis (les shaders, eux, restent au renderer tant qu'une matière s'en sert)
  const fin = () => { cancelAnimationFrame(raf); arret.abort(); clearTimeout(padNoteT); padNote.remove(); if (COM) COM.c.remove(); };
  const libere = () => {
    for (const sc of [scene, repliScene]) sc.traverse(o => { if (o.geometry) o.geometry.dispose(); for (const m of [].concat(o.material || [])) { for (const k of ['map', 'emissiveMap', 'alphaMap', 'specularMap']) if (m[k]) m[k].dispose(); m.dispose(); } });
    VUES.forEach(rendVue); CUBE.dispose(); post.dispose(); ssr.dispose(); quad.geometry.dispose(); if (sun.shadow.map) sun.shadow.map.dispose();
  };
  // arrivée sur cette carte (premier affichage ou retour) : ce que la carte d'avant a laissé dans sessionStorage
  const arrivee = () => {
    try { const m = sessionStorage.getItem('vpr.menu'); if (m) { msel = 0; sessionStorage.removeItem('vpr.menu'); entrer(); SON.reprendre(JSON.parse(m)); } } catch (e) { } // la musique de menu reprend où elle en était // on vient de changer de carte : on reste sur cette ligne, sans repasser par l'accueil (le navigateur garde en général le droit au son d'une page à l'autre ; sinon il revient à la touche suivante)
    try { if (sessionStorage.getItem('vpr.go')) { const g = sessionStorage.getItem('vpr.go'); sessionStorage.removeItem('vpr.go'); if (mode === 'tournee' || g === '2') start(); } } catch (e) { } // arrivée sur la carte d'une manche de Tournée, ou par DEMARRER au menu : la course part tout de suite
    try { const d = sessionStorage.getItem('vpr.demo'), f = sessionStorage.getItem('vpr.demoFin'); sessionStorage.removeItem('vpr.demo'); sessionStorage.removeItem('vpr.demoFin');
      if (d) demoLance(JSON.parse(d)); else if (f === 'a') accueil = true; } catch (e) { } // démo : carte suivante de la nuit, ou retour sur la carte d'origine (à l'accueil si l'on en venait)
    if (NET.role) { NET.ev = onNet; let g = null; try { g = sessionStorage.getItem('vpr.netgo'); sessionStorage.removeItem('vpr.netgo'); } catch (e) { } // carte changée en ligne : ce fichier vient d'être rejoué, le salon (reseau.js) est resté
      if (g) { choix = false; start(true); } else if (invite()) attente(); }
  };
  // veille : la carte reste construite (scène, textures et shaders au GPU) mais ne dessine ni n'écoute plus ; reprend : elle revient au menu, dans l'état d'une carte neuve
  const veille = () => { actif = false; cancelAnimationFrame(raf); padNote.style.display = 'none'; if (COM) COM.c.style.display = 'none'; for (const k in keys) keys[k] = 0; };
  const reprend = () => {
    const av = window.__g; if (av && av !== api) (av.veille || av.fin)();
    actif = true; window.__g = api; window.CARTE = M;
    if (state !== 'title') toMenu(); accueil = true; aMenu = false; choix = false; msel = 5; cible = null; demo = null; enl = null; ins = false; inactif = 0; // comme une carte neuve
    langue = pref('vpr.langue', 'fr') === 'en' ? 'en' : 'fr'; appliqueLangue(); manual = pref('vpr.boite', 'a') === 'm'; VUES[0].moi.manual = manual; // les réglages ont pu changer sur une autre carte
    { const n = +(Q.get('joueurs') || pref('vpr7.joueurs', '1')); joueurs(n > 1 && !DEFI && !NET.role ? n : 1); }
    if (COM) COM.c.style.display = '';
    arrivee(); resize(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    prepare();
  };
  // construit(c) : l'instance de la carte c, construite en fond la première fois (une promesse par carte, partagée par toutes les instances)
  const construit = c => { const E = window.__enCours || (window.__enCours = {}); return E[c.id] || (E[c.id] = lanceJeu(c, true)); };
  // prepare : une fois la page lancée, les autres cartes se construisent en fond, les voisines d'abord, une à la fois ; aux bancs et captures (?auto, ?perf, ?style) on ne construit que ce qui est demandé
  const prepare = () => {
    if (window.__prep || AUTO || ST || /[?&]perf\b/.test(location.search)) return;
    const i0 = CARTES.indexOf(M), ordre = [...new Set(CARTES.flatMap((_, k) => [CARTES[(i0 + k) % CARTES.length], CARTES[(i0 - k + CARTES.length * 2) % CARTES.length]]))];
    window.__prep = (async () => { for (const c of ordre) { await construit(c); await souffle(); } })();
  };
  const api = { get decor() { return { dz: MDZ, obj: OBJ, marques: mi, deb: DEB.length, tord: murTord, marque, vitre: w => vitre(carG, w, 0, 0), huile: hi, sale: [carG, ...opps].map(g => +saleDe(g).n.toFixed(2)) }; }, veille, reprend, get enl() { return enl; }, get demo() { return demo; }, get inactif() { return inactif; }, frame, start, fin, libere, joueurs, places: PLACES, get ins() { return ins; }, get com() { return COM; }, carte: id => { cible = CARTES.find(m => m.id === id); changeCarte(); }, get tnFin() { return ses.tnFin; }, get defi() { return { DEFI, defiErr, dernier: ses.dernier }; }, get fantome() { return { nom: nomF(), visible: ghostM.visible, couleur: ghostM.material.color.getHexString(), x: ghostM.position.x, z: ghostM.position.z }; }, M, T, scene, cam: VUES[0].cam, vues: VUES, renderer, LUX, get race() { return race; }, get mode() { return mode; }, keys, ambAt, nearS, get accueil() { return accueil; }, get car() { return VUES[0].moi; }, get state() { return state; }, get t() { return ses.tRace; }, get ac() { return SON.ac; }, get out() { return SON.out; }, get smp() { return SON.smp; }, degats: x => { for (const g of [carG, ...opps]) { const D = g.userData.dg; D.z0 = [1, 1, 1, 1]; for (const [a, b, i] of [[1, 0, 0], [-1, 0, 1], [0, -1, 2], [0, 1, 3]]) for (let k = 0; k < 60 && D.z[i] < x - 0.01; k++) dgChoc(g, a, b, 12); } } }; // instance de la carte (et prise de test, en window.__g quand elle est affichée) ; degats(x) : chaque zone de chaque voiture abîmée à x (captures)
  if (fond) { // première image de la carte d'avance, dans sa cible : shaders compilés et textures envoyées au GPU maintenant, pas au moment où elle s'affiche
    await souffle(); const vu = VUES[0], caches = [], tri = [];
    scene.traverse(o => { if (!o.visible) { caches.push(o); o.visible = true; } if (o.frustumCulled) { tri.push(o); o.frustumCulled = false; } });
    renderer.setRenderTarget(vu.rt); renderer.render(scene, vu.cam); renderer.setRenderTarget(null);
    for (const o of caches) o.visible = false; for (const o of tri) o.frustumCulled = true;
  }
  (window.__cartes || (window.__cartes = {}))[M.id] = api; (window.__enCours || (window.__enCours = {}))[M.id] = Promise.resolve(api);
  if (!fond) reprend();
  return api;
})();
if (/[?&]perf\b/.test(location.search)) import('./outils/perf.js').then(m => m.suite()); // banc de performance : voir outils/perf.js
