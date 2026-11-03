# Les replays

Demandés par Sami le 3/11/2026, pour lancer des analyses de masse après coup. La forme vient de `lopin` (un en-tête, `robot@version`,
`replays/` hors de git) et de `mcts-cuisine` (`POST /api/replays` du serveur commun).

Un échange se rejoue exactement depuis sa graine, **mais seulement sur le code qui l'a joué**. Un replay garde donc aussi les valeurs utiles,
lisibles quel que soit le code devenu ensuite.

## Où ils sont

| Quoi | Où | Comment |
|---|---|---|
| Une série de robots | `replays/series/*.jsonl.gz`, hors de git | `node scripts/duel.js R3 R0 --seeds 1200 --from 100000 --replays` |
| Un point à la souris | `replays/raquette_*.json`, hors de git | la page l'enregistre à la fin de chaque point |
| Un point que le robot a perdu, à garder | `positions/`, versionné | le bouton « Exporter » de la page, puis `npm run positions` |

`npm run replays` résume la dernière série, ou celle qu'on lui donne, et sert d'exemple d'analyse (`src/replay-stats.js`).

## Une série

Un fichier compressé, une ligne JSON par échange, précédées d'une première ligne qui dit ce qui a joué :

| Champ | Ce que c'est |
|---|---|
| `format` | `raquette-replay/1` |
| `version` | la version du modèle, celle du journal des versions (`src/version.js`) |
| `startedAt`, `endedAt` | l'heure locale, avec son décalage |
| `players` | pour chacun : `bot` (`R3@1`, le nom et la version de la règle) et `profile`, toutes les valeurs de son corps et de son bras |
| `code` | `commit`, `dirty` (`src/` diffère-t-il du commit ?), `src` (un hachage de `src/`), `node` |
| `from`, `seeds`, `args` | les graines jouées et la commande |

## Une ligne

`seed`, `server`, `winner` (−1 à la limite), `cause`, `strokes`, `ticks` (240 par seconde), puis :

**`impacts`**, une entrée par frappe :

| Champ | Ce que c'est |
|---|---|
| `tick`, `who` | quand, et qui frappe (0 joue depuis x < 0) |
| `read`, `planned` | quand il a lu la balle, et l'instant qu'il avait prévu |
| `body`, `bodySpeed` | où il est et à quelle vitesse il court, au moment de l'impact |
| `opponent` | où est l'adversaire au même moment |
| `reach` | la distance du corps à la balle |
| `ballIn` | la balle à l'arrivée : position, vitesse, effet |
| `ballOut` | la balle au départ : vitesse, effet |
| `racket` | sa normale et sa vitesse. **La raquette n'a pas de géométrie** (`modele.md`, § 4) : il n'y a pas de point d'impact sur la face |
| `aim` | la cible, la vitesse voulue, celle gardée pour passer le filet (`kept`), le brossage, et si la visée a trouvé (`found`) |
| `scatter` | les tirages de la dispersion, sur le côté, en hauteur, en vitesse, et les facteurs de hâte (`rush`), de bout de bras (`stretch`) et de balle rapide (`control`) |
| `netMargin` | de combien la balle passe au-dessus du filet ; négatif si elle l'a touché |
| `landed` | ce qu'elle touche ensuite, et où |

**`touches`** : tout ce que la balle a touché (`table`, `net`, `floor`), avec le pas et l'endroit.

**`reads`** : chaque lecture de balle : qui, quand, où il était, la fenêtre où la prendre, le but qu'il s'est donné. `goal` à `null` : la balle est laissée.

**`lost`** : qui a perdu le point et comment, ou `null` à la limite.

- une faute de celui qui a frappé : `who`, `fault` (`net`, `out`) ;
- une balle pas rattrapée : `who`, `missed` (`twoBounces`, `notReached`, `behind`), `body`, où il était à la fin, `closest`, le pas où il a été le plus près (`distance`, `body`, `ball`), et `lastRead`, sa dernière lecture.

## Un point à la souris

Un fichier JSON, avec le même en-tête, une ligne comme ci-dessus sous `rally`, et de quoi le rejouer : `seed`, `server`, `scatter`, `aim` (la visée de départ), `orders` (les clics et les coups choisis, chacun avec son pas).

## Ce que ça coûte

Écrire une série est une option : sans `--replays`, le pas ne fait rien de plus. Une frappe prend environ 770 octets, et 600 échanges de 10 coups font 1 Mo une fois compressés. À chaque changement du format, `REPLAY_FORMAT` monte d'un numéro, et les anciens fichiers restent lisibles par leur propre numéro.
