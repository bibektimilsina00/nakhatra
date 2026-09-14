import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";

import { JsonLd } from "@/components/seo/json-ld";
import { SiteFooter } from "@/features/marketing/components/site-footer";
import { SiteHeader } from "@/features/marketing/components/site-header";
import { bsMonthName, num, WEEKDAY_FULL } from "@/features/patro/patro-i18n";
import { RashiGlyph } from "@/features/rasifal/components/rashi-glyph";
import {
  bandLabel,
  colourName,
  murtiName,
  RASHI_SYLLABLES,
  readingFor,
  SECTION_LABELS,
} from "@/features/rasifal/rasifal-i18n";
import { routeForSlug, SIGN_ROUTES, type SignRoute } from "@/features/rasifal/signs";
import type { Rasifal, RashiDay } from "@/features/rasifal/types";
import { API_URL } from "@/lib/api/proxy";
import { getPlanetName, getSignName, toLocalizedDigit } from "@/lib/i18n/vedic-translations";
import { breadcrumbLd, graph, rasifalArticleLd } from "@/lib/seo/structured-data";
import { convertAdToBs } from "@/lib/utils/date-converter";

/**
 * One sign's day, at its own address.
 *
 * "मेष राशिफल" is its own search, and a search wants a page about exactly
 * that — not the twelve-card page with the answer a third of the way down.
 * So each sign gets a URL, rendered on the server with the whole reading in
 * the HTML, because a crawler reads what arrives and not what a hook fetches
 * afterwards.
 *
 * Rebuilt every half hour: the API writes a new day a little before two in
 * the morning, and a page that is at most thirty minutes behind it is a page
 * served from cache to everyone else.
 *
 * Rendered on first request, not at build. `generateStaticParams` would have
 * the twelve pages prerendered on the CI runner, where there is no API to
 * ask — the build failed on exactly that. Without it the first visitor to a
 * sign after a deploy waits for one render and everyone after is cached.
 */

export const revalidate = 1800;
export const dynamicParams = true;

const LANG = "ne" as const;
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SECTIONS = ["career", "love", "finance", "health"] as const;

async function fetchDay(): Promise<Rasifal> {
  const res = await fetch(`${API_URL}/v1/rasifal?language=${LANG}`, {
    next: { revalidate },
  });
  if (!res.ok) throw new Error(`rasifal ${res.status}`);
  return (await res.json()) as Rasifal;
}

function dateLine(iso: string) {
  const bs = convertAdToBs(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)), Number(iso.slice(8, 10)));
  const weekday = WEEKDAY_FULL[WEEKDAYS[new Date(iso + "T12:00:00").getDay()]][LANG];
  return `${num(bs.year, LANG)} ${bsMonthName(bs.month, LANG)} ${num(bs.day, LANG)} गते, ${weekday}`;
}

/** The searches this page answers, all in the one title. */
const titleFor = (r: SignRoute) =>
  `${getSignName(r.sign, LANG)} राशिफल आज · ${r.roman} Rashifal Today · ${r.sign} Horoscope Nepali`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sign: string }>;
}): Promise<Metadata> {
  const { sign } = await params;
  const route = routeForSlug(sign);
  if (!route) return {};

  const data = await fetchDay().catch(() => null);
  const day = data?.signs.find((s) => s.sign === route.sign);
  const verdict = day ? bandLabel(day.band ?? "", day.rating, LANG) : "";
  const summary = day ? (day.reading?.summary || readingFor(day, LANG)).slice(0, 150) : "";

  const description = data
    ? `${getSignName(route.sign, LANG)} राशिको आजको राशिफल — ${dateLine(data.for_date)}। ${verdict}। ${summary}`
    : `${getSignName(route.sign, LANG)} राशिको आजको राशिफल — ${route.roman} rashifal today, computed by gochara from Nepal's own time.`;

  return {
    title: titleFor(route),
    description,
    alternates: { canonical: `/rasifal/${route.slug}` },
    openGraph: {
      title: titleFor(route),
      description,
      url: `/rasifal/${route.slug}`,
      type: "article",
      locale: "ne_NP",
      ...(data ? { publishedTime: data.for_date } : {}),
    },
  };
}

