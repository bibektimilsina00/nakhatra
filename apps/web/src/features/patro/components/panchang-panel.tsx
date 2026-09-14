"use client";

import {
  AYANA,
  bsMonthName,
  clock,
  dms,
  grahaName,
  karanaName,
  nakName,
  num,
  PAKSHA,
  rituForBsMonth,
  signName,
  tithiName,
  WEEKDAY_FULL,
  yogaName,
} from "@/features/patro/patro-i18n";
import type { PatroDay, PatroElement } from "@/features/patro/types";
import { useTranslation } from "@/lib/i18n/language-context";
import { convertAdToBs } from "@/lib/utils/date-converter";

/** The selected day, read in full — the column a patro prints beside its grid. */
export function PanchangPanel({
  day,
  bsMonth,
  bsYear,
}: {
  day: PatroDay;
  bsMonth: number;
  bsYear: number;
}) {
  const { language } = useTranslation();
  const bs = convertAdToBs(
    Number(day.on.slice(0, 4)),
    Number(day.on.slice(5, 7)),
    Number(day.on.slice(8, 10)),
  );
  void bsMonth;
  void bsYear;

  const en = language === "en";

  return (
    <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
      <section className="rounded-xl border border-line-strong bg-surface p-5">
        <div>
          <h2 className="font-display text-2xl font-bold leading-none text-ink">
            {num(bs.year, language)} {bsMonthName(bs.month, language)} {num(bs.day, language)}
          </h2>
          <p className="mt-1.5 flex items-baseline gap-2.5">
            <span className="text-sm font-semibold text-danger">
              {WEEKDAY_FULL[day.weekday]?.[language] ?? day.weekday}
            </span>
            <span className="text-xs text-dim">{day.on}</span>
          </p>
        </div>

        <dl className="mt-3.5 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-line pt-3.5 text-xs">
          <Rise label={en ? "Sunrise" : "सूर्योदय"} value={clock(day.sunrise, language)} />
          <Rise label={en ? "Sunset" : "सूर्यास्त"} value={clock(day.sunset, language)} />
          <Rise label={en ? "Moonrise" : "चन्द्रोदय"} value={clock(day.moonrise, language)} />
          <Rise label={en ? "Moonset" : "चन्द्रास्त"} value={clock(day.moonset, language)} />
        </dl>

        <div className="mt-3.5 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-3.5 text-sm">
          <Pair k={en ? "Ritu" : "ऋतु"} v={rituForBsMonth(bs.month, language)} />
          <Pair k={en ? "Ayana" : "अयन"} v={AYANA[day.ayana]?.[language] ?? day.ayana} />
          <Pair k={en ? "Moon" : "चन्द्र"} v={signName(day.moon_sign, language)} />
        </div>

        {day.festivals.length > 0 && (
          <p className="mt-3.5 rounded-lg border border-accent/30 bg-accent-wash px-3.5 py-2.5 text-sm font-semibold text-accent-ink">
            {day.festivals.join(" · ")}
          </p>
        )}
      </section>

      <section className="rounded-xl border border-line-strong bg-surface p-5">
        <h3 className="text-base font-semibold text-ink">
          {en ? "Panchang" : "पञ्चाङ्ग विवरण"}
        </h3>
        <dl className="mt-3.5 space-y-3 text-sm">
          <Row k={en ? "Paksha" : "पक्ष"}>
            <span className="text-accent-ink">{PAKSHA[day.paksha]?.[language] ?? day.paksha}</span>
          </Row>
          <Row k={en ? "Tithi" : "तिथि"}>
            <Element el={day.tithi} render={tithiName} />
          </Row>
          <Row k={en ? "Nakshatra" : "नक्षत्र"}>
            <Element el={day.nakshatra} render={nakName} />
          </Row>
          <Row k={en ? "Yoga" : "योग"}>
            <Element el={day.yoga} render={yogaName} />
          </Row>
          <Row k={en ? "Karana" : "करण"}>
            <Element el={day.karana} render={karanaName} />
          </Row>
        </dl>
      </section>

      <section className="rounded-xl border border-line-strong bg-surface p-5">
        <h3 className="text-base font-semibold text-ink">
          {en ? "Graha positions" : "ग्रह गोचर"}
        </h3>
        <div className="mt-3.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {day.grahas.map((g) => (
            <div
              key={g.name}
              className="flex items-baseline justify-between gap-2 rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs"
            >
              <span className="text-muted">
                {grahaName(g.name, language)}
                {g.retrograde && <span className="ml-1 text-retrograde">℞</span>}
              </span>
              <span className="text-right">
                <span className="block font-mono tabular-nums text-ink">
                  {dms(g.degree_in_sign, language)}
                </span>
                <span className="block text-2xs text-dim">{signName(g.sign, language)}</span>
              </span>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}

function Rise({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-2xs text-dim">{label}</dt>
      <dd className="font-mono text-xs tabular-nums text-ink">{value}</dd>
    </div>
  );
}

function Pair({ k, v }: { k: string; v: string }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="text-dim">{k}:</span>
      <span className="font-semibold text-ink">{v}</span>
    </span>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-2 border-b border-dashed border-line/50 pb-2.5 last:border-0">
      <dt className="shrink-0 text-dim">{k}</dt>
      <span className="min-w-3 flex-1" aria-hidden />
      <dd className="text-right leading-snug">{children}</dd>
    </div>
  );
}

/** "Chaturdashi · Amavasya from 10:49" — what is running, and its handover. */
function Element({
  el,
  render,
}: {
  el: PatroElement;
  render: (name: string, lang: "en" | "ne" | "hi") => string;
}) {
  const { language } = useTranslation();
  return (
    <span>
      <span className="font-semibold text-accent-ink">{render(el.name, language)}</span>
      {el.ends_at && el.next_name && (
        <span className="text-muted">
          {" · "}
          {clock(el.ends_at, language)}
          {language === "en" ? " → " : " बाट "}
          <span className="text-ink">{render(el.next_name, language)}</span>
        </span>
      )}
    </span>
  );
}
