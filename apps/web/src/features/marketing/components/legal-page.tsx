import Link from "next/link";

import { MainFooter } from "@/components/layout/main-footer";
import { MainNavbar } from "@/components/layout/main-navbar";

/** Where legal notices reach a human. Change here, not in each document. */
export const CONTACT_EMAIL = "support@nakhatra.com";
export const LAST_UPDATED = "6 September 2026";

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
    <div className="min-h-dvh bg-[#0A0B11] font-body text-[#CBD5E1]">
      <MainNavbar />

      <main className="mx-auto w-full max-w-3xl px-6 py-14 sm:py-20">
        <header className="mb-12 border-b border-brd pb-8">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#F8FAFC] sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-[#94A3B8]">
            {summary}
          </p>
          <p className="mt-5 text-[13px] text-[#64748B]">Last updated {LAST_UPDATED}</p>
        </header>

        {/* `prose`-less on purpose: a handful of element rules is less to reason
            about than a typography plugin for two pages. */}
        <div
          className="
            space-y-8 text-[15px] leading-[1.75]
            [&_a]:text-[#E5A93C] [&_a]:underline [&_a]:underline-offset-2
            [&_h2]:font-serif [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-[#F8FAFC]
            [&_h2]:mb-3 [&_h2]:mt-10 [&_h2:first-child]:mt-0
            [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-[#E2E8F0]
            [&_li]:mb-2 [&_p]:mb-4
            [&_strong]:font-semibold [&_strong]:text-[#F8FAFC]
            [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6
          "
        >
          {children}
        </div>

        <div className="mt-14 border-t border-brd pt-8 text-[14px] text-[#94A3B8]">
          Questions about this document? Email{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-[#E5A93C] underline underline-offset-2"
          >
            {CONTACT_EMAIL}
          </a>
          . See also our{" "}
          <Link href="/privacy" className="text-[#E5A93C] underline underline-offset-2">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/terms" className="text-[#E5A93C] underline underline-offset-2">
            Terms of Service
          </Link>
          .
        </div>
      </main>

      <MainFooter />
    </div>
  );
}
