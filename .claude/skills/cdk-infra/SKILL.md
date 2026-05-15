---
name: cdk-infra
description: >-
  voice-box の AWS CDK インフラ（TypeScript）ガイド。スタック構成（DynamoDB / Backend Lambda+APIGW /
  Frontend S3+CloudFront）、cdk synth/diff/deploy、env コンテキスト、IAM 最小権限（grant*）、
  CI のデプロイジョブについて扱う。infra/ 配下や IaC 作業時に使う。
  「CDK」「インフラ」「デプロイ」「スタック」「cdk diff」「Lambda 配置」で起動。SST は使わない。
paths: "packages/infra/**,.github/workflows/ci.yml"
---

# voice-box CDK インフラ

IaC は **AWS CDK (TypeScript)**。選定経緯: [docs/spike-iac-selection.md](../../../docs/spike-iac-selection.md)。

## スタック構成（`packages/infra/`）

```
bin/app.ts                 ← エントリ（env コンテキストでスタック合成）
lib/config.ts              ← 環境別設定
lib/dynamodb-stack.ts      ← VoiceBox-DynamoDB-<env>（テーブル + GSI。[[dynamodb]]）
lib/backend-stack.ts       ← VoiceBox-Backend-<env>（Lambda + API Gateway）
lib/frontend-stack.ts      ← VoiceBox-Frontend-<env>（S3 + CloudFront）
test/stacks.test.ts        ← スナップショット/アサーションテスト
```

## コマンド

```bash
pnpm cdk:synth                                             # CloudFormation 合成
pnpm cdk:diff                                              # 差分確認（変更前に必ず）
pnpm cdk:deploy
pnpm --filter @voice-box/infra cdk deploy --all --context env=dev --require-approval never  # CI と同じ
```

## デプロイフロー

`main` への push で `.github/workflows/ci.yml` の `deploy-dev` ジョブが OIDC 認証 →
3 スタックを deploy（typecheck/lint/test/build 通過が前提）。リージョン `ap-northeast-1`。

## Gotchas

- **SST のパターンを使わない**（`sst.config.ts` 等）。CDK のみ
- IAM は最小権限。手書きポリシーより CDK の `grant*`（例: `table.grantReadWriteData(fn)`）を使う
- インフラ変更は必ず `pnpm cdk:diff` で影響確認してから
- DynamoDB の GSI 追加はテーブル定義（本スキル）と repository 実装（[[dynamodb]]）をセットで
- スタック変更時は `test/stacks.test.ts` を更新（[[testing]]）

関連: [[system-design]] [[dynamodb]] [[monorepo-pnpm]]
