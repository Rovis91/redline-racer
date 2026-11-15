# Vie — « Route royale » (perse) : analyse et propositions

Étape 2 de `METHODE-VIE.md`. Lecture seule : aucun code modifié. Les cases à cocher sont pour l'auteur.
Sources : `decors.js:1715-2049` (décor de perse), `formes-perse.js`, `cartes.js:454-474`, `cahier-feedback/perse/CAHIER.md`, `docs/REFS-perse-inspiration.md`, et les planches de `captures/plans/perse/` (tour complet, 24 plans de course, 9 vues hautes, 4 vues de côté).

## Repères

**Secteurs.** Ceux du cahier, avec leurs `idx`. Le décor a été refait depuis le cahier : la colonne « dans le code » donne les bornes actuelles, calculées à partir des points de contrôle (± 8 échantillons, voir §6).

| Secteur (cahier) | idx du cahier | Dans le code aujourd'hui |
|---|---|---|
| 1. Départ et plaine | 1179 → 340 | rue de village 1183 → 332 (gauche), → 446 (droite) |
| 2. Virage de sortie de plaine | 340 → 470 | virage 332 → 352, ligne droite et allée des feux 366 → 430, parvis 418 → 438 |
| 3. Grand escalier | 470 → 540 | marches 438 → 537 |
| 4. Porte des Nations, 2ᵉ virage | 540 → 615 | Porte 546, voie de la terrasse 563 → 589 |
| 5. Cent colonnes | 615 → 740 | tapis 593 → 736, perron 747 |
| 6. Jardin, virage avant le bazar | 740 → 880 | jardin 750 → 853, rue avant le portail 854 → 869 |
| 7. Bazar couvert | 880 → 1020 | voûte 871 → 1031 |
| 8. Bazar ouvert, retour | 1020 → 1179 | rue 1034 → 1178 |

