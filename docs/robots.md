# Les robots sur une échelle

Sami, 16/11/2026 : « j'ai un peu de mal à suivre les différentes versions du bot avec les lettres ». Chaque robot a joué tous les autres sur la physique d'aujourd'hui (0.36.0) : 190 paires, 2 000 graines par paire, chacun servant une fois par graine. Ceux qui choisissent leur service le choisissent ; les autres le tirent au hasard. `node scripts/elo.js --seeds 2000`, résultat dans [`elo.json`](elo.json).

**Ce que veut dire le chiffre.** Un Elo sur les points (ajustement de Bradley-Terry), R0 fixé à 1 000. 100 Elo d'écart, c'est 64 % des points ; or 64 % des points gagnent presque toutes les manches de 11. Ces écarts paraissent petits, mais ils sont grands au score. L'erreur statistique est d'environ 1 Elo. **L'erreur du modèle est bien plus grande** : voir les limites plus bas.

| Rang | Robot | Elo | Né le | Ce que c'est |
|---|---|---|---|---|
| 1 | **L** | 1 249 | 17/11 | K réglé par CMA-ES (runs `f2a` puis `f3`) : numéros de jeu, retour et 3e balle, contre K, I, H et les runs précédents |
| 2 | **K** | 1 224 | 16/11 | I, qui pousse les services courts au lieu de les flipper |
| 3 | **I** | 1 205 | 10/11 | H, qui choisit son service : pendule, marteau, mou, coupé, chacun à sa meilleure place |
| 3 | **J** | 1 205 | 11/11 | I, avec un retour réglé à part sur des services tirés au hasard |
| 5 | **H** | 1 196 | 10/11 | G, avec un top plus rapide (7,1 m/s de raquette) et un coup doux plus coupé |
| 6 | **W** | 1 180 | 4/11 | bras court ; garde un coupé pour quand il n'est pas en place |
| 7 | **G** | 1 170 | 9/11 | W et le coup décisif de `f1`, le premier réglé sur l'erreur d'angle de la face |
| 8 | **U** | 1 156 | 3/11 | « le régulier » : attend, top lent vers le milieu, tient la table |
| 9 | **R4** | 1 116 | 3/11 | R3, et bloque une balle rapide, prise en montée |
| 10 | **R5** | 1 113 | 3/11 | R4, et remet court contre un adversaire trop reculé |
| 11 | **R3** | 1 110 | 2/11 | R2, avec le lift en attaque et la poussette sur une balle basse |
| 12 | **T** | 1 094 | 3/11 | le premier robot gardé par l'autojeu : raquette lente, gros brossage |
| 13 | **Z** | 1 087 | 6/11 | Y, qui gagne à l'usure ; la première règle à battre X |
| 14 | **F** | 1 055 | 6/11 | Y, réglé avec la fatigue et l'effet mal lu |
| 15 | **V** | 1 054 | 4/11 | « celui qui fait courir » : balle large et très brossée |
| 16 | **Y** | 1 053 | 5/11 | le premier avec le coup décisif |
| 17 | **X** | 1 041 | 4/11 | bras court ; se replace vraiment |
| 18 | **R0** | 1 000 | 2/11 | renvoie au centre de la table : le témoin |
| 19 | **R1** | 982 | 2/11 | vise le coin loin de l'adversaire |
| 19 | **R2** | 982 | 2/11 | R1, plus doux quand il est pressé |

**Les familles.** R0 à R5 sont écrites à la main. T à Z, puis F et G, sont trouvées par l'autojeu, chacune sur le modèle physique de son jour. H, I, J, K et L forment la lignée actuelle : chacun part du précédent et le bat. Les menus de la page ne gardent que R0, R3 et les quatre derniers (I, J, K, L) depuis la 0.36.0 ; les autres restent dans le code et ici.

## Ce que le tableau ne dit pas

- **Les lettres anciennes ont été réglées sur une autre physique.** T, V, X, Y, Z et F ont été réglés avant plusieurs corrections du modèle : le corps, le bras, le coût d'une frappe en courant, l'erreur d'angle de la face, la fatigue. Ils étaient les meilleurs de leur jour ; aujourd'hui, R3 bat Z, F, Y et X, et R0 lui-même bat X, F, Y et Z.
- **Le jeu n'est pas transitif.** Un seul chiffre par robot écrase les duels. W écrase R0, R1 et R2 (92 % des points), ce qui le place au-dessus de G, alors que G le bat (60 %). K bat I à 57 % en face à face, ce qui vaudrait 50 Elo, mais l'échelle ne les sépare que de 19. L bat chacun des cinq suivants à 64-67 %, ce qui vaudrait 100 à 120 Elo, mais l'échelle ne lui en donne que 25 de plus que K. Sur la lignée actuelle, l'ordre est sûr : L > K > I = J > H > G. Pour un duel précis, la table complète est dans `elo.json`.
- **Les recherches (S, S-mH…) n'y sont pas** : elles jouent bien plus lentement qu'une règle.

## Les duels de la tête, en face à face

| | L | K | I | J | H | G |
|---|---|---|---|---|---|---|
| **L** |  | 64 % | 67 % | 67 % | 65 % | 66 % |
| **K** | 36 % |  | 57 % | 57 % | 58 % | 62 % |
| **I** | 33 % | 43 % |  | 50 % | 56 % | 60 % |
| **J** | 33 % | 43 % | 50 % |  | 59 % | 61 % |
| **H** | 35 % | 42 % | 44 % | 41 % |  | 57 % |
| **G** | 34 % | 38 % | 40 % | 39 % | 43 % |  |

Part des points gagnés par le robot de la ligne contre celui de la colonne.
