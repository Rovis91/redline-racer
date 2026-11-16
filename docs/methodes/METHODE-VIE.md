# Méthode pour donner de la vie aux cartes

Phase qui suit le décor statique : animations, eau, lumière, son, objets interactifs. Cartes visées : `perse`, `plage`, `barrage`, `chapada`. Les numéros de ligne datent du 15 novembre 2026, avant le découpage de `src/rendu/decors.js` en un fichier par carte (`decors-<carte>.js`) : ceux de `src/rendu/decors.js` sont périmés, chercher par nom dans le fichier de la carte.

## Règles

- **On développe d'abord, on mesure après.** Pas de banc de performance pendant cette phase. On élaguera à la fin si c'est trop lourd.
- **Une idée compte si elle se perçoit depuis la voiture en roulant.** Un moment fort par zone vaut mieux que dix détails.
- **Visible par toi n'est pas visible par le joueur** : la règle « Où poser un décor » de `docs/methodes/METHODE-DECOR.md` vaut aussi pour ce qui bouge. Un objet qu'on ne voit pas en caméra de course ne reçoit ni ajout ni animation.
- **Rien qui bouge ou clignote au point de freinage ni près des chevrons.**
- **Un vent par carte** : palmes, guirlandes, fumée, vagues dans le même sens.
- **Décor pur par défaut** : trains, bateaux, animaux ne se percutent pas. Tout objet percutable doit dépendre du temps de course, sinon fantômes et jeu en ligne se désynchronisent.
- **Réutiliser avant d'écrire** : l'inventaire ci-dessous d'abord.
- Périmètre et git : une branche par sous-session, rien de poussé ; `src/moteur/sim.js` et `src/moteur/game.js` sont partagés par toutes les cartes : proposer à l'auteur avant de les changer.

## Étapes

1. **Socle commun** (une session) : les briques de la section « À construire ».
2. **Analyse par carte** (une sous-session par carte, lecture seule) : rend `docs/propositions/VIE-<carte>.md`. Grille : chaque zone du cahier × six familles (eau, lumière, mouvement mécanique, vivant, son, interactif). Par idée : ce que le joueur perçoit, l'`idx`, la brique utilisée, la priorité. Les demandes de l'auteur en tête. Les zones vides ou trop chargées sont listées à part : c'est du décor (`docs/methodes/METHODE-DECOR.md`), à traiter avant.
3. **L'auteur coche** les idées retenues.
4. **Réalisation** par carte, par lots (eau, mouvement, son, interactif), `sh outils/verifie.sh` après chaque lot.
5. **L'auteur joue**, retour, fusion.

## Demandes de l'auteur

- **plage** : vagues ; oiseaux au loin sur la mer ; bruit et objets au marché ; résonance et ambiance d'eau dans les cénotes ; du nouveau chez les flamants ; meubler la zone vide de la plage.
- **barrage** : phares dans le brouillard de la crête ; route mouillée en pente ; gare plus grande, vrais rails, trains qui roulent et qu'on recroise ; radars qui tournent à la base ; turbines qui tournent et leur bruit ; bruit des chutes d'eau.
- **chapada** : effets d'eau et cascade ; ambiance sonore de la cascade ; animaux et leurs bruits.
- **perse** : vie dans le bazar ; éléments sur la route ; revoir les parties trop chargées ou trop vides.

## Ce qui existe et se réutilise

### Le tick d'un décor

- Une fonction de décor peut renvoyer `tick(dt, now, car)` (`src/rendu/decors.js:9`, appel `src/moteur/game.js:828`). `car` est la voiture du joueur 1.
- `dt` vaut 0 en pause ; `now` (horloge murale) continue. **Animer sur `dt`** pour que la pause fige tout.
- `tick.vue(car)` est appelé une fois par vue (écran partagé) : seul wangan s'en sert.
- `h.temps()` : horloge du trafic, −1 en course (`src/moteur/game.js:606`).
- **Tout ce qui bouge porte `userData.dyn = 1`**, sinon la fusion du décor le fige (`src/moteur/game.js:1147`).
- État des quatre cartes : seule chapada a un tick (`src/rendu/decors.js:2818`, eau et vapeur). perse, barrage et plage n'en renvoient pas.

### Techniques déjà écrites (à copier)

| Besoin | Modèle | Où |
|---|---|---|
| Eau qui coule | `coule(m, u, v)` : `Texture.offset` avancé par le tick, deux couches | chapada `src/rendu/decors.js:2580` |
| Mobile sur une boucle | `boucle(u, p)` : navires | wangan `src/rendu/decors.js:1093` |
| Mobile sur un chemin, calé sur le tour | `surChemin`, `parcours`, `placeCabo` | wangan `src/rendu/decors.js:1069-1080` |
| Véhicules instanciés qui roulent | `flotte()` + `trafic(T, t)` | wangan `src/rendu/decors.js:1309-1335` |
| Mobile le long de la piste | livreur à vélo | paris `src/rendu/decors.js:1540` |
| Rotation continue | phare, manège, grande roue et nacelles d'aplomb, rotor | wangan `src/rendu/decors.js:1322-1327`, terre `660` |
| Déclenché à l'approche | rideau de fer, pigeons qui s'envolent | paris `src/rendu/decors.js:1551-1561` |
| Réaction à la course | ola, étincelles au saut, confettis, salle éteinte au dernier tour | stade `src/rendu/decors.js:419-453` |
| Clignotement | `visible` alterné, `color.setHex` | givre `577`, touge `882` |
| Foule à deux poses | `map.offset.y` 0 ou 0,5 | stade `438`, canal `1706` |
| Flammes instanciées | échelle par `setMatrixAt` | stade `442` |
| Bande de sommets ondulante | aurores | givre `569-582` |
| Points qui montent | vapeur `VAP` | chapada `2758` |
| Panache permanent | `h.vapeur(x, y, z)` | `src/moteur/game.js:605` |
| Faisceau tourné vers la caméra | `h.beams` | ville `src/rendu/decors.js:238` |
| Groupe mobile en une passe | `soude(h, grp, fam)` | `src/rendu/decors.js:30` |

