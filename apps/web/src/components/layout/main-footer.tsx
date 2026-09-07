"use client";

import Link from "next/link";
import { useTranslation, type Language } from "@/lib/i18n/language-context";
import { LanguageMenu } from "@/components/ui/language-menu";
import { Globe, ShieldCheck, Compass, Radio, Layers } from "lucide-react";

import { NakhatraMark } from "@/components/ui/nakhatra-mark";

export function MainFooter() {
  const { language, setLanguage, t } = useTranslation();

  return (
    <footer className="border-t border-white/10 bg-[#090A10] text-xs text-[#94A3B8] transition-all">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-white/5">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 group">
              <NakhatraMark className="size-7 text-[#E5A93C] transition group-hover:scale-105" />
              <span className="font-logo font-bold text-sm text-[#F8FAFC]">NAKHATRA</span>
            </Link>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Precision Sidereal Swiss Ephemeris calculations, Vimshottari Dasha timelines, and real-time AI Astrologer.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2.5">
            <h4 className="font-serif text-xs font-bold text-[#F8FAFC] uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="size-3.5 text-[#E5A93C]" /> Features
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#form" className="hover:text-[#F3C766] transition">
                  {t.freeKundali}
                </a>
              </li>
              <li>
                <Link href="/reading" className="hover:text-[#F3C766] transition">
                  {t.vedicReading}
                </Link>
              </li>
              <li>
                <Link href="/reading/live" className="hover:text-[#F3C766] transition flex items-center gap-1.5">
                  <Radio className="size-3 text-rose-400" />
                  Live AI Consultation
                </Link>
              </li>
              <li>
                <Link href="/#astrologers" className="hover:text-[#F3C766] transition flex items-center gap-1.5">
                  Talk to an Astrologer
                  <span className="rounded-full bg-[#E5A93C]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#E5A93C]">
                    Soon
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Vargas & Calculations */}
          <div className="space-y-2.5">
            <h4 className="font-serif text-xs font-bold text-[#F8FAFC] uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-[#E5A93C]" /> Engine Accuracy
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="text-[#94A3B8] flex items-center gap-1.5">
                <Layers className="size-3 text-[#F3C766]" /> Swiss Ephemeris 0.001° Sidereal
              </li>
              <li className="text-[#94A3B8]">Lahiri Ayanamsa Standard</li>
              <li className="text-[#94A3B8]">16 Divisional Vargas (D1 - D60)</li>
            </ul>
          </div>

          {/* Language Switcher */}
          <div className="space-y-2.5">
            <h4 className="font-serif text-xs font-bold text-[#F8FAFC] uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="size-3.5 text-[#E5A93C]" /> Language
            </h4>
            <LanguageMenu dropUp />
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#94A3B8]/70">
          <p>© {new Date().getFullYear()} Nakhatra. Calculated via Swiss Ephemeris Lahiri Sidereal Ayanamsa.</p>
          <p>All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
