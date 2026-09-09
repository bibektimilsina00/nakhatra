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
 * biology instead of as two people getting married.
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

  const bride = accent === "rose";
  const tone = bride
    ? { text: "text-rose-300/90", ring: "border-rose-400/35", glow: "bg-rose-400/[0.07]" }
    : { text: "text-sky-300/90", ring: "border-sky-400/35", glow: "bg-sky-400/[0.07]" };
  const RoleIcon = bride ? BrideIcon : GroomIcon;

  return (
    <div
      ref={panel}
      className={`relative rounded-[12px] border bg-panel p-5 transition-colors ${
        selected ? tone.ring : "border-white/[0.09]"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className={`flex items-center gap-2 text-[10.5px] ${label} ${tone.text}`}>
          <RoleIcon className="size-4" />
          {role}
        </span>
        {selected && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-[12px] text-mut transition-colors hover:text-fg"
          >
            {t.milanChange}
          </button>
        )}
      </div>

      {selected ? (
        <div className="mt-5 flex items-center gap-4">
          <ChartAvatar id={selected.id} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-[16px] font-semibold text-fg">{selected.name}</p>
            <p className="mt-1.5 flex items-center gap-1.5 truncate text-[12px] text-dim">
              <Calendar className="size-3 shrink-0" />
              {selected.dob} · {selected.tob}
            </p>
            <p className="mt-1 flex items-center gap-1.5 truncate text-[12px] text-dim">
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
          className="group mt-5 flex w-full items-center gap-4 rounded-[10px] border border-dashed border-white/[0.14] p-4 text-left transition-colors hover:border-acc/45 hover:bg-app"
        >
          <span
            className={`grid size-14 shrink-0 place-items-center rounded-[10px] border transition-colors ${tone.ring} ${tone.glow} ${tone.text}`}
          >
            <RoleIcon className="size-6" />
          </span>
          <span className="min-w-0 flex-1 text-[14px] font-medium text-mut transition-colors group-hover:text-fg">
            {t.milanChoose}
          </span>
          <ChevronDown className={`size-4 shrink-0 text-dim transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      )}

      {open && (
        <div className="absolute inset-x-5 top-full z-20 -mt-1 rounded-[10px] border border-white/12 bg-inset p-2 shadow-2xl shadow-black/60">
          {kundalis.length > 4 && (
            <label className="relative mb-2 flex items-center">
              <Search className="pointer-events-none absolute left-2.5 size-3.5 text-dim" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.milanSearch}
                className="w-full rounded-[8px] border border-white/[0.09] bg-panel py-2 pl-8 pr-2 text-[12.5px] text-fg placeholder-faint focus:border-acc/45 focus:outline-none"
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
                    className={`flex w-full items-center gap-3 rounded-[8px] border p-2.5 text-left transition-colors disabled:pointer-events-none disabled:opacity-40 ${
                      chosen
                        ? `${tone.ring} bg-panel`
                        : "border-transparent hover:border-white/[0.09] hover:bg-panel"
                    }`}
                  >
                    <ChartAvatar id={k.id} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-medium text-fg">
                        {k.name}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-dim">
                        {k.dob} · {k.place_name}
                      </span>
                    </span>
                    {chosen && <Check className="size-4 shrink-0 text-acc" />}
                  </button>
                </li>
              );
            })}
          </ul>

          {shown.length === 0 && (
            <p className="px-2.5 py-4 text-center text-[12.5px] text-dim">{t.milanNoCharts}</p>
          )}

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onCreate();
            }}
            className="mt-2 flex w-full items-center gap-2.5 rounded-[8px] border-t border-white/[0.07] px-2.5 py-3 text-[12.5px] text-mut transition-colors hover:text-acc"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-[8px] border border-dashed border-white/[0.14]">
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
  const box = size === "lg" ? "size-14 rounded-[10px]" : "size-9 rounded-[8px]";
  const glyph = size === "lg" ? "size-9" : "size-6";

  return (
    <span
      className={`grid shrink-0 place-items-center border border-white/[0.08] ${box}`}
      style={{ background: fill }}
    >
      <ChartLattice stroke={stroke} className={glyph} />
    </span>
  );
}
