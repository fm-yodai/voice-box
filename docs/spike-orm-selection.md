# Spike: ORM選定 (Prisma vs Drizzle)

> **Issue**: #19
> **ステータス**: 完了
> **結論**: **Drizzle ORM を推奨**
> **日付**: 2026-02-07

## 背景

voice-box プロジェクトのバックエンド（Hono + TypeScript）で使用する ORM を選定する。
データベースは AWS Aurora PostgreSQL を想定し、サーバーレス環境（Lambda）での動作も考慮する。

## 比較表

| 観点                          | Drizzle ORM                                                                                                                           | Prisma ORM                                                                                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TypeScript 型推論**         | コードファーストで型をリアルタイム推論。スキーマ定義がそのまま型になる                                                                | スキーマファイル (.prisma) から `prisma generate` でコード生成。型チェックは72%高速（プリコンパイル済み .d.ts）                                      |
| **Aurora PostgreSQL 対応**    | `drizzle-orm/aws-data-api/pg` で Aurora Data API をネイティブサポート。`node-postgres`, `postgres.js` ドライバも対応                  | Aurora Serverless v2 対応可能だが、Data API のネイティブサポートはなく、通常の PostgreSQL 接続経由。コールドスタート時に15秒のタイムアウト考慮が必要 |
| **マイグレーション**          | `drizzle-kit` でスキーマ差分から自動生成。SQL ファイルが生成されるため透明性が高い                                                    | `prisma migrate` で強力なマイグレーション管理。GUI ツール（Prisma Studio）あり                                                                       |
| **クエリビルダー**            | SQL ライクな API（"SQLを知っていれば Drizzle を知っている"）。Relational Query API も提供                                             | 独自の高レベル API。直感的だがSQL とは異なる抽象化                                                                                                   |
| **ドキュメント**              | 公式ドキュメントが充実。v1.0 beta に向けて改善中                                                                                      | 非常に充実。チュートリアル、ガイド、API リファレンスが豊富                                                                                           |
| **AI コーディングとの親和性** | TypeScript ネイティブのため、AI エージェントがコード生成しやすい。コード生成ステップ不要。T3 Stack v2 等が Drizzle をデフォルトに採用 | スキーマファイルと生成ステップが必要なため、AI エージェントのワークフローにやや複雑さが増す                                                          |
| **パフォーマンス**            | ~7.4kb (minified+gzip)、依存関係ゼロ。SQL へ最小オーバーヘッドでコンパイル。サーバーレスに最適                                        | Prisma 7 で Rust エンジン廃止により改善。大規模データセットで高速化。ただし Raw SQL 比で5倍遅い報告あり                                              |
| **コミュニティ**              | GitHub Stars: ~32,000+、npm 週間DL: ~2,550,000。急成長中                                                                              | GitHub Stars: ~40,000+、npm 週間DL: ~3,500,000+。成熟した大規模コミュニティ                                                                          |

## 詳細分析

### TypeScript 型推論

**Drizzle ORM:**

```typescript
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// スキーマ定義がそのまま型になる
export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 型は自動推論される
type Post = typeof posts.$inferSelect;
type NewPost = typeof posts.$inferInsert;
```

**Prisma ORM:**

```prisma
// schema.prisma（別ファイル）
model Post {
  id        String   @id @default(uuid())
  content   String
  createdAt DateTime @default(now())
}
```

```typescript
// prisma generate 後に使用可能
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
// 型は生成されたコードから取得
```

### Aurora PostgreSQL 接続

**Drizzle ORM（Aurora Data API）:**

```typescript
import { drizzle } from "drizzle-orm/aws-data-api/pg";
import { RDSDataClient } from "@aws-sdk/client-rds-data";

const client = new RDSDataClient({});
const db = drizzle(client, {
  database: "voice_box",
  secretArn: process.env.DB_SECRET_ARN!,
  resourceArn: process.env.DB_RESOURCE_ARN!,
});
```

**Prisma ORM（標準 PostgreSQL 接続）:**

```typescript
// DATABASE_URL 環境変数で接続
const prisma = new PrismaClient();
// Aurora Data API は直接サポートされていない
```

### サーバーレス環境での比較

| 指標             | Drizzle | Prisma                        |
| ---------------- | ------- | ----------------------------- |
| バンドルサイズ   | ~7.4kb  | ~数MB（Prisma 7 で改善）      |
| コールドスタート | 最小    | 改善されたが Drizzle より遅い |
| バイナリ依存     | なし    | Prisma 7 で廃止（改善）       |
| エッジランタイム | 対応    | Prisma 7 で対応改善           |

### AI コーディングエージェントとの親和性

Drizzle の優位点:

1. **コード生成ステップ不要**: スキーマ変更後に `prisma generate` を実行する必要がない
2. **TypeScript のみで完結**: AI エージェントが `.prisma` ファイルの独自構文を学習する必要がない
3. **SQL に近い API**: AI エージェントが SQL 知識をそのまま活用できる
4. **主要ツールが採用**: T3 Stack v2、Epic Web が Drizzle をデフォルトに切り替え済み
5. **設定ファイル対応**: Claude Code、Cursor、Codex 等の AI ツール向け設定が事前用意されている

## 推奨

### **Drizzle ORM を推奨する**

**主な理由:**

1. **Aurora Data API のネイティブサポート**: voice-box は Aurora PostgreSQL を使用予定であり、Drizzle の Data API サポートは大きなアドバンテージ
2. **サーバーレス最適化**: Lambda 環境でのバンドルサイズ（~7.4kb）とコールドスタートの優位性
3. **TypeScript ネイティブ**: コード生成ステップが不要で、開発ワークフローがシンプル
4. **AI エージェントとの親和性**: コード生成ステップ不要、SQL ライクな API で AI エージェントが扱いやすい
5. **急成長するエコシステム**: 2025-2026 年にかけて主要フレームワークが Drizzle をデフォルト採用

**Prisma を選ぶべき場合:**

- チームに Prisma 経験者が多い場合
- Prisma Studio（GUI）が必要な場合
- 複雑なリレーション操作が頻繁な場合

## リスクと対策

| リスク                                             | 対策                                                     |
| -------------------------------------------------- | -------------------------------------------------------- |
| Drizzle v1.0 がまだ beta                           | beta 段階でも本番利用実績が豊富。API の安定性は高い      |
| Prisma ほどドキュメントが充実していない            | 公式ドキュメントは十分。SQL 知識があれば学習曲線は緩やか |
| Drizzle Studio は Prisma Studio ほど成熟していない | 開発中は DB クライアント（pgAdmin, DBeaver）で代替可能   |

## 参考リンク

- [Drizzle ORM 公式ドキュメント](https://orm.drizzle.team/)
- [Drizzle AWS Data API PostgreSQL](https://orm.drizzle.team/docs/connect-aws-data-api-pg)
- [Prisma 公式ドキュメント](https://www.prisma.io/docs)
- [Prisma vs Drizzle 比較（Prisma公式）](https://www.prisma.io/docs/orm/more/comparisons/prisma-and-drizzle)
- [Drizzle vs Prisma: Better Stack Community](https://betterstack.com/community/guides/scaling-nodejs/drizzle-vs-prisma/)
- [Drizzle vs Prisma 2026 Deep Dive](https://medium.com/@codabu/drizzle-vs-prisma-choosing-the-right-typescript-orm-in-2026-deep-dive-63abb6aa882b)
- [Prisma ORM Rust-Free Performance Benchmarks](https://www.prisma.io/blog/prisma-orm-without-rust-latest-performance-benchmarks)
