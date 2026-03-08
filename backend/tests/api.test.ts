import { beforeEach, describe, expect, test } from "vitest";
import { createId } from "../src/utils/id.js";
import { createNote, createUser, resetDb, searchPublicNotes, upsertBookmark, listBookmarks } from "../src/db.js";
import { signToken, verifyToken } from "../src/auth.js";

describe("MVP core flow", () => {
  beforeEach(() => {
    resetDb();
  });

  test("register-like data creation, token, public search and bookmark", () => {
    const now = new Date().toISOString();
    const user = createUser({
      id: createId(),
      email: "demo@test.com",
      username: "demo",
      displayName: "Demo User",
      passwordHash: "hash",
      createdAt: now,
      updatedAt: now
    });

    const token = signToken(user);
    const payload = verifyToken(token);
    expect(payload.email).toBe("demo@test.com");

    const note = createNote({
      id: createId(),
      userId: user.id,
      title: "Kling Outfit Demo",
      summary: "Image to video outfit switch workflow",
      contentRaw: "Detailed markdown content",
      visibility: "public",
      status: "published",
      primaryTool: "Kling",
      difficultyLevel: "beginner",
      tags: ["image-to-video", "fashion"],
      steps: [
        {
          id: createId(),
          stepIndex: 1,
          title: "Prepare image",
          description: "Use high-quality portrait",
          promptText: "clean white background"
        }
      ],
      createdAt: now,
      updatedAt: now
    });

    const search = searchPublicNotes("outfit");
    expect(search.length).toBe(1);
    expect(search[0].id).toBe(note.id);

    upsertBookmark({ id: createId(), userId: user.id, noteId: note.id, createdAt: now });
    const bookmarks = listBookmarks(user.id);
    expect(bookmarks.length).toBe(1);
    expect(bookmarks[0].title).toContain("Kling");
  });
});
