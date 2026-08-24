import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn() utility", () => {
  it("merges class names", () => {
    const result = cn("text-red-500", "text-blue-500");
    expect(result).toBe("text-blue-500");
  });

  it("handles conditional classes", () => {
    const result = cn("base", false && "hidden", true && "visible");
    expect(result).toContain("base");
    expect(result).toContain("visible");
    expect(result).not.toContain("hidden");
  });

  it("handles undefined and null", () => {
    const result = cn("base", undefined, null);
    expect(result).toBe("base");
  });

  it("handles empty input", () => {
    const result = cn();
    expect(result).toBe("");
  });

  it("merges tailwind-merge compatible classes", () => {
    const result = cn("px-4", "px-8");
    expect(result).toBe("px-8");
  });

  it("handles array inputs", () => {
    const result = cn(["text-sm", "text-lg"]);
    expect(result).toBe("text-lg");
  });

  it("handles object inputs", () => {
    const result = cn({
      "text-red-500": true,
      "text-blue-500": false,
    });
    expect(result).toBe("text-red-500");
  });
});
