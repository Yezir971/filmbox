import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { mapRowToFilm } from "@/lib/db/mapper";
import { MOCK_RANKING_GENRES } from "@/lib/mock-data";
import type { RankingGenre } from "@/types/api";

export async function GET() {
  try {
    // Requête 5.1 de exo.sql : Top 3 par genre avec fonction de fenêtrage RANK()
    const sql = `
      WITH stats_films AS (
          SELECT 
              f.genre, 
              f.id,
              f.titre, 
              f.annee,
              f.details,
              ROUND(AVG(n.note), 2) AS moyenne,
              COUNT(n.note) AS nb_notes
          FROM films f
          JOIN notes n ON f.id = n.film_id
          GROUP BY f.id, f.genre, f.titre, f.annee, f.details
          HAVING COUNT(n.note) >= 3
      ),
      classement AS (
          SELECT 
              genre,
              id,
              titre,
              annee,
              details,
              moyenne,
              nb_notes,
              RANK() OVER (PARTITION BY genre ORDER BY moyenne DESC, titre ASC) AS rang
          FROM stats_films
      )
      SELECT 
          genre, 
          id,
          titre, 
          annee,
          details,
          moyenne,
          nb_notes,
          rang
      FROM classement
      WHERE rang <= 3
      ORDER BY genre, rang;
    `;

    const res = await query(sql);

    if (res.rows.length > 0) {
      const grouped: Record<string, any[]> = {};
      for (const row of res.rows) {
        if (!grouped[row.genre]) grouped[row.genre] = [];
        grouped[row.genre].push(mapRowToFilm(row));
      }

      const rankingGenres: RankingGenre[] = Object.entries(grouped).map(
        ([genre, topFilms]) => ({
          genre,
          topFilms,
          totalFilmsInGenre: topFilms.length,
        })
      );

      return NextResponse.json(rankingGenres);
    }
  } catch (err) {
    console.warn("[API /rankings/genres] DB query fallback:", err);
  }

  return NextResponse.json(MOCK_RANKING_GENRES);
}
