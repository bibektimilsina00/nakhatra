"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export interface CustomSelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  options: CustomSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CustomSelect({
  value,
  options,
  onChange,
  placeholder = "Select...",
  className = "",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

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

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-md border border-line-strong bg-surface px-3 py-2.5 text-xs font-semibold text-ink hover:border-accent-strong focus:border-ring focus:outline-none transition"
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown
          className={`size-3.5 shrink-0 text-muted transition-transform duration-200 ${
            isOpen ? "rotate-180 text-accent-strong" : ""
          }`}
        />
      </button>

      {/* Popover Options Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-line-strong bg-surface p-1 shadow-raised">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full rounded-md px-3 py-1.5 text-left text-xs font-semibold transition ${
                  isSelected
                    ? "bg-accent-strong text-white"
                    : "text-muted hover:bg-accent-wash hover:text-ink"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
