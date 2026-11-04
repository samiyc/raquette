# Le modèle de Raquette : le cadrage (2/11/2026)

Le ping-pong en simulation : un duel, la trajectoire de la balle, son effet et sa hauteur, un robot, un joueur à la souris
pour éprouver ce robot, puis l'autojeu. Ce document fixe ce qu'on va construire et comment on saura que ça marche. **À ce jour, `src/` a la
balle, la raquette, la visée, le corps, les trois duels de référence, le jeu à la souris et l'échelle des règles R0 à R5, mesurée : pas encore de recherche.**

**Le cap, précisé par Sami le 2/11/2026.** Tout représenter en 2D vue de dessus sera complexe, mais le jeu reste surtout de l'analyse,
du positionnement et des trajectoires. Le joueur humain est simplifié pour finir des parties, à la souris et au pas à pas, et il sert à **vérifier
les limites du robot**. Les gros progrès viendront à long terme de l'**autojeu**, où l'effet, le contre et la physique pèsent
davantage. Le joueur humain ne change donc rien à la physique : seule son entrée est simple.

Les chiffres viennent de [`recherche/chiffres.md`](recherche/chiffres.md) (les sources, jusqu'où chacune a été lue). Une
valeur marquée **H** est une hypothèse, avec sa question dans [`recherche/questions.md`](recherche/questions.md) :
`Q-Sn` pour Sami, `Q-Pn` pour un professionnel.

## 1. Ce que la recherche a déjà changé

Cinq constats, qui orientent la suite :

1. **La physique se trouve publiée, et récente.** Sony AI a publié en juin 2026 un modèle de vol, de table et de
   raquette, ajusté sur 277 parties. Inutile de l'inventer.
2. **Elle ne viendra presque pas de `mcts-codingame`.** Ni Mad Pod Racing ni Fantastic Bits n'ont de hauteur, de gravité
   ou d'effet : ce sont des disques sur un plan, avec un frottement par tour. On y reprend la recette (§ 9), pas les
   formules. La feuille de route le laissait attendre davantage.
3. **Le maillon faible, c'est la raquette.** Chez Sony, l'erreur sur le point de chute reste de 15 cm en médiane, et
   l'aérodynamique n'y compte presque pas. Polir le vol au-delà de quelques centimètres ne sert à rien.
4. **Le coefficient de Magnus doit suivre l'effet.** Avec le coefficient constant d'un article de 2026, un top à 15 m/s
   tombe 67 cm plus loin qu'avec la table de Sony AI (`chiffres.md`, § 8). Sony annonce pourtant moins de 2 cm d'erreur sur un
   vol pour son modèle de référence ; le même § 8 propose une explication, sans la prouver.
5. **Ce qui fait perdre un point n'a pas de source.** Personne ne publie la dispersion d'une frappe, ni le temps de
   réaction d'un pongiste en chiffres. Or sans cette dispersion, deux robots s'échangent la balle sans fin. Ces valeurs
   sont donc des hypothèses, calibrées puis soumises à un entraîneur.

## 2. Ce qui se passe

Un échange : un joueur sert, la balle vole et rebondit, l'autre la rejoint et la renvoie, jusqu'à la faute. Une partie est
une suite d'échanges, indépendants : la fatigue et la mémoire de l'adversaire ne sont pas modélisées.

**Le repère.** L'origine est au centre de la table, au niveau du plateau. `x` va d'un joueur à l'autre, le filet en
`x = 0`, les lignes de fond en `x = ±1,37`. `y` va de côté, les lignes en `y = ±0,7625`. `z` monte, le plateau en `z = 0`,
le sol en `z = −0,76`. En m, m/s et rad/s ; un effet positif autour de `y`, pour une balle qui va vers `x` croissant, est
un lift.

**Les règles retenues** (les Lois de l'ITTF, `chiffres.md`, § 1) :

- une balle valide touche le camp adverse, directement ou après avoir touché le filet ;
- la faute : le filet sans passer, le camp adverse manqué, la balle qui rebondit deux fois, l'obstruction, la balle pas
  rejointe à temps ;
- la manche à 11, 2 d'écart, le service qui tourne tous les 2 points, à chaque point à partir de 10-10. **Elle vit sur la
  page**, les mesures comptent des échanges (§ 7).

**Les simplifications** (toutes reprises au § 12) :

- un service stylisé : pas de lancer, un contact au-dessus de la ligne de fond. Le service long, sans effet ni dispersion, sert aux duels de référence et aux règles ; les six vrais services (pendule, marteau, mou, coupé, bombe, latéral, Sami, 3/11/2026) ont un effet et une dispersion (`src/services.js`, Q-P10). La souris les choisit, les règles en tirent un au hasard, et la recherche choisit le sien (`src/rules/service-search.js`) ;
- pas de balle de bord : le plateau est un rectangle à plat ;
- une balle qui touche le filet s'arrête là, ce qui est une faute si elle n'a pas encore passé (H, Q-P15) ;
- pas de vent, l'air à 20 °C ;
- un seul revêtement, un backside offensif (Q-P14).

**Une limite d'échange** : 60 coups (H). Un échange qui l'atteint vaut un partage (0,5), et il est compté à part. Une série
qui en a beaucoup signale un modèle sans faute.

## 3. La balle

**Son état** tient en 9 nombres, dans un `Float64Array` : position, vitesse, effet. **Le vol** est l'équation de Conti et
al. (`chiffres.md`, § 2), avec les tables de `C_D` et de `C_M`. Masse 2,7 g, rayon 0,02 m (la Loi), `g = 9,81` et
`ρ = 1,2` (H, Q-P15). L'effet reste constant pendant le vol, comme chez Gossard et al.

**Le pas de temps** : **RK2 à 240 Hz**. L'erreur sur le point de chute est de 0,1 à 0,3 mm, là où Euler semi-implicite
en fait 50 à 70 (`chiffres.md`, § 8). Le pas coûte 113 ns en vol, 171 ns avec la table et le filet (le banc, J1).

**Le seuil de 100 ns est dépassé, et il n'y a pas de grille pour l'instant.** Le cadrage prévoyait une grille de coefficients
au-delà de 100 ns. Mais un vol coûte environ 15 µs, ce qui reste dans l'estimation de 50 µs par plan du § 7, et une grille
lisserait le coude de `C_M`. Elle reviendra si le banc de J3 montre qu'un plan coûte trop cher.

**La table et le filet.** À 25 m/s, la balle fait 10 cm par pas, et le filet n'en fait que 15 : on cherche donc le premier
franchissement de `z = r` et de `x = 0` à l'intérieur du pas, par interpolation. C'est le geste de `meetTime` dans
Fantastic Bits, ici contre un plan.

**Le rebond** est celui de Nakashima, en glissement ou en roulement, avec `μ = 0,25` et `e = 0,98 − 0,02 |v_z|`. On laisse
de côté les corrections résiduelles de Conti (§ 12) : elles ne gagnent que 14 à 30 %.

**Les bornes** : 35 m/s et 1 000 rad/s, les maxima publiés. La recherche ne doit pas pouvoir sortir du domaine où le
modèle a été ajusté : Sony rappelle qu'un adversaire cherche justement les trajectoires que le modèle gère mal. Une escalade
fera pareil, et il faut qu'elle n'y gagne rien.

**Le reproductible.** Le pas ne contient que `+ − × /` et `sqrt`, exacts sur tout moteur JavaScript : ni `sin`, ni `cos`, ni
`pow`. Les orientations sont des vecteurs, pas des angles. Une partie rejouée donne donc la même balle sous Node et dans
n'importe quel navigateur, tant que les angles des règles sont convertis une seule fois, puis gardés.

## 4. Les joueurs

Tout ce paragraphe est **hypothétique**, faute de source (`chiffres.md`, § 6), avec des valeurs d'un bon joueur de club
(Q-S1). Elles sont regroupées dans un profil de joueur, qu'un entraîneur pourra corriger sans toucher au code.

| Grandeur | Valeur de départ | Question |
|---|---|---|
| Position d'attente | centre, 0,5 m derrière la ligne de fond | Q-P12 |
| Temps de réaction après la frappe adverse | 0,16 s (0,20 s jusqu'au 4/11/2026) | Q-P4 |
| Vitesse et accélération du corps, sur le plan du sol | 3 m/s, 14 m/s² | Q-P5 |
| Portée du bras depuis le corps | 0,72 m (0,8 m jusqu'au 4/11/2026, Sami) | Q-P5 |
| Ce que le corps peut avancer au-dessus de la table, penché | 0,4 m | Q-P19 |
| Champ d'action autour du corps | **220°, axe fixe vers le filet (Sami, 2/11/2026)** ; 110° de chaque côté de l'axe | Q-P5 |
| Bande de hauteur atteignable | du plateau moins 0,5 m au plateau plus 1,2 m | Q-P5 |
| Préparation avant la frappe | 0,15 s | Q-P6 |
| Vitesse de raquette maximale | 20 m/s | Q-P7 |
| Dispersion de l'orientation de la raquette | 3° en hauteur, 1,5° sur le côté (mesuré à J5) | Q-P1 |
| Dispersion au bout du bras | ×2 au bout du bras, rien jusqu'à 0,45 m (J5) | Q-P2 |
| Dispersion sur une balle rapide | rien jusqu'à 10 m/s au contact, puis une fois de plus tous les 2,5 m/s (Sami, 3/11/2026) | Q-P21 |
| Dispersion loin de la table | rien jusqu'à 0,6 m derrière la ligne, puis une fois de plus tous les mètres (Sami, 3/11/2026) | Q-P21 |
| Dispersion de la vitesse de raquette | 6 % | Q-P1 |
| Croissance de la dispersion quand le temps manque | ×2 sans préparation | Q-P2 |

**Le corps** est un point sur le sol, qui ne franchit pas la table, sauf les 0,4 m où il se penche au-dessus d'elle. Sans cela, avec une
portée de 0,8 m à l'époque, les 57 premiers centimètres après le filet seraient hors d'atteinte depuis le fond : une balle courte y gagnerait
toujours, et l'autojeu l'aurait vite trouvé. **La raquette n'a pas de bras** : pas de geste simulé,
pas de cinématique. Un joueur s'engage sur un instant et un point du trajet de la balle. Si, à cet instant, le point est dans
le secteur et que la préparation a eu lieu, le contact a lieu. Il frappe plus tôt si la balle allait sortir de sa portée : un corps peut arriver en retard sur son plan, et il ne la laisse pas passer pour autant.

**Le secteur** est ce que le bras atteint sans déplacement : une distance de 0,72 m au plus sur le plan, un angle d'au plus
110° avec l'axe du joueur, et la bande de hauteur. Les 140° du dos restent hors d'atteinte : une balle passée derrière le
joueur l'oblige à reculer, ou elle est perdue. L'axe est fixe, sans état ni paramètre de plus : le robot et Sami ont le même.
Le test reste sans trigonométrie : le produit scalaire du vecteur unitaire vers la balle et de l'axe se compare à la
constante `cos 110° = −0,3420…`. Un axe qui pivote vers la balle ne reviendrait que sur un avis d'entraîneur (Q-P5).

**Le coup** passe par quatre étapes, les mêmes pour une règle, une recherche ou la souris :

1. **L'intention** : un point visé sur le camp adverse, une vitesse de frappe (celle de la balle au départ, le long de la normale de
   la raquette : la raquette recule si la balle arrive trop vite), un brossage (la vitesse tangente de
   raquette, donc l'effet voulu), l'instant du contact, et où aller ensuite. C'est ce qui se décide.
2. **La visée** (`aim`) : les deux inclinaisons de raquette qui envoient la balle sur le point visé, trouvées par quelques
   itérations de Newton, chacune simulant un vol. C'est de la balistique, partagée, et ce n'est pas la recherche : une règle
   en a besoin autant qu'elle. Elle garde 15 cm au-dessus du filet (H, Q-P20), en jouant moins fort s'il le faut, puis 5 cm ; une balle
   haute ne vient qu'en dernier, et jamais au-delà de 50° : une recherche y avait trouvé une faille. Si rien ne convient, le coup est joué tout de même, et l'échange dit ce qu'il en reste. Elle lit la balle **telle
   que le joueur la perçoit**.
3. **L'exécution** : la dispersion du § 4 s'applique à la raquette, tirée d'un flux à graine.
4. **Le contact** : le modèle de Conti, avec la balle **vraie** et la raquette **bruitée** : restitution normale et
   tangente, raideur tangente (`chiffres.md`, § 4), sans son réseau de neurones.

Cette construction donne son sens à l'effet adverse sans rien ajouter : un effet bien lu est compensé par la visée et ne
coûte que de la marge ; un effet mal lu renvoie la balle de travers. Au début, la balle se lit sans erreur. **Le jour où
elle se lit avec une erreur (Q-P9), le jeu devient à information cachée**, et c'est alors, et seulement alors, que
l'ISMCTS de la lib a un rôle à jouer.

## 5. Le temps

| Horloge | Fréquence | Ce qu'elle fait |
|---|---|---|
| Simulation | 240 Hz, fixe | la balle, le corps, les contacts ; un clic s'applique au pas où il arrive |
| Page | 60 Hz | 4 pas par image à vitesse réelle ; le dessin ne décide rien |
| Décision | à chaque coup | l'intention, une fois après la frappe adverse, plus le temps de réaction |

Une balle met de 0,2 à 0,5 s à traverser (`chiffres.md`, § 8). Sous Node, la décision ne connaît pas l'horloge : elle a un
budget en plans (§ 7). Dans la page, ce budget est découpé sur les images ou passé à un *worker*, et le temps se mesure sur
le navigateur, pas sur notre horloge, comme l'a appris Hypersonic.

## 6. La règle simple à battre

**R0, « renvoyer au centre »**, c'est la règle de la feuille de route, lue ainsi (Q-S2) :

- viser le centre du camp adverse, `x = 0,685` et `y = 0` ;
- frapper une balle à 6,5 m/s au plus (H), moins si la marge au filet le demande, sans brossage ;
- prendre la balle au sommet de son rebond, ou au dernier instant à portée si le sommet échappe ;
- après le coup, retourner à la position d'attente ;
- servir long et au centre, sans effet.

**R0 n'est pas la barre finale, seulement la première.** Comme à la cuisine, une recherche se compare à la **meilleure**
règle simple. On mesure donc, dans l'ordre :

| Règle | Ce qu'elle ajoute | Ce que dit sa mesure |
|---|---|---|
| **R0** | le centre | le témoin |
| **R1**, « loin de lui » | viser le côté le plus éloigné de l'adversaire, à mi-longueur, à 26 cm de la ligne (H) | **le modèle récompense-t-il le placement ?** |
| **R2**, « prudent » | R1, et frapper moins fort quand le temps de préparation manque | le coût réel de la dispersion |
| **R3**, « effet » | R2, plus du lift en attaque sur une balle prise à 25 cm ou plus, plus profond, et une poussette sur une balle basse au-dessus de la table | la force de Magnus vaut-elle quelque chose dans ce modèle ? |
| **R4**, « contre » | R3, plus un coup de contre sur une balle rapide : une raquette peu rapide, un contact tôt | renvoyer la vitesse et l'effet adverses rapporte-t-il ? |
| **R5**, « court » (Sami, 3/11/2026) | R4, plus un coupé à deux rebonds quand l'adversaire est trop loin pour arriver avant le second | punir un joueur reculé rapporte-t-il, et force-t-il à rester près de la table ? |

**Le coupé à deux rebonds** (Sami, 3/11/2026). Si l'adversaire est loin et ne peut pas prendre la balle avant le deuxième rebond, le
point est perdu pour lui. Le calcul, avec le corps du § 4 (`chiffres.md`, § 8) : les deux lancers de Sami se rattrapent
jusqu'à 2,4 m et 1,6 m derrière la ligne au mieux, contre 0,5 m pour la position d'attente. Le coup punit donc un joueur reculé, pas
un joueur à sa place. **Le tchop** est l'autre coupé : joué de loin, il repasse le filet bas, avec beaucoup de coupé. Il ne donne
pas deux rebonds, mais ralentit la balle.

**Les trois duels de référence** (Sami, 3/11/2026 : « ça fait très réaliste ») ne sont pas des règles à battre. R0 contre R0, top contre bloc, poussette contre poussette :
ils disent si le modèle ressemble encore au ping-pong, et ce sont eux qui fixent la dispersion (`src/rules/drills.js`, `chiffres.md`, § 8). Leurs chiffres sont gardés dans
`docs/duels-reference.json` : `npm run duels` les compare, un test refuse un changement qui les éloigne de ce que Sami a vu, et un changement voulu les réécrit avec `--write`,
en donnant l'avant et l'après dans son commit. Une empreinte les tient aussi au nombre près.

**Viser ailleurs qu'au centre** (Sami, 3/11/2026). La visée sait déjà envoyer la balle sur n'importe quel point : c'est une règle qui choisit lequel. À la souris, le clic droit le fait dès J4. R1 commence à J5 : le coin le plus loin de
l'adversaire. Les règles suivantes distingueront le **croisé** (vers le coin opposé, en diagonale, là où la table est la plus longue) et la **ligne droite** (le long du même côté, plus court et plus risqué, mais plus surprenant).

**R1 sert de garde-fou.** Si viser loin de l'adversaire ne bat pas viser le centre, le modèle ne récompense pas le placement,
et le jeu n'en est pas un : on corrige le modèle avant d'écrire la moindre recherche. Le pendant : si R1 écrase R0 à 90 %,
la dispersion est trop faible ou les déplacements trop lents. **Il a servi à J5** : à 3° sur le côté et sans coût au bout du bras, R1 ne prenait que 12,5 % des points. Après correction, il en prend 52,1 %, de 51,0 à 53,3 %.

**La mesure de J5**, 1 200 graines neuves par ligne (`chiffres.md`, § 8) : **R3 reste la barre de la première recherche, de peu** : 51,7 % contre R0 sur le dernier modèle, un intervalle qui contient 50 %, et 68,9 % contre R2. Les règles ne sont pas transitives. R2 ne change rien (le temps ne manque jamais à ce rythme), R4 ne fait pas mieux que R3, et R5 ne se déclenche presque jamais.

Les paramètres de chaque règle se règlent sur des graines de calibration, puis sont figés, et ne servent plus pour les
mesures.

## 7. Les mesures

**L'unité est l'échange**, parce qu'il est indépendant et bon marché. Une manche se déduit (`chiffres.md`, § 8).

**La paire.** Une graine donne deux échanges : A sert, puis B sert, chacun avec les mêmes tirages de dispersion. Le score
de A sur la graine est son nombre de points, 0, 1 ou 2. `paired(scoresA, scoresB)` rend l'écart moyen avec son intervalle à
95 %, et la part des points de A vaut `0,5 + écart / 4`.

**Les tirages restent alignés.** Chaque tirage de dispersion vient de `streamOf(graine, indice)`, avec un indice qui dépend
du rôle (serveur ou receveur) et du numéro du coup, pas d'un compteur partagé. Deux joueurs reçoivent ainsi le même tirage au
coup `k`, même si leurs échanges ont divergé plus tôt. La graine perd de sa force au fil de l'échange : on publiera le gain
de variance réel de la paire, plutôt que de le supposer.

**Le seuil d'adoption.** Une variante est adoptée si la borne basse de l'écart est au-dessus de 0, confirmée sur des graines
neuves quand elle passe de peu. **Le plus petit gain qui vaille : 52 % des points**, soit 57,7 % des manches et 66,5 % des
matchs, un écart de 0,08 (Q-S3). Pour l'intervalle : 2 401 échanges pour ±2 points, c'est-à-dire 1 200 graines environ.

**La séquence.** `sprt(écarts, { h0: 0, h1: 0.08 })` arrête une série tranchée, et elle se rapporte toujours avec `paired`.
Un écrémage rapide rejette, il ne promeut jamais.

**Les témoins :**

- **A/A exact.** La même règle des deux côtés : à graine égale, échanger les joueurs donne l'échange miroir, à l'octet, écart
  0. C'est un test, pas une statistique, et il attrape tout biais de côté.
- **A/A statistique.** Une version contre elle-même sur des indices de tirage décalés : l'intervalle doit contenir 0.
- **Plus de budget.** Une recherche à 4 fois son budget doit battre sa version courante. Sinon, elle plafonne, ou elle
  surapprend le bruit.

**Ce qu'on rapporte**, en plus de l'écart : la longueur des échanges, la cause de chaque fin (filet, hors table, deux rebonds, balle pas
rejointe, hors secteur, limite), la part des points du serveur, et les graines avec la commande pour rejouer.

**Sans horloge.** Une mesure fixe un budget (`budget` de `createClimb`), jamais une échéance, pour ne pas dépendre de la
charge de la file. Le temps se mesure à part, au banc. La recherche a son propre flux de tirages, séparé de celui du monde,
sinon un plan de plus décalerait la dispersion.

**Où ça tourne.** Une estimation à vérifier au banc : un plan coûte quelques vols, soit de l'ordre de 50 µs (H), donc 1 000
plans par coup font 50 ms, un échange de 5 coups 250 ms, et 2 400 échanges 10 min sur un fil. Une série longue passe par la
file, en jobs d'un fil, de 30 min au plus, avec `progress` ; un test court passe par `--slot`.

**La mesure ne prouve que dans le modèle.** Un gain ne dit rien du vrai ping-pong tant que les hypothèses du § 4 n'ont pas
été confrontées à un entraîneur.

### Se comparer à du public

La feuille de route met « – » pour ce banc : aucun banc de duels n'existe. Mais la physique peut se comparer à des chiffres
publiés, comme les moteurs CodinGame le faisaient au site : **un simulateur n'est cru qu'une fois rejoué contre la
référence**. Les tests de J1 :

| Test | La référence | Tolérance (H) |
|---|---|---|
| Rebond depuis 30 cm | environ 23 cm (Loi 2.1.3) ; 24 cm calculés | ±1,5 cm |
| Vitesse limite en chute | 8,0 à 8,7 m/s (`C_D` publié) | ±0,2 m/s |
| Top ≥ 110 tr/s contre ≤ 80 tr/s, à même départ | 1,4 m/s de plus, 27 ± 5 ms de moins (Kidokoro) | le signe et l'ordre de grandeur |
| Effet du rebond sur la vitesse horizontale | de −3,1 à +2,6 m/s (Kidokoro) | dans cette plage, sur les mêmes conditions |
| Un fort coupé repart en arrière | qualitatif (Conti) | le signe |
| Roulement et glissement se raccordent à α = 0,4 | la dérivation (`chiffres.md`, § 3) | exact |

**La calibration, à ne pas confondre.** Les duels d'entraînement fixent la dispersion : le top contre le bloc doit tenir de 10 à 25 coups (H, Q-P20). C'est un
ajustement, pas une preuve. Les 4 à 5 coups par échange (Glynn, l'extrait d'une autre étude) viennent de matchs, où l'on attaque : ils vérifient la
meilleure règle à J5, pas R0, qui tient 47 coups (`chiffres.md`, § 8). Les parts de points au service, à
la 3e et à la 5e balle (Djokic) restent, elles, une vérification indépendante, une fois le service en place.

## 8. La recherche, plus tard

**La première recherche existe depuis J6** (`src/rules/search.js`, résultats dans `chiffres.md`, § 8) : les points 1 et 2 ci-dessous, sur 4 nombres (le point visé, la vitesse, le brossage), l'instant restant celui de R3. Elle ne garde que ce qui peut se jouer (Sami, 3/11/2026) : un essai neuf part d'un coup jouable pour cette balle, et un coup mou sur une balle trop rapide vaut zéro sans être simulé. Le reste dit dans quel ordre on essaiera.
Le jeu est à information complète au départ, et les coups sont des nombres continus : `docs/algorithmes.md` de la lib, § 3,
désigne l'escalade.

1. **Le témoin** : Monte-Carlo à plat sur quelques intentions de la meilleure règle, pour savoir ce qu'une simulation gagne seule.
2. **`createClimb`** sur les 8 gènes d'un coup (point visé x et y, vitesse, brossage de deux composantes, instant, position
   ensuite x et y), contre un modèle fixe de l'adversaire, la meilleure règle.
3. **Le miroir** : l'adversaire prédit par une seconde escalade, ce qui a tant payé à Mad Pod Racing (60/60 contre 39/60, le REX de codingame).
4. **L'ISMCTS** : seulement si la balle se lit avec une erreur ou si l'adversaire est inconnu, et que l'escalade plafonne.
5. **Pas de faisceau** : rien n'est discret ici.

**Deux écueils propres au ping-pong :**

- **Le plan n'est pas stable d'un coup à l'autre.** Mad Pod Racing décale son plan à chaque tour ; ici, le coup d'après
  dépend d'une réponse qui n'a pas encore eu lieu. `shift` ne servira sans doute à rien : à mesurer par ablation.
- **Le bruit trompe l'escalade.** Mad Pod Racing était déterministe. Ici, noter un plan sur un seul tirage récompense la
  chance. On notera chaque plan sur K tirages communs à la décision (K = 4, H), avec une note de marge (distance au filet et
  aux lignes en écarts-types, temps qui reste à l'adversaire). Et on vérifiera sur des tirages frais que le plan gagnant
  vaut ce que sa note annonçait.

**La note** est façonnée, terme par terme, chaque terme mesuré par ablation : la recette du REX de codingame
(`mcts-codingame/docs/rex-strategies.md`, § 2).

### L'autojeu, après la première recherche (J7)

C'est de là que Sami attend les gros progrès. La lib n'a rien pour cela : il vivra donc dans `raquette`, et ne remontera à la
lib que si un second projet en a besoin.

**Un robot qui ne joue que contre sa lignée se trompe.** Sur CodinGame, trois gains locaux se sont évaporés sur le site
(`mcts-codingame/docs/rex-strategies.md`, « L'arène ne mesure que contre notre lignée »), et une prédiction paraît trop forte
contre une copie exacte de soi : 98 % (`mcts-codingame/docs/strategies.md`). Ici, il n'y a pas de site pour corriger. D'où :

- **un panel figé** : les règles R0 à R5, les versions gelées, des sparrings qui jouent autrement, et les positions que le
  robot a perdues contre Sami ;
- **la règle d'adoption** : une variante bat sa version, par paires, sur des graines neuves. Le panel ne décide plus (Sami, 4/11/2026) : le plancher à 50 % empêchait toute lignée partie de R3 d'avancer. Chaque version gardée et le contrôle final le jouent, pour voir si une lignée tourne en rond ;
- **Sami comme juge extérieur** : ses parties à la souris sont, avec l'entraîneur, le seul adversaire qui ne vient pas de la
  lignée (Q-P17, Q-P18).

**Ce que l'autojeu apprend d'abord : les nombres de la règle d'attaque** (`src/rules/tunable.js`, 3/11/2026), onze nombres que R3 fixe à la main : profondeurs, largeurs, vitesses, brossages, la hauteur à partir de laquelle on attaque, le recul entre deux coups. La règle joue vite, donc des milliers de points par variante, et c'est elle qui sert de modèle à la recherche : une règle meilleure devrait améliorer la recherche sans y toucher, ce qui reste à mesurer. Les poids de la note viendront ensuite, si la note a encore des poids à régler ; pas de réseau de neurones au départ.

**Le service part d'où l'on se place.** Les règles tirent ce départ au hasard, à 50 cm au plus du milieu, et la recherche l'essaie pour le service qui sort le meilleur. La bombe part à 11 m/s au plus : sa vitesse baisse quand la ligne est courte, pour viser à 12 cm de la ligne de fond au plus (elle sortait de 5 à 9 %, de 2 % maintenant).

**Un grand geste coûte de la précision** (3/11/2026, `effortOf`, Q-P22). La première lignée sur le modèle corrigé des services, `d`, a battu la recherche à 65,4 %, en 2,5 coups par échange : une raquette à 5 m/s, un brossage de 16 m/s, une balle à 13 m/s et 150 tr/s, sur la table 9 fois sur 10. Le brossage ne coûtait rien. Il compte maintenant : rien jusqu'à 14,2 m/s au total, le top ordinaire, puis une dispersion de plus tous les 5 m/s, et un brossage de côté pèse 3,5 fois plus (3 fois d'abord : Sami trouvait le latéral encore trop facile). Les trois duels de référence ne bougent pas.

**T, le premier robot gardé** (3/11/2026, `src/rules/tuned.js`, lignée `h`). Après le coût du geste, trois lignées partent de R3 : `g`, `h` et `i`. `h` et `i` trouvent la même recette, sans lien entre elles : une raquette à 5 m/s, la borne basse, et un brossage de 13 m/s, juste sous le seuil du coût du geste ; une balle à 10-12 m/s et 130 tr/s, très large (rebond à 60 cm de l'axe). Contre R3, 78 % des points gagnés par T sont des balles que R3 n'atteint pas : l'angle les sort du bras d'un corps qui attend au milieu, réagit en 0,2 s et n'anticipe rien. Prise comme modèle de l'adversaire, T rend la recherche nettement plus forte (`S-mT` : 71,9 % contre R3, au lieu de 64,5 %), mais les échanges tombent à 3 coups et le serveur à 40 %. Seul le jeu à la souris dira si cet angle gagne aussi contre Sami. Les chiffres sont dans `chiffres.md`, § 8.

**U, le régulier** (3/11/2026, lignée `k`). Sur le corps à 16 m/s², l'angle gagne moins, et l'autojeu trouve une autre recette : attendre à 10 cm de la table, jouer un top lent vers le milieu, tenir la table à 97 %, et laisser l'adversaire se tromper. U bat R3 à 79 % et la recherche à 81 %, en 12 à 14 coups par échange ; la recherche, elle, tombe à 53 % contre R3 parce qu'elle fait trop de fautes. Trois de ses nombres collent à leur borne. Chiffres : `chiffres.md`, § 8.

**Frapper en courant coûte de la précision** (4/11/2026, `runningOf`, Q-P23). Contre U, Sami ne pouvait pas gagner en gauche-droite : U frappait à 2 m/s sans le moindre coût. Rien jusqu'à 1 m/s, puis une dispersion de plus tous les 4 m/s. Le corps passe aussi à 14 m/s². Top contre bloc passe de 15 à 11 coups, U contre U de 34 à 13.

**V, celui qui fait courir** (4/11/2026, lignée `n`). Avec ce coût, deux lignées sur trois reviennent à la balle large et très brossée, et le régulier ne domine plus. V bat R3 à 84 % et la recherche à 79 %, en 4 à 6 coups par échange. Son effet, 120 à 135 tr/s, est à regarder : son geste reste juste sous le seuil du coût du geste, une hypothèse (Q-P22).

**Moins de bras, et jouer en place** (Sami, 4/11/2026 ; détails et mesures dans [`recherche/autojeu.md`](recherche/autojeu.md)). S-mV est le robot dont Sami préfère le jeu ; les échanges courts et les duels de tops ne sont « pas très beaux ». Le bras passe à 0,72 m et la réaction à 0,16 s ; une frappe à 3 m/s coûte ×1,67 au lieu de ×1,5. Un robot revient dès son service, et peut couvrir le retour croisé (`cover`). Il peut attendre d'être en place pour attaquer (`ready`), et jouer sinon un coup plus sûr (`soft…`), coupé s'il le veut. Le bloc coupé et le strawberry rejoignent les coups de la souris et de la recherche. Le latéral monte de 10 %.

**W et X** (4/11/2026, lignées `p` et `q`, [`recherche/autojeu.md`](recherche/autojeu.md)). Sur le bras court, à égalité entre eux. W garde un coupé pour quand il n'est pas en place ; X se replace vraiment. S-mW devient la recherche la plus forte (60,5 % contre S-mV, 71,6 % contre S), avec moins de tops et des échanges plus longs. Le défaut s'est retourné : W contre W finit à la limite de 60 coups dans 48 % des échanges.

**Où en est l'autojeu** (4/11/2026). T, U et V ont été réglés avant le bras court. À faire, sans ordre fixé :

- punir la balle lente : le coup décisif existe (`kill…`, `recherche/autojeu.md`), mais une balle reçue sous 10 m/s ne coûte rien (Q-P21) et les échanges lents restent bas ; ils dépassent de loin les 4 à 5 coups de l'élite (`chiffres.md`, § 6) ;
- comprendre pourquoi S fait tant de fautes ;
- une erreur de lecture sur les balles très brossées (Q-P9) : une visée exacte rend un service à fort effet trop facile à attaquer ;
- séparer l'accélération du freinage si l'inertie gêne encore.

Les bornes où les lignées butaient sont élargies : `topSpeed` part de 3 m/s, `wide`, `topWide` et `wait` de zéro.

**Regarder deux robots jouer** (Sami, 4/11/2026) : la page `web/index.html` les fait jouer une manche, un échange après l'autre, avec le lecteur et ses vitesses (`src/watch.js`, `web/watch.js`). Un fil à part joue chaque échange, et le score ne bouge que quand le point se termine à l'écran.

**Comment** (`scripts/selfplay.js`, une série = un job de la file, historique dans `docs/selfplay/`) : à chaque génération, 8 variantes déplacent 1 à 3 nombres dans leurs bornes ; un crible de 150 graines contre la version en cours élimine ; les 2 meilleures sont confirmées sur 600 graines neuves, contre la version (bas de l'intervalle au-dessus de 50 %) et contre R0, R1 et R3 (au moins 50 % à chacun). **Tant de confirmations laissent passer des chanceuses** : la dernière version rejoue donc le panel sur 2 000 graines qu'aucune génération n'a vues, et seul ce chiffre compte. Le panel ne contient encore ni les versions gelées, ni les positions perdues contre Sami.

**L'autojeu cherchera les failles de la physique**, comme le rappelle Sony. Les bornes du § 3 sont là pour ça, et les
corrections résiduelles de Conti reviendraient si un robot gagnait dans une zone où le modèle est faux.

**L'effet pourrait ne presque rien rapporter.** Avec une lecture parfaite et une visée exacte, un effet adverse ne coûte que
de la marge (§ 4) : l'autojeu n'y trouverait alors pas ce que Sami en attend. R3 contre R2, puis R4 contre R3, le diront à J5.
Si l'effet ne rapporte pas, on ajoute une erreur de lecture (Q-P9) : le jeu devient à information cachée, et l'ISMCTS a son
rôle.

## 9. Ce qu'on prend de la lib, et d'ailleurs

**De `mcts-commun` :**

| Module | Ce qui sert | Quand |
|---|---|---|
| `random.js` | `createRng`, `streamOf` (un flux par joueur et par coup) | J1 |
| `measure.js` | `paired`, `wilson`, `sprt`, `eloScore` | J5 |
| `trace.js` | `progress`, pour les jobs | J5 |
| `web/theme.css`, `bin/serve.js` | l'allure commune, la page sur le port 4804 | J2 |
| `replay-keys.js` | `replayKeys`, `replayHint`, `nextSpeed`, `within` pour le lecteur | J2 |
| `climb.js` | `createClimb` | J6 |
| `mcts-backlog`, `mcts-board` | la file, `--slot`, le tableau | dès J5 |

**Ce qu'on ne prend pas, et pourquoi :**

- `grid` (pas de grille) et `schedule` ;
- `events` (une simulation à pas fixe) ;
- `beam` et `pool` (pas de coups discrets) ;
- `mcts`, tant que le jeu reste à information complète.

**Ce qui manque à la lib : rien pour l'instant.** La physique reste chez nous, jusqu'à ce qu'un second projet en ait besoin.

**De `mcts-codingame`, à lire seulement, sans importer ni modifier :**

| Fichier | Ce qu'on en retient |
|---|---|
| `mad-pod-racing/src/fastsim.js`, `fantastic-bits/src/fast/` | la forme d'une simulation sans allocation, en tableaux typés, vérifiée champ par champ contre un moteur plus lent |
| `mad-pod-racing/src/search.js` | les mutations, le plan décalé, la prédiction en miroir |
| `fantastic-bits/engine/collide.js` | le premier contact à l'intérieur d'un pas (`meetTime`, `wallTime`) |
| `mad-pod-racing/engine/race.js` | rien à copier : c'est un portage sous licence MIT de l'arbitre de robostac, et ni son frottement ni ses arrondis ne s'appliquent ici |

**On réécrit plutôt que de copier.** Il s'agit de peu de lignes et de formules connues. Cela évite à la fois une mention de
licence à porter et du code de bot dans un dépôt qui pourrait devenir public.

**La recette reprise**, celle des trois bots en Légende : un moteur lisible et testé, une simulation rapide vérifiée contre
lui, une recherche jusqu'au budget, une note façonnée, un modèle de l'adversaire. Et le budget de travail de la lib : aucune
collection de la jeune génération pendant une décision (`tests/`, à J6).

## 10. La page et la souris

**La page** (J2, `npm run page`, http://127.0.0.1:4804/web/index.html) : la table vue de dessus, sur le Khaki que préfère Sami,
pris dans le thème de Notepad++ (`themes/khaki.xml` : `5F5F00` sur `D7D7AF`), avec `mcts-commun/web/theme.css` en premier. La
page reste claire même si le navigateur est en mode sombre. On y lance une balle à la main, depuis des coups préréglés ou des
champs, et ce que fait chaque coup préréglé est testé.

**Les couleurs de la balle :**

- **l'effet** : une teinte, rouge pour le lift, bleu pour le coupé, plus intense quand il est fort, et une petite flèche pour
  le latéral ;
- **la hauteur** : la taille de la balle, et le décalage de son ombre sur la table ;
- **un bandeau de profil** au-dessus de la table (Q-S5 ; Sami, 3/11/2026 : un lob en sort par le haut au lieu de déborder sur la vue de dessus) : vue de dessus seule, on ne voit pas si la balle passe le filet. Il garde les
  longueurs de la vue de dessus et ramène les hauteurs à 65 %, pour tenir à l'écran avec un lob.

**Les couleurs sont testées** contre la table et le sol (au moins 3:1) et sous les trois daltonismes, simulés par les matrices de
Machado et al. 2009, de mémoire et non relues. L'effet ne repose pas sur la couleur seule : un « + » ou un « − » est écrit dans la balle.

**Le lecteur** : un échange se rejoue depuis sa graine, ses deux profils et les clics, avec `replayKeys`. L'échelle de temps
est courte : `step` d'un pas de 1/60 s, `bigStep` de 0,1 s, ralenti jusqu'à 1/8 (H).

**La souris** (Sami, 2/11/2026) : le clic gauche sur le plan donne la cible de déplacement, le clic droit sur la table la zone
visée. Une fonction pure, `orderOf(click, view) → { moveTo } | { aimAt }`, traduit le clic : la page l'appelle, et les tests lui
passent des clics simulés. La page empêche le menu contextuel (`preventDefault` sur `contextmenu`).

**Ce qui est simplifié, seulement dans l'entrée :**

- le clic droit donne le point visé ; la force (6,5 m/s), l'absence de brossage et le contact au sommet du rebond sont ceux de
  R0 ; sans nouveau clic, la dernière cible reste, et la première est le centre ;
- le contact se fait tout seul à partir du sommet du rebond, dès que la balle est dans le secteur ; une balle qui sort est laissée, comme le fait le robot.

**Ce qui ne l'est pas : les limites sont celles du robot.** Réaction, vitesse, secteur et préparation restent les mêmes, et les
clics comptent jusqu'au début de la préparation : la pause donne du temps pour réfléchir, pas pour courir. Avant le service, un clic gauche ou les touches ZQSD placent le corps tout de suite. **Le service part d'où le serveur se place** (Sami, 3/11/2026), derrière sa ligne, à 70 cm au plus de la ligne médiane. Le receveur attend au milieu de ce que le serveur peut atteindre, à mi-chemin des deux lignes qui vont du serveur aux coins opposés, soit un peu à l'opposé (18 % du décalage du serveur) : ni la ligne droite ni la diagonale ne le prennent de court. ZQSD déplace aussi le joueur pendant le point.
Chaque point attend d'être lancé ; Sami joue par courtes pauses, ajuste sa route et sa cible, et repart à la barre d'espace (3/11/2026). **La dispersion est
celle du robot par défaut** (Sami, 2/11/2026), avec un curseur de 0 à 100 %, dont la valeur s'affiche à côté du score. Sans elle,
Sami battrait le robot par sa précision, ce qui ne dirait rien des limites du robot. Un score à une autre valeur reste une
exploration, pas une mesure.

**Le choix du coup** (Sami, 3/11/2026). Pendant une pause, on choisit le coup de la prochaine balle : plat, top, poussette, bloc, latéral, deux rebonds, tchop, bloc coupé, strawberry (`src/strokes.js`). Les options sans objet disparaissent par le calcul : le coup est essayé sur la balle telle qu'elle sera au contact, depuis l'endroit où le joueur la prendra. S'il faudrait frapper plus fort que ce coup pour atteindre la cible, il n'est pas proposé : loin de la table, ni poussette ni deux rebonds. Quelques seuils s'y ajoutent (H) : pas de poussette au-dessus de 40 cm, pas de bloc ni de bloc coupé sous 6 m/s, pas de tchop à moins de 40 cm derrière la ligne, pas de bloc coupé au-delà, pas de strawberry à plus de 15 cm derrière la ligne ni au-dessus de 8 m/s. Le choix compte jusqu'au début de la préparation, comme la visée.

**La recherche réfléchit dans un *worker*** (`web/search-worker.js`, Sami, 3/11/2026) : la page continue de dessiner et d'écouter, et seule la simulation attend sa réponse. Elle reçoit une image de l'échange, et sa réponse est celle que la règle aurait donnée sur place, au nombre près : un point se rejoue pareil avec ou sans *worker*. Un clic fait pendant qu'elle réfléchit compte juste après ce pas.

**Pendant une pause** (Sami, 3/11/2026), la page montre la route de la balle telle que les joueurs la lisent (des points et des croix bleus), pour ne plus deviner où elle va, et où le coup prendra la balle (un anneau bleu). Le cercle rouge n'est plus fixe : il contient la moitié des coups joués ainsi, calculés sur cette balle, depuis l'endroit où le joueur la prendra, avec tout ce qui rend ce coup moins sûr.

**Ce que la page montre :** le secteur autour de chaque joueur, le cercle de dispersion attendue autour de la cible, et la
cause de chaque fin d'échange.

**Le pas à pas** : une pause automatique à chaque frappe du robot (désactivable), une touche « événement suivant » (frappe,
rebond, contact), un pas de 1/60 s, les vitesses de 1/8 à ×1.

**La page** : `web/play.html`, à partir de `src/mouse.js` et `src/game.js`. Un point se rejoue exactement depuis sa graine, la dispersion et ses clics.

**Tout est gardé pour analyser plus tard** (Sami, 3/11/2026) : la page enregistre chaque point, et `--replays` chaque échange d'une série, avec les positions des joueurs à chaque impact, ce qu'a fait la raquette, où était un joueur pour une balle manquée, la date et la version des robots : [`replays.md`](replays.md).

**Vérifier les limites du robot** : un point que le robot a perdu s'exporte depuis la page (sa graine, ses clics, sa fin) vers `positions/`, un fichier par point, et
`npm run positions` les rejoue avec le robot du moment. Ce banc nourrira le panel de l'autojeu (§ 8).

**La manette, plus tard** (J8, si elle sert encore) : `readPad(gamepad)`, sur le même principe. Ce que dit la spécification :

- la disposition standard : axes 0-1 pour le stick gauche, 2-3 pour le droit, de −1 à 1, **le bas est positif** ; boutons
  0-3 à droite, 4-7 sur la tranche (gâchettes 6 et 7 analogiques), 12-15 pour la croix ([W3C][w3c]) ;
- on lit `navigator.getGamepads()` à chaque image, sans garder l'objet : les événements ne signalent que le branchement
  ([MDN][mdn]) ;
- rien n'apparaît avant qu'un bouton ait été pressé sur la page ; `mapping` peut être vide sur certaines manettes, et la
  zone morte est à notre charge ([MDN][mdn], [W3C][w3c]).

[w3c]: https://w3c.github.io/gamepad/
[mdn]: https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API

## 11. Les jalons

Chacun a ses tests et un commit, et rien de l'étape suivante n'est écrit avant. La feuille de route demande la table, la balle,
le rebond et ses couleurs, puis un échange robot contre robot, puis la manette ; Sami a placé la souris d'abord, avant les
mesures (2/11/2026) : quelques parties peuvent montrer un défaut du corps ou de la visée avant de lancer de longues séries.

| Jalon | Ce qu'il livre | Ce qui dit qu'il est fait |
|---|---|---|
| **J0** | ce cadrage | les docs, les questions tranchées |
| **J1** | la balle : vol, table, filet (`src/ball/`), les tests de référence du § 7 | ces tests passent ; les tables de coefficients sont relues contre l'article ; la première empreinte, le banc |
| **J2** | la page : la table, une balle lancée, le rebond, les couleurs, le bandeau | Sami la regarde ; le changelog |
| **J3** | la raquette, la visée, le corps et son secteur, un échange R0 contre R0 | l'A/A exact à l'octet ; le secteur testé à ses bornes ; un contact passif renvoie un lift du bon côté ; les fins d'échange par cause, dont les deux rebonds d'un joueur reculé |
| **J4** | la souris : une manche contre R0, le pas à pas, le rejeu, le score avec le curseur, l'export d'une position perdue par le robot | des clics simulés dans les tests ; une manche jouée et rejouée par Sami |
| **J5** | les mesures : R0 à R5 par paires | fait : R1 bat R0 (52,1 %) ; R3 contre R3 tient 5,5 coups |
| **J6** | la première recherche, contre la meilleure règle ; Sami joue contre elle | S bat R3 (59,8 %) et R0 (64,0 %) à 8 tirages et avec le choix du service (52,9 %) ; ni 16 tirages, ni 4 fois le budget ne la battent ; Sami a joué contre elle. Reste 0 collection par décision, pas tenu |
| **J7** | l'autojeu : le panel, la ligue, la lecture d'effet si besoin (§ 8) | une variante adoptée bat sa version, sur des graines neuves ; le panel est lu à côté |
| **J8** | la manette, si elle sert encore | une manette simulée dans les tests |

**La découpe du code, à J1 et J3**, pour tenir le budget de lint (40 lignes par fonction, 220 par fichier) : `src/ball/`
(`constants`, `coefficients`, `flight`, `table`), `src/launch.js`, `src/recording.js`, `src/racket.js`, `src/aim.js`, `src/player.js`, `src/forecast.js`, `src/rally.js`,
`src/rally-recording.js`, `src/rules/`, `src/mouse.js`, `src/game.js`, `src/pairs.js`, `src/duel-stats.js`, `scripts/duel.js`, `scripts/duels.js`, `scripts/positions.js`.

## 12. Ce qui est laissé de côté, et les risques

**Mis de côté, avec ce qui les ferait revenir :**

| Quoi | Ce qui le ferait revenir |
|---|---|
| Les corrections résiduelles de la table (Conti : −14 à −30 % d'erreur) | un écart au test de référence |
| Le réseau de neurones de la raquette | jamais à ce stade : il demande leurs données. C'est la limite principale du réalisme |
| L'effet qui décroît en vol | un coefficient de couple publié et lu |
| Le bord de table, le filet qui laisse passer | une réponse à Q-P15 |
| Les picots, l'anti-top | Q-P14 ; le chiffre est déjà là pour l'anti-top |
| Le geste, le bras | rien de prévu : on cherche le coup, pas le geste |
| Le double, le tennis, le badminton | après J7 |

**Les risques, du plus au moins sérieux :**

1. **La dispersion décide de tout, et elle est inventée.** Un même code peut donner un jeu où le placement ne vaut rien, ou un
   jeu où tout se joue au service. R1 et la calibration le verront, mais seul un entraîneur le dira. C'est la première question
   de la liste.
2. **La raquette sans geste peut rendre le jeu trop facile.** Le bon coup demande alors seulement d'être à temps. La préparation
   et sa dispersion ×2 sont là pour ça, sans preuve qu'elles suffisent.
3. **La visée peut coûter cher ou échouer** (près du filet, avec de forts effets). Elle est au cœur de toutes les règles et de
   tous les plans. Le banc de J3 : `chiffres.md`, § 8.
4. **R0 contre R0 s'arrête souvent à sa limite** (60 % des échanges), R1 contre R0 encore à 46 %. C'est crédible pour des joueurs qui ne font que renvoyer sans attaquer, mais ces deux mesures y perdent de leur force. R3 n'a plus ce problème.
   **Le service avantage trop le serveur** dans R3 contre R3 (62 %), sans dispersion ni effet : à revoir avant de croire le jeu au service.
5. **Une règle à plat peut être imbattable** si le modèle ne punit rien : c'est le doute de Sami sur MCTS. Dans ce cas, le
   résultat honnête du projet est : « la règle R2 suffit dans ce modèle ».
6. **L'autojeu peut tourner en rond ou exploiter le modèle.** Le panel figé et Sami servent de garde-fous (§ 8), sans garantie :
   un gain ne se lit jamais hors du modèle.
