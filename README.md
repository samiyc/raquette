# Raquette

Le ping-pong en simulation : un duel, la trajectoire de la balle, son effet et sa hauteur, un robot, un joueur à la
souris pour éprouver ce robot, puis l'autojeu. Le tennis et le badminton pourront suivre.

Client de [`mcts-commun`](../mcts-commun/README.md). Le nom n'a pas de préfixe `mcts-` : rien ne dit encore que ce jeu
a besoin de MCTS (Sami, 30/10/2026). La recherche sera choisie par la mesure, contre une règle simple : renvoyer au
centre de la table.

**État** (2/11/2026) : le cadrage est écrit : [`docs/modele.md`](docs/modele.md) (le modèle, les règles à battre, les
mesures, les jalons) et [`docs/recherche/`](docs/recherche/README.md) (les chiffres et leurs sources, le glossaire, les
questions, le prompt de recherche). **La balle existe** (`src/ball/`) : son vol, son rebond, le filet, testés contre les
valeurs publiées. Pas encore de joueur, de règle ni de recherche.

## Les commandes

| Commande | Ce qu'elle fait |
|---|---|
| `npm install` | installe les outils, relie `mcts-commun` et active le hook de commit |
| `npm run check` | le lint, les types, puis les tests ; c'est ce que lance le hook |
| `npm run lint` (`lint:fix`) | eslint, avec le budget de complexité de lopin |
| `npm run types` | tsc vérifie le JavaScript d'après ses commentaires JSDoc, sans rien compiler |
| `npm test` (`test:coverage`) | les tests de `node --test`, dont la longueur des `.md` et les empreintes |
| `npm run bench` | le coût d'un pas de simulation et les collections de mémoire |

Les règles du dépôt sont dans [`CLAUDE.md`](CLAUDE.md).
