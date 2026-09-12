// apps/web/src/components/ui/button.test.ts
import { describe, expect, it } from "vitest";
import { buttonClasses } from "./button";

describe("buttonClasses", () => {
  it("fills primary with the button-safe accent step and white text", () => {
    expect(buttonClasses("primary")).toContain("bg-accent-strong");
    expect(buttonClasses("primary")).toContain("text-white");
  });

  it("never pairs the brand accent fill with white text", () => {
    // saffron-500 (bg-accent) fails AA with white text — only saffron-700
    // (bg-accent-strong) is allowed to carry it (design.md §2.2).
    expect(buttonClasses("primary")).not.toContain("bg-accent ");
  });

  it("gives every variant a 44px minimum touch target", () => {
    for (const v of ["primary", "secondary", "ghost", "danger"] as const) {
      expect(buttonClasses(v)).toMatch(/min-h-11|h-11/); // 44px = h-11 in Tailwind's 4px scale
    }
  });

  it("disabled state removes pointer events, not just opacity", () => {
    expect(buttonClasses("primary")).toContain("disabled:pointer-events-none");
    expect(buttonClasses("primary")).toContain("disabled:opacity-40");
  });

  it("appends a caller className without dropping the base classes", () => {
    const classes = buttonClasses("secondary", { className: "w-full" });
    expect(classes).toContain("w-full");
    expect(classes).toContain("border-line-strong");
  });

  it("ghost text uses saffron-800 (AA on cream), not saffron-700", () => {
    // saffron-700 (text-accent-strong) measures 4.38:1 on cream — below the
    // 4.5:1 AA threshold for body text; saffron-800 (text-accent-ink) is
    // 6.63:1 (design.md §5 Ghost).
    expect(buttonClasses("ghost")).toContain("text-accent-ink");
  });
});
