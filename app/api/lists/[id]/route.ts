// --no-request: ALTER TABLE liste ADD COLUMN IF NOT EXISTS description TEXT;
// --no-request: ALTER TABLE liste_film ADD COLUMN IF NOT EXISTS note_personnelle TEXT;
// --no-request: ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS avatar_url TEXT;
// --no-request: ALTER TABLE films ADD COLUMN IF NOT EXISTS poster_url TEXT, ADD COLUMN IF NOT EXISTS backdrop_url TEXT, ADD COLUMN IF NOT EXISTS synopsis TEXT;
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { mapRowToFilm } from "@/lib/db/mapper";
import type { ListeDetail } from "@/types/api";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const listId = parseInt(params.id, 10);

  if (isNaN(listId)) {
    return NextResponse.json({ error: "Identifiant de liste invalide" }, { status: 400 });
  }

  try {
    // Requête m1.4 de exo.sql : Détail d'une liste ordonnée avec liste_film
    const listSql = `
      SELECT id, membre, titre, visibility, create_at
      FROM liste
      WHERE id = $1;
    `;
    const listRes = await query(listSql, [listId]);

    if (!listRes.rows || listRes.rows.length === 0) {
      return NextResponse.json({ error: "Liste introuvable" }, { status: 404 });
    }

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
        annee: 2000,
        genre: "Cinéma",
        details: {},
        realisateurs: "Inconnu",
        moyenne: 0,
      }),
      addedAt: new Date(l.create_at).toISOString(),
      notePersonnelle: `Position #${row.position} dans la sélection`,
    }));

    const listDetail: ListeDetail = {
      id: String(l.id),
      title: l.titre,
      description: `Collection créée par ${l.membre}`,
      authorPseudo: l.membre,
      authorAvatarUrl: "",
      filmCount: items.length,
      isPublic: l.visibility === "public",
      coverPosters: items.slice(0, 3).map((it) => it.film.posterUrl),
      createdAt: new Date(l.create_at).toISOString(),
      updatedAt: new Date(l.create_at).toISOString(),
      items,
    };

    return NextResponse.json(listDetail);
  } catch (err) {
    console.error(`[API /lists/${params.id}] DB error:`, err);
    return NextResponse.json({ error: "Erreur lors de la récupération de la liste" }, { status: 500 });
  }
}
