"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { Film, Sparkles, Star, Clapperboard } from "lucide-react";

export default function StyleGuidePage() {
  const { toast } = useToast();
  const [sliderValue, setSliderValue] = React.useState(120);
  const [checked, setChecked] = React.useState(true);

  return (
    <div className="space-y-12 max-w-5xl mx-auto py-6">
      {/* Title */}
      <div className="border-b border-border/80 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 text-gold-400 text-xs font-semibold uppercase tracking-wider mb-3 border border-gold-500/30">
          <Clapperboard className="h-3.5 w-3.5" />
          Charte Graphique FilmBox
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-black text-foreground tracking-wide">
          Thème &quot;Salle Obscure&quot;
        </h1>
        <p className="mt-3 text-lg text-muted-foreground leading-relaxed">
          Validation visuelle des tokens de couleur, typographie cinématographique et composants de base shadcn/ui.
        </p>
      </div>

      {/* Palette Section */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-foreground">
          Palette Chromatique
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-border bg-card space-y-2">
            <div className="h-14 rounded-lg bg-background border border-border" />
            <div className="text-sm font-semibold">Noir Profond</div>
            <div className="text-xs text-muted-foreground">#070709 / background</div>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card space-y-2">
            <div className="h-14 rounded-lg bg-card border border-border" />
            <div className="text-sm font-semibold">Gris Anthracite</div>
            <div className="text-xs text-muted-foreground">#101015 / card</div>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card space-y-2">
            <div className="h-14 rounded-lg bg-gold-500" />
            <div className="text-sm font-semibold text-gold-400">Or Projecteur</div>
            <div className="text-xs text-muted-foreground">#e5a93c / primary</div>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card space-y-2">
            <div className="h-14 rounded-lg bg-velvet" />
            <div className="text-sm font-semibold text-rose-400">Rouge Velours</div>
            <div className="text-xs text-muted-foreground">#8b182b / accent</div>
          </div>
        </div>
      </section>

      {/* Buttons Section */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-foreground">
          Boutons &amp; Variantes
        </h2>
        <div className="flex flex-wrap items-center gap-3 p-6 rounded-xl border border-border bg-card/60">
          <Button variant="default">Primary Gold</Button>
          <Button variant="velvet">Velours Cinéma</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="gold" size="lg" className="flex items-center gap-2">
            <Star className="h-4 w-4 fill-current" />
            Large Gold
          </Button>
          <Button size="sm">Small</Button>
        </div>
      </section>

      {/* Badges Section */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-foreground">
          Badges &amp; Tags
        </h2>
        <div className="flex flex-wrap gap-2 p-6 rounded-xl border border-border bg-card/60">
          <Badge variant="default">Standard</Badge>
          <Badge variant="gold">Oscar du Meilleur Film</Badge>
          <Badge variant="velvet">Coup de Cœur</Badge>
          <Badge variant="secondary">Science-Fiction</Badge>
          <Badge variant="outline">148 min</Badge>
        </div>
      </section>

      {/* Cards Section */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-foreground">
          Cartes &amp; Hiérarchie
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:border-gold-500/50 transition-colors">
            <CardHeader>
              <div className="flex justify-between items-center">
                <Badge variant="gold">Chef-d&apos;œuvre</Badge>
                <span className="text-xs text-muted-foreground">2010 • 148 min</span>
              </div>
              <CardTitle className="mt-2">Inception</CardTitle>
              <CardDescription>Réalisé par Christopher Nolan</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/80 leading-relaxed">
                Dom Cobb est un voleur expérimenté, le meilleur qui soit dans l&apos;art périlleux de l&apos;extraction : voler les secrets les plus précieux enfouis au plus profond du subconscient.
              </p>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
              <span className="font-display font-bold text-gold-400">★ 4.8 / 5</span>
              <Button size="sm" variant="outline">Détails</Button>
            </CardFooter>
          </Card>

          <Card className="border-velvet/40 bg-card/70">
            <CardHeader>
              <Badge variant="velvet" className="w-fit">Activité Communauté</Badge>
              <CardTitle className="mt-2">Dernier Visionnage</CardTitle>
              <CardDescription>Alice vient de noter un film</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-velvet/20 border border-velvet/40 flex items-center justify-center font-bold text-rose-300">
                  A
                </div>
                <div>
                  <div className="font-medium text-sm">Oppenheimer (2023)</div>
                  <div className="text-xs text-muted-foreground">&quot;Une claque sonore et visuelle magistrale.&quot;</div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button size="sm" variant="velvet" className="w-full">
                Voir l&apos;avis complet
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* Tabs & Dialogs Section */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-foreground">
          Onglets &amp; Modales
        </h2>
        <div className="p-6 rounded-xl border border-border bg-card/60 space-y-6">
          <Tabs defaultValue="genres">
            <TabsList>
              <TabsTrigger value="genres">Par Genre</TabsTrigger>
              <TabsTrigger value="directors">Par Réalisateur</TabsTrigger>
              <TabsTrigger value="polarizing">Films Clivants</TabsTrigger>
            </TabsList>
            <TabsContent value="genres" className="p-4 rounded-lg bg-secondary/30">
              <p className="text-sm text-foreground">
                Affichage des classements filtrés par genres populaires (Science-Fiction, Drame, Thriller).
              </p>
            </TabsContent>
            <TabsContent value="directors" className="p-4 rounded-lg bg-secondary/30">
              <p className="text-sm text-foreground">
                Palmarès des réalisateurs les mieux notés par la communauté.
              </p>
            </TabsContent>
            <TabsContent value="polarizing" className="p-4 rounded-lg bg-secondary/30">
              <p className="text-sm text-foreground">
                Les œuvres qui divisent le plus : ratio amours/rejets.
              </p>
            </TabsContent>
          </Tabs>

          <div className="pt-4 border-t border-border flex items-center gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="default">Ouvrir la modale Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter un film au journal</DialogTitle>
                  <DialogDescription>
                    Enregistrez votre visionnage et partagez votre avis avec la communauté.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Film</label>
                    <Input defaultValue="Interstellar (2014)" readOnly />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Votre avis</label>
                    <Input placeholder="Notez quelques lignes sur vos impressions..." />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="gold">Confirmer le visionnage</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Toasts trigger */}
            <Button
              variant="outline"
              onClick={() =>
                toast({
                  variant: "gold",
                  title: "Notification Salle Obscure",
                  description: "Film ajouté avec succès à votre journal de visionnage !",
                })
              }
            >
              Déclencher un Toast Gold
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                toast({
                  variant: "destructive",
                  title: "Action impossible",
                  description: "Veuillez vous authentifier pour noter ce film.",
                })
              }
            >
              Déclencher un Toast Erreur
            </Button>
          </div>
        </div>
      </section>

      {/* Skeletons Section */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-foreground">
          États de Chargement (Skeletons)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 rounded-xl border border-border bg-card/60">
          <div className="space-y-3">
            <Skeleton className="h-36 w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-36 w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-36 w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </section>

      {/* Inputs & Controls */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-foreground">
          Contrôles de Filtrage
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-xl border border-border bg-card/60">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Sélection du genre</label>
            <Select defaultValue="scifi">
              <option value="all">Tous les genres</option>
              <option value="scifi">Science-Fiction</option>
              <option value="drama">Drame</option>
              <option value="thriller">Thriller</option>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-muted-foreground">
              <span>Durée max :</span>
              <span className="text-gold-400 font-bold">{sliderValue} min</span>
            </div>
            <Slider
              min={60}
              max={240}
              step={5}
              value={sliderValue}
              onValueChange={setSliderValue}
            />
          </div>

          <div className="flex items-center space-x-3 pt-6">
            <Checkbox
              id="oscars"
              checked={checked}
              onCheckedChange={setChecked}
            />
            <label htmlFor="oscars" className="text-sm font-medium cursor-pointer">
              Films oscarisés uniquement
            </label>
          </div>
        </div>
      </section>
    </div>
  );
}
