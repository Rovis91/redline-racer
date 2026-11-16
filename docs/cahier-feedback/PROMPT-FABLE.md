# Prompt pour Fable : refaire les quatre nouvelles cartes

Tu reprends le projet « Ville à plein régime », un jeu de course arcade en three.js. Ce dépôt est le jeu.

## Le but

Il faut **refaire les quatre nouvelles cartes** :
- **Route royale** : `perse` ;
- **Barrage 74** : `barrage` ;
- **Matin sur la Chapada** : `chapada`, la carte du Brésil ;
- **Playa 307** : `plage`.

Elles doivent arriver au niveau des anciennes cartes, déjà finies, que l'auteur trouve très bonnes : ville, touge, wangan, paris, canal, givre, terre, stade. Aujourd'hui, les quatre nouvelles sont nettement en dessous.

Tu es l'orchestratrice. Tu lances des sous-sessions sur Fable (`claude-fable-5-2`), une ou plusieurs par carte, et tu les suis jusqu'au bout.

## Ce que tu as en main

- **`cahier-feedback/README.md`** : la synthèse. Avis général de l'auteur, problèmes communs à plusieurs cartes, et pourquoi le barème automatique s'est trompé.
- **`cahier-feedback/<carte>/CAHIER.md`** : un cahier par carte, avec ses captures. Il liste les problèmes généraux puis zone par zone : les retours de l'auteur, mot pour mot, et ceux d'une analyse. Il ne contient volontairement aucune solution : c'est à toi de les trouver.
- **Les specs et les sources de la V1/V2** : `docs/SPEC-<CARTE>.md` et `docs/REFS-<carte>.md`, sur les branches V2. Ce sont des points de départ, pas des contraintes. La direction artistique peut changer.
- **Le code des V2** : les branches `claude/carte-perse-v2-48e1b0`, `claude/carte-barrage-v2-3360a7`, `claude/carte-chapada-v2-b9a43e` et `claude/carte-plage-v2-f173a0`. Main contient encore les V1.
- **Les options du moteur** ajoutées pour ces cartes : branche `claude/moteur-options-cartes-31146a`, documentée dans `docs/MOTEUR-OPTIONS-CARTES.md` sur cette branche. Elle offre un filtrage linéaire des textures, une chaussée plus fine, un terrain à plusieurs matières, des ombres douces, des tunnels et salles voûtés avec ouvertures et rayons, l'adaptation de l'œil, une chaussée mouillée visible, un retour visuel au frôlement, et des captures en haute résolution. Elle n'est pas fusionnée dans main.
- **Les méthodes** : `METHODE-DECOR.md`, qui décrit les outils de capture et les périmètres, et `METHODE-NOUVELLE-CARTE.md`. Garde les outils, mais pas la confiance dans les notes automatiques (voir plus bas).
- **Comment une carte est faite** :
  - son entrée dans `cartes.js` (`pts`, `large`, `surf`, `tun`, `sauts`, `trafic`, `place`, `th`) ;
  - sa fonction dans `decors.js` ;
  - ses fichiers `formes-<carte>.js` et `textures-<carte>.js` ;
  - ses lignes `<script>` dans `index.html` ;
  - sa trace or dans `traces-or.js` ;
  - sa ligne `PAL` et sa place dans `G.SOIREE`, dans `game.js`.
- **Les outils** :
  - `python outils/capture.py <port>` sert le jeu ;
  - `outils/captures.html?carte=&pas=|idx=|vue=&taille=1920&jeu=1` fait les captures ;
  - `node outils/banc-rapide.js [--profil] <carte>` mesure le coût ;
  - `node test.js` et `node test-cartes.js` sont les tests (Node 22.12 ou plus).

## Ce que l'auteur attend de toi

**Il veut seulement valider ou refuser.** Il a déjà donné toutes ses idées : elles sont dans les cahiers. Ne lui redemande pas d'idées. Pour chaque carte, propose-lui des modifications précises et complètes, qu'il accepte ou refuse point par point.

