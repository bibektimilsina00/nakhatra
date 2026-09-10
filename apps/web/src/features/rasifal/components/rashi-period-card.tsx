"use client";

import {
  colourName,
  periodReadingFor,
  RASHI_SYLLABLES,
  bandLabel,
} from "@/features/rasifal/rasifal-i18n";
import type { RashiPeriod } from "@/features/rasifal/types";
import { RashiGlyph } from "@/features/rasifal/components/rashi-glyph";
import { useTranslation } from "@/lib/i18n/language-context";
import { getSignName, toLocalizedDigit } from "@/lib/i18n/vedic-translations";
import { formatDateFor } from "@/lib/utils/date-converter";

/** One sign across a week or a month. */
export function RashiPeriodCard({
  period,
  span,
}: {
  period: RashiPeriod;
  span: "weekly" | "monthly";
}) {
  const { language } = useTranslation();

  const tone =
    period.rating >= 4
      ? "border-emerald-400/30"
      : period.rating <= 2
        ? "border-rose-400/30"
        : "border-brd";

  return (
    <article className={`flex flex-col rounded-[12px] border bg-card p-5 ${tone}`}>
      <header className="flex items-start justify-between gap-3 border-b border-brd pb-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-full border border-gold/25 bg-gradient-to-br from-gold/[0.18] to-gold/[0.04] text-gold shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <RashiGlyph index={period.sign_index} className="size-[22px]" />
          </span>
          <div className="min-w-0">
          <h3 className="font-serif text-[17px] font-bold leading-tight text-paper">
            {getSignName(period.sign, language)}
          </h3>
            <p className="mt-0.5 truncate text-[11.5px] tracking-wide text-faint">
              {RASHI_SYLLABLES[period.sign_index].join(" ")}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <span className="block text-[13px] leading-none text-gold" aria-hidden>
            {"★".repeat(period.rating)}
            <span className="text-faint/50">{"☆".repeat(5 - period.rating)}</span>
          </span>
          <span className="mt-1 block text-[10px] font-semibold text-muted">
            {bandLabel(period.band ?? "", period.rating, language)}
          </span>
        </div>
      </header>

      <p className="mt-3 flex-1 text-[14px] leading-[1.75] text-paper/90">
        {periodReadingFor(period, span, language)}
      </p>

      {/* The dates are the reason to read a span at all. */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-[8px] border border-emerald-400/25 bg-emerald-500/[0.07] px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
            {language === "ne" ? "उत्तम दिन" : language === "hi" ? "सर्वोत्तम दिन" : "Best day"}
          </p>
          <p className="mt-0.5 font-mono text-[11px] tabular-nums text-paper">
            {formatDateFor(period.best_date, language)}
          </p>
        </div>
        <div className="rounded-[8px] border border-rose-400/25 bg-rose-500/[0.07] px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-400">
            {language === "ne" ? "सतर्क दिन" : language === "hi" ? "सतर्क दिन" : "Take care"}
          </p>
          <p className="mt-0.5 font-mono text-[11px] tabular-nums text-paper">
            {formatDateFor(period.hardest_date, language)}
          </p>
        </div>
      </div>

      <dl className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-brd pt-3 text-[11.5px]">
        <div className="flex items-center gap-1.5">
          <dt className="text-faint">{language === "en" ? "Lucky colour" : "शुभ रङ"}:</dt>
          <dd className="font-semibold text-paper">{colourName(period.lucky_colour, language)}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="text-faint">{language === "en" ? "Lucky number" : "शुभ अंक"}:</dt>
          <dd className="font-semibold text-gold2">
            {toLocalizedDigit(String(period.lucky_number), language)}
          </dd>
        </div>
      </dl>
    </article>
  );
}
