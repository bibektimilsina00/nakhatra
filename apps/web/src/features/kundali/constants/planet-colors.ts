/**
 * Real-world astronomical illustration colors for Vedic planets (grahas).
 * Mars is red because Mars is red — these are independent of site theme
 * and consumed as raw JS strings for Three.js and canvas APIs.
 */

export const PLANET_COLORS: Record<string, string> = {
  Sun: "rgb(255, 179, 71)",
  Moon: "rgb(232, 236, 244)",
  Mars: "rgb(255, 107, 90)",
  Mercury: "rgb(126, 217, 87)",
  Jupiter: "rgb(243, 199, 102)",
  Venus: "rgb(247, 200, 224)",
  Saturn: "rgb(122, 156, 198)",
  Rahu: "rgb(139, 123, 199)",
  Ketu: "rgb(199, 123, 88)",
};

/** Fallback color when a planet's name is not found in PLANET_COLORS. */
export const PLANET_FALLBACK_COLOR = "rgb(248, 250, 252)";
export const DEFAULT_PLANET_COLOR = PLANET_FALLBACK_COLOR;

/** Radial gradient colors for Rahu & Ketu (nodes without texture maps). */
export const RAHU_GRADIENT_COLOR = PLANET_COLORS.Rahu;
export const KETU_GRADIENT_COLOR = PLANET_COLORS.Ketu;
export const RAHU_COLOR = PLANET_COLORS.Rahu;
export const KETU_COLOR = PLANET_COLORS.Ketu;

export const RAHU_GRADIENT_STOP = "rgb(20, 16, 38)";
export const KETU_GRADIENT_STOP = "rgb(28, 15, 8)";

/**
 * Decorative celestial gold (RGB: 229, 169, 60 / #e5a93c) used across the 3D
 * birth sky scene for aspect lines, ecliptic glow gradients, and label pill
 * outlines. Independent of the 2D UI brand token system.
 */
export const ASPECT_LINE_COLOR = "rgb(229, 169, 60)";
export const ASPECT_LINE_FALLBACK_COLOR = ASPECT_LINE_COLOR;

/**
 * Returns the decorative celestial gold formatted with an alpha channel.
 * Calling without arguments returns the opaque rgb string.
 */
export function aspectLineColor(alpha?: number): string {
  return alpha !== undefined
    ? `rgba(229, 169, 60, ${alpha})`
    : ASPECT_LINE_COLOR;
}

