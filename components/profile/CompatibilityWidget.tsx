"use client";

import * as React from "react";
import { getCompatibility } from "@/lib/api/users";
import type { CompatibilityScore } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Users, Loader2, Heart } from "lucide-react";

export function CompatibilityWidget({ currentPseudo }: { currentPseudo: string }) {
  const [targetPseudo, setTargetPseudo] = React.useState("Bob");
  const [loading, setLoading] = React.useState(false);
  const [scoreData, setScoreData] = React.useState<CompatibilityScore | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleCompute = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!targetPseudo.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getCompatibility(currentPseudo, targetPseudo);
      setScoreData(data);
    } catch {
      setError("Impossible d'évaluer la compatibilité avec ce membre.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-6 rounded-2xl border border-border/80 bg-card/60">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-gold-400" />
          <h2 className="font-display font-bold text-lg text-foreground">
            Test de Compatibilité Cinéphile
          </h2>
        </div>
        <Badge variant="gold" className="text-xs">
          IA Match
        </Badge>
      </div>

      <p className="text-xs text-muted-foreground">
        Mesurez vos affinités de goûts et comparez vos chefs-d&apos;œuvre favoris avec un autre membre de la communauté.
      </p>

      <form onSubmit={handleCompute} className="flex gap-2">
        <Input
          value={targetPseudo}
          onChange={(e) => setTargetPseudo(e.target.value)}
          placeholder="Pseudo du cinéphile (ex: Bob)"
          className="bg-secondary/60 text-sm"
          required
        />
        <Button
          type="submit"
          disabled={loading}
          variant="gold"
          className="shrink-0 flex items-center gap-1.5"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Tester
        </Button>
      </form>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs">
          {error}
        </div>
      )}

      {scoreData && (
        <div className="p-4 rounded-xl border border-gold-500/30 bg-gold-950/20 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">
              Score avec <strong className="text-gold-400">{scoreData.targetPseudo}</strong>
            </span>
            <span className="font-display text-2xl font-black text-gold-400 flex items-center gap-1">
              <Heart className="h-5 w-5 fill-current text-rose-500" />
              {scoreData.score}%
            </span>
          </div>

          <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-gold-400 h-full rounded-full transition-all duration-700"
              style={{ width: `${scoreData.score}%` }}
            />
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed italic">
            &quot;{scoreData.summary}&quot;
          </p>

          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[11px] text-muted-foreground mr-1">Genres partagés :</span>
            {scoreData.sharedTopGenres.map((g) => (
              <Badge key={g} variant="secondary" className="text-[10px]">
                {g}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
