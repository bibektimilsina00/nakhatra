"use client";

import Link from "next/link";
import {
  ArrowRight,
  HeartHandshake,
  MessagesSquare,
  ScrollText,
  Sparkles,
  Users,
} from "lucide-react";

/**
 * What the platform is, in one screen.
 *
 * Placed directly under the hero because a visitor's first question is "what
 * does this do", not "how accurate is it". Four things it does today and one it
 * is building, each linking to the section that shows it working.
 */
const PILLARS = [
  {
    n: "01",
    Icon: Sparkles,
    title: "Create your kundali",
    body: "Name, date, time and place. Swiss Ephemeris casts the full chart — nine grahas, twelve bhavas, twenty-seven nakshatras and sixteen divisional charts.",
    href: "#chart",
    cta: "See a real chart",
    live: true,
  },
  {
    n: "02",
    Icon: ScrollText,
    title: "Read the analysis",
    body: "Seven written sections on personality, career, relationships, your current dasha and remedies — each one naming the placements it rests on.",
    href: "#reading",
    cta: "Read a sample",
    live: true,
  },
  {
    n: "03",
    Icon: MessagesSquare,
    title: "Talk to the AI astrologer",
    body: "Ask follow-up questions by text or out loud, in English, Nepali or Hindi. It answers from your chart and shows which placement it is reading.",
    href: "#ask",
    cta: "See how it answers",
    live: true,
  },
  {
    n: "04",
    Icon: HeartHandshake,
    title: "Match two charts",
    body: "Ashtakoota milan across all eight kutas for the full 36 gunas, with Manglik dosha checked both sides and cancellation rules applied.",
    href: "#milan",
    cta: "Open Kundali Milan",
    live: true,
  },
  {
    n: "05",
    Icon: Users,
    title: "Consult a real astrologer",
    body: "Find a verified jyotish by tradition, language and speciality. Chat, then speak by audio or video — with your chart already in their hands.",
    href: "#astrologers",
    cta: "What is coming",
    live: false,
  },
];

export function PillarsSection() {
  return (
    <section className="border-t border-line bg-surface py-20" id="platform">
      <div className="mx-auto max-w-6xl space-y-12 px-6">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-accent-ink">
            The platform
          </span>
          <h2 className="text-balance font-display text-2xl font-bold text-ink sm:text-3xl">
            Everything from casting the chart to sitting with an astrologer
          </h2>
          <p className="text-base leading-relaxed text-muted">
            Four things you can do today, and the one we are building next.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map(({ n, Icon, title, body, href, cta, live }) => (
            <Link
              key={n}
              href={href}
              className="group flex flex-col gap-4 rounded-xl border border-line bg-card p-6 shadow-raised transition-colors hover:border-accent/45"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex size-11 items-center justify-center rounded-lg border border-line bg-surface text-accent-ink">
                  <Icon className="size-5" />
                </span>
                {live ? (
                  <span className="font-mono text-xs text-dim">{n}</span>
                ) : (
                  <span className="rounded-full border border-accent/40 bg-accent-tint px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-accent-ink">
                    Soon
                  </span>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
                <p className="text-sm leading-relaxed text-muted">{body}</p>
              </div>

              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-ink transition-colors group-hover:text-accent-ink/80">
                {cta}
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}

          {/* Sixth cell: the throughline, rather than a sixth feature. */}
          <div className="flex flex-col justify-center gap-3 rounded-xl border border-dashed border-line p-6">
            <p className="text-sm leading-relaxed text-muted">
              The chart is computed once and carried through all of it — the reading,
              the conversation, the matching, and eventually the astrologer you sit
              with.
            </p>
            <a
              href="#form"
              className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-ink hover:text-accent-ink"
            >
              Start with your chart
              <ArrowRight className="size-3.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
