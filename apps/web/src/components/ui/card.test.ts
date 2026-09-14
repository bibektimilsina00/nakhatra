// apps/web/src/components/ui/card.test.ts
import { describe, expect, it } from "vitest";
import { cardClasses } from "./card";

describe("cardClasses", () => {
  it("defaults to a flat surface card with a hairline border, no shadow", () => {
    const c = cardClasses();
    expect(c).toContain("bg-surface");
    expect(c).toContain("border-line-strong");
    expect(c).not.toMatch(/shadow-/);
  });

  it("uses radius-lg (rounded-lg) per the design system, never an arbitrary radius", () => {
    expect(cardClasses()).toContain("rounded-lg");
  });

  it("a tinted category card uses the accent tint fill with ink text, not the brand fill", () => {
    const c = cardClasses({ tinted: true });
    expect(c).toContain("bg-accent-tint");
    expect(c).toContain("text-ink");
  });

  it("appends a caller className without dropping the base classes", () => {
    const c = cardClasses({ className: "p-6" });
    expect(c).toContain("p-6");
    expect(c).toContain("bg-surface");
  });
});
