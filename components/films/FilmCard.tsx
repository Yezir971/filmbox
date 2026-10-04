import Link from "next/link";
import Image from "next/image";
import { Star, Award } from "lucide-react";
import type { Film } from "@/types/api";
import { MagneticPoster } from "@/components/gsap/MagneticPoster";
import { Badge } from "@/components/ui/badge";

interface FilmCardProps {
  film: Film;
  priority?: boolean;
}

export function FilmCard({ film, priority = false }: FilmCardProps) {
  return (
    <MagneticPoster className="h-full">
      <Link
        href={`/films/${film.id}`}
        className="group flex flex-col h-full rounded-xl border border-border/70 bg-card overflow-hidden transition-all duration-300 hover:border-gold-500/50 hover:shadow-[0_8px_30px_rgba(0,0,0,0.6)]"
      >
        <div className="relative aspect-[2/3] w-full overflow-hidden bg-secondary">
          <Image
            src={film.posterUrl}
            alt={`Affiche du film ${film.title}`}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {film.hasOscars && (
            <div className="absolute top-2 left-2">
              <Badge variant="gold" className="text-[10px] px-1.5 py-0.5 shadow-md backdrop-blur-sm flex items-center gap-1">
                <Award className="h-3 w-3" />
                Oscar
              </Badge>
            </div>
          )}
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm text-xs font-bold text-gold-400 flex items-center gap-1 shadow">
            <Star className="h-3 w-3 fill-current" />
            {film.weightedRating.toFixed(1)}
          </div>
        </div>

        <div className="flex flex-col flex-1 p-3.5 justify-between space-y-2">
          <div>
            <h2 className="font-display text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {film.title}
            </h2>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
              <span>{film.releaseYear}</span>
              <span>{film.durationFormatted}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {film.genres.slice(0, 2).map((g) => (
              <span
                key={g}
                className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/80 text-muted-foreground"
              >
                {g}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </MagneticPoster>
  );
}
