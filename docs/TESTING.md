# Testing Guide

This project uses [Vitest](https://vitest.dev/) as the test framework across all packages.

## Running Tests

```bash
# Run all tests across all packages
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run tests for a specific package
pnpm --filter @voice-box/backend test
pnpm --filter @voice-box/frontend test
pnpm --filter @voice-box/shared test
```

## Test File Conventions

- Test files are co-located with source files
- Naming pattern: `<filename>.test.ts`
- Example: `src/routes/health.ts` -> `src/routes/health.test.ts`

## Backend Testing

The backend uses Hono's built-in test utilities. There is no need for supertest or HTTP server setup since Hono supports direct request testing via `app.request()`.

### Example: Testing an API endpoint

```typescript
import { describe, it, expect } from "vitest";
import { app } from "../app.js";

describe("GET /health", () => {
  it("returns status ok", async () => {
    const res = await app.request("/health");

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe("ok");
  });
});
```

### Testing with request body

```typescript
it("creates a resource", async () => {
  const res = await app.request("/api/resource", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "test" }),
  });

  expect(res.status).toBe(201);
});
```

## Frontend Testing

The frontend uses Vitest with Vue Test Utils for component testing.

### Example: Testing a Vue component

```typescript
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import MyComponent from "./MyComponent.vue";

describe("MyComponent", () => {
  it("renders properly", () => {
    const wrapper = mount(MyComponent, {
      props: { message: "Hello" },
    });
    expect(wrapper.text()).toContain("Hello");
  });
});
```

## Test-Driven Development (TDD) Workflow

1. **Write a failing test** - Write a test that describes the expected behavior
2. **Make it pass** - Write the minimum code to make the test pass
3. **Refactor** - Clean up the code while keeping tests green

Use watch mode during development:

```bash
pnpm test:watch
```

## Coverage

Coverage reports are generated using V8 and output to the `coverage/` directory (gitignored). A minimum of 80% coverage is enforced in each package's `vitest.config.ts` for lines, functions, branches, and statements. The `pnpm test:coverage` command will fail if any package falls below this threshold.
