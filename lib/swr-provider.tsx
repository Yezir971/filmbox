"use client";

import { SWRConfig } from "swr";
import { apiClient } from "@/lib/api/client";
import { useToast } from "@/components/ui/use-toast";

export function SWRProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();

  return (
    <SWRConfig
      value={{
        fetcher: (url: string) => apiClient(url),
        revalidateOnFocus: false,
        shouldRetryOnError: false,
        onError: (error) => {
          // Centralized error notification on client-side fetching failures
          toast({
            variant: "destructive",
            title: "Erreur de synchronisation",
            description:
              error?.message ||
              "Une erreur est survenue lors de la récupération des données.",
          });
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
