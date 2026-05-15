---
id: ADR-01
title: データベース選定
category: データ・DB
status: 採用
date: 2026-03-01
---

# ADR-01: データベース選定 — DynamoDB + AWS SDK v3 直接利用

**ステータス:** 採用

## コンテキスト

匿名投稿プラットフォームのメインデータストアを選定する必要があった。制約: インフラ予算が小さく無料枠を活かしたい、Lambda から低レイテンシでアクセスしたい、VPC 運用コストを避けたい。

## 検討した選択肢

| 選択肢 | メリット | デメリット |
|--------|---------|-----------|
| DynamoDB（採用） | 無料枠・VPC 不要・Lambda 親和性・フルマネージド | クエリ柔軟性が低くシングルテーブル設計の学習コスト |
| Aurora PostgreSQL（却下） | 柔軟な SQL・リレーション | VPC 必須・コスト・Lambda コールドスタートで接続管理が複雑 |

## 決定

DynamoDB をシングルテーブル設計で採用。アクセスは `@aws-sdk/lib-dynamodb`（AWS SDK v3）を直接利用。GSI: GSI1-PostsByDate / GSI2-PostsByStatus / GSI3-PostsByAuthor。

## 結果

- 良い帰結: 無料枠内で運用可能、VPC 不要、Lambda と高親和
- 注意すべき帰結: クエリパターンを先に設計する必要。アクセスは repository パターンで隠蔽（[ADR-02](./0002-no-orm.md)）
- 詳細な比較根拠: [docs/spike-database-selection.md](../spike-database-selection.md)

## 関連

- [ADR-02](./0002-no-orm.md) — ORM の採否
- [ADR-03](./0003-iac-aws-cdk.md) — テーブルは CDK で定義
