---
id: ADR-02
title: ORM の採否
category: データ・DB
status: 採用
date: 2026-03-01
---

# ADR-02: ORM の採否 — ORM 不使用（repository パターン）

**ステータス:** 採用

## コンテキスト

DynamoDB（[ADR-01](./0001-database-dynamodb.md)）採用後、データアクセスに ORM/ODM（Drizzle 等）を挟むか、AWS SDK を直接使うかを決める必要があった。

## 検討した選択肢

| 選択肢 | メリット | デメリット |
|--------|---------|-----------|
| ORM 不使用 + repository パターン（採用） | 依存最小・DynamoDB の機能をフル活用・テストはモックリポジトリ | アクセスコードを自前で書く |
| Drizzle 等の ORM（却下） | スキーマ定義の共通化 | DynamoDB シングルテーブル設計で利点が薄く、抽象漏れ・追従コスト |

## 決定

ORM を導入しない。repository インターフェース（`packages/backend/src/repositories/`）＋ DynamoDB 実装（`repositories/dynamodb/`）でアクセス層を隠蔽。ユニットテストはモックリポジトリを注入。

## 結果

- 良い帰結: 依存が少なく、DynamoDB の表現力をそのまま使える。テストが DynamoDB 非依存
- 注意すべき帰結: アクセスパターンごとに実装が必要。詳細根拠: [docs/spike-orm-selection.md](../spike-orm-selection.md)

## 関連

- [ADR-01](./0001-database-dynamodb.md) — データベース選定
