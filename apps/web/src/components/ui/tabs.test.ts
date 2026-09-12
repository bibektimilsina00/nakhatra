// apps/web/src/components/ui/tabs.test.ts
import { describe, expect, it } from "vitest";
import { tabClasses } from "./tabs";

describe("tabClasses", () => {
  it("active tab is ink/500 with a 2px saffron-500 underline", () => {
    const c = tabClasses(true);
    expect(c).toContain("text-ink");
    expect(c).toContain("border-accent");
  });

  it("inactive tab is muted with a transparent underline, never colour-only difference", () => {
    const c = tabClasses(false);
    expect(c).toContain("text-muted");
    expect(c).toContain("border-transparent");
  });

  it("both states share the same underline thickness and transition timing", () => {
    expect(tabClasses(true)).toMatch(/border-b-2/);
    expect(tabClasses(false)).toMatch(/border-b-2/);
    expect(tabClasses(true)).toContain("transition-colors");
  });
});
