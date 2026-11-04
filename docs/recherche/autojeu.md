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
