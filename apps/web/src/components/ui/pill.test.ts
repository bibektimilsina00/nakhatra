// apps/web/src/components/ui/pill.test.ts
import { describe, expect, it } from "vitest";
import { pillClasses } from "./pill";

describe("pillClasses", () => {
  it("success tone is the success fill with white text, fully rounded", () => {
    const c = pillClasses("success");
    expect(c).toContain("bg-success");
    expect(c).toContain("text-white");
    expect(c).toContain("rounded-full");
  });

  it("neutral tone uses the tinted surface, not the brand accent", () => {
    const c = pillClasses("neutral");
    expect(c).toContain("bg-accent-tint");
    expect(c).toContain("text-ink");
  });
});
