import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getAllRankings } from "@/lib/api/rankings";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, ThumbsUp, ThumbsDown, User, Film, Clapperboard } from "lucide-react";

import type { RankingGenre, RankingDirector, PolarizingFilm } from "@/types/api";

export const metadata: Metadata = {
  title: "Classements & Palmarès Cinéphiles",
  description:
    "Découvrez les meilleurs films par genre, le classement des plus grands réalisateurs et le baromètre des films les plus clivants.",
};

export const dynamic = "force-dynamic";

export default async function ClassementsPage() {
  let rankings: {
    genres: RankingGenre[];
    directors: RankingDirector[];
    polarizing: PolarizingFilm[];
  } = { genres: [], directors: [], polarizing: [] };
  try {
    rankings = await getAllRankings();
  } catch (err) {
    console.warn("ClassementsPage fetch rankings failed:", err);
  }
  const { genres, directors, polarizing } = rankings;

  return (
    <div className="space-y-10 pb-16">
      {/* Header */}
      <div className="border-b border-border/80 pb-6">
        <div className="inline-flex items-center gap-1.5 text-xs text-gold-400 font-semibold uppercase tracking-wider mb-2">
          <Trophy className="h-3.5 w-3.5" />
          Statistiques &amp; Hiérarchies
        </div>
        <h1 className="font-display text-3xl sm:text-5xl font-black text-foreground tracking-tight">
          Classements &amp; Palmarès
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
          Agrégation pondérée de l&apos;ensemble des notes et critiques de la communauté.
          Calcul actualisé périodiquement pour éviter tout biais de popularité éphémère.
        </p>
      </div>

      {/* Tabs navigation */}
      <Tabs defaultValue="genres">
        <TabsList className="mb-6">
          <TabsTrigger value="genres">Par Genre</TabsTrigger>
          <TabsTrigger value="directors">Top Réalisateurs</TabsTrigger>
          <TabsTrigger value="polarizing">Films Clivants</TabsTrigger>
        </TabsList>

        {/* Tab 1: Genres */}
        <TabsContent value="genres" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {genres.map((g) => (
              <Card key={g.genre} className="border-border/80 bg-card/60 shadow-lg">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <h2 className="font-display font-bold text-xl text-foreground">
                      {g.genre}
                    </h2>
                    <Badge variant="outline" className="text-xs">
                      {g.totalFilmsInGenre} titres
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {g.topFilms.slice(0, 3).map((film, index) => (
                      <Link
                        key={film.id}
                        href={`/films/${film.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors group"
                      >
                        <div className="relative h-16 w-12 rounded overflow-hidden bg-secondary shrink-0 border border-border">
                          <Image
                            src={film.posterUrl}
                            alt={film.title}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-center gap-2">
                            <span className="font-display font-black text-xs text-gold-400 w-4">
                              #{index + 1}
                            </span>
                            <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                              {film.title}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {film.director} • {film.releaseYear}
                          </div>
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
        </TabsContent>

        {/* Tab 2: Directors */}
        <TabsContent value="directors" className="space-y-6">
          <div className="rounded-2xl border border-border/80 bg-card/60 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-secondary/70 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="py-4 px-6">Rang</th>
                    <th className="py-4 px-6">Réalisateur</th>
                    <th className="py-4 px-6">Note Moyenne</th>
                    <th className="py-4 px-6">Films Répertoriés</th>
                    <th className="py-4 px-6">Chefs-d&apos;œuvre Clés</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {directors.map((dir, rank) => (
                    <tr key={dir.directorId} className="hover:bg-secondary/30 transition-colors">
                      <td className="py-4 px-6 font-display font-black text-base text-gold-400">
                        #{rank + 1}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 rounded-full overflow-hidden bg-secondary shrink-0 border border-primary/30">
                            {dir.photoUrl ? (
                              <Image
                                src={dir.photoUrl}
                                alt={dir.name}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            ) : (
                              <User className="h-5 w-5 m-auto text-muted-foreground" />
                            )}
                          </div>
                          <span className="font-display font-bold text-foreground">
                            {dir.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="flex items-center gap-1 font-bold text-gold-400">
                          <Star className="h-4 w-4 fill-current" />
                          {dir.averageRating.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">
                        {dir.filmCount} films
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1.5">
                          {dir.topFilms.map((tf) => (
                            <Link
                              key={tf.id}
                              href={`/films/${tf.id}`}
                              className="text-xs px-2 py-0.5 rounded bg-secondary/80 hover:bg-primary/20 hover:text-primary transition-colors text-muted-foreground"
                            >
                              {tf.title}
                            </Link>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: Polarizing Films */}
        <TabsContent value="polarizing" className="space-y-6">
          <p className="text-xs text-muted-foreground max-w-xl">
            Ces films divisent profondément notre communauté. Un fort écart-type indique un conflit direct entre critiques dithyrambiques et rejets épidermiques.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {polarizing.map((item) => (
              <Card
                key={item.film.id}
                className="border-border/80 bg-card/60 hover:border-gold-500/40 transition-colors shadow-lg"
              >
                <CardContent className="p-5 flex flex-col sm:flex-row gap-5">
                  <div className="relative h-36 w-24 rounded-lg overflow-hidden bg-secondary shrink-0 border border-border">
                    <Image
                      src={item.film.posterUrl}
                      alt={item.film.title}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/films/${item.film.id}`}
                          className="font-display font-bold text-lg text-foreground hover:text-primary transition-colors line-clamp-1"
                        >
                          {item.film.title}
                        </Link>
                        <Badge variant="velvet" className="text-[10px]">
                          Clivant : {item.divergenceScore}/100
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.film.director} • {item.film.releaseYear}
                      </div>
                    </div>

                    {/* Split Bar Visualization */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="flex items-center gap-1 text-gold-400">
                          <ThumbsUp className="h-3 w-3" />
                          {item.positivePercentage}% Adorent
                        </span>
                        <span className="flex items-center gap-1 text-rose-400">
                          <ThumbsDown className="h-3 w-3" />
                          {item.negativePercentage}% Rejettent
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-secondary overflow-hidden flex">
                        <div
                          className="bg-gold-500 h-full"
                          style={{ width: `${item.positivePercentage}%` }}
                        />
                        <div
                          className="bg-velvet h-full"
                          style={{ width: `${item.negativePercentage}%` }}
                        />
                      </div>
                      <div className="text-[11px] text-muted-foreground text-right">
                        Écart-type σ = {item.standardDeviation}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
