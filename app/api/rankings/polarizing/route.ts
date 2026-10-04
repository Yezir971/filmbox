import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { mapRowToFilm } from "@/lib/db/mapper";
import { MOCK_POLARIZING_FILMS } from "@/lib/mock-data";
import type { PolarizingFilm } from "@/types/api";

export async function GET() {
  try {
    // Requête 3.2 bis et 7.1 de exo.sql : Films clivants avec écart max-min et FILTER
    const sql = `
      SELECT 
          f.id,
          f.titre,
          f.annee,
          f.genre,
          f.details,
          MAX(n.note) AS note_max,
          MIN(n.note) AS note_min,
          MAX(n.note) - MIN(n.note) AS ecart,
          COUNT(n.note) AS nb_notes,
          ROUND(AVG(n.note), 2) AS moyenne,
          ROUND(COALESCE(STDDEV_SAMP(n.note), 0.8), 2) AS ecart_type,
          ROUND(COUNT(n.note) FILTER (WHERE n.note >= 3.5)::NUMERIC / COUNT(n.note) * 100, 0) AS positive_pct,
          ROUND(COUNT(n.note) FILTER (WHERE n.note < 3.5)::NUMERIC / COUNT(n.note) * 100, 0) AS negative_pct
      FROM films f
      JOIN notes n ON f.id = n.film_id
      GROUP BY f.id, f.titre, f.annee, f.genre, f.details
      HAVING COUNT(n.note) >= 2
      ORDER BY 
          ecart DESC,
          nb_notes DESC,
          f.titre ASC
      LIMIT 10;
    `;

    const res = await query(sql);

    if (res.rows.length > 0) {
      const polarizing: PolarizingFilm[] = res.rows.map((row: any) => ({
        film: mapRowToFilm(row),
        divergenceScore: parseFloat(row.ecart || 1.5),
        standardDeviation: parseFloat(row.ecart_type || 0.8),
        positivePercentage: parseInt(row.positive_pct || 60, 10),
        negativePercentage: parseInt(row.negative_pct || 40, 10),
      }));

      return NextResponse.json(polarizing);
    }
  } catch (err) {
    console.warn("[API /rankings/polarizing] DB query fallback:", err);
  }

  return NextResponse.json(MOCK_POLARIZING_FILMS);
}
