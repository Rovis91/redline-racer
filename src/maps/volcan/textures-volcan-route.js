// Road and tunnel textures of Volcanic Island (volcan), reworked towards Svalbard / Iceland: black rock, wet cold light.
// Road: th.roadTex = 'routeVolcan' (same 7 th.road settings as roadwayFine). Tunnel: th.tun.tex = ['tunMurVolcan', 'tunVouteVolcan'].
// Walls: 64 x 64 px, x = from the top of the wall (0) to its foot, y = along the track, 8 m per tile.
(() => {
  const over = extra => (...a) => { const [w, h, d, ...r] = TEXTURES.roadwayFine(...a); return [w, h, (g, o) => { d(g, o); g.globalCompositeOperation = 'source-atop'; extra(g, o, a); if (!a[6]) { g.globalCompositeOperation = 'destination-over'; g.fillStyle = a[0]; g.fillRect(0, 0, w, h); } g.globalCompositeOperation = 'source-over'; }, ...r]; };
  const pts = (g, { R, rand, veil }, n, c, a, x0 = 16, x1 = 110, w = 1, h = 1) => veil(g, a, () => { for (let i = 0; i < n; i++) R(g, c, x0 + rand() * (x1 - x0) | 0, rand() * 512 | 0, w, h); });
  const crack = (g, { R, rand, veil }, a, x, y, len) => veil(g, a, () => { for (let i = 0; i < len; i++) { if (rand() < 0.35) x += rand() < 0.5 ? -1 : 1; y = (y + 1) % 512; R(g, '#000', x, y, 1, 1); } });
  Object.assign(TEXTURES, {
    // lighter basalt-grey asphalt (it must leave the black rock), 2W x 32 m: grey-blue chippings, drifts of black volcanic ash blown onto both verges in irregular tongues,
    // scoria gravel (rust-red and black grit), cold-patched strips, frost-heave cracks, a few moss-green specks at the very edge. Still clearly lighter than the ash.
    routeVolcan: over((g, o) => {
      const { R, rand, veil } = o;
      pts(g, o, 2200, '#6c7278', 0.18);
      for (const [x0, x1, dir] of [[15, 38, 1], [88, 111, -1]]) for (let i = 0; i < 9; i++) { // ash tongues: a dark blob that fades toward the lane
        const y = rand() * 500 | 0, l = 20 + rand() * 60 | 0; veil(g, 0.2, () => { for (let k = 0; k < 90; k++) R(g, '#101012', dir > 0 ? x0 + rand() * rand() * (x1 - x0) | 0 : x1 - rand() * rand() * (x1 - x0) | 0, y + rand() * l | 0, 1 + (rand() * 2 | 0), 1); }); }
      pts(g, o, 220, '#7a3a2a', 0.45, 16, 110); pts(g, o, 180, '#101012', 0.5, 16, 110, 2, 1); // scoria grit
      veil(g, 0.09, () => { for (let i = 0; i < 4; i++) R(g, '#000', 20 + rand() * 50 | 0, rand() * 440 | 0, 18 + rand() * 36 | 0, 14 + rand() * 50 | 0); });
      crack(g, o, 0.3, 50, 140, 130); crack(g, o, 0.3, 84, 400, 100);
      for (const [x0, x1] of [[15, 22], [105, 111]]) pts(g, o, 40, '#4a5e34', 0.5, x0, x1);
    }),
    // basalt gallery wall, hammered and sprayed: columnar jointing (vertical hexagonal-looking cracks), black-grey face, wet seepage streaks, white mineral crust at the cracks
    tunMurVolcan: () => [64, 64, (g, o) => {
      const { R, rand, veil } = o; R(g, '#2a2d32', 0, 0, 64, 64);
      veil(g, 0.2, () => { for (let i = 0; i < 90; i++) R(g, rand() < 0.6 ? '#000' : '#8a9098', rand() * 64 | 0, rand() * 64 | 0, 1 + rand() * 4 | 0, 1 + rand() * 2 | 0); });
      veil(g, 0.4, () => { for (let x = 6; x < 60; x += 9 + (rand() * 6 | 0)) { let xx = x; for (let y = 0; y < 64; y++) { if (rand() < 0.25) xx += rand() < 0.5 ? -1 : 1; R(g, '#000', xx, y, 1, 1); } } }); // column joints, vertical and slightly wandering
      veil(g, 0.15, () => { for (let i = 0; i < 12; i++) R(g, '#9aa8b0', 4 + rand() * 54 | 0, rand() * 64 | 0, 1, 3 + rand() * 12 | 0); }); // wet mineral streaks
      veil(g, 0.3, () => { R(g, '#000', 52, 0, 12, 64); });
      for (const [x, y, w, ht] of [[6, 6, 22, 15], [30, 38, 18, 20]]) { R(g, '#14161a', x - 1, y - 1, w + 2, ht + 2); R(g, '#64665f', x, y, w, ht); veil(g, 0.35, () => { for (let i = 0; i < 40; i++) R(g, rand() < 0.5 ? '#4a4c48' : '#a2a39a', x + rand() * w | 0, y + rand() * ht | 0, 1 + (rand() * 2 | 0), 1); R(g, '#3a3c3c', x + 3, y + ht - 4, 2, 6); }); } // shotcrete patches: pale, speckled, dark-edged, with a seepage stain
      for (let x = 12; x < 52; x += 20) for (let y = 4; y < 64; y += 21) { R(g, '#0c0d10', x - 1, y - 1, 5, 5); R(g, '#8b9096', x, y, 3, 3); R(g, '#d0b27a', x + 1, y + 2, 1, 4); } // rock bolts: plates on a 2.5 m grid, rust running from each
    }, 8],
    // basalt gallery vault: flatter, darker, broken by overbreak hollows and a few rock-bolt heads
    tunVouteVolcan: () => [64, 64, (g, o) => {
      const { R, rand, veil } = o; R(g, '#202328', 0, 0, 64, 64);
      veil(g, 0.22, () => { for (let i = 0; i < 80; i++) R(g, rand() < 0.65 ? '#000' : '#7a8088', rand() * 64 | 0, rand() * 64 | 0, 2 + rand() * 6 | 0, 1 + rand() * 3 | 0); });
      veil(g, 0.35, () => { for (let i = 0; i < 5; i++) R(g, '#000', rand() * 54 | 0, rand() * 54 | 0, 6 + rand() * 10 | 0, 4 + rand() * 8 | 0); });
      veil(g, 0.5, () => { for (let x = 8; x < 64; x += 24) for (let y = 8; y < 64; y += 16) R(g, '#8a8e94', x + (rand() * 3 | 0), y + (rand() * 3 | 0), 2, 2); });
      R(g, '#14161a', 17, 21, 27, 19); R(g, '#64665f', 18, 22, 25, 17); veil(g, 0.35, () => { for (let i = 0; i < 40; i++) R(g, rand() < 0.5 ? '#4a4c48' : '#a2a39a', 18 + rand() * 25 | 0, 22 + rand() * 17 | 0, 1 + (rand() * 2 | 0), 1); }); // a shotcrete patch over an overbreak hollow
      for (let x = 6; x < 64; x += 20) for (let y = 4; y < 64; y += 20) { R(g, '#0c0d10', x - 1, y - 1, 5, 5); R(g, '#8b9096', x, y, 3, 3); }
    }, 8],
  });
})();