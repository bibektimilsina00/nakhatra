"use client";

import Link from "next/link";
import { LanguageMenu } from "@/components/ui/language-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { buttonClasses } from "@/components/ui/button";
import { User, LogOut, BookmarkCheck } from "lucide-react";

import { NakhatraMark } from "@/components/ui/nakhatra-mark";
import { useLogout, useSession } from "@/features/auth/hooks/use-auth";
import { useSavedKundalis } from "@/features/vault/hooks/use-vault";

export function MainNavbar() {
  const { user } = useSession();
  const logout = useLogout();
  const { data: savedKundalis = [] } = useSavedKundalis();

  return (
    <header className="sticky top-0 z-50 border-b border-line-strong bg-surface/95 backdrop-blur-xl transition-all">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-8 py-3">
        {/* Left: Branding */}
        <Link href="/" className="flex items-center gap-3 group">
          <NakhatraMark className="size-9 text-accent-ink transition-transform duration-300 group-hover:scale-105" />
          <div>
            <span className="block font-display text-base font-bold tracking-wider text-ink group-hover:text-accent-ink transition">
              NAKHATRA
            </span>
            <span className="block text-2xs font-semibold uppercase tracking-widest text-accent-ink">
              Precision Sidereal Astronomy
            </span>
          </div>
        </Link>

        {/* Navigation Links & Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          <ThemeToggle />
          <LanguageMenu />

          {/* Auth Button / Profile */}
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                title="Dashboard"
                className="flex min-h-11 items-center gap-2 rounded-md border border-line-strong bg-surface px-3 py-1.5 text-xs font-medium text-ink transition hover:border-accent hover:text-accent-ink"
              >
                <User className="size-3.5 text-accent-ink" />
                <span className="max-w-[100px] truncate">{user.full_name.split(" ")[0]}</span>
                {savedKundalis.length > 0 && (
                  <span className="flex items-center gap-0.5 rounded-full bg-accent-wash px-1.5 py-0.5 text-2xs font-bold text-accent-ink">
                    <BookmarkCheck className="size-3" />
                    {savedKundalis.length}
                  </span>
                )}
              </Link>

              <button
                onClick={logout}
                title="Sign Out"
                aria-label="Sign Out"
                className="flex size-11 items-center justify-center rounded-md border border-line-strong text-muted hover:bg-cream hover:text-ink transition"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className={buttonClasses("primary", { className: "text-xs" })}
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
