import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getMediaForTitle } from "@/lib/db/mapper";
import { MOCK_SAGA_EPISODES } from "@/lib/mock-data";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const filmId = parseInt(params.id, 10);

  if (!isNaN(filmId)) {
    try {
      // Requête 3.3 de exo.sql : CTE Récursive pour ordonnancement chronologique de la saga
      const sagaSql = `
        WITH RECURSIVE saga_chrono AS (
            SELECT 
                f.id, 
                f.titre, 
                f.annee, 
                f.saga_id, 
                1 AS ordre
            FROM films f
            WHERE f.saga_id = (SELECT saga_id FROM films WHERE id = $1)
              AND f.film_precedent_id IS NULL

            UNION ALL

            SELECT 
                f.id, 
                f.titre, 
                f.annee, 
                f.saga_id, 
                sc.ordre + 1
            FROM films f
            INNER JOIN saga_chrono sc ON f.film_precedent_id = sc.id
        )
        SELECT 
            sc.ordre, 
            sc.id, 
            sc.titre, 
            sc.annee, 
            sc.saga_id,
            s.nom AS saga_nom
        FROM saga_chrono sc
        JOIN sagas s ON s.id = sc.saga_id
        ORDER BY sc.ordre ASC;
      `;

      const result = await query(sagaSql, [filmId]);

      if (result.rows.length > 0) {
        const sagaId = String(result.rows[0].saga_id);
        const sagaName = result.rows[0].saga_nom;

        const episodes = result.rows.map((row: any) => {
          const media = getMediaForTitle(row.titre);
          return {
            id: String(row.id),
            title: row.titre,
            order: row.ordre,
            releaseYear: row.annee,
            posterUrl: media.poster,
            synopsis: `Épisode ${row.ordre} de la saga ${sagaName}.`,
          };
        });

        return NextResponse.json({
          sagaId,
          sagaName,
          episodes,
        });
      }
    } catch (err) {
      console.warn(`[API /films/${params.id}/saga] DB query fallback:`, err);
    }
  }

  // Fallback
  const episodes = MOCK_SAGA_EPISODES["nolan-mind"] || [];
  return NextResponse.json({
    sagaId: "nolan-mind",
    sagaName: "Saga Cinématographique",
    episodes,
  });
}
