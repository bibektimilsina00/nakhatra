import Link from "next/link";

import { NakhatraMark } from "@/components/ui/nakhatra-mark";
import { KundaliPanel } from "@/features/kundali/components/kundali-panel";

/**
 * Casting a chart, as a page.
 *
 * Creation is a dialog on the dashboard now; this route survives for the links
 * that point at it from outside the app — the marketing site, the login page,
 * a bookmark. So it is the form and nothing else: the second navigation bar,
 * the zodiac strip, the promo banner and the footer that used to wrap four
 * fields are gone.
 *
 * Routing and layout only. All logic lives in `features/`
 * (docs/architecture.md §8).
 */
export default function KundaliPage() {
  return (
    <div className="min-h-dvh bg-app font-sys text-mut antialiased">
      <header className="border-b border-brd">
        <div className="mx-auto flex w-full max-w-lg items-center justify-between px-4 py-3.5">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <NakhatraMark className="size-6 text-acc" />
            <span className="font-logo text-[13px] font-bold tracking-[0.18em] text-fg">
              NAKHATRA
            </span>
          </Link>
          <Link
            href="/dashboard"
            className="text-[13px] text-mut transition-colors hover:text-fg"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg px-4 py-10">
        <KundaliPanel />
      </main>
    </div>
  );
}
