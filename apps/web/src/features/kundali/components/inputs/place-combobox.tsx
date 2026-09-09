"use client";

import { useEffect, useId, useRef, useState } from "react";

import { usePlaceSearch } from "@/features/kundali/hooks/use-place-search";
import type { Place } from "@/features/kundali/types";

/**
 * Searchable birthplace picker over 786,650 places.
 *
 * Deliberately not a `<datalist>` or a combobox library: the options come from
 * the network, need debouncing, cancellation and caching, and each row shows
 * the resolved IANA zone — which is the thing that must be right.
 */
export function PlaceCombobox({
  value,
  onChange,
  error,
}: {
  value: Place | null;
  onChange: (place: Place) => void;
  error?: string;
}) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const { results, searchable, loading, failed } = usePlaceSearch(query);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  // Results change as you type; clamp rather than track it in an effect.
  const activeIndex = Math.min(active, Math.max(0, results.length - 1));

  function choose(place: Place) {
    onChange(place);
    setQuery("");
    setOpen(false);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (!open || results.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (i - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(results[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <input
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        className={inputClass}
        value={open ? query : (value?.label ?? "")}
        placeholder={value ? value.label : "Search any town or city…"}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
      />

      {value && !open && (
        <p className="mt-1.5 text-xs text-dim">
          {value.tz_name} · {value.latitude.toFixed(4)}, {value.longitude.toFixed(4)}
          {value.matched_as && (
            <span className="text-dim"> · GeoNames: {value.matched_as}</span>
          )}
        </p>
      )}
      {error && <p className="mt-1.5 text-xs text-rose-300">{error}</p>}

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-lg border border-line bg-surface elev-raised border border-line-strong"
        >
          {!searchable ? (
            <li className="px-4 py-3 text-xs text-mut">
              Type at least two letters. Every populated place in Nepal and India
              is here, plus towns worldwide.
            </li>
          ) : loading ? (
            <li className="px-4 py-3 text-xs text-mut">Searching…</li>
          ) : failed ? (
            <li className="px-4 py-3 text-xs text-rose-300">
              Could not reach the place index. Is the API running?
            </li>
          ) : results.length === 0 ? (
            <li className="px-4 py-3 text-xs text-mut">
              Nothing found. Try a nearby larger town.
            </li>
          ) : (
            results.map((place, i) => (
              <li key={place.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={i === activeIndex}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(place)}
                  className={`flex w-full items-baseline justify-between gap-3 px-4 py-2.5 text-left transition ${
                    i === activeIndex ? "bg-accent-strong/10" : ""
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-fg">
                      {place.name}
                      {place.matched_as && (
                        <span className="text-dim"> · {place.matched_as}</span>
                      )}
                    </span>
                    <span className="block truncate text-2xs text-mut">
                      {[place.admin1, place.country].filter(Boolean).join(", ")}
                    </span>
                  </span>
                  <span className="shrink-0 text-2xs text-accent-ink">
                    {place.tz_name}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

const inputClass =
  "w-full rounded-md border border-line bg-cream px-3.5 py-2.5 text-sm text-fg outline-none transition focus:border-accent-strong/60";
