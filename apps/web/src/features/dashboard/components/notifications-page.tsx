"use client";

import { Bell, CheckCheck } from "lucide-react";

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
            <span className={`text-[11px] text-gold ${eyebrow}`}>{t.notifTitle}</span>
            <h1 className="mt-3 text-[26px] font-bold leading-tight text-paper sm:text-[30px]">
              {t.dashNotifications}
            </h1>
          </div>
          {unread > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="inline-flex items-center gap-2 rounded-[8px] border border-white/12 px-3.5 py-2 text-[12.5px] text-muted transition-colors hover:border-white/25 hover:text-paper"
            >
              <CheckCheck className="size-4" />
              {t.notifMarkAllRead}
            </button>
          )}
        </header>

        {items.length === 0 ? (
          <div className="mt-10 rounded-[12px] border border-dashed border-white/[0.14] px-6 py-16 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-full border border-white/[0.10] text-gold">
              <Bell className="size-5" />
            </span>
            <p className="mt-4 text-[14px] text-muted">{t.dashNoNotifications}</p>
          </div>
        ) : (
          <ul className="mt-8 overflow-hidden rounded-[12px] border border-white/[0.09]">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex gap-3 border-b border-white/[0.06] bg-card px-4 py-3.5 last:border-0"
              >
                {/* The dot holds its column whether or not it is shown, so a
                    read row does not sit half a step left of an unread one. */}
                <span
                  className={`mt-2 size-1.5 shrink-0 rounded-full ${
                    item.unread ? "bg-gold" : "bg-transparent"
                  }`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] text-paper">{item.title}</span>
                  <span className="mt-0.5 block text-[11.5px] text-faint">
                    {t[item.detail]} · {relativeTime(item.at, now)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}

        {items.length > 0 && unread === 0 && (
          <p className="mt-5 text-center text-[12.5px] text-faint">{t.notifAllCaughtUp}</p>
        )}
      </main>
    </AppShell>
  );
}
