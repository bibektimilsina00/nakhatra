"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Camera, CheckCircle2, Clock, ShieldCheck, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cardClasses } from "@/components/ui/card";
import { CustomPlaceInput } from "@/components/ui/custom-place-input";
import { Input } from "@/components/ui/input";
import { assetUrl } from "@/lib/api/client";
import { AppShell } from "@/features/dashboard/components/app-shell";
import {
  MIN_DIGITS,
  PhoneField,
  splitPhone,
} from "@/features/practitioners/components/phone-field";
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

  // The number is held as its two halves and joined on submit: what the
  // server stores is always `+<code><digits>`.
  const [{ dial, digits }, setPhone] = useState(() => splitPhone(""));
  const setDial = (value: string) => setPhone((current) => ({ ...current, dial: value }));
  const setDigits = (value: string) => setPhone((current) => ({ ...current, digits: value }));
  const [phoneTouched, setPhoneTouched] = useState(false);

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
  const labelText = "mb-1.5 block text-xs text-muted";
  const chip = (active: boolean) =>
    `flex min-h-11 items-center rounded-md border px-3 text-xs capitalize transition-colors ${
      active
        ? "border-accent bg-accent-tint text-accent-ink"
        : "border-line-strong text-muted hover:border-accent hover:text-ink"
    }`;

  if (application) {
    return (
      <AppShell>
        <main className="mx-auto w-full max-w-[640px] px-5 pb-24 pt-12 sm:px-8">
          <span className={`text-2xs text-accent-strong ${eyebrow}`}>{t.practRegister}</span>
          <h1 className="mt-3 text-2xl font-bold leading-tight text-ink">
            {t.practApplyTitle}
          </h1>
          <SubmittedProfile application={application} />
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Wide, and in two columns above `lg`. As a single 640px column the
          whole form sat in the middle of the screen with nothing either side
          of it — the width was there, the page just refused to use it. */}
      <main className="mx-auto w-full max-w-[1120px] px-5 pb-28 pt-10 sm:px-8">
        <header className="max-w-2xl">
          <span className={`text-2xs text-accent-strong ${eyebrow}`}>{t.practRegister}</span>
          <h1 className="mt-3 text-2xl font-bold leading-tight text-ink">
            {t.practApplyTitle}
          </h1>
          <p className="mt-3 text-base leading-[1.75] text-muted">{t.practApplyLead}</p>
        </header>

        <form
          id="apply"
          className="mt-9 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start lg:gap-8"
          onSubmit={(event) => {
            event.preventDefault();
            if (digits.length > 0 && digits.length < MIN_DIGITS) {
              setPhoneTouched(true);
              return;
            }
            apply.mutate({ ...form, phone: digits ? `${dial}${digits}` : "" });
          }}
        >
          {/* The face and the promise, held beside the form rather than
              stacked on top of it — it is what a seeker looks at first, and
              what an applicant is most likely to skip. */}
          <aside className="space-y-4 lg:sticky lg:top-[76px]">
            <section className={`${cardClasses()} text-center`}>
              <button
                type="button"
                onClick={() => filePicker.current?.click()}
                className="group relative mx-auto grid size-28 place-items-center overflow-hidden rounded-full border border-dashed border-line-strong bg-cream transition-colors hover:border-accent"
              >
                {form.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={assetUrl(form.photo_url)} alt="" className="size-full object-cover" />
                ) : (
                  <Camera className="size-7 text-dim transition-colors group-hover:text-accent-strong" />
                )}
                {upload.isPending && (
                  <span className="absolute inset-0 grid place-items-center bg-ink/50 text-xs text-white">
                    …
                  </span>
                )}
              </button>
              <p className="mt-3 text-sm font-medium text-ink">{t.practPhoto}</p>
              <p className="mt-1 text-xs leading-[1.6] text-dim">{t.practPhotoNote}</p>
              {upload.isError && (
                <p role="alert" className="mt-1.5 text-xs text-danger">
                  {upload.error.message}
                </p>
              )}
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
            </section>

            <section className={cardClasses()}>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <ShieldCheck className="size-4 text-accent-strong" />
                {t.applyNext}
              </h2>
              <p className="mt-2 text-xs leading-[1.75] text-dim">{t.practPendingNote}</p>
            </section>
          </aside>

          <div className="space-y-6">
            <Card title={t.applyWho}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelText}>{t.fullName}</span>
                  <Input
                    required
                    autoComplete="name"
                    maxLength={255}
                    placeholder={t.practNamePlaceholder}
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  />
                </label>

                <label className="block">
                  <span className={labelText}>{t.practYears}</span>
                  <span className="relative block">
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={100}
                      step={1}
                      value={form.years_experience}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          years_experience: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                        })
                      }
                      className="pr-16"
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-dim">
                      {t.practYearsSuffix}
                    </span>
                  </span>
                </label>
              </div>

              <label className="mt-4 block">
                <span className={labelText}>{t.practHeadline}</span>
                <Input
                  value={form.headline}
                  onChange={(e) => setForm({ ...form, headline: e.target.value })}
                  placeholder={t.practHeadlinePlaceholder}
                  maxLength={160}
                />
                <span className="mt-1 block text-right text-2xs tabular-nums text-dim">
                  {(form.headline ?? "").length}/160
                </span>
              </label>
            </Card>

            <Card title={t.applyExpertise}>
              <fieldset>
                <legend className={labelText}>{t.practPractice}</legend>
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
                <p className="mt-1.5 text-xs text-dim">{t.practBothNote}</p>
              </fieldset>

              <fieldset className="mt-5">
                <legend className={labelText}>{t.practTraditions}</legend>
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

              <fieldset className="mt-5">
                <legend className={labelText}>{t.selectLanguage}</legend>
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
            </Card>

            <Card title={t.applyReach}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="min-w-0">
                  <span className={labelText}>{t.practCity}</span>
                  {/* The same city search the chart form uses, so the country
                      comes from the place rather than from a guess. */}
                  <CustomPlaceInput
                    value={form.city ?? ""}
                    placeholder={t.practCityPlaceholder}
                    onChange={(place) =>
                      setForm((current) => ({
                        ...current,
                        city: place.label.split(",")[0].trim(),
                        country: (place.country_code || current.country || "NP").toUpperCase(),
                      }))
                    }
                  />
                  {form.country && (
                    <p className="mt-1.5 text-xs text-dim">
                      {t.practCountry}: {form.country}
                    </p>
                  )}
                </div>

                <div className="min-w-0">
                  <label htmlFor="apply-phone" className={labelText}>
                    {t.practPhone}
                  </label>
                  <PhoneField
                    id="apply-phone"
                    dial={dial}
                    digits={digits}
                    invalid={phoneTouched && digits.length > 0 && digits.length < MIN_DIGITS}
                    onChange={({ dial: nextDial, digits: nextDigits }) => {
                      setDial(nextDial);
                      setDigits(nextDigits);
                    }}
                  />
                  <p
                    className={`mt-1.5 text-xs ${
                      phoneTouched && digits.length > 0 && digits.length < MIN_DIGITS
                        ? "text-danger"
                        : "text-dim"
                    }`}
                  >
                    {phoneTouched && digits.length > 0 && digits.length < MIN_DIGITS
                      ? t.practPhoneInvalid
                      : t.practPhoneNote}
                  </p>
                </div>
              </div>
            </Card>

            {apply.isError && (
              <p role="alert" className="text-sm text-danger">
                {apply.error.message}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-end gap-3">
              <Button
                type="submit"
                disabled={apply.isPending || !form.full_name.trim()}
              >
                {t.practApplySubmit}
              </Button>
            </div>
          </div>
        </form>
      </main>
    </AppShell>
  );
}

