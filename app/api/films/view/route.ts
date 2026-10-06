import { NextRequest, NextResponse } from "next/server";
import { withTransaction, query } from "@/lib/db";

/**
 * Endpoint d'incrémentation atomique du nombre de vues d'un film.
 * Implémente la logique transactionnelle M15.2 avec verrouillage pessimiste (FOR UPDATE)
 *
 * SQL sous-jacent :
 * BEGIN;
 * SELECT nb_vues FROM films WHERE titre = $1 FOR UPDATE;
 * UPDATE films SET nb_vues = nb_vues + 1 WHERE titre = $1 RETURNING nb_vues;
 * COMMIT;
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const titre = body.titre || body.title || "Inception";
    const filmId = body.id || body.filmId;

    const result = await withTransaction(async (client) => {
      // 15.2 : Verrouillage pessimiste de la ligne pour prévenir toute "lost update" concurrente
      const selectSql = filmId
        ? "SELECT id, titre, nb_vues FROM films WHERE id = $1 FOR UPDATE;"
        : "SELECT id, titre, nb_vues FROM films WHERE titre = $1 FOR UPDATE;";
      
      const selectRes = await client.query(selectSql, [filmId || titre]);

      if (selectRes.rows.length === 0) {
        throw new Error(`Film "${filmId || titre}" introuvable en base.`);
      }

      const currentViews = selectRes.rows[0].nb_vues;

      // Incrémentation et retour immédiat de la nouvelle valeur (RETURNING)
      const updateSql = filmId
        ? "UPDATE films SET nb_vues = nb_vues + 1 WHERE id = $1 RETURNING id, titre, nb_vues;"
        : "UPDATE films SET nb_vues = nb_vues + 1 WHERE titre = $1 RETURNING id, titre, nb_vues;";

      const updateRes = await client.query(updateSql, [filmId || titre]);
      const updatedRow = updateRes.rows[0];

      return {
        id: updatedRow.id,
        titre: updatedRow.titre,
        previousViews: currentViews,
        nb_vues: updatedRow.nb_vues,
      };
    });

    return NextResponse.json({
      success: true,
      message: `Nombre de vues incrémenté pour "${result.titre}".`,
      ...result,
    });
  } catch (err: any) {
    console.error("[API POST /films/view] Erreur transactionnelle 15.2:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Erreur transactionnelle" },
      { status: err.message?.includes("introuvable") ? 404 : 500 }
    );
  }
}
