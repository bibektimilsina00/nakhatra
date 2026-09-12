"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LanguageMenu } from "@/components/ui/language-menu";
import { AccountCard, AccountShell, accountLabel } from "@/features/account/components/account-shell";
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
            <Input
              type="password"
              autoComplete="current-password"
              required
              value={current}
              onChange={(event) => setCurrent(event.target.value)}
            />
          </label>

          <label className="block">
            <span className={accountLabel}>{t.acctNewPassword}</span>
            <Input
              type="password"
              autoComplete="new-password"
              required
              minLength={MIN_PASSWORD}
              value={next}
              onChange={(event) => setNext(event.target.value)}
            />
          </label>

          {change.isError && (
            <p role="alert" className="text-sm text-danger">
              {change.error.message}
            </p>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={change.isPending || !current || next.length < MIN_PASSWORD}>
              {t.acctChangePassword}
            </Button>
            {change.isSuccess && (
              <span className="text-sm text-success">{t.acctPasswordChanged}</span>
            )}
          </div>
        </form>
      </AccountCard>

      <AccountCard title={t.acctPrivacy} note={t.acctPrivacyNote}>
        <Link href="/privacy" className="text-xs text-accent-strong hover:underline">
          {t.acctPrivacyLink}
        </Link>
      </AccountCard>

      <AccountCard title={t.acctDanger} note={t.acctDangerNote}>
        <Button type="button" variant="secondary" onClick={logout}>
          <LogOut className="size-4" />
          {t.dashSignOut}
        </Button>
      </AccountCard>
    </AccountShell>
  );
}
