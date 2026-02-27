import { z } from "zod";

export const PostStatusSchema = z.enum([
  "unconfirmed",
  "accepted",
  "in_progress",
  "on_hold",
  "resolved",
]);

export const PostCategorySchema = z.enum([
  "question",
  "request",
  "bug_report",
  "feedback",
  "other",
]);

export const PostSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
  category: PostCategorySchema,
  status: PostStatusSchema,
  authorId: z.string().uuid(),
  isPublic: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreatePostSchema = PostSchema.pick({
  title: true,
  body: true,
  category: true,
}).extend({
  isPublic: z.boolean().default(false),
});

export const UpdatePostSchema = PostSchema.pick({
  title: true,
  body: true,
  category: true,
  isPublic: true,
}).partial();

export type PostStatus = z.infer<typeof PostStatusSchema>;
export type PostCategory = z.infer<typeof PostCategorySchema>;
export type Post = z.infer<typeof PostSchema>;
export type CreatePost = z.infer<typeof CreatePostSchema>;
export type UpdatePost = z.infer<typeof UpdatePostSchema>;
