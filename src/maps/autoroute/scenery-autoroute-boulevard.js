// "autoroute", zone 1: Le boulevard (row 0, heading east, 34 m between its facades): the start, the army checkpoint (two staggered lines of concrete barriers), the facade fallen from the north side,
// the pile-up in the south lanes before the motorway bridge, and the dip to the water. Everything that stands in it is a solid box of the map (M.obst in src/data/maps.js), built by real() in scenery-autoroute.js.
// Here only what hangs over it out of reach: creeper falling from the motorway deck where it crosses the boulevard.
(window.AUTOROUTE = window.AUTOROUTE || {}).boulevard = ({ quad, HH }) => {
  for (let k = 0; k < 9; k++) { const x = 207 + k * 3.4 + HH(k, 1), z = (HH(k, 2) < 0.5 ? -1 : 1) * (17.5 + HH(k, 3) * 3), l = 3 + 6 * HH(k, 4), w = 0.8 + HH(k, 5) * 1.6; quad(k & 1 ? 'vine' : 'vine2', [x, 18.2 - l, z], [x + w, 18.2 - l, z], [x + w, 18.2, z], [x, 18.2, z], 4); }
};
