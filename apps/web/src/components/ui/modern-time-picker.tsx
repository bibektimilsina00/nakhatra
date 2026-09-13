"use client";

import { useTranslation } from "@/lib/i18n/language-context";

import { useState, useRef, useEffect } from "react";

import { placementClass, popoverFit, type Fit } from "@/components/ui/popover-placement";
import { Clock, ChevronDown, Sunrise, Sun, Sunset, Moon, Plus, Minus } from "lucide-react";

interface ModernTimePickerProps {
  hour: string;
  minute: string;
  ampm: "AM" | "PM";
  approximateTime: boolean;
  onTimeChange: (h: string, m: string, ap: "AM" | "PM") => void;
  onApproximateChange: (approx: boolean) => void;
  error?: string;
}

const PRESET_TIMES = [
  { label: "Morning", Icon: Sunrise, h: "06", m: "00", ap: "AM" as const },
  { label: "Noon", Icon: Sun, h: "12", m: "00", ap: "PM" as const },
  { label: "Evening", Icon: Sunset, h: "06", m: "00", ap: "PM" as const },
  { label: "Night", Icon: Moon, h: "10", m: "00", ap: "PM" as const },
];

/** What the panel wants, in pixels; capped to what the viewport allows. */
const PREFERRED_HEIGHT = 460;

export function ModernTimePicker({
  hour,
  minute,
  ampm,
  approximateTime,
  onTimeChange,
  onApproximateChange,
  error,
}: ModernTimePickerProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [fit, setFit] = useState<Fit>({ placement: "down", maxHeight: PREFERRED_HEIGHT });


  const toggle = () => {
    if (!isOpen) setFit(popoverFit(containerRef.current, PREFERRED_HEIGHT));
    setIsOpen((wasOpen) => !wasOpen);
  };
  const containerRef = useRef<HTMLDivElement>(null);

  const curHour = hour || "07";
  const curMinute = minute || "30";
  const curAmPm = ampm || "AM";

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

  const formatDisplayTime = () => {
    if (!hour || !minute) return t.selectTime;
    return `${hour}:${minute} ${ampm} ${approximateTime ? "(Approx)" : ""}`;
  };

  const adjustMinute = (delta: number) => {
    let m = parseInt(curMinute, 10) + delta;
    if (m >= 60) m = 0;
    if (m < 0) m = 59;
    onTimeChange(curHour, String(m).padStart(2, "0"), curAmPm);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Interactive Trigger Button */}
      <button
        type="button"
        onClick={toggle}
        className={`flex w-full items-center justify-between rounded-md border bg-surface px-4 py-3 text-xs font-semibold text-ink transition hover:border-accent-strong focus:outline-none ${
          error ? "border-danger" : isOpen ? "border-ring ring-1 ring-ring" : "border-line-strong"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Clock className="size-4 text-accent" />
          <span className={hour && minute ? "text-ink font-medium" : "text-dim"}>
            {formatDisplayTime()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-sm bg-accent-tint px-2 py-0.5 text-2xs font-bold text-accent-strong border border-line-strong">
            {curAmPm}
          </span>
          <ChevronDown
            className={`size-4 text-muted transition-transform duration-200 ${isOpen ? "rotate-180 text-accent-strong" : ""}`}
          />
        </div>
      </button>

      {/* Floating Popover Time Picker Modal */}
      {isOpen && (
        <div className={`absolute left-0 z-50 w-full max-w-sm overflow-y-auto rounded-lg border border-line-strong bg-surface p-4 shadow-raised space-y-4 animate-in fade-in zoom-in-95 duration-150 ${placementClass(fit.placement)}`}
          style={{ maxHeight: fit.maxHeight }}
        >
          
          {/* Header Digital Clock Readout & AM/PM Toggle */}
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-1 font-mono text-2xl font-bold tracking-widest text-accent-ink">
              <span>{curHour}</span>
              <span className="animate-pulse">:</span>
              <span>{curMinute}</span>
              <span className="text-xs text-accent-strong ml-1">{curAmPm}</span>
            </div>

            {/* AM / PM Segmented Control */}
            <div className="flex rounded-md border border-line-strong bg-cream p-1 text-xs font-bold">
              {(["AM", "PM"] as const).map((ap) => (
                <button
                  key={ap}
                  type="button"
                  onClick={() => onTimeChange(curHour, curMinute, ap)}
                  className={`rounded-sm px-3 py-1 transition ${
                    curAmPm === ap
                      ? "bg-accent-strong text-white"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {ap}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Presets Strip */}
          <div className="space-y-1.5">
            <span className="text-2xs font-bold uppercase tracking-wider text-muted">Quick Time Presets</span>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESET_TIMES.map((preset) => {
                const PresetIcon = preset.Icon;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => onTimeChange(preset.h, preset.m, preset.ap)}
                    className="rounded-md border border-line-strong bg-surface py-1.5 px-2 text-2xs font-semibold text-ink hover:border-accent-strong hover:text-accent-ink transition flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1.5">
                      <PresetIcon className="size-3.5 text-accent" />
                      {preset.label}
                    </span>
                    <span className="text-2xs text-muted">{preset.h}:{preset.m} {preset.ap}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hours Picker Grid (1-12) */}
          <div className="space-y-1.5">
            <span className="text-2xs font-bold uppercase tracking-wider text-muted">Select Hour</span>
            <div className="grid grid-cols-6 gap-1 text-center">
              {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((h) => {
                const isSelected = curHour === h;
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => onTimeChange(h, curMinute, curAmPm)}
                    className={`rounded-md py-1.5 text-xs font-bold transition ${
                      isSelected
                        ? "bg-accent-strong text-white shadow-xs"
                        : "text-ink hover:bg-accent-wash"
                    }`}
                  >
                    {h}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Minutes Picker Grid (00..55) & Fine Control */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-wider text-muted">Select Minute</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => adjustMinute(-1)}
                  className="size-6 rounded-sm border border-line-strong bg-surface text-xs font-bold text-ink hover:border-accent-strong flex items-center justify-center"
                >
                  <Minus className="size-3" />
                </button>
                <span className="text-xs font-bold font-mono text-accent-ink px-1">{curMinute}</span>
                <button
                  type="button"
                  onClick={() => adjustMinute(1)}
                  className="size-6 rounded-sm border border-line-strong bg-surface text-xs font-bold text-ink hover:border-accent-strong flex items-center justify-center"
                >
                  <Plus className="size-3" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-1 text-center">
              {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map((m) => {
                const isSelected = curMinute === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => onTimeChange(curHour, m, curAmPm)}
                    className={`rounded-md py-1.5 text-xs font-bold transition ${
                      isSelected
                        ? "bg-accent-strong text-white shadow-xs"
                        : "text-ink hover:bg-accent-wash"
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Approximate Checkbox & Done Button */}
          <div className="flex items-center justify-between border-t border-line pt-3">
            <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
              <input
                type="checkbox"
                checked={approximateTime}
                onChange={(e) => onApproximateChange(e.target.checked)}
                className="rounded-sm border-line-strong bg-surface text-accent-strong focus:ring-0"
              />
              <span>Approximate time</span>
            </label>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-md bg-accent-strong px-4 py-1.5 text-xs font-bold text-white transition hover:opacity-90"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
