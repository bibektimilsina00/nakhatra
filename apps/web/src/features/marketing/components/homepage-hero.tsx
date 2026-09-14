"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ModernDatePicker } from "@/components/ui/modern-date-picker";
import { ModernTimePicker } from "@/components/ui/modern-time-picker";
import { CustomPlaceInput } from "@/components/ui/custom-place-input";
import { createKundali } from "@/features/kundali/api/kundali.api";
import { saveKundaliToStorage } from "@/features/kundali/store/kundali-store";
import type { BirthDetailsIn, Place } from "@/features/kundali/types";
import { convertBsToAd } from "@/lib/utils/date-converter";
import { GeneratingScreen } from "@/features/kundali/components/generating-screen";
import { HeroKundali } from "@/features/marketing/components/hero-kundali";
import { PillarsSection } from "@/features/marketing/components/pillars-section";
import {
  AccuracySection,
  AstrologersSection,
  ChartSection,
  ClosingSection,
  ContentsSection,
  ConversationSection,
  FaqSection,
  HowItWorksSection,
  MilanSection,
  ReadingSection,
} from "@/features/marketing/components/home-sections";
import { MainNavbar } from "@/components/layout/main-navbar";
import { MainFooter } from "@/components/layout/main-footer";
import { useTranslation } from "@/lib/i18n/language-context";
import { trackKundaliGenerated } from "@/lib/utils/analytics";
import { buttonClasses } from "@/components/ui/button";
import {
  Check,
  User,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export function HomepageHero() {
  const router = useRouter();
  const { language, t } = useTranslation();
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other">("male");
  const [era, setEra] = useState<"AD" | "BS">("AD");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [ampm, setAmPm] = useState<"AM" | "PM">("AM");
  const [approximateTime, setApproximateTime] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = "Full name is required";
    }
    if (!selectedPlace) {
      newErrors.place = "Please search and select your birthplace";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    let h = parseInt(hour, 10);
    if (ampm === "PM" && h < 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    const formattedTime = `${String(h).padStart(2, "0")}:${minute.padStart(2, "0")}`;

    let formattedDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    if (era === "BS") {
      const converted = convertBsToAd(parseInt(year, 10), parseInt(month, 10), parseInt(day, 10));
      formattedDate = converted.iso;
    }

    const birthDetails: BirthDetailsIn = {
      // सूर्य सिद्धान्त — the system a Nepali kundali is cast from.
      siddhanta: "surya",
      name: name.trim(),
      date: formattedDate,
      time: formattedTime,
      tz_name: selectedPlace!.tz_name,
      latitude: selectedPlace!.latitude,
      longitude: selectedPlace!.longitude,
      place_label: selectedPlace!.label,
      time_accuracy: approximateTime ? "approximate" : "exact",
    };

    try {
      const chart = await createKundali(birthDetails);
      saveKundaliToStorage(birthDetails, chart);
      trackKundaliGenerated({
        language,
        timeAccuracy: birthDetails.time_accuracy,
      });
    } catch (err) {
      console.error("Failed to generate Kundali", err);
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return <GeneratingScreen onComplete={() => router.push("/reading")} />;
  }

  return (
    <div className="min-h-dvh bg-cream text-muted">
      {/* 1. Header (Sticky Top Nav) */}
      <MainNavbar />

      {/* 2. Hero Section */}
      <main className="mx-auto max-w-7xl px-6 py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* LEFT: the pitch, standing on a real chart. */}
          <div className="relative lg:col-span-7">
            {/* The chart is the ground the copy sits on, not an image beside it.
                Anchored right so it fills the gap the text leaves. */}
            <div className="pointer-events-none absolute -top-2 right-0 hidden aspect-square w-[330px] opacity-50 lg:block xl:w-[370px]">
              <HeroKundali />
            </div>

            <div className="relative space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-accent-wash px-3 py-1 text-2xs font-semibold uppercase tracking-wider text-accent-ink">
                <Sparkles className="size-3.5" />
                Sidereal · Lahiri · Whole sign
              </span>

              <h1 className="max-w-[19ch] text-balance font-display text-4xl font-bold leading-tight text-ink sm:text-5xl">
                {t.heroTitle}
              </h1>

              <p className="max-w-xl text-base leading-relaxed text-muted">
                {t.heroSub}
              </p>

              {/* The four things the platform does, before anything else. */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  ["Kundali", "#chart"],
                  ["Analysis", "#reading"],
                  ["AI astrologer", "#ask"],
                  ["Milan", "#milan"],
                  ["Real astrologers", "#astrologers"],
                ].map(([label, href]) => (
                  <a
                    key={label}
                    href={href}
                    className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-accent-ink"
                  >
                    {label}
                  </a>
                ))}
              </div>

              <ul className="space-y-3 pt-2 text-sm">
                {[
                  ["Historical time zones", "The offset your birthplace actually used that year, not today's."],
                  ["The AI never calculates", "Positions come from the ephemeris. It reads them; it cannot invent one."],
                  ["Free to start", "See your full chart without an account."],
                ].map(([title, body]) => (
                  <li key={title} className="flex gap-3">
                    <Check className="mt-0.5 size-4 shrink-0 text-accent-ink" />
                    <span>
                      <strong className="font-semibold text-ink">{title}.</strong>{" "}
                      <span className="text-muted">{body}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* RIGHT SIDE: Intake Form with Clean Custom Select Pickers & AD/BS Toggle */}
          <div className="lg:col-span-5" id="form">
            <div className="rounded-lg border border-line-strong bg-surface p-6 sm:p-7 space-y-5 shadow-raised">
              <div className="border-b border-line pb-3 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-xl font-bold text-ink">{t.birthDetails}</h2>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    {t.heroTagline}
                  </p>
                </div>
              </div>

              <form onSubmit={handleGenerate} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-ink mb-1.5 flex items-center gap-1.5">
                    <User className="size-3.5 text-accent-ink" /> {t.fullName} <span className="text-accent-ink">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors({ ...errors, name: "" });
                    }}
                    placeholder={t.fullName}
                    className={`w-full rounded-md border bg-surface px-3.5 py-2.5 min-h-11 text-sm text-ink placeholder:text-dim focus-visible:outline-none transition ${
                      errors.name ? "border-danger" : "border-line-strong focus-visible:border-ring"
                    }`}
                  />
                  {errors.name && <p className="mt-1 text-xs text-danger font-medium">{errors.name}</p>}
                </div>

                {/* Gender 3-way toggle */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
                    Gender
                  </label>
                  <div className="grid grid-cols-3 gap-2 rounded-md border border-line-strong bg-surface p-1">
                    {(["male", "female", "other"] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(g)}
                        className={`rounded-sm py-1.5 min-h-11 text-xs font-bold capitalize transition ${
                          gender === g
                            ? "bg-accent-strong text-white"
                            : "text-muted hover:text-ink"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Modern Date of Birth Calendar Picker */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-ink mb-1.5 flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-accent-ink" /> {t.birthDate} <span className="text-accent-ink">*</span>
                  </label>
                  <ModernDatePicker
                    era={era}
                    onEraChange={(newEra) => setEra(newEra)}
                    day={day}
                    month={month}
                    year={year}
                    onDateChange={(d, m, y) => {
                      setDay(d);
                      setMonth(m);
                      setYear(y);
                      if (errors.date) setErrors({ ...errors, date: "" });
                    }}
                    error={errors.date}
                  />
                  {errors.date && <p className="mt-1 text-xs text-danger font-medium">{errors.date}</p>}
                </div>

                {/* Modern Time of Birth Visual Clock Picker */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-ink mb-1.5 flex items-center gap-1.5">
                    <Clock className="size-3.5 text-accent-ink" /> {t.birthTime} <span className="text-accent-ink">*</span>
                  </label>
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
                    onApproximateChange={(approx) => setApproximateTime(approx)}
                    error={errors.time}
                  />
                  {errors.time && <p className="mt-1 text-xs text-danger font-medium">{errors.time}</p>}
                </div>

                {/* Custom Place of Birth Autocomplete */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-ink mb-1.5 flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-accent-ink" /> {t.birthPlace} <span className="text-accent-ink">*</span>
                  </label>
                  <CustomPlaceInput
                    value={selectedPlace?.label ?? ""}
                    placeholder={t.birthPlace}
                    onChange={(p) => {
                      setSelectedPlace(p);
                      if (errors.place) setErrors({ ...errors, place: "" });
                    }}
                  />
                  {errors.place && <p className="mt-1 text-xs text-danger font-medium">{errors.place}</p>}
                </div>

                {/* Primary CTA Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={buttonClasses("primary", { className: "w-full py-3.5 text-sm font-bold mt-1" })}
                >
                  <Sparkles className="size-4" />
                  <span>{t.calculateKundali}</span>
                  <ArrowRight className="size-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* How it works — the two halves, and why the split matters. */}
      <section className="border-t border-line bg-cream py-20" id="how">
        <div className="mx-auto max-w-5xl space-y-14 px-6">
          <div className="mx-auto max-w-2xl space-y-3 text-center">
            <span className="text-2xs font-bold uppercase tracking-wider text-accent-ink">
              How it works
            </span>
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
              The maths and the meaning are kept apart
            </h2>
            <p className="text-sm leading-relaxed text-muted">
              Most AI astrology asks a language model to do both, and a language model
              will happily invent a planetary position that sounds right. Here it never
              gets the chance.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <article className="space-y-3 rounded-lg border border-line-strong bg-surface p-7">
              <span className="font-mono text-xs text-dim">01</span>
              <h3 className="font-display text-lg font-bold text-ink">
                The ephemeris calculates
              </h3>
              <p className="text-sm leading-relaxed text-muted">
                Your birth moment is converted to universal time using the zone your
                birthplace kept that year, then Swiss Ephemeris gives every planetary
                longitude. Lahiri ayanamsa, whole-sign houses, mean nodes. The same
                inputs always give the same chart.
              </p>
            </article>

            <article className="space-y-3 rounded-lg border border-line-strong bg-surface p-7">
              <span className="font-mono text-xs text-dim">02</span>
              <h3 className="font-display text-lg font-bold text-ink">
                The astrologer reads it
              </h3>
              <p className="text-sm leading-relaxed text-muted">
                The finished chart is handed to the AI as data. It can interpret,
                compare and explain — but it is never asked to work out a degree or a
                date, so it cannot get one wrong.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* The time zone argument: specific, checkable, and the thing most
          competitors quietly get wrong. */}
      <section className="border-t border-line py-20">
        <div className="mx-auto grid max-w-5xl items-center gap-10 px-6 md:grid-cols-5">
          <div className="space-y-4 md:col-span-3">
            <span className="text-2xs font-bold uppercase tracking-wider text-accent-ink">
              Why charts disagree
            </span>
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
              Kathmandu has not always been +5:45
            </h2>
            <p className="text-sm leading-relaxed text-muted">
              It kept +5:30 until 1986, and local mean time of +5:41:16 before that. A
              1975 birth calculated with today&apos;s offset lands fifteen minutes off —
              roughly <strong className="font-semibold text-ink">3.75° of
              ascendant</strong>, enough to move your lagna into the wrong sign.
            </p>
            <p className="text-sm leading-relaxed text-muted">
              We store the zone by name and look up what it meant on your date. It is a
              small thing that quietly decides whether the rest of the chart is worth
              reading.
            </p>
          </div>

          <div className="md:col-span-2">
            <div className="space-y-3 rounded-lg border border-line-strong bg-surface p-6 font-mono text-xs">
              <div className="mb-1 text-2xs uppercase tracking-widest text-dim">
                Kathmandu, 14 June 1975
              </div>
              <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
                <span className="text-muted">Today&apos;s offset</span>
                <span className="text-danger-ink">+5:45</span>
              </div>
              <div className="flex items-baseline justify-between gap-4 pb-1">
                <span className="text-muted">Actual, that year</span>
                <span className="text-accent-ink">+5:30</span>
              </div>
              <p className="pt-2 font-sans text-xs leading-relaxed text-dim">
                Fifteen minutes of clock time, about 3.75 degrees of ascendant.
              </p>
            </div>
          </div>
        </div>
      </section>

      <PillarsSection />
      <ChartSection />
      <HowItWorksSection />
      <ContentsSection />
      <ReadingSection />
      <ConversationSection />
      <MilanSection />
      <AccuracySection />
      <AstrologersSection />
      <FaqSection />
      <ClosingSection />

      {/* 4. Footer */}
      <MainFooter />
    </div>
  );
}
