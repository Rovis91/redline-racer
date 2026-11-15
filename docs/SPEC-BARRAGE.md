# SPEC · Carte BARRAGE (`id: 'barrage'`)

> **Remplacée par la refonte.** Le site, le tracé et le décor en place suivent `propositions/PROPOSITION-barrage.md` (points B-01 à B-45, validés par l'auteur). Ce qui suit est la spec V1, gardée pour mémoire : son tracé, ses indices et sa halle traversée ne correspondent plus au jeu.

Spec de construction, V1. Sources : `propositions/barrage.html` (concept, minimap) et `propositions/moodboard-barrage.html` (47 images Wikimedia Commons en liens directs : il n'y a aucun fichier image dans le dépôt, la page ouvre les photos sur leur page source). Format des cartes : voir l'en-tête de `cartes.js`.

Une centrale hydroélectrique soviétique des années 70, vannes ouvertes. Le circuit monte de 10 m (vallée) à 105 m (crête) en passant *dans* le mur, puis redescend par les lacets de la falaise. Boucle de **5,7 km**, aucun croisement de la route avec elle-même (voir « Décisions de conception »).

## 1. Direction artistique

- **Heure / lumière** : matin voilé, soleil bas et pâle derrière la brume, ciel gris-acier qui chauffe à l'horizon. Ni nuit ni couchant : toutes les autres cartes le sont.
- **Brouillard** : `fog: 0xc3cdc9`, `fogD: [80, 900]` (de la vallée on voit le mur sortir de la brume ; à tester depuis la crête : on doit voir le vide et la vallée).
- **Ciel** (`sky`) : `#6f8aa0` (haut) → `#9db4c0` → `#d6d2c0` (horizon) → `#c9cfc8`. `stars: 0`. Astre : `#fff0d0`, bas sur l'horizon, côté retenue.
- **Palette**
  - béton clair `#8d918a`, béton sombre `#6d726d`, joints de coffrage `#5a5e5a`
  - vert d'eau (machines, rambardes) `#5fa89a`
  - orange sécurité (pont roulant, balises, garde-corps du pont) `#e8761e`
  - jaune sodium (tunnels) `#f2b43a`
  - eau `#7fb4d0`, écume `#e8f2f4`
  - rouge délavé (lettres peintes, panneaux) `#b5483c`
  - roche des rives `#5c5446`, bitume `#4a4d50`, ligne `#e8e4d8`
- **Tunnel** (`th.tun`) : parois béton `#8d918a` / `#6d726d`, plafond `#6d726d` avec néons `#f2b43a`, sol sombre `#3a3c3e`, `fog` `0x2a2a24`, portail `0x8d918a`, bords de route `#e8761e`.
- **Éviter** : symboles politiques réels (étoile, faucille). Garder l'architecture : béton, mosaïques, lettres peintes en cyrillique (`ГЭС`, numéros de groupes).

## 2. Tracé

Repère : x vers l'est, z vers le sud, vue de dessus, **sens horaire**. Les points sont `[x, z, altitude]` en mètres, départ en `[0]` (ligne droite de la vallée, cap ouest). Le mur de 100 m court le long de l'axe z ≈ 0 (crête), la retenue est au nord (z < 0), la vallée au sud (z > 0), la rivière descend du mur vers le sud en x ≈ 0.

```js
pts: [[300,430,10],[100,430,10],[-100,430,10],[-300,425,10],[-450,410,10],[-570,360,10],[-620,300,10],[-590,250,10],[-500,232,10],[-350,232,11],[-200,238,13],[-70,245,14],[70,245,14],[200,240,14],[310,235,21],[345,210,24],[345,170,26],[330,148,28],[300,135,30],[220,135,35],[120,135,35],[20,135,35],[-70,135,35],[-170,135,37],[-250,135,38],[-292,128,40],[-310,112,42],[-292,96,43],[-250,90,46],[-120,90,53],[30,90,62],[120,90,68],[162,84,70],[180,67,71],[162,51,73],[120,45,75],[-20,45,84],[-160,45,92],[-250,45,97],[-292,40,100],[-310,22,101],[-292,5,103],[-250,0,105],[-100,0,105],[100,0,105],[250,2,105],[380,0,105],[470,0,105],[560,6,98],[650,28,90],[692,68,86],[655,108,81],[560,112,74],[490,122,68],[468,160,64],[505,198,60],[600,206,52],[680,222,46],[705,265,42],[668,305,38],[580,318,30],[490,340,23],[430,385,17],[380,420,12]]
```

Indices de contrôle (distance depuis le départ) : 8 → 1109 m · 11 → 1539 m · 13 → 1809 m · 16 → 2003 m · 19 → 2142 m · 22 → 2432 m · 24 → 2612 m · 42 → 3754 m · 47 → 4474 m · 63 → 5630 m · boucle 5711 m. Altitudes interpolées à la longueur d'arc entre les points d'ancrage (pentes de 12 % au maximum, rien de brutal). Les virages en épingle ont environ 22 m de rayon : à confirmer au pilotage.

Les points n'ont pas été passés dans `buildTrack` : c'est la première chose à faire (voir « À vérifier »).

### Secteurs

| # | Indices | Lieu | Altitude | Intérêt de conduite | Décor attendu |
|---|---|---|---|---|---|
| 1 | 0–8 (et 63→0) | **Vallée aval** : droite de départ cap ouest, puis grand virage en U vers le nord | 10 m | Départ calme, vitesse haute, on voit le mur grossir ; le U est un freinage large | Route de service, pylônes HT, cabane de garde, silos, panneaux `ГЭС` peints, rivière à gauche, mur au fond dans la brume |
| 2 | 8–15 | **Pont** en acier au pied du mur (sur la rivière, indices 11–12), puis rampe vers la rive droite | 10 → 21 m | Ligne droite longue sur le pont, embruns (route mouillée) ; trajectoire côté mur ou côté extérieur selon la mouillure | Face aval du mur de 100 m à gauche, 5 à 7 vannes qui crachent des gerbes, bassin de dissipation, garde-corps orange, portiques |
| 3 | 15–19 | **Portail et tunnel d'accès** dans la base du mur | 24 → 35 m | Entrée brutale dans le noir (`tun` démarre en 16), montée régulière | Portail béton massif, néons sodium, suintements, grondement étouffé |
| 4 | 19–23 | **Salle des turbines** : 290 m de halle en ligne droite, cap ouest | 35 m | Route élargie (`large`), vitesse haute entre les alternateurs, repère du vacarme | Alternateurs vert d'eau de chaque côté, pont roulant orange au plafond, colonnes, mosaïque murale, grandes baies, poussière lumineuse |
| 5 | 23–42 | **Galeries en zigzag** dans le mur : épingle ouest (25–28), jambe est (28–31), épingle est (32–35), jambe ouest (35–38), épingle ouest (39–41) | 37 → 105 m | Trois épingles, montée de 70 m sans voir dehors, dépassements aux sorties d'épingle | Galeries suintantes, hublots donnant sur la retenue, numéros de niveaux peints, tuyauterie |
| 6 | 42–47 | **Crête** : droite de 720 m, étroite, au bord du vide (cap est) ; sortie du tunnel en 42 | 105 m | Le moment fort : sortie en pleine lumière, vitesse maximale, parapet bas, vide à droite | Parapet béton bas, lampadaires, retenue à gauche (plan d'eau), vide et gerbes à droite, portiques des vannes, tour de contrôle |
| 7 | 47–63 | **Lacets de la falaise** (4 jambes, 3 épingles à l'est, puis retour dans la vallée) | 105 → 12 m | Descente en épingles serrées, freinage, dépassements aux sorties, vue sur le bassin | Roche, murets, glissières, filets pare-pierres, bassin et gerbes en contrebas, camions de chantier |

## 3. La crue, tour par tour

Idée de départ : 3 tours qui changent (tour 1 sec, tour 2 embruns, tour 3 pleine crue, raccourci du déversoir fermé). **Rien dans `sim.js` / `cartes.js` ne varie d'un tour à l'autre**, et le déversoir est un embranchement (le moteur a une seule boucle). Donc :

- **V1** : un état fixe, « vannes ouvertes » (équivalent du tour 2). Pas de crue progressive, pas de raccourci.
- **V2** (code moteur nouveau) : état de la carte par tour (embruns, déversoir fermé), embranchement du déversoir.

## 4. Mécaniques V1 avec ce que le moteur sait déjà faire

D'après les commentaires de `cartes.js` et de `sim.js` ; les valeurs sont des propositions à régler.

- **Surfaces** (`surf`, types de `SURF` : `sec`, `mouille`, `glace`, `neige`, `paves`, `terre`) : fond `sec`. Zones `mouille` fondues sur 20 m : pont `[9, 14, 'mouille', 1]`, galeries suintantes `[26, 40, 'mouille', 0.35]`, bas des lacets `[60, 63, 'mouille', 0.6]`. La crête reste sèche (à 250 km/h, `mouille` fait aquaplaner : `vaq` = 190 km/h).
- **Embruns** : `th.pluie` par zones `[a, b, force]` (comme le wangan) : `[[8, 15, 3], [58, 63, 2]]`. Sous `tun`, la pluie est coupée (sec), d'où les `surf` des galeries ci-dessus.
- **Tunnel** (`tun`) : un seul intervalle par carte : `tun: [16, 42]`. Il couvre le tunnel, la halle et les galeries.
- **Largeur** : `W` étroit pour la crête (proposition 9, canal est à 14), `large: [[0, 6, 12], [19, 22, 16]]` pour la halle et le départ. `kmh` à régler.
- **Saut** (`sauts`) : un saut du bec à la fin de la crête : `[[47, 30, 1.5, 24, 8]]` (longueur, hauteur, fosse, profondeur). Une fosse obligatoire peut être trop dure : à tester, sinon la retirer.
- **Trafic** : `trafic: 4` (camions de chantier dans les lacets et la vallée), pour les dépassements.
- **Divers** : `chaud: [42, 56]` (crête + lacets), `sect: [24, 47]`, `amb: [[8, 15], [19, 23], [42, 47]]` (gerbes, halle, crête), `anticipe: 1` (épingles), `vit` à régler sur les vitesses vraies (la crête est la plus rapide).
- **Thème** : `th.decor: 'barrage'`, `fog`/`fogD`/`sky`/`astre`/`hemi`/`sun` (section 1), `th.hud` (style `panneau` ou `plaque`, accent orange `#e8761e`), titre « BARRAGE 74 ».

### Ce qui demande du code moteur nouveau (hors V1)

- Rafales latérales sur la crête (aucun vent dans `sim.js`).
- Crue progressive d'un tour à l'autre.
- Raccourci du déversoir (embranchement) et saut du bec en optionnel.
- Rampe hélicoïdale (la route se superposerait à elle-même en vue de dessus, d'où les galeries en zigzag).
- Brume locale (le brouillard est global : `fogD`).
- Une halle visuellement plus vaste que la coque du tunnel.

## 5. Décor à modéliser, par priorité

Nouveau thème `barrage` dans `decors.js`, formes et textures dans `formes-barrage.js` et `textures-barrage.js` (même motif que `formes-paris.js`, `textures-paris.js`).

1. **Mur aval** (face de 100 m, joints de coffrage) avec 5 à 7 vannes et leurs **gerbes** (sprites ou particules) ; **embruns** sur le pont ; **pont en acier** ; **parapet et lampadaires de la crête** ; **portails** du tunnel ; **salle des turbines** (alternateurs, pont roulant, colonnes) ; **galeries** (néons, suintements, hublots).
2. **Retenue** vue de la crête (plan d'eau), **rivière** et bassin de dissipation, roches et rives, lacets (murets, glissières, filets), pylônes haute tension et poste électrique, portiques des vannes, tour de contrôle.
3. Lettres peintes `ГЭС` et numéros de groupes, mosaïque murale, silos et cabanes de la vallée, arcs-en-ciel dans les gerbes, panneaux de danger, camions, oiseaux.

## 6. À vérifier avant de construire

1. Passer les 64 points dans `buildTrack` : la route est-elle lisse (courbure des épingles), l'altitude jouable, la boucle bien fermée entre `[63]` et `[0]` ?
2. Lire la manière dont `tun` génère la coque et sa largeur : jambes de galerie espacées de 45 m en plan, halle large de 16 m. Sinon, élargir l'espacement en z.
3. Le tracé de la crête (720 m à vitesse maxi) fait-il assez « longue droite » ? Sinon, reculer les épingles ouest de 150 m (crête de 870 m).
4. Pentes et sauts : `vert` / altitude dans `sim.js` accepte-t-il 70 m de dénivelé en 1 100 m de galerie, et 93 m en 1 150 m de lacets ?
5. La fosse du saut du bec est-elle trop punitive ?

## 7. À trancher

- Crue progressive en V2 : combien de tours par course dans ce jeu (3 ?), et la voulons-nous vraiment ?
- Raccourci du déversoir : on le garde pour la V2, ou on l'abandonne ?
- Nom de la carte : « BARRAGE 74 » est provisoire.
- Voiture, radio et rivaux : à choisir (aucune n'est proposée ici ; cohérence avec les années 70 soviétiques).
- Médailles (`med`) : à fixer après un tour de pilote automatique.
