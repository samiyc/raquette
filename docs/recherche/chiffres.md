# Les chiffres et leurs sources

Recherche du 2/11/2026. Tout chiffre de [`../modele.md`](../modele.md) vient d'ici, ou y est écrit comme une hypothèse.
Une réponse d'un professionnel entre ici avec sa date, et sa question quitte [`questions.md`](questions.md).

**Le statut dit jusqu'où la source a été lue :**

| Statut | Ce qu'il veut dire |
|---|---|
| **L** | lu dans le texte de la source |
| **L2** | lu chez un auteur qui cite la source, la source elle-même n'a pas été lue |
| **R** | résumé de la page par l'outil de lecture : à relire avant de s'y fier pour une décision |
| **E** | extrait d'un résultat de recherche seulement ; la page a refusé la lecture |
| **C** | calculé ici à partir des chiffres ci-dessus (§ 8) |
| **H** | hypothèse, sans source : elle renvoie à une question de [`questions.md`](questions.md) |

## 1. Le règlement (les Lois de l'ITTF, édition 2026)

Texte lu dans la reproduction de Table Tennis England [[lois]]. Statut **L** pour toute la table.

| Chiffre | Valeur | Loi |
|---|---|---|
| Surface de jeu | 2,74 m × 1,525 m, à 76 cm du sol | 2.1.1 |
| Rebond | « environ 23 cm » pour une balle lâchée de 30 cm | 2.1.3 |
| Filet | haut de 15,25 cm sur toute sa longueur, poteaux à 15,25 cm hors de la ligne de côté | 2.2.2, 2.2.3 |
| Balle | sphérique, 40 mm, 2,7 g, en plastique | 2.3.1 à 2.3.3 |
| Service : le lancer | quasi vertical, sans effet, monte d'au moins 16 cm | 2.6.2 |
| Service : le trajet | touche d'abord le camp du serveur, puis directement celui du receveur | 2.6.3 |
| Service : la position | au-dessus de la table et derrière la ligne de fond jusqu'à la frappe | 2.6.4 |
| Service dans le filet | à remettre (*let*) si le service est par ailleurs correct | 2.9.1.1 |
| Le retour | doit toucher le camp adverse, directement ou après le filet | 2.7.1 |
| Le point | service ou retour manqué, balle qui touche autre chose que le filet avant la frappe adverse, balle qui passe la ligne de fond sans toucher le camp, balle sous le filet, obstruction | 2.10.1.1 à 2.10.1.6 |
| L'obstruction | toucher la balle au-dessus de son camp, ou en route vers lui, avant qu'elle l'ait touché | 2.5.8 |
| La manche | 11 points, 2 d'écart à partir de 10-10 | 2.11.1 |
| Le service tourne | tous les 2 points, à chaque point à partir de 10-10 | 2.13.3 |
| Le match | au meilleur d'un nombre impair de manches | 2.12.1 |

## 2. Le vol de la balle

**La source principale est Conti et al. (Sony AI, 2026)** [[conti]], statut **L** : 277 parties, près de 58 000 vols,
25 000 contacts de table, 11 000 contacts de raquette, balle Nittaku Nexcel 40+, jusqu'à 35 m/s et 1 000 rad/s. C'est
le modèle qui a servi au robot Ace contre des professionnels [[durr]].

La force sur la balle (leur éq. 2), avec r = 0,02 m, A = π r², V = 4/3 π r³, et ω en rad/s :

```text
m a = − ½ ρ C_D A |v| v  −  C_M ρ V (v × ω)  +  m g
```

Le coefficient de traînée `C_D` se lit par morceaux, en fonction du rapport d'effet `Sp = r|ω|/|v|` (leur table I) :

| v (m/s) | Sp : C_D |
|---|---|
| 2,5 | 0 : 0,55 ; 0,3 : 0,55 ; 0,7 : 0,55 ; 0,95 : 0,55 ; 1,5 : 0,55 ; 2 : 0,55 |
| 7,5 | 0 : 0,49 ; 0,4 : 0,49 ; 0,75 : 0,55 ; 1,1 : 0,48 ; 1,3 : 0,53 ; 2 : 0,53 |
| 12,5 | 0 : 0,47 ; 0,4 : 0,47 ; 0,62 : 0,53 ; 0,95 : 0,41 ; 1,3 : 0,48 ; 2 : 0,48 |
| 17,5 | 0 : 0,47 ; 0,4 : 0,47 ; 0,5 : 0,51 ; 0,84 : 0,37 ; 1,2 : 0,45 ; 2 : 0,45 |

