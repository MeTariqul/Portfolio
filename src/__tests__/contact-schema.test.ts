import { describe, it, expect } from "vitest";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2, "Please tell me your name"),
  email: z.string().email("Enter a valid email address"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

describe("Contact form schema", () => {
  describe("valid inputs", () => {
    it("passes with valid name, email, and message", () => {
      const result = contactSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        message: "Hello, I have a project inquiry.",
      });
      expect(result.success).toBe(true);
    });

    it("passes with a long message", () => {
      const result = contactSchema.safeParse({
        name: "Jane Smith",
        email: "jane@company.org",
        message: "A".repeat(500),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("invalid inputs", () => {
    it("rejects empty name", () => {
      const result = contactSchema.safeParse({
        name: "",
        email: "john@example.com",
        message: "Hello, I have a project inquiry.",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Please tell me your name");
      }
    });

    it("rejects single character name", () => {
      const result = contactSchema.safeParse({
        name: "J",
        email: "john@example.com",
        message: "Hello, I have a project inquiry.",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid email format", () => {
      const result = contactSchema.safeParse({
        name: "John Doe",
        email: "not-an-email",
        message: "Hello, I have a project inquiry.",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Enter a valid email address");
      }
    });

    it("rejects email without @ symbol", () => {
      const result = contactSchema.safeParse({
        name: "John Doe",
        email: "johnexample.com",
        message: "Hello, I have a project inquiry.",
      });
      expect(result.success).toBe(false);
    });

    it("rejects email without domain", () => {
      const result = contactSchema.safeParse({
        name: "John Doe",
        email: "john@",
        message: "Hello, I have a project inquiry.",
      });
      expect(result.success).toBe(false);
    });

    it("rejects short message", () => {
      const result = contactSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        message: "Hi",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Message must be at least 10 characters");
      }
    });

    it("rejects empty message", () => {
      const result = contactSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        message: "",
      });
      expect(result.success).toBe(false);
    });

    it("passes with message containing only spaces (10+ chars)", () => {
      const result = contactSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        message: "          ",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("passes with exactly 2 character name", () => {
      const result = contactSchema.safeParse({
        name: "Jo",
        email: "john@example.com",
        message: "Hello, I have a project inquiry.",
      });
      expect(result.success).toBe(true);
    });

    it("passes with exactly 10 character message", () => {
      const result = contactSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        message: "A".repeat(10),
      });
      expect(result.success).toBe(true);
    });

    it("rejects message with 9 characters", () => {
      const result = contactSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        message: "A".repeat(9),
      });
      expect(result.success).toBe(false);
    });

    it("passes with email containing subdomains", () => {
      const result = contactSchema.safeParse({
        name: "John Doe",
        email: "john@mail.example.com",
        message: "Hello, I have a project inquiry.",
      });
      expect(result.success).toBe(true);
    });

    it("passes with email containing plus sign", () => {
      const result = contactSchema.safeParse({
        name: "John Doe",
        email: "john+test@example.com",
        message: "Hello, I have a project inquiry.",
      });
      expect(result.success).toBe(true);
    });
  });
});
