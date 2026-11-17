// Shapes specific to "piliers", family "trees": completes the shapes.js catalogue. Metres, origin at the foot, Y up. Simple shapes (three geometries, faceted), made to be instanced (PLACERS.inst): a tree is a trunk shape plus a foliage shape.
// See docs/proposals/sky-pillars/AMBIANCE-V2.html, zone 1: dark trunks close to the road, angular pines in spaced silhouettes, dense undergrowth at ground level. Not a jungle (no palms, no lianas).
(function () {
  const noise = (i, s = 0) => { const v = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return v - Math.floor(v); };
  // several geometries as one, faceted; each is [geometry, x, y, z, u scale, v scale]
  const join = (...parts) => { const P = [], UV = []; for (const [g0, x = 0, y = 0, z = 0, su = 1, sv = 1] of parts) { const g = g0.index ? g0.toNonIndexed() : g0, p = g.attributes.position, u = g.attributes.uv;
      for (let k = 0; k < p.count; k++) { P.push(p.getX(k) + x, p.getY(k) + y, p.getZ(k) + z); UV.push(u.getX(k) * su, u.getY(k) * sv); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.computeVertexNormals(); return g; };
  const blob = (r, sy) => new THREE.IcosahedronGeometry(r, 0).scale(1, sy, 1);
  Object.assign(SHAPES, {
    // trunk of a big broadleaf, 22 m to the first branches, 1.1 m in radius at the foot with a root flare: the thing the car slaloms between
    troncPiliers: (ht = 22, r = 1.1) => join([new THREE.CylinderGeometry(r * 0.55, r, ht, 6, 1, true), 0, ht / 2, 0, 2, ht / 4], [new THREE.CylinderGeometry(r, r * 1.8, 2.6, 6, 1, true), 0, 0.8, 0, 2, 0.6]),
    // its crown: three flattened faceted masses, 16 m across, origin at the centre of the crown
    houppierPiliers: (r = 8) => join([blob(r, 0.6), 0, 0, 0, 5, 3], [blob(r * 0.7, 0.6), r * 0.75, -r * 0.15, r * 0.3, 4, 2], [blob(r * 0.62, 0.65), -r * 0.6, r * 0.2, -r * 0.5, 4, 2]),
    // thin leaning trunk of a pine, 14 m
    futPiliers: (ht = 14) => join([new THREE.CylinderGeometry(0.16, 0.34, ht * 0.9, 5, 1, true).rotateZ(0.05), 0.3, ht * 0.45, 0, 0.5, ht / 4]),
    // the foliage of a pine clinging to the rock: three flat tiers pushed to one side by the wind, 14 m high in all
    pinPiliers: (ht = 14) => join(...[[0.5, 0.36, -0.1], [0.72, 0.28, 0.5], [0.93, 0.17, 0.2]].map(([y, r, x]) => [new THREE.ConeGeometry(ht * r, ht * r * 0.5, 6), x + 0.6, ht * y, x * 0.5, 3, 1])),
    // a mound of undergrowth, 1 m across and 1 m high: scaled per instance; its lower part is in the ground
    taillisPiliers: () => join([blob(0.6, 1.1), 0, 0.35, 0, 2, 1]),
  });
})();
