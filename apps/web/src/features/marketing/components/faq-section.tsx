"use client";

import { useLatinTracking, useMarketing } from "@/lib/i18n/language-context";

/** The questions that come up before someone hands over their birth data. */
export function FaqSection() {
  const m = useMarketing().faq;
  const eyebrow = useLatinTracking("uppercase tracking-[0.22em]");

  return (
    <section id="faq" className="bg-cream py-24">
      <div className="mx-auto grid max-w-[1360px] items-start gap-14 px-8 lg:grid-cols-[minmax(0,.72fr)_minmax(0,1.28fr)] lg:gap-20">
        <div className="lg:sticky lg:top-28">
          <span className={`font-mono text-2xs text-accent-ink ${eyebrow}`}>{m.eyebrow}</span>
          <h2 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">{m.title}</h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">{m.sub}</p>

          <div className="mt-9 max-w-sm rounded-lg border border-line-strong bg-surface p-5">
            <h3 className="text-sm font-semibold text-ink">{m.stuckTitle}</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted">{m.stuckBody}</p>
            <a href="mailto:support@nakhatra.com" className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-accent-ink transition-colors hover:underline">
              support@nakhatra.com
              <svg className="size-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 8h11M9 4l4 4-4 4"/></svg>
            </a>
          </div>
        </div>

        <div className="border-t border-line">
          {m.items.map(([q, a]) => (
            <details key={q} className="faq group border-b border-line">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-base font-semibold text-ink transition-colors hover:text-accent-ink">
                <span className="flex-1">{q}</span>
                <span className="chev flex size-7 shrink-0 items-center justify-center rounded-full border border-line-strong text-accent-ink transition-all group-hover:border-accent">
                  <svg className="size-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 1.5v9M1.5 6h9" /></svg>
                </span>
              </summary>
              <p className="pb-6 pr-14 text-sm leading-relaxed text-muted" dangerouslySetInnerHTML={{ __html: a }} />
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
