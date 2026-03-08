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

  useEffect(() => {
    if (!token) return;
    listBookmarks(token).then(setNotes).catch(() => setNotes([]));
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

      <div className="grid-wall compact">
        {notes.map((note) => (
          <article
            key={note.id}
            className="workflow-card reveal clickable"
            style={{ "--tone-a": "#8be35f", "--tone-b": "#233a76" } as CSSProperties}
            onClick={() => navigate(`/workflow/note/${note.id}`)}
          >
            <span className="date-pill">{new Date(note.createdAt).toLocaleDateString()}</span>
            <div className="card-body">
              <p>{note.summary}</p>
              <h3>{note.title}</h3>
              <div className="meta-row">
                <span>{note.primaryTool}</span>
                <span>{note.difficultyLevel}</span>
                <span>{note.visibility}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
