"use client";

import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import { useDismissable } from "@/components/ui/use-dismissable";

/**
 * A phone number, as a phone number.
 *
 * The field this replaces was a bare text input: it accepted "call me on
 * viber", offered no keypad on a phone, and left the country code to whatever
 * the applicant guessed. Here the dial code is chosen and the rest is digits —
 * so what reaches the server is always `+<code><digits>`, which is the only
 * form anyone can actually dial.
 *
 * The list is short on purpose: Nepal first, then where the diaspora this is
 * for actually lives. Somewhere else is typed into the code box directly.
 */
const DIAL_CODES = [
  { code: "+977", country: "NP" },
  { code: "+91", country: "IN" },
  { code: "+1", country: "US" },
  { code: "+44", country: "GB" },
  { code: "+61", country: "AU" },
  { code: "+971", country: "AE" },
  { code: "+974", country: "QA" },
  { code: "+82", country: "KR" },
  { code: "+81", country: "JP" },
  { code: "+60", country: "MY" },
];

export const MIN_DIGITS = 7;
export const MAX_DIGITS = 15;

/** Split a stored `+9779812345678` back into its two halves. */
export function splitPhone(value: string): { dial: string; digits: string } {
  const match = DIAL_CODES.map((row) => row.code)
    .sort((a, b) => b.length - a.length)
    .find((code) => value.startsWith(code));
  if (match) return { dial: match, digits: value.slice(match.length).replace(/\D/g, "") };
  return { dial: "+977", digits: value.replace(/\D/g, "") };
}

export function PhoneField({
  dial,
  digits,
  onChange,
  invalid,
  id,
}: {
  dial: string;
  digits: string;
  onChange: (next: { dial: string; digits: string }) => void;
  invalid?: boolean;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  useDismissable(open, menu, () => setOpen(false));

  return (
    <div
      className={`flex items-stretch overflow-hidden rounded-[8px] border bg-app transition-colors focus-within:border-acc/45 ${
        invalid ? "border-rose-400/50" : "border-white/[0.09]"
      }`}
    >
      <div ref={menu} className="relative">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="flex h-full items-center gap-1.5 border-r border-white/[0.09] px-3 text-[13px] tabular-nums text-fg transition-colors hover:bg-fg/[0.03]"
        >
          {dial}
          <ChevronDown className={`size-3.5 text-dim transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <ul
            role="listbox"
            className="absolute left-0 top-[calc(100%+4px)] z-20 max-h-60 w-[132px] overflow-y-auto rounded-[8px] border border-white/[0.10] bg-panel py-1 shadow-2xl"
          >
            {DIAL_CODES.map((row) => (
              <li key={row.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={row.code === dial}
                  onClick={() => {
                    onChange({ dial: row.code, digits });
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-3 py-1.5 text-[12.5px] transition-colors hover:bg-fg/[0.05] ${
                    row.code === dial ? "text-acc2" : "text-mut"
                  }`}
                >
                  <span>{row.country}</span>
                  <span className="tabular-nums">{row.code}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <input
        id={id}
        // `tel` rather than `number`: a phone number is not a quantity, and
        // `number` would offer a spinner and drop a leading zero.
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        value={digits}
        placeholder="98XXXXXXXX"
        maxLength={MAX_DIGITS}
        onChange={(event) =>
          onChange({ dial, digits: event.target.value.replace(/\D/g, "").slice(0, MAX_DIGITS) })
        }
        className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-[13.5px] tabular-nums text-fg placeholder-faint focus:outline-none"
      />
    </div>
  );
}
