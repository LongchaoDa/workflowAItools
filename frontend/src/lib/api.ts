import { Note, WorkflowExampleDetail, WorkflowExampleSummary } from "./types";

export const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:4000";

export interface AuthResponse {
  token: string;
  user: { id: string; email: string; username: string; displayName: string };
}

export const withApiBase = (relativeOrAbsolute: string): string => {
  if (/^https?:\/\//.test(relativeOrAbsolute)) return relativeOrAbsolute;
  return `${API_BASE}${relativeOrAbsolute}`;
};

const readErrorMessage = async (res: Response, fallback: string): Promise<string> => {
  try {
    const data = await res.json();
    if (typeof data?.message === "string") return data.message;
  } catch {
    // ignore json parse error
  }
  return `${fallback} (${res.status})`;
};

export const register = async (payload: {
  email: string;
  username: string;
  displayName: string;
  password: string;
}): Promise<AuthResponse> => {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "Register failed"));
  return res.json();
};

export const login = async (payload: { email: string; password: string }): Promise<AuthResponse> => {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "Login failed"));
  return res.json();
};

export const createNote = async (
  token: string,
  payload: Omit<Note, "id" | "userId" | "createdAt" | "updatedAt" | "steps"> & {
    steps: Array<{
      stepIndex: number;
      title: string;
      description: string;
      promptText: string;
      toolName?: string;
    }>;
  }
) => {
  const res = await fetch(`${API_BASE}/api/notes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "Create note failed"));
  return res.json() as Promise<Note>;
};

export const listMyNotes = async (token: string): Promise<Note[]> => {
  const res = await fetch(`${API_BASE}/api/notes/mine`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "Fetch notes failed"));
  return res.json();
};

export const getNoteById = async (id: string, token?: string): Promise<Note> => {
  const res = await fetch(`${API_BASE}/api/notes/${id}`, {
    headers: token
      ? {
          Authorization: `Bearer ${token}`
        }
      : undefined
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Fetch note detail failed"));
  }
  return res.json();
};

export const searchPublicNotes = async (keyword: string): Promise<Note[]> => {
  const url = new URL(`${API_BASE}/api/community/search`);
  if (keyword) url.searchParams.set("keyword", keyword);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(await readErrorMessage(res, "Search failed"));
  return res.json();
};

export const bookmark = async (token: string, noteId: string) => {
  const res = await fetch(`${API_BASE}/api/community/bookmarks/${noteId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "Bookmark failed"));
  return res.json();
};

export const listBookmarks = async (token: string): Promise<Note[]> => {
  const res = await fetch(`${API_BASE}/api/community/bookmarks`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "Fetch bookmarks failed"));
  return res.json();
};

export const listWorkflowExamples = async (): Promise<WorkflowExampleSummary[]> => {
  const res = await fetch(`${API_BASE}/api/workflows/examples`);
  if (!res.ok) throw new Error(await readErrorMessage(res, "Fetch workflow examples failed"));
  return res.json();
};

export const getWorkflowExample = async (slug: string): Promise<WorkflowExampleDetail> => {
  const res = await fetch(`${API_BASE}/api/workflows/examples/${slug}`);
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Fetch workflow example failed"));
  }
  return res.json();
};
