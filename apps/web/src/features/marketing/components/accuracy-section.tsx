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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_60%_at_70%_50%,rgba(229,169,60,.05),transparent_72%)]"></div>
      <div className="relative mx-auto max-w-[1360px] px-8">
        <span className={`font-mono text-[11px] text-gold ${eyebrow}`}>{m.eyebrow}</span>
        <h2 className="mt-5 max-w-3xl font-disp text-[34px] font-bold leading-[1.08] tracking-[-0.02em] text-paper sm:text-[52px]">
          {m.titleA}<br className="hidden sm:block" />{m.titleB}
        </h2>

        {/* The argument is the section, so it gets the type rather than a card. */}
        <div className="reveal mt-14 grid gap-10 border-y border-white/[0.09] py-10 sm:grid-cols-3">
          <div>
            <div className={`font-mono text-[10.5px] text-faint ${label}`}>{m.todayLabel}</div>
            <div className="mt-2 font-mono text-[30px] leading-none text-rose-400/85">+05:45</div>
          </div>
          <div>
            <div className={`font-mono text-[10.5px] text-faint ${label}`}>{m.actualLabel}</div>
            <div className="mt-2 font-mono text-[30px] leading-none text-gold2">+05:30</div>
          </div>
          <div>
            <div className={`font-mono text-[10.5px] text-faint ${label}`}>{m.deltaLabel}</div>
            <div className="mt-2 font-mono text-[30px] leading-none text-paper">3.75°</div>
          </div>
        </div>

        <div className="mt-10 grid gap-8 text-[15px] leading-[1.85] text-muted md:grid-cols-2 md:gap-14">
          <p>{m.bodyA}<strong className="font-semibold text-paper">{m.bodyEm}</strong>{m.bodyB}</p>
          <p>{m.bodyC}</p>
        </div>
      </div>
    </section>
  );
}
