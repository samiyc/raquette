# Moins de bras, jouer en place, et ce que l'autojeu en fait

La suite des mesures de `chiffres.md`, § 8, à partir du 4/11/2026.

## Ce que Sami a demandé (4/11/2026)

Après des manches de robots dans la page (U 58-37 S-mU, V 18-56 S-mV, T 11-32 S-mV, S-mU 28-31 S-mV, S-mT 41-41 S-mV) : « des échanges court, beacoup de top-spin, pas très beau » ; « mon bot préféré en terme de jeu/style c'est S-mV ».

- **Le bras** : « on couvre trop facilement toute la table sans déplacemnet », −10 %. Pour compenser : le temps de réaction, ou le placement des robots.
- **Le latéral** : son maximum, +10 %.
- **Se placer après la frappe**, le coup le plus simple étant le croisé : à gauche, si je vise le coup droit adverse, je pars en avance vers le milieu-droite ; si je vise son revers, je peux rester.
- **La précision** moins bonne en mouvement rapide qu'à l'arrêt, à ajuster : le robot doit se placer avant de frapper au lieu de courir après chaque balle.
- **Attendre le bon moment** : les bons joueurs attendent pour frapper, et s'ils attaquent, ils doivent gagner le point.
- **Plus de jeu défensif et coupé** : le strawberry et le chop-block.

## Ce qu'en disent les sources

Rien de chiffré, seulement des entraîneurs et des forums (**L**, résumés lus) :

- **Se replacer.** « If you play crosscourt you can play and stay, if you play down the line you should move away » : un croisé permet de rester, une ligne droite oblige à bouger [[recovery]]. C'est exactement l'exemple de Sami. Le même entraîneur appelle position de replacement celle qui atteint toute balle possible avec le moins de déplacement. Un autre déconseille de revenir à un point fixe [[ready]].
- **Le chop-block** est un bloc au même angle, avec un mouvement vers le bas ; risqué contre un gros top, qui remonte sur le revêtement, et surtout joué avec des picots longs, qui ralentissent la balle [[chopblock]] [[shouldchop]].
- **Le strawberry** est un flip de revers : le poignet contourne la balle par le côté opposé à la banane, pour l'effet latéral inverse, avec du lift. Il est moins puissant et moins sûr que la banane [[strawberry]]. Un entraîneur compare son geste à celui du chop-block, avec plus de vitesse vers l'avant [[vs]]. **Les forums lus en font un coup offensif sur balle courte, pas un coup défensif ou coupé** : à revoir avec Sami (Q-P24).

| Clé | Source |
|---|---|
| [[recovery]] | PingSkills, forum, *recovery after a shot and ball placement*, https://www.pingskills.com/table-tennis-forum/recovery-after-a-shot-and-ball-placement |
| [[ready]] | PingSkills, *Stop Coming Back to Ready Position*, extrait, https://www.pingskills.com/tutorials/improving-your-strokes/stop-coming-back-to-ready-position-do-this-instead |
| [[chopblock]] | PingSkills, forum, *Straight chop block against topspin*, https://pingskills.com/table-tennis-forum/straight-chop-block-against-topspin |
| [[shouldchop]] | PingSkills, forum, *Should I play the chop block?*, https://www.pingskills.com/table-tennis-forum/should-i-play-the-chop-block |
| [[strawberry]] | PingSkills, forum, *Banana and Strawberry Flick*, https://pingskills.com/table-tennis-forum/banana-and-strawberry-flick |
| [[vs]] | PingSkills, forum, *Strawberry Flick vs Chop Block*, https://pingskills.com/table-tennis-forum/strawberry-flick-vs-chop-block |

## Ce qui change dans le modèle (0.21.0)

| Quoi | Avant | Après | Statut |
|---|---:|---:|---|
| Portée du bras | 0,80 m | 0,72 m | Sami |
| Sans étirement jusqu'à | 0,50 m | 0,45 m | H : la même part du bras |
| Réaction | 0,20 s | 0,16 s | H, Q-P4 |
| Coût de la course | +1 tous les 4 m/s | +1 tous les 3 m/s, ×1,67 à 3 m/s | H, Q-P23 |
| Latéral à la souris | brossage 5, 55 tr/s | brossage 5,5, 61 tr/s sur une balle sans effet | Sami |
| Service latéral | 55 tr/s | 60,5 tr/s, sous les 62,5 mesurés (`chiffres.md`, § 5) | Sami |
| Brossage de côté de la recherche | ±8 | ±8,8 | Sami |

