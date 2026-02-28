import { describe, expect, it } from "vitest";
import { CreateResponseSchema, ResponseSchema } from "./response.js";

describe("ResponseSchema", () => {
  const validResponse = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    postId: "550e8400-e29b-41d4-a716-446655440001",
    body: "This is a response",
    responderId: "550e8400-e29b-41d4-a716-446655440002",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  it("accepts a valid response", () => {
    const result = ResponseSchema.parse(validResponse);
    expect(result).toEqual(validResponse);
  });

  it("rejects empty body", () => {
    expect(() => ResponseSchema.parse({ ...validResponse, body: "" })).toThrow();
  });

  it("rejects body exceeding max length", () => {
    const longBody = "a".repeat(10001);
    expect(() => ResponseSchema.parse({ ...validResponse, body: longBody })).toThrow();
  });
});

describe("CreateResponseSchema", () => {
  it("accepts valid create response input", () => {
    const input = {
      postId: "550e8400-e29b-41d4-a716-446655440001",
      body: "Responding to the post",
    };
    const result = CreateResponseSchema.parse(input);
    expect(result).toEqual(input);
  });

  it("rejects missing postId", () => {
    expect(() => CreateResponseSchema.parse({ body: "No post ID" })).toThrow();
  });
});
