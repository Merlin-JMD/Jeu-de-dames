Brief Projet : Jeu de Dames Internationales

Contexte

Application web de dames (règles internationales / FMJD) destinée à être offerte en cadeau. Doit être accessible sans installation technique pour une utilisatrice non technique (navigateur web uniquement). Mode de jeu : contre l'ordinateur uniquement.

Ce projet suit la même approche que le projet d'échecs précédent (Vite/npm, développement via Claude Code, identité visuelle bois foncé/vert).

Nouveau départ : ce brief accompagne un nouveau dépôt GitHub (jeu-de-dames), créé à zéro. Le design et le code repartent entièrement de zéro — aucune réutilisation du prototype dames.html précédent. Les points d'attention hérités (section 6) sont conservés à titre informatif pour orienter les tests, pas comme code à réutiliser.

Note : l'option de jeu à distance (Firebase Realtime Database, code de partie) a été envisagée puis abandonnée pour garder le projet simple à livrer et sans dépendance externe. Elle n'est pas incluse dans ce brief et ne doit pas apparaître dans l'interface.


Règles du jeu — Dames internationales (FMJD)


Plateau : 10×10 cases, 100 cases dont 50 jouables (cases sombres uniquement)
Pièces : 20 pions par joueur, placés sur les 4 premières rangées de cases sombres de chaque côté
Déplacement des pions : diagonale avant uniquement (1 case), sauf en capture
Capture :

Obligatoire — un joueur qui peut capturer doit le faire
Règle de la prise majoritaire — si plusieurs captures sont possibles, le joueur doit choisir la séquence capturant le plus grand nombre de pièces
Les pions capturent en diagonale avant ET arrière
Captures multiples en une seule tour (rafle) si enchaînables

Promotion en dame : un pion atteignant la dernière rangée devient une dame (dame simple, pas de sur-couronnement)
Dame volante (flying king) : une dame se déplace de plusieurs cases en diagonale (pas seulement une case comme aux dames anglaises), et peut capturer une pièce adverse à distance sur la diagonale, en atterrissant sur n'importe quelle case libre après la pièce capturée
Fin de partie : victoire si l'adversaire n'a plus de pièces, ou ne peut plus bouger. Règles de nulle standard FMJD (répétition de position, nombre de coups sans capture ni avancée de pion) — à implémenter en version simplifiée si complexe


Mode de jeu


Contre l'ordinateur uniquement

Moteur IA local (minimax avec élagage alpha-bêta), conçu à neuf pour cette version
4 niveaux de difficulté (profondeur de recherche variable)
Fonctionne 100% hors ligne une fois la page chargée
Aucune dépendance externe, aucun compte requis


Stack technique


Build tool : Vite
Gestionnaire de paquets : npm
Langage : JavaScript (vanilla ou TypeScript, au choix de l'implémentation)
Hébergement : GitHub Pages (ou équivalent statique gratuit), ou simplement un fichier HTML unique livré directement — lien/fichier à partager, aucune installation requise, aucun compte externe nécessaire


Identité visuelle


Cohérence avec le projet d'échecs : palette bois foncé / vert
Plateau 10×10 avec cases sombres/claires contrastées
Pièces distinctes et lisibles (pions vs dames — ajout d'une couronne ou surélévation visuelle pour les dames)
Interface simple et intuitive : un seul mode proposé clairement — "Jouer contre l'ordinateur", avec sélection du niveau de difficulté
Responsive (fonctionne sur mobile et desktop — la sœur pourrait y jouer sur téléphone)


Structure de fichiers proposée


jeu-de-dames/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.js
│   ├── style.css
│   ├── engine/
│   │   ├── rules.js          # logique des règles FMJD (captures, prise majoritaire, dame volante)
│   │   ├── ai.js              # moteur minimax
│   │   └── boardState.js      # représentation du plateau et de l'état de jeu
│   └── ui/
│       ├── board.js
│       └── controls.js
├── CLAUDE.md                   # instructions de contexte pour Claude Code
└── README.md                   # instructions de déploiement (GitHub Pages ou fichier local)


Points d'attention à auditer (héritage du prototype précédent — informatif seulement)


Dans le prototype dames.html original (abandonné), un bug avait été observé lors de captures consécutives de deux dames adverses. Un stress test (500 parties simulées en Node.js) avait validé que le moteur de règles lui-même était correct ; le problème avait été attribué à la couche tactile/UI mobile plutôt qu'à la logique du jeu.
Comme le nouveau moteur est reconstruit à neuf, ce bug spécifique ne devrait pas se reproduire tel quel — mais le scénario (captures multiples de dames, interaction tactile mobile) doit être testé en priorité dès que l'interface tactile est fonctionnelle.


Livrables attendus


Application fonctionnelle en local (npm run dev)
Build de production déployable (npm run build)
Instructions simples de déploiement (README) pour mise en ligne sur GitHub Pages, ou remise d'un fichier autonome à ouvrir directement dans un navigateur
