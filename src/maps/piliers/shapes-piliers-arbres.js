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
    // a fir, 18 m: four stacked cones on a short bare trunk (one shape, foliage; its trunk is futPiliers)
    sapinPiliers: (ht = 18) => join(...[[0.2, 0.26, 0.34], [0.42, 0.21, 0.3], [0.62, 0.15, 0.26], [0.8, 0.09, 0.22]].map(([y, r, hh]) => [new THREE.ConeGeometry(ht * r, ht * hh, 6), 0, ht * (y + hh / 2), 0, 3, 2])),
    // a tall narrow crown, 10 m across and 14 high: a slender broadleaf; origin at the centre of the crown
    houppierHautPiliers: (r = 5) => join([blob(r, 1.3), 0, 0, 0, 4, 4], [blob(r * 0.7, 1.1), r * 0.5, -r * 0.7, 0.3 * r, 3, 3]),
    // a shrub 3 m across: three small masses at different heights, origin on the ground
    arbustePiliers: () => join([blob(1.2, 0.8), 0, 0.8, 0, 2, 1], [blob(0.9, 0.9), 0.9, 1.3, 0.4, 2, 1], [blob(0.8, 0.8), -0.7, 0.6, -0.6, 2, 1]),
    // a pine leaning out of a cliff toward +X, 10 m: its bent trunk (bark), then its foliage, three flat pads carried out over the void
    futPenchePiliers: (ht = 10) => join([new THREE.CylinderGeometry(0.2, 0.4, ht * 0.5, 5, 1, true).rotateZ(-0.5), ht * 0.12, ht * 0.22, 0, 0.5, ht / 8], [new THREE.CylinderGeometry(0.13, 0.2, ht * 0.5, 5, 1, true).rotateZ(-0.15), ht * 0.277, ht * 0.687, 0, 0.5, ht / 8]),
    pinPenchePiliers: (ht = 10) => join(...[[0.5, 0.52, 0.26, 0.3], [0.3, 0.78, 0.33, -0.2], [0.36, 0.96, 0.2, 0.1]].map(([x, y, r, z]) => [new THREE.ConeGeometry(ht * r, ht * r * 0.36, 6), ht * x, ht * y, ht * z * 0.5, 3, 1])),
    // a clump of ferns 3 m across: six fronds arching out from the foot
    fougerePiliers: () => join(...[0, 1, 2, 3, 4, 5].map(k => [new THREE.ConeGeometry(0.34, 1.7, 3).translate(0, 0.85, 0).rotateZ(-0.75 - 0.3 * noise(k, 1)).rotateY(k * 1.047 + noise(k, 2)), 0, 0, 0, 1, 1])),
    // ivy hanging down a rock face: 1 m wide (Z) and 1 m high below its origin, 0.35 m thick (X, the normal of the face): scaled per instance
    lierrePiliers: () => join([blob(0.5, 1).scale(0.35, 1, 1), 0, -0.45, 0, 2, 2], [blob(0.32, 1).scale(0.35, 1, 1), 0.05, -0.75, 0.3, 1, 2]),
    // a mound of undergrowth, 1 m across and 1 m high: scaled per instance; its lower part is in the ground
    taillisPiliers: () => join([blob(0.6, 1.1), 0, 0.35, 0, 2, 1]),
  });
})();