**Nouveau pour un robot.** Le serveur revient dès son service. Il restait planté jusqu'à la fin de sa réaction, à 50 cm au plus du milieu : le premier retour avait la table ouverte, mesure déjà notée (T contre R3 finit au premier retour 36,7 % des fois contre 17,4 % depuis le milieu, `chiffres.md`, § 8).

`cover` (Q-P25) : après la frappe, le corps vise, en largeur, −`cover` fois la cible. Le croisé revient de l'autre côté de la balle envoyée. `ready` : les secondes d'avance à l'arrivée sous la balle, en dessous desquelles on n'attaque pas ; le coup est alors `soft…` (vitesse, brossage, profondeur, largeur, hauteur de prise). R3, T, U et V gardent leur jeu : `cover` 0, `ready` −1.

**Deux coups de plus** (Q-P24, H). Ce qu'ils renvoient, visés à 1 m du filet et 40 cm de l'axe :

| Coup | Balle reçue | Raquette | Vitesse de sortie | Effet |
|---|---|---:|---:|---|
| Bloc coupé, 5 m/s, brossage −5 | top à 9 m/s | 6,3 m/s | 6,5 m/s | 30 tr/s de coupé |
| | top à 12 m/s | 5,0 m/s | 7,1 m/s | 11 tr/s de lift : le gros top l'emporte |
| | lente sans effet | 6,3 m/s | 6,9 m/s | 58 tr/s de coupé |
| Strawberry, 5 m/s, +2, −4,5 de côté | coupée courte | 4,3 m/s | 5,6 m/s | 44 tr/s de côté, 9 de coupé |
| | lente sans effet | 5,0 m/s | 6,0 m/s | 43 tr/s de côté |

Le geste du strawberry coûte ×1,49 de dispersion, avec le poids du brossage de côté, contre ×2,21 pour le latéral.

## Les premiers repères

Hors file, 300 échanges par case, dans un créneau, pour choisir les valeurs à mesurer : ce ne sont pas des résultats. V garde `cover` 0,3.

| Bras / réaction | R3 contre R3 : coups, balles non atteintes | V contre V : coups, balles non atteintes | V contre R3 : part, coups |
|---|---:|---:|---:|
| 0,80 m / 0,20 s | 6,6, 15 | 3,8, 111 | 84,0 %, 5,2 |
| 0,72 m / 0,20 s | 6,3, 41 | 2,9, 146 | 87,0 %, 4,7 |
| 0,72 m / 0,18 s | 6,6, 37 | 3,0, 152 | 85,0 %, 5,9 |
| 0,72 m / 0,16 s, retenu | 6,7, 22 | 3,2, 131 | 83,7 %, 6,1 |
| 0,72 m / 0,12 s | 6,7, 17 | 3,7, 117 | 80,3 %, 7,2 |

Il faudrait 0,12 s pour tout rattraper ; 0,16 s en rattrape une bonne partie et laisse le bras plus court se sentir. Les autres coûts de course sur les duels de référence : top contre bloc à 11,2 coups (+1 tous les 4 m/s), 10,6 (3), 9,9 (2,5), 8,2 (seuil 0,75, 2) ; le test tient entre 10 et 25.

## Les lignées sur le bras court (4/11/2026)

Trois lignées de 100 générations, le 4/11 au soir, sur le corps 0.21.0, panel R0, R1, R3, U, V. Toutes partent de `cover` 0,3 ; `p` et `r` d'un coup sûr coupé, `q` d'un coup sûr en petit top.

