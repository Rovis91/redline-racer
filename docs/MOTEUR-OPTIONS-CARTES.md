# Options du moteur à activer par carte

Toutes ces options sont désactivées par défaut. Une carte qui n'en pose aucune rend exactement comme avant : les shaders sont identiques, ainsi que les géométries et les textures (empreinte comparée sur wangan, touge, canal et paris avant et après), et le nombre de passes de dessin ne change pas.
Elles se posent dans l'entrée de la carte dans `cartes.js` (`th` = thème), sauf `couches`, qui peut aussi se passer à `terrain()` dans `decors.js`.

**Essayer sans toucher à `cartes.js`.** Le paramètre `?opt=<JSON>` est fusionné dans la carte au chargement (`th` dans le thème, les autres clés dans la carte, `large` compris). Il marche dans le jeu, dans `outils/captures.html` (`opt=`) et dans le banc (`OPT='…' node outils/banc-rapide.js chapada`).

Les coûts ci-dessous ont été mesurés au banc rapide sur chapada, sur une machine chargée de 35 à 60 %, donc les millisecondes sont bruitées. Les passes de dessin, elles, sont exactes.

## 1. Filtrage linéaire par texture : `th.lisse`, `mat(…, { lisse: 1 })`

```js
th: { lisse: ['eauThe', 'chute'] }              // ces textures, partout où la carte et le moteur les emploient
h.mat('eauThe', { lisse: 1, transparent: true })  // ou une seule matière
```
Ces textures passent en filtrage linéaire avec mipmaps (`LinearMipmapLinearFilter`) au lieu du plus proche. Les autres restent nettes. `chaussee` est accepté (route et sol du tunnel).
Coût : nul (le filtrage est fait par le GPU).
**À l'essai :** le lissage est bon pour l'eau et les rideaux d'eau. Sur une roche à motif net, comme `rocheStrates`, le relecteur la voit devenir « floue et baveuse » de près, en rupture avec le style pixel : à éviter sur les parois proches.

## 2. Chaussée plus propre : `th.routeTex: 'chausseeFine'`

```js
th: { routeTex: 'chausseeFine', route: [ /* mêmes 7 réglages que pour chaussee */ ] }
```
C'est un dessin de 128 × 512 pixels au lieu de 64 × 256. Le grain est fin et doux (il se fond en un ton à 270 lignes), il n'y a plus de rapiéçages clairs ni de fissure, et les passages de roues sont continus. Bords, pointillés, bordures et flaques gardent la même place. La texture tire son hasard de son propre semis (`alea`), donc elle ne déplace pas le décor de la carte. On peut la combiner avec `lisse: ['chausseeFine']`.
Coût : nul en temps d'image, 256 Ko de texture.
**À l'essai :** jugée meilleure sur les 10 vues de chapada (« grain doux, plaques claires disparues »).

## 3. Terrain à plusieurs matières : `th.couches` ou `terrain(h, { couches })`

```js
th: { couches: [
  { tex: ['rocheStrates'], pente: [0.22, 0.45], rep: 0.6 },              // roche sur les pentes
  { tex: ['bruit', '#7a5a3a', ['#8a6a48']], bord: [7, 18] },             // terre près de la route
  { tex: ['sableBlanc'], bas: [2, 6] },                                   // sable dans les creux
] }
```
On peut poser jusqu'à 4 couches par-dessus la matière du terrain (`o.mat`, qui doit avoir une texture), chacune dans l'ordre, au-dessus de la précédente. Le poids d'une couche vaut le produit de ses critères, chacun passant en douceur d'une borne à l'autre :
- `pente: [a, b]` : de 0 à 1 quand `1 - normale.y` passe de a à b (0 = plat, 1 = vertical) ;
- `bord: [a, b]` : 1 à moins de a mètres de la route, 0 au-delà de b ;
- `haut: [a, b]` : de 0 à 1 de l'altitude a à l'altitude b ;
- `bas: [a, b]` : de 1 à 0 de l'altitude a à l'altitude b ;
- `poids: (x, z, y, pente, d) => 0..1` : critère libre ;
- `bruit` : écart aléatoire par sommet, pour casser les lisières ;
- `rep` : échelle de la texture par rapport à celle du terrain ;
- `tex: [nom, …réglages]` (une texture du catalogue), ou bien `map:` (une texture déjà faite).

