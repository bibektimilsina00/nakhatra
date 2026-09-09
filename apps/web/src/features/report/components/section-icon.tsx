import {
  Briefcase,
  Clock,
  Compass,
  Heart,
  Scale,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";

/**
 * The icon for a report section id.
 *
 * A lookup rather than a switch: the section ids come from the backend's
 * `SECTION_IDS`, and a map makes an unhandled one obvious instead of silently
 * falling through to the default.
 */
const ICONS: Record<string, typeof User> = {
  personality: User,
  "strengths-weaknesses": Scale,
  "career-finance": Briefcase,
  "love-marriage": Heart,
  "travel-spirituality": Compass,
  "current-dasha": Clock,
  remedies: ShieldCheck,
};

export function SectionIcon({ sectionId, className = "size-5 text-acc" }: {
  sectionId: string;
  className?: string;
}) {
  const Icon = ICONS[sectionId] ?? Sparkles;
  return <Icon className={className} />;
}
