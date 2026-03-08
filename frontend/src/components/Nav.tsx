import { FormEvent, useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

interface Props {
  token: string;
  onLogout: () => void;
}

export const Nav = ({ token, onLogout }: Props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [keyword, setKeyword] = useState("");

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);

  useEffect(() => {
    setKeyword(params.get("q") ?? "");
  }, [params]);

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    const q = keyword.trim();
    navigate(q ? `/?q=${encodeURIComponent(q)}` : "/");
  };

  return (
    <header className="topbar-wrap">
      <div className="orb orb-left" />
      <div className="orb orb-right" />
      <div className="topbar">
        <div className="brand-row">
          <button className="ghost-btn" onClick={() => navigate("/")}>
            <span className="brand-mark">◆</span>
            <span className="brand-text">WorkflowBase</span>
          </button>
          <button className="ghost-btn nav-lite" onClick={() => navigate("/")}>☰ Categories</button>
        </div>

        <form className="search-shell" onSubmit={onSearch}>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search workflows, prompts, tools"
          />
          <button type="submit" className="search-go" aria-label="Search">
            ⌕
          </button>
        </form>

        <nav className="main-nav">
          <NavLink to="/">Explore</NavLink>
          <NavLink to="/new">Create</NavLink>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/bookmarks">Saved</NavLink>
          {token ? (
            <button className="logout-btn" onClick={onLogout}>Logout</button>
          ) : (
            <NavLink to="/auth">Login</NavLink>
          )}
          <button className="ghost-btn nav-lite">☷</button>
        </nav>
      </div>
    </header>
  );
};
