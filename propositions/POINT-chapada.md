# Manuscrit 512 (`chapada`) : point d'étape pour une reprise à l'œil neuf

Branche `claude/refonte-chapada-e4341f`, worktree `.claude/worktrees/carte-chapada-v2-b9a43e`. Rien n'est poussé. Dernier commit de la carte : la fusion du rendu en 540 lignes (`250ac2e`).
À lire aussi : [PROPOSITION-chapada.md](PROPOSITION-chapada.md) (ce que l'auteur a validé au départ) et [ETAPE2-chapada.md](ETAPE2-chapada.md) (ce qui a été construit, passe par passe). Les noms de zones de la proposition sont en partie périmés : c'est ce document qui dit l'état réel.

## Ce que l'auteur a dit, dans l'ordre

1. Proposition : « j'adore », validée en entier.
2. Première version jouable : il aime l'ambiance et la direction. Il demande de remettre la cascade et l'eau, un marais tropical, moins de zones de forêt qui se ressemblent.
3. En jouant : trop d'effets de lumière et de halo, plus de brouillard par endroits, pas de cônes, pas de murs dans les lacets, la chute « juste un bloc de lumière », envie de rouler dans la rivière, une statue au bras tendu à changer, une façade de temple antique hors sujet, un sol de place grossier. Tout cela a été traité (`dc8ad72`).
4. Dernier retour, **à traiter par la reprise** :
   - **« La voiture, on ne l'a pas faite. »** L'Onça n'a que des réglages (`car` et `look` dans l'entrée `chapada` de `cartes.js`) : silhouette générique, couleur jaune. Aucun modèle propre dans `formes-voitures.js` ni livrée dans `textures-voitures.js`.
   - **« La chute d'eau est à refaire. C'est un vrai moteur : regarde la documentation de three.js pour faire une eau sympa. Là tu as fait cinq blocs de couleur. »** Vaut pour la grande chute, le rideau de la grotte et sans doute toute l'eau.
   - **« La descente de la rivière après le tunnel : l'idée est là, mais ça ne donne pas l'impression de rouler en descendant la rivière. »**
   - « Le reste est à peu près bien. »
5. Demandé plus tôt et pas fait : une « mécanique de feuilles » (des feuilles soulevées au passage), à la place des cônes.

Il ne veut pas qu'on lui demande des idées : on décide, on montre, il valide ou refuse.

## Le tour tel qu'il est (sens horaire, 3 581 m, 79 s au pilote automatique)

| Zone | Points de contrôle | Ce qu'il y a |
|---|---|---|
| Camp de base | 66 → 1 | départ sous un portique de bambou, tentes, feu, guirlande de lanternes, 4×4 |
| Marais tropical | 1 → 4 | chaussée de pierre au ras de l'eau, arbres sur racines-échasses, nénuphars ; du point 2 au point 3 la chaussée est sous 15 cm d'eau, entre des bornes |
| Chicane du fromager | 4 → 12 | l'arbre géant dans l'axe du freinage |
| Lacets | 13 → 28 | forêt fermée, tête colossale et sa suite à la première épingle, porte ruinée à la seconde |
| Pont de lianes | 32 → 33 | gorge, grande chute en face à gauche du temple |
| Temple-grotte | 34 → 40 | le tunnel du moteur, derrière un rideau d'eau ; deux puits de jour |
| Descente des idoles | 40 → 49 | forêt fermée, deux équerres, grande idole, statues |
| Rivière sur la route | 49 → 52 | un saut, puis la rivière coule sur la chaussée sur 220 m, entre des bornes |
| Cité perdue | 52 → 62 | arc triple, place, statue sur socle noir, temple à degrés, ruines |
| Gué | 63 → 65 | la rivière traverse la route, eau transparente, bornes |

## Où est le code

