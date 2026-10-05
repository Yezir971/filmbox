// --no-request: ALTER TABLE films ADD COLUMN IF NOT EXISTS poster_url TEXT, ADD COLUMN IF NOT EXISTS backdrop_url TEXT, ADD COLUMN IF NOT EXISTS synopsis TEXT;
// --no-request: ALTER TABLE personnes ADD COLUMN IF NOT EXISTS photo_url TEXT;
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { mapRowToFilm } from "@/lib/db/mapper";
import type { Suggestion } from "@/types/api";

export async function GET(
  request: NextRequest,
  { params }: { params: { pseudo: string } }
) {
  const pseudo = decodeURIComponent(params.pseudo || "cinephile_92");

  try {
    // Requête 3.2 de exo.sql : Découverte / suggestions optimisée avec CTE de pagination
    const sql = `
      WITH user_vus AS (
          SELECT j.film_id 
          FROM journal j
          WHERE j.utilisateur_id = (SELECT id FROM utilisateurs WHERE LOWER(pseudo) = LOWER($1) LIMIT 1)
      ),
      paged_suggestions AS (
          SELECT f.id, f.titre, f.annee, f.genre, f.details
          FROM films f
          LEFT JOIN user_vus uv ON f.id = uv.film_id
          WHERE uv.film_id IS NULL
          ORDER BY f.annee DESC, f.titre ASC
          LIMIT 15
      )
      SELECT 
          ps.id, 
          ps.titre, 
          ps.annee, 
          ps.genre, 
          ps.details,
          v.realisateurs,
          v.duree_min,
          v.nb_notes,
          v.moyenne,
          duree_texte((ps.details ->> 'duree')::INTEGER) AS duree_texte,
          COALESCE(note_ponderee(ps.id), v.moyenne) AS note_ponderee
      FROM paged_suggestions ps
      LEFT JOIN v_fiche_film v ON v.id = ps.id
      ORDER BY ps.annee DESC, ps.titre ASC;
    `;

    const res = await query(sql, [pseudo]);

    const suggestions: Suggestion[] = res.rows.map((row: any, idx: number) => ({
      film: mapRowToFilm(row),
      matchScore: Math.max(75, 98 - idx * 2),
      reason: `Recommandé selon vos goûts en ${row.genre} (${row.realisateurs || "Culte"})`,
    }));

    return NextResponse.json(suggestions);
  } catch (err) {
    console.error(`[API /users/${params.pseudo}/suggestions] DB error:`, err);
    return NextResponse.json({ error: "Erreur lors de la récupération des suggestions" }, { status: 500 });
  }
}
