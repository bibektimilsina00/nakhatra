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
          <span className="font-mono text-2xs uppercase tracking-wider text-accent-ink">{m.eyebrow}</span>
          <h2 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">{m.title}</h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted">{m.sub}</p>
        </div>

        {/* gap-px over a lit background draws the rule between them. */}
        <div className="reveal mx-auto grid max-w-5xl gap-px overflow-hidden rounded-lg border border-line-strong bg-line-strong md:grid-cols-2">
          <div className="relative overflow-hidden bg-surface px-8 py-10 sm:px-10">
            <span aria-hidden="true" className="pointer-events-none absolute -right-2 -top-3 select-none text-6xl font-bold leading-none text-ink/[0.04]">गणित</span>
            <div className="relative">
              <div className="font-mono text-2xs uppercase tracking-wider text-accent-ink">{m.ganitaLabel}</div>
              <h3 className="mt-4 font-display text-xl font-bold text-ink">{m.ganitaTitle}</h3>
              <p className="mt-3.5 text-sm leading-relaxed text-muted">{ganitaA}<em className="not-italic font-semibold text-ink">{m.ganitaEm}</em>{ganitaB}</p>
            </div>
          </div>
          <div className="relative overflow-hidden bg-surface px-8 py-10 sm:px-10">
            <span aria-hidden="true" className="pointer-events-none absolute -right-2 -top-3 select-none text-6xl font-bold leading-none text-ink/[0.04]">फलित</span>
            <div className="relative">
              <div className="font-mono text-2xs uppercase tracking-wider text-accent-ink">{m.phalitaLabel}</div>
              <h3 className="mt-4 font-display text-xl font-bold text-ink">{m.phalitaTitle}</h3>
              <p className="mt-3.5 text-sm leading-relaxed text-muted">{phalitaA}<em className="not-italic font-semibold text-ink">{m.phalitaEm}</em>{phalitaB}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
