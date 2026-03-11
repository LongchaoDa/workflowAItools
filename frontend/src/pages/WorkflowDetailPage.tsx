import { CSSProperties, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useParams } from "react-router-dom";
import { GraphEdge, GraphNode, WorkflowGraph } from "../components/WorkflowGraph";
import { getNoteById, getWorkflowExample, withApiBase } from "../lib/api";
import { Note, WorkflowExampleDetail, WorkflowExampleStage } from "../lib/types";

type SourceKind = "example" | "note";

const trimText = (text: string, max = 95): string => {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
};

const IMAGE_FILE_RE = /\.(png|jpe?g|webp|gif|bmp|svg)$/i;

const isImageFile = (value?: string): value is string => Boolean(value && IMAGE_FILE_RE.test(value.trim()));

const toExampleMediaUrl = (slug: string, file: string): string => {
  return withApiBase(`/media/${encodeURIComponent(slug)}/${encodeURIComponent(file)}`);
};

const inferExampleStageType = (stages: WorkflowExampleStage[], index: number): string => {
  const stage = stages[index];
  const next = stages[index + 1];
  if (next && isImageFile(next.input) && /text\s*to\s*video/i.test(stage.type)) {
    return stage.type.replace(/text\s*to\s*video/gi, "text to image");
  }
  return stage.type;
};

const inferStageImageFile = (stages: WorkflowExampleStage[], index: number): string | undefined => {
  const stage = stages[index];
  if (isImageFile(stage.output)) return stage.output;
  const next = stages[index + 1];
  if (next && isImageFile(next.input)) return next.input;
  return undefined;
};

interface Props {
  token: string;
}

const RIGHT_WIDTH_KEY = "aiwf_detail_right_width";
const DEFAULT_RIGHT_WIDTH = 300;
const MIN_RIGHT_WIDTH = 220;
const MAX_RIGHT_WIDTH = 560;
const MIN_LEFT_WIDTH = 520;

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const readSavedRightWidth = (): number => {
  if (typeof window === "undefined") return DEFAULT_RIGHT_WIDTH;
  const raw = window.localStorage.getItem(RIGHT_WIDTH_KEY);
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return DEFAULT_RIGHT_WIDTH;
  return clamp(parsed, MIN_RIGHT_WIDTH, MAX_RIGHT_WIDTH);
};

