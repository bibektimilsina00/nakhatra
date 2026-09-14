"use client";

import Link from "next/link";
import { useState } from "react";

import { RashiGlyph } from "@/features/rasifal/components/rashi-glyph";
import { slugFor } from "@/features/rasifal/signs";

import {
  bandLabel,
  colourName,
  murtiName,
  RASHI_SYLLABLES,
  readingFor,
  SECTION_LABELS,
} from "@/features/rasifal/rasifal-i18n";
import type { RashiDay } from "@/features/rasifal/types";
import { useTranslation } from "@/lib/i18n/language-context";
import { getPlanetName, getSignName, toLocalizedDigit } from "@/lib/i18n/vedic-translations";

/** The four areas of life, in the order a reader wants them. */
const SECTIONS = ["career", "love", "finance", "health"] as const;

/** One sign's day. */
export function RashiCard({ day }: { day: RashiDay }) {
  const { language } = useTranslation();
  const [open, setOpen] = useState(false);

  const tone =
    day.rating >= 4
      ? "border-benefic/30"
      : day.rating <= 2
        ? "border-malefic/30"
        : "border-line-strong";

  return (
    <article className={`flex flex-col rounded-lg border bg-surface p-4 ${tone}`}>
      <header className="flex items-start justify-between gap-3 border-b border-line pb-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-full border border-accent/25 bg-accent-wash text-accent-ink">
            <RashiGlyph index={day.sign_index} className="size-5" />
          </span>
          <div className="min-w-0">
          {/* A link, so each sign's own page is one click and one crawl
              away from the page everyone arrives at. */}
          <h3 className="font-display text-lg font-bold leading-tight text-ink">
            <Link href={`/rasifal/${slugFor(day.sign)}`} className="hover:text-accent-ink">
              {getSignName(day.sign, language)}
            </Link>
          </h3>
            {/* The naming syllables, as a panchanga prints them under the sign. */}
            <p className="mt-0.5 truncate text-xs tracking-wide text-dim">
              {RASHI_SYLLABLES[day.sign_index].join(" ")}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <span
            className="block text-sm leading-none text-star"
            aria-label={`${day.rating} / 5`}
          >
            {"★".repeat(day.rating)}
            <span className="opacity-40">{"☆".repeat(5 - day.rating)}</span>
          </span>
          <span className="mt-1 block text-2xs font-semibold text-muted">
            {bandLabel(day.band ?? "", day.rating, language)}
          </span>
        </div>
      </header>

      {/* The written reading when the writer has been round; the composed one
          from the findings while it has not. Never a blank card. */}
      <p className="mt-3 text-sm leading-relaxed text-ink">
        {day.reading?.summary || readingFor(day, language)}
      </p>

      {day.reading && (
        <dl className="mt-3.5 flex-1 space-y-2.5">
          {SECTIONS.map((key) =>
            day.reading?.[key] ? (
              <div key={key} className="text-sm leading-relaxed">
                <dt className="inline font-semibold text-ink">
                  {SECTION_LABELS[key][language]}
                </dt>
                <dd className="ml-1.5 inline text-muted">{day.reading[key]}</dd>
              </div>
            ) : null,
          )}

          {day.reading.remedy && (
            <div className="rounded-lg border border-accent/25 bg-accent-wash p-2.5 text-sm leading-relaxed">
              <dt className="inline font-semibold text-accent-ink">
                {SECTION_LABELS.remedy[language]}
              </dt>
              <dd className="ml-1.5 inline text-ink">{day.reading.remedy}</dd>
            </div>
          )}
        </dl>
      )}

      <dl className="mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-line pt-3 text-xs">
        <div className="flex items-center gap-1.5">
          <dt className="text-dim">{language === "en" ? "Lucky colour" : "शुभ रङ"}:</dt>
          <dd className="font-semibold text-ink">{colourName(day.lucky_colour, language)}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="text-dim">{language === "en" ? "Lucky number" : "शुभ अंक"}:</dt>
          <dd className="font-semibold text-accent-ink">
            {toLocalizedDigit(String(day.lucky_number), language)}
          </dd>
        </div>

        {/* The working sits on the same line: it is a footnote to these, not
            a section of its own. */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="ml-auto min-h-11 inline-flex items-center cursor-pointer text-xs font-medium text-dim transition hover:text-accent-ink"
        >
          {open
            ? language === "ne"
              ? "गणना लुकाउनुहोस्"
              : language === "hi"
                ? "गणना छिपाएँ"
                : "Hide the working"
            : language === "ne"
              ? "गोचर हेर्नुहोस्"
              : language === "hi"
                ? "गोचर देखें"
                : "See the transits"}
        </button>

      </dl>

      {open && (
        <p className="mt-2.5 text-2xs text-dim">
          {language === "en" ? "Murti" : "मूर्ति"}: {murtiName(day.murti, language)}
        </p>
      )}

      {open && day.reading?.astrological_reason && (
        <p className="mt-2.5 rounded-lg border border-line-strong bg-surface p-3 text-xs leading-relaxed text-muted">
          {day.reading.astrological_reason}
        </p>
      )}

      {open && (
        <ul className="mt-2 space-y-1 rounded-lg border border-line bg-surface p-3">
          {day.transits.map((t) => (
            <li key={t.name} className="flex items-baseline justify-between gap-2 text-2xs">
              <span className="text-muted">
                {getPlanetName(t.name, language)}
                {t.retrograde && <span className="ml-1 text-retrograde">℞</span>}
              </span>
              <span className="text-right">
                <span className="text-dim">
                  {getSignName(t.sign, language)} ·{" "}
                  {language === "en" ? `H${t.house}` : `भाव ${toLocalizedDigit(String(t.house), language)}`}
                </span>
                <span
                  className={`ml-2 font-semibold ${
                    t.obstructed ? "text-accent-ink" : t.favourable ? "text-benefic" : "text-malefic"
                  }`}
                >
                  {t.obstructed
                    ? language === "en" ? "blocked" : "वेध"
                    : t.favourable
                      ? language === "en" ? "good" : "शुभ"
                      : language === "en" ? "weak" : "अशुभ"}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
