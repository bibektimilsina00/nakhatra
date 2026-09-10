"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  Clapperboard,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

import { LanguageMenu } from "@/components/ui/language-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useLogout } from "@/features/auth/hooks/use-auth";
import { MARKETPLACE_LIVE } from "@/features/practitioners/marketplace";
import { useMyApplication } from "@/features/practitioners/hooks/use-practitioners";
import type { UserProfile } from "@/features/auth/types";
import { useDismissable } from "@/components/ui/use-dismissable";
import { markAllRead, relativeTime, useNotifications, useNow } from "@/features/dashboard/hooks/use-notifications";
import { useTranslation } from "@/lib/i18n/language-context";

type Menu = "bell" | "account" | null;

/**
 * The top bar beside the sidebar.
 *
 * Navigation is the sidebar's job, so this carries only what belongs to the
 * person: search, what happened while they were away, language, account.
 *
 * One `open` value rather than three booleans — three could all be true at
 * once, which is a state the design does not have and a bug waiting to be
 * reported as "the menus overlap".
 */
export function AppNav({
  user,
  query,
  onQueryChange,
  onOpenMenu,
  leading,
}: {
  /** Null renders the guest bar: a sign-in button where the account sits. */
  user: UserProfile | null;
  query: string;
  onQueryChange: (value: string) => void;
  /** Omitted on sidebar-less pages — there is no drawer for it to open. */
  onOpenMenu?: () => void;
  /**
   * Takes the search's place. Reading and the live desk put their back button,
   * title and chart switcher here rather than below: a page header under the
   * app bar is two bars doing one bar's job, and searching the vault from
   * inside a single chart's reading is not a thing anyone wants to do.
   */
  leading?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const logout = useLogout();
  // Where an account learns it can become a practitioner. Buried in a section
  // heading it was invisible; changing what an account *is* belongs with the
  // account, which is here. Not asked for at all while the marketplace is
  // closed — a request on every page load to decide the label of a hidden link.
  const application = useMyApplication(MARKETPLACE_LIVE);
  const { items, unread, total } = useNotifications();
  const now = useNow();

  const [open, setOpen] = useState<Menu>(null);
  const bar = useRef<HTMLDivElement>(null);
  const bell = useRef<HTMLDivElement>(null);
  const account = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const close = useCallback(() => setOpen(null), []);

  // Scoped to each panel rather than to the whole bar. Bound to the bar, a
  // click on the search field — which is inside it — left the notifications
  // hanging open over whatever was being typed.
  useDismissable(open === "bell", bell, close);
  useDismissable(open === "account", account, close);

  useEffect(() => {
    const keys = (event: KeyboardEvent) => {
      // ⌘K / Ctrl-K focuses search, the shortcut the hint in the field claims.
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen(null);
        search.current?.focus();
      }
    };
    addEventListener("keydown", keys);
    return () => removeEventListener("keydown", keys);
  }, []);

  const toggle = (menu: Menu) => setOpen((current) => (current === menu ? null : menu));
  const panel =
    "absolute right-0 z-50 mt-2 rounded-[8px] border border-white/12 bg-inset p-1.5 shadow-2xl shadow-black/50";
  const trigger =
    "flex items-center gap-2 rounded-[8px] border border-brd text-mut transition-colors hover:border-brd2 hover:text-fg";

  return (
    <header className="sticky top-0 z-40 border-b border-brd bg-inset">
      <div ref={bar} className="flex items-center gap-4 px-5 py-3 sm:px-8">
        {onOpenMenu && (
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label={t.dashMenu}
            className="rounded-[8px] p-1.5 text-mut transition-colors hover:text-fg lg:hidden"
          >
            <Menu className="size-5" />
          </button>
        )}

        {leading ?? (
        <label className="relative hidden max-w-[380px] flex-1 items-center md:flex">
          <Search className="pointer-events-none absolute left-3 size-4 text-dim" />
          <span className="sr-only">{t.dashSearch}</span>
          <input
            ref={search}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={t.dashSearch}
            className="w-full rounded-[8px] border border-white/[0.09] bg-panel/50 py-2 pl-9 pr-10 text-[13.5px] text-fg placeholder-faint focus:border-acc/45 focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              aria-label={t.dashClear}
              className="absolute right-2 rounded px-1.5 text-[11px] text-dim hover:text-fg"
            >
              ✕
            </button>
          ) : (
            <span className="absolute right-2.5 text-[10px] text-dim">⌘K</span>
          )}
        </label>
        )}

        <div className="ml-auto flex items-center gap-2">
          {/* Literally the marketing header's picker. Its own outside-click
              handler cannot see this bar's state, so closing on mousedown here
              is what keeps two panels from being open at once. */}
          <span className="flex items-center gap-1.5" onMouseDown={() => setOpen(null)}>
            <ThemeToggle />
            <LanguageMenu />
          </span>

          {user ? (
            <>
          {/* Notifications */}
          <div ref={bell} className="relative">
            <button
              type="button"
              onClick={() => toggle("bell")}
              aria-expanded={open === "bell"}
              aria-label={t.dashNotifications}
              className={`${trigger} relative size-9 justify-center`}
            >
              <Bell className="size-[17px]" />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 grid size-[17px] place-items-center rounded-full bg-acc text-[9.5px] font-bold text-ink">
                  {unread}
                </span>
              )}
            </button>

            {open === "bell" && (
              <div className={`${panel} w-[320px] !p-0`}>
                <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-3.5 py-2.5">
                  <span className="text-[13px] font-semibold text-fg">{t.dashNotifications}</span>
                  {/* Only offered when it would do something — a permanently
                      enabled "mark all as read" over an empty list is noise. */}
                  {unread > 0 && (
                    <button
                      type="button"
                      onClick={markAllRead}
                      className="inline-flex items-center gap-1.5 text-[11px] text-mut transition-colors hover:text-acc"
                    >
                      <CheckCheck className="size-3.5" />
                      {t.notifMarkAllRead}
                    </button>
                  )}
                </div>

                {items.length === 0 ? (
                  <p className="px-3.5 py-6 text-center text-[12.5px] text-dim">
                    {t.dashNoNotifications}
                  </p>
                ) : (
                  <ul className="max-h-[320px] overflow-y-auto">
                    {items.map((item) => (
                      <li key={item.id}>
                        <div className="flex gap-3 border-b border-white/[0.05] px-3.5 py-3 last:border-0">
                          <span
                            className={`mt-1.5 size-1.5 shrink-0 rounded-full ${item.unread ? "bg-acc" : "bg-transparent"}`}
                          />
                          <span className="min-w-0">
                            <span className="block truncate text-[13px] leading-[1.5] text-fg">
                              {item.title}
                            </span>
                            <span className="mt-0.5 block text-[10.5px] text-dim">
                              {t[item.detail]} · {relativeTime(item.at, now)}
                            </span>
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {/* The bell is a glance; the page is the archive. Shown even
                    when nothing is listed, so the way there is never hidden. */}
                <Link
                  href="/notifications"
                  onClick={close}
                  className="flex items-center justify-center gap-1.5 border-t border-white/[0.08] px-3.5 py-2.5 text-[12px] text-mut transition-colors hover:text-acc"
                >
                  {t.notifSeeAll}
                  {total > items.length && (
                    <span className="text-[10.5px] text-dim">({total})</span>
                  )}
                </Link>
              </div>
            )}
          </div>

          {/* Account — the avatar is the whole control. */}
          <div ref={account} className="relative">
            <button
              type="button"
              onClick={() => toggle("account")}
              aria-expanded={open === "account"}
              aria-label={user.full_name}
              className="grid size-9 place-items-center rounded-full bg-acc text-[13.5px] font-bold text-ink"
            >
              {user.full_name.trim().charAt(0).toUpperCase()}
            </button>

            {open === "account" && (
              <div className={`${panel} w-[236px]`}>
                <div className="flex items-center gap-2.5 px-2 py-2">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-acc text-[13.5px] font-bold text-ink">
                    {user.full_name.trim().charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13.5px] font-medium text-fg">
                      {user.full_name}
                    </span>
                    <span className="block truncate text-[11.5px] text-dim">{user.email}</span>
                  </span>
                </div>

                <div className="my-1 h-px bg-white/[0.08]" />

                {/* One entry, three meanings: apply, check on an application,
                    or go to the desk once approved. Hidden entirely while the
                    marketplace is closed — there is nothing to apply to yet. */}
                {MARKETPLACE_LIVE && (
                  <>
                    <Link
                      href={
                        application.data?.state === "approved"
                          ? "/practitioners/me"
                          : "/practitioners/apply"
                      }
                      onClick={close}
                      className="flex items-center gap-2.5 rounded-[6px] px-2.5 py-2 text-[13px] text-acc transition-colors hover:bg-acc/[0.08]"
                    >
                      <Sparkles className="size-3.5" />
                      {application.data?.state === "approved"
                        ? t.practDesk
                        : application.data
                          ? t.practApplicationStatus
                          : t.practBecome}
                    </Link>

                    {/* Offered only to an account that can actually open it. The
                        route itself is still guarded server-side — hiding a link
                        is not a permission. */}
                    {user.role === "admin" && (
                      <Link
                        href="/admin/practitioners"
                        onClick={close}
                        className="flex items-center gap-2.5 rounded-[6px] px-2.5 py-2 text-[13px] text-mut transition-colors hover:bg-fg/[0.05] hover:text-fg"
                      >
                        <ShieldCheck className="size-3.5" />
                        {t.practReviewLink}
                      </Link>
                    )}

                    {/* The video studio. Deliberately untranslated: it is a
                        tool for whoever runs the TikTok account, not a page
                        the product has readers for. */}
                    {user.role === "admin" && (
                      <Link
                        href="/admin/studio"
                        onClick={close}
                        className="flex items-center gap-2.5 rounded-[6px] px-2.5 py-2 text-[13px] text-mut transition-colors hover:bg-fg/[0.05] hover:text-fg"
                      >
                        <Clapperboard className="size-3.5" />
                        Rasifal studio
                      </Link>
                    )}
                  </>
                )}

                <div className="my-1 h-px bg-white/[0.08]" />

                {/* Real pages. Both of these used to be `#account`, an anchor
                    that existed on no page in the app. */}
                <Link
                  href="/profile"
                  onClick={close}
                  className="flex items-center gap-2.5 rounded-[6px] px-2.5 py-2 text-[13px] text-mut transition-colors hover:bg-fg/[0.05] hover:text-fg"
                >
                  <UserRound className="size-3.5" />
                  {t.dashProfile}
                </Link>
                <Link
                  href="/settings"
                  onClick={close}
                  className="flex items-center gap-2.5 rounded-[6px] px-2.5 py-2 text-[13px] text-mut transition-colors hover:bg-fg/[0.05] hover:text-fg"
                >
                  <Settings className="size-3.5" />
                  {t.dashSettings}
                </Link>

                <div className="my-1 h-px bg-white/[0.08]" />

                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center gap-2.5 rounded-[6px] px-2.5 py-2 text-left text-[13px] text-mut transition-colors hover:bg-fg/[0.05] hover:text-fg"
                >
                  <LogOut className="size-3.5" />
                  {t.dashSignOut}
                </button>
              </div>
            )}
          </div>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center rounded-[8px] border border-brd px-5 py-1.5 text-[13.5px] text-mut transition-colors hover:border-brd2 hover:text-fg"
            >
              {t.dashSignIn}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
