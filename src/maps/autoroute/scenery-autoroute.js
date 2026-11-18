// Scenery placement for "autoroute" (Sunken Highway, layout 7): a city on a street grid of 110 m, of which the route is what is left open.
// This file: the ground of the whole city (the streets are the terrain itself: the engine only lays 14 m of roadway down the axis of the lane), the water, the far city, the shared materials (MAT), the placers,
// and real(): the scenery of every solid box of the map. Collision follows the objects: M.obst (src/data/maps.js) lists the boxes the cars hit, each with the name of what stands there,
// and real() builds that thing inside the footprint. Nothing the car can reach is placed any other way: what the zone files add stands out of reach (behind a box, above the lane, under the deck).
// The city itself is scenery-autoroute-ville.js; each zone file builds its own structure (deck, cave, tram line); shapes and textures are shapes-autoroute-*.js and textures-autoroute*.js.
// See docs/methods/NEW-MAP.md, phase 3, and docs/proposals/sunken-highway/AMBIANCE-V2.html.
(function () {
  const { near, terrain, inst, weld } = PLACERS;
  const ZONES = ['ville', 'boulevard', 'quartier', 'pont', 'trou', 'metro'], G = 110; // G: grid pitch, node (i, j) is at (i * G, j * G), j grows to the south
  // the city slopes down to the river in the east: dry at 2.5 m west of the motorway, under 32 cm of water (level 0) from x = 320 on
  const ss = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }, cityY = x => 2.5 - 1.8 * ss((x - 180) / 140), groundY = x => x > 560 ? -3 : cityY(x) + (-0.32 - cityY(x)) * ss((x - 290) / 30);
  // half-widths from a street's axis to its facades: the boulevard is row 0, the motorway runs above column 2 (its slip road on the east side). Same figures as the map's block in maps.js
  const colL = i => i === 2 ? 20 : 11, colR = i => i === 2 ? 38 : 11, row = j => j === 0 ? 17 : 11;
  const HH = (v, k) => { const x = Math.sin(v * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); }; // 0..1, fixed by v and k: variety without touching the shared randomness

  Object.assign(SCENERY, {
    autoroute(h) {
      const { THREE, S, N, T } = h, M = T.mapDef, I = Object.fromEntries(Object.entries(M.key).map(([k, i]) => [k, near(h, M.pts[i][0], M.pts[i][1])]));
      // zone(i): what the lane is at sample i. 'rue': laid on the ground of the city; 'pont': slip road, deck and fallen span; 'cave': the hole, from the ledge to the mouth of the tram line's box; 'tube': the line under cover; 'tremie': its open trench
      const zone = i => i < I.rampe ? 'rue' : i < I.sol ? 'pont' : i < I.bord ? 'rue' : i < T.t0 ? 'cave' : i < T.t1 ? 'tube' : i < I.tremie ? 'tremie' : 'rue';
      // MAT: the shared materials of the map, one draw pass each: every real piece goes into the group `kit`, merged per material at the end. Keys are the zone names of the autoroute shapes
      const DS = { side: THREE.DoubleSide }, LAID = { ...DS, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }, CUT = { ...LAID, alphaTest: 0.5 }, body = c => h.mat('carrosserieAutoroute', { c }), MAT = {
        asphalt: h.mat('asphalteAutoroute', DS), pave: h.mat('trottoirAutoroute', DS), grass: h.mat('herbeAutoroute'),
        water: h.mat('eauAutoroute', { rep: [112, 250], transparent: true, opacity: 0.5, c: 0x9ab0a0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -8, polygonOffsetUnits: -8 }), // (the offset: the lane lies 30 cm under it, and would show through at a distance)
        brick: h.mat('briqueAutoroute'), brick2: h.mat('briqueAutoroute', {}, '#6e4a40', 1), brick3: h.mat('briqueAutoroute', {}, '#9a6a4a', 2), stone: h.mat('bureauAutoroute'), stone2: h.mat('bureauAutoroute', {}, '#8f8c82', 1), stone3: h.mat('bureauAutoroute', {}, '#b0a078', 2),
        glass: h.mat('verreAutoroute'), glass2: h.mat('verreAutoroute', {}, 1), tin: h.mat('toleAutoroute'), tin2: h.mat('toleAutoroute', {}, '#7a6a58', 1), shop: h.mat('vitrineAutoroute'), shop2: h.mat('vitrineAutoroute', {}, '#5a5048', 1), hole: h.mat('interieurAutoroute'),
        tunnel: h.mat('tunnelAutoroute', { ...DS, c: 0xb4b4ac }), mur: h.mat('tunMurAutoroute', { ...DS, c: 0xb0b0a6 }), rib: h.mat('tunVouteAutoroute', { ...DS, emis: 1, c: 0x7c7c76 }), vault: h.mat('tunVouteAutoroute', { ...DS, emis: 1, c: 0xa4a49c }),
        earth: h.mat('terreAutoroute', DS), moss: h.mat('mousseAutoroute', { ...CUT, c: 0xa09a84 }), crack: h.mat('fissureAutoroute', CUT), mark: h.mat('marquageAutoroute', CUT), leaves: h.mat('feuillesAutoroute', CUT),
        ballast: h.mat('ballastAutoroute', DS), plaque: h.mat('plaqueAutoroute', { emis: 1 }, 'HOTEL DE VILLE'), stripe: body(0x2f7a70), far: h.mat('bureauAutoroute', { c: 0xd0b0a0 }, '#8a8078'),
        concrete: h.mat('concretePart', DS), dark: h.mat('concreteDark', DS), yellow: body(0xb8a050), steel: h.mat('matGray'), rubble: h.mat('gravatsAutoroute', { c: 0xa8a298 }), tile: h.mat('carrelageAutoroute', { ...DS, c: 0xa0a69c }),
        ivy: h.mat('lierreAutoroute'), ivy2: h.mat('lierreAutoroute', {}, '#2f4a1f'), vine: h.mat('lierreDecoupeAutoroute', { ...DS, alphaTest: 0.5 }), vine2: h.mat('lierreDecoupeAutoroute', { ...DS, alphaTest: 0.5 }, '#6a7f2e'),
        reed: h.mat('lierreAutoroute', {}, '#7a9a50'), blade: h.mat('roseauDecoupeAutoroute', { ...DS, alphaTest: 0.5 }), leaf: h.mat('feuillageAutoroute'), gold: h.mat('feuillageAutoroute', {}, '#b89a40'), bark: h.mat('trunk'),
        body: h.mat('carrosserieAutoroute'), rust: body(0x8a4a2a), olive: body(0x5a6240), canvas: body(0x7a7450), pane: h.mat('paneDark'), lamp: h.mat('lampObj', { emis: 1 }), sign: h.mat('panneauAutoroute', {}, 'CENTRE VILLE'), chevron: h.mat('chevronAutoroute', DS), arrowG: h.mat('flecheAutoroute', CUT, 0), arrowD: h.mat('flecheAutoroute', CUT, 1) };
      MAT.tyre = MAT.dark; const BODIES = [MAT.rust, body(0xb8b4a8), body(0x6f8296), body(0x7a3a34), body(0xb9ae94), body(0x7d8a6a)], kit = new THREE.Group(); h.scene.add(kit);
      // the ground. Within 22 m of the lane where it is laid on the city, the ground is the lane's own altitude (6 cm under the engine's roadway); elsewhere the city's slope (groundY).
      // Dug out: the cave the street fell into, and the open trench of the tram line. Their slopes (a vertex every 10 m) lie under what covers them: buildings, the slabs left of the street, the lids of the trench
      const RUE = S.filter((s, i) => zone(i) === 'rue' && i % 2 === 0), lane = (x, z) => { let b = null, bd = 1600; for (const s of RUE) { const d = (s.x - x) ** 2 + (s.z - z) ** 2; if (d < bd) { bd = d; b = s; } } return b && [b.y, Math.sqrt(bd)]; };
      // (the open trench of the tram line: dug within 13 m of its axis, deep enough that the slope back up to the street, one vertex further out, passes under its floor at the walls; its file puts lids back over the slopes)
      const OPEN = S.filter((s, i) => i >= T.t1 - 2 && i < I.tremie - 2), level = (x, z) => { if (x > 62 && x < 146 && z > 205 && z < 235) return -12;
        { let b = null, bd = 169; for (const s of OPEN) { const d = (s.x - x) ** 2 + (s.z - z) ** 2; if (d < bd) { bd = d; b = s; } } if (b) return b.y - 0.3 - 1.2 * (2.5 - b.y); }
        const l = lane(x, z), y0 = groundY(x); return l ? l[0] - 0.06 + (y0 - l[0] + 0.06) * ss((l[1] - 22) / 18) : y0; };
      const park = (x, z) => ss((x + 215) / 8) * ss((-115 - x) / 8) * ss((z + 99) / 8) * ss((-11 - z) / 8), wild = (x, z) => Math.max(0, Math.sin(x * 0.045 + 1.3) * Math.sin(z * 0.052 + 0.4) + Math.sin(x * 0.11 + z * 0.07) * 0.5 - 0.55) * 2.2;
      // (two coats on the asphalt: grass where the park was, and grass that has broken through here and there, away from the axis of the streets)
      const g = terrain(h, { stepSec: 10, margin: 300, hollow: (x, z, y) => y - level(x, z), mat: h.mat('asphalteAutoroute'), layerSet: [{ tex: ['herbeAutoroute'], weight: park }, { tex: ['herbeAutoroute'], weight: (x, z) => { const l = lane(x, z); return Math.min(0.7, wild(x, z)) * (l ? ss((l[1] - 5) / 6) : 1); } }] });
      const water = h.water(0, { size: [900, 2000], x: 725, bounds: [275, -1000, 1175, 1000], depth: 1, top: 1, clarity: 0.45, foam: 0.14, foamCol: 0xa9b6a2, ripple: 5, rough: 0.1, flow: 0.012, shallow: 0x8a9f8a, deep: 0x46584c, lift: 8 }); // the engine's water (MAP-ENGINE-OPTIONS.md 'Water'): still, clear over the lane, a mirror for the facades // east of x = 275: the shore is where the streets dip under it, around x = 312
      // one street asphalt over the engine's own roadway (14 m down the axis of the lane), the same as the ground beside it: the street is one surface from facade to facade
      { const m = h.mat('asphalteAutoroute', { ...DS, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, rep: [1.4, 1] }); for (const [a, b] of [[0, I.eauA + 10], [I.eauB - 10, I.rampe], [I.sol, I.bord], [I.tremie, N]]) h.ribbon(a, b - a, -7.05, 0.01, 7.05, 0.01, m, 10); }
      // the far city: the terrain stops 300 m from the road. A ground slab under the horizon (in four pieces: the cave and the trench lie lower), then a ring of towers in the haze, lower across the river
      for (const [x0, x1, z0, z1] of [[-2600, -480, -2600, 2600], [180, 2600, -2600, 2600], [-480, 180, -2600, 0], [-480, 180, 255, 2600]]) h.pose('boxMesh', MAT.dark, kit, [(x0 + x1) / 2, -2.2, (z0 + z1) / 2], x1 - x0, 1, z1 - z0);
      for (let i = 0; i < 64; i++) { const a = i / 64 * Math.PI * 2, r = 860 + 420 * HH(i, 1), x = Math.cos(a) * r * 1.25, z = Math.sin(a) * r, e = x > 700, w = 50 + 60 * HH(i, 2), ht = e ? 25 + 40 * HH(i, 3) : 70 + 150 * HH(i, 4) * HH(i, 3);
        h.pose('boxMesh', MAT.far, kit, [x, ht / 2 - 2, z], w, ht, 50 + 40 * HH(i, 5)); }

      // --- placers ---
      // mesh: a piece of the kit from its points. quad(m, a, b, c, d, tile): a four-sided face from its corners [x, y, z], the texture every `tile` metres
      const mesh = (m, pos, uv, ix) => { const q = new THREE.BufferGeometry(); q.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); q.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); q.setIndex(ix); q.computeVertexNormals(); kit.add(new THREE.Mesh(q, m)); };
      const quad = (m, a, b, c, d, tile = 8) => { const u = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / tile, v = Math.hypot(d[0] - a[0], d[1] - a[1], d[2] - a[2]) / tile; mesh(MAT[m] || m, [...a, ...b, ...c, ...d], [0, 0, u, 0, u, v, 0, v], [0, 1, 2, 0, 2, 3]); };
      // set(shape, x, z, { ry, y, a, skin, rz, rx }): a catalogue shape at a plan position, on the ground unless y is given, turned by ry (rz, rx: tipped), with the shape settings a. Returns its group
      const set = (shape, x, z, { ry = 0, y, a = [], skin = MAT, rz = 0, rx = 0 } = {}) => { const grp = new THREE.Group(); grp.position.set(x, y ?? g.hAt(x, z), z); grp.rotation.set(rx, ry, rz, 'YXZ'); kit.add(grp); h.pose(shape, skin, grp, [0, 0, 0], ...a); return grp; };
      const slab = (m, x, y, z, wx, ht, dz, ry = 0) => { const b = h.pose('boxMesh', MAT[m], kit, [x, y + ht / 2, z], wx, ht, dz); b.rotation.y = ry; return b; }; // a plain box of a shared material, base at y
      // decal(m, x, y, z, w, d, ry): a flat drawing laid on the ground (cracks, moss, markings, dead leaves), w x d metres, shown once
      const decal = (m, x, y, z, w, d, ry = 0) => { const c = Math.cos(ry), s = Math.sin(ry), p = (u, v) => [x + u * c + v * s, y, z - u * s + v * c]; mesh(MAT[m], [...p(-w / 2, -d / 2), ...p(w / 2, -d / 2), ...p(w / 2, d / 2), ...p(-w / 2, d / 2)], [0, 0, 1, 0, 1, 1, 0, 1], [0, 2, 1, 0, 3, 2]); };
      // vegetation, instanced (catalogue shapes trunk and canopy). tree: a trunk and three faceted masses, gold for one in three. bush: never one green block: three to five masses of uneven size and of three greens,
      // the dark one low and wide, the pale ones smaller and higher. tuft: a low clump of grass (the car drives through it)
      const TREES = { bark: [], leaf: [], gold: [], ivy: [], ivy2: [], reed: [] }, LAMPS = [], REEDS = []; // LAMPS: [sample, x, y, z, kind] of every lamp drawn underground; REEDS: the reed beds (scenery-autoroute-vie.js lights the first and sways the second)
      const tree = (x, z, y, ht, r, v) => { const L = TREES[v % 3 ? 'leaf' : 'gold'], k = r / 3.4; TREES.bark.push([x, y + ht * 0.3, z, HH(v, 1) * 3, 1.8, ht * 0.6 / 5.2, 1.8]);
        L.push([x, y + ht * 0.72, z, HH(v, 2) * 6, k, k * 0.8, k], [x + r * 0.5, y + ht * 0.88, z - r * 0.3, HH(v, 3) * 6, k * 0.7], [x - r * 0.6, y + ht * 0.62, z + r * 0.4, HH(v, 4) * 6, k * 0.65]); };
      const bush = (x, z, y, w, ht, d, v = 0) => { const n = 3 + Math.floor(HH(v, 9) * 3); for (let i = 0; i < n; i++) { const f = i ? 0.35 + 0.3 * HH(v, 10 + i) : 0.7, ox = i ? (HH(v, 20 + i) - 0.5) * w * 0.7 : 0, oz = i ? (HH(v, 30 + i) - 0.5) * d * 0.7 : 0;
        TREES[i === 0 ? 'ivy2' : i & 1 ? 'ivy' : 'reed'].push([x + ox, y + ht * f * (i ? 0.55 : 0.3), z + oz, HH(v, 40 + i) * 6, w * f / 6.2, ht * f * (i ? 1.1 : 0.8) / 4.6, d * f / 6.2]); } };
      const tuft = (x, z, y, v = 0) => TREES[v % 3 ? 'ivy' : 'reed'].push([x, y + 0.1, z, HH(v, 1) * 6, (0.5 + 0.6 * HH(v, 2)) / 6.2, (0.35 + 0.3 * HH(v, 3)) / 4.6, (0.5 + 0.6 * HH(v, 4)) / 6.2]);
      // real(label, w, ht, d, x, y, z, ry): the real scenery of a named footprint (w on its local X, d on its local Z, base at y). False when the name is unknown
      const real = (label, w, ht, d, x, y, z, ry = 0) => { const v = Math.round(x * 7 + z * 13), long = w >= d, L = Math.max(w, d), l = Math.min(w, d), ryL = ry + (long ? Math.PI / 2 : 0), is = r => r.test(label);
        const off = (t, u = 0) => { const dx = long ? t : u, dz = long ? u : t, c = Math.cos(ry), s = Math.sin(ry); return [x + dx * c + dz * s, z - dx * s + dz * c]; }; // a point t along the footprint's long side, u across it
        const along = (shape, t, o = {}, u = 0) => set(shape, ...off(t, u), { y, ry: ryL, ...o }), veh = (k, i) => ({ a: [k], skin: { ...MAT, body: BODIES[Math.abs(v + i) % BODIES.length] } });
        const cars = stack => { const m = Math.max(2, Math.floor(L / 4.8)); for (let i = 0; i < m; i++) { const t = -L / 2 + (i + 0.5) * L / m, k = Math.floor(HH(v, i) * 4); along('voitureAutoroute', t, { ...veh(k, i), ry: ryL + (HH(v, i + 9) - 0.5) * 1.6 }, (HH(v, i + 5) - 0.5) * Math.max(0, l - 4));
          if (stack && i % 3 === 1) along('voitureAutoroute', t + 1.5, { ...veh(0, i + 3), y: y + 1.5, ry: ryL + 1.1, rz: 0.35 }); } };
        const barriers = (u = 0, k = 0.2) => { for (let t = -L / 2 + 1.9; t < L / 2; t += 3.9) along('barriereAutoroute', t, { ry: ryL + (HH(v, t) - 0.5) * k }, u); };
        // rim: a heap's footprint is the box the cars hit, and a heap thins out towards its edges: blocks of masonry stand all along the edge of the footprint, so that the car never stops against nothing
        const rim = () => { for (const [a, b, n] of [[w, d, 0], [d, w, 1]]) for (let t = -a / 2 + 1.1; t < a / 2; t += 2.4) for (const sg of [-1, 1]) { const q = HH(v + t * 7, sg + n), sz = 1.5 + q * 1.1, c = Math.cos(ry), s = Math.sin(ry), lx = n ? sg * (b / 2 - sz * 0.45) : t, lz = n ? t : sg * (b / 2 - sz * 0.45);
          slab(q < 0.25 ? 'concrete' : 'rubble', x + lx * c + lz * s, y - 0.15, z - lx * s + lz * c, sz, 0.7 + q * 1.3, sz * 0.9, ry + (q - 0.5) * 0.9); } };
        if (is(/IMMEUBLE EFFONDRE/)) { set('ruineAutoroute', x, z, { y, ry, a: [w, Math.max(14, ht * 1.7), d, v & 1 ? 'brick' : 'stone', v] }); rim(); }
        else if (is(/EBOULEMENT|EBOULIS|GRAVATS|QUAI EFFONDRE/)) { set('eboulisAutoroute', x, z, { y: y - 0.1, ry, a: [w, Math.max(1.2, ht || 1.4), d, v] }); if (l > 5) rim(); if (l > 2.5) for (let i = 0; i < 3; i++) tuft(...off((HH(v, i) - 0.5) * L, (HH(v, i + 5) - 0.5) * l), y + 0.6, v + i); }
        else if (is(/RUE AFFAISSEE/)) { set('eboulisAutoroute', x, z, { y: y - 0.6, ry, a: [w, 1.6, d, v] }); for (const t of [-0.3, 0.1, 0.34]) along('dalleAutoroute', t * L, { a: [L * 0.22, l * 0.9, (HH(v, t) - 0.5) * 0.7] }); }
        else if (is(/TRAM EN TRAVERS/)) { along('tramAutoroute', -L * 0.22, { a: [0], ry: ryL + 0.3, skin: { ...MAT, body: BODIES[1] } }); along('tramAutoroute', L * 0.22, { a: [2], ry: ryL - 0.22, skin: { ...MAT, body: BODIES[1] } }, l * 0.1); barriers(-l * 0.38); }
        else if (is(/MAT TRAM/)) { slab('steel', x, y, z, 0.28, 7.4, 0.28); slab('concrete', x, y, z, 0.7, 0.4, 0.7); }
        else if (is(/TRAM [ABC]/)) set('tramAutoroute', x, z, { y: y + 0.02, ry, a: ['ABC'.indexOf(label.slice(-1))], skin: { ...MAT, body: BODIES[1] } });
        else if (is(/BALISE/)) { along('barriereAutoroute', 0); const [ax, az] = off(-L / 2 + 0.15), [bx, bz] = off(L / 2 - 0.15); quad('chevron', [ax, y + 0.98, az], [bx, y + 0.98, bz], [bx, y + 1.9, bz], [ax, y + 1.9, az], 0.92); for (const t of [-L / 2 + 0.5, L / 2 - 0.5]) slab('steel', ...[off(t)[0], y + 0.85, off(t)[1]], 0.08, 0.2, 0.08); }
        else if (is(/FLECHE CHANTIER/)) set('flecheChantierAutoroute', x, z, { y, ry }).scale.setScalar(1.4);                       // (a big one: it must be read from the top of the fallen span)
        else if (is(/BARRAGE MILITAIRE/)) { barriers(-l * 0.3); along('camionAutoroute', -L * 0.12, { a: [2], ry: ryL + 0.15 }, l * 0.15); along('sacsAutoroute', L * 0.28, { a: [Math.min(10, L * 0.3)] }, l * 0.1); }
        else if (is(/CONVOI MILITAIRE/)) { along('camionAutoroute', -L * 0.32, { a: [2] }); along('blindeAutoroute', -L * 0.05, { ry: ryL + 0.3 }); along('camionAutoroute', L * 0.24, { a: [2], ry: ryL - 0.1 }); barriers(-l * 0.4); }
        else if (is(/CAMION MILITAIRE/)) along('camionAutoroute', 0, { a: [2] });
        else if (is(/GUERITE/)) set('gueriteAutoroute', x, z, { y, ry });
        else if (is(/MIRADOR/)) set('miradorAutoroute', x, z, { y, ry });
        else if (is(/TENTE/)) along('tenteAutoroute', 0);
        else if (is(/SACS/)) along('sacsAutoroute', 0, { a: [L] });
        else if (is(/BARRIERES ECRASEES/)) { for (let i = 0; i < 5; i++) along('barriereAutoroute', (HH(v, i) - 0.5) * (L - 3), { y: y + (i > 2 ? 0.55 : 0), ry: ryL + (HH(v, i + 5) - 0.5) * 2.2, rz: i > 2 ? 0.5 : (HH(v, i + 9) - 0.5) * 0.5 }, (HH(v, i + 3) - 0.5) * Math.max(0, l - 2)); set('eboulisAutoroute', x, z, { y: y - 0.1, ry, a: [w * 0.7, 0.8, d * 0.7, v] }); }
        else if (is(/BARRIERES/)) barriers(0, 0.14);
        else if (is(/BUS RENVERSE/)) { along('busAutoroute', 0, { ...veh(0, 4), y: y + 1.28, rz: Math.PI / 2 }); if (L > 16) cars(0); }
        else if (is(/BUS/)) along('busAutoroute', 0, veh(0, 4));
        else if (is(/BARRICADE/)) { cars(0); barriers(-l * 0.35); }
        else if (is(/EPAVES|CARAMBOLAGE|TAXIS/)) cars(is(/EMPILEES/));
        else if (is(/VOITURE/)) { along('voitureAutoroute', 0, veh(Math.floor(HH(v, 1) * 3), v)); if (HH(v, 2) < 0.4 && y > 0.2) bush(x, z, y, 2.6, 1.7, 2.6, v); }       // (two wrecks in five are overgrown, on dry ground)
        else if (is(/CAMION CITERNE/)) along('camionAutoroute', 0, { ...veh(1, 1), ry: ryL + 0.12 });
        else if (is(/CAMION RENVERSE/)) along('camionAutoroute', 0, { ...veh(0, 2), y: y + 1.25, rz: Math.PI / 2 });
        else if (is(/CAMION/)) along('camionAutoroute', 0, veh(0, 2));
        else if (is(/ARBRE TOMBE/)) set('arbreTombeAutoroute', x, z, { y, ry: ry + (long ? 0 : Math.PI / 2), a: [L * 0.9] });
        else if (is(/ARBRE/)) { tree(x, z, y, ht + 3, ht > 12 ? 5.5 : 2.8, v); decal('leaves', x, y + 0.1, z, 6, 6, HH(v, 5) * 6); }
        else if (is(/BUISSON/)) bush(x, z, y, w * 1.25, 1.5 + HH(v, 3), d * 1.25, v);
        else if (is(/LAMPADAIRE TOMBE/)) set('lampadaireAutoroute', ...off(-L / 2), { y: y + 0.25, ry: ryL - Math.PI / 2, rz: -1.52 });
        else if (is(/LAMPADAIRE/)) set('lampadaireAutoroute', x, z, { y, ry, a: [HH(v, 3) < 0.3 ? 0.2 : 0] });
        else if (is(/BARGE/)) along('bargeAutoroute', 0, { y: -1.2, ry: ryL + 0.25, skin: { ...MAT, body: MAT.rust } });
        else if (is(/ECHAFAUDAGE/)) { set('echafaudageAutoroute', x, z, { y, ry, a: [w, ht + 2, d, v] }); set('eboulisAutoroute', x, z, { y, ry, a: [w * 0.6, 1.5, d, v] }); }
        else if (is(/TRAVEE EFFONDREE|DALLE CASSEE/)) { set('dalleAutoroute', x, z, { y, ry, a: [w, d, 0.3] }); if (w > 12) set('eboulisAutoroute', x, z, { y, ry, a: [w, 2, d, v] }); }
        else if (is(/ROSELIERE/)) { REEDS.push(set('roseauxAutoroute', x, z, { y: -0.6, ry: ry + (long ? Math.PI / 2 : 0), a: [l, L, v] })); }
        else if (is(/MUR TREMIE/)) slab('concrete', x, -4.6, z, w, 8, d, ry);                                                       // the walls of the tram trench, from under its floor to a parapet 0.9 m above the street
        else return false; return true; };
      // every solid box of the map with a name gets its scenery, on the lane's ground at that place (the lane's own altitude where one passes within 30 m at that level, the ground elsewhere)
      const NONE = /^(ILOT|PARC|TALUS|QUAI TRAM|TRAVEE TOMBEE)$/; // built by the city (ville), the hole (trou), the tram line (metro) and the bridge (pont), from the same boxes
      for (const [x, z, hx, hz, ry, oy, label, ht] of M.obst) { if (!label || NONE.test(label)) continue; let y = null, bd = 900; for (const s of S) { const d = (s.x - x) ** 2 + (s.z - z) ** 2; if (d < bd && Math.abs(s.y - oy) < 4) { bd = d; y = s.y; } }
        if (!real(label, 2 * hx, ht, 2 * hz, x, y ?? g.hAt(x, z), z, ry)) console.warn('autoroute: nothing built for', label); }
      const O = M.obst.map(([x, z, hx, hz, ry, y, label, ht]) => ({ x, z, hx, hz, ry, y, label, ht }));
      for (const z of ZONES) AUTOROUTE[z]({ h, g, I, zone, O, MAT, BODIES, LAMPS, kit, set, slab, quad, mesh, decal, real, tree, bush, tuft, HH, cityY, groundY, G, colL, colR, row });
      const tick = AUTOROUTE.vie({ h, g, I, zone, O, MAT, BODIES, kit, set, slab, quad, mesh, HH, cityY, groundY, water, TREES, LAMPS, REEDS }); // life and atmosphere, before the merge: what it animates stays out of the kit
      inst(h, h.geo('trunk'), MAT.bark, TREES.bark); for (const k of ['leaf', 'gold', 'ivy', 'ivy2', 'reed']) inst(h, h.geo('canopy'), MAT[k], TREES[k]);
      weld(h, kit); // one mesh per material
      return tick;
    },
  });
})();
