"use client";

import { useState } from "react";
import { Check, ShieldQuestion, X } from "lucide-react";

import { AppShell } from "@/features/dashboard/components/app-shell";
import { useReview, useReviewQueue } from "@/features/practitioners/hooks/use-practitioners";
import type { ApplicationReview } from "@/features/practitioners/types";
import { useLatinTracking, useTranslation } from "@/lib/i18n/language-context";

const STATES = ["submitted", "in_review", "approved", "rejected"] as const;

/**
 * The review queue.
 *
 * Client-side this is an ordinary page; the authorisation is the endpoint's,
 * which answers 403 to anyone who is not an admin. A non-admin who finds this
 * URL sees the error, not the queue — hiding the route in the UI is not the
 * control, and treating it as one is how admin pages leak.
 */
export function ReviewQueuePage() {
  const { t } = useTranslation();
  const eyebrow = useLatinTracking("uppercase tracking-[0.2em]");
  const [state, setState] = useState<string | undefined>("submitted");
  const queue = useReviewQueue(state, true);

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-[900px] px-5 pb-24 pt-10 sm:px-8">
        <span className={`text-[11px] text-acc ${eyebrow}`}>Admin</span>
        <h1 className="mt-3 text-[26px] font-bold leading-tight text-fg sm:text-[30px]">
          {t.practReviewQueue}
        </h1>

        <div className="mt-6 flex flex-wrap gap-2">
          {STATES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setState(value)}
              aria-pressed={state === value}
              className={`rounded-[6px] border px-2.5 py-1 text-[11.5px] transition-colors ${
                state === value
                  ? "border-acc/50 bg-acc/[0.09] text-acc2"
                  : "border-white/[0.10] text-mut hover:border-brd2 hover:text-fg"
              }`}
            >
              {value.replace("_", " ")}
            </button>
          ))}
        </div>

        {queue.isError ? (
          <p className="mt-8 text-[13.5px] text-dim">
            This account cannot review applications.
          </p>
        ) : queue.isPending ? (
          <div className="mt-6 space-y-3">
            {[0, 1].map((row) => (
              <div
                key={row}
                className="h-[120px] animate-pulse rounded-[12px] border border-white/[0.07] bg-panel"
              />
            ))}
          </div>
        ) : queue.data && queue.data.length > 0 ? (
          <ul className="mt-6 space-y-3">
            {queue.data.map((application) => (
              <ApplicationRow key={application.id} application={application} />
            ))}
          </ul>
        ) : (
          <div className="mt-6 rounded-[12px] border border-dashed border-white/[0.14] px-6 py-12 text-center">
            <span className="mx-auto grid size-11 place-items-center rounded-full border border-white/[0.10] text-acc">
              <ShieldQuestion className="size-5" />
            </span>
            <p className="mt-3 text-[13.5px] text-mut">Nothing in this queue.</p>
          </div>
        )}
      </main>
    </AppShell>
  );
}

function ApplicationRow({ application }: { application: ApplicationReview }) {
  const { t } = useTranslation();
  const review = useReview();
  const [note, setNote] = useState("");
  const decided = application.state === "approved" || application.state === "rejected";

  return (
    <li className="rounded-[12px] border border-white/[0.09] bg-panel p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-fg">{application.full_name}</p>
          <p className="mt-0.5 text-[12px] text-dim">
            {application.practice_type} · {application.city || application.country} ·{" "}
            {application.years_experience} {t.dashYears} ·{" "}
            {(application.languages ?? []).join(", ") || "—"}
          </p>
        </div>
        <span className="rounded-[6px] border border-white/[0.10] px-2 py-0.5 text-[10.5px] uppercase text-mut">
          {application.state.replace("_", " ")}
        </span>
      </div>

      {application.credentials && (
        <p className="mt-3 text-[13px] leading-[1.7] text-mut">{application.credentials}</p>
      )}

      {application.sample_reading && (
        <details className="mt-3">
          <summary className="cursor-pointer text-[12.5px] text-acc">Sample reading</summary>
          <p className="mt-2 whitespace-pre-wrap text-[13px] leading-[1.75] text-mut">
            {application.sample_reading}
          </p>
        </details>
      )}

      {!decided && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/[0.07] pt-4">
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Note to the applicant"
            className="min-w-0 flex-1 rounded-[8px] border border-white/[0.09] bg-app px-3 py-2 text-[12.5px] text-fg placeholder-faint focus:border-acc/45 focus:outline-none"
          />
          <button
            type="button"
            disabled={review.isPending}
            onClick={() =>
              review.mutate({
                id: application.id,
                decision: { decision: "approve", decision_note: note, reviewer_note: "" },
              })
            }
            className="inline-flex items-center gap-1.5 rounded-[8px] bg-acc px-3.5 py-2 text-[12.5px] font-bold text-ink transition-colors hover:bg-acc2 disabled:opacity-40"
          >
            <Check className="size-3.5" />
            {t.practApprove}
          </button>
          <button
            type="button"
            disabled={review.isPending}
            onClick={() =>
              review.mutate({
                id: application.id,
                decision: { decision: "reject", decision_note: note, reviewer_note: "" },
              })
            }
            className="inline-flex items-center gap-1.5 rounded-[8px] border border-white/12 px-3.5 py-2 text-[12.5px] text-mut transition-colors hover:border-rose-400/40 hover:text-rose-300 disabled:opacity-40"
          >
            <X className="size-3.5" />
            {t.practReject}
          </button>
        </div>
      )}

      {application.decision_note && decided && (
        <p className="mt-3 border-t border-white/[0.07] pt-3 text-[12.5px] text-dim">
          {application.decision_note}
        </p>
      )}
    </li>
  );
}
