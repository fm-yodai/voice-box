import type { CreateResponse, Response } from "@voice-box/shared";

export interface ResponseRepository {
  create(input: CreateResponse, responderId: string): Promise<Response>;
  findByPostId(postId: string): Promise<Response[]>;
}
