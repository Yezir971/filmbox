import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { mapRowToFilm } from "@/lib/db/mapper";
import { MOCK_FILMS } from "@/lib/mock-data";

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
    // Construction dynamique basée sur les requêtes M2.1, 8.1, 8.2, 8.3 et la vue v_fiche_film
    let whereClauses: string[] = [];
    let params: any[] = [];
    let paramIndex = 1;

    if (genre && genre !== "all") {
      whereClauses.push(`LOWER(f.genre) = LOWER($${paramIndex++})`);
      params.push(genre);
    }

    if (decade && decade !== "all") {
      const startYear = parseInt(decade, 10);
      whereClauses.push(`f.annee >= $${paramIndex++} AND f.annee < $${paramIndex++}`);
      params.push(startYear, startYear + 10);
    }

    if (search) {
      whereClauses.push(`(
        LOWER(f.titre) LIKE $${paramIndex} OR 
        EXISTS (
          SELECT 1 FROM casting c 
          JOIN personnes p ON p.id = c.personne_id 
          WHERE c.film_id = f.id AND LOWER(p.nom) LIKE $${paramIndex}
        ) OR
        EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(COALESCE(f.details -> 'tags', '[]'::jsonb)) AS t(tag)
          WHERE LOWER(t.tag) LIKE $${paramIndex}
        )
      )`);
      params.push(`%${search}%`);
      paramIndex++;
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

    // Total count
    const countSql = `SELECT COUNT(*) AS total FROM films f ${whereSql};`;
    const countRes = await query(countSql, params);
    const total = parseInt(countRes.rows[0]?.total || "0", 10);

    // Fetch paginé via la vue v_fiche_film et la fonction note_ponderee de exo.sql
    const offset = (page - 1) * limit;
    const dataSql = `
      SELECT 
        f.id, 
        f.titre, 
        f.annee, 
        f.genre, 
        f.details, 
        f.saga_id,
        v.realisateurs, 
        v.duree_min, 
        v.nb_notes, 
        v.moyenne,
        duree_texte((f.details ->> 'duree')::INTEGER) AS duree_texte,
        COALESCE(note_ponderee(f.id), v.moyenne) AS note_ponderee
      FROM films f
      LEFT JOIN v_fiche_film v ON v.id = f.id
      ${whereSql}
      ORDER BY f.annee DESC, f.titre ASC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++};
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
    console.warn("[API /films] DB query fallback to mock:", error);
    let filtered = [...MOCK_FILMS];
    if (genre && genre !== "all") {
      filtered = filtered.filter((f) => f.genres.some((g) => g.toLowerCase() === genre.toLowerCase()));
    }
    if (decade && decade !== "all") {
      const startYear = parseInt(decade, 10);
      filtered = filtered.filter((f) => f.releaseYear >= startYear && f.releaseYear < startYear + 10);
    }
    if (search) {
      filtered = filtered.filter(
        (f) =>
          f.title.toLowerCase().includes(search) ||
          f.director.toLowerCase().includes(search) ||
          f.tags.some((t) => t.toLowerCase().includes(search))
      );
    }
    if (hasOscars) filtered = filtered.filter((f) => f.hasOscars);
    if (maxDuration) {
      const maxDur = parseInt(maxDuration, 10);
      filtered = filtered.filter((f) => f.durationMinutes <= maxDur);
    }
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const films = filtered.slice(startIndex, startIndex + limit);

    return NextResponse.json({ films, total, page, totalPages });
  }
}
