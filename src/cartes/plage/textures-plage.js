// Textures propres à « plage » (Playa 307, Riviera Maya à midi) : complète le catalogue de textures.js, mêmes conventions. Voir METHODE-DECOR.md.
(() => {
  const grain = (g, o, n, cols, w = 64, h = 64) => { for (let i = 0; i < n; i++) o.R(g, cols[o.alea() * cols.length | 0], o.alea() * w | 0, o.alea() * h | 0, 1, 1); };
  Object.assign(TEXTURES, {
    // sable sec de la plage : presque blanc, grains, petites rides du vent, traces de pas
    sableSec: () => [64, 64, (g, o) => {
      const { R, alea, voile } = o; R(g, '#cab890', 0, 0, 64, 64); grain(g, o, 700, ['#baa680', '#dccca6', '#ae9a74']);
      voile(g, 0.25, () => { for (let y = 2; y < 64; y += 5) for (let x = 0; x < 64; x += 2) R(g, '#bfae85', x, y + (Math.sin(x * 0.3 + y) * 1.5 | 0), 2, 1); });
      for (let i = 0; i < 10; i++) { const x = alea() * 60 | 0, y = alea() * 60 | 0; R(g, '#d6c8a4', x, y, 2, 3); R(g, '#d6c8a4', x + 3, y + 4, 2, 3); }
    }, 6],
    // sable dur et humide du milieu de la plage (la piste) : plus foncé, lissé, traces de pneus le long, laisse de coquillages
    sableDur: () => [64, 256, (g, o) => {
      const { R, alea, voile } = o; R(g, '#665638', 0, 0, 64, 256); grain(g, o, 1400, ['#5a4c30', '#726244', '#4e422a'], 64, 256);
      voile(g, 0.3, () => { for (const x of [14, 22, 40, 49]) for (let y = 0; y < 256; y += 2) R(g, '#a8966c', x + (Math.sin(y * 0.05 + x) * 2 | 0), y, 3, 2); }); // ornières
      voile(g, 0.25, () => { for (let i = 0; i < 12; i++) R(g, '#fff4dc', alea() * 64 | 0, alea() * 256 | 0, 6 + (alea() * 14 | 0), 2); }); // reflets de l'eau restée
      for (let i = 0; i < 40; i++) R(g, alea() < 0.5 ? '#fff8f0' : '#e8a890', alea() * 64 | 0, alea() * 256 | 0, 1, 1); // coquillages
    }],
    // mer des Caraïbes vue de près : turquoise, rides claires, reflets du soleil
    merTurquoise: () => [64, 64, (g, o) => {
      const { R, alea, voile } = o; R(g, '#10a2c0', 0, 0, 64, 64);
      voile(g, 0.5, () => { for (let i = 0; i < 60; i++) R(g, alea() < 0.5 ? '#12b0bc' : '#2fd8d4', alea() * 64 | 0, alea() * 64 | 0, 6 + (alea() * 16 | 0), 2 + (alea() * 2 | 0)); });
      for (let i = 0; i < 80; i++) R(g, '#7eeee6', alea() * 64 | 0, alea() * 64 | 0, 2 + (alea() * 6 | 0), 1);
      for (let i = 0; i < 26; i++) R(g, '#ffffff', alea() * 64 | 0, alea() * 64 | 0, 1 + (alea() * 3 | 0), 1);
    }, 10],
    // le large : bleu profond, moins de détails
    merLarge: () => [64, 64, (g, o) => {
      const { R, alea, voile } = o; R(g, '#0a4a86', 0, 0, 64, 64);
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
      const { R, alea, voile } = o; R(g, '#cdbf9e', 0, 0, 64, 64);
      for (let y = 0; y < 64; y += 16) for (let x = (y / 16 & 1) * 10; x < 74; x += 20) { R(g, ['#cdbf9e', '#c2b290', '#d8ccae', '#bcae8c'][alea() * 4 | 0], x, y, 19, 15); }
      grain(g, o, 500, ['#cfc2a4', '#f4ecdc']);
      for (let y = 15; y < 64; y += 16) R(g, '#7a6c50', 0, y, 64, 1);
      for (let y = 0; y < 64; y += 16) for (let x = (y / 16 & 1) * 10 + 19; x < 64; x += 20) R(g, '#a89a7a', x, y, 1, 15);
      voile(g, 0.15, () => { for (let i = 0; i < 6; i++) R(g, '#6a5a3a', alea() * 60 | 0, alea() * 60 | 0, 3 + (alea() * 5 | 0), 2 + (alea() * 3 | 0)); });
    }, 8],
    // carrelage du lobby : carreaux blancs, frise turquoise, joints, reflets mouillés
    carrelage: () => [64, 64, (g, o) => {
      const { R, alea, voile } = o; R(g, '#e4d8c0', 0, 0, 64, 64);
      for (let y = 0; y < 64; y += 8) for (let x = 0; x < 64; x += 8) { R(g, (x + y) % 16 ? '#dccfb4' : '#ece2cc', x, y, 8, 8); R(g, '#c8b898', x, y, 8, 1); R(g, '#c8b898', x, y, 1, 8); }
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
      const { R, alea, voile } = o; R(g, '#b49a6c', 0, 0, 64, 64); grain(g, o, 600, ['#a0865a', '#c8b084', '#94784c']);
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
      for (let y = 0; y < 64; y++) for (let x = 0; x < 16; x++) { const a = Math.max(0, 1 - Math.abs(x - 7.5) / 8) ** 1.5 * (1 - y / 64) * 0.4; g.fillStyle = `rgba(255,243,192,${a.toFixed(3)})`; g.fillRect(x, y, 1, 1); }
    }],

    // ---------- V2 (docs/refs/REFS-plage.md) ----------
    // sable mouillé de la laisse de mer, entre le sable sec et l'écume : plus sombre, lisse, reflets du ciel en traînées
    sableMouille: () => [64, 64, (g, o) => {
      const { R, alea, voile } = o; R(g, '#a89270', 0, 0, 64, 64); grain(g, o, 500, ['#9a8462', '#b49e7c', '#8e7a58']);
      voile(g, 0.35, () => { for (let i = 0; i < 16; i++) R(g, '#c4d4d0', alea() * 64 | 0, alea() * 64 | 0, 10 + (alea() * 20 | 0), 1 + (alea() * 2 | 0)); });
      for (let i = 0; i < 20; i++) R(g, '#5a4a30', alea() * 64 | 0, alea() * 64 | 0, 2, 1); // débris de sargasse
    }, 6],
    // mer du bord, sur le sable blanc : aigue-marine claire, rides et taches de lumière
    merBord: () => [64, 64, (g, o) => {
      const { R, alea, voile } = o; R(g, '#a4ecd8', 0, 0, 64, 64);
      voile(g, 0.5, () => { for (let i = 0; i < 50; i++) R(g, alea() < 0.5 ? '#74d6c0' : '#a8ecd8', alea() * 64 | 0, alea() * 64 | 0, 8 + (alea() * 14 | 0), 2); });
      for (let i = 0; i < 70; i++) R(g, '#c8fbf2', alea() * 64 | 0, alea() * 64 | 0, 2 + (alea() * 5 | 0), 1);
    }, 8],
    // traces de pneus et de pas sur le sable mou de la plage large : sillons sombres, transparents ailleurs (posé par-dessus le sable)
    tracesSable: () => [64, 128, (g, o) => {
      const { R, alea } = o;
      for (const x0 of [8, 15, 30, 37, 50]) for (let y = 0; y < 128; y++) { const x = x0 + Math.sin(y * 0.04 + x0) * 4 | 0; R(g, 'rgba(120,96,60,0.45)', x, y, 3, 1); if (alea() < 0.3) R(g, 'rgba(250,240,220,0.5)', x + 3, y, 1, 1); }
      for (let i = 0; i < 40; i++) R(g, 'rgba(120,96,60,0.35)', alea() * 62 | 0, alea() * 126 | 0, 2, 3);
    }],
    // eau de la lagune de mangrove : vert d'eau plus sombre que la mer, reflets du ciel en bandes
    eauLagune: () => [64, 64, (g, o) => {
      const { R, alea, voile } = o; R(g, '#4a7464', 0, 0, 64, 64);
      voile(g, 0.5, () => { for (let i = 0; i < 40; i++) R(g, alea() < 0.5 ? '#3e6656' : '#58806e', alea() * 64 | 0, alea() * 64 | 0, 10 + (alea() * 20 | 0), 2); });
      for (let i = 0; i < 40; i++) R(g, '#a8e0e0', alea() * 64 | 0, alea() * 64 | 0, 3 + (alea() * 6 | 0), 1);
    }, 12],
    // enrochement de calcaire au pied de la chaussée de la lagune : blocs gris clair, ombres entre eux
    enrochement: () => [64, 32, (g, o) => {
      const { R, alea } = o; R(g, '#4a4638', 0, 0, 64, 32);
      for (let i = 0; i < 40; i++) { const x = alea() * 60 | 0, y = alea() * 28 | 0, w = 5 + (alea() * 9 | 0), hh = 4 + (alea() * 6 | 0); R(g, ['#b8b0a0', '#a49c8a', '#c8c0ae', '#8e8676'][alea() * 4 | 0], x, y, w, hh); R(g, '#e0dac8', x, y, w, 1); }
    }, 4],
    // paroi de la grotte du cénote (fiche 6) : le bas de la texture est le pied de la paroi. Calcaire strié de coulées (draperies), plus sombre et luisant au pied, liseré turquoise du reflet de l'eau
    paroiGrotte: () => [64, 128, (g, o) => {
      const { R, alea, voile } = o; R(g, '#8a7a5e', 0, 0, 64, 128);
      for (let y = 0; y < 128; y += 4) R(g, ['#8a7a5e', '#7a6c52', '#9a8a6c', '#6e6048'][alea() * 4 | 0], 0, y, 64, 4);
      for (let i = 0; i < 26; i++) { const x = alea() * 64 | 0, y0 = alea() * 40 | 0, l = 30 + alea() * 80 | 0, c = alea() < 0.5 ? '#c8b894' : '#a8966e'; for (let y = y0; y < Math.min(128, y0 + l); y++) R(g, c, x + (Math.sin(y * 0.15 + i) * 1.3 | 0), y, 2 + (i % 2), 1); }
      voile(g, 0.5, () => R(g, '#2a2418', 0, 96, 64, 32)); voile(g, 0.3, () => R(g, '#2a2418', 0, 0, 64, 18)); // pied mouillé, haut dans l'ombre
      for (let x = 0; x < 64; x++) { R(g, '#3fd8c0', x, 112 + (Math.sin(x * 0.4) * 2 | 0), 1, 2); if (alea() < 0.4) R(g, '#9ff4e4', x, 110 + (alea() * 6 | 0), 1, 1); } // reflets de l'eau
      grain(g, o, 500, ['#5a4e3a', '#b0a080'], 64, 128);
    }],
    // voûte de la grotte : roche sombre, fissures, pointes de stalactites en taches claires
    vouteGrotte: () => [64, 64, (g, o) => {
      const { R, alea, voile } = o; R(g, '#4a4232', 0, 0, 64, 64); grain(g, o, 700, ['#3a3426', '#5e5440', '#2c2820']);
      for (let i = 0; i < 8; i++) { let x = alea() * 64, y = alea() * 64; for (let k = 0; k < 30; k++) { R(g, '#1c1a14', x | 0, y | 0, 1, 1); x += alea() * 2 - 1; y += 1; } }
      voile(g, 0.6, () => { for (let i = 0; i < 30; i++) R(g, '#b0a07a', alea() * 64 | 0, alea() * 64 | 0, 2, 2); });
    }, 6],
    // sol de la grotte : calcaire mouillé et lissé, flaques claires qui renvoient la lumière, sable fin dans les creux
    solGrotte: () => [64, 128, (g, o) => {
      const { R, alea, voile } = o; R(g, '#5e5442', 0, 0, 64, 128); grain(g, o, 1200, ['#4e4636', '#6e6450', '#7a6e56'], 64, 128);
      voile(g, 0.5, () => { for (let i = 0; i < 14; i++) R(g, '#9a8c70', alea() * 56 | 0, alea() * 120 | 0, 6 + (alea() * 14 | 0), 4 + (alea() * 10 | 0)); });
      for (let i = 0; i < 10; i++) { const x = alea() * 50 | 0, y = alea() * 116 | 0, w = 6 + (alea() * 10 | 0); R(g, '#2a5a58', x, y, w, 4); R(g, '#7ad8c8', x + 1, y + 1, w - 3, 1); } // flaques
    }],
    // eau du cénote souterrain : turquoise vif sur fond de sable, plus sombre vers le profond (le haut de la texture est le bord de la paroi), réseau de lumière ondulante
    eauGrotte: () => [64, 64, (g, o) => {
      const { R, alea, voile } = o; for (let y = 0; y < 64; y++) R(g, 'rgb(' + (10 + y * 0.2 | 0) + ',' + (50 + y * 1.6 | 0) + ',' + (80 + y * 1.0 | 0) + ')', 0, y, 64, 1);
      voile(g, 0.5, () => { for (let i = 0; i < 90; i++) { const x = alea() * 64 | 0, y = alea() * 64 | 0; R(g, '#9ff8e8', x, y, 4 + (alea() * 5 | 0), 1); R(g, '#9ff8e8', x + 3, y + 1, 1, 2); } });
      voile(g, 0.3, () => { for (let i = 0; i < 12; i++) R(g, '#0a3a44', alea() * 60 | 0, alea() * 24 | 0, 6, 3); }); // roches immergées
    }],
    // racines qui pendent par le trou du plafond (fiche 6, Samula) : brins bruns et beiges, transparents entre deux ; le haut de la texture est le haut
    racines: () => [12, 128, (g, o) => {
      const { R, alea } = o;
      for (let i = 0; i < 22; i++) { const x = alea() * 12, l = 50 + alea() * 78 | 0, c = ['#c8b488', '#dcc8a0', '#b49c70', '#a08a5c'][alea() * 4 | 0]; for (let y = 0; y < l; y++) R(g, c, x + Math.sin(y * 0.07 + i) * 2 | 0, y, alea() < 0.2 ? 2 : 1, 1); }
    }],
    // rayon de lumière en volume (cône ouvert) : blanc chaud en haut, qui s'efface vers le bas, stries verticales (rendu en additif)
    rayonCone: () => [32, 64, (g) => {
      for (let y = 0; y < 64; y++) for (let x = 0; x < 32; x++) { const a = (0.55 + 0.45 * Math.sin(x / 32 * Math.PI * 6) ** 2) * (1 - y / 64) ** 0.7 * 0.95; g.fillStyle = 'rgba(255,240,190,' + a.toFixed(3) + ')'; g.fillRect(x, y, 1, 1); }
    }],
    // tache ronde de lumière (trou du plafond vu d'en bas, soleil au sol) : disque clair aux bords doux, transparent autour
    tache: (c = '255,246,210') => [64, 64, (g) => {
      for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { const d = Math.hypot(x - 31.5, y - 31.5) / 32, a = Math.max(0, Math.min(1, (1 - d) * 2.2)); g.fillStyle = 'rgba(' + c + ',' + a.toFixed(3) + ')'; g.fillRect(x, y, 1, 1); }
    }],
    // feuillage sombre du palétuvier : vert profond, reflets cireux
    feuillesMangle: () => [64, 64, (g, o) => { const { R, alea } = o; R(g, '#2a4a1e', 0, 0, 64, 64); grain(g, o, 900, ['#1e3a16', '#3a6228', '#4a7a30', '#16301a']); for (let i = 0; i < 40; i++) R(g, '#6a9a44', alea() * 64 | 0, alea() * 64 | 0, 2, 1); }, 3],
    // filet de beach-volley : mailles blanches, bande du haut ; transparent entre les mailles
    filetVoley: () => [64, 16, (g, o) => { const { R } = o; for (let x = 0; x < 64; x += 4) R(g, '#f4f0e8', x, 0, 1, 16); for (let y = 0; y < 16; y += 4) R(g, '#f4f0e8', 0, y, 64, 1); R(g, '#f4f0e8', 0, 0, 64, 2); }],
    // rayon de lumière en plan (croisés) : bande verticale floue, blanc chaud, plus franc que le rayon du catalogue (rendu en additif)
    rayonFort: () => [16, 64, (g) => {
      for (let y = 0; y < 64; y++) for (let x = 0; x < 16; x++) { const a = Math.max(0, 1 - Math.abs(x - 7.5) / 8) ** 1.3 * (1 - y / 64) ** 0.6 * 0.85; g.fillStyle = 'rgba(255,243,200,' + a.toFixed(3) + ')'; g.fillRect(x, y, 1, 1); }
    }],
    // auvents des façades : toile rayée de trois couleurs selon la hauteur (rouge, turquoise, jaune) : chaque façade en montre une bande, sans passe de dessin de plus
    toldoMulti: () => [32, 96, (g, o) => { const { R } = o; ['#e8402a', '#1f9a96', '#e8a800'].forEach((c, k) => { for (let x = 0; x < 32; x += 8) { R(g, '#fff4e0', x, k * 32, 4, 32); R(g, c, x + 4, k * 32, 4, 32); } }); }, 2],
    // colonne de lumière douce (cône ouvert) : même voile sur tout le tour, s'efface vers le bas, sans stries qui dessinent des arêtes (rendu en additif)
    rayonDoux: () => [8, 64, (g) => { for (let y = 0; y < 64; y++) { g.fillStyle = 'rgba(255,240,200,' + ((1 - y / 64) ** 1.2 * 0.4).toFixed(3) + ')'; g.fillRect(0, y, 8, 1); } }],
  });
})();

