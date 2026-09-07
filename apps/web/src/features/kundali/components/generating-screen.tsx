"use client";

import { useState, useEffect } from "react";

const STEPS = [
  "Calculating planetary longitudes using Swiss Ephemeris...",
  "Casting Ascendant (Lagna) & D1 Rashi Chart...",
  "Mapping Vimshottari Mahadasha & Antardasha timelines...",
  "Synthesizing personalized AI reading & preparing audio..."
];

export function GeneratingScreen({
  onComplete,
}: {
  /**
   * What to do when the animation finishes. Without it this is a loader and
   * nothing more — it used to navigate to /reading on its own, which fired
   * behind the reading page's own loading state and raced whatever that page
   * had decided to do next.
   */
  onComplete?: () => void;
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < STEPS.length - 1) return prev + 1;
        clearInterval(interval);
        setTimeout(() => onComplete?.(), 800);
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#090A10] via-[#0D101A] to-[#0F121E] flex flex-col items-center justify-center p-6 text-center">
      {/* Sacred Geometry SVG Chart with Gold Stroke Animation */}
      <div className="relative size-72 sm:size-80 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-[#E5A93C]/10 blur-3xl animate-pulse" />

        <svg className="size-full stroke-[#E5A93C]" viewBox="0 0 300 300" fill="none">
          {/* Outer Square */}
          <rect
            x="10"
            y="10"
            width="280"
            height="280"
            strokeWidth="2"
            className="animate-chart-draw"
          />
          {/* Inner Diagonals */}
          <line
            x1="10"
            y1="10"
            x2="290"
            y2="290"
            strokeWidth="1.5"
            className="animate-chart-draw"
          />
          <line
            x1="290"
            y1="10"
            x2="10"
            y2="290"
            strokeWidth="1.5"
            className="animate-chart-draw"
          />
          {/* Inner Diamond */}
          <polygon
            points="150,10 290,150 150,290 10,150"
            strokeWidth="2"
            strokeDasharray="4 2"
            className="animate-chart-draw"
          />
          {/* Center Glowing Mandala Circle */}
          <circle
            cx="150"
            cy="150"
            r="45"
            stroke="#F3C766"
            strokeWidth="1"
            className="animate-pulse"
          />
          <circle
            cx="150"
            cy="150"
            r="15"
            fill="#E5A93C"
            className="animate-ping opacity-40"
          />
        </svg>
      </div>

      {/* Progress Ticker */}
      <div className="mt-10 max-w-md space-y-3">
        <h2 className="font-serif text-2xl font-bold text-[#F8FAFC]">
          Precision Astronomy Computation
        </h2>
        <p className="text-sm font-semibold text-[#F3C766] transition-all duration-300 min-h-[24px]">
          {STEPS[currentStepIndex]}
        </p>

        {/* Step Progress Indicators */}
        <div className="flex items-center justify-center gap-2 pt-4">
          {STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                idx <= currentStepIndex
                  ? "w-8 bg-[#E5A93C]"
                  : "w-2 bg-white/20"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
