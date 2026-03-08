export type Visibility = "private" | "public" | "paid_pool";

export interface WorkflowStep {
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
  steps: Array<WorkflowStep & { id: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowExampleSummary {
  slug: string;
  title: string;
  summary: string;
  date: string;
  coverImageUrl?: string;
}

export interface WorkflowExampleStage {
  id: string;
  index: number;
  name: string;
  type: string;
  link: string;
  input: string;
  prompt?: string;
  output?: string;
}

export interface WorkflowExampleDetail {
  slug: string;
  title: string;
  summary: string;
  stages: WorkflowExampleStage[];
  startInput: string;
  endOutput?: string;
  inputImageUrl?: string;
  outputVideoUrl?: string;
  infoRaw: string;
}
