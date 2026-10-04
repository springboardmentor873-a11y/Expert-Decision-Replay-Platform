import { useState, useEffect, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { ApiError } from "../lib/api";
import "./Login.css";

function FloatingCanvas() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="login-canvas-panel">
      <div className="canvas-content">
        <h2 className="canvas-headline">Every decision, remembered.</h2>
        <p className="canvas-subheadline">
          Build a complete, transparent record of how and why your team moves forward.
        </p>

        <div className={`canvas-animation-area ${mounted ? "mounted" : ""}`}>
          <svg className="canvas-connectors" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <path
              className="connector-line delay-3"
              d="M 80,100 C 150,100 150,220 220,220"
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="2"
              strokeDasharray="6 6"
            />
            <path
              className="connector-line delay-4"
              d="M 80,340 C 150,340 150,220 220,220"
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="2"
              strokeDasharray="6 6"
            />
            <path
              className="connector-line delay-5"
              d="M 220,220 C 290,220 290,160 350,160"
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="2"
              strokeDasharray="6 6"
            />
            <path
              className="connector-line delay-6"
              d="M 220,220 C 290,220 290,280 350,280"
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="2"
              strokeDasharray="6 6"
            />
          </svg>

          {/* Alternative Block */}
          <div className="canvas-block block-alt anim-1" style={{ top: '80px', left: '40px' }}>
            <div className="block-icon bg-slate">A</div>
            <div className="block-text">
              <div className="block-title">Cloud Migration</div>
              <div className="block-meta">High Feasibility</div>
            </div>
          </div>

          {/* Alternative Block 2 */}
          <div className="canvas-block block-alt anim-2" style={{ top: '320px', left: '40px' }}>
            <div className="block-icon bg-slate">B</div>
            <div className="block-text">
              <div className="block-title">On-Prem Upgrade</div>
              <div className="block-meta">Med Cost</div>
            </div>
          </div>

          {/* Decision Block */}
          <div className="canvas-block block-decision anim-3 focal" style={{ top: '200px', left: '180px' }}>
            <div className="block-icon bg-brass">D</div>
            <div className="block-text">
              <div className="block-title">Infrastructure Strategy</div>
              <div className="block-meta badge-review">Under Review</div>
            </div>
          </div>

          {/* Discussion Block */}
          <div className="canvas-block block-comment anim-4" style={{ top: '140px', left: '320px' }}>
            <div className="block-icon bg-blue">JD</div>
            <div className="block-text">
              <div className="block-title">Security concerns?</div>
              <div className="block-meta">Comment</div>
            </div>
          </div>

          {/* Approval Block */}
          <div className="canvas-block block-approval anim-5" style={{ top: '260px', left: '320px' }}>
            <div className="block-icon bg-green">✓</div>
            <div className="block-text">
              <div className="block-title">Approved</div>
              <div className="block-meta">Level 1</div>
            </div>
          </div>

        </div>

        <div className="canvas-trust-cue">
          Trusted by teams to document what matters
        </div>
      </div>
    </div>
  );
}

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to sign in");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-split-page">
      <FloatingCanvas />
      
      <div className="login-form-panel">
        <div className="login-form-wrapper form-enter">
          <div className="login-brand">Decision Replay</div>
          <h1>Welcome back</h1>
          <p className="login-subtitle">Sign in to review, discuss and approve decisions.</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Work email</label>
              <input
                id="email"
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <button className="btn btn-primary btn-full" type="submit" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="auth-switch">
            New here? <Link to="/register">Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
