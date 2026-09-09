"use client";

import { useState } from "react";
import { MapPin, MoreHorizontal, Trash2 } from "lucide-react";

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

  const ghost =
    "rounded-[7px] border border-white/12 px-2.5 py-1.5 text-[11.5px] text-mut transition-colors hover:border-brd2 hover:text-fg disabled:pointer-events-none disabled:opacity-40";

  return (
    <article className="relative overflow-hidden rounded-[10px] border border-white/[0.09] bg-panel transition-colors hover:border-brd2">
      <div className="relative flex h-[104px] items-center justify-center" style={{ background: fill }}>
        <ChartLattice stroke={stroke} className="size-[74px]" />

        {busy && (
          <span className="absolute inset-0 grid place-items-center bg-app/75 text-[12px] font-semibold text-acc2">
            {t.dashOpening}
          </span>
        )}
      </div>

      <div className="px-3.5 pb-3.5 pt-3">
        <h3 className="truncate text-[14px] font-semibold text-fg">{kundali.name}</h3>
        <p className="mt-1 truncate text-[11px] text-mut">
          {kundali.dob} · {kundali.tob}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-[11px] text-dim">
          <MapPin className="size-3 shrink-0" />
          <span className="truncate">{kundali.place_name}</span>
        </p>

        <div className="mt-3 flex gap-1.5 border-t border-white/[0.07] pt-3">
          <button
            type="button"
            disabled={!openable || busy}
            onClick={onOpen}
            title={openable ? undefined : t.dashNotRecalculable}
            className="flex-1 rounded-[7px] bg-acc px-2 py-1.5 text-[11.5px] font-bold text-ink transition-colors hover:bg-acc2 disabled:pointer-events-none disabled:opacity-40"
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
          <p className="mt-3 border-t border-white/[0.07] pt-2.5 text-[11px] leading-[1.5] text-dim">
            {t.dashNotRecalculable}
          </p>
        )}
        {failed && (
          <p className="mt-3 border-t border-white/[0.07] pt-2.5 text-[11px] text-rose-300">
            {t.dashLoadFailed}
          </p>
        )}
      </div>

      {confirming && (
        <div className="absolute inset-0 grid place-items-center bg-app/95 p-4 text-center">
          <div>
            <Trash2 className="mx-auto size-4 text-rose-300" />
            <p className="mt-2 text-[13px] font-semibold text-fg">{t.dashConfirmDelete}</p>
            <p className="mt-1 truncate text-[12px] text-mut">{kundali.name}</p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={remove.isPending}
                onClick={() => remove.mutate(kundali.id, { onSettled: () => setConfirming(false) })}
                className="rounded-[6px] bg-rose-500/90 px-3 py-1.5 text-[12px] font-bold text-white transition-colors hover:bg-rose-500 disabled:opacity-50"
              >
                {t.dashDelete}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-[6px] border border-white/12 px-3 py-1.5 text-[12px] text-mut transition-colors hover:text-fg"
              >
                {t.dashCancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
