---
name: app-architecture
description: >-
  voice-box のアプリケーションアーキテクチャを提供する。monorepo 構造、packages 間依存ルール、
  backend の Hono ルート + repository パターン（DI via middleware / c.get("repositories")）、
  frontend の Vue 構造、shared の Zod 単一ソース、ファイル配置、レイヤー責務について
  質問されたときに使う。「ディレクトリ構造」「どこに置く」「repository パターン」
  「ルート追加」「スキーマ追加」「パッケージ依存」で起動。
---

# voice-box アプリケーションアーキテクチャ

詳細なディレクトリツリーは [docs/ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)。本スキルは
「変更時の正しい手順」に絞る。

## パッケージ依存ルール（厳守）

```
frontend ─┐
          ├─→ shared   （Zod スキーマ = 型の単一ソース）
backend ──┘
infra （独立。CDK）
```

- **shared を変更したら必ず `pnpm --filter @voice-box/shared build`** してから frontend/backend が新しい型を消費できる
- frontend は backend を import しない（API 経由のみ）

## backend: ルート追加の手順

1. `packages/shared/src/schemas/` に Zod スキーマを追加（必要なら）→ `schemas/index.ts` と `src/index.ts` から re-export → shared を build
2. `packages/backend/src/routes/<name>.ts` にルートを作成
3. `packages/backend/src/app.ts` にルートを登録
4. データアクセスは `c.get("repositories")` 経由（直接 DynamoDB を叩かない）。[[dynamodb]]
5. `<name>.test.ts` を作成し `app.request()` でテスト。[[testing]]

**repository パターン**: interface は `repositories/<x>-repository.ts`、DynamoDB 実装は
`repositories/dynamodb/`。middleware で注入され `c.get("repositories")` でアクセス。
テストはモックリポジトリを注入（DynamoDB 非依存）。

## frontend: 構成

`pages/`（薄く）/ `layouts/` / `components/` / `composables/` / `stores/`（Pinia）/
`router/index.ts`。型は `@voice-box/shared` から import。

## shared: スキーマ追加の手順

`schemas/<x>.ts` 作成 → `z.infer<typeof Schema>` で型導出 → `schemas/index.ts` から export →
`src/index.ts` から re-export → `pnpm --filter @voice-box/shared build`

## Gotchas

- ルート/ハンドラにビジネスロジック・DB 直接アクセスを書かない（repository 経由）
- 手書きの型定義を作らない（Zod から `z.infer`）
- 匿名性: API レスポンスから投稿者情報を除外する経路を壊さない（[[project-knowledge]]）

関連: [[system-design]] [[dynamodb]] [[testing]] [[monorepo-pnpm]]
