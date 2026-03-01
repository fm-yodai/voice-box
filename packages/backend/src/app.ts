import { Hono } from "hono";
import { logger } from "hono/logger";
import { docClient, TABLE_NAME } from "./lib/dynamodb.js";
import type { AuthUser } from "./middleware/auth.js";
import type { Repositories } from "./repositories/index.js";
import { createRepositories } from "./repositories/index.js";
import { auth } from "./routes/auth.js";
import { health } from "./routes/health.js";
import { posts } from "./routes/posts.js";
import { responses } from "./routes/responses.js";

type Env = { Variables: { repositories: Repositories; user: AuthUser } };

const app = new Hono<Env>();

app.use("*", logger());

const repositories = createRepositories(docClient, TABLE_NAME);
app.use("*", async (c, next) => {
  c.set("repositories", repositories);
  await next();
});

app.route("/", health);
app.route("/", auth);
app.route("/", posts);
app.route("/", responses);

export { app };
