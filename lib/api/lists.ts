import { apiClient } from "./client";
import type { Liste, ListeDetail } from "@/types/api";

export async function getPublicLists(): Promise<Liste[]> {
  return apiClient<Liste[]>("/api/lists", {
    next: { revalidate: 60 },
  });
}

export async function getListById(id: string): Promise<ListeDetail> {
  return apiClient<ListeDetail>(`/api/lists/${id}`, {
    next: { revalidate: 60 },
  });
}

export interface CreateListPayload {
  title: string;
  description: string;
  isPublic: boolean;
}

export async function createList(payload: CreateListPayload): Promise<Liste> {
  return apiClient<Liste>("/api/lists", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface AddFilmToListPayload {
  filmId: string;
  comment?: string;
  position?: number;
}

export async function addFilmToList(
  listId: string,
  payload: AddFilmToListPayload
): Promise<ListeDetail> {
  return apiClient<ListeDetail>(`/api/lists/${listId}/films`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