export const WorkflowDetailPage = ({ token }: Props) => {
  const { source = "", id = "" } = useParams();
  const kind = source as SourceKind;

  const [example, setExample] = useState<WorkflowExampleDetail | null>(null);
  const [note, setNote] = useState<Note | null>(null);
  const [error, setError] = useState("");
  const [rightWidth, setRightWidth] = useState<number>(() => readSavedRightWidth());
  const [resizing, setResizing] = useState(false);
  const detailLayoutRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const load = async () => {
      setError("");
      setExample(null);
      setNote(null);

      try {
        if (kind === "example") {
          const data = await getWorkflowExample(id);
          setExample(data);
          return;
        }

        if (kind === "note") {
          const data = await getNoteById(id, token || undefined);
          setNote(data);
          return;
        }

        setError("Unknown workflow source");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load workflow detail";
        setError(message);
      }
    };

    void load();
  }, [kind, id, token]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(RIGHT_WIDTH_KEY, String(Math.round(rightWidth)));
  }, [rightWidth]);

  useEffect(() => {
    if (!resizing) return;

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onPointerMove = (event: PointerEvent) => {
      const layout = detailLayoutRef.current;
      if (!layout) return;

      const rect = layout.getBoundingClientRect();
      const maxByLayout = rect.width - MIN_LEFT_WIDTH;
      const upperBound = clamp(maxByLayout, MIN_RIGHT_WIDTH, MAX_RIGHT_WIDTH);
      const next = rect.right - event.clientX;
      setRightWidth(clamp(next, MIN_RIGHT_WIDTH, upperBound));
    };

    const stopResize = () => setResizing(false);

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopResize);
    window.addEventListener("pointercancel", stopResize);

    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stopResize);
      window.removeEventListener("pointercancel", stopResize);
    };
  }, [resizing]);

  const graph = useMemo<{ nodes: GraphNode[]; edges: GraphEdge[] }>(() => {
    if (example) {
      const nodes: GraphNode[] = [
        {
          id: "start",
          kind: "start",
          label: "Start"
        },
        ...example.stages.map((stage, idx) => {
          const stageType = inferExampleStageType(example.stages, idx);
          const imageFile = inferStageImageFile(example.stages, idx);
          return {
            id: stage.id,
            kind: "app" as const,
            label: stage.name,
            subtitle: stageType,
            link: stage.link,
            imageUrl: imageFile ? toExampleMediaUrl(example.slug, imageFile) : undefined,
            imageAlt: `${stage.name} generated image`
          };
        }),
        {
          id: "end",
          kind: "end",
          label: "Output",
          subtitle: example.endOutput ? trimText(example.endOutput) : "Deliver final file"
        }
      ];

      const edges: GraphEdge[] = [];
      if (example.stages.length > 0) {
        edges.push({
          id: "edge-start",
          from: "start",
          to: example.stages[0].id,
          prompt: example.stages[0].input || "Input prompt"
        });

        for (let i = 0; i < example.stages.length - 1; i += 1) {
          const next = example.stages[i + 1];
          edges.push({
            id: `edge-stage-${i}`,
            from: example.stages[i].id,
            to: next.id,
            prompt: next.prompt || next.input || "Transition"
          });
        }

        edges.push({
          id: "edge-end",
          from: example.stages[example.stages.length - 1].id,
          to: "end",
          prompt: example.stages[example.stages.length - 1].output || "Finalize output"
        });
      }

      return { nodes, edges };
    }

    if (note) {
      const nodes: GraphNode[] = [
        {
          id: "start",
          kind: "start",
          label: "Start"
        },
        ...note.steps.map((step) => ({
          id: step.id,
          kind: "app" as const,
          label: step.title,
          subtitle: step.toolName || note.primaryTool
        })),
        {
          id: "end",
          kind: "end",
          label: "Published Note",
          subtitle: note.visibility
        }
      ];

      const edges: GraphEdge[] = [];
      if (note.steps.length > 0) {
        edges.push({
          id: "edge-note-start",
          from: "start",
          to: note.steps[0].id,
          prompt: note.steps[0].promptText
        });

        for (let i = 0; i < note.steps.length - 1; i += 1) {
          edges.push({
            id: `edge-note-${i}`,
            from: note.steps[i].id,
            to: note.steps[i + 1].id,
            prompt: note.steps[i + 1].promptText
          });
        }

        edges.push({
          id: "edge-note-end",
          from: note.steps[note.steps.length - 1].id,
          to: "end",
          prompt: "Export and publish"
        });
      }

      return { nodes, edges };
    }

    return { nodes: [], edges: [] };
  }, [example, note]);

  const heroSummary = useMemo(() => {
    if (example) {
      if (!example.stages.length) return example.summary;
      const firstType = inferExampleStageType(example.stages, 0) || "workflow";
      const lastType = inferExampleStageType(example.stages, example.stages.length - 1) || "workflow";
      return `${firstType} → ${lastType}`;
    }
    return note?.summary ?? "";
  }, [example, note]);

  const startResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    setResizing(true);
  };

  const resetPaneWidth = () => {
    setRightWidth(DEFAULT_RIGHT_WIDTH);
  };

  if (error) {
    return <section className="panel">{error}</section>;
  }

  if (!example && !note) {
    return <section className="panel">Loading workflow detail...</section>;
  }

  return (
    <section
      className="page-enter detail-layout"
      ref={detailLayoutRef}
      style={{ "--detail-right-width": `${rightWidth}px` } as CSSProperties}
    >
      <div className="detail-main">
        <div className="hero-block compact">
          <p className="hero-kicker">Workflow Detail</p>
          <h1>{example?.title ?? note?.title}</h1>
          <p>{heroSummary}</p>
        </div>

        <WorkflowGraph nodes={graph.nodes} edges={graph.edges} />

        <section className="panel stage-list">
          <p className="hero-kicker">Prompt & Stage Data</p>
          {example
            ? example.stages.map((stage, idx) => (
                <article key={stage.id}>
                  <h4>
                    Stage {idx + 1}: {stage.name}
                  </h4>
                  <p><strong>Type:</strong> {inferExampleStageType(example.stages, idx)}</p>
                  <p><strong>Input:</strong> {stage.input}</p>
                  {stage.prompt ? <p><strong>Prompt:</strong> {stage.prompt}</p> : null}
                  {stage.output ? <p><strong>Output:</strong> {stage.output}</p> : null}
                </article>
              ))
            : note?.steps.map((stage, idx) => (
                <article key={stage.id}>
                  <h4>
                    Stage {idx + 1}: {stage.title}
                  </h4>
                  <p><strong>Description:</strong> {stage.description}</p>
                  <p><strong>Prompt:</strong> {stage.promptText}</p>
                  {stage.toolName ? <p><strong>Tool:</strong> {stage.toolName}</p> : null}
                </article>
              ))}
        </section>
      </div>

      <div
        className={`pane-resizer ${resizing ? "active" : ""}`}
        onPointerDown={startResize}
        onDoubleClick={resetPaneWidth}
        role="separator"
        aria-label="Resize detail and media panels"
        aria-orientation="vertical"
      />

      <aside className="panel media-panel">
        <p className="hero-kicker">Media Preview</p>
        {example?.inputImageUrl ? (
          <div>
            <h4>Input Image</h4>
            <img src={withApiBase(example.inputImageUrl)} alt="Workflow input" className="preview-image" />
          </div>
        ) : null}

        {example?.outputVideoUrl ? (
          <div>
            <h4>Output Video</h4>
            <video controls className="preview-video" src={withApiBase(example.outputVideoUrl)} />
          </div>
        ) : null}

        {!example?.inputImageUrl && !example?.outputVideoUrl ? (
          <p className="status-bar">No media attached for this workflow.</p>
        ) : null}
      </aside>
    </section>
  );
};
