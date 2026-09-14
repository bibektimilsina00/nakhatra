"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRequestConsultation } from "@/features/consultations/hooks/use-consultations";
import { formatMinor } from "@/features/consultations/money";
import type { RateOut } from "@/features/practitioners/types";
import { useDismissable } from "@/components/ui/use-dismissable";
import { useTranslation } from "@/lib/i18n/language-context";

/**
 * Book a consultation, now or at a time.
 *
 * A booking is not a different kind of thing from a session started now — it
 * is the same consultation with a `scheduled_at`, running the same lifecycle
 * and billed by the same meter. That is why this form produces a request and
 * not a separate "appointment".
 *
 * The date and time inputs are the platform's own: they are localised,
 * keyboard-accessible and correct on mobile without a picker library.
 */
export function BookDialog({
  profileId,
  rates,
  onClose,
  onBooked,
}: {
  profileId: string;
  rates: RateOut[];
  onClose: () => void;
  onBooked: (consultationId: string) => void;
}) {
  const { t } = useTranslation();
  const panel = useRef<HTMLDivElement>(null);
  const request = useRequestConsultation();

  const offered = rates.filter((rate) => rate.is_active);
  const [medium, setMedium] = useState<string>(offered[0]?.medium ?? "chat");
  const [later, setLater] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  useDismissable(true, panel, onClose);

  const rate = offered.find((row) => row.medium === medium);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    let scheduled: string | null = null;
    if (later) {
      // `new Date("2026-09-10T14:30")` is parsed in the reader's own zone,
      // which is what they meant by typing it. `toISOString` then makes it
      // unambiguous for the server and for the practitioner in another zone.
      const at = new Date(`${date}T${time}`);
      if (Number.isNaN(at.getTime()) || at.getTime() <= Date.now()) {
        setError(t.bookPast);
        return;
      }
      scheduled = at.toISOString();
    }

    request.mutate(
      {
        profile_id: profileId,
        medium: medium as "chat" | "voice" | "video",
        scheduled_at: scheduled,
        kundali_id: null,
        opening_message: note.trim(),
      },
      { onSuccess: (consultation) => onBooked(consultation.id) },
    );
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/70 p-4">
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={t.bookTitle}
        className="w-full max-w-[420px] rounded-lg border border-line-strong bg-surface p-5 shadow-overlay"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold text-ink">{t.bookTitle}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.dashClose}
            className="flex min-h-11 min-w-11 items-center justify-center text-dim transition-colors hover:text-ink"
          >
            <X className="size-4.5" />
          </button>
        </div>

        <form onSubmit={submit} className="mt-4 space-y-4">
          <fieldset>
            <legend className="text-2xs uppercase tracking-[0.12em] text-dim">
              {t.bookMedium}
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {offered.map((row) => (
                <button
                  key={row.medium}
                  type="button"
                  onClick={() => setMedium(row.medium)}
                  aria-pressed={medium === row.medium}
                  className={`flex min-h-11 items-center rounded-sm border px-3 text-xs capitalize transition-colors ${
                    medium === row.medium
                      ? "border-accent bg-accent-tint text-accent-ink"
                      : "border-line-strong text-muted hover:border-accent"
                  }`}
                >
                  {row.medium}
                </button>
              ))}
            </div>
            {rate ? (
              <p className="mt-2 text-xs tabular-nums text-muted">
                {formatMinor(rate.per_minute_minor, rate.currency)}/{t.consultPerMinute}
              </p>
            ) : (
              <p className="mt-2 text-xs text-dim">{t.bookUnpriced}</p>
            )}
          </fieldset>

          <fieldset>
            <legend className="text-2xs uppercase tracking-[0.12em] text-dim">
              {t.bookWhen}
            </legend>
            <div className="mt-2 flex gap-2">
              {[
                { value: false, label: t.bookNow },
                { value: true, label: t.bookLater },
              ].map((option) => (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => setLater(option.value)}
                  aria-pressed={later === option.value}
                  className={`flex min-h-11 flex-1 items-center justify-center rounded-sm border px-3 text-xs transition-colors ${
                    later === option.value
                      ? "border-accent bg-accent-tint text-accent-ink"
                      : "border-line-strong text-muted hover:border-accent"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {later && (
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-xs text-dim">{t.bookDate}</span>
                  <Input
                    type="date"
                    required
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    className="mt-1"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-dim">{t.bookTime}</span>
                  <Input
                    type="time"
                    required
                    value={time}
                    onChange={(event) => setTime(event.target.value)}
                    className="mt-1"
                  />
                </label>
              </div>
            )}
          </fieldset>

          <label className="block">
            <span className="text-2xs uppercase tracking-[0.12em] text-dim">{t.bookNote}</span>
            <textarea
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={2000}
              className="mt-2 w-full resize-none rounded-md border border-line-strong bg-surface px-3 py-2 text-sm leading-[1.7] text-ink placeholder:text-dim focus-visible:outline-none focus-visible:border-ring"
            />
          </label>

          {(error || request.isError) && (
            <p role="alert" className="text-xs text-danger">
              {error ?? request.error?.message}
            </p>
          )}

          <Button type="submit" disabled={request.isPending || !rate} className="w-full">
            {t.bookConfirm}
          </Button>
        </form>
      </div>
    </div>
  );
}
