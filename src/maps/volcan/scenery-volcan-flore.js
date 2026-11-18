// "volcan", zone 8b: La Flore (the low ground: farmland PK 420 to 1500, the slopes of the approach 1500 to 3740, the descent 4670 to 5900): the ground texture gets relief from tufts.
// Subarctic island: nothing taller than a person: tussock grass (straw and green), dwarf birch and willow scrub in low mounds, pale lichen boulders; fewer and fewer with altitude, none on the bare lava of the pass and the caldera.
// Placed along the road, 1 to 45 m off it (the sea side only a few metres, up to the cliff edge), by fixed hashes (frac), on ground that is not steep and not far below the road. set() and frac() are described in scenery-volcan.js.
(window.VOLCAN = window.VOLCAN || {}).flore = ({ g, at, set, frac, beside }) => {
  const ss = (a, b, v) => Math.min(1, Math.max(0, (v - a) / (b - a))), STEP = 6;
  const slope = (x, z) => (Math.abs(g.hAt(x + 2, z) - g.hAt(x - 2, z)) + Math.abs(g.hAt(x, z + 2) - g.hAt(x, z - 2))) / 4;
  let n = 0;
  for (const [a, b, farm] of [[420, 1500, 1], [1500, 3740, 0], [4690, 5900, 0]]) for (let pk = a, i = 0; pk < b; pk += STEP, i++) for (const sd of [-1, 1]) {
    const s = at(pk), alt = 1 - ss(185, 225, s.y), cnt = (sd < 0 ? 3 : 1.8) * alt + (alt < 1 ? 0.6 : 0); // tufts per slot; the pass keeps only its lichen boulders
    for (let k = 0, m = Math.floor(cnt) + (frac(i, 9 + k + sd) < cnt % 1 ? 1 : 0); k < m; k++) {
      const u = frac(i * 7 + k, sd + 3), v = frac(i * 7 + k, sd + 11), off = sd < 0 ? (farm ? 0.7 + u * 3.6 : 0.8 + u * u * 44) : 0.8 + u * 9, [x, z] = beside(pk + (v - 0.5) * STEP, sd, off), y = g.hAt(x, z);
      if (y < s.y - 2.5 || y > s.y + 30 || slope(x, z) > 0.75) continue;
      const t = frac(i * 7 + k, sd + 17), r = 0.5 + frac(i * 7 + k, sd + 23) * 0.6, ry = v * 6.28, c = t < 0.4 ? 'tussock' : t < 0.7 ? 'tuft' : 'scrub';
      if (alt < 0.5) set('rocherVolcan', x, z, { m: 'lichenRock', a: [r * 2, r * 1.3, r * 2, i + k] });
      else if (c === 'scrub') set('buissonVolcan', x, z, { ry, a: [r * 1.3, i + k, c] });
      else set('touffeVolcan', x, z, { ry, a: [r, i + k, c] });
      if (!(n++ % 9)) set('rocherVolcan', x + 1.5, z + 1, { m: 'lichenRock', a: [r * 1.8, r, r * 1.6, i] }); } }
};
