# Manuscrit 512 (`chapada`) : regard neuf et modifications proposées

Écrit par une session qui n'a pas construit la carte, à partir de captures du rendu réel (540 lignes, HUD compris), d'un tour de `touge` capturé de la même façon, et de la lecture du code. Rien n'a été jugé sur une note.
Chaque modification se valide ou se refuse seule. Une seule est déjà faite, en prototype, dans un commit à part : l'eau de la grande chute (modification 1).

## Mesures (15 novembre, machine chargée par d'autres sessions)

`PORT=8103 node outils/banc-rapide.js chapada touge`, 540 lignes, deux passages par carte :

| | chapada | touge | charge machine |
|---|---|---|---|
| carte actuelle (`48d5750`) | 3,27 puis 3,11 ms, 234 à 239 passes | 2,78 puis 2,84 ms, 233 à 249 passes | 32 à 37 % |
| avec le prototype de chute | 3,30 puis 3,29 ms, 236 à 263 passes | 2,89 puis 2,91 ms | 27 à 31 % |

Le budget est de 2 ms : les deux cartes sont en échec au banc dans ces conditions, `touge` comprise, donc la machine pèse lourd dans ces chiffres. Ce qui se lit : `chapada` coûte environ 12 % de plus que `touge`, et le prototype de chute ne se distingue pas du bruit (moins de 0,1 ms, deux passes de plus). Pires images de `chapada` : échantillons 114, 431 et 1781 (marais, lacets, camp). À remesurer machine au repos avant de conclure sur le budget.
`node test.js` et `node test-cartes.js` : verts, avec le prototype.

## Constat, zone par zone

Le tour complet : [0](img-chapada/oeil-tour-0.jpg), [1](img-chapada/oeil-tour-1.jpg), [2](img-chapada/oeil-tour-2.jpg), [3](img-chapada/oeil-tour-3.jpg), [4](img-chapada/oeil-tour-4.jpg). Vues rapprochées : [marais, pont](img-chapada/oeil-pres-0.jpg), [grotte, entrée de la rivière](img-chapada/oeil-pres-1.jpg), [rivière, cité, gué](img-chapada/oeil-pres-2.jpg). `touge` : [début](img-chapada/oeil-touge-0.jpg), [lacets](img-chapada/oeil-touge-1.jpg). Le numéro jaune en haut de chaque vignette est l'échantillon de piste.

| Zone | Ce que je vois | Verdict |
|---|---|---|
| Camp (éch. 1785 à 52) | Portique, tentes, lanternes ; la lumière dorée sur les dalles pose l'ambiance dès la première seconde. | Réussi, ne pas toucher. |
| Marais (111 à 263) | Les arbres sur racines-échasses sont la meilleure silhouette de la carte. L'eau est une plaque sombre immobile ; la chaussée noyée se lit comme une route plus foncée ; **aucune gerbe** quand la voiture y roule. | Arbres à garder. Eau à reprendre (4, 5). |
| Chicane du fromager (326 à 442) | Le fromager ne se détache pas : même tronc, même vert que le reste. | Passable. |
| Lacets (442 à 764) | Trente secondes d'un même couloir : dalles grises, troncs bruns, cubes verts. Les vignettes 326, 383, 550, 651, 702 sont interchangeables. La tête colossale (506) est bien, mais sur le côté et vue une seconde. Là où `touge` ouvre ses épingles sur la ville au loin, ici aucune vue ne sort de la forêt. | Le point faible hors des trois demandes (9, 10). |
| Pont de lianes (790 à 882) | Le meilleur moment du tour : le ciel s'ouvre, la gorge, le portail doré du temple au bout de l'axe. La grande chute, elle, est dans le coin gauche, **derrière le chronomètre**, et son pied est caché par le garde-corps. | Pont à garder tel quel. Chute mal placée (2). |
| Temple-grotte (905 à 1001) | Le portail est beau. Dedans, c'est le tunnel du moteur : parois brunes lisses, voûte quadrillée. Le rideau d'eau se réduit à des traits blancs sur le linteau. | Portail à garder. Intérieur générique (11). |
| Descente des idoles (1074 à 1236) | L'idole dorée au bout de la ligne droite (1161) est le seul repère de la carte placé dans l'axe et vu longtemps : c'est le modèle à suivre. Le reste est le couloir des lacets. | Idole à garder. |
| Rivière sur la route (1256 à 1366) | Une feuille vert d'eau posée sur la chaussée, dont on voit les dalles à travers. Elle s'étale à plat sous les arbres des deux côtés : on lit une forêt inondée, pas une rivière. La pente (4 à 5 %, régulière) ne se voit pas : l'horizon de l'eau est une ligne droite. Pas de gerbe, pas de courant, pas de rives. | À refaire (4, 6, 7, 8). |
| Cité perdue (1415 à 1525) | L'arc et les piliers au bord de la route fonctionnent. Le temple à degrés, le but de l'expédition, est une petite forme derrière des arbres (1472). La place est un dallage plat de la couleur de la route. | Arc à garder. Temple trop discret (12). |
| Gué (1570 à 1600) | Une bande turquoise mince, lisible de loin, jolie couleur ; immobile et sans gerbe. | Couleur à garder (3, 4). |

