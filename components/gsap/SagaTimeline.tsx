"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { SagaEpisode } from "@/types/api";
import { useReducedMotion } from "@/lib/gsap/useReducedMotion";
import { Badge } from "@/components/ui/badge";
import { Star, Clapperboard } from "lucide-react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface SagaTimelineProps {
  sagaName: string;
  episodes: SagaEpisode[];
  currentFilmId: string;
}

export function SagaTimeline({
  sagaName,
  episodes,
  currentFilmId,
}: SagaTimelineProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const isMultiEpisode = episodes.length > 1;

  useGSAP(
    () => {
      if (
        reducedMotion ||
        !isMultiEpisode ||
        !containerRef.current ||
        !trackRef.current ||
        window.innerWidth < 768
      ) {
        return;
      }

      const track = trackRef.current;
      const totalWidth = track.scrollWidth - track.clientWidth;

      if (totalWidth <= 0) return;

      const tween = gsap.to(track, {
        x: -totalWidth,
        ease: "none", // MANDATORY for 1:1 scroll-to-position mapping
        scrollTrigger: {
          trigger: containerRef.current,
          pin: true,
          scrub: 0.8,
          start: "top 20%",
          end: () => `+=${totalWidth + 300}`,
          invalidateOnRefresh: true,
        },
      });

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    },
    {
      scope: containerRef,
      dependencies: [episodes, isMultiEpisode, reducedMotion],
    }
  );

  return (
    <section ref={containerRef} className="my-16 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-gold-400 font-semibold uppercase tracking-wider mb-1">
            <Clapperboard className="h-3.5 w-3.5" />
            Frise Chronologique de la Saga
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            {sagaName}
          </h2>
        </div>
        <Badge variant="outline" className="hidden sm:inline-flex">
          {episodes.length} volets
        </Badge>
      </div>

      <div
        ref={trackRef}
        className="flex gap-6 pb-6 overflow-x-auto md:overflow-x-visible scrollbar-none will-change-transform"
      >
        {episodes.map((episode) => {
          const isCurrent = episode.id === currentFilmId;
          return (
            <Link
              key={episode.id}
              href={`/films/${episode.id}`}
              className={`group shrink-0 w-64 sm:w-72 rounded-xl border p-3 transition-all duration-300 ${
                isCurrent
                  ? "border-primary bg-card/90 ring-2 ring-primary/40 shadow-xl"
                  : "border-border/80 bg-card/50 hover:border-gold-500/50 hover:bg-card"
              }`}
            >
              <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden bg-secondary mb-3">
                <Image
                  src={episode.posterUrl}
                  alt={`Affiche de ${episode.title}`}
                  fill
                  sizes="(max-width: 768px) 256px, 288px"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 backdrop-blur-sm text-xs font-semibold text-white">
                  Volet #{episode.orderInSaga}
                </div>
                {isCurrent && (
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-primary text-black text-xs font-bold shadow">
                    En cours
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <h3 className="font-display font-bold text-base text-foreground group-hover:text-primary transition-colors truncate">
                  {episode.title}
                </h3>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{episode.releaseYear} • {episode.durationFormatted || "2h 00m"}</span>
                  <span className="flex items-center gap-1 font-semibold text-gold-400">
                    <Star className="h-3 w-3 fill-current" />
                    {Number(episode.weightedRating ?? 0).toFixed(1)}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
