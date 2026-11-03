# Les questions

Pour Sami, puis pour un professionnel du métier. Chacune porte une recommandation : sans réponse, c'est ce que le modèle
fera. Une réponse quitte cette liste et va, avec sa date, dans [`chiffres.md`](chiffres.md) ou dans le modèle.

## Pour Sami (posées le 2/11/2026)

Q-S3 attend J5 ; Q-S7 attend J4.

**Répondu le 3/11/2026** (Sami, en regardant la page) : le bandeau de profil reste, on y voit bien la trajectoire (Q-S5). Un bon joueur
de club, avec un profil modifiable (Q-S1). La recherche doit battre la meilleure règle simple, pas seulement le centre (Q-S2).
Un service stylisé jusqu'à J5 (Q-S6). Il ajoute le coupé à deux rebonds, le tchop, la poussette et le bloc, ainsi que deux duels d'entraînement : `../modele.md`, § 6.

**Répondu le 2/11/2026** (Sami, voir `../modele.md`, § 4, § 10 et § 11) : Q-S4 tombe. La souris vient d'abord, avant les
mesures : clic gauche pour se déplacer, clic droit pour viser, au pas à pas. Le secteur fait 220°, axe fixe vers le filet. La
dispersion est celle du robot, avec un curseur. La manette passe à J8, si elle sert encore.

| # | La question | La recommandation | Pourquoi |
|---|---|---|---|
| **Q-S3** | **Quel plus petit gain vaut qu'on l'adopte ?** | **52 % des points**, soit 57,7 % des manches et 66,5 % des matchs. | Environ 2 400 échanges pour ±2 points. Moins, cela coûte plus de fils pour un gain qui ne se verrait pas à la manette. |
| **Q-S7** | **Qui interroger ?** Connais-tu un entraîneur de club ? | **Un entraîneur et un joueur classé**, 30 minutes, avec les questions ci-dessous, en commençant par Q-P1 à Q-P3. Pas avant J4 : on lui montrera la page. | Il pourra regarder un échange et dire « ça ne se joue pas comme ça », ce qui vaut mieux qu'un chiffre isolé. |

**Ce que j'ai décidé sans te le demander**, à défaire si tu n'es pas d'accord :

- la physique de Sony AI, sans leurs corrections résiduelles ni leur réseau de neurones (`modele.md`, § 3 et § 12) ;
- RK2 à 240 Hz ;
- la réécriture plutôt que la copie depuis `mcts-codingame` (§ 9) ;
- l'échange plutôt que la manche comme unité de mesure (§ 7) ;
- une raquette sans bras (§ 4).

## Pour un professionnel

**Qui :** **E**, un entraîneur de club ; **J**, un joueur classé ; **H**, quelqu'un qui connaît le haut niveau ou un
préparateur physique. Pas de donnée nominative. Modèle fictif : on ne cherche pas à entraîner quelqu'un.

**La recommandation** de chaque ligne est la valeur que garde le modèle sans réponse. « Pèse sur » dit ce qui change.

### La frappe : ce qui fait rater (à poser d'abord)

| # | Question | Qui | La recommandation | Pèse sur |
|---|---|---|---|---|
| **Q-P1** | Un bon joueur de club vise un coin de la table avec un coup droit tranquille. À quelle distance de la cible tombent ses balles, le plus souvent ? Combien de ses balles vont au filet ? | E, J | **3° sur l'orientation et 6 % sur la vitesse** : environ 16 cm en médiane sur une balle facile, et 13 % au filet sur une balle prise bas (calculés à J3). | Tout : la longueur des échanges, la valeur du placement. Si on ne répond qu'à une question, celle-là. |
| **Q-P2** | Qu'est-ce qui dégrade la frappe le plus : frapper plus fort, jouer avec plus d'effet, ou manquer de temps ? De combien ? | E, J | **Le temps avant tout : ×2 sans préparation.** Force et effet n'ajoutent rien au départ. | R2, et ce qui rapporte à forcer l'adversaire à courir. |
| **Q-P3** | Sur 100 balles faciles en échange, combien un bon joueur de club en rate-t-il ? Et sur des balles difficiles ? | E, J | **Pas de chiffre fixé** : la dispersion est calibrée sur 4 à 5 coups par échange. | La calibration. Un chiffre servirait de vérification. |

