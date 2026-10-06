export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { mapRowToFilm, getMediaForTitle } from "@/lib/db/mapper";
import { getPersonPhotoSync } from "@/lib/tmdb";
import type { FicheFilm } from "@/types/api";

// --no-request: ALTER TABLE casting ADD COLUMN IF NOT EXISTS personnage VARCHAR(100);
// --no-request: ALTER TABLE personnes ADD COLUMN IF NOT EXISTS photo_url TEXT;
// --no-request: SELECT p.id, p.nom, p.photo_url, c.role, c.personnage FROM casting c JOIN personnes p ON p.id = c.personne_id WHERE c.film_id = $1;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const filmId = parseInt(params.id, 10);
  const { searchParams } = new URL(request.url);
  const userPseudo = searchParams.get("pseudo") || searchParams.get("userPseudo") || "cinephile_92";

  if (isNaN(filmId)) {
    return NextResponse.json({ message: "Identifiant de film invalide" }, { status: 400 });
  }

  try {
    // 1. Informations principales via la vue v_fiche_film et fonctions métiers de exo.sql
    const filmSql = `
      SELECT 
        f.id, 
        f.titre, 
        f.annee, 
        f.genre, 
        f.details, 
        f.saga_id,
        f.nb_vues,
        v.realisateurs, 
        v.duree_min, 
        v.nb_notes, 
        v.moyenne,
        duree_texte((f.details ->> 'duree')::INTEGER) AS duree_texte,
        COALESCE(note_ponderee(f.id), v.moyenne) AS note_ponderee,
        s.nom AS saga_nom,
        n.note AS user_note
      FROM films f
      LEFT JOIN v_fiche_film v ON v.id = f.id
      LEFT JOIN sagas s ON s.id = f.saga_id
      LEFT JOIN notes n ON n.film_id = f.id AND n.utilisateur_id = (SELECT id FROM utilisateurs WHERE LOWER(pseudo) = LOWER($2) LIMIT 1)
      WHERE f.id = $1;
    `;
    const filmRes = await query(filmSql, [filmId, userPseudo]);

    if (filmRes.rows.length === 0) {
      return NextResponse.json({ message: "Film introuvable en base de données" }, { status: 404 });
    }

    const row = filmRes.rows[0];
    const baseFilm = {
      ...mapRowToFilm(row),
      userNote: row.user_note != null ? parseFloat(row.user_note) : undefined,
    };

    // 2. Casting via les tables casting et personnes (requêtes M2.2 & M2.3 de exo.sql)
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
      // --no-request: SELECT photo_url FROM personnes WHERE id = $1; (photo_url absente du schéma actuel, servie via lib/tmdb)
      photoUrl: getPersonPhotoSync(c.nom),
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
          name: row.realisateurs || "Réalisateur Inconnu",
          role: "Réalisateur",
          photoUrl: getPersonPhotoSync(row.realisateurs),
        },
      ],
      saga,
    };

    return NextResponse.json(fiche);
  } catch (err) {
    console.error(`[API /films/${params.id}] DB query error:`, err);
    return NextResponse.json(
      { message: "Erreur serveur lors de la récupération du film" },
      { status: 500 }
    );
  }
}