export default async function SignPage({ params }: { params: Promise<{ sign: string }> }) {
  const { sign } = await params;
  const route = routeForSlug(sign);
  if (!route) notFound();
  // "aries", "vrishabha", "meena" — every spelling, one page. A permanent
  // redirect is how the aliases pass their weight to it instead of
  // competing with it.
  if (route.slug !== sign.toLowerCase()) permanentRedirect(`/rasifal/${route.slug}`);

  const data = await fetchDay();
  const day = data.signs.find((s) => s.sign === route.sign) as RashiDay;
  const name = getSignName(route.sign, LANG);
  const when = dateLine(data.for_date);
  const summary = day.reading?.summary || readingFor(day, LANG);
  const path = `/rasifal/${route.slug}`;

  return (
    <div className="min-h-dvh bg-cream font-body text-ink antialiased">
      <JsonLd
        json={graph([
          breadcrumbLd([
            { name: "Nakhatra", path: "/" },
            { name: "आजको राशिफल", path: "/rasifal" },
            { name: `${name} राशिफल`, path },
          ]),
          rasifalArticleLd({
            path,
            headline: `${name} राशिफल — ${when}`,
            description: summary,
            date: data.for_date,
            language: LANG,
          }),
        ])}
      />
      <SiteHeader />

      <main className="mx-auto w-full max-w-[760px] px-5 pt-10 pb-20 sm:px-8">
        <nav aria-label="Breadcrumb" className="text-xs text-dim">
          <Link href="/rasifal" className="min-h-11 inline-flex items-center hover:text-accent-ink">
            आजको राशिफल
          </Link>
          <span className="mx-1.5 text-dim">›</span>
          <span className="text-muted">{name}</span>
        </nav>

        <header className="mt-6 flex items-start gap-4">
          <span className="grid size-16 shrink-0 place-items-center rounded-full border border-accent/25 bg-accent-wash text-accent-ink">
            <RashiGlyph index={day.sign_index} className="size-8" />
          </span>
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold leading-tight text-ink sm:text-3xl">
              {name} राशिफल <span className="text-muted">· {route.roman} Rashifal</span>
            </h1>
            <p className="mt-1.5 text-sm text-muted">
              {when} · {RASHI_SYLLABLES[day.sign_index].join(" ")}
            </p>
          </div>
        </header>

        <section className="mt-6 rounded-lg border border-line-strong bg-surface p-5">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-xl leading-none text-star" aria-label={`${day.rating} / 5`}>
              {"★".repeat(day.rating)}
              <span className="text-dim">{"☆".repeat(5 - day.rating)}</span>
            </span>
            <span className="text-sm font-semibold text-accent-ink">
              {bandLabel(day.band ?? "", day.rating, LANG)}
            </span>
          </p>

          <p className="mt-4 text-base leading-relaxed text-ink">{summary}</p>

          {day.reading && (
            <dl className="mt-5 space-y-3">
              {SECTIONS.map((key) =>
                day.reading?.[key] ? (
                  <div key={key} className="text-sm leading-relaxed">
                    <dt className="inline font-semibold text-ink">{SECTION_LABELS[key][LANG]}</dt>
                    <dd className="ml-1.5 inline text-muted">{day.reading[key]}</dd>
                  </div>
                ) : null,
              )}
              {day.reading.remedy && (
                <div className="rounded-lg border border-accent/25 bg-accent-wash p-3 text-sm leading-relaxed">
                  <dt className="inline font-semibold text-accent-ink">{SECTION_LABELS.remedy[LANG]}</dt>
                  <dd className="ml-1.5 inline text-ink">{day.reading.remedy}</dd>
                </div>
              )}
            </dl>
          )}

          <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-4 text-sm">
            <div>
              <dt className="inline text-dim">शुभ रङ:</dt>{" "}
              <dd className="inline font-semibold text-ink">{colourName(day.lucky_colour, LANG)}</dd>
            </div>
            <div>
              <dt className="inline text-dim">शुभ अंक:</dt>{" "}
              <dd className="inline font-semibold text-accent-ink">
                {toLocalizedDigit(String(day.lucky_number), LANG)}
              </dd>
            </div>
            <div>
              <dt className="inline text-dim">चन्द्रमाको मूर्ति:</dt>{" "}
              <dd className="inline font-semibold text-ink">{murtiName(day.murti, LANG)}</dd>
            </div>
          </dl>
        </section>

        {/* The working. Nobody else publishes this, and it is what makes the
            page about this sign on this day rather than a horoscope. */}
        <section className="mt-6">
          <h2 className="font-display text-base font-semibold text-ink">आजको गोचर — {name} राशिबाट</h2>
          <ul className="mt-3 divide-y divide-line rounded-lg border border-line-strong bg-surface text-sm">
            {day.transits.map((t) => (
              <li key={t.name} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="text-ink">
                  {getPlanetName(t.name, LANG)}
                  {t.retrograde && <span className="ml-1.5 text-xs text-retrograde">(वक्री)</span>}
                </span>
                <span className="text-muted">
                  {getSignName(t.sign, LANG)} · {toLocalizedDigit(String(t.house), LANG)} भाव ·{" "}
                  <span className={t.favourable && !t.obstructed ? "font-semibold text-benefic" : t.obstructed ? "font-semibold text-accent-ink" : "font-semibold text-malefic"}>
                    {t.obstructed ? "वेध" : t.favourable ? "शुभ" : "अशुभ"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          {day.reading?.astrological_reason && (
            <p className="mt-3 text-xs leading-relaxed text-muted">{day.reading.astrological_reason}</p>
          )}
        </section>

        {/* Every other sign, so the crawler and the reader can both get to
            all twelve from any one. */}
        <section className="mt-8">
          <h2 className="font-display text-sm font-semibold text-muted">अन्य राशिहरूको आजको राशिफल</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {SIGN_ROUTES.filter((r) => r.slug !== route.slug).map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/rasifal/${r.slug}`}
                  className="min-h-11 inline-flex items-center rounded-full border border-line px-3.5 py-1.5 text-xs text-muted transition hover:border-accent hover:text-accent-ink hover:bg-surface"
                >
                  {getSignName(r.sign, LANG)}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-dim">
            <Link href="/rasifal" className="min-h-11 inline-flex items-center hover:text-accent-ink hover:underline">
              बाह्रै राशिको आजको राशिफल एकै पृष्ठमा →
            </Link>
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
