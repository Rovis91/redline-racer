// Textures propres à « chapada » (Matin sur la Chapada) : complète le catalogue de textures.js, mêmes conventions. Voir METHODE-DECOR.md.
(() => {
  Object.assign(TEXTURES, {
    // REFS 1 : grès en strates. Les parois de la V2 sont des maillages à couleurs de sommet (decors.js, extrude) : cette texture n'en donne que le grain, en gris neutre,
    // multiplié par la couleur du banc. Fissures verticales fines, joints horizontaux, piqûres claires et sombres
    grainGres: () => [64, 64, (g, o) => {
      const { R, alea, voile } = o; R(g, '#d8d4cc', 0, 0, 64, 64);
      for (let i = 0; i < 500; i++) R(g, alea() < 0.5 ? '#bcb6ac' : '#ece8e0', alea() * 64 | 0, alea() * 64 | 0, 1 + (alea() * 2 | 0), 1);
      voile(g, 0.5, () => { for (let i = 0; i < 14; i++) R(g, '#8a847a', alea() * 64 | 0, alea() * 64 | 0, 1, 3 + (alea() * 12 | 0)); }); // fissures
      voile(g, 0.35, () => { for (let i = 0; i < 6; i++) R(g, '#9a948a', alea() * 48 | 0, alea() * 64 | 0, 8 + (alea() * 16 | 0), 1); }); // joints
    }, 6],
    // REFS 5 : sol du campo rupestre, au bord de la route du plateau : gravier de quartz gris et ocre, touffes olive et dorées, lichen noir sur les éclats de quartzite
    campoSol: () => [64, 64, (g, o) => {
      const { R, alea, voile } = o; R(g, '#a8987a', 0, 0, 64, 64);
      for (let i = 0; i < 520; i++) R(g, ['#8a7a5e', '#a89478', '#b8ae98', '#7a6c54'][alea() * 4 | 0], alea() * 64 | 0, alea() * 64 | 0, 1 + (alea() * 2 | 0), 1);
      for (let i = 0; i < 46; i++) { const x = alea() * 60 | 0, y = alea() * 60 | 0, c = alea() < 0.6 ? '#6f7b3e' : '#a8944a'; for (let k = 0; k < 5; k++) R(g, c, x + (alea() * 4 | 0), y + (alea() * 4 | 0), 1, 2); } // touffes
      voile(g, 0.6, () => { for (let i = 0; i < 18; i++) R(g, '#3c3a36', alea() * 60 | 0, alea() * 60 | 0, 2 + (alea() * 4 | 0), 1 + (alea() * 2 | 0)); }); // éclats noircis
    }, 8],
    // REFS 4 : litière du sous-bois : feuilles brunes et rousses, mousse, terre sombre
    litiere: () => [64, 64, (g, o) => {
      const { R, alea, voile } = o; R(g, '#3a3424', 0, 0, 64, 64);
      for (let i = 0; i < 420; i++) R(g, ['#5a4a2c', '#6e5432', '#2a2a1a', '#4a5a2a', '#7a5a30'][alea() * 5 | 0], alea() * 64 | 0, alea() * 64 | 0, 1 + (alea() * 3 | 0), 1 + (alea() * 2 | 0));
      voile(g, 0.4, () => { for (let i = 0; i < 20; i++) R(g, '#5f7a30', alea() * 60 | 0, alea() * 60 | 0, 2 + (alea() * 5 | 0), 1 + (alea() * 3 | 0)); });
    }, 6],
    // REFS 1 et 4 : bas-côté des lacets et de la gorge : herbe verte, éclats de grès, mousse
    herbeRoche: () => [64, 64, (g, o) => {
      const { R, alea, voile } = o; R(g, '#4a6a34', 0, 0, 64, 64);
      for (let i = 0; i < 460; i++) R(g, ['#3a5a2c', '#5f7a3a', '#6f8a40', '#2e4626'][alea() * 4 | 0], alea() * 64 | 0, alea() * 64 | 0, 1, 1 + (alea() * 3 | 0));
      voile(g, 0.7, () => { for (let i = 0; i < 16; i++) R(g, alea() < 0.5 ? '#8a8478' : '#a08a68', alea() * 60 | 0, alea() * 60 | 0, 2 + (alea() * 4 | 0), 1 + (alea() * 3 | 0)); });
    }, 6],
    // REFS 3 : dalles de grès plates du lit de la rivière (lajedo) : ocre et rouille, fentes sombres, film d'eau plus sombre par endroits
    lajedo: () => [64, 64, (g, o) => {
      const { R, alea, voile } = o; R(g, '#9a7a58', 0, 0, 64, 64);
      for (let i = 0; i < 16; i++) R(g, ['#8a6a4a', '#a8865e', '#7a5a3e', '#b09070', '#6e5a48'][alea() * 5 | 0], alea() * 60 | 0, alea() * 60 | 0, 6 + (alea() * 14 | 0), 5 + (alea() * 12 | 0)); // dalles de toutes tailles
      for (let i = 0; i < 300; i++) R(g, alea() < 0.5 ? '#6e5038' : '#b8a080', alea() * 64 | 0, alea() * 64 | 0, 1, 1);
      for (let i = 0; i < 14; i++) { let x = alea() * 64 | 0, y = alea() * 64 | 0; for (let k = 0; k < 8; k++) { R(g, '#3a2a1c', x, y, 1, 1); x += alea() < 0.5 ? 1 : 0; y += alea() < 0.6 ? 1 : -1; } } // fentes en zigzag, pas de lignes droites
      voile(g, 0.3, () => { for (let i = 0; i < 6; i++) R(g, '#4a3222', alea() * 50 | 0, alea() * 50 | 0, 10 + (alea() * 14 | 0), 6 + (alea() * 10 | 0)); }); // film d'eau
    }, 6],
    // REFS 3 : l'eau du gué, peu profonde : ambre clair, rides claires et reflets du ciel, écume crème en traînées (x du dessin : en travers sur un ruban)
    eauGue: () => [64, 64, (g, o) => {
      const { R, alea } = o; R(g, '#946430', 0, 0, 64, 64);
      for (let i = 0; i < 10; i++) R(g, alea() < 0.5 ? '#a8742f' : '#7a5226', alea() * 48 | 0, alea() * 48 | 0, 12 + (alea() * 16 | 0), 10 + (alea() * 14 | 0)); // fond et profondeur, en grandes plages douces
      for (let i = 0; i < 70; i++) R(g, ['#c8a070', '#b8c4c4', '#d8dcd4'][alea() * 3 | 0], alea() * 56 | 0, alea() * 63 | 0, 6 + (alea() * 9 | 0), 1); // reflets du ciel, en rides : c'est eux qui font lire de l'eau
      for (let i = 0; i < 10; i++) R(g, '#f4efe0', alea() * 62 | 0, alea() * 63 | 0, 2 + (alea() * 2 | 0), 1); // écume
    }, 12],
    // REFS 3 : l'eau vue en rasant : le ciel pâle du matin en miroir, des plages couleur thé là où l'on voit le fond, quelques rides sombres et de l'écume (matière lumineuse : un reflet ne dépend pas de l'ombre)
    eauCiel: () => [64, 64, (g, o) => {
      const { R, alea } = o; R(g, '#b8bcb2', 0, 0, 64, 64);
      for (let i = 0; i < 6; i++) R(g, alea() < 0.6 ? '#9a7a48' : '#a8885a', alea() * 50 | 0, alea() * 50 | 0, 8 + (alea() * 14 | 0), 6 + (alea() * 10 | 0)); // le fond couleur thé, par plages
      for (let i = 0; i < 50; i++) R(g, alea() < 0.5 ? '#c8ccc0' : '#e0d8b8', alea() * 56 | 0, alea() * 63 | 0, 6 + (alea() * 10 | 0), 1); // le ciel en rides
      for (let i = 0; i < 20; i++) R(g, '#5a4a30', alea() * 58 | 0, alea() * 63 | 0, 4 + (alea() * 6 | 0), 1);
      for (let i = 0; i < 34; i++) R(g, '#f4efe0', alea() * 54 | 0, alea() * 63 | 0, 4 + (alea() * 10 | 0), 1); // l'écume en traînées : le courant
    }, 12],
    // REFS 3 : l'eau couleur thé des poços, foncée et saturée (plus sombre que tout le sol autour : c'est ce qui la fait lire comme de l'eau),
    // des plages ambre là où l'on voit le fond, le ciel en rides bleutées, de l'écume en traînées (matière lumineuse : un reflet ne dépend pas de l'ombre)
    eauPoco: () => [64, 64, (g, o) => {
      const { R, alea } = o; R(g, '#4a2614', 0, 0, 64, 64);
      for (let i = 0; i < 40; i++) R(g, alea() < 0.6 ? '#6a3418' : '#9a5228', alea() * 40 | 0, alea() * 64 | 0, 14 + (alea() * 30 | 0), 1 + (alea() * 2 | 0)); // l'ambre du fond, en traînées du courant (des plaques faisaient un damier)
      for (let i = 0; i < 18; i++) R(g, alea() < 0.6 ? '#6a7c84' : '#9aacb0', alea() * 54 | 0, alea() * 63 | 0, 5 + (alea() * 10 | 0), 1); // le ciel en rides, discret (des rides vives faisaient de la tôle)
      for (let i = 0; i < 6; i++) R(g, '#e8e2d6', alea() * 56 | 0, alea() * 63 | 0, 3 + (alea() * 5 | 0), 1); // l'écume, rare
    }, 12],
    // REFS 5 : pierre sèche d'Igatu : moellons bruts empilés sans mortier, gris-ocre, joints creux sombres, lichen
    // t = 1 : dessin tourné d'un quart, pour un ruban vertical (u = la hauteur) : les assises restent horizontales
    pierreSeche: t => [64, 64, (g, o) => {
      const { alea, voile } = o, R = t ? (g, c, x, y, w, hh) => o.R(g, c, y, x, hh, w) : o.R; R(g, '#2e2a24', 0, 0, 64, 64);
      for (let y = 0; y < 64;) { const hh = 3 + (alea() * 4 | 0); for (let x = -(alea() * 6 | 0); x < 64;) { const l = 5 + (alea() * 9 | 0); R(g, ['#8a7a62', '#9a8a70', '#7a6c58', '#a89880', '#6e6252'][alea() * 5 | 0], x + 1, y + 1, l - 1, hh - 1); x += l; } y += hh; }
      voile(g, 0.3, () => { for (let i = 0; i < 40; i++) R(g, alea() < 0.5 ? '#c8c0a8' : '#5a6a3a', alea() * 64 | 0, alea() * 64 | 0, 2 + (alea() * 3 | 0), 1 + (alea() * 2 | 0)); });
    }, 3],
    // REFS 5 : tuiles canal de terre cuite des maisons encore couvertes d'Igatu : rangs ondulés, tuiles plus claires ou noircies
    tuileCuite: () => [64, 64, (g, o) => {
      const { R, alea } = o; R(g, '#7a4028', 0, 0, 64, 64);
      for (let y = 0; y < 64; y += 6) for (let x = (y / 6 & 1) * 4; x < 64; x += 8) { R(g, ['#9a5a3a', '#a8684a', '#8a4a30', '#6a3a28'][alea() * 4 | 0], x, y, 7, 5); R(g, '#4a2418', x, y + 5, 7, 1); }
    }, 2],
    // rivière couleur thé : brun profond, rides en travers du courant (x du dessin : en travers sur un ruban), reflets cuivrés, un peu d'écume
    eauThe: () => [64, 64, (g, o) => {
      const { R, alea } = o; R(g, '#8a5a2b', 0, 0, 64, 64);
      for (let i = 0; i < 120; i++) R(g, alea() < 0.5 ? '#9a6a38' : '#6e4520', alea() * 64 | 0, alea() * 64 | 0, 3 + (alea() * 8 | 0), 1);
      for (let i = 0; i < 90; i++) R(g, '#c58a4a', alea() * 64 | 0, alea() * 64 | 0, 2 + (alea() * 5 | 0), 1);
      for (let i = 0; i < 40; i++) R(g, '#f4faf7', alea() * 64 | 0, alea() * 64 | 0, 1 + (alea() * 2 | 0), 1);
    }, 12],
    // REFS 2 : rideau de chute : filets d'eau blancs et gris-bleu pâle, transparents entre eux (pas de turquoise : la V1 se lisait comme des blocs de couleur) (matière transparente, la carte fait défiler la texture vers le bas).
    // Posé en ruban vertical (u = la hauteur) : les filets courent le long de x du dessin
    chute: () => [64, 32, (g, o) => {
      const { alea } = o; g.fillStyle = 'rgba(214,226,228,.18)'; g.fillRect(0, 0, 64, 32);
      for (let y = 0; y < 32; y += 4) { const a = 0.45 + alea() * 0.4; for (let x = 0; x < 64;) { const l = 28 + (alea() * 36 | 0); // de longs filets continus, larges, peu de trous
        g.fillStyle = alea() < 0.75 ? 'rgba(246,249,248,' + a + ')' : 'rgba(196,210,214,' + a + ')'; g.fillRect(x, y + (alea() * 2 | 0), l, 3); x += l + (alea() * 3 | 0); } }
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
