"use client";

import { useRef, useState } from "react";
import { Camera, CheckCircle2, Clock, XCircle } from "lucide-react";

import { AppShell } from "@/features/dashboard/components/app-shell";
import {
  useApply,
  useMyApplication,
  useUploadPhoto,
} from "@/features/practitioners/hooks/use-practitioners";
import type { ApplicationIn } from "@/features/practitioners/types";
import { useLatinTracking, useTranslation } from "@/lib/i18n/language-context";

const PRACTICES = ["astrologer", "pandit"] as const;
const LANGUAGES = ["ne", "hi", "en"];
const TRADITIONS = ["parashari", "kp", "nadi", "jaimini"];

/**
 * Setting up a practitioner profile.
 *
 * This was an application: where you trained, and a written sample reading. Both
 * are reasonable things to ask a stranger and terrible things to put between
 * someone and joining — the page asked for two essays before it asked for a
 * photograph. What a reader actually chooses on is the name, the face, the
 * languages and what you practise, so that is what this asks for, and the rest
 * can be filled in later from the desk.
 *
 * Practice is multi-select because one person is very often both.
 *
 * Shows the existing application rather than the form when there is one: the
 * endpoint refuses a second while one is open, and a form that submits into a
 * 400 is a worse way to learn that than a status card.
 */
export function ApplyPage() {
  const { t } = useTranslation();
  const eyebrow = useLatinTracking("uppercase tracking-[0.2em]");
  const existing = useMyApplication(true);
  const apply = useApply();
  const upload = useUploadPhoto();
  const filePicker = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ApplicationIn>({
    practice_types: ["astrologer"],
    practice_type: "astrologer",
    full_name: "",
    phone: "",
    city: "",
    country: "NP",
    years_experience: 0,
    headline: "",
    photo_url: null,
    languages: [],
    traditions: [],
    credentials: "",
    sample_reading: "",
  });

  const toggle = (key: "languages" | "traditions" | "practice_types", value: string) =>
    setForm((current) => {
      const list = (current[key] ?? []) as string[];
      const next = list.includes(value)
        ? list.filter((v) => v !== value)
        : [...list, value];
      // Practice cannot be emptied — somebody has to be something.
      if (key === "practice_types" && next.length === 0) return current;
      return key === "practice_types"
        ? { ...current, practice_types: next as ApplicationIn["practice_types"],
            practice_type: next[0] as ApplicationIn["practice_type"] }
        : { ...current, [key]: next };
    });

  const application = existing.data;
  const field =
    "w-full rounded-[8px] border border-white/[0.09] bg-card px-3 py-2.5 text-[13.5px] text-paper placeholder-faint focus:border-gold/45 focus:outline-none";
  const chip = (active: boolean) =>
    `rounded-[8px] border px-3 py-1.5 text-[12px] capitalize transition-colors ${
      active
        ? "border-gold/50 bg-gold/[0.09] text-gold2"
        : "border-white/[0.10] text-muted hover:border-white/25 hover:text-paper"
    }`;

  if (application) {
    return (
      <AppShell>
        <main className="mx-auto w-full max-w-[640px] px-5 pb-24 pt-12 sm:px-8">
          <span className={`text-[11px] text-gold ${eyebrow}`}>{t.practRegister}</span>
          <h1 className="mt-3 text-[26px] font-bold leading-tight text-paper sm:text-[30px]">
            {t.practApplyTitle}
          </h1>
          <StatusCard state={application.state} note={application.decision_note} />
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-[640px] px-5 pb-24 pt-10 sm:px-8">
        <span className={`text-[11px] text-gold ${eyebrow}`}>{t.practRegister}</span>
        <h1 className="mt-3 text-[26px] font-bold leading-tight text-paper sm:text-[30px]">
          {t.practApplyTitle}
        </h1>
        <p className="mt-3 max-w-lg text-[14px] leading-[1.75] text-muted">{t.practApplyLead}</p>

        <form
          className="mt-8 space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            apply.mutate(form);
          }}
        >
          {/* Photograph first: it is the thing a seeker looks at, and putting
              it after two text areas said the opposite. */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => filePicker.current?.click()}
              className="group relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-full border border-dashed border-white/[0.16] bg-card transition-colors hover:border-gold/45"
            >
              {form.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- a data
                // URL from our own upload; next/image adds a loader for nothing
                <img src={form.photo_url} alt="" className="size-full object-cover" />
              ) : (
                <Camera className="size-6 text-faint transition-colors group-hover:text-gold" />
              )}
            </button>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-paper">{t.practPhoto}</p>
              <p className="mt-0.5 text-[11.5px] leading-[1.6] text-faint">{t.practPhotoNote}</p>
              {upload.isError && (
                <p role="alert" className="mt-1 text-[11.5px] text-rose-300">
                  {upload.error.message}
                </p>
              )}
            </div>
            <input
              ref={filePicker}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                upload.mutate(file, {
                  onSuccess: ({ photo_url }) => setForm((c) => ({ ...c, photo_url })),
                });
              }}
            />
          </div>

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
              <span className="mb-1.5 block text-[12px] text-muted">{t.practCity}</span>
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className={field}
              />
            </label>
          </div>

          <fieldset>
            <legend className="mb-2 text-[12px] text-muted">{t.practPractice}</legend>
            <div className="flex flex-wrap gap-2">
              {PRACTICES.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggle("practice_types", value)}
                  aria-pressed={(form.practice_types ?? []).includes(value)}
                  className={chip((form.practice_types ?? []).includes(value))}
                >
                  {value}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11.5px] text-faint">{t.practBothNote}</p>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[12px] text-muted">{t.practYears}</span>
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
            <label className="block">
              <span className="mb-1.5 block text-[12px] text-muted">{t.practPhone}</span>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={field}
              />
            </label>
          </div>

          <fieldset>
            <legend className="mb-2 text-[12px] text-muted">{t.selectLanguage}</legend>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggle("languages", value)}
                  aria-pressed={(form.languages ?? []).includes(value)}
                  className={`${chip((form.languages ?? []).includes(value))} uppercase`}
                >
                  {value}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-[12px] text-muted">{t.practTraditions}</legend>
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
            <span className="mb-1.5 block text-[12px] text-muted">{t.practHeadline}</span>
            <input
              value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
              placeholder={t.practHeadlinePlaceholder}
              maxLength={160}
              className={field}
            />
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
