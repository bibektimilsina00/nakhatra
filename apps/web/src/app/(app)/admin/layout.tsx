"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuthHydrated, useSession } from "@/features/auth/hooks/use-auth";
import { AppNav } from "@/features/dashboard/components/app-nav";
import { AdminOnly } from "@/features/admin/components/admin-only";
import { AdminSidebar, ADMIN_SIDEBAR_WIDTH } from "@/features/admin/components/admin-sidebar";
import { useTranslation } from "@/lib/i18n/language-context";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isSignedIn } = useSession();
  const hydrated = useAuthHydrated();
  const router = useRouter();
  const { t } = useTranslation();
  
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (hydrated && !isSignedIn) router.replace("/login");
  }, [hydrated, isSignedIn, router]);

  if (!hydrated || !isSignedIn || !user) return null;

  return (
    <div className="flex min-h-dvh bg-cream text-muted antialiased">
      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={t.dashClose}
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-black/60"
          />
          <div className={`absolute inset-y-0 left-0 ${ADMIN_SIDEBAR_WIDTH} border-r border-line-strong`}>
            <div className="h-full bg-surface" onClick={() => setDrawerOpen(false)}>
              <AdminSidebar />
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className={`sticky top-0 hidden h-dvh shrink-0 border-r border-line-strong lg:block ${ADMIN_SIDEBAR_WIDTH}`}>
        <AdminSidebar />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col min-h-dvh">
        <AppNav
          user={user}
          query=""
          onQueryChange={() => {}}
          onOpenMenu={() => setDrawerOpen(true)}
        />
        <AdminOnly>
          {children}
        </AdminOnly>
      </div>
    </div>
  );
}
