# Manuscrit 512 (`chapada`) : la phase « vie », réalisée

Suite de [VIE-chapada.md](VIE-chapada.md), après validation de tous les points par l'auteur. Branche `vie-chapada`, partie de `19bd9dd`, rien de poussé.

**Méthode de validation.** Chaque point a été jugé par un agent séparé, qui ne recevait que les captures avant et après et la description de ce que le joueur doit percevoir. Six tours : le premier n'a validé aucun point (trop petit, trop pâle, formes ratées), les suivants ont porté sur les points repris. Les captures sont dans `captures/plans/chapada/` de la copie de travail (`N.avant.jpg`, `N.jpg`, `N.duo.jpg`, `N-rafale.jpg`), non versionnées.

Le son ne se valide pas sur capture : son code a été relu par un agent séparé, et le jeu a tourné avec le son sur tous les secteurs sans erreur. **Personne ne l'a écouté.** La relecture a trouvé sept défauts, tous corrigés sauf un à juger à l'oreille :

- le banc d'écoute et l'éditeur de musique plantaient sur chapada (ils n'ont ni piste ni position) ;
- les cris « une fois par tour » ne rejouaient jamais en contre-la-montre, et la minuterie manquait les zones courtes (chauves-souris) ;
- le feu de camp était inaudible depuis la grille (elle est à 70-90 m) ;
- le plouf se rejouait plusieurs fois dans une même traversée ;
- la glissade des singes hurleurs s'aplatissait aux vagues 2 et 3 ;
- **à juger à l'oreille** : au bout du pont, la chute est le bruit continu le plus fort du jeu (baissée de 0,16 à 0,11, sans écoute).

## Les demandes de l'auteur

| Demande | Fait | Validation |
|---|---|---|
| Effets d'eau et cascade | Vapeur de la chute refaite, voile blanc et nuage à mi-hauteur, écume à la lèvre, embruns en travers du pont, gouttes sur l'objectif, embruns et écume vive aux seuils, paillettes au gué et au bassin, sillages d'écume, brume du marais, sol de la grotte mouillé, traînées mouillées | Validé, sauf brume du marais et traînées (voir plus bas) |
| Ambiance sonore de la cascade | La chute est une source placée : on l'entend dès le haut des lacets, elle est à gauche sur le pont, la grotte l'étouffe. Rapides, clapotis du gué, planches du pont, plouf à l'entrée dans l'eau | Code relu, jamais écouté |
| Animaux et bruits d'animaux | Aigrettes, aras, vautours, chauves-souris, singes, onça, toucan, caïman, capybaras à l'image ; grenouilles, aras, araponga, chauves-souris, singes hurleurs, onça, perruches, seriema, toucan au son | Voir le tableau |

## Point par point

Validé = l'agent a rendu « VALIDÉ » sur les dernières captures.

| Secteur | Point | État | Captures |
|---|---|---|---|
| S5 pont | Vapeur de la chute (plus de tache brûlée, des bouffées qui montent) | **Validé** | 835, 860 |
| S5 pont | Chute qui se défait en bas, nuage à mi-hauteur | **Validé** (l'écume de la lèvre se voit peu) | 835, 860, 885 |
| S5 pont | Embruns en travers du pont, gouttes sur l'objectif | **Validé** | 860, 885 |
| S5 pont | Vautours qui planent dans la gorge | **Validé** | 835, 860 |
| S5 pont | Singes assis sur les obélisques | **Validé** | 806 |
| S6 grotte | Sol mouillé, luisant | **Validé** | 940, 1000 |
| S6 grotte | Braseros des portails qui vacillent, avec leur lueur | **Validé** | 905, 905-rafale |
| S6 grotte | Nuée de chauves-souris à l'entrée | **Validé** | 915, 917, 917-rafale |
| S3 fromager | Deux aras rouges qui remontent la route | **Validé** (petits, en partie sous le feuillage) | 362 |
| S3 fromager | Paillettes sur le bassin sacré | **Validé** | 340-vue |
| S4 lacets | Feuilles qui tombent de la canopée | **Validé** | 570, 700 |
| S1 camp | Guirlande de lanternes qui se balance | **Validé** (balancement discret) | 25-vue, 25-rafale-vue |
| S1 camp | Feux du mât radio qui s'allument tour à tour | **Validé** | 25-vue |
| S7 descente | Éclat d'or de l'idole | **Validé** | 1165 |
| S8 rivière | Embruns au pied des seuils | **Validé** | 1290, 1322, 1340 |
| S8 rivière | Branches qui descendent le courant | **Validé** | 1300, 1376 |
| S10 gué | Paillettes de soleil, sillages d'écume | **Validé** (sillages discrets) | 1608, 1612 |
| S10 gué | Capybaras dans l'eau | **Validé** | 1612 |
| S2 marais | Envol d'aigrettes | **Validé** au cinquième essai (les ailes en pointe se lisaient comme des lames) | 200, 206 |
| S1 camp | Feu de camp qui vit, fumée grise | **Validé** (cœur jaune peu visible) | 25-vue, 30-rafale-vue |
| S9, S2 | Traînées mouillées à la sortie de l'eau | **Partiel** : validé sous l'arc triple (1408), faible à la sortie du marais (272) et plus loin (1425) | 272, 1408, 1425 |
| S7 descente | Singes qui bondissent avant le saut | **Partiel** : un singe lisible à droite (1264, 1270), ceux de la statue et des degrés non | 1256, 1264, 1270 |
| S2 marais | Brume du matin sur l'eau | **Non validé** : trop discrète sur les captures | 180, 200 |
| S8 rivière | Onça couchée sur le tronc | **Non validé** par l'agent ; je la vois sur la planche de contrôle (1376), petite | 1376 |
| S2 marais | Caïman | **Non validé** : ne se voit pas | 212 |
| S1 départ | Toucan sur le portique | **Non validé** : silhouette illisible | 1785 |
| S9 cité | Vautours posés sur le temple | **Non validé** : ne se voient pas à 100 m | 1455 |
| S10 gué | Barque qui flotte et tangue | **Non validé** : la forme existante se lit comme une planche | 1612 |

## Retours de l'auteur après essai (16 novembre)

Captures avant et après dans  (celles de la première phase sont rangées dans ).

| N° | Retour | Fait | Plan |
|---|---|---|---|
| 1 | Le feu du camp rebondit | Mesuré image par image (sommet de la flamme, 60 images/s) : il bougeait 9,8 fois par seconde, de 1,5 à 4,5 m, jusqu'à 1,5 m d'écart entre deux images. Maintenant 0,7 fois par seconde, de 2,6 à 3,7 m, 5 cm au plus entre deux images ; plus aucune langue ne disparaît. Les braseros de la grotte ont le même réglage | 30-vue |
| 2 | Les flamants presque blancs, pas gracieux, trop gros | Roses (rose franc non éclairé : la lumière ne les délave plus), échelle 2,5 → 1,5, battement trois fois plus lent, silhouette fine (cou tendu, pattes en arrière) | 200, 206 |
| 3 | Les feuilles qui tombent font un effet de feu | Retirées. Les feuilles soulevées par la voiture restent | 570, 700 |
| 4 | Entrée de la grotte trop étroite, trop de brouillard | L'éboulis recule de 5 m de chaque côté et de 5 m en hauteur, les braseros s'écartent ; la brume de la gorge s'arrête à l'entrée du pont au lieu du portail ; les embruns ne dépassent plus le milieu du pont. On voit le portail dès le bout du pont | 895, 905 |
| 5 | Des torches murales dans la grotte, pas les lumières du plafond | Luminaires du moteur retirés (). Quatorze torches scellées dans la paroi, un côté puis l'autre tous les 20 m, chacune avec son luminaire () : elles éclairent le sol mouillé et la voiture. Le pied est à 1,2 m de haut, la flamme à 5 m : rien dans le gabarit des voitures | 950, 1000, 1040 |
| 6 | Un objet de la descente avance par sauts en clignotant ; le félin sur le tronc | C'étaient les branches qui descendent le courant : elles étaient posées d'échantillon en échantillon (2 m) ; leur position est maintenant interpolée, calée sur . L'onça est retirée | 1300, 1340, 1376 |
| 7 | Des poteaux en pleine route devant le temple | Trois des huit stèles du temple étaient sur la chaussée (décor d'origine). Elles sont retirées ; restent celles qui sont hors de la route | 1485, 1492, 1500 |
| — | Retirer les idées invisibles | Caïman, paillettes du bassin sacré, feux du mât radio, toucan, onça, vautours du temple, tangage de la barque, singes de la statue et des degrés : retirés, avec leurs formes. Le croassement du toucan et le râle de l'onça restent au son | 1785, 1455, 1396 |
| A | Plus de clignotement avec la musique |  et  modifié comme demandé. Vérifié en jeu : 71 aplats lumineux, aucun changement de couleur sur 90 images, la boucle de rythme n'est pas lancée | — |
| B | De la vraie lumière | Torches de la grotte, braseros, feu de camp, torches de la route et de la cité : un luminaire  chacun. Trois lanternes de la guirlande sur six en reçoivent un. Le halo additif ajouté sur l'idole est retiré : elle est éclairée par ses deux torches | 1000 |

Ce qui reste des tableaux plus haut : les lignes caïman, toucan, onça, vautours du temple, barque qui tangue, paillettes du bassin sacré, mât radio et feuilles qui tombent ne sont plus dans le code.

## Non fait

- **Canopée qui respire, houppier du fromager** : il faut l'horloge commune des shaders (socle).
- **Reflets sur l'eau du marais** : il faut qu'une surface transparente du décor entre dans la passe de reflets (socle).
- **Réverbération propre à la grotte et à la place** : le socle (réverbération par lieu). La grotte garde celle du tunnel.
- **Vautours de la trouée de la seconde épingle** : la trouée est dans l'axe du freinage ; ils auraient bougé au point de freinage.
- **Perruches, poteries à renverser** : proposées sous condition, non retenues (un envol de plus, objets non synchronisés en ligne).
- **Sillage d'écume plus long derrière la voiture** : réglage du moteur, non touché.
- **Gouttes de la grotte** (son) : inaudibles sous le moteur.

## Ce qui a changé hors du décor de la carte

- `game.js`, trois retouches sans effet sur les autres cartes (`docs/MOTEUR-OPTIONS-CARTES.md` §14) : `th.embruns`, `h.lum` qui rend son luminaire, coup d'étrave à la réception d'un saut dans l'eau.
- `audio.js` : `AMB.chapada`, `ESP.chapada`, `sonChapada`, `chapadaFrame`, `evChapada`. Tout est derrière `M.id === 'chapada'`.
- `cartes.js`, entrée `chapada` : `mouilleVisible: 2`, `embruns`, brillance du sol de la grotte 0,05 → 0,24, zones `amb` étendues à tout le tour.
- **Décor fixe déplacé** : les deux braseros de chaque portail de la grotte sont avancés de 12 m. Ils étaient enterrés dans l'éboulis ajouté plus tard, donc invisibles. La barque du gué est remontée à la surface (elle était posée sur le fond, sous l'eau).
- **Le reste du décor fixe est inchangé** : la vie tire dans son propre hasard (`alea`), pas dans celui du décor.

## Contrôles

- `sh outils/verifie.sh` : vert après chaque lot.
- Aucune erreur de page sur les captures ; jeu lancé avec le son sur tous les secteurs, sans erreur.
- **Pas de mesure de performance**, comme convenu pour cette phase.

## Ce que je n'ai pas vérifié

- **Rien n'a été vu en mouvement continu ni joué.** Tout est jugé sur des images fixes et des rafales de six images à 1/30 s.
- **Le son n'a pas été écouté** : niveaux, timbres et cris sont des réglages de départ, à reprendre au banc d'écoute (pas de scène `chapada` ajoutée à `ecoute/ecoute.js`).
- **Le calage des envols à vitesse réelle** : l'outil de plans roule à 110 km/h, le jeu à 150-220. Les déclenchements sont calculés pour la vitesse du pilote automatique, pas vérifiés à cette vitesse.
- **L'écran partagé** : les envols suivent la voiture du joueur 1.
- **Le rendu réel du jeu** (270 lignes) : les captures sont en rendu net.
