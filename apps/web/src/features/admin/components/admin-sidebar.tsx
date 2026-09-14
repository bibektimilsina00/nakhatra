"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Clapperboard, ShieldCheck } from "lucide-react";

import { NakhatraMark } from "@/components/ui/nakhatra-mark";
import { MARKETPLACE_LIVE } from "@/features/practitioners/marketplace";

export const ADMIN_SIDEBAR_WIDTH = "w-[248px]";

export function AdminSidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/admin", label: "Overview", icon: <LayoutDashboard className="size-[16px]" /> },
    { href: "/admin/users", label: "Users", icon: <Users className="size-[16px]" /> },
    { href: "/admin/studio", label: "Rasifal studio", icon: <Clapperboard className="size-[16px]" /> },
    ...(MARKETPLACE_LIVE
      ? [
          {
            href: "/admin/practitioners",
            label: "Practitioner applications",
            icon: <ShieldCheck className="size-[16px]" />,
          },
        ]
      : []),
  ];

  // Distinct treatment: solid ink background for active item instead of accent tint
  const item = (active: boolean) =>
    `flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors ${
      active
        ? "bg-ink font-medium text-surface"
        : "text-muted hover:bg-line hover:text-ink"
    }`;

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="px-4 py-4">
        <Link href="/admin" className="flex items-center gap-2.5">
          <NakhatraMark className="size-7 text-ink" />
          <div className="flex flex-col">
            <span className="text-xs font-bold tracking-[0.18em] text-ink uppercase leading-none">
              NAKHATRA
            </span>
            <span className="text-2xs font-semibold tracking-wider text-muted mt-1 uppercase leading-none">
              Admin
            </span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 pt-4 pb-3" aria-label="Admin">
        <p className="mb-2 px-2.5 text-2xs uppercase tracking-[0.16em] text-dim">
          Workspace
        </p>
        <ul className="space-y-0.5">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={item(active)}
                >
                  <span className="shrink-0">{link.icon}</span>
                  <span className="truncate">{link.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
