# Le glossaire

Les mots du ping-pong et de sa physique, et ce qui leur répond dans le modèle. La dernière colonne donne le nom prévu dans
le code, ou « — » si le mot attend un jalon, ou reste hors du modèle.

**D'où ils viennent.** Les termes du règlement viennent des [Lois][lois]. Ceux de la physique viennent des articles de
[`chiffres.md`](chiffres.md). Les termes du jeu (les coups, le placement) viennent de l'usage courant, sans source lue :
ils attendent la relecture d'un entraîneur (Q-P16). Le code est en anglais ; le nom anglais entre parenthèses aide à lire
les articles.

## La table et le matériel

| Terme | Ce que c'est | Dans le modèle |
|---|---|---|
| **Le plateau**, la surface de jeu (*playing surface*) | 2,74 m × 1,525 m, à 76 cm du sol | `z = 0` ; `TABLE` |
| **Le camp** (*court*) | une moitié du plateau, de part et d'autre du filet | `x > 0`, `x < 0` |
| **La ligne de fond** (*end line*) | le bord de 1,525 m | `x = ±1,37` |
| **La ligne de côté** (*side line*) | le bord de 2,74 m | `y = ±0,7625` |
| **Le filet** (*net*), **l'ensemble du filet** (*net assembly*) | 15,25 cm de haut, avec ses poteaux, 15,25 cm hors des lignes | `x = 0`, `NET` |
| **Le bord** (*edge*) | une balle qui touche l'arête du plateau | — : pas de bord (§ 12 du modèle) |
| **Le bois** (*blade*) | la raquette sans son revêtement | — |
| **Le revêtement** (*rubber*) | la gomme collée sur le bois | le profil de raquette |
| **Backside**, à picots dedans (*inverted*) | le plus courant, lisse et accrocheur, celui des mesures de Sony | le seul au départ |
| **Picots** longs ou courts (*pips*) | une surface à picots en dehors, qui renvoie l'effet autrement | — |
| **Anti-top** (*anti-spin*) | un revêtement glissant, qui absorbe l'effet | — |
| **Le plastique**, **le celluloïd** | les matières de la balle, plastique seul autorisé par la Loi 2.3.3 | le plastique |

## Le règlement

| Terme | Ce que c'est | Dans le modèle |
|---|---|---|
| **L'échange** (*rally*) | le temps où la balle est en jeu | `rally` |
| **Le service** (*service*) | le coup qui ouvre l'échange : lancer, puis un rebond dans chaque camp | un service stylisé d'abord (Q-S6) |
| **Le serveur**, **le receveur** | celui qui frappe en premier, en second | `server`, `receiver` |
| **Le retour**, **la remise** (*return*) | le coup qui renvoie la balle | un coup |
| **Le let** | un échange à remettre, sans point | service touchant le filet, à J3 |
| **Le point** | un échange qui compte | `point`, l'unité des mesures |
| **La manche** (*game*) | 11 points, 2 d'écart | la page |
| **Le match** | un nombre impair de manches | la page |
| **L'obstruction** (*obstruct*) | toucher la balle avant qu'elle ait touché son camp | une fin d'échange |
| **Le temps limite**, le système accéléré (*expedite*) | la règle qui écourte une manche qui traîne | — ; la limite de 60 coups en tient lieu |

## Les coups et l'effet

| Terme | Ce que c'est | Dans le modèle |
|---|---|---|
| **L'effet** (*spin*) | la rotation de la balle | `omega`, 3 nombres |
| **Le lift** (*topspin*) | la balle tourne vers l'avant : elle plonge, puis file au rebond | `ω_y > 0` vers `x` croissant |
| **Le coupé** (*backspin*) | la balle tourne vers l'arrière : elle tombe moins vite, freine au rebond | `ω_y < 0` |
| **Le latéral** (*sidespin*) | la rotation autour de la verticale : la balle dévie de côté | `ω_z` |
| **Le brossage** | la raquette frotte la balle plutôt qu'elle ne la frappe | `brush` de l'intention |
| **La frappe** | la raquette pousse la balle, selon sa normale | `drive` de l'intention |
| **La poussette** (*push*) | un coup court et coupé, près de la table | R3 |
| **Le bloc** (*block*) | un renvoi presque passif d'une balle rapide | une frappe faible |
| **Le top**, le topspin (*loop*) | un coup très brossé, l'attaque de base | R3 |
| **La frappe à plat**, **le smash** | un coup très rapide, peu d'effet | R3 |
| **Le flip** | une petite attaque sur une balle courte, au-dessus de la table | — |
| **La défense**, **le lob** | jouer loin de la table, haut ou coupé | — : DeepMind a du mal contre les lobs |
| **La troisième balle** (*third ball*) | le coup du serveur qui suit le retour : l'attaque préparée par le service | compté dans les rapports |

