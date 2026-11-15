# Manuscrit 512 (`chapada`) : analyse « vie »

Étape 2 de `METHODE-VIE.md`. Lecture seule : aucun code touché. Écrit le 15 novembre 2026 d'après le code de `main` au commit `ce210bc` et 40 plans du rendu (`captures/plans/chapada/`).

**Deux choses à savoir avant de lire.**

1. **`decors.js` a été découpé pendant cette analyse** (commit `ce210bc`) : le décor de la carte est maintenant dans `decors-chapada.js` (256 lignes). Les numéros de `METHODE-VIE.md` et de la consigne (« `decors.js` vers 2576-2820 ») sont périmés : pour chapada, retrancher 2565 (le tick est à `decors-chapada.js:253`). Toutes les références ci-dessous sont recalées sur les nouveaux fichiers.
2. **Le cahier de feedback décrit l'ancienne carte** (tracé de 2535 échantillons, plateau, galerie, arche). La carte actuelle fait **1792 échantillons** et dix secteurs. La grille suit les secteurs réels ; chaque zone du cahier y est rattachée :

| Zone du cahier (ancien tracé) | Secteur actuel |
|---|---|
| 1. Plateau de départ | S1 Camp de base |
| 2. Lacets en gorge | S3 Fromager, S4 Lacets |
| 3. Chute et galerie | S5 Pont et grande chute, S6 Temple-grotte |
| 4. Gué, « mangrove » | S2 Marais, S8 Rivière sur la route, S10 Gué |
| 5. Pont | S5 Pont |
| 6. Remontée en forêt | S7 Descente des idoles |
| 7. Arche de roche | S9 Cité perdue (arc triple) |

Secteurs, échantillons et vitesse du pilote automatique (tour lancé, `sim.js`) :

| | Secteur | `idx` | Vitesse | Freinage |
|---|---|---|---|---|
| S1 | Camp de base (départ) | 1723 → 100 | 190 à 213 km/h | aucun |
| S2 | Marais (chaussée noyée 182 → 256) | 100 → 284 | 213 à 225, puis 185 | **250 → 300** (chicane) |
| S3 | Chicane du fromager, bassin sacré | 284 → 454 | 132 à 160 | fin du freinage jusqu'à 325 |
| S4 | Lacets (tête colossale 505, porte ruinée 636) | 454 → 768 | 94 à 170 | **480 → 525**, **600 → 625** |
| S5 | Pont de lianes (819 → 902) et grande chute | 768 → 923 | 157 à 195 | aucun |
| S6 | Temple-grotte (tunnel) | 923 → 1069 | 196 à 211 | aucun |
| S7 | Descente des idoles (idole 1177, équerres) | 1069 → 1280 | 220 puis 124 | **1125 → 1200** |
| S8 | Rivière sur la route (saut 1280, seuils 1327 et 1374) | 1280 → 1414 | 150 à 167 | aucun |
| S9 | Cité perdue (arc triple 1414, place 1449 → 1500) | 1414 → 1572 | 113 à 166 | **1425 → 1450**, **1475 → 1500** |
| S10 | Gué (eau 1600 → 1628), retour au camp | 1572 → 1723 | 150 à 192 | aucun |

Priorités : **I** indispensable, **B** bien, **b** bonus. « Socle n » renvoie aux huit briques de `METHODE-VIE.md`, section « À construire ». ★ = le moment fort du secteur.

**Vent de la carte : d'est en ouest, vers l'aval.** C'est déjà le sens de la vapeur de la chute (`decors-chapada.js:197`, `PP[k*3] -= 1.2 * dt`). Fumée, brume, feuilles, flammes et embruns suivent ce sens.

---

## 1. État des lieux : ce qui bouge déjà

**Bon, à garder tel quel.**
- La grande chute en deux nappes qui tombent à des vitesses différentes (`tombe`, `nappe`, `decors-chapada.js:16-27, 183-191`) : de face au bout du pont (`idx` 875) elle se lit comme de l'eau.
- La rivière sur la route (S8) : deux couches d'`eauJade`, la seconde 2,2 fois plus rapide (`decors-chapada.js:64-68`). C'est la meilleure eau de la carte : on voit le courant filer sous la voiture.
- La gerbe du moteur dans les trois passages noyés (`th.poussiere`, `game.js:721, 737`) et les feuilles soulevées (`th.feuilles`, `game.js:808`).
- Le marais qui dérive en deux nappes croisées (`decors-chapada.js:69-70`).

**Plat.**
- **La vapeur de la chute** (`VAP`, `decors-chapada.js:192-197`) : depuis le pont (`idx` 835) c'est une tache blanc-jaune brûlée, immobile à l'œil, qui cache le pied de la chute. On ne lit ni bouffées ni montée. Rien n'atteint le tablier : on longe la plus grande chute de la carte au sec.
- **La chute de près** : la texture se lit en bandes de gros pixels (`idx` 875). Pas de lèvre qui se déchire, pas de voile qui se défait à mi-hauteur (c'est pourtant le trait de la Cachoeira da Fumaça, `docs/REFS-chapada.md` §3).
- **Aucun son d'eau, aucun son de lieu.** `cartes.js:512` déclare deux zones `amb` (pont, gué), mais `AMB.chapada` n'existe pas (`audio.js:45`) ni d'événement dans `ambEvent` (`audio.js:513`) : la carte est muette hors moteur. Pas d'acoustique propre non plus (`ESP`, `audio.js:596`, repli sur `essai`).
- **La grotte** : rien n'y bouge, rien n'y brille. Sol sec, pas de goutte, pas de reflet des braseros, même réverbération de tunnel que partout (`audio.js:741`).
- **Les flammes** : torches, braseros et feu de camp sont des blocs fixes (`formes-chapada.js:32, 83`). Aucune fumée au camp.
- **La forêt** : tout est figé. Seules bougent les feuilles derrière la voiture.
- **La brume** : des plans additifs immobiles (`decors-chapada.js:123-127`).
- **Le gué** : la gerbe y est, mais l'eau n'a ni éclat ni écume autour des dalles et de la statue.
- **Aucun animal**, vu ou entendu.

---

## 2. La grille

### S1. Camp de base, départ (`idx` 1723 → 100) — cahier zone 1

C'est le seul endroit où la voiture est à l'arrêt (grille, compte à rebours) : tout détail s'y lit, son compris.

| Famille | Ce que le joueur perçoit | `idx` | Brique | Pr. |
|---|---|---|---|---|
| Eau | Rien (le camp est au sec). | — | — | — |
| Lumière ★ | Le feu de camp vit : la flamme change de hauteur, sa lueur sur les tentes respire. Sur la grille, c'est la première chose qui bouge. | 25 (feu en x 50, z −11) | Flamme : échelle par instance, modèle `decors-stade.js:139`. Lueur : `h.lum` (`decors-chapada.js:146`) doit rendre son luminaire pour qu'on module sa couleur (socle, demande §6). | **I** |
| Lumière | Une colonne de fumée monte du feu et penche vers l'ouest ; on la revoit en revenant du gué, au-dessus des arbres. | 25, vue depuis 1723 | `h.vapeur(x, y, z)` (`game.js:605`) ; teinte grise par socle 6 (`flou` ouvert). | **B** |
| Mécanique | La guirlande de lanternes se balance, plus fort quand le peloton s'élance. | 10 → 50 | Lanternes posées une à une (`decors-chapada.js:147`) : les regrouper sous un pivot `dyn`, modèle du bras du berger et de l'hélicoptère (`decors-terre.js:134`). | **b** |
| Mécanique | Les trois feux du mât radio s'allument tour à tour. | 30 (mât en x 62, z −44) | `visible` alterné, modèle `decors-givre.js:128` (pas de `setHex` : `rythme.js` l'écrase). | **b** |
| Vivant | Un toucan perché sur l'échafaudage de bambou, bec orange : une tache de couleur fixe. | 4 (échafaudage en x 8) | Forme `toucan` à dessiner (3 boîtes, sur le gabarit de `chouette`, `formes-givre.js:40`). | **b** |
| Son | Sur la grille : crépitement du feu, grésillement d'un poste radio, lit de forêt (cigales, feuillage). Dès qu'on accélère, le moteur couvre. | 1723 → 60 | Socle 1 : lit `AMB.chapada`, source ponctuelle « feu ». Synthèse en §3. | **I** |
| Interactif | Aucun : zone de départ, peloton groupé. | — | — | — |

