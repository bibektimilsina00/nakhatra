"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, UserRoundSearch } from "lucide-react";

import { useDirectory } from "@/features/practitioners/hooks/use-practitioners";
import { PractitionerCardView } from "@/features/practitioners/components/practitioner-card";
import type { DirectoryQuery } from "@/features/practitioners/types";
import { useTranslation } from "@/lib/i18n/language-context";

/**
 * The real directory, replacing the sample profiles.
 *
 * Every filter is a server query rather than a client-side `Array.filter`, so
 * the list stays correct once there are more practitioners than one page. The
 * previous version filtered five hardcoded objects in memory, which works
 * exactly until the sixth.
 */

const SPECIALITIES = ["career", "marriage", "remedies", "muhurta"] as const;
const LANGUAGES = ["ne", "hi", "en"] as const;

export function PractitionerDirectory({ onOpen }: { onOpen?: (id: string) => void }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [query, setQuery] = useState<DirectoryQuery>({ limit: 24, offset: 0 });
  const { data, isPending, isError } = useDirectory(query);

  // Opening a card reads the profile. It used to start — and bill — a
  // consultation on the first click, which is not what tapping somebody's name
  // means anywhere else.
  const open = (profileId: string) => {
    if (onOpen) return onOpen(profileId);
    router.push(`/practitioners/${profileId}`);
  };

  // Pressing an active filter clears it, which is what a pressed toggle means.
  const toggle = (key: keyof DirectoryQuery, value: string) =>
    setQuery((current) => ({
      ...current,
      offset: 0,
      [key]: current[key] === value ? undefined : value,
    }));

  const chip = (active: boolean) =>
    `rounded-[6px] border px-2.5 py-1 text-[11px] capitalize transition-colors ${
      active
        ? "border-gold/50 bg-gold/[0.09] text-gold2"
        : "border-white/[0.10] text-muted hover:border-white/25 hover:text-paper"
    }`;

  return (
    <div>
      <label className="relative flex max-w-md items-center">
        <Search className="pointer-events-none absolute left-3 size-4 text-faint" />
        <span className="sr-only">{t.dashSearch}</span>
        <input
          value={query.q ?? ""}
          onChange={(event) =>
            setQuery((current) => ({ ...current, q: event.target.value, offset: 0 }))
          }
          placeholder={t.practSearch}
          className="w-full rounded-[8px] border border-white/[0.09] bg-card py-2 pl-9 pr-3 text-[13.5px] text-paper placeholder-faint focus:border-gold/45 focus:outline-none"
        />
      </label>

      <div className="mt-3 flex flex-wrap gap-2">
        {SPECIALITIES.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => toggle("speciality", value)}
            aria-pressed={query.speciality === value}
            className={chip(query.speciality === value)}
          >
            {value}
          </button>
        ))}
        <span className="mx-1 w-px bg-white/[0.09]" aria-hidden />
        {LANGUAGES.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => toggle("language", value)}
            aria-pressed={query.language === value}
            className={`${chip(query.language === value)} uppercase`}
          >
            {value}
          </button>
        ))}
      </div>

      {isPending ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((card) => (
            <div
              key={card}
              className="h-[150px] animate-pulse rounded-[12px] border border-white/[0.07] bg-card"
            />
          ))}
        </div>
      ) : isError ? (
        <p className="mt-6 text-[13px] text-faint">{t.practUnavailable}</p>
      ) : data && data.items.length > 0 ? (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((practitioner) => (
              <PractitionerCardView
                key={practitioner.id}
                practitioner={practitioner}
                onOpen={open}
              />
            ))}
          </div>
          {data.total > data.items.length && (
            <p className="mt-4 text-center text-[12px] text-faint">
              {data.items.length} / {data.total}
            </p>
          )}
        </>
      ) : (
        // An empty directory is the expected state before the first
        // practitioner is verified, so it says that rather than "no results".
        <div className="mt-5 rounded-[12px] border border-dashed border-white/[0.14] px-6 py-12 text-center">
          <span className="mx-auto grid size-11 place-items-center rounded-full border border-white/[0.10] text-gold">
            <UserRoundSearch className="size-5" />
          </span>
          <p className="mt-3 text-[13.5px] text-muted">{t.practNoneYet}</p>
          <p className="mx-auto mt-1 max-w-sm text-[12px] leading-[1.7] text-faint">
            {t.practNoneYetNote}
          </p>
        </div>
      )}
    </div>
  );
}
