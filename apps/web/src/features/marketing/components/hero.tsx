"use client";

import { buttonClasses } from "@/components/ui/button";
import { HeroSky } from "@/features/marketing/components/hero-sky";
import {
  ChartCaption, LiveChart, useChartFocus,
} from "@/features/marketing/components/live-chart";
import { useSky } from "@/features/marketing/hooks/use-sky";
import { useLatinTracking, useMarketing } from "@/lib/i18n/language-context";

/**
 * The hero: real planetary positions behind the copy, and the D1/D9 pair
 * a Jyotishi always reads together beside it.
 *
 * This is the one component that drives the shared sky — everything else
 * on the page reads from it.
 */
export function Hero() {
  const m = useMarketing().hero;
  const tracking = useLatinTracking("uppercase tracking-[0.25em]");
  const sky = useSky(true);
  const d1 = useChartFocus();
  const d9 = useChartFocus();
  const focus = d1.focus ?? d9.focus;

  return (
    <section id="top" className="grain relative min-h-screen overflow-hidden bg-cream">
      <HeroSky />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_78%_62%_at_50%_46%,transparent_0%,var(--color-accent-wash)_58%,var(--color-cream)_90%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-cream to-transparent" />

      <div className="relative mx-auto grid min-h-screen max-w-[1360px] items-center gap-16 px-8 pb-28 pt-28 lg:grid-cols-[1fr_auto]">
        <div className="max-w-2xl" data-sky-avoid>
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">
            {m.titleA}<br />
            <span className="text-accent-ink">{m.titleB}</span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-muted">
            {m.sub}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#form" className={buttonClasses("primary", { className: "group text-sm" })}>
              {m.ctaPrimary}
              <svg className="size-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 8h11M9 4l4 4-4 4" /></svg>
            </a>
            <a href="#reading" className={buttonClasses("secondary", { className: "text-sm" })}>{m.ctaSecondary}</a>
          </div>
        </div>

        {/* D1 and D9, the pair a Jyotishi always reads together */}
        <div className="hidden lg:block lg:justify-self-end" data-sky-avoid>
          <div className="grid w-[196px] gap-5">
            {sky && (
              <>
                <figure>
                  <LiveChart
                    id="d1" sky={sky} isD9={false}
                    selected={d1.focus ?? d1.pinned}
                    onFocus={d1.setHover}
                    onSelect={(f) => { d1.setPinned(f); d9.setPinned(null); }}
                  />
                  <figcaption className="mt-2 text-center font-mono text-2xs uppercase tracking-wider text-dim">D1 · Rashi</figcaption>
                </figure>
                <figure>
                  <LiveChart
                    id="d9" sky={sky} isD9
                    selected={d9.focus ?? d9.pinned}
                    onFocus={d9.setHover}
                    onSelect={(f) => { d9.setPinned(f); d1.setPinned(null); }}
                  />
                  <figcaption className="mt-2 text-center font-mono text-2xs uppercase tracking-wider text-dim">D9 · Navamsha</figcaption>
                </figure>
                <p className="text-center font-mono text-2xs leading-relaxed text-dim">
                  <ChartCaption sky={sky} focus={focus} isD9={focus?.chart === "d9"} />
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <a href="#pillars" className="absolute inset-x-0 bottom-8 mx-auto flex w-fit flex-col items-center gap-2 text-dim">
        <span className={`text-2xs ${tracking}`}>{m.scroll}</span>
        <svg className="bob size-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M8 3v10M4 9l4 4 4-4" /></svg>
      </a>
    </section>
  );
}
