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
