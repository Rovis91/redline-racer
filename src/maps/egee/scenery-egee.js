// Scenery placement for "egee" (Aegean Cliffs, V2 static map): terrain, sea, roadway, the shared materials, then each zone (scenery-egee-<zone>.js). See docs/methods/NEW-MAP.md phase 3 and docs/proposals/aegean-cliffs/AMBIANCE-V2.html.
// The island: the road is a loop run anticlockwise, so the left of the road (side -1) is always the island and the right (side 1) the sea. Chainages (PK) are plan metres from the start line, 0 to 4700:
// Port 0-650, Ascension 650-2000, Village 2000-2800, Balcon 2800-3500, Descente 3500-4700.
// Asset families (P0, P1 of the sheet) and where they live: rock and relief (shapes-egee-relief.js: outcrops, cliffs, far islands; capes, terraces and the quay are terrain), lime-washed buildings (shapes-egee-bati.js: house, warehouse,
// chapel and dome, mill, lighthouse, ruin), harbour and vegetation (shapes-egee-port.js: boat, pontoon, olive tree; cypress and bush are borrowed from perse and plage), walls (boxes laid along the road: `wall`).
(function () {
  const { near, edgePt, terrain, weld, inst } = PLACERS;
  const ZONES = ['port', 'ascension', 'village', 'balcon', 'descente'], LAP = 4700, SEA = 6; // LAP: plan length of the layout, the unit of the chainages. SEA: water level; the quay road is at 8 m
  const ss = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }, win = (p, a, b, r = 60) => ss((p - a) / r) * ss((b - p) / r); // win: 1 between chainages a and b, fading over r metres inside them
  const hsh = (i, j = 0) => { const v = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453; return v - Math.floor(v); }; // fixed pseudo-random: the scenery never calls the shared rnd
  // steps of ht metres with a riser on the last fifth: terraces
  const steps = (v, ht) => { const k = Math.floor(v / ht), f = v / ht - k; return (k + ss((f - 0.8) / 0.2)) * ht; };
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
        const gy = y - f; return gy < SEA ? y - (SEA - Math.min(8, (SEA - gy) * 0.12)) : f; };
      // ground: dry ochre earth; bare rock where it is steep; pale sand under water; lime-jointed paving round the quay and through the village; red tilled earth on the terraces
      const pkOf = (x, z) => near(h, x, z) / N * LAP, paved = p => Math.max(win(p, -1, 560, 50), win(p, 4440, 4701, 50), win(p, 1900, 2840, 60));
      const g = terrain(h, { stepSec: 6, margin: 320, hollow: relief, mat: h.mat('solEgee'), layerSet: [{ tex: ['terreEgee'], weight: (x, z, y, p, d) => { const k = pkOf(x, z); return Math.max(win(k, 3500, 4440, 60) * (inside(x, z) ? 0 : 1), ...GROVES.map(q => win(k, q - 80, q + 80, 40) * (1 - ss((d - 75) / 15)))) * ss((d - 12) / 6); } },
        { tex: ['pavageEgee'], weight: (x, z, y, p, d) => paved(pkOf(x, z)) * (1 - ss((d - 14) / 6)) }, { tex: ['rocheEgee', '#b97049'], slope: [0.1, 0.24] }, { tex: ['pavageEgee'], low: [SEA - 0.6, SEA + 0.5] }] });
      // sea: a deep-blue bed under everything and the water over it, half transparent
      const plane = (m, y) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(12000, 12000), m); p.rotation.x = -Math.PI / 2; p.position.set(0, y, -550); h.scene.add(p); return p; };
      plane(h.mat('seaWide', { rep: [500, 500] }), SEA - 8.3); plane(h.mat('seaTurquoise', { rep: [1200, 1200], transparent: true, opacity: 0.48, depthWrite: false }), SEA);
      // the game draws the roadway and its guardrail at a constant ±W; the physics walls are at ±s.w (M.wide). As on givre: th.wallH = 0 buries the engine's guardrail, the roadway and the parapet are laid again at the real width
      { const rail = h.mat('guardrail', DS, h.TH.intoWall); for (const sd of [-1, 1]) h.guardM(sd, T.t1, N, s => sd * s.w, 1.1, s => sd * s.w, -2, rail); } // a stone parapet with a lime cap; h.guardM: wears down on impacts
      h.ribbon(T.t1, N, s => -s.w, 0, s => s.w, 0, h.mat('roadway', { side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }, ...h.TH.road), 32);

      // MAT: the shared materials of the map, one draw pass each: every real piece of scenery goes into the group `kit`, merged per material at the end. Keys are the zone names of the egee shapes
      const lime = c => h.mat('chauxEgee', {}, c), leaf = c => h.mat('feuillageEgee', {}, c), MAT = { lime: h.mat('facadeEgee'), limeV: h.mat('facadeEgee', {}, '#2f7d6b'), blanc: lime('#fbf6ea'), bleu: lime('#1c6eb0'), corail: lime('#ed7956'), vert: lime('#2f7d6b'),
        pierre: h.mat('pierreEgee'), ocre: h.mat('stone'), roche: h.mat('rocheEgee', {}, '#b97049'), cap: h.mat('rocheEgee', {}, '#c19a6e'), loin: h.mat('rocheEgee', {}, '#86a9c4', 0.3), pavage: h.mat('pavageEgee', DS), bois: h.mat('boisEgee'), boisB: h.mat('boisEgee', {}, '#3f7fb0'),
        tronc: h.mat('boisEgee', {}, '#5a4632'), toile: h.mat('toileEgee', DS), toileR: h.mat('toileEgee', DS, '#ed7956'), chaume: h.mat('thatch'), olive: leaf('#76815a'), cypres: leaf('#3f5a44'), fleur: leaf('#d74e92'), buisson: leaf('#8a8f5e'), feu: h.mat('lampObj', { emis: 1 }) };
      const kit = new THREE.Group(); h.scene.add(kit);
      const smp = pk => S[((Math.round(pk / LAP * N) % N) + N) % N];
      // pos(pk, sd, off): the point `off` metres beyond the road wall at chainage pk, side sd (-1 island, 1 sea): its ground altitude and the rotation that turns a shape's front (+X) to the road
      const pos = (pk, sd, off) => { const s = smp(pk), [x, z] = edgePt(s, sd, s.w + off); return { s, x, z, y: g.hAt(x, z), ry: h.across(s) + (sd > 0 ? Math.PI : 0) }; };
      const grp = (p, { y, dy = 0, ry = 0, s = 1 } = {}) => { const G = new THREE.Group(); G.position.set(p.x, (y ?? p.y) + dy, p.z); G.rotation.y = p.ry + ry; G.scale.setScalar(s); kit.add(G); return G; };
      // set(shape, pk, sd, off, { a, skin, y, dy, ry, s }): a catalogue shape with its origin `off` metres beyond the wall, on the ground unless y is given, its front to the road (ry turns it further), scaled by s, with the shape settings a;
      // skin = MAT with other zones mapped ({ ...MAT, coque: MAT.corail }), or one material for a simple shape. Returns its group
      const set = (shape, pk, sd, off, o = {}) => { const G = grp(pos(pk, sd, off), o); h.pose(shape, o.skin || MAT, G, o.at || [0, 0, 0], ...(o.a || [])); return G; }; // o.at: moved in its own frame
      // box(material, pk, sd, off, w, ht, d, { y, ry }): one box, its near face `off` metres beyond the wall, w across the road and d along it, its base on the ground (or at altitude y)
      const box = (m, pk, sd, off, w, ht, d, o = {}) => { const G = grp(pos(pk, sd, off + w / 2), o); h.pose('boxMesh', MAT[m], G, [0, ht / 2, 0], w, ht, d); return G; };
      // house(pk, sd, gap, w, ht, d, v, skin): a maisonEgee with its front `gap` metres beyond the wall, standing on the highest ground under it (its footing covers the slope)
      const house = (pk, sd, gap, w, ht, d, v = 0, skin = MAT) => { const p = pos(pk, sd, gap + w / 2), q = pos(pk, sd, gap); return set('maisonEgee', pk, sd, gap + w / 2, { a: [w, ht, d, v], skin, y: Math.max(p.y, q.y) + 0.1 }); };
      // wall(material, pk0, pk1, sd, off, ht, { cap, th, up }): a wall along the road from pk0 to pk1, `off` metres beyond the road wall, in 8 m pieces; its top is ht above the ground `up` metres further from the road (a retaining wall
      // holds the ground behind it), its foot 6 m lower; cap = a lime band on top
      const wall = (m, pk0, pk1, sd, off, ht, { cap = 0, th = 0.9, up = 0 } = {}) => { for (let pk = pk0 + 4; pk < pk1; pk += 8) { const p = pos(pk, sd, off), top = pos(pk, sd, off + up).y + ht, G = grp(p, { y: top });
        h.pose('boxMesh', MAT[m], G, [0, -(ht + 6) / 2, 0], th, ht + 6, 8.6 + off * 0.05); if (cap) h.pose('boxMesh', MAT.blanc, G, [0, 0.12, 0], th + 0.3, 0.25, 8.6 + off * 0.05); } };
      // trees and bushes, placed in number at the end (one draw pass per kind). plant(kind, pk, sd, off, scale): one of them, on the ground, unless it would stand in the water or on a cliff
      const PLANTS = { olive: [], cypres: [], buisson: [], fleur: [] };
      const plant = (kind, pk, sd, off, sc = 1, dy = 0) => { const p = pos(pk, sd, off), q = pos(pk, sd, off + 3); if (p.y < SEA + 1 || Math.abs(q.y - p.y) > 2.4) return; PLANTS[kind].push([p.x, p.y - 0.2 + dy, p.z, hsh(pk, off) * 6.28, sc, sc * (0.85 + 0.3 * hsh(off, pk)), sc]); };
      // grove(kind, pk0, pk1, sd, off0, off1, step, scale): a loose grid of plants, one about every `step` metres, each moved and scaled a little
      const grove = (kind, pk0, pk1, sd, off0, off1, step, sc = 1) => { for (let pk = pk0; pk < pk1; pk += step) for (let o = off0; o < off1; o += step) plant(kind, pk + (hsh(pk, o) - 0.5) * step * 0.7, sd, o + (hsh(o, pk) - 0.5) * step * 0.7, sc * (0.8 + 0.4 * hsh(pk + 1, o))); };
      // far islands on the horizon, [bearing °, distance, width, height, depth]: flat blue silhouettes, each paler with distance (fog)
      [[100, 2300, 900, 150, 420], [150, 2600, 600, 110, 300], [215, 2400, 1100, 170, 500], [290, 2500, 700, 120, 380], [10, 2500, 800, 140, 400], [55, 2700, 500, 100, 300]].forEach(([b, r, w, ht, d], i) => { const a = b * Math.PI / 180;
        const m = h.pose('ileEgee', MAT.loin, kit, [60 + Math.sin(a) * r, SEA - 1, -550 - Math.cos(a) * r], w, ht, d, i); m.rotation.y = -a; });
      for (const z of ZONES) EGEE[z]({ h, g, THREE, MAT, kit, S, N, SEA, LAP, smp, pos, grp, set, box, house, wall, plant, grove, hsh });
      weld(h, kit); // one mesh per material
      inst(h, h.geo('olivierEgee'), MAT.olive, PLANTS.olive); inst(h, h.geo('troncEgee'), MAT.tronc, PLANTS.olive); inst(h, h.geo('cypress'), MAT.cypres, PLANTS.cypres);
      inst(h, h.geo('bush'), MAT.buisson, PLANTS.buisson); inst(h, h.geo('bush'), MAT.fleur, PLANTS.fleur);
    },
  });
})();
