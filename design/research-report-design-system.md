# デザインシステム構築 調査レポート — 目安箱プロジェクト

## エグゼクティブサマリー

本レポートは「目安箱」プロダクトのためのデザインシステム構築に向けた包括的な調査結果をまとめたものです。W3Cデザイントークンの標準仕様（DTCG Format Module 2025.10）、デザイントークンの構造と命名規則、江戸時代の伝統色パレット、和風×モダンデザインの融合手法、タイポグラフィ選定、CSS Custom Propertiesによる実装パターン、ダークモード対応、およびPencil MCPとの連携について調査しました。

## リサーチ概要

- **調査日**: 2026-02-07
- **調査範囲**: デザインシステム設計・実装に関する国際標準仕様、日本の伝統色、UIデザインパターン
- **情報源数**: 20+サイト
- **検索クエリ数**: 10+

---

## 1. W3Cデザイントークン標準仕様（DTCG Format Module）

### 1.1 仕様の概要

2025年10月、W3C Design Tokens Community Group（DTCG）は **Design Tokens Format Module 2025.10** の最初の安定版をリリースしました。これはデザイントークンのファイル形式に関するベンダー中立な標準仕様です。[1]

### 1.2 ファイル形式

| 項目         | 値                               |
| ------------ | -------------------------------- |
| フォーマット | JSON                             |
| MIME型       | `application/design-tokens+json` |
| 推奨拡張子   | `.tokens` または `.tokens.json`  |

### 1.3 トークンの基本構造

```json
{
  "token-name": {
    "$value": "値",
    "$type": "型",
    "$description": "説明文"
  }
}
```

**必須/オプションプロパティ:**

| プロパティ     | 必須             | 説明               |
| -------------- | ---------------- | ------------------ |
| `$value`       | ✓                | トークンの実際の値 |
| `$type`        | グループで継承可 | トークンの型       |
| `$description` | -                | 平文による説明     |
| `$deprecated`  | -                | 非推奨フラグ       |
| `$extensions`  | -                | ベンダー固有データ |

### 1.4 サポートされる型

**単純型:**

- `color` — RGB値またはカラースペース定義
- `dimension` — 数値+単位（`px`または`rem`）
- `fontFamily` — 文字列または文字列配列
- `fontWeight` — 1-1000の数値または定義済み文字列
- `duration` — 数値+単位（`ms`または`s`）
- `cubicBezier` — 4要素の数値配列
- `number` — 単位なしの数値

**複合型:** `strokeStyle`, `border`, `transition`, `shadow`, `gradient`, `typography`

### 1.5 グループ構造

グループは型を子トークンに継承でき、ネストも可能です。

```json
{
  "colors": {
    "$type": "color",
    "primary": { "$value": "#165e83" },
    "secondary": { "$value": "#d7003a" }
  }
}
```

### 1.6 参照（エイリアス）

中括弧構文でトークン間の参照が可能です：

```json
{
  "button-bg": {
    "$value": "{colors.primary}"
  }
}
```

### 1.7 グループ拡張

`$extends` で別グループを継承し、上書きも可能：

```json
{
  "button": { "$type": "color", "bg": { "$value": "#165e83" } },
  "button-primary": {
    "$extends": "{button}",
    "bg": { "$value": "#d7003a" }
  }
}
```

### 1.8 命名制約

- トークン/グループ名は `$` で始めてはいけない
- 使用禁止文字: `{`, `}`, `.`
- 循環参照は不許可
- 大文字小文字を区別する

---

## 2. デザイントークンの構造と命名規則

### 2.1 3層トークン構造

成熟したデザインシステムは以下の3層構造を採用しています [2][3]：

**層1: プリミティブトークン（Global/Core）**
生のデザイン値。ブランドや文脈に依存しない。

```json
{
  "color": {
    "$type": "color",
    "ai-100": { "$value": "#e8f4f8" },
    "ai-500": { "$value": "#165e83" },
    "ai-900": { "$value": "#0f2350" },
    "kurenai-500": { "$value": "#d7003a" }
  }
}
```

**層2: セマンティックトークン（Alias）**
文脈や意図を表現するトークン。プリミティブを参照。

