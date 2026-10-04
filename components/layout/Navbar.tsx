"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Film, Compass, Trophy, Bookmark, User, Clapperboard, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth/useSession";
import { UserAvatar } from "@/components/ui/user-avatar";

const navLinks = [
  { href: "/", label: "Accueil", icon: Clapperboard },
  { href: "/catalogue", label: "Catalogue", icon: Film },
  { href: "/decouverte", label: "Découverte", icon: Compass },
  { href: "/classements", label: "Classements", icon: Trophy },
  { href: "/listes", label: "Listes", icon: Bookmark },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useSession();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2 group font-display text-2xl font-bold tracking-wider text-gold-400"
            aria-label="FilmBox accueil"
          >
            <div className="p-1.5 rounded-lg bg-gold-500/10 border border-gold-500/30 group-hover:border-gold-400 transition-colors">
              <Film className="h-5 w-5 text-gold-400" />
            </div>
            <span className="bg-gradient-to-r from-gold-300 via-gold-400 to-amber-500 bg-clip-text text-transparent">
              FILMBOX
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-1" aria-label="Navigation principale">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-secondary text-primary font-semibold shadow-sm border border-primary/20"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/style-guide"
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border border-border/60 text-muted-foreground hover:text-gold-300 hover:border-gold-500/30 transition-colors"
          >
            <Sparkles className="h-3 w-3 text-gold-400" />
            Style Guide
          </Link>

          {isAuthenticated && user ? (
            <Link
              href={`/profil/${user.pseudo}`}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/80 bg-secondary/60 hover:border-gold-500/40 transition-colors"
            >
              <UserAvatar size="sm" pseudo={user.pseudo} avatarUrl={user.avatarUrl} />
              <span className="text-sm font-medium text-foreground">
                {user.pseudo}
              </span>
            </Link>
          ) : (
            <Link
              href="/profil/demo"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/60 bg-secondary/30 text-xs text-muted-foreground hover:text-foreground hover:border-border transition-colors"
            >
              <User className="h-4 w-4" />
              <span>Visiteur</span>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile nav bar at bottom or scroll */}
      <div className="flex md:hidden border-t border-border/40 overflow-x-auto py-2 px-4 gap-2 scrollbar-none">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex shrink-0 items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium",
                isActive
                  ? "bg-secondary text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
