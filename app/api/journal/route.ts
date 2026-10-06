import { NextRequest, NextResponse } from "next/server";
import { withTransaction, query } from "@/lib/db";
import { getMediaForTitle } from "@/lib/db/mapper";
import type { JournalEntry } from "@/types/api";

/**
 * Endpoint de consultation rapide ou décompte des visionnages
 * Implémente la vérification 15.3 :
 * SELECT COUNT(*) AS visionnages FROM journal WHERE utilisateur_id = $1;
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userIdParam = searchParams.get("userId") || searchParams.get("utilisateur_id");
  const pseudoParam = searchParams.get("pseudo") || searchParams.get("userPseudo");

  try {
    let userId: number | null = null;
    if (userIdParam) {
      userId = parseInt(userIdParam, 10);
    } else if (pseudoParam) {
      const uRes = await query("SELECT id FROM utilisateurs WHERE LOWER(pseudo) = LOWER($1) LIMIT 1;", [pseudoParam]);
      if (uRes.rows.length > 0) {
        userId = uRes.rows[0].id;
      }
    } else {
      userId = 5; // Utilisateur par défaut de l'exercice 15.3
    }

    const countRes = await query(
      "SELECT COUNT(*) AS visionnages FROM journal WHERE utilisateur_id = $1;",
      [userId]
    );

    const count = parseInt(countRes.rows[0]?.visionnages || "0", 10);
    return NextResponse.json({
      userId,
      visionnages: count,
    });
  } catch (err: any) {
    console.error("[API GET /journal] Erreur:", err);
    return NextResponse.json({ error: "Erreur serveur lors de la récupération" }, { status: 500 });
  }
}

/**
 * Endpoint d'insertion unitaire ou multiple dans le journal avec garantie ACID.
 * Implémente la logique transactionnelle M15.3 :
 * 
 * BEGIN;
 * INSERT INTO journal (utilisateur_id, film_id, date_visionnage) VALUES (5, 12, '2026-09-25');
 * INSERT INTO journal (utilisateur_id, film_id, date_visionnage) VALUES (5, 20, '2026-09-25');
 * INSERT INTO journal (utilisateur_id, film_id, date_visionnage) VALUES (5, 99999, '2026-09-25'); -- erreur ici -> ROLLBACK automatique
 * COMMIT;
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const dateVisionnage = body.dateVisionnage || body.date_visionnage || new Date().toISOString().split("T")[0];

    // Résolution de l'utilisateur (par ID direct ou par pseudo)
    let userId: number | null = null;
    if (body.userId != null || body.utilisateur_id != null) {
      userId = parseInt(body.userId ?? body.utilisateur_id, 10);
    } else {
      const userPseudo = body.userPseudo || "cinephile_92";
      const uRes = await query(
        "SELECT id FROM utilisateurs WHERE LOWER(pseudo) = LOWER($1) LIMIT 1;",
        [userPseudo]
      );
      if (uRes.rows.length > 0) {
        userId = uRes.rows[0].id;
      }
    }

    if (!userId || isNaN(userId)) {
      return NextResponse.json({ error: "Utilisateur introuvable ou ID invalide" }, { status: 400 });
    }

    // Extraction de la liste des films à insérer (supporte filmId unique ou tableau filmIds)
    let filmIdsToInsert: number[] = [];
    if (Array.isArray(body.filmIds)) {
      filmIdsToInsert = body.filmIds.map((id: any) => parseInt(id, 10));
    } else if (Array.isArray(body.films)) {
      filmIdsToInsert = body.films.map((f: any) => parseInt(typeof f === "object" ? f.id || f.filmId : f, 10));
    } else if (body.filmId != null) {
      filmIdsToInsert = [parseInt(body.filmId, 10)];
    }

    if (filmIdsToInsert.length === 0 || filmIdsToInsert.some(isNaN)) {
      return NextResponse.json(
        { error: "Au moins un filmId valide est requis pour l'insertion" },
        { status: 400 }
      );
    }

    // Décompte initial avant la transaction
    const beforeCountRes = await query(
      "SELECT COUNT(*) AS visionnages FROM journal WHERE utilisateur_id = $1;",
      [userId]
    );
    const visionnagesAvant = parseInt(beforeCountRes.rows[0]?.visionnages || "0", 10);

    try {
      // Exécution dans un bloc transactionnel strict BEGIN ... COMMIT / ROLLBACK (15.3)
      const insertedRows = await withTransaction(async (client) => {
        const rows: any[] = [];
        for (const filmId of filmIdsToInsert) {
          const insertRes = await client.query(
            "INSERT INTO journal (utilisateur_id, film_id, date_visionnage) VALUES ($1, $2, $3) RETURNING id, utilisateur_id, film_id, date_visionnage;",
            [userId, filmId, dateVisionnage]
          );
          rows.push(insertRes.rows[0]);
        }
        return rows;
      });

      // Décompte après succès
      const afterCountRes = await query(
        "SELECT COUNT(*) AS visionnages FROM journal WHERE utilisateur_id = $1;",
        [userId]
      );
      const visionnagesApres = parseInt(afterCountRes.rows[0]?.visionnages || "0", 10);

      // Si insertion unique, renvoyer le format JournalEntry habituel
      if (filmIdsToInsert.length === 1) {
        const inserted = insertedRows[0];
        const filmInfoRes = await query("SELECT titre FROM films WHERE id = $1;", [inserted.film_id]);
        const filmTitle = filmInfoRes.rows[0]?.titre || "Film";
        const media = getMediaForTitle(filmTitle);

        const entry: JournalEntry = {
          id: String(inserted.id),
          filmId: String(inserted.film_id),
          filmTitle,
          posterUrl: media.poster,
          watchedAt: new Date(inserted.date_visionnage).toISOString(),
          note: body.note ? parseFloat(body.note) : undefined,
          comment: body.comment || "Ajouté à votre journal de visionnages.",
          rewatch: Boolean(body.rewatch),
        };
        return NextResponse.json(entry, { status: 201 });
      }

      // Format batch réussi
      return NextResponse.json({
        success: true,
        message: `${insertedRows.length} visionnages insérés avec succès en transaction.`,
        visionnagesAvant,
        visionnagesApres,
        insertedCount: insertedRows.length,
        entries: insertedRows,
      }, { status: 201 });

    } catch (transactionErr: any) {
      // En cas d'erreur (ex: film_id 99999 inexistant), withTransaction a déjà exécuté ROLLBACK
      const rollbackCountRes = await query(
        "SELECT COUNT(*) AS visionnages FROM journal WHERE utilisateur_id = $1;",
        [userId]
      );
      const visionnagesApresRollback = parseInt(rollbackCountRes.rows[0]?.visionnages || "0", 10);

      console.warn("[API POST /journal] Transaction ROLLBACK exécuté avec succès suite à l'erreur:", transactionErr.message);

      return NextResponse.json({
        success: false,
        error: "Échec de l'insertion transactionnelle. ROLLBACK effectué : aucun film n'a été inséré.",
        detail: transactionErr.message,
        visionnagesAvant,
        visionnagesApres: visionnagesApresRollback,
        atomicityPreserved: visionnagesAvant === visionnagesApresRollback,
      }, { status: 400 });
    }
  } catch (err: any) {
    console.error("[API POST /journal] Erreur générale:", err);
    return NextResponse.json(
      { error: "Erreur serveur lors de l'enregistrement dans le journal" },
      { status: 500 }
    );
  }
}
