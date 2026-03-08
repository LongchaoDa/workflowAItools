import jwt from "jsonwebtoken";
import { User } from "./types.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";

export const signToken = (user: User): string => {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      username: user.username
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
};

export const verifyToken = (token: string): { sub: string; email: string; username: string } => {
  return jwt.verify(token, JWT_SECRET) as { sub: string; email: string; username: string };
};
