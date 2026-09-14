"use client";

import Link from "next/link";

import { useSession } from "@/features/auth/hooks/use-auth";
import { buttonClasses } from "@/components/ui/button";
import { useMarketing } from "@/lib/i18n/language-context";

/**
 * The closing call to action.
 *
 * For a signed-out visitor this is the final nudge to cast a kundali.
 * For a signed-in visitor the chart is already there — point them to it.
 */
export function CloserSection() {
  const m = useMarketing().closer;
  const nav = useMarketing().nav;
  const { isSignedIn } = useSession();

  return (
    <section className="relative overflow-hidden py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_50%_50%,var(--color-accent-wash),transparent_70%)]"></div>
      <div className="relative mx-auto max-w-[1360px] px-8"><div className="mx-auto max-w-3xl text-center">
        <h2 className="font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">{m.titleA}<br className="hidden sm:block" />{m.titleB}</h2>
        <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-muted">{m.sub}</p>
        {isSignedIn ? (
          <Link href="/dashboard" className={buttonClasses("primary", { className: "group mt-10 px-8 text-base" })}>
            {nav.dashboard}
            <svg className="size-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 8h11M9 4l4 4-4 4"/></svg>
          </Link>
        ) : (
          <a href="#form" className={buttonClasses("primary", { className: "group mt-10 px-8 text-base" })}>
            {m.cta}
            <svg className="size-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 8h11M9 4l4 4-4 4"/></svg>
          </a>
        )}
        </div>
      </div>
    </section>
  );
}