```json
{
  "semantic": {
    "color-primary": { "$value": "{color.ai-500}" },
    "color-danger": { "$value": "{color.kurenai-500}" },
    "color-bg-surface": { "$value": "{color.ai-100}" }
  }
}
```

**層3: コンポーネントトークン（Component-specific）**
特定のUIコンポーネントに紐づくトークン。

```json
{
  "button": {
    "color-bg": { "$value": "{semantic.color-primary}" },
    "color-text": { "$value": "{color.white}" }
  }
}
```

### 2.2 命名パターン

推奨される命名構造 [4]：

```
[category]-[property]-[element]-[modifier]-[state]
```

具体例：

- `color-bg-button-primary-hover`
- `color-text-heading-default`
- `spacing-inset-card-medium`
- `font-size-body-large`
- `shadow-elevation-low`

### 2.3 命名のベストプラクティス

- **ケバブケース（kebab-case）** を一貫して使用
- 視覚的特性（`blue`, `large`）よりも**意図**（`primary`, `emphasis`）で命名
- 数値スケールはプリミティブ層のみ（例: `color-ai-500`）
- セマンティック層では**役割ベース**（例: `color-primary`, `color-surface`）
- コンポーネント層では**コンポーネント名+プロパティ+状態**

---

## 3. 江戸時代の伝統色カラーパレット

### 3.1 目安箱プロダクトに推奨するカラーパレット

以下は「和色大辞典」等から収集した伝統色のHex値です [5][6]。

#### 藍色・紺系（メインカラー候補）

| 色名 | 読み       | Hex       | 用途候補                 |
| ---- | ---------- | --------- | ------------------------ |
| 藍色 | あいいろ   | `#165e83` | プライマリカラー         |
| 紺色 | こんいろ   | `#223a70` | ダークアクセント         |
| 紺碧 | こんぺき   | `#007bbb` | リンク・インタラクション |
| 縹色 | はなだいろ | `#2792c3` | セカンダリカラー         |
| 紺青 | こんじょう | `#192f60` | ダークモード背景         |
| 留紺 | とめこん   | `#1c305c` | ヘッダー                 |
| 濃藍 | こいあい   | `#0f2350` | 最深色                   |

#### 赤・朱系（アクセントカラー候補）

| 色名   | 読み           | Hex       | 用途候補   |
| ------ | -------------- | --------- | ---------- |
| 紅     | くれない       | `#d7003a` | 危険・警告 |
| 朱色   | しゅいろ       | `#eb6101` | CTA・強調  |
| 茜色   | あかねいろ     | `#b7282e` | エラー     |
| 深緋   | こきひ         | `#c9171e` | 重要通知   |
| 猩々緋 | しょうじょうひ | `#e2041b` | 警告       |

#### 緑・萌黄系

| 色名   | 読み       | Hex       | 用途候補       |
| ------ | ---------- | --------- | -------------- |
| 萌黄   | もえぎ     | `#aacf53` | 成功           |
| 常磐色 | ときわいろ | `#007b43` | 成功（ダーク） |
| 萌葱色 | もえぎいろ | `#006e54` | 正常状態       |
| 緑     | みどり     | `#3eb370` | 成功メッセージ |

#### 茶系

| 色名 | 読み     | Hex       | 用途候補       |
| ---- | -------- | --------- | -------------- |
| 焦茶 | こげちゃ | `#6f4b3e` | テクスチャ     |
| 枯茶 | からちゃ | `#8d6449` | ボーダー       |
| 栗色 | くりいろ | `#762f07` | 木目アクセント |

#### ニュートラル系

| 色名     | 読み       | Hex       | 用途候補               |
| -------- | ---------- | --------- | ---------------------- |
| 胡粉色   | ごふんいろ | `#fffffc` | 背景（白）             |
| 生成り色 | きなりいろ | `#fbfaf5` | カード背景             |
| 白練     | しろねり   | `#f3f3f3` | サーフェス             |
| 鼠色     | ねずみいろ | `#949495` | プレースホルダ         |
| 銀鼠     | ぎんねず   | `#afafb0` | ボーダー               |
| 墨       | すみ       | `#595857` | テキスト（セカンダリ） |
| 漆黒     | しっこく   | `#0d0015` | テキスト（プライマリ） |

#### 金・山吹系