### Le temps et le déplacement

| # | Question | Qui | La recommandation | Pèse sur |
|---|---|---|---|---|
| **Q-P4** | Combien de temps après la frappe adverse le joueur commence-t-il à bouger ? Voit-il la direction avant le contact ? | E, H | **0,20 s**, sans anticipation. | La couverture de la table, l'intérêt de varier. |
| **Q-P5** | À quelle vitesse se déplace-t-on sur le côté ? Quelle portée utile a-t-on sans bouger les pieds ? Un champ de 220° face au filet est-il juste, ou le corps pivote-t-il assez pour qu'il faille en tenir compte ? Quelle hauteur atteint-on sans se déplacer ? | E, H | **3 m/s, 8 m/s² ; portée 0,8 m, 220° face au filet (Sami) ; du plateau −0,5 m au plateau +1,2 m.** | La valeur des angles, les balles passées derrière le joueur. |
| **Q-P6** | Combien de temps faut-il pour préparer un coup correct ? Quel coup reste possible avec moins ? | E, J | **0,15 s ; en dessous, la dispersion double.** | Le rythme, le jeu près de la table. |
| **Q-P19** | Jusqu'où se penche-t-on au-dessus de la table pour une balle courte ? Quelle balle courte reste vraiment injouable ? À quelle distance de la table le coupé à deux rebonds devient-il fatal ? | E, J | **Le corps avance de 0,4 m au-dessus de la table**, ce qui laisse 17 cm hors d'atteinte après le filet ; fatal à partir de 1,6 à 2,4 m derrière la ligne (calculé). | R5, et une faille que l'autojeu trouverait : une zone courte où toute balle gagne. |
| **Q-P20** | Combien de coups tient un duel top contre bloc à ce niveau, et une série de poussettes ? Qui rate le plus souvent ? De combien passe-t-on le filet ? Quelle vitesse et quel effet a un bloc, une poussette ? Prend-on le bloc en montée ? | E, J | **Top contre bloc de 10 à 25 coups, le top rate le plus ; poussettes plus longues ; 15 cm au-dessus du filet ; bloc à 20 cm en montée.** Le modèle donne 16 et 36 coups, un bloc à 7,7 m/s et 36 tr/s de lift, une poussette à 5,2 m/s et 39 tr/s de coupé. | La dispersion, donc tout : ces duels la fixent. |
| **Q-P21** | À partir de quelle vitesse d'arrivée perd-on le contrôle ? Que peut-on encore faire d'un smash pris en fond de table ? Peut-on y répondre court ou en poussette ? Combien de précision perd-on en s'éloignant de la table ? | E, J | **Plein contrôle jusqu'à 10 m/s au contact, une fois plus de dispersion tous les 2,5 m/s ; pas de poussette ni de coup court au-delà de 8 m/s** (Sami : pas de balle très courte et contrôlée sur un smash). Sur un smash parti à 25 m/s : 48 % de balles plates valides, 59 % de blocs, contre 90 et 97 % sans cela. | Le contre, le bloc, et ce que la recherche a le droit d'essayer. |
| **Q-P12** | Où attend-on la balle : au centre, décalé côté revers ? À quelle distance de la table ? Le choix coup droit ou revers change-t-il quelque chose à modéliser ? | E, J | **Au centre, à 0,5 m de la ligne, et pas de côté préféré.** | R0 et le coude : sans côté, le « coude » n'existe pas dans le modèle. |

### La raquette et l'effet

