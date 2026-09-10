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
          <span className={`text-[11px] text-acc ${eyebrow}`}>Admin</span>
          <h1 className="mt-3 text-[26px] font-bold leading-tight text-fg sm:text-[30px]">
            The desk
          </h1>
          <p className="mt-2 text-[14px] text-mut">
            Tools that are not part of the product. Everything here answers 403 to anyone else.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {TOOLS.map(({ href, icon: Icon, title, blurb, ready }) => (
              <Link
                key={href}
                href={href}
                className="group rounded-[10px] border border-brd bg-panel p-4 transition-colors hover:border-acc/50"
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="size-4 text-acc" />
                  <span className="text-[15px] font-semibold text-fg">{title}</span>
                  {!ready && (
                    <span className="rounded-full border border-brd px-2 py-0.5 text-[10.5px] text-mut">
                      closed
                    </span>
                  )}
                </span>
                <p className="mt-2 text-[13px] leading-[1.7] text-mut">{blurb}</p>
              </Link>
            ))}
          </div>
        </main>
      </AdminOnly>
    </AppShell>
  );
}
