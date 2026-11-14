// Textures propres à « chapada » (Matin sur la Chapada) : complète le catalogue de textures.js, mêmes conventions. Voir METHODE-DECOR.md.
(() => {
  Object.assign(TEXTURES, {
    // grès gris-bleu de la gorge, en strates. Sur une paroi en ruban (game.js : u = la hauteur, v = le long de la route), les strates sont des bandes verticales du dessin ;
    // lits clairs, lits sombres mouillés, mousse jaune-vert dans les joints, coulures d'eau
    rocheStrates: () => [64, 64, (g, o) => {
      const { R, alea, voile } = o; R(g, '#4b5359', 0, 0, 64, 64);
      for (let x = 0; x < 64;) { const l = 2 + (alea() * 7 | 0); R(g, alea() < 0.4 ? '#8c8f8a' : alea() < 0.5 ? '#2c3236' : '#5a646c', x, 0, l, 64); x += l + 1 + (alea() * 3 | 0); }
      voile(g, 0.3, () => { for (let i = 0; i < 260; i++) R(g, alea() < 0.5 ? '#000' : '#fff', alea() * 64 | 0, alea() * 64 | 0, 1, 1 + (alea() * 3 | 0)); });
      voile(g, 0.25, () => { for (let i = 0; i < 30; i++) R(g, alea() < 0.6 ? '#7da23d' : '#5f9a45', alea() * 64 | 0, alea() * 64 | 0, 1 + (alea() * 2 | 0), 2 + (alea() * 6 | 0)); });
      voile(g, 0.25, () => { for (let i = 0; i < 10; i++) R(g, '#1a1e20', alea() * 64 | 0, alea() * 64 | 0, 6 + alea() * 20 | 0, 1); });
    }, 8],
    // sable de quartz blanc du plateau et des bancs du gué : grains gris, éclats blancs, traces de terre grise
    sableBlanc: () => [64, 64, (g, o) => {
      const { R, alea, voile } = o; R(g, '#e9e3d3', 0, 0, 64, 64);
      for (let i = 0; i < 400; i++) R(g, alea() < 0.6 ? '#d6cfbc' : '#a39d8c', alea() * 64 | 0, alea() * 64 | 0, 1, 1);
      for (let i = 0; i < 80; i++) R(g, '#ffffff', alea() * 64 | 0, alea() * 64 | 0, 1, 1);
      voile(g, 0.2, () => { for (let i = 0; i < 8; i++) R(g, '#a39d8c', alea() * 56 | 0, alea() * 56 | 0, 6 + alea() * 10 | 0, 3 + alea() * 6 | 0); });
    }, 8],
    // rivière couleur thé : brun profond, rides en travers du courant (x du dessin : en travers sur un ruban), reflets cuivrés, un peu d'écume
    eauThe: () => [64, 64, (g, o) => {
      const { R, alea } = o; R(g, '#8a5a2b', 0, 0, 64, 64);
      for (let i = 0; i < 120; i++) R(g, alea() < 0.5 ? '#9a6a38' : '#6e4520', alea() * 64 | 0, alea() * 64 | 0, 3 + (alea() * 8 | 0), 1);
      for (let i = 0; i < 90; i++) R(g, '#c58a4a', alea() * 64 | 0, alea() * 64 | 0, 2 + (alea() * 5 | 0), 1);
      for (let i = 0; i < 40; i++) R(g, '#f4faf7', alea() * 64 | 0, alea() * 64 | 0, 1 + (alea() * 2 | 0), 1);
    }, 12],
    // rideau de chute : filets d'eau turquoise et blancs, transparent entre eux (matière transparente, la carte fait défiler la texture vers le bas).
    // Posé en ruban vertical (u = la hauteur) : les filets courent le long de x du dessin
    chute: () => [64, 32, (g, o) => {
      const { alea } = o;
      for (let y = 0; y < 32; y++) { const a = 0.3 + alea() * 0.5; for (let x = 0; x < 64;) { const l = 4 + (alea() * 20 | 0);
        g.fillStyle = alea() < 0.55 ? `rgba(244,250,247,${a})` : `rgba(95,199,192,${a * 0.8})`; g.fillRect(x, y, l, 1); x += l + (alea() * 6 | 0); } }
    }],
    // planches du pont suspendu : en travers de la route (lignes du dessin), joints sombres, bois gris de pluie, quelques planches neuves plus claires
    planches: () => [64, 64, (g, o) => {
      const { R, alea, voile } = o; R(g, '#8a6a3a', 0, 0, 64, 64);
      for (let y = 0; y < 64; y += 4) { R(g, alea() < 0.2 ? '#a8865a' : alea() < 0.5 ? '#7a5c30' : '#6e5a44', 0, y, 64, 3); R(g, '#2a2014', 0, y + 3, 64, 1); }
      voile(g, 0.3, () => { for (let i = 0; i < 120; i++) R(g, alea() < 0.6 ? '#000' : '#fff', alea() * 64 | 0, alea() * 64 | 0, 3 + alea() * 10 | 0, 1); });
      for (let y = 1; y < 64; y += 4) for (const x of [6, 57]) R(g, '#3a3e42', x, y, 1, 1); // les clous
    }, 4],
    // rayon de soleil dans la brume : un fuseau doux, plus dense en haut (matière additive)
    rayon: () => [16, 64, g => { const r = g.createLinearGradient(0, 0, 16, 0); r.addColorStop(0, 'rgba(255,255,255,0)'); r.addColorStop(0.5, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = r; g.fillRect(0, 0, 16, 64); g.globalCompositeOperation = 'destination-in'; const v = g.createLinearGradient(0, 0, 0, 64); v.addColorStop(0, 'rgba(0,0,0,.9)'); v.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = v; g.fillRect(0, 0, 16, 64); }],
  });
})();
