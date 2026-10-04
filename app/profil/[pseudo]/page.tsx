import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getUserProfile, getUserJournal } from "@/lib/api/users";
import { CompatibilityWidget } from "@/components/profile/CompatibilityWidget";
import { BaconPathViewer } from "@/components/gsap/BaconPathViewer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Film, Star, Clock, Calendar, Heart, Award, Eye, Hourglass } from "lucide-react";

export const revalidate = 0; // Fresh user data

export async function generateMetadata({
  params,
}: {
  params: { pseudo: string };
}): Promise<Metadata> {
  return {
    title: `Profil de ${params.pseudo}`,
    description: `Découvrez les statistiques cinématographiques, le film coup de cœur et le journal de visionnage de ${params.pseudo}.`,
  };
}

export default async function ProfilPage({
  params,
}: {
  params: { pseudo: string };
}) {
  let profile;
  let journal = [];
  try {
    profile = await getUserProfile(params.pseudo);
    journal = await getUserJournal(params.pseudo);
  } catch {
    notFound();
  }

  // Calculate days elapsed between consecutive viewings (front-end calculation)
  const journalWithDiff = journal.map((entry, index) => {
    let daysSincePrevious: number | null = null;
    if (index > 0 && journal[index - 1]) {
      const prevDate = new Date(journal[index - 1].watchedAt).getTime();
      const currDate = new Date(entry.watchedAt).getTime();
      const diffMs = Math.abs(prevDate - currDate);
      daysSincePrevious = Math.round(diffMs / (1000 * 60 * 60 * 24));
    }
    return {
      ...entry,
      daysSincePrevious,
    };
  });

  return (
    <div className="space-y-12 pb-16">
      {/* Profile Header */}
      <section className="relative rounded-3xl overflow-hidden border border-border/80 bg-gradient-to-b from-card to-background p-6 sm:p-10 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative h-28 w-28 rounded-full overflow-hidden border-2 border-primary/50 shadow-xl shrink-0 bg-secondary">
            <Image
              src={profile.avatarUrl}
              alt={`Avatar de ${profile.pseudo}`}
              fill
              priority
              sizes="112px"
              className="object-cover"
            />
          </div>

          <div className="space-y-3 text-center sm:text-left flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="font-display text-3xl sm:text-4xl font-black text-foreground">
                {profile.pseudo}
              </h1>
              <Badge variant="gold" className="w-fit mx-auto sm:mx-0">
                Membre Cinéphile
              </Badge>
            </div>

            {profile.bio && (
              <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
                {profile.bio}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-muted-foreground pt-1">
              <span className="flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5 text-rose-400" />
                Genre fétiche :{" "}
                <strong className="text-foreground">{profile.favoriteGenre}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-border/60">
          <div className="p-4 rounded-xl bg-secondary/40 border border-border/40 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-muted-foreground mb-1">
              <Film className="h-3.5 w-3.5 text-primary" />
              Films Vus
            </div>
            <div className="font-display text-2xl font-bold text-foreground">
              {profile.stats.totalFilmsWatched}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-secondary/40 border border-border/40 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-muted-foreground mb-1">
              <Clock className="h-3.5 w-3.5 text-primary" />
              Heures de Séance
            </div>
            <div className="font-display text-2xl font-bold text-foreground">
              {profile.stats.totalHoursWatched}h
            </div>
          </div>

          <div className="p-4 rounded-xl bg-secondary/40 border border-border/40 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-muted-foreground mb-1">
              <Star className="h-3.5 w-3.5 text-gold-400" />
              Note Moyenne
            </div>
            <div className="font-display text-2xl font-bold text-gold-400">
              {profile.stats.averageRatingGiven.toFixed(1)} / 5
            </div>
          </div>

          <div className="p-4 rounded-xl bg-secondary/40 border border-border/40 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-muted-foreground mb-1">
              <Award className="h-3.5 w-3.5 text-primary" />
              Critiques Publiées
            </div>
            <div className="font-display text-2xl font-bold text-foreground">
              {profile.stats.totalReviews}
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid: Journal & Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Journal Historique */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-gold-400 uppercase tracking-wider mb-1">
                Historique
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                Journal de Visionnage
              </h2>
            </div>
            <Badge variant="outline">{journal.length} entrées</Badge>
          </div>

          <div className="space-y-4">
            {journalWithDiff.map((entry) => (
              <Card
                key={entry.id}
                className="border-border/80 bg-card/60 hover:border-gold-500/40 transition-colors"
              >
                <CardContent className="p-5 flex flex-col sm:flex-row gap-5 items-start">
                  <div className="relative h-32 w-24 rounded-lg overflow-hidden bg-secondary shrink-0 border border-border">
                    <Image
                      src={entry.posterUrl}
                      alt={entry.filmTitle}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <Link
                        href={`/films/${entry.filmId}`}
                        className="font-display font-bold text-lg text-foreground hover:text-primary transition-colors"
                      >
                        {entry.filmTitle}
                      </Link>
                      {entry.note && (
                        <div className="flex items-center gap-1 font-semibold text-gold-400 text-sm">
                          <Star className="h-4 w-4 fill-current" />
                          {entry.note} / 5
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Vu le {new Date(entry.watchedAt).toLocaleDateString("fr-FR")}
                      </span>
                      {entry.daysSincePrevious !== null && (
                        <span className="flex items-center gap-1 text-gold-300 bg-gold-950/40 px-2 py-0.5 rounded border border-gold-500/30">
                          <Hourglass className="h-3 w-3" />
                          {entry.daysSincePrevious === 0
                            ? "Même jour"
                            : `${entry.daysSincePrevious} jour${entry.daysSincePrevious > 1 ? "s" : ""} après la séance précédente`}
                        </span>
                      )}
                      {entry.rewatch && (
                        <Badge variant="secondary" className="text-[10px]">
                          Revisionnage
                        </Badge>
                      )}
                    </div>

                    {entry.comment && (
                      <p className="text-xs sm:text-sm text-foreground/80 italic leading-relaxed pt-1 border-t border-border/40">
                        &quot;{entry.comment}&quot;
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Column: Widgets */}
        <div className="space-y-6">
          {/* Favorite Film Card */}
          {profile.favoriteFilm && (
            <Card className="border-gold-500/40 bg-card/80 shadow-lg">
              <CardContent className="p-5 space-y-3">
                <div className="text-xs font-semibold text-gold-400 uppercase tracking-wider">
                  Coup de Cœur Absolu
                </div>
                <Link
                  href={`/films/${profile.favoriteFilm.id}`}
                  className="group block relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-secondary border border-border"
                >
                  <Image
                    src={profile.favoriteFilm.posterUrl}
                    alt={profile.favoriteFilm.title}
                    fill
                    sizes="340px"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-4">
                    <div>
                      <h3 className="font-display font-bold text-base text-white group-hover:text-primary transition-colors">
                        {profile.favoriteFilm.title}
                      </h3>
                      <span className="text-xs text-white/80">
                        {profile.favoriteFilm.releaseYear}
                      </span>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Compatibility Widget */}
          <CompatibilityWidget currentPseudo={profile.pseudo} />
        </div>
      </div>

      {/* Bacon Path Graph Feature Section */}
      <section className="pt-8 border-t border-border/80">
        <BaconPathViewer />
      </section>
    </div>
  );
}
