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

**Relues le 2/11/2026**, en mise en page exacte et contre les figures de l'article :

- la table I colle à sa figure 1, regardée à l'œil ;
- la table II colle à la figure 2, lue au pixel, à 0,001 près ;
- la ligne 13,5 de la table III est bien celle-là ;
- **la table III ne colle pas à la figure 2 aux vitesses hautes**, au-dessus du coude (**C**) :

| v (m/s) | ω (rad/s) | `C_M` de la table | `C_M` de la figure |
|---|---|---|---|
| 7,5 | 600 ; 900 | 0,089 ; 0,050 | 0,091 ; 0,047 |
| 10,5 | 750 ; 900 | 0,104 ; 0,095 | 0,099 ; 0,083 |
| 13,5 | 600 ; 900 | 0,104 ; 0,104 | 0,087 ; 0,095 |
| 17 | 700 ; 900 | 0,075 ; 0,089 | 0,088 ; 0,110 |

Sur la figure, la courbe est continue au coude. Dans la table, elle saute à 13,5 m/s, de 0,075 à 0,097. **Le code garde la
table imprimée**, la seule valeur écrite, avec un test qui fixe ce saut. L'écart touche les effets au-delà de 90 tr/s environ.
Il vaut 2 à 5 m/s² de force de Magnus à ces vitesses, soit jusqu'à une dizaine de centimètres sur un vol de 0,2 s. Une recherche
pourrait exploiter le saut : à surveiller, si elle se met à jouer juste au-dessus de 550 rad/s. Une question aux auteurs réglerait
le point.

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
| Restitution tangente | `e_t = 0,819 − 0,010 ‖v_T‖`, d'où la part d'adhérence `α = (1 + e_t) / (1 + κ)` (relu le 3/11/2026, éq. 21 à 23, table IV) | [[conti]] | L ; κ = 3/2 et `e_r` à la place de `e_n` sont déduits, la section ne les redit pas |
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
| Le même écart dans notre modèle, 80 contre 110 tr/s, coups de 14 à 22 m/s | 1,1 à 2,1 m/s, 21 à 29 ms (**C**, J1) ; rien de net à 10 ou 12 m/s. Le départ de l'étude n'a pas été lu : un accord d'ordre de grandeur, pas une validation | calcul | C |
| Joueurs confirmés selon une autre source | environ 60 tr/s | [[gossard-serve]] citant Inaba et al. | L2 |
| Vitesse typique de jeu | 20 à 30 m/s, sans référence | [[schneider]] | R |
| Le passage à 40 mm | 5 à 10 % de vitesse et d'effet en moins que la balle de 38 mm | [[schneider]] | R |

| Vitesse de top d'élites de niveau régional, au radar, sur balle sans effet et sur coupé | 57,5 ± 6,1 km/h et 52,3 ± 9,3 km/h, soit 16,0 et 14,5 m/s, 15 joueurs | [[pej2026]] | E |
| Records de smash, hors match | 112,5 km/h en 2003 ; 116 km/h homologués en 2016 ([[guinness]]) | [[brandt]] | E |

**Au service** (recherche du 3/11/2026, demandée par Sami) :

| Chiffre | Valeur | Source | Statut |
|---|---|---|---|
| Effet du service, quarts de finale des Mondiaux 2009, 329 services, 16 joueurs, caméra 1 000 images/s | hommes 46,0 ± 9,0 tr/s, femmes 39,2 ± 9,3 tr/s ; de 13,7 à **62,5 tr/s** au plus, pour les deux | [[worlds2009]] | L |
| Tranche la plus fréquente | hommes 50 à 60 tr/s (40 %), femmes 40 à 50 tr/s (44 %) | [[worlds2009]] | L |
| Services d'un robot, qui « égalent ou dépassent » ceux de l'élite selon l'article | jusqu'à **6,7 m/s** et 550 rad/s (88 tr/s) ; 1 243 services de joueurs pro sont tracés, sans valeurs dans le texte | [[ace]] | L |
| Vitesse moyenne de ses services, selon la tâche | de 2,6 à 4,5 m/s sur l'axe de la table | [[ace]] | L, colonnes extraites sans leurs titres |
| Le service le plus rapide | 54 km/h (15 m/s), Asuka Sakai, calculé sur une vidéo | [[pingsunday]] | E : la page n'a pas pu être lue, à ne pas tenir pour une mesure |
| « 40 à 60 mph » pour le haut niveau (18 à 27 m/s) | un blog, sans étude citée | [[pingsunday2]] | E, écarté : contredit le reste |

**Hors service, le reste de ce que la recherche du 3/11/2026 a trouvé :**

| Chiffre | Valeur | Source | Statut |
|---|---|---|---|
| « La vitesse de la balle peut dépasser 20 m/s », « l'effet peut atteindre 1 000 rad/s » | valeurs générales, sans mesure dans l'article | [[acehw]] | L |
| Raquette d'un smash d'élite | environ 20 m/s, cité ; le robot atteint 22 m/s à vide, sans balle | [[acehw]] | L |
| Le jeu de données de Conti : 277 parties, amateurs, élites et pros, 58 000 trajectoires | **aucune distribution publiée** : ni moyenne, ni médiane, ni maximum ; les 35 m/s et 1 000 rad/s sont cités de Tang | [[conti]] | L |
| Lien entre vitesse et effet chez de jeunes élites, capteurs optiques | corrélation forte, top en coup droit plus rapide qu'en revers ; les moyennes n'ont pas pu être lues | [[youth]] | E |
| Effort subjectif et régularité, dix joueurs universitaires, 5 niveaux d'effort | vitesse moins stable à faible effort, effet le plus variable à 90 % | [[sato]] | E |
| Smash d'Ovtcharov | 113 km/h ou 122 km/h selon les blogs, qui se contredisent | [[pingsunday3]] | E, écarté |
| Effet jusqu'à 5 000 tr/min (83 tr/s) en top, citation de seconde main dans un article de tennis ; 200 tr/s sur un blog, sans étude | | [[tennistop]], [[pingsunday4]] | E, le second écarté |
| Une machine à balles, à titre de comparaison | 42,5 m/s, plus de 5 000 tr/min : un matériel, pas un joueur | recherche du 3/11/2026, source non relevée | E |

**Le détail des services du robot** [[ace]], table III (les colonnes extraites n'ont pas leurs titres : les trois composantes de la vitesse, puis celles de l'effet, en réel) :

| Tâche | Essais | Vitesse (m/s) | Effet (rad/s) |
|---|---|---|---|
| Viser, 299 ± 313 mm d'erreur | 15 | 2,8 ± 1,0 ; −1,0 ± 0,4 ; 2,3 ± 0,3 | 23 ± 42 ; 57 ± 158 ; 4 ± 112 |
| Lift et vitesse | 14 | 4,4 ± 1,1 ; −0,7 ± 0,6 ; 2,0 ± 0,1 | 49 ± 54 ; 263 ± 70 ; 101 ± 132 |
| Coupé | 12 | 3,3 ± 0,8 ; −1,1 ± 0,5 ; 1,7 ± 0,2 | −70 ± 84 ; −132 ± 177 ; 29 ± 72 |
| Latéral | 13 | 3,7 ± 1,0 ; −0,7 ± 0,7 ; 2,0 ± 0,2 | 37 ± 35 ; 140 ± 79 ; −13 ± 255 |

Le même article cite 52,78 % (hommes) et 53,28 % (femmes) de points gagnés au service chez les pros, et 1 à 21 % d'aces pour le robot selon les mois.

