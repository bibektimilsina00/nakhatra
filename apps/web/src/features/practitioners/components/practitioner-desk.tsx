"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Camera, CircleDot, MessagesSquare, TriangleAlert } from "lucide-react";

import { CustomPlaceInput } from "@/components/ui/custom-place-input";
import { assetUrl } from "@/lib/api/client";
import { AppShell } from "@/features/dashboard/components/app-shell";
import { useMyConsultations } from "@/features/consultations/hooks/use-consultations";
import { formatMinor } from "@/features/consultations/money";
import {
  useMyProfile,
  useMyRates,
  useSetRate,
  useUpdateProfile,
  useUploadPhoto,
} from "@/features/practitioners/hooks/use-practitioners";
import type { PractitionerDetail, ProfileIn } from "@/features/practitioners/types";
import { useLatinTracking, useTranslation } from "@/lib/i18n/language-context";

const MEDIA = ["chat", "voice", "video"] as const;
const PRACTICES = ["astrologer", "pandit"] as const;
const LANGUAGES = ["ne", "hi", "en"];
const TRADITIONS = ["parashari", "kp", "nadi", "jaimini"];
const SPECIALITIES = ["career", "marriage", "remedies", "muhurta", "health", "finance"];

/**
 * Where an approved practitioner runs their practice.
 *
 * Profile, prices and requests in one place, because they are one job. Split
 * across three pages the common failure is an astrologer who is listed, priced
 * at nothing, and quietly unconsultable — so the two conditions for being
 * findable are stated at the top rather than left to be inferred from an empty
 * inbox.
 */
