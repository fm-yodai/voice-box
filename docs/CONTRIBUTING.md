# コントリビューションガイド

voice-box プロジェクトへの貢献をお考えいただきありがとうございます。
このドキュメントでは、開発に参加するための手順と規約を説明します。

## 開発環境のセットアップ

[README.md](../README.md) の「セットアップ」セクションを参照してください。

## ブランチ戦略

```
main
 └── issue-{番号}-{概要}   # 各 Issue に対応するブランチ
```

- `main` ブランチに直接 push しない
- Issue ごとにブランチを作成し、Pull Request でマージする
- ブランチ名の例: `issue-4-operator-workflow`, `issue-19-spike-orm`

## Issue テンプレート

本プロジェクトでは以下の Issue テンプレートを用意しています:

- **Epic**: 大きな機能単位のトラッキング
- **Story**: ユーザーストーリー単位の実装タスク
- **Spike**: 技術調査・検証タスク

## コミットメッセージ

以下の形式に従ってください:

```
<変更内容の要約> #<Issue番号>

(必要に応じて詳細な説明)
```

例:

```
運営オペレーションドキュメントの追加 #4
GitHub Issueテンプレートの追加: Epic, Spike, Story
```

## コードスタイル

### 全般

- TypeScript を使用（JavaScript は原則禁止）
- Biome によるリント・フォーマット・import ソート統一
- `pnpm check` が CI で実行される（lint + format）

### Biome 設定

| 設定       | 値                   |
| ---------- | -------------------- |
| セミコロン | あり                 |
| クォート   | ダブルクォート (`"`) |
| インデント | 2 スペース           |
| 末尾カンマ | ES5                  |
| 行幅       | 100 文字             |

設定ファイル: `biome.json`（ルート直下）

### TypeScript

- `strict: true` を使用
- 未使用変数はエラー（`_` プレフィックスで除外可能）
- 型定義は `@voice-box/shared` パッケージに集約

### バリデーション

- Zod スキーマを `packages/shared/src/schemas/` に定義
- フロントエンド・バックエンドの両方で同じスキーマを使用
- 型は `z.infer<typeof Schema>` で導出

## Pull Request

### PR 作成時のチェックリスト

- [ ] `pnpm typecheck` が通ること
- [ ] `pnpm lint` が通ること
- [ ] `pnpm format:check` が通ること
- [ ] `pnpm test` が通ること（テストがある場合）
- [ ] 関連する Issue 番号を PR に記載

### レビュー

- PR は最低 1 名のレビューを経てマージ
- CI が全て通過していること

## パッケージ構成

本プロジェクトは pnpm workspaces による monorepo 構成です:

| パッケージ            | 説明                     |
| --------------------- | ------------------------ |
| `@voice-box/frontend` | Vue 3 フロントエンド     |
| `@voice-box/backend`  | Hono バックエンド API    |
| `@voice-box/shared`   | 共有型定義・Zod スキーマ |

### パッケージ間の依存関係

```
frontend ──→ shared
backend  ──→ shared
```

`shared` パッケージを変更した場合は、必ずビルドしてから他パッケージの開発を行ってください:

```bash
pnpm --filter @voice-box/shared build
```

## 新しいスキーマの追加

1. `packages/shared/src/schemas/` に新しいファイルを作成
2. Zod スキーマと型を定義
3. `packages/shared/src/schemas/index.ts` からエクスポート
4. `packages/shared/src/index.ts` から再エクスポート
5. `pnpm --filter @voice-box/shared build` でビルド

## 新しい API ルートの追加

1. `packages/backend/src/routes/` に新しいファイルを作成
2. Hono のルーターを定義
3. `packages/backend/src/app.ts` でルートを登録
