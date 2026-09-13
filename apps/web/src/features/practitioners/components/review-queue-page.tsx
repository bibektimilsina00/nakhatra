"use client";

import { useState } from "react";
import { Check, ShieldQuestion, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cardClasses } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
        <span className={`text-2xs text-accent-strong ${eyebrow}`}>Admin</span>
        <h1 className="mt-3 text-2xl font-bold leading-tight text-ink">
          {t.practReviewQueue}
        </h1>

        <div className="mt-6 flex flex-wrap gap-2">
          {STATES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setState(value)}
              aria-pressed={state === value}
              className={`flex min-h-11 items-center rounded-sm border px-2.5 text-xs transition-colors ${
                state === value
                  ? "border-accent bg-accent-tint text-accent-ink"
                  : "border-line-strong text-muted hover:border-accent hover:text-ink"
              }`}
            >
              {value.replace("_", " ")}
            </button>
          ))}
        </div>

        {queue.isError ? (
          <p className="mt-8 text-sm text-dim">
            This account cannot review applications.
          </p>
        ) : queue.isPending ? (
          <div className="mt-6 space-y-3">
            {[0, 1].map((row) => (
              <div
                key={row}
                className="h-[120px] animate-pulse rounded-lg border border-line-strong bg-surface"
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
          <div className="mt-6 rounded-lg border border-dashed border-line-strong px-6 py-12 text-center">
            <span className="mx-auto grid size-11 place-items-center rounded-full border border-line-strong text-accent-strong">
              <ShieldQuestion className="size-5" />
            </span>
            <p className="mt-3 text-sm text-muted">Nothing in this queue.</p>
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
    <li className={cardClasses()}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-semibold text-ink">{application.full_name}</p>
          <p className="mt-0.5 text-xs text-dim">
            {application.practice_type} · {application.city || application.country} ·{" "}
            {application.years_experience} {t.dashYears} ·{" "}
            {(application.languages ?? []).join(", ") || "—"}
          </p>
        </div>
        <span className="rounded-sm border border-line-strong px-2 py-0.5 text-2xs uppercase text-muted">
          {application.state.replace("_", " ")}
        </span>
      </div>

      {application.credentials && (
        <p className="mt-3 text-sm leading-[1.7] text-muted">{application.credentials}</p>
      )}

      {application.sample_reading && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-accent-strong">Sample reading</summary>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-[1.75] text-muted">
            {application.sample_reading}
          </p>
        </details>
      )}

      {!decided && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <Input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Note to the applicant"
            className="min-w-0 flex-1"
          />
          <Button
            type="button"
            disabled={review.isPending}
            onClick={() =>
              review.mutate({
                id: application.id,
                decision: { decision: "approve", decision_note: note, reviewer_note: "" },
              })
            }
          >
            <Check className="size-3.5" />
            {t.practApprove}
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={review.isPending}
            onClick={() =>
              review.mutate({
                id: application.id,
                decision: { decision: "reject", decision_note: note, reviewer_note: "" },
              })
            }
          >
            <X className="size-3.5" />
            {t.practReject}
          </Button>
        </div>
      )}

      {application.decision_note && decided && (
        <p className="mt-3 border-t border-line pt-3 text-xs text-dim">
          {application.decision_note}
        </p>
      )}
    </li>
  );
}