| 色名   | 読み         | Hex       | 用途候補   |
| ------ | ------------ | --------- | ---------- |
| 山吹色 | やまぶきいろ | `#f8b500` | 警告・注意 |
| 黄金   | こがね       | `#e6b422` | ハイライト |

### 3.2 推奨カラースキーム

「目安箱」には、**藍色を基調**としたカラースキームを推奨します。理由：

1. 藍染は江戸時代に庶民に広く普及した「ジャパンブルー」
2. 意見箱という公的・信頼性のあるイメージと合致
3. 藍のグラデーションで深みと品格を表現可能
4. 朱色をアクセントに使うことで視認性と和の趣を両立

---

## 4. 和風×モダンデザインの融合

### 4.1 基本原則 [7][8]

日本のデザイン美学をUIに適用する際の原則：

- **間（ま）**: 余白を積極的に活用し、要素間に呼吸の間を設ける
- **侘び寂び**: 完璧すぎないテクスチャ感、時間の経過を感じさせる温かみ
- **引き算の美学**: 不要な装飾を排し、本質的な要素のみを残す
- **自然との調和**: 彩度の低い自然色を基調とする

### 4.2 UIへの具体的な応用

**色使い:**

- 全体的に彩度を抑えた伝統色を基調
- 高コントラスト（藍×白、墨×胡粉）を活かす
- アクセントに朱色や山吹色を点のように配置

**テクスチャ・パターン:**

- 和紙のようなテクスチャをカード背景に
- 市松模様、青海波、麻の葉などの和柄をさりげなく装飾に
- 水墨画的なグラデーション

**レイアウト:**

- 余白を惜しまない大胆な構成
- 縦書きテキストの部分的な活用（見出しなど）
- 非対称バランスによる動的な美しさ

### 4.3 目安箱固有のデザインコンセプト

| 要素           | 江戸の趣               | モダンな解釈                 |
| -------------- | ---------------------- | ---------------------------- |
| 投稿箱         | 木箱・目安箱のフォルム | カードUIに木目テクスチャ     |
| 投稿           | 巻物・和紙             | 丸みのあるカード、和紙風背景 |
| ナビゲーション | 暖簾（のれん）         | タブUI、ドロワーメニュー     |
| アイコン       | 家紋・判子             | シンプルな線画アイコン       |
| ボタン         | 印籠・朱印             | 朱色アクセント、角丸ボタン   |
| アバター       | 浮世絵風シルエット     | 匿名アバターアイコン         |

---

## 5. 和文タイポグラフィ

### 5.1 Google Fontsで利用可能な日本語フォント推奨 [9][10]

**本文（ボディテキスト）:**

| フォント        | 種類       | 特徴                                       | 用途             |
| --------------- | ---------- | ------------------------------------------ | ---------------- |
| Noto Sans JP    | ゴシック体 | Google/Adobe共同開発、高可読性、7ウェイト  | メイン本文       |
| Noto Serif JP   | 明朝体     | 格調高い、高可読性、6ウェイト              | フォーマルな本文 |
| Shippori Mincho | 明朝体     | 上品なオールドスタイル、柔らかな筆のタッチ | 和風コンテンツ   |

**見出し（ヘッダー）:**

| フォント           | 種類         | 特徴                         | 用途             |
| ------------------ | ------------ | ---------------------------- | ---------------- |
| Zen Antique        | アンティーク | 毛筆的な波のある品格、和の趣 | メイン見出し     |
| Shippori Mincho B1 | 明朝体       | B1はより力強い印象           | セクション見出し |
| Zen Old Mincho     | オールド明朝 | 伝統的な明朝体の風合い       | 装飾見出し       |

**装飾・アクセント:**

| フォント      | 種類         | 特徴                           | 用途           |
| ------------- | ------------ | ------------------------------ | -------------- |
| Zen Kurenaido | デザイン     | 紅色の名を持つ柔らかいフォント | ロゴ・キャッチ |
| Kaisei Decol  | デザイン明朝 | レトロモダンな印象             | 特殊見出し     |

### 5.2 推奨フォントスタック

```css
/* 本文 */
--font-family-body: "Noto Sans JP", "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif;

/* 和風見出し */
--font-family-heading: "Shippori Mincho", "Noto Serif JP", "Hiragino Mincho ProN", serif;

/* 装飾（ロゴ・キャッチコピー等） */
--font-family-display: "Zen Antique", "Shippori Mincho", serif;

/* 等幅（コード等） */
--font-family-mono: "Noto Sans Mono", "Source Code Pro", monospace;
```

