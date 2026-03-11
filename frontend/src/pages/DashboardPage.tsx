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
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    listMyNotes(token)
      .then((data) => {
        setNotes(data);
        setError("");
      })
      .catch((err) => {
        setNotes([]);
        setError(err instanceof Error ? err.message : "Failed to load dashboard.");
      });
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
      <div className="hero-block compact">
        <p className="hero-kicker">Workspace</p>
        <h1>Dashboard</h1>
        <p>Track your notes, publish workflow updates, and open details quickly.</p>
      </div>

      <div className="stats-grid">
        <div className="panel metric"><span>Total Notes</span><strong>{metrics.total}</strong></div>
        <div className="panel metric"><span>Public</span><strong>{metrics.publicCount}</strong></div>
        <div className="panel metric"><span>Pool</span><strong>{metrics.poolCount}</strong></div>
      </div>

      {error ? <div className="status-bar">{error}</div> : null}
      {notes.length === 0 ? (
        <div className="panel empty-state">No notes yet. Create your first workflow from the Create page.</div>
      ) : (
        <div className="grid-wall compact">
          {notes.map((note) => (
            <article
              key={note.id}
              className="workflow-card reveal clickable"
              style={{ "--tone-a": "#ebf2ff", "--tone-b": "#f8fbff" } as CSSProperties}
              onClick={() => navigate(`/workflow/note/${note.id}`)}
            >
              <span className="date-pill">{new Date(note.updatedAt).toLocaleDateString()}</span>
              <div className="card-body">
                <h3>{note.title}</h3>
                <p>{note.summary}</p>
                <div className="meta-row">
                  <span>{note.primaryTool}</span>
                  <span>{note.visibility}</span>
                  <span>{note.difficultyLevel}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
