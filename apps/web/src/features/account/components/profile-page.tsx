"use client";

import { useState } from "react";
import Link from "next/link";
import { MessagesSquare, ScrollText, Sparkles } from "lucide-react";

import { useSession, useUpdateProfile } from "@/features/auth/hooks/use-auth";
import {
  AccountCard,
  AccountShell,
  accountButton,
  accountField,
  accountLabel,
} from "@/features/account/components/account-shell";
import { useChatSessions, useSavedKundalis } from "@/features/vault/hooks/use-vault";
import { useTranslation } from "@/lib/i18n/language-context";

/**
 * Who you are on Nakhatra.
 *
 * Only the display name is editable. The email is the sign-in identity and the
 * key Google matches accounts on, so changing it is an account-recovery flow
 * rather than a text field; the role is granted by review, not chosen.
 */
export function ProfilePage() {
  const { t } = useTranslation();
  const { user } = useSession();
  const update = useUpdateProfile();
  const { data: kundalis = [] } = useSavedKundalis();
  const { data: sessions = [] } = useChatSessions();

  // Seeded once. Re-seeding whenever the session object changes would overwrite
  // whatever is being typed.
  const [name, setName] = useState(user?.full_name ?? "");

  const initials = (user?.full_name || user?.email || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <AccountShell title={t.acctProfile}>
      <AccountCard title={t.acctYourAccount}>
        <div className="flex flex-wrap items-center gap-4">
          <span className="grid size-16 shrink-0 place-items-center rounded-full bg-acc text-[20px] font-bold text-ink">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[17px] font-bold text-fg">{user?.full_name}</p>
            <p className="mt-0.5 truncate text-[12.5px] text-mut">{user?.email}</p>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-[11.5px] text-dim">
              <span className="rounded-[6px] border border-white/[0.10] px-2 py-0.5 capitalize">
                {t.acctRole}: {user?.role ?? "seeker"}
              </span>
              {user?.created_at && (
                <span>
                  {t.acctJoined} {joined(user.created_at)}
                </span>
              )}
            </p>
          </div>
        </div>

        <form
          className="mt-6 border-t border-white/[0.07] pt-5"
          onSubmit={(event) => {
            event.preventDefault();
            const full_name = name.trim();
            if (full_name) update.mutate({ full_name });
          }}
        >
          <label className="block">
            <span className={accountLabel}>{t.acctName}</span>
            <input
              required
              autoComplete="name"
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={accountField}
            />
          </label>
          <p className="mt-1.5 text-[11.5px] text-dim">{t.acctNameNote}</p>

          <label className="mt-4 block">
            <span className={accountLabel}>{t.acctEmail}</span>
            {/* Shown, not editable — and disabled rather than hidden, because
                "you cannot change this here" is information. */}
            <input disabled value={user?.email ?? ""} className={accountField} />
          </label>
          <p className="mt-1.5 text-[11.5px] text-dim">{t.acctEmailNote}</p>

          {update.isError && (
            <p role="alert" className="mt-3 text-[12.5px] text-rose-300">
              {update.error.message}
            </p>
          )}

          <div className="mt-5 flex items-center gap-3">
            <button
              type="submit"
              disabled={
                update.isPending || !name.trim() || name.trim() === user?.full_name
              }
              className={accountButton}
            >
              {t.acctSave}
            </button>
            {update.isSuccess && (
              <span className="text-[12.5px] text-emerald-300">{t.acctSaved}</span>
            )}
          </div>
        </form>
      </AccountCard>

      <AccountCard title={t.acctActivity}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat
            href="/dashboard#kundalis"
            icon={<Sparkles className="size-4" />}
            label={t.dashNavLibrary}
            value={kundalis.length}
          />
          <Stat
            href="/reading/choose"
            icon={<ScrollText className="size-4" />}
            label={t.dashNavReading}
            value={kundalis.length}
          />
          <Stat
            href="/reading/live"
            icon={<MessagesSquare className="size-4" />}
            label={t.dashNavLive}
            value={sessions.length}
          />
        </div>
      </AccountCard>
    </AccountShell>
  );
}

function Stat({
  href,
  icon,
  label,
  value,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Link
      href={href}
      className="rounded-[10px] border border-white/[0.09] bg-app p-3.5 transition-colors hover:border-acc/35"
    >
      <span className="flex items-center gap-2 text-acc">{icon}</span>
      <span className="mt-2 block text-[20px] font-bold tabular-nums text-fg">{value}</span>
      <span className="mt-0.5 block truncate text-[11.5px] text-dim">{label}</span>
    </Link>
  );
}

/** The account's creation date, in the reader's own locale. */
function joined(iso: string): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return "";
  return at.toLocaleDateString(undefined, { year: "numeric", month: "long" });
}