### 5.3 タイポグラフィスケール

Major Third (1.25) のスケールを推奨：

| トークン        | サイズ             | 用途             |
| --------------- | ------------------ | ---------------- |
| `font-size-xs`  | 0.64rem (10.24px)  | キャプション     |
| `font-size-sm`  | 0.8rem (12.8px)    | 補足テキスト     |
| `font-size-md`  | 1rem (16px)        | 本文             |
| `font-size-lg`  | 1.25rem (20px)     | 小見出し         |
| `font-size-xl`  | 1.563rem (25px)    | 見出し           |
| `font-size-2xl` | 1.953rem (31.25px) | セクション見出し |
| `font-size-3xl` | 2.441rem (39px)    | ページ見出し     |
| `font-size-4xl` | 3.052rem (48.8px)  | ヒーロー         |

---

## 6. CSS Custom Propertiesによる実装パターン

### 6.1 3層トークンのCSS実装 [11][12]

```css
/* ========================================
   層1: プリミティブトークン（生の値）
   ======================================== */
:root {
  /* 藍色系 */
  --color-ai-50: #e8f4f8;
  --color-ai-100: #c5dfe8;
  --color-ai-200: #9dc5d6;
  --color-ai-300: #6fa8c1;
  --color-ai-400: #4790ac;
  --color-ai-500: #165e83;
  --color-ai-600: #124e6d;
  --color-ai-700: #0e3e57;
  --color-ai-800: #0a2e41;
  --color-ai-900: #0f2350;

  /* 紅系 */
  --color-kurenai-50: #fce8ed;
  --color-kurenai-100: #f5b8c7;
  --color-kurenai-500: #d7003a;
  --color-kurenai-700: #b7282e;
  --color-kurenai-900: #8b0020;

  /* ニュートラル */
  --color-gofun: #fffffc;
  --color-kinari: #fbfaf5;
  --color-shironeri: #f3f3f3;
  --color-nezumi: #949495;
  --color-gin-nezu: #afafb0;
  --color-sumi: #595857;
  --color-shikkoku: #0d0015;

  /* アクセント */
  --color-yamabuki: #f8b500;
  --color-kogane: #e6b422;
  --color-moegi: #aacf53;
  --color-tokiwa: #007b43;
  --color-shu: #eb6101;

  /* スペーシング */
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-3: 0.75rem;
  --spacing-4: 1rem;
  --spacing-5: 1.25rem;
  --spacing-6: 1.5rem;
  --spacing-8: 2rem;
  --spacing-10: 2.5rem;
  --spacing-12: 3rem;
  --spacing-16: 4rem;

  /* ボーダーラジウス */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-full: 9999px;

  /* シャドウ */
  --shadow-sm: 0 1px 2px rgba(13, 0, 21, 0.05);
  --shadow-md: 0 4px 6px rgba(13, 0, 21, 0.07);
  --shadow-lg: 0 10px 15px rgba(13, 0, 21, 0.1);
  --shadow-xl: 0 20px 25px rgba(13, 0, 21, 0.12);

  /* フォント */
  --font-family-body: "Noto Sans JP", "Hiragino Kaku Gothic ProN", sans-serif;
  --font-family-heading: "Shippori Mincho", "Noto Serif JP", serif;
  --font-family-display: "Zen Antique", "Shippori Mincho", serif;
  --font-family-mono: "Noto Sans Mono", monospace;

  /* フォントサイズ（Major Third 1.25） */
  --font-size-xs: 0.64rem;
  --font-size-sm: 0.8rem;
  --font-size-md: 1rem;
  --font-size-lg: 1.25rem;
  --font-size-xl: 1.563rem;
  --font-size-2xl: 1.953rem;
  --font-size-3xl: 2.441rem;
  --font-size-4xl: 3.052rem;

  /* フォントウェイト */
  --font-weight-light: 300;
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-bold: 700;

  /* 行間 */
  --line-height-tight: 1.25;
  --line-height-normal: 1.6;
  --line-height-relaxed: 1.8;

  /* トランジション */
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
  --easing-default: cubic-bezier(0.4, 0, 0.2, 1);
  --easing-in: cubic-bezier(0.4, 0, 1, 1);
  --easing-out: cubic-bezier(0, 0, 0.2, 1);
}

/* ========================================
   層2: セマンティックトークン（ライトモード）
   ======================================== */
:root,
[data-theme="light"] {
  /* 背景 */
  --color-bg-primary: var(--color-gofun);
  --color-bg-secondary: var(--color-kinari);
  --color-bg-surface: var(--color-shironeri);
  --color-bg-inverse: var(--color-ai-900);

  /* テキスト */
  --color-text-primary: var(--color-shikkoku);
  --color-text-secondary: var(--color-sumi);
  --color-text-muted: var(--color-nezumi);
  --color-text-inverse: var(--color-gofun);

  /* ブランド */
  --color-brand-primary: var(--color-ai-500);
  --color-brand-primary-hover: var(--color-ai-600);
  --color-brand-primary-active: var(--color-ai-700);

  /* アクセント */
  --color-accent: var(--color-shu);
  --color-accent-hover: var(--color-kurenai-500);

  /* フィードバック */
  --color-success: var(--color-tokiwa);
  --color-warning: var(--color-yamabuki);
  --color-error: var(--color-kurenai-500);
  --color-info: var(--color-ai-400);

  /* ボーダー */
  --color-border-default: var(--color-gin-nezu);
  --color-border-subtle: var(--color-shironeri);
  --color-border-emphasis: var(--color-ai-500);

  /* インタラクション */
  --color-link: var(--color-ai-500);
  --color-link-hover: var(--color-ai-700);
  --color-focus-ring: var(--color-ai-300);
}

/* ========================================
   層2: セマンティックトークン（ダークモード）
   ======================================== */
[data-theme="dark"] {
  --color-bg-primary: #1a1a2e;
  --color-bg-secondary: #16213e;
  --color-bg-surface: #1f2b47;
  --color-bg-inverse: var(--color-kinari);

  --color-text-primary: #e8e8e8;
  --color-text-secondary: #b0b0b0;
  --color-text-muted: #808080;
  --color-text-inverse: var(--color-shikkoku);

  --color-brand-primary: var(--color-ai-300);
  --color-brand-primary-hover: var(--color-ai-200);
  --color-brand-primary-active: var(--color-ai-100);

  --color-accent: #f0874a;
  --color-accent-hover: #e07040;

  --color-success: var(--color-moegi);
  --color-warning: var(--color-kogane);
  --color-error: var(--color-kurenai-100);
  --color-info: var(--color-ai-200);

  --color-border-default: #3a3a5c;
  --color-border-subtle: #2a2a44;
  --color-border-emphasis: var(--color-ai-300);

  --color-link: var(--color-ai-200);
  --color-link-hover: var(--color-ai-100);
  --color-focus-ring: var(--color-ai-400);
}

/* システム設定に自動追従 */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    /* ダークモードの値をここにも定義（上記[data-theme="dark"]と同じ値） */
  }
}

/* ========================================
   層3: コンポーネントトークン（例）
   ======================================== */
:root {
  /* ボタン */
  --button-bg: var(--color-brand-primary);
  --button-bg-hover: var(--color-brand-primary-hover);
  --button-text: var(--color-text-inverse);
  --button-radius: var(--radius-md);
  --button-padding-x: var(--spacing-4);
  --button-padding-y: var(--spacing-2);

  /* カード（投稿カード） */
  --card-bg: var(--color-bg-secondary);
  --card-border: var(--color-border-subtle);
  --card-radius: var(--radius-lg);
  --card-shadow: var(--shadow-md);
  --card-padding: var(--spacing-6);

  /* 入力フィールド */
  --input-bg: var(--color-bg-primary);
  --input-border: var(--color-border-default);
  --input-border-focus: var(--color-brand-primary);
  --input-text: var(--color-text-primary);
  --input-placeholder: var(--color-text-muted);
  --input-radius: var(--radius-md);
}
```

