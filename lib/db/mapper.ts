import type { Film, FicheFilm } from "@/types/api";

const POSTER_MAP: Record<string, { poster: string; backdrop: string }> = {
  "Inception": {
    poster: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80",
    backdrop: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80",
  },
  "The Dark Knight": {
    poster: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80",
    backdrop: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1600&auto=format&fit=crop&q=80",
  },
  "Batman Begins": {
    poster: "https://images.unsplash.com/photo-1531259683007-016a7b628fc3?w=800&auto=format&fit=crop&q=80",
    backdrop: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&auto=format&fit=crop&q=80",
  },
  "The Dark Knight Rises": {
    poster: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80",
    backdrop: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1600&auto=format&fit=crop&q=80",
  },
  "Interstellar": {
    poster: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80",
    backdrop: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1600&auto=format&fit=crop&q=80",
  },
  "Pulp Fiction": {
    poster: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=800&auto=format&fit=crop&q=80",
    backdrop: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80",
  },
  "Fight Club": {
    poster: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80",
    backdrop: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600&auto=format&fit=crop&q=80",
  },
  "Seven": {
    poster: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80",
    backdrop: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1600&auto=format&fit=crop&q=80",
  },
  "Retour vers le futur": {
    poster: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80",
    backdrop: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&auto=format&fit=crop&q=80",
  },
  "Retour vers le futur II": {
    poster: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80",
    backdrop: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&auto=format&fit=crop&q=80",
  },
  "Retour vers le futur III": {
    poster: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80",
    backdrop: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&auto=format&fit=crop&q=80",
  },
  "Titanic": {
    poster: "https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=800&auto=format&fit=crop&q=80",
    backdrop: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&auto=format&fit=crop&q=80",
  },
  "Le Parrain": {
    poster: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80",
    backdrop: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1600&auto=format&fit=crop&q=80",
  },
  "La Haine": {
    poster: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80",
    backdrop: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1600&auto=format&fit=crop&q=80",
  },
  "Les Évadés": {
    poster: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80",
    backdrop: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&auto=format&fit=crop&q=80",
  },
  "Forrest Gump": {
    poster: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&auto=format&fit=crop&q=80",
    backdrop: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80",
  },
  "Le Loup de Wall Street": {
    poster: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=800&auto=format&fit=crop&q=80",
    backdrop: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600&auto=format&fit=crop&q=80",
  },
  "Intouchables": {
    poster: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80",
    backdrop: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80",
  },
  "Mystic River": {
    poster: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80",
    backdrop: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1600&auto=format&fit=crop&q=80",
  },
  "Apollo 13": {
    poster: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80",
    backdrop: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1600&auto=format&fit=crop&q=80",
  },
  "X-Men : Le Commencement": {
    poster: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80",
    backdrop: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1600&auto=format&fit=crop&q=80",
  },
  "X-Men : Days of Future Past": {
    poster: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80",
    backdrop: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&auto=format&fit=crop&q=80",
  },
  "X-Men : Apocalypse": {
    poster: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80",
    backdrop: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&auto=format&fit=crop&q=80",
  },
};

const DEFAULT_POSTER = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80";
const DEFAULT_BACKDROP = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80";

export function getMediaForTitle(title: string) {
  const match = POSTER_MAP[title];
  if (match) return match;
  return {
    poster: DEFAULT_POSTER,
    backdrop: DEFAULT_BACKDROP,
  };
}

export function mapRowToFilm(row: any): Film {
  const details = typeof row.details === "object" && row.details !== null ? row.details : {};
  const tags: string[] = Array.isArray(details.tags) ? details.tags : [];
  const duration = row.duree_min ?? details.duree ?? 120;
  const media = getMediaForTitle(row.titre);

  return {
    id: String(row.id),
    title: row.titre,
    originalTitle: row.titre,
    releaseYear: row.annee,
    durationMinutes: duration,
    durationFormatted: row.duree_texte || `${Math.floor(duration / 60)}h ${duration % 60}m`,
    director: row.realisateurs || row.director || "Réalisateur Inconnu",
    genres: [row.genre],
    tags: tags.length > 0 ? tags : [row.genre, "Classique"],
    posterUrl: media.poster,
    backdropUrl: media.backdrop,
    synopsis: details.synopsis || `Un chef-d'œuvre du cinéma (${row.genre}) sorti en ${row.annee}.`,
    weightedRating: parseFloat(row.note_ponderee || row.moyenne || 4.0),
    ratingsCount: parseInt(row.nb_notes || 10, 10),
    hasOscars: Boolean(details.oscar_meilleur_film),
    oscarsCount: details.oscar_meilleur_film ? 1 : 0,
    sagaId: row.saga_id ? String(row.saga_id) : undefined,
    details: {
      boxOffice: details.box_office || "N/A",
      budget: details.budget || "N/A",
      country: Array.isArray(details.pays) ? details.pays.join(", ") : "États-Unis",
      language: details.langue || "Anglais",
      awards: details.oscar_meilleur_film ? "Oscar du Meilleur Film" : "Sélection Officielle",
    },
  };
}
