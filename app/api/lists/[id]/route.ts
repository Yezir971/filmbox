import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { mapRowToFilm } from "@/lib/db/mapper";
import { MOCK_LISTS } from "@/lib/mock-data";
import type { ListeDetail } from "@/types/api";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const listId = parseInt(params.id, 10);

  if (!isNaN(listId)) {
    try {
      // Requête m1.4 de exo.sql : Détail d'une liste ordonnée avec liste_film
      const listSql = `
        SELECT id, membre, titre, visibility, create_at
        FROM liste
        WHERE id = $1;
      `;
      const listRes = await query(listSql, [listId]);

      if (listRes.rows.length > 0) {
        const l = listRes.rows[0];

        // Éléments de la liste avec jointure films
        const itemsSql = `
          SELECT 
            lf.id AS item_id,
            lf.position,
            lf.film AS film_name,
            f.id,
            f.titre,
            f.annee,
            f.genre,
            f.details,
            v.realisateurs,
            v.duree_min,
            v.nb_notes,
            v.moyenne,
            duree_texte((f.details ->> 'duree')::INTEGER) AS duree_texte,
            COALESCE(note_ponderee(f.id), v.moyenne) AS note_ponderee
          FROM liste_film lf
          LEFT JOIN films f ON LOWER(f.titre) = LOWER(lf.film)
          LEFT JOIN v_fiche_film v ON v.id = f.id
          WHERE lf.liste_id = $1
          ORDER BY lf.position ASC;
        `;
        const itemsRes = await query(itemsSql, [listId]);

        const items = itemsRes.rows.map((row: any) => ({
          id: String(row.item_id),
          position: row.position,
          film: mapRowToFilm(row.id ? row : {
            id: row.item_id,
            titre: row.film_name,
            annee: 2008,
            genre: "Action",
            details: {},
            realisateurs: "Christopher Nolan",
            moyenne: 4.5,
          }),
          addedAt: new Date(l.create_at).toISOString(),
          notePersonnelle: `Position #${row.position} dans la sélection`,
        }));

        const listDetail: ListeDetail = {
          id: String(l.id),
          title: l.titre,
          description: `Collection créée par ${l.membre}`,
          authorPseudo: l.membre,
          authorAvatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
          filmCount: items.length,
          isPublic: l.visibility === "public",
          coverPosters: items.slice(0, 3).map((it) => it.film.posterUrl),
          createdAt: new Date(l.create_at).toISOString(),
          updatedAt: new Date(l.create_at).toISOString(),
          items,
        };

        return NextResponse.json(listDetail);
      }
    } catch (err) {
      console.warn(`[API /lists/${params.id}] DB query fallback:`, err);
    }
  }

  const list = MOCK_LISTS.find((l) => l.id === params.id) || MOCK_LISTS[0];
  return NextResponse.json(list);
}
