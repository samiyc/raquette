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
