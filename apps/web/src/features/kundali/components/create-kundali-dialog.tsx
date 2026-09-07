"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";

import { useSession } from "@/features/auth/hooks/use-auth";
import { toRequestBody } from "@/features/kundali/api/kundali.api";
import { BirthDetailsForm } from "@/features/kundali/components/birth-details-form";
import { useCreateKundali } from "@/features/kundali/hooks/use-create-kundali";
import { saveKundaliToStorage } from "@/features/kundali/store/kundali-store";
import { useSaveKundali } from "@/features/vault/hooks/use-vault";
import { ApiError, NetworkError } from "@/lib/api/errors";
import { useTranslation } from "@/lib/i18n/language-context";

/**
 * Casting a chart, as a dialog.
 *
 * Creation used to be a page of its own wrapped in a second navigation bar, a
 * promo banner and a footer — four fields behind a page transition. As a dialog
 * it opens over whatever you were doing and returns you there, which is what
 * the task actually is.
 *
 * On success the chart is stashed for the reading, and — when signed in —
 * saved to the vault. That last step had no caller anywhere in the app before
 * this, so a chart cast on the web could never appear in "Your kundalis".
 */
export function CreateKundaliDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const { isSignedIn } = useSession();
  const create = useCreateKundali();
  const save = useSaveKundali();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    addEventListener("keydown", onKey);
    // The page behind must not scroll while a dialog covers it.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  const error = create.error;
  const fieldErrors = error instanceof ApiError ? error.fieldErrors : undefined;
  const banner = bannerFor(error);

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <button
        type="button"
        aria-label={t.dashClose}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* A flex wrapper at full height centres the panel, and still scrolls
          when the viewport is shorter than the form. */}
      <div className="relative flex min-h-full items-center justify-center p-4">
        <div className="w-[min(92vw,600px)]">
        <div
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-label={t.dashNewKundali}
          className="rounded-[12px] border border-white/12 bg-ink2 shadow-2xl shadow-black/60"
        >
          <div className="flex items-center justify-between rounded-t-[12px] border-b border-white/[0.08] px-5 py-4">
            <h2 className="text-[15px] font-semibold text-paper">{t.dashNewKundali}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={t.dashClose}
              className="rounded-[7px] p-1.5 text-muted transition-colors hover:bg-white/[0.06] hover:text-paper"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="px-5 pb-6 pt-5 sm:px-7">
            {banner && (
              <div className="mb-4 rounded-[8px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {banner}
              </div>
            )}

            <BirthDetailsForm
              chrome={false}
              pending={create.isPending}
              serverFieldErrors={fieldErrors}
              onSubmit={async (values, place) => {
                const birth = toRequestBody(values, place);
                const chart = await create.mutateAsync(birth);

                // The vault is a convenience, not the point of the click. If it
                // fails the chart still exists and the reading still opens —
                // losing the reading because a save failed would be the worse
                // trade.
                if (isSignedIn) {
                  try {
                    await save.mutateAsync({
                      // `gender` is deliberately absent. It is not in the
                      // contract's `required` list, so the API accepts this —
                      // but openapi-typescript marks any field with a default
                      // as required, so the type disagrees with the spec. The
                      // cast records that, rather than inventing a value for a
                      // field nothing reads (see the note in the API schema).
                      ...({} as { gender: string }),
                      name: birth.name,
                      dob: birth.date,
                      tob: birth.time,
                      lat: birth.latitude,
                      lon: birth.longitude,
                      tz_name: birth.tz_name,
                      tz_offset: offsetHours(birth.tz_name, birth.date, birth.time),
                      place_name: birth.place_label,
                      // No `birth` field on the way in: the server rebuilds it
                      // from these columns, which is what makes a saved chart
                      // recalculable later.
                    });
                  } catch {
                    // Deliberately swallowed; see above.
                  }
                }

                saveKundaliToStorage(birth, chart);
                onClose();
                // Via /generating, not straight to the reading. The chart is
                // already stashed above, so that page is free to run its
                // full-screen animation and hand over when it is done — which
                // is what it was built for and what the marketing hero has
                // always done. Landing on a bare reading the instant the form
                // submits reads as if nothing was computed.
                router.push("/generating");
              }}
            />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The zone's offset at that birth moment, in hours.
 *
 * `SavedKundaliIn` requires it, and it must be *derived* rather than assumed:
 * Kathmandu was +5:30 until 1986 and +5:41:16 before that, so a constant would
 * put a 1975 birth a quarter-hour out (CLAUDE.md rule 5). `tz_name` is sent
 * alongside and remains the source of truth.
 */
function offsetHours(tz: string, date: string, time: string): number {
  const instant = new Date(`${date}T${time}:00Z`);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
    .formatToParts(instant)
    .reduce<Record<string, number>>((acc, part) => {
      if (part.type !== "literal") acc[part.type] = Number(part.value);
      return acc;
    }, {});

  // `hour` comes back as 24 at midnight in some ICU versions.
  const asZoned = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour % 24,
    parts.minute,
    parts.second,
  );
  return (asZoned - instant.getTime()) / 3_600_000;
}

function bannerFor(error: unknown): string | null {
  if (error instanceof NetworkError) return error.message;
  if (error instanceof ApiError) {
    // Field-level messages are shown on the inputs; only surface a banner when
    // there is nothing to attach them to.
    return Object.keys(error.fieldErrors).length > 0 ? null : error.message;
  }
  return error ? "Something went wrong." : null;
}
