import { NextRequest, NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";

/**
 * 15.2 : Incrémentation atomique du nombre de vues d'un film par son ID ou Titre
 *
 * BEGIN;
 * SELECT nb_vues FROM films WHERE ... FOR UPDATE;
 * UPDATE films SET nb_vues = nb_vues + 1 WHERE ... RETURNING nb_vues;
 * COMMIT;
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const rawId = decodeURIComponent(params.id);
  const isNumeric = /^\d+$/.test(rawId);
  const numericId = isNumeric ? parseInt(rawId, 10) : null;

  try {
    const result = await withTransaction(async (client) => {
      // 1. Verrouillage pessimiste de la ligne
      const selectSql = isNumeric
        ? "SELECT id, titre, nb_vues FROM films WHERE id = $1 FOR UPDATE;"
        : "SELECT id, titre, nb_vues FROM films WHERE titre = $1 FOR UPDATE;";
      
      const selectRes = await client.query(selectSql, [isNumeric ? numericId : rawId]);

      if (selectRes.rows.length === 0) {
        throw new Error(`Film "${rawId}" introuvable en base.`);
      }

      const currentViews = selectRes.rows[0].nb_vues;

      // 2. Incrémentation atomique et retour de la valeur mise à jour
      const updateSql = isNumeric
        ? "UPDATE films SET nb_vues = nb_vues + 1 WHERE id = $1 RETURNING id, titre, nb_vues;"
        : "UPDATE films SET nb_vues = nb_vues + 1 WHERE titre = $1 RETURNING id, titre, nb_vues;";

      const updateRes = await client.query(updateSql, [isNumeric ? numericId : rawId]);
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
    console.error(`[API POST /films/${params.id}/view] Erreur transactionnelle 15.2:`, err);
    return NextResponse.json(
      { success: false, error: err.message || "Erreur transactionnelle" },
      { status: err.message?.includes("introuvable") ? 404 : 500 }
    );
  }
}
