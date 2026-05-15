---
name: compose-issue
description: GitHub Issue の本文を対話的に作成・リッチ化するスキル。新規 Epic/Story/Spike 作成、空 Issue への本文追記、薄い本文の補強に対応。「issue作って」「エピック書いて」「ストーリー書いて」「spike書いて」「#番号を埋めて」「#番号をリッチ化」「issueをリッチ化」で起動
argument-hint: <issue-url-or-number-or-title-or-empty>
allowed-tools: Read, Grep, Glob, Bash(gh issue:*), Bash(gh api:*), Bash(gh label:*), Bash(rg:*), Bash(ls:*), Bash(cat:*), Bash(wc:*)
---

## 入力の確認

!`echo "ARGUMENTS: $ARGUMENTS"`

## 既存ラベル

!`gh label list --limit 50 2>/dev/null`

## 役割

GitHub Issue の本文を、対話で `.github/ISSUE_TEMPLATE/{epic,story,spike}.yml` の構造に沿った形に仕上げる。新規作成と既存リッチ化の両方に対応。`team-dev` でそのまま実装に渡せる粒度を目指す。

| モード | 起動例 | 動作 |
|--------|--------|------|
| 既存リッチ化 | `/compose-issue #36` または URL | 既存 issue を読み、薄い/空セクションを埋めて `gh issue edit` |
| 新規（タイトル指定） | `/compose-issue "OAuth state 検証"` | タイトルから draft → 対話確定 → `gh issue create` |
| 新規（フリー） | `/compose-issue` | 種別とタイトルから聞く → 同上 |

**遵守事項:**

1. **憶測で書かない**。不明確なら Phase 4 で AskUserQuestion。`[要確認: 説明]` プレースホルダを残す
2. **既存資料から自明な部分は推論で埋める**。重複質問しない
3. **`gh` CLI のみ使用**（GitHub MCP は使わない）
4. **ユーザー承認なしで `gh issue create` / `edit` を実行しない**（Phase 6 で必ずプレビュー）
5. **CLAUDE.md / スキルの Gotchas を本文に転記しない**（参照のみ）。匿名性・セキュリティ影響がある issue はその旨を明記

## Phase 1: モード判定とコンテキスト取得

引数パターンで分岐:

| 引数 | 判定 |
|------|------|
| 空 | 新規（種別・タイトル未定） |
| 整数 / `#整数` / issues URL | 既存リッチ化 |
| その他文字列 | 新規（タイトル候補） |

既存リッチ化: `gh issue view <N> --json number,title,body,labels,state,url`。本文 `wc -c` で 空(0–100)/薄い(100–500)/充実(500+) を区分。

共通で読み込む: `.github/ISSUE_TEMPLATE/{epic,story,spike}.yml`、`docs/ADR.md`（関連 ADR 特定）。種別・領域に応じて `project-knowledge` / 領域スキル（`dynamodb`, `cdk-infra`, `design-system` 等）を Read。

## Phase 2: 種別判定（epic / story / spike）

- 既存リッチ化: `type:epic|story|spike` ラベルで判定。無ければ AskUserQuestion で確認しラベル付与
- 新規: タイトルから第一候補を推論して AskUserQuestion で確認
  - 複数機能・1スプリント超 → **epic**
  - 単一ユーザーストーリー（As a / I want / So that）→ **story**
  - 技術調査・設計検討 → **spike**
  - 迷ったら epic（後で分解可能）

## Phase 3: AI draft 生成（テンプレ構造に沿う。不明箇所は `[要確認:]`）

**Epic（`epic.yml`）:** Goal / Success Criteria / Out of Scope / Notes

**Story（`story.yml`）:** User Story（As a / I want / So that）/ Acceptance Criteria（このストーリー固有・検証可能な箇条書き）/ Definition of Ready は転記せずチェック観点として確認（AC 明確 / 依存解消 / セキュリティ・匿名性影響を確認）

**Spike（`spike.yml`）:** Question（何を明らかにするか）/ Outcome（結論として何が分かれば Done か）。既存 `docs/spike-*.md` のフォーマットを参考に

既存リッチ化は **空・薄いセクションのみ** draft。埋まっている箇所は原則保持。

## Phase 4: セクションごとの対話的調整

セクションを1つずつ提示し AskUserQuestion で「採用 / 修正 / 自分で書く / [要確認] を質問」。一気に複数質問しない。各質問は最大4選択肢。

## Phase 5: 品質チェック（self-review）

| チェック | 対処 |
|---------|------|
| AC の検証可能性（"使いやすい"等の曖昧表現） | [要修正] を付け具体化を依頼 |
| 必須セクション空欄（yml の `required: true`） | 記入を依頼 |
| 親 Epic の存在（story/spike） | `gh issue view` で確認 |
| 匿名性・セキュリティ影響 | 該当時は本文に明記し `security` / `anonymous` ラベル候補を提示 |
| `[要確認:` 残存 | Phase 4 に戻る |

## Phase 6: プレビュー & 適用

最終 body をフル表示し承認を取る。承認後:

```bash
cat > /tmp/issue-body.md <<'EOF'
<最終 body>
EOF

# 新規
gh issue create --title "<title>" --body-file /tmp/issue-body.md \
  --label "type:epic"  # または type:story / type:spike
  # 必要に応じ --label status:backlog / priority:medium / security / anonymous

# 既存リッチ化（既存ラベル保持）
gh issue edit <N> --body-file /tmp/issue-body.md
```

完了後、issue URL を表示。Epic を作成/リッチ化した場合は `/team-dev #N` で実装に渡せる旨を案内。

## エラーハンドリング

| 状況 | 対処 |
|------|------|
| `gh` 未認証 | `gh auth login` を案内して中断 |
| 既存 issue クローズ済 | 続行/中断を確認 |
| 既存 body 充実(500+) | 上書き / 追記を確認 |
| コンテキスト読込失敗 | 警告のみ。テンプレ構造だけで draft（精度低下） |

## 注意

- 既存リッチ化は add 主体で diff 最小化
- yml 構造が変わったら Phase 3 のマッピングも更新
- 推論根拠は body 末尾に `<!-- 推論根拠: ADR-NN / docs/... -->` の HTML コメントで残す
