# Vie de Playa 307 (carte `plage`) : proposition

Étape 2 de `METHODE-VIE.md` : analyse seule, aucun code modifié. L'auteur coche les idées retenues.

**À savoir avant de lire**

- `decors.js` a été découpé pendant cette analyse (commit `ce210bc`) : le décor de plage est maintenant `decors-plage.js`. Toutes les lignes citées ici sont relues dans les nouveaux fichiers ; celles de `METHODE-VIE.md` pointent encore sur l'ancien `decors.js`.
- Les `idx` du cahier datent d'avant la refonte (1 290 échantillons). La piste en compte 1 240 aujourd'hui : les `idx` ci-dessous sont recalculés sur la piste actuelle.
- **La grande roue, le manège, le kiosque et la scène de la feria ne sont pas posés** : leurs quatre `pose(...)` sont tombés dans un commentaire de fin de ligne (`decors-plage.js:151`), et ce depuis le commit `5e8328a`. Leurs deux toits flottent seuls au-dessus de la place (`decors-plage.js:152`, vu sur `captures/plans/plage/525-vue.jpg`). À corriger côté décor avant d'animer la roue (section 4).
- Aucun personnage n'existe sur la carte, nulle part.
- Un vent pour toute la carte : **brise de mer, du nord (la mer, z < 0) vers le sud (la terre)**. Vagues, palmes, banderoles, fumées et cerfs-volants vont tous vers +z.

## Révision : caméra de course, puis validation par agents

**Ce tableau prime sur la grille plus bas.** Deux filtres ont été appliqués.

1. **Règle de l'auteur** (`METHODE-VIE.md`) : seul compte ce qui entre dans le champ de la caméra par défaut, sur la trajectoire. Les 63 idées ont été repassées sur un tour complet en caméra de course, une vue tous les 20 échantillons.
2. **Un agent par point**, avec une capture avant (code du dernier commit) et une capture après au même échantillon, en caméra de course, plus une rafale de trois vues. Consigne : refuser ce qui ne se lit pas. Trois tours ; ce qui a été refusé ou est resté indéterminé après reprise est retiré.

Les essais ont été faits dans le worktree `vie-plage` (branche du même nom, rien de commité). Captures : `captures/plans/plage/<point>.duo.jpg` dans ce worktree ; plans rejouables : `node outils/plan.js plage <point>`.

### Validé (17) et à décider (1)

« Champ » = échantillons d'où l'idée est visible en caméra de course.

| Point | Ce que le joueur voit | Champ (idx) | Verdict |
|---|---|---|---|
| FE-0 | La grande roue dépasse des toits au bout de la rue (décor : elle n'était pas posée). Fixe | 430 → 500 | validé |
| PL-1 | Rouleaux d'écume qui viennent du large, ressac sur la laisse | 188 → 361 en plein ; 110 → 188 et 1150 → 1240 en bande à gauche | validé |
| PL-4 | Cerfs-volants de 3 m, couleurs franches, au-dessus de la place de sable | 40 → 100, en haut à gauche ; quelques pixels depuis la ligne de départ | validés à 12 m par les agents, ramenés à 3 m à la demande de l'auteur (« au moins 4 fois trop gros ») |
| PL-9 | Nuée de mouettes posée sur la place, qui s'envole vers la piste quand la voiture approche | 30 → 90, à gauche | **à décider** : validé au 2e tour, indéterminé au 3e (petites tant qu'elles sont posées) |
| PL-10 | Gens sur le malecón, vendeur à vélo | 1180 → 180, à droite | validé |
| PL-13 | Confettis à la ligne | 1215 → 5 | validé |
| MU-1 | Écume sur la mer et au pied des pilotis du bord | 212 → 253 et 300 → 341, à gauche | validé |
| RU-1 | Guirlandes d'ampoules en travers de la rue | 382 → 511 | validé |
| RU-3 | Grill au bord du trottoir et sa fumée | 425 → 500 | validé |
| RU-4 | Foule au bord du trottoir, bras levés au passage | 418 → 506 | validé au 2e tour (refusée sous les auvents, derrière les comptoirs) |
| HA-3 | Vendeurs et clients sous la halle, entre la chaussée et les étals | 535 → 575 | validé au 2e tour |
| HA-5 | Piñata qui éclate en confettis devant la voiture | 545 → 556 | validé |
| R7-1 | Zopilotes qui tournent bas dans le couloir de la 307 | 650 → 720 | validé au 2e tour (refusés en altitude : des points) |
| R7-2 | Colonne de fumée de brûlis dans l'axe de la route | 635 → 740 | validé |
| CE-2 | Hirondelles qui s'envolent de la tranchée et passent au-dessus de la voiture | 735 → 764 | validé au 2e tour |
| CN-2 | Reflets d'eau qui dansent sur la voûte du cénote | 812 → 870 | validé |
| CN-6 | Baigneurs sur la plage du cénote | 850 → 865 | validé |
| LA-1 | Un groupe de flamants décolle et traverse la digue au-dessus de la route | 995 → 1040 | validé |

