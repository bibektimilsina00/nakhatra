import type { Metadata } from "next";

/**
 * The signed-in half of the app, kept out of the index.
 *
 * Every route under here renders nothing until the session has been read from
 * localStorage, so what a crawler receives is an empty page. Indexed, those
 * are a few hundred blank results attached to the domain, competing with the
 * landing page and telling Google most of the site is empty. `robots.ts`
 * disallows the same paths; this is the half that still applies if a URL is
 * reached some other way.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
