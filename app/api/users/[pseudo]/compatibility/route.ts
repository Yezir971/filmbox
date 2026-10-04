// --no-request: ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS avatar_url TEXT;
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { CompatibilityScore } from "@/types/api";

export async function GET(
  request: NextRequest,
  { params }: { params: { pseudo: string } }
) {
  const sourcePseudo = decodeURIComponent(params.pseudo || "cinephile_92");
  const { searchParams } = new URL(request.url);
  const targetPseudo = searchParams.get("with") || "nolanfan";

  try {
    // Requête 10.3 de exo.sql : Fonction de compatibilité cinéphile PostgreSQL
    const statsSql = `
      SELECT 
        COUNT(*) AS films_communs,
        ROUND(AVG(ecart), 2) AS ecart_moyen
      FROM compatibilite($1, $2);
    `;
    const statsRes = await query(statsSql, [sourcePseudo, targetPseudo]);

    const filmsCommuns = parseInt(statsRes.rows[0]?.films_communs || "0", 10);
    const ecartMoyen = statsRes.rows[0]?.ecart_moyen != null ? parseFloat(statsRes.rows[0].ecart_moyen) : null;

    // Calcul du score de 0 à 100% : un écart moyen de 0 donne 100%, un écart de 2 donne 60%
    const score = filmsCommuns > 0 && ecartMoyen !== null
      ? Math.max(0, Math.min(100, Math.round(100 - ecartMoyen * 20)))
      : 0;

    // Genres partagés
    const genresSql = `
      SELECT f.genre, COUNT(*) AS count
      FROM compatibilite($1, $2) c
      JOIN films f ON f.titre = c.titre
      GROUP BY f.genre
      ORDER BY count DESC
      LIMIT 3;
    `;
    const genresRes = await query(genresSql, [sourcePseudo, targetPseudo]);
    const sharedTopGenres = genresRes.rows.map((r: any) => r.genre);

    const compatibility: CompatibilityScore = {
      targetPseudo,
      targetAvatarUrl: "",
      score,
      commonFavoritesCount: filmsCommuns,
      sharedTopGenres,
      summary: filmsCommuns > 0
        ? `Compatibilité cinématographique de ${score}% calculée sur ${filmsCommuns} films notés en commun (écart moyen : ${ecartMoyen}/5).`
        : `Aucun film noté en commun pour le moment avec ${targetPseudo}.`,
    };

    return NextResponse.json(compatibility);
  } catch (err) {
    console.error(`[API /users/${params.pseudo}/compatibility] DB error:`, err);
    return NextResponse.json({ error: "Erreur lors du calcul de la compatibilité" }, { status: 500 });
  }
}