### Retiré

| Point | Pourquoi |
|---|---|
| FE-1, FE-2, FE-3, FE-4 roue qui tourne, manège, ampoules, public | La place n'est jamais dans le champ ; la roue ne se voit que de loin. Règle de l'auteur |
| PL-2 houle, PL-3 paillettes | Indéterminé et refusé : ne se distinguent pas de l'écume |
| PL-5 parachute ascensionnel | Refusé deux fois : quelques pixels jaunes |
| PL-6 ferry, barques | Hors champ ou à l'horizon |
| PL-8 oiseaux en vol au-dessus de la mer | Refusé trois fois, même rapprochés et grossis : des taches dans le ciel, au bord du champ. **La demande « oiseaux au loin sur la mer » ne tient pas en caméra de course** ; seuls passent les oiseaux qui traversent devant la voiture (CE-2, R7-1, LA-1, PL-9) |
| MU-3, RU-2 banderoles et papel picado au vent | Indéterminé : le battement ne se voit pas. PL-7 et LA-7 (palmes, mangrove au vent) tombent avec |
| MU-4 pélicans | Refusé trois fois : partis du champ dès l'envol |
| MU-5 promeneurs du muelle | Refusé : quelques pixels à droite |
| HA-4 piñatas qui se balancent, hamacs | Indéterminé deux fois : petites, masquées par le toit |
| HA-6, CN-3, CN-4 poussières, rayons, gouttes | Quelques points clairs |
| R7-3 fil et oiseaux | Indéterminé : 1 à 3 pixels |
| CE-3 comal, CE-4 lanternes | Refusé (comal hors champ) ; vacillement non jugeable |
| CN-1 rides du bassin | Indéterminé deux fois : se lit comme du grain. CN-2 porte seul l'eau du cénote |
| CN-5 hirondelles du puits | Au-dessus du champ |
| LA-2 poses des flamants, LA-4 hérons et kayaks, LA-3 crocodile | Refusés ou hors champ : la lagune est trop loin de la route |
| LA-5, LA-6 rides et paillettes de la lagune | Indéterminé ou indistinct |
| LA-9 flamants et gerbes du pont | Refusé : flamant coupé par le haut de l'image, gerbes d'un seul côté |
| Baigneurs en mer | Hors champ |

### Non réalisé, en attente du socle

