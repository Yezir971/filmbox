import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getPublicLists } from "@/lib/api/lists";
import type { Liste } from "@/types/api";
import { CreateListDialog } from "@/components/lists/CreateListDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Film, User, Bookmark, Calendar } from "lucide-react";

export const metadata: Metadata = {
  title: "Listes & Collections Cinématographiques",
  description:
    "Explorez les sélections thématiques créées par notre communauté de cinéphiles. Sagas, pépites cachées, et palmarès personnels.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ListesPage() {
  let lists: Liste[] = [];
  try {
    lists = await getPublicLists();
  } catch {
    lists = [];
  }

  return (
    <div className="space-y-10 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-gold-400 font-semibold uppercase tracking-wider mb-1">
            <Bookmark className="h-3.5 w-3.5" />
            Sélections Communautaires
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-black text-foreground">
            Listes &amp; Collections
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Découvrez des parcours de visionnage uniques concoctés par les membres.
          </p>
        </div>

        <CreateListDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lists.map((list) => (
          <Link
            key={list.id}
            href={`/listes/${list.id}`}
            className="group block"
          >
            <Card className="h-full border-border/80 bg-card/60 hover:border-gold-500/50 hover:bg-card transition-all duration-300 shadow-lg flex flex-col justify-between">
              <CardContent className="p-6 space-y-4">
                {/* Visual poster stack */}
                <div className="flex -space-x-4 overflow-hidden py-1">
                  {list.coverPosters && list.coverPosters.length > 0 ? (
                    list.coverPosters.slice(0, 3).map((poster, i) => (
                      <div
                        key={i}
                        className="relative h-32 w-24 rounded-lg overflow-hidden border-2 border-card bg-secondary shadow-md shrink-0 group-hover:translate-y-[-2px] transition-transform duration-300"
                      >
                        <Image
                          src={poster}
                          alt=""
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      </div>
                    ))
                  ) : (
                    <div className="h-32 w-full rounded-lg bg-secondary/50 flex items-center justify-center border border-border">
                      <Film className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {list.title}
                    </h2>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {list.filmCount} film{list.filmCount > 1 ? "s" : ""}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {list.description || "Aucune description fournie pour cette collection."}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/40 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <UserAvatar
                      size="sm"
                      pseudo={list.authorPseudo}
                      avatarUrl={list.authorAvatarUrl}
                      className="h-5 w-5"
                    />
                    <span className="font-medium text-foreground">
                      {list.authorPseudo}
                    </span>
                  </div>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(list.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
