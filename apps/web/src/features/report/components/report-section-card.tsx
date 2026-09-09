import { MapPin } from "lucide-react";

import { SectionIcon } from "@/features/report/components/section-icon";
import type { ReportSection } from "@/features/report/types";

/**
 * One section of a reading: what it says, and the placements it rests on.
 *
 * Presentational — it receives a section and renders it. The footnote buttons
 * report which placement was clicked; deciding what that does is the caller's.
 */
export function ReportSectionCard({
  section,
  isHighlighted = false,
  footnotesLabel,
  onPlacementClick,
}: {
  section: ReportSection;
  isHighlighted?: boolean;
  footnotesLabel: string;
  onPlacementClick?: (placement: string) => void;
}) {
  return (
    <div
      className={`rounded-[8px] border border-brd bg-panel p-6 space-y-4 transition-all duration-200 ${
        isHighlighted ? "border-l-4 border-l-[#E5A93C]" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-[8px] bg-inset border border-brd">
          <SectionIcon sectionId={section.id} />
        </span>
        <div>
          <h3 className="font-serif text-base font-bold text-fg">{section.title}</h3>
          <p className="text-xs text-mid">{section.subtitle}</p>
        </div>
      </div>

      <div className="space-y-3 text-sm leading-relaxed text-mid font-sans">
        {section.content.map((paragraph, idx) => (
          <p key={idx}>{paragraph}</p>
        ))}
      </div>

      <div className="rounded-[8px] border border-acc/40 bg-inset p-3 text-xs font-bold text-[#FDE68A]">
        {section.summary}
      </div>

      {/* Every claim shows the placement it came from. This is the difference
          between a reading and a horoscope, so it is not optional chrome. */}
      <div className="border-t border-brd pt-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-acc mb-1.5">
          {footnotesLabel}
        </p>
        <div className="flex flex-wrap gap-2">
          {section.reasoning.map((reason, idx) => (
            <button
              key={idx}
              onClick={() => onPlacementClick?.(reason.placement)}
              className="inline-flex items-center gap-1.5 rounded-[8px] border border-brd bg-inset px-2.5 py-1 text-xs text-fg hover:border-acc transition"
            >
              <MapPin className="size-3.5 text-[#6366F1]" />
              <span>{reason.placement}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
