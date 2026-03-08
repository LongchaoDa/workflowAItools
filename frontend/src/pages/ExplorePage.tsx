import { CSSProperties, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { bookmark, listWorkflowExamples, searchPublicNotes, withApiBase } from "../lib/api";
import { Note, WorkflowExampleSummary } from "../lib/types";

interface Props {
  token: string;
}

interface CardItem {
  id: string;
  date: string;
  title: string;
  subtitle: string;
  primaryTool: string;
  difficulty: string;
  href: string;
  coverImageUrl?: string;
  noteId?: string;
}

const palette = [
  ["#ff8a5b", "#472466"],
  ["#49d8ba", "#1f3f86"],
  ["#61a7ff", "#252e73"],
  ["#fd5d74", "#3b1c58"],
  ["#8ce969", "#20456d"],
  ["#ffbc52", "#6a2d50"]
];

const toneFor = (seed: string): [string, string] => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length] as [string, string];
};

export const ExplorePage = ({ token }: Props) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [notes, setNotes] = useState<Note[]>([]);
  const [examples, setExamples] = useState<WorkflowExampleSummary[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const keyword = searchParams.get("q") ?? "";

  useEffect(() => {
    const load = async () => {
      setBusy(true);
      try {
        const [noteData, exampleData] = await Promise.all([searchPublicNotes(keyword), listWorkflowExamples()]);
        setNotes(noteData);
        setExamples(exampleData);
      } catch {
        setNotes([]);
        setExamples([]);
      } finally {
        setBusy(false);
      }
    };

    void load();
  }, [keyword]);

  const cards = useMemo<CardItem[]>(() => {
    const q = keyword.trim().toLowerCase();
    const exampleCards = examples
      .filter((ex) => !q || `${ex.title} ${ex.summary}`.toLowerCase().includes(q))
      .map((ex) => ({
        id: `example-${ex.slug}`,
        date: new Date(ex.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        title: ex.title,
        subtitle: ex.summary,
        primaryTool: "Workflow Example",
        difficulty: "guided",
        href: `/workflow/example/${ex.slug}`,
        coverImageUrl: ex.coverImageUrl
      }));

    const noteCards = notes.map((note) => ({
      id: `note-${note.id}`,
      date: new Date(note.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      title: note.title,
      subtitle: note.summary,
      primaryTool: note.primaryTool,
      difficulty: note.difficultyLevel,
      href: `/workflow/note/${note.id}`,
      noteId: note.id
    }));

    return [...exampleCards, ...noteCards];
  }, [examples, notes]);

  const saveCard = async (noteId: string) => {
    if (!token) {
      setMsg("Please login first to save workflows.");
      return;
    }

    try {
      await bookmark(token, noteId);
      setMsg("Saved to your bookmarks.");
    } catch {
      setMsg("Failed to save this workflow.");
    }
  };

  return (
    <section className="page-enter">
      <div className="hero-block">
        <p className="hero-kicker">AI Workflow Library</p>
        <h1>Blog</h1>
        <p>Click any card to open full workflow graph with nodes, edge prompts, and media previews.</p>
      </div>

      {busy ? <div className="status-bar">Loading workflows...</div> : null}
      {msg ? <div className="status-bar success">{msg}</div> : null}
      {keyword ? (
        <div className="status-bar">
          Showing results for: <strong>{keyword}</strong>
        </div>
      ) : null}

      <div className="grid-wall">
        {cards.map((card, index) => {
          const [toneA, toneB] = toneFor(card.id + card.primaryTool);
          const style = {
            "--tone-a": toneA,
            "--tone-b": toneB,
            animationDelay: `${index * 60}ms`,
            backgroundImage: card.coverImageUrl
              ? `linear-gradient(180deg, rgba(8,12,34,0.2), rgba(8,12,34,0.85)), url('${withApiBase(card.coverImageUrl)}')`
              : undefined,
            backgroundSize: card.coverImageUrl ? "cover" : undefined,
            backgroundPosition: card.coverImageUrl ? "center" : undefined
          } as CSSProperties;

          return (
            <article
              key={card.id}
              className="workflow-card reveal clickable"
              style={style}
              onClick={() => navigate(card.href)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter") navigate(card.href);
              }}
            >
              <span className="date-pill">{card.date}</span>
              <div className="scanline" />
              <div className="card-body">
                <p>{card.subtitle}</p>
                <h3>{card.title}</h3>
                <div className="meta-row">
                  <span>{card.primaryTool}</span>
                  <span>{card.difficulty}</span>
                  {card.noteId ? (
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        void saveCard(card.noteId!);
                      }}
                    >
                      Save
                    </button>
                  ) : (
                    <span>Open</span>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