Le son (PL-11, MU-6, RU-5, HA-1, R7-4, CE-1, CN-7, LA-8) et les objets à percuter (HA-2 dans la halle 540 → 572, RU-6 à l'entrée de la rue 405 → 415) demandent `audio.js` et `game.js`. PL-12 (objets dans la place) est déclassé : dans le champ seulement si on coupe.

### Ce que cette révision apprend

- **Ce qui passe est près de la piste ou la traverse** : foule au bord du trottoir, envols en travers de la route, confettis, fumée dans l'axe. Ce qui est à plus de 30 m sur le côté ne se lit pas.
- **La mer ne se voit que du muelle.** Sur la plage, elle n'est qu'une bande au bord de l'image.
- **La feria est hors champ.** La roue, le manège, le kiosque et la scène n'étaient pas posés (quatre `pose(...)` dans un commentaire, `decors-plage.js:151`). Posée, la roue se voit de la rue ; les trois autres jamais. À l'auteur de dire s'il les garde.

### Retours de l'auteur après essai

| Retour | Correction | Plan avant/après |
|---|---|---|
| Cerfs-volants au moins quatre fois trop gros | 12 m → 3 m, queue et fil à l'avenant | `C-volants` |
| La rue manque de stands ; un peu trop de gens | 14 étals au bord du trottoir (idx 420 → 503), deux fois moins de personnages dans la rue, un tiers de moins sous la halle | `C-rue`, `C-rue2`, `C-halle` |
| Couper le battement de `rythme.js` | `th.sansRythme` sur plage, deux lignes dans `rythme.js` | vérifié en jeu : aucun aplat modulé |
| De la vraie lumière, pas de la fausse | Luminaires du moteur (`h.lum`) : 13 sous les guirlandes de la rue, 3 aux grills (ils vacillent), 4 sous les puits du cénote (ils respirent). `lum` de `game.js` rend le luminaire, ligne reprise de `vie-chapada` | `C-ampoules`, `C-grill`, `C-cenote`, `C-cenote2` |

Les reflets en aplat sur la voûte du cénote (CN-2) restent, en plus des luminaires.

## Secteurs et zones calmes

| Secteur | idx (sur 1 240) | Cahier |
|---|---|---|
| S1 Plage et place de sable (départ en 0) | 1158 → 188 | Z1, Z1 bis |
| S2 Muelle | 188 → 361 | Z2 |
| S3 Rue de la Quinta | 361 → 511 | Z3, J2 |
| S4 Place de la feria | 511 → 535 | J3 |
| S5 Halle (le marché) | 535 → 575 | Z4 |
| S6 Route 307 | 575 → 734 | Z5 |
| S7 Entrée du cénote (guichet, tranchée, galerie) | 734 → 810 | Z6 |
| S8 Salle du cénote, galerie et tranchée de sortie | 810 → 965 | Z7 |
| S9 Digue de la lagune | 965 → 1158 | Z8 |

Zones où rien ne doit bouger ni clignoter (freinages et virages serrés, déduits de la courbure) : montée et épingle du muelle 235 → 300 ; entrée de la rue 395 → 415 ; sortie du bourg sur la 307 605 → 635 ; le S de la passerelle 800 → 865 ; retour sur la plage 1145 → 1180.

## 1. Demandes de l'auteur

| Demande | Réponse proposée | Idées |
|---|---|---|
| Vagues animées | Rouleaux d'écume qui montent sur la laisse et se retirent, houle autour du muelle | PL-1, PL-2, MU-1 |
| Oiseaux au loin sur la mer | Vols de frégates et de mouettes qui tournent, file de pélicans au ras de l'eau | PL-8, MU-4 |
| Bruit et objets au marché | Brouhaha et acoustique de halle, vendeurs et clients, cagettes et paniers qu'on envoie voler, piñatas qui se balancent | HA-1 à HA-5, FE-5 |
| Résonance et ambiance d'eau dans les cénotes | Réverbération propre au lieu, gouttes à écho, eau qui clapote, reflets d'eau sur la voûte | CE-1, CN-1, CN-2, CN-7 |
| Du nouveau chez les flamants | Un groupe s'envole en travers de la digue, les autres mangent tête dans l'eau | LA-1, LA-2, LA-9 |
| Meubler la zone vide de la plage, « conditionnée à rien » | Lu comme la place de sable (idx 30 → 150, 72 m de rayon, qu'on peut couper sans raison de le faire) : cerfs-volants au-dessus, nuée de mouettes qui s'envole quand on coupe, objets à percuter dans le sable mou. Le meublage fixe relève du décor (section 4) | PL-4, PL-9, PL-12 |

## 2. Grille par secteur

Priorités : **I** indispensable, **B** bien, **b** bonus. ★ = demande de l'auteur. « socle n » renvoie à la liste « À construire » de `METHODE-VIE.md`.

### S1 · Plage et place de sable (idx 1158 → 188). Moment fort : les rouleaux à gauche, les cerfs-volants au-dessus de la place

| N° | Famille | Ce que le joueur perçoit | idx | Brique | Prio |
|---|---|---|---|---|---|
| PL-1 ★ | Eau | Trois lignes d'écume naissent au large, avancent vers la plage, s'étalent sur le sable mouillé puis se retirent. À gauche de la voiture sur toute la plage | 1158 → 188 (rive z = −44) | socle 3. Version immédiate : rubans parallèles à la rive animés par `coule` (`decors-chapada.js:15`, tick `:253`) avec la texture `ecumeMer` (`textures-plage.js:32`, jamais utilisée). Remplace le liseré blanc fixe (`decors-plage.js:173`) | I |
| PL-2 ★ | Eau | La mer se soulève en longues ondes au lieu de neuf bandes plates | 1158 → 361 | socle 2 (horloge des shaders) ; les neuf nappes (`decors-plage.js:73-75`) n'ont que 4 sommets chacune : à retesseler près de la rive | B |
| PL-3 | Lumière | Paillettes de soleil qui scintillent sur la mer | 1158 → 361 | socle 2 | B |
| PL-4 ★ | Mécanique | Cinq ou six cerfs-volants vifs à 25-40 m au-dessus de la place, queue qui ondule ; repère visible du départ, du muelle et du retour de digue | 30 → 150 | queue : bande de sommets ondulante (aurores, `decors-givre.js:119`) ; balancement en sinus sur `dt` | I |
| PL-5 | Mécanique | Un parachute ascensionnel tiré par une lancha, au large | 1158 → 361 | `boucle` (`decors-wangan.js:213`, appel `:448`) | b |
| PL-6 | Mécanique | Le ferry de Cozumel traverse lentement et accoste ; les barques de la procession tanguent | 1158 → 361 | ferry déjà posé (`decors-plage.js:383`), `surChemin` (`decors-wangan.js:189`) ; barques (`decors-plage.js:382`) à sortir du lot commun | B |
| PL-7 | Mécanique | Les palmes des cocotiers penchent et battent dans la brise, sur toute la carte | tout le tour | socle 2 (vent en vertex shader) | B |
| PL-8 ★ | Vivant | Deux ou trois vols d'oiseaux de mer qui tournent haut au-dessus de l'eau, et une file de pélicans au ras des vagues, parallèle au rivage | 1158 → 361 | `boucle` + lot instancié, battement d'ailes par échelle (`setMatrixAt`, flammes de `decors-stade.js:137`) ; forme `mouette` à écrire d'après `pigeon` (`formes-paris.js:103`) | I |
| PL-9 ★ | Vivant | Une nuée de mouettes posée au milieu de la place de sable, qui s'envole quand on coupe à travers | 30 → 150 | pigeons de paris (`decors-paris.js:208-221`) | I |
| PL-10 | Vivant | Joueurs de volley à deux poses au filet, baigneurs sous les palapas du malecón, un vendeur à vélo qui longe la promenade | 1158 → 188 | figurants à deux poses (socle, voir section 5) ; `velo` (`formes-plage.js:85`, jamais posé) et livreur de paris (`decors-paris.js:205`) | B |
| PL-11 | Son | Ressac grave qui respire, plus fort côté mer ; cris de mouettes ; rumeur de plage | 1158 → 188 | socle 1 ; lit `AMB` et `ambEvent` (`audio.js:45, 513`). La plage n'est dans aucune zone `amb` (`cartes.js:542`) | I |
| PL-12 ★ | Interactif | Dans le sable mou de la place : ballons, châteaux de sable, bouées qu'on envoie valser. Une raison de couper | 30 → 150 | `th.objets` (`game.js:1050`), visuel et non synchronisé ; il ne pose qu'aux entrées de virage : placement par le décor à ouvrir (section 5) | B |
| PL-13 | Interactif | Pétards et confettis de la feria au passage de la ligne au dernier tour | 0 | confettis du stade (`decors-stade.js:108`) | b |

### S2 · Muelle (idx 188 → 361). Moment fort : la mer vivante tout autour, les pélicans de la voie retour

| N° | Famille | Ce que le joueur perçoit | idx | Brique | Prio |
|---|---|---|---|---|---|
| MU-1 ★ | Eau | Houle sous le tablier, écume au pied des pilotis | 212 → 341 | socle 3 (suite de PL-1 et PL-2) | I |
| MU-2 | Lumière | Scintillement de la mer des deux côtés | 212 → 341 | PL-3 | B |
| MU-3 | Mécanique | Les banderoles du muelle et du fil continu claquent au vent | 212 → 341, puis tout le tour | socle 2 ; rubans `guirlande` (`decors-plage.js:184, 218-223`) | B |
| MU-4 ★ | Vivant | Des pélicans posés sur le garde-corps de la voie retour plongent vers la mer quand on arrive. Jamais dans l'épingle | 305 → 335 | envol de paris (`decors-paris.js:208-221`) ; forme `pelican` à écrire | B |
| MU-5 | Vivant | Pêcheurs à la ligne et promeneurs sur l'allée centrale, clients au bar-palapa | 230 → 330 | figurants à deux poses | B |
| MU-6 | Son | Le roulement devient creux sur les planches dès la rampe ; ressac dessous ; mouettes | 200 → 350 | socle 1 ; la zone `amb` [3, 11] couvre déjà 188 → 361 ; roulement par surface (`audio.js:653-665`) | I |
| — | Interactif | Rien : épingle et tablier étroit | | | |

### S3 · Rue de la Quinta (idx 361 → 511). Moment fort : la foule de la feria sous les auvents

| N° | Famille | Ce que le joueur perçoit | idx | Brique | Prio |
|---|---|---|---|---|---|
| — | Eau | Rien | | | |
| RU-1 | Lumière | Guirlandes d'ampoules en travers de la rue (peu visibles à midi) | 415 → 511 | matière `ampoules` créée et jamais posée (`mAmp`, `decors-plage.js:125`) | b |
| RU-2 | Mécanique | Le papel picado frémit en vague au-dessus de la rue | 382 → 535 | socle 2 ; lot `L.fanions` redécoupé (`decors-plage.js:147, 409-416`) : animer par shader, pas par matrices | B |
| RU-3 | Mécanique | Fumée de grill au-dessus de deux ou trois étals, couchée par le vent | 430 → 500 | `h.vapeur` (`game.js:605`) | B |
| RU-4 | Vivant | Des gens des deux côtés, derrière la limite roulable, qui lèvent les bras au passage | 415 → 511 | figurants à deux poses ; levée à l'approche comme la ola (`decors-stade.js:103, 123`) | I |
| RU-5 | Son | Rumeur de rue en fête, pétards au loin, écho court entre les façades | 361 → 511 | socle 1 ; `ESP.plage` à écrire (`audio.js:596`) | B |
| RU-6 | Interactif | Cagettes et paniers au bord extérieur du virage d'entrée (immobiles tant qu'on ne les touche pas) | 405 → 415 | `th.objets` tel quel ; `sansCones` l'interdit aujourd'hui (`game.js:1056`) | b |

### S4 · Place de la feria (idx 511 → 535). Moment fort : la grande roue qui tourne

| N° | Famille | Ce que le joueur perçoit | idx | Brique | Prio |
|---|---|---|---|---|---|
| — | Eau | Rien | | | |
| FE-1 | Mécanique | La grande roue de 38 m tourne, nacelles d'aplomb ; visible du muelle, de la rue et de la digue | 300 → 535, 1000 → 1100 | rotor et nacelles de wangan (`decors-wangan.js:445-446`) ; roue à poser d'abord et à scinder (`formes-plage.js:125`) | I |
| FE-2 | Mécanique | Le manège tourne | 511 → 535 | `manege.rotation.y` (`decors-wangan.js:445`) ; forme `formes-plage.js:145` | B |
| FE-3 | Lumière | Ampoules de la roue qui courent | 511 → 535 | `visible` alterné (`decors-givre.js:128`) ; attention à `rythme.js` | b |
| FE-4 | Vivant | Public devant la scène, à deux poses | 511 → 535 | `map.offset.y` (`decors-stade.js:134`) | B |
| FE-5 ★ | Son | Orgue de manège et fanfare qui grandissent puis passent à droite | 480 → 560 | socle 1, source ponctuelle sur le modèle de `voixLoin` (`audio.js:688`) | B |
| — | Interactif | Rien : la place est hors piste | | | |

### S5 · Halle, le marché (idx 535 → 575). Moment fort : le son change sous le toit, les étals sont tenus

| N° | Famille | Ce que le joueur perçoit | idx | Brique | Prio |
|---|---|---|---|---|---|
| — | Eau | Rien | | | |
| HA-1 ★ | Son | Brouhaha dense dès le pignon, cris de vendeurs, acoustique mate et proche sous le toit de palmes ; tout retombe à la sortie | 535 → 575 | socle 1 ; la zone `amb` [18, 20] couvre déjà la halle ; `AMB.plage` et `ESP.plage` à écrire | I |
| HA-2 ★ | Interactif | Cagettes de fruits, paniers et piles de sombreros au ras de la chaussée, entre les poteaux, qu'on envoie voler. Ligne droite, pas un freinage | 540 → 572 | `th.objets` + placement par le décor (section 5) ; visuel, non synchronisé | I |
| HA-3 ★ | Vivant | Un vendeur derrière chaque étal, des clients dans les allées latérales | 535 → 575 | figurants à deux poses, robe teintée par instance comme `personnage` (`formes-perse.js:50`) | I |
| HA-4 ★ | Mécanique | Les piñatas se balancent sous le faîtage ; les franges de hamacs des pignons ondulent | 535 → 575 | piñatas : lot `pin` de 6 (`decors-plage.js:371`), balancement par `setMatrixAt` ; hamacs : cubes du grand lot `L.cubes` (`decors-plage.js:370`), à sortir | B |
| HA-5 | Interactif | Une piñata basse éclate en confettis quand la voiture passe dessous | ~555 | déclenché à l'approche (`decors-paris.js:221`) + confettis (`decors-stade.js:108`) | b |
| HA-6 | Lumière | Poussière dans les rais de soleil des jours du toit (les taches au sol existent déjà, ombres réelles) | 535 → 575 | socle 6 (`flou`, `game.js:712`) | b |

### S6 · Route 307 (idx 575 → 734). Moment fort : les vautours au-dessus de la crête

| N° | Famille | Ce que le joueur perçoit | idx | Brique | Prio |
|---|---|---|---|---|---|
| — | Eau, Lumière | Rien (plein midi, selva sèche) | | | |
| R7-1 | Vivant | Des zopilotes planent en cercle, haut, dans l'axe de la ligne droite de la crête | 660 → 734 | `boucle` (`decors-wangan.js:213`) | B |
| R7-2 | Mécanique | Une colonne de fumée de brûlis au loin au-dessus de la selva, couchée par le vent | 640 → 734 | `h.vapeur` (`game.js:605`) | B |
| R7-3 | Vivant | Des oiseaux quittent le fil électrique au passage | 650 → 720 | envol de paris ; poteaux `L.poteauxE` (`decors-plage.js:207`) ; il n'y a pas de fil aujourd'hui | b |
| R7-4 | Son | Cigales de selva qui montent à la sortie du bourg, cris d'urracas | 600 → 750 | socle 1 ; grillons de touge (`audio.js:515`) | B |
| — | Interactif | Rien (le tope de 589 existe) | | | |

### S7 · Entrée du cénote (idx 734 → 810). Moment fort : le son se referme puis résonne

| N° | Famille | Ce que le joueur perçoit | idx | Brique | Prio |
|---|---|---|---|---|---|
| — | Eau | Rien avant la salle | | | |
| CE-1 ★ | Son | Dans la tranchée le son se resserre ; dans la galerie la réverbération monte, courte et mouillée | 750 → 810 | socle 1, réverbération par lieu ; aujourd'hui la même que tous les tunnels (`audio.js:741`) | I |
| CE-2 | Vivant | Des hirondelles de grotte jaillissent de la bouche de la galerie à l'approche | 745 → 764 | envol de paris (`decors-paris.js:208-221`) | B |
| CE-3 | Mécanique | Fumée du comal au guichet ; lianes de la bouche qui se balancent | 735 → 764 | `h.vapeur` ; socle 2 | b |
| CE-4 | Lumière | Les lanternes vacillent, dans la galerie d'entrée seulement (rien après 800) | 769 → 796 | `color.setHex` (`decors-touge.js:282`) sur le verre (`decors-plage.js:350-351`) ; `rythme.js` peut l'écraser | b |
| — | Interactif | Rien | | | |

### S8 · Salle du cénote et sortie (idx 810 → 965). Moment fort : le grand puits de lumière au-dessus du gros rocher, dans l'axe en sortant de la galerie (idx 810 → 820)

| N° | Famille | Ce que le joueur perçoit | idx | Brique | Prio |
|---|---|---|---|---|---|
| CN-1 ★ | Eau | L'eau vit : clapotis lent en deux couches, léger courant vers la résurgence | 810 → 872 | `coule` (`decors-chapada.js:15`) sur la nappe du bassin (`decors-plage.js:320`) avec la texture `eauCenote` (`textures-plage.js:84`, jamais utilisée) | I |
| CN-2 ★ | Lumière | Des reflets d'eau dansent sur la voûte et les parois autour des puits : c'est ce qui dit « eau » à pleine vitesse | 810 → 872 | socle 2, ou couche additive animée par `coule` sur une peau dédiée | I |
| CN-3 | Lumière | Les rayons des puits respirent ; poussières et moucherons montent dans la colonne | 810 → 872 | opacité des cylindres (`decors-plage.js:353-355`) ; points qui montent (`VAP`, `decors-chapada.js:197`) | B |
| CN-4 | Eau | Des gouttes tombent des stalactites dans la lumière, ronds dans l'eau | 810 → 872 | socle 6 | b |
| CN-5 | Vivant | Des hirondelles tournent dans le grand puits | 810 → 830 | `boucle` | B |
| CN-6 | Vivant | Deux ou trois baigneurs sur la petite plage, dans l'axe de la passerelle | 845 → 862 | figurants | b |
| CN-7 ★ | Son | Résonance longue et claire (moteur et crissements renvoyés), gouttes à écho, clapotis, roulement sur planches ; tout s'ouvre d'un coup à la sortie | 810 → 913 | socle 1 ; l'ambiance est coupée en tunnel (`audio.js:905`) alors que le cénote est le tunnel | I |
| — | Interactif | Rien : S serré, passerelle de 10 m, frôler les parois remplit déjà la nitro | | | |

### S9 · Digue de la lagune (idx 965 → 1158). Moment fort : l'envol des flamants

| N° | Famille | Ce que le joueur perçoit | idx | Brique | Prio |
|---|---|---|---|---|---|
| LA-1 ★ | Vivant | À l'approche, un groupe de seize flamants décolle de l'eau, traverse au-dessus de la digue en file rose et noire et se repose de l'autre côté. Un seul groupe par tour | 1015 → 1040 (groupe de 1022, tronçon peu courbé) | envol de paris (`decors-paris.js:208-221`) ; forme `flamantVol` à écrire | I |
| LA-2 ★ | Vivant | Les autres groupes mangent : têtes qui plongent et se relèvent par petits paquets, quelques-uns marchent en file | 1000 → 1091 | `flamant(1)` (`formes-plage.js:69`, jamais posé ; tous sont en pose 0, `decors-plage.js:408`) ; alternance par échelle `setMatrixAt` ; `boucle` lente | I |
| LA-3 | Vivant | Un dos de crocodile glisse le long de l'enrochement, après le panneau CUIDADO COCODRILOS | 985 → 1010 | va-et-vient le long de la route (`decors-wangan.js:443-444`) ; forme à écrire | B |
| LA-4 | Vivant | Hérons sur les racines, kayakistes qui pagaient | 1000 → 1100 | kayaks posés (`decors-plage.js:197`) ; figurants | b |
| LA-5 | Eau | Rides lentes sur la lagune ; l'eau turquoise de la résurgence coule sous le pont | 965 → 1126 | `coule` sur `mLagune` (`decors-plage.js:40`) et sur les nappes du pont (`decors-plage.js:251`) | B |
| LA-6 | Lumière | Scintillement entre les palétuviers | 965 → 1126 | PL-3 | b |
| LA-7 | Mécanique | Houppiers de mangrove et palmes dans le vent | 965 → 1158 | PL-7 | b |
| LA-8 | Son | Insectes et grenouilles, cancanement des flamants (plus fort à l'envol), clapotis | 965 → 1126 | socle 1, source ponctuelle sur le groupe | B |
| LA-9 ★ | Interactif | Au saut du pont en dos d'âne : gerbes d'eau des deux côtés à la réception, et le dernier groupe de flamants s'envole | 1085 → 1110 | réaction au saut (étincelles du stade, `decors-stade.js:100`) ; socle 6 pour la gerbe | B |

## 3. Mes ajouts au-delà des demandes

- **Des gens.** La carte n'a aucun personnage. Avec le son, c'est ce qui manque le plus au « festif » (G3 du cahier). RU-4, HA-3, FE-4, MU-5, PL-10.
- **La grande roue qui tourne** (FE-1) : le seul repère vu de trois secteurs. Encore faut-il la poser.
- **Le son par surface** : planches du muelle et de la passerelle (MU-6, CN-7). Peu de travail, perçu à chaque tour.
- **Les cerfs-volants** (PL-4) : donnent un haut à la plage, qui est plate, et signalent la place de loin.
- **Les reflets d'eau sur la voûte** (CN-2) : l'eau du cénote se voit peu depuis la passerelle dans le S ; la voûte, elle, est toujours dans le champ.
- **Le ferry et le parachute** (PL-5, PL-6) : du mouvement lent au large, lisible à toute vitesse.
- **Le crocodile** (LA-3) : le panneau l'annonce, rien ne le paie.
- **La réaction au saut du pont** (LA-9) : le seul saut de la carte ne déclenche rien.
- **Oublis possibles de l'auteur** : la route 307 (160 échantillons sans rien qui bouge ni sonne, R7-1 à R7-4) ; le son de la plage elle-même, hors de toute zone `amb` (PL-11) ; la sortie de la grotte, où le son devrait s'ouvrir d'un coup.

## 4. Zones qui relèvent du décor fixe, à traiter avant la vie

**Vides**

- **Place de la feria (511 → 535)** : grande roue, manège, kiosque et scène absents (`decors-plage.js:151`), toits flottants (`:152`). Une esplanade nue avec une rangée d'étals : le « vide » J3 du cahier est revenu.
- **Place de sable (30 → 150)** : 150 m de sable nu à gauche de la piste, quatre petits groupes de piles au bord. Il lui faut un usage fixe (terrain de foot de plage, rangées de parasols, tribune de la feria) ; la vie ne suffit pas à la remplir.
- **Route 307, crête (640 → 734)** : mur végétal uniforme des deux côtés, trois panneaux pour seuls repères.
- **Sortie de la tranchée (935 → 1000)** : talus de roche puis massifs verts, rien d'autre jusqu'aux premiers palétuviers.
- **Allée centrale du muelle (212 → 341)** : bancs et lampadaires seulement sur un tablier large.
- **Étals** : marchandises en cubes gris vus de près (`captures/plans/plage/520-vue.jpg`) ; dans la halle, étals espacés de 8 m, loin des « étals serrés » des sources.

**Trop chargé** : rien de net. La rue (papel picado, auvents, banderoles) est dense mais se lit bien.

**Formes à écrire** (elles n'existent pas) : oiseau de mer en vol, pélican, flamant en vol, crocodile, cerf-volant, un ou deux personnages de plage (vendeur, baigneur ; à défaut `passant` de `formes-touge.js:32` et `fetard` de `formes-wangan.js:43`).

## 5. Ce que la carte demande au socle, et ses pièges

**Demandes au socle**

1. **Son par zone** : six lits (mer, rue et feria, halle, selva, cénote, lagune) là où `M.amb` n'a que trois zones et un seul lit par carte. `AMB.plage` et `ESP.plage` n'existent pas (repli sur `essai`). Il faut un lit autorisé **en tunnel** (`audio.js:905` coupe l'ambiance sous la voûte) et une réverbération de cénote distincte de celle du tunnel commun (`audio.js:741`), en deux tailles : galerie, salle.
2. **Sources sonores** : ponctuelles (manège, flamants, ferry), et une source **en ligne** pour le ressac (distance à la rive z = −44). Les décors n'appellent jamais le son : il faut un appel du genre `h.son(nom, x, y, z)` pour l'envol des flamants et la piñata.
3. **Horloge des shaders** : houle, scintillement, palmes, banderoles, papel picado, reflets d'eau. Elle porte neuf idées de cette carte.
4. **Vagues et écume de rive** : rive droite est-ouest (z = −44) plus le tour des pilotis ; lagune à rive polygonale (`LAG`) ; bassin du cénote sous voûte, sans reflet du ciel.
5. **Particules ouvertes** (`flou`) : gerbe du pont, gouttes, poussière dans les rais.
6. **Aides communes** : `coule`, `boucle`, et surtout **l'envol à l'approche** de paris, qui sert cinq fois ici (PL-9, MU-4, R7-3, CE-2, LA-1). **Figurants à deux poses instanciés** : six idées, et le bazar de perse en a besoin aussi.
7. **Objets percutables posés par le décor** : `th.objets` ne pose qu'au bord extérieur des entrées de virage, 14 places au plus (`game.js:1055-1057`). Sans liste de positions fournie par le décor, rien dans la halle ni sur la place de sable.
8. **Voir le mouvement** : `--rafale` prend ses images à 1/30 s ; pour des vagues ou un envol il faut un pas réglable.

Le mouillé en pente et les phares dans la brume ne concernent pas plage.

**Pièges propres à plage**

- **Pas de tick** : la fonction ne renvoie rien (`decors-plage.js:9-10, 418`). Le renvoyer après le redécoupage.
- **Lots redécoupés** (`decors-plage.js:410-416`) : tout lot de plus de 120 instances est remplacé par des lots par case de 350 m ; la référence gardée pointe sur un objet retiré de la scène. Créer les lots animés après cette boucle, ou les marquer et les en exclure. Les flamants (96) passent sous le seuil aujourd'hui : en ajouter les ferait basculer.
- **Culling** (`decors-plage.js:417`) : chaque lot reçoit une sphère englobante calculée une fois. Un lot dont les instances se déplacent (envols, oiseaux en boucle) sort de sa sphère et disparaît : `frustumCulled = false` ou recalcul.
- **Fusion du décor** : tout ce qui bouge porte `userData.dyn = 1` (`game.js:1147`).
- **Grande roue d'un seul tenant** (`formes-plage.js:125`) et non posée : la scinder en rotor (jantes, rayons, moyeu), nacelles instanciées, pied fixe. Elle est posée à l'échelle 1,6 et tournée de π/2 : l'axe de rotation est son Z local. Le manège (`formes-plage.js:145`) peut tourner d'un bloc ; son toit est un lot à part.
- **Mer en neuf nappes de 4 sommets** : pas de houle par sommets sans retesseler. Les matières viennent de `grain()` : faire défiler leur texture toucherait tout ce qui la partage. Prendre des textures dédiées (`ecumeMer`, `eauCenote`).
- **Eau du cénote transparente sans écriture de profondeur** (`decors-plage.js:320`) : ordre de rendu à régler avec les reflets et les particules.
- **Luminaires** : les lanternes du cénote demandent déjà environ 25 `h.lum` pour un plafond de 20. Aucune lumière ponctuelle en plus.
- **`rythme.js`** réécrit la couleur des `MeshBasic` opaques : verres des lanternes, ampoules, fond du bassin.
- **Radio** : cumbia, reggaeton ou surf rock jouent pendant la course. Une fanfare de feria tonale se battrait avec elles : préférer du non tonal, ou la filtrer fort.
- **Place de sable** : ses piles sont heurtées par `sim.js` (`cartes.js:545`). Tout ajout réellement percutable touche `sim.js`, la trace or et les fantômes : rester en visuel.
- **Écran partagé** : les envols suivent le joueur 1 seul. **Trafic** : `h.temps()` vaut −1 en course, donc rien qui roule sur la piste.
- **Hamacs, lianes, sargasses, marchandises** sont des cubes du lot `L.cubes` (plusieurs centaines, redécoupé) : les sortir avant de les animer.

## 6. Ce que je n'ai pas vérifié

- **Les vitesses réelles.** `outils/plan.js` arrive à environ 80 km/h partout. Les zones de freinage viennent de la courbure, pas d'un tour chronométré : « perceptible à pleine vitesse » reste un jugement sur images fixes.
- **Le son.** Rien écouté, `ecoute.html` non lancé. Tout ce qui touche `audio.js` est lu dans le code.
- **Le mouvement.** Aucun plan en rafale ; je n'ai pas cherché si quelque chose scintille déjà.
- **Le sens de « conditionnée à rien »** : lu comme la place de sable. Si l'auteur parlait d'un autre endroit de la plage, PL-4, PL-9 et PL-12 sont à déplacer.
- **Les textures inutilisées** (`ecumeMer`, `eauCenote`, `merTurquoise`, `lianes`, `rayon`) : leur absence d'usage est vérifiée, pas leur aspect.
- **Le partage de la texture `bruit`** entre matières issues de `grain()`.
- **Le compte des luminaires** : calculé à la main d'après la boucle `decors-plage.js:350`.
- **La date du défaut de la feria** : présent dès `5e8328a` d'après git ; je ne sais pas si l'auteur a validé le décor en le voyant.
- **Ce qu'on voit de la roue** depuis le muelle et la digue : impossible à juger, elle n'est pas posée.
- **Écran partagé, jeu en ligne, fantômes** : non essayés.
- **Les performances** : hors périmètre, comme décidé.

Captures de cette analyse : `captures/plans/plage/` (`tour-1.jpg`, `tour-2.jpg`, deux planches de plans ciblés, quatre vues d'inspection).
