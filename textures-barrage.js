// Textures propres à « barrage » : complète le catalogue de textures.js (mêmes conventions : aplat pour ce qui émet de la lumière, dessin sinon, hasard par o.alea). Voir METHODE-DECOR.md.
// Centrale hydroélectrique soviétique des années 70 : béton coffré, grandes baies, mosaïque murale, lettres peintes en cyrillique, eau et gerbes des vannes ouvertes.
(() => {
  const semis = (g, { R, alea }, n, c, w = 64, h = 64) => { for (let i = 0; i < n; i++) R(g, c, alea() * w | 0, alea() * h | 0, 1 + (alea() * 2 | 0), 1); };
  Object.assign(TEXTURES, {
    // béton du barrage : banches de 2 m × 4 m (joints de coffrage #5a5e5a), trous de tiges, reprises plus claires ou plus sombres, coulures sous chaque assise
    betonGES: (fond = '#8d918a') => [64, 64, (g, o) => {
      const { R, alea, voile } = o; R(g, fond, 0, 0, 64, 64);
      voile(g, 0.14, () => { for (let y = 0; y < 64; y += 16) for (let x = 0; x < 64; x += 32) R(g, alea() < 0.5 ? '#fff' : '#000', x, y, 32, 16); });
      voile(g, 0.2, () => { semis(g, o, 300, '#000'); semis(g, o, 120, '#fff'); });
      voile(g, 0.55, () => { for (let y = 0; y < 64; y += 16) R(g, '#5a5e5a', 0, y, 64, 1); for (let y = 0; y < 64; y += 16) for (let x = (y & 16) ? 16 : 0; x < 64; x += 32) R(g, '#5a5e5a', x, y, 1, 16); });
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
    }, 16],
    // gerbe d'une vanne : filets d'eau blanche dans le sens de la chute (v), bords effilochés ; transparente, elle défile (map.offset) dans decors.js
    gerbe: () => [32, 128, (g, o) => {
      const { R, alea } = o; g.clearRect(0, 0, 32, 128);
      for (let x = 0; x < 32; x++) { const bord = Math.min(x, 31 - x) / 8, a = Math.min(1, bord) * 0.75;
        for (let y = 0; y < 128; y += 2 + (alea() * 6 | 0)) { const l = 4 + (alea() * 20 | 0); R(g, `rgba(${alea() < 0.3 ? '200,224,232' : '240,248,250'},${(a * (0.4 + alea() * 0.6)).toFixed(2)})`, x, y, 1, l); } }
    }],
    // brume des embruns au pied des gerbes : nuage rond, opaque au centre, transparent au bord
    brume: () => [64, 64, (g) => {
      const d = g.createRadialGradient(32, 32, 2, 32, 32, 32); d.addColorStop(0, 'rgba(240,246,248,0.7)'); d.addColorStop(0.5, 'rgba(232,242,244,0.35)'); d.addColorStop(1, 'rgba(232,242,244,0)');
      g.fillStyle = d; g.fillRect(0, 0, 64, 64);
    }],
    // tôle peinte orange sécurité (pont roulant, portiques, garde-corps) : coulures de rouille, rivets
    toleOrange: (c = '#e8761e') => [64, 64, (g, o) => {
      const { R, alea, voile } = o; R(g, c, 0, 0, 64, 64);
      voile(g, 0.25, () => { for (let i = 0; i < 18; i++) R(g, '#6a3010', alea() * 64 | 0, alea() * 40 | 0, 1, 4 + alea() * 18 | 0); semis(g, o, 120, '#000'); });
      voile(g, 0.5, () => { for (let x = 4; x < 64; x += 8) { R(g, '#5a2a10', x, 2, 1, 1); R(g, '#5a2a10', x, 61, 1, 1); } });
    }, 4],
  });
})();
