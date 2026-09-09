"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import {
  MessagesSquare,
  Heart, HelpCircle, MessageCircle, Plus, ScrollText, Settings, Sparkles, Star, Sun,
} from "lucide-react";

import { NakhatraMark } from "@/components/ui/nakhatra-mark";
import { useOpenKundali } from "@/features/dashboard/hooks/use-open-kundali";
import { MARKETPLACE_LIVE } from "@/features/practitioners/marketplace";
import type { SavedKundali } from "@/features/vault/types";
import { useLatinTracking, useTranslation } from "@/lib/i18n/language-context";

/** Fixed width. The sidebar does not collapse — one layout, no hidden state. */
export const SIDEBAR_WIDTH = "w-[248px]";

/**
 * The signed-in sidebar.
 *
 * The brand leads rather than the visitor's name: this is the product's front
 * door, and a person already knows who they are. Their account lives in the
 * top bar, where account controls belong.
 */
export function AppSidebar({
  kundalis,
  sessionCount,
  onlineAstrologers,
  onNewKundali,
  onNavigate,
}: {
  kundalis: SavedKundali[];
  sessionCount: number;
  onlineAstrologers: number;
  onNewKundali: () => void;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const label = useLatinTracking("uppercase tracking-[0.16em]");
  const { open, openingId } = useOpenKundali();

  // Both of these lead only into the marketplace, so while it is closed they
  // are not links to somewhere quieter — they are links to a door.
  const links = [
    { href: "/dashboard", label: t.dashNavHome, icon: <Star className="size-[16px]" /> },
    // These two land on the chooser, not on the page: arriving from the
    // sidebar means no chart has been picked, and the pages would otherwise
    // show whichever one was opened last. `match` is what lights the row up,
    // so the reading page still highlights "Reading".
    {
      href: "/reading/choose",
      match: "/reading",
      label: t.dashNavReading,
      icon: <ScrollText className="size-[16px]" />,
    },
    {
      href: "/reading/choose?mode=live",
      match: "/reading/live",
      label: t.dashNavLive,
      icon: <MessageCircle className="size-[16px]" />,
    },
    ...(MARKETPLACE_LIVE
      ? [
          {
            href: "/dashboard#jyotish",
            label: t.dashNavJyotish,
            icon: <Sun className="size-[16px]" />,
            badge:
              onlineAstrologers > 0
                ? t.dashOnlineCount.replace("{n}", String(onlineAstrologers))
                : undefined,
          },
        ]
      : []),
    { href: "/milan", label: t.dashNavMilan, icon: <Heart className="size-[16px]" /> },
    ...(MARKETPLACE_LIVE
      ? [
          {
            href: "/consultations",
            label: t.chatTab,
            icon: <MessagesSquare className="size-[16px]" />,
          },
        ]
      : []),
  ];

  // `/reading` is a prefix of `/reading/live`, so the longest match wins —
  // otherwise both rows light up on the live page.
  const activeHref = links
    .filter((l) => !l.href.includes("#"))
    .filter((l) => {
      const path = ("match" in l && l.match) || l.href;
      return pathname === path || pathname.startsWith(`${path}/`);
    })
    .sort((a, b) => {
      const am = (("match" in a && a.match) || a.href).length;
      const bm = (("match" in b && b.match) || b.href).length;
      return bm - am;
    })[0]?.href;

  const item = (active: boolean) =>
    `flex items-center gap-3 rounded-[8px] px-2.5 py-2 text-[13.5px] transition-colors ${
      active
        ? "bg-acc/[0.11] font-medium text-acc2"
        : "text-mut hover:bg-fg/[0.04] hover:text-fg"
    }`;

  return (
    <div className="flex h-full flex-col bg-inset">
      <div className="px-4 py-4">
        <Link href="/dashboard" onClick={onNavigate} className="flex items-center gap-2.5">
          <NakhatraMark className="size-7 text-acc" />
          <span className="font-logo text-sm font-bold tracking-[0.18em] text-fg">
            NAKHATRA
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 pb-3" aria-label="Main">
        <ul className="space-y-0.5">
          {links.map((link, index) => (
            <Fragment key={link.href}>
              <li>
                <Link
                  href={link.href}
                  onClick={onNavigate}
                  aria-current={activeHref === link.href ? "page" : undefined}
                  className={item(activeHref === link.href)}
                >
                  <span className="shrink-0">{link.icon}</span>
                  <span className="truncate">{link.label}</span>
                  {link.badge && (
                    <span className="ml-auto rounded-[4px] bg-[#0D1A16] px-1.5 py-0.5 text-[9.5px] text-emerald-300">
                      {link.badge}
                    </span>
                  )}
                </Link>
              </li>

              {/* Second, under Home: creation is a dialog rather than a
                  destination, so it opens over whatever you were looking at
                  instead of replacing the page. */}
              {index === 0 && (
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate?.();
                      onNewKundali();
                    }}
                    className={`w-full ${item(false)}`}
                  >
                    <Plus className="size-[16px] shrink-0" />
                    <span className="truncate">{t.dashNavNew}</span>
                  </button>
                </li>
              )}
            </Fragment>
          ))}
        </ul>

        <p className={`mt-7 px-2.5 text-[10px] text-dim ${label}`}>{t.dashNavLibrary}</p>
        <ul className="mt-2 space-y-0.5">
          <li>
            <Link href="/dashboard#kundalis" onClick={onNavigate} className={item(false)}>
              <Sparkles className="size-[16px] shrink-0" />
              <span className="truncate">{t.dashSaved}</span>
              <span className="ml-auto text-[11px] text-dim">{kundalis.length}</span>
            </Link>
          </li>
          <li>
            <Link href="/reading/choose?mode=live" onClick={onNavigate} className={item(false)}>
              <MessageCircle className="size-[16px] shrink-0" />
              <span className="truncate">{t.dashConversations}</span>
              <span className="ml-auto text-[11px] text-dim">{sessionCount}</span>
            </Link>
          </li>
        </ul>

        {kundalis.length > 0 && (
          <>
            <p className={`mt-7 px-2.5 text-[10px] text-dim ${label}`}>{t.dashNavRecent}</p>
            <ul className="mt-2 space-y-0.5">
              {/* Five: enough to find the chart you were just reading, few
                  enough that the sidebar does not become the list. */}
              {kundalis.slice(0, 5).map((k) => (
                <li key={k.id}>
                  <button
                    type="button"
                    disabled={!k.birth || openingId === k.id}
                    onClick={() => {
                      onNavigate?.();
                      open(k);
                    }}
                    title={k.birth ? k.name : t.dashNotRecalculable}
                    className="flex w-full items-center gap-3 rounded-[8px] px-2.5 py-2 text-left text-[13px] text-mut transition-colors hover:bg-fg/[0.04] hover:text-fg disabled:opacity-40"
                  >
                    <span className="grid size-[17px] shrink-0 place-items-center rounded-[4px] border border-acc/30 text-[9px] text-acc">
                      {k.name.trim().charAt(0).toUpperCase()}
                    </span>
                    <span className="truncate">
                      {openingId === k.id ? t.dashOpening : k.name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>

      <div className="border-t border-brd px-2.5 py-2.5">
        <a href="mailto:support@nakhatra.com" className={item(false)}>
          <HelpCircle className="size-[16px] shrink-0" />
          <span>{t.dashHelp}</span>
        </a>
        <Link href="/settings" onClick={onNavigate} className={item(false)}>
          <Settings className="size-[16px] shrink-0" />
          <span>{t.dashSettings}</span>
        </Link>
      </div>
    </div>
  );
}
