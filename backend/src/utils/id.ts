import crypto from "node:crypto";

export const createId = () => crypto.randomUUID();