**Lu ou non.** Lus : [[worlds2009]] (le résumé), [[ace]] et [[acehw]] (le texte, sans les figures), [[conti]]. Vus seulement en extrait de recherche : [[pej2026]], [[youth]], [[sato]], [[tennistop]], [[pingsunday]], [[pingsunday2]], [[pingsunday3]], [[pingsunday4]]. Refusés (403 ou illisibles) : [[tamaki]], l'article de Kidokoro au-delà de son résumé déjà connu, et la comparaison celluloïd et plastique [[ijrss]], dont le PDF n'a pas pu être lu ici, à reprendre.

**Ce qui manque, malgré la recherche.** Aucune source lue ne donne une **médiane**, ni la vitesse d'un service mesurée sur des joueurs pro, ni le maximum et la moyenne de vitesse et d'effet en match. Trois pistes non lues : l'étude de Tamaki et Yoshida 2025 sur les services courts et longs [[tamaki]], la comparaison [[ijrss]], et la figure 4 de [[ace]], à relever à l'œil. Pour les vitesses et les effets d'un joueur de club, rien (Q-P8).

**Ce que le modèle en fait.** Les effets de service restent sous 62,5 tr/s. La bombe part à 11 m/s, le mieux qu'un contact bas permette : à 15 m/s, elle ne retomberait plus dans le camp adverse, ce qu'il faudrait confronter à un entraîneur (Q-P10). Le top des duels (11,2 m/s, 104 tr/s) est sous les 23 m/s et dans les 117 ± 29 tr/s de Kidokoro.

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

**Se déplacer sur le côté, d'autres sports de raquette** (Sami, 3/11/2026 : chercher au tennis et au badminton). Rien de mesuré au ping-pong ; le meilleur repère est [[vuong]] : 22 athlètes de haut niveau, de sports collectifs et de raquette, partant de côté au maximum, au signal lumineux, temps de réaction ôté.

| Premier pas | 25 cm | 50 cm | 1 m | 5 m | Statut |
|---|---:|---:|---:|---:|---|
| Contre-pas | 0,20 s | 0,28 à 0,31 s | 0,43 à 0,44 s | 1,21 s | L [[vuong]] |
| Pas de gravité | 0,19 à 0,20 s | 0,34 s | 0,50 s | 1,29 à 1,31 s | L [[vuong]] |
| Pas d'appel | 0,14 s | 0,25 à 0,27 s | 0,40 s | 1,24 à 1,25 s | L [[vuong]] |
| Pivot | 0,17 à 0,18 s | 0,27 à 0,28 s | 0,43 à 0,45 s | 1,26 à 1,27 s | L [[vuong]] |
| **Moyenne des quatre** | **0,18 s** | **0,29 s** | **0,44 s** | **1,26 s** | C |
| Notre corps, 8 m/s², 3 m/s | 0,25 s | 0,35 s | 0,52 s | 1,85 s | C |
| Notre corps, 12 m/s², 3 m/s | 0,20 s | 0,29 s | 0,46 s | 1,79 s | C |
| Notre corps, 14 m/s², 3 m/s | 0,19 s | 0,27 s | 0,44 s | 1,77 s | C |
| Notre corps, 16 m/s², 3 m/s | 0,18 s | 0,26 s | 0,43 s | 1,76 s | C |
| Notre corps, 14 m/s², 4 m/s | 0,19 s | 0,27 s | 0,39 s | 1,39 s | C |

Jusqu'à un mètre, 14 m/s² colle le mieux (écart moyen 13 ms, 71 ms à 8 m/s², 21 ms à 16 m/s²), pour des athlètes de haut niveau qui savent quand partir ; un bon joueur de club serait un peu en dessous, vers 12. **Le modèle est à 14 m/s² depuis le 4/11/2026.** Sami a d'abord trouvé 16 jouable, avec « encore un peu d'inertie » ; contre U, il a ensuite trouvé le mouvement « encore un peu trop élevé ». Le corps n'a qu'une seule accélération, pour partir comme pour freiner, et un joueur à la souris décide par clics : son ressenti n'est pas celui du robot. 8 m/s² était plus lent que les quatre pas à 25 cm et à 1 m. Sur 5 m, 3 m/s est trop lent de 0,5 s, ce qui compte peu autour d'une table. Leur temps de réaction au signal, 0,24 à 0,26 s (L [[vuong]]), est plus long que nos 0,20 s après la frappe adverse, mais un signal lumineux n'est pas une frappe qu'on voit venir.

Pour situer le freinage : environ 9,0 m/s² de décélération et 9,9 m/s² d'accélération moyennes sur des changements de direction de joueurs de tennis (E [[decel]], attribution non vérifiée) ; un pic de force horizontale de 2,1 à 2,2 fois le poids sur un demi-tour de basketteuses de l'équipe nationale japonaise, soit un pic de l'ordre de 20 m/s² (E [[basket]], C). Une moyenne autour de 10 et un pic autour de 20 encadrent nos 12 à 16. Les joueurs du haut du classement de l'Open d'Australie freinent et accélèrent plus fort sur leurs déplacements latéraux (d de 0,25 à 0,63 ; R [[armstrong]], sans valeur absolue lue). Au badminton, seuls des pics de tronc (plus de 4 g, chocs compris) ont été trouvés : rien de comparable à une accélération de déplacement.

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

Calculs du 2/11/2026, avec `ρ = 1,2`. Depuis J1, `tests/ball-references.test.js` les refait : les coefficients constants,
l'écart le long du vol, l'arithmétique des points, et le pas de temps seulement en ordre de grandeur (RK2 sous le millimètre,
Euler au-delà du centimètre). Le banc refait le coût. Les trajectoires servent à comparer des méthodes : ce ne sont pas toutes
des coups valides.

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

**Le coût d'un pas.** RK2 sur `Float64Array`, coefficients constants : 24 ns par pas (cadrage). **Avec les tables, au banc
de J1 (`npm run bench`, 20 millions de pas, un passage, machine à 8 % de charge) : 113 ns pour le vol seul, 171 ns avec la
table, le filet et le sol**, soit environ 15 µs pour un vol de 90 pas.

**Sans collection de mémoire une fois le code chaud** (un test en compte 0 sur un million de pas), à condition de faire passer
les nombres par des tableaux. Une première version en causait 1 595 sur 12 millions de pas au banc : un nombre flottant passé à
une fonction non inlinée, ou renvoyé par elle, est alloué.

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

**Ce que ce calcul ne dit pas.** Il compare deux modèles, pas un modèle à la réalité. Et Conti annonce 15,8 mm d'erreur
quadratique médiane sur un vol pour le modèle de référence de Nakashima, à première vue incompatible avec ces écarts.

**L'écart, regardé à J1.** Le même écart entre le `k_m` constant et les tables, mesuré de trois façons :

| Coup d'essai | Au point de chute | Erreur quadratique le long du vol | La même, le départ ajusté |
|---|---|---|---|
| 5 m/s, coupé 30 tr/s | 6,7 cm | 31 mm | 3,7 mm |
| 10 m/s, lift 40 tr/s | 42,6 cm | 64 mm | 8,6 mm |
| 15 m/s, lift 60 tr/s | 67,3 cm | 80 mm | 9,0 mm |
| 18 m/s, lift 117 tr/s | 15,0 cm | 92 mm | 12,3 mm |
| 25 m/s, lift 20 tr/s | 99,0 cm | 66 mm | 8,6 mm |

Deux effets, donc : une balle rasante amplifie une petite erreur de hauteur en une grande erreur de chute, et un départ ajusté
sur les observations absorbe l'essentiel d'une force mal estimée. **Si Conti ajuste le départ de chaque segment, ce que le texte
lu ne dit pas, leurs 15,8 mm et nos écarts ne se contredisent plus (hypothèse, C)**, et leur mesure dit alors peu de chose du point
de chute à partir d'un départ connu. Or c'est ce qui compte ici : un coup part d'un état connu, sans observation pour le corriger.
On garde donc les tables. Le `k_m` de Gossard n'est pas forcément celui de Nakashima, dont les coefficients n'ont pas été lus.

