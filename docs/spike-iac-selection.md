# Spike: IaC ツール選定 (Terraform vs AWS CDK vs SAM)

> **Issue**: #18
> **ステータス**: 完了
> **結論**: **AWS CDK (TypeScript) を推奨**
> **日付**: 2026-02-07

## 背景

voice-box プロジェクトのインフラストラクチャをコードで管理するための IaC ツールを選定する。
AWS 上に Aurora PostgreSQL、Lambda、DynamoDB、API Gateway 等のリソースを構築・管理する想定。

## 2025-2026 年の重要な変化

選定にあたり、以下の業界動向を考慮する必要がある:

1. **Terraform BSL ライセンス変更**: 2023年に MPL 2.0 から BSL に変更。2025年7月以降、OSS 版のサポートが終了
2. **CDKTF 廃止**: 2025年12月に HashiCorp が CDKTF（CDK for Terraform）を正式に廃止。「プロダクトマーケットフィットに至らなかった」と発表
3. **AWS CDK の継続的進化**: CDK Refactor（2025年9月）等の新機能が追加され、エコシステムが成熟

## 比較表

| 観点                           | Terraform                                                                         | AWS CDK                                                                                                   | AWS SAM                                                                                                   |
| ------------------------------ | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **学習曲線**                   | HCL（独自言語）の習得が必要。宣言的で比較的シンプル                               | TypeScript/Python 等の既知言語を使用。開発者にとって親しみやすい                                          | YAML/JSON テンプレート。サーバーレスに特化しているためシンプル                                            |
| **TypeScript との親和性**      | HCL が必要で TypeScript との親和性は低い。CDKTF は廃止済み                        | TypeScript がファーストクラス対応。IDE 補完、型チェック、リファクタリングが完全に機能                     | YAML ベースのため TypeScript との親和性は低い                                                             |
| **Aurora/Lambda/DynamoDB**     | 全リソース対応。プロバイダー経由                                                  | L2 Construct で高レベル抽象化。Aurora、Lambda、DynamoDB いずれも充実したサポート                          | Lambda、DynamoDB、API Gateway に特化。Aurora は CloudFormation リソースとして定義可能だがサポートは限定的 |
| **ステート管理**               | tfstate ファイルの管理が必要（S3 + DynamoDB Lock が一般的）。同期ずれのリスクあり | CloudFormation がステートを自動管理。追加のステート管理不要                                               | CloudFormation ベースで自動管理                                                                           |
| **AI エージェントの保守性**    | HCL は独自言語のため AI の理解度がやや劣る                                        | TypeScript コードのため AI エージェントが理解・生成しやすい。テストも標準フレームワーク（Jest）で記述可能 | YAML テンプレートは AI が生成しやすいが、複雑な構成の表現力に限界                                         |
| **コミュニティ・エコシステム** | 大規模コミュニティだが BSL 変更後に一部が OpenTofu に移行。マルチクラウド対応     | AWS 公式サポート。活発なコミュニティ。Construct Hub で再利用可能なパターン共有                            | AWS 公式。サーバーレスコミュニティで広く利用                                                              |

## 詳細分析

### 学習曲線

**AWS CDK (TypeScript):**

```typescript
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

export class VoiceBoxStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB テーブル
    const table = new dynamodb.Table(this, "PostsTable", {
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });

    // Lambda 関数
    const handler = new lambda.Function(this, "ApiHandler", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("packages/backend/dist"),
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    // IAM 最小権限の自動付与
    table.grantReadWriteData(handler);
  }
}
```

**Terraform (HCL):**

