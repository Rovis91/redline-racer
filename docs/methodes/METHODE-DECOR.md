# Méthode pour retravailler une carte sans gaspiller de tokens

But : une session par carte, en parallèle, qui ne se marchent pas dessus et où le modèle cher ne lit jamais d'image.

## Qui fait quoi

| Étape | Qui | Entrée | Sortie |
|---|---|---|---|
| 1. Analyse de la carte | sous-agent **Sonnet** | les deux planches du tour (`plan.js <carte> tour`) | une liste écrite de constats, un par capture (ce qu'on voit, ce qui cloche, à quel échantillon de piste) |
| 2. Modélisation | l'orchestrateur (**Opus**) décide et écrit, ou confie une forme bien spécifiée à un sous-agent Sonnet | les constats + la demande de l'auteur | formes, textures, placement |
| 3. Validation des modèles | sous-agent **Sonnet** | le duo avant/après de chaque plan modifié, `--vue=` pour un objet | par objet : conforme / défaut précis |
| 4. Revalidation du circuit | sous-agent **Sonnet** | les deux planches du tour refaites + les tests | comparaison avec l'étape 1, erreurs console, temps d'image, tests |

Règles d'économie :
- **L'orchestrateur ne lit aucune image.** Seuls les sous-agents Sonnet ouvrent les captures ; ils rendent du texte, court, avec le nom du fichier et l'échantillon de piste.
- **Un critique lit des planches** (12 vues par image), jamais les captures une à une. Un tour complet tient en deux planches.
- **Un critique par zone ou par étape**, avec ses planches et une question précise. Deux critiques ne reçoivent pas les mêmes images.
- On ne refait le tour complet qu'à l'étape 4 ; entre-temps, seulement les plans touchés, en duo avant/après.

## Où poser un décor : là où le joueur le voit

Erreur la plus fréquente sur les dernières cartes : du décor posé dans les espaces vides de la carte, mais hors du champ de la caméra de course. On ne le voit qu'à l'arrêt en tournant la caméra : il coûte sans rien apporter.

- **On part de la caméra, pas du plan de la carte.** Les vides à remplir sont ceux que montrent les captures en caméra de course, pas ceux qu'on voit sur la carte vue de dessus. Le joueur ne déplace pas sa caméra : un objet caché par un bâtiment, hors du champ ou vu seulement de très loin n'existe pas pour lui (sur plage, la grande roue, vue de loin puis cachée de près entre deux bâtiments).
- **Plus c'est loin, plus c'est gros.** Le détail fin ne se lit qu'au bord (0 à 15 m). Au plan moyen (15 à 80 m), on lit des volumes. Au fond (au-delà de 80 m), seulement une silhouette : elle doit être grande pour exister.
- **Plus c'est sur le côté, plus c'est simple.** En vision périphérique et à pleine vitesse, un objet se comprend par sa forme et sa couleur, franches et contrastées avec le fond. Un objet chargé de petits détails sur le côté se lit comme du bruit.
- **On valide en roulant.** Un décor est accepté quand on le voit et le reconnaît sur `node outils/plan.js <carte> <plan> --pas=15`, en caméra de course, à la vitesse du tour. `--vue=` sert à inspecter le modèle ; il ne prouve jamais qu'on le voit. Ce qui n'apparaît sur aucune capture en caméra de course est déplacé ou retiré.

## L'outil de capture

`node outils/plan.js` rend une image en deux secondes environ, sans rouler jusqu'à l'endroit. La piste est coupée en 20 plans (le plan 14 est le quatorzième vingtième).

```bash
node outils/plan.js wangan tour          # les 20 plans, en deux planches
node outils/plan.js wangan 14 --avant    # avant de modifier
node outils/plan.js wangan 14            # après : 14.jpg et 14.duo.jpg (avant | après)
```

- un endroit précis : `@700` (échantillon de piste) ; un objet vu de près : `--vue=angle,distance,hauteur` ; un endroit qu'on revoit souvent : `--nom=pont`, puis `node outils/plan.js wangan pont` ;
- ce qui ondule ou clignote ne se voit qu'en mouvement : `--rafale=6` ;
- l'image est sans interface, pour voir tout le décor ; `--hud` la remet.

Résultat dans `captures/plans/<carte>/` (ignoré par git), rien n'est jamais effacé. Chaque copie du jeu a son port, tiré de son chemin. Le mode d'emploi complet est en tête de `outils/plan.js`.

`outils/captures.html` reste l'outil d'un tour **roulé** (ce qui dépend de la course : dégâts, chocs forcés, tour 3) ; ses paramètres sont en tête du fichier, `sh outils/capture.sh <carte> "<paramètres>"` le lance sans écran.

## Pour ne pas se marcher dessus

Chaque session travaille dans son worktree et n'écrit que dans son périmètre :

| Session | Formes et textures nouvelles | Placement | Autres fichiers autorisés |
|---|---|---|---|
| wangan | `src/cartes/wangan/formes-wangan.js`, `src/cartes/wangan/textures-wangan.js` (à créer au besoin, avec leur ligne dans `index.html`) | `src/cartes/wangan/decors-wangan.js` | entrée `wangan` de `src/donnees/cartes.js`, bloc pluie de `src/moteur/game.js` |
| touge | `src/cartes/touge/formes-touge.js`, `src/cartes/touge/textures-touge.js` (à créer au besoin, avec leur ligne dans `index.html`) | `src/cartes/touge/decors-touge.js` | fonction `terrain` de `src/rendu/decors.js`, entrée `touge` de `src/donnees/cartes.js` |
| paris | `src/cartes/paris/formes-paris.js`, `src/cartes/paris/textures-paris.js` | `src/cartes/paris/decors-paris.js` | entrée `paris` de `src/donnees/cartes.js` ; `src/moteur/sim.js` seulement si le tracé l'exige, tests à l'appui |
| canal | `src/cartes/canal/formes-canal.js`, `src/cartes/canal/textures-canal.js` | `src/cartes/canal/decors-canal.js` | entrée `canal` de `src/donnees/cartes.js` |
| voitures | `src/rendu/formes-voitures.js`, `src/rendu/textures-voitures.js` | section « voiture » de `src/moteur/game.js` | — |
| départ | forme `depart` de `src/rendu/formes.js` | bloc « ligne et portique de départ » de `src/moteur/game.js` | — |

`src/rendu/formes.js` et `src/rendu/textures.js` (catalogues communs) se lisent, ne se modifient pas — sauf la session « départ » pour sa forme. Les fichiers par carte complètent les catalogues par `Object.assign(FORMES, { … })` et `Object.assign(TEXTURES, { … })`, et le placement par `Object.assign(DECORS, { … })` ; les poseurs que les cartes partagent (`inst`, `insts`, `boite`, `terrain`…) sont dans `src/rendu/decors.js`. Personne ne touche à `src/audio/audio.js`.

## Terminé quand

- la demande de l'auteur est traitée point par point, ou un point est signalé non fait avec la raison ;
- l'étape 4 ne relève aucune erreur console sur la carte, `sh outils/verifie.sh` est vert ;
- le temps d'image n'a pas dérapé par rapport à l'étape 1 (le noter avant / après) ;
- tout est committé sur la branche de la session, rien poussé ; le message final commence par les commits, puis liste ce qui a changé et ce qui n'a pas pu être vérifié (le mouvement, notamment).
