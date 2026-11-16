# Méthode pour amener une nouvelle carte au niveau des anciennes

Complète `docs/methodes/METHODE-DECOR.md`, qui reste valable : rôles Opus et Sonnet, outil de capture, périmètre de chaque session. Ce document répond au constat sur les V1 de perse, barrage, chapada et plage : un tracé correct, mais un décor vide (des murs, des tunnels), des références mal tenues (un temple persan qui ressemble à un château européen) et des couleurs qu'on ne distingue pas.

Règle de base : **on ne juge pas à l'œil du code, on juge sur des images du moteur, comparées aux anciennes cartes.**

## 0. La barre de référence : mesurée avant de toucher au décor

1. Choisir deux cartes de référence proches du sujet (par exemple paris et touge pour un décor dense, wangan pour un grand ouvrage, givre pour la nature).
2. Les capturer : `node outils/plan.js <ref> tour`. Ces deux planches sont la référence donnée aux critiques.
3. Les profiler : `node outils/banc-rapide.js --profil <ref>`. Noter, par vingtième de piste, les passes de dessin, les sommets et le nombre d'objets du décor. Cela donne la **densité cible** : la médiane des références.
4. Faire de même sur la carte à refaire. Le tableau avant/après, par vingtième, va dans le rapport final.

**Un vingtième est vide** s'il a moins de la moitié des objets de la médiane des références, ou si une capture n'y montre que de la route, un mur et du ciel. **À la fin, aucun vingtième n'est vide.**

## 1. Des sources avant les formes

Avant de modéliser, écrire `docs/REFS-<carte>.md`, une fiche par élément de décor important :

- **le lieu ou le style réel** (par exemple « salle hypostyle achéménide, Persépolis », « cénote souterrain du Yucatán ») ;
- **2 sources au moins** : une URL (Wikimedia Commons, page d'un musée, d'un site archéologique, d'un ouvrage d'ingénierie) avec une ligne sur ce qu'elle montre ;
- **3 à 5 traits qui identifient l'élément**, ceux qu'on doit reconnaître à 150 km/h (proportions, matériaux, couleurs, ornements, silhouette) ;
- **ce qu'il ne doit pas devenir**, l'anti-référence (par exemple « pas de créneaux en dents, pas de tours rondes à toit pointu : c'est le Moyen Âge européen »).

Un sous-agent Sonnet fait la recherche (WebSearch, WebFetch) et lit les images. Opus valide la fiche. Chaque forme de `formes-<carte>.js` dit en commentaire quelle fiche elle suit.

## 2. La boucle par secteur

On découpe la carte en secteurs (ceux de la spec) et on avance secteur par secteur, dans l'ordre qu'on veut. Pour chaque secteur, quatre étapes :

1. **Plan.** Lister ce qu'on voit à trois distances : au bord, de 0 à 15 m (ce qui défile et donne la vitesse) ; au plan moyen, de 15 à 80 m (les volumes, les repères) ; au fond, au-delà de 80 m (la silhouette, l'horizon). Ajouter un repère visuel par point de freinage. Aucun des trois plans ne reste vide.
2. **Construction.**
3. **Images du moteur.**
   - En course : une planche des plans du secteur (`node outils/plan.js <carte> 7 8 9`), prise avec `--avant` avant de construire.
   - Vu de près : `--vue=` sous trois angles, sur les deux objets nouveaux les plus importants.
   - En mouvement : `--rafale=6` sur un plan du secteur, pour voir ce qui défile, ondule ou clignote.
4. **Critique**, par un seul sous-agent Sonnet pour le secteur. Il reçoit la planche du secteur, la planche de référence, la fiche REFS et la grille ci-dessous. Il rend du texte, un constat par vue.

| Critère | Ce qu'il regarde | Seuil |
|---|---|---|
| Densité | les trois plans sont occupés, rien ne se répète en motif visible | ≥ 7/10 |
| Fidélité | on reconnaît les traits de la fiche REFS, rien de l'anti-référence | ≥ 7/10 |
| Lisibilité | la route se distingue du bas-côté, le virage se voit avant d'y être | ≥ 7/10 |
| Lumière et couleur | les valeurs (sombre, moyen, clair) sont séparées, rien n'est brûlé ni bouché | ≥ 7/10 |
| Comparaison | même niveau de détail que la référence : oui ou non, et ce qui manque | oui |

On corrige puis on recapture seulement les plans du secteur. **Le secteur est fini quand tous les seuils sont atteints, au plus en quatre tours de boucle.** Au-delà, on le signale dans le rapport plutôt que de tourner en rond.

## 3. Contrôles chiffrés, sans œil humain

- **Contraste** : avec Python et PIL, dans un script de la session, mesurer sur chaque capture la luminance moyenne d'une bande de route et d'une bande de bas-côté. Si l'écart est inférieur à celui des références, c'est illisible. On mesure aussi l'histogramme : plus de 5 % de pixels au-dessus de 245 veut dire que l'image est brûlée.
- **Densité** : le profil par vingtième (section 0).
- **Coût** : temps d'image sous la référence de 2 ms (`node outils/banc-rapide.js <carte>`), avec les passes de dessin et les sommets notés avant et après.
- **Tests** : `sh outils/verifie.sh` est vert. Le pilote automatique boucle sans taper. Si le tracé change, la trace or est refaite.

## 4. La revue finale, comme le fera l'auteur

Un tour complet : `node outils/plan.js <carte> tour`. Deux sous-agents Sonnet, séparés, reçoivent les deux planches de la carte et celles d'une référence :

- **le directeur artistique** : fidélité aux références, identité, ambiance ;
- **le joueur testeur** : lisibilité, repères, envie de rouler, ce qui est vide ou répétitif.

Chacun rend une note sur 10 et la liste de ce qui reste sous la référence. **On ne rend pas la carte avec une note sous 7, ni un vingtième vide.**

## 5. Ce que rend la session

- Les commits sur sa branche, rien de poussé.
- Les retours de l'auteur repris point par point : fait, ou pas fait avec la raison.
- Le tableau de densité par vingtième, avant et après, à côté de la référence.
- Les notes de la revue finale.
- Le temps d'image.
- Ce qui n'a pas été vérifié.
