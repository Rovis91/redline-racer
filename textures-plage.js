// Textures propres à « plage » (Playa 307, Riviera Maya à midi) : complète le catalogue de textures.js, mêmes conventions. Voir METHODE-DECOR.md.
(() => {
  const grain = (g, o, n, cols, w = 64, h = 64) => { for (let i = 0; i < n; i++) o.R(g, cols[o.alea() * cols.length | 0], o.alea() * w | 0, o.alea() * h | 0, 1, 1); };
  Object.assign(TEXTURES, {
    // sable sec de la plage : presque blanc, grains, petites rides du vent, traces de pas
    sableSec: () => [64, 64, (g, o) => {
      const { R, alea, voile } = o; R(g, '#f4ecd8', 0, 0, 64, 64); grain(g, o, 700, ['#e8dcc0', '#fff8ea', '#dccfae']);
      voile(g, 0.25, () => { for (let y = 2; y < 64; y += 5) for (let x = 0; x < 64; x += 2) R(g, '#bfae85', x, y + (Math.sin(x * 0.3 + y) * 1.5 | 0), 2, 1); });
      for (let i = 0; i < 10; i++) { const x = alea() * 60 | 0, y = alea() * 60 | 0; R(g, '#d6c8a4', x, y, 2, 3); R(g, '#d6c8a4', x + 3, y + 4, 2, 3); }
    }, 6],
    // sable dur et humide du milieu de la plage (la piste) : plus foncé, lissé, traces de pneus le long, laisse de coquillages
    sableDur: () => [64, 256, (g, o) => {
      const { R, alea, voile } = o; R(g, '#d9c9a3', 0, 0, 64, 256); grain(g, o, 1400, ['#cbb98f', '#e4d6b4', '#c4b088'], 64, 256);
      voile(g, 0.3, () => { for (const x of [14, 22, 40, 49]) for (let y = 0; y < 256; y += 2) R(g, '#a8966c', x + (Math.sin(y * 0.05 + x) * 2 | 0), y, 3, 2); }); // ornières
      voile(g, 0.25, () => { for (let i = 0; i < 12; i++) R(g, '#fff4dc', alea() * 64 | 0, alea() * 256 | 0, 6 + (alea() * 14 | 0), 2); }); // reflets de l'eau restée
      for (let i = 0; i < 40; i++) R(g, alea() < 0.5 ? '#fff8f0' : '#e8a890', alea() * 64 | 0, alea() * 256 | 0, 1, 1); // coquillages
    }],
    // mer des Caraïbes vue de près : turquoise, rides claires, reflets du soleil
    merTurquoise: () => [64, 64, (g, o) => {
      const { R, alea, voile } = o; R(g, '#19c7c9', 0, 0, 64, 64);
      voile(g, 0.5, () => { for (let i = 0; i < 60; i++) R(g, alea() < 0.5 ? '#12b0bc' : '#2fd8d4', alea() * 64 | 0, alea() * 64 | 0, 6 + (alea() * 16 | 0), 2 + (alea() * 2 | 0)); });
      for (let i = 0; i < 80; i++) R(g, '#7eeee6', alea() * 64 | 0, alea() * 64 | 0, 2 + (alea() * 6 | 0), 1);
      for (let i = 0; i < 26; i++) R(g, '#ffffff', alea() * 64 | 0, alea() * 64 | 0, 1 + (alea() * 3 | 0), 1);
    }, 10],
    // le large : bleu profond, moins de détails
    merLarge: () => [64, 64, (g, o) => {
      const { R, alea, voile } = o; R(g, '#0a7fa8', 0, 0, 64, 64);
      voile(g, 0.5, () => { for (let i = 0; i < 50; i++) R(g, alea() < 0.5 ? '#0c6e98' : '#1592b8', alea() * 64 | 0, alea() * 64 | 0, 8 + (alea() * 18 | 0), 2); });
      for (let i = 0; i < 30; i++) R(g, '#8fd8ee', alea() * 64 | 0, alea() * 64 | 0, 2 + (alea() * 4 | 0), 1);
    }, 24],
    // écume du bord de l'eau : franges blanches déchirées sur fond transparent, sargasses brunes du côté du sable (haut de la texture)
    ecumeMer: () => [64, 16, (g, o) => {
      const { R, alea } = o;
      for (let x = 0; x < 64; x++) { const a = 4 + (Math.sin(x * 0.4) * 2 + alea() * 3 | 0); R(g, '#ffffff', x, a, 1, 16 - a - (alea() * 4 | 0)); if (alea() < 0.5) R(g, '#8a6a2a', x, 1 + (alea() * 2 | 0), 1, 2); }
      for (let i = 0; i < 30; i++) R(g, '#bff4f0', alea() * 64 | 0, 8 + (alea() * 8 | 0), 2, 1);
    }],
    // dalles claires de la rue : grandes plaques de calcaire, joints, taches
    dallesRue: () => [64, 64, (g, o) => {
      const { R, alea, voile } = o; R(g, '#e6dcc4', 0, 0, 64, 64);
      for (let y = 0; y < 64; y += 16) for (let x = (y / 16 & 1) * 10; x < 74; x += 20) { R(g, ['#e6dcc4', '#dcd0b4', '#efe6d2', '#d8cbb0'][alea() * 4 | 0], x, y, 19, 15); }
      grain(g, o, 500, ['#cfc2a4', '#f4ecdc']);
      for (let y = 15; y < 64; y += 16) R(g, '#a89a7a', 0, y, 64, 1);
      for (let y = 0; y < 64; y += 16) for (let x = (y / 16 & 1) * 10 + 19; x < 64; x += 20) R(g, '#a89a7a', x, y, 1, 15);
      voile(g, 0.15, () => { for (let i = 0; i < 6; i++) R(g, '#6a5a3a', alea() * 60 | 0, alea() * 60 | 0, 3 + (alea() * 5 | 0), 2 + (alea() * 3 | 0)); });
    }, 8],
    // carrelage du lobby : carreaux blancs, frise turquoise, joints, reflets mouillés
    carrelage: () => [64, 64, (g, o) => {
      const { R, alea, voile } = o; R(g, '#fff4e0', 0, 0, 64, 64);
      for (let y = 0; y < 64; y += 8) for (let x = 0; x < 64; x += 8) { R(g, (x + y) % 16 ? '#f6ead2' : '#fffaf0', x, y, 8, 8); R(g, '#c8b898', x, y, 8, 1); R(g, '#c8b898', x, y, 1, 8); }
      for (let x = 0; x < 64; x += 8) { R(g, '#1fb5a8', x + 2, 26, 4, 4); R(g, '#1fb5a8', x + 3, 33, 2, 2); }
      voile(g, 0.3, () => { for (let i = 0; i < 8; i++) R(g, '#ffffff', alea() * 56 | 0, alea() * 60 | 0, 8, 2); });
    }, 4],
    // façade crépie de la rue : la teinte vient de l'option c (texture claire) ; fenêtres à encadrement sombre, porte, soubassement
    facadePlaya: () => [64, 64, (g, o) => {
      const { R, alea, voile } = o; R(g, '#ffffff', 0, 0, 64, 64); grain(g, o, 300, ['#f0f0f0', '#e4e4e4']);
      voile(g, 0.12, () => { for (let i = 0; i < 6; i++) R(g, '#000', alea() * 60 | 0, 0, 2, 20 + (alea() * 40 | 0)); }); // coulures
      for (const x of [6, 26, 46]) { R(g, '#4a3424', x, 8, 12, 14); R(g, '#1a2a30', x + 1, 9, 10, 12); R(g, '#fff4e0', x - 1, 22, 14, 2); } // étage
      R(g, '#4a3424', 8, 38, 14, 26); R(g, '#2a1c14', 9, 39, 12, 25); for (const x of [30, 46]) { R(g, '#4a3424', x, 40, 12, 14); R(g, '#1a2a30', x + 1, 41, 10, 12); }
      voile(g, 0.25, () => R(g, '#000', 0, 58, 64, 6));
    }],
    // papel picado : fanion de papier découpé (blanc, la teinte vient de l'instance) ; trous en losanges et fleurs, bord festonné ; transparent ailleurs
    papelPicado: () => [32, 40, (g, o) => {
      const { R } = o; R(g, '#ffffff', 0, 0, 32, 36);
      for (let x = 0; x < 32; x += 4) R(g, '#ffffff', x + 1, 36, 2, 3);
      g.globalCompositeOperation = 'destination-out';
      for (let y = 6; y < 34; y += 7) for (let x = 4 + (y % 2) * 3; x < 30; x += 7) { R(g, '#000', x, y, 3, 1); R(g, '#000', x + 1, y - 1, 1, 3); }
      R(g, '#000', 13, 14, 6, 6); R(g, '#000', 15, 12, 2, 10); R(g, '#000', 11, 16, 10, 2);
      g.globalCompositeOperation = 'source-over';
    }],
    // chaume des palapas : feuilles de palmier sèches en rangs qui se recouvrent
    chaume: () => [64, 64, (g, o) => {
      const { R, alea } = o; R(g, '#c9a05a', 0, 0, 64, 64);
      for (let y = 0; y < 64; y += 8) { for (let i = 0; i < 90; i++) R(g, ['#b08440', '#dcb878', '#a87a38', '#e4c48a'][alea() * 4 | 0], alea() * 64 | 0, y + (alea() * 8 | 0), 1, 3 + (alea() * 5 | 0)); R(g, '#6a4a22', 0, y + 7, 64, 1); }
    }, 3],
    // calcaire du cénote : strates beige et gris, taches de mousse, trous ; le haut de la texture est le haut de la paroi
    calcaire: () => [64, 64, (g, o) => {
      const { R, alea, voile } = o; let y = 0;
      for (const [c, hh] of [['#6a8a3a', 3], ['#cbbf9c', 9], ['#b8a880', 6], ['#d4c8a6', 10], ['#a89a76', 7], ['#c4b690', 9], ['#8a7e62', 8], ['#b4a684', 12]]) { R(g, c, 0, y, 64, hh); for (let x = 0; x < 64; x += 3) if (alea() < 0.4) R(g, c, x, y - 1, 3, 2); y += hh; }
      grain(g, o, 400, ['#9a8c6a', '#ded2b2']);
      voile(g, 0.35, () => { for (let i = 0; i < 14; i++) R(g, '#3e6a2a', alea() * 60 | 0, alea() * 60 | 0, 2 + (alea() * 5 | 0), 2 + (alea() * 4 | 0)); });
      for (let i = 0; i < 10; i++) { const x = alea() * 60 | 0, y = 4 + alea() * 56 | 0; R(g, '#4a4030', x, y, 3, 2); }
    }, 8],
    // eau du cénote, peu profonde : turquoise vif, le fond de sable et de roche se voit, taches de lumière ondulantes
    eauCenote: () => [64, 64, (g, o) => {
      const { R, alea, voile } = o; R(g, '#1fd6b0', 0, 0, 64, 64);
      voile(g, 0.45, () => { for (let i = 0; i < 40; i++) R(g, alea() < 0.5 ? '#0b6b78' : '#14a89a', alea() * 64 | 0, alea() * 64 | 0, 4 + (alea() * 12 | 0), 3 + (alea() * 8 | 0)); });
      for (let i = 0; i < 70; i++) { const x = alea() * 64 | 0, y = alea() * 64 | 0; R(g, '#8ff4dc', x, y, 3 + (alea() * 4 | 0), 1); R(g, '#8ff4dc', x + 2, y + 1, 1, 1); }
    }, 8],
    // rideau de lianes et de racines qui pend de la lèvre du cénote : brins verts et beiges, transparents entre deux ; le haut de la texture est le haut
    lianes: () => [32, 64, (g, o) => {
      const { R, alea } = o;
      for (let i = 0; i < 18; i++) { const x = alea() * 32 | 0, l = 20 + alea() * 44 | 0, c = alea() < 0.6 ? '#4c8f2a' : '#d9c9a0'; for (let y = 0; y < l; y++) R(g, c, x + (Math.sin(y * 0.2 + i) * 1.2 | 0), y, 1, 1); if (c === '#4c8f2a') for (let y = 2; y < l; y += 5) R(g, '#6db845', x - 1, y, 3, 2); }
    }],
    // sol de la garrigue côtière : sable calcaire ocre clair, cailloux, touffes sèches
    solGarrigue: () => [64, 64, (g, o) => {
      const { R, alea, voile } = o; R(g, '#d8c59a', 0, 0, 64, 64); grain(g, o, 600, ['#c4ae80', '#e8d8b0', '#b89c6c']);
      voile(g, 0.3, () => { for (let i = 0; i < 10; i++) R(g, '#c0a070', alea() * 56 | 0, alea() * 56 | 0, 6 + (alea() * 10 | 0), 4 + (alea() * 8 | 0)); });
      for (let i = 0; i < 40; i++) { const x = alea() * 62 | 0, y = alea() * 62 | 0; R(g, alea() < 0.6 ? '#7a8a3a' : '#5a7030', x, y, 2, 2); }
      for (let i = 0; i < 30; i++) R(g, '#f4ecd8', alea() * 64 | 0, alea() * 64 | 0, 2, 1);
    }, 8],
    // toile rayée des étals et des parasols de la rue : bandes de deux couleurs
    toldo: (a, b) => [32, 32, (g, o) => { const { R } = o; for (let x = 0; x < 32; x += 8) { R(g, a, x, 0, 4, 32); R(g, b, x + 4, 0, 4, 32); } o.voile(g, 0.15, () => R(g, '#000', 0, 28, 32, 4)); }, 2],
    // topes : dos d'âne peint en jaune et noir en travers de la route
    topes: () => [64, 16, (g, o) => { const { R } = o; for (let x = 0; x < 64; x += 16) { R(g, '#f7d36b', x, 0, 8, 16); R(g, '#1a1a1a', x + 8, 0, 8, 16); } o.voile(g, 0.25, () => { for (let i = 0; i < 60; i++) R(g, '#000', o.alea() * 64 | 0, o.alea() * 16 | 0, 2, 1); }); }],
    // rayon de lumière dans la grotte : bande verticale floue, blanche chaude au centre, transparente sur les bords et vers le bas (à rendre en additif)
    rayon: () => [16, 64, (g) => {
      for (let y = 0; y < 64; y++) for (let x = 0; x < 16; x++) { const a = Math.max(0, 1 - Math.abs(x - 7.5) / 8) ** 1.5 * (1 - y / 64) * 0.9; g.fillStyle = `rgba(255,243,192,${a.toFixed(3)})`; g.fillRect(x, y, 1, 1); }
    }],
  });
})();
