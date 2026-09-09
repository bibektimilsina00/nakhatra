"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { CustomPlaceInput } from "@/components/ui/custom-place-input";
import { ModernDatePicker } from "@/components/ui/modern-date-picker";
import { ModernTimePicker } from "@/components/ui/modern-time-picker";
import {
  birthDetailsSchema,
  type BirthDetailsForm as FormValues,
} from "@/features/kundali/schema/birth-details";
import type { Place } from "@/features/kundali/types";
import { useTranslation } from "@/lib/i18n/language-context";
import { convertBsToAd } from "@/lib/utils/date-converter";

type Props = {
  /**
   * `gender` is not part of the chart — `BirthDetailsIn` has no field for it
   * and no position depends on it — but the vault stores it, so it rides along
   * as a third argument rather than being dropped on the floor. Callers that
   * do not save can ignore it.
   */
  onSubmit: (values: FormValues, place: Place) => void;
  /**
   * The form draws its own card by default, which is right on a page and wrong
   * inside a dialog that already is one — two nested borders around the same
   * four fields.
   */
  chrome?: boolean;
  pending: boolean;
  /** Field errors returned by the API's 422, merged with local zod errors. */
  serverFieldErrors?: Record<string, string>;
};

/** API field name -> form field name, so a 422 lands on the right input. */
const FIELD_MAP: Record<string, string> = {
  tz_name: "place",
  place_label: "place",
  latitude: "place",
  longitude: "place",
  date: "date",
  time: "time",
  name: "name",
};

/**
 * The original birth-details UI — era-switching calendar, clock picker,
 * place autocomplete and the gender toggle — on the current architecture:
 * zod at the boundary, a mutation for the call, and 422 field errors
 * landing on the input that caused them.
 */
export function BirthDetailsForm({ onSubmit, pending, serverFieldErrors, chrome = true }: Props) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  // The dashboard's quick-start asks for the name and sends it here, so the
  // form opens part-filled instead of asking for it twice. Used as the initial
  // value only — editing the field must not be undone by the URL.
  const [name, setName] = useState(() => searchParams.get("name")?.slice(0, 100) ?? "");
  const [era, setEra] = useState<"AD" | "BS">("AD");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [ampm, setAmPm] = useState<"AM" | "PM">("AM");
  const [approximateTime, setApproximateTime] = useState(false);
  const [place, setPlace] = useState<Place | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mappedServerErrors = Object.entries(serverFieldErrors ?? {}).reduce<
    Record<string, string>
  >((acc, [field, message]) => {
    acc[FIELD_MAP[field] ?? field] = message;
    return acc;
  }, {});
  const shown = { ...mappedServerErrors, ...errors };

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    // The pickers hand back parts; the schema wants an ISO date and 24h time.
    const missing: Record<string, string> = {};
    if (!day || !month || !year) missing.date = "Pick your day, month and year of birth";
    if (!hour || !minute) missing.time = "Pick your birth hour and minute";
    if (!place) missing.place = "Search and pick your birthplace";

    let date = "";
    if (day && month && year) {
      date =
        era === "BS"
          ? convertBsToAd(Number(year), Number(month), Number(day)).iso
          : `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    let time = "";
    if (hour && minute) {
      let h = Number(hour);
      if (ampm === "PM" && h < 12) h += 12;
      if (ampm === "AM" && h === 12) h = 0;
      time = `${String(h).padStart(2, "0")}:${minute.padStart(2, "0")}`;
    }

    const parsed = birthDetailsSchema.safeParse({
      name,
      date,
      time,
      timeAccuracy: approximateTime ? "approximate" : "exact",
    });

    const next = { ...missing };
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0]);
        // A missing-parts message is more useful than "Pick a date".
        next[field] ??= issue.message;
      }
    }
    setErrors(next);
    if (parsed.success && place && !Object.keys(missing).length) onSubmit(parsed.data, place);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={
        chrome
          ? "mx-auto w-full max-w-lg rounded-[8px] border border-brd bg-panel p-6 sm:p-7"
          : "w-full"
      }
    >
      <div className="mb-5">
        <h2 className="font-serif text-xl font-bold text-fg">{t.birthDetails}</h2>
        <p className="mt-1 text-xs leading-relaxed text-mut">
          {t.birthTimeNote}
        </p>
      </div>

      <div className="space-y-4">
        <Field label={t.fullName} required error={shown.name}>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors({ ...errors, name: "" });
            }}
            placeholder={t.fullName}
            className={`w-full rounded-[8px] border bg-inset px-3.5 py-2.5 text-xs text-fg placeholder-mut/40 transition focus:outline-none ${
              shown.name ? "border-rose-500" : "border-brd focus:border-acc"
            }`}
          />
        </Field>

        <Field label={t.birthDate} required error={shown.date}>
          <ModernDatePicker
            era={era}
            onEraChange={setEra}
            day={day}
            month={month}
            year={year}
            onDateChange={(d, m, y) => {
              setDay(d);
              setMonth(m);
              setYear(y);
              if (errors.date) setErrors({ ...errors, date: "" });
            }}
            error={shown.date}
          />
        </Field>

        <Field label={t.birthTime} required error={shown.time}>
          <ModernTimePicker
            hour={hour}
            minute={minute}
            ampm={ampm}
            approximateTime={approximateTime}
            onTimeChange={(h, m, ap) => {
              setHour(h);
              setMinute(m);
              setAmPm(ap);
              if (errors.time) setErrors({ ...errors, time: "" });
            }}
            onApproximateChange={setApproximateTime}
            error={shown.time}
          />
        </Field>

        <Field label={t.birthPlace} required error={shown.place}>
          <CustomPlaceInput
            value={place?.label ?? ""}
            placeholder="Search city, e.g. Kathmandu or San Francisco"
            onChange={(p) => {
              setPlace(p);
              if (errors.place) setErrors({ ...errors, place: "" });
            }}
          />
        </Field>

        <button
          type="submit"
          disabled={pending}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-[8px] bg-acc py-3.5 text-sm font-bold text-onacc shadow-md transition hover:bg-acc2 disabled:opacity-50"
        >
          <span>{pending ? t.calculating : t.calculateKundali}</span>
          {!pending && <span className="text-base">→</span>}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-mid">
        {label} {required && <span className="text-acc">*</span>}
      </span>
      {children}
      {error && <p className="mt-1 text-xs font-medium text-rose-400">{error}</p>}
    </div>
  );
}
