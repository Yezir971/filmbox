"use client";

import * as React from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Bookmark, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "@/lib/auth/useSession";
import { addToJournal } from "@/lib/api/journal";
import { useReducedMotion } from "@/lib/gsap/useReducedMotion";

gsap.registerPlugin(useGSAP);

interface JournalButtonProps {
  filmId: string;
  filmTitle: string;
  className?: string;
  onSuccess?: () => void;
}

export function JournalButton({
  filmId,
  filmTitle,
  className = "",
  onSuccess,
}: JournalButtonProps) {
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const checkPathRef = React.useRef<SVGPathElement>(null);
  const { isAuthenticated } = useSession();
  const { toast } = useToast();
  const reducedMotion = useReducedMotion();

  const handleClick = async () => {
    if (!isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Connexion requise",
        description: "Veuillez vous connecter pour enregistrer vos visionnages.",
      });
      return;
    }

    if (status === "loading" || status === "success") return;

    setStatus("loading");

    // Elastic compression animation
    if (!reducedMotion && buttonRef.current) {
      gsap.to(buttonRef.current, {
        scale: 0.92,
        duration: 0.2,
        ease: "power2.inOut",
      });
    }

    try {
      await addToJournal({
        filmId,
        watchedAt: new Date().toISOString(),
      });

      setStatus("success");
      onSuccess?.();

      if (reducedMotion) {
        toast({
          variant: "gold",
          title: "Ajouté au journal",
          description: `"${filmTitle}" a bien été ajouté à vos films vus.`,
        });
        return;
      }

      // DrawSVG alternative: animate stroke-dashoffset on the SVG checkmark path
      if (buttonRef.current && checkPathRef.current) {
        const path = checkPathRef.current;
        const length = path.getTotalLength();
        path.style.strokeDasharray = `${length}`;
        path.style.strokeDashoffset = `${length}`;

        const tl = gsap.timeline();
        tl.to(buttonRef.current, {
          scale: 1,
          duration: 0.5,
          ease: "elastic.out(1, 0.3)",
        })
          .to(path, {
            strokeDashoffset: 0,
            duration: 0.45,
            ease: "power2.out",
          }, "-=0.2");
      }

      toast({
        variant: "gold",
        title: "Ajouté au journal",
        description: `"${filmTitle}" a été marqué comme visionné.`,
      });
    } catch {
      setStatus("error");
      if (buttonRef.current) {
        gsap.to(buttonRef.current, {
          scale: 1,
          duration: 0.3,
          ease: "power2.out",
        });
      }
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'enregistrer le visionnage dans le journal.",
      });
      setTimeout(() => setStatus("idle"), 2500);
    }
  };

  return (
    <Button
      ref={buttonRef}
      onClick={handleClick}
      disabled={status === "loading"}
      variant={status === "success" ? "gold" : "velvet"}
      className={`relative inline-flex items-center justify-center gap-2 overflow-hidden transition-all duration-300 font-semibold shadow-lg ${className}`}
    >
      {status === "loading" ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-white" />
          <span>Enregistrement...</span>
        </>
      ) : status === "success" ? (
        <span className="inline-flex items-center gap-2 text-black">
          <svg
            className="h-5 w-5 stroke-current fill-none stroke-[2.5]"
            viewBox="0 0 24 24"
          >
            <path
              ref={checkPathRef}
              d="M5 13l4 4L19 7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Visionné</span>
        </span>
      ) : (
        <>
          <Bookmark className="h-4 w-4" />
          <span>Ajouter au journal</span>
        </>
      )}
    </Button>
  );
}
