import { beforeEach, describe, expect, test } from "vitest";
import request from "supertest";
import { buildApp } from "../src/app.js";
import { createNote, createUser, resetDb } from "../src/db.js";
import { signToken } from "../src/auth.js";
import { createId } from "../src/utils/id.js";

const app = buildApp();

describe("community bookmarks route", () => {
  beforeEach(() => {
    resetDb();
  });

  test("rejects bookmarking missing/private notes and accepts public published note", async () => {
    const now = new Date().toISOString();

    const owner = createUser({
      id: createId(),
      email: "owner@example.com",
      username: "owner",
      displayName: "Owner",
      passwordHash: "hash",
      createdAt: now,
      updatedAt: now
    });
    const other = createUser({
      id: createId(),
      email: "other@example.com",
      username: "other",
      displayName: "Other",
      passwordHash: "hash",
      createdAt: now,
      updatedAt: now
    });

    const otherToken = signToken(other);

    const publicNote = createNote({
      id: createId(),
      userId: owner.id,
      title: "Public note",
      summary: "Public summary",
      contentRaw: "Public content",
      visibility: "public",
      status: "published",
      primaryTool: "Kling",
      difficultyLevel: "beginner",
      tags: [],
      steps: [
        {
          id: createId(),
          stepIndex: 1,
          title: "Stage 1",
          description: "Desc",
          promptText: "Prompt"
        }
      ],
      createdAt: now,
      updatedAt: now
    });

    const privateNote = createNote({
      ...publicNote,
      id: createId(),
      visibility: "private",
      title: "Private note",
      steps: publicNote.steps.map((step) => ({ ...step, id: createId() }))
    });

    const missingRes = await request(app)
      .post("/api/community/bookmarks/not-existing-note-id")
      .set("Authorization", `Bearer ${otherToken}`);
    expect(missingRes.status).toBe(404);

    const privateRes = await request(app)
      .post(`/api/community/bookmarks/${privateNote.id}`)
      .set("Authorization", `Bearer ${otherToken}`);
    expect(privateRes.status).toBe(403);

    const publicRes = await request(app)
      .post(`/api/community/bookmarks/${publicNote.id}`)
      .set("Authorization", `Bearer ${otherToken}`);
    expect(publicRes.status).toBe(201);

    const listRes = await request(app)
      .get("/api/community/bookmarks")
      .set("Authorization", `Bearer ${otherToken}`);
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.some((note: { id: string }) => note.id === publicNote.id)).toBe(true);
    expect(listRes.body.some((note: { id: string }) => note.id === privateNote.id)).toBe(false);
  });
});
