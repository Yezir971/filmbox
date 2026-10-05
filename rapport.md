Rapport d'Optimisation des Performances (M12)

M12.1 : Historique des visionnages par membre (idx_journal_utilisateur_date)

Action : Création d'un index B-Tree composite sur (utilisateur_id, date_visionnage DESC).

Diagnostic avant : PostgreSQL déployait deux workers pour un Parallel Seq Scan coûteux, rejetant plus de 333 000 lignes, suivi d'un tri quicksort en mémoire pour appliquer la limite.

Performance : Temps d'exécution mesuré à ~147,5 ms. L'index élimine totalement ce balayage en permettant un accès direct et pré-trié.

M12.2 : Tendances mensuelles et condition Sargable (idx_journal_date_film)

Action : Réécriture de la clause TO_CHAR avec des bornes directes (>= '2026-08-01' AND < '2026-09-01') et ajout de l'index composite couvrant.

Diagnostic avant : L'opérateur textuel bloquait l'usage des index, forçant un balayage complet (jusqu'à 259,6 ms).

Résultat après : Déclenchement d'un Index Only Scan massif. Le temps d'exécution s'effondre à ~43,1 ms (avec des pointes à ~21 ms). Le contrôle d'intégrité confirme que le périmètre de données reste identique (44 470 lignes trouvées dans les deux cas).

M12.3 : Recherche textuelle avec Jokers (idx_films_titre_trgm)

Action : Activation de l'extension pg_trgm et création d'un index GIN inversé.

Diagnostic avant : La clause ILIKE '%labyrinthe%' entraînait un Seq Scan linéaire lisant et rejetant 95 030 titres un par un. Temps d'exécution : ~98,8 ms.

Résultat après : L'arbre d'exécution bascule sur un Bitmap Index Scan qui localise les fragments de texte, suivi d'un Bitmap Heap Scan ciblé. Le temps tombe à ~10,7 ms, divisant la latence par 9.

Part d'aide de l'IA (Bilan)
L'analyse technique a permis d'identifier les nœuds critiques des plans d'exécution (les Parallel Seq Scan, les Sort en mémoire) et de proposer les contre-mesures architecturales adaptées. Le passage d'une condition filtrante opaque à une condition sargable et l'introduction d'un index trigramme GIN ont permis de sécuriser les performances de la base de données, la rendant prête à encaisser les requêtes asynchrones du futur front-end Next.js.


liste des index créer : 

  table  |          nom_index           | taille_index
---------+------------------------------+--------------
 films   | idx_films_titre_trgm         | 4224 kB
 films   | films_pkey                   | 2208 kB
 journal | journal_pkey                 | 21 MB
 journal | idx_journal_date_film        | 21 MB
 journal | idx_journal_utilisateur_date | 11 MB