"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CircleDot, MessagesSquare, TriangleAlert } from "lucide-react";

import { AppShell } from "@/features/dashboard/components/app-shell";
import { useMyConsultations } from "@/features/consultations/hooks/use-consultations";
import { formatMinor } from "@/features/consultations/money";
import {
  useMyProfile,
  useMyRates,
  useSetRate,
  useUpdateProfile,
} from "@/features/practitioners/hooks/use-practitioners";
import { useLatinTracking, useTranslation } from "@/lib/i18n/language-context";

const MEDIA = ["chat", "voice", "video"] as const;

/**
 * Where an approved practitioner runs their practice.
 *
 * Three things in one place because they are one job: be listed, have a price,
 * and answer people. Split across three pages, the common failure would be an
 * astrologer who is listed, priced at nothing, and quietly unconsultable.
 */
export function PractitionerDesk() {
  const { t } = useTranslation();
  const eyebrow = useLatinTracking("uppercase tracking-[0.2em]");
  const profile = useMyProfile(true);
  const rates = useMyRates(true);
  const consultations = useMyConsultations();
  const setRate = useSetRate();
  const updateProfile = useUpdateProfile();

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
      <main className="mx-auto w-full max-w-[760px] px-5 pb-24 pt-10 sm:px-8">
        <span className={`text-[11px] text-gold ${eyebrow}`}>{t.practDesk}</span>
        <h1 className="mt-3 text-[26px] font-bold leading-tight text-paper sm:text-[30px]">
          {me?.display_name ?? "—"}
        </h1>

        {/* The two conditions for being consultable, stated as one line each
            rather than left for the practitioner to infer from an empty inbox. */}
        <div className="mt-5 flex flex-wrap gap-2">
          <Badge on={Boolean(me?.id)} label={t.practLive} off={t.practOffline} />
          <Badge on={priced} label={t.practRates} off={t.practNoRates} />
        </div>

        {!priced && (
          <p className="mt-4 flex items-start gap-2 rounded-[8px] border border-gold/30 bg-[#1A150B] px-3.5 py-2.5 text-[12.5px] leading-[1.6] text-gold2">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            {t.practNoRates}
          </p>
        )}

        <section className="mt-8">
          <h2 className="text-[15px] font-semibold text-paper">{t.practRates}</h2>
          <p className="mt-1 text-[12.5px] leading-[1.7] text-faint">{t.practRatesNote}</p>
          <div className="mt-4 space-y-2">
            {MEDIA.map((medium) => (
              <RateRow
                key={medium}
                medium={medium}
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

        <section className="mt-10">
          <h2 className="text-[15px] font-semibold text-paper">{t.practRequests}</h2>
          {waiting.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {waiting.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/consultations/${c.id}`}
                    className="flex items-center justify-between gap-3 rounded-[10px] border border-white/[0.09] bg-card p-3.5 transition-colors hover:border-gold/35"
                  >
                    <span className="text-[13.5px] text-paper">
                      {c.medium} · {c.state}
                    </span>
                    <span className="text-[12px] tabular-nums text-muted">
                      {formatMinor(c.rate_per_minute_minor, c.currency)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4 rounded-[10px] border border-dashed border-white/[0.14] px-5 py-10 text-center">
              <MessagesSquare className="mx-auto size-5 text-faint" />
              <p className="mt-2 text-[12.5px] text-faint">{t.consultNone}</p>
            </div>
          )}
        </section>

        {me && (
          <section className="mt-10">
            <button
              type="button"
              onClick={() =>
                updateProfile.mutate({
                  display_name: me.display_name,
                  headline: me.headline,
                  bio: me.bio,
                  photo_url: me.photo_url,
                  intro_video_url: me.intro_video_url,
                  city: me.city,
                  country: me.country,
                  years_experience: me.years_experience,
                  languages: me.languages,
                  traditions: me.traditions,
                  specialities: me.specialities,
                  is_listed: true,
                })
              }
              className="rounded-[8px] border border-white/12 px-4 py-2 text-[12.5px] text-muted transition-colors hover:border-white/25 hover:text-paper"
            >
              {t.practLive}
            </button>
          </section>
        )}
      </main>
    </AppShell>
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
}: {
  medium: string;
  current: { per_minute_minor: number; is_active: boolean } | undefined;
  onSave: (perMinuteMinor: number) => void;
  saving: boolean;
  saveLabel: string;
}) {
  // Rupees in the field, paisa on the wire. Nobody types 2500 meaning NPR 25.
  const [rupees, setRupees] = useState("");
  useEffect(() => {
    setRupees(current ? String(current.per_minute_minor / 100) : "");
  }, [current]);

  return (
    <div className="flex items-center gap-3 rounded-[10px] border border-white/[0.09] bg-card p-3">
      <span className="w-16 shrink-0 text-[13px] capitalize text-paper">{medium}</span>
      <span className="text-[12px] text-faint">NPR</span>
      <input
        inputMode="decimal"
        value={rupees}
        onChange={(event) => setRupees(event.target.value)}
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
    </div>
  );
}
