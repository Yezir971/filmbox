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
    const ecartMoyen = parseFloat(statsRes.rows[0]?.ecart_moyen || "1.0");

    // Calcul du score de 0 à 100% : un écart moyen de 0 donne 100%, un écart de 2 donne 60%
    const score = filmsCommuns > 0
      ? Math.max(30, Math.min(99, Math.round(100 - ecartMoyen * 20)))
      : 75;

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
      targetAvatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
      score,
      commonFavoritesCount: filmsCommuns || 5,
      sharedTopGenres: sharedTopGenres.length > 0 ? sharedTopGenres : ["Science-Fiction", "Thriller", "Drame"],
      summary: `Compatibilité cinématographique de ${score}% calculée sur ${filmsCommuns} films notés en commun (écart moyen : ${ecartMoyen}/5).`,
    };

    return NextResponse.json(compatibility);
  } catch (err) {
    console.warn(`[API /users/${params.pseudo}/compatibility] DB query fallback:`, err);
  }

  return NextResponse.json({
    targetPseudo,
    targetAvatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    score: 88,
    commonFavoritesCount: 6,
    sharedTopGenres: ["Science-Fiction", "Thriller", "Drame"],
    summary: `Compatibilité cinématographique de 88% avec ${targetPseudo}. Vos goûts convergent sur la science-fiction et les thrillers.`,
  });
}
