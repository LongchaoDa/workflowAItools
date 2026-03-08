import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createId } from "../utils/id.js";
import { createUser, findUserByEmail } from "../db.js";
import { signToken } from "../auth.js";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(2).max(24),
  displayName: z.string().min(1).max(40),
  password: z.string().min(6)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.flatten() });
  }

  const exists = findUserByEmail(parsed.data.email);
  if (exists) {
    return res.status(409).json({ message: "Email already used" });
  }

  const now = new Date().toISOString();
  const user = createUser({
    id: createId(),
    email: parsed.data.email,
    username: parsed.data.username,
    displayName: parsed.data.displayName,
    passwordHash: await bcrypt.hash(parsed.data.password, 10),
    createdAt: now,
    updatedAt: now
  });

  const token = signToken(user);
  return res.status(201).json({
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName
    }
  });
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.flatten() });
  }

  const user = findUserByEmail(parsed.data.email);
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const match = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = signToken(user);
  return res.status(200).json({
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName
    }
  });
});

export default router;
