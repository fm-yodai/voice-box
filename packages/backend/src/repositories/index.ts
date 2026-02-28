import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBPostRepository } from "./dynamodb/post-repository.js";
import { DynamoDBResponseRepository } from "./dynamodb/response-repository.js";
import { DynamoDBUserRepository } from "./dynamodb/user-repository.js";
import type { PostRepository } from "./post-repository.js";
import type { ResponseRepository } from "./response-repository.js";
import type { UserRepository } from "./user-repository.js";

export type { PostRepository, PostWithResponses } from "./post-repository.js";
export type { ResponseRepository } from "./response-repository.js";
export type { UserRepository } from "./user-repository.js";

export interface Repositories {
	posts: PostRepository;
	responses: ResponseRepository;
	users: UserRepository;
}

export function createRepositories(
	client: DynamoDBDocumentClient,
	tableName: string,
): Repositories {
	return {
		posts: new DynamoDBPostRepository(client, tableName),
		responses: new DynamoDBResponseRepository(client, tableName),
		users: new DynamoDBUserRepository(client, tableName),
	};
}
