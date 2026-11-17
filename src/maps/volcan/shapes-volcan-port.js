// Shapes specific to "volcan", family "harbour": completes the shapes.js catalogue. Metres, origin at the foot (boats: at the waterline, amidships), Y up.
// Assemblies (boxes [zone, w, h, d, x, y, z, rotation]); X along the road or along the hull, front toward -Z (the road). Zones are keys of the map's shared materials (MAT in scenery-volcan.js):
// coral, white, blue, red (paint), wood, steel, concrete, rock, net, dark, lamp. The lighthouse is posed from cylVolcan (shapes-volcan-roche.js) in scenery-volcan-quais.js.
// See docs/proposals/volcanic-island/AMBIANCE-V2.html, zones 1 and 6: small boats painted in bright bands, crates, nets, a working quay. Not a marina.
(function () {
  const noise = (i, s = 0) => { const v = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return v - Math.floor(v); }; // fixed pseudo-random per index: no call to the shared rnd
  Object.assign(SHAPES, {
    // open fishing boat, L long, hull = its paint, band = the stripe under the gunwale: a raised bow, three thwarts
    barqueVolcan: (L = 8, hull = 'coral', band = 'white') => { const w = L * 0.3;
      return [[hull, L * 0.7, 1.1, w, 0, 0.35, 0], [hull, L * 0.24, 1.1, w * 0.72, L * 0.44, 0.5, 0, [0, 0, 0.22]], [hull, L * 0.12, 1, w * 0.86, -L * 0.4, 0.4, 0], [band, L * 0.72, 0.22, w + 0.06, 0, 0.82, 0], [band, L * 0.25, 0.22, w * 0.74, L * 0.44, 1.0, 0, [0, 0, 0.22]],
        ...[-0.2, 0.05, 0.28].map(k => ['wood', 0.3, 0.1, w - 0.2, k * L, 0.75, 0])]; },
    // small trawler at anchor, L long: hull with a raised bow, white wheelhouse aft, a mast with a boom
    bateauVolcan: (L = 16, hull = 'blue', band = 'white') => { const w = L * 0.3;
      return [[hull, L * 0.72, 2.6, w, 0, 0.3, 0], [hull, L * 0.24, 2.8, w * 0.7, L * 0.45, 0.7, 0, [0, 0, 0.2]], [band, L * 0.74, 0.3, w + 0.08, 0, 1.4, 0], [band, L * 0.25, 0.3, w * 0.72, L * 0.45, 1.9, 0, [0, 0, 0.2]],
        ['white', L * 0.22, 2.4, w * 0.7, -L * 0.2, 2.8, 0], ['dark', L * 0.23, 0.8, w * 0.72, -L * 0.2, 3.3, 0], ['white', L * 0.26, 0.2, w * 0.8, -L * 0.2, 4.1, 0],
        ['steel', 0.25, L * 0.6, 0.25, L * 0.08, 1.6 + L * 0.3, 0], ['steel', L * 0.4, 0.15, 0.15, L * 0.26, 1.6 + L * 0.42, 0, [0, 0, 0.35]]]; },
    // harbour crane on the quay edge: a concrete foot, a steel mast, a cab, a jib reaching 22 m over the water (+Z) with its cable and hook, a short counter-jib
    grueVolcan: (ht = 22) => [['concrete', 5, 2.4, 5, 0, 0.2, 0], ['steel', 2.2, ht, 2.2, 0, 1 + ht / 2, 0], ['red', 3.4, 2.8, 3.6, 0, ht + 1.6, 0.4], ['dark', 3.5, 1, 1.2, 0, ht + 2, 2],
      ['steel', 1, 1, 24, 0, ht + 3.8, 11, [-0.12, 0, 0]], ['steel', 1.6, 1.6, 7, 0, ht + 3, -4.5], ['concrete', 2.2, 2, 2.4, 0, ht + 2.8, -7], ['steel', 0.12, ht * 0.55, 0.12, 0, ht + 5 - ht * 0.275, 20], ['steel', 0.7, 0.9, 0.7, 0, ht + 5 - ht * 0.55, 20]],
    // stack of fish crates, n crates: wooden boxes 1.6 m long, in two or three uneven layers
    caissesVolcan: (n = 9, seed = 0) => Array.from({ length: n }, (_, i) => { const lay = i % 3 === 2 ? 1 : 0, k = (i - lay) / 3 * 2 | 0; return [i % 4 ? 'wood' : 'blue', 1.6, 0.9, 1.1, (k % 3 - 1) * 1.75 + 0.3 * noise(i, seed), 0.45 + lay * 0.92, ((k / 3 | 0) - 0.5) * 1.3 + 0.2 * noise(i, seed + 3), [0, 0.25 * (noise(i, seed + 7) - 0.5), 0]]; }),
    // nets laid out to dry on the quay, w × d: a low sand-coloured heap, a row of floats, two folded piles
    filetsVolcan: (w = 8, d = 12) => [['net', w, 0.25, d, 0, 0.12, 0], ['net', w * 0.4, 0.7, d * 0.25, -w * 0.2, 0.4, d * 0.3, [0, 0.3, 0]], ['net', w * 0.3, 0.5, d * 0.2, w * 0.25, 0.3, -d * 0.3, [0, -0.2, 0]],
      ...Array.from({ length: 7 }, (_, i) => ['red', 0.35, 0.35, 0.35, -w / 2 + 0.6 + i * (w - 1.2) / 6, 0.4, d * 0.05 + 0.5 * noise(i, 1)])],
    // wooden pontoon over the water, L long (along Z, away from the quay) × w wide, its deck at the origin height: planks on posts going 4 m down
    pontonVolcan: (L = 40, w = 4) => [['wood', w, 0.4, L, 0, -0.2, L / 2], ...Array.from({ length: Math.round(L / 6) + 1 }, (_, i) => [-1, 1].map(sd => ['wood', 0.4, 5, 0.4, sd * (w / 2 - 0.2), -2.4, i * L / Math.round(L / 6)])).flat()],
    // breakwater, L long (along Z, away from the quay) × w wide, its top at the origin height: a concrete crown on tipped basalt blocks going 14 m down
    digueVolcan: (L = 170, w = 9) => [['concrete', w, 1.2, L, 0, -0.6, L / 2], ['concrete', w * 0.3, 1.1, L, w * 0.3, 0.55, L / 2],
      ...Array.from({ length: Math.round(L / 6) }, (_, i) => [-1, 1].map(sd => ['rock', 5 + 2 * noise(i, sd), 15, 5.5, sd * (w / 2 + 1.6 + noise(i, sd + 4)), -8, 3 + i * 6, [0, noise(i, sd + 8), sd * 0.28]])).flat()],
    // mooring post on the quay edge
    bollardVolcan: () => [['steel', 0.5, 0.9, 0.5, 0, 0.45, 0], ['steel', 0.8, 0.25, 0.8, 0, 0.95, 0]],
    // beacon on the shore road: a white post with red bands and a small lamp
    baliseVolcan: (ht = 6) => [['white', 0.5, ht, 0.5, 0, ht / 2, 0], ['red', 0.55, ht * 0.18, 0.55, 0, ht * 0.3, 0], ['red', 0.55, ht * 0.18, 0.55, 0, ht * 0.7, 0], ['lamp', 0.4, 0.4, 0.4, 0, ht + 0.2, 0]],
  });
})();
