"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";

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
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={t.bookTitle}
        className="w-full max-w-[420px] rounded-[14px] border border-white/[0.10] bg-card p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-[16px] font-bold text-paper">{t.bookTitle}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.dashClose}
            className="text-faint transition-colors hover:text-paper"
          >
            <X className="size-4.5" />
          </button>
        </div>

        <form onSubmit={submit} className="mt-4 space-y-4">
          <fieldset>
            <legend className="text-[11px] uppercase tracking-[0.12em] text-faint">
              {t.bookMedium}
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {offered.map((row) => (
                <button
                  key={row.medium}
                  type="button"
                  onClick={() => setMedium(row.medium)}
                  aria-pressed={medium === row.medium}
                  className={`rounded-[8px] border px-3 py-1.5 text-[12.5px] capitalize transition-colors ${
                    medium === row.medium
                      ? "border-gold/50 bg-gold/[0.09] text-gold2"
                      : "border-white/[0.10] text-muted hover:border-white/25"
                  }`}
                >
                  {row.medium}
                </button>
              ))}
            </div>
            {rate ? (
              <p className="mt-2 text-[12px] tabular-nums text-muted">
                {formatMinor(rate.per_minute_minor, rate.currency)}/{t.consultPerMinute}
              </p>
            ) : (
              <p className="mt-2 text-[12px] text-faint">{t.bookUnpriced}</p>
            )}
          </fieldset>

          <fieldset>
            <legend className="text-[11px] uppercase tracking-[0.12em] text-faint">
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
                  className={`flex-1 rounded-[8px] border px-3 py-1.5 text-[12.5px] transition-colors ${
                    later === option.value
                      ? "border-gold/50 bg-gold/[0.09] text-gold2"
                      : "border-white/[0.10] text-muted hover:border-white/25"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {later && (
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[11px] text-faint">{t.bookDate}</span>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    className="mt-1 w-full rounded-[8px] border border-white/[0.09] bg-ink px-3 py-2 text-[13px] text-paper focus:border-gold/45 focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] text-faint">{t.bookTime}</span>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(event) => setTime(event.target.value)}
                    className="mt-1 w-full rounded-[8px] border border-white/[0.09] bg-ink px-3 py-2 text-[13px] text-paper focus:border-gold/45 focus:outline-none"
                  />
                </label>
              </div>
            )}
          </fieldset>

          <label className="block">
            <span className="text-[11px] uppercase tracking-[0.12em] text-faint">{t.bookNote}</span>
            <textarea
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={2000}
              className="mt-2 w-full resize-none rounded-[8px] border border-white/[0.09] bg-ink px-3 py-2 text-[13px] leading-[1.7] text-paper placeholder-faint focus:border-gold/45 focus:outline-none"
            />
          </label>

          {(error || request.isError) && (
            <p role="alert" className="text-[12.5px] text-rose-300">
              {error ?? request.error?.message}
            </p>
          )}

          <button
            type="submit"
            disabled={request.isPending || !rate}
            className="w-full rounded-[9px] bg-gold px-4 py-2.5 text-[13px] font-semibold text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {t.bookConfirm}
          </button>
        </form>
      </div>
    </div>
  );
}
