# voice-box (目安箱)

組織内で安心して声を出せる匿名投稿プラットフォーム。
投稿が放置されず、改善につながる組織を支えるために。

## コンセプト

- **原則匿名表示**: ユーザーが安心して率直な意見を表明できる環境
- **放置しない**: 一次受付 SLA を設定し、すべての投稿に対応
- **匿名性と責任の両立**: システム内部では投稿者 ID を保持しつつ、公開画面では匿名

## Non-Goals

- 人事評価への直接利用

## 技術スタック

| レイヤー                | 技術                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------- |
| フロントエンド          | Vue 3 + TypeScript, Vite, Tailwind CSS, Pinia, Vue Router                             |
| バックエンド            | Hono + TypeScript, Zod (バリデーション)                                               |
| データベース            | PostgreSQL (ローカル), Aurora PostgreSQL (本番)                                       |
| ORM                     | Drizzle ORM (推奨: [docs/spike-orm-selection.md](docs/spike-orm-selection.md))        |
| IaC                     | AWS CDK TypeScript (推奨: [docs/spike-iac-selection.md](docs/spike-iac-selection.md)) |
| インフラ                | AWS Lambda, DynamoDB, Aurora PostgreSQL                                               |
| パッケージ管理          | pnpm workspaces (monorepo)                                                            |
| 言語バージョン          | Node.js v20, pnpm >= 10                                                               |
| リンター/フォーマッター | Biome (lint + format + import sorting)                                                |

## ディレクトリ構造

```
voice-box/
├── packages/
│   ├── backend/          # Hono バックエンド API
│   │   └── src/
│   │       ├── app.ts          # Hono アプリケーション定義
│   │       ├── index.ts        # エントリポイント (Lambda + ローカルサーバー)
│   │       ├── middleware/      # ミドルウェア
│   │       └── routes/          # ルートハンドラー
│   ├── frontend/         # Vue 3 フロントエンド
│   │   └── src/
│   │       ├── components/      # 共通コンポーネント
│   │       ├── layouts/         # レイアウトコンポーネント
│   │       ├── pages/           # ページコンポーネント
│   │       ├── router/          # Vue Router 設定
│   │       └── stores/          # Pinia ストア
│   └── shared/           # 共有型定義・スキーマ (Zod)
│       └── src/
│           └── schemas/         # Zod スキーマ (Post, User, Response)
├── docs/                 # プロジェクトドキュメント
├── design/               # デザインアセット・調査
├── .github/              # GitHub テンプレート・ワークフロー
├── docker-compose.yml    # ローカル開発用 DB
├── package.json          # ルート package.json
├── pnpm-workspace.yaml   # pnpm ワークスペース設定
├── tsconfig.json         # ルート TypeScript 設定
└── biome.json            # Biome 設定 (lint + format)
```

## セットアップ

### 前提条件

- Node.js v20 以上 (`.nvmrc` に定義)
- pnpm v10 以上
- Docker / Docker Compose (ローカル DB 用)

### 手順

```bash
# 1. リポジトリをクローン
git clone https://github.com/fm-yodai/voice-box.git
cd voice-box

# 2. Node.js バージョンを合わせる (nvm 使用時)
nvm use

# 3. 依存関係をインストール
pnpm install

# 4. ローカル DB を起動
docker compose up -d

# 5. 共有パッケージをビルド
pnpm --filter @voice-box/shared build

# 6. 開発サーバーを起動
pnpm dev:backend    # バックエンド (http://localhost:3000)
pnpm dev:frontend   # フロントエンド (Vite dev server)
```

### ローカル DB

Docker Compose で PostgreSQL と DynamoDB Local が起動します:

| サービス       | ポート | 用途                              |
| -------------- | ------ | --------------------------------- |
| PostgreSQL     | 5432   | メインデータベース                |
| DynamoDB Local | 8000   | DynamoDB ローカルエミュレーション |

デフォルトの接続情報:

- PostgreSQL: `voicebox:voicebox@localhost:5432/voicebox`

## コマンド一覧

```bash
# 開発
pnpm dev:frontend        # フロントエンド開発サーバー起動
pnpm dev:backend         # バックエンド開発サーバー起動

# ビルド
pnpm build               # 全パッケージのビルド

# 品質チェック
pnpm check               # Biome lint + format チェック
pnpm check:fix           # Biome lint + format 自動修正
pnpm lint                # Biome lint 実行
pnpm format              # Biome フォーマット
pnpm typecheck           # TypeScript 型チェック
pnpm test                # テスト実行

# その他
pnpm clean               # ビルド成果物と node_modules を削除
```

## ドキュメント

- [アーキテクチャ](docs/ARCHITECTURE.md)
- [コントリビューションガイド](docs/CONTRIBUTING.md)
- [ガバナンスポリシー](docs/governance.md)
- [運営オペレーション](docs/operations.md)
- [ORM 選定 Spike](docs/spike-orm-selection.md)
- [IaC 選定 Spike](docs/spike-iac-selection.md)
