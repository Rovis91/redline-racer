// Textures propres à « givre » (Nuit Blanche) : complète le catalogue de textures.js, mêmes conventions. Voir METHODE-DECOR.md.
(() => {
  Object.assign(TEXTURES, {
    // neige vierge des pentes : rides du vent claires et sombres, ombres bleues des congères, quelques cristaux qui accrochent la lumière
    neigeVierge: () => [64, 64, (g, o) => {
      const { R, alea, voile } = o; R(g, '#d2dcf0', 0, 0, 64, 64);
      for (let i = 0; i < 260; i++) R(g, alea() < 0.5 ? '#c4d0e8' : '#e2eaf8', alea() * 64 | 0, alea() * 64 | 0, 2 + (alea() * 6 | 0), 1);
      voile(g, 0.22, () => { for (let i = 0; i < 7; i++) { const x = alea() * 50 | 0, y = alea() * 60 | 0, w = 10 + (alea() * 14 | 0); R(g, '#4a5c90', x, y, w, 2); R(g, '#fff', x + 1, y - 1, w - 2, 1); } });
      for (let i = 0; i < 36; i++) R(g, '#ffffff', alea() * 64 | 0, alea() * 64 | 0, 1, 1);
    }, 10],
    // glace vive sur la chaussée (14 m de large, 9 pixels par mètre, 8 dans la longueur) : la surface la plus calme de l'image, un bleu glacier presque uni
    // (grain tiré dans le sens de la route à quelques pour cent de contraste), reflets polis et fissures en voile léger, bords déchiquetés.
    // L'alpha sert deux fois : 0 = pas de glace (pixel écarté par alphaTest), 0,8 = glace, un peu luisante sous la lumière dynamique (plus brillante, elle renvoie le ciel et se confond de loin avec la neige).
    // bout = 1 : les 10 derniers mètres d'une plaque, en langues qui s'effilent vers le bas de la texture
    glaceVive: bout => [128, bout ? 160 : 512, (g, o) => {
      const { R, alea, voile } = o, W = 128, H = bout ? 160 : 512; R(g, '#3a74ac', 0, 0, W, H);
      for (let i = 0; i < H * 6; i++) R(g, alea() < 0.5 ? '#3670a7' : '#3f79b1', alea() * W | 0, alea() * H | 0, 1, 4 + (alea() * 24 | 0)); // grain fin, tiré dans le sens de la route
      voile(g, 0.22, () => { for (let i = 0; i < H / 6; i++) R(g, '#cfeaff', alea() * W | 0, alea() * H | 0, 1, 20 + (alea() * 60 | 0)); }); // reflets polis, longs et fins
      voile(g, 0.3, () => { for (let i = 0; i < H / 24; i++) { let x = 12 + alea() * 104 | 0, y = alea() * H | 0; for (let k = 0; k < 52; k++) { R(g, '#eef8ff', x, y, 1, 1); if (alea() < 0.5) x += alea() < 0.5 ? -1 : 1; y = (y + 1) % H; } } }); // fissures
      voile(g, 0.2, () => { for (let i = 0; i < H / 4; i++) R(g, '#f2f8ff', alea() * (W - 2) | 0, alea() * H | 0, 2, 1); }); // givre accroché
      g.globalCompositeOperation = 'destination-out';
      g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#000';
      for (let y = 0; y < H; y += 8) { g.fillRect(0, y, 2 + (alea() * 10 | 0), 8); const w = 2 + (alea() * 10 | 0); g.fillRect(W - w, y, w, 8); }
      if (bout) for (let x = 0; x < W; x += 8) { const t = 28 + (alea() * 116 | 0); g.fillRect(x, t, 8, H - t); if (alea() < 0.5) g.fillRect(x + (alea() < 0.5 ? -4 : 8), t - 16, 4, 16); }
      g.globalCompositeOperation = 'source-over';
    }],
    // les sommets en couronne, à 1,1-1,7 km (decors-givre.js, posé avec rep [3, 1] : 0,5 à 0,8 px/m au lieu de 0,1) : roche en strates obliques et couloirs, neige au-dessus d'une limite
    // déchiquetée (le haut de la texture est le haut du pic) qui descend en coulées ; peu contrasté, c'est un fond. Raccord gauche-droite exact (fréquences entières), pour la répétition autour du cône
    rocNeigeLoin: () => [512, 512, (g, o) => {
      const { R, alea, voile } = o, W = 512, P = 6.2832 / W, R2 = (c, x, y, w, h) => { R(g, c, x, y, w, h); if (x + w > W) R(g, c, x - W, y, w, h); };
      R(g, '#6f7480', 0, 0, W, 512);
      voile(g, 0.14, () => { for (let i = 0; i < 70; i++) { const x0 = alea() * W | 0, y0 = 150 + alea() * 362 | 0, c = alea() < 0.5 ? '#5c606c' : '#7c818c'; for (let k = 0; k < 24; k++) R2(c, (x0 + k * 4) % W, y0 + k * 2, 8, 6); } }); // strates obliques, larges et douces
      voile(g, 0.22, () => { for (let i = 0; i < 400; i++) R2(alea() < 0.7 ? '#5c606c' : '#7c818c', alea() * W | 0, 140 + alea() * 372 | 0, 2, 6 + (alea() * 40 | 0)); }); // ravines
      const ph = [alea(), alea(), alea()].map(a => a * 6.2832), lim = x => 190 + 34 * Math.sin(2 * P * x + ph[0]) + 18 * Math.sin(5 * P * x + ph[1]) + 9 * Math.sin(13 * P * x + ph[2]);
      const cou = []; for (let x = 0; x < W; x += 2) { const h = lim(x) + (alea() * 10 | 0); R(g, '#e8edf5', x, 0, 2, h); if (alea() < 0.1) cou.push([x, h, 12 + (alea() * 50 | 0)]); } // neige
      voile(g, 0.3, () => cou.forEach(([x, h, l]) => R(g, '#dfe6f0', x, h, 4, l))); // coulées, larges et pâles
      voile(g, 0.25, () => { for (let i = 0; i < 160; i++) R2('#b8c4da', alea() * W | 0, alea() * 200 | 0, 2, 8 + (alea() * 40 | 0)); }); // reliefs de la neige
    }],
    // sapin chargé de neige : rameaux sombres en nappes, un paquet de neige sur chaque étage
    sapinNeige: () => [64, 64, (g, o) => {
      const { R, alea, voile } = o; R(g, '#16302c', 0, 0, 64, 64);
      voile(g, 0.2, () => { for (let i = 0; i < 150; i++) R(g, alea() < 0.6 ? '#000' : '#6a9a8a', alea() * 64 | 0, alea() * 64 | 0, 2 + (alea() * 3 | 0), 1 + (alea() * 2 | 0)); });
      for (let y = 3; y < 64; y += 9) for (let x = 0; x < 64; x += 3) if (alea() < 0.72) { const d = alea() * 3 | 0; R(g, '#e6eefa', x, y + d, 3, 3 + (alea() * 2 | 0)); R(g, '#a8b8d8', x, y + d + 3, 3, 1); R(g, '#0c1c1a', x, y + d + 4, 3, 1); }
    }],
    // falaise à l'ombre (posée en ruban : la gauche de la texture est le pied, la droite le sommet) : roche sombre litée, coulées de glace qui pendent du sommet, neige en corniche
    rocGivre: () => [64, 64, (g, o) => {
      const { R, alea, voile } = o; R(g, '#39414f', 0, 0, 64, 64);
      for (let i = 0; i < 240; i++) R(g, alea() < 0.5 ? '#2c333f' : '#4a5364', alea() * 64 | 0, alea() * 64 | 0, 3 + (alea() * 9 | 0), 1 + (alea() * 2 | 0));
      voile(g, 0.4, () => { for (let i = 0; i < 9; i++) R(g, '#10141c', alea() * 50 | 0, alea() * 64 | 0, 6 + (alea() * 18 | 0), 1); }); // failles
      for (let i = 0; i < 18; i++) { const l = 8 + (alea() * 30 | 0), y = alea() * 64 | 0; R(g, '#9fbce0', 58 - l, y, l, 1); R(g, '#d8e8fa', 58 - (l >> 1), y, l >> 1, 2); } // glace
      for (let y = 0; y < 64; y += 2) R(g, '#e6eefa', 57 - (alea() * 4 | 0), y, 12, 2);
    }],
  });
})();
