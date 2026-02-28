import type {
	CreatePost,
	Post,
	PostStatus,
	Response,
} from "@voice-box/shared";

export type PostWithResponses = Post & { responses: Response[] };

export interface PostRepository {
	create(post: CreatePost, authorId: string): Promise<Post>;
	findById(id: string): Promise<PostWithResponses | null>;
	findAll(options?: {
		status?: PostStatus;
		limit?: number;
	}): Promise<Post[]>;
	updateStatus(id: string, status: PostStatus): Promise<void>;
}
