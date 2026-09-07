"use client";

import Link from "next/link";
import { ZODIAC } from "./zodiac";
import { useTranslation } from "@/lib/i18n/language-context";
import { LanguageMenu } from "@/components/ui/language-menu";

const CATEGORIES = [
  "Horoscope", "Kundali", "Matching", "Panchang", "Dasha",
  "Remedies", "Calculators", "Learn",
] as const;

const QUICK_LINKS = [
  ["Free Kundali", "/kundali"],
  ["Kundali Matching", "/kundali/matching"],
  ["Daily Horoscope", "/horoscope"],
  ["Panchang Today", "/panchang"],
  ["Talk to Astrologer", "/reading/live"],
] as const;

export function SiteHeader() {
  const { t } = useTranslation();

  return (
    <header className="border-b border-line-strong bg-surface">
      {/* utility bar */}
      <div className="hero-saffron">
        <div className="mx-auto flex w-full max-w-[1180px] flex-wrap items-center justify-between gap-3 px-4 py-2">
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-on-accent">
            {["Rashifal", "Kundali", "Horoscope 2026", "Panchang", "Calendar"].map(
              (item) => (
                <Link key={item} href="#" className="hover:underline">
                  {item}
                </Link>
              ),
            )}
          </nav>
          <div className="flex items-center gap-2.5">
            {/* Global Language Switcher */}
            <LanguageMenu />

            <Link
              href="/reading"
              className="rounded-sm bg-[#E5A93C] px-2.5 py-1 text-2xs font-bold uppercase tracking-wide text-[#090A10] hover:bg-[#F3C766] transition"
            >
              {t.vedicReading}
            </Link>
            <Link
              href="/kundali"
              className="rounded-sm bg-white px-3 py-1 text-xs font-semibold text-accent-ink"
            >
              {t.freeKundali}
            </Link>
          </div>
        </div>
      </div>

      {/* brand + zodiac grid */}
      <div className="mx-auto flex w-full max-w-[1180px] flex-wrap items-center gap-x-8 gap-y-4 px-4 py-4">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-sm bg-accent text-lg leading-none text-on-accent">
            ✳
          </span>
          <span className="leading-tight">
            <span className="block font-display text-lg font-bold tracking-tight text-fg">
              {t.brandName}
            </span>
            <span className="block text-2xs font-medium uppercase tracking-[0.16em] text-accent-ink">
              {t.vedicAstrology}
            </span>
          </span>
        </Link>

        <ul className="grid flex-1 grid-cols-4 gap-px overflow-hidden rounded-sm border border-line-strong bg-line-strong sm:grid-cols-6 lg:grid-cols-12">
          {ZODIAC.map((sign) => (
            <li key={sign.name}>
              <Link
                href="#"
                title={`${sign.name} · ${sign.sa}`}
                className="flex flex-col items-center gap-0.5 bg-surface px-1 py-2 transition duration-200 hover:bg-accent-wash"
              >
                <span className="text-base leading-none text-accent-ink">
                  {sign.glyph}
                </span>
                <span className="text-2xs font-medium uppercase tracking-wide text-muted">
                  {sign.name.slice(0, 3)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* category nav */}
      <nav className="border-t border-line bg-cream">
        <ul className="mx-auto flex w-full max-w-[1180px] flex-wrap gap-x-6 gap-y-1 px-4 py-2">
          {CATEGORIES.map((item) => (
            <li key={item}>
              <Link
                href="#"
                className="text-sm font-medium text-fg transition duration-200 hover:text-accent-ink"
              >
                {item}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* quick links */}
      <div className="border-t border-line bg-surface">
        <ul className="mx-auto flex w-full max-w-[1180px] gap-2 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {QUICK_LINKS.map(([label, href]) => (
            <li key={label}>
              <Link
                href={href}
                className="block whitespace-nowrap rounded-sm border border-line-strong px-3 py-1.5 text-xs text-muted transition duration-200 hover:border-accent-strong hover:bg-accent-wash hover:text-accent-ink"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
