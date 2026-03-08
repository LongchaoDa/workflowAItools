import { Router } from "express";
import { z } from "zod";
import { verifyToken } from "../auth.js";
import { requireAuth } from "../middleware/auth.js";
import { createId } from "../utils/id.js";
import { createNote, getNoteById, listMyNotes, updateNote } from "../db.js";

const router = Router();

const stepSchema = z.object({
  stepIndex: z.number().int().min(1),
  title: z.string().min(1).max(120),
  description: z.string().min(1),
  toolName: z.string().optional(),
  promptText: z.string().min(1)
});

const createSchema = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().min(1).max(500),
  contentRaw: z.string().min(1),
  visibility: z.enum(["private", "public", "paid_pool"]),
  status: z.enum(["draft", "published"]),
  primaryTool: z.string().min(1).max(60),
  difficultyLevel: z.enum(["beginner", "intermediate", "advanced"]),
  tags: z.array(z.string().min(1)).default([]),
  steps: z.array(stepSchema).min(1)
});

const patchSchema = createSchema.partial();

router.post("/", requireAuth, (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.flatten() });
  }

  const now = new Date().toISOString();
  const note = createNote({
    id: createId(),
    userId: req.user!.id,
    title: parsed.data.title,
    summary: parsed.data.summary,
    contentRaw: parsed.data.contentRaw,
    visibility: parsed.data.visibility,
    status: parsed.data.status,
    primaryTool: parsed.data.primaryTool,
    difficultyLevel: parsed.data.difficultyLevel,
    tags: parsed.data.tags,
    steps: parsed.data.steps.map((s) => ({ ...s, id: createId() })),
    createdAt: now,
    updatedAt: now
  });

  return res.status(201).json(note);
});

router.get("/mine", requireAuth, (req, res) => {
  return res.status(200).json(listMyNotes(req.user!.id));
});

router.patch("/:id", requireAuth, (req, res) => {
  const noteId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.flatten() });
  }

  const note = getNoteById(noteId);
  if (!note) {
    return res.status(404).json({ message: "Note not found" });
  }
  if (note.userId !== req.user!.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const updated = updateNote(noteId, (n) => {
    return {
      ...n,
      ...parsed.data,
      steps: parsed.data.steps ? parsed.data.steps.map((s) => ({ ...s, id: createId() })) : n.steps,
      updatedAt: new Date().toISOString()
    };
  });

  return res.status(200).json(updated);
});

router.get("/:id", (req, res) => {
  const noteId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const note = getNoteById(noteId);
  if (!note) {
    return res.status(404).json({ message: "Note not found" });
  }

  let requesterId = "";
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "").trim();
    try {
      requesterId = verifyToken(token).sub;
    } catch {
      requesterId = "";
    }
  }

  if (note.visibility === "private") {
    if (requesterId === note.userId) {
      return res.status(200).json(note);
    }
    return res.status(403).json({ message: "Private note" });
  }

  return res.status(200).json(note);
});

export default router;