### 6.2 ダークモード切り替えの実装

```javascript
// テーマ切り替え関数
function toggleTheme() {
  const root = document.documentElement;
  const current = root.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
}

// 初期化：ユーザー設定 → システム設定の優先順位
function initTheme() {
  const saved = localStorage.getItem("theme");
  if (saved) {
    document.documentElement.setAttribute("data-theme", saved);
  }
  // savedがない場合はprefers-color-schemeのメディアクエリに委譲
}
```

---

## 7. ダークモード対応パターン

### 7.1 設計原則 [13][14]

- **彩度を20%程度下げる**: ダークモードでは飽和色が目に振動を起こすため、明度を上げつつ彩度を下げる
- **WCAG AA準拠のコントラスト比**: テキスト4.5:1以上、大テキスト3:1以上を維持
- **エレベーション**: 暗い背景では影よりも背景色の明度差でレイヤーを表現
- **アセットの切り替え**: 画像やイラストもダークモード向けに調整

### 7.2 江戸の夜をイメージしたダークテーマ

ダークモードでは「行灯（あんどん）の灯り」や「月明かりの江戸」を連想させる深い藍をベースに：

| 役割       | ライト           | ダーク           |
| ---------- | ---------------- | ---------------- |
| 背景1      | `#fffffc` 胡粉   | `#1a1a2e` 深夜藍 |
| 背景2      | `#fbfaf5` 生成り | `#16213e` 藍鉄   |
| サーフェス | `#f3f3f3` 白練   | `#1f2b47` 月夜藍 |
| テキスト1  | `#0d0015` 漆黒   | `#e8e8e8` 月白   |
| テキスト2  | `#595857` 墨     | `#b0b0b0` 銀鼠   |
| プライマリ | `#165e83` 藍     | `#6fa8c1` 淡藍   |
| アクセント | `#eb6101` 朱     | `#f0874a` 薄朱   |

