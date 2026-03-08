export interface GraphNode {
  id: string;
  label: string;
  kind: "start" | "app" | "end";
  subtitle?: string;
  link?: string;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  label: string;
}

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export const WorkflowGraph = ({ nodes, edges }: Props) => {
  return (
    <section className="workflow-canvas panel">
      <p className="hero-kicker">Visual Workflow</p>
      <div className="workflow-track">
        {nodes.map((node, index) => {
          const outgoing = edges.find((edge) => edge.from === node.id);
          return (
            <div className="workflow-link" key={node.id}>
              <article className={`workflow-node ${node.kind} ${index % 2 ? "down" : "up"}`}>
                <span className="node-kind">{node.kind.toUpperCase()}</span>
                <h4>{node.label}</h4>
                {node.subtitle ? <p>{node.subtitle}</p> : null}
                {node.link ? (
                  <a href={node.link} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
                    Open App
                  </a>
                ) : null}
              </article>

              {outgoing ? (
                <div className="edge-wrap">
                  <div className="edge-line" />
                  <span>{outgoing.label}</span>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
};
