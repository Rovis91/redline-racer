// The crowd of the stands, shared by the maps with tiered seating (stade, canal): PLACERS.crowd(h, opts) → tick (dt, now, car), to call in the tick of the scenery.
// Three things: (1) the arms that rise from time to time (offset by half the height of the `crowd` texture, nothing is redrawn); (2) the wave, a copy with arms raised
// of the lower crowd, raised on the modules near the followed car and hidden under the floor elsewhere; (3) reactions to the race: when the followed car overtakes,
// takes the lead or hits a wall, a giant banner (a tifo, four modules wide) unrolls over the lower tier in front of it, placards rise around it,
// the whole hall stands up (arms raised) and the roar kicks in (SOUND.roar).
// The maps keep only their data (tiers, settings, texts).
//   tiers : [{ mat, f1, f2, ph, cutoff }]   mat = `crowd` material of a tier; arms raised when sin(now·f1 + ph) + sin(now·f2) > cutoff
//   ola    : { mods, larg, prof, pente, y, z, ecart }
//     mods   : stand modules placed [x, y, z, rotY, scale x, scale y, scale z] (same lists that the scenery passes to insts)
//     wd, profData, slope (rad), y, z: the lower tier in the module's frame (shapes-<map>.js: ['crowd', wd, 0.6, profData, 0, y, z, [-slope, 0, 0]])
//     gap(k, car) → 0..1: how far module k is "in the wave" (0 = on the floor, hidden)
//   placards: { kind: [[plainText, backdrop, ink], …] } (same texts for the placards and the banner); kinds followed automatically: double, headEl, impact. The others (jump, fire…), the map lifts them per tick with tick.lifts(car, kind)
// The tick returns the kind lifted on this frame (or null); tick.lifts(car, kind, n) lifts n placards in front of the car; tick.upright(): the hall is standing (2.5 s after a reaction)
(function () {
  PLACERS.crowd = (h, { tiers, ola: o, placards: texts = {} }) => {
    const { THREE } = h, { inst } = PLACERS, o4 = new THREE.Object3D();
    const go = h.geo('boxMesh', o.wd, 0.6, o.profData); go.rotateX(-o.slope); go.translate(0, o.y + 1.2, o.z);
    const fo = h.mat('crowd', {}, '#4a4458', '#f4f0e0'); fo.map.anisotropy = 8; fo.map.offset.y = 0.5;
    const ola = inst(h, go, fo, o.mods); ola.userData.dyn = 1; ola.frustumCulled = false; // dyn: it moves, outside the merge of the fixed scenery (game.js)

    // the placards: 6 spots per module on the first quarter of the lower tier (from bottom to top of the tier: [z, y] front and rear in the module's frame), facing the track
    const av = [o.z - o.profData / 2 * Math.cos(o.slope), o.y - o.profData / 2 * Math.sin(o.slope)], ar = [o.z + o.profData / 2 * Math.cos(o.slope), o.y + o.profData / 2 * Math.sin(o.slope)];
    const P = [], ob = new THREE.Object3D(), Z = new THREE.Matrix4().makeScale(0, 0, 0), gp = new THREE.PlaneGeometry(4.6, 2.6); gp.translate(0, 0.5, 0);
    let a = 4242; const rn = () => (a = (a * 16807) % 2147483647) / 2147483647; // own randomness: does not shift h.rnd, so not the rest of the scenery
    for (const [x, y, z, r, sx = 1, sy = 1, sz = 1] of o.mods) for (let k = 0; k < 6; k++) { const t = rn() * 0.25, lx = (rn() - 0.5) * 12 * sx, lz = (av[0] + (ar[0] - av[0]) * t) * sz, ly = (av[1] + (ar[1] - av[1]) * t) * sy + 1.3, c = Math.cos(r), s = Math.sin(r);
      P.push([x + lx * c + lz * s, y + ly, z - lx * s + lz * c, r + Math.PI]); }
    const C = 16, M = {}, L = 3.2; // C placards at most per text; L: seconds raised
    for (const [so, l] of Object.entries(texts)) M[so] = l.map(txt => { const [t, backdrop, ink] = txt; const m = new THREE.InstancedMesh(gp, h.mat('written', { emis: 1, side: THREE.DoubleSide }, 64, 36, backdrop, ink, t, 12), C);
      for (let k = 0; k < C; k++) m.setMatrixAt(k, Z); m.frustumCulled = false; m.userData.dyn = 1; m.visible = false; h.scene.add(m); return { m, txt, sl: Array.from({ length: C }, () => ({ t: -1 })) }; });
    // the banners: one per text, laid flat on the slope of the lower tier of four modules, unrolled from top to bottom, held 4 s, rolled up
    // in front of the car, far enough to be in the race camera's field of view (the stands are at the side): 2.5 s of race, 80 m at least
    const aheadSec = car => { const v = Math.hypot(car.vx, car.vz) || 1, d = Math.max(80, v * 2.5); return [car.x + car.vx / v * d, car.z + car.vz / v * d]; };
    const gb = new THREE.PlaneGeometry(1, 1); gb.translate(0, -0.5, 0); // the top at the pivot: it unrolls toward the bottom of the slope
    const BANNERS = Object.values(M).flat().map(e => { const [t, backdrop, ink] = e.txt, b = new THREE.Mesh(gb, h.mat('written', { emis: 1, side: THREE.DoubleSide }, 192, 112, backdrop, ink, t, 64));
      b.visible = false; b.userData.dyn = 1; b.rotation.order = 'YXZ'; h.scene.add(b); e.banner = { b, t: -1 }; return e.banner; });
    const unroll = (e, car) => { const [x, z] = aheadSec(car), k = o.mods.reduce((bk, p, j) => ((p[0] - x) ** 2 + (p[2] - z) ** 2 < (o.mods[bk][0] - x) ** 2 + (o.mods[bk][2] - z) ** 2 ? j : bk), 0);
      const [px, py, pz, r, sx = 1, sy = 1, sz = 1] = o.mods[k], lz = (av[0] + (ar[0] - av[0]) * 0.92) * sz, ly = (av[1] + (ar[1] - av[1]) * 0.92) * sy + 1.6, c = Math.cos(r), sn = Math.sin(r), B = e.banner.b;
      B.position.set(px + lz * sn, py + ly, pz + lz * c); B.rotation.set(-(Math.PI / 2 - o.slope), r + Math.PI, 0); B.userData.l = [4 * o.wd * sx, 0.84 * o.profData * sz]; e.banner.t = 0; active = true; };
    let active = false, view = null, pos = 0, waiting = 0, howl = 0, tNow = 0;
    const lifts = (car, so, n = 24) => { const l = M[so]; howl = tNow + 2500; if (window.SOUND) SOUND.roar(); if (!l) return; unroll(l[(Math.random() * l.length) | 0], car); 
      const [x, z] = aheadSec(car), pr = P.filter(p => (p[0] - x) ** 2 + (p[2] - z) ** 2 < 12100);
      for (let j = 0; j < n && pr.length; j++) { const p = pr.splice((Math.random() * pr.length) | 0, 1)[0], e = l[(Math.random() * l.length) | 0], s = e.sl.find(q => q.p == null) || e.sl.reduce((u, v) => (v.t > u.t ? v : u)); // a free one, otherwise the oldest
        Object.assign(s, { t: -j * 0.03, p, ph: Math.random() * 6 }); } active = true; }; // t < 0 at the start: they rise one after the other

    const tick = (dt, now, car) => { let ev = null; tNow = now; waiting -= dt;
      if (car) {
        o.mods.forEach((p, k) => { const e = o.gap(k, car); o4.position.set(p[0], p[1] + (e ? e * 1.6 - 1 : -60), p[2]); o4.rotation.set(0, p[3], 0); o4.scale.set(p[4], p[5], p[6]); o4.updateMatrix(); ola.setMatrixAt(k, o4.matrix); });
        ola.instanceMatrix.needsUpdate = true;
        if (car.pos) { if (car !== view) { view = car; pos = car.pos; } // car.pos: the race position (nothing outside a race)
          if (car.hit > 8 && waiting < 0) ev = 'impact'; else if (car.pos < pos && waiting < 0) ev = car.pos === 1 ? 'headEl' : 'double';
          pos = car.pos; if (ev) { lifts(car, ev); waiting = 2; } }
      }
      for (const { mat, f1, f2, ph, cutoff } of tiers) mat.map.offset.y = now < howl || Math.sin(now * f1 + ph) + Math.sin(now * f2) > cutoff ? 0.5 : 0;
      if (active) { active = false;
        for (const l of Object.values(M)) for (const { m, sl } of l) { let upd = false;
          sl.forEach((s, k) => { if (s.p == null) return; s.t += dt; upd = true; if (s.t > L) { s.p = null; s.t = -1; m.setMatrixAt(k, Z); return; } active = true;
            const u = Math.max(0, Math.min(1, s.t / 0.2, (L - s.t) / 0.3)), p = s.p; // u: raised, then lowered
            ob.position.set(p[0], p[1] - 1.2 * (1 - u) + 0.3 * Math.abs(Math.sin(s.t * 9 + s.ph)), p[2]); ob.rotation.set(0, p[3], 0.15 * Math.sin(s.t * 6 + s.ph)); ob.scale.setScalar(u); ob.updateMatrix(); m.setMatrixAt(k, ob.matrix); });
          if (upd) m.instanceMatrix.needsUpdate = true; m.visible = sl.some(q => q.p != null); }
        for (const e of BANNERS) { if (e.t < 0) continue; e.t += dt; const [w, ht] = e.b.userData.l, u = Math.max(0, Math.min(1, e.t / 0.8, (5.4 - e.t) / 0.6)); // unrolled in 0.8 s, held, rolled up in 0.6 s
          if (e.t > 5.4) { e.t = -1; e.b.visible = false; continue; } active = true; e.b.visible = u > 0.01; e.b.scale.set(w, ht * u, 1); } }
      return ev;
    };
    tick.lifts = (car, so, n) => { lifts(car, so, n); return so; };
    tick.upright = () => tNow < howl;
    return tick;
  };
})();
