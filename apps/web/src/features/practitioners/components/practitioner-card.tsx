"use client";

import { BadgeCheck, MapPin } from "lucide-react";

import { cardClasses } from "@/components/ui/card";
import type { PractitionerCard as Card } from "@/features/practitioners/types";
import { useTranslation } from "@/lib/i18n/language-context";

/**
 * One practitioner in the directory.
 *
 * Deliberately no rating and no consultation count. The preview data this
 * replaces carried `4.9 · 1,204 readings`, and the endpoint does not return
 * either — because until reviews exist, a number there is a fabricated
 * credential attached to a real person's name.
 *
 * Sized to design.md §5 List rows: 64×64 thumbnail at radius `md`, name at
 * `lg`/600, discipline at `sm`/`muted`, metadata at `xs`/`dim`. No rating pill
 * or price row — this card carries neither field.
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
      className={cardClasses({
        className: "flex w-full flex-col text-left transition-colors hover:border-accent",
      })}
    >
      <div className="flex items-start gap-3">
        <span className="grid size-16 shrink-0 place-items-center rounded-md bg-accent-tint text-lg font-semibold text-accent-ink">
          {initials}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-lg font-semibold text-ink">
              {practitioner.display_name}
            </span>
            {practitioner.verified && (
              <BadgeCheck className="size-4 shrink-0 text-accent-strong" aria-label={t.dashVerified} />
            )}
          </span>
          {practitioner.headline && (
            <span className="mt-0.5 block truncate text-sm text-muted">
              {practitioner.headline}
            </span>
          )}
          <span className="mt-1 flex items-center gap-1.5 text-xs text-dim">
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
              className="rounded-sm border border-line-strong px-2 py-0.5 text-xs capitalize text-muted"
            >
              {tag}
            </span>
          ))}
          {practitioner.languages.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-sm border border-line-strong bg-cream px-2 py-0.5 text-xs uppercase text-dim"
            >
              {tag}
            </span>
          ))}
        </span>
      )}
    </button>
  );
}
