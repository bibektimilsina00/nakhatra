"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { PanchangPanel } from "@/features/patro/components/panchang-panel";
import { usePatro } from "@/features/patro/hooks/use-patro";
import { bsMonthName, num, PAKSHA, WEEKDAY_SHORT } from "@/features/patro/patro-i18n";
import { SiteFooter } from "@/features/marketing/components/site-footer";
import { SiteHeader } from "@/features/marketing/components/site-header";
import { useTranslation } from "@/lib/i18n/language-context";
import { tithiName } from "@/features/patro/patro-i18n";
import {
  convertAdToBs,
  convertBsToAd,
  getDaysInBsMonth,
} from "@/lib/utils/date-converter";

/**
 * नेपाली पात्रो.
 *
 * The month grid is Bikram Sambat, which is a published table rather than
 * something the sky knows — so it is built here, where the converter already
 * lives, and the server is asked only for the panchang of the days it spans.
 * Each cell carries its tithi and any festival; the panel beside it reads the
 * selected day in full.
 */
export function PatroPage() {
  const { language } = useTranslation();

  const todayBs = useMemo(() => {
    const now = new Date();
    // Nepal's own day, not the browser's.
    const nep = new Date(now.getTime() + (5 * 60 + 45) * 60000 + now.getTimezoneOffset() * 60000);
    return convertAdToBs(nep.getFullYear(), nep.getMonth() + 1, nep.getDate());
  }, []);

  const [bsYear, setBsYear] = useState(todayBs.year);
  const [bsMonth, setBsMonth] = useState(todayBs.month);
  const [selected, setSelected] = useState<string | null>(null);

  const daysInMonth = getDaysInBsMonth(bsYear, bsMonth);
  const first = convertBsToAd(bsYear, bsMonth, 1);
  const leading = new Date(first.iso + "T12:00:00").getDay(); // Sunday = 0

  const { data, isPending } = usePatro(first.iso, daysInMonth);

  const byDate = useMemo(
    () => new Map((data?.days ?? []).map((d) => [d.on, d])),
    [data],
  );

  const todayIso = useMemo(() => convertBsToAd(todayBs.year, todayBs.month, todayBs.day).iso, [todayBs]);
  const activeIso = selected ?? (byDate.has(todayIso) ? todayIso : first.iso);
  const active = byDate.get(activeIso);

  const step = (by: number) => {
    let m = bsMonth + by;
    let y = bsYear;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setBsYear(y);
    setBsMonth(m);
    setSelected(null);
  };

  const goToday = () => {
    setBsYear(todayBs.year);
    setBsMonth(todayBs.month);
    setSelected(null);
  };

  return (
    <div className="min-h-dvh bg-ink font-sys antialiased">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1280px] px-5 pb-24 pt-28 sm:px-8 sm:pt-32">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
              {language === "en" ? "Panchang" : "पञ्चाङ्ग"}
            </span>
            <h1 className="mt-2 font-serif text-[30px] font-bold leading-tight text-paper sm:text-[38px]">
              {language === "en" ? "Nepali Patro" : "नेपाली पात्रो"}
            </h1>
            <p className="mt-2 text-[14px] text-muted">
              {language === "ne"
                ? "निरयण (लाहिरी) गणनामा आधारित — तिथि सूर्योदयको समयमा पढिएको।"
                : language === "hi"
                  ? "निरयण (लाहिरी) गणना पर आधारित — तिथि सूर्योदय पर पढ़ी गई।"
                  : "Sidereal (Lahiri) throughout — each tithi read at that day's sunrise."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous month"
              className="grid size-9 cursor-pointer place-items-center rounded-[8px] border border-brd text-muted transition hover:border-gold/50 hover:text-paper"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="min-w-[9rem] rounded-[8px] border border-brd bg-card px-4 py-2 text-center font-serif text-[15px] font-bold text-paper">
              {bsMonthName(bsMonth, language)} {num(bsYear, language)}
            </span>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next month"
              className="grid size-9 cursor-pointer place-items-center rounded-[8px] border border-brd text-muted transition hover:border-gold/50 hover:text-paper"
            >
              <ChevronRight className="size-4" />
            </button>
            <button
              type="button"
              onClick={goToday}
              className="cursor-pointer rounded-[8px] border border-gold/50 px-3 py-2 text-[12.5px] font-medium text-gold2 transition hover:bg-gold/10"
            >
              {language === "en" ? "Today" : "आज"}
            </button>
          </div>
        </header>

        <div className="mt-7 grid gap-5 lg:grid-cols-[1fr_380px]">
          {/* The month */}
          <section className="rounded-[12px] border border-brd bg-card p-4 sm:p-5">
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {WEEKDAY_SHORT[language].map((w, i) => (
                <div
                  key={w}
                  className={`pb-2 text-center text-[11px] font-semibold ${
                    i === 6 ? "text-rose-400" : "text-muted"
                  }`}
                >
                  {w}
                </div>
              ))}

              {Array.from({ length: leading }).map((_, i) => (
                <div key={`pad-${i}`} className="rounded-[8px] border border-brd/40" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const bsDay = i + 1;
                const ad = convertBsToAd(bsYear, bsMonth, bsDay);
                const day = byDate.get(ad.iso);
                const isToday = ad.iso === todayIso;
                const isActive = ad.iso === activeIso;
                const saturday = new Date(ad.iso + "T12:00:00").getDay() === 6;
                const festival = day?.festivals[0];

                return (
                  <button
                    key={ad.iso}
                    type="button"
                    onClick={() => setSelected(ad.iso)}
                    className={`flex min-h-[86px] cursor-pointer flex-col justify-between rounded-[8px] border p-2 text-left transition ${
                      isActive
                        ? "border-gold bg-gold/10"
                        : isToday
                          ? "border-gold/50"
                          : "border-brd hover:border-gold/40"
                    }`}
                  >
                    <span className="block truncate text-[9.5px] leading-tight text-muted">
                      {day
                        ? `${PAKSHA[day.paksha]?.[language] ?? ""} ${tithiName(day.tithi.name, language)}`.trim()
                        : ""}
                    </span>
                    <span
                      className={`block text-center font-serif text-[20px] font-bold leading-none ${
                        saturday || festival ? "text-rose-400" : "text-paper"
                      }`}
                    >
                      {num(bsDay, language)}
                    </span>
                    <span className="flex items-end justify-between gap-1">
                      <span className="min-w-0 truncate text-[8.5px] leading-tight text-gold2">
                        {festival ?? ""}
                      </span>
                      <span className="shrink-0 text-[9px] text-faint">
                        {new Date(ad.iso + "T12:00:00").getDate()}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {isPending && (
              <p className="mt-4 text-center text-[12px] text-muted">
                {language === "en" ? "Reading the sky…" : "आकाश पढ्दै…"}
              </p>
            )}
          </section>

          {active && <PanchangPanel day={active} bsMonth={bsMonth} bsYear={bsYear} />}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
