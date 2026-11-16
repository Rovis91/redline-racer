# SPEC-PLAGE : carte « Playa 307 » (Riviera Maya)

Spec de construction pour une session qui n'a pas vu la conversation. Lire d'abord l'en-tête de `src/donnees/cartes.js` (champs d'une carte) et `SURF` dans `src/moteur/sim.js`. Une carte = un tracé + une voiture + une radio + un thème.

Thème retenu par l'utilisateur : Playa del Carmen et ses cénotes, **Mexique moderne, sans aucun imaginaire maya** (ni pyramide, ni glyphes, ni ruines). Jeu en journée, plein soleil. Distinct de `jungle` (autre session) : ici la végétation est basse, le paysage est côtier.

Identité de course : **plage éblouissante → rue de fête → marché couvert → route de garrigue → cénote (gué ou rampe) → grotte → lobby d'hôtel → retour plage**. Trois intérieurs : le jeu n'en a jamais eu.

## 1. Direction artistique

- Heure : midi, soleil haut, ombres courtes. Ciel bleu dur, nuages blancs boursouflés. Un seul éclairage (le moteur n'a pas d'heure variable) : pas de marée, pas de crépuscule.
- Lumière : éblouissante, un peu surexposée sur le sable (bloom léger, mirage de chaleur). Intérieurs : contraste fort, ombre fraîche, rayons de lumière dans la grotte.
- Palette (hex indicatifs) :
  - ciel haut `#1478d8`, milieu `#2f95e6`, horizon `#dff3f8`
  - sable sec `#f4ecd8`, sable mouillé `#d9c9a3`, ombre de sable `#bfae85`
  - mer turquoise `#19c7c9`, eau profonde `#0a7fa8`, écume `#ffffff`
  - cénote : eau `#1fd6b0` vers `#0b6b78`, calcaire `#cbbf9c` / `#8a7e62`, lianes `#4c8f2a`
  - palmiers `#3f8f2a` / `#7ab32e`, noix de coco `#f2c230`, paille des palapas `#c9a05a`
  - façades ocre `#f2b45a`, jaune `#f7d36b`, terracotta `#d9693a`, blanc chaud `#fff4e0`
  - papel picado : rose `#ff3d7f`, jaune `#ffb100`, turquoise `#1fb5a8`, violet `#7a4bd6`, orange `#ff6a2b`
  - grotte : fond `#0a2a30`, rayons `#fff3c0`
- Brouillard : clair, très loin, couleur `0xcfeeff`, `fogD: [180, 1800]` ; `chaleur: 0.5` (mirage, déjà géré par le moteur) ; `stars: 0`.
- Bloc `th` indicatif :
  ```
  th: { decor: 'playa', fog: 0xcfeeff, fogD: [180, 1800],
        sky: [[0,'#1478d8'],[0.3,'#2f95e6'],[0.45,'#8fd0f0'],[0.49,'#dff3f8'],[0.5,'#cfeeff'],[1,'#cfeeff']], stars: 0,
        astre: { dir: [-0.3, 0.85, 0.2], col: '#fffbe8', ombre: '#fffbe8', taille: 220 },
        hemi: [0xbfe3ff, 0xf3e3b8, 1.0], sun: [0xfff2d0, 1.0], phares: 0, bloom: 0.06, scan: 0, chaleur: 0.5,
        hud: { y: '#fffbe8', c: '#ff3d7f', r: '#ff6a2b', fond: 'rgba(10,70,90,.88)', style: 'panneau', split: 0, jp: null,
               sur: [null, 'RIVIERA MAYA · MIDI'], titre: ['PLAYA', '307'] } }
  ```
  Valeurs à ajuster à l'œil (voir `canal`, `paris` pour des journées déjà réglées). `tun` : voir §3, secteur 7.
- Id `playa`, nom `PLAYA 307` (la route 307 longe la côte). Rivaux : `['CAMILA', 'DIEGO', 'LUPE']`.

## 2. Tracé

Convention du moteur : `pts: [[x, z, altitude], …]`, **sens horaire** (z vers le bas sur un plan vu de dessus), départ en `[0]`. La grille de départ est placée **derrière** `pts[0]`, sur 40 m environ : `pts[0]` est donc sur la ligne droite de la plage, loin du virage précédent. Longueur totale ≈ 2,6 km ; `W: 8`, `sc: 1`, à ajuster (`kmh` ≈ 0,7, `vit` ≈ [160, 195], `grip` ≈ 22).