```hcl
resource "aws_dynamodb_table" "posts" {
  name         = "posts"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"
  range_key    = "sk"

  attribute {
    name = "pk"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }
}

resource "aws_lambda_function" "api_handler" {
  function_name = "voice-box-api"
  runtime       = "nodejs20.x"
  handler       = "index.handler"
  filename      = "packages/backend/dist.zip"

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.posts.name
    }
  }
}

# IAM ポリシーを手動で定義する必要がある
resource "aws_iam_role_policy" "lambda_dynamodb" {
  role = aws_iam_role.lambda_role.id
  policy = jsonencode({
    Statement = [{
      Effect   = "Allow"
      Action   = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:Query"]
      Resource = aws_dynamodb_table.posts.arn
    }]
  })
}
```

**AWS SAM (YAML):**

```yaml
AWSTemplateFormatVersion: "2010-09-09"
Transform: AWS::Serverless-2016-10-31

Resources:
  ApiHandler:
    Type: AWS::Serverless::Function
    Properties:
      Handler: index.handler
      Runtime: nodejs20.x
      CodeUri: packages/backend/dist
      Environment:
        Variables:
          TABLE_NAME: !Ref PostsTable
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref PostsTable

  PostsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      BillingMode: PAY_PER_REQUEST
      KeySchema:
        - AttributeName: pk
          KeyType: HASH
        - AttributeName: sk
          KeyType: RANGE
      AttributeDefinitions:
        - AttributeName: pk
          AttributeType: S
        - AttributeName: sk
          AttributeType: S
```

### Aurora PostgreSQL の構築

**AWS CDK:**

```typescript
import * as rds from "aws-cdk-lib/aws-rds";
import * as ec2 from "aws-cdk-lib/aws-ec2";

const cluster = new rds.DatabaseCluster(this, "AuroraCluster", {
  engine: rds.DatabaseClusterEngine.auroraPostgres({
    version: rds.AuroraPostgresEngineVersion.VER_16_4,
  }),
  serverlessV2MinCapacity: 0.5,
  serverlessV2MaxCapacity: 4,
  writer: rds.ClusterInstance.serverlessV2("writer"),
  vpc,
  enableDataApi: true, // Data API を有効化
  removalPolicy: cdk.RemovalPolicy.RETAIN,
});

// Lambda に接続権限を付与
cluster.grantDataApiAccess(handler);
```

**Terraform:**

```hcl
resource "aws_rds_cluster" "aurora" {
  cluster_identifier = "voice-box-aurora"
  engine             = "aurora-postgresql"
  engine_version     = "16.4"
  engine_mode        = "provisioned"
  enable_http_endpoint = true  # Data API

  serverlessv2_scaling_configuration {
    min_capacity = 0.5
    max_capacity = 4
  }

  # VPC, サブネット、セキュリティグループ等を手動設定
}

resource "aws_rds_cluster_instance" "writer" {
  cluster_identifier = aws_rds_cluster.aurora.id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.aurora.engine
}
```

### テスト可能性

**AWS CDK（Jest で Infrastructure テスト）:**

```typescript
import { Template } from "aws-cdk-lib/assertions";

test("DynamoDB テーブルが PAY_PER_REQUEST で作成される", () => {
  const template = Template.fromStack(stack);
  template.hasResourceProperties("AWS::DynamoDB::Table", {
    BillingMode: "PAY_PER_REQUEST",
  });
});

test("Lambda に DynamoDB への読み書き権限がある", () => {
  const template = Template.fromStack(stack);
  template.hasResourceProperties("AWS::IAM::Policy", {
    PolicyDocument: {
      Statement: Match.arrayWith([
        Match.objectLike({
          Action: Match.arrayWith(["dynamodb:GetItem", "dynamodb:PutItem"]),
        }),
      ]),
    },
  });
});
```

**Terraform:**

- ネイティブのテストフレームワークなし
- Terratest（Go）やcheckov 等のサードパーティツールが必要

### AI コーディングエージェントとの保守性比較