| # | Question | Qui | La recommandation | Pèse sur |
|---|---|---|---|---|
| **Q-P7** | Quelle vitesse de raquette pour un bloc, un contre, un top, une frappe, à ce niveau ? Et quelle vitesse de balle pour un coup d'échange tranquille ? | E, H | **Jusqu'à 20 m/s**, et une balle à 6,5 m/s pour R0. | Les limites de `aim`, R0. |
| **Q-P8** | Quelle vitesse et quel effet joue un bon joueur de club ? Les chiffres publiés (117 tr/s, 23 m/s, de jeunes joueurs confirmés) sont-ils loin de lui ? | E, H | **Pas de borne de niveau**, seulement les bornes physiques (35 m/s, 1 000 rad/s) et la limite de raquette. | Le réalisme de R3 et de la recherche. |
| **Q-P9** | Lit-on bien l'effet adverse ? Quelle part des fautes vient d'un effet mal lu, à ce niveau ? | E, J | **Lecture parfaite au départ** ; si la réponse est « une grande part », on ajoute une erreur de lecture, et le jeu devient à information cachée. | **Le rôle de l'ISMCTS.** C'est la question qui décide si MCTS a sa place ici. |
| **Q-P14** | Les picots et l'anti-top changent-ils le jeu d'un duel de club au point de les modéliser ? | E | **Non pour l'instant**, un backside offensif des deux côtés. | Le périmètre. |

### Le service et la tactique

| # | Question | Qui | La recommandation | Pèse sur |
|---|---|---|---|---|
| **Q-P10** | Quels services joue-t-on à ce niveau (court ou long, effets, vitesse) ? Quels effets et quelles vitesses ont un pendule, un marteau, un mou, une bombe, un latéral ? Combien de points se jouent dessus et sur la 3e balle ? | E, J | **Pendule : 6 m/s, coupé 30 et latéral 40 tr/s. Marteau : 5 m/s, coupé 20 et latéral −50. Mou : 4 m/s, coupé 10. Coupé : 5 m/s, coupé 55. Bombe : 11 m/s, lift 10, contact bas. Latéral : 7 m/s, latéral 55.** Dispersion : 0,5° et 2 %. Djokic en vérification, à un autre niveau. | Après J4, la recherche sur le service. |
| **Q-P11** | Quelle est la règle simple qu'on enseigne d'abord pour placer sa balle ? Viser le centre, est-ce réaliste, ou déjà une erreur ? | E | **R0 au centre, R1 loin de l'adversaire**, et les autres à la suite. Avis attendu sur le coude. | L'échelle des règles à battre. |
| **Q-P13** | Combien de coups et de secondes dure un échange à ce niveau ? Pourquoi les sources disent-elles 3,3 s et 9,15 s ? | E, H | **4 à 5 coups ; la durée n'est pas une cible.** | La calibration. |
| **Q-P15** | À quel point faut-il simuler le filet (balle qui passe après l'avoir touché) et le bord de table ? La chaleur, l'humidité, l'altitude comptent-elles dans un gymnase ? | E, J | **Pas de bord, et une balle qui touche le filet s'arrête** ; ρ = 1,2 en toutes circonstances. | Quelques points par manche. |
| **Q-P16** | Relire le [glossaire](glossaire.md) : les mots d'usage sont-ils les bons, ou faut-il ceux de la FFTT ? | E | **Les mots du glossaire**, faute de mieux. | Les docs et la page. |

### À regarder ensemble (à partir de J4)

| # | Question | Qui | La recommandation | Pèse sur |
|---|---|---|---|---|
| **Q-P17** | En regardant quelques échanges sur la page : qu'est-ce qui ne ressemble pas à du ping-pong ? | E, J | Une séance de 30 minutes, la page au ralenti. | Tout le modèle, et mieux qu'un chiffre : une balle trop sage, un joueur qui couvre trop, un effet trop fort. |
| **Q-P18** | Le robot joue-t-il d'une façon qu'on reconnaît, ou exploite-t-il un défaut de la simulation ? | E, J | Après J6, puis après J7 : l'autojeu cherchera ces défauts. | La confiance dans la mesure de la recherche. |
