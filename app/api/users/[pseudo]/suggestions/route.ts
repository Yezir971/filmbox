import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { mapRowToFilm } from "@/lib/db/mapper";
import { MOCK_SUGGESTIONS } from "@/lib/mock-data";
import type { Suggestion } from "@/types/api";

export async function GET(
  request: NextRequest,
  { params }: { params: { pseudo: string } }
) {
  const pseudo = decodeURIComponent(params.pseudo || "cinephile_92");

  try {
    // Requête 3.2 de exo.sql : Découverte / suggestions des films non encore vus
    const sql = `
      SELECT 
          f.id, 
          f.titre, 
          f.annee, 
          f.genre, 
          f.details,
          v.realisateurs,
          v.duree_min,
          v.nb_notes,
          v.moyenne,
          duree_texte((f.details ->> 'duree')::INTEGER) AS duree_texte,
          COALESCE(note_ponderee(f.id), v.moyenne) AS note_ponderee
      FROM films f
      LEFT JOIN v_fiche_film v ON v.id = f.id
      LEFT JOIN (
          SELECT j.film_id 
          FROM journal j
          JOIN utilisateurs u ON j.utilisateur_id = u.id
          WHERE LOWER(u.pseudo) = LOWER($1)
      ) vus ON f.id = vus.film_id
      WHERE vus.film_id IS NULL
      ORDER BY 
          f.annee DESC, 
          f.titre ASC
      LIMIT 15;
    `;

    const res = await query(sql, [pseudo]);

    if (res.rows.length > 0) {
      const suggestions: Suggestion[] = res.rows.map((row: any, idx: number) => ({
        film: mapRowToFilm(row),
        matchScore: Math.max(75, 98 - idx * 2),
        reason: `Recommandé selon vos goûts en ${row.genre} (${row.realisateurs || "Culte"})`,
      }));

      return NextResponse.json(suggestions);
    }
  } catch (err) {
    console.warn(`[API /users/${params.pseudo}/suggestions] DB query fallback:`, err);
  }

  return NextResponse.json(MOCK_SUGGESTIONS);
}
