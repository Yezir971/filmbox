import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { mapRowToFilm } from "@/lib/db/mapper";

export const dynamic = "force-dynamic";

/**
 * Endpoint de recherche rapide utilisant la fonction SQL PostgreSQL :
 * rechercher_films(texte TEXT) -> SETOF films (Exercice 16.3)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || searchParams.get("query") || searchParams.get("search");

  if (!q || q.trim().length === 0) {
    return NextResponse.json({ films: [] });
  }

  try {
    const sql = `
      SELECT 
        rf.id, 
        rf.titre, 
        rf.annee, 
        rf.genre, 
        rf.details, 
        rf.saga_id,
        v.realisateurs, 
        v.duree_min, 
        v.nb_notes, 
        v.moyenne,
        duree_texte((rf.details ->> 'duree')::INTEGER) AS duree_texte,
        COALESCE(note_ponderee(rf.id), v.moyenne) AS note_ponderee
      FROM rechercher_films($1) rf
      LEFT JOIN v_fiche_film v ON v.id = rf.id
      ORDER BY rf.annee DESC, rf.titre ASC;
    `;

    const result = await query(sql, [q.trim()]);
    const films = result.rows.map(mapRowToFilm);

    return NextResponse.json({ films });
  } catch (error) {
    console.error("[API /films/search] DB query error:", error);
    return NextResponse.json(
      { films: [], error: "Erreur lors de la recherche de films" },
      { status: 500 }
    );
  }
}
