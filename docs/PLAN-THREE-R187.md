# Plan : passer de three.js r128 à r187

État au 14 novembre 2026. Le jeu tourne sur **r128** (2021, `three.min.js` global). La dernière version est **r187** (30 octobre 2026).
Règle de ce plan : on ne garde que ce qui gagne en performance ou en stabilité, mesuré au banc (`node outils/banc.js`), avec des captures avant / après identiques.

## Résumé

| Phase | Quoi | Gain attendu | Risque | Décision |
|---|---|---|---|---|
| 0 | Mesure de référence + captures | point de comparaison | nul | à faire |
| 1 | Particules calculées dans le shader (sans changer de version) | CPU par image, envois au GPU, 10× plus de pluie possible | faible | à faire |
| 2 | Monter en r187, toujours en WebGLRenderer | culling par instance, compilation des shaders sans à-coup, uniformes partagés, code de contournement supprimé | moyen | à faire |
| 3 | WebGPURenderer + TSL | compute, éclairage clustered, SSGI, TRAA | élevé : réécriture de tout le rendu | pas maintenant, voir critères |

## Phase 0 : référence

- `node outils/banc.js` (toutes les cartes) et `--joueurs=2` : garder `captures/perf.json` comme référence.
- Captures fixes de chaque carte (`outils/capture.sh`), pour comparer les pixels après chaque phase : le rendu doit rester identique.

## Phase 1 : particules sur le GPU (r128, sans migration)

Aujourd'hui le CPU recalcule chaque particule et renvoie tout le tableau au GPU à chaque image.
Remède : chaque particule garde une graine fixe (posée une fois) ; sa position est une formule de (graine, temps, voiture) écrite dans le shader des sommets. Plus aucun `needsUpdate` par image.

| Système | Où | Aujourd'hui | Après |
|---|---|---|---|
| Pluie (2400 traits) | [game.js:553](../game.js), mise à jour [game.js:1677-1692](../game.js) | positions + couleurs réécrites chaque image | formule : chute cyclique autour de la voiture, `uniform` temps + position ; nombre réglé par `setDrawRange` comme aujourd'hui |
| Éclaboussures (300) | [game.js:561](../game.js), [game.js:1693-1699](../game.js) | idem | idem, cycle de vie dans le shader |
| Lignes de vitesse (400) | [game.js:653](../game.js), [game.js:711](../game.js) | idem | formule |
| Étincelles / débris (320) | [game.js:631](../game.js), [game.js:718](../game.js) | physique CPU (vitesse, rebond) | émission par anneau : on n'écrit que la particule qui naît (`updateRange`), le vol (balistique) dans le shader |
| Fumées « flou » | [game.js:637-644](../game.js) | idem | même principe que les étincelles |
| Traces de gomme | [game.js:622](../game.js), [game.js:695](../game.js) | tout le tableau renvoyé | anneau + envoi partiel de la seule trace ajoutée |
| Décor animé (`mvGeo`, nappes) | [decors.js:231-254](../decors.js), [decors.js:433](../decors.js) | positions réécrites | formule dans le shader |

Contrôle : banc avant / après, captures pluie identiques à l'œil, `node test.js`.

## Phase 2 : r187 en WebGLRenderer

### Chargement
`three.min.js` n'existe plus depuis la r161. On garde le jeu sans outil de build :
- copier `three.module.js` + `three.core.js` (r187) dans le dépôt, pas de CDN (le jeu marche hors ligne) ;
- un petit `<script type="module">` dans `index.html` importe three, pose `window.THREE`, puis charge les scripts actuels dans le même ordre ;
- `test.js`, `test-cartes.js`, `test-session.js` lisent `three.min.js` : les passer par un `import()` de `three.module.js`.

### Changements cassants à traiter (guide de migration officiel)

