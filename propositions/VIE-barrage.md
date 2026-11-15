# Vie — Barrage 74 (`barrage`) : analyse

Étape 2 de `METHODE-VIE.md`. Lecture seule : aucun code modifié, rien de commité. Chaque idée porte un numéro (V-01…) et se coche seule.
Priorités : **I** indispensable, **B** bien, **+** bonus.

## Repères

- État regardé : `main` à `19bd9dd`. **Le dépôt a changé pendant l'analyse** : `decors.js` a été découpé, le décor de barrage est maintenant dans `decors-barrage.js` (ancienne ligne de `decors.js` − 2044). Toutes les lignes ci-dessous ont été reprises par `grep` sur `19bd9dd`. Celles de `METHODE-VIE.md` qui citent `decors.js` sont périmées.
- Piste : 2 908 échantillons de 2 m (5 816 m). **Les `idx` du cahier (0 à 2 371) datent de l'ancien tracé et ne valent plus** ; ceux de ce fichier sont calculés sur le tracé actuel (`buildTrack`, points nommés `K`, `decors-barrage.js:18`).
- Aujourd'hui rien ne bouge : la fonction ne renvoie pas de tick (elle finit sur `fond()`, `decors-barrage.js:525`), aucune entrée `barrage` dans `AMB` ni `ESP` (`audio.js:45`, `596`), `phares: 0` (`cartes.js:504`), pas de clé `trafic`.
- Regardé avec `outils/plan.js` : le tour (20 plans), 28 plans ciblés, 4 vues de côté, et un essai de route mouillée en pente par l'option d'URL `opt=` (captures dans `captures/plans/barrage/` et `captures/plans/barrage/essai-mouille/`).
- Temps de passage : tour du pilote automatique, 117,2 s (`tourRef`).

### Secteurs du cahier sur le tracé actuel

