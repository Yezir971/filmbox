export interface FilmDetails {
  boxOffice?: string;
  budget?: string;
  country?: string;
  language?: string;
  awards?: string;
  color?: boolean;
  aspectRatio?: string;
}

export interface Film {
  id: string;
  title: string;
  originalTitle?: string;
  releaseYear: number;
  durationMinutes: number;
  durationFormatted: string; // e.g. "2h 15m"
  director: string;
  genres: string[];
  tags: string[];
  posterUrl: string;
  backdropUrl?: string;
  synopsis: string;
  weightedRating: number; // e.g. 4.3 (out of 5)
  ratingsCount: number;
  hasOscars: boolean;
  oscarsCount?: number;
  details?: FilmDetails;
  sagaId?: string;
}

export interface FicheFilm extends Film {
  casting: Array<{
    actorId: string;
    name: string;
    role: string;
    photoUrl?: string;
  }>;
  saga?: {
    id: string;
    name: string;
    totalFilms: number;
  };
  userNote?: number; // Note donnée par l'utilisateur connecté si présent
}

export interface SagaEpisode {
  id: string;
  title: string;
  releaseYear: number;
  orderInSaga: number;
  posterUrl: string;
  weightedRating: number;
  durationFormatted: string;
}

export interface NoteHistorique {
  id: string;
  filmId: string;
  filmTitle: string;
  posterUrl: string;
  note: number; // 0.5 à 5
  createdAt: string;
}

export interface Profil {
  id: string;
  pseudo: string;
  avatarUrl: string;
  bio?: string;
  favoriteFilm?: {
    id: string;
    title: string;
    posterUrl: string;
    releaseYear: number;
  };
  favoriteGenre: string;
  stats: {
    totalFilmsWatched: number;
    totalHoursWatched: number;
    averageRatingGiven: number;
    totalReviews: number;
  };
}

export interface JournalEntry {
  id: string;
  filmId: string;
  filmTitle: string;
  posterUrl: string;
  watchedAt: string; // ISO 8601
  note?: number;
  comment?: string;
  rewatch: boolean;
}

export interface Suggestion {
  film: Film;
  matchScore: number; // 0 - 100%
  reason: string; // e.g. "Parce que vous aimez Christopher Nolan"
}

export interface CompatibilityScore {
  targetPseudo: string;
  targetAvatarUrl: string;
  score: number; // 0 - 100
  commonFavoritesCount: number;
  sharedTopGenres: string[];
  summary: string;
}

export interface RankingGenre {
  genre: string;
  topFilms: Film[];
  totalFilmsInGenre: number;
}

export interface RankingDirector {
  directorId: string;
  name: string;
  photoUrl?: string;
  averageRating: number;
  filmCount: number;
  topFilms: Array<{
    id: string;
    title: string;
    weightedRating: number;
    releaseYear: number;
  }>;
}

export interface PolarizingFilm {
  film: Film;
  divergenceScore: number; // écart-type élevé des notes
  standardDeviation: number;
  positivePercentage: number; // e.g. 52% adorent
  negativePercentage: number; // e.g. 48% détestent
}

export interface DashboardStats {
  trendingFilms: Film[];
  recentCommunityJournal: JournalEntry[];
  topRankingsPreview: Film[];
  totalCommunityLogsToday: number;
}

export interface Liste {
  id: string;
  title: string;
  description: string;
  authorPseudo: string;
  authorAvatarUrl: string;
  filmCount: number;
  isPublic: boolean;
  coverPosters: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ListeItem {
  position: number;
  film: Film;
  addedAt: string;
  comment?: string;
}

export interface ListeDetail extends Liste {
  items: ListeItem[];
}

export interface BaconPathStep {
  actor: {
    id: string;
    name: string;
    photoUrl?: string;
  };
  film: {
    id: string;
    title: string;
    releaseYear: number;
    posterUrl: string;
  };
}

export interface BaconPath {
  sourceActor: string;
  targetActor: string;
  degreesOfSeparation: number;
  path: BaconPathStep[];
}

export interface Session {
  user: {
    id: string;
    pseudo: string;
    email: string;
    avatarUrl: string;
  } | null;
}
