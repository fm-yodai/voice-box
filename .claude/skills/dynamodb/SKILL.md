---
name: dynamodb
description: >-
  voice-box の DynamoDB データアクセス層ガイド。AWS SDK v3（@aws-sdk/lib-dynamodb）の直接利用、
  シングルテーブル設計、GSI 設計、repository インターフェースと DynamoDB 実装、
  ローカル DynamoDB Local（docker compose, port 8000）について扱う。
  DynamoDB・GSI・クエリ・repository 実装・テーブル設計の作業時に使う。
  「DynamoDB」「GSI」「テーブル設計」「repository 実装」「クエリ」で起動。ORM は使わない。
paths: "packages/backend/src/repositories/**,packages/backend/src/lib/dynamodb.ts,packages/infra/lib/dynamodb-stack.ts"
---

# voice-box DynamoDB

ORM を使わず **AWS SDK v3 (`@aws-sdk/lib-dynamodb`) を直接利用** し、repository パターンで
アクセス層を隠蔽する。選定経緯: [docs/spike-database-selection.md](../../../docs/spike-database-selection.md)
/ [docs/spike-orm-selection.md](../../../docs/spike-orm-selection.md)。

## シングルテーブル設計と GSI

| インデックス | 用途 |
|------------|------|
| メインテーブル（PK/SK） | エンティティ本体 |
| GSI1-PostsByDate | 投稿を日付順に取得 |
| GSI2-PostsByStatus | ステータス別に投稿を取得 |
| GSI3-PostsByAuthor | 投稿者別に取得（**内部追跡用。公開経路で使わない**） |

テーブル定義は CDK（`packages/infra/lib/dynamodb-stack.ts`、[[cdk-infra]]）。GSI を追加する場合は
CDK 定義 → repository 実装 → クエリの 3 点をセットで変更。

## repository パターン

```
repositories/
  <x>-repository.ts          ← interface（ドメインが依存する契約）
  index.ts                   ← ファクトリ（環境に応じて実装を返す）
  dynamodb/<x>-repository.ts  ← DynamoDB 実装
```

- 新エンティティ追加: interface 定義 → dynamodb 実装 → `index.ts` のファクトリに登録 →
  middleware 経由で `c.get("repositories")` に露出（[[app-architecture]]）
- クライアント設定は `packages/backend/src/lib/dynamodb.ts`（ローカルは endpoint=localhost:8000）

## ローカル開発

```bash
docker compose up -d        # DynamoDB Local (port 8000)
```

## Gotchas

- AWS SDK は **v3 のみ**。`new AWS.DynamoDB()`（v2）禁止
- Drizzle 等の ORM を入れない（spike で不採用決定済み）
- GSI3（投稿者別）は匿名性に関わる。公開 API レスポンス経路で使わない（[[project-knowledge]]）
- ユニットテストはモックリポジトリを注入し DynamoDB 非依存にする（[[testing]]）

関連: [[app-architecture]] [[cdk-infra]] [[system-design]]
