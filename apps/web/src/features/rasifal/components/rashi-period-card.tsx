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
      ? "border-benefic/30"
      : period.rating <= 2
        ? "border-malefic/30"
        : "border-line-strong";

  return (
    <article className={`flex flex-col rounded-lg border bg-surface p-5 ${tone}`}>
      <header className="flex items-start justify-between gap-3 border-b border-line pb-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-full border border-accent/25 bg-accent-wash text-accent-ink">
            <RashiGlyph index={period.sign_index} className="size-5" />
          </span>
          <div className="min-w-0">
          <h3 className="font-display text-lg font-bold leading-tight text-ink">
            {getSignName(period.sign, language)}
          </h3>
            <p className="mt-0.5 truncate text-xs tracking-wide text-dim">
              {RASHI_SYLLABLES[period.sign_index].join(" ")}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <span className="block text-sm leading-none text-star" aria-hidden>
            {"★".repeat(period.rating)}
            <span className="text-dim">{"☆".repeat(5 - period.rating)}</span>
          </span>
          <span className="mt-1 block text-2xs font-semibold text-muted">
            {bandLabel(period.band ?? "", period.rating, language)}
          </span>
        </div>
      </header>

      <p className="mt-3 flex-1 text-sm leading-relaxed text-ink">
        {periodReadingFor(period, span, language)}
      </p>

      {/* The dates are the reason to read a span at all. */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-success/30 bg-success-tint px-3 py-2">
          <p className="text-2xs font-semibold uppercase tracking-wider text-success-ink">
            {language === "ne" ? "उत्तम दिन" : language === "hi" ? "सर्वोत्तम दिन" : "Best day"}
          </p>
          <p className="mt-0.5 font-mono text-2xs tabular-nums text-ink">
            {formatDateFor(period.best_date, language)}
          </p>
        </div>
        <div className="rounded-lg border border-danger/30 bg-danger-tint px-3 py-2">
          <p className="text-2xs font-semibold uppercase tracking-wider text-danger-ink">
            {language === "ne" ? "सतर्क दिन" : language === "hi" ? "सतर्क दिन" : "Take care"}
          </p>
          <p className="mt-0.5 font-mono text-2xs tabular-nums text-ink">
            {formatDateFor(period.hardest_date, language)}
          </p>
        </div>
      </div>

      <dl className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-line pt-3 text-xs">
        <div className="flex items-center gap-1.5">
          <dt className="text-dim">{language === "en" ? "Lucky colour" : "शुभ रङ"}:</dt>
          <dd className="font-semibold text-ink">{colourName(period.lucky_colour, language)}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="text-dim">{language === "en" ? "Lucky number" : "शुभ अंक"}:</dt>
          <dd className="font-semibold text-accent-ink">
            {toLocalizedDigit(String(period.lucky_number), language)}
          </dd>
        </div>
      </dl>
    </article>
  );
}
