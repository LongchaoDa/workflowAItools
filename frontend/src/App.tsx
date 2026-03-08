import { useMemo, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Nav } from "./components/Nav";
import { ExplorePage } from "./pages/ExplorePage";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { NewNotePage } from "./pages/NewNotePage";
import { BookmarksPage } from "./pages/BookmarksPage";
import { WorkflowDetailPage } from "./pages/WorkflowDetailPage";

const TOKEN_KEY = "aiwf_token";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) ?? "");

  const actions = useMemo(
    () => ({
      onToken: (next: string) => {
        localStorage.setItem(TOKEN_KEY, next);
        setToken(next);
      },
      onLogout: () => {
        localStorage.removeItem(TOKEN_KEY);
        setToken("");
      }
    }),
    []
  );

  return (
    <BrowserRouter>
      <div className="app-shell">
        <Nav token={token} onLogout={actions.onLogout} />
        <main className="content-shell">
          <Routes>
            <Route path="/" element={<ExplorePage token={token} />} />
            <Route path="/auth" element={<AuthPage onToken={actions.onToken} />} />
            <Route path="/dashboard" element={<DashboardPage token={token} />} />
            <Route path="/new" element={<NewNotePage token={token} />} />
            <Route path="/bookmarks" element={<BookmarksPage token={token} />} />
            <Route path="/workflow/:source/:id" element={<WorkflowDetailPage token={token} />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
