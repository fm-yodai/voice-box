# 実装計画: PostgreSQL → DynamoDB 移行

## 現状分析

- バックエンドは Hono + TypeScript で、現在 health エンドポイントのみ実装済み
- Drizzle ORM は選定済みだが、**コードはまだ未実装**（スキーマ定義・DB 接続コードなし）
- Docker Compose に PostgreSQL と DynamoDB Local が既に定義済み
- CDK インフラコードは未実装
- Zod スキーマ（shared パッケージ）は DB に依存しない設計で変更不要

→ DB 実装がまだ始まっていないため、移行ではなく **DynamoDB での新規実装** となる。影響範囲は限定的。

---

## 実装ステップ

### Phase 1: 依存関係とクライアント設定

**Step 1: AWS SDK 依存関係の追加**
- `packages/backend/package.json` に以下を追加:
  - `@aws-sdk/client-dynamodb`
  - `@aws-sdk/lib-dynamodb`
  - `uuid`（ID 生成用）
  - `@types/uuid`（devDependencies）

**Step 2: DynamoDB クライアント設定の作成**
- `packages/backend/src/lib/dynamodb.ts` を新規作成
  - ローカル開発時は `DYNAMODB_ENDPOINT`（`http://localhost:8000`）に接続
  - 本番では AWS SDK のデフォルト設定（IAM ロール）で接続
  - `DynamoDBDocumentClient` のインスタンスを export
  - テーブル名を環境変数 `DYNAMODB_TABLE_NAME` から取得

### Phase 2: リポジトリ層の実装

**Step 3: リポジトリインターフェース（ports）の定義**
- `packages/backend/src/repositories/post-repository.ts`
  - `PostRepository` インターフェース: `create`, `findById`, `findAll`, `updateStatus`
- `packages/backend/src/repositories/response-repository.ts`
  - `ResponseRepository` インターフェース: `create`, `findByPostId`
- `packages/backend/src/repositories/user-repository.ts`
  - `UserRepository` インターフェース: `create`, `findById`, `findByOAuthSub`

**Step 4: DynamoDB リポジトリ実装（adapters）**
- `packages/backend/src/repositories/dynamodb/post-repository.ts`
  - `DynamoDBPostRepository` クラス
  - シングルテーブル設計に基づく PK/SK/GSI 属性の管理
  - `findAll` で GSI1（PostsByDate）を使用、ステータス指定時は GSI2（PostsByStatus）を使用
  - `findById` で PK Query（Post + Response 一括取得）
  - `updateStatus` で GSI2PK も同時更新
- `packages/backend/src/repositories/dynamodb/response-repository.ts`
  - `DynamoDBResponseRepository` クラス
  - `create` で SK に `RES#<createdAt>#<resId>` を設定
- `packages/backend/src/repositories/dynamodb/user-repository.ts`
  - `DynamoDBUserRepository` クラス
  - `findByOAuthSub` 用に GSI が必要になる可能性あり（認証フロー実装時に検討）

**Step 5: リポジトリのファクトリ関数**
- `packages/backend/src/repositories/index.ts`
  - DynamoDB クライアントとテーブル名を受け取り、各リポジトリインスタンスを生成
  - Hono の `app` にコンテキストとして注入できるよう設計

### Phase 3: API ルートの実装

**Step 6: 投稿（Posts）ルートの実装**
- `packages/backend/src/routes/posts.ts`
  - `POST /posts` — 投稿作成（CreatePostSchema でバリデーション）
  - `GET /posts` — 投稿一覧取得（status, limit クエリパラメータ対応）
  - `GET /posts/:id` — 投稿詳細取得（返信含む）
  - `PATCH /posts/:id/status` — ステータス更新

**Step 7: 返信（Responses）ルートの実装**
- `packages/backend/src/routes/responses.ts`
  - `POST /posts/:postId/responses` — 返信作成（CreateResponseSchema でバリデーション）

**Step 8: app.ts の更新**
- 新しいルートを `app.ts` に登録
- リポジトリインスタンスをミドルウェア経由でルートに注入

### Phase 4: ローカル開発環境の整備

**Step 9: Docker Compose の更新**
- PostgreSQL サービスを削除（DynamoDB をメイン DB として使用するため不要に）
- `postgres-data` ボリュームを削除
- DynamoDB Local サービスはそのまま維持

**Step 10: ローカル用テーブル作成スクリプト**
- `packages/backend/scripts/setup-local-dynamodb.ts` を新規作成
  - DynamoDB Local にテーブルを作成
  - PK/SK + GSI1, GSI2, GSI3 を定義
  - 既にテーブルが存在する場合はスキップ
