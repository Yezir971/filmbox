import { apiClient } from "./client";
import type { Profil, JournalEntry, CompatibilityScore, Suggestion } from "@/types/api";

export async function getUserProfile(pseudo: string): Promise<Profil> {
  return apiClient<Profil>(`/api/users/${pseudo}`, {
    cache: "no-store",
  });
}

export async function getUserJournal(pseudo: string): Promise<JournalEntry[]> {
  return apiClient<JournalEntry[]>(`/api/users/${pseudo}/journal`, {
    cache: "no-store",
  });
}

export async function getCompatibility(
  pseudo: string,
  targetPseudo: string
): Promise<CompatibilityScore> {
  return apiClient<CompatibilityScore>(`/api/users/${pseudo}/compatibility`, {
    params: { with: targetPseudo },
    cache: "no-store",
  });
}

export async function getUserSuggestions(pseudo: string): Promise<Suggestion[]> {
  return apiClient<Suggestion[]>(`/api/users/${pseudo}/suggestions`, {
    cache: "no-store",
  });
}
