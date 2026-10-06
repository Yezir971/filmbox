"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Loader2, Star, X, Film, Calendar, Clapperboard } from "lucide-react";
import type { Film as FilmType } from "@/types/api";

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<FilmType[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Debounced search via the SQL function rechercher_films
  React.useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const handler = setTimeout(async () => {
      try {
        const res = await fetch(`/api/films/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.films || []);
          setIsOpen(true);
        }
      } catch (err) {
        console.error("Global search error:", err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(handler);
  }, [query]);

  // Click outside listener to close dropdown
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K to focus search
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelectFilm = (filmId: number | string) => {
    setIsOpen(false);
    setQuery("");
    router.push(`/films/${filmId}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      router.push(`/catalogue?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xs sm:max-w-sm">
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.trim().length > 0) setIsOpen(true);
          }}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder="Rechercher... (Ctrl+K)"
          className="w-full h-9 pl-9 pr-14 rounded-full border border-border/70 bg-secondary/40 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold-500/50 focus:border-gold-500/50 transition-all shadow-inner"
        />

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isLoading && <Loader2 className="h-3.5 w-3.5 text-gold-400 animate-spin" />}
          {query && !isLoading && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResults([]);
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded"
              aria-label="Effacer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {!query && (
            <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-background/50 border border-border/80 rounded">
              ⌘K
            </kbd>
          )}
        </div>
      </form>

      {/* Dropdown Results */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl border border-border/80 bg-background/95 backdrop-blur-md shadow-2xl overflow-hidden animate-in fade-in-50 slide-in-from-top-2 duration-150">
          <div className="p-2 border-b border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="font-semibold uppercase tracking-wider text-gold-400">
              Résultats instantanés ({results.length})
            </span>
            <span className="text-[10px]">rechercher_films SQL</span>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-border/30">
            {results.length > 0 ? (
              results.map((film) => (
                <div
                  key={film.id}
                  onClick={() => handleSelectFilm(film.id)}
                  className="flex items-center gap-3 p-2.5 hover:bg-secondary/60 cursor-pointer transition-colors group"
                >
                  <div className="h-10 w-8 rounded bg-secondary/80 flex items-center justify-center shrink-0 border border-border/50 text-gold-400 group-hover:border-gold-400/40 overflow-hidden">
                    {film.posterUrl ? (
                      <img
                        src={film.posterUrl}
                        alt={film.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Film className="h-4 w-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground truncate group-hover:text-gold-300 transition-colors">
                        {film.title}
                      </span>
                      {film.releaseYear && (
                        <span className="text-xs text-muted-foreground font-mono shrink-0">
                          ({film.releaseYear})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                      {film.genres && film.genres.length > 0 && <span>{film.genres[0]}</span>}
                      {film.director && (
                        <>
                          <span>•</span>
                          <span className="truncate">{film.director}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {film.weightedRating !== undefined && film.weightedRating !== null && film.weightedRating > 0 && (
                    <div className="flex items-center gap-1 text-xs font-semibold text-gold-400 shrink-0 bg-gold-500/10 px-2 py-0.5 rounded-full border border-gold-500/20">
                      <Star className="h-3 w-3 fill-gold-400 text-gold-400" />
                      <span>{Number(film.weightedRating).toFixed(1)}</span>
                    </div>
                  )}
                </div>
              ))
            ) : !isLoading ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                Aucun film trouvé pour &ldquo;{query}&rdquo;
              </div>
            ) : null}
          </div>

          <div className="p-2 border-t border-border/40 bg-secondary/20">
            <Link
              href={`/catalogue?search=${encodeURIComponent(query.trim())}`}
              onClick={() => setIsOpen(false)}
              className="block w-full text-center text-xs text-gold-400 hover:text-gold-300 font-medium py-1 transition-colors"
            >
              Rechercher &ldquo;{query}&rdquo; dans tout le catalogue →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
