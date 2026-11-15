> **Document périmé.** La carte a été refaite sous le nom « Manuscrit 512 » : voir `propositions/PROPOSITION-chapada.md` (ce qui a été validé) et `propositions/ETAPE2-chapada.md` (ce qui est construit). Ce qui suit décrit l'ancienne carte « Matin sur la Chapada ».

# Carte « Matin sur la Chapada » (id proposé : `chapada`)

Brouillard, gorge et chutes de la Chapada Diamantina (Brésil), à l'aube. Pas d'Asie du Sud-Est, pas de latérite rouge (trop proche de `terre`) : roche gris-bleu, sable blanc, mousse, eau couleur thé.
À construire comme les autres cartes : une entrée dans `cartes.js` (champs documentés en tête de fichier), un `formes-chapada.js` et un `textures-chapada.js` (voir `formes-touge.js` / `textures-touge.js`), `th.decor: 'chapada'` branché dans `decors.js`. Vérifier avec `test-cartes.js`.

## Direction artistique

- **Heure** : 7 h, soleil bas à l'est, rayons rasants dans la brume. Pas de pluie.
- **Lumière** : or chaud dans les rayons, ombres bleu-vert. Ciel du zénith à l'horizon : `#8fb8b8` → `#cfe0d4` → `#f6e4b4`.
- **Brouillard** : couleur `#cdd9d0` (blanc verdâtre), `fogD` court `[12, 220]` (touge : `[45, 560]`) : on voit environ 200 m. Poches plus denses au pont et en fond de gorge : voir « Code moteur nouveau ».
- **Astre** : direction basse `[0.8, 0.25, 0.4]`, couleur `#ffd9a0`, `hemi` `[0xcfe6d8, 0x1d3a2a, 0.7]`, `sun` `[0xffe2b0, 0.8]`, `bloom` autour de 0.25 (les rayons doivent glisser, pas aveugler).
- **Palette** :
  - verts : forêt profonde `#1f4d34`, fougère `#5f9a45`, mousse `#7da23d`, feuille au soleil `#b6d46a`
  - roche : grise-bleue `#4b5359`, mouillée `#2c3236`, strates claires `#8c8f86`
  - sol : sable blanc `#e9e3d3`, terre grise `#a39d8c`
  - eau : thé `#8a5a2b` (reflets `#c58a4a`), chute turquoise `#5fc7c0`, écume `#f4faf7`
  - bois du pont `#8a6a3a`, câbles `#6c7075`
- **Route** : bitume usé `#3b3f3c` / `#4a4e49`, ligne `#ede6cf`, accent `#e9b44c` (reprendre le format de `th.route` de touge).
- **Interface** : style `trait` ou `panneau`, `y '#f2f0dc'`, `c '#ffb94a'`, `r '#ff5a4a'`, fond `rgba(10,22,18,.82)`.
- **Noms** : titre « MATIN SUR LA CHAPADA » (sous-titre à écrire), rivaux brésiliens (ex. TIAGO, LUANA, BRUNO).

## Tracé

`pts` : `[x, z, altitude]` en mètres, sens horaire, départ en `[0]`. Longueur environ 4,3 km, soit 1 min 30 à 1 min 40 par tour à 150-180 km/h. Point de départ : la grille se place avant `[0]`, sur la ligne droite de l'arche. Valeurs à ajuster au `sc`.

```
 0 [0,0,70]       15 [775,762,16]
 1 [250,0,70]     16 [690,735,14]
 2 [500,0,69]     17 [600,775,14]
 3 [760,70,66]    18 [510,735,14]
 4 [1075,175,62]  19 [425,762,14]
 5 [1175,250,58]  20 [287,762,18]
 6 [1075,312,55]  21 [150,762,20]
 7 [875,337,50]   22 [-40,717,26]
 8 [787,400,47]   23 [-100,600,32]
 9 [875,475,44]   24 [-25,500,40]
10 [1075,512,38]  25 [50,400,48]
11 [1162,600,31]  26 [-105,300,55]
12 [1075,662,25]  27 [-125,200,60]
13 [962,700,22]   28 [-100,62,67]   (puis retour à [0])
14 [850,737,19]
```