### S2. Marais (`idx` 100 → 284) — cahier zone 4

Le freinage de la chicane commence à 250 : tout ce qui bouge est placé **avant 230**.

| Famille | Ce que le joueur perçoit | `idx` | Brique | Pr. |
|---|---|---|---|---|
| Eau | Des reflets du ciel et des troncs dans l'eau noire : le marais devient un miroir, ce qui manque depuis le cahier (G10). | 135 → 276 | Socle : une surface de décor peut-elle entrer dans la passe de reflets (`userData.mou`, `game.js:407, 475`) ? Aujourd'hui les surfaces transparentes en sont exclues. Demande §6. | **B** |
| Eau | Un sillage qui s'élargit derrière la voiture sur l'eau plate : deux lignes d'écume en V qui restent deux secondes. | 182 → 256 | L'écume du moteur existe (`ECUME`, `game.js:721`) ; allonger sa durée sur eau calme. Réglage moteur, à proposer. | **b** |
| Lumière | La brume du matin se lève : de larges bouffées basses montent de l'eau dans les taches de soleil et dérivent vers l'ouest. | 120 → 230, à plus de 15 m de la route | Le générateur de `VAP` (`decors-chapada.js:193-197`) sorti en fonction : mêmes points, montée lente (1 m/s), 6 m de haut. | **B** |
| Mécanique | Rien. | — | — | — |
| Vivant ★ | **Un vol d'aigrettes blanches décolle de l'eau** à gauche et à droite quand on entre dans le passage noyé, et file sur le côté. Blanc sur eau sombre : lisible à 220 km/h. | posées vers 190 → 215, déclenchées 22 échantillons avant | Forme `flamant` (`formes-plage.js:69`, jamais posée) reteinte en blanc ; envol copié des pigeons (`decors-paris.js:209-229`). Détail §3. | **I** |
| Vivant | Un caïman au ras de l'eau près de la chaussée, qui s'enfonce quand on arrive. | 150, à 6 m à droite | Forme `jacare` à dessiner (4 boîtes) ; descente en `y` déclenchée à l'approche (même test que les pigeons). | **b** |
| Son | Chœur de grenouilles et la « grenouille forgeron » (un tintement de marteau sur l'enclume, très brésilien), surtout audible au lever de pied de 250. Plouf sourd à l'entrée dans l'eau, chuintement tant qu'on y roule. | 100 → 284 ; eau 182 → 256 | Socle 1 (zone → `audio.js`). Événements dans `ambEvent`, modèle des grillons (`audio.js:515`). Son d'eau sous les roues : à vérifier, voir §7. | **I** |
| Interactif | L'envol des aigrettes (ci-dessus) : décor pur, rien à percuter. | — | — | — |

### S3. Chicane du fromager, bassin sacré (`idx` 284 → 454) — cahier zone 2

Le fromager est dans l'axe du freinage (`decors-chapada.js:151`) : il reste immobile.

| Famille | Ce que le joueur perçoit | `idx` | Brique | Pr. |
|---|---|---|---|---|
| Eau | Le bassin sacré scintille : des paillettes de soleil qui passent sur l'eau. | 336 → 355, à gauche | Seconde couche additive sur le bassin (`decors-chapada.js:217`) avec une texture `paillettes` à dessiner dans `textures-chapada.js`, avancée par `coule` (`decors-chapada.js:15`). | **b** |
| Lumière | Rien : zone de freinage puis d'appui. | — | — | — |
| Mécanique | Rien. | — | — | — |
| Vivant ★ | **Deux aras rouges traversent le ciel** au-dessus de la route à la sortie de la chicane, de droite à gauche, en criant. | 340 → 420 (on réaccélère), à 18 m de haut | Forme `oiseauVol` à dessiner (corps, deux ailes sur pivots, longue queue). Trajet : `boucle` (`decors-wangan.js:213`), battement par rotation des ailes. §3. | **I** |
| Vivant | Le houppier du fromager remue (vent). | 300 → 317 | Socle 2 (horloge des shaders). Hors de l'axe seulement si l'amplitude reste faible : à juger sur plan. | **b** |
| Son | Cri rauque des aras, synchronisé à leur passage ; lit de forêt. | 340 → 420 | Socle 1, source ponctuelle mobile (modèle `voixLoin`, `audio.js:688`). | **B** |
| Interactif | Aucun. | — | — | — |

### S4. Lacets (`idx` 454 → 768) — cahier zone 2

Le secteur le plus long et le plus uniforme (14 secondes de couloir vert). Deux freinages forts : la tête colossale (505) et la porte ruinée (636) sont dans l'axe, donc fixes.

| Famille | Ce que le joueur perçoit | `idx` | Brique | Pr. |
|---|---|---|---|---|
| Eau | Rien. (Le ruisseau des lacets n'a jamais été construit : `ETAPE2-chapada.md`, « Non fait ». Décor, voir §5.) | — | — | — |
| Lumière | Les taches de soleil sur la route bougent doucement : la canopée respire. | 535 → 600 et 645 → 768 (hors freinages) | Socle 2 : balancement des `cime` en vertex shader. Piège : l'ombre ne suit que si la matière de profondeur reçoit le même déplacement (§6). | **B** |
| Lumière | Des rayons de soleil dans la forêt : **non proposé**. L'auteur les a refusés deux fois (cahier Z6.1 ; troisième passe, « plus de colonnes de lumière », « trop d'effets de lumière »). À ne refaire que sur demande, voir §3 « écarté ». | — | — | — |
| Mécanique | Rien. | — | — | — |
| Vivant ★ | **Des feuilles tombent de la canopée** en travers de la route, portées par le vent, tout le long de la montée : l'air de la forêt a une épaisseur. | 535 → 600, 645 → 768 | Un nuage de points recentré sur la voiture (le tick reçoit `car`, `game.js:828`), teintes de `th.feuilles` (`cartes.js:531`). Sinon socle 6. | **B** |
| Vivant | Des vautours (urubus) tournent très haut dans la trouée de la seconde épingle. | 645 → 700, vue vers la vallée (`VUES`, `decors-chapada.js:91`) | `oiseauVol` en noir, ailes fixes, sur `boucle`. Hors brouillard (`fog: false`) sinon invisibles à 190 m. | **b** |
| Son ★ | Au lever de pied de chaque épingle, la forêt remonte : l'araponga (un coup de cloche fêlée, au loin), les cigales. En haut de la montée, **le grondement de la chute commence**, à droite puis devant : on l'entend avant de la voir. | araponga 480 → 535 et 600 → 645 ; chute à partir de 700 | Socle 1 : événements par zone, source ponctuelle « chute » au cirque (x 1036, z 215). | **I** |
| Interactif | Aucun. | — | — | — |

### S5. Pont de lianes et grande chute (`idx` 768 → 923) — cahier zones 3 et 5

Demande n° 1 de l'auteur. Pas de freinage : tout est permis. La chute est à gauche (est), le vent pousse ses embruns vers le pont.

| Famille | Ce que le joueur perçoit | `idx` | Brique | Pr. |
|---|---|---|---|---|
| Eau ★ | **On traverse le nuage d'embruns** : au milieu du pont, des rideaux de gouttelettes passent en travers du tablier, de gauche à droite ; l'image blanchit une demi-seconde. | 840 → 890 | Socle 6 (`flou` ouvert aux décors, `game.js:712`) : émetteurs le long du côté gauche du pont. À défaut, un second nuage de `VAP` à hauteur de tablier (y 63 à 70). | **I** |
| Eau | Des gouttes sur l'objectif pendant la traversée du nuage. | 850 → 900 | Les gouttes d'objectif existent (`gt[i]`, `game.js:134-135`), pilotées par la pluie : les ouvrir à une zone (demande §6). | **B** |
| Eau | La vapeur du pied se lit enfin comme des bouffées qui montent : plus nombreuses, plus petites, moins brûlées, et un panache qui dépasse la falaise. | 808 → 900 | Réglage de `VAP` (`decors-chapada.js:193-197`) : taille 28 → 14, 90 → 200 points, mélange normal au lieu d'additif sur fond clair. | **I** |
| Eau | La chute se défait à mi-hauteur : la lame du bas devient un voile troué qui s'écarte au vent. La lèvre, en haut, bouillonne. | 808 → 902 | Troisième matière `tombe(…)` plus trouée (`decors-chapada.js:16`) sur le tiers bas ; écume `ec` (`decors-chapada.js:27`) posée sur la lèvre avec `plat` (`decors-chapada.js:24`). | **B** |
| Eau | Le bassin bouillonne au pied et l'eau file sous le pont. | 850 → 880 (à travers le garde-corps) | Couronne d'écume existante (`decors-chapada.js:198-201`) : doubler d'une seconde couche plus rapide. Peu visible : le garde-corps cache le pied. | **b** |
| Lumière | Le nuage est à contre-jour (le soleil est devant à gauche) : la vapeur s'allume en or sur ses bords. | 820 → 880 | Gratuit avec le réglage de `VAP` ci-dessus : teinte chaude côté soleil (couleur par point, déjà en place). | **B** |
| Lumière | Le tablier est mouillé et sombre du côté de la chute. | 840 → 900 | Les planches sont un ruban du décor (`decors-chapada.js:167`) : elles ne lisent pas la mouillure. Voir « Chaussée mouillée » plus bas. | **b** |
| Mécanique | Les suspentes et la main courante ne bougent pas : un tablier qui tangue à l'écran sans tanguer dans la physique tromperait le pilote. **Non proposé.** | — | — | — |
| Vivant | Des vautours planent dans la gorge, à hauteur d'yeux, à droite (côté aval). | 808 → 880 | `oiseauVol` noir sur `boucle`, comme S4. | **B** |
| Vivant | Trois singes assis sur les obélisques de l'entrée du pont. Fixes (on arrive à 165 km/h dans un goulet). | 819 | Forme `singe` à dessiner (§3), posée au sommet des `obelisque` (`decors-chapada.js:172`). | **b** |
| Son ★ | **Le grondement de la chute** : il monte dès le haut des lacets, il est à gauche sur le pont, il emplit tout au milieu, il passe derrière à l'entrée de la grotte, où il s'étouffe d'un coup. Sous les roues, le roulement devient un martèlement de planches. | chute 700 → 930, maximum 850 → 890 ; planches 819 → 902 | Socle 1 : source ponctuelle avec distance et panoramique (modèle `voixLoin`, `audio.js:688`). Planches : variante du martèlement des pavés (`audio.js:669`) déclenchée par zone. Synthèse §3. | **I** |
| Interactif | Aucun (voie unique de 9 m, peloton serré : `ETAPE2-chapada.md`, 27 contacts en course simulée). | — | — | — |

### S6. Temple-grotte (`idx` 923 → 1069) — cahier zone 3

Le tunnel est celui du moteur : parois, voûte et sol ne sont pas au décor. L'auteur a retiré la chute du portail, les puits de jour et les luminaires vifs : on ne les repropose pas.

| Famille | Ce que le joueur perçoit | `idx` | Brique | Pr. |
|---|---|---|---|---|
| Eau | **Le sol de la grotte est mouillé** : sombre, luisant, il renvoie la lueur des braseros des deux portails. | 923 → 1069 | `th.mouilleVisible` (`docs/MOTEUR-OPTIONS-CARTES.md` §8) : le sol du tunnel lit la mouillure (`game.js:537`) et la zone existe déjà (`cartes.js:518`, `[34, 40, 'mouille', 0.5]`). Une ligne. Voir « Chaussée mouillée ». | **I** |
| Eau | Des filets d'eau ruissellent sur les côtes de roche. | 930 → 1060 | Petites `nappe` (`decors-chapada.js:20`) sur les côtes (`decors-chapada.js:245-247`), matière `e2`. Peu lisible à 200 km/h dans le noir. | **b** |
| Lumière | Les braseros des portails vacillent, et leur lueur avec eux. | 923 et 1069 | Flamme : les quatre torches sont posées une à une (`decors-chapada.js:210`), échelle animée dans le tick. Lueur : `h.lum` rendu modulable (§6). | **B** |
| Mécanique | Rien. | — | — | — |
| Vivant ★ | **Une nuée de chauves-souris sort de la grotte** au moment où l'on y entre : une trentaine de points noirs qui battent, au ras de la voûte, vers le jour. | déclenchée à 900, croisée de 923 à 950 | `InstancedMesh` de `bloc` noirs, envol copié des pigeons (`decors-paris.js:224-229`), battement par échelle. Elles passent au-dessus de 4 m : rien devant le pare-brise. | **I** |
| Son | Le moteur résonne longuement (une salle haute, pas un tunnel routier). Cris aigus des chauves-souris à l'entrée. Le grondement de la chute, coupé net, revient en filet à la sortie. | 923 → 1069 | Socle 1 : réverbération par lieu (la même partout aujourd'hui, `audio.js:741`) ; durée 2,8 s, aigus coupés à 1,8 kHz. | **I** |
| Interactif | L'envol des chauves-souris : décor pur. | — | — | — |