| Lignée | Départ | Versions | `cover` | `ready` | Top | Coup sûr |
|---|---|---:|---:|---:|---|---|
| `p`, gardée : W | V | 21 | 0,06 | −0,12 | 4,9 m/s, brossage 9,9 | 5,8 m/s, brossage −3,9 |
| `q`, gardée : X | V | 57 | 0,33 | +0,03 | 3 m/s, brossage 14,3 | 2 m/s, brossage 2 |
| `r` | R3 | 0 | 0,3 | 0 | 10 m/s, brossage 10 | 5 m/s, brossage −5 |

- **`r` n'a rien adopté, et cela ne dit rien de ses nombres.** Une variante doit faire 50 % contre chaque robot du panel, et V la bat à 77 %. Ce plancher bloque tout départ de R3 : à revoir.
- **X bute sur deux bornes** : `topSpeed` à 3 m/s et `softSpeed` à 2 m/s, les plus bas permis. Son jeu très lent peut être un défaut du modèle plutôt qu'un style.
- **`cover` ne s'impose pas** : W l'a presque abandonné. La fonction d'autojeu ne compte que les points.

Le contrôle final de chaque lignée, un échange à la limite comptant pour moitié (2 000 graines, 600 contre les recherches) :

| Part de la lignée | R0 | R1 | R3 | U | V | S | S-mV |
|---|---:|---:|---:|---:|---:|---:|---:|
| W | 96,0 % | 94,6 % | 82,6 % | 82,3 % | 57,3 % | 80,9 % | 72,3 % |
| X | 90,5 % | 76,0 % | 73,9 % | 61,4 % | 60,7 % | 72,6 % | 66,5 % |
| `r` | 70,8 % | 78,5 % | 55,6 % | 45,2 % | 23,0 % | 60,7 % | 46,2 % |

### Les duels

1 200 graines, le service au choix ; intervalle à 95 % entre parenthèses.

| Duel, corps 0.21.0 | Part du premier | Coups | À la limite |
|---|---:|---:|---:|
| V / R3 | 81,8 % (80,3 à 83,3) | 6,1 | 0 % |
| V / U | 65,8 % (64,1 à 67,6) | 16,4 | 7,0 % |
| S-mV / S | 46,9 % (45,0 à 48,8) | 3,9 | 0 % |
| S-mV / R3 | 58,7 % (56,8 à 60,7) | 4,9 | 0 % |
| S-mV / V | 62,7 % (61,1 à 64,3) | 2,5 | 0 % |
| W / X | 48,4 % (46,8 à 50,1) | 30,4 | 34,8 % |
| S-mW / S-mV | 60,5 % (58,6 à 62,4) | 6,3 | 0,1 % |
| S-mW / S | 71,6 % (69,8 à 73,4) | 9,7 | 0,1 % |
| S-mW / W | 48,6 % (46,8 à 50,4) | 25,4 | 19,1 % |
| S-mX / S-mV | 55,8 % (54,0 à 57,5) | 4,6 | 0 % |
| S-mX / S | 56,4 % (54,6 à 58,2) | 5,1 | 0 % |
| S-mX / X | 62,9 % (61,2 à 64,5) | 6,2 | 0,2 % |

S-mV a reculé sur le bras court : il battait S à 54,5 % (`chiffres.md`, § 8), il passe sous lui. S-mW prend sa place. S-mX, nettement moins fort, reste hors du menu.

### Le style

2 000 échanges par paire pour les règles, 300 pour les recherches, le service tiré au hasard : des repères de style, pas des parts à citer. Les « tops » sont le top de la règle ; pour une recherche, tout brossage au-dessus de 4 (`coupé` : sous −3).

| Paire | Coups | 1 ou 2 coups | 9 coups et plus | À la limite | Tops du premier |
|---|---:|---:|---:|---:|---:|
| V / V | 2,6 | 54 % | 0 % | 0 % | 97 % |
| S-mV / S-mV | 2,6 | 59 % | 1 % | 0 % | 84 % |
| R3 / R3 | 6,4 | 12 % | 21 % | 0 % | 53 % |
| W / W | 40,8 | 8 % | 85 % | 48 % | 56 % (44 % de coupés) |
| X / X | 30,4 | 26 % | 67 % | 32 % | 48 % |
| S-mW / S-mW | 19,8 | 18 % | 62 % | 8 % | 59 % (35 % de coupés) |
| S-mW / S-mV | 6,8 | 33 % | 26 % | 0 % | 46 % (47 % de coupés) |

