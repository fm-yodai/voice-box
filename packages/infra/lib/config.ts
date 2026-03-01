export interface EnvironmentConfig {
  readonly envName: string;
  readonly account: string;
  readonly region: string;
  readonly tableName: string;
  readonly frontendBucketName: string;
}

/**
 * Environment configurations.
 * Replace placeholder values (YOUR_AWS_ACCOUNT_ID) with actual values
 * before deployment.
 */
const environments: Record<string, EnvironmentConfig> = {
  dev: {
    envName: "dev",
    account: process.env.CDK_DEFAULT_ACCOUNT ?? "YOUR_AWS_ACCOUNT_ID",
    region: process.env.CDK_DEFAULT_REGION ?? "ap-northeast-1",
    tableName: "voice-box-dev",
    frontendBucketName: "voice-box-frontend-dev",
  },
  prod: {
    envName: "prod",
    account: process.env.CDK_DEFAULT_ACCOUNT ?? "YOUR_AWS_ACCOUNT_ID",
    region: process.env.CDK_DEFAULT_REGION ?? "ap-northeast-1",
    tableName: "voice-box-prod",
    frontendBucketName: "voice-box-frontend-prod",
  },
};

export function getConfig(envName: string): EnvironmentConfig {
  const config = environments[envName];
  if (!config) {
    throw new Error(
      `Unknown environment: ${envName}. Available: ${Object.keys(environments).join(", ")}`
    );
  }
  return config;
}