export function PractitionerDesk() {
  const { t } = useTranslation();
  const eyebrow = useLatinTracking("uppercase tracking-[0.2em]");
  const profile = useMyProfile(true);
  const rates = useMyRates(true);
  const consultations = useMyConsultations();
  const setRate = useSetRate();

  if (profile.isError) {
    return (
      <AppShell>
        <main className="mx-auto w-full max-w-[720px] px-5 pt-12 sm:px-8">
          <p className="text-[14px] text-muted">
            This account is not a practitioner yet.{" "}
            <Link href="/practitioners/apply" className="text-gold hover:underline">
              {t.practBecome}
            </Link>
          </p>
        </main>
      </AppShell>
    );
  }

  const me = profile.data;
  const priced = (rates.data ?? []).some((r) => r.is_active && r.per_minute_minor > 0);
  const waiting = (consultations.data ?? []).filter(
    (c) => c.state === "requested" || c.state === "accepted" || c.state === "active",
  );

  return (
    <AppShell>
      {/* Two columns above `lg`, for the same reason the application form has
          them: at 720px the desk was a narrow strip down the middle of a wide
          screen, and the things a practitioner checks — am I listed, am I
          priced, who is waiting — were below the fold under the edit form. */}
      <main className="mx-auto w-full max-w-[1120px] px-5 pb-28 pt-10 sm:px-8">
        <header>
          <span className={`text-[11px] text-gold ${eyebrow}`}>{t.practDesk}</span>
          <h1 className="mt-3 text-[26px] font-bold leading-tight text-paper sm:text-[30px]">
            {me?.display_name ?? "—"}
          </h1>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start lg:gap-8">
          <aside className="space-y-4 lg:sticky lg:top-[76px]">
            <section className="rounded-[14px] border border-white/[0.09] bg-card p-5">
              <h2 className="text-[11px] uppercase tracking-[0.14em] text-faint">
                {t.practStatus}
              </h2>
              {/* The two conditions for being consultable, said out loud. */}
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge on={Boolean(me?.verified)} label={t.practVerified} off={t.practUnverified} />
                <Badge on={priced} label={t.practPriced} off={t.practNoRates} />
              </div>
              {!priced && (
                <p className="mt-3 flex items-start gap-2 rounded-[8px] border border-gold/30 bg-[#1A150B] px-3 py-2.5 text-[12px] leading-[1.6] text-gold2">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                  {t.practNoRates}
                </p>
              )}
            </section>

            <section className="rounded-[14px] border border-white/[0.09] bg-card p-5">
              <h2 className="text-[11px] uppercase tracking-[0.14em] text-faint">
                {t.practRequests}
              </h2>
              {waiting.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {waiting.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/consultations/${c.id}`}
                        className="flex items-center justify-between gap-3 rounded-[10px] border border-white/[0.09] bg-ink p-3 transition-colors hover:border-gold/35"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] text-paper">
                            {c.counterpart_name || t.talkToAstrologer}
                          </span>
                          <span className="block text-[11px] capitalize text-faint">
                            {c.medium} · {c.state}
                          </span>
                        </span>
                        <span className="shrink-0 text-[11.5px] tabular-nums text-muted">
                          {formatMinor(c.rate_per_minute_minor, c.currency)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-3 rounded-[10px] border border-dashed border-white/[0.14] px-4 py-8 text-center">
                  <MessagesSquare className="mx-auto size-5 text-faint" />
                  <p className="mt-2 text-[12px] text-faint">{t.consultNone}</p>
                </div>
              )}
            </section>
          </aside>

          <div className="space-y-6">
            {me && <ProfileEditor profile={me} />}

            <section className="rounded-[14px] border border-white/[0.09] bg-card p-5 sm:p-6">
              <h2 className="text-[11px] uppercase tracking-[0.14em] text-faint">{t.practRates}</h2>
              <p className="mt-2 text-[12.5px] leading-[1.7] text-faint">{t.practRatesNote}</p>
              <div className="mt-4 space-y-2">
                {MEDIA.map((medium) => (
                  <RateRow
                    key={medium}
                    medium={medium}
                    // Voice and video connect now. What they still need for the
                    // last mile is a TURN relay: without one they fail on
                    // symmetric NAT and many mobile carriers, and the call panel
                    // says so before anyone dials.
                    comingSoon={false}
                    current={(rates.data ?? []).find((r) => r.medium === medium)}
                    onSave={(perMinute) =>
                      setRate.mutate({
                        medium,
                        per_minute_minor: perMinute,
                        is_active: perMinute > 0,
                      })
                    }
                    saving={setRate.isPending}
                    saveLabel={t.practSetRate}
                  />
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </AppShell>
  );
}

/** Everything a seeker sees, editable in one form. */
function ProfileEditor({ profile }: { profile: PractitionerDetail }) {
  const { t } = useTranslation();
  const update = useUpdateProfile();
  const upload = useUploadPhoto();
  const filePicker = useRef<HTMLInputElement>(null);

  // Seeded once from the server and thereafter owned by the form. Re-seeding
  // on every refetch would overwrite whatever was being typed.
  const [form, setForm] = useState<ProfileIn>({
    practice_types: profile.practice_types,
    display_name: profile.display_name,
    headline: profile.headline,
    bio: profile.bio,
    photo_url: profile.photo_url,
    intro_video_url: profile.intro_video_url,
    city: profile.city,
    country: profile.country,
    years_experience: profile.years_experience,
    languages: profile.languages,
    traditions: profile.traditions,
    specialities: profile.specialities,
    is_listed: true,
  });

  const toggle = (key: "languages" | "traditions" | "specialities" | "practice_types", value: string) =>
    setForm((current) => {
      const list = (current[key] ?? []) as string[];
      const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
      // Somebody has to be something.
      if (key === "practice_types" && next.length === 0) return current;
      return { ...current, [key]: next };
    });

  const labelText = "mb-1.5 block text-[12px] text-muted";
  const field =
    "w-full rounded-[8px] border border-white/[0.09] bg-ink px-3 py-2.5 text-[13.5px] text-paper placeholder-faint focus:border-gold/45 focus:outline-none";
  const chip = (active: boolean) =>
    `rounded-[8px] border px-3 py-1.5 text-[12px] capitalize transition-colors ${
      active
        ? "border-gold/50 bg-gold/[0.09] text-gold2"
        : "border-white/[0.10] text-muted hover:border-white/25 hover:text-paper"
    }`;

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        update.mutate(form);
      }}
    >
      <Card title={t.practYourProfile}>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => filePicker.current?.click()}
            className="group relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-full border border-dashed border-white/[0.16] bg-ink transition-colors hover:border-gold/45"
          >
            {form.photo_url ? (
              // Served by our own endpoint; next/image adds a loader for nothing.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={assetUrl(form.photo_url)} alt="" className="size-full object-cover" />
            ) : (
              <Camera className="size-7 text-faint transition-colors group-hover:text-gold" />
            )}
            {upload.isPending && (
              <span className="absolute inset-0 grid place-items-center bg-black/50 text-[11px] text-paper">
                …
              </span>
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

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelText}>{t.fullName}</span>
            <input
              required
              autoComplete="name"
              maxLength={255}
              value={form.display_name}
              onChange={(e) => setForm({ ...form, display_name: e.target.value })}
              className={field}
            />
          </label>

          <label className="block">
            <span className={labelText}>{t.practYears}</span>
            <span className="relative block">
              <input
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
                className={`${field} pr-16`}
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[12px] text-faint">
                {t.practYearsSuffix}
              </span>
            </span>
          </label>
        </div>

        <div className="mt-4 min-w-0">
          <span className={labelText}>{t.practCity}</span>
          {/* The chart form's city search, so the country comes from the place
              rather than from whatever two letters were already in the row. */}
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
            <p className="mt-1.5 text-[11.5px] text-faint">
              {t.practCountry}: {form.country}
            </p>
          )}
        </div>

        <label className="mt-4 block">
          <span className={labelText}>{t.practHeadline}</span>
          <input
            value={form.headline}
            onChange={(e) => setForm({ ...form, headline: e.target.value })}
            placeholder={t.practHeadlinePlaceholder}
            maxLength={255}
            className={field}
          />
          <span className="mt-1 block text-right text-[11px] tabular-nums text-faint">
            {(form.headline ?? "").length}/255
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
        </fieldset>

        <div className="mt-5 space-y-5">
          <Facets
            legend={t.practTraditions}
            options={TRADITIONS}
            selected={form.traditions ?? []}
            onToggle={(v) => toggle("traditions", v)}
            chip={chip}
            labelClass={labelText}
          />
          <Facets
            legend={t.practSpecialities}
            options={SPECIALITIES}
            selected={form.specialities ?? []}
            onToggle={(v) => toggle("specialities", v)}
            chip={chip}
            labelClass={labelText}
          />
          <Facets
            legend={t.selectLanguage}
            options={LANGUAGES}
            selected={form.languages ?? []}
            onToggle={(v) => toggle("languages", v)}
            chip={chip}
            labelClass={labelText}
            upper
          />
        </div>
      </Card>

      <Card title={t.practBio}>
        <label className="block">
          <textarea
            rows={7}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder={t.practBioPlaceholder}
            maxLength={8000}
            className={`${field} resize-y leading-[1.8]`}
          />
          <span className="mt-1 block text-right text-[11px] tabular-nums text-faint">
            {(form.bio ?? "").length}/8000
          </span>
        </label>

        <label className="mt-4 block">
          <span className={labelText}>{t.practIntroVideo}</span>
          <input
            // A URL field, so the keyboard offers a URL and the browser rejects
            // "my youtube channel" before the server has to.
            type="url"
            inputMode="url"
            maxLength={512}
            value={form.intro_video_url ?? ""}
            onChange={(e) => setForm({ ...form, intro_video_url: e.target.value || null })}
            placeholder="https://"
            className={field}
          />
          <span className="mt-1 block text-[11.5px] text-faint">{t.practIntroVideoNote}</span>
        </label>
      </Card>

      {update.isError && (
        <p role="alert" className="text-[13px] text-rose-300">
          {update.error.message}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3">
        {update.isSuccess && (
          <span className="mr-auto text-[12.5px] text-emerald-300">{t.practSaved}</span>
        )}
        {/* Unlisting is its own action rather than a checkbox next to Save:
            taking yourself out of the directory should not be something that
            happens because a toggle was left in the wrong position. */}
        <button
          type="button"
          disabled={update.isPending}
          onClick={() => update.mutate({ ...form, is_listed: false })}
          className="rounded-[9px] border border-white/12 px-4 py-2.5 text-[12.5px] text-muted transition-colors hover:border-white/25 hover:text-paper disabled:opacity-40"
        >
          {t.practUnlist}
        </button>
        <button
          type="submit"
          disabled={update.isPending || !form.display_name.trim()}
          className="rounded-[9px] bg-gold px-6 py-2.5 text-[13.5px] font-bold text-ink transition-colors hover:bg-gold2 disabled:pointer-events-none disabled:opacity-40"
        >
          {t.practSaveProfile}
        </button>
      </div>
    </form>
  );
}

/** One group of related questions, matching the application form's sections. */
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[14px] border border-white/[0.09] bg-card p-5 sm:p-6">
      <h2 className="text-[11px] uppercase tracking-[0.14em] text-faint">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Facets({
  legend,
  options,
  selected,
  onToggle,
  chip,
  labelClass,
  upper = false,
}: {
  legend: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  chip: (active: boolean) => string;
  labelClass: string;
  upper?: boolean;
}) {
  return (
    <fieldset>
      <legend className={labelClass}>{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onToggle(value)}
            aria-pressed={selected.includes(value)}
            className={`${chip(selected.includes(value))} ${upper ? "uppercase" : ""}`}
          >
            {value}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Badge({ on, label, off }: { on: boolean; label: string; off: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] ${
        on
          ? "border-emerald-400/30 bg-[#0D1A16] text-emerald-300/90"
          : "border-white/[0.10] text-faint"
      }`}
    >
      <CircleDot className="size-3" />
      {on ? label : off}
    </span>
  );
}

function RateRow({
  medium,
  current,
  onSave,
  saving,
  saveLabel,
  comingSoon,
}: {
  medium: string;
  current: { per_minute_minor: number; is_active: boolean } | undefined;
  onSave: (perMinuteMinor: number) => void;
  saving: boolean;
  saveLabel: string;
  comingSoon: boolean;
}) {
  const { t } = useTranslation();
  // Rupees in the field, paisa on the wire. Nobody types 2500 meaning NPR 25.
  //
  // Keyed on the saved value, so a refetch landing mid-typing does not
  // overwrite what is being typed, and no effect writes state during a render.
  const saved = current ? String(current.per_minute_minor / 100) : "";
  const [edit, setEdit] = useState<{ key: string; value: string } | null>(null);
  const rupees = edit?.key === saved ? edit.value : saved;

  return (
    <div
      className={`flex flex-wrap items-center gap-3 rounded-[10px] border border-white/[0.09] bg-card p-3 ${
        comingSoon ? "opacity-55" : ""
      }`}
    >
      <span className="w-16 shrink-0 text-[13px] capitalize text-paper">{medium}</span>
      {comingSoon ? (
        // Priced but undeliverable is worse than absent: a seeker would book a
        // call that cannot happen. Voice and video wait for the media stack.
        <span className="text-[11.5px] text-faint">{t.practComingSoon}</span>
      ) : (
        <>
          <span className="text-[12px] text-faint">NPR</span>
          <input
            inputMode="decimal"
            value={rupees}
            onChange={(event) => setEdit({ key: saved, value: event.target.value })}
            placeholder="0"
            className="w-24 rounded-[8px] border border-white/[0.09] bg-ink px-2.5 py-1.5 text-[13px] tabular-nums text-paper placeholder-faint focus:border-gold/45 focus:outline-none"
          />
          <span className="text-[12px] text-faint">/ min</span>
          <button
            type="button"
            disabled={saving}
            onClick={() => onSave(Math.max(0, Math.round(Number(rupees) * 100) || 0))}
            className="ml-auto rounded-[8px] border border-white/12 px-3 py-1.5 text-[12px] text-muted transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-40"
          >
            {saveLabel}
          </button>
        </>
      )}
    </div>
  );
}
