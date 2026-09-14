"use client";

import { useLatinTracking, useMarketing } from "@/lib/i18n/language-context";

/**
 * Why charts disagree: Kathmandu's offset, and what it costs.
 *
 * Markup is the landing demo's, unchanged.
 */
export function AccuracySection() {
  const m = useMarketing().accuracy;
  const eyebrow = useLatinTracking("uppercase tracking-[0.22em]");
  const label = useLatinTracking("uppercase tracking-[0.18em]");

  return (
    <section id="accuracy" className="relative overflow-hidden py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_60%_at_70%_50%,var(--color-accent-wash),transparent_72%)]"></div>
      <div className="relative mx-auto max-w-[1360px] px-8">
        <span className={`font-mono text-2xs text-accent-ink ${eyebrow}`}>{m.eyebrow}</span>
        <h2 className="mt-5 max-w-3xl font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">
          {m.titleA}<br className="hidden sm:block" />{m.titleB}
        </h2>

        {/* The argument is the section, so it gets the type rather than a card. */}
        <div className="reveal mt-14 grid gap-10 border-y border-line py-10 sm:grid-cols-3">
          <div>
            <div className={`font-mono text-2xs text-dim ${label}`}>{m.todayLabel}</div>
            <div className="mt-2 font-mono text-3xl leading-none text-danger-ink">+05:45</div>
          </div>
          <div>
            <div className={`font-mono text-2xs text-dim ${label}`}>{m.actualLabel}</div>
            <div className="mt-2 font-mono text-3xl leading-none text-accent-ink">+05:30</div>
          </div>
          <div>
            <div className={`font-mono text-2xs text-dim ${label}`}>{m.deltaLabel}</div>
            <div className="mt-2 font-mono text-3xl leading-none text-ink">3.75°</div>
          </div>
        </div>

        <div className="mt-10 grid gap-8 text-sm leading-relaxed text-muted md:grid-cols-2 md:gap-14">
          <p>{m.bodyA}<strong className="font-semibold text-ink">{m.bodyEm}</strong>{m.bodyB}</p>
          <p>{m.bodyC}</p>
        </div>
      </div>
    </section>
  );
}
