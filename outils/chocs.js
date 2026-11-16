// Mesure des chocs en vraie course, sans écran : node outils/chocs.js [carte]
// Chaque carte : une course de 3 tours (3 IA) par profil du joueur, et le contre-la-montre de wangan avec ses camions (trafic).
// On note chaque choc comme le jeu le voit (c.hit : mur ou camion, c.bump : voiture ; même lecture que dgPas dans game.js) et on rejoue dessus le modèle de dégâts
// de docs/specs/SPEC-CASSE.md (« Mécanique des chocs ») : usure par zone [avant, arrière, gauche, droite], plafonnée hors du mode CASSE (usure et USURE de sim.js).
const THREE = require('../vendor/three/three.module.js'); require('../src/donnees/cartes.js'); require('../src/moteur/sim.js');
const H = 1 / 120;
const BACS = [4, 6, 10, 15, 20, 30, 1e9], bac = v => BACS.findIndex(b => v < b);
const choc = (Z, lx, lz, vn, type, Z0) => usure(Z, Z0, lx, lz, vn, type); // le modèle du jeu (sim.js), hors mode CASSE
const etape = z => z < 0.1 ? 'nickel' : z < 0.25 ? 'creux' : z < 0.45 ? 'rétro/optique' : z < 0.6 ? 'pare-chocs parti' : 'capot/portière qui bat';
function suivi(c) { return { c, Z: [0, 0, 0, 0], Z0: [0, 0, 0, 0], lap: 1, n: Array(BACS.length).fill(0), nb: Array(BACS.length).fill(0), t: -1, tour: [], vx: 0, vz: 0, frot: 0 }; }
function note(o, t, truck) { // après un pas : un choc franc (même lecture que dgPas : direction = changement de vitesse, dans le repère de la voiture)
  const c = o.c; if ((c.lap || 1) !== o.lap) { o.lap = c.lap || 1; o.Z0 = o.Z.slice(); } const mur = c.hit || 0, vo = c.bump || 0; if (c.rub) o.frot += H;
  if (mur > 0) o.n[bac(mur)]++; if (vo > 0) o.nb[bac(vo)]++;
  const f = Math.max(mur, vo); if (f > 3 && t - o.t >= 0.15) { o.t = t; // (comme dgPas ; contre un mur, sim.js ne signale déjà un choc frais que toutes les 0,4 s : wallT)
    let dx = o.vx - c.vx, dz = o.vz - c.vz, l = Math.hypot(dx, dz); if (l < 0.5) { dx = c.vx; dz = c.vz; l = Math.hypot(dx, dz) || 1; }
    const fx = Math.cos(c.th), fz = Math.sin(c.th); choc(o.Z, (dx * fx + dz * fz) / l, (dz * fx - dx * fz) / l, f, vo > mur ? 'voiture' : truck ? 'camion' : 'mur', o.Z0); }
  o.vx = c.vx; o.vz = c.vz;
}
// profils du joueur : propre = pilote automatique ; moyen = un peu trop vite, volant un peu imprécis ; bourrin = toujours à fond, jamais de frein (il tape)
// le volant du « moyen » dévie au hasard, mais d'un tirage fixe remis à zéro à chaque course : deux passages donnent les mêmes chiffres
let bruit = 0, graine = 1; const alea = () => (graine = (graine * 16807) % 2147483647) / 2147483647, raz = () => { bruit = 0; graine = 1; };
const PROFILS = {
  propre: (c, T, o) => autopilot(c, T, 1, o),
  moyen: (c, T, o) => { const a = autopilot(c, T, 1.06, o); bruit += (alea() - 0.5) * 0.12 - bruit * 0.01; return { ...a, steer: Math.max(-1, Math.min(1, a.steer + bruit)) }; },
  bourrin: (c, T, o) => ({ ...autopilot(c, T, 1.05, o), gas: 1, brake: 0 })
};
const fmt = o => `${o.n.slice(1).join(' ').padEnd(16)} | ${o.nb.slice(1).join(' ').padEnd(14)} | ${[...o.tour, o.Z].map(z => Math.round(Math.max(...z) * 100)).join(' → ').padEnd(12)} | ${o.Z.map(z => Math.round(z * 100)).join('/').padEnd(12)} ${etape(Math.max(...o.Z))}`;
console.log('chocs mur (vn 4-6, 6-10, 10-15, 15-20, 20-30, >30) | voiture (idem) | usure max fin de chaque tour | zones fin de course\n');
const seule = process.argv[2], tous = {};
for (const M of CARTES) { if (seule && M.id !== seule) continue;
  const T = buildTrack(THREE, M); console.log('== ' + M.id);
  for (const p in PROFILS) {
    raz(); const R = newRace(T, 3), S = R.cars.map(suivi), piste = R.cars; let t = 0;
    while (!R.cars[0].fin && t < 600) { const inp = PROFILS[p](R.cars[0], T, piste); stepRace(R, inp, H); t += H; S.forEach(o => note(o, t)); S.forEach(o => { while (o.tour.length < Math.min(2, (o.c.lap || 1) - 1)) o.tour.push(o.Z.slice()); }); }
    console.log(`  ${p.padEnd(8)} ${fmt(S[0])}  (${Math.round(t)} s, frotte ${S[0].frot.toFixed(1)} s)`);
    (tous[p] = tous[p] || []).push(Math.max(...S[0].Z));
    if (p === 'propre') S.slice(1).forEach((o, i) => { console.log(`  IA ${i + 1}     ${fmt(o)}`); (tous.IA = tous.IA || []).push(Math.max(...o.Z)); });
  }
  if (M.trafic) for (const p of ['propre', 'bourrin']) { // contre-la-montre avec les camions
    raz(); const c = newCar(T), o = suivi(c); let t = 0;
    while ((c.lap || 0) < 3 && t < 600) { step(c, PROFILS[p](c, T, trafic(T, t)), T, H); hitTrafic(c, T, t, H); t += H; note(o, t, 1); while (o.tour.length < Math.min(2, (c.lap || 1) - 1)) o.tour.push(o.Z.slice()); }
    console.log(`  CLM ${p.padEnd(7)}${fmt(o)}  (camions)`);
  }
}
console.log('\nusure de la zone la plus abîmée en fin de course, par profil (toutes cartes) :');
for (const p in tous) { const v = tous[p].sort((a, b) => a - b); console.log(`  ${p.padEnd(8)} min ${Math.round(v[0] * 100)}  médiane ${Math.round(v[v.length >> 1] * 100)}  max ${Math.round(v[v.length - 1] * 100)}`); }
