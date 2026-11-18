// Shapes specific to "egee", family "lime-washed buildings": completes the shapes.js catalogue. Metres, origin at the foot (centre of the footprint), Y up.
// Frame of every piece: +X is its front (the side turned to the road), w = size along X (across the road), d = size along Z (along the road). The placement turns it (scenery-egee.js, `set`).
// Zones (materials of MAT in scenery-egee.js): lime = house wall with windows, blanc = plain lime wash, bleu = joinery and dome, pierre = dry stone, ocre = dressed stone, bois, toile = awning, chaume = thatch, feu = lit lantern.
// See docs/proposals/aegean-cliffs/AMBIANCE-V2.html, zones 1, 3 and 4: stacked white cubes, flat roofs, few openings, one blue dome, one windmill. Not pitched tile roofs, not pastel facades.
(function () {
  const ring = (n, f) => Array.from({ length: n }, (_, i) => f(i * 6.2832 / n, i));
  Object.assign(SHAPES, {
    // Cycladic house, w × ht × d: a lime cube on a stone footing that goes 8 m down (it can stand on a slope), a roof slab, a blue door on the front. v = bits of what it carries:
    // 1 an upper room set back on the roof, 2 an outside stair along the front, 4 a striped awning over the door, 8 a chimney, 16 a pergola on the roof
    maisonEgee: (w = 12, ht = 7, d = 16, v = 0) => [['ocre', w, 8, d, 0, -4, 0], ['lime', w, ht, d, 0, ht / 2, 0, null, 1], ['blanc', w + 0.5, 0.4, d + 0.5, 0, ht + 0.2, 0], ['bleu', 0.25, 2.3, 1.3, w / 2 + 0.03, 1.15, d * 0.2],
      ...(v & 1 ? [['lime', w * 0.55, 3.6, d * 0.5, -w * 0.2, ht + 2.2, -d * 0.2, null, 1], ['blanc', w * 0.55 + 0.5, 0.4, d * 0.5 + 0.5, -w * 0.2, ht + 4.2, -d * 0.2]] : []),
      ...(v & 2 ? [0, 1, 2, 3].map(k => ['blanc', 1.5, (k + 1) * 0.85, 1.6, w / 2 + 0.75, (k + 1) * 0.425, -d * 0.42 + k * 1.6]) : []),
      ...(v & 4 ? [['toile', 2.8, 0.12, d * 0.36, w / 2 + 1.35, 2.95, d * 0.2, [0, 0, -0.2]]] : []),
      ...(v & 8 ? [['blanc', 1, 1.5, 1, w * 0.28, ht + 1.1, d * 0.3]] : []),
      ...(v & 16 ? [['bois', w * 0.5, 0.15, d * 0.4, w * 0.2, ht + 2.9, d * 0.22], ...[[0, 0], [1, 0], [0, 1], [1, 1]].map(([a, b]) => ['bois', 0.18, 2.5, 0.18, w * (a ? 0.43 : -0.03), ht + 1.6, d * (b ? 0.4 : 0.04)])] : [])],
    // harbour warehouse, w × ht × d: dressed sand-coloured stone, two wide board doors on the front, a lime roof edge, crates by the doors
    entrepotEgee: (w = 20, ht = 9, d = 40) => [['ocre', w, ht + 6, d, 0, ht / 2 - 3, 0, null, 1], ['blanc', w + 0.6, 0.6, d + 0.6, 0, ht + 0.3, 0], ...[-1, 1].map(k => ['bois', 0.3, 5.2, 7, w / 2 + 0.05, 2.6, k * d * 0.24]),
      ['boisB', 1.6, 1.6, 1.6, w / 2 + 1.6, 0.8, 0], ['bois', 1.4, 1.4, 1.4, w / 2 + 1.7, 0.7, 1.9], ['bois', 1.4, 1.4, 1.4, w / 2 + 1.6, 2.3, 0.6], ['boisB', 1.2, 1.2, 2.4, w / 2 + 1.5, 0.6, -d * 0.44]],
    // chapel: nave along Z with a stepped west front, a bell wall on the road side (two piers, an arch stone, the bell), a blue door; the drum and the dome are posed on it by the placement (tourEgee, domeEgee)
    chapelleEgee: () => [['ocre', 12, 8, 18, 0, -4, 0], ['blanc', 12, 8, 18, 0, 4, 0, null, 1], ['blanc', 12.5, 0.5, 18.5, 0, 8.25, 0], ['blanc', 8, 5, 5, 0, 2.5, -11], ['bleu', 0.25, 3, 1.8, 6.03, 1.5, 3],
      ['blanc', 1, 4.2, 1.2, 5.4, 10.6, 4.4], ['blanc', 1, 4.2, 1.2, 5.4, 10.6, 1.6], ['blanc', 1, 1.2, 4.6, 5.4, 13.3, 3], ['bois', 0.7, 1, 0.9, 5.4, 11.9, 3], ['blanc', 0.25, 1.8, 0.25, 5.4, 14.8, 3], ['blanc', 0.25, 0.25, 1.1, 5.4, 15.1, 3]],
    // round tower (simple shape): radius r0 at the foot, r1 at height ht, n sides; mill, lighthouse, dome drum. Its foot goes `under` metres down
    tourEgee: (r0, r1, ht, n = 10, under = 0) => SHAPES.ringsEgee(n, [[-under, r0, r0], [ht, r1, r1]], true),
    // dome (simple shape): half sphere of radius r in 10 sides, 4 rings, origin at its base
    domeEgee: (r = 4) => SHAPES.ringsEgee(10, [0, 0.42, 0.78, 1.15, 1.45].map(a => [Math.sin(a) * r, Math.cos(a) * r, Math.cos(a) * r]), true),
    // cone (simple shape): mill thatch, lighthouse cap
    coneEgee: (r, ht, n = 10) => SHAPES.ringsEgee(n, [[0, r, r], [ht, 0.05, 0.05]]),
    // mill wheel, radius R, turned to +X, origin at the hub: 12 spars, a rope rim, a triangular sail furled on every second spar. Not sails set full: the meltemi blows
    ailesEgee: (R = 7) => [['bois', 3.2, 0.4, 0.4, -1, 0, 0], ...ring(12, (a, i) => [['bois', 0.14, R, 0.14, 0, Math.cos(a) * R / 2, Math.sin(a) * R / 2, [a, 0, 0]],
      ['bois', 0.06, R * 0.52, 0.06, 0, Math.cos(a + 0.26) * R * 0.97, Math.sin(a + 0.26) * R * 0.97, [a + 0.26 + 1.5708, 0, 0]], ...(i & 1 ? [] : [['blanc', 0.08, R * 0.62, 1, 0.1, Math.cos(a + 0.07) * R * 0.6, Math.sin(a + 0.07) * R * 0.6, [a + 0.07, 0, 0]]])]).flat()],
    // what a lighthouse carries besides its tower: stone base, gallery, lit lantern (the cap is a coneEgee); ht = height of the gallery
    phareEgee: (ht = 20) => [['ocre', 9, 9, 9, 0, -1.5, 0, null, 1], ['blanc', 6.4, 0.5, 6.4, 0, ht + 0.25, 0], ['feu', 2.8, 2.6, 2.8, 0, ht + 1.8, 0], ['blanc', 3.2, 0.3, 3.2, 0, ht + 3.2, 0], ['bleu', 0.25, 2.2, 1.2, 3.25, 4.1, 0]],
    // roofless stone farm, about 14 × 9 m: four walls of unequal height, a standing gable, a door gap in the front. Same stone as the field walls; not an ancient monument
    ruineEgee: () => [['pierre', 0.9, 3.4, 9, -7, 1.7, 0], ['pierre', 0.9, 6, 9, -7, 3, 0, null, 1], ['pierre', 0.9, 2.2, 5, -7, 7, 0], ['pierre', 14, 3.8, 0.9, 0, 1.9, -4.5, null, 1], ['pierre', 6, 2, 0.9, -4, 4.4, -4.5], ['pierre', 14, 1.8, 0.9, 0, 0.9, 4.5],
      ['pierre', 0.9, 2.8, 3, 7, 1.4, -3], ['pierre', 0.9, 4.2, 2.6, 7, 2.1, 3.2], ['pierre', 6, 5, 9, -3, -2.5, 0]],
  });
})();
