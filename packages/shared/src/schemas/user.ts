import { z } from "zod";

export const OAuthProviderSchema = z.enum(["google"]);

export const UserSchema = z.object({
  id: z.string().uuid(),
  oauthProvider: OAuthProviderSchema,
  oauthSub: z.string().min(1),
  email: z.string().email(),
  anonymousDisplayId: z.string().min(1),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CreateUserSchema = UserSchema.pick({
  oauthProvider: true,
  oauthSub: true,
  email: true,
});

export type OAuthProvider = z.infer<typeof OAuthProviderSchema>;
export type User = z.infer<typeof UserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
