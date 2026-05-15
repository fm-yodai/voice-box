---
id: ADR-03
title: IaC ツール選定
category: インフラ・運用
status: 採用
date: 2026-03-01
---

# ADR-03: IaC ツール選定 — AWS CDK (TypeScript)

**ステータス:** 採用

## コンテキスト

Lambda / API Gateway / DynamoDB / S3+CloudFront をコードで管理する IaC ツールを選定する必要があった。プロジェクトはフルスタック TypeScript。

## 検討した選択肢

| 選択肢 | メリット | デメリット |
|--------|---------|-----------|
| AWS CDK (TypeScript)（採用） | 言語が TS で統一・スタックの単体テスト可能・CloudFormation がステート管理 | CDK 固有の学習 |
| SST（却下） | サーバーレス DX が良い | 抽象が厚く、CDK 直接制御から離れる。本プロジェクトの規模では過剰 |
| Terraform（却下） | マルチクラウド・成熟 | 別言語(HCL)・ステート管理を別途運用 |

## 決定

AWS CDK (TypeScript) を採用。スタックは `packages/infra/lib/`（dynamodb / backend / frontend）。IAM は `grant*` で最小権限を自動化。`pnpm cdk:diff` で差分確認後にデプロイ。

## 結果

- 良い帰結: TS 統一でスキル流用・`test/stacks.test.ts` でテスト可能・CFn がステート管理
- 注意すべき帰結: SST のパターンは使わない。詳細根拠: [docs/spike-iac-selection.md](../spike-iac-selection.md)

## 関連

- [ADR-01](./0001-database-dynamodb.md) — DynamoDB テーブルは CDK で定義
