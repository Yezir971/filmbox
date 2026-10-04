import { apiClient } from "./client";
import type { RankingGenre, RankingDirector, PolarizingFilm } from "@/types/api";

export async function getRankingsByGenre(): Promise<RankingGenre[]> {
  return apiClient<RankingGenre[]>("/api/rankings/genres", {
    next: { revalidate: 3600 },
  });
}

export async function getRankingsByDirector(): Promise<RankingDirector[]> {
  return apiClient<RankingDirector[]>("/api/rankings/directors", {
    next: { revalidate: 3600 },
  });
}

export async function getPolarizingFilms(): Promise<PolarizingFilm[]> {
  return apiClient<PolarizingFilm[]>("/api/rankings/polarizing", {
    next: { revalidate: 3600 },
  });
}

export async function getAllRankings(): Promise<{
  genres: RankingGenre[];
  directors: RankingDirector[];
  polarizing: PolarizingFilm[];
}> {
  const [genres, directors, polarizing] = await Promise.all([
    getRankingsByGenre(),
    getRankingsByDirector(),
    getPolarizingFilms(),
  ]);

  return { genres, directors, polarizing };
}
