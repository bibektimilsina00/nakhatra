"use client";

import { useState } from "react";
import { MapPin, MoreHorizontal, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useDeleteKundali } from "@/features/vault/hooks/use-vault";
import type { SavedKundali } from "@/features/vault/types";
import { ChartLattice, chartArt } from "@/features/kundali/chart-art";
import { useTranslation } from "@/lib/i18n/language-context";

export function KundaliCard({
  kundali,
  busy,
  failed,
  onOpen,
  onAsk,
}: {
  kundali: SavedKundali;
  busy: boolean;
  failed: boolean;
  onOpen: () => void;
  /**
   * Open *this* chart in live mode. It used to navigate straight to
   * `/reading/live`, which starts a conversation about whichever chart happened
   * to be stashed — usually not the card that was clicked.
   */
  onAsk: () => void;
}) {
  const { t } = useTranslation();
  const remove = useDeleteKundali();
  const [confirming, setConfirming] = useState(false);
  const { fill, stroke } = chartArt(kundali.id);
  const openable = Boolean(kundali.birth);

  // Hand-rolled rather than the `Button` primitive (its variants don't cover
  // this row's mixed ghost/icon-only shapes), but still held to the same
  // ≥44×44 touch-target floor as any other control.
  const ghost =
    "flex min-h-11 min-w-11 items-center justify-center rounded-sm border border-line-strong px-2.5 text-xs text-muted transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-40";

  return (
    <article className="relative overflow-hidden rounded-lg border border-line-strong bg-surface transition-colors hover:border-accent/50">
      <div className="relative flex h-[104px] items-center justify-center" style={{ background: fill }}>
        <ChartLattice stroke={stroke} className="size-[74px]" />

        {busy && (
          <span className="absolute inset-0 grid place-items-center bg-cream/75 text-sm font-semibold text-accent-ink">
            {t.dashOpening}
          </span>
        )}
      </div>

      <div className="px-3.5 pb-3.5 pt-3">
        <h3 className="truncate text-sm font-semibold text-ink">{kundali.name}</h3>
        <p className="mt-1 truncate text-xs text-muted">
          {kundali.dob} · {kundali.tob}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-dim">
          <MapPin className="size-3 shrink-0" />
          <span className="truncate">{kundali.place_name}</span>
        </p>

        <div className="mt-3 flex gap-1.5 border-t border-line pt-3">
          <button
            type="button"
            disabled={!openable || busy}
            onClick={onOpen}
            title={openable ? undefined : t.dashNotRecalculable}
            className="flex min-h-11 flex-1 items-center justify-center rounded-sm bg-accent-strong px-2 text-xs font-bold text-white transition-colors hover:bg-accent-ink disabled:pointer-events-none disabled:opacity-40"
          >
            {t.dashReadingAction}
          </button>
          <button
            type="button"
            disabled={!openable || busy}
            onClick={onAsk}
            title={openable ? undefined : t.dashNotRecalculable}
            className={ghost}
          >
            {t.dashAsk}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label={`${t.dashDelete}: ${kundali.name}`}
            className={ghost}
          >
            <MoreHorizontal className="size-3.5" />
          </button>
        </div>

        {!openable && (
          <p className="mt-3 border-t border-line pt-2.5 text-xs leading-[1.5] text-dim">
            {t.dashNotRecalculable}
          </p>
        )}
        {failed && (
          <p className="mt-3 border-t border-line pt-2.5 text-xs text-danger">
            {t.dashLoadFailed}
          </p>
        )}
      </div>

      {confirming && (
        <div className="absolute inset-0 grid place-items-center bg-surface/95 p-4 text-center">
          <div>
            <Trash2 className="mx-auto size-4 text-danger" />
            <p className="mt-2 text-sm font-semibold text-ink">{t.dashConfirmDelete}</p>
            <p className="mt-1 truncate text-xs text-muted">{kundali.name}</p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="danger"
                disabled={remove.isPending}
                onClick={() => remove.mutate(kundali.id, { onSettled: () => setConfirming(false) })}
              >
                {t.dashDelete}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setConfirming(false)}>
                {t.dashCancel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
