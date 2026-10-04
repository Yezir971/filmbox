// --no-request: ALTER TABLE liste ADD COLUMN IF NOT EXISTS description TEXT;
// --no-request: ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS avatar_url TEXT;
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getMediaForTitle } from "@/lib/db/mapper";
import type { Liste } from "@/types/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Requête m1.2 / m1.4 de exo.sql : Listes publiques et décompte des films
    const sql = `
      SELECT 
        l.id, 
        l.titre, 
        l.membre, 
        l.visibility, 
        l.create_at,
        COUNT(lf.id) AS film_count,
        ARRAY_AGG(lf.film ORDER BY lf.position ASC) FILTER (WHERE lf.film IS NOT NULL) AS films
      FROM liste l
      LEFT JOIN liste_film lf ON lf.liste_id = l.id
      WHERE l.visibility = 'public'
      GROUP BY l.id, l.titre, l.membre, l.visibility, l.create_at
      ORDER BY l.create_at DESC, l.id DESC;
    `;

    const res = await query(sql);

    const lists: Liste[] = res.rows.map((row: any) => {
      const filmTitles: string[] = Array.isArray(row.films) ? row.films.slice(0, 4) : [];
      const coverPosters = filmTitles.map((t) => getMediaForTitle(t).poster);

      return {
        id: String(row.id),
        title: row.titre,
        description: `Collection créée par ${row.membre}`,
        authorPseudo: row.membre,
        authorAvatarUrl: "",
        filmCount: parseInt(row.film_count || "0", 10),
        isPublic: row.visibility === "public",
        coverPosters: coverPosters.length > 0 ? coverPosters : [
          "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80",
        ],
        createdAt: new Date(row.create_at).toISOString(),
        updatedAt: new Date(row.create_at).toISOString(),
      };
    });

    return NextResponse.json(lists);
  } catch (err) {
    console.error("[API /lists] DB error:", err);
    return NextResponse.json({ error: "Erreur lors de la récupération des listes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const membre = body.authorPseudo || "cinephile_92";
    const titre = body.title || "Ma Liste FilmBox";
    const visibility = body.isPublic ? "public" : "privé";

    // Insertion m1.4 de exo.sql
    const insertSql = `
      INSERT INTO liste (membre, titre, visibility)
      VALUES ($1, $2, $3)
      RETURNING id, membre, titre, visibility, create_at;
    `;

    const res = await query(insertSql, [membre, titre, visibility]);
    const row = res.rows[0];

    const newList: Liste = {
      id: String(row.id),
      title: row.titre,
      description: body.description || "",
      authorPseudo: row.membre,
      authorAvatarUrl: "",
      filmCount: 0,
      isPublic: row.visibility === "public",
      coverPosters: [],
      createdAt: new Date(row.create_at).toISOString(),
      updatedAt: new Date(row.create_at).toISOString(),
    };

    return NextResponse.json(newList, { status: 201 });
  } catch (err) {
    console.error("[API POST /lists] DB error:", err);
    return NextResponse.json({ error: "Impossible de créer la liste" }, { status: 500 });
  }
}
