"use client";

import { RotateCw, TriangleAlert } from "lucide-react";

import { useTranslation } from "@/lib/i18n/language-context";

/**
 * Which reading you are actually looking at.
 *
 * The page paints a deterministic reading from `report-generator.ts` the
 * instant the chart exists, then swaps in the model's when it arrives ~40s
 * later. That is good for perceived speed and terrible for trust: the two look
 * identical, so a model that had been failing for weeks was indistinguishable
 * from one that worked.
 *
 * So the state is always named. Pending says a calculated reading is on screen
 * and a written one is coming; a failure says so and offers a retry; the rule
 * engine is never passed off as the astrologer.
 */
export function ReadingStatus({
  isPending,
  isError,
  source,
  onRetry,
}: {
  isPending: boolean;
  isError: boolean;
  /** `undefined` until the request resolves. */
  source: "llm" | "rule_engine" | undefined;
  onRetry: () => void;
}) {
  const { t } = useTranslation();

  // Nothing while it works — the shimmering cards are the loading state.
  if (isPending) return null;

  // A 200 carrying `rule_engine` is the server's own fallback: the model was
  // reached and its answer was unusable. To the reader that is the same
  // outcome as an error, so it reads the same and offers the same retry.
  if (isError || source === "rule_engine") {
    return (
      <Bar>
        <TriangleAlert className="size-4 shrink-0 text-acc" />
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-medium text-fg">{t.readingCalculated}</span>
          <span className="mt-0.5 block text-[11.5px] leading-[1.6] text-dim">
            {t.readingCalculatedNote}
          </span>
        </span>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-[8px] border border-white/12 px-3 py-1.5 text-[12px] text-mut transition-colors hover:border-brd2 hover:text-fg"
        >
          <RotateCw className="size-3.5" />
          {t.milanRetry}
        </button>
      </Bar>
    );
  }

  return null;
}

function Bar({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-center gap-3 rounded-[8px] border border-acc/30 bg-[#1A150B] px-4 py-3">
      {children}
    </div>
  );
}


/** Placeholder cards while the model writes. Nothing is shown until it does. */
export function ReadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-6" aria-hidden>
      {Array.from({ length: count }, (_, card) => (
        <div key={card} className="rounded-[8px] border border-brd bg-panel p-5">
          <div className="flex items-center gap-3">
            <div className="size-9 shrink-0 animate-pulse rounded-[8px] bg-fg/[0.06]" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3.5 w-40 animate-pulse rounded bg-fg/[0.06]" />
              <div className="h-2.5 w-56 animate-pulse rounded bg-fg/[0.04]" />
            </div>
          </div>
          <div className="mt-5 space-y-2.5">
            {[100, 96, 88, 92, 64].map((w, i) => (
              <div
                key={w}
                className="h-2.5 animate-pulse rounded bg-white/[0.05]"
                style={{ width: `${w}%`, animationDelay: `${i * 90}ms` }}
              />
            ))}
          </div>
          <div className="mt-5 flex gap-2">
            {[120, 148, 96].map((w) => (
              <div key={w} className="h-6 animate-pulse rounded-[6px] bg-fg/[0.04]" style={{ width: w }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
