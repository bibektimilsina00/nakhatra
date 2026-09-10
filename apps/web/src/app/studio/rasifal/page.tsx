import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { bsMonthName, num, WEEKDAY_FULL } from "@/features/patro/patro-i18n";
import { RashiGlyph } from "@/features/rasifal/components/rashi-glyph";
import {
  bandLabel,
  colourName,
  RASHI_SYLLABLES,
  readingFor,
} from "@/features/rasifal/rasifal-i18n";
import type { Rasifal } from "@/features/rasifal/types";
import { API_URL } from "@/lib/api/proxy";
import { STUDIO_KEY } from "@/lib/studio";
import { getSignName, toLocalizedDigit } from "@/lib/i18n/vedic-translations";
import { convertAdToBs } from "@/lib/utils/date-converter";

/**
 * One 9:16 slide, for the camera rather than the reader.
 *
 * `scripts/rasifal-tiktok.mjs` screenshots this route once per slide, reads
 * the narration out of the `#narration` tag below, has it spoken, and cuts
 * the frames to the voice. It is a page and not a canvas renderer because the
 * glyphs and the Nepali text already render correctly here — a second
 * renderer would be a second place for the typography to be wrong, and the
 * words on the slide would drift from the words in the voice.
 *
 * 540 × 960 CSS px, shot at device-scale 2 → 1080 × 1920.
 */

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

const LANG = "ne" as const;

/** Six signs to a part. */
const PART_RANGE: Record<string, string> = {
  "1": "मेष देखि कन्या",
  "2": "तुला देखि मीन",
};

/** The lucky colour, as a colour. A word for it is not a swatch. */
const SWATCH: Record<string, string> = {
  white: "#F1F5F9",
  red: "#DC2626",
  green: "#16A34A",
  yellow: "#EAB308",
  blue: "#3B82F6",
  copper: "#B87333",
  smoke: "#94A3B8",
  grey: "#64748B",
};

/** Small numbers as words: a voice reads "९" more reliably than it reads 9. */
const SPOKEN_DIGIT = ["शून्य", "एक", "दुई", "तीन", "चार", "पाँच", "छ", "सात", "आठ", "नौ"];

/**
 * A fixed star field. Seeded rather than random so that re-shooting a slide
 * gives the same sky — a frame that differs from the last one only in its
 * noise is a frame that flickers.
 */
const STARS = (() => {
  let seed = 20830525;
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  return Array.from({ length: 54 }, () => ({
    left: `${(rand() * 100).toFixed(2)}%`,
    top: `${(rand() * 100).toFixed(2)}%`,
    size: `${(rand() * 1.8 + 0.9).toFixed(2)}px`,
    opacity: rand() * 0.5 + 0.18,
  }));
})();

/** Twelve rays for twelve rashis — the title card's chakra. */
function Chakra({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} fill="none" aria-hidden>
      <circle cx="100" cy="100" r="96" stroke="currentColor" strokeOpacity="0.18" />
      <circle cx="100" cy="100" r="78" stroke="currentColor" strokeOpacity="0.35" strokeDasharray="2 7" />
      <circle cx="100" cy="100" r="52" stroke="currentColor" strokeOpacity="0.22" />
      {Array.from({ length: 12 }, (_, k) => (
        <line
          key={k}
          x1="100"
          y1="100"
          x2={100 + 96 * Math.cos((k * Math.PI) / 6)}
          y2={100 + 96 * Math.sin((k * Math.PI) / 6)}
          stroke="currentColor"
          strokeOpacity="0.12"
        />
      ))}
      {/* The yantra square, turned — the mark the brand is built on. */}
      <rect x="41" y="41" width="118" height="118" stroke="currentColor" strokeOpacity="0.3" />
      <path d="M100 41 L159 100 L100 159 L41 100 Z" stroke="currentColor" strokeOpacity="0.45" />
    </svg>
  );
}

