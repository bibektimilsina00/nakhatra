"use client";

import Link from "next/link";
import { LanguageMenu } from "@/components/ui/language-menu";
import { User, LogOut, BookmarkCheck } from "lucide-react";

import { NakhatraMark } from "@/components/ui/nakhatra-mark";
import { useLogout, useSession } from "@/features/auth/hooks/use-auth";
import { useSavedKundalis } from "@/features/vault/hooks/use-vault";

export function MainNavbar() {
  const { user } = useSession();
  const logout = useLogout();
  const { data: savedKundalis = [] } = useSavedKundalis();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#090A10]/90 backdrop-blur-xl transition-all">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-8 py-3">
        {/* Left: Branding */}
        <Link href="/" className="flex items-center gap-3 group">
          <NakhatraMark className="size-9 text-[#E5A93C] transition-transform duration-300 group-hover:scale-105 group-hover:text-[#F3C766]" />
          <div>
            <span className="block font-logo text-base font-bold tracking-wider text-[#F8FAFC] group-hover:text-[#F3C766] transition">
              NAKHATRA
            </span>
            <span className="block text-[10px] font-semibold uppercase tracking-widest text-[#E5A93C]">
              Precision Sidereal Astronomy
            </span>
          </div>
        </Link>

        {/* Navigation Links & Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Reusable Custom Language Selector */}
          <LanguageMenu />

          {/* Auth Button / Profile */}
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                title="Dashboard"
                className="flex items-center gap-2 rounded-[8px] border border-white/10 bg-[#161B2B] px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-[#E5A93C]/50 hover:text-white"
              >
                <User className="size-3.5 text-[#E5A93C]" />
                <span className="max-w-[100px] truncate">{user.full_name.split(" ")[0]}</span>
                {savedKundalis.length > 0 && (
                  <span className="flex items-center gap-0.5 rounded-full bg-[#E5A93C]/20 px-1.5 py-0.2 text-[10px] font-bold text-[#F3C766]">
                    <BookmarkCheck className="size-3" />
                    {savedKundalis.length}
                  </span>
                )}
              </Link>

              <button
                onClick={logout}
                title="Sign Out"
                className="rounded-[8px] border border-white/10 p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-[8px] bg-gradient-to-r from-[#E5A93C] to-[#B87A14] px-3.5 py-1.5 text-xs font-bold text-[#090A10] shadow-md transition hover:brightness-110"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
