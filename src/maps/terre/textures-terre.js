// Textures specific to "terre" (Spéciale des Ocres): completes the textures.js catalogue, same conventions. See docs/methods/SCENERY.md.
(() => {
  const plainText = (g, txt, x, y, px, col, wd = Infinity) => { g.fillStyle = col; g.font = 'bold ' + px + 'px sans-serif'; const w = g.measureText(txt).width; if (w > wd) g.font = 'bold ' + (px * wd / w).toFixed(1) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, x, y); }; // wd: the text shrinks to fit this width (the font varies from one system to another)
  Object.assign(TEXTURES, {
    // garrigue ground: ochre earth, light pebbles, redder patches, tufts of dry grass and thyme
    terreOchre: () => [64, 64, (g, o) => {
      const { R, rand, veil } = o; R(g, '#b0703c', 0, 0, 64, 64);
      veil(g, 0.35, () => { for (let i = 0; i < 9; i++) R(g, rand() < 0.5 ? '#c8562a' : '#d09a50', rand() * 56 | 0, rand() * 56 | 0, 6 + (rand() * 12 | 0), 5 + (rand() * 10 | 0)); });
      for (let i = 0; i < 380; i++) R(g, rand() < 0.5 ? '#9a5c30' : '#c08248', rand() * 64 | 0, rand() * 64 | 0, 1 + (rand() * 2 | 0), 1);
      for (let i = 0; i < 40; i++) R(g, '#e0c090', rand() * 64 | 0, rand() * 64 | 0, 1, 1);
      for (let i = 0; i < 46; i++) { const x = rand() * 62 | 0, y = rand() * 62 | 0; R(g, rand() < 0.6 ? '#8a8440' : '#5e7038', x, y, 2, 2); R(g, '#a89a50', x + 1, y - 1, 1, 1); }
    }],
    // ochre cliff: horizontal strata from blood red to yellow, vertical gullies, scree at the foot; the top of the texture is the top of the butte, crowned with garrigue
    cliffOchre: () => [64, 64, (g, o) => {
      const { R, rand, veil } = o, B = [['#6a7038', 4], ['#e8c070', 6], ['#e09848', 9], ['#d8702c', 8], ['#c84a20', 10], ['#e08a3c', 7], ['#b83c1c', 9], ['#c8683a', 11]]; let y = 0;
      for (const [c, hh] of B) { R(g, c, 0, y, 64, hh); for (let x = 0; x < 64; x += 2) if (rand() < 0.5) R(g, c, x, y - 1 - (rand() * 2 | 0), 2, 3); y += hh; }
      veil(g, 0.22, () => { for (let i = 0; i < 26; i++) R(g, rand() < 0.7 ? '#000' : '#fff', rand() * 64 | 0, 4 + (rand() * 30 | 0), 1 + (rand() * 2 | 0), 10 + (rand() * 30 | 0)); });
      for (let i = 0; i < 150; i++) R(g, rand() < 0.5 ? '#a04a24' : '#e0a060', rand() * 64 | 0, 4 + rand() * 60 | 0, 2, 1);
    }],
    // straw bale: golden stalks, two twines
    straw: () => [32, 32, (g, o) => {
      const { R, rand } = o; R(g, '#d8b050', 0, 0, 32, 32);
      for (let i = 0; i < 200; i++) R(g, rand() < 0.5 ? '#c09838' : '#ecd078', rand() * 32 | 0, rand() * 32 | 0, 1, 2 + (rand() * 4 | 0));
      for (const x of [9, 22]) R(g, '#7a5a28', x, 0, 1, 32);
    }],
    // channel tile roof: rows 50 cm apart, tiles of uneven tints, moss in places
    tilesCanal: () => [64, 64, (g, o) => {
      const { R, rand, veil } = o; R(g, '#c8643a', 0, 0, 64, 64);
      for (let y = 0; y < 64; y += 4) for (let x = 0; x < 64; x += 4) { R(g, ['#c8643a', '#b85530', '#d87a48', '#a84a2a', '#d08a58'][rand() * 5 | 0], x, y, 3, 4); R(g, '#7a3418', x + 3, y, 1, 4); }
      veil(g, 0.3, () => { for (let y = 3; y < 64; y += 4) R(g, '#000', 0, y, 64, 1); for (let i = 0; i < 8; i++) R(g, '#4a5a2a', rand() * 60 | 0, rand() * 60 | 0, 3 + (rand() * 4 | 0), 2); });
    }, 4],
    // ford water: a shallow stream over the earth, brown-green, dark enough to read against the ochre track; light ripples across the current, sky reflections, a few pebbles breaking the surface
    waterGue: () => [64, 64, (g, o) => {
      const { R, rand, veil } = o; R(g, '#5e5a3c', 0, 0, 64, 64);
      veil(g, 0.5, () => { for (let i = 0; i < 70; i++) R(g, rand() < 0.5 ? '#76683e' : '#46482e', rand() * 64 | 0, rand() * 64 | 0, 6 + (rand() * 14 | 0), 2 + (rand() * 3 | 0)); });
      for (let i = 0; i < 90; i++) R(g, rand() < 0.6 ? '#7e8a74' : '#a8b4a0', rand() * 64 | 0, rand() * 64 | 0, 3 + (rand() * 8 | 0), 1); // rides
      for (let i = 0; i < 22; i++) R(g, '#dce4e8', rand() * 64 | 0, rand() * 64 | 0, 2 + (rand() * 5 | 0), 1); // sky reflections on the crests of the ripples
      for (let i = 0; i < 6; i++) { const x = rand() * 60 | 0, y = rand() * 60 | 0; R(g, '#8a7a5a', x, y, 3, 2); R(g, '#c8d0cc', x, y - 1, 3, 1); } // pebbles, and the water breaking over them
    }, 6],
    // waterline foam: torn white fringes on a transparent background, denser in the middle of the texture (where the water touches the earth)
    foam: () => [64, 16, (g, o) => {
      const { R, rand } = o;
      for (let i = 0; i < 160; i++) { const y = 8 + (rand() + rand() + rand() - 1.5) * 6 | 0; R(g, rand() < 0.7 ? 'rgba(240,244,240,0.85)' : 'rgba(200,190,160,0.7)', rand() * 64 | 0, y, 2 + (rand() * 6 | 0), 1); }
    }, 4],
    // wet earth around the ford: dark mud, puddles and water-filled ruts; transparent at both ends (top and bottom of the texture) to blend into the dry track
    mudGue: () => [64, 64, (g, o) => {
      const { R, rand } = o;
      for (let y = 0; y < 64; y++) { const a = Math.min(1, Math.min(y, 63 - y) / 14); R(g, `rgba(74,52,32,${(0.75 * a).toFixed(2)})`, 0, y, 64, 1);
        for (let i = 0; i < 5; i++) if (rand() < a) R(g, rand() < 0.5 ? `rgba(60,58,44,${a.toFixed(2)})` : `rgba(110,82,52,${(0.8 * a).toFixed(2)})`, rand() * 64 | 0, y, 2 + (rand() * 6 | 0), 1); }
      for (const x of [17, 26, 36, 45]) for (let y = 10; y < 54; y += 2) if (rand() < 0.7) R(g, 'rgba(70,84,72,0.85)', x - 1 + (rand() * 3 | 0), y, 3, 2); // the ruts, full of water
    }],
    // track earth outside the central band (wide sections): same packed earth as the road, rolled and without ruts; the inner edge (left of the texture) is transparent, to blend into the road's edge
    terreCircuit: () => [64, 32, (g, o) => {
      const { R, rand } = o;
      for (let x = 0; x < 64; x++) { const a = Math.min(1, x / 16); R(g, `rgba(168,106,58,${a.toFixed(2)})`, x, 0, 1, 32); for (let i = 0; i < 6; i++) if (rand() < a) R(g, ['#8a5228', '#b87a48', '#96602f', '#c89058'][rand() * 4 | 0], x, rand() * 32 | 0, 1, 1); }
    }],
    // earth bank along the track: darker, packed earth on the road side (bottom of the texture), dry grass, pebbles and thyme toward the top; the tires have scored it in places
    embankCircuit: () => [64, 32, (g, o) => {
      const { R, rand, veil } = o; R(g, '#8e5a30', 0, 0, 64, 32);
      for (let i = 0; i < 260; i++) R(g, rand() < 0.5 ? '#7a4c26' : '#a8703e', rand() * 64 | 0, rand() * 32 | 0, 1 + (rand() * 2 | 0), 1);
      for (let i = 0; i < 70; i++) { const y = rand() * rand() * 16 | 0; R(g, rand() < 0.6 ? '#8a8440' : '#5e7038', rand() * 62 | 0, y, 2, 2); } // dry grass, at the top
      for (let i = 0; i < 30; i++) R(g, '#d8c09a', rand() * 64 | 0, 8 + rand() * 24 | 0, 1, 1); // cailloux
      veil(g, 0.25, () => { for (let i = 0; i < 6; i++) R(g, '#000', rand() * 56 | 0, 18 + rand() * 12 | 0, 8 + (rand() * 10 | 0), 1); }); // tire marks
    }],
    // lavender row: dense violet tufts, a few green stalks, earth between the feet
    lavender: () => [16, 16, (g, o) => {
      const { R, rand } = o; R(g, '#7a58b8', 0, 0, 16, 16);
      for (let i = 0; i < 60; i++) R(g, ['#9a78d8', '#6a48a0', '#b090e0', '#5a7a48'][rand() * 4 | 0], rand() * 16 | 0, rand() * 16 | 0, 1, 1 + (rand() * 2 | 0));
      for (let x = 0; x < 16; x += 4) R(g, '#8a5a34', x, 14, 1, 2);
    }],
    // special's banners: two invented advertisers per texture, k = the first
    bannerRallye: k => [192, 20, (g, o) => {
      const l = [['RALLYE DES OCRES', '#e8482a', '#f4f0e0'], ['HUILES MISTRAL', '#f4c020', '#1c2a5a'], ['PNEUS CIGALE', '#1c2a5a', '#f4f0e0'], ['RADIO CAILLOU 88.8', '#f4f0e0', '#e8482a'], ['GARRIGUE SPORT', '#2a62c8', '#f4c020'], ['SIROPS DU VALLON', '#3a7a3a', '#f4f0e0']];
      for (let j = 0; j < 2; j++) { const [t, f, c] = l[(k + j) % l.length], x = j * 96; o.R(g, f, x, 0, 96, 20); o.R(g, '#08080c', x, 0, 1, 20); plainText(g, t, x + 48, 10.5, 10, c, 88); } // 4 px margin on each side: a long name (RADIO CAILLOU 88.8) no longer overflows onto the neighboring advertiser
    }],
  });
  // the dirt track: th.road[7] = 'terre' repaints the common road as packed earth (no patches, no joints, no checkered edges).
  // The common drawing runs first: it draws rnd as many times as before, the scenery does not move; the earth is painted with rand, on top
  const roadway = TEXTURES.roadway;
  TEXTURES.roadway = (...a) => {
    const t = roadway(...a); if (a[7] !== 'terre') return t;
    const [asph, spk, edge, dash, k1, k2] = a, d = t[2];
    t[2] = (g, o) => {
      d(g, o); const { R, rand, veil } = o, px = n => rand() * n | 0;
      R(g, asph, 0, 0, 64, 256);
      for (let i = 0; i < 1400; i++) R(g, spk, px(64), px(256), 1, 1);
      veil(g, 0.25, () => { for (let i = 0; i < 700; i++) R(g, rand() < 0.6 ? '#000' : '#fff', px(64), px(256), 1, 1); });
      veil(g, 0.16, () => { for (const x of [17, 26, 36, 45]) for (let y = 0; y < 256; y += 2) R(g, '#000', x - 2 + px(3), y, 4, 2); }); // ruts
      for (let i = 0; i < 600; i++) R(g, [edge, k1, k2][px(3)], rand() < 0.5 ? px(9) : 55 + px(9), px(256), 1 + px(2), 1 + px(3)); // verges blended into the earth
      for (let i = 0; i < 220; i++) R(g, dash, 27 + px(10), px(256), 1, 1); // gravel thrown onto the camber
    };
    return t;
  };
})();
