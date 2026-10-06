-- 1.1 
-- \dt

-- 1.2 
select * from matchs; 

-- 1.3 
SELECT current_database(), current_user, version();

-- 2.1 
CREATE TABLE tournois (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(80) NOT NULL UNIQUE, 
    date_debut DATE NOT NULL,
    dotation DECIMAL(12,2) DEFAULT 0.00 NOT NULL CHECK (dotation >= 0)
);
-- \d tournois 


-- 2.2 
INSERT INTO tournois (nom,date_debut ,dotation) VALUES('Summer Rush','2027-06-01' , -500.00);
-- 2.3 
CREATE TABLE inscriptions (
    tournoi_id INT NOT NULL,
    pseudo_joueur VARCHAR(50) NOT NULL,
    date_inscription DATE NOT NULL DEFAULT CURRENT_DATE,
    PRIMARY KEY (tournoi_id, pseudo_joueur),
    CONSTRAINT fk_tournoi FOREIGN KEY (tournoi_id) REFERENCES tournois(id)
);

INSERT INTO inscriptions (tournoi_id, pseudo_joueur, date_inscription) VALUES(99,'james', '2027-06-01' );


-- 3.1 
SELECT nom, poste, buts FROM joueurs WHERE buts BETWEEN 1 AND 5 ORDER BY buts DESC, nom ASC;

-- 3.2 
SELECT journee, equipe_dom_id, equipe_ext_id, buts_dom,buts_ext,buts_dom + buts_ext AS total from matchs WHERE buts_dom + buts_ext >= 4 ORDER BY total DESC;

-- 3.3 
SELECT nom, poste, buts FROM joueurs WHERE (poste = 'attaquant' OR poste = 'milieu') AND buts > 1;

SELECT nom FROM joueurs WHERE equipe_id IS NULL;


-- 4.1 
SELECT m.journee, e_dom.nom as domicile, m.buts_dom , m.buts_ext, e_ext.nom as exterieur FROM matchs m INNER JOIN equipes e_dom ON e_dom.id = m.equipe_dom_id INNER JOIN equipes e_ext ON e_ext.id = m.equipe_ext_id;

-- 4.2 
INSERT INTO equipes (nom, ville) VALUES('FC Nantes', 'Nantes'); 

SELECT e.nom AS equipe, j.nom AS joueur FROM equipes e LEFT JOIN joueurs j ON e.id = j.equipe_id ORDER BY equipe ASC;

DELETE FROM equipes WHERE nom='FC Nantes';

-- 4.3 

SELECT g.nom AS genre, parent.nom AS parent FROM genres g LEFT JOIN genres parent ON g.parent_id = parent.id;

-- 5.1 

SELECT e.poste AS poste, COUNT(e.id) ,SUM(e.buts) AS total_buts FROM joueurs e GROUP BY poste ORDER BY total_buts DESC;

-- 5.2  

SELECT p.pseudo, COUNT(p.id) AS nb_parties , MAX(score) as nb_meilleur_score FROM parties p GROUP BY pseudo ORDER BY nb_meilleur_score DESC;

-- 5.3 

SELECT e.nom AS equipe, COUNT(j.equipe_id) AS nb_joueurs FROM joueurs j INNER JOIN equipes e ON j.equipe_id=e.id GROUP BY e.nom HAVING COUNT(j.id) = (SELECT COUNT(id) FROM joueurs GROUP BY equipe_id ORDER BY 1 DESC LIMIT 1);

-- 6.1 

WITH records AS (SELECT jeu, MAX(score) AS recors_score FROM parties GROUP BY jeu) SELECT p.jeu, p.pseudo, p.score FROM parties p JOIN records r ON p.jeu = r.jeu AND p.score = r.recors_score ORDER BY p.jeu ASC, p.pseudo ASC;

-- 6.2 

WITH stats_domicile AS (
    SELECT 
        equipe_dom_id,
        COUNT(*) AS matchs_joues,
        SUM(
            CASE 
                WHEN buts_dom > buts_ext THEN 3 
                WHEN buts_dom = buts_ext THEN 1 
                ELSE 0                        
            END
        ) AS points
    FROM matchs
    GROUP BY equipe_dom_id
)
SELECT 
    e.nom,
    sd.matchs_joues,
    sd.points
FROM stats_domicile sd
JOIN equipes e ON sd.equipe_dom_id = e.id
ORDER BY 
    sd.points DESC,
    sd.matchs_joues ASC,
    e.nom ASC;

-- 6.3 

WITH moyenne_but AS (SELECT AVG(buts) AS moyenne FROM joueurs ) SELECT j.nom, j.buts, m.moyenne FROM joueurs j, moyenne_but m WHERE j.buts > m.moyenne ORDER BY buts DESC;

-- 7.1

WITH RECURSIVE result AS (SELECT 1 as n UNION ALL SELECT n+1 FROM result WHERE n < 20 ) SELECT n FROM result WHERE n%2 =0;

-- 7.2
WITH RECURSIVE arbre AS ( SELECT g.id, g.nom, parent_id, 0 AS distance FROM genres g WHERE g.nom='Drill' UNION ALL SELECT g.id, g.nom, g.parent_id, a.distance +1  FROM genres g JOIN arbre a ON g.id=a.parent_id ) SELECT nom, distance FROM arbre;

