import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { MOCK_LISTS } from "@/lib/mock-data";
import type { Liste } from "@/types/api";

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
        COUNT(lf.id) AS film_count
      FROM liste l
      LEFT JOIN liste_film lf ON lf.liste_id = l.id
      WHERE l.visibility = 'public'
      GROUP BY l.id, l.titre, l.membre, l.visibility, l.create_at
      ORDER BY l.create_at DESC, l.id DESC;
    `;

    const res = await query(sql);

    if (res.rows.length > 0) {
      const lists: Liste[] = res.rows.map((row: any) => ({
        id: String(row.id),
        title: row.titre,
        description: `Collection créée par ${row.membre}`,
        authorPseudo: row.membre,
        authorAvatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
        filmCount: parseInt(row.film_count || "0", 10),
        isPublic: row.visibility === "public",
        coverPosters: [
          "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80",
        ],
        createdAt: new Date(row.create_at).toISOString(),
        updatedAt: new Date(row.create_at).toISOString(),
      }));

      return NextResponse.json(lists);
    }
  } catch (err) {
    console.warn("[API /lists] DB query fallback:", err);
  }

  const publicLists: Liste[] = MOCK_LISTS.map(({ items, ...rest }) => rest);
  return NextResponse.json(publicLists);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const membre = body.authorPseudo || "yoda";
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
      authorAvatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
      filmCount: 0,
      isPublic: row.visibility === "public",
      coverPosters: [],
      createdAt: new Date(row.create_at).toISOString(),
      updatedAt: new Date(row.create_at).toISOString(),
    };

    return NextResponse.json(newList, { status: 201 });
  } catch (err) {
    console.warn("[API POST /lists] DB query fallback:", err);
    const body = await request.json().catch(() => ({}));
    const newList: Liste = {
      id: `list-${Date.now()}`,
      title: body.title || "Nouvelle liste",
      description: body.description || "",
      authorPseudo: "Alice",
      authorAvatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
      filmCount: 0,
      isPublic: Boolean(body.isPublic),
      coverPosters: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return NextResponse.json(newList, { status: 201 });
  }
}
