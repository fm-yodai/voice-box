import {
  CreateTableCommand,
  DynamoDBClient,
  ResourceInUseException,
} from "@aws-sdk/client-dynamodb";

const endpoint = process.env.DYNAMODB_ENDPOINT ?? "http://localhost:8000";
const tableName = process.env.DYNAMODB_TABLE_NAME ?? "voice-box";

const client = new DynamoDBClient({
  endpoint,
  region: process.env.AWS_REGION ?? "ap-northeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "local",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "local",
  },
});

async function setup() {
  try {
    await client.send(
      new CreateTableCommand({
        TableName: tableName,
        KeySchema: [
          { AttributeName: "PK", KeyType: "HASH" },
          { AttributeName: "SK", KeyType: "RANGE" },
        ],
        AttributeDefinitions: [
          { AttributeName: "PK", AttributeType: "S" },
          { AttributeName: "SK", AttributeType: "S" },
          { AttributeName: "GSI1PK", AttributeType: "S" },
          { AttributeName: "GSI1SK", AttributeType: "S" },
          { AttributeName: "GSI2PK", AttributeType: "S" },
          { AttributeName: "GSI2SK", AttributeType: "S" },
          { AttributeName: "GSI3PK", AttributeType: "S" },
          { AttributeName: "GSI3SK", AttributeType: "S" },
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: "GSI1-PostsByDate",
            KeySchema: [
              { AttributeName: "GSI1PK", KeyType: "HASH" },
              { AttributeName: "GSI1SK", KeyType: "RANGE" },
            ],
            Projection: { ProjectionType: "ALL" },
          },
          {
            IndexName: "GSI2-PostsByStatus",
            KeySchema: [
              { AttributeName: "GSI2PK", KeyType: "HASH" },
              { AttributeName: "GSI2SK", KeyType: "RANGE" },
            ],
            Projection: { ProjectionType: "ALL" },
          },
          {
            IndexName: "GSI3-PostsByAuthor",
            KeySchema: [
              { AttributeName: "GSI3PK", KeyType: "HASH" },
              { AttributeName: "GSI3SK", KeyType: "RANGE" },
            ],
            Projection: { ProjectionType: "ALL" },
          },
        ],
        BillingMode: "PAY_PER_REQUEST",
      })
    );
    console.log(`Table "${tableName}" created successfully.`);
  } catch (error) {
    if (error instanceof ResourceInUseException) {
      console.log(`Table "${tableName}" already exists. Skipping.`);
    } else {
      throw error;
    }
  }
}

setup();
