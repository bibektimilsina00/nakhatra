"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useSession } from "@/features/auth/hooks/use-auth";
import { buttonClasses } from "@/components/ui/button";
import { LANGUAGES, LanguageMenu } from "@/components/ui/language-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useLatinTracking, useMarketing, useTranslation } from "@/lib/i18n/language-context";

/** The same three languages as plain text — for the mobile panel, where a
 *  dropdown inside an open panel is one layer too many. */
function LangStrip({ className = "" }: { className?: string }) {
  const { language, setLanguage } = useTranslation();
  return (
    <span className={className}>
      {LANGUAGES.map((l, i) => (
        <span key={l.code}>
          {i > 0 && <span className="mx-1 text-dim" aria-hidden> · </span>}
          <button
            type="button"
            onClick={() => setLanguage(l.code)}
            aria-pressed={language === l.code}
            className={`min-h-11 py-2 transition-colors hover:text-ink ${language === l.code ? "text-accent-ink" : "text-dim"}`}
          >
            {l.code === "en" ? "EN" : l.nativeName}
          </button>
        </span>
      ))}
    </span>
  );
}

/**
 * The site header: two dropdown menus, four links, and a mobile panel.
 *
 * Menus open on hover and on click, close on Escape, on an outside click,
 * and when focus leaves them — a hover-only menu is unreachable by
 * keyboard, and a panel hidden with opacity alone still takes focus.
 */
