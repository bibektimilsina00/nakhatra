"use client";

import Link from "next/link";
import { MessagesSquare } from "lucide-react";

import { AppShell } from "@/features/dashboard/components/app-shell";
import { useSession } from "@/features/auth/hooks/use-auth";
import { useMyConsultations, useWallet } from "@/features/consultations/hooks/use-consultations";
import { formatDuration, formatMinor } from "@/features/consultations/money";
import { useLatinTracking, useTranslation } from "@/lib/i18n/language-context";

/** Both sides of the marketplace see this page; which side you are decides the wording. */
export function ConsultationsPage() {
  const { t } = useTranslation();
  const eyebrow = useLatinTracking("uppercase tracking-[0.2em]");
  const { user } = useSession();
  const consultations = useMyConsultations();
  const wallet = useWallet();

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-[860px] px-5 pb-24 pt-10 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className={`text-[11px] text-gold ${eyebrow}`}>{t.dashJyotish}</span>
            <h1 className="mt-3 text-[26px] font-bold leading-tight text-paper sm:text-[30px]">
              {t.consultTitle}
            </h1>
          </div>
          {wallet.data && (
            <div className="rounded-[10px] border border-white/[0.09] bg-card px-4 py-2.5 text-right">
              <span className="block text-[10.5px] uppercase tracking-[0.12em] text-faint">
                {t.consultBalance}
              </span>
              <span className="mt-0.5 block text-[16px] font-bold tabular-nums text-paper">
                {formatMinor(wallet.data.available_minor, wallet.data.currency)}
              </span>
            </div>
          )}
        </div>

        {consultations.isPending ? (
          <div className="mt-8 space-y-3">
            {[0, 1].map((row) => (
              <div
                key={row}
                className="h-[86px] animate-pulse rounded-[12px] border border-white/[0.07] bg-card"
              />
            ))}
          </div>
        ) : consultations.data && consultations.data.length > 0 ? (
          <ul className="mt-8 space-y-3">
            {consultations.data.map((c) => {
              const isPractitioner = user?.id === c.practitioner_user_id;
              return (
                <li key={c.id}>
                  <Link
                    href={`/consultations/${c.id}`}
                    className="flex items-center justify-between gap-4 rounded-[12px] border border-white/[0.09] bg-card p-4 transition-colors hover:border-gold/35"
                  >
                    <span className="min-w-0">
                      <span className="block text-[14px] font-semibold text-paper">
                        {isPractitioner ? t.dashJyotish : t.talkToAstrologer} · {c.medium}
                      </span>
                      <span className="mt-0.5 block text-[11.5px] text-faint">
                        {c.state}
                        {c.billed_seconds > 0 &&
                          ` · ${formatDuration(c.billed_seconds)} · ${formatMinor(c.charged_minor, c.currency)}`}
                      </span>
                    </span>
                    <span className="shrink-0 text-[11.5px] tabular-nums text-muted">
                      {formatMinor(c.rate_per_minute_minor, c.currency)}/{t.consultPerMinute}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mt-8 rounded-[12px] border border-dashed border-white/[0.14] px-6 py-14 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-full border border-white/[0.10] text-gold">
              <MessagesSquare className="size-5" />
            </span>
            <h2 className="mt-4 text-[16px] font-semibold text-paper">{t.consultNone}</h2>
            <p className="mx-auto mt-2 max-w-sm text-[13px] leading-[1.75] text-faint">
              {t.consultNoneNote}
            </p>
          </div>
        )}
      </main>
    </AppShell>
  );
}
