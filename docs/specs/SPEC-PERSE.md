# SPEC — carte « ROUTE ROYALE » (Perse antique, Persépolis au couchant)

Spec de construction, à lire seule. Format de carte : voir l'en-tête de `src/donnees/cartes.js` (champs, `pts` en `[x, z, altitude]`, sens horaire, z vers le bas, départ en `[0]`). Surfaces : `SURF` dans `src/moteur/sim.js`. Modèles proches : `canal` (couchant, `large`), `stade` (`place` + `piles`), `ville` (`tun`).

## 1. Idée en une phrase
Un tour qui monte à Persépolis par la plaine, franchit la Porte des Nations, slalome dans la salle aux cent colonnes, sort dans un jardin turquoise et se jette dans les ruelles d'un bazar couvert. **Beaucoup de virages** (jeu de drift) : une seule vraie droite, la plaine.

## 2. Direction artistique
- **Style** : miniature persane / tapisserie, **très chargé**. Aplats sans dégradés, contours nets, motifs répétés partout *hors de la piste*, plans empilés, bâtiments frontaux. Arbres en silhouettes plates, nuages en volutes. La **route elle-même reste sobre** (lisibilité), tout l'ornement va sur les bords, murs, sol hors piste et ciel.
- **Heure** : couchant (soleil bas, ombres longues, contre-jour sur la Porte des Nations). Pas de pluie, pas de tempête de sable (écartée).
- **Palette** : rouge tapis `#c8323c`, or `#f0b840`, turquoise faïence `#2aa39a`, bleu lapis `#1d3a8a`, vert cyprès `#2f5a3a`, pierre dorée `#d8b878`, pierre grise `#8a8478`, ivoire `#f4ead0`, brique du bazar `#9a5a38`, nuit `#1d2a5a`.
- **Ciel** (`th.sky`, à la façon de `canal`) : du haut lapis `#1d2a5a`, puis violet `#5a3a78`, rose-rouge `#c8505a`, orange `#f08a3a`, horizon or `#ffc860`.
- **Brouillard** : `fog: 0xe0a060`, `fogD: [140, 1600]` (chaud, léger). Astre bas, côté de la Porte : `astre: { dir: [-0.8, 0.08, 0.4], col: '#ffd890', ombre: '#ffd890', taille: 320 }`. `hemi: [0x8a78b8, 0xc89a6a, 0.8]`, `sun: [0xffa850, 0.95]`, `bloom` léger, `phares: 0.3`, `chaleur: 0.4`.
- **Route** (`th.route`, format de `canal`) : chaussée pierre `#8a7a64` / `#968670`, lignes ivoire, vibreurs en alternance turquoise / rouge tapis (la bordure de tapis). **Murs** (`th.mur`) : ivoire, rouge tapis, lapis, pierre.
- **HUD** : `y '#f0b840'`, `c '#2aa39a'`, `r '#c8323c'`, fond `rgba(20,24,56,.9)`, style `plaque` ou `tableau`, titre `['ROUTE','ROYALE']`, sous-titre `PERSEPOLIS · COUCHANT`.

## 3. Tracé (points `[x, z, altitude]`, m, sens de course, départ en 0)
```
 0 [0,0,0]      1 [110,0,0]     2 [210,30,0]    3 [290,80,0]    4 [370,70,0]
 5 [450,20,0]   6 [540,10,0]    7 [620,50,0]    8 [660,120,0]
 9 [665,185,0] 10 [670,250,4]  11 [670,320,9]  12 [660,380,14] 13 [640,425,14]
14 [590,450,14]
15 [510,455,14] 16 [470,475,14] 17 [430,450,14] 18 [390,475,14] 19 [355,455,14]
20 [315,450,13]
21 [270,440,12] 22 [220,440,10] 23 [170,440,9]  24 [130,450,8]
25 [110,430,8] 26 [110,380,7]  27 [30,380,6]   28 [30,320,6]   29 [120,320,5]
30 [120,250,4] 31 [40,250,3]   32 [40,190,3]   33 [110,190,2]  34 [110,125,1]
35 [10,125,1]  36 [-45,100,0]  37 [-60,50,0]   38 [-35,10,0]   (boucle sur 0)
```
Longueur ≈ 2,5 km, tour visé ≈ 60–75 s : ajuster `sc` (échelle) si trop long. Les coudes du bazar (25–35) sont à 90° : mettre des points assez serrés pour des rayons ≥ 15 m, praticables en drift.

