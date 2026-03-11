import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { Bookmark, Note, UploadAsset, User, WorkflowStep } from "./types.js";

const resolveDbPath = (): string => {
  const override = process.env.DB_PATH?.trim();
  if (override) {
    return path.isAbsolute(override) ? override : path.resolve(process.cwd(), override);
  }

  const testWorkerId = process.env.VITEST_POOL_ID ?? process.env.VITEST_WORKER_ID ?? String(process.pid);
  const filename = process.env.NODE_ENV === "test" ? `app.test.${testWorkerId}.db` : "app.db";
  return path.resolve(process.cwd(), "src/data", filename);
};

const dbPath = resolveDbPath();
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma("foreign_keys = ON");

interface UserRow {
  id: string;
  email: string;
  username: string;
  display_name: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

interface NoteRow {
  id: string;
  user_id: string;
  title: string;
  summary: string;
  content_raw: string;
  visibility: "private" | "public" | "paid_pool";
  status: "draft" | "published";
  primary_tool: string;
  difficulty_level: "beginner" | "intermediate" | "advanced";
  tags_json: string;
  created_at: string;
  updated_at: string;
}

interface StepRow {
  id: string;
  note_id: string;
  step_index: number;
  title: string;
  description: string;
  tool_name: string | null;
  prompt_text: string;
}

interface BookmarkRow {
  id: string;
  user_id: string;
  note_id: string;
  created_at: string;
}

interface UploadRow {
  id: string;
  user_id: string;
  note_id: string | null;
  original_name: string;
  mime_type: string;
  storage_path: string;
  size_bytes: number;
  created_at: string;
}

const DEMO_USER: User = {
  id: "demo-user-0001",
  email: "demo@workflowbase.ai",
  username: "demo_creator",
  displayName: "Workflow Demo",
  passwordHash: "$2a$10$Bd1oPewcc9qZ9vDYhKZGrODxF5488Cr8JjVIYlTilvT2iDcTHo26a",
  createdAt: "2026-03-08T00:00:00.000Z",
  updatedAt: "2026-03-08T00:00:00.000Z"
};

const DEMO_NOTES: Note[] = [
  {
    id: "demo-note-001",
    userId: DEMO_USER.id,
    title: "Kling Outfit Switch Demo",
    summary: "Image-to-video workflow for smooth clothing transition clips.",
    contentRaw: "# Goal\nCreate a cinematic outfit switch video from a single portrait image.",
    visibility: "public",
    status: "published",
    primaryTool: "Kling",
    difficultyLevel: "beginner",
    tags: ["image-to-video", "fashion", "cinematic"],
    steps: [
      {
        id: "demo-step-001-a",
        stepIndex: 1,
        title: "Prepare source image",
        description: "Use a high-resolution portrait with clear subject outline.",
        toolName: "Photoshop",
        promptText: "clean background, centered composition"
      },
      {
        id: "demo-step-001-b",
        stepIndex: 2,
        title: "Animate in Kling",
        description: "Generate motion with stable camera and smooth transition.",
        toolName: "Kling",
        promptText: "outfit transitions smoothly, cinematic lighting, natural body movement"
      }
    ],
    createdAt: "2026-03-08T00:00:00.000Z",
    updatedAt: "2026-03-08T00:00:00.000Z"
  },
  {
    id: "demo-note-002",
    userId: DEMO_USER.id,
    title: "Midjourney Product Hero Shot",
    summary: "Structured prompt recipe for commercial-grade product key visuals.",
    contentRaw: "# Prompt Recipe\nCombine lens, texture, and lighting constraints for clean ad output.",
    visibility: "public",
    status: "published",
    primaryTool: "Midjourney",
    difficultyLevel: "intermediate",
    tags: ["product", "advertising", "image"],
    steps: [
      {
        id: "demo-step-002-a",
        stepIndex: 1,
        title: "Build prompt frame",
        description: "Define subject, lens, texture, and color temperature.",
        toolName: "Midjourney",
        promptText: "premium product hero shot, 35mm, soft studio reflections, detailed textures --ar 4:5"
      }
    ],
    createdAt: "2026-03-07T00:00:00.000Z",
    updatedAt: "2026-03-07T00:00:00.000Z"
  }
];

const shouldSeed = (): boolean => process.env.NODE_ENV !== "test" && process.env.DISABLE_SEED !== "1";

const parseTags = (raw: string): string[] => {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
};

const mapUser = (row: UserRow): User => {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    displayName: row.display_name,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

const mapStep = (row: StepRow): WorkflowStep => {
  return {
    id: row.id,
    stepIndex: row.step_index,
    title: row.title,
    description: row.description,
    toolName: row.tool_name ?? undefined,
    promptText: row.prompt_text
  };
};

const loadSteps = (noteId: string): WorkflowStep[] => {
  const rows = db
    .prepare(
      `SELECT id, note_id, step_index, title, description, tool_name, prompt_text
       FROM workflow_steps
       WHERE note_id = ?
       ORDER BY step_index ASC`
    )
    .all(noteId) as StepRow[];
  return rows.map(mapStep);
};

const mapNote = (row: NoteRow): Note => {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    summary: row.summary,
    contentRaw: row.content_raw,
    visibility: row.visibility,
    status: row.status,
    primaryTool: row.primary_tool,
    difficultyLevel: row.difficulty_level,
    tags: parseTags(row.tags_json),
    steps: loadSteps(row.id),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

const mapBookmark = (row: BookmarkRow): Bookmark => {
  return {
    id: row.id,
    userId: row.user_id,
    noteId: row.note_id,
    createdAt: row.created_at
  };
};

const mapUpload = (row: UploadRow): UploadAsset => {
  return {
    id: row.id,
    userId: row.user_id,
    noteId: row.note_id ?? undefined,
    originalName: row.original_name,
    mimeType: row.mime_type,
    storagePath: row.storage_path,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at
  };
};

const createSchema = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      username TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      content_raw TEXT NOT NULL,
      visibility TEXT NOT NULL CHECK (visibility IN ('private', 'public', 'paid_pool')),
      status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
      primary_tool TEXT NOT NULL,
      difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
      tags_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS workflow_steps (
      id TEXT PRIMARY KEY,
      note_id TEXT NOT NULL,
      step_index INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      tool_name TEXT,
      prompt_text TEXT NOT NULL,
      FOREIGN KEY(note_id) REFERENCES notes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      note_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, note_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(note_id) REFERENCES notes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS uploads (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      note_id TEXT,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      storage_path TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(note_id) REFERENCES notes(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
    CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at);
    CREATE INDEX IF NOT EXISTS idx_steps_note_id ON workflow_steps(note_id, step_index);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
    CREATE INDEX IF NOT EXISTS idx_uploads_user_id ON uploads(user_id);
  `);
};

const insertNoteWithStepsTx = db.transaction((note: Note) => {
  db.prepare(
    `INSERT INTO notes (
      id, user_id, title, summary, content_raw, visibility, status,
      primary_tool, difficulty_level, tags_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    note.id,
    note.userId,
    note.title,
    note.summary,
    note.contentRaw,
    note.visibility,
    note.status,
    note.primaryTool,
    note.difficultyLevel,
    JSON.stringify(note.tags),
    note.createdAt,
    note.updatedAt
  );

  const insertStep = db.prepare(
    `INSERT INTO workflow_steps (
      id, note_id, step_index, title, description, tool_name, prompt_text
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  for (const step of note.steps) {
    insertStep.run(
      step.id,
      note.id,
      step.stepIndex,
      step.title,
      step.description,
      step.toolName ?? null,
      step.promptText
    );
  }
});

const replaceNoteWithStepsTx = db.transaction((noteId: string, note: Note) => {
  db.prepare(
    `UPDATE notes
     SET title = ?, summary = ?, content_raw = ?, visibility = ?, status = ?,
         primary_tool = ?, difficulty_level = ?, tags_json = ?, updated_at = ?
     WHERE id = ?`
  ).run(
    note.title,
    note.summary,
    note.contentRaw,
    note.visibility,
    note.status,
    note.primaryTool,
    note.difficultyLevel,
    JSON.stringify(note.tags),
    note.updatedAt,
    noteId
  );

  db.prepare("DELETE FROM workflow_steps WHERE note_id = ?").run(noteId);

  const insertStep = db.prepare(
    `INSERT INTO workflow_steps (
      id, note_id, step_index, title, description, tool_name, prompt_text
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  for (const step of note.steps) {
    insertStep.run(
      step.id,
      noteId,
      step.stepIndex,
      step.title,
      step.description,
      step.toolName ?? null,
      step.promptText
    );
  }
});

const seedIfNeeded = () => {
  if (!shouldSeed()) return;

  const existingDemoUser = db
    .prepare("SELECT id FROM users WHERE lower(email) = lower(?)")
    .get(DEMO_USER.email) as { id: string } | undefined;

  if (!existingDemoUser) {
    db.prepare(
      `INSERT INTO users (id, email, username, display_name, password_hash, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      DEMO_USER.id,
      DEMO_USER.email,
      DEMO_USER.username,
      DEMO_USER.displayName,
      DEMO_USER.passwordHash,
      DEMO_USER.createdAt,
      DEMO_USER.updatedAt
    );
  }

  for (const note of DEMO_NOTES) {
    const exists = db.prepare("SELECT id FROM notes WHERE id = ?").get(note.id) as { id: string } | undefined;
    if (!exists) {
      insertNoteWithStepsTx(note);
    }
  }
};

createSchema();
seedIfNeeded();

export const findUserByEmail = (email: string): User | undefined => {
  const row = db
    .prepare(
      `SELECT id, email, username, display_name, password_hash, created_at, updated_at
       FROM users
       WHERE lower(email) = lower(?)`
    )
    .get(email) as UserRow | undefined;
  return row ? mapUser(row) : undefined;
};

export const findUserById = (id: string): User | undefined => {
  const row = db
    .prepare(
      `SELECT id, email, username, display_name, password_hash, created_at, updated_at
       FROM users
       WHERE id = ?`
    )
    .get(id) as UserRow | undefined;
  return row ? mapUser(row) : undefined;
};

export const createUser = (user: User): User => {
  db.prepare(
    `INSERT INTO users (id, email, username, display_name, password_hash, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(user.id, user.email, user.username, user.displayName, user.passwordHash, user.createdAt, user.updatedAt);

  return user;
};

export const createNote = (note: Note): Note => {
  insertNoteWithStepsTx(note);
  return note;
};

export const updateNote = (noteId: string, updater: (note: Note) => Note): Note | null => {
  const current = getNoteById(noteId);
  if (!current) return null;

  const next = updater(current);
  replaceNoteWithStepsTx(noteId, next);
  return getNoteById(noteId) ?? null;
};

export const getNoteById = (noteId: string): Note | undefined => {
  const row = db
    .prepare(
      `SELECT
         id, user_id, title, summary, content_raw, visibility, status,
         primary_tool, difficulty_level, tags_json, created_at, updated_at
       FROM notes
       WHERE id = ?`
    )
    .get(noteId) as NoteRow | undefined;

  return row ? mapNote(row) : undefined;
};

export const listMyNotes = (userId: string): Note[] => {
  const rows = db
    .prepare(
      `SELECT
         id, user_id, title, summary, content_raw, visibility, status,
         primary_tool, difficulty_level, tags_json, created_at, updated_at
       FROM notes
       WHERE user_id = ?
       ORDER BY updated_at DESC`
    )
    .all(userId) as NoteRow[];

  return rows.map(mapNote);
};

export const searchPublicNotes = (keyword: string, tool?: string, difficulty?: string): Note[] => {
  const clauses = ["visibility != 'private'", "status = 'published'"];
  const params: string[] = [];

  if (tool) {
    clauses.push("lower(primary_tool) = lower(?)");
    params.push(tool);
  }

  if (difficulty) {
    clauses.push("difficulty_level = ?");
    params.push(difficulty);
  }

  const rows = db
    .prepare(
      `SELECT
         id, user_id, title, summary, content_raw, visibility, status,
         primary_tool, difficulty_level, tags_json, created_at, updated_at
       FROM notes
       WHERE ${clauses.join(" AND ")}
       ORDER BY updated_at DESC`
    )
    .all(...params) as NoteRow[];

  const k = keyword.trim().toLowerCase();

  return rows
    .map(mapNote)
    .filter((note) => {
      if (!k) return true;
      return [note.title, note.summary, note.contentRaw, ...note.tags, note.primaryTool].join(" ").toLowerCase().includes(k);
    });
};

export const upsertBookmark = (bookmark: Bookmark): Bookmark => {
  const existing = db
    .prepare(
      `SELECT id, user_id, note_id, created_at
       FROM bookmarks
       WHERE user_id = ? AND note_id = ?`
    )
    .get(bookmark.userId, bookmark.noteId) as BookmarkRow | undefined;

  if (existing) {
    return mapBookmark(existing);
  }

  db.prepare(
    `INSERT INTO bookmarks (id, user_id, note_id, created_at)
     VALUES (?, ?, ?, ?)`
  ).run(bookmark.id, bookmark.userId, bookmark.noteId, bookmark.createdAt);

  return bookmark;
};

export const listBookmarks = (userId: string): Note[] => {
  const rows = db
    .prepare(
      `SELECT
         n.id, n.user_id, n.title, n.summary, n.content_raw, n.visibility, n.status,
         n.primary_tool, n.difficulty_level, n.tags_json, n.created_at, n.updated_at
       FROM bookmarks b
       JOIN notes n ON n.id = b.note_id
       WHERE b.user_id = ? AND n.visibility != 'private'
       ORDER BY n.updated_at DESC`
    )
    .all(userId) as NoteRow[];

  return rows.map(mapNote);
};

export const createUpload = (upload: UploadAsset): UploadAsset => {
  db.prepare(
    `INSERT INTO uploads (
      id, user_id, note_id, original_name, mime_type, storage_path, size_bytes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    upload.id,
    upload.userId,
    upload.noteId ?? null,
    upload.originalName,
    upload.mimeType,
    upload.storagePath,
    upload.sizeBytes,
    upload.createdAt
  );

  return upload;
};

export const listUploadsByUser = (userId: string): UploadAsset[] => {
  const rows = db
    .prepare(
      `SELECT id, user_id, note_id, original_name, mime_type, storage_path, size_bytes, created_at
       FROM uploads
       WHERE user_id = ?
       ORDER BY created_at DESC`
    )
    .all(userId) as UploadRow[];

  return rows.map(mapUpload);
};

export const resetDb = () => {
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM bookmarks").run();
    db.prepare("DELETE FROM workflow_steps").run();
    db.prepare("DELETE FROM uploads").run();
    db.prepare("DELETE FROM notes").run();
    db.prepare("DELETE FROM users").run();
  });

  tx();
};
