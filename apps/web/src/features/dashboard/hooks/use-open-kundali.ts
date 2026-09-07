"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useCreateKundali } from "@/features/kundali/hooks/use-create-kundali";
import { saveKundaliToStorage } from "@/features/kundali/store/kundali-store";
import type { BirthDetailsIn, Chart } from "@/features/kundali/types";
import type { SavedKundali } from "@/features/vault/types";

/**
 * Opening a saved chart.
 *
 * The chart is recalculated rather than stored: the ephemeris is the source of
 * truth, and positions cached at save time would silently disagree with the
 * engine after any `engine_version` bump (CLAUDE.md rule 4). What the vault
 * keeps is the birth data, which does not change.
 *
 * A hook rather than a copy in each caller — the sidebar's recent list and the
 * card grid both open charts, and two copies of "recalculate, stash, navigate"
 * is two places for the stash step to be forgotten.
 */
export function useOpenKundali(
  /**
   * Called with the recalculated chart instead of navigating. The switcher in
   * the reading and live headers is already on the destination page — pushing
   * /reading there would be a no-op that loses the chat you were having.
   */
  onOpened?: (birth: BirthDetailsIn, chart: Chart) => void,
) {
  const router = useRouter();
  const create = useCreateKundali();
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [failedId, setFailedId] = useState<string | null>(null);

  const open = async (saved: SavedKundali) => {
    // Rows saved before `tz_name` was stored cannot be recalculated without
    // guessing a historical offset, which is the one thing rule 5 forbids.
    if (!saved.birth) return;
    setFailedId(null);
    setOpeningId(saved.id);
    try {
      const chart = await create.mutateAsync(saved.birth);
      saveKundaliToStorage(saved.birth, chart);
      if (onOpened) {
        onOpened(saved.birth, chart);
        setOpeningId(null);
      } else {
        router.push("/reading");
      }
    } catch {
      setFailedId(saved.id);
      setOpeningId(null);
    }
  };

  return { open, openingId, failedId };
}
