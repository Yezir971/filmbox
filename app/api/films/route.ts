import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { mapRowToFilm } from "@/lib/db/mapper";

// --no-request: ALTER TABLE films ADD COLUMN IF NOT EXISTS poster_url TEXT, ADD COLUMN IF NOT EXISTS backdrop_url TEXT, ADD COLUMN IF NOT EXISTS synopsis TEXT;
// --no-request: SELECT f.id, f.titre, f.annee, f.genre, f.details, f.poster_url, f.backdrop_url, f.synopsis FROM films f;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const genre = searchParams.get("genre");
  const decade = searchParams.get("decade");
  const search = searchParams.get("search")?.toLowerCase();
  const hasOscars = searchParams.get("hasOscars") === "true";
  const maxDuration = searchParams.get("maxDuration");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  try {
    // Construction dynamique basée sur les requêtes M2.1, 8.1, 8.2, 8.3 et la fonction rechercher_films (16.3)
    let whereClauses: string[] = [];
    let params: any[] = [];
    let paramIndex = 1;

    const hasSearch = Boolean(search && search.trim().length > 0);
    const tableSource = hasSearch ? `rechercher_films($${paramIndex++})` : `films`;
    if (hasSearch) {
      params.push(search!.trim());
    }

    if (genre && genre !== "all") {
      whereClauses.push(`LOWER(f.genre) = LOWER($${paramIndex++})`);
      params.push(genre);
    }

    if (decade && decade !== "all") {
      const startYear = parseInt(decade, 10);
      whereClauses.push(`f.annee >= $${paramIndex++} AND f.annee < $${paramIndex++}`);
      params.push(startYear, startYear + 10);
    }

    if (hasOscars) {
      whereClauses.push(`f.details @> '{"oscar_meilleur_film": true}'`);
    }

    if (maxDuration) {
      const maxDur = parseInt(maxDuration, 10);
      whereClauses.push(`(f.details ->> 'duree')::INTEGER <= $${paramIndex++}`);
      params.push(maxDur);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // Total count en base (estimation rapide si aucun filtre, sinon count exact indexé)
    const countSql = !hasSearch && whereClauses.length === 0
      ? `SELECT reltuples::BIGINT AS total FROM pg_class WHERE relname = 'films';`
      : `SELECT COUNT(*) AS total FROM ${tableSource} f ${whereSql};`;
    const countRes = await query(countSql, (!hasSearch && whereClauses.length === 0) ? [] : params);
    const total = parseInt(countRes.rows[0]?.total || "0", 10);

    // Fetch paginé optimisé : filtrage et tri sur les IDs d'abord via CTE, puis enrichissement
    const offset = (page - 1) * limit;
    const dataSql = `
      WITH paged_films AS (
        SELECT 
          f.id, 
          f.titre, 
          f.annee, 
          f.genre, 
          f.details, 
          f.saga_id
        FROM ${tableSource} f
        ${whereSql}
        ORDER BY f.annee DESC, f.titre ASC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      )
      SELECT 
        pf.id, 
        pf.titre, 
        pf.annee, 
        pf.genre, 
        pf.details, 
        pf.saga_id,
        v.realisateurs, 
        v.duree_min, 
        v.nb_notes, 
        v.moyenne,
        duree_texte((pf.details ->> 'duree')::INTEGER) AS duree_texte,
        COALESCE(note_ponderee(pf.id), v.moyenne) AS note_ponderee
      FROM paged_films pf
      LEFT JOIN v_fiche_film v ON v.id = pf.id
      ORDER BY pf.annee DESC, pf.titre ASC;
    `;

    const dataRes = await query(dataSql, [...params, limit, offset]);
    const films = dataRes.rows.map(mapRowToFilm);
    const totalPages = Math.ceil(total / limit) || 1;

    return NextResponse.json({
      films,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    console.error("[API /films] DB query error:", error);
    return NextResponse.json(
      { films: [], total: 0, page: 1, totalPages: 1, error: "Erreur de base de données" },
      { status: 500 }
    );
  }
}
