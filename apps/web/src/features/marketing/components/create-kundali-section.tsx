"use client";

import { KundaliPanel } from "@/features/kundali/components/kundali-panel";
import { useLatinTracking, useMarketing } from "@/lib/i18n/language-context";

/**
 * Casting a chart is the first thing the site should let you do, so it sits
 * directly under the hero.
 *
 * The form itself is the app's own `KundaliPanel` — the real BS/AD date
 * picker, time picker, place lookup and accuracy control, posting to the
 * real endpoint. The marketing page frames it; it does not reimplement it.
 */
export function CreateKundaliSection() {
  const m = useMarketing().begin;
  const eyebrow = useLatinTracking("uppercase tracking-[0.22em]");
  const label = useLatinTracking("uppercase tracking-[0.2em]");

  return (
    <section id="form" className="scroll-mt-24 py-24">
      <div className="mx-auto grid max-w-[1360px] items-start gap-14 px-8 lg:grid-cols-2 lg:gap-20">
        <div>
          <span className={`font-mono text-2xs text-accent-ink ${eyebrow}`}>{m.eyebrow}</span>
          <h2 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
            {m.title}
          </h2>
          <p className="mt-5 max-w-lg text-sm leading-relaxed text-muted">
            {m.body}
          </p>

          <div className="mt-10">
            <div className={`font-mono text-2xs text-accent-ink ${label}`}>{m.thenLabel}</div>
            <ul className="mt-3 max-w-lg border-t border-line">
              {m.steps.map((step, i) => (
                <li key={step.title} className="flex gap-4 border-b border-line py-4 last:border-0">
                  <span className="mt-px font-mono text-2xs tabular-nums text-accent-ink">{String(i + 1).padStart(2, "0")}</span>
                  <span>
                    <span className="block text-xs font-medium text-ink">{step.title}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-dim">{step.body}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <dl className="mt-9 max-w-lg border-t border-line text-xs">
            {m.checks.map((line) => (
              <div key={line} className="flex items-baseline gap-3 border-b border-line py-3.5">
                <span className="text-accent-ink">✓</span>
                <span className="text-muted">{line}</span>
              </div>
            ))}
          </dl>

          <p className="mt-6 max-w-lg text-xs leading-relaxed text-dim">
            {m.zoneNoteA}<span className="font-mono text-muted">Asia/Kathmandu</span>{m.zoneNoteB}
            <a href="#accuracy" className="underline decoration-line-strong underline-offset-4 transition-colors hover:text-accent-ink">
              {m.zoneLink}
            </a>.
          </p>
        </div>

        <div className="lg:pt-2">
          <KundaliPanel redirectOnCreate />
        </div>
      </div>
    </section>
  );
}
