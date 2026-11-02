# Raquette

Le ping-pong en simulation : un duel, la trajectoire de la balle, son effet et sa hauteur, un robot puis la manette.
Le tennis et le badminton pourront suivre.

Client de [`mcts-commun`](../mcts-commun/README.md). Le nom n'a pas de préfixe `mcts-` : rien ne dit encore que ce jeu
a besoin de MCTS (Sami, 30/10/2026). La recherche sera choisie par la mesure, contre une règle simple : renvoyer au
centre de la table.

**État** (2/11/2026) : le cadrage est écrit, sans code de modèle ni de recherche : [`docs/modele.md`](docs/modele.md) (le
modèle, les règles à battre, les mesures, les jalons) et [`docs/recherche/`](docs/recherche/README.md) (les chiffres et
leurs sources, le glossaire, les questions, le prompt de recherche). Prochain jalon : la balle, son vol et son rebond, avec
ses tests contre les valeurs publiées.

## Les commandes

| Commande | Ce qu'elle fait |
|---|---|
| `npm install` | installe les outils, relie `mcts-commun` et active le hook de commit |
| `npm run check` | le lint, les types, puis les tests ; c'est ce que lance le hook |
| `npm run lint` (`lint:fix`) | eslint, avec le budget de complexité de lopin |
| `npm run types` | tsc vérifie le JavaScript d'après ses commentaires JSDoc, sans rien compiler |
| `npm test` (`test:coverage`) | les tests de `node --test`, dont la longueur des `.md` |

Les règles du dépôt sont dans [`CLAUDE.md`](CLAUDE.md).
