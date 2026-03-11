import { CSSProperties, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listBookmarks } from "../lib/api";
import { Note } from "../lib/types";

interface Props {
  token: string;
}

export const BookmarksPage = ({ token }: Props) => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    listBookmarks(token)
      .then((data) => {
        setNotes(data);
        setError("");
      })
      .catch((err) => {
        setNotes([]);
        setError(err instanceof Error ? err.message : "Failed to load bookmarks.");
      });
  }, [token]);

  if (!token) {
    return <div className="panel">Please login first.</div>;
  }

  return (
    <section className="page-enter">
      <div className="hero-block compact">
        <p className="hero-kicker">Saved</p>
        <h1>Bookmarks</h1>
        <p>Your favorite workflows from the public community pool.</p>
      </div>

      {error ? <div className="status-bar">{error}</div> : null}
      {notes.length === 0 ? (
        <div className="panel empty-state">No bookmarks yet. Save a public workflow from Explore.</div>
      ) : (
        <div className="grid-wall compact">
          {notes.map((note) => (
            <article
              key={note.id}
              className="workflow-card reveal clickable"
              style={{ "--tone-a": "#ebf2ff", "--tone-b": "#f8fbff" } as CSSProperties}
              onClick={() => navigate(`/workflow/note/${note.id}`)}
            >
              <span className="date-pill">{new Date(note.createdAt).toLocaleDateString()}</span>
              <div className="card-body">
                <h3>{note.title}</h3>
                <p>{note.summary}</p>
                <div className="meta-row">
                  <span>{note.primaryTool}</span>
                  <span>{note.difficultyLevel}</span>
                  <span>{note.visibility}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