Entre deux lignes, interpolation linéaire en v ; extrapolation linéaire de 17,5 à environ 30 m/s.

Le coefficient de Magnus `C_M`, en fonction de ω (leurs tables II et III) : `m₁ ω + s` jusqu'au coude `b`, puis
`a₂ ω² + a₁ ω + a₀`, et jamais négatif (leur éq. 5). Les noms `a₂ a₁ a₀` sont les nôtres : l'article appelle `b` à la
fois le coude et un coefficient.

| v (m/s) | m₁ | s | coude (rad/s) | a₂ | a₁ | a₀ |
|---|---|---|---|---|---|---|
| 2,0 | 0 | 0,08 | 150 | −1,852e−7 | −1,296e−4 | 0,0983 |
| 3,5 | −1,1e−3 | 0,31 | 200 | −1,667e−7 | −3,333e−5 | 0,1 |
| 7,5 | −8,0e−4 | 0,37 | 350 | −2,000e−7 | 1,700e−4 | 0,0587 |
| 10,5 | −6,58e−4 | 0,375 | 440 | −2,604e−7 | 3,646e−4 | −0,0225 |
| 13,5 | −5,6e−4 | 0,383 | 550 | −3,571e−7 | 5,357e−4 | −0,0893 |
| 17,0 | −4,48e−4 | 0,371 | 650 | −1,000e−7 | 2,300e−4 | −0,0375 |

Ces tables viennent d'une extraction de texte d'un PDF à deux colonnes : **à vérifier sur la figure 2 de l'article**
avant de les figer dans une empreinte (J1). Le raccord au coude n'est pas tout à fait continu : à 13,5 m/s, 0,075 d'un côté
et 0,097 de l'autre (**C**), à regarder de près, car la ligne 13,5 n'a pas son étiquette dans le texte extrait.

| Autre chiffre | Valeur | Source | Statut |
|---|---|---|---|
| Viscosité de l'air à 20 °C | 1,506e−5 m²/s | [[conti]] | L |
| Erreur de position sur un vol, en médiane : modèle de référence de Nakashima, leur modèle | 15,8 mm, 8,1 mm | [[conti]] | L |
| Masse volumique de l'air | **1,2 kg/m³**, valeur d'air standard, non relevée dans l'article | | H (Q-P15) |
| L'effet reste constant pendant le vol | supposé par Gossard et al. | [[gossard-serve]] | L |
| Traînée et portance en soufflerie numérique, 2,5 à 20 m/s, 15 à 90 tr/s | valeurs non lues | [[ito]] | R |
| « Crise de portance » d'une balle qui tourne | la portance chute puis remonte | [[miyazaki]] | E |

**Un chiffre publié à ne pas reprendre.** Gossard et al. (août 2026) écrivent `k_d = 3,8e−3 kg/m` [[gossard-serve]]
(**L**). Avec `F = k_d v²`, cela ferait 563 m/s² de freinage à 20 m/s et un `C_D` de 5. Avec `3,8e−4`, on retrouve
`C_D ≈ 0,50`, cohérent avec Conti : c'est sans doute une coquille d'un facteur 10 (**C**). Le même article donne
`k_m = 3,0e−6 kg`, repris ci-dessous pour comparaison.

## 3. Le rebond sur la table

| Chiffre | Valeur | Source | Statut |
|---|---|---|---|
| Modèle | contact ponctuel de Nakashima et al. ; coque mince, I = ⅔ m r² | [[conti]], [[gossard-racket]] | L, R |
| Frottement dynamique balle-table | μ = 0,25 (Conti), 0,3 (Gossard) | [[conti]], [[gossard-serve]] | L |
| Restitution selon la vitesse normale | `e = 0,98 − 0,02 |v_z|`, v_z en m/s (flambage de la balle) | [[conti]] | L |
| Durée du contact | environ 0,7 ms | [[schneider]] | R |
| Le flambage commence vers | 5 m/s ; la restitution passe de 0,9 à 0,8 ou moins | [[schneider]] citant Cross | R |
| Effet du rebond sur la vitesse horizontale | de −3,1 à +2,6 m/s | [[kidokoro]] | R |
| Un fort coupé peut repartir en arrière | qualitatif | [[conti]] | L |
| Un essai qui contredit : e = 0,97, μ = 0,05 (μ mesuré en inclinant la table) | écarté : un autre montage, loin des deux autres | [[arxiv-2109]] | E |

