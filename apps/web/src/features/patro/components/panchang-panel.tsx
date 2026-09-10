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
      <section className="rounded-[12px] border border-brd bg-card p-5">
        <div>
          <h2 className="font-serif text-[26px] font-bold leading-none text-paper">
            {num(bs.year, language)} {bsMonthName(bs.month, language)} {num(bs.day, language)}
          </h2>
          <p className="mt-1.5 flex items-baseline gap-2.5">
            <span className="text-[14px] font-semibold text-rose-400">
              {WEEKDAY_FULL[day.weekday]?.[language] ?? day.weekday}
            </span>
            <span className="text-[12.5px] text-faint">{day.on}</span>
          </p>
        </div>

        <dl className="mt-3.5 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-brd pt-3.5 text-[12.5px]">
          <Rise label={en ? "Sunrise" : "सूर्योदय"} value={clock(day.sunrise, language)} />
          <Rise label={en ? "Sunset" : "सूर्यास्त"} value={clock(day.sunset, language)} />
          <Rise label={en ? "Moonrise" : "चन्द्रोदय"} value={clock(day.moonrise, language)} />
          <Rise label={en ? "Moonset" : "चन्द्रास्त"} value={clock(day.moonset, language)} />
        </dl>

        <div className="mt-3.5 flex flex-wrap gap-x-5 gap-y-2 border-t border-brd pt-3.5 text-[13px]">
          <Pair k={en ? "Ritu" : "ऋतु"} v={rituForBsMonth(bs.month, language)} />
          <Pair k={en ? "Ayana" : "अयन"} v={AYANA[day.ayana]?.[language] ?? day.ayana} />
          <Pair k={en ? "Moon" : "चन्द्र"} v={signName(day.moon_sign, language)} />
        </div>

        {day.festivals.length > 0 && (
          <p className="mt-3.5 rounded-[8px] border border-gold/30 bg-gold/10 px-3.5 py-2.5 text-[14px] font-semibold text-gold2">
            {day.festivals.join(" · ")}
          </p>
        )}
      </section>

      <section className="rounded-[12px] border border-brd bg-card p-5">
        <h3 className="text-[15px] font-semibold text-paper">
          {en ? "Panchang" : "पञ्चाङ्ग विवरण"}
        </h3>
        <dl className="mt-3.5 space-y-3 text-[14px]">
          <Row k={en ? "Paksha" : "पक्ष"}>
            <span className="text-gold2">{PAKSHA[day.paksha]?.[language] ?? day.paksha}</span>
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

      <section className="rounded-[12px] border border-brd bg-card p-5">
        <h3 className="text-[15px] font-semibold text-paper">
          {en ? "Graha positions" : "ग्रह गोचर"}
        </h3>
        <div className="mt-3.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {day.grahas.map((g) => (
            <div
              key={g.name}
              className="flex items-baseline justify-between gap-2 rounded-[6px] border border-brd bg-ink2 px-2.5 py-1.5 text-[12px]"
            >
              <span className="text-muted">
                {grahaName(g.name, language)}
                {g.retrograde && <span className="ml-1 text-rose-400">℞</span>}
              </span>
              <span className="text-right">
                <span className="block font-mono tabular-nums text-paper">
                  {dms(g.degree_in_sign, language)}
                </span>
                <span className="block text-[11px] text-faint">{signName(g.sign, language)}</span>
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
      <dt className="text-[10.5px] text-faint">{label}</dt>
      <dd className="font-mono text-[13px] tabular-nums text-paper">{value}</dd>
    </div>
  );
}

function Pair({ k, v }: { k: string; v: string }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="text-faint">{k}:</span>
      <span className="font-semibold text-paper">{v}</span>
    </span>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-2 border-b border-dashed border-brd/50 pb-2.5 last:border-0">
      <dt className="shrink-0 text-faint">{k}</dt>
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
      <span className="font-semibold text-gold2">{render(el.name, language)}</span>
      {el.ends_at && el.next_name && (
        <span className="text-muted">
          {" · "}
          {clock(el.ends_at, language)}
          {language === "en" ? " → " : " बाट "}
          <span className="text-paper">{render(el.next_name, language)}</span>
        </span>
      )}
    </span>
  );
}
