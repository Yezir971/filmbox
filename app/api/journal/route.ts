// --no-request: ALTER TABLE journal ADD COLUMN IF NOT EXISTS commentaire TEXT, ADD COLUMN IF NOT EXISTS rewatch BOOLEAN DEFAULT false;
// --no-request: ALTER TABLE films ADD COLUMN IF NOT EXISTS poster_url TEXT;
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getMediaForTitle } from "@/lib/db/mapper";
import type { JournalEntry } from "@/types/api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const filmId = parseInt(body.filmId, 10);
    const userPseudo = body.userPseudo || "cinephile_92";

    if (isNaN(filmId)) {
      return NextResponse.json({ error: "filmId valide requis" }, { status: 400 });
    }

    const journalSql = `
      INSERT INTO journal (utilisateur_id, film_id, date_visionnage)
      SELECT u.id, $2, CURRENT_DATE
      FROM utilisateurs u
      WHERE LOWER(u.pseudo) = LOWER($1)
      RETURNING id, utilisateur_id, film_id, date_visionnage;
    `;
    const res = await query(journalSql, [userPseudo, filmId]);

    if (!res.rows || res.rows.length === 0) {
      return NextResponse.json({ error: "Utilisateur non trouvé ou insertion échouée" }, { status: 404 });
    }

    const filmInfoRes = await query("SELECT titre FROM films WHERE id = $1;", [filmId]);
    const filmTitle = filmInfoRes.rows[0]?.titre || "Film";
    const media = getMediaForTitle(filmTitle);

    const entry: JournalEntry = {
      id: String(res.rows[0].id),
      filmId: String(filmId),
      filmTitle,
      posterUrl: media.poster,
      watchedAt: new Date(res.rows[0].date_visionnage).toISOString(),
      note: body.note ? parseFloat(body.note) : undefined,
      comment: body.comment || "Ajouté à votre journal de visionnages.",
      rewatch: Boolean(body.rewatch),
    };

    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    console.error("[API POST /journal] DB error:", err);
    return NextResponse.json({ error: "Erreur lors de l'enregistrement dans le journal" }, { status: 500 });
  }
}
