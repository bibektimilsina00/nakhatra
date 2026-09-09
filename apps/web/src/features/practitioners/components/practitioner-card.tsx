"use client";

import { BadgeCheck, MapPin } from "lucide-react";

import type { PractitionerCard as Card } from "@/features/practitioners/types";
import { useTranslation } from "@/lib/i18n/language-context";

/**
 * One practitioner in the directory.
 *
 * Deliberately no rating and no consultation count. The preview data this
 * replaces carried `4.9 · 1,204 readings`, and the endpoint does not return
 * either — because until reviews exist, a number there is a fabricated
 * credential attached to a real person's name.
 */
export function PractitionerCardView({
  practitioner,
  onOpen,
}: {
  practitioner: Card;
  onOpen?: (id: string) => void;
}) {
  const { t } = useTranslation();
  const initials = practitioner.display_name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <button
      type="button"
      onClick={() => onOpen?.(practitioner.id)}
      className="flex w-full flex-col rounded-[12px] border border-white/[0.09] bg-panel p-5 text-left transition-colors hover:border-acc/35"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-[10px] bg-acc/[0.12] text-[14px] font-bold text-acc">
          {initials}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-[15px] font-semibold text-fg">
              {practitioner.display_name}
            </span>
            {practitioner.verified && (
              <BadgeCheck className="size-4 shrink-0 text-acc" aria-label={t.dashVerified} />
            )}
          </span>
          {practitioner.headline && (
            <span className="mt-0.5 block truncate text-[12px] text-mut">
              {practitioner.headline}
            </span>
          )}
          <span className="mt-1 flex items-center gap-1.5 text-[11.5px] text-dim">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">
              {practitioner.city || practitioner.country}
              {practitioner.years_experience > 0 &&
                ` · ${practitioner.years_experience} ${t.dashYears}`}
            </span>
          </span>
        </span>
      </div>

      {(practitioner.specialities.length > 0 || practitioner.languages.length > 0) && (
        <span className="mt-4 flex flex-wrap gap-1.5">
          {practitioner.specialities.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-[6px] border border-white/[0.10] px-2 py-0.5 text-[10.5px] capitalize text-mut"
            >
              {tag}
            </span>
          ))}
          {practitioner.languages.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-[6px] border border-brd bg-app px-2 py-0.5 text-[10.5px] uppercase text-dim"
            >
              {tag}
            </span>
          ))}
        </span>
      )}
    </button>
  );
}
