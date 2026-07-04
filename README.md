# Jeu de Dames

Application de jeu de dames internationales (10×10, FMJD) fonctionnant dans le navigateur, développée avec l'assistance de Claude Code.

## Statut

✅ Jouable — moteur de règles, IA à 4 niveaux, interface drag-and-drop tactile.

## Démarrer en local

```bash
npm install
npm run dev       # serveur de développement (Vite)
npm run build     # build de production dans dist/
npm run preview   # sert le build de production en local
```

## Déploiement

Le dossier `dist/` généré par `npm run build` est un site statique autonome :
déposez-le tel quel sur GitHub Pages (ou tout hébergeur statique), ou ouvrez
`dist/index.html` directement dans un navigateur.

## Tests

```bash
npm run test          # tests unitaires du moteur de règles (Vitest)
npm run stress-test   # simule 500 parties aléatoires pour valider le moteur
```

## Stack technique

- Vite / npm, JavaScript vanilla
- Moteur de règles maison (`src/engine/`), testé indépendamment de l'interface
- IA minimax + élagage alpha-bêta, 4 niveaux de difficulté (`src/engine/ai.js`)
- Interface drag-and-drop (`src/ui/`), Pointer Events (souris + tactile)
- Identité visuelle : bois foncé / vert, cohérente avec le projet échecs

## Documentation

Voir `CLAUDE.md` pour les instructions de contexte destinées à Claude Code, et `brief-projet-dames.md` pour le cahier des charges détaillé.

## Historique

Ce dépôt a été créé à zéro le 3 juillet 2026 pour repartir sur une base propre, après un incident où un ancien fichier README contenait du contenu sans rapport (projet *Gaya*) qui perturbait le contexte lu automatiquement par Claude Code.
