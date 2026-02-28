import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { CreateResponse, Response } from "@voice-box/shared";
import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import type { ResponseRepository } from "../response-repository.js";

export class DynamoDBResponseRepository implements ResponseRepository {
	constructor(
		private client: DynamoDBDocumentClient,
		private tableName: string,
	) {}

	async create(
		input: CreateResponse,
		responderId: string,
	): Promise<Response> {
		const id = uuidv4();
		const now = new Date().toISOString();

		const response: Response = {
			id,
			postId: input.postId,
			body: input.body,
			responderId,
			createdAt: now,
			updatedAt: now,
		};

		await this.client.send(
			new PutCommand({
				TableName: this.tableName,
				Item: {
					PK: `POST#${input.postId}`,
					SK: `RES#${now}#${id}`,
					type: "RESPONSE",
					...response,
				},
			}),
		);

		return response;
	}

	async findByPostId(postId: string): Promise<Response[]> {
		const result = await this.client.send(
			new QueryCommand({
				TableName: this.tableName,
				KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
				ExpressionAttributeValues: {
					":pk": `POST#${postId}`,
					":sk": "RES#",
				},
			}),
		);

		return (result.Items ?? []).map((item) => ({
			id: item.id as string,
			postId: item.postId as string,
			body: item.body as string,
			responderId: item.responderId as string,
			createdAt: item.createdAt as string,
			updatedAt: item.updatedAt as string,
		}));
	}
}
