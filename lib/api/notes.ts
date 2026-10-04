import { apiClient } from "./client";
import type { NoteHistorique } from "@/types/api";

export interface SubmitRatingPayload {
  filmId: string;
  note: number; // 0.5 à 5
}

export async function submitRating(
  payload: SubmitRatingPayload
): Promise<NoteHistorique> {
  return apiClient<NoteHistorique>("/api/notes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