**Le duel de tops est fini, mais le défaut s'est retourné.** On passe de 2,6 coups à 20 ou 40, pour 4 à 5 chez l'élite (`chiffres.md`, § 6). Le corps ne court presque plus (coût de la course ×1,02 pour W contre W, ×1,19 pour V contre V) et les raquettes vont à 5 ou 6 m/s. Sami voulait qu'un attaquant gagne le point ; ici personne n'attaque vraiment.

**Ce qui manque, à mesurer** : une règle n'a qu'une seule vitesse de top. Un coup décisif sur balle lente et haute, quand le corps est en place, donnerait une raison de ne pas jouer lent. C'est une hypothèse, rien n'est encore mesuré.

## Le coup décisif (4/11/2026)

Sami : si un joueur attaque, il doit gagner le point. Sur une balle plus lente que `killSlow` et plus haute que `killHigh`, corps en place (`killReady`), la règle frappe `killSpeed`, `killBrush`, à `killWide` du milieu. À `killSlow` 0, le coup n'existe pas : R3, T, U, V, W et X jouent comme avant.

**La règle d'adoption change aussi** (Sami, 4/11/2026) : une variante n'a plus qu'à battre sa version. Le panel, R0, R1, R3, U, V, W, X, est lu à chaque version gardée et à la fin. Le risque connu : une lignée peut tourner en rond, ce que seule cette lecture montrera.

### Ce que devient ce coup

W avec le coup décisif (`killSlow` 8) contre W, 300 échanges par ligne, dans la file. Pour choisir d'où partir : pas des résultats.

| Demandé : vitesse, brossage | Hauteur mini | Vitesse gardée par la visée | Arrivée au contact (médiane) | Rendus | Gagnants | Fautes | Points K / W / limite | Coups |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 14, 4 | 0,25 | 7,7 | 4,7 | 88,9 % | 0,1 % | 11,0 % | 68 / 154 / 78 | 31,3 |
| 14, 8 | 0,25 | 7,7 | 6,6 | 90,7 % | 0,4 % | 8,9 % | 92 / 154 / 54 | 29,0 |
| 14, 12 | 0,25 | 7,7 | 7,7 | 74,8 % | 3,5 % | 21,7 % | 105 / 191 / 4 | 15,4 |
| 16, 12 | 0,25 | 8,8 | 8,2 | 65,7 % | 6,1 % | 28,1 % | 126 / 174 / 0 | 12,8 |
| 14, 14 | 0,25 | 11,9 | 9,3 | 51,8 % | 4,6 % | 43,6 % | 98 / 202 / 0 | 10,8 |

- **Une balle basse ne se frappe pas fort sans brossage.** La visée cherche une vitesse qui retombe sur la table, de la vitesse demandée vers le bas : 14 m/s demandés en gardent 7,7. C'est de la physique, pas une faute du modèle : il faut du lift pour garder la balle sur la table.
- **Les échanges lents sont aussi bas.** À 25 cm, W trouve 3 balles par échange ; à 45 cm, 5 balles sur 300 échanges. Une frappe à plat sur balle haute n'existe presque pas dans ce jeu.
- **Rien ne gêne celui qui reçoit.** Tout arrive sous 10 m/s, le seuil de Q-P21, et la réaction de 0,16 s laisse le temps de se préparer : le coût de la balle reste à ×1,00 ou ×1,10, celui du manque de temps à ×1,00.
- **Le coup raccourcit les échanges, mais il perd contre W** dans chaque ligne. Les fautes coûtent plus que ce qu'il gagne.

### Les lignées s, t, u (4/11/2026)

100 générations, le coup décisif allumé au départ (`killSlow` 8, `killSpeed` 16, `killBrush` 12, `killHigh` 0,25), une variante n'ayant que sa version à battre. Final de chaque lignée : 2 000 graines neuves contre les règles, 600 contre les recherches.

