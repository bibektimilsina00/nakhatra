"use client";

import { useLatinTracking, useMarketing } from "@/lib/i18n/language-context";

/** The questions that come up before someone hands over their birth data. */
export function FaqSection() {
  const m = useMarketing().faq;
  const eyebrow = useLatinTracking("uppercase tracking-[0.22em]");

  return (
    <section id="faq" className="bg-ink2 py-24">
      <div className="mx-auto grid max-w-[1360px] items-start gap-14 px-8 lg:grid-cols-[minmax(0,.72fr)_minmax(0,1.28fr)] lg:gap-20">
        <div className="lg:sticky lg:top-28">
          <span className={`font-mono text-[11px] text-gold ${eyebrow}`}>{m.eyebrow}</span>
          <h2 className="mt-4 font-disp text-[30px] font-bold leading-[1.12] tracking-[-0.015em] text-paper sm:text-[38px]">{m.title}</h2>
          <p className="mt-4 max-w-sm text-[15px] leading-[1.7] text-muted">{m.sub}</p>

          <div className="mt-9 max-w-sm rounded-[8px] border border-white/[0.09] bg-card/50 p-5">
            <h3 className="text-[14px] font-semibold text-paper">{m.stuckTitle}</h3>
            <p className="mt-2 text-[13px] leading-[1.7] text-muted">{m.stuckBody}</p>
            <a href="mailto:support@nakhatra.com" className="mt-4 inline-flex items-center gap-2 text-[13px] font-semibold text-gold transition-colors hover:text-gold2">
              support@nakhatra.com
              <svg className="size-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 8h11M9 4l4 4-4 4"/></svg>
            </a>
          </div>
        </div>

        <div className="border-t border-white/[0.09]">
          {m.items.map(([q, a]) => (
            <details key={q} className="faq group border-b border-white/[0.09]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[15.5px] font-semibold text-paper transition-colors hover:text-gold2">
                <span className="flex-1">{q}</span>
                <span className="chev flex size-7 shrink-0 items-center justify-center rounded-full border border-white/12 text-gold transition-all group-hover:border-gold/40">
                  <svg className="size-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 1.5v9M1.5 6h9" /></svg>
                </span>
              </summary>
              <p className="pb-6 pr-14 text-[14.5px] leading-[1.85] text-muted" dangerouslySetInnerHTML={{ __html: a }} />
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
