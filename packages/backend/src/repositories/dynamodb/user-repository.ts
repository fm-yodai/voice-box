import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { CreateUser, User } from "@voice-box/shared";
import { v4 as uuidv4 } from "uuid";
import type { UserRepository } from "../user-repository.js";

export class DynamoDBUserRepository implements UserRepository {
  constructor(
    private client: DynamoDBDocumentClient,
    private tableName: string
  ) {}

  async create(input: CreateUser): Promise<User> {
    const id = uuidv4();
    const now = new Date();

    const user: User = {
      id,
      oauthProvider: input.oauthProvider,
      oauthSub: input.oauthSub,
      email: input.email,
      anonymousDisplayId: `user-${id.slice(0, 8)}`,
      createdAt: now,
      updatedAt: now,
    };

    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          PK: `USER#${id}`,
          SK: `USER#${id}`,
          type: "USER",
          ...user,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          GSI1PK: `OAUTH#${input.oauthProvider}#${input.oauthSub}`,
          GSI1SK: `USER#${id}`,
        },
      })
    );

    return user;
  }

  async findById(id: string): Promise<User | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { PK: `USER#${id}`, SK: `USER#${id}` },
      })
    );

    if (!result.Item) {
      return null;
    }

    return this.toUser(result.Item);
  }

  async findByOAuthSub(provider: string, sub: string): Promise<User | null> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: "GSI1-PostsByDate",
        KeyConditionExpression: "GSI1PK = :pk",
        ExpressionAttributeValues: {
          ":pk": `OAUTH#${provider}#${sub}`,
        },
        Limit: 1,
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return null;
    }

    return this.toUser(result.Items[0]);
  }

  private toUser(item: Record<string, unknown>): User {
    return {
      id: item.id as string,
      oauthProvider: item.oauthProvider as User["oauthProvider"],
      oauthSub: item.oauthSub as string,
      email: item.email as string,
      anonymousDisplayId: item.anonymousDisplayId as string,
      createdAt: new Date(item.createdAt as string),
      updatedAt: new Date(item.updatedAt as string),
    };
  }
}
