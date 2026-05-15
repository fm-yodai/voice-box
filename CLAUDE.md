# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

voice-box (目安箱) is an anonymous voice box platform for organizations. Employees can submit feedback, bug reports, and suggestions anonymously on public screens, while the system internally tracks author IDs to prevent abuse. An SLA-driven response system ensures submissions are never ignored.

## 作業方針

### 基本ワークフロー

1. **探索** — 関連コード・docs・スキルを十分に読み、変更の影響範囲を把握する
2. **計画** — 大きな変更は Plan Mode で合意を取ってから実装に入る。曖昧点は `dig` スキルで詰める
3. **実装** — 計画に基づいて既存パターンに沿って変更する
4. **検証** — `pnpm check` / `pnpm typecheck` / `pnpm test` を実行して品質を確認する

### コミュニケーション

- 不明点や曖昧な指示があれば、推測せず AskUserQuestion ツールで質問する
- 複数のアプローチが考えられる場合も判断を仰ぐ
- 設計判断（明示・暗黙）が発生したら `adr-from-session` で `docs/ADR.md` に記録する

## Commands

```bash
# Development
pnpm dev:frontend          # Vite dev server
pnpm dev:backend           # tsx watch at http://localhost:3000

# Quality checks (run before PR)
pnpm typecheck             # tsc --noEmit across all packages
pnpm check                 # Biome lint + format check
pnpm check:fix             # Biome lint + format auto-fix
pnpm test                  # Vitest across all packages
pnpm test:coverage         # Coverage report (80% threshold enforced)

# Run tests for a specific package
pnpm --filter @voice-box/backend test
pnpm --filter @voice-box/frontend test
pnpm --filter @voice-box/shared test

# Build
pnpm --filter @voice-box/shared build   # MUST run before other packages
pnpm build                               # All packages

# Infrastructure
pnpm cdk:synth             # Synthesize CloudFormation
pnpm cdk:diff              # Show infrastructure changes
pnpm cdk:deploy            # Deploy to AWS
```

## Architecture

pnpm monorepo with four packages sharing TypeScript strict mode:

```
packages/
  shared/     → Zod schemas + type definitions (dependency of frontend & backend)
  backend/    → Hono REST API (Lambda + local dev dual-mode)
  frontend/   → Vue 3 SPA (Vite + Tailwind CSS + Pinia)
  infra/      → AWS CDK (Lambda, API Gateway, DynamoDB, S3+CloudFront)
```

**Dependency rule**: `shared` must be built (`pnpm --filter @voice-box/shared build`) before frontend or backend can consume updated types.

### Backend (Hono)

- Entry: `packages/backend/src/index.ts` — Lambda handler when `NODE_ENV=production`, local dev server otherwise
- App: `packages/backend/src/app.ts` — route registration + middleware
- **Repository pattern**: interfaces in `repositories/` with DynamoDB implementations in `repositories/dynamodb/`. Injected via middleware and accessed through `c.get("repositories")`
- Routes in `packages/backend/src/routes/` — add new routes here, then register in `app.ts`
- Tests use `app.request()` directly (no HTTP server needed)

### Frontend (Vue 3)

- Pages in `pages/`, layouts in `layouts/`, shared UI in `components/`
- Routing: Vue Router (`router/index.ts`)
- State: Pinia stores (`stores/`)
- Composables in `composables/`

### Shared (Zod schemas)

- All data models defined as Zod schemas in `packages/shared/src/schemas/`
- Types derived via `z.infer<typeof Schema>` — single source of truth for both frontend and backend
- Adding a new schema: create file in `schemas/`, export from `schemas/index.ts`, re-export from `src/index.ts`, then rebuild shared

## Code Style

- **Biome** handles lint, format, and import sorting (not ESLint/Prettier)
- Double quotes, semicolons always, 2-space indent, trailing commas ES5, 100-char line width
- TypeScript only (no plain JS)
- Vue files: unused variable/import lint rules are disabled (Biome false positives)

## Testing

- **Vitest** with co-located test files: `<filename>.test.ts`
- 80% coverage threshold (lines, functions, branches, statements)
- Backend: test with `app.request()` — no supertest or HTTP server
- Frontend: Vue Test Utils + Happy DOM

## Commit Messages

```
<summary> #<issue-number>

(optional detailed explanation)
```

## Local Development Setup

Requires Node.js v20+ (`.nvmrc`), pnpm v10+, Docker Compose for DynamoDB Local (port 8000).

## Language

Project documentation and issues are in Japanese. Code, variable names, and technical identifiers are in English.

## AI エージェントハーネス

セットアップ手順とハーネス全体像は [SETUP.md](SETUP.md) を参照。設計判断の履歴は [docs/ADR.md](docs/ADR.md)。

### スキル（`.claude/skills/`）

ドメイン知識は説明文マッチで自動起動、ワークフローは手動 or 内部呼出し。各スキルは既存 `docs/` を参照する索引＋運用 gotcha として機能し、知識を二重管理しない。

- ドメイン: `project-knowledge`（匿名性ガバナンス）/ `system-design` / `app-architecture` / `dynamodb` / `cdk-infra` / `monorepo-pnpm` / `testing` / `design-system`
- ワークフロー: `team-dev`（並行実装）/ `compose-issue`（Issue 作成・リッチ化）/ `dig`（曖昧点を詰める）/ `adr-from-session`（ADR 化）
- コマンド: `/issue`（単一 Issue 対応）

### フック（`.claude/settings.json`）

PreToolUse=保護ファイル書込ブロック / PostToolUse=Biome 自動フォーマット / Stop=検証リマインド / SessionEnd=ADR 棚卸し。secrets は `permissions.deny`。

### 整合性チェック

`bash scripts/lint-harness.sh`（CI: `.github/workflows/harness-lint.yml`）。
