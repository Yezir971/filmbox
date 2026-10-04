"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { createList } from "@/lib/api/lists";

export function CreateListDialog() {
  const router = useRouter();
  const { isAuthenticated, user } = useSession();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isPublic, setIsPublic] = React.useState(true);
  const [loading, setLoading] = React.useState(false);

  if (!isAuthenticated) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const newList = await createList({
        title,
        description,
        isPublic,
        authorPseudo: user?.pseudo || "cinephile_92",
      });

      toast({
        variant: "gold",
        title: "Liste créée !",
        description: `Votre liste "${title}" est prête à être enrichie.`,
      });

      setOpen(false);
      setTitle("");
      setDescription("");
      router.refresh();
      router.push(`/listes/${newList.id}`);
    } catch {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de créer la liste. Veuillez réessayer.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gold" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Créer une Collection
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle Collection de Films</DialogTitle>
          <DialogDescription>
            Créez une liste thématique ou personnalisée à partager avec les cinéphiles.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              Titre de la collection
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Les Meilleurs Dystopies des Années 2010"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              Description
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Expliquez la thématique de votre sélection..."
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="is-public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
            <label
              htmlFor="is-public"
              className="text-xs font-medium cursor-pointer text-foreground select-none"
            >
              Rendre cette liste publique pour la communauté
            </label>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading} variant="gold">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Créer la liste
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
