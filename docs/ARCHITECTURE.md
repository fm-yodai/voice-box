# アーキテクチャ

## 概要

voice-box は、組織内の匿名投稿プラットフォームです。
TypeScript による monorepo 構成で、フロントエンド・バックエンド・共有パッケージを統一的に管理します。

## システム構成図

```
┌─────────────────────────────────────────────────────┐
│                    クライアント                       │
│              (ブラウザ / モバイル)                     │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS
                       ▼
┌─────────────────────────────────────────────────────┐
│                  フロントエンド                       │
│            Vue 3 + Vite + Tailwind CSS              │
│     (S3 + CloudFront でホスティング予定)              │
└──────────────────────┬──────────────────────────────┘
                       │ REST API
                       ▼
┌─────────────────────────────────────────────────────┐
│              API Gateway + Lambda                    │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │           Hono (TypeScript)                   │  │
│  │                                               │  │
│  │  ┌─────────┐  ┌────────────┐  ┌───────────┐  │  │
│  │  │ Routes  │  │ Middleware │  │   Zod     │  │  │
│  │  │         │  │            │  │ Validation│  │  │
│  │  └────┬────┘  └────────────┘  └───────────┘  │  │
│  │       │                                       │  │
│  └───────┼───────────────────────────────────────┘  │
└──────────┼──────────────────────────────────────────┘
           │
     ┌─────┴─────┐
     ▼           ▼
┌─────────┐ ┌─────────┐
│ Aurora   │ │DynamoDB │
│PostgreSQL│ │         │
│(Drizzle) │ │         │
└─────────┘ └─────────┘
```

## パッケージ構成

### @voice-box/shared

フロントエンド・バックエンド間で共有する型定義とバリデーションスキーマを管理します。

```
packages/shared/
└── src/
    ├── index.ts              # エントリポイント
    └── schemas/
        ├── index.ts          # スキーマの集約エクスポート
        ├── post.ts           # 投稿スキーマ
        ├── user.ts           # ユーザースキーマ
        └── response.ts       # レスポンス（返信）スキーマ
```

**主要な型:**

| 型             | 説明                                                                  |
| -------------- | --------------------------------------------------------------------- |
| `Post`         | 投稿データ（id, title, body, category, status, authorId, isPublic）   |
| `PostStatus`   | 投稿ステータス: unconfirmed, accepted, in_progress, on_hold, resolved |
| `PostCategory` | カテゴリ: question, request, bug_report, feedback, other              |
| `User`         | ユーザー（id, email, displayName, role）                              |
| `UserRole`     | ロール: user, moderator, admin                                        |
| `Response`     | 投稿への返信（id, postId, body, responderId）                         |

### @voice-box/backend

Hono フレームワークによる REST API サーバー。ローカル開発時は Node.js サーバーとして動作し、本番では AWS Lambda ハンドラーとして動作します。

```
packages/backend/
└── src/
    ├── app.ts              # Hono アプリケーション定義
    ├── index.ts            # エントリポイント (Lambda + ローカル両対応)
    ├── middleware/          # ミドルウェア (認証、ロギング等)
    └── routes/
        └── health.ts       # ヘルスチェックエンドポイント
```

**特徴:**

- `hono/aws-lambda` を使用し、同一コードで Lambda と ローカルサーバーの両方に対応
- `NODE_ENV !== "production"` でローカル開発サーバーが起動
- `@voice-box/shared` のスキーマをバリデーションに使用

### @voice-box/frontend

Vue 3 + Vite によるシングルページアプリケーション。

```
packages/frontend/
└── src/
    ├── main.ts             # エントリポイント
    ├── App.vue             # ルートコンポーネント
    ├── components/         # 共通コンポーネント
    │   ├── AppHeader.vue
    │   └── AppFooter.vue
    ├── layouts/            # レイアウト
    │   └── DefaultLayout.vue
    ├── pages/              # ページ
    │   ├── HomePage.vue
    │   └── AboutPage.vue
    ├── router/             # Vue Router
    │   └── index.ts
    ├── stores/             # Pinia ストア
    │   └── counter.ts
    └── assets/
        └── main.css        # Tailwind CSS
```

**特徴:**

- Vue Router によるページルーティング
- Pinia による状態管理
- Tailwind CSS によるスタイリング
- `@voice-box/shared` の型を使用

## データフロー

### 投稿の作成

```
1. ユーザーがフォームに入力
2. フロントエンドで CreatePostSchema (Zod) によるバリデーション
3. API リクエスト送信
4. バックエンドで同じ CreatePostSchema で再バリデーション
5. Drizzle ORM 経由で Aurora PostgreSQL に保存
6. レスポンスを返却
```

### 匿名性の担保

- 公開画面では `authorId` を含めない
- API レスポンスから投稿者情報を除外するミドルウェアで制御
- 詳細は [ガバナンスポリシー](governance.md) を参照

## インフラストラクチャ

### ローカル開発環境

Docker Compose で以下のサービスをローカル起動:

| サービス       | イメージ              | ポート |
| -------------- | --------------------- | ------ |
| PostgreSQL     | postgres:15           | 5432   |
| DynamoDB Local | amazon/dynamodb-local | 8000   |

### 本番環境 (AWS)

AWS CDK (TypeScript) で管理予定:

| サービス | AWS リソース                    | 用途                     |
| -------- | ------------------------------- | ------------------------ |
| API      | API Gateway + Lambda            | バックエンド API         |
| DB       | Aurora PostgreSQL Serverless v2 | メインデータベース       |
| KVS      | DynamoDB                        | セッション・キャッシュ等 |
| 静的配信 | S3 + CloudFront                 | フロントエンド配信       |
| IaC      | AWS CDK                         | インフラ管理             |

詳細は [IaC 選定 Spike](spike-iac-selection.md) を参照。

## セキュリティ

- 原則匿名表示（投稿者情報は内部のみ保持）
- 追跡は厳格な承認プロセスを経て実施（[ガバナンスポリシー](governance.md)）
- 監査ログは 2 年間保管
- IAM 最小権限の原則（CDK の `grant*` メソッドで自動管理）

## 技術選定の根拠

| 選定            | 根拠                                                                          | 詳細                                     |
| --------------- | ----------------------------------------------------------------------------- | ---------------------------------------- |
| Drizzle ORM     | Aurora Data API ネイティブサポート、サーバーレス最適化、TypeScript ネイティブ | [ORM 選定 Spike](spike-orm-selection.md) |
| AWS CDK         | TypeScript 統一、テスト可能性、CloudFormation ステート自動管理                | [IaC 選定 Spike](spike-iac-selection.md) |
| Hono            | 軽量、Lambda 対応、TypeScript ファースト                                      | -                                        |
| Zod             | ランタイムバリデーション + 型推論、フロントエンド・バックエンド共有           | -                                        |
| pnpm workspaces | 高速なパッケージ管理、ディスク効率、monorepo サポート                         | -                                        |
