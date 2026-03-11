import { useEffect, useState, type CSSProperties } from "react";

export interface GraphNode {
  id: string;
  label: string;
  kind: "start" | "app" | "end";
  subtitle?: string;
  link?: string;
  imageUrl?: string;
  imageAlt?: string;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  prompt: string;
}

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const trimText = (text: string, max = 58): string => {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
};

export const WorkflowGraph = ({ nodes, edges }: Props) => {
  const [activeEdge, setActiveEdge] = useState<GraphEdge | null>(null);
  const [copyMessage, setCopyMessage] = useState("");
  const [copyImageMessage, setCopyImageMessage] = useState("");
  const [imageBoxWidths, setImageBoxWidths] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!activeEdge) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveEdge(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeEdge]);

  const openPrompt = (edge: GraphEdge) => {
    setCopyMessage("");
    setActiveEdge(edge);
  };

  const copyPrompt = async () => {
    if (!activeEdge) return;
    try {
      await navigator.clipboard.writeText(activeEdge.prompt);
      setCopyMessage("Prompt copied.");
    } catch {
      setCopyMessage("Copy failed. Select text manually.");
    }
  };

  const copyImageUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopyImageMessage("Image URL copied.");
    } catch {
      setCopyImageMessage("Copy URL failed.");
    }
  };

  const syncImageWidth = (nodeId: string, image: HTMLImageElement) => {
    if (!image.naturalWidth || !image.naturalHeight) return;
    const ratio = image.naturalWidth / image.naturalHeight;
    const nextWidth = Math.round(Math.max(92, Math.min(176, ratio * 88)));
    setImageBoxWidths((prev) => {
      if (prev[nodeId] === nextWidth) return prev;
      return { ...prev, [nodeId]: nextWidth };
    });
  };

  return (
    <>
      <section className="workflow-canvas panel">
        <p className="hero-kicker">Visual Workflow</p>
        <div className="workflow-track">
          {nodes.map((node) => {
            const outgoing = edges.find((edge) => edge.from === node.id);
            const imageBoxStyle = imageBoxWidths[node.id]
              ? ({ ["--node-image-width" as string]: `${imageBoxWidths[node.id]}px` } as CSSProperties)
              : undefined;
            return (
              <div className="workflow-link" key={node.id}>
                <article className={`workflow-node ${node.kind} ${node.imageUrl ? "has-image" : ""}`}>
                  <div className="node-main">
                    <span className="node-kind">{node.kind.toUpperCase()}</span>
                    <h4>{node.label}</h4>
                    {node.subtitle ? <p>{node.subtitle}</p> : null}
                    {node.link ? (
                      <a href={node.link} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
                        Open App
                      </a>
                    ) : null}
                  </div>

                  {node.imageUrl ? (
                    <div className="node-image-box" style={imageBoxStyle}>
                      <a href={node.imageUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
                        <img
                          src={node.imageUrl}
                          alt={node.imageAlt ?? `${node.label} output image`}
                          onLoad={(event) => syncImageWidth(node.id, event.currentTarget)}
                        />
                      </a>
                      <button
                        type="button"
                        className="node-copy-url"
                        onClick={(event) => {
                          event.stopPropagation();
                          void copyImageUrl(node.imageUrl!);
                        }}
                      >
                        Copy URL
                      </button>
                    </div>
                  ) : null}
                </article>

                {outgoing ? (
                  <div className="edge-wrap">
                    <button
                      type="button"
                      className="edge-line-btn"
                      onDoubleClick={() => openPrompt(outgoing)}
                      title="Double click to open full prompt"
                    >
                      <span className="edge-line" />
                    </button>
                    <button
                      type="button"
                      className="edge-prompt"
                      onDoubleClick={() => openPrompt(outgoing)}
                      title="Double click to open and copy full prompt"
                    >
                      {trimText(outgoing.prompt)}
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
        {copyImageMessage ? <div className="status-bar success">{copyImageMessage}</div> : null}
      </section>

      {activeEdge ? (
        <div className="prompt-modal-backdrop" onClick={() => setActiveEdge(null)}>
          <div className="prompt-modal panel" onClick={(event) => event.stopPropagation()}>
            <div className="prompt-modal-head">
              <h3>Edge Prompt</h3>
              <button className="secondary" type="button" onClick={() => setActiveEdge(null)}>Close</button>
            </div>
            <p className="muted">You can copy the full prompt below.</p>
            <textarea className="prompt-modal-text" value={activeEdge.prompt} readOnly rows={9} />
            <div className="row">
              <button type="button" onClick={() => void copyPrompt()}>Copy Prompt</button>
              {copyMessage ? <span className="prompt-copy-state">{copyMessage}</span> : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};