| Lignée | Départ | Versions | R0 | R1 | R3 | U | V | W | X | S | S-mV | S-mW |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `s` | W | 22 | 95,7 | 91,6 | 77,3 | 68,9 | 68,4 | 44,0 | 49,3 | 77,7 | 70,5 | 48,8 |
| `t` | X | 26 | 74,2 | 78,7 | 78,2 | 61,4 | 59,9 | 54,1 | 50,2 | 78,0 | 66,4 | 57,5 |
| `u` | R3 | 12 | 66,6 | 73,4 | 70,1 | 58,3 | 43,9 | 34,3 | 28,1 | 71,7 | 62,2 | 44,4 |

Fourchettes : `t` contre W 52,7-55,6, contre X 48,8-51,5, contre S-mW 54,6-60,4.

Le style, contre soi-même, 1 000 échanges :

| Lignée | Coups | À la limite | Part de décisifs | Décisifs qui finissent l'échange : gagnés / ratés | `killReady` gardé | Frappe moyenne |
|---|---:|---:|---:|---:|---:|---:|
| `s` | 26,0 | 12,2 % | 10 % | 15 / 199 | 0,08 s | 5,1 m/s |
| `t` | 10,5 | 0,9 % | 6 à 7 % | 105 / 101 | 0,26 s | 3,4 m/s |
| `u` | 19,8 | 5,8 % | 15 % | 30 / 229 | 0 s | 8,8 m/s |

Pour comparer : W contre W 40,8 coups, 48 % à la limite ; X contre X 30,4 coups, 32 % à la limite.

- **Le coup survit dans les trois lignées** : `killSlow` reste entre 7 et 8,2, `killSpeed` descend de 16 vers 12,7 à 14,3, `killBrush` vers 10 à 11.
- **`t` a appris à attendre** : elle ne joue le coup qu'avec 0,26 s d'avance, et c'est la seule où il gagne autant qu'il perd. C'est ce que demandait Sami (attendre le bon moment), trouvé sans lui être imposé. Le coup ne gagne pas encore le point : environ 680 décisifs pour 206 fins d'échange, donc 15 % de gagnants et 15 % de fautes, le reste est rendu.
- **Les longueurs de `t` restent en deux paquets** : 35 % d'échanges de 1 à 2 coups, 43 % de 9 et plus.
- **`u` montre que la règle d'adoption débloque R3** : de 48 à 70 % contre R3, là où la lignée `r` n'avançait pas. Elle reste loin de V, W et X.
- **`s` n'a pas rattrapé W** : 50,6 % au mieux à la lecture du panel, 44,0 % au final. Le coup allumé la faisait partir sous W, et 22 versions n'ont pas suffi.

**Une lignée s'éloigne de son meilleur niveau.** Lecture du panel de `t`, 600 graines :

| Version | R3 | U | V | W | X |
|---:|---:|---:|---:|---:|---:|
| 9 | 75,8 | 59,2 | 78,2 | 56,3 | 45,5 |
| 16 | 82,9 | 63,1 | 51,2 | 56,9 | 51,0 |
| 19 | 87,4 | 75,2 | 75,0 | 62,7 | 48,4 |
| 22 | 80,2 | 70,1 | 59,7 | 52,0 | 40,7 |
| 26 | 78,0 | 61,7 | 61,2 | 53,3 | 52,5 |

Chaque version bat la précédente, mais la 26 est sous la 19 contre tout, sauf X. C'est le risque annoncé quand le panel a cessé de décider. L'historique ne gardait que les derniers nombres : `scripts/selfplay.js` garde maintenant ceux de chaque version. La lignée `A3` a les mêmes graines que `t` (même somme de caractères) et s'arrête à la version 19.

### Le seuil `easyBall` : on n'y touche pas

Toutes les règles et les duels sous chaque réglage du seuil, 600 échanges (1 000 pour le duel), coups par échange :

