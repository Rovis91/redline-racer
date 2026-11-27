// Scenery placement for "egee" (Aegean Cliffs, V2 static map): terrain, sea, roadway, the shared materials, then each zone (scenery-egee-<zone>.js). See docs/methods/NEW-MAP.md phase 3 and docs/proposals/aegean-cliffs/AMBIANCE-V2.html.
// The island: the road is a loop run anticlockwise, so the left of the road (side -1) is always the island and the right (side 1) the sea. Chainages (PK) are plan metres from the start line, 0 to 4700:
// Port 0-650, Ascension 650-2000, Village 2000-2800, Balcon 2800-3500, Descente 3500-4700.
// Asset families (P0, P1 of the sheet) and where they live: rock and relief (shapes-egee-relief.js: outcrops, far islands; cliffs, capes, terraces and the quay are terrain), lime-washed buildings (shapes-egee-bati.js: house, warehouse,
// chapel and dome, mill, lighthouse, ruin), harbour and vegetation (shapes-egee-port.js: boat, pontoon, olive tree; cypress and bush are borrowed from perse and plage), island life (shapes-egee-vie.js: dovecote, well, cistern, goat pen, power pole, scooter, pick-up, fishing gear, café terrace, prickly pear, agave), walls (boxes laid along the road: `wall`, `cross`). What moves and sounds (sails, sea, boats, birds, cloth, clouds, place sounds) is in scenery-egee-life.js.
(function () {
  const { near, edgePt, terrain, weld, inst } = PLACERS;
  const ZONES = ['port', 'ascension', 'village', 'balcon', 'descente'], LAP = 4700, SEA = 6; // LAP: plan length of the layout, the unit of the chainages. SEA: water level; the quay road is at 8 m
  const ss = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }, win = (p, a, b, r = 60) => ss((p - a) / r) * ss((b - p) / r); // win: 1 between chainages a and b, fading over r metres inside them
  const hsh = (i, j = 0) => { const v = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453; return v - Math.floor(v); }; // fixed pseudo-random: the scenery never calls the shared rnd
  // steps of ht metres with a riser on the last fifth: terraces
  const steps = (v, ht) => { const k = Math.floor(v / ht), f = v / ht - k; return (k + ss((f - 0.8) / 0.2)) * ht; };
  const ROCK = '#ae9172'; // the island's rock: a sun-bleached ochre limestone, not red sandstone
  const GROVES = [900, 1360, 1650, 3760, 4050, 4310], CAPES = [[2940, 3060], [3220, 3340], [1420, 1500]]; // olive groves on the island side (terraces instead of cliff); headlands on the sea side

  Object.assign(SCENERY, {
    egee(h) {
      const { THREE, S, N, T } = h, P = h.M.pts, DS = { side: THREE.DoubleSide };
      const inside = (x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > z) !== (P[j][1] > z) && x < (P[j][0] - P[i][0]) * (z - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) c = !c; return c; };
      // relief the road does not make. Sea side: the ground falls from 20 m off the axis (1.5 m per metre); capes hold it out 75 m further, the village plateau 34 m; along the Descente it goes down in 5 m terraces; in the harbour it is a quay, level for 10 m then a wall.
      // Under water the slope flattens into a 40 m shelf (the pale seabed shows through the water: cyan at the foot of the rock, deep blue offshore). Island side: cliffs rise over the Ascension and the Balcon, olive terraces where the groves are
      const relief = (x, z, y) => { const i = near(h, x, z), s = S[i], pk = i / N * LAP, d = Math.hypot(s.x - x, s.z - z), grove = Math.max(...GROVES.map(p => win(pk, p - 70, p + 70, 40)));
        if (inside(x, z)) { const R = 26 * win(pk, 570, 1900, 80) * (1 - 0.55 * grove) + 20 * win(pk, 2990, 3480, 60) + 14 * win(pk, 3500, 4380, 80) * (0.5 + 0.5 * grove);
          const up = R * ss((d - s.w - 4) / 30) * (0.72 + 0.28 * Math.sin(x * 0.045) * Math.cos(z * 0.039)), inland = 34 * ss((d - 70) / 130) * (0.55 + 0.45 * Math.sin(x * 0.011 + 1) * Math.cos(z * 0.013)) * (1 - 0.8 * win(pk, 1950, 2850, 80));
          return -(grove > 0.5 || pk > 3500 ? steps(up, 4) : up) - inland; } // inland: the hills of the island's heart, a backdrop behind the first slope (kept low behind the village: it stays the crest)
        const cape = Math.max(...CAPES.map(([a, b]) => win(pk, a, b, 50))), terr = win(pk, 3520, 4420, 80), quay = pk < 520 ? ss((520 - pk) / 40) : ss((pk - 4520) / 40);
        let f = Math.max(0, d - 20 + 8 * terr - 75 * cape - 34 * win(pk, 1950, 2830, 60)) * (1.5 - 1.1 * terr); if (terr > 0.5) f = steps(f, 5);
        f += quay * (ss((d - s.w - 9) / 3) * (y - SEA + 4) + Math.max(0, d - 40) * 0.3 - f);
        f += Math.max(0, d - 230) * 2; // whatever the slope, the ground is under the deep bed before the terrain ends (its edge would draw a straight line in the water)
        const gy = y - f; return gy < SEA ? y - (SEA - Math.min(9, Math.max((SEA - gy) * 0.12, 9 * ss((d - 110) / 140)))) : f; };
      // ground: dry ochre earth (also the seabed: a mid tone, so the shallows are cyan and not white), and over it, so that no slope shows one tile: dry grass in patches 50 to 80 m across, red tilled earth on the terraces and
      // in fields along the Ascension and the plateau, lime-jointed paving under the harbour town and the chapel square, rock where it is steep and in bare slabs here and there. Each layer has its own tile size (rep)
      let lx, lz, lk; const pkOf = (x, z) => x === lx && z === lz ? lk : (lx = x, lz = z, lk = near(h, x, z) / N * LAP), // the layers ask for the same vertex one after the other
        blot = (x, z, f, ph) => Math.sin(x * f + ph) * Math.sin(z * f * 1.27 + ph * 1.7) + 0.55 * Math.sin(x * f * 2.3 - z * f * 1.9 + ph * 0.6) + 0.3 * Math.sin(x * f * 4.7 + z * f * 5.3 + ph), // fixed blotches, -1.8 to 1.8, about 3 / f metres across
        land = (x, z, y, d) => y > SEA + 1.5 ? 1 - paved(pkOf(x, z), d) : 0, // dry land outside the paved town
        paved = (p, d) => Math.max(Math.max(win(p, -1, 570, 40), win(p, 4370, 4701, 40)) * (1 - ss((d - 122) / 10)), win(p, 2350, 2450, 20) * (1 - ss((d - 44) / 8))); // the whole harbour town; the chapel square
      const g = terrain(h, { stepSec: 6, margin: 320, hollow: relief, mat: h.mat('solEgee'), layerSet: [{ tex: ['herbeEgee'], rep: 0.43, weight: (x, z, y, p, d) => 0.9 * land(x, z, y, d) * ss((blot(x, z, 0.043, 1.3) + 0.05) / 0.5) },
        { tex: ['terreEgee'], rep: 0.7, weight: (x, z, y, p, d) => { const k = pkOf(x, z); return Math.max(win(k, 3500, 4440, 60) * (inside(x, z) ? 0 : 1), ...GROVES.map(q => win(k, q - 80, q + 80, 40) * (1 - ss((d - 75) / 15))),
          0.9 * land(x, z, y, d) * ss((blot(x, z, 0.061, 4.1) - 0.6) / 0.35)) * ss((d - 12) / 6); } },
        { tex: ['pavageEgee'], weight: (x, z, y, p, d) => inside(x, z) || d < 20 ? paved(pkOf(x, z), d) : 0 }, { tex: ['falaiseEgee', '#a08c74'], rep: 0.45, weight: (x, z, y, p, d) => Math.max(ss((p - 0.15 + 0.07 * blot(x, z, 0.09, 2.2)) / 0.16), 0.85 * land(x, z, y, d) * ss((blot(x, z, 0.072, 7.7) - 0.55) / 0.4)) }] });
      // sea: a deep-blue bed under everything and the water over it, half transparent
      const plane = (m, y) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(12000, 12000), m); p.rotation.x = -Math.PI / 2; p.position.set(0, y, -550); h.scene.add(p); return p; };
      plane(h.mat('seaWide', { rep: [500, 500] }), SEA - 8.3); const sea = h.water(SEA, { z: -550, depth: 9, clarity: 3, shallow: 0x35c6c2, deep: 0x0c3f7a, wind: [0.8, 0.5] }); // the engine's water (MAP-ENGINE-OPTIONS.md "Water"): mirror, glitter, depth colour and shore foam
      // the game draws the roadway and its guardrail at a constant ±W; the physics walls are at ±s.w (M.wide). As on givre: th.wallH = 0 buries the engine's guardrail, the roadway and the parapet are laid again at the real width
      { const rail = h.mat('guardrail', DS, h.TH.intoWall); for (const sd of [-1, 1]) h.guardM(sd, T.t1, N, s => sd * s.w, 1.1, s => sd * s.w, -2, rail); } // a stone parapet with a lime cap; h.guardM: wears down on impacts
      h.ribbon(T.t1, N, s => -s.w, 0, s => s.w, 0, h.mat('roadway', { side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }, ...h.TH.road), 32);

      // MAT: the shared materials of the map, one draw pass each: every real piece of scenery goes into the group `kit`, merged per material at the end. Keys are the zone names of the egee shapes
      const lime = c => h.mat('chauxEgee', {}, c), leaf = c => h.mat('feuillageEgee', {}, c), MAT = { lime: h.mat('facadeEgee'), limeV: h.mat('facadeEgee', {}, '#2f7d6b'), blanc: lime('#e4dccb'), bleu: lime('#1c6eb0'), corail: lime('#ed7956'), vert: lime('#2f7d6b'),
        pierre: h.mat('pierreEgee'), ocre: h.mat('stone'), roche: h.mat('rocheEgee', {}, ROCK), cap: h.mat('rocheEgee', {}, '#bfa684'), loin: h.mat('rocheEgee', {}, '#6e6a62', 0.5), pavage: h.mat('pavageEgee', DS), bois: h.mat('boisEgee'), boisB: h.mat('boisEgee', {}, '#3f7fb0'),
        tronc: h.mat('boisEgee', {}, '#5a4632'), toile: h.mat('toileEgee', DS), toileR: h.mat('toileEgee', DS, '#ed7956'), chaume: h.mat('thatch'), olive: leaf('#76815a'), cypres: leaf('#3f5a44'), fleur: leaf('#d74e92'), buisson: leaf('#8a8f5e'), figue: leaf('#5f7f45'), nopal: leaf('#86a56c'), agave: leaf('#7f9a8c'), thym: leaf('#8f84a0'),
        noir: lime('#30333a'), verre: lime('#4a6a80'), filet: lime('#d2a23c'), feu: h.mat('lampObj', { emis: 1 }) };
      const kit = new THREE.Group(); h.scene.add(kit);
      const smp = pk => S[((Math.round(pk / LAP * N) % N) + N) % N];
      // pos(pk, sd, off): the point `off` metres beyond the road wall at chainage pk, side sd (-1 island, 1 sea): its ground altitude and the rotation that turns a shape's front (+X) to the road
      const pos = (pk, sd, off) => { const s = smp(pk), [x, z] = edgePt(s, sd, s.w + off); return { s, x, z, y: g.hAt(x, z), ry: h.across(s) + (sd > 0 ? Math.PI : 0) }; };
      const grp = (p, { y, dy = 0, ry = 0, s = 1 } = {}) => { const G = new THREE.Group(); G.position.set(p.x, (y ?? p.y) + dy, p.z); G.rotation.y = p.ry + ry; G.scale.setScalar(s); kit.add(G); return G; };
      // set(shape, pk, sd, off, { a, skin, y, dy, ry, s }): a catalogue shape with its origin `off` metres beyond the wall, on the ground unless y is given, its front to the road (ry turns it further), scaled by s, with the shape settings a;
      // skin = MAT with other zones mapped ({ ...MAT, coque: MAT.corail }), or one material for a simple shape. Returns its group
      const set = (shape, pk, sd, off, o = {}) => { const G = grp(pos(pk, sd, off), o); G.name = shape + ' PK ' + Math.round(pk % LAP); h.pose(shape, o.skin || MAT, G, o.at || [0, 0, 0], ...(o.a || [])); return G; }; // o.at: moved in its own frame
      // box(material, pk, sd, off, w, ht, d, { y, ry }): one box, its near face `off` metres beyond the wall, w across the road and d along it, its base on the ground (or at altitude y)
      const box = (m, pk, sd, off, w, ht, d, o = {}) => { const G = grp(pos(pk, sd, off + w / 2), o); h.pose('boxMesh', MAT[m], G, [0, ht / 2, 0], w, ht, d); return G; };
      // house(pk, sd, gap, w, ht, d, v, skin): a maisonEgee with its front `gap` metres beyond the wall, standing on the highest ground under it (its footing covers the slope)
      const house = (pk, sd, gap, w, ht, d, v = 0, skin = MAT) => { const p = pos(pk, sd, gap + w / 2), q = pos(pk, sd, gap); return set('maisonEgee', pk, sd, gap + w / 2, { a: [w, ht, d, v], skin, y: Math.max(p.y, q.y) + 0.1 }); };
      // wall(material, pk0, pk1, sd, off, ht, { cap, th, up }): a wall along the road from pk0 to pk1, `off` metres beyond the road wall, in 8 m pieces; its top is ht above the ground `up` metres further from the road (a retaining wall
      // holds the ground behind it), its foot 6 m lower; cap = a lime band on top
      const wall = (m, pk0, pk1, sd, off, ht, { cap = 0, th = 0.9, up = 0 } = {}) => { for (let pk = pk0 + 4; pk < pk1; pk += 8) { const p = pos(pk, sd, off), top = pos(pk, sd, off + up).y + ht, G = grp(p, { y: top });
        h.pose('boxMesh', MAT[m], G, [0, -(ht + 6) / 2, 0], th, ht + 6, 8.6 + off * 0.05); if (cap) h.pose('boxMesh', MAT.blanc, G, [0, 0.12, 0], th + 0.3, 0.25, 8.6 + off * 0.05); } };
      // trees and bushes, placed in number at the end (one draw pass per kind). plant(kind, pk, sd, off, scale): one of them, on the ground, unless it would stand in the water, on a cliff or within reach of any stretch of road
      const PLANTS = { olive: [], figue: [], cypres: [], buisson: [], fleur: [], thym: [], nopal: [], agave: [], caillou: [] }; // figue: a fig tree, the olive shape in a darker green; thym: a low mauve cushion; caillou: a stone of the scree
      const plant = (kind, pk, sd, off, sc = 1, dy = 0) => { const p = pos(pk, sd, off), q = pos(pk, sd, off + 3); if (p.y < SEA + 1 || Math.abs(q.y - p.y) > 2.4 || g.dAt(p.x, p.z) < p.s.w + 2.5) return; PLANTS[kind].push([p.x, p.y - 0.2 + dy, p.z, hsh(pk, off) * 6.28, sc, sc * (0.85 + 0.3 * hsh(off, pk)), sc]); };
      // grove(kind, pk0, pk1, sd, off0, off1, step, scale): a loose grid of plants, one about every `step` metres, each moved and scaled a little
      const grove = (kind, pk0, pk1, sd, off0, off1, step, sc = 1) => { for (let pk = pk0; pk < pk1; pk += step) for (let o = off0; o < off1; o += step) plant(kind, pk + (hsh(pk, o) - 0.5) * step * 0.7, sd, o + (hsh(o, pk) - 0.5) * step * 0.7, sc * (0.8 + 0.4 * hsh(pk + 1, o))); };
      // mill(pk, sd, off, s, ry): a windmill, its wheel turned by ry from the road side (white round tower, thatch cap, 12 spars)
      const MILLS = [], mill = (pk, sd, off, s = 1, ry = 0) => { const o = { s }; set('tourEgee', pk, sd, off, { ...o, a: [4, 3.3, 10, 10, 6], skin: MAT.blanc }); set('coneEgee', pk, sd, off, { ...o, a: [3.9, 3.6], skin: MAT.chaume, dy: 10 * s }); MILLS.push({ p: pos(pk, sd, off), s, ry }); }; // the wheel turns: it is built by the life file, outside the weld
      // boat(pk, off, s, ry, c, o): a fishing boat on the water, off metres beyond the sea-side wall, scale s, turned by ry from the quay frame (o.abs: ry is a world heading), hull colour c (a MAT key). The boats rock: one moving batch, built by the life file
      const BOATS = [], boat = (pk, off, s, ry, c, o = {}) => { const p = pos(pk, 1, off); BOATS.push({ x: p.x, z: p.z, y: SEA - 0.15 * s, ry: o.abs ? ry : p.ry + ry, s, c, pont: o.pont || 0 }); };
      // small things of the country road. shrine(pk, sd): a roadside shrine, a lime box under a blue cap; hut(pk, sd, off): a dry-stone field hut with a lime roof
      const shrine = (pk, sd) => { box('blanc', pk, sd, 2.4, 0.9, 1.5, 0.9); box('bleu', pk, sd, 2.3, 1.1, 0.25, 1.1, { dy: 1.5 }); };
      const hut = (pk, sd, off) => { box('pierre', pk, sd, off, 5, 4.2, 6, { dy: -1.5 }); box('blanc', pk, sd, off - 0.2, 5.4, 0.3, 6.4, { dy: 2.7 }); };
      // the power network. wire(a, b): one wire between two points; line(a, b): the two wires of a span between two pole feet (crossbar and under it); poles(pk0, pk1, sd, off, step): a line of poles and its wires, returned as the list of its pole feet.
      // The spans are straight: in a bend the chord cuts the curve, so the step stays short
      const wire = (a, b, name = 'wire') => { const G = new THREE.Group(); G.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2); kit.add(G); G.lookAt(b.x, b.y, b.z); G.name = name; h.pose('boxMesh', MAT.tronc, G, [0, 0, 0], 0.09, 0.09, Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z)); };
      const up = (p, dy) => ({ x: p.x, y: p.y + dy, z: p.z }), line = (a, b, name) => { for (const dy of [8.75, 8.2]) wire(up(a, dy), up(b, dy), name); };
      const poles = (pk0, pk1, sd, off, step = 26) => { const L = []; for (let pk = pk0, k = 0; pk <= pk1; pk += step, k++) { const b = Object.assign(pos(pk, sd, off), { pk, sd }); set('poteauEgee', pk, sd, off, { a: [k % 5 === 2 ? 1 : 0] });
        if (k) line(L[k - 1], b, 'wire PK ' + Math.round(pk % LAP)); L.push(b); } return L; };
      // feed(L, pk, sd, off, ht): the service wire of a building, from the nearest pole of the line L to the point ht above the ground `off` metres beyond the wall. Across the road, the line first sends a span over to a pole with a transformer
      // on the building's side (never a low wire over the lane)
      const feed = (L, pk, sd, off, ht) => { const t = pos(pk, sd, off), nearTo = q => L.reduce((a, p) => Math.hypot(p.x - q.x, p.z - q.z) < Math.hypot(a.x - q.x, a.z - q.z) ? p : a); let p = nearTo(t);
        if (p.sd !== sd) { const b = pos(pk - 9, sd, 4.6); set('poteauEgee', pk - 9, sd, 4.6, { a: [1] }); line(nearTo(b), b, 'wire span PK ' + pk); p = b; } wire(up(p, 8.2), up(t, ht), 'wire feed PK ' + pk); };
      // path(pk0, off0, pk1, off1, sd, n): a lime-washed stair or mule path from one point to the other, n slabs, each on its own ground and 2.7 m deep in it
      const path = (pk0, off0, pk1, off1, sd, n, w = 2.4) => { for (let i = 0; i <= n; i++) box('blanc', pk0 + (pk1 - pk0) * i / n, sd, off0 + (off1 - off0) * i / n, w, 3, w, { dy: -2.7 }); };
      // cross(material, pk, sd, off0, off1, ht): a field wall that leaves the road at right angles, from off0 to off1 metres beyond the road wall, in 4 m pieces that follow the ground
      const cross = (m, pk, sd, off0, off1, ht = 1.1) => { for (let o = off0; o < off1; o += 4) box(m, pk, sd, o, 4.3, ht + 2.5, 0.8, { dy: -2.5 }); };
      // aire(pk, sd, off): a threshing floor, a paved disc 14 m across inside a low dry-stone rim
      const aire = (pk, sd, off) => { set('ringsEgee', pk, sd, off, { a: [14, [[-3, 7.6, 7.6], [0.55, 7.6, 7.6], [0.55, 6.9, 6.9]]], skin: MAT.pierre }); set('tourEgee', pk, sd, off, { a: [6.95, 6.95, 0.3, 14, 3], skin: MAT.pavage }); };
      // pen(pk, sd, off, n): a goat pen, its near wall `off` metres beyond the road wall, and n goats inside
      const pen = (pk, sd, off, n = 4) => { set('enclosEgee', pk, sd, off + 5); for (let i = 0; i < n; i++) set('chevreEgee', pk - 3.5 + hsh(pk, i) * 7, sd, off + 1.5 + hsh(i, pk) * 6, { s: 1.3, ry: hsh(i, 9) * 6.28, skin: { ...MAT, poil: [MAT.blanc, MAT.tronc, MAT.ocre][i % 3] } }); };
      // rocky islets at mid distance, [PK, metres beyond the wall on the sea side, width, height, depth]: the warm rock of the capes, low and wide, a smaller rock beside each; the largest carries a chapel
      const ISLETS = [[120, 330, 90, 16, 60], [300, 430, 60, 11, 45], [1250, 300, 110, 22, 70], [1700, 380, 70, 14, 50], [3050, 420, 130, 26, 80], [3350, 330, 80, 15, 55], [3800, 380, 100, 20, 60], [4300, 340, 70, 13, 50]]; ISLETS.forEach(([pk, off, w, ht, d], i) => {
        set('rocherEgee', pk, 1, off, { a: [w, ht, d, i + 80], skin: MAT.cap, y: SEA - 0.5 }); set('rocherEgee', pk + 30, 1, off + 25 + w * 0.4, { a: [w * 0.4, ht * 0.5, d * 0.45, i + 90], skin: MAT.roche, y: SEA - 0.5 }); });
      set('chapelleEgee', 1250, 1, 300, { s: 0.8, y: SEA + 15 });
      // fishing boats at anchor in the bay, [PK, metres beyond the wall, scale]: all head to the same wind; the further, the bigger. None where the ground is not well under water
      [[40, 75, 1.4], [200, 100, 1.6], [470, 60, 1.4], [560, 90, 1.6], [640, 130, 1.8], [4480, 70, 1.5], [4380, 110, 1.8], [900, 160, 2], [1200, 190, 2.2], [1500, 170, 2], [1800, 200, 2.2], [3000, 260, 2.6], [3300, 230, 2.6], [3600, 170, 2], [3850, 190, 2.2], [4100, 160, 2]]
        .forEach(([pk, off, s], i) => { if (pos(pk, 1, off).y < SEA - 1.5) boat(pk, off, s, 0.6 + hsh(i, 2) * 0.25, ['corail', 'bleu', 'blanc'][i % 3], { abs: 1 }); });
      // far islands on the horizon, [bearing °, distance, width, height, depth]: long dark backs of dry land, low on the water, greyed by distance (fog). Not pale peaks: they read as icebergs
      [[100, 1700, 1300, 80, 420], [150, 2100, 900, 60, 300], [215, 1900, 1500, 95, 500], [290, 2000, 1000, 70, 380], [10, 1900, 1100, 75, 400], [55, 2200, 800, 55, 300]].forEach(([b, r, w, ht, d], i) => { const a = b * Math.PI / 180;
        const m = h.pose('ileEgee', MAT.loin, kit, [60 + Math.sin(a) * r, SEA - 1, -550 - Math.cos(a) * r], w, ht, d, i); m.rotation.y = -a; });
      const ctx = { h, g, THREE, MAT, kit, S, N, SEA, LAP, smp, pos, grp, set, box, house, wall, plant, grove, mill, shrine, hut, path, cross, aire, pen, hsh, boat, wire, up, sea, MILLS, BOATS, ISLETS };
      for (const z of ZONES) EGEE[z](ctx);
      const tick = EGEE.life(ctx); // what moves and sounds (scenery-egee-life.js): its fixed pieces (poles, posts) go into kit before the weld, the rest lives outside it
      // the island's power network: it leaves the substation at the end of the harbour town (PK 556, island side) and every line ends at a building it feeds. No pole without a wire.
      // Town line: back along the pavement of the front (a service wire to each house of the front), it stops at the first house of the front: the Descente above it keeps its sea view and its houses clear.
      // Climb line: from the substation across the road, up the Ascension to the last farm of the low slope (PK 1600), where it ends: nothing above it, the upper slope keeps a clear sky.
      // Hill line: the only one on the hilltop. It reaches the plateau from the back, from a second substation deep inland, and runs 62 m behind the island-side houses, outside the views of the chapels, the mills and the sea
      // (round 5: the poles of the road side were in front of every landmark). Only the island-side buildings are fed.
      { const town = poles(4478, LAP + 556, -1, 5.6, 26), post = town[town.length - 1], climb = poles(584, 1620, 1, 4.6, 28), back = poles(2000, 2740, -1, 62, 44),
          lead = [150, 100].map(o => { set('poteauEgee', 1990, -1, o); return Object.assign(pos(1990, -1, o), { pk: 1990, sd: -1 }); });
        set('posteEgee', 556, -1, 13); line(post, pos(556, -1, 10), 'wire poste'); line(post, climb[0], 'wire span poste');
        set('posteEgee', 1990, -1, 200); line(lead[0], pos(1990, -1, 197), 'wire poste hill'); line(lead[0], lead[1], 'wire hill'); line(lead[1], back[0], 'wire hill');
        for (const p of town) if (p.pk > 4476 && p.pk < LAP + 345) wire(up(p, 8.2), up(pos(p.pk + 7, -1, 7.7), 6), 'wire feed PK ' + Math.round(p.pk % LAP));
        feed(climb, 1085, -1, 12.4, 4.2); feed(climb, 1310, -1, 13.2, 4.2); feed(climb, 1600, -1, 14.4, 4.2);
        for (const pk of [2190, 2240, 2290]) feed(back, pk, -1, 22, 5); feed(back, 2400, -1, 22.5, 9); feed(back, 2470, -1, 9.4, 5); feed(back, 2600, -1, 34.4, 4); }
      // nothing over the road: a piece whose footprint (its box in its own frame, read every 4 m) comes within 1.5 m of the drivable band at road height is taken out, whatever placed it.
      // A long piece set beside one stretch of road can reach another one further along the lap (bends, the stacked stretches of the Ascension)
      { const B = new THREE.Box3(), b = new THREE.Box3(), v = new THREE.Vector3(); const out = []; for (const G of [...kit.children]) { if (!G.isGroup) continue; G.updateMatrixWorld(true); B.makeEmpty();
          for (const m of G.children) { m.geometry.computeBoundingBox(); B.union(b.copy(m.geometry.boundingBox).translate(m.position)); }
          const nx = Math.max(1, Math.ceil((B.max.x - B.min.x) / 4)), nz = Math.max(1, Math.ceil((B.max.z - B.min.z) / 4)); let hit = false;
          for (let i = 0; i <= nx && !hit; i++) for (let j = 0; j <= nz && !hit; j++) { v.set(B.min.x + (B.max.x - B.min.x) * i / nx, 0, B.min.z + (B.max.z - B.min.z) * j / nz).applyMatrix4(G.matrixWorld); const s = S[near(h, v.x, v.z)];
            hit = Math.hypot(s.x - v.x, s.z - v.z) < s.w + 1.5 && v.y + B.max.y * G.scale.y > s.y - 1 && v.y + B.min.y * G.scale.y < s.y + (G.name.startsWith('wire') ? 6 : 16); } // a wire may cross 6 m or more above the lane
          if (hit) { kit.remove(G); out.push(G.name || 'box'); } } if (out.length) console.info('egee: ' + out.length + ' pieces taken out, too close to the road: ' + out.join(', ')); }
      weld(h, kit); // one mesh per material
      inst(h, h.geo('olivierEgee'), MAT.olive, PLANTS.olive); inst(h, h.geo('troncEgee'), MAT.tronc, PLANTS.olive); inst(h, h.geo('cypress'), MAT.cypres, PLANTS.cypres);
      inst(h, h.geo('bush'), MAT.buisson, PLANTS.buisson); inst(h, h.geo('bush'), MAT.fleur, PLANTS.fleur); inst(h, h.geo('bush'), MAT.thym, PLANTS.thym);
      inst(h, h.geo('olivierEgee'), MAT.figue, PLANTS.figue); inst(h, h.geo('troncEgee'), MAT.tronc, PLANTS.figue); inst(h, h.geo('nopalEgee'), MAT.nopal, PLANTS.nopal); inst(h, h.geo('agaveEgee'), MAT.agave, PLANTS.agave); inst(h, h.geo('caillouEgee'), MAT.roche, PLANTS.caillou);
      return tick;
    },
  });
})();
