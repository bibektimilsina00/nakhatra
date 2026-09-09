"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuthHydrated, useSession } from "@/features/auth/hooks/use-auth";
import { AppNav } from "@/features/dashboard/components/app-nav";
import { AppSidebar, SIDEBAR_WIDTH } from "@/features/dashboard/components/app-sidebar";
import { CreateKundaliDialog } from "@/features/kundali/components/create-kundali-dialog";
import { useChatSessions, useSavedKundalis } from "@/features/vault/hooks/use-vault";
import { useTranslation } from "@/lib/i18n/language-context";

/**
 * The signed-in chrome: sidebar, top bar, mobile drawer, creation dialog.
 *
 * Extracted so every signed-in route wears the same furniture. Milan used to
 * carry its own navigation bar, so moving between it and the dashboard changed
 * the shell under you — the seam was the giveaway that these were two apps
 * stitched together.
 *
 * The auth gate lives here too, for the same reason: one place that decides
 * whether a page may render at all, rather than a copy per route that will
 * eventually disagree with the others.
 */
export function AppShell({
  children,
  search,
  sidebar: withSidebar = true,
  bar,
  fill = false,
  guest = false,
}: {
  children: React.ReactNode;
  /** Pages that use the top-bar search pass a controlled value; others omit it. */
  search?: { query: string; onQueryChange: (value: string) => void };
  /**
   * Reading and the live desk set this false: they are full-width documents,
   * and only the top bar is meant to match the dashboard. The nav still carries
   * search, notifications, language and account, so nothing is lost with it.
   */
  sidebar?: boolean;
  /** Page-specific controls for the app bar, in place of the search. */
  bar?: React.ReactNode;
  /**
   * Pin the page to the viewport instead of letting it grow.
   *
   * The live desk manages its own scrolling — the chart column and the chat
   * feed each scroll independently. Under the default `min-h-dvh` the page
   * itself could also grow, so a scroll inside the chat moved the whole window
   * and took the app bar with it. `fill` makes the shell exactly one screen
   * tall and the panes inside it the only things that scroll.
   */
  fill?: boolean;
  /**
   * Let a signed-out visitor stand here. The reading and sky pages set it:
   * someone who cast a kundali from the landing page sees their chart like
   * any member would, with a sign-in button where the account sits. Every
   * other page keeps the bounce to /login.
   */
  guest?: boolean;
}) {
  const { user, isSignedIn } = useSession();
  const hydrated = useAuthHydrated();
  const { t } = useTranslation();
  const router = useRouter();

  const { data: kundalis = [] } = useSavedKundalis();
  const { data: sessions = [] } = useChatSessions();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [ownQuery, setOwnQuery] = useState("");

  // Gated on `hydrated`, or a signed-in visitor is bounced to /login on the
  // first render — before the persisted session has been read back.
  useEffect(() => {
    if (hydrated && !isSignedIn && !guest) router.replace("/login");
  }, [hydrated, isSignedIn, guest, router]);

  if (!hydrated) return null;
  if (!isSignedIn && !guest) return null;
  if (isSignedIn && !user) return null;

  // Presence is not built yet (docs/astrologer-marketplace.md §4.4), and the
  // sidebar's "N online" came from the sample data. Zero until there is a
  // heartbeat to count — a fabricated count is a promise the app cannot keep,
  // because a seeker clicks it and finds nobody.
  const online = 0;
  const sidebar = (onNavigate?: () => void) => (
    <AppSidebar
      kundalis={kundalis}
      sessionCount={sessions.length}
      onlineAstrologers={online}
      onNewKundali={() => setCreating(true)}
      onNavigate={onNavigate}
    />
  );

  return (
    <div
      className={`bg-app font-sys text-mut antialiased ${
        fill ? "h-dvh overflow-hidden" : "min-h-dvh"
      }`}
    >
      {/* Below lg the sidebar becomes a drawer — a fixed 248px column there
          would leave nothing for the content. */}
      {withSidebar && drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={t.dashClose}
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-black/60"
          />
          <div className={`absolute inset-y-0 left-0 ${SIDEBAR_WIDTH} border-r border-brd`}>
            {sidebar(() => setDrawerOpen(false))}
          </div>
        </div>
      )}

      <div className="flex">
        {withSidebar && (
          <aside
            className={`sticky top-0 hidden h-dvh shrink-0 border-r border-brd lg:block ${SIDEBAR_WIDTH}`}
          >
            {sidebar()}
          </aside>
        )}

        {/* A column, so a full-height child (the live workspace) can flex into
            whatever the top bar leaves rather than guessing its height. */}
        <div className={`flex min-w-0 flex-1 flex-col ${fill ? "h-dvh min-h-0" : "min-h-dvh"}`}>
          <AppNav
            user={user ?? null}
            query={search ? search.query : ownQuery}
            onQueryChange={search ? search.onQueryChange : setOwnQuery}
            onOpenMenu={withSidebar ? () => setDrawerOpen(true) : undefined}
            leading={bar}
          />
          {children}
        </div>
      </div>

      <CreateKundaliDialog open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
