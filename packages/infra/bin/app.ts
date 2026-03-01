#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { BackendStack } from "../lib/backend-stack.js";
import { getConfig } from "../lib/config.js";
import { DynamoDbStack } from "../lib/dynamodb-stack.js";
import { FrontendStack } from "../lib/frontend-stack.js";

const app = new cdk.App();

const envName = app.node.tryGetContext("env") ?? "dev";
const config = getConfig(envName);

const env = { account: config.account, region: config.region };

const dynamoDbStack = new DynamoDbStack(app, `VoiceBox-DynamoDB-${config.envName}`, {
  config,
  env,
});

const backendStack = new BackendStack(app, `VoiceBox-Backend-${config.envName}`, {
  config,
  env,
  table: dynamoDbStack.table,
});
backendStack.addDependency(dynamoDbStack);

const frontendStack = new FrontendStack(app, `VoiceBox-Frontend-${config.envName}`, {
  config,
  env,
  apiUrl: backendStack.apiUrl,
});
frontendStack.addDependency(backendStack);

app.synth();