Plan (le nord, z négatif, est la mer ; la plage longe z = 0) :

```
 mer   z<0     [ponton : épingle]
 plage z=0   ═══►═══╗                      x=0 → 660
 lobby  ▲           ║  rue + marché         (z 45 → 340)
 x=0    ║           ▼
       grotte ◄══ cénote ◄══ garrigue ◄═╝  z≈452
```

Points (indices dans l'ordre de course) :

| i | [x, z, alt] | i | [x, z, alt] | i | [x, z, alt] |
|---|---|---|---|---|---|
| 0 | [150, 0, 0] | 16 | [660, 160, 0] | 32 | [170, 452, -1] |
| 1 | [300, 0, 0] | 17 | [660, 215, 0] | 33 | [120, 452, -3] |
| 2 | [420, 0, 0] | 18 | [660, 260, 0] | 34 | [70, 452, -3] |
| 3 | [470, -6, 0] | 19 | [660, 300, 0] | 35 | [35, 448, -1] |
| 4 | [490, -40, 0] | 20 | [660, 340, 0] | 36 | [5, 415, 0] |
| 5 | [490, -100, 0] | 21 | [660, 385, 0] | 37 | [0, 360, 0] |
| 6 | [497, -118, 0] | 22 | [645, 425, 0] | 38 | [0, 300, 0] |
| 7 | [515, -125, 0] | 23 | [600, 448, 0] | 39 | [0, 250, 0] |
| 8 | [533, -118, 0] | 24 | [540, 452, 0] | 40 | [0, 190, 0] |
| 9 | [540, -100, 0] | 25 | [440, 452, 0] | 41 | [0, 140, 0] |
| 10 | [540, -40, 0] | 26 | [424, 512, 0] | 42 | [0, 90, 0] |
| 11 | [550, -6, 0] | 27 | [380, 556, 0] | 43 | [5, 40, 0] |
| 12 | [590, 2, 0] | 28 | [320, 572, 0] | 44 | [30, 10, 0] |
| 13 | [640, 15, 0] | 29 | [260, 556, 0] | 45 | [80, 0, 0] |
| 14 | [655, 45, 0] | 30 | [216, 512, 0] | | |
| 15 | [660, 100, 0] | 31 | [200, 452, 0] | | |

Altitude : plat partout, sauf la descente dans la grotte (points 32 à 35, jusqu'à -4). Les altitudes à 0 sont voulues (la `place` est plate).

Secteurs :

| # | Points | Lieu | Intérêt de conduite | Décor attendu | Intérieur |
|---|---|---|---|---|---|
| 1 | 43 → 2 (via 0) | Plage de départ | Longue ligne droite de vitesse, deux largeurs : sable dur au centre (grip), sable mou sur les côtés (trace en `large`) | Mer turquoise à gauche (nord), palmiers et palapas à droite, parasols, barques, balisage de bouées et cordes | non |
| 2 | 3 → 11 | Ponton | Chicane d'entrée, **épingle** au bout (rayon ~25 m, voie aller et voie retour séparées par ~50 m), chicane de sortie | Planches, pilotis, palapa-bar au centre du U, lampadaires, garde-corps, mer de chaque côté | non |
| 3 | 12 → 17 | Rue aux guirlandes | Piste étroite, dalles claires, enfilade sous les guirlandes | Papel picado en fils au-dessus de la route, façades ocre, étals, enseignes, vélos garés | non |
| 4 | 18 → 20 | **Marché couvert** | Ligne droite resserrée entre les étals, pénombre après la rue ensoleillée | Halle haute avec toit de tôle et paille, piliers, étals de chapeaux et d'hamacs, éclairage filtré par les ouvertures | **oui** |
| 5 | 21 → 24 | Route de garrigue | Répit en plein soleil, grandes courbes, dos d'âne (topes) | Broussaille basse, palmiers nains, murets de pierre sèche, poteaux, topes peints | non |
| 6 | 25 → 31 | Cénote ouvert | **Choix** : rampe sèche (arc au sud, ~380 m) ou traversée directe du bassin (~240 m, sol meuble) | Cirque calcaire, lianes, eau turquoise, escalier de bois, baigneurs | non |
| 7 | 32 → 35 | **Grotte du cénote** | Descente dans l'ombre, flaques qui font glisser, rayons de lumière | Stalactites, parois claires, puits de lumière, eau fluo, cordes de balisage | **oui** (`tun`) |
| 8 | 36 → 42 | **Lobby d'hôtel** | Large hall carrelé et mouillé, on remet de la vitesse avant la plage | Colonnes, toit de palapa, piscine ouverte sur le côté, bar de paillote, plantes en pot | **oui** |

Entre les secteurs 8 et 1 : virage 43 → 45, de la sortie de l'hôtel vers la plage.

## 3. Mécaniques de la V1 (ce que le moteur sait déjà faire)

Exemple de bloc carte (à poser entre `pts` et `th` selon la structure des autres cartes) :

```
W: 8, kmh: 0.7, vit: [160, 195], grip: 22, sc: 1, anticipe: 1,
large: [[45, 2, 20]],
surf: { fond: 'sec',
        zones: [[43, 2, 'mouille', 0.35], [14, 17, 'paves', 1], [33, 35, 'mouille', 0.6], [37, 41, 'mouille', 0.5]],
        large: 'terre' },
place: { c: [320, 452], r: 125, a: 0, piles: [] },
tun: [32, 35], chaud: [25, 35], sect: [16, 31], amb: [[3, 11], [32, 35]],
```

- `large` (plage) : demi-largeur 20 m de 45 à 2, raccord sur 60 m de chaque côté. La route (|d| ≤ W) est le sable dur ; au-delà, `surf.large` s'applique : le sable mou.
- `surf.zones` : plage dure = `mouille` à 0,35 (sable humide qui accroche) ; rue = `paves` (dalles claires, la voiture chasse un peu) ; flaques de la grotte = `mouille` à 0,6 ; hall carrelé = `mouille` à 0,5. Sous un `tun` la pluie n'existe pas, mais les zones continuent de jouer (vérifier `route()` dans `src/moteur/sim.js`).
- `surf.large: 'terre'` sert de **proxy de sable mou ET de gué** (même ligne de la table : `trac` 0,3, `colle` 0,6, `roul` 0,5). Une seule surface hors bitume par carte : c'est la limite du moteur.
- `place` : le cénote ouvert. Un cercle de rayon 125 m centré sur le bassin (320, 452) : on y roule partout, hors murs. Le tracé (arc des points 26 à 30) en fait le tour par le sud, mais la voiture peut traverser en ligne droite (gain ≈ 140 m), à condition d'accepter le sol meuble. L'IA suit le tracé. À vérifier : `piles: []` est accepté, et comment `buildTrack` traite la `place` sans monument. Le décor doit dessiner le cercle comme un bassin d'eau peu profonde (turquoise) avec rebord calcaire ; garder cohérents ce qu'on voit et ce qu'on roule.
- `tun: [32, 35]` : la **grotte** est le seul `tun` de la carte (le moteur n'en accepte qu'un). Remplir `th.tun` sur le modèle de `ville` / `wangan` : `sol`, `murs`, `paroi`, `plafond`, `fog` (`0x0a2a30`), `portail` (`0xfff3c0`), `neons`, `coque` (couleurs en §1). La paroi calcaire est la texture de grotte à créer.
- `anticipe: 1` (épingle du ponton) ; `trafic` absent ; pas de `sauts` ni de `cuv` en V1 (un tremplin sur la rampe du cénote est possible en option, mais active le relief pour toute la carte).
- Interdit en V1 : tout ce qui est maya (voir en tête).
- À règler dans `src/donnees/cartes.js` : `car` (voiture à choisir, voir §7), `radio`, `rivaux`, `med` (médailles, défaut OK).

### Intérieurs

- **Grotte** : `tun`, directement.
- **Marché (4) et lobby (8)** : comme `tun` est unique, ils sont construits **dans le décor** comme des bâtiments creux autour de la route : toit, piliers ou murs de part et d'autre, plafond à ≥ 7 m (la caméra est à `camH` 3,2 par défaut ; la monter ou garder le plafond haut pour ne pas la faire traverser). Pas de portail ni de fondu de brouillard dans cette version : ombre franche sous le toit, éclairage plus bas, ambiance sonore via `amb`.
- Option plus ambitieuse (hors V1) : étendre `tun` à une liste de segments, avec une config de décor par segment. À décider (voir §6).

### Nécessite du code moteur nouveau (hors V1, noté pour plus tard)

- Une vraie surface « sable » et une « eau peu profonde » séparées (aujourd'hui `surf.large` est unique) : lignes de table `SURF` avec un `roul` plus fort pour l'eau (gué ralenti), plus une surface hors route par zone.
- `tun` multiple (marché, lobby, grotte).
- Eau profonde infranchissable à côté du gué, vagues sur la plage, marée : abandonnés pour cette version.
- Éclairage intérieur propre (soleil coupé sous le toit, rayons volumétriques).

## 4. Objets de décor à modéliser, par priorité

1. **Priorité 1 (la carte est lisible avec ça)** : palmier (2 variantes, noix jaunes), palapa et parasol, terrain de sable avec bord mouillé, mer turquoise avec écume, balisage de plage (bouées et cordes : c'est le mur côté mer), guirlandes de papel picado (fils au-dessus de la route), façade ocre (3 variantes), étal de marché, ponton (planches, pilotis, garde-corps, palapa-bar central), piliers et toit de halle.
2. **Priorité 2 (identité)** : bassin de cénote (roche calcaire, lianes, escalier de bois), stalactites et stalagmites, rayons de lumière (billboards), colonnes et piscine du lobby, bar de paillote, barques colorées, dalles de la rue, sargasses sur la laisse de mer, topes peints.
3. **Priorité 3 (vie)** : mouettes, pélicans, voiles de kitesurf, baigneurs, vendeurs, tuk-tuks et taxis garés, flamants, enseignes, drapeaux, hamacs, vélos.

## 5. Mood board

Images fournies par l'utilisateur (si les fichiers ont disparu, utiliser les mots-clés plus bas) :
- `C:\Users\antoi\AppData\Local\Temp\claude\a8dcc53abe7d21ba\bbdb3a39-387c-4682-a470-488dda0ef9b1\images\1.png` : plage cartoon avec crabe et rampes. Ambiance seulement : **ne rien en copier** (panneau, personnage).
- `...\images\2.webp` : plage blanche, mer turquoise, cocotiers à noix jaunes, palapas (référence principale du secteur 1).
- `...\images\3.webp` : cénote ouvert avec lianes (Ik Kil).
- `...\images\4.webp` : cénote vu d'en haut, eau sombre, végétation dense.
- `...\images\5.webp` : cénote-grotte avec rayons de lumière (référence du secteur 7).
- `...\images\6.webp` : rue piétonne sous papel picado, façades ocre, étals de chapeaux (références des secteurs 3 et 4).

Mots-clés (anglais) :
- Plage : `Playa del Carmen white sand turquoise`, `Riviera Maya beach palapa`, `sargassum shoreline Caribbean`, `coconut palm beach Mexico`, `Caribbean fishing boats colorful`
- Rue et marché : `Quinta Avenida Playa del Carmen`, `papel picado street Mexico`, `Mexican artisan market straw hats`, `Tulum town colorful street`, `Mexican coastal village stucco ochre`
- Cénote ouvert : `cenote open sinkhole vines`, `Ik Kil cenote`, `cenote hanging roots turquoise water`, `cenote wooden stairs`
- Grotte : `cenote cave light rays`, `Samula cenote`, `cenote stalactites turquoise`, `Gran Cenote Tulum`
- Route : `Yucatan limestone road`, `Quintana Roo scrub forest road`, `Mexican highway topes speed bumps`, `Tulum beach road palapa hotels`
- Lobby : `Tulum boutique hotel lobby palapa`, `open-air hotel lobby pool Mexico`

## 6. À trancher

1. **Intérieurs** : la demande de l'utilisateur disait « à l'intérieur des notes » (probablement « des bâtiments ») : confirmer qu'il s'agit bien de **passer à l'intérieur de bâtiments** (marché couvert, lobby d'hôtel) et pas seulement de la grotte.
2. Marché et lobby : bâtiments creux en décor (V1) ou extension de `tun` à plusieurs segments ?
3. `place` pour le cénote : OK avec `surf.large: 'terre'` comme proxy du sable mou et du gué, ou ajouter dès la V1 les lignes `SURF.sable` et `SURF.eau` ?
4. Voiture (`car`) : une coccinelle, un buggy de plage, une jeep ? Radio : style (cumbia, reggaeton, surf) à écrire.
5. Longueur et vitesse : 2,6 km convient-il ? À valider une fois roulable (`vit`, `grip`, `med`).
6. Style HUD : réutiliser un style existant (`panneau` proposé) ou en créer un nouveau.
7. Sauts sur la rampe du cénote (option).
