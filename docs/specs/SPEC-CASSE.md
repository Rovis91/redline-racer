# Casse et interactions — scope

Inspiration : Wreckfest, FlatOut, Burnout. Tout est d'abord validé dans un bac à sable (`docs/propositions/casse.html`), une mécanique à la fois, avant d'entrer dans le jeu.

## Ce qui existe déjà

- **Dégâts** (7a3eb7f) : 4 zones (avant, arrière, flancs), caisse cabossée, phares et feux qui s'éteignent, pare-chocs et rétros qui tombent (20 s au sol), fumée, pare-brise fêlé, moteur qui rate. Purement visuel : la simulation n'en sait rien.
- **Traces de gomme** : noires, en glisse seulement, quelle que soit la surface, effacées en 8 s.
- **Surfaces** (src/moteur/sim.js, `SURF`) : sec, mouillé, glace, neige, terre ; trajectoire qui sèche sous la pluie.

## Décidé

| Sujet | Règle |
|---|---|
| Dégâts et conduite | Visuels dans tous les modes actuels (fantômes, médailles, réseau restent justes). Un **nouveau mode CASSE** où ils comptent. |
| Voiture | Déformation plus forte et progressive (beaucoup de petits chocs s'additionnent), plus de pièces qui tombent (pare-chocs, optiques en éclats, puis capot, portières…). |
| Débris | Restent au sol toute la course, poussés par les voitures qui passent. Nombre plafonné (les plus vieux disparaissent). |
| Traces au sol | Par surface : bitume sec = gomme noire ; terre / gravier = sillons sombres, même en roulant ; neige = ornières, même en roulant ; mouillé et glace = rien. En glisse, au freinage bloqué et au patinage du départ. Restent toute la course (anneau de taille fixe). |
| Décor | Marques de peinture et rayures sur les murs ; objets légers renversables (cônes, poubelles, panneaux, barrières) ; glissières qui se tordent ; néons et vitres qui cassent. |
| Bonus | Saleté qui s'accumule sur la caisse (lavée par la pluie, le gué) ; gerbes dans les flaques, traînée d'huile d'une voiture très abîmée ; étincelles de châssis (réception de saut, jante sur pneu crevé). |
| Écarté | Caméra de crash au ralenti. |

## Mécanique des chocs (arbitrée)

Débat entre trois game designers (lisibilité arcade, simulation façon Wreckfest, équilibrage course) et un technical artist. Implémentée dans `docs/propositions/casse.html` (`choc`, `pend`, `lache`), captures dans `docs/avant-apres/casse/`.

**Le défaut du modèle actuel** : un frottement à 5 m/s ajoute +0,18 d'usure. Trois frottements suffisent à faire tomber un rétro, c'est l'épave au premier tour.

**Force et angle**
- Seule la **vitesse normale** (vn, ce que `c.hit` et `c.bump` portent déjà) casse. La vitesse tangentielle (frotter le long d'un mur) ne donne que des étincelles et des rayures de peinture, jamais d'usure.
- Seuil : rien sous **6 m/s** contre un mur ou un camion, sous **4 m/s** entre voitures.
  - Repères tirés de src/moteur/sim.js : frotter en virage donne vn 3 à 9 ; un mur raté, 12 à 18 ; une épingle ratée, 20 à 28 ; une portière d'IA, 2 à 6 ; un camion tamponné, 20 à 35.
- Usure d'un choc, proche de l'énergie : `u = min(1, ((vn − seuil) / 24)²) × type × endroit`.
  - type : mur 1, camion 1,5, voiture 0,8.
  - endroit : coin × 1,3, face ou flanc × 1.
- Le choc se répartit entre la face (avant ou arrière) et le flanc selon le carré de chaque composante de sa direction.
- Rendement décroissant : `zone += min(0,5, 0,75·u·poids) × (1 − zone)` ; en CASSE, `min(0,8, 1·u·poids)`. Après essai : à 200 km/h dans un mur à 45° (39 m/s), on n'avait que de petits dégâts. Maintenant, ce choc met l'avant et le flanc à 0,64 en CASSE (0,40 en course, plafond du tour).
- Un contact frais compte au plus une fois toutes les 0,4 s contre un mur (`wallT` de src/moteur/sim.js), et toutes les 0,15 s entre voitures (`dgPas` de src/moteur/game.js).

**Plafond** : hors du mode CASSE, aucune zone ne dépasse **0,70**. On peut être très abîmé, jamais une épave. Et chaque zone prend au plus **+0,40 par tour** (indispensable, voir les mesures).

**Déformation** : l'enfoncement suit l'usure ajoutée, donc plus rien une fois le plafond atteint. Une face qui a perdu son pare-chocs se plie 1,5 fois plus.

**Pièces : elles pendent, puis elles tombent** (seuils sur l'usure de leur zone)

| Pièce | Pend à | Tombe à | Comment elle pend |
|---|---|---|---|
| Rétro, du côté du choc | — | 0,25 | — |
| Phare / feu, du côté du choc | — | 0,25 (éclats) | hors CASSE, un phare avant reste toujours allumé (la nuit, il éclaire la route) ; les deux feux arrière peuvent casser |
| Pare-chocs | 0,30 | 0,45 | tient d'un bout, l'autre traîne au sol (étincelles) |
| Aileron | 0,35 | 0,55 | penche d'un côté |
| Capot | 0,55 | 0,85 (CASSE seulement) | se soulève et bat ; on voit le compartiment moteur |
| Portière | 0,60 | 0,85 (CASSE seulement) | s'ouvre et bat ; on voit l'ouverture sombre |

Une seule pièce pend à la fois : la suivante fait tomber la précédente. Une pièce qui pend est dessinée à part, elle coûte 2 passes. Pare-brise étoilé : à partir de vn > 22. Le jeu le fait déjà (`fissure` de src/moteur/game.js, au-dessus de 12 m/s) ; le seuil passera à 22 au portage. Le bac à sable n'a pas de livrée pour le peindre.

**Profils, sur une course de 3 tours** (suites de chocs fixes dans le prototype, touches 1 à 4)

| Profil | Ce qu'il prend | État (usure avant / arrière / gauche / droite) |
|---|---|---|
| Propre | 10 frottements, 2 touchettes, 4 portières d'IA | 1 / 1 / 2 / 4 : nickel |
| Moyen | 15 frottements, 6 murs moyens, 1 gros choc, 8 contacts d'IA | 16 / 6 / 21 / 9 : quelques creux |
| Bourrin | par tour : 4 murs ratés, 2 gros chocs, 1 camion, 2 tamponnages | 70 / 24 / 19 / 60 : pare-chocs avant parti, un phare cassé, capot soulevé, roule toujours |
| Épave (CASSE) | bourrin, plus 12 crashs | presque 100 partout : capot, portières, pare-chocs, optiques partis |

**Mesuré en vraie course** (`node outils/chocs.js [carte]`) : 12 cartes, 3 tours, 3 IA, la vraie physique de src/moteur/sim.js. On note chaque choc comme le jeu le voit et on rejoue dessus le modèle ci-dessus, **avec le plafond par tour** (+0,40 au plus par zone et par tour, ajouté après la première mesure).

Profils du joueur :
- propre = le pilote automatique ;
- moyen = 6 % trop vite et un volant imprécis ;
- bourrin = toujours à fond, jamais de frein.

| Profil | Zone la plus abîmée en fin de course (min / médiane / max sur les 12 cartes) | Fin du tour 1 |
|---|---|---|
| Propre | 0 / 4 / 31 : nickel ou presque, un creux au pire | 0 à 31 |
| IA (rivaux) | 0 / 0 / 36 : les rivaux restent propres en course | — |
| Moyen | 5 / 21 / 42 : des creux, souvent un rétro ou une optique | 0 à 31 |
| Bourrin | 32 / 70 / 70 : au plafond, mais roule | 17 à **40 au plus** (pare-chocs qui pend, une optique) |

- Sans plafond par tour, le bourrin atteignait 70 dès la fin du tour 1 (touge, stade). Le plafond par tour est donc indispensable.
- Frottements : chaque course compte des dizaines de contacts entre 4 et 10 m/s. Leur effet est nul ou négligeable : à vn = 8, l'usure est de 0,007.
- Gros chocs : le bourrin prend 3 à 10 chocs au-dessus de 20 m/s par course. Contre les camions de wangan en contre-la-montre, il en prend 10 au-dessus de 30 m/s, et le plafond par tour le retient à 40.
- Le volant du pilote « moyen » dévie d'un tirage fixe, remis à zéro à chaque course : deux passages donnent les mêmes chiffres. Aucun vrai joueur humain n'a encore été mesuré.

**Technique** (technical artist)
- La déformation reste sur le CPU, au choc. Elle coûte environ 0,1 ms par voiture (1 200 à 2 600 sommets) ; le GPU n'apporterait rien.
- `fondre` (src/rendu/formes-voitures.js) note l'**id de pièce** de chaque triangle, pour remplacer les recherches par boîte du prototype, qui sont fragiles. Une pièce qui s'en va voit ses triangles réduits à un point, ce qui ne coûte aucune passe. Faire de chaque pièce un Mesh à part ajouterait environ 100 passes par vue : à éviter.
- Capot et portières n'existent pas en géométrie. On ajoute des plaques fines par-dessus, plus une ouverture et un compartiment moteur sombres.
- **Point bloquant** pour les portières et les rayures : la livrée lit les mêmes pixels pour les deux flancs (`plan.cote` ignore z). Il faut une vue de côté par flanc dans src/rendu/textures-voitures.js.
- Les rayures se peignent sur la livrée (canvas), au plus une mise à jour par voiture et par image, sans jamais relire le canvas. Pas de décalcomanies.
- Débris : au plus environ 8 en vol, en Mesh. Une fois posés, ils sont copiés dans **un seul maillage** de taille fixe (48 pièces), sans ombre, qui coûte 1 passe. Le prototype garde un Mesh par débris.

## Prototype 2 : le décor (fait)

Dans `docs/propositions/casse.html` : une « rue » devant le départ. Capture dans `docs/avant-apres/casse/casse-decor.jpg`.

- **Marques sur les murs** : un anneau de 3 000 segments, en un seul maillage. Chaque segment porte une bande de peinture de la teinte de la voiture et deux rayures claires.
  - Un frottement suivi prolonge la même traînée ; un choc seul laisse une tache. La bande est plus haute quand le choc est fort.
  - Les marques restent toute la course. Dans le jeu, le même maillage sert pour les murs-rubans de la piste.
- **Cônes et poubelles** : un InstancedMesh par sorte, mis à jour seulement quand un objet bouge.
  - Au contact, l'objet part devant et de côté, pour sortir de la trajectoire au lieu d'être poussé jusqu'au mur. Il tourne, rebondit et reste où il tombe.
  - La voiture perd 1 % de sa vitesse par cône et 6 % par poubelle. Une poubelle lâche ses déchets.
- **Glissière** : un rail découpé tous les 0,5 m, qui garde la forme qu'on lui donne.
  - Au-dessus de 4 m/s, il recule de 0,035 × (vn − 4) m, plafonné à 0,5 m par choc et à 0,9 m en cumul, sur un rayon de 1,5 + 0,12 × vn m. Les poteaux se couchent avec lui.
  - Il rend moins qu'un mur (70 % de la vitesse normale) et sa collision suit sa forme. Il abîme la voiture comme un mur. Sa peinture est dans ses sommets, sur la face touchée seulement. Des marques collées comme sur les murs restaient suspendues là où le rail était avant de plier.
- **Néons sur pied** : un choc sous 8 m/s les fait grésiller 1,4 s, puis ils s'éteignent, lumière comprise. Au-delà, le panneau part avec la voiture. Dans les deux cas, éclats et étincelles.
- **Vitrine** : au-dessus de 5 m/s, elle vole en éclats (une quarantaine de débris de verre).

Limites du prototype :
- En conduite libre, le bac à sable compte un « tour » toutes les 90 s pour appliquer le plafond par tour (les courses du jeu ont de vrais tours).
- Les objets traversent la glissière et les blocs, et ils peuvent s'endormir en équilibre sur une arête.
- Les débris de verre sont des Mesh séparés : dans le jeu, ils iront dans le maillage unique des débris posés.

## Prototype 3 : les bonus (fait)

Capture : `docs/avant-apres/casse/casse-bonus.jpg`.

- **Saleté de caisse** : une injection dans la matière de la caisse (`onBeforeCompile`), trois uniformes (niveau, hauteur, couleur).
  - La saleté arrive par seuils, pour une progression continue (`casse-salete.jpg`, de 8 à 100 %).
    - Chaque cellule a son seuil : d'abord des éclaboussures fines, puis de grosses plaques qui se rejoignent, et la couche s'épaissit.
    - Le niveau local décroît avec la hauteur : le bas de caisse se salit 1,7 fois plus vite que le niveau, le toit 0,3 fois.
    - La surface devient mate et perd son reflet.
  - Chaque surface dépose sa couleur à sa vitesse : terre 0,07/s, neige 0,05/s, poussière du bitume sec 0,004/s. Ça va plus vite en vitesse et en travers, et moins vite quand la caisse est déjà sale.
  - La couleur se mêle au fil des surfaces. Le bitume mouillé lave à 0,06/s, une flaque 8 fois plus vite, et L lave d'un coup.
  - Dans le jeu : la même injection dans la matière de la livrée. La pluie lavera comme le mouillé.
- **Traînée d'huile** : au-delà de 0,6 d'usure à l'avant, le moteur goutte, à l'arrêt comme en roulant.
  - Ce sont des gouttes rondes, sombres et brillantes, de plus en plus serrées et grosses avec l'usure.
  - Un anneau de 1 500 taches en un seul maillage. En mode CASSE, elles pourraient faire glisser les voitures qui passent dessus.
- **Déjà là depuis le prototype 1** : les gerbes dans les flaques, et les étincelles de châssis (réception de saut, pare-chocs qui traîne).

## Prototype 4 : le mode CASSE (conduite)

**Décidé** : une **course de casse** de 3 tours sur les cartes existantes, façon FlatOut, avec les rivaux IA. Le score combine **la place à l'arrivée et les takedowns** (un rival mis hors d'usage ou envoyé dans le mur). Hors du mode CASSE, rien ne change : les dégâts restent visuels.

**Effets sur la conduite**, essayés dans `docs/propositions/casse.html` (touche M). Capture : `docs/avant-apres/casse/casse-mode.jpg`.

| Effet | Règle | Mesure dans le bac à sable (départ arrêté, 5 s pied au plancher) |
|---|---|---|
| Moteur qui faiblit | usure avant ≥ 0,6 : −15 % de puissance ; ≥ 0,85 : −35 % et fumée grise | intacte 201 km/h ; avant 70 % : 172 ; avant 90 % : 131 |
| Direction qui tire | choc sur l'avant de côté au-dessus de 12 m/s : le volant dévie de 0,02 vers le côté touché, jusqu'à 0,08 | déviation de 0,04 sans corriger : 23° de cap en 5 s ; à 0,08 : 31° et le mur |
| Pneu crevé | gros choc (> 15 m/s) sur un coin dont la face est déjà à 0,5 : la roue crève ; −15 % d'adhérence et −10 % de vitesse maximale par roue, la voiture tire de son côté, la caisse s'affaisse, la jante crache des étincelles | roue avant droite crevée : 16° de cap en 5 s sans corriger, 187 km/h au lieu de 201 |
| Hors d'usage | usure avant ≥ 0,97 ou somme des zones ≥ 3,4 : moteur coupé, fumée noire, la voiture est éliminée | — |
| En plus | pare-chocs qui traîne : −1,5 % de vitesse maximale ; chaque pièce perdue : +1 % d'accélération, sans toucher la vitesse maximale | — |

Dans le jeu, tout cela passe dans src/moteur/sim.js, pour rester déterministe en réseau.
- Les zones d'usure, `tire`, `creve` et `mort` deviennent des champs de la voiture.
- Le modèle de chocs doit être calculé dans src/moteur/sim.js, pas dans src/moteur/game.js.

À trancher en jeu :
- la force de la déviation (0,08 au maximum est peut-être trop pour une manette) ;
- le nombre de points par takedown ;
- l'IA qui cherche le contact (la « tête brûlée » plus que les autres) ;
- un takedown compte-t-il pour une voiture sortie par un mur juste après un contact (fenêtre de 2 s) ?

## Intégration dans le jeu

**Phase 1 (faite)** :
- **Modèle de chocs partagé** : `usure` et `USURE` vivent dans src/moteur/sim.js (testés dans tests/test.js) ; `outils/chocs.js` et src/moteur/game.js s'en servent.
- **Pièces** (src/moteur/game.js, dégâts) :
  - rétros, phares et feux tombent en éclats ;
  - pare-chocs et aileron pendent puis tombent, une seule pièce pend à la fois et son bout traîne avec des étincelles ;
  - un phare avant reste toujours allumé ;
  - la caisse s'enfonce selon l'usure ajoutée ;
  - le pare-brise étoilé passe à 22 m/s.
- **Débris** : ils restent toute la course, 40 au plus, et les voitures les chassent. Posés, ils ne portent plus d'ombre ; le maillage unique reste à faire.
- **Traces selon la surface** :
  - elles apparaissent en glisse, au freinage bloqué et au patinage du départ, et restent les 500 derniers points par roue ;
  - un bug antérieur est corrigé : la matière des traces n'était pas en DoubleSide, et on ne les voyait jamais.
- **Captures** : `docs/avant-apres/casse/jeu-degats-70.jpg` et `jeu-traces.jpg`.

**Phase 2 (faite)** : le décor de src/moteur/game.js, section « décor qui s'abîme », purement visuel, remis à zéro au départ. Capture : `docs/avant-apres/casse/jeu-decor.jpg`.
- **Glissières** : les deux rubans de la piste gardent la forme des chocs francs. Ils sont sortis de la fusion du décor (`userData.dyn`), ce qui coûte 2 passes de dessin. La collision de src/moteur/sim.js ne bouge pas : le creux reste derrière la voiture.
- **Peinture** : bande de la teinte de la voiture, plus une rayure claire, sur la paroi touchée. Un frottement laisse une traînée, un choc une tache. Un anneau de 2 000 segments, en un maillage ; la peinture recule avec la glissière.
- **Cônes et poubelles** : 3 objets à l'entrée de 14 virages, côté extérieur. Les poubelles ne sont posées qu'en ville (ville, paris, canal, perse). Un InstancedMesh par sorte ; ils volent au contact d'une voiture, qui n'en sait rien (fantômes et réseau intacts).
- **Néons qui cassent** : pas faits, car ils sont fondus dans le décor de chaque carte. Il faudrait que chaque décor pose ses enseignes cassables à part.

**Phase 3 (faite)** : saleté et huile dans src/moteur/game.js, section « saleté et huile ». Capture : `docs/avant-apres/casse/jeu-salete.jpg` (terre à 20 s, 1 min, 1 min 40, puis lavage dans le gué).
- **Saleté** : chaque voiture a son niveau et sa couleur, et le shader de la saleté se greffe sur celui d'`eclaire` de chaque livrée.
  - Vitesses : terre 0,025/s, neige 0,02/s, poussière du bitume sec 0,002/s. Plus vite et en travers, moins quand la caisse est déjà sale.
  - Lavage : la pluie et le mouillé à 0,06/s, le gué à 0,5/s.
  - Sous la saleté, la caisse perd son reflet (`specularStrength`).
  - Sur la terre, la voiture est couverte au bout d'un tour et demi environ.
- **Genre de surface** (`genre`) : neige si elle est glissante et roulante, terre si elle est roulante et peu glissante. Le fondu entre la terre et le bitume passait pour de la neige, dans la saleté comme dans les traces : corrigé.
- **Huile** : au-delà de 0,6 d'usure à l'avant, des gouttes rondes et brillantes, sous le moteur, pour toutes les voitures. Un anneau de 1 200 gouttes, en un maillage.

**Phase 4 (faite)** : le mode **CASSE**, au menu entre Course et Élimination, à un joueur comme en écran partagé.
- **Course de 3 tours** contre les rivaux.
  - `newRace(..., { casse: true })` donne à chaque voiture un état `c.ca`, calculé dans `stepRace` à chaque pas (`casseChoc`), donc déterministe : un test le vérifie.
  - Usure sans plafond, et les effets passent par `roule()` : moteur −15 % puis −35 %, direction qui tire, roue crevée (adhérence, vitesse maximale, tire de son côté).
  - Hors d'usage à 0,97 à l'avant ou à 3,4 au total : la voiture sort, comme en élimination.
- **Takedowns** : une voiture mise hors d'usage dans les 3 s après un contact, ou envoyée dans un mur au-dessus de 15 m/s dans les 2 s, compte pour la dernière voiture qui l'a touchée. Un message « TAKEDOWN ! » s'affiche pour l'auteur et pour la victime.
- **Score** : place à l'arrivée 10 / 6 / 4 / 2 (rien hors d'usage), plus 3 points par takedown. Le tableau d'arrivée donne les takedowns, les points et le vainqueur aux points. Capture : `docs/avant-apres/casse/jeu-casse-arrivee.jpg`.
- **IA** (renforcée après essai, elle était trop sage) : une voiture à côté ou jusqu'à 18 m devant, les joueurs en priorité. L'IA braque franchement vers elle (gain 0,25 par mètre d'écart, jusqu'à 0,6 de volant) et remet plein gaz pour la percuter. La tête brûlée frappe 1,4 fois plus fort et met la nitro ; les autres à 0,8.
- **Visuels** : les zones viennent de src/moteur/sim.js (sans plafond). Fumée du moteur à bout, noire et épaisse hors d'usage, et étincelles des jantes crevées pour toutes les voitures.
- **Simulation, après réglage** (3 tours, ville, touge, stade) :
  - les rivaux se battent : zones entre 0,2 et 0,97, des roues crevées, 1 à 2 takedowns par course ;
  - le pilote bourrin finit hors d'usage sur le touge et le stade ;
  - un pilote propre prend tout de même des coups de l'IA (jusqu'à 0,62 sur un flanc).

