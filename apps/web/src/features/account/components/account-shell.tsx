"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AppShell } from "@/features/dashboard/components/app-shell";
import { useSession } from "@/features/auth/hooks/use-auth";
import { useLatinTracking, useTranslation } from "@/lib/i18n/language-context";

/**
 * The chrome both account pages wear.
 *
 * Profile and Settings are two tabs of one thing, so they share a heading and
 * a switcher rather than being two unrelated screens that happen to be about
 * you. The account dropdown links to both, and until now both links pointed at
 * `#account` — an anchor that existed nowhere.
 */
export function AccountShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const eyebrow = useLatinTracking("uppercase tracking-[0.2em]");
  const pathname = usePathname();
  const { user } = useSession();

  const tab = (href: string, label: string) => (
    <Link
      key={href}
      href={href}
      aria-current={pathname === href ? "page" : undefined}
      className={`rounded-[8px] px-3.5 py-2 text-[13px] transition-colors ${
        pathname === href
          ? "bg-acc/[0.11] font-medium text-acc2"
          : "text-mut hover:bg-fg/[0.04] hover:text-fg"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-[820px] px-5 pb-24 pt-10 sm:px-8">
        <header>
          <span className={`text-[11px] text-acc ${eyebrow}`}>{t.acctYourAccount}</span>
          <h1 className="mt-3 text-[26px] font-bold leading-tight text-fg sm:text-[30px]">
            {title}
          </h1>
          {user && <p className="mt-1.5 text-[13px] text-dim">{user.email}</p>}
        </header>

        <nav className="mt-6 flex gap-1.5 border-b border-white/[0.08] pb-3">
          {tab("/profile", t.acctProfile)}
          {tab("/settings", t.acctSettings)}
        </nav>

        <div className="mt-6 space-y-5">{children}</div>
      </main>
    </AppShell>
  );
}

/** One titled block. The pages are lists of these. */
export function AccountCard({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="rounded-[14px] border border-white/[0.09] bg-panel p-5 sm:p-6">
      <h2 className="text-[11px] uppercase tracking-[0.14em] text-dim">{title}</h2>
      {note && <p className="mt-2 text-[12.5px] leading-[1.7] text-dim">{note}</p>}
      {children && <div className="mt-4">{children}</div>}
    </section>
  );
}

export const accountField =
  "w-full rounded-[8px] border border-white/[0.09] bg-app px-3 py-2.5 text-[13.5px] text-fg placeholder-faint focus:border-acc/45 focus:outline-none disabled:opacity-50";
export const accountLabel = "mb-1.5 block text-[12px] text-mut";
export const accountButton =
  "rounded-[9px] bg-acc px-5 py-2.5 text-[13px] font-bold text-ink transition-colors hover:bg-acc2 disabled:pointer-events-none disabled:opacity-40";