### S7. Descente des idoles (`idx` 1069 → 1280) — cahier zone 6

Freinage 1125 → 1200 sur l'idole assise et ses deux torches (`decors-chapada.js:219`) : rien n'y bouge, les flammes y restent fixes.

| Famille | Ce que le joueur perçoit | `idx` | Brique | Pr. |
|---|---|---|---|---|
| Eau | On entend puis on aperçoit la rivière à droite avant d'y sauter. | 1241 → 1280 | La rivière y est déjà (`RIV`, `decors-chapada.js:36`) ; son : source ponctuelle « rapides ». | **B** |
| Lumière | L'or de l'idole accroche le soleil : un éclat qui dépend de l'angle de vue, sans clignoter. | 1100 → 1177 | Un disque additif orienté vers la caméra, modèle `h.beams` (`decors-ville.js:115`, `game.js:1960`), dont l'opacité suit l'angle. Dans l'axe d'un freinage : à juger sur plan, à retirer s'il attire l'œil. | **b** |
| Mécanique | Rien. | — | — | — |
| Vivant ★ | **Des singes sur les statues et sur les deux obélisques du saut** : ils bondissent dans les arbres quand la voiture arrive. | statue de 1252, obélisques de 1282 (on réaccélère, 138 à 150 km/h) | Forme `singe` à dessiner ; fuite copiée des pigeons (`decors-paris.js:224-229`), avec une trajectoire latérale vers le haut. | **B** |
| Vivant | Une onça (jaguar) couchée sur le grand tronc de la sortie de la rivière : la voiture s'appelle l'Onça, elle croise la vraie. Fixe. | 1396 → 1406 (classée en S8) | Forme `onca` à dessiner (§3), posée sur le tronc (`decors-chapada.js:83-85`). | **B** |
| Son ★ | **Les singes hurleurs** : un long rugissement grave qui roule dans la vallée, au lever de pied de l'idole. Une fois par tour. | 1125 → 1200 | Socle 1, événement de zone. Synthèse §3. | **I** |
| Interactif | La fuite des singes : décor pur. | — | — | — |

