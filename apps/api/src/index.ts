import { serve } from "@hono/node-server";
import { createApp } from "./app.js";

const port = Number.parseInt(process.env.PORT ?? "8787", 10);
const { app } = createApp();

console.error(`Docwright API listening on :${port}`);
serve({ fetch: app.fetch, port });
