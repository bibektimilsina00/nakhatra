"use client";

import Link from "next/link";
import { MessagesSquare } from "lucide-react";

import { AppShell } from "@/features/dashboard/components/app-shell";
import { useSession } from "@/features/auth/hooks/use-auth";
import { useMyConsultations, useWallet } from "@/features/consultations/hooks/use-consultations";
import type { Consultation } from "@/features/consultations/types";
import { formatMinor } from "@/features/consultations/money";
import { buttonClasses } from "@/components/ui/button";
import { assetUrl } from "@/lib/api/client";
import { useLatinTracking, useTranslation } from "@/lib/i18n/language-context";

/**
 * Every conversation this account is part of, newest first — an inbox rather
 * than a table of consultations.
 *
 * The name, the last line and the unread count all come from the list endpoint,
 * so opening this page is one request however many conversations it holds.
 * Both sides of the marketplace see the same screen; which side you are decides
 * whose name is shown.
 */
export function ConsultationsPage() {
  const { t } = useTranslation();
  const eyebrow = useLatinTracking("uppercase tracking-[0.2em]");
  const { user } = useSession();
  const consultations = useMyConsultations();
  const wallet = useWallet();

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-[720px] px-5 pb-24 pt-10 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className={`text-2xs text-accent-ink ${eyebrow}`}>{t.dashJyotish}</span>
            <h1 className="mt-3 text-2xl font-bold leading-tight text-ink sm:text-3xl">
              {t.chatTab}
            </h1>
          </div>
          {wallet.data && (
            <div className="rounded-lg border border-line-strong bg-surface px-4 py-2.5 text-right">
              <span className="block text-2xs uppercase tracking-[0.12em] text-dim">
                {t.consultBalance}
              </span>
              <span className="mt-0.5 block text-base font-bold tabular-nums text-ink">
                {formatMinor(wallet.data.available_minor, wallet.data.currency)}
              </span>
            </div>
          )}
        </div>

        {consultations.isPending ? (
          <div className="mt-8 space-y-2">
            {[0, 1, 2].map((row) => (
              <div
                key={row}
                className="h-[72px] animate-pulse rounded-xl border border-line bg-surface"
              />
            ))}
          </div>
        ) : consultations.data && consultations.data.length > 0 ? (
          <ul className="mt-8 divide-y divide-line overflow-hidden rounded-xl border border-line-strong bg-surface">
            {consultations.data.map((c) => (
              <ConversationRow key={c.id} conversation={c} viewerId={user?.id} />
            ))}
          </ul>
        ) : (
          <div className="mt-8 rounded-xl border border-dashed border-line-strong px-6 py-14 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-full border border-line-strong text-accent-ink">
              <MessagesSquare className="size-5" />
            </span>
            <h2 className="mt-4 text-base font-semibold text-ink">{t.consultNone}</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-[1.75] text-dim">
              {t.consultNoneNote}
            </p>
            <Link href="/dashboard#jyotish" className={`mt-5 inline-block ${buttonClasses("primary")}`}>
              {t.talkToAstrologer}
            </Link>
          </div>
        )}
      </main>
    </AppShell>
  );
}

function ConversationRow({
  conversation: c,
  viewerId,
}: {
  conversation: Consultation;
  viewerId?: string;
}) {
  const { t } = useTranslation();
  // A conversation whose counterpart has no profile name still needs a label;
  // the role reads better than an empty row.
  const name = c.counterpart_name || (viewerId === c.practitioner_user_id ? "—" : t.dashJyotish);
  const scheduled = c.scheduled_at && !c.connected_at;

  return (
    <li>
      <Link
        href={`/consultations/${c.id}`}
        className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-accent-wash"
      >
        {c.counterpart_photo_url ? (
          // Served from our own upload route, not a build-time asset.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={assetUrl(c.counterpart_photo_url)}
            alt=""
            className="size-11 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-tint text-sm font-bold text-accent-ink">
            {name.charAt(0).toUpperCase()}
          </span>
        )}

        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className="truncate text-sm font-semibold text-ink">{name}</span>
            <span className="shrink-0 text-2xs tabular-nums text-dim">
              {when(c.last_message_at ?? c.created_at)}
            </span>
          </span>
          <span className="mt-0.5 flex items-center gap-2">
            <span
              className={`truncate text-xs ${c.unread_count > 0 ? "font-medium text-ink" : "text-dim"}`}
            >
              {c.last_message || t.chatNoMessages}
            </span>
            {c.unread_count > 0 && (
              <span className="ml-auto grid min-w-5 shrink-0 place-items-center rounded-full bg-accent-strong px-1.5 text-2xs font-bold text-white">
                {c.unread_count}
              </span>
            )}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-1.5 text-2xs text-dim">
            <span className="rounded-sm border border-line-strong px-1.5 py-px capitalize">
              {c.medium}
            </span>
            {scheduled ? (
              <span className="rounded-sm border border-accent/35 px-1.5 py-px text-accent-ink">
                {t.chatScheduled} · {when(c.scheduled_at as string)}
              </span>
            ) : (
              <span className="capitalize">{c.state}</span>
            )}
          </span>
        </span>
      </Link>
    </li>
  );
}

/** Today shows a clock, anything older shows a date. */
function when(iso: string): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return "";
  const today = new Date();
  const sameDay =
    at.getDate() === today.getDate() &&
    at.getMonth() === today.getMonth() &&
    at.getFullYear() === today.getFullYear();
  return sameDay
    ? at.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : at.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}