---

## 8. Pencil MCPとの連携

### 8.1 概要 [15]

Pencil MCPは、.penファイル（JSON形式）をAIアシスタントから操作できるプロトコルです。デザイントークンを `design-tokens.json` に定義し、`set_variables` ツールで.penデザインファイルに反映できます。

### 8.2 利用可能なMCPツール

| ツール             | 機能                         |
| ------------------ | ---------------------------- |
| `batch_design`     | 要素の作成・修正・削除       |
| `batch_get`        | コンポーネント階層の読み取り |
| `get_screenshot`   | デザインプレビュー取得       |
| `snapshot_layout`  | レイアウト構造分析           |
| `get_variables`    | デザイントークンの読み取り   |
| `set_variables`    | デザイントークンの書き込み   |
| `get_editor_state` | エディタ状態の取得           |

### 8.3 推奨ワークフロー

1. `design-tokens.json`（DTCG形式）を定義
2. Style Dictionaryで各プラットフォーム向けに変換
3. Pencil MCPの`set_variables`でデザインファイルに反映
4. コードとデザインの一元管理（Git管理）

---

## 9. DTCG形式デザイントークンJSON定義（目安箱プロジェクト向け案）

以下は、目安箱プロダクト用のデザイントークンをW3C DTCG形式で定義した例です：

