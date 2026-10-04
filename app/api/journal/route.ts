import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getMediaForTitle } from "@/lib/db/mapper";
import { MOCK_FILMS } from "@/lib/mock-data";
import type { JournalEntry } from "@/types/api";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const filmId = parseInt(body.filmId, 10);
  const userPseudo = body.userPseudo || "cinephile_92";

  if (!isNaN(filmId)) {
    try {
      const journalSql = `
        INSERT INTO journal (utilisateur_id, film_id, date_visionnage)
        SELECT u.id, $2, CURRENT_DATE
        FROM utilisateurs u
        WHERE LOWER(u.pseudo) = LOWER($1)
        RETURNING id, utilisateur_id, film_id, date_visionnage;
      `;
      const res = await query(journalSql, [userPseudo, filmId]);

      if (res.rows.length > 0) {
        const filmInfoRes = await query("SELECT titre FROM films WHERE id = $1;", [filmId]);
        const filmTitle = filmInfoRes.rows[0]?.titre || "Film";
        const media = getMediaForTitle(filmTitle);

        const entry: JournalEntry = {
          id: String(res.rows[0].id),
          filmId: String(filmId),
          filmTitle,
          posterUrl: media.poster,
          watchedAt: new Date(res.rows[0].date_visionnage).toISOString(),
          note: body.note,
          comment: body.comment || "Ajouté à votre journal de visionnages.",
          rewatch: Boolean(body.rewatch),
        };

        return NextResponse.json(entry, { status: 201 });
      }
    } catch (err) {
      console.warn("[API POST /journal] DB query fallback:", err);
    }
  }

  const film = MOCK_FILMS.find((f) => f.id === body.filmId) || MOCK_FILMS[0];
  const entry: JournalEntry = {
    id: `journal-${Date.now()}`,
    filmId: film.id,
    filmTitle: film.title,
    posterUrl: film.posterUrl,
    watchedAt: body.watchedAt || new Date().toISOString(),
    note: body.note,
    comment: body.comment,
    rewatch: Boolean(body.rewatch),
  };

  return NextResponse.json(entry, { status: 201 });
}
