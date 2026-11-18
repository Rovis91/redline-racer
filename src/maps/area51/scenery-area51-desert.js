// "area51", the high desert between the installations, and the visitors hidden in it. Runs last: it plants only where nothing else stands.
// The placers are described in scenery-area51.js; the shapes are in shapes-area51-desert.js.
// A Nevada basin, not a sand sea: sagebrush everywhere on the fan in loose patches, creosote on the lower ground and along the washes, Joshua trees in groves on the middle slopes, broken rock where it is steep,
// washed pebbles in the wash beds. Nothing on the graded airfield (strips are kept clear), on the dry lake (bare clay), inside the built-up row or where the underground rooms cut the mesa.
// Density follows the race camera: small and dense within 45 m of the road, larger and sparser to 160 m, only big rocks and trees beyond (a 1 m bush 200 m away is less than a pixel).
(window.AREA51 = window.AREA51 || {}).desert = ({ h, g, S, MAT, kit, set, side, seg, near, wash, FLATS, pk, idx, t0, t1, THREE, k }) => {
  const hash = (a, b, c = 0) => { const v = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453; return v - Math.floor(v); }; // fixed per position: no call to the shared rnd
  const fade = t => t * t * (3 - 2 * t), patch = (x, z, L, c) => { const fx = x / L, fz = z / L, ix = Math.floor(fx), iz = Math.floor(fz), a = fade(fx - ix), b = fade(fz - iz); // smooth noise of wavelength L: where plants gather
    return (hash(ix, iz, c) * (1 - a) + hash(ix + 1, iz, c) * a) * (1 - b) + (hash(ix, iz + 1, c) * (1 - a) + hash(ix + 1, iz + 1, c) * a) * b; };
  // what already stands: the footprint of every piece placed by the other zones, 3 m wider (the huge slabs and the far ranges are not obstacles)
  const taken = [], bx = new THREE.Box3(); kit.updateMatrixWorld(true);
  for (const o of kit.children) { bx.setFromObject(o); if (bx.max.x - bx.min.x < 500 && bx.max.z - bx.min.z < 500) taken.push([bx.min.x - 3, bx.max.x + 3, bx.min.z - 3, bx.max.z + 3]); }
  const BUILT = [[1380, 2620, 690, 1050]], inBox = (x, z, L) => L.some(([x0, x1, z0, z1]) => x > x0 && x < x1 && z > z0 && z < z1); // the hangar row and its yards
  const plant = (shape, x, z, r, skin, sink = 0) => set(shape, x, z, { a: [Math.round(r * 4) / 4, hash(x, z, 5) * 8 | 0], skin, ry: hash(x, z, 6) * 6.28, dy: -sink });
  const [X0, Z0, X1, Z1] = g.box, C = 8;
  for (let cz = Z0; cz < Z1; cz += C) for (let cx = X0; cx < X1; cx += C) { const x = (cx + hash(cx, cz, 1) * C) / k, z = (cz + hash(cx, cz, 2) * C) / k, i = near(h, x * k, z * k), s = S[i], d = Math.hypot(s.x - x * k, s.z - z * k) - s.w, u = hash(cx, cz, 3), v = hash(cx, cz, 4);
    if (d < 3.5 || d > 330 || (i > t0 - 25 && i < t1 + 25 && d < 150) || inBox(x, z, FLATS) || inBox(x, z, BUILT) || inBox(x * k, z * k, taken)) continue;
    const y = g.hAt(x * k, z * k), slope = (Math.abs(g.hAt(x * k + 3, z * k) - g.hAt(x * k - 3, z * k)) + Math.abs(g.hAt(x * k, z * k + 3) - g.hAt(x * k, z * k - 3))) / 6, w = wash(x, z), grove = patch(x, z, 140, 1), tuft = 0.3 + patch(x, z, 45, 2);
    if (slope > 1.1) continue;
    if (w > 0.7) { if (u < 0.3) plant('caillouArea51', x, z, 0.4 + v * 0.7, MAT.rock, 0.1); continue; }                                  // the bed: washed stones only
    const bank = w > 0.03 ? 2.4 : 1, low = y < 9 || w > 0.03;                                                                             // the banks of a wash hold the water longest: twice the brush, and creosote
    if (d < 45) { if (u > 0.4 * tuft * bank) continue;
      if (slope > 0.4 || v < 0.16) plant('caillouArea51', x, z, 0.5 + hash(cx, cz, 7) * 1.1, MAT.rock);
      else if (v < (low ? 0.6 : 0.3)) plant('creosoteArea51', x, z, 0.8 + hash(cx, cz, 7) * 0.7, MAT.creo);
      else plant('armoiseArea51', x, z, 0.8 + hash(cx, cz, 7) * 0.9, MAT.sage); }
    else if (d < 160) { if (u > 0.085 * tuft * bank) continue;
      if (slope > 0.3 || v < 0.3) plant('caillouArea51', x, z, 1.5 + hash(cx, cz, 7) * 2.5, MAT.rock);
      else if (grove > 0.56 && v < 0.75) set('joshuaArea51', x, z, { a: [hash(cx, cz, 7) * 3 | 0], s: 1.1 + hash(cx, cz, 8) * 0.6, ry: u * 60 });
      else plant(low ? 'creosoteArea51' : 'armoiseArea51', x, z, 1.6 + hash(cx, cz, 7) * 1.2, low ? MAT.creo : MAT.sage); }
    else { if (u > 0.014) continue;
      if (grove > 0.56 && slope < 0.3) set('joshuaArea51', x, z, { a: [v * 3 | 0], s: 1.6, ry: u * 400 }); else plant('caillouArea51', x, z, 3 + v * 3.5, MAT.rock); } }
  // an old gunnery hulk and its plywood targets outside the perimeter fence below the depot, left where the range was before the runways were built
  set('epaveArea51', 850, 292, { ry: 0.9, dy: -0.3 }); for (const [x, z] of [[892, 300], [912, 286], [902, 268]]) set('cibleArea51', x, z, { ry: Math.PI });
  // The visitors. Each stands in the open, in the field of the race camera, never behind anything opaque; it is small, so it is only recognised for the second before the car passes it.
  // [chainage, side, distance from the wall, raised by, scale, turned by, raised arm, dark (a silhouette against light)]
  const P = { door: pk(1856, 881) + 8, radome: pk(700, 1185) + 9, rock: pk(295, 425), depot: pk(440, 380) + 20 + 42 * 3.5, board: pk(2250, 660) - 199 };
  const visitor = (p, sd, off, o = {}) => { const a = side('alienArea51', p, sd, off, 0.3, { a: [o.s || 1.4, o.wave || 0], dy: o.dy || 0, skin: o.dark ? { alien: MAT.dark, oeil: MAT.dark } : MAT }); a.rotation.y += o.ry || 0; return a; };
  visitor(P.door, 1, 2.5, { ry: -1.2 });                                    // 1. in the east doorway of hall H1, against the jamb, grey in the shadow of the hall
  visitor(P.radome, Math.sign(S[idx(700, 1185)].k) || 1, 3.5, { ry: -0.8, wave: 1 }); // 4. beside the fenced radome in the S down to the dish: in front of it, one arm raised
  visitor(P.rock, Math.sign(S[idx(295, 425)].k) || 1, 14.7, { dy: 10, s: 1.8, dark: 1 }); // 5. on top of the outcrop the descent bends round, against the sky
  visitor(P.depot, -1, 7, { ry: 0.6, wave: 1 });                                   // 6. between two magazines of the depot, on the service lane
  visitor(pk(870, 380), -1, 4.9, { dy: 3.4, dark: 1 });                     // 7. on the roof of the left booth of the main gate, against the sky
  visitor(P.board, 1, 4.7, { ry: -1.57 });                                  // 8. on runway A's exit, standing between the posts of the "200" board
  // 2. at the control-room window above the reactor gallery, a dark shape against the lit glass; 3. on the roof of the east portal of B1, seen as the road dives to it
  seg('alienArea51', S[idx(1210, 1324) + 3], -19.7, 9.85, { a: [1.5], skin: { alien: MAT.dark, oeil: MAT.dark } }).rotation.y += Math.PI;
  seg('alienArea51', S[t0 - 6], 9, 19.8, { a: [3, 1] }).rotation.y += Math.PI / 2;
};
