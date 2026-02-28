import { describe, expect, it } from "vitest";
import {
  CreatePostSchema,
  PostCategorySchema,
  PostSchema,
  PostStatusSchema,
  UpdatePostSchema,
} from "./post.js";

describe("PostStatusSchema", () => {
  it("accepts valid statuses", () => {
    const statuses = ["unconfirmed", "accepted", "in_progress", "on_hold", "resolved"];
    for (const status of statuses) {
      expect(PostStatusSchema.parse(status)).toBe(status);
    }
  });

  it("rejects invalid status", () => {
    expect(() => PostStatusSchema.parse("invalid")).toThrow();
  });
});

describe("PostCategorySchema", () => {
  it("accepts valid categories", () => {
    const categories = ["question", "request", "bug_report", "feedback", "other"];
    for (const category of categories) {
      expect(PostCategorySchema.parse(category)).toBe(category);
    }
  });

  it("rejects invalid category", () => {
    expect(() => PostCategorySchema.parse("unknown")).toThrow();
  });
});

describe("PostSchema", () => {
  const validPost = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    title: "Test post",
    body: "Test body content",
    category: "question",
    status: "unconfirmed",
    authorId: "550e8400-e29b-41d4-a716-446655440001",
    isPublic: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  it("accepts a valid post", () => {
    const result = PostSchema.parse(validPost);
    expect(result).toEqual(validPost);
  });

  it("rejects a post with missing title", () => {
    const { title: _, ...noTitle } = validPost;
    expect(() => PostSchema.parse(noTitle)).toThrow();
  });

  it("rejects a post with invalid UUID for id", () => {
    expect(() => PostSchema.parse({ ...validPost, id: "not-a-uuid" })).toThrow();
  });
});

describe("CreatePostSchema", () => {
  it("accepts valid create post input", () => {
    const input = {
      title: "New post",
      body: "Body content",
      category: "feedback",
    };
    const result = CreatePostSchema.parse(input);
    expect(result.title).toBe("New post");
    expect(result.isPublic).toBe(false);
  });

  it("allows overriding isPublic", () => {
    const input = {
      title: "New post",
      body: "Body content",
      category: "feedback",
      isPublic: true,
    };
    const result = CreatePostSchema.parse(input);
    expect(result.isPublic).toBe(true);
  });

  it("rejects empty title", () => {
    const input = {
      title: "",
      body: "Body content",
      category: "feedback",
    };
    expect(() => CreatePostSchema.parse(input)).toThrow();
  });
});

describe("UpdatePostSchema", () => {
  it("accepts partial updates", () => {
    const result = UpdatePostSchema.parse({ title: "Updated" });
    expect(result.title).toBe("Updated");
  });

  it("accepts empty object", () => {
    const result = UpdatePostSchema.parse({});
    expect(result).toEqual({});
  });
});
