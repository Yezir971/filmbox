"use client";

import * as React from "react";
import useSWR from "swr";
import Link from "next/link";
import { useSession } from "@/lib/auth/useSession";
import { SwipeDeck } from "@/components/gsap/SwipeDeck";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { addToJournal } from "@/lib/api/journal";
import type { Suggestion } from "@/types/api";
import { Compass, Film, Lock, Sparkles, Heart } from "lucide-react";

export default function DecouvertePage() {
  const { user, isAuthenticated } = useSession();
  const { toast } = useToast();

  const pseudo = user?.pseudo || "Alice";
  const { data: suggestions, isLoading } = useSWR<Suggestion[]>(
    isAuthenticated ? `/api/users/${pseudo}/suggestions` : null
  );

  const handleSwipeRight = async (suggestion: Suggestion) => {
    try {
      await addToJournal({
        filmId: suggestion.film.id,
        rewatch: false,
      });
      toast({
        variant: "gold",
        title: "Ajouté à vos envies !",
        description: `"${suggestion.film.title}" a rejoint vos films à visionner.`,
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'enregistrer le film.",
      });
    }
  };

  const handleSwipeLeft = (suggestion: Suggestion) => {
    toast({
      title: "Film écarté",
      description: `"${suggestion.film.title}" ne vous sera plus suggéré aujourd'hui.`,
    });
  };

  // Unauthenticated State Handling (per AGENT.md guidelines)
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-3xl border border-border bg-card/60 max-w-lg mx-auto my-12 shadow-2xl">
        <div className="rounded-full bg-primary/10 p-5 mb-5 text-primary border border-primary/20">
          <Lock className="h-10 w-10 text-gold-400" />
        </div>
        <h1 className="font-display text-3xl font-black text-foreground mb-3">
          Découverte Personnalisée
        </h1>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Le mode Découverte par balayage nécessite une session active afin d&apos;analyser votre historique de visionnage et calibrer les suggestions.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/catalogue">
            <Button variant="outline" className="flex items-center gap-2">
              <Film className="h-4 w-4" />
              Explorer le Catalogue
            </Button>
          </Link>
          <Link href="/classements">
            <Button variant="gold" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Voir les Tendances
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs text-gold-400 font-semibold uppercase tracking-wider">
          <Compass className="h-3.5 w-3.5" />
          Sérendipité &amp; Affinités
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-black text-foreground">
          Découverte Swipe
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Faites glisser la carte à droite pour enregistrer dans vos envies, ou à gauche pour passer au suivant.
        </p>
      </div>

      {/* Swipe Deck */}
      {isLoading ? (
        <div className="max-w-md mx-auto space-y-4">
          <Skeleton className="w-full h-[480px] rounded-2xl" />
          <div className="flex justify-center gap-6">
            <Skeleton className="h-14 w-14 rounded-full" />
            <Skeleton className="h-14 w-14 rounded-full" />
          </div>
        </div>
      ) : suggestions && suggestions.length > 0 ? (
        <SwipeDeck
          suggestions={suggestions}
          onSwipeRight={handleSwipeRight}
          onSwipeLeft={handleSwipeLeft}
        />
      ) : (
        <div className="text-center p-8 text-muted-foreground">
          Aucune suggestion disponible pour le moment.
        </div>
      )}
    </div>
  );
}
