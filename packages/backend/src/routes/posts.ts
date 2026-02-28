import { Hono } from "hono";
import {
	CreatePostSchema,
	PostStatusSchema,
	type PostStatus,
} from "@voice-box/shared";
import type { Repositories } from "../repositories/index.js";

type Env = { Variables: { repositories: Repositories } };

const posts = new Hono<Env>();

posts.post("/posts", async (c) => {
	const body = await c.req.json();
	const parsed = CreatePostSchema.safeParse(body);
	if (!parsed.success) {
		return c.json({ error: parsed.error.flatten() }, 400);
	}

	// TODO: 認証実装後に実際のユーザーIDを取得する
	const authorId = "00000000-0000-0000-0000-000000000000";

	const { posts: postRepo } = c.get("repositories");
	const post = await postRepo.create(parsed.data, authorId);
	return c.json(post, 201);
});

posts.get("/posts", async (c) => {
	const status = c.req.query("status");
	const limit = c.req.query("limit");

	const options: { status?: PostStatus; limit?: number } = {};
	if (status) {
		const parsed = PostStatusSchema.safeParse(status);
		if (!parsed.success) {
			return c.json({ error: "Invalid status" }, 400);
		}
		options.status = parsed.data;
	}
	if (limit) {
		const num = Number(limit);
		if (Number.isNaN(num) || num < 1) {
			return c.json({ error: "Invalid limit" }, 400);
		}
		options.limit = num;
	}

	const { posts: postRepo } = c.get("repositories");
	const result = await postRepo.findAll(options);
	return c.json(result);
});

posts.get("/posts/:id", async (c) => {
	const id = c.req.param("id");
	const { posts: postRepo } = c.get("repositories");
	const post = await postRepo.findById(id);
	if (!post) {
		return c.json({ error: "Post not found" }, 404);
	}
	return c.json(post);
});

posts.patch("/posts/:id/status", async (c) => {
	const id = c.req.param("id");
	const body = await c.req.json();
	const parsed = PostStatusSchema.safeParse(body.status);
	if (!parsed.success) {
		return c.json({ error: "Invalid status" }, 400);
	}

	const { posts: postRepo } = c.get("repositories");

	const existing = await postRepo.findById(id);
	if (!existing) {
		return c.json({ error: "Post not found" }, 404);
	}

	await postRepo.updateStatus(id, parsed.data);
	return c.json({ id, status: parsed.data });
});

export { posts };
