import { ApiError } from "@/lib/api/errors";
import type { BirthDetailsForm } from "@/features/kundali/schema/birth-details";
import type { BirthDetailsIn, Chart, Place } from "@/features/kundali/types";

/**
 * सूर्य सिद्धान्त, the system a Nepali kundali is cast from. Stated rather
 * than left to the server's default so the choice is visible here: it decides
 * the panchang, the dashas and the avakhada, and switching it silently would
 * change every chart the app has ever shown.
 *
 * `drik` is the modern ephemeris — better astronomy, and what AstroSage and
 * AstroTalk publish, so it is the one to send when comparing against those.
 */
const SIDDHANTA = "surya" as const;

export function toRequestBody(form: BirthDetailsForm, place: Place): BirthDetailsIn {
  return {
    siddhanta: SIDDHANTA,
    name: form.name.trim(),
    date: form.date,
    time: form.time,
    tz_name: place.tz_name,
    latitude: place.latitude,
    longitude: place.longitude,
    place_label: place.label,
    time_accuracy: form.timeAccuracy,
  };
}

export async function createKundali(body: BirthDetailsIn): Promise<Chart> {
  const res = await fetch("/api/v1/kundali", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    // The envelope is {error: {code, message, details}}, so `errorData.error` is
    // an object — throwing it directly rendered as "[object Object]". ApiError
    // parses it and exposes `code` for callers to switch on.
    throw new ApiError(res.status, await res.json().catch(() => undefined));
  }

  return await res.json();
}
