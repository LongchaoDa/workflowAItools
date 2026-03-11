import { useState } from "react";
import { login, register } from "../lib/api";

interface Props {
  onToken: (token: string) => void;
}

export const AuthPage = ({ onToken }: Props) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("workflow_creator");
  const [displayName, setDisplayName] = useState("Workflow Creator");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fillDemo = () => {
    setEmail("demo@workflowbase.ai");
    setPassword("demo123456");
    setSuccess(false);
    setMsg("Demo account filled. Click login.");
  };

  const fillQaAccount = () => {
    setEmail("dalongchao@gmail.com");
    setPassword("dalongchao1");
    setUsername("dalongchao");
    setDisplayName("Dalongchao");
    setSuccess(false);
    setMsg("QA account filled. You can register or login.");
  };

  const submit = async () => {
    setSubmitting(true);
    setMsg("");
    try {
      if (isRegister) {
        const data = await register({ email, username, displayName, password });
        onToken(data.token);
        setMsg("Account created and logged in.");
      } else {
        const data = await login({ email, password });
        onToken(data.token);
        setMsg("Logged in successfully.");
      }
      setSuccess(true);
    } catch (error) {
      setSuccess(false);
      setMsg(error instanceof Error ? error.message : "Authentication failed. Check credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="page-enter form-page">
      <div className="panel left-glow">
        <p className="hero-kicker">Access</p>
        <h2>{isRegister ? "Create account" : "Login"}</h2>
        <p>Use your account to publish notes, manage workflows, and save community recipes.</p>
        <p className="mono">Default demo: demo@workflowbase.ai / demo123456</p>
        <div className="row">
          <button className="secondary" onClick={fillDemo}>Use Demo Account</button>
          <button className="secondary" onClick={fillQaAccount}>Use QA Account</button>
        </div>
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
          <button onClick={submit} disabled={submitting}>{submitting ? "Submitting..." : isRegister ? "Register" : "Login"}</button>
          <button className="secondary" onClick={() => setIsRegister((v) => !v)} disabled={submitting}>
            {isRegister ? "Switch to Login" : "Switch to Register"}
          </button>
        </div>

        {msg ? <div className={`status-bar ${success ? "success" : ""}`}>{msg}</div> : null}
      </div>
    </section>
  );
};