/** One group of related questions. Sections beat one long ungrouped scroll. */
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={cardClasses()}>
      <h2 className="text-2xs uppercase tracking-[0.14em] text-dim">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/**
 * What you submitted, while it is being read.
 *
 * The page used to be one sentence — "your application is with a reviewer" —
 * in an otherwise empty screen, which tells you nothing and leaves you unable
 * to check what you actually sent. Showing the profile back does both jobs:
 * it fills the page with the thing the page is about, and it lets someone
 * notice they misspelled their own name.
 */
function SubmittedProfile({
  application,
}: {
  application: {
    state: string;
    decision_note: string;
    full_name: string;
    headline: string;
    photo_url: string | null;
    city: string;
    country: string;
    years_experience: number;
    practice_types: string[];
    languages: string[];
    traditions: string[];
    created_at: string;
  };
}) {
  const { t } = useTranslation();

  const shown = {
    submitted: { icon: Clock, label: t.practApplyPending, tone: "text-accent-strong", ring: "border-line-strong" },
    in_review: { icon: Clock, label: t.practApplyPending, tone: "text-accent-strong", ring: "border-line-strong" },
    approved: {
      icon: CheckCircle2,
      label: t.practApplyApproved,
      tone: "text-success",
      ring: "border-line-strong",
    },
    rejected: {
      icon: XCircle,
      label: t.practApplyRejected,
      tone: "text-danger",
      ring: "border-line-strong",
    },
  }[application.state] ?? {
    icon: Clock,
    label: t.practApplyPending,
    tone: "text-accent-strong",
    ring: "border-line-strong",
  };
  const Icon = shown.icon;
  const pending = application.state === "submitted" || application.state === "in_review";

  const facets = [
    ...application.practice_types,
    ...application.traditions,
    ...application.languages,
  ];

  return (
    <>
      <div className={`mt-8 flex items-start gap-3 rounded-lg border bg-surface px-4 py-3.5 ${shown.ring}`}>
        <Icon className={`mt-0.5 size-5 shrink-0 ${shown.tone}`} />
        <div className="min-w-0">
          <p className={`text-base font-medium ${shown.tone}`}>{shown.label}</p>
          {application.decision_note ? (
            <p className="mt-1 text-sm leading-[1.7] text-muted">{application.decision_note}</p>
          ) : (
            pending && (
              <p className="mt-1 text-xs leading-[1.7] text-dim">{t.practPendingNote}</p>
            )
          )}
        </div>
      </div>

      {application.state === "approved" && (
        <Link
          href="/practitioners/me"
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-accent-strong px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent-ink"
        >
          {t.practDesk}
        </Link>
      )}

      <section className="mt-8">
        <h2 className="text-2xs uppercase tracking-[0.14em] text-dim">{t.practSubmitted}</h2>

        <div className={`mt-4 ${cardClasses()}`}>
          <div className="flex items-start gap-4">
            <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full border border-line-strong bg-cream">
              {application.photo_url ? (
                // Served by our own endpoint; next/image adds a loader for nothing.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={assetUrl(application.photo_url)} alt="" className="size-full object-cover" />
              ) : (
                <span className="text-lg font-bold text-accent-strong">
                  {application.full_name.charAt(0).toUpperCase()}
                </span>
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-ink">{application.full_name}</p>
              {application.headline && (
                <p className="mt-0.5 text-xs text-muted">{application.headline}</p>
              )}
              <p className="mt-1 text-xs text-dim">
                {[application.city || application.country,
                  application.years_experience > 0 &&
                    `${application.years_experience} ${t.dashYears}`]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          </div>

          {facets.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5 border-t border-line pt-4">
              {facets.map((tag) => (
                <span
                  key={tag}
                  className="rounded-sm border border-line-strong px-2 py-0.5 text-xs capitalize text-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
