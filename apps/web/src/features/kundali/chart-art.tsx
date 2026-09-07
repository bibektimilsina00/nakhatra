/**
 * The colour a saved chart is drawn in.
 *
 * A hue derived from the chart's id, so a chart always looks the same wherever
 * it appears — the dashboard grid, the Milan picker — and neighbours rarely
 * collide. Flat rather than a gradient: the colour has exactly one job, which
 * is helping you find the right row.
 *
 * Not the real chart. Drawing that would mean recalculating every card on every
 * load, which is nine ephemeris calls to decorate a grid.
 */
export function chartArt(id: string): { fill: string; stroke: string } {
  // FNV-1a: spreads adjacent ids around the wheel instead of clustering them
  // the way a sum of char codes does.
  let hash = 0x811c9dc5;
  for (const char of id) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  const hue = hash % 360;
  return {
    fill: `hsl(${hue} 34% 30%)`,
    // Pre-darkened rather than ink at low alpha, so the lattice is one solid
    // colour instead of a composite that shifts with whatever sits behind it.
    stroke: `hsl(${hue} 38% 19%)`,
  };
}

/** The north-Indian lattice, as card art. */
export function ChartLattice({ stroke, className }: { stroke: string; className: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" stroke={stroke} strokeWidth="1.6">
      <rect x="4" y="4" width="92" height="92" rx="2" />
      <path d="M50 4 L96 50 L50 96 L4 50 Z" />
      <path d="M4 4 L96 96 M96 4 L4 96" />
    </svg>
  );
}
