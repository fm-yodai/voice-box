import { z } from "zod";

export const ResponseSchema = z.object({
  id: z.string().uuid(),
  postId: z.string().uuid(),
  body: z.string().min(1).max(10000),
  responderId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateResponseSchema = ResponseSchema.pick({
  postId: true,
  body: true,
});

export type Response = z.infer<typeof ResponseSchema>;
export type CreateResponse = z.infer<typeof CreateResponseSchema>;
