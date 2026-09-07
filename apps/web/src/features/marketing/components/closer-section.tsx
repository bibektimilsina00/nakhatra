"use client";

import { useMarketing } from "@/lib/i18n/language-context";

/**
 * The closing call to action.
 *
 * Markup is the landing demo's, unchanged.
 */
export function CloserSection() {
  const m = useMarketing().closer;

  return (
    <section className="relative overflow-hidden py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_50%_50%,rgba(229,169,60,.08),transparent_70%)]"></div>
      <div className="relative mx-auto max-w-[1360px] px-8"><div className="mx-auto max-w-3xl text-center">
        <h2 className="font-disp text-[34px] font-bold leading-[1.06] tracking-[-0.025em] text-paper sm:text-[58px]">{m.titleA}<br className="hidden sm:block" />{m.titleB}</h2>
        <p className="mx-auto mt-6 max-w-md text-[15.5px] leading-[1.7] text-muted">{m.sub}</p>
        <a href="#form" className="group mt-10 inline-flex items-center gap-2.5 rounded-[8px] bg-gold px-9 py-4 text-[15px] font-semibold text-ink transition hover:bg-gold2">
          {m.cta}
          <svg className="size-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 8h11M9 4l4 4-4 4"/></svg>
        </a>
        </div>
      </div>
    </section>
  );
}
