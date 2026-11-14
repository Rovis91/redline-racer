// Mesure des chocs en vraie course, sans écran : node outils/chocs.js [carte]
// Chaque carte : une course de 3 tours (3 IA) par profil du joueur, et le contre-la-montre de wangan avec ses camions (trafic).
// On note chaque choc comme le jeu le voit (c.hit : mur ou camion, c.bump : voiture ; même lecture que dgPas dans game.js) et on rejoue dessus le modèle de dégâts
// de docs/SPEC-CASSE.md (« Mécanique des chocs ») : usure par zone [avant, arrière, gauche, droite], plafonnée à CAP hors du mode CASSE.
const THREE = require('../three/three.module.js'); require('../cartes.js'); require('../sim.js');
const H = 1 / 120, CAP = 0.7, TOUR = 0.4, SEUIL = { mur: 6, voiture: 4 }, MULT = { mur: 1, voiture: 0.6, camion: 1.5 };
const BACS = [4, 6, 10, 15, 20, 30, 1e9], bac = v => BACS.findIndex(b => v < b);
function choc(Z, lx, lz, vn, type, Z0) { // Z0 : les zones au début du tour (chacune prend au plus TOUR par tour) // le modèle du bac à sable (propositions/casse.html, choc), sans la géométrie
  const s = SEUIL[type === 'voiture' ? 'voiture' : 'mur']; if (vn <= s) return;
  const wx = lx * lx, wz = lz * lz, u = Math.min(1, ((vn - s) / 24) ** 2) * MULT[type] * (wx > 0.2 && wz > 0.2 ? 1.3 : 1);
  for (const [zi, w] of [[lx > 0 ? 0 : 1, wx], [lz < 0 ? 2 : 3, wz]]) Z[zi] = Math.min(CAP, Z0[zi] + TOUR, Z[zi] + Math.min(0.45, 0.6 * u * w) * (1 - Z[zi]));
}
const etape = z => z < 0.1 ? 'nickel' : z < 0.25 ? 'creux' : z < 0.45 ? 'rétro/optique' : z < 0.6 ? 'pare-chocs parti' : 'capot/portière qui bat';
function suivi(c) { return { c, Z: [0, 0, 0, 0], Z0: [0, 0, 0, 0], lap: 1, n: Array(BACS.length).fill(0), nb: Array(BACS.length).fill(0), t: -1, tour: [], vx: 0, vz: 0, frot: 0 }; }
function note(o, t, truck) { // après un pas : un choc franc (même lecture que dgPas : direction = changement de vitesse, dans le repère de la voiture)
  const c = o.c; if ((c.lap || 1) !== o.lap) { o.lap = c.lap || 1; o.Z0 = o.Z.slice(); } const mur = c.hit || 0, vo = c.bump || 0; if (c.rub) o.frot += H;
  if (mur > 0) o.n[bac(mur)]++; if (vo > 0) o.nb[bac(vo)]++;
  const f = Math.max(mur, vo); if (f > 3 && t - o.t >= 0.15) { o.t = t;
    let dx = o.vx - c.vx, dz = o.vz - c.vz, l = Math.hypot(dx, dz); if (l < 0.5) { dx = c.vx; dz = c.vz; l = Math.hypot(dx, dz) || 1; }
    const fx = Math.cos(c.th), fz = Math.sin(c.th); choc(o.Z, (dx * fx + dz * fz) / l, (dz * fx - dx * fz) / l, f, vo > mur ? 'voiture' : truck ? 'camion' : 'mur', o.Z0); }
  o.vx = c.vx; o.vz = c.vz;
}
// profils du joueur : propre = pilote automatique ; moyen = un peu trop vite, volant un peu imprécis ; bourrin = toujours à fond, jamais de frein (il tape)
let bruit = 0;
const PROFILS = {
  propre: (c, T, o) => autopilot(c, T, 1, o),
  moyen: (c, T, o) => { const a = autopilot(c, T, 1.06, o); bruit += (Math.random() - 0.5) * 0.12 - bruit * 0.01; return { ...a, steer: Math.max(-1, Math.min(1, a.steer + bruit)) }; },
  bourrin: (c, T, o) => ({ ...autopilot(c, T, 1.05, o), gas: 1, brake: 0 })
};
const fmt = o => `${o.n.slice(1).join(' ').padEnd(16)} | ${o.nb.slice(1).join(' ').padEnd(14)} | ${[...o.tour, o.Z].map(z => Math.round(Math.max(...z) * 100)).join(' → ').padEnd(12)} | ${o.Z.map(z => Math.round(z * 100)).join('/').padEnd(12)} ${etape(Math.max(...o.Z))}`;
console.log('chocs mur (vn 4-6, 6-10, 10-15, 15-20, 20-30, >30) | voiture (idem) | usure max fin de chaque tour | zones fin de course\n');
const seule = process.argv[2], tous = {};
for (const M of CARTES) { if (seule && M.id !== seule) continue;
  const T = buildTrack(THREE, M); console.log('== ' + M.id);
  for (const p in PROFILS) {
    const R = newRace(T, 3), S = R.cars.map(suivi), piste = R.cars; let t = 0;
    while (!R.cars[0].fin && t < 600) { const inp = PROFILS[p](R.cars[0], T, piste); stepRace(R, inp, H); t += H; S.forEach(o => note(o, t)); S.forEach(o => { while (o.tour.length < Math.min(2, (o.c.lap || 1) - 1)) o.tour.push(o.Z.slice()); }); }
    console.log(`  ${p.padEnd(8)} ${fmt(S[0])}  (${Math.round(t)} s, frotte ${S[0].frot.toFixed(1)} s)`);
    (tous[p] = tous[p] || []).push(Math.max(...S[0].Z));
    if (p === 'propre') S.slice(1).forEach((o, i) => { console.log(`  IA ${i + 1}     ${fmt(o)}`); (tous.IA = tous.IA || []).push(Math.max(...o.Z)); });
  }
  if (M.trafic) for (const p of ['propre', 'bourrin']) { // contre-la-montre avec les camions
    const c = newCar(T), o = suivi(c); let t = 0;
    while ((c.lap || 0) < 3 && t < 600) { step(c, PROFILS[p](c, T, trafic(T, t)), T, H); hitTrafic(c, T, t, H); t += H; note(o, t, 1); while (o.tour.length < Math.min(2, (c.lap || 1) - 1)) o.tour.push(o.Z.slice()); }
    console.log(`  CLM ${p.padEnd(7)}${fmt(o)}  (camions)`);
  }
}
console.log('\nusure de la zone la plus abîmée en fin de course, par profil (toutes cartes) :');
for (const p in tous) { const v = tous[p].sort((a, b) => a - b); console.log(`  ${p.padEnd(8)} min ${Math.round(v[0] * 100)}  médiane ${Math.round(v[v.length >> 1] * 100)}  max ${Math.round(v[v.length - 1] * 100)}`); }
