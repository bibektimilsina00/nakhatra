"use client";

import { useAuthHydrated, useSession } from "@/features/auth/hooks/use-auth";

/**
 * The admin gate, in the one place the admin pages agree on.
 *
 * A courtesy, not the control: every route behind these pages decides for
 * itself and answers 403 to anyone who is not an admin. What this buys is that
 * a seeker who finds the URL is told there is nothing here, rather than shown
 * a page of buttons that all fail.
 *
 * It waits for the store to rehydrate before judging — without that, the first
 * paint of every admin page is "Admins only" and then the page, which reads as
 * a bug even to the admin.
 */
export function AdminOnly({ children }: { children: React.ReactNode }) {
  const hydrated = useAuthHydrated();
  const { user } = useSession();

  if (!hydrated) return null;
  if (user?.role !== "admin") {
    return (
      <main className="mx-auto w-full max-w-[900px] px-5 pt-16 text-center">
        <h1 className="text-[20px] font-semibold text-fg">Nothing here</h1>
        <p className="mt-2 text-[14px] text-mut">This page is for administrators.</p>
      </main>
    );
  }
  return <>{children}</>;
}
