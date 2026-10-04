export class ApiError extends Error {
  public status: number;
  public data?: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export function getApiBaseUrl(): string {
  if (typeof window === "undefined") {
    // Server-side
    return (
      process.env.API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
    );
  }
  // Client-side
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    ""
  );
}

// Fallback for SSR build-time prerendering when no local or remote HTTP server is running
async function getPrerenderMockData<T>(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  const {
    MOCK_FILMS,
    MOCK_JOURNAL,
    MOCK_LISTS,
    MOCK_POLARIZING_FILMS,
    MOCK_PROFILE,
    MOCK_RANKING_DIRECTORS,
    MOCK_RANKING_GENRES,
    MOCK_SAGA_EPISODES,
    MOCK_SUGGESTIONS,
  } = await import("@/lib/mock-data");

  const cleanEndpoint = endpoint.split("?")[0];

  if (cleanEndpoint === "/api/films") {
    const limit = Number(params?.limit) || 10;
    const page = Number(params?.page) || 1;
    return {
      films: MOCK_FILMS.slice(0, limit),
      total: MOCK_FILMS.length,
      page,
      totalPages: Math.ceil(MOCK_FILMS.length / limit),
    } as unknown as T;
  }

  if (cleanEndpoint.startsWith("/api/films/") && cleanEndpoint.endsWith("/saga")) {
    const id = cleanEndpoint.split("/")[3];
    const film = MOCK_FILMS.find((f) => f.id === id) || MOCK_FILMS[0];
    const sagaId = film.sagaId || "nolan-mind";
    return {
      sagaId,
      sagaName: sagaId === "dune-saga" ? "Dune Saga" : "Nolan Mind-Bending",
      episodes: MOCK_SAGA_EPISODES[sagaId] || [],
    } as unknown as T;
  }

  if (cleanEndpoint.startsWith("/api/films/")) {
    const id = cleanEndpoint.split("/")[3];
    const film = MOCK_FILMS.find((f) => f.id === id) || MOCK_FILMS[0];
    return {
      ...film,
      casting: [
        {
          actorId: "a1",
          name: "Leonardo DiCaprio",
          role: "Dom Cobb",
          photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
        },
        {
          actorId: "a2",
          name: "Joseph Gordon-Levitt",
          role: "Arthur",
          photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
        },
      ],
      saga: film.sagaId
        ? {
            id: film.sagaId,
            name: film.sagaId === "dune-saga" ? "Dune Saga" : "Nolan Mind-Bending",
            totalFilms: film.sagaId === "dune-saga" ? 2 : 3,
          }
        : undefined,
      userNote: 5,
    } as unknown as T;
  }

  if (cleanEndpoint === "/api/rankings/genres") {
    return MOCK_RANKING_GENRES as unknown as T;
  }

  if (cleanEndpoint === "/api/rankings/directors") {
    return MOCK_RANKING_DIRECTORS as unknown as T;
  }

  if (cleanEndpoint === "/api/rankings/polarizing") {
    return MOCK_POLARIZING_FILMS as unknown as T;
  }

  if (cleanEndpoint === "/api/lists") {
    return MOCK_LISTS.map(({ items, ...rest }) => rest) as unknown as T;
  }

  if (cleanEndpoint.startsWith("/api/lists/")) {
    const id = cleanEndpoint.split("/")[3];
    const list = MOCK_LISTS.find((l) => l.id === id) || MOCK_LISTS[0];
    return list as unknown as T;
  }

  if (cleanEndpoint.endsWith("/journal")) {
    return MOCK_JOURNAL as unknown as T;
  }

  if (cleanEndpoint.endsWith("/suggestions")) {
    return MOCK_SUGGESTIONS as unknown as T;
  }

  if (cleanEndpoint.startsWith("/api/users/")) {
    const pseudo = cleanEndpoint.split("/")[3] || "Alice";
    return { ...MOCK_PROFILE, pseudo } as unknown as T;
  }

  if (cleanEndpoint === "/api/stats") {
    return {
      trendingFilms: MOCK_FILMS.slice(0, 4),
      recentCommunityJournal: MOCK_JOURNAL,
      topRankingsPreview: [MOCK_FILMS[1], MOCK_FILMS[0], MOCK_FILMS[4]],
      totalCommunityLogsToday: 1342,
    } as unknown as T;
  }

  if (cleanEndpoint === "/api/me") {
    return {
      user: {
        id: "u1",
        pseudo: "Alice",
        email: "alice@filmbox.cinema",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
      },
    } as unknown as T;
  }

  throw new Error(`Endpoint mock not found for: ${cleanEndpoint}`);
}

export async function apiClient<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { params, headers: customHeaders, ...customOptions } = options;

  let url = `${getApiBaseUrl()}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  // If running server-side in Next.js, forward the cookies if available
  if (typeof window === "undefined") {
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = cookies();
      const cookieHeader = cookieStore.toString();
      if (cookieHeader) {
        defaultHeaders["Cookie"] = cookieHeader;
      }
    } catch {
      // Outside request context (e.g. static generation)
    }
  }

  try {
    const response = await fetch(url, {
      ...customOptions,
      headers: {
        ...defaultHeaders,
        ...customHeaders,
      },
      credentials: customOptions.credentials || "include",
    });

    if (!response.ok) {
      let errorData: any = null;
      try {
        errorData = await response.json();
      } catch {
        // response is not json
      }
      const errorMessage =
        errorData?.message ||
        `HTTP Error ${response.status}: ${response.statusText}`;
      throw new ApiError(response.status, errorMessage, errorData);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    // If running during SSR prerender and network fails (no server listening yet)
    if (typeof window === "undefined") {
      try {
        return await getPrerenderMockData<T>(endpoint, params);
      } catch {
        // throw original error if mock resolver fails
      }
    }
    throw error;
  }
}
