import type { Metadata, Viewport } from "next";
import { Cinzel, Inter } from "next/font/google";
import { getSession } from "@/lib/session";
import { SessionProvider } from "@/lib/auth/useSession";
import { SWRProvider } from "@/lib/swr-provider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/toaster";

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: "swap",
  weight: ["700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "FilmBox — L'univers des passionnés de cinéma",
    template: "%s | FilmBox",
  },
  description:
    "Application sociale pour cinéphiles. Explorez le catalogue, notez vos films, découvrez de nouvelles pépites et analysez vos graphes de casting.",
  keywords: ["cinéma", "films", "critiques", "notes", "classements", "filmbox"],
  authors: [{ name: "FilmBox Team" }],
  openGraph: {
    title: "FilmBox — L'univers des passionnés de cinéma",
    description:
      "Explorez le catalogue, notez vos films, découvrez de nouvelles pépites et plongez dans l'ambiance salle obscure.",
    type: "website",
    locale: "fr_FR",
    siteName: "FilmBox",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#070709",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <html lang="fr" className={`dark ${cinzel.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-background font-sans text-foreground flex flex-col justify-between">
        <SessionProvider initialSession={session}>
          <SWRProvider>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1 container px-4 sm:px-8 py-8">
                {children}
              </main>
              <Footer />
            </div>
            <Toaster />
          </SWRProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
