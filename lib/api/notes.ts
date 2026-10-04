import { apiClient } from "./client";
import type { NoteHistorique } from "@/types/api";

export interface SubmitRatingPayload {
  filmId: string;
  note: number; // 0.5 à 5
  userPseudo?: string;
}

export interface SubmitRatingResponse extends NoteHistorique {
  weightedRating?: number;
  ratingsCount?: number;
}

export async function submitRating(
  payload: SubmitRatingPayload
): Promise<SubmitRatingResponse> {
  return apiClient<SubmitRatingResponse>("/api/notes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getUserFilmNote(
  filmId: string,
  userPseudo?: string
): Promise<number | null> {
  try {
    const data = await apiClient<{ note: number | null }>(
      `/api/notes?filmId=${filmId}&userPseudo=${encodeURIComponent(userPseudo || "cinephile_92")}`,
      { cache: "no-store" }
    );
    return data.note;
  } catch {
    return null;
  }
}
