"use client";

import Link from "next/link";
import { MessagesSquare } from "lucide-react";

import { AppShell } from "@/features/dashboard/components/app-shell";
import { useSession } from "@/features/auth/hooks/use-auth";
import { useMyConsultations, useWallet } from "@/features/consultations/hooks/use-consultations";
import type { Consultation } from "@/features/consultations/types";
import { formatMinor } from "@/features/consultations/money";
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
            <span className={`text-[11px] text-acc ${eyebrow}`}>{t.dashJyotish}</span>
            <h1 className="mt-3 text-[26px] font-bold leading-tight text-fg sm:text-[30px]">
              {t.chatTab}
            </h1>
          </div>
          {wallet.data && (
            <div className="rounded-[10px] border border-white/[0.09] bg-panel px-4 py-2.5 text-right">
              <span className="block text-[10.5px] uppercase tracking-[0.12em] text-dim">
                {t.consultBalance}
              </span>
              <span className="mt-0.5 block text-[16px] font-bold tabular-nums text-fg">
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
                className="h-[72px] animate-pulse rounded-[12px] border border-white/[0.07] bg-panel"
              />
            ))}
          </div>
        ) : consultations.data && consultations.data.length > 0 ? (
          <ul className="mt-8 divide-y divide-white/[0.06] overflow-hidden rounded-[12px] border border-white/[0.09] bg-panel">
            {consultations.data.map((c) => (
              <ConversationRow key={c.id} conversation={c} viewerId={user?.id} />
            ))}
          </ul>
        ) : (
          <div className="mt-8 rounded-[12px] border border-dashed border-white/[0.14] px-6 py-14 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-full border border-white/[0.10] text-acc">
              <MessagesSquare className="size-5" />
            </span>
            <h2 className="mt-4 text-[16px] font-semibold text-fg">{t.consultNone}</h2>
            <p className="mx-auto mt-2 max-w-sm text-[13px] leading-[1.75] text-dim">
              {t.consultNoneNote}
            </p>
            <Link
              href="/dashboard#jyotish"
              className="mt-5 inline-block rounded-[9px] bg-acc px-4 py-2 text-[13px] font-semibold text-ink"
            >
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
        className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-fg/[0.03]"
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
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-acc/[0.12] text-[14px] font-bold text-acc">
            {name.charAt(0).toUpperCase()}
          </span>
        )}

        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className="truncate text-[14px] font-semibold text-fg">{name}</span>
            <span className="shrink-0 text-[11px] tabular-nums text-dim">
              {when(c.last_message_at ?? c.created_at)}
            </span>
          </span>
          <span className="mt-0.5 flex items-center gap-2">
            <span
              className={`truncate text-[12.5px] ${c.unread_count > 0 ? "font-medium text-fg" : "text-dim"}`}
            >
              {c.last_message || t.chatNoMessages}
            </span>
            {c.unread_count > 0 && (
              <span className="ml-auto grid min-w-5 shrink-0 place-items-center rounded-full bg-acc px-1.5 text-[10.5px] font-bold text-ink">
                {c.unread_count}
              </span>
            )}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[10.5px] text-dim">
            <span className="rounded-[5px] border border-white/[0.10] px-1.5 py-px capitalize">
              {c.medium}
            </span>
            {scheduled ? (
              <span className="rounded-[5px] border border-acc/35 px-1.5 py-px text-acc2">
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
