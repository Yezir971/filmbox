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
    // Côté serveur : priorité à la variable locale ou conteneur
    return (
      process.env.API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://localhost:${process.env.PORT || 3000}`)
    );
  }
  // Côté client
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    ""
  );
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

  // En SSR Next.js, propager les cookies de session s'ils sont disponibles
  if (typeof window === "undefined") {
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = cookies();
      const cookieHeader = cookieStore.toString();
      if (cookieHeader) {
        defaultHeaders["Cookie"] = cookieHeader;
      }
    } catch {
      // Hors contexte de requête (ex: prerender statique)
    }
  }

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
      // Pas de corps JSON
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
}