**Le coupé à deux rebonds** (Sami, 3/11/2026). Jusqu'où le receveur peut-il partir et arriver à temps ? Il démarre à l'arrêt, sur l'axe de
la balle, 0,20 s après la frappe, à 14 m/s² et 3 m/s, avec 0,8 m de portée, et prend la balle juste avant son deuxième rebond, sans
compter la préparation. Toutes ces valeurs de corps sont des hypothèses (§ 6 ; `modele.md`, § 4).

| Lancer | Marge au filet | 1er rebond | 2e rebond | Entre les deux | Rattrapable jusqu'à, derrière la ligne |
|---|---|---|---|---|---|
| 5 m/s, 18°, coupé 90 tr/s, depuis x = −1,6, 25 cm | 4 cm | x 0,34 à 0,48 s | x 1,32 à 0,93 s | 0,45 s | **2,60 m** |
| 4 m/s, 18°, coupé 30 tr/s, depuis x = −0,8, 15 cm | 3 cm | x 0,44 à 0,36 s | x 1,21 à 0,73 s | 0,37 s | **1,89 m** |

Le second rebond tombe près du fond : le receveur prend la balle tard, mais de loin.

**Les duels d'entraînement** (Sami, 3/11/2026). Ils disent si le modèle ressemble au ping-pong, parce qu'on sait à quoi ces échanges ressemblent. Avec
la dispersion de départ (3° et 6 %), 1 000 échanges par ligne :

| Duel | Coups par échange | Balle du premier | Balle du second | Fins |
|---|---|---|---|---|
| Top contre bloc | **16,1** | top : 11,2 m/s, lift 104 tr/s, pris à 27 cm | bloc : 7,7 m/s, lift 36 tr/s, pris à 19 cm | 479 filet, 450 dehors, 41 dans le dos, 30 à la limite ; le top perd 3 fois sur 4 |
| Poussette contre poussette | **36,2** | 5,2 m/s, coupé 39 tr/s, prise à 20 cm | la même | 488 dehors, 179 filet, 333 à la limite |
| R0 contre R0 | **47,4** | | | 388 filet, 15 dehors, 597 à la limite |

La poussette à 4° et 8 % tient 19 coups, à 5° et 10 % 11 coups (300 échanges) : c'est ce qu'un bas niveau verrait. Le top reste sous les 117 ± 29 tr/s des jeunes
joueurs confirmés de Kidokoro, et à la même vitesse de balle que les coups d'essai du § 8. **Aucune source ne dit combien durent ces duels** : les longueurs sont des
hypothèses, à faire valider (Q-P20). Le lift du bloc non plus n'a pas de référence.

**Ce que ces duels ont changé.** Réglés une première fois, ils ne tenaient pas, et le suivi coup par coup a montré trois défauts, plus un choix du cadrage :

| Défaut | Ce qu'il faisait | La correction |
|---|---|---|
| Une balle rebondie avant la fin de la réaction n'était plus lue | le joueur la laissait passer | la lecture sait qu'elle a déjà rebondi |
| Un lift lourd fait monter la balle de 6 m/s sur une raquette verticale, et la visée partait de là | le bloc devenait une chandelle à 8 m/s vers le haut | la recherche part d'une raquette fermée |
| Le corps courait jusque sur la balle | une balle à 0 cm passait « dans le dos » | il s'arrête 40 cm avant |
| La visée acceptait n'importe quelle marge au filet | 86 % des fins au filet avec R0 | 15 cm de marge (H), en jouant moins fort s'il le faut |

**La calibration de 4 à 5 coups visait mal.** Elle vient de matchs, où l'on attaque. Deux joueurs qui renvoient au centre avec de la marge ne se ratent presque pas, et c'est
crédible : R0 contre R0 tient 47 coups. Forcer R0 à 4 coups, comme je l'avais fait le 3/11 avec 86 % de filet, cachait les défauts ci-dessus. Les duels fixent donc la dispersion ;
les 4 à 5 coups restent une vérification pour la meilleure règle, à J5. La dispersion de 3° et 6 % reste celle de Q-P1.

**Une balle prise à 17 cm**, 4 000 tirages :

| Coup | Dispersion | Valide | Filet | Hors table | Deux rebonds |
|---|---|---|---|---|---|
| R0, centre | 3° et 6 % | 86,4 % | 12,9 % | 0,7 % | 3,4 % |
| R0, centre | 1,5° et 3 % | 99,1 % | 0,9 % | 0 % | 0,2 % |
| Coupé court, 4 m/s, brossage −6 m/s, à x = 0,35 | 3° et 6 % | 66,3 % | 31,5 % | 2,2 % | 46,1 % |
| Coupé court, 4 m/s, brossage −6 m/s, à x = 0,35 | 1,5° et 3 % | 80,7 % | 19,3 % | 0 % | 75,3 % |

Le coupé court est donc plus risqué que R0 : sans dispersion, il part à 4,7 m/s et 82 tr/s de coupé, et il garde peu de marge au filet. Le lancer de Sami reste à la portée du modèle de
contact de Conti.

**La règle « court », un premier essai** : 200 échanges contre un R0 qui attend plus ou moins loin, sans dispersion réduite, seuil de 1,5 m.

| Attente du receveur, derrière la ligne | Le serveur gagne, avec R0 | Le serveur gagne, avec « court » | Deux rebonds avec « court » |
|---|---|---|---|
| 0,5 m | 19 % (le reste, surtout à la limite) | 19 %, échanges identiques | 0 |
| 1,5 m | 96,5 % | 88,5 % | 1 |
| 2,5 m | 98 % | 78 % | 52 |

**Elle ne bat pas R0 pour l'instant** : le coup fait bien mouche à 2,5 m, 52 fois sur 200, mais R0 y gagne déjà, car le receveur rate sa propre frappe, trop courte depuis si loin. Rien n'est
mesuré au sens du § 7 du modèle : c'est le travail de J5.

**L'échelle des règles** (J5, 3/11/2026). Par paires, 1 200 graines à partir de 100 000, que rien n'a servi à régler. Les réglages viennent des graines de 0 à 299. Depuis, la balle rapide et la limite de 50° ont un peu changé ces chiffres : le tableau de la première recherche, plus bas, a les derniers.

| Duel | Part des points du premier | Intervalle à 95 % | Coups par échange | À la limite | Serveur |
|---|---|---|---|---|---|
| R1 contre R0 | **52,1 %** | 51,0 à 53,3 % | 41,7 | 46 % | 52 % |
| R2 contre R1 | 50,0 % | identiques, graine par graine | 31,2 | 23 % | 48 % |
| R3 contre R2 | **67,7 %** | 66,0 à 69,5 % | 8,8 | 0 | 56 % |
| R3 contre R0 | **52,3 %** | 50,5 à 54,0 % | 14,7 | 2 % | 53 % |
| R4 contre R3 | 48,9 % | 47,7 à 50,2 % | 6,3 | 0 | 62 % |
| R5 contre R4 | 49,9 % | 49,7 à 50,0 % | 6,8 | 0 | 60 % |
| R3 contre R3 | 50,0 % | exact | **5,5** | 0 | 62 % |

**Ces chiffres corrigent une première mesure fausse.** Les replays ont montré que R0 perdait 178 échanges sur 600 « dans le dos », la balle passant à 47 cm de lui, à portée de bras : il attendait l'instant prévu, et elle le dépassait. Un joueur frappe
maintenant plus tôt plutôt que de laisser passer une balle à portée. **R3 contre R0 tombe de 67,6 % à 52,3 %** : l'essentiel de son avantage venait de ce défaut.

