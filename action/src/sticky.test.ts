import { describe, expect, it, vi } from "vitest";
import {
  DOCWRIGHT_BOT_MARKER,
  findDocwrightComment,
  upsertStickyComment,
  type IssueComment,
  type StickyClient,
} from "./sticky.js";

const body = `${DOCWRIGHT_BOT_MARKER}\n## Docwright\n`;

describe("findDocwrightComment", () => {
  it("finds bot comment with marker", () => {
    const comments: IssueComment[] = [
      { id: 1, body: "hello", user: { login: "alice", type: "User" } },
      {
        id: 2,
        body,
        user: { login: "github-actions[bot]", type: "Bot" },
      },
    ];
    expect(findDocwrightComment(comments)?.id).toBe(2);
  });

  it("ignores marker from non-bot user", () => {
    const comments: IssueComment[] = [
      { id: 3, body, user: { login: "alice", type: "User" } },
    ];
    expect(findDocwrightComment(comments)).toBeUndefined();
  });
});

describe("upsertStickyComment", () => {
  it("creates when missing", async () => {
    const client: StickyClient = {
      listComments: vi.fn().mockResolvedValue([]),
      createComment: vi.fn().mockResolvedValue({ id: 10, body }),
      updateComment: vi.fn(),
    };
    const out = await upsertStickyComment(client, body);
    expect(out.action).toBe("created");
    expect(client.createComment).toHaveBeenCalledWith(body);
    expect(client.updateComment).not.toHaveBeenCalled();
  });

  it("updates existing sticky comment", async () => {
    const existing: IssueComment = {
      id: 42,
      body,
      user: { login: "github-actions[bot]", type: "Bot" },
    };
    const client: StickyClient = {
      listComments: vi.fn().mockResolvedValue([existing]),
      createComment: vi.fn(),
      updateComment: vi.fn().mockResolvedValue({ id: 42, body }),
    };
    const out = await upsertStickyComment(client, body);
    expect(out.action).toBe("updated");
    expect(client.updateComment).toHaveBeenCalledWith(42, body);
    expect(client.createComment).not.toHaveBeenCalled();
  });
});
