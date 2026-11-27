// Placement of the scenery for "ville": adds its function to SCENERY. The shared placers come from scenery.js. See docs/methods/SCENERY.md.
(function () {
  const { inst, near, pt, indexed, insts, GLOW, boxMesh, edgePt, marker, weld, terrain } = PLACERS;

  Object.assign(SCENERY, {
    // ---------- Ville à plein régime (original map): lit towers on the street grid, signs, megatowers, floodlights, holograms, flying traffic ----------
    ville(h) {
      const { THREE, scene, S, W, rnd, geo, mat, tx, addMat, clothe, box, concrete, emis, ribbon } = h, GLOWI = { emis: 1 }, beacons = [];
      let signMats, beams, holos, MV, mvP, mvV, mvC, mvGeo, movers, beaconPts;
    { // ground: lit street grid seen from above
      box(5000, 1, 5000, mat('streets', { emis: 1, rep: [70, 70] }), 0, -60.5, 200);
    }
    {
      const emi = (cols, p) => mat('casements', { emissive: 0xffffff, emissiveMap: tx('casementsLit', cols, p) });
      const masts = [emi(['#ffd27a', '#ffe9b0'], 0.45), emi(['#7af0ff', '#d0f8ff'], 0.4), emi(['#ff5ad0', '#ffd27a', '#7af0ff'], 0.5), emi(['#ffd27a'], 0.12)];
      const signs = signMats = ['ネオン', 'スピード', '危険', 'ホテル', '電脳', 'BAR', 'NOODLE', '24H'].map((txt, i) => {
        const c = ['#ff003c', '#00f0ff', '#fcee0a', '#ff4fc8'][i % 4];
        return mat('signboard', GLOWI, c, txt);
      });
      const roofs = [], machines = [], vats = [], D = new THREE.Object3D(); // roofs: slab and parapet, cold units, water tanks (no rnd draw: the city does not move)
      const overRoof = (m, w, d, y, k) => { const c = Math.cos(m.rotation.y), s = Math.sin(m.rotation.y), at = (ox, oz) => [m.position.x + c * ox + s * oz, m.position.z - s * ox + c * oz];
        roofs.push([...at(0, 0), y + 0.6, m.rotation.y, w + 0.6, 1.2, d + 0.6]);
        if (k >= 0) { machines.push([...at(-0.4 * w, -0.38 * d), y + 1.6, m.rotation.y]); machines.push([...at(-0.4 * w, -0.38 * d + 4), y + 1.6, m.rotation.y]); if (k % 2) vats.push([...at(0.4 * w, -0.4 * d), y + 3.4, 0]); } };
      for (let gx = -620; gx <= 820; gx += 64) for (let gz = -260; gz <= 780; gz += 64) {
        const x = gx + rnd() * 24 - 12, z = gz + rnd() * 24 - 12, w = 28 + rnd() * 22, d = 28 + rnd() * 22, top = 24 + rnd() * rnd() * 150;
        const lim = (W + 4 + 0.71 * Math.max(w, d)) ** 2;
        if (S.some((s, i) => i % 3 === 0 && (s.x - x) ** 2 + (s.z - z) ** 2 < lim)) continue;
        const shadows = S.some((s, i) => i % 3 === 0 && (s.x - x) ** 2 + (s.z - z) ** 2 < (Math.sqrt(lim) + 60) ** 2); // only towers within 60 m of the road cast a shadow: all of them cost 1.4 ms per frame in the shadow pass (bench ?perf)
        const H = top + 60, m = new THREE.Mesh(geo('building', w, H, d), masts[rnd() * masts.length | 0]);
        m.position.set(x, top - H / 2, z); m.rotation.y = (rnd() - 0.5) * 0.6; m.castShadow = shadows; m.receiveShadow = true; scene.add(m);
        overRoof(m, w, d, top, roofs.length);
        if (rnd() < 0.55) { const h2 = 8 + rnd() * 45, tw = w * (0.4 + rnd() * 0.3), td = d * (0.4 + rnd() * 0.3), tm = box(tw, h2, td, m.material, 0, H / 2 + h2 / 2, 0, m); tm.castShadow = shadows; overRoof(m, tw, td, top + h2, -1); } // set-back floor
        if (rnd() < 0.45) { const ah = 10 + rnd() * 35; box(0.8, ah, 0.8, concrete, w * 0.35, H / 2 + ah / 2, d * 0.35, m); beacons.push(x + w * 0.35, top + ah + 1, z + d * 0.35); } // antenna and red beacon
        for (let k = rnd() * 4 | 0; k > 0; k--) { // 0 to 3 signs of varied sizes, horizontal or as vertical banners
          const sm = signs[rnd() * signs.length | 0], sd = rnd() < 0.5 ? -1 : 1, y = Math.max(6, Math.min(top - 5, 6 + rnd() * 45)) - m.position.y;
          const tall = rnd() < 0.35, sw = tall ? 5 : 10 + rnd() * 14, sh = tall ? 14 + rnd() * 10 : sw / 2, o = (rnd() - 0.5) * 0.5;
          if (rnd() < 0.5) box(0.5, sh, sw, sm, sd * (w / 2 + 0.3), y, o * d, m); else box(sw, sh, 0.5, sm, o * w, y, sd * (d / 2 + 0.3), m);
        }
      }
      for (const [l, g, mt] of [[roofs, geo('blk'), concrete], [machines, geo('clim'), mat('matGray')], [vats, geo('reservoir'), mat('steelMat')]]) {
        const im = new THREE.InstancedMesh(clothe(g, mt), mt, l.length);
        l.forEach(([x, z, y, ry, sx = 1, sy = 1, sz = 1], i) => { D.position.set(x, y, z); D.rotation.set(0, ry, 0); D.scale.set(sx, sy, sz); D.updateMatrix(); im.setMatrixAt(i, D.matrix); }); scene.add(im);
      }
    }
    // ---------- horizon and city life ----------
    { // distant megatowers, out of the fog: silhouettes pricked with windows against the horizon glow
      const far = mat('towerFar', { emis: 1, fog: false }, '#0d0820', ['#ffd27a', '#7af0ff', '#ff5ad0'], 70);
      const im = new THREE.InstancedMesh(geo('blk'), far, 44), D = new THREE.Object3D(); // a single draw pass for all 44
      for (let i = 0; i < 44; i++) { const a = i / 44 * 6.283 + rnd() * 0.1, rad = 1150 + rnd() * 500, h = 200 + rnd() * rnd() * 600, w = 60 + rnd() * 90; D.position.set(100 + Math.cos(a) * rad, h / 2 - 60, 250 + Math.sin(a) * rad); D.scale.set(w, h, w); D.updateMatrix(); im.setMatrixAt(i, D.matrix); }
      scene.add(im);
    }
    // floodlight beams sweeping the sky
    const beamGeo = geo('beam');
    beams = [[320, 120], [-120, 330], [520, -120], [80, 660], [-420, 60], [700, 420]].map(([x, z], i) => { const b = new THREE.Mesh(beamGeo, addMat(tx('gradient', ['#5a7cff', '#ff2bd6', '#00f0ff'][i % 3], true), { opacity: 0.5 })); b.position.set(x, -60, z); scene.add(b); return b; });
    // giant holograms: the signs in pure light, which turn and crackle
    holos = [[250, 150, 210], [-160, 165, 300], [450, 140, -90], [0, 185, 640], [640, 170, 520]].map(([x, y, z], i) => { const h = new THREE.Mesh(geo('hologram'), addMat(signMats[i].map, { opacity: 0.6 })); h.position.set(x, y, z); scene.add(h); return h; });
    // traffic: flying vehicles between the towers and headlights in the streets below (one light point each)
    MV = 110; mvP = new Float32Array(MV * 3); mvV = new Float32Array(MV * 2); mvC = new Float32Array(MV * 3); mvGeo = new THREE.BufferGeometry();
    for (let i = 0; i < MV; i++) {
      const air = i < 45, ax = rnd() < 0.5, v = (air ? 35 + rnd() * 60 : 14 + rnd() * 22) * (rnd() < 0.5 ? -1 : 1), cell = 5000 / 70, snap = (p, o) => o + Math.round((p - o) / cell) * cell;
      let x = -700 + rnd() * 1600, z = -350 + rnd() * 1200;
      if (!air) { if (ax) z = snap(z, -2300); else x = snap(x, -2500); } // on the ground: aligned with the street grid
      mvP.set([x, air ? 25 + rnd() * 150 : -59.5, z], i * 3); mvV.set(ax ? [v, 0] : [0, v], i * 2);
      mvC.set(air ? [[1, 1, 1], [1, 0.1, 0.2], [0.2, 0.9, 1]][i % 3] : [[1, 0.7, 0.3], [1, 1, 0.9]][i % 2], i * 3);
    }
    mvGeo.setAttribute('position', new THREE.BufferAttribute(mvP, 3)); mvGeo.setAttribute('color', new THREE.BufferAttribute(mvC, 3));
    movers = new THREE.Points(mvGeo, new THREE.PointsMaterial({ size: 2, sizeAttenuation: false, vertexColors: true, fog: false })); movers.frustumCulled = false; scene.add(movers);
    const beaconGeo = new THREE.BufferGeometry(); beaconGeo.setAttribute('position', new THREE.Float32BufferAttribute(beacons, 3));
    beaconPts = new THREE.Points(beaconGeo, new THREE.PointsMaterial({ color: 0xff2030, size: 2, sizeAttenuation: false, fog: false })); scene.add(beaconPts);
      // sewer grates at the edge of the carriageway: a dark plate, from which game.js sends up a steam plume tinted by the nearest neon (h.steam)
      const plate = mat('paint', { c: 0x0e0e12 });
      for (let i = 40; i < h.N; i += 140) { if (h.zone(i, 30) > 0) continue; const s = S[i], sd = (i / 140 | 0) & 1 ? 1 : -1, x = s.x - s.tz * sd * (W - 1.6), z = s.z + s.tx * sd * (W - 1.6); box(1.1, 0.05, 1.1, plate, x, s.y + 0.03, z); h.steam(x, s.y + 0.1, z); }
      // ---------- landmarks of the lap (no rnd draw: the rest of the city does not move) ----------
      const steelMat = mat('steelMat'), DS = THREE.DoubleSide;
      { // the night market (points 13 to 16): a slab on each side of the expressway, stalls smoking, the crowd under clear umbrellas, red lanterns across the street
        const i0 = pt(h, 13), i1 = pt(h, 16) - 10, n = i1 - i0, D0 = W + 1.6, D1 = W + 15;
        const slab = mat('paint', { c: 0x2a2630, side: DS });
        for (const sd of [-1, 1]) { ribbon(i0, n, sd * D0, -0.15, sd * D1, -0.15, slab, 8); ribbon(i0, n, sd * D1, -0.15, sd * D1, 1.1, concrete); ribbon(i0, n, sd * D0, -0.15, sd * D0, -2.2, concrete); ribbon(i0, n, sd * D1, -0.15, sd * D1, -2.2, concrete); }
        let a = 77; const al = () => (a = a * 1664525 + 1013904223 >>> 0) / 4294967296; // randomness specific to the market
        const stalls = [], people = [], parap = [], lant = [], wires = [], masts = [], cols = [0xd02030, 0xf4f0e0, 0x109a8a, 0xffb020];
        for (let i = i0 + 3, k = 0; i < i1 - 2; i += 3, k++) for (const sd of [-1, 1]) { const s = S[i];
          if ((k + (sd > 0 ? 1 : 0)) % 4 === 3) continue; // gaps between the stalls
          const [x, z] = edgePt(s, sd, W + 10.5); stalls.push([x, s.y - 0.15, z, Math.atan2(-sd * s.tz, sd * s.tx), 1, 1, 1, cols[(k * 3 + (sd > 0 ? 1 : 0)) % 4]]);
          if (k % 5 === 1) h.steam(x, s.y + 1.4, z); // steam from the stoves, a few
        }
        for (let i = i0 + 8, k = 0; i < i1 - 4; i += 16, k++) { const s = S[i], [x, z] = edgePt(s, k & 1 ? 1 : -1, W + 5); emis(i, x, s.y + 2.2, z, 0xff9a40, 13, 2.2); } // the stoves and bulbs of the stalls spill onto the slab, the crowd and the road edge: one side then the other
        for (let k = 0; k < 70; k++) { const s = S[i0 + 2 + (al() * (n - 4) | 0)], sd = al() < 0.5 ? -1 : 1, [x, z] = edgePt(s, sd, W + 3.5 + al() * 4.5), ht = 1.55 + al() * 0.3;
          people.push([x, s.y - 0.15 + ht / 2, z, al() * 6, 1, ht / 1.7, 1]); if (al() < 0.55) parap.push([x, s.y + ht + 0.2, z, 0, 0.9 + al() * 0.3]); }
        inst(h, geo('boxMesh', 0.5, 1.7, 0.35), mat('paint', { c: 0x3a3448 }), people);
        insts(h, 'stallStand', { counterTop: mat('boards', { c: 0x8a6a4a }), stove: mat('paint', { emis: 1, c: 0xff7a20 }), rod: steelMat, cloth: mat('paint', { side: DS }), bulbs: mat('lantern', GLOWI) }, stalls, { tintMat: 'cloth' });
        const gp = new THREE.ConeGeometry(0.9, 0.45, 10, 1, true); gp.translate(0, -0.22, 0); // umbrella: an open cone, point up
        inst(h, gp, new THREE.MeshBasicMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.28, side: DS, depthWrite: false }), parap);
        inst(h, geo('boxMesh', 0.04, 0.9, 0.04), steelMat, parap.map(p => [p[0], p[1] - 0.6, p[2]]));
        // the lanterns: a wire every 7 samples between two masts, seven lanterns hanging with the sag of the wire; one line in three lights the street
        for (let i = i0 + 2, k = 0; i < i1; i += 7, k++) { const s = S[i];
          for (const sd of [-1, 1]) { const [x, z] = edgePt(s, sd, W + 1.9); wires.push([x, s.y + 3.9 - 0.15, z, 0, 1, 1, 1]); }
          wires.push([s.x, s.y + 7.6, s.z, h.across(s), 2 * W + 3.8, 0.04, 0.04]);
          for (let j = 0; j < 7; j++) { const o = (j - 3) / 3 * (W - 1), [x, z] = edgePt(s, 1, o); lant.push([x, s.y + 7.6 - 0.9 * (1 - (o / W) ** 2) - 0.5, z, h.across(s)]); }
          if (k % 3 === 1) emis(i, s.x, s.y + 6.5, s.z, 0xff2a30, 18, 0.7); }
        inst(h, geo('boxMesh', 0.2, 7.8, 0.2), steelMat, wires.filter(f => f[4] === 1));
        inst(h, geo('boxMesh', 1, 1, 1), mat('matGray'), wires.filter(f => f[4] !== 1));
        inst(h, geo('lanternStreet'), mat('paint', { emis: 1, c: 0xff2a30 }), lant);
        inst(h, geo('boxMesh', 0.3, 0.12, 0.3), mat('paint', { emis: 1, c: 0xffd05a }), lant.map(p => [p[0], p[1] - 0.46, p[2], p[3]])); // the golden tassel under each lantern
        box(18, 3.2, 0.4, mat('written', GLOWI, 224, 40, '#2a0408', '#ffd05a', '夜市 MARCHE DE NUIT', 26), ...(s => [s.x, s.y + 9.2, s.z])(S[i0 + 2])).rotation.y = h.across(S[i0 + 2]); // the entrance sign, placed on the first wire
        emis(i0 + 2, S[i0 + 2].x, S[i0 + 2].y + 6.5, S[i0 + 2].z, 0xffd05a, 14, 0.8); // the entrance sign lights the road under it
      }
      { // the tunnel entrance into a residential block, like the Chongqing metro: the expressway enters through a hole in the middle of the floors
        const T = h.T, K = 15, a = S[T.t0], b = S[T.t0 + K], L = Math.hypot(b.x - a.x, b.z - a.z), ux = (b.x - a.x) / L, uz = (b.z - a.z) / L; // axis: the chord of the tunnel's first 30 m, which turns
        let dev = 0; for (let k = 0; k <= K; k++) { const s = S[T.t0 + k]; dev = Math.max(dev, Math.abs((s.z - a.z) * ux - (s.x - a.x) * uz)); }
        const tr = W + 2 + dev, w = 2 * tr + 28, d = L + 1, high = 95, low = -60, yl = b.y - 0.3, yh = a.y + 10.3, ry = Math.atan2(ux, uz), c = (L - 1) / 2; // hole: the road passes through without touching the walls despite the bend and the descent
        const fen = mat('casements', { emissive: 0xffffff, emissiveMap: tx('casementsLit', ['#ffd27a', '#ffe9b0'], 0.45) });
        const blk = (x0, x1, y0, y1) => { const m = new THREE.Mesh(geo('building', x1 - x0, y1 - y0, d), fen), x = (x0 + x1) / 2;
          m.position.set(a.x + ux * c + uz * x, (y0 + y1) / 2, a.z + uz * c - ux * x); m.rotation.y = ry; m.castShadow = m.receiveShadow = true; scene.add(m); };
        blk(-w / 2, -tr, low, high); blk(tr, w / 2, low, high); blk(-tr, tr, yh, high); blk(-tr, tr, low, yl);
        box(2 * tr, 4, 0.5, signMats[4], a.x - ux * 1.3, yh + 3, a.z - uz * 1.3).rotation.y = ry; // sign above the hole
        emis(T.t0, a.x - ux * 3, a.y + 8, a.z - uz * 3, 0xff003c, 14, 0.9); // its red falls on the road in front of the mouth
      }
      h.beams.push(...beams); // game.js turns them toward the camera of each view
      return (dt, now) => { // signs that blink, crackle or scroll; holograms, traffic, beacons
        signMats.forEach((m, i) => { m.color.setScalar(i % 3 === 0 ? ((now / 400 + i) & 1 ? 1 : 0.25) : i % 3 === 1 && Math.random() < 0.04 ? 0.3 : 1); if (i % 2) m.map.offset.x += dt * 0.12; });
        holos.forEach((h, i) => { h.rotation.y += dt * 0.25; h.material.opacity = 0.45 + 0.2 * Math.sin(now * 0.004 + i) - (Math.random() < 0.05 ? 0.3 : 0); });
        for (let i = 0; i < MV; i++) {
          let x = mvP[i * 3] + mvV[i * 2] * dt, z = mvP[i * 3 + 2] + mvV[i * 2 + 1] * dt;
          mvP[i * 3] = x < -700 ? x + 1600 : x > 900 ? x - 1600 : x; mvP[i * 3 + 2] = z < -350 ? z + 1200 : z > 850 ? z - 1200 : z;
        }
        mvGeo.attributes.position.needsUpdate = true; beaconPts.visible = (now / 700 & 1) === 1;
      };
    },
  });
})();
