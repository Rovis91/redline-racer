# Méthode pour faire une carte, nouvelle ou à refaire

Complète `docs/methodes/METHODE-DECOR.md` (outils de capture, rôles Opus et Sonnet, périmètres).

Pourquoi cette méthode : perse, barrage, chapada et plage ont demandé trois versions complètes (V1, V2, refonte) et une dizaine de séries de retours. Le décor a été construit avant que le tracé et le terrain soient validés : l'auteur découvrait sur une carte décorée que le tracé n'était « que des tunnels », que le lac dépassait le barrage, que la route du Brésil n'avait pas d'ambiance de jungle, et tout le décor posé repartait avec. Et chaque session posait ses objets où elle voulait : objets qui flottent, textures sur la route, murs sans décor, zones vides à côté de zones surchargées. Les critiques par l'IA ne voient pas ces défauts (elles notaient les V2 au-dessus des anciennes cartes) : on les évite par construction, on ne compte pas sur une relecture pour les trouver.

Le principe : **trois validations de l'auteur, chacune sur une version jouable, et rien de la phase suivante avant la validation.** La maquette de la phase 2 fixe où chaque chose va ; la phase 3 ne fait que remplir ces emplacements.

## Phase 1 : moodboard et direction artistique

L'auteur fournit le moodboard (images). La session écrit `docs/specs/SPEC-<CARTE>.md`, une page :

- le lieu, l'heure, la lumière, la palette, l'ambiance en une phrase (« aventure dans la jungle à la Indiana Jones », pas « jungle ») ;
- les zones, dans l'ordre du tour, avec pour chacune son repère principal et **ce qui fait la transition** vers la suivante (sol, palette, lumière, densité qui changent progressivement) ;
- l'anti-référence de chaque élément important (« pas un château européen ») ;
- la fiche `docs/refs/REFS-<carte>.md` : deux sources par élément, 3 à 5 traits reconnaissables à 150 km/h.

**Validation 1** : l'auteur accepte ou refuse la spec, point par point. Pas de code avant.

## Phase 2 : la maquette jouable

Une seule session construit toute la carte, sans aucun détail :

- le tracé (`pts`, `large`, `tun`, `sauts`, `surf`), le terrain et son relief, les niveaux d'eau ;
- **tout le décor en blocs** : des formes basiques (cubes, cylindres, cônes) de couleur unie, à la taille réelle de ce qu'elles remplaceront, posées sur le sol, chacune avec son nom écrit au-dessus (« maison », « bosquet », « temple », « marché »). Un bosquet est un seul gros volume, pas vingt arbres ; un quartier, quelques blocs. On doit pouvoir lire en roulant comment les choses tiennent ensemble : ce qui borde la route, ce qui ferme la vue, ce qui sert de repère au freinage, où passe chaque transition. Le poseur de blocs nommés n'existe pas encore : la première maquette l'ajoute aux poseurs partagés de `src/rendu/decors.js` (à côté de `boite`) ;
- les blocs placés et dimensionnés depuis la caméra de course, selon « Où poser un décor » de `METHODE-DECOR.md` ;
- **les murs de collision seulement là où un bloc les porte**, vérifiés avec `?hitbox` ;
- la boîte de vitesses et l'échelle du compteur réglées pour la carte (pas plus d'un quart du tour au rupteur) ;
- les notifications de virage sur les seuls virages serrés ;
- un fichier de décor par zone, `src/cartes/<carte>/decors-<carte>-<zone>.js`, déclaré dans `index.html`, qui ne contient que les blocs de la zone : c'est ce qui permet la phase 3 en parallèle.

Avant de rendre : `sh outils/verifie.sh` vert, trace or refaite.

**Validation 2** : l'auteur joue la maquette. Il juge le tracé, le rythme, la vitesse, la largeur, le relief, et la place des blocs : ce qui manque, ce qui est de trop, ce qui gêne la vue. Tout changement de tracé, de terrain ou de bloc se fait ici, quand il ne coûte rien. Après cette validation, **le tracé, le terrain, l'eau et les blocs sont gelés** : un changement passe par l'auteur.

## Phase 3 : les zones, en parallèle

Une session par zone, chacune dans son fichier de décor et ses formes. Son travail est de **remplacer chaque bloc de la zone par le vrai décor, dans son emprise** :

- le décor reste dans le volume du bloc et garde sa base au sol du bloc ;
- rien ne se pose hors d'un bloc, sauf le mobilier de bord de route (lampadaires, barrières, panneaux) listé dans la spec ;
- chaque bloc est rempli : pas de zone vide, pas d'objet en plus ;
- le tracé, le terrain et les murs de collision ne bougent pas ; les bandes de transition entre zones appartiennent à la zone qui précède ;
- on réutilise les formes des anciennes cartes (oiseaux de paris, sapins de touge) avant d'en créer.

Pour chaque bloc remplacé : planche avant (`--avant`) et après de `node outils/plan.js`, `--vue=` sur l'objet neuf, comparés à la fiche REFS ; puis la validation en roulant de « Où poser un décor » (`METHODE-DECOR.md`). Une zone ne touche pas à l'animation.

**Validation 3** : l'auteur joue la carte statique complète et donne ses retours en une liste numérotée. Ils vont dans `docs/cahier-feedback/<carte>/CAHIER.md`, chaque point avec son état (fait, refusé avec la raison, vérifié par quelle capture). Un point marqué fait sans capture n'est pas fait.

## Phase 4 : la vie

Seulement après la validation 3 : animations, particules, oiseaux, bateaux, sons d'ambiance, éléments destructibles, selon `docs/methodes/METHODE-VIE.md`. Chaque son nouveau se règle contre la musique de la carte avant de rendre. Chaque animation se vérifie en `--rafale`. On réutilise ce qui existe sur les anciennes cartes avant de créer.

## Phase 5 : les performances

`node outils/banc-rapide.js <carte>` au budget de `outils/perf.js`, deux passes pour distinguer un pic au même endroit (vrai problème) d'un pic au hasard (la machine). Un changement visible pour le joueur se demande à l'auteur avant.

## Ce que rend chaque session

Les commits sur sa branche, rien de poussé ; les points de la demande un par un (fait, ou pas fait avec la raison) ; ce qui n'a pas été vérifié, en particulier le mouvement.
