// --no-request: ALTER TABLE notes ADD COLUMN IF NOT EXISTS id SERIAL;
// --no-request: ALTER TABLE notes ADD COLUMN IF NOT EXISTS avis TEXT;
// --no-request: ALTER TABLE films ADD COLUMN IF NOT EXISTS poster_url TEXT;
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getMediaForTitle } from "@/lib/db/mapper";
import type { NoteHistorique } from "@/types/api";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filmId = searchParams.get("filmId");
    const userPseudo = searchParams.get("userPseudo") || searchParams.get("pseudo") || "cinephile_92";

    if (filmId) {
      const parsedFilmId = parseInt(filmId, 10);
      if (isNaN(parsedFilmId)) {
        return NextResponse.json({ error: "filmId invalide" }, { status: 400 });
      }

      const res = await query(
        `SELECT n.note, n.note_le 
         FROM notes n 
         JOIN utilisateurs u ON u.id = n.utilisateur_id 
         WHERE n.film_id = $1 AND LOWER(u.pseudo) = LOWER($2);`,
        [parsedFilmId, userPseudo]
      );

      if (res.rows.length > 0) {
        return NextResponse.json({
          note: parseFloat(res.rows[0].note),
          date: res.rows[0].note_le,
          filmId: String(parsedFilmId),
          userPseudo,
        });
      }

      return NextResponse.json({ note: null, filmId: String(parsedFilmId), userPseudo });
    }

    // Si pas de filmId, lister les notes récentes de l'utilisateur
    const res = await query(
      `SELECT n.film_id, n.note, n.note_le, f.titre 
       FROM notes n 
       JOIN utilisateurs u ON u.id = n.utilisateur_id 
       JOIN films f ON f.id = n.film_id
       WHERE LOWER(u.pseudo) = LOWER($1)
       ORDER BY n.note_le DESC, n.film_id DESC;`,
      [userPseudo]
    );

    return NextResponse.json(
      res.rows.map((r: any) => ({
        filmId: String(r.film_id),
        filmTitle: r.titre,
        note: parseFloat(r.note),
        date: r.note_le,
      }))
    );
  } catch (err) {
    console.error("[API GET /notes] DB error:", err);
    return NextResponse.json({ error: "Erreur lors de la récupération des notes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const filmId = parseInt(body.filmId, 10);
    const noteValue = parseFloat(body.note);
    const userPseudo = body.userPseudo || "cinephile_92";

    if (isNaN(filmId) || isNaN(noteValue)) {
      return NextResponse.json({ error: "filmId et note valides sont requis" }, { status: 400 });
    }

    // Insertion de note de exo.sql (9.2) avec gestion ON CONFLICT
    const noteSql = `
      INSERT INTO notes (utilisateur_id, film_id, note, note_le)
      SELECT u.id, $2, $3, CURRENT_DATE
      FROM utilisateurs u
      WHERE LOWER(u.pseudo) = LOWER($1)
      ON CONFLICT (utilisateur_id, film_id) 
      DO UPDATE SET note = EXCLUDED.note, note_le = CURRENT_DATE
      RETURNING utilisateur_id, film_id, note, note_le;
    `;
    const res = await query(noteSql, [userPseudo, filmId, noteValue]);

    if (!res.rows || res.rows.length === 0) {
      return NextResponse.json({ error: "Utilisateur introuvable ou erreur d'enregistrement" }, { status: 404 });
    }

    // Rafraîchir la vue matérialisée mv_stats_films (cf. exo.sql 9.2)
    try {
      await query("REFRESH MATERIALIZED VIEW mv_stats_films;");
    } catch (mvErr) {
      // Non-bloquant
    }

    const filmInfoRes = await query("SELECT titre FROM films WHERE id = $1;", [filmId]);
    const filmTitle = filmInfoRes.rows[0]?.titre || "Film";
    const media = getMediaForTitle(filmTitle);

    // Calculer les métriques actualisées en temps réel (note pondérée et nombre de votes)
    const statsRes = await query(
      `SELECT 
        v.nb_notes,
        COALESCE(note_ponderee(f.id), v.moyenne) AS note_ponderee
       FROM films f
       LEFT JOIN v_fiche_film v ON v.id = f.id
       WHERE f.id = $1;`,
      [filmId]
    );

    const weightedRating = parseFloat(statsRes.rows[0]?.note_ponderee || String(noteValue));
    const ratingsCount = parseInt(statsRes.rows[0]?.nb_notes || "1", 10);

    const note = {
      id: `note-${res.rows[0].utilisateur_id}-${filmId}`,
      filmId: String(filmId),
      filmTitle,
      posterUrl: media.poster,
      note: noteValue,
      createdAt: new Date().toISOString(),
      weightedRating,
      ratingsCount,
    };

    return NextResponse.json(note, { status: 201 });
  } catch (err) {
    console.error("[API POST /notes] DB error:", err);
    return NextResponse.json({ error: "Erreur lors de l'enregistrement de la note" }, { status: 500 });
  }
}
