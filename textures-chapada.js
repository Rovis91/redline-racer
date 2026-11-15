// Textures propres à « chapada » (Manuscrit 512, la cité perdue) : complète le catalogue de textures.js, mêmes conventions. Voir METHODE-DECOR.md.
// Palette de la proposition (propositions/PROPOSITION-chapada.md, A-6) : verts profonds et émeraude, quartzite rosé, eau jade, or et flamme en accents.
(() => {
  const semis = (g, { R, alea }, n, cs, w = 1, h = 1, W = 64, H = 64) => { for (let i = 0; i < n; i++) R(g, cs[alea() * cs.length | 0], alea() * W | 0, alea() * H | 0, w + (alea() * w | 0), h + (alea() * h | 0)); };
  // feuillage : un fond et de grosses touches d'ombre et de lumière (elles se lisent encore à 270 lignes, de loin elles se fondent)
  const feuil = (c, clair) => () => [64, 64, (g, o) => { o.R(g, c, 0, 0, 64, 64); o.voile(g, 0.3, () => semis(g, o, 110, ['#000', '#000', clair], 3, 2)); o.voile(g, 0.55, () => semis(g, o, 26, [clair], 2, 1)); }];
  // pierre taillée de la cité : gros blocs à joints sombres, mousse dans les joints et en haut, coulures
  const pierre = (c, mousse = 0.5) => () => [64, 64, (g, o) => { const { R, alea, voile } = o; R(g, c, 0, 0, 64, 64);
    voile(g, 0.12, () => { for (let y = 0; y < 64; y += 16) for (let x = (y & 16) / 2 - 8; x < 64; x += 32) R(g, alea() < 0.5 ? '#000' : '#fff', x, y, 32, 16); });
    voile(g, 0.18, () => semis(g, o, 240, ['#000', '#fff']));
    voile(g, 0.45, () => { for (let y = 0; y < 64; y += 16) { R(g, '#1c1a16', 0, y, 64, 1); for (let x = (y & 16) / 2; x < 64; x += 32) R(g, '#1c1a16', x, y, 1, 16); } });
    voile(g, mousse, () => { for (let y = 0; y < 64; y += 16) for (let x = 0; x < 64; x += 2) if (alea() < 0.55) R(g, alea() < 0.5 ? '#4d6a34' : '#7fa83a', x, y, 2, 1 + (alea() * 3 | 0)); });
    voile(g, 0.25, () => { for (let i = 0; i < 9; i++) R(g, '#1c1a16', alea() * 64 | 0, alea() * 30 | 0, 1 + (alea() * 2 | 0), 8 + alea() * 24 | 0); });
  }, 4];
  Object.assign(TEXTURES, {
    feuilleOmbre: feuil('#163a22', '#7fb04a'), feuilleCanopee: feuil('#1f5a2c', '#a8d458'), feuilleSoleil: feuil('#3f9a3c', '#d0ee78'), feuilleLoin: feuil('#3c6e3c', '#8fb070'), palmeJungle: feuil('#2a6a2e', '#b8dc5a'),
    // écorce humide : stries verticales, plaques de mousse
    ecorceJungle: () => [32, 64, (g, o) => { const { R, alea, voile } = o; R(g, '#3a2e24', 0, 0, 32, 64);
      voile(g, 0.4, () => { for (let i = 0; i < 40; i++) R(g, alea() < 0.6 ? '#1c1612' : '#6a5a48', alea() * 32 | 0, alea() * 64 | 0, 1, 6 + alea() * 20 | 0); });
      voile(g, 0.6, () => semis(g, o, 14, ['#4d6a34', '#7fa83a'], 3, 4, 32, 64)); }],
    // sol de la forêt, le même partout (D-7) : litière sombre, mousse, feuilles rousses ; jamais de sol nu clair
    litiereMousse: () => [64, 64, (g, o) => { const { R, voile } = o; R(g, '#26381c', 0, 0, 64, 64);
      semis(g, o, 300, ['#1c2a16', '#3a4a22', '#4a3a22', '#2e4420']); voile(g, 0.6, () => semis(g, o, 40, ['#5f8a34', '#7fa83a'], 3, 2)); voile(g, 0.7, () => semis(g, o, 30, ['#7a5a30', '#8a4a26'], 2, 1)); }, 6],
    // roche des pentes et des gorges : blocs sombres, mousse sur le dessus, coulures noires (jamais de bancs horizontaux réguliers : D-9)
    rocheMousse: () => [64, 64, (g, o) => { const { R, alea, voile } = o; R(g, '#5a564a', 0, 0, 64, 64);
      voile(g, 0.25, () => { for (let i = 0; i < 16; i++) R(g, alea() < 0.5 ? '#000' : '#fff', alea() * 56 | 0, alea() * 56 | 0, 6 + alea() * 14 | 0, 5 + alea() * 12 | 0); });
      voile(g, 0.4, () => { for (let i = 0; i < 12; i++) R(g, '#1c1a16', alea() * 64 | 0, alea() * 40 | 0, 1 + (alea() * 2 | 0), 10 + alea() * 30 | 0); });
      voile(g, 0.65, () => semis(g, o, 60, ['#4d6a34', '#7fa83a', '#3a5a2a'], 4, 2)); }, 5],
    // rive : vase sombre et galets
    vaseGalets: () => [64, 64, (g, o) => { const { R, voile } = o; R(g, '#3a3c2a', 0, 0, 64, 64); semis(g, o, 200, ['#2a2c20', '#4a4c36']); voile(g, 0.8, () => semis(g, o, 34, ['#8a8672', '#6a6656', '#a09a84'], 2, 2)); }, 6],
    // eau jade : claire, verte, vive ; reflets clairs étirés dans le sens du courant (v), ombres des arbres
    eauJade: () => [64, 64, (g, o) => { const { R, alea, voile } = o; R(g, '#2f8f7a', 0, 0, 64, 64);
      voile(g, 0.45, () => { for (let i = 0; i < 22; i++) R(g, '#134a40', alea() * 56 | 0, alea() * 60 | 0, 5 + alea() * 9 | 0, 8 + alea() * 16 | 0); });
      voile(g, 0.5, () => { for (let i = 0; i < 26; i++) R(g, '#bfe8c8', alea() * 62 | 0, alea() * 60 | 0, 1, 4 + alea() * 9 | 0); });
      voile(g, 0.35, () => { for (let i = 0; i < 10; i++) R(g, '#a9bb7e', alea() * 58 | 0, alea() * 60 | 0, 3, 6 + alea() * 10 | 0); }); }, 10],
    // eau du marais : sombre et calme, reflets du ciel en taches claires, lentilles d'eau
    eauMarais: () => [64, 64, (g, o) => { const { R, alea, voile } = o; R(g, '#2a5a48', 0, 0, 64, 64);
      voile(g, 0.5, () => { for (let i = 0; i < 16; i++) R(g, '#14342c', alea() * 52 | 0, alea() * 52 | 0, 8 + alea() * 12 | 0, 6 + alea() * 10 | 0); });
      voile(g, 0.4, () => { for (let i = 0; i < 12; i++) R(g, '#a9bb7e', alea() * 54 | 0, alea() * 58 | 0, 6 + alea() * 8 | 0, 2 + (alea() * 2 | 0)); }); voile(g, 0.7, () => semis(g, o, 70, ['#7fa83a', '#5f8a34'], 2, 1)); }, 12],
    // la chute : un ruban blanc strié en long, des trouées sombres (la roche derrière)
    chuteFil: () => [32, 64, (g, o) => { const { R, alea, voile } = o; R(g, '#d4e6e2', 0, 0, 32, 64); // de l'eau qui tombe, pas un bloc de lumière : fond bleuté, mèches claires et sombres, trouées
      voile(g, 0.6, () => { for (let i = 0; i < 40; i++) R(g, alea() < 0.5 ? '#8fb4b4' : '#ffffff', alea() * 32 | 0, alea() * 50 | 0, 1 + (alea() * 2 | 0), 10 + alea() * 34 | 0); });
      voile(g, 0.7, () => { for (let i = 0; i < 12; i++) R(g, '#4a6a68', alea() * 32 | 0, alea() * 50 | 0, 1, 6 + alea() * 18 | 0); }); }],
    // la roche de la grotte (th.tun.tex : parois et voûte du tunnel) : strates sombres, arêtes mouillées qui accrochent la lumière des torches, coulées d'eau, mousse ; les arguments du moteur (teintes du tunnel) ne servent pas
    rocheGrotte: () => [64, 64, (g, o) => { const { R, alea, voile } = o; R(g, '#39362e', 0, 0, 64, 64);
      voile(g, 0.5, () => { for (let i = 0; i < 30; i++) R(g, alea() < 0.5 ? '#24221c' : '#4a463a', alea() * 56 | 0, alea() * 62 | 0, 8 + alea() * 22 | 0, 2 + alea() * 6 | 0); });
      voile(g, 0.6, () => { for (let i = 0; i < 14; i++) R(g, '#15140f', alea() * 60 | 0, alea() * 56 | 0, 1 + (alea() * 2 | 0), 6 + alea() * 16 | 0); });
      voile(g, 0.45, () => { for (let i = 0; i < 18; i++) R(g, '#8a8468', alea() * 58 | 0, alea() * 63 | 0, 3 + alea() * 9 | 0, 1); });
      voile(g, 0.35, () => { for (let i = 0; i < 9; i++) R(g, '#7fa8a0', alea() * 63 | 0, alea() * 40 | 0, 1, 10 + alea() * 22 | 0); });
      voile(g, 0.5, () => { for (let i = 0; i < 12; i++) R(g, '#3f5a2a', alea() * 58 | 0, alea() * 60 | 0, 3 + alea() * 6 | 0, 2 + alea() * 3 | 0); }); }],
    // la voûte de la grotte : la même roche, mais calme (de grandes taches peu contrastées, aucun trait fin) ; les strates de rocheGrotte, étirées par la voûte et vues en rasant, scintillaient
    vouteGrotte: () => [32, 32, (g, o) => { const { R, alea, voile } = o; R(g, '#2c2a24', 0, 0, 32, 32);
      voile(g, 0.35, () => { for (let i = 0; i < 9; i++) R(g, alea() < 0.5 ? '#24221c' : '#36332b', alea() * 24 | 0, alea() * 24 | 0, 8 + alea() * 8 | 0, 8 + alea() * 8 | 0); }); }],
    // l'eau qui tombe, faite pour défiler (decors.js fait glisser la texture vers le bas à chaque image) : mèches claires et bleutées sur un voile translucide, trouées par où l'on voit la roche ;
    // tout boucle en hauteur (chaque mèche est dessinée deux fois, à y et y - 64). trous : nombre de trouées (la nappe de devant en a plus : on voit la première à travers)
    eauChute: (trous = 6) => [32, 64, (g, o) => { const { R, alea, voile } = o, B = (c, x, y, w, h) => { R(g, c, x, y, w, h); R(g, c, x, y - 64, w, h); };
      voile(g, 0.82, () => R(g, '#b9d6d2', 0, 0, 32, 64));
      voile(g, 0.75, () => { for (let i = 0; i < 44; i++) B(alea() < 0.45 ? '#86b2b4' : '#ffffff', alea() * 32 | 0, alea() * 64 | 0, 1 + (alea() * 2 | 0), 12 + alea() * 30 | 0); });
      voile(g, 0.55, () => { for (let i = 0; i < 10; i++) B('#3f6468', alea() * 32 | 0, alea() * 64 | 0, 1, 8 + alea() * 18 | 0); });
      for (let i = 0; i < trous; i++) { const x = alea() * 30 | 0, y = alea() * 64 | 0, w = 1 + (alea() * 3 | 0), h = 14 + alea() * 26 | 0; g.clearRect(x, y, w, h); g.clearRect(x, y - 64, w, h); } }],
    // l'écume du bassin : des paquets blancs sur du vide, qui bouclent ; decors.js la fait s'écarter du pied de la chute
    ecumeBassin: () => [32, 32, (g, o) => { const { R, alea, voile } = o;
      voile(g, 0.9, () => { for (let i = 0; i < 26; i++) { const x = alea() * 32 | 0, y = alea() * 32 | 0, w = 2 + (alea() * 5 | 0), h = 1 + (alea() * 3 | 0); for (const dx of [0, -32]) for (const dy of [0, -32]) R(g, alea() < 0.3 ? '#cfe6e0' : '#ffffff', x + dx, y + dy, w, h); } }); }],
    // la voie dallée de la cité (th.routeTex, mêmes réglages que chaussee : dalle, joint foncé, dalle claire, mousse) : grandes dalles de quartzite usées, joints moussus,
    // ni peinture ni flaque (l'alpha reste plein : rien ne reflète le ciel en plaques blanches), passages de roues polis plus clairs
    dallesJungle: (dalle, sombre, clair, mousse) => [128, 512, (g, o) => { const { R, alea, voile } = o; R(g, dalle, 0, 0, 128, 512);
      for (let y = 0, r = 0; y < 512; r++) { const hh = 24 + (alea() * 3 | 0) * 8, y1 = Math.min(512, y + hh); // rangs de dalles de 1,5 à 2,5 m, joints décalés
        for (let x = -(r & 1) * 8 - (alea() * 8 | 0); x < 128;) { const ww = 14 + (alea() * 3 | 0) * 4; voile(g, 0.1 + alea() * 0.12, () => R(g, alea() < 0.5 ? sombre : clair, x, y, ww, y1 - y)); voile(g, 0.75, () => R(g, '#2c3a20', x + ww - 1, y, 1, y1 - y)); x += ww; }
        voile(g, 0.75, () => R(g, '#2c3a20', 0, y1 - 1, 128, 1)); y = y1; }
      voile(g, 0.5, () => semis(g, o, 500, [mousse, '#2c3a20'], 1, 1, 128, 512)); voile(g, 0.14, () => semis(g, o, 2400, ['#000', '#fff'], 1, 1, 128, 512));
      voile(g, 0.1, () => { for (const x of [36, 84]) R(g, clair, x, 0, 9, 512); });
      voile(g, 0.55, () => { for (let i = 0; i < 90; i++) { const sd = alea() < 0.5; R(g, alea() < 0.6 ? mousse : '#7a5a30', sd ? alea() * 14 | 0 : 114 + (alea() * 14 | 0), alea() * 512 | 0, 2 + (alea() * 3 | 0), 2 + (alea() * 4 | 0)); } }); // mousse et feuilles sur le premier mètre de chaque bord
    }],
    // les mêmes dalles, pour les surlargeurs et les places (ruban du décor, de W au bord roulable) : plus de mousse, un rang clair au bord extérieur (u = 1)
    dallesBord: () => [64, 128, (g, o) => { const { R, alea, voile } = o; R(g, '#77725f', 0, 0, 64, 128);
      for (let y = 0; y < 128; y += 16) for (let x = -(y & 16) / 2; x < 64; x += 16) { voile(g, 0.1 + alea() * 0.14, () => R(g, alea() < 0.5 ? '#5e5a4c' : '#8a8672', x, y, 16, 16)); voile(g, 0.75, () => { R(g, '#2c3a20', x, y, 1, 16); R(g, '#2c3a20', x, y, 16, 1); }); }
      voile(g, 0.55, () => semis(g, o, 220, ['#4d6a34', '#7fa83a', '#7a5a30'], 2, 2, 64, 128)); voile(g, 0.3, () => R(g, '#b0aa94', 56, 0, 8, 128)); }, 5],
    // bordure de pierre basse et talus : pierre moussue ; pierre de la cité : quartzite rosé, à l'ombre, socle noir
    bordureMousse: pierre('#6a6656', 0.8), pierreCite: pierre('#b09a86', 0.45), pierreClaire: pierre('#cbb8a0', 0.3), pierreOmbre: pierre('#6a5e56', 0.6), socleNoir: pierre('#26221f', 0.25),
    // l'attique de l'arc triple : des lignes de signes inconnus gravés (Manuscrit 512)
    inscription512: () => [128, 16, (g, o) => { const { R, alea, voile } = o; R(g, '#b8a48e', 0, 0, 128, 16); voile(g, 0.2, () => semis(g, o, 120, ['#000', '#fff'], 1, 1, 128, 16));
      for (const y of [3, 10]) for (let x = 3; x < 124; x += 4 + (alea() * 2 | 0)) { const k = alea() * 5 | 0; R(g, '#3a2e26', x, y, k === 0 ? 3 : 1, 4); if (k > 1) R(g, '#3a2e26', x, y + (k === 2 ? 0 : 3), 3, 1); if (k === 4) R(g, '#3a2e26', x + 2, y, 1, 4); } }],
    // toile écrue des tentes, planches inégales du pont, bambou
    toileTente: () => [32, 32, (g, o) => { const { R, voile } = o; R(g, '#d8c89a', 0, 0, 32, 32); voile(g, 0.14, () => semis(g, o, 80, ['#000', '#fff'], 2, 1, 32, 32)); voile(g, 0.3, () => { R(g, '#8a7a50', 0, 15, 32, 1); R(g, '#8a7a50', 15, 0, 1, 32); }); }],
    planchesPont: () => [64, 64, (g, o) => { const { R, alea, voile } = o; R(g, '#6a5236', 0, 0, 64, 64);
      for (let y = 0; y < 64; y += 8) { voile(g, 0.1 + alea() * 0.25, () => R(g, alea() < 0.5 ? '#000' : '#e8c890', 0, y, 64, 8)); voile(g, 0.8, () => R(g, '#1c140c', 0, y + 7, 64, 1)); const e = alea() * 5 | 0; voile(g, 0.8, () => { R(g, '#1c140c', 0, y, e, 8); R(g, '#1c140c', 64 - (alea() * 5 | 0), y, 5, 8); }); }
      voile(g, 0.2, () => semis(g, o, 160, ['#000', '#fff'], 3, 1)); voile(g, 0.5, () => semis(g, o, 14, ['#4d6a34'], 3, 2)); }],
    bambou: () => [16, 32, (g, o) => { const { R, voile } = o; R(g, '#b0a45a', 0, 0, 16, 32); voile(g, 0.2, () => semis(g, o, 40, ['#000', '#fff'], 1, 3, 16, 32)); voile(g, 0.5, () => { for (let y = 5; y < 32; y += 8) R(g, '#5a5028', 0, y, 16, 1); }); }],
  });
})();

