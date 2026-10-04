import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFilmById, getFilmSaga } from "@/lib/api/films";
import { SplitTitle } from "@/components/gsap/SplitTitle";
import { SmokingRoomCanvas } from "@/components/gsap/SmokingRoomCanvas";
import { SagaTimeline } from "@/components/gsap/SagaTimeline";
import { RatingStars } from "@/components/gsap/RatingStars";
import { JournalButton } from "@/components/gsap/JournalButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Clock, Calendar, Award, User, Clapperboard, ChevronLeft, Globe, Film } from "lucide-react";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    const film = await getFilmById(params.id);
    return {
      title: `${film.title} (${film.releaseYear})`,
      description: film.synopsis,
      openGraph: {
        title: `${film.title} (${film.releaseYear}) — FilmBox`,
        description: film.synopsis,
        images: [
          {
            url: film.posterUrl,
            width: 800,
            height: 1200,
            alt: `Affiche du film ${film.title}`,
          },
        ],
      },
    };
  } catch {
    return {
      title: "Film non trouvé | FilmBox",
      description: "La fiche film demandée n'a pu être trouvée.",
    };
  }
}

export default async function FicheFilmPage({
  params,
}: {
  params: { id: string };
}) {
  let film;
  try {
    film = await getFilmById(params.id);
  } catch {
    notFound();
  }

  // Fetch saga conditionally
  let sagaData = null;
  if (film.sagaId) {
    try {
      sagaData = await getFilmSaga(params.id);
    } catch {
      sagaData = null;
    }
  }

  return (
    <div className="relative space-y-12 pb-16">
      {/* Background Ambience: SmokingRoomCanvas */}
      <SmokingRoomCanvas particleCount={40} />

      {/* Back button */}
      <div>
        <Link
          href="/catalogue"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gold-300 transition-colors font-medium"
        >
          <ChevronLeft className="h-4 w-4" />
          Retour au catalogue
        </Link>
      </div>

      {/* Hero Banner Section */}
      <section className="relative rounded-3xl overflow-hidden border border-border/80 bg-card/60 p-6 sm:p-10 shadow-2xl backdrop-blur-sm">
        {film.backdropUrl && (
          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
            <Image
              src={film.backdropUrl}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent" />
          </div>
        )}

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Poster Column */}
          <div className="relative aspect-[2/3] w-full max-w-[320px] mx-auto rounded-2xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.8)] border border-border/80 bg-secondary">
            <Image
              src={film.posterUrl}
              alt={`Affiche de ${film.title}`}
              fill
              priority
              sizes="(max-width: 768px) 320px, 360px"
              className="object-cover"
            />
            {film.hasOscars && (
              <div className="absolute top-3 left-3">
                <Badge variant="gold" className="shadow-lg backdrop-blur-sm flex items-center gap-1">
                  <Award className="h-3.5 w-3.5" />
                  Film Oscarisé
                </Badge>
              </div>
            )}
          </div>

          {/* Details Column */}
          <div className="md:col-span-2 space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {film.genres.map((g) => (
                  <Badge key={g} variant="secondary">
                    {g}
                  </Badge>
                ))}
                {film.saga && (
                  <Badge variant="outline" className="border-gold-500/40 text-gold-400">
                    Saga : {film.saga.name}
                  </Badge>
                )}
              </div>

              {/* Title Reveal via SplitType */}
              <SplitTitle as="h1" className="text-3xl sm:text-5xl font-black text-foreground">
                {film.title}
              </SplitTitle>

              {film.originalTitle && film.originalTitle !== film.title && (
                <div className="text-sm text-muted-foreground italic">
                  Titre original : {film.originalTitle}
                </div>
              )}

              {/* Metadata Badges */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1 text-foreground font-semibold">
                  <User className="h-3.5 w-3.5 text-primary" />
                  {film.director}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {film.releaseYear}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {film.durationFormatted}
                </span>
                <span className="flex items-center gap-1 font-bold text-gold-400 text-sm">
                  <Star className="h-4 w-4 fill-current" />
                  {film.weightedRating.toFixed(1)} / 5
                  <span className="text-muted-foreground text-xs font-normal">
                    ({film.ratingsCount.toLocaleString()} votes)
                  </span>
                </span>
              </div>
            </div>

            {/* Synopsis */}
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gold-400">
                Synopsis
              </h2>
              <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">
                {film.synopsis}
              </p>
            </div>

            {/* Tags */}
            {film.tags && film.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {film.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-1 rounded-md bg-secondary/80 text-muted-foreground border border-border/40"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* User Interaction Controls */}
            <div className="p-4 rounded-xl border border-border/80 bg-secondary/40 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground block">
                    Votre note :
                  </span>
                  <RatingStars
                    filmId={film.id}
                    initialRating={film.userNote || 0}
                  />
                </div>

                <JournalButton
                  filmId={film.id}
                  filmTitle={film.title}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Casting Section */}
      <section className="space-y-6">
        <div>
          <div className="text-xs font-semibold text-gold-400 uppercase tracking-wider mb-1">
            Distribution
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            Casting Principal
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {film.casting.map((actor) => (
            <Card key={actor.actorId} className="border-border/60 bg-card/60">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="relative h-12 w-12 rounded-full overflow-hidden bg-secondary shrink-0 border border-border">
                  {actor.photoUrl ? (
                    <Image
                      src={actor.photoUrl}
                      alt={actor.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    <User className="h-6 w-6 m-auto text-muted-foreground" />
                  )}
                </div>
                <div className="overflow-hidden">
                  <div className="font-display font-bold text-sm text-foreground truncate">
                    {actor.name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {actor.role}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Technical Details */}
      {film.details && (
        <section className="space-y-4">
          <h2 className="font-display text-xl font-bold text-foreground">
            Fiche Technique &amp; Récompenses
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl border border-border/80 bg-card/40">
            {film.details.country && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Globe className="h-3 w-3" /> Pays
                </span>
                <span className="text-sm font-semibold">{film.details.country}</span>
              </div>
            )}
            {film.details.budget && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Budget</span>
                <span className="text-sm font-semibold">{film.details.budget}</span>
              </div>
            )}
            {film.details.boxOffice && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Box-Office</span>
                <span className="text-sm font-semibold text-gold-400">{film.details.boxOffice}</span>
              </div>
            )}
            {film.details.awards && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Award className="h-3 w-3" /> Distinctions
                </span>
                <span className="text-xs font-semibold text-foreground/90">{film.details.awards}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Conditional Horizontal Saga Timeline (Task 1.7) */}
      {sagaData && sagaData.episodes.length > 0 && (
        <SagaTimeline
          sagaName={sagaData.sagaName}
          episodes={sagaData.episodes}
          currentFilmId={film.id}
        />
      )}
    </div>
  );
}
