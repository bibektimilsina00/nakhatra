"use client";

import { useState } from "react";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

import { AppShell } from "@/features/dashboard/components/app-shell";
import { useApply, useMyApplication } from "@/features/practitioners/hooks/use-practitioners";
import type { ApplicationIn } from "@/features/practitioners/types";
import { useLatinTracking, useTranslation } from "@/lib/i18n/language-context";

const LANGUAGES = ["ne", "hi", "en"];
const TRADITIONS = ["parashari", "kp", "nadi", "jaimini"];

/**
 * Applying to practise.
 *
 * Shows the existing application rather than the form when there is one — the
 * endpoint refuses a second application while one is open, and a form that
 * submits into a 400 is a worse way to learn that than a status card.
 */
export function ApplyPage() {
  const { t } = useTranslation();
  const eyebrow = useLatinTracking("uppercase tracking-[0.2em]");
  const existing = useMyApplication(true);
  const apply = useApply();

  const [form, setForm] = useState<ApplicationIn>({
    practice_type: "astrologer",
    full_name: "",
    phone: "",
    city: "",
    country: "NP",
    years_experience: 0,
    credentials: "",
    sample_reading: "",
    languages: [],
    traditions: [],
  });

  const toggle = (key: "languages" | "traditions", value: string) =>
    setForm((current) => ({
      ...current,
      // `languages` and `traditions` are optional in the generated type, so the
      // empty list is spelled out rather than assumed.
      [key]: (current[key] ?? []).includes(value)
        ? (current[key] ?? []).filter((v) => v !== value)
        : [...(current[key] ?? []), value],
    }));

  const application = existing.data;
  const field =
    "w-full rounded-[8px] border border-white/[0.09] bg-card px-3 py-2.5 text-[13.5px] text-paper placeholder-faint focus:border-gold/45 focus:outline-none";
  const chip = (active: boolean) =>
    `rounded-[6px] border px-2.5 py-1 text-[11.5px] uppercase transition-colors ${
      active
        ? "border-gold/50 bg-gold/[0.09] text-gold2"
        : "border-white/[0.10] text-muted hover:border-white/25 hover:text-paper"
    }`;

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-[720px] px-5 pb-24 pt-10 sm:px-8">
        <span className={`text-[11px] text-gold ${eyebrow}`}>{t.dashJyotish}</span>
        <h1 className="mt-3 text-[26px] font-bold leading-tight text-paper sm:text-[30px]">
          {t.practApplyTitle}
        </h1>
        <p className="mt-3 max-w-lg text-[14px] leading-[1.75] text-muted">{t.practApplyLead}</p>

        {application ? (
          <StatusCard state={application.state} note={application.decision_note} />
        ) : (
          <form
            className="mt-8 space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              apply.mutate(form);
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-[12px] text-muted">{t.fullName}</span>
                <input
                  required
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className={field}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12px] text-muted">{t.birthPlace}</span>
                <input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className={field}
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <fieldset>
                <legend className="mb-1.5 text-[12px] text-muted">Practice</legend>
                <div className="flex gap-2">
                  {(["astrologer", "pandit"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm({ ...form, practice_type: value })}
                      aria-pressed={form.practice_type === value}
                      className={`${chip(form.practice_type === value)} capitalize`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </fieldset>
              <label className="block">
                <span className="mb-1.5 block text-[12px] text-muted">Years practising</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.years_experience}
                  onChange={(e) =>
                    setForm({ ...form, years_experience: Number(e.target.value) || 0 })
                  }
                  className={field}
                />
              </label>
            </div>

            <fieldset>
              <legend className="mb-1.5 text-[12px] text-muted">{t.selectLanguage}</legend>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggle("languages", value)}
                    aria-pressed={(form.languages ?? []).includes(value)}
                    className={chip((form.languages ?? []).includes(value))}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-1.5 text-[12px] text-muted">Traditions</legend>
              <div className="flex flex-wrap gap-2">
                {TRADITIONS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggle("traditions", value)}
                    aria-pressed={(form.traditions ?? []).includes(value)}
                    className={chip((form.traditions ?? []).includes(value))}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="block">
              <span className="mb-1.5 block text-[12px] text-muted">
                Where you trained, who taught you
              </span>
              <textarea
                rows={3}
                value={form.credentials}
                onChange={(e) => setForm({ ...form, credentials: e.target.value })}
                className={`${field} resize-y`}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[12px] text-muted">
                A sample reading, in your own words
              </span>
              <textarea
                rows={6}
                value={form.sample_reading}
                onChange={(e) => setForm({ ...form, sample_reading: e.target.value })}
                className={`${field} resize-y`}
              />
              {/* Said plainly, because it is the part a reviewer actually
                  judges — a CV does not show how someone reads a chart. */}
              <span className="mt-1.5 block text-[11.5px] text-faint">
                This is what the reviewer reads most closely.
              </span>
            </label>

            {apply.isError && (
              <p role="alert" className="text-[13px] text-rose-300">
                {apply.error.message}
              </p>
            )}

            <button
              type="submit"
              disabled={apply.isPending || !form.full_name.trim()}
              className="rounded-[8px] bg-gold px-5 py-2.5 text-[13.5px] font-bold text-ink transition-colors hover:bg-gold2 disabled:pointer-events-none disabled:opacity-40"
            >
              {t.practApplySubmit}
            </button>
          </form>
        )}
      </main>
    </AppShell>
  );
}

function StatusCard({ state, note }: { state: string; note: string }) {
  const { t } = useTranslation();
  const shown = {
    submitted: { icon: Clock, label: t.practApplyPending, tone: "text-gold" },
    in_review: { icon: Clock, label: t.practApplyPending, tone: "text-gold" },
    approved: { icon: CheckCircle2, label: t.practApplyApproved, tone: "text-emerald-400" },
    rejected: { icon: XCircle, label: t.practApplyRejected, tone: "text-rose-300" },
  }[state] ?? { icon: Clock, label: t.practApplyPending, tone: "text-gold" };
  const Icon = shown.icon;

  return (
    <div className="mt-8 rounded-[12px] border border-white/[0.09] bg-card p-6">
      <p className={`flex items-center gap-2.5 text-[14.5px] font-medium ${shown.tone}`}>
        <Icon className="size-5 shrink-0" />
        {shown.label}
      </p>
      {note && <p className="mt-3 text-[13px] leading-[1.75] text-muted">{note}</p>}
    </div>
  );
}
