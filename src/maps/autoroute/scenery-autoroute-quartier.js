// "autoroute", zone 2: Le quartier inonde (columns 3 and 4, rows -1 to -3): the low district by the river. The lane takes six street corners through 30 cm of standing water (the map's water plane at 0, the streets at -0.32):
// facade to facade, the pavements under it too. What stands in the water (wrecks, a bus, a lorry, reeds) and what closes the other streets are solid boxes of the map (M.obst), built by real() in scenery-autoroute.js.
// Here what the water did: rafts of dead leaves and scum lying still on it, and a dark band of slime round the foot of every block it stands against, up to where it once stood.
(window.AUTOROUTE = window.AUTOROUTE || {}).quartier = ({ h, O, zone, decal, slab, groundY, HH }) => {
  for (const o of O) if (o.label === 'ILOT' && groundY(o.x) < 0) for (const [x, z, wx, dz] of [[o.x, o.z - o.hz - 0.2, 2 * o.hx + 0.8, 0.12], [o.x, o.z + o.hz + 0.2, 2 * o.hx + 0.8, 0.12], [o.x - o.hx - 0.2, o.z, 0.12, 2 * o.hz + 0.8], [o.x + o.hx + 0.2, o.z, 0.12, 2 * o.hz + 0.8]]) slab('ivy2', x, -0.2, z, wx, 0.75, dz);
  h.S.forEach((s, i) => { if (i % 9 || zone(i) !== 'rue' || s.y > -0.1) return; const d = (HH(i, 1) - 0.5) * 16; decal('leaves', s.x - s.tz * d, 0.02, s.z + s.tx * d, 4 + 4 * HH(i, 2), 3 + 3 * HH(i, 3), HH(i, 4) * 6); });
};
