import Link from "next/link";
import { Film, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-border/60 bg-card/40 mt-20">
      <div className="container px-4 sm:px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="flex items-center gap-2 font-display text-xl font-bold tracking-wider text-gold-400">
            <Film className="h-5 w-5 text-gold-400" />
            <span>FILMBOX</span>
          </div>
          <p className="text-xs text-muted-foreground text-center md:text-left max-w-sm">
            L&apos;expérience cinéphile par excellence. Journal de visionnage, découverte intelligente et analyses de casting.
          </p>
        </div>

        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/catalogue" className="hover:text-gold-400 transition-colors">
            Catalogue
          </Link>
          <Link href="/decouverte" className="hover:text-gold-400 transition-colors">
            Découverte
          </Link>
          <Link href="/classements" className="hover:text-gold-400 transition-colors">
            Classements
          </Link>
          <Link href="/listes" className="hover:text-gold-400 transition-colors">
            Listes
          </Link>
          <Link href="/style-guide" className="hover:text-gold-400 transition-colors">
            Charte
          </Link>
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>Façonné avec</span>
          <Heart className="h-3 w-3 text-velvet fill-velvet mx-1" />
          <span>pour les amoureux du 7ème art</span>
        </div>
      </div>
    </footer>
  );
}
