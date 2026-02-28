import type { CreateUser, User } from "@voice-box/shared";

export interface UserRepository {
  create(input: CreateUser): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByOAuthSub(provider: string, sub: string): Promise<User | null>;
}
