// Textures propres à « perse » (Route royale, Persépolis au couchant) : complète le catalogue de textures.js (mêmes conventions). Voir METHODE-DECOR.md et docs/SPEC-PERSE.md.
// Miniature persane : aplats sans dégradé, contours nets, motifs répétés partout hors de la piste. Palette de la spec (§2).
(() => {
  const ROUGE = '#c8323c', OR = '#f0b840', TURQ = '#2aa39a', LAPIS = '#1d3a8a', CYPRES = '#2f5a3a', PIERRE = '#d8b878', GRISE = '#8a8478', IVOIRE = '#f4ead0', BRIQUE = '#9a5a38', NUIT = '#1d2a5a';
  const losange = (g, R, cx, cy, r, c) => { for (let k = -r; k <= r; k++) R(g, c, cx - (r - Math.abs(k)), cy + k, 2 * (r - Math.abs(k)) + 1, 1); }; // losange plein, en pixels
  Object.assign(TEXTURES, {
    // bordure de tapis : liseré or, bande rouge à losanges lapis cernés d'ivoire, liseré turquoise (murs bas, vibreurs du décor) ; 4 m par motif
    tapisBord: () => [64, 16, (g, { R }) => {
      R(g, ROUGE, 0, 0, 64, 16); R(g, OR, 0, 0, 64, 2); R(g, OR, 0, 14, 64, 2); R(g, TURQ, 0, 2, 64, 1); R(g, TURQ, 0, 13, 64, 1);
      for (let x = 8; x < 64; x += 16) { losange(g, R, x, 8, 5, IVOIRE); losange(g, R, x, 8, 4, LAPIS); losange(g, R, x, 8, 1, OR); }
      for (let x = 0; x < 64; x += 16) { R(g, OR, x - 1, 7, 3, 3); }
    }, 4],
    // tapis de l'allée de la salle : champ rouge, médaillons or et lapis, bordure or ; plaqué en plan
    tapisAllee: () => [64, 64, (g, { R }) => {
      R(g, ROUGE, 0, 0, 64, 64); R(g, OR, 0, 0, 64, 3); R(g, OR, 0, 61, 64, 3); R(g, LAPIS, 0, 3, 64, 2); R(g, LAPIS, 0, 59, 64, 2);
      losange(g, R, 32, 32, 18, OR); losange(g, R, 32, 32, 15, LAPIS); losange(g, R, 32, 32, 10, ROUGE); losange(g, R, 32, 32, 5, IVOIRE); losange(g, R, 32, 32, 2, TURQ);
      for (const [x, y] of [[8, 12], [56, 12], [8, 52], [56, 52]]) { losange(g, R, x, y, 4, OR); losange(g, R, x, y, 2, TURQ); }
    }, 10],
    // dallage de la salle : damier de marbre ivoire et pierre grise, joints sombres, 2 m par dalle
    dallage: () => [64, 64, (g, o) => {
      const { R, alea, voile } = o; for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) R(g, (x + y) & 1 ? GRISE : IVOIRE, x * 16, y * 16, 16, 16);
      voile(g, 0.15, () => { for (let i = 0; i < 40; i++) R(g, '#5a5048', alea() * 64 | 0, alea() * 64 | 0, 1 + (alea() * 6 | 0), 1); });
      voile(g, 0.35, () => { for (let k = 0; k < 64; k += 16) { R(g, '#3a3028', 0, k, 64, 1); R(g, '#3a3028', k, 0, 1, 64); } });
    }, 8],
    // frise des Immortels sur pierre dorée : rangée de gardes de profil (lance, carquois, robe lapis ou rouge), cyprès entre eux, crénelage en haut ; étirée en hauteur sur un mur de 3 m
    frise: () => [64, 32, (g, { R }) => {
      R(g, PIERRE, 0, 0, 64, 32); R(g, '#a88a58', 0, 26, 64, 6); R(g, '#a88a58', 0, 4, 64, 1);
      for (let x = 0; x < 64; x += 8) { R(g, PIERRE, x, 0, 4, 3); R(g, '#a88a58', x + 4, 2, 4, 2); } // créneaux à degrés
      for (let k = 0; k < 4; k++) { const x = k * 16 + 3, robe = k & 1 ? LAPIS : ROUGE;
        R(g, '#5a3a20', x + 1, 8, 3, 3); R(g, '#2a1a10', x, 7, 3, 2); R(g, '#2a1a10', x + 3, 10, 1, 3); // tête, coiffe, barbe
        R(g, robe, x, 11, 5, 11); R(g, OR, x, 15, 5, 1); R(g, '#5a3a20', x + 1, 22, 1, 3); R(g, '#5a3a20', x + 3, 22, 1, 3); // robe, ceinture, pieds
        R(g, '#4a3020', x + 6, 5, 1, 20); R(g, OR, x + 5, 4, 3, 2); R(g, OR, x - 1, 12, 2, 7); // lance, pointe, carquois
        R(g, CYPRES, x + 10, 10, 3, 14); R(g, CYPRES, x + 11, 7, 1, 3); R(g, '#5a3a20', x + 11, 24, 1, 2); } // cyprès
    }],
    // faïence : carreaux turquoise et lapis à arabesques ivoire et or, 1 m par carreau
    faience: () => [32, 32, (g, { R }) => {
      R(g, TURQ, 0, 0, 32, 32); for (const [x, y] of [[0, 0], [16, 16]]) R(g, LAPIS, x, y, 16, 16);
      for (const [x, y] of [[8, 8], [24, 24], [24, 8], [8, 24]]) { losange(g, R, x, y, 6, IVOIRE); losange(g, R, x, y, 4, (x + y) & 16 ? TURQ : LAPIS); losange(g, R, x, y, 1, OR); }
      for (let k = 0; k < 32; k += 16) { R(g, OR, k, 0, 1, 32); R(g, OR, 0, k, 32, 1); }
    }, 2],
    // fût de colonne cannelé : pierre grise, cannelures sombres serrées, joints de tambours
    cannelure: () => [32, 32, (g, o) => {
      const { R, voile } = o; R(g, '#a8a090', 0, 0, 32, 32); for (let x = 0; x < 32; x += 4) { R(g, '#6a645a', x, 0, 1, 32); R(g, '#c8c0b0', x + 2, 0, 1, 32); }
      voile(g, 0.4, () => { R(g, '#3a3530', 0, 0, 32, 1); R(g, '#3a3530', 0, 16, 32, 1); });
    }, 3],
    // chapiteau et taureaux : pierre grise sculptée, boucles de pelage en semis, liseré or (la peinture d'origine)
    sculpte: () => [32, 32, (g, { R, alea }) => {
      R(g, GRISE, 0, 0, 32, 32); for (let i = 0; i < 90; i++) { const x = alea() * 30 | 0, y = alea() * 30 | 0; R(g, '#5a5448', x, y, 2, 1); R(g, '#b0a898', x, y + 1, 2, 1); }
      R(g, OR, 0, 0, 32, 1); R(g, OR, 0, 31, 32, 1);
    }, 2],
    // ailes des taureaux : plumes en rangées, pierre et or
    ailes: () => [32, 32, (g, { R }) => {
      R(g, '#9a9282', 0, 0, 32, 32); for (let y = 0; y < 32; y += 4) for (let x = (y & 4) * 0.5; x < 32; x += 4) { R(g, '#6a6258', x, y, 1, 4); R(g, '#c8c0b0', x + 1, y + 3, 3, 1); }
      R(g, OR, 0, 0, 32, 2);
    }],
    // arcades de brique du bazar : arcs brisés sombres (boutiques), cadres de faïence, briques en assises
    arcades: () => [64, 32, (g, o) => {
      const { R, voile } = o; R(g, BRIQUE, 0, 0, 64, 32); voile(g, 0.3, () => { for (let y = 0; y < 32; y += 2) R(g, '#5a3020', 0, y, 64, 1); });
      for (let k = 0; k < 2; k++) { const x = k * 32 + 4; R(g, TURQ, x - 1, 6, 26, 26); R(g, '#2a160c', x + 1, 12, 22, 20);
        for (let j = 0; j < 6; j++) { R(g, TURQ, x + 1 + j, 12 - j, 22 - 2 * j, 1); R(g, '#2a160c', x + 2 + j, 13 - j, 20 - 2 * j, 1); }
        R(g, OR, x + 3, 18, 18, 2); R(g, ROUGE, x + 3, 20, 6, 6); R(g, TURQ, x + 9, 21, 6, 5); R(g, OR, x + 15, 20, 6, 6); } // marchandises sur l'étal du fond
    }],
    // auvent rayé des étals : bandes de deux couleurs, frange festonnée
    auvent: (a, b) => [32, 16, (g, { R }) => { for (let x = 0; x < 32; x += 8) { R(g, a, x, 0, 4, 16); R(g, b, x + 4, 0, 4, 16); } R(g, IVOIRE, 0, 13, 32, 1); for (let x = 0; x < 32; x += 4) R(g, a, x, 14, 2, 2); }, 2],
    // façade de palais vue de loin (fond, à contre-jour) : iwan central, arcades sur deux niveaux, frise de faïence, créneaux
    palais: () => [64, 32, (g, { R }) => {
      R(g, '#b0905a', 0, 0, 64, 32); R(g, TURQ, 0, 4, 64, 2); for (let x = 0; x < 64; x += 4) R(g, '#b0905a', x, 0, 2, 2);
      for (let y of [8, 19]) for (let x = 2; x < 64; x += 6) { if (x > 24 && x < 40) continue; R(g, '#3a2418', x, y, 4, 8); R(g, LAPIS, x, y, 4, 1); }
      R(g, LAPIS, 25, 6, 14, 26); R(g, '#2a1a10', 27, 10, 10, 22); R(g, OR, 25, 6, 14, 1);
    }],
    // ciel de miniature : volutes de nuages ivoire cernées d'or sur fond transparent, pour des panneaux plats au loin
    volute: () => [64, 32, (g, { R }) => {
      g.clearRect(0, 0, 64, 32);
      const boucle = (cx, cy, r) => { for (let y = -r; y <= r; y++) { const w = Math.round(Math.sqrt(r * r - y * y)); R(g, OR, cx - w - 1, cy + y, 2 * w + 3, 1); } for (let y = -r + 1; y < r; y++) { const w = Math.round(Math.sqrt((r - 1) ** 2 - y * y)); R(g, IVOIRE, cx - w, cy + y, 2 * w + 1, 1); } };
      for (const [x, y, r] of [[12, 20, 8], [24, 14, 10], [38, 16, 9], [50, 21, 7], [30, 23, 7]]) boucle(x, y, r);
      R(g, '#e8d8b0', 6, 24, 50, 4);
    }],
    // falaise du Kuh-e Rahmat au fond : grès en strates, tombeaux rupestres cruciformes
    falaise: () => [64, 64, (g, { R, alea }) => {
      R(g, '#a07a58', 0, 0, 64, 64); for (let y = 0; y < 64; y += 6) R(g, '#8a6648', 0, y + (alea() * 2 | 0), 64, 2);
      for (const x of [10, 40]) { R(g, '#4a3020', x, 18, 14, 30); R(g, '#4a3020', x - 6, 26, 26, 10); R(g, '#2a1a10', x + 4, 36, 6, 12); }
    }],
  });
})();
