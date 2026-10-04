// --no-request: ALTER TABLE journal ADD COLUMN IF NOT EXISTS commentaire TEXT, ADD COLUMN IF NOT EXISTS rewatch BOOLEAN DEFAULT false;
// --no-request: ALTER TABLE films ADD COLUMN IF NOT EXISTS poster_url TEXT;
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getMediaForTitle } from "@/lib/db/mapper";
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
  } catch (err) {
    console.error(`[API /users/${params.pseudo}/journal] DB error:`, err);
    return NextResponse.json({ error: "Erreur lors de la récupération du journal" }, { status: 500 });
  }
}