### S8. Rivière sur la route (`idx` 1280 → 1414) — cahier zone 4

Déjà le secteur le plus vivant à l'image. Il lui manque le son et l'impact.

| Famille | Ce que le joueur perçoit | `idx` | Brique | Pr. |
|---|---|---|---|---|
| Eau ★ | **La réception du saut est une explosion d'eau** : un mur blanc qui monte de chaque côté et retombe, des gouttes sur l'objectif. Même chose, en plus petit, au pied des deux seuils. | 1286, 1331, 1378 | La gerbe a un réglage de force (`gerbe(c, v, moi, dt, fort)`, `game.js:737`) : vérifier qu'il est bien lancé à l'atterrissage (§7). Gouttes d'objectif : demande §6. | **I** |
| Eau | Au pied de chaque seuil, un petit nuage d'embruns permanent. | 1331, 1378 | Générateur de `VAP` réutilisé, 20 points, 3 m de haut. | **B** |
| Eau | Le rouleau au pied des seuils bouillonne plus vite que le courant. | 1327, 1374 | Les blocs `bouil` partagent la matière `ec` (`decors-chapada.js:77-81`) : leur donner une matière à part, avancée plus vite par `coule`. | **b** |
| Lumière | Rien de plus : la brume de zone y est (`th.brume`, `cartes.js:532`). | — | — | — |
| Mécanique | Des branches et des paquets de feuilles descendent le courant, plus vite que la voiture au pied des seuils, moins vite ailleurs. | 1290 → 1396 | Mobiles le long de la piste, modèle du livreur (`decors-paris.js:222`). Purement visuels, au ras de l'eau. | **b** |
| Vivant | L'onça sur le tronc (voir S7). | 1396 → 1406 | — | **B** |
| Son ★ | **Le fracas** : plouf lourd à la réception, eau vive continue sous la voiture, un rugissement bref à chaque seuil. Le feulement de l'onça (un râle scié) à la sortie. | 1280 → 1414 | Socle 1 : lit de zone « rapides », trois sources aux seuils ; choc d'eau déclenché par l'entrée en zone `aq`. | **I** |
| Interactif | Aucun de plus : le saut et les seuils sont déjà le jeu. | — | — | — |

### S9. Cité perdue (`idx` 1414 → 1572) — cahier zone 7

Deux freinages (1425 → 1450, 1475 → 1500) au milieu de la place : le secteur doit rester calme à l'image. Sa vie passe par le son et par le sol.

