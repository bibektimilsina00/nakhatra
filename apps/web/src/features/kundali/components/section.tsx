"use client";

import { useState } from "react";

/**
 * One scrolling page, not tabs. Sections that would otherwise be very long
 * (sixteen divisional charts, nine mahadashas) render a useful amount and
 * offer "view more" — so the whole chart is reachable by scrolling without
 * paying for all of it up front.
 */
export function Section({
  id,
  title,
  note,
  action,
  children,
}: {
  id: string;
  title: string;
  note?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl text-fg">{title}</h2>
          {note && <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-mut">{note}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function ViewMore({
  count,
  label,
  expanded,
  onToggle,
}: {
  count: number;
  label: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  if (count <= 0) return null;
  return (
    <button
      onClick={onToggle}
      className="mt-5 w-full rounded-lg border border-dashed border-line py-3 text-sm text-mut transition hover:border-accent-strong/40 hover:text-accent-ink"
    >
      {expanded ? "Show less" : `View ${count} more ${label}`}
    </button>
  );
}

/** Reveals the first `initial` items, then the rest on demand. */
export function useReveal<T>(items: T[], initial: number) {
  const [expanded, setExpanded] = useState(false);
  return {
    visible: expanded ? items : items.slice(0, initial),
    hidden: Math.max(0, items.length - initial),
    expanded,
    toggle: () => setExpanded((v) => !v),
  };
}
