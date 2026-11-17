// Shapes specific to "egee", families "harbour" and "vegetation": completes the shapes.js catalogue. Metres, Y up.
// See docs/proposals/aegean-cliffs/AMBIANCE-V2.html, zones 1 and 5: small painted fishing boats, wooden pontoons; olive trees as round grey-green crowns. Not yachts, not cranes; not lush green.
(function () {
  Object.assign(SHAPES, {
    // fishing boat (kaiki), 9 m, bow to +X, origin at the waterline: painted hull (zone coque: the placement picks coral, blue or white), white rubbing strake, raised bow, small cabin, mast and boom
    kaikiEgee: () => [['coque', 7.4, 1.5, 3, -0.4, 0.35, 0, null, 1], ['coque', 2.4, 1.6, 2.1, 3.6, 0.6, 0, [0, 0, 0.22]], ['coque', 1.2, 1.4, 2.4, -4.3, 0.5, 0, [0, 0, -0.15]], ['blanc', 7.6, 0.22, 3.1, -0.4, 1.02, 0], ['bois', 6.6, 0.1, 2.5, -0.4, 1.12, 0],
      ['blanc', 2.3, 1.5, 1.8, -1.8, 1.9, 0], ['bleu', 2.5, 0.15, 2, -1.8, 2.7, 0], ['bois', 0.18, 5, 0.18, 1, 3.6, 0], ['bois', 3.6, 0.12, 0.12, -0.7, 4.3, 0]],
    // pontoon, L m long along X, 3 m wide, origin at its centre on the deck top: boards on posts that go 5 m down into the water
    pontonEgee: (L = 40) => [['bois', L, 0.35, 3, 0, -0.18, 0, null, 1], ...Array.from({ length: Math.floor(L / 6) + 1 }, (_, i) => [-1, 1].map(k => ['tronc', 0.4, 6, 0.4, -L / 2 + 0.4 + i * (L - 0.8) / Math.floor(L / 6), -2.4, k * 1.35])).flat()],
    // olive tree, about 5 m (simple shapes, placed in number): a squat round crown of 12 flat faces, and its short leaning trunk
    olivierEgee: () => { const g = new THREE.IcosahedronGeometry(2.6, 0); g.scale(1, 0.72, 1); g.translate(0.3, 3.3, 0); return g; },
    troncEgee: () => { const g = new THREE.CylinderGeometry(0.22, 0.42, 2.4, 5); g.rotateZ(-0.14); g.translate(0.1, 1.1, 0); return g; },
  });
})();
