# Radios des nouveaux circuits — V6 (basse de Serra simplifiée)

## Correction V6 — Serra

La basse est simplifiée à la demande de l’auteur : fondamentale de chaque accord uniquement, notes tenues et deux à trois attaques par mesure. Les sauts de quinte, sauts d’octave et glissés sont retirés. La 808 utilise une seule sinusoïde, avec un drive réduit de 3,2 à 2 pour garder un grave plus rond. Cowbell, batterie, tempo et autres morceaux restent identiques à la V5.

Export : `local/radio-v6/chapada-serra-phonk.mp3`. La validation des partitions passe ; les autres radios sont comparées à la V5 et restent identiques. La publication sur main reste suspendue.

## Historique : corrections V5

À la demande de l’auteur, Serra est réécrit en **drift phonk sombre** : 156 BPM, caisse claire en troisième temps, kicks syncopés, charlestons rapides avec roulements, cowbell courte et sombre et 808 saturée/glissée autour de F#1 (46 Hz). Les accords French touch et le kick house sont retirés. Le drive est propre à chaque voix de basse/cowbell, avant son enveloppe, pour conserver les silences et les réglages de mix. Les phrases de huit mesures gardent une identité commune avec appels, réponses, déplacements rythmiques et changements de registre.

Mer de nuages adopte le **synthé analogique rond et expressif** choisi par l’auteur : triangle, deux dents de scie discrètes, attaque de 25 ms, filtre peu résonant, liaison et vibrato progressif. La guitare saturée est retirée du thème.