- `packages/backend/package.json` に `"db:setup"` スクリプトを追加

**Step 11: .env.example の更新**
- PostgreSQL 関連の環境変数を削除
- DynamoDB 関連の環境変数を整理:
  - `DYNAMODB_ENDPOINT=http://localhost:8000`
  - `DYNAMODB_TABLE_NAME=voice-box`
  - `AWS_REGION=ap-northeast-1`
  - `AWS_ACCESS_KEY_ID=local`（ローカル開発用）
  - `AWS_SECRET_ACCESS_KEY=local`（ローカル開発用）

### Phase 5: テスト

**Step 12: リポジトリのユニットテスト**
- `packages/backend/src/repositories/dynamodb/__tests__/post-repository.test.ts`
  - インメモリ実装またはモックを使ったテスト
- `packages/backend/src/repositories/dynamodb/__tests__/response-repository.test.ts`

**Step 13: ルートの統合テスト**
- `packages/backend/src/routes/posts.test.ts`
  - Hono の `app.request()` を使ったテスト
  - リポジトリをモックで差し替え

### Phase 6: ドキュメント更新

**Step 14: ドキュメントの更新**
- `docs/spike-database-selection.md` — DB 選定 Spike ドキュメントを新規作成（調査結果を記録）
- `docs/ARCHITECTURE.md` — システム構成図と技術選定表を更新
  - Aurora PostgreSQL → DynamoDB に変更
  - Drizzle ORM → AWS SDK 直接利用に変更
- `docs/spike-orm-selection.md` — ステータスに注記追加（DB 変更により結論が変更された旨）

---

## ファイル変更一覧

### 新規作成
| ファイル | 説明 |
|---|---|
| `packages/backend/src/lib/dynamodb.ts` | DynamoDB クライアント設定 |
| `packages/backend/src/repositories/post-repository.ts` | PostRepository インターフェース |
| `packages/backend/src/repositories/response-repository.ts` | ResponseRepository インターフェース |
| `packages/backend/src/repositories/user-repository.ts` | UserRepository インターフェース |
| `packages/backend/src/repositories/index.ts` | リポジトリファクトリ |
| `packages/backend/src/repositories/dynamodb/post-repository.ts` | DynamoDB PostRepository 実装 |
| `packages/backend/src/repositories/dynamodb/response-repository.ts` | DynamoDB ResponseRepository 実装 |
| `packages/backend/src/repositories/dynamodb/user-repository.ts` | DynamoDB UserRepository 実装 |
| `packages/backend/src/routes/posts.ts` | 投稿 API ルート |
| `packages/backend/src/routes/responses.ts` | 返信 API ルート |
| `packages/backend/scripts/setup-local-dynamodb.ts` | ローカル DynamoDB テーブル作成 |
| `docs/spike-database-selection.md` | DB 選定 Spike ドキュメント |

### 変更
| ファイル | 変更内容 |
|---|---|
| `packages/backend/package.json` | AWS SDK 依存関係追加、db:setup スクリプト追加 |
| `packages/backend/src/app.ts` | ルート登録追加、リポジトリ注入 |
| `docker-compose.yml` | PostgreSQL サービス削除 |
| `.env.example` | PostgreSQL 変数削除、DynamoDB 変数整理 |
| `docs/ARCHITECTURE.md` | DB 選定変更を反映 |
| `docs/spike-orm-selection.md` | ステータス注記追加 |

### 変更不要
| ファイル | 理由 |
|---|---|
| `packages/shared/src/schemas/*` | Zod スキーマは DB に依存しない |
| `packages/frontend/**` | フロントエンドは API 経由のためDB変更の影響なし |

---

## 設計上の判断ポイント

### リポジトリの DI 方式
Hono のコンテキスト変数（`c.set()`/`c.get()`）を使い、ミドルウェアでリポジトリを注入する。
これにより:
- ルートハンドラーは DynamoDB の詳細を知らない
- テスト時にモック実装に差し替え可能

### User リポジトリの GSI
現時点では OAuth 認証の実装は含まないため、`findByOAuthSub` 用の GSI（GSI4）は認証実装時に追加する。Spike で定義された GSI1〜3 の範囲で実装する。

### テスト戦略
- リポジトリ層: DynamoDB Client をモックしたユニットテスト
- ルート層: リポジトリをモック実装に差し替えた統合テスト
- DynamoDB Local を使った E2E テストは将来の CI 整備時に追加
