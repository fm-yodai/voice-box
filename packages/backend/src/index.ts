import { serve } from "@hono/node-server";
import { handle } from "hono/aws-lambda";
import "dotenv/config";
import { app } from "./app.js";

const port = Number(process.env.PORT) || 3000;

// AWS Lambda handler export
export const handler = handle(app);

// Local development server
if (process.env.NODE_ENV !== "production") {
  serve({ fetch: app.fetch, port }, (info) => {
    console.log(`Server running at http://localhost:${info.port}`);
  });
}
