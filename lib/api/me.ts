import { apiClient } from "./client";
import type { Session } from "@/types/api";

export async function getCurrentUser(): Promise<Session> {
  try {
    return await apiClient<Session>("/api/me", {
      cache: "no-store",
    });
  } catch {
    // If not authenticated or backend unavailable, return null user session
    return { user: null };
  }
}
