import type { Film, FicheFilm } from "@/types/api";

import { getMovieMediaSync } from "@/lib/tmdb";

export function getMediaForTitle(title: string) {
  return getMovieMediaSync(title);
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
    weightedRating: !isNaN(parseFloat(row.note_ponderee ?? row.moyenne)) ? parseFloat(row.note_ponderee ?? row.moyenne) : 0,
    ratingsCount: parseInt(row.nb_notes || "0", 10),
    hasOscars: Boolean(details.oscar_meilleur_film),
    oscarsCount: details.oscar_meilleur_film ? 1 : 0,
    sagaId: row.saga_id ? String(row.saga_id) : undefined,
    viewsCount: row.nb_vues != null ? parseInt(row.nb_vues, 10) : 0,
    details: {
      boxOffice: details.box_office || "N/A",
      budget: details.budget || "N/A",
      country: Array.isArray(details.pays) ? details.pays.join(", ") : "États-Unis",
      language: details.langue || "Anglais",
      awards: details.oscar_meilleur_film ? "Oscar du Meilleur Film" : "Sélection Officielle",
    },
  };
}
