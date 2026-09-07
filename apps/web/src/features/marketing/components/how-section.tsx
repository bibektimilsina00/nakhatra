"use client";

import { useMarketing } from "@/lib/i18n/language-context";

/**
 * Gaṇita and Phalita — why the maths and the meaning stay apart.
 *
 * Markup is the landing demo's, unchanged.
 */
export function HowSection() {
  const m = useMarketing().how;
  const [ganitaA, ganitaB] = m.ganitaBody.split("{em}");
  const [phalitaA, phalitaB] = m.phalitaBody.split("{em}");

  return (
    <section id="how" className="py-24">
      <div className="mx-auto max-w-[1360px] px-8">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold">{m.eyebrow}</span>
          <h2 className="mt-4 font-disp text-[30px] font-bold leading-[1.12] tracking-[-0.015em] text-paper sm:text-[38px]">{m.title}</h2>
          <p className="mx-auto mt-4 max-w-xl text-[15.5px] leading-[1.7] text-muted">{m.sub}</p>
        </div>

        {/* gap-px over a lit background draws the rule between them. */}
        <div className="reveal mx-auto grid max-w-5xl gap-px overflow-hidden rounded-[8px] bg-white/[0.09] md:grid-cols-2">
          <div className="relative overflow-hidden bg-ink px-8 py-10 sm:px-10">
            <span aria-hidden="true" className="pointer-events-none absolute -right-2 -top-3 select-none text-[76px] font-bold leading-none text-white/[0.035]">गणित</span>
            <div className="relative">
              <div className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-gold">{m.ganitaLabel}</div>
              <h3 className="mt-4 font-disp text-[21px] font-bold text-paper">{m.ganitaTitle}</h3>
              <p className="mt-3.5 text-[14px] leading-[1.8] text-muted">{ganitaA}<em className="not-italic text-paper">{m.ganitaEm}</em>{ganitaB}</p>
            </div>
          </div>
          <div className="relative overflow-hidden bg-ink px-8 py-10 sm:px-10">
            <span aria-hidden="true" className="pointer-events-none absolute -right-2 -top-3 select-none text-[76px] font-bold leading-none text-white/[0.035]">फलित</span>
            <div className="relative">
              <div className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-gold">{m.phalitaLabel}</div>
              <h3 className="mt-4 font-disp text-[21px] font-bold text-paper">{m.phalitaTitle}</h3>
              <p className="mt-3.5 text-[14px] leading-[1.8] text-muted">{phalitaA}<em className="not-italic text-paper">{m.phalitaEm}</em>{phalitaB}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
