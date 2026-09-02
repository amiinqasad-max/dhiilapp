import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, signSessionToken, verifySessionToken } from "@/lib/auth";

describe("password hashing", () => {
  it("hashes and verifies a correct password", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash).not.toBe("correct horse battery staple");
    expect(await verifyPassword("correct horse battery staple", hash)).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(await verifyPassword("wrong password", hash)).toBe(false);
  });
});

describe("session tokens", () => {
  it("round-trips a valid token", () => {
    const token = signSessionToken({ sub: "user-123", role: "CLIENT" });
    const payload = verifySessionToken(token);
    expect(payload).toEqual({ sub: "user-123", role: "CLIENT" });
  });

  it("rejects a tampered token", () => {
    const token = signSessionToken({ sub: "user-123", role: "CLIENT" });
    const tampered = token.slice(0, -2) + "xx";
    expect(verifySessionToken(tampered)).toBeNull();
  });

  it("rejects garbage input", () => {
    expect(verifySessionToken("not.a.token")).toBeNull();
  });
});
