import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { BackendStack } from "../lib/backend-stack.js";
import type { EnvironmentConfig } from "../lib/config.js";
import { DynamoDbStack } from "../lib/dynamodb-stack.js";
import { FrontendStack } from "../lib/frontend-stack.js";

const testConfig: EnvironmentConfig = {
  envName: "dev",
  account: "123456789012",
  region: "ap-northeast-1",
  tableName: "voice-box-dev",
  frontendBucketName: "voice-box-frontend-dev",
};

const env = { account: testConfig.account, region: testConfig.region };

describe("DynamoDbStack", () => {
  it("matches snapshot", () => {
    const app = new cdk.App();
    const stack = new DynamoDbStack(app, "TestDynamoDB", {
      config: testConfig,
      env,
    });
    const template = Template.fromStack(stack);
    expect(template.toJSON()).toMatchSnapshot();
  });

  it("creates table with correct key schema", () => {
    const app = new cdk.App();
    const stack = new DynamoDbStack(app, "TestDynamoDB", {
      config: testConfig,
      env,
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::DynamoDB::Table", {
      KeySchema: [
        { AttributeName: "PK", KeyType: "HASH" },
        { AttributeName: "SK", KeyType: "RANGE" },
      ],
      BillingMode: "PAY_PER_REQUEST",
      PointInTimeRecoverySpecification: {
        PointInTimeRecoveryEnabled: true,
      },
    });
  });

  it("creates three GSIs", () => {
    const app = new cdk.App();
    const stack = new DynamoDbStack(app, "TestDynamoDB", {
      config: testConfig,
      env,
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::DynamoDB::Table", {
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
    });
  });
});

describe("BackendStack", () => {
  it("matches snapshot", () => {
    const app = new cdk.App();
    const dynamoStack = new DynamoDbStack(app, "TestDynamoDB", {
      config: testConfig,
      env,
    });
    const stack = new BackendStack(app, "TestBackend", {
      config: testConfig,
      env,
      table: dynamoStack.table,
    });
    const template = Template.fromStack(stack);
    expect(template.toJSON()).toMatchSnapshot();
  });

  it("creates Lambda function with correct configuration", () => {
    const app = new cdk.App();
    const dynamoStack = new DynamoDbStack(app, "TestDynamoDB", {
      config: testConfig,
      env,
    });
    const stack = new BackendStack(app, "TestBackend", {
      config: testConfig,
      env,
      table: dynamoStack.table,
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::Lambda::Function", {
      Runtime: "nodejs20.x",
      Architectures: ["arm64"],
      MemorySize: 256,
      Timeout: 30,
      Environment: {
        Variables: {
          NODE_ENV: "production",
        },
      },
    });
  });

  it("creates HTTP API with CORS", () => {
    const app = new cdk.App();
    const dynamoStack = new DynamoDbStack(app, "TestDynamoDB", {
      config: testConfig,
      env,
    });
    const stack = new BackendStack(app, "TestBackend", {
      config: testConfig,
      env,
      table: dynamoStack.table,
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::ApiGatewayV2::Api", {
      Name: "voice-box-api-dev",
      ProtocolType: "HTTP",
      CorsConfiguration: {
        AllowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        AllowHeaders: ["Content-Type", "Authorization"],
        AllowOrigins: ["*"],
      },
    });
  });
});

describe("FrontendStack", () => {
  let tempDir: string;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "frontend-dist-"));
    fs.writeFileSync(path.join(tempDir, "index.html"), "<html></html>");
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("creates S3 bucket with public access blocked", () => {
    const app = new cdk.App();
    const stack = new FrontendStack(app, "TestFrontend", {
      config: testConfig,
      env,
      frontendDistPath: tempDir,
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::S3::Bucket", {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  it("creates CloudFront distribution with SPA error handling", () => {
    const app = new cdk.App();
    const stack = new FrontendStack(app, "TestFrontend", {
      config: testConfig,
      env,
      frontendDistPath: tempDir,
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::CloudFront::Distribution", {
      DistributionConfig: {
        DefaultRootObject: "index.html",
        CustomErrorResponses: [
          {
            ErrorCode: 403,
            ResponseCode: 200,
            ResponsePagePath: "/index.html",
          },
          {
            ErrorCode: 404,
            ResponseCode: 200,
            ResponsePagePath: "/index.html",
          },
        ],
      },
    });
  });
});
