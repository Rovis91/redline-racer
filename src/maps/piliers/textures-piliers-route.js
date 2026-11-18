// Road and tunnel textures of Sky Pillars (piliers). Road: th.roadTex = 'routePiliers' (same 7 th.road settings as roadwayFine).
// Tunnel: th.tun.tex = ['tunMurPiliers', 'tunVoutePiliers'] (engine wall and vault, arguments ignored). The tunnel floor is the engine's roadway drawn with th.tun.ground.
// Walls: 64 x 64 px, x = from the top of the wall (0) to its foot, y = along the track, 8 m per tile.
(() => {
  const over = extra => (...a) => { const [w, h, d, ...r] = TEXTURES.roadwayFine(...a); return [w, h, (g, o) => { d(g, o); g.globalCompositeOperation = 'source-atop'; extra(g, o, a); if (!a[6]) { g.globalCompositeOperation = 'destination-over'; g.fillStyle = a[0]; g.fillRect(0, 0, w, h); } g.globalCompositeOperation = 'source-over'; }, ...r]; };
  const pts = (g, { R, rand, veil }, n, c, a, x0 = 16, x1 = 110, w = 1, h = 1) => veil(g, a, () => { for (let i = 0; i < n; i++) R(g, c, x0 + rand() * (x1 - x0) | 0, rand() * 512 | 0, w, h); });
  const crack = (g, { R, rand, veil }, a, x, y, len) => veil(g, a, () => { for (let i = 0; i < len; i++) { if (rand() < 0.35) x += rand() < 0.5 ? -1 : 1; y = (y + 1) % 512; R(g, '#000', x, y, 1, 1); } });
  Object.assign(TEXTURES, {
    // cool blue-grey maintained mountain asphalt, 2W x 32 m: fine bluish aggregate, a few darker resurfacing strips with straight edges, hairline cracks,
    // pine needles and grit at the verges (small dark-green and brown specks, denser near the parapet). No water, no light patch.
    routePiliers: over((g, o) => {
      const { R, rand, veil } = o;
      pts(g, o, 2200, '#5d6f78', 0.18); // bluish aggregate
      veil(g, 0.09, () => { for (let i = 0; i < 4; i++) { const x = 18 + rand() * 50 | 0, y = rand() * 440 | 0, w = 20 + rand() * 40 | 0, h = 14 + rand() * 50 | 0; R(g, '#000', x, y, w, h); } });
      crack(g, o, 0.28, 46, 90, 120); crack(g, o, 0.28, 80, 330, 100);
      for (const [x0, x1] of [[15, 28], [100, 111]]) { pts(g, o, 260, '#3c4a30', 0.4, x0, x1); pts(g, o, 160, '#6a5a3a', 0.35, x0, x1); pts(g, o, 120, '#000', 0.4, x0, x1); }
    }),
    // the dirt stretches (scenery-piliers.js, DIRT): packed ochre earth, 2w x 16 m, u across the road. Two pale wheel tracks pressed smooth, a darker crown between them with gravel and a few tufts,
    // loose stones, moss and grass creeping in from both verges. No markings.
    pistePiliers: () => [64, 128, (g, o) => { const { R, rand, veil } = o; R(g, '#8a7453', 0, 0, 64, 128);
      veil(g, 0.16, () => { for (let i = 0; i < 700; i++) R(g, i % 3 ? '#000' : '#fff', rand() * 64 | 0, rand() * 128 | 0, 1 + (rand() * 2 | 0), 1); });
      veil(g, 0.2, () => { for (let i = 0; i < 26; i++) R(g, i & 1 ? '#3a2c1c' : '#c9b48a', rand() * 60 | 0, rand() * 124 | 0, 3 + (rand() * 8 | 0), 2 + (rand() * 5 | 0)); }); // damp and dry patches
      for (const x of [17, 40]) { veil(g, 0.3, () => { for (let y = 0; y < 128;) { const l = 6 + (rand() * 20 | 0); R(g, '#c2ab82', x + (rand() * 2 | 0), y, 6, l); y += l; } }); veil(g, 0.3, () => { for (let y = 0; y < 128; y += 2 + (rand() * 5 | 0)) R(g, '#4a3a26', x + (rand() < 0.5 ? -1 : 6), y, 1, 2); }); } // the wheel tracks and their dark edges
      veil(g, 0.5, () => { for (let i = 0; i < 70; i++) R(g, i % 4 ? '#b9b3a2' : '#5b5648', 26 + (rand() * 12 | 0), rand() * 128 | 0, 1, 1); for (let i = 0; i < 40; i++) R(g, '#b9b3a2', rand() * 64 | 0, rand() * 128 | 0, 1, 1); }); // gravel on the crown, loose stones
      veil(g, 0.55, () => { for (let i = 0; i < 14; i++) R(g, i & 1 ? '#4e7752' : '#6fa05c', 28 + (rand() * 8 | 0), rand() * 126 | 0, 1 + (rand() * 2 | 0), 2); // tufts on the crown
        for (let y = 0; y < 128; y += 1 + (rand() * 3 | 0)) for (const sd of [0, 1]) { const w = 2 + (rand() * 6 | 0); R(g, rand() < 0.5 ? '#4e7752' : '#3f6b46', sd ? 64 - w : 0, y, w, 2); } }); }, 16],
    // rough-cut sandstone tunnel wall: blasted face with pick and drill-hole marks, vertical overbreak joints, soot toward the lamp line, damp dark patches low down
    tunMurPiliers: () => [64, 64, (g, o) => {
      const { R, rand, veil } = o; R(g, '#8a7a62', 0, 0, 64, 64);
      veil(g, 0.2, () => { for (let i = 0; i < 70; i++) R(g, rand() < 0.6 ? '#000' : '#d8c8a4', rand() * 64 | 0, rand() * 64 | 0, 2 + rand() * 6 | 0, 1 + rand() * 3 | 0); });
      veil(g, 0.25, () => { for (let i = 0; i < 5; i++) { let x = 6 + rand() * 50 | 0; for (let y = rand() * 40 | 0, n = 14 + rand() * 20 | 0; n > 0; n--, y++) { if (rand() < 0.3) x += rand() < 0.5 ? -1 : 1; R(g, '#000', x, y % 64, 1, 1); } } });
      veil(g, 0.4, () => { for (let y = 3; y < 64; y += 11) R(g, '#000', 5 + rand() * 40 | 0, y, 1, 1); }); // drill holes
      veil(g, 0.22, () => { R(g, '#000', 0, 0, 10, 64); for (let i = 0; i < 6; i++) R(g, '#000', 40 + rand() * 20 | 0, rand() * 64 | 0, 6 + rand() * 12 | 0, 3 + rand() * 8 | 0); });
    }, 8],
    // vault of the same rock: darker, overbreak bulges and hanging drip marks, no regular ribs
    tunVoutePiliers: () => [64, 64, (g, o) => {
      const { R, rand, veil } = o; R(g, '#6a5c4a', 0, 0, 64, 64);
      veil(g, 0.22, () => { for (let i = 0; i < 80; i++) R(g, rand() < 0.65 ? '#000' : '#bfae8a', rand() * 64 | 0, rand() * 64 | 0, 2 + rand() * 7 | 0, 1 + rand() * 3 | 0); });
      veil(g, 0.3, () => { for (let i = 0; i < 6; i++) R(g, '#000', rand() * 56 | 0, rand() * 56 | 0, 6 + rand() * 10 | 0, 4 + rand() * 8 | 0); });
    }, 8],
  });
})();
