import fs from "node:fs";
import path from "node:path";

export interface WorkflowStage {
  id: string;
  index: number;
  name: string;
  type: string;
  link: string;
  input: string;
  prompt?: string;
  output?: string;
}

export interface WorkflowExampleSummary {
  slug: string;
  title: string;
  summary: string;
  date: string;
  coverImageUrl?: string;
}

export interface WorkflowExampleDetail {
  slug: string;
  title: string;
  summary: string;
  stages: WorkflowStage[];
  startInput: string;
  endOutput?: string;
  inputImageUrl?: string;
  outputVideoUrl?: string;
  infoRaw: string;
}

const assetsRoot = path.resolve(process.cwd(), "../assets");

const isFileLike = (value: string): boolean => {
  return /\.[a-zA-Z0-9]{2,5}$/.test(value.trim());
};

const toMediaUrl = (slug: string, filename: string): string => {
  return `/media/${encodeURIComponent(slug)}/${encodeURIComponent(filename)}`;
};

const sanitizeSlug = (slug: string): string => {
  if (!/^[a-zA-Z0-9_-]+$/.test(slug)) {
    throw new Error("Invalid slug");
  }
  return slug;
};

export const parseWorkflowInfo = (text: string): WorkflowStage[] => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const stages = new Map<number, WorkflowStage>();

  const ensureStage = (index: number): WorkflowStage => {
    const existing = stages.get(index);
    if (existing) return existing;

    const fresh: WorkflowStage = {
      id: `stage-${index}`,
      index,
      name: `Stage ${index}`,
      type: "",
      link: "",
      input: ""
    };
    stages.set(index, fresh);
    return fresh;
  };

  for (const line of lines) {
    const stageMatch = line.match(/^Stage\s*(\d+)\s*Name\s*:\s*(.+)$/i);
    if (stageMatch) {
      const index = Number(stageMatch[1]);
      const stage = ensureStage(index);
      stage.name = stageMatch[2].trim();
      continue;
    }

    const typeMatch = line.match(/^Type\s*:\s*(.+)$/i);
    if (typeMatch) {
      const index = Math.max(...Array.from(stages.keys()));
      if (Number.isFinite(index)) {
        ensureStage(index).type = typeMatch[1].trim();
      }
      continue;
    }

    const linkMatch = line.match(/^Link\s*:\s*(.+)$/i);
    if (linkMatch) {
      const index = Math.max(...Array.from(stages.keys()));
      if (Number.isFinite(index)) {
        ensureStage(index).link = linkMatch[1].trim();
      }
      continue;
    }

    const inputMatch = line.match(/^Input\s*:\s*(.+)$/i);
    if (inputMatch) {
      const index = Math.max(...Array.from(stages.keys()));
      if (Number.isFinite(index)) {
        ensureStage(index).input = inputMatch[1].trim();
      }
      continue;
    }

    const promptMatch = line.match(/^Prompt\s*:\s*(.+)$/i);
    if (promptMatch) {
      const index = Math.max(...Array.from(stages.keys()));
      if (Number.isFinite(index)) {
        ensureStage(index).prompt = promptMatch[1].trim();
      }
      continue;
    }

    const outputMatch = line.match(/^Output\s*:\s*(.+)$/i);
    if (outputMatch) {
      const index = Math.max(...Array.from(stages.keys()));
      if (Number.isFinite(index)) {
        ensureStage(index).output = outputMatch[1].trim();
      }
      continue;
    }
  }

  return Array.from(stages.values()).sort((a, b) => a.index - b.index);
};

const readInfoFile = (slug: string): { infoRaw: string; infoPath: string } => {
  const safeSlug = sanitizeSlug(slug);
  const infoPath = path.resolve(assetsRoot, safeSlug, "info.txt");

  if (!infoPath.startsWith(path.resolve(assetsRoot))) {
    throw new Error("Invalid path");
  }

  if (!fs.existsSync(infoPath)) {
    throw new Error("Workflow not found");
  }

  return {
    infoRaw: fs.readFileSync(infoPath, "utf-8"),
    infoPath
  };
};

export const getWorkflowExample = (slug: string): WorkflowExampleDetail => {
  const { infoRaw, infoPath } = readInfoFile(slug);
  const stages = parseWorkflowInfo(infoRaw);

  if (stages.length === 0) {
    throw new Error("No stages parsed");
  }

  const first = stages[0];
  const last = stages[stages.length - 1];

  const title = `${last.name} Workflow Demo`;
  const summary = `${first.type} → ${last.type}`;

  const inputImage = stages.find((s) => isFileLike(s.input))?.input;
  const outputVideo = stages.find((s) => s.output && /\.mp4$/i.test(s.output))?.output;

  return {
    slug,
    title,
    summary,
    stages,
    startInput: first.input,
    endOutput: last.output,
    inputImageUrl: inputImage ? toMediaUrl(slug, inputImage) : undefined,
    outputVideoUrl: outputVideo ? toMediaUrl(slug, outputVideo) : undefined,
    infoRaw,
  };
};

export const listWorkflowExamples = (): WorkflowExampleSummary[] => {
  if (!fs.existsSync(assetsRoot)) return [];

  const dirs = fs
    .readdirSync(assetsRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((slug) => fs.existsSync(path.resolve(assetsRoot, slug, "info.txt")));

  return dirs
    .map((slug) => {
      const detail = getWorkflowExample(slug);
      const infoStat = fs.statSync(path.resolve(assetsRoot, slug, "info.txt"));
      return {
        slug,
        title: detail.title,
        summary: detail.summary,
        date: infoStat.mtime.toISOString(),
        coverImageUrl: detail.inputImageUrl
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
};
