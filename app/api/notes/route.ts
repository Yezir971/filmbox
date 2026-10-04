import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getMediaForTitle } from "@/lib/db/mapper";
import { MOCK_FILMS } from "@/lib/mock-data";
import type { NoteHistorique } from "@/types/api";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const filmId = parseInt(body.filmId, 10);
  const noteValue = parseFloat(body.note);
  const userPseudo = body.userPseudo || "cinephile_92";

  if (!isNaN(filmId) && !isNaN(noteValue)) {
    try {
      // Insertion de note de exo.sql (9.2) avec gestion ON CONFLICT
      const noteSql = `
        INSERT INTO notes (utilisateur_id, film_id, note, note_le)
        SELECT u.id, $2, $3, CURRENT_DATE
        FROM utilisateurs u
        WHERE LOWER(u.pseudo) = LOWER($1)
        ON CONFLICT (utilisateur_id, film_id) 
        DO UPDATE SET note = EXCLUDED.note, note_le = CURRENT_DATE
        RETURNING id, utilisateur_id, film_id, note, note_le;
      `;
      const res = await query(noteSql, [userPseudo, filmId, noteValue]);

      if (res.rows.length > 0) {
        // Rafraîchir la vue matérialisée mv_stats_films (cf. exo.sql 9.2)
        try {
          await query("REFRESH MATERIALIZED VIEW mv_stats_films;");
        } catch (mvErr) {
          // Non-bloquant
        }

        const filmInfoRes = await query("SELECT titre FROM films WHERE id = $1;", [filmId]);
        const filmTitle = filmInfoRes.rows[0]?.titre || "Film";
        const media = getMediaForTitle(filmTitle);

        const note: NoteHistorique = {
          id: String(res.rows[0].id),
          filmId: String(filmId),
          filmTitle,
          posterUrl: media.poster,
          note: noteValue,
          createdAt: new Date().toISOString(),
        };

        return NextResponse.json(note, { status: 201 });
      }
    } catch (err) {
      console.warn("[API POST /notes] DB query fallback:", err);
    }
  }

  const film = MOCK_FILMS.find((f) => f.id === body.filmId) || MOCK_FILMS[0];
  const note: NoteHistorique = {
    id: `note-${Date.now()}`,
    filmId: film.id,
    filmTitle: film.title,
    posterUrl: film.posterUrl,
    note: body.note || 4.5,
    createdAt: new Date().toISOString(),
  };

  return NextResponse.json(note, { status: 201 });
}
