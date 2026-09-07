"use client";

import { useState, useRef, useEffect, useMemo } from "react";

import { searchPlaces, DEFAULT_POPULAR_PLACES } from "@/features/kundali/api/places.api";
import type { Place } from "@/features/kundali/types";
import { placementClass, popoverFit, type Fit } from "@/components/ui/popover-placement";

interface CustomPlaceInputProps {
  value: string;
  onChange: (place: Place) => void;
  placeholder?: string;
}

/** 27.7172, 85.324 -> 27.72°N 85.32°E — the way a chart header writes it. */
function coords(lat: number, lon: number) {
  return `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? "N" : "S"} ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? "E" : "W"}`;
}

/** `max-h-64` worth of rows, plus the header and padding. */
const PREFERRED_HEIGHT = 300;

export function CustomPlaceInput({
  value,
  onChange,
  placeholder = "Search city, e.g. Kathmandu or San Francisco",
}: CustomPlaceInputProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Place[]>(DEFAULT_POPULAR_PLACES);
  const [isOpen, setIsOpen] = useState(false);
  const [fit, setFit] = useState<Fit>({ placement: "down", maxHeight: PREFERRED_HEIGHT });
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  /* Adjusting state during render rather than in an effect: an effect that
     setStates on a prop change costs an extra render pass every time the
     parent resets the field. */
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setQuery(value);
  }

  /* Typing must feel immediate, and the network is not.
     Three things make it so: the list already on screen is narrowed on the
     keystroke itself, every superseded request is aborted so a slow
     two-letter query cannot hold the connection while a specific one waits,
     and answers are remembered so backtracking costs nothing. */
  const cache = useRef(new Map<string, Place[]>());
  const inFlight = useRef<AbortController | null>(null);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return suggestions;
    const local = suggestions.filter((p) => p.label.toLowerCase().includes(q));
    return local.length ? local : suggestions;
  }, [query, suggestions]);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    // A remembered answer still goes through the timer, so state is never set
    // synchronously inside the effect body.
    const timer = setTimeout(() => {
      const cached = cache.current.get(q);
      if (cached) {
        setSuggestions(cached);
        setActive(0);
        return;
      }
      inFlight.current?.abort();
      const controller = new AbortController();
      inFlight.current = controller;
      searchPlaces(query, controller.signal)
        .then((res) => {
          if (controller.signal.aborted) return;
          cache.current.set(q, res);
          setSuggestions(res);
          setActive(0);
        })
        .catch(() => {
          /* aborted, or search briefly unavailable — keep what is on screen */
        });
    }, cache.current.has(q) ? 0 : 90);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function pick(p: Place) {
    setQuery(p.label);
    onChange(p);
    setIsOpen(false);
  }

  /* A combobox you can only use with a mouse is half a control. */
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") return setIsOpen(false);
    if (!isOpen || !shown.length) return;
    if (e.key === "Enter") {
      e.preventDefault();
      return pick(shown[active]);
    }
    const step = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (active + step + shown.length) % shown.length;
    setActive(next);
    listRef.current?.children[next + 1]?.scrollIntoView({ block: "nearest" });
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        aria-controls="place-listbox"
        value={query}
        onFocus={() => {
          setFit(popoverFit(containerRef.current, PREFERRED_HEIGHT));
          setIsOpen(true);
        }}
        onKeyDown={onKeyDown}
        onChange={(e) => {
          setQuery(e.target.value);
          setFit(popoverFit(containerRef.current, PREFERRED_HEIGHT));
          setIsOpen(true);
        }}
        placeholder={placeholder}
        className="w-full rounded-[8px] border border-white/10 bg-[#090A10] px-3.5 py-2.5 text-xs text-[#F8FAFC] placeholder-[#94A3B8]/40 transition focus:border-[#E5A93C] focus:outline-none"
      />

      {isOpen && shown.length > 0 && (
        <div
          ref={listRef}
          id="place-listbox"
          role="listbox"
          className={`absolute left-0 z-50 w-full overflow-y-auto rounded-[8px] border border-white/12 bg-[#0B0E18]/95 p-1.5 shadow-2xl shadow-black/50 backdrop-blur-xl ${placementClass(fit.placement)}`}
          style={{ maxHeight: fit.maxHeight }}
        >
          <div className="px-2.5 pb-2 pt-1 font-mono text-[9.5px] uppercase tracking-[0.18em] text-[#E5A93C]">
            {query.trim() ? "Matches" : "Popular"}
          </div>
          {shown.map((p, i) => (
            <button
              key={p.id}
              type="button"
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(p)}
              className={`group flex w-full items-center gap-3 rounded-[6px] px-2.5 py-2 text-left transition-colors ${
                i === active ? "bg-white/[0.06]" : ""
              }`}
            >
              <span
                className={`shrink-0 transition-colors ${
                  i === active ? "text-[#E5A93C]" : "text-[#5F6B7F]"
                }`}
              >
                <svg
                  className="size-[15px]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium text-[#F8FAFC]">{p.label}</span>
                {/* The zone is the field that decides whether the chart is
                    right, so it is shown rather than hidden behind a label. */}
                <span className="mt-0.5 block truncate font-mono text-[10px] text-[#5F6B7F]">
                  {p.tz_name} · {coords(p.latitude, p.longitude)}
                </span>
              </span>
              <span className="shrink-0 rounded-[4px] border border-white/10 px-1.5 py-0.5 font-mono text-[9.5px] tracking-wide text-[#94A3B8]">
                {p.country_code}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
