import {
	PutCommand,
	QueryCommand,
	UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import type {
	CreatePost,
	Post,
	PostStatus,
	Response,
} from "@voice-box/shared";
import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import type {
	PostRepository,
	PostWithResponses,
} from "../post-repository.js";

export class DynamoDBPostRepository implements PostRepository {
	constructor(
		private client: DynamoDBDocumentClient,
		private tableName: string,
	) {}

	async create(input: CreatePost, authorId: string): Promise<Post> {
		const id = uuidv4();
		const now = new Date().toISOString();

		const post: Post = {
			id,
			title: input.title,
			body: input.body,
			category: input.category,
			status: "unconfirmed",
			authorId,
			isPublic: input.isPublic ?? false,
			createdAt: now,
			updatedAt: now,
		};

		await this.client.send(
			new PutCommand({
				TableName: this.tableName,
				Item: {
					PK: `POST#${id}`,
					SK: `POST#${id}`,
					type: "POST",
					...post,
					GSI1PK: "POST",
					GSI1SK: now,
					GSI2PK: "STATUS#unconfirmed",
					GSI2SK: now,
					GSI3PK: `AUTHOR#${authorId}`,
					GSI3SK: now,
				},
			}),
		);

		return post;
	}

	async findById(id: string): Promise<PostWithResponses | null> {
		const result = await this.client.send(
			new QueryCommand({
				TableName: this.tableName,
				KeyConditionExpression: "PK = :pk",
				ExpressionAttributeValues: { ":pk": `POST#${id}` },
			}),
		);

		if (!result.Items || result.Items.length === 0) {
			return null;
		}

		const postItem = result.Items.find((item) => item.type === "POST");
		if (!postItem) {
			return null;
		}

		const post = this.toPost(postItem);
		const responses = result.Items.filter(
			(item) => item.type === "RESPONSE",
		).map((item) => this.toResponse(item));

		return { ...post, responses };
	}

	async findAll(
		options: { status?: PostStatus; limit?: number } = {},
	): Promise<Post[]> {
		const { status, limit = 50 } = options;

		if (status) {
			const result = await this.client.send(
				new QueryCommand({
					TableName: this.tableName,
					IndexName: "GSI2-PostsByStatus",
					KeyConditionExpression: "GSI2PK = :status",
					ExpressionAttributeValues: {
						":status": `STATUS#${status}`,
					},
					ScanIndexForward: false,
					Limit: limit,
				}),
			);
			return (result.Items ?? []).map((item) => this.toPost(item));
		}

		const result = await this.client.send(
			new QueryCommand({
				TableName: this.tableName,
				IndexName: "GSI1-PostsByDate",
				KeyConditionExpression: "GSI1PK = :pk",
				ExpressionAttributeValues: { ":pk": "POST" },
				ScanIndexForward: false,
				Limit: limit,
			}),
		);
		return (result.Items ?? []).map((item) => this.toPost(item));
	}

	async updateStatus(id: string, status: PostStatus): Promise<void> {
		await this.client.send(
			new UpdateCommand({
				TableName: this.tableName,
				Key: { PK: `POST#${id}`, SK: `POST#${id}` },
				UpdateExpression:
					"SET #status = :newStatus, GSI2PK = :gsi2pk, updatedAt = :now",
				ExpressionAttributeNames: { "#status": "status" },
				ExpressionAttributeValues: {
					":newStatus": status,
					":gsi2pk": `STATUS#${status}`,
					":now": new Date().toISOString(),
				},
			}),
		);
	}

	private toPost(item: Record<string, unknown>): Post {
		return {
			id: item.id as string,
			title: item.title as string,
			body: item.body as string,
			category: item.category as Post["category"],
			status: item.status as Post["status"],
			authorId: item.authorId as string,
			isPublic: item.isPublic as boolean,
			createdAt: item.createdAt as string,
			updatedAt: item.updatedAt as string,
		};
	}

	private toResponse(item: Record<string, unknown>): Response {
		return {
			id: item.id as string,
			postId: item.postId as string,
			body: item.body as string,
			responderId: item.responderId as string,
			createdAt: item.createdAt as string,
			updatedAt: item.updatedAt as string,
		};
	}
}
