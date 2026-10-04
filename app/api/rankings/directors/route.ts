import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { MOCK_RANKING_DIRECTORS } from "@/lib/mock-data";
import type { RankingDirector } from "@/types/api";

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

    if (res.rows.length > 0) {
      // Pour chaque réalisateur, récupérer son top film
      const directors: RankingDirector[] = await Promise.all(
        res.rows.map(async (row: any) => {
          const topFilmSql = `
            SELECT f.id, f.titre, ROUND(AVG(n.note), 2) AS moyenne, f.annee
            FROM films f
            JOIN casting c ON c.film_id = f.id AND c.personne_id = $1 AND c.role = 'realisateur'
            LEFT JOIN notes n ON n.film_id = f.id
            GROUP BY f.id, f.titre, f.annee
            ORDER BY moyenne DESC NULLS LAST
            LIMIT 3;
          `;
          const topFilmRes = await query(topFilmSql, [row.id]);

          return {
            directorId: String(row.id),
            name: row.realisateur,
            photoUrl: `https://images.unsplash.com/photo-${1500000000000 + (row.id * 1234567) % 100000000}?w=400&auto=format&fit=crop&q=80`,
            averageRating: parseFloat(row.moyenne || 4.0),
            filmCount: parseInt(row.nb_films || 1, 10),
            topFilms: topFilmRes.rows.map((tf: any) => ({
              id: String(tf.id),
              title: tf.titre,
              weightedRating: parseFloat(tf.moyenne || 4.0),
              releaseYear: tf.annee,
            })),
          };
        })
      );

      return NextResponse.json(directors);
    }
  } catch (err) {
    console.warn("[API /rankings/directors] DB query fallback:", err);
  }

  return NextResponse.json(MOCK_RANKING_DIRECTORS);
}