Les poids sont calculés par sommet du maillage (tous les `pas` mètres), puis mêlés dans le shader. Le terrain reste dessiné en **une seule passe**.
Coût : une lecture de texture en plus par couche, sur le terrain seulement. C'est dans le bruit de mesure, et les passes de dessin ne changent pas.
**À l'essai :** la roche apparaît bien sur les pentes de chapada. La lisière se lit « en plaques franches » avec `bruit: 0.25` et un pas de 8 m, il vaut mieux garder `bruit` sous 0,1 et élargir l'écart entre a et b. Sur chapada V1, la terre près de la route se voit peu, car les rubans de bas-côté du décor couvrent le terrain.

## 4. Ombres : `th.ombre: { taille, champ, doux }`

**Diagnostic du damier (chapada).** La carte d'ombre couvre 2 × 390 m sur 2048 texels, soit **0,38 m par texel**. C'est confirmé dans le code : `TX = 2 · 300 · LOIN / 2048`. Elle utilise `BasicShadowMap`, sans filtrage. Sous un soleil rasant, un texel s'étire au sol de 1 / sin(hauteur du soleil). Avec l'astre de chapada (`dir [0.8, 0.25, 0.4]`, hauteur d'environ 16°), cela fait **1,4 m par texel** dans l'axe du soleil, d'où les ombres d'arbres en escaliers de gros pixels.

```js
th: { ombre: { doux: 1 } }                         // recommandé : bords filtrés, presque gratuit
th: { ombre: { doux: 1, champ: 250 } }             // plus fin (0,24 m par texel), portée des ombres de 250 m
```
- `doux: 1` : le `getShadow` de three est remplacé par 4 lectures avec un mélange bilinéaire. Les marches deviennent des bords en dégradé. Coût : dans le bruit (2,9 et 3,1 ms contre 2,5 et 3,1 ms sans).
- `champ` : demi-côté couvert, en mètres (390 par défaut). Plus petit, l'ombre est plus fine, mais elle s'arrête plus près, et l'ombre du décor fixe est recalculée plus souvent (tous les 64 texels de déplacement). Avec `champ: 220`, on a mesuré 3,1 à 6 ms.
- `taille` : côté de la carte d'ombre en texels (2048 par défaut). **4096 coûte cher** : 7,7 à 8,3 ms contre environ 2,8 ms sur chapada, à cause de la copie du carré mobile et du recalcul de l'ombre fixe, quatre fois plus grands. À éviter.
**À l'essai :** les ombres des troncs sont jugées « plus fondues, sans marches visibles » sur les vues 08 et 09.

## 5. Tunnel de forme libre : `th.tun.h`, `voute`, `ouv`, `rayons`, et `M.large` pour la largeur

```js
{ id: 'cenote', tun: [30, 35], large: [[30, 35, 16]],     // largeur : M.large (sim.js), les parois de la physique
  th: { tun: { ...tunnelHabituel,
    h:     [[0, 9], [0.3, 20], [0.55, 26], [0.8, 16], [1, 9]],  // hauteur sous la clé (m)
    voute: [[0, 1], [0.3, 9], [0.55, 13], [0.8, 7], [1, 1]],    // flèche de la voûte (m), 0 = plafond plat
    ouv:   [[0.4, 0.46], [0.56, 0.6]],                          // ouvertures du plafond
    rayons: '#fff0c8',                                          // une colonne de lumière par ouverture
  } } }
```
`f` vaut 0 à l'entrée du tunnel et 1 à la sortie. `h` et `voute` acceptent un nombre, des clés `[[f, valeur], …]` interpolées, ou une fonction `(f, s) => valeur`.
Dès que l'une de ces options est posée, le sol, les parois, la coque et les luminaires suivent la demi-largeur roulable `s.w`, c'est-à-dire les murs de `sim.js`, donnés par `M.large`, au lieu de `W`. La voûte est une demi-ellipse de 10 facettes, des naissances (`h - voute`) jusqu'à la clé (`h`). Les portails sont mis à l'échelle de la largeur et de la hauteur de l'entrée. Sous une ouverture, ni voûte ni coque (on voit le ciel) ni luminaire. Une colonne de lumière additive, penchée vers l'astre, descend jusqu'au sol, et un luminaire en marque le pied.
**Collisions :** `sim.js` n'a pas été modifié, et il n'avait pas besoin de l'être. Il tient déjà la voiture dans `s.w`. Contrôle : sur wangan avec `large: [[30, 35, 16]]`, en braquant à fond d'un côté puis de l'autre dans tout le tunnel, 0 image au-delà de `s.w` et 3 images de choc contre les parois. Sur la capture de la voiture poussée au mur, elle touche la paroi sans la traverser.
**Caméra :** elle reste sous le plafond dès que `h` vaut au moins 6 m (la caméra de course est à environ 3,2 m). Le plafond n'a pas de collision, et un saut dans un tunnel bas le traverserait, comme avant.
Coût : sur wangan, de 3 à 18 passes de plus selon la mesure (457-464 sans, 462-475 avec) (la voûte est découpée en morceaux par les ouvertures, et chaque colonne fait une passe). Les millisecondes sont dans le bruit.
**À l'essai (wangan modifié) :** voûte, hauteur variable, largeur, ouvertures et colonnes de lumière sont visibles. Aucun trou ni face manquante n'a été relevé. Restes : le bord de l'ouverture paraît net, comme découpé à l'emporte-pièce, et l'intérieur des portails est un bloc plein, sans arrondi.
Limites : l'astre reste éteint dans tout le tunnel, avec son ombre (la lumière vient des colonnes et des luminaires). Il n'y a pas d'option de sol d'eau dédiée : le décor de la carte pose son eau.

## 6. Outil de revue : `outils/captures.html`

```
captures.html?carte=chapada&pas=10&taille=1920x1080&jeu=1&opt=<JSON encodé>
```
- `taille=LxH` : taille de la page du jeu (960x540 par défaut). Avec le style `net` des captures, la scène est rendue à cette résolution.
- `jeu=1` : chaque capture colle **à gauche le rendu réel du jeu** (270 lignes agrandies en pixels nets, avec le HUD) et **à droite le rendu fin**, à la même hauteur (3840 × 1080 avec `taille=1920x1080`). Une seconde page du jeu suit la voiture de la première, image par image.
- `opt=` : options de carte à l'essai (voir plus haut).

Avec `outils/capture.sh`, `jeu=1` et une grande `taille` dépassent les 240 s d'attente par défaut. Il faut alors monter `ATTENTE=300` (en pas de 2 s).
Les captures ne se reproduisent pas au pixel près d'une passe à l'autre (secousses et particules aléatoires). Pour prouver qu'une carte n'a pas changé, il vaut mieux comparer les shaders et les géométries que les JPEG.

## 7. Tunnel et salle, deuxième série : `th.tun.rayonsK`, `th.tun.ambiant`, `th.oeil`

```js
th: { tun: { ...tunnelHabituel, rayonsK: 0.35, ambiant: 0.7 },   // colonnes plus sourdes, voûte plus claire
      oeil: { tun: 0.7, noir: 0.5, clair: 0.15 } }               // grotte peu sombre, œil qui se refait vite au jour
```
- `rayonsK` : l'opacité des colonnes de lumière sous les ouvertures (`th.tun.rayons`). Elle vaut 0,55 par défaut, et comme les colonnes sont additives, c'est leur éclat.
- `ambiant` : la part de lumière ambiante sur le sol, les parois et la voûte du tunnel (0,55 par défaut, `TUN_AMB`). Le reste vient des luminaires. Les parois de la ville (`th.alarme`) gardent leur 0,85.
- `tun.jour` (0 par défaut) : part du soleil et du ciel gardée quand la voiture est sous le tunnel (1 = rien ne s'éteint). Pour une grotte ouverte dont le décor fait la roche (`sans: ['parois']`) : le dehors vu par les porches et les puits, les arbres et le bois restent éclairés. Sans elle, tout ce qui n'est pas auto-éclairé passe au noir sous le tunnel.
- `oeil` : l'adaptation de l'œil, sans style seulement (le style `net` des captures ne la montre pas). `tun` est la lumière vraie du tunnel par rapport au dehors (0,4) : plus près de 1, l'entrée noircit moins et la sortie éblouit moins. `noir` et `clair` sont les constantes de temps en secondes vers le noir (0,5) et vers le clair (0,35). Une sortie de grotte trop longue à retrouver le jour se règle avec `clair` plus petit, et une salle trop noire en entrant avec `tun` plus grand. `th.tun.eclat` garde son rôle.
Coût : nul (des constantes).

**La voûte coûte déjà une seule passe.** La demande supposait environ 40 passes, une par facette. En réalité, la « fusion du décor fixe » de `game.js` fond déjà chaque facette, opaque et immobile, avec les autres rubans de sa matière, par pavé de 500 m. Sur perse, la scène compte 341 objets avec ou sans fusion préalable des facettes. Je n'ai donc rien changé à ce sujet.

## 8. Chaussée mouillée visible : `th.mouilleVisible`

```js
surf: { zones: [[14, 19, 'mouille', 0.5]] },
th: { mouilleVisible: 1 }     // ou une force : 0.5 = moitié moins marqué
```
Les zones `surf` « mouille » se voient comme le bitume sous la pluie, là même où il ne pleut pas. La chaussée y est plus brillante (le soleil, la lune, les phares et les néons y laissent des reflets étirés), les reflets de l'écran (ssr) y sont calculés, et le bitume est un peu plus sombre (de 30 % pour un mouillé plein). La mouillure suit `T.surf` de `sim.js` : ce qu'on voit est ce qu'on roule, fondu sur 20 m aux bords. Le sol du tunnel la reçoit aussi (galeries suintantes), mais pas la pluie, qui est coupée sous le tunnel comme dans la physique. La ligne sèche que trace la course (`MO`) y est visible comme sous la pluie.
Coût : sur une carte sans pluie, l'option allume la passe de reflets (ssr), avec sa profondeur, et le repli des reflets, comme une carte de pluie. Sur chapada, on a mesuré 2,62 / 2,37 ms (210 / 201 appels) contre 2,30 / 2,18 ms (201 / 198 appels) sans l'option, soit environ +0,3 ms et +5 appels, dans une machine chargée à 50 %. Sur une carte qui pleut déjà, elle ne coûte rien.
**À l'essai :**
- Sur touge, avec une zone `mouille` posée par `?opt=`, la chaussée change bien (écart moyen de 2,4 niveaux de gris sur l'image).
- Sur barrage, le sol du tunnel mouillé est vu « plus sombre et brillant, reflets des luminaires plus marqués », surtout dans le rendu réel.
- **Sur chapada, rien ne se voit** (écart de 0,08) : dans ses zones mouillées, le décor de la carte pose ses propres surfaces par-dessus la chaussée (à 4 cm au-dessus aux échantillons 1450 et 1550, au même niveau à 1300, vérifié par lancer de rayon). Ces surfaces ne lisent pas la mouillure. Une carte qui recouvre sa route doit soit laisser la chaussée visible dans ses zones mouillées, soit donner ce rendu à ses propres surfaces.

## 9. Retour au frôlement du mur : `th.frole`

```js
th: { frole: 1 }
```
Quand la voiture frotte le mur à plus de 15 m/s (le moment où `sim.js` remplit la jauge, `NI.mur`), la jauge de nitro du HUD s'éclaircit et le segment qui se remplit passe en blanc, un peu plus haut, pendant le frottement et 0,3 s après. Les étincelles du frottement existaient déjà, sur toutes les cartes. Le calcul de la sim n'est pas touché.
Coût : nul.
**À l'essai (wangan poussé au mur) :** le segment blanc est bien lu dans les deux rendus. Dans le rendu réel à 270 lignes, la jauge éclaircie reste terne, « gris-beige », quand elle est peu remplie.

## 10. Tunnel nu, ciel de jour, ciel plus fin : `th.tun.sans`, `th.tun.cielJour`, `th.cielSeg`

```js
th: { cielSeg: 48,
      tun: { ...tunnelHabituel, cielJour: 1, sans: ['portails', 'luminaires', 'parois'] } }
```
- `tun.sans` : ce que le moteur ne pose pas dans le tunnel. `'portails'` : les deux portails. `'luminaires'` : les boîtiers des luminaires et les boîtiers de secours (les lumières restent). `'lumieres'` : aucune lumière de luminaire ; il ne reste que le jour des ouvertures (`ouv`, `rayons`). `'parois'` (tunnel de forme libre seulement) : ni parois, ni voûte, ni coque ; il reste le sol, les lumières, le noir et les colonnes de lumière, et le décor de la carte fait la salle.
- `tun.cielJour: 1` : sous le tunnel, le ciel garde sa couleur au lieu de prendre celle du brouillard du tunnel. On voit le jour par la bouche de sortie et par les ouvertures.
- `cielSeg` : nombre de facettes de la sphère du ciel (16 par défaut). Sur un ciel de jour à paliers serrés près de l'horizon, 16 facettes cassent les paliers en éventail.
- `astre.rayons` (1 par défaut) : force du halo de l'astre dans la passe finale. À baisser quand un sol clair en plein midi blanchit (plage : 0,3).
Coût : nul. Sans ces options, rien ne change (ville, wangan, paris : mêmes géométries, même ciel).

## 11. Pas de cônes : `th.sansCones`

`th: { sansCones: 1 }` : le moteur ne pose ni cônes ni poubelles à l'entrée des virages. Désactivé par défaut ; les autres cartes gardent les leurs.

## 12. Piste plus étroite que `W` : `M.large` avec une demi-largeur inférieure à `W`

```js
{ id: 'plage', W: 8, tun: [26, 34], large: [[27, 33, 5]] }   // passerelle de 10 m dans la grotte du cénote
```

`M.large` ne savait qu'élargir (`sim.js` gardait le maximum). Une entrée dont la demi-largeur est inférieure à `W` resserre maintenant la piste entre ses deux points, avec le même raccord de 60 m de part et d'autre. Aucune autre carte ne pose de valeur inférieure à `W` : rien ne change pour elles. À n'utiliser que sous un tunnel de forme libre (section 5), où le sol du moteur suit `s.w` : à ciel ouvert, le ruban de chaussée et les glissières du moteur restent à `W`, le décor devrait couvrir la bande en trop. Contrôle sur plage : `node test-cartes.js` (tour du pilote automatique, 0 choc).

## Mesures de la deuxième série (banc rapide, machine chargée de 30 à 57 %)

| Carte | Avant | Après |
|---|---|---|
| wangan | 3,65 / 3,66 ms, 477 / 458 appels | 3,57 / 3,06 ms, 466 / 466 appels |
| wangan, tunnel voûté par `?opt=` | 3,62 / 4,88 ms, 475 / 459 appels | 2,99 / 3,05 ms, 464 / 467 appels |
| perse (branche `claude/carte-perse-v2-48e1b0`) | 4,24 / 3,11 ms (408 / 416 appels), puis 2,03 / 1,99 ms (409 / 436 appels) | 2,17 / 2,09 ms, 438 / 442 appels |
| perse avec `rayonsK`, `ambiant`, `oeil` et `frole` | — | 2,19 / 2,11 ms, 464 / 438 appels |

Le nombre d'appels varie de ±30 d'une mesure à l'autre avec le même code (perse avant : 409, puis 436). Sans option, les anciennes cartes gardent les mêmes géométries et matières, vérifié par empreinte sur wangan, barrage et paris. Les shaders ne diffèrent que par le texte des blocs `#ifdef MOUVIS` inactifs.

## 10. Brouillard par zone : `th.brume`

```js
th: { fogD: [70, 1000], brume: [[68, 75, 30, 380]] }   // entre les points 68 et 75 du tracé, le brouillard commence à 30 m et bouche tout à 380 m
```

`th.loin` (en m) : la caméra ne dessine pas au-delà de 1,5 × la fin du brouillard (3 000 m au plus) ; `loin` fixe une portée minimale pour les cartes dont des lointains sont posés hors brouillard (`fog: false` : sommets, halo, silhouettes) plus loin que cela, sans quoi ils disparaissent (barrage : 2400, touge : 3000).

Entre deux points de contrôle du tracé, le début et la fin du brouillard de la carte glissent vers les valeurs données, avec un fondu de 180 m à l'entrée et à la sortie de la zone. C'est le vrai brouillard de la scène (aucune texture plate posée dans le décor) : tout ce qui reçoit le brouillard y disparaît, ce qui est posé hors brouillard (`fog: false`, les lointains) reste net. La zone ne doit pas enjamber la ligne de départ. En écran partagé, chaque vue a le brouillard de sa voiture. La zone agit aussi sous un tunnel : si elle commence à la sortie d'un tunnel, son fondu de 180 m remplit la fin du tunnel et le brouillard est entier à la sortie (barrage : `[68, 79, 0, 55]`).
Dans la zone, un voile de la couleur du brouillard est tendu à 700 m autour de la caméra : il cache ce qui échappe au brouillard (le ciel, l'astre, les lointains posés hors brouillard). Son opacité suit la force de la zone. Un brouillard serré (`[68, 73, 0, 55]` sur barrage : on voit à 55 m) est donc un vrai brouillard, sans horizon net au-dessus.
Coût : une passe de dessin dans la zone seulement. Sans `th.brume`, rien ne change (le voile n'est pas créé).

## 11. Texture des panneaux de virage : `th.chevTex`

```js
th: { chev: 1, chevTex: 'chevronGES' }
```
Les chevrons que le moteur pose à l'extérieur des virages prennent cette texture du catalogue au lieu de `chevron` (jaune et noir). Elle reçoit le même réglage (0 ou 1 : le sens). Barrage s'en sert pour des chevrons rouges sur fond blanc, ceux de la signalisation soviétique. Sans l'option, rien ne change.

## 12. Portions sans panneaux de virage : `th.chevSauf`

```js
th: { chev: 1, chevSauf: [[27, 33]] }   // pas de chevrons entre les points 27 et 33 du tracé
```
Le moteur pose un chevron tous les 12 m dès que le rayon passe sous 167 m. Entre les points donnés, il n'en pose pas : pour un passage où le décor guide déjà (sur barrage, la salle des turbines et ses garde-corps orange). Sans l'option, rien ne change.

`th.chevK` règle le seuil de courbure à partir duquel un chevron est posé (0,006 par défaut, soit un rayon de 167 m). Sur barrage, `chevK: 0.02` ne garde les panneaux que dans les virages de moins de 50 m de rayon.

## 13. Options ajoutées pour chapada (Manuscrit 512)

Toutes absentes par défaut : sans elles, le code suit le même chemin qu'avant.

```js
th: { depart: [accent, ossature, texte, 'departJungle'],   // 4e valeur : nom d'une autre forme de portique de départ (mêmes zones que « depart »)
      gloss: 0.02,                                          // brillance de la chaussée (0,08 par défaut, 0,2 sous la pluie) : moins de reflet du soleil
      cones: 0,                                             // ni cônes ni poubelles à l'entrée des virages
      brume: [[1, 4, 0.62], [29, 34, 0.68]],                // (3 valeurs : autre forme que le banc du §10) entre ces points de contrôle, portée du brouillard × k, fondue sur 120 m
      tun: { gloss: 0.05,                                   // brillance du sol du tunnel (0,3 par défaut)
             tex: ['rocheGrotte', 'rocheGrotte'] },         // textures des parois et de la voûte du tunnel, à la place de « paroi » et « plafond » (elles reçoivent les mêmes arguments, libres de les ignorer)
      feuilles: [[0.6, 0.4, 0.12], [0.4, 0.24, 0.1]] }      // teintes des feuilles mortes que chaque voiture soulève derrière elle hors de l'eau et du tunnel (petits carrés nets, 260 au plus, une passe de dessin).
                                                            // Demande th.poussiere (c'est dans sa boucle par voiture) ; sur une carte sans surface à poussière, th.poussiere ne fait qu'allumer la gerbe d'eau des zones mouillées
```


## 14. Phase « vie » : ce que chapada a demandé au moteur

Trois retouches, toutes sans effet sur une carte qui ne s'en sert pas.

```js
th: { embruns: [[32, 33, 0.9], [49, 52, 0.5]] }   // entre ces points du tracé, des gouttes se posent sur l'objectif, comme sous une pluie de cette force (les embruns d'une chute, d'une rivière)
const l = h.lum(i, x, y, z, couleur, portée, force);  // h.lum rend maintenant son luminaire : le tick d'un décor peut faire respirer sa couleur (l.c, une THREE.Color) ; avant, il rendait un nombre que personne ne lisait
```
- **`th.embruns`** réutilise les gouttes d'objectif de la pluie (`gt`, passe finale) : mêmes gouttes, même chasse par le vent de la course. Fondu de 60 m à l'entrée et à la sortie de la zone. Absent : rien.
- **`h.lum` rend le luminaire.** Le moteur relit `l.c` à chaque image : un feu de camp ou un brasero peut vaciller avec sa flamme. Ne pas changer `l.x`, `l.y`, `l.z` : le tri par distance est fait sur ces valeurs.
- **Réception d'un saut dans l'eau.** `c.eauT` (temps passé dans l'eau, décor seulement) repart de zéro quand la voiture est en l'air : à la réception dans une zone noyée, la gerbe refait son coup d'étrave. Avant, seule la première entrée dans l'eau le donnait. Concerne toute carte qui a un saut dans une zone `mouille` pleine (chapada : les deux seuils de la rivière).

Piège relevé au passage : **un `InstancedMesh` immobile est fondu dans le décor fixe** (une copie de chaque exemplaire reste à sa place de repos). Un lot dont on bouge les exemplaires par `setMatrixAt` doit porter `userData.dyn = 1`.
