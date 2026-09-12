"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cardClasses } from "@/components/ui/card";
import { tabClasses } from "@/components/ui/tabs";
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
      className={tabClasses(pathname === href)}
    >
      {label}
    </Link>
  );

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-[820px] px-5 pb-24 pt-10 sm:px-8">
        <header>
          <span className={`text-2xs text-accent-strong ${eyebrow}`}>{t.acctYourAccount}</span>
          <h1 className="mt-3 text-2xl font-bold leading-tight text-ink sm:text-3xl">
            {title}
          </h1>
          {user && <p className="mt-1.5 text-sm text-dim">{user.email}</p>}
        </header>

        <nav className="mt-6 flex gap-6 border-b border-line">
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
    <section className={cardClasses()}>
      <h2 className="text-2xs uppercase tracking-[0.14em] text-dim">{title}</h2>
      {note && <p className="mt-2 text-xs leading-[1.7] text-dim">{note}</p>}
      {children && <div className="mt-4">{children}</div>}
    </section>
  );
}

/** Sits above every field in this feature — design.md §5 Inputs: label always visible above the field. */
export const accountLabel = "mb-1.5 block text-xs text-muted";
