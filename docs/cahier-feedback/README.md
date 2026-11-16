# Cahier de feedback : les quatre nouvelles cartes

Ce cahier liste ce qui ne va pas sur perse, barrage, chapada et plage, dans leur dernière version. Il ne propose **aucune solution**. Chaque problème indique où il se trouve et renvoie à une capture du moteur.

Sources :
- les retours de l'auteur, qui a joué les quatre cartes, repris mot pour mot dans chaque cahier et marqués « auteur » ;
- une analyse des captures, faite sur le moteur en comparant à une ancienne carte finie, marquée « analyse ».

| Carte | Cahier | Problèmes | Images | Comparée à | Branche du code observé |
|---|---|---|---|---|---|
| Route royale (perse) | [perse/CAHIER.md](perse/CAHIER.md) | 38 | 29 | paris | `claude/carte-perse-v2-48e1b0` (23f5809) |
| Barrage 74 (barrage) | [barrage/CAHIER.md](barrage/CAHIER.md) | 41 | 31 | touge | `claude/carte-barrage-v2-3360a7` (8c11909) |
| Matin sur la Chapada (chapada) | [chapada/CAHIER.md](chapada/CAHIER.md) | 48 | 33 | touge | `claude/carte-chapada-v2-b9a43e` (d3a7bf3) |
| Playa 307 (plage) | [plage/CAHIER.md](plage/CAHIER.md) | 37 | 31 | ville | `claude/carte-plage-v2-f173a0` (9b74f72) |

Les options du moteur ajoutées pour ces cartes sont sur `claude/moteur-options-cartes-31146a` et décrites dans `docs/MOTEUR-OPTIONS-CARTES.md` sur cette branche. Les quatre branches les contiennent déjà.

## L'avis général de l'auteur

Les anciennes cartes, déjà finies, sont très bonnes ; les quatre nouvelles sont moins bien.
- **Perse** : il manque des décors entre les zones, et certaines zones en ont trop, comme la première.
- **Barrage** : le problème vient surtout de l'ambiance et de l'élévation. La forme du sol n'a pas de sens, beaucoup de bâtiments sont mal placés, et on voit des textures par en dessous.
- **Chapada** : l'ambiance n'est pas du tout la bonne. On attend une carte d'aventure dans la jungle, et on a presque un film d'horreur, une carte abandonnée. Les zones hors de la forêt ne plaisent pas du tout, et les zones de forêt sont bâclées.
- **Playa** : c'est assez bien, mais il manque de la continuité entre les zones et de l'ambiance festive, et surtout le point d'eau des cénotes.

## Problèmes communs à plusieurs cartes

1. **Un effet de vague**, signalé par l'auteur sur plusieurs cartes, dont on ne connaît pas l'origine. Les captures fixes ne le montrent pas avec certitude. Voici ce qui ondule ou fait des bandes régulières sur les images :
   - perse : la chaussée de l'escalier striée de bandes horizontales, et des façades à motifs en zigzag dans le bazar ;
   - barrage : les gerbes du déversoir en forme de vague, et les plaques blanches sur la route ;
   - chapada : les strates des parois qui ondulent, et les flancs ombrés en larges bandes ;
   - plage : des bandes concentriques dans le ciel, les rides du sable, l'eau en bandes, et l'option `chaleur` (le mirage au loin) active.

   L'effet n'a pas été vérifié en mouvement.
2. **Aucune continuité entre les zones** (les quatre cartes). Chaque zone forme un décor à part : à chaque frontière, le sol, la palette, la lumière et la densité changent d'un coup. Rien ne prépare la zone suivante.
3. **La densité varie sans transition.** Les zones passent de surchargées à vides : perse (le départ saturé, puis l'escalier, le deuxième virage et le virage avant le bazar vides), plage (le vide entre la rue et le marché couvert).
4. **Le décor lointain est raté, dans les deux sens.** Il est absent ou répétitif sur perse ; il est au contraire trop net et trop lisible jusqu'à l'horizon sur chapada, où la jungle devrait fermer la vue.
5. **Des objets flottent ou ne tiennent à rien** : les lanternes sans support de perse ; les bâtiments, silos, la cimenterie, des pylônes et des arbres au-dessus du sol sur barrage ; les faux nuages de chapada ; les piquets, cônes et rampes de plage, posés sans raccord avec le sol.
6. **Des textures se posent sur la route** : des plaques blanches rectangulaires sur le bitume (barrage, chapada), des surfaces translucides ou orangées sur la chaussée de la galerie et du gué (chapada), le sol de la halle qui recouvre la route à la sortie des turbines (barrage), une texture au milieu de l'entrée de la grotte (plage).
7. **Des murs le long de la route sans raison d'être** : sur presque toute la carte barrage (la vallée, la sortie de la halle, après le tunnel, la descente).
8. **Trop de panneaux de virage, mal placés** : des rangées de chevrons et des bandeaux de texte avant chaque virage, plus lisibles que le décor, sur perse ; des panneaux devant des murs, sur barrage.
9. **Une ambiance éloignée de l'intention** : chapada se lit comme un lieu abandonné et triste ; barrage n'a pas de site crédible ; plage manque de vie et de fête hors de la rue aux guirlandes. Les lumières changent comme on bascule un interrupteur : sortie de grotte noire sur plage, ciel rouge sombre à la sortie du bazar sur perse.
10. **Des écarts avec les fiches de sources** (`docs/REFS-<carte>.md`) : la route décorée comme un tapis et un dôme à bulbe sur perse ; l'architecture de plage, qui ne ressemble ni aux resorts de Playa del Carmen ni à la Quinta Avenida ; les ruines, l'eau d'ambre, le pont et l'arche de chapada ; les sapins de barrage, différents de ceux de touge.
11. **Des formes géologiques et des niveaux sans logique** : sur barrage, le lac est au niveau de la crête et les versants sont presque verticaux ; sur chapada, une galerie à moitié souterraine borde des cascades à l'air libre, et la rivière n'a ni source ni débouché lisibles.
12. **Le moteur est au rupteur la moitié du tour sur chapada** : au-dessus de 85 % du rupteur pendant 47 % du temps, contre 19 % pour touge et 28 % pour givre.

## Problème de méthode : le barème automatique note à l'envers

Pendant la V2, des panels de relecteurs automatiques ont noté les nouvelles cartes avec le barème de `propositions/revue-circuits.html`. Ils notaient aussi, en aveugle, une ancienne carte de référence.

| Carte | Note de la nouvelle carte | Note de l'ancienne carte |
|---|---|---|
| perse | 8,41 | paris 5,69 |
| plage | 8,06 | ville 6,96 |
| chapada | 8,20 | touge 5,75 |
| barrage | 7,6 | touge 5,6 à 6,05 |

L'auteur, en jouant, juge l'inverse.

Constats sur ce panel :
- Il ne voyait que des images fixes. Il ne pouvait donc pas juger les effets de mouvement (la vague, ce qui défile), ni la conduite au rupteur.
- Il jugeait les nouvelles cartes d'après les fiches de sources écrites par les sessions qui les avaient faites.
- D'un panel à l'autre, la même carte variait de 0,5 à 2,5 points, autant que l'effet d'un tour de corrections.
- Il ne relevait ni les objets qui flottent, ni les textures sur la route, ni les murs sans raison, que l'auteur voit tout de suite.
