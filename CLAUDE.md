# Ville à plein régime

Jeu de course three.js, site statique sans étape de build. Documentation développeur : `README.md`, à partir de « Pour les développeurs » (« Où régler quoi » pour trouver un réglage).

- **Voir un endroit d'une carte** : `node outils/plan.js <carte> <plan>`, deux secondes, avant/après avec `--avant`. Mode d'emploi en tête du fichier.
- **Décor d'une carte** : `METHODE-DECOR.md` ; carte nouvelle ou à refaire : `METHODE-NOUVELLE-CARTE.md`. Les critiques d'images lisent des planches, un critique par secteur.
- **Tests** : `sh outils/verifie.sh`. Le crochet de pré-commit le lance ; par clone : `git config core.hooksPath outils/hooks`.
- **Performances** : `node outils/banc-rapide.js [carte]`, README « Performances ».
- **Lancer le jeu pour l'auteur** : configuration `jeu` de `.claude/launch.json`. Elle sert la copie où tourne la session ; annoncer la branche et le commit servis, et la carte ouverte.