```json
{
  "color": {
    "$type": "color",
    "$description": "目安箱カラーパレット — 江戸の伝統色をベースにしたカラーシステム",

    "primitive": {
      "$description": "プリミティブカラー（生の値）",
      "ai": {
        "$description": "藍色系 — ジャパンブルー",
        "50": { "$value": "#e8f4f8" },
        "100": { "$value": "#c5dfe8" },
        "200": { "$value": "#9dc5d6" },
        "300": { "$value": "#6fa8c1" },
        "400": { "$value": "#4790ac" },
        "500": { "$value": "#165e83" },
        "600": { "$value": "#124e6d" },
        "700": { "$value": "#0e3e57" },
        "800": { "$value": "#0a2e41" },
        "900": { "$value": "#0f2350" }
      },
      "kurenai": {
        "$description": "紅色系",
        "50": { "$value": "#fce8ed" },
        "100": { "$value": "#f5b8c7" },
        "500": { "$value": "#d7003a" },
        "700": { "$value": "#b7282e" },
        "900": { "$value": "#8b0020" }
      },
      "shu": {
        "$description": "朱色系",
        "500": { "$value": "#eb6101" }
      },
      "yamabuki": {
        "$description": "山吹色系",
        "500": { "$value": "#f8b500" }
      },
      "moegi": {
        "$description": "萌黄色系",
        "500": { "$value": "#aacf53" }
      },
      "tokiwa": {
        "$description": "常磐色系",
        "500": { "$value": "#007b43" }
      },
      "neutral": {
        "$description": "ニュートラル",
        "gofun": { "$value": "#fffffc", "$description": "胡粉色" },
        "kinari": { "$value": "#fbfaf5", "$description": "生成り色" },
        "shironeri": { "$value": "#f3f3f3", "$description": "白練" },
        "nezumi": { "$value": "#949495", "$description": "鼠色" },
        "gin-nezu": { "$value": "#afafb0", "$description": "銀鼠" },
        "sumi": { "$value": "#595857", "$description": "墨" },
        "shikkoku": { "$value": "#0d0015", "$description": "漆黒" }
      }
    }
  },

  "spacing": {
    "$type": "dimension",
    "$description": "スペーシングスケール",
    "1": { "$value": "0.25rem" },
    "2": { "$value": "0.5rem" },
    "3": { "$value": "0.75rem" },
    "4": { "$value": "1rem" },
    "5": { "$value": "1.25rem" },
    "6": { "$value": "1.5rem" },
    "8": { "$value": "2rem" },
    "10": { "$value": "2.5rem" },
    "12": { "$value": "3rem" },
    "16": { "$value": "4rem" }
  },

  "font": {
    "family": {
      "$type": "fontFamily",
      "body": { "$value": ["Noto Sans JP", "Hiragino Kaku Gothic ProN", "sans-serif"] },
      "heading": { "$value": ["Shippori Mincho", "Noto Serif JP", "serif"] },
      "display": { "$value": ["Zen Antique", "Shippori Mincho", "serif"] },
      "mono": { "$value": ["Noto Sans Mono", "monospace"] }
    },
    "size": {
      "$type": "dimension",
      "xs": { "$value": "0.64rem" },
      "sm": { "$value": "0.8rem" },
      "md": { "$value": "1rem" },
      "lg": { "$value": "1.25rem" },
      "xl": { "$value": "1.563rem" },
      "2xl": { "$value": "1.953rem" },
      "3xl": { "$value": "2.441rem" },
      "4xl": { "$value": "3.052rem" }
    },
    "weight": {
      "$type": "fontWeight",
      "light": { "$value": 300 },
      "regular": { "$value": 400 },
      "medium": { "$value": 500 },
      "bold": { "$value": 700 }
    },
    "line-height": {
      "$type": "number",
      "tight": { "$value": 1.25 },
      "normal": { "$value": 1.6 },
      "relaxed": { "$value": 1.8 }
    }
  },

  "border-radius": {
    "$type": "dimension",
    "sm": { "$value": "0.25rem" },
    "md": { "$value": "0.5rem" },
    "lg": { "$value": "0.75rem" },
    "xl": { "$value": "1rem" },
    "full": { "$value": "9999px" }
  },

  "shadow": {
    "$type": "shadow",
    "sm": {
      "$value": {
        "offsetX": "0",
        "offsetY": "1px",
        "blur": "2px",
        "spread": "0",
        "color": "#0d001508"
      }
    },
    "md": {
      "$value": {
        "offsetX": "0",
        "offsetY": "4px",
        "blur": "6px",
        "spread": "0",
        "color": "#0d001512"
      }
    },
    "lg": {
      "$value": {
        "offsetX": "0",
        "offsetY": "10px",
        "blur": "15px",
        "spread": "0",
        "color": "#0d00151a"
      }
    },
    "xl": {
      "$value": {
        "offsetX": "0",
        "offsetY": "20px",
        "blur": "25px",
        "spread": "0",
        "color": "#0d00151f"
      }
    }
  },

  "duration": {
    "$type": "duration",
    "fast": { "$value": "150ms" },
    "normal": { "$value": "250ms" },
    "slow": { "$value": "400ms" }
  },

  "easing": {
    "$type": "cubicBezier",
    "default": { "$value": [0.4, 0, 0.2, 1] },
    "in": { "$value": [0.4, 0, 1, 1] },
    "out": { "$value": [0, 0, 0.2, 1] }
  }
}
```

---

## 10. Style Dictionaryによるトークン変換

### 10.1 ツールチェーン推奨

