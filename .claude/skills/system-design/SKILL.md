---
name: system-design
description: >-
  voice-box のシステム設計・技術選定情報を提供する。技術スタック（Vue3/Hono/DynamoDB/CDK/Zod/Biome）、
  REST API 設計、DynamoDB Single Table Design、Lambda、API Gateway、S3+CloudFront、コスト試算、
  セキュリティ、技術選定の根拠（Spike）について質問されたときに使う。「技術選定」「なぜ DynamoDB」
  「なぜ CDK」「システム構成」「インフラ構成」「コスト」「Spike」で起動。
---

# voice-box システム設計

## 一次情報

| トピック | ドキュメント |
|---------|------------|
| システム構成図・パッケージ構成・データフロー・技術選定根拠 | [docs/ARCHITECTURE.md](../../../docs/ARCHITECTURE.md) |
| DB 選定（DynamoDB vs Aurora）の経緯 | [docs/spike-database-selection.md](../../../docs/spike-database-selection.md) |
| ORM 選定（AWS SDK 直接利用 vs Drizzle）の経緯 | [docs/spike-orm-selection.md](../../../docs/spike-orm-selection.md) |
| IaC 選定（CDK vs SST vs Terraform）の経緯 | [docs/spike-iac-selection.md](../../../docs/spike-iac-selection.md) |
| 設計判断の履歴 | [docs/ADR.md](../../../docs/ADR.md) |

## 確定している技術選定（変更時は ADR を追加）

| レイヤー | 選定 | 根拠 |
|---------|------|------|
| 言語 | TypeScript（フルスタック・strict） | 型の単一管理 |
| フロント | Vue 3 + Vite + Tailwind CSS + Pinia | - |
| バックエンド | Hono on AWS Lambda | 軽量・Lambda 対応・TS ファースト |
| API | REST（Zod バリデーション） | フロント/バック共有スキーマ |
| DB | DynamoDB + AWS SDK 直接利用（`@aws-sdk/lib-dynamodb`） | 無料枠・VPC 不要・Lambda 親和性。**Drizzle/ORM 不使用** |
| IaC | AWS CDK (TypeScript) | TS 統一・テスト可能・CFn ステート自動管理。**SST 不使用** |
| 静的配信 | S3 + CloudFront | - |
| Lint/Format | Biome | 単一ツール。**ESLint/Prettier 不使用** |
| テスト | Vitest（80% カバレッジ） | - |

## Gotchas（古い記事や他プロジェクトのパターンに注意）

- **AWS SDK は v3 のみ**。`new AWS.DynamoDB()` 等の v2 パターンを使わない
- **ORM を導入しない**。データアクセスは repository パターン（[[dynamodb]]）
- **SST のパターンを使わない**（IaC は CDK）。[[cdk-infra]] 参照
- 投稿者情報を API レスポンスに含めない（匿名性。[[project-knowledge]]）
- 設計上の判断を変える場合は既存 ADR を上書きせず新規 ADR を追加（[[adr-from-session]]）

関連: [[app-architecture]] [[dynamodb]] [[cdk-infra]]
