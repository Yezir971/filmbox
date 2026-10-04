// --no-request: ALTER TABLE liste_film ADD COLUMN IF NOT EXISTS note_personnelle TEXT;
// --no-request: ALTER TABLE films ADD COLUMN IF NOT EXISTS poster_url TEXT;
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const listId = parseInt(params.id, 10);
  if (isNaN(listId)) {
    return NextResponse.json({ error: "Identifiant de liste invalide" }, { status: 400 });
  }

  try {
    const body = await request.json();

    // Récupérer le titre du film
    let filmTitle = body.filmTitle;
    if (!filmTitle && body.filmId) {
      const filmRes = await query("SELECT titre FROM films WHERE id = $1", [parseInt(body.filmId, 10)]);
      if (filmRes.rows.length > 0) filmTitle = filmRes.rows[0].titre;
    }

    if (!filmTitle) {
      return NextResponse.json({ error: "Titre ou filmId requis pour l'ajout à la liste" }, { status: 400 });
    }

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
    const result = await query(insertSql, [listId, nextPosition, filmTitle]);
    const row = result.rows[0];

    return NextResponse.json(
      {
        id: String(row.id),
        listeId: String(row.liste_id),
        position: row.position,
        film: row.film,
        success: true,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error(`[API POST /lists/${params.id}/films] DB error:`, err);
    return NextResponse.json({ error: "Erreur lors de l'ajout du film à la liste" }, { status: 500 });
  }
}