| Version | Changement | Endroit dans le code | Correction |
|---|---|---|---|
| r152 | gestion des couleurs active par défaut, sortie en sRGB | tout le rendu | `THREE.ColorManagement.enabled = false` et `renderer.outputColorSpace = THREE.LinearSRGBColorSpace` : couleurs identiques |
| r155 | intensités physiques, `useLegacyLights` supprimé | `hemi`, `sun` ([game.js:315-316](../game.js)) pour les matériaux Lambert | multiplier `TH.hemi[2]` et `TH.sun[1]` par π, comparer aux captures |
| r144 | Lambert calculé par pixel ; `Scene.autoUpdate` remplacé par `matrixWorldAutoUpdate` | [game.js:1738-1740](../game.js) | remplacer `scene.autoUpdate` ; vérifier le rendu des Lambert |
| r151 | `InstancedMesh` éliminé hors champ par instance | [game.js:915](../game.js), [game.js:418](../game.js) (le contournement `frustumCulled = false`) | supprimer le contournement, `computeBoundingSphere()` après pose des instances fixes ; les instances mobiles gardent `frustumCulled = false` |
| r163 | WebGL 1 abandonné ; GLSL 3 | `OMB` utilise `gl_FragDepthEXT` + `extensions.fragDepth` ([game.js:1461-1462](../game.js)) | écrire `gl_FragDepth`, retirer `extensions` |
| r135/r136 | format d'une texture figé après premier usage ; `DataTexture` exige `needsUpdate` | `MOT` (mouillure), HUD, textures canvas | vérifier qu'aucune ne change de taille, sinon la recréer |
| r170 | mipmaps toujours générées si `generateMipmaps` | cibles de rendu, textures canvas | `generateMipmaps = false` là où le filtre est `Nearest` |
| r187 | `setViewport`/`setScissor` ne multiplient plus par `pixelRatio` sur une cible | écran partagé | vérifier à 2, 3, 4 joueurs |
| r128 → r187 | `onBeforeCompile` : les morceaux `fog_vertex`, `fog_fragment`, `map_fragment` existent toujours | `eclaire` ([game.js:394-408](../game.js)) | relire le texte de `map_fragment` (le mode `affine` le recopie) et le nom `vUv` (devenu `vMapUv` en r151) |

### Nouveautés r187 à brancher (gain réel pour ce jeu)

1. **Culling par instance** (ci-dessus) : moins de sommets dessinés pour le décor en nombre.
2. **`renderer.compileAsync(scene, cam)`** (compilation en parallèle, `KHR_parallel_shader_compile`) au chargement d'une carte : plus de gel de la première image ni à l'apparition d'un effet.
3. **Uniformes partagés (`UniformsGroup`, UBO WebGL 2)** pour `LUX`, envoyé une fois par image au lieu d'une fois par programme. À garder seulement si le banc le confirme.
4. **`cameraPosition`** est renseigné pour Basic et Lambert : supprimer `uCam` ([game.js:356](../game.js)).

Écarté : `BatchedMesh` (le décor est déjà fondu par matière, [game.js:860-890](../game.js) ; pas de gain attendu), ombres en cascade (`BasicShadowMap` en 270p suffit), MSAA (le style est pixelisé).

Contrôle : banc toutes cartes + 2 joueurs, captures, tests, une partie par carte.

## Phase 3 : WebGPURenderer + TSL (pas maintenant)

Ce que ça apporterait : particules par compute (millions), `ClusteredLighting` (centaines de lumières ponctuelles au lieu des 20 de `NL`), SSR / SSGI / GTAO / TRAA intégrés.

Ce que ça coûte : WebGPURenderer ne prend ni `onBeforeCompile` ni les `ShaderMaterial` en GLSL. Il faudrait réécrire en TSL l'éclairage maison (`LU_V`, `LU_H`, `LU_F`), la mouillure, la passe finale `post`, `ssr`, `OEIL`, `OMB`, les cubes de reflet. Sur Firefox Linux / Android, le repli WebGL 2 de WebGPURenderer est souvent plus lent que WebGLRenderer. En 270p, SSGI et ombres douces se verront peu.

On la lance seulement si, après la phase 2, l'un de ces points est vrai :
- le coût par pixel des 20 luminaires est le premier poste au banc et on veut en afficher beaucoup plus ;
- on veut des effets de particules que la phase 1 ne peut pas faire (collisions avec la route, interaction entre particules).