Ce qu'il faut en lire :

- **Le placement et l'attaque paient peu contre un joueur qui renvoie au centre** : à peine plus de 2 points, de chaque côté de 50 %. R0 perd surtout sur ses propres balles au filet (911 sur 1 235).
- **Les règles ne sont pas transitives.** R3 prend 67,7 % à R2 mais 52,3 % à R0, et R1 prend 52,1 % à R0 : R2 et R1 souffrent contre le lift, là où le centre résiste. C'est le risque annoncé pour l'autojeu : une variante se juge contre un panel, pas contre une seule règle (`modele.md`, § 8).
- **R3 reste la barre de la première recherche**, de peu, puisqu'elle bat directement toutes les autres, sauf R4, à égalité statistique.
- **R2 ne fait rien** : à ce rythme, le temps de préparer ne manque jamais.
- **R4 ne bat pas R3** : le bloc ne rapporte rien ici, l'intervalle contient 50 %. Contre R0, R4 et R3 jouent exactement pareil : la balle n'est jamais assez rapide.
- **R5 ne joue presque jamais son coup** : 3 graines sur 1 200 diffèrent. Personne ne recule à 1,5 m dans ces échanges. La règle n'est donc pas mesurée, et le coup de Sami reste à éprouver, à la souris ou dans la recherche.
- **R3 contre R3 tient 5,5 coups**, près des 4 à 5 attendus (Glynn), sans que rien ait été réglé pour cela. **Le serveur y gagne 62 %**, à comparer quand le service aura un effet et une dispersion.

**Ce que le garde-fou a changé.** R1, à 20 cm des lignes et avec 3° de chaque côté, prenait 12,5 % des points contre R0 sur 400 graines, presque tout en balles hors table. Trois causes, 100 à 150 graines par essai :

| Essai contre R0 | Part des points |
|---|---|
| Plat, au fond et loin sur le côté, 3° sur le côté | 22 à 40 % |
| Plat, au milieu et sur le côté (0,685 ; 0,5), 1,5° sur le côté | 51,8 % |
| Le même, coût au bout du bras ×2 | 53,3 % |
| Lift au centre (0,9 ; 0), ×2 | 56,0 % |
| Lift sur le côté (0,9 ; 0,45), ×2 | 61,5 % |

La dispersion de 3° donnait 19 cm d'écart-type sur le côté, pour une table de 76 cm de demi-largeur : **viser le côté ne valait jamais son risque.** Elle passe à 1,5° (H), ce qui laisse 22 cm en longueur. Une balle en bout de bras se joue désormais moins bien (H), sans quoi être débordé ne coûtait rien. Les duels que Sami a validés bougent à peine, avec aussi la frappe plus tôt : R0 47,4 → 47,1, top contre bloc 16,1 → 16,6, poussettes 36,2 → 36,4 coups. Ces écarts longitudinal et latéral sont à faire valider (Q-P1).

**La première recherche** (J6, 3/11/2026). Par paires, dans la file, sur le modèle du commit `93d121f` et des graines à partir de 700 000, que rien n'a servi à régler. 24 plans par coup, notés sur 4 tirages communs et 4 coups d'avance, avec R3 comme modèle des deux joueurs :

| Duel | Graines | Part des points du premier | Intervalle à 95 % | Coups par échange |
|---|---|---|---|---|
| S contre R3 | 1 200 | **56,4 %** | 54,8 à 58,0 % | 4,6 |
| S contre R0 | 1 200 | **68,2 %** | 66,4 à 70,0 % | 6,8 |
| Monte-Carlo à plat contre R3 | 1 200 | 50,2 % | 48,3 à 52,1 % | 5,5 |
| S contre Monte-Carlo à plat | 600 | 53,0 % | 50,4 à 55,6 % | 5,0 |
| S à 4 fois le budget contre S | 300 | **61,8 %** | 57,9 à 65,8 % | 3,4 |
| S en ne gardant que le jouable, contre S sans | 600 | 50,7 % | 48,1 à 53,2 % | 4,4 |
| Monte-Carlo en ne gardant que le jouable, contre sans | 600 | **57,5 %** | 55,0 à 60,0 % | 3,9 |
| R1 contre R0 | 1 200 | 52,8 % | 51,6 à 54,0 % | 41,8 |
| R3 contre R0 | 1 200 | 51,7 % | 49,9 à 53,5 % | 14,1 |
| R3 contre R2 | 1 200 | 68,9 % | 67,1 à 70,6 % | 8,7 |
| R4 contre R3 | 1 200 | 48,0 % | 46,7 à 49,2 % | 5,8 |
| R5 contre R4 | 1 200 | 50,0 % | 50,0 à 50,1 % | 6,1 |

