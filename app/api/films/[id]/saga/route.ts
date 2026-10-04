import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getMediaForTitle } from "@/lib/db/mapper";
import type { SagaEpisode } from "@/types/api";

// --no-request: SELECT f.id, f.titre, f.annee, f.poster_url, f.synopsis FROM films f WHERE f.saga_id = $1;

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const filmId = parseInt(params.id, 10);

  if (isNaN(filmId)) {
    return NextResponse.json({ message: "Identifiant de film invalide" }, { status: 400 });
  }

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
          s.nom AS saga_nom,
          duree_texte((f.details ->> 'duree')::INTEGER) AS duree_texte,
          COALESCE(note_ponderee(f.id), v.moyenne, 0) AS note_ponderee
      FROM saga_chrono sc
      JOIN sagas s ON s.id = sc.saga_id
      JOIN films f ON f.id = sc.id
      LEFT JOIN v_fiche_film v ON v.id = sc.id
      ORDER BY sc.ordre ASC;
    `;

    const result = await query(sagaSql, [filmId]);

    if (result.rows.length > 0) {
      const sagaId = String(result.rows[0].saga_id);
      const sagaName = result.rows[0].saga_nom;

      const episodes: SagaEpisode[] = result.rows.map((row: any) => {
        const media = getMediaForTitle(row.titre);
        const rating = parseFloat(row.note_ponderee || "0");
        return {
          id: String(row.id),
          title: row.titre,
          orderInSaga: row.ordre,
          releaseYear: row.annee,
          durationFormatted: row.duree_texte || "2h 00m",
          weightedRating: isNaN(rating) ? 0 : rating,
          // --no-request: SELECT poster_url FROM films WHERE id = $1; (poster_url absent de la table films)
          posterUrl: media.poster,
        };
      });

      return NextResponse.json({
        sagaId,
        sagaName,
        episodes,
      });
    }

    return NextResponse.json({ message: "Aucune saga associée à ce film" }, { status: 404 });
  } catch (err) {
    console.error(`[API /films/${params.id}/saga] DB query error:`, err);
    return NextResponse.json(
      { message: "Erreur serveur lors de la récupération de la saga" },
      { status: 500 }
    );
  }
}
