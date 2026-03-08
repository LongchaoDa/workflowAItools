import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { GraphEdge, GraphNode, WorkflowGraph } from "../components/WorkflowGraph";
import { getNoteById, getWorkflowExample, withApiBase } from "../lib/api";
import { Note, WorkflowExampleDetail } from "../lib/types";

type SourceKind = "example" | "note";

const trimText = (text: string, max = 95): string => {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
};

interface Props {
  token: string;
}

export const WorkflowDetailPage = ({ token }: Props) => {
  const { source = "", id = "" } = useParams();
  const kind = source as SourceKind;

  const [example, setExample] = useState<WorkflowExampleDetail | null>(null);
  const [note, setNote] = useState<Note | null>(null);
  const [error, setError] = useState("");

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

  const graph = useMemo<{ nodes: GraphNode[]; edges: GraphEdge[] }>(() => {
    if (example) {
      const nodes: GraphNode[] = [
        {
          id: "start",
          kind: "start",
          label: "Start",
          subtitle: trimText(example.startInput)
        },
        ...example.stages.map((stage) => ({
          id: stage.id,
          kind: "app" as const,
          label: stage.name,
          subtitle: stage.type,
          link: stage.link
        })),
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
          label: trimText(example.stages[0].input, 76)
        });

        for (let i = 0; i < example.stages.length - 1; i += 1) {
          const next = example.stages[i + 1];
          edges.push({
            id: `edge-stage-${i}`,
            from: example.stages[i].id,
            to: next.id,
            label: trimText(next.prompt || next.input || "Transition", 76)
          });
        }

        edges.push({
          id: "edge-end",
          from: example.stages[example.stages.length - 1].id,
          to: "end",
          label: trimText(example.stages[example.stages.length - 1].output || "Finalize output", 76)
        });
      }

      return { nodes, edges };
    }

    if (note) {
      const nodes: GraphNode[] = [
        {
          id: "start",
          kind: "start",
          label: "Start",
          subtitle: trimText(note.summary)
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
          label: trimText(note.steps[0].promptText, 76)
        });

        for (let i = 0; i < note.steps.length - 1; i += 1) {
          edges.push({
            id: `edge-note-${i}`,
            from: note.steps[i].id,
            to: note.steps[i + 1].id,
            label: trimText(note.steps[i + 1].promptText, 76)
          });
        }

        edges.push({
          id: "edge-note-end",
          from: note.steps[note.steps.length - 1].id,
          to: "end",
          label: "Export and publish"
        });
      }

      return { nodes, edges };
    }

    return { nodes: [], edges: [] };
  }, [example, note]);

  if (error) {
    return <section className="panel">{error}</section>;
  }

  if (!example && !note) {
    return <section className="panel">Loading workflow detail...</section>;
  }

  return (
    <section className="page-enter detail-layout">
      <div>
        <div className="hero-block compact">
          <p className="hero-kicker">Workflow Detail</p>
          <h1>{example?.title ?? note?.title}</h1>
          <p>{example?.summary ?? note?.summary}</p>
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
                  <p><strong>Type:</strong> {stage.type}</p>
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