| Secteur | Points | Lieu | Conduite | Décor |
|---|---|---|---|---|
| 1. Plaine en S | 0–8 | Plaine de Marvdasht, route royale | Balayages gauche-droite rapides, un seul long virage de sortie ; la droite est ici | Palmiers et peupliers en silhouette, bornes, taureau ailé de loin, falaise de fond |
| 2. Grand escalier | 9–12 | Montée de la terrasse (+14 m) | Montée en virage, marches qui secouent (`paves`), mur à droite | Escalier à balustrade crénelée, frise d'Immortels et de cyprès sur les murs, rampe miroir en décor |
| 3. Porte des Nations | 12–14 | Entre les taureaux ailés | Passage étroit puis épingle à 90°, contre-jour | Deux taureaux ailés à tête humaine, piliers, linteau, ciel qui s'ouvre |
| 4. Cent colonnes | 14–20 | Salle hypostyle | **Slalom libre** (zone `place`), choix de ligne, l'allée centrale en tapis est la ligne rapide | Colonnes cannelées à chapiteau en protomé de taureau, plafond de poutres, sol damier, allée tapis rouge et or |
| 5. Jardin | 20–24 | Sortie de la salle, descente (+14 → +8) | Large, rapide, virages ouverts autour du bassin | Canal turquoise central (infranchissable), bassins ronds, massifs jaunes et rouges, cyprès, faïences |
| 6. Bazar | 25–38 | Ruelles couvertes, descente vers la ligne | Enchaînement de coudes à 90°, murs proches, pavés | Arcades, étals rayés, auvents, chameaux et ânes, lanternes, briques, voûte (tunnel) |

