---
name: testing
description: >-
  voice-box の Vitest テストガイド。backend は Hono の app.request()（supertest/HTTPサーバー不要）、
  モックリポジトリ注入で DynamoDB 非依存、frontend は Vue Test Utils + Happy DOM、
  共置 <name>.test.ts、80% カバレッジ閾値、infra は CDK スタックテストについて扱う。
  テスト作成・失敗テスト修正・カバレッジ対応時に使う。「テスト」「test」「カバレッジ」
  「app.request」「モック」で起動。
paths: "**/*.test.ts,**/*.spec.ts,**/vitest.config.ts"
---

# voice-box テスト

全パッケージ Vitest。詳細・サンプルは [docs/TESTING.md](../../../docs/TESTING.md)。本スキルは規約の要点。

## 規約

- テストは共置、命名 `<filename>.test.ts`
- 80% カバレッジ閾値（lines/functions/branches/statements）。各 `vitest.config.ts` で強制。
  `pnpm test:coverage` は閾値割れで fail
- `pnpm test` の前に shared を build（[[monorepo-pnpm]]）

## backend: `app.request()`（HTTP サーバー不要）

```typescript
import { app } from "../app.js";
const res = await app.request("/health");
expect(res.status).toBe(200);
```

- supertest 不使用
- **ユニットテストはモックリポジトリを注入**し DynamoDB 非依存にする（実 DynamoDB Local に繋がない）。
  repository パターンの DI を活用（[[app-architecture]] [[dynamodb]]）
- 匿名性の回帰防止: 公開エンドポイントのレスポンスに投稿者情報が含まれないことを必ずテストする
  （[[project-knowledge]]）

## frontend: Vue Test Utils + Happy DOM

```typescript
import { mount } from "@vue/test-utils";
const wrapper = mount(Component, { props: { ... } });
```

## infra: CDK スタックテスト

`packages/infra/test/stacks.test.ts`。スタック定義変更時は必ず更新（[[cdk-infra]]）。

## TDD

失敗テスト → 最小実装 → リファクタ。開発中は `pnpm test:watch`。

関連: [[app-architecture]] [[dynamodb]] [[monorepo-pnpm]]
