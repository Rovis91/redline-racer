// Temps passé près du rupteur sur un tour lancé du pilote automatique (sim.js, sans navigateur) : node outils/regime.js chapada touge givre
// Sortie par carte : part du temps à plus de 85 % et 92 % du rupteur, vitesse moyenne et maxi, part du temps par rapport, nombre de freinages.
// CAR='{"ratios":[…],"final":3.9}' fusionne des réglages dans la voiture de la première carte nommée, PTS='[[x,z,y],…]' remplace son tracé (essais de proposition).
const THREE = require('../three/three.module.js'); globalThis.window = globalThis;
require('../cartes.js'); require('../traces-or.js'); require('../sim.js');
const H = 1 / 120, ids = process.argv.slice(2);
ids.forEach((id, k) => {
  const M = CARTES.find(m => m.id === id); if (!M) return console.log('carte inconnue : ' + id);
  if (!k && process.env.CAR) Object.assign(M.car, JSON.parse(process.env.CAR), JSON.parse(process.env.CAR).red ? { up: JSON.parse(process.env.CAR).red * 0.94, down: JSON.parse(process.env.CAR).red * 0.775 } : {});
  if (!k && process.env.PTS) M.pts = JSON.parse(process.env.PTS);
  if (!k && process.env.MAP) Object.assign(M, JSON.parse(process.env.MAP));
  const T = buildTrack(THREE, M), n = T.n, c = newCar(T), red = M.car.red, g = new Array(M.car.ratios.length).fill(0);
  let t = 0, t1 = 0, a85 = 0, a92 = 0, N = 0, vs = 0, vmax = 0, vmin = 1e9, fr = 0, frein = false, hit = 0;
  while (c.dist < 2 * n && t < 900) {
    const inp = autopilot(c, T); step(c, inp, T, H); t += H;
    if (c.dist < n) continue; if (!t1) t1 = t;
    const v = Math.hypot(c.vx, c.vz) * 3.6; N++; vs += v; vmax = Math.max(vmax, v); vmin = Math.min(vmin, v); g[c.gear]++;
    if (c.rpm > 0.85 * red) a85++; if (c.rpm > 0.92 * red) a92++; if (c.hit > 0) hit++;
    if (inp.brake > 0.1 && !frein) fr++; frein = inp.brake > 0.1;
  }
  const L = T.S.reduce((a, s, i) => a + Math.hypot(T.S[(i + 1) % n].x - s.x, T.S[(i + 1) % n].z - s.z), 0), p = x => (100 * x / N).toFixed(0) + ' %';
  console.log(`${id} : ${Math.round(L)} m, tour ${(t - t1).toFixed(1)} s, rupteur ${red} tr/min — plus de 85 % : ${p(a85)}, plus de 92 % : ${p(a92)} ; ${Math.round(vs / N)} km/h de moyenne (${Math.round(vmin)} à ${Math.round(vmax)}) ; rapports ${g.map(p).join(' / ')} ; ${fr} freinages ; ${hit} pas au contact`);
});
