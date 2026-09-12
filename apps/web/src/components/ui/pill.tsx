// apps/web/src/components/ui/pill.tsx
export type PillTone = "success" | "neutral";

const TONE: Record<PillTone, string> = {
  success: "bg-success text-white",
  neutral: "bg-accent-tint text-ink",
};

export function pillClasses(tone: PillTone): string {
  return `inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE[tone]}`;
}

export function Pill({ tone, children }: { tone: PillTone; children: React.ReactNode }) {
  return <span className={pillClasses(tone)}>{children}</span>;
}
