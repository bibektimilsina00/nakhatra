"use client";

/**
 * Birth-time picker with AM/PM.
 *
 * Stores 24-hour "HH:MM" because that is what the API takes, but presents
 * 12-hour with a meridiem toggle — birth times are almost always remembered
 * and written down that way ("half seven in the evening"), and mis-entering
 * 7:30 as 07:30 instead of 19:30 moves the ascendant by roughly six signs.
 */
export function TimePicker({
  value, // "HH:MM", 24-hour
  onChange,
  error,
}: {
  value: string;
  onChange: (hhmm: string) => void;
  error?: string;
}) {
  const [h24, minute] = parse(value);
  const meridiem = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;

  function emit(nextH12: number, nextMinute: number, nextMeridiem: "AM" | "PM") {
    const hour24 =
      nextMeridiem === "AM"
        ? nextH12 % 12
        : (nextH12 % 12) + 12;
    onChange(`${pad(hour24)}:${pad(nextMinute)}`);
  }

  return (
    <div>
      <div className="flex items-stretch gap-2">
        <Spinner
          label="Hour"
          value={h12}
          min={1}
          max={12}
          onChange={(v) => emit(v, minute, meridiem)}
        />
        <span className="self-center pb-1 font-display text-xl text-mut">:</span>
        <Spinner
          label="Minute"
          value={minute}
          min={0}
          max={59}
          pad
          onChange={(v) => emit(h12, v, meridiem)}
        />
        <div className="flex flex-col justify-end gap-1">
          {(["AM", "PM"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => emit(h12, minute, m)}
              className={`rounded-sm border px-3 py-1 text-xs transition ${
                meridiem === m
                  ? "border-accent-strong/50 bg-accent-strong/12 text-accent-ink"
                  : "border-line text-mut hover:border-muted/40"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="mt-1.5 text-xs text-rose-300">{error}</p>}
      <p className="mt-1.5 text-xs text-dim">
        Stored as {value} · four minutes moves the ascendant about a degree.
      </p>
    </div>
  );
}

function Spinner({
  label,
  value,
  min,
  max,
  pad: padded,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  pad?: boolean;
  onChange: (value: number) => void;
}) {
  const step = (delta: number) => {
    const span = max - min + 1;
    onChange(((value - min + delta + span) % span) + min);
  };
  return (
    <label className="flex-1">
      <span className="sr-only">{label}</span>
      <div className="flex items-center rounded-md border border-line bg-cream">
        <button
          type="button"
          onClick={() => step(-1)}
          className="px-2.5 py-2 text-mut transition hover:text-fg"
          aria-label={`${label} down`}
        >
          −
        </button>
        <input
          inputMode="numeric"
          className="w-full bg-transparent py-2 text-center font-display text-lg text-fg outline-none"
          value={padded ? pad(value) : value}
          onChange={(e) => {
            const n = Number(e.target.value.replace(/\D/g, ""));
            if (!Number.isNaN(n) && n >= min && n <= max) onChange(n);
          }}
        />
        <button
          type="button"
          onClick={() => step(1)}
          className="px-2.5 py-2 text-mut transition hover:text-fg"
          aria-label={`${label} up`}
        >
          +
        </button>
      </div>
    </label>
  );
}

function parse(value: string): [number, number] {
  const [h, m] = value.split(":").map(Number);
  return [Number.isFinite(h) ? h : 12, Number.isFinite(m) ? m : 0];
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
