"use client";

import { useCallback, useRef, useState } from "react";
import { Calendar, Check, ChevronDown, MapPin, Plus, Search } from "lucide-react";

import { useDismissable } from "@/components/ui/use-dismissable";
import { ChartLattice, chartArt } from "@/features/kundali/chart-art";
import { BrideIcon, GroomIcon } from "@/features/milan/components/role-icons";
import type { SavedKundali } from "@/features/vault/types";
import { useLatinTracking, useTranslation } from "@/lib/i18n/language-context";

/**
 * One side of a match.
 *
 * The role icons are a ghoonghat and a pagri rather than Venus and Mars: the
 * planetary glyphs are the classical significators, but on a form they read as
 * biology instead of as two people getting married. Bride and groom share one
 * accent treatment — told apart by icon and label, never by a second hue, in
 * keeping with "never colour alone" (design.md §9.2).
 *
 * Only charts that can be recalculated are offered: a row saved before the
 * vault stored IANA zones has no `birth`, and matching it would mean guessing a
 * historical offset — several degrees of ascendant, in a result that looks
 * entirely normal (CLAUDE.md rule 5). Those rows appear, disabled, with the
 * reason, rather than vanishing without explanation.
 */
export function ChartPicker({
  role,
  kundalis,
  selected,
  onSelect,
  onCreate,
  accent,
}: {
  role: string;
  kundalis: SavedKundali[];
  selected: SavedKundali | null;
  onSelect: (kundali: SavedKundali) => void;
  onCreate: () => void;
  accent: "rose" | "sky";
}) {
  const { t } = useTranslation();
  const label = useLatinTracking("uppercase tracking-[0.16em]");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const panel = useRef<HTMLDivElement>(null);

  // Clicking anywhere else closes it, the way every other menu in the app does.
  useDismissable(open, panel, useCallback(() => setOpen(false), []));

  const shown = kundalis.filter((k) =>
    [k.name, k.place_name, k.dob].some((f) => f.toLowerCase().includes(query.trim().toLowerCase())),
  );

  const RoleIcon = accent === "rose" ? BrideIcon : GroomIcon;

  return (
    <div
      ref={panel}
      className={`relative rounded-lg border bg-surface p-5 transition-colors ${
        selected ? "border-accent" : "border-line-strong"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className={`flex items-center gap-2 text-2xs text-accent-ink ${label}`}>
          <RoleIcon className="size-4" />
          {role}
        </span>
        {selected && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex min-h-11 min-w-11 items-center justify-center px-2 text-xs text-muted transition-colors hover:text-ink"
          >
            {t.milanChange}
          </button>
        )}
      </div>

      {selected ? (
        <div className="mt-5 flex items-center gap-4">
          <ChartAvatar id={selected.id} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-ink">{selected.name}</p>
            <p className="mt-1.5 flex items-center gap-1.5 truncate text-xs text-dim">
              <Calendar className="size-3 shrink-0" />
              {selected.dob} · {selected.tob}
            </p>
            <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-dim">
              <MapPin className="size-3 shrink-0" />
              {selected.place_name}
            </p>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="group mt-5 flex w-full items-center gap-4 rounded-lg border border-dashed border-line-strong p-4 text-left transition-colors hover:border-accent hover:bg-cream"
        >
          <span className="grid size-14 shrink-0 place-items-center rounded-md border border-line-strong bg-accent-wash text-accent-ink transition-colors">
            <RoleIcon className="size-6" />
          </span>
          <span className="min-w-0 flex-1 text-sm font-medium text-muted transition-colors group-hover:text-ink">
            {t.milanChoose}
          </span>
          <ChevronDown className={`size-4 shrink-0 text-dim transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      )}

      {open && (
        <div className="absolute inset-x-5 top-full z-20 -mt-1 rounded-lg border border-line-strong bg-surface p-2 shadow-raised">
          {kundalis.length > 4 && (
            <label className="relative mb-2 flex items-center">
              <Search className="pointer-events-none absolute left-2.5 size-3.5 text-dim" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.milanSearch}
                className="h-11 w-full rounded-md border border-line-strong bg-cream pl-8 pr-2 text-xs text-ink placeholder:text-dim focus-visible:border-ring focus-visible:outline-none"
              />
            </label>
          )}

          <ul className="max-h-[280px] space-y-1 overflow-y-auto">
            {shown.map((k) => {
              const usable = Boolean(k.birth);
              const chosen = selected?.id === k.id;
              return (
                <li key={k.id}>
                  <button
                    type="button"
                    disabled={!usable}
                    title={usable ? undefined : t.dashNotRecalculable}
                    onClick={() => {
                      onSelect(k);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-md border p-2.5 text-left transition-colors disabled:pointer-events-none disabled:opacity-40 ${
                      chosen
                        ? "border-accent bg-accent-wash"
                        : "border-transparent hover:border-line-strong hover:bg-cream"
                    }`}
                  >
                    <ChartAvatar id={k.id} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">
                        {k.name}
                      </span>
                      <span className="mt-0.5 block truncate text-2xs text-dim">
                        {k.dob} · {k.place_name}
                      </span>
                    </span>
                    {chosen && <Check className="size-4 shrink-0 text-accent-ink" />}
                  </button>
                </li>
              );
            })}
          </ul>

          {shown.length === 0 && (
            <p className="px-2.5 py-4 text-center text-xs text-dim">{t.milanNoCharts}</p>
          )}

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onCreate();
            }}
            className="mt-2 flex w-full items-center gap-2.5 rounded-md border-t border-line px-2.5 py-3 text-xs text-muted transition-colors hover:text-accent-ink"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-md border border-dashed border-line-strong">
              <Plus className="size-4" />
            </span>
            {t.dashNewKundali}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * A chart as a square tile: its own colour, its own lattice. The same colour
 * the dashboard draws it in, so a chart stays recognisable across the app.
 */
function ChartAvatar({ id, size }: { id: string; size: "sm" | "lg" }) {
  const { fill, stroke } = chartArt(id);
  const box = size === "lg" ? "size-14 rounded-md" : "size-9 rounded-md";
  const glyph = size === "lg" ? "size-9" : "size-6";

  return (
    <span
      className={`grid shrink-0 place-items-center border border-line-strong ${box}`}
      style={{ background: fill }}
    >
      <ChartLattice stroke={stroke} className={glyph} />
    </span>
  );
}
