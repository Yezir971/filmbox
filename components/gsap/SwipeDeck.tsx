"use client";

import * as React from "react";
import Image from "next/image";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import { useGSAP } from "@gsap/react";
import type { Suggestion } from "@/types/api";
import { useReducedMotion } from "@/lib/gsap/useReducedMotion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, X, Sparkles, Star, Film, RotateCcw } from "lucide-react";

gsap.registerPlugin(useGSAP, Draggable);

interface SwipeDeckProps {
  suggestions: Suggestion[];
  onSwipeRight: (suggestion: Suggestion) => void;
  onSwipeLeft: (suggestion: Suggestion) => void;
}

export function SwipeDeck({
  suggestions,
  onSwipeRight,
  onSwipeLeft,
}: SwipeDeckProps) {
  const [deck, setDeck] = React.useState<Suggestion[]>(suggestions);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const topCardRef = React.useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  // Reset deck if suggestions update
  React.useEffect(() => {
    setDeck(suggestions);
  }, [suggestions]);

  const currentCard = deck[0];

  const popCard = React.useCallback(() => {
    setDeck((prev) => prev.slice(1));
  }, []);

  const triggerSwipe = React.useCallback(
    (direction: "left" | "right") => {
      if (!currentCard || !topCardRef.current) return;

      const card = topCardRef.current;
      const targetX = direction === "right" ? window.innerWidth : -window.innerWidth;
      const targetRotation = direction === "right" ? 30 : -30;

      if (reducedMotion) {
        if (direction === "right") onSwipeRight(currentCard);
        else onSwipeLeft(currentCard);
        popCard();
        return;
      }

      gsap.to(card, {
        x: targetX,
        rotation: targetRotation,
        opacity: 0,
        duration: 0.45,
        ease: "power2.in",
        onComplete: () => {
          if (direction === "right") onSwipeRight(currentCard);
          else onSwipeLeft(currentCard);
          gsap.set(card, { x: 0, y: 0, rotation: 0, opacity: 1 });
          popCard();
        },
      });
    },
    [currentCard, onSwipeLeft, onSwipeRight, popCard, reducedMotion]
  );

  useGSAP(
    () => {
      if (!topCardRef.current || !currentCard || reducedMotion) return;

      const card = topCardRef.current;
      let lastX = 0;
      let lastTime = Date.now();
      let velocityX = 0;

      const draggableInstances = Draggable.create(card, {
        type: "x,y",
        edgeResistance: 0.65,
        onDragStart: function () {
          lastX = this.x;
          lastTime = Date.now();
        },
        onDrag: function () {
          const now = Date.now();
          const dt = Math.max(1, now - lastTime);
          const dx = this.x - lastX;
          velocityX = dx / dt; // pixels per ms
          lastX = this.x;
          lastTime = now;

          // Natural rotation proportional to horizontal drag
          const rotation = (this.x / 20) * 1.5;
          gsap.set(card, { rotation });
        },
        onDragEnd: function () {
          const thresholdDistance = 120;
          const thresholdVelocity = 0.5; // fast flick

          if (this.x > thresholdDistance || velocityX > thresholdVelocity) {
            triggerSwipe("right");
          } else if (this.x < -thresholdDistance || velocityX < -thresholdVelocity) {
            triggerSwipe("left");
          } else {
            // Snap back
            gsap.to(card, {
              x: 0,
              y: 0,
              rotation: 0,
              duration: 0.4,
              ease: "power3.out",
            });
          }
        },
      });

      return () => {
        draggableInstances.forEach((inst) => inst.kill());
      };
    },
    { scope: containerRef, dependencies: [currentCard, reducedMotion, triggerSwipe] }
  );

  if (!currentCard) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-border bg-card/60 max-w-md mx-auto my-12">
        <div className="rounded-full bg-primary/10 p-5 mb-4 text-primary">
          <Film className="h-10 w-10 text-gold-400" />
        </div>
        <h2 className="font-display text-2xl font-bold mb-2">
          Fin de la bobine !
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Vous avez exploré toutes les recommandations du jour basées sur vos affinités.
        </p>
        <Button
          variant="gold"
          onClick={() => setDeck(suggestions)}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Recommencer la sélection
        </Button>
      </div>
    );
  }

  const { film, matchScore, reason } = currentCard;

  return (
    <div ref={containerRef} className="flex flex-col items-center max-w-md mx-auto select-none">
      {/* Cards Stack */}
      <div className="relative w-full h-[520px]">
        {/* Next card in stack (underneath) */}
        {deck[1] && (
          <div className="absolute inset-0 rounded-2xl border border-border/40 bg-card/40 p-4 shadow-md scale-95 translate-y-3 pointer-events-none opacity-60">
            <div className="relative w-full h-full rounded-xl overflow-hidden bg-secondary">
              <Image
                src={deck[1].film.posterUrl}
                alt=""
                fill
                sizes="400px"
                className="object-cover"
              />
            </div>
          </div>
        )}

        {/* Top Active Draggable Card */}
        <div
          ref={topCardRef}
          className="absolute inset-0 rounded-2xl border border-border bg-card p-4 shadow-2xl cursor-grab active:cursor-grabbing will-change-transform flex flex-col justify-between"
        >
          <div className="relative w-full h-[340px] rounded-xl overflow-hidden bg-secondary">
            <Image
              src={film.posterUrl}
              alt={`Affiche de ${film.title}`}
              fill
              priority
              sizes="420px"
              className="object-cover pointer-events-none"
            />
            <div className="absolute top-3 left-3 flex gap-2">
              <Badge variant="gold" className="shadow-lg backdrop-blur-sm">
                <Sparkles className="h-3 w-3 mr-1" />
                {matchScore}% Affinité
              </Badge>
              {film.hasOscars && (
                <Badge variant="velvet" className="shadow-lg backdrop-blur-sm">
                  Oscarisé
                </Badge>
              )}
            </div>
            <div className="absolute bottom-3 right-3 px-2 py-1 rounded bg-black/80 backdrop-blur-sm text-xs font-semibold text-gold-400 flex items-center gap-1 shadow">
              <Star className="h-3.5 w-3.5 fill-current" />
              {film.weightedRating.toFixed(1)} / 5
            </div>
          </div>

          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-foreground truncate">
                {film.title}
              </h2>
              <span className="text-xs text-muted-foreground">
                {film.releaseYear} • {film.durationFormatted}
              </span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {film.synopsis}
            </p>
            <div className="p-2 rounded-lg bg-secondary/40 border border-border/50 text-[11px] text-gold-300/90 leading-tight">
              {reason}
            </div>
          </div>
        </div>
      </div>

      {/* Swipe Action Controls */}
      <div className="flex items-center justify-center gap-8 mt-6">
        <Button
          type="button"
          onClick={() => triggerSwipe("left")}
          variant="outline"
          size="icon"
          aria-label="Ignorer ce film"
          className="h-14 w-14 rounded-full border-2 border-border/80 hover:border-destructive hover:bg-destructive/10 text-muted-foreground hover:text-destructive shadow-lg transition-transform active:scale-95"
        >
          <X className="h-6 w-6 stroke-[2.5]" />
        </Button>
        <Button
          type="button"
          onClick={() => triggerSwipe("right")}
          variant="gold"
          size="icon"
          aria-label="Ajouter ce film à mes envies"
          className="h-16 w-16 rounded-full shadow-xl transition-transform active:scale-95"
        >
          <Heart className="h-7 w-7 fill-current" />
        </Button>
      </div>
      <div className="flex items-center gap-8 mt-2 text-xs text-muted-foreground font-medium">
        <span>Glisser gauche : Ignorer</span>
        <span>Glisser droite : Envie</span>
      </div>
    </div>
  );
}
