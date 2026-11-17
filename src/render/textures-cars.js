// Textures specific to "cars": completes the textures.js catalogue (same conventions: flat colour for what emits light, drawing otherwise, randomness via o.rand). See docs/methods/SCENERY.md.
// The livery is painted flat, on the views that shapes-cars.js projects onto the body (plan.sideOf, plan.above, plan.av, plan.ar: metres → pixels).
// Solid tint in the drawing (the material itself is not tinted, so that the glazing, plastics and plate keep their colour); the shine comes from the gloss option.
(() => {
  const css = c => '#' + (c >>> 0).toString(16).padStart(6, '0');
  const PANE = '#121a26', FRAME = '#0a0b0e', DARK = '#0c0c10';
  // rectangle and polygon in metres in a view
  const rv = (g, v, a0, b0, a1, b1, c) => { const [x0, y0] = v(a0, b0), [x1, y1] = v(a1, b1); g.fillStyle = c; g.fillRect(Math.round(Math.min(x0, x1)), Math.round(Math.min(y0, y1)), Math.max(1, Math.round(Math.abs(x1 - x0))), Math.max(1, Math.round(Math.abs(y1 - y0)))); };
  const trace = (g, v, pts) => { g.beginPath(); pts.forEach(([a, b], i) => { const [x, y] = v(a, b); g[i ? 'lineTo' : 'moveTo'](Math.round(x), Math.round(y)); }); g.closePath(); };
  const poly = (g, v, pts, c) => { trace(g, v, pts); g.fillStyle = c; g.fill(); };
  // convex polygon (counter-clockwise) shrunk by d metres: each side moves inward, vertices at the new intersections
  const narrowed = (p, d) => {
    const L = p.map((a, i) => { const b = p[(i + 1) % p.length], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); return [a[0] - dy / l * d, a[1] + dx / l * d, dx, dy]; });
    return L.map((e, i) => { const f = L[(i + L.length - 1) % L.length], t = ((e[0] - f[0]) * e[3] - (e[1] - f[1]) * e[2]) / (f[2] * e[3] - f[3] * e[2]); return [f[0] + f[2] * t, f[1] + f[3] * t]; });
  };
  // glazing: dark background, two diagonal reflections, cut to the shape
  const pane = (g, o, v, pts) => {
    g.save(); trace(g, v, pts); g.clip(); poly(g, v, pts, PANE);
    o.veil(g, 0.22, () => { const y0 = v(pts[0][0], pts[0][1])[1]; for (let k = -40; k < 140; k += 23) { g.beginPath(); g.moveTo(k, y0 + 30); g.lineTo(k + 30, y0 - 30); g.lineTo(k + 34, y0 - 30); g.lineTo(k + 4, y0 + 30); g.fillStyle = '#fff'; g.fill(); } });
    g.restore();
  };
  const plate = (g, o, v, y, l = 0.52) => { rv(g, v, -l / 2, y - 0.06, l / 2, y + 0.06, '#e8e6dc'); for (const z of [-0.18, -0.08, 0.06, 0.16]) rv(g, v, z - 0.03, y - 0.03, z + 0.03, y + 0.03, '#22242a'); o.veil(g, 0.5, () => rv(g, v, -l / 2, y + 0.05, l / 2, y + 0.06, '#000')); };
  const grid = (g, o, v, z, y0, y1, stepSec = 2) => { rv(g, v, -z, y0, z, y1, DARK); o.veil(g, 0.35, () => { const [, a] = v(0, y1), [, b] = v(0, y0); for (let y = Math.round(a) + 1; y < b; y += stepSec) rv(g, (x, yy) => [v(x, 0)[0], yy], -z + 0.03, y, z - 0.03, y + 1, '#8a8c94'); }); };

  Object.assign(TEXTURES, {
    // livery of a car in the game: p = the plan of SHAPES.vehicle, col = body tint, bande = stripe tint (Viper)
    livery: (p, col, bandStrip) => [128, 128, (g, o) => {
      const l = ((col >> 16 & 255) * 0.3 + (col >> 8 & 255) * 0.59 + (col & 255) * 0.11) / 255, k = l < 0.5 ? (0.5 - l) * 1.2 : 0; // dark tint lightened toward silver, so that it reads at night
      col = [16, 8, 0].reduce((s, d) => s | Math.round((col >> d & 255) * (1 - k) + 230 * k) << d, 0);
      const { R, veil, rand } = o, C = css(col), [xr, xf] = p.xs, ra = p.ra, belt = p.cab[0][1], beltR = p.cab[3][1], hw = p.wc / 2 - 0.11, W = p.w / 2;
      const nose = Math.max(...p.aboveBody.map(q => q[0])), tail = Math.min(...p.aboveBody.map(q => q[0]));
      R(g, C, 0, 0, 128, 128);
      // modelling: light shoulder, darker lower body, reflection along the bonnet and roof
      veil(g, 0.14, () => { rv(g, p.sideOf, -2.7, 0.45, 2.7, p.low, '#000'); rv(g, p.av, -1.05, 0.34, 1.05, 0, '#000'); rv(g, p.ar, -1.05, 0.34, 1.05, 0, '#000'); });
      veil(g, 0.3, () => { rv(g, p.sideOf, tail, belt - 0.05, nose, belt - 0.03, '#fff'); rv(g, p.above, tail + 0.2, 0.28, nose - 0.2, 0.34, '#fff'); });
      if (bandStrip) { const B = css(bandStrip); for (const s of [-1, 1]) { rv(g, p.above, -2.7, s * 0.08, 2.7, s * 0.3, B); rv(g, p.av, s * 0.08, 0, s * 0.3, 1.5, B); rv(g, p.ar, s * 0.08, 0, s * 0.3, 1.5, B); } }
      // seams: doors, bonnet, boot; lower body; lips of the wheel arches
      veil(g, 0.5, () => {
        for (const x of p.doors) rv(g, p.sideOf, x, p.low + 0.06, x - 0.04, belt, '#000');
        rv(g, p.sideOf, p.doors[1] + 0.1, belt - 0.12, p.doors[1] + 0.22, belt - 0.08, '#000'); // handle
        rv(g, p.sideOf, xr + ra + 0.12, belt - 0.16, xr + ra + 0.24, belt - 0.06, '#000'); rv(g, p.sideOf, xr + ra + 0.16, belt - 0.12, xr + ra + 0.2, belt - 0.1, C); // fuel flap
        for (const s of [-1, 1]) { rv(g, p.above, nose - 0.12, s * (W - 0.14), p.cab[0][0] + 0.06, s * (W - 0.18), '#000'); rv(g, p.above, p.cab[3][0] - 0.04, s * (W - 0.16), tail + 0.1, s * (W - 0.2), '#000'); }
        rv(g, p.above, p.cab[0][0] + 0.04, -W + 0.14, p.cab[0][0] + 0.08, W - 0.14, '#000'); rv(g, p.above, p.cab[3][0] - 0.02, -W + 0.16, p.cab[3][0] - 0.06, W - 0.16, '#000');
        rv(g, p.av, -W + 0.1, 0.44, W - 0.1, 0.46, '#000'); rv(g, p.ar, -W + 0.12, 0.7, W - 0.12, 0.72, '#000'); rv(g, p.ar, -W + 0.1, 0.36, W - 0.1, 0.38, '#000');
      });
      rv(g, p.sideOf, -2.7, p.low, 2.7, p.low + 0.06, '#16171c');
      g.strokeStyle = '#000'; g.lineWidth = 1; for (const x of p.xs) { const [cx, cy] = p.sideOf(x, p.r); g.beginPath(); g.arc(cx, cy, (ra + 0.06) * p.PX, Math.PI, 2 * Math.PI); g.stroke(); }
      R(g, '#ff8c1a', Math.round(p.sideOf(xf + ra + 0.12, 0)[0]), Math.round(p.sideOf(0, 0.52)[1]), 2, 1); // indicator repeater
      // glazing: side windows ringed in black, centre pillar; windscreen and rear window seen from above, from the front and from the rear
      poly(g, p.sideOf, narrowed(p.cab, 0.06), FRAME); pane(g, o, p.sideOf, narrowed(p.cab, 0.14));
      if (p.doors[1] > p.cab[3][0] && p.doors[1] < p.cab[0][0]) rv(g, p.sideOf, p.doors[1] - 0.02, belt, p.doors[1] - 0.1, 1.5, FRAME);
      const [[x0], [x1], [x2], [x3]] = p.cab;
      rv(g, p.above, x1 + 0.02, -hw, x0, hw, FRAME); pane(g, o, p.above, [[x0, -hw + 0.05], [x0, hw - 0.05], [x1 + 0.06, hw - 0.08], [x1 + 0.06, -hw + 0.08]]);
      rv(g, p.above, x3, -hw, x2 - 0.02, hw, FRAME); pane(g, o, p.above, [[x2 - 0.06, -hw + 0.08], [x2 - 0.06, hw - 0.08], [x3 + 0.04, hw - 0.05], [x3 + 0.04, -hw + 0.05]]);
      veil(g, 0.6, () => { for (const z of [-0.3, 0.25]) rv(g, p.above, x0 - 0.03, z, x0 - 0.08, z + 0.42, '#000'); }); // essuie-glaces
      rv(g, p.av, -hw, belt + 0.02, hw, 1.5, FRAME); pane(g, o, p.av, [[-hw + 0.05, belt + 0.06], [hw - 0.05, belt + 0.06], [hw - 0.05, 1.5], [-hw + 0.05, 1.5]]);
      rv(g, p.ar, -hw, beltR + 0.02, hw, 1.5, FRAME); pane(g, o, p.ar, [[-hw + 0.05, beltR + 0.06], [hw - 0.05, beltR + 0.06], [hw - 0.05, 1.5], [-hw + 0.05, 1.5]]);
      // front and rear specific to the model: air intakes, headlight housings, plate
      const ph = (z0, z1, y0, y1) => { for (const s of [-1, 1]) rv(g, p.av, s * z0, y0, s * z1, y1, '#2a2c34'); };
      const K = p.K;
      if (K === 'gtr') { grid(g, o, p.av, 0.55, 0.24, 0.4); grid(g, o, p.av, 0.3, 0.5, 0.6, 3); ph(0.38, 0.78, 0.55, 0.68); veil(g, 0.6, () => { rv(g, p.above, 1.5, -0.25, 1.85, 0.25, DARK); for (let x = 1.53; x < 1.85; x += 0.08) rv(g, p.above, x, -0.23, x + 0.03, 0.23, '#3a3c44'); });
        for (let k = 0; k < 3; k++) rv(g, p.sideOf, xf - ra - 0.14 - k * 0.07, 0.56, xf - ra - 0.17 - k * 0.07, 0.7, DARK); }
      if (K === 'fd') { grid(g, o, p.av, 0.42, 0.26, 0.4); for (const s of [-1, 1]) rv(g, p.av, s * 0.55, 0.26, s * 0.72, 0.34, DARK); veil(g, 0.5, () => rv(g, p.above, 1.0, -0.12, 1.2, 0.12, DARK)); }
      if (K === 'a80') { grid(g, o, p.av, 0.38, 0.26, 0.42); for (const s of [-1, 1]) rv(g, p.av, s * 0.55, 0.26, s * 0.75, 0.36, DARK); ph(0.42, 0.8, 0.46, 0.58); }
      if (K === 'r5') { grid(g, o, p.av, 0.38, 0.52, 0.66); ph(0.36, 0.68, 0.5, 0.68); plate(g, o, p.av, 0.44); }
      if (K === 'peykan') { grid(g, o, p.av, 0.4, 0.54, 0.78); ph(0.42, 0.72, 0.52, 0.8); plate(g, o, p.av, 0.34); }
      if (K === 'gts') { grid(g, o, p.av, 0.5, 0.24, 0.4, 3); veil(g, 0.7, () => { for (const s of [-1, 1]) rv(g, p.above, 0.45, s * 0.42, 0.8, s * 0.58, DARK); });
        for (let k = 0; k < 3; k++) rv(g, p.sideOf, xf - ra - 0.12 - k * 0.1, 0.42, xf - ra - 0.17 - k * 0.1, 0.62, DARK); }
      if (K === 'onca') { grid(g, o, p.av, 0.32, 0.26, 0.38); plate(g, o, p.av, 0.46, 0.4); // the Onça: a jaguar's coat. Matt black bonnet, rosettes on the rear of the flanks, the roof and the tail, which spread out toward the front
        veil(g, 0.9, () => rv(g, p.above, 0.52, -0.56, 1.86, 0.56, '#1b1a18'));
        const ros = (v, a, b) => { const [px, py] = v(a, b); R(g, '#17120e', (px | 0) - 1, (py | 0) - 1, 3, 3); R(g, '#a8702a', px | 0, py | 0, 2, 2); }; // a rosette: an open dark ring, the heart tawny
        for (let i = 0; i < 58; i++) { const t = rand() * rand(), x = tail + 0.1 + t * (0.7 - tail), y = p.low + 0.14 + rand() * (belt - p.low - 0.2); if (!p.xs.some(c => Math.hypot(x - c, y - p.r) < ra + 0.08)) ros(p.sideOf, x, y); }
        for (let i = 0; i < 44; i++) { const t = rand() * rand(), x = tail + 0.1 + t * (0.4 - tail), z = (rand() * 2 - 1) * (W - 0.1); if (!(x > x3 && x < x0 && Math.abs(z) < hw) || (x < x1 && x > x2)) ros(p.above, x, z); }
        for (let i = 0; i < 14; i++) ros(p.ar, (rand() * 2 - 1) * (W - 0.1), 0.42 + rand() * 0.4);
        { const [cx, cy] = p.sideOf(-0.02, 0.56); g.beginPath(); g.arc(cx, cy, 5.5, 0, 7); g.fillStyle = '#f0ece0'; g.fill(); for (const [dx, w] of [[-3, 1], [-1, 2], [2, 2]]) R(g, '#17120e', (cx | 0) + dx, (cy | 0) - 2, w, 5); R(g, '#f0ece0', (cx | 0) - 1, (cy | 0) - 1, 1, 1); R(g, '#f0ece0', (cx | 0) + 3, (cy | 0) + 1, 1, 1); } // the number in its white circle
        veil(g, 0.5, () => { for (let i = 0; i < 260; i++) { const x = tail + rand() * (nose - tail), [px, py] = p.sideOf(x, p.low + 0.04 + rand() * rand() * 0.42); R(g, '#4a3a22', px | 0, py | 0, 1 + (rand() * 2 | 0), 1); } }); } // the swamp mud
      veil(g, 0.5, () => { for (const s of [-1, 1]) rv(g, p.ar, s * 0.62, 0.24, s * 0.76, 0.3, DARK); }); // exhaust outlets
      plate(g, o, p.ar, p.plate);
      // light wear: splashes on the lower body and behind the wheels
      veil(g, 0.25, () => { for (let i = 0; i < 70; i++) { const x = tail + rand() * (nose - tail), [px, py] = p.sideOf(x, p.low + 0.06 + rand() * rand() * 0.4); R(g, '#2a241c', px | 0, py | 0, 1, 1); } });
      R(g, C, 120, 92, 8, 8); R(g, '#0c0c10', 120, 104, 8, 8); // flat tint and dark areas (plain parts, undersides)
    }],
    // car wheel: sidewall, rim (style depending on the model), caliper, nuts; tread band on the last row
    wheelCar: K => [64, 64, (g, o) => {
      const { R, veil } = o, cx = 32, cy = 29.5, rj = 19;
      R(g, '#141416', 0, 0, 64, 64); for (let x = 0; x < 64; x += 4) R(g, '#08080a', x, 58, 2, 6); // rubber and grooves: the rotation can be read
      const disc = (r, c) => { g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fillStyle = c; g.fill(); };
      disc(26, '#1a1a1e'); veil(g, 0.4, () => { g.strokeStyle = '#3a3a40'; g.beginPath(); g.arc(cx, cy, 23, 0, 7); g.stroke(); });
      disc(rj + 1, '#9a9ca4'); disc(rj - 1, '#26262c'); R(g, '#6a2024', 41, 20, 3, 5); // rim well, disc and caliper
      const c = K === 'onca' ? '#e2ddcc' : K === 'peykan' ? '#e4dcc8' : K === 'r5' ? '#d8d8dc' : K === 'gts' ? '#c8cad0' : K === 'fd' ? '#b8bac2' : K === 'a80' ? '#a8aab2' : '#7a7c84';
      const n = { gtr: 12, fd: 5, a80: 5, gts: 5 }[K] || 0;
      if (n) { g.strokeStyle = c; g.lineWidth = n > 6 ? 2 : K === 'a80' ? 5 : 3.5; for (let i = 0; i < n; i++) { const a = i * 2 * Math.PI / n; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * rj, cy + Math.sin(a) * rj); g.stroke(); } }
      else { disc(rj - 1, c); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.6; R(g, '#26262c', Math.round(cx + Math.cos(a) * 11) - 2, Math.round(cy + Math.sin(a) * 11) - 2, 4, 4); } }
      disc(5, c); disc(2.5, '#2a2a30'); for (let i = 0; i < 5; i++) { const a = i * 1.2566; R(g, '#e0e0e6', Math.round(cx + Math.cos(a) * 4), Math.round(cy + Math.sin(a) * 4), 1, 1); }
    }],
    // grained black plastics: bumpers, diffuser, spoiler uprights, wheel-arch backs
    carTrim: () => [16, 16, (g, o) => { const { R, rand, veil } = o; R(g, '#1a1b20', 0, 0, 16, 16); veil(g, 0.5, () => { for (let y = 0; y < 16; y += 4) for (let x = (y & 4) / 2; x < 16; x += 4) R(g, '#101114', x, y, 2, 2); }); veil(g, 0.1, () => { for (let i = 0; i < 6; i++) R(g, '#fff', rand() * 16 | 0, rand() * 16 | 0, 1, 1); }); }]
  });
})();
