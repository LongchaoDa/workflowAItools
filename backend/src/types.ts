export type Visibility = "private" | "public" | "paid_pool";

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStep {
  id: string;
  stepIndex: number;
  title: string;
  description: string;
  toolName?: string;
  promptText: string;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  summary: string;
  contentRaw: string;
  visibility: Visibility;
  status: "draft" | "published";
  primaryTool: string;
  difficultyLevel: "beginner" | "intermediate" | "advanced";
  tags: string[];
  steps: WorkflowStep[];
  createdAt: string;
  updatedAt: string;
}

export interface Bookmark {
  id: string;
  userId: string;
  noteId: string;
  createdAt: string;
}

export interface UploadAsset {
  id: string;
  userId: string;
  noteId?: string;
  originalName: string;
  mimeType: string;
  storagePath: string;
  sizeBytes: number;
  createdAt: string;
}
