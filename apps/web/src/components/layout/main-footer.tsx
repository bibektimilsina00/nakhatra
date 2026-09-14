"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/language-context";
import { LanguageMenu } from "@/components/ui/language-menu";
import { Globe, ShieldCheck, Compass, Radio, Layers } from "lucide-react";

import { NakhatraMark } from "@/components/ui/nakhatra-mark";

export function MainFooter() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-line-strong bg-surface text-xs text-muted transition-all">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-line">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 group">
              <NakhatraMark className="size-7 text-accent-ink transition group-hover:scale-105" />
              <span className="font-display font-bold text-sm text-ink">NAKHATRA</span>
            </Link>
            <p className="text-xs text-muted leading-relaxed">
              Precision Sidereal Swiss Ephemeris calculations, Vimshottari Dasha timelines, and real-time AI Astrologer.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2.5">
            <h4 className="font-display text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="size-3.5 text-accent-ink" /> Features
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#form" className="hover:text-accent-ink transition">
                  {t.freeKundali}
                </a>
              </li>
              <li>
                <Link href="/reading" className="hover:text-accent-ink transition">
                  {t.vedicReading}
                </Link>
              </li>
              <li>
                <Link href="/reading/live" className="hover:text-accent-ink transition flex items-center gap-1.5">
                  <Radio className="size-3 text-danger-ink" />
                  Live AI Consultation
                </Link>
              </li>
              <li>
                <Link href="/#astrologers" className="hover:text-accent-ink transition flex items-center gap-1.5">
                  Talk to an Astrologer
                  <span className="rounded-full bg-accent-wash px-1.5 py-0.5 text-2xs font-bold uppercase tracking-wide text-accent-ink">
                    Soon
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Vargas & Calculations */}
          <div className="space-y-2.5">
            <h4 className="font-display text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-accent-ink" /> Engine Accuracy
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="text-muted flex items-center gap-1.5">
                <Layers className="size-3 text-accent-ink" /> Swiss Ephemeris 0.001° Sidereal
              </li>
              <li className="text-muted">Lahiri Ayanamsa Standard</li>
              <li className="text-muted">16 Divisional Vargas (D1 - D60)</li>
            </ul>
          </div>

          {/* Language Switcher */}
          <div className="space-y-2.5">
            <h4 className="font-display text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="size-3.5 text-accent-ink" /> Language
            </h4>
            <LanguageMenu dropUp />
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-2xs text-dim">
          <p>© {new Date().getFullYear()} Nakhatra. Calculated via Swiss Ephemeris Lahiri Sidereal Ayanamsa.</p>
          <p>All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
