"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";

import { LanguageMenu } from "@/components/ui/language-menu";
import {
  AccountCard,
  AccountShell,
  accountButton,
  accountField,
  accountLabel,
} from "@/features/account/components/account-shell";
import { useChangePassword, useLogout } from "@/features/auth/hooks/use-auth";
import { useTranslation } from "@/lib/i18n/language-context";

const MIN_PASSWORD = 8;

/** Everything about the account that is a setting rather than an identity. */
export function SettingsPage() {
  const { t } = useTranslation();
  const logout = useLogout();
  const change = useChangePassword();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");

  return (
    <AccountShell title={t.acctSettings}>
      <AccountCard title={t.acctLanguage} note={t.acctLanguageNote}>
        {/* The same control as the marketing header and the app bar. Three
            copies of a language picker is three answers to what language
            means. */}
        <LanguageMenu />
      </AccountCard>

      <AccountCard title={t.acctPassword} note={t.acctPasswordNote}>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            change.mutate(
              { current_password: current, new_password: next },
              {
                onSuccess: () => {
                  setCurrent("");
                  setNext("");
                },
              },
            );
          }}
        >
          <label className="block">
            <span className={accountLabel}>{t.acctCurrentPassword}</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={current}
              onChange={(event) => setCurrent(event.target.value)}
              className={accountField}
            />
          </label>

          <label className="block">
            <span className={accountLabel}>{t.acctNewPassword}</span>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={MIN_PASSWORD}
              value={next}
              onChange={(event) => setNext(event.target.value)}
              className={accountField}
            />
          </label>

          {change.isError && (
            <p role="alert" className="text-[12.5px] text-rose-300">
              {change.error.message}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={change.isPending || !current || next.length < MIN_PASSWORD}
              className={accountButton}
            >
              {t.acctChangePassword}
            </button>
            {change.isSuccess && (
              <span className="text-[12.5px] text-emerald-300">{t.acctPasswordChanged}</span>
            )}
          </div>
        </form>
      </AccountCard>

      <AccountCard title={t.acctPrivacy} note={t.acctPrivacyNote}>
        <Link href="/privacy" className="text-[12.5px] text-gold hover:underline">
          {t.acctPrivacyLink}
        </Link>
      </AccountCard>

      <AccountCard title={t.acctDanger} note={t.acctDangerNote}>
        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-2 rounded-[9px] border border-rose-400/40 px-4 py-2.5 text-[13px] text-rose-300 transition-colors hover:bg-rose-500/10"
        >
          <LogOut className="size-4" />
          {t.dashSignOut}
        </button>
      </AccountCard>
    </AccountShell>
  );
}