| Famille | Ce que le joueur perçoit | `idx` | Brique | Pr. |
|---|---|---|---|---|
| Eau ★ | **On sort de la rivière sous l'arc triple en laissant une traînée mouillée** sur les dalles : la chaussée est sombre et luisante sur 60 m, puis sèche. | 1396 → 1440 | `th.mouilleVisible` : fondu de 20 m aujourd'hui, à allonger (demande §6). Piège des bandes latérales du décor, voir « Chaussée mouillée ». | **B** |
| Lumière | Les quatre torches de la place et le doigt d'or de la statue : fixes (freinage). | — | — | — |
| Mécanique | Rien. | — | — | — |
| Vivant | Deux vautours posés au sommet du temple à degrés. Fixes, en silhouette sur le ciel. | 1449 → 1480, temple en x 86, z 366 | `oiseauVol` ailes repliées (ou `chouette` reteinte, `formes-givre.js:40`). | **b** |
| Vivant | Une bande de perruches vertes jaillit des murs en ruine à la sortie de la place. | 1510 → 1540 (on réaccélère) | Envol des pigeons, teinte verte. Quatrième envol de la carte : à garder seulement si les autres sont refusés. | **b** |
| Son ★ | Sous l'arc, le moteur claque contre la pierre ; sur la place, l'écho des murs répond ; au-dessus, un jacassement de perruches. | arc 1410 → 1420 ; place 1449 → 1500 | Socle 1 : acoustique par lieu (`ESP`, `audio.js:596` : `mur` fort, `slap` court sur la place). | **B** |
| Interactif | Aucun recommandé. Une seule option explicite, si l'auteur en veut : des poteries de fouille à renverser au bord extérieur de la place, par `th.objets` (`game.js:1050`). L'auteur a retiré les cônes de cette carte (`th.cones: 0`) et ces objets ne sont pas synchronisés en ligne : je ne la conseille pas. | 1500 → 1530 | `th.objets` | **b** |

### S10. Gué, retour au camp (`idx` 1572 → 1723) — cahier zone 4

Ciel ouvert, pas de freinage, on accélère : c'est l'endroit pour un effet de lumière sur l'eau.

| Famille | Ce que le joueur perçoit | `idx` | Brique | Pr. |
|---|---|---|---|---|
| Eau ★ | **Le gué scintille au soleil** : des paillettes qui passent sur l'eau jade, dans le sens du courant, jusqu'à ce qu'on les fende. | 1590 → 1635 | Couche additive `paillettes` avancée par `coule`, comme au bassin sacré. Le ruban de l'eau du gué est déjà isolé (matière 1, `decors-chapada.js:64-66`). | **I** |
| Eau | Des sillages d'écume en V derrière les dalles affleurantes et la statue à demi immergée : on voit que la rivière traverse. | 1600 → 1628, à droite | Les blocs `sill` de la descente (`decors-chapada.js:75`) posés derrière chaque dalle (`dallesG`, `decors-chapada.js:240`). | **B** |
| Eau | Traînée mouillée à la sortie. | 1628 → 1660 | `th.mouilleVisible`, comme S9. | **B** |
| Lumière | Un arc-en-ciel dans la gerbe : **écarté**, voir §3. | — | — | — |
| Mécanique | La barque de l'expédition tangue contre la berge. | 1620, barque en x −82, z 236 (`decors-chapada.js:148`) | Balancement, modèle de l'hélicoptère (`decors-terre.js:134`). La vérifier d'abord : elle est posée au sol, pas sur l'eau (§5). | **b** |
| Vivant | Une famille de capybaras sur la berge de sortie, immobile. | 1640, à droite | Forme `capivara` à dessiner (3 boîtes), instanciée. | **b** |
| Son | Clapotis d'eau peu profonde (plus clair que les rapides), plouf à l'entrée ; puis le lit de forêt, et les aboiements en cascade de la seriema, l'oiseau du plateau, avant le camp. | 1590 → 1640 ; seriema 1660 → 1723 | Socle 1. Synthèse §3. | **B** |
| Interactif | Aucun. | — | — | — |

### Chaussée mouillée : où et quoi faire

Le constat de `docs/MOTEUR-OPTIONS-CARTES.md` §8 (« sur chapada, rien ne se voit ») date de l'ancien tracé. Aujourd'hui les quatre zones `mouille` (`cartes.js:518`) se répartissent ainsi :

| Zone | `idx` | Ce qui couvre la chaussée | Que faire |
|---|---|---|---|
| Marais (pts 2-3) | 182 → 256 | La nappe d'eau du marais | Rien sur la chaussée : c'est l'eau qui doit briller (reflets, S2). |
| Rivière (pts 49-52) | 1280 → 1414 | Le ruban d'eau vive, opaque à 90 % | Rien : l'eau est la surface. |
| Gué (pts 63-64) | 1600 → 1628 | Le ruban d'eau claire, à 50 % | Rien : paillettes et sillages (S10). |
| **Grotte (pts 34-40)** | 923 → 1069 | **Rien** : c'est le sol du tunnel du moteur | **`th.mouilleVisible: 1` dans `cartes.js`.** C'est là que le mouillé se verra, et nulle part ailleurs sans autre travail. |

