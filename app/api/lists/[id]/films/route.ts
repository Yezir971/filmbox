import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { MOCK_LISTS, MOCK_FILMS } from "@/lib/mock-data";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const listId = parseInt(params.id, 10);
  const body = await request.json();

  if (!isNaN(listId)) {
    try {
      // Récupérer le titre du film
      let filmTitle = body.filmTitle;
      if (!filmTitle && body.filmId) {
        const filmRes = await query("SELECT titre FROM films WHERE id = $1", [parseInt(body.filmId, 10)]);
        if (filmRes.rows.length > 0) filmTitle = filmRes.rows[0].titre;
      }
      filmTitle = filmTitle || "Inception";

      // Récupérer la dernière position
      const posRes = await query(
        "SELECT COALESCE(MAX(position), 0) + 1 AS next_pos FROM liste_film WHERE liste_id = $1",
        [listId]
      );
      const nextPosition = parseInt(posRes.rows[0]?.next_pos || "1", 10);

      // Insertion m1.4 de exo.sql
      const insertSql = `
        INSERT INTO liste_film (liste_id, position, film)
        VALUES ($1, $2, $3)
        RETURNING id, liste_id, position, film;
      `;
      await query(insertSql, [listId, nextPosition, filmTitle]);

      return NextResponse.json({ success: true, position: nextPosition, film: filmTitle }, { status: 201 });
    } catch (err) {
      console.warn(`[API POST /lists/${params.id}/films] DB query fallback:`, err);
    }
  }

  const film = MOCK_FILMS.find((f) => f.id === body.filmId) || MOCK_FILMS[0];
  const list = MOCK_LISTS.find((l) => l.id === params.id) || MOCK_LISTS[0];

  const updatedList = {
    ...list,
    filmCount: list.filmCount + 1,
    items: [
      ...list.items,
      {
        position: list.items.length + 1,
        film,
        addedAt: new Date().toISOString(),
        comment: body.comment,
      },
    ],
  };

  return NextResponse.json(updatedList, { status: 201 });
}
