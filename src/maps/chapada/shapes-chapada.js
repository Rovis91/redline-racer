// Shapes specific to "chapada" (Manuscript 512, the lost city): complements the catalogue in shapes.js. See docs/methods/SCENERY.md.
// Unless stated, X = across the road (or moving away from it), Z = along the road, origin at the foot of the item.
(function () {
  const pair = f => [-1, 1].map(f);
  Object.assign(SHAPES, {
    fernArbo: (h = 1) => [['stipe', 0.35 * h, 5 * h, 0.35 * h, 0, 2.5 * h, 0], ...Array.from({ length: 5 }, (_, k) => { const a = k / 5 * 6.2832;
      return ['fernFrond', 3.4 * h, 0.08, 0.9 * h, Math.cos(a) * 1.5 * h, 4.9 * h, Math.sin(a) * 1.5 * h, [0, -a, -0.35 - (k % 2) * 0.25]]; })],
    summit: () => { const p = new THREE.IcosahedronGeometry(3.4, 0).attributes.position, vu = new Map(), pos = [], uv = [], idx = [];
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = [x, y, z].map(v => v.toFixed(3)).join(); let j = vu.get(k);
        if (j === undefined) { vu.set(k, j = pos.length / 3); pos.push(x, y, z); uv.push(Math.atan2(z, x) / 6.2832 + 0.5, y / 6.8 + 0.5); } idx.push(j); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g; },
    clump: () => { const g = new THREE.ConeGeometry(0.55, 1, 5, 1, true); g.translate(0, 0.5, 0); return g; }, // no base: never seen
    summitFar: () => { const g = new THREE.OctahedronGeometry(3.6, 0), p = g.attributes.position, vu = new Map(), pos = [], uv = [], idx = [];
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = [x, y, z].map(v => v.toFixed(3)).join(); let j = vu.get(k);
        if (j === undefined) { vu.set(k, j = pos.length / 3); pos.push(x, y, z); uv.push(Math.atan2(z, x) / 6.2832 + 0.5, y / 7.2 + 0.5); } idx.push(j); }
      const G = new THREE.BufferGeometry(); G.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); G.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); G.setIndex(idx); G.computeVertexNormals(); return G; },
    boulder: () => { const g = new THREE.BoxGeometry(2, 1.6, 2, 1, 1, 1), p = g.attributes.position; // a box with randomly pulled corners (fixed), the top narrower: an angular block (the dodecahedra read as hexagons)
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = Math.sin(x * 12.9 + y * 78.2 + z * 37.7) * 43758.5, u = k - Math.floor(k);
        p.setXYZ(i, x * (y > 0 ? 0.7 + 0.3 * u : 1 - 0.2 * u), y * (0.8 + 0.4 * u), z * (y > 0 ? 0.65 + 0.35 * (1 - u) : 1)); }
      g.computeVertexNormals(); return g; },
    fernLow: () => Array.from({ length: 4 }, (_, k) => { const a = k / 4 * 6.2832 + 0.4; return ['fernFrond', 1.8, 0.05, 0.45, Math.cos(a) * 0.8, 0.45, Math.sin(a) * 0.8, [0, -a, 0.55]]; }),
    trunkLayer: (l = 10) => [['wood', l, 0.8, 0.8, 0, 0.4, 0, [0, 0, 0.04]], ['wood', 0.3, 1.6, 0.3, l * 0.2, 1, 0.2, [0.3, 0, -0.4]], ['wood', 0.25, 1.2, 0.25, -l * 0.25, 0.9, -0.2, [-0.4, 0, 0.3]]],
    // juçara palm (Euterpe edulis): slender 10 m trunk, crown of curved fronds rising then falling (h = size)
    jucara: (h = 1) => [['stipe', 0.3 * h, 10 * h, 0.3 * h, 0, 5 * h, 0], ...Array.from({ length: 7 }, (_, k) => { const a = k / 7 * 6.2832, c = Math.cos(a), s = Math.sin(a);
      return [['frond', 3 * h, 0.06, 0.9 * h, c * 1.4 * h, 10.4 * h, s * 1.4 * h, [0, -a, 0.4]], ['frond', 2.6 * h, 0.06, 0.8 * h, c * 3.7 * h, 10.2 * h, s * 3.7 * h, [0, -a, -0.75]]]; }).flat()],
    // clump of large leaves (banana, heliconia): five upright leaves opening out; flower = red spike in the middle (a shape readable at 200 km/h, not a detail)
    bigLeaf: (h = 1, flower = 0) => [...Array.from({ length: 5 }, (_, k) => { const a = k / 5 * 6.2832 + 0.3; return ['leafKey', 2.8 * h, 0.05, 1 * h, Math.cos(a) * 0.9 * h, 1.35 * h, Math.sin(a) * 0.9 * h, [0, -a, 0.95]]; }),
      ...(flower ? [['flower', 0.3 * h, 1.1 * h, 0.3 * h, 0, 2.3 * h, 0, [0, 0.6, 0.15]], ['flower', 0.5 * h, 0.25 * h, 0.2 * h, 0.15 * h, 2.6 * h, 0, [0, 0.6, 0.5]]] : [])],
    // liana curtain: strands hanging from a branch, of uneven lengths (origin at the top; l = length of the longest)
    vines: (l = 6) => [['vine', 5, 0.14, 0.14, 0, 0, 0, [0, 0, 0.06]], ...[[-2.1, 1], [-1.2, 0.55], [-0.3, 0.8], [0.7, 0.45], [1.5, 0.95], [2.2, 0.6]].map(([x, f]) => ['vine', 0.12, l * f, 0.12, x, -l * f / 2, 0, [0, 0, x * 0.02]])],
    // expedition torch: a stake, a cup, the flame (lit)
    torch: () => [['wood', 0.14, 2.3, 0.14, 0, 1.15, 0], ['iron', 0.5, 0.22, 0.5, 0, 2.35, 0], ['flame', 0.34, 0.5, 0.34, 0, 2.7, 0], ['flame', 0.18, 0.4, 0.18, 0.03, 3.05, 0, [0, 0.7, 0]]],
    // the marsh: stilt roots of a tree standing with its feet in the water (eight arches around the trunk); giant water lily (Victoria regia), a flat disc on the water
    rootsStilts: (k = 1) => Array.from({ length: 8 }, (_, i) => { const a = i / 8 * 6.2832 + 0.3, c = Math.cos(a), s = Math.sin(a); return ['wood', 3.6 * k, 0.32 * k, 0.32 * k, c * 1.5 * k, 1.5 * k, s * 1.5 * k, [0, -a, -0.8]]; }),
    waterLily: () => new THREE.CylinderGeometry(1, 1, 0.06, 9),
    // ---------- the expedition camp (O-10) ----------
    // bamboo start gantry (th.startLine[4], same zones as "startLine" in shapes.js: ground, checker, concrete, steel, name, box, light0-2, lamp); the line is the width of the camp (2 W half-width)
    startJungle: W => { const xp = 2 * W + 1.4, L = 2 * xp + 1.4;
      return [['ground', 2 * xp - 2.4, 0.06, 4, 0, 0, 0],
        ...pair(sd => [['concretePart', 2.2, 0.8, 2.6, sd * xp, 0.4, 0], ...pair(b => ['steelMat', 0.34, 9.6, 0.34, sd * xp, 4.8, b * 0.7, [b * 0.05, 0, 0]]), ['steelMat', 0.3, 3.6, 0.3, sd * (xp - 1.2), 6.3, 0, [0, 0, sd * 0.75]]]).flat(),
        ...pair(b => [['steelMat', L, 0.3, 0.3, 0, 7.5, b * 0.7], ['steelMat', L, 0.26, 0.26, 0, 9.3, b * 0.6]]).flat(),
        ['label', 2 * W + 3, 1.5, 0.3, 0, 8.4, 0], ['checker', L - 3, 0.4, 0.12, 0, 7.05, 0],
        ...pair(sz => [['casing', 5.6, 1.2, 0.2, 0, 6.2, sz * 0.2], ...[-1, 0, 1].map(i => ['fire' + (i + 1), 0.9, 0.9, 0.1, i * 1.7, 6.2, sz * 0.35])]).flat(),
        ...pair(sx => ['lampObj', 0.45, 0.55, 0.45, sx * (xp - 2.6), 6.6, 0])]; },
    tent: () => [...pair(sd => ['cloth', 3.3, 0.08, 6, sd * 1.08, 1.25, 0, [0, 0, -sd * 0.86]]), ['cloth', 2.5, 1.5, 0.08, 0, 0.75, -3], ...pair(b => ['wood', 0.12, 2.7, 0.12, 0, 1.35, b * 3]), ['wood', 0.1, 0.1, 6.4, 0, 2.6, 0]],
    bodies: () => [['wood', 1.3, 0.8, 0.9, 0, 0.4, 0], ['wood', 1.1, 0.7, 0.8, 1.1, 0.35, 0.5, [0, 0.4, 0]], ['wood', 1, 0.7, 0.8, 0.2, 1.15, 0.1, [0, 0.2, 0]], ['cloth', 1.6, 0.5, 1, -1.5, 0.25, 0.2, [0, -0.3, 0]]],
    tableMaps: () => [['wood', 2, 0.08, 1.2, 0, 0.9, 0], ...pair(a => pair(b => ['wood', 0.08, 0.9, 0.08, a * 0.9, 0.45, b * 0.5])).flat(), ['paper', 1.3, 0.03, 0.9, 0.1, 0.96, 0, [0, 0.2, 0]], ['lampObj', 0.22, 0.34, 0.22, -0.7, 1.12, 0.3]],
    fourFour: () => [['carBody', 4.3, 0.9, 1.9, 0, 1.05, 0], ['carBody', 1.7, 0.85, 1.8, 0.45, 1.95, 0], ['cloth', 2.1, 1.05, 1.86, -1.05, 2.05, 0], ['pane', 0.08, 0.6, 1.6, 1.32, 1.98, 0],
      ...pair(a => pair(b => ['tire', 0.95, 0.95, 0.36, a * 1.4, 0.48, b * 0.95])).flat(), ...pair(b => ['lampObj', 0.1, 0.24, 0.3, 2.17, 1.15, b * 0.65]), ['tire', 0.3, 0.9, 0.9, -2.3, 1.3, 0]],
    matRadio: () => [['iron', 0.16, 12, 0.16, 0, 6, 0], ...[4, 7.5, 11].map(y => ['lampObj', 0.36, 0.46, 0.36, 0.3, y, 0]), ...pair(sd => ['iron', 0.05, 13.5, 0.05, sd * 3, 5.6, 0, [0, 0, sd * 0.47]])],
    // expedition bamboo scaffold (l = length, n = levels of 2.4 m)
    scaffold: (l = 6, n = 2) => [...Array.from({ length: Math.round(l / 2) + 1 }, (_, i) => pair(b => ['bamboo', 0.14, n * 2.4 + 0.6, 0.14, -l / 2 + i * 2, n * 1.2 + 0.3, b * 0.7])).flat(),
      ...Array.from({ length: n }, (_, k) => [['board', l, 0.08, 1.3, 0, (k + 1) * 2.4, 0], ['bamboo', l + 0.6, 0.1, 0.1, 0, (k + 1) * 2.4 + 1, 0.7], ['bamboo', 3.4, 0.1, 0.1, (k % 2 ? 1 : -1) * l / 4, k * 2.4 + 1.2, -0.7, [0, 0, (k % 2 ? 1 : -1) * 0.78]]]).flat()],
    boat: () => [['wood', 4.6, 0.45, 1.3, 0, 0.3, 0], ...pair(b => ['wood', 4.8, 0.4, 0.1, 0, 0.65, b * 0.66]), ['wood', 0.2, 0.3, 1.2, 0.8, 0.6, 0], ['wood', 3.2, 0.08, 0.14, -0.4, 0.9, 0.2, [0, 0.3, 0.1]]],
    // ---------- the kapok (sumaúma) of the chicane (O-11): huge trunk, fin-like buttresses, thick branches; the crown is placed by the scenery ----------
    kapok: (k = 1) => [['wood', 5 * k, 15 * k, 5 * k, 0, 7.5 * k, 0], ['wood', 4.2 * k, 14 * k, 4.2 * k, 0, 21 * k, 0, [0, 0.5, 0]], ['wood', 3.2 * k, 9 * k, 3.2 * k, 0, 32 * k, 0, [0, 0.2, 0]],
      ...Array.from({ length: 7 }, (_, i) => { const a = i / 7 * 6.2832 + 0.2, c = Math.cos(a), s = Math.sin(a);
        return [['wood', 3 * k, 10 * k, 0.6 * k, c * 3.6 * k, 5 * k, s * 3.6 * k, [0, -a, 0]], ['wood', 3 * k, 5 * k, 0.55 * k, c * 6.3 * k, 2.5 * k, s * 6.3 * k, [0, -a, 0]], ['wood', 3 * k, 2 * k, 0.5 * k, c * 9 * k, 1 * k, s * 9 * k, [0, -a, 0]]]; }).flat(),
      ...Array.from({ length: 5 }, (_, i) => { const a = i / 5 * 6.2832; return ['wood', 12 * k, 1.5 * k, 1.5 * k, Math.cos(a) * 5.5 * k, 38 * k, Math.sin(a) * 5.5 * k, [0, -a, 0.45]]; }),
      ['board', 5, 0.2, 5, 4.4 * k, 17, 0], ...pair(b => ['racingLine', 0.1, 17, 0.1, 6.6 * k, 8.5, b * 0.4]), ...Array.from({ length: 16 }, (_, i) => ['racingLine', 0.08, 0.08, 0.8, 6.6 * k, 1 + i, 0])],
    // ---------- the city stones (D-10): round arches, obelisks, plinths, statues; facing +Z ----------
    // round arch: n voussoirs on a half-circle of radius R (thickness ep, depth prof), springing at height y0
    arc: (R, ep = 1.2, profData = 3, n = 9, y0 = 0, x0 = 0, z0 = 0, zone = 'clair') => Array.from({ length: n }, (_, k) => { const a = Math.PI * (k + 0.5) / n;
      return [zone, Math.PI * (R + ep) / n * 1.04, ep, profData, x0 + Math.cos(a) * (R + ep / 2), y0 + Math.sin(a) * (R + ep / 2), z0, [0, 0, a - Math.PI / 2]]; }),
    obelisk: (H = 9) => [['stone', 1.8, 0.8, 1.8, 0, 0.4, 0], ['stone', 1.15, H * 0.55, 1.15, 0, 0.8 + H * 0.275, 0], ['stone', 0.9, H * 0.35, 0.9, 0, 0.8 + H * 0.725, 0], ['stone', 0.55, H * 0.1, 0.55, 0, 0.8 + H * 0.95, 0, [0, 0.785, 0]]],
    statueStanding: (t = 1) => [['stone', 1.3 * t, 0.5 * t, 1.3 * t, 0, 0.25 * t, 0], ['stone', 0.9 * t, 1.1 * t, 0.6 * t, 0, 1.05 * t, 0], ['stone', 1.15 * t, 1 * t, 0.7 * t, 0, 2.1 * t, 0], ['stone', 0.7 * t, 0.7 * t, 0.7 * t, 0, 2.95 * t, 0],
      ['stone', 0.95 * t, 0.25 * t, 0.95 * t, 0, 3.42 * t, 0], ...pair(sd => ['stone', 0.26 * t, 0.9 * t, 0.4 * t, sd * 0.7 * t, 2.1 * t, 0.1 * t])],
    // the colossal head (5 m): eyes inlaid with gold
    headColossal: () => [['stone', 5, 5.2, 4.6, 0, 2.6, 0], ['stone', 5.6, 1.3, 5.2, 0, 5.75, 0], ['stone', 5.3, 0.7, 0.8, 0, 3.95, 2.3], ['stone', 1, 1.9, 0.9, 0, 2.85, 2.55], ['shadows', 2.3, 0.45, 0.4, 0, 1.3, 2.25],
      ...pair(sd => [['gold', 0.95, 0.5, 0.2, sd * 1.25, 3.3, 2.32], ['stone', 0.6, 2, 1.1, sd * 2.8, 2.8, 0], ['shadows', 1.3, 0.9, 0.3, sd * 1.25, 3.3, 2.2]]).flat()],
    // the great seated idol (7 m), a gold disc between its hands
    idolSeated: () => [['stone', 6.4, 1.2, 6.4, 0, 0.6, 0], ['stone', 5.6, 1.5, 3.8, 0, 1.95, 0.8], ['stone', 3.7, 3.1, 2.7, 0, 4.2, -0.3], ['stone', 2.5, 2.2, 2.3, 0, 6.85, -0.2], ['stone', 3, 0.8, 2.8, 0, 8.3, -0.2],
      ...pair(sd => [['stone', 0.9, 2.5, 1.1, sd * 2.25, 3.9, 0.2], ['gold', 0.42, 0.26, 0.1, sd * 0.58, 7.05, 0.96], ['stone', 0.5, 0.9, 0.6, sd * 1.45, 6.8, -0.2]]).flat(), ['gold', 1.3, 1.3, 0.3, 0, 3.5, 1.35], ['shadows', 1.2, 0.3, 0.2, 0, 6.2, 0.95]],
    // the statue of the square, on its black plinth: standing, a gold disc held against the chest, gilded laurel (no outstretched arm)
    statueNorth: () => [['plinth', 3.4, 4, 3.4, 0, 2, 0], ['plinth', 4, 0.45, 4, 0, 4.2, 0], ['plinth', 4.4, 0.5, 4.4, 0, 0.25, 0], ['stone', 1.1, 1.8, 0.8, 0, 5.3, 0], ['stone', 1.35, 1.5, 0.9, 0, 6.95, 0], ['stone', 0.8, 0.8, 0.8, 0, 8.1, 0],
      ['gold', 0.95, 0.16, 0.95, 0, 8.46, 0], ['stone', 1.75, 0.36, 0.5, 0, 6.9, 0.45], ['gold', 0.85, 0.85, 0.14, 0, 6.95, 0.75], ...pair(sd => ['stone', 0.3, 0.9, 0.36, sd * 0.82, 7.1, 0.15])],
    // the stepped temple at the back of the square (in place of the antique colonnade): five tiers, an axial stair, the sanctuary at the top, its door, its crest; facing +Z
    templeSteps: () => [...[[36, 0], [29, 1], [22, 2], [15, 3], [9.5, 4]].map(([w, k]) => ['stone', w, 3.2, w, 0, 1.6 + k * 3.2, 0]), ...[[36, 0], [29, 1], [22, 2], [15, 3]].map(([w, k]) => ['clair', w + 0.6, 0.4, w + 0.6, 0, 3.2 + k * 3.2, 0]),
      ['clair', 5.4, 0.7, 23, 0, 7.9, 9.6, [0.76, 0, 0]], ...pair(sd => ['shadows', 0.8, 1.4, 23, sd * 3.1, 8.3, 9.6, [0.76, 0, 0]]),
      ['stone', 7.4, 4.6, 6.4, 0, 18.3, -0.6], ['blackM', 2.4, 3.2, 0.3, 0, 17.6, 2.65], ['clair', 8.2, 0.6, 7.2, 0, 20.9, -0.6], ['stone', 5.6, 3.4, 1.6, 0, 22.9, -0.6], ['gold', 1.5, 1.5, 0.2, 0, 22.9, 0.3],
      ...pair(sd => [['relief', 1.6, 2.6, 0.3, sd * 2.6, 17.4, 2.65], ['shadows', 3, 2.4, 3, sd * 5.4, 1.2, 19.2]]).flat()],
    // a campfire: a ring of stones, logs, flame
    fireCamp: () => [...Array.from({ length: 7 }, (_, i) => ['stone', 0.45, 0.3, 0.45, Math.cos(i * 0.9) * 0.9, 0.15, Math.sin(i * 0.9) * 0.9, [0, i, 0]]), ['wood', 1.3, 0.2, 0.2, 0, 0.2, 0, [0, 0.5, 0.2]], ['wood', 1.3, 0.2, 0.2, 0, 0.25, 0, [0, 2, -0.2]], ['flame', 0.5, 0.7, 0.5, 0, 0.6, 0], ['flame', 0.25, 0.5, 0.25, 0.05, 1.1, 0, [0, 0.7, 0]]],

    // the triple arch at the city entrance: central arch (half-opening R) for the road, two small ones, attic with inscriptions
    arcTriple: (R = 7.5) => { const A = SHAPES.arc, pw = 3.6, r = 3, xs = R + pw + r, xe = xs + r + 1.6, top = R + 6.5;
      return [...pair(sd => [['stone', pw, top, 5, sd * (R + pw / 2), top / 2, 0], ['stone', 3.2, top, 5, sd * xe, top / 2, 0], ['stone', 2 * r, top - 6.4, 5, sd * xs, 6.4 + (top - 6.4) / 2, 0],
          ['stone', 2.4, 2.6, 4.6, sd * (R - 1.2), top - 1.3, 0], ...A(r, 0.8, 5.3, 7, 3.2, sd * xs), ['clair', 1.2, top, 0.5, sd * (R + pw / 2), top / 2, 2.6]]).flat(),
        ...A(R, 1.3, 5.4, 11, 5), ['stone', 2 * (xe + 1.6), 3.6, 5, 0, top + 1.8, 0], ['clair', 2 * (xe + 2), 0.7, 5.8, 0, top + 0.1, 0], ['clair', 2 * (xe + 2), 0.6, 5.6, 0, top + 3.7, 0],
        ...pair(b => ['inscription', 22, 2.2, 0.15, 0, top + 1.8, b * 2.55])]; },
    // the great building with colonnade and reliefs (south side of the square)
    monument: () => [['stone', 40, 0.5, 9, 0, 0.25, 0], ['stone', 38, 0.5, 7, 0, 0.75, 0], ...Array.from({ length: 8 }, (_, i) => [['clair', 1.4, 8, 1.4, -15.75 + i * 4.5, 5, 2], ['clair', 1.9, 0.5, 1.9, -15.75 + i * 4.5, 9.2, 2]]).flat(),
      ['stone', 37, 1.6, 3.2, 0, 10.2, 2], ['stone', 31, 1.2, 2.8, 0, 11.6, 2], ['stone', 21, 1.2, 2.8, 0, 12.8, 2], ['stone', 11, 1, 2.8, 0, 13.9, 2], ['shadows', 36, 9.6, 1.2, 0, 5.8, -1.6], ['blackM', 4.4, 6.4, 0.3, 0, 4.2, -0.9],
      ...pair(sd => [['relief', 6, 3.2, 0.25, sd * 9.5, 6, -0.9], ['relief', 2, 4.4, 0.25, sd * 14.5, 5.2, -0.9]]).flat()],
    // the temple façade cut into the cliff, around the cave portal (w = half-width of the passage, H = height under the keystone): round arch, a crowned figure with laurel above
    facadeTemple: (w = 6.5, H = 9) => { const R = w + 0.3, y0 = H - R, T = 30;
      return [...pair(sd => [['stone', 26, T, 4, sd * (R + 13), T / 2, 0], ['shadows', 2.2, 2.6, 3.6, sd * (R - 1.1), H - 0.9, 0], ['clair', 2.2, 17, 1, sd * (R + 3.4), 8.5, 2.3], ['clair', 3, 1, 1.6, sd * (R + 3.4), 17.5, 2.3]]).flat(),
        ['stone', 2 * R, T - H - 0.4, 4, 0, H + 0.4 + (T - H - 0.4) / 2, 0], ...SHAPES.arc(R, 1.3, 1.2, 11, y0, 0, 2.3), ['clair', 2 * R + 12, 1, 1.4, 0, 18.5, 2.3],
        ['relief', 2.6, 4.2, 0.5, 0, 12.6, 2.2], ['relief', 1.5, 1.5, 0.5, 0, 15.5, 2.2], ['gold', 1.9, 0.3, 0.55, 0, 16.25, 2.2], ['relief', 5.4, 0.7, 0.5, 0, 13.8, 2.2], ...pair(sd => ['relief', 0.7, 2, 0.5, sd * 2.6, 12.9, 2.2])]; },
    // ---------- the fauna: silhouettes that read while driving, head toward +X, origin at ground or feet ----------
    // a bird in flight (macaw, vulture): body, head, beak, long tail; the wings are separate (wingBird, on a shoulder pivot, to flap). l = tail length
    birdFlight: (l = 1) => [['feather', 0.9, 0.3, 0.32, 0, 0, 0], ['feather', 0.3, 0.28, 0.28, 0.55, 0.06, 0], ['beak', 0.2, 0.14, 0.12, 0.76, 0.02, 0], ['tailEnd', l, 0.08, 0.24, -0.4 - l / 2, 0, 0]],
    wingBird: (e = 1.5) => [['feather', 0.55, 0.06, e, 0, 0, e / 2], ['tailEnd', 0.4, 0.05, e * 0.5, -0.1, 0, e * 1.2]], // origin at the shoulder, the wing extends toward +Z
    // two wings in a V, span along Z, nose toward +X: a single piece, squashed in height (Y scale from -0.7 to 1) to make it flap; bats, egrets in flight
    wingsV: (e = 1, co = 1, ha = 0.42) => { const g = new THREE.BufferGeometry(), P = []; for (const sd of [-1, 1]) { const a = [0.22 * co, 0, sd * 0.06], b = [-0.2 * co, 0, sd * 0.06], c = [0.05 * co, ha * e, sd * e], d = [-0.34 * co, ha * 0.4 * e, sd * e * 0.55]; /* co: the chord (wing width); ha: how much the wing tip rises (a clear V also shows in profile) */ P.push(...a, ...b, ...c, ...b, ...d, ...c); }
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(24), 2)); g.computeVertexNormals(); return g; },
    // two rectangular wings, slightly raised (a bird gliding or slowly flapping: egrets); same conventions as wingsV, which ends in a point and is used for bats
    wingsBird: (e = 1, co = 1, ha = 0.3) => { const g = new THREE.BufferGeometry(), P = []; for (const sd of [-1, 1]) { const a = [0.24 * co, 0, sd * 0.1], b = [-0.22 * co, 0, sd * 0.1], c = [0.14 * co, ha * e, sd * e], d = [-0.2 * co, ha * e, sd * e]; P.push(...a, ...b, ...d, ...a, ...d, ...c); }
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(24), 2)); g.computeVertexNormals(); return g; },
    // egret in flight: body horizontal, neck outstretched, legs trailing behind (the wings: wingsV)
    egretFlight: () => [['feather', 0.8, 0.26, 0.3, 0, 0, 0], ['feather', 0.75, 0.1, 0.1, 0.72, 0.06, 0], ['feather', 0.2, 0.16, 0.14, 1.16, 0.1, 0], ['beak', 0.2, 0.1, 0.08, 1.34, 0.06, 0], ['paw', 0.95, 0.05, 0.08, -0.85, -0.03, 0]], // slender and long: the neck-body-legs line makes the wader in flight
    // seated capuchin monkey: trunk, head, pale muzzle, hooked tail
    monkey: () => [['fur', 0.42, 0.72, 0.42, 0, 0.36, 0], ['fur', 0.36, 0.36, 0.36, 0.04, 0.92, 0], ['face', 0.1, 0.22, 0.26, 0.2, 0.9, 0], ...pair(sd => ['fur', 0.1, 0.14, 0.1, 0.02, 1.12, sd * 0.16]),
      ...pair(sd => ['fur', 0.13, 0.5, 0.13, 0.08, 0.42, sd * 0.28]), ...pair(sd => ['fur', 0.42, 0.14, 0.14, 0.26, 0.08, sd * 0.17]), ['fur', 0.09, 1, 0.09, -0.26, -0.3, 0], ['fur', 0.3, 0.09, 0.09, -0.4, -0.8, 0]],
    // capybara standing: a barrel on four short legs
    capivara: () => [['fur', 1.05, 0.6, 0.5, 0, 0.62, 0], ['fur', 0.46, 0.46, 0.42, 0.68, 0.78, 0], ['face', 0.14, 0.2, 0.3, 0.94, 0.72, 0], ...pair(sd => ['face', 0.1, 0.1, 0.08, 0.6, 1.04, sd * 0.14]), ...pair(a => pair(b => ['face', 0.14, 0.36, 0.14, a * 0.36, 0.18, b * 0.16])).flat()],
  });
})();