Le modèle linéaire (Gossard et al. 2026, table I, d'après Chen et al.) [[gossard-racket]], avec
`α = μ (1 + e) |v_z| / v_s` et `v_s` la vitesse de glissement au point de contact :

| Coefficient | Roulement (α ≥ 0,4) | Glissement (α < 0,4) |
|---|---|---|
| vitesse tangente : a₁ | 0,6 | 1 − α |
| vitesse normale : a₂ | e | e |
| effet vers vitesse : b | 0,4 r | α r |
| vitesse vers effet : c | 0,6 / r | 3α / (2 r) |
| effet tangent : d₁ | 0,4 | 1 − 3α/2 |

**Une contradiction entre deux articles du même auteur.** L'article sur la raquette dit « α ≥ 0,4 : roulement »,
celui sur le service dit « α < 0,4 : roulement ». Le premier a raison (**C**) : pour une coque mince, l'impulsion
tangente qui annule le glissement vaut `J/m = 0,4 v_s`, et elle n'est atteinte que si `μ (1 + e) |v_z| ≥ 0,4 v_s`. Les
deux lignes du tableau se raccordent bien à α = 0,4 (a₁ = 0,6, d₁ = 0,4).

## 4. Le contact avec la raquette

| Chiffre | Valeur | Source | Statut |
|---|---|---|---|
| Restitution normale, revêtement backside (Dignics 05) | `0,878 − 0,020 v_n` | [[conti]] | L |
| Restitution tangente | `0,819 − 0,010 v_t` | [[conti]] | L, à relire : la formule exacte n'a pas été lue |
| Amortissement de l'effet autour de la normale | 0,805 | [[conti]] | L |
| Backside : pente de la restitution | 0,021 (offensif), 0,017 (polyvalent) par m/s, de 2 à 12 m/s | [[gossard-racket]] | R |
| Backside : raideur tangente | `k_p ≈ 0,019` en moyenne, décroît avec la vitesse de glissement | [[gossard-racket]] | R |
| Anti-top | e = 0,53, μ ≈ 0,2 | [[gossard-racket]] | R |
| Erreur d'un modèle simple sur 8 194 rebonds | 33 cm/s, 19 cm/s pour le meilleur | [[gossard-racket]] | R |
| **Où tombe la balle simulée après une frappe** | **15 cm d'erreur en médiane, 25 cm au 75e centile**, contre 37 et 60 pour le modèle de Nakashima | [[conti]] | L |
| Ce qui domine cette erreur | le contact de raquette ; « l'aérodynamique n'en explique qu'une très petite part » | [[conti]] | L |

Deux laboratoires trouvent la même pente de restitution, vers 0,02 par m/s.

## 5. Les vitesses et les effets joués

| Chiffre | Valeur | Source | Statut |
|---|---|---|---|
| Vitesse maximale | 35 m/s | Tang et al. 2002, cité par [[conti]] | L2 |
| Effet maximal | 1 000 rad/s (159 tr/s) | Tang et al. 2002, cité par [[conti]] | L2 |
| Record de vitesse homologué | 116 km/h (32,2 m/s), 2016 | [[guinness]] | E |
| Effet de six jeunes joueurs confirmés et d'un entraîneur, en top | 117 ± 29 tr/s | [[kidokoro]] | R |
| Vitesse dans cette étude, 0,15 s après la ligne de fond | 23 m/s | [[kidokoro]] | R |
| À même vitesse de départ : ≥ 110 tr/s contre ≤ 80 tr/s | 1,4 m/s de plus, et 27 ± 5 ms de moins pour arriver 1 m derrière la ligne | [[kidokoro]] | R |
| Joueurs confirmés selon une autre source | environ 60 tr/s | [[gossard-serve]] citant Inaba et al. | L2 |
| Vitesse typique de jeu | 20 à 30 m/s, sans référence | [[schneider]] | R |
| Le passage à 40 mm | 5 à 10 % de vitesse et d'effet en moins que la balle de 38 mm | [[schneider]] | R |

**Rien n'a été trouvé** sur les vitesses et les effets d'un joueur de club, ni sur l'effet des services (Q-P8, Q-P10).

## 6. Ce que font les joueurs

| Chiffre | Valeur | Source | Statut |
|---|---|---|---|
| Coups par point | 4 à 5 (finale cadets d'Asie 2013) | [[glynn]] | L |
| Durée d'un point, repos entre deux | 3,3 s et 17,8 s (la même finale) | [[glynn]] | L |
| Coups par échange, 18 joueurs élite | 4,51 ± 2,61 | [[srce]] | E |
| Durée d'un échange, élite mondiale masculine | **9,15 s**, repos 13,84 s : contredit les 3,3 s, sans doute une autre définition | [[unibo]] | E (Q-P13) |
| Points gagnés sur le service même, sur la 3e balle, sur la 5e | 11,6 %, 22,4 %, 10,9 % des points | [[djokic]] | E |
| Points perdus après le service : 3e balle, 5e balle | 25,0 %, 22,4 % | [[djokic]] | E |
| Fautes de service | 1,5 % des points | [[djokic]] | E |
| Service coup droit court | 76,9 % des services | [[djokic]] | E |
| Avantage au service, Jeux de 2016 | « légèrement au-dessus de 50 % » | [[gomez]] | E |
| Tactique élite, chaîne de Markov sur 152 manches | le long du revers et le lift pèsent le plus | [[pfeiffer]] | E |
| Un modèle de chaîne de Markov sur 259 manches | les longs échanges pèsent le plus ; effets du jeu risqué | [[wenninger]] | E |

**Rien n'a été trouvé** sur le temps de réaction d'un pongiste en chiffres, sa vitesse de déplacement, sa portée, la
vitesse de sa raquette ni **la dispersion de ses frappes** : c'est le trou principal (§ 7 du modèle, Q-P1 à Q-P7). Une
étude espagnole sur 116 joueurs relie temps de réaction et de déplacement au classement [[rt]] (**E**), sans chiffre lu.

## 7. Les robots, pour situer

| Système | Résultat | Source | Statut |
|---|---|---|---|
| Google DeepMind, 2024 | 13 manches sur 29 ; 100 % contre des débutants, 55 % contre des intermédiaires, 0 contre des joueurs avancés | [[dambrosio]] | R |
| Sony AI, Ace, *Nature* 652, 2026 | des victoires contre des joueurs élite, des défaites contre des professionnels ; les reportages ne donnent pas le même bilan | [[durr]], [[presse-ace]] | L2, E |

Ils apprennent le geste sur un vrai bras. Raquette ne simule pas de bras : elle cherche le coup à jouer, pas le geste.

## 8. Ce qui est calculé ici

Calculs de cadrage du 2/11/2026 : arithmétique déterministe sous Node 24, non versionnée. Ils restent à refaire dans les
tests de J1 (`docs/modele.md`, § 11), avec `ρ = 1,2`. Les trajectoires servent à comparer des méthodes : ce ne sont pas
toutes des coups valides.

**La vitesse limite et le freinage.** Vitesse limite 8,0 à 8,7 m/s (`C_D` 0,55 à 0,47). Freinage de traînée 52 m/s² à
20 m/s, 118 m/s² à 30 m/s : à ces vitesses, la traînée pèse 5 à 12 fois le poids.

**Le pas de temps.** Erreur sur le point de chute contre une référence à 100 kHz, `C_D` constant, `k_m` constant :

| Méthode | 60 Hz | 120 Hz | 240 Hz | 480 Hz |
|---|---|---|---|---|
| Euler semi-implicite, 20 m/s et 100 tr/s | 269 mm | 135 mm | 68 mm | 34 mm |
| RK2 (point milieu), 20 m/s et 100 tr/s | 4,9 mm | 1,1 mm | **0,31 mm** | 0,06 mm |
| RK4, 20 m/s et 100 tr/s | 2,7 mm | 0,59 mm | 0,17 mm | 0,03 mm |
| Euler semi-implicite, 12 m/s et 120 tr/s | 209 mm | 104 mm | 52 mm | 26 mm |
| RK2, 12 m/s et 120 tr/s | 1,6 mm | 0,36 mm | **0,10 mm** | 0,02 mm |

**Le coût d'un pas.** RK2 sur `Float64Array`, coefficients constants : **24 ns** par pas, un seul passage sur cette
machine, sans allocation. Un ordre de grandeur, à remesurer au banc avec les tables de coefficients.

**Un coefficient de Magnus constant s'éloigne de la table.** Point de chute comparé au modèle complet de Conti, RK2 à 2 kHz,
en 2D, ρ = 1,2, départ à 25 cm de haut. La colonne du milieu reprend le `k_m` de Gossard :

| Coup d'essai | Temps de vol | `C_D` 0,5 et `k_m` 3e−6 | `C_D` 0,5 et `C_M` de la table |
|---|---|---|---|
| 5 m/s, coupé 30 tr/s | 0,49 s | −6,7 cm | +2,7 cm |
| 8 m/s, sans effet | 0,37 s | −0,5 cm | −0,5 cm |
| 10 m/s, lift 40 tr/s | 0,29 s | **+42,6 cm** | +0,7 cm |
| 15 m/s, lift 60 tr/s | 0,24 s | **+67,3 cm** | +0,5 cm |
| 18 m/s, lift 117 tr/s | 0,27 s | +15,0 cm | **−18,3 cm** |
| 25 m/s, lift 20 tr/s | 0,18 s | **+99,0 cm** | −2,8 cm |

La force de Magnus sature : à 13,5 m/s, elle pousse à 9 m/s² dès 150 rad/s, 13 m/s² à 340, 10 m/s² à 500, 18 m/s² à 1 000.
Un `k_m` constant donne 2,3 m/s² à 150 rad/s, soit quatre fois moins : d'où les écarts à faible effet. Le creux de
traînée explique les −18,3 cm du top rapide : `C_D` y descend à 0,37.

**Ce que ce calcul ne dit pas.** Il compare deux modèles, pas un modèle à la réalité. Et il reste à réconcilier avec Conti, qui
annonce 15,8 mm d'erreur en médiane sur un vol pour le modèle de référence, sans doute à coefficients constants. Les deux
ne mesurent pas la même chose : une erreur au long d'un vol observé, contre un point de chute, très sensible parce que la
balle arrive rasante. L'écart reste à comprendre à J1 ; en attendant, on prend les tables.

**Le test du rebond.** Lâchée de 30 cm, la balle arrive à 2,37 m/s, traînée comprise.

| Restitution | D'où elle vient | Rebond calculé |
|---|---|---|
| 0,876 | `√(23/30)`, le calcul naïf depuis la Loi 2.1.3 | 21,3 cm |
| 0,89 | | 21,9 cm |
| 0,93 | Conti : `0,98 − 0,02 × 2,37`, arrondi | **23,9 cm** |

Le modèle de Conti tombe tout près de la Loi (« environ 23 cm ») ; le calcul naïf, non : il oublie la traînée.

**Ce que vaut un point de plus.** Avec des points indépendants et sans avantage au service :

| Part des points | Manche à 11 | Match en 4 manches gagnantes |
|---|---|---|
| 50 % | 50,0 % | 50,0 % |
| 51 % | 53,9 % | 58,4 % |
| 52 % | **57,7 %** | **66,5 %** |
| 55 % | 68,7 % | 85,6 % |
| 60 % | 83,6 % | 98,4 % |

**Combien d'échanges pour un intervalle.** Autour de 50 %, à 95 % : ±5 points de pourcentage, 385 échanges ; ±2 points,
2 401 ; ±1 point, 9 604.

## Les sources

[lois]: https://www.tabletennisengland.co.uk/content/uploads/2026/07/Laws-of-Table-Tennis-2026-27.pdf
[conti]: https://arxiv.org/abs/2606.28805
[durr]: https://ace.ai.sony/
[gossard-serve]: https://arxiv.org/abs/2608.08157
[gossard-racket]: https://arxiv.org/abs/2604.11349
[ito]: https://www.jstage.jst.go.jp/article/tjsst/17/1/17_25/_article/-char/en
[miyazaki]: https://inis.iaea.org/records/7k9tr-6pp60
[schneider]: https://www.intechopen.com/chapters/83844
[kidokoro]: https://pubmed.ncbi.nlm.nih.gov/36537568/
[arxiv-2109]: https://arxiv.org/abs/2109.03100
[guinness]: https://www.guinnessworldrecords.jp/world-records/426620-fastest-table-tennis-hit-male
[glynn]: https://ojs.ub.uni-konstanz.de/cpa/article/view/6025/5506
[srce]: https://hrcak.srce.hr/file/399967
[unibo]: https://cris.unibo.it/retrieve/e1dcb338-8309-7715-e053-1705fe0a6cc9/49.pdf
[djokic]: https://digibug.ugr.es/handle/10481/63715
[gomez]: https://cris.unibo.it/handle/11585/837747
[pfeiffer]: https://bibliographie.ub.uni-mainz.de/catalog/publication-79272
[wenninger]: https://portal.fis.tum.de/en/publications/markov-simulation-by-numerical-derivation-in-table-tennis/
[rt]: https://rio.upo.es/entities/publication/8cd66623-016f-42ea-8ed5-456d794c8131
[dambrosio]: https://arxiv.org/abs/2408.03906
[presse-ace]: https://robohub.org/table-tennis-robot-defeats-some-of-worlds-best-players-why-this-has-major-implications-for-robotics/

| Clé | Référence |
|---|---|
| [[lois]] | ITTF, *Laws of Table Tennis*, statuts 2026, reproduits par Table Tennis England, juillet 2026 |
| [[conti]] | Conti, Yang, Sigrist, Miele, Saraiji, Dürr, Takahashi, *Physics Models for Sim-to-Real Transfer in Professional-Level Robot Table Tennis*, arXiv 2606.28805v2, 2026 |
| [[durr]] | Dürr et al., *Outplaying elite table tennis players with an autonomous robot*, *Nature* 652, p. 886-891, 2026 (référence lue chez Conti ; le lien mène au site du projet) |
| [[gossard-serve]] | Gossard, Köpff, Ziegler et al., *Event-Time Hybrid Optimal Control for Robotic Table Tennis Serves*, arXiv 2608.08157v1, 2026 |
| [[gossard-racket]] | Gossard et al., *Learning Racket-Ball Bounce Dynamics Across Diverse Rubbers for Robotic Table Tennis*, arXiv 2604.11349v1, 2026 |
| [[ito]] | Ito, Kamijima, *Estimation of Aerodynamic Properties of a Spinning Table Tennis Ball Using CFD Analysis*, Trans. JSST 17(1), p. 25-31, 2025 |
| [[miyazaki]] | Miyazaki, Shimizu, Kimura, Naruo, Rolain, *Lift crisis of a spinning table tennis ball*, *Eur. J. Phys.*, 2017 |
| [[schneider]] | Schneider, Lewerentz, Kemnitz, Schultz, *Table Tennis and Physics*, IntechOpen, 2022 |
| [[kidokoro]] | Kidokoro, Inaba, Yoshida, Yamada, Ozaki, *A topspin rate exceeding 110 rps reduces the ball time of arrival to the opponent*, *Sports Biomechanics* 24(3), 2025 |
| [[arxiv-2109]] | *Optimal Stroke Learning with Policy Gradient Approach for Robotic Table Tennis*, arXiv 2109.03100 |
| [[guinness]] | Guinness World Records, *Fastest table tennis hit (male)*, 2016 |
| [[glynn]] | Glynn et al., *Implications for physical preparation of cadet male table tennis players: analysis of the 2013 Asian Championship singles final*, actes ISBS |
| [[srce]] | page de hrcak.srce.hr : titre non lu, le téléchargement a été refusé |
| [[unibo]] | page de cris.unibo.it : titre non lu, le téléchargement a été refusé |
| [[djokic]] | Djokic et al., *Serve analyses of elite European table tennis matches*, *Int. J. Racket Sports Science*, 2020 |
| [[gomez]] | Gómez Ruano et al., sur les Jeux de 2016, 2017 |
| [[pfeiffer]] | Pfeiffer, Zhang, Hohmann, *A Markov chain model of elite table tennis competition*, 2010 |
| [[wenninger]] | Wenninger, Lames, *Markov simulation by numerical derivation in table tennis*, 2016 |
| [[rt]] | étude sur 116 joueurs espagnols, *Int. J. Performance Analysis in Sport* 19(4), 2019 |
| [[dambrosio]] | D'Ambrosio et al., *Achieving Human Level Competitive Robot Table Tennis*, arXiv 2408.03906, 2024 |
| [[presse-ace]] | un reportage parmi d'autres sur Ace, avril 2026 |

La manette a ses sources dans [`../modele.md`](../modele.md), § 10.