```
design-tokens.json (DTCG形式)
    ↓ Style Dictionary v4
    ├── CSS Custom Properties → Web
    ├── JavaScript/TypeScript → React/Next.js
    ├── Pencil Variables → .pen デザインファイル
    └── Tailwind Config → Tailwind CSS
```

Style Dictionary v4はDTCGフォーマットを第一級でサポートしています。`$value`, `$type`, `$description` プレフィックスをネイティブに認識します。[16]

---

## 結論

目安箱プロジェクトのデザインシステムは、以下のアプローチで構築することを推奨します：

1. **W3C DTCG形式**（2025.10安定版）でデザイントークンを定義
2. **藍色（ジャパンブルー）**を基調とし、朱色・山吹色をアクセントにした伝統色パレット
3. **3層トークン構造**（プリミティブ → セマンティック → コンポーネント）で管理
4. **Style Dictionary v4**でCSS Custom Properties等に変換
5. **Pencil MCP**の`set_variables`でデザインファイルと同期
6. **明朝体（Shippori Mincho）×ゴシック体（Noto Sans JP）**のフォントペアリング
7. **data-theme属性**によるライト/ダークモード切り替え
8. 江戸の美学（間・引き算・自然色）をUIに昇華

---

## 推奨事項（次のステップ）

1. `design-tokens.json` をプロジェクトルートの `design/tokens/` ディレクトリに配置
2. Style Dictionary設定ファイルを作成し、CSS変数への変換パイプラインを構築
3. Pencil MCPをセットアップし、トークンをデザインファイルに反映
4. カラーパレットのアクセシビリティ検証（WCAG AA基準）
5. コンポーネントライブラリの構築開始（ボタン、カード、入力フィールド等）

---

## 情報源

[1] [Design Tokens specification reaches first stable version | W3C DTCG](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/)
[2] [Design Tokens Format Module 2025.10](https://www.designtokens.org/tr/drafts/format/)
[3] [The developer's guide to design tokens and CSS variables | Penpot](https://penpot.app/blog/the-developers-guide-to-design-tokens-and-css-variables/)
[4] [Best Practices For Naming Design Tokens | Smashing Magazine](https://www.smashingmagazine.com/2024/05/naming-best-practices/)
[5] [日本の伝統色 和色大辞典](https://www.colordic.org/w)
[6] [NIPPON COLORS - 日本の伝統色](https://nipponcolors.com/)
[7] [Japanese Minimalism in UI Design | Fireart Studio](https://fireart.studio/blog/japanese-minimalism-in-ui-design-for-digital-products/)
[8] [和風デザインWebサイトの制作ポイント | Webクリエイターボックス](https://www.webcreatorbox.com/blog/japanese-web-design)
[9] [Google Fonts 日本語フォント おすすめ10選 2026年](https://humhum.co.jp/4931/)
[10] [Zenフォント: 新しい日本語フォントコレクション | Google Fonts Blog](https://fonts.googleblog.com/2021/10/zen_0361327225.html)
[11] [Design tokens and theming | Atlassian](https://developer.atlassian.com/platform/forge/design-tokens-and-theming/)
[12] [Dark Mode Done Right: Best Practices for 2026 | Medium](https://medium.com/@social_7132/dark-mode-done-right-best-practices-for-2026-c223a4b92417)
[13] [Color tokens: guide to light and dark modes | Medium](https://medium.com/design-bootcamp/color-tokens-guide-to-light-and-dark-modes-in-design-systems-146ab33023ac)
[14] [Dark mode UI design – 7 best practices | Atmos](https://atmos.style/blog/dark-mode-ui-best-practices)
[15] [AI Integration - Pencil Documentation](https://docs.pencil.dev/getting-started/ai-integration)
[16] [Design Tokens Community Group | Style Dictionary](https://styledictionary.com/info/dtcg/)

---

## 調査の限界

- Pencil MCPの `.pen` ファイル内部構造の詳細仕様は公式ドキュメントが限定的
- 江戸時代特定の伝統色（江戸紫、江戸鼠等）の完全なリストは収集しきれていない
- 実際のアクセシビリティ検証（WCAG準拠コントラスト比）は未実施
- Style Dictionary v4のDTCGフォーマット対応の詳細設定例は限定的
