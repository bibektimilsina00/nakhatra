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
      ? "border-emerald-400/30"
      : day.rating <= 2
        ? "border-rose-400/30"
        : "border-brd";

  return (
    <article className={`flex flex-col rounded-[12px] border bg-card p-4.5 ${tone}`}>
      <header className="flex items-start justify-between gap-3 border-b border-brd pb-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-full border border-gold/25 bg-gradient-to-br from-gold/[0.18] to-gold/[0.04] text-gold shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <RashiGlyph index={day.sign_index} className="size-[22px]" />
          </span>
          <div className="min-w-0">
          {/* A link, so each sign's own page is one click and one crawl
              away from the page everyone arrives at. */}
          <h3 className="font-serif text-[17px] font-bold leading-tight text-paper">
            <Link href={`/rasifal/${slugFor(day.sign)}`} className="hover:text-gold2">
              {getSignName(day.sign, language)}
            </Link>
          </h3>
            {/* The naming syllables, as a panchanga prints them under the sign. */}
            <p className="mt-0.5 truncate text-[11.5px] tracking-wide text-faint">
              {RASHI_SYLLABLES[day.sign_index].join(" ")}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <span
            className="block text-[14px] leading-none text-gold"
            aria-label={`${day.rating} / 5`}
          >
            {"★".repeat(day.rating)}
            <span className="text-faint/50">{"☆".repeat(5 - day.rating)}</span>
          </span>
          <span className="mt-1 block text-[11px] font-semibold text-muted">
            {bandLabel(day.band ?? "", day.rating, language)}
          </span>
        </div>
      </header>

      {/* The written reading when the writer has been round; the composed one
          from the findings while it has not. Never a blank card. */}
      <p className="mt-3 text-[14px] leading-[1.75] text-paper/90">
        {day.reading?.summary || readingFor(day, language)}
      </p>

      {day.reading && (
        <dl className="mt-3.5 flex-1 space-y-2.5">
          {SECTIONS.map((key) =>
            day.reading?.[key] ? (
              <div key={key} className="text-[13px] leading-[1.6]">
                <dt className="inline font-semibold text-paper">
                  {SECTION_LABELS[key][language]}
                </dt>
                <dd className="ml-1.5 inline text-muted">{day.reading[key]}</dd>
              </div>
            ) : null,
          )}

          {day.reading.remedy && (
            <div className="rounded-[8px] border border-gold/25 bg-gold/[0.06] p-2.5 text-[13px] leading-[1.6]">
              <dt className="inline font-semibold text-gold2">
                {SECTION_LABELS.remedy[language]}
              </dt>
              <dd className="ml-1.5 inline text-paper/90">{day.reading.remedy}</dd>
            </div>
          )}
        </dl>
      )}

      <dl className="mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-brd pt-3 text-[12.5px]">
        <div className="flex items-center gap-1.5">
          <dt className="text-faint">{language === "en" ? "Lucky colour" : "शुभ रङ"}:</dt>
          <dd className="font-semibold text-paper">{colourName(day.lucky_colour, language)}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="text-faint">{language === "en" ? "Lucky number" : "शुभ अंक"}:</dt>
          <dd className="font-semibold text-gold2">
            {toLocalizedDigit(String(day.lucky_number), language)}
          </dd>
        </div>

        {/* The working sits on the same line: it is a footnote to these, not
            a section of its own. */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="ml-auto cursor-pointer text-[11.5px] font-medium text-faint transition hover:text-gold2"
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
        <p className="mt-2.5 text-[10.5px] text-faint/70">
          {language === "en" ? "Murti" : "मूर्ति"}: {murtiName(day.murti, language)}
        </p>
      )}

      {open && day.reading?.astrological_reason && (
        <p className="mt-2.5 rounded-[8px] border border-brd bg-ink2 p-3 text-[11.5px] leading-[1.75] text-muted">
          {day.reading.astrological_reason}
        </p>
      )}

      {open && (
        <ul className="mt-2 space-y-1 rounded-[8px] border border-brd bg-ink2 p-3">
          {day.transits.map((t) => (
            <li key={t.name} className="flex items-baseline justify-between gap-2 text-[11px]">
              <span className="text-muted">
                {getPlanetName(t.name, language)}
                {t.retrograde && <span className="ml-1 text-rose-400">℞</span>}
              </span>
              <span className="text-right">
                <span className="text-faint">
                  {getSignName(t.sign, language)} ·{" "}
                  {language === "en" ? `H${t.house}` : `भाव ${toLocalizedDigit(String(t.house), language)}`}
                </span>
                <span
                  className={`ml-2 font-semibold ${
                    t.obstructed ? "text-gold2" : t.favourable ? "text-emerald-400" : "text-rose-400"
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
