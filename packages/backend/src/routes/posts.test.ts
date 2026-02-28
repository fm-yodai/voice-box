import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Repositories } from "../repositories/index.js";
import { posts } from "./posts.js";

type Env = { Variables: { repositories: Repositories } };

function createApp(repos: Repositories) {
  const app = new Hono<Env>();
  app.use("*", async (c, next) => {
    c.set("repositories", repos);
    await next();
  });
  app.route("/", posts);
  return app;
}

function createMockRepos(): Repositories {
  return {
    posts: {
      create: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      updateStatus: vi.fn(),
    },
    responses: {
      create: vi.fn(),
      findByPostId: vi.fn(),
    },
    users: {
      create: vi.fn(),
      findById: vi.fn(),
      findByOAuthSub: vi.fn(),
    },
  };
}

const samplePost = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  title: "Test Post",
  body: "Test body content",
  category: "question" as const,
  status: "unconfirmed" as const,
  authorId: "00000000-0000-0000-0000-000000000000",
  isPublic: false,
  createdAt: "2026-02-28T10:00:00.000Z",
  updatedAt: "2026-02-28T10:00:00.000Z",
};

describe("POST /posts", () => {
  let repos: Repositories;
  let app: Hono<Env>;

  beforeEach(() => {
    repos = createMockRepos();
    app = createApp(repos);
  });

  it("creates a post and returns 201", async () => {
    vi.mocked(repos.posts.create).mockResolvedValue(samplePost);

    const res = await app.request("/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Test Post",
        body: "Test body content",
        category: "question",
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe(samplePost.id);
    expect(repos.posts.create).toHaveBeenCalledOnce();
  });

  it("returns 400 for invalid body", async () => {
    const res = await app.request("/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "" }),
    });

    expect(res.status).toBe(400);
  });
});

describe("GET /posts", () => {
  let repos: Repositories;
  let app: Hono<Env>;

  beforeEach(() => {
    repos = createMockRepos();
    app = createApp(repos);
  });

  it("returns a list of posts", async () => {
    vi.mocked(repos.posts.findAll).mockResolvedValue([samplePost]);

    const res = await app.request("/posts");

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].id).toBe(samplePost.id);
  });

  it("passes status filter to repository", async () => {
    vi.mocked(repos.posts.findAll).mockResolvedValue([]);

    await app.request("/posts?status=accepted");

    expect(repos.posts.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ status: "accepted" })
    );
  });

  it("returns 400 for invalid status", async () => {
    const res = await app.request("/posts?status=invalid");
    expect(res.status).toBe(400);
  });
});

describe("GET /posts/:id", () => {
  let repos: Repositories;
  let app: Hono<Env>;

  beforeEach(() => {
    repos = createMockRepos();
    app = createApp(repos);
  });

  it("returns a post with responses", async () => {
    vi.mocked(repos.posts.findById).mockResolvedValue({
      ...samplePost,
      responses: [],
    });

    const res = await app.request(`/posts/${samplePost.id}`);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(samplePost.id);
    expect(body.responses).toEqual([]);
  });

  it("returns 404 when post not found", async () => {
    vi.mocked(repos.posts.findById).mockResolvedValue(null);

    const res = await app.request("/posts/nonexistent-id");

    expect(res.status).toBe(404);
  });
});

describe("PATCH /posts/:id/status", () => {
  let repos: Repositories;
  let app: Hono<Env>;

  beforeEach(() => {
    repos = createMockRepos();
    app = createApp(repos);
  });

  it("updates status and returns 200", async () => {
    vi.mocked(repos.posts.findById).mockResolvedValue({
      ...samplePost,
      responses: [],
    });

    const res = await app.request(`/posts/${samplePost.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "accepted" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("accepted");
    expect(repos.posts.updateStatus).toHaveBeenCalledWith(samplePost.id, "accepted");
  });

  it("returns 404 when post not found", async () => {
    vi.mocked(repos.posts.findById).mockResolvedValue(null);

    const res = await app.request(`/posts/${samplePost.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "accepted" }),
    });

    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid status", async () => {
    const res = await app.request(`/posts/${samplePost.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "invalid" }),
    });

    expect(res.status).toBe(400);
  });
});
