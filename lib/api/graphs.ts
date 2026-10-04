import { apiClient } from "./client";
import type { BaconPath } from "@/types/api";

export async function getBaconPath(
  sourceActor: string,
  targetActor: string
): Promise<BaconPath> {
  return apiClient<BaconPath>("/api/graphs/bacon", {
    params: {
      source: sourceActor,
      target: targetActor,
    },
    cache: "no-store",
  });
}
