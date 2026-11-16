// La foule des tribunes, partagée par les cartes à gradins (stade, canal) : POSEURS.foule(h, opts) → tick (dt, now, car), à appeler dans le tick du décor.
// Deux choses : (1) les bras qui se lèvent par moments (décalage d'une demi-hauteur de la texture `foule`, rien n'est redessiné) ; (2) la ola, une copie bras levés
// de la foule du bas, levée sur les modules proches de la voiture suivie et cachée sous le sol ailleurs. Les cartes ne gardent que leurs données (gradins, réglages).
//   etages : [{ mat, f1, f2, ph, seuil }]   mat = matériau `foule` d'un étage ; bras levés quand sin(now·f1 + ph) + sin(now·f2) > seuil
//   ola    : { mods, larg, prof, pente, y, z, ecart }
//     mods   : modules de tribune posés [x, y, z, rotY, éch. x, éch. y, éch. z] (mêmes listes que le décor passe à insts)
//     larg, prof, pente (rad), y, z : le rang du bas dans le repère du module (formes-<carte>.js : ['foule', larg, 0.6, prof, 0, y, z, [-pente, 0, 0]])
//     ecart(k, car) → 0..1 : à quel point le module k est « dans la vague » (0 = au sol, caché)
// Pour ajouter pancartes ou réactions de la foule : étendre ce fichier, que les deux cartes appellent d'un seul endroit.
(function () {
  POSEURS.foule = (h, { etages, ola: o }) => {
    const { THREE } = h, { inst } = POSEURS, o4 = new THREE.Object3D();
    const go = h.geo('boite', o.larg, 0.6, o.prof); go.rotateX(-o.pente); go.translate(0, o.y + 1.2, o.z);
    const fo = h.mat('foule', {}, '#4a4458', '#f4f0e0'); fo.map.anisotropy = 8; fo.map.offset.y = 0.5;
    const ola = inst(h, go, fo, o.mods); ola.userData.dyn = 1; ola.frustumCulled = false; // dyn : elle bouge, hors fusion du décor fixe (game.js)
    return (dt, now, car) => {
      if (car) {
        o.mods.forEach((p, k) => { const e = o.ecart(k, car); o4.position.set(p[0], p[1] + (e ? e * 1.6 - 1 : -60), p[2]); o4.rotation.set(0, p[3], 0); o4.scale.set(p[4], p[5], p[6]); o4.updateMatrix(); ola.setMatrixAt(k, o4.matrix); });
        ola.instanceMatrix.needsUpdate = true;
      }
      for (const { mat, f1, f2, ph, seuil } of etages) mat.map.offset.y = Math.sin(now * f1 + ph) + Math.sin(now * f2) > seuil ? 0.5 : 0;
    };
  };
})();
