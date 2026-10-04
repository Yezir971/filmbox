import Link from "next/link";
import Image from "next/image";
import { Film, Compass, Trophy, Star, ArrowRight, Sparkles, Clock, MessageSquare } from "lucide-react";
import { getFilms } from "@/lib/api/films";
import { getRankingsByGenre } from "@/lib/api/rankings";
import { apiClient } from "@/lib/api/client";
import type { DashboardStats, RankingGenre } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FilmCard } from "@/components/films/FilmCard";
import { HomeHeroEntrance } from "@/components/home/HomeHeroEntrance";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let stats: DashboardStats = {
    trendingFilms: [],
    recentCommunityJournal: [],
    topRankingsPreview: [],
    totalCommunityLogsToday: 0,
  };
  try {
    stats = await apiClient<DashboardStats>("/api/stats");
  } catch (err) {
    console.warn("HomePage fetch stats failed:", err);
  }

  let topGenres: RankingGenre[] = [];
  try {
    topGenres = await getRankingsByGenre();
  } catch {
    topGenres = [];
  }

  const heroFilm = stats.trendingFilms[0] || null;

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <HomeHeroEntrance>
        <section className="relative rounded-3xl overflow-hidden border border-border/80 bg-gradient-to-b from-card to-background p-6 sm:p-12 shadow-2xl">
          <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
            <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/15 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="hero-animate inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 text-gold-400 text-xs font-semibold uppercase tracking-wider border border-gold-500/30">
              <Sparkles className="h-3.5 w-3.5" />
              L&apos;Expérience Salle Obscure
            </div>

            <h1 className="font-display text-4xl sm:text-6xl font-black text-foreground tracking-tight leading-tight">
              Pour ceux qui vivent le cinéma comme un art.
            </h1>

            <p className="hero-animate text-base sm:text-lg text-muted-foreground leading-relaxed">
              Consignez vos séances, évaluez avec précision, explorez les sagas culte et découvrez votre affinité cinématographique grâce à nos algorithmes cinéphiles.
            </p>

            <div className="hero-animate flex flex-wrap items-center gap-4 pt-2">
              <Link href="/catalogue">
                <Button variant="gold" size="lg" className="flex items-center gap-2">
                  <Film className="h-4 w-4" />
                  Explorer le Catalogue
                </Button>
              </Link>
              <Link href="/decouverte">
                <Button variant="velvet" size="lg" className="flex items-center gap-2">
                  <Compass className="h-4 w-4" />
                  Découverte Swipe
                </Button>
              </Link>
              <Link href="/classements">
                <Button variant="outline" size="lg" className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Classements
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </HomeHeroEntrance>

      {/* Tendances de la semaine */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gold-400 uppercase tracking-wider mb-1">
              À l&apos;Affiche
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              Tendances de la Communauté
            </h2>
          </div>
          <Link
            href="/catalogue"
            className="flex items-center gap-1.5 text-sm text-gold-400 hover:text-gold-300 transition-colors font-medium"
          >
            Tout voir
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
          {stats.trendingFilms.map((film) => (
            <FilmCard key={film.id} film={film} />
          ))}
        </div>
      </section>

      {/* Activité Récente de la Communauté */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gold-400 uppercase tracking-wider mb-1">
              En Direct
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              Derniers Visionnages Partagés
            </h2>
          </div>
          <Badge variant="outline" className="text-xs text-muted-foreground">
            {stats.totalCommunityLogsToday} séances aujourd&apos;hui
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.recentCommunityJournal.map((entry) => (
            <Card
              key={entry.id}
              className="border-border/80 bg-card/70 hover:border-gold-500/40 transition-colors"
            >
              <CardContent className="p-4 flex gap-4">
                <div className="relative h-28 w-20 rounded-lg overflow-hidden bg-secondary shrink-0">
                  <Image
                    src={entry.posterUrl}
                    alt={entry.filmTitle}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col justify-between flex-1 overflow-hidden">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/films/${entry.filmId}`}
                        className="font-display font-bold text-sm text-foreground hover:text-primary transition-colors truncate"
                      >
                        {entry.filmTitle}
                      </Link>
                      {entry.note && (
                        <span className="flex items-center gap-0.5 text-xs font-semibold text-gold-400 shrink-0">
                          <Star className="h-3 w-3 fill-current" />
                          {entry.note}
                        </span>
                      )}
                    </div>
                    {entry.comment && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2 italic leading-relaxed">
                        &quot;{entry.comment}&quot;
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Récemment
                    </span>
                    {entry.rewatch && (
                      <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                        Revu
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Mini-Aperçu Classements */}
      {topGenres.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-gold-400 uppercase tracking-wider mb-1">
                Palmarès
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                Incontournables par Genre
              </h2>
            </div>
            <Link
              href="/classements"
              className="flex items-center gap-1.5 text-sm text-gold-400 hover:text-gold-300 transition-colors font-medium"
            >
              Tous les classements
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topGenres.slice(0, 3).map((g) => (
              <Card key={g.genre} className="border-border/80 bg-card/60">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <h3 className="font-display font-bold text-lg text-foreground">
                      {g.genre}
                    </h3>
                    <Badge variant="gold" className="text-xs">
                      Top 3
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {g.topFilms.slice(0, 3).map((film, rank) => (
                      <Link
                        key={film.id}
                        href={`/films/${film.id}`}
                        className="flex items-center justify-between group text-sm hover:text-primary transition-colors"
                      >
                        <div className="flex items-center gap-3 truncate">
                          <span className="font-display font-bold text-xs text-muted-foreground group-hover:text-primary w-4">
                            #{rank + 1}
                          </span>
                          <span className="truncate text-foreground group-hover:text-primary">
                            {film.title}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-gold-400 shrink-0">
                          ★ {film.weightedRating.toFixed(1)}
                        </span>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
