# Architecture Decision Records (ADR)

voice-box の設計上の判断を記録するインデックス。詳細は `docs/adr/NNNN-<slug>.md` の個別ファイルに書く。

## 運用ルール

- **参照**: 判断の経緯を知りたいときは下の一覧から該当 ADR を開く（全文ロード不要）
- **新規追加**: セッション中に設計判断が発生したら `adr-from-session` スキルで個別ファイルを生成し、このインデックスを更新する。SessionEnd フックが起動を促す
- **既存判断の変更**: 既存 ADR を上書きせず、新規 ADR を追加して旧 ADR の `status:` を `廃止` にし、置き換え先をリンクする
- **ステータス**: `暫定` → 実装で妥当性確認後に `採用` → 置き換えられたら `廃止`
- **Spike との関係**: `docs/spike-*.md` は確定済みの技術調査記録。関連 ADR からはリンクで参照し、内容を重複させない

## 一覧

| ID | カテゴリ | テーマ | 採用した選択 | ステータス |
|----|---------|--------|------------|-----------|
| [ADR-01](./adr/0001-database-dynamodb.md) | データ・DB | データベース選定 | DynamoDB + AWS SDK v3 直接利用 | 採用 |
| [ADR-02](./adr/0002-no-orm.md) | データ・DB | ORM の採否 | ORM 不使用（repository パターン） | 採用 |
| [ADR-03](./adr/0003-iac-aws-cdk.md) | インフラ・運用 | IaC ツール選定 | AWS CDK (TypeScript) | 採用 |
| [ADR-04](./adr/0004-agent-harness.md) | ハーネス・ツール | エージェントハーネス構成 | 厚めスキル群＋solo向け settings.json | 暫定 |
| [ADR-05](./adr/0005-mvp-scope-sla-reframe.md) | プロダクト・スコープ | MVP スコープ確定と「放置しない」担保のリフレーム | 投稿＋公開画面＋運営ステータス＋AI対話的意見構築。SLA計測は非対象 | 暫定 |

## カテゴリ別

### データ・DB

| ID | テーマ | 選択 | 根拠 |
|----|--------|------|------|
| [ADR-01](./adr/0001-database-dynamodb.md) | データベース選定 | DynamoDB + AWS SDK v3 | 無料枠内・VPC 不要・Lambda 親和性 |
| [ADR-02](./adr/0002-no-orm.md) | ORM の採否 | ORM 不使用 | シングルテーブル設計に ORM の利点が薄く依存を増やさない |

### インフラ・運用

| ID | テーマ | 選択 | 根拠 |
|----|--------|------|------|
| [ADR-03](./adr/0003-iac-aws-cdk.md) | IaC ツール選定 | AWS CDK (TypeScript) | TS 統一・テスト可能・CFn ステート自動管理 |

### ハーネス・ツール

| ID | テーマ | 選択 | 根拠 |
|----|--------|------|------|
| [ADR-04](./adr/0004-agent-harness.md) | エージェントハーネス構成 | thanks-card 構造を solo・Biome・CDK 実態に適応 | 既存 docs/ と二重管理せず索引化 |

### プロダクト・スコープ

| ID | テーマ | 選択 | 根拠 |
|----|--------|------|------|
| [ADR-05](./adr/0005-mvp-scope-sla-reframe.md) | MVP スコープと「放置しない」担保 | 投稿＋公開画面＋運営ステータス＋AI対話的意見構築。SLA計測は非対象・透明性で担保 | Sprint に落とせる受け入れ基準を確定。品質優先でスコープを絞る |
