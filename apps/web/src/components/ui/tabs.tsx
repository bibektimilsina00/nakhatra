// apps/web/src/components/ui/tabs.tsx
export function tabClasses(active: boolean): string {
  return [
    "inline-flex items-center min-h-11 border-b-2 px-1 pb-2 text-sm transition-colors duration-200",
    active ? "border-accent text-ink font-medium" : "border-transparent text-muted",
  ].join(" ");
}

export interface TabItem {
  value: string;
  label: string;
}

export function Tabs({
  items,
  value,
  onChange,
}: {
  items: TabItem[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div role="tablist" className="flex gap-6 border-b border-line">
      {items.map((item) => (
        <button
          key={item.value}
          role="tab"
          type="button"
          aria-selected={item.value === value}
          className={tabClasses(item.value === value)}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
