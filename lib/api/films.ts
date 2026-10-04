import { apiClient } from "./client";
import type { Film, FicheFilm, SagaEpisode } from "@/types/api";

export interface GetFilmsParams {
  page?: number;
  limit?: number;
  genre?: string;
  decade?: string;
  director?: string;
  hasOscars?: boolean;
  minDuration?: number;
  maxDuration?: number;
  search?: string;
}

export async function getFilms(params?: GetFilmsParams): Promise<{ films: Film[]; total: number; page: number; totalPages: number }> {
  return apiClient<{ films: Film[]; total: number; page: number; totalPages: number }>("/api/films", {
    params: params as Record<string, string | number | boolean | undefined>,
    cache: "no-store",
  });
}

export async function getFilmById(id: string, userPseudo?: string): Promise<FicheFilm> {
  return apiClient<FicheFilm>(`/api/films/${id}`, {
    params: userPseudo ? { pseudo: userPseudo } : undefined,
    cache: "no-store",
  });
}

export async function getFilmSaga(id: string): Promise<{ sagaId: string; sagaName: string; episodes: SagaEpisode[] } | null> {
  try {
    return await apiClient<{ sagaId: string; sagaName: string; episodes: SagaEpisode[] }>(`/api/films/${id}/saga`, {
      cache: "no-store",
    });
  } catch {
    return null;
  }
}
