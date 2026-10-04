"use client";

import * as React from "react";
import useSWR from "swr";
import { useRouter, useSearchParams } from "next/navigation";
import type { Film } from "@/types/api";
import { FilmCard } from "@/components/films/FilmCard";
import { FilmGridSkeleton } from "@/components/skeletons/FilmCardSkeleton";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, RotateCcw, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";

interface CatalogueClientProps {
  initialFilms: Film[];
  initialTotal: number;
  initialPage: number;
  initialTotalPages: number;
}

export function CatalogueClient({
  initialFilms,
  initialTotal,
  initialPage,
  initialTotalPages,
}: CatalogueClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State from URL or defaults
  const [search, setSearch] = React.useState(searchParams.get("search") || "");
  const [genre, setGenre] = React.useState(searchParams.get("genre") || "all");
  const [decade, setDecade] = React.useState(searchParams.get("decade") || "all");
  const [maxDuration, setMaxDuration] = React.useState<number>(
    parseInt(searchParams.get("maxDuration") || "240", 10)
  );
  const [hasOscars, setHasOscars] = React.useState(
    searchParams.get("hasOscars") === "true"
  );
  const [page, setPage] = React.useState(
    parseInt(searchParams.get("page") || String(initialPage), 10)
  );
  const [isFiltersOpen, setIsFiltersOpen] = React.useState(false);

  // Debounced search & duration
  const [debouncedSearch, setDebouncedSearch] = React.useState(search);
  const [debouncedDuration, setDebouncedDuration] = React.useState(maxDuration);

  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handler);
  }, [search]);

  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedDuration(maxDuration), 200);
    return () => clearTimeout(handler);
  }, [maxDuration]);

  // Construct query string for SWR and URL sync
  const queryParams = React.useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (genre !== "all") params.set("genre", genre);
    if (decade !== "all") params.set("decade", decade);
    if (debouncedDuration < 240) params.set("maxDuration", String(debouncedDuration));
    if (hasOscars) params.set("hasOscars", "true");
    if (page > 1) params.set("page", String(page));
    return params.toString();
  }, [debouncedSearch, genre, decade, debouncedDuration, hasOscars, page]);

  // Sync with URL for shareable links
  React.useEffect(() => {
    const newUrl = queryParams ? `/catalogue?${queryParams}` : "/catalogue";
    router.replace(newUrl, { scroll: false });
  }, [queryParams, router]);

  // Fetch with SWR
  const apiUrl = `/api/films${queryParams ? `?${queryParams}` : ""}`;
  const { data, isLoading } = useSWR<{
    films: Film[];
    total: number;
    page: number;
    totalPages: number;
  }>(apiUrl, {
    fallbackData: {
      films: initialFilms,
      total: initialTotal,
      page: initialPage,
      totalPages: initialTotalPages,
    },
    keepPreviousData: true,
  });

  const films = data?.films || [];
  const total = data?.total ?? initialTotal;
  const totalPages = data?.totalPages ?? initialTotalPages;

  const resetFilters = () => {
    setSearch("");
    setGenre("all");
    setDecade("all");
    setMaxDuration(240);
    setHasOscars(false);
    setPage(1);
  };

  const hasActiveFilters =
    search || genre !== "all" || decade !== "all" || maxDuration < 240 || hasOscars;

  return (
    <div className="space-y-8">
      {/* Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-black text-foreground tracking-tight">
            Catalogue des Films
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Explorez les œuvres référencées, affinez vos critères et découvrez des chefs-d&apos;œuvre.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Titre, réalisateur, tag..."
              className="pl-9 bg-card border-border/80"
              aria-label="Rechercher un film"
            />
          </div>

          <Button
            variant="outline"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="md:hidden flex items-center gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtres
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-2xl border border-border/80 bg-card/60 transition-all ${
          isFiltersOpen ? "block" : "hidden md:grid"
        }`}
      >
        {/* Genre Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">
            Genre
          </label>
          <Select
            value={genre}
            onChange={(e) => {
              setGenre(e.target.value);
              setPage(1);
            }}
            aria-label="Filtrer par genre"
          >
            <option value="all">Tous les genres</option>
            <option value="Science-Fiction">Science-Fiction</option>
            <option value="Drame">Drame</option>
            <option value="Thriller">Thriller</option>
            <option value="Action">Action</option>
            <option value="Aventure">Aventure</option>
            <option value="Musique">Musique</option>
          </Select>
        </div>

        {/* Decade Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">
            Décennie
          </label>
          <Select
            value={decade}
            onChange={(e) => {
              setDecade(e.target.value);
              setPage(1);
            }}
            aria-label="Filtrer par décennie"
          >
            <option value="all">Toutes les époques</option>
            <option value="2020">Années 2020</option>
            <option value="2010">Années 2010</option>
            <option value="2000">Années 2000</option>
            <option value="1990">Années 1990</option>
          </Select>
        </div>

        {/* Max Duration Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-muted-foreground">
            <span>Durée max</span>
            <span className="text-gold-400 font-bold">{maxDuration} min</span>
          </div>
          <Slider
            min={90}
            max={240}
            step={5}
            value={maxDuration}
            onValueChange={(val) => {
              setMaxDuration(val);
              setPage(1);
            }}
            aria-label="Durée maximale en minutes"
          />
        </div>

        {/* Oscars Checkbox & Reset */}
        <div className="flex items-center justify-between sm:justify-start gap-6 pt-3 sm:pt-4">
          <div className="flex items-center space-x-2.5">
            <Checkbox
              id="filter-oscars"
              checked={hasOscars}
              onCheckedChange={(checked) => {
                setHasOscars(checked);
                setPage(1);
              }}
            />
            <label
              htmlFor="filter-oscars"
              className="text-xs font-medium cursor-pointer text-foreground select-none"
            >
              Oscars uniquement
            </label>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1 font-semibold ml-auto transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/40 pb-2">
        <span>
          {isLoading ? (
            "Actualisation des résultats..."
          ) : (
            <>
              <strong className="text-foreground">{total}</strong> film{total > 1 ? "s" : ""} trouvé{total > 1 ? "s" : ""}
            </>
          )}
        </span>
        {totalPages > 1 && (
          <span>
            Page {page} sur {totalPages}
          </span>
        )}
      </div>

      {/* Grid or Skeletons */}
      {isLoading ? (
        <FilmGridSkeleton count={8} />
      ) : films.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {films.map((film, index) => (
            <FilmCard key={film.id} film={film} priority={index < 5} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-border bg-card/40 my-8">
          <Filter className="h-10 w-10 text-muted-foreground/60 mb-3" />
          <h3 className="font-display text-xl font-bold mb-1 text-foreground">
            Aucun film ne correspond à vos filtres
          </h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            Essayez d&apos;élargir vos critères de durée, de genre ou de recherche textuelle.
          </p>
          <Button variant="outline" onClick={resetFilters} size="sm">
            Réinitialiser les filtres
          </Button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </Button>
          <div className="text-xs font-semibold text-muted-foreground px-2">
            {page} / {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="flex items-center gap-1"
          >
            Suivant
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