| Secteur | Zone du cahier | idx actuels | Temps (tour de référence) |
|---|---|---|---|
| S1 Cité, départ | 1 (départ) | 2594 → 208, par la ligne | 104,8 s → 8,8 s |
| S2 Route de la vallée | 1 (vallée aval) | 208 – 571 | 8,8 – 21,7 s |
| S3 Salle des turbines | 3 | 571 – 644 | 21,7 – 25,1 s |
| S4 Quai, garnison, bassin, pont | 2 (déversoir, pied du mur) | 644 – 818 | 25,1 – 32,4 s |
| S5 Montée : rampe, ravin, traverse | 4 (jusqu'au tunnel) | 818 – 1436 | 32,4 – 59,0 s |
| S6 Tunnel | 5 | 1436 – 1578 | 59,0 – 63,8 s |
| — | 6 (après le tunnel, montée) | **n'existe plus** : le tunnel débouche sur la crête | |
| S7 Crête | 7 | 1578 – 1861 | 63,8 – 72,5 s |
| S8 Descente | 8 | 1861 – 2594 | 72,5 – 104,8 s |

Freinages et virages serrés (rayon sous 50 m), où rien ne doit bouger ni clignoter : 104-152 et 2659-2889 (zigzag de la cité), 383-402 (S de la vallée), 553-650 (entrée et slalom de la halle), 753 et 812 (pont), 984, 1094-1138 (ravin), 1267, 1532 (tunnel), 1895-1919 (culée), 2098 (épingle haute), 2288-2324 (belvédère), 2410-2530 (carrière).

Vent de la carte : **du lac vers l'aval, nord → sud**. Il pousse déjà les embruns du bassin vers le pont mouillé ; drapeaux, fumées, brume et embruns le suivent tous.

---

## 1. Les six demandes de l'auteur

### D1 — Phares dans le brouillard de la crête (S7, idx 1578 – 1861)

Zone `brume: [[68, 74, 0, 85]]` (`cartes.js:505`) : on voit à 85 m, fondu de 180 m aux deux bouts. Aujourd'hui aucune voiture n'a de feux (`NUIT = TH.phares / 2.6`, `game.js:335`) et les têtes de lampadaire sont allumées sans halo (retirés après essai, en plein jour ils rendaient mal).

| N° | Ce que le joueur perçoit | idx | Brique | Prio |
|---|---|---|---|---|
| V-01 | Les feux arrière des rivaux : deux points rouges à halo qui sortent du blanc, 1 s avant la voiture | 1578 – 1861 | Socle 5. Les feux existent (`game.js:771`, lueur × `TH.phares / 0.4`, nulle ici) : il faut une force de feux **par zone**, qui suit le brouillard (`kBr`, `game.js:1956`) | **I** |
| V-02 | Ses propres phares : la tache de lumière sur la chaussée et deux cônes pâles qui se perdent dans la brume | 1578 – 1861 | Socle 5. Tache au sol : shader existant (`game.js:381-387`), même force par zone. Cônes : à construire (rien pour la voiture du joueur) | **I** |
| V-03 | Une chaîne de halos orange : trois lampadaires visibles devant soi, qui dessinent l'arc de la crête | 1584 – 1890, un tous les 28 m | Un lot de sprites additifs (`h.addMat`) posés sur les lampes de `lampes` (`decors-barrage.js:186-188`), opacité = brouillard de la vue, par `tick.vue(car)` (modèle `decors-wangan.js:457`) | **I** |
| V-04 | La chaussée humide de brume renvoie ces halos et les feux rouges | 1578 – 1861 (plat) | Zone `surf` mouillée légère sur les points 68-75 ; marche déjà sur le plat (voir D2). Effet sur l'adhérence à mesurer | **I** |
| V-05 | Catadioptres sur les parapets : une ligne de points qui s'allume dans les phares | 1578 – 1861 | Lot `catadioptre` existant (`decors-barrage.js:178-179`), qui saute aujourd'hui la crête (`surMur`) | **B** |
| V-06 | Des nappes de brume qui traversent la route, du lac vers le vide | 1600 – 1830 | Forme `brume` (`formes-barrage.js:18`) en lot mobile (`userData.dyn`), dérive sur `dt` ; ou particules ouvertes (socle 6) | **B** |
| V-07 | Un gyrophare orange lent en haut de chaque portique, vu à travers le voile | ≈ 1677 et ≈ 1770 | Rotation continue (modèle phare `decors-wangan.js:355`). Loin du freinage de la culée (1895) | **+** |

Piège propre : le voile de brume du moteur (`voileBr`, `game.js:319`, `renderOrder` 50) passe après les objets transparents. Un halo additif sans écriture de profondeur risque d'être recouvert : lui donner un ordre supérieur. À vérifier au premier essai.

### D2 — Route mouillée en pente

**Constat, par essai.** J'ai forcé la mouillure sur la rampe (+7,3 %) et sur la descente (−7 %) avec `opt=` : **les reflets s'affichent en côte comme en descente**, en rendu net et en rendu du jeu (`essai-mouille/960.jpg`, `1960.jpg`, `960-1960-2200.jpg`). La cause notée dans `METHODE-VIE.md` ne tient donc qu'à moitié :

- `plat = step(.8, n.y)` (`game.js:366`) ne coupe rien sur cette carte : à 8 % de pente, `n.y` vaut 0,997. Il ne joue qu'au-delà de 75 % de pente.
- `R.up.value.set(0, 1, 0)` (`game.js:2053`) : le plan de réflexion est bien la verticale du monde. Les reflets ne disparaissent pas, ils sont **décalés** de deux fois la pente (8° environ à 7 %). Faux, mais présent.
- **La vraie raison sur cette carte est le zonage** : la seule zone mouillée est `surf: { zones: [[39, 42, 'mouille', 1]] }` (`cartes.js:484`), le pont, qui est plat. La pente commence exactement où la mouillure finit.

**Où sont les zones mouillées en pente aujourd'hui** : une seule, la sortie du pont, **idx 815 – 850** (pente de 2 à 7,9 %). La mouillure y tombe de 0,09 à 0,01 (plein = 0,10) : sur les plans 826 et 845, la chaussée est seulement plus sombre, sans reflet.

| N° | Ce que le joueur perçoit | idx | Brique | Prio |
|---|---|---|---|---|
| V-08 | Le bas de la rampe reste mouillé par les embruns : les mélèzes se reflètent dans la côte | 818 – 900 (+7 %) | `surf.zones` étendue au point 45, `th.pluie` de même (`cartes.js:484`, `502`). Marche sans toucher au moteur | **I** |
| V-09 | La sortie du brouillard brille encore dans le S de la culée et le début de la descente | 1861 – 1960 (−7 %) | Même réglage, points 75-79. **Freinage de la culée (1895)** : l'adhérence change, `vit`, médailles et trace or à refaire | **B** |
| V-10 | Les reflets tombent juste en pente (pied des arbres raccordé à son image) | toutes les pentes mouillées | Socle 4, réduit : dans la passe `ssr` (`game.js:185-213`), prendre la normale de la chaussée (dérivées de la profondeur) au lieu de `up`. Quelques lignes, partagé avec chapada | **B** |

Non reproduit : la perte de reflet « quand la texture de route est lissée » notée dans `ANALYSE-barrage.md`. Avec `routeTex: 'chausseeGES'` les reflets sont là sur le pont (plan 790).

### D3 — Gare, rails, trains : section 2.

### D4 — Radars et antennes de la base (S4, idx 681 – 745, à gauche)

La parabole est un `Mesh` fixe posé dans la scène (`decors-barrage.js:372`), sa tour et ses lance-roquettes aussi (`373-375`).

| N° | Ce que le joueur perçoit | idx | Brique | Prio |
|---|---|---|---|---|
| V-11 | Une antenne de veille en râteau qui tourne vite (un tour en 4 s) sur le toit de l'état-major, vue dès la sortie de la halle | 665 – 700 | Forme neuve en boîtes (`radarVeille`), groupe `userData.dyn`, rotation sur `dt` (modèle rotor `decors-terre.js:135`) | **I** |
| V-12 | La grande parabole balaie lentement (un tour en 15 s) | 720 – 750 | Mettre le `Mesh` de la ligne 372 dans un groupe `dyn` qui tourne autour de sa tour | **B** |
| V-13 | Le drapeau rouge de l'état-major claque au vent | 686 – 700 | Aide « drapeau » (V-60) | **B** |
| V-14 | Une sentinelle au garde-à-vous devant le portail à étoiles | 716 | Forme `passant` ou `figurant` d'une autre carte, reteinte kaki ; fixe | **+** |

**Attention** : la parabole (z = 258) est à l'extérieur du virage d'entrée du pont (freinage, idx 753). C'est pourquoi le mouvement rapide est proposé plus tôt (V-11) et la parabole en balayage lent. Si l'auteur veut la parabole rapide, l'échanger de place avec la première butte de missiles (z = 165) : c'est du décor.

### D5 — Turbines qui tournent, et leur bruit (S3, idx 571 – 644)

Trois groupes en marche (`G3`, `decors-barrage.js:151-152`), deux à l'arrêt (couvercles, `154`). Une cuve d'alternateur ne tourne pas ; ce qui tourne et se voit, c'est le haut de l'arbre.

| N° | Ce que le joueur perçoit | idx | Brique | Prio |
|---|---|---|---|---|
| V-15 | Sur chaque groupe en marche, le collier rayé orange et noir et l'excitatrice rouge tournent d'un mouvement régulier, à 4 m de la voiture ; les deux groupes à l'arrêt ne bougent pas | 583, 608, 632 | Sortir `collier` et `excitatrice` de `inst()` (figés par la fusion, `game.js:1147`) : six pièces dans trois groupes `dyn`, `rotation.y += dt × ω`. Ne pas animer la texture : `bandeOrange` sert aussi aux linteaux (`145`) et aux portes du tunnel (`345`) | **I** |
| V-16 | Le bourdonnement des groupes passe d'une oreille à l'autre dans le slalom (droite, gauche, droite), dans la résonance de la halle | 571 – 644 | Socle 1 : trois sources ponctuelles (50 Hz et harmoniques, sifflement), sur le modèle de `voixLoin` (`audio.js:688`) ; acoustique de halle dans `ESP` (`audio.js:596`), réverbération par lieu | **I** |
| V-17 | Le grondement monte en approchant de la halle et tombe à la sortie | 540 – 665 | La même source, avec distance et occlusion | **B** |

**Attention** : toute la halle est un slalom (virages serrés à 580, 603, 629). La rotation doit rester lente et continue (un demi-tour par seconde au plus), sans voyant qui clignote. C'est une demande de l'auteur : à lui de juger manette en main.

### D6 — Bruit des chutes d'eau

Trois jets (pas quatre : `XS = [-136, -115, -94]`, `decors-barrage.js:123`) tombent dans le bassin (x de −150 à −80, z de 30 à 200).

| N° | Ce que le joueur perçoit | idx | Brique | Prio |
|---|---|---|---|---|
| V-18 | Un grondement grave à droite dès la sortie de la halle, au plus fort le long du quai et sur le pont, qui s'éteint dans la rampe | 644 – 950, maximum 655 – 716 et 776 – 818 | Socle 1 : une source ponctuelle large (bruit filtré) au centre du bassin (−115, 12, 110), avec distance, panoramique, occlusion par la halle et le tunnel | **I** |
| V-19 | Sur la crête, dans le brouillard, la chute gronde **en contrebas à droite** sans qu'on la voie | 1640 – 1665 | La même source (83 m sous la route) | **I** |
| V-20 | Face au mur dans la traverse du belvédère, le grondement revient de loin | 2139 – 2295 | La même source | **B** |

---

## 2. Les trains

### Ce qui existe

- Une voie de desserte à droite de la route de la vallée, **idx 230 – 437**, à 9,6 m du bord : deux rubans de rail et un ruban de ballast (`decors-barrage.js:430`), un train de marchandises à l'arrêt en cubes (locomotive verte, citernes, tombereaux, couverts, `431-436`).
- Le terminus du tramway, **idx 449 – 537**, à 6 m du bord : voie, poteaux de caténaire, fil, une motrice rouge et crème en cubes à l'idx 479 (`449-454`).
- Tous ces cubes passent par `T()` puis `bl()` et finissent dans la liste `peints` (`219`), dessinée en un seul lot (`492`) que le jeu fond ensuite avec le reste du décor.

### Tracé proposé : une double voie « cité – centrale » de 650 m, le long de la route de la vallée

- **Par où** : on garde la plate-forme existante, à droite (côté est) de la route, de la sortie de la cité (**idx 214**) à l'arrêt de la centrale (**idx 537**). Voie 1 à 8,75 m du bord (les rails actuels), voie 2 à 12,2 m. La voie du tramway (aujourd'hui à 5,2 m) est ramenée sur cet alignement : une seule emprise, deux voies.
- **La voie ne croise jamais la chaussée** (décor pur, pas de passage à niveau). Elle longe la route à 10 m sur 650 m, suit son S (rayon de 40 à 60 m : c'est un embranchement d'usine, à l'échelle 1/2,5 du site).
- **Gare** au bout sud, dans le coin entre la route de la vallée et la route de la descente (x de 300 à 385, z de 615 à 700, terrain plat) : trois voies en impasse de 80 m, deux quais.
- **Arrêt « ГЭС »** au bout nord, idx 500 – 537 : un quai, deux heurtoirs. Rien de neuf au-delà de 537 : le plan du mur qui grossit reste dégagé.

### Où on voit les trains

| Endroit du tour | idx | Comment |
|---|---|---|
| La gare, à droite en sortant de la cité | 208 – 250 | De plain-pied, à 10-60 m |
| Le long de la route de la vallée | 214 – 537 | À droite, à 10 m, sur 650 m |
| La descente, après l'épingle du belvédère | 2325 – 2420 | En plongée à droite, à 105-180 m, 25 m plus bas |
| La gare, avant d'entrer dans la cité | 2500 – 2594 | En contrebas à droite, à 20-100 m |
| La traverse du belvédère (bonus) | 2139 – 2288 | Devant à gauche, à 300 m, dans la brume : on ne voit que le phare |

### Deux rames, calées sur le joueur

Chaque rame roule sur `dt` à vitesse constante et attend à quai. Son départ est donné par deux bornes du tour que franchit la voiture (brique « déclenché à l'approche », `decors-paris.js:217`), pour qu'on la retrouve à chaque tour quel que soit le chrono. Entre la borne et la rencontre il se passe 6 à 15 s : l'écart d'un pilote lent reste petit. Pas de saut de position : une rame en retard ou en avance règle sa vitesse de 30 % au plus.

| Rame | Voie | Borne | Ce qu'elle fait | Rencontre |
|---|---|---|---|---|
| A, motrice électrique et sa remorque, rouge et crème, 60 km/h | 2 | idx 60 (2,3 s) | Quitte la gare vers le nord | **Doublée** par le joueur vers idx 250 – 320 |
| B, marchandises (locomotive verte et six wagons, 85 m), 40 km/h | 1 | idx 60 | Quitte l'arrêt « ГЭС » vers le sud | **Croisée** vers idx 440 – 480, avec son klaxon |
| B | 1 | — | Arrive en gare vers 61 s (le joueur est dans le tunnel), reste à quai | **Vue à quai** depuis la descente, idx 2500 – 2594 |
| A | 2 | idx 2200 (88 s) | Quitte l'arrêt « ГЭС » vers le sud | **Vue d'en haut**, roulant dans le même sens que le joueur, idx 2343 – 2420 |

Les deux rencontres de la vallée tombent dans les deux fenêtres sans freinage (214 – 340 et 420 – 520), de part et d'autre du S (383 – 402). C'est le moment fort de S2.

| N° | Idée | idx | Brique | Prio |
|---|---|---|---|---|
| V-21 | Double voie continue de la gare à l'arrêt « ГЭС », avec traverses et ballast | 214 – 537 | Rubans existants (`430`, `451`) prolongés ; une texture neuve `voieGES` (ballast et traverses) à la place du `bruit` uni | **I** |
| V-22 | Rame A doublée, rame B croisée | 250 – 320, 440 – 480 | Lot mobile (voir « sortir du lot ») ; position par abscisse le long d'un chemin, comme `surChemin` (`decors-wangan.js:189`) ; bornes par `car.idx` | **I** |
| V-23 | Rame A vue d'en haut, rame B à quai | 2343 – 2420, 2500 – 2594 | Le même horaire, seconde borne | **I** |
| V-24 | Le roulement et le klaxon de la rame croisée, avec effet Doppler | 420 – 500 | Socle 1 : source ponctuelle **mobile**, exactement le cas de `voixLoin` (`audio.js:688`) | **I** |
| V-25 | Phare de locomotive allumé, fenêtres de la motrice éclairées | partout où on la voit | Matière `lampe` lumineuse ; pour les fenêtres, la texture d'émission `panneauKlum` | **B** |
| V-26 | La gare : bâtiment, quais, marquise, horloge, passerelle | 208 – 250, 2500 – 2594 | Décor statique (section 5) ; la forme `treillisPont` (`formes-barrage.js:36`), jamais posée, fait la passerelle | **I** (avec V-21) |
| V-27 | Des voyageurs sur le quai | 208 – 250 | Formes `passant`, `figurant` d'autres cartes | **+** |
| V-28 | Le sifflet d'un train monte de la vallée quand on est sur la crête ou dans une trouée de la traverse | 1235, 1298, 1360, 1700 | Un événement de `ambEvent` (`audio.js:513`) | **+** |

### Ce qu'il faut dessiner

- **Locomotive** : il n'en existe pas. Une forme en table de boîtes dans `formes-barrage.js`, sur le modèle de `wagonCouvert` (`formes.js:116`) : diesel soviétique à deux cabines (type TE3), caisse verte de 17 m, bande jaune, traverse de tamponnement rouge, trois phares, deux bogies.
- **Motrice électrique et remorque** : caisse rouge et crème de 13 m (les cubes actuels en donnent les cotes, `454`), pantographe, bande de fenêtres.
- **Wagons** : `wagonCouvert` existe et n'est posé nulle part. À ajouter : citerne, tombereau chargé de gravier, et un **wagon plat portant une roue de turbine** (il raconte la centrale).
- **Voie** : texture `voieGES`, deux heurtoirs par impasse, un aiguillage dessiné à l'entrée de la gare, un signal à deux feux fixes (pas de clignotement), poteaux de caténaire prolongés le long de la voie 2 (les poteaux actuels sont des cubes de `peints`, ils y restent : ils ne bougent pas).
- **Gare** : bâtiment ocre et blanc à corps central et deux ailes (40 × 12 m), horloge, enseigne en lettres (texture `lettres`), deux quais avec marquise, bancs, lampadaires `lampadaireGES`, passerelle, château d'eau (forme `chateauEau` déjà posée dans la cité).

### Sortir le train et le tram du lot `peints`

1. Les cubes de ce qui roule ne passent plus par `bl()`. Chaque véhicule devient une liste de cubes **en coordonnées locales** (les mêmes cotes que les appels `T()` actuels, `432-436` et `454`), rangée dans une liste `roulants` avec son numéro de véhicule.
2. Un second lot : `inst(h, h.geo('bloc'), mat('peinture'), …)` comme à la ligne 492, mais **marqué `userData.dyn = 1`** pour que la fusion ne le fige pas (`game.js:1147`), avec sa couleur par cube (`setColorAt`, comme `peints`).
3. Le tick calcule pour chaque véhicule sa position et son cap sur le chemin, puis réécrit les matrices de ses cubes (`setMatrixAt`, modèle `flotte`, `decors-wangan.js:429`). Deux rames font 60 à 80 cubes.
4. Ou, avec les formes dessinées : un groupe par véhicule, `h.pose()` puis `soude(h, grp)` (`decors.js:30`), groupe `dyn`. Plus joli, un peu plus de code.
5. Les wagons qui restent garés en gare continuent de passer par `bl()`.

La même recette sert aux nacelles de la grande roue (V-31) et aux drapeaux (V-60) : c'est une aide du socle à écrire une fois.

---

## 3. Grille par secteur

Les lignes déjà décrites plus haut sont rappelées par leur numéro.

### S1 — Cité, départ (idx 2594 → 208). Moment fort : la fête du 1er mai

| N° | Famille | Ce que le joueur perçoit | idx | Brique | Prio |
|---|---|---|---|---|---|
| V-30 | Mouvement | Les banderoles en travers de la rue et les calicots des lampadaires ondulent dans le même vent | 204, 2608, toute la rue | Banderoles (`407`) : bande de sommets ondulante (aurores, `decors-givre.js:119`). Calicots (`493`) : aide « drapeau » (V-60) | **I** |
| V-31 | Mouvement | La grande roue tourne lentement, nacelles d'aplomb | 2808, à gauche | Modèle complet dans wangan (`decors-wangan.js:326`). L'anneau est déjà un groupe (`253-255`) ; les douze nacelles sont des cubes de `peints` (`256`) : les en sortir. **Elle est à l'entrée d'un virage serré (2807)** : un tour en 40 s au plus, à l'auteur de trancher | **B** |
| V-32 | Lumière | La fumée de la chaufferie monte de la cheminée de brique et part au sud | cheminée (408, 1052) : vue de la rue sud 2790 – 2860, du départ et de la descente | `h.vapeur(x, y, z)` (`game.js:605`) : une ligne | **I** |
| V-33 | Son | Un haut-parleur de rue joue une marche, étouffée, qui passe d'un côté à l'autre ; l'écho du moteur entre les barres | 2594 → 208 | Socle 1 : lit `AMB.barrage` par zone, deux sources ponctuelles sur des lampadaires, entrée `ESP` « rue entre façades » | **B** |
| V-34 | Son | Une fanfare au kiosque à musique | virage intérieur où tombe le kiosque (`272`) | Source ponctuelle. idx non relevé | **+** |
| V-35 | Vivant | Des silhouettes sur les trottoirs : à l'arrêt d'autobus, au marché, devant le cinéma | 2862, 2688, 2628 | Formes `passant`, `figurant` ; fixes, ou à deux poses (`decors-stade.js:115`) | **B** |
| V-36 | Vivant | Des pigeons s'envolent de la place de la statue | 2868, à gauche | Pigeons de paris (`decors-paris.js:208`) | **+** |
| V-37 | Interactif | Barrières du défilé, cageots et caisses de kvas au bord du trottoir, qui volent si on les touche | lignes droites seulement : 0 – 90, 2700 – 2790 | `th.objets` (`game.js:1049`), purement visuels | **B** |
| V-38 | Eau | Le jet de la fontaine | virage intérieur (`271`) | Échelle animée d'un cube. Dans un virage : faible | **+** |
| V-39 | Lumière | Les fenêtres s'éteignent d'un tour à l'autre : le jour se lève | toute la cité | Réaction à la course (`decors-stade.js:115`), sur l'émission de `panneauKlum` | **+** |

### S2 — Route de la vallée (idx 208 – 571). Moment fort : les trains (V-21 à V-25)

| N° | Famille | Ce que le joueur perçoit | idx | Brique | Prio |
|---|---|---|---|---|---|
| V-40 | Mouvement | Les deux grues du chantier pivotent lentement, une charge au crochet | 290 – 345, à gauche, à 35-60 m | `grueKB` posées en `insts` (`388`) : les poser en groupes `dyn`, flèche en sous-groupe | **B** |
| V-41 | Mouvement | L'allée de drapeaux rouges claque au vent à l'arrivée sur la centrale | 496 – 566, à gauche | Drapeaux en cubes de `peints` (`443`) → aide « drapeau » (V-60) | **B** |
| V-42 | Son | Le bourdonnement des transformateurs en longeant le poste | 240 – 380, à droite | Source ponctuelle (100 Hz) au centre du poste (249, 434) | **B** |
| V-43 | Son | Le chantier : marteau, treuil de grue | 290 – 345 | Événements `ambEvent` de la zone | **+** |
| V-44 | Lumière | Un éclair bleu de soudure sur l'ossature de l'immeuble en chantier | 280 – 320 seulement, en hauteur | `visible` alterné (`decors-givre.js`). Pas après 340 : le S freine à 383 | **+** |
| V-45 | Vivant | Des corneilles sur les fils à haute tension, qui s'envolent | sous la ligne, vers 440 – 470 | Pigeons de paris | **+** |
| V-46 | Interactif | Fûts, palettes et barrières de chantier au bord gauche | 230 – 330 | `th.objets` ; les cônes y sont déjà (plan 250) | **+** |
| — | Eau | Rien : la rivière n'est pas visible de la route ici | | | |

### S3 — Salle des turbines (idx 571 – 644). Moment fort : les groupes qui tournent et bourdonnent (V-15, V-16)

| N° | Famille | Ce que le joueur perçoit | idx | Brique | Prio |
|---|---|---|---|---|---|
| V-47 | Lumière | Des rais de soleil obliques tombent des grandes baies sur le sol de la halle | 575 – 640 | Quelques plans additifs fixes (`h.addMat`, texture `degrade`). Le soleil est au sud-est, la façade vitrée est au sud | **B** |
| V-48 | Vivant | Deux ouvriers en blouse aux pupitres | 590, 620, côté baies | Formes de personnages, fixes | **+** |
| — | Eau, interactif | Rien : slalom étroit, aucune place pour un objet à percuter | | | |

### S4 — Quai, garnison, bassin, pont (idx 644 – 818). Moment fort : l'eau des vidanges, vue et entendue (V-18, V-50, V-51)

| N° | Famille | Ce que le joueur perçoit | idx | Brique | Prio |
|---|---|---|---|---|---|
| V-50 | Eau | Les trois jets coulent : l'écume file le long de l'arc et retombe. Bien visibles du pont en regardant à droite (vue de côté 795) | 776 – 818 ; de loin 2139 – 2295 | `coule(m, u, v)` (`decors-chapada.js:15`) sur la matière `blanc` des jets (`123`, UV déjà dans le sens de la chute). Seconde couche : la forme et la texture `gerbe`, prévues pour défiler et jamais posées (`formes-barrage.js:9`, `textures-barrage.js:114`) | **I** |
| V-51 | Eau | Un panache d'embruns monte du bassin et part vers le pont | 655 – 818 ; de loin 2139 – 2295 | `h.vapeur()` (`game.js:605`) aux trois points de chute : trois lignes. Les brumes actuelles (`131`) sont figées par la fusion | **I** |
| V-52 | Eau | La rivière et le canal de fuite courent vers l'aval sous le pont | 776 – 818 | `coule` sur `eauRiv` (`96`, `100`) ; les UV de `bande` suivent déjà le fil de l'eau | **B** |
| V-53 | Eau | Des paquets d'embruns traversent le pont | 780 – 815 | Socle 6 (`flou` ouvert aux décors) | **B** |
| V-54 | Son | Les pneus claquent sur les joints du tablier | 780 – 815 | Événement sonore périodique sur `car.idx` (socle 1) | **B** |
| V-55 | Vivant | Des oiseaux tournent au-dessus de l'écume du bassin | 655 – 716, 776 – 818 | `boucle(u, p)` (`decors-wangan.js:213`), forme `pigeon` reteinte | **B** |
| V-56 | Lumière | Les lampadaires du pont se reflètent dans la chaussée mouillée | 776 – 818 | **Existe déjà** (plan 790) : rien à faire | — |
| V-57 | Interactif | Balises de chantier sur le pont, côté amont | 785 – 805 | `th.objets` | **+** |
| | Mouvement | Radars et drapeau : V-11 à V-13 | | | |

### S5 — Montée : rampe, ravin, traverse (idx 818 – 1436). Moment fort : l'arbre qu'on abat à la coupe de bois

| N° | Famille | Ce que le joueur perçoit | idx | Brique | Prio |
|---|---|---|---|---|---|
| V-58 | Mouvement | À la coupe de bois, un mélèze tombe dans la clairière, loin de la route ; il est à terre avant le virage | déclenché à 880, chute vue de 900 à 940 (coupe à 956) | « Déclenché à l'approche », comme le rideau de fer (`decors-paris.js:200`) ; un arbre `cedre` et son `tronc` dans un groupe `dyn` | **B** |
| V-59 | Son | La tronçonneuse, puis le craquement | 900 – 975 | Source ponctuelle et événement | **B** |
| V-61 | Vivant | Un rapace plane au-dessus de la vallée dans chaque trouée | 1235, 1298, 1360 (± 26) | `boucle` (`decors-wangan.js:213`) | **B** |
| V-62 | Son | La forêt du matin (coucou, pic, vent dans les mélèzes) remplace peu à peu le grondement du barrage | 900 – 1436 | Lit `AMB` de zone ; l'atténuation de la chute vient seule (V-18) | **B** |
| V-63 | Son | Le moteur résonne dans l'entaille de roche avant le portail | 1400 – 1436 | Entrée `ESP` (`audio.js:596`) | **+** |
| V-64 | Mouvement | Une benne passe au-dessus de la vallée sur un câble-grue de chantier | trouées 1235 – 1360 | Forme neuve et câble ; `boucle`. À 400 m dans la brume : lisibilité à vérifier | **+** |
| V-65 | Interactif | Des rondins au bord de la route à la coupe | 930 – 950, côté clairière | `th.objets` | **+** |
| | Eau | Bas de la rampe mouillé : V-08 | 818 – 900 | | |
| — | Lumière | Rien à ajouter : les rayons du soleil existent déjà dans la passe finale (`game.js:2017`) | | | |

### S6 — Tunnel (idx 1436 – 1578). Moment fort : la sortie, du vacarme au silence blanc

| N° | Famille | Ce que le joueur perçoit | idx | Brique | Prio |
|---|---|---|---|---|---|
| V-66 | Eau | Le béton suinte : les néons sodium se reflètent au sol dans la ligne droite | 1436 – 1525 (pente 0,7 %) | Zone `surf` mouillée légère, points 63-66 ; le sol du tunnel lit déjà la mouillure (`game.js:537`). S'arrêter avant le virage aveugle (1532). Adhérence à mesurer | **B** |
| V-67 | Son | À la sortie, la réverbération se coupe net : son assourdi par la brume, chute lointaine en dessous | 1570 – 1600 | Réverbération existante (`audio.js:741`) ; filtre passe-bas par zone (socle 1) | **I** |
| V-68 | Mouvement | Deux paires de ventilateurs tournent sous la voûte | 1460, 1500 | Rotor (`decors-terre.js:135`) ; forme neuve simple | **+** |
| V-69 | Son | Le souffle de la ventilation, des gouttes | 1436 – 1578 | Lit de zone | **+** |
| — | Vivant, interactif | Rien : virage sans visibilité à 200 km/h | | | |

### S7 — Crête (idx 1578 – 1861). Moment fort : les feux dans le brouillard (V-01 à V-04)

| N° | Famille | Ce que le joueur perçoit | idx | Brique | Prio |
|---|---|---|---|---|---|
| V-70 | Son | Chaque lampadaire passe en soufflant, deux fois par seconde : la vitesse s'entend quand on ne voit rien | 1584 – 1860 | Événement périodique sur `car.idx` (socle 1) | **B** |
| V-71 | Son | La corne de brume du barrage, une fois par tour, en entrant sur la crête | 1590 | Événement `ambEvent` | **B** |
| V-72 | Vivant | Des cormorans posés sur le parapet côté lac jaillissent du blanc et s'envolent | 1700 – 1720, à gauche | Pigeons de paris. Côté lac seulement : la corde se joue côté vide | **B** |
| V-73 | Eau | Une bruine fine sur l'écran | 1578 – 1833 | `th.pluie` faible sur les points 68-74 (`cartes.js:502`) | **+** |
| | Eau | Chaussée humide : V-04. Chute entendue : V-19 | | | |
| — | Interactif | La mécanique `corde` existe déjà (frôler le garde-corps remplit la nitro) : rien à ajouter | | | |

### S8 — Descente (idx 1861 – 2594). Moment fort : le mur vivant, face à soi dans la traverse du belvédère (V-20, V-50, V-51)

| N° | Famille | Ce que le joueur perçoit | idx | Brique | Prio |
|---|---|---|---|---|---|
| V-74 | Lumière | Le soleil perce en sortant du brouillard, dans l'axe de la route | 1861 – 1950 | **Existe** (rayons de l'astre, plus forts dans la brume, `game.js:2017`) : à contrôler seulement | — |
| V-75 | Mouvement | Au camp de pionniers, le drapeau flotte et une fumée de cuisine monte | 2150 – 2200, à gauche | Aide « drapeau » (mât, `474`) ; `h.vapeur()` | **B** |
| V-76 | Son | Le clairon du camp | 2150 – 2200 | Événement de zone | **+** |
| V-77 | Mouvement | Un nuage de poussière au-dessus du concasseur de la carrière | 2410 – 2477, à gauche | Socle 6 (`flou` teinté) ; `h.vapeur` est blanc. **Zone de virages serrés** : un panache lent, en hauteur, rien d'autre | **B** |
| V-78 | Son | Le grondement du concasseur | 2400 – 2480 | Source ponctuelle | **B** |
| V-79 | Mouvement | La bande transporteuse défile | 2440 | Texture rayée propre et `coule`. Dans le virage : faible | **+** |
| V-80 | Vivant | Un rapace au-dessus de la vallée | 1960 – 2090 | `boucle` | **+** |
| | Mouvement | Trains vus d'en haut et à quai : V-23 | 2343 – 2420, 2500 – 2594 | | |
| — | Interactif | Rien : trois gros freinages, pas d'objet à percuter | | | |

---

## 4. Mes ajouts au-delà des demandes

Déjà dans la grille : la fumée de la chaufferie (V-32), les feux arrière des rivaux dans le brouillard (V-01), la chute entendue depuis la crête (V-19), les joints du pont (V-54), l'arbre abattu (V-58), la coupure sonore à la sortie du tunnel (V-67).

| N° | Idée | idx | Brique | Prio |
|---|---|---|---|---|
| V-60 | **Aide « drapeau »** : un drapeau qui claque au vent de la carte. Elle sert à la garnison, à l'allée de la centrale, au camp, aux calicots, aux drapeaux de la statue | partout | Soit l'horloge des shaders (socle 2), soit un lot `dyn` dont le tick fait osciller chaque drapeau. Un seul vent | **B** |
| V-81 | **Le son n'existe pas sur cette carte** : huit lits de zone (cité, vallée, halle, quai, forêt, tunnel, crête, descente) et une acoustique par lieu | tout le tour | `AMB.barrage`, `ESP.barrage`, zone transmise à `SON.frame` (`game.js:1913`) | **I** |
| V-82 | Un hélicoptère militaire traverse la vallée, rotor entendu | vu de 2139 – 2420 | Hélicoptère et rotor de terre (`decors-terre.js:135`), sur une `boucle` | **+** |
| V-83 | Au dernier tour, la sirène retentit et un quatrième pertuis s'ouvre : un jet de plus | 776 – 818, 2139 – 2295 | Réaction à la course (`decors-stade.js:115`). Version légère de la « crue d'un tour à l'autre » de la spec V1 | **+** |
| V-84 | Le grésillement des lignes à 500 kV quand on passe dessous | ≈ 390, ≈ 2400 | Événement sur `car.idx` | **+** |
| V-85 | Le clapot de la retenue | crête, hors brouillard seulement | Deux couches `coule` sur `eau` (`96`). Invisible dans la brume : sans intérêt tant que la crête est voilée | **+** |

Ce que je ne propose pas : un arc-en-ciel sur les embruns (retiré à la demande de l'auteur) ; un autobus ou un tramway qui roule dans la rue (il faudrait le rendre percutable) ; un passage à niveau.

---

## 5. À part : ce qui relève du décor statique

À traiter avant la vie, par `METHODE-DECOR.md`.

**Vide ou manquant**
- **La gare n'existe pas.** Le coin prévu (x de 300 à 385, z de 615 à 700) est à dégager et à construire (V-26) ; ce qui s'y trouve aujourd'hui n'a pas été relevé.
- **Les voies n'ont ni traverses ni heurtoirs** ; la voie du tram et celle du train ne sont pas sur le même alignement (6 m et 9,6 m du bord).
- **La crête n'a pas de catadioptres** (V-05) : rien ne renvoie les phares.
- **Le ravin n'a pas de ruisseau** (la proposition B-28 en prévoyait un, avec un petit pont). Sans lui, pas d'eau ni de bruit d'eau dans la montée.
- **La traverse haute (idx 1170 – 1436)** reste la portion la plus pauvre : forêt, un arrêt d'autobus, trois trouées.

**Trop chargé ou mal placé**
- **Le bord droit de la vallée (idx 214 – 470)** : bouleaux en allée à 6,5 m du bord, lampadaires, cônes, puis la voie. Sur les plans 250 à 400, les arbres passent devant les wagons. Retirer les bouleaux de droite sur cette longueur, sinon le train roule derrière un rideau.
- **Une trentaine de wagons garés** sur 400 m : avec deux rames qui roulent, n'en garder que quelques-uns, en gare.
- **La cité** est la zone la plus dense de la carte (enseignes, kiosques, voitures, mobilier, conduites, banderoles, calicots). La vie n'y ajoute aucun objet fixe : elle anime ce qui est là.
- **Les chevrons géants de l'entrée du pont** (plan 654) masquent le bassin et les embruns depuis le quai, juste là où l'eau doit se voir.
- **Les bajoyers du bassin** cachent l'eau depuis le quai (vue de côté 700) : de la voiture on ne voit que le mur et la brume. Le spectacle de l'eau est sur le pont et depuis la descente.
- **La parabole** est à l'extérieur du virage du pont (voir D4).
- **La grande roue** est à l'entrée d'un virage serré (voir V-31).
- **La guérite du poste de contrôle** (idx 334, à 6,4 m du bord droit, `447`) est à 1 m de la voie 1 : à contrôler, ou à passer à gauche.

---

## 6. Ce que la carte demande au socle, et ses pièges

**Au socle commun**

| Brique | Pour | Idées |
|---|---|---|
| 1. Son par zone ; sources ponctuelles fixes et **mobiles** ; réverbération et filtre par lieu ; événements sur `car.idx` | turbines, chutes, train, tunnel, brume | V-16 à V-20, V-24, V-33, V-42, V-54, V-59, V-62, V-67, V-70, V-71, V-78, V-81 |
| 5. Feux par zone qui suivent le brouillard (phares, feux arrière, cônes) ; **le brouillard de la vue donné au décor** (`kBr`) | crête | V-01 à V-03 |
| 4. Mouillé en pente : normale de la chaussée dans la passe `ssr` | rampe, culée | V-10 (le reste de D2 n'est que du réglage de carte) |
| Une mouillure **visible sans effet sur l'adhérence** (ou la mesure de cet effet) | crête, tunnel, culée | V-04, V-09, V-66 |
| 7. Aides sorties de leurs cartes : `coule`, `boucle`, `surChemin`, plus un **lot mobile de cubes** (liste de cubes locaux par véhicule, lot `dyn`, matrices réécrites par le tick) | trains, nacelles, drapeaux | V-22, V-31, V-50, V-52, V-55, V-60, V-61 |
| Une **borne d'approche** générique (fenêtre d'`idx`, une fois par tour) | trains, arbre, oiseaux | V-22, V-23, V-58, V-72 |
| 6. Particules ouvertes aux décors, teintées | embruns, poussière | V-06, V-53, V-77 |
| 2. Horloge des shaders | drapeaux, banderoles | V-30, V-60 (facultatif : le tick suffit) |
| 8. Plans à plusieurs instants espacés de secondes (`--rafale` ne couvre que 1/30 s) | juger un train, une roue, un jet | toutes les idées de mouvement |

**Pièges propres à barrage**

- **Pas de tick** : la fonction doit en renvoyer un, après `fond()` (`525`).
- **`fond()` en fin de fonction** (`16`, `525`) retire de la scène tous les rubans qui partagent une matière et les refond en un seul objet. Une référence gardée sur un ruban (rail, parapet, trottoir) ne pointe plus sur rien. Les matières, elles, survivent : on peut animer `map.offset`, pas l'objet.
- **Matières en cache partagé** (`mat`, ligne `14`, clé = nom + options) : animer `map.offset` ou la couleur d'une matière touche toutes les pièces qui la portent. `bandeOrange` : colliers, linteaux, portes du tunnel. `lampe` : lampadaires, halle, miradors, portails. `ecumeGES` : jets et bassin. `peinture` : presque tout. Pour animer, cloner la texture (`m.map = m.map.clone()`) ou bouger l'objet.
- **Fusion du jeu** (`game.js:1147`) : tout `inst()`, `insts()`, `bloc()` immobile est fondu. Colliers, excitatrices, grues, brumes, drapeaux, nacelles sont dans ce cas : ce qui doit bouger est à poser à part, avec `userData.dyn = 1`. Contrôle : `(await import('./outils/perf.js')).mobiles()`.
- **Le lot `peints`** (`219`, `492`) contient le train, le tram, les nacelles, les drapeaux de l'allée, les camions : un seul objet, indéplaçable.
- **`h.lum()`** : 20 luminaires au plus, figés ; la halle en prend sept (`159`). Les halos de la crête ne peuvent pas passer par là.
- **`rythme.js`** réécrit la couleur des `MeshBasic` opaques : un halo ou un feu doit être additif, ou porter une texture (astuce déjà utilisée pour les sommets, `522`).
- **Voile de brume** en `renderOrder` 50 (`game.js:319`) : voir D1.
- **Écran partagé** : un seul tick, piloté par le joueur 1. Les trains sont à l'heure pour lui seul ; les halos de brume passent par `tick.vue(car)`.
- **`th.lisse`** s'applique à `eauGES`, `ecumeGES`, `brumeGES` (`cartes.js:502`) : une texture d'eau neuve doit y être ajoutée.
- **Zones mouillées = adhérence** : toute extension de `surf.zones` change la conduite ; refaire `vit`, médailles et trace or après.

---

## 7. Ce que je n'ai pas vérifié

- **Aucun mouvement vu** : la carte n'a pas de tick, toutes les captures sont des images fixes. Vitesses de rotation, de défilement et de train sont des estimations.
- **Aucun son écouté** : ni le jeu, ni `ecoute.html`.
- **Route mouillée en pente** : essai sur cinq points (deux en côte, trois en descente), images fixes. Le décalage des reflets est déduit du code, pas mesuré. Le défaut vu par l'auteur « en côte » n'a pas été reproduit : si l'auteur le voit encore avec la zone étendue (V-08), il faut une capture de son cas. L'effet d'une zone mouillée plus longue sur l'adhérence et le chrono n'est pas mesuré.
- **Tracé des trains** : non dessiné, non essayé. Dégagements non contrôlés : clôture du poste (x = 197), guérite, poteaux de caténaire, lampadaires des abords de la cité (jusqu'à l'idx 294), bouleaux. Le contenu actuel du coin de la gare n'a été vu que sur une vue de côté peu lisible.
- **Visibilité du train depuis la descente** (idx 2343 – 2420) : calculée sur les coordonnées (105 à 180 m, 25 m plus bas), pas capturée avec un train. Le poste électrique peut le masquer au sud de z = 420.
- **Horaire des rames** : calculé sur le tour du pilote automatique (117,2 s). Un joueur humain roule autrement ; les fenêtres de rencontre sont à régler en jeu.
- **Positions exactes** de la grande roue, du kiosque à musique, de la fontaine et de l'arrêt d'autobus de la traverse : lues dans le code, pas confirmées par un plan.
- **Voile de brume contre halos**, **`rythme.js` contre clignotements** : déduits du code.
- **Lisibilité à pleine vitesse** de tout ce qui est à plus de 200 m dans la brume (câble-grue, hélicoptère, train depuis la traverse).
- **Écran partagé et jeu en ligne** : non essayés.
- **Performance** : non analysée, par décision.
- **Numéros de ligne** : repris sur `19bd9dd` après le découpage de `decors.js` ; à refaire au `grep` si le dépôt bouge encore.

---

## 8. Réalisation, validation et caméra par défaut (16 novembre 2026)

L'auteur a validé tous les points et demandé un agent de validation par point, avec capture avant et après. La réalisation est sur la branche `vie-barrage` (worktree `.claude/worktrees/vie-barrage`), en cinq commits, rien de poussé. 79 agents ont jugé chacun un point sur les captures de la caméra de course et sur le code : 44 validés, 35 à revoir. Le cinquième commit corrige ce qu'ils ont refusé.

Règle ajoutée par l'auteur ensuite : **on juge depuis la caméra par défaut du jeu, sur la trajectoire de course**. Une idée masquée, hors champ ou visible seulement de très loin est retirée ou déclassée. Plusieurs de mes jugements de la section 3 venaient de vues de côté : ils sont repris ici.

### Depuis quels `idx` les quatre demandes sont dans le champ

| Demande | Dans le champ de la caméra de course | Hors champ |
|---|---|---|
| Trains | À droite, à 10 m, de **225 à 537** : la motrice à quai puis en marche de 225 à 330, le train de marchandises de 440 à 537 | Depuis la descente (2343 – 2594) : la voie est en bord d'image, derrière le poste électrique |
| Gare | De **208 à 250**, à droite : bâtiment, enseigne, quai, passerelle | Depuis la descente (2500 – 2594) : absente de l'image |
| Radars | La parabole, à gauche devant soi, de **690 à 745** ; l'antenne en râteau est déplacée à côté d'elle | Tout ce qui est au nord de z = 200 (état-major, drapeau, portail) : par le travers, à plus de 60° de l'axe |
| Turbines | Dans l'axe, à 4 m, aux **idx 583, 608 et 632** | — |
| Jets des vidanges | De loin seulement : trouée de la traverse (**1298**) et traverse du belvédère (**2139 – 2288**) | Sur le pont (776 – 818) : ils sont à droite, la caméra regarde la route. Du quai : cachés par les murs du bassin |

Conséquence pour le tracé de voie : il passe bien là où la caméra regarde (le long de la ligne droite de la vallée). La seconde rencontre prévue depuis la descente ne tient pas ; les rames ne font plus qu'un aller par tour côté vallée.

### État de chaque point

| État | Points |
|---|---|
| **Validé par son agent, inchangé** | V-03, V-05, V-08, V-09, V-10, V-12, V-15, V-16, V-17, V-18, V-19, V-22, V-27, V-30, V-32, V-33, V-35, V-36, V-37, V-40, V-41, V-42, V-46, V-52, V-56, V-57, V-60, V-64, V-65, V-66, V-68, V-69, V-72, V-73, V-74, V-77, V-78, V-82 |
| **Validé à tort, corrigé depuis** | V-24, V-28, V-43, V-70, V-71 : les sons brefs ne sortaient pas (clé `SON.coup` écrasée dans `audio.js`). Corrigé (`SON.bref`), non réécouté |
| **Refusé, corrigé, pas encore revalidé** | V-01 (points rouges trop gros), V-02 (faisceaux à arêtes vives), V-06 (nappes qui sautaient), V-07 (feu caché dans le portique), V-20 (chute hors de portée), V-21 (bouleau sur la voie), V-26 (gare posée droite sur une voie courbe), V-39 (compte des tours faux en contre-la-montre), V-50 et V-51 (panache en mur blanc devant les jets), V-53, V-54, V-59, V-62, V-75, V-76, V-81 (cité muette), V-84 |
| **Refusé, déplacé dans le champ, pas encore revalidé** | V-11 (antenne), V-47 (rais de la halle), V-58 (arbre abattu), V-61 et V-80 (rapaces) |
| **Retiré : invisible depuis la caméra de course** | V-14 (sentinelles), V-23 (rames vues de la descente), V-44 (soudure), V-45 (corneilles), V-48 (ouvriers), V-55 (mouettes), V-79 (tas de la bande) |
| **Gardé avec un défaut connu** | V-04 : les halos ne se reflètent pas, et le reflet d'un portique noyé dans la brume fait un rectangle pâle sur la chaussée. V-13 : drapeau hors champ. V-25 : phares des trains non lumineux. V-85 : une seule couche. V-31 : la grande roue tourne, mais elle est dans le coin de l'image à l'idx 2800 (validée sur le code, à déclasser selon la règle de la caméra) |
| **Non fait** | V-34, V-38, V-63, V-83 ; V-67 à moitié (rien n'assourdit le son dans le brouillard) |

Encore à vérifier après corrections : les rais de la halle et l'arbre abattu ne se distinguent toujours pas sur mon dernier contrôle (idx 600 et 955).

### Ce qui reste non vérifié

- Le son : personne ne l'a écouté. Vérifié seulement : le niveau de chaque source continue aux endroits prévus, et l'absence d'erreur au déclenchement.
- Les points corrigés n'ont pas été rejugés par un agent.
- Aucune capture avec des rivaux (feux arrière dans le brouillard) ni en course réelle (horaire des trains).
- `vit` et médailles non retouchés ; les zones mouillées coûtent 0,3 s au tour de référence.
- Performance : non mesurée.
