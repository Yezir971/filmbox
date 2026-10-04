"use client";

import * as React from "react";
import { Star } from "lucide-react";

interface FilmRatingBadgeProps {
  filmId: string;
  initialWeightedRating?: number;
  initialRatingsCount?: number;
}

export function FilmRatingBadge({
  filmId,
  initialWeightedRating = 0,
  initialRatingsCount = 0,
}: FilmRatingBadgeProps) {
  const [rating, setRating] = React.useState(initialWeightedRating);
  const [count, setCount] = React.useState(initialRatingsCount);

  React.useEffect(() => {
    setRating(initialWeightedRating);
    setCount(initialRatingsCount);
  }, [initialWeightedRating, initialRatingsCount]);

  React.useEffect(() => {
    const handleRatingUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<{
        filmId: string;
        note: number;
        weightedRating?: number;
        ratingsCount?: number;
      }>;
      if (customEvent.detail && String(customEvent.detail.filmId) === String(filmId)) {
        if (customEvent.detail.weightedRating !== undefined) {
          setRating(customEvent.detail.weightedRating);
        }
        if (customEvent.detail.ratingsCount !== undefined) {
          setCount(customEvent.detail.ratingsCount);
        }
      }
    };

    window.addEventListener("filmbox:rating-updated", handleRatingUpdated);
    return () => {
      window.removeEventListener("filmbox:rating-updated", handleRatingUpdated);
    };
  }, [filmId]);

  return (
    <span className="flex items-center gap-1 font-bold text-gold-400 text-sm transition-all duration-300">
      <Star className="h-4 w-4 fill-current text-gold-400" />
      {Number(rating ?? 0).toFixed(1)} / 5
      <span className="text-muted-foreground text-xs font-normal">
        ({Number(count ?? 0).toLocaleString()} votes)
      </span>
    </span>
  );
}
