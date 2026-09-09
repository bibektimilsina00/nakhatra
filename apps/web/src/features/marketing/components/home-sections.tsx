"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Compass,
  Grid3x3,
  HeartHandshake,
  Languages,
  Layers,
  MapPin,
  MessagesSquare,
  Mic,
  Moon,
  Orbit,
  Phone,
  ScrollText,
  Search,
  ShieldCheck,
  Sparkles,
  Volume2,
} from "lucide-react";

import { ChartShowcase } from "@/features/marketing/components/chart-showcase";
import demoChart from "@/features/marketing/demo-chart.json";
import demoReading from "@/features/marketing/demo-reading.json";

/* ------------------------------------------------------------------ shared */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#E5A93C]">
      {children}
    </span>
  );
}

function SectionHead({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-3 text-center">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="text-balance font-serif text-2xl font-bold text-[#F8FAFC] sm:text-3xl">
        {title}
      </h2>
      {lede && (
        <p className="text-[15px] leading-relaxed text-[#94A3B8]">{lede}</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------- 1. the real chart */

export function ChartSection() {
  return (
    <section className="border-t border-brd bg-[#0D101A] py-20" id="chart">
      <div className="mx-auto max-w-6xl space-y-12 px-6">
        <SectionHead
          eyebrow="Your chart"
          title="This is a real chart, not a picture of one"
          lede="Computed from a genuine birth moment by the same engine that will compute yours. Every degree, nakshatra and dasha date below came out of the ephemeris."
        />
        <ChartShowcase />
      </div>
    </section>
  );
}

/* ----------------------------------------------- 2. how it works, the split */

export function HowItWorksSection() {
  return (
    <section className="border-t border-brd py-20" id="how">
      <div className="mx-auto max-w-5xl space-y-14 px-6">
        <SectionHead
          eyebrow="How it works"
          title="The maths and the meaning are kept apart"
          lede="Most AI astrology asks a language model to do both, and a language model will happily invent a planetary position that sounds right. Here it never gets the chance."
        />

        <div className="grid gap-6 md:grid-cols-2">
          {[
            {
              n: "01",
              Icon: Orbit,
              title: "The ephemeris calculates",
              body: "Your birth moment becomes universal time using the zone your birthplace kept that year. Swiss Ephemeris gives every longitude. Lahiri ayanamsa, whole-sign houses, mean nodes. The same inputs always give the same chart.",
            },
            {
              n: "02",
              Icon: ScrollText,
              title: "The astrologer reads it",
              body: "The finished chart is handed over as data. The AI interprets, compares and explains — but is never asked to work out a degree or a date, so it cannot get one wrong.",
            },
          ].map(({ n, Icon, title, body }) => (
            <article
              key={n}
              className="space-y-3 rounded-[10px] border border-brd bg-[#161B2B] p-7"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-[8px] border border-brd bg-[#090A10] text-[#E5A93C]">
                  <Icon className="size-5" />
                </span>
                <span className="font-mono text-xs text-[#64748B]">{n}</span>
              </div>
              <h3 className="font-serif text-lg font-bold text-[#F8FAFC]">{title}</h3>
              <p className="text-[15px] leading-relaxed text-[#94A3B8]">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------ 3. everything inside the chart */

const CONTENTS = [
  { Icon: Orbit, title: "Nine grahas", body: "Sign, house, degree and nakshatra for each, with retrograde, combustion, dignity and avastha." },
  { Icon: Grid3x3, title: "Twelve bhavas", body: "Whole-sign houses with their lords, occupants and the aspects reaching them." },
  { Icon: Moon, title: "Twenty-seven nakshatras", body: "The Moon's mansion and pada, with its ruling lord — the basis of the whole dasha timeline." },
  { Icon: Layers, title: "Sixteen vargas", body: "Divisional charts from D1 Rashi through D9 Navamsha to D60 Shashtiamsa, each with its own lagna." },
  { Icon: BarChart3, title: "Vimshottari dasha", body: "Mahadasha, antardasha and pratyantar, with the exact dates each period runs." },
  { Icon: Compass, title: "Panchang", body: "Tithi, karana, yoga, vara and paksha at the moment of birth, plus sunrise and sunset." },
  { Icon: Sparkles, title: "Avakhada chakra", body: "Varna, vashya, yoni, gana, nadi and your name syllable, all derived from the Moon." },
  { Icon: MapPin, title: "Historical zones", body: "The offset your birthplace actually used on your date, read from the zone database." },
];

export function ContentsSection() {
  return (
    <section className="border-t border-brd bg-[#0D101A] py-20" id="contents">
      <div className="mx-auto max-w-6xl space-y-12 px-6">
        <SectionHead
          eyebrow="What is calculated"
          title="Everything a Jyotish reading is built on"
          lede="Not a sun sign and a paragraph. The full apparatus, computed and shown to you."
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CONTENTS.map(({ Icon, title, body }) => (
            <article
              key={title}
              className="space-y-3 rounded-[10px] border border-brd bg-[#161B2B] p-5 transition-colors hover:border-[#E5A93C]/40"
            >
              <span className="flex size-10 items-center justify-center rounded-[8px] border border-brd bg-[#090A10] text-[#E5A93C]">
                <Icon className="size-[18px]" />
              </span>
              <h3 className="font-serif text-[15px] font-bold text-[#F8FAFC]">{title}</h3>
              <p className="text-[13px] leading-relaxed text-[#94A3B8]">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------- 4. the reading itself */

export function ReadingSection() {
  const reading = demoReading as {
    title: string;
    subtitle: string;
    summary: string;
    content: string[];
    reasoning: { placement: string; explanation: string }[];
  };

  return (
    <section className="border-t border-brd py-20" id="reading">
      <div className="mx-auto max-w-6xl space-y-12 px-6">
        <SectionHead
          eyebrow="Your reading"
          title="Seven sections, and every claim shows its working"
          lede="Personality, strengths, career, relationships, travel, your current period and remedies — each one naming the placements it rests on."
        />

        <div className="grid items-start gap-8 lg:grid-cols-5">
          <div className="space-y-3 lg:col-span-2">
            {[
              "Personality & Intellect",
              "Strengths & Growth Areas",
              "Career & Financial Outlook",
              "Love & Marriage",
              "Foreign Travel & Spirituality",
              "Current Dasha & Periods",
              "Remedial Measures",
            ].map((s, i) => (
              <div
                key={s}
                className={`flex items-center gap-3 rounded-[8px] border px-4 py-3 text-[14px] ${
                  i === 0
                    ? "border-[#E5A93C]/40 bg-[#161B2B] text-[#F8FAFC]"
                    : "border-brd text-[#94A3B8]"
                }`}
              >
                <span className="font-mono text-[11px] text-[#64748B]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {s}
              </div>
            ))}
          </div>

          {/* An actual generated section, not placeholder copy. */}
          <article className="space-y-4 rounded-[10px] border border-brd bg-[#161B2B] p-7 lg:col-span-3">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#F8FAFC]">
                {reading.title}
              </h3>
              <p className="mt-0.5 text-[13px] text-[#94A3B8]">{reading.subtitle}</p>
            </div>

            <p className="rounded-[8px] border border-[#E5A93C]/30 bg-[#090A10] p-3 text-[13px] font-medium text-[#FDE68A]">
              {reading.summary}
            </p>

            {reading.content.slice(0, 2).map((para, i) => (
              <p key={i} className="text-[14px] leading-[1.75] text-[#CBD5E1]">
                {para}
              </p>
            ))}

            <div className="border-t border-brd pt-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#E5A93C]">
                Based on
              </p>
              <div className="flex flex-wrap gap-2">
                {reading.reasoning.map((r) => (
                  <span
                    key={r.placement}
                    className="rounded-[6px] border border-brd bg-[#090A10] px-2.5 py-1 text-[12px] text-[#F8FAFC]"
                  >
                    {r.placement}
                  </span>
                ))}
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------- 5. ask & listen */

export function ConversationSection() {
  const chart = (demoChart as { chart: { dasha: { periods: { lord: string }[] } } }).chart;
  const maha = chart.dasha.periods[0]?.lord ?? "Mercury";

  return (
    <section className="border-t border-brd bg-[#0D101A] py-20" id="ask">
      <div className="mx-auto max-w-6xl space-y-12 px-6">
        <SectionHead
          eyebrow="Ask anything"
          title="A conversation, not a horoscope"
          lede="Ask follow-up questions in English, Nepali or Hindi. The astrologer answers from your chart and tells you which placement it is reading."
        />

        <div className="grid items-start gap-8 lg:grid-cols-2">
          <div className="space-y-3 rounded-[10px] border border-brd bg-[#161B2B] p-6">
            <div className="ml-auto max-w-[85%] rounded-[10px] rounded-br-sm bg-[#E5A93C] px-4 py-2.5 text-[14px] text-[#090A10]">
              Is this a good year to change jobs?
            </div>
            <div className="max-w-[92%] space-y-2 rounded-[10px] rounded-bl-sm border border-brd bg-[#090A10] px-4 py-3">
              <p className="text-[14px] leading-relaxed text-[#CBD5E1]">
                You are running <strong className="text-[#F8FAFC]">{maha} Mahadasha</strong>,
                and your tenth lord sits with it. That favours a considered move rather
                than a sudden one — negotiate, do not leap.
              </p>
              <div className="flex flex-wrap gap-1.5 border-t border-brd pt-2">
                {["10th lord placement", `${maha} Mahadasha`, "D10 Dasamsa"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-[5px] border border-brd px-2 py-0.5 text-[11px] text-[#94A3B8]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            {[
              { Icon: Volume2, title: "Read aloud", body: "Play the whole reading as natural speech, with speed control, or download it as audio to keep." },
              { Icon: Mic, title: "Speak to it", body: "Hold a live spoken consultation. Ask out loud and hear the answer, hands free." },
              { Icon: Languages, title: "Three languages", body: "English, नेपाली and हिन्दी — the whole reading and the whole conversation, not just the interface." },
            ].map(({ Icon, title, body }) => (
              <div key={title} className="flex gap-4 rounded-[10px] border border-brd bg-[#161B2B] p-5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-[8px] border border-brd bg-[#090A10] text-[#E5A93C]">
                  <Icon className="size-[18px]" />
                </span>
                <div className="space-y-1">
                  <h3 className="font-serif text-[15px] font-bold text-[#F8FAFC]">{title}</h3>
                  <p className="text-[13px] leading-relaxed text-[#94A3B8]">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- 6. milan */

export function MilanSection() {
  return (
    <section className="border-t border-brd py-20" id="milan">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="space-y-5">
            <Eyebrow>Kundali Milan</Eyebrow>
            <h2 className="text-balance font-serif text-2xl font-bold text-[#F8FAFC] sm:text-3xl">
              Ashtakoota matching, with the reasoning shown
            </h2>
            <p className="text-[15px] leading-relaxed text-[#94A3B8]">
              Compare two charts across all eight kutas for the full 36 gunas, with
              Manglik dosha checked on both sides and cancellation rules applied — and
              the score broken down koota by koota rather than handed to you as a
              single number.
            </p>
            <Link
              href="/milan"
              className="inline-flex items-center gap-2 rounded-[8px] bg-[#E5A93C] px-6 py-3 text-sm font-semibold text-[#090A10] transition-colors hover:bg-[#F3C766]"
            >
              <HeartHandshake className="size-4" />
              Match two charts
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="rounded-[10px] border border-brd bg-[#161B2B] p-6">
            <div className="mb-4 flex items-baseline justify-between border-b border-brd pb-3">
              <span className="text-[13px] text-[#94A3B8]">Total guna</span>
              <span className="font-mono text-2xl font-bold text-[#E5A93C]">28<span className="text-base text-[#64748B]">/36</span></span>
            </div>
            <ul className="space-y-2.5">
              {[
                ["Varna", 1, 1], ["Vashya", 2, 2], ["Tara", 3, 3],
                ["Yoni", 3, 4], ["Graha Maitri", 5, 5], ["Gana", 6, 6],
                ["Bhakoot", 0, 7], ["Nadi", 8, 8],
              ].map(([name, got, max]) => (
                <li key={name as string} className="flex items-center gap-3 text-[13px]">
                  <span className="w-24 shrink-0 text-[#CBD5E1]">{name}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#090A10]">
                    <span
                      className="block h-full rounded-full bg-[#E5A93C]"
                      style={{ width: `${(Number(got) / Number(max)) * 100}%` }}
                    />
                  </span>
                  <span className="w-10 shrink-0 text-right font-mono text-[#94A3B8]">
                    {got}/{max}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[12px] leading-relaxed text-[#64748B]">
              Illustrative scores. Bhakoot at zero is exactly the kind of result worth
              reading the reasoning for, rather than reading the total.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------- 7. the tz proof */

export function AccuracySection() {
  return (
    <section className="border-t border-brd bg-[#0D101A] py-20" id="accuracy">
      <div className="mx-auto grid max-w-5xl items-center gap-10 px-6 md:grid-cols-5">
        <div className="space-y-4 md:col-span-3">
          <Eyebrow>Why charts disagree</Eyebrow>
          <h2 className="text-balance font-serif text-2xl font-bold text-[#F8FAFC] sm:text-3xl">
            Kathmandu has not always been +5:45
          </h2>
          <p className="text-[15px] leading-relaxed text-[#94A3B8]">
            It kept +5:30 until 1986, and local mean time of +5:41:16 before that. A
            1975 birth calculated with today&apos;s offset lands fifteen minutes off —
            roughly{" "}
            <strong className="font-semibold text-[#F8FAFC]">3.75° of ascendant</strong>,
            enough to move a lagna into the wrong sign.
          </p>
          <p className="text-[15px] leading-relaxed text-[#94A3B8]">
            We store the zone by name and look up what it meant on your date. It is a
            small thing that quietly decides whether the rest of the chart is worth
            reading at all.
          </p>
        </div>

        <div className="md:col-span-2">
          <div className="space-y-3 rounded-[10px] border border-brd bg-[#161B2B] p-6 font-mono text-[13px]">
            <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-widest text-[#64748B]">
              <ShieldCheck className="size-3.5 text-[#E5A93C]" />
              Kathmandu, 14 June 1975
            </div>
            <div className="flex items-baseline justify-between gap-4 border-b border-brd pb-3">
              <span className="text-[#94A3B8]">Today&apos;s offset</span>
              <span className="text-rose-400">+5:45</span>
            </div>
            <div className="flex items-baseline justify-between gap-4 pb-1">
              <span className="text-[#94A3B8]">Actual, that year</span>
              <span className="text-[#E5A93C]">+5:30</span>
            </div>
            <p className="pt-2 font-sans text-xs leading-relaxed text-[#64748B]">
              Fifteen minutes of clock time. About 3.75 degrees of ascendant.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------- 8. astrologers */

export function AstrologersSection() {
  return (
    <section className="border-t border-brd py-20" id="astrologers">
      <div className="mx-auto max-w-5xl px-6">
        <div className="rounded-[12px] border border-[#E5A93C]/25 bg-[#161B2B] p-8 sm:p-12">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-[#E5A93C]/40 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#E5A93C]">
              Coming soon
            </span>
            <span className="text-[13px] text-[#64748B]">In development</span>
          </div>

          <h2 className="mt-5 max-w-2xl text-balance font-serif text-2xl font-bold text-[#F8FAFC] sm:text-3xl">
            When you want a second opinion, talk to a real astrologer
          </h2>

          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[#94A3B8]">
            Verified astrologers and pandits taking consultations on the platform. The
            point is not another directory — it is that they arrive already holding your
            chart, your questions and what the AI told you. You will not retype your
            birth details or explain your situation twice.
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { Icon: Search, title: "Find a jyotish", body: "Search by tradition, language, speciality, experience and price. Verified profiles only — nobody lists before review." },
              { Icon: MessagesSquare, title: "Chat first", body: "Start in writing, at your own pace. They can see the chart you shared and the questions you already asked the AI." },
              { Icon: Phone, title: "Then speak", body: "Move to an audio or video consultation when writing is not enough, scheduled in your time zone and theirs." },
              { Icon: ShieldCheck, title: "Your data, your call", body: "Sharing a chart is an explicit grant to one person. It is revocable, and you can see every grant you have made." },
            ].map(({ Icon, title, body }) => (
              <div key={title} className="space-y-2.5 rounded-[10px] border border-brd bg-[#0D101A] p-5">
                <span className="flex size-9 items-center justify-center rounded-[8px] border border-brd bg-[#090A10] text-[#E5A93C]">
                  <Icon className="size-[17px]" />
                </span>
                <h3 className="text-sm font-semibold text-[#F8FAFC]">{title}</h3>
                <p className="text-[13px] leading-relaxed text-[#94A3B8]">{body}</p>
              </div>
            ))}
          </div>

          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
            <a
              href="#form"
              className="inline-flex items-center gap-2 rounded-[8px] border border-brd px-5 py-2.5 text-sm font-semibold text-[#F8FAFC] transition-colors hover:border-[#E5A93C]/50 hover:text-[#F3C766]"
            >
              Start with your chart <ArrowRight className="size-4" />
            </a>
            <p className="text-[13px] text-[#64748B]">
              Practising astrologer? Applications open when verification does.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- 9. FAQ */

const FAQ: [string, string][] = [
  [
    "Do I need to know my exact birth time?",
    "The closer the better. The ascendant moves about one degree every four minutes, so an hour of uncertainty can shift your lagna into the next sign. Mark the time as approximate if you are unsure and the reading will lean on the Moon rather than the ascendant.",
  ],
  [
    "Which system does this use?",
    "Sidereal, with the Lahiri (Chitrapaksha) ayanamsa, whole-sign houses and mean nodes — the standard combination in Indian and Nepali Jyotish. Divisional charts follow classical Parashari rules.",
  ],
  [
    "Can I enter a Bikram Sambat date?",
    "Yes. Switch the date field to BS and it converts to the Gregorian date before calculating.",
  ],
  [
    "Is the AI making the astrology up?",
    "It cannot compute anything. Positions, houses, nakshatras and dasha dates come from the ephemeris and are handed to the model as finished data. It interprets what it is given, and every section names the placements behind it so you can check.",
  ],
  [
    "Is my birth data private?",
    "It is never written to our logs, never put into error messages and never sent to analytics. It does go to the AI provider that generates your reading, because that is how the reading is written. The privacy policy names every recipient.",
  ],
  [
    "Do I need an account?",
    "Not to calculate a chart and read it. An account is for saving charts and keeping your conversations.",
  ],
];

export function FaqSection() {
  return (
    <section className="border-t border-brd bg-[#0D101A] py-20" id="faq">
      <div className="mx-auto max-w-3xl space-y-10 px-6">
        <SectionHead eyebrow="Questions" title="Before you start" />
        <div className="divide-y divide-brd border-y border-brd">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold text-[#F8FAFC] marker:hidden">
                {q}
                <span className="shrink-0 text-[#E5A93C] transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-[14px] leading-[1.75] text-[#94A3B8]">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- 10. last CTA */

export function ClosingSection() {
  return (
    <section className="border-t border-brd py-20">
      <div className="mx-auto max-w-2xl space-y-6 px-6 text-center">
        <h2 className="text-balance font-serif text-2xl font-bold text-[#F8FAFC] sm:text-3xl">
          Your chart takes about a minute
        </h2>
        <p className="text-[15px] leading-relaxed text-[#94A3B8]">
          Name, date, time and place. No account needed to see it.
        </p>
        <a
          href="#form"
          className="inline-flex items-center gap-2 rounded-[8px] bg-[#E5A93C] px-7 py-3.5 text-sm font-semibold text-[#090A10] transition-colors hover:bg-[#F3C766]"
        >
          <Sparkles className="size-4" />
          Calculate my kundali
          <ArrowRight className="size-4" />
        </a>
      </div>
    </section>
  );
}
