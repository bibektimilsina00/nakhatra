"use client";

import { Bell, CheckCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AppShell } from "@/features/dashboard/components/app-shell";
import {
  markAllRead,
  relativeTime,
  useNotifications,
  useNow,
} from "@/features/dashboard/hooks/use-notifications";
import { useLatinTracking, useTranslation } from "@/lib/i18n/language-context";

/**
 * Everything the bell only glimpses.
 *
 * The panel shows six and nothing more; this is where the rest lives. Same
 * `useNotifications` hook with the cap lifted, so the two can never disagree
 * about what happened or in what order.
 */
export function NotificationsPage() {
  const { t } = useTranslation();
  const eyebrow = useLatinTracking("uppercase tracking-[0.2em]");
  const now = useNow();
  const { items, unread } = useNotifications(Number.POSITIVE_INFINITY);

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-[760px] px-5 pb-24 pt-10 sm:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className={`text-xs text-accent-strong ${eyebrow}`}>{t.notifTitle}</span>
            <h1 className="mt-3 text-2xl font-bold leading-tight text-ink sm:text-3xl">
              {t.dashNotifications}
            </h1>
          </div>
          {unread > 0 && (
            <Button type="button" variant="secondary" onClick={markAllRead}>
              <CheckCheck className="size-4" />
              {t.notifMarkAllRead}
            </Button>
          )}
        </header>

        {items.length === 0 ? (
          <div className="mt-10 rounded-lg border border-dashed border-line-strong px-6 py-16 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-full border border-line-strong text-accent">
              <Bell className="size-5" />
            </span>
            <p className="mt-4 text-sm text-muted">{t.dashNoNotifications}</p>
          </div>
        ) : (
          <ul className="mt-8 overflow-hidden rounded-lg border border-line-strong">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex gap-3 border-b border-line bg-surface px-4 py-3.5 last:border-0"
              >
                {/* The dot holds its column whether or not it is shown, so a
                    read row does not sit half a step left of an unread one. */}
                <span
                  className={`mt-2 size-1.5 shrink-0 rounded-full ${
                    item.unread ? "bg-accent" : "bg-transparent"
                  }`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-ink">{item.title}</span>
                  <span className="mt-0.5 block text-xs text-dim">
                    {t[item.detail]} · {relativeTime(item.at, now)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}

        {items.length > 0 && unread === 0 && (
          <p className="mt-5 text-center text-sm text-dim">{t.notifAllCaughtUp}</p>
        )}
      </main>
    </AppShell>
  );
}
