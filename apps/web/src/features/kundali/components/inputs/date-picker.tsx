"use client";

import { useEffect, useRef, useState } from "react";
import {
  AD_MONTHS,
  BS_MONTHS,
  convertAdToBs,
  convertBsToAd,
  getDaysInBsMonth,
} from "@/lib/utils/date-converter";

export function DatePicker({
  value,
  onChange,
  error,
}: {
  value: string; // YYYY-MM-DD (AD ISO) or empty
  onChange: (iso: string) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [era, setEra] = useState<"AD" | "BS">("AD");
  const rootRef = useRef<HTMLDivElement>(null);

  const parsedAd = parseIso(value);
  const bsConverted = convertAdToBs(parsedAd.year, parsedAd.month, parsedAd.day);

  const [adView, setAdView] = useState({ year: parsedAd.year, month: parsedAd.month });
  const [bsView, setBsView] = useState({ year: bsConverted.year, month: bsConverted.month });

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const adYears = Array.from({ length: 90 }, (_, i) => 2026 - i);
  const bsYears = Array.from({ length: 90 }, (_, i) => 2085 - i);

  const daysInAdMonth = new Date(adView.year, adView.month, 0).getDate();
  const firstAdWeekday = new Date(adView.year, adView.month - 1, 1).getDay();

  function pickAd(day: number) {
    const iso = `${adView.year}-${String(adView.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onChange(iso);
    setOpen(false);
  }

  function pickBs(day: number) {
    const converted = convertBsToAd(bsView.year, bsView.month, day);
    onChange(converted.iso);
    setOpen(false);
  }

  function shiftAdMonth(delta: number) {
    setAdView(({ year, month }) => {
      const next = month + delta;
      if (next < 1) return { year: year - 1, month: 12 };
      if (next > 12) return { year: year + 1, month: 1 };
      return { year, month: next };
    });
  }

  function shiftBsMonth(delta: number) {
    setBsView(({ year, month }) => {
      const next = month + delta;
      if (next < 1) return { year: year - 1, month: 12 };
      if (next > 12) return { year: year + 1, month: 1 };
      return { year, month: next };
    });
  }

  // Display label on closed button
  const displayLabel = value
    ? era === "AD"
      ? `${parsedAd.day} ${AD_MONTHS[parsedAd.month - 1]} ${parsedAd.year} AD`
      : `${bsConverted.day} ${BS_MONTHS[bsConverted.month - 1].split(" ")[0]} ${bsConverted.year} BS`
    : "Select date of birth";

  return (
    <div ref={rootRef} className="relative">
      {/* Closed Selector Button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between rounded-xl border bg-cream px-3.5 py-2.5 text-left text-xs transition ${
          error ? "border-danger text-danger" : "border-line-strong text-ink hover:border-line-strong"
        }`}
      >
        <span className={value ? "text-ink font-semibold" : "text-dim"}>
          {displayLabel}
        </span>
        <span className="rounded-sm bg-accent-tint px-1.5 py-0.5 text-2xs font-bold text-accent-strong">
          {era} ▾
        </span>
      </button>
      {error && <p className="mt-1 text-xs text-danger font-medium">{error}</p>}

      {open && (
        <div className="absolute z-50 mt-2 w-full min-w-[300px] rounded-xl border border-line-strong bg-surface p-4 shadow-raised">
          {/* Era Toggle Switcher (AD / BS) */}
          <div className="mb-3 flex items-center justify-between border-b border-line-strong pb-2.5">
            <span className="text-xs font-bold text-ink">Calendar Era:</span>
            <div className="flex rounded-xl border border-line-strong bg-cream p-0.5 text-2xs">
              <button
                type="button"
                onClick={() => setEra("AD")}
                className={`rounded-md px-3 py-1 font-bold transition ${
                  era === "AD"
                    ? "bg-accent-strong text-white"
                    : "text-muted hover:text-ink"
                }`}
              >
                AD (Gregorian)
              </button>
              <button
                type="button"
                onClick={() => setEra("BS")}
                className={`rounded-md px-3 py-1 font-bold transition ${
                  era === "BS"
                    ? "bg-accent-strong text-white"
                    : "text-muted hover:text-ink"
                }`}
              >
                BS (Bikram Sambat)
              </button>
            </div>
          </div>

          {/* AD Mode Controls */}
          {era === "AD" ? (
            <div>
              <div className="mb-3 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => shiftAdMonth(-1)}
                  className="min-h-11 min-w-11 rounded-md border border-line-strong bg-cream px-2 py-1 text-xs text-muted hover:text-ink"
                >
                  ‹
                </button>
                <select
                  value={adView.month}
                  onChange={(e) => setAdView((v) => ({ ...v, month: Number(e.target.value) }))}
                  className={selectClass}
                >
                  {AD_MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  value={adView.year}
                  onChange={(e) => setAdView((v) => ({ ...v, year: Number(e.target.value) }))}
                  className={selectClass}
                >
                  {adYears.map((y) => (
                    <option key={y} value={y}>
                      {y} AD
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => shiftAdMonth(1)}
                  className="min-h-11 min-w-11 rounded-md border border-line-strong bg-cream px-2 py-1 text-xs text-muted hover:text-ink"
                >
                  ›
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <span key={i} className="py-1 text-2xs uppercase font-bold text-muted">
                    {d}
                  </span>
                ))}
                {Array.from({ length: firstAdWeekday }, (_, i) => (
                  <span key={`pad-${i}`} />
                ))}
                {Array.from({ length: daysInAdMonth }, (_, i) => {
                  const day = i + 1;
                  const selected =
                    parsedAd.year === adView.year &&
                    parsedAd.month === adView.month &&
                    parsedAd.day === day;
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => pickAd(day)}
                      className={`min-h-11 rounded-md py-1.5 text-xs font-semibold transition ${
                        selected
                          ? "bg-accent-strong text-white font-bold"
                          : "text-ink " +
                            "hover:bg-accent-wash"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* BS Mode Controls */
            <div>
              <div className="mb-3 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => shiftBsMonth(-1)}
                  className="min-h-11 min-w-11 rounded-md border border-line-strong bg-cream px-2 py-1 text-xs text-muted hover:text-ink"
                >
                  ‹
                </button>
                <select
                  value={bsView.month}
                  onChange={(e) => setBsView((v) => ({ ...v, month: Number(e.target.value) }))}
                  className={selectClass}
                >
                  {BS_MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  value={bsView.year}
                  onChange={(e) => setBsView((v) => ({ ...v, year: Number(e.target.value) }))}
                  className={selectClass}
                >
                  {bsYears.map((y) => (
                    <option key={y} value={y}>
                      {y} BS
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => shiftBsMonth(1)}
                  className="min-h-11 min-w-11 rounded-md border border-line-strong bg-cream px-2 py-1 text-xs text-muted hover:text-ink"
                >
                  ›
                </button>
              </div>

              {/* Grid of days for BS month */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {Array.from({ length: getDaysInBsMonth(bsView.year, bsView.month) }, (_, i) => {
                  const day = i + 1;
                  const selected =
                    bsConverted.year === bsView.year &&
                    bsConverted.month === bsView.month &&
                    bsConverted.day === day;
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => pickBs(day)}
                      className={`min-h-11 rounded-md py-1.5 text-xs font-semibold transition ${
                        selected
                          ? "bg-accent-strong text-white font-bold"
                          : "text-ink " +
                            "hover:bg-accent-wash"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const selectClass =
  "flex-1 rounded-md border border-line-strong bg-cream px-2 py-1.5 text-xs text-ink outline-none focus:border-accent";

function parseIso(iso: string) {
  if (!iso || !iso.includes("-")) {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
    };
  }
  const [y, m, d] = iso.split("-").map(Number);
  return {
    year: y,
    month: m,
    day: d,
  };
}