- **La recherche bat R3 et R0**, et le témoin à 4 fois le budget dit qu'elle ne plafonne pas encore.
- **Elle a d'abord trouvé une faille** : 44 % de ses frappes partaient à plus de 60°. Le Monte-Carlo prenait 70 % à R3 pour cette seule raison, et n'en prend plus que 50,2 % depuis que la visée s'arrête à 50°.
- **Retirer ce qui ne se joue pas aide les essais tirés au hasard, pas l'escalade** : elle part de R3, et un seul plan sur 10 est neuf.
- **Le meilleur de R3 sur R0 ne se voit plus** : son intervalle contient 50 %, et R1 fait aussi bien. Les règles restent non transitives, et S se mesure donc contre les deux.
- **Le bloc perd désormais** : R4 prend 48,0 % à R3. Une balle rapide est maintenant coûteuse à contrôler, et la règle ne choisit pas bien quand bloquer.
- **Une limite** : un plan alloue encore (la copie de l'échange, ses tirages). Le critère de 0 collection par décision de J6 n'est pas tenu, et la page attend la recherche sur le même fil : à 12 plans, jusqu'à 1 s de gel vue sur un premier point, à passer dans un *worker*.

**Les réglages de la recherche, et les deux algorithmes** (3/11/2026). Par paires, dans la file, à partir de services variés, à partir de la graine 800 000. **Ces mesures datent d'avant la correction de R3 et le service coupé** ; les mêmes sont refaites, à partir de 900 000.

| Duel | Graines | Part du premier | Intervalle à 95 % |
|---|---|---|---|
| Escalade contre Monte-Carlo à plat, 24 essais | 1 200 | 51,6 % | 49,7 à 53,4 % |
| La même, 96 essais | 400 | 50,2 % | 47,2 à 53,3 % |
| Escalade contre R3 | 1 200 | 56,5 % | 54,8 à 58,2 % |
| Monte-Carlo contre R3 | 1 200 | 53,4 % | 51,6 à 55,2 % |
| Escalade contre R0 | 1 200 | 62,0 % | 60,1 à 63,8 % |
| 96 essais contre 24 | 400 | 52,8 % | 49,7 à 55,8 % |
| 8 tirages contre 4 | 800 | **53,6 %** | 51,6 à 55,7 % |
| 2 tirages contre 4 | 800 | 47,3 % | 45,3 à 49,2 % |
| 2 coups d'avance contre 4 | 800 | 50,1 % | 48,1 à 52,2 % |
| 6 coups d'avance contre 4 | 800 | 49,3 % | 47,2 à 51,4 % |

À ce stade, les deux algorithmes semblaient à égalité. La mesure suivante corrige cette lecture.

**Les mêmes, après la correction de R3** (3/11/2026, à partir de la graine 900 000, commit `11d8d8f`, six services variés). Ce sont les chiffres à retenir :

| Duel | Graines | Part du premier | Intervalle à 95 % | Coups par échange |
|---|---|---|---|---|
| Escalade contre Monte-Carlo à plat, 4 tirages | 1 200 | **53,3 %** | 51,4 à 55,1 % | 5,3 |
| La même, 8 tirages | 800 | 52,3 % | 50,0 à 54,6 % | 5,3 |
| Escalade contre R3 | 1 200 | **54,9 %** | 53,1 à 56,7 % | 6,1 |
| Monte-Carlo à plat contre R3 | 1 200 | 51,4 % | 49,6 à 53,2 % | 5,9 |
| Escalade contre R0 | 1 200 | **62,0 %** | 60,2 à 63,8 % | 8,3 |
| 8 tirages contre 4 | 800 | **53,1 %** | 51,1 à 55,2 % | 5,5 |
| 96 essais contre 24 | 400 | 51,0 % | 48,0 à 54,0 % | 5,2 |

- **L'escalade est meilleure que le Monte-Carlo, de peu.** Contre un R3 qui ne jette plus de points, le Monte-Carlo n'a plus de gain net.
- **Les tirages paient, le budget non.** Plus d'essais sur 4 tirages ne rapportent rien de net. Le gain de 61,8 % mesuré plus tôt à 4 fois le budget n'a pas tenu sur le dernier modèle. Une explication possible, non vérifiée : avec peu de tirages, plus d'essais choisissent surtout le plus chanceux.
- **Ce que joue l'escalade** (replays, 7 449 frappes contre R3) : élévation surtout de 0 à 30°, 56 % de lift au-delà de 50 tr/s, 26 % de coupé au-delà de 20 tr/s, et 0,8 % de balles à plus de 45°, sans trace de la chandelle d'avant. Sa cible va surtout à mi-table ou à 90-110 cm, sur le côté.

**Avant le coût du geste** (3/11/2026, commit `6a039cb`, le service part d'où l'on se place, le receveur s'équilibre, à partir de la graine 1 100 000) : la recherche contre R3 **64,7 %** [62,8 ; 66,5], 4,9 coups ; contre R0 **68,6 %** [66,8 ; 70,4], 7,1 coups ; R3 contre R0 **57,5 %** [56,3 ; 58,6], 3 000 graines, 11,6 coups. Ces chiffres valent comme point de comparaison pour la suite.

**La recherche avec 8 tirages et le choix de son service** (3/11/2026, commit `87c71c6`, à partir de la graine 1 000 000) :

| Duel | Graines | Part du premier | Intervalle à 95 % | Coups par échange |
|---|---|---|---|---|
| Recherche contre R3 | 1 200 | **59,8 %** | 58,0 à 61,6 % | 5,2 |
| Recherche contre R0 | 1 200 | **64,0 %** | 62,2 à 65,8 % | 7,1 |
| Avec le choix du service, contre sans | 800 | **52,9 %** | 50,6 à 55,2 % | 4,9 |
| Escalade contre Monte-Carlo, tous deux à 8 tirages | 800 | 50,9 % | 48,6 à 53,2 % | 5,3 |
| 96 essais contre 24 | 300 | 52,2 % | 48,7 à 55,6 % | 4,8 |
| 16 tirages contre 8 | 400 | 49,3 % | 46,3 à 52,2 % | 5,3 |
| 2 coups d'avance contre 4 | 800 | 48,3 % | 46,1 à 50,5 % | 5,4 |

Les réglages plafonnent : ni plus de tirages, ni plus d'essais, ni moins d'avance ne rapportent nettement. L'escalade et le Monte-Carlo sont à égalité à 8 tirages (l'avance de 53,3 % était à 4 tirages) : **ce qui les sépare est surtout le bruit**.

Ce qu'elle sert, contre R3 (1 200 services, tirés des replays) :

| Service | Choisi | Points gagnés au service |
|---|---|---|
| Bombe | 862, **72 %** | 68,1 % |
| Latéral | 145 | 66,2 % |
| Pendule | 126 | 59,5 % |
| Marteau | 31 | 54,8 % |
| Mou | 24 | 58,3 % |
| Coupé | 12 | 66,7 % |

Ces chiffres sont biaisés : elle choisit chaque service quand il lui convient le mieux. R3, qui tire au hasard, gagne de 42,6 à 52,8 % à son service, la bombe en tête. **La bombe domine sans doute trop**, et rien de publié ne permet de le trancher (Q-P10). Sur les 5 bombes que Sami a reçues à la souris, il a perdu les 5 points, trop peu pour conclure.

**Les règles, après la correction de R3** (3/11/2026, 1 200 graines à partir de 900 000, services variés) : R3 contre R0 56,0 % [54,1 ; 57,8], contre 51,5 % avant ; R3 contre R2 71,8 % [70,2 ; 73,4] ; R1 contre R0 51,4 % [50,2 ; 52,5] ; R4 contre R3 50,0 % [48,6 ; 51,3].

**Les services, R3 contre R3** (1 200 graines par service) :

| Service | Part des points du serveur | Coups par échange |
|---|---|---|
| Pendule | 51,2 % | 6,7 |
| Marteau | 46,6 % | 7,3 |
| Mou | 49,2 % | 7,0 |
| Coupé | 47,5 % | 7,1 |
| Bombe | 56,5 % | 4,5 |
| Latéral | 49,7 % | 6,4 |

Avant la correction, le latéral tombait à 26,9 % pour le serveur : R3 jouait ensuite une poussette que la visée savait impossible. La bombe, à 10 m/s, montait à 72,4 %. Elle reste le seul service qui rapporte nettement au serveur.

**Les performances** (3/11/2026, sur une machine chargée). 85 % du temps passait dans les vols de la visée, jusqu'à une quarantaine par coup. Elle essaie maintenant à 60 Hz, reprend chaque vitesse de la solution de la précédente, et vérifie le dernier vol à 240 Hz.

| Mesure | Avant | Après |
|---|---|---|
| Une visée | 316 µs | 129 µs |
| Un coup de R3 contre R3 | 882 µs | 313 µs |
| Une décision de la recherche à 24 plans, médiane | 173 ms | 49 ms |
| La même, au pire sur 40 échanges | 546 ms | 160 ms |

Les duels de référence restent dans leur bruit : R0 47,1 → 47,3, top contre bloc 16,2 → 16,7, poussettes 36,4 → 36,6 coups.

**La balle rapide** (Sami, 3/11/2026 : « on ne pourra certainement pas faire des balles très courtes/contrôlées si l'adversaire vient de smash »). Sans coût, le modèle lui donnait tort : la raquette peut reculer d'exactement ce qu'il faut. Une balle partie à 25 m/s et tombée en fond de table, arrivant à 12,8 m/s, 1 500 tirages :

| Coup | Valide, sans coût | Valide, avec coût |
|---|---|---|
| Plat | 90 % | 48 % |
| Bloc | 97 % | 59 % |

Le coût vaut une fois de plus de dispersion tous les 2,5 m/s au-delà de 10 m/s (H, Q-P21). Le seuil de 10 m/s laisse les duels validés presque intacts : top contre bloc 16,6 → 16,2 coups ; à 8 m/s, il tombait à 12,9. Les coups contrôlés sont refusés au-delà de 8 m/s, pour la souris comme pour la recherche.

**Un premier signal pour R1, avant correction** (J4). Un joueur à la souris qui ne bouge jamais et vise un seul endroit, 400 points contre R0 à 100 % de dispersion :

| Visée | Gagnés | Perdus | Nuls à la limite | Sa principale faute |
|---|---|---|---|---|
| Centre (0,685 ; 0) | 63 | 112 | 225 | filet, 55 |
| Long (1,0 ; 0) | 93 | 299 | 8 | hors table, 205 |
| Coins sûrs (0,95 ; ±0,35) | 97 | 292 | 11 | hors table, 165 |
| Coins larges (1,1 ; ±0,55) | 54 | 346 | 0 | hors table, 292 |
| Côtés courts (0,6 ; ±0,5) | 19 | 324 | 57 | hors table, 104 |

Il ne se déplace pas et perd donc aussi des balles qu'il aurait rejointes : ce n'est pas la mesure de R1. Mais **viser près des lignes coûte plus de fautes que cela ne rapporte**, et R0 atteint presque tout sans bouger. Si R1 ne bat pas
R0 à J5, le garde-fou du `modele.md`, § 6, s'applique : on corrige le modèle avant toute recherche. Les premières pistes : une dispersion plus faible le long de la table, une portée plus courte.

**Le banc** (`npm run bench`) : une visée 348 µs, contre 82 µs avant la recherche du premier essai et la marge au filet ; un échange de R0, 47 coups, 19,5 ms. Un plan de recherche coûtera au moins une visée :
l'estimation de 50 µs par plan du `modele.md`, § 7, est trop basse, et la visée sera à accélérer à J6.

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

**L'autojeu après le coût du geste** (3/11/2026, sur `c1216ec`, 100 générations par lignée, part des points de la lignée sur 2 000 graines neuves, 600 contre S qui n'est pas dans le panel) :

| Lignée | Version | Contre R0 | Contre R1 | Contre R3 | Contre S | Coups contre S | Raquette / brossage du top |
|---|---|---:|---:|---:|---:|---:|---:|
| `g` | 40 | 83,7 | 78,9 | 67,9 | 60,5 [58,0 ; 63,0] | 4,2 | 5 / 8,0 |
| `h`, gardée sous le nom T | 17 | 87,9 | 80,2 | 79,4 | 66,2 [63,8 ; 68,7] | 2,9 | 5 / 13,4 |
| `i` | 14 | 79,7 | 77,6 | 75,0 | 67,2 [64,8 ; 69,5] | 2,9 | 5 / 13,0 |

Les mêmes coups, sur 800 échanges contre R3 : `h` sort sa balle à 9,5 m/s et 118 tr/s au premier coup, 12 m/s et 133 tr/s ensuite, sur la table 9 fois sur 10 ; `g`, à 7 m/s et 74 tr/s, puis 10 m/s et 101 tr/s. `topSpeed` colle à sa borne basse dans les trois lignées : la borne de 5 m/s décide, et rien ne dit encore qu'elle est la bonne.

**Comment T gagne** (300 graines, `h` contre R3) : 374 de ses 481 points sur 600 échanges sont des balles que R3 n'atteint pas, dont 172 au premier retour. Vol 0,27 s, rebond à 0,95 m du filet et 0,60 m de l'axe, le corps ne court en moyenne que 7 cm, puis la balle passe à 1,1 m de lui, hors de portée du bras (0,8 m). À l'envers, R3 ne gagne ainsi que 9 points sur les 119 qu'il prend.

**Servir décalé coûte cher contre T** (1 400 échanges, marge ±2,6 points) :

| Duel | Départ du service | Part du premier | Fini au 1er retour | Part du serveur |
|---|---|---:|---:|---:|
| T contre R3 | tiré à ±50 cm | 78,8 | 36,7 % | 44,1 |
| T contre R3 | au milieu | 79,6 | 17,4 % | 50,5 |
| R3 contre R0 | tiré à ±50 cm | 59,6 | 6,1 % | 50,9 |
| R3 contre R0 | au milieu | 57,4 | 6,1 % | 52,2 |

Le serveur décalé n'a pas regagné le milieu au retour. T en profite deux fois plus souvent, sans gagner davantage de points au total.

**La recherche et R3 après le coût du geste** (sur `c1216ec`, graine 1 200 000, S choisit son service) : S contre R3, 64,5 % [62,7 ; 66,3], 4,9 coups, serveur 56,7 %, sans changement (64,7 % avant) ; S contre R0, 64,8 % [63,0 ; 66,6], 7,4 coups, en baisse nette (68,6 % [66,8 ; 70,4] avant, sur d'autres graines) ; R3 contre R0, 58,4 % [57,2 ; 59,5], 11,4 coups (3 000 graines, `mix`).

**T comme modèle de l'adversaire dans la recherche** (3/11/2026, sur `384cc3c`, 1 200 graines à partir de 1 300 000, service choisi par la recherche) :

| Duel | Part du premier | Coups par échange | Part du serveur |
|---|---:|---:|---:|
| S-mT contre S | 68,2 % [66,4 ; 69,9] | 3,1 | 40,6 |
| S-mT contre R3 | 71,9 % [70,1 ; 73,7] | 3,7 | 42,9 |
| S-mT contre T | 78,1 % [76,5 ; 79,7] | 1,9 | 57,4 |
| S contre T | 31,2 % [29,4 ; 33,0] | 3,1 | 40,0 |

Changer le modèle suffit : contre R3, la recherche passe de 64,5 % à 71,9 %, et elle bat maintenant T, qui la battait à 68,8 %. Mais les échanges raccourcissent, et S perd 1 105 points sur 1 636 sur des balles non atteintes contre S-mT. Le serveur tombe à 40 % : le jeu se réduit à un retour large et gagnant. Le gain est réel dans le modèle ; rien ne dit encore qu'il le serait contre un humain.

**L'accélération du corps** (Sami, 3/11/2026 : « beaucoup d'inertie en partant sur les côtés » ; repères mesurés au § 6, qui favorisent 12 à 14 m/s²). Sur ses 33 points en 0.16.0, il laisse passer 4 balles sur 38 quand il est à moins de 25 cm du milieu au moment de la frappe adverse, et 6 sur 14 au-delà de 25 cm (balles tombées sur la table seulement). Aucune mesure de l'accélération d'un pongiste n'a été trouvée : le chiffre a d'abord été réglé sur le ressenti de Sami et ceci (1 400 échanges par ligne, ±2,6 points, sur le corps de 0.16.0 et la visée corrigée) :

| Accélération | Duel | Part du premier | Coups | Fini au 1er retour | Part du serveur | Pas atteint |
|---:|---|---:|---:|---:|---:|---:|
| 8 m/s² | T contre R3 | 78,8 | 4,0 | 35,3 % | 45,5 | 61,8 % |
| 8 m/s² | T contre T | 50,0 | 1,5 | 65,0 % | 29,4 | 77,0 % |
| 8 m/s² | R3 contre R3 | 50,0 | 6,4 | 5,6 % | 50,7 | 19,6 % |
| **16 m/s²** | T contre R3 | 74,0 | 5,7 | 23,3 % | 50,3 | 40,4 % |
| **16 m/s²** | T contre T | 50,0 | 2,2 | 41,0 % | 45,1 | 62,4 % |
| **16 m/s²** | R3 contre R3 | 50,0 | 8,1 | 5,6 % | 51,7 | 6,1 % |
| 24 m/s² | T contre R3 | 72,5 | 7,5 | 19,6 % | 48,6 | 23,6 % |
| 24 m/s² | T contre T | 50,0 | 2,8 | 33,6 % | 47,4 | 49,0 % |

16 m/s² : un demi-tour à 3 m/s prend 0,375 s, un mètre d'arrêt à arrêt 0,5 s. R3 contre R0 : 55,0 à 58,4 %, 11,6 à 11,0 coups ; l'écart dépasse à peine la marge, 58,5 % à 8 m/s² sur d'autres graines.

**La visée perdue sur une balle très brossée** (replays de Sami, 0.16.0). 5 de ses 21 latéraux reçoivent une réponse dont la visée échoue ; le robot envoie alors la balle jusqu'à 3,9 m, ou en chandelle à 2,1 m au-dessus du filet, alors qu'une grille trouve un coup. Sur les balles à plus de 80 tr/s d'effet latéral (T contre R3, 1 000 échanges), les échecs passent de 9 % à 0 % avec une recherche grossière en secours (`scanFlights`, 225 vols au plus, seulement après un échec). Au total : T contre R3, 4,1 % à 3,5 % d'échecs ; T contre T reste à 17 %, sans que la cause soit établie (deux exemples : des balles courtes et basses), et ces coups-là tombent quand même sur la table 3 fois sur 4.

**Le latéral de Sami en 0.16.0** (21 coups, effort 1,22 à 1,35 fois) : 17 sur la table, 10 cm d'écart à la cible, autant que le plat (11 cm), moins que le top (16 cm), et 6 réponses fautives du robot sur 17, dont 4 par la visée perdue ci-dessus. D'où `sideWeight` de 3 à 3,5 : effort de 1,9 fois pour le latéral à pleine vitesse. À revoir dans ses replays.

**L'autojeu sur le corps à 16 m/s²** (3/11/2026, sur `80945b0`, 100 générations, 2 000 graines neuves, 600 contre S) :

| Lignée | Version | Contre R0 | Contre R1 | Contre R3 | Contre S | Coups contre S | Raquette / brossage du top | Largeur du top | Attente |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `j` | 26 | 94,6 | 93,8 | 76,8 | 77,9 [75,7 ; 80,0] | 10,6 | 5 / 5,1 | 0,38 | 0,38 m |
| `k`, gardée sous le nom U | 28 | 96,7 | 96,8 | 79,2 | 80,9 [78,7 ; 83,0] | 12,5 | 5 / 6,6 | 0,10 | 0,10 m |
| `l` | 20 | 81,1 | 80,9 | 76,0 | 74,5 [72,1 ; 76,9] | 5,2 | 5 / 13,4 | 0,60 | 0,10 m |

La recette change : `j` et `k` ne cherchent plus l'angle gagnant, mais la balle sûre. `k` tient la table à 97 % et plus, avec une balle à 8-9 m/s et 70-85 tr/s, et gagne sur les fautes : contre R3, 631 de ses points sur 800 échanges finissent au filet ou dehors, aucun sur une balle pas atteinte. R3, lui, ne tient la table qu'à 89 %. Trois nombres de `k` collent à leur borne : `topSpeed` (5 m/s), `topWide` et `wait` (10 cm). Attendre à 10 cm de la table, c'est ce que Sami a trouvé à la souris pour survivre.

**La recherche sur ce corps** (sur `80945b0`, 1 200 graines à partir de 1 400 000) : S contre R3, 53,3 % [51,5 ; 55,1], 6,7 coups, serveur 58,1 %, contre 64,5 % sur l'ancien corps ; S-mT contre R3, 64,8 % [62,9 ; 66,6], 5,2 coups, contre 71,9 % ; S-mT contre S, 59,1 % [57,2 ; 61,0], 5,1 coups, contre 68,2 %. S se trompe surtout tout seul : contre R3, 1 062 de ses 1 121 points perdus sont au filet ou dehors.

**Sami à la souris sur 0.17.0** (43 points) : 11 sur 23 contre R0, 2 sur 8 contre S, 1 sur 12 contre T. Il en prenait 7 sur 16 à T en 0.16.0. Ses latéraux : 35 sur 43 sur la table, 13 cm d'écart à la cible (10 cm avant), 3 réponses fautives du robot sur 35 (6 sur 17 avant).

**U comme modèle de l'adversaire dans la recherche** (3/11/2026, sur `5d55333`, 1 200 graines à partir de 1 500 000) :

| Duel | Part du premier | Coups par échange | À la limite |
|---|---:|---:|---:|
| S-mU contre S | 68,2 % [66,4 ; 70,0] | 9,9 | 0,2 % |
| S-mU contre R3 | 65,2 % [63,3 ; 67,0] | 11,6 | 0,3 % |
| S-mU contre U | 39,0 % [37,3 ; 40,6] | 22,5 | 8,0 % |
| S contre U | 20,4 % [18,8 ; 22,0] | 11,9 | 0,1 % |

Ce modèle fait presque doubler la part de la recherche contre U, mais elle reste battue par la règle même qu'elle imite, et perd surtout par ses propres fautes (1 354 de ses 1 369 points perdus contre U). L'explication par l'horizon est **fausse** : à 600 graines contre U, regarder 8 coups devant donne 38,5 % [36,1 ; 40,9] et 16 coups 36,8 % [34,5 ; 39,2], pas mieux que les 39,0 % à 4 coups. Reste à tester : avec 8 tirages par plan, le meilleur de 24 plans est peut-être surtout le plus chanceux, donc souvent un coup risqué (`S-d32`, dans la file).

**Pourquoi U ne se laisse pas déborder** (Sami, 4/11/2026 : « quasiment impossible de prendre de vitesse U en lui faisant des gauche droite précis sur les bordures » ; « il remet rarement des balles haute que l'on peut smash. ce qui est bien »). Ses 8 points contre U en 0.18.0 : 2 gagnés, 13,6 coups par échange, 50 retours de U sur ses 52 balles sur la table, dont 17 sur 19 à 60 cm ou plus de l'axe. U attend à 10 cm de la table, et se retrouve au milieu (|y| moyen 0,07 m) quand Sami frappe. Sur une balle lente à 5-6 m/s, il a 0,7 à 1 s pour courir 1 à 1,3 m, et frappe sans le moindre coût (bras 1,00, hâte 1,00). Sur une balle à 10-12 m/s au bord, il a 0,3 à 0,45 s pour 0,2 à 0,8 m, à 2 m/s au moment de frapper, et cela ne lui coûtait rien non plus.

Essais sur le corps à 16 m/s² (800 échanges par ligne, ±3,5 points, hors file, ce qui n'aurait pas dû être). LR est R3 visant à 70 cm de l'axe, du côté opposé à l'adversaire :

| Variante | LR contre U | U contre U, coups | U contre R3 | R3 contre R3, coups | Pas atteint, R3 contre R3 |
|---|---:|---:|---:|---:|---:|
| Référence | 15,4 | 29,9 | 77,4 | 8,0 | 5,5 % |
| Reprise de 0,25 s après la frappe | 14,4 | 32,9 | 75,9 | 7,7 | 7,5 % |
| Reprise de 0,35 s | 16,9 | 29,7 | 72,9 | 7,1 | 14,8 % |
| 14 m/s² | 15,8 | 35,0 | 76,6 | 7,9 | 7,3 % |
| 12 m/s² | 18,8 | 29,6 | 73,8 | 7,5 | 10,5 % |
| 2,5 m/s | 16,4 | 45,9 | 75,6 | 7,7 | 5,0 % |
| Frappe en course, une dispersion de plus tous les 2 m/s au-delà de 1 m/s | 22,5 | 7,5 | 63,1 | 5,9 | 4,0 % |

La reprise après la frappe, que j'attendais, ne change presque rien : elle n'est pas gardée. Ce qui compte est la frappe en course. Le réglage retenu (1 000 échanges par ligne, ±3,1 points, à 14 m/s², file) :

| Sans frais jusqu'à | Une dispersion de plus tous les | Top contre bloc, coups | LR contre U | U contre U, coups | U contre R3 | R3 contre R3, coups |
|---:|---:|---:|---:|---:|---:|---:|
| — | jamais | 14,9 | 17,2 | 34,3 | 79,4 | 8,1 |
| 1 m/s | 2 m/s | 8,6 | 25,5 | 8,0 | 65,1 | 5,8 |
| 1 m/s | 3 m/s | 9,9 | 22,2 | 10,7 | 70,4 | 6,2 |
| **1 m/s** | **4 m/s** | **11,0** | **19,6** | **13,4** | **71,9** | **6,5** |
| 1,5 m/s | 2 m/s | 9,9 | 21,8 | 10,2 | 67,2 | 6,3 |
| 1,5 m/s | 3 m/s | 11,3 | 18,7 | 13,9 | 71,5 | 6,7 |
| 2 m/s | 1 m/s | 9,7 | 23,5 | 8,8 | 61,9 | 6,2 |
| 2 m/s | 2 m/s | 11,7 | 18,7 | 14,6 | 71,1 | 7,0 |

Le réglage le plus fort qui garde top contre bloc au-dessus de 10 coups, le seuil du duel de référence validé par Sami. Le gauche-droite y gagne peu (17,2 à 19,6), et le coût raccourcit surtout les échanges : U contre U, de 34 à 13 coups. U a été réglé sans ce coût ; de nouvelles lignées diront ce qu'il reste à gagner.

**L'autojeu avec le coût de la frappe en course** (4/11/2026, 14 m/s², 100 générations, 2 000 graines neuves, 600 contre S ; les bornes élargies) :

| Lignée | Version | Contre R0 | Contre R1 | Contre R3 | Contre S | Coups contre S | Raquette / brossage du top | Largeur du top | Attente |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `m` | 43 | 91,9 | 82,7 | 66,4 | 62,4 [59,8 ; 65,0] | 5,7 | 3 / 10,6 | 0,20 | 1,31 m |
| `n`, gardée sous le nom V | 18 | 88,7 | 87,2 | 84,3 | 79,4 [77,2 ; 81,6] | 4,3 | 4,1 / 13,3 | 0,59 | 0,38 m |
| `o` | 18 | 88,5 | 88,5 | 84,3 | 79,0 [76,8 ; 81,2] | 4,4 | 3,5 / 13,9 | 0,59 | 0,31 m |

`n` et `o`, parties chacune de leur côté, reviennent à l'angle : le régulier de `k` ne domine plus, et la balle large rapporte de nouveau, avec des échanges de 4 à 6 coups. Contre R3 (800 échanges), V sort sa balle à 9,1 m/s et 121 tr/s au premier coup, 11,6 m/s et 134 tr/s ensuite, sur la table à 94-95 % ; R3 tombe à 84 %. Ses 669 points gagnés : 309 balles pas atteintes, 360 fautes de R3. `topSpeed` ne colle plus à sa borne, mais le geste reste juste sous le seuil de 14,2 m/s du coût du geste : 13,9 pour `n`, 14,3 pour `o`.

**Les tirages de la recherche** (sur `a4315a1`, 300 graines à partir de 1 700 000, contre R3) : S, 60,7 % [57,1 ; 64,2] ; S-d32, 62,8 % [59,3 ; 66,4], 4 fois plus de tirages par plan. Aucun écart net : la piste de la chance ne se confirme pas à ce nombre de graines. Sur ce corps, S remonte à 60,7 %, contre 53,3 % à 16 m/s² sans coût de la course, sur d'autres graines.

**V dans les duels, et comme modèle de la recherche** (4/11/2026, sur `c0f2645`, 1 200 graines à partir de 1 800 000) :

| Duel | Part du premier | Coups par échange | Part du serveur |
|---|---:|---:|---:|
| V contre U | 74,3 % [72,6 ; 75,9] | 14,8 | 47,1 |
| S-mV contre S | 54,5 % [52,5 ; 56,4] | 4,0 | 49,2 |
| S-mV contre R3 | 62,6 % [60,7 ; 64,5] | 4,5 | 40,9 |
| S-mV contre V | 72,0 % [70,3 ; 73,6] | 2,2 | 63,5 |
| S contre V | 25,6 % [23,8 ; 27,3] | 4,9 | 49,2 |

Pas de hiérarchie simple : V écrase S, S-mV écrase V (1 462 de ses 1 727 points perdus sont des balles pas atteintes), et S-mV ne bat S que de peu. Contre V, la recherche se sert de ce qu'elle sait de lui, et les échanges tombent à 2,2 coups : le retour gagnant revient. C'est le risque connu d'un modèle exact de l'adversaire (`docs/strategies.md` de `mcts-codingame`, « 98 % contre une copie exacte de soi »). V suit une règle fixe et ne choisit pas son service : il ne s'adapte pas à ce qui l'exploite. S reste donc le réglage par défaut, et S-mV va au menu pour que Sami le juge.

## Les sources

[lois]: https://www.tabletennisengland.co.uk/content/uploads/2026/07/Laws-of-Table-Tennis-2026-27.pdf
[conti]: https://arxiv.org/abs/2606.28805
[durr]: https://ace.ai.sony/
[gossard-serve]: https://arxiv.org/abs/2608.08157
[gossard-racket]: https://arxiv.org/abs/2604.11349
[ito]: https://www.jstage.jst.go.jp/article/tjsst/17/1/17_25/_article/-char/en
[miyazaki]: https://inis.iaea.org/records/7k9tr-6pp60
[worlds2009]: https://www.jstage.jst.go.jp/article/jjpehss/advpub/0/advpub_13068/_article/-char/en
[ace]: https://arxiv.org/abs/2607.06989
[tamaki]: https://journals.sagepub.com/doi/10.1177/22150218251409592
[pej2026]: https://www.physicaleducationjournal.net/archives/2026.v8.i3.B.240/a-comparative-analysis-of-ball-velocity-of-forehand-topspin-technique-against-no-spin-and-backspin-balls-in-table-tennis
[pingsunday]: https://pingsunday.com/lightning-fastest-serve-speed-in-table-tennis/
[pingsunday2]: https://pingsunday.com/the-dynamics-of-speed-in-table-tennis-a-comprehensive-analysis-of-ball-velocity-generation/
[pingsunday3]: https://pingsunday.com/how-much-speed-can-a-table-tennis-player-generate-on-the-ball/
[pingsunday4]: https://pingsunday.com/how-much-spin-can-a-table-tennis-player-generate/
[acehw]: https://arxiv.org/abs/2606.26643
[youth]: https://www.researchgate.net/publication/392448568_Relationship_Between_Ball_Speed_and_Spin_in_Elite_Youth_Table_Tennis_Players_Using_Optical_Sensors
[sato]: https://journals.sagepub.com/doi/10.1177/17479541251380169
[tennistop]: https://www.researchgate.net/publication/330849036_Effect_of_topspin_on_the_apparent_speed_of_a_tennis_court
[ijrss]: https://journal.racketsportscience.org/index.php/ijrss/article/download/32/29
[brandt]: https://labolycee.org/sites/default/files/2025-09/2024-AmNord-J2-Exo1-Sujet-TennisdeTable-11pts.docx
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
| [[vuong]] | Vuong et al., *Effectiveness and Kinematic Analysis of Initial Step Patterns for Multidirectional Acceleration in Team and Racquet Sports*, *Journal of Human Kinetics* 85, 2022 |
| [[armstrong]] | Armstrong et al., *Lateral End-Range Movement Profile and Shot Effectiveness During Grand Slam Tennis Match-Play*, *European Journal of Sport Science* 25(2), 2025 |
| [[decel]] | *Efficient Deceleration: The Forgotten Factor in Tennis-Specific Training*, vu en extrait seulement |
| [[basket]] | *Relationship between ground reaction force and sacrum acceleration during 180° change of direction maneuvers in elite female basketball players*, PMC12935448, vu en extrait seulement |

La manette a ses sources dans [`../modele.md`](../modele.md), § 10.
