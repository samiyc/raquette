# Le prompt de recherche métier

À coller dans une session de recherche, Claude ou autre, quand Sami veut compléter
[`chiffres.md`](chiffres.md). La recherche du 2/11/2026 a déjà couvert le règlement, l'aérodynamique et le rebond : ce
prompt vise ce qu'elle n'a pas trouvé, dans l'ordre où cela pèse sur le modèle.

```text
Je construis une simulation de tennis de table : deux joueurs simulés, une physique de balle en 3D avec effet, et un robot
qui choisit ses coups. La physique vient déjà de sources publiées (Conti et al. 2026, Sony AI, arXiv 2606.28805 ; Gossard
et al. 2026 ; les Lois de l'ITTF). Ne refais pas ce travail.

Ce qui me manque, c'est le joueur humain en chiffres : ce qui fait qu'il rate. Cherche des sources publiées, en priorité des
études avec des mesures (biomécanique, sciences du sport, analyse de matchs), en anglais, en français, en allemand, en
chinois et en japonais.

Par ordre de priorité :

1. La dispersion d'une frappe. Pour un coup visé à un endroit de la table, à quelle distance de la cible tombe la balle ?
   Selon le niveau du joueur, la vitesse de frappe, l'effet, le temps disponible. Mots-clés : landing accuracy, placement
   accuracy, ball landing dispersion, stroke variability, speed-accuracy trade-off, table tennis.
2. Le temps de réaction et d'anticipation : combien de temps après la frappe adverse commence le déplacement ou le geste ?
   Peut-on lire la direction avant le contact ? Les chiffres de l'étude de 2019 sur 116 joueurs espagnols (DOI
   10.1080/24748668.2019.1621673).
3. Le déplacement : vitesse et accélération latérales, distance parcourue par point, portée utile du bras, distance à la table
   en position d'attente, selon le niveau.
4. Le geste : durée de la préparation et de la frappe, vitesse de la raquette au contact pour un bloc, un contre, un top et une
   frappe, selon le niveau.
5. La lecture de l'effet : à quel point un joueur évalue-t-il l'effet adverse, et combien d'erreurs en viennent ?
6. Les joueurs de club : vitesse et effet de leurs coups et de leurs services ; on a des chiffres d'élite ou de jeunes
   joueurs confirmés, mais rien pour le club.
7. Le service : vitesses, effets et parts de service court et long, à différents niveaux ; la part des points gagnés par le
   serveur, à la 3e balle, à la 5e.
8. Les échanges : nombre de coups et durée par niveau, avec la définition de la durée. Deux chiffres semblent se contredire :
   3,3 s (Glynn et al., cadets, 2013) et 9,15 s (un article sur l'élite masculine).
9. La tactique : les zones de placement qui rapportent le plus (coude, angles, long ou court), en chiffres, et ce qu'on
   enseigne d'abord à un débutant. Pfeiffer, Zhang et Hohmann 2010 ; Wenninger et Lames 2016.

Vérifie aussi, si tu peux lire les textes :
- Tang, Mizoguchi, Toyoshima 2002, sur les vitesses et effets de la balle de 40 mm : les chiffres 35 m/s et 1 000 rad/s ;
- Djokic et al. 2020 et Gómez Ruano et al. 2017 : les parts de points au service ;
- Inaba et al. 2017 : frottement et restitution de la balle en plastique sur la table.

Les règles :
- Chaque chiffre a sa source : auteurs, année, revue, lien. Dis si tu as lu le texte, ou seulement un résumé ou un extrait.
- Dis le niveau des joueurs et le nombre de sujets. Une étude sur 6 joueurs vaut un ordre de grandeur, pas une référence.
- Un blog ou un fabricant de matériel peut donner une définition, pas un chiffre de référence.
- Si deux sources se contredisent, garde les deux et explique l'écart.
- Si tu ne trouves rien, dis-le : n'invente pas et n'extrapole pas sans le dire. C'est utile de savoir qu'un chiffre n'est
  pas publié : il ira à un entraîneur.

Le format : pour chaque sujet, un tableau chiffre, valeur, niveau et nombre de sujets, source, ce qui a été lu. Puis ce qui
reste introuvable.
```

**Après la recherche.** Chaque chiffre va dans [`chiffres.md`](chiffres.md) avec son statut. Une réponse sourcée retire sa
question de [`questions.md`](questions.md), et elle change le profil de joueur du modèle : un changement de modèle, donc une
empreinte mise à jour, avec les mesures avant et après dans le commit.
