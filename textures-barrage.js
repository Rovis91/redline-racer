// Textures propres à « barrage » : complète le catalogue de textures.js (mêmes conventions : aplat pour ce qui émet de la lumière, dessin sinon, hasard par o.alea). Voir METHODE-DECOR.md.
// Centrale hydroélectrique soviétique des années 70 : béton coffré, grandes baies, mosaïque murale, lettres peintes en cyrillique, eau et gerbes des vannes ouvertes.
(() => {
  const semis = (g, { R, alea }, n, c, w = 64, h = 64) => { for (let i = 0; i < n; i++) R(g, c, alea() * w | 0, alea() * h | 0, 1 + (alea() * 2 | 0), 1); };
  Object.assign(TEXTURES, {

    // REFS 1 — face aval du mur : plots de 18 m (joint vertical sombre à gauche de la tuile), reprises de bétonnage tous les 3 m, une rangée de fenêtres de galerie de visite,
    // coulures sous chaque fenêtre et sous les joints, bas de tuile plus sombre ; une tuile = 18 m × 24 m (fixée par les UV de decors.js)
    faceGES: (fond = '#8d918a') => [64, 96, (g, o) => {
      const { R, alea, voile } = o; R(g, fond, 0, 0, 64, 96);
      voile(g, 0.12, () => { for (let y = 0; y < 96; y += 12) R(g, alea() < 0.5 ? '#fff' : '#000', 0, y, 64, 12); });
      voile(g, 0.18, () => { semis(g, o, 420, '#000', 64, 96); semis(g, o, 160, '#fff', 64, 96); });
      voile(g, 0.12, () => { for (let y = 6; y < 96; y += 12) R(g, '#5a5e5a', 0, y, 64, 1); });
      R(g, '#3e423e', 0, 0, 3, 96); voile(g, 0.5, () => R(g, '#b8bcb4', 3, 0, 1, 96)); voile(g, 0.25, () => { for (let x = 6; x < 64; x += 3 + (alea() * 6 | 0)) R(g, alea() < 0.5 ? '#6a6e68' : '#a4a8a0', x, 0, 1 + (alea() * 2 | 0), 96); }); // plots et coulures verticales
      for (const x of [24]) { R(g, '#1c1e1e', x, 30, 4, 4); voile(g, 0.3, () => R(g, '#2a2c2a', x + 1, 36, 3, 18 + alea() * 20 | 0)); }
      voile(g, 0.38, () => { for (let i = 0; i < 16; i++) R(g, '#2a2c2a', alea() * 64 | 0, alea() * 90 | 0, 1 + (alea() * 2 | 0), 10 + alea() * 40 | 0); R(g, '#3a3e3a', 0, 80, 64, 16); });
    }],
    // REFS 7 — roche du canyon : gris-brun, strates obliques, fissures, lichen clair
    rocheGES: (fond = '#5c5446') => [64, 64, (g, o) => {
      const { R, alea, voile } = o; R(g, fond, 0, 0, 64, 64);
      for (let i = 0; i < 26; i++) voile(g, 0.45, () => R(g, ['#6e6658', '#4a4438', '#7a7466', '#55504a'][i & 3], alea() * 60 | 0, alea() * 60 | 0, 6 + (alea() * 14 | 0), 5 + (alea() * 12 | 0)));
      voile(g, 0.55, () => { for (let i = 0; i < 40; i++) { const v = alea() < 0.5; R(g, '#2e2a24', alea() * 64 | 0, alea() * 64 | 0, v ? 1 : 3 + (alea() * 8 | 0), v ? 3 + (alea() * 8 | 0) : 1); } });
      voile(g, 0.35, () => semis(g, o, 220, '#8a8476')); voile(g, 0.45, () => { for (let i = 0; i < 14; i++) { const x = alea() * 64 | 0, y = alea() * 64 | 0; R(g, '#5e6a3e', x, y, 2 + (alea() * 4 | 0), 2 + (alea() * 3 | 0)); } }); // touffes d'herbe et de mousse voile(g, 0.3, () => { for (let i = 0; i < 6; i++) R(g, '#3a3630', 0, alea() * 64 | 0, 64, 1 + (alea() * 2 | 0)); }); // ruissellements (sur les parois, x de la texture = la hauteur)
    }, 10],
    // REFS 7 — sol de taïga : herbe sombre, mousse, aiguilles rousses, cailloux
    solGES: () => [64, 64, (g, o) => {
      const { R, alea } = o; R(g, '#4e5a3c', 0, 0, 64, 64);
      for (const [c, n] of [['#5e6a44', 260], ['#3e4a30', 260], ['#6a5a3a', 120], ['#7a7462', 50]]) for (let i = 0; i < n; i++) R(g, c, alea() * 64 | 0, alea() * 64 | 0, 1 + (alea() * 3 | 0), 1 + (alea() * 2 | 0));
    }, 12],
    // REFS 7 — façade de khrouchtchevka : panneaux préfabriqués gris-crème, 5 étages de 5 fenêtres sur 15 m, loggias à garde-corps, quelques fenêtres claires, joints des panneaux
    panneauK: (fond = '#c8c2b0') => [64, 64, (g, o) => {
      const { R, alea, voile } = o; R(g, fond, 0, 0, 64, 64);
      for (let f = 0; f < 5; f++) { const y = 2 + f * 12.6 | 0; R(g, '#9a9484', 0, y + 11, 64, 1);
        for (let k = 0; k < 5; k++) { const x = 2 + k * 12.6 | 0, lo = k === 1 || k === 3;
          R(g, alea() < 0.15 ? '#e8d8a0' : alea() < 0.5 ? '#4a5a64' : '#36424a', x + 2, y + 2, 6, 6); R(g, '#e8e4d8', x + 4, y + 2, 1, 6);
          if (lo) { R(g, '#7a7468', x, y + 7, 10, 3); voile(g, 0.6, () => R(g, '#5a3a2a', x + 1, y + 6, 8, 1)); } } }
      for (let x = 0; x < 64; x += 13) voile(g, 0.4, () => R(g, '#8a8474', x, 0, 1, 64));
      voile(g, 0.2, () => semis(g, o, 160, '#000'));
    }, 15],
    // REFS 7 — écorce de bouleau : blanc, traits noirs horizontaux ; feuillage clair du bouleau ; aiguilles du mélèze
    // REFS 3 — cuve d'un groupe : panneaux verticaux, bande de numéro claire, liseré sombre en bas
    cuveGroupe: (c = '#5fa89a') => [64, 32, (g, o) => { const { R, voile } = o; R(g, c, 0, 0, 64, 32); for (let x = 0; x < 64; x += 8) { R(g, '#3e7a6e', x, 0, 1, 32); voile(g, 0.3, () => R(g, '#fff', x + 1, 0, 1, 32)); } R(g, '#e8e4d8', 0, 6, 64, 3); R(g, '#2e4a44', 0, 29, 64, 3); }],
    ecorceB: () => [16, 64, (g, o) => { const { R, alea } = o; R(g, '#e4e2d8', 0, 0, 16, 64); for (let i = 0; i < 30; i++) R(g, '#2a2a26', alea() * 16 | 0, alea() * 64 | 0, 2 + (alea() * 5 | 0), 1); }, 4],
    feuillesB: () => [32, 32, (g, o) => { const { R, alea } = o; R(g, '#7a9a4a', 0, 0, 32, 32); for (let i = 0; i < 120; i++) R(g, alea() < 0.5 ? '#9ab85a' : '#5a7a3a', alea() * 32 | 0, alea() * 32 | 0, 2, 2); }, 3],
    aiguilles: (c = '#2e4430') => [32, 32, (g, o) => { const { R, alea } = o; R(g, c, 0, 0, 32, 32); for (let y = 0; y < 32; y += 4) R(g, '#1c2a1e', 0, y, 32, 1); for (let i = 0; i < 90; i++) R(g, alea() < 0.6 ? '#3e5a3a' : '#5a6a3a', alea() * 32 | 0, alea() * 32 | 0, 2, 1); }, 4],
    // REFS 7 — clôture de béton soviétique type ПО-2 : panneaux gris à losanges en relief, poteaux tous les 4 m (sur un ruban : x = la hauteur, y = le long)
    betonPO2: () => [32, 32, (g, o) => { const { R, voile } = o; R(g, '#a4a49a', 0, 0, 32, 32); R(g, '#c0c0b6', 0, 0, 2, 32); R(g, '#6e6e66', 0, 30, 32, 2);
      for (let x = 3; x < 30; x += 1) { const k = Math.abs(((x - 3) % 9) - 4.5); R(g, '#7e7e76', x, 8 + k | 0, 1, 1); R(g, '#7e7e76', x, 8 - k + 16 | 0, 1, 1); R(g, '#c8c8be', x, 24 - k | 0, 1, 1); } voile(g, 0.2, () => semis(g, o, 60, '#000', 32, 32)); }, 4],
    // REFS 2 — remous du bassin de dissipation : écume blanche, bouillons gris-bleu (défile dans decors.js)
    ecumeGES: () => [64, 64, (g, o) => { const { R, alea } = o; R(g, '#cfe2e6', 0, 0, 64, 64); for (let i = 0; i < 220; i++) R(g, alea() < 0.5 ? '#f4fafa' : '#9cbcc6', alea() * 64 | 0, alea() * 64 | 0, 2 + (alea() * 8 | 0), 1 + (alea() * 2 | 0)); }, 14],
    // REFS 7 — filet pare-pierres sur la paroi : maille de 1 m transparente (alphaTest)
    filet: () => [32, 32, (g, o) => { const { R } = o; g.clearRect(0, 0, 32, 32); for (let k = 0; k < 32; k++) { R(g, '#3a3c3a', k, k, 1, 1); R(g, '#3a3c3a', 31 - k, k, 1, 1); } R(g, '#2a2c2a', 0, 0, 32, 2); }, 2],
    // bandes de danger orange et noires (portails, pieds de portiques)
    bandeOrange: () => [32, 8, (g, { R }) => { R(g, '#e8761e', 0, 0, 32, 8); g.fillStyle = '#1e1e1c'; for (let x = -8; x < 32; x += 8) { g.beginPath(); g.moveTo(x, 8); g.lineTo(x + 4, 8); g.lineTo(x + 8, 0); g.lineTo(x + 4, 0); g.fill(); } }],
    // REFS 5 — parapet de la crête : béton clair, chaperon, barbacanes
    parapet: () => [16, 32, (g, o) => { const { R, voile, alea } = o; R(g, '#a8aca4', 0, 0, 16, 32); R(g, '#c8ccc4', 0, 0, 3, 32); R(g, '#7d817a', 3, 0, 1, 32); R(g, '#5a5e5a', 12, 0, 4, 32); R(g, '#3a3c3a', 8, 6, 2, 3); R(g, '#3a3c3a', 8, 22, 2, 3); voile(g, 0.3, () => { for (let i = 0; i < 6; i++) R(g, '#5a5e5a', 4 + (alea() * 6 | 0), alea() * 32 | 0, 1 + (alea() * 3 | 0), 1); R(g, '#000', 0, 31, 16, 1); }); }, 3], // x = la hauteur (0 = chaperon), y = le long de la route : joint tous les 3 m, barbacanes
    // REFS 4 — panneau de danger : triangle jaune à l'éclair noir, « ВЫСОКОЕ НАПРЯЖЕНИЕ » ; borne blanche à bande noire
    danger: () => [64, 32, (g, { R }) => { R(g, '#f0f0e8', 0, 0, 64, 32); g.fillStyle = '#f2c21a'; g.beginPath(); g.moveTo(12, 3); g.lineTo(22, 21); g.lineTo(2, 21); g.fill();
      g.fillStyle = '#111'; g.beginPath(); g.moveTo(13, 7); g.lineTo(9, 14); g.lineTo(12, 14); g.lineTo(10, 19); g.lineTo(16, 11); g.lineTo(13, 11); g.fill();
      g.fillStyle = '#b5483c'; g.font = 'bold 7px sans-serif'; g.textBaseline = 'middle'; g.fillText('ВЫСОКОЕ', 26, 10, 36); g.fillText('НАПРЯЖЕНИЕ', 26, 19, 36); R(g, '#b5483c', 0, 27, 64, 5); }],
    // panneau de limitation de vitesse soviétique : disque blanc cerclé de rouge, « 60 »
    panneauVit: () => [32, 32, (g, { R }) => { R(g, '#4a4e4a', 0, 0, 32, 32); g.fillStyle = '#c8302a'; g.beginPath(); g.arc(16, 16, 15, 0, 7); g.fill(); g.fillStyle = '#f4f4ec'; g.beginPath(); g.arc(16, 16, 11, 0, 7); g.fill(); g.fillStyle = '#111'; g.font = 'bold 12px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('60', 16, 17); }],
    borneGES: () => [8, 16, (g, { R }) => { R(g, '#ecece4', 0, 0, 8, 16); R(g, '#1a1a1a', 0, 3, 8, 3); }],
    // REFS 3 — sol de la halle : dalles de béton poli clair, joints, bandes de marquage jaunes le long des groupes
    solHalle: () => [64, 64, (g, o) => { const { R, voile } = o; R(g, '#a8a69c', 0, 0, 64, 64); for (let k = 0; k < 64; k += 16) { R(g, '#8a887e', k, 0, 1, 64); R(g, '#8a887e', 0, k, 64, 1); } voile(g, 0.2, () => semis(g, o, 200, '#000')); }, 8],
    // béton du barrage : banches de 2 m × 4 m (joints de coffrage #5a5e5a), trous de tiges, reprises plus claires ou plus sombres, coulures sous chaque assise
    betonGES: (fond = '#8d918a') => [64, 64, (g, o) => {
      const { R, alea, voile } = o; R(g, fond, 0, 0, 64, 64);
      voile(g, 0.07, () => { for (let y = 0; y < 64; y += 16) for (let x = 0; x < 64; x += 32) R(g, alea() < 0.5 ? '#fff' : '#000', x, y, 32, 16); });
      voile(g, 0.2, () => { semis(g, o, 300, '#000'); semis(g, o, 120, '#fff'); });
      voile(g, 0.25, () => { for (let y = 0; y < 64; y += 16) R(g, '#5a5e5a', 0, y, 64, 1); for (let y = 0; y < 64; y += 16) for (let x = (y & 16) ? 16 : 0; x < 64; x += 32) R(g, '#5a5e5a', x, y, 1, 16); });
      voile(g, 0.4, () => { for (let y = 4; y < 64; y += 8) for (let x = 4; x < 64; x += 8) R(g, '#3a3c3a', x, y, 1, 1); }); // trous des tiges de coffrage
      voile(g, 0.16, () => { for (let i = 0; i < 14; i++) R(g, '#2a2c2a', alea() * 64 | 0, (alea() * 4 | 0) * 16 + 1, 1 + (alea() * 2 | 0), 4 + alea() * 12 | 0); }); // coulures
    }, 8],
    // façade sud de la salle des turbines : grandes baies vitrées de 6 m sur 12, meneaux de béton, verre gris-bleu où le ciel se reflète, quelques carreaux cassés
    baiesHalle: () => [64, 64, (g, o) => {
      const { R, alea, voile } = o; R(g, '#7d817a', 0, 0, 64, 64);
      for (let x = 0; x < 64; x += 32) { R(g, '#a8b8c0', x + 4, 6, 24, 52); R(g, '#c8d4d8', x + 4, 6, 24, 8);
        for (let y = 6; y < 58; y += 6) R(g, '#5a5e5a', x + 4, y, 24, 1); for (let k = 1; k < 4; k++) R(g, '#5a5e5a', x + 4 + k * 6, 6, 1, 52);
        for (let i = 0; i < 3; i++) R(g, '#4a5a64', x + 4 + (alea() * 4 | 0) * 6, 6 + (alea() * 8 | 0) * 6, 6, 6); }
      voile(g, 0.2, () => semis(g, o, 160, '#000'));
    }, 12],
    // mosaïque murale de la halle (tesselles de 25 cm) : le soleil levant au-dessus du barrage, les vagues, une roue de turbine ; pas de symbole politique
    mosaique: () => [128, 64, (g, o) => {
      const { R, alea } = o, T = ['#e8761e', '#f2b43a', '#5fa89a', '#7fb4d0', '#b5483c', '#e8e4d8', '#3a5a7a'];
      for (let y = 0; y < 64; y += 2) for (let x = 0; x < 128; x += 2) {
        const dx = x - 64, dy = y - 26, r = Math.hypot(dx, dy); let c;
        if (y > 46) c = ((x + (y >> 2) * 6) >> 3) & 1 ? '#7fb4d0' : '#3a5a7a'; // vagues
        else if (r < 12) c = '#f2b43a'; else if (r < 14) c = '#e8761e'; // soleil
        else if (y < 46 && (Math.atan2(dy, dx) * 6 / Math.PI + 12 | 0) % 2 === 0 && r < 40) c = '#e8e4d8'; // rayons
        else c = y < 46 ? '#5fa89a' : '#3a5a7a';
        if (Math.hypot(x - 22, y - 34) < 9 && (Math.atan2(y - 34, x - 22) * 4 / Math.PI + 8 | 0) % 2) c = '#b5483c'; // roue de turbine
        if (Math.hypot(x - 106, y - 34) < 9 && (Math.atan2(y - 34, x - 106) * 4 / Math.PI + 8 | 0) % 2) c = '#b5483c';
        R(g, alea() < 0.06 ? T[alea() * T.length | 0] : c, x, y, 2, 2); R(g, 'rgba(0,0,0,0.25)', x + 1, y + 1, 1, 1); // tesselle et joint
      }
    }],
    // lettres peintes sur le béton, rouge délavé : txt en cyrillique (ГЭС, numéros de groupes)
    lettres: (txt, fond = '#8d918a', encre = '#b5483c') => [256, 64, (g, o) => {
      const { R, alea, voile } = o; R(g, fond, 0, 0, 256, 64);
      voile(g, 0.18, () => { for (let i = 0; i < 500; i++) R(g, alea() < 0.5 ? '#000' : '#fff', alea() * 256 | 0, alea() * 64 | 0, 1, 1); });
      g.fillStyle = encre; g.font = 'bold 54px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 128, 34, 240);
      voile(g, 0.35, () => { for (let i = 0; i < 260; i++) R(g, fond, alea() * 256 | 0, alea() * 64 | 0, 1 + (alea() * 3 | 0), 1); }); // peinture écaillée
    }],
    // eau de la retenue et de la rivière : bleu #7fb4d0, rides, écume claire (#e8f2f4) ; fond = teinte de base
    eauGES: (fond = '#6a9ab4', ecume = 26) => [64, 64, (g, o) => {
      const { R, alea } = o; R(g, fond, 0, 0, 64, 64);
      for (let i = 0; i < 140; i++) R(g, alea() < 0.5 ? '#7fb4d0' : '#5a88a2', alea() * 64 | 0, alea() * 64 | 0, 3 + (alea() * 7 | 0), 1);
      for (let i = 0; i < ecume; i++) R(g, '#e8f2f4', alea() * 64 | 0, alea() * 64 | 0, 2 + (alea() * 5 | 0), 1);
      for (let i = 0; i < 10; i++) { const y = alea() * 64 | 0; R(g, 'rgba(214,228,232,0.5)', 0, y, 64, 1); } // reflets du ciel en longues lignes
    }, 16],
    // gerbe d'une vanne : filets d'eau blanche dans le sens de la chute (v), bords effilochés ; transparente, elle défile (map.offset) dans decors.js
    gerbe: () => [32, 128, (g, o) => {
      const { R, alea } = o; g.clearRect(0, 0, 32, 128);
      for (let x = 0; x < 32; x++) { const bord = Math.min(x, 31 - x) / 6, a = Math.min(1, bord) * 0.95;
        for (let y = 0; y < 128; y += 2 + (alea() * 6 | 0)) { const l = 4 + (alea() * 20 | 0); R(g, `rgba(${alea() < 0.35 ? '150,182,196' : '244,250,252'},${(a * (0.5 + alea() * 0.5)).toFixed(2)})`, x, y, 1, l); } } // filets clairs et filets gris-bleu : on lit l'eau qui file, pas un dôme lisse
    }],
    // brume des embruns au pied des gerbes : nuage rond, opaque au centre, transparent au bord
    brumeGES: () => [64, 64, (g) => {
      const d = g.createRadialGradient(32, 32, 2, 32, 32, 32); d.addColorStop(0, 'rgba(240,246,248,0.7)'); d.addColorStop(0.5, 'rgba(232,242,244,0.35)'); d.addColorStop(1, 'rgba(232,242,244,0)');
      g.fillStyle = d; g.fillRect(0, 0, 64, 64);
    }],
    // tôle peinte orange sécurité (pont roulant, portiques, garde-corps) : coulures de rouille, rivets
    toleOrange: (c = '#e8761e') => [64, 64, (g, o) => {
      const { R, alea, voile } = o; R(g, c, 0, 0, 64, 64);
      voile(g, 0.25, () => { for (let i = 0; i < 18; i++) R(g, '#6a3010', alea() * 64 | 0, alea() * 40 | 0, 1, 4 + alea() * 18 | 0); semis(g, o, 120, '#000'); });
      voile(g, 0.5, () => { for (let x = 4; x < 64; x += 8) { R(g, '#5a2a10', x, 2, 1, 1); R(g, '#5a2a10', x, 61, 1, 1); } });
    }, 4],
    // ---- refonte : conifère de jour (mêmes nappes de rameaux que le cèdre de touge), garde-corps ajouré, fresque, chaussée sans flaques ----
    conifere: (c = '#5e7a44') => [64, 64, (g, o) => {
      const { R, alea, voile } = o; R(g, c, 0, 0, 64, 64);
      voile(g, 0.14, () => { for (let i = 0; i < 150; i++) R(g, alea() < 0.55 ? '#000' : '#fff', alea() * 64 | 0, alea() * 64 | 0, 2 + alea() * 3 | 0, 1 + alea() * 2 | 0); });
      voile(g, 0.2, () => { for (let y = 5; y < 64; y += 8) for (let x = 0; x < 64; x += 2) { const d = alea() * 3 | 0; R(g, '#000', x, y + d, 2, 2); R(g, '#fff', x, y + d - 2, 2, 1); } });
    }],
    // garde-corps d'acier à barreaux (côté vide de la crête) : lisse haute, lisse basse, un barreau tous les 25 cm, un montant tous les 2 m ; le reste est à jour
    gardeCorps: (c = '#e8761e') => [32, 16, (g, o) => { const { R } = o; g.clearRect(0, 0, 32, 16); for (let x = 0; x < 32; x += 4) R(g, c, x, 0, 1, 16); R(g, c, 0, 0, 32, 2); R(g, c, 0, 13, 32, 1); R(g, '#8a4a14', 0, 0, 2, 16); }, 2],
    // la fresque du premier immeuble (mosaïque de pignon, années 70) : soleil et rayons, le mur du barrage, une ligne à haute tension, un ouvrier et une ouvrière de profil, le mot d'ordre du 1er mai
    fresque: () => [96, 120, (g, o) => {
      const { R, alea } = o, poly = (c, ...p) => { g.fillStyle = c; g.beginPath(); g.moveTo(p[0], p[1]); for (let k = 2; k < p.length; k += 2) g.lineTo(p[k], p[k + 1]); g.fill(); };
      R(g, '#d8c9a0', 0, 0, 96, 120);
      for (let k = 0; k < 9; k++) { const a = -0.15 + k * 0.2; poly(k & 1 ? '#e0b060' : '#c9603c', 24, 26, 24 + Math.cos(a) * 130, 26 + Math.sin(a) * 130, 24 + Math.cos(a + 0.2) * 130, 26 + Math.sin(a + 0.2) * 130); } // rayons
      g.fillStyle = '#b5483c'; g.beginPath(); g.arc(24, 26, 15, 0, 7); g.fill(); g.fillStyle = '#e8d8a8'; g.beginPath(); g.arc(24, 26, 9, 0, 7); g.fill(); // soleil
      poly('#7f9aa8', 0, 62, 96, 50, 96, 104, 0, 104); // l'eau de la retenue
      poly('#9aa09a', 30, 104, 44, 44, 96, 40, 96, 104); for (let x = 50; x < 96; x += 9) R(g, '#6d726d', x, 44, 1, 60); // le mur et ses plots
      poly('#3a4a5a', 70, 40, 73, 8, 76, 40); R(g, '#3a4a5a', 64, 14, 18, 2); R(g, '#3a4a5a', 66, 22, 14, 1); for (const x of [65, 73, 81]) R(g, '#3a4a5a', x, 14, 1, 5); // un pylône
      // l'ouvrière (foulard) et l'ouvrier (casque), de profil, tournés vers le soleil
      poly('#8a3428', 18, 104, 20, 74, 26, 66, 34, 66, 38, 76, 38, 104); g.fillStyle = '#e8c8a0'; g.beginPath(); g.arc(29, 59, 6, 0, 7); g.fill(); poly('#c9603c', 23, 56, 29, 51, 36, 57, 34, 61, 24, 61);
      poly('#3a4a5a', 40, 104, 42, 68, 50, 60, 60, 60, 64, 72, 64, 104); g.fillStyle = '#e8c8a0'; g.beginPath(); g.arc(54, 52, 7, 0, 7); g.fill(); poly('#e0b060', 46, 49, 54, 43, 62, 49, 62, 51, 46, 51);
      poly('#3a4a5a', 58, 66, 78, 52, 80, 55, 62, 72); // le bras tendu
      R(g, '#b5483c', 0, 104, 96, 16); g.fillStyle = '#f0e8d0'; g.font = 'bold 11px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('МИР ТРУД МАЙ', 48, 113);
      for (let y = 0; y < 120; y += 2) for (let x = 0; x < 96; x += 2) if (alea() < 0.5) R(g, 'rgba(0,0,0,0.1)', x + 1, y + 1, 1, 1); // joints des tesselles
    }],
    // panneau de direction du virage à la soviétique (GOST 10807 : « направление поворота ») : chevrons rouges sur fond blanc
    chevronGES: flip => [32, 16, (g, { R }) => { if (flip) { g.translate(32, 0); g.scale(-1, 1); } R(g, '#f2f0e8', 0, 0, 32, 16); g.fillStyle = '#c8281e';
      for (const x of [3, 17]) { g.beginPath(); g.moveTo(x, 1); g.lineTo(x + 6, 1); g.lineTo(x + 12, 8); g.lineTo(x + 6, 15); g.lineTo(x, 15); g.lineTo(x + 6, 8); g.fill(); } }],
    // enseigne de rez-de-chaussée : lettres blanches sur bandeau de couleur
    // vantail du portail de la garnison : tôle verte, cadre, une étoile rouge à cinq branches (l'insigne des portails militaires soviétiques)
    porteEtoile: () => [64, 32, (g, o) => { const { R, voile, alea } = o; R(g, '#4a6a4a', 0, 0, 64, 32); R(g, '#3a543a', 0, 0, 64, 2); R(g, '#3a543a', 0, 30, 64, 2); R(g, '#3a543a', 0, 0, 2, 32); R(g, '#3a543a', 62, 0, 2, 32);
      g.fillStyle = '#c8281e'; g.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k & 1 ? 4.2 : 10.5; g.lineTo(32 + Math.cos(a) * r, 16 + Math.sin(a) * r); } g.fill();
      voile(g, 0.25, () => { for (let i = 0; i < 14; i++) R(g, '#2a2a20', alea() * 64 | 0, alea() * 20 | 0, 1, 3 + alea() * 9 | 0); }); }],
    // la chaussée fine sans ses flaques (sous le soleil bas, elles renvoyaient des plaques blanches) : le même dessin, les trous de l'alpha rebouchés à la couleur du bitume
    chausseeGES: (...a) => { const [w, ht, dessin, ...r] = TEXTURES.chausseeFine(...a); return [w, ht, (g, o) => { dessin(g, o); g.globalCompositeOperation = 'destination-over'; g.fillStyle = a[0]; g.fillRect(0, 0, w, ht); g.globalCompositeOperation = 'source-over'; }, ...r]; },
  });
})();
