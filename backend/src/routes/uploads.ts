import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { Router } from "express";
import { createUpload, getNoteById, listUploadsByUser } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { createId } from "../utils/id.js";

const router = Router();

const uploadsRoot = path.resolve(process.cwd(), "../assets/uploads");
if (!fs.existsSync(uploadsRoot)) {
  fs.mkdirSync(uploadsRoot, { recursive: true });
}

const sanitizeFilename = (name: string): string => {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsRoot),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    cb(null, `${unique}-${sanitizeFilename(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024
  }
});

router.post("/", requireAuth, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Missing file field: file" });
  }

  const noteIdRaw = typeof req.body.noteId === "string" ? req.body.noteId.trim() : "";
  const noteId = noteIdRaw || undefined;

  if (noteId) {
    const note = getNoteById(noteId);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }
    if (note.userId !== req.user!.id) {
      return res.status(403).json({ message: "Cannot attach upload to another user's note" });
    }
  }

  const uploadRecord = createUpload({
    id: createId(),
    userId: req.user!.id,
    noteId,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    storagePath: `/media/uploads/${req.file.filename}`,
    sizeBytes: req.file.size,
    createdAt: new Date().toISOString()
  });

  return res.status(201).json(uploadRecord);
});

router.get("/mine", requireAuth, (req, res) => {
  return res.status(200).json(listUploadsByUser(req.user!.id));
});

export default router;