Forme : un grand rectangle parcouru dans le sens horaire. Haut : le plateau en ligne droite. Droite : trois épingles qui descendent. Bas : la gorge d'est en ouest, avec la chute, le gué, le pont. Gauche : la remontée, sur un tracé sinueux.

### Secteurs

| Points | Lieu | Intérêt de conduite | Décor |
|---|---|---|---|
| 0 → 3 | Plateau de départ (cerrado, sable blanc) | Ligne droite de 760 m puis courbe à droite, grille et vitesse de pointe. Le sable pâle contraste avec le vert sombre qui suit. | Arbres tordus bas, herbes sèches, brume rasante, soleil dans les yeux. Panneaux de bois, un cairn. |
| 3 → 12 | Lacets en gorge | Trois épingles (5, 8, 11) en descente, falaise à l'intérieur et vide à l'extérieur. Zone de dépassement : on freine tard dedans. La brume cache la sortie. | Parois verticales avec strates, fougères arborescentes sur les corniches, petites chutes lointaines, garde-corps en bois. |
| 12 → 14 | Galerie derrière la chute | Passage droit sous le rideau d'eau, vue coupée 1 à 2 s, route mouillée. Pas de virage : le risque est de perdre ses repères. | Cascade de 40 m, voûte de roche mousseuse, embruns, arc-en-ciel à la sortie, lumière turquoise. |
| 15 → 19 | Gué | Route large en S. Bande centrale mouillée (plus courte), bords secs et plus longs. Risque contre gain lisible. | Rivière thé, galets, troncs tombés, sable blanc sur les bords. |
| 20 → 21 | Pont suspendu | Voie unique d'environ 140 m, on se place avant. Le brouillard s'épaissit dès le point 19. Légère oscillation (rendu). | Planches, câbles d'acier, pylônes de bois, grand arbre fantomatique dans le blanc, rivière en dessous. |
| 22 → 27 | Remontée en forêt | S rapides en montée (de 26 à 60 m), sous-bois, rayons de soleil. Zone de récupération, lecture piégeuse par taches claires et sombres. | Troncs, lianes, bromélias, feuilles au sol, rayons additifs. |
| 27 → 28 → 0 | Arche de roche | Dernière ligne droite sous une arche naturelle, aspiration possible, sortie lumineuse. | Arche de grès gris, soleil en face, brume dorée. |

## Mécaniques V1 avec ce que le moteur sait déjà faire

