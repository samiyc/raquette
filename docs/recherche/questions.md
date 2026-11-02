# Les questions

Pour Sami, puis pour un professionnel du métier. Chacune porte une recommandation : sans réponse, c'est ce que le modèle
fera. Une réponse quitte cette liste et va, avec sa date, dans [`chiffres.md`](chiffres.md) ou dans le modèle.

## Pour Sami (posées le 2/11/2026)

Rien ne bloque J1 (la balle). Q-S5 attend J2 ; Q-S1, Q-S2 et Q-S6 attendent J3 ; Q-S3 attend J4 ; Q-S4 attend J5.

| # | La question | La recommandation | Pourquoi |
|---|---|---|---|
| **Q-S1** | **Quel joueur simule-t-on ?** Un bon joueur de club, un joueur de haut niveau ? As-tu joué en club, à quel niveau ? | **Un bon joueur de club**, avec un profil modifiable. | Il joue à des vitesses où un stick suit encore, et un entraîneur de club peut le juger. Le haut niveau demande des données qu'on n'a pas. Tes réponses valent une première relecture. |
| **Q-S2** | **Quelle barre pour la recherche ?** « Renvoyer au centre » : j'ai lu viser le centre du camp adverse et revenir au centre de son côté. La recherche doit-elle battre cette règle seule, ou la meilleure règle simple ? | **Cette lecture, et la meilleure règle** (R0 à R3, `modele.md`, § 6). | C'est la méthode de la cuisine. Une recherche qui ne bat que le centre ne prouverait rien : viser loin de l'adversaire le bat sans doute déjà. |
| **Q-S3** | **Quel plus petit gain vaut qu'on l'adopte ?** | **52 % des points**, soit 57,7 % des manches et 66,5 % des matchs. | Environ 2 400 échanges pour ±2 points. Moins, cela coûte plus de fils pour un gain qui ne se verrait pas à la manette. |
| **Q-S4** | **La manette : quel modèle, quelle aide, quelle vitesse de jeu ?** | **Le contact automatique à portée**, le stick gauche pour bouger, le droit pour viser, la gâchette pour la force, la croix pour l'effet. **La vitesse réglable, ×0,5 au départ.** Dis-moi juste quelle manette tu as. | Une balle traverse en 0,2 à 0,5 s : à vitesse réelle, viser et frapper au stick semble hors de portée (à essayer). Un contact au bouton pourra venir ensuite comme mode difficile. |
| **Q-S5** | **La vue : le dessus seul, ou avec un bandeau de profil ?** | **Le dessus et un petit bandeau de profil.** Effet : rouge pour le lift, bleu pour le coupé. Hauteur : la taille et l'ombre. | Vu de dessus, on ne voit pas si la balle passe le filet. Le bandeau coûte peu et explique les fautes. |
| **Q-S6** | **Le service : complet ou stylisé au début ?** | **Stylisé** jusqu'à J4 : un contact derrière la ligne, un rebond de chaque côté, sans lancer. Le service choisi par la recherche vient ensuite. | Le lancer n'apporte rien à la balistique. Le service pèse (11,6 % des points gagnés dessus en élite, d'après un extrait), mais il sera mieux à sa place après la première mesure. |
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
| **Q-P1** | Un bon joueur de club vise un coin de la table avec un coup droit tranquille. À quelle distance de la cible tombent ses balles, le plus souvent ? | E, J | **Environ 10 à 15 cm**, soit une dispersion de 3° sur l'orientation et 6 % sur la vitesse. | Tout : la longueur des échanges, la valeur du placement. Si on ne répond qu'à une question, celle-là. |
| **Q-P2** | Qu'est-ce qui dégrade la frappe le plus : frapper plus fort, jouer avec plus d'effet, ou manquer de temps ? De combien ? | E, J | **Le temps avant tout : ×2 sans préparation.** Force et effet n'ajoutent rien au départ. | R2, et ce qui rapporte à forcer l'adversaire à courir. |
| **Q-P3** | Sur 100 balles faciles en échange, combien un bon joueur de club en rate-t-il ? Et sur des balles difficiles ? | E, J | **Pas de chiffre fixé** : la dispersion est calibrée sur 4 à 5 coups par échange. | La calibration. Un chiffre servirait de vérification. |

### Le temps et le déplacement

| # | Question | Qui | La recommandation | Pèse sur |
|---|---|---|---|---|
| **Q-P4** | Combien de temps après la frappe adverse le joueur commence-t-il à bouger ? Voit-il la direction avant le contact ? | E, H | **0,20 s**, sans anticipation. | La couverture de la table, l'intérêt de varier. |
| **Q-P5** | À quelle vitesse se déplace-t-on sur le côté ? Quelle portée utile a-t-on sans bouger les pieds ? | E, H | **3 m/s, 8 m/s² ; portée 0,8 m.** | La valeur des angles. |
| **Q-P6** | Combien de temps faut-il pour préparer un coup correct ? Quel coup reste possible avec moins ? | E, J | **0,15 s ; en dessous, la dispersion double.** | Le rythme, le jeu près de la table. |
| **Q-P12** | Où attend-on la balle : au centre, décalé côté revers ? À quelle distance de la table ? Le choix coup droit ou revers change-t-il quelque chose à modéliser ? | E, J | **Au centre, à 0,5 m de la ligne, et pas de côté préféré.** | R0 et le coude : sans côté, le « coude » n'existe pas dans le modèle. |

### La raquette et l'effet

| # | Question | Qui | La recommandation | Pèse sur |
|---|---|---|---|---|
| **Q-P7** | Quelle vitesse de raquette pour un bloc, un contre, un top, une frappe, à ce niveau ? | E, H | **Jusqu'à 20 m/s**, et la frappe de R0 à 8 m/s. | Les limites de `aim`, R0. |
| **Q-P8** | Quelle vitesse et quel effet joue un bon joueur de club ? Les chiffres publiés (117 tr/s, 23 m/s, de jeunes joueurs confirmés) sont-ils loin de lui ? | E, H | **Pas de borne de niveau**, seulement les bornes physiques (35 m/s, 1 000 rad/s) et la limite de raquette. | Le réalisme de R3 et de la recherche. |
| **Q-P9** | Lit-on bien l'effet adverse ? Quelle part des fautes vient d'un effet mal lu, à ce niveau ? | E, J | **Lecture parfaite au départ** ; si la réponse est « une grande part », on ajoute une erreur de lecture, et le jeu devient à information cachée. | **Le rôle de l'ISMCTS.** C'est la question qui décide si MCTS a sa place ici. |
| **Q-P14** | Les picots et l'anti-top changent-ils le jeu d'un duel de club au point de les modéliser ? | E | **Non pour l'instant**, un backside offensif des deux côtés. | Le périmètre. |

### Le service et la tactique

| # | Question | Qui | La recommandation | Pèse sur |
|---|---|---|---|---|
| **Q-P10** | Quels services joue-t-on à ce niveau (court ou long, effets, vitesse) ? Combien de points se jouent dessus et sur la 3e balle ? | E, J | **Un service stylisé long et au centre pour R0** ; Djokic en vérification à J4, à un autre niveau. | Après J4, la recherche sur le service. |
| **Q-P11** | Quelle est la règle simple qu'on enseigne d'abord pour placer sa balle ? Viser le centre, est-ce réaliste, ou déjà une erreur ? | E | **R0 au centre, R1 loin de l'adversaire**, et les autres à la suite. Avis attendu sur le coude. | L'échelle des règles à battre. |
| **Q-P13** | Combien de coups et de secondes dure un échange à ce niveau ? Pourquoi les sources disent-elles 3,3 s et 9,15 s ? | E, H | **4 à 5 coups ; la durée n'est pas une cible.** | La calibration. |
| **Q-P15** | À quel point faut-il simuler le filet (balle qui passe après l'avoir touché) et le bord de table ? La chaleur, l'humidité, l'altitude comptent-elles dans un gymnase ? | E, J | **Pas de bord, et une balle qui touche le filet s'arrête** ; ρ = 1,2 en toutes circonstances. | Quelques points par manche. |
| **Q-P16** | Relire le [glossaire](glossaire.md) : les mots d'usage sont-ils les bons, ou faut-il ceux de la FFTT ? | E | **Les mots du glossaire**, faute de mieux. | Les docs et la page. |

### À regarder ensemble (à partir de J4)

| # | Question | Qui | La recommandation | Pèse sur |
|---|---|---|---|---|
| **Q-P17** | En regardant quelques échanges sur la page : qu'est-ce qui ne ressemble pas à du ping-pong ? | E, J | Une séance de 30 minutes, la page au ralenti. | Tout le modèle, et mieux qu'un chiffre : une balle trop sage, un joueur qui couvre trop, un effet trop fort. |
| **Q-P18** | Le robot joue-t-il d'une façon qu'on reconnaît, ou exploite-t-il un défaut de la simulation ? | E, J | Après J6. | La confiance dans la mesure de la recherche. |
