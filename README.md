# RL Playground

Application web statique et interactive pour comprendre visuellement le Q-learning tabulaire. Entraînez un agent dans un GridWorld, observez ses Q-values et sa politique, puis expérimentez avec alpha, gamma, epsilon et les récompenses.

> Screenshot : lancez l’application avec `npm run dev` pour découvrir l’interface complète.

## Démarrage

Prérequis : Node.js 20 ou 22.

```bash
npm install
npm run dev
```

Tout le calcul est effectué dans le navigateur, sans serveur applicatif.

## Tests et production

```bash
npm test
npm run build
```

Le build statique est créé dans `dist/`. Les chemins relatifs fonctionnent à la racine comme sous `https://username.github.io/repository-name/`.

## Déploiement GitHub Pages

Le workflow `.github/workflows/deploy.yml` teste, construit et publie `dist` à chaque push sur `main`. Dans GitHub, choisissez **Settings → Pages → Source → GitHub Actions**.

## Architecture

- `src/rl/` : environnement, PRNG déterministe, agent Q-learning et contrôleur ; aucune dépendance au DOM.
- `src/state/` : état et cycle de vie de l’application.
- `src/ui/` : GridWorld et graphiques en SVG natif.
- `src/presets/` : environnements et expériences pédagogiques.
- `src/styles/` : interface responsive et thèmes clair/sombre/système.

## Q-learning

```text
Q(s,a) ← Q(s,a) + α [r + γ max Q(s',a') − Q(s,a)]
```

Dans un état terminal, la valeur future est nulle. La politique epsilon-greedy explore avec une probabilité `ε` et choisit sinon aléatoirement parmi les meilleures actions connues.