- `W: 7`, `kmh` autour de 0,75, `vit [150, 185]`, `grip` autour de 20, `anticipe: 1` (épingles). Pas de `tun`, pas de `sauts`, pas de `trafic`, pas de `place`.
- **Surfaces** : `surf: { fond: 'sec', zones: [[12, 14, 'mouille', 1.5], [15, 19, 'mouille', 2], [20, 21, 'mouille', 0.5], [22, 27, 'mouille', 0.4]], large: 'sec' }`. La route est donc sèche sur le plateau, les lacets et l'arche, humide dans la galerie, le gué, le pont et le sous-bois.
- **Gué** : `large: [[15, 19, 13]]`. Au-delà de W (7 m), la route est `large` donc sèche : le centre (14 m) est mouillé et les deux bandes de 6 m sont sèches. Le décor doit poser du sable blanc sur ces bandes, de l'eau au centre (« ce qu'on voit est ce qu'on roule »).
- **Pont** : voie unique via `large: [[20, 21, 4.5]]`. À vérifier : si `large` n'accepte pas une largeur inférieure à W, c'est une petite modification de `buildTrack`.
- **Musique et ambiance** : `chaud: [4, 14]` (lacets et chute), `sect: [8, 21]`, `amb: [[12, 14], [15, 19]]` (cascade, rivière), `radio` à composer (station dans l'esprit forró électro, MPB, bossa) : c'est du travail à part, voir `RADIO` dans `cartes.js`.
- **Option à tester** : `th.pluie` en zones, par exemple `[[12, 14, 2], [15, 19, 1]]`, pour simuler des embruns locaux avec le mécanisme de trajectoire qui sèche. À garder seulement si ça ne ressemble pas trop à la pluie de la ville.

## Code moteur nouveau (hors V1 minimale)

1. **Rideau de cascade** : dans les points 12 à 14, un plan d'eau translucide sur la caméra (1 à 2 s), embruns, bruit sourd. C'est du rendu et de l'audio, pas de la simulation.
2. **Gué comme vraie surface** : nouvelle entrée `SURF.gue` (ex. `roul` élevé, `vir` et `trac` moyens) pour que l'eau freine plus que `mouille`, avec gerbes et traînée d'éclaboussures. En attendant, `mouille` force 2 fait le travail.
3. **Brouillard par poches** : `fogD` variable selon la position (pont, fond de gorge), sans changer le thème global.
4. **Oscillation du pont** : mouvement visuel des planches et de la caméra, éventuellement un léger ralentissement en cas de vitesse excessive. Simple décor animé au départ.
5. **Rayons de lumière** : cônes additifs dans la forêt et sur les parois, animés lentement.

## Décors à modéliser, par priorité

1. **P1** : parois de gorge (deux côtés, strates, mousse), arbres et canopée, fougères arborescentes, sol de sable blanc, brume en nappes, la grande cascade avec son rideau, rochers.
2. **P2** : pont suspendu (planches, câbles, pylônes), eau du gué (teinte thé, reflets), galets, bromélias, lianes, troncs tombés, petites chutes sur les parois, arche de roche, rayons de lumière.
3. **P3** : arc-en-ciel dans les embruns, toucans et papillons bleus (quelques sprites), garde-corps et panneaux de bois, cabane de garimpeiro (chercheur de diamants), cairns, arbres tordus du cerrado, sempre-vivas.

## Mood board

- **Images données par l'utilisateur** (copies dans le dossier temporaire de la session, à recopier dans `docs/` si on veut les garder) :
  - `C:\Users\antoi\AppData\Local\Temp\claude\a8dcc53abe7d21ba\17211c82-d606-4713-9977-b08b07394091\images\1.webp` : l'arrière d'une chute, mousse jaune-vert sur la roche (galerie).
  - `…\images\2.webp` : gorge verte et brumeuse, falaises à strates.
  - `…\images\3.png` : rayons de soleil dans un sous-bois (remontée).
  - `…\images\4.webp` : pont suspendu dans la brume (ici en cordes, en câbles d'acier pour la carte).
- **Mots-clés** : `Chapada Diamantina canyon`, `Cachoeira da Fumaça`, `walk behind waterfall`, `basalt waterfall moss`, `tea colored river quartz sand`, `sandstone cliff jungle fog`, `steel cable footbridge jungle`, `light rays rainforest path`, `morning mist canyon sunrise`, `rock arch jungle road`, `Chapada Diamantina white sand`, `tree fern forest`, `bromeliad forest`, `waterfall mist rainbow`.

## À trancher

- Nom de la voiture et du son (la carte n'impose pas de voiture ; une propulsion légère ou une compacte conviendrait).
- Faut-il faire évoluer la carte au tour 2 (brume plus dense, lumière plus haute) ? Hors V1.
- Largeur réelle du pont (voie unique) et de la bande de gué (13 m ici) : à régler au jeu.
- Amplitude du S du gué (points 16 à 18) : assez marquée pour que la ligne mouillée gagne vraiment, pas assez pour que l'IA la rate.
- Comment l'IA choisit-elle sa ligne au gué (ligne sèche ou mouillée) ? Voir `autopilot` dans `sim.js`.
- Les embruns par pluie locale : oui ou non.
- Radio : trois stations à composer.
- Longueur du tour (4,3 km) à comparer aux autres cartes et à réduire si besoin avec `sc`.
