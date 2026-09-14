"use client";

import { useAdminStats } from "@/features/admin/hooks/use-admin";
import { MARKETPLACE_LIVE } from "@/features/practitioners/marketplace";
import { useLatinTracking } from "@/lib/i18n/language-context";

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
          label="Guest Kundalis" 
          value={stats.total_guest_kundalis_all_time} 
          subLabel={`+${stats.total_guest_kundalis_last_7_days} this week`} 
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
    <main className="mx-auto w-full max-w-[900px] px-5 pt-10 pb-24 sm:px-8">
      <span className={`text-2xs font-semibold text-accent-ink ${eyebrow}`}>Admin</span>
      <h1 className="mt-3 text-2xl font-bold leading-tight text-ink sm:text-3xl">
        The desk
      </h1>
      <p className="mt-2 text-sm text-muted">
        Workspace overview and tools.
      </p>

      <Overview />
    </main>
  );
}
