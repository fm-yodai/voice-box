---
name: design-system
description: >-
  voice-box のデザインシステムガイド。DTCG 形式のデザイントークン（primitive/semantic-light/
  semantic-dark/component）、江戸伝統色パレット、トークンビルドパイプライン（tokens:build →
  生成 CSS / Tailwind）、ライト/ダークテーマ、Tailwind CSS、design/ の .pen について扱う。
  色・余白・トークン・テーマ・スタイリング作業時に使う。「デザイントークン」「色」「テーマ」
  「ダークモード」「Tailwind」「.pen」で起動。
paths: "design/**,packages/frontend/src/assets/**,**/*.css,**/*.pen"
---

# voice-box デザインシステム

DTCG（W3C Design Tokens Format Module 2025.10）準拠のトークン駆動。調査根拠は
[design/research-report-design-system.md](../../../design/research-report-design-system.md)。

## トークン構成（`design/tokens/`、DTCG `.tokens.json`）

| ファイル | 役割 |
|---------|------|
| `primitive.tokens.json` | 原始値（江戸伝統色: 藍 ai / 紅 kurenai 等のスケール 50–900） |
| `semantic-light.tokens.json` / `semantic-dark.tokens.json` | 用途別（テーマ別。primitive を参照） |
| `component.tokens.json` | コンポーネント単位 |

## ビルドパイプライン

```bash
pnpm tokens:build   # → packages/frontend/src/assets/generated/
                    #    tokens.css / tokens-dark.css / tailwind-tokens.mjs
```

生成物（`src/assets/generated/`）は **gitignore 対象**。トークンを変えたら必ず再ビルド。

## ルール

- 色・余白・フォントは**トークン（CSS変数）で指定。ハードコード値禁止**
- ライト/ダーク/system は semantic-light/dark の切替で表現
- Tailwind はトークン由来の `tailwind-tokens.mjs` を使う
- `.pen` ファイルは Pencil MCP 経由でのみ読み書き（Read/Grep 不可）
- 和風×モダンの落ち着いたトーン。派手な演出を避ける

## 変更手順

トークン JSON 編集 → `pnpm tokens:build` → frontend で反映確認 → 影響コンポーネントを目視

関連: [[app-architecture]] [[project-knowledge]]
