import { describe, it, expect } from "vitest";
import { registerSchema, jobCreateSchema, applicationCreateSchema } from "@/lib/validation";

describe("registerSchema", () => {
  it("accepts a valid registration payload", () => {
    const result = registerSchema.safeParse({
      email: "Test@Example.com",
      password: "password123",
      name: "Test User",
      role: "CLIENT",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("test@example.com"); // normalized
  });

  it("rejects a short password", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "short",
      name: "Test User",
      role: "CLIENT",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid role", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "password123",
      name: "Test User",
      role: "ADMIN",
    });
    expect(result.success).toBe(false);
  });
});

describe("jobCreateSchema", () => {
  it("accepts a valid job", () => {
    const result = jobCreateSchema.safeParse({
      title: "Design a logo",
      description: "Need a clean modern logo for my new business, please.",
      category: "Design",
      budget: 100,
      budgetType: "FIXED",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a non-positive budget", () => {
    const result = jobCreateSchema.safeParse({
      title: "Design a logo",
      description: "Need a clean modern logo for my new business, please.",
      category: "Design",
      budget: -10,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a too-short description", () => {
    const result = jobCreateSchema.safeParse({
      title: "Design a logo",
      description: "short",
      category: "Design",
      budget: 100,
    });
    expect(result.success).toBe(false);
  });
});

describe("applicationCreateSchema", () => {
  it("accepts a valid application", () => {
    const result = applicationCreateSchema.safeParse({
      coverLetter: "I would love to help with this project, here is why.",
      proposedPrice: 100,
      deliveryTime: "3 days",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a non-positive proposed price", () => {
    const result = applicationCreateSchema.safeParse({
      coverLetter: "I would love to help with this project, here is why.",
      proposedPrice: 0,
      deliveryTime: "3 days",
    });
    expect(result.success).toBe(false);
  });
});
