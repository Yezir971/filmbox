import type { Metadata } from "next";
import { getFilms } from "@/lib/api/films";
import { CatalogueClient } from "@/components/catalogue/CatalogueClient";

export const metadata: Metadata = {
  title: "Catalogue des Films",
  description:
    "Parcourez notre collection cinématographique exhaustive. Filtrez par genre, décennie, durée et découvrez les chefs-d'œuvre oscarisés.",
  openGraph: {
    title: "Catalogue des Films | FilmBox",
    description:
      "Parcourez notre collection cinématographique. Filtrez par genre, décennie, durée et découvrez les pépites du 7ème art.",
  },
};

export const revalidate = 60;

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const genre = typeof searchParams.genre === "string" ? searchParams.genre : undefined;
  const decade = typeof searchParams.decade === "string" ? searchParams.decade : undefined;
  const search = typeof searchParams.search === "string" ? searchParams.search : undefined;
  const hasOscars = searchParams.hasOscars === "true";
  const maxDuration =
    typeof searchParams.maxDuration === "string"
      ? parseInt(searchParams.maxDuration, 10)
      : undefined;
  const page =
    typeof searchParams.page === "string" ? parseInt(searchParams.page, 10) : 1;

  let initialData: { films: import("@/types/api").Film[]; total: number; page: number; totalPages: number } = {
    films: [],
    total: 0,
    page: 1,
    totalPages: 1,
  };
  try {
    initialData = await getFilms({
      genre,
      decade,
      search,
      hasOscars,
      maxDuration,
      page,
      limit: 10,
    });
  } catch {
    // Fallback if API fails
  }

  return (
    <CatalogueClient
      initialFilms={initialData.films}
      initialTotal={initialData.total}
      initialPage={initialData.page}
      initialTotalPages={initialData.totalPages}
    />
  );
}
