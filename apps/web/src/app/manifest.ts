import type { MetadataRoute } from "next";

/**
 * PWA manifest. Android and Chrome read this for install prompts and the
 * home-screen icon; Google Search Console reads it for site identity.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nakhatra — Precision Vedic Astrology",
    short_name: "Nakhatra",
    description:
      "Your chart, computed exactly by Swiss Ephemeris. Your questions, answered from it.",
    start_url: "/",
    display: "standalone",
    // This literal must be manually kept in sync with globals.css's light --t-cream since a PWA manifest / export-lib config is read outside any rendered DOM and can't reference a CSS custom property.
    background_color: "#ede3d3",
    theme_color: "#ede3d3",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Maskable icons are padded so Android can crop them to any shape
      // without clipping the mark.
      { src: "/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
