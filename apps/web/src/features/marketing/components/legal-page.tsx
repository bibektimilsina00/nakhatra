import Link from "next/link";

import { MainFooter } from "@/components/layout/main-footer";
import { MainNavbar } from "@/components/layout/main-navbar";

/** Where legal notices reach a human. Change here, not in each document. */
export const CONTACT_EMAIL = "support@nakhatra.com";
export const LAST_UPDATED = "10 September 2026";

/**
 * Shell for the privacy policy and terms.
 *
 * These have to stay publicly reachable with no sign-in: Google checks both
 * during OAuth verification, and a policy behind a login is not a published
 * policy.
 */
export function LegalPage({
  title,
  summary,
  children,
}: {
  title: string;
  summary: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-cream font-body text-muted">
      <MainNavbar />

      <main className="mx-auto w-full max-w-3xl px-6 py-14 sm:py-20">
        <header className="mb-12 border-b border-line pb-8">
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-[60ch] text-sm leading-relaxed text-muted">
            {summary}
          </p>
          <p className="mt-5 text-xs text-dim">Last updated {LAST_UPDATED}</p>
        </header>

        {/* `prose`-less on purpose: a handful of element rules is less to reason
            about than a typography plugin for two pages. */}
        <div
          className="
            space-y-8 text-sm leading-relaxed text-muted
            [&_a]:text-accent-ink [&_a]:underline [&_a]:underline-offset-2
            [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-ink
            [&_h2]:mb-3 [&_h2]:mt-10 [&_h2:first-child]:mt-0
            [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-ink
            [&_li]:mb-2 [&_p]:mb-4
            [&_strong]:font-semibold [&_strong]:text-ink
            [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6
          "
        >
          {children}
        </div>

        <div className="mt-14 border-t border-line pt-8 text-xs text-dim">
          Questions about this document? Email{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-accent-ink underline underline-offset-2"
          >
            {CONTACT_EMAIL}
          </a>
          . See also our{" "}
          <Link href="/privacy" className="text-accent-ink underline underline-offset-2">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/terms" className="text-accent-ink underline underline-offset-2">
            Terms of Service
          </Link>
          .
        </div>
      </main>

      <MainFooter />
    </div>
  );
}