// Textures de la refonte (docs/propositions/PROPOSITION-plage.md). Règle DA-10 : aucune ligne sinusoïdale ni rayure périodique dans le sens de la marche sur une grande surface.
(() => {
  Object.assign(TEXTURES, {
    // fil de banderoles de la feria (T-2) : triangles pointe en bas aux trois accents (rose, turquoise, jaune), fond transparent ; se répète le long du fil
    banderole: () => [96, 16, (g, { R }) => { g.clearRect(0, 0, 96, 16); ['#e8468c', '#1fb5a8', '#f2c230', '#e8468c', '#f2c230', '#1fb5a8'].forEach((c, k) => { g.fillStyle = c; g.beginPath(); g.moveTo(k * 16 + 1, 1); g.lineTo(k * 16 + 15, 1); g.lineTo(k * 16 + 8, 15); g.fill(); }); R(g, '#4a3a2c', 0, 0, 96, 1); }],
    // guirlande d'ampoules de couleur (grotte, muelle) : un fil et des ampoules aux trois accents, fond transparent
    ampoules: () => [96, 8, (g, { R }) => { g.clearRect(0, 0, 96, 8); R(g, '#2a2420', 0, 1, 96, 1); ['#ffd070', '#e8468c', '#1fb5a8', '#ffd070', '#f2c230', '#e8468c'].forEach((c, k) => { R(g, c, k * 16 + 6, 2, 3, 4); }); }],
    // dallage de la Quinta (REFS §3) : pavés rose brique de tailles inégales, bandes de pierre claire en travers tous les 8 m ; teintes voisines, pas de motif périodique fin
    dallageQuinta: () => [64, 64, (g, { R, alea }) => { R(g, '#b9776a', 0, 0, 64, 64); for (let y = 0; y < 64; y += 4) for (let x = (y / 4 & 1) * 3; x < 64; x += 6 + (alea() * 3 | 0)) R(g, ['#ad6c60', '#c58476', '#b47266', '#bd7d70'][alea() * 4 | 0], x, y, 5 + (alea() * 2 | 0), 3); R(g, '#cfc8b8', 0, 0, 64, 4); for (let i = 0; i < 60; i++) R(g, '#9a5e54', alea() * 64 | 0, alea() * 64 | 0, 1, 1); }, 8],
    // planches du muelle (DA-10) : en travers de la marche, largeurs et teintes inégales, joints sombres, quelques clous ; aucune rayure régulière
    planchesMuelle: () => [64, 64, (g, { R, alea }) => { let y = 0; while (y < 64) { const l = 3 + (alea() * 4 | 0); R(g, ['#b7a98c', '#a89a7e', '#c2b498', '#9e9076', '#b0a286'][alea() * 5 | 0], 0, y, 64, l); R(g, '#6e624e', 0, y + l - 1, 64, 1); for (let k = 0; k < 3; k++) R(g, '#8a7c66', alea() * 64 | 0, y + (alea() * (l - 1) | 0), 2 + (alea() * 5 | 0), 1); y += l; } }, 8],
    // façade crépie : grain léger, salissure au pied, pour la zone teintée des maisons et des resorts
    crepiClair: () => [64, 64, (g, { R, alea, voile }) => { R(g, '#f4f0e8', 0, 0, 64, 64); for (let i = 0; i < 260; i++) R(g, alea() < 0.5 ? '#e8e2d8' : '#fffdf6', alea() * 64 | 0, alea() * 64 | 0, 1 + (alea() * 2 | 0), 1); voile(g, 0.12, () => R(g, '#6a5a44', 0, 56, 64, 8)); }, 8],
    // ---------- la vie (docs/propositions/VIE-plage.md) ----------
    // crête d'écume d'un rouleau, vue de dessus : frange blanche déchirée, transparente autour
    ecumeLarge: () => [64, 16, (g, { R, alea }) => { for (let x = 0; x < 64; x++) { const a = 5 + (Math.sin(x * 0.3) * 2 + alea() * 3 | 0), l = 3 + (alea() * 5 | 0); if (alea() < 0.85) R(g, '#ffffff', x, a, 1, l); if (alea() < 0.3) R(g, '#d8f6f2', x, a - 2 - (alea() * 2 | 0), 1, 1); } }],
    // reflets d'eau sur la roche (caustiques) : des anneaux clairs qui se recoupent sur fond noir, raccordés d'un bord à l'autre ; à rendre en additif
    caustique: () => [64, 64, (g, { R, alea }) => { R(g, '#000', 0, 0, 64, 64); g.strokeStyle = '#bfeee4'; g.lineWidth = 1.4;
      for (let k = 0; k < 9; k++) { const x = (k % 3) * 21.3 + alea() * 12, y = (k / 3 | 0) * 21.3 + alea() * 12, rx = 8 + alea() * 6, ry = 7 + alea() * 6, a = alea() * 3;
        for (const dx of [-64, 0, 64]) for (const dy of [-64, 0, 64]) { g.beginPath(); g.ellipse(x + dx, y + dy, rx, ry, a, 0, 6.2832); g.stroke(); } } }],
  });
})();
