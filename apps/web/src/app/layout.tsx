import type { Metadata } from "next";
import { Cinzel, JetBrains_Mono, Sora } from "next/font/google";
import Script from "next/script";

import { SessionSync } from "@/features/auth/components/session-sync";
import { QueryProvider } from "@/providers/query-provider";
import { LanguageProvider } from "@/lib/i18n/language-context";

import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sora",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-serif-face",
  display: "swap",
});

export const metadata: Metadata = {
  // Absolute URLs are required for social cards — a relative og:image is
  // ignored by every crawler. Override with NEXT_PUBLIC_SITE_URL per env.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://nakhatra.com"),
  title: "Nakhatra — Precision Vedic Astrology & Live AI Astrologer",
  description:
    "Experience personalized Vedic Kundali readings through deep narrative analysis, natural audio playback, and live conversational AI.",
  applicationName: "Nakhatra",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    siteName: "Nakhatra",
    title: "Nakhatra — Precision Vedic Astrology & Live AI Astrologer",
    description:
      "Your chart, computed exactly by Swiss Ephemeris. Your questions, answered from it.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Nakhatra" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nakhatra — Precision Vedic Astrology",
    description:
      "Your chart, computed exactly by Swiss Ephemeris. Your questions, answered from it.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  const umamiHost = process.env.NEXT_PUBLIC_UMAMI_HOST || "https://cloud.umami.is/script.js";

  return (
    <html lang="en" className={`${cinzel.variable} ${sora.variable} ${jetbrains.variable} dark`}>
      <body className="font-body antialiased bg-[#090A10] text-[#94A3B8] min-h-dvh">
        <LanguageProvider>
          <QueryProvider>
            <SessionSync />
            {children}
          </QueryProvider>
        </LanguageProvider>
        {umamiWebsiteId && (
          <Script
            src={umamiHost}
            data-website-id={umamiWebsiteId}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
