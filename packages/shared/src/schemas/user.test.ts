import { describe, expect, it } from "vitest";
import { CreateUserSchema, OAuthProviderSchema, UserSchema } from "./user.js";

describe("OAuthProviderSchema", () => {
  it("accepts 'google'", () => {
    expect(OAuthProviderSchema.parse("google")).toBe("google");
  });

  it("rejects unsupported provider", () => {
    expect(() => OAuthProviderSchema.parse("github")).toThrow();
  });
});

describe("UserSchema", () => {
  const validUser = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    oauthProvider: "google",
    oauthSub: "sub-123456",
    email: "test@example.com",
    anonymousDisplayId: "anon-abc",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  it("accepts a valid user", () => {
    const result = UserSchema.parse(validUser);
    expect(result.email).toBe("test@example.com");
  });

  it("coerces date strings to Date objects", () => {
    const result = UserSchema.parse(validUser);
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it("rejects invalid email", () => {
    expect(() => UserSchema.parse({ ...validUser, email: "not-an-email" })).toThrow();
  });
});

describe("CreateUserSchema", () => {
  it("accepts valid create user input", () => {
    const input = {
      oauthProvider: "google",
      oauthSub: "sub-123456",
      email: "test@example.com",
    };
    const result = CreateUserSchema.parse(input);
    expect(result).toEqual(input);
  });

  it("rejects empty oauthSub", () => {
    const input = {
      oauthProvider: "google",
      oauthSub: "",
      email: "test@example.com",
    };
    expect(() => CreateUserSchema.parse(input)).toThrow();
  });
});
