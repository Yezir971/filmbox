import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { mapRowToFilm, getMediaForTitle } from "@/lib/db/mapper";
import { MOCK_FILMS, MOCK_JOURNAL } from "@/lib/mock-data";
import type { DashboardStats, JournalEntry } from "@/types/api";

export async function GET() {
  try {
    // 1. Tendances : Top films selon la requête M2.4 de exo.sql
    const trendingSql = `
      SELECT 
        f.id, 
        f.titre, 
        f.annee, 
        f.genre, 
        f.details, 
        ROUND(AVG(n.note), 2) AS moyenne, 
        COUNT(n.film_id) AS nb_notes,
        duree_texte((f.details ->> 'duree')::INTEGER) AS duree_texte,
        COALESCE(note_ponderee(f.id), AVG(n.note)) AS note_ponderee
      FROM notes n 
      INNER JOIN films f ON f.id = n.film_id 
      GROUP BY f.id, f.titre, f.annee, f.genre, f.details 
      HAVING COUNT(n.film_id) >= 3 
      ORDER BY moyenne DESC 
      LIMIT 6;
    `;
    const trendingRes = await query(trendingSql);
    const trendingFilms = trendingRes.rows.map(mapRowToFilm);

    // 2. Derniers visionnages de la communauté selon la requête 8.4 de exo.sql
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

    // 3. Décompte global des visionnages
    const countSql = `SELECT COUNT(*) AS total FROM journal;`;
    const countRes = await query(countSql);
    const totalCommunityLogsToday = parseInt(countRes.rows[0]?.total || "208", 10);

    const stats: DashboardStats = {
      trendingFilms: trendingFilms.length > 0 ? trendingFilms : MOCK_FILMS.slice(0, 4),
      recentCommunityJournal: recentCommunityJournal.length > 0 ? recentCommunityJournal : MOCK_JOURNAL,
      topRankingsPreview: trendingFilms.slice(0, 3),
      totalCommunityLogsToday,
    };

    return NextResponse.json(stats);
  } catch (err) {
    console.warn("[API /stats] DB query fallback:", err);
  }

  const stats: DashboardStats = {
    trendingFilms: MOCK_FILMS.slice(0, 4),
    recentCommunityJournal: MOCK_JOURNAL,
    topRankingsPreview: [MOCK_FILMS[1], MOCK_FILMS[0], MOCK_FILMS[4]],
    totalCommunityLogsToday: 1342,
  };

  return NextResponse.json(stats);
}
