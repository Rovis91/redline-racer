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
- **Un critique par secteur ou par étape**, avec ses planches et une question précise. Deux critiques ne reçoivent pas les mêmes images.
- On ne refait le tour complet qu'à l'étape 4 ; entre-temps, seulement les plans touchés, en duo avant/après.

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
| wangan | `formes-wangan.js`, `textures-wangan.js` (à créer au besoin, avec leur ligne dans `index.html`) | `decors-wangan.js` | entrée `wangan` de `cartes.js`, bloc pluie de `game.js` |
| touge | `formes-touge.js`, `textures-touge.js` (à créer au besoin, avec leur ligne dans `index.html`) | `decors-touge.js` | fonction `terrain` de `decors.js`, entrée `touge` de `cartes.js` |
| paris | `formes-paris.js`, `textures-paris.js` | `decors-paris.js` | entrée `paris` de `cartes.js` ; `sim.js` seulement si le tracé l'exige, tests à l'appui |
| canal | `formes-canal.js`, `textures-canal.js` | `decors-canal.js` | entrée `canal` de `cartes.js` |
| voitures | `formes-voitures.js`, `textures-voitures.js` | section « voiture » de `game.js` | — |
| départ | forme `depart` de `formes.js` | bloc « ligne et portique de départ » de `game.js` | — |

`formes.js` et `textures.js` (catalogues communs) se lisent, ne se modifient pas — sauf la session « départ » pour sa forme. Les fichiers par carte complètent les catalogues par `Object.assign(FORMES, { … })` et `Object.assign(TEXTURES, { … })`, et le placement par `Object.assign(DECORS, { … })` ; les poseurs que les cartes partagent (`inst`, `insts`, `boite`, `terrain`…) sont dans `decors.js`. Personne ne touche à `audio.js`.

## Terminé quand

- la demande de l'auteur est traitée point par point, ou un point est signalé non fait avec la raison ;
- l'étape 4 ne relève aucune erreur console sur la carte, `sh outils/verifie.sh` est vert ;
- le temps d'image n'a pas dérapé par rapport à l'étape 1 (le noter avant / après) ;
- tout est committé sur la branche de la session, rien poussé ; le message final commence par les commits, puis liste ce qui a changé et ce qui n'a pas pu être vérifié (le mouvement, notamment).
