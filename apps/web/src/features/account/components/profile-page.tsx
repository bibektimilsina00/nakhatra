"use client";

import { useState } from "react";
import Link from "next/link";
import { MessagesSquare, ScrollText, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cardClasses } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSession, useUpdateProfile } from "@/features/auth/hooks/use-auth";
import { AccountCard, AccountShell, accountLabel } from "@/features/account/components/account-shell";
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
          <span className="grid size-16 shrink-0 place-items-center rounded-full bg-accent-tint text-xl font-bold text-accent-ink">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-ink">{user?.full_name}</p>
            <p className="mt-0.5 truncate text-sm text-muted">{user?.email}</p>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-dim">
              <span className="rounded-sm border border-line-strong px-2 py-0.5 capitalize">
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
          className="mt-6 border-t border-line pt-5"
          onSubmit={(event) => {
            event.preventDefault();
            const full_name = name.trim();
            if (full_name) update.mutate({ full_name });
          }}
        >
          <label className="block">
            <span className={accountLabel}>{t.acctName}</span>
            <Input
              required
              autoComplete="name"
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <p className="mt-1.5 text-xs text-dim">{t.acctNameNote}</p>

          <label className="mt-4 block">
            <span className={accountLabel}>{t.acctEmail}</span>
            {/* Shown, not editable — and disabled rather than hidden, because
                "you cannot change this here" is information. */}
            <Input disabled value={user?.email ?? ""} />
          </label>
          <p className="mt-1.5 text-xs text-dim">{t.acctEmailNote}</p>

          {update.isError && (
            <p role="alert" className="mt-3 text-sm text-danger">
              {update.error.message}
            </p>
          )}

          <div className="mt-5 flex items-center gap-3">
            <Button
              type="submit"
              disabled={
                update.isPending || !name.trim() || name.trim() === user?.full_name
              }
            >
              {t.acctSave}
            </Button>
            {update.isSuccess && (
              <span className="text-sm text-success">{t.acctSaved}</span>
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
      className={cardClasses({ className: "transition-colors hover:border-accent" })}
    >
      <span className="flex items-center gap-2 text-accent-strong">{icon}</span>
      <span className="mt-2 block text-xl font-bold tabular-nums text-ink">{value}</span>
      <span className="mt-0.5 block truncate text-xs text-dim">{label}</span>
    </Link>
  );
}

/** The account's creation date, in the reader's own locale. */
function joined(iso: string): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return "";
  return at.toLocaleDateString(undefined, { year: "numeric", month: "long" });
}
