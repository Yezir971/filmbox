import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getListById } from "@/lib/api/lists";
import { AddFilmToList } from "@/components/lists/AddFilmToList";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Star, ChevronLeft, Calendar, User, Film, Clock } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    const list = await getListById(params.id);
    return {
      title: `${list.title} — Collection`,
      description: list.description,
    };
  } catch {
    return {
      title: "Liste introuvable | FilmBox",
    };
  }
}

export default async function ListeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  let list;
  try {
    list = await getListById(params.id);
  } catch {
    notFound();
  }

  // Strict sorting by position
  const sortedItems = [...list.items].sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      <div>
        <Link
          href="/listes"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gold-300 transition-colors font-medium mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Toutes les collections
        </Link>
      </div>

      {/* List Header */}
      <div className="rounded-2xl border border-border/80 bg-card/60 p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <Badge variant="gold" className="text-xs">
              {list.isPublic ? "Collection Publique" : "Collection Privée"}
            </Badge>
            <h1 className="font-display text-3xl sm:text-4xl font-black text-foreground pt-1">
              {list.title}
            </h1>
          </div>
          <AddFilmToList listId={list.id} />
        </div>

        {list.description && (
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {list.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border/40">
          <span className="flex items-center gap-1.5 font-medium text-foreground">
            <UserAvatar size="sm" pseudo={list.authorPseudo} avatarUrl={list.authorAvatarUrl} className="h-4 w-4" />
            Par {list.authorPseudo}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            Créée le {new Date(list.createdAt).toLocaleDateString("fr-FR")}
          </span>
          <span className="flex items-center gap-1">
            <Film className="h-3.5 w-3.5" />
            {sortedItems.length} œuvre{sortedItems.length > 1 ? "s" : ""} sélectionnée{sortedItems.length > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Ordered Films List */}
      <div className="space-y-4">
        {sortedItems.map((item) => (
          <Card
            key={item.position}
            className="border-border/80 bg-card/70 hover:border-gold-500/40 transition-colors shadow-md"
          >
            <CardContent className="p-4 sm:p-6 flex items-start gap-4 sm:gap-6">
              {/* Position Number */}
              <div className="font-display font-black text-2xl sm:text-4xl text-gold-400/80 w-8 sm:w-12 shrink-0 text-center pt-2">
                #{item.position}
              </div>

              {/* Poster */}
              <div className="relative h-28 sm:h-36 w-20 sm:w-24 rounded-lg overflow-hidden bg-secondary shrink-0 border border-border shadow">
                <Image
                  src={item.film.posterUrl}
                  alt={item.film.title}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>

              {/* Content */}
              <div className="flex-1 space-y-2 overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <Link
                    href={`/films/${item.film.id}`}
                    className="font-display font-bold text-lg sm:text-xl text-foreground hover:text-primary transition-colors line-clamp-1"
                  >
                    {item.film.title}
                  </Link>
                  <span className="flex items-center gap-1 text-xs font-semibold text-gold-400 shrink-0">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    {item.film.weightedRating.toFixed(1)} / 5
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>{item.film.director}</span>
                  <span>•</span>
                  <span>{item.film.releaseYear}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {item.film.durationFormatted}
                  </span>
                </div>

                {item.comment && (
                  <p className="text-xs sm:text-sm text-foreground/80 italic bg-secondary/30 p-2.5 rounded-lg border border-border/40 mt-2">
                    &quot;{item.comment}&quot;
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