export function SiteHeader() {
  const navRef = useRef<HTMLElement>(null);
  const [mobOpen, setMobOpen] = useState(false);
  const { user } = useSession();
  const nav = useMarketing().nav;
  const menu = useMarketing().menu;
  const badge = useLatinTracking("uppercase tracking-[0.12em]");

  useEffect(() => {
    const root = navRef.current;
    if (!root) return;
    const menus = [...root.querySelectorAll<HTMLElement>(".navmenu")];
    const timers = new Map<HTMLElement, number>();

    const set = (m: HTMLElement, open: boolean) => {
      m.dataset.open = String(open);
      m.querySelector(".navbtn")?.setAttribute("aria-expanded", String(open));
    };
    const closeAll = (except: HTMLElement | null) =>
      menus.forEach((m) => m !== except && set(m, false));

    const off: Array<() => void> = [];
    menus.forEach((m) => {
      const btn = m.querySelector<HTMLElement>(".navbtn");
      const enter = () => {
        clearTimeout(timers.get(m));
        closeAll(m);
        set(m, true);
      };
      // A short delay, or the diagonal move from button into panel closes it.
      const leave = () => timers.set(m, window.setTimeout(() => set(m, false), 120));
      const click = (e: Event) => {
        e.preventDefault();
        const open = m.dataset.open !== "true";
        closeAll(m);
        set(m, open);
      };
      const blur = (e: FocusEvent) => {
        if (!m.contains(e.relatedTarget as Node)) set(m, false);
      };
      m.addEventListener("pointerenter", enter);
      m.addEventListener("pointerleave", leave);
      m.addEventListener("focusout", blur);
      btn?.addEventListener("click", click);
      off.push(() => {
        m.removeEventListener("pointerenter", enter);
        m.removeEventListener("pointerleave", leave);
        m.removeEventListener("focusout", blur);
        btn?.removeEventListener("click", click);
      });
    });

    const esc = (e: KeyboardEvent) => e.key === "Escape" && closeAll(null);
    const outside = (e: MouseEvent) =>
      !(e.target as HTMLElement).closest(".navmenu") && closeAll(null);
    addEventListener("keydown", esc);
    addEventListener("click", outside);

    return () => {
      off.forEach((f) => f());
      timers.forEach(clearTimeout);
      removeEventListener("keydown", esc);
      removeEventListener("click", outside);
    };
  }, []);

  return (
    <div ref={navRef as React.RefObject<HTMLDivElement>}>
      <header
        id="hdr"
        className="fixed inset-x-0 top-0 z-50 transition-all duration-300 border-b border-line bg-surface/90 backdrop-blur"
      >
        <div className="mx-auto flex max-w-[1360px] items-center justify-between px-8 py-4">
          <div className="flex items-center gap-9">
          <a href="#top" className="flex items-center gap-2.5">
            <svg viewBox="0 0 100 100" className="size-7 text-accent-ink" fill="none" stroke="currentColor">
              <g strokeWidth="3.2" strokeLinejoin="round"><rect x="12" y="12" width="76" height="76" rx="1.5"/><path d="M50 12 L88 50 L50 88 L12 50 Z"/><path d="M12 12 L88 88 M88 12 L12 88" strokeWidth="2" opacity=".55"/></g>
              <path d="M50 12 L69 31 L50 50 L31 31 Z" fill="currentColor" stroke="none"/>
            </svg>
            <span className="font-display text-sm font-bold tracking-[0.18em] text-ink">NAKHATRA</span>
          </a>

          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
            <div className="navmenu relative">
              <button type="button" className="navbtn flex min-h-11 items-center gap-1.5 rounded-md px-3 py-2 text-sm text-muted transition-colors hover:text-ink" aria-expanded="false" aria-haspopup="true">{nav.features} <svg className="navchev size-3 transition-transform" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 4.5 6 7.5l3-3"/></svg></button>
              <div className="navpanel absolute left-0 top-full pt-3">
                <div className="w-[560px] rounded-lg border border-line bg-surface/95 p-2 shadow-overlay backdrop-blur-xl">
                  <div className="grid grid-cols-2 gap-0.5"><a href="#chart" className="group/i flex gap-3 rounded-md p-2.5 transition-colors hover:bg-cream/40">
                  <span className="mt-px shrink-0 text-dim transition-colors group-hover/i:text-accent-ink"><svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="1.5"/><path d="M12 3.5 20.5 12 12 20.5 3.5 12Z"/></svg></span>
                  <span className="min-w-0">
                    <span className="flex items-center text-sm font-medium text-ink">{menu.features[0].title}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-dim">{menu.features[0].body}</span>
                  </span>
                </a><a href="#reading" className="group/i flex gap-3 rounded-md p-2.5 transition-colors hover:bg-cream/40">
                  <span className="mt-px shrink-0 text-dim transition-colors group-hover/i:text-accent-ink"><svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5v-13Z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5v-13Z"/></svg></span>
                  <span className="min-w-0">
                    <span className="flex items-center text-sm font-medium text-ink">{menu.features[1].title}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-dim">{menu.features[1].body}</span>
                  </span>
                </a><a href="#ask" className="group/i flex gap-3 rounded-md p-2.5 transition-colors hover:bg-cream/40">
                  <span className="mt-px shrink-0 text-dim transition-colors group-hover/i:text-accent-ink"><svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12a7.5 7.5 0 0 1-10.9 6.7L4 20l1.3-4.1A7.5 7.5 0 1 1 20 12Z"/></svg></span>
                  <span className="min-w-0">
                    <span className="flex items-center text-sm font-medium text-ink">{menu.features[2].title}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-dim">{menu.features[2].body}</span>
                  </span>
                </a><a href="#milan" className="group/i flex gap-3 rounded-md p-2.5 transition-colors hover:bg-cream/40">
                  <span className="mt-px shrink-0 text-dim transition-colors group-hover/i:text-accent-ink"><svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20s-7-4.2-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.8-7 9-7 9Z"/></svg></span>
                  <span className="min-w-0">
                    <span className="flex items-center text-sm font-medium text-ink">{menu.features[3].title}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-dim">{menu.features[3].body}</span>
                  </span>
                </a><a href="#astrologers" className="group/i flex gap-3 rounded-md p-2.5 transition-colors hover:bg-cream/40">
                  <span className="mt-px shrink-0 text-dim transition-colors group-hover/i:text-accent-ink"><svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19.5a5.5 5.5 0 0 1 11 0"/><path d="M16.5 6.5a3.2 3.2 0 0 1 0 6"/><path d="M18 19.5a5.5 5.5 0 0 0-2-4.3"/></svg></span>
                  <span className="min-w-0">
                    <span className="flex items-center text-sm font-medium text-ink">{menu.features[4].title}<span className={`ml-2 rounded-md border border-accent-strong/40 px-1.5 py-0.5 font-mono text-2xs font-bold text-accent-ink ${badge}`}>{nav.soon}</span></span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-dim">{menu.features[4].body}</span>
                  </span>
                </a></div>
                  <div className="mt-1 flex items-center justify-between gap-4 rounded-md border-t border-line px-3 py-2.5">
                    <span className="text-xs text-dim">{menu.featuresNote}</span>
                    <a href="#form" className="shrink-0 text-xs font-semibold text-accent-ink transition-colors hover:opacity-80">{menu.startFreeArrow}</a>
                  </div>
                </div>
              </div>
            </div>

            <Link href="/rasifal" className="flex min-h-11 items-center rounded-md px-3 py-2 text-sm text-muted transition-colors hover:text-ink">{nav.rasifal}</Link>

            <Link href="/consultations" className="flex min-h-11 items-center rounded-md px-3 py-2 text-sm text-muted transition-colors hover:text-ink">{nav.consultation}</Link>

            <div className="navmenu relative">
              <button type="button" className="navbtn flex min-h-11 items-center gap-1.5 rounded-md px-3 py-2 text-sm text-muted transition-colors hover:text-ink" aria-expanded="false" aria-haspopup="true">{nav.kundali} <svg className="navchev size-3 transition-transform" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 4.5 6 7.5l3-3"/></svg></button>
              <div className="navpanel absolute left-0 top-full pt-3">
                <div className="w-[340px] rounded-lg border border-line bg-surface/95 p-2 shadow-overlay backdrop-blur-xl">
                  <a href="/kundali" className="group/i flex gap-3 rounded-md p-2.5 transition-colors hover:bg-cream/40">
                    <span className="mt-px shrink-0 text-dim transition-colors group-hover/i:text-accent-ink"><svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="1.5"/><path d="M12 3.5 20.5 12 12 20.5 3.5 12Z"/></svg></span>
                    <span className="min-w-0">
                      <span className="flex items-center text-sm font-medium text-ink">{nav.kundaliCreateTitle}</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-dim">{nav.kundaliCreateBody}</span>
                    </span>
                  </a>
                  <a href="/milan" className="group/i flex gap-3 rounded-md p-2.5 transition-colors hover:bg-cream/40">
                    <span className="mt-px shrink-0 text-dim transition-colors group-hover/i:text-accent-ink"><svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20s-7-4.2-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.8-7 9-7 9Z"/></svg></span>
                    <span className="min-w-0">
                      <span className="flex items-center text-sm font-medium text-ink">{nav.kundaliMatchTitle}</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-dim">{nav.kundaliMatchBody}</span>
                    </span>
                  </a>
                </div>
              </div>
            </div>

            <Link href="/patro" className="flex min-h-11 items-center rounded-md px-3 py-2 text-sm text-muted transition-colors hover:text-ink">{nav.patro}</Link>
          </nav>
          </div>

          <div className="flex items-center gap-2.5 text-sm">
            <div className="hidden items-center gap-1.5 xl:flex">
              <LanguageMenu />
              <ThemeToggle />
            </div>
            {user ? (
        <Link
          href="/dashboard"
          className={buttonClasses("primary", { className: "hidden px-7 sm:inline-flex" })}
        >
          {nav.dashboard}
        </Link>
      ) : (
        <>
          <Link
            href="/login"
            className="hidden min-h-11 items-center rounded-md border border-line-strong bg-surface px-6 py-2 text-sm font-medium text-muted transition-colors hover:border-line-strong hover:bg-cream hover:text-ink sm:inline-flex"
          >
            {nav.signIn}
          </Link>
          <a
            href="#form"
            className={buttonClasses("primary", { className: "px-7" })}
          >
            {nav.startFree}
          </a>
        </>
      )}
            <button type="button" id="mobbtn" onClick={() => setMobOpen((v) => !v)} className="-mr-1 flex min-h-11 min-w-11 items-center justify-center rounded-md p-1.5 text-muted transition-colors hover:text-ink lg:hidden" aria-expanded="false" aria-controls="mobnav" aria-label="Menu">
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
            </button>
          </div>
        </div>

        {/* The links above are useless on a phone without this. */}
        <div id="mobnav" hidden={!mobOpen} className="border-t border-line bg-surface/95 backdrop-blur-xl lg:hidden">
          <nav className="mx-auto max-w-[1360px] px-8 py-5" aria-label="Mobile" onClick={(e) => {
              if ((e.target as HTMLElement).closest("a")) setMobOpen(false);
            }}>
            <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2"><a href="#chart" className="group/i flex gap-3 rounded-md p-2.5 transition-colors hover:bg-cream/40">
                  <span className="mt-px shrink-0 text-dim transition-colors group-hover/i:text-accent-ink"><svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="1.5"/><path d="M12 3.5 20.5 12 12 20.5 3.5 12Z"/></svg></span>
                  <span className="min-w-0">
                    <span className="flex items-center text-sm font-medium text-ink">{menu.features[0].title}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-dim">{menu.features[0].body}</span>
                  </span>
                </a><a href="#reading" className="group/i flex gap-3 rounded-md p-2.5 transition-colors hover:bg-cream/40">
                  <span className="mt-px shrink-0 text-dim transition-colors group-hover/i:text-accent-ink"><svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5v-13Z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5v-13Z"/></svg></span>
                  <span className="min-w-0">
                    <span className="flex items-center text-sm font-medium text-ink">{menu.features[1].title}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-dim">{menu.features[1].body}</span>
                  </span>
                </a><a href="#ask" className="group/i flex gap-3 rounded-md p-2.5 transition-colors hover:bg-cream/40">
                  <span className="mt-px shrink-0 text-dim transition-colors group-hover/i:text-accent-ink"><svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12a7.5 7.5 0 0 1-10.9 6.7L4 20l1.3-4.1A7.5 7.5 0 1 1 20 12Z"/></svg></span>
                  <span className="min-w-0">
                    <span className="flex items-center text-sm font-medium text-ink">{menu.features[2].title}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-dim">{menu.features[2].body}</span>
                  </span>
                </a><a href="#milan" className="group/i flex gap-3 rounded-md p-2.5 transition-colors hover:bg-cream/40">
                  <span className="mt-px shrink-0 text-dim transition-colors group-hover/i:text-accent-ink"><svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20s-7-4.2-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.8-7 9-7 9Z"/></svg></span>
                  <span className="min-w-0">
                    <span className="flex items-center text-sm font-medium text-ink">{menu.features[3].title}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-dim">{menu.features[3].body}</span>
                  </span>
                </a><a href="#astrologers" className="group/i flex gap-3 rounded-md p-2.5 transition-colors hover:bg-cream/40">
                  <span className="mt-px shrink-0 text-dim transition-colors group-hover/i:text-accent-ink"><svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19.5a5.5 5.5 0 0 1 11 0"/><path d="M16.5 6.5a3.2 3.2 0 0 1 0 6"/><path d="M18 19.5a5.5 5.5 0 0 0-2-4.3"/></svg></span>
                  <span className="min-w-0">
                    <span className="flex items-center text-sm font-medium text-ink">{menu.features[4].title}<span className={`ml-2 rounded-md border border-accent-strong/40 px-1.5 py-0.5 font-mono text-2xs font-bold text-accent-ink ${badge}`}>{nav.soon}</span></span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-dim">{menu.features[4].body}</span>
                  </span>
                </a><a href="/kundali" className="group/i flex gap-3 rounded-md p-2.5 transition-colors hover:bg-cream/40">
                  <span className="mt-px shrink-0 text-dim transition-colors group-hover/i:text-accent-ink"><svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="1.5"/><path d="M12 3.5 20.5 12 12 20.5 3.5 12Z"/></svg></span>
                  <span className="min-w-0">
                    <span className="flex items-center text-sm font-medium text-ink">{nav.kundaliCreateTitle}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-dim">{nav.kundaliCreateBody}</span>
                  </span>
                </a><a href="/milan" className="group/i flex gap-3 rounded-md p-2.5 transition-colors hover:bg-cream/40">
                  <span className="mt-px shrink-0 text-dim transition-colors group-hover/i:text-accent-ink"><svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20s-7-4.2-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.8-7 9-7 9Z"/></svg></span>
                  <span className="min-w-0">
                    <span className="flex items-center text-sm font-medium text-ink">{nav.kundaliMatchTitle}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-dim">{nav.kundaliMatchBody}</span>
                  </span>
                </a></div>
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-4 text-sm">
              <Link href="/rasifal" className="hover:text-ink">{nav.rasifal}</Link>
              <Link href="/patro" className="hover:text-ink">{nav.patro}</Link>
              <Link href="/consultations" className="text-muted transition-colors hover:text-ink">{nav.consultation}</Link>
              {user ? (
                <Link href="/dashboard" className="text-muted transition-colors hover:text-ink">
                  {nav.dashboard}
                </Link>
              ) : (
                <Link href="/login" className="text-muted transition-colors hover:text-ink">
                  {nav.signIn}
                </Link>
              )}
              <span className="ml-auto flex items-center gap-3"><LangStrip className="font-mono text-2xs" /></span>
            </div>
          </nav>
        </div>
      </header>
    </div>
  );
}
