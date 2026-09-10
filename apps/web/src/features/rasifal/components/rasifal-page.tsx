"use client";

import { useMemo, useState } from "react";

import { SiteFooter } from "@/features/marketing/components/site-footer";
import { SiteHeader } from "@/features/marketing/components/site-header";
import { RashiCard } from "@/features/rasifal/components/rashi-card";
import { RashiPeriodCard } from "@/features/rasifal/components/rashi-period-card";
import { spanLabel } from "@/features/rasifal/rasifal-i18n";
import type { Span } from "@/features/rasifal/types";
import { useRasifal, useRasifalPeriod } from "@/features/rasifal/hooks/use-rasifal";
import { useTranslation } from "@/lib/i18n/language-context";
import { formatDateFor } from "@/lib/utils/date-converter";

/**
 * Aajako Rasifal.
 *
 * Twelve readings of one sky. The engine judges each sign by gochara from
 * that rashi — murti nirnaya, the transit houses, and vedha — and the text is
 * composed here from those findings, so every sentence traces to something
 * calculated rather than to a model's imagination.
 */
export function RasifalPage() {
  const { language } = useTranslation();
  const [offset, setOffset] = useState(0);
  const [span, setSpan] = useState<Span>("daily");

  // Dates are formed in Nepal's own day, not the browser's: a reader in
  // Sydney asking for "today" means today in Kathmandu.
  const iso = useMemo(() => {
    if (offset === 0) return undefined;
    const now = new Date();
    const nepal = new Date(now.getTime() + (5 * 60 + 45) * 60000 + now.getTimezoneOffset() * 60000);
    nepal.setDate(nepal.getDate() + offset);
    return nepal.toISOString().slice(0, 10);
  }, [offset]);

  const daily = useRasifal(span === "daily" ? iso : undefined, language);
  const period = useRasifalPeriod(
    span === "daily" ? "weekly" : span,
    iso,
    span !== "daily",
  );

  // One set of flags, whichever span is showing.
  const active = span === "daily" ? daily : period;
  const { isPending, isError, refetch } = active;
  const data = daily.data;

  // The heading follows the tab: a page titled "today's rasifal" while
  // showing the month is lying about what the reader is looking at.
  const title =
    span === "daily"
      ? language === "ne" ? "आजको राशिफल" : language === "hi" ? "आज का राशिफल" : "Today's Rasifal"
      : span === "weekly"
        ? language === "ne" ? "साप्ताहिक राशिफल" : language === "hi" ? "साप्ताहिक राशिफल" : "Weekly Rasifal"
        : language === "ne" ? "मासिक राशिफल" : language === "hi" ? "मासिक राशिफल" : "Monthly Rasifal";

  const sub =
    span === "daily"
      ? language === "ne"
        ? "नेपालकै समयमा गोचर गणना गरी बनाइएको — बाह्रै राशिको दैनिक फल।"
        : language === "hi"
          ? "नेपाल के समय पर गोचर गणना से बना — बारहों राशियों का दैनिक फल।"
          : "Computed by gochara in Nepal's own time — the day for all twelve signs."
      : language === "ne"
        ? "अवधिभरका हरेक दिन गणना गरी निकालिएको — कुन ग्रह टिक्छ र कुन दिन उत्तम, दुवै।"
        : language === "hi"
          ? "अवधि के हर दिन की गणना से निकाला गया — कौन सा ग्रह टिकता है और कौन सा दिन उत्तम, दोनों।"
          : "Aggregated from every day in the span — which grahas hold, and which days stand out.";

  const dayLabel = (n: number) =>
    n === 0
      ? language === "ne" ? "आज" : language === "hi" ? "आज" : "Today"
      : n === -1
        ? language === "ne" ? "हिजो" : language === "hi" ? "कल" : "Yesterday"
        : language === "ne" ? "भोलि" : language === "hi" ? "कल" : "Tomorrow";

  return (
    // Reached from the marketing nav, so it wears the marketing site: same
    // header, same footer, same ink. A visitor who has not signed up should
    // not be dropped into the dashboard's furniture.
    <div className="min-h-dvh bg-ink font-sys antialiased">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1180px] px-5 pb-24 pt-28 sm:px-8 sm:pt-32">
        <header className="max-w-2xl">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
            {language === "en" ? "Gochara" : "गोचर"}
          </span>
          <h1 className="mt-3 font-serif text-[30px] font-bold leading-tight text-paper sm:text-[40px]">
            {title}
          </h1>
          <p className="mt-3 text-[15px] leading-[1.75] text-muted">{sub}</p>
        </header>

        <div className="mt-6 flex flex-wrap items-center gap-1.5 rounded-full border border-brd bg-card p-1 sm:w-fit">
          {(["daily", "weekly", "monthly"] as Span[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpan(s)}
              className={`cursor-pointer rounded-full px-4 py-1.5 text-[12.5px] font-medium transition ${
                span === s ? "bg-gold text-ink" : "text-muted hover:text-paper"
              }`}
            >
              {spanLabel(s, language)}
            </button>
          ))}
        </div>

        <div className={`mt-4 flex-wrap items-center gap-2 ${span === "daily" ? "flex" : "hidden"}`}>
          {[-1, 0, 1].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setOffset(n)}
              className={`cursor-pointer rounded-full border px-4 py-1.5 text-[12.5px] font-medium transition ${
                offset === n
                  ? "border-gold bg-gold text-ink"
                  : "border-brd text-muted hover:border-gold/50 hover:text-paper"
              }`}
            >
              {dayLabel(n)}
            </button>
          ))}
          {data && (
            <span className="ml-1 text-[12px] text-muted">
              {formatDateFor(data.for_date, language)}
            </span>
          )}
        </div>

        {isPending && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="h-[230px] animate-pulse rounded-[12px] border border-brd bg-card"
              />
            ))}
          </div>
        )}

        {isError && (
          <div className="mt-8 rounded-[12px] border border-brd bg-card p-6 text-center">
            <p className="text-[13.5px] text-muted">
              {language === "ne"
                ? "राशिफल ल्याउन सकिएन।"
                : language === "hi"
                  ? "राशिफल नहीं लाया जा सका।"
                  : "The rasifal could not be loaded."}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-3 cursor-pointer rounded-[8px] border border-brd px-4 py-2 text-[12.5px] font-medium text-muted transition hover:border-gold/50 hover:text-paper"
            >
              {language === "ne" ? "फेरि प्रयास" : language === "hi" ? "पुनः प्रयास" : "Try again"}
            </button>
          </div>
        )}

        {span !== "daily" && period.data && (
          <p className="mt-4 text-[12px] text-muted">
            {formatDateFor(period.data.start, language)} — {formatDateFor(period.data.end, language)}
          </p>
        )}

        {((span === "daily" && data) || (span !== "daily" && period.data)) && (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {span === "daily"
                ? data?.signs.map((day) => <RashiCard key={day.sign} day={day} />)
                : period.data?.signs.map((p) => (
                    <RashiPeriodCard key={p.sign} period={p} span={span} />
                  ))}
            </div>

            {/* What produced these, said plainly — the reference sites explain
                their method, and this one actually has one. */}
            <section className="mt-8 rounded-[12px] border border-brd bg-card p-5">
              <h2 className="text-[13px] font-semibold text-paper">
                {language === "ne"
                  ? "यो राशिफल कसरी गणना गरिएको हो?"
                  : language === "hi"
                    ? "यह राशिफल कैसे गणना किया गया है?"
                    : "How this rasifal is calculated"}
              </h2>
              <p className="mt-2 text-[12.5px] leading-[1.8] text-muted">
                {language === "ne"
                  ? "हरेक राशिका लागि आजका नौ ग्रह त्यही राशिबाट भाव गन्ती गरी राखिन्छ। शास्त्रीय गोचर तालिकाअनुसार कुन ग्रह अनुकूल छ हेरिन्छ, वेध (अवरोध) जाँचिन्छ — अनुकूल ग्रह पनि वेधले रोक्छ — र चन्द्रमाको भावले मूर्ति निर्णय (स्वर्ण, रजत, ताम्र, लोह) तय गर्छ। लाहिरी अयनांश, नेपालकै समय। कुनै पनि वाक्य अनुमानले लेखिएको छैन।"
                  : language === "hi"
                    ? "प्रत्येक राशि के लिए आज के नौ ग्रह उसी राशि से भाव गिनकर रखे जाते हैं। शास्त्रीय गोचर तालिका से अनुकूलता देखी जाती है, वेध जाँचा जाता है — अनुकूल ग्रह भी वेध से रुकता है — और चंद्रमा का भाव मूर्ति निर्णय (स्वर्ण, रजत, ताम्र, लोह) तय करता है। लाहिरी अयनांश, नेपाल का समय।"
                    : "For each sign, today's nine grahas are placed in houses counted from that rashi. Each is weighed against the classical gochara table, vedha is checked — a favourable graha blocked in its vedha house does not deliver — and the Moon's house sets the murti (Swarna, Rajata, Tamra, Loha). Lahiri ayanamsa, Nepal's own time. No sentence here is guessed."}
              </p>
            </section>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
