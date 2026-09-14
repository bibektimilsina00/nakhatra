"use client";

import Link from "next/link";
import { Clapperboard, ShieldCheck } from "lucide-react";

import { AdminOnly } from "@/features/admin/components/admin-only";
import { useAdminStats } from "@/features/admin/hooks/use-admin";
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

function StatCard({ label, value, subLabel }: { label: string; value: number | string; subLabel?: string }) {
  return (
    <div className="rounded-lg border border-line-strong bg-surface p-4">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className="mt-2 text-2xl font-bold text-ink">{value}</p>
      {subLabel && <p className="mt-1 text-xs text-muted">{subLabel}</p>}
    </div>
  );
}

function Overview() {
  const { data: stats, isLoading, isError } = useAdminStats();

  if (isLoading) {
    return (
      <div className="mt-8 animate-pulse rounded-xl border border-line-strong bg-surface p-6">
        <div className="h-5 w-32 rounded bg-line-strong" />
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-line-strong" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="mt-8 rounded-xl border border-line-strong bg-surface p-6 text-center text-sm text-muted">
        Failed to load overview.
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="mb-4 text-sm font-semibold text-ink">Overview</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard 
          label="Users" 
          value={stats.total_users} 
          subLabel={`+${stats.users_last_7_days} this week`} 
        />
        <StatCard 
          label="Chat Sessions" 
          value={stats.total_chat_sessions} 
          subLabel={`${stats.total_chat_messages} messages`} 
        />
        <StatCard 
          label="Saved Kundalis" 
          value={stats.total_saved_kundalis} 
        />
        <StatCard 
          label="Consultations" 
          value={stats.total_consultations} 
        />
        {MARKETPLACE_LIVE && (
          <StatCard 
            label="Pending Applications" 
            value={stats.practitioner_applications.pending}
            subLabel={`${stats.practitioner_applications.approved} approved`}
          />
        )}
      </div>
    </div>
  );
}

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

          <Overview />

          <div className="mt-10">
            <h2 className="mb-4 text-sm font-semibold text-ink">Tools</h2>
            <div className="grid gap-3 sm:grid-cols-2">
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
          </div>
        </main>
      </AdminOnly>
    </AppShell>
  );
}