## Le placement et le jeu de jambes

| Terme | Ce que c'est | Dans le modèle |
|---|---|---|
| **La position d'attente** (*ready position*) | l'endroit où l'on revient entre deux coups | `ready` du profil |
| **Le pas chassé**, **le pivot** | les déplacements de base | — : le corps est un point qui accélère |
| **Le coup droit**, **le revers** | les deux côtés du joueur | — au départ : le joueur n'a pas de côté (Q-P12) |
| **Le coude**, le point de bascule (*crossover*) | la zone où le joueur hésite entre coup droit et revers | — : un argument pour le § 6 du modèle |
| **L'angle** | une balle qui sort loin sur le côté | la cible de R1 |
| **Long**, **demi-long**, **court** | la profondeur de la balle dans le camp adverse | `target.x` de l'intention |

## La physique

| Terme | Ce que c'est | Dans le modèle |
|---|---|---|
| **La traînée** (*drag*) | l'air freine la balle, en v² | `C_D` |
| **L'effet Magnus** | l'air dévie une balle qui tourne | `C_M` |
| **Le nombre de Reynolds** (*Re*) | le rapport des forces d'inertie et de viscosité de l'air | `2 v r / ν` |
| **Le rapport d'effet** (*spin ratio*, `Sp`) | la vitesse de surface due à l'effet sur la vitesse de la balle | `r ω / v` |
| **La crise de portance** (*lift crisis*) | une chute puis une remontée de la portance avec l'effet | le coude de `C_M` |
| **La restitution** (*COR*, `e`) | le rapport des vitesses normales après et avant le choc | `e(v_z)` |
| **Le flambage** (*buckling*) | la coque de la balle s'enfonce au choc, et la restitution baisse | la pente de `e` |
| **Le glissement**, **le roulement** | la balle frotte encore à la fin du contact, ou elle a pris la vitesse du plan | `α`, seuil 0,4 |
| **La coque mince** (*thin shell*) | le modèle de la balle pour son inertie, `I = ⅔ m r²` | `INERTIA` |
| **La raideur tangente** (*`k_p`*) | ce que la gomme rend de la vitesse tangente | le profil de raquette |
| **La vitesse limite** (*terminal speed*) | quand traînée et poids s'équilibrent : environ 8 m/s | le test de J1 |
| **RK2**, le point milieu | l'intégration du vol, en deux évaluations par pas | `flight.js` |

## Ce que le projet ajoute

| Terme | Ce que c'est | Dans le code |
|---|---|---|
| **L'intention** | ce que décide un joueur : le point visé, la force, le brossage, l'instant, où aller ensuite | `intent` |
| **La visée** | les inclinaisons de raquette qui réalisent l'intention, sans décider | `aim` |
| **La dispersion** | l'écart entre le coup voulu et le coup joué, tiré d'un flux à graine | `spread` |
| **La préparation** | le temps qu'il faut avant la frappe pour qu'elle soit nette | `prep` |
| **Le profil** | le joueur en chiffres : portée, vitesses, dispersions | `profile` |
| **Une paire**, en mesure | une graine jouée deux fois, chaque joueur servant une fois | `paired` de la lib |
| **Le témoin A/A** | une version contre elle-même, pour vérifier l'arène | les tests de J3 |

[lois]: https://www.tabletennisengland.co.uk/content/uploads/2026/07/Laws-of-Table-Tennis-2026-27.pdf
