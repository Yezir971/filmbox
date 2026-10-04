"use client";

import * as React from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { BaconPath } from "@/types/api";
import { getBaconPath } from "@/lib/api/graphs";
import { useReducedMotion } from "@/lib/gsap/useReducedMotion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Sparkles, User, Film, Search, Loader2 } from "lucide-react";

gsap.registerPlugin(useGSAP);

export function BaconPathViewer() {
  const [source, setSource] = React.useState("Leonardo DiCaprio");
  const [target, setTarget] = React.useState("Kevin Bacon");
  const [result, setResult] = React.useState<BaconPath | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const chainRef = React.useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!source.trim() || !target.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getBaconPath(source, target);
      setResult(data);
    } catch {
      setError("Impossible de relier ces deux artistes. Veuillez essayer d'autres noms.");
    } finally {
      setLoading(false);
    }
  };

  useGSAP(
    () => {
      if (!result || !chainRef.current || reducedMotion) return;

      const nodes = chainRef.current.querySelectorAll(".chain-node");
      if (nodes.length === 0) return;

      gsap.from(nodes, {
        opacity: 0,
        y: 20,
        scale: 0.95,
        stagger: 0.12,
        duration: 0.45,
        ease: "power2.out",
      });
    },
    { scope: chainRef, dependencies: [result, reducedMotion] }
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-1">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold-400 uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5" />
          Six Degrés de Séparation
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground">
          Bacon Path (Graphe de Casting)
        </h2>
        <p className="text-sm text-muted-foreground">
          Découvrez la chaîne de connexions cinématographiques reliant deux acteurs à travers leurs films communs.
        </p>
      </div>

      {/* Search Form */}
      <form
        onSubmit={handleSearch}
        className="grid grid-cols-1 sm:grid-cols-5 gap-3 p-4 rounded-xl border border-border bg-card/60"
      >
        <div className="sm:col-span-2 space-y-1">
          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <User className="h-3 w-3" /> Acteur Source
          </label>
          <Input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Ex: Leonardo DiCaprio"
            required
          />
        </div>
        <div className="sm:col-span-2 space-y-1">
          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <User className="h-3 w-3" /> Acteur Cible
          </label>
          <Input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="Ex: Kevin Bacon"
            required
          />
        </div>
        <div className="sm:col-span-1 flex items-end">
          <Button
            type="submit"
            disabled={loading}
            variant="gold"
            className="w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Relier
          </Button>
        </div>
      </form>

      {error && (
        <div className="p-4 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Results Chain */}
      {result && (
        <div ref={chainRef} className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">
              Résultat :{" "}
              <span className="text-gold-400 font-bold">
                {result.degreesOfSeparation} degrés de séparation
              </span>
            </span>
            <Badge variant="gold">Chemin le plus court</Badge>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3 overflow-x-auto p-4 rounded-xl border border-border bg-card/40">
            {result.path.map((step, idx) => (
              <React.Fragment key={idx}>
                {/* Actor Card */}
                <Card className="chain-node shrink-0 w-48 border-border/80 bg-card hover:border-gold-500/40 transition-colors">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="relative h-12 w-12 rounded-full overflow-hidden bg-secondary shrink-0 border border-primary/30">
                      {step.actor.photoUrl ? (
                        <Image
                          src={step.actor.photoUrl}
                          alt={step.actor.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <User className="h-6 w-6 m-auto text-muted-foreground" />
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs text-muted-foreground">Acteur</div>
                      <div className="text-sm font-bold truncate text-foreground">
                        {step.actor.name}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Arrow with Film */}
                <div className="chain-node flex flex-col items-center shrink-0 px-2 py-1">
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary/80 border border-border text-xs text-gold-300 font-medium max-w-[180px] truncate">
                    <Film className="h-3 w-3 shrink-0" />
                    <span className="truncate">{step.film.title} ({step.film.releaseYear})</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-primary mt-1 hidden md:block" />
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