- `cartes.js`, entrée `chapada` : tracé (`pts`), largeurs, saut, surfaces, voiture, thème.
- `decors.js`, fonction `chapada(h)` : tout le placement. Rivière = tableau `RIV` (points avec niveau et demi-largeur), `marais(x, z)`, `gue(s)` (là où la chaussée est sous l'eau), `libre(x, z)` (où un arbre peut pousser), `VUES` (couloirs de vue vers les repères).
- `formes-chapada.js`, `textures-chapada.js` : formes et textures de la carte.
- `game.js` : cinq options ajoutées pour cette carte, toutes absentes par défaut (`th.depart[3]`, `th.gloss`, `th.tun.gloss`, `th.cones`, `th.brume`), décrites dans `docs/MOTEUR-OPTIONS-CARTES.md` section 10. Le reste de `game.js` et tout `sim.js` sont partagés avec onze autres cartes.

## Mesures

- `node outils/regime.js chapada touge` : 20 % du tour à plus de 85 % du rupteur (touge 18 %), aucun contact du pilote.
- `node test.js` et `node test-cartes.js` : verts après la fusion du 540 lignes.
- Temps d'image : dernière mesure avant les deux dernières passes et avant le 540 lignes, 2,3 à 2,6 ms sur une machine chargée (budget 2 ms, touge 1,9 à 2,4 ms dans la même mesure). **Pas remesuré depuis.** Passes de dessin : 246 à 254 (budget 300).

## Ce qui n'est pas au niveau, vu de l'intérieur

- **L'eau** : la chute est faite de boîtes à texture fixe ; la rivière est un ruban plat à texture fixe ; rien ne coule. La contrainte « version statique » a été levée de fait par le dernier retour.
- **La rivière sur la route** : la chaussée garde sa pente régulière et l'eau est une feuille posée 15 cm au-dessus ; pas de rapides, pas de rives, pas de courant lisible, forêt identique des deux côtés.
- **La grotte** : les parois, la voûte et les luminaires sont ceux du tunnel du moteur ; seuls des rochers ajoutés la distinguent.
- **La place de la cité** : mieux qu'avant, encore plate.
- **Sous-bois** : de gros blocs à facettes ; lisible, pas fin. À 540 lignes cela se voit davantage.
- **Jamais joué à la main par la session qui a construit la carte** : tout a été jugé sur captures et au pilote automatique.

## Outils

- Serveur : `python outils/capture.py 8103`, puis `http://127.0.0.1:8103/index.html?carte=chapada`.
- Captures sans écran : `PORT=8103 sh outils/capture.sh chapada "pas=3"` ou `"idx=183,868&jeu=1"` (`jeu=1` : rendu réel du jeu à gauche). Résultat dans `captures/` (ignoré par git). `python outils/planche.py captures <sortie> 3` colle les captures en planches de six.
- `outils/captures.html` avec `vue=` regarde la voiture, pas le décor : inutile pour inspecter un repère.
- Banc : `PORT=8103 node outils/banc-rapide.js [--profil] chapada touge`, puis `--fermer`.
- Trace or après tout changement de tracé : `node outils/traces-or.js chapada`.

## Pièges rencontrés

- Le code de `game.js` et de `decors.js` tient sur de très longues lignes : un commentaire `//` inséré au milieu d'une ligne coupe tout ce qui suit.
- Les notes automatiques et les panels de relecteurs ont noté à l'envers sur ce projet : juger sur captures, à côté de `touge`, et laisser l'auteur trancher.
- Un repère n'est vu que s'il est dans l'axe de la route : la caméra regarde devant (la chute posée sur le côté du pont n'était jamais vue).
- Le moteur fond le décor fixe par matière : chaque `h.mat(…)` distinct coûte une passe de dessin. La fonction `chapada` a un cache `mat(…)`.
- Le test des cartes exige que le virage le plus serré, élargi de `W`, passe en glisse à 120 km/h : avec `W: 4.5`, pas de rayon sous 20 m.
