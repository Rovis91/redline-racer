# Ville à plein régime

Jeu de course three.js, site statique sans étape de build. Carte du dépôt et documentation : `docs/INDEX.md`. Guide développeur : `docs/DEVELOPPEUR.md` (« Où régler quoi » pour trouver un réglage). `README.md` est en anglais, pour le public.

- **Voir un endroit d'une carte** : `node outils/plan.js <carte> <plan>`, deux secondes, avant/après avec `--avant`. Mode d'emploi en tête du fichier.
- **Décor d'une carte** : `docs/methodes/METHODE-DECOR.md` ; carte nouvelle ou à refaire : `docs/methodes/METHODE-NOUVELLE-CARTE.md`. Les critiques d'images lisent des planches, un critique par secteur.
- **Tests** : `sh outils/verifie.sh`. Le crochet de pré-commit le lance ; par clone : `git config core.hooksPath outils/hooks`.
- **Performances** : `node outils/banc-rapide.js [carte]`, `docs/DEVELOPPEUR.md` « Performances ».
- **Lancer le jeu pour l'auteur** : configuration `jeu` de `.claude/launch.json`. Elle sert la copie où tourne la session ; annoncer la branche et le commit servis, et la carte ouverte.

## Carte du dépôt (aucun JS à la racine)

`index.html` (jeu) · `src/{moteur,donnees,audio,rendu,cartes/<carte>}` · `pages/` (outils web) · `assets/` · `vendor/` · `tests/` · `outils/` · `docs/` (`docs/INDEX.md`). Noms de fichiers uniques dans tout le dépôt : un `glob **/decors-perse.js` suffit. `local/` et `captures/` sont ignorés par git. Un nouveau fichier de carte doit être déclaré dans `index.html` (test-cartes.js le vérifie).