**Après essai (2)** : capture `docs/avant-apres/casse/jeu-feu-verre.jpg`.
- **Flammes** (CASSE) :
  - un moteur à bout (avant à 0,85 ou plus) prend feu, et une voiture hors d'usage brûle franchement ;
  - ce sont des sprites additifs ronds qui montent du capot en passant du jaune au rouge, sous la fumée noire ;
  - un seul système de 360 points.
- **Verre 3D** :
  - de petits prismes triangulaires épais de 9 cm, transparents et brillants (reflet de la cube map) ;
  - une gerbe forme un InstancedMesh, donc une seule passe ; au plus 16 gerbes à la fois ;
  - les optiques en éclats clairs ou rouges ;
  - le pare-brise ou la lunette à plus de 22 m/s, une vitre latérale à plus de 18 m/s sur un choc de côté, une fois par vitre ;
  - les éclats retombent à plat et brillent au sol.
- **Son du contact entre voitures** (src/audio/audio.js, `contact`) : deux caisses creuses qui s'entrechoquent, plus graves et plus rondes qu'un mur. Une touchette n'est qu'un « tok » de bouclier ; fort, la tôle se froisse ; très fort, des éclats. Les murs gardent `choc`.

**Après essai (3)** : en jeu, on ne voyait rien de nouveau. Les éclats de 9 cm faisaient moins d'un pixel avec la caméra de course, les vitres ne cassaient qu'à plus de 80 km/h dans l'axe, et le feu ne démarrait qu'à 0,85. Corrigé, capture `docs/avant-apres/casse/jeu-feu-verre-camera.jpg` (caméra de course) :
- **Vitres** : la vitre cassée est peinte sur la livrée, un trou sombre semé de verre étoilé.
  - Le pare-brise casse de face et la lunette par l'arrière au-dessus de 14 m/s ; une vitre latérale de côté au-dessus de 12 m/s.
  - Les éclats font 17 cm, 40 pour le pare-brise et la lunette, et ils brillent un peu d'eux-mêmes.
  - L'ancienne étoile peinte sur le pare-brise est retirée.
  - Limite : une vitre latérale cassée l'est des deux côtés, car les deux flancs partagent la même vue de côté.
