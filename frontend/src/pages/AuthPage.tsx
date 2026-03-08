import { useState } from "react";
import { login, register } from "../lib/api";

interface Props {
  onToken: (token: string) => void;
}

export const AuthPage = ({ onToken }: Props) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("demo@workflowbase.ai");
  const [username, setUsername] = useState("demo_creator");
  const [displayName, setDisplayName] = useState("Workflow Demo");
  const [password, setPassword] = useState("demo123456");
  const [msg, setMsg] = useState("");

  const fillDemo = () => {
    setEmail("demo@workflowbase.ai");
    setPassword("demo123456");
    setMsg("Demo account filled. Click login.");
  };

  const submit = async () => {
    try {
      if (isRegister) {
        const data = await register({ email, username, displayName, password });
        onToken(data.token);
      } else {
        const data = await login({ email, password });
        onToken(data.token);
      }
      setMsg("Authentication successful.");
    } catch {
      setMsg("Authentication failed. Check credentials.");
    }
  };

  return (
    <section className="page-enter form-page">
      <div className="panel left-glow">
        <p className="hero-kicker">Access</p>
        <h2>{isRegister ? "Create account" : "Login"}</h2>
        <p>Use your account to publish notes, manage workflows, and save community recipes.</p>
        <p className="mono">Default demo: demo@workflowbase.ai / demo123456</p>
        <button className="ghost-btn" onClick={fillDemo}>Use Demo Account</button>
      </div>

      <div className="panel">
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>

        {isRegister ? (
          <>
            <label>
              Username
              <input value={username} onChange={(e) => setUsername(e.target.value)} />
            </label>
            <label>
              Display Name
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </label>
          </>
        ) : null}

        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>

        <div className="row">
          <button onClick={submit}>{isRegister ? "Register" : "Login"}</button>
          <button className="secondary" onClick={() => setIsRegister((v) => !v)}>
            {isRegister ? "Switch to Login" : "Switch to Register"}
          </button>
        </div>

        {msg ? <div className="status-bar">{msg}</div> : null}
      </div>
    </section>
  );
};
