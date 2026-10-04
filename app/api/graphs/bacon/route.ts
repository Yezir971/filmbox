// --no-request: ALTER TABLE personnes ADD COLUMN IF NOT EXISTS photo_url TEXT;
// --no-request: ALTER TABLE films ADD COLUMN IF NOT EXISTS poster_url TEXT;
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getMediaForTitle } from "@/lib/db/mapper";
import { getPersonPhotoSync } from "@/lib/tmdb";
import type { BaconPath } from "@/types/api";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get("source") || "Kevin Bacon";
  const target = searchParams.get("target") || "Omar Sy";

  try {
    // Requête 4.4 de exo.sql : CTE Récursive du chemin de Bacon
    const sql = `
      WITH RECURSIVE chemin_bacon AS (
          SELECT 
              p.id AS acteur_id, 
              p.nom AS acteur_nom,
              0 AS distance, 
              ARRAY[p.id] AS acteurs_visites, 
              jsonb_build_array(jsonb_build_object('actor', p.nom, 'actor_id', p.id)) AS etapes
          FROM personnes p
          WHERE LOWER(p.nom) = LOWER($1)

          UNION ALL

          SELECT 
              p_suivant.id, 
              p_suivant.nom,
              cb.distance + 1, 
              cb.acteurs_visites || p_suivant.id, 
              cb.etapes || jsonb_build_object('film', f.titre, 'film_id', f.id, 'annee', f.annee, 'actor', p_suivant.nom, 'actor_id', p_suivant.id)
          FROM chemin_bacon cb
          JOIN casting c1 ON cb.acteur_id = c1.personne_id AND c1.role = 'acteur'
          JOIN films f ON c1.film_id = f.id
          JOIN casting c2 ON f.id = c2.film_id AND c2.role = 'acteur'
          JOIN personnes p_suivant ON c2.personne_id = p_suivant.id
          WHERE NOT (p_suivant.id = ANY(cb.acteurs_visites))
            AND cb.distance < 5
      )
      SELECT distance, etapes
      FROM chemin_bacon
      WHERE LOWER(acteur_nom) = LOWER($2)
      ORDER BY distance ASC
      LIMIT 1;
    `;

    const res = await query(sql, [source, target]);

    if (res.rows.length > 0) {
      const row = res.rows[0];
      const distance = parseInt(row.distance, 10);
      const etapes = Array.isArray(row.etapes) ? row.etapes : [];

      const path = etapes.map((step: any) => {
        const media = step.film ? getMediaForTitle(step.film) : null;
        return {
          actor: {
            id: String(step.actor_id),
            name: step.actor,
            photoUrl: getPersonPhotoSync(step.actor),
          },
          film: step.film
            ? {
                id: String(step.film_id),
                title: step.film,
                releaseYear: step.annee || 2010,
                posterUrl: media?.poster || "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80",
              }
            : {
                id: "initial",
                title: "Point de départ",
                releaseYear: 2000,
                posterUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80",
              },
        };
      });

      const baconPath: BaconPath = {
        sourceActor: source,
        targetActor: target,
        degreesOfSeparation: distance,
        path,
      };

      return NextResponse.json(baconPath);
    }

    return NextResponse.json(
      { error: `Aucun lien cinéphile trouvé entre "${source}" et "${target}" dans la base de données.` },
      { status: 404 }
    );
  } catch (err) {
    console.error("[API /graphs/bacon] DB error:", err);
    return NextResponse.json(
      { error: "Erreur lors du calcul du chemin Bacon" },
      { status: 500 }
    );
  }
}
