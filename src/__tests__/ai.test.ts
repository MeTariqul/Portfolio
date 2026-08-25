import { describe, it, expect } from "vitest";
import { stripThinkingContent } from "@/lib/ai";

describe("stripThinkingContent", () => {
  it("removes complete think blocks", () => {
    const input = `<think>
Here's my analysis...
Step 1: Analyze the message
Step 2: Generate reply
</think>

Hi Tariful,

Thank you for reaching out.

Best regards,
Samba`;
    const result = stripThinkingContent(input);
    expect(result).not.toContain("<think>");
    expect(result).not.toContain("</think>");
    expect(result).toContain("Hi Tariful,");
    expect(result).toContain("Thank you for reaching out.");
  });

  it("removes unclosed think blocks (trailing)", () => {
    const input = `<think>
Here's my analysis...
Step 1: Analyze the message`;
    const result = stripThinkingContent(input);
    expect(result).toBe("");
  });

  it("removes thinking markers", () => {
    const input = `Here's a thinking process:
1. Analyze the message
2. Generate reply

Hi Tariful,

Thank you for reaching out.`;
    const result = stripThinkingContent(input);
    expect(result).not.toContain("Here's a thinking process:");
    expect(result).toContain("Hi Tariful,");
  });

  it("removes 'Here is a thinking process:' marker", () => {
    const input = `Here is a thinking process:
Analysis of the message

Hi Tariful,`;
    const result = stripThinkingContent(input);
    expect(result).not.toContain("Here is a thinking process:");
    expect(result).toContain("Hi Tariful,");
  });

  it("removes 'Let me think about this:' marker", () => {
    const input = `Let me think about this:
The user wants to connect.

Hi Tariful,`;
    const result = stripThinkingContent(input);
    expect(result).not.toContain("Let me think about this:");
    expect(result).toContain("Hi Tariful,");
  });

  it("removes 'Analysis:' marker", () => {
    const input = `Analysis:
The message is urgent.

Hi Tariful,`;
    const result = stripThinkingContent(input);
    expect(result).not.toContain("Analysis:");
    expect(result).toContain("Hi Tariful,");
  });

  it("removes 'Chain of thought:' marker", () => {
    const input = `Chain of thought:
1. User is asking for contact
2. Should be professional

Hi Tariful,`;
    const result = stripThinkingContent(input);
    expect(result).not.toContain("Chain of thought:");
    expect(result).toContain("Hi Tariful,");
  });

  it("removes 'Reasoning:' marker", () => {
    const input = `Reasoning:
The user needs a quick response.

Hi Tariful,`;
    const result = stripThinkingContent(input);
    expect(result).not.toContain("Reasoning:");
    expect(result).toContain("Hi Tariful,");
  });

  it("removes 'Step-by-step:' marker", () => {
    const input = `Step-by-step:
1. Analyze
2. Draft

Hi Tariful,`;
    const result = stripThinkingContent(input);
    expect(result).not.toContain("Step-by-step:");
    expect(result).toContain("Hi Tariful,");
  });

  it("handles case-insensitive think tags", () => {
    const input = `THINKING
Analysis here
/THINKING

Hi Tariful,`;
    const result = stripThinkingContent(input);
    expect(result).toContain("Hi Tariful,");
  });

  it("handles multiple think blocks", () => {
    const input = `<think>First analysis</think>

Hi Tariful,

<think>Second analysis</think>

Thank you for reaching out.`;
    const result = stripThinkingContent(input);
    expect(result).not.toContain("<think>");
    expect(result).toContain("Hi Tariful,");
    expect(result).toContain("Thank you for reaching out.");
  });

  it("collapses multiple blank lines", () => {
    const input = `Hi Tariful,



Thank you for reaching out.`;
    const result = stripThinkingContent(input);
    expect(result).not.toContain("\n\n\n");
  });

  it("trims leading newlines", () => {
    const input = `

Hi Tariful,

Thank you.`;
    const result = stripThinkingContent(input);
    expect(result.startsWith("\n")).toBe(false);
  });

  it("returns empty string for pure thinking content", () => {
    const input = `<think>
All thinking, no actual content
</think>`;
    const result = stripThinkingContent(input);
    expect(result).toBe("");
  });

  it("preserves clean email content", () => {
    const input = `Hi Tariful,

Thank you for reaching out. I will ensure Md. Tariqul Islam contacts you as soon as possible.

Please let me know your preferred contact method.

Best regards,
Samba
Manager, Md. Tariqul Islam`;
    const result = stripThinkingContent(input);
    expect(result).toBe(input);
  });

  it("handles 'My approach:' marker", () => {
    const input = `My approach:
1. Greet the user
2. Address their concern

Hi Tariful,`;
    const result = stripThinkingContent(input);
    expect(result).not.toContain("My approach:");
    expect(result).toContain("Hi Tariful,");
  });

  it("handles 'Internal note:' marker", () => {
    const input = `Internal note: This is urgent
User needs immediate response.

Hi Tariful,`;
    const result = stripThinkingContent(input);
    expect(result).not.toContain("Internal note:");
    expect(result).toContain("Hi Tariful,");
  });

  it("handles empty input", () => {
    const result = stripThinkingContent("");
    expect(result).toBe("");
  });

  it("handles input with only whitespace", () => {
    const result = stripThinkingContent("   \n\n   ");
    expect(result).toBe("");
  });
});
