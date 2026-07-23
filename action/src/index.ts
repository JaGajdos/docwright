import * as core from "@actions/core";
import * as github from "@actions/github";
import { callGenerateApi } from "./api.js";
import { upsertStickyComment, type StickyClient } from "./sticky.js";

async function run(): Promise<void> {
  const apiUrl = core.getInput("api-url", { required: true });
  const apiKey = core.getInput("api-key", { required: true });
  const token = core.getInput("github-token", { required: true });

  const ctx = github.context;
  if (!ctx.payload.pull_request) {
    core.setFailed("Docwright Action must run on pull_request events.");
    return;
  }

  const owner = ctx.repo.owner;
  const repo = ctx.repo.repo;
  const prNumber = ctx.payload.pull_request.number;
  const ref = ctx.payload.pull_request.head.ref as string;
  const sha = ctx.payload.pull_request.head.sha as string;

  core.info(`Generating docs for ${owner}/${repo}@${ref} (${sha.slice(0, 7)})`);

  const generated = await callGenerateApi({
    apiUrl,
    apiKey,
    owner,
    repo,
    ref,
    sha,
  });

  const octokit = github.getOctokit(token);
  const client: StickyClient = {
    listComments: async (page) => {
      const { data } = await octokit.rest.issues.listComments({
        owner,
        repo,
        issue_number: prNumber,
        per_page: 100,
        page,
      });
      return data;
    },
    createComment: async (body) => {
      const { data } = await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body,
      });
      return data;
    },
    updateComment: async (commentId, body) => {
      const { data } = await octokit.rest.issues.updateComment({
        owner,
        repo,
        comment_id: commentId,
        body,
      });
      return data;
    },
  };

  const result = await upsertStickyComment(client, generated.prCommentMarkdown);
  core.info(
    `Sticky comment ${result.action} (id=${result.comment.id}). Warnings: ${
      generated.warnings?.length ?? 0
    }`,
  );
}

run().catch((err) => {
  core.setFailed(err instanceof Error ? err.message : String(err));
});
