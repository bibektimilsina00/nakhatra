"use client";

import { useState } from "react";
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

import { buttonClasses } from "@/components/ui/button";
import { ChartShowcase } from "@/features/marketing/components/chart-showcase";
import demoChart from "@/features/marketing/demo-chart.json";
import demoReading from "@/features/marketing/demo-reading.json";

/* ------------------------------------------------------------------ shared */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-2xs font-bold uppercase tracking-wider text-accent-ink">
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
      <h2 className="text-balance font-display text-2xl font-bold text-ink sm:text-3xl">
        {title}
      </h2>
      {lede && (
        <p className="text-sm leading-relaxed text-muted">{lede}</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------- 1. the real chart */

export function ChartSection() {
  return (
    <section className="border-t border-line bg-cream py-20" id="chart">
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
    <section className="border-t border-line py-20" id="how">
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
              className="space-y-3 rounded-lg border border-line-strong bg-surface p-7"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-md border border-line-strong bg-surface text-accent-ink">
                  <Icon className="size-5" />
                </span>
                <span className="font-mono text-xs text-dim">{n}</span>
              </div>
              <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
              <p className="text-sm leading-relaxed text-muted">{body}</p>
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
    <section className="border-t border-line bg-cream py-20" id="contents">
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
              className="space-y-3 rounded-lg border border-line-strong bg-surface p-5 transition-colors hover:border-accent"
            >
              <span className="flex size-11 items-center justify-center rounded-md border border-line-strong bg-surface text-accent-ink">
                <Icon className="size-5" />
              </span>
              <h3 className="font-display text-sm font-bold text-ink">{title}</h3>
              <p className="text-xs leading-relaxed text-muted">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------- 4. the reading itself */

export function ReadingSection() {
  const [activeIdx, setActiveIdx] = useState(0);

  const sections = [
    {
      title: "Personality & Intellect",
      subtitle: "Cancer Ascendant with Lagna lord Moon in 1st house",
      summary: "Cancer rising places your Lagna lord Moon in its own sign in the 1st house, anchoring your worldview in strong instinctual discernment and deep attachment to family foundations.",
      content: [
        "Cancer rising at 15.93° places your Lagna lord Moon in its own sign in the 1st house. This anchors your worldview in strong instinctual discernment and deep attachment to family foundations. Under Ashlesha Nakshatra (Pada 3), your intellect is sharp, observant, and cautious.",
        "You evaluate situations thoroughly before revealing your intentions. The combination of Cancer Lagna and Moon gives a deeply empathetic nature balanced by strong self-protective boundaries."
      ],
      reasoning: [
        { placement: "Cancer Ascendant (15.93°)" },
        { placement: "Lagna Lord Moon in 1st House" },
        { placement: "Ashlesha Nakshatra (Pada 3)" }
      ]
    },
    {
      title: "Strengths & Growth Areas",
      subtitle: "Tenacious observational focus and crisis resilience",
      summary: "Lagna lord Moon in the first house grants exceptional psychological endurance and instinct under pressure, while Ketu in the sixth requires direct conflict resolution.",
      content: [
        "Lagna lord Moon in the first house grants exceptional psychological endurance and instinct under pressure. However, with Ketu positioned in the sixth house of disputes (Sagittarius), you tend to internalize professional disagreements and re-analyze past friction long after matters resolve.",
        "Growth requires addressing conflicts directly rather than ruminating."
      ],
      reasoning: [
        { placement: "Moon in 1st House (Cancer)" },
        { placement: "Ketu in 6th House (Sagittarius)" },
        { placement: "6th Lord Jupiter in 9th" }
      ]
    },
    {
      title: "Career & Financial Outlook",
      subtitle: "Tenth house in Aries with Saturn retrograde",
      summary: "Your tenth house of profession is Aries, ruled by Mars, with Saturn placed there retrograde in debilitation, demanding sustained effort and self-reliance for structural authority.",
      content: [
        "Your tenth house of profession is Aries, ruled by Mars, with Saturn placed there retrograde in debilitation. In Vedic astrology, Saturn in the tenth demands sustained effort and self-reliance rather than quick advancement.",
        "Responsibilities feel heavy early in career, but establish durable structural authority as professional maturity sets in."
      ],
      reasoning: [
        { placement: "10th House in Aries (Mars Lord)" },
        { placement: "Saturn ℞ in 10th House" },
        { placement: "Mercury Mahadasha" }
      ]
    },
    {
      title: "Love & Marriage",
      subtitle: "Seventh house in Capricorn with Sun and Mercury",
      summary: "Your seventh house falls in Capricorn, ruled by Saturn, indicating long-term relationships are approached with sobriety, practical commitment, and mutual autonomy.",
      content: [
        "Your seventh house falls in Capricorn, ruled by Saturn, indicating that long-term relationships are approached with sobriety and practical commitment.",
        "Sun and Mercury placed together in the seventh indicate an intellectually capable, outspoken partner with strong administrative judgment. Marital harmony thrives on clear contractual boundaries."
      ],
      reasoning: [
        { placement: "7th House in Capricorn (Saturn Lord)" },
        { placement: "Sun & Mercury in 7th House" },
        { placement: "Venus in 12th House" }
      ]
    },
    {
      title: "Foreign Travel & Spirituality",
      subtitle: "Twelfth house cluster in Gemini with Venus, Mars & Rahu",
      summary: "With Venus, Mars, and Rahu situated together in Gemini in your twelfth house, relocation far from your birthplace brings major life milestones.",
      content: [
        "With Venus, Mars, and Rahu situated together in Gemini in your twelfth house of distant lands and expenditures, relocation far from your birthplace brings major life milestones.",
        "The Mars-Rahu conjunction here demands intentional budgeting against impulsive outflow. Spiritually, solitary contemplation provides deep restoration."
      ],
      reasoning: [
        { placement: "12th House in Gemini" },
        { placement: "Mars & Rahu Conjunction in 12th" },
        { placement: "Venus in 12th House" }
      ]
    },
    {
      title: "Current Dasha & Periods",
      subtitle: "Mercury Mahadasha with Ketu Antardasha",
      summary: "Under Vimshottari dasha, Mercury governs intellect, communications, and trade, while Ketu Antardasha creates an intentional pause in external momentum.",
      content: [
        "Under Vimshottari dasha, Mercury governs intellect, communications, and trade. Moving through a Ketu Antardasha creates an intentional pause in external momentum.",
        "You may experience detachment from routine obligations or question long-held goals. This sub-period favors auditing past commitments before starting new ventures."
      ],
      reasoning: [
        { placement: "Mercury Mahadasha (17-year cycle)" },
        { placement: "Ketu Antardasha (sub-period)" },
        { placement: "Calculated from Moon in Ashlesha" }
      ]
    },
    {
      title: "Remedial Measures",
      subtitle: "Classical Vedic remedies for Cancer Lagna and 12th House Mars-Rahu",
      summary: "Classical Vedic remedies balancing Cancer Lagna and stabilizing twelfth-house Mars-Rahu energy through daily rituals and charity.",
      content: [
        "To ground the Lagna lord Moon, practice morning water offerings (Surya Arghya) and maintain consistent sleep routines.",
        "To pacify the Mars-Rahu conjunction in the twelfth house, perform focused breathing meditation and donate red lentils or warm clothing on Tuesdays. Natural silver assists in steadying emotional reactivity."
      ],
      reasoning: [
        { placement: "Lagna Lord: Moon" },
        { placement: "Mars-Rahu in 12th House" },
        { placement: "Vedic Upaya (Charity & Meditation)" }
      ]
    }
  ];

  const current = sections[activeIdx];

  return (
    <section className="border-t border-line py-20" id="reading">
      <div className="mx-auto max-w-6xl space-y-12 px-6">
        <SectionHead
          eyebrow="Your reading"
          title="Seven sections, and every claim shows its working"
          lede="Personality, strengths, career, relationships, travel, your current period and remedies — each one naming the placements it rests on."
        />

        <div className="grid items-start gap-8 lg:grid-cols-5">
          <div className="space-y-3 lg:col-span-2">
            {sections.map((s, idx) => {
              const isActive = idx === activeIdx;
              return (
                <button
                  key={s.title}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveIdx(idx);
                  }}
                  className={`flex w-full items-center gap-3 rounded-md border px-4 py-3 text-left text-sm transition-all cursor-pointer ${
                    isActive
                      ? "border-accent-strong bg-surface text-ink font-semibold shadow-sm"
                      : "border-line text-muted hover:border-line-strong hover:bg-surface/50 hover:text-ink"
                  }`}
                >
                  <span className={`font-mono text-2xs ${isActive ? "text-accent-ink font-bold" : "text-dim"}`}>
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1">{s.title}</span>
                  {isActive && <span className="text-accent-ink text-xs font-bold">→</span>}
                </button>
              );
            })}
          </div>

          <article key={activeIdx} className="space-y-4 rounded-lg border border-line-strong bg-surface p-7 lg:col-span-3 transition-all animate-in fade-in-50 duration-150">
            <div>
              <div className="mb-1 font-mono text-2xs font-semibold text-dim uppercase">Section {String(activeIdx + 1).padStart(2, "0")} of 07</div>
              <h3 className="font-display text-xl font-bold text-ink">
                {current.title}
              </h3>
              <p className="mt-0.5 text-xs text-muted">{current.subtitle}</p>
            </div>

            <p className="rounded-md border border-line-strong bg-accent-wash p-3.5 text-xs font-medium text-accent-ink">
              {current.summary}
            </p>

            {current.content.map((para, i) => (
              <p key={i} className="text-sm leading-relaxed text-ink">
                {para}
              </p>
            ))}

            <div className="border-t border-line pt-4">
              <p className="mb-2.5 text-2xs font-bold uppercase tracking-wider text-accent-ink">
                Drawn From
              </p>
              <div className="flex flex-wrap gap-2">
                {current.reasoning.map((r) => (
                  <span
                    key={r.placement}
                    className="rounded-sm border border-line-strong bg-cream px-2.5 py-1 text-xs text-ink"
                  >
                    {r.placement}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-line pt-4 mt-6">
              <button
                type="button"
                disabled={activeIdx === 0}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveIdx((prev: number) => Math.max(0, prev - 1));
                }}
                className="text-xs font-medium text-muted hover:text-ink disabled:opacity-30 cursor-pointer"
              >
                ← Previous
              </button>
              <span className="font-mono text-2xs text-dim">{activeIdx + 1} / {sections.length}</span>
              <button
                type="button"
                disabled={activeIdx === sections.length - 1}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveIdx((prev: number) => Math.min(sections.length - 1, prev + 1));
                }}
                className="text-xs font-medium text-muted hover:text-ink disabled:opacity-30 cursor-pointer"
              >
                Next →
              </button>
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
    <section className="border-t border-line bg-cream py-20" id="ask">
      <div className="mx-auto max-w-6xl space-y-12 px-6">
        <SectionHead
          eyebrow="Ask anything"
          title="A conversation, not a horoscope"
          lede="Ask follow-up questions in English, Nepali or Hindi. The astrologer answers from your chart and tells you which placement it is reading."
        />

        <div className="grid items-start gap-8 lg:grid-cols-2">
          <div className="space-y-3 rounded-lg border border-line-strong bg-surface p-6">
            <div className="ml-auto max-w-[85%] rounded-lg rounded-br-sm bg-accent px-4 py-2.5 text-sm text-accent-contrast">
              Is this a good year to change jobs?
            </div>
            <div className="max-w-[92%] space-y-2 rounded-lg rounded-bl-sm border border-line-strong bg-cream/40 px-4 py-3">
              <p className="text-sm leading-relaxed text-ink">
                You are running <strong className="font-semibold text-ink">{maha} Mahadasha</strong>,
                and your tenth lord sits with it. That favours a considered move rather
                than a sudden one — negotiate, do not leap.
              </p>
              <div className="flex flex-wrap gap-1.5 border-t border-line pt-2">
                {["10th lord placement", `${maha} Mahadasha`, "D10 Dasamsa"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-sm border border-line px-2 py-0.5 text-2xs text-dim"
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
              <div key={title} className="flex gap-4 rounded-lg border border-line-strong bg-surface p-5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-md border border-line-strong bg-surface text-accent-ink">
                  <Icon className="size-5" />
                </span>
                <div className="space-y-1">
                  <h3 className="font-display text-sm font-bold text-ink">{title}</h3>
                  <p className="text-xs leading-relaxed text-muted">{body}</p>
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
    <section className="border-t border-line py-20" id="milan">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="space-y-5">
            <Eyebrow>Kundali Milan</Eyebrow>
            <h2 className="text-balance font-display text-2xl font-bold text-ink sm:text-3xl">
              Ashtakoota matching, with the reasoning shown
            </h2>
            <p className="text-sm leading-relaxed text-muted">
              Compare two charts across all eight kutas for the full 36 gunas, with
              Manglik dosha checked on both sides and cancellation rules applied — and
              the score broken down koota by koota rather than handed to you as a
              single number.
            </p>
            <Link
              href="/milan"
              className={buttonClasses("primary", { className: "gap-2" })}
            >
              <HeartHandshake className="size-4" />
              Match two charts
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="rounded-lg border border-line-strong bg-surface p-6">
            <div className="mb-4 flex items-baseline justify-between border-b border-line pb-3">
              <span className="text-xs text-muted">Total guna</span>
              <span className="font-mono text-2xl font-bold text-accent-ink">28<span className="text-sm text-dim">/36</span></span>
            </div>
            <ul className="space-y-2.5">
              {[
                ["Varna", 1, 1], ["Vashya", 2, 2], ["Tara", 3, 3],
                ["Yoni", 3, 4], ["Graha Maitri", 5, 5], ["Gana", 6, 6],
                ["Bhakoot", 0, 7], ["Nadi", 8, 8],
              ].map(([name, got, max]) => (
                <li key={name as string} className="flex items-center gap-3 text-xs">
                  <span className="w-24 shrink-0 text-ink">{name}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line-strong">
                    <span
                      className="block h-full rounded-full bg-accent"
                      style={{ width: `${(Number(got) / Number(max)) * 100}%` }}
                    />
                  </span>
                  <span className="w-10 shrink-0 text-right font-mono text-muted">
                    {got}/{max}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-dim">
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
    <section className="border-t border-line bg-cream py-20" id="accuracy">
      <div className="mx-auto grid max-w-5xl items-center gap-10 px-6 md:grid-cols-5">
        <div className="space-y-4 md:col-span-3">
          <Eyebrow>Why charts disagree</Eyebrow>
          <h2 className="text-balance font-display text-2xl font-bold text-ink sm:text-3xl">
            Kathmandu has not always been +5:45
          </h2>
          <p className="text-sm leading-relaxed text-muted">
            It kept +5:30 until 1986, and local mean time of +5:41:16 before that. A
            1975 birth calculated with today&apos;s offset lands fifteen minutes off —
            roughly{" "}
            <strong className="font-semibold text-ink">3.75° of ascendant</strong>,
            enough to move a lagna into the wrong sign.
          </p>
          <p className="text-sm leading-relaxed text-muted">
            We store the zone by name and look up what it meant on your date. It is a
            small thing that quietly decides whether the rest of the chart is worth
            reading at all.
          </p>
        </div>

        <div className="md:col-span-2">
          <div className="space-y-3 rounded-lg border border-line-strong bg-surface p-6 font-mono text-xs">
            <div className="mb-1 flex items-center gap-2 text-2xs uppercase tracking-widest text-dim">
              <ShieldCheck className="size-3.5 text-accent-ink" />
              Kathmandu, 14 June 1975
            </div>
            <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
              <span className="text-muted">Today&apos;s offset</span>
              <span className="text-danger-ink">+5:45</span>
            </div>
            <div className="flex items-baseline justify-between gap-4 pb-1">
              <span className="text-muted">Actual, that year</span>
              <span className="text-accent-ink">+5:30</span>
            </div>
            <p className="pt-2 font-sans text-xs leading-relaxed text-dim">
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
    <section className="border-t border-line py-20" id="astrologers">
      <div className="mx-auto max-w-5xl px-6">
        <div className="rounded-xl border border-line-strong bg-surface p-8 sm:p-12">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-line-strong bg-accent-wash px-3 py-1 text-2xs font-bold uppercase tracking-widest text-accent-ink">
              Coming soon
            </span>
            <span className="text-xs text-dim">In development</span>
          </div>

          <h2 className="mt-5 max-w-2xl text-balance font-display text-2xl font-bold text-ink sm:text-3xl">
            When you want a second opinion, talk to a real astrologer
          </h2>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
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
              <div key={title} className="space-y-2.5 rounded-lg border border-line bg-cream/40 p-5">
                <span className="flex size-11 items-center justify-center rounded-md border border-line-strong bg-surface text-accent-ink">
                  <Icon className="size-5" />
                </span>
                <h3 className="text-sm font-semibold text-ink">{title}</h3>
                <p className="text-xs leading-relaxed text-muted">{body}</p>
              </div>
            ))}
          </div>

          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
            <a
              href="#form"
              className={buttonClasses("secondary", { className: "gap-2" })}
            >
              Start with your chart <ArrowRight className="size-4" />
            </a>
            <p className="text-xs text-dim">
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
    <section className="border-t border-line bg-cream py-20" id="faq">
      <div className="mx-auto max-w-3xl space-y-10 px-6">
        <SectionHead eyebrow="Questions" title="Before you start" />
        <div className="divide-y divide-line border-y border-line">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-ink marker:hidden">
                {q}
                <span className="shrink-0 text-accent-ink transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-xs leading-relaxed text-muted">{a}</p>
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
    <section className="border-t border-line py-20">
      <div className="mx-auto max-w-2xl space-y-6 px-6 text-center">
        <h2 className="text-balance font-display text-2xl font-bold text-ink sm:text-3xl">
          Your chart takes about a minute
        </h2>
        <p className="text-sm leading-relaxed text-muted">
          Name, date, time and place. No account needed to see it.
        </p>
        <a
          href="#form"
          className={buttonClasses("primary", { className: "gap-2" })}
        >
          <Sparkles className="size-4" />
          Calculate my kundali
          <ArrowRight className="size-4" />
        </a>
      </div>
    </section>
  );
}
