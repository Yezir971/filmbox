"use client";

import * as React from "react";
import gsap from "gsap";
import { Star } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "@/lib/auth/useSession";
import { submitRating } from "@/lib/api/notes";
import { useReducedMotion } from "@/lib/gsap/useReducedMotion";

interface RatingStarsProps {
  filmId: string;
  initialRating?: number;
  onRatingChanged?: (newRating: number) => void;
}

export function RatingStars({
  filmId,
  initialRating = 0,
  onRatingChanged,
}: RatingStarsProps) {
  const [rating, setRating] = React.useState(initialRating);
  const [hoverRating, setHoverRating] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useSession();
  const { toast } = useToast();
  const reducedMotion = useReducedMotion();

  const handleRate = async (note: number) => {
    if (!isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Connexion requise",
        description: "Vous devez être connecté pour attribuer une note à ce film.",
      });
      return;
    }

    setRating(note);
    onRatingChanged?.(note);

    // If maximum 5-star rating, trigger dynamic DOM particle explosion
    if (note === 5 && containerRef.current && !reducedMotion) {
      triggerFiveStarExplosion();
    }

    try {
      setIsSubmitting(true);
      await submitRating({ filmId, note });
      toast({
        variant: "gold",
        title: "Note enregistrée !",
        description: `Votre note de ${note}/5 a été ajoutée à votre profil.`,
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'enregistrer la note. Veuillez réessayer.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerFiveStarExplosion = () => {
    const container = containerRef.current;
    if (!container) return;

    const particleCount = 24;
    const particles: HTMLDivElement[] = [];

    // Create dynamic DOM particles
    for (let i = 0; i < particleCount; i++) {
      const el = document.createElement("div");
      el.className =
        "pointer-events-none absolute h-2.5 w-2.5 rounded-full bg-gold-400 shadow-sm z-30";
      // Center position
      el.style.left = "50%";
      el.style.top = "50%";
      container.appendChild(el);
      particles.push(el);
    }

    // Animate outwards with random trajectories
    const timeline = gsap.timeline({
      onComplete: () => {
        // Strict DOM cleanup to prevent memory leaks
        particles.forEach((p) => {
          if (p.parentNode === container) {
            container.removeChild(p);
          }
        });
      },
    });

    particles.forEach((p) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 80 + 35;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      const scale = Math.random() * 1.4 + 0.6;

      timeline.to(
        p,
        {
          x,
          y,
          scale,
          opacity: 0,
          duration: 0.8,
          ease: "power2.out",
        },
        0 // start concurrently
      );
    });
  };

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center gap-1 select-none"
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = (hoverRating || rating) >= star;
        return (
          <button
            key={star}
            type="button"
            disabled={isSubmitting}
            onClick={() => handleRate(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            aria-label={`Attribuer la note de ${star} sur 5`}
            className="p-1 rounded-sm text-muted-foreground hover:scale-110 active:scale-95 transition-all focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                isFilled
                  ? "fill-gold-400 text-gold-400 drop-shadow-[0_0_8px_rgba(229,169,60,0.6)]"
                  : "text-muted-foreground/50 hover:text-gold-300/70"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
