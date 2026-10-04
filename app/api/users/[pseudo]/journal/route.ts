import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getMediaForTitle } from "@/lib/db/mapper";
import { MOCK_JOURNAL } from "@/lib/mock-data";
import type { JournalEntry } from "@/types/api";

export async function GET(
  request: NextRequest,
  { params }: { params: { pseudo: string } }
) {
  const pseudo = decodeURIComponent(params.pseudo || "cinephile_92");

  try {
    // Requête 6.4 de exo.sql : Journal avec calcul fenêtré LAG() des jours écoulés
    const sql = `
      SELECT 
          j.id,
          j.date_visionnage,
          f.id AS film_id,
          f.titre,
          n.note,
          j.date_visionnage - LAG(j.date_visionnage) OVER (ORDER BY j.date_visionnage) AS jours_depuis_precedent
      FROM journal j
      JOIN utilisateurs u ON j.utilisateur_id = u.id
      JOIN films f ON j.film_id = f.id
      LEFT JOIN notes n ON n.film_id = f.id AND n.utilisateur_id = u.id
      WHERE LOWER(u.pseudo) = LOWER($1)
      ORDER BY j.date_visionnage DESC;
    `;

    const res = await query(sql, [pseudo]);

    if (res.rows.length > 0) {
      const journal: JournalEntry[] = res.rows.map((row: any) => {
        const media = getMediaForTitle(row.titre);
        return {
          id: String(row.id),
          filmId: String(row.film_id),
          filmTitle: row.titre,
          posterUrl: media.poster,
          watchedAt: new Date(row.date_visionnage).toISOString(),
          note: row.note ? parseFloat(row.note) : undefined,
          comment: row.jours_depuis_precedent
            ? `Vu ${row.jours_depuis_precedent} jours après le film précédent.`
            : "Premier visionnage répertorié.",
          rewatch: false,
        };
      });

      return NextResponse.json(journal);
    }
  } catch (err) {
    console.warn(`[API /users/${params.pseudo}/journal] DB query fallback:`, err);
  }

  return NextResponse.json(MOCK_JOURNAL);
}
