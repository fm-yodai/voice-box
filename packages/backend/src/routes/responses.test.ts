import { beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import type { Repositories } from "../repositories/index.js";
import { responses } from "./responses.js";

type Env = { Variables: { repositories: Repositories } };

function createApp(repos: Repositories) {
	const app = new Hono<Env>();
	app.use("*", async (c, next) => {
		c.set("repositories", repos);
		await next();
	});
	app.route("/", responses);
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

const postId = "550e8400-e29b-41d4-a716-446655440000";

const samplePost = {
	id: postId,
	title: "Test",
	body: "Test body",
	category: "question" as const,
	status: "unconfirmed" as const,
	authorId: "00000000-0000-0000-0000-000000000000",
	isPublic: false,
	createdAt: "2026-02-28T10:00:00.000Z",
	updatedAt: "2026-02-28T10:00:00.000Z",
	responses: [],
};

const sampleResponse = {
	id: "res-id-001",
	postId,
	body: "Response body",
	responderId: "00000000-0000-0000-0000-000000000000",
	createdAt: "2026-02-28T12:00:00.000Z",
	updatedAt: "2026-02-28T12:00:00.000Z",
};

describe("POST /posts/:postId/responses", () => {
	let repos: Repositories;
	let app: Hono<Env>;

	beforeEach(() => {
		repos = createMockRepos();
		app = createApp(repos);
	});

	it("creates a response and returns 201", async () => {
		vi.mocked(repos.posts.findById).mockResolvedValue(samplePost);
		vi.mocked(repos.responses.create).mockResolvedValue(sampleResponse);

		const res = await app.request(`/posts/${postId}/responses`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ body: "Response body" }),
		});

		expect(res.status).toBe(201);
		const body = await res.json();
		expect(body.id).toBe(sampleResponse.id);
		expect(body.postId).toBe(postId);
	});

	it("returns 404 when post not found", async () => {
		vi.mocked(repos.posts.findById).mockResolvedValue(null);

		const res = await app.request(`/posts/${postId}/responses`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ body: "Response body" }),
		});

		expect(res.status).toBe(404);
	});

	it("returns 400 for invalid body", async () => {
		const res = await app.request(`/posts/${postId}/responses`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ body: "" }),
		});

		expect(res.status).toBe(400);
	});
});