- **Feu** : il couve dès 0,7 à l'avant, flambe à 0,85, embrase la voiture hors d'usage. L'intensité est modérée : trop forte, elle éblouissait et cachait la voiture.
- **Son du contact** : plus fort, avec un coup grave (le poids de l'autre voiture) et un « clang » de tôle.

**Après essai (4)** : le feu faisait trop « moderne ». Le vrai problème, c'était les bouffées qui sortent de l'avant dès les premiers dégâts : les mêmes disques flous que la fumée des pneus. Elles sont refaites en **particules pixel**, avec un seul système (`pix`, 900 points) : des carrés pleins en pixels entiers, une couleur, une opacité et une taille par palier d'âge (4 paliers), sans dégradé. Capture : `docs/avant-apres/casse/jeu-fumee-feu-pixel.jpg`.
- **Vapeur grise** : elle sort de l'avant dès 0,6 d'usure, pour toutes les voitures, et s'assombrit en montant.
- **Fumée noire** : au-dessus d'un moteur en feu.
- **Feu** (CASSE) : jaune, orange, puis rouge sombre, en carrés qui rapetissent.

**Reste à faire** :
- régler en jouant : la force de la déviation, l'agressivité de l'IA, les points ;
- jeu en ligne : il reste en mode Course (l'état de casse n'est pas envoyé aux invités) ;
- capot et portières, qui demandent une livrée par flanc.

## Mode CASSE (à préciser après les prototypes)

Les dégâts entrent dans la simulation (src/moteur/sim.js) pour rester déterministes en réseau : puissance perdue (avant), direction qui tire (flancs, train avant), pneu crevé (adhérence, étincelles de jante), voiture hors d'usage au-delà d'un seuil. Pistes chiffrées (designer simulation) :
- usure de l'avant au-delà de 0,6 : −15 % de puissance ; au-delà de 0,85 : −35 % et de la fumée ;
- choc de coin avant au-dessus de vn 12 : la direction tire de 0,02 rad, jusqu'à 0,08 rad ;
- pare-chocs qui traîne : −1,5 % de vitesse maximale ;
- chaque pièce perdue : +1 % d'accélération, la voiture s'allège (touche FlatOut).

Questions ouvertes : derby en arène ou course sur les cartes existantes, score (dernier debout, points par choc), IA qui cherche le contact.

## Prototypes, dans l'ordre

1. **Sols et voiture** : bandes de surfaces, traces par surface, flaques, déformation progressive, pièces qui tombent et restent, étincelles de châssis à la réception d'un tremplin.
2. **Décor** : marques sur les murs, cônes et poubelles, glissière qui se tord, néon qui casse.
3. **Bonus** : saleté de caisse, traînée d'huile.
4. **Mode CASSE** : dégâts qui jouent sur la conduite, dans une copie de la physique du bac à sable.

Chaque mécanique validée entre dans le jeu avec un passage au banc (`node outils/banc.js`).

## Coût à surveiller dans le jeu

- Le décor est fondu en gros lots (une passe de dessin par matière) : tout ce qui se tord ou tombe doit en être sorti, donc garder ces objets peu nombreux et près de la piste.
- Traces, marques et débris : un seul maillage chacun, tableaux de taille fixe, envoi au GPU de la partie modifiée seulement.
- Déformation : seulement au choc, jamais par image.
