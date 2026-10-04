import { getCurrentUser } from "./api/me";
import type { Session } from "@/types/api";

export async function getSession(): Promise<Session> {
  return getCurrentUser();
}
