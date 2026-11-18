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
