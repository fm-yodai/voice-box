---
id: ADR-04
title: エージェントハーネス構成
category: ハーネス・ツール
status: 暫定
date: 2026-05-15
---

# ADR-04: エージェントハーネス構成 — thanks-card 構造を solo・Biome・CDK 実態に適応

**ステータス:** 暫定

## コンテキスト

`~/thanks-card` の成熟したエージェントハーネス（AGENTS.md + 多数のスキル + 強制プラグイン + フック + CI 整合性チェック）を参照し、voice-box にハーネスを整備したい。ただし voice-box は (1) 既に稼働中（thanks-card は Sprint 0 設計フェーズ）、(2) solo 開発（thanks-card はチーム強制 baseline 前提）、(3) スタックが Biome / AWS CDK / nvmrc（thanks-card は oxlint+eslint+prettier / SST / mise）、(4) 既存 docs/ が充実、という相違がある。

## 検討した選択肢

| 選択肢 | メリット | デメリット |
|--------|---------|-----------|
| thanks-card を丸ごと移植（却下） | 構造が揃う | スタック不一致・solo に過剰・docs/ と二重管理 |
| 実態適応（採用） | voice-box の実態に最適・既存 docs/ を索引化し二重管理回避 | thanks-card と完全一致はしない |
| 最小限のみ（却下） | 構築コスト小 | ユーザー要望（厚めスキル）を満たさない |

## 決定

ユーザー選択に基づき以下を採用:

- **スキル**: 厚め。ドメインスキル（project-knowledge / system-design / app-architecture / dynamodb / cdk-infra / monorepo-pnpm / testing / design-system）は既存 docs/ を**参照する索引＋運用 gotcha** とし内容を重複させない。ワークフロー（dig / adr-from-session / compose-issue）を追加
- **team-dev**: バグ修正（パス `/home/yodai/voice-box`、スタック記述の実態化）の上で存続。新規ワークフロースキルで補完
- **settings.json**: solo 向け最小。hooks 4種（protect-files / format-on-save[Biome] / Stop 検証リマインド / SessionEnd ADR 棚卸し）＋ secrets の permissions.deny。プラグイン強制・extraKnownMarketplaces は導入しない
- **AGENTS.md**: 作らない。Claude Code 単独運用のため CLAUDE.md に集約
- **ADR 体系**: `docs/ADR.md` インデックス＋ `docs/adr/` を新設。既存 spike-*.md は ADR からリンク参照

## 結果

- 良い帰結: 稼働中 solo プロジェクトに過不足ないハーネス。知識の単一ソース維持
- 注意すべき帰結: ステータスは暫定。運用して有効性を確認後 `採用` に更新。次フェーズでプロダクト思想・インセプションデッキを project-knowledge に統合予定
- 整合性は `scripts/lint-harness.sh` / `.github/workflows/harness-lint.yml` で検証

## 関連

- [ADR-03](./0003-iac-aws-cdk.md) — フック・CI は CDK/Biome 前提に調整
