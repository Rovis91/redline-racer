// Textures propres à « wangan » : complète le catalogue de textures.js, mêmes conventions. Voir METHODE-DECOR.md.
(() => {
  Object.assign(TEXTURES, {
    // dalles claires du quartier et de la promenade (tuile de 8 m, 8 px/m ; trottoir, 16 px étirés sur des centaines de mètres, en faisait 0,1) :
    // dalles de 1 m à joints, teintes inégales, quelques taches ; peu contrasté, c'est un sol
    dallesQuai: () => [64, 64, (g, { R, alea, voile }) => {
      R(g, '#a09888', 0, 0, 64, 64);
      for (let y = 0; y < 64; y += 8) for (let x = (y & 8) ? 4 : 0; x < 64 + 4; x += 8) { const v = alea() * 14 - 7 | 0; R(g, `rgb(${184 + v},${176 + v},${162 + v})`, x % 64, y + 1, 7, 7); if (x % 64 > 57) R(g, `rgb(${184 + v},${176 + v},${162 + v})`, 0, y + 1, x % 64 - 57, 7); }
      voile(g, 0.12, () => { for (let i = 0; i < 300; i++) R(g, alea() < 0.5 ? '#000' : '#fff', alea() * 64 | 0, alea() * 64 | 0, 1, 1); for (let i = 0; i < 6; i++) R(g, '#000', alea() * 56 | 0, alea() * 56 | 0, 4 + (alea() * 6 | 0), 3 + (alea() * 5 | 0)); });
    }, 8],
    // sol du port, une tuile de 32 m : dalles de béton de 4 m aux teintes inégales et joints sombres, taches d'huile, flaques sombres et lisses,
    // une paire de rails noyés (portiques sur rails), une ligne jaune de voie de circulation et des cases blanches de stockage
    solPort: () => [128, 128, (g, { R, alea }) => {
      R(g, '#3a3c40', 0, 0, 128, 128);
      for (let x = 0; x < 128; x += 16) for (let y = 0; y < 128; y += 16) { const v = 52 + alea() * 16 | 0; R(g, `rgb(${v},${v + 1},${v + 4})`, x + 1, y + 1, 15, 15); }
      for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(10,10,12,${0.15 + alea() * 0.25})`; g.beginPath(); g.ellipse(alea() * 128, alea() * 128, 2 + alea() * 6, 1 + alea() * 4, alea() * 3, 0, 6.3); g.fill(); } // huile
      for (let i = 0; i < 5; i++) { g.fillStyle = 'rgba(14,20,28,.85)'; g.beginPath(); g.ellipse(alea() * 128, alea() * 128, 5 + alea() * 9, 3 + alea() * 5, alea() * 3, 0, 6.3); g.fill(); } // flaques
      for (const x of [40, 46]) { R(g, '#1c1c1e', x, 0, 2, 128); R(g, '#8a8c90', x + 0.5, 0, 1, 128); } // rails noyés, champignon brillant
      R(g, '#d8a820', 88, 0, 2, 128); // voie de circulation
      for (let y = 4; y < 128; y += 32) { R(g, '#c8c8c0', 100, y, 26, 1); R(g, '#c8c8c0', 100, y + 12, 26, 1); R(g, '#c8c8c0', 100, y, 1, 12); } // cases de stockage
    }, 32],
    // rues de la ville, une tuile de 58 m calée sur la grille des tours : la rue (16 m) sur les bords de la tuile, ligne axiale pointillée, passages piétons aux carrefours,
    // trottoirs de 4 m autour de l'îlot, cour de l'îlot en béton (sous la tour)
    rueVille: () => [128, 128, (g, { R, alea }) => {
      R(g, '#3e4046', 0, 0, 128, 128); // asphalte assez clair pour se lire de nuit, vu d'en haut (il faisait un trou noir)
      for (let i = 0; i < 40; i++) R(g, alea() < 0.5 ? '#383a40' : '#46484e', alea() * 128 | 0, alea() * 128 | 0, 2 + alea() * 6 | 0, 1 + alea() * 3 | 0); // rapiéçages
      R(g, '#9a9a94', 18, 18, 92, 92); R(g, '#6e6e6c', 27, 27, 74, 74); // trottoir et cour
      for (let x = 22; x < 106; x += 8) { R(g, '#cfc8a8', x, 0, 4, 1); R(g, '#cfc8a8', x, 127, 4, 1); R(g, '#cfc8a8', 0, x, 1, 4); R(g, '#cfc8a8', 127, x, 1, 4); } // ligne axiale
      for (let k = 0; k < 6; k++) for (const [x, y, w, h] of [[2 + k * 3, 19, 2, 8], [2 + k * 3, 101, 2, 8], [19, 2 + k * 3, 8, 2], [101, 2 + k * 3, 8, 2]]) { R(g, '#d8d8d0', x, y, w, h); R(g, '#d8d8d0', 127 - x - w + 1, y, w, h); R(g, '#d8d8d0', x, 127 - y - h + 1, w, h); } // passages piétons
    }, 58],
  });
})();
