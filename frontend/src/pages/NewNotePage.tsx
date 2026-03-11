import { useState } from "react";
import { createNote } from "../lib/api";
import { Visibility } from "../lib/types";

interface Props {
  token: string;
}

interface StepDraft {
  id: string;
  title: string;
  description: string;
  toolName: string;
  promptText: string;
}

const makeStep = (index: number): StepDraft => ({
  id: `draft-${Date.now()}-${index}`,
  title: `Stage ${index}`,
  description: "",
  toolName: "",
  promptText: ""
});

export const NewNotePage = ({ token }: Props) => {
  const [title, setTitle] = useState("Kling Outfit Demo");
  const [summary, setSummary] = useState("Image-to-video workflow for outfit switch");
  const [contentRaw, setContentRaw] = useState("# Goal\nGenerate a clean outfit transition video.");
  const [primaryTool, setPrimaryTool] = useState("Kling");
  const [difficultyLevel, setDifficultyLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [tags, setTags] = useState("image-to-video,fashion,cinematic");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [steps, setSteps] = useState<StepDraft[]>([
    {
      id: "step-1",
      title: "Stage 1",
      description: "Prepare the source image or prompt",
      toolName: "Flux",
      promptText: "Generate two Chinese person, a woman in black hair, one man in white shirt on the red background image."
    },
    {
      id: "step-2",
      title: "Stage 2",
      description: "Animate with task-specific transformation prompt",
      toolName: "Kling",
      promptText: "无形双手进入画面，流畅帮女人换衣服，带面膜，梳头，化妆，男人静止微笑；自然过渡；"
    }
  ]);

  const addStep = () => setSteps((prev) => [...prev, makeStep(prev.length + 1)]);

  const deleteStep = (id: string) => {
    setSteps((prev) => (prev.length > 1 ? prev.filter((step) => step.id !== id) : prev));
  };

  const updateStep = (id: string, key: keyof Omit<StepDraft, "id">, value: string) => {
    setSteps((prev) => prev.map((step) => (step.id === id ? { ...step, [key]: value } : step)));
  };

  const submit = async () => {
    if (!token) {
      setSuccess(false);
      setMessage("Please login first");
      return;
    }

    if (steps.some((step) => !step.title || !step.description || !step.promptText)) {
      setSuccess(false);
      setMessage("Please complete all workflow steps before publishing.");
      return;
    }

    setSubmitting(true);
    setMessage("");
    try {
      await createNote(token, {
        title,
        summary,
        contentRaw,
        visibility,
        status: "published",
        primaryTool,
        difficultyLevel,
        tags: tags
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        steps: steps.map((step, idx) => ({
          stepIndex: idx + 1,
          title: step.title,
          description: step.description,
          promptText: step.promptText,
          toolName: step.toolName || undefined
        }))
      });

      setSuccess(true);
      setMessage("Workflow note created successfully.");
    } catch (error) {
      setSuccess(false);
      setMessage(error instanceof Error ? error.message : "Failed to create note.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="page-enter form-page single">
      <div className="panel">
        <p className="hero-kicker">Creator Studio</p>
        <h2>Publish an editable workflow</h2>
        <p className="muted">Describe your goal, then split the process into clear stages with prompt text.</p>

        <div className="row">
          <label>
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label>
            Primary Tool
            <input value={primaryTool} onChange={(e) => setPrimaryTool(e.target.value)} />
          </label>
        </div>

        <label>
          Summary
          <input value={summary} onChange={(e) => setSummary(e.target.value)} />
        </label>

        <div className="row">
          <label>
            Difficulty
            <select value={difficultyLevel} onChange={(e) => setDifficultyLevel(e.target.value as typeof difficultyLevel)}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </label>
          <label>
            Visibility
            <select value={visibility} onChange={(e) => setVisibility(e.target.value as Visibility)}>
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="paid_pool">Pool</option>
            </select>
          </label>
        </div>

        <label>
          Tags
          <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="comma,separated,tags" />
        </label>

        <label>
          Long Content / Notes
          <textarea rows={6} value={contentRaw} onChange={(e) => setContentRaw(e.target.value)} />
        </label>
      </div>

      <div className="panel">
        <div className="step-head">
          <p className="hero-kicker">Workflow Stages</p>
          <button className="secondary" onClick={addStep}>+ Add Stage</button>
        </div>

        <div className="step-list">
          {steps.map((step, idx) => (
            <article className="step-card" key={step.id}>
              <div className="step-card-head">
                <h4>Stage {idx + 1}</h4>
                <button className="secondary" onClick={() => deleteStep(step.id)}>Delete</button>
              </div>

              <div className="row">
                <label>
                  Name
                  <input value={step.title} onChange={(e) => updateStep(step.id, "title", e.target.value)} />
                </label>
                <label>
                  App / Tool
                  <input value={step.toolName} onChange={(e) => updateStep(step.id, "toolName", e.target.value)} />
                </label>
              </div>

              <label>
                Task Description
                <textarea rows={2} value={step.description} onChange={(e) => updateStep(step.id, "description", e.target.value)} />
              </label>

              <label>
                Edge Prompt / Task Prompt
                <textarea rows={3} value={step.promptText} onChange={(e) => updateStep(step.id, "promptText", e.target.value)} />
              </label>
            </article>
          ))}
        </div>

        <button onClick={submit} disabled={submitting}>{submitting ? "Publishing..." : "Publish Workflow"}</button>
        {message ? <div className={`status-bar ${success ? "success" : ""}`}>{message}</div> : null}
      </div>
    </section>
  );
};
