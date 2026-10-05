// --no-request: ALTER TABLE personnes ADD COLUMN IF NOT EXISTS photo_url TEXT;
// --no-request: ALTER TABLE films ADD COLUMN IF NOT EXISTS poster_url TEXT;
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getPersonPhotoSync } from "@/lib/tmdb";
import type { RankingDirector } from "@/types/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Requête 5.2 de exo.sql : Palmarès des réalisateurs avec DENSE_RANK()
    const sql = `
      WITH stats_realisateurs AS (
          SELECT 
              p.id,
              p.nom AS realisateur, 
              ROUND(AVG(n.note), 2) AS moyenne,
              COUNT(n.note) AS nb_notes,
              COUNT(DISTINCT c.film_id) AS nb_films
          FROM personnes p
          JOIN casting c ON p.id = c.personne_id
          JOIN notes n ON c.film_id = n.film_id
          WHERE c.role = 'realisateur'
          GROUP BY p.id, p.nom
      )
      SELECT 
          DENSE_RANK() OVER (ORDER BY moyenne DESC) AS rang,
          id,
          realisateur,
          moyenne,
          nb_notes,
          nb_films
      FROM stats_realisateurs
      ORDER BY rang, realisateur;
    `;

    const res = await query(sql);

    // Pour chaque réalisateur, récupérer ses meilleurs films
    const directors: RankingDirector[] = await Promise.all(
      res.rows.map(async (row: any) => {
        const topFilmSql = `
          SELECT f.id, f.titre, COALESCE(s.moyenne, 0) AS moyenne, f.annee
          FROM films f
          JOIN casting c ON c.film_id = f.id AND c.personne_id = $1 AND c.role = 'realisateur'
          LEFT JOIN mv_stats_films s ON s.film_id = f.id
          ORDER BY s.moyenne DESC NULLS LAST
          LIMIT 3;
        `;
        const topFilmRes = await query(topFilmSql, [row.id]);

        return {
          directorId: String(row.id),
          name: row.realisateur,
          photoUrl: getPersonPhotoSync(row.realisateur),
          averageRating: parseFloat(row.moyenne || "0"),
          filmCount: parseInt(row.nb_films || "0", 10),
          topFilms: topFilmRes.rows.map((tf: any) => ({
            id: String(tf.id),
            title: tf.titre,
            weightedRating: parseFloat(tf.moyenne || "0"),
            releaseYear: tf.annee,
          })),
        };
      })
    );

    return NextResponse.json(directors);
  } catch (err) {
    console.error("[API /rankings/directors] DB error:", err);
    return NextResponse.json({ error: "Erreur lors de la récupération des réalisateurs" }, { status: 500 });
  }
}
