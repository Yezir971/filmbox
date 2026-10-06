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

/**
 * 15.2 : Incrémente le nombre de vues d'un film de manière atomique (FOR UPDATE)
 */
export async function incrementFilmViews(
  titleOrId: string | number
): Promise<{ success: boolean; id: number; titre: string; previousViews: number; nb_vues: number }> {
  return apiClient<{ success: boolean; id: number; titre: string; previousViews: number; nb_vues: number }>(
    `/api/films/${titleOrId}/view`,
    {
      method: "POST",
    }
  );
}

/**
 * 16.3 : Recherche rapide de films via la fonction SQL rechercher_films(texte)
 */
export async function quickSearchFilms(text: string): Promise<Film[]> {
  if (!text || text.trim().length === 0) return [];
  const res = await apiClient<{ films: Film[] }>("/api/films/search", {
    params: { q: text.trim() },
    cache: "no-store",
  });
  return res.films || [];
}

