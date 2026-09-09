/**
 * The Nakhatra mark: a North Indian birth chart reduced to its essential
 * geometry — the square, the inscribed diamond, and the two diagonals that
 * divide it into twelve houses. The filled quadrilateral at the top is the
 * first house: the lagna, the ascendant.
 *
 * Uses `currentColor`, so it takes the colour of whatever it sits in.
 *
 * Stroke width is 3.2 rather than the 2.6 the mark is drawn at, because stroke
 * scales with the viewBox: at the 28px the footer uses, 2.6 lands on 0.73
 * device pixels and renders blurred. 3.2 keeps every size from 28px up at or
 * near a full pixel.
 *
 * Below ~24px use `public/favicon.svg` instead, which drops the diagonals.
 */
export function NakhatraMark({
  className = "size-9 text-acc",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="Nakhatra"
      fill="none"
      stroke="currentColor"
    >
      <g strokeWidth="3.2" strokeLinejoin="round">
        <rect x="12" y="12" width="76" height="76" rx="1.5" />
        <path d="M50 12 L88 50 L50 88 L12 50 Z" />
        <path d="M12 12 L88 88 M88 12 L12 88" strokeWidth="2" opacity="0.55" />
      </g>
      <path d="M50 12 L69 31 L50 50 L31 31 Z" fill="currentColor" stroke="none" />
    </svg>
  );
}
