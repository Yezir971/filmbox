"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Erreur de chargement",
  message = "Impossible de récupérer les données pour le moment. Veuillez vérifier votre connexion ou réessayer.",
  onRetry,
  className = "",
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-destructive/30 bg-destructive/5 text-card-foreground my-6 max-w-lg mx-auto ${className}`}
    >
      <div className="rounded-full bg-destructive/10 p-4 mb-4 text-destructive">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h3 className="font-display text-xl font-bold mb-2 text-foreground">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          className="border-destructive/40 hover:bg-destructive/10 text-foreground flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Réessayer
        </Button>
      )}
    </div>
  );
}
