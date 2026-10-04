"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "@/lib/auth/useSession";
import { addFilmToList } from "@/lib/api/lists";
import { getFilms } from "@/lib/api/films";
import useSWR from "swr";
import type { Film } from "@/types/api";

export function AddFilmToList({ listId }: { listId: string }) {
  const router = useRouter();
  const { isAuthenticated } = useSession();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const { data: filmsData } = useSWR<{ films: Film[] }>("/api/films?limit=50", () =>
    getFilms({ limit: 50 })
  );
  const films = filmsData?.films || [];
  const [selectedFilmId, setSelectedFilmId] = React.useState<string>("");

  React.useEffect(() => {
    if (films.length > 0 && !selectedFilmId) {
      setSelectedFilmId(films[0].id);
    }
  }, [films, selectedFilmId]);

  const [comment, setComment] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  if (!isAuthenticated) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addFilmToList(listId, {
        filmId: selectedFilmId,
        comment: comment.trim() || undefined,
      });

      toast({
        variant: "gold",
        title: "Film ajouté !",
        description: "Le film a bien été inséré dans votre collection.",
      });

      setOpen(false);
      setComment("");
      router.refresh();
    } catch {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'ajouter le film à la liste.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1.5">
          <Plus className="h-4 w-4" />
          Ajouter un film
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un film à la sélection</DialogTitle>
          <DialogDescription>
            Choisissez une œuvre et ajoutez un commentaire personnel sur son inclusion.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              Film à ajouter
            </label>
            <Select
              value={selectedFilmId}
              onChange={(e) => setSelectedFilmId(e.target.value)}
              aria-label="Sélectionner un film"
            >
              {films.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.title} ({f.releaseYear}) — {f.director}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              Note d&apos;intention / Commentaire (optionnel)
            </label>
            <Input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ex: Une scène finale inoubliable..."
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading} variant="gold">
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirmer l&apos;ajout
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
