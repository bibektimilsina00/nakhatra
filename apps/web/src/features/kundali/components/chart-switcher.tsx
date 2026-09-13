"use client";

import { useCallback, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, Plus } from "lucide-react";

import { useDismissable } from "@/components/ui/use-dismissable";
import { ChartLattice, chartArt } from "@/features/kundali/chart-art";
import type { BirthDetailsIn, Chart } from "@/features/kundali/types";
import { useOpenKundali } from "@/features/dashboard/hooks/use-open-kundali";
import { useSavedKundalis } from "@/features/vault/hooks/use-vault";
import { useTranslation } from "@/lib/i18n/language-context";

/**
 * Which chart this page is reading, and how to change it.
 *
 * The reading and live pages both take their chart from `sessionStorage`, which
 * is right when you arrive by clicking a card and wrong when you arrive from
 * the sidebar: you get whichever chart you happened to open last, with nothing
 * on screen saying so. Naming the active chart and making it a control fixes
 * both halves — you can see which one it picked, and change it.
 *
 * Selecting recalculates from the vault's birth data rather than reusing stored
 * positions (CLAUDE.md rule 4), then hands the chart back to the page instead
 * of navigating, so a live conversation survives the switch.
 */
export function ChartSwitcher({
  activeName,
  onSelect,
  onCreate,
  trigger,
}: {
  activeName: string;
  onSelect: (birth: BirthDetailsIn, chart: Chart) => void;
  onCreate?: () => void;
  /**
   * What the button shows. The reading and live bars pass their own title, so
   * the name already on screen *is* the control — a separate chip beside it was
   * the same word twice.
   */
  trigger?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const { data: kundalis = [] } = useSavedKundalis();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  const { open: openKundali, openingId } = useOpenKundali((birth, chart) => {
    onSelect(birth, chart);
    setOpen(false);
  });

  useDismissable(open, box, useCallback(() => setOpen(false), []));

  return (
    <div ref={box} className={`relative ${trigger ? "min-w-0" : "shrink-0"}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={
          trigger
            ? "flex min-w-0 items-center gap-2 rounded-md px-2 py-1 text-left transition-colors hover:bg-accent-wash"
            : "flex max-w-[220px] items-center gap-2 rounded-md border border-line-strong px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-line-strong hover:text-ink"
        }
      >
        {trigger ?? <span className="truncate">{activeName}</span>}
        <ChevronDown className={`size-3.5 shrink-0 text-dim transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[280px] rounded-xl border border-line-strong bg-surface p-1.5 shadow-raised">
          <ul className="max-h-[300px] space-y-1 overflow-y-auto">
            {kundalis.map((k) => {
              const usable = Boolean(k.birth);
              const busy = openingId === k.id;
              const active = k.name === activeName;
              return (
                <li key={k.id}>
                  <button
                    type="button"
                    disabled={!usable || busy}
                    title={usable ? undefined : t.dashNotRecalculable}
                    onClick={() => openKundali(k)}
                    className={`flex w-full items-center gap-2.5 rounded-md border p-2 text-left transition-colors disabled:pointer-events-none disabled:opacity-40 ${
                      active
                        ? "border-accent/35 bg-accent-wash"
                        : "border-transparent hover:border-line-strong hover:bg-cream"
                    }`}
                  >
                    <ChartTile id={k.id} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">
                        {k.name}
                      </span>
                      <span className="mt-0.5 block truncate text-2xs text-dim">
                        {k.dob} · {k.place_name}
                      </span>
                    </span>
                    {busy ? (
                      <Loader2 className="size-3.5 shrink-0 animate-spin text-accent-strong" />
                    ) : (
                      active && <Check className="size-3.5 shrink-0 text-accent-strong" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {kundalis.length === 0 && (
            <p className="px-2.5 py-4 text-center text-xs text-dim">{t.milanNoCharts}</p>
          )}

          {onCreate && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onCreate();
              }}
              className="mt-1 flex min-h-11 w-full items-center gap-2 rounded-md border-t border-line px-2.5 py-2.5 text-xs text-muted transition-colors hover:text-accent-strong"
            >
              <Plus className="size-3.5" />
              {t.dashNewKundali}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ChartTile({ id }: { id: string }) {
  const { fill, stroke } = chartArt(id);
  return (
    <span
      className="grid size-8 shrink-0 place-items-center rounded-md border border-line-strong"
      style={{ background: fill }}
    >
      <ChartLattice stroke={stroke} className="size-5" />
    </span>
  );
}
