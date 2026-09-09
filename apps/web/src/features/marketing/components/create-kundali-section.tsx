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
          <span className={`font-mono text-[11px] text-gold ${eyebrow}`}>{m.eyebrow}</span>
          <h2 className="mt-4 font-disp text-[30px] font-bold leading-[1.12] tracking-[-0.015em] text-paper sm:text-[38px]">
            {m.title}
          </h2>
          <p className="mt-5 max-w-lg text-[15px] leading-[1.85] text-muted">
            {m.body}
          </p>

          <div className="mt-10">
            <div className={`font-mono text-[10px] text-gold ${label}`}>{m.thenLabel}</div>
            <ul className="mt-3 max-w-lg border-t border-brd">
              {m.steps.map((step, i) => (
                <li key={step.title} className="flex gap-4 border-b border-brd py-4 last:border-0">
                  <span className="mt-px font-mono text-[11px] tabular-nums text-gold">{String(i + 1).padStart(2, "0")}</span>
                  <span>
                    <span className="block text-[13.5px] font-medium text-paper">{step.title}</span>
                    <span className="mt-1 block text-[13px] leading-[1.65] text-faint">{step.body}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <dl className="mt-9 max-w-lg border-t border-brd text-[14px]">
            {m.checks.map((line) => (
              <div key={line} className="flex items-baseline gap-3 border-b border-brd py-3.5">
                <span className="text-gold">✓</span>
                <span className="text-muted">{line}</span>
              </div>
            ))}
          </dl>

          <p className="mt-6 max-w-lg text-[12.5px] leading-[1.65] text-faint">
            {m.zoneNoteA}<span className="font-mono text-muted">Asia/Kathmandu</span>{m.zoneNoteB}
            <a href="#accuracy" className="underline decoration-white/25 underline-offset-4 transition-colors hover:text-gold">
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
