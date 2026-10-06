import { apiClient } from "./client";
import type { JournalEntry } from "@/types/api";

export interface AddToJournalPayload {
  filmId: string;
  watchedAt?: string;
  note?: number;
  comment?: string;
  rewatch?: boolean;
}

export async function addToJournal(
  payload: AddToJournalPayload
): Promise<JournalEntry> {
  return apiClient<JournalEntry>("/api/journal", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface AddMultipleToJournalPayload {
  userId?: number;
  userPseudo?: string;
  filmIds: number[];
  dateVisionnage?: string;
}

export interface BatchJournalResponse {
  success: boolean;
  message?: string;
  error?: string;
  detail?: string;
  visionnagesAvant?: number;
  visionnagesApres?: number;
  insertedCount?: number;
  atomicityPreserved?: boolean;
}

/**
 * 15.3 : Ajout multiple dans le journal avec garantie d'atomicité ACID (ROLLBACK en cas d'erreur)
 */
export async function addMultipleToJournal(
  payload: AddMultipleToJournalPayload
): Promise<BatchJournalResponse> {
  return apiClient<BatchJournalResponse>("/api/journal", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Récupère le nombre de visionnages d'un utilisateur (SELECT COUNT(*) AS visionnages)
 */
export async function getJournalCount(userId: number = 5): Promise<{ userId: number; visionnages: number }> {
  return apiClient<{ userId: number; visionnages: number }>("/api/journal", {
    params: { userId },
  });
}

