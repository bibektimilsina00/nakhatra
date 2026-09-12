// apps/web/src/components/ui/input.test.ts
import { describe, expect, it } from "vitest";
import { inputClasses } from "./input";

describe("inputClasses", () => {
  it("has a 44px minimum height", () => {
    expect(inputClasses()).toMatch(/min-h-11|h-11/);
  });

  it("uses the line-strong border by default, danger border when invalid", () => {
    expect(inputClasses()).toContain("border-line-strong");
    expect(inputClasses({ invalid: true })).toContain("border-danger");
  });

  it("never uses placeholder as the only label styling hook", () => {
    // regression guard: no placeholder:text-ink / placeholder-only styling
    expect(inputClasses()).not.toMatch(/placeholder:font-|placeholder-bold/);
  });
});
