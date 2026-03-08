import fs from "node:fs";
import path from "node:path";
import { Bookmark, DatabaseShape, Note, User } from "./types.js";

const dataDir = path.resolve(process.cwd(), "src/data");
const dbPath = path.join(dataDir, "db.json");

const defaultDb: DatabaseShape = {
  users: [],
  notes: [],
  bookmarks: []
};

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

const shouldSeed = () => process.env.NODE_ENV !== "test" && process.env.DISABLE_SEED !== "1";

const applySeedData = (db: DatabaseShape): boolean => {
  if (!shouldSeed()) return false;

  let changed = false;

  const hasDemoUser = db.users.some((u) => u.email.toLowerCase() === DEMO_USER.email.toLowerCase());
  if (!hasDemoUser) {
    db.users.push(DEMO_USER);
    changed = true;
  }

  for (const demoNote of DEMO_NOTES) {
    if (!db.notes.some((n) => n.id === demoNote.id)) {
      db.notes.push(demoNote);
      changed = true;
    }
  }

  return changed;
};

const ensureDb = () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dbPath)) {
    const initial = { ...defaultDb, users: [], notes: [], bookmarks: [] };
    applySeedData(initial);
    fs.writeFileSync(dbPath, JSON.stringify(initial, null, 2));
    return;
  }

  const raw = fs.readFileSync(dbPath, "utf-8");
  const parsed = JSON.parse(raw) as DatabaseShape;
  if (applySeedData(parsed)) {
    fs.writeFileSync(dbPath, JSON.stringify(parsed, null, 2));
  }
};

export const readDb = (): DatabaseShape => {
  ensureDb();
  const raw = fs.readFileSync(dbPath, "utf-8");
  return JSON.parse(raw) as DatabaseShape;
};

export const writeDb = (db: DatabaseShape) => {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
};

export const findUserByEmail = (email: string): User | undefined => {
  const db = readDb();
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
};

export const findUserById = (id: string): User | undefined => {
  const db = readDb();
  return db.users.find((u) => u.id === id);
};

export const createUser = (user: User): User => {
  const db = readDb();
  db.users.push(user);
  writeDb(db);
  return user;
};

export const createNote = (note: Note): Note => {
  const db = readDb();
  db.notes.push(note);
  writeDb(db);
  return note;
};

export const updateNote = (noteId: string, updater: (note: Note) => Note): Note | null => {
  const db = readDb();
  const idx = db.notes.findIndex((n) => n.id === noteId);
  if (idx < 0) return null;
  db.notes[idx] = updater(db.notes[idx]);
  writeDb(db);
  return db.notes[idx];
};

export const getNoteById = (noteId: string): Note | undefined => {
  const db = readDb();
  return db.notes.find((n) => n.id === noteId);
};

export const listMyNotes = (userId: string): Note[] => {
  const db = readDb();
  return db.notes.filter((n) => n.userId === userId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

export const searchPublicNotes = (keyword: string, tool?: string, difficulty?: string): Note[] => {
  const db = readDb();
  const k = keyword.trim().toLowerCase();
  return db.notes
    .filter((n) => n.visibility !== "private" && n.status === "published")
    .filter((n) => {
      const keywordHit =
        !k ||
        [n.title, n.summary, n.contentRaw, ...n.tags, n.primaryTool].join(" ").toLowerCase().includes(k);
      const toolHit = !tool || n.primaryTool.toLowerCase() === tool.toLowerCase();
      const diffHit = !difficulty || n.difficultyLevel === difficulty;
      return keywordHit && toolHit && diffHit;
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

export const upsertBookmark = (bookmark: Bookmark): Bookmark => {
  const db = readDb();
  const existing = db.bookmarks.find((b) => b.userId === bookmark.userId && b.noteId === bookmark.noteId);
  if (existing) {
    return existing;
  }
  db.bookmarks.push(bookmark);
  writeDb(db);
  return bookmark;
};

export const listBookmarks = (userId: string): Note[] => {
  const db = readDb();
  const bookmarkedIds = new Set(db.bookmarks.filter((b) => b.userId === userId).map((b) => b.noteId));
  return db.notes
    .filter((n) => bookmarkedIds.has(n.id) && n.visibility !== "private")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

export const resetDb = () => {
  writeDb(defaultDb);
};
