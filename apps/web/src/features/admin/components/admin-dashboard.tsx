"use client";

import Link from "next/link";
import { Clapperboard, ShieldCheck } from "lucide-react";

import { AdminOnly } from "@/features/admin/components/admin-only";
import { AppShell } from "@/features/dashboard/components/app-shell";
import { MARKETPLACE_LIVE } from "@/features/practitioners/marketplace";
import { useLatinTracking } from "@/lib/i18n/language-context";

/**
 * The admin desk.
 *
 * One door to the tools that are not part of the product — the things whoever
 * runs Nakhatra needs and nobody else may see. It is a list of links on
 * purpose: each tool owns its own page, and a dashboard that summarises them
 * becomes a second place to keep in step with what they do.
 */
const TOOLS = [
  {
    href: "/admin/studio",
    icon: Clapperboard,
    title: "Rasifal studio",
    blurb:
      "The day's two TikToks — twelve slides, the Nepali voice, and the captions to paste. One button.",
    ready: true,
  },
  {
    href: "/admin/practitioners",
    icon: ShieldCheck,
    title: "Practitioner applications",
    blurb: "Read what an applicant sent, then approve or reject it.",
    ready: MARKETPLACE_LIVE,
  },
];

export function AdminDashboard() {
  const eyebrow = useLatinTracking("uppercase tracking-[0.2em]");

  return (
    <AppShell>
      <AdminOnly>
        <main className="mx-auto w-full max-w-[900px] px-5 pt-10 pb-24 sm:px-8">
          <span className={`text-2xs font-semibold text-accent-ink ${eyebrow}`}>Admin</span>
          <h1 className="mt-3 text-2xl font-bold leading-tight text-ink sm:text-3xl">
            The desk
          </h1>
          <p className="mt-2 text-sm text-muted">
            Tools that are not part of the product. Everything here answers 403 to anyone else.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {TOOLS.map(({ href, icon: Icon, title, blurb, ready }) => (
              <Link
                key={href}
                href={href}
                className="group rounded-lg border border-line-strong bg-surface p-4 transition-colors hover:border-accent/50"
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="size-4 text-accent-ink" />
                  <span className="text-base font-semibold text-ink">{title}</span>
                  {!ready && (
                    <span className="rounded-full border border-line px-2 py-0.5 text-2xs text-muted">
                      closed
                    </span>
                  )}
                </span>
                <p className="mt-2 text-xs leading-relaxed text-muted">{blurb}</p>
              </Link>
            ))}
          </div>
        </main>
      </AdminOnly>
    </AppShell>
  );
}