Repères de production : cowbell 808 et basse surchargée, décrites par [Soundtrap](https://blog.soundtrap.com/how-to-produce-drift-phonk/) et [BandLab](https://blog.bandlab.com/how-to-make-drift-phonk-songstarter-bandlab/). Aucun échantillon externe téléchargé : les timbres et les partitions sont écrits dans le moteur.

Les deux exports corrigés sont dans `local/radio-v5`. Les sept autres titres conservent la V4. Publication sur main suspendue après le retour de l’auteur.

## Historique : corrections V4

Cette passe répond au retour sur les timbres, le manque de présence du thème et le rendu étouffé. Les arrangements V3 des autres titres sont conservés.

- **Porteuse** : le lead FM est remplacé par des cuivres synthétiques échantillonnés, avec un filtre plus ouvert.
- **Chaussée** : niveau de piste du thème augmenté de 4,8 dB avant compression, filtre ouvert et pompage atténué.
- **Pression** : retrait du piano et du long thème mélodique. Stabs rythmiques de fondamentale/quinte, accords à contretemps et grosse caisse régulière, à 150 BPM.
- **Serra** : nouvelle basse à harmoniques de dent de scie, avec fondamentale et sous-octave. Le niveau de basse augmente et les effets sont réduits.
- **Mer de nuages** : le thème passe à une guitare électrique saturée échantillonnée.

Le mix des neuf titres utilise moins de réverbération et de délai, des filtres instrumentaux plus ouverts et une compression générale moins forte : seuil −16 dB, ratio 3:1, attaque 18 ms, relâchement 100 ms. Sélène garde une ouverture plus modérée pour préserver la douceur vocale. Les anciennes radios et les menus retrouvent leurs réglages de compression d’origine.

## Direction musicale

La V3 suit le retour d’écoute sur la répétition, les timbres et le mix. Les partitions développent leurs mélodies sur huit mesures. Les couplets, les réponses, les refrains et les ponts ont des notes, des harmonies et des accompagnements différents. Les entrées des couches restent progressives pour garder le mouvement en course.

Les compositions restent éditables dans le séquenceur du jeu. Les huit premières cartes et Route royale conservent leurs radios.

## Références locales analysées

Les douze MP3 de `local/music original` ont été décodés. L’analyse porte sur trois extraits de 24 secondes par fichier, avec une enveloppe d’attaques et une autocorrélation pour estimer le tempo. La variation de niveau est mesurée par fenêtres de 0,5 seconde entre les percentiles 10 et 90.

Les métadonnées identifient notamment *Roadrunner Run*, *Some Nights*, *SWEET RALLY*, *Issa Vibe*, *Tokyo Bonus Track*, *MONTE CARLO*, *News Flash* et *Rally House*. Les fichiers 3, 4, 5 et 12 gardent leurs noms numérotés dans le relevé.

| Fichier | Tempo estimé dans l’extrait à 30 secondes | Variation de niveau dans l’extrait soutenu |
|---|---|---|
| music (1), Roadrunner Run | environ 142 BPM | 0,9 dB |
| music (3) | environ 130 BPM | 2,3 dB |
| music (4) | environ 134 BPM | 1,2 dB |
| music (5) | environ 143 BPM | 1,5 dB |
| music (6), SWEET RALLY | environ 130 BPM | 1,5 dB |
| music (9), MONTE CARLO | environ 132 BPM | 1,5 dB |
| music (10), News Flash | environ 150 BPM | 8,8 dB |
| music (11), Rally House | environ 122 BPM | 2,1 dB |

Les tempos sont des estimations. Le fichier 8 donne une pulsation ambiguë avec cet algorithme. Le début du fichier 10 est très calme et son estimation est écartée. Le relevé détaillé se trouve dans `local/radio-v2/references-analyse.json`.

Les sections soutenues des références 1, 3, 4, 5, 6 et 9 gardent un niveau stable. La composition V3 reprend cette continuité avec une basse active, un kick régulier, des accents à contretemps et des motifs courts. Les timbres principaux sont redessinés pour cette série.

## Composition par circuit

La V3 développe quatre partitions mélodiques de huit mesures par morceau, avec une phrase de couplet, une réponse, un refrain et un pont. Les lignes de basse ont quatre variantes, les accords trois rythmes et la batterie des relances écrites sur quatre mesures. Le kick et la basse accompagnent les changements de densité.

| Circuit | Titre | Écriture et mix actuels |
|---|---|---|
| Barrage 74 | PRESSION 150 | Hardbass rythmique à 150 BPM : donk, stabs courts, contretemps et appels de fondamentale/quinte. Grilles centrées sur Fm, passages Db–Eb et pont Bbm–Db–Eb–Fm–C–Fm. |
| Signal inconnu | PORTEUSE 140 | Grille Cm7–AbM7–EbM7–Bb7 avec retour Fm7–G7. Quatre phrases distinctes, Rhodes et nouveau lead de cuivres synthétiques. |
| Autoroute engloutie | CHAUSSEE 146 | Grille Dm–Bb–F–C et dominante A. Thème rehaussé de 4,8 dB avant compression et filtre plus ouvert. |
| Manuscrit 512 | SERRA PHONK | Drift phonk sombre à 156 BPM. 808 ronde sur la fondamentale, notes tenues sans glissés, batterie trap en demi-temps et cowbell syncopée. Centre F#m avec passages D et Bm. |
| Falaises égéennes | MELTEMI 140 | Harmonies Dm9–BbM7–Gm7–A7 et phrases plus longues, dont un développement du motif de LIQUID 174. Guitare claire enregistrée en mélodie, basse à cordes et Rhodes pour les accords. |
| Piliers du ciel | MER DE NUAGES | Synthé analogique rond à triangle et dents de scie discrètes. Harmonie G–D–Em–C, refrain développé à partir de REFUGE FM et pont C–D–Bm–Em. |
| Avant-poste lunaire | SELENE 134 | Le motif d’arpège initial est conservé. Les lignes vocales sont réécrites en notes longues sur Em7–A7–DM7–Bm7. Voix « ooh » enregistrée, attaque de 120 ms, notes liées et relâche de 300 ms. |
| Playa 307 | QUINTA 307 | Le refrain de QUINTA est conservé et entouré d’un nouveau couplet, d’une réponse et d’un pont F–G–Em–Am–Dm–F–G–Am. Variantes de dembow, de basse et de percussions entre les passages. |
| Couronne brisée | BASALTE 142 | Nouveau style speed garage à 142 BPM. Rhodes mélodique, basse funk filtrée, grosse caisse en deux temps et swing. Progression Em7–Am7–D7–GM7–CM7–Am7–B7–Em7. |

Le secteur rapide renforce le jeu et la batterie en conservant la section musicale en cours. Les anciennes radios gardent leur fonctionnement.

## Références de production complémentaires

- Pour la French touch de Sélène, *Discovery*, notamment *Voyager* et *Short Circuit*, fournit une direction de basse funk, de séquences et de textures électroniques. L’article Ableton décrit le pompage French house à partir de *Indo Silver Club*. [Daft Punk](https://daftpunk.com/discovery/) · [Ableton](https://www.ableton.com/fr/blog/sidechain-compression-part-2-common-and-uncommon-uses/)
- Pour la phonk, les collections Splice donnent des exemples de cowbells accordées et de 808. La V3 utilise une cowbell synthétisée et une basse écrite pour le circuit. [Splice](https://splice.com/sounds/collections/SplicePicks/XB_43iw54qBs2X1p0xuQGG5jCJU/samples)
- Pour l’étude des arrangements, Cambridge Music Technology propose les multipistes de *Ubiquitous* d’Albert Kader, *The Calling* de Ben Flowers et *Downtempo* de Bravestar. [Mixing Secrets](https://www.cambridge-mt.com/ms/mtk/)

Les MP3 de référence servent à analyser le groove et l’organisation. Les notes, les batteries et les nouveaux timbres sont écrits dans le moteur du jeu. Les exports sont dans `local/radio-v4`.

## Vérification V4

Les neuf morceaux sont rendus entièrement dans le moteur Web Audio, en stéréo à 44,1 kHz. Le contrôle automatique vérifie les échantillons finis, les crêtes et les niveaux par section. Les résultats figurent dans `local/radio-v4/verification.json`.

La lecture normale du banc et celle de l’éditeur sont vérifiées dans Chromium. Le getter `SOUND.live`, précédemment absorbé par un commentaire, est rétabli pour permettre la lecture normale du banc.

Le mix avec moteur, pneus, ambiances, impacts et boost est contrôlé sur Serra, Porteuse et Chaussée. Sur ces extraits de douze secondes, les crêtes restent sous 0 dBFS. Le retour à une ancienne radio rétablit bien le ratio 12:1 d’origine.

Les onze tests du dépôt passent. Les radios des huit premières cartes et de Route royale restent identiques à leur version Git d’origine. Les contrôles automatiques couvrent le fonctionnement et les niveaux ; le jugement musical nécessite une écoute humaine.

## Contrôle des deux corrections V5

Rendus complets stéréo et contrôle Chromium de la lecture, des timbres et du mix avec moteur, pneus, impacts et boost. Les deux extraits avec bruitages restent sous 0 dBFS. Les résultats automatiques sont dans `local/radio-v5`. L’appréciation du style et des timbres reste à valider à l’écoute.
