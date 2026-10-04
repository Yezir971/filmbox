/**
 * Service d'intégration The Movie Database (TMDB) & Cache Médias FilmBox
 * 
 * Assure la récupération haute fidélité des affiches, backdrops et portraits de personnalités
 * avec :
 * - Cache pré-indexé instantané pour les 30 films et 72 personnes de la base (0ms de latence)
 * - Normalisation UTF-8 pour supporter les variantes d'encodage SQL
 * - Interrogation dynamique de l'API TMDB officielle si TMDB_API_KEY ou TMDB_READ_TOKEN est configuré
 * - Fallbacks gracieux et tolérance aux pannes réseau
 */

import tmdbData from "./tmdb-data.json";

export interface MovieMedia {
  poster: string;
  backdrop: string;
}

const DEFAULT_POSTER = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80";
const DEFAULT_BACKDROP = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80";
const DEFAULT_PERSON_PHOTO = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80";

// Cache mémoire runtime pour les requêtes dynamiques TMDB
const runtimeMovieCache = new Map<string, MovieMedia>();
const runtimePersonCache = new Map<string, string>();

/**
 * Normalise une chaîne de caractères pour faciliter la correspondance
 * en supprimant les imperfections d'encodage (ex: latin1 <-> utf8)
 */
export function normalizeString(str: string): string {
  if (!str) return "";
  return str
    .replace(/Ãª/g, "ê")
    .replace(/Ã©/g, "é")
    .replace(/Ã‰/g, "É")
    .replace(/Ã´/g, "ô")
    .replace(/Ã§/g, "ç")
    .replace(/Ã¯/g, "ï")
    .replace(/â€¦/g, "…")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// Index normalisé des films
const normalizedMovieIndex = new Map<string, MovieMedia>();
for (const [title, data] of Object.entries(tmdbData.movies)) {
  const media: MovieMedia = {
    poster: data.poster || DEFAULT_POSTER,
    backdrop: data.backdrop || DEFAULT_BACKDROP,
  };
  normalizedMovieIndex.set(title.toLowerCase(), media);
  normalizedMovieIndex.set(normalizeString(title), media);
}

// Index normalisé des personnes
const normalizedPersonIndex = new Map<string, string>();
for (const [name, photo] of Object.entries(tmdbData.persons)) {
  if (photo) {
    normalizedPersonIndex.set(name.toLowerCase(), photo);
    normalizedPersonIndex.set(normalizeString(name), photo);
  }
}

/**
 * Recherche synchrone dans le cache local (idéal pour le mapping SSR immédiat)
 */
export function getMovieMediaSync(title: string): MovieMedia {
  if (!title) {
    return { poster: DEFAULT_POSTER, backdrop: DEFAULT_BACKDROP };
  }

  const rawLower = title.toLowerCase();
  if (normalizedMovieIndex.has(rawLower)) {
    return normalizedMovieIndex.get(rawLower)!;
  }

  const normalized = normalizeString(title);
  if (normalizedMovieIndex.has(normalized)) {
    return normalizedMovieIndex.get(normalized)!;
  }

  // Vérifier le cache runtime mémoire
  if (runtimeMovieCache.has(normalized)) {
    return runtimeMovieCache.get(normalized)!;
  }

  return {
    poster: DEFAULT_POSTER,
    backdrop: DEFAULT_BACKDROP,
  };
}

/**
 * Recherche synchrone du portrait d'une personne dans le cache
 */
export function getPersonPhotoSync(name: string): string {
  if (!name) return DEFAULT_PERSON_PHOTO;

  const rawLower = name.toLowerCase();
  if (normalizedPersonIndex.has(rawLower)) {
    return normalizedPersonIndex.get(rawLower)!;
  }

  const normalized = normalizeString(name);
  if (normalizedPersonIndex.has(normalized)) {
    return normalizedPersonIndex.get(normalized)!;
  }

  if (runtimePersonCache.has(normalized)) {
    return runtimePersonCache.get(normalized)!;
  }

  return DEFAULT_PERSON_PHOTO;
}

/**
 * Recherche asynchrone avec support de l'API TMDB officielle
 */
export async function getMovieMedia(title: string, year?: number): Promise<MovieMedia> {
  const local = getMovieMediaSync(title);
  if (local.poster !== DEFAULT_POSTER) {
    return local;
  }

  const apiKey = process.env.TMDB_API_KEY;
  const readToken = process.env.TMDB_READ_TOKEN;

  if (!apiKey && !readToken) {
    return local;
  }

  const normKey = normalizeString(title);
  try {
    const url = new URL("https://api.themoviedb.org/3/search/movie");
    url.searchParams.set("query", title);
    url.searchParams.set("language", "fr-FR");
    url.searchParams.set("include_adult", "false");
    if (year) {
      url.searchParams.set("year", String(year));
    }
    if (apiKey) {
      url.searchParams.set("api_key", apiKey);
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (readToken) {
      headers["Authorization"] = `Bearer ${readToken}`;
    }

    const res = await fetch(url.toString(), { headers, next: { revalidate: 86400 } });
    if (!res.ok) return local;

    const data = await res.json();
    const result = data.results?.[0];
    if (result) {
      const media: MovieMedia = {
        poster: result.poster_path
          ? `https://image.tmdb.org/t/p/w780${result.poster_path}`
          : DEFAULT_POSTER,
        backdrop: result.backdrop_path
          ? `https://image.tmdb.org/t/p/w1280${result.backdrop_path}`
          : DEFAULT_BACKDROP,
      };
      runtimeMovieCache.set(normKey, media);
      return media;
    }
  } catch (error) {
    console.error("[TMDB Service] Erreur lors de l'appel TMDB movie:", error);
  }

  return local;
}

/**
 * Recherche asynchrone du portrait d'une personnalité avec support TMDB
 */
export async function getPersonPhoto(name: string): Promise<string> {
  const local = getPersonPhotoSync(name);
  if (local !== DEFAULT_PERSON_PHOTO) {
    return local;
  }

  const apiKey = process.env.TMDB_API_KEY;
  const readToken = process.env.TMDB_READ_TOKEN;

  if (!apiKey && !readToken) {
    return local;
  }

  const normKey = normalizeString(name);
  try {
    const url = new URL("https://api.themoviedb.org/3/search/person");
    url.searchParams.set("query", name);
    url.searchParams.set("language", "fr-FR");
    if (apiKey) {
      url.searchParams.set("api_key", apiKey);
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (readToken) {
      headers["Authorization"] = `Bearer ${readToken}`;
    }

    const res = await fetch(url.toString(), { headers, next: { revalidate: 86400 } });
    if (!res.ok) return local;

    const data = await res.json();
    const result = data.results?.[0];
    if (result && result.profile_path) {
      const photo = `https://image.tmdb.org/t/p/w300${result.profile_path}`;
      runtimePersonCache.set(normKey, photo);
      return photo;
    }
  } catch (error) {
    console.error("[TMDB Service] Erreur lors de l'appel TMDB person:", error);
  }

  return local;
}
