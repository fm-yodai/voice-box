---
name: dig
description: 計画・実装方針の曖昧点を AskUserQuestion で構造化質問して詰める。「曖昧点を詰めて」「dig」「計画を掘り下げて」「方針を確定したい」「ambiguity を解消」で起動。team-dev / issue / Plan agent から呼ばれる前提
argument-hint: <plan-file-path-or-question-focus>
allowed-tools: Read, Edit, Write, Grep, Glob, AskUserQuestion
---

## 役割

計画ファイル（または会話中の計画）に残っている曖昧点を **AskUserQuestion で 2〜4 個の構造化質問** によって解消する。決定は計画ファイルに書き戻す。
voice-box の既存制約（CLAUDE.md / docs/ADR.md / プロジェクトスキル）と整合する選択肢を提示することを最優先する。

**遵守事項:**

1. **AskUserQuestion 必須**: 会話文での質問はしない。必ず構造化された選択肢付きで聞く
2. **2〜4 問まで**: 1 ラウンドで聞きすぎない。残った曖昧点はループで次ラウンドに回す
3. **CLAUDE.md / 確定技術選定と矛盾する選択肢を提示しない**: 例として AWS SDK v2、ORM 導入（Drizzle 等）、SST、ESLint/Prettier、投稿者情報を公開経路に流す案を含む選択肢を出さない
4. **既存パターンに揃える選択肢を先頭に置く**: 「(既存に沿う / 推奨)」のラベルを付けて筆頭に
5. **判断できることは聞かない**: CLAUDE.md / 関連スキル / docs/ADR.md / docs/*.md を読んで分かることはユーザーに聞かない

## 入力

- `$ARGUMENTS` が **ファイルパス** → そのファイルを Read してそこの曖昧点を洗い出す
- `$ARGUMENTS` が **質問観点の指定**（例: "DynamoDB schema", "匿名性の扱い"）→ その観点に絞って曖昧点を抽出
- `$ARGUMENTS` が **空** → 直近の会話の計画文脈から曖昧点を抽出

## Phases

### Phase 1: Analyze（曖昧点の抽出）

以下を順に確認:

- `$ARGUMENTS` が指す対象（計画ファイル or 会話文脈）
- `CLAUDE.md` の関連ルール / Code Style
- 関連スキル: `app-architecture`, `system-design`, `dynamodb`, `project-knowledge` 等（必要なら Read）
- `docs/ADR.md` の関連判断

そこから、**実装に踏み切れない曖昧点** を箇条書きで抽出する。
曖昧点が 0 件なら「曖昧点なし」と返して終了。

### Phase 2: Ask（AskUserQuestion を 1 ラウンド）

抽出した曖昧点から、**重要度の高いものから 2〜4 個** を選んで AskUserQuestion を実行する。

| ルール | 詳細 |
|--------|------|
| 質問は具体 | 「どう実装する？」ではなく「どこに置く？」「どの既存 repository に倣う？」 |
| 選択肢は 2〜4 個 | 多すぎる場合は最頻パターンに絞る |
| 既存パターン優先 | 「(既存に沿う / 推奨)」を先頭。`description` に既存ファイル例を 1 行含める |
| 制約違反を出さない | CLAUDE.md / 確定技術選定と矛盾する案は出さない |
| 多肢選択は控えめ | 排他的選択肢でない場合のみ `multiSelect: true` |

質問対象になりやすい項目:

- スコープ境界（含む / 含まない の線引き）
- 既存流用 vs 新規作成
- レイヤー責務（route で扱うか repository に下ろすか 等）
- データモデル選択（DynamoDB PK/SK・GSI 設計、shared Zod スキーマの形）
- エラーハンドリング方針（throw / Result 型 / fail-open）
- 匿名性とトレーサビリティの境界（公開経路に出す/出さない）
- パフォーマンス vs 単純さのトレードオフ

### Phase 3: Apply（決定を記録）

- `$ARGUMENTS` がファイルパス → そのファイルに **Decisions セクション** を追記または更新

```markdown
## Decisions

| Item | Choice | Reason | Notes |
|------|--------|--------|-------|
| <項目> | <選択> | <理由> | <関連ファイル参照や注意点> |
```

- `$ARGUMENTS` が空 → 会話に Decisions テーブルを出力するだけで止める（後段のエージェントが拾う）

### Phase 4: Summarize（決定サマリ表示）

Decisions テーブルと、それに基づく **Next Steps**（次にやるべき具体タスク 2〜5 個）を出力する。

### Phase 5: Re-analyze（曖昧点が残っていればループ）

Phase 1 を再実行し、新たに曖昧点が浮上していれば Phase 2 に戻る。
ループは最大 **3 ラウンド**。それでも残れば「これ以上は実装してから判断したほうがコスト効率が良い」として終了する。

## 注意

- 会話文での質問は禁止（必ず AskUserQuestion）
- 「Other」選択肢は AskUserQuestion が自動付加するため明示しない
- `multiSelect: true` は本当に複数選べる場面のみ（既定 false）
- Decisions セクションを書き戻す際は **既存セクションを破壊しない**（追記または該当行のみ更新）
- ユーザーが「もう十分」と言ったら即座に Phase 4 でサマリを出して終了
