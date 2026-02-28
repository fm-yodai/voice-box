import { CreateResponseSchema } from "@voice-box/shared";
import { Hono } from "hono";
import type { Repositories } from "../repositories/index.js";

type Env = { Variables: { repositories: Repositories } };

const responses = new Hono<Env>();

responses.post("/posts/:postId/responses", async (c) => {
  const postId = c.req.param("postId");
  const body = await c.req.json();

  const parsed = CreateResponseSchema.safeParse({ ...body, postId });
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const { posts: postRepo, responses: responseRepo } = c.get("repositories");

  const post = await postRepo.findById(postId);
  if (!post) {
    return c.json({ error: "Post not found" }, 404);
  }

  // TODO: 認証実装後に実際のユーザーIDを取得する
  const responderId = "00000000-0000-0000-0000-000000000000";

  const response = await responseRepo.create(parsed.data, responderId);
  return c.json(response, 201);
});

export { responses };