**Points de freinage (rien n'y bouge)** : 330–352, 537–585 (Porte et 2ᵉ virage), 738–750 (perron), 838–871 (virage et portail du bazar), les coudes de la voûte (là où `|k| > 0,035`, déjà repérés par la faïence qui luit, `decors.js:2014`), 1031–1075 (sortie de voûte).

**Vent de la carte** : un seul, léger, du couchant vers la montagne (d'ouest en est, vers +x). Fumées, toiles, linge, palmes et poussière penchent tous vers +x.

**État de départ** : aucun `tick` ; `trafic: 0` ; pas de lit sonore (`AMB.perse` n'existe pas, `audio.js:45`) alors que la carte a déjà ses zones d'ambiance (`amb: [[12, 20], [25, 42]]`, `cartes.js:457`).

**Un moment fort par secteur** (marqué ★ dans la grille) :

| 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|
| envol de pigeons sur la chaussée | la caravane du tribut | les feux qui s'allument devant la voiture | colombes du portique | l'écho de la salle, les rais de couchant | toute l'eau en mouvement | le bazar habité | le vol de pigeons au-dessus des toits |

---

## 0. Les trois demandes de l'auteur, en bref

### 0.1 De la vie dans le bazar : trois niveaux de personnages

Constat sur les images : sous la voûte comme dans la rue, les murs sont saturés (boutiques peintes, tapis, faïence) et le volume est vide. Rien n'est à hauteur d'homme. La forme `personnage` (`formes-perse.js:50`, robe teintée par instance) n'est posée nulle part.

| Niveau | Ce qu'on pose | Ce que le joueur perçoit | Brique | Coût |
|---|---|---|---|---|
| **A. Aucun** | Fumées, lanternes qui se balancent, toiles, pigeons, son de foule | Un bazar animé mais désert : le brouhaha sans personne sonne faux | — | nul |
| **B. Silhouettes fixes** | 90 à 120 `personnage` par groupes de 2 ou 3 au pied des façades, robes en 6 teintes ; 6 ânes bâtés attachés aux étals | Des taches de couleur à hauteur d'homme qui défilent : c'est la présence qui se lit à 150 km/h, pas le geste | `insts` avec teinte, comme les étendards (`decors.js:1889`) ; `ane` (`formes-perse.js:97`) | faible, aucune logique |
| **C. Silhouettes animées** | Les mêmes, plus : quelques marcheurs sur une boucle, têtes qui se tournent, bras levés au passage | Un marcheur qui traverse une baie se voit ; un hochement de tête ne se voit pas en roulant | mobile sur boucle (`decors.js:1093`), foule à deux poses (`decors.js:438`) | moyen ; une matrice par instance et par image |

**Recommandation : B partout, et de C seulement les marcheurs.** Soit des silhouettes fixes en nombre dans les secteurs 7 et 8 (et quelques-unes dans la rue de village), plus 6 à 8 marcheurs (porteurs, un ânier) sur les lignes droites de la rue ouverte, et la caravane du secteur 2. Pas d'animation de bras ni de tête : à pleine vitesse elle ne se perçoit pas.

Deux règles pour ne pas le regretter : jamais de personnage sur la bande roulable (une voiture qui traverse un passant, c'est pire que pas de passant) ; jamais percutables.

- [ ] Niveau A  - [ ] Niveau B  - [ ] Niveau C  - [ ] B + marcheurs (recommandé)

### 0.2 Des éléments sur la route

Détail au §2. En bref : la chaussée fait 16 à 26 m de large et elle est nue sur tout le tour. Trois réponses, de la plus sûre à la plus engageante : des décalques et des pigeons posés (décor pur), plus de sortes d'objets percutables par secteur, et deux mobiles (la caravane derrière son muret, et, si l'auteur le veut, une charrette à âne en trafic réel dans la plaine).

### 0.3 Les parties trop chargées et un peu vides

Détail au §3, à faire avant d'animer. Le défaut est le même aux secteurs 4, 7 et 8 : la couleur et le motif sont sur les surfaces, et le volume entre les surfaces est vide. Le jardin a le défaut inverse au bord de la route (deux rangées de blocs de fleurs saturés sur 200 m). Le départ empile deux grammaires (modules du bazar et îlots du village) sur la ligne.

---

## 1. La grille : secteurs × familles

Priorités : **I** indispensable, **B** bien, **b** bonus. ★ : moment fort du secteur. « Socle n » renvoie aux briques à construire de `METHODE-VIE.md`.

### Secteur 1 — Départ et plaine (rue de village)

| | Id | Idée, et ce que le joueur perçoit | idx | Brique | Pr. |
|---|---|---|---|---|---|
| Eau | 1-E1 | La rigole de droite coule. À cette vitesse c'est un liseré qui scintille, pas un courant : gratuit, car c'est la même matière que le canal du jardin | 1183 → 446 | `coule`, `decors.js:2580` et tick `2818` ; matière `eau`, `decors.js:1734` | b |
| Lumière | — | Rien : les fenêtres allumées et le couchant suffisent | | | |
| Mouvement | 1-M1 | Trois ou quatre fumées de four au-dessus des toits, penchées par le vent : des colonnes claires dans l'axe de la rue, qui donnent la profondeur et le sens du vent | 60, 140, 220, 300 | `h.vapeur`, `game.js:605` | B |
| | 1-M2 | Les tapis rouges à cheval sur les murs de jardin battent au vent (un pan qui se soulève) | tous les 34 m, 40 → 330 | lot `tapisM`, `decors.js:1849-1856` ; échelle et rotation par instance comme les flammes, `decors.js:441-442` | B |
| Vivant | 1-V1 ★ | Des pigeons posés au milieu de la chaussée, qui s'envolent devant le capot | 150 et 260 (pleine ligne droite) | pigeons de paris, `decors.js:1542-1561` ; forme `pigeon`, `formes-paris.js:103` | I |
| | 1-V2 | Silhouettes fixes sur les pas de porte, un âne attaché près d'un étal sur deux | 40 → 330 | `personnage`, `ane` (`formes-perse.js:50, 97`) ; teinte par instance, `decors.js:1889` | B |
| Son | 1-S1 | Lit « village au couchant » : vent léger, oiseaux du soir ; au hasard, un chien lointain, un bêlement, le froissement d'ailes de 1-V1 | 1183 → 340 | `AMB`, `ambEvent` (`audio.js:45, 513`) ; zone à ajouter à `amb`, `cartes.js:457` | B |
| Interactif | 1-I1 | Ballots de paille percutables qui éclatent en brins (voir §2) | entrées de virage, 60 → 330 | `th.objets`, `cartes.js:470`, `game.js:1050` ; socle 6 pour les brins | B |

### Secteur 2 — Virage de sortie de plaine, allée des feux, parvis

| | Id | Idée, et ce que le joueur perçoit | idx | Brique | Pr. |
|---|---|---|---|---|---|
| Eau | — | Rien de propre (la rigole de l'escalier commence au parvis, voir 3-E1) | | | |
| Lumière | 2-L1 | Les braises deviennent des flammes : chaque feu tremble, à son rythme. Ici ce sont les quatorze autels de 5 m de l'allée | 366 → 430 | lot `flammes`, `decors.js:1873, 1938` (« la flamme viendra avec la vie ») ; flammes instanciées, `decors.js:369, 441-442` | I |
| Mouvement | 2-M1 | Un filet de fumée au-dessus de chaque autel, couché par le vent | 366 → 430 | socle 6 (`flou` ouvert aux décors) ; `h.vapeur` est trop gros pour un filet | b |
| Vivant | 2-V1 ★ | **La caravane du tribut** : 5 chameaux, 1 âne, 3 personnages en file, qui marchent vers l'escalier derrière le muret de gauche. Les chameaux dépassent le muret de 2,5 m et tanguent. On la double à chaque tour | 360 → 430, à gauche, 3 m derrière le bord | mobile le long de la piste, `decors.js:1539-1541` ; `soude`, `decors.js:30` ; `chameau`, `ane`, `personnage` (`formes-perse.js:93, 97, 50`) | I |
| Son | 2-S1 | Grelots et cloches de la caravane, plus forts en la longeant | 360 → 430 | source placée, sur le modèle de `voixLoin`, `audio.js:688` (socle 1) ; les grelots de givre existent déjà dans `ambEvent` | B |
| Interactif | — | Rien de plus : les jarres du virage existent, c'est un point de freinage | 330 → 352 | | |

La caravane a une raison d'être là : les reliefs de l'Apadana montrent les délégations qui apportent le tribut, chameaux compris. Elle va où va le joueur.

### Secteur 3 — Grand escalier

| | Id | Idée, et ce que le joueur perçoit | idx | Brique | Pr. |
|---|---|---|---|---|---|
| Eau | 3-E1 | L'eau dévale la rigole de l'escalier, à contresens de la voiture : un ruban turquoise qui file à droite | 418 → 589 | `coule` ; **matière d'eau à part** (clone de la texture), sinon elle remonte la pente (§5) | B |
| Lumière | 3-L1 ★ | **Les feux s'allument en cascade** : chaque autel du parapet s'embrase 40 m devant la voiture, l'un après l'autre, des deux côtés, et reste allumé jusqu'au tour suivant. Au dernier tour, tous brûlent haut dès le pied des marches | 442 → 519 (16 autels) | déclenché à l'approche, `decors.js:1551-1561` ; réaction à la course et dernier tour, `decors.js:419-453` ; même lot `flammes` que 2-L1 | I |
| Mouvement | — | Rien, et c'est voulu : l'étendard achéménide est un panneau rigide (`REFS-perse-inspiration.md` §2.1). Il ne flotte pas | | | |
| Vivant | 3-V1 | Un rapace qui plane en grand cercle au-dessus de la pente, à gauche | centre vers 480, 60 m au-dessus | boucle, `decors.js:1093` ; forme `pigeon` agrandie, ou une forme à écrire | B |
| | 3-V2 | Deux gardes immobiles de chaque côté du parvis (robe bleue, robe rouge) | 425 | `personnage` | b |
| Son | 3-S1 | Le vent prend de la hauteur pendant la montée | 438 → 537 | lit par zone (socle 1) | b |
| Interactif | — | Rien (`sansObjets: [[530, 610]]` le dit déjà) | | | |

L'allumage s'arrête à 519 : après, on freine pour la Porte.

### Secteur 4 — Porte des Nations et deuxième virage

| | Id | Idée, et ce que le joueur perçoit | idx | Brique | Pr. |
|---|---|---|---|---|---|
| Eau | — | La rigole traverse la terrasse : couverte par 3-E1 | 537 → 589 | | |
| Lumière | — | Rien : les quatre braseros de la voie (572, 584) sont dans le freinage. Ils restent des braises fixes, à exclure du tremblement du lot | | | |
| Mouvement | 4-M1 | De la poussière dorée qui traverse le dallage au ras du sol, dans le vent. Elle occupe le grand vide dallé sans y poser d'objet | 585 → 615, à gauche | points qui dérivent, `decors.js:2758-2762` couché à l'horizontale ; ou socle 6 | B |
| Vivant | 4-V1 ★ | Des colombes s'envolent de la poutre du portique, vers le couchant, une fois la corde passée | 590 → 610, à gauche | pigeons de paris, `decors.js:1542-1561` | B |
| Son | 4-S1 | Le passage sous la Porte : un souffle bref, réverbéré, quand on traverse la baie de 30 m | 540 → 552 | réverbération de tunnel, `audio.js:741`, rendue réglable par lieu (socle 1) | B |
| Interactif | — | Rien : zone de freinage | | | |

### Secteur 5 — Salle aux cent colonnes

La salle doit rester lisible : on y slalome entre des piles qu'on percute. Rien ne bouge près de la trajectoire.

| | Id | Idée, et ce que le joueur perçoit | idx | Brique | Pr. |
|---|---|---|---|---|---|
| Eau | — | Rien (voulu : `REFS-perse-inspiration.md`, fil n° 1) | | | |
| Lumière | 5-L1 ★ | Des rais de couchant entre les files de colonnes du côté ouest, avec une poussière lente dedans. Fixes, hors de la ligne de course | 640 → 720, files extérieures | forme `rai` jamais posée, `formes-perse.js:119` ; matière additive, `decors.js:315` | B |
| Mouvement | — | Rien | | | |
| Vivant | — | Rien | | | |
| Son | 5-S1 ★ | **L'écho de la salle** : une réverbération longue de halle sous le toit de cèdre, et le battement des colonnes qui défilent. C'est le son qui fait le moment fort ici, puisque l'image doit rester calme | 620 → 740 | `ESP` par carte, `audio.js:596` ; à rendre réglable par lieu (socle 1, « halle ») | I |
| Interactif | 5-I1 | Un nuage de poussière de pierre quand on touche une colonne | les 15 piles, `cartes.js:458` | socle 6 ; demande un appel depuis le choc dans `game.js` | b |

### Secteur 6 — Jardin et virage avant le bazar

| | Id | Idée, et ce que le joueur perçoit | idx | Brique | Pr. |
|---|---|---|---|---|---|
| Eau | 6-E1 ★ | Le canal de droite coule et scintille au couchant (deux couches) | 750 → 853 | `coule`, `decors.js:2580` ; ruban du canal, `decors.js:1981` | I |
| | 6-E2 ★ | Les cascades tombent : des stries blanches qui descendent chaque mur de gradin, un bouillon au pied | une tous les 28 m, à gauche | nappe `chute`, `decors.js:1947, 1971` : c'est un aplat sans texture, il lui faut une texture rayée à faire défiler (celles de chapada) | I |
| | 6-E3 | Les jets montent et retombent, déphasés | 750 → 853 | lot `jet`, `decors.js:1960, 1965, 1984` ; échelle par instance, `decors.js:441-442` | B |
| | 6-E4 | Un voile d'embruns au pied de la plus grande cascade | vers 800 | `h.vapeur`, `game.js:605` | b |
| Lumière | — | Couverte par le scintillement de 6-E1 | | | |
| Mouvement | 6-M1 | Les palmes se balancent, toutes dans le sens du vent | 750 → 853 | lot `palmes`, `decors.js:1983` ; par instance, ou vent en vertex shader (socle 2) | B |
| | 6-M2 | Des pétales qui traversent la route | 780 → 830 | socle 6 | b |
| Vivant | 6-V1 | Deux petits vols de colombes qui passent d'un gradin à l'autre par-dessus la route | 770 et 815 | boucle, `decors.js:1093` | B |
| Son | 6-S1 | L'eau : un fond d'eau vive, plus fort en passant devant chaque cascade ; chants d'oiseaux. Après l'écho de la salle et avant la clameur du bazar, c'est le secteur calme | 750 → 853 | sources placées (socle 1) ; les oiseaux de paris existent dans `ambEvent` | I |
| Interactif | — | Rien : le canal est derrière le muret, le virage est un point de freinage | | | |

Le moment fort est le saut du perron (747) : on retombe dans le jardin avec toute l'eau en mouvement devant soi. Il ne demande rien de plus que 6-E1 et 6-E2.

### Secteur 7 — Bazar couvert

| | Id | Idée, et ce que le joueur perçoit | idx | Brique | Pr. |
|---|---|---|---|---|---|
| Eau | 7-E1 | La rigole sous la voûte coule (gratuit, même matière) | 871 → 1034 | `coule` ; `decors.js:2042` | b |
| Lumière | 7-L1 | Les lanternes de cuivre se balancent au bout de leur chaîne, en vague le long de la nef. Seulement sur les travées droites | 880 → 1020, hors coudes | lots `lan` et `chaines`, `decors.js:2009, 2020` ; une matrice par instance | B |
| | 7-L2 | Un puits de jour sous chaque lanterneau, avec de la poussière qui danse dedans. Un par lanterneau, sans exception : c'est l'irrégularité que l'auteur avait relevée (cahier G6) | une travée sur trois | `rai`, `formes-perse.js:119` ; panneaux `jour`, `decors.js:1993, 1999` | B |
| Mouvement | 7-M1 | La vapeur d'un samovar devant trois échoppes : un panache blanc sous la brique sombre | 3 points sur les travées droites | `h.vapeur`, `game.js:605` | B |
| Vivant | 7-V1 ★ | **Le bazar habité** : silhouettes fixes par groupes de 2 ou 3 contre les boutiques, derrière la ligne des comptoirs et des sacs | 880 → 1020, une travée sur deux, hors coudes | `personnage`, `formes-perse.js:50` ; teinte par instance | I |
| Son | 7-S1 | Le brouhaha réverbéré sous la voûte, les marteaux des dinandiers, un appel de marchand | 871 → 1031 | lit et événements ; **bloqué aujourd'hui** : l'ambiance est coupée en tunnel, `audio.js:905` (§5) | I |
| Interactif | 7-I1 | Des cônes d'épices percutables qui éclatent en nuage de couleur (safran, sumac) | entrées de coude | décor actuel `cones`, `decors.js:2015, 2024` ; à passer en `th.objets` ; socle 6 | B |
| | 7-I2 | Des cuivres percutables qui sonnent en roulant | entrées de coude | `cuivres`, `decors.js:2015, 2025` ; son à l'impact | b |

### Secteur 8 — Bazar ouvert et retour au départ

| | Id | Idée, et ce que le joueur perçoit | idx | Brique | Pr. |
|---|---|---|---|---|---|
| Eau | 8-E1 | La rigole coule (gratuit) | 1034 → 1183 | `coule` | b |
| Lumière | 8-L1 | La lueur d'un four à pain, avec sa fumée (8-M2) | vers 1100 | `h.lum`, comme `decors.js:2037` | b |
| Mouvement | 8-M1 | Des toiles tendues en travers de la rue qui se gonflent lentement. Celles qui existent sont à la sortie de la voûte (1035 → 1050), point de freinage : elles restent fixes ; on anime les deux groupes à ajouter (§3) | 1090 et 1140 | lot `toiles`, `decors.js:2039-2041` ; échelle par instance | B |
| | 8-M2 | Trois fumées (four, grillade) au-dessus des toits, penchées par le vent | 1080, 1110, 1150 | `h.vapeur`, `game.js:605` | B |
| | 8-M3 | Du linge entre deux toits, qui bat | 2 cordes | lot instancié ; linge à poser d'abord (§3) | b |
| Vivant | 8-V1 ★ | **Un vol de pigeons qui tourne au-dessus des toits**, 25 oiseaux, dans le ciel du couchant. La rue est une longue courbe : on l'a sous les yeux pendant tout le secteur | centre à l'intérieur de la courbe, 1075 → 1170 | boucle, `decors.js:1093` ; `pigeon`, `formes-paris.js:103` | I |
| | 8-V2 | Silhouettes fixes au pied des façades et derrière les étals ; six ânes bâtés attachés | 1075 → 1170 | `personnage`, `ane` | I |
| | 8-V3 | Six à huit marcheurs (porteurs, un ânier) le long des façades | 1075 → 1170 | mobile sur boucle, `decors.js:1093` ; `soude`, `decors.js:30` | B |
| Son | 8-S1 | Lit « rue marchande » à ciel ouvert : brouhaha plus sec, cris de marchands, sabots ; une fois par tour, un appel lointain (voix ou flûte) quand on revient vers la ligne | 1034 → 1179 | `AMB`, `ambEvent` (`audio.js:45, 513`) ; la zone existe déjà (`amb`, points 25 à 42) | I |
| Interactif | 8-I1 | Cageots de grenades percutables : les fruits roulent sur la chaussée | entrées de virage | `th.objets`, `game.js:1050` | B |

---

## 2. Des éléments sur la route

La chaussée fait 16 à 26 m et elle est vide. Trois catégories, à ne pas mélanger.

### 2.1 Décor pur (on ne le percute pas)

| Élément | Où | Remarque |
|---|---|---|
| Pigeons posés sur la chaussée, qui s'envolent (1-V1) | 150, 260 | Le seul élément vraiment *sur* la route qui ne pose aucun problème de choc |
| Décalques au sol : paille et feuilles sous les arbres qui débordent, flaque d'une rigole qui déborde, ombre des toiles | plaine, rue ouverte | Rubans plats comme les joints de la chaussée (`decors.js:1870`). Rien à animer |
| Tapis étalés au sol devant les boutiques | rue ouverte | Existe sous la voûte (`tapSol`, `decors.js:2011`) : à prolonger dehors |
| Silhouettes, ânes attachés, charrettes dételées | pied des façades | Hors de la bande roulable, ou cachés derrière un étal |
| La caravane (2-V1) | 360 → 430 | Derrière le muret de 0,9 m : jamais sur la chaussée |

### 2.2 Percutable (léger, purement visuel)

La carte a déjà deux sortes, jarre et panier (`th.objets`, `cartes.js:470`). Le moteur les pose seul : à l'entrée de 14 virages au plus, trois objets par virage, la seconde sorte une fois sur trois (`game.js:1050-1059`). Ils ne sont pas synchronisés en ligne ; c'est acceptable tant qu'ils ne font que voler.

| Sorte nouvelle | Secteur | Ce qu'elle ajoute |
|---|---|---|
| Ballot de paille | 1 | éclate en brins (socle 6) |
| Cône d'épices | 7 | nuage de couleur (socle 6) |
| Cuivre (plateau, marmite) | 7 | un son métallique |
| Cageot de grenades | 8 | des fruits qui roulent |

Ce que cela demande au moteur : des sortes par tronçon de piste (aujourd'hui les mêmes sur toute la carte) et, pour les éclats et le son, un rappel au moment du choc. Sans ces deux points, on peut déjà porter `th.objets` à trois ou quatre sortes : c'est le plus petit pas.

### 2.3 Mobiles, avec leur chemin

| Mobile | Chemin | Vitesse | Nature |
|---|---|---|---|
| **Caravane du tribut** (2-V1) | 360 → 430, à gauche, 3 m derrière le bord, sens de la course ; elle reboucle hors de vue | 1,2 m/s | décor pur, horloge sur `dt` |
| **Marcheurs du bazar** (8-V3) | une boucle allongée au pied des façades, 1075 → 1170, des deux côtés | 1,3 m/s | décor pur |
| **Vol de pigeons** (8-V1), rapace (3-V1) | cercles dans le ciel | — | décor pur |
| **Charrette à âne** dans la rue de village | 30 → 330, voie de droite | 3 m/s | **trafic réel** : `trafic: 2` et un gabarit lent |

La charrette est la seule qui serait un vrai obstacle. Le trafic du moteur existe, dépend du temps de course et n'agit qu'en solo (`game.js:1841, 1849` ; `sim.js:152`), donc sans risque de désynchronisation. Mais c'est un camion à 25 m/s sur trois voies fixes : il faudrait un gabarit et une vitesse par carte, dans `sim.js`, qui est partagé. C'est aussi un choix de jeu (un obstacle lent dans le seul secteur rapide). À décider par l'auteur ; je ne le recommande pas en premier.

Dans la rue de village il n'y a pas de bas-côté : les façades sont au ras de la chaussée. Un mobile en décor pur y serait traversé par les voitures. C'est pourquoi la caravane est au secteur 2, derrière un muret.

---

## 3. Décor : parties trop chargées, parties vides (à faire avant d'animer)

Méthode : `METHODE-DECOR.md`. Chaque ligne dit ce qu'on retire, déplace ou ajoute.

### Secteur 1 — Départ (1160 → 30)

- **Chargé.** Sur la ligne, deux grammaires se touchent : les modules du bazar (couronnement turquoise en zigzag, marchandises peintes) et les îlots de terre du village, avec un étal, deux arbres qui débordent et le portique. C'est toujours le retour 1.1 du cahier.
- **Retirer** : les étals entre 1160 et 30. **Déplacer** : la fin de la rue du bazar de `R0 + 22` à `R0 + 8` (`decors.js:2032`, `finRue`), pour que le portique se détache sur des murs de terre unis.

### Secteur 1 — Plaine (30 → 330)

- **Chargé.** Le même accent revient tous les 34 m : deux tapis rouges sur chaque mur de jardin, une porte turquoise, un étal rouge ou turquoise. **Retirer** un tapis sur deux (`decors.js:1849, 1851`).
- **Vide.** La rue est fermée d'un bout à l'autre (« le mur ne s'abaisse nulle part », `decors.js:1827`) : aucune échappée, le pays autour ne se voit pas. **Ajouter** deux trouées : un mur éboulé à 1,2 m sur 10 m, vers 110 à gauche et 230 à droite, qui ouvre sur les vergers et les trois buttes (`REFS-perse-inspiration.md`, sélection n° 6).
- **Ajouter** deux variantes d'étal (melons, poteries) : il n'y en a que deux, on les revoit dix fois.

### Secteur 2 (340 → 470)

- Équilibré : platanes, rochers et cyprès à gauche, village puis pierre à droite, feux de 5 m.
- **Ajouter** une halte de nomades à gauche vers 380, à 12 m du bord : la tente noire et un chameau couché (`tente`, `chameau`, `formes-perse.js:56, 93`, jamais posés). Elle donne une origine à la caravane.

### Secteur 3 — Escalier (438 → 537)

- **Chargé.** La frise des Immortels, continue des deux côtés, avec rosettes et feux : tout l'ornement est à 3 m de la voiture.
- **Vide.** Au-delà du parapet de gauche, la pente claire avec quelques cyprès ; à droite, le mur nu de la terrasse sur 200 m. Le retour 3.1 du cahier tient toujours.
- **Ajouter** à gauche : deux bancs de roche et un bouquet serré de cyprès à mi-pente (vers 480), et l'enceinte de brique crue à tours carrées sur la montagne (`REFS-perse-inspiration.md` §2.2). **Ajouter** des étendards : 8 au lieu de 4, un tous les 24 échantillons.

### Secteur 4 — Terrasse (540 → 615)

- **Chargé.** À droite, sur la même ligne : le mur du fond, six taureaux de 13 m, treize colonnes, la poutre.
- **Vide.** Le dallage gris entre la route et les ruines, sur 15 à 25 m (vue haute à 575).
- **Ajouter** dans les angles du dallage, à gauche, entre 565 et 600 : un bassin à margelle et un bouquet d'arbres ; en face des étendards, une rangée de cinq socles à taureau (`REFS-perse-inspiration.md`, sélection n° 13). Rien le long de la voie elle-même.

### Secteur 5 — Salle

- Chargée par nature (colonnes, damier, tapis, plafond). Rien à ajouter.
- **Alléger** : le plafond à caissons est le motif le plus contrasté de l'écran, au-dessus d'un tapis déjà saturé. Baisser son contraste.

### Secteur 6 — Jardin (750 → 853)

- **Chargé.** Les massifs de fleurs : deux rangées de blocs saturés (rose, jaune, rouge, blanc, orange) de chaque côté, sans interruption sur 200 m, au ras de la route, devant un muret à bordure de tapis. C'est la bande la plus criarde de la carte, et elle est collée à la trajectoire.
- **Retirer** la seconde rangée de gauche et un massif sur deux (`decors.js:1958, 1963`). **Regrouper** les couleurs : trois par tronçon de 30 m au lieu des cinq mélangées.
- **Vide.** À droite, au-delà du canal : une bande d'herbe, des palmiers, deux gradins bas, le mur. **Ajouter** un pavillon sur le gradin haut de droite à mi-jardin (`kushk`, `formes-perse.js:37`, jamais posé). Attention : les pavillons d'avant traversaient les murs et ont été retirés (`decors.js:1979`).

### Secteur 7 — Bazar couvert (871 → 1031)

- **Chargé.** Les murs : boutiques peintes, bandeau de faïence, un tapis pendu tous les 4 m en quatre palettes, muqarnas.
- **Vide.** Le volume : un sol beige de 16 à 24 m de large, rien entre les deux murs, rien à hauteur d'homme. Sacs et cuivres font 0,5 m.
- **Retirer** un tapis pendu sur deux (`decors.js:2013`). **Ajouter**, sur les travées droites seulement : une estrade de 0,5 m en saillie d'un mètre devant une boutique sur trois, chargée en gradins (piles de tapis, bassines) ; des taches de jour fixes au sol sous les lanterneaux, pour casser le beige. C'est aussi là que se tiennent les silhouettes de 7-V1.

### Secteur 8 — Bazar ouvert (1034 → 1178)

- **Chargé.** Le même module de 12 m répété une cinquantaine de fois, couronnement turquoise en zigzag à pleine saturation, deux variantes seulement ; deux étals qui alternent.
- **Vide.** Le ciel et la ligne des toits (plate, quelques tours à vent), la chaussée, la profondeur : aucune ruelle, aucune cour aperçue, plus une toile après 1050, pas un arbre.
- **Retirer** le couronnement en zigzag d'un module sur deux (brique unie). **Ajouter** : deux groupes de toiles en travers vers 1090 et 1140 ; deux ruelles latérales en enfilade (la forme `ruelle` existe, `decors.js:1855`) ; un portail avec la cour d'un caravansérail aperçue, côté extérieur de la courbe vers 1110 ; deux platanes de rue avec leur banc ; du linge entre deux toits.
- **À savoir** : la façade est un bloc plein (`arcadeBazar`, `formes-perse.js:88`), sans profondeur d'arcade. Les silhouettes n'ont que 0,5 m entre le bord roulable et le mur.

---

## 4. Mes ajouts au-delà des demandes

Déjà dans la grille : les flammes et leur allumage en cascade (2-L1, 3-L1), la caravane (2-V1), les fumées dans le vent (1-M1, 8-M2), les lanternes qui se balancent (7-L1), les rais et leur poussière (5-L1, 7-L2), le vol de pigeons (8-V1), le rapace (3-V1), les colombes (4-V1, 6-V1), les pétales (6-M2).

Ce que l'auteur a pu oublier, et qui pèse :

1. **Le son est absent de toute la carte.** Ni lit, ni événement, ni acoustique propre. Quatre lits suffisent : village, pierre et vent (escalier, terrasse), jardin (eau, oiseaux), bazar. Le contraste entre l'écho de la salle, le calme du jardin et la clameur du bazar se perçoit mieux que n'importe quelle animation.
2. **L'appel lointain** (8-S1) : une voix ou une flûte, longue et filtrée, une fois par tour au retour vers la ligne. Le choix entre les deux revient à l'auteur.
3. **Le souffle sous la Porte** (4-S1) et **l'écho de la salle** (5-S1) : deux lieux que l'oreille reconnaît sans regarder.
4. **Le dernier tour** : tous les feux brûlent haut dès le départ (3-L1). C'est le seul effet qui dépende de la course ; la carte n'en a aucun.
5. **Un seul vent**, visible partout : c'est lui qui relie fumées, tapis, toiles, palmes et poussière.
6. **Le poste de radio** : rien à faire, `RADIO.perse` existe.

Écartés : les étendards qui flottent (ils sont rigides, source à l'appui) ; un chat dans un passage couvert (invisible en roulant) ; des gestes de marchands (invisibles en roulant) ; tout mouvement dans la salle.

---

## 5. Ce que la carte demande au socle, et ses pièges

### Demandes au socle

| Brique de `METHODE-VIE.md` | Pour quoi | Idées qui en dépendent |
|---|---|---|
| 1. Ambiance par zone | Quatre lits, événements, sources placées (caravane, cascades), réverbération par lieu (Porte, salle, voûte) | tout ce qui est « Son » |
| 1 bis. **Ambiance sous une voûte** | `audio.js:905` multiplie l'ambiance par `(1 - tun)` : aucun lit ne peut sonner dans le bazar couvert | 7-S1 |
| 6. Particules ouvertes aux décors | Filets de fumée, poussière, pétales, éclats d'objets | 2-M1, 4-M1, 6-M2, 1-I1, 7-I1, 5-I1 |
| 7. `coule` et `boucle` sorties de leurs cartes | Eau, vols d'oiseaux, marcheurs | 1-E1, 3-E1, 6-E1, 6-E2, 3-V1, 6-V1, 8-V1, 8-V3 |
| 2. Horloge des shaders | Seulement si on veut les palmes en vertex shader | 6-M1 (sinon par instance) |
| 8. Plans à plusieurs instants | Vérifier les flammes, l'allumage, le vol | toutes les animations |

Deux demandes propres à perse, hors de la liste du socle :

- **`th.objets` par tronçon**, avec un rappel au choc (particules, son). Sans lui, les sortes sont les mêmes sur toute la carte (§2.2).
- **Une aide « lot instancié animé »** : presque tout ce qui bouge ici est un `InstancedMesh` déjà posé (flammes, jets, lanternes, tapis, toiles, palmes). Une seule fonction qui garde les matrices de repos et les rejoue avec une échelle ou une rotation servirait dix fois.

### Pièges de perse

1. **Matières en cache.** `h.mat` est enveloppé dans un cache par réglage (`decors.js:1717`) : deux appels identiques rendent le même objet. La matière `eau` (`decors.js:1734`) sert à la rigole de tout le tour, au canal et aux bassins du jardin. Faire défiler son `map.offset` anime tout d'un coup : c'est une aubaine pour le canal, et un piège pour l'escalier, où l'eau remonterait la pente. Il faut une seconde matière avec une texture clonée pour le tronçon 418 → 589.
2. **Rubans et nappes n'ont pas les mêmes UV.** La rigole et le canal sont des rubans (UV le long de la piste) ; les bassins sont des nappes en UV du monde (`decors.js:1725`). Le même décalage les fait couler dans des directions sans rapport. Pour un bassin, c'est un frémissement acceptable.
3. **La cascade n'a pas de texture** (`chute`, aplat émissif, `decors.js:1947`) : rien à faire défiler tant qu'on ne lui en donne pas une.
4. **Tout ce qui bouge doit porter `userData.dyn = 1`** avant la fusion (`game.js:1147`). Les lots à animer passent aujourd'hui par `I` et `Is` (`decors.js:1719`), qui calculent une sphère englobante et activent le tri par champ de vision : un lot dont les instances bougent doit recalculer sa sphère ou couper ce tri.
5. **Un seul lot de flammes pour quatre secteurs** (`decors.js:1938`) : pratique pour le tremblement, mais l'allumage en cascade doit savoir quelles instances sont celles de l'escalier. Garder l'indice de la première et de la dernière au moment où `brasero` les empile. Même besoin pour laisser fixes les braises des points de freinage : la voie de la terrasse (572, 584) et le perron (746).
6. **`rythme.js` réécrit la couleur des matières sans éclairage opaques.** Flammes, lanternes et jets sont de ce type (`lum: 1`) : animer par l'échelle, jamais par la couleur.
7. **Les luminaires sont figés et limités à 20** (`h.lum`). La voûte en consomme déjà un par travée (`decors.js:2010`), l'escalier cinq (`decors.js:1890`), la rue une par lanterne (`decors.js:2037`). Aucune flamme ne peut faire varier sa lumière : seule la flamme tremble.
8. **Les étals sont dans la bande roulable** (2,3 à 3,4 m à l'intérieur du bord, `decors.js:1842, 2036`). S'ils se traversent aujourd'hui, les silhouettes posées devant hériteront du défaut : les mettre derrière le comptoir.
9. **Écran partagé** : un seul tick, piloté par le joueur 1. L'allumage en cascade et les envols se déclencheront pour lui seul.
10. **Pause** : animer sur `dt`, pas sur `now`, y compris l'horloge de la caravane.

---

## 6. Ce que je n'ai pas vérifié

- **Aucun mouvement vu** : je n'ai pas lancé le jeu ni pris de rafale. Tout ce qui touche à la perception en roulant est jugé sur des images fixes à 80–100 km/h (le pilote automatique des plans), pas à la vitesse de course.
- **Les `idx` du code** viennent de la longueur de la ligne brisée des points de contrôle, pas des échantillons réels : ± 8. Les bornes du cahier datent d'avant la refonte.
- **Les points de freinage** sont déduits de la géométrie, pas d'une télémétrie.
- **Les numéros de ligne des modèles** (paris, stade, wangan, chapada) : j'ai vérifié par `grep` ceux de `coule`, `boucle`, `surChemin`, `soude`, des flammes de stade, du lot de braises et de `th.objets`. Pour les pigeons et le livreur de paris, je reprends ceux de `METHODE-VIE.md` sans avoir relu le tick.
- **Les collisions** : je n'ai pas vérifié si les étals arrêtent la voiture, où passe exactement le mur de collision par rapport aux façades, ni si un objet percuté ralentit la voiture.
- **Le son** : je n'ai rien écouté. Je n'ai pas vérifié ce que fait `audio.js` quand `AMB[M.id]` manque, ni le réglage de réverbération actuel sous la voûte. La présence des grelots (givre) et des oiseaux (paris) dans `ambEvent` vient des commentaires de `AMB`, pas de la lecture de la fonction.
- **Le cache de textures** : je suppose que la texture de `eau` n'est partagée avec aucune autre matière (sa palette est unique dans le décor de perse) ; je n'ai pas lu le cache de `tx` dans `game.js`.
- **Les textures de chute de chapada** : je n'ai pas vérifié leur nom ni qu'elles conviennent à un mur de 3 m.
- **La place de la caravane** : le couloir à 3 m derrière le muret paraît libre d'après le code (platanes à partir de 5 m, rochers à partir de 9 m) ; pas vérifié sur une vue de côté.
- **La forme `pigeon`** est dans `formes-paris.js`, chargé par `index.html` pour toutes les cartes ; je n'ai pas vérifié que `h.pose` la trouve depuis le décor de perse.
- **Le trafic** : lu en trois endroits seulement ; je n'ai pas vérifié comment un gabarit de véhicule est choisi.
- **Les vues de côté** vers la droite : la planche a été écrasée par celle de gauche (même nom de fichier), je n'ai lu que la gauche.
