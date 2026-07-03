# Instructions pour Claude Code — Projet Jeu de Dames

## Contexte du projet

Ce dépôt contient **uniquement** le projet du jeu de Dames (checkers). Aucun autre projet, texte, ou contenu ne doit être considéré comme faisant partie du contexte, même si trouvé dans l'historique git ou d'anciens fichiers.

Ce projet fait suite au jeu d'échecs (*echecs.html*, dépôt séparé), avec lequel il partage l'identité visuelle (bois foncé / vert) et l'approche technique (Vite/npm), mais **le design du jeu de Dames repart de zéro** — ne pas réutiliser le code de l'ancien prototype `dames.html`.

## Portée du projet

- Jeu de dames complet, règles standards (à préciser dans `brief-projet-dames.md`)
- Quatre niveaux de difficulté (moteur maison, pas de dépendance externe type Stockfish)
- Interface web locale, responsive (support tactile mobile requis — un bug antérieur lié au tactile lors de captures multiples de dames a été documenté, voir historique)
- Cohérence visuelle avec le projet échecs

## Règles de travail

- Toujours consulter `brief-projet-dames.md` avant d'entreprendre une nouvelle fonctionnalité.
- Ne jamais lire ou interpréter du contenu hors du dossier de ce projet comme contexte.
- Committer fréquemment, avec des messages clairs, pour permettre un retour en arrière facile.
- Signaler toute ambiguïté dans les règles du jeu plutôt que de deviner.

## Historique pertinent

- Un stress test Node.js (500 parties simulées) a déjà validé le moteur de règles du prototype précédent pour les captures multiples de rois — le bug identifié était situé dans la couche tactile/UI mobile, pas dans le moteur.
