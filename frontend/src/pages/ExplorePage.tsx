import { CSSProperties, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { bookmark, listWorkflowExamples, searchPublicNotes, withApiBase } from "../lib/api";
import { Note, WorkflowExampleSummary } from "../lib/types";

interface Props {
  token: string;
}

interface CardItem {
  id: string;
  kind: "example" | "note";
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
  ["#edf4ff", "#f8fbff"],
  ["#e8f7ff", "#f4fbff"],
  ["#eff3ff", "#f9fbff"],
  ["#e8f1ff", "#f8fbff"],
  ["#f2f7ff", "#fbfdff"],
  ["#ecf6ff", "#f8fcff"]
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

  const cards = useMemo<{ examples: CardItem[]; notes: CardItem[] }>(() => {
    const q = keyword.trim().toLowerCase();
    const exampleCards: CardItem[] = examples
      .filter((ex) => !q || `${ex.title} ${ex.summary}`.toLowerCase().includes(q))
      .map((ex) => ({
        id: `example-${ex.slug}`,
        kind: "example",
        date: new Date(ex.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        title: ex.title,
        subtitle: ex.summary,
        primaryTool: "Workflow Example",
        difficulty: "guided",
        href: `/workflow/example/${ex.slug}`,
        coverImageUrl: ex.coverImageUrl
      }));

    const noteCards: CardItem[] = notes.map((note) => ({
      id: `note-${note.id}`,
      kind: "note",
      date: new Date(note.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      title: note.title,
      subtitle: note.summary,
      primaryTool: note.primaryTool,
      difficulty: note.difficultyLevel,
      href: `/workflow/note/${note.id}`,
      noteId: note.id
    }));

    return { examples: exampleCards, notes: noteCards };
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
      <div className="hero-block panel hero-surface">
        <p className="hero-kicker">AI Workflow Library</p>
        <h1>Clean Workflow Hub</h1>
        <p>Browse curated examples and community workflows. Open any card to inspect graph, prompts, and media previews.</p>
        <div className="chip-row">
          <span className="chip">Notion-style layout</span>
          <span className="chip">Blue-gray palette</span>
          <span className="chip">Editable workflow stages</span>
        </div>
      </div>

      {busy ? <div className="status-bar">Loading workflows...</div> : null}
      {msg ? <div className="status-bar success">{msg}</div> : null}
      {keyword ? (
        <div className="status-bar">
          Showing results for: <strong>{keyword}</strong>
        </div>
      ) : null}

      <section className="section-block">
        <div className="section-head">
          <h2>Official Examples</h2>
          <p>Built-in sample workflows from local assets.</p>
        </div>
        <div className="grid-wall">
          {cards.examples.map((card, index) => {
            const [toneA, toneB] = toneFor(card.id + card.primaryTool);
            const style = {
              "--tone-a": toneA,
              "--tone-b": toneB,
              animationDelay: `${index * 60}ms`,
              backgroundImage: card.coverImageUrl
                ? `linear-gradient(180deg, rgba(255,255,255,0.65), rgba(255,255,255,0.92)), url('${withApiBase(card.coverImageUrl)}')`
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
                <div className="card-body">
                  <h3>{card.title}</h3>
                  <p>{card.subtitle}</p>
                  <div className="meta-row">
                    <span>{card.primaryTool}</span>
                    <span>{card.difficulty}</span>
                    <span>Open</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section-block">
        <div className="section-head">
          <h2>Community Workflows</h2>
          <p>Public notes published by creators.</p>
        </div>
        {cards.notes.length === 0 ? (
          <div className="panel empty-state">No public notes matched your search yet.</div>
        ) : (
          <div className="grid-wall">
            {cards.notes.map((card, index) => {
              const [toneA, toneB] = toneFor(card.id + card.primaryTool);
              const style = {
                "--tone-a": toneA,
                "--tone-b": toneB,
                animationDelay: `${index * 60}ms`
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
                  <div className="card-body">
                    <h3>{card.title}</h3>
                    <p>{card.subtitle}</p>
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
        )}
      </section>
    </section>
  );
};
