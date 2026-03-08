import { CSSProperties, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listMyNotes } from "../lib/api";
import { Note } from "../lib/types";

interface Props {
  token: string;
}

export const DashboardPage = ({ token }: Props) => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    if (!token) return;
    listMyNotes(token).then(setNotes).catch(() => setNotes([]));
  }, [token]);

  const metrics = useMemo(() => {
    const publicCount = notes.filter((n) => n.visibility === "public").length;
    const poolCount = notes.filter((n) => n.visibility === "paid_pool").length;
    return {
      total: notes.length,
      publicCount,
      poolCount
    };
  }, [notes]);

  if (!token) {
    return <div className="panel">Please login first.</div>;
  }

  return (
    <section className="page-enter">
      <div className="stats-grid">
        <div className="panel metric"><span>Total Notes</span><strong>{metrics.total}</strong></div>
        <div className="panel metric"><span>Public</span><strong>{metrics.publicCount}</strong></div>
        <div className="panel metric"><span>Pool</span><strong>{metrics.poolCount}</strong></div>
      </div>

      <div className="grid-wall compact">
        {notes.map((note) => (
          <article
            key={note.id}
            className="workflow-card reveal clickable"
            style={{ "--tone-a": "#53d8ff", "--tone-b": "#1f2b6c" } as CSSProperties}
            onClick={() => navigate(`/workflow/note/${note.id}`)}
          >
            <span className="date-pill">{new Date(note.updatedAt).toLocaleDateString()}</span>
            <div className="card-body">
              <p>{note.summary}</p>
              <h3>{note.title}</h3>
              <div className="meta-row">
                <span>{note.primaryTool}</span>
                <span>{note.visibility}</span>
                <span>{note.difficultyLevel}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
