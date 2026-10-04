import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { mapRowToFilm } from "@/lib/db/mapper";
import { MOCK_FILMS } from "@/lib/mock-data";
import type { FicheFilm } from "@/types/api";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const filmId = parseInt(params.id, 10);

  if (!isNaN(filmId)) {
    try {
      // 1. Informations principales via la vue v_fiche_film et fonctions métiers
      const filmSql = `
        SELECT 
          f.id, 
          f.titre, 
          f.annee, 
          f.genre, 
          f.details, 
          f.saga_id,
          v.realisateurs, 
          v.duree_min, 
          v.nb_notes, 
          v.moyenne,
          duree_texte((f.details ->> 'duree')::INTEGER) AS duree_texte,
          COALESCE(note_ponderee(f.id), v.moyenne) AS note_ponderee,
          s.nom AS saga_nom
        FROM films f
        LEFT JOIN v_fiche_film v ON v.id = f.id
        LEFT JOIN sagas s ON s.id = f.saga_id
        WHERE f.id = $1;
      `;
      const filmRes = await query(filmSql, [filmId]);

      if (filmRes.rows.length > 0) {
        const row = filmRes.rows[0];
        const baseFilm = mapRowToFilm(row);

        // 2. Casting via la table casting et personnes (requête M2.2/M2.3)
        const castSql = `
          SELECT p.id, p.nom, c.role
          FROM casting c
          JOIN personnes p ON p.id = c.personne_id
          WHERE c.film_id = $1
          ORDER BY c.role ASC, p.nom ASC;
        `;
        const castRes = await query(castSql, [filmId]);

        const casting = castRes.rows.map((c: any, index: number) => ({
          actorId: String(c.id),
          name: c.nom,
          role: c.role === "realisateur" ? "Réalisateur" : `Rôle ${index + 1}`,
          photoUrl: `https://images.unsplash.com/photo-${1500000000000 + (c.id * 1234567) % 100000000}?w=400&auto=format&fit=crop&q=80`,
        }));

        let saga = undefined;
        if (row.saga_id) {
          const sagaCountSql = `SELECT COUNT(*) AS total FROM films WHERE saga_id = $1;`;
          const sagaCountRes = await query(sagaCountSql, [row.saga_id]);
          saga = {
            id: String(row.saga_id),
            name: row.saga_nom || `Saga #${row.saga_id}`,
            totalFilms: parseInt(sagaCountRes.rows[0]?.total || "3", 10),
          };
        }

        const fiche: FicheFilm = {
          ...baseFilm,
          casting: casting.length > 0 ? casting : [
            {
              actorId: "1",
              name: row.realisateurs || "Réalisateur",
              role: "Réalisateur",
              photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
            },
          ],
          saga,
        };

        return NextResponse.json(fiche);
      }
    } catch (err) {
      console.warn(`[API /films/${params.id}] DB query fallback:`, err);
    }
  }

  // Fallback mock
  const fallback = MOCK_FILMS.find((f) => f.id === params.id) || MOCK_FILMS[0];
  const fiche: FicheFilm = {
    ...fallback,
    casting: [
      {
        actorId: "a1",
        name: "Leonardo DiCaprio",
        role: "Acteur principal",
        photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
      },
    ],
  };

  return NextResponse.json(fiche);
}