-- 7.3

WITH RECURSIVE hierarchie AS (
    SELECT 
        id AS racine_id,
        nom AS racine_nom,
        id AS genre_id
    FROM genres
    WHERE parent_id IS NULL

    UNION ALL

    SELECT 
        h.racine_id,
        h.racine_nom,
        g.id AS genre_id
    FROM genres g
    JOIN hierarchie h ON g.parent_id = h.genre_id
)
SELECT 
    racine_nom AS racine,
    COUNT(genre_id) - 1 AS nb_sous_genres
FROM hierarchie
GROUP BY racine_id, racine_nom
ORDER BY nb_sous_genres DESC, racine ASC;


-- 8.1
SELECT nom, buts, RANK() OVER (ORDER BY buts DESC) FROM joueurs ORDER BY buts DESC;
-- 8.2
SELECT jeu, pseudo, MAX(score) AS socre FROM parties GROUP BY pseudo, jeu ORDER BY jeu ASC;

-- 8.3

SELECT pseudo, date_partie, jeu, ROW_NUMBER() OVER (PARTITION BY pseudo ORDER BY date_partie ASC) AS num_partie FROM parties;

-- 9.1
SELECT s.mois, s.ecoutes, SUM(ecoutes) OVER (ORDER BY s.mois ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumul FROM streams s WHERE artiste='Kairo' AND mois>='2026-01-01' GROUP BY s.mois, s.ecoutes;
-- 9.2
WITH suivi_ecoutes AS (SELECT artiste, mois, ecoutes, LAG(ecoutes) OVER (PARTITION BY artiste ORDER BY mois ASC) AS precedent FROM streams ) SELECT artiste, mois, precedent,ecoutes FROM suivi_ecoutes WHERE ecoutes < precedent ;
-- 9.3
SELECT mois, ecoutes, AVG(ecoutes) OVER (ORDER BY mois ASC ROWS BETWEEN 1 PRECEDING AND CURRENT ROW) AS moyenne_2_mois FROM streams WHERE artiste='Nova' ORDER BY mois ASC;

-- 10.1



-- filmbox

-- m1.1
-- clé primaire film_id, personne_id, role et valeurs possible de role : realisateur, acteur

-- m1.2

CREATE TABLE liste (id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,membre VARCHAR(100) NOT NULL, titre VARCHAR(100) NOT NULL, visibility VARCHAR(12) CHECK (visibility IN ('public', 'privé')) DEFAULT 'privé', create_at DATE DEFAULT now() ); 

-- m.3
CREATE TABLE liste_film (id INTEGER GENERATED ALWAYS AS IDENTITY,liste_id INTEGER NOT NULL, film VARCHAR(100), position INTEGER NOT NULL, PRIMARY KEY (liste_id, film, id), CONSTRAINT positif CHECK (position > 0),CONSTRAINT unique_position UNIQUE (liste_id, position) );

-- m1.4


INSERT INTO liste (membre, titre, visibility) VALUES ('yoda', 'Mon top Nolan', 'public');
INSERT INTO liste_film (liste_id, position, film) VALUES (1, 1, 'The Dark Knight'), (1, 2, 'Inception'), (1, 3, 'Batman Begins');

SELECT l.titre AS liste, lf.position, lf.film FROM liste_film lf INNER JOIN liste l ON l.id = lf.liste_id;

-- M2.1

SELECT titre, annee, genre FROM films WHERE annee >= 2000 AND annee <= 2010 ORDER BY annee ASC;

-- M2.2

WITH kevin AS (SELECT id, nom FROM personnes WHERE nom='Kevin Bacon'), all_film_kevin AS (SELECT c.film_id,c.personne_id,c.role FROM casting c INNER JOIN kevin ON kevin.id = c.personne_id) SELECT titre, annee FROM films f INNER JOIN all_film_kevin alfk ON alfk.film_id = f.id ORDER BY annee ASC ;

-- M2.3

select p.nom, COUNT(p.nom) AS nb_films from personnes p INNER JOIN casting c ON c.personne_id=p.id WHERE role='realisateur' GROUP BY p.nom ORDER BY nb_films DESC;

-- M2.4

SELECT f.titre, AVG(n.note) AS moyenne, COUNT(n.film_id) AS nb_notes from notes n INNER JOIN films f ON f.id = n.film_id GROUP BY f.titre HAVING COUNT(n.film_id)>=5 ORDER BY moyenne DESC LIMIT 5 ;

-- M2.5

SELECT u.pseudo, COUNT(j.film_id) AS nb_visionages, COUNT(DISTINCT j.film_id) AS nb_films_distincts FROM journal j INNER JOIN utilisateurs u ON u.id = j.utilisateur_id GROUP BY u.pseudo ORDER BY nb_visionages DESC;

-- M3.1

WITH cible AS (
    -- Utilisateur ciblé
    SELECT id, pseudo 
    FROM utilisateurs 
    WHERE pseudo = 'cinephile_92'
), 
nb_notes AS (
    SELECT COUNT(DISTINCT n.film_id) AS nb_films_notes 
    FROM notes n INNER JOIN cible c ON c.id=n.utilisateur_id 
    ), 
stat_note AS (SELECT AVG(n.note) AS note_moyenne FROM notes n INNER JOIN utilisateurs u ON u.id=n.utilisateur_id WHERE u.pseudo='cinephile_92'), 
genre_top AS (SELECT f.genre AS genre_prefere FROM notes n JOIN cible c ON n.utilisateur_id = c.id JOIN films f ON n.film_id = f.id GROUP BY f.genre ORDER BY COUNT(n.film_id) DESC, f.genre ASC LIMIT 1), coup_de_coeur AS (
    SELECT f.titre AS film_coup_de_coeur
    FROM notes n
    JOIN cible c ON n.utilisateur_id = c.id
    JOIN films f ON n.film_id = f.id
    ORDER BY 
        n.note DESC,
        n.note_le ASC,
        f.id ASC
    LIMIT 1
) SELECT c.pseudo, nbn.nb_films_notes, sn.note_moyenne, gt.genre_prefere,cdc.film_coup_de_coeur FROM cible c, nb_notes nbn, stat_note sn, genre_top gt, coup_de_coeur cdc ;

-- 3.2
SELECT 
    f.titre, 
    f.annee
FROM films f
LEFT JOIN (
    SELECT j.film_id 
    FROM journal j
    JOIN utilisateurs u ON j.utilisateur_id = u.id
    WHERE u.pseudo = 'cinephile_92'
) vus ON f.id = vus.film_id
WHERE vus.film_id IS NULL
ORDER BY 
    f.annee DESC, 
    f.titre ASC;

-- 3.2 

SELECT 
    f.titre,
    MAX(n.note) AS note_max,
    MIN(n.note) AS note_min,
    MAX(n.note) - MIN(n.note) AS ecart
FROM films f
JOIN notes n ON f.id = n.film_id
GROUP BY f.id, f.titre
HAVING COUNT(n.note) >= 2
ORDER BY 
    ecart DESC,
    nb_notes DESC,
    f.titre ASC
LIMIT 5;

-- 3.3 

WITH RECURSIVE saga_chrono AS (
    -- 1. Point d'ancrage 
    SELECT 
        id, 
        titre, 
        annee,
        saga_id,
        1 AS ordre
    FROM films
    WHERE saga_id = 1
      AND film_precedent_id IS NULL

    UNION ALL

    -- 2. Étape récursive 
    SELECT 
        f.id, 
        f.titre, 
        f.annee,
        f.saga_id,
        sc.ordre + 1
    FROM films f
    INNER JOIN saga_chrono sc ON f.film_precedent_id = sc.id
)
SELECT ordre, titre, annee
FROM saga_chrono
ORDER BY ordre ASC;

-- 4.2

WITH RECURSIVE arbre AS (
    -- Ancrage : les genres racines (sans parent)
    SELECT id, titre,saga_id, film_precedent_id, 1 AS episode, titre::TEXT AS parcours
    FROM films
    WHERE film_precedent_id IS NULL

    UNION ALL

    -- Étape : les enfants des genres déjà trouvés
    SELECT f.id, f.titre,f.saga_id,f.film_precedent_id , a.episode + 1, a.parcours || ' -> ' || f.titre
    FROM films f
    JOIN arbre a ON f.film_precedent_id = a.id
)
SELECT s.nom, a.episode, a.parcours
FROM arbre a
INNER JOIN sagas s ON a.saga_id = s.id
ORDER BY s.nom, a.episode;

-- 4.3

WITH RECURSIVE bacon_tree AS (
    -- Ancrage : Kevin Bacon au degré 0
    SELECT 
        p.id, 
        p.nom, 
        0 AS nombre_de_bacon, 
        ARRAY[p.id] AS chemin
    FROM personnes p
    WHERE p.nom = 'Kevin Bacon'

    UNION ALL

    -- Étape récursive : recherche des co-acteurs via la table de casting
    SELECT 
        p.id, 
        p.nom, 
        bt.nombre_de_bacon + 1, 
        bt.chemin || p.id
    FROM bacon_tree bt
    JOIN casting c1 ON bt.id = c1.personne_id AND c1.role = 'acteur'
    JOIN casting c2 ON c1.film_id = c2.film_id AND c2.role = 'acteur'
    JOIN personnes p ON c2.personne_id = p.id
    WHERE NOT (p.id = ANY(bt.chemin)) 
      AND bt.nombre_de_bacon < 4      
)
SELECT 
    nom, 
    MIN(nombre_de_bacon) AS nombre_de_bacon
FROM bacon_tree
WHERE nombre_de_bacon > 0 
GROUP BY nom
ORDER BY nombre_de_bacon DESC, nom
LIMIT 8;

-- 4.4

WITH RECURSIVE chemin_bacon AS (
    -- Ancrage : On initialise le point de départ avec Kevin Bacon
    SELECT 
        p.id AS acteur_id, 
        p.nom AS acteur_nom,
        0 AS distance, 
        ARRAY[p.id] AS acteurs_visites, 
        p.nom::TEXT AS parcours
    FROM personnes p
    WHERE p.nom = 'Kevin Bacon'

    UNION ALL

    -- Étape récursive : On avance d'un acteur à un autre via un film commun
    SELECT 
        p_suivant.id, 
        p_suivant.nom,
        cb.distance + 1, 
        cb.acteurs_visites || p_suivant.id, 
        cb.parcours || ' - ' || f.titre || ' : ' || p_suivant.nom
    FROM chemin_bacon cb
    -- Les rôles de l'acteur actuel
    JOIN casting c1 ON cb.acteur_id = c1.personne_id AND c1.role = 'acteur'
    -- Le film correspondant
    JOIN films f ON c1.film_id = f.id
    -- Les autres acteurs du même film
    JOIN casting c2 ON f.id = c2.film_id AND c2.role = 'acteur'
    -- Les informations du nouvel acteur
    JOIN personnes p_suivant ON c2.personne_id = p_suivant.id
    -- Condition d'arrêt pour éviter les boucles
    WHERE NOT (p_suivant.id = ANY(cb.acteurs_visites))
      AND cb.distance < 5 -- Limite de sécurité optionnelle
)
-- Sélection finale : On filtre sur Omar Sy et on garde le chemin le plus court
SELECT 
    distance,
    parcours AS chemin_complet
FROM chemin_bacon
WHERE acteur_nom = 'Omar Sy'
ORDER BY distance ASC
LIMIT 1;

-- 4.5

WITH RECURSIVE reseau_bacon AS (
    SELECT p.id
    FROM personnes p
    WHERE p.nom = 'Kevin Bacon'

    UNION

    SELECT p_suivant.id
    FROM reseau_bacon rb
    JOIN casting c1 ON rb.id = c1.personne_id AND c1.role = 'acteur'
    JOIN casting c2 ON c1.film_id = c2.film_id AND c2.role = 'acteur'
    JOIN personnes p_suivant ON c2.personne_id = p_suivant.id
)
SELECT DISTINCT p.nom
FROM personnes p
JOIN casting c ON p.id = c.personne_id
WHERE c.role = 'acteur'
  AND p.id NOT IN (SELECT id FROM reseau_bacon)
ORDER BY p.nom;

-- 5.1
WITH stats_films AS (
    -- 1. Calcul de la moyenne et filtre sur le nombre de notes
    SELECT 
        f.genre, 
        f.titre, 
        ROUND(AVG(n.note), 2) AS moyenne
    FROM films f
    JOIN notes n ON f.id = n.film_id
    GROUP BY f.id, f.genre, f.titre
    HAVING COUNT(n.note) >= 3
),
classement AS (
    -- 2. Attribution du rang par genre
    SELECT 
        genre,
        RANK() OVER (PARTITION BY genre ORDER BY moyenne DESC, titre ASC) AS rang,
        titre,
        moyenne
    FROM stats_films
)
-- 3. Filtrage du Top 3
SELECT 
    genre, 
    rang, 
    titre, 
    moyenne
FROM classement
WHERE rang <= 3
ORDER BY genre, rang;

-- 5.2

WITH stats_realisateurs AS (
    SELECT 
        p.nom AS realisateur, 
        ROUND(AVG(n.note), 2) AS moyenne,
        COUNT(n.note) AS nb_notes
    FROM personnes p
    JOIN casting c ON p.id = c.personne_id
    JOIN notes n ON c.film_id = n.film_id
    WHERE c.role = 'realisateur'
    GROUP BY p.id, p.nom
)
SELECT 
    DENSE_RANK() OVER (ORDER BY moyenne DESC) AS rang,
    realisateur,
    moyenne,
    nb_notes
FROM stats_realisateurs
ORDER BY rang, realisateur;

-- 5.3
WITH classement_notes AS (
    SELECT 
        u.pseudo, 
        f.titre, 
        n.note, 
        n.note_le,
        ROW_NUMBER() OVER (
            PARTITION BY u.id 
            ORDER BY n.note DESC, n.note_le ASC
        ) AS rang_note
    FROM utilisateurs u
    JOIN notes n ON u.id = n.utilisateur_id
    JOIN films f ON n.film_id = f.id
)
SELECT 
    pseudo, 
    titre, 
    note, 
    note_le
FROM classement_notes
WHERE rang_note = 1
ORDER BY pseudo;

-- 5.4
WITH moyennes_sagas AS (
    SELECT 
        s.nom AS saga, 
        f.titre, 
        ROUND(AVG(n.note), 2) AS moyenne
    FROM films f
    JOIN sagas s ON f.saga_id = s.id
    JOIN notes n ON f.id = n.film_id
    GROUP BY s.nom, f.titre
)
SELECT 
    saga, 
    titre, 
    moyenne,
    RANK() OVER (PARTITION BY saga ORDER BY moyenne DESC) AS rang_dans_saga
FROM moyennes_sagas
ORDER BY saga, rang_dans_saga, titre;

-- 6.1
WITH visionnages_mensuels AS (
    SELECT 
        TO_CHAR(j.date_visionnage, 'YYYY-MM') AS mois,
        COUNT(*) AS nb
    FROM journal j
    JOIN utilisateurs u ON j.utilisateur_id = u.id
    WHERE u.pseudo = 'cinephile_92'
    GROUP BY TO_CHAR(j.date_visionnage, 'YYYY-MM')
)
SELECT 
    mois,
    nb,
    SUM(nb) OVER (ORDER BY mois) AS cumul
FROM visionnages_mensuels
ORDER BY mois;

-- 6.2
SELECT 
    n.note_le,
    u.pseudo,
    n.note,
    ROUND(AVG(n.note) OVER (ORDER BY n.note_le), 2) AS moyenne_cumulee
FROM notes n
JOIN films f ON n.film_id = f.id
JOIN utilisateurs u ON n.utilisateur_id = u.id
WHERE f.titre = 'Inception'
ORDER BY n.note_le;

-- 6.3
WITH moyennes_films AS (
    SELECT 
        film_id, 
        ROUND(AVG(note), 2) AS moyenne_film
    FROM notes
    GROUP BY film_id
)
SELECT 
    u.pseudo,
    f.titre,
    n.note,
    m.moyenne_film,
    n.note - m.moyenne_film AS ecart
FROM notes n
JOIN utilisateurs u ON n.utilisateur_id = u.id
JOIN films f ON n.film_id = f.id
JOIN moyennes_films m ON f.id = m.film_id
WHERE u.pseudo = 'nolanfan'
ORDER BY ecart DESC;

-- 6.4
SELECT 
    j.date_visionnage,
    f.titre,
    j.date_visionnage - LAG(j.date_visionnage) OVER (ORDER BY j.date_visionnage) AS jours_depuis_precedent
FROM journal j
JOIN utilisateurs u ON j.utilisateur_id = u.id
JOIN films f ON j.film_id = f.id
WHERE u.pseudo = 'cinephile_92'
ORDER BY j.date_visionnage;

-- 7.1
SELECT f.genre,
       COUNT(*)                              AS nb_notes,
       COUNT(*) FILTER (WHERE n.note >= 4.5) AS coups_de_coeur,
       COUNT(*) FILTER (WHERE n.note <= 2.5) AS deceptions
FROM notes n
JOIN films f ON f.id = n.film_id
GROUP BY f.genre
ORDER BY nb_notes DESC, f.genre;

-- 7.2
SELECT u.pseudo,
       ROUND(AVG(n.note) FILTER (WHERE f.genre = 'Science-fiction'), 2) AS moyenne_sf,
       ROUND(AVG(n.note), 2)                                           AS moyenne_globale
FROM notes n
JOIN films f        ON f.id = n.film_id
JOIN utilisateurs u ON u.id = n.utilisateur_id
GROUP BY u.pseudo
ORDER BY moyenne_sf DESC NULLS LAST, u.pseudo;

-- 7.3
SELECT CASE WHEN GROUPING(genre)     = 1 THEN 'TOTAL' ELSE genre     END AS genre,
       CASE WHEN GROUPING(trimestre) = 1 THEN 'Année' ELSE trimestre END AS trimestre,
       COUNT(*) AS visionnages
FROM (
    SELECT f.genre, 'T' || EXTRACT(QUARTER FROM j.date_visionnage) AS trimestre
    FROM journal j
    JOIN films f ON f.id = j.film_id
) t
GROUP BY ROLLUP (genre, trimestre)
ORDER BY GROUPING(genre), genre, GROUPING(trimestre), trimestre;

-- 8.1
SELECT titre, (details ->> 'duree')::INTEGER AS duree_min
FROM films
WHERE (details ->> 'duree')::INTEGER > 150
ORDER BY duree_min DESC;
-- 8.2
SELECT f.titre, f.annee, p.nom AS realisateur
FROM films f
JOIN casting c   ON c.film_id = f.id AND c.role = 'realisateur'
JOIN personnes p ON p.id = c.personne_id
WHERE f.details @> '{"oscar_meilleur_film": true}'
ORDER BY f.annee;
-- 8.3
SELECT t.tag, COUNT(*) AS nb_films
FROM films f
CROSS JOIN LATERAL jsonb_array_elements_text(f.details -> 'tags') AS t(tag)
GROUP BY t.tag
ORDER BY nb_films DESC, t.tag
LIMIT 5;
-- 8.4
SELECT u.pseudo, d.titre, d.date_visionnage
FROM utilisateurs u
CROSS JOIN LATERAL (
    SELECT f.titre, j.date_visionnage
    FROM journal j
    JOIN films f ON f.id = j.film_id
    WHERE j.utilisateur_id = u.id
    ORDER BY j.date_visionnage DESC, j.id DESC
    LIMIT 2
) d
ORDER BY u.pseudo, d.date_visionnage DESC;
-- 9.1
CREATE OR REPLACE VIEW v_fiche_film AS
SELECT f.id, f.titre, f.annee, f.genre,
       r.realisateurs,
       (f.details ->> 'duree')::INTEGER AS duree_min,
       s.nb_notes, s.moyenne
FROM films f
LEFT JOIN LATERAL (                       
    SELECT STRING_AGG(p.nom, ', ' ORDER BY p.nom) AS realisateurs
    FROM casting c JOIN personnes p ON p.id = c.personne_id
    WHERE c.film_id = f.id AND c.role = 'realisateur'
) r ON true
LEFT JOIN LATERAL (                       
    SELECT COUNT(*) AS nb_notes, ROUND(AVG(n.note), 2) AS moyenne
    FROM notes n WHERE n.film_id = f.id
) s ON true;

SELECT titre, annee, realisateurs, duree_min, nb_notes, moyenne
FROM v_fiche_film
WHERE genre = 'Science-fiction'
ORDER BY moyenne DESC;
-- 9.2
CREATE MATERIALIZED VIEW mv_stats_films AS
SELECT film_id, COUNT(*) AS nb_notes, ROUND(AVG(note), 2) AS moyenne
FROM notes
GROUP BY film_id;

CREATE UNIQUE INDEX ON mv_stats_films (film_id);

INSERT INTO notes (utilisateur_id, film_id, note, note_le)
SELECT u.id, f.id, 2.0, '2026-09-21'
FROM utilisateurs u, films f
WHERE u.pseudo = 'sofa_critic' AND f.titre = 'Inception';

SELECT f.titre, s.nb_notes, s.moyenne
FROM mv_stats_films s JOIN films f ON f.id = s.film_id
WHERE f.titre = 'Inception';

REFRESH MATERIALIZED VIEW CONCURRENTLY mv_stats_films;

SELECT f.titre, s.nb_notes, s.moyenne
FROM mv_stats_films s JOIN films f ON f.id = s.film_id
WHERE f.titre = 'Inception';
-- 9.3
CREATE OR REPLACE VIEW v_films_sf AS
SELECT id, titre, annee, genre
FROM films
WHERE genre = 'Science-fiction'
WITH CHECK OPTION;

UPDATE v_films_sf
SET genre = 'Action'
WHERE titre = 'Inception';

-- 10.1
CREATE OR REPLACE FUNCTION duree_texte(p_minutes INTEGER)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT (p_minutes / 60) || ' h ' || LPAD((p_minutes % 60)::TEXT, 2, '0');
$$;

SELECT titre, duree_texte((details ->> 'duree')::INTEGER) AS duree
FROM films
ORDER BY (details ->> 'duree')::INTEGER DESC
LIMIT 3;

-- 10.2
CREATE OR REPLACE FUNCTION note_ponderee(p_film_id INTEGER, p_m INTEGER DEFAULT 5)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_nb       INTEGER;
    v_moyenne  NUMERIC;
    v_globale  NUMERIC;
BEGIN
    SELECT COUNT(*), AVG(note) INTO v_nb, v_moyenne
    FROM notes WHERE film_id = p_film_id;

    IF v_nb = 0 THEN
        RAISE EXCEPTION 'Le film % n''a encore aucune note', p_film_id;
    END IF;

    SELECT AVG(note) INTO v_globale FROM notes;

    RETURN ROUND(  (v_nb::NUMERIC / (v_nb + p_m)) * v_moyenne
                 + (p_m::NUMERIC  / (v_nb + p_m)) * v_globale, 2);
END;
$$;

SELECT titre, nb_notes, moyenne,
       RANK() OVER (ORDER BY moyenne DESC)          AS rang_brut,
       note_ponderee(id)                            AS note_ponderee,
       RANK() OVER (ORDER BY note_ponderee(id) DESC) AS rang_pondere
FROM v_fiche_film
ORDER BY rang_pondere
LIMIT 5;

-- 10.3

CREATE OR REPLACE FUNCTION compatibilite(p_a TEXT, p_b TEXT)
RETURNS TABLE (titre VARCHAR, note_a NUMERIC, note_b NUMERIC, ecart NUMERIC)
LANGUAGE sql
STABLE
AS $$
    SELECT f.titre, na.note, nb.note, ABS(na.note - nb.note)
    FROM notes na
    JOIN utilisateurs ua ON ua.id = na.utilisateur_id AND ua.pseudo = p_a
    JOIN notes nb        ON nb.film_id = na.film_id
    JOIN utilisateurs ub ON ub.id = nb.utilisateur_id AND ub.pseudo = p_b
    JOIN films f         ON f.id = na.film_id
    ORDER BY ABS(na.note - nb.note) DESC, f.titre;
$$;

SELECT * FROM compatibilite('cinephile_92', 'nolanfan') LIMIT 5;

SELECT COUNT(*)             AS films_communs,
       ROUND(AVG(ecart), 2) AS ecart_moyen
FROM compatibilite('cinephile_92', 'nolanfan');


-- 11.1
EXPLAIN ANALYZE
SELECT f.titre, j.date_visionnage
FROM journal j
JOIN films f ON f.id = j.film_id
WHERE j.utilisateur_id = (
    SELECT id 
    FROM utilisateurs 
    WHERE pseudo = 'membre_4242'
)
ORDER BY j.date_visionnage DESC
LIMIT 20;



-- 11.2

EXPLAIN ANALYZE
SELECT film_id, COUNT(*) AS visionnages
FROM journal j
WHERE TO_CHAR(date_visionnage, 'YYYY-MM') = '2026-08'
GROUP BY film_id
ORDER BY COUNT(*) DESC
LIMIT 5;


-- 11.3

EXPLAIN ANALYZE
SELECT *
FROM films
WHERE genre = 'Science-fiction';

SELECT most_common_vals, most_common_freqs
FROM pg_stats
WHERE tablename = 'films' AND attname = 'genre';



-- 12.1

CREATE INDEX idx_journal_utilisateur_date 
ON journal (utilisateur_id, date_visionnage DESC);

-- 12.2

-- recommendation :
-- ajouter des conditions dans le where pour ne pas tourner inutilement sur des lignes qui ne vont pas nous servir
SELECT film_id, COUNT(*) AS visionnages
FROM journal
WHERE date_visionnage >= '2026-08-01' AND date_visionnage < '2026-09-01'
GROUP BY film_id
ORDER BY COUNT(*) DESC
LIMIT 5;

-- ajouter un index
CREATE INDEX idx_journal_date_film 
ON journal (date_visionnage, film_id);

SELECT 
    COUNT(*) FILTER (WHERE TO_CHAR(date_visionnage, 'YYYY-MM') = '2026-08') AS comptage_original,
    COUNT(*) FILTER (WHERE date_visionnage >= '2026-08-01' AND date_visionnage < '2026-09-01') AS comptage_optimise
FROM journal;

-- 12.3

-- 1. Mesure avant optimisation (déclenchera le Seq Scan de 48ms)
EXPLAIN (ANALYZE, BUFFERS)
SELECT COUNT(*) 
FROM films 
WHERE titre ILIKE '%labyrinthe%';

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX idx_films_titre_trgm ON films USING GIN (titre gin_trgm_ops);

EXPLAIN (ANALYZE, BUFFERS)
SELECT COUNT(*) 
FROM films 
WHERE titre ILIKE '%labyrinthe%';


-- 13.1 et 13.2
CREATE OR REPLACE FUNCTION noter(
    p_pseudo TEXT,
    p_titre TEXT,
    p_note NUMERIC,
    INOUT moyenne NUMERIC DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_utilisateur_id INTEGER;
    v_film_id INTEGER;
BEGIN
    -- 1. Validation de la note (entre 0,5 et 5, par demi-point)
    IF p_note < 0.5 OR p_note > 5.0 OR p_note % 0.5 <> 0 THEN
        RAISE EXCEPTION 'La note % est invalide. Elle doit être comprise entre 0,5 et 5, par paliers de 0,5.', p_note;
    END IF;

    -- 2. Vérification de l'existence du membre
    SELECT id INTO v_utilisateur_id 
    FROM utilisateurs 
    WHERE pseudo = p_pseudo;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Utilisateur introuvable : %', p_pseudo;
    END IF;

    -- 3. Vérification de l'existence du film
    SELECT id INTO v_film_id 
    FROM films 
    WHERE titre = p_titre;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Film introuvable : %', p_titre;
    END IF;

    -- 4. Enregistrement ou écrasement de la note (Upsert)
    INSERT INTO notes (utilisateur_id, film_id, note, note_le)
    VALUES (v_utilisateur_id, v_film_id, p_note, CURRENT_DATE)
    ON CONFLICT (utilisateur_id, film_id) 
    DO UPDATE SET 
        note = EXCLUDED.note,
        note_le = EXCLUDED.note_le;

    -- 5. Ajout systématique au journal de visionnage
    INSERT INTO journal (utilisateur_id, film_id, date_visionnage)
    VALUES (v_utilisateur_id, v_film_id, CURRENT_DATE);

    -- 6. Calcul de la nouvelle moyenne du film et assignation à la variable INOUT
    SELECT ROUND(AVG(note), 2) INTO moyenne
    FROM notes
    WHERE film_id = v_film_id;
END;
$$;

-- 13.3

CREATE OR REPLACE PROCEDURE recalculer_stats(p_lot INTEGER)
LANGUAGE plpgsql
AS $$
DECLARE
    v_film RECORD;
    v_compteur INTEGER := 0;
    v_nb INTEGER;
    v_moy NUMERIC;
BEGIN
    FOR v_film IN SELECT id FROM films LOOP
        -- Calcul des statistiques
        SELECT COUNT(*), ROUND(AVG(note), 2)
        INTO v_nb, v_moy
        FROM notes
        WHERE film_id = v_film.id;

        -- Insertion avec gestion des doublons au cas où la table n'est plus vide
        INSERT INTO films_stats (film_id, nb_notes, moyenne)
        VALUES (v_film.id, v_nb, v_moy)
        ON CONFLICT (film_id) DO UPDATE 
        SET nb_notes = EXCLUDED.nb_notes,
            moyenne = EXCLUDED.moyenne;

        v_compteur := v_compteur + 1;

        -- Validation (COMMIT) dès qu'un lot est atteint
        IF v_compteur % p_lot = 0 THEN
            COMMIT;
        END IF;
    END LOOP;

    -- Validation finale pour les lignes restantes
    COMMIT;
END;
$$;


-- 14.1

CREATE OR REPLACE FUNCTION rafraichir_stats_film()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_film_id INTEGER;
BEGIN
    -- Identification du film concerné selon l'opération
    v_film_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.film_id ELSE NEW.film_id END;

    -- Recalcul et mise à jour (Upsert)
    INSERT INTO films_stats (film_id, nb_notes, moyenne)
    SELECT v_film_id, 
           COUNT(*), 
           ROUND(AVG(note), 2)
    FROM notes
    WHERE film_id = v_film_id
    ON CONFLICT (film_id) DO UPDATE 
    SET nb_notes = EXCLUDED.nb_notes,
        moyenne = EXCLUDED.moyenne;

    -- Gestion du cas rare où un UPDATE déplacerait une note vers un autre film
    IF TG_OP = 'UPDATE' AND OLD.film_id <> NEW.film_id THEN
        INSERT INTO films_stats (film_id, nb_notes, moyenne)
        SELECT OLD.film_id, 
               COUNT(*), 
               ROUND(AVG(note), 2)
        FROM notes
        WHERE film_id = OLD.film_id
        ON CONFLICT (film_id) DO UPDATE 
        SET nb_notes = EXCLUDED.nb_notes,
            moyenne = EXCLUDED.moyenne;
    END IF;

    RETURN NULL; 
END;
$$;

CREATE TRIGGER trg_maj_stats
AFTER INSERT OR UPDATE OR DELETE ON notes
FOR EACH ROW
EXECUTE FUNCTION rafraichir_stats_film();

-- test
SELECT noter('bobine', 'The Artist', 5.0);

SELECT f.titre, s.nb_notes, s.moyenne
FROM films_stats s
JOIN films f ON f.id = s.film_id
WHERE f.titre = 'The Artist';

-- 14.2

CREATE OR REPLACE FUNCTION auditer_note()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO audit_notes (utilisateur_id, film_id, ancienne, nouvelle, le)
    VALUES (OLD.utilisateur_id, OLD.film_id, OLD.note, NEW.note, CURRENT_TIMESTAMP);
    
    RETURN NEW;
END;
$$;

-- 14.3

WITH StatsReelles AS (
    SELECT 
        film_id, 
        COUNT(*) AS vrai_nb_notes, 
        ROUND(AVG(note), 2) AS vraie_moyenne
    FROM notes
    GROUP BY film_id
)
SELECT COUNT(*) AS films_incoherents
FROM films_stats fs
LEFT JOIN StatsReelles sr ON fs.film_id = sr.film_id
WHERE fs.nb_notes IS DISTINCT FROM COALESCE(sr.vrai_nb_notes, 0)
   OR fs.moyenne IS DISTINCT FROM sr.vraie_moyenne;


-- 15.2
BEGIN;
SELECT nb_vues FROM films WHERE titre = 'Inception' FOR UPDATE;

UPDATE films 
SET nb_vues = nb_vues + 1 
WHERE titre = 'Inception' 
RETURNING nb_vues;

COMMIT;

-- 15.3

SELECT COUNT(*) AS visionnages FROM journal WHERE utilisateur_id = 5;
BEGIN;
INSERT INTO journal (utilisateur_id, film_id, date_visionnage) VALUES (5, 12, '2026-09-25');
INSERT INTO journal (utilisateur_id, film_id, date_visionnage) VALUES (5, 20, '2026-09-25');
INSERT INTO journal (utilisateur_id, film_id, date_visionnage) VALUES (5, 99999, '2026-09-25'); --erreur ici 
ROLLBACK;
SELECT COUNT(*) AS visionnages FROM journal WHERE utilisateur_id = 5;


-- 16.1
CREATE ROLE filmbox_app WITH LOGIN PASSWORD 'mot_de_passe_app';

GRANT USAGE ON SCHEMA public TO filmbox_app;

REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM filmbox_app;

GRANT SELECT ON films, utilisateurs, notes, journal TO filmbox_app;

GRANT INSERT, UPDATE ON notes, journal TO filmbox_app;


-- 16.2
                                                                                   
CREATE POLICY journal_select_policy ON journal                                          
FOR SELECT                                                                              
TO filmbox_app                                                                          
USING (                                                                                 
    NOT prive                                                                           
    OR utilisateur_id = NULLIF(current_setting('app.membre_id', true), '')::INTEGER     
);                                                                                       
                    
                                                                                            
-- Un membre ne peut écrire qu'en son propre nom.                                            
                                                                                            
--1. Pour l'insertion (INSERT) : on s'assure que l'utilisateur_id de la nouvelle ligne correspond bien à la session courante                                                 
                                                                                            
CREATE POLICY journal_insert_policy ON journal                                          
FOR INSERT                                                                              
TO filmbox_app                                                                          
WITH CHECK (                                                                            
    utilisateur_id = NULLIF(current_setting('app.membre_id', true), '')::INTEGER        
);                                                                                      
                                                                                            
-- 2. Pour la modification (UPDATE) : on s'assure qu'il ne peut modifier que ses propres     

                                                                                            
CREATE POLICY journal_update_policy ON journal                                          
FOR UPDATE                                                                              
TO filmbox_app                                                                          
USING (                                                                                 
    utilisateur_id = NULLIF(current_setting('app.membre_id', true), '')::INTEGER        
)                                                                                       
WITH CHECK (                                                                            
    utilisateur_id = NULLIF(current_setting('app.membre_id', true), '')::INTEGER        
);

-- 16.3

CREATE OR REPLACE FUNCTION rechercher_films(texte TEXT)
RETURNS SETOF films
LANGUAGE sql
STABLE
AS $$
    SELECT *
    FROM films
    WHERE titre ILIKE '%' || texte || '%'
    LIMIT 5;
$$;

