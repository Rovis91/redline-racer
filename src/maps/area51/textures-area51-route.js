// Road and tunnel textures of Area 51 (area51): the base's service tarmac (th.roadTex = 'routeArea51', same 7 th.road settings as roadwayFine)
// and plain catalogue entries for the underground complex B1 and hall H1 that the map's own shapes apply (the engine shell is switched off there).
// Walls: 64 x 64 px, x = from the top of the wall (0) to its foot, y = along the track, 8 m per tile (the engine's ribbon length); floors: 64 px = 8 m.
(() => {
  const over = extra => (...a) => { const [w, h, d, ...r] = TEXTURES.roadwayFine(...a); return [w, h, (g, o) => { d(g, o); g.globalCompositeOperation = 'source-atop'; extra(g, o, a); if (!a[6]) { g.globalCompositeOperation = 'destination-over'; g.fillStyle = a[0]; g.fillRect(0, 0, w, h); } g.globalCompositeOperation = 'source-over'; }, ...r]; };
  const pts = (g, { R, rand, veil }, n, c, a, x0 = 16, x1 = 110, w = 1, h = 1) => veil(g, a, () => { for (let i = 0; i < n; i++) R(g, c, x0 + rand() * (x1 - x0) | 0, rand() * 512 | 0, w, h); });
  const crack = (g, { R, rand, veil }, a, x, y, len, c = '#000') => veil(g, a, () => { for (let i = 0; i < len; i++) { if (rand() < 0.35) x += rand() < 0.5 ? -1 : 1; y = (y + 1) % 512; R(g, c, x, y, 1, 1); } });
  const grain = (g, { R, rand, veil }, n) => veil(g, 0.2, () => { for (let i = 0; i < n; i++) { R(g, '#000', rand() * 64 | 0, rand() * 64 | 0, 1, 1); if (i % 3 === 0) R(g, '#fff', rand() * 64 | 0, rand() * 64 | 0, 1, 1); } });
  Object.assign(TEXTURES, {
    // dark segmented service tarmac, 2W x 32 m: slabs poured in 4 m bays (cross joints at staggered offsets in the two halves), sealed cracks (wide dark bitumen lines),
    // tyre-black wheel paths with oil drips, desert dust blown to the edges (sand colour, never lighter than the verge)
    routeArea51: over((g, o) => {
      const { R, rand, veil } = o;
      veil(g, 0.3, () => { for (let y = 0; y < 512; y += 64) { const j = y + (rand() * 8 | 0); R(g, '#000', 16, j, 46, 1); R(g, '#000', 66, j + 32, 44, 1); } }); // 4 m bays, left and right halves offset by 2 m
      for (const [x, y, l] of [[30, 20, 150], [92, 260, 120], [52, 380, 70]]) { crack(g, o, 0.5, x, y, l); crack(g, o, 0.2, x + 1, y, l, '#9aa4b0'); } // sealed crack with a faint sheen beside it
      for (const [x0, x1] of [[15, 30], [98, 111]]) pts(g, o, 700, '#8d7860', 0.2, x0, x1);
      pts(g, o, 60, '#000', 0.4, 34, 92, 2, 2);
    }),
    // reactor-complex wall: board-marked concrete poured in 2 m lifts (horizontal formwork joints), tie-holes, white efflorescence, pipe bracket shadows, yellow-and-black hazard band 30 cm at the foot
    tunMurArea51: () => [64, 64, (g, o) => {
      const { R, rand, veil } = o; R(g, '#6e7466', 0, 0, 64, 64); grain(g, o, 400);
      veil(g, 0.12, () => { for (let i = 0; i < 6; i++) R(g, i & 1 ? '#fff' : '#000', rand() * 50 | 0, rand() * 56 | 0, 6 + rand() * 12 | 0, 6 + rand() * 14 | 0); });
      veil(g, 0.3, () => { for (const x of [0, 21, 42]) R(g, '#000', x, 0, 1, 64); for (const y of [0, 32]) for (let x = 3; x < 56; x += 21) R(g, '#000', x, y + 8, 1, 1); });
      veil(g, 0.25, () => { for (let i = 0; i < 9; i++) R(g, '#000', 4 + rand() * 40 | 0, rand() * 64 | 0, 1, 6 + rand() * 20 | 0); });
      for (let y = 0; y < 64; y += 8) { R(g, '#d9a82c', 56, y, 8, 4); R(g, '#16181a', 56, y + 4, 8, 4); }
      veil(g, 0.3, () => R(g, '#000', 55, 0, 1, 64));
    }, 8],
    // reactor-complex ceiling: poured slab with 1 m coffers, dark cable trays, rust and condensation at the joints
    tunVouteArea51: () => [64, 64, (g, o) => {
      const { R, rand, veil } = o; R(g, '#4a5058', 0, 0, 64, 64); grain(g, o, 300);
      veil(g, 0.35, () => { for (const k of [0, 32]) { R(g, '#000', 0, k, 64, 1); R(g, '#000', k, 0, 1, 64); } for (let x = 8; x < 64; x += 16) R(g, '#000', x, 16, 8, 1); });
      R(g, '#22262c', 28, 0, 8, 64); veil(g, 0.5, () => { for (let y = 0; y < 64; y += 4) R(g, '#000', 28, y, 8, 1); });
      veil(g, 0.3, () => { for (let i = 0; i < 6; i++) R(g, '#5a2a10', 2 + rand() * 58 | 0, rand() * 60 | 0, 1, 3 + rand() * 6 | 0); });
    }, 8],
    // reactor-complex floor and hall H1 floor: dark polished concrete in 4 m bays (saw-cut joints), tyre marks and oil, a worn yellow tow-line dash (20 cm x 3 m) once per tile, to be placed by the scenery where the line runs
    tunSolArea51: () => [64, 64, (g, o) => {
      const { R, rand, veil } = o; R(g, '#262d36', 0, 0, 64, 64); grain(g, o, 500);
      veil(g, 0.35, () => { for (const k of [0, 32]) { R(g, '#000', 0, k, 64, 1); R(g, '#000', k, 0, 1, 64); } });
      veil(g, 0.18, () => { for (let i = 0; i < 5; i++) R(g, '#000', 4 + rand() * 50 | 0, rand() * 56 | 0, 4 + rand() * 10 | 0, 3 + rand() * 8 | 0); });
      veil(g, 0.12, () => { for (let i = 0; i < 3; i++) R(g, '#7a8ea0', 4 + rand() * 50 | 0, rand() * 60 | 0, 5 + rand() * 8 | 0, 2); }); // dull sheen of oil
      R(g, '#d9a82c', 12, 40, 2, 24); veil(g, 0.4, () => { for (let i = 0; i < 20; i++) R(g, '#000', 12, 40 + rand() * 24 | 0, 2, 1); });
    }, 8],
  });
})();