Deux constats d'ensemble, par rapport à `touge` :
- **Le bord de la route ne se lit pas.** `touge` a sa ligne blanche, ses glissières qui renvoient les phares, ses chevrons : on voit le virage 100 m avant. Ici la dalle grise passe au sous-bois sombre sans limite, et un virage ne s'annonce que par le bandeau du HUD. Les cônes, les murs et les chevrons ont été retirés à la demande de l'auteur ; rien ne les a remplacés (9).
- **La voiture est la R34 de `ville` peinte en jaune** : sans `type` dans `look`, `game.js` prend le modèle `gtr` (Skyline, quatre feux ronds, grand aileron). Dans une jungle brésilienne, c'est le détail le plus hors sujet à l'écran, et il y est en permanence (13, 14).

Hors périmètre, pour mémoire : le pavé orange translucide vu sur la route dans le dernier tiers du tour (1525 à 1739) est le fantôme du moteur (`ghostM`, `game.js:815`), pas un objet de la carte.

## L'eau : technique retenue

Ce que propose three.js (version du dépôt : r187, seul le cœur est dans `three/`, pas les exemples) :
- `Water` et `Water2` des exemples (`examples/jsm/objects/Water.js`, `Water2.js`, démos `webgl_shaders_ocean` et `webgl_water`). `Water2` rend la scène deux fois de plus par image (un `Reflector` et un `Refractor`) et mélange deux cartes de normales qui défilent le long d'une direction de courant, décalées d'un demi-cycle. **Écarté tel quel** : deux rendus de scène doubleraient un temps d'image déjà au-dessus du budget, et des reflets fins n'ont pas de sens à 540 lignes en gros pixels.
- Ce que j'en garde : **le principe des deux couches qui défilent à des vitesses différentes dans le sens du courant**. C'est lui qui fait « de l'eau » ; une seule couche qui glisse fait un tapis roulant.
- Le moyen : `Texture.offset` avec `wrapS = wrapT = RepeatWrapping` (documentation : [Texture](https://threejs.org/docs/pages/Texture.html), « how much a single repetition of the texture is offset from the beginning ») ; la matrice de la texture se recalcule seule (`matrixAutoUpdate`), rien n'est renvoyé à la carte graphique. Le moteur fait déjà exactement cela pour les écrans des portiques (`game.js:811`, `m.map.offset.x += dt * …`).
- Où cela se branche : une fonction de décor peut renvoyer un `tick(dt)` (`decors.js:9`, appelé `game.js:812`). `chapada` n'en renvoyait pas. **Aucun changement dans `game.js` ni `sim.js`.**
- La forme : des nappes courbes (une bande de triangles qui suit la trajectoire de l'eau, `v` le long du courant) à la place des boîtes ; des textures dessinées pour boucler, avec des trouées transparentes ; écume en texture qui s'écarte du point de chute.
- La gerbe : le moteur en a une (`gerbe`, `game.js:722`, faite pour le gué de la carte `terre`), mais elle n'est lancée que si la carte déclare `th.poussiere` (`game.js:713` et `787`). `chapada` ne le déclare pas : voilà pourquoi la voiture traverse 15 cm d'eau sans une goutte.

Coût par surface d'eau : une passe de dessin par couche, aucun calcul par sommet, une addition par texture et par image.

## Modifications proposées

### Eau

**1. Grande chute en nappes qui coulent — fait, en prototype (commit à part).**
Les cinq boîtes sont remplacées par deux nappes courbes superposées (la lame se décolle de la lèvre, s'élargit, rebondit sur le ressaut, s'étale jusqu'au bassin), deux filets latéraux, et une couronne d'écume qui s'écarte sur le bassin. La couche de devant est plus trouée et tombe plus vite que celle de derrière.
À l'écran : [avant à gauche, après à droite](img-chapada/oeil-chute-avant-apres.jpg) ; [six images de suite](img-chapada/oeil-chute-proto.jpg) ; [en mouvement](img-chapada/oeil-chute-proto.gif) (la caméra avance, les mèches changent d'une image à l'autre). À voir en vrai : `http://127.0.0.1:8103/index.html?auto&carte=chapada`, sur le pont, à gauche.
Coût : 3 matières (3 passes, les boîtes en prenaient 2), dans le bruit du banc. Code : `decors.js` (fonction `chapada`), `textures-chapada.js` (`eauChute`, `ecumeBassin`). Rien de partagé.
Limite du prototype : il est à l'emplacement actuel de la chute, donc toujours dans le coin de l'écran (voir 2) ; teinte encore un peu grise, à éclaircir à la validation.

**2. La chute au-dessus du portail : on entre dans la grotte en traversant la chute.**
La grande chute quitte le flanc gauche de la gorge et tombe de la falaise au-dessus du portail du temple, dans l'axe du pont. Elle se partage sur le linteau : deux nappes épaisses de part et d'autre, un voile mince et troué devant l'ouverture, que la voiture traverse (gerbe à l'impact, voir 4). Le bassin est au pied du portail et se déverse sous le pont. L'ancienne chute et son cirque deviennent une paroi nue avec un filet d'eau.
À l'écran : la chute est au centre de l'image pendant les 150 m du pont (quatre secondes) au lieu d'une seconde dans un coin, et le portail doré brille derrière l'eau. C'est l'image d'aventure qui manque à la carte.
Coût : aucune passe de plus (mêmes matières que 1). Si la falaise au-dessus du portail fait moins de 40 m, elle est rehaussée localement dans `chapada`. Rien de partagé. Remplace le rideau actuel de la grotte.

**3. Toute l'eau courante coule : rivière, ressauts, gué.**
Le ruban de la rivière reçoit deux couches de `eauJade` qui défilent vers l'aval (0,5 et 0,8 répétition par seconde, la seconde à 60 % d'opacité, décalée en travers). Les blocs blancs des ressauts deviennent des nappes d'écume qui tombent, comme en 1. Au gué, le courant traverse la route de droite à gauche.
À l'écran : l'eau bouge partout où on la voit, dans le bon sens ; au gué on voit la rivière passer devant soi.
Coût : 2 passes de plus (la seconde couche de la rivière, l'écume animée). Rien de partagé.

**4. La gerbe quand on roule dans l'eau.**
`poussiere: [0.5, 0.56, 0.42]` dans le thème de `chapada`. Les surfaces de la carte (`sec`, `mouille`) ne lèvent jamais de poussière (`roul` nul) : la seule conséquence est d'allumer la gerbe d'eau du moteur dans les trois passages noyés (marais, rivière, gué), pour le joueur et les rivaux, avec le coup d'étrave à l'entrée.
À l'écran : deux éventails d'eau derrière les roues avant, écume au ras de l'eau. C'est ce qui fait croire qu'il y a de l'eau sous la voiture.
Coût : 4 nuages de points de plus (4 passes), actifs seulement dans l'eau. Une ligne dans `cartes.js`, rien de partagé.

**5. Marais : une eau immobile mais vivante.**
Deux couches de `eauMarais` qui dérivent très lentement en sens croisés (0,02 répétition par seconde) : les taches de ciel glissent, rien ne « coule ». Sur le passage noyé, la chaussée disparaît vraiment sous l'eau (nappe à 92 % d'opacité au lieu de 75 %), seules les bornes la jalonnent.
À l'écran : le passage noyé se lit comme de l'eau et non comme une route sombre ; au ralenti du départ lancé, la surface vit.
Coût : 1 passe de plus. Rien de partagé.

### Descente de la rivière (points 49 à 52)

**6. Un profil en marches : trois biefs, trois rapides.**
Aujourd'hui la route perd 12 m en 270 m d'une pente égale, que l'œil ne voit pas. Je la remplace par trois biefs presque plats (1 %) séparés par trois seuils de 1,6 m sur 14 m (11 %), plus le bas de la descente. À chaque seuil, la route disparaît derrière l'arête, on voit le bief suivant en contrebas, la voiture plonge du nez.
À l'écran : l'horizon de l'eau se casse trois fois ; on descend un escalier d'eau au lieu de rouler sur une plaque.
Coût : aucun en temps d'image. Six points de contrôle ajoutés entre 49 et 52 dans `cartes.js` : la trace or est à refaire (`node outils/traces-or.js chapada`), les records du circuit ne sont plus comparables, les numéros de points de contrôle suivants se décalent (à reporter dans `cartes.js` et `decors.js`). `sim.js` n'est pas touché. Risque : à plus de 150 km/h la voiture peut décoller d'un seuil ; hauteur des seuils réglée pour que le pilote automatique reste au sol, vérifiée par `test-cartes.js`.

**7. Un lit de rivière : des rives, une arrivée, une sortie.**
- Rives : des deux côtés, à 2 m de la chaussée, un talus de roche moussue de 1,5 à 3 m, et la forêt reculée de 6 m derrière ; l'eau ne s'étale plus sous les arbres.
- Arrivée : au saut du point 49, la rivière tombe de la gauche par un ressaut de 4 m, dans l'axe de la réception. On saute dans la rivière (gerbe forte à l'atterrissage, avec 4).
- Sortie : avant l'arc triple, la rivière quitte la route par la droite et tombe dans le bief de la cité ; la chaussée ressort sèche.
À l'écran : on comprend d'où vient l'eau et où elle va ; on roule dans un couloir de roche et d'eau, plus dans un sous-bois mouillé.
Coût : environ 60 rochers instanciés (une passe, la matière existe), une nappe de chute de plus (matière de 1). Rien de partagé.

**8. Un courant qu'on voit : eau vive, sillages, écume aux seuils.**
Demande la 3. Sur la route, l'eau devient opaque à 92 % et plus sombre au milieu : on ne voit plus les dalles au travers, sauf sur un mètre le long des rives. Elle file vers l'aval à 9 m/s, mèches claires étirées. Chaque borne et chaque rocher traîne un sillage d'écume en V pointé vers l'aval ; chaque seuil de la 6 est une barre d'eau blanche qui tombe.
À l'écran : l'eau a un sens, le même que la voiture ; les sillages donnent la vitesse du courant, les barres blanches annoncent les seuils.
Coût : 1 passe (les sillages, instanciés). Rien de partagé.

### Forêt et lisibilité

**9. Une bordure de pierre claire le long de la route, torches à l'extérieur des virages.**
Un rang de pierres claires de 40 cm de large, au ras du sol (aucun mur, aucun contact), des deux côtés, sur tout le tour hors pont et passages noyés ; par endroits manquant, mangé de mousse. Les torches existantes sont regroupées par trois à l'extérieur de chaque virage serré (les deux épingles, les deux équerres, la chicane) et retirées des lignes droites.
À l'écran : la route se dessine jusqu'au fond de l'image, comme la ligne blanche de `touge` ; un virage s'annonce par trois flammes.
Coût : 1 passe (un ruban), aucune torche de plus. Rien de partagé.

**10. Deux trouées dans les lacets.**
À chaque épingle, la forêt est abattue sur 40 m à l'extérieur du virage : à la première (tête colossale), la tête passe dans l'axe de l'approche, à la place qu'occupe l'idole dorée plus loin ; à la seconde, la vue s'ouvre sur la vallée en contrebas, la brume, le panache de la chute et la silhouette du temple à degrés.
À l'écran : les lacets cessent d'être un couloir ; on voit deux fois où l'on va, comme les épingles de `touge` donnent sur la ville.
Coût : négatif (moins d'arbres). Rien de partagé.

**11. La grotte en roche.**
Parois et voûte du tunnel prennent une texture de roche humide à la place du revêtement et du quadrillage du moteur ; le rideau d'eau y ruisselle (deux nappes de 1 le long des parois sur les 20 premiers mètres).
À l'écran : on est dans une grotte et non dans un tunnel routier brun.
Coût : aucune passe de plus. **Code partagé** : une option `th.tun.tex: [paroi, plafond]` dans `game.js` (une ligne, vers la ligne 495), absente par défaut, sans effet sur les onze autres cartes ; décrite dans `docs/MOTEUR-OPTIONS-CARTES.md`.

**12. Le temple à degrés à l'échelle du titre.**
Le temple est agrandi de 1,8 fois, les trois arbres plantés devant lui retirés, et un couloir de vue ouvert depuis la ligne droite des points 57 à 58, qui pointe déjà sur lui. La place reçoit trois marches et un bassin que la rivière alimente.
À l'écran : en sortant de l'arc triple, on voit la cité perdue ; aujourd'hui on voit des arbres.
Coût : aucune passe de plus. Rien de partagé.

### Voiture

**13. L'Onça : un modèle à elle.**
Nouveau modèle `onca` dans `formes-voitures.js`, sur le gabarit des cinq autres : un petit coupé brésilien en fibre des années 70 (dans l'esprit des Puma GTB et SP2), 4 m de long, long capot plongeant, deux phares ronds en retrait, pavillon fuyant jusqu'à une poupe tronquée, becquet moulé dans la malle, deux feux ronds de chaque côté. Tenue d'expédition : deux longue-portée ronds sur le bouclier, bavettes, roue de secours sanglée sur le hayon. `type: 'onca'` dans `look`.
À l'écran : de dos, une silhouette basse et large à poupe coupée avec la roue de secours, au lieu de la malle haute et de l'aileron de la Skyline.
Coût : aucun en temps d'image (même nombre de pièces). **Fichiers partagés** `formes-voitures.js` (une entrée de plus dans `MODELES`) et `textures-voitures.js` (une ligne de calandre) : ajouts seuls, les cinq autres modèles ne changent pas.

**14. L'Onça : une livrée de jaguar.**
Ocre jaune gardé (`0xe9b44c`). Rosettes noires de jaguar sur l'arrière des flancs et le pavillon, qui s'espacent et disparaissent vers l'avant ; capot noir mat ; numéro 512 dans un rond blanc sur les portes ; bas de caisse éclaboussé de boue. Les bandes noires de la Skyline disparaissent. Les rivaux portent le même dessin dans leur teinte.
À l'écran : une voiture qu'on reconnaît à cette carte, et dont le nom se comprend.
Coût : aucun. Une branche `K === 'onca'` dans la livrée de `textures-voitures.js` (fichier partagé, ajout seul). Demande la 13.

### Feuilles

**15. Les feuilles soulevées au passage.**
Sous la canopée (hors pont, grotte, place et passages noyés), chaque voiture au-dessus de 30 km/h soulève derrière elle des feuilles mortes : gros points ocre, rouille et vert olive, qui montent en tournoyant puis retombent lentement ; davantage en glisse. La texture de la chaussée reçoit des feuilles éparses pour qu'elles viennent de quelque part.
À l'écran : un sillage de feuilles derrière soi et derrière les rivaux ; la forêt réagit au passage, ce que les cônes faisaient mal.
Coût : 1 nuage de points (1 passe, 480 points au plus). **Code partagé** : une option `th.feuilles: [couleurs]` dans `game.js`, trois lignes à côté de la poussière (ligne 787), qui réutilise l'émetteur `flou`/`emit` existant ; absente par défaut, sans effet ailleurs ; décrite dans `docs/MOTEUR-OPTIONS-CARTES.md`.

## Réalisé après validation (l'auteur a accepté les quinze points)

Tout est fait, jugé sur captures du rendu réel après chaque passe, corrigé, recapturé. Tour complet : [0](img-chapada/fait-tour-0.jpg), [1](img-chapada/fait-tour-1.jpg), [2](img-chapada/fait-tour-2.jpg), [3](img-chapada/fait-tour-3.jpg), [4](img-chapada/fait-tour-4.jpg). [Pont, grande chute du portail, voile, rivière](img-chapada/fait-chute-portail-riviere.jpg). [La descente](img-chapada/fait-descente.jpg). [L'Onça](img-chapada/fait-onca.jpg).

| N° | Fait | Écart avec la proposition |
|---|---|---|
| 1 | Chute du cirque en nappes qui coulent | gardée à sa place : c'est la source de la rivière |
| 2 | Grande chute sur toute la falaise au-dessus du portail, deux bassins, voile troué devant l'ouverture ; falaise rehaussée à 44 m, parvis dégagé | la chute du cirque n'a pas été supprimée (voir 1) |
| 3 | Rivière, ressauts et gué coulent vers l'aval | une seule couche sur la rivière vue de loin (la seconde ne s'y voyait pas), deux sur la route et au gué |
| 4 | Gerbe dans les trois passages noyés | — |
| 5 | Marais : deux nappes qui dérivent en sens croisés, 85 % d'opacité | — |
| 6 | Deux seuils de 1 m aux points 50 et 51, en plus du saut du point 49 | **sans ajouter de point de contrôle** : les seuils sont des `sauts` (un tremplin qui compense la pente puis tombe net). Aucun numéro de point ne bouge. Seuils de 1 m et non 1,6 m, et lit élargi à 11 m de demi-largeur : avec 6,5 m le pilote automatique touchait le bord en retombant |
| 7 | Rives de roche des deux côtés, forêt reculée, terrain abaissé sous le lit | pas de cascade d'arrivée au saut : la rivière n'a que 1,6 m de dénivelé disponible à cet endroit ; elle rejoint la route par la droite, à niveau |
| 8 | Eau vive presque opaque sur la route, 2,2 fois plus rapide, sillages derrière les bornes, eau blanche sur l'arête et au pied des seuils, à la réception du saut | — |
| 9 | Bordure de pierre claire continue ; trois torches à l'extérieur des deux épingles et des deux équerres | les torches des lignes droites sont restées (elles annoncent les freinages) |
| 10 | Seconde épingle ouverte sur la vallée ; la tête colossale était déjà dans l'axe de la première | — |
| 11 | Parois et voûte en roche (`rocheGrotte`) | pas de nappes d'eau le long des parois |
| 12 | Temple à degrés agrandi 1,8 fois, couloir de vue ouvert | pas de marches ni de bassin sur la place |
| 13 | Modèle `onca` : coupé à poupe tronquée, phares ronds, longue-portée, galerie et roue de secours sur le toit, bavettes | la roue de secours est sur le toit (sur le hayon elle cachait les feux et la plaque) |
| 14 | Robe de jaguar : rosettes sur l'arrière, capot sombre, numéro dans un rond blanc, boue | — |
| 15 | Feuilles soulevées : petits carrés nets qui tournoient et retombent, hors de l'eau et de la grotte | pas de feuilles peintes sur la chaussée |

Code partagé touché, tout absent par défaut : `game.js` (`th.tun.tex`, `th.feuilles`, décrits dans `docs/MOTEUR-OPTIONS-CARTES.md` section 10) ; `formes-voitures.js` et `textures-voitures.js` (modèle et livrée `onca`, ajouts seuls). `sim.js` n'est pas touché. La trace or de `chapada` est refaite (68,2 s, seuil 75,7 s).

Mesures après travaux (`banc-rapide`, 540 lignes, machine chargée à 35–39 %) : chapada 4,07 puis 4,22 ms, 262 à 266 passes ; touge 3,56 puis 3,55 ms. L'écart avec touge passe de +12–15 % à +14–19 % ; les nappes d'eau d'une même matière sont fondues en une géométrie pour tenir ce chiffre. Pilote automatique : tour lancé 79,2 s, aucun contact (comme avant). `node test.js` et `node test-cartes.js` verts.

Auto-critique, ce qui reste en dessous :
- Les seuils se voient moins que je ne voudrais : une ligne blanche sur l'arête, pas une vraie chute d'eau de face (on les voit d'amont, par-dessus).
- Les rochers des rives ont tous la même matière à grandes facettes ; de près ils font camouflage.
- En course, le banc relève un choc entre voitures vers l'échantillon 1421 (sortie de la rivière, avant l'arc) qui n'existait pas : les seuils resserrent le peloton. Le premier bris de verre d'une partie coûte une image longue (compilation des reflets du verre, vrai sur toutes les cartes).
- Le Chrome sans écran de `outils/capture.sh` a calé plusieurs fois sur cette machine ; les captures ont été faites en ouvrant `outils/captures.html` dans le navigateur intégré, ce qui marche à tous les coups.
- Toujours pas joué à la main.

## Ordre conseillé

1 (fait), puis 4 (une ligne, effet immédiat), 2, 3, 6 à 8 ensemble (la descente), 13 et 14 (la voiture), 9 et 10 (la forêt), puis 5, 11, 12, 15.

## Ce que je n'ai pas vérifié

- La carte n'a pas été regardée en continu dans un navigateur : tout est jugé sur des suites d'images du pilote automatique (une image toutes les 0,1 à 3 s).
- Le prototype n'a pas été vu de face ni de près : la caméra d'inspection de l'outil regarde la voiture, pas le décor.
- Les temps d'image ont été pris sur une machine chargée à environ 30 % : les écarts entre cartes tiennent, les valeurs absolues non.