| `easyBall`, `controlLoss` | Top contre bloc | W/W | X/X | V/V | U/U | R3/R3 | W/R3 | V/U |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 10 ; 2,5 (aujourd'hui) | 10,6 | 41,3 | 29,6 | 2,7 | 10,7 | 6,4 | 11,6 | 16,6 |
| 8 ; 2,5 | 8,3 | 34,3 | 25,3 | 2,6 | 10,6 | 6,0 | 10,2 | 11,7 |
| 7 ; 2,5 | 6,4 | 28,0 | 18,6 | 2,5 | 10,1 | 5,6 | 8,9 | 7,5 |
| 6 ; 2,5 | 4,9 | 19,5 | 14,0 | 2,4 | 8,6 | 5,3 | 7,2 | 5,6 |
| 5 ; 2,5 | 4,2 | 12,6 | 10,1 | 2,3 | 6,7 | 5,0 | 5,8 | 4,9 |
| 8 ; 1,5 | 7,6 | 31,5 | 21,3 | 2,5 | 10,7 | 5,8 | 9,3 | 10,3 |
| 6 ; 1,5 | 4,1 | 13,9 | 9,6 | 2,3 | 7,8 | 5,1 | 6,0 | 4,8 |
| 5 ; 1,5 | 3,5 | 8,1 | 6,6 | 2,2 | 6,1 | 4,7 | 4,6 | 4,1 |

Baisser le seuil raccourcit bien les échanges, mais le duel top contre bloc est déjà à 10,6 coups pour un minimum de 10 : chaque ligne le fait passer dessous, à 3,5 coups au pire. Comme `t` arrive à 10,5 coups sans toucher au corps, le seuil reste à 10 m/s.

### Y : la lignée `t` à sa version 19 (5/11/2026)

La lignée `A3` rejoue `t` sur les mêmes graines et retrouve ses 19 premières versions à l'identique, lectures du panel comprises. Final, 2 000 graines neuves contre les règles, 600 contre les recherches :

| Contre | R0 | R1 | R3 | U | V | W | X | S | S-mV | S-mW |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| version 19 (Y) | 84,5 | 91,6 | 87,8 | 76,5 | 74,6 | 63,6 | 48,0 | 88,0 | 71,2 | 62,3 |
| version 26 | 74,2 | 78,7 | 78,2 | 61,4 | 59,9 | 54,1 | 50,2 | 78,0 | 66,4 | 57,5 |

Elle devient Y. Duels, 1 200 graines à partir de 8 000 000, service choisi :

| Duel | Part du premier | Fourchette | Coups | À la limite |
|---|---:|---:|---:|---:|
| Y contre X | 48,2 % | 46,5-49,9 | 20,5 | 8,2 % |
| Y contre W | 63,4 % | 61,7-65,1 | 23,0 | 16,5 % |
| S-mY contre S-mW | 53,0 % | 51,0-54,9 | 9,5 | 0,6 % |
| S-mY contre S-mV | 57,9 % | 56,2-59,7 | 4,4 | 0 % |
| S-mY contre S | 57,0 % | 55,2-58,9 | 5,4 | 0 % |
| S-mY contre Y | 45,1 % | 43,2-47,0 | 8,5 | 0,3 % |

Le style, 1 000 échanges (300 pour les recherches) :

| Paire | Coups | Part de décisifs | Décisifs qui finissent l'échange : gagnés / ratés | Ce que joue le premier |
|---|---:|---:|---:|---|
| Y / Y | 16,6 | 1 % | 23 / 43 | doux 57 %, top 42 % |
| Y / X | 20,4 | 5 % | 64 / 150 | doux 54 %, top 41 % |
| Y / W | 22,3 | 11 % | 9 / 55 | top 63 %, doux 25 % |
| Y / V | 8,8 | 0 % | 2 / 0 | doux 77 %, top 23 % |
| Y / R3 | 7,5 | 4 % | 25 / 12 | top 68 %, doux 28 % |
| S-mY / S-mY | 4,9 | — | — | top 51 %, plat 34 %, poussette 9 %, coupé 6 % |
| S-mY / S-mW | 9,3 | — | — | top 49 %, plat 39 %, poussette 8 %, coupé 4 % |

- **Y est plus forte que la version 26, mais joue plus long** : 16,6 coups contre elle-même, 3,5 % à la limite, contre 10,5 et 0,9 %. Elle ne trouve presque pas de balle à finir contre elle-même (1 %).
- **Le coup décisif sert surtout contre W**, qui renvoie lent (11 % des coups), mais il y rate plus qu'il ne gagne. Contre R3, il gagne deux fois sur trois.
- **S-mY joue des échanges d'élite contre elle-même** : 4,9 coups, sans échange à la limite. La recherche n'a pas ce coup à part : son top est celui du duel d'entraînement, et le style ne lui compte aucun décisif.

### Les lignées `v` et `w`, et Z (6/11/2026)

Les deux partent de Y. `v` part de ses nombres, `w` d'un coup décisif plus fort et joué plus tôt. Le panel gagne Y. Final, 2 000 graines neuves contre les règles, 600 contre les recherches :

| Lignée | R0 | R1 | R3 | U | V | W | X | Y | S | S-mV | S-mW | S-mY |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `v`, version 40 | 97,2 | 91,9 | 85,8 | 79,8 | 78,1 | 60,2 | 52,0 | 63,8 | 84,0 | 67,5 | 61,7 | 63,7 |
| `w`, version 29 | 78,6 | 67,2 | 69,0 | 61,9 | 65,5 | 61,6 | 34,6 | 49,1 | 68,8 | 65,0 | 63,5 | 57,1 |

`w` est écartée : elle ne fait que jeu égal avec Y. `v` devient Z. Duels, 1 200 graines à partir de 8 000 000, service choisi :

| Duel | Part du premier | Fourchette | Coups | À la limite |
|---|---:|---:|---:|---:|
| Z contre X | 51,6 % | 50,2-52,9 | 36,1 | 42,9 % |
| Z contre Y | 65,3 % | 63,5-67,1 | 16,5 | 3,1 % |
| Z contre W | 61,7 % | 60,1-63,3 | 29,2 | 28,5 % |
| S-mZ contre S-mY | 40,2 % | 38,5-41,9 | 4,7 | 0 % |
| S-mZ contre S-mW | 41,6 % | 39,6-43,5 | 9,9 | 0,6 % |
| S-mZ contre S | 49,5 % | 47,6-51,3 | 4,8 | 0 % |
| S-mZ contre Z | 25,7 % | 24,0-27,4 | 9,6 | 0 % |

Le style, 1 000 échanges (300 pour les recherches) :

| Paire | Coups | Échanges de 9 coups et plus | Décisifs qui finissent l'échange : gagnés / ratés | Ce que joue le premier |
|---|---:|---:|---:|---|
| Z / Z | 31,6 | 75 % | 7 / 8 | doux 67 %, top 33 % |
| Z / X | 36,2 | 75 % | 5 / 0 | doux 52 %, top 48 % |
| Z / Y | 16,5 | 58 % | 1 / 0 | doux 59 %, top 41 % |
| Z / W | 29,1 | 66 % | 4 / 19 | top 76 %, doux 20 %, décisif 4 % |
| Z / V | 9,3 | 39 % | 0 / 0 | doux 89 %, top 11 % |
| Z / R3 | 9,2 | 35 % | 0 / 0 | top 48 %, doux 52 % |
| S-mZ / S-mZ | 5,8 | 22 % | — | top 79 %, plat 10 %, coupé 6 %, poussette 6 % |
| S-mZ / S-mY | 5,5 | 22 % | — | top 77 %, plat 12 %, poussette 6 %, coupé 5 % |

- **Z gagne à l'usure.** Ses tops partent à 3 m/s et ses coups doux à 2 m/s, les bornes basses de l'autojeu ; elle frappe à 2,3 m/s en moyenne contre elle-même. Elle attend 0,5 s d'avance pour finir, deux fois plus que Y, et ne joue presque plus son coup décisif, sauf contre W, où elle le rate quatre fois sur cinq.
- **L'usure est payée par la mesure.** Un échange à la limite compte un demi-point à chacun : celui qui ne sait pas gagner l'échange a intérêt à le faire durer. Contre X, 43 % des échanges vont à la limite ; sur ceux qui finissent, Z en gagne 52,8 %.
- **Z est un mauvais modèle pour la recherche.** S-mZ perd contre S-mY et S-mW, et ne prend que 25,7 % des points à Z, son propre modèle. Elle n'entre ni dans les menus ni dans le contrôle final.
