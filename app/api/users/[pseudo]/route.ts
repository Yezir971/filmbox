// --no-request: ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS avatar_url TEXT, ADD COLUMN IF NOT EXISTS bio TEXT, ADD COLUMN IF NOT EXISTS email VARCHAR(120);
// --no-request: ALTER TABLE films ADD COLUMN IF NOT EXISTS poster_url TEXT;
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getMediaForTitle } from "@/lib/db/mapper";
import type { Profil } from "@/types/api";

export async function GET(
  request: NextRequest,
  { params }: { params: { pseudo: string } }
) {
  const pseudo = decodeURIComponent(params.pseudo || "cinephile_92");

  try {
    // Requête M3.1 de exo.sql : Statistiques du profil utilisateur
    const sql = `
      WITH cible AS (
          SELECT id, pseudo 
          FROM utilisateurs 
          WHERE LOWER(pseudo) = LOWER($1)
      ), 
      nb_notes AS (
          SELECT COUNT(DISTINCT n.film_id) AS nb_films_notes 
          FROM notes n INNER JOIN cible c ON c.id=n.utilisateur_id 
      ), 
      stat_note AS (
          SELECT ROUND(AVG(n.note), 2) AS note_moyenne 
          FROM notes n INNER JOIN cible c ON c.id=n.utilisateur_id
      ), 
      genre_top AS (
          SELECT f.genre AS genre_prefere 
          FROM notes n 
          JOIN cible c ON n.utilisateur_id = c.id 
          JOIN films f ON n.film_id = f.id 
          GROUP BY f.genre 
          ORDER BY COUNT(n.film_id) DESC, f.genre ASC 
          LIMIT 1
      ), 
      coup_de_coeur AS (
          SELECT f.id AS film_id, f.titre AS film_coup_de_coeur, f.annee AS coup_de_coeur_annee
          FROM notes n
          JOIN cible c ON n.utilisateur_id = c.id
          JOIN films f ON n.film_id = f.id
          ORDER BY 
              n.note DESC,
              n.note_le ASC,
              f.id ASC
          LIMIT 1
      ) 
      SELECT 
          c.id,
          c.pseudo, 
          COALESCE(nbn.nb_films_notes, 0) AS nb_films_notes, 
          COALESCE(sn.note_moyenne, 0) AS note_moyenne, 
          COALESCE(gt.genre_prefere, 'Cinéma') AS genre_prefere,
          cdc.film_coup_de_coeur,
          cdc.film_id AS coup_de_coeur_id,
          cdc.coup_de_coeur_annee
      FROM cible c
      LEFT JOIN nb_notes nbn ON true
      LEFT JOIN stat_note sn ON true
      LEFT JOIN genre_top gt ON true
      LEFT JOIN coup_de_coeur cdc ON true;
    `;

    const res = await query(sql, [pseudo]);

    if (!res.rows || res.rows.length === 0 || !res.rows[0].id) {
      return NextResponse.json({ error: `Utilisateur "${pseudo}" non trouvé` }, { status: 404 });
    }

    const row = res.rows[0];

    // Récupérer le nombre de visionnages dans le journal
    const journalCountSql = `
      SELECT COUNT(*) AS total_screenings,
             COALESCE(SUM((f.details ->> 'duree')::INTEGER), 0) AS total_minutes
      FROM journal j
      JOIN films f ON f.id = j.film_id
      WHERE j.utilisateur_id = $1;
    `;
    const journalRes = await query(journalCountSql, [row.id]);
    const totalScreenings = parseInt(journalRes.rows[0]?.total_screenings || "0", 10);
    const totalMinutes = parseInt(journalRes.rows[0]?.total_minutes || "0", 10);

    const profile: Profil = {
      id: String(row.id),
      pseudo: row.pseudo,
      avatarUrl: "",
      bio: `Cinéphile passionné de ${row.genre_prefere}.`,
      favoriteFilm: row.film_coup_de_coeur ? {
        id: String(row.coup_de_coeur_id),
        title: row.film_coup_de_coeur,
        posterUrl: getMediaForTitle(row.film_coup_de_coeur).poster,
        releaseYear: row.coup_de_coeur_annee || 2000,
      } : undefined,
      favoriteGenre: row.genre_prefere,
      stats: {
        totalFilmsWatched: totalScreenings || parseInt(row.nb_films_notes, 10),
        totalHoursWatched: Math.round(totalMinutes / 60),
        averageRatingGiven: parseFloat(row.note_moyenne) || 0,
        totalReviews: parseInt(row.nb_films_notes, 10) || 0,
      },
    };

    return NextResponse.json(profile);
  } catch (err) {
    console.error(`[API /users/${params.pseudo}] DB error:`, err);
    return NextResponse.json({ error: "Erreur serveur lors de la récupération du profil" }, { status: 500 });
  }
}
