#!/usr/bin/env node
import { generateDocs } from "../agent/generateDocs.js";

async function main(): Promise<void> {
  const repo = process.argv[2];
  if (!repo) {
    console.error("Usage: npm run generate -w @docwright/core -- <owner/repo|url>");
    process.exit(1);
  }

  const language = process.env.DOCWRIGHT_OUTPUT_LANGUAGE ?? "en";
  console.error(`Docwright generate: ${repo} (lang=${language})…`);

  const result = await generateDocs({ repo, language });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