Avec l'option, la chaussée lit aussi la mouillure sur 20 m de fondu à chaque sortie d'eau (276, 1414, 1648) : c'est la traînée mouillée de S9 et S10. Deux réserves :
- **La bande centrale seule serait mouillée.** Le moteur ne pose la chaussée que sur ±4,5 m (`W`) ; de 4,5 m au bord roulable, c'est un ruban du décor (`dallesBord`, `decors-chapada.js:56`) qui ne lit pas la mouillure. Sans correction, on verrait une bande sombre de 9 m entre deux bandes sèches. Il faut soit donner la mouillure à ce ruban (demande au socle, §6), soit peindre la traînée dans le décor (un ruban sombre et brillant qui s'efface, par-dessus, hors tunnel).
- **20 m, c'est un quart de seconde à 165 km/h.** Pour qu'on la voie, la traînée doit faire 60 m : fondu réglable (§6), sans toucher aux zones `surf` (elles changent l'adhérence et la trace or).

Ordre conseillé : la grotte d'abord (une ligne, un plan avant/après par `node outils/plan.js chapada @1000 --avant`), les traînées ensuite.

---

## 3. Les animaux

Faune de la Chapada Diamantina et de la forêt atlantique de Bahia. Aucune forme d'animal n'existe dans `formes-chapada.js`. Règle suivie : **un animal visible par secteur au plus, aucun dans l'axe d'un freinage**, et les sons placés là où le moteur baisse (levers de pied, grille).

### Visibles

| Animal | Où (`idx`) | Ce qu'il fait | Forme | Mouvement |
|---|---|---|---|---|
| **Aigrettes** (garça-branca), 12 à 16 | S2, 190 → 215, dans l'eau à 8-20 m de la chaussée | Posées, elles décollent à l'approche et partent sur le côté | **Existe** : `flamant(t)` et sa variante tête dans l'eau (`formes-plage.js:69`), en blanc, bec jaune | Envol des pigeons (`decors-paris.js:209-229`) : `setMatrixAt` par oiseau, reposées pour le tour suivant |
| **Aras rouges** (arara-vermelha), 2 | S3, 340 → 420 | Traversent le ciel au-dessus de la route | **À dessiner** : `oiseauVol` (corps 0,5 m, deux ailes sur pivot, queue longue) | `boucle` (`decors-wangan.js:213`) ; ailes en rotation sinus, modèle rotor (`decors-terre.js:81-84`) |
| **Vautours** (urubu), 4 à 6 | S4 (trouée, 645 → 700) et S5 (gorge, 808 → 880) | Planent en cercles | `oiseauVol` en noir, ailes fixes en V | `boucle`, lent |
| **Chauves-souris**, 30 | S6, entrée (923 → 950) | Sortent en nuée au ras de la voûte | `bloc` instancié noir (aucune forme à dessiner) | Envol des pigeons, battement par échelle |
| **Singes** (macaco-prego), 5 | S7, statue de 1252 et obélisques de 1282 ; S5, obélisques de 819 (fixes) | Assis, ils bondissent vers les arbres | **À dessiner** : `singe` (tronc, tête, queue en crochet ; 5 boîtes, gabarit de `passant`, `formes-touge.js:32`) | Envol des pigeons, trajectoire en cloche |
| **Onça** (jaguar), 1 | S8, sur le tronc couché, 1396 → 1406 | Couchée, la tête tournée vers la route. Fixe | **À dessiner** : `onca` (corps allongé, tête, queue pendante ; ocre `0xe9b44c`, la teinte de la voiture, taches en texture) | Aucun |
| Toucan, 1 | S1, échafaudage (4) | Perché. Fixe | À dessiner (3 boîtes, bec orange) ; ou `chouette` reteinte (`formes-givre.js:40`) | Aucun |
| Caïman, 1 | S2, 150 | S'enfonce à l'approche | À dessiner (4 boîtes) | `y` qui descend |
| Capybaras, 4 | S10, 1640 | Sur la berge. Fixes | À dessiner (3 boîtes) | Aucun |

Trois formes suffisent pour l'essentiel : `oiseauVol`, `singe`, `onca`. Les aigrettes et les chauves-souris ne demandent rien de neuf.

### Entendus seulement

| Animal | Où (`idx`) | Quand | Synthèse (`audio.js`, modèles : grillons `:515`, oiseaux `:516`, clameur `:522`) |
|---|---|---|---|
| **Singes hurleurs** (bugio) | S7, 1125 → 1200 | Une fois par tour, au freinage de l'idole | Bruit rose dans deux passe-bande résonants (350 et 700 Hz, Q 4) qui glissent vers le bas, enveloppe de 3 s en trois vagues, écho long. Grave et rauque : passe sous le moteur |
| **Araponga** (oiseau-cloche) | S4, 480 → 535 et 600 → 645 | Un coup toutes les 4 à 9 s | Deux sinus inharmoniques (2,1 et 3,4 kHz), attaque nette, chute en 0,15 s : un marteau sur l'enclume, lointain |
| **Grenouille forgeron** et chœur | S2, 100 → 284 | En continu, un tintement toutes les 0,6 à 1,5 s | Sinus à 1,1 kHz très court (30 ms) doublé à l'octave ; chœur : trains de 5 clics à 2,4 kHz |
| **Cigales** | lit de toute la forêt (S1, S3, S4, S7, S10) | Lit, coupé en tunnel et sur le pont | Bruit passe-haut à 6 kHz modulé en amplitude à 55 Hz, qui enfle et retombe sur 8 s (une ligne dans `AMB.chapada`, format de `audio.js:45-52`) |
| **Aras** | S3, avec leur passage | À leur passage | Dent de scie à 900 Hz dans un passe-bande à 2 kHz, deux cris de 0,25 s, rugueux (modulation à 70 Hz) |
| **Perruches** (maritaca) | S9, place | Par bouffées | Six cris courts en rafale, sinus de 3 à 4,5 kHz qui montent, serrés à 80 ms |
| **Seriema** | S10, 1660 → 1723 | Une fois, avant le camp | Série de jappements : sinus de 1,6 kHz qui glisse à 1,1 kHz, 12 cris qui s'accélèrent puis ralentissent |
| **Chauves-souris** | S6, entrée | Avec la nuée | Clics à 7-9 kHz très serrés, 0,6 s, plus un froissement (bruit passe-bande 3 kHz) |
| **Onça** | S8, 1396 | Une fois par tour, pas à chaque passage (un sur deux) | Bruit brun dans un passe-bande à 180 Hz, haché à 12 Hz (un râle scié), 1,2 s |
| Toucan | S1, grille | Sur la grille seulement | Croassement : carré à 400 Hz filtré, trois coups |

### L'eau, en synthèse

| Source | Où | Synthèse |
|---|---|---|
| **Grande chute** | ponctuelle au cirque (x 1036, z 215), portée 350 m | Bruit rose large : un grave (passe-bas 120 Hz) qui porte loin, un médium (passe-bande 900 Hz, Q 0,5) qui arrive à 150 m, un aigu (passe-haut 4 kHz) à moins de 60 m : le timbre s'éclaircit en approchant. Lente modulation (0,3 Hz, 15 %). Panoramique et distance sur le modèle de `voixLoin` (`audio.js:688`), sans Doppler |
| Rapides et seuils | trois ponctuelles (1280, 1327, 1374) et un lit de zone | Bruit passe-bande 1,5 à 3 kHz, modulé vite (4 Hz) ; plus clair que la chute |
| Gué | lit de zone 1590 → 1640 | Bruit passe-bande dont la fréquence saute au hasard entre 800 et 2000 Hz toutes les 80 ms : un clapotis |
| Marais | lit de zone | Aucun bruit d'eau : il est immobile. Ce sont les grenouilles qui disent l'eau |
| Entrée dans l'eau | 182, 1286, 1600 | Coup de bruit passe-bas (300 Hz) de 0,25 s, puis sifflement passe-haut qui retombe en 0,6 s |
| Feu de camp | ponctuelle (x 50, z −11), portée 40 m | Clics épars (bruit de 5 ms, 3 à 8 par seconde) sur un souffle passe-bas |
| Gouttes de la grotte | S6 | Sinus de 1,8 kHz qui tombe à 1,2 kHz en 40 ms, avec la réverbération du lieu. Inaudible sous le moteur : bonus |

Tout cela demande le socle 1 (zone transmise à `audio.js`, sources ponctuelles, réverbération par lieu) et une scène « chapada » dans le banc d'écoute (`ecoute/ecoute.js` n'en a pas).

