# セットアップガイド

voice-box（目安箱）の開発環境と AI エージェントハーネスのセットアップ手順。

## 前提条件

| ツール | バージョン | 用途 |
|--------|-----------|------|
| Node.js | v20（`.nvmrc`） | フルスタック TypeScript ランタイム |
| pnpm | v10+ | monorepo パッケージ管理 |
| Docker / Docker Compose | 最新 | DynamoDB Local（port 8000） |
| Git | 最新 | バージョン管理 |
| GitHub CLI (`gh`) | 最新 | issue/PR 操作スキルで使用（`gh auth login` 済み） |
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | 最新 | AI コーディングエージェント |

`.nvmrc` があるため `nvm use` で Node 20 に切り替わる（nvm 利用時）。

## クイックスタート

```bash
git clone git@github.com:fm-yodai/voice-box.git
cd voice-box

nvm use                                    # Node 20（.nvmrc）
corepack enable && corepack prepare pnpm@10 --activate   # pnpm 未導入の場合

pnpm install
pnpm --filter @voice-box/shared build      # 他パッケージの前に必須
docker compose up -d                       # DynamoDB Local (port 8000)

pnpm dev:backend   # http://localhost:3000
pnpm dev:frontend  # Vite dev server
```

Claude Code はこのディレクトリで `claude` を起動すれば、プロジェクト共通の hooks・スキルが自動有効化される。

## AI エージェントハーネス全体像

Claude Code を「ハーネス（指示・自動化・知識の集合）」で制御する。共有設定はコミット、個人設定は gitignore する公式パターン（[Claude Code Settings](https://code.claude.com/docs/en/settings)）に従う。

### ファイル分担

| ファイル | コミット | 役割 |
|---------|:--------:|------|
| `CLAUDE.md` | ✓ | Claude 用エントリ（プロジェクト指示・ハーネス索引）。AGENTS.md は使わない |
| `.claude/settings.json` | ✓ | 共有: hooks 4種 + secrets の permissions.deny |
| `.claude/settings.local.json` | ✗ (gitignore 推奨) | 個人ごとの permissions・MCP |
| `.claude/skills/` | ✓ | プロジェクトスキル群 |
| `.claude/commands/` | ✓ | スラッシュコマンド（`/issue`） |
| `scripts/hooks/*.sh` | ✓ | フックスクリプト本体 |
| `docs/ADR.md` + `docs/adr/` | ✓ | 設計判断の記録 |

> `.claude/settings.local.json` を gitignore したい場合は `.gitignore` に追記する（現状未追加。個人 permissions が増えたら検討）。

### Claude Code フック（`.claude/settings.json`）

| イベント | スクリプト/動作 | 失敗時 |
|---------|----------------|--------|
| **PreToolUse** (Edit/Write) | `scripts/hooks/protect-files.sh` — `.env*` / `pnpm-lock.yaml` / `.nvmrc` 書込ブロック | 書込拒否 (exit 2) |
| **PostToolUse** (Edit/Write) | `scripts/hooks/format-on-save.sh` — `packages/` 内を Biome フォーマット | 続行（Biome 未導入なら無動作） |
| **Stop** | （プロンプト）コード変更時に `pnpm check` / `typecheck` / `test` / shared build を自己確認 | advisory |
| **SessionEnd** | （プロンプト）設計判断があれば `adr-from-session` で `docs/ADR.md` に追記 | スキル起動 |

> 個人で hook を無効化したい場合は `.claude/settings.local.json` で `hooks` を上書きできる（公式階層: managed > local > project > user）。

### スキル（`.claude/skills/`）

| スキル | 種別 | 用途 |
|-------|------|------|
| `project-knowledge` | ドメイン | ビジョン・匿名性ガバナンス・SLA・ロール |
| `system-design` | ドメイン | 技術選定・API・コスト・Spike 索引 |
| `app-architecture` | ドメイン | monorepo 構造・repository パターン・追加手順 |
| `dynamodb` | ドメイン | DynamoDB アクセス層・GSI・single-table |
| `cdk-infra` | ドメイン | AWS CDK スタック・デプロイ |
| `monorepo-pnpm` | ドメイン | pnpm workspace・Biome・shared build-first |
| `testing` | ドメイン | Vitest・app.request()・カバレッジ |
| `design-system` | ドメイン | DTCG トークン・テーマ・.pen |
| `team-dev` | ワークフロー | 並行実装（エージェントチーム） |
| `compose-issue` | ワークフロー | Issue 本文の対話的作成・リッチ化（epic/story/spike） |
| `dig` | ワークフロー | 計画の曖昧点を AskUserQuestion で詰める |
| `adr-from-session` | ワークフロー | セッションの設計判断を ADR 化 |

ドメインスキルは説明文マッチで自動起動。ワークフロースキルは `/skill-name` で手動起動、または他スキルから内部呼出し。

#### 名前衝突の取り扱い

プラグイン由来スキルと同名のものがある。原則 **プロジェクトローカルが優先**（description が voice-box 固有語でマッチするため）。

| 衝突 | 優先 | 備考 |
|------|------|------|
| `dig` (project) vs `dig:dig` (plugin) | project | 計画の曖昧点詰めは project 側 |
| `compose-issue` (project) vs `engineering` プラグインの issue 系 | project | epic/story/spike テンプレ適合は project 側。`engineering` プラグインは未強制（個人裁量） |

汎用機能が欲しい場合のみプラグイン側を明示指定する。

### ハーネス整合性チェック

```bash
bash scripts/lint-harness.sh
```

CI（`.github/workflows/harness-lint.yml`）が PR 毎に自動実行する。

## 開発コマンド

`CLAUDE.md` の Commands セクションを参照（`pnpm dev:*` / `check` / `typecheck` / `test` / `cdk:*`）。
