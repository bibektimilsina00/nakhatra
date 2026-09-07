"use client";

import { useTranslation } from "@/lib/i18n/language-context";

import { useState, useRef, useEffect } from "react";

import { placementClass, popoverFit, type Fit } from "@/components/ui/popover-placement";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { AD_MONTH_SHORT, BS_MONTH_SHORT, getDaysInBsMonth } from "@/lib/utils/date-converter";
import { CustomSelect, type CustomSelectOption } from "@/components/ui/custom-select";

interface ModernDatePickerProps {
  era: "AD" | "BS";
  onEraChange: (era: "AD" | "BS") => void;
  day: string;
  month: string;
  year: string;
  onDateChange: (d: string, m: string, y: string) => void;
  error?: string;
}

const AD_YEARS = Array.from({ length: 95 }, (_, i) => 2026 - i);
const BS_YEARS = Array.from({ length: 95 }, (_, i) => 2083 - i);

/** What the panel wants, in pixels; capped to what the viewport allows. */
const PREFERRED_HEIGHT = 440;

export function ModernDatePicker({
  era,
  onEraChange,
  day,
  month,
  year,
  onDateChange,
  error,
}: ModernDatePickerProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [fit, setFit] = useState<Fit>({ placement: "down", maxHeight: PREFERRED_HEIGHT });

  // The calendar is tall; inside a dialog it is the one most likely to run off

  const toggle = () => {
    if (!isOpen) setFit(popoverFit(containerRef.current, PREFERRED_HEIGHT));
    setIsOpen((wasOpen) => !wasOpen);
  };
  const containerRef = useRef<HTMLDivElement>(null);

  // Default values if empty
  const currentYear = year ? parseInt(year, 10) : era === "AD" ? 1998 : 2055;
  const currentMonth = month ? parseInt(month, 10) : 9; // Sept / Ashwin
  const currentDay = day ? parseInt(day, 10) : 15;

  const monthNames = era === "AD" ? AD_MONTH_SHORT : BS_MONTH_SHORT;
  const yearsList = era === "AD" ? AD_YEARS : BS_YEARS;

  const monthOptions: CustomSelectOption[] = monthNames.map((name, idx) => ({
    value: String(idx + 1),
    label: name,
  }));

  const yearOptions: CustomSelectOption[] = yearsList.map((y) => ({
    value: String(y),
    label: String(y),
  }));

  const navigateMonth = (direction: -1 | 1) => {
    let newM = currentMonth + direction;
    let newY = currentYear;
    if (newM > 12) {
      newM = 1;
      newY = currentYear + 1;
    } else if (newM < 1) {
      newM = 12;
      newY = currentYear - 1;
    }
    onDateChange(day || "15", String(newM), String(newY));
  };

  // Days in selected month
  const getDaysInMonth = (m: number, y: number) => {
    if (era === "AD") {
      return new Date(y, m, 0).getDate();
    }
    return getDaysInBsMonth(y, m);
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDisplayDate = () => {
    if (!day || !month || !year) return t.selectDate;
    const mName = monthNames[parseInt(month, 10) - 1] || "";
    return `${day} ${mName} ${year} ${era}`;
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Interactive Trigger Field */}
      <button
        type="button"
        onClick={toggle}
        className={`flex w-full items-center justify-between rounded-[8px] border bg-[#090A10] px-4 py-3 text-xs font-semibold text-[#F8FAFC] transition hover:border-[#E5A93C] focus:outline-none ${
          error ? "border-rose-500" : isOpen ? "border-[#E5A93C] ring-1 ring-[#E5A93C]" : "border-white/10"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Calendar className="size-4 text-[#E5A93C]" />
          <span className={day && month && year ? "text-[#F8FAFC] font-medium" : "text-[#94A3B8]/50"}>
            {formatDisplayDate()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded bg-[#161B2B] px-2 py-0.5 text-[10px] font-bold text-[#E5A93C] border border-white/10">
            {era}
          </span>
          <ChevronDown
            className={`size-4 text-[#94A3B8] transition-transform duration-200 ${isOpen ? "rotate-180 text-[#E5A93C]" : ""}`}
          />
        </div>
      </button>

      {/* Floating Popover Calendar Modal */}
      {isOpen && (
        <div className={`absolute left-0 z-50 w-full max-w-sm overflow-y-auto rounded-[8px] border border-[#E5A93C]/30 bg-[#161B2B] p-4 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 ${placementClass(fit.placement)}`}
          style={{ maxHeight: fit.maxHeight }}
        >
          
          {/* Era Tab Bar */}
          <div className="border-b border-white/10 pb-3">
            <div className="grid grid-cols-2 rounded-[6px] border border-white/10 bg-[#090A10] p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => onEraChange("AD")}
                className={`rounded-[4px] py-1.5 text-center transition ${
                  era === "AD" ? "bg-[#E5A93C] text-[#090A10]" : "text-[#94A3B8] hover:text-[#F8FAFC]"
                }`}
              >
                AD (Gregorian)
              </button>
              <button
                type="button"
                onClick={() => onEraChange("BS")}
                className={`rounded-[4px] py-1.5 text-center transition ${
                  era === "BS" ? "bg-[#E5A93C] text-[#090A10]" : "text-[#94A3B8] hover:text-[#F8FAFC]"
                }`}
              >
                BS (Bikram Sambat)
              </button>
            </div>
          </div>

          {/* Custom Month & Year Dropdowns with Prev / Next Navigation */}
          <div className="flex items-center justify-between gap-1.5">
            <button
              type="button"
              onClick={() => navigateMonth(-1)}
              className="size-8 shrink-0 rounded-[6px] border border-white/10 bg-[#090A10] text-xs font-bold text-[#F8FAFC] hover:border-[#E5A93C] transition flex items-center justify-center"
              title="Previous Month"
            >
              <ChevronLeft className="size-4" />
            </button>

            {/* Custom Month Dropdown */}
            <CustomSelect
              value={String(currentMonth)}
              options={monthOptions}
              onChange={(m) => onDateChange(day || "15", m, String(currentYear))}
              className="flex-1"
            />

            {/* Custom Year Dropdown */}
            <CustomSelect
              value={String(currentYear)}
              options={yearOptions}
              onChange={(y) => onDateChange(day || "15", String(currentMonth), y)}
              className="w-28 shrink-0"
            />

            <button
              type="button"
              onClick={() => navigateMonth(1)}
              className="size-8 shrink-0 rounded-[6px] border border-white/10 bg-[#090A10] text-xs font-bold text-[#F8FAFC] hover:border-[#E5A93C] transition flex items-center justify-center"
              title="Next Month"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          {/* Days Grid Header */}
          <div className="grid grid-cols-7 text-center text-[10px] font-bold uppercase text-[#94A3B8] pt-1">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
              const isSelected = parseInt(day, 10) === d;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    onDateChange(
                      String(d).padStart(2, "0"),
                      String(currentMonth).padStart(2, "0"),
                      String(currentYear)
                    );
                  }}
                  className={`rounded-[6px] py-1.5 text-xs font-bold transition ${
                    isSelected
                      ? "bg-[#E5A93C] text-[#090A10] shadow"
                      : "text-[#CBD5E1] hover:bg-white/10 hover:text-[#F8FAFC]"
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-between border-t border-white/10 pt-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  onDateChange(
                    String(now.getDate()).padStart(2, "0"),
                    String(now.getMonth() + 1).padStart(2, "0"),
                    String(now.getFullYear())
                  );
                }}
                className="text-[11px] font-bold text-[#E5A93C] hover:underline"
              >
                Today
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-[6px] bg-[#E5A93C] px-4 py-1.5 text-xs font-bold text-[#090A10] transition hover:bg-[#F3C766]"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
