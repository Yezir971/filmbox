// --no-request: ALTER TABLE films ADD COLUMN IF NOT EXISTS poster_url TEXT, ADD COLUMN IF NOT EXISTS backdrop_url TEXT, ADD COLUMN IF NOT EXISTS synopsis TEXT;
// --no-request: ALTER TABLE journal ADD COLUMN IF NOT EXISTS commentaire TEXT, ADD COLUMN IF NOT EXISTS rewatch BOOLEAN DEFAULT false;
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { mapRowToFilm, getMediaForTitle } from "@/lib/db/mapper";
import type { DashboardStats, JournalEntry } from "@/types/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Tendances : Top films via la vue matérialisée mv_stats_films (optimisée avec idx_mv_stats_films_moyenne)
    const trendingSql = `
      SELECT 
        f.id, 
        f.titre, 
        f.annee, 
        f.genre, 
        f.details, 
        s.moyenne, 
        s.nb_notes,
        duree_texte((f.details ->> 'duree')::INTEGER) AS duree_texte,
        COALESCE(note_ponderee(f.id), s.moyenne) AS note_ponderee
      FROM mv_stats_films s
      JOIN films f ON f.id = s.film_id
      WHERE s.nb_notes >= 1
      ORDER BY s.moyenne DESC, s.nb_notes DESC
      LIMIT 6;
    `;
    const trendingRes = await query(trendingSql);
    const trendingFilms = trendingRes.rows.map(mapRowToFilm);

    // 2. Derniers visionnages de la communauté selon la requête 8.4 de exo.sql (exploite idx_journal_date_id)
    const journalSql = `
      SELECT 
        j.id, 
        j.date_visionnage, 
        f.id AS film_id, 
        f.titre, 
        u.pseudo,
        n.note
      FROM journal j 
      JOIN films f ON f.id = j.film_id 
      JOIN utilisateurs u ON u.id = j.utilisateur_id 
      LEFT JOIN notes n ON n.film_id = f.id AND n.utilisateur_id = u.id
      ORDER BY j.date_visionnage DESC, j.id DESC 
      LIMIT 8;
    `;
    const journalRes = await query(journalSql);
    const recentCommunityJournal: JournalEntry[] = journalRes.rows.map((row: any) => {
      const media = getMediaForTitle(row.titre);
      return {
        id: String(row.id),
        filmId: String(row.film_id),
        filmTitle: row.titre,
        posterUrl: media.poster,
        watchedAt: new Date(row.date_visionnage).toISOString(),
        note: row.note ? parseFloat(row.note) : undefined,
        comment: `Visionné par @${row.pseudo}`,
        rewatch: false,
      };
    });

    // 3. Décompte global instantané des visionnages (lecture directe de pg_class)
    const countSql = `SELECT reltuples::BIGINT AS total FROM pg_class WHERE relname = 'journal';`;
    const countRes = await query(countSql);
    const totalCommunityLogsToday = parseInt(countRes.rows[0]?.total || "0", 10);

    const stats: DashboardStats = {
      trendingFilms,
      recentCommunityJournal,
      topRankingsPreview: trendingFilms.slice(0, 3),
      totalCommunityLogsToday,
    };

    return NextResponse.json(stats);
  } catch (err) {
    console.error("[API /stats] DB error:", err);
    return NextResponse.json({ error: "Erreur lors de la récupération des statistiques" }, { status: 500 });
  }
}