| 観点             | AWS CDK                                              | Terraform                                    | SAM                                  |
| ---------------- | ---------------------------------------------------- | -------------------------------------------- | ------------------------------------ |
| 言語の理解度     | TypeScript は AI が最も得意な言語の一つ              | HCL は独自言語だが広く学習済み               | YAML は理解しやすいが表現力に限界    |
| コード生成       | 型安全なコード生成が可能                             | HCL テンプレート生成は可能だが型チェックなし | テンプレート生成は容易               |
| リファクタリング | 標準的な TypeScript リファクタリングツールが利用可能 | HCL 固有のリファクタリングが必要             | YAML の構造変更は手動                |
| テスト生成       | Jest テストの自動生成が可能                          | テストフレームワークが標準化されていない     | テスト機能が限定的                   |
| エラー検出       | コンパイル時に型エラーを検出                         | `terraform plan` 実行時まで検出できない      | デプロイ時まで検出できないことが多い |

## 推奨

### **AWS CDK (TypeScript) を推奨する**

**主な理由:**

1. **TypeScript との統一**: バックエンド（Hono）、フロントエンド（Vue）、インフラ（CDK）を全て TypeScript で統一でき、チーム全体の認知負荷を軽減
2. **Aurora/Lambda/DynamoDB の高レベルサポート**: L2 Construct による抽象化で、IAM 権限の自動付与、VPC 設定の簡素化が可能
3. **ステート管理不要**: CloudFormation がステートを自動管理するため、tfstate の同期問題が発生しない
4. **テスト可能性**: Jest で Infrastructure テストが記述でき、TDD アプローチと整合
5. **AI エージェントとの親和性**: TypeScript コードのため、AI エージェントによる理解・生成・保守が容易
6. **将来性**: Terraform の BSL 変更・CDKTF 廃止に対し、AWS CDK は AWS 公式サポートで安定

**Terraform を選ぶべき場合:**

- マルチクラウド環境が必要な場合
- チームに Terraform の専門知識がある場合
- OpenTofu への移行を検討している場合

**SAM を選ぶべき場合:**

- 純粋にサーバーレスのみの小規模プロジェクト
- ローカル開発・デバッグ（`sam local`）が主要要件の場合

**注意**: SAM CLI は CDK と併用可能（`sam local invoke` で CDK スタックの Lambda をローカルテスト可能）

## リスクと対策

| リスク                                                       | 対策                                                                                 |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| CDK の CloudFormation 制限（リソース数上限 500）             | スタック分割戦略を事前設計。NestedStack の活用                                       |
| CloudFormation のデプロイ速度が Terraform より遅い場合がある | ホットスワップ（`cdk deploy --hotswap`）で開発時は高速化                             |
| CDK バージョンアップ時の破壊的変更                           | L2 Construct の安定版を使用。`cdk.RemovalPolicy.RETAIN` でステートフルリソースを保護 |
| チームの CDK 学習コスト                                      | TypeScript 経験があれば学習曲線は緩やか。AWS 公式チュートリアルが充実                |

## 参考リンク

- [AWS CDK 公式ドキュメント](https://docs.aws.amazon.com/cdk/v2/guide/home.html)
- [AWS CDK Best Practices (TypeScript)](https://docs.aws.amazon.com/pdfs/prescriptive-guidance/latest/best-practices-cdk-typescript-iac/best-practices-cdk-typescript-iac.pdf)
- [AWS CDK vs Terraform: 2026 Comparison](https://towardsthecloud.com/blog/aws-cdk-vs-terraform)
- [AWS CDK vs Terraform: 2026 Comparison (DEV)](https://dev.to/aws-builders/aws-cdk-vs-terraform-the-complete-2026-comparison-3b4p)
- [Terraform vs CDK vs Pulumi: Best Alternatives 2026](https://www.sketchdev.io/blog/best-terraform-alternatives)
- [SAM + CDK: Better Together](https://aws.amazon.com/blogs/compute/better-together-aws-sam-and-aws-cdk/)
- [CDKTF Deprecation](https://www.env0.com/blog/another-one-bites-the-dust-what-the-cdktf-deprecation-means-for-you)
- [Terraform License Change Impact](https://controlmonkey.io/resource/terraform-license-change-impact-2025/)