### Formes prêtes mais jamais posées

- **perse** : `personnage` (robe teintée par instance), `chameau`, `ane` (`src/cartes/perse/formes-perse.js:50, 93, 97`).
- **plage** : `flamant(t)` avec la variante tête dans l'eau, `velo` (`src/cartes/plage/formes-plage.js:69, 85`).
- **commun** : `wagonCouvert`, `pompeBalancier` (`src/rendu/formes.js:116, 120`).
- **barrage** : forme et textures `gerbe`, `ecumeGES` prévues pour défiler, jamais branchées.
- Personnages d'autres cartes : `berger`, `passant`, `fetard`, `figurant`, `livreur`. Oiseaux : `pigeon`, `chouette`.

### Son (`src/audio/audio.js`, tout en synthèse, `window.SON`)

- Lits d'ambiance `AMB[M.id]` et événements `ambEvent` (`src/audio/audio.js:45, 513`) : sept cartes anciennes seulement. Acoustique du lieu `ESP[M.id]` (`src/audio/audio.js:596`).
- Réverbération de tunnel par `ConvolverNode` (`src/audio/audio.js:741`), la même partout.
- Source placée dans l'espace : seulement les autres véhicules (`voixLoin`, `src/audio/audio.js:688`, panoramique, Doppler, occlusion).
- Les décors n'appellent jamais le son. `SON.frame(dt, SE)` reçoit `amb` (0..1) et `car.idx`, sans identifiant de zone (`src/moteur/game.js:1913`).
- Banc d'écoute : `pages/ecoute.html`, scènes dans `pages/ecoute/ecoute.js` ; `autotest` et mesures hors ligne servent de contrôle sans oreille.

### Moteur

- Mouillé : `th.mouilleVisible`, zones `surf` `mouille`. Brume : `th.brume`. Luminaires : `h.lum()`, 20 au plus, figés. Halo : `TH.bloom`.
- Objets percutables : cônes et `th.objets` (`src/moteur/game.js:1049`), purement visuels, non synchronisés en ligne.
- Particules : `flou()`, `emit()`, `trait()` internes à `src/moteur/game.js` ; seul `h.vapeur` est ouvert aux décors.

## À construire (socle)

1. **Ambiance sonore par zone** : dire à `src/audio/audio.js` dans quelle zone on est ; lits et événements pour les quatre cartes ; sources ponctuelles avec distance (cascade, turbine, train, sur le modèle de `voixLoin`) ; réverbération par lieu (cénote, halle). Scènes correspondantes dans le banc d'écoute.
2. **Horloge commune des shaders** : il n'y en a pas. Elle ouvre les vagues, le vent dans la végétation et les drapeaux en vertex shader. Attention : `eclaire` remplace `onBeforeCompile` sans l'enchaîner (`src/moteur/game.js:408`).
3. **Vagues et écume de rive** : aucune surface d'eau moteur aujourd'hui ; plage et barrage ont une eau statique.
4. **Mouillé en pente** : la passe de reflets prend la verticale du monde comme plan de réflexion (`src/moteur/game.js:2053`) au lieu de la pente de la chaussée ; s'y ajoute `plat = step(.8, n.y)` (`src/moteur/game.js:366`). Cause déduite du code, à confirmer par un plan avant/après.
5. **Faisceaux de phares dans la brume** : rien n'existe pour la voiture du joueur ; le halo de passe finale ne suit pas `th.brume`.
6. **Particules ouvertes aux décors** : exposer `flou` dans `h` (embruns, fumée, poussière).
7. **Aides d'animation dans `src/rendu/decors.js`** : sortir `coule` et `boucle` de leurs cartes pour qu'elles servent partout.
8. **Voir le mouvement** : plans à plusieurs instants avec `outils/plan.js`.

## Pièges

- **barrage** : train, tram et nacelles sont des cubes fondus dans un seul lot (`peints`, `src/rendu/decors.js:2536`) ; il faut les en sortir pour les déplacer. Pas de forme de locomotive.
- **perse, barrage** : matières partagées par cache ; animer un `map.offset` touche toutes les pièces de cette matière.
- **plage** : les lots de plus de 120 instances sont redécoupés à la fin (`src/rendu/decors.js:3224`) ; une référence gardée ne pointe plus sur l'objet affiché. La grande roue est d'un seul tenant.
- **Chaussée reposée par un décor** : elle ne lit pas la mouillure (chapada).
- **`src/moteur/rythme.js`** réécrit chaque image la couleur des `MeshBasic` opaques : il peut écraser un clignotement.
- **Écran partagé** : un seul tick, piloté par le joueur 1 ; le son suit l'humain le mieux placé.
