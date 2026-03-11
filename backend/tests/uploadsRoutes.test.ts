import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, test } from "vitest";
import request from "supertest";
import { buildApp } from "../src/app.js";
import { createNote, createUser, resetDb } from "../src/db.js";
import { signToken } from "../src/auth.js";
import { createId } from "../src/utils/id.js";

const app = buildApp();

const uploadAbsPath = (publicPath: string): string => {
  const relative = publicPath.replace(/^\/media\//, "");
  return path.resolve(process.cwd(), "../assets", relative);
};

describe("uploads route", () => {
  beforeEach(() => {
    resetDb();
  });

  test("stores upload metadata in database and returns user upload list", async () => {
    const now = new Date().toISOString();

    const user = createUser({
      id: createId(),
      email: "upload-user@example.com",
      username: "upload_user",
      displayName: "Upload User",
      passwordHash: "hash",
      createdAt: now,
      updatedAt: now
    });

    const note = createNote({
      id: createId(),
      userId: user.id,
      title: "Upload Note",
      summary: "Note for upload attach",
      contentRaw: "content",
      visibility: "public",
      status: "published",
      primaryTool: "Kling",
      difficultyLevel: "beginner",
      tags: [],
      steps: [
        {
          id: createId(),
          stepIndex: 1,
          title: "Step 1",
          description: "desc",
          promptText: "prompt"
        }
      ],
      createdAt: now,
      updatedAt: now
    });

    const token = signToken(user);

    const uploadRes = await request(app)
      .post("/api/uploads")
      .set("Authorization", `Bearer ${token}`)
      .field("noteId", note.id)
      .attach("file", Buffer.from("test-file-content"), "prompt.txt");

    expect(uploadRes.status).toBe(201);
    expect(uploadRes.body.userId).toBe(user.id);
    expect(uploadRes.body.noteId).toBe(note.id);
    expect(uploadRes.body.storagePath).toMatch(/^\/media\/uploads\//);

    const listRes = await request(app)
      .get("/api/uploads/mine")
      .set("Authorization", `Bearer ${token}`);

    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBe(1);
    expect(listRes.body[0].originalName).toBe("prompt.txt");

    const savedFilePath = uploadAbsPath(uploadRes.body.storagePath);
    if (fs.existsSync(savedFilePath)) {
      fs.unlinkSync(savedFilePath);
    }
  });
});
