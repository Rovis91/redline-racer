// Shapes specific to "cars": the game's car geometry (player and opponents), completes the shapes.js catalogue. See docs/methods/SCENERY.md.
// A car = a side profile extruded across its width (wheel arches cut out, chamfered edges), a narrower cabin placed on top, and parts
// (bumpers, spoiler, mirrors, headlights, lights), merged into one geometry per zone: body (livery), black (plastics), headlight and light (lit).
// Metres, x forward, y up, origin on the ground at the middle of the vehicle. The wheels are separate (they turn and steer): wheelCar.
// The livery (textures-cars.js) is painted flat, like a dimensioned drawing: side, top, front and rear views, on a single 128 × 128 image.
// Each face takes the view of its dominant axis; undersides take a dark flat colour, the "plain" parts a flat tintMat colour.
(() => {
  const V2 = THREE.Vector2, PX = 24; // 24 pixels per metre on the livery
  // where a point falls in the livery, in pixels: side view (x, y), top (x, z), front and rear (z, y); tint and dark flats
  const plan = {
    sideOf: (x, y) => [(x + 2.6667) * PX, (1.5 - y) * PX], above: (x, z) => [(x + 2.6667) * PX, 38 + (1.05 - z) * PX],
    av: (z, y) => [(1.05 - z) * PX, 90 + (1.5 - y) * PX], ar: (z, y) => [64 + (1.05 + z) * PX, 90 + (1.5 - y) * PX], tintMat: [124, 96], dark: [124, 108], PX
  };
  const UV = ([px, py]) => [px / 128, 1 - py / 128];
  // profile: outline of the top from the front-low to the rear-low, then the bottom of the body at low height, cut into an arch around each wheel (centre xs, height r, radius ra)
  const profReport = (above, low, xs, r, ra) => {
    const p = above.slice();
    for (const x of xs.slice().sort((a, b) => a - b)) {
      p.push([x - ra, low], [x - ra, r]);
      for (let k = 1; k < 6; k++) { const a = Math.PI * (1 - k / 6); p.push([x + ra * Math.cos(a), r + ra * Math.sin(a)]); }
      p.push([x + ra, r], [x + ra, low]);
    }
    return p;
  };
  // extrusion of a profile across the width w, centred on z, edges chamfered by ch
  const extru = (pts, w, ch) => {
    const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(([x, y]) => new V2(x, y))), { depth: w - 2 * ch, bevelEnabled: true, bevelThickness: ch, bevelSize: ch, bevelOffset: -ch, bevelSegments: 1, curveSegments: 1 });
    g.translate(0, 0, -w / 2 + ch); return g;
  };
  const boxMesh = (l, h, w) => new THREE.BoxGeometry(l, h, w);
  const roundTone = (r, e = 0.05) => { const g = new THREE.CylinderGeometry(r, r, e, 10); g.rotateZ(Math.PI / 2); return g; }; // round light turned forward or backward
  // merges the parts [zone, geometry, x, y, z, plain]: one geometry per zone, flat normals; uv on the livery (body) or per metre (the rest)
  const melt = pieces => {
    const via = {}, a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
    for (const [zn, g0, x, y, z, unison] of pieces) {
      const g = (g0.index ? g0.toNonIndexed() : g0).translate(x, y, z), P = g.attributes.position.array, uv = new Float32Array(P.length / 3 * 2), N = new Float32Array(P.length);
      for (let i = 0; i < P.length; i += 9) {
        a.fromArray(P, i); b.fromArray(P, i + 3); c.fromArray(P, i + 6); n.subVectors(c, b).cross(a.clone().sub(b)).normalize();
        const ax = Math.abs(n.x), ay = Math.abs(n.y), az = Math.abs(n.z);
        for (let k = 0; k < 3; k++) {
          const j = i + k * 3, X = P[j], Y = P[j + 1], Z = P[j + 2]; N.set([n.x, n.y, n.z], j);
          let q;
          if (zn !== 'carBody') q = [(ax > ay && ax > az ? Z : X) * 2, (ay > ax && ay > az ? Z : Y) * 2]; // 2 repeats per metre, projection on the dominant axis
          else q = UV(unison ? plan.tintMat : n.y < -0.5 ? plan.dark : ay >= ax && ay >= az ? plan.above(X, Z) : az >= ax ? plan.sideOf(X, Y) : n.x > 0 ? plan.av(Z, Y) : plan.ar(Z, Y));
          uv.set(q, i / 3 * 2 + k * 2);
        }
      }
      (via[zn] = via[zn] || []).push([P, N, uv]);
    }
    const out = {};
    for (const zn in via) {
      const l = via[zn], g = new THREE.BufferGeometry();
      [['position', 0, 3], ['normal', 1, 3], ['uv', 2, 2]].forEach(([k, i, sz]) => { const A = new Float32Array(l.reduce((s, p) => s + p[i].length, 0)); let o = 0; for (const p of l) { A.set(p[i], o); o += p[i].length; } g.setAttribute(k, new THREE.BufferAttribute(A, sz)); });
      out[zn] = g;
    }
    return out;
  };

  // the models: top of the profile, bottom of the body, width, cabin (bottom of the windscreen, top of the windscreen, top of the rear window, bottom of the rear window; width),
  // wheels (x rear, x front, radius, tyre width, extra rear track), door seals, and the parts specific to the model
  const MODELS = {
    // Nissan Skyline GT-R R34 prepared: two-door saloon with high boot, large spoiler on uprights, four round lights, bonnet air intake
    gtr: {
      above: [[2.3, 0.2], [2.34, 0.5], [2.26, 0.7], [1.6, 0.84], [0.68, 0.87], [-1.6, 0.88], [-2.22, 0.9], [-2.32, 0.74], [-2.3, 0.2]], low: 0.2, w: 1.8,
      cab: [[0.7, 0.84], [-0.1, 1.34], [-1.0, 1.35], [-1.64, 0.86]], wc: 1.46, wheels: [-1.33, 1.33, 0.34, 0.27], doors: [0.6, -0.6], plate: 0.42,
      pieces: (B, B2, R2, E2) => [B('blackM', 0.3, 0.08, 1.72, 2.2, 0.19, 0), B('blackM', 0.3, 0.16, 1.6, -2.2, 0.27, 0),
        B('carBody', 0.32, 0.05, 1.74, -2.06, 1.17, 0, 1), B2('blackM', 0.1, 0.27, 0.06, -2.06, 1.02, 0.62), B2('carBody', 0.06, 0.16, 0.04, -2.06, 1.1, 0.87, 1), // spoiler on uprights, fins
        B2('carBody', 0.14, 0.1, 0.14, 0.52, 0.99, 0.82, 1), B2('headlight', 0.06, 0.1, 0.17, 2.28, 0.62, 0.68), B2('headlight', 0.06, 0.08, 0.13, 2.28, 0.61, 0.46),
        R2('fire', 0.085, -2.31, 0.66, 0.4), R2('fire', 0.085, -2.31, 0.66, 0.66)]
    },
    // Mazda RX-7 FD: low nose with headlights raised (we drive at night), curved front wings, long domed rear window, black band with four round lights, low spoiler
    fd: {
      above: [[2.12, 0.22], [2.16, 0.44], [2.0, 0.6], [1.5, 0.78], [0.6, 0.8], [-1.2, 0.84], [-2.02, 0.82], [-2.14, 0.7], [-2.1, 0.22]], low: 0.22, w: 1.76,
      cab: [[0.62, 0.72], [-0.18, 1.2], [-0.7, 1.22], [-1.92, 0.8]], wc: 1.36, wheels: [-1.2, 1.22, 0.32, 0.25], doors: [0.55, -0.55], plate: 0.36,
      pieces: (B, B2, R2, E2) => [B2('carBody', 1.0, 0.08, 0.36, 1.18, 0.81, 0.66), B2('carBody', 0.34, 0.16, 0.34, 1.62, 0.76, 0.5, 1), B2('headlight', 0.03, 0.11, 0.28, 1.8, 0.78, 0.5),
        B2('headlight', 0.04, 0.05, 0.22, 2.15, 0.34, 0.6), B('blackM', 0.3, 0.14, 1.6, -2.0, 0.28, 0), B('blackM', 0.04, 0.2, 1.62, -2.13, 0.58, 0),
        B('carBody', 0.3, 0.04, 1.5, -1.95, 0.97, 0, 1), B2('blackM', 0.08, 0.16, 0.05, -1.95, 0.88, 0.55),
        B2('carBody', 0.14, 0.09, 0.14, 0.45, 0.86, 0.82, 1), R2('fire', 0.085, -2.16, 0.58, 0.36), R2('fire', 0.085, -2.16, 0.58, 0.62)]
    },
    // Toyota Supra A80: long round body, headlights stretched over the wings, arch spoiler, three round lights each side on a dark panel
    a80: {
      above: [[2.22, 0.22], [2.26, 0.46], [2.12, 0.64], [1.5, 0.82], [0.62, 0.84], [-1.4, 0.87], [-2.18, 0.88], [-2.27, 0.72], [-2.24, 0.22]], low: 0.22, w: 1.81,
      cab: [[0.64, 0.78], [-0.2, 1.27], [-0.9, 1.28], [-1.6, 0.86]], wc: 1.44, wheels: [-1.25, 1.3, 0.33, 0.27], doors: [0.58, -0.62], plate: 0.4,
      pieces: (B, B2, R2, E2) => [B('carBody', 0.34, 0.05, 1.81, -2.0, 1.2, 0, 1), E2([[-1.74, 0.86], [-1.9, 1.14], [-2.0, 1.22], [-2.14, 1.22], [-2.24, 1.1], [-2.26, 0.86], [-2.2, 0.86], [-2.18, 1.08], [-2.1, 1.16], [-2.02, 1.16], [-1.93, 1.1], [-1.82, 0.86]], 0.06, 0.875), // arch: the spoiler's sides rise from the boot
        B2('headlight', 0.36, 0.04, 0.3, 1.9, 0.72, 0.6), B2('headlight', 0.04, 0.08, 0.34, 2.24, 0.52, 0.6), B2('blackM', 0.04, 0.22, 0.64, -2.26, 0.62, 0.56),
        ...[0.32, 0.56, 0.8].map(z => R2('fire', 0.085, -2.29, 0.62, z)), B('blackM', 0.3, 0.14, 1.66, -2.12, 0.28, 0), B('blackM', 0.24, 0.07, 1.7, 2.14, 0.22, 0),
        B2('carBody', 0.14, 0.1, 0.14, 0.5, 0.92, 0.84, 1)]
    },
    // 1970s Iranian rally saloon (inspired by the Paykan, derived from the Hillman Hunter): three square volumes, four doors, round headlights, thin bumpers, two long-range rally lights
    peykan: {
      above: [[2.08, 0.26], [2.12, 0.62], [2.06, 0.84], [0.74, 0.9], [-1.24, 0.92], [-2.06, 0.9], [-2.12, 0.66], [-2.08, 0.26]], low: 0.26, w: 1.58,
      cab: [[0.76, 0.88], [0.3, 1.38], [-0.86, 1.38], [-1.28, 0.9]], wc: 1.42, wheels: [-1.28, 1.3, 0.3, 0.2], doors: [0.62, -0.24], plate: 0.44,
      pieces: (B, B2, R2, E2) => [R2('headlight', 0.115, 2.13, 0.66, 0.56), R2('headlight', 0.1, 2.2, 0.46, 0.24), B('blackM', 0.1, 0.09, 1.64, 2.15, 0.4, 0), B('blackM', 0.1, 0.09, 1.64, -2.15, 0.42, 0),
        B2('fire', 0.04, 0.3, 0.13, -2.13, 0.7, 0.63), B2('carBody', 0.12, 0.08, 0.1, 0.68, 0.98, 0.84, 1), B2('blackM', 0.5, 0.03, 0.05, 2.0, 0.5, 0.24)]
    },
    // Renault 5 Turbo: short three-box hatchback, huge box-section rear wings (mid-engine) pierced with an air intake, roof spoiler, bar of four headlights
    r5: {
      above: [[1.82, 0.22], [1.86, 0.6], [1.72, 0.76], [0.78, 0.8], [-1.82, 0.82], [-1.86, 0.66], [-1.84, 0.22]], low: 0.22, w: 1.52,
      cab: [[0.8, 0.76], [0.1, 1.3], [-1.48, 1.32], [-1.74, 0.8]], wc: 1.38, wheels: [-1.22, 1.2, 0.3, 0.24, 0.12], doors: [0.72, -0.4], plate: 0.42,
      pieces: (B, B2, R2, E2) => [E2(profReport([[-0.32, 0.24], [-0.5, 0.84], [-1.74, 0.86], [-1.84, 0.76], [-1.84, 0.24]], 0.24, [-1.22], 0.3, 0.33), 0.28, 0.76, 0.06),
        E2(profReport([[1.74, 0.24], [1.76, 0.76], [0.62, 0.82], [0.56, 0.24]], 0.24, [1.2], 0.3, 0.33), 0.14, 0.73, 0.05),
        B2('blackM', 0.04, 0.34, 0.2, -0.43, 0.6, 0.79), B('carBody', 0.3, 0.05, 1.3, -1.56, 1.35, 0, 1),
        B2('headlight', 0.04, 0.13, 0.28, 1.86, 0.58, 0.52), R2('headlight', 0.09, 1.87, 0.6, 0.17), B('blackM', 0.08, 0.16, 1.6, 1.84, 0.3, 0),
        B2('fire', 0.04, 0.26, 0.2, -1.87, 0.64, 0.58), B('blackM', 0.1, 0.16, 1.64, -1.84, 0.3, 0), B2('carBody', 0.12, 0.09, 0.12, 0.6, 0.92, 0.76, 1)]
    },
    // Dodge Viper GTS: endless bonnet, set-back cabin, double-bubble roof, duckbill spoiler, side exhaust outlets, two stripes end to end
    gts: {
      above: [[2.2, 0.2], [2.24, 0.42], [2.06, 0.62], [1.5, 0.84], [0.9, 0.82], [-0.1, 0.8], [-1.5, 0.9], [-2.16, 0.92], [-2.25, 0.78], [-2.22, 0.2]], low: 0.2, w: 1.94,
      cab: [[-0.08, 0.78], [-0.78, 1.18], [-1.15, 1.19], [-1.98, 0.9]], wc: 1.38, wheels: [-1.2, 1.25, 0.34, 0.29], doors: [-0.05, -1.1], plate: 0.4,
      pieces: (B, B2, R2, E2) => [B('carBody', 0.22, 0.06, 1.7, -2.14, 0.95, 0, 1), B2('headlight', 0.3, 0.04, 0.34, 1.9, 0.7, 0.62), B2('headlight', 0.04, 0.06, 0.3, 2.22, 0.5, 0.62),
        B2('blackM', 1.0, 0.08, 0.06, -0.1, 0.24, 0.97), B2('fire', 0.04, 0.1, 0.46, -2.26, 0.7, 0.6), B('blackM', 0.3, 0.16, 1.7, -2.12, 0.28, 0),
        B2('carBody', 0.14, 0.09, 0.14, -0.3, 0.9, 0.9, 1)]
    },
    // ZiL-111: three-box limousine, long flat bonnet, high grille between four round headlights, panoramic windscreen, long roof, tail fins that carry the lights, heavy bumpers
    zil: {
      above: [[2.5, 0.24], [2.54, 0.62], [2.46, 0.82], [1.0, 0.88], [-1.5, 0.86], [-2.3, 0.86], [-2.54, 0.84], [-2.56, 0.62], [-2.52, 0.24]], low: 0.24, w: 1.92,
      cab: [[0.98, 0.86], [0.55, 1.38], [-1.2, 1.4], [-1.62, 0.86]], wc: 1.62, wheels: [-1.55, 1.58, 0.36, 0.26], doors: [0.55, -0.45], plate: 0.42,
      pieces: (B, B2, R2, E2) => [B('blackM', 0.14, 0.14, 1.98, 2.55, 0.34, 0), B('blackM', 0.05, 0.2, 1.1, 2.55, 0.64, 0), R2('headlight', 0.09, 2.56, 0.68, 0.84), R2('headlight', 0.09, 2.56, 0.68, 0.64),
        B('blackM', 0.14, 0.14, 1.98, -2.55, 0.34, 0), B2('carBody', 1.0, 0.12, 0.06, -2.06, 0.94, 0.92, 1), B2('fire', 0.05, 0.18, 0.1, -2.58, 0.86, 0.9), B2('blackM', 3.6, 0.04, 0.03, 0.2, 0.62, 0.97)]
    },
    // Onça 2000 Turbo (invented, Manuscrit 512): small 1970s Brazilian fibreglass coupé, in the spirit of the Puma GTB and SP2. Long plunging bonnet, round headlights set back, sloping roofline
    // down to a high, truncated tail, moulded spoiler. In expedition trim: two long-range lights on the bumper, roof rack with the spare wheel flat, mudflaps
    onca: {
      above: [[2.0, 0.22], [2.04, 0.42], [1.86, 0.58], [1.2, 0.74], [0.5, 0.8], [-1.0, 0.86], [-1.78, 0.9], [-1.98, 0.84], [-2.02, 0.6], [-1.98, 0.22]], low: 0.22, w: 1.72,
      cab: [[0.45, 0.78], [-0.25, 1.2], [-0.75, 1.21], [-1.86, 0.9]], wc: 1.34, wheels: [-1.18, 1.2, 0.32, 0.25], doors: [0.45, -0.5], plate: 0.4,
      pieces: (B, B2, R2, E2) => [B('blackM', 0.3, 0.14, 1.6, -1.9, 0.28, 0), B('blackM', 0.26, 0.08, 1.66, 1.92, 0.22, 0),
        R2('headlight', 0.1, 1.93, 0.52, 0.6), B2('blackM', 0.1, 0.2, 0.2, 2.03, 0.36, 0.3), R2('headlight', 0.085, 2.09, 0.36, 0.3), // round headlights, long-range lights in their housings
        R2('fire', 0.07, -2.01, 0.72, 0.4), R2('fire', 0.07, -2.01, 0.72, 0.6), B('carBody', 0.22, 0.05, 1.56, -1.9, 0.93, 0, 1), // two round lights each side, spoiler
        B('blackM', 0.04, 0.05, 1.3, -0.15, 1.24, 0), B('blackM', 0.04, 0.05, 1.3, -0.85, 1.25, 0), B2('blackM', 0.8, 0.03, 0.04, -0.5, 1.27, 0.5), ['blackM', new THREE.CylinderGeometry(0.3, 0.3, 0.17, 10), -0.5, 1.37, 0], // roof rack and spare wheel
        B2('blackM', 0.03, 0.22, 0.24, -1.57, 0.2, 0.72), B2('carBody', 0.14, 0.09, 0.14, 0.4, 0.86, 0.8, 1)] // mudflaps, mirrors
    }
  };

  Object.assign(SHAPES, {
    // a car: { zones: { carBody, blackM, headlight, fire } merged geometries, wheels: [rear x, front x, rear z, front z, radius, width], plan: what the livery must draw }
    vehicle: K => {
      const m = MODELS[K], [xr, xf, r, tw, plus = 0] = m.wheels, ra = r + 0.03, w = m.w;
      const B = (zn, l, h, ww, x, y, z, unison) => [zn, boxMesh(l, h, ww), x, y, z, unison], B2 = (zn, l, h, ww, x, y, z, unison) => [B(zn, l, h, ww, x, y, z, unison), B(zn, l, h, ww, x, y, -z, unison)];
      const R2 = (zn, rr, x, y, z) => [[zn, roundTone(rr), x, y, z], [zn, roundTone(rr), x, y, -z]], E2 = (p, ww, z, ch = 0.03) => [['carBody', extru(p, ww, ch), 0, 0, z], ['carBody', extru(p, ww, ch), 0, 0, -z]];
      const pieces = [['carBody', extru(profReport(m.above, m.low, [xr, xf], r, ra), w, 0.04), 0, 0, 0], ['carBody', extru(m.cab, m.wc, 0.11), 0, 0, 0],
        ...[xr, xf].map(x => B('blackM', 2 * ra, ra + 0.08, w - 2 * tw - 0.12, x, r + (ra - 0.12) / 2, 0)), // wheel arches: the back, so as not to see through
        ...m.pieces(B, B2, R2, E2).flatMap(p => Array.isArray(p[0]) ? p : [p])]; // B2, R2, E2 give a pair of parts
      const zf = w / 2 - tw / 2 - 0.05; // tyre sidewall set back from the wing
      return { zones: melt(pieces), wheels: [xr, xf, zf + plus, zf, r, tw], plan: Object.assign({ K, cab: m.cab, wc: m.wc, w, xs: [xr, xf], r, ra, doors: m.doors, plate: m.plate, low: m.low, aboveBody: m.above }, plan) };
    },
    // wheel: tyre and rim in one part, axis along z. The wheel's livery (textures-cars.js): the sidewall and the rim as a disc in the centre, the tread band at the bottom
    wheelCar: (r, w) => {
      const g = new THREE.CylinderGeometry(r, r, w, 14), uv = g.attributes.uv, n = g.attributes.normal;
      for (let i = 0; i < uv.count; i++) if (Math.abs(n.getY(i)) > 0.5) uv.setXY(i, 0.5 + (uv.getX(i) - 0.5) * 0.84, 0.54 + (uv.getY(i) - 0.5) * 0.84); else uv.setXY(i, uv.getX(i) * 2, uv.getY(i) * 0.09);
      g.rotateX(Math.PI / 2); return g;
    }
  });
})();