## 4. Mécaniques de la V1 (ce que le moteur sait déjà faire)
Valeurs de départ, à régler en jeu :
```js
W: 10, kmh: 0.8, vit: [150, 190], grip: 17, sc: 1, anticipe: 1,
large: [[0, 8, 16], [20, 24, 16]],            // plaine et jardin plus larges
surf: { zones: [[9, 12, 'paves', 0.8], [14, 19, 'mouille', 0.5], [20, 24, 'mouille', 0.3], [25, 38, 'paves', 1]] },
tun: [26, 34],                               // le bazar est couvert (voûte de briques)
place: { c: [430, 460], r: 55, a: 0, piles: [/* 15 colonnes, voir plus bas */] },
chaud: [12, 24], amb: [[12, 20], [25, 38]], sect: [13, 25],
trafic: 0,                                   // option : 3 chariots royaux à doubler si l'habillage suit
```
- **Marches** : `paves` (secoue, la voiture chasse un peu). **Marbre poli** de la salle et **jardin éclaboussé** : `mouille` à force partielle (glisse douce, pas de pluie). **Bazar** : `paves` plein, donc drift facile.
- **Salle aux cent colonnes** : `place` (cercle où l'on roule partout) avec les colonnes en `piles`, comme le centre de `stade`. 15 colonnes, demi-largeurs 2,5, en 5 colonnes de 3 rangées, une colonne sur deux décalée de 11 m (pas de couloir droit) : x ∈ {-36, -18, 0, 18, 36}, z ∈ {-22, 0, 22} (+11 pour x = -18 et 18). Les cent colonnes visuelles sont décorées autour. **Un seul `place` par carte** (à vérifier) : c'est donc la salle qui l'a.
- **Bazar couvert** : `tun` avec `th.tun` (sol, murs, paroi, plafond ; copier le format de `ville` et prendre les teintes brique, rouge tapis, or).
- **Altitudes** : de 0 à +14 m puis retour à 0. Vérifier dans `src/moteur/sim.js` (`pente`, `vert`) ce qu'elles font sans `sauts` ni `cuv`.
- **Sauts** : aucun en V1.

### Ce qui demanderait du code moteur nouveau (hors V1)
1. **Canal central infranchissable avec voie gauche ou droite** (secteur 5) : un obstacle long au milieu d'une route large, hors `place`. En V1 : le jardin est une route large sans choix, le canal est en bord de piste côté intérieur.
2. **Escalier à deux rampes en miroir** avec vrai choix : le tracé ne se divise pas. En V1 : une seule rampe, l'autre est du décor symétrique qui rejoint le même palier.
3. **Styles d'escalier variables** (image 2, 7, 8) : trois habillages, un par version de la carte ou par tour, à trancher.
4. **Trafic** (chariots royaux) : seulement si l'habillage de `trafic` peut être autre chose que des camions.
5. **Radio** : une station « Perse » à composer (daf, tar, santour, tempo vif) : hors périmètre de cette spec.

## 5. Décor à modéliser, par priorité
**P1 (indispensable, identité)**
- Colonne persépolitaine (fût cannelé, base en cloche, chapiteau à deux protomés de taureau), instanciée en masse ; plafond de poutres.
- Taureaux ailés à tête humaine (paire) et piliers de la Porte.
- Escalier : balustrade à créneaux, frise d'Immortels et d'arbres (texture répétée), rampe miroir.
- Bordure de tapis : bandes géométriques sur vibreurs et murs.
- Palmiers et cyprès en silhouette plate ; murs à arcades et étals rayés du bazar.

**P2**
- Canal turquoise, bassins ronds, massifs de fleurs jaunes et rouges, faïences à arabesques.
- Bannières, lanternes, auvents, chameaux et ânes statiques.
- Fond : tours à toit et façade de palais (image 2), dôme et minarets (image 3), falaise lointaine.

**P3**
- Nuages en volutes (image 4), foule en plans plats, falaise avec tombeaux cruciformes en silhouette, ciel en miniature.

## 6. Images du mood board (copies temporaires : les copier dans le dépôt avant usage)
Dossier : `C:\Users\antoi\AppData\Local\Temp\claude\a8dcc53abe7d21ba\ea21d2e3-137a-43e7-92cc-97ddd34913b1\images\`
1.png tapis rouge et or à médaillon (palette, bordures) · 2.webp palais Golestan, bassin-miroir, perron, cyprès · 3.png cour de la mosquée d'Ispahan (lithographie, iwans, faïences) · 4.webp avenue au canal central, arcades, chameaux, gros nuage · 5.png Porte des Nations en contre-jour orange · 6.png tempête de sable (**écartée**) · 7.png escalier de pierre, balustrade crénelée · 8.png frise d'Immortels, escalier · 9.png Porte des Nations vue d'en bas, ciel bleu · 10.webp gravure de la salle aux cent colonnes (sol damier, allée centrale) · 11.webp jardin Eram, canal turquoise, fleurs jaunes · 12.webp jardin à massifs, canal et bassins ronds.

Mots-clés complémentaires (en anglais) : `Persian miniature garden scene`, `Shahnameh illustration`, `Timurid miniature architecture`, `Persian garden carpet design`, `Safavid medallion carpet border`, `Persian tile arabesque`, `Persian bazaar alley painting`, `Isfahan Qaisariya bazaar`, `Persepolis Apadana relief`, `Hall of 100 Columns Persepolis`, `muqarnas ceiling`.

## 7. Reste à trancher
- Canal du jardin : accepter le compromis V1 (pas de choix) ou développer l'obstacle central.
- Escalier : trois styles (miroir en pierre, Immortels, perron Qajar) ou un seul pour la V1.
- Voiture et rivaux : non choisis (une propulsion légère ou une berline lourde ? noms de rivaux persans ?).
- Couleur dominante du bazar (brique chaude ou rouge tapis) et densité d'ornement jugée lisible à vitesse.
- Longueur et durée du tour, à mesurer au premier prototype ; budget de colonnes instanciées et d'ombres du décor.
