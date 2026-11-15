// Formes propres à « chapada » (Manuscrit 512, la cité perdue) : complète le catalogue de formes.js. Voir METHODE-DECOR.md.
// Sauf mention, X = en travers de la route (ou en s'éloignant d'elle), Z = le long de la route, origine au pied de l'objet.
(function () {
  const paire = f => [-1, 1].map(f);
  Object.assign(FORMES, {
    fougereArbo: (h = 1) => [['stipe', 0.35 * h, 5 * h, 0.35 * h, 0, 2.5 * h, 0], ...Array.from({ length: 5 }, (_, k) => { const a = k / 5 * 6.2832;
      return ['fronde', 3.4 * h, 0.08, 0.9 * h, Math.cos(a) * 1.5 * h, 4.9 * h, Math.sin(a) * 1.5 * h, [0, -a, -0.35 - (k % 2) * 0.25]]; })],
    cime: () => { const p = new THREE.IcosahedronGeometry(3.4, 0).attributes.position, vu = new Map(), pos = [], uv = [], idx = [];
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = [x, y, z].map(v => v.toFixed(3)).join(); let j = vu.get(k);
        if (j === undefined) { vu.set(k, j = pos.length / 3); pos.push(x, y, z); uv.push(Math.atan2(z, x) / 6.2832 + 0.5, y / 6.8 + 0.5); } idx.push(j); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g; },
    touffe: () => { const g = new THREE.ConeGeometry(0.55, 1, 5, 1, true); g.translate(0, 0.5, 0); return g; }, // sans fond : on ne le voit jamais
    cimeLoin: () => { const g = new THREE.OctahedronGeometry(3.6, 0), p = g.attributes.position, vu = new Map(), pos = [], uv = [], idx = [];
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = [x, y, z].map(v => v.toFixed(3)).join(); let j = vu.get(k);
        if (j === undefined) { vu.set(k, j = pos.length / 3); pos.push(x, y, z); uv.push(Math.atan2(z, x) / 6.2832 + 0.5, y / 7.2 + 0.5); } idx.push(j); }
      const G = new THREE.BufferGeometry(); G.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); G.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); G.setIndex(idx); G.computeVertexNormals(); return G; },
    rocher: () => { const g = new THREE.BoxGeometry(2, 1.6, 2, 1, 1, 1), p = g.attributes.position; // une boîte aux coins tirés au hasard (fixe), le dessus plus étroit : un bloc anguleux (les dodécaèdres se lisaient comme des hexagones)
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = Math.sin(x * 12.9 + y * 78.2 + z * 37.7) * 43758.5, u = k - Math.floor(k);
        p.setXYZ(i, x * (y > 0 ? 0.7 + 0.3 * u : 1 - 0.2 * u), y * (0.8 + 0.4 * u), z * (y > 0 ? 0.65 + 0.35 * (1 - u) : 1)); }
      g.computeVertexNormals(); return g; },
    fougereBasse: () => Array.from({ length: 4 }, (_, k) => { const a = k / 4 * 6.2832 + 0.4; return ['fronde', 1.8, 0.05, 0.45, Math.cos(a) * 0.8, 0.45, Math.sin(a) * 0.8, [0, -a, 0.55]]; }),
    troncCouche: (l = 10) => [['bois', l, 0.8, 0.8, 0, 0.4, 0, [0, 0, 0.04]], ['bois', 0.3, 1.6, 0.3, l * 0.2, 1, 0.2, [0.3, 0, -0.4]], ['bois', 0.25, 1.2, 0.25, -l * 0.25, 0.9, -0.2, [-0.4, 0, 0.3]]],
    // palmier juçara (Euterpe edulis) : fût fin de 10 m, couronne de palmes courbes qui montent puis retombent (h = taille)
    jucara: (h = 1) => [['stipe', 0.3 * h, 10 * h, 0.3 * h, 0, 5 * h, 0], ...Array.from({ length: 7 }, (_, k) => { const a = k / 7 * 6.2832, c = Math.cos(a), s = Math.sin(a);
      return [['palme', 3 * h, 0.06, 0.9 * h, c * 1.4 * h, 10.4 * h, s * 1.4 * h, [0, -a, 0.4]], ['palme', 2.6 * h, 0.06, 0.8 * h, c * 3.7 * h, 10.2 * h, s * 3.7 * h, [0, -a, -0.75]]]; }).flat()],
    //NOUVELLES
  });
})();
