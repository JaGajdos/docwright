export const DOCWRIGHT_BOT_MARKER = "<!-- docwright-bot -->";

export type IssueComment = {
  id: number;
  body?: string | null;
  user?: {
    login?: string;
    type?: string;
  } | null;
};

export type StickyClient = {
  listComments: (page: number) => Promise<IssueComment[]>;
  createComment: (body: string) => Promise<IssueComment>;
  updateComment: (commentId: number, body: string) => Promise<IssueComment>;
};

export function isDocwrightBotComment(body: string): boolean {
  return body.includes(DOCWRIGHT_BOT_MARKER);
}

function isLikelyBotAuthor(comment: IssueComment): boolean {
  const type = comment.user?.type?.toLowerCase();
  if (type === "bot") return true;
  const login = comment.user?.login?.toLowerCase() ?? "";
  return (
    login === "github-actions[bot]" ||
    login.endsWith("[bot]") ||
    login.includes("docwright")
  );
}

export function findDocwrightComment(
  comments: IssueComment[],
): IssueComment | undefined {
  return comments.find(
    (c) =>
      typeof c.body === "string" &&
      isDocwrightBotComment(c.body) &&
      isLikelyBotAuthor(c),
  );
}

/**
 * Create or update the sticky Docwright PR comment (doc/11 §5).
 */
export async function upsertStickyComment(
  client: StickyClient,
  body: string,
): Promise<{ action: "created" | "updated"; comment: IssueComment }> {
  if (!body.includes(DOCWRIGHT_BOT_MARKER)) {
    throw new Error("Sticky body must include Docwright bot marker");
  }

  const all: IssueComment[] = [];
  for (let page = 1; page <= 20; page += 1) {
    const batch = await client.listComments(page);
    if (batch.length === 0) break;
    all.push(...batch);
    if (batch.length < 100) break;
  }

  const existing = findDocwrightComment(all);
  if (existing) {
    const comment = await client.updateComment(existing.id, body);
    return { action: "updated", comment };
  }

  const comment = await client.createComment(body);
  return { action: "created", comment };
}
