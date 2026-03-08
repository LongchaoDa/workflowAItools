import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { listBookmarks, searchPublicNotes, upsertBookmark } from "../db.js";
import { createId } from "../utils/id.js";

const router = Router();

const querySchema = z.object({
  keyword: z.string().optional(),
  tool: z.string().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional()
});

router.get("/search", (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.flatten() });
  }

  const notes = searchPublicNotes(parsed.data.keyword ?? "", parsed.data.tool, parsed.data.difficulty);
  return res.status(200).json(notes);
});

router.post("/bookmarks/:noteId", requireAuth, (req, res) => {
  const noteId = Array.isArray(req.params.noteId) ? req.params.noteId[0] : req.params.noteId;
  const bookmark = upsertBookmark({
    id: createId(),
    userId: req.user!.id,
    noteId,
    createdAt: new Date().toISOString()
  });

  return res.status(201).json(bookmark);
});

router.get("/bookmarks", requireAuth, (req, res) => {
  return res.status(200).json(listBookmarks(req.user!.id));
});

export default router;
