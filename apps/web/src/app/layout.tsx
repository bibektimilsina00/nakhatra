import type { Metadata } from "next";
import { Cinzel, JetBrains_Mono, Sora } from "next/font/google";
import Script from "next/script";

import { SessionSync } from "@/features/auth/components/session-sync";
import { SITE_NAME, SITE_URL } from "@/lib/seo/site";
import { QueryProvider } from "@/providers/query-provider";
import { LanguageProvider } from "@/lib/i18n/language-context";
import { THEME_INIT_SCRIPT, ThemeProvider } from "@/providers/theme-provider";

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

const TITLE = "Nakhatra — Free Vedic Kundali, Reading & AI Astrologer";
const DESCRIPTION =
  "Cast your Vedic birth chart free, to the arcsecond, with Swiss Ephemeris — " +
  "Lahiri ayanamsa, whole-sign houses, all sixteen vargas and your Vimshottari " +
  "dasha. Read it in English, Nepali or Hindi, ask an AI astrologer about it, " +
  "and match two charts with full Ashtakoota Kundali Milan. Nakhatra is named " +
  "for the nakshatra, the lunar mansions Vedic astrology is read by.";

export const metadata: Metadata = {
  // Absolute URLs are required for social cards — a relative og:image is
  // ignored by every crawler. Override with NEXT_PUBLIC_SITE_URL per env.
  metadataBase: new URL(SITE_URL),
  title: {
    // Every page appends the brand instead of setting it by hand, so no page
    // can ship a title that does not say whose site it is.
    default: TITLE,
    template: `%s — ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  // The landing page is the canonical for `/`. Without one, a link carrying a
  // campaign parameter is a second URL with the same content.
  alternates: { canonical: "/" },
  category: "lifestyle",
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  // Phone-number autolinking rewrites dates and coordinates on this site into
  // tel: links, which is both wrong and ugly.
  formatDetection: { telephone: false, address: false, email: false },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      // Defaults cap the snippet and forbid large image previews, which is the
      // difference between a card and a line of text in the results.
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  verification: {
    // Set per environment; absent locally, so nothing fake is emitted.
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
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
    siteName: SITE_NAME,
    url: SITE_URL,
    locale: "en_US",
    // The site is read in all three; declaring them lets a share in Nepali or
    // Hindi be understood as the same page rather than a different one.
    alternateLocale: ["ne_NP", "hi_IN"],
    title: TITLE,
    description:
      "Your chart, computed exactly by Swiss Ephemeris. Your questions, answered from it.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Nakhatra — a Vedic birth chart cast from the Swiss Ephemeris",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nakhatra — Free Vedic Kundali & AI Astrologer",
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
    <html
      lang="en"
      suppressHydrationWarning
      className={`${cinzel.variable} ${sora.variable} ${jetbrains.variable} dark`}
    >
      <head>
        {/* Before paint, so the patro theme never flashes dark first. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="font-body antialiased bg-app text-mut min-h-dvh">
        <ThemeProvider>
        <LanguageProvider>
          <QueryProvider>
            <SessionSync />
            {children}
          </QueryProvider>
        </LanguageProvider>
        </ThemeProvider>
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
