import { MapPin } from "lucide-react";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";

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

      {/* The model writes markdown — bold placements, the odd list — so the
          paragraphs are rendered, not printed. They used to go through a bare
          <p>, which showed the asterisks to the reader. Joined with blank
          lines so each stays its own paragraph. */}
      <div className="font-sans">
        <MarkdownRenderer content={section.content.join("\n\n")} />
      </div>

      <div className="rounded-[8px] border border-acc/40 bg-inset p-3 text-xs font-bold text-acc2">
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