### Écarté

- **Rayons de soleil dans la forêt.** Refusés deux fois par l'auteur. Si on les retente, un seul endroit (la trouée de la seconde épingle, 645 → 700), en disques tournés vers la caméra (`h.beams`), jamais en plans à bords droits.
- **Arc-en-ciel.** Le soleil est à 55° de haut (`astre.dir`, `cartes.js:531`) : un arc-en-ciel se forme à 42° du point opposé au soleil, donc entièrement sous l'horizon. On ne pourrait le voir qu'en regardant vers le bas dans des embruns, ce qui n'arrive nulle part sur le tour. Sur le pont, la chute est à contre-jour. Faux partout où on le poserait.
- **Lucioles.** Il est 9 h.
- **Pont qui tangue, lianes qui pendent sur la route.** Le premier ment au pilote, les secondes ont été retirées par l'auteur.

---

## 4. Mes ajouts, et ce qui a pu être oublié

1. **Le son de la chute avant la chute.** La demande dit « ambiance sonore de la cascade » : je propose qu'elle commence 6 secondes avant le pont, dans le haut des lacets, et qu'elle se coupe net dans la grotte. C'est le son qui relie les secteurs, ce que le cahier réclamait à l'image (G8).
2. **Les sons placés aux levers de pied.** À 7000 tr/min le moteur couvre tout. Chaque cri d'animal est posé sur un freinage ou sur la grille, là où on l'entendra.
3. **La grille de départ comme scène.** Voiture à l'arrêt, camp à dix mètres : feu, fumée, radio, toucan, cigales. C'est le seul moment où le joueur regarde le décor.
4. **L'onça.** La voiture s'appelle Onça et porte une robe de jaguar ; l'animal n'est nulle part sur la carte.
5. **Le roulement sur les planches du pont.** Trois secondes de martèlement de bois : le pont s'entend autant qu'il se voit.
6. **Les gouttes sur l'objectif** dans les embruns du pont et à la réception du saut : le moteur sait déjà les dessiner pour la pluie.
7. **L'acoustique de la grotte et de la place.** La même réverbération de tunnel sert à toutes les cartes ; ici une salle de 20 m de haut et une place entre des murs de pierre.
8. **La voiture qui sort de l'eau mouillée.** Le moteur lave déjà la saleté dans l'eau (`game.js:1115-1116`) ; il manque la traînée au sol derrière elle.
9. **Oublié dans la liste de la consigne : la boue.** La carte est « le matin après la pluie » et rien n'est boueux hors de l'eau. Hors périmètre vie (c'est une surface, donc du décor et de la physique), mais des flaques peintes sur les dalles avant et après chaque passage noyé prépareraient la traînée mouillée.
10. **Le vent unique.** Aujourd'hui seule la vapeur a un sens de vent. Le fixer (est → ouest) avant d'animer quoi que ce soit.

---

## 5. Relève du décor statique (à traiter avant)

Constats faits sur les plans, sans solution détaillée : c'est le travail de `METHODE-DECOR.md`.

**Vide.**
- **Les lacets (S4, 535 → 600 et 645 → 768)** : quatorze secondes du même couloir (plans 5, 7, 8, 9). Entre la tête colossale et la porte ruinée, aucun repère. Le ruisseau et son ponceau prévus n'ont pas été construits.
- **Le retour au camp (S10, 1640 → 1780)** : sept secondes de forêt nue entre le gué et le portique (plans 19, 20). Les « traces de l'expédition » (`decors-chapada.js:148` : une caisse, une barque) ne se voient pas à l'image.
- **Le haut de la descente (S7, 1069 → 1125)** : la sortie de grotte débouche sur une ligne droite de forêt sans rien avant l'idole (plan 13).
- **Le camp vu de la route** : sur les plans 1780, 15, 45 et 60, on ne voit ni les tentes, ni le feu, ni les 4×4. Ils sont à gauche, derrière le sous-bois, hors du champ de la caméra de course. Le camp ne « pose » pas l'ambiance au départ lancé ; à vérifier depuis la grille.

**Trop chargé ou cassé.**
- **Sortie de la grotte (`idx` 1068)** : de grands aplats orange et beige, sans texture, barrent l'image au portail de sortie. On dirait la façade ou un rocher de l'éboulis vu de l'intérieur, à contre-face. À regarder en premier : c'est un défaut visible à chaque tour.
- **Parois de la grotte (925, 1000)** : la texture `rocheGrotte` se lit comme un mur de carreaux avec des traits clairs horizontaux et verticaux ; les côtes de roche sont des pyramides jaunes posées devant. Ni grotte ni temple.
- **La chute vue de près (875)** : bandes de gros pixels verticales ; derrière le garde-corps elle occupe un tiers de l'écran sans relief.
- **La vapeur (835)** : tache brûlée (traitée en S5, mais c'est aussi un défaut d'image fixe).
- **Le marais (224)** : le reflet blanc du soleil sur l'eau est encore très fort à droite, déjà noté dans `ETAPE2-chapada.md`.
- **La barque** est posée en x −82, z 236 à la hauteur du terrain : à vérifier qu'elle est bien au bord de l'eau du gué.

---

## 6. Ce que la carte demande au socle, et ses pièges

**Demandes au socle commun.**

| N° | Demande | Pour |
|---|---|---|
| Socle 1 | Zone transmise à `audio.js` ; `AMB.chapada`, événements par zone ; sources ponctuelles avec distance et panoramique ; réverbération par lieu ; scène dans le banc d'écoute | Tout le son : chute, rapides, gué, feu, animaux, grotte, place, planches |
| Socle 2 | Horloge commune des shaders | Canopée qui respire, houppier du fromager |
| Socle 6 | `flou` ouvert aux décors, avec teinte | Embruns en travers du pont, fumée du camp |
| Socle 7 | `coule` sorti de chapada | Chapada en est le modèle : le sortir sans changer son comportement. Sortir aussi le générateur de `VAP` (« points qui montent »), réutilisé quatre fois ici |
| Socle 8 | Plans à plusieurs instants | `--rafale=6` existe déjà (1/30 s d'écart) : trop court pour juger une vapeur ou un envol. Il faut des écarts d'une demi-seconde |
| Nouveau | `h.lum(…)` rend le luminaire, pour moduler sa couleur dans le tick | Lueur du feu de camp et des braseros (aujourd'hui `lum` ne rend rien d'utilisable, `game.js:334`) |
| Nouveau | Gouttes d'objectif déclenchables par zone ou par événement, hors pluie | Embruns du pont, réception du saut (`game.js:134-135`) |
| Nouveau | Mouillure lisible par une matière de décor (`h.mat(…, { mouille: 1 })`) et longueur de fondu réglable | Bandes latérales `dallesBord`, traînées de sortie d'eau |
| Nouveau | Une surface de décor transparente dans la passe de reflets | Marais miroir |
| À vérifier | Son de roulement dans l'eau et choc d'eau à l'entrée d'une zone `aq` | Les trois passages noyés |

**Pièges propres à chapada.**

- **Les matières sont en cache par réglage** (`mat`, `decors-chapada.js:13`) : `coule` avance la texture d'une matière, donc de toutes les pièces qui la partagent. `ec` (écume) sert au bassin, aux sillages et aux rouleaux : on ne peut pas en accélérer un seul sans lui donner sa matière. `e1` et `e2` servent à toutes les chutes.
- **Deux `mat` différents** : le `mat` local met en cache, `h.mat` crée une matière neuve à chaque appel. Les secondes couches d'eau utilisent `h.mat` exprès (`decors-chapada.js:68, 70`) pour avoir leur propre texture ; un `mat` à la place les lierait à la première couche.
- **`coule` avance `m.map`** : si deux matières partagent la même texture (même nom, mêmes réglages de texture), elle avance deux fois plus vite. À vérifier pour toute nouvelle couche.
- **Les nappes sont fondues par matière à la fin** (`NAP`, `decors-chapada.js:19, 251-252`) : une nappe ajoutée après la ligne 251 n'est pas dessinée.
- **Les torches sont instanciées en une passe** (`decors-chapada.js:244`) et **marquent les freinages** (`decors-chapada.js:137-140`) : les faire vaciller toutes mettrait du mouvement aux points de freinage. Seuls le feu de camp et les braseros des portails vacillent ; ils sont posés à part.
- **`rythme.js` fait déjà battre les flammes** avec la grosse caisse (matière lumineuse opaque) : animer par l'échelle ou par `visible`, jamais par la couleur.
- **20 luminaires au plus** (`NL`, `game.js:35`) et la carte en déclare une trentaine : n'en ajouter aucun dans la grotte sans en retirer.
- **Le brouillard ferme à 190 m** (`fogD`, `cartes.js:529`) et à 130 m sur le pont et le gué (`th.brume`) : tout ce qui doit se voir de loin (panache, vautours) doit être posé hors brouillard, et la source sonore de la chute porte plus loin que l'image.
- **Le tunnel est au moteur** : sol, parois, voûte. Le décor ne peut qu'y poser des objets à moins de 0,8 m des parois (`decors-chapada.js:246`).
- **Le pont et la place sont les deux points de contact du peloton** (27 contacts en course simulée) : rien d'interactif ni de distrayant au ras du sol à ces endroits.
- **Balancement de la canopée et ombres** : les `cime` portent une ombre ; déplacées dans le vertex shader, leur ombre reste fixe tant que la matière de profondeur n'a pas le même déplacement. Et `eclaire` remplace `onBeforeCompile` sans l'enchaîner (`game.js:408`).
- **Écran partagé** : les envols sont déclenchés par la voiture du joueur 1 (le tick n'en reçoit qu'une) ; le joueur 2 les verra partir sans raison ou ne les verra pas.
- **Les envols se réarment par distance** (modèle pigeons : reposés quand la voiture est à plus de 300 échantillons) : sur un tour de 1792 échantillons c'est sans risque, mais le fantôme et les rivaux ne les déclenchent pas.
- **Le saut et les seuils** : la voiture est en l'air de 1280 à environ 1290 puis après chaque seuil ; la gerbe du moteur ne part qu'au sol. L'explosion d'eau à la réception doit être déclenchée par le retour au sol, pas par la présence dans la zone.

---

## 7. Ce que je n'ai pas vérifié

- **Aucun mouvement n'a été vu en continu.** Tout est jugé sur des images fixes et une rafale de 6 images à 1/30 s au pont, où la chute change à peine d'une image à l'autre. La vitesse apparente de la vapeur, de la rivière et du marais est déduite du code.
- **Rien n'a été écouté.** Les synthèses de §3 sont des recettes à régler au banc d'écoute, pas des sons validés. Je n'ai pas vérifié si un son d'eau existe déjà quand la voiture roule dans une zone `aq` (`audio.js:656` mentionne l'eau dans le roulement des pneus, non lu en détail).
- **`th.mouilleVisible` dans la grotte n'a pas été essayé.** Je déduis du code (`game.js:537`) que le sol du tunnel lira la mouillure ; le constat « rien ne se voit » du document moteur portait sur l'ancienne carte. Un plan avant/après le tranchera.
- **La gerbe forte à la réception du saut** : je n'ai pas vérifié si `fort` est déjà passé à l'atterrissage. Sur les plans 1285 et 1335 la voiture est en l'air et sans gerbe.
- **La visibilité depuis la trouée de la seconde épingle** (vautours, panache) : non vérifiée, le brouillard ferme bien avant la chute.
- **Le camp depuis la grille de départ** : les plans sont pris en roulant ; je n'ai pas de vue de la grille à l'arrêt.
- **Les aplats orange de la sortie de grotte** (`idx` 1068) : vus sur un plan, cause non cherchée.
- **Les numéros de ligne des autres cartes** ont été relevés par recherche dans les nouveaux fichiers `decors-<carte>.js` ; ceux de `game.js` et `audio.js` viennent de `METHODE-VIE.md` et de recherches ponctuelles, pas d'une relecture complète.
- **Les vitesses et freinages** viennent du pilote automatique de `sim.js` (un échantillon tous les 25) : un humain freine ailleurs.
- **Aucune mesure de performance**, comme convenu.
- **Les notes des trois autres sessions** : le dossier partagé était vide quand je l'ai lu.
