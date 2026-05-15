---
name: monorepo-pnpm
description: >-
  voice-box の pnpm workspace monorepo 運用ガイド。pnpm-workspace.yaml、workspace:* 依存、
  shared を先にビルドする依存ルール、ルートスクリプト、パッケージ追加、Biome（lint/format/import）、
  Node 20 / pnpm 10（.nvmrc）について扱う。
  「pnpm」「monorepo」「パッケージ追加」「workspace」「Biome」「lint が通らない」で起動。
---

# voice-box monorepo (pnpm)

4 パッケージ: `shared`（Zod 型の単一ソース）/ `backend`（Hono）/ `frontend`（Vue3）/ `infra`（CDK）。
Node 20・pnpm 10（`.nvmrc` / `package.json` engines）。

## 依存ルール（最重要）

**shared を変更したら必ず先にビルド**してから frontend/backend が新しい型を消費できる:

```bash
pnpm --filter @voice-box/shared build   # 他パッケージの作業前に実行
pnpm build                               # 全パッケージ（-r）
```

CI も typecheck/test の前に shared を build している（`.github/workflows/ci.yml`）。

## よく使うコマンド

```bash
pnpm dev:frontend / pnpm dev:backend
pnpm typecheck                 # 全パッケージ tsc --noEmit
pnpm check / pnpm check:fix    # Biome lint + format（PR 前必須）
pnpm test / pnpm test:coverage # Vitest（80% 閾値）
pnpm --filter @voice-box/<pkg> <script>   # 個別パッケージ
```

## Biome（lint / format / import sort を 1 ツールで）

- ESLint/Prettier は使わない。設定は `biome.json`
- ダブルクォート / セミコロン必須 / 2 スペース / 末尾カンマ ES5 / 100 桁
- TypeScript のみ（plain JS 不可）
- Vue ファイルは未使用変数/import の lint を無効化（Biome の誤検知回避）

## パッケージ追加手順

`packages/<name>/` 作成 → `package.json`（name は `@voice-box/<name>`）→ 依存は
`workspace:*` で参照 → ルート `pnpm-workspace.yaml` が `packages/*` を拾う → `pnpm install`

## Gotchas

- `.nvmrc` / `pnpm-lock.yaml` は保護対象（hook がブロック）。バージョン変更は意図的に手動で
- 型を手書きしない（shared の Zod から `z.infer`。[[app-architecture]]）

関連: [[app-architecture]] [[testing]] [[system-design]]