**N'hésite pas à proposer de gros changements** quand le cahier le justifie : thème, tracé, zones entières, palette, lumière. Surtout pour la **carte du Brésil (chapada)**. L'auteur la veut comme une aventure dans la jungle, à la Tomb Raider ou Indiana Jones : jungle étouffante et luxuriante, mystère, brume au fond de la forêt. Aujourd'hui, elle ressemble à un film d'horreur dans une carte abandonnée. Les zones hors de la forêt ne lui plaisent pas du tout, et celles de forêt sont bâclées. Pour les autres cartes :
- **perse** : il manque du décor entre les zones, et certaines zones, comme le départ, en ont trop ;
- **barrage** : l'ambiance et l'élévation sont à revoir. La forme du sol n'a pas de sens, des bâtiments sont mal placés, et on voit des dessous de textures ;
- **plage** : il manque de la continuité, de la fête, et surtout le point d'eau de la cénote.

## Le déroulé

### Étape 1 : propositions, validées par l'auteur

Pour chaque carte, une sous-session Fable lit le cahier et capture la carte actuelle et une ancienne carte de référence. Elle écrit ensuite une proposition. Tu la relis et la mets en forme, puis tu la présentes à l'auteur pour qu'il valide. La proposition suit cet ordre :

1. **Direction artistique** : le lieu, l'époque, l'heure, la lumière, la palette, l'ambiance, les références réelles avec leurs sources. C'est la colonne vertébrale.
2. **Circuit** : le tracé, comment il se joue (rythme, freinages, dépassements, moments forts), comment il se ressent (vitesse, ouverture, oppression, surprise).
3. **Décors généraux** : les grandes masses de chaque zone, le relief, l'eau, l'horizon, le décor lointain.
4. **Transitions** : comment on passe d'une zone à l'autre, sans rupture de sol, de palette ni de lumière. C'est le défaut commun aux quatre cartes.
5. **Détails de décor** : le bord de route, les repères, les objets.

Chaque point du cahier doit avoir une réponse dans la proposition, ou une raison de ne pas en avoir.

### Étape 2 : version statique jouable, en autonomie

Une fois la proposition validée, lance les sous-sessions de construction et suis-les sans redemander l'avis de l'auteur, dans le même ordre : direction artistique, circuit, décors généraux, transitions, détails. Les **assets** (formes, textures) viennent ensuite, au service de ce plan, pas l'inverse.

Le but est une **version statique**, jouable, bien plus intéressante que l'actuelle. Pas encore d'animation, d'objets qui bougent ni de vie : tout cela vient en phase 3.

Avant de rendre une carte, vérifie au minimum :
- rien ne flotte ;
- aucune texture ne se pose sur la route ;
- aucun mur n'est là sans raison ;
- aucun dessous n'est visible ;
- les niveaux d'eau et le relief sont cohérents ;
- il n'y a pas de panneaux en trop ;
- l'effet de vague est absent, vérifié en mouvement ;
- tests verts, trace or refaite, coût d'image au niveau des anciennes cartes.

### Étape 3 : retour de l'auteur, puis la vie

L'auteur joue les versions statiques et donne un dernier retour. Ensuite seulement, on fait la partie dynamique : animations, objets qui bougent, personnages, vie.

## Leçons des essais précédents

- **Ne te fie pas aux notes automatiques.** Des panels de relecteurs ont noté les V2 entre 7,6 et 8,4, plus haut que les anciennes cartes, notées en aveugle. L'auteur juge l'inverse. Ces panels ne voient que des images fixes, se fient aux sources écrites par les mêmes sessions, et ratent ce que l'auteur voit tout de suite : objets qui flottent, textures sur la route, murs sans raison, ambiance. Juge sur des captures et en mouvement, en comparant directement à une ancienne carte. Le seul juge qui compte est l'auteur.
- **Ne tourne pas en boucle pour gagner des dixièmes de point.** Pense la carte comme un tout (lieu, tracé, transitions) avant de poser des objets. Le cahier de plage le dit bien : « on voit trop que tu as mis une piste puis un truc au milieu ».
- **Périmètre.** `sim.js` (la physique) et le reste de `game.js` sont partagés par toutes les cartes. Si une carte en a besoin, propose le changement à l'auteur avant de le faire, en disant ce qu'il change pour les anciennes cartes. Les options du moteur se fusionnent d'abord dans une branche de travail.
- **Git.** Une branche par sous-session, rien de poussé. Tu demandes à l'auteur avant de fusionner dans main.