export default async function StudioRasifalSlide({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; part?: string; i?: string; key?: string }>;
}) {
  const { date, part = "1", i = "0", key } = await searchParams;

  // Not a page for readers: it is the camera's view of a day, and it exists on
  // a public domain. Anything but the shared key is told there is nothing here
  // rather than that there is something it may not have.
  if (!STUDIO_KEY || key !== STUDIO_KEY) notFound();

  const qs = new URLSearchParams({ language: LANG, ...(date ? { on: date } : {}) });
  const res = await fetch(`${API_URL}/v1/rasifal?${qs}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`rasifal ${res.status}`);
  const data = (await res.json()) as Rasifal;

  const bs = convertAdToBs(
    Number(data.for_date.slice(0, 4)),
    Number(data.for_date.slice(5, 7)),
    Number(data.for_date.slice(8, 10)),
  );
  const weekday =
    WEEKDAY_FULL[
      ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][
        new Date(data.for_date + "T12:00:00").getDay()
      ]
    ][LANG];
  const miti = `${bsMonthName(bs.month, LANG)} ${num(bs.day, LANG)} गते, ${num(bs.year, LANG)}`;

  const slide = Number(i);
  const offset = part === "2" ? 6 : 0;
  const day = slide === 0 ? null : data.signs[offset + slide - 1];

  const reading = day ? day.reading?.summary || readingFor(day, LANG) : "";

  // What the voice says over this frame. The last sign of a part carries the
  // call to action; putting it on every slide would make it wallpaper.
  const narration = day
    ? [
        `${getSignName(day.sign, LANG)} राशि।`,
        `${bandLabel(day.band ?? "", day.rating, LANG)}।`,
        reading,
        `शुभ रङ ${colourName(day.lucky_colour, LANG)}, शुभ अंक ${SPOKEN_DIGIT[day.lucky_number] ?? day.lucky_number}।`,
        slide === 6 ? "पूरा राशिफल नक्षत्र डट कम मा हेर्नुहोस्।" : "",
      ]
        .filter(Boolean)
        .join(" ")
    : `नमस्कार। आज मिति ${num(bs.year, LANG)} ${bsMonthName(bs.month, LANG)} ${num(bs.day, LANG)} गते, ${weekday}को राशिफल। भाग ${part === "2" ? "दुई" : "एक"} — ${PART_RANGE[part]} सम्म। सुरु गरौं।`;

  return (
    <div className="theme-dark fixed top-0 left-0 flex h-[960px] w-[540px] flex-col overflow-hidden bg-ink text-paper">
      {/* The script reads this rather than re-deriving the sentence, so the
          voice and the slide can never say different things. */}
      <script
        id="narration"
        type="application/json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({ text: narration, miti, weekday }),
        }}
      />

      {/* Night sky: a gold dawn at the top, a cold floor, and stars between. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-12%,rgba(229,169,60,0.22),transparent_58%),radial-gradient(ellipse_at_50%_115%,rgba(129,140,248,0.14),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0">
        {STARS.map((s, k) => (
          <span
            key={k}
            className="absolute rounded-full bg-paper"
            style={{ left: s.left, top: s.top, width: s.size, height: s.size, opacity: s.opacity }}
          />
        ))}
      </div>

      <header className="relative flex items-center justify-between px-9 pt-10">
        <span className="font-logo text-[15px] tracking-[0.28em] text-gold">NAKHATRA</span>
        <span className="text-[13px] text-muted">{miti}</span>
      </header>
      <div className="relative mx-9 mt-3 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      {day === null ? (
        <div className="relative flex flex-1 flex-col items-center justify-center px-10 text-center">
          <div className="relative grid size-[310px] place-items-center">
            <Chakra className="absolute inset-0 size-full text-gold" />
            <p className="text-[15px] leading-[1.7] text-gold2">
              आज मिति
              <br />
              <span className="text-[25px] font-semibold text-paper">{miti}</span>
              <br />
              {weekday}
            </p>
          </div>

          <h1 className="mt-8 text-[76px] font-bold leading-[1.02]">राशिफल</h1>
          <p className="mt-6 rounded-full border border-gold/35 bg-gold/[0.09] px-6 py-2.5 text-[19px] font-semibold text-gold2">
            भाग {toLocalizedDigit(part, LANG)} — {PART_RANGE[part]}
          </p>
          <p className="mt-8 text-[17px] leading-[1.8] text-muted">
            नेपालकै समयमा गोचर गणना गरेर निकालिएको —
            <br />
            बाह्रै राशिको आजको फल।
          </p>
        </div>
      ) : (
        <div className="relative flex flex-1 flex-col items-center justify-center px-9 pb-3 text-center">
          <div className="relative grid size-[150px] place-items-center">
            <Chakra className="absolute inset-0 size-full text-gold" />
            <span className="grid size-[104px] place-items-center rounded-full border border-gold/30 bg-gradient-to-br from-gold/25 to-gold/[0.03] text-gold shadow-[0_0_48px_rgba(229,169,60,0.22)]">
              <RashiGlyph index={day.sign_index} className="size-[58px]" />
            </span>
          </div>

          <h1 className="mt-4 text-[50px] font-bold leading-none">
            {getSignName(day.sign, LANG)}
          </h1>
          <p className="mt-2.5 text-[15px] tracking-[0.14em] text-faint">
            {RASHI_SYLLABLES[day.sign_index].join(" ")}
          </p>

          <p className="mt-4 text-[26px] leading-none text-gold">
            {"★".repeat(day.rating)}
            <span className="text-faint/40">{"☆".repeat(5 - day.rating)}</span>
          </p>
          <p className="mt-3 rounded-full border border-gold/25 bg-gold/[0.07] px-4 py-1.5 text-[16px] font-semibold text-gold2">
            {bandLabel(day.band ?? "", day.rating, LANG)}
          </p>

          {/* Nine lines is what fits; the writer's prose runs longer than a
              slide on a good day, so it is cut here rather than overflowed. */}
          <p className="mt-5 line-clamp-[9] text-[20px] leading-[1.85] text-paper/90">{reading}</p>

          <dl className="mt-7 flex w-full items-center justify-center gap-9 rounded-[10px] border border-brd bg-ink2/70 px-5 py-3.5 text-[16px]">
            <div className="flex items-center gap-2.5">
              <dt className="text-faint">शुभ रङ</dt>
              <dd className="flex items-center gap-2 font-semibold">
                <span
                  className="size-3.5 rounded-full ring-1 ring-white/25"
                  style={{ background: SWATCH[day.lucky_colour] ?? "#94A3B8" }}
                />
                {colourName(day.lucky_colour, LANG)}
              </dd>
            </div>
            <div className="flex items-center gap-2.5">
              <dt className="text-faint">शुभ अंक</dt>
              <dd className="text-[20px] font-bold text-gold2">
                {toLocalizedDigit(String(day.lucky_number), LANG)}
              </dd>
            </div>
          </dl>
        </div>
      )}

      <footer className="relative flex items-center justify-between px-9 pb-11 text-[15px] text-faint">
        <span>पूरा राशिफल · nakhatra.com</span>
        {day && (
          <span className="text-gold/70">
            {toLocalizedDigit(String(slide), LANG)}/{toLocalizedDigit("6", LANG)}
          </span>
        )}
      </footer>
    </div>
  );
}
