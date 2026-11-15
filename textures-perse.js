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
      const { R, alea, voile } = o; for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) R(g, (x + y) & 1 ? '#a8826a' : '#c8a888', x * 16, y * 16, 16, 16);
      voile(g, 0.15, () => { for (let i = 0; i < 40; i++) R(g, '#5a5048', alea() * 64 | 0, alea() * 64 | 0, 1 + (alea() * 6 | 0), 1); });
      voile(g, 0.35, () => { for (let k = 0; k < 64; k += 16) { R(g, '#3a3028', 0, k, 64, 1); R(g, '#3a3028', k, 0, 1, 64); } });
    }, 8],
    // frise des Immortels sur pierre dorée : rangée de gardes de profil (lance, carquois, robe lapis ou rouge), cyprès entre eux, bandeau de rosettes en haut (REFS §3) ; étirée en hauteur sur un mur de 3 m
    frise: () => [64, 32, (g, { R }) => {
      R(g, PIERRE, 0, 0, 64, 32); R(g, '#a88a58', 0, 26, 64, 6); R(g, '#a88a58', 0, 4, 64, 1);
      R(g, '#a88a58', 0, 0, 64, 1); for (let x = 2; x < 64; x += 6) { R(g, OR, x, 1, 3, 3); R(g, '#a88a58', x + 1, 2, 1, 1); } // bandeau de rosettes (pas de créneaux : REFS §2)
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
    auvent: (a, b) => [32, 16, (g, { R }) => { R(g, b, 0, 0, 32, 16); for (let x = 0; x < 32; x += 8) { R(g, a, x, 0, 4, 16); R(g, b, x + 4, 0, 4, 16); } R(g, IVOIRE, 0, 13, 32, 1); for (let x = 0; x < 32; x += 4) R(g, a, x, 14, 2, 2); }, 4], // bandes de 0,5 m : plus fines, elles se fondaient en blanc à distance
    // nez des marches du grand escalier, posé sur la chaussée
    marchesPerse: () => [32, 16, (g, { R }) => { R(g, '#b8a07c', 0, 0, 32, 16); R(g, '#a88e70', 0, 9, 32, 7); R(g, '#3e342d', 0, 0, 32, 4); R(g, '#f0e0c0', 0, 4, 32, 1); for (const x of [0, 11, 22]) R(g, '#6a5a48', x, 3, 1, 13); }], // grandes dalles : joints de marche et joints en long // REFS §2 : marches basses de pierre, nez d'ombre et arête claire
    // façade de palais vue de loin (fond, à contre-jour) : iwan central, arcades sur deux niveaux, frise de faïence, toit plat
    palais: () => [64, 32, (g, { R }) => {
      R(g, '#b0905a', 0, 0, 64, 32); R(g, TURQ, 0, 4, 64, 2); R(g, '#8a6a40', 0, 0, 64, 2);
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

    // ---------- V2 (fiches de docs/REFS-perse.md) ----------
    // REFS §1 : appareil de la terrasse, grands blocs horizontaux à joints fins, gris miel ; 8 m par motif
    appareil: () => [64, 64, (g, { R, alea }) => {
      R(g, '#3e342d', 0, 0, 64, 64); const T = ['#a88e73', '#9c846c', '#b09680', '#948070', '#a48a74'];
      for (let y = 0, r = 0; y < 64; r++) { const hh = [14, 10, 16, 12, 12][r % 5]; for (let x = -(alea() * 16 | 0); x < 64;) { const w = 12 + (alea() * 18 | 0); R(g, T[alea() * 5 | 0], x + 1, y + 1, w - 1, hh - 1); R(g, '#bca48a', x + 1, y + 1, w - 1, 1); x += w; } y += hh; }
    }, 8],
    // REFS §3 : reliefs de l'Apadana, deux registres de porteurs de tribut de profil, séparés par des bandeaux de rosettes ; traces de peinture rouge, bleue, ocre
    relief: () => [64, 32, (g, { R }) => {
      R(g, '#bca07a', 0, 0, 64, 32);
      for (const y of [0, 15, 30]) { R(g, '#8a7050', 0, y, 64, 2); for (let x = 1; x < 64; x += 4) R(g, '#d8c098', x, y, 2, 2); } // rosettes
      for (const [y, d] of [[3, 0], [18, 2]]) for (let k = 0; k < 8; k++) { const x = k * 8 + d, robe = ['#a34a33', '#2e5e9e', '#a88050', '#6a4a8a'][(k + d) % 4];
        R(g, '#5a4430', x + 2, y, 2, 2); R(g, '#3a2818', x + 1, y, 1, 2); R(g, robe, x + 1, y + 2, 4, 7); R(g, '#5a4430', x + 1, y + 9, 1, 2); R(g, '#5a4430', x + 4, y + 9, 1, 2); // tête, coiffe, robe, pieds
        if (k % 3 === 0) R(g, OR, x + 5, y + 3, 2, 3); else if (k % 3 === 1) R(g, '#8a7050', x + 5, y + 2, 1, 6); } // vase porté, ou bâton
    }],
    // REFS §2-3 : bandeau de rosettes à huit pétales (couronnement de l'escalier)
    rosettes: () => [8, 32, (g, { R }) => { R(g, '#8a7050', 0, 0, 8, 32); for (let y = 4; y < 32; y += 8) { R(g, '#d8c098', 2, y - 2, 5, 5); R(g, '#d8c098', 1, y - 1, 7, 3); R(g, '#d8c098', 3, y - 3, 3, 7); R(g, OR, 3, y, 3, 1); R(g, OR, 4, y - 1, 1, 3); } }], // posé sur un ruban vertical : x en hauteur, y le long
    // REFS §6-7 : taureau ailé en haut-relief sur le montant de la Porte, de profil, pierre sombre sur pierre dorée ; humain = tête barbue à tiare (lamassu), sinon tête de taureau ; droite = tête à droite de l'image
    lamassuRelief: (humain, droite) => [48, 64, (g, { R }) => { // aux proportions du montant (7,6 × 10,5 m)
      if (droite) { g.translate(48, 0); g.scale(-1, 1); }
      const S1 = '#3e3834', S2 = '#5a524a', AI = '#d8ccb0', AI2 = '#6a6050';
      R(g, '#c4a478', 0, 0, 48, 64); R(g, '#8a6e48', 0, 0, 48, 2); R(g, '#8a6e48', 0, 62, 48, 2);
      for (let r = 0; r < 7; r++) { const y = 6 + r * 3.5 | 0, x = 14 + r * 2; R(g, AI2, x - 1, y - 1, 46 - x, 4); R(g, AI, x, y, 45 - x, 2); for (let k = x + 2; k < 46; k += 4) R(g, AI2, k, y, 1, 2); } // la grande aile claire, plume à plume, qui monte vers l'arrière
      R(g, S1, 12, 31, 33, 12); R(g, S2, 14, 33, 28, 2); R(g, S1, 44, 31, 3, 11); // corps, queue
      for (const x of [13, 18, 35, 40]) { R(g, S1, x, 43, 4, 16); R(g, '#241f1c', x - 1, 58, 6, 3); } // pattes, sabots
      R(g, S1, 7, 22, 9, 17); // poitrail
      if (humain) { R(g, S2, 2, 16, 9, 8); R(g, '#241f1c', 2, 23, 9, 9); for (let y = 24; y < 32; y += 2) R(g, '#7a7064', 3, y, 7, 1); R(g, '#f0b840', 1, 6, 11, 10); R(g, '#8a6a20', 1, 9, 11, 1); R(g, '#8a6a20', 1, 12, 11, 1); R(g, '#c4a478', 5, 19, 2, 1); } // tête de face, barbe en boucles, tiare d'or à cornes
      else { R(g, S2, 0, 20, 10, 8); R(g, S1, 0, 25, 5, 4); R(g, '#f0b840', 4, 13, 2, 7); R(g, '#f0b840', 8, 12, 2, 8); R(g, '#c4a478', 5, 22, 2, 1); } // tête de taureau, cornes d'or
    }],
    // REFS §1 : joints de grandes dalles sur la chaussée de la route royale, transparents ailleurs (les marquages du moteur restent visibles) ; x en travers, y le long
    joints: () => [32, 32, (g, { R }) => { g.clearRect(0, 0, 32, 32); R(g, '#7a6a58', 0, 0, 32, 1); R(g, '#7a6a58', 0, 16, 32, 1); }], // joints en travers seulement, clairs : sans damier ni taches
    // REFS §9 : calcaire du Kuh-e Rahmat, gris miel en strates horizontales, éboulis plus sombres au pied
    strates: () => [64, 64, (g, { R, alea }) => { R(g, '#8a7c6c', 0, 0, 64, 64); for (let y = 0; y < 64; y += 5 + (alea() * 4 | 0)) { R(g, '#5f5046', 0, y, 64, 1); R(g, '#a8987e', 0, y + 1, 64, 1); }
      for (let i = 0; i < 120; i++) R(g, alea() < 0.5 ? '#6e6052' : '#9a8a76', alea() * 64 | 0, alea() * 64 | 0, 2 + (alea() * 4 | 0), 1); R(g, '#5f5046', 0, 56, 64, 8); }, 40],
    // REFS §3 : panneau du lion qui attaque le taureau, l'emblème des escaliers (triangles d'angle)
    lionTaureau: () => [32, 32, (g, { R }) => {
      R(g, '#bca07a', 0, 0, 32, 32); R(g, '#8a7050', 0, 0, 32, 2); R(g, '#8a7050', 0, 30, 32, 2);
      R(g, '#7a7068', 4, 14, 20, 9); R(g, '#7a7068', 22, 9, 6, 7); R(g, '#7a7068', 5, 23, 2, 6); R(g, '#7a7068', 20, 23, 2, 6); R(g, '#4a4440', 27, 7, 1, 3); R(g, '#4a4440', 23, 6, 1, 3); // le taureau, cornes
      R(g, '#a87a3a', 6, 6, 12, 8); R(g, '#c8963a', 3, 3, 7, 7); R(g, '#a87a3a', 15, 12, 3, 7); R(g, '#a87a3a', 6, 13, 2, 6); R(g, '#6a4a20', 4, 4, 2, 2); // le lion cabré sur son dos, crinière
    }],
    // REFS §6, §8 : brique crue enduite (kahgel), ocre, paille en semis, assises effacées ; 4 m
    briqueCrue: () => [32, 32, (g, { R, alea }) => {
      R(g, '#c49a5e', 0, 0, 32, 32); for (let y = 0; y < 32; y += 4) R(g, '#b48a52', 0, y, 32, 1);
      for (let i = 0; i < 70; i++) R(g, alea() < 0.5 ? '#d8b078' : '#a47a48', alea() * 32 | 0, alea() * 32 | 0, 2, 1);
    }, 4],
    // REFS §5, §8 : mur de brique crue sur socle de pierre, percé de fenêtres et de niches en pierre noire à corniche à gorge (cavetto) ; 16 m par motif
    murSalle: () => [64, 64, (g, { R }) => {
      R(g, '#c49a5e', 0, 0, 64, 64); for (let y = 0; y < 56; y += 4) R(g, '#b48a52', 0, y, 64, 1); R(g, '#8a7c6c', 0, 56, 64, 8); R(g, '#6a5e50', 0, 56, 64, 1);
      for (const x of [6, 38]) { R(g, '#3a3430', x, 18, 20, 36); R(g, '#1e1a18', x + 4, 26, 12, 28); for (let k = 0; k < 3; k++) R(g, '#4a4440', x - 2 + k, 18 - 2 * k, 24 - 2 * k, 2); R(g, '#7a6e60', x + 5, 34, 2, 10); R(g, '#7a6e60', x + 13, 34, 2, 10); }
    }, 16],
    // REFS §5 : encadrement de porte de pierre noire : corniche à gorge, chambranles à reliefs (le roi sur son trône sous l'ombrelle), vide sombre
    portePierre: () => [32, 64, (g, { R }) => {
      R(g, '#3e3834', 0, 0, 32, 64); R(g, '#141010', 8, 16, 16, 48); for (let k = 0; k < 4; k++) R(g, k & 1 ? '#5a524a' : '#2e2824', k, 4 + 2 * k, 32 - 2 * k, 2); R(g, '#6a6056', 0, 2, 32, 2);
      for (const x of [1, 25]) { R(g, '#5a524a', x + 1, 24, 4, 3); R(g, '#7a3a2a', x + 1, 27, 4, 12); R(g, '#5a524a', x, 39, 6, 2); R(g, OR, x, 20, 6, 2); R(g, '#5a524a', x + 2, 22, 1, 2); } // le roi (robe rouge), le trône, l'ombrelle d'or
    }],
    // REFS §5 : plafond de cèdre à caissons peints (lapis, rouge, or) ; 6 m
    plafondCedre: () => [32, 32, (g, { R }) => {
      R(g, '#6a4424', 0, 0, 32, 32); for (const [x, y] of [[2, 2], [18, 2], [2, 18], [18, 18]]) { R(g, '#1d3a8a', x, y, 12, 12); R(g, ROUGE, x + 3, y + 3, 6, 6); R(g, OR, x + 5, y + 5, 2, 2); }
      R(g, '#4a2e18', 0, 15, 32, 2); R(g, '#4a2e18', 15, 0, 2, 32);
    }, 6],
    // REFS §12 : boutiques (hojreh) du bazar en niches brisées, deux par motif de 8 m : tapis, cuivres, épices, étoffes ; cadre de brique et liseré de faïence
    hojreh: () => [64, 32, (g, { R }) => {
      R(g, '#7a4630', 0, 0, 64, 32); for (let y = 0; y < 32; y += 2) R(g, '#5e3424', 0, y, 64, 1);
      const B = [[ROUGE, LAPIS, OR], ['#c8742e', '#e89a50', '#7a4420'], ['#d9a21b', '#b5391e', '#7a5a20'], [TURQ, IVOIRE, ROUGE]];
      for (let k = 0; k < 4; k++) { const x = k * 16 + 2, [a, b, c] = B[k]; R(g, TURQ, x - 1, 7, 14, 25); R(g, '#24140c', x, 9, 12, 23); for (let j = 0; j < 5; j++) { R(g, TURQ, x + 1 + j, 9 - j, 10 - 2 * j, 1); R(g, '#24140c', x + 2 + j, 10 - j, 8 - 2 * j, 1); }
        R(g, '#ffd890', x + 4, 11, 4, 2); // lampe au fond de la boutique
        if (k === 0) { R(g, a, x + 1, 14, 5, 14); R(g, c, x + 2, 16, 3, 10); R(g, b, x + 6, 15, 5, 13); R(g, IVOIRE, x + 7, 18, 3, 6); } // tapis pendus
        else if (k === 1) for (let j = 0; j < 3; j++) { R(g, a, x + 1 + j * 4, 15 + j, 3, 3); R(g, b, x + 2 + j * 3, 22, 3, 4); R(g, c, x + 1, 27, 10, 1); } // cuivres
        else if (k === 2) for (let j = 0; j < 4; j++) { const c2 = [a, b, c, a][j]; R(g, c2, x + 1 + j * 3, 24 - (j & 1) * 2, 2, 2); R(g, c2, x + j * 3, 26 - (j & 1) * 2, 4, 5); } // épices en cônes
        else { for (let j = 0; j < 4; j++) R(g, [a, b, c, a][j], x + 1 + j * 3, 13, 2, 15); } // étoffes
        R(g, '#5a3a20', x, 29, 12, 3); } // seuil, comptoir
    }],
    // REFS §12 : brique de la voûte du bazar, buff à joints clairs, assises en arêtes de poisson et bouton de faïence
    voute: () => [32, 32, (g, { R }) => {
      R(g, '#8a5438', 0, 0, 32, 32); for (let y = 0; y < 32; y += 4) for (let x = 0; x < 32; x += 4) { const o = (y >> 2) & 1 ? 2 : 0; R(g, '#a8704c', x + o, y, 3, 1); R(g, '#5a3424', x + o, y + 3, 3, 1); }
      for (const [x, y] of [[8, 8], [24, 24]]) { R(g, TURQ, x - 1, y - 1, 3, 3); R(g, IVOIRE, x, y, 1, 1); }
    }, 3],
    // REFS §14 : tapis (1,2 × 1,8 m) : champ, médaillon, écoinçons, bordure d'un sixième de la largeur
    tapis: (fond, bord, med) => [32, 48, (g, { R }) => {
      R(g, bord, 0, 0, 32, 48); R(g, IVOIRE, 5, 5, 22, 38); R(g, fond, 6, 6, 20, 36);
      for (let y = 1; y < 48; y += 4) { R(g, med, 2, y, 2, 2); R(g, med, 28, y, 2, 2); }
      losange(g, R, 16, 24, 9, med); losange(g, R, 16, 24, 6, IVOIRE); losange(g, R, 16, 24, 4, bord); losange(g, R, 16, 24, 1, med);
      for (const [x, y] of [[6, 6], [22, 6], [6, 38], [22, 38]]) R(g, med, x, y, 4, 4);
      for (let x = 0; x < 32; x += 2) { R(g, IVOIRE, x, 0, 1, 1); R(g, IVOIRE, x, 47, 1, 1); } // franges
    }],
    // REFS §15 : champs de la plaine en bandes : blé, luzerne, labour ; 12 m
    champ: (a, b) => [32, 32, (g, { R }) => { R(g, a, 0, 0, 32, 32); for (let x = 0; x < 32; x += 4) R(g, b, x, 0, 1, 32); }, 12],
    // REFS §10 : parterre creusé : fleurs en rangs (roses, soucis), herbe ; 4 m
    parterre: () => [32, 32, (g, { R }) => {
      R(g, '#4a7a34', 0, 0, 32, 32); for (let y = 2; y < 32; y += 6) for (let x = (y % 12) ? 1 : 4; x < 32; x += 6) { R(g, ['#c8323c', '#f0c020', '#f4ead0', '#e87a2a'][(x + y) % 4], x, y, 2, 2); R(g, '#3a6a2a', x, y + 2, 2, 1); }
    }, 4],
    // REFS §13 : muqarnas de la voûte du portail : alvéoles étagées, lapis, turquoise, ivoire, or
    muqarnas: () => [32, 32, (g, { R }) => {
      R(g, LAPIS, 0, 0, 32, 32); for (let y = 0; y < 32; y += 8) for (let x = (y & 8) ? 4 : 0; x < 32; x += 8) { R(g, TURQ, x, y, 7, 6); R(g, IVOIRE, x + 1, y + 6, 5, 1); R(g, '#12245a', x + 2, y + 1, 3, 4); R(g, OR, x + 3, y, 1, 1); }
    }, 3],
    // REFS §13 : bandeau d'inscription du portail, lettres ivoire sur lapis (motif, pas un texte)
    inscription: () => [64, 8, (g, { R }) => { R(g, LAPIS, 0, 0, 64, 8); R(g, OR, 0, 0, 64, 1); R(g, OR, 0, 7, 64, 1); for (let x = 1; x < 64; x += 3) { R(g, IVOIRE, x, 2 + (x % 2), 1, 4 - (x % 2)); if (x % 9 === 1) R(g, IVOIRE, x, 2, 3, 1); } }],
    // REFS §15 : tente noire des nomades (poil de chèvre), lés clairs
    tente: () => [16, 16, (g, { R }) => { R(g, '#242020', 0, 0, 16, 16); for (let x = 0; x < 16; x += 4) R(g, '#3a3430', x, 0, 1, 16); R(g, '#7a6a58', 0, 14, 16, 2); }],
  });
})();
